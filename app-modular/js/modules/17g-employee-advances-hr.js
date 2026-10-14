/* ============================================================
   17g-employee-advances-hr.js
   نظام إدارة الموارد البشرية، السلف، سقف الائتمان، ومسير الرواتب المتكامل
   متوافق مع معايير المحاسبة والقيود المالية المزدوجة (Double-Entry IFRS/GAAP)
   ============================================================ */

/* ---------------- 1. API & Persistence Operations ---------------- */

async function loadEmployeeAdvances(){
  try {
    const rows = await apiGet('getEmployeeAdvances');
    if(Array.isArray(rows)){
      state.employeeAdvances = rows;
      setCache('employee_advances', rows);
    }
  } catch(e){
    console.warn('[loadEmployeeAdvances] Offline fallback to cache:', e.message);
  }
  return state.employeeAdvances || [];
}

async function saveEmployeeAdvanceRemote(adv){
  if(!adv.ID) adv.ID = 'adv_' + Date.now() + '_' + Math.floor(Math.random()*1000);
  if(!state.employeeAdvances) state.employeeAdvances = [];
  const idx = state.employeeAdvances.findIndex(x => String(x.ID) === String(adv.ID));
  if(idx > -1) state.employeeAdvances[idx] = adv;
  else state.employeeAdvances.push(adv);
  setCache('employee_advances', state.employeeAdvances);

  try {
    await apiPost('saveEmployeeAdvance', { data: adv, role: state.user ? state.user.role : 'admin' });
  } catch(e){
    enqueueOfflineTask('saveEmployeeAdvance', adv);
  }
  return adv;
}

async function saveEmployeeAdvanceRepaymentRemote(rep){
  if(!rep.ID) rep.ID = 'rep_' + Date.now() + '_' + Math.floor(Math.random()*1000);
  if(!state.employeeAdvanceRepayments) state.employeeAdvanceRepayments = [];
  state.employeeAdvanceRepayments.push(rep);
  setCache('employee_advance_repayments', state.employeeAdvanceRepayments);

  try {
    await apiPost('saveEmployeeAdvanceRepayment', { data: rep, role: state.user ? state.user.role : 'admin' });
  } catch(e){
    enqueueOfflineTask('saveEmployeeAdvanceRepayment', rep);
  }
  return rep;
}

async function savePayrollRunRemote(payroll){
  if(!payroll.ID) payroll.ID = 'payrun_' + Date.now() + '_' + Math.floor(Math.random()*1000);
  if(!state.payrollRuns) state.payrollRuns = [];
  state.payrollRuns.push(payroll);
  setCache('payroll_runs', state.payrollRuns);

  try {
    await apiPost('savePayrollRun', { data: payroll, role: state.user ? state.user.role : 'admin' });
  } catch(e){
    enqueueOfflineTask('savePayrollRun', payroll);
  }
  return payroll;
}

/* ---------------- 2. Core Financial Transactions Execution ---------------- */

/**
 * صرف سلفة جديدة لموظف:
 * 1. تسجيل السلفة في state.employeeAdvances
 * 2. ترحيل القيد المالي: مدين 1106 (سلف الموظفين) / دائن 1101 أو 1102 (الخزينة أو البنك)
 * 3. تسجيل حركة منصرف نقدي في اليومية والخزينة
 * 4. تسجيل في سجل التدقيق
 */
async function disburseEmployeeAdvanceAction({ employeeName, amount, repaymentType, installmentAmount, notes, paymentMethod }){
  const numAmt = round2(amount);
  if(!employeeName || numAmt <= 0){
    throw new Error('يرجى اختيار الموظف وتحديد مبلغ السلفة بشكل صحيح');
  }

  const cleanName = String(employeeName).trim();
  const matchedUser = (state.users || []).find(u => String(u.Name || '').trim().toLowerCase() === cleanName.toLowerCase());
  const employeeId = matchedUser ? matchedUser.ID : '';

  const repType = repaymentType || 'monthly_salary';
  let instAmt = numAmt;
  let totalInst = 1;

  if(repType === 'installments'){
    instAmt = round2(installmentAmount) > 0 ? round2(installmentAmount) : numAmt;
    totalInst = Math.max(1, Math.ceil(numAmt / instAmt));
  }

  const now = new Date();
  const dateStr = (typeof localDateStr === 'function') ? localDateStr() : now.toISOString().slice(0, 10);
  const timeStr = (typeof localTimeStr === 'function') ? localTimeStr() : now.toTimeString().slice(0, 8);

  const advance = {
    ID: 'adv_' + Date.now() + '_' + Math.floor(Math.random()*1000),
    EmployeeID: employeeId,
    EmployeeName: cleanName,
    Amount: numAmt,
    Date: dateStr,
    Time: timeStr,
    Reason: notes || 'سلفة موظف',
    RepaymentType: repType,
    InstallmentAmount: instAmt,
    TotalInstallments: totalInst,
    RemainingInstallments: totalInst,
    RemainingBalance: numAmt,
    PaymentMethod: paymentMethod || 'نقدي (الخزينة الرئيسية)',
    Status: 'active',
    ShiftID: state.activeShift ? state.activeShift.id : '',
    CreatedBy: state.user ? state.user.name : 'نظام'
  };

  // 1. Save advance object
  await saveEmployeeAdvanceRemote(advance);

  // 2. Double-entry Journal Entry (Dr 1106 / Cr 1101 or 1102)
  const lines = buildAdvanceDisbursementJournalLines({
    employeeName: cleanName,
    amount: numAmt,
    paymentMethod: advance.PaymentMethod
  });

  const repLabel = repType === 'monthly_salary' ? 'خصم كامل من الراتب القادم' : (repType === 'installments' ? `أقساط (${totalInst} قسط × ${instAmt} ج.م)` : 'سداد يدوي على دفعات');
  const journalDesc = `صرف سلفة للموظف (${cleanName}) بمبلغ ${numAmt} ج.م [طريقة السداد: ${repLabel}]`;

  await recordAutoJournalEntry(journalDesc, 'Employee_Advance', advance.ID, lines);

  // 3. Treasury cash outflow entry in state.expenses
  try {
    await saveExpenseRemote({
      ID: 'exp_adv_' + advance.ID,
      Date: dateStr,
      Title: `صرف سلفة: ${cleanName}`,
      Amount: numAmt,
      Category: 'سلف موظفين',
      Type: 'out',
      AccountCode: '1106',
      PaymentMethod: advance.PaymentMethod,
      Notes: `${advance.Reason} • السداد: ${repLabel}`
    });
  } catch(e){
    console.warn('[disburseEmployeeAdvanceAction] Local cash outflow registered:', e);
  }

  // 4. Audit Log
  if(typeof recordAuditLog === 'function'){
    recordAuditLog('صرف سلفة موظف', 'الموارد البشرية', `تم صرف سلفة للموظف (${cleanName}) بقيمة ${numAmt} ج.م عبر [${advance.PaymentMethod}] - السداد: ${repLabel}`, advance.ID);
  }

  return advance;
}

/**
 * سداد سلفة / دفعة نقداً بالخزينة:
 * 1. خصم المبلغ من السلفة النشطة (تحديث RemainingBalance و Status)
 * 2. إضافة سجل سداد في state.employeeAdvanceRepayments
 * 3. ترحيل القيد المالي: مدين 1101 أو 1102 (الخزينة) / دائن 1106 (سلف الموظفين)
 * 4. تسجيل إيداع نقدي بالخزينة
 */
async function repayEmployeeAdvanceAction({ advanceId, employeeName, amount, paymentMethod, notes }){
  const numAmt = round2(amount);
  if(!employeeName || numAmt <= 0){
    throw new Error('يرجى تحديد اسم الموظف والمبلغ المسدد بشكل صحيح');
  }

  const cleanName = String(employeeName).trim();
  const advances = (state.employeeAdvances || []).filter(a => String(a.EmployeeName||'').trim().toLowerCase() === cleanName.toLowerCase() && a.Status !== 'paid');

  let targetAdvance = null;
  if(advanceId){
    targetAdvance = advances.find(a => String(a.ID) === String(advanceId));
  }
  if(!targetAdvance && advances.length > 0){
    targetAdvance = advances[0]; // Oldest active advance
  }

  let remainingToApply = numAmt;
  if(targetAdvance){
    const currentRem = round2(targetAdvance.RemainingBalance != null ? targetAdvance.RemainingBalance : targetAdvance.Amount || 0);
    const newRem = Math.max(0, round2(currentRem - remainingToApply));
    targetAdvance.RemainingBalance = newRem;

    if(targetAdvance.RepaymentType === 'installments' && targetAdvance.InstallmentAmount > 0){
      targetAdvance.RemainingInstallments = Math.max(0, Math.ceil(newRem / targetAdvance.InstallmentAmount));
    }

    if(newRem <= 0.005){
      targetAdvance.Status = 'paid';
      targetAdvance.RemainingBalance = 0;
      targetAdvance.RemainingInstallments = 0;
    }
    await saveEmployeeAdvanceRemote(targetAdvance);
  }

  const now = new Date();
  const dateStr = (typeof localDateStr === 'function') ? localDateStr() : now.toISOString().slice(0, 10);
  const timeStr = (typeof localTimeStr === 'function') ? localTimeStr() : now.toTimeString().slice(0, 8);

  const repayment = {
    ID: 'adv_pay_' + Date.now() + '_' + Math.floor(Math.random()*1000),
    AdvanceID: targetAdvance ? targetAdvance.ID : '',
    EmployeeName: cleanName,
    Amount: numAmt,
    Date: dateStr,
    Time: timeStr,
    Type: 'cash',
    PaymentMethod: paymentMethod || 'نقدي (الخزينة الرئيسية)',
    Notes: notes || 'سداد دفعة سلفة نقداً بالخزينة',
    ShiftID: state.activeShift ? state.activeShift.id : '',
    CreatedBy: state.user ? state.user.name : 'نظام'
  };

  await saveEmployeeAdvanceRepaymentRemote(repayment);

  // Journal Entry: Dr 1101 or 1102 / Cr 1106
  const lines = buildAdvanceRepaymentJournalLines({
    employeeName: cleanName,
    amount: numAmt,
    paymentMethod: repayment.PaymentMethod
  });

  const journalDesc = `تحصيل سداد سلفة الموظف (${cleanName}) بمبلغ ${numAmt} ج.م [${repayment.PaymentMethod}]`;
  await recordAutoJournalEntry(journalDesc, 'Advance_Repayment', repayment.ID, lines);

  // Treasury inflow entry in state.expenses (Type: 'in')
  try {
    await saveExpenseRemote({
      ID: 'exp_rep_' + repayment.ID,
      Date: dateStr,
      Title: `سداد سلفة: ${cleanName}`,
      Amount: numAmt,
      Category: 'سداد سلفيات موظفين',
      Type: 'in',
      AccountCode: '1106',
      PaymentMethod: repayment.PaymentMethod,
      Notes: repayment.Notes
    });
  } catch(e){}

  if(typeof recordAuditLog === 'function'){
    recordAuditLog('سداد سلفة موظف', 'الموارد البشرية', `تم تحصيل سداد سلفة من الموظف (${cleanName}) بمبلغ ${numAmt} ج.م عبر [${repayment.PaymentMethod}]`, repayment.ID);
  }

  return repayment;
}

