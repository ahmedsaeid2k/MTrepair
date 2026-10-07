/* ============================================================
   محرك كشوفات الحسابات التفصيلية للعملاء والموردين
   ============================================================ */

function openCustomerStatementModal(custName, custPhone){
  const cTitle = (state.customers || []).find(c => extractCustomerName(c).toLowerCase() === custName.toLowerCase())?.title || '';
  const cPhone = custPhone || (state.customers || []).find(c => extractCustomerName(c).toLowerCase() === custName.toLowerCase())?.phone || '';

  const transactions = [];

  // 1. Receipts
  (state.receipts || []).forEach(r => {
    const rName = extractCustomerName(r);
    const rPhone = extractCustomerPhone(r);
    const isMatch = (rName && rName.toLowerCase() === custName.toLowerCase()) || (cPhone && rPhone === cPhone);
    if(isMatch){
      const totalDue = (typeof getReceiptTotalDue === 'function') ? getReceiptTotalDue(r) : (Number(r.cost || 0) + Number(r.partsCost || 0) + Number(r.otherAccountAmount || 0));
      const dep = Number(r.deposit || 0);
      const devStr = `${r.device?.category||''} ${r.device?.brand||''} ${r.device?.model||''}`.trim();
      const faultStr = (Array.isArray(r.faults) && r.faults.length) ? r.faults.join('، ') : (r.faultNotes || 'صيانة');

      transactions.push({
        date: cleanDate(r.date) || r.date || '2026-01-01',
        type: 'صيانة (أمر شغل)',
        icon: getSvgIcon('tool', 14),
        ref: '#' + (r.receiptNumber || r.id),
        desc: `استلام وصيانة جهاز: ${devStr} (${faultStr})`,
        debit: totalDue,
        credit: 0
      });

      const hasDepositInPayments = (state.payments || []).some(p => 
        (String(p.ReceiptID) === String(r.id) || String(p.ReceiptID) === String(r.receiptNumber)) &&
        (String(p.Note || '').includes('عربون') || String(p.Note || '').includes('مقدم') || Number(p.Amount) === dep)
      );
      if(dep > 0 && !hasDepositInPayments){
        transactions.push({
          date: cleanDate(r.date) || r.date || '2026-01-01',
          type: 'عربون استلام',
          icon: getSvgIcon('creditCard', 14),
          ref: '#' + (r.receiptNumber || r.id),
          desc: `عربون مدفوع عند استلام الجهاز (${r.depositPaymentMethod || 'نقدي'})`,
          debit: 0,
          credit: dep
        });
      }

      if(Number(r.refunded || 0) > 0){
        transactions.push({
          date: cleanDate(r.updatedAt || r.date) || r.date || '2026-01-01',
          type: 'استرداد مبالغ صيانة',
          icon: '↩️',
          ref: '#' + (r.receiptNumber || r.id),
          desc: `مبلغ مسترد للعميل عن إيصال صيانة #${r.receiptNumber || r.id}`,
          debit: Number(r.refunded),
          credit: 0
        });
      }
    }
  });

  // 2. Receipt Payments
  (state.payments || []).forEach(p => {
    const linkedReceipt = (state.receipts || []).find(r => String(r.id) === String(p.ReceiptID) || String(r.receiptNumber) === String(p.ReceiptID));
    if(linkedReceipt){
      const rName = extractCustomerName(linkedReceipt);
      const rPhone = extractCustomerPhone(linkedReceipt);
      const isMatch = (rName && rName.toLowerCase() === custName.toLowerCase()) || (cPhone && rPhone === cPhone);
      if(isMatch){
        transactions.push({
          date: cleanDate(p.Date) || p.Date || '2026-01-01',
          type: 'سداد دفعة صيانة',
          icon: getSvgIcon('wallet', 14),
          ref: '#' + (linkedReceipt.receiptNumber || p.ReceiptID),
          desc: `سداد دفعة: ${p.Note || 'تسوية حساب'} [${p.PaymentMethod || 'نقدي'}]`,
          debit: 0,
          credit: Number(p.Amount || 0)
        });
      }
    }
  });

  // 3. POS Sales
  (state.sales || []).forEach(s => {
    const sName = String(s.CustomerName || '').trim().toLowerCase();
    const sPhone = String(s.CustomerPhone || '').trim();
    const isMatch = (sName && sName === custName.toLowerCase()) || (cPhone && sPhone === cPhone);
    if(isMatch){
      const tot = Number(s.Total || 0);
      const paid = Number(s.AmountPaid != null ? s.AmountPaid : tot);

      transactions.push({
        date: cleanDate(s.Date) || s.Date || '2026-01-01',
        type: 'مبيعات POS',
        icon: getSvgIcon('pos', 14),
        ref: '#' + String(s.ID).slice(-8),
        desc: `فاتورة مبيعات: ${s.ItemsSummary} [${s.PaymentMethod || 'نقدي'}]`,
        debit: tot,
        credit: paid
      });

      if(s.IsReturned){
        const retDetails = s.ReturnDetails || {};
        const retAmt = Number(retDetails.totalRefund != null ? retDetails.totalRefund : tot);
        const retMethod = retDetails.refundMethod || s.PaymentMethod || 'نقدي';

        transactions.push({
          date: cleanDate(retDetails.returnDate || s.Date) || s.Date || '2026-01-01',
          type: 'مرتجع مبيعات POS',
          icon: '↩️',
          ref: retDetails.voucherNumber || ('#' + String(s.ID).slice(-8) + '-RET'),
          desc: `مرتجع أصناف مبيعات (${retDetails.reason || 'إرجاع فاتورة'})`,
          debit: 0,
          credit: retAmt
        });

        const isDebtSettlementOnly = (retMethod.includes('آجل') || retMethod.includes('حساب'));
        if(!isDebtSettlementOnly && paid > 0){
          transactions.push({
            date: cleanDate(retDetails.returnDate || s.Date) || s.Date || '2026-01-01',
            type: 'استرداد نقدي لمرتجع',
            icon: getSvgIcon('creditCard', 14),
            ref: retDetails.voucherNumber || ('#' + String(s.ID).slice(-8) + '-RET'),
            desc: `استرداد مبلغ المرتجع للعميل عبر [${retMethod}]`,
            debit: Math.min(paid, retAmt),
            credit: 0
          });
        }
      }
    }
  });

  // 4. Invoices
  (state.invoices || []).forEach(inv => {
    if(inv.ReferenceType !== 'Receipt' && inv.ReferenceType !== 'POS_Sale'){
      const invName = String(inv.CustomerName || '').trim().toLowerCase();
      const invPhone = String(inv.CustomerPhone || '').trim();
      const isMatch = (invName && invName === custName.toLowerCase()) || (cPhone && invPhone === cPhone);
      if(isMatch){
        transactions.push({
          date: cleanDate(inv.Date) || inv.Date || '2026-01-01',
          type: 'فاتورة رسمية',
          icon: getSvgIcon('invoices', 14),
          ref: inv.InvoiceNumber || '#' + String(inv.ID).slice(-8),
          desc: `فاتورة: ${inv.ItemsSummary || 'خدمات ومنتجات'}`,
          debit: Number(inv.Total || 0),
          credit: Number(inv.AmountPaid || 0)
        });
      }
    }
  });

  // 5. Quotations & Projects (F8)
  (state.quotations || []).forEach(q => {
    const qName = String(q.CustomerName || '').trim().toLowerCase();
    const qPhone = String(q.CustomerPhone || '').trim();
    const isMatch = (qName && qName === custName.toLowerCase()) || (cPhone && qPhone === cPhone);
    const isExecuted = ['تم التنفيذ والتسليم', 'مكتمل', 'موافق عليه'].includes(String(q.Status || '').trim());
    if(isMatch && isExecuted){
      const tot = Number(q.Total || 0);
      const paid = Number(q.AmountPaid != null ? q.AmountPaid : (q.Deposit != null ? q.Deposit : 0));
      transactions.push({
        date: cleanDate(q.Date) || q.Date || '2026-01-01',
        type: 'عرض سعر / مقايسة معتمدة',
        icon: getSvgIcon('fileText', 14),
        ref: '#' + (q.QuotationNumber || q.ID),
        desc: `مشروع / مقايسة: ${q.Title || q.Subject || 'تنفيذ توريد وتركيب'} [${q.Status}]`,
        debit: tot,
        credit: paid
      });
    }
  });

  transactions.sort((a,b) => String(a.date).localeCompare(String(b.date)));

  let running = 0;
  let totalDebit = 0;
  let totalCredit = 0;
  transactions.forEach(t => {
    totalDebit += t.debit;
    totalCredit += t.credit;
    running = running + t.debit - t.credit;
    t.balance = running;
  });

  const statementData = {
    custName, custPhone, cTitle,
    transactions,
    totalDebit, totalCredit,
    netBalance: running
  };

  renderCustomerStatementModalView(statementData);
}

