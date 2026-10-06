/* ---------------- Finance Section ---------------- */
function renderFinanceSectionApp(app){
  if(!canUserAccessSection('finance')){
    showToast('ليس لديك صلاحية للوصول إلى القسم المالي والمحاسبي', 'error');
    state.currentSection = null;
    return render();
  }
  if(!state.financeTab) state.financeTab = 'overview';
  if(state.financeTab === 'users' && !canUserAccessSection('users')) state.financeTab = 'overview';
  if(state.financeTab === 'daily' && !canUserAccessSection('daily')) state.financeTab = 'overview';
  if(state.financeTab === 'cashdrawer' && !canUserAccessSection('cashdrawer')) state.financeTab = 'overview';

  app.innerHTML = `
    <div class="sidebar">
      ${brandHtml("القسم المالي والمحاسبي")}
      ${sectionSwitcherHtml()}
      <div class="sidebar-nav-wrap">
        <div class="nav-section">التقارير والمؤشرات المالية</div>
        <div class="nav-item ${state.financeTab==='overview'?'active':''}" data-fintab="overview">
          <span class="nav-item-icon">${getSvgIcon("chart", 16)}</span><span>نظرة مالية عامة</span>
        </div>
        <div class="nav-item ${state.financeTab==='income'?'active':''}" data-fintab="income">
          <span class="nav-item-icon">${getSvgIcon("trendUp", 16)}</span><span>تقرير الدخل والأرباح</span>
        </div>
        <div class="nav-item ${state.financeTab==='trialbalance'?'active':''}" data-fintab="trialbalance">
          <span class="nav-item-icon">${getSvgIcon("scale", 16)}</span><span>ميزان المراجعة العام</span>
        </div>

        <div class="nav-section">دفاتر المحاسبة والخزينة</div>
        ${canUserAccessSection('daily') ? `
          <div class="nav-item ${state.financeTab==='daily'?'active':''}" data-fintab="daily">
            <span class="nav-item-icon">${getSvgIcon("daily", 16)}</span><span>دفتر اليومية العامة</span>
          </div>
        ` : ''}
        ${canUserAccessSection('cashdrawer') ? `
          <div class="nav-item ${state.financeTab==='cashdrawer'?'active':''}" data-fintab="cashdrawer">
            <span class="nav-item-icon">${getSvgIcon("cashdrawer", 16)}</span><span>حركة الخزينة والدرج</span>
          </div>
        ` : ''}
        ${canUserAccessSection('invoices') ? `
          <div class="nav-item ${state.financeTab==='invoices'?'active':''}" data-fintab="invoices">
            <span class="nav-item-icon">${getSvgIcon("invoices", 16)}</span><span>الفواتير وعروض الأسعار</span>
          </div>
        ` : ''}
        <div class="nav-item ${state.financeTab==='accounts'?'active':''}" data-fintab="accounts">
          <span class="nav-item-icon">${getSvgIcon("folder", 16)}</span><span>شجرة الحسابات والدليل</span>
        </div>
        <div class="nav-item ${state.financeTab==='journal'?'active':''}" data-fintab="journal">
          <span class="nav-item-icon">${getSvgIcon("fileText", 16)}</span><span>دفتر القيود اليومية</span>
        </div>

        <div class="nav-section">المكافآت والتهيئة</div>
        <div class="nav-item ${state.financeTab==='bonus'?'active':''}" data-fintab="bonus">
          <span class="nav-item-icon">${getSvgIcon("tag", 16)}</span><span>مكافآت ونسب الفنيين</span>
        </div>
        ${canUserAccessSection('users') ? `
          <div class="nav-item ${state.financeTab==='users'?'active':''}" data-fintab="users">
            <span class="nav-item-icon">${getSvgIcon("users", 16)}</span><span>المستخدمين والصلاحيات</span>
          </div>
        ` : ''}
        ${canUserAccessSection('settings') ? `
          <div class="nav-item" id="finToSettingsNav">
            <span class="nav-item-icon">${getSvgIcon("settings", 16)}</span><span>مركز الإعدادات</span>
          </div>
        ` : ''}
      </div>
      ${sidebarFootHtml()}
    </div>
    <main id="main"></main>
  `;
  const sw = document.getElementById('switchSectionBtn');
  if(sw) sw.onclick = ()=>{ state.currentSection = null; render(); };
  attachSidebarHandlers();

  document.querySelectorAll('[data-fintab]').forEach(el=>{
    el.onclick = ()=>{ state.financeTab = el.dataset.fintab; renderFinanceSectionApp(app); };
  });

  const fSet = document.getElementById('finToSettingsNav');
  if(fSet) fSet.onclick = ()=>{ state.currentSection = 'settings'; render(); };

  const main = document.getElementById('main');
  if(state.financeTab==='overview') renderFinanceOverview(main);
  else if((state.financeTab==='daily' || state.financeTab==='expenses') && canUserAccessSection('daily')) renderDailyJournalPage(main);
  else if(state.financeTab==='cashdrawer' && canUserAccessSection('cashdrawer')) renderCashDrawerPage(main);
  else if(state.financeTab==='invoices') renderInvoicesPage(main);
  else if(state.financeTab==='accounts') renderChartOfAccounts(main);
  else if(state.financeTab==='journal') renderJournalEntries(main);
  else if(state.financeTab==='trialbalance') renderTrialBalance(main);
  else if(state.financeTab==='income') renderFinanceReportPage(main);
  else if(state.financeTab==='users' && canUserAccessSection('users')) renderUsersManagementPage(main);
  else renderBonusPage(main);
}

