/* ---------------- Invoices Management Screen View (شاشة إدارة الفواتير العامة) ---------------- */
function renderInvoicesPage(main){
  if(!state.invoiceSearchQ) state.invoiceSearchQ = '';
  if(!state.invoiceStatusFilter) state.invoiceStatusFilter = 'all';

  const rawList = state.invoices || [];
  let list = [...rawList];

  // Status Filter
  if(state.invoiceStatusFilter === 'paid'){
    list = list.filter(i => i.Status === 'مدفوعة بالكامل');
  } else if(state.invoiceStatusFilter === 'partial'){
    list = list.filter(i => i.Status === 'مدفوعة جزئياً');
  } else if(state.invoiceStatusFilter === 'unpaid'){
    list = list.filter(i => i.Status === 'غير مدفوعة (آجلة)' || Number(i.Remaining||0) > 0);
  }

  // Text search
  const q = state.invoiceSearchQ.trim().toLowerCase();
  if(q){
    list = list.filter(i => 
      (i.InvoiceNumber||'').toLowerCase().includes(q) ||
      (i.CustomerName||'').toLowerCase().includes(q) ||
      (i.CustomerPhone||'').includes(q) ||
      (i.ReferenceID||'').includes(q) ||
      (i.ItemsSummary||'').toLowerCase().includes(q)
    );
  }

  // Financial KPIs
  const totalInvoicesCount = rawList.length;
  const totalInvoicedSum = rawList.reduce((s,i)=>s+Number(i.Total||0),0);
  const totalPaidSum = rawList.reduce((s,i)=>s+Number(i.AmountPaid||0),0);
  const totalRemainingSum = rawList.reduce((s,i)=>s+Number(i.Remaining||0),0);

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon('invoices', 20)} الفواتير الضريبية والرسمية</h2>
        <div class="subtitle mono" style="font-size:12px;color:var(--ink-secondary);">${list.length} فاتورة معروضة</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost btn-sm" id="exportInvoicesExcelBtn">${getSvgIcon('download', 14)} تصدير الفواتير Excel</button>
        <button class="btn btn-primary btn-sm" id="addNewInvoiceBtn">${getSvgIcon('plus', 14)} إصدار فاتورة جديدة</button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="stat-grid">
      <div class="stat-card blue">
        <div class="top-row"><span class="lbl">إجمالي الفواتير الصادرة</span><div class="icon-box">${getSvgIcon('fileText', 20)}</div></div>
        <div class="num mono">${totalInvoicesCount}</div>
      </div>
      <div class="stat-card purple">
        <div class="top-row"><span class="lbl">إجمالي قيمة الفواتير</span><div class="icon-box">${getSvgIcon('dollar', 20)}</div></div>
        <div class="num mono">${totalInvoicedSum.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
      </div>
      <div class="stat-card green">
        <div class="top-row"><span class="lbl">إجمالي المحصل الفعلي</span><div class="icon-box">${getSvgIcon('check', 20)}</div></div>
        <div class="num mono">${totalPaidSum.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
      </div>
      <div class="stat-card red">
        <div class="top-row"><span class="lbl">المستحقات المتبقية (آجل)</span><div class="icon-box">${getSvgIcon('clock', 20)}</div></div>
        <div class="num mono">${totalRemainingSum.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar" style="margin-bottom:14px;">
      <input id="invSearchInp" placeholder="بحث برقم الفاتورة، اسم العميل، الهاتف، أو رقم إيصال الصيانة..." value="${state.invoiceSearchQ}" style="flex:1;min-width:240px;">
      <select id="invStatusFilterSelect" style="min-width:150px;">
        <option value="all" ${state.invoiceStatusFilter==='all'?'selected':''}>كل الحالات</option>
        <option value="paid" ${state.invoiceStatusFilter==='paid'?'selected':''}>مدفوعة بالكامل</option>
        <option value="partial" ${state.invoiceStatusFilter==='partial'?'selected':''}>مدفوعة جزئياً</option>
        <option value="unpaid" ${state.invoiceStatusFilter==='unpaid'?'selected':''}>متبقي مستحق (آجل)</option>
      </select>
      ${(state.invoiceSearchQ || state.invoiceStatusFilter!=='all') ? `<button class="btn btn-ghost btn-sm" id="clearInvFilters">مسح الفلاتر</button>` : ''}
    </div>

    <div id="unifiedSelectionTopSlot"></div>

    <div class="card">
      ${list.length===0 ? '<div class="empty">لا توجد فواتير مطابقة للبحث أو الفلتر المختار.</div>' : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:140px;">رقم الفاتورة</th>
              <th style="width:105px;">التاريخ</th>
              <th>العميل</th>
              <th style="width:130px;">المرجع</th>
              <th style="width:105px;text-align:center;">الإجمالي</th>
              <th style="width:105px;text-align:center;">المدفوع</th>
              <th style="width:105px;text-align:center;">المتبقي</th>
              <th style="width:115px;text-align:center;">حالة السداد</th>
            </tr>
          </thead>
          <tbody>
            ${list.slice().reverse().map(inv=>{
              const isPaid = inv.Status === 'مدفوعة بالكامل' || Number(inv.Remaining||0) <= 0;
              const isPartial = inv.Status === 'مدفوعة جزئياً';
              const isSelected = String(state.selectedInvoiceId) === String(inv.ID);
              const cPhone = String(inv.CustomerPhone || '').trim();
              const cleanPhone = cPhone.replace(/\D/g, '');
              const phoneFormatted = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
              const waMsg = `مرحبًا ${inv.CustomerName}،\nفاتورة / بيان سعر رقم: ${inv.InvoiceNumber}\nإجمالي المستحق: ${inv.Total} ج.م\nالمدفوع: ${inv.AmountPaid} ج.م\nالمتبقي: ${inv.Remaining} ج.م\nشكرًا لتعاملكم مع ${state.settings.shopName || 'ميكروتك'}.`;
              const waUrl = cleanPhone ? `https://wa.me/${phoneFormatted}?text=${encodeURIComponent(waMsg)}` : '';

              return `
                <tr class="${isSelected ? 'selected-row' : ''}" data-inv-id="${inv.ID}" onclick="handleInvoiceRowClick('${inv.ID}', event)" ondblclick="openInvoiceModalDirect('${inv.ID}')" style="cursor:pointer;" title="انقر لتحديد الفاتورة واستخدام الشريط العلوي، أو نقر مزدوج للتعديل">
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <span class="mono font-bold" style="color:var(--primary);font-size:13px;">${escapeHtml(inv.InvoiceNumber)}</span>
                      ${isSelected ? '<span class="badge badge-primary selected-badge-indicator" style="font-size:9.5px;padding:1px 5px;">محددة</span>' : ''}
                    </div>
                  </td>
                  <td style="font-size:11.5px;color:var(--ink-secondary);">
                    ${cleanDate(inv.Date)}
                  </td>
                  <td>
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                      <div>
                        <div style="font-weight:800;font-size:13px;color:var(--ink);">${escapeHtml(inv.CustomerName)}</div>
                        <div class="mono" style="font-size:11px;color:var(--ink-secondary);">${escapeHtml(inv.CustomerPhone||'-')}</div>
                      </div>
                      ${waUrl ? `
                        <a href="${waUrl}" target="_blank" onclick="event.stopPropagation();" class="btn btn-xs btn-whatsapp" style="padding:2px 7px;border-radius:4px;text-decoration:none;" title="محادثة واتساب مباشرة">
                          ${WA_ICON}
                        </a>
                      ` : ''}
                    </div>
                  </td>
                  <td>
                    ${inv.ReferenceType ? `<span class="status-badge st-check" style="font-size:10.5px;">${inv.ReferenceType==='Receipt'?'إيصال #':inv.ReferenceType} ${escapeHtml(inv.ReferenceID)}</span>` : '<span style="color:var(--slate-400);font-size:11px;">مباشر</span>'}
                  </td>
                  <td class="mono font-bold" style="font-size:13px;text-align:center;">${Number(inv.Total||0).toLocaleString()} ج.م</td>
                  <td class="mono font-bold" style="color:var(--green);font-size:13px;text-align:center;">${Number(inv.AmountPaid||0).toLocaleString()} ج.م</td>
                  <td class="mono font-bold" style="color:${Number(inv.Remaining||0)>0?'var(--red)':'var(--ink)'};font-size:13px;text-align:center;">${Number(inv.Remaining||0).toLocaleString()} ج.م</td>
                  <td style="text-align:center;">
                    <span class="status-badge ${isPaid?'st-done':(isPartial?'st-repair':'st-failed')}">
                      ${isPaid?'مدفوعة':(isPartial?'جزئي':'آجل')}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>`}
    </div>
  `;

  // Filter bindings
  const searchInput = document.getElementById('invSearchInp');
  if(searchInput) searchInput.oninput = (e)=>{ state.invoiceSearchQ = e.target.value; renderInvoicesPage(main); };
  const statusSel = document.getElementById('invStatusFilterSelect');
  if(statusSel) statusSel.onchange = (e)=>{ state.invoiceStatusFilter = e.target.value; renderInvoicesPage(main); };
  const clearBtn = document.getElementById('clearInvFilters');
  if(clearBtn) clearBtn.onclick = ()=>{ state.invoiceSearchQ = ''; state.invoiceStatusFilter = 'all'; renderInvoicesPage(main); };

  const addBtn = document.getElementById('addNewInvoiceBtn');
  if(addBtn) addBtn.onclick = ()=>openInvoiceModal();
  const expBtn = document.getElementById('exportInvoicesExcelBtn');
  if(expBtn) expBtn.onclick = ()=>exportInvoicesToExcel(list);

  if(typeof window.renderUnifiedSelectionBar === 'function'){
    window.renderUnifiedSelectionBar();
  }
}

function renderInvoicesSectionApp(app){
  if(!canUserAccessSection('invoices')){
    showToast('ليس لديك صلاحية للوصول إلى قسم الفواتير', 'error');
    state.currentSection = null;
    return render();
  }
  const hasFinanceNav = canUserAccessSection('cashdrawer') || canUserAccessSection('daily') || canUserAccessSection('finance');
  const hasQuickNav = canUserAccessSection('maintenance') || canUserAccessSection('pos') || canUserAccessSection('settings');

  app.innerHTML = `
    <div class="sidebar">
      ${brandHtml("الفواتير وعروض الأسعار")}
      ${sectionSwitcherHtml()}
      <div class="sidebar-nav-wrap">
        <div class="nav-section">إدارة الفواتير والتحصيل</div>
        <div class="nav-item active">
          <span class="nav-item-icon">${getSvgIcon('invoices', 16)}</span><span>سجل الفواتير وبيانات الأسعار</span>
        </div>

        ${hasFinanceNav ? `
          <div class="nav-section">القطاع المالي المرتبط</div>
          ${canUserAccessSection('cashdrawer') ? `
            <div class="nav-item" id="invToDrawerNav">
              <span class="nav-item-icon">${getSvgIcon('cashdrawer', 16)}</span><span>حركة الخزينة والدرج</span>
            </div>
          ` : ''}
          ${canUserAccessSection('daily') ? `
            <div class="nav-item" id="invToDailyNav">
              <span class="nav-item-icon">${getSvgIcon('daily', 16)}</span><span>دفتر اليومية العامة</span>
            </div>
          ` : ''}
          ${canUserAccessSection('finance') ? `
            <div class="nav-item" id="invToFinanceNav">
              <span class="nav-item-icon">${getSvgIcon('finance', 16)}</span><span>شجرة الحسابات والقيود</span>
            </div>
            <div class="nav-item" id="invToIncomeNav">
              <span class="nav-item-icon">${getSvgIcon('chart', 16)}</span><span>تقرير الأرباح والدخل</span>
            </div>
          ` : ''}
        ` : ''}

        ${hasQuickNav ? `
          <div class="nav-section">التنقل السريع</div>
          ${canUserAccessSection('maintenance') ? `
            <div class="nav-item" id="invToMaintNav">
              <span class="nav-item-icon">${getSvgIcon('maintenance', 16)}</span><span>قسم الصيانة</span>
            </div>
          ` : ''}
          ${canUserAccessSection('pos') ? `
            <div class="nav-item" id="invToPosNav">
              <span class="nav-item-icon">${getSvgIcon('pos', 16)}</span><span>نقطة البيع (POS)</span>
            </div>
          ` : ''}
          ${canUserAccessSection('settings') ? `
            <div class="nav-item" id="invToSettingsNav">
              <span class="nav-item-icon">${getSvgIcon('settings', 16)}</span><span>الإعدادات</span>
            </div>
          ` : ''}
        ` : ''}
      </div>
      ${sidebarFootHtml()}
    </div>
    <main id="main"></main>
  `;
  const sw = document.getElementById('switchSectionBtn');
  if(sw) sw.onclick = ()=>{ state.currentSection = null; render(); };
  attachSidebarHandlers();

  const iDrw = document.getElementById('invToDrawerNav');
  if(iDrw) iDrw.onclick = ()=>{ state.currentSection = 'cashdrawer'; render(); };
  const iDay = document.getElementById('invToDailyNav');
  if(iDay) iDay.onclick = ()=>{ state.currentSection = 'daily'; render(); };
  const iFin = document.getElementById('invToFinanceNav');
  if(iFin) iFin.onclick = ()=>{ state.currentSection = 'finance'; state.financeTab = 'accounts'; render(); };
  const iInc = document.getElementById('invToIncomeNav');
  if(iInc) iInc.onclick = ()=>{ state.currentSection = 'finance'; state.financeTab = 'income'; render(); };
  const iMaint = document.getElementById('invToMaintNav');
  if(iMaint) iMaint.onclick = ()=>{ state.currentSection = 'maintenance'; render(); };
  const iPos = document.getElementById('invToPosNav');
  if(iPos) iPos.onclick = ()=>{ state.currentSection = 'pos'; render(); };
  const iSet = document.getElementById('invToSettingsNav');
  if(iSet) iSet.onclick = ()=>{ state.currentSection = 'settings'; render(); };

  renderInvoicesPage(document.getElementById('main'));
}

/* ============================================================
   Daily Cash Journal & Cash Register (منظومة اليومية وحركة الخزينة العامة)
   ============================================================ */

function getUnifiedDailyTransactions(){
  const transactions = [];

  // 1. Maintenance Payments (Inflow) - ح/ 4101 إيرادات خدمات صيانة وتصليح
  (state.payments || []).forEach(p => {
    const r = state.receipts.find(x => x.id === p.ReceiptID || x.receiptNumber === p.ReceiptNumber);
    const custName = r ? r.customer.name : '';
    transactions.push({
      id: 'pay_' + (p.ID || p.ReceiptID),
      rawPayId: p.ID,
      rawReceiptId: p.ReceiptID,
      date: cleanDate(p.Date) || new Date().toISOString().slice(0,10),
      rawTime: p.Time || '',
      type: 'in',
      sourceType: 'maintenance',
      sourceIcon: getSvgIcon('maintenance', 13),
      accountCode: '4101',
      accountName: 'إيرادات خدمات صيانة وتصليح',
      accountTag: '4101 • صيانة',
      category: 'مقبوضات ودفعات صيانة',
      title: `تحصيل صيانة: ${custName ? custName + ' — ' : ''}${p.Note || 'دفعة إيصال'}`,
      reference: p.ReceiptNumber ? `إيصال #${p.ReceiptNumber}` : (r ? `إيصال #${r.receiptNumber}` : `إيصال صيانة`),
      in: Number(p.Amount || 0),
      out: 0,
      by: p.By || 'نظام',
      method: p.PaymentMethod || 'نقدي (كاش)',
      notes: p.Note || '',
      canDelete: true
    });
  });

  // 2. POS Cash Sales (Inflow) - ح/ 4102 إيرادات مبيعات بضائع وقطع غيار
  (state.sales || []).forEach(s => {
    const paidAmt = Number(s.AmountPaid != null ? s.AmountPaid : s.Total);
    transactions.push({
      id: 'sale_' + s.ID,
      date: cleanDate(s.Date) || new Date().toISOString().slice(0,10),
      rawTime: '',
      type: 'in',
      sourceType: 'pos',
      sourceIcon: getSvgIcon('pos', 13),
      accountCode: '4102',
      accountName: 'إيرادات مبيعات بضائع وقطع غيار',
      accountTag: '4102 • مبيعات POS',
      category: 'مبيعات الكاشير POS',
      title: `مبيعات كاشير: ${s.CustomerName || 'عميل زائر'} — ${(s.ItemsSummary||'مبيعات POS')}`,
      reference: `مبيعات #${s.ID.slice(-8)}`,
      in: paidAmt,
      out: 0,
      by: state.user ? state.user.name : 'كاشير',
      method: s.PaymentMethod || 'نقدي',
      notes: s.CustomerName || '',
      canDelete: false
    });
  });

  // 3. Direct Tax Invoices (Inflow for invoices that are not from POS or Receipt to avoid double counting)
  (state.invoices || []).forEach(inv => {
    const ref = String(inv.ReferenceType || '').toUpperCase();
    if(ref !== 'RECEIPT' && ref !== 'POS'){
      const paidAmt = Number(inv.AmountPaid || 0);
      if(paidAmt > 0){
        transactions.push({
          id: 'inv_' + inv.ID,
          date: cleanDate(inv.Date) || new Date().toISOString().slice(0,10),
          rawTime: '',
          type: 'in',
          sourceType: 'invoice',
          sourceIcon: getSvgIcon('fileText', 13),
          accountCode: '4102',
          accountName: 'إيرادات مبيعات وفواتير مباشرة',
          accountTag: '4102 • فواتير',
          category: 'مقبوضات فواتير عامة',
          title: `تحصيل فاتورة: ${inv.InvoiceNumber} — ${inv.CustomerName}`,
          reference: `فاتورة ${inv.InvoiceNumber}`,
          in: paidAmt,
          out: 0,
          by: inv.By || 'نظام',
          method: inv.PaymentMethod || 'نقدي',
          notes: inv.CustomerName,
          canDelete: false
        });
      }
    }
  });

  // 4. Supplier Purchases (Outflow)
  (state.purchases || []).forEach(pur => {
    const paidAmt = Number(pur.AmountPaid != null ? pur.AmountPaid : pur.Total);
    if(paidAmt > 0){
      transactions.push({
        id: 'pur_' + pur.ID,
        date: cleanDate(pur.Date) || new Date().toISOString().slice(0,10),
        rawTime: '',
        type: 'out',
        sourceType: 'purchase',
        sourceIcon: getSvgIcon('truck', 13),
        accountCode: '2101',
        accountName: 'الموردون والدائنون / تكلفة بضاعة',
        accountTag: '2101 • موردين',
        category: 'مشتريات موردين',
        title: `سداد مشتريات: ${pur.Supplier} (${pur.ItemsSummary || 'بضاعة/قطع غيار'})`,
        reference: `شراء #${pur.ID}`,
        in: 0,
        out: paidAmt,
        by: pur.By || 'نظام',
        method: pur.PaymentMethod || 'نقدي (كاش)',
        notes: pur.Supplier,
        canDelete: false
      });
    }
  });

  // 5. Maintenance Refunds (Outflow)
  (state.receipts || []).forEach(r => {
    if(Number(r.refunded || 0) > 0){
      const custName = r.customer ? (r.customer.name || '') : (r.CustomerName || '');
      const rRefunds = (Array.isArray(r.refunds) && r.refunds.length > 0) ? r.refunds : [{
        amount: Number(r.refunded),
        method: r.refundMethod || 'نقدي (كاش)',
        reason: r.refundReason || 'مبالغ مستردة',
        date: cleanDate(r.refundDate || r.updatedAt || r.date) || new Date().toISOString().slice(0,10),
        time: r.refundTime || '',
        by: r.updatedBy || r.createdBy || 'نظام'
      }];

      rRefunds.forEach((ref, idx) => {
        transactions.push({
          id: 'ref_' + (r.id || r.receiptNumber) + '_' + idx,
          date: cleanDate(ref.date) || cleanDate(r.updatedAt || r.date) || new Date().toISOString().slice(0,10),
          rawTime: ref.time || '',
          type: 'out',
          sourceType: 'refund',
          sourceIcon: getSvgIcon('arrowLeft', 13),
          accountCode: '4101',
          accountName: 'مردودات خدمات صيانة وتصليح',
          accountTag: '4101 • استرداد صيانة',
          category: 'استرداد صيانة',
          title: `استرداد مبالغ صيانة للعميل: ${custName}`,
          reference: `إيصال #${r.receiptNumber || r.id}`,
          in: 0,
          out: Number(ref.amount || 0),
          by: ref.by || r.updatedBy || r.createdBy || 'نظام',
          method: ref.method || 'نقدي (كاش)',
          notes: ref.reason || 'مبالغ مستردة',
          canDelete: false
        });
      });
    }
  });

  // 5b. POS Sales Returns (Outflow) from state.returns [F9]
  (state.returns || []).forEach(ret => {
    const amt = Number(ret.RefundAmount || 0);
    if(amt > 0){
      const rMethod = ret.RefundMethod || 'نقدي';
      transactions.push({
        id: 'ret_' + (ret.ID || ret.SaleID),
        date: cleanDate(ret.Date) || new Date().toISOString().slice(0,10),
        rawTime: ret.Time || '',
        type: 'out',
        sourceType: 'pos_return',
        sourceIcon: getSvgIcon('arrowLeft', 13),
        accountCode: '4102',
        accountName: 'مردودات ومسموحات مبيعات الأجهزة والإكسسوار',
        accountTag: '4102 • مرتجع مبيعات',
        category: 'مرتجع مبيعات POS',
        title: `مرتجع مبيعات POS: ${ret.CustomerName || 'عميل زائر'} (${ret.ItemsSummary || ''})`,
        reference: ret.CreditNoteNumber || `RET-${String(ret.SaleID||'').slice(-8)}`,
        in: 0,
        out: amt,
        by: ret.By || 'كاشير',
        method: rMethod,
        notes: `إشعار دائن ${ret.CreditNoteNumber || ''} - استرداد عبر ${rMethod}`,
        canDelete: false
      });
    }
  });

  // 6. Expenses, Petty Cash, Manual Inflows, and Manual Outflows
  (state.expenses || []).forEach(ex => {
    const isIncome = ex.Type === 'in' || ex.Type === 'income';
    const isDraw = ex.Type === 'out' || ex.Category === 'مسحوبات شخصية' || ex.Category === 'جاري الشركاء';
    const isPetty = ex.Type === 'petty' || ex.Category === 'بوفيه ونثريات' || ex.Category === 'نثريات';
    const isSupplierPay = ex.Category === 'سداد موردين ومشتريات' || ex.Category === 'سداد موردين' || !!ex.Supplier;
    const isPosReturn = ex.Category === 'مرتجع مبيعات POS' || ex.AccountCode === '4102-RET';

    if(isPosReturn){
      // S10/F9: Dedup against state.returns
      const refStr = String(ex.Reference || '');
      const isAlreadyInReturns = (state.returns || []).some(r => {
        return (r.CreditNoteNumber && refStr.includes(r.CreditNoteNumber)) ||
               (r.SaleID && refStr.includes(String(r.SaleID).slice(-8)));
      });
      if(isAlreadyInReturns) return;
    }

    let tType = 'out';
    let sIcon = getSvgIcon('dollar', 13);
    let sCat = ex.Category || 'مصروفات تشغيلية';
    let sRef = 'مصروف';
    let accCode = EXPENSE_ACCOUNT_MAP[ex.Category] || '5200';
    let accName = ex.Category || 'مصروفات تشغيلية وعمومية';
    let accTag = accCode + ' • مصروف';

    if(isIncome){
      tType = 'in';
      sIcon = getSvgIcon('trendUp', 13);
      sCat = ex.Category || 'وارد / إيداع';
      sRef = 'وارد يدوي';
      accCode = '1101';
      accName = 'الخزينة الرئيسية (وارد يدوي)';
      accTag = '1101 • وارد يدوي';
    } else if(isPosReturn){
      tType = 'out';
      sIcon = getSvgIcon('arrowLeft', 13);
      sCat = 'مرتجع مبيعات POS';
      sRef = ex.Reference || 'إذن ارتجاع POS';
      accCode = '4102-RET';
      accName = 'مردودات ومسموحات مبيعات POS';
      accTag = '4102 • مرتجع مبيعات';
    } else if(isSupplierPay){
      tType = 'out';
      sIcon = getSvgIcon('truck', 13);
      sCat = 'سداد موردين';
      sRef = ex.Reference ? `سند #${ex.Reference}` : 'سند صرف مورد';
      accCode = '2101';
      accName = 'الموردون والدائنون';
      accTag = '2101 • موردين';
    } else if(isPetty){
      tType = 'petty';
      sIcon = getSvgIcon('wallet', 13);
      sCat = 'نثريات وبوفيه';
      sRef = 'نثريات';
      accCode = '5204';
      accName = 'بوفيه ونثريات وضيافة';
      accTag = '5204 • نثريات';
    } else if(isDraw){
      tType = 'out';
      sIcon = getSvgIcon('trendDown', 13);
      sCat = 'مسحوبات شركاء';
      sRef = 'مسحوبات';
      accCode = '3103';
      accName = 'جاري الشركاء والمسحوبات';
      accTag = '3103 • مسحوبات';
    }

    transactions.push({
      id: ex.ID,
      rawExpId: ex.ID,
      date: cleanDate(ex.Date) || new Date().toISOString().slice(0,10),
      rawTime: '',
      type: tType,
      sourceType: isIncome ? 'manual_in' : (isPosReturn ? 'pos_return' : (isPetty ? 'petty' : (isSupplierPay ? 'supplier_pay' : 'expense'))),
      sourceIcon: sIcon,
      accountCode: accCode,
      accountName: accName,
      accountTag: accTag,
      category: sCat,
      title: ex.Title,
      reference: sRef,
      in: isIncome ? Number(ex.Amount || 0) : 0,
      out: isIncome ? 0 : Number(ex.Amount || 0),
      by: ex.By || 'نظام',
      method: ex.PaymentMethod || 'نقدي (كاش)',
      notes: ex.Notes || '',
      canDelete: true
    });
  });

  // Sort chronologically
  transactions.sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if(dateComp !== 0) return dateComp;
    return (a.rawTime || '').localeCompare(b.rawTime || '');
  });

  // Calculate Running Balance
  let running = 0;
  transactions.forEach(t => {
    running += (t.in - t.out);
    t.runningBalance = running;
  });

  return transactions;
}

