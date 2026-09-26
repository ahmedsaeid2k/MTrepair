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
                    ${inv.ReferenceType ? `<span class="status-badge st-check" style="font-size:10.5px;">${inv.ReferenceType==='Receipt'?'🛠️ إيصال #':inv.ReferenceType} ${escapeHtml(inv.ReferenceID)}</span>` : '<span style="color:var(--slate-400);font-size:11px;">مباشر</span>'}
                  </td>
                  <td class="mono font-bold" style="font-size:13px;text-align:center;">${Number(inv.Total||0).toLocaleString()} ج.م</td>
                  <td class="mono font-bold" style="color:var(--green);font-size:13px;text-align:center;">${Number(inv.AmountPaid||0).toLocaleString()} ج.م</td>
                  <td class="mono font-bold" style="color:${Number(inv.Remaining||0)>0?'var(--red)':'var(--ink)'};font-size:13px;text-align:center;">${Number(inv.Remaining||0).toLocaleString()} ج.م</td>
                  <td style="text-align:center;">
                    <span class="status-badge ${isPaid?'st-done':(isPartial?'st-repair':'st-failed')}">
                      ${isPaid?'✅ مدفوعة':(isPartial?'⚡ جزئي':'⏳ آجل')}
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

    let tType = 'out';
    let sIcon = '💸';
    let sCat = ex.Category || 'مصروفات تشغيلية';
    let sRef = 'مصروف';
    let accCode = EXPENSE_ACCOUNT_MAP[ex.Category] || '5200';
    let accName = ex.Category || 'مصروفات تشغيلية وعمومية';
    let accTag = accCode + ' • مصروف';

    if(isIncome){
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