function renderFinanceOverview(main){
  const totalIncomeAllTime = state.payments.reduce((s,p)=>s+Number(p.Amount||0),0);
  const totalExpAll = state.expenses.reduce((s,x)=>s+Number(x.Amount||0),0);
  const maintenanceDue = state.receipts.reduce((s,r)=>{
    const remaining = Number(r.cost||0)+Number(r.partsCost||0)-Number(r.deposit||0)+Number(r.refunded||0);
    return s + Math.max(0, remaining);
  },0);
  main.innerHTML = `
    <div class="top-header"><div><h2 class="page-title">${getSvgIcon("chart", 22)} النظرة المالية العامة</h2></div></div>
    <div class="stat-grid">
      <div class="stat-card green"><div class="num mono">${totalIncomeAllTime.toLocaleString()} ج.م</div><div class="lbl">إجمالي المقبوضات المسجلة</div></div>
      <div class="stat-card red"><div class="num mono">${totalExpAll.toLocaleString()} ج.م</div><div class="lbl">إجمالي المصروفات</div></div>
      <div class="stat-card purple"><div class="num mono">${(totalIncomeAllTime - totalExpAll).toLocaleString()} ج.م</div><div class="lbl">صافي الأرباح العام</div></div>
      <div class="stat-card amber"><div class="num mono">${maintenanceDue.toLocaleString()} ج.م</div><div class="lbl">مستحقات متبقية على إيصالات الصيانة</div></div>
    </div>

    <div class="grid2">
      <div class="card">
        <h3>${getSvgIcon("folder", 16)} ملخص الحسابات الرئيسية</h3>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">
          ${['1','2','3','4','5'].map(code=>{
            const acc = state.accounts.find(a=>String(a.Code)===code);
            if(!acc) return '';
            const stats = getAccountStats(code);
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--paper3);border-radius:var(--radius-sm);border:1px solid var(--line);">
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="account-code mono">${acc.Code}</span>
                <b>${acc.Name}</b>
                <span class="nature-pill ${stats.nature==='مدين'?'debit':'credit'}">${stats.nature}</span>
              </div>
              <span class="mono font-bold" style="font-size:14px;color:var(--primary);">${stats.netBalance.toLocaleString()} ج.م</span>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <h3>وصول سريع للعمليات المحاسبية</h3>
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;">
          <button class="btn btn-primary" onclick="state.financeTab='accounts';renderFinanceSectionApp(document.getElementById('app'));">${getSvgIcon('folder', 14)} استعراض شجرة الحسابات الكاملة</button>
          <button class="btn btn-ghost" onclick="state.financeTab='journal';renderFinanceSectionApp(document.getElementById('app'));">${getSvgIcon('fileText', 14)} دفتر القيود اليومية (+ قيد يدوي)</button>
          <button class="btn btn-ghost" onclick="state.financeTab='trialbalance';renderFinanceSectionApp(document.getElementById('app'));">${getSvgIcon('scale', 14)} عرض ميزان المراجعة العام</button>
        </div>
      </div>
    </div>
  `;
}