function openRecordTransactionModal(defaultType='expense'){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  let curType = defaultType; // 'in' | 'out' | 'expense' | 'petty'

  const typeConfig = {
    in: { label: `${getSvgIcon('trendUp', 18)} تسجيل وارد / إيداع نقدي بالخزينة`, btnCls: 'btn-green', submitTxt: 'حفظ الوارد' },
    out: { label: `${getSvgIcon('trendDown', 18)} تسجيل منصرف / مسحوبات نقدية`, btnCls: 'btn-amber', submitTxt: 'حفظ المنصرف' },
    expense: { label: `${getSvgIcon('dollar', 18)} تسجيل مصروف عام / تشغيلي`, btnCls: 'btn-red', submitTxt: 'حفظ المصروف' },
    petty: { label: `${getSvgIcon('wallet', 18)} تسجيل نثريات وبوفيه ومشتريات يومية`, btnCls: 'btn-primary', submitTxt: 'حفظ النثريات' }
  };

  function renderModal(){
    const cfg = typeConfig[curType] || typeConfig.expense;
    overlay.innerHTML = `
      <div class="modal-content" style="max-width:620px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
          <h3 style="margin:0;font-size:16.5px;font-weight:900;display:flex;align-items:center;gap:8px;">${cfg.label}</h3>
          <button class="btn btn-ghost btn-xs" id="closeTxModal" style="font-size:18px;line-height:1;">&times;</button>
        </div>

        <!-- Type Switcher Tabs -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-bottom:14px;">
          <button type="button" class="btn btn-xs ${curType==='in'?'btn-green':'btn-ghost'}" data-txtype="in" style="display:inline-flex;align-items:center;justify-content:center;gap:4px;">${getSvgIcon('download', 13)} وارد (إيداع)</button>
          <button type="button" class="btn btn-xs ${curType==='out'?'btn-amber':'btn-ghost'}" data-txtype="out" style="display:inline-flex;align-items:center;justify-content:center;gap:4px;">${getSvgIcon('upload', 13)} منصرف (مسحوبات)</button>
          <button type="button" class="btn btn-xs ${curType==='expense'?'btn-red':'btn-ghost'}" data-txtype="expense" style="display:inline-flex;align-items:center;justify-content:center;gap:4px;">${getSvgIcon('dollar', 13)} مصاريف تشغيل</button>
          <button type="button" class="btn btn-xs ${curType==='petty'?'btn-primary':'btn-ghost'}" data-txtype="petty" style="display:inline-flex;align-items:center;justify-content:center;gap:4px;">${getSvgIcon('wallet', 13)} نثريات وبوفيه</button>
        </div>

        <div class="field">
          <label>البيان / الوصف *</label>
          <input id="txTitle" placeholder="${curType==='in'?'مثال: إيداع نقدي إضافي، إيراد صيانة سابقة...':(curType==='petty'?'مثال: شاي وسكر وبوفيه، مستلزمات نظافة...':(curType==='out'?'مثال: مسحوبات شخصية، سلفة...':'مثال: فاتورة كهرباء، إيجار مركز الصيانة...'))}" autofocus>
        </div>

        <div class="grid2">
          <div class="field">
            <label>المبلغ (ج.م) *</label>
            <input id="txAmount" type="number" class="mono font-bold" placeholder="0" style="font-size:16px;">
          </div>
          <div class="field">
            <label>التاريخ *</label>
            <input id="txDate" type="date" value="${new Date().toISOString().slice(0,10)}">
          </div>
        </div>

        <div class="grid2">
          <div class="field">
            <label>بند المعاملة / التصنيف</label>
            <select id="txCategory">
              ${curType==='in' ? `
                <option>إيداع وتمويل خزينة</option>
                <option>إيرادات متنوعة</option>
                <option>سداد دفعات عميل</option>
                <option>أخرى</option>
              ` : (curType==='petty' ? `
                <option>بوفيه ونثريات</option>
                <option>ضيافة ومشروبات</option>
                <option>مستلزمات نظافة ومقر</option>
                <option>أدوات صغيرة ومواصلات</option>
              ` : (curType==='out' ? `
                <option>مسحوبات شخصية</option>
                <option>جاري الشركاء</option>
                <option>سداد التزامات</option>
                <option>أخرى</option>
              ` : `
                ${EXPENSE_CATEGORIES.map(c=>`<option>${c}</option>`).join('')}
              `))}
            </select>
          </div>
          <div class="field">
            <label>طريقة الدفع / الصندوق</label>
            <select id="txPaymentMethod">
              ${getActivePaymentMethods().map(pm => `<option value="${escapeHtml(pm.name)}">${escapeHtml(pm.name)}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="field">
          <label>ملاحظات إضافية</label>
          <input id="txNotes" placeholder="تفاصيل إضافية...">
        </div>

        <div class="actions-row" style="margin-top:16px;">
          <button class="btn btn-ghost" id="cancelTxModal">إلغاء</button>
          <button class="btn ${cfg.btnCls}" id="saveTxModalBtn">${cfg.submitTxt}</button>
        </div>
      </div>
    `;

    overlay.querySelector('#closeTxModal').onclick = ()=>overlay.remove();
    overlay.querySelector('#cancelTxModal').onclick = ()=>overlay.remove();

    overlay.querySelectorAll('[data-txtype]').forEach(btn => {
      btn.onclick = ()=>{ curType = btn.dataset.txtype; renderModal(); };
    });

    overlay.querySelector('#saveTxModalBtn').onclick = async ()=>{
      const title = overlay.querySelector('#txTitle').value.trim();
      const amount = Number(overlay.querySelector('#txAmount').value);
      const date = overlay.querySelector('#txDate').value;
      const category = overlay.querySelector('#txCategory').value;
      const method = overlay.querySelector('#txPaymentMethod').value;
      const notes = overlay.querySelector('#txNotes').value.trim();

      if(!title || !amount || amount<=0){
        showToast('يرجى كتابة البيان وتحديد المبلغ بشكل صحيح', 'error');
        return;
      }

      const saveBtn = overlay.querySelector('#saveTxModalBtn');
      saveBtn.disabled = true; saveBtn.textContent = 'جارٍ الحفظ...';

      try{
        await saveExpenseRemote({
          ID: 'exp_' + Date.now(),
          Date: date,
          Title: title,
          Amount: amount,
          Category: category,
          Type: curType,
          PaymentMethod: method,
          Notes: notes
        });
        showToast('تم تسجيل الحركة بنجاح في دفتر اليومية', 'success');
        overlay.remove();
        const main = document.getElementById('main');
        if(state.currentSection === 'daily' && main){
          renderDailyJournalPage(main);
        } else if(state.currentSection === 'maintenance'){
          renderMain();
        }
      }catch(e){
        showToast('تم الحفظ محلياً', 'info');
        overlay.remove();
        const main = document.getElementById('main');
        if(state.currentSection === 'daily' && main){
          renderDailyJournalPage(main);
        } else if(state.currentSection === 'maintenance'){
          renderMain();
        }
      }
    };
  }

  document.body.appendChild(overlay);
  renderModal();
}

function exportDailyJournalToExcel(transactions, stats){
  if(!transactions || !transactions.length){ showToast('لا توجد حركات للتصدير', 'error'); return; }
  const headers = ['التاريخ','البيان / المعاملة','المرجع / القسم','التصنيف','وارد (مدين)','منصرف (دائن)','الرصيد اللحظي','المسؤول','طريقة الدفع','ملاحظات'];
  const rows = transactions.map(t=>[
    cleanDate(t.date),
    `"${(t.title||'').replace(/"/g, '""')}"`,
    `"${t.reference||''}"`,
    `"${t.category||''}"`,
    t.in||0,
    t.out||0,
    t.runningBalance||0,
    `"${t.by||''}"`,
    `"${t.method||''}"`,
    `"${(t.notes||'').replace(/"/g, '""')}"`
  ]);
  downloadCSV(`Daily_Cash_Journal_${new Date().toISOString().slice(0,10)}.csv`, headers, rows);
}

