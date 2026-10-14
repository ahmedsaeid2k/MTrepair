import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import FinanceEngine from '../app-modular/js/core/09-finance-engine.js';

describe('Historical Journal Entries Reconciliation Engine', () => {
  let context;

  beforeEach(() => {
    // Set up a mock browser/app environment for 04-chart-of-accounts.js
    const state = {
      journalEntries: [],
      sales: [],
      purchases: [],
      payments: [],
      receipts: [],
      invoices: [],
      expenses: [],
      employeeAdvances: [],
      employeeAdvanceRepayments: [],
      payrollRuns: [],
      accounts: [
        { Code: '1101', Name: 'الخزينة الرئيسية (النقدية)', Nature: 'مدين' },
        { Code: '1102', Name: 'البنك والحسابات الإلكترونية والمحافظ', Nature: 'مدين' },
        { Code: '1103', Name: 'العملاء والمدينون', Nature: 'مدين' },
        { Code: '1104', Name: 'مخزون البضائع وقطع الغيار', Nature: 'مدين' },
        { Code: '1106', Name: 'سلف وعهد الموظفين', Nature: 'مدين' },
        { Code: '1107', Name: 'مشتريات الموظفين بالآجل', Nature: 'مدين' },
        { Code: '2101', Name: 'الموردون والدائنون', Nature: 'دائن' },
        { Code: '3103', Name: 'جاري الشركاء والمسحوبات', Nature: 'دائن' },
        { Code: '4101', Name: 'إيرادات خدمات صيانة وتصليح', Nature: 'دائن' },
        { Code: '4102', Name: 'إيرادات مبيعات بضائع وقطع غيار', Nature: 'دائن' },
        { Code: '4201', Name: 'إيرادات وأرباح متنوعة وزيادة الجرد', Nature: 'دائن' },
        { Code: '5102', Name: 'تكلفة البضاعة المباعة (POS)', Nature: 'مدين' },
        { Code: '5203', Name: 'رواتب ومكافآت الفنيين والموظفين', Nature: 'مدين' },
        { Code: '5208', Name: 'مصروفات تشغيلية أخرى وفروق الدرج', Nature: 'مدين' }
      ]
    };

    context = {
      state,
      round2: (n) => Math.round(Number(n || 0) * 100) / 100,
      getNextJournalEntryNumber: () => 'JE-' + Math.floor(1000 + Math.random() * 9000),
      setCache: () => {},
      invalidateAccountStatsCache: () => {},
      FinanceEngine,
      buildPayrollJournalLines: FinanceEngine.buildPayrollJournalLines,
      console: { log: () => {}, warn: () => {}, error: () => {} }
    };
    context.window = context;
    context.global = context;
    vm.createContext(context);

    // Load 04-chart-of-accounts.js into context
    const coaPath = path.join(process.cwd(), 'app-modular/js/core/04-chart-of-accounts.js');
    const coaCode = fs.readFileSync(coaPath, 'utf8');
    vm.runInContext(coaCode, context);
  });

  it('reconciles employee advances (Dr 1106 / Cr 1101 or 1102)', () => {
    context.state.employeeAdvances = [
      {
        ID: 'adv_101',
        EmployeeName: 'أحمد محمود',
        Amount: 1200,
        Date: '2026-10-01',
        PaymentMethod: 'نقدي (الخزينة)'
      },
      {
        ID: 'adv_102',
        EmployeeName: 'سارة علي',
        Amount: 800,
        Date: '2026-10-02',
        PaymentMethod: 'تحويل بنكي / فودافون كاش'
      }
    ];

    const entries = vm.runInContext('reconcileHistoricalJournalEntries()', context);
    const advEntries = entries.filter(e => e.ReferenceType === 'Employee_Advance');

    expect(advEntries).toHaveLength(2);

    // Cash advance: Dr 1106 / Cr 1101
    const cashAdv = advEntries.find(e => e.ReferenceID === 'adv_101');
    expect(cashAdv.Lines[0].AccountCode).toBe('1106');
    expect(cashAdv.Lines[0].Debit).toBe(1200);
    expect(cashAdv.Lines[1].AccountCode).toBe('1101');
    expect(cashAdv.Lines[1].Credit).toBe(1200);
    expect(FinanceEngine.isBalancedEntry(cashAdv.Lines)).toBe(true);

    // Bank advance: Dr 1106 / Cr 1102
    const bankAdv = advEntries.find(e => e.ReferenceID === 'adv_102');
    expect(bankAdv.Lines[0].AccountCode).toBe('1106');
    expect(bankAdv.Lines[0].Debit).toBe(800);
    expect(bankAdv.Lines[1].AccountCode).toBe('1102');
    expect(bankAdv.Lines[1].Credit).toBe(800);
    expect(FinanceEngine.isBalancedEntry(bankAdv.Lines)).toBe(true);
  });

  it('reconciles advance repayments and employee purchase repayments, ignoring payroll deductions', () => {
    context.state.employeeAdvanceRepayments = [
      {
        ID: 'rep_cash_1',
        EmployeeName: 'أحمد محمود',
        Amount: 500,
        Date: '2026-10-05',
        Type: 'cash',
        PaymentMethod: 'نقدي (الخزينة)'
      },
      {
        ID: 'rep_pur_1',
        EmployeeName: 'سارة علي',
        Amount: 350,
        Date: '2026-10-06',
        Type: 'purchase_repayment_cash',
        PaymentMethod: 'فودافون كاش'
      },
      {
        ID: 'rep_deduct_payroll',
        EmployeeName: 'أحمد محمود',
        Amount: 700,
        Date: '2026-10-31',
        Type: 'payroll_deduction',
        PaymentMethod: 'استقطاع من الراتب'
      }
    ];

    const entries = vm.runInContext('reconcileHistoricalJournalEntries()', context);

    const advRep = entries.find(e => e.ReferenceType === 'Advance_Repayment');
    expect(advRep).toBeDefined();
    expect(advRep.Lines[0].AccountCode).toBe('1101'); // Dr Cash
    expect(advRep.Lines[0].Debit).toBe(500);
    expect(advRep.Lines[1].AccountCode).toBe('1106'); // Cr Advance
    expect(advRep.Lines[1].Credit).toBe(500);
    expect(FinanceEngine.isBalancedEntry(advRep.Lines)).toBe(true);

    const purRep = entries.find(e => e.ReferenceType === 'Employee_Purchase_Repayment');
    expect(purRep).toBeDefined();
    expect(purRep.Lines[0].AccountCode).toBe('1102'); // Dr Bank/Wallet
    expect(purRep.Lines[0].Debit).toBe(350);
    expect(purRep.Lines[1].AccountCode).toBe('1107'); // Cr Employee Purchases
    expect(purRep.Lines[1].Credit).toBe(350);
    expect(FinanceEngine.isBalancedEntry(purRep.Lines)).toBe(true);

    // Payroll deduction must not create an isolated separate entry (it belongs in compound payroll run)
    const payrollRepEntry = entries.find(e => e.ReferenceID === 'rep_deduct_payroll');
    expect(payrollRepEntry).toBeUndefined();
  });

  it('reconciles compound monthly payroll run with gross, deductions, and net payouts', () => {
    context.state.payrollRuns = [
      {
        ID: 'payrun_2026_10',
        Month: '2026-10',
        Date: '2026-10-31',
        TotalGross: 12000,
        TotalAdvancesDeducted: 1500,
        TotalPurchasesDeducted: 500,
        TotalPenalties: 200,
        TotalNetPaid: 9800,
        PaymentMethod: 'نقدي (الخزينة)',
        ProcessedBy: 'المدير العام'
      }
    ];

    const entries = vm.runInContext('reconcileHistoricalJournalEntries()', context);
    const payEntry = entries.find(e => e.ReferenceType === 'Payroll_Run');

    expect(payEntry).toBeDefined();
    expect(payEntry.TotalDebit).toBe(12000);
    expect(payEntry.TotalCredit).toBe(12000);
    expect(FinanceEngine.isBalancedEntry(payEntry.Lines)).toBe(true);

    const debitSalary = payEntry.Lines.find(l => l.AccountCode === '5203');
    expect(debitSalary.Debit).toBe(12000);

    const crAdv = payEntry.Lines.find(l => l.AccountCode === '1106');
    expect(crAdv.Credit).toBe(1500);

    const crPur = payEntry.Lines.find(l => l.AccountCode === '1107');
    expect(crPur.Credit).toBe(500);

    const crPen = payEntry.Lines.find(l => l.AccountCode === '4201');
    expect(crPen.Credit).toBe(200);

    const crCash = payEntry.Lines.find(l => l.AccountCode === '1101');
    expect(crCash.Credit).toBe(9800);
  });

  it('routes POS sales with employee credit to account 1107, bank card to 1102, and cash to 1101', () => {
    context.state.sales = [
      // 1. Employee credit sale
      {
        ID: 'sale_emp_credit',
        Date: '2026-10-10',
        Total: 900,
        AmountPaid: 0,
        PaymentMethod: 'employee_credit',
        CustomerName: 'أحمد فني'
      },
      // 2. Electronic payment sale (InstaPay / Visa)
      {
        ID: 'sale_electronic',
        Date: '2026-10-11',
        Total: 450,
        AmountPaid: 450,
        PaymentMethod: 'انستاباي / محفظة',
        CustomerName: 'عميل إلكتروني'
      },
      // 3. Regular Cash sale
      {
        ID: 'sale_cash',
        Date: '2026-10-12',
        Total: 300,
        AmountPaid: 300,
        PaymentMethod: 'نقدي',
        CustomerName: 'عميل نقدي'
      }
    ];

    const entries = vm.runInContext('reconcileHistoricalJournalEntries()', context);

    const empSaleEntry = entries.find(e => e.ReferenceID === 'sale_emp_credit');
    expect(empSaleEntry.Lines.some(l => l.AccountCode === '1107' && l.Debit === 900)).toBe(true);
    expect(empSaleEntry.Lines.some(l => l.AccountCode === '1103')).toBe(false); // Must NOT be 1103

    const elecSaleEntry = entries.find(e => e.ReferenceID === 'sale_electronic');
    expect(elecSaleEntry.Lines.some(l => l.AccountCode === '1102' && l.Debit === 450)).toBe(true);

    const cashSaleEntry = entries.find(e => e.ReferenceID === 'sale_cash');
    expect(cashSaleEntry.Lines.some(l => l.AccountCode === '1101' && l.Debit === 300)).toBe(true);
  });

  it('reconciles supplier payments (Dr 2101), owner drawings (Dr 3103), and POS returns (Dr 4102)', () => {
    context.state.expenses = [
      {
        ID: 'exp_sup_1',
        Amount: 3000,
        Category: 'سداد موردين ومشتريات',
        PaymentMethod: 'تحويل بنكي',
        Title: 'سداد دفعة لمورد الشاشات'
      },
      {
        ID: 'exp_draw_1',
        Amount: 1500,
        Category: 'مسحوبات شخصية',
        PaymentMethod: 'نقدي',
        Title: 'مسحوبات الشريك'
      },
      {
        ID: 'exp_ret_1',
        Amount: 250,
        Category: 'مرتجع مبيعات POS',
        PaymentMethod: 'نقدي',
        Title: 'إرجاع شاحن تالف'
      }
    ];

    const entries = vm.runInContext('reconcileHistoricalJournalEntries()', context);

    const supEntry = entries.find(e => e.ReferenceType === 'SupplierPayment');
    expect(supEntry).toBeDefined();
    expect(supEntry.Lines[0].AccountCode).toBe('2101'); // Dr Supplier
    expect(supEntry.Lines[0].Debit).toBe(3000);
    expect(supEntry.Lines[1].AccountCode).toBe('1102'); // Cr Bank
    expect(supEntry.Lines[1].Credit).toBe(3000);

    const drawEntry = entries.find(e => e.ReferenceType === 'CashOut');
    expect(drawEntry).toBeDefined();
    expect(drawEntry.Lines[0].AccountCode).toBe('3103'); // Dr Drawings
    expect(drawEntry.Lines[0].Debit).toBe(1500);
    expect(drawEntry.Lines[1].AccountCode).toBe('1101'); // Cr Cash
    expect(drawEntry.Lines[1].Credit).toBe(1500);

    const retEntry = entries.find(e => e.ReferenceType === 'POS_Return');
    expect(retEntry).toBeDefined();
    expect(retEntry.Lines[0].AccountCode).toBe('4102'); // Dr Sales Returns
    expect(retEntry.Lines[0].Debit).toBe(250);
    expect(retEntry.Lines[1].AccountCode).toBe('1101'); // Cr Cash
    expect(retEntry.Lines[1].Credit).toBe(250);
  });
});
