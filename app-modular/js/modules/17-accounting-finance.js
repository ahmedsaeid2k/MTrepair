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
      if(!confirm(`هل تريد حذف الحساب (${btn.dataset.accdel})؟`)) return;
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
        <button class="btn btn-ghost btn-xs" id="closeAccModal">&times;</button>
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
        <div class="field"><label>الرصيد الافتتاحي (ج.م)</label><input id="mAccBal" type="number" value="${isEdit?(editAcc.Balance||0):0}"></div>
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
    const balance = Number(overlay.querySelector('#mAccBal').value)||0;
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

/* ---------------- Journal Entries View (دفتر القيود اليومية) ---------------- */
function renderJournalEntries(main){
  const entries = [...state.journalEntries].reverse();

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("fileText", 22)} دفتر القيود اليومية (General Journal)</h2>
        <div class="subtitle mono" style="font-size:12px;color:var(--ink-secondary);">${entries.length} قيد مسجل</div>
      </div>
      <div>
        <button class="btn btn-primary btn-sm" id="newManualJournalBtn">${getSvgIcon("plus", 14)} إضافة قيد يدوي جديد</button>
      </div>
    </div>

    ${entries.length===0 ? '<div class="empty">لا توجد قيود مسجلة بعد. سيتم تسجيل القيود آلياً عند إجراء المعاملات أو إضافة قيد يدوي.</div>' : `
    <div style="display:flex;flex-direction:column;gap:12px;">
      ${entries.map(je=>`
        <div class="card" style="padding:14px 16px;margin-bottom:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:8px;margin-bottom:8px;">
            <div>
              <span class="mono font-bold" style="color:var(--primary);font-size:13.5px;">${je.EntryNumber||je.ID}</span>
              <span style="color:var(--ink-secondary);font-size:12px;margin-right:8px;">${getSvgIcon("calendar", 12)} ${cleanDate(je.Date)}</span>
              <span class="status-badge st-check" style="font-size:10.5px;margin-right:6px;">${je.ReferenceType||'Manual'}</span>
            </div>
            <div style="font-size:12px;color:var(--ink-secondary);">بواسطة: <b>${je.By||'نظام'}</b></div>
          </div>
          <div style="font-weight:700;font-size:13px;margin-bottom:8px;">${je.Description}</div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>كود الحساب</th><th>اسم الحساب</th><th>البيان / ملاحظة</th><th>مدين (Debit)</th><th>دائن (Credit)</th></tr></thead>
              <tbody>
                ${(je.Lines||[]).map(l=>`<tr>
                  <td class="mono font-bold">${l.AccountCode}</td>
                  <td><b>${l.AccountName||(state.accounts.find(a=>a.Code===l.AccountCode)||{}).Name||'-'}</b></td>
                  <td style="color:var(--ink-secondary);font-size:11.5px;">${l.Notes||'-'}</td>
                  <td class="mono ${Number(l.Debit)>0?'font-bold':''}" style="color:${Number(l.Debit)>0?'var(--blue)':'inherit'};">${Number(l.Debit)>0?Number(l.Debit).toLocaleString()+' ج.م':'-'}</td>
                  <td class="mono ${Number(l.Credit)>0?'font-bold':''}" style="color:${Number(l.Credit)>0?'var(--green)':'inherit'};">${Number(l.Credit)>0?Number(l.Credit).toLocaleString()+' ج.م':'-'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `).join('')}
    </div>`}
  `;

  document.getElementById('newManualJournalBtn').onclick = ()=>openManualJournalModal();
}

function openManualJournalModal(){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  let lines = [
    {accountCode:'', debit:0, credit:0, notes:''},
    {accountCode:'', debit:0, credit:0, notes:''}
  ];

  function renderModalContent(){
    const totalDebit = lines.reduce((s,l)=>s+Number(l.debit||0),0);
    const totalCredit = lines.reduce((s,l)=>s+Number(l.credit||0),0);
    const isBalanced = totalDebit > 0 && totalDebit === totalCredit;

    overlay.innerHTML = `
      <div class="modal-content" style="max-width:760px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
          <h3 style="margin:0;font-size:16px;display:flex;align-items:center;gap:6px;">${getSvgIcon("plus", 16)} إضافة قيد يومية يدوي متوازن</h3>
          <button class="btn btn-ghost btn-xs" id="closeJournalModal">&times;</button>
        </div>

        <div class="grid2">
          <div class="field"><label>التاريخ *</label><input id="jeDate" type="date" value="${new Date().toISOString().slice(0,10)}"></div>
          <div class="field"><label>البيان العام للقيد *</label><input id="jeDesc" placeholder="مثال: تسوية جردية، سداد مصروفات نقدية..."></div>
        </div>

        <label style="margin:10px 0 6px;">بنود القيد (الطرف المدين والطرف الدائن):</label>
        <div id="journalLinesMount">
          ${lines.map((l,i)=>`
            <div class="journal-line-row">
              <select data-jacc="${i}">
                <option value="">-- اختر الحساب --</option>
                ${state.accounts.map(a=>`<option value="${a.Code}" ${l.accountCode===a.Code?'selected':''}>${a.Code} - ${a.Name}</option>`).join('')}
              </select>
              <input type="number" placeholder="مدين" value="${l.debit||''}" data-jdebit="${i}">
              <input type="number" placeholder="دائن" value="${l.credit||''}" data-jcredit="${i}">
              <input placeholder="بيان السطر..." value="${l.notes||''}" data-jnotes="${i}">
              <button class="btn btn-xs btn-red" data-jdel="${i}" style="height:34px;">&times;</button>
            </div>
          `).join('')}
        </div>

        <button class="btn btn-ghost btn-xs" id="addJournalLineBtn" style="margin-top:6px;">${getSvgIcon("plus", 13)} إضافة سطر جديد</button>

        <div class="fin-box" style="margin:16px 0;">
          <div class="fin-cell"><div class="l">إجمالي المدين</div><div class="v mono">${totalDebit} ج.م</div></div>
          <div class="fin-cell"><div class="l">إجمالي الدائن</div><div class="v mono">${totalCredit} ج.م</div></div>
          <div class="fin-cell"><div class="l">حالة التوازن</div><div class="v" style="color:${isBalanced?'var(--green)':'var(--red)'};font-size:12px;">${isBalanced?'متوازن ومطابق':'غير متوازن'}</div></div>
        </div>

        <div class="actions-row">
          <button class="btn btn-ghost" id="cancelJournalModal">إلغاء</button>
          <button class="btn btn-primary" id="saveJournalModalBtn" ${!isBalanced?'disabled':''}>${getSvgIcon("check", 14)} ترحيل وحفظ القيد</button>
        </div>
      </div>
    `;

    overlay.querySelector('#closeJournalModal').onclick = ()=>overlay.remove();
    overlay.querySelector('#cancelJournalModal').onclick = ()=>overlay.remove();

    overlay.querySelector('#addJournalLineBtn').onclick = ()=>{
      lines.push({accountCode:'', debit:0, credit:0, notes:''});
      renderModalContent();
    };

    overlay.querySelectorAll('[data-jacc]').forEach(sel=>{
      sel.onchange = (e)=>{ lines[Number(sel.dataset.jacc)].accountCode = e.target.value; };
    });
    overlay.querySelectorAll('[data-jdebit]').forEach(inp=>{
      inp.oninput = (e)=>{
        lines[Number(inp.dataset.jdebit)].debit = Number(e.target.value)||0;
        if(Number(e.target.value)>0) lines[Number(inp.dataset.jdebit)].credit = 0;
      };
      inp.onblur = ()=>renderModalContent();
    });
    overlay.querySelectorAll('[data-jcredit]').forEach(inp=>{
      inp.oninput = (e)=>{
        lines[Number(inp.dataset.jcredit)].credit = Number(e.target.value)||0;
        if(Number(e.target.value)>0) lines[Number(inp.dataset.jcredit)].debit = 0;
      };
      inp.onblur = ()=>renderModalContent();
    });
    overlay.querySelectorAll('[data-jnotes]').forEach(inp=>{
      inp.oninput = (e)=>{ lines[Number(inp.dataset.jnotes)].notes = e.target.value; };
    });
    overlay.querySelectorAll('[data-jdel]').forEach(btn=>{
      btn.onclick = ()=>{
        if(lines.length<=2){ showToast('يجب أن يحتوي القيد على سطرين على الأقل', 'error'); return; }
        lines.splice(Number(btn.dataset.jdel), 1);
        renderModalContent();
      };
    });

    const saveBtn = overlay.querySelector('#saveJournalModalBtn');
    if(saveBtn) saveBtn.onclick = async ()=>{
      const desc = overlay.querySelector('#jeDesc').value.trim();
      const date = overlay.querySelector('#jeDate').value;
      if(!desc){ showToast('اكتب بيان القيد', 'error'); return; }
      
      const formattedLines = lines.map(l=>{
        const a = state.accounts.find(x=>x.Code===l.accountCode);
        return {
          AccountCode: l.accountCode,
          AccountName: a ? a.Name : '',
          Debit: Number(l.debit||0),
          Credit: Number(l.credit||0),
          Notes: l.notes || ''
        };
      });

      try{
        await saveJournalEntryRemote({
          Date: date,
          Description: desc,
          ReferenceType: 'Manual',
          Lines: formattedLines,
          TotalDebit: totalDebit,
          TotalCredit: totalCredit
        });
        overlay.remove();
        showToast('تم ترحيل وحفظ القيد اليومي بنجاح', 'success');
        renderJournalEntries(document.getElementById('main'));
      }catch(e){ showToast('تم حفظ القيد محلياً', 'info'); }
    };
  }

  document.body.appendChild(overlay);
  renderModalContent();
}

/* ---------------- Trial Balance (ميزان المراجعة) ---------------- */
function renderTrialBalance(main){
  let grandDebit = 0;
  let grandCredit = 0;

  const rows = state.accounts.map(acc=>{
    const stats = getAccountStats(acc.Code);
    const hasChildren = state.accounts.some(a => String(a.ParentCode) === String(acc.Code));
    if(!hasChildren){
      grandDebit += stats.totalDebit;
      grandCredit += stats.totalCredit;
    }
    return { acc, stats, hasChildren };
  });

  const isBalanced = Math.abs(grandDebit - grandCredit) < 0.01;

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("scale", 22)} ميزان المراجعة (Trial Balance)</h2>
      </div>
      <div>
        <button class="btn btn-ghost btn-sm" id="exportTrialExcelBtn">${getSvgIcon("download", 14)} تصدير ميزان المراجعة Excel</button>
      </div>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>كود الحساب</th>
              <th>اسم الحساب</th>
              <th>النوع</th>
              <th>الطبيعة</th>
              <th>رصيد أول المدة</th>
              <th>إجمالي المدين</th>
              <th>إجمالي الدائن</th>
              <th>الرصيد الختامي</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r=>`<tr style="${r.hasChildren ? 'background:var(--paper2);font-weight:700;' : ''}">
              <td class="mono font-bold">${r.acc.Code}</td>
              <td><b>${r.acc.Name}</b> ${r.hasChildren ? '<span class="badge" style="font-size:10px;margin-right:4px;">تجميعي</span>' : ''}</td>
              <td>${r.acc.Type}</td>
              <td><span class="nature-pill ${r.stats.nature==='مدين'?'debit':'credit'}">${r.stats.nature}</span></td>
              <td class="mono">${(r.acc.Balance||0).toLocaleString()} ج.م</td>
              <td class="mono" style="color:var(--blue);">${r.stats.totalDebit.toLocaleString()} ج.م</td>
              <td class="mono" style="color:var(--green);">${r.stats.totalCredit.toLocaleString()} ج.م</td>
              <td class="mono font-bold" style="color:var(--primary);">${r.stats.netBalance.toLocaleString()} ج.م</td>
            </tr>`).join('')}
          </tbody>
          <tfoot>
            <tr style="background:var(--paper3);font-weight:900;font-size:13.5px;">
              <td colspan="5" style="text-align:left;">الإجمالي العام لميزان المراجعة (الحسابات الفرعية القابلة للقيد):</td>
              <td class="mono font-bold" style="color:var(--blue);">${grandDebit.toLocaleString()} ج.م</td>
              <td class="mono font-bold" style="color:var(--green);">${grandCredit.toLocaleString()} ج.م</td>
              <td>${isBalanced ? '<span class="status-badge st-done">متزن</span>' : `<span class="status-badge st-red">غير متزن (${Math.abs(grandDebit - grandCredit).toLocaleString()} ج.م)</span>`}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;

  document.getElementById('exportTrialExcelBtn').onclick = ()=>{
    const headers = ['كود الحساب','اسم الحساب','النوع','الطبيعة','رصيد أول المدة','إجمالي المدين','إجمالي الدائن','الرصيد الختامي'];
    const dataRows = rows.map(r=>[
      r.acc.Code, `"${r.acc.Name}"`, r.acc.Type, r.stats.nature, r.acc.Balance||0, r.stats.totalDebit, r.stats.totalCredit, r.stats.netBalance
    ]);
    downloadCSV(`Trial_Balance_${new Date().toISOString().slice(0,10)}.csv`, headers, dataRows);
  };
}

/* ============================================================
   محرك قائمة الدخل والأرباح الحقيقية وكشوفات الحسابات التفصيلية
   ============================================================ */