/* ---------------- Shift Management & Z-Report / X-Report Engine ---------------- */
function getActiveShift(){
  return state.activeShift || null;
}

function startNewShift(openingFloat = 0, notes = ''){
  const shiftNumber = (state.shifts || []).length + 1;
  const shift = {
    id: 'shift_' + Date.now(),
    shiftNumber: shiftNumber,
    cashierId: state.user ? (state.user.id || state.user.name) : 'admin',
    cashierName: state.user ? state.user.name : 'الكاشير',
    startTime: new Date().toISOString(),
    openingFloat: Number(openingFloat || 0),
    openingNotes: notes || '',
    status: 'open'
  };
  state.activeShift = shift;
  setCache('activeShift', state.activeShift);
  recordAuditLog('فتح وردية جديدة', 'الخزينة والورديات', `فتح الوردية #${shiftNumber} برصيد افتتاحي: ${openingFloat} ج.م للكاشير: ${shift.cashierName}`, shift.id);

  // Journal Entry: Custody of drawer float (Debit 1101 Cash Drawer, Credit 2105 Shift Custody) [F6]
  if (Number(shift.openingFloat) > 0 && typeof recordAutoJournalEntry === 'function') {
    recordAutoJournalEntry(
      `رصيد افتتاحي عهدة وردية #${shiftNumber} - الكاشير: ${shift.cashierName}`,
      'Shift_Open',
      shift.id,
      [
        { AccountCode: '1101', AccountName: 'الخزينة الرئيسية (النقدية)', Debit: Number(shift.openingFloat), Credit: 0, Description: `عهدة درج الكاشير وردية #${shiftNumber}` },
        { AccountCode: '2105', AccountName: 'عهدة وأمانات مسؤولي الورديات', Debit: 0, Credit: Number(shift.openingFloat), Description: `عهدة وأمانات مسؤولي الورديات وردية #${shiftNumber}` }
      ]
    ).catch(e => console.error('Shift_Open JE error:', e));
  }

  showToast(`تم فتح وردية جديدة رقم #${shiftNumber} بنجاح`, 'success');
  return shift;
}

