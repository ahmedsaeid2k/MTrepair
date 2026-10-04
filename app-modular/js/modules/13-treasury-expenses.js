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
            <span style="display:inline-flex;">' + getSvgIcon('alert', 18) + '</span>
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
              ${getSvgIcon("refresh", 14)} تنظيف الدفعات المكررة وضبط الخزينة
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
                      ${t.sourceType==='maintenance' ? `
                        <button class="btn btn-xs btn-red" data-txpaydel="${t.rawPayId}" title="حذف دفعة الصيانة وتصحيح الخزينة والإيصال">' + getSvgIcon('trash', 13) + '</button>
                      ` : `
                        <button class="btn btn-xs btn-red" data-txdel="${t.rawExpId}" title="حذف القيد اليدوي">' + getSvgIcon('trash', 13) + '</button>
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
    autoFixBtn.onclick = async ()=>{
      if(!confirm('هل أنت متأكد من رغبتك في إزالة الدفعات المتكررة تلقائياً وتصحيح رصيد الخزينة والإيصالات؟')) return;
      await cleanDuplicatePayments();
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
          <span style="display:inline-flex;">' + getSvgIcon('alert', 18) + '</span>
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
                      <button class="btn btn-xs btn-red" data-txdel="${t.rawExpId}" title="حذف القيد اليدوي">' + getSvgIcon('trash', 13) + '</button>
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

/* ---------------- Cameras Section ---------------- */
function renderCamerasApp(app){
  if(!state.camTab) state.camTab = 'catalog';
  app.innerHTML = `
    <div class="sidebar">
      ${brandHtml("قسم الكاميرات")}
      ${sectionSwitcherHtml()}
      <div class="sidebar-nav-wrap">
        <div class="nav-section">القائمة</div>
        <div class="nav-item ${state.camTab==='catalog'?'active':''}" data-camtab="catalog"><span class="nav-item-icon">${getSvgIcon("cameras", 16)}</span><span>كتالوج الكاميرات</span></div>
        <div class="nav-item ${state.camTab==='quote'?'active':''}" data-camtab="quote"><span class="nav-item-icon">${getSvgIcon("plus", 16)}</span><span>عرض سعر جديد</span></div>
        <div class="nav-item ${state.camTab==='quotes'?'active':''}" data-camtab="quotes"><span class="nav-item-icon">${getSvgIcon("fileText", 16)}</span><span>عروض الأسعار السابقة</span></div>
      </div>
      ${sidebarFootHtml()}
    </div>
    <main id="main"></main>
  `;
  const sw = document.getElementById('switchSectionBtn');
  if(sw) sw.onclick = ()=>{ state.currentSection = null; render(); };
  attachSidebarHandlers();
  document.querySelectorAll('[data-camtab]').forEach(el=>{
    el.onclick = ()=>{ state.camTab = el.dataset.camtab; renderCamerasApp(app); };
  });
  const main = document.getElementById('main');
  if(state.camTab==='catalog') renderInventory(main, 'كاميرات', 'كتالوج الكاميرات ومعدات المراقبة');
  else if(state.camTab==='quote') renderQuotationBuilder(main);
  else renderQuotationsList(main);
}

function renderQuotationBuilder(main){
  if(!state.quoCart) state.quoCart = [];
  const cart = state.quoCart;
  const itemsTotal = cart.reduce((s,c)=>s+c.qty*c.price,0);
  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("plus", 20)} عرض سعر جديد — كاميرات مراقبة وشبكات</h2>
              </div>
      <div>
        <button class="btn btn-ghost btn-sm" id="quoBackToListBtn">${getSvgIcon("fileText", 14)} عروض الأسعار السابقة</button>
      </div>
    </div>
    <div class="card">
      <h3>${getSvgIcon("user", 16)} بيانات العميل / الشركة</h3>
      <div style="display:grid;grid-template-columns:140px 1.5fr 1fr;gap:10px;">
        <div class="field">
          <label>اللقب (اختياري)</label>
          <select id="quoClientTitle">
            ${[''].concat(CUSTOMER_TITLES).map(t=>`<option value="${escapeHtml(t)}">${t ? escapeHtml(t) : '-- بدون لقب --'}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>اسم العميل / الشركة *</label><input id="quoClientName"></div>
        <div class="field"><label>رقم الهاتف</label><input id="quoClientPhone"></div>
      </div>
    </div>
    <div class="card">
      <h3>${getSvgIcon("package", 16)} إضافة منتج من المخزن</h3>
      <div style="display:flex;gap:8px;align-items:flex-end;">
        <div class="field" style="flex:2;margin-bottom:0;"><label>المنتج</label>
          <select id="quoPickItem">
            <option value="">-- اختر منتج --</option>
            ${state.inventory.filter(it=>(it.Category||'صيانة')==='كاميرات').map(it=>`<option value="${it.ID}">${it.Name} (متاح: ${it.Quantity}) - ${it.SellPrice||it.PurchasePrice} ج.م</option>`).join('')}
          </select>
        </div>
        <div class="field" style="flex:1;margin-bottom:0;"><label>الكمية</label><input id="quoPickQty" type="number" value="1" min="1"></div>
        <button class="btn btn-primary btn-sm" id="quoAddItemBtn">إضافة</button>
      </div>
    </div>
    <div class="card">
      <h3>${getSvgIcon("tool", 16)} إضافة خدمة وتركيبات</h3>
      <div style="display:flex;gap:8px;align-items:flex-end;">
        <div class="field" style="flex:2;margin-bottom:0;"><label>الخدمة</label>
          <select id="quoPickService">
            <option value="">-- اختر خدمة من الكتالوج --</option>
            ${state.services.map(s=>`<option value="${s.Name}" data-price="${s.DefaultPrice}">${s.Name} (${s.DefaultPrice} ج.م)</option>`).join('')}
          </select>
        </div>
        <div class="field" style="flex:2;margin-bottom:0;"><label>أو خدمة يدويًا</label><input id="quoManualService" placeholder="مثال: تمديد كابلات وشبكة..."></div>
        <div class="field" style="flex:1;margin-bottom:0;"><label>السعر (ج.م)</label><input id="quoServicePrice" type="number" value="0"></div>
        <button class="btn btn-primary btn-sm" id="quoAddServiceBtn">إضافة</button>
      </div>
    </div>
    <div class="card">
      <h3>بنود عرض السعر</h3>
      ${cart.length===0 ? '<div class="empty">لم تتم إضافة بنود بعد.</div>' : `
      <div class="table-wrap"><table><thead><tr><th>البند</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th><th></th></tr></thead><tbody>
        ${cart.map((c,i)=>`<tr><td>${c.name}${c.type==='service'?' <span style="color:var(--ink-secondary);font-size:11px;">(خدمة)</span>':''}</td><td class="mono">${c.qty}</td><td class="mono">${c.price}</td><td class="mono font-bold">${c.qty*c.price}</td>
        <td><button class="btn btn-xs btn-red" data-quocartidx="${i}">إزالة</button></td></tr>`).join('')}
      </tbody></table></div>`}
      <div style="text-align:left;font-size:20px;font-weight:900;margin-top:14px;">الإجمالي: <span class="mono" style="color:var(--primary);">${itemsTotal}</span> ج.م</div>
      <button class="btn btn-green" id="saveQuoteBtn" style="margin-top:8px;" ${cart.length===0?'disabled':''}>${getSvgIcon("check", 14)} حفظ وطباعة عرض السعر</button>
    </div>
  `;

  document.getElementById('quoBackToListBtn').onclick = ()=>{
    state.camTab = 'quotes';
    renderCamerasApp(document.getElementById('app'));
  };

  document.getElementById('quoAddItemBtn').onclick = ()=>{
    const itemId = document.getElementById('quoPickItem').value;
    const qty = Number(document.getElementById('quoPickQty').value);
    if(!itemId || !qty){ showToast('اختر صنف وكمية صحيحة', 'error'); return; }
    const item = state.inventory.find(x=>x.ID===itemId);
    cart.push({type:'product', itemId, name:item.Name, qty, price:Number(item.SellPrice||item.PurchasePrice||0)});
    renderQuotationBuilder(main);
  };
  document.getElementById('quoAddServiceBtn').onclick = ()=>{
    const sel = document.getElementById('quoPickService');
    const manual = document.getElementById('quoManualService').value.trim();
    const name = manual || sel.options[sel.selectedIndex].text.split(' (')[0];
    const price = Number(document.getElementById('quoServicePrice').value) || Number(sel.options[sel.selectedIndex]?.dataset?.price || 0);
    if(!name || name.startsWith('--')){ showToast('اختر أو اكتب خدمة', 'error'); return; }
    cart.push({type:'service', name, qty:1, price});
    renderQuotationBuilder(main);
  };
  document.getElementById('quoPickService').onchange = (e)=>{
    const opt = e.target.options[e.target.selectedIndex];
    if(opt && opt.dataset.price) document.getElementById('quoServicePrice').value = opt.dataset.price;
  };
  main.querySelectorAll('[data-quocartidx]').forEach(btn=>{
    btn.onclick = ()=>{ cart.splice(Number(btn.dataset.quocartidx),1); renderQuotationBuilder(main); };
  });

  const saveBtn = document.getElementById('saveQuoteBtn');
  if(saveBtn) saveBtn.onclick = async ()=>{
    const clientTitle = extractCustomerTitle({ CustomerTitle: (document.getElementById('quoClientTitle')?.value || '') });
    const clientName = document.getElementById('quoClientName').value.trim();
    const clientPhone = document.getElementById('quoClientPhone').value.trim();
    if(!clientName){ showToast('اكتب اسم العميل أو الشركة', 'error'); return; }
    saveBtn.disabled = true; saveBtn.textContent = 'جارٍ الحفظ...';
    const itemsSummary = cart.map(c=>`${c.name} × ${c.qty} (${c.qty*c.price} ج.م)`).join('، ');
    const q = {
      ID: 'quo_' + Date.now(),
      Date: new Date().toISOString().slice(0,10),
      ClientTitle: clientTitle,
      ClientName: clientName,
      ClientPhone: clientPhone,
      Items: JSON.parse(JSON.stringify(cart)),
      ItemsSummary: itemsSummary,
      LaborCost: cart.filter(c=>c.type==='service').reduce((s,c)=>s+c.qty*c.price,0),
      Total: itemsTotal,
      PaidAmount: 0,
      Payments: [],
      Status: 'معلق',
      By: state.user ? state.user.name : 'المسؤول'
    };
    try{
      const res = await saveQuotationRemote(q);
      showToast('تم حفظ عرض السعر بنجاح', 'success');
      openQuotationPrint(res.quotation, cart);
      state.quoCart = [];
      state.camTab = 'quotes';
      renderCamerasApp(document.getElementById('app'));
    }catch(e){ showToast('تم الحفظ محلياً: '+e.message, 'info'); }
    saveBtn.disabled = false; saveBtn.textContent = 'حفظ وطباعة عرض السعر';
  };
}

/* Helper to safely extract items array from a quotation object */
function getQuotationItems(q){
  if(Array.isArray(q.Items) && q.Items.length > 0) return q.Items;
  if(typeof q.Items === 'string' && q.Items.startsWith('[')){
    try { return JSON.parse(q.Items); } catch(e){}
  }
  if(q.ItemsSummary){
    const parts = q.ItemsSummary.split('،').map(p=>p.trim()).filter(Boolean);
    if(parts.length > 0){
      return parts.map(p => {
        const m = p.match(/(.*?)\s*×\s*(\d+)\s*\(([\d,.]+)\s*ج\.م\)/);
        if(m){
          const qty = Number(m[2]) || 1;
          const lineTotal = Number(m[3].replace(/,/g,'')) || 0;
          return { name: m[1].trim(), qty, price: qty > 0 ? (lineTotal / qty) : lineTotal, type: 'product' };
        }
        return { name: p, qty: 1, price: 0, type: 'product' };
      });
    }
  }
  return [{ name: 'مهمات وتوريدات وتركيبات كاميرات وشبكات', qty: 1, price: Number(q.Total||0), type: 'product' }];
}

/* ---------------- Enhanced Quotations Archive & Management ---------------- */
function renderQuotationsList(main){
  if(!state.quoFilter) state.quoFilter = { q: '', status: 'all' };

  // Calculate KPIs
  const allQ = state.quotations || [];
  const totalCount = allQ.length;
  const totalVal = allQ.reduce((s,x)=>s+Number(x.Total||0), 0);
  const pendingList = allQ.filter(x=>x.Status==='معلق' || !x.Status);
  const inProgressList = allQ.filter(x=>x.Status==='مقبول / جاري التنفيذ' || x.Status==='مقبول');
  const doneList = allQ.filter(x=>x.Status==='تم التنفيذ والتسليم' || x.Status==='تم التنفيذ');
  const totalCollected = allQ.reduce((s,x)=>s+Number(x.PaidAmount||0), 0);

  // Filter
  const qText = (state.quoFilter.q || '').trim().toLowerCase();
  const qStat = state.quoFilter.status || 'all';

  const filtered = allQ.slice().reverse().filter(q => {
    if(qStat !== 'all'){
      if(qStat === 'pending' && !(q.Status==='معلق' || !q.Status)) return false;
      if(qStat === 'in_progress' && !(q.Status==='مقبول / جاري التنفيذ' || q.Status==='مقبول')) return false;
      if(qStat === 'done' && !(q.Status==='تم التنفيذ والتسليم' || q.Status==='تم التنفيذ')) return false;
      if(qStat === 'cancelled' && !(q.Status==='ملغي / مرفوض' || q.Status==='ملغي')) return false;
    }
    if(qText){
      const matchName = (q.ClientName||'').toLowerCase().includes(qText);
      const matchPhone = (q.ClientPhone||'').includes(qText);
      const matchId = String(q.ID||'').toLowerCase().includes(qText);
      const matchSummary = (q.ItemsSummary||'').toLowerCase().includes(qText);
      if(!matchName && !matchPhone && !matchId && !matchSummary) return false;
    }
    return true;
  });

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("fileText", 20)} عروض الأسعار والمشاريع</h2>
              </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" id="quoGotoSettingsBtn">${getSvgIcon("settings", 14)} تخصيص شروط العروض والعقود</button>
        <button class="btn btn-primary btn-sm" id="quoNewBtn">${getSvgIcon("plus", 14)} عرض سعر جديد</button>
      </div>
    </div>

    <!-- Metric KPI Cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;margin-bottom:14px;">
      <div class="card" style="padding:12px;margin:0;border-right:3.5px solid var(--primary);">
        <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">إجمالي عروض الأسعار</div>
        <div class="num mono font-bold" style="font-size:18px;margin-top:2px;">${totalCount} <span style="font-size:11px;color:var(--ink-secondary);font-weight:normal;">(${totalVal.toLocaleString()} ج.م)</span></div>
      </div>
      <div class="card" style="padding:12px;margin:0;border-right:3.5px solid var(--amber);">
        <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">عروض معلقة بانتظار الرد</div>
        <div class="num mono font-bold" style="font-size:18px;margin-top:2px;color:var(--amber-text);">${pendingList.length}</div>
      </div>
      <div class="card" style="padding:12px;margin:0;border-right:3.5px solid var(--blue);">
        <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">مقبولة / جاري التنفيذ</div>
        <div class="num mono font-bold" style="font-size:18px;margin-top:2px;color:var(--blue-text);">${inProgressList.length}</div>
      </div>
      <div class="card" style="padding:12px;margin:0;border-right:3.5px solid var(--green);">
        <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">تم التنفيذ والتسليم</div>
        <div class="num mono font-bold" style="font-size:18px;margin-top:2px;color:var(--green-text);">${doneList.length}</div>
      </div>
      <div class="card" style="padding:12px;margin:0;border-right:3.5px solid var(--purple);">
        <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">المحصل (عربونات ودفعات)</div>
        <div class="num mono font-bold" style="font-size:18px;margin-top:2px;color:var(--purple);">${totalCollected.toLocaleString()} ج.م</div>
      </div>
    </div>

    <!-- Filter & Search Controls -->
    <div class="card" style="padding:12px;margin-bottom:14px;background:var(--paper2);">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <input id="quoSearchInput" value="${escapeHtml(state.quoFilter.q||'')}" placeholder="بحث باسم العميل، الهاتف، رقم العرض، أو الصنف..." style="flex:2;min-width:240px;">
        <select id="quoStatusFilter" style="flex:1;min-width:160px;font-weight:700;">
          <option value="all" ${qStat==='all'?'selected':''}>كافة الحالات (${allQ.length})</option>
          <option value="pending" ${qStat==='pending'?'selected':''}>معلق (${pendingList.length})</option>
          <option value="in_progress" ${qStat==='in_progress'?'selected':''}>مقبول / جاري التنفيذ (${inProgressList.length})</option>
          <option value="done" ${qStat==='done'?'selected':''}>تم التنفيذ والتسليم (${doneList.length})</option>
          <option value="cancelled" ${qStat==='cancelled'?'selected':''}>ملغي / مرفوض</option>
        </select>
        ${(state.quoFilter.q || state.quoFilter.status !== 'all') ? `<button class="btn btn-ghost btn-sm" id="resetQuoFilterBtn">إلغاء الفلتر</button>` : ''}
      </div>
    </div>

    <div id="unifiedSelectionTopSlot"></div>

    <!-- Quotations Table -->
    ${filtered.length === 0 ? '<div class="card empty" style="padding:30px;text-align:center;">لا توجد عروض أسعار مطابقة لمعايير البحث.</div>' : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="text-align:right;width:120px;">رقم العرض</th>
              <th style="text-align:right;width:105px;">التاريخ</th>
              <th style="text-align:right;">العميل / الشركة</th>
              <th style="text-align:right;min-width:220px;">ملخص البنود والأعمال</th>
              <th style="text-align:right;width:170px;">الماليات والتحصيل</th>
              <th style="text-align:center;width:150px;">الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(q => {
              const qId = String(q.ID||'').slice(-8);
              const paid = Number(q.PaidAmount||0);
              const total = Number(q.Total||0);
              const rem = Math.max(0, total - paid);
              const isSelected = String(state.selectedQuotationId) === String(q.ID);

              return `
                <tr class="selectable-row ${isSelected ? 'selected-row' : ''}" data-quo-id="${q.ID}" onclick="handleQuotationRowClick('${q.ID}', event)" ondblclick="openQuotationDetailModalById('${q.ID}')" style="cursor:pointer;">
                  <td class="mono font-bold" style="color:var(--primary);">
                    <div style="display:flex;align-items:center;gap:6px;">
                      ${isSelected ? '<span class="badge badge-primary selected-badge-indicator" style="font-size:9.5px;padding:1px 5px;">محدد</span>' : ''}
                      <span>#${qId}</span>
                    </div>
                  </td>
                  <td class="mono" style="font-size:11.5px;">${cleanDate(q.Date)}</td>
                  <td>
                    <div style="font-weight:800;color:var(--ink);">${escapeHtml(q.ClientName)}</div>
                    ${q.ClientPhone ? `
                      <div style="display:inline-flex;align-items:center;gap:6px;margin-top:2px;">
                        <span style="font-size:11px;color:var(--ink-secondary);" class="mono">${escapeHtml(q.ClientPhone)}</span>
                        <a href="https://wa.me/${normalizePhoneForWa(q.ClientPhone)}" target="_blank" class="btn btn-ghost btn-xs" style="padding:1px 5px;color:#22c55e;" title="محادثة واتساب" onclick="event.stopPropagation();">${getSvgIcon("message", 12)}</a>
                        <a href="tel:${escapeHtml(q.ClientPhone)}" class="btn btn-ghost btn-xs" style="padding:1px 5px;" title="اتصال هاتفي" onclick="event.stopPropagation();">${getSvgIcon("phone", 12)}</a>
                      </div>
                    ` : ''}
                  </td>
                  <td style="font-size:11.5px;line-height:1.4;color:var(--ink-secondary);">
                    ${escapeHtml(q.ItemsSummary||'')}
                  </td>
                  <td>
                    <div style="font-weight:900;font-size:13px;" class="mono">${total.toLocaleString()} ج.م</div>
                    ${paid > 0 ? `
                      <div style="font-size:10.5px;color:var(--green-text);font-weight:700;">مدفوع: ${paid.toLocaleString()} ج.م</div>
                      ${rem > 0 ? `<div style="font-size:10.5px;color:var(--red-text);font-weight:700;">متبقي: ${rem.toLocaleString()} ج.م</div>` : '<div style="font-size:10px;color:var(--green-text);font-weight:800;">مسدد بالكامل</div>'}
                    ` : '<div style="font-size:10.5px;color:var(--ink-secondary);">لم يسدد دفعات بعد</div>'}
                  </td>
                  <td style="text-align:center;">
                    <select class="quo-quick-status-sel" data-quoid="${q.ID}" onclick="event.stopPropagation();" style="font-size:11px;padding:3px 6px;border-radius:12px;font-weight:800;">
                      <option value="معلق" ${(q.Status==='معلق'||!q.Status)?'selected':''}>معلق</option>
                      <option value="مقبول / جاري التنفيذ" ${(q.Status==='مقبول / جاري التنفيذ'||q.Status==='مقبول')?'selected':''}>جاري التنفيذ</option>
                      <option value="تم التنفيذ والتسليم" ${(q.Status==='تم التنفيذ والتسليم'||q.Status==='تم التنفيذ')?'selected':''}>تم التنفيذ</option>
                      <option value="ملغي / مرفوض" ${(q.Status==='ملغي / مرفوض'||q.Status==='ملغي')?'selected':''}>ملغي</option>
                    </select>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;

  // Attach search & filter events
  const sInput = document.getElementById('quoSearchInput');
  if(sInput){
    sInput.oninput = (e)=>{
      state.quoFilter.q = e.target.value;
      renderQuotationsList(main);
    };
  }
  const sFilter = document.getElementById('quoStatusFilter');
  if(sFilter){
    sFilter.onchange = (e)=>{
      state.quoFilter.status = e.target.value;
      renderQuotationsList(main);
    };
  }
  const resetBtn = document.getElementById('resetQuoFilterBtn');
  if(resetBtn){
    resetBtn.onclick = ()=>{
      state.quoFilter = { q: '', status: 'all' };
      renderQuotationsList(main);
    };
  }

  // Top buttons
  const newBtn = document.getElementById('quoNewBtn');
  if(newBtn) newBtn.onclick = ()=>{ state.camTab = 'quote'; renderCamerasApp(document.getElementById('app')); };

  const setBtn = document.getElementById('quoGotoSettingsBtn');
  if(setBtn) setBtn.onclick = ()=>{ state.currentSection = 'settings'; state.settingsTab = 'warranty'; render(); };

  // Status Quick Change
  main.querySelectorAll('.quo-quick-status-sel').forEach(sel => {
    sel.onchange = async (e)=>{
      const qId = sel.dataset.quoid;
      const q = state.quotations.find(x => String(x.ID) === String(qId));
      if(q){
        q.Status = e.target.value;
        await saveQuotationRemote(q);
        showToast(`تم تحديث حالة عرض السعر (#${String(q.ID).slice(-8)}) إلى: ${q.Status}`, 'success');
        renderQuotationsList(main);
      }
    };
  });

  if(typeof window.renderUnifiedSelectionBar === 'function'){
    window.renderUnifiedSelectionBar();
  }
}

