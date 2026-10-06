import { describe, it, expect } from 'vitest';
import FinanceEngine from '../app-modular/js/core/09-finance-engine.js';

const {
  isBalancedEntry,
  validateJournalEntryLines,
  computeAccountNetBalance,
  computeTrialBalance
} = FinanceEngine;

describe('Double-Entry Journal & Ledger Engine', () => {
  describe('isBalancedEntry()', () => {
    it('returns true when total debits strictly equal total credits', () => {
      const lines = [
        { AccountCode: '1101', Debit: 1000, Credit: 0 },
        { AccountCode: '4101', Debit: 0, Credit: 1000 }
      ];
      expect(isBalancedEntry(lines)).toBe(true);
    });

    it('returns true for multi-leg split balanced entries', () => {
      const lines = [
        { AccountCode: '1101', Debit: 600, Credit: 0 },
        { AccountCode: '1103', Debit: 400, Credit: 0 },
        { AccountCode: '4101', Debit: 0, Credit: 1000 }
      ];
      expect(isBalancedEntry(lines)).toBe(true);
    });

    it('returns false when entries are unbalanced', () => {
      const lines = [
        { AccountCode: '1101', Debit: 1000, Credit: 0 },
        { AccountCode: '4101', Debit: 0, Credit: 950 }
      ];
      expect(isBalancedEntry(lines)).toBe(false);
    });

    it('returns false when lines array is empty or has fewer than 2 lines', () => {
      expect(isBalancedEntry([])).toBe(false);
      expect(isBalancedEntry([{ AccountCode: '1101', Debit: 1000, Credit: 0 }])).toBe(false);
    });
  });

  describe('validateJournalEntryLines()', () => {
    it('approves a compliant double-entry journal entry', () => {
      const lines = [
        { AccountCode: '5201', AccountName: 'إيجار المقر', Debit: 5000, Credit: 0 },
        { AccountCode: '1101', AccountName: 'الخزينة الرئيسية', Debit: 0, Credit: 5000 }
      ];
      const res = validateJournalEntryLines(lines);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
      expect(res.totalDebit).toBe(5000);
      expect(res.totalCredit).toBe(5000);
      expect(res.difference).toBe(0);
    });

    it('flags missing account codes', () => {
      const lines = [
        { AccountCode: '', Debit: 100, Credit: 0 },
        { AccountCode: '1101', Debit: 0, Credit: 100 }
      ];
      const res = validateJournalEntryLines(lines);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('رقم الحساب مفقود'))).toBe(true);
    });

    it('flags negative amounts', () => {
      const lines = [
        { AccountCode: '1101', Debit: -50, Credit: 0 },
        { AccountCode: '4101', Debit: 0, Credit: -50 }
      ];
      const res = validateJournalEntryLines(lines);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('لا يمكن أن تكون المبالغ سالبة'))).toBe(true);
    });

    it('flags simultaneous debit and credit on the same line', () => {
      const lines = [
        { AccountCode: '1101', Debit: 100, Credit: 50 },
        { AccountCode: '4101', Debit: 0, Credit: 50 }
      ];
      const res = validateJournalEntryLines(lines);
      expect(res.valid).toBe(false);
      expect(res.errors.some(e => e.includes('في المدين والدائن معاً'))).toBe(true);
    });

    it('flags imbalance difference', () => {
      const lines = [
        { AccountCode: '1101', Debit: 1000, Credit: 0 },
        { AccountCode: '4101', Debit: 0, Credit: 800 }
      ];
      const res = validateJournalEntryLines(lines);
      expect(res.valid).toBe(false);
      expect(res.difference).toBe(200);
      expect(res.errors.some(e => e.includes('القيد غير متزن'))).toBe(true);
    });
  });

  describe('computeAccountNetBalance()', () => {
    it('computes debit-nature accounts (Assets & Expenses): Debit - Credit', () => {
      // Asset account: 1000 in, 300 out -> Net = 700
      expect(computeAccountNetBalance('مدين', 1000, 300)).toBe(700);
      // Overdrawn asset: 200 in, 500 out -> Net = -300
      expect(computeAccountNetBalance('مدين', 200, 500)).toBe(-300);
    });

    it('computes credit-nature accounts (Liabilities, Equity, Revenue): Credit - Debit', () => {
      // Revenue account: 5000 sales, 200 returns -> Net = 4800
      expect(computeAccountNetBalance('دائن', 200, 5000)).toBe(4800);
      // Supplier liability: 10000 purchases, 6000 paid -> Net = 4000
      expect(computeAccountNetBalance('دائن', 6000, 10000)).toBe(4000);
    });
  });

  describe('computeTrialBalance()', () => {
    const mockAccounts = [
      { Code: '1101', Name: 'الخزينة الرئيسية', Nature: 'مدين' },
      { Code: '1103', Name: 'العملاء والمدينون', Nature: 'مدين' },
      { Code: '2101', Name: 'الموردون والدائنون', Nature: 'دائن' },
      { Code: '3101', Name: 'رأس المال', Nature: 'دائن' },
      { Code: '4101', Name: 'إيرادات خدمات صيانة', Nature: 'دائن' },
      { Code: '5201', Name: 'إيجار المقر', Nature: 'مدين' }
    ];

    it('calculates a balanced trial balance from matching journal entries', () => {
      const entries = [
        // Entry 1: Capital deposit (Debit Cash 50,000 / Credit Capital 50,000)
        {
          Lines: [
            { AccountCode: '1101', Debit: 50000, Credit: 0 },
            { AccountCode: '3101', Debit: 0, Credit: 50000 }
          ]
        },
        // Entry 2: Pay Rent (Debit Rent 5,000 / Credit Cash 5,000)
        {
          Lines: [
            { AccountCode: '5201', Debit: 5000, Credit: 0 },
            { AccountCode: '1101', Debit: 0, Credit: 5000 }
          ]
        },
        // Entry 3: Maintenance Revenue (Debit Cash 2,000 / Credit Revenue 2,000)
        {
          Lines: [
            { AccountCode: '1101', Debit: 2000, Credit: 0 },
            { AccountCode: '4101', Debit: 0, Credit: 2000 }
          ]
        }
      ];

      const trial = computeTrialBalance(mockAccounts, entries);

      expect(trial.isBalanced).toBe(true);
      expect(trial.totalDebits).toBe(57000);
      expect(trial.totalCredits).toBe(57000);
      expect(trial.difference).toBe(0);

      // Verify specific account net balances
      const cashRow = trial.rows.find(r => r.code === '1101');
      expect(cashRow.netBalance).toBe(47000); // 50000 + 2000 - 5000

      const capitalRow = trial.rows.find(r => r.code === '3101');
      expect(capitalRow.netBalance).toBe(50000);

      const rentRow = trial.rows.find(r => r.code === '5201');
      expect(rentRow.netBalance).toBe(5000);
    });

    it('detects and flags imbalanced ledgers accurately', () => {
      const entries = [
        {
          Lines: [
            { AccountCode: '1101', Debit: 5000, Credit: 0 },
            { AccountCode: '4101', Debit: 0, Credit: 4500 } // missing 500
          ]
        }
      ];

      const trial = computeTrialBalance(mockAccounts, entries);
      expect(trial.isBalanced).toBe(false);
      expect(trial.difference).toBe(500);
    });
  });
});