/**
 * سداد مشتريات موظف بالآجل نقداً بالخزينة:
 * 1. تسجيل حركة سداد مشتريات في state.employeeAdvanceRepayments (Type: 'purchase_repayment_cash')
 * 2. ترحيل القيد المالي: مدين 1101 أو 1102 (الخزينة) / دائن 1107 (مشتريات الموظفين بالآجل)
 * 3. تسجيل إيداع باليومية والخزينة
 */
async function repayEmployeePurchasesAction({ employeeName, amount, paymentMethod, notes }){
  const numAmt = round2(amount);
  if(!employeeName || numAmt <= 0){
    throw new Error('يرجى تحديد اسم الموظف والمبلغ المسدد بشكل صحيح');
  }

  const cleanName = String(employeeName).trim();
  const now = new Date();
  const dateStr = (typeof localDateStr === 'function') ? localDateStr() : now.toISOString().slice(0, 10);
  const timeStr = (typeof localTimeStr === 'function') ? localTimeStr() : now.toTimeString().slice(0, 8);

  const repayment = {
    ID: 'emp_pur_rep_' + Date.now() + '_' + Math.floor(Math.random()*1000),
    AdvanceID: '',
    EmployeeName: cleanName,
    Amount: numAmt,
    Date: dateStr,
    Time: timeStr,
    Type: 'purchase_repayment_cash',
    PaymentMethod: paymentMethod || 'نقدي (الخزينة الرئيسية)',
    Notes: notes || 'سداد مشتريات موظف بالآجل نقداً',
    ShiftID: state.activeShift ? state.activeShift.id : '',
    CreatedBy: state.user ? state.user.name : 'نظام'
  };

  await saveEmployeeAdvanceRepaymentRemote(repayment);

  // Journal Entry: Dr 1101 or 1102 / Cr 1107
  const lines = buildEmployeePurchasePaymentJournalLines({
    employeeName: cleanName,
    amount: numAmt,
    paymentMethod: repayment.PaymentMethod
  });

  const journalDesc = `تحصيل سداد مشتريات الموظف (${cleanName}) بالآجل بمبلغ ${numAmt} ج.م [${repayment.PaymentMethod}]`;
  await recordAutoJournalEntry(journalDesc, 'Employee_Purchase_Repayment', repayment.ID, lines);

  // Treasury inflow
  try {
    await saveExpenseRemote({
      ID: 'exp_purrep_' + repayment.ID,
      Date: dateStr,
      Title: `سداد مشتريات موظف: ${cleanName}`,
      Amount: numAmt,
      Category: 'سداد مشتريات موظفين',
      Type: 'in',
      AccountCode: '1107',
      PaymentMethod: repayment.PaymentMethod,
      Notes: repayment.Notes
    });
  } catch(e){}

  if(typeof recordAuditLog === 'function'){
    recordAuditLog('سداد مشتريات موظف بالآجل', 'الموارد البشرية', `تم تحصيل سداد مشتريات من الموظف (${cleanName}) بمبلغ ${numAmt} ج.م نقداً`, repayment.ID);
  }

  return repayment;
}

/**
 * اعتماد وصرف مسير الرواتب الشهري الشامل:
 * 1. استقطاع أقساط السلف المجدولة والمشتريات الآجلة آلياً
 * 2. ترحيل القيد المحاسبي المركب المتوازن:
 *    - مدين: 5203 (رواتب ومكافآت الموظفين) بإجمالي الاستحقاق
 *    - دائن: 1106 (سلف الموظفين) بأقساط السلف
 *    - دائن: 1107 (مشتريات الموظفين) باستقطاع المشتريات
 *    - دائن: 4201 (جزاءات وخصومات إدارية) إن وجدت
 *    - دائن: 1101 أو 1102 (الخزينة) بصافي المرتبات المنصرفة
 * 3. تسجيل المنصرف بالخزينة لحركة صافي الرواتب
 * 4. حفظ المسير في state.payrollRuns
 */
async function executeMonthlyPayrollAction({ month, employeesData, paymentMethod, notes }){
  if(!month || !Array.isArray(employeesData) || employeesData.length === 0){
    throw new Error('يرجى تحديد شهر المسير وبيانات الموظفين بشكل صحيح');
  }

  let totalGross = 0;
  let totalAdvancesDeducted = 0;
  let totalPurchasesDeducted = 0;
  let totalPenalties = 0;
  let totalNetPaid = 0;

  const processedEmployees = [];
  const now = new Date();
  const dateStr = (typeof localDateStr === 'function') ? localDateStr() : now.toISOString().slice(0, 10);
  const payMethod = paymentMethod || 'نقدي (الخزينة الرئيسية)';

  for(const emp of employeesData){
    const cleanName = String(emp.employeeName).trim();
    const base = round2(emp.baseSalary || 0);
    const bonus = round2(emp.bonus || 0);
    const gross = round2(base + bonus);
    const penalty = round2(emp.penalties || 0);
    const advDeduct = round2(emp.advanceDeduction || 0);
    const purDeduct = round2(emp.purchaseDeduction || 0);
    const net = Math.max(0, round2(gross - penalty - advDeduct - purDeduct));

    totalGross += gross;
    totalPenalties += penalty;
    totalAdvancesDeducted += advDeduct;
    totalPurchasesDeducted += purDeduct;
    totalNetPaid += net;

    // Apply Advance Deduction to employee's active advances
    if(advDeduct > 0){
      const advances = (state.employeeAdvances || []).filter(a => String(a.EmployeeName||'').trim().toLowerCase() === cleanName.toLowerCase() && a.Status !== 'paid');
      let remToDeduct = advDeduct;
      for(const adv of advances){
        if(remToDeduct <= 0) break;
        const curRem = round2(adv.RemainingBalance != null ? adv.RemainingBalance : adv.Amount || 0);
        const deductThis = Math.min(curRem, remToDeduct);
        adv.RemainingBalance = round2(curRem - deductThis);
        if(adv.RepaymentType === 'installments' && adv.InstallmentAmount > 0){
          adv.RemainingInstallments = Math.max(0, Math.ceil(adv.RemainingBalance / adv.InstallmentAmount));
        }
        if(adv.RemainingBalance <= 0.005){
          adv.Status = 'paid';
          adv.RemainingBalance = 0;
          adv.RemainingInstallments = 0;
        }
        remToDeduct = round2(remToDeduct - deductThis);
        await saveEmployeeAdvanceRemote(adv);
      }

      // Record repayment record
      await saveEmployeeAdvanceRepaymentRemote({
        ID: 'adv_pay_payroll_' + Date.now() + '_' + Math.floor(Math.random()*1000),
        AdvanceID: '',
        EmployeeName: cleanName,
        Amount: advDeduct,
        Date: dateStr,
        Type: 'payroll_deduction',
        PaymentMethod: `استقطاع من راتب شهر [${month}]`,
        Notes: `استقطاع قسط سلفة من مسير رواتب شهر [${month}]`,
        ShiftID: state.activeShift ? state.activeShift.id : '',
        CreatedBy: state.user ? state.user.name : 'نظام'
      });
    }

    // Apply Purchase Deduction
    if(purDeduct > 0){
      await saveEmployeeAdvanceRepaymentRemote({
        ID: 'pur_pay_payroll_' + Date.now() + '_' + Math.floor(Math.random()*1000),
        AdvanceID: '',
        EmployeeName: cleanName,
        Amount: purDeduct,
        Date: dateStr,
        Type: 'payroll_purchase_deduction',
        PaymentMethod: `استقطاع من راتب شهر [${month}]`,
        Notes: `استقطاع مشتريات آجل من مسير رواتب شهر [${month}]`,
        ShiftID: state.activeShift ? state.activeShift.id : '',
        CreatedBy: state.user ? state.user.name : 'نظام'
      });
    }

    processedEmployees.push({
      employeeName: cleanName,
      baseSalary: base,
      bonus: bonus,
      grossSalary: gross,
      penalties: penalty,
      advanceDeduction: advDeduct,
      purchaseDeduction: purDeduct,
      netSalary: net
    });
  }

  totalGross = round2(totalGross);
  totalPenalties = round2(totalPenalties);
  totalAdvancesDeducted = round2(totalAdvancesDeducted);
  totalPurchasesDeducted = round2(totalPurchasesDeducted);
  totalNetPaid = round2(totalNetPaid);

  // 1. Build and post balanced compound journal entry
  const journalLines = buildPayrollJournalLines({
    month: month,
    totalGross: totalGross,
    totalAdvancesDeducted: totalAdvancesDeducted,
    totalPurchasesDeducted: totalPurchasesDeducted,
    totalPenalties: totalPenalties,
    totalNetPaid: totalNetPaid,
    paymentMethod: payMethod
  });

  const payrollRun = {
    ID: 'payrun_' + month.replace('-', '_') + '_' + Date.now(),
    Month: month,
    Date: dateStr,
    TotalGross: totalGross,
    TotalPenalties: totalPenalties,
    TotalAdvancesDeducted: totalAdvancesDeducted,
    TotalPurchasesDeducted: totalPurchasesDeducted,
    TotalNetPaid: totalNetPaid,
    EmployeesCount: processedEmployees.length,
    PaymentMethod: payMethod,
    Notes: notes || `مسير رواتب شهر ${month}`,
    EmployeesJSON: JSON.stringify(processedEmployees),
    ProcessedBy: state.user ? state.user.name : 'نظام'
  };

  await savePayrollRunRemote(payrollRun);

  const journalDesc = `مسير وصرف رواتب شهر [${month}] لعدد (${processedEmployees.length}) موظف بإجمالي استحقاق ${totalGross} ج.م وصافي منصرف ${totalNetPaid} ج.م`;
  await recordAutoJournalEntry(journalDesc, 'Payroll_Run', payrollRun.ID, journalLines);

  // 2. Treasury outflow entry for net paid cash
  if(totalNetPaid > 0){
    try {
      await saveExpenseRemote({
        ID: 'exp_payroll_' + payrollRun.ID,
        Date: dateStr,
        Title: `صرف مسير رواتب شهر [${month}]`,
        Amount: totalNetPaid,
        Category: 'رواتب',
        Type: 'out',
        AccountCode: '5203',
        PaymentMethod: payMethod,
        Notes: `صافي رواتب ${processedEmployees.length} موظف بعد خصم السلف (${totalAdvancesDeducted} ج.م) والمشتريات (${totalPurchasesDeducted} ج.م)`
      });
    } catch(e){}
  }

  if(typeof recordAuditLog === 'function'){
    recordAuditLog('اعتماد وصرف مسير رواتب', 'الموارد البشرية', `تم اعتماد مسير رواتب شهر [${month}] بإجمالي ${totalGross} ج.م وصافي ${totalNetPaid} ج.م لعدد (${processedEmployees.length}) موظف`, payrollRun.ID);
  }

  return payrollRun;
}

/* ---------------- 3. UI Modals & Actions ---------------- */