function renderCustomerStatementModalView(data){
  const prevModal = document.getElementById('custStatementModalOverlay');
  if(prevModal) prevModal.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'custStatementModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:12000;display:flex;align-items:center;justify-content:center;padding:16px;';

  const remColor = data.netBalance > 0 ? '#dc2626' : (data.netBalance === 0 ? '#16a34a' : '#2563eb');
  const remLabel = data.netBalance > 0 ? 'متبقي مستحق على العميل' : (data.netBalance === 0 ? 'الحساب خالص (0 ج.م)' : 'رصيد دائن مسبق للعميل');

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,0.3);width:100%;max-width:820px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;border:1px solid #cbd5e1;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1e293b,#0f172a);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="badge" style="background:#0284c7;color:#fff;font-weight:800;font-size:12px;padding:3px 8px;border-radius:6px;">كشف حساب عميل</span>
            <h3 style="margin:0;font-size:17px;font-weight:900;">${escapeHtml(data.custName)}</h3>
          </div>
          <div style="font-size:11.5px;color:#94a3b8;margin-top:4px;">
            ${data.cTitle ? `<span style="background:rgba(255,255,255,0.1);padding:1px 6px;border-radius:4px;">${escapeHtml(data.cTitle)}</span>` : ''}
            ${data.custPhone ? `<span class="mono" style="margin-right:6px;">${escapeHtml(data.custPhone)}</span>` : '<span style="color:#f59e0b;margin-right:6px;">بدون هاتف</span>'}
            <span>• ${data.transactions.length} حركة مسجلة</span>
          </div>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" id="closeCustStatementBtn" style="color:#fff;font-size:18px;" aria-label="إغلاق">&times;</button>
      </div>

      <!-- Quick KPI Balance Cards -->
      <div style="padding:14px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:grid;grid-template-columns:1fr 1fr 1.2fr;gap:12px;">
        <div class="card" style="padding:10px 14px;margin:0;border-right:3.5px solid #0284c7;">
          <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">إجمالي التعاملات والمسحوبات</div>
          <div class="num mono font-bold" style="font-size:16px;margin-top:2px;">${data.totalDebit.toLocaleString()} ج.م</div>
        </div>
        <div class="card" style="padding:10px 14px;margin:0;border-right:3.5px solid #16a34a;">
          <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">إجمالي المدفوعات المسددة</div>
          <div class="num mono font-bold" style="font-size:16px;margin-top:2px;color:#16a34a;">${data.totalCredit.toLocaleString()} ج.م</div>
        </div>
        <div class="card" style="padding:10px 14px;margin:0;border-right:3.5px solid ${remColor};">
          <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">${remLabel}</div>
          <div class="num mono font-bold" style="font-size:18px;margin-top:2px;color:${remColor};">${Math.abs(data.netBalance).toLocaleString()} ج.م</div>
        </div>
      </div>

      <!-- Table Body -->
      <div style="padding:14px 20px;overflow-y:auto;flex:1;">
        ${data.transactions.length === 0 ? `
          <div class="empty" style="padding:40px;text-align:center;">لا توجد أي معاملات أو حركات مسجلة لهذا العميل حتى الآن.</div>
        ` : `
          <div class="table-wrap" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <thead style="background:#f1f5f9;border-bottom:1.5px solid #cbd5e1;">
                <tr>
                  <th style="padding:8px 10px;text-align:right;">التاريخ</th>
                  <th style="padding:8px 10px;text-align:right;">المعاملة والبيان</th>
                  <th style="padding:8px;text-align:center;">المرجع</th>
                  <th style="padding:8px;text-align:center;color:#0284c7;">مدين (عليه)</th>
                  <th style="padding:8px;text-align:center;color:#16a34a;">دائن (مسدد)</th>
                  <th style="padding:8px;text-align:center;font-weight:800;">الرصيد التراكمي</th>
                </tr>
              </thead>
              <tbody>
                ${data.transactions.map((t, idx) => `
                  <tr style="border-bottom:1px solid #f1f5f9;background:${idx%2===0?'#fff':'#fafafa'};">
                    <td style="padding:7px 10px;white-space:nowrap;" class="mono">${cleanDate(t.date)}</td>
                    <td style="padding:7px 10px;">
                      <div style="font-weight:700;color:#0f172a;">${t.icon} ${escapeHtml(t.type)}</div>
                      <div style="font-size:11px;color:#64748b;margin-top:1px;">${escapeHtml(t.desc)}</div>
                    </td>
                    <td style="padding:7px;text-align:center;" class="mono">${escapeHtml(t.ref)}</td>
                    <td style="padding:7px;text-align:center;" class="mono font-bold">${t.debit > 0 ? t.debit.toLocaleString() + ' ج.م' : '-'}</td>
                    <td style="padding:7px;text-align:center;color:#16a34a;" class="mono font-bold">${t.credit > 0 ? t.credit.toLocaleString() + ' ج.م' : '-'}</td>
                    <td style="padding:7px;text-align:center;font-weight:900;color:${t.balance>0?'#dc2626':(t.balance===0?'#16a34a':'#2563eb')};" class="mono">
                      ${t.balance.toLocaleString()} ج.م
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Footer Buttons -->
      <div style="background:#f1f5f9;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #cbd5e1;flex-wrap:wrap;gap:8px;">
        <button type="button" class="btn btn-ghost btn-sm" id="cancelCustStatementBtn">إغلاق</button>
        <div style="display:flex;gap:8px;">
          ${data.custPhone && data.custPhone !== '0000000000' ? `
            <button type="button" class="btn btn-green btn-sm font-bold" id="waCustStatementBtn">
              ${getSvgIcon("message", 14)} إرسال كشف الحساب عبر WhatsApp
            </button>
          ` : ''}
          <button type="button" class="btn btn-primary btn-sm font-bold" id="printCustStatementBtn">
            ${getSvgIcon("printer", 14)} طباعة كشف حساب رسمي A4
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#closeCustStatementBtn').onclick = () => overlay.remove();
  overlay.querySelector('#cancelCustStatementBtn').onclick = () => overlay.remove();

  const printBtn = overlay.querySelector('#printCustStatementBtn');
  if(printBtn) printBtn.onclick = () => openCustomerStatementPrint(data);

  const waBtn = overlay.querySelector('#waCustStatementBtn');
  if(waBtn) waBtn.onclick = () => shareCustomerStatementWhatsApp(data);
}