function openQuotationDetailModalById(qId){
  const q = state.quotations.find(x => String(x.ID) === String(qId));
  if(!q){ showToast('تعذر العثور على عرض السعر', 'error'); return; }
  openQuotationDetailModal(q);
}

/* ---------------- Quotation Execution & Payment Modal ---------------- */
function openQuotationDetailModal(q){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  function renderModalContent(){
    if(!q.Payments) q.Payments = [];
    const total = Number(q.Total || 0);
    const paid = Number(q.PaidAmount || 0);
    const remaining = Math.max(0, total - paid);
    const items = getQuotationItems(q);

    overlay.innerHTML = `
      <div class="modal-content" style="max-width:820px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
          <div>
            <h3 style="margin:0;font-size:18px;font-weight:900;color:var(--primary);">
              ${getSvgIcon("fileText", 16)} تفاصيل وإدارة عرض السعر (#${String(q.ID).slice(-8)})
            </h3>
            <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">
              التاريخ: <span class="mono">${cleanDate(q.Date)}</span> | العميل: <b>${escapeHtml(q.ClientName)}</b> ${q.ClientPhone ? `(${escapeHtml(q.ClientPhone)})` : ''}
            </div>
          </div>
          <button class="btn btn-ghost btn-xs" id="closeQuoModalBtn">إغلاق</button>
        </div>

        <!-- Status & Progress Ribbon -->
        <div class="card" style="padding:12px 16px;background:var(--paper2);margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <b style="font-size:13px;">حالة المشروع / العرض:</b>
            <select id="modalQuoStatus" style="font-weight:800;padding:5px 10px;border-radius:var(--radius-sm);">
              <option value="معلق" ${(q.Status==='معلق'||!q.Status)?'selected':''}>معلق (قيد الانتظار)</option>
              <option value="مقبول / جاري التنفيذ" ${(q.Status==='مقبول / جاري التنفيذ'||q.Status==='مقبول')?'selected':''}>مقبول / جاري التنفيذ</option>
              <option value="تم التنفيذ والتسليم" ${(q.Status==='تم التنفيذ والتسليم'||q.Status==='تم التنفيذ')?'selected':''}>تم التنفيذ والتسليم</option>
              <option value="ملغي / مرفوض" ${(q.Status==='ملغي / مرفوض'||q.Status==='ملغي')?'selected':''}>ملغي / مرفوض</option>
            </select>
          </div>
          <div style="display:flex;gap:12px;">
            <div style="text-align:center;">
              <span style="font-size:10.5px;color:var(--ink-secondary);display:block;">إجمالي العرض</span>
              <b class="mono" style="font-size:15px;">${total.toLocaleString()} ج.م</b>
            </div>
            <div style="text-align:center;">
              <span style="font-size:10.5px;color:var(--green-text);display:block;">المحصل / العربون</span>
              <b class="mono" style="font-size:15px;color:var(--green-text);">${paid.toLocaleString()} ج.م</b>
            </div>
            <div style="text-align:center;">
              <span style="font-size:10.5px;color:var(--red-text);display:block;">المتبقي المستحق</span>
              <b class="mono" style="font-size:15px;color:${remaining>0?'var(--red-text)':'var(--green-text)'};">${remaining.toLocaleString()} ج.م</b>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="card" style="padding:14px;margin-bottom:14px;">
          <h4 style="margin-top:0;margin-bottom:8px;font-size:13.5px;">${getSvgIcon("package", 14)} بنود ومهمات المشروع (${items.length} بند)</h4>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style="text-align:right;">البند / الخدمة</th>
                  <th style="text-align:center;">الكمية</th>
                  <th style="text-align:center;">السعر الفردي</th>
                  <th style="text-align:left;">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(it => `
                  <tr>
                    <td style="font-weight:700;">${escapeHtml(it.name || it.Name)}${it.type==='service'?' <span style="font-size:10px;color:var(--ink-secondary);">(خدمة)</span>':''}</td>
                    <td style="text-align:center;" class="mono font-bold">${it.qty || it.Qty || 1}</td>
                    <td style="text-align:center;" class="mono">${Number(it.price || it.Price || 0).toLocaleString()}</td>
                    <td style="text-align:left;font-weight:800;" class="mono">${(Number(it.qty||1)*Number(it.price||0)).toLocaleString()} ج.م</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Payments & Deposit Management Box -->
        <div class="card" style="padding:14px;margin-bottom:14px;border-right:3.5px solid var(--purple);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <h4 style="margin:0;font-size:13.5px;color:var(--purple);">${getSvgIcon("wallet", 14)} سجل الدفعات المالية والعربونات المحصلة</h4>
            <span class="mono font-bold" style="font-size:12px;color:var(--ink-secondary);">${q.Payments.length} دفعة مسجلة</span>
          </div>

          ${q.Payments.length === 0 ? `
            <div style="font-size:12px;color:var(--ink-secondary);padding:6px 0;">لم يتم تسجيل أي دفعات أو عربونات لهذا العرض حتى الآن.</div>
          ` : `
            <div class="table-wrap" style="margin-bottom:10px;">
              <table>
                <thead>
                  <tr>
                    <th>تاريخ الدفعة</th>
                    <th>المبلغ</th>
                    <th>البيان / الملاحظة</th>
                    <th>المستلم</th>
                  </tr>
                </thead>
                <tbody>
                  ${q.Payments.map(p => `
                    <tr>
                      <td class="mono font-bold">${cleanDate(p.Date)}</td>
                      <td class="mono font-bold" style="color:var(--green-text);">${Number(p.Amount).toLocaleString()} ج.م</td>
                      <td>${escapeHtml(p.Note||'دفعة نقدية')}</td>
                      <td style="font-size:11px;color:var(--ink-secondary);">${escapeHtml(p.By||'')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}

          <!-- Quick Add Payment Form -->
          <div style="display:flex;gap:8px;align-items:center;background:var(--paper3);padding:10px;border-radius:var(--radius-sm);flex-wrap:wrap;">
            <input id="newQuoPayAmt" type="number" placeholder="المبلغ (ج.م)" style="width:130px;" class="mono font-bold">
            <input id="newQuoPayNote" placeholder="بيان الدفعة (مثال: عربون مقدم 50% / دفعة توريد)" style="flex:2;min-width:180px;">
            <button class="btn btn-primary btn-sm" id="addNewQuoPayBtn" style="font-weight:900;">${getSvgIcon("plus", 13)} تسجيل دفعة بالخزينة</button>
          </div>
        </div>

        <!-- Action Footer -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;border-top:1px solid var(--line);padding-top:12px;">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" id="modalPrintQuoBtn">${getSvgIcon("printer", 13)} طباعة عرض السعر (A4)</button>
            <button class="btn btn-ghost btn-sm" id="modalPrintContractBtn" style="color:var(--green-text);border-color:var(--green);font-weight:800;">${getSvgIcon("fileText", 13)} طباعة عقد واتفاق الشروط (A4)</button>
            <button class="btn btn-ghost btn-sm" id="modalInvoiceQuoBtn" style="color:var(--purple);border-color:var(--purple);font-weight:800;">${getSvgIcon("invoices", 13)} تحويل لفاتورة رسمية</button>
            ${q.ClientPhone ? `<button class="btn btn-ghost btn-sm" id="modalWaQuoBtn" style="color:#22c55e;">${getSvgIcon("message", 13)} إرسال واتساب</button>` : ''}
          </div>
          <button class="btn btn-ghost btn-sm" id="modalCloseBottomBtn">إغلاق</button>
        </div>
      </div>
    `;

    // Events
    document.getElementById('closeQuoModalBtn').onclick = ()=>overlay.remove();
    document.getElementById('modalCloseBottomBtn').onclick = ()=>overlay.remove();

    // Status change
    document.getElementById('modalQuoStatus').onchange = async (e)=>{
      q.Status = e.target.value;
      await saveQuotationRemote(q);
      showToast('تم تحديث حالة عرض السعر', 'success');
      const main = document.getElementById('main');
      if(state.camTab === 'quotes') renderQuotationsList(main);
    };

    // Add payment
    document.getElementById('addNewQuoPayBtn').onclick = async ()=>{
      const amtInput = document.getElementById('newQuoPayAmt');
      const noteInput = document.getElementById('newQuoPayNote');
      const amt = Number(amtInput.value);
      const note = noteInput.value.trim();

      if(!amt || amt <= 0){
        showToast('يرجى كتابة مبلغ صحيح للدفعة', 'error');
        return;
      }

      try {
        await saveQuotationPaymentRemote(q.ID, amt, note);
        showToast(`تم تسجيل دفعة مالية بقيمة ${amt.toLocaleString()} ج.م وتوريدها للخزينة بنجاح`, 'success');
        renderModalContent();
        const main = document.getElementById('main');
        if(state.camTab === 'quotes') renderQuotationsList(main);
      } catch(e) {
        showToast('خطأ أثناء حفظ الدفعة: ' + e.message, 'error');
      }
    };

    // Print Quotation
    document.getElementById('modalPrintQuoBtn').onclick = ()=>{
      openQuotationPrint(q, items);
    };

    // Print Contract / Agreement
    document.getElementById('modalPrintContractBtn').onclick = ()=>{
      openQuotationAgreementPrint(q, items);
    };

    // Convert to Invoice
    document.getElementById('modalInvoiceQuoBtn').onclick = ()=>{
      overlay.remove();
      convertQuotationToInvoice(q);
    };

    // WhatsApp
    const waBtn = document.getElementById('modalWaQuoBtn');
    if(waBtn){
      waBtn.onclick = ()=>shareQuotationWhatsapp(q);
    }
  }

  document.body.appendChild(overlay);
  renderModalContent();
}

function shareQuotationWhatsapp(q){
  const phone = (q.ClientPhone||'').replace(/\D/g,'');
  if(!phone){ showToast('رقم هاتف العميل غير مسجل', 'error'); return; }
  const phoneFormatted = phone.startsWith('0') ? '2'+phone : phone;
  const shopName = (state.settings && state.settings.shopName) || 'صيانة ميكروتك';
  const total = Number(q.Total||0).toLocaleString();
  const paid = Number(q.PaidAmount||0).toLocaleString();
  const remaining = Math.max(0, Number(q.Total||0) - Number(q.PaidAmount||0)).toLocaleString();

  const msg = `مرحبًا ${q.ClientName || 'عميلنا العزيز'}\nيسعدنا تقديم عرض سعر مشروع الكاميرات والشبكات من *${shopName}*\n\nرقم العرض: *#${String(q.ID).slice(-8)}*\nملخص البنود: ${q.ItemsSummary || ''}\nالإجمالي المطلوب: *${total} ج.م*\n${Number(q.PaidAmount||0)>0 ? `المسدد: ${paid} ج.م | المتبقي: ${remaining} ج.م\n` : ''}\nنسعد دائماً بخدمتكم والتواصل معكم عبر واتساب أو بالاتصال بنا.`;

  window.open(`https://wa.me/${phoneFormatted}?text=${encodeURIComponent(msg)}`, '_blank');
}

function convertQuotationToInvoice(q){
  const items = getQuotationItems(q).map(it => ({
    Name: it.name || it.Name,
    Qty: Number(it.qty || it.Qty || 1),
    Price: Number(it.price || it.Price || 0),
    Total: Number(it.qty || it.Qty || 1) * Number(it.price || it.Price || 0)
  }));

  const newInv = {
    ID: 'inv_' + Date.now(),
    InvoiceNumber: (typeof nextInvoiceNumber === 'function') ? nextInvoiceNumber() : ('INV-' + new Date().getFullYear() + '-0001'),
    Date: new Date().toISOString().slice(0,10),
    DueDate: new Date().toISOString().slice(0,10),
    CustomerName: q.ClientName || 'عميل',
    CustomerPhone: q.ClientPhone || '',
    CustomerTaxNumber: '',
    CustomerAddress: '',
    Items: items.length ? items : [{ Name: 'توريدات ومهمات شبكات وكاميرات', Qty: 1, Price: Number(q.Total||0), Total: Number(q.Total||0) }],
    Subtotal: Number(q.Total || 0),
    TaxPercent: 0,
    TaxAmount: 0,
    Discount: 0,
    Total: Number(q.Total || 0),
    AmountPaid: Number(q.PaidAmount || 0),
    Remaining: Math.max(0, Number(q.Total || 0) - Number(q.PaidAmount || 0)),
    Status: (Number(q.PaidAmount||0) >= Number(q.Total||0)) ? 'مدفوعة بالكامل' : (Number(q.PaidAmount||0) > 0 ? 'مدفوعة جزئياً' : 'غير مدفوعة (آجلة)'),
    PaymentMethod: 'نقدي',
    ReferenceType: 'عرض سعر',
    ReferenceID: String(q.ID).slice(-8),
    Notes: `فاتورة صادرة عن عرض سعر رقم (${String(q.ID).slice(-8)})`
  };

  openInvoiceModal(newInv, false);
}

/* ---------------- Professional A4 Quotation Print Engine ---------------- */
function openQuotationPrint(q, cartItems){
  const old = document.getElementById('printMount');
  if(old) old.remove();

  const items = cartItems || getQuotationItems(q);
  const shopName = (state.settings && state.settings.shopName) || 'صيانة ميكروتك';
  const logoUrl = state.settings && state.settings.logoUrl;
  const shopPhone = (state.settings && state.settings.shopPhone) || '';
  const shopAddress = (state.settings && state.settings.shopAddress) || '';
  const shopTaxNumber = (state.settings && state.settings.shopTaxNumber) || '';
  const quoteTerms = getQuoteTerms();
  const quoteId = String(q.ID||'').slice(-8);

  const total = Number(q.Total || 0);
  const paid = Number(q.PaidAmount || 0);
  const remaining = Math.max(0, total - paid);

  const mount = document.createElement('div');
  mount.id = 'printMount';

  // Inject print styles for A4 quotation
  let styleEl = document.getElementById('dynamicQuotationPrintStyle');
  if(!styleEl){
    styleEl = document.createElement('style');
    styleEl.id = 'dynamicQuotationPrintStyle';
    document.head.appendChild(styleEl);
  }

  styleEl.innerHTML = `
    @media print {
      @page {
        size: A4 portrait !important;
        margin: 10mm 12mm !important;
      }
      html, body {
        background: #ffffff !important;
        color: #000000 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body.printing-quotation-doc #app,
      body.printing-quotation-doc .sidebar,
      body.printing-quotation-doc .top-header,
      body.printing-quotation-doc #toastContainer,
      body.printing-quotation-doc .modal-overlay,
      body.printing-quotation-doc .cmd-palette-overlay {
        display: none !important;
      }
      body.printing-quotation-doc #printMount {
        display: block !important;
        width: 100% !important;
        background: #ffffff !important;
      }
      .quo-print-page {
        font-family: 'Segoe UI', Tahoma, Arial, sans-serif !important;
        color: #000000 !important;
        direction: rtl !important;
        text-align: right !important;
        padding: 4mm 2mm !important;
        box-sizing: border-box !important;
      }
      .quo-print-page table {
        width: 100% !important;
        border-collapse: collapse !important;
      }
      .quo-print-page th, .quo-print-page td {
        border: 1px solid #000000 !important;
        padding: 5px 8px !important;
      }
    }
  `;

  mount.innerHTML = `
    <div class="quo-print-page" style="background:#fff;color:#000;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;text-align:right;max-width:210mm;margin:0 auto;">
      
      <!-- Store Header -->
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2.5px solid #000;padding-bottom:8px;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:12px;">
          ${logoUrl ? `<img src="${logoUrl}" style="max-height:48px;max-width:140px;object-fit:contain;">` : ''}
          <div>
            <h2 style="margin:0;font-size:20px;font-weight:900;">${escapeHtml(shopName)}</h2>
            <div style="font-size:11.5px;font-weight:700;margin-top:2px;">
              ${shopPhone ? `الهاتف: <span class="mono">${escapeHtml(shopPhone)}</span> ` : ''}
              ${shopAddress ? `| ${escapeHtml(shopAddress)} ` : ''}
              ${shopTaxNumber ? `| س.ت / ضريبي: <span class="mono">${escapeHtml(shopTaxNumber)}</span>` : ''}
            </div>
          </div>
        </div>
        <div style="text-align:left;">
          <div style="display:inline-block;border:2px solid #000;padding:4px 12px;border-radius:6px;font-weight:900;font-size:14px;background:#f5f5f5;">
            عرض أسعار رسمي (Quotation)
          </div>
          <div style="font-size:12px;font-weight:800;margin-top:4px;">
            رقم العرض: <span class="mono font-bold" style="font-size:14px;">#${quoteId}</span>
          </div>
          <div style="font-size:11px;font-weight:700;color:#333;" class="mono">${cleanDate(q.Date)}</div>
        </div>
      </div>

      <!-- Client Details Box -->
      <div style="border:1.5px solid #000;border-radius:6px;padding:8px 12px;margin-bottom:12px;background:#fafafa;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div>
          <span style="font-size:11.5px;font-weight:700;color:#555;">السادة / العميل:</span>
          <b style="font-size:14px;display:inline-block;margin-right:6px;">${escapeHtml(q.ClientName)}</b>
        </div>
        ${q.ClientPhone ? `
          <div>
            <span style="font-size:11.5px;font-weight:700;color:#555;">رقم الهاتف:</span>
            <b style="font-size:13.5px;display:inline-block;margin-right:6px;" class="mono">${escapeHtml(q.ClientPhone)}</b>
          </div>
        ` : ''}
        <div>
          <span style="font-size:11.5px;font-weight:700;color:#555;">صلاحية العرض:</span>
          <b style="font-size:12px;display:inline-block;margin-right:6px;">14 يوماً من تاريخه</b>
        </div>
      </div>

      <!-- Items Table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:12px;">
        <thead>
          <tr style="background:#000;color:#fff;">
            <th style="padding:6px;border:1px solid #000;text-align:center;width:30px;">#</th>
            <th style="padding:6px;border:1px solid #000;text-align:right;">البند والمواصفات الفنية</th>
            <th style="padding:6px;border:1px solid #000;text-align:center;width:60px;">النوع</th>
            <th style="padding:6px;border:1px solid #000;text-align:center;width:45px;">الكمية</th>
            <th style="padding:6px;border:1px solid #000;text-align:center;width:80px;">السعر الفردي</th>
            <th style="padding:6px;border:1px solid #000;text-align:left;width:95px;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((it, idx) => `
            <tr>
              <td style="padding:5px;border:1px solid #000;text-align:center;" class="mono">${idx+1}</td>
              <td style="padding:5px;border:1px solid #000;font-weight:700;">${escapeHtml(it.name || it.Name)}</td>
              <td style="padding:5px;border:1px solid #000;text-align:center;font-size:11px;">${it.type==='service'?'خدمة / تركيب':'توريد مهمات'}</td>
              <td style="padding:5px;border:1px solid #000;text-align:center;font-weight:900;" class="mono">${it.qty || it.Qty || 1}</td>
              <td style="padding:5px;border:1px solid #000;text-align:center;" class="mono">${Number(it.price || it.Price || 0).toLocaleString()}</td>
              <td style="padding:5px;border:1px solid #000;text-align:left;font-weight:900;" class="mono">${(Number(it.qty||1)*Number(it.price||0)).toLocaleString()} ج.م</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Financial Totals Box -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:12px;">
        <div style="flex:1;border:1.5px solid #000;border-radius:6px;padding:8px 10px;font-size:11.5px;line-height:1.6;background:#fcfcfc;">
          <b style="display:block;margin-bottom:2px;font-size:12px;">شروط وأحكام العرض:</b>
          <div style="white-space:pre-line;color:#222;">${escapeHtml(quoteTerms)}</div>
        </div>

        <div style="width:240px;border:1.5px solid #000;border-radius:6px;padding:8px 10px;font-size:12.5px;font-weight:800;background:#fafafa;">
          <div style="display:flex;justify-content:space-between;border-bottom:1.5px solid #000;padding-bottom:4px;margin-bottom:4px;">
            <span style="font-size:13.5px;font-weight:900;">الإجمالي المطلوب:</span>
            <span class="mono font-bold" style="font-size:15px;">${total.toLocaleString()} ج.م</span>
          </div>
          ${paid > 0 ? `
            <div style="display:flex;justify-content:space-between;color:green;margin-bottom:2px;">
              <span>المسدد (عربون / دفعات):</span>
              <span class="mono">${paid.toLocaleString()} ج.م</span>
            </div>
            <div style="display:flex;justify-content:space-between;color:red;border-top:1px dashed #000;padding-top:2px;">
              <span>المتبقي عند التنفيذ:</span>
              <span class="mono">${remaining.toLocaleString()} ج.م</span>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- Signatures -->
      <div style="border-top:1.5px dashed #000;padding-top:8px;margin-top:10px;display:flex;justify-content:space-between;font-size:12px;font-weight:800;">
        <div style="text-align:center;width:200px;">
          <div>موافقة واعتماد العميل</div>
          <div style="height:35px;"></div>
          <div style="border-top:1px solid #000;padding-top:2px;">الاسم والتوقيع: .....................</div>
        </div>
        <div style="text-align:center;width:200px;">
          <div>المسؤول المعتمد / خاتم الشركة</div>
          <div style="height:35px;"></div>
          <div style="border-top:1px solid #000;padding-top:2px;">${escapeHtml(state.user ? state.user.name : shopName)}</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(mount);
  document.body.classList.add('printing-quotation-doc');

  setTimeout(()=>{
    window.print();
    setTimeout(()=>{
      mount.remove();
      document.body.classList.remove('printing-quotation-doc');
    }, 500);
  }, 200);
}

/* ---------------- Legal Contract & Agreement Print Engine ---------------- */
function openQuotationAgreementPrint(q, cartItems){
  const old = document.getElementById('printMount');
  if(old) old.remove();

  const items = cartItems || getQuotationItems(q);
  const shopName = (state.settings && state.settings.shopName) || 'صيانة ميكروتك';
  const logoUrl = state.settings && state.settings.logoUrl;
  const shopPhone = (state.settings && state.settings.shopPhone) || '';
  const shopAddress = (state.settings && state.settings.shopAddress) || '';
  const shopTaxNumber = (state.settings && state.settings.shopTaxNumber) || '';
  const agreementTerms = getQuoteAgreementTerms();
  const quoteId = String(q.ID||'').slice(-8);

  const total = Number(q.Total || 0);
  const paid = Number(q.PaidAmount || 0);
  const remaining = Math.max(0, total - paid);

  const mount = document.createElement('div');
  mount.id = 'printMount';

  // Inject print styles for contract
  let styleEl = document.getElementById('dynamicQuotationPrintStyle');
  if(!styleEl){
    styleEl = document.createElement('style');
    styleEl.id = 'dynamicQuotationPrintStyle';
    document.head.appendChild(styleEl);
  }

  styleEl.innerHTML = `
    @media print {
      @page {
        size: A4 portrait !important;
        margin: 8mm 10mm !important;
      }
      html, body {
        background: #ffffff !important;
        color: #000000 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body.printing-quotation-doc #app,
      body.printing-quotation-doc .sidebar,
      body.printing-quotation-doc .top-header,
      body.printing-quotation-doc #toastContainer,
      body.printing-quotation-doc .modal-overlay,
      body.printing-quotation-doc .cmd-palette-overlay {
        display: none !important;
      }
      body.printing-quotation-doc #printMount {
        display: block !important;
        width: 100% !important;
        background: #ffffff !important;
      }
      .contract-print-page {
        font-family: 'Segoe UI', Tahoma, Arial, sans-serif !important;
        color: #000000 !important;
        direction: rtl !important;
        text-align: right !important;
        padding: 2mm !important;
        box-sizing: border-box !important;
      }
    }
  `;

  mount.innerHTML = `
    <div class="contract-print-page" style="background:#fff;color:#000;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;text-align:right;max-width:210mm;margin:0 auto;">
      
      <!-- Store Header -->
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:10px;">
          ${logoUrl ? `<img src="${logoUrl}" style="max-height:40px;max-width:130px;object-fit:contain;">` : ''}
          <div>
            <h2 style="margin:0;font-size:18px;font-weight:900;">${escapeHtml(shopName)}</h2>
            <div style="font-size:11px;font-weight:700;">
              ${shopPhone ? `هاتف: <span class="mono">${escapeHtml(shopPhone)}</span> ` : ''}
              ${shopAddress ? `| ${escapeHtml(shopAddress)} ` : ''}
            </div>
          </div>
        </div>
        <div style="text-align:left;">
          <div style="font-size:12px;font-weight:800;">رقم الاتفاق / العرض: <span class="mono">#${quoteId}</span></div>
          <div style="font-size:11px;font-weight:700;" class="mono">${cleanDate(q.Date)}</div>
        </div>
      </div>

      <!-- Contract Header Banner -->
      <div style="text-align:center;border:2px solid #000;border-radius:6px;padding:6px;margin-bottom:8px;background:#f5f5f5;">
        <h3 style="margin:0;font-size:15px;font-weight:900;">عقد اتفاق وتوريد وتركيب وتشغيل منظومات شبكات ومراقبة</h3>
      </div>

      <!-- Contract Parties -->
      <div style="border:1.5px solid #000;border-radius:6px;padding:8px 10px;margin-bottom:8px;font-size:12px;line-height:1.5;background:#fafafa;">
        <div style="margin-bottom:3px;">
          <b>• الطرف الأول (المنفذ والمورد):</b> ${escapeHtml(shopName)} ${shopTaxNumber ? `(س.ت / ضريبي: ${escapeHtml(shopTaxNumber)})` : ''} — هاتف: ${escapeHtml(shopPhone)}
        </div>
        <div>
          <b>• الطرف الثاني (العميل / المستفيد):</b> ${escapeHtml(q.ClientName)} — هاتف: <span class="mono font-bold">${escapeHtml(q.ClientPhone||'-')}</span>
        </div>
      </div>

      <!-- Project Items Summary Table -->
      <div style="margin-bottom:8px;">
        <b style="font-size:12px;display:block;margin-bottom:3px;">جدول حصر الأعمال والمهمات المتفق على توريدها وتركيبها:</b>
        <table style="width:100%;border-collapse:collapse;font-size:11.5px;">
          <thead>
            <tr style="background:#000;color:#fff;">
              <th style="padding:4px;border:1px solid #000;text-align:center;width:25px;">#</th>
              <th style="padding:4px;border:1px solid #000;text-align:right;">بيان البند والخدمة</th>
              <th style="padding:4px;border:1px solid #000;text-align:center;width:45px;">الكمية</th>
              <th style="padding:4px;border:1px solid #000;text-align:center;width:75px;">السعر الفردي</th>
              <th style="padding:4px;border:1px solid #000;text-align:left;width:85px;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((it, idx) => `
              <tr>
                <td style="padding:4px;border:1px solid #000;text-align:center;" class="mono">${idx+1}</td>
                <td style="padding:4px;border:1px solid #000;font-weight:700;">${escapeHtml(it.name || it.Name)}</td>
                <td style="padding:4px;border:1px solid #000;text-align:center;font-weight:900;" class="mono">${it.qty || it.Qty || 1}</td>
                <td style="padding:4px;border:1px solid #000;text-align:center;" class="mono">${Number(it.price || it.Price || 0).toLocaleString()}</td>
                <td style="padding:4px;border:1px solid #000;text-align:left;font-weight:900;" class="mono">${(Number(it.qty||1)*Number(it.price||0)).toLocaleString()} ج.م</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Financial Payment Schedule Box -->
      <div style="border:1.5px solid #000;border-radius:6px;padding:6px 10px;margin-bottom:8px;background:#fafafa;display:flex;justify-content:space-between;align-items:center;font-size:12px;">
        <div><b>إجمالي القيمة التعاقدية:</b> <span class="mono font-bold" style="font-size:14px;">${total.toLocaleString()} ج.م</span></div>
        <div><b>المسدد (عربون مقدم):</b> <span class="mono font-bold" style="color:green;font-size:13px;">${paid.toLocaleString()} ج.م</span></div>
        <div><b>المتبقي المستحق:</b> <span class="mono font-bold" style="color:red;font-size:13px;">${remaining.toLocaleString()} ج.م</span></div>
      </div>

      <!-- Agreement Legal Clauses -->
      <div style="border:1.5px solid #000;border-radius:6px;padding:8px 10px;margin-bottom:10px;font-size:11.5px;line-height:1.65;background:#fcfcfc;">
        <b style="display:block;margin-bottom:4px;font-size:12px;">الشروط والبنود القانونية المنظمة للاتفاق:</b>
        <div style="white-space:pre-line;color:#111;">${escapeHtml(agreementTerms)}</div>
      </div>

      <!-- Signatures & Stamp Blocks -->
      <div style="border-top:1.5px solid #000;padding-top:6px;display:flex;justify-content:space-between;font-size:12px;font-weight:800;">
        <div style="text-align:center;width:220px;">
          <div>الطرف الأول (المنفذ والمورد)</div>
          <div style="font-size:11px;color:#555;margin-top:2px;">${escapeHtml(shopName)}</div>
          <div style="height:35px;"></div>
          <div style="border-top:1px solid #000;padding-top:2px;">التوقيع والختم: .....................</div>
        </div>
        <div style="text-align:center;width:220px;">
          <div>الطرف الثاني (العميل المستفيد)</div>
          <div style="font-size:11px;color:#555;margin-top:2px;">${escapeHtml(q.ClientName)}</div>
          <div style="height:35px;"></div>
          <div style="border-top:1px solid #000;padding-top:2px;">التوقيع ورقم الهوية: .....................</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(mount);
  document.body.classList.add('printing-quotation-doc');

  setTimeout(()=>{
    window.print();
    setTimeout(()=>{
      mount.remove();
      document.body.classList.remove('printing-quotation-doc');
    }, 500);
  }, 200);
}