/**
 * نافذة صرف سلفة جديدة لموظف
 */
function openDisburseAdvanceModal(preselectedEmployee = '', onDone = null){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'disburseAdvanceModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:12000;display:flex;align-items:center;justify-content:center;padding:16px;';

  const usersList = (state.users || []).filter(u => u.Name !== 'admin');
  const initialEmp = preselectedEmployee || (usersList.length ? usersList[0].Name : '');

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,0.3);width:100%;max-width:540px;overflow:hidden;border:1px solid #cbd5e1;direction:rtl;text-align:right;">
      <div style="background:linear-gradient(135deg,#047857,#065f46);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:20px;">💵</span>
          <div>
            <h3 style="margin:0;font-size:16px;font-weight:900;">صرف سلفة موظف جديدة</h3>
            <div style="font-size:11px;color:#a7f3d0;margin-top:2px;">تسجيل السلفة وإنشاء القيد المحاسبي المزدوج وصرفها من الخزينة</div>
          </div>
        </div>
        <button type="button" class="btn btn-ghost btn-xs" id="closeAdvModalBtn" style="color:#fff;font-size:18px;">&times;</button>
      </div>

      <div style="padding:18px 20px;">
        <div class="field" style="margin-bottom:12px;">
          <label style="font-size:12px;font-weight:800;display:block;margin-bottom:4px;">اسم الموظف / الفني *</label>
          <select id="advEmpSelect" style="width:100%;padding:8px 10px;font-size:13px;border-radius:6px;border:1px solid #cbd5e1;">
            ${(state.users || []).map(u => `
              <option value="${escapeHtml(u.Name)}" ${u.Name === initialEmp ? 'selected' : ''}>
                ${escapeHtml(u.Name)} (${u.Role === 'technician' ? 'فني صيانة' : (u.Role === 'cashier' ? 'كاشير' : u.Role)}) - راتب: ${(u.Salary || 0).toLocaleString()} ج.م
              </option>
            `).join('')}
          </select>
        </div>

        <div id="advEmpInfoBox" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:8px 12px;margin-bottom:14px;font-size:11.5px;color:#166534;">
          جاري جلب بيانات الموظف...
        </div>

        <div class="grid2" style="margin-bottom:12px;">
          <div class="field">
            <label style="font-size:12px;font-weight:800;display:block;margin-bottom:4px;">مبلغ السلفة (ج.م) *</label>
            <input type="number" id="advAmountInp" min="1" step="50" placeholder="مثال: 1000" class="mono font-bold" style="width:100%;padding:8px 10px;font-size:15px;color:#047857;" autofocus>
          </div>
          <div class="field">
            <label style="font-size:12px;font-weight:800;display:block;margin-bottom:4px;">طريقة السداد *</label>
            <select id="advRepayTypeSelect" style="width:100%;padding:8px 10px;font-size:12.5px;border-radius:6px;border:1px solid #cbd5e1;">
              <option value="monthly_salary">خصم دفعة واحدة من الراتب القادم</option>
              <option value="installments">على أقساط شهرية مجدولة</option>
              <option value="manual">سداد يدوي / دفعات نقداً بالخزينة</option>
            </select>
          </div>
        </div>

        <!-- Installments details row -->
        <div id="advInstallmentsRow" style="display:none;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;margin-bottom:12px;">
          <div class="grid2">
            <div class="field">
              <label style="font-size:11px;font-weight:700;display:block;margin-bottom:3px;">قيمة القسط الشهري (ج.م):</label>
              <input type="number" id="advInstAmtInp" min="1" step="50" placeholder="مثال: 250" class="mono font-bold" style="width:100%;padding:6px 8px;font-size:13px;">
            </div>
            <div class="field">
              <label style="font-size:11px;font-weight:700;display:block;margin-bottom:3px;">عدد الأقساط المحسوبة:</label>
              <div id="advInstCountDisplay" class="mono font-bold" style="padding:7px;font-size:13px;color:#0284c7;">-</div>
            </div>
          </div>
        </div>

        <div class="grid2" style="margin-bottom:12px;">
          <div class="field">
            <label style="font-size:12px;font-weight:800;display:block;margin-bottom:4px;">صندوق الصرف (الخزينة / البنك):</label>
            <select id="advPayMethodSelect" style="width:100%;padding:8px 10px;font-size:12.5px;border-radius:6px;border:1px solid #cbd5e1;">
              <option value="نقدي (الخزينة الرئيسية)">الخزينة الرئيسية (النقدية) - ح/ 1101</option>
              <option value="البنك والحسابات الإلكترونية">البنك والحسابات الإلكترونية - ح/ 1102</option>
            </select>
          </div>
          <div class="field">
            <label style="font-size:12px;font-weight:800;display:block;margin-bottom:4px;">سبب السلفة / ملاحظات:</label>
            <input id="advReasonInp" placeholder="سلفة شخصية، ظروف طارئة..." style="width:100%;padding:8px 10px;font-size:12.5px;">
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;border-top:1px solid #e2e8f0;padding-top:14px;">
          <button type="button" class="btn btn-ghost btn-sm" id="cancelAdvModalBtn">إلغاء</button>
          <button type="button" class="btn btn-green btn-sm font-bold" id="submitAdvModalBtn" style="padding:8px 20px;">
            ${getSvgIcon('check', 14)} اعتماد وصرف السلفة
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const empSel = overlay.querySelector('#advEmpSelect');
  const infoBox = overlay.querySelector('#advEmpInfoBox');
  const amtInp = overlay.querySelector('#advAmountInp');
  const typeSel = overlay.querySelector('#advRepayTypeSelect');
  const instRow = overlay.querySelector('#advInstallmentsRow');
  const instAmtInp = overlay.querySelector('#advInstAmtInp');
  const instCountDisp = overlay.querySelector('#advInstCountDisplay');

  function updateEmpInfo(){
    const name = empSel.value;
    const balances = computeEmployeeBalances(name, state);
    infoBox.innerHTML = `
      الموظف: <b>${escapeHtml(name)}</b> • الراتب الأساسي: <b class="mono">${balances.salary.toLocaleString()} ج.م</b><br>
      رصيد السلف الحالية: <b class="mono" style="color:${balances.advancesBalance>0?'#b91c1c':'#047857'};">${balances.advancesBalance.toLocaleString()} ج.م</b> (${balances.activeAdvancesCount} سلف قائمة) •
      رصيد المشتريات الآجلة: <b class="mono">${balances.purchasesBalance.toLocaleString()} ج.م</b>
    `;
  }

  function updateInstallmentsCalc(){
    const tot = Number(amtInp.value) || 0;
    const inst = Number(instAmtInp.value) || 0;
    if(tot > 0 && inst > 0){
      const count = Math.ceil(tot / inst);
      instCountDisp.textContent = `${count} أقساط شهرياً`;
    } else {
      instCountDisp.textContent = '-';
    }
  }

  empSel.onchange = updateEmpInfo;
  typeSel.onchange = () => {
    instRow.style.display = typeSel.value === 'installments' ? 'block' : 'none';
    if(typeSel.value === 'installments' && !instAmtInp.value && amtInp.value){
      instAmtInp.value = Math.round(Number(amtInp.value) / 3);
    }
    updateInstallmentsCalc();
  };

  amtInp.oninput = () => {
    if(typeSel.value === 'installments' && !instAmtInp.value){
      instAmtInp.value = Math.round(Number(amtInp.value) / 3);
    }
    updateInstallmentsCalc();
  };
  instAmtInp.oninput = updateInstallmentsCalc;

  updateEmpInfo();

  overlay.querySelector('#closeAdvModalBtn').onclick = () => overlay.remove();
  overlay.querySelector('#cancelAdvModalBtn').onclick = () => overlay.remove();

  overlay.querySelector('#submitAdvModalBtn').onclick = async () => {
    const btn = overlay.querySelector('#submitAdvModalBtn');
    const name = empSel.value;
    const amount = Number(amtInp.value);
    const repayType = typeSel.value;
    const instAmt = Number(instAmtInp.value);
    const payMethod = overlay.querySelector('#advPayMethodSelect').value;
    const reason = overlay.querySelector('#advReasonInp').value.trim();

    if(!name){ showToast('يرجى اختيار الموظف', 'error'); return; }
    if(!amount || amount <= 0){ showToast('يرجى إدخال مبلغ سلفة صحيح أكبر من صفر', 'error'); return; }

    btn.disabled = true;
    btn.textContent = 'جارٍ تسجيل وصرف السلفة...';

    try {
      await disburseEmployeeAdvanceAction({
        employeeName: name,
        amount: amount,
        repaymentType: repayType,
        installmentAmount: instAmt,
        notes: reason,
        paymentMethod: payMethod
      });

      showToast(`تم صرف سلفة للموظف (${name}) بقيمة ${amount.toLocaleString()} ج.م وترحيل القيد بنجاح`, 'success');
      overlay.remove();
      if(typeof onDone === 'function') onDone();
      else if(state.currentSection === 'users') {
        const main = document.getElementById('main');
        if(main) renderUsersManagementPage(main);
      } else if(state.currentSection === 'finance' && state.financeTab === 'advances') {
        const main = document.getElementById('main');
        if(main) renderEmployeeAdvancesPage(main);
      }
    } catch(err){
      showToast(err.message || 'حدث خطأ أثناء صرف السلفة', 'error');
      btn.disabled = false;
      btn.textContent = 'اعتماد وصرف السلفة';
    }
  };
}

/**
 * نافذة سداد دفعة من السلفة نقداً بالخزينة
 */