function openCustomerStatementPrint(data){
  const mount = document.createElement('div');
  mount.id = 'printCustomerStatementMount';
  mount.className = 'print-mount-a4';
  const companyName = (state.settings && state.settings.companyName) || 'ميكروERP';

  mount.innerHTML = `
    <style>
      @media print {
        body * { visibility: hidden !important; }
        #printCustomerStatementMount, #printCustomerStatementMount * { visibility: visible !important; }
        #printCustomerStatementMount {
          position: fixed; left: 0; top: 0; width: 100%; height: auto;
          background: #fff; padding: 24px; font-family: system-ui, -apple-system, sans-serif;
          color: #000; direction: rtl; z-index: 999999;
        }
      }
    </style>
    <div style="max-width:800px;margin:0 auto;padding:20px;border:1px solid #cbd5e1;border-radius:8px;">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:16px;">
        <div>
          <h2 style="margin:0;font-size:20px;font-weight:900;color:#0f172a;">${escapeHtml(companyName)}</h2>
          <div style="font-size:12px;color:#475569;margin-top:3px;">كشف حساب تفصيلي للعميل</div>
        </div>
        <div style="text-align:left;">
          <div style="background:#0284c7;color:#fff;font-size:13px;font-weight:900;padding:4px 14px;border-radius:4px;display:inline-block;">
            كشف حساب مالي
          </div>
          <div style="font-size:11px;color:#64748b;margin-top:4px;">تاريخ التقرير: <b>${new Date().toISOString().slice(0,10)}</b></div>
        </div>
      </div>

      <!-- Customer Info Card -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px 16px;border-radius:6px;margin-bottom:16px;font-size:12.5px;display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px;">
        <div>اسم العميل: <b>${escapeHtml(data.cTitle ? data.cTitle + ' / ' + data.custName : data.custName)}</b></div>
        <div>الهاتف: <b class="mono" style="direction:ltr;">${escapeHtml(data.custPhone || '-')}</b></div>
        <div style="text-align:left;">الرصيد النهائي: <b class="mono" style="font-size:14px;color:${data.netBalance>0?'#dc2626':'#16a34a'};">${data.netBalance.toLocaleString()} ج.م</b></div>
      </div>

      <!-- Table -->
      <table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-bottom:16px;">
        <thead>
          <tr style="background:#0f172a;color:#fff;">
            <th style="padding:6px 8px;text-align:right;">التاريخ</th>
            <th style="padding:6px 8px;text-align:right;">المعاملة والبيان</th>
            <th style="padding:6px;text-align:center;">المرجع</th>
            <th style="padding:6px;text-align:center;">مدين (ج.م)</th>
            <th style="padding:6px;text-align:center;">دائن (ج.م)</th>
            <th style="padding:6px;text-align:center;">الرصيد التراكمي</th>
          </tr>
        </thead>
        <tbody>
          ${data.transactions.map((t, idx) => `
            <tr style="border-bottom:1px solid #e2e8f0;background:${idx%2===0?'#fff':'#f8fafc'};">
              <td style="padding:6px 8px;" class="mono">${cleanDate(t.date)}</td>
              <td style="padding:6px 8px;"><b>${escapeHtml(t.type)}</b> - ${escapeHtml(t.desc)}</td>
              <td style="padding:6px;text-align:center;" class="mono">${escapeHtml(t.ref)}</td>
              <td style="padding:6px;text-align:center;" class="mono">${t.debit > 0 ? t.debit.toLocaleString() : '-'}</td>
              <td style="padding:6px;text-align:center;" class="mono">${t.credit > 0 ? t.credit.toLocaleString() : '-'}</td>
              <td style="padding:6px;text-align:center;font-weight:bold;" class="mono">${t.balance.toLocaleString()} ج.م</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background:#f1f5f9;font-weight:900;border-top:2px solid #0f172a;">
            <td colspan="3" style="padding:8px;">الإجمالي العام</td>
            <td style="padding:8px;text-align:center;" class="mono">${data.totalDebit.toLocaleString()} ج.م</td>
            <td style="padding:8px;text-align:center;" class="mono">${data.totalCredit.toLocaleString()} ج.م</td>
            <td style="padding:8px;text-align:center;color:${data.netBalance>0?'#dc2626':'#16a34a'};" class="mono">${data.netBalance.toLocaleString()} ج.م</td>
          </tr>
        </tfoot>
      </table>

      <!-- Signatures -->
      <div style="display:flex;justify-content:space-between;margin-top:28px;padding-top:10px;border-top:1px dashed #cbd5e1;font-size:11px;color:#475569;">
        <div style="text-align:center;width:40%;">
          <div>توقيع وتأكيد الحسابات</div>
          <div style="margin-top:28px;border-bottom:1px dashed #94a3b8;width:80%;margin-left:auto;margin-right:auto;"></div>
        </div>
        <div style="text-align:center;width:40%;">
          <div>توقيع المستلم / العميل</div>
          <div style="margin-top:28px;border-bottom:1px dashed #94a3b8;width:80%;margin-left:auto;margin-right:auto;"></div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(mount);
  setTimeout(()=>{
    window.print();
    setTimeout(()=>{ mount.remove(); }, 1000);
  }, 100);
}

