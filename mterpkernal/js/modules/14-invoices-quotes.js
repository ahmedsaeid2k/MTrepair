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
        <h2 class="page-title">📄 الفواتير الضريبية والرسمية</h2>
        <div class="subtitle mono" style="font-size:12px;color:var(--ink-secondary);">${list.length} فاتورة معروضة</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost btn-sm" id="exportInvoicesExcelBtn">📥 تصدير الفواتير Excel</button>
        <button class="btn btn-primary btn-sm" id="addNewInvoiceBtn">➕ إصدار فاتورة جديدة</button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="stat-grid">
      <div class="stat-card blue">
        <div class="top-row"><span class="lbl">إجمالي الفواتير الصادرة</span><div class="icon-box">📄</div></div>
        <div class="num mono">${totalInvoicesCount}</div>
      </div>
      <div class="stat-card purple">
        <div class="top-row"><span class="lbl">إجمالي قيمة الفواتير</span><div class="icon-box">💵</div></div>
        <div class="num mono">${totalInvoicedSum.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
      </div>
      <div class="stat-card green">
        <div class="top-row"><span class="lbl">إجمالي المحصل الفعلي</span><div class="icon-box">✅</div></div>
        <div class="num mono">${totalPaidSum.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
      </div>
      <div class="stat-card red">
        <div class="top-row"><span class="lbl">المستحقات المتبقية (آجل)</span><div class="icon-box">⏳</div></div>
        <div class="num mono">${totalRemainingSum.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
      </div>
    </div>

    <!-- Filters Bar -->
    <div class="filters-bar" style="margin-bottom:14px;">
      <input id="invSearchInp" placeholder="🔍 بحث برقم الفاتورة، اسم العميل، الهاتف، أو رقم إيصال الصيانة..." value="${state.invoiceSearchQ}" style="flex:1;min-width:240px;">
      <select id="invStatusFilterSelect" style="min-width:150px;">
        <option value="all" ${state.invoiceStatusFilter==='all'?'selected':''}>كل الحالات</option>
        <option value="paid" ${state.invoiceStatusFilter==='paid'?'selected':''}>✅ مدفوعة بالكامل</option>
        <option value="partial" ${state.invoiceStatusFilter==='partial'?'selected':''}>⚡ مدفوعة جزئياً</option>
        <option value="unpaid" ${state.invoiceStatusFilter==='unpaid'?'selected':''}>⏳ متبقي مستحق (آجل)</option>
      </select>
      ${(state.invoiceSearchQ || state.invoiceStatusFilter!=='all') ? `<button class="btn btn-ghost btn-sm" id="clearInvFilters">مسح الفلاتر</button>` : ''}
    </div>

    <div class="card">
      ${list.length===0 ? '<div class="empty">لا توجد فواتير مطابقة للبحث أو الفلتر المختار.</div>' : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>رقم الفاتورة</th>
              <th>التاريخ</th>
              <th>العميل</th>
              <th>المرجع</th>
              <th>الإجمالي</th>
              <th>المدفوع</th>
              <th>المتبقي</th>
              <th>حالة السداد</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${list.slice().reverse().map(inv=>{
              const isPaid = inv.Status === 'مدفوعة بالكامل' || Number(inv.Remaining||0) <= 0;
              const isPartial = inv.Status === 'مدفوعة جزئياً';

              return `
                <tr>
                  <td>
                    <span class="mono font-bold" style="color:var(--primary);font-size:13px;">${inv.InvoiceNumber}</span>
                  </td>
                  <td style="font-size:11.5px;color:var(--ink-secondary);">
                    ${cleanDate(inv.Date)}
                  </td>
                  <td>
                    <div style="font-weight:800;font-size:13px;">${inv.CustomerName}</div>
                    <div class="mono" style="font-size:11px;color:var(--ink-secondary);">${inv.CustomerPhone||'-'}</div>
                  </td>
                  <td>
                    ${inv.ReferenceType ? `<span class="status-badge st-check" style="font-size:10.5px;">${inv.ReferenceType==='Receipt'?'🛠️ إيصال #':inv.ReferenceType} ${inv.ReferenceID}</span>` : '<span style="color:var(--slate-400);font-size:11px;">مباشر</span>'}
                  </td>
                  <td class="mono font-bold" style="font-size:13px;">${Number(inv.Total||0).toLocaleString()} ج.م</td>
                  <td class="mono font-bold" style="color:var(--green);">${Number(inv.AmountPaid||0).toLocaleString()} ج.م</td>
                  <td class="mono font-bold" style="color:${Number(inv.Remaining||0)>0?'var(--red)':'var(--ink)'};">${Number(inv.Remaining||0).toLocaleString()} ج.م</td>
                  <td>
                    <span class="status-badge ${isPaid?'st-done':(isPartial?'st-repair':'st-failed')}">
                      ${isPaid?'✅ مدفوعة':(isPartial?'⚡ جزئي':'⏳ آجل')}
                    </span>
                  </td>
                  <td class="row-actions">
                    ${Number(inv.Remaining||0) > 0 ? `
                      <button class="btn btn-xs" style="background:#059669;color:#fff;font-weight:bold;" data-invact="pay" data-invid="${inv.ID}" title="تحصيل وسداد دفعة من المتبقي على الفاتورة">💵 تحصيل</button>
                    ` : ''}
                    <button class="btn btn-xs btn-blue" data-invact="print" data-invid="${inv.ID}" title="طباعة فاتورة ضريبية رسمية">🖨️ فاتورة</button>
                    <button class="btn btn-xs btn-purple" data-invact="barcode" data-invid="${inv.ID}" title="طباعة ملصقات باركود لأصناف الفاتورة">🏷️ باركود</button>
                    <button class="btn btn-xs btn-ghost" data-invact="printquote" data-invid="${inv.ID}" title="طباعة بيان سعر وعرض أسعار رسمي">📑 بيان سعر</button>
                    <button class="btn btn-xs btn-whatsapp" data-invact="wa" data-invid="${inv.ID}" title="إرسال الفاتورة عبر واتساب">${WA_ICON}</button>
                    <button class="btn btn-xs btn-red" data-invact="del" data-invid="${inv.ID}" title="${state.user.role==='admin'?'حذف الفاتورة':'طلب تصريح حذف من المدير'}">${state.user.role==='admin'?'🗑️':'🔒 طلب حذف'}</button>
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
  searchInput.oninput = (e)=>{ state.invoiceSearchQ = e.target.value; renderInvoicesPage(main); };
  const statusSel = document.getElementById('invStatusFilterSelect');
  statusSel.onchange = (e)=>{ state.invoiceStatusFilter = e.target.value; renderInvoicesPage(main); };
  const clearBtn = document.getElementById('clearInvFilters');
  if(clearBtn) clearBtn.onclick = ()=>{ state.invoiceSearchQ = ''; state.invoiceStatusFilter = 'all'; renderInvoicesPage(main); };

  document.getElementById('addNewInvoiceBtn').onclick = ()=>openInvoiceModal();
  document.getElementById('exportInvoicesExcelBtn').onclick = ()=>exportInvoicesToExcel(list);

  // Row action bindings
  main.querySelectorAll('[data-invact]').forEach(btn => {
    btn.onclick = async ()=>{
      const inv = state.invoices.find(x=>x.ID===btn.dataset.invid);
      if(!inv) return;
      const act = btn.dataset.invact;
      if(act==='pay'){
        openInvoicePaymentModal(inv, ()=>renderInvoicesPage(main));
      }
      if(act==='barcode'){
        openInvoiceBarcodePrintModal('invoice', inv.ID);
      }
      if(act==='print'){
        openInvoicePrint(inv, 'invoice');
      }
      if(act==='printquote'){
        openInvoicePrint(inv, 'quote');
      }
      if(act==='edit'){
        openInvoiceModal(inv);
      }
      if(act==='wa'){
        const phone = (inv.CustomerPhone||'').replace(/\D/g,'');
        const phoneFormatted = phone.startsWith('0') ? '2'+phone : phone;
        const msg = `مرحبًا ${inv.CustomerName}،\nفاتورة / بيان سعر رقم: ${inv.InvoiceNumber}\nإجمالي المستحق: ${inv.Total} ج.م\nالمدفوع: ${inv.AmountPaid} ج.م\nالمتبقي: ${inv.Remaining} ج.م\nشكرًا لتعاملكم مع ${state.settings.shopName || 'ميكروتك'}.`;
        window.open(`https://wa.me/${phoneFormatted}?text=${encodeURIComponent(msg)}`, '_blank');
      }
      if(act==='del'){
        requestAdminAuthorization({
          action: 'حذف فاتورة',
          entityType: 'فاتورة رسمية',
          entityId: inv.ID,
          entityTitle: `رقم ${inv.InvoiceNumber} (${inv.CustomerName})`,
          onApproved: async ()=>{
            try{
              await deleteInvoiceRemote(inv.ID);
              state.invoices = (state.invoices||[]).filter(x => x.ID !== inv.ID);
              showToast('تم حذف الفاتورة بنجاح', 'success');
              renderInvoicesPage(main);
            }catch(e){ showToast('تعذر الحذف: '+e.message, 'error'); }
          }
        });
      }
    };
  });
}

function renderInvoicesSectionApp(app){
  if(!canUserAccessSection('invoices')){
    showToast('⛔ ليس لديك صلاحية للوصول إلى قسم الفواتير', 'error');
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
          <span class="nav-item-icon">📄</span><span>سجل الفواتير وبيانات الأسعار</span>
        </div>

        ${hasFinanceNav ? `
          <div class="nav-section">القطاع المالي المرتبط</div>
          ${canUserAccessSection('cashdrawer') ? `
            <div class="nav-item" id="invToDrawerNav">
              <span class="nav-item-icon">💵</span><span>حركة الخزينة والدرج</span>
            </div>
          ` : ''}
          ${canUserAccessSection('daily') ? `
            <div class="nav-item" id="invToDailyNav">
              <span class="nav-item-icon">📔</span><span>دفتر اليومية العامة</span>
            </div>
          ` : ''}
          ${canUserAccessSection('finance') ? `
            <div class="nav-item" id="invToFinanceNav">
              <span class="nav-item-icon">💰</span><span>شجرة الحسابات والقيود</span>
            </div>
            <div class="nav-item" id="invToIncomeNav">
              <span class="nav-item-icon">📈</span><span>تقرير الأرباح والدخل</span>
            </div>
          ` : ''}
        ` : ''}

        ${hasQuickNav ? `
          <div class="nav-section">التنقل السريع</div>
          ${canUserAccessSection('maintenance') ? `
            <div class="nav-item" id="invToMaintNav">
              <span class="nav-item-icon">🛠️</span><span>قسم الصيانة</span>
            </div>
          ` : ''}
          ${canUserAccessSection('pos') ? `
            <div class="nav-item" id="invToPosNav">
              <span class="nav-item-icon">🧾</span><span>نقطة البيع (POS)</span>
            </div>
          ` : ''}
          ${canUserAccessSection('settings') ? `
            <div class="nav-item" id="invToSettingsNav">
              <span class="nav-item-icon">⚙️</span><span>الإعدادات</span>
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

function openInvoicePaymentModal(inv, onDone){
  if(!inv) return;
  const rem = typeof inv.Remaining !== 'undefined' ? Number(inv.Remaining || 0) : Math.max(0, Number(inv.Total||0) - Number(inv.AmountPaid||0));
  if(rem <= 0){
    showToast('هذه الفاتورة مسددة بالكامل بالفعل', 'info');
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '11000';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:540px;padding:24px;border-radius:16px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:16px;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="badge" style="background:#059669;color:#fff;font-weight:900;font-size:12px;padding:3px 8px;border-radius:6px;">💵 سداد وتحصيل من فاتورة</span>
            <h3 style="margin:0;font-size:17px;color:var(--ink);">${escapeHtml(inv.InvoiceNumber || inv.ID)}</h3>
          </div>
          <div style="font-size:12px;color:var(--ink-secondary);margin-top:4px;">
            العميل: <b style="color:var(--ink);">${escapeHtml(inv.CustomerName || 'عميل')}</b>
            ${inv.CustomerPhone ? ` • <span class="mono">📱 ${escapeHtml(inv.CustomerPhone)}</span>` : ''}
          </div>
        </div>
        <button class="btn btn-ghost btn-xs" id="closeInvPayModal" style="border-radius:50%;width:30px;height:30px;padding:0;">✕</button>
      </div>

      <!-- Financial Snapshot -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;margin-bottom:16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;text-align:center;">
        <div>
          <div style="font-size:11px;color:#64748b;font-weight:700;">إجمالي الفاتورة</div>
          <div class="mono font-bold" style="font-size:15px;color:#0f172a;margin-top:2px;">${Number(inv.Total||0).toLocaleString()} ج.م</div>
        </div>
        <div>
          <div style="font-size:11px;color:#64748b;font-weight:700;">المسدد سابقاً</div>
          <div class="mono font-bold" style="font-size:15px;color:#059669;margin-top:2px;">${Number(inv.AmountPaid||0).toLocaleString()} ج.م</div>
        </div>
        <div>
          <div style="font-size:11px;color:#64748b;font-weight:700;">المتبقي الآجل</div>
          <div class="mono font-bold" style="font-size:15px;color:#dc2626;margin-top:2px;">${rem.toLocaleString()} ج.م</div>
        </div>
      </div>

      <form id="invPayForm">
        <div class="grid2" style="margin-bottom:12px;">
          <div class="field">
            <label>المبلغ المراد سداده الآن (ج.م) *</label>
            <input type="number" id="invPayAmt" class="mono font-bold" value="${rem}" min="1" max="${rem}" step="any" required style="font-size:16px;color:#059669;" autofocus>
          </div>
          <div class="field">
            <label>طريقة الدفع والتحصيل *</label>
            <select id="invPayMethod">
              <option value="نقدي (كاش)">💵 نقدي (كاش بالدرج)</option>
              <option value="إنستاباي (InstaPay)">⚡ إنستاباي (InstaPay)</option>
              <option value="محفظة إلكترونية (فودافون كاش)">📱 محفظة إلكترونية (فودافون كاش)</option>
              <option value="بطاقة بنكية (فيزا / ماستر)">💳 بطاقة بنكية (فيزا / ماستر)</option>
              <option value="تحويل بنكي">🏦 تحويل بنكي رسمي</option>
            </select>
          </div>
        </div>

        <div class="grid2" style="margin-bottom:12px;">
          <div class="field">
            <label>الإيداع في حساب *</label>
            <select id="invPayTreasury">
              <option value="1102">1102 - درج الكاشير (النقدية الحاضرة)</option>
              <option value="1101">1101 - الخزينة الرئيسية (النقدية)</option>
              <option value="1104">1104 - البنك والمحافظ الإلكترونية وإنستاباي</option>
            </select>
          </div>
          <div class="field">
            <label>تاريخ السداد *</label>
            <input type="date" id="invPayDate" value="${new Date().toISOString().slice(0, 10)}" required>
          </div>
        </div>

        <div class="field" style="margin-bottom:14px;">
          <label>البيان / ملاحظات السداد</label>
          <input type="text" id="invPayNotes" value="سداد دفعة من فاتورة #${inv.InvoiceNumber || inv.ID}">
        </div>

        <div style="background:#f1f5f9;border-radius:8px;padding:10px 12px;margin-bottom:16px;display:flex;align-items:center;gap:10px;font-size:12px;">
          <input type="checkbox" id="autoPrintInvReceiptVoucher" checked style="width:16px;height:16px;cursor:pointer;">
          <label for="autoPrintInvReceiptVoucher" style="margin:0;cursor:pointer;font-weight:700;color:#1e293b;">
            🖨️ طباعة سند قبض مالي رسمي A4 فور تأكيد السداد
          </label>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <button type="button" class="btn btn-ghost btn-sm" id="cancelInvPayModal">إلغاء</button>
          <button type="submit" class="btn btn-primary btn-sm font-bold" id="submitInvPayBtn" style="background:#059669;color:#fff;">
            ✅ تأكيد التحصيل والترحيل المالي
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#closeInvPayModal').onclick = () => overlay.remove();
  overlay.querySelector('#cancelInvPayModal').onclick = () => overlay.remove();

  const form = overlay.querySelector('#invPayForm');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const amt = Number(overlay.querySelector('#invPayAmt').value || 0);
    const method = overlay.querySelector('#invPayMethod').value;
    const treasuryCode = overlay.querySelector('#invPayTreasury').value;
    const treasuryName = treasuryCode === '1102' ? 'درج الكاشير (النقدية الحاضرة)' : (treasuryCode === '1101' ? 'الخزينة الرئيسية (النقدية)' : 'البنك والمحافظ الإلكترونية');
    const date = overlay.querySelector('#invPayDate').value;
    const notes = overlay.querySelector('#invPayNotes').value.trim();
    const shouldPrint = overlay.querySelector('#autoPrintInvReceiptVoucher').checked;

    if(!amt || amt <= 0){
      showToast('يرجى تحديد مبلغ صالح للتحصيل', 'error');
      return;
    }
    if(amt > rem){
      showToast(`المبلغ المدخل (${amt.toLocaleString()} ج.م) أكبر من المتبقي على الفاتورة (${rem.toLocaleString()} ج.م)`, 'error');
      return;
    }

    const btn = overlay.querySelector('#submitInvPayBtn');
    btn.disabled = true;
    btn.textContent = 'جارٍ تسجيل السداد والترحيل...';

    try {
      const voucherNo = 'RV-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-5);
      
      inv.AmountPaid = Number(inv.AmountPaid || 0) + amt;
      const newRemaining = Math.max(0, Number(inv.Total || 0) - inv.AmountPaid);
      inv.Remaining = newRemaining;
      if(newRemaining <= 0) inv.Status = 'مدفوعة بالكامل';
      else inv.Status = 'مدفوعة جزئياً';

      // Auto Journal Entry for collection: Dr. Treasury / Cr. Accounts Receivable (1103)
      recordAutoJournalEntry(
        `تحصيل دفعة فاتورة #${inv.InvoiceNumber} - عميل: ${inv.CustomerName} (سند #${voucherNo})`,
        'InvoicePayment',
        inv.ID,
        [
          { AccountCode: treasuryCode, AccountName: treasuryName, Debit: amt, Credit: 0, Notes: `تحصيل من فاتورة #${inv.InvoiceNumber}` },
          { AccountCode: '1103', AccountName: 'العملاء والمدينون', Debit: 0, Credit: amt, Notes: `سداد عميل: ${inv.CustomerName}` }
        ]
      ).catch(()=>{});

      // Save invoice (with skipAutoJournal: true to prevent re-crediting revenue 4102)
      inv.skipAutoJournal = true;
      await saveInvoiceRemote(inv);
      inv.skipAutoJournal = false;

      recordAuditLog('تحصيل دفعة فاتورة', 'المالية', `تحصيل مبلغ ${amt.toLocaleString()} ج.م من فاتورة #${inv.InvoiceNumber} - عميل: (${inv.CustomerName}) - سند قبض #${voucherNo}`, voucherNo);

      overlay.remove();
      showToast(`تم تحصيل مبلغ ${amt.toLocaleString()} ج.م بنجاح وتحديث حالة الفاتورة ✅`, 'success');

      if(shouldPrint && typeof openReceiptVoucherPrint === 'function'){
        openReceiptVoucherPrint({
          voucherNo,
          date,
          customerName: inv.CustomerName,
          customerPhone: inv.CustomerPhone,
          amount: amt,
          method,
          accountName: treasuryName,
          notes: `سداد دفعة من فاتورة #${inv.InvoiceNumber} - ${notes}`,
          remainingBalance: newRemaining,
          by: state.user ? state.user.name : 'نظام'
        });
      }

      if(typeof onDone === 'function') onDone();
      else if(typeof renderMain === 'function') renderMain();
    } catch(err){
      showToast('تعذر حفظ السداد: ' + err.message, 'error');
      btn.disabled = false;
      btn.textContent = '✅ تأكيد التحصيل والترحيل المالي';
    }
  };
}

window.openInvoicePaymentModal = openInvoicePaymentModal;


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
      date: cleanDate(p.Date) || new Date().toISOString().slice(0,10),
      rawTime: p.Time || '',
      type: 'in',
      sourceType: 'maintenance',
      sourceIcon: '🛠️',
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
      canDelete: false
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
      sourceIcon: '🧾',
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
          sourceIcon: '📄',
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
        sourceIcon: '📥',
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
      transactions.push({
        id: 'ref_' + r.id,
        date: cleanDate(r.updatedAt || r.date) || new Date().toISOString().slice(0,10),
        rawTime: '',
        type: 'out',
        sourceType: 'refund',
        sourceIcon: '↩️',
        accountCode: '4101',
        accountName: 'مردودات خدمات صيانة وتصليح',
        accountTag: '4101 • استرداد صيانة',
        category: 'استرداد صيانة',
        title: `استرداد مبالغ صيانة للعميل: ${r.customer.name}`,
        reference: `إيصال #${r.receiptNumber}`,
        in: 0,
        out: Number(r.refunded),
        by: r.updatedBy || r.createdBy || 'نظام',
        method: 'نقدي (كاش)',
        notes: 'مبالغ مستردة',
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
    const isTransfer = ex.Type === 'transfer' || ex.Category === 'تحويلات بين الخزن والحسابات';

    let tType = 'out';
    let sIcon = '💸';
    let sCat = ex.Category || 'مصروفات تشغيلية';
    let sRef = 'مصروف';
    let accCode = EXPENSE_ACCOUNT_MAP[ex.Category] || '5200';
    let accName = ex.Category || 'مصروفات تشغيلية وعمومية';
    let accTag = accCode + ' • مصروف';

    if(isTransfer){
      const fromIsDrawer = ex.FromAccountCode === '1102';
      const toIsDrawer = ex.ToAccountCode === '1102';
      tType = fromIsDrawer ? 'out' : (toIsDrawer ? 'in' : 'transfer');
      sIcon = '🔄';
      sCat = 'تحويلات بين الخزن والحسابات';
      sRef = 'تحويل مالي';
      accCode = `${ex.ToAccountCode || '1101'} / ${ex.FromAccountCode || '1102'}`;
      accName = `تحويل مالي بين الخزن والحسابات`;
      accTag = '1100 • تحويل';
    } else if(isIncome){
      tType = 'in';
      sIcon = '🟢';
      sCat = ex.Category || 'وارد / إيداع';
      sRef = 'وارد يدوي';
      accCode = '1101';
      accName = 'الخزينة الرئيسية (وارد يدوي)';
      accTag = '1101 • وارد يدوي';
    } else if(isPosReturn){
      tType = 'out';
      sIcon = '↩️';
      sCat = 'مرتجع مبيعات POS';
      sRef = ex.Reference || 'إذن ارتجاع POS';
      accCode = '4102-RET';
      accName = 'مردودات ومسموحات مبيعات POS';
      accTag = '4102 • مرتجع مبيعات';
    } else if(isSupplierPay){
      tType = 'out';
      sIcon = '💸';
      sCat = 'سداد موردين';
      sRef = ex.Reference ? `سند #${ex.Reference}` : 'سند صرف مورد';
      accCode = '2101';
      accName = 'الموردون والدائنون';
      accTag = '2101 • موردين';
    } else if(isPetty){
      tType = 'petty';
      sIcon = '☕';
      sCat = 'نثريات وبوفيه';
      sRef = 'نثريات';
      accCode = '5204';
      accName = 'بوفيه ونثريات وضيافة';
      accTag = '5204 • نثريات';
    } else if(isDraw){
      tType = 'out';
      sIcon = '📤';
      sCat = 'مسحوبات شركاء';
      sRef = 'مسحوبات';
      accCode = '3103';
      accName = 'جاري الشركاء والمسحوبات';
      accTag = '3103 • مسحوبات';
    }

    const txInAmt = isTransfer ? (ex.ToAccountCode === '1102' ? Number(ex.Amount || 0) : 0) : (isIncome ? Number(ex.Amount || 0) : 0);
    const txOutAmt = isTransfer ? (ex.FromAccountCode === '1102' ? Number(ex.Amount || 0) : 0) : (isIncome ? 0 : Number(ex.Amount || 0));

    transactions.push({
      id: ex.ID,
      rawExpId: ex.ID,
      date: cleanDate(ex.Date) || new Date().toISOString().slice(0,10),
      rawTime: '',
      type: tType,
      sourceType: isTransfer ? 'transfer' : (isIncome ? 'manual_in' : (isPosReturn ? 'pos_return' : (isPetty ? 'petty' : (isSupplierPay ? 'supplier_pay' : 'expense')))),
      sourceIcon: sIcon,
      accountCode: accCode,
      accountName: accName,
      accountTag: accTag,
      category: sCat,
      title: ex.Title,
      reference: sRef,
      in: txInAmt,
      out: txOutAmt,
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
    in: { label: '🟢 تسجيل وارد / إيداع نقدي بالخزينة', btnCls: 'btn-green', submitTxt: 'حفظ الوارد' },
    out: { label: '📤 تسجيل منصرف / مسحوبات نقدية', btnCls: 'btn-amber', submitTxt: 'حفظ المنصرف' },
    expense: { label: '💸 تسجيل مصروف عام / تشغيلي', btnCls: 'btn-red', submitTxt: 'حفظ المصروف' },
    petty: { label: '☕ تسجيل نثريات وبوفيه ومشتريات يومية', btnCls: 'btn-primary', submitTxt: 'حفظ النثريات' }
  };

  function renderModal(){
    const cfg = typeConfig[curType] || typeConfig.expense;
    overlay.innerHTML = `
      <div class="modal-content" style="max-width:620px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
          <h3 style="margin:0;font-size:16.5px;font-weight:900;">${cfg.label}</h3>
          <button class="btn btn-ghost btn-xs" id="closeTxModal">✕</button>
        </div>

        <!-- Type Switcher Tabs -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-bottom:14px;">
          <button type="button" class="btn btn-xs ${curType==='in'?'btn-green':'btn-ghost'}" data-txtype="in">📥 وارد (إيداع)</button>
          <button type="button" class="btn btn-xs ${curType==='out'?'btn-amber':'btn-ghost'}" data-txtype="out">📤 منصرف (مسحوبات)</button>
          <button type="button" class="btn btn-xs ${curType==='expense'?'btn-red':'btn-ghost'}" data-txtype="expense">💸 مصاريف تشغيل</button>
          <button type="button" class="btn btn-xs ${curType==='petty'?'btn-primary':'btn-ghost'}" data-txtype="petty">☕ نثريات وبوفيه</button>
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
              ${getActivePaymentMethods().map(pm => `<option value="${escapeHtml(pm.name)}">${pm.icon||'💵'} ${escapeHtml(pm.name)}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="field">
          <label>ملاحظات إضافية</label>
          <input id="txNotes" placeholder="تفاصيل إضافية...">
        </div>

        <div class="actions-row" style="margin-top:16px;">
          <button class="btn btn-ghost" id="cancelTxModal">إلغاء</button>
          <button class="btn ${cfg.btnCls}" id="saveTxModalBtn">💾 ${cfg.submitTxt}</button>
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
        showToast('تم تسجيل الحركة بنجاح في دفتر اليومية ✅', 'success');
        overlay.remove();
        renderMain();
      }catch(e){
        showToast('تم الحفظ محلياً', 'info');
        overlay.remove();
        renderMain();
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
        <div style="font-size:10px;color:#0369a1;font-weight:800;">🛠️ إيرادات الصيانة (4101)</div>
        <div style="font-size:13.5px;font-weight:900;color:#0284c7;" class="mono">${maintIn.toLocaleString()} ج.م</div>
      </div>
      <div style="background:#dcfce7;border-radius:4px;padding:4px 6px;">
        <div style="font-size:10px;color:#15803d;font-weight:800;">🧾 مبيعات POS (4102)</div>
        <div style="font-size:13.5px;font-weight:900;color:#16a34a;" class="mono">${posIn.toLocaleString()} ج.م</div>
      </div>
      <div>
        <div style="font-size:10px;color:#64748b;">إجمالي المقبوضات 🟢</div>
        <div style="font-size:13.5px;font-weight:900;color:#16a34a;" class="mono">${stats.totalIn.toLocaleString()} ج.م</div>
      </div>
      <div>
        <div style="font-size:10px;color:#64748b;">إجمالي المنصرف 🔴</div>
        <div style="font-size:13.5px;font-weight:900;color:#dc2626;" class="mono">${stats.totalOut.toLocaleString()} ج.م</div>
      </div>
      <div style="background:#0f172a;color:#fff;border-radius:4px;padding:4px 6px;">
        <div style="font-size:10px;color:#cbd5e1;">الصافي الفعلي بالدرج 💰</div>
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
            <td style="padding:5px 8px;font-weight:700;">${t.title}</td>
            <td style="padding:5px 8px;font-size:10px;font-weight:600;white-space:nowrap;">${t.method || 'نقدي (كاش)'}</td>
            <td style="padding:5px 8px;color:#475569;">${t.reference}</td>
            <td style="padding:5px 8px;text-align:center;font-weight:800;color:#16a34a;" class="mono">${t.in > 0 ? t.in.toLocaleString() : '-'}</td>
            <td style="padding:5px 8px;text-align:center;font-weight:800;color:#dc2626;" class="mono">${t.out > 0 ? t.out.toLocaleString() : '-'}</td>
            <td style="padding:5px 8px;text-align:center;font-weight:900;" class="mono">${(t.runningBalance||0).toLocaleString()} ج.م</td>
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
    return '<span class="badge" style="background:#e0f2fe;color:#0369a1;font-weight:800;border:1px solid #bae6fd;padding:3px 8px;border-radius:4px;font-size:11px;white-space:nowrap;">🛠️ 4101 صيانة</span>';
  }
  if(t.sourceType === 'pos'){
    return '<span class="badge" style="background:#dcfce7;color:#15803d;font-weight:800;border:1px solid #bbf7d0;padding:3px 8px;border-radius:4px;font-size:11px;white-space:nowrap;">🧾 4102 مبيعات POS</span>';
  }
  if(t.sourceType === 'pos_return' || t.accountCode === '4102-RET'){
    return '<span class="badge" style="background:#fee2e2;color:#b91c1c;font-weight:800;border:1px solid #fca5a5;padding:3px 8px;border-radius:4px;font-size:11px;white-space:nowrap;">↩️ 4102 مرتجع مبيعات</span>';
  }
  if(t.sourceType === 'invoice'){
    return '<span class="badge" style="background:#f1f5f9;color:#334155;font-weight:800;border:1px solid #cbd5e1;padding:3px 8px;border-radius:4px;font-size:11px;white-space:nowrap;">📄 4102 فواتير</span>';
  }
  if(t.type === 'petty'){
    return '<span class="badge" style="background:#fef3c7;color:#b45309;font-weight:800;border:1px solid #fde68a;padding:3px 8px;border-radius:4px;font-size:11px;white-space:nowrap;">☕ 5204 نثريات</span>';
  }
  if(t.sourceType === 'purchase'){
    return '<span class="badge" style="background:#ffedd5;color:#c2410c;font-weight:800;border:1px solid #fed7aa;padding:3px 8px;border-radius:4px;font-size:11px;white-space:nowrap;">📥 2101 موردين</span>';
  }
  return '<span class="badge" style="background:#fee2e2;color:#b91c1c;font-weight:800;border:1px solid #fecaca;padding:3px 8px;border-radius:4px;font-size:11px;white-space:nowrap;">💸 ' + (t.accountTag || '5200 مصروف') + '</span>';
}

/* ---------------- Daily Journal Page View (شاشة اليومية وحركة الخزينة العامة) ---------------- */
function renderDailyJournalPage(main){
  if(!state.dailyDateFilter) state.dailyDateFilter = 'today'; // 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom'
  if(!state.dailyCustomDate) state.dailyCustomDate = new Date().toISOString().slice(0,10);
  if(!state.dailyTypeFilter) state.dailyTypeFilter = 'all'; // 'all' | 'in' | 'out' | 'petty' | 'maintenance' | 'pos' | 'invoice' | 'expense'
  if(!state.dailySearchQ) state.dailySearchQ = '';

  const allTx = getUnifiedDailyTransactions();
  const todayStr = new Date().toISOString().slice(0,10);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0,10);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0,10);

  const monthStartStr = todayStr.slice(0,7) + '-01';

  // Apply Date Filter
  let filtered = allTx;
  if(state.dailyDateFilter === 'today'){
    filtered = filtered.filter(t => t.date === todayStr);
  } else if(state.dailyDateFilter === 'yesterday'){
    filtered = filtered.filter(t => t.date === yesterdayStr);
  } else if(state.dailyDateFilter === 'week'){
    filtered = filtered.filter(t => t.date >= weekAgoStr);
  } else if(state.dailyDateFilter === 'month'){
    filtered = filtered.filter(t => t.date >= monthStartStr);
  } else if(state.dailyDateFilter === 'custom'){
    filtered = filtered.filter(t => t.date === state.dailyCustomDate);
  }

  // Apply Type Filter
  if(state.dailyTypeFilter === 'in'){
    filtered = filtered.filter(t => t.in > 0);
  } else if(state.dailyTypeFilter === 'out'){
    filtered = filtered.filter(t => t.out > 0);
  } else if(state.dailyTypeFilter === 'petty'){
    filtered = filtered.filter(t => t.type === 'petty' || t.category.includes('نثريات'));
  } else if(state.dailyTypeFilter === 'maintenance'){
    filtered = filtered.filter(t => t.sourceType === 'maintenance' || t.sourceType === 'refund');
  } else if(state.dailyTypeFilter === 'pos'){
    filtered = filtered.filter(t => t.sourceType === 'pos');
  } else if(state.dailyTypeFilter === 'invoice'){
    filtered = filtered.filter(t => t.sourceType === 'invoice');
  } else if(state.dailyTypeFilter === 'expense'){
    filtered = filtered.filter(t => t.sourceType === 'expense' || t.sourceType === 'purchase');
  }

  // Apply Payment Method Filter
  if(state.dailyMethodFilter && state.dailyMethodFilter !== 'all'){
    filtered = filtered.filter(t => {
      const m = (t.method || '').toLowerCase();
      if(state.dailyMethodFilter === 'cash') return m.includes('نقدي') || m.includes('كاش') || m.includes('cash');
      if(state.dailyMethodFilter === 'visa') return m.includes('فيزا') || m.includes('card') || m.includes('بطاق') || m.includes('visa');
      if(state.dailyMethodFilter === 'instapay') return m.includes('إنستاباي') || m.includes('انستاباي') || m.includes('instapay');
      if(state.dailyMethodFilter === 'wallet') return m.includes('محفظ') || m.includes('فودافون') || m.includes('vodafone') || m.includes('wallet');
      if(state.dailyMethodFilter === 'credit') return m.includes('آجل') || m.includes('اجل') || m.includes('حساب') || m.includes('credit');
      return true;
    });
  }

  // Apply Search
  const q = (state.dailySearchQ||'').trim().toLowerCase();
  if(q){
    filtered = filtered.filter(t =>
      (t.title||'').toLowerCase().includes(q) ||
      (t.reference||'').toLowerCase().includes(q) ||
      (t.category||'').toLowerCase().includes(q) ||
      (t.by||'').toLowerCase().includes(q) ||
      (t.notes||'').toLowerCase().includes(q) ||
      (t.method||'').toLowerCase().includes(q)
    );
  }

  // KPIs
  const totalMaintIn = filtered.filter(t => t.sourceType==='maintenance').reduce((s,t)=>s+Number(t.in||0), 0);
  const totalPosIn = filtered.filter(t => t.sourceType==='pos').reduce((s,t)=>s+Number(t.in||0), 0);
  const totalIn = filtered.reduce((s,t)=>s+Number(t.in||0), 0);
  const totalOut = filtered.reduce((s,t)=>s+Number(t.out||0), 0);
  const totalPetty = filtered.filter(t=>t.type==='petty'||t.category.includes('نثريات')).reduce((s,t)=>s+Number(t.out||0), 0);
  const netCash = totalIn - totalOut;

  // Payment Channels Breakdown
  const isMethodMatch = (m, target) => {
    const s = String(m || '').toLowerCase();
    if(target === 'cash') return s.includes('نقدي') || s.includes('كاش') || s.includes('cash');
    if(target === 'visa') return s.includes('فيزا') || s.includes('card') || s.includes('بطاق') || s.includes('visa');
    if(target === 'instapay') return s.includes('إنستاباي') || s.includes('انستاباي') || s.includes('instapay');
    if(target === 'wallet') return s.includes('محفظ') || s.includes('فودافون') || s.includes('vodafone') || s.includes('wallet');
    if(target === 'credit') return s.includes('آجل') || s.includes('اجل') || s.includes('حساب') || s.includes('credit');
    return false;
  };

  const cashNet = filtered.filter(t => isMethodMatch(t.method, 'cash')).reduce((s,t)=>s + Number(t.in||0) - Number(t.out||0), 0);
  const cardIn = filtered.filter(t => isMethodMatch(t.method, 'visa')).reduce((s,t)=>s + Number(t.in||0) - Number(t.out||0), 0);
  const instapayNet = filtered.filter(t => isMethodMatch(t.method, 'instapay')).reduce((s,t)=>s + Number(t.in||0) - Number(t.out||0), 0);
  const walletNet = filtered.filter(t => isMethodMatch(t.method, 'wallet')).reduce((s,t)=>s + Number(t.in||0) - Number(t.out||0), 0);
  const creditNet = filtered.filter(t => isMethodMatch(t.method, 'credit')).reduce((s,t)=>s + Number(t.in||0) - Number(t.out||0), 0);

  // Overall Cash Balance in Drawer (from all time)
  const currentTotalCashInDrawer = allTx.length ? allTx[allTx.length - 1].runningBalance : 0;

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">📔 دفتر اليومية العامة وسجل العمليات (General Daily Journal)</h2>
        <div class="subtitle mono" style="font-size:12px;color:var(--ink-secondary);">${filtered.length} حركة وقيد مسجل باليومية • سجل الإيرادات الشاملة والمصروفات الإدارية</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" id="exportDailyExcelBtn">📥 تصدير Excel</button>
        ${canUserAccessSection('cashdrawer') ? `<button class="btn btn-blue btn-sm" id="goToDrawerBtn">💵 حركة الخزينة والدرج ➔</button>` : ''}
        <button class="btn btn-green btn-sm" id="recordManualInBtn">➕ تسجيل وارد</button>
        <button class="btn btn-amber btn-sm" id="recordManualOutBtn">➖ تسجيل منصرف</button>
        <button class="btn btn-red btn-sm" id="recordExpenseBtn">💸 مصروف</button>
        <button class="btn btn-primary btn-sm" id="recordPettyBtn">☕ نثريات</button>
        <button class="btn btn-ghost btn-sm" id="printDailyCloseBtn">🖨️ تقرير اليومية</button>
      </div>
    </div>

    <!-- KPIs Grid (Separated Maintenance & Sales without overlap) -->
    <div class="stat-grid" style="grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:14px;">
      <div class="stat-card" style="border-top:3px solid #0284c7;background:linear-gradient(180deg, #f0f9ff 0%, #fff 100%);">
        <div class="top-row"><span class="lbl" style="color:#0369a1;font-weight:800;">🛠️ مقبوضات الصيانة (ح/ 4101)</span><div class="icon-box" style="background:#e0f2fe;">🛠️</div></div>
        <div class="num mono" style="color:#0369a1;">${totalMaintIn.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:3px;">دفعات وعرابين أجهزة الصيانة</div>
      </div>
      <div class="stat-card" style="border-top:3px solid #16a34a;background:linear-gradient(180deg, #f0fdf4 0%, #fff 100%);">
        <div class="top-row"><span class="lbl" style="color:#15803d;font-weight:800;">🧾 مبيعات POS (ح/ 4102)</span><div class="icon-box" style="background:#dcfce7;">🧾</div></div>
        <div class="num mono" style="color:#15803d;">${totalPosIn.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:3px;">مبيعات الكاشير وإكسسوارات</div>
      </div>
      <div class="stat-card" style="border-top:3px solid #6366f1;">
        <div class="top-row"><span class="lbl">📥 إجمالي المقبوضات الكلي</span><div class="icon-box" style="background:#e0e7ff;">📥</div></div>
        <div class="num mono" style="color:#4338ca;">${totalIn.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:3px;">شامل الصيانة والـ POS والفواتير</div>
      </div>
      <div class="stat-card" style="border-top:3px solid #ef4444;">
        <div class="top-row"><span class="lbl">📤 إجمالي المنصرفات</span><div class="icon-box" style="background:#fee2e2;">📤</div></div>
        <div class="num mono" style="color:#b91c1c;">${totalOut.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:3px;">مصروفات، نثريات (${totalPetty.toLocaleString()} ج.م)، ومشتريات</div>
      </div>
      <div class="stat-card" style="border-top:3px solid #8b5cf6;background:linear-gradient(180deg, #f5f3ff 0%, #fff 100%);">
        <div class="top-row"><span class="lbl" style="color:#6d28d9;font-weight:800;">💰 رصيد الخزينة بالدرج</span><div class="icon-box" style="background:#ede9fe;">💵</div></div>
        <div class="num mono" style="font-weight:900;color:#6d28d9;">${currentTotalCashInDrawer.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:3px;">الرصيد الفعلي الحاضر بالدرج</div>
      </div>
    </div>

    <!-- Payment Channels Breakdown (متابعة وتفصيل حركة الخزينة حسب وسيلة الدفع) -->
    <div style="background:var(--paper2);border:1.5px solid var(--line);border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
        <span style="font-size:12px;font-weight:800;color:var(--ink);display:flex;align-items:center;gap:6px;">
          <span>💳</span><span>متابعة وتفصيل حركة الخزينة حسب وسيلة الدفع (Payment Channels)</span>
        </span>
        <span style="font-size:11px;color:var(--ink-secondary);">اضغط على أي قناة لفرز وعزل حركاتها تلقائياً</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;">
        <div class="pos-pay-stat-tile" data-dmethodquick="cash" style="background:#fff;border:1.5px solid ${state.dailyMethodFilter==='cash'?'#059669':'#cbd5e1'};border-radius:6px;padding:8px 10px;cursor:pointer;transition:all 0.15s ease;">
          <div style="font-size:11px;color:#047857;font-weight:800;">💵 نقدي (كاش)</div>
          <div class="mono font-bold" style="font-size:14px;color:#065f46;margin-top:2px;">${cashNet.toLocaleString()} ج.م</div>
          <div style="font-size:9.5px;color:var(--ink-secondary);">ح/ 1101 الخزينة</div>
        </div>
        <div class="pos-pay-stat-tile" data-dmethodquick="visa" style="background:#fff;border:1.5px solid ${state.dailyMethodFilter==='visa'?'#4338ca':'#cbd5e1'};border-radius:6px;padding:8px 10px;cursor:pointer;transition:all 0.15s ease;">
          <div style="font-size:11px;color:#3730a3;font-weight:800;">💳 فيزا وبطاقات</div>
          <div class="mono font-bold" style="font-size:14px;color:#4338ca;margin-top:2px;">${cardIn.toLocaleString()} ج.م</div>
          <div style="font-size:9.5px;color:var(--ink-secondary);">ح/ 1102 البنك</div>
        </div>
        <div class="pos-pay-stat-tile" data-dmethodquick="instapay" style="background:#fff;border:1.5px solid ${state.dailyMethodFilter==='instapay'?'#d97706':'#cbd5e1'};border-radius:6px;padding:8px 10px;cursor:pointer;transition:all 0.15s ease;">
          <div style="font-size:11px;color:#92400e;font-weight:800;">⚡ إنستاباي InstaPay</div>
          <div class="mono font-bold" style="font-size:14px;color:#b45309;margin-top:2px;">${instapayNet.toLocaleString()} ج.م</div>
          <div style="font-size:9.5px;color:var(--ink-secondary);">ح/ 1102 لحظي</div>
        </div>
        <div class="pos-pay-stat-tile" data-dmethodquick="wallet" style="background:#fff;border:1.5px solid ${state.dailyMethodFilter==='wallet'?'#dc2626':'#cbd5e1'};border-radius:6px;padding:8px 10px;cursor:pointer;transition:all 0.15s ease;">
          <div style="font-size:11px;color:#991b1b;font-weight:800;">📱 محافظ نقدية</div>
          <div class="mono font-bold" style="font-size:14px;color:#b91c1c;margin-top:2px;">${walletNet.toLocaleString()} ج.م</div>
          <div style="font-size:9.5px;color:var(--ink-secondary);">ح/ 1102 محافظ</div>
        </div>
        <div class="pos-pay-stat-tile" data-dmethodquick="credit" style="background:#fff;border:1.5px solid ${state.dailyMethodFilter==='credit'?'#7e22ce':'#cbd5e1'};border-radius:6px;padding:8px 10px;cursor:pointer;transition:all 0.15s ease;">
          <div style="font-size:11px;color:#6b21a8;font-weight:800;">📝 آجل وعلى الحساب</div>
          <div class="mono font-bold" style="font-size:14px;color:#7e22ce;margin-top:2px;">${creditNet.toLocaleString()} ج.م</div>
          <div style="font-size:9.5px;color:var(--ink-secondary);">ح/ 1103 مدينون</div>
        </div>
      </div>
    </div>

    <!-- Date Presets & Filter Bar -->
    <div class="chip-group" id="dailyDateChips" style="margin-bottom:12px;">
      <div class="chip ${state.dailyDateFilter==='today'?'sel':''}" data-dchip="today">📅 اليوم (${todayStr})</div>
      <div class="chip ${state.dailyDateFilter==='yesterday'?'sel':''}" data-dchip="yesterday">أمس</div>
      <div class="chip ${state.dailyDateFilter==='week'?'sel':''}" data-dchip="week">آخر 7 أيام</div>
      <div class="chip ${state.dailyDateFilter==='month'?'sel':''}" data-dchip="month">هذا الشهر</div>
      <div class="chip ${state.dailyDateFilter==='all'?'sel':''}" data-dchip="all">كل الأوقات</div>
      <div class="chip ${state.dailyDateFilter==='custom'?'sel':''}" data-dchip="custom">تاريخ مخصص 📆</div>
    </div>

    <!-- Quick Department Filter Buttons -->
    <div class="chip-group" id="dailyDeptChips" style="margin-bottom:12px;">
      <div class="chip ${state.dailyTypeFilter==='all'?'sel':''}" data-tchip="all">كل الحسابات</div>
      <div class="chip ${state.dailyTypeFilter==='maintenance'?'sel':''}" data-tchip="maintenance" style="font-weight:700;">🛠️ إيرادات ودفعات الصيانة فقط</div>
      <div class="chip ${state.dailyTypeFilter==='pos'?'sel':''}" data-tchip="pos" style="font-weight:700;">🧾 مبيعات ونقطة البيع POS فقط</div>
      <div class="chip ${state.dailyTypeFilter==='expense'?'sel':''}" data-tchip="expense">💸 المصروفات والمشتريات</div>
      <div class="chip ${state.dailyTypeFilter==='petty'?'sel':''}" data-tchip="petty">☕ النثريات والبوفيه</div>
    </div>

    <div class="filters-bar" style="margin-bottom:14px;flex-wrap:wrap;">
      ${state.dailyDateFilter==='custom' ? `
        <input id="dailyCustomDateInp" type="date" value="${state.dailyCustomDate}" style="width:140px;">
      ` : ''}
      <select id="dailyTypeFilterSelect" style="min-width:180px;">
        <option value="all" ${state.dailyTypeFilter==='all'?'selected':''}>كل أنواع العمليات (الكل)</option>
        <option value="in" ${state.dailyTypeFilter==='in'?'selected':''}>📥 وارد ومقبوضات فقط</option>
        <option value="out" ${state.dailyTypeFilter==='out'?'selected':''}>📤 منصرف ومسحوبات فقط</option>
        <option value="maintenance" ${state.dailyTypeFilter==='maintenance'?'selected':''}>🛠️ حركات ودفعات الصيانة (ح/ 4101)</option>
        <option value="pos" ${state.dailyTypeFilter==='pos'?'selected':''}>🧾 مبيعات نقطة البيع POS (ح/ 4102)</option>
        <option value="invoice" ${state.dailyTypeFilter==='invoice'?'selected':''}>📄 مقبوضات الفواتير العامة</option>
        <option value="expense" ${state.dailyTypeFilter==='expense'?'selected':''}>💸 المصروفات والمشتريات</option>
        <option value="petty" ${state.dailyTypeFilter==='petty'?'selected':''}>☕ نثريات وبوفيه فقط</option>
      </select>
      <select id="dailyMethodFilterSelect" style="min-width:140px;">
        <option value="all" ${(!state.dailyMethodFilter || state.dailyMethodFilter==='all')?'selected':''}>💳 كل طرق الدفع</option>
        <option value="cash" ${state.dailyMethodFilter==='cash'?'selected':''}>💵 نقدي (كاش)</option>
        <option value="visa" ${state.dailyMethodFilter==='visa'?'selected':''}>💳 فيزا وبطاقات</option>
        <option value="instapay" ${state.dailyMethodFilter==='instapay'?'selected':''}>⚡ إنستاباي</option>
        <option value="wallet" ${state.dailyMethodFilter==='wallet'?'selected':''}>📱 محفظة نقدية</option>
        <option value="credit" ${state.dailyMethodFilter==='credit'?'selected':''}>📝 آجل / على الحساب</option>
      </select>
      <input id="dailySearchInp" placeholder="🔍 بحث في المعاملات، الإيصالات، النثريات، أو المسؤول..." value="${state.dailySearchQ}" style="flex:1;min-width:220px;">
      ${(state.dailySearchQ || state.dailyTypeFilter!=='all' || (state.dailyMethodFilter && state.dailyMethodFilter!=='all') || state.dailyDateFilter!=='today') ? `<button class="btn btn-ghost btn-sm" id="clearDailyFilters">إعادة ضبط</button>` : ''}
    </div>

    <!-- Ledger Table -->
    <div class="card">
      ${filtered.length===0 ? '<div class="empty">لا توجد حركات نقدية مسجلة في هذه الفترة أو مطابقة للفلتر.</div>' : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:40px;">#</th>
              <th>التاريخ</th>
              <th>البيان والمعاملة</th>
              <th>طريقة الدفع</th>
              <th>المرجع / القسم</th>
              <th>الحساب المحاسبي</th>
              <th>التصنيف</th>
              <th style="text-align:center;">🟢 وارد (مدين)</th>
              <th style="text-align:center;">🔴 منصرف (دائن)</th>
              <th style="text-align:center;">💵 الرصيد اللحظي</th>
              <th>المسؤول</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${filtered.slice().reverse().map((t, idx)=>{
              return `
                <tr>
                  <td class="mono font-bold" style="color:var(--ink-secondary);font-size:11px;">${filtered.length - idx}</td>
                  <td style="font-size:11.5px;color:var(--ink-secondary);white-space:nowrap;">${cleanDate(t.date)}</td>
                  <td>
                    <div style="font-weight:800;font-size:13px;">${t.title}</div>
                    ${t.notes ? `<div style="font-size:11px;color:var(--ink-secondary);">${t.notes}</div>` : ''}
                  </td>
                  <td>
                    ${getPaymentMethodBadge(t.method)}
                  </td>
                  <td>
                    <span class="status-badge st-check" style="font-size:10.5px;">${t.sourceIcon} ${t.reference}</span>
                  </td>
                  <td>
                    ${getAccountBadgeHtml(t)}
                  </td>
                  <td>
                    <span style="font-size:11.5px;color:var(--ink-secondary);">${t.category}</span>
                  </td>
                  <td class="mono font-bold" style="text-align:center;color:var(--green);font-size:13px;">
                    ${t.in > 0 ? `+${Number(t.in).toLocaleString()} ج.م` : '-'}
                  </td>
                  <td class="mono font-bold" style="text-align:center;color:var(--red);font-size:13px;">
                    ${t.out > 0 ? `-${Number(t.out).toLocaleString()} ج.م` : '-'}
                  </td>
                  <td class="mono font-bold" style="text-align:center;font-size:13px;color:var(--primary);">
                    ${(t.runningBalance||0).toLocaleString()} ج.م
                  </td>
                  <td style="font-size:11.5px;">${t.by}</td>
                  <td style="text-align:center;">
                    ${t.canDelete && state.user.role==='admin' ? `
                      <button class="btn btn-xs btn-red" data-txdel="${t.rawExpId}" title="حذف القيد اليدوي">🗑️</button>
                    ` : ''}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>`}
    </div>
  `;

  // Bindings
  document.querySelectorAll('#dailyDateChips .chip').forEach(c => {
    c.onclick = ()=>{
      state.dailyDateFilter = c.dataset.dchip;
      renderDailyJournalPage(main);
    };
  });

  document.querySelectorAll('#dailyDeptChips .chip').forEach(c => {
    c.onclick = ()=>{
      state.dailyTypeFilter = c.dataset.tchip;
      renderDailyJournalPage(main);
    };
  });

  // Quick Payment Channels Click Filter
  main.querySelectorAll('[data-dmethodquick]').forEach(tile => {
    tile.onclick = () => {
      const m = tile.dataset.dmethodquick;
      state.dailyMethodFilter = (state.dailyMethodFilter === m) ? 'all' : m;
      renderDailyJournalPage(main);
    };
  });

  const customDateInp = document.getElementById('dailyCustomDateInp');
  if(customDateInp){
    customDateInp.onchange = (e)=>{ state.dailyCustomDate = e.target.value; renderDailyJournalPage(main); };
  }

  const typeSel = document.getElementById('dailyTypeFilterSelect');
  if(typeSel){
    typeSel.onchange = (e)=>{ state.dailyTypeFilter = e.target.value; renderDailyJournalPage(main); };
  }

  const methodSel = document.getElementById('dailyMethodFilterSelect');
  if(methodSel){
    methodSel.onchange = (e)=>{ state.dailyMethodFilter = e.target.value; renderDailyJournalPage(main); };
  }

  const searchInp = document.getElementById('dailySearchInp');
  if(searchInp){
    searchInp.oninput = (e)=>{ state.dailySearchQ = e.target.value; renderDailyJournalPage(main); };
  }

  const clearBtn = document.getElementById('clearDailyFilters');
  if(clearBtn){
    clearBtn.onclick = ()=>{
      state.dailyDateFilter = 'today';
      state.dailyTypeFilter = 'all';
      state.dailyMethodFilter = 'all';
      state.dailySearchQ = '';
      renderDailyJournalPage(main);
    };
  }

  // Action Buttons
  document.getElementById('recordManualInBtn').onclick = ()=>openRecordTransactionModal('in');
  document.getElementById('recordManualOutBtn').onclick = ()=>openRecordTransactionModal('out');
  document.getElementById('recordExpenseBtn').onclick = ()=>openRecordTransactionModal('expense');
  document.getElementById('recordPettyBtn').onclick = ()=>openRecordTransactionModal('petty');

  const goDrw = document.getElementById('goToDrawerBtn');
  if(goDrw) goDrw.onclick = ()=>{ state.currentSection = 'cashdrawer'; render(); };

  document.getElementById('exportDailyExcelBtn').onclick = ()=>exportDailyJournalToExcel(filtered, { totalIn, totalOut, totalPetty, netCash });
  document.getElementById('printDailyCloseBtn').onclick = ()=>{
    const curDateStr = state.dailyDateFilter === 'custom' ? state.dailyCustomDate : (state.dailyDateFilter==='yesterday'?yesterdayStr:todayStr);
    openDailyClosePrint(curDateStr, { totalIn, totalOut, totalPetty, netCash }, filtered);
  };

  // Row Delete
  main.querySelectorAll('[data-txdel]').forEach(btn => {
    btn.onclick = async ()=>{
      const exp = (state.expenses || []).find(x=>x.ID === btn.dataset.txdel);
      const title = exp ? exp.Title : 'حركة باليومية';
      requestAdminAuthorization({
        action: 'حذف حركة باليومية',
        entityType: 'حركة يومية / مصروف',
        entityId: btn.dataset.txdel,
        entityTitle: title,
        onApproved: async ()=>{
          try{
            await deleteExpenseRemote(btn.dataset.txdel);
            showToast('تم حذف الحركة بنجاح', 'success');
            renderDailyJournalPage(main);
          }catch(e){ showToast('تعذر الحذف: '+e.message, 'error'); }
        }
      });
    };
  });
}

function renderDailyJournalSectionApp(app){
  if(!canUserAccessSection('daily')){
    showToast('⛔ ليس لديك صلاحية للوصول إلى دفتر اليومية العامة', 'error');
    state.currentSection = null;
    return render();
  }
  const hasFinanceNav = canUserAccessSection('cashdrawer') || canUserAccessSection('invoices') || canUserAccessSection('finance');
  const hasQuickNav = canUserAccessSection('pos') || canUserAccessSection('settings');

  app.innerHTML = `
    <div class="sidebar">
      ${brandHtml("دفتر اليومية العامة")}
      ${sectionSwitcherHtml()}
      <div class="sidebar-nav-wrap">
        <div class="nav-section">الدفاتر المحاسبية العامة</div>
        <div class="nav-item active">
          <span class="nav-item-icon">📔</span><span>دفتر اليومية وسجل العمليات</span>
        </div>

        ${hasFinanceNav ? `
          <div class="nav-section">القطاع المالي والخزينة</div>
          ${canUserAccessSection('cashdrawer') ? `
            <div class="nav-item" id="dayToDrawerNav">
              <span class="nav-item-icon">💵</span><span>حركة الخزينة والدرج</span>
            </div>
          ` : ''}
          ${canUserAccessSection('invoices') ? `
            <div class="nav-item" id="dayToInvoicesNav">
              <span class="nav-item-icon">📄</span><span>الفواتير وعروض الأسعار</span>
            </div>
          ` : ''}
          ${canUserAccessSection('finance') ? `
            <div class="nav-item" id="dayToFinanceNav">
              <span class="nav-item-icon">💰</span><span>شجرة الحسابات والقيود</span>
            </div>
            <div class="nav-item" id="dayToIncomeNav">
              <span class="nav-item-icon">📈</span><span>تقرير الأرباح والدخل</span>
            </div>
          ` : ''}
        ` : ''}

        ${hasQuickNav ? `
          <div class="nav-section">التنقل السريع</div>
          ${canUserAccessSection('pos') ? `
            <div class="nav-item" id="dayToPosNav">
              <span class="nav-item-icon">🧾</span><span>نقطة البيع (POS)</span>
            </div>
          ` : ''}
          ${canUserAccessSection('settings') ? `
            <div class="nav-item" id="dayToSettingsNav">
              <span class="nav-item-icon">⚙️</span><span>الإعدادات</span>
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

  const dDrw = document.getElementById('dayToDrawerNav');
  if(dDrw) dDrw.onclick = ()=>{ state.currentSection = 'cashdrawer'; render(); };
  const dInv = document.getElementById('dayToInvoicesNav');
  if(dInv) dInv.onclick = ()=>{ state.currentSection = 'invoices'; render(); };
  const dFin = document.getElementById('dayToFinanceNav');
  if(dFin) dFin.onclick = ()=>{ state.currentSection = 'finance'; state.financeTab = 'accounts'; render(); };
  const dInc = document.getElementById('dayToIncomeNav');
  if(dInc) dInc.onclick = ()=>{ state.currentSection = 'finance'; state.financeTab = 'income'; render(); };
  const dPos = document.getElementById('dayToPosNav');
  if(dPos) dPos.onclick = ()=>{ state.currentSection = 'pos'; render(); };
  const dSet = document.getElementById('dayToSettingsNav');
  if(dSet) dSet.onclick = ()=>{ state.currentSection = 'settings'; render(); };

  renderDailyJournalPage(document.getElementById('main'));
}