/* ---------------- Chart of Accounts View ---------------- */
function renderChartOfAccounts(main){
  let searchQ = (state.accountSearchQuery||'').trim().toLowerCase();

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("folder", 22)} شجرة ودليل الحسابات (Chart of Accounts)</h2>
              </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost btn-sm" id="exportAccountsExcelBtn">${getSvgIcon("download", 14)} تصدير الدليل Excel</button>
        <button class="btn btn-ghost btn-sm" id="openOpeningBalancesBtn">${getSvgIcon("scale", 14)} الأرصدة الافتتاحية</button>
        <button class="btn btn-primary btn-sm" id="addNewAccountRootBtn">${getSvgIcon("plus", 14)} إضافة حساب جديد</button>
      </div>
    </div>

    <div class="filters-bar" style="margin-bottom:14px;">
      <input id="accSearchInput" placeholder="بحث بكود الحساب أو اسم الحساب..." value="${state.accountSearchQuery||''}" style="flex:1;">
      ${searchQ ? `<button class="btn btn-ghost btn-sm" id="clearAccSearchBtn">مسح</button>` : ''}
    </div>

    <div class="card">
      <div class="tree-wrap" id="accountsTreeMount"></div>
    </div>
  `;

  document.getElementById('addNewAccountRootBtn').onclick = ()=>openAccountModal();
  document.getElementById('exportAccountsExcelBtn').onclick = ()=>exportAccountsToExcel();
  const opBalBtn = document.getElementById('openOpeningBalancesBtn');
  if(opBalBtn) opBalBtn.onclick = ()=>openOpeningBalancesModal();
  const searchInp = document.getElementById('accSearchInput');
  searchInp.oninput = (e)=>{ state.accountSearchQuery = e.target.value; renderChartOfAccounts(main); };
  const clearBtn = document.getElementById('clearAccSearchBtn');
  if(clearBtn) clearBtn.onclick = ()=>{ state.accountSearchQuery = ''; renderChartOfAccounts(main); };

  const mount = document.getElementById('accountsTreeMount');
  renderTreeNodes(mount, searchQ);
}

function renderTreeNodes(mount, filterQ){
  const accounts = [...state.accounts].sort((a,b)=>String(a.Code).localeCompare(String(b.Code), undefined, {numeric:true}));
  
  function getLevel(code){
    const len = String(code).length;
    if(len===1) return 1;
    if(len===2) return 2;
    if(len<=4) return 3;
    return 4;
  }

  let visible = accounts;
  if(filterQ){
    visible = accounts.filter(a=>String(a.Code).includes(filterQ) || a.Name.toLowerCase().includes(filterQ));
  }

  if(!visible.length){
    mount.innerHTML = '<div class="empty">لا توجد حسابات مطابقة للبحث.</div>';
    return;
  }

  mount.innerHTML = visible.map(acc=>{
    const lvl = getLevel(acc.Code);
    const stats = getAccountStats(acc.Code);
    const hasChildren = accounts.some(a=>String(a.ParentCode)===String(acc.Code));

    return `
      <div class="tree-node level-${lvl}">
        <div class="tree-node-title">
          <span style="display:inline-flex;color:var(--ink-secondary);">${lvl===1 ? getSvgIcon('folder', 14) : (hasChildren ? getSvgIcon('folder', 14) : getSvgIcon('fileText', 14))}</span>
          <span class="account-code mono">${acc.Code}</span>
          <span style="font-weight:${lvl<=2?'800':'600'};font-size:13px;color:var(--ink);">${acc.Name}</span>
          <span class="nature-pill ${stats.nature==='مدين'?'debit':'credit'}">${stats.nature}</span>
          ${acc.Description ? `<span style="font-size:11px;color:var(--ink-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;">(${acc.Description})</span>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span class="mono font-bold" style="font-size:13.5px;color:${stats.netBalance<0?'var(--red)':'var(--ink)'};">${stats.netBalance.toLocaleString()} ج.م</span>
          <div style="display:flex;gap:4px;">
            <button class="btn btn-xs btn-blue" data-accledger="${acc.Code}" title="كشف الحساب">${getSvgIcon('chart', 12)} كشف</button>
            <button class="btn btn-xs btn-ghost" data-accsub="${acc.Code}" title="إضافة حساب فرعي">${getSvgIcon('plus', 12)} فرعي</button>
            <button class="btn btn-xs btn-ghost" data-accedit="${acc.Code}" title="تعديل">${getSvgIcon('edit', 12)}</button>
            ${(!hasChildren && state.user.role==='admin') ? `<button class="btn btn-xs btn-red" data-accdel="${acc.Code}" title="حذف">${getSvgIcon('trash', 12)}</button>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  mount.querySelectorAll('[data-accledger]').forEach(btn=>{
    btn.onclick = ()=>{
      const acc = state.accounts.find(a=>String(a.Code)===btn.dataset.accledger);
      if(acc) openAccountLedgerModal(acc);
    };
  });
  mount.querySelectorAll('[data-accsub]').forEach(btn=>{
    btn.onclick = ()=>{ openAccountModal(btn.dataset.accsub); };
  });
  mount.querySelectorAll('[data-accedit]').forEach(btn=>{
    btn.onclick = ()=>{
      const acc = state.accounts.find(a=>String(a.Code)===btn.dataset.accedit);
      if(acc) openAccountModal(null, acc);
    };
  });
  mount.querySelectorAll('[data-accdel]').forEach(btn=>{
    btn.onclick = async ()=>{
      const ok = await openConfirmModal({
        title: 'حذف الحساب المالي',
        message: `هل تريد بالتأكيد حذف الحساب (${btn.dataset.accdel}) من دليل الحسابات؟`,
        confirmText: 'حذف الحساب',
        confirmClass: 'btn-danger',
        icon: 'trash'
      });
      if(!ok) return;
      try{
        await deleteAccountRemote(btn.dataset.accdel);
        showToast('تم حذف الحساب بنجاح', 'success');
        renderChartOfAccounts(document.getElementById('main'));
      }catch(e){ showToast('تعذر الحذف: '+e.message, 'error'); }
    };
  });
}