function shareCustomerStatementWhatsApp(data){
  if(!data.custPhone || data.custPhone === '0000000000'){
    showToast('رقم هاتف العميل غير متوفر للمشاركة عبر واتساب', 'error');
    return;
  }
  const statusStr = data.netBalance > 0 ? `الرصيد المتبقي المستحق: ${data.netBalance.toLocaleString()} ج.م` : (data.netBalance === 0 ? 'الحساب خالص بالكامل (0 ج.م)' : `رصيد دائن مسبق لكم: ${Math.abs(data.netBalance).toLocaleString()} ج.م`);

  let text = `مرحباً ${data.custName} المحترم،\nتحية طيبة من مركز الصيانة\n\n*ملخص كشف الحساب المالي حتى تاريخ ${new Date().toISOString().slice(0,10)}:*\n` +
    `• إجمالي المعاملات والخدمات: ${data.totalDebit.toLocaleString()} ج.م\n` +
    `• إجمالي المبالغ المسددة: ${data.totalCredit.toLocaleString()} ج.م\n` +
    `--------------------------\n` +
    `*${statusStr}*\n` +
    `--------------------------\n` +
    `آخر المعاملات المسجلة:\n`;

  const recent = data.transactions.slice(-5);
  recent.forEach(t => {
    text += `▫️ ${t.date} | ${t.type} | مدين: ${t.debit.toLocaleString()} | مسدد: ${t.credit.toLocaleString()}\n`;
  });
  text += `\nشاكرين لتعاملكم ونسعد دائماً بخدمتكم`;

  const url = buildWaUrl(data.custPhone, text, getWaCountryCode());
  if(!url){ showToast('رقم هاتف العميل غير صالح لإرسال واتساب', 'error'); return; }
  openWhatsappChat(data.custPhone, text, {
    receiptId: 'statement:customer:' + String(data.custPhone),
    key: 'statement',
    label: 'كشف حساب عميل',
    auditDetails: `تم إرسال كشف حساب العميل (${data.custName || ''}) عبر واتساب`
  });
}