function openRepayAdvanceModal(advanceId = '', employeeName = '', onDone = null){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'repayAdvanceModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:12000;display:flex;align-items:center;justify-content:center;padding:16px;';

  const advances = (state.employeeAdvances || []).filter(a => a.Status !== 'paid');
  let selectedAdv = advances.find(a => String(a.ID) === String(advanceId));
  if(!selectedAdv && employeeName){
    selectedAdv = advances.find(a => String(a.EmployeeName||'').trim().toLowerCase() === employeeName.trim().toLowerCase());
  }

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,0.3);width:100%;max-width:500px;overflow:hidden;border:1px solid #cbd5e1;direction:rtl;text-align:right;">
      <div style="background:linear-gradient(135deg,#0284c7,#0369a1);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:20px;">📥</span>
          <div>
            <h3 style="margin:0;font-size:16px;font-weight:900;">سداد دفعة سلفة نقداً بالخزينة</h3>
            <div style="font-size:11px;color:#bae6fd;margin-top:2px;">تحصيل قسط سلفة وتوريده للخزينة وتخفيض مديونية الموظف</div>
          </div>
        </div>
        <button type="button" class="btn btn-ghost btn-xs" id="closeRepayModalBtn" style="color:#fff;font-size:18px;">&times;</button>
      </div>

      <div style="padding:18px 20px;">
        <div class="field" style="margin-bottom:12px;">
          <label style="font-size:12px;font-weight:800;display:block;margin-bottom:4px;">اختر السلفة المراد سدادها *</label>
          <select id="repayAdvSelect" style="width:100%;padding:8px 10px;font-size:12.5px;border-radius:6px;border:1px solid #cbd5e1;">
            ${advances.map(a => `
              <option value="${a.ID}" ${selectedAdv && a.ID === selectedAdv.ID ? 'selected' : ''}>
                ${escapeHtml(a.EmployeeName)} • متبقي: ${(a.RemainingBalance||a.Amount).toLocaleString()} ج.م (أصل: ${a.Amount.toLocaleString()} ج.م بتاريخ ${a.Date})
              </option>
            `).join('')}
          </select>
        </div>

        <div class="field" style="margin-bottom:12px;">
          <label style="font-size:12px;font-weight:800;display:block;margin-bottom:4px;">المبلغ المسدد (ج.م) *</label>
          <input type="number" id="repayAmtInp" min="1" class="mono font-bold" style="width:100%;padding:8px 10px;font-size:15px;color:#0284c7;" autofocus>
        </div>

        <div class="field" style="margin-bottom:12px;">
          <label style="font-size:12px;font-weight:800;display:block;margin-bottom:4px;">طريقة التحصيل / الصندوق:</label>
          <select id="repayMethodSelect" style="width:100%;padding:8px 10px;font-size:12.5px;border-radius:6px;border:1px solid #cbd5e1;">
            <option value="نقدي (الخزينة الرئيسية)">الخزينة الرئيسية (النقدية) - ح/ 1101</option>
            <option value="البنك والحسابات الإلكترونية">البنك والحسابات الإلكترونية - ح/ 1102</option>
          </select>
        </div>

        <div class="field" style="margin-bottom:12px;">
          <label style="font-size:12px;font-weight:800;display:block;margin-bottom:4px;">ملاحظات السداد:</label>
          <input id="repayNotesInp" placeholder="سداد قسط نقدي، دفعة عاجلة..." style="width:100%;padding:8px 10px;font-size:12.5px;">
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;border-top:1px solid #e2e8f0;padding-top:14px;">
          <button type="button" class="btn btn-ghost btn-sm" id="cancelRepayModalBtn">إلغاء</button>
          <button type="button" class="btn btn-blue btn-sm font-bold" id="submitRepayModalBtn" style="padding:8px 20px;">
            ${getSvgIcon('check', 14)} تأكيد استلام المبلغ وتوريده للخزينة
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const advSel = overlay.querySelector('#repayAdvSelect');
  const amtInp = overlay.querySelector('#repayAmtInp');

  function prefillAmount(){
    const aId = advSel.value;
    const adv = advances.find(x => String(x.ID) === String(aId));
    if(adv){
      amtInp.value = adv.InstallmentAmount > 0 ? Math.min(adv.InstallmentAmount, adv.RemainingBalance) : adv.RemainingBalance;
    }
  }
  advSel.onchange = prefillAmount;
  prefillAmount();

  overlay.querySelector('#closeRepayModalBtn').onclick = () => overlay.remove();
  overlay.querySelector('#cancelRepayModalBtn').onclick = () => overlay.remove();

  overlay.querySelector('#submitRepayModalBtn').onclick = async () => {
    const aId = advSel.value;
    const adv = advances.find(x => String(x.ID) === String(aId));
    const amt = Number(amtInp.value);
    const method = overlay.querySelector('#repayMethodSelect').value;
    const notes = overlay.querySelector('#repayNotesInp').value.trim();

    if(!adv){ showToast('يرجى اختيار السلفة', 'error'); return; }
    if(!amt || amt <= 0){ showToast('يرجى إدخال مبلغ سداد صحيح', 'error'); return; }

    try {
      await repayEmployeeAdvanceAction({
        advanceId: adv.ID,
        employeeName: adv.EmployeeName,
        amount: amt,
        paymentMethod: method,
        notes: notes
      });

      showToast(`تم استلام مبلغ ${amt.toLocaleString()} ج.م من الموظف (${adv.EmployeeName}) وتوريده للخزينة بنجاح`, 'success');
      overlay.remove();
      if(typeof onDone === 'function') onDone();
      else if(state.currentSection === 'finance' && state.financeTab === 'advances') {
        const main = document.getElementById('main');
        if(main) renderEmployeeAdvancesPage(main);
      }
    } catch(err){
      showToast(err.message || 'حدث خطأ أثناء السداد', 'error');
    }
  };
}

/**
 * نافذة سداد مشتريات موظف نقداً بالخزينة
 */
function openRepayEmployeePurchasesModal(employeeName = '', onDone = null){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'repayEmpPurchasesModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:12000;display:flex;align-items:center;justify-content:center;padding:16px;';

  const balances = computeEmployeeBalances(employeeName, state);

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,0.3);width:100%;max-width:480px;overflow:hidden;border:1px solid #cbd5e1;direction:rtl;text-align:right;">
      <div style="background:linear-gradient(135deg,#9d174d,#831843);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:20px;">🛍️</span>
          <div>
            <h3 style="margin:0;font-size:16px;font-weight:900;">سداد مشتريات موظف بالآجل</h3>
            <div style="font-size:11px;color:#fbcfe8;margin-top:2px;">تحصيل قيمة مشتريات الموظف نقداً وتخفيض مديونية ح/ 1107</div>
          </div>
        </div>
        <button type="button" class="btn btn-ghost btn-xs" id="closePurRepModalBtn" style="color:#fff;font-size:18px;">&times;</button>
      </div>

      <div style="padding:18px 20px;">
        <div style="background:#fdf2f8;border:1px solid #fbcfe8;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#831843;">
          الموظف: <b>${escapeHtml(employeeName)}</b><br>
          إجمالي رصيد المشتريات الآجلة المستحقة: <b class="mono font-bold" style="font-size:15px;color:#9d174d;">${balances.purchasesBalance.toLocaleString()} ج.م</b>
        </div>

        <div class="field" style="margin-bottom:12px;">
          <label style="font-size:12px;font-weight:800;display:block;margin-bottom:4px;">المبلغ المسدد نقداً (ج.م) *</label>
          <input type="number" id="purRepAmtInp" min="1" max="${balances.purchasesBalance}" value="${balances.purchasesBalance}" class="mono font-bold" style="width:100%;padding:8px 10px;font-size:15px;color:#9d174d;" autofocus>
        </div>

        <div class="field" style="margin-bottom:12px;">
          <label style="font-size:12px;font-weight:800;display:block;margin-bottom:4px;">صندوق التحصيل:</label>
          <select id="purRepMethodSelect" style="width:100%;padding:8px 10px;font-size:12.5px;border-radius:6px;border:1px solid #cbd5e1;">
            <option value="نقدي (الخزينة الرئيسية)">الخزينة الرئيسية (النقدية) - ح/ 1101</option>
            <option value="البنك والحسابات الإلكترونية">البنك والحسابات الإلكترونية - ح/ 1102</option>
          </select>
        </div>

        <div class="field" style="margin-bottom:12px;">
          <label style="font-size:12px;font-weight:800;display:block;margin-bottom:4px;">ملاحظات:</label>
          <input id="purRepNotesInp" placeholder="سداد كاش لمشتريات سابقة..." style="width:100%;padding:8px 10px;font-size:12.5px;">
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;border-top:1px solid #e2e8f0;padding-top:14px;">
          <button type="button" class="btn btn-ghost btn-sm" id="cancelPurRepModalBtn">إلغاء</button>
          <button type="button" class="btn btn-primary btn-sm font-bold" id="submitPurRepModalBtn" style="padding:8px 20px;background:#9d174d;border-color:#831843;">
            ${getSvgIcon('check', 14)} تأكيد التحصيل وتوريد النقدية
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#closePurRepModalBtn').onclick = () => overlay.remove();
  overlay.querySelector('#cancelPurRepModalBtn').onclick = () => overlay.remove();

  overlay.querySelector('#submitPurRepModalBtn').onclick = async () => {
    const amt = Number(overlay.querySelector('#purRepAmtInp').value);
    const method = overlay.querySelector('#purRepMethodSelect').value;
    const notes = overlay.querySelector('#purRepNotesInp').value.trim();

    if(!amt || amt <= 0){ showToast('يرجى إدخال مبلغ سداد صحيح', 'error'); return; }

    try {
      await repayEmployeePurchasesAction({
        employeeName: employeeName,
        amount: amt,
        paymentMethod: method,
        notes: notes
      });

      showToast(`تم سداد مبلغ ${amt.toLocaleString()} ج.م من مشتريات الموظف (${employeeName}) وتوريده بنجاح`, 'success');
      overlay.remove();
      if(typeof onDone === 'function') onDone();
    } catch(e){
      showToast(e.message || 'حدث خطأ أثناء السداد', 'error');
    }
  };
}

/**
 * نافذة كشف حساب الموظف التفصيلي الشامل (Employee Statement of Account)
 */