function getPeriodDates(mode, customFrom, customTo){
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  if(mode === 'today'){
    return { from: todayStr, to: todayStr, label: `اليوم (${todayStr})` };
  }
  if(mode === 'week'){
    const w = new Date();
    w.setDate(w.getDate() - 7);
    const fromStr = w.toISOString().slice(0, 10);
    return { from: fromStr, to: todayStr, label: `آخر 7 أيام (من ${fromStr} إلى ${todayStr})` };
  }
  if(mode === 'month'){
    const mStr = todayStr.slice(0, 7) + '-01';
    return { from: mStr, to: todayStr, label: `الشهر الحالي (من ${mStr} إلى ${todayStr})` };
  }
  if(mode === 'quarter'){
    const currentMonth = now.getMonth();
    const qStartMonth = Math.floor(currentMonth / 3) * 3 + 1;
    const qStr = now.getFullYear() + '-' + String(qStartMonth).padStart(2, '0') + '-01';
    return { from: qStr, to: todayStr, label: `الربع الحالي (من ${qStr} إلى ${todayStr})` };
  }
  if(mode === 'year'){
    const yStr = now.getFullYear() + '-01-01';
    return { from: yStr, to: todayStr, label: `العام الحالي ${now.getFullYear()}` };
  }
  if(mode === 'custom' && customFrom && customTo){
    return { from: customFrom, to: customTo, label: `فترة مخصصة (من ${customFrom} إلى ${customTo})` };
  }
  return { from: '2000-01-01', to: '2099-12-31', label: 'كافة الفترات (سجل شامل)' };
}

function getIncomeStatementData(startDate, endDate){
  const sDate = startDate || '2000-01-01';
  const eDate = endDate || '2099-12-31';

  // 1. POS Sales Revenue, Returns & COGS
  let posSalesRev = 0;
  let posSalesReturns = 0;
  let posSalesCOGS = 0;
  let posSalesCount = 0;
  let posReturnsCount = 0;
  (state.sales || []).forEach(s => {
    const dt = cleanDate(s.Date) || s.Date;
    if(dt >= sDate && dt <= eDate){
      posSalesCount++;
      const tot = Number(s.Total || 0);
      posSalesRev += tot;

      let saleCOGS = 0;
      let returnedCOGS = 0;
      if(s.ItemsJSON){
        try {
          const items = JSON.parse(s.ItemsJSON);
          if(Array.isArray(items)){
            items.forEach(it => {
              const inv = (state.inventory||[]).find(x => x.ID === (it.itemId||it.id));
              const buy = inv ? Number(inv.PurchasePrice||0) : Number(it.purchasePrice||0);
              saleCOGS += buy * Number(it.qty||1);
            });
          }
        } catch(e){}
      }
      if(saleCOGS === 0 && tot > 0){
        saleCOGS = tot * 0.70; // تقدير متحفظ في حال عدم توفر تفاصيل الأصناف القديمة
      }

      if(s.IsReturned){
        posReturnsCount++;
        const retDetails = s.ReturnDetails || {};
        const retAmt = Number(retDetails.totalRefund != null ? retDetails.totalRefund : tot);
        posSalesReturns += retAmt;

        if(Array.isArray(retDetails.returnedItems)){
          retDetails.returnedItems.forEach(it => {
            if(it.restocked && it.itemId && !String(it.itemId).startsWith('srv_')){
              const inv = (state.inventory||[]).find(x => x.ID === it.itemId);
              const buy = inv ? Number(inv.PurchasePrice||0) : 0;
              returnedCOGS += buy * Number(it.qty||1);
            }
          });
        }
        if(returnedCOGS === 0 && retAmt > 0 && saleCOGS > 0){
          returnedCOGS = (retAmt / tot) * saleCOGS;
        }
      }

      posSalesCOGS += Math.max(0, saleCOGS - returnedCOGS);
    }
  });

  const netPosSalesRev = Math.max(0, posSalesRev - posSalesReturns);

  // 2. Maintenance Revenue & Parts COGS
  let maintLaborRev = 0;
  let maintPartsRev = 0;
  let maintPartsCOGS = 0;
  let maintRefunds = 0;
  let maintCount = 0;
  (state.receipts || []).forEach(r => {
    const dt = cleanDate(r.date) || r.date;
    if(dt >= sDate && dt <= eDate){
      const isCancelled = r.status === 'ملغي' || r.status === 'رفض العميل' || r.status === 'لا يمكن إصلاحه';
      const cost = isCancelled ? 0 : Number(r.cost || 0);
      const parts = isCancelled ? 0 : Number(r.partsCost || 0);
      const other = isCancelled ? 0 : Number(r.otherAccountAmount || 0);
      const refAmt = Number(r.refunded || 0);
      maintCount++;
      const labor = Math.max(0, cost - parts) + other;
      maintLaborRev += labor;
      maintPartsRev += parts;
      maintPartsCOGS += parts;
      maintRefunds += refAmt;
    }
  });

  const netMaintRev = Math.max(0, (maintLaborRev + maintPartsRev) - maintRefunds);

  // 3. Other Invoices & Services
  let servicesRev = 0;
  (state.invoices || []).forEach(inv => {
    const dt = cleanDate(inv.Date) || inv.Date;
    if(dt >= sDate && dt <= eDate){
      if(inv.ReferenceType !== 'Receipt' && inv.ReferenceType !== 'POS_Sale'){
        servicesRev += Number(inv.Total || 0);
      }
    }
  });

  const totalRevenue = netPosSalesRev + netMaintRev + servicesRev;
  const totalCOGS = posSalesCOGS + maintPartsCOGS;
  const grossProfit = totalRevenue - totalCOGS;
  const grossMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100) : 0;

  // 4. Operating Expenses Breakdown (Excluding POS returns, drawings, and supplier pay)
  const expCategories = {
    'إيجار': 0,
    'كهرباء ومياه': 0,
    'رواتب وسلفيات': 0,
    'بوفيه ونثريات': 0,
    'دعاية وإعلانات': 0,
    'أدوات وصيانة مقر': 0,
    'شحن وتوصيل': 0,
    'مصروفات أخرى': 0
  };
  let totalOperatingExpenses = 0;
  (state.expenses || []).forEach(exp => {
    const dt = cleanDate(exp.Date) || exp.Date;
    if(dt >= sDate && dt <= eDate){
      const isSupplier = exp.Category === 'سداد موردين ومشتريات' || String(exp.Category||'').includes('مورد') || exp.Type === 'supplier';
      const isDraw = exp.Type === 'out' || exp.Category === 'مسحوبات شخصية' || exp.Category === 'جاري الشركاء';
      const isIncome = exp.Type === 'in' || exp.Type === 'income';
      const isPosReturn = exp.Category === 'مرتجع مبيعات POS' || exp.AccountCode === '4102-RET' || exp.Type === 'pos_return';
      if(!isSupplier && !isDraw && !isIncome && !isPosReturn){
        const amt = Number(exp.Amount || 0);
        totalOperatingExpenses += amt;
        const cat = exp.Category || 'مصروفات أخرى';
        if(expCategories[cat] !== undefined) expCategories[cat] += amt;
        else expCategories['مصروفات أخرى'] += amt;
      }
    }
  });

  const netOperatingProfit = grossProfit - totalOperatingExpenses;
  const netMargin = totalRevenue > 0 ? ((netOperatingProfit / totalRevenue) * 100) : 0;

  return {
    sDate, eDate,
    posSalesRev, posSalesReturns, netPosSalesRev, posSalesCOGS, posSalesCount, posReturnsCount,
    maintLaborRev, maintPartsRev, maintPartsCOGS, maintRefunds, netMaintRev, maintCount,
    servicesRev,
    totalRevenue, totalCOGS, grossProfit, grossMargin,
    expCategories, totalOperatingExpenses,
    netOperatingProfit, netMargin
  };
}