/* ---------------- Supplier Statement Modal & Views ---------------- */
function openSupplierStatementModal(supName){
  const sup = (state.suppliers || []).find(s => (s.Name||'').trim().toLowerCase() === supName.trim().toLowerCase()) || { Name: supName };
  const transactions = [];

  // 1. Purchases
  (state.purchases || []).forEach(p => {
    if((p.Supplier||'').trim().toLowerCase() === supName.trim().toLowerCase()){
      const tot = Number(p.Total || 0);
      const paid = Number(p.AmountPaid != null ? p.AmountPaid : tot);
      transactions.push({
        date: cleanDate(p.Date) || p.Date || '2026-01-01',
        type: 'فاتورة شراء وتوريد',
        icon: getSvgIcon('download', 14),
        ref: '#' + String(p.ID).slice(-8),
        desc: `توريد مخزون: ${p.ItemsSummary} [${p.PaymentMethod || 'نقدي'}]`,
        credit: tot,
        debit: paid
      });
    }
  });

  // 2. Supplier Expenses / Vouchers
  (state.expenses || []).forEach(exp => {
    const isSupplier = (exp.Supplier && exp.Supplier.trim().toLowerCase() === supName.trim().toLowerCase()) ||
                       (exp.Category === 'سداد موردين ومشتريات' && exp.Title.toLowerCase().includes(supName.toLowerCase()));
    if(isSupplier){
      const amt = Number(exp.Amount || 0);
      transactions.push({
        date: cleanDate(exp.Date) || exp.Date || '2026-01-01',
        type: 'سند صرف وسداد',
        icon: getSvgIcon('wallet', 14),
        ref: exp.Reference || '#' + String(exp.ID).slice(-8),
        desc: `سداد للمورد: ${exp.Notes || exp.Title} [${exp.PaymentMethod || 'نقدي'}]`,
        credit: 0,
        debit: amt
      });
    }
  });

  transactions.sort((a,b) => String(a.date).localeCompare(String(b.date)));

  let running = 0;
  let totalPurchases = 0;
  let totalPaid = 0;
  transactions.forEach(t => {
    totalPurchases += t.credit;
    totalPaid += t.debit;
    running = running + t.credit - t.debit;
    t.balance = running;
  });

  const statementData = {
    supName, supPhone: sup.Phone || sup.phone || '',
    transactions,
    totalPurchases, totalPaid,
    netBalance: running
  };

  renderSupplierStatementModalView(statementData);
}