function formatShiftDuration(startTime, endTime){
  if(!startTime) return '-';
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);
  const diffMins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if(hrs > 0) return `${hrs} ساعة و ${mins} دقيقة`;
  return `${mins} دقيقة`;
}

function calculateShiftStats(shift){
  if(!shift) return null;
  const startTime = new Date(shift.startTime).getTime();
  const endTime = shift.endTime ? new Date(shift.endTime).getTime() : Date.now();

  const isTimeMatch = (dateStr, timeStr) => {
    if(!dateStr) return false;
    if(timeStr && timeStr.includes(':')){
      const tTime = new Date(`${dateStr}T${timeStr}`).getTime();
      if(!isNaN(tTime)) return tTime >= startTime && tTime <= endTime;
    }
    const dStart = new Date(dateStr).setHours(0,0,0,0);
    const sDay = new Date(shift.startTime).setHours(0,0,0,0);
    return dStart === sDay;
  };

  // 1. POS Sales in shift
  const shiftSales = (state.sales || []).filter(s => {
    if(s.ShiftID && s.ShiftID === shift.id) return true;
    const sTime = s.Date || s.date;
    return isTimeMatch(sTime, s.Time || s.time);
  });

  let posCash = 0, posCard = 0, posInstapay = 0, posWallet = 0, posCredit = 0;
  let posTotalRevenue = 0;
  let returnsCount = 0, returnsTotal = 0, returnsCash = 0;
  let itemsSoldCount = 0;

  shiftSales.forEach(s => {
    const tot = Number(s.Total || 0);
    const rawPaid = Number(s.AmountPaid != null ? s.AmountPaid : tot);
    const change = Number(s.ChangeDue != null ? s.ChangeDue : (rawPaid > tot ? rawPaid - tot : 0));
    // Cash actually collected and retained into drawer (deducting returned change) [F6]
    const paid = Math.max(0, rawPaid - change);
    const method = String(s.PaymentMethod || 'نقدي').toLowerCase();

    if(s.IsReturned){
      returnsCount++;
      returnsTotal += tot;
    }

    posTotalRevenue += tot;

    if(s.ItemsJSON){
      try {
        const parsed = typeof s.ItemsJSON === 'string' ? JSON.parse(s.ItemsJSON) : s.ItemsJSON;
        if(Array.isArray(parsed)) itemsSoldCount += parsed.reduce((sum, item) => sum + (Number(item.qty)||1), 0);
      } catch(e){}
    } else {
      itemsSoldCount++;
    }

    if(method.includes('نقدي') || method.includes('كاش') || method.includes('cash')){
      posCash += paid;
    } else if(method.includes('فيزا') || method.includes('card') || method.includes('بطاق') || method.includes('visa')){
      posCard += paid;
    } else if(method.includes('انستاباي') || method.includes('إنستاباي') || method.includes('instapay')){
      posInstapay += paid;
    } else if(method.includes('محفظ') || method.includes('فودافون') || method.includes('vodafone') || method.includes('wallet')){
      posWallet += paid;
    } else if(method.includes('آجل') || method.includes('اجل') || method.includes('credit')){
      posCredit += tot;
    } else {
      posCash += paid;
    }
  });

  // 2. Maintenance Payments in shift
  const shiftPayments = (state.payments || []).filter(p => {
    if(p.ShiftID && p.ShiftID === shift.id) return true;
    return isTimeMatch(p.Date, p.Time);
  });

  let maintCash = 0, maintNonCash = 0;
  shiftPayments.forEach(p => {
    const amt = Number(p.Amount || 0);
    const method = String(p.PaymentMethod || 'نقدي').toLowerCase();
    if(method.includes('نقدي') || method.includes('كاش') || method.includes('cash')){
      maintCash += amt;
    } else {
      maintNonCash += amt;
    }
  });

  // 3a. POS Returns in shift (from state.returns) [F9]
  const shiftReturns = (state.returns || []).filter(ret => {
    if(ret.ShiftID && ret.ShiftID === shift.id) return true;
    return isTimeMatch(ret.Date, ret.Time);
  });
  shiftReturns.forEach(ret => {
    const amt = Number(ret.RefundAmount || 0);
    const method = String(ret.RefundMethod || 'نقدي').toLowerCase();
    const isCash = method.includes('نقدي') || method.includes('كاش') || method.includes('cash');
    if(isCash) returnsCash += amt;
    returnsCount++;
    returnsTotal += amt;
  });

  // 3b. Maintenance Refunds in shift [F9]
  let maintRefundsCash = 0, maintRefundsTotal = 0, maintRefundsCount = 0;
  (state.receipts || []).forEach(r => {
    const rRefunds = (Array.isArray(r.refunds) && r.refunds.length > 0) ? r.refunds : (Number(r.refunded || 0) > 0 ? [{
      amount: Number(r.refunded),
      method: r.refundMethod || 'نقدي (كاش)',
      date: cleanDate(r.refundDate || r.updatedAt || r.date),
      time: r.refundTime || '',
      shiftId: r.refundShiftId || ''
    }] : []);

    rRefunds.forEach(ref => {
      const inShift = (ref.shiftId && ref.shiftId === shift.id) || isTimeMatch(ref.date, ref.time);
      if(inShift){
        const amt = Number(ref.amount || 0);
        const method = String(ref.method || 'نقدي').toLowerCase();
        const isCash = method.includes('نقدي') || method.includes('كاش') || method.includes('cash');
        if(isCash) maintRefundsCash += amt;
        maintRefundsTotal += amt;
        maintRefundsCount++;
      }
    });
  });

  // 3c. Expenses & Manual Drawer Movements in shift
  const shiftExpenses = (state.expenses || []).filter(ex => {
    if(ex.ShiftID && ex.ShiftID === shift.id) return true;
    return isTimeMatch(ex.Date, ex.Time);
  });

  let expensesCash = 0, pettyCash = 0, manualDrawerIn = 0, manualDrawerOut = 0;
  shiftExpenses.forEach(ex => {
    const amt = Number(ex.Amount || 0);
    const method = String(ex.PaymentMethod || 'نقدي').toLowerCase();
    const isCash = method.includes('نقدي') || method.includes('كاش') || method.includes('cash');
    if(!isCash && ex.Type !== 'in' && ex.Type !== 'out') return;

    const isRet = ex.Category === 'مرتجع مبيعات POS' || String(ex.Reference||'').startsWith('RET-');
    if(isRet){
      // S10/F9: Dedup against shiftReturns
      const refStr = String(ex.Reference || '');
      const alreadyHandled = shiftReturns.some(sr => {
        return (sr.CreditNoteNumber && refStr.includes(sr.CreditNoteNumber)) ||
               (sr.SaleID && refStr.includes(String(sr.SaleID).slice(-8)));
      });
      if(alreadyHandled) return;
      if(isCash) returnsCash += amt;
      returnsCount++;
      returnsTotal += amt;
    } else if(ex.Type === 'in'){
      manualDrawerIn += amt;
    } else if(ex.Type === 'out'){
      manualDrawerOut += amt;
    } else if(ex.Type === 'petty' || (ex.Category||'').includes('نثريات')){
      pettyCash += amt;
    } else {
      expensesCash += amt;
    }
  });

  // Fallback for returns if legacy data did not log return expense or state.returns
  if(returnsCount === 0){
    shiftSales.forEach(s => {
      if(s.IsReturned || s.IsPartiallyReturned){
        const tot = Number(s.Total || 0);
        const method = String(s.PaymentMethod || 'نقدي').toLowerCase();
        returnsCount++;
        returnsTotal += tot;
        if(method.includes('نقدي') || method.includes('كاش') || method.includes('cash')){
          returnsCash += tot;
        }
      }
    });
  }

  const openingFloat = Number(shift.openingFloat || 0);
  const totalCashIn = posCash + maintCash + manualDrawerIn;
  const totalCashOut = expensesCash + pettyCash + manualDrawerOut + returnsCash + maintRefundsCash;
  const netCashFlow = totalCashIn - totalCashOut;
  const expectedCash = openingFloat + netCashFlow;
  const actualCash = shift.actualCash != null ? Number(shift.actualCash) : null;
  const discrepancy = actualCash != null ? (actualCash - expectedCash) : 0;
  const totalTurnover = posTotalRevenue + maintCash + maintNonCash;

  return {
    openingFloat,
    posSalesCount: shiftSales.filter(s => !s.IsReturned).length,
    itemsSoldCount,
    posCash,
    posCard,
    posInstapay,
    posWallet,
    posCredit,
    posTotalRevenue,
    returnsCount,
    returnsTotal,
    returnsCash,
    maintRefundsCount,
    maintRefundsTotal,
    maintRefundsCash,
    maintPaymentsCount: shiftPayments.length,
    maintCash,
    maintNonCash,
    maintTotal: maintCash + maintNonCash,
    expensesCash,
    pettyCash,
    manualDrawerIn,
    manualDrawerOut,
    totalCashIn,
    totalCashOut,
    netCashFlow,
    expectedCash,
    actualCash,
    discrepancy,
    totalTurnover,
    transactionsCount: shiftSales.length + shiftPayments.length + shiftExpenses.length
  };
}