function renderFinanceReportPage(main){
  if(!state.incomeReportPeriod){
    state.incomeReportPeriod = { mode: 'month', from: '', to: '' };
  }

  const periodInfo = getPeriodDates(state.incomeReportPeriod.mode, state.incomeReportPeriod.from, state.incomeReportPeriod.to);
  const data = getIncomeStatementData(periodInfo.from, periodInfo.to);

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("trendUp", 22)} قائمة الدخل والأرباح الحقيقية</h2>
        <div class="subtitle mono" style="font-size:12px;color:var(--primary);font-weight:700;">
          ${getSvgIcon("calendar", 12)} الفترة المحددة: ${periodInfo.label}
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" id="exportIncomeExcelBtn">${getSvgIcon("download", 14)} تصدير Excel</button>
        <button class="btn btn-primary btn-sm" id="printIncomeReportBtn">${getSvgIcon("printer", 14)} طباعة قائمة الدخل A4</button>
      </div>
    </div>

    <!-- Period Filter Toolbar -->
    <div class="card" style="padding:12px;margin-bottom:14px;background:var(--paper2);border:1.5px solid var(--line);">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          <span style="font-size:12px;font-weight:800;color:var(--ink-secondary);">الفترة:</span>
          ${[
            {id:'today', label:'اليوم'},
            {id:'week', label:'آخر 7 أيام'},
            {id:'month', label:'الشهر الحالي'},
            {id:'quarter', label:'الربع الحالي'},
            {id:'year', label:'العام الحالي'},
            {id:'all', label:'كافة الفترات'},
            {id:'custom', label:'مخصص'}
          ].map(p => `
            <button class="btn btn-xs ${state.incomeReportPeriod.mode===p.id?'btn-primary font-bold':'btn-ghost'}" data-incomemode="${p.id}">
              ${p.label}
            </button>
          `).join('')}
        </div>

        ${state.incomeReportPeriod.mode==='custom' ? `
          <div style="display:flex;align-items:center;gap:6px;">
            <label style="font-size:11px;font-weight:700;">من:</label>
            <input type="date" id="incomeCustomFrom" value="${state.incomeReportPeriod.from || ''}" style="padding:4px 8px;font-size:12px;border:1px solid #cbd5e1;border-radius:4px;">
            <label style="font-size:11px;font-weight:700;">إلى:</label>
            <input type="date" id="incomeCustomTo" value="${state.incomeReportPeriod.to || ''}" style="padding:4px 8px;font-size:12px;border:1px solid #cbd5e1;border-radius:4px;">
            <button class="btn btn-xs btn-blue" id="applyCustomIncomeBtn">تطبيق</button>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- 6 Executive KPI Metric Cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(170px, 1fr));gap:12px;margin-bottom:16px;">
      <div class="card" style="padding:14px;margin:0;border-right:4px solid #0284c7;">
        <div style="font-size:11.5px;color:var(--ink-secondary);font-weight:700;">إجمالي الإيرادات</div>
        <div class="num mono font-bold" style="font-size:19px;margin-top:4px;color:#0284c7;">${data.totalRevenue.toLocaleString()} ج.م</div>
        <div style="font-size:10.5px;color:var(--ink-secondary);margin-top:2px;">مبيعات + صيانة + خدمات</div>
      </div>

      <div class="card" style="padding:14px;margin:0;border-right:4px solid #ea580c;">
        <div style="font-size:11.5px;color:var(--ink-secondary);font-weight:700;">تكلفة البضاعة والمبيعات (COGS)</div>
        <div class="num mono font-bold" style="font-size:19px;margin-top:4px;color:#ea580c;">${data.totalCOGS.toLocaleString()} ج.م</div>
        <div style="font-size:10.5px;color:var(--ink-secondary);margin-top:2px;">تكلفة الشراء للبضاعة والقطع</div>
      </div>

      <div class="card" style="padding:14px;margin:0;border-right:4px solid #16a34a;">
        <div style="font-size:11.5px;color:var(--ink-secondary);font-weight:700;">مجمل الربح (Gross Profit)</div>
        <div class="num mono font-bold" style="font-size:19px;margin-top:4px;color:#16a34a;">${data.grossProfit.toLocaleString()} ج.م</div>
        <div style="font-size:10.5px;color:var(--green-text);font-weight:700;margin-top:2px;">هامش ربح: ${data.grossMargin.toFixed(1)}%</div>
      </div>

      <div class="card" style="padding:14px;margin:0;border-right:4px solid #dc2626;">
        <div style="font-size:11.5px;color:var(--ink-secondary);font-weight:700;">المصروفات التشغيلية</div>
        <div class="num mono font-bold" style="font-size:19px;margin-top:4px;color:#dc2626;">${data.totalOperatingExpenses.toLocaleString()} ج.م</div>
        <div style="font-size:10.5px;color:var(--ink-secondary);margin-top:2px;">إيجار، رواتب، مرافق، نثريات</div>
      </div>

      <div class="card" style="padding:14px;margin:0;border-right:4px solid #7c3aed;">
        <div style="font-size:11.5px;color:var(--ink-secondary);font-weight:700;">صافي الربح الحقيقي (Net Profit)</div>
        <div class="num mono font-bold" style="font-size:20px;margin-top:4px;color:${data.netOperatingProfit>=0?'#7c3aed':'#dc2626'};">
          ${data.netOperatingProfit.toLocaleString()} ج.م
        </div>
        <div style="font-size:10.5px;color:var(--ink-secondary);margin-top:2px;">بعد خصم كافة الأعباء والتكاليف</div>
      </div>

      <div class="card" style="padding:14px;margin:0;border-right:4px solid #0d9488;">
        <div style="font-size:11.5px;color:var(--ink-secondary);font-weight:700;">نسبة صافي الربح</div>
        <div class="num mono font-bold" style="font-size:20px;margin-top:4px;color:#0d9488;">${data.netMargin.toFixed(1)}%</div>
        <div style="font-size:10.5px;color:var(--ink-secondary);margin-top:2px;">من إجمالي إيرادات النشاط</div>
      </div>
    </div>

    <!-- Structured Income Statement Ledger -->
    <div class="card" style="padding:0;overflow:hidden;border:1px solid #cbd5e1;">
      <div style="background:#0f172a;color:#fff;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;">
        <h3 style="margin:0;font-size:15px;font-weight:800;display:flex;align-items:center;gap:6px;">${getSvgIcon("fileText", 16)} هيكل قائمة الدخل المحاسبية المعتمدة</h3>
        <span class="mono" style="font-size:12px;color:#94a3b8;">معايير المحاسبة والتقارير المالية الدولية</span>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tbody>
          <!-- 1. Revenues Section -->
          <tr style="background:#f8fafc;border-bottom:2px solid #cbd5e1;">
            <td colspan="2" style="padding:10px 16px;font-weight:900;color:#0284c7;font-size:14px;">
              ١. الإيرادات التشغيلية للنشاط (Operating Revenues)
            </td>
            <td style="padding:10px 16px;text-align:left;font-weight:900;color:#0284c7;" class="mono font-bold">
              ${data.totalRevenue.toLocaleString()} ج.م
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 24px;color:#334155;">إيرادات خدمات صيانة وتصليح الأجهزة (مصنعيات وأجور شغل)</td>
            <td style="padding:8px;color:#64748b;font-size:11.5px;">حساب 4101 (${data.maintCount} أمر شغل)</td>
            <td style="padding:8px 16px;text-align:left;" class="mono">${data.maintLaborRev.toLocaleString()} ج.م</td>
          </tr>
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 24px;color:#334155;">إيرادات مبيعات بضائع وإكسسوار ومتجر (نقطة البيع POS)</td>
            <td style="padding:8px;color:#64748b;font-size:11.5px;">حساب 4102 (${data.posSalesCount} فاتورة بيع)</td>
            <td style="padding:8px 16px;text-align:left;" class="mono">${data.posSalesRev.toLocaleString()} ج.م</td>
          </tr>
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 24px;color:#334155;">إيرادات قطع الغيار المباعة والمستهلكة في الصيانة</td>
            <td style="padding:8px;color:#64748b;font-size:11.5px;">سعر قطع الغيار المحصلة</td>
            <td style="padding:8px 16px;text-align:left;" class="mono">${data.maintPartsRev.toLocaleString()} ج.م</td>
          </tr>
          ${data.servicesRev > 0 ? `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:8px 24px;color:#334155;">إيرادات عقود وخدمات كاميرات ومشاريع وفواتير مستقلة</td>
              <td style="padding:8px;color:#64748b;font-size:11.5px;">حساب 4103</td>
              <td style="padding:8px 16px;text-align:left;" class="mono">${data.servicesRev.toLocaleString()} ج.م</td>
            </tr>
          ` : ''}

          <!-- 2. Cost of Sales Section -->
          <tr style="background:#f8fafc;border-top:2px solid #cbd5e1;border-bottom:2px solid #cbd5e1;">
            <td colspan="2" style="padding:10px 16px;font-weight:900;color:#ea580c;font-size:14px;">
              ٢. يطرح: تكلفة النشاط والمبيعات (Cost of Goods Sold - COGS)
            </td>
            <td style="padding:10px 16px;text-align:left;font-weight:900;color:#ea580c;" class="mono font-bold">
              (${data.totalCOGS.toLocaleString()}) ج.م
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 24px;color:#334155;">تكلفة البضاعة المباعة في نقطة البيع (سعر الشراء للأصناف المباعة)</td>
            <td style="padding:8px;color:#64748b;font-size:11.5px;">حساب 5102</td>
            <td style="padding:8px 16px;text-align:left;" class="mono font-bold" style="color:#ea580c;">(${data.posSalesCOGS.toLocaleString()}) ج.م</td>
          </tr>
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 24px;color:#334155;">تكلفة قطع الغيار المستهلكة في الصيانة (سعر الشراء من المخزن)</td>
            <td style="padding:8px;color:#64748b;font-size:11.5px;">حساب 5101</td>
            <td style="padding:8px 16px;text-align:left;" class="mono font-bold" style="color:#ea580c;">(${data.maintPartsCOGS.toLocaleString()}) ج.م</td>
          </tr>

          <!-- 3. Gross Profit Summary Row -->
          <tr style="background:#ecfdf5;border-top:2.5px solid #86efac;border-bottom:2.5px solid #86efac;">
            <td style="padding:11px 16px;font-weight:900;color:#15803d;font-size:14.5px;">
              مجمل الربح التشغيلي (Gross Profit)
            </td>
            <td style="padding:11px;color:#166534;font-weight:800;font-size:12px;">
              نسبة هامش مجمل الربح: <span class="mono">${data.grossMargin.toFixed(1)}%</span>
            </td>
            <td style="padding:11px 16px;text-align:left;font-weight:900;font-size:16px;color:#15803d;" class="mono font-bold">
              ${data.grossProfit.toLocaleString()} ج.م
            </td>
          </tr>

          <!-- 4. Operating Expenses Section -->
          <tr style="background:#f8fafc;border-top:2px solid #cbd5e1;border-bottom:2px solid #cbd5e1;">
            <td colspan="2" style="padding:10px 16px;font-weight:900;color:#dc2626;font-size:14px;">
              ٣. يطرح: المصروفات التشغيلية والعمومية (Operating Expenses)
            </td>
            <td style="padding:10px 16px;text-align:left;font-weight:900;color:#dc2626;" class="mono font-bold">
              (${data.totalOperatingExpenses.toLocaleString()}) ج.م
            </td>
          </tr>
          ${Object.entries(data.expCategories).map(([cat, amt]) => {
            if(amt <= 0) return '';
            return `
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:7px 24px;color:#334155;">مصروفات: ${escapeHtml(cat)}</td>
                <td style="padding:7px;color:#64748b;font-size:11px;">تشغيلي</td>
                <td style="padding:7px 16px;text-align:left;" class="mono">(${amt.toLocaleString()}) ج.م</td>
              </tr>
            `;
          }).join('')}

          <!-- 5. Net Profit Summary Row -->
          <tr style="background:${data.netOperatingProfit>=0?'#f5f3ff':'#fef2f2'};border-top:3px solid ${data.netOperatingProfit>=0?'#c084fc':'#fca5a5'};">
            <td style="padding:14px 16px;font-weight:900;font-size:16px;color:${data.netOperatingProfit>=0?'#6b21a8':'#991b1b'};">
              صافي الربح الحقيقي للفترة (Net Profit)
            </td>
            <td style="padding:14px;font-weight:800;font-size:13px;color:${data.netOperatingProfit>=0?'#6b21a8':'#991b1b'};">
              نسبة صافي الربح: <span class="mono">${data.netMargin.toFixed(1)}%</span>
            </td>
            <td style="padding:14px 16px;text-align:left;font-weight:900;font-size:18px;color:${data.netOperatingProfit>=0?'#6b21a8':'#991b1b'};" class="mono font-bold">
              ${data.netOperatingProfit.toLocaleString()} ج.م
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  // Attach Period Button Handlers
  main.querySelectorAll('[data-incomemode]').forEach(btn => {
    btn.onclick = () => {
      state.incomeReportPeriod.mode = btn.dataset.incomemode;
      renderFinanceReportPage(main);
    };
  });

  const applyCustomBtn = main.querySelector('#applyCustomIncomeBtn');
  if(applyCustomBtn){
    applyCustomBtn.onclick = () => {
      const fromVal = main.querySelector('#incomeCustomFrom').value;
      const toVal = main.querySelector('#incomeCustomTo').value;
      if(!fromVal || !toVal){
        showToast('يرجى تحديد تاريخي البداية والنهاية', 'error');
        return;
      }
      state.incomeReportPeriod.from = fromVal;
      state.incomeReportPeriod.to = toVal;
      renderFinanceReportPage(main);
    };
  }

  // Print & Export Handlers
  const printBtn = main.querySelector('#printIncomeReportBtn');
  if(printBtn) printBtn.onclick = () => openPrintIncomeStatement(data, periodInfo);
  const expBtn = main.querySelector('#exportIncomeExcelBtn');
  if(expBtn) expBtn.onclick = () => exportIncomeStatementToExcel(data, periodInfo);
}

function openPrintIncomeStatement(data, periodInfo){
  const mount = document.createElement('div');
  mount.id = 'printIncomeStatementMount';
  mount.className = 'print-mount-a4';
  const companyName = (state.settings && state.settings.companyName) || 'ميكروERP';

  mount.innerHTML = `
    <style>
      @media print {
        body * { visibility: hidden !important; }
        #printIncomeStatementMount, #printIncomeStatementMount * { visibility: visible !important; }
        #printIncomeStatementMount {
          position: fixed; left: 0; top: 0; width: 100%; height: auto;
          background: #fff; padding: 24px; font-family: system-ui, -apple-system, sans-serif;
          color: #000; direction: rtl; z-index: 999999;
        }
        .page-break { page-break-after: always; }
      }
    </style>
    <div style="max-width:800px;margin:0 auto;padding:20px;border:1px solid #cbd5e1;border-radius:8px;">
      <!-- Report Header -->
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:16px;">
        <div>
          <h2 style="margin:0;font-size:20px;font-weight:900;color:#0f172a;">${escapeHtml(companyName)}</h2>
          <div style="font-size:12px;color:#475569;margin-top:3px;">نظام إدارة العمليات والتقارير المالية</div>
        </div>
        <div style="text-align:left;">
          <div style="background:#0f172a;color:#fff;font-size:13px;font-weight:900;padding:4px 14px;border-radius:4px;display:inline-block;">
            قائمة الدخل والأرباح الرسمية
          </div>
          <div style="font-size:11px;color:#64748b;margin-top:4px;">تاريخ الطباعة: <b>${new Date().toISOString().slice(0,10)}</b></div>
        </div>
      </div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:10px 14px;border-radius:6px;margin-bottom:16px;font-size:12px;display:flex;justify-content:space-between;">
        <span><b>الفترة المحاسبية:</b> ${escapeHtml(periodInfo.label)}</span>
        <span>المسؤول: <b>${escapeHtml(state.user?.name || 'الإدارة')}</b></span>
      </div>

      <!-- Financial Table -->
      <table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:16px;">
        <thead>
          <tr style="background:#0f172a;color:#fff;">
            <th style="padding:8px 12px;text-align:right;">البند المالي / التصنيف المحاسبي</th>
            <th style="padding:8px 12px;text-align:center;">الملاحظات</th>
            <th style="padding:8px 12px;text-align:left;width:140px;">القيمة</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background:#f1f5f9;font-weight:bold;">
            <td colspan="2" style="padding:8px 12px;color:#0284c7;">١. إجمالي الإيرادات التشغيلية</td>
            <td style="padding:8px 12px;text-align:left;color:#0284c7;">${data.totalRevenue.toLocaleString()} ج.م</td>
          </tr>
          <tr><td style="padding:6px 20px;">• إيرادات الصيانة والتصليح (مصنعيات وأجور)</td><td style="text-align:center;">4101</td><td style="padding:6px 12px;text-align:left;">${data.maintLaborRev.toLocaleString()} ج.م</td></tr>
          <tr><td style="padding:6px 20px;">• إيرادات مبيعات البضائع والإكسسوار (POS)</td><td style="text-align:center;">4102</td><td style="padding:6px 12px;text-align:left;">${data.posSalesRev.toLocaleString()} ج.م</td></tr>
          <tr><td style="padding:6px 20px;">• إيرادات قطع الغيار المستخدمة</td><td style="text-align:center;">قطع غيار</td><td style="padding:6px 12px;text-align:left;">${data.maintPartsRev.toLocaleString()} ج.م</td></tr>

          <tr style="background:#f1f5f9;font-weight:bold;">
            <td colspan="2" style="padding:8px 12px;color:#ea580c;">٢. يطرح: تكلفة النشاط والمبيعات (COGS)</td>
            <td style="padding:8px 12px;text-align:left;color:#ea580c;">(${data.totalCOGS.toLocaleString()}) ج.م</td>
          </tr>
          <tr><td style="padding:6px 20px;">• تكلفة البضاعة المباعة بالمحل (POS)</td><td style="text-align:center;">5102</td><td style="padding:6px 12px;text-align:left;">(${data.posSalesCOGS.toLocaleString()}) ج.م</td></tr>
          <tr><td style="padding:6px 20px;">• تكلفة قطع الغيار المستخدمة بالصيانة</td><td style="text-align:center;">5101</td><td style="padding:6px 12px;text-align:left;">(${data.maintPartsCOGS.toLocaleString()}) ج.م</td></tr>

          <tr style="background:#ecfdf5;font-weight:900;border-top:1.5px solid #86efac;border-bottom:1.5px solid #86efac;">
            <td style="padding:10px 12px;color:#15803d;">مجمل الربح (Gross Profit)</td>
            <td style="text-align:center;color:#15803d;">هامش: ${data.grossMargin.toFixed(1)}%</td>
            <td style="padding:10px 12px;text-align:left;color:#15803d;">${data.grossProfit.toLocaleString()} ج.م</td>
          </tr>

          <tr style="background:#f1f5f9;font-weight:bold;">
            <td colspan="2" style="padding:8px 12px;color:#dc2626;">٣. يطرح: المصروفات التشغيلية والعمومية</td>
            <td style="padding:8px 12px;text-align:left;color:#dc2626;">(${data.totalOperatingExpenses.toLocaleString()}) ج.م</td>
          </tr>
          ${Object.entries(data.expCategories).map(([c, a]) => a > 0 ? `
            <tr><td style="padding:5px 20px;">• ${escapeHtml(c)}</td><td style="text-align:center;">تشغيلي</td><td style="padding:5px 12px;text-align:left;">(${a.toLocaleString()}) ج.م</td></tr>
          ` : '').join('')}

          <tr style="background:#f5f3ff;font-weight:900;border-top:2px solid #a855f7;border-bottom:2px solid #a855f7;font-size:14px;">
            <td style="padding:12px;color:#6b21a8;">صافي الربح الفعلي النهائي (Net Profit)</td>
            <td style="text-align:center;color:#6b21a8;">هامش صافي: ${data.netMargin.toFixed(1)}%</td>
            <td style="padding:12px;text-align:left;color:#6b21a8;">${data.netOperatingProfit.toLocaleString()} ج.م</td>
          </tr>
        </tbody>
      </table>

      <!-- Signatures -->
      <div style="display:flex;justify-content:space-between;margin-top:30px;padding-top:14px;border-top:1px dashed #cbd5e1;font-size:11.5px;color:#475569;">
        <div style="text-align:center;width:40%;">
          <div>إعداد وتدقيق المحاسب</div>
          <div style="margin-top:32px;border-bottom:1px dashed #94a3b8;width:80%;margin-left:auto;margin-right:auto;"></div>
        </div>
        <div style="text-align:center;width:40%;">
          <div>اعتماد الإدارة العامة</div>
          <div style="margin-top:32px;border-bottom:1px dashed #94a3b8;width:80%;margin-left:auto;margin-right:auto;"></div>
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