function renderSupplierStatementModalView(data){
  const prevModal = document.getElementById('supStatementModalOverlay');
  if(prevModal) prevModal.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'supStatementModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:12000;display:flex;align-items:center;justify-content:center;padding:16px;';

  const remColor = data.netBalance > 0 ? '#dc2626' : (data.netBalance === 0 ? '#16a34a' : '#2563eb');
  const remLabel = data.netBalance > 0 ? 'مستحق للمورد طرفنا' : (data.netBalance === 0 ? 'الحساب خالص (0 ج.م)' : 'رصيد دائن مدفوع مقدماً للمورد');

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,0.3);width:100%;max-width:820px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;border:1px solid #cbd5e1;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1e293b,#0f172a);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="badge" style="background:#7c3aed;color:#fff;font-weight:800;font-size:12px;padding:3px 8px;border-radius:6px;">كشف حساب مورد</span>
            <h3 style="margin:0;font-size:17px;font-weight:900;">${escapeHtml(data.supName)}</h3>
          </div>
          <div style="font-size:11.5px;color:#94a3b8;margin-top:4px;">
            ${data.supPhone ? `<span class="mono" style="margin-right:6px;">${escapeHtml(data.supPhone)}</span>` : '<span style="color:#f59e0b;margin-right:6px;">بدون هاتف</span>'}
            <span>• ${data.transactions.length} حركة مسجلة</span>
          </div>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" id="closeSupStatementBtn" style="color:#fff;font-size:18px;" aria-label="إغلاق">&times;</button>
      </div>

      <!-- Quick KPI Balance Cards -->
      <div style="padding:14px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:grid;grid-template-columns:1fr 1fr 1.2fr;gap:12px;">
        <div class="card" style="padding:10px 14px;margin:0;border-right:3.5px solid #7c3aed;">
          <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">إجمالي التوريدات والمشتريات</div>
          <div class="num mono font-bold" style="font-size:16px;margin-top:2px;">${data.totalPurchases.toLocaleString()} ج.م</div>
        </div>
        <div class="card" style="padding:10px 14px;margin:0;border-right:3.5px solid #16a34a;">
          <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">إجمالي المسدد للمورد (سندات صرف)</div>
          <div class="num mono font-bold" style="font-size:16px;margin-top:2px;color:#16a34a;">${data.totalPaid.toLocaleString()} ج.م</div>
        </div>
        <div class="card" style="padding:10px 14px;margin:0;border-right:3.5px solid ${remColor};">
          <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">${remLabel}</div>
          <div class="num mono font-bold" style="font-size:18px;margin-top:2px;color:${remColor};">${Math.abs(data.netBalance).toLocaleString()} ج.م</div>
        </div>
      </div>

      <!-- Table Body -->
      <div style="padding:14px 20px;overflow-y:auto;flex:1;">
        ${data.transactions.length === 0 ? `
          <div class="empty" style="padding:40px;text-align:center;">لا توجد أي فواتير شراء أو سندات صرف مسجلة لهذا المورد.</div>
        ` : `
          <div class="table-wrap" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <thead style="background:#f1f5f9;border-bottom:1.5px solid #cbd5e1;">
                <tr>
                  <th style="padding:8px 10px;text-align:right;">التاريخ</th>
                  <th style="padding:8px 10px;text-align:right;">المعاملة والبيان</th>
                  <th style="padding:8px;text-align:center;">المرجع</th>
                  <th style="padding:8px;text-align:center;color:#7c3aed;">فاتورة توريد (له)</th>
                  <th style="padding:8px;text-align:center;color:#16a34a;">سداد مصروف (منه)</th>
                  <th style="padding:8px;text-align:center;font-weight:800;">الرصيد المستحق</th>
                </tr>
              </thead>
              <tbody>
                ${data.transactions.map((t, idx) => `
                  <tr style="border-bottom:1px solid #f1f5f9;background:${idx%2===0?'#fff':'#fafafa'};">
                    <td style="padding:7px 10px;white-space:nowrap;" class="mono">${cleanDate(t.date)}</td>
                    <td style="padding:7px 10px;">
                      <div style="font-weight:700;color:#0f172a;">${t.icon} ${escapeHtml(t.type)}</div>
                      <div style="font-size:11px;color:#64748b;margin-top:1px;">${escapeHtml(t.desc)}</div>
                    </td>
                    <td style="padding:7px;text-align:center;" class="mono">${escapeHtml(t.ref)}</td>
                    <td style="padding:7px;text-align:center;color:#7c3aed;" class="mono font-bold">${t.credit > 0 ? t.credit.toLocaleString() + ' ج.م' : '-'}</td>
                    <td style="padding:7px;text-align:center;color:#16a34a;" class="mono font-bold">${t.debit > 0 ? t.debit.toLocaleString() + ' ج.م' : '-'}</td>
                    <td style="padding:7px;text-align:center;font-weight:900;color:${t.balance>0?'#dc2626':(t.balance===0?'#16a34a':'#2563eb')};" class="mono">
                      ${t.balance.toLocaleString()} ج.م
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Footer Buttons -->
      <div style="background:#f1f5f9;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #cbd5e1;flex-wrap:wrap;gap:8px;">
        <button type="button" class="btn btn-ghost btn-sm" id="cancelSupStatementBtn">إغلاق</button>
        <div style="display:flex;gap:8px;">
          ${data.supPhone && data.supPhone !== '0000000000' ? `
            <button type="button" class="btn btn-green btn-sm font-bold" id="waSupStatementBtn">
              ${getSvgIcon("message", 14)} إرسال كشف الحساب عبر WhatsApp
            </button>
          ` : ''}
          <button type="button" class="btn btn-purple btn-sm font-bold" id="printSupStatementBtn">
            ${getSvgIcon("printer", 14)} طباعة كشف حساب مورد A4
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#closeSupStatementBtn').onclick = () => overlay.remove();
  overlay.querySelector('#cancelSupStatementBtn').onclick = () => overlay.remove();

  const printBtn = overlay.querySelector('#printSupStatementBtn');
  if(printBtn) printBtn.onclick = () => openSupplierStatementPrint(data);

  const waBtn = overlay.querySelector('#waSupStatementBtn');
  if(waBtn) waBtn.onclick = () => shareSupplierStatementWhatsApp(data);
}