function closeActiveShift(actualCountedCash, closingNotes = '', printFormat = 'thermal'){
  if(!state.activeShift){
    showToast('لا توجد وردية نشطة حالياً لإغلاقها', 'error');
    return null;
  }
  const shift = state.activeShift;
  const stats = calculateShiftStats(shift);

  shift.endTime = new Date().toISOString();
  shift.status = 'closed';
  shift.closedBy = state.user ? state.user.name : 'admin';
  shift.actualCash = Number(actualCountedCash || 0);
  shift.discrepancy = shift.actualCash - stats.expectedCash;
  shift.closingNotes = closingNotes || '';
  shift.stats = stats;

  // Post closing journal entries [F6]
  if (typeof recordAutoJournalEntry === 'function') {
    // 1. Settle opening float if it existed (Release cashier custody)
    if (Number(shift.openingFloat) > 0) {
      recordAutoJournalEntry(
        `إخلاء وتسوية عهدة افتتاح وردية #${shift.shiftNumber} - الكاشير: ${shift.cashierName}`,
        'Shift_Close',
        shift.id,
        [
          { AccountCode: '2105', AccountName: 'عهدة وأمانات مسؤولي الورديات', Debit: Number(shift.openingFloat), Credit: 0, Description: `تسوية عهدة كاشير وردية #${shift.shiftNumber}` },
          { AccountCode: '1101', AccountName: 'الخزينة الرئيسية (النقدية)', Debit: 0, Credit: Number(shift.openingFloat), Description: `استرداد عهدة كاشير وردية #${shift.shiftNumber}` }
        ]
      ).catch(e => console.error('Shift_Close JE error:', e));
    }

    // 2. Discrepancy accounting (variance)
    const discrepancy = Number(shift.discrepancy || 0);
    if (discrepancy < -0.009) {
      // Shortage (عجز الدرج) -> Expense 5208, Cash Cr 1101
      const shortageAmt = Math.abs(discrepancy);
      recordAutoJournalEntry(
        `إثبات عجز درج نقدية وردية #${shift.shiftNumber} (${shift.cashierName})`,
        'Shift_Variance',
        shift.id,
        [
          { AccountCode: '5208', AccountName: 'مصروفات تشغيلية أخرى وفروق الدرج', Debit: shortageAmt, Credit: 0, Description: `عجز درج وردية #${shift.shiftNumber}: ${shortageAmt} ج.م` },
          { AccountCode: '1101', AccountName: 'الخزينة الرئيسية (النقدية)', Debit: 0, Credit: shortageAmt, Description: `تسوية نقص نقدية الدرج وردية #${shift.shiftNumber}` }
        ]
      ).catch(e => console.error('Shift_Variance Shortage JE error:', e));
    } else if (discrepancy > 0.009) {
      // Surplus (زيادة الدرج) -> Cash Dr 1101, Other Revenue Cr 42
      const surplusAmt = discrepancy;
      recordAutoJournalEntry(
        `إثبات زيادة نقدية غير معلومة بدرج وردية #${shift.shiftNumber} (${shift.cashierName})`,
        'Shift_Variance',
        shift.id,
        [
          { AccountCode: '1101', AccountName: 'الخزينة الرئيسية (النقدية)', Debit: surplusAmt, Credit: 0, Description: `زيادة نقدية محصلة بدرج وردية #${shift.shiftNumber}` },
          { AccountCode: '42', AccountName: 'إيرادات أخرى متنوعة', Debit: 0, Credit: surplusAmt, Description: `فائض نقدية غير معرّف وردية #${shift.shiftNumber}` }
        ]
      ).catch(e => console.error('Shift_Variance Surplus JE error:', e));
    }
  }

  if(!state.shifts) state.shifts = [];
  state.shifts.unshift(shift);
  state.activeShift = null;

  setCache('shifts', state.shifts);
  setCache('activeShift', null);

  recordAuditLog(
    'إغلاق وردية (Z-Report)',
    'الخزينة والورديات',
    `إغلاق الوردية #${shift.shiftNumber} للكاشير (${shift.cashierName}) - المتوقع: ${stats.expectedCash} ج.م - الفعلي: ${shift.actualCash} ج.م - الفارق: ${shift.discrepancy} ج.م`,
    shift.id
  );

  showToast(`تم إغلاق الوردية #${shift.shiftNumber} بنجاح`, 'success');

  // Trigger print
  if(printFormat){
    openShiftPrint(shift, 'Z', printFormat);
  }

  // Refresh active views
  const m = document.getElementById('main');
  if(m){
    if(state.currentSection === 'pos'){
      if(state.posTab === 'sales' && typeof renderPosSalesLog === 'function') renderPosSalesLog(m);
      else if(typeof renderPosSell === 'function') renderPosSell(m);
    } else if(state.currentSection === 'cashdrawer' && typeof renderCashDrawerPage === 'function'){
      renderCashDrawerPage(m);
    } else if(typeof render === 'function'){
      render();
    }
  }

  return shift;
}

/* ---------------- Interactive Shift Modals ---------------- */
function openStartShiftModal(onStarted){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '12000';

  const defaultCashier = state.user ? state.user.name : 'الكاشير';
  const lastShift = (state.shifts || [])[0];
  const suggestedFloat = lastShift && lastShift.actualCash != null ? Math.min(lastShift.actualCash, 500) : 200;

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:440px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
        <h3 style="margin:0;font-size:16px;color:var(--ink);display:flex;align-items:center;gap:8px;">
          <span>${getSvgIcon('pos', 18)}</span>
          <span>بدء وفتح وردية كاشير جديدة</span>
        </h3>
        <button class="btn btn-ghost btn-xs" id="closeStartShiftModal" style="font-size:18px;line-height:1;">&times;</button>
      </div>

      <div class="field">
        <label>مسؤول الوردية (الكاشير) *</label>
        <input id="shiftCashierName" value="${escapeHtml(defaultCashier)}" style="font-weight:800;">
      </div>

      <div class="field">
        <label>الرصيد الافتتاحي بالدرج (فكة / عهدة البداية) (ج.م) *</label>
        <input id="shiftOpeningFloat" type="number" min="0" step="any" value="${suggestedFloat}" class="mono font-bold" style="font-size:16px;direction:ltr;text-align:right;">
        <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;">
          <button type="button" class="btn btn-ghost btn-xs shift-preset-btn" data-amt="0">0 ج.م</button>
          <button type="button" class="btn btn-ghost btn-xs shift-preset-btn" data-amt="100">100 ج.م</button>
          <button type="button" class="btn btn-ghost btn-xs shift-preset-btn" data-amt="200">200 ج.م</button>
          <button type="button" class="btn btn-ghost btn-xs shift-preset-btn" data-amt="500">500 ج.م</button>
          <button type="button" class="btn btn-ghost btn-xs shift-preset-btn" data-amt="1000">1000 ج.م</button>
        </div>
      </div>

      <div class="field">
        <label>ملاحظات الافتتاح (اختياري)</label>
        <input id="shiftOpeningNotes" placeholder="مثال: استلام فكة من الخزينة الرئيسية...">
      </div>

      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;border-top:1px solid var(--line);padding-top:12px;">
        <button class="btn btn-ghost" id="cancelStartShiftModal">إلغاء</button>
        <button class="btn btn-primary" id="confirmStartShiftModal" style="font-weight:900;display:inline-flex;align-items:center;gap:6px;">
          ${getSvgIcon('check', 14)} تأكيد فتح الوردية
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelectorAll('.shift-preset-btn').forEach(btn => {
    btn.onclick = () => {
      document.getElementById('shiftOpeningFloat').value = btn.dataset.amt;
    };
  });

  const close = () => overlay.remove();
  document.getElementById('closeStartShiftModal').onclick = close;
  document.getElementById('cancelStartShiftModal').onclick = close;

  document.getElementById('confirmStartShiftModal').onclick = () => {
    const floatVal = parseFloat(toEngDigits(document.getElementById('shiftOpeningFloat').value)) || 0;
    const notes = document.getElementById('shiftOpeningNotes').value.trim();
    const cashier = document.getElementById('shiftCashierName').value.trim();
    if(cashier && state.user) state.user.name = cashier;

    startNewShift(floatVal, notes);
    close();

    if(typeof onStarted === 'function') onStarted();
    else {
      const m = document.getElementById('main');
      if(m){
        if(state.currentSection === 'pos'){
          if(state.posTab === 'sales' && typeof renderPosSalesLog === 'function') renderPosSalesLog(m);
          else if(typeof renderPosSell === 'function') renderPosSell(m);
        } else if(state.currentSection === 'cashdrawer' && typeof renderCashDrawerPage === 'function'){
          renderCashDrawerPage(m);
        } else if(typeof render === 'function'){
          render();
        }
      }
    }
  };
}