function openEmployeeStatementModal(employeeName){
  if(!employeeName){ showToast('يرجى تحديد الموظف', 'error'); return; }
  const cleanName = String(employeeName).trim();
  const matchedUser = (state.users || []).find(u => String(u.Name||'').trim().toLowerCase() === cleanName.toLowerCase()) || {};
  const balances = computeEmployeeBalances(cleanName, state);

  // Compile full statement history
  const ledger = [];

  // 1. Advances Disbursed (Debit)
  (state.employeeAdvances || []).forEach(a => {
    if(String(a.EmployeeName||'').trim().toLowerCase() === cleanName.toLowerCase()){
      ledger.push({
        date: a.Date || '2026-01-01',
        time: a.Time || '',
        type: 'صرف سلفة',
        icon: '💵',
        ref: '#' + a.ID.slice(-8),
        desc: `${a.Reason || 'سلفة موظف'} [${a.PaymentMethod || 'نقدي'}] - طريقة السداد: ${a.RepaymentType === 'installments' ? 'أقساط' : 'خصم من الراتب'}`,
        debit: Number(a.Amount || 0),
        credit: 0
      });
    }
  });

  // 2. Advance Repayments (Credit)
  (state.employeeAdvanceRepayments || []).forEach(r => {
    if(String(r.EmployeeName||'').trim().toLowerCase() === cleanName.toLowerCase()){
      const isPurchase = r.Type === 'purchase_repayment_cash' || r.Type === 'payroll_purchase_deduction';
      ledger.push({
        date: r.Date || '2026-01-01',
        time: r.Time || '',
        type: isPurchase ? 'سداد مشتريات' : 'سداد قسط سلفة',
        icon: isPurchase ? '🛍️' : '↩️',
        ref: '#' + r.ID.slice(-8),
        desc: `${r.Notes || 'سداد'} [${r.PaymentMethod || 'نقدي'}]`,
        debit: 0,
        credit: Number(r.Amount || 0)
      });
    }
  });

  // 3. Employee Credit Purchases (POS Sales - Debit)
  (state.sales || []).forEach(s => {
    if(String(s.CustomerName||'').trim().toLowerCase() === cleanName.toLowerCase()){
      let isEmpCredit = false;
      let empAmt = 0;
      if(s.SplitsJSON){
        try {
          const sps = typeof s.SplitsJSON === 'string' ? JSON.parse(s.SplitsJSON) : s.SplitsJSON;
          if(Array.isArray(sps)){
            sps.forEach(sp => {
              const m = String(sp.methodId||'').toLowerCase();
              if(m === 'employee_credit' || m === 'employee' || m.includes('موظف')){
                isEmpCredit = true;
                empAmt += round2(sp.amount || 0);
              }
            });
          }
        } catch(e){}
      }
      const pMethod = String(s.PaymentMethod || '').toLowerCase();
      if(pMethod.includes('موظف') || pMethod === 'employee_credit'){
        isEmpCredit = true;
        if(empAmt === 0) empAmt = round2(s.Total || 0);
      }

      if(isEmpCredit && empAmt > 0){
        ledger.push({
          date: cleanDate(s.Date) || s.Date || '2026-01-01',
          time: s.Time || '',
          type: 'مشتريات بالآجل (POS)',
          icon: '🛒',
          ref: '#' + String(s.ID).slice(-8),
          desc: `شراء أصناف: ${s.ItemsSummary || 'مبيعات متجر'}`,
          debit: empAmt,
          credit: 0
        });
      }
    }
  });

  // Sort chronologically
  ledger.sort((a,b) => (a.date + (a.time||'')).localeCompare(b.date + (b.time||'')));

  // Compute running balance
  let running = 0;
  ledger.forEach(row => {
    running = round2(running + row.debit - row.credit);
    row.runningBalance = running;
  });

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'employeeStatementModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:12000;display:flex;align-items:center;justify-content:center;padding:16px;';

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,0.3);width:100%;max-width:880px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;border:1px solid #cbd5e1;direction:rtl;text-align:right;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1e293b,#0f172a);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="badge" style="background:#059669;color:#fff;font-weight:800;font-size:12px;padding:3px 8px;border-radius:6px;">كشف حساب موظف شامل</span>
            <h3 style="margin:0;font-size:17px;font-weight:900;">${escapeHtml(cleanName)}</h3>
            <span style="font-size:12px;color:#94a3b8;">(${matchedUser.Role === 'technician' ? 'فني صيانة' : (matchedUser.Role === 'cashier' ? 'كاشير' : (matchedUser.Role === 'admin' ? 'مدير' : matchedUser.Role || 'موظف'))})</span>
          </div>
          <div style="font-size:11.5px;color:#94a3b8;margin-top:4px;">
            <span>الراتب الأساسي: <b class="mono" style="color:#fff;">${balances.salary.toLocaleString()} ج.م</b></span>
            <span style="margin:0 6px;">•</span>
            <span>سقف المشتريات: <b class="mono" style="color:#fff;">${balances.purchasesCreditLimit.toLocaleString()} ج.م</b></span>
            <span style="margin:0 6px;">•</span>
            <span>${ledger.length} حركة مسجلة</span>
          </div>
        </div>
        <button type="button" class="btn btn-ghost btn-xs" id="closeEmpStatementBtn" style="color:#fff;font-size:18px;">&times;</button>
      </div>

      <!-- Quick KPI Cards -->
      <div style="padding:12px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:grid;grid-template-columns:1fr 1fr 1fr 1.2fr;gap:10px;">
        <div class="card" style="padding:8px 12px;margin:0;border-right:3.5px solid #059669;">
          <div style="font-size:10.5px;color:var(--ink-secondary);font-weight:700;">رصيد السلف القائمة</div>
          <div class="num mono font-bold" style="font-size:15px;color:#059669;">${balances.advancesBalance.toLocaleString()} ج.م</div>
        </div>
        <div class="card" style="padding:8px 12px;margin:0;border-right:3.5px solid #9d174d;">
          <div style="font-size:10.5px;color:var(--ink-secondary);font-weight:700;">مشتريات الآجل المستحقة</div>
          <div class="num mono font-bold" style="font-size:15px;color:#9d174d;">${balances.purchasesBalance.toLocaleString()} ج.م</div>
        </div>
        <div class="card" style="padding:8px 12px;margin:0;border-right:3.5px solid #0284c7;">
          <div style="font-size:10.5px;color:var(--ink-secondary);font-weight:700;">المتاح من سقف الشراء</div>
          <div class="num mono font-bold" style="font-size:15px;color:#0284c7;">${balances.availableCredit.toLocaleString()} ج.م</div>
        </div>
        <div class="card" style="padding:8px 12px;margin:0;border-right:3.5px solid #dc2626;">
          <div style="font-size:10.5px;color:var(--ink-secondary);font-weight:700;">إجمالي المستحق على الموظف</div>
          <div class="num mono font-bold" style="font-size:16px;color:#dc2626;">${balances.totalDueFromEmployee.toLocaleString()} ج.م</div>
        </div>
      </div>

      <!-- Table Body -->
      <div style="padding:14px 20px;overflow-y:auto;flex:1;">
        ${ledger.length === 0 ? `
          <div class="empty" style="padding:40px;text-align:center;">لا توجد أي سلف أو مشتريات آجلة مسجلة لهذا الموظف حتى الآن.</div>
        ` : `
          <div class="table-wrap" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <thead style="background:#f1f5f9;border-bottom:1.5px solid #cbd5e1;">
                <tr>
                  <th style="padding:8px 10px;text-align:right;">التاريخ</th>
                  <th style="padding:8px 10px;text-align:right;">البيان والمعاملة</th>
                  <th style="padding:8px;text-align:center;">المرجع</th>
                  <th style="padding:8px;text-align:center;color:#dc2626;">سلفة / مشتريات (مدين عليه)</th>
                  <th style="padding:8px;text-align:center;color:#059669;">سداد / استقطاع (دائن له)</th>
                  <th style="padding:8px;text-align:center;font-weight:800;">الرصيد المتبقي</th>
                </tr>
              </thead>
              <tbody>
                ${ledger.map((t, idx) => `
                  <tr style="border-bottom:1px solid #f1f5f9;background:${idx%2===0?'#fff':'#fafafa'};">
                    <td style="padding:7px 10px;white-space:nowrap;" class="mono">${cleanDate(t.date)}</td>
                    <td style="padding:7px 10px;">
                      <div style="font-weight:700;color:#0f172a;">${t.icon} ${escapeHtml(t.type)}</div>
                      <div style="font-size:11px;color:#64748b;margin-top:1px;">${escapeHtml(t.desc)}</div>
                    </td>
                    <td style="padding:7px;text-align:center;" class="mono">${escapeHtml(t.ref)}</td>
                    <td style="padding:7px;text-align:center;color:#dc2626;" class="mono font-bold">${t.debit > 0 ? t.debit.toLocaleString() + ' ج.م' : '-'}</td>
                    <td style="padding:7px;text-align:center;color:#059669;" class="mono font-bold">${t.credit > 0 ? t.credit.toLocaleString() + ' ج.م' : '-'}</td>
                    <td style="padding:7px;text-align:center;font-weight:900;color:${t.runningBalance>0?'#dc2626':'#059669'};" class="mono">
                      ${t.runningBalance.toLocaleString()} ج.م
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
        <button type="button" class="btn btn-ghost btn-sm" id="cancelEmpStatementBtn">إغلاق</button>
        <div style="display:flex;gap:8px;">
          <button type="button" class="btn btn-green btn-sm font-bold" id="disburseAdvQuickBtn">
            ${getSvgIcon('plus', 14)} صرف سلفة جديدة
          </button>
          <button type="button" class="btn btn-blue btn-sm font-bold" id="repayAdvQuickBtn">
            ${getSvgIcon('creditCard', 14)} سداد دفعة نقداً
          </button>
          <button type="button" class="btn btn-purple btn-sm font-bold" id="printEmpStatementBtn">
            ${getSvgIcon('printer', 14)} طباعة كشف حساب موظف A4
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#closeEmpStatementBtn').onclick = () => overlay.remove();
  overlay.querySelector('#cancelEmpStatementBtn').onclick = () => overlay.remove();

  overlay.querySelector('#disburseAdvQuickBtn').onclick = () => {
    openDisburseAdvanceModal(cleanName, () => {
      overlay.remove();
      openEmployeeStatementModal(cleanName);
    });
  };

  overlay.querySelector('#repayAdvQuickBtn').onclick = () => {
    openRepayAdvanceModal('', cleanName, () => {
      overlay.remove();
      openEmployeeStatementModal(cleanName);
    });
  };

  overlay.querySelector('#printEmpStatementBtn').onclick = () => {
    openEmployeeStatementPrint({
      employeeName: cleanName,
      user: matchedUser,
      balances: balances,
      ledger: ledger
    });
  };
}

/**
 * طباعة كشف حساب الموظف بصيغة A4 الرسمية
 */