function exportIncomeStatementToExcel(data, periodInfo){
  const headers = ['التصنيف المحاسبي', 'البند التفصيلي', 'القيمة بالجنيه'];
  const rows = [
    ['الإيرادات', 'إيرادات خدمات صيانة وتصليح (4101)', data.maintLaborRev],
    ['الإيرادات', 'إيرادات مبيعات متجر وقطع غيار (4102)', data.posSalesRev],
    ['الإيرادات', 'إيرادات قطع الغيار المباعة بالصيانة', data.maintPartsRev],
    ['الإيرادات', 'إجمالي الإيرادات التشغيلية', data.totalRevenue],
    ['تكلفة المبيعات', 'تكلفة البضاعة المباعة في POS (5102)', -data.posSalesCOGS],
    ['تكلفة المبيعات', 'تكلفة قطع الغيار المستخدمة بالصيانة (5101)', -data.maintPartsCOGS],
    ['تكلفة المبيعات', 'إجمالي تكلفة المبيعات (COGS)', -data.totalCOGS],
    ['الربحية', 'مجمل الربح التشغيلي (Gross Profit)', data.grossProfit],
    ['الربحية', 'نسبة هامش مجمل الربح %', data.grossMargin.toFixed(1) + '%'],
    ...Object.entries(data.expCategories).filter(([_, a]) => a > 0).map(([c, a]) => ['المصروفات التشغيلية', c, -a]),
    ['المصروفات التشغيلية', 'إجمالي المصروفات التشغيلية', -data.totalOperatingExpenses],
    ['الربحية', 'صافي الربح الفعلي النهائي (Net Profit)', data.netOperatingProfit],
    ['الربحية', 'نسبة صافي الربح النهائي %', data.netMargin.toFixed(1) + '%']
  ];
  downloadCSV(`Income_Statement_${new Date().toISOString().slice(0,10)}.csv`, headers, rows);
}

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
      const totalDue = Number(r.cost || 0) + Number(r.partsCost || 0) + Number(r.otherAccountAmount || 0);
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

      if(dep > 0){
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
        <button type="button" class="btn btn-ghost btn-sm" id="closeCustStatementBtn" style="color:#fff;font-size:18px;">&times;</button>
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

  const url = `https://wa.me/${normalizePhoneForWa(data.custPhone)}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
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
        <button type="button" class="btn btn-ghost btn-sm" id="closeSupStatementBtn" style="color:#fff;font-size:18px;">&times;</button>
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

  const url = `https://wa.me/${normalizePhoneForWa(data.supPhone)}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
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

/* ---------------- Users Management & Screen Customization Engine ---------------- */
function exportUsersToExcel(list){
  const rows = (list || state.users || []).map((u, idx) => {
    const secs = Array.isArray(u.Sections) ? u.Sections : String(u.Sections||'').split(',').map(s=>s.trim()).filter(Boolean);
    const secsLabels = secs.map(s => (SECTION_INFO[s]||{}).label || s).join(' + ');
    return {
      '#': idx + 1,
      'اسم المستخدم': u.Name,
      'المسمى / الدور': u.Role === 'admin' ? 'مدير عام' : (u.Role === 'cashier' ? 'كاشير' : (u.Role === 'technician' ? 'فني صيانة' : (u.Role === 'accountant' ? 'محاسب' : (u.Role === 'storekeeper' ? 'أمين مخزن' : u.Role)))),
      'الشاشات المسموحة': secsLabels,
      'عدد الشاشات': secs.length,
      'ملاحظات': u.Notes || ''
    };
  });
  exportToExcel(rows, `Users_Permissions_${new Date().toISOString().slice(0,10)}`);
}

function openUserModal(editUser=null){
  const isEdit = !!editUser;
  const isSuper = editUser ? (editUser.Role === 'admin' || !!editUser.Superuser || !!editUser.superuser) : false;
  const allSectionsList = [
    { key: 'maintenance', icon: getSvgIcon('tool', 14), label: 'الصيانة والتصليح', desc: 'استلام وتسليم الأجهزة، أوامر الشغل، والتتبع' },
    { key: 'pos', icon: getSvgIcon('pos', 14), label: 'نقطة البيع (POS)', desc: 'شاشة الكاشير السريعة، الباركود، وطباعة الإيصالات' },
    { key: 'invoices', icon: getSvgIcon('invoices', 14), label: 'الفواتير الضريبية والرسمية', desc: 'إصدار الفواتير، عروض الأسعار، ومتابعة التحصيل' },
    { key: 'cameras', icon: getSvgIcon('cameras', 16), label: 'كاميرات المراقبة', desc: 'كتالوج الكاميرات وعروض الأسعار والتركيب' },
    { key: 'cashdrawer', icon: getSvgIcon('creditCard', 14), label: 'حركة الخزينة والدرج', desc: 'إدارة درج الكاشير، مقبوضات ومدفوعات النقدية، والعهد، وتقفيل الوردية' },
    { key: 'daily', icon: getSvgIcon('daily', 16), label: 'دفتر اليومية العامة', desc: 'سجل القيود وحركات العمليات اليومية الشاملة والمصروفات الإدارية' },
    { key: 'finance', icon: getSvgIcon('finance', 16), label: 'القسم المالي والمحاسبي', desc: 'شجرة الحسابات، قيود اليومية، ميزان المراجعة، والأرباح' },
    { key: 'inventory', icon: getSvgIcon('inventory', 16), label: 'المخزن العام والمشتريات', desc: 'الأصناف، فواتير الشراء، الموردين، والتحويلات' },
    { key: 'barcode', icon: getSvgIcon('barcode', 16), label: 'استوديو طباعة الباركود', desc: 'تصميم وطباعة ملصقات الباركود للمخزن والمنتجات وإيصالات الصيانة' },
    { key: 'audit', icon: getSvgIcon('audit', 16), label: 'الرقابة والتدقيق وتصاريح العمليات', desc: 'سجل عمليات النظام الشامل، اعتماد تصاريح الحذف، ومتابعة النشاط' },
    { key: 'users', icon: getSvgIcon('users', 16), label: 'المستخدمين والصلاحيات', desc: 'إدارة المستخدمين وتعيين أدوارهم وصلاحيات الشاشات و Superuser' },
    { key: 'settings', icon: getSvgIcon('settings', 16), label: 'الإعدادات وتخصيص النظام', desc: 'المظهر، الثيمات، رسائل واتساب، وبنود الضمان (متاح حصراً للمدير العام)' }
  ];

  let selectedSections = [];
  if(editUser){
    selectedSections = Array.isArray(editUser.Sections) ? [...editUser.Sections] : String(editUser.Sections||'').split(',').map(s=>s.trim()).filter(Boolean);
  } else {
    selectedSections = ['pos', 'cashdrawer'];
  }
  const initialRole = editUser ? editUser.Role : 'cashier';
  if(initialRole !== 'admin'){
    selectedSections = selectedSections.filter(s => s !== 'settings');
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:680px;max-height:92vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:16px;">
        <div>
          <h3 style="margin:0;font-size:17px;font-weight:900;display:flex;align-items:center;gap:8px;">
            <span>${isEdit ? 'تعديل المستخدم وتخصيص الصلاحيات' : 'إضافة مستخدم جديد وتخصيص الصلاحيات'}</span>
          </h3>
          <div style="font-size:12px;color:var(--ink-secondary);margin-top:3px;">
            تحديد بيانات الدخول وتعيين الشاشات والأقسام وصلاحية Superuser المباشرة للمستخدم
          </div>
        </div>
        <button class="btn btn-ghost btn-xs" id="closeUserModal">&times;</button>
      </div>

      <div class="grid2" style="margin-bottom:14px;">
        <div class="field">
          <label>اسم المستخدم (لتسجيل الدخول) *</label>
          <input id="uModalName" value="${editUser ? editUser.Name : ''}" placeholder="مثال: أحمد الكاشير" autofocus ${isEdit && editUser.Name==='admin' ? 'readonly style="background:var(--paper3);"' : ''}>
        </div>
        <div class="field">
          <label>${isEdit ? 'كلمة المرور الجديدة (اتركها فارغة للإبقاء على الحالية)' : 'كلمة المرور *'}</label>
          <input id="uModalPassword" type="password" value="" placeholder="${isEdit ? 'اتركه فارغاً للإبقاء على الحالية' : 'أدخل كلمة المرور'}">
        </div>
      </div>

      <div class="grid2" style="margin-bottom:14px;">
        <div class="field">
          <label>الدور الوظيفي / المسمى *</label>
          <select id="uModalRole">
            <option value="admin" ${initialRole==='admin'?'selected':''}>مدير عام (كامل الصلاحيات)</option>
            <option value="cashier" ${initialRole==='cashier'?'selected':''}>كاشير ومبيعات (نقطة بيع)</option>
            <option value="technician" ${initialRole==='technician'?'selected':''}>فني صيانة واستلام</option>
            <option value="accountant" ${initialRole==='accountant'?'selected':''}>محاسب مالي وإداري</option>
            <option value="storekeeper" ${initialRole==='storekeeper'?'selected':''}>أمين مخزن ومشتريات</option>
            <option value="custom" ${(!['admin','cashier','technician','accountant','storekeeper'].includes(initialRole))?'selected':''}>مخصص (تحديد يدوي للشاشات)</option>
          </select>
        </div>
        <div class="field">
          <label>ملاحظات إضافية</label>
          <input id="uModalNotes" value="${editUser ? (editUser.Notes||'') : ''}" placeholder="ملاحظات حول الموظف أو الفرع">
        </div>
      </div>

      <!-- Superuser Direct Authorization Box -->
      <div class="card" style="padding:14px 16px;background:rgba(239,68,68,0.03);border:1.5px solid #fca5a5;border-radius:var(--radius-sm);margin-bottom:16px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
          <div style="flex:1;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <span style="display:inline-flex;">${getSvgIcon('shield', 22)}</span>
              <div>
                <div style="color:#b91c1c;font-weight:900;font-size:14px;line-height:1.4;">
                  صلاحية الحذف والتعديل المباشر (Superuser Authorization)
                </div>
                <div style="color:#dc2626;font-weight:900;font-size:12.5px;margin-top:2px;">
                  (Superuser - بدون طلب موافقة من المدير)
                </div>
              </div>
            </div>
            <div style="font-size:12px;color:var(--ink-secondary);line-height:1.6;margin-top:6px;">
              تُمكّن المستخدم من حذف وتعديل وإلغاء المعاملات والعمليات مباشرة. أما إذا لم يتم تفعيلها، فعند قيامه بأي عملية حذف، سيطلب منه النظام إدخال سبب الحذف ويتم إرسال إشعار فوري لمدير النظام للموافقة أو الرفض (أو إدخال رمز المشرف).
            </div>
          </div>
          <div style="padding-top:4px;">
            <label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;background:var(--card-bg);border:1.5px solid ${isSuper ? '#ef4444' : 'var(--line)'};padding:7px 12px;border-radius:6px;user-select:none;transition:all 0.15s ease;" id="uModalSuperuserContainer">
              <input type="checkbox" id="uModalSuperuser" ${isSuper ? 'checked' : ''} ${isEdit && editUser.Name==='admin' ? 'disabled' : ''} style="width:18px;height:18px;cursor:pointer;accent-color:#dc2626;">
              <span style="font-size:12px;font-weight:800;color:${isSuper ? '#dc2626' : 'var(--ink)'};" id="uModalSuperuserLbl">
                ${isSuper ? 'مفعلة (Superuser)' : 'غير مفعلة (يتطلب إذن)'}
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- Section Permissions Box -->
      <div class="card" style="padding:14px 16px;background:var(--paper3);border:1px solid var(--line);margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
          <div>
            <h4 id="uModalSecCountTitle" style="margin:0;font-size:13.5px;font-weight:900;">الشاشات والأقسام المسموح بها (${selectedSections.length} من ${allSectionsList.length} مفعّلة)</h4>
            <div style="font-size:11.5px;color:var(--ink-secondary);margin-top:2px;">اختر الشاشات التي ستظهر للمستخدم في شاشته الرئيسية وقوائمه</div>
          </div>
          <!-- Quick Preset Buttons -->
          <div style="display:flex;gap:4px;flex-wrap:wrap;">
            <button class="btn btn-xs btn-ghost" id="presetAllBtn" type="button" title="تحديد جميع الشاشات المسموحة">الكل</button>
            <button class="btn btn-xs btn-ghost" id="presetCashierBtn" type="button">كاشير</button>
            <button class="btn btn-xs btn-ghost" id="presetTechBtn" type="button">فني</button>
            <button class="btn btn-xs btn-ghost" id="presetAccountantBtn" type="button">محاسب</button>
            <button class="btn btn-xs btn-ghost" id="presetClearBtn" type="button">إلغاء الكل</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:10px;" id="uModalSecGrid">
          ${allSectionsList.map(sec => {
            const isSettings = sec.key === 'settings';
            const isChecked = selectedSections.includes(sec.key);
            const isLockedSettings = isSettings && initialRole !== 'admin';
            return `
              <label id="secLabel_${sec.key}" style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--card-bg);border:1.5px solid ${isChecked ? 'var(--primary)' : 'var(--line)'};border-radius:var(--radius-sm);cursor:${isLockedSettings?'not-allowed':'pointer'};transition:all 0.15s ease;opacity:${isLockedSettings?'0.75':'1'};" class="${isChecked?'checked-sec-box':''}">
                <input type="checkbox" data-seckey="${sec.key}" ${isChecked ? 'checked' : ''} ${isLockedSettings ? 'disabled' : ''} style="margin-top:3px;width:18px;height:18px;cursor:${isLockedSettings?'not-allowed':'pointer'};">
                <div style="flex:1;">
                  <div style="font-weight:800;font-size:13px;color:var(--ink);display:flex;align-items:center;justify-content:space-between;gap:6px;">
                    <span>${sec.icon} ${sec.label}</span>
                    ${isSettings ? `<span class="badge" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;font-size:10px;padding:1px 5px;border-radius:4px;font-weight:800;">حصراً للمدير</span>` : ''}
                  </div>
                  <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;line-height:1.3;">
                    ${sec.desc}
                  </div>
                </div>
              </label>
            `;
          }).join('')}
        </div>
      </div>

      <div class="actions-row">
        <button class="btn btn-ghost" id="cancelUserModalBtn" type="button">إلغاء</button>
        <button class="btn btn-primary" id="saveUserModalBtn" type="button">${getSvgIcon("check", 14)} حفظ وتطبيق الصلاحيات</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const syncSecUI = ()=>{
    const curRole = overlay.querySelector('#uModalRole') ? overlay.querySelector('#uModalRole').value : initialRole;
    const isCurAdmin = curRole === 'admin';
    if(!isCurAdmin){
      selectedSections = selectedSections.filter(s => s !== 'settings');
    }
    const title = overlay.querySelector('#uModalSecCountTitle');
    if(title) title.textContent = `الشاشات والأقسام المسموح بها (${selectedSections.length} من ${allSectionsList.length} مفعّلة)`;
    allSectionsList.forEach(sec => {
      const isChecked = selectedSections.includes(sec.key);
      const chk = overlay.querySelector(`input[data-seckey="${sec.key}"]`);
      const lbl = overlay.querySelector(`#secLabel_${sec.key}`);
      if(sec.key === 'settings'){
        if(chk){
          chk.checked = isCurAdmin && isChecked;
          chk.disabled = !isCurAdmin;
        }
        if(lbl){
          lbl.style.opacity = isCurAdmin ? '1' : '0.75';
          lbl.style.cursor = isCurAdmin ? 'pointer' : 'not-allowed';
          lbl.style.borderColor = (isCurAdmin && isChecked) ? 'var(--primary)' : 'var(--line)';
          lbl.classList.toggle('checked-sec-box', isCurAdmin && isChecked);
        }
      } else {
        if(chk) chk.checked = isChecked;
        if(lbl){
          lbl.style.borderColor = isChecked ? 'var(--primary)' : 'var(--line)';
          lbl.classList.toggle('checked-sec-box', isChecked);
        }
      }
    });
  };

  overlay.querySelector('#closeUserModal').onclick = ()=>overlay.remove();
  overlay.querySelector('#cancelUserModalBtn').onclick = ()=>overlay.remove();

  // Superuser checkbox handler
  const suChk = overlay.querySelector('#uModalSuperuser');
  const suLbl = overlay.querySelector('#uModalSuperuserLbl');
  const suCont = overlay.querySelector('#uModalSuperuserContainer');
  if(suChk && suLbl){
    suChk.onchange = ()=>{
      suLbl.textContent = suChk.checked ? 'مفعلة (Superuser)' : 'غير مفعلة (يتطلب إذن)';
      suLbl.style.color = suChk.checked ? '#dc2626' : 'var(--ink)';
      if(suCont) suCont.style.borderColor = suChk.checked ? '#ef4444' : 'var(--line)';
    };
  }

  // Checkbox toggle handlers
  overlay.querySelectorAll('input[data-seckey]').forEach(chk => {
    chk.onchange = ()=>{
      const key = chk.dataset.seckey;
      const curRole = overlay.querySelector('#uModalRole').value;
      if(key === 'settings' && curRole !== 'admin'){
        showToast('قسم الإعدادات متاح حصراً للمدير العام', 'warning');
        chk.checked = false;
        return;
      }
      if(chk.checked){
        if(!selectedSections.includes(key)) selectedSections.push(key);
      } else {
        selectedSections = selectedSections.filter(k => k !== key);
      }
      syncSecUI();
    };
  });

  // Presets
  overlay.querySelector('#presetAllBtn').onclick = ()=>{
    const curRole = overlay.querySelector('#uModalRole').value;
    selectedSections = allSectionsList.map(s => s.key);
    if(curRole !== 'admin') selectedSections = selectedSections.filter(s => s !== 'settings');
    syncSecUI();
  };
  overlay.querySelector('#presetCashierBtn').onclick = ()=>{ selectedSections = ['pos', 'cashdrawer']; syncSecUI(); };
  overlay.querySelector('#presetTechBtn').onclick = ()=>{ selectedSections = ['maintenance']; syncSecUI(); };
  overlay.querySelector('#presetAccountantBtn').onclick = ()=>{ selectedSections = ['daily', 'cashdrawer', 'invoices', 'finance', 'inventory']; syncSecUI(); };
  overlay.querySelector('#presetClearBtn').onclick = ()=>{ selectedSections = []; syncSecUI(); };

  // Role dropdown auto preset
  const roleSel = overlay.querySelector('#uModalRole');
  roleSel.onchange = ()=>{
    const val = roleSel.value;
    if(val === 'admin') {
      selectedSections = allSectionsList.map(s => s.key);
      if(suChk) {
        suChk.checked = true;
        suChk.disabled = true;
        if(suLbl) { suLbl.textContent = 'مفعلة تلقائياً للمدير (Superuser)'; suLbl.style.color = '#dc2626'; }
        if(suCont) suCont.style.borderColor = '#ef4444';
      }
    } else {
      if(suChk && (!editUser || editUser.Name !== 'admin')) {
        suChk.disabled = false;
        if(suLbl) {
          suLbl.textContent = suChk.checked ? 'مفعلة (Superuser)' : 'غير مفعلة (يتطلب إذن)';
          suLbl.style.color = suChk.checked ? '#dc2626' : 'var(--ink)';
        }
        if(suCont) suCont.style.borderColor = suChk.checked ? '#ef4444' : 'var(--line)';
      }
      if(val === 'cashier') selectedSections = ['pos', 'cashdrawer'];
      else if(val === 'technician') selectedSections = ['maintenance'];
      else if(val === 'accountant') selectedSections = ['daily', 'cashdrawer', 'invoices', 'finance', 'inventory'];
      else if(val === 'storekeeper') selectedSections = ['inventory', 'pos'];
      // Ensure settings is never selected for non-admin
      selectedSections = selectedSections.filter(s => s !== 'settings');
    }
    syncSecUI();
  };

  // Save handler
  overlay.querySelector('#saveUserModalBtn').onclick = async ()=>{
    const name = overlay.querySelector('#uModalName').value.trim();
    const password = overlay.querySelector('#uModalPassword').value.trim();
    const role = overlay.querySelector('#uModalRole').value;
    const notes = overlay.querySelector('#uModalNotes').value.trim();
    const isSuperuser = role === 'admin' || (overlay.querySelector('#uModalSuperuser') && overlay.querySelector('#uModalSuperuser').checked);

    if(!name){ showToast('يرجى إدخال اسم المستخدم', 'error'); return; }
    if(!isEdit && !password){ showToast('يرجى إدخال كلمة المرور للمستخدم الجديد', 'error'); return; }
    
    // Strict RBAC: strip settings if not admin
    if(role !== 'admin'){
      selectedSections = selectedSections.filter(s => s !== 'settings');
    }

    if(!selectedSections.length){ showToast('يرجى اختيار شاشة واحدة على الأقل للمستخدم', 'error'); return; }

    const userObj = {
      ID: editUser ? editUser.ID : ('usr_' + Date.now()),
      Name: name,
      Password: password,
      Role: role,
      Superuser: isSuperuser,
      Sections: selectedSections.join(','),
      Notes: notes
    };

    try{
      await saveUserRemote(userObj);

      try {
        recordAuditLog(
          isEdit ? 'تعديل مستخدم وصلاحيات' : 'إضافة مستخدم جديد',
          'users',
          `المستخدم (${name}) - الدور: ${role} - الأقسام: [${selectedSections.join(', ')}] - Superuser: ${isSuperuser ? 'مفعل' : 'معطل'}`,
          userObj.ID,
          'معتمد'
        );
      } catch(e){}

      // If current user modified own permissions, apply live
      if(state.user && state.user.name.toLowerCase() === name.toLowerCase()){
        state.user.role = role;
        state.user.superuser = isSuperuser;
        state.user.Superuser = isSuperuser;
        state.user.sections = selectedSections;
        try{ sessionStorage.setItem('microerp_session', JSON.stringify(state.user)); }catch(e){}
      }

      showToast(`تم حفظ وتخصيص صلاحيات المستخدم (${name}) بنجاح`, 'success');
      overlay.remove();
      const main = document.getElementById('main');
      if(main) renderUsersManagementPage(main);
    }catch(e){
      try {
        recordAuditLog(
          isEdit ? 'تعديل مستخدم محلياً' : 'إضافة مستخدم محلياً',
          'users',
          `حفظ محلي للمستخدم (${name})`,
          userObj.ID,
          'مكتمل'
        );
      } catch(err){}
      showToast('تم حفظ المستخدم محلياً بنجاح', 'info');
      overlay.remove();
      const main = document.getElementById('main');
      if(main) renderUsersManagementPage(main);
    }
  };
}

function renderUsersManagementPage(main){
  if(!canUserAccessSection('users')){
    main.innerHTML = `
      <div class="card" style="text-align:center;padding:40px 20px;border-top:4px solid var(--red);">
        <div style="display:flex;justify-content:center;margin-bottom:12px;">${getSvgIcon('alert', 48)}</div>
        <h2 style="color:var(--red);margin:0 0 8px;">غير مصرح بالدخول</h2>
        <p style="color:var(--ink-secondary);font-size:14px;max-width:480px;margin:0 auto 16px;">
          عفواً، لا يمتلك حسابك صلاحية إدارة المستخدمين وتخصيص الصلاحيات. يُسمح فقط للمدير العام ومسؤولي النظام المعتمدين بالوصول لهذه الصفحة.
        </p>
        <button class="btn btn-primary" onclick="state.currentSection=null;render();">الرجوع للمركز الرئيسي</button>
      </div>
    `;
    return;
  }

  const usersList = state.users || [];
  const totalUsers = usersList.length;
  const adminUsers = usersList.filter(u => u.Role === 'admin').length;
  const superUsers = usersList.filter(u => u.Role === 'admin' || !!u.Superuser || !!u.superuser).length;
  const cashierUsers = usersList.filter(u => u.Role === 'cashier' || String(u.Sections||'').includes('pos')).length;
  const techUsers = usersList.filter(u => u.Role === 'technician' || String(u.Sections||'').includes('maintenance')).length;

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("users", 22)} إدارة المستخدمين وتخصيص صلاحيات الشاشات</h2>
        <div class="subtitle mono" style="font-size:12px;color:var(--ink-secondary);">${totalUsers} مستخدم مسجل</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" id="importTechsAsUsersBtn">${getSvgIcon("users", 13)} استيراد الفنيين كمستخدمين</button>
        <button class="btn btn-ghost btn-sm" id="exportUsersExcelBtn">${getSvgIcon("download", 13)} تصدير Excel</button>
        <button class="btn btn-primary btn-sm" id="addNewUserBtn">${getSvgIcon("plus", 13)} إضافة مستخدم جديد وتخصيص الصلاحيات</button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="stat-grid">
      <div class="stat-card blue">
        <div class="top-row"><span class="lbl">إجمالي المستخدمين المسجلين</span><div class="icon-box">${getSvgIcon("users", 18)}</div></div>
        <div class="num mono">${totalUsers}</div>
      </div>
      <div class="stat-card purple">
        <div class="top-row"><span class="lbl">مدراء بصلاحيات كاملة</span><div class="icon-box">${getSvgIcon("shield", 18)}</div></div>
        <div class="num mono">${adminUsers}</div>
      </div>
      <div class="stat-card red" style="border-color:#fca5a5;background:linear-gradient(135deg, #fff, #fef2f2);">
        <div class="top-row"><span class="lbl">صلاحية الحذف المباشر (Superuser)</span><div class="icon-box">${getSvgIcon("key", 18)}</div></div>
        <div class="num mono" style="color:#b91c1c;">${superUsers}</div>
      </div>
      <div class="stat-card green">
        <div class="top-row"><span class="lbl">مستخدمو نقطة البيع واليومية</span><div class="icon-box">${getSvgIcon("pos", 18)}</div></div>
        <div class="num mono">${cashierUsers}</div>
      </div>
      <div class="stat-card orange">
        <div class="top-row"><span class="lbl">فنيو الصيانة والمخزن</span><div class="icon-box">${getSvgIcon("tool", 18)}</div></div>
        <div class="num mono">${techUsers}</div>
      </div>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم المستخدم</th>
              <th>المسمى / الدور</th>
              <th>صلاحية Superuser (الحذف المباشر)</th>
              <th>أمان الحساب</th>
              <th>الشاشات والأقسام المسموح بها</th>
              <th>ملاحظات</th>
              <th>الإجراءات والتخصيص</th>
            </tr>
          </thead>
          <tbody>
            ${usersList.map((u, idx)=>{
              const secs = Array.isArray(u.Sections) ? u.Sections : String(u.Sections||'').split(',').map(s=>s.trim()).filter(Boolean);
              const isAdmin = u.Role === 'admin';
              const isSuper = isAdmin || !!u.Superuser || !!u.superuser;

              return `
                <tr>
                  <td class="mono" style="color:var(--ink-secondary);">${idx+1}</td>
                  <td>
                    <div style="font-weight:900;font-size:13.5px;color:var(--ink);">${u.Name}</div>
                    ${u.ID ? `<div class="mono" style="font-size:10.5px;color:var(--slate-400);">${u.ID}</div>` : ''}
                  </td>
                  <td>
                    <span class="status-badge ${isAdmin ? 'st-done' : 'st-check'}" style="font-size:11px;">
                      ${isAdmin ? 'مدير عام' : (u.Role === 'cashier' ? 'كاشير مبيعات' : (u.Role === 'technician' ? 'فني صيانة' : (u.Role === 'accountant' ? 'محاسب مالي' : (u.Role === 'storekeeper' ? 'أمين مخزن' : u.Role))))}
                    </span>
                  </td>
                  <td>
                    ${isSuper ? `
                      <span class="status-badge" style="background:#fee2e2;color:#991b1b;border:1px solid #fecaca;font-size:11px;font-weight:900;display:inline-flex;align-items:center;gap:4px;">
                        Superuser (مباشر)
                      </span>
                    ` : `
                      <span class="status-badge" style="background:var(--paper3);color:var(--ink-secondary);border:1px solid var(--line);font-size:11px;display:inline-flex;align-items:center;gap:4px;">
                        يتطلب إذن المدير
                      </span>
                    `}
                  </td>
                  <td>
                    <span class="status-badge st-done" style="font-size:11px;display:inline-flex;align-items:center;gap:4px;">
                      ${getSvgIcon('lock', 12)} مُشفَّرة ومؤمَّنة
                    </span>
                  </td>
                  <td>
                    <div style="display:flex;gap:4px;flex-wrap:wrap;max-width:360px;">
                      ${secs.length === 0 ? '<span style="color:var(--red);font-size:11px;">لا توجد شاشات</span>' : secs.map(s => {
                        const info = SECTION_INFO[s] || { label: s, icon: getSvgIcon('folder', 14) };
                        return `<span class="status-badge" style="background:var(--paper3);border:1px solid var(--line);font-size:10.5px;padding:2px 6px;">${info.icon} ${info.label}</span>`;
                      }).join('')}
                    </div>
                  </td>
                  <td style="font-size:11.5px;color:var(--ink-secondary);">${u.Notes || '-'}</td>
                  <td class="row-actions">
                    <button class="btn btn-xs btn-primary" data-useract="edit" data-uid="${u.ID||u.Name}">${getSvgIcon("edit", 13)} تخصيص الصلاحيات</button>
                    ${u.Name !== 'admin' && (!state.user || state.user.name !== u.Name) ? `
                      <button class="btn btn-xs btn-red" data-useract="del" data-uid="${u.ID||u.Name}">${getSvgIcon('trash', 13)}</button>
                    ` : ''}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Buttons
  document.getElementById('addNewUserBtn').onclick = ()=>openUserModal();
  document.getElementById('exportUsersExcelBtn').onclick = ()=>exportUsersToExcel(usersList);

  const importTechBtn = document.getElementById('importTechsAsUsersBtn');
  if(importTechBtn){
    importTechBtn.onclick = async ()=>{
      const techs = state.technicians || [];
      let addedCount = 0;
      for(const t of techs){
        if(!state.users.some(u => u.Name.toLowerCase() === t.toLowerCase())){
          // Generate a random 8-char temporary password for each auto-imported account
          const tempPass = Array.from(crypto.getRandomValues(new Uint8Array(4))).map(b => b.toString(16).padStart(2,'0')).join('');
          await saveUserRemote({
            ID: 'usr_' + Date.now() + '_' + Math.floor(Math.random()*1000),
            Name: t,
            Password: tempPass,
            Role: 'technician',
            Sections: 'maintenance',
            Notes: 'تم استيراده تلقائياً من قائمة الفنيين — يرجى تغيير كلمة المرور'
          });
          addedCount++;
        }
      }
      if(addedCount > 0){
        showToast(`تم استيراد ${addedCount} فني كحسابات مستخدمين بنجاح`, 'success');
        renderUsersManagementPage(main);
      } else {
        showToast('جميع الفنيين مسجلون بالفعل كمستخدمين', 'info');
      }
    };
  }

  // Row actions
  main.querySelectorAll('[data-useract]').forEach(btn => {
    btn.onclick = async ()=>{
      const uid = btn.dataset.uid;
      const u = state.users.find(x => (x.ID && x.ID === uid) || x.Name === uid);
      if(!u) return;
      const act = btn.dataset.useract;
      if(act === 'edit'){
        openUserModal(u);
      }
      if(act === 'del'){
        if(u.Name.toLowerCase() === 'admin'){
          showToast('لا يمكن حذف حساب المدير العام الأساسي للنظام', 'error');
          return;
        }
        if(state.user && (state.user.name.toLowerCase() === u.Name.toLowerCase() || (u.ID && state.user.id === u.ID))){
          showToast('لا يمكنك حذف حسابك الحالي أثناء تسجيل الدخول به', 'error');
          return;
        }

        requestAdminAuthorization({
          action: 'حذف مستخدم نظام',
          entityType: 'مستخدم وصلاحيات',
          entityId: u.ID || u.Name,
          entityTitle: `المستخدم (${u.Name}) [الدور: ${u.Role}]`,
          onApproved: async ()=>{
            try{
              await deleteUserRemote(u.ID || u.Name);
              try {
                recordAuditLog('حذف مستخدم', 'users', `تم حذف حساب المستخدم (${u.Name}) والدور (${u.Role}) بنجاح`, u.ID || u.Name, 'معتمد');
              } catch(e){}
              showToast(`تم حذف المستخدم (${u.Name}) بنجاح`, 'success');
              renderUsersManagementPage(main);
            }catch(e){
              showToast('تعذر الحذف: ' + e.message, 'error');
            }
          }
        });
      }
    };
  });
}

function renderUsersSectionApp(app){
  if(!canUserAccessSection('users')){
    showToast('ليس لديك صلاحية للوصول لإدارة المستخدمين والصلاحيات', 'error');
    state.currentSection = null;
    return render();
  }

  app.innerHTML = `
    <div class="sidebar">
      ${brandHtml("إدارة المستخدمين")}
      ${sectionSwitcherHtml()}
      <div class="sidebar-nav-wrap">
        <div class="nav-section">إدارة النظام</div>
        <div class="nav-item active"><span class="nav-item-icon">${getSvgIcon("users", 16)}</span><span>المستخدمين والصلاحيات</span></div>
        ${canUserAccessSection('audit') ? `<div class="nav-item" id="usersToAuditNav"><span class="nav-item-icon">${getSvgIcon("shield", 16)}</span><span>الرقابة والتصاريح</span></div>` : ''}
        ${canUserAccessSection('settings') ? `<div class="nav-item" id="usersToSettingsNav"><span class="nav-item-icon">${getSvgIcon("settings", 16)}</span><span>الإعدادات العامة</span></div>` : ''}
      </div>
      ${sidebarFootHtml()}
    </div>
    <main id="main"></main>
  `;
  const sw = document.getElementById('switchSectionBtn');
  if(sw) sw.onclick = ()=>{ state.currentSection = null; render(); };
  attachSidebarHandlers();
  const toAud = document.getElementById('usersToAuditNav');
  if(toAud) toAud.onclick = ()=>{ state.currentSection = 'audit'; render(); };
  const toSet = document.getElementById('usersToSettingsNav');
  if(toSet) toSet.onclick = ()=>{ state.currentSection = 'settings'; render(); };
  renderUsersManagementPage(document.getElementById('main'));
}

/* ---------------- Audit & Control Section Application ---------------- */
function renderAuditSectionApp(app){
  if(!canUserAccessSection('audit')){
    showToast('ليس لديك صلاحية للوصول لمركز الرقابة والتصاريح', 'error');
    state.currentSection = null;
    return render();
  }
  if(!state.auditTab) state.auditTab = 'logs';
  const pendingCount = (state.authRequests || []).filter(r => r.status === 'pending').length;
  const hasSysNav = canUserAccessSection('users') || canUserAccessSection('settings');

  app.innerHTML = `
    <div class="sidebar">
      ${brandHtml("الرقابة والتصاريح")}
      ${sectionSwitcherHtml()}
      <div class="sidebar-nav-wrap">
        <div class="nav-section">الإدارة والرقابة</div>
        <div class="nav-item ${state.auditTab==='logs'?'active':''}" id="auditNavLogs">
          <span class="nav-item-icon">${getSvgIcon("shield", 16)}</span><span>سجل الرقابة الشامل</span>
        </div>
        <div class="nav-item ${state.auditTab==='requests'?'active':''}" id="auditNavRequests">
          <span class="nav-item-icon">${getSvgIcon("lock", 16)}</span><span>تصاريح الحذف والعمليات</span>
          ${pendingCount > 0 ? `<span class="status-badge st-reject" style="font-size:11px;padding:2px 7px;">${pendingCount}</span>` : ''}
        </div>

        ${hasSysNav ? `
          <div class="nav-section">إدارة النظام</div>
          ${canUserAccessSection('users') ? `
            <div class="nav-item" id="auditToUsersNav">
              <span class="nav-item-icon">${getSvgIcon("users", 16)}</span><span>المستخدمين والصلاحيات</span>
            </div>
          ` : ''}
          ${canUserAccessSection('settings') ? `
            <div class="nav-item" id="auditToSettingsNav">
              <span class="nav-item-icon">${getSvgIcon("settings", 16)}</span><span>الإعدادات العامة</span>
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

  const navLogs = document.getElementById('auditNavLogs');
  if(navLogs) navLogs.onclick = ()=>{ state.auditTab = 'logs'; renderAuditSectionApp(app); };

  const navReqs = document.getElementById('auditNavRequests');
  if(navReqs) navReqs.onclick = ()=>{ state.auditTab = 'requests'; renderAuditSectionApp(app); };

  const toUsers = document.getElementById('auditToUsersNav');
  if(toUsers) toUsers.onclick = ()=>{ state.currentSection = 'users'; render(); };

  const toSet = document.getElementById('auditToSettingsNav');
  if(toSet) toSet.onclick = ()=>{ state.currentSection = 'settings'; render(); };

  renderAuditCenterPage(document.getElementById('main'));
  fetchServerAuditLogs().then(() => {
    const m = document.getElementById('main');
    if (m && state.currentSection === 'audit') {
      renderAuditCenterPage(m);
    }
  });
}

/* ---------------- Audit & Control Center (مركز الرقابة والتدقيق وتصاريح العمليات) ---------------- */

async function fetchServerAuditLogs(){
  if(state.user && state.user.role === 'admin'){
    try {
      const res = await apiGet('getAuditLog');
      if(res && res.ok && Array.isArray(res.logs)){
        state.auditLogs = res.logs.map(r => ({
          id: r.RowHash || ('srv_' + r.Timestamp),
          timestamp: r.Timestamp ? new Date(r.Timestamp).toISOString() : new Date().toISOString(),
          user: r.User || 'نظام',
          role: 'admin',
          action: r.Action || '',
          section: r.RefType || '',
          details: r.Details || '',
          refId: r.ReceiptID || '',
          status: 'success',
          rowHash: r.RowHash || ''
        })).reverse();
        setCache('audit_logs', state.auditLogs);
      }
    } catch(err){
      console.warn('fetchServerAuditLogs error:', err);
    }
  }
}

function exportAuditLogsToExcel(list){
  const headers = ['#', 'التاريخ والوقت', 'المستخدم', 'الدور', 'نوع العملية', 'القسم', 'البيان والتفاصيل', 'المرجع', 'الحالة'];
  const rows = (list || []).map((l, idx) => [
    idx + 1,
    new Date(l.timestamp).toLocaleString('ar-EG'),
    l.user || '',
    l.role === 'admin' ? 'مدير عام' : 'موظف',
    l.action || '',
    l.section || '',
    l.details || '',
    l.refId || '',
    l.status || ''
  ]);
  downloadCSV(`audit_logs_${new Date().toISOString().slice(0,10)}.csv`, headers, rows);
}

function renderAuditCenterPage(main){
  if(state.user && state.user.role !== 'admin'){
    main.innerHTML = `<div class="empty">عفواً: قسم الرقابة وتصاريح العمليات مقصور على المدير العام فقط.</div>`;
    return;
  }

  const activeTab = state.auditTab || 'logs'; // 'logs' | 'requests' | 'policies'
  const allLogs = state.auditLogs || [];
  const allRequests = state.authRequests || [];
  const pendingRequests = allRequests.filter(r => r.status === 'pending');

  // Filtering Logs
  let filteredLogs = allLogs;
  if(state.auditActionFilter && state.auditActionFilter !== 'all'){
    filteredLogs = filteredLogs.filter(l => (l.action||'').includes(state.auditActionFilter) || (l.section||'').includes(state.auditActionFilter));
  }
  if(state.auditUserFilter && state.auditUserFilter !== 'all'){
    filteredLogs = filteredLogs.filter(l => l.user === state.auditUserFilter);
  }
  if(state.auditDateFilter && state.auditDateFilter !== 'all'){
    const todayStr = new Date().toISOString().slice(0,10);
    if(state.auditDateFilter === 'today'){
      filteredLogs = filteredLogs.filter(l => (l.timestamp||'').slice(0,10) === todayStr);
    } else if(state.auditDateFilter === 'yesterday'){
      const y = new Date(); y.setDate(y.getDate()-1);
      const yStr = y.toISOString().slice(0,10);
      filteredLogs = filteredLogs.filter(l => (l.timestamp||'').slice(0,10) === yStr);
    } else if(state.auditDateFilter === 'week'){
      const w = new Date(); w.setDate(w.getDate()-7);
      const wStr = w.toISOString().slice(0,10);
      filteredLogs = filteredLogs.filter(l => (l.timestamp||'').slice(0,10) >= wStr);
    } else if(state.auditDateFilter === 'month'){
      const mStr = todayStr.slice(0,7) + '-01';
      filteredLogs = filteredLogs.filter(l => (l.timestamp||'').slice(0,10) >= mStr);
    }
  }
  if(state.auditSearchQ){
    const q = state.auditSearchQ.trim().toLowerCase();
    filteredLogs = filteredLogs.filter(l =>
      (l.action||'').toLowerCase().includes(q) ||
      (l.details||'').toLowerCase().includes(q) ||
      (l.user||'').toLowerCase().includes(q) ||
      (l.section||'').toLowerCase().includes(q) ||
      (l.refId||'').toLowerCase().includes(q)
    );
  }

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("shield", 22)} مركز الرقابة والتدقيق وتصاريح العمليات</h2>
        <div class="subtitle mono" style="font-size:12px;color:var(--ink-secondary);">${allLogs.length} حركة مسجلة</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" id="exportAuditExcelBtn">${getSvgIcon("download", 13)} تصدير السجل Excel</button>
        <button class="btn btn-primary btn-sm" id="refreshAuditBtn">${getSvgIcon("refresh", 13)} تحديث السجل</button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="stat-grid" style="grid-template-columns:repeat(auto-fit, minmax(210px, 1fr));gap:12px;margin-bottom:16px;">
      <div class="stat-card blue">
        <div class="top-row"><span class="lbl">إجمالي العمليات الموثقة</span><div class="icon-box">${getSvgIcon("fileText", 18)}</div></div>
        <div class="num mono">${allLogs.length}</div>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">تسجيل لحظي مشفر للأنشطة</div>
      </div>
      <div class="stat-card red" style="${pendingRequests.length>0?'border:2px solid #ef4444;background:#fef2f2;':''}">
        <div class="top-row"><span class="lbl" style="font-weight:800;color:#b91c1c;">طلبات تصاريح حذف معلقة</span><div class="icon-box" style="background:#fee2e2;color:#b91c1c;">${getSvgIcon("clock", 18)}</div></div>
        <div class="num mono" style="color:#b91c1c;">${pendingRequests.length}</div>
        <div style="font-size:11px;color:#991b1b;margin-top:2px;">${pendingRequests.length>0?'تتطلب قراراً إدارياً الآن':'لا توجد طلبات معلقة'}</div>
      </div>
      <div class="stat-card green">
        <div class="top-row"><span class="lbl">تصاريح الحذف المعتمدة</span><div class="icon-box">${getSvgIcon("check", 18)}</div></div>
        <div class="num mono">${allRequests.filter(r=>r.status==='approved').length}</div>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">حذف قانوني موثق ومصرح به</div>
      </div>
      <div class="stat-card purple">
        <div class="top-row"><span class="lbl">المستخدمين تحت الرقابة</span><div class="icon-box">${getSvgIcon("users", 18)}</div></div>
        <div class="num mono">${(state.users||[]).length}</div>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">حسابات موظفين وفنيين وكاشير</div>
      </div>
    </div>

    <!-- Sub-tabs navigation -->
    <div class="chip-group" id="auditSubTabs" style="margin-bottom:14px;border-bottom:1px solid var(--line);padding-bottom:8px;">
      <div class="chip ${activeTab==='logs'?'sel':''}" data-atab="logs" style="font-weight:800;padding:8px 16px;">
        ${getSvgIcon("fileText", 14)} سجل وتتبع العمليات الشامل (${allLogs.length})
      </div>
      <div class="chip ${activeTab==='requests'?'sel':''}" data-atab="requests" style="font-weight:800;padding:8px 16px;${pendingRequests.length>0?'border-color:#ef4444;color:#b91c1c;background:#fee2e2;':''}">
        ${getSvgIcon("lock", 14)} صندوق تصاريح وطلبات الحذف ${pendingRequests.length>0?`<span class="badge" style="background:#ef4444;color:#fff;border-radius:10px;padding:1px 6px;margin-right:4px;">${pendingRequests.length}</span>`:''}
      </div>
      <div class="chip ${activeTab==='policies'?'sel':''}" data-atab="policies" style="font-weight:800;padding:8px 16px;">
        ${getSvgIcon("settings", 14)} سياسات الرقابة والصلاحيات
      </div>
    </div>

    <!-- TAB CONTENT -->
    ${activeTab === 'logs' ? `
      <!-- Filter Bar for Audit Logs -->
      <div class="filters-bar" style="margin-bottom:12px;flex-wrap:wrap;">
        <select id="auditActionFilterSelect" style="min-width:170px;">
          <option value="all" ${state.auditActionFilter==='all'?'selected':''}>كل أنواع العمليات (الكل)</option>
          <option value="حذف" ${state.auditActionFilter==='حذف'?'selected':''}>عمليات الحذف والتصاريح</option>
          <option value="تغيير حالة" ${state.auditActionFilter==='تغيير حالة'?'selected':''}>تغيير حالات الأجهزة</option>
          <option value="دفعة" ${state.auditActionFilter==='دفعة'?'selected':''}>سداد ومقبوضات نقدية</option>
          <option value="مبيعات" ${state.auditActionFilter==='مبيعات'?'selected':''}>مبيعات الكاشير POS</option>
          <option value="مخزن" ${state.auditActionFilter==='مخزن'?'selected':''}>حركات وتعديل المخزن</option>
          <option value="فاتورة" ${state.auditActionFilter==='فاتورة'?'selected':''}>الفواتير والمطبوعات</option>
          <option value="دخول" ${state.auditActionFilter==='دخول'?'selected':''}>تسجيل الدخول والأمان</option>
        </select>

        <select id="auditUserFilterSelect" style="min-width:160px;">
          <option value="all" ${state.auditUserFilter==='all'?'selected':''}>كل المستخدمين (الكل)</option>
          ${(state.users||[]).map(u => `<option value="${escapeHtml(u.Name)}" ${state.auditUserFilter===u.Name?'selected':''}>${escapeHtml(u.Name)} (${u.Role==='admin'?'مدير':'موظف'})</option>`).join('')}
        </select>

        <div class="chip-group" id="auditDateChips">
          <div class="chip ${state.auditDateFilter==='all'?'sel':''}" data-adchip="all">كل الأوقات</div>
          <div class="chip ${state.auditDateFilter==='today'?'sel':''}" data-adchip="today">اليوم</div>
          <div class="chip ${state.auditDateFilter==='yesterday'?'sel':''}" data-adchip="yesterday">أمس</div>
          <div class="chip ${state.auditDateFilter==='week'?'sel':''}" data-adchip="week">آخر 7 أيام</div>
          <div class="chip ${state.auditDateFilter==='month'?'sel':''}" data-adchip="month">هذا الشهر</div>
        </div>

        <input id="auditSearchInp" placeholder="بحث في السجل، البيان، المرجع، أو التفاصيل..." value="${escapeHtml(state.auditSearchQ||'')}" style="flex:1;min-width:200px;">
        ${(state.auditSearchQ || state.auditActionFilter!=='all' || state.auditUserFilter!=='all' || state.auditDateFilter!=='all') ? `<button class="btn btn-ghost btn-sm" id="clearAuditFilters">إعادة ضبط</button>` : ''}
      </div>

      <!-- Logs Table -->
      <div class="card">
        ${filteredLogs.length === 0 ? '<div class="empty">لا توجد حركات مسجلة في سجل الرقابة مطابقة للفلتر الحالي.</div>' : `
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style="width:40px;">#</th>
                  <th>التاريخ والوقت</th>
                  <th>المستخدم والدور</th>
                  <th>نوع العملية</th>
                  <th>القسم</th>
                  <th>البيان والتفاصيل الكاملة</th>
                  <th>المرجع</th>
                  <th style="text-align:center;">الحالة والاعتماد</th>
                </tr>
              </thead>
              <tbody>
                ${filteredLogs.map((l, idx) => {
                  const isDelete = (l.action||'').includes('حذف');
                  const isPay = (l.action||'').includes('سداد') || (l.action||'').includes('دفعة');
                  const isSale = (l.action||'').includes('بيع') || (l.action||'').includes('POS');
                  const isStatus = (l.action||'').includes('حالة');

                  let actBadge = `<span class="badge" style="background:#f1f5f9;color:#334155;font-weight:800;border:1px solid #cbd5e1;">${l.action}</span>`;
                  if(isDelete) actBadge = `<span class="badge" style="background:#fee2e2;color:#b91c1c;font-weight:800;border:1px solid #fecaca;">${l.action}</span>`;
                  else if(isPay) actBadge = `<span class="badge" style="background:#e0f2fe;color:#0369a1;font-weight:800;border:1px solid #bae6fd;">${l.action}</span>`;
                  else if(isSale) actBadge = `<span class="badge" style="background:#dcfce7;color:#15803d;font-weight:800;border:1px solid #bbf7d0;">${l.action}</span>`;
                  else if(isStatus) actBadge = `<span class="badge" style="background:#fef3c7;color:#b45309;font-weight:800;border:1px solid #fde68a;">${l.action}</span>`;

                  return `
                    <tr>
                      <td class="mono" style="font-size:11px;color:var(--ink-secondary);font-weight:bold;">${filteredLogs.length - idx}</td>
                      <td style="font-size:11.5px;color:var(--ink-secondary);white-space:nowrap;" class="mono">${new Date(l.timestamp).toLocaleString('ar-EG', {dateStyle:'short', timeStyle:'short'})}</td>
                      <td>
                        <div style="font-weight:800;font-size:12.5px;">${escapeHtml(l.user)}</div>
                        <div style="font-size:10.5px;color:var(--ink-secondary);">${l.role==='admin'?'مدير عام':'موظف'}</div>
                      </td>
                      <td>${actBadge}</td>
                      <td><span style="font-size:11.5px;color:var(--ink-secondary);font-weight:600;">${escapeHtml(l.section||'-')}</span></td>
                      <td style="font-size:12.5px;line-height:1.4;max-width:320px;">
                        <div>${escapeHtml(l.details||'-')}</div>
                      </td>
                      <td class="mono" style="font-size:11.5px;color:var(--primary);">${escapeHtml(l.refId||'-')}</td>
                      <td style="text-align:center;">
                        <span class="status-badge ${l.status==='مرفوض'?'st-failed':(l.status==='بتصريح فوري'?'st-done':(l.status==='بانتظار الموافقة'?'st-repair':'st-check'))}" style="font-size:10.5px;">
                          ${l.status==='بتصريح فوري'?'بتصريح فوري':(l.status==='معتمد'?'معتمد':(l.status==='مرفوض'?'مرفوض':l.status||'مسجل'))}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    ` : ''}

    ${activeTab === 'requests' ? `
      <!-- PENDING REQUESTS -->
      <div style="margin-bottom:20px;">
        <h3 style="font-size:15px;margin-bottom:10px;display:flex;align-items:center;gap:8px;">
          <span>${getSvgIcon("clock", 14)} طلبات بانتظار قرار المدير العام</span>
          <span class="badge" style="background:${pendingRequests.length>0?'#ef4444':'#64748b'};color:#fff;">${pendingRequests.length} طلب</span>
        </h3>

        ${pendingRequests.length === 0 ? `
          <div class="card" style="padding:24px;text-align:center;color:var(--ink-secondary);background:var(--paper2);">
            <div style="margin-bottom:6px;">${getSvgIcon('check', 24)}</div>
            <div style="font-weight:700;font-size:13.5px;color:var(--ink);">صندوق التصاريح فارغ!</div>
            <div style="font-size:12px;margin-top:2px;">لا توجد أي طلبات حذف أو تعديلات معلقة من الموظفين حالياً.</div>
          </div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:12px;">
            ${pendingRequests.map(req => `
              <div class="card" style="border-right:5px solid #ef4444;background:#fff;padding:16px;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">
                  <div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                      <span style="display:inline-flex;">${getSvgIcon('lock', 18)}</span>
                      <span style="font-weight:900;font-size:14.5px;color:var(--ink);">${escapeHtml(req.action)}</span>
                      <span class="badge" style="background:#fee2e2;color:#b91c1c;font-weight:800;border:1px solid #fecaca;font-size:11px;">${escapeHtml(req.entityType)}</span>
                    </div>
                    <div style="font-size:13px;color:var(--ink);margin-bottom:6px;">
                      العنصر المستهدف: <b class="mono" style="color:#b91c1c;">${escapeHtml(req.entityTitle)}</b>
                    </div>
                    <div style="background:#f8fafc;border:1px dashed #cbd5e1;padding:8px 12px;border-radius:6px;margin-bottom:8px;">
                      <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">سبب طلب الحذف الموضح من الموظف:</div>
                      <div style="font-size:12.5px;color:var(--ink);font-weight:800;margin-top:2px;">"${escapeHtml(req.reason)}"</div>
                    </div>
                    <div style="font-size:11.5px;color:var(--ink-secondary);">
                      مقدم الطلب: <b>${escapeHtml(req.reqUser)}</b> • التوقيت: <span class="mono">${new Date(req.timestamp).toLocaleString('ar-EG')}</span>
                    </div>
                  </div>

                  <div style="display:flex;gap:8px;align-items:center;">
                    <button class="btn btn-green btn-sm" data-approveauth="${req.id}" style="font-weight:800;padding:8px 14px;">
                      ${getSvgIcon("check", 13)} موافقة واعتماد الحذف الآن
                    </button>
                    <button class="btn btn-red btn-sm" data-rejectauth="${req.id}" style="font-weight:800;padding:8px 14px;">
                      ${getSvgIcon("x", 13)} رفض الطلب
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- RESOLVED REQUESTS ARCHIVE -->
      <div class="card" style="margin-top:20px;">
        <h3 style="font-size:14px;margin-bottom:10px;display:flex;align-items:center;gap:6px;">${getSvgIcon("archive", 16)} أرشيف طلبات التصاريح السابقة</h3>
        ${allRequests.filter(r => r.status !== 'pending').length === 0 ? '<div class="empty">لا توجد طلبات سابقة بالأرشيف.</div>' : `
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الموظف</th>
                  <th>العملية والعنصر</th>
                  <th>سبب الحذف</th>
                  <th>القرار الإداري</th>
                  <th>المعتمد / الرافض</th>
                </tr>
              </thead>
              <tbody>
                ${allRequests.filter(r => r.status !== 'pending').map(req => `
                  <tr>
                    <td class="mono" style="font-size:11.5px;color:var(--ink-secondary);white-space:nowrap;">${cleanDate(req.timestamp)}</td>
                    <td style="font-weight:700;">${escapeHtml(req.reqUser)}</td>
                    <td>
                      <div style="font-weight:800;font-size:12.5px;">${escapeHtml(req.action)}</div>
                      <div class="mono" style="font-size:11px;color:var(--ink-secondary);">${escapeHtml(req.entityTitle)}</div>
                    </td>
                    <td style="font-size:12px;color:var(--ink);">${escapeHtml(req.reason)}</td>
                    <td>
                      <span class="status-badge ${req.status==='approved'?'st-done':'st-failed'}">
                        ${req.status==='approved'?'تمت الموافقة والحذف':'تم الرفض'}
                      </span>
                    </td>
                    <td style="font-size:12px;">${escapeHtml(req.resolvedBy||'المدير العام')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    ` : ''}

    ${activeTab === 'policies' ? `
      <!-- Security Policies Overview -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:14px;">
        <div class="card" style="border-top:4px solid #16a34a;">
          <h3 style="font-size:14.5px;margin-bottom:8px;color:#15803d;display:flex;align-items:center;gap:6px;">
            <span>${getSvgIcon("lock", 16)}</span><span>سياسة الحذف الصارمة (Strict Delete Control)</span>
          </h3>
          <p style="font-size:12.5px;line-height:1.6;color:var(--ink-secondary);margin:0 0 10px;">
            مفعلة تلقائياً: لا يمكن لأي موظف عادي حذف إيصال صيانة، أو فاتورة، أو صنف مخزن، أو حركة مالية إلا بـ <b>تصريح فوري بكلمة مرور المدير</b> أو <b>تقديم طلب تصريح للإدارة</b> للمراجعة في هذا القسم.
          </p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:8px 12px;border-radius:6px;font-size:12px;color:#166534;font-weight:700;">
            النظام مؤمّن ضد الحذف العشوائي أو غير المعتمد
          </div>
        </div>

        <div class="card" style="border-top:4px solid #0284c7;">
          <h3 style="font-size:14.5px;margin-bottom:8px;color:#0369a1;display:flex;align-items:center;gap:6px;">
            <span>${getSvgIcon("wallet", 16)}</span><span>ضبط مدفوعات الصيانة ومنع الزيادة</span>
          </h3>
          <p style="font-size:12.5px;line-height:1.6;color:var(--ink-secondary);margin:0 0 10px;">
            مفعلة تلقائياً: يمنع النظام تماماً إدخال أو سداد أي مبلغ أكبر من المبلغ المتبقي على حساب الجهاز. كما يتم التحقق عند إدخال إيصال جديد من عدم تجاوز العربون للتكلفة الكلية.
          </p>
          <div style="background:#f0f9ff;border:1px solid #bae6fd;padding:8px 12px;border-radius:6px;font-size:12px;color:#075985;font-weight:700;">
            منع الأرصدة السالبة والأخطاء الحسابية
          </div>
        </div>

        <div class="card" style="border-top:4px solid #6366f1;">
          <h3 style="font-size:14.5px;margin-bottom:8px;color:#4338ca;display:flex;align-items:center;gap:6px;">
            <span>${getSvgIcon("daily", 16)}</span><span>فصل حسابات اليومية والخزينة</span>
          </h3>
          <p style="font-size:12.5px;line-height:1.6;color:var(--ink-secondary);margin:0 0 10px;">
            مفعلة تلقائياً: يتم فصل إيرادات الصيانة (ح/ 4101) عن مبيعات الكاشير POS (ح/ 4102) في بطاقات إحصائية مستقلة وشرائح تصفية وعمود حسابات صريح، مع منع ازدواجية الفواتير.
          </p>
          <div style="background:#e0e7ff;border:1px solid #c7d2fe;padding:8px 12px;border-radius:6px;font-size:12px;color:#3730a3;font-weight:700;">
            تقارير تقفيل نقدية منفصلة ودقيقة 100%
          </div>
        </div>

        <div class="card" style="border-top:4px solid #dc2626;">
          <h3 style="font-size:14.5px;margin-bottom:8px;color:#b91c1c;display:flex;align-items:center;gap:6px;">
            <span>${getSvgIcon("shield", 16)}</span><span>صلاحية Superuser (بدون طلب موافقة من المدير)</span>
          </h3>
          <p style="font-size:12.5px;line-height:1.6;color:var(--ink-secondary);margin:0 0 10px;">
            تُمكّن المستخدم من حذف وتعديل وإلغاء المعاملات والعمليات مباشرة. أما إذا لم يتم تفعيلها، فعند قيامه بأي عملية حذف، سيطلب منه النظام إدخال سبب الحذف ويتم إرسال إشعار فوري لمدير النظام للموافقة أو الرفض (أو إدخال رمز المشرف).
          </p>
          <div style="background:#fef2f2;border:1px solid #fecaca;padding:8px 12px;border-radius:6px;font-size:12px;color:#991b1b;font-weight:700;">
            تمنح للمستخدمين الموثوقين من شاشة إدارة المستخدمين
          </div>
        </div>
      </div>
    ` : ''}
  `;

  // Bindings
  document.querySelectorAll('#auditSubTabs .chip').forEach(c => {
    c.onclick = ()=>{
      state.auditTab = c.dataset.atab;
      renderAuditCenterPage(main);
    };
  });

  const actFilterSel = document.getElementById('auditActionFilterSelect');
  if(actFilterSel) actFilterSel.onchange = (e)=>{ state.auditActionFilter = e.target.value; renderAuditCenterPage(main); };

  const userFilterSel = document.getElementById('auditUserFilterSelect');
  if(userFilterSel) userFilterSel.onchange = (e)=>{ state.auditUserFilter = e.target.value; renderAuditCenterPage(main); };

  document.querySelectorAll('#auditDateChips .chip').forEach(c => {
    c.onclick = ()=>{
      state.auditDateFilter = c.dataset.adchip;
      renderAuditCenterPage(main);
    };
  });

  const searchInp = document.getElementById('auditSearchInp');
  if(searchInp) searchInp.oninput = (e)=>{ state.auditSearchQ = e.target.value; renderAuditCenterPage(main); };

  const clearBtn = document.getElementById('clearAuditFilters');
  if(clearBtn) clearBtn.onclick = ()=>{
    state.auditActionFilter = 'all';
    state.auditUserFilter = 'all';
    state.auditDateFilter = 'all';
    state.auditSearchQ = '';
    renderAuditCenterPage(main);
  };

  const refreshBtn = document.getElementById('refreshAuditBtn');
  if(refreshBtn) refreshBtn.onclick = async ()=>{
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'جارٍ التحديث...';
    await fetchServerAuditLogs();
    renderAuditCenterPage(main);
  };

  const expBtn = document.getElementById('exportAuditExcelBtn');
  if(expBtn) expBtn.onclick = ()=> exportAuditLogsToExcel(filteredLogs);

  // Approve Authorization Request
  main.querySelectorAll('[data-approveauth]').forEach(btn => {
    btn.onclick = async ()=>{
      const reqId = btn.dataset.approveauth;
      const req = (state.authRequests||[]).find(x => x.id === reqId);
      if(!req) return;

      if(!confirm(`هل أنت متأكد من اعتماد طلب الحذف وحذف (${req.entityTitle}) نهائياً من النظام؟`)) return;

      btn.disabled = true; btn.textContent = 'جارٍ التنفيذ...';
      try {
        // Execute the actual deletion based on entityType
        if(req.entityType.includes('إيصال')){
          await deleteReceiptRemote(req.entityId);
          state.receipts = (state.receipts||[]).filter(x => x.id !== req.entityId);
        } else if(req.entityType.includes('فاتورة')){
          await deleteInvoiceRemote(req.entityId);
          state.invoices = (state.invoices||[]).filter(x => x.ID !== req.entityId);
        } else if(req.entityType.includes('مخزن') || req.entityType.includes('صنف')){
          await deleteInventoryItemRemote(req.entityId);
          state.inventory = (state.inventory||[]).filter(x => x.ID !== req.entityId);
        } else if(req.entityType.includes('مصروف') || req.entityType.includes('يومية')){
          await deleteExpenseRemote(req.entityId);
          state.expenses = (state.expenses||[]).filter(x => x.ID !== req.entityId);
        }

        req.status = 'approved';
        req.resolvedBy = state.user.name;
        req.resolvedAt = new Date().toISOString();
        setCache('auth_requests', state.authRequests);
        try { localStorage.setItem('microerp_auth_requests', JSON.stringify(state.authRequests)); } catch(e){}

        recordAuditLog('اعتماد تصريح حذف', req.entityType, `تم اعتماد حذف (${req.entityTitle}) المطلوب من الموظف (${req.reqUser}) بواسطة المدير (${state.user.name})`, req.entityId, 'معتمد');

        showToast(`تم اعتماد الطلب وحذف (${req.entityTitle}) بنجاح`, 'success');
        renderAuditCenterPage(main);
      } catch(err){
        showToast('تعذر تنفيذ الحذف: ' + err.message, 'error');
        btn.disabled = false; btn.textContent = '${getSvgIcon("check", 13)} موافقة واعتماد الحذف الآن';
      }
    };
  });

  // Reject Authorization Request
  main.querySelectorAll('[data-rejectauth]').forEach(btn => {
    btn.onclick = async ()=>{
      const reqId = btn.dataset.rejectauth;
      const req = (state.authRequests||[]).find(x => x.id === reqId);
      if(!req) return;

      if(!confirm(`هل أنت متأكد من رغبتك في رفض طلب حذف (${req.entityTitle})؟`)) return;

      req.status = 'rejected';
      req.resolvedBy = state.user.name;
      req.resolvedAt = new Date().toISOString();
      setCache('auth_requests', state.authRequests);
      try { localStorage.setItem('microerp_auth_requests', JSON.stringify(state.authRequests)); } catch(e){}

      recordAuditLog('رفض تصريح حذف', req.entityType, `تم رفض طلب حذف (${req.entityTitle}) المطلوب من الموظف (${req.reqUser}) بواسطة المدير (${state.user.name})`, req.entityId, 'مرفوض');

      showToast(`تم رفض طلب الحذف`, 'info');
      renderAuditCenterPage(main);
    };
  });
}