function openCloseShiftModal(){
  const shift = state.activeShift;
  if(!shift){
    showToast('لا توجد وردية نشطة حالياً لإغلاقها', 'error');
    return;
  }

  const stats = calculateShiftStats(shift);
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '12000';

  const durationStr = formatShiftDuration(shift.startTime);

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:580px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
        <div>
          <h3 style="margin:0;font-size:17px;color:var(--ink);display:flex;align-items:center;gap:8px;">
            <span>${getSvgIcon('lock', 18)}</span>
            <span>تقفيل ومطابقة الوردية رقم #${shift.shiftNumber} (Z-Report)</span>
          </h3>
          <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">
            الكاشير: <b>${escapeHtml(shift.cashierName)}</b> • المدة: <b>${durationStr}</b>
          </div>
        </div>
        <button class="btn btn-ghost btn-xs" id="closeCloseShiftModal" style="font-size:18px;line-height:1;">&times;</button>
      </div>

      <!-- Financial Snapshot Cards -->
      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;background:var(--paper2);padding:10px;border-radius:var(--radius-sm);margin-bottom:14px;">
        <div style="text-align:center;">
          <div style="font-size:10.5px;color:var(--ink-secondary);">الرصيد الافتتاحي</div>
          <div class="num mono font-bold" style="font-size:14px;color:var(--ink);">${stats.openingFloat.toLocaleString()} ج.م</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:10.5px;color:var(--green-text);">مبيعات ونقدية واردة (+)</div>
          <div class="num mono font-bold" style="font-size:14px;color:var(--green-text);">+${stats.totalCashIn.toLocaleString()} ج.م</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:10.5px;color:var(--red-text);">منصرفات ومسحوبات (-)</div>
          <div class="num mono font-bold" style="font-size:14px;color:var(--red-text);">-${stats.totalCashOut.toLocaleString()} ج.م</div>
        </div>
      </div>

      <!-- Expected Cash in Drawer Callout -->
      <div style="background:linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);border:1.5px solid #93c5fd;border-radius:8px;padding:12px 14px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:11.5px;font-weight:800;color:#1e40af;display:flex;align-items:center;gap:6px;">
            ${getSvgIcon('cashdrawer', 16)} النقدية المتوقعة بالدرج (حساب النظام):
          </div>
          <div style="font-size:11px;color:#3b82f6;">الافتتاحي + المبيعات النقدية + الصيانة - المنصرفات</div>
        </div>
        <div class="num mono font-bold" style="font-size:20px;color:#1e3a8a;">
          ${stats.expectedCash.toLocaleString()} <span style="font-size:12px;">ج.م</span>
        </div>
      </div>

      <!-- Actual Cash Input & Live Discrepancy Indicator -->
      <div class="card" style="padding:14px;margin-bottom:14px;border:2px solid var(--primary);">
        <label style="font-size:13px;font-weight:900;color:var(--ink);display:block;margin-bottom:6px;">
          النقدية الفعلية المحصية بالدرج الآن (ج.م) *
        </label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input id="actualCountedCashInp" type="number" step="any" placeholder="اكتب المبلغ الفعلي بالدرج..." class="mono font-bold" style="font-size:18px;direction:ltr;text-align:right;flex:1;" autofocus>
          <button type="button" class="btn btn-ghost btn-sm" id="matchExpectedBtn" style="white-space:nowrap;font-weight:700;display:inline-flex;align-items:center;gap:4px;">${getSvgIcon('check', 13)} مطابق للمتوقع</button>
        </div>

        <div id="liveDiscrepancyBadge" style="margin-top:10px;padding:8px 12px;border-radius:6px;font-size:12px;font-weight:800;display:none;"></div>
      </div>

      <div class="field">
        <label>ملاحظات إقفال الوردية (سبب العجز أو الزيادة إن وجد)</label>
        <input id="shiftClosingNotes" placeholder="اكتب أي ملاحظة للإدارة بخصوص الدرج...">
      </div>

      <!-- Actions -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;border-top:1px solid var(--line);padding-top:12px;flex-wrap:wrap;gap:8px;">
        <button class="btn btn-ghost btn-sm" id="cancelCloseShiftModal">إلغاء</button>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-ghost btn-sm" id="closeShiftA4Btn" style="border:1px solid var(--line);display:inline-flex;align-items:center;gap:6px;">${getSvgIcon('fileText', 14)} إغلاق مع تقرير A4</button>
          <button class="btn btn-primary btn-sm" id="closeShiftThermalBtn" style="font-weight:900;background:#059669;border-color:#059669;display:inline-flex;align-items:center;gap:6px;">
            ${getSvgIcon('printer', 14)} إغلاق وطباعة تقرير Z حراري (80mm)
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const inp = document.getElementById('actualCountedCashInp');
  const badge = document.getElementById('liveDiscrepancyBadge');

  const updateDiscrepancy = () => {
    const valStr = inp.value.trim();
    if(valStr === ''){
      badge.style.display = 'none';
      return;
    }
    const actual = parseFloat(toEngDigits(valStr)) || 0;
    const diff = actual - stats.expectedCash;

    badge.style.display = 'block';
    if(diff === 0){
      badge.style.background = '#dcfce7';
      badge.style.color = '#15803d';
      badge.style.border = '1px solid #86efac';
      badge.innerHTML = `الرصيد الفعلي مطابق للنظام تماماً (0.00 ج.م)`;
    } else if(diff < 0){
      badge.style.background = '#fee2e2';
      badge.style.color = '#b91c1c';
      badge.style.border = '1px solid #fca5a5';
      badge.innerHTML = `يوجد عجز نقدي بالدرج بقيمة: <b>${Math.abs(diff).toLocaleString()} ج.م</b>`;
    } else {
      badge.style.background = '#e0f2fe';
      badge.style.color = '#0369a1';
      badge.style.border = '1px solid #7dd3fc';
      badge.innerHTML = `توجد زيادة نقدية بالدرج بقيمة: <b>+${diff.toLocaleString()} ج.م</b>`;
    }
  };

  inp.oninput = updateDiscrepancy;
  document.getElementById('matchExpectedBtn').onclick = () => {
    inp.value = stats.expectedCash;
    updateDiscrepancy();
  };

  const close = () => overlay.remove();
  document.getElementById('closeCloseShiftModal').onclick = close;
  document.getElementById('cancelCloseShiftModal').onclick = close;

  const doClose = (format) => {
    const actual = parseFloat(toEngDigits(inp.value));
    if(isNaN(actual)){
      showToast('يرجى كتابة النقدية الفعلية المحصية بالدرج أولاً', 'error');
      inp.focus();
      return;
    }
    const notes = document.getElementById('shiftClosingNotes').value.trim();
    closeActiveShift(actual, notes, format);
    close();
  };

  document.getElementById('closeShiftThermalBtn').onclick = () => doClose('thermal');
  document.getElementById('closeShiftA4Btn').onclick = () => doClose('a4');
}