function openEmployeeStatementPrint(data){
  const mount = document.createElement('div');
  mount.id = 'printEmployeeStatementMount';
  mount.className = 'print-mount-a4';
  const shopName = (state.settings && state.settings.shopName) || 'صيانة ميكروتك';

  mount.innerHTML = `
    <style>
      @media print {
        body * { visibility: hidden !important; }
        #printEmployeeStatementMount, #printEmployeeStatementMount * { visibility: visible !important; }
        #printEmployeeStatementMount {
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
          <h2 style="margin:0;font-size:20px;font-weight:900;color:#0f172a;">${escapeHtml(shopName)}</h2>
          <div style="font-size:12px;color:#475569;margin-top:3px;">كشف حساب سلف ومشتريات ومستحقات موظف</div>
        </div>
        <div style="text-align:left;">
          <div style="background:#047857;color:#fff;font-size:13px;font-weight:900;padding:4px 14px;border-radius:4px;display:inline-block;">
            كشف حساب موظف
          </div>
          <div style="font-size:11px;color:#64748b;margin-top:4px;">تاريخ الاستخراج: <b>${new Date().toISOString().slice(0,10)}</b></div>
        </div>
      </div>

      <!-- Employee Info Summary Card -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px 16px;border-radius:6px;margin-bottom:16px;font-size:12.5px;display:grid;grid-template-columns:1.5fr 1fr 1fr 1.2fr;gap:10px;">
        <div>اسم الموظف: <b>${escapeHtml(data.employeeName)}</b></div>
        <div>الراتب الأساسي: <b class="mono">${data.balances.salary.toLocaleString()} ج.م</b></div>
        <div>سقف المشتريات: <b class="mono">${data.balances.purchasesCreditLimit.toLocaleString()} ج.م</b></div>
        <div style="text-align:left;">إجمالي المستحق عليه: <b class="mono" style="font-size:14px;color:#dc2626;">${data.balances.totalDueFromEmployee.toLocaleString()} ج.م</b></div>
      </div>

      <!-- Table -->
      <table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-bottom:16px;">
        <thead>
          <tr style="background:#0f172a;color:#fff;">
            <th style="padding:6px 8px;text-align:right;">التاريخ</th>
            <th style="padding:6px 8px;text-align:right;">المعاملة والبيان</th>
            <th style="padding:6px;text-align:center;">المرجع</th>
            <th style="padding:6px;text-align:center;">مدين عليه (ج.م)</th>
            <th style="padding:6px;text-align:center;">دائن له / مسدد (ج.م)</th>
            <th style="padding:6px;text-align:center;">الرصيد المتبقي</th>
          </tr>
        </thead>
        <tbody>
          ${data.ledger.map((t, idx) => `
            <tr style="border-bottom:1px solid #e2e8f0;background:${idx%2===0?'#fff':'#f8fafc'};">
              <td style="padding:6px 8px;" class="mono">${cleanDate(t.date)}</td>
              <td style="padding:6px 8px;"><b>${escapeHtml(t.type)}</b> - ${escapeHtml(t.desc)}</td>
              <td style="padding:6px;text-align:center;" class="mono">${escapeHtml(t.ref)}</td>
              <td style="padding:6px;text-align:center;color:#dc2626;" class="mono font-bold">${t.debit > 0 ? t.debit.toLocaleString() : '-'}</td>
              <td style="padding:6px;text-align:center;color:#047857;" class="mono font-bold">${t.credit > 0 ? t.credit.toLocaleString() : '-'}</td>
              <td style="padding:6px;text-align:center;font-weight:bold;" class="mono">${t.runningBalance.toLocaleString()} ج.م</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr style="background:#f1f5f9;font-weight:900;border-top:2px solid #0f172a;">
            <td colspan="3" style="padding:8px;">الرصيد الإجمالي المستحق</td>
            <td style="padding:8px;text-align:center;" class="mono">${data.ledger.reduce((s,x)=>s+x.debit,0).toLocaleString()} ج.م</td>
            <td style="padding:8px;text-align:center;" class="mono">${data.ledger.reduce((s,x)=>s+x.credit,0).toLocaleString()} ج.م</td>
            <td style="padding:8px;text-align:center;color:#dc2626;" class="mono">${data.balances.totalDueFromEmployee.toLocaleString()} ج.م</td>
          </tr>
        </tfoot>
      </table>

      <!-- Signatures -->
      <div style="display:flex;justify-content:space-between;margin-top:28px;padding-top:10px;border-top:1px dashed #cbd5e1;font-size:11px;color:#475569;">
        <div style="text-align:center;width:40%;">
          <div>توقيع المدير المالي / HR</div>
          <div style="margin-top:28px;border-bottom:1px dashed #94a3b8;width:80%;margin-left:auto;margin-right:auto;"></div>
        </div>
        <div style="text-align:center;width:40%;">
          <div>توقيع الموظف بالعلم والاعتماد</div>
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

/**
 * نافذة إعداد واعتماد مسير الرواتب الشهري الشامل (Monthly Payroll Run Modal)
 */
function openMonthlyPayrollModal(onDone = null){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'monthlyPayrollModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:12000;display:flex;align-items:center;justify-content:center;padding:16px;';

  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7); // YYYY-MM
  const usersList = (state.users || []).filter(u => u.Name !== 'admin');

  // Pre-calculate suggested deductions for each employee
  const employeesRows = usersList.map(u => {
    const balances = computeEmployeeBalances(u.Name, state);
    // Find active advance installment
    const activeAdv = (state.employeeAdvances || []).find(a => String(a.EmployeeName||'').trim().toLowerCase() === u.Name.toLowerCase() && a.Status !== 'paid');
    let suggestedAdvDeduct = 0;
    if(activeAdv){
      if(activeAdv.RepaymentType === 'installments' && activeAdv.InstallmentAmount > 0){
        suggestedAdvDeduct = Math.min(activeAdv.InstallmentAmount, activeAdv.RemainingBalance);
      } else if(activeAdv.RepaymentType === 'monthly_salary'){
        suggestedAdvDeduct = activeAdv.RemainingBalance;
      }
    }

    const suggestedPurDeduct = balances.purchasesBalance; // Default: deduct unpaid purchases
    const baseSal = Number(u.Salary || 0);

    return {
      name: u.Name,
      role: u.Role,
      baseSalary: baseSal,
      bonus: 0,
      penalties: 0,
      advDeduct: suggestedAdvDeduct,
      purDeduct: suggestedPurDeduct,
      maxAdv: balances.advancesBalance,
      maxPur: balances.purchasesBalance
    };
  });

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,0.3);width:100%;max-width:960px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;border:1px solid #cbd5e1;direction:rtl;text-align:right;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:22px;">📋</span>
          <div>
            <h3 style="margin:0;font-size:17px;font-weight:900;">إعداد واعتماد مسير الرواتب الشهري</h3>
            <div style="font-size:11.5px;color:#c7d2fe;margin-top:2px;">حساب الاستحقاقات والاستقطاعات التلقائية للسلف والمشتريات وترحيل القيود المالية المركبة</div>
          </div>
        </div>
        <button type="button" class="btn btn-ghost btn-xs" id="closePayrollModalBtn" style="color:#fff;font-size:18px;">&times;</button>
      </div>

      <!-- Controls & Month Selector Bar -->
      <div style="padding:12px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <label style="font-size:12.5px;font-weight:800;">شهر المسير:</label>
          <input type="month" id="payrollMonthInp" value="${currentMonthStr}" style="padding:6px 10px;font-size:13px;border-radius:6px;border:1px solid #cbd5e1;" class="mono font-bold">
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <label style="font-size:12.5px;font-weight:800;">طريقة صرف الصافي:</label>
          <select id="payrollPayoutMethodSelect" style="padding:6px 10px;font-size:12.5px;border-radius:6px;border:1px solid #cbd5e1;">
            <option value="نقدي (الخزينة الرئيسية)">الخزينة الرئيسية (النقدية) - ح/ 1101</option>
            <option value="البنك والحسابات الإلكترونية">البنك والحسابات الإلكترونية - ح/ 1102</option>
          </select>
        </div>
      </div>

      <!-- Payroll Table -->
      <div style="padding:14px 20px;overflow-y:auto;flex:1;">
        ${employeesRows.length === 0 ? `
          <div class="empty">لا يوجد موظفون أو فنيون مسجلون بالنظام لإعداد المسير لهم.</div>
        ` : `
          <div class="table-wrap" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <thead style="background:#f1f5f9;border-bottom:1.5px solid #cbd5e1;">
                <tr>
                  <th style="padding:8px 10px;text-align:right;">الموظف</th>
                  <th style="padding:8px;text-align:center;">الراتب الأساسي</th>
                  <th style="padding:8px;text-align:center;color:#047857;">مكافآت (+)</th>
                  <th style="padding:8px;text-align:center;color:#dc2626;">خصومات / جزاءات (-)</th>
                  <th style="padding:8px;text-align:center;color:#b45309;">استقطاع سلفة (-)</th>
                  <th style="padding:8px;text-align:center;color:#9d174d;">استقطاع مشتريات (-)</th>
                  <th style="padding:8px;text-align:center;font-weight:900;background:#e0e7ff;">صافي المستحق</th>
                </tr>
              </thead>
              <tbody id="payrollTableBody">
                ${employeesRows.map((emp, i) => `
                  <tr style="border-bottom:1px solid #f1f5f9;background:${i%2===0?'#fff':'#fafafa'};" data-emprow="${i}">
                    <td style="padding:7px 10px;">
                      <div style="font-weight:800;color:#0f172a;">${escapeHtml(emp.name)}</div>
                      <div style="font-size:10.5px;color:#64748b;">${emp.role}</div>
                    </td>
                    <td style="padding:7px;text-align:center;">
                      <input type="number" class="mono font-bold" data-fld="base" value="${emp.baseSalary}" style="width:75px;padding:3px 5px;text-align:center;font-size:12px;">
                    </td>
                    <td style="padding:7px;text-align:center;">
                      <input type="number" class="mono font-bold" data-fld="bonus" value="${emp.bonus}" style="width:65px;padding:3px 5px;text-align:center;font-size:12px;color:#047857;">
                    </td>
                    <td style="padding:7px;text-align:center;">
                      <input type="number" class="mono font-bold" data-fld="penalties" value="${emp.penalties}" style="width:65px;padding:3px 5px;text-align:center;font-size:12px;color:#dc2626;">
                    </td>
                    <td style="padding:7px;text-align:center;">
                      <input type="number" class="mono font-bold" data-fld="advDeduct" value="${emp.advDeduct}" max="${emp.maxAdv}" style="width:65px;padding:3px 5px;text-align:center;font-size:12px;color:#b45309;" title="السلف المتبقية: ${emp.maxAdv} ج.م">
                      ${emp.maxAdv > 0 ? `<div style="font-size:9.5px;color:#b45309;">(من ${emp.maxAdv})</div>` : ''}
                    </td>
                    <td style="padding:7px;text-align:center;">
                      <input type="number" class="mono font-bold" data-fld="purDeduct" value="${emp.purDeduct}" max="${emp.maxPur}" style="width:65px;padding:3px 5px;text-align:center;font-size:12px;color:#9d174d;" title="المشتريات الآجلة: ${emp.maxPur} ج.م">
                      ${emp.maxPur > 0 ? `<div style="font-size:9.5px;color:#9d174d;">(من ${emp.maxPur})</div>` : ''}
                    </td>
                    <td style="padding:7px;text-align:center;font-weight:900;background:rgba(224,231,255,0.4);" class="mono font-bold net-sal-cell">
                      0 ج.م
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Live Totals Ribbon -->
      <div style="background:#eef2ff;border-top:1px solid #c7d2fe;padding:12px 20px;display:grid;grid-template-columns:1fr 1fr 1fr 1.2fr;gap:10px;font-size:12px;">
        <div>إجمالي الرواتب والاستحقاق: <b class="mono font-bold" id="totalGrossDisp">0 ج.م</b></div>
        <div>إجمالي أقساط السلف: <b class="mono font-bold" style="color:#b45309;" id="totalAdvDeductDisp">0 ج.م</b></div>
        <div>إجمالي المشتريات المستقطعة: <b class="mono font-bold" style="color:#9d174d;" id="totalPurDeductDisp">0 ج.م</b></div>
        <div style="text-align:left;">صافي الصرف الفعلي: <b class="mono font-bold" style="font-size:16px;color:#4338ca;" id="totalNetPaidDisp">0 ج.م</b></div>
      </div>

      <!-- Footer Buttons -->
      <div style="background:#f1f5f9;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #cbd5e1;">
        <button type="button" class="btn btn-ghost btn-sm" id="cancelPayrollModalBtn">إلغاء</button>
        <button type="button" class="btn btn-purple btn-sm font-bold" id="submitPayrollModalBtn" style="padding:8px 24px;font-size:13px;">
          ${getSvgIcon('check', 14)} اعتماد وصرف المسير وترحيل القيود
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const tBody = overlay.querySelector('#payrollTableBody');

  function recalculateAll(){
    let sumGross = 0;
    let sumAdv = 0;
    let sumPur = 0;
    let sumNet = 0;

    overlay.querySelectorAll('[data-emprow]').forEach((row, idx) => {
      const base = Number(row.querySelector('[data-fld="base"]').value) || 0;
      const bonus = Number(row.querySelector('[data-fld="bonus"]').value) || 0;
      const penalties = Number(row.querySelector('[data-fld="penalties"]').value) || 0;
      const advDeduct = Number(row.querySelector('[data-fld="advDeduct"]').value) || 0;
      const purDeduct = Number(row.querySelector('[data-fld="purDeduct"]').value) || 0;

      const gross = round2(base + bonus);
      const net = Math.max(0, round2(gross - penalties - advDeduct - purDeduct));

      row.querySelector('.net-sal-cell').textContent = `${net.toLocaleString()} ج.م`;

      sumGross += gross;
      sumAdv += advDeduct;
      sumPur += purDeduct;
      sumNet += net;
    });

    overlay.querySelector('#totalGrossDisp').textContent = `${round2(sumGross).toLocaleString()} ج.م`;
    overlay.querySelector('#totalAdvDeductDisp').textContent = `${round2(sumAdv).toLocaleString()} ج.م`;
    overlay.querySelector('#totalPurDeductDisp').textContent = `${round2(sumPur).toLocaleString()} ج.م`;
    overlay.querySelector('#totalNetPaidDisp').textContent = `${round2(sumNet).toLocaleString()} ج.م`;
  }

  if(tBody){
    tBody.querySelectorAll('input').forEach(inp => {
      inp.oninput = recalculateAll;
    });
    recalculateAll();
  }

  overlay.querySelector('#closePayrollModalBtn').onclick = () => overlay.remove();
  overlay.querySelector('#cancelPayrollModalBtn').onclick = () => overlay.remove();

  overlay.querySelector('#submitPayrollModalBtn').onclick = async () => {
    const btn = overlay.querySelector('#submitPayrollModalBtn');
    const month = overlay.querySelector('#payrollMonthInp').value;
    const payMethod = overlay.querySelector('#payrollPayoutMethodSelect').value;

    if(!month){ showToast('يرجى تحديد الشهر', 'error'); return; }

    const collected = [];
    overlay.querySelectorAll('[data-emprow]').forEach((row, idx) => {
      const empData = employeesRows[idx];
      collected.push({
        employeeName: empData.name,
        baseSalary: Number(row.querySelector('[data-fld="base"]').value) || 0,
        bonus: Number(row.querySelector('[data-fld="bonus"]').value) || 0,
        penalties: Number(row.querySelector('[data-fld="penalties"]').value) || 0,
        advanceDeduction: Number(row.querySelector('[data-fld="advDeduct"]').value) || 0,
        purchaseDeduction: Number(row.querySelector('[data-fld="purDeduct"]').value) || 0
      });
    });

    const confirmOk = await openConfirmModal({
      title: `اعتماد مسير رواتب شهر [${month}]`,
      message: `هل أنت متأكد من اعتماد وصرف مسير الرواتب لشهر (${month})؟ سيتم تلقائياً ترحيل القيود المالية المركبة واستقطاع أقساط السلف والمشتريات وتوريد صافي الرواتب.`,
      confirmText: 'نعم، اعتماد وصرف المسير',
      cancelText: 'تراجع',
      confirmClass: 'btn-primary'
    });

    if(!confirmOk) return;

    btn.disabled = true;
    btn.textContent = 'جارٍ اعتماد المسير وترحيل القيود...';

    try {
      await executeMonthlyPayrollAction({
        month: month,
        employeesData: collected,
        paymentMethod: payMethod,
        notes: `مسير رواتب شهر ${month}`
      });

      showToast(`تم اعتماد وصرف مسير رواتب شهر (${month}) وترحيل القيود المحاسبية بنجاح`, 'success');
      overlay.remove();
      if(typeof onDone === 'function') onDone();
      else if(state.currentSection === 'finance') {
        const main = document.getElementById('main');
        if(main) renderEmployeeAdvancesPage(main);
      }
    } catch(err){
      showToast(err.message || 'حدث خطأ أثناء اعتماد المسير', 'error');
      btn.disabled = false;
      btn.textContent = 'اعتماد وصرف المسير وترحيل القيود';
    }
  };
}

