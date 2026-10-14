import { describe, it, expect } from 'vitest';
import FinanceEngine from '../app-modular/js/core/09-finance-engine.js';

const {
  computeEmployeeBalances,
  checkEmployeeCreditLimit,
  buildAdvanceDisbursementJournalLines,
  buildAdvanceRepaymentJournalLines,
  buildEmployeePurchasePaymentJournalLines,
  buildPayrollJournalLines,
  isBalancedEntry,
  validateJournalEntryLines
} = FinanceEngine;

describe('HR, Employee Advances & Credit Limit Engine', () => {
  const mockAppState = {
    users: [
      { Name: 'أحمد فني', Salary: 6000, PurchasesCreditLimit: 2000 },
      { Name: 'محمود كاشير', Salary: 4500, PurchasesCreditLimit: 1000 },
      { Name: 'علي جديد', Salary: 3000, PurchasesCreditLimit: 0 }
    ],
    employeeAdvances: [
      {
        ID: 'adv_1',
        EmployeeName: 'أحمد فني',
        Amount: 1500,
        RemainingBalance: 1000,
        Status: 'active'
      },
      {
        ID: 'adv_2',
        EmployeeName: 'أحمد فني',
        Amount: 500,
        RemainingBalance: 0,
        Status: 'paid'
      }
    ],
    employeeAdvanceRepayments: [
      {
        ID: 'rep_1',
        AdvanceID: 'adv_1',
        EmployeeName: 'أحمد فني',
        Amount: 500,
        Type: 'cash'
      },
      {
        ID: 'rep_2',
        EmployeeName: 'أحمد فني',
        Amount: 300,
        Type: 'purchase_repayment_cash'
      }
    ],
    sales: [
      {
        ID: 'sale_1',
        CustomerName: 'أحمد فني',
        Total: 800,
        PaymentMethod: 'آجل موظف (حساب الموظف)',
        SplitsJSON: JSON.stringify([{ methodId: 'employee_credit', methodName: 'آجل موظف', amount: 800 }])
      }
    ]
  };

  describe('computeEmployeeBalances()', () => {
    it('computes correct balances for employee with advances and credit purchases', () => {
      const b = computeEmployeeBalances('أحمد فني', mockAppState);
      expect(b.salary).toBe(6000);
      expect(b.purchasesCreditLimit).toBe(2000);
      expect(b.advancesBalance).toBe(1000); // 1500 - 500 repaid = 1000 active
      expect(b.purchasesBalance).toBe(500); // 800 purchases - 300 repayment = 500
      expect(b.availableCredit).toBe(1500); // 2000 limit - 500 used = 1500 available
      expect(b.totalDueFromEmployee).toBe(1500); // 1000 advances + 500 purchases
      expect(b.activeAdvancesCount).toBe(1);
    });

    it('handles employee with zero advances and zero purchases', () => {
      const b = computeEmployeeBalances('محمود كاشير', mockAppState);
      expect(b.salary).toBe(4500);
      expect(b.purchasesCreditLimit).toBe(1000);
      expect(b.advancesBalance).toBe(0);
      expect(b.purchasesBalance).toBe(0);
      expect(b.availableCredit).toBe(1000);
      expect(b.totalDueFromEmployee).toBe(0);
    });
  });

  describe('checkEmployeeCreditLimit()', () => {
    it('approves purchase within credit limit', () => {
      const res = checkEmployeeCreditLimit('أحمد فني', 1000, mockAppState);
      expect(res.allowed).toBe(true);
      expect(res.reason).toBe('within_limit');
      expect(res.availableCredit).toBe(1500);
      expect(res.excess).toBe(0);
    });

    it('rejects purchase exceeding credit limit', () => {
      const res = checkEmployeeCreditLimit('أحمد فني', 1800, mockAppState);
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('limit_exceeded');
      expect(res.excess).toBe(300); // 500 current + 1800 = 2300 vs 2000 limit
    });

    it('rejects purchase when credit limit is 0', () => {
      const res = checkEmployeeCreditLimit('علي جديد', 200, mockAppState);
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe('no_credit_limit');
    });
  });

  describe('Accounting Double-Entry Validation', () => {
    it('creates perfectly balanced advance disbursement entry (Dr 1106 / Cr 1101)', () => {
      const lines = buildAdvanceDisbursementJournalLines({
        employeeName: 'أحمد فني',
        amount: 2500,
        paymentMethod: 'نقدي (الخزينة)'
      });
      expect(isBalancedEntry(lines)).toBe(true);
      expect(lines).toHaveLength(2);
      expect(lines[0].AccountCode).toBe('1106');
      expect(lines[0].Debit).toBe(2500);
      expect(lines[1].AccountCode).toBe('1101');
      expect(lines[1].Credit).toBe(2500);
      const val = validateJournalEntryLines(lines);
      expect(val.valid).toBe(true);
    });

    it('creates balanced advance repayment entry (Dr 1101 / Cr 1106)', () => {
      const lines = buildAdvanceRepaymentJournalLines({
        employeeName: 'أحمد فني',
        amount: 500,
        paymentMethod: 'نقدي (الخزينة)'
      });
      expect(isBalancedEntry(lines)).toBe(true);
      expect(lines[0].AccountCode).toBe('1101');
      expect(lines[0].Debit).toBe(500);
      expect(lines[1].AccountCode).toBe('1106');
      expect(lines[1].Credit).toBe(500);
    });

    it('creates balanced employee purchase repayment entry (Dr 1101 / Cr 1107)', () => {
      const lines = buildEmployeePurchasePaymentJournalLines({
        employeeName: 'أحمد فني',
        amount: 350,
        paymentMethod: 'نقدي (الخزينة)'
      });
      expect(isBalancedEntry(lines)).toBe(true);
      expect(lines[0].AccountCode).toBe('1101');
      expect(lines[0].Debit).toBe(350);
      expect(lines[1].AccountCode).toBe('1107');
      expect(lines[1].Credit).toBe(350);
    });

    it('creates compound balanced monthly payroll run entry', () => {
      // Gross salaries: 15,000
      // Advances deducted: 2,000 (Cr 1106)
      // Purchases deducted: 1,000 (Cr 1107)
      // Penalties: 500 (Cr 4201)
      // Net cash paid: 11,500 (Cr 1101)
      // Total Debits: 15,000 | Total Credits: 2000 + 1000 + 500 + 11500 = 15,000
      const lines = buildPayrollJournalLines({
        month: '2026-10',
        totalGross: 15000,
        totalAdvancesDeducted: 2000,
        totalPurchasesDeducted: 1000,
        totalPenalties: 500,
        totalNetPaid: 11500,
        paymentMethod: 'نقدي (الخزينة)'
      });

      expect(isBalancedEntry(lines)).toBe(true);
      const val = validateJournalEntryLines(lines);
      expect(val.valid).toBe(true);
      expect(val.totalDebit).toBe(15000);
      expect(val.totalCredit).toBe(15000);
      expect(val.difference).toBe(0);
    });
  });
});