/* ---------------- Professional Shift Print Engine (Z-Report & X-Report) ---------------- */
function openShiftPrint(shift, mode = 'Z', format = 'thermal'){
  if(!shift) return;
  const stats = shift.stats || calculateShiftStats(shift);
  if(!stats) return;

  const shopName = (state.settings && state.settings.shopName) || 'صيانة ميكروتك';
  const logoUrl = state.settings && state.settings.logoUrl;
  const shopPhone = state.settings && (state.settings.shopPhone || state.settings.shopWhatsapp);
  const taxNumber = state.settings && state.settings.shopTaxNumber;
  const isZ = mode === 'Z';
  const reportTitle = isZ ? 'تقرير إقفال الوردية النهائي (Z-REPORT)' : 'تقرير قراءة الوردية اللحظية (X-REPORT)';

  const prnSettings = getPrintersSettings();
  const rPrn = prnSettings.receiptPrinter || DEFAULT_PRINTERS_SETTINGS.receiptPrinter;
  const is58mm = rPrn.paperSize === '58mm';
  const thermalPrintWidth = is58mm ? '48mm' : (rPrn.paperSize === '76mm' ? '70mm' : '72mm');

  const old = document.getElementById('printMount');
  if(old) old.remove();

  const mount = document.createElement('div');
  mount.id = 'printMount';

  if(format === 'thermal'){
    document.body.classList.add('printing-pos-receipt');
    document.body.classList.remove('printing-sticker');

    // Ensure style injection
    let receiptStyle = document.getElementById('dynamicThermalReceiptStyle');
    if(!receiptStyle){
      receiptStyle = document.createElement('style');
      receiptStyle.id = 'dynamicThermalReceiptStyle';
      document.head.appendChild(receiptStyle);
    }
    receiptStyle.innerHTML = `
      @media print {
        @page { size: ${is58mm ? '58mm' : '80mm'} auto !important; margin: 0mm !important; }
        html, body {
          width: 100% !important; max-width: ${thermalPrintWidth} !important;
          margin: 0 !important; padding: 0 !important; background: #fff !important; color: #000 !important;
        }
        body.printing-pos-receipt #app, body.printing-pos-receipt .sidebar, body.printing-pos-receipt .top-header,
        body.printing-pos-receipt #toastContainer { display: none !important; }
        body.printing-pos-receipt #printMount { display: block !important; width: 100% !important; }
      }
    `;

    mount.innerHTML = `
      <div style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#000;padding:4mm 2mm;line-height:1.35;direction:rtl;text-align:right;">
        ${logoUrl ? `<div style="text-align:center;margin-bottom:3px;"><img src="${logoUrl}" style="max-height:36px;max-width:140px;object-fit:contain;filter:grayscale(100%);"></div>` : ''}
        <div style="text-align:center;font-weight:900;font-size:14px;margin-bottom:2px;">${escapeHtml(shopName)}</div>
        ${taxNumber ? `<div style="text-align:center;font-size:9.5px;">ت ضريبي: ${escapeHtml(taxNumber)}</div>` : ''}
        ${shopPhone ? `<div style="text-align:center;font-size:9.5px;direction:ltr;">هاتف: ${escapeHtml(shopPhone)}</div>` : ''}
        
        <div style="border-top:1.5px dashed #000;margin:6px 0;"></div>
        
        <div style="text-align:center;font-weight:900;font-size:12.5px;margin-bottom:2px;">
          ${reportTitle}
        </div>
        <div style="text-align:center;font-size:10px;font-weight:700;">
          وردية رقم: #${shift.shiftNumber || 1} • ${shift.status === 'closed' ? 'مغلقة' : 'مفتوحة'}
        </div>

        <div style="border-top:1px dashed #000;margin:5px 0;"></div>

        <div style="display:flex;justify-content:space-between;font-size:10px;">
          <span>الكاشير:</span><b>${escapeHtml(shift.cashierName)}</b>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;">
          <span>البداية:</span><span class="mono">${cleanDate(shift.startTime)} ${cleanTime(shift.startTime)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;">
          <span>${isZ ? 'الإغلاق:' : 'القراءة:'}</span><span class="mono">${cleanDate(shift.endTime||new Date().toISOString())} ${cleanTime(shift.endTime||new Date().toISOString())}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;">
          <span>المدة:</span><b>${formatShiftDuration(shift.startTime, shift.endTime)}</b>
        </div>

        <div style="border-top:1.5px dashed #000;margin:6px 0;"></div>

        <div style="font-weight:900;font-size:11px;margin-bottom:3px;text-align:center;">--- حركة النقدية بالدرج (CASH) ---</div>

        <div style="display:flex;justify-content:space-between;font-size:10.5px;">
          <span>الرصيد الافتتاحي:</span><b class="mono">${stats.openingFloat.toLocaleString()} ج.م</b>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10.5px;">
          <span>مبيعات الكاشير (+) :</span><b class="mono">+${stats.posCash.toLocaleString()} ج.م</b>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10.5px;">
          <span>مقبوضات صيانة (+) :</span><b class="mono">+${stats.maintCash.toLocaleString()} ج.م</b>
        </div>
        ${stats.manualDrawerIn > 0 ? `
          <div style="display:flex;justify-content:space-between;font-size:10.5px;">
            <span>توريد يدوي للدرج (+) :</span><b class="mono">+${stats.manualDrawerIn.toLocaleString()} ج.م</b>
          </div>
        ` : ''}
        <div style="display:flex;justify-content:space-between;font-size:10.5px;">
          <span>مصروفات ونثريات (-) :</span><b class="mono">-${(stats.expensesCash + stats.pettyCash).toLocaleString()} ج.م</b>
        </div>
        ${stats.manualDrawerOut > 0 ? `
          <div style="display:flex;justify-content:space-between;font-size:10.5px;">
            <span>مسحوبات نقدية (-) :</span><b class="mono">-${stats.manualDrawerOut.toLocaleString()} ج.م</b>
          </div>
        ` : ''}
        ${stats.returnsCash > 0 ? `
          <div style="display:flex;justify-content:space-between;font-size:10.5px;">
            <span>مرتجع مبيعات نقدي (-) :</span><b class="mono">-${stats.returnsCash.toLocaleString()} ج.م</b>
          </div>
        ` : ''}
        ${stats.maintRefundsCash > 0 ? `
          <div style="display:flex;justify-content:space-between;font-size:10.5px;">
            <span>مردودات صيانة نقدية (-) :</span><b class="mono">-${stats.maintRefundsCash.toLocaleString()} ج.م</b>
          </div>
        ` : ''}

        <div style="border-top:1px dashed #000;margin:4px 0;"></div>

        <div style="display:flex;justify-content:space-between;font-weight:900;font-size:11.5px;">
          <span>الدرج المتوقع (نظام):</span><b class="mono">${stats.expectedCash.toLocaleString()} ج.م</b>
        </div>

        ${isZ && stats.actualCash != null ? `
          <div style="display:flex;justify-content:space-between;font-weight:900;font-size:11.5px;margin-top:2px;">
            <span>الدرج الفعلي (محصي):</span><b class="mono">${stats.actualCash.toLocaleString()} ج.م</b>
          </div>
          <div style="display:flex;justify-content:space-between;font-weight:900;font-size:11.5px;margin-top:2px;">
            <span>الفارق (عجز/زيادة):</span><b class="mono" style="${stats.discrepancy < 0 ? 'text-decoration:underline;' : ''}">${stats.discrepancy === 0 ? '0.00 (مطابق)' : (stats.discrepancy > 0 ? `+${stats.discrepancy.toLocaleString()} (زيادة)` : `${stats.discrepancy.toLocaleString()} (عجز)`)}</b>
          </div>
        ` : ''}

        <div style="border-top:1.5px dashed #000;margin:6px 0;"></div>

        <div style="font-weight:900;font-size:11px;margin-bottom:3px;text-align:center;">--- قنوات الدفع الإضافية ---</div>

        <div style="display:flex;justify-content:space-between;font-size:10px;">
          <span>فيزا وبطاقات:</span><b class="mono">${stats.posCard.toLocaleString()} ج.م</b>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;">
          <span>إنستاباي (InstaPay):</span><b class="mono">${stats.posInstapay.toLocaleString()} ج.م</b>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;">
          <span>محافظ إلكترونية:</span><b class="mono">${stats.posWallet.toLocaleString()} ج.م</b>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;">
          <span>مبيعات آجلة (حساب):</span><b class="mono">${stats.posCredit.toLocaleString()} ج.م</b>
        </div>

        <div style="border-top:1px dashed #000;margin:4px 0;"></div>

        <div style="display:flex;justify-content:space-between;font-weight:900;font-size:12px;">
          <span>إجمالي الإيرادات الشامل:</span><b class="mono">${stats.totalTurnover.toLocaleString()} ج.م</b>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;margin-top:2px;">
          <span>عدد عمليات البيع:</span><b class="mono">${stats.posSalesCount} فاتورة (${stats.itemsSoldCount} قطعة)</b>
        </div>

        ${shift.closingNotes ? `
          <div style="border-top:1px dashed #000;margin:5px 0;"></div>
          <div style="font-size:10px;"><b>ملاحظات الإقفال:</b> ${escapeHtml(shift.closingNotes)}</div>
        ` : ''}

        <div style="border-top:1.5px dashed #000;margin:6px 0;"></div>

        <div style="margin-top:12px;display:flex;justify-content:space-between;font-size:10px;text-align:center;">
          <div style="width:48%;">
            توقيع الكاشير<br><br>......................
          </div>
          <div style="width:48%;">
            توقيع الإدارة<br><br>......................
          </div>
        </div>

        <div style="text-align:center;font-size:9px;margin-top:10px;color:#555;">
          نظام ميكروERP • تقفيل وردية معتمد
        </div>
      </div>
    `;
  } else {
    // A4 / A5 Corporate Format
    document.body.classList.remove('printing-pos-receipt');
    document.body.classList.remove('printing-sticker');

    mount.innerHTML = `
      <div style="width:100%;max-width:760px;margin:0 auto;background:#fff;padding:24px;color:#0f172a;font-family:var(--font-main);border-radius:8px;box-sizing:border-box;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:10px;margin-bottom:14px;">
          <div>
            ${logoUrl ? `<img src="${logoUrl}" style="max-height:36px;max-width:140px;object-fit:contain;margin-bottom:4px;">` : ''}
            <h2 style="margin:0;font-size:19px;font-weight:900;color:#0f172a;">${escapeHtml(shopName)}</h2>
            <div style="font-size:12px;color:#475569;margin-top:2px;">${reportTitle}</div>
          </div>
          <div style="text-align:left;">
            <div style="background:#0f172a;color:#fff;font-size:13px;font-weight:900;padding:4px 12px;border-radius:4px;display:inline-block;" class="mono">
              وردية #${shift.shiftNumber || 1}
            </div>
            <div style="font-size:11px;color:#64748b;margin-top:4px;">الكاشير: <b>${escapeHtml(shift.cashierName)}</b></div>
            <div style="font-size:11px;color:#64748b;">المدة: <b>${formatShiftDuration(shift.startTime, shift.endTime)}</b></div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:10px;margin-bottom:16px;">
          <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:8px 10px;text-align:center;">
            <div style="font-size:11px;color:#64748b;">الرصيد الافتتاحي</div>
            <div class="num mono font-bold" style="font-size:16px;color:#0f172a;">${stats.openingFloat.toLocaleString()} ج.م</div>
          </div>
          <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:6px;padding:8px 10px;text-align:center;">
            <div style="font-size:11px;color:#047857;">نقدية الدرج المتوقعة</div>
            <div class="num mono font-bold" style="font-size:16px;color:#047857;">${stats.expectedCash.toLocaleString()} ج.م</div>
          </div>
          <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:8px 10px;text-align:center;">
            <div style="font-size:11px;color:#0369a1;">النقدية المحصية الفعلية</div>
            <div class="num mono font-bold" style="font-size:16px;color:#0369a1;">${stats.actualCash != null ? stats.actualCash.toLocaleString() + ' ج.م' : 'قيد التشغيل'}</div>
          </div>
          <div style="background:${stats.discrepancy < 0 ? '#fef2f2' : '#f0fdf4'};border:1px solid ${stats.discrepancy < 0 ? '#fecaca' : '#bbf7d0'};border-radius:6px;padding:8px 10px;text-align:center;">
            <div style="font-size:11px;color:${stats.discrepancy < 0 ? '#dc2626' : '#16a34a'};">الفارق / المطابقة</div>
            <div class="num mono font-bold" style="font-size:16px;color:${stats.discrepancy < 0 ? '#dc2626' : '#16a34a'};">${stats.discrepancy === 0 ? 'مطابق' : (stats.discrepancy > 0 ? `+${stats.discrepancy.toLocaleString()} ج.م` : `${stats.discrepancy.toLocaleString()} ج.م`)}</div>
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:12px;">
          <thead>
            <tr style="background:#0f172a;color:#fff;">
              <th style="padding:6px 10px;text-align:right;">بند الحركة المالية</th>
              <th style="padding:6px 10px;text-align:center;">عدد العمليات</th>
              <th style="padding:6px 10px;text-align:left;">المبلغ الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:6px 10px;font-weight:700;">مبيعات الكاشير النقدية (POS Cash)</td>
              <td style="padding:6px 10px;text-align:center;" class="mono">${stats.posSalesCount}</td>
              <td style="padding:6px 10px;text-align:left;font-weight:800;color:#16a34a;" class="mono">+${stats.posCash.toLocaleString()} ج.م</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:6px 10px;font-weight:700;">مقبوضات الصيانة النقدية</td>
              <td style="padding:6px 10px;text-align:center;" class="mono">${stats.maintPaymentsCount}</td>
              <td style="padding:6px 10px;text-align:left;font-weight:800;color:#16a34a;" class="mono">+${stats.maintCash.toLocaleString()} ج.م</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:6px 10px;font-weight:700;">فيزا وبطاقات ائتمان</td>
              <td style="padding:6px 10px;text-align:center;" class="mono">-</td>
              <td style="padding:6px 10px;text-align:left;font-weight:800;color:#2563eb;" class="mono">${stats.posCard.toLocaleString()} ج.م</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:6px 10px;font-weight:700;">إنستاباي ومحافظ إلكترونية</td>
              <td style="padding:6px 10px;text-align:center;" class="mono">-</td>
              <td style="padding:6px 10px;text-align:left;font-weight:800;color:#d97706;" class="mono">${(stats.posInstapay + stats.posWallet).toLocaleString()} ج.م</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:6px 10px;font-weight:700;">منصرفات ومسحوبات الدرج</td>
              <td style="padding:6px 10px;text-align:center;" class="mono">-</td>
              <td style="padding:6px 10px;text-align:left;font-weight:800;color:#dc2626;" class="mono">-${stats.totalCashOut.toLocaleString()} ج.م</td>
            </tr>
            <tr style="background:#f8fafc;font-weight:900;">
              <td style="padding:8px 10px;font-size:13px;">إجمالي حركة المبيعات الشاملة</td>
              <td style="padding:8px 10px;text-align:center;" class="mono">${stats.transactionsCount}</td>
              <td style="padding:8px 10px;text-align:left;font-size:14px;color:#0f172a;" class="mono">${stats.totalTurnover.toLocaleString()} ج.م</td>
            </tr>
          </tbody>
        </table>

        ${shift.closingNotes ? `<div style="background:#f1f5f9;padding:10px;border-radius:6px;font-size:11.5px;margin-bottom:16px;"><b>ملاحظات الإقفال:</b> ${escapeHtml(shift.closingNotes)}</div>` : ''}

        <div style="display:flex;justify-content:space-between;margin-top:24px;border-top:1px solid #cbd5e1;padding-top:14px;font-size:11.5px;">
          <div style="text-align:center;width:40%;">
            <div>توقيع الكاشير المسؤول</div>
            <div style="margin-top:30px;border-bottom:1px dashed #94a3b8;width:75%;margin-left:auto;margin-right:auto;"></div>
          </div>
          <div style="text-align:center;width:40%;">
            <div>اعتماد الإدارة والمراجعة</div>
            <div style="margin-top:30px;border-bottom:1px dashed #94a3b8;width:75%;margin-left:auto;margin-right:auto;"></div>
          </div>
        </div>
      </div>
    `;
  }

  document.body.appendChild(mount);
  setTimeout(() => {
    window.print();
    mount.remove();
    document.body.classList.remove('printing-pos-receipt');
  }, 250);
}

