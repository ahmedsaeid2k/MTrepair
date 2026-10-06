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

  // Overall Cash Balance in Drawer (from all time - Cash Only)
  const currentTotalCashInDrawer = allTx.filter(t => isMethodMatch(t.method, 'cash')).reduce((s,t)=>s + Number(t.in||0) - Number(t.out||0), 0);
  const totalAllLiquidity = allTx.filter(t => !isMethodMatch(t.method, 'credit')).reduce((s,t)=>s + Number(t.in||0) - Number(t.out||0), 0);

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("daily", 22)} دفتر اليومية العامة وسجل العمليات</h2>
        <div class="subtitle mono" style="font-size:12px;color:var(--ink-secondary);">${filtered.length} حركة وقيد مسجل باليومية • سجل الإيرادات الشاملة والمصروفات الإدارية</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" id="exportDailyExcelBtn">${getSvgIcon("download", 14)} تصدير Excel</button>
        ${canUserAccessSection('cashdrawer') ? `<button class="btn btn-blue btn-sm" id="goToDrawerBtn">${getSvgIcon("cashdrawer", 14)} حركة الخزينة والدرج</button>` : ''}
        <button class="btn btn-green btn-sm" id="recordManualInBtn">${getSvgIcon("plus", 14)} تسجيل وارد</button>
        <button class="btn btn-amber btn-sm" id="recordManualOutBtn">${getSvgIcon("arrowDown", 14)} تسجيل منصرف</button>
        <button class="btn btn-red btn-sm" id="recordExpenseBtn">${getSvgIcon("wallet", 14)} مصروف</button>
        <button class="btn btn-primary btn-sm" id="recordPettyBtn">${getSvgIcon("tag", 14)} نثريات</button>
        <button class="btn btn-ghost btn-sm" id="printDailyCloseBtn">${getSvgIcon("printer", 14)} تقرير اليومية</button>
      </div>
    </div>

    <!-- KPIs Grid (Separated Maintenance & Sales without overlap) -->
    <div class="stat-grid" style="grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:14px;">
      <div class="stat-card" style="border-top:3px solid #0284c7;background:linear-gradient(180deg, #f0f9ff 0%, #fff 100%);">
        <div class="top-row"><span class="lbl" style="color:#0369a1;font-weight:800;display:flex;align-items:center;gap:4px;">${getSvgIcon("tool", 14)} مقبوضات الصيانة (ح/ 4101)</span><div class="icon-box" style="background:#e0f2fe;color:#0369a1;">${getSvgIcon("tool", 18)}</div></div>
        <div class="num mono" style="color:#0369a1;">${totalMaintIn.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:3px;">دفعات وعرابين أجهزة الصيانة</div>
      </div>
      <div class="stat-card" style="border-top:3px solid #16a34a;background:linear-gradient(180deg, #f0fdf4 0%, #fff 100%);">
        <div class="top-row"><span class="lbl" style="color:#15803d;font-weight:800;display:flex;align-items:center;gap:4px;">${getSvgIcon("pos", 14)} مبيعات POS (ح/ 4102)</span><div class="icon-box" style="background:#dcfce7;color:#15803d;">${getSvgIcon("pos", 18)}</div></div>
        <div class="num mono" style="color:#15803d;">${totalPosIn.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:3px;">مبيعات الكاشير وإكسسوارات</div>
      </div>
      <div class="stat-card" style="border-top:3px solid #6366f1;">
        <div class="top-row"><span class="lbl" style="display:flex;align-items:center;gap:4px;">${getSvgIcon("trendUp", 14)} إجمالي المقبوضات الكلي</span><div class="icon-box" style="background:#e0e7ff;color:#0369a1;">${getSvgIcon("trendUp", 18)}</div></div>
        <div class="num mono" style="color:#4338ca;">${totalIn.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:3px;">شامل الصيانة والـ POS والفواتير</div>
      </div>
      <div class="stat-card" style="border-top:3px solid #ef4444;">
        <div class="top-row"><span class="lbl" style="display:flex;align-items:center;gap:4px;">${getSvgIcon("trendDown", 14)} إجمالي المنصرفات</span><div class="icon-box" style="background:#fee2e2;color:#b91c1c;">${getSvgIcon("trendDown", 18)}</div></div>
        <div class="num mono" style="color:#b91c1c;">${totalOut.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:3px;">مصروفات، نثريات (${totalPetty.toLocaleString()} ج.م)، ومشتريات</div>
      </div>
      <div class="stat-card" style="border-top:3px solid #8b5cf6;background:linear-gradient(180deg, #f5f3ff 0%, #fff 100%);">
        <div class="top-row"><span class="lbl" style="color:#6d28d9;font-weight:800;display:flex;align-items:center;gap:4px;">${getSvgIcon("wallet", 14)} رصيد الخزينة بالدرج</span><div class="icon-box" style="background:#ede9fe;color:#6d28d9;">${getSvgIcon("wallet", 18)}</div></div>
        <div class="num mono" style="font-weight:900;color:#6d28d9;">${currentTotalCashInDrawer.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:3px;">النقدية الحاضرة بالدرج (إجمالي السيولة: ${totalAllLiquidity.toLocaleString()} ج.م)</div>
      </div>
    </div>

    <!-- Payment Channels Breakdown (متابعة وتفصيل حركة الخزينة حسب وسيلة الدفع) -->
    <div style="background:var(--paper2);border:1.5px solid var(--line);border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
        <span style="font-size:12px;font-weight:800;color:var(--ink);display:flex;align-items:center;gap:6px;">
          <span>${getSvgIcon("creditCard", 15)}</span><span>متابعة وتفصيل حركة الخزينة حسب وسيلة الدفع</span>
        </span>
        <span style="font-size:11px;color:var(--ink-secondary);">اضغط على أي قناة لفرز وعزل حركاتها تلقائياً</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;">
        <div class="pos-pay-stat-tile" data-dmethodquick="cash" style="background:#fff;border:1.5px solid ${state.dailyMethodFilter==='cash'?'#059669':'#cbd5e1'};border-radius:6px;padding:8px 10px;cursor:pointer;transition:all 0.15s ease;">
          <div style="font-size:11px;color:#047857;font-weight:800;">نقدي (كاش)</div>
          <div class="mono font-bold" style="font-size:14px;color:#065f46;margin-top:2px;">${cashNet.toLocaleString()} ج.م</div>
          <div style="font-size:9.5px;color:var(--ink-secondary);">ح/ 1101 الخزينة</div>
        </div>
        <div class="pos-pay-stat-tile" data-dmethodquick="visa" style="background:#fff;border:1.5px solid ${state.dailyMethodFilter==='visa'?'#4338ca':'#cbd5e1'};border-radius:6px;padding:8px 10px;cursor:pointer;transition:all 0.15s ease;">
          <div style="font-size:11px;color:#3730a3;font-weight:800;">فيزا وبطاقات</div>
          <div class="mono font-bold" style="font-size:14px;color:#4338ca;margin-top:2px;">${cardIn.toLocaleString()} ج.م</div>
          <div style="font-size:9.5px;color:var(--ink-secondary);">ح/ 1102 البنك</div>
        </div>
        <div class="pos-pay-stat-tile" data-dmethodquick="instapay" style="background:#fff;border:1.5px solid ${state.dailyMethodFilter==='instapay'?'#d97706':'#cbd5e1'};border-radius:6px;padding:8px 10px;cursor:pointer;transition:all 0.15s ease;">
          <div style="font-size:11px;color:#92400e;font-weight:800;">إنستاباي InstaPay</div>
          <div class="mono font-bold" style="font-size:14px;color:#b45309;margin-top:2px;">${instapayNet.toLocaleString()} ج.م</div>
          <div style="font-size:9.5px;color:var(--ink-secondary);">ح/ 1102 لحظي</div>
        </div>
        <div class="pos-pay-stat-tile" data-dmethodquick="wallet" style="background:#fff;border:1.5px solid ${state.dailyMethodFilter==='wallet'?'#dc2626':'#cbd5e1'};border-radius:6px;padding:8px 10px;cursor:pointer;transition:all 0.15s ease;">
          <div style="font-size:11px;color:#991b1b;font-weight:800;">محافظ نقدية</div>
          <div class="mono font-bold" style="font-size:14px;color:#b91c1c;margin-top:2px;">${walletNet.toLocaleString()} ج.م</div>
          <div style="font-size:9.5px;color:var(--ink-secondary);">ح/ 1102 محافظ</div>
        </div>
        <div class="pos-pay-stat-tile" data-dmethodquick="credit" style="background:#fff;border:1.5px solid ${state.dailyMethodFilter==='credit'?'#7e22ce':'#cbd5e1'};border-radius:6px;padding:8px 10px;cursor:pointer;transition:all 0.15s ease;">
          <div style="font-size:11px;color:#6b21a8;font-weight:800;">آجل وعلى الحساب</div>
          <div class="mono font-bold" style="font-size:14px;color:#7e22ce;margin-top:2px;">${creditNet.toLocaleString()} ج.م</div>
          <div style="font-size:9.5px;color:var(--ink-secondary);">ح/ 1103 مدينون</div>
        </div>
      </div>
    </div>

    <!-- Date Presets & Filter Bar -->
    <div class="chip-group" id="dailyDateChips" style="margin-bottom:12px;">
      <div class="chip ${state.dailyDateFilter==='today'?'sel':''}" data-dchip="today">${getSvgIcon("calendar", 12)} اليوم (${todayStr})</div>
      <div class="chip ${state.dailyDateFilter==='yesterday'?'sel':''}" data-dchip="yesterday">أمس</div>
      <div class="chip ${state.dailyDateFilter==='week'?'sel':''}" data-dchip="week">آخر 7 أيام</div>
      <div class="chip ${state.dailyDateFilter==='month'?'sel':''}" data-dchip="month">هذا الشهر</div>
      <div class="chip ${state.dailyDateFilter==='all'?'sel':''}" data-dchip="all">كل الأوقات</div>
      <div class="chip ${state.dailyDateFilter==='custom'?'sel':''}" data-dchip="custom">${getSvgIcon("calendar", 12)} تاريخ مخصص</div>
    </div>

    <!-- Quick Department Filter Buttons -->
    <div class="chip-group" id="dailyDeptChips" style="margin-bottom:12px;">
      <div class="chip ${state.dailyTypeFilter==='all'?'sel':''}" data-tchip="all">كل الحسابات</div>
      <div class="chip ${state.dailyTypeFilter==='maintenance'?'sel':''}" data-tchip="maintenance" style="font-weight:700;">إيرادات ودفعات الصيانة فقط</div>
      <div class="chip ${state.dailyTypeFilter==='pos'?'sel':''}" data-tchip="pos" style="font-weight:700;">مبيعات ونقطة البيع POS فقط</div>
      <div class="chip ${state.dailyTypeFilter==='expense'?'sel':''}" data-tchip="expense">المصروفات والمشتريات</div>
      <div class="chip ${state.dailyTypeFilter==='petty'?'sel':''}" data-tchip="petty">النثريات والبوفيه</div>
    </div>

    <div class="filters-bar" style="margin-bottom:14px;flex-wrap:wrap;">
      ${state.dailyDateFilter==='custom' ? `
        <input id="dailyCustomDateInp" type="date" value="${state.dailyCustomDate}" style="width:140px;">
      ` : ''}
      <select id="dailyTypeFilterSelect" style="min-width:180px;">
        <option value="all" ${state.dailyTypeFilter==='all'?'selected':''}>كل أنواع العمليات (الكل)</option>
        <option value="in" ${state.dailyTypeFilter==='in'?'selected':''}>وارد ومقبوضات فقط</option>
        <option value="out" ${state.dailyTypeFilter==='out'?'selected':''}>منصرف ومسحوبات فقط</option>
        <option value="maintenance" ${state.dailyTypeFilter==='maintenance'?'selected':''}>حركات ودفعات الصيانة (ح/ 4101)</option>
        <option value="pos" ${state.dailyTypeFilter==='pos'?'selected':''}>مبيعات نقطة البيع POS (ح/ 4102)</option>
        <option value="invoice" ${state.dailyTypeFilter==='invoice'?'selected':''}>مقبوضات الفواتير العامة</option>
        <option value="expense" ${state.dailyTypeFilter==='expense'?'selected':''}>المصروفات والمشتريات</option>
        <option value="petty" ${state.dailyTypeFilter==='petty'?'selected':''}>نثريات وبوفيه فقط</option>
      </select>
      <select id="dailyMethodFilterSelect" style="min-width:140px;">
        <option value="all" ${(!state.dailyMethodFilter || state.dailyMethodFilter==='all')?'selected':''}>كل طرق الدفع</option>
        <option value="cash" ${state.dailyMethodFilter==='cash'?'selected':''}>نقدي (كاش)</option>
        <option value="visa" ${state.dailyMethodFilter==='visa'?'selected':''}>فيزا وبطاقات</option>
        <option value="instapay" ${state.dailyMethodFilter==='instapay'?'selected':''}>إنستاباي</option>
        <option value="wallet" ${state.dailyMethodFilter==='wallet'?'selected':''}>محفظة نقدية</option>
        <option value="credit" ${state.dailyMethodFilter==='credit'?'selected':''}>آجل / على الحساب</option>
      </select>
      <input id="dailySearchInp" placeholder="بحث في المعاملات، الإيصالات، النثريات، أو المسؤول..." value="${state.dailySearchQ}" style="flex:1;min-width:220px;">
      ${(state.dailySearchQ || state.dailyTypeFilter!=='all' || (state.dailyMethodFilter && state.dailyMethodFilter!=='all') || state.dailyDateFilter!=='today') ? `<button class="btn btn-ghost btn-sm" id="clearDailyFilters">إعادة ضبط</button>` : ''}
    </div>

    <!-- Detected Duplicates Alert Banner -->
    ${(()=>{
      const detectedDuplicates = detectDuplicatePayments(state.payments || []);
      if(!detectedDuplicates.length) return '';
      return `
        <div style="background:#fef2f2;border:1.5px solid #f87171;border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="display:inline-flex;">${getSvgIcon('alert', 18)}</span>
            <div>
              <div style="font-size:13px;font-weight:800;color:#991b1b;">
                تنبيه تدقيق الخزينة: تم اكتشاف ${detectedDuplicates.length} دفعة صيانة مكررة مسجلة بالخزينة تؤثر على توازن الرصيد!
              </div>
              <div style="font-size:11px;color:#b91c1c;margin-top:2px;">
                الدفعة مكررة لنفس الإيصال والمبلغ، اضغط على زر المعالجة أدناه لإلغاء الدفعة المكررة وتصحيح رصيد الخزينة والإيصال فوراً.
              </div>
            </div>
          </div>
          ${state.user.role==='admin' ? `
            <button class="btn btn-sm btn-red font-bold" id="autoFixDuplicatePaymentsBtn" style="box-shadow:0 2px 6px rgba(220,38,38,0.25);">
              ${getSvgIcon("alert", 14)} مراجعة وتدقيق الدفعات المشتبه بتكرارها
            </button>
          ` : ''}
        </div>
      `;
    })()}

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
              <th style="text-align:center;">وارد (مدين)</th>
              <th style="text-align:center;">منصرف (دائن)</th>
              <th style="text-align:center;">الرصيد اللحظي</th>
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
                    <div style="font-weight:800;font-size:13px;">${escapeHtml(t.title)}</div>
                    ${t.notes ? `<div style="font-size:11px;color:var(--ink-secondary);">${escapeHtml(t.notes)}</div>` : ''}
                  </td>
                  <td>
                    ${getPaymentMethodBadge(t.method)}
                  </td>
                  <td>
                    <span class="status-badge st-check" style="font-size:10.5px;">${t.sourceIcon} ${escapeHtml(t.reference)}</span>
                  </td>
                  <td>
                    ${getAccountBadgeHtml(t)}
                  </td>
                  <td>
                    <span style="font-size:11.5px;color:var(--ink-secondary);">${escapeHtml(t.category)}</span>
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
                  <td style="font-size:11.5px;">${escapeHtml(t.by)}</td>
                  <td style="text-align:center;">
                    ${t.canDelete && state.user.role==='admin' ? `
                      ${t.sourceType==='maintenance' ? `
                        <button class="btn btn-xs btn-red" data-txpaydel="${t.rawPayId}" title="حذف دفعة الصيانة وتصحيح الخزينة والإيصال">${getSvgIcon('trash', 13)}</button>
                      ` : `
                        <button class="btn btn-xs btn-red" data-txdel="${t.rawExpId}" title="حذف القيد اليدوي">${getSvgIcon('trash', 13)}</button>
                      `}
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

  const autoFixBtn = document.getElementById('autoFixDuplicatePaymentsBtn');
  if(autoFixBtn){
    autoFixBtn.onclick = ()=>{
      openDuplicatePaymentsReviewModal(() => renderDailyJournalPage(main));
    };
  }

  // Row Delete for Payments
  main.querySelectorAll('[data-txpaydel]').forEach(btn => {
    btn.onclick = async ()=>{
      const payId = btn.dataset.txpaydel;
      const p = (state.payments || []).find(x => String(x.ID) === String(payId));
      const title = p ? `تحصيل صيانة بمبلغ ${p.Amount} ج.م (إيصال #${p.ReceiptNumber || p.ReceiptID})` : 'دفعة صيانة';
      requestAdminAuthorization({
        action: 'حذف دفعة صيانة وتصحيح رصيد الخزينة',
        entityType: 'دفعة صيانة',
        entityId: payId,
        entityTitle: title,
        onApproved: async ()=>{
          try{
            await deletePaymentRemote(payId);
            showToast('تم حذف الدفعة وتصحيح رصيد الخزينة والإيصال بنجاح', 'success');
            renderDailyJournalPage(main);
          }catch(e){ showToast('تعذر حذف الدفعة: '+e.message, 'error'); }
        }
      });
    };
  });

  // Row Delete for Expenses
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
    showToast('ليس لديك صلاحية للوصول إلى دفتر اليومية العامة', 'error');
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
          <span class="nav-item-icon">${getSvgIcon("daily", 16)}</span><span>دفتر اليومية وسجل العمليات</span>
        </div>

        ${hasFinanceNav ? `
          <div class="nav-section">القطاع المالي والخزينة</div>
          ${canUserAccessSection('cashdrawer') ? `
            <div class="nav-item" id="dayToDrawerNav">
              <span class="nav-item-icon">${getSvgIcon("cashdrawer", 16)}</span><span>حركة الخزينة والدرج</span>
            </div>
          ` : ''}
          ${canUserAccessSection('invoices') ? `
            <div class="nav-item" id="dayToInvoicesNav">
              <span class="nav-item-icon">${getSvgIcon("invoices", 16)}</span><span>الفواتير وعروض الأسعار</span>
            </div>
          ` : ''}
          ${canUserAccessSection('finance') ? `
            <div class="nav-item" id="dayToFinanceNav">
              <span class="nav-item-icon">${getSvgIcon("finance", 16)}</span><span>شجرة الحسابات والقيود</span>
            </div>
            <div class="nav-item" id="dayToIncomeNav">
              <span class="nav-item-icon">${getSvgIcon("chart", 16)}</span><span>تقرير الأرباح والدخل</span>
            </div>
          ` : ''}
        ` : ''}

        ${hasQuickNav ? `
          <div class="nav-section">التنقل السريع</div>
          ${canUserAccessSection('pos') ? `
            <div class="nav-item" id="dayToPosNav">
              <span class="nav-item-icon">${getSvgIcon("pos", 16)}</span><span>نقطة البيع (POS)</span>
            </div>
          ` : ''}
          ${canUserAccessSection('settings') ? `
            <div class="nav-item" id="dayToSettingsNav">
              <span class="nav-item-icon">${getSvgIcon("settings", 16)}</span><span>الإعدادات</span>
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

/* ---------------- Cash Drawer & Treasury Application (حركة الخزينة والدرج وتقفيل الوردية) ---------------- */
function renderCashDrawerSectionApp(app){
  if(!canUserAccessSection('cashdrawer')){
    showToast('ليس لديك صلاحية للوصول إلى حركة الخزينة والدرج', 'error');
    state.currentSection = null;
    return render();
  }
  const hasFinanceNav = canUserAccessSection('daily') || canUserAccessSection('invoices') || canUserAccessSection('finance');
  const hasQuickNav = canUserAccessSection('pos') || canUserAccessSection('settings');

  app.innerHTML = `
    <div class="sidebar">
      ${brandHtml("حركة الخزينة والدرج")}
      ${sectionSwitcherHtml()}
      <div class="sidebar-nav-wrap">
        <div class="nav-section">إدارة الدرج والوردية</div>
        <div class="nav-item active">
          <span class="nav-item-icon">${getSvgIcon("cashdrawer", 16)}</span><span>حركة الخزينة والدرج</span>
        </div>

        ${hasFinanceNav ? `
          <div class="nav-section">القطاع المالي والمحاسبي</div>
          ${canUserAccessSection('daily') ? `
            <div class="nav-item" id="drwToDailyNav">
              <span class="nav-item-icon">${getSvgIcon("daily", 16)}</span><span>دفتر اليومية العامة</span>
            </div>
          ` : ''}
          ${canUserAccessSection('invoices') ? `
            <div class="nav-item" id="drwToInvoicesNav">
              <span class="nav-item-icon">${getSvgIcon("invoices", 16)}</span><span>الفواتير وعروض الأسعار</span>
            </div>
          ` : ''}
          ${canUserAccessSection('finance') ? `
            <div class="nav-item" id="drwToFinanceNav">
              <span class="nav-item-icon">${getSvgIcon("finance", 16)}</span><span>شجرة الحسابات والقيود</span>
            </div>
          ` : ''}
        ` : ''}

        ${hasQuickNav ? `
          <div class="nav-section">التنقل السريع</div>
          ${canUserAccessSection('pos') ? `
            <div class="nav-item" id="drwToPosNav">
              <span class="nav-item-icon">${getSvgIcon("pos", 16)}</span><span>نقطة البيع (POS)</span>
            </div>
          ` : ''}
          ${canUserAccessSection('settings') ? `
            <div class="nav-item" id="drwToSettingsNav">
              <span class="nav-item-icon">${getSvgIcon("settings", 16)}</span><span>الإعدادات</span>
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

  const toDaily = document.getElementById('drwToDailyNav');
  if(toDaily) toDaily.onclick = ()=>{ state.currentSection = 'daily'; render(); };
  const toInv = document.getElementById('drwToInvoicesNav');
  if(toInv) toInv.onclick = ()=>{ state.currentSection = 'invoices'; render(); };
  const toFin = document.getElementById('drwToFinanceNav');
  if(toFin) toFin.onclick = ()=>{ state.currentSection = 'finance'; state.financeTab = 'accounts'; render(); };
  const toPos = document.getElementById('drwToPosNav');
  if(toPos) toPos.onclick = ()=>{ state.currentSection = 'pos'; render(); };
  const toSet = document.getElementById('drwToSettingsNav');
  if(toSet) toSet.onclick = ()=>{ state.currentSection = 'settings'; render(); };

  renderCashDrawerPage(document.getElementById('main'));
}

function renderCashDrawerPage(main){
  if(!state.drawerDateFilter) state.drawerDateFilter = 'today';
  if(!state.drawerCustomDate) state.drawerCustomDate = new Date().toISOString().slice(0,10);
  if(!state.drawerTypeFilter) state.drawerTypeFilter = 'all';
  if(!state.drawerMethodFilter) state.drawerMethodFilter = 'all';
  if(!state.drawerSearchQ) state.drawerSearchQ = '';

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
  if(state.drawerDateFilter === 'today'){
    filtered = filtered.filter(t => t.date === todayStr);
  } else if(state.drawerDateFilter === 'yesterday'){
    filtered = filtered.filter(t => t.date === yesterdayStr);
  } else if(state.drawerDateFilter === 'week'){
    filtered = filtered.filter(t => t.date >= weekAgoStr);
  } else if(state.drawerDateFilter === 'month'){
    filtered = filtered.filter(t => t.date >= monthStartStr);
  } else if(state.drawerDateFilter === 'custom'){
    filtered = filtered.filter(t => t.date === state.drawerCustomDate);
  }

  // Apply Type Filter
  if(state.drawerTypeFilter === 'in'){
    filtered = filtered.filter(t => t.in > 0);
  } else if(state.drawerTypeFilter === 'out'){
    filtered = filtered.filter(t => t.out > 0);
  } else if(state.drawerTypeFilter === 'petty'){
    filtered = filtered.filter(t => t.type === 'petty' || (t.category||'').includes('نثريات'));
  } else if(state.drawerTypeFilter === 'pos'){
    filtered = filtered.filter(t => t.sourceType === 'pos');
  } else if(state.drawerTypeFilter === 'maintenance'){
    filtered = filtered.filter(t => t.sourceType === 'maintenance' || t.sourceType === 'refund');
  }

  // Payment Channels Breakdown helper & totals
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

  // Apply Payment Method Filter
  if(state.drawerMethodFilter && state.drawerMethodFilter !== 'all'){
    filtered = filtered.filter(t => isMethodMatch(t.method, state.drawerMethodFilter));
  }

  // Apply Search
  const q = (state.drawerSearchQ||'').trim().toLowerCase();
  if(q){
    filtered = filtered.filter(t =>
      (t.title||'').toLowerCase().includes(q) ||
      (t.reference||'').toLowerCase().includes(q) ||
      (t.category||'').toLowerCase().includes(q) ||
      (t.by||'').toLowerCase().includes(q) ||
      (t.notes||'').toLowerCase().includes(q)
    );
  }

  // KPIs
  const totalIn = filtered.reduce((s,t)=>s+Number(t.in||0), 0);
  const totalOut = filtered.reduce((s,t)=>s+Number(t.out||0), 0);
  const totalPetty = filtered.filter(t=>t.type==='petty'||(t.category||'').includes('نثريات')).reduce((s,t)=>s+Number(t.out||0), 0);
  const netShiftCash = totalIn - totalOut;
  const currentTotalCashInDrawer = allTx.filter(t => isMethodMatch(t.method, 'cash')).reduce((s,t)=>s + Number(t.in||0) - Number(t.out||0), 0);
  const totalAllLiquidity = allTx.filter(t => !isMethodMatch(t.method, 'credit')).reduce((s,t)=>s + Number(t.in||0) - Number(t.out||0), 0);
  const posCashIn = filtered.filter(t => t.sourceType==='pos' && isMethodMatch(t.method, 'cash')).reduce((s,t)=>s+Number(t.in||0), 0);
  const maintCashIn = filtered.filter(t => t.sourceType==='maintenance' && isMethodMatch(t.method, 'cash')).reduce((s,t)=>s+Number(t.in||0), 0);

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("cashdrawer", 22)} حركة الخزينة والدرج</h2>
        <div class="subtitle mono" style="font-size:12px;color:var(--ink-secondary);">${filtered.length} حركة نقدية مسجلة بالدرج • رصيد الدرج الحي (كاش): <b>${currentTotalCashInDrawer.toLocaleString()} ج.م</b> • إجمالي السيولة الشاملة: <b>${totalAllLiquidity.toLocaleString()} ج.م</b></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-blue btn-sm" id="drawerClosePrintBtn">${getSvgIcon("printer", 14)} طباعة تقفيل الدرج والوردية</button>
        ${canUserAccessSection('daily') ? `<button class="btn btn-purple btn-sm" id="drawerToDailyBtn">${getSvgIcon("daily", 14)} دفتر اليومية العامة</button>` : ''}
        <button class="btn btn-green btn-sm" id="drawerManualInBtn">${getSvgIcon("plus", 14)} توريد نقدية للدرج</button>
        <button class="btn btn-amber btn-sm" id="drawerManualOutBtn">${getSvgIcon("arrowDown", 14)} سحب نقدية من الدرج</button>
        <button class="btn btn-primary btn-sm" id="drawerPettyBtn">${getSvgIcon("tag", 14)} نثريات وعهدة</button>
        <button class="btn btn-red btn-sm" id="drawerExpenseBtn">${getSvgIcon("wallet", 14)} مصروف يومي</button>
        <button class="btn btn-ghost btn-sm" id="drawerExportCsvBtn">${getSvgIcon("download", 14)} تصدير كشف الدرج</button>
      </div>
    </div>

    <!-- Active Shift Status Ribbon in Cash Drawer -->
    ${state.activeShift ? `
      <div class="card" style="padding:10px 14px;margin-bottom:14px;background:linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.06));border:1px solid rgba(16,185,129,0.3);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <span class="status-badge st-delivered" style="font-size:12px;padding:4px 10px;background:rgba(16,185,129,0.18);color:var(--green);font-weight:800;">
            <span class="status-dot dot-green" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;margin-left:6px;"></span> الوردية الحالية #${state.activeShift.shiftNumber || 1}
          </span>
          <span style="font-size:12px;color:var(--ink);">
            الكاشير: <b>${escapeHtml(state.activeShift.cashierName || (state.user ? state.user.name : 'الكاشير'))}</b>
          </span>
          <span class="mono" style="font-size:11.5px;color:var(--ink-secondary);">
            ${getSvgIcon("clock", 12)} بدأت: ${state.activeShift.startTime ? new Date(state.activeShift.startTime).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'}) : 'الآن'}
          </span>
          <span class="mono" style="font-size:11.5px;color:var(--ink-secondary);">
            عهدة البداية: <b>${Number(state.activeShift.openingFloat || 0).toLocaleString()} ج.م</b>
          </span>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          <button type="button" class="btn btn-ghost btn-sm" id="drawerPrintXReportBtn" style="background:var(--surface);border:1px solid var(--border);color:var(--ink);font-weight:700;">
            ${getSvgIcon("chart", 13)} قراءة لحظية (X-Report)
          </button>
          <button type="button" class="btn btn-red btn-sm" id="drawerCloseShiftBtn" style="font-weight:800;">
            ${getSvgIcon("lock", 13)} تقفيل الوردية (Z-Report)
          </button>
          <button type="button" class="btn btn-ghost btn-sm" id="drawerShiftsHistoryBtn" style="background:var(--surface);border:1px solid var(--border);">
            ${getSvgIcon("archive", 13)} أرشيف الورديات
          </button>
        </div>
      </div>
    ` : `
      <div class="card" style="padding:10px 14px;margin-bottom:14px;background:linear-gradient(135deg, rgba(245,158,11,0.08), rgba(239,68,68,0.04));border:1px dashed rgba(245,158,11,0.5);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="display:inline-flex;">${getSvgIcon('alert', 18)}</span>
          <div>
            <div style="font-weight:800;font-size:12.5px;color:var(--ink);">لا توجد وردية كاشير مفتوحة حالياً بالدرج</div>
            <div style="font-size:11px;color:var(--ink-secondary);">افتح وردية جديدة لتعيين عهدة النقدية ومتابعة المبيعات والتقفيل اليومي بدقة.</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <button type="button" class="btn btn-primary btn-sm" id="drawerOpenShiftBtn" style="font-weight:800;display:inline-flex;align-items:center;gap:6px;">
            ${getSvgIcon("play", 13)} فتح وردية جديدة
          </button>
          <button type="button" class="btn btn-ghost btn-sm" id="drawerShiftsHistoryBtn" style="background:var(--surface);border:1px solid var(--border);">
            ${getSvgIcon("archive", 13)} أرشيف الورديات
          </button>
        </div>
      </div>
    `}

    <!-- Drawer KPIs Grid -->
    <div class="stat-grid" style="grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:16px;">
      <div class="stat-card" style="border-top:3px solid #10b981;background:linear-gradient(180deg, #ecfdf5 0%, #fff 100%);">
        <div class="top-row"><span class="lbl" style="color:#047857;font-weight:900;display:flex;align-items:center;gap:4px;">${getSvgIcon("wallet", 14)} الرصيد الفعلي بالدرج (كاش)</span><div class="icon-box" style="background:#d1fae5;color:#047857;">${getSvgIcon("wallet", 18)}</div></div>
        <div class="num mono" style="color:#047857;font-weight:900;">${currentTotalCashInDrawer.toLocaleString()} <span style="font-size:12px;">ج.م</span></div>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:3px;">السيولة النقدية الحاضرة بالخزينة الآن (إجمالي السيولة: ${totalAllLiquidity.toLocaleString()} ج.م)</div>
      </div>
      <div class="stat-card" style="border-top:3px solid #0284c7;background:linear-gradient(180deg, #f0f9ff 0%, #fff 100%);">
        <div class="top-row"><span class="lbl" style="color:#0369a1;font-weight:800;display:flex;align-items:center;gap:4px;">${getSvgIcon("trendUp", 14)} وارد الدرج (المقبوضات)</span><div class="icon-box" style="background:#e0f2fe;color:#0369a1;">${getSvgIcon("trendUp", 18)}</div></div>
        <div class="num mono" style="color:#0284c7;">+${totalIn.toLocaleString()} <span style="font-size:12px;">ج.م</span></div>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:3px;">كاشير POS (${posCashIn.toLocaleString()}) + صيانة (${maintCashIn.toLocaleString()})</div>
      </div>
      <div class="stat-card" style="border-top:3px solid #ef4444;background:linear-gradient(180deg, #fef2f2 0%, #fff 100%);">
        <div class="top-row"><span class="lbl" style="color:#b91c1c;font-weight:800;display:flex;align-items:center;gap:4px;">${getSvgIcon("trendDown", 14)} منصرفات ومسحوبات الدرج</span><div class="icon-box" style="background:#fee2e2;color:#b91c1c;">${getSvgIcon("trendDown", 18)}</div></div>
        <div class="num mono" style="color:#dc2626;">-${totalOut.toLocaleString()} <span style="font-size:12px;">ج.م</span></div>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:3px;">نثريات وبوفيه (${totalPetty.toLocaleString()} ج.م) + مصروفات</div>
      </div>
      <div class="stat-card" style="border-top:3px solid #6366f1;background:linear-gradient(180deg, #eef2ff 0%, #fff 100%);">
        <div class="top-row"><span class="lbl" style="color:#4338ca;font-weight:800;display:flex;align-items:center;gap:4px;">${getSvgIcon("scale", 14)} صافي حركة الوردية</span><div class="icon-box" style="background:#e0e7ff;color:#4338ca;">${getSvgIcon("chart", 18)}</div></div>
        <div class="num mono" style="color:${netShiftCash>=0?'#15803d':'#dc2626'};">${netShiftCash>=0?'+':''}${netShiftCash.toLocaleString()} <span style="font-size:12px;">ج.م</span></div>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:3px;">صافي السيولة النقدية للفترة المحددة</div>
      </div>
    </div>

    <!-- Payment Channels Breakdown (متابعة وتفصيل حركة الخزينة حسب وسيلة الدفع) -->
    <div style="background:var(--paper2);border:1.5px solid var(--line);border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
        <span style="font-size:12px;font-weight:800;color:var(--ink);display:flex;align-items:center;gap:6px;">
          <span>${getSvgIcon("creditCard", 15)}</span><span>متابعة وتفصيل الخزينة حسب وسيلة التحصيل</span>
        </span>
        <span style="font-size:11px;color:var(--ink-secondary);">اضغط على أي قناة لفرز وعزل حركات الدرج</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;">
        <div class="pos-pay-stat-tile" data-drmethodquick="cash" style="background:#fff;border:1.5px solid ${state.drawerMethodFilter==='cash'?'#059669':'#cbd5e1'};border-radius:6px;padding:8px 10px;cursor:pointer;transition:all 0.15s ease;">
          <div style="font-size:11px;color:#047857;font-weight:800;">نقدي (كاش بالدرج)</div>
          <div class="mono font-bold" style="font-size:14px;color:#065f46;margin-top:2px;">${cashNet.toLocaleString()} ج.م</div>
          <div style="font-size:9.5px;color:var(--ink-secondary);">ح/ 1101 الخزينة</div>
        </div>
        <div class="pos-pay-stat-tile" data-drmethodquick="visa" style="background:#fff;border:1.5px solid ${state.drawerMethodFilter==='visa'?'#4338ca':'#cbd5e1'};border-radius:6px;padding:8px 10px;cursor:pointer;transition:all 0.15s ease;">
          <div style="font-size:11px;color:#3730a3;font-weight:800;">فيزا وبطاقات</div>
          <div class="mono font-bold" style="font-size:14px;color:#4338ca;margin-top:2px;">${cardIn.toLocaleString()} ج.م</div>
          <div style="font-size:9.5px;color:var(--ink-secondary);">ح/ 1102 البنك</div>
        </div>
        <div class="pos-pay-stat-tile" data-drmethodquick="instapay" style="background:#fff;border:1.5px solid ${state.drawerMethodFilter==='instapay'?'#d97706':'#cbd5e1'};border-radius:6px;padding:8px 10px;cursor:pointer;transition:all 0.15s ease;">
          <div style="font-size:11px;color:#92400e;font-weight:800;">إنستاباي InstaPay</div>
          <div class="mono font-bold" style="font-size:14px;color:#b45309;margin-top:2px;">${instapayNet.toLocaleString()} ج.م</div>
          <div style="font-size:9.5px;color:var(--ink-secondary);">ح/ 1102 لحظي</div>
        </div>
        <div class="pos-pay-stat-tile" data-drmethodquick="wallet" style="background:#fff;border:1.5px solid ${state.drawerMethodFilter==='wallet'?'#dc2626':'#cbd5e1'};border-radius:6px;padding:8px 10px;cursor:pointer;transition:all 0.15s ease;">
          <div style="font-size:11px;color:#991b1b;font-weight:800;">محافظ نقدية</div>
          <div class="mono font-bold" style="font-size:14px;color:#b91c1c;margin-top:2px;">${walletNet.toLocaleString()} ج.م</div>
          <div style="font-size:9.5px;color:var(--ink-secondary);">ح/ 1102 محافظ</div>
        </div>
        <div class="pos-pay-stat-tile" data-drmethodquick="credit" style="background:#fff;border:1.5px solid ${state.drawerMethodFilter==='credit'?'#7e22ce':'#cbd5e1'};border-radius:6px;padding:8px 10px;cursor:pointer;transition:all 0.15s ease;">
          <div style="font-size:11px;color:#6b21a8;font-weight:800;">آجل وعلى الحساب</div>
          <div class="mono font-bold" style="font-size:14px;color:#7e22ce;margin-top:2px;">${creditNet.toLocaleString()} ج.م</div>
          <div style="font-size:9.5px;color:var(--ink-secondary);">ح/ 1103 مدينون</div>
        </div>
      </div>
    </div>

    <!-- Date Presets & Filter Bar -->
    <div class="chip-group" id="drawerDateChips" style="margin-bottom:12px;">
      <div class="chip ${state.drawerDateFilter==='today'?'sel':''}" data-drchip="today">${getSvgIcon("calendar", 12)} وردية اليوم (${todayStr})</div>
      <div class="chip ${state.drawerDateFilter==='yesterday'?'sel':''}" data-drchip="yesterday">أمس</div>
      <div class="chip ${state.drawerDateFilter==='week'?'sel':''}" data-drchip="week">آخر 7 أيام</div>
      <div class="chip ${state.drawerDateFilter==='month'?'sel':''}" data-drchip="month">هذا الشهر</div>
      <div class="chip ${state.drawerDateFilter==='all'?'sel':''}" data-drchip="all">كل الأوقات</div>
      <div class="chip ${state.drawerDateFilter==='custom'?'sel':''}" data-drchip="custom">${getSvgIcon("calendar", 12)} تاريخ مخصص</div>
    </div>

    <div class="chip-group" id="drawerTypeChips" style="margin-bottom:12px;">
      <div class="chip ${state.drawerTypeFilter==='all'?'sel':''}" data-dtchip="all">كل حركات الدرج</div>
      <div class="chip ${state.drawerTypeFilter==='in'?'sel':''}" data-dtchip="in">مقبوضات نقدية (وارد)</div>
      <div class="chip ${state.drawerTypeFilter==='out'?'sel':''}" data-dtchip="out">مسحوبات ومنصرفات</div>
      <div class="chip ${state.drawerTypeFilter==='petty'?'sel':''}" data-dtchip="petty">نثريات وعهدة</div>
      <div class="chip ${state.drawerTypeFilter==='pos'?'sel':''}" data-dtchip="pos">مبيعات كاشير POS</div>
      <div class="chip ${state.drawerTypeFilter==='maintenance'?'sel':''}" data-dtchip="maintenance">مقبوضات صيانة</div>
    </div>

    <div class="filters-bar" style="margin-bottom:14px;flex-wrap:wrap;">
      ${state.drawerDateFilter==='custom' ? `
        <input id="drawerCustomDateInp" type="date" value="${state.drawerCustomDate}" style="width:140px;">
      ` : ''}
      <input id="drawerSearchInp" placeholder="بحث في حركات الدرج، الإيصالات، العهدة، أو المستلم..." value="${state.drawerSearchQ}" style="flex:1;min-width:220px;">
      ${(state.drawerSearchQ || state.drawerTypeFilter!=='all' || state.drawerDateFilter!=='today') ? `<button class="btn btn-ghost btn-sm" id="clearDrawerFilters">إعادة ضبط</button>` : ''}
    </div>

    <!-- Drawer Ledger Table -->
    <div class="card">
      ${filtered.length===0 ? '<div class="empty">لا توجد حركات مسجلة بالدرج مطابقة للفلتر المحدد.</div>' : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:40px;">#</th>
              <th>الوقت والتاريخ</th>
              <th>البيان والحركة</th>
              <th>المرجع / المصدر</th>
              <th>التصنيف</th>
              <th style="text-align:center;">وارد الدرج (+)</th>
              <th style="text-align:center;">منصرف الدرج (-)</th>
              <th style="text-align:center;">رصيد الدرج اللحظي</th>
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
                    <span class="status-badge st-check" style="font-size:10.5px;">${t.sourceIcon} ${t.reference}</span>
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
                    ${t.canDelete && (state.user && (state.user.role==='admin' || !!state.user.superuser)) ? `
                      <button class="btn btn-xs btn-red" data-txdel="${t.rawExpId}" title="حذف القيد اليدوي">${getSvgIcon('trash', 13)}</button>
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
  document.querySelectorAll('#drawerDateChips .chip').forEach(c => {
    c.onclick = ()=>{
      state.drawerDateFilter = c.dataset.drchip;
      renderCashDrawerPage(main);
    };
  });
  document.querySelectorAll('#drawerTypeChips .chip').forEach(c => {
    c.onclick = ()=>{
      state.drawerTypeFilter = c.dataset.dtchip;
      renderCashDrawerPage(main);
    };
  });

  // Quick Payment Channels Click Filter
  main.querySelectorAll('[data-drmethodquick]').forEach(tile => {
    tile.onclick = () => {
      const m = tile.dataset.drmethodquick;
      state.drawerMethodFilter = (state.drawerMethodFilter === m) ? 'all' : m;
      renderCashDrawerPage(main);
    };
  });

  const dateInp = document.getElementById('drawerCustomDateInp');
  if(dateInp){
    dateInp.onchange = (e)=>{ state.drawerCustomDate = e.target.value; renderCashDrawerPage(main); };
  }
  const sInp = document.getElementById('drawerSearchInp');
  if(sInp){
    sInp.oninput = (e)=>{ state.drawerSearchQ = e.target.value; renderCashDrawerPage(main); };
  }
  const clrBtn = document.getElementById('clearDrawerFilters');
  if(clrBtn){
    clrBtn.onclick = ()=>{
      state.drawerDateFilter = 'today';
      state.drawerTypeFilter = 'all';
      state.drawerMethodFilter = 'all';
      state.drawerSearchQ = '';
      renderCashDrawerPage(main);
    };
  }

  // Buttons
  document.getElementById('drawerManualInBtn').onclick = ()=>openRecordTransactionModal('in');
  document.getElementById('drawerManualOutBtn').onclick = ()=>openRecordTransactionModal('out');
  document.getElementById('drawerPettyBtn').onclick = ()=>openRecordTransactionModal('petty');
  document.getElementById('drawerExpenseBtn').onclick = ()=>openRecordTransactionModal('expense');
  document.getElementById('drawerExportCsvBtn').onclick = ()=>exportDailyJournalToExcel(filtered, { totalIn, totalOut, totalPetty, netCash: netShiftCash });
  document.getElementById('drawerClosePrintBtn').onclick = ()=>{
    const curDateStr = state.drawerDateFilter === 'custom' ? state.drawerCustomDate : (state.drawerDateFilter==='yesterday'?yesterdayStr:todayStr);
    openDailyClosePrint(curDateStr, { totalIn, totalOut, totalPetty, netCash: netShiftCash }, filtered);
  };

  const drawerOpenShiftBtn = document.getElementById('drawerOpenShiftBtn');
  if(drawerOpenShiftBtn){
    drawerOpenShiftBtn.onclick = () => openStartShiftModal(() => renderCashDrawerPage(main));
  }
  const drawerCloseShiftBtn = document.getElementById('drawerCloseShiftBtn');
  if(drawerCloseShiftBtn){
    drawerCloseShiftBtn.onclick = () => openCloseShiftModal();
  }
  const drawerPrintXReportBtn = document.getElementById('drawerPrintXReportBtn');
  if(drawerPrintXReportBtn){
    drawerPrintXReportBtn.onclick = () => {
      const active = getActiveShift();
      if(active) openShiftPrint(active, 'X', 'thermal');
      else showToast('لا توجد وردية نشطة حالياً', 'error');
    };
  }
  const drawerShiftsHistoryBtn = document.getElementById('drawerShiftsHistoryBtn');
  if(drawerShiftsHistoryBtn){
    drawerShiftsHistoryBtn.onclick = () => openShiftsHistoryModal();
  }
  const toDailyBtn = document.getElementById('drawerToDailyBtn');
  if(toDailyBtn) toDailyBtn.onclick = ()=>{ state.currentSection = 'daily'; render(); };

  // Row Delete
  main.querySelectorAll('[data-txdel]').forEach(btn => {
    btn.onclick = async ()=>{
      const exp = (state.expenses || []).find(x=>x.ID === btn.dataset.txdel);
      const title = exp ? exp.Title : 'حركة بالدرج';
      requestAdminAuthorization({
        action: 'حذف حركة بالدرج والخزينة',
        entityType: 'حركة نقدية / مصروف',
        entityId: btn.dataset.txdel,
        entityTitle: title,
        onApproved: async ()=>{
          try{
            await deleteExpenseRemote(btn.dataset.txdel);
            showToast('تم حذف الحركة بنجاح', 'success');
            renderCashDrawerPage(main);
          }catch(e){ showToast('تعذر الحذف: '+e.message, 'error'); }
        }
      });
    };
  });
}

// Alias for backward compatibility
function renderExpensesPage(main){
  renderCashDrawerPage(main);
}

/* Note: Cameras Section, CCTV Projects, Sites and Quotations migrated to 21-cctv-projects.js [U1] */