/* ---------------- 4. Main Employee Advances & HR Dashboard View ---------------- */

function renderEmployeeAdvancesPage(main){
  if(!state.hrTab) state.hrTab = 'advances'; // 'advances' | 'purchases' | 'payroll' | 'staff'

  const allAdvances = state.employeeAdvances || [];
  const activeAdvances = allAdvances.filter(a => a.Status !== 'paid');

  const totalActiveAdvancesAmt = activeAdvances.reduce((s,a) => s + Number(a.RemainingBalance != null ? a.RemainingBalance : a.Amount || 0), 0);
  const totalAllAdvancesDisbursed = allAdvances.reduce((s,a) => s + Number(a.Amount || 0), 0);
  const totalSalariesAllUsers = (state.users || []).reduce((s,u) => s + Number(u.Salary || 0), 0);

  // Compute total active credit purchases across all staff
  let totalStaffPurchases = 0;
  (state.users || []).forEach(u => {
    const b = computeEmployeeBalances(u.Name, state);
    totalStaffPurchases += b.purchasesBalance;
  });

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon('users', 22)} إدارة الموارد البشرية، السلف ومسير الرواتب</h2>
        <div class="subtitle mono" style="font-size:12px;color:var(--ink-secondary);">
          متابعة سلف الموظفين، خطط السداد والأقساط، سقف المشتريات الآجلة، ومسير الرواتب مع القيود المالية المزدوجة
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-green btn-sm font-bold" id="hrNewAdvanceBtn">
          ${getSvgIcon('plus', 14)} صرف سلفة جديدة
        </button>
        <button class="btn btn-blue btn-sm font-bold" id="hrRepayAdvanceBtn">
          ${getSvgIcon('creditCard', 14)} سداد دفعة نقداً
        </button>
        <button class="btn btn-purple btn-sm font-bold" id="hrNewPayrollBtn">
          ${getSvgIcon('fileText', 14)} إعداد مسير الرواتب الشهري
        </button>
      </div>
    </div>

    <!-- KPIs Ribbon -->
    <div class="stat-grid" style="margin-bottom:14px;">
      <div class="stat-card green">
        <div class="top-row"><span class="lbl">رصيد السلف القائمة المستحقة</span><div class="icon-box">💵</div></div>
        <div class="num mono">${totalActiveAdvancesAmt.toLocaleString()} ج.م</div>
        <div style="font-size:10.5px;color:var(--ink-secondary);margin-top:2px;">ح/ 1106 سلف وعهد الموظفين (${activeAdvances.length} سلفة نشطة)</div>
      </div>
      <div class="stat-card red" style="border-color:#fbcfe8;background:linear-gradient(135deg,#fff,#fdf2f8);">
        <div class="top-row"><span class="lbl" style="color:#9d174d;">ذمم مشتريات الموظفين الآجلة</span><div class="icon-box">🛍️</div></div>
        <div class="num mono" style="color:#9d174d;">${totalStaffPurchases.toLocaleString()} ج.م</div>
        <div style="font-size:10.5px;color:var(--ink-secondary);margin-top:2px;">ح/ 1107 مشتريات الموظفين بالآجل</div>
      </div>
      <div class="stat-card blue">
        <div class="top-row"><span class="lbl">إجمالي مسير الرواتب الأساسية</span><div class="icon-box">💼</div></div>
        <div class="num mono">${totalSalariesAllUsers.toLocaleString()} ج.م</div>
        <div style="font-size:10.5px;color:var(--ink-secondary);margin-top:2px;">ح/ 5203 رواتب ومكافآت الموظفين</div>
      </div>
      <div class="stat-card purple">
        <div class="top-row"><span class="lbl">إجمالي السلف المصروفة تاريخياً</span><div class="icon-box">📈</div></div>
        <div class="num mono">${totalAllAdvancesDisbursed.toLocaleString()} ج.م</div>
        <div style="font-size:10.5px;color:var(--ink-secondary);margin-top:2px;">${allAdvances.length} سلفة إجمالية مسجلة</div>
      </div>
    </div>

    <!-- Sub-tabs Navigation -->
    <div class="chip-group" style="margin-bottom:14px;">
      <div class="chip ${state.hrTab==='advances'?'sel':''}" data-hrtab="advances">${getSvgIcon('wallet', 13)} سلف وأقساط الموظفين (${activeAdvances.length})</div>
      <div class="chip ${state.hrTab==='purchases'?'sel':''}" data-hrtab="purchases">${getSvgIcon('pos', 13)} مشتريات الموظفين وسقف الائتمان</div>
      <div class="chip ${state.hrTab==='payroll'?'sel':''}" data-hrtab="payroll">${getSvgIcon('fileText', 13)} أرشيف مسيرات الرواتب (${(state.payrollRuns||[]).length})</div>
      <div class="chip ${state.hrTab==='staff'?'sel':''}" data-hrtab="staff">${getSvgIcon('users', 13)} سجل العاملين وكشوف الحسابات</div>
    </div>

    <!-- Active Tab Container -->
    <div id="hrTabContent"></div>
  `;

  const contentBox = main.querySelector('#hrTabContent');

  if(state.hrTab === 'advances') renderAdvancesTab(contentBox);
  else if(state.hrTab === 'purchases') renderPurchasesTab(contentBox);
  else if(state.hrTab === 'payroll') renderPayrollArchiveTab(contentBox);
  else renderStaffStatementsTab(contentBox);

  // Tab click handlers
  main.querySelectorAll('[data-hrtab]').forEach(chip => {
    chip.onclick = () => {
      state.hrTab = chip.dataset.hrtab;
      renderEmployeeAdvancesPage(main);
    };
  });

  // Top action buttons
  main.querySelector('#hrNewAdvanceBtn').onclick = () => openDisburseAdvanceModal('', () => renderEmployeeAdvancesPage(main));
  main.querySelector('#hrRepayAdvanceBtn').onclick = () => openRepayAdvanceModal('', '', () => renderEmployeeAdvancesPage(main));
  main.querySelector('#hrNewPayrollBtn').onclick = () => openMonthlyPayrollModal(() => renderEmployeeAdvancesPage(main));
}

function renderAdvancesTab(container){
  const allAdvances = state.employeeAdvances || [];

  container.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <h3 style="margin:0;font-size:15px;font-weight:900;">سجل السلف المالية والأقساط</h3>
        <div style="font-size:11.5px;color:var(--ink-secondary);">اضغط على أي سلفة لسداد دفعة أو معاينة كشف حساب الموظف</div>
      </div>

      ${allAdvances.length === 0 ? `
        <div class="empty">لا توجد أي سلف مسجلة حالياً. اضغط على "صرف سلفة جديدة" بالأعلى لتسجيل سلفة.</div>
      ` : `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>الموظف</th>
                <th>تاريخ الصرف</th>
                <th>أصل السلفة</th>
                <th>المتبقي</th>
                <th>خطة السداد</th>
                <th>الأقساط المتبقية</th>
                <th>طريقة الصرف</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              ${allAdvances.slice().reverse().map((a, idx) => {
                const isPaid = a.Status === 'paid' || (a.RemainingBalance != null && a.RemainingBalance <= 0);
                const rem = round2(a.RemainingBalance != null ? a.RemainingBalance : a.Amount || 0);

                return `
                  <tr>
                    <td class="mono font-bold" style="color:var(--ink-secondary);font-size:11px;">${allAdvances.length - idx}</td>
                    <td>
                      <div style="font-weight:900;color:var(--ink);">${escapeHtml(a.EmployeeName)}</div>
                      <div style="font-size:10.5px;color:var(--ink-secondary);">${escapeHtml(a.Reason || 'سلفة')}</div>
                    </td>
                    <td class="mono" style="font-size:11.5px;">${cleanDate(a.Date)}</td>
                    <td class="mono font-bold">${a.Amount.toLocaleString()} ج.م</td>
                    <td class="mono font-bold" style="color:${isPaid ? '#059669' : '#dc2626'};">${rem.toLocaleString()} ج.م</td>
                    <td>
                      <span class="badge" style="background:var(--paper3);border:1px solid var(--line);font-size:10.5px;">
                        ${a.RepaymentType === 'installments' ? `أقساط (${a.InstallmentAmount} ج.م/شهر)` : (a.RepaymentType === 'monthly_salary' ? 'خصم من الراتب' : 'سداد يدوي')}
                      </span>
                    </td>
                    <td class="mono" style="text-align:center;">
                      ${a.RepaymentType === 'installments' ? (isPaid ? 'مكتمل' : `${a.RemainingInstallments || 1} من ${a.TotalInstallments || 1}`) : '-'}
                    </td>
                    <td style="font-size:11px;color:var(--ink-secondary);">${escapeHtml(a.PaymentMethod || 'نقدي')}</td>
                    <td>
                      <span class="status-badge ${isPaid ? 'st-done' : 'st-proc'}" style="font-size:10.5px;">
                        ${isPaid ? 'مسددة بالكامل ✓' : 'قائمة / جارية'}
                      </span>
                    </td>
                    <td class="row-actions">
                      ${!isPaid ? `
                        <button class="btn btn-xs btn-blue" data-advact="repay" data-advid="${a.ID}">
                          ${getSvgIcon('creditCard', 12)} سداد دفعة
                        </button>
                      ` : ''}
                      <button class="btn btn-xs btn-ghost" data-advact="statement" data-emp="${escapeHtml(a.EmployeeName)}">
                        ${getSvgIcon('fileText', 12)} كشف الحساب
                      </button>
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

  container.querySelectorAll('[data-advact="repay"]').forEach(btn => {
    btn.onclick = () => openRepayAdvanceModal(btn.dataset.advid, '', () => renderEmployeeAdvancesPage(document.getElementById('main')));
  });

  container.querySelectorAll('[data-advact="statement"]').forEach(btn => {
    btn.onclick = () => openEmployeeStatementModal(btn.dataset.emp);
  });
}

function renderPurchasesTab(container){
  const usersList = (state.users || []).filter(u => u.Name !== 'admin');

  container.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <div>
          <h3 style="margin:0;font-size:15px;font-weight:900;">مشتريات الموظفين بالآجل وسقف الائتمان</h3>
          <div style="font-size:11.5px;color:var(--ink-secondary);margin-top:2px;">
            تحديد السقف المالي لمشتريات كل موظف ومتابعة مسحوباته من نقطة البيع (حساب 1107)
          </div>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>الموظف</th>
              <th>المسمى الوظيفي</th>
              <th>الراتب الأساسي</th>
              <th>سقف مشتريات الآجل</th>
              <th>المسحوب حالياً (مديونية)</th>
              <th>المتاح للشراء</th>
              <th>نسبة الاستهلاك</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${usersList.map(u => {
              const b = computeEmployeeBalances(u.Name, state);
              const limit = b.purchasesCreditLimit;
              const used = b.purchasesBalance;
              const avail = b.availableCredit;
              const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : (used > 0 ? 100 : 0);

              return `
                <tr>
                  <td>
                    <div style="font-weight:900;color:var(--ink);">${escapeHtml(u.Name)}</div>
                  </td>
                  <td><span class="status-badge st-check" style="font-size:10.5px;">${u.Role}</span></td>
                  <td class="mono font-bold">${b.salary.toLocaleString()} ج.م</td>
                  <td class="mono font-bold" style="color:#0284c7;">${limit.toLocaleString()} ج.م</td>
                  <td class="mono font-bold" style="color:${used>0?'#9d174d':'var(--ink)'};">${used.toLocaleString()} ج.م</td>
                  <td class="mono font-bold" style="color:${avail>0?'#059669':'#dc2626'};">${avail.toLocaleString()} ج.م</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <div style="flex:1;background:var(--paper3);border:1px solid var(--line);border-radius:999px;height:7px;overflow:hidden;min-width:60px;">
                        <div style="width:${pct}%;background:${pct>85?'#dc2626':(pct>50?'#d97706':'#059669')};height:100%;"></div>
                      </div>
                      <span class="mono" style="font-size:10.5px;min-width:28px;">${pct}%</span>
                    </div>
                  </td>
                  <td class="row-actions">
                    ${used > 0 ? `
                      <button class="btn btn-xs btn-primary" data-purchact="repay" data-emp="${escapeHtml(u.Name)}" style="background:#9d174d;border-color:#831843;">
                        سداد مشتريات
                      </button>
                    ` : ''}
                    <button class="btn btn-xs btn-ghost" data-purchact="statement" data-emp="${escapeHtml(u.Name)}">
                      كشف الحساب
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-purchact="repay"]').forEach(btn => {
    btn.onclick = () => openRepayEmployeePurchasesModal(btn.dataset.emp, () => renderEmployeeAdvancesPage(document.getElementById('main')));
  });

  container.querySelectorAll('[data-purchact="statement"]').forEach(btn => {
    btn.onclick = () => openEmployeeStatementModal(btn.dataset.emp);
  });
}

