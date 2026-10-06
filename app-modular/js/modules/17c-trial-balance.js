/* ---------------- Trial Balance (ميزان المراجعة) ---------------- */
function renderTrialBalance(main){
  let grandInitDebit = 0;
  let grandInitCredit = 0;
  let grandMoveDebit = 0;
  let grandMoveCredit = 0;
  let grandClosingDebit = 0;
  let grandClosingCredit = 0;

  const rows = state.accounts.map(acc=>{
    const stats = getAccountStats(acc.Code);
    const hasChildren = state.accounts.some(a => String(a.ParentCode) === String(acc.Code));
    if(!hasChildren){
      grandInitDebit += stats.openingDebit;
      grandInitCredit += stats.openingCredit;
      grandMoveDebit += stats.totalDebit;
      grandMoveCredit += stats.totalCredit;
      grandClosingDebit += stats.closingDebit;
      grandClosingCredit += stats.closingCredit;
    }
    return { acc, stats, hasChildren };
  });

  grandInitDebit = round2(grandInitDebit);
  grandInitCredit = round2(grandInitCredit);
  grandMoveDebit = round2(grandMoveDebit);
  grandMoveCredit = round2(grandMoveCredit);
  grandClosingDebit = round2(grandClosingDebit);
  grandClosingCredit = round2(grandClosingCredit);

  const initDiff = round2(Math.abs(grandInitDebit - grandInitCredit));
  const moveDiff = round2(Math.abs(grandMoveDebit - grandMoveCredit));
  const closingDiff = round2(Math.abs(grandClosingDebit - grandClosingCredit));

  // F8: Balance is measured strictly on ending balances and movements using === 0 after round2
  const isBalanced = closingDiff === 0 && moveDiff === 0;

  // F1: Ledger verification calculation across all journal entries
  let totalJournalDebits = 0;
  let totalJournalCredits = 0;
  (state.journalEntries || []).forEach(je => {
    const lines = Array.isArray(je.Lines) ? je.Lines : (typeof je.LinesJSON === 'string' ? JSON.parse(je.LinesJSON || '[]') : []);
    lines.forEach(l => {
      totalJournalDebits += Number(l.Debit || 0);
      totalJournalCredits += Number(l.Credit || 0);
    });
  });
  totalJournalDebits = round2(totalJournalDebits);
  totalJournalCredits = round2(totalJournalCredits);
  const journalDiff = round2(Math.abs(totalJournalDebits - totalJournalCredits));
  const isJournalBalanced = journalDiff === 0;

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("scale", 22)} ميزان المراجعة (Trial Balance)</h2>
        <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">
          ميزان المراجعة بالأرصدة والمجاميع — يطابق الأرصدة الافتتاحية وحركات الأستاذ العام والأرصدة الختامية للمركز المالي
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost btn-sm" id="exportTrialExcelBtn">${getSvgIcon("download", 14)} تصدير ميزان المراجعة Excel</button>
        <button class="btn btn-primary btn-sm" id="openOpeningBalTrialBtn">${getSvgIcon("scale", 14)} الأرصدة الافتتاحية</button>
      </div>
    </div>

    <!-- Ledger Verification Banner (F1) -->
    <div class="card" style="padding:12px 18px;margin-bottom:14px;border-radius:8px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;background:${isJournalBalanced ? '#f0fdf4' : '#fef2f2'};border:1.5px solid ${isJournalBalanced ? '#86efac' : '#fca5a5'};color:${isJournalBalanced ? '#166534' : '#991b1b'};">
      <div style="display:flex;align-items:center;gap:10px;font-size:13px;font-weight:800;">
        <span>${isJournalBalanced ? getSvgIcon("checkCircle", 18) : getSvgIcon("alertTriangle", 18)}</span>
        <span>مطابقة الدفتر: إجمالي مدين القيود = <b class="mono font-bold">${totalJournalDebits.toLocaleString()} ج.م</b> · إجمالي دائن القيود = <b class="mono font-bold">${totalJournalCredits.toLocaleString()} ج.م</b> · الفرق = <b class="mono font-bold">${journalDiff.toLocaleString()} ج.م</b> ${isJournalBalanced ? '(الدفتر متزن ومطابق للقيد المزدوج)' : '(تنبيه: يوجد عدم اتزان في قيود الدفتر العام!)'}</span>
      </div>
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="btn btn-xs ${isJournalBalanced ? 'btn-ghost' : 'btn-red'}" id="reconcileTrialLedgerBtn" title="إعادة مطابقة وترحيل كافة القيود التاريخية الناقصة لدفتر الأستاذ">
          ${getSvgIcon("sync", 13)} تحديث وترحيل قيود الدفتر
        </button>
      </div>
    </div>

    <!-- F8: Rounding & Imbalance Report Alert if any difference exists -->
    ${(!isBalanced || initDiff > 0) ? `
      <div class="card" style="background:#fffbeb;border:1.5px solid #fde68a;padding:12px 16px;border-radius:8px;margin-bottom:14px;color:#92400e;">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;align-items:center;gap:8px;font-weight:800;font-size:13px;">
            <span>${getSvgIcon('alertTriangle', 16)}</span>
            <span>تقرير فروق التقريب والاتزان في ميزان المراجعة:</span>
          </div>
          <div style="display:flex;gap:12px;font-size:12px;font-weight:700;">
            <span>فرق الأرصدة الافتتاحية: <b class="mono">${initDiff.toLocaleString()} ج.م</b></span>
            <span>فرق حركات الفترة: <b class="mono">${moveDiff.toLocaleString()} ج.م</b></span>
            <span>فرق الأرصدة الختامية: <b class="mono">${closingDiff.toLocaleString()} ج.م</b></span>
          </div>
        </div>
        <div style="font-size:11.5px;color:#78350f;margin-top:6px;">
          ${initDiff > 0 ? '• الأرصدة الافتتاحية غير متوازنة: يرجى فتح شاشة "الأرصدة الافتتاحية" وموازنة الفرق في حساب تسوية البداية (3104).<br>' : ''}
          ${moveDiff > 0 ? '• يوجد قيد غير متزن في دفتر الأستاذ: يرجى الضغط على زر "تحديث وترحيل قيود الدفتر" لإعادة المزامنة.<br>' : ''}
        </div>
      </div>
    ` : ''}

    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:10%;">كود الحساب</th>
              <th style="width:22%;">اسم الحساب</th>
              <th style="width:13%;">النوع / الطبيعة</th>
              <th style="width:13%;text-align:center;">رصيد أول المدة</th>
              <th style="width:11%;text-align:center;">إجمالي المدين</th>
              <th style="width:11%;text-align:center;">إجمالي الدائن</th>
              <th style="width:10%;text-align:center;">مدين ختامي</th>
              <th style="width:10%;text-align:center;">دائن ختامي</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r=>`<tr style="${r.hasChildren ? 'background:var(--paper2);font-weight:700;' : ''}">
              <td class="mono font-bold">${r.acc.Code}</td>
              <td><b>${escapeHtml(r.acc.Name)}</b> ${r.hasChildren ? '<span class="badge" style="font-size:10px;margin-right:4px;">تجميعي</span>' : ''}</td>
              <td>
                <span class="nature-pill ${r.stats.nature==='مدين'?'debit':'credit'}">${r.stats.nature}</span>
                <span style="font-size:10.5px;color:var(--ink-secondary);">${r.acc.Type}</span>
              </td>
              <td class="mono font-bold" style="text-align:center;">
                ${r.stats.openingBalance !== 0 ? r.stats.openingBalance.toLocaleString() + ' ج.م' : '<span style="color:var(--ink-secondary);">-</span>'}
              </td>
              <td class="mono" style="color:var(--blue);text-align:center;">
                ${r.stats.totalDebit ? r.stats.totalDebit.toLocaleString() + ' ج.م' : '<span style="color:var(--ink-secondary);">-</span>'}
              </td>
              <td class="mono" style="color:var(--green);text-align:center;">
                ${r.stats.totalCredit ? r.stats.totalCredit.toLocaleString() + ' ج.م' : '<span style="color:var(--ink-secondary);">-</span>'}
              </td>
              <td class="mono font-bold" style="color:var(--blue);text-align:center;">
                ${r.stats.closingDebit ? r.stats.closingDebit.toLocaleString() + ' ج.م' : '<span style="color:var(--ink-secondary);">-</span>'}
              </td>
              <td class="mono font-bold" style="color:var(--green);text-align:center;">
                ${r.stats.closingCredit ? r.stats.closingCredit.toLocaleString() + ' ج.م' : '<span style="color:var(--ink-secondary);">-</span>'}
              </td>
            </tr>`).join('')}
          </tbody>
          <tfoot>
            <tr style="background:var(--paper3);font-weight:900;font-size:12.5px;">
              <td colspan="3" style="text-align:right;">الإجمالي العام لميزان المراجعة (الحسابات الفرعية القابلة للقيد):</td>
              <td class="mono font-bold" style="text-align:center;">
                <div style="font-size:10px;color:var(--ink-secondary);">مدين: ${grandInitDebit.toLocaleString()} | دائن: ${grandInitCredit.toLocaleString()}</div>
                <div>${initDiff === 0 ? '<span class="status-badge st-done" style="font-size:9.5px;padding:1px 5px;">افتتاحي متزن</span>' : `<span class="status-badge st-red" style="font-size:9.5px;padding:1px 5px;">فرق ${initDiff.toLocaleString()}</span>`}</div>
              </td>
              <td class="mono font-bold" style="color:var(--blue);text-align:center;">${grandMoveDebit.toLocaleString()} ج.م</td>
              <td class="mono font-bold" style="color:var(--green);text-align:center;">${grandMoveCredit.toLocaleString()} ج.م</td>
              <td class="mono font-bold" style="color:var(--blue);text-align:center;">${grandClosingDebit.toLocaleString()} ج.م</td>
              <td class="mono font-bold" style="color:var(--green);text-align:center;">${grandClosingCredit.toLocaleString()} ج.م</td>
            </tr>
            <tr style="background:${isBalanced ? '#f0fdf4' : '#fef2f2'};font-weight:800;font-size:12.5px;border-top:2px solid ${isBalanced ? '#86efac' : '#fca5a5'};color:${isBalanced ? '#166534' : '#991b1b'};">
              <td colspan="4" style="text-align:right;">
                <span>${isBalanced ? getSvgIcon("checkCircle", 16) : getSvgIcon("alertTriangle", 16)}</span>
                <span>${isBalanced ? 'ميزان المراجعة متزن تماماً على الأرصدة الختامية وحركات الدفتر العام (فرق التقريب = 0.00 ج.م)' : `تنبيه: ميزان المراجعة غير متزن! (فرق الأرصدة الختامية = ${closingDiff.toLocaleString()} ج.م · فرق حركات الدفتر = ${moveDiff.toLocaleString()} ج.م)`}</span>
              </td>
              <td colspan="2" style="text-align:center;">
                ${moveDiff === 0 ? '<span class="status-badge st-done">حركات متزنة (0 فرق)</span>' : `<span class="status-badge st-red">فرق حركات (${moveDiff.toLocaleString()} ج.م)</span>`}
              </td>
              <td colspan="2" style="text-align:center;">
                ${closingDiff === 0 ? '<span class="status-badge st-done">أرصدة متزنة (0 فرق)</span>' : `<span class="status-badge st-red">فرق أرصدة (${closingDiff.toLocaleString()} ج.م)</span>`}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `;

  const recTrialBtn = document.getElementById('reconcileTrialLedgerBtn');
  if(recTrialBtn){
    recTrialBtn.onclick = () => {
      if(typeof reconcileHistoricalJournalEntries === 'function') reconcileHistoricalJournalEntries();
      showToast('تم فحص وترحيل قيود دفتر الأستاذ العام بنجاح', 'success');
      renderTrialBalance(main);
    };
  }

  const opBalBtn = document.getElementById('openOpeningBalTrialBtn');
  if(opBalBtn){
    opBalBtn.onclick = () => openOpeningBalancesModal();
  }

  document.getElementById('exportTrialExcelBtn').onclick = ()=>{
    const headers = ['كود الحساب','اسم الحساب','النوع','الطبيعة','رصيد أول المدة','إجمالي المدين','إجمالي الدائن','مدين ختامي','دائن ختامي','صافي الرصيد'];
    const dataRows = rows.map(r=>[
      r.acc.Code, `"${r.acc.Name}"`, r.acc.Type, r.stats.nature, r.stats.openingBalance, r.stats.totalDebit, r.stats.totalCredit, r.stats.closingDebit, r.stats.closingCredit, r.stats.netBalance
    ]);
    downloadCSV(`Trial_Balance_${new Date().toISOString().slice(0,10)}.csv`, headers, dataRows);
  };
}

/* ---------------- F8: Opening Balances Modal Engine (شاشة الأرصدة الافتتاحية) ---------------- */
function openOpeningBalancesModal(){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '12000';

  const accounts = state.accounts || [];
  const isParent = new Set();
  accounts.forEach(a => { if(a.ParentCode) isParent.add(String(a.ParentCode).trim()); });

  // Get all leaf accounts under 1 (Assets), 2 (Liabilities), 3 (Equity)
  const leafAccounts = accounts.filter(a => {
    const code = String(a.Code).trim();
    const isLeaf = !isParent.has(code);
    const root = code[0];
    return isLeaf && (root === '1' || root === '2' || root === '3');
  }).sort((a,b) => String(a.Code).localeCompare(String(b.Code), undefined, {numeric:true}));

  // Find existing Opening_Balance journal entry if any
  const existingOpeningEntry = (state.journalEntries || []).find(je => je.ReferenceType === 'Opening_Balance');
  const existingLines = existingOpeningEntry
    ? (Array.isArray(existingOpeningEntry.Lines) ? existingOpeningEntry.Lines : (typeof existingOpeningEntry.LinesJSON === 'string' ? JSON.parse(existingOpeningEntry.LinesJSON || '[]') : []))
    : [];

  const defaultDate = existingOpeningEntry ? (existingOpeningEntry.Date || `${new Date().getFullYear()}-01-01`) : `${new Date().getFullYear()}-01-01`;

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:860px;max-height:92vh;display:flex;flex-direction:column;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:14px;">
        <div>
          <h3 style="margin:0;font-size:17px;font-weight:900;color:var(--ink);display:flex;align-items:center;gap:8px;">
            <span>${getSvgIcon('scale', 20)}</span>
            <span>إدخال واعتماد الأرصدة الافتتاحية (Opening Balances)</span>
          </h3>
          <div style="font-size:12px;color:var(--ink-secondary);margin-top:4px;">
            تسجيل قيد افتتاحي متوازن (Dr الأصول / Cr الخصوم وحقوق الملكية) لضمان اتزان ميزان المراجعة والمركز المالي
          </div>
        </div>
        <button class="btn btn-ghost btn-xs" id="closeOpBalModal" style="font-size:20px;line-height:1;" aria-label="إغلاق">&times;</button>
      </div>

      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;background:var(--paper2);padding:10px 14px;border-radius:6px;border:1px solid var(--line);flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:8px;">
          <label style="font-size:12px;font-weight:800;color:var(--ink);">تاريخ القيد الافتتاحي:</label>
          <input type="date" id="opBalDate" value="${defaultDate}" style="padding:4px 8px;border:1px solid var(--line);border-radius:4px;font-size:12.5px;" class="mono font-bold">
        </div>
        <div style="font-size:11.5px;color:var(--ink-secondary);flex:1;">
          سيتم إنشاء قيد يومية متوازن تلقائياً وتصفير الأرصدة المباشرة لتوحيد مرجعية الدفتر العام.
        </div>
      </div>

      <!-- Account list -->
      <div style="flex:1;overflow-y:auto;border:1px solid var(--line);border-radius:6px;margin-bottom:14px;">
        <table style="width:100%;border-collapse:collapse;">
          <thead style="position:sticky;top:0;background:var(--paper3);z-index:2;border-bottom:1px solid var(--line);">
            <tr>
              <th style="padding:8px 10px;text-align:right;width:15%;">كود الحساب</th>
              <th style="padding:8px 10px;text-align:right;width:35%;">اسم الحساب والفرع</th>
              <th style="padding:8px 10px;text-align:center;width:15%;">الطبيعة</th>
              <th style="padding:8px 10px;text-align:center;width:35%;">الرصيد الافتتاحي (ج.م)</th>
            </tr>
          </thead>
          <tbody>
            ${leafAccounts.map(acc => {
              const nature = acc.Nature || 'مدين';
              const matchedLine = existingLines.find(l => String(l.AccountCode).trim() === String(acc.Code).trim());
              let startVal = 0;
              if (matchedLine) {
                startVal = nature === 'مدين' ? Number(matchedLine.Debit || 0) : Number(matchedLine.Credit || 0);
              } else {
                startVal = Number(acc.Balance || 0);
              }
              const root = String(acc.Code)[0];
              const rootName = root === '1' ? 'الأصول' : (root === '2' ? 'الخصوم' : 'حقوق الملكية');

              return `
                <tr style="border-bottom:1px solid var(--line);">
                  <td class="mono font-bold" style="padding:6px 10px;">${acc.Code}</td>
                  <td style="padding:6px 10px;">
                    <b>${escapeHtml(acc.Name)}</b>
                    <span style="font-size:10.5px;color:var(--ink-secondary);margin-right:4px;">(${rootName})</span>
                  </td>
                  <td style="padding:6px 10px;text-align:center;">
                    <span class="nature-pill ${nature==='مدين'?'debit':'credit'}">${nature}</span>
                  </td>
                  <td style="padding:6px 10px;text-align:center;">
                    <input type="number" step="any" min="0" class="mono font-bold op-bal-input"
                      data-code="${acc.Code}"
                      data-name="${escapeHtml(acc.Name)}"
                      data-nature="${nature}"
                      value="${startVal || ''}"
                      placeholder="0"
                      style="width:90%;padding:5px 8px;border:1px solid var(--line);border-radius:4px;text-align:center;font-size:13px;">
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Live Balance Summary Box -->
      <div id="opBalSummaryBox" style="background:var(--paper2);border:1.5px solid var(--line);border-radius:8px;padding:12px 16px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div style="display:flex;align-items:center;gap:18px;font-size:12.5px;">
          <div>مجموع المدين (الأصول): <b id="opTotalDebit" class="mono font-bold" style="color:var(--blue);font-size:14px;">0 ج.م</b></div>
          <div>مجموع الدائن (الخصوم وحقوق الملكية): <b id="opTotalCredit" class="mono font-bold" style="color:var(--green);font-size:14px;">0 ج.م</b></div>
          <div>الفرق: <b id="opDiff" class="mono font-bold" style="font-size:14px;">0 ج.م</b></div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span id="opBalanceStatusBadge" class="status-badge st-done">متزن</span>
          <button type="button" class="btn btn-ghost btn-xs" id="autoBalanceOpBtn" style="font-size:11px;" title="موازنة الفرق تلقائياً في حساب تسوية الأرصدة الافتتاحية (3104)">
            ${getSvgIcon("sync", 12)} موازنة في تسوية الافتتاح (3104)
          </button>
        </div>
      </div>

      <!-- Actions -->
      <div style="display:flex;justify-content:flex-end;gap:10px;">
        <button class="btn btn-ghost" id="cancelOpBalBtn">إلغاء</button>
        <button class="btn btn-primary" id="saveOpBalBtn">${getSvgIcon("check", 14)} اعتماد وترحيل القيد الافتتاحي</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#closeOpBalModal').onclick = () => overlay.remove();
  overlay.querySelector('#cancelOpBalBtn').onclick = () => overlay.remove();

  const inputs = overlay.querySelectorAll('.op-bal-input');
  const totalDebitEl = overlay.querySelector('#opTotalDebit');
  const totalCreditEl = overlay.querySelector('#opTotalCredit');
  const diffEl = overlay.querySelector('#opDiff');
  const statusEl = overlay.querySelector('#opBalanceStatusBadge');

  function recalc(){
    let dr = 0;
    let cr = 0;
    inputs.forEach(inp => {
      const val = parseFloat(inp.value) || 0;
      if(val > 0){
        if(inp.dataset.nature === 'مدين') dr += val;
        else cr += val;
      }
    });
    dr = round2(dr);
    cr = round2(cr);
    const diff = round2(Math.abs(dr - cr));

    totalDebitEl.textContent = dr.toLocaleString() + ' ج.م';
    totalCreditEl.textContent = cr.toLocaleString() + ' ج.م';
    diffEl.textContent = diff.toLocaleString() + ' ج.م';

    if(diff === 0){
      statusEl.className = 'status-badge st-done';
      statusEl.textContent = 'متزن تماماً للقيد المزدوج';
      diffEl.style.color = 'var(--green)';
    } else {
      statusEl.className = 'status-badge st-red';
      statusEl.textContent = `غير متزن (الفرق: ${diff.toLocaleString()} ج.م)`;
      diffEl.style.color = 'var(--red)';
    }
    return { dr, cr, diff };
  }

  inputs.forEach(inp => { inp.oninput = recalc; });
  recalc();

  overlay.querySelector('#autoBalanceOpBtn').onclick = () => {
    const { dr, cr } = recalc();
    const diff = round2(dr - cr);
    const targetInp = Array.from(inputs).find(i => i.dataset.code === '3104') || Array.from(inputs).find(i => i.dataset.code === '3101');
    if(!targetInp){
      showToast('لم يتم العثور على حساب تسوية 3104 أو 3101', 'error');
      return;
    }
    const currentVal = parseFloat(targetInp.value) || 0;
    const newVal = Math.max(0, round2(currentVal + diff));
    targetInp.value = newVal || '';
    recalc();
    showToast(`تمت موازنة الفرق (${diff.toLocaleString()} ج.م) في حساب ${targetInp.dataset.name}`, 'success');
  };

  overlay.querySelector('#saveOpBalBtn').onclick = async () => {
    const { dr, cr, diff } = recalc();
    if(diff !== 0){
      showToast(`لا يمكن ترحيل القيد الافتتاحي وهو غير متزن! الفرق = ${diff.toLocaleString()} ج.م. اضغط على زر موازنة الفرق لتسويته.`, 'error');
      return;
    }
    if(dr === 0 && cr === 0){
      showToast('يرجى إدخال مبالغ الأرصدة الافتتاحية قبل الحفظ.', 'warning');
      return;
    }

    const opDate = overlay.querySelector('#opBalDate').value || new Date().toISOString().slice(0, 10);
    const lines = [];
    inputs.forEach(inp => {
      const val = parseFloat(inp.value) || 0;
      if(val > 0){
        const code = inp.dataset.code;
        const name = inp.dataset.name;
        const nature = inp.dataset.nature;
        if(nature === 'مدين'){
          lines.push({ AccountCode: code, AccountName: name, Debit: val, Credit: 0, Notes: 'رصيد افتتاحي مدين' });
        } else {
          lines.push({ AccountCode: code, AccountName: name, Debit: 0, Credit: val, Notes: 'رصيد افتتاحي دائن' });
        }
      }
    });

    const desc = `القيد الافتتاحي للأرصدة الافتتاحية للمنشأة بتاريخ ${opDate}`;
    const refId = `OPENING_${opDate.replace(/-/g, '')}`;

    try{
      if(existingOpeningEntry){
        existingOpeningEntry.Date = opDate;
        existingOpeningEntry.Description = desc;
        existingOpeningEntry.Lines = lines;
        existingOpeningEntry.LinesJSON = JSON.stringify(lines);
        existingOpeningEntry.TotalDebit = dr;
        existingOpeningEntry.TotalCredit = cr;
        existingOpeningEntry.By = state.user ? state.user.name : 'مدير';
        await saveJournalEntryRemote(existingOpeningEntry);
      } else {
        await recordAutoJournalEntry(desc, 'Opening_Balance', refId, lines);
      }

      // F8: Zero out direct acc.Balance so the journal entry is the single source of truth
      (state.accounts || []).forEach(a => { a.Balance = 0; });
      setCache('accounts', state.accounts);
      invalidateAccountStatsCache();

      recordAuditLog('الأرصدة الافتتاحية', 'الحسابات', `تم اعتماد وترحيل القيد الافتتاحي المتوازن بإجمالي ${dr.toLocaleString()} ج.م`, refId);

      showToast('تم اعتماد وترحيل القيد الافتتاحي المتوازن بنجاح', 'success');
      overlay.remove();

      const main = document.getElementById('main');
      if(main){
        if(state.financeTab === 'trialbalance') renderTrialBalance(main);
        else if(state.financeTab === 'accounts') renderChartOfAccounts(main);
      }
    }catch(err){
      showToast('حدث خطأ أثناء حفظ القيد الافتتاحي: ' + (err.message || err), 'error');
    }
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

  // F1: If journal entries are empty but operational records exist, prime the ledger
  if((!state.journalEntries || state.journalEntries.length === 0) &&
     ((state.sales && state.sales.length) || (state.receipts && state.receipts.length) || (state.expenses && state.expenses.length))){
    if(typeof reconcileHistoricalJournalEntries === 'function'){
      reconcileHistoricalJournalEntries();
    }
  }

  // --- 1. Ledger-derived Financial Metrics (Single Source of Truth) ---
  let totalJournalDebits = 0;
  let totalJournalCredits = 0;
  let journalEntriesCount = 0;

  // Revenue accounts (Credit nature: 4*)
  let rev4101 = 0; // إيرادات خدمات صيانة وتصليح
  let rev4102 = 0; // إيرادات مبيعات بضائع وقطع غيار
  let rev4103 = 0; // إيرادات تركيب كاميرات وأنظمة
  let revOther4 = 0; // إيرادات أخرى متنوعة (42 أو حسابات 4 أخرى)
  let totalRevenue = 0;

  // COGS accounts (Debit nature: 51*)
  let cogs5101 = 0; // تكلفة قطع الغيار المستخدمة بالصيانة
  let cogs5102 = 0; // تكلفة البضاعة المباعة (POS)
  let cogsOther51 = 0; // تكاليف نشاط ومبيعات أخرى
  let totalCOGS = 0;

  // Operating Expenses accounts (Debit nature: 52* or any 5* not 51*)
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

  const CODE_TO_EXP_CAT = {
    '5201': 'إيجار',
    '5202': 'كهرباء ومياه',
    '5203': 'رواتب وسلفيات',
    '5204': 'بوفيه ونثريات',
    '5205': 'دعاية وإعلانات',
    '5206': 'أدوات وصيانة مقر',
    '5207': 'شحن وتوصيل'
  };

  (state.journalEntries || []).forEach(je => {
    const dt = cleanDate(je.Date) || (typeof je.Date === 'string' ? je.Date.slice(0, 10) : '');
    if(dt >= sDate && dt <= eDate){
      journalEntriesCount++;
      const lines = Array.isArray(je.Lines) ? je.Lines : (typeof je.LinesJSON === 'string' ? JSON.parse(je.LinesJSON || '[]') : []);
      lines.forEach(l => {
        const code = String(l.AccountCode || '').trim();
        const dr = Number(l.Debit || 0);
        const cr = Number(l.Credit || 0);

        totalJournalDebits += dr;
        totalJournalCredits += cr;

        // 1. Revenue: Accounts starting with '4' (Credit - Debit)
        if(code.startsWith('4')){
          const net = cr - dr;
          totalRevenue += net;
          if(code === '4101') rev4101 += net;
          else if(code === '4102') rev4102 += net;
          else if(code === '4103') rev4103 += net;
          else revOther4 += net;
        }

        // 2. COGS: Accounts starting with '51' (Debit - Credit)
        else if(code.startsWith('51')){
          const net = dr - cr;
          totalCOGS += net;
          if(code === '5101') cogs5101 += net;
          else if(code === '5102') cogs5102 += net;
          else cogsOther51 += net;
        }

        // 3. Operating Expenses: Accounts starting with '5' (excluding 51*) (Debit - Credit)
        else if(code.startsWith('5')){
          const net = dr - cr;
          totalOperatingExpenses += net;
          const cat = CODE_TO_EXP_CAT[code] || (l.AccountName && expCategories[l.AccountName] !== undefined ? l.AccountName : 'مصروفات أخرى');
          if(expCategories[cat] !== undefined) expCategories[cat] += net;
          else expCategories['مصروفات أخرى'] += net;
        }
      });
    }
  });

  // Round all ledger totals
  totalRevenue = round2(totalRevenue);
  rev4101 = round2(rev4101);
  rev4102 = round2(rev4102);
  rev4103 = round2(rev4103);
  revOther4 = round2(revOther4);

  totalCOGS = round2(totalCOGS);
  cogs5101 = round2(cogs5101);
  cogs5102 = round2(cogs5102);
  cogsOther51 = round2(cogsOther51);

  totalOperatingExpenses = round2(totalOperatingExpenses);
  Object.keys(expCategories).forEach(k => {
    expCategories[k] = round2(expCategories[k]);
  });

  totalJournalDebits = round2(totalJournalDebits);
  totalJournalCredits = round2(totalJournalCredits);
  const ledgerImbalance = round2(Math.abs(totalJournalDebits - totalJournalCredits));
  const isLedgerBalanced = ledgerImbalance < 0.01;

  const grossProfit = round2(totalRevenue - totalCOGS);
  const grossMargin = totalRevenue > 0 ? round2((grossProfit / totalRevenue) * 100) : 0;
  const netOperatingProfit = round2(grossProfit - totalOperatingExpenses);
  const netMargin = totalRevenue > 0 ? round2((netOperatingProfit / totalRevenue) * 100) : 0;

  // --- 2. Statistical Operational Counts (Designated as non-accounting operational data) ---
  let posSalesCount = 0;
  let posReturnsCount = 0;
  let statPosSalesRev = 0;
  (state.sales || []).forEach(s => {
    const dt = cleanDate(s.Date) || s.Date;
    if(dt >= sDate && dt <= eDate){
      posSalesCount++;
      statPosSalesRev += Number(s.Total || 0);
      if(s.IsReturned) posReturnsCount++;
    }
  });

  let maintCount = 0;
  let maintDeliveredCount = 0;
  let statMaintLabor = 0;
  let statMaintParts = 0;
  (state.receipts || []).forEach(r => {
    const dt = cleanDate(r.date) || r.date;
    if(dt >= sDate && dt <= eDate){
      maintCount++;
      if(r.status === 'تم التسليم' || r.status === 'delivered') maintDeliveredCount++;
      const isCancelled = r.status === 'تعذرت الصيانة' || r.status === 'رفض العميل' || r.status === 'ملغي';
      if(!isCancelled){
        statMaintLabor += Number(r.cost || 0) + Number(r.otherAccountAmount || 0);
        statMaintParts += Number(r.partsCost || 0);
      }
    }
  });

  let invoicesCount = 0;
  (state.invoices || []).forEach(inv => {
    const dt = cleanDate(inv.Date) || inv.Date;
    if(dt >= sDate && dt <= eDate){
      invoicesCount++;
    }
  });

  return {
    sDate, eDate,
    totalRevenue, totalCOGS, grossProfit, grossMargin,
    totalOperatingExpenses, expCategories,
    netOperatingProfit, netMargin,
    // Ledger verification
    totalJournalDebits, totalJournalCredits, ledgerImbalance, isLedgerBalanced, journalEntriesCount,
    // Ledger Accounts
    rev4101, rev4102, rev4103, revOther4,
    cogs5101, cogs5102, cogsOther51,
    // Operational & backward-compatibility aliases
    maintLaborRev: rev4101,
    maintPartsRev: 0,
    posSalesRev: rev4102,
    servicesRev: round2(rev4103 + revOther4),
    posSalesCOGS: cogs5102,
    maintPartsCOGS: cogs5101,
    posSalesCount, posReturnsCount, maintCount, maintDeliveredCount, invoicesCount,
    statPosSalesRev, statMaintLabor, statMaintParts,
    netPosSalesRev: rev4102,
    netMaintRev: rev4101
  };
}