function openSupplierStatementPrint(data){
  const mount = document.createElement('div');
  mount.id = 'printSupplierStatementMount';
  mount.className = 'print-mount-a4';
  const companyName = (state.settings && state.settings.companyName) || 'ميكروERP';

  mount.innerHTML = `
    <style>
      @media print {
        body * { visibility: hidden !important; }
        #printSupplierStatementMount, #printSupplierStatementMount * { visibility: visible !important; }
        #printSupplierStatementMount {
          position: fixed; left: 0; top: 0; width: 100%; height: auto;
          background: #fff; padding: 24px; font-family: system-ui, -apple-system, sans-serif;
          color: #000; direction: rtl; z-index: 999999;
        }
      }
    </style>
    <div style="max-width:800px;margin:0 auto;padding:20px;border:1px solid #cbd5e1;border-radius:8px;">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:16px;">
        <div>
          <h2 style="margin:0;font-size:20px;font-weight:900;color:#0f172a;">${escapeHtml(companyName)}</h2>
          <div style="font-size:12px;color:#475569;margin-top:3px;">كشف حساب مشتريات وتوريدات مورد</div>
        </div>
        <div style="text-align:left;">
          <div style="background:#7c3aed;color:#fff;font-size:13px;font-weight:900;padding:4px 14px;border-radius:4px;display:inline-block;">
            كشف حساب مورد
          </div>
          <div style="font-size:11px;color:#64748b;margin-top:4px;">تاريخ التقرير: <b>${new Date().toISOString().slice(0,10)}</b></div>
        </div>
      </div>

      <!-- Supplier Info Card -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px 16px;border-radius:6px;margin-bottom:16px;font-size:12.5px;display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px;">
        <div>اسم المورد / الشركة: <b>${escapeHtml(data.supName)}</b></div>
        <div>الهاتف: <b class="mono" style="direction:ltr;">${escapeHtml(data.supPhone || '-')}</b></div>
        <div style="text-align:left;">الرصيد المستحق: <b class="mono" style="font-size:14px;color:${data.netBalance>0?'#dc2626':'#16a34a'};">${data.netBalance.toLocaleString()} ج.م</b></div>
      </div>

      <!-- Table -->
      <table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-bottom:16px;">
        <thead>
          <tr style="background:#0f172a;color:#fff;">
            <th style="padding:6px 8px;text-align:right;">التاريخ</th>
            <th style="padding:6px 8px;text-align:right;">المعاملة والبيان</th>
            <th style="padding:6px;text-align:center;">المرجع</th>
            <th style="padding:6px;text-align:center;">فاتورة توريد (ج.م)</th>
            <th style="padding:6px;text-align:center;">مسدد له (ج.م)</th>
            <th style="padding:6px;text-align:center;">الرصيد المستحق</th>
          </tr>
        </thead>
        <tbody>
          ${data.transactions.map((t, idx) => `
            <tr style="border-bottom:1px solid #e2e8f0;background:${idx%2===0?'#fff':'#f8fafc'};">
              <td style="padding:6px 8px;" class="mono">${cleanDate(t.date)}</td>
              <td style="padding:6px 8px;"><b>${escapeHtml(t.type)}</b> - ${escapeHtml(t.desc)}</td>
              <td style="padding:6px;text-align:center;" class="mono">${escapeHtml(t.ref)}</td>
              <td style="padding:6px;text-align:center;" class="mono">${t.credit > 0 ? t.credit.toLocaleString() : '-'}</td>
              <td style="padding:6px;text-align:center;" class="mono">${t.debit > 0 ? t.debit.toLocaleString() : '-'}</td>
              <td style="padding:6px;text-align:center;font-weight:bold;" class="mono">${t.balance.toLocaleString()} ج.م</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background:#f1f5f9;font-weight:900;border-top:2px solid #0f172a;">
            <td colspan="3" style="padding:8px;">الإجمالي العام</td>
            <td style="padding:8px;text-align:center;" class="mono">${data.totalPurchases.toLocaleString()} ج.م</td>
            <td style="padding:8px;text-align:center;" class="mono">${data.totalPaid.toLocaleString()} ج.م</td>
            <td style="padding:8px;text-align:center;color:${data.netBalance>0?'#dc2626':'#16a34a'};" class="mono">${data.netBalance.toLocaleString()} ج.م</td>
          </tr>
        </tfoot>
      </table>

      <!-- Signatures -->
      <div style="display:flex;justify-content:space-between;margin-top:28px;padding-top:10px;border-top:1px dashed #cbd5e1;font-size:11px;color:#475569;">
        <div style="text-align:center;width:40%;">
          <div>توقيع مسؤول المشتريات</div>
          <div style="margin-top:28px;border-bottom:1px dashed #94a3b8;width:80%;margin-left:auto;margin-right:auto;"></div>
        </div>
        <div style="text-align:center;width:40%;">
          <div>توقيع المستلم / المورد</div>
          <div style="margin-top:28px;border-bottom:1px dashed #94a3b8;width:80%;margin-left:auto;margin-right:auto;"></div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(mount);
  setTimeout(()=>{
    window.print();
    setTimeout(()=>{ mount.remove(); }, 1000);
  }, 100);
}