function openAccountModal(parentCode, editAcc){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const isEdit = !!editAcc;

  // Auto suggest next code
  let suggestedCode = '';
  let parentAcc = null;
  if(parentCode){
    parentAcc = state.accounts.find(a=>String(a.Code)===String(parentCode));
    const siblings = state.accounts.filter(a=>String(a.ParentCode)===String(parentCode));
    suggestedCode = String(parentCode) + (siblings.length < 9 ? '0' + (siblings.length+1) : (siblings.length+1));
  }

  const types = ['الأصول', 'الخصوم', 'حقوق الملكية', 'الإيرادات', 'المصروفات'];

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:500px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
        <h3 style="margin:0;font-size:16px;">${isEdit ? 'تعديل الحساب: '+editAcc.Name : 'إضافة حساب جديد للدليل'}</h3>
        <button class="btn btn-ghost btn-xs" id="closeAccModal" aria-label="إغلاق">&times;</button>
      </div>

      <div class="field"><label>الحساب الرئيسي التابع له</label>
        <select id="mAccParent" ${isEdit?'disabled':''}>
          <option value="">-- حساب جذري رئيسي --</option>
          ${state.accounts.map(a=>`<option value="${a.Code}" ${(parentCode===a.Code || (editAcc && editAcc.ParentCode===a.Code))?'selected':''}>${a.Code} - ${a.Name} (${a.Type})</option>`).join('')}
        </select>
      </div>

      <div class="grid2">
        <div class="field"><label>كود الحساب *</label><input id="mAccCode" value="${isEdit?editAcc.Code:suggestedCode}" placeholder="مثال: 1105" ${isEdit?'disabled':''}></div>
        <div class="field"><label>نوع الحساب</label>
          <select id="mAccType">
            ${types.map(t=>`<option ${(parentAcc && parentAcc.Type===t)||(editAcc && editAcc.Type===t)?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="field"><label>اسم الحساب *</label><input id="mAccName" value="${isEdit?editAcc.Name:''}" placeholder="مثال: البنك الأهلي المصري"></div>

      <div class="grid2">
        <div class="field"><label>طبيعة الحساب</label>
          <select id="mAccNature">
            <option value="مدين" ${(editAcc && editAcc.Nature==='مدين')?'selected':''}>مدين (Debit)</option>
            <option value="دائن" ${(editAcc && editAcc.Nature==='دائن')?'selected':''}>دائن (Credit)</option>
          </select>
        </div>
        <div class="field">
          <label>الرصيد الافتتاحي (ج.م)</label>
          <div style="display:flex;gap:6px;">
            <input id="mAccBal" type="number" value="${isEdit?(editAcc.Balance||0):0}" readonly style="background:var(--paper2);cursor:not-allowed;" title="يتم تحديد الأرصدة الافتتاحية مركزياً عبر شاشة الأرصدة الافتتاحية لضمان توازن القيد المزدوج">
            <button type="button" class="btn btn-ghost btn-xs" id="openOpBalFromAccModalBtn" style="white-space:nowrap;font-size:11px;" title="فتح شاشة الأرصدة الافتتاحية">${getSvgIcon("scale", 12)} القيد الافتتاحي</button>
          </div>
          <div style="font-size:10px;color:var(--ink-secondary);margin-top:2px;">يتم ضبط وتعديل الأرصدة الافتتاحية عبر شاشة الأرصدة الافتتاحية لضمان توازن القيد المزدوج</div>
        </div>
      </div>

      <div class="field"><label>وصف / ملاحظات</label><input id="mAccDesc" value="${isEdit?(editAcc.Description||''):''}" placeholder="وصف الحساب أو الغرض منه..."></div>

      <div class="actions-row">
        <button class="btn btn-ghost" id="cancelAccModal">إلغاء</button>
        <button class="btn btn-primary" id="saveAccModalBtn">${getSvgIcon("check", 14)} حفظ الحساب</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#closeAccModal').onclick = ()=>overlay.remove();
  overlay.querySelector('#cancelAccModal').onclick = ()=>overlay.remove();
  const opBalFromAccBtn = overlay.querySelector('#openOpBalFromAccModalBtn');
  if(opBalFromAccBtn){
    opBalFromAccBtn.onclick = ()=>{ overlay.remove(); openOpeningBalancesModal(); };
  }

  overlay.querySelector('#mAccParent').onchange = (e)=>{
    const p = state.accounts.find(a=>String(a.Code)===e.target.value);
    if(p){
      overlay.querySelector('#mAccType').value = p.Type;
      overlay.querySelector('#mAccNature').value = p.Nature;
      const sibs = state.accounts.filter(a=>String(a.ParentCode)===String(p.Code));
      overlay.querySelector('#mAccCode').value = String(p.Code) + (sibs.length < 9 ? '0' + (sibs.length+1) : (sibs.length+1));
    }
  };

  overlay.querySelector('#saveAccModalBtn').onclick = async ()=>{
    const code = overlay.querySelector('#mAccCode').value.trim();
    const name = overlay.querySelector('#mAccName').value.trim();
    const parent = overlay.querySelector('#mAccParent').value;
    const type = overlay.querySelector('#mAccType').value;
    const nature = overlay.querySelector('#mAccNature').value;
    const balance = isEdit ? Number(editAcc.Balance || 0) : 0;
    const desc = overlay.querySelector('#mAccDesc').value.trim();

    if(!code || !name){ showToast('يرجى كتابة كود الحساب واسم الحساب', 'error'); return; }
    const accObj = {Code:code, Name:name, ParentCode:parent, Type:type, Nature:nature, Balance:balance, Description:desc};

    try{
      await saveAccountRemote(accObj);
      overlay.remove();
      showToast('تم حفظ الحساب بنجاح', 'success');
      renderChartOfAccounts(document.getElementById('main'));
    }catch(e){ showToast('تم الحفظ محلياً: '+e.message, 'info'); }
  };
}

/* ---------------- Account Ledger (كشف الحساب) ---------------- */
function openAccountLedgerModal(acc){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  // Gather all descendant codes if this account has sub-accounts
  function getAllSubAccountCodes(code){
    const res = [String(code).trim()];
    (state.accounts || []).forEach(a => {
      if(String(a.ParentCode).trim() === String(code).trim()){
        res.push(...getAllSubAccountCodes(a.Code));
      }
    });
    return res;
  }
  const targetCodes = new Set(getAllSubAccountCodes(acc.Code));

  // Gather all transactions
  const lines = [];
  (state.journalEntries||[]).forEach(je=>{
    (je.Lines||[]).forEach(l=>{
      if(targetCodes.has(String(l.AccountCode).trim())){
        lines.push({
          date: cleanDate(je.Date),
          entryNum: je.EntryNumber||je.ID,
          accountCode: l.AccountCode,
          accountName: l.AccountName,
          desc: l.Notes || je.Description,
          debit: Number(l.Debit||0),
          credit: Number(l.Credit||0)
        });
      }
    });
  });

  lines.sort((a,b)=>new Date(a.date) - new Date(b.date));

  let runningBal = Number(acc.Balance||0);
  const rowsWithBal = lines.map(l=>{
    if(acc.Nature==='مدين') runningBal += (l.debit - l.credit);
    else runningBal += (l.credit - l.debit);
    return {...l, runningBal};
  });

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:750px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
        <div>
          <h3 style="margin:0;font-size:16px;display:flex;align-items:center;gap:6px;">${getSvgIcon("chart", 16)} كشف حساب: <span style="color:var(--primary);">${acc.Name}</span> (<span class="mono">${acc.Code}</span>)</h3>
          <div style="font-size:11.5px;color:var(--ink-secondary);margin-top:2px;">طبيعة الحساب: <b>${acc.Nature}</b> | الرصيد الافتتاحي: <span class="mono font-bold">${acc.Balance||0} ج.م</span></div>
        </div>
        <button class="btn btn-ghost btn-xs" id="closeLedgerModal">إغلاق</button>
      </div>

      <div class="stat-grid" style="grid-template-columns: repeat(3, 1fr);margin-bottom:14px;">
        <div class="stat-card blue"><div class="num mono">${lines.reduce((s,l)=>s+l.debit,0).toLocaleString()} ج.م</div><div class="lbl">إجمالي حركات المدين</div></div>
        <div class="stat-card green"><div class="num mono">${lines.reduce((s,l)=>s+l.credit,0).toLocaleString()} ج.م</div><div class="lbl">إجمالي حركات الدائن</div></div>
        <div class="stat-card purple"><div class="num mono">${runningBal.toLocaleString()} ج.م</div><div class="lbl">الرصيد الختامي الحالي</div></div>
      </div>

      ${rowsWithBal.length===0 ? '<div class="empty">لا توجد حركات مسجلة على هذا الحساب بعد.</div>' : `
      <div class="table-wrap" style="max-height:380px;">
        <table>
          <thead><tr><th>التاريخ</th><th>رقم القيد</th><th>البيان</th><th>مدين</th><th>دائن</th><th>الرصيد التراكمي</th></tr></thead>
          <tbody>
            ${rowsWithBal.map(r=>`<tr>
              <td>${r.date}</td>
              <td class="mono font-bold" style="color:var(--primary);">${r.entryNum}</td>
              <td>${r.desc}</td>
              <td class="mono ${r.debit>0?'font-bold':''}" style="color:${r.debit>0?'var(--blue)':'inherit'};">${r.debit||'-'}</td>
              <td class="mono ${r.credit>0?'font-bold':''}" style="color:${r.credit>0?'var(--green)':'inherit'};">${r.credit||'-'}</td>
              <td class="mono font-bold">${r.runningBal.toLocaleString()} ج.م</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`}

      <div class="actions-row" style="margin-top:14px;">
        <button class="btn btn-ghost btn-sm" id="exportLedgerExcelBtn">${getSvgIcon("download", 14)} تصدير كشف الحساب Excel</button>
        <button class="btn btn-primary btn-sm" id="doneLedgerBtn">تم</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#closeLedgerModal').onclick = ()=>overlay.remove();
  overlay.querySelector('#doneLedgerBtn').onclick = ()=>overlay.remove();
  overlay.querySelector('#exportLedgerExcelBtn').onclick = ()=>{
    const headers = ['التاريخ','رقم القيد','البيان','مدين','دائن','الرصيد'];
    const rows = rowsWithBal.map(r=>[r.date, r.entryNum, `"${r.desc}"`, r.debit, r.credit, r.runningBal]);
    downloadCSV(`Ledger_${acc.Code}_${acc.Name}.csv`, headers, rows);
  };
}

function exportAccountsToExcel(){
  const headers = ['كود الحساب','اسم الحساب','النوع','الحساب الرئيسي','الطبيعة','الرصيد الحالي','الوصف'];
  const rows = state.accounts.map(a=>{
    const stats = getAccountStats(a.Code);
    return [a.Code, `"${a.Name}"`, a.Type, a.ParentCode||'-', a.Nature, stats.netBalance, `"${a.Description||''}"`];
  });
  downloadCSV(`Chart_Of_Accounts_${new Date().toISOString().slice(0,10)}.csv`, headers, rows);
}