function renderPayrollArchiveTab(container){
  const payrolls = state.payrollRuns || [];

  container.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <h3 style="margin:0;font-size:15px;font-weight:900;">أرشيف مسيرات الرواتب الشهرية المعتمدة</h3>
        <button class="btn btn-purple btn-xs font-bold" id="archiveNewPayrollBtn">
          ${getSvgIcon('plus', 12)} مسير شهر جديد
        </button>
      </div>

      ${payrolls.length === 0 ? `
        <div class="empty">لم يتم اعتماد أي مسير رواتب شهري حتى الآن. اضغط على "إعداد مسير الرواتب الشهري" بالبداية.</div>
      ` : `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>شهر المسير</th>
                <th>تاريخ الصرف</th>
                <th>عدد الموظفين</th>
                <th>إجمالي الاستحقاق</th>
                <th>استقطاع السلف</th>
                <th>استقطاع المشتريات</th>
                <th>الجزاءات</th>
                <th>صافي المنصرف نقداً</th>
                <th>طريقة الصرف</th>
                <th>المسؤول</th>
              </tr>
            </thead>
            <tbody>
              ${payrolls.slice().reverse().map(p => `
                <tr>
                  <td class="mono font-bold" style="font-size:13px;color:#4338ca;">${p.Month}</td>
                  <td class="mono" style="font-size:11.5px;">${cleanDate(p.Date)}</td>
                  <td class="mono" style="text-align:center;">${p.EmployeesCount || '-'}</td>
                  <td class="mono font-bold">${Number(p.TotalGross||0).toLocaleString()} ج.م</td>
                  <td class="mono font-bold" style="color:#b45309;">${Number(p.TotalAdvancesDeducted||0).toLocaleString()} ج.م</td>
                  <td class="mono font-bold" style="color:#9d174d;">${Number(p.TotalPurchasesDeducted||0).toLocaleString()} ج.م</td>
                  <td class="mono" style="color:#dc2626;">${Number(p.TotalPenalties||0).toLocaleString()} ج.م</td>
                  <td class="mono font-bold" style="color:#059669;font-size:13px;">${Number(p.TotalNetPaid||0).toLocaleString()} ج.م</td>
                  <td style="font-size:11px;color:var(--ink-secondary);">${escapeHtml(p.PaymentMethod || 'نقدي')}</td>
                  <td style="font-size:11px;">${escapeHtml(p.ProcessedBy || 'نظام')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;

  const btn = container.querySelector('#archiveNewPayrollBtn');
  if(btn) btn.onclick = () => openMonthlyPayrollModal(() => renderEmployeeAdvancesPage(document.getElementById('main')));
}

function renderStaffStatementsTab(container){
  const usersList = (state.users || []).filter(u => u.Name !== 'admin');

  container.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <h3 style="margin:0;font-size:15px;font-weight:900;">دليل العاملين وكشوف الحسابات الفورية</h3>
        <div style="font-size:11.5px;color:var(--ink-secondary);">معاينة وطباعة كشف حساب أي موظف أو فني بنقرة واحدة</div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>الموظف</th>
              <th>المسمى</th>
              <th>الراتب الشهري</th>
              <th>سقف مشتريات الآجل</th>
              <th>سلف قائمة</th>
              <th>مشتريات آجلة</th>
              <th>إجمالي المديونية الحالية</th>
              <th>كشف الحساب</th>
            </tr>
          </thead>
          <tbody>
            ${usersList.map(u => {
              const b = computeEmployeeBalances(u.Name, state);
              return `
                <tr>
                  <td><b>${escapeHtml(u.Name)}</b></td>
                  <td><span class="status-badge st-check" style="font-size:10.5px;">${u.Role}</span></td>
                  <td class="mono font-bold">${b.salary.toLocaleString()} ج.م</td>
                  <td class="mono font-bold" style="color:#0284c7;">${b.purchasesCreditLimit.toLocaleString()} ج.م</td>
                  <td class="mono font-bold" style="color:${b.advancesBalance>0?'#b45309':'var(--ink)'};">${b.advancesBalance.toLocaleString()} ج.م</td>
                  <td class="mono font-bold" style="color:${b.purchasesBalance>0?'#9d174d':'var(--ink)'};">${b.purchasesBalance.toLocaleString()} ج.م</td>
                  <td class="mono font-bold" style="color:${b.totalDueFromEmployee>0?'#dc2626':'#059669'};">${b.totalDueFromEmployee.toLocaleString()} ج.م</td>
                  <td>
                    <button class="btn btn-xs btn-purple" data-staffact="statement" data-emp="${escapeHtml(u.Name)}">
                      ${getSvgIcon('fileText', 12)} عرض وطباعة كشف الحساب
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-staffact="statement"]').forEach(btn => {
    btn.onclick = () => openEmployeeStatementModal(btn.dataset.emp);
  });
}

// Global window mappings for modular and inline access
if(typeof window !== 'undefined'){
  window.openDisburseAdvanceModal = openDisburseAdvanceModal;
  window.openRepayAdvanceModal = openRepayAdvanceModal;
  window.openRepayEmployeePurchasesModal = openRepayEmployeePurchasesModal;
  window.openEmployeeStatementModal = openEmployeeStatementModal;
  window.openMonthlyPayrollModal = openMonthlyPayrollModal;
  window.renderEmployeeAdvancesPage = renderEmployeeAdvancesPage;
  window.disburseEmployeeAdvanceAction = disburseEmployeeAdvanceAction;
  window.repayEmployeeAdvanceAction = repayEmployeeAdvanceAction;
  window.repayEmployeePurchasesAction = repayEmployeePurchasesAction;
  window.executeMonthlyPayrollAction = executeMonthlyPayrollAction;
}