function shareSupplierStatementWhatsApp(data){
  if(!data.supPhone || data.supPhone === '0000000000'){
    showToast('رقم هاتف المورد غير متوفر للمشاركة عبر واتساب', 'error');
    return;
  }
  const statusStr = data.netBalance > 0 ? `الرصيد المستحق لكم طرفنا: ${data.netBalance.toLocaleString()} ج.م` : (data.netBalance === 0 ? 'الحساب خالص بالكامل (0 ج.م)' : `رصيد دائن مدفوع مقدماً: ${Math.abs(data.netBalance).toLocaleString()} ج.م`);

  let text = `السادة / ${data.supName} المحترمين،\nتحية طيبة\n\n*ملخص كشف حساب التوريدات والمشتريات حتى تاريخ ${new Date().toISOString().slice(0,10)}:*\n` +
    `• إجمالي التوريدات والمشتريات: ${data.totalPurchases.toLocaleString()} ج.م\n` +
    `• إجمالي المسدد لكم (سندات الصرف): ${data.totalPaid.toLocaleString()} ج.م\n` +
    `--------------------------\n` +
    `*${statusStr}*\n` +
    `--------------------------\n` +
    `آخر حركات الحساب:\n`;

  const recent = data.transactions.slice(-5);
  recent.forEach(t => {
    text += `▫️ ${t.date} | ${t.type} | فاتورة: ${t.credit.toLocaleString()} | مسدد: ${t.debit.toLocaleString()}\n`;
  });
  text += `\nمع خالص الشكر والتقدير`;

  const url = buildWaUrl(data.supPhone, text, getWaCountryCode());
  if(!url){ showToast('رقم هاتف المورد غير صالح لإرسال واتساب', 'error'); return; }
  openWhatsappChat(data.supPhone, text, {
    receiptId: 'statement:supplier:' + String(data.supPhone),
    key: 'statement',
    label: 'كشف حساب مورد',
    auditDetails: `تم إرسال كشف حساب المورد (${data.supName || ''}) عبر واتساب`
  });
}

window.openCustomerStatementModal = openCustomerStatementModal;
window.openSupplierStatementModal = openSupplierStatementModal;
window.openCustomerStatementPrint = openCustomerStatementPrint;
window.openSupplierStatementPrint = openSupplierStatementPrint;
window.shareCustomerStatementWhatsApp = shareCustomerStatementWhatsApp;
window.shareSupplierStatementWhatsApp = shareSupplierStatementWhatsApp;

function renderBonusPage(main){
  main.innerHTML = `
    <div class="top-header"><div><h2 class="page-title">${getSvgIcon("tag", 22)} مكافآت الفنيين</h2></div></div>
    <div class="card">
      <div class="field"><label>اختر الفني</label>
        <select id="bTech"><option value="">-- اختر فني --</option>${state.technicians.map(t=>`<option>${t}</option>`).join('')}</select>
      </div>
      <div id="bonusResult"></div>
    </div>
  `;
  document.getElementById('bTech').onchange = (e)=>{
    const tech = e.target.value;
    const list = state.receipts.filter(r=>r.technician===tech);
    const box = document.getElementById('bonusResult');
    if(!tech || !list.length){ box.innerHTML = '<div class="empty">لا توجد إيصالات منجزة لهذا الفني.</div>'; return; }
    box.innerHTML = `<div class="table-wrap" style="margin-top:12px;"><table><thead><tr><th>الإيصال</th><th>التاريخ</th><th>الجهاز</th><th>الحالة</th><th>المكافأة (ج.م)</th></tr></thead><tbody>
      ${list.map(r=>`<tr><td>${r.receiptNumber}</td><td>${cleanDate(r.date)}</td><td>${r.device.category}</td><td>${r.status}</td><td><input type="number" value="${r.bonus||0}" style="width:80px;" data-bid="${r.id}"></td></tr>`).join('')}
    </tbody></table></div>`;
  };
}