/* ---------------- Shift History Modal ---------------- */
function openShiftsHistoryModal(){
  const shiftsList = state.shifts || [];
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '12000';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:850px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
        <h3 style="margin:0;font-size:17px;color:var(--ink);display:flex;align-items:center;gap:8px;">
          <span>${getSvgIcon('archive', 18)}</span>
          <span>سجل تقارير الورديات السابقة (Z-Reports Archive)</span>
        </h3>
        <button class="btn btn-ghost btn-xs" id="closeShiftsHistoryModal" style="font-size:18px;line-height:1;">&times;</button>
      </div>

      ${shiftsList.length === 0 ? `
        <div class="card empty" style="padding:40px;text-align:center;">
          لا توجد ورديات سابقة مسجلة ومغلقة حتى الآن.
        </div>
      ` : `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th style="width:70px;">الوردية</th>
                <th>الكاشير</th>
                <th>البداية والإغلاق</th>
                <th>المدة</th>
                <th>الافتتاحي</th>
                <th>المتوقع</th>
                <th>الفعلي</th>
                <th>الفارق</th>
                <th style="text-align:center;width:140px;">الطباعة</th>
              </tr>
            </thead>
            <tbody>
              ${shiftsList.map(s => {
                const stats = s.stats || calculateShiftStats(s) || {};
                const disc = s.discrepancy != null ? s.discrepancy : (stats.discrepancy || 0);
                const discColor = disc === 0 ? 'var(--green-text)' : (disc < 0 ? 'var(--red-text)' : 'var(--blue-text)');
                const discText = disc === 0 ? 'مطابق' : (disc > 0 ? `+${disc.toLocaleString()}` : `${disc.toLocaleString()}`);

                return `
                  <tr>
                    <td class="mono font-bold" style="color:var(--primary);">#${s.shiftNumber || 1}</td>
                    <td style="font-weight:700;">${escapeHtml(s.cashierName)}</td>
                    <td style="font-size:11px;color:var(--ink-secondary);">
                      <div>${cleanDate(s.startTime)} (${cleanTime(s.startTime)})</div>
                      <div>${cleanDate(s.endTime)} (${cleanTime(s.endTime)})</div>
                    </td>
                    <td style="font-size:11px;">${formatShiftDuration(s.startTime, s.endTime)}</td>
                    <td class="mono">${Number(s.openingFloat||0).toLocaleString()} ج.م</td>
                    <td class="mono font-bold">${Number(stats.expectedCash||0).toLocaleString()} ج.م</td>
                    <td class="mono font-bold">${s.actualCash != null ? Number(s.actualCash).toLocaleString() + ' ج.م' : '-'}</td>
                    <td class="mono font-bold" style="color:${discColor};">${discText}</td>
                    <td style="text-align:center;">
                      <div style="display:flex;gap:4px;justify-content:center;">
                        <button class="btn btn-xs btn-ghost" data-printzthermal="${s.id}" title="طباعة إيصال Z حراري 80mm" style="display:inline-flex;align-items:center;gap:3px;">${getSvgIcon('printer', 12)} Z حراري</button>
                        <button class="btn btn-xs btn-ghost" data-printza4="${s.id}" title="طباعة تقرير Z إداري A4" style="display:inline-flex;align-items:center;gap:3px;">${getSvgIcon('fileText', 12)} A4</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('closeShiftsHistoryModal').onclick = () => overlay.remove();

  overlay.querySelectorAll('[data-printzthermal]').forEach(btn => {
    btn.onclick = () => {
      const s = shiftsList.find(x => x.id === btn.dataset.printzthermal);
      if(s) openShiftPrint(s, 'Z', 'thermal');
    };
  });

  overlay.querySelectorAll('[data-printza4]').forEach(btn => {
    btn.onclick = () => {
      const s = shiftsList.find(x => x.id === btn.dataset.printza4);
      if(s) openShiftPrint(s, 'Z', 'a4');
    };
  });
}

function openDailyClosePrint(date, stats, list){
  document.body.classList.remove('printing-sticker');
  const old = document.getElementById('printMount');
  if(old) old.remove();
  const mount = document.createElement('div');
  mount.id='printMount';

  const maintIn = list.filter(t=>t.sourceType==='maintenance').reduce((s,t)=>s+Number(t.in||0), 0);
  const posIn = list.filter(t=>t.sourceType==='pos').reduce((s,t)=>s+Number(t.in||0), 0);

  mount.innerHTML = `
  <div style="width:100%;max-width:750px;margin:0 auto;background:#fff;padding:22px 26px;color:#0f172a;font-family:var(--font-main);border-radius:8px;box-sizing:border-box;">
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:10px;margin-bottom:12px;">
      <div>
        ${state.settings.logoUrl ? `<img src="${state.settings.logoUrl}" style="max-height:34px;max-width:130px;object-fit:contain;margin-bottom:3px;">` : ''}
        <h2 style="margin:0;font-size:18px;font-weight:900;color:#0f172a;">${state.settings.shopName || 'صيانة ميكروتك'}</h2>
        <div style="font-size:11.5px;color:#475569;margin-top:2px;">كشف حركة اليومية وتقفيل الخزينة والوردية (Daily Shift Close)</div>
      </div>
      <div style="text-align:left;">
        <div style="background:#0f172a;color:#fff;font-size:13px;font-weight:900;padding:3px 10px;border-radius:4px;display:inline-block;" class="mono">${date}</div>
        <div style="font-size:10.5px;color:#64748b;margin-top:3px;">الوقت: <b>${new Date().toLocaleTimeString('ar-EG')}</b></div>
        <div style="font-size:10.5px;color:#64748b;">المستخدم: <b>${state.user ? state.user.name : 'أمين الخزينة'}</b></div>
      </div>
    </div>

    <!-- Summary Box (Separated Maintenance vs Sales) -->
    <div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:8px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:10px 12px;margin-bottom:14px;text-align:center;">
      <div style="background:#e0f2fe;border-radius:4px;padding:4px 6px;">
        <div style="font-size:10px;color:#0369a1;font-weight:800;display:flex;align-items:center;justify-content:center;gap:4px;">${getSvgIcon('maintenance', 11)} إيرادات الصيانة (4101)</div>
        <div style="font-size:13.5px;font-weight:900;color:#0284c7;" class="mono">${maintIn.toLocaleString()} ج.م</div>
      </div>
      <div style="background:#dcfce7;border-radius:4px;padding:4px 6px;">
        <div style="font-size:10px;color:#15803d;font-weight:800;display:flex;align-items:center;justify-content:center;gap:4px;">${getSvgIcon('pos', 11)} مبيعات POS (4102)</div>
        <div style="font-size:13.5px;font-weight:900;color:#16a34a;" class="mono">${posIn.toLocaleString()} ج.م</div>
      </div>
      <div>
        <div style="font-size:10px;color:#64748b;display:flex;align-items:center;justify-content:center;gap:4px;">${getSvgIcon('trendUp', 11)} إجمالي المقبوضات</div>
        <div style="font-size:13.5px;font-weight:900;color:#16a34a;" class="mono">${stats.totalIn.toLocaleString()} ج.م</div>
      </div>
      <div>
        <div style="font-size:10px;color:#64748b;display:flex;align-items:center;justify-content:center;gap:4px;">${getSvgIcon('trendDown', 11)} إجمالي المنصرف</div>
        <div style="font-size:13.5px;font-weight:900;color:#dc2626;" class="mono">${stats.totalOut.toLocaleString()} ج.م</div>
      </div>
      <div style="background:#0f172a;color:#fff;border-radius:4px;padding:4px 6px;">
        <div style="font-size:10px;color:#cbd5e1;display:flex;align-items:center;justify-content:center;gap:4px;">${getSvgIcon('cashdrawer', 11)} الصافي الفعلي بالدرج</div>
        <div style="font-size:14px;font-weight:900;color:#38bdf8;" class="mono">${stats.netCash.toLocaleString()} ج.م</div>
      </div>
    </div>

    <!-- Transactions Table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:10.5px;">
      <thead>
        <tr style="background:#0f172a;color:#fff;">
          <th style="padding:5px 8px;text-align:right;">#</th>
          <th style="padding:5px 8px;text-align:right;">البيان والمعاملة</th>
          <th style="padding:5px 8px;text-align:right;">طريقة الدفع</th>
          <th style="padding:5px 8px;text-align:right;">القسم / المرجع</th>
          <th style="padding:5px 8px;text-align:center;">وارد (مدين)</th>
          <th style="padding:5px 8px;text-align:center;">منصرف (دائن)</th>
          <th style="padding:5px 8px;text-align:center;">الرصيد بعد الحركة</th>
        </tr>
      </thead>
      <tbody>
        ${list.map((t, idx)=>`
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:5px 8px;color:#64748b;" class="mono">${idx+1}</td>
            <td style="padding:5px 8px;font-weight:700;">${escapeHtml(t.title)}</td>
            <td style="padding:5px 8px;font-size:10px;font-weight:600;white-space:nowrap;">${escapeHtml(t.method || 'نقدي (كاش)')}</td>
            <td style="padding:5px 8px;color:#475569;">${escapeHtml(t.reference)}</td>
            <td style="padding:5px 8px;text-align:center;font-weight:800;color:#16a34a;" class="mono">${t.in > 0 ? Number(t.in).toLocaleString() : '-'}</td>
            <td style="padding:5px 8px;text-align:center;font-weight:800;color:#dc2626;" class="mono">${t.out > 0 ? Number(t.out).toLocaleString() : '-'}</td>
            <td style="padding:5px 8px;text-align:center;font-weight:900;" class="mono">${(Number(t.runningBalance)||0).toLocaleString()} ج.م</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Signatures -->
    <div style="display:flex;justify-content:space-between;margin-top:20px;font-size:11px;color:#475569;border-top:1px solid #cbd5e1;padding-top:10px;">
      <div style="text-align:center;width:45%;">
        <div>توقيع أمين الخزينة / الكاشير</div>
        <div style="margin-top:25px;border-bottom:1px dashed #94a3b8;width:75%;margin-left:auto;margin-right:auto;"></div>
      </div>
      <div style="text-align:center;width:45%;">
        <div>توقيع المدير المالي / المراجع</div>
        <div style="margin-top:25px;border-bottom:1px dashed #94a3b8;width:75%;margin-left:auto;margin-right:auto;"></div>
      </div>
    </div>
  </div>`;

  document.body.appendChild(mount);
  setTimeout(()=>{ window.print(); mount.remove(); }, 250);
}

/* ---------------- Helper: Accounting Badge for Daily Journal ---------------- */
function getAccountBadgeHtml(t){
  if(t.sourceType === 'maintenance'){
    return `<span class="badge" style="background:#e0f2fe;color:#0369a1;font-weight:800;border:1px solid #bae6fd;padding:3px 8px;border-radius:4px;font-size:11px;white-space:nowrap;display:inline-flex;align-items:center;gap:4px;">${getSvgIcon('maintenance', 12)} 4101 صيانة</span>`;
  }
  if(t.sourceType === 'pos'){
    return `<span class="badge" style="background:#dcfce7;color:#15803d;font-weight:800;border:1px solid #bbf7d0;padding:3px 8px;border-radius:4px;font-size:11px;white-space:nowrap;display:inline-flex;align-items:center;gap:4px;">${getSvgIcon('pos', 12)} 4102 مبيعات POS</span>`;
  }
  if(t.sourceType === 'pos_return' || t.accountCode === '4102-RET'){
    return `<span class="badge" style="background:#fee2e2;color:#b91c1c;font-weight:800;border:1px solid #fca5a5;padding:3px 8px;border-radius:4px;font-size:11px;white-space:nowrap;display:inline-flex;align-items:center;gap:4px;">${getSvgIcon('arrowLeft', 12)} 4102 مرتجع مبيعات</span>`;
  }
  if(t.sourceType === 'invoice'){
    return `<span class="badge" style="background:#f1f5f9;color:#334155;font-weight:800;border:1px solid #cbd5e1;padding:3px 8px;border-radius:4px;font-size:11px;white-space:nowrap;display:inline-flex;align-items:center;gap:4px;">${getSvgIcon('fileText', 12)} 4102 فواتير</span>`;
  }
  if(t.type === 'petty'){
    return `<span class="badge" style="background:#fef3c7;color:#b45309;font-weight:800;border:1px solid #fde68a;padding:3px 8px;border-radius:4px;font-size:11px;white-space:nowrap;display:inline-flex;align-items:center;gap:4px;">${getSvgIcon('wallet', 12)} 5204 نثريات</span>`;
  }
  if(t.sourceType === 'purchase'){
    return `<span class="badge" style="background:#ffedd5;color:#c2410c;font-weight:800;border:1px solid #fed7aa;padding:3px 8px;border-radius:4px;font-size:11px;white-space:nowrap;display:inline-flex;align-items:center;gap:4px;">${getSvgIcon('truck', 12)} 2101 موردين</span>`;
  }
  return `<span class="badge" style="background:#fee2e2;color:#b91c1c;font-weight:800;border:1px solid #fecaca;padding:3px 8px;border-radius:4px;font-size:11px;white-space:nowrap;display:inline-flex;align-items:center;gap:4px;">${getSvgIcon('dollar', 12)} ${escapeHtml(t.accountTag || '5200 مصروف')}</span>`;
}
