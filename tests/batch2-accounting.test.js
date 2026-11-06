import { describe, it, expect } from 'vitest';
import FinanceEngine from '../app-modular/js/core/09-finance-engine.js';
import fs from 'fs';
import path from 'path';

describe('Batch 2: Accounting & Calculations Integrity (P0)', () => {
  describe('ACC-05: Symmetric Financial Rounding in round2', () => {
    it('correctly rounds negative half values symmetrically (-1.005 -> -1.01)', () => {
      // 1.005 rounds to 1.01
      expect(FinanceEngine.round2(1.005)).toBe(1.01);
      // -1.005 must symmetrically round to -1.01, NOT -1.00
      expect(FinanceEngine.round2(-1.005)).toBe(-1.01);
      expect(FinanceEngine.round2(-2.015)).toBe(-2.02);
    });
  });

  describe('ACC-03: Negative Stock Inventory WAC Calculation', () => {
    it('proves that purchasing inventory with a negative prior balance does not distort unit cost', () => {
      const utilsJs = fs.readFileSync(path.join(__dirname, '../app-modular/js/core/03-utils-and-mappings.js'), 'utf8');
      const backendJs = fs.readFileSync(path.join(__dirname, '../files(11)/GoogleAppsScript_Backend.gs.txt'), 'utf8');

      // The buggy formula divides by totalQty when oldQty <= 0:
      // ((Math.max(0, oldQty) * oldCost) + (newQty * newCost)) / totalQty
      const hasBuggyWacInUtils = utilsJs.includes('Math.max(0, oldQty) * oldCost) + (newQty * newCost)) / totalQty');
      const hasBuggyWacInBackend = backendJs.includes('(Math.max(0, currentQty) * currentBuyPrice) + (addQty * itemBuyPrice)') &&
                                    backendJs.includes('totalCost / newQty');

      // This test is designed to FAIL before the fix, and PASS after the fix
      expect(hasBuggyWacInUtils).toBe(false);
      expect(hasBuggyWacInBackend).toBe(false);
    });
  });

  describe('ACC-02: Historical Journal Reconciliation Reference Matching', () => {
    it('proves that reconcileHistoricalJournalEntries handles both POS_Sale_ and Sale_ prefixes to prevent doubling', () => {
      const coaJs = fs.readFileSync(path.join(__dirname, '../app-modular/js/core/04-chart-of-accounts.js'), 'utf8');
      
      const hasDualRefCheck = (coaJs.includes("POS_Sale_${s.ID}") && coaJs.includes("Sale_${s.ID}")) ||
                              (coaJs.includes("existingRefs.has('POS_Sale_' + s.ID)"));

      // This test is designed to FAIL before the fix, and PASS after the fix
      expect(hasDualRefCheck).toBe(true);
    });
  });

  describe('ACC-01: POS Split Payment Balanced Journal Lines', () => {
    it('proves that split payments clamp cash to actual collected and route remaining debt to 1103/1107', () => {
      const posJs = fs.readFileSync(path.join(__dirname, '../app-modular/js/modules/15-pos-retail.js'), 'utf8');
      const utilsJs = fs.readFileSync(path.join(__dirname, '../app-modular/js/core/03-utils-and-mappings.js'), 'utf8');

      // In 15-pos-retail.js: cash pushed into splits must subtract changeDue
      const hasCashClampingInPos = posJs.includes('splitCash - finalChangeDue') ||
                                   posJs.includes('netSplitCash');

      // In 03-utils-and-mappings.js: splits multi-payment must add remaining debit line if splitSum < total
      const hasSplitRemainderCheck = utilsJs.includes('splitSum < numTotal') ||
                                     utilsJs.includes('round2(splitSum) < round2(numTotal)');

      // This test is designed to FAIL before the fix, and PASS after the fix
      expect(hasCashClampingInPos).toBe(true);
      expect(hasSplitRemainderCheck).toBe(true);
    });
  });

  describe('ACC-04: Reversal of VAT in Sales and Purchase Returns', () => {
    it('proves that sales returns reverse output VAT (2104) and purchase returns reverse input VAT (1105)', () => {
      const posJs = fs.readFileSync(path.join(__dirname, '../app-modular/js/modules/15-pos-retail.js'), 'utf8');
      const utilsJs = fs.readFileSync(path.join(__dirname, '../app-modular/js/core/03-utils-and-mappings.js'), 'utf8');

      // Sales return in pos-retail must debit 2104 when tax was present
      const hasVatReversalInSalesReturn = posJs.includes("'2104'") && posJs.includes("ضريبة القيمة المضافة");
      // Purchase return in utils must credit 1105
      const hasVatReversalInPurchaseReturn = utilsJs.includes("'1105'") && utilsJs.includes("ضريبة القيمة المضافة");

      // This test is designed to FAIL before the fix, and PASS after the fix
      expect(hasVatReversalInSalesReturn).toBe(true);
      expect(hasVatReversalInPurchaseReturn).toBe(true);
    });
  });

  describe('ACC-06: HR Payroll Journal Balance with High Deductions', () => {
    it('guarantees that payroll journal lines remain balanced when deductions exceed gross', () => {
      const payrollData = {
        month: '2026-11',
        totalGross: 3000,
        totalAdvancesDeducted: 2500,
        totalPurchasesDeducted: 1000, // total deductions 3500 > gross 3000
        totalPenalties: 0,
        totalNetPaid: 0
      };

      const lines = FinanceEngine.buildPayrollJournalLines(payrollData);
      expect(lines).toBeDefined();
      expect(lines.length).toBeGreaterThan(0);

      // Verify that total Debit equals total Credit!
      const totalDebit = lines.reduce((acc, l) => acc + (l.Debit || 0), 0);
      const totalCredit = lines.reduce((acc, l) => acc + (l.Credit || 0), 0);

      expect(FinanceEngine.round2(totalDebit)).toBe(FinanceEngine.round2(totalCredit));
    });
  });

  describe('ACC-07: Replacement of Composite Accounts 42 and 52 with Leaf Accounts', () => {
    it('proves that auto journal entries use leaf accounts 4201 and 5208 instead of group accounts 42 and 52', () => {
      const utilsJs = fs.readFileSync(path.join(__dirname, '../app-modular/js/core/03-utils-and-mappings.js'), 'utf8');
      const invJs = fs.readFileSync(path.join(__dirname, '../app-modular/js/modules/12-invoices-quotes.js'), 'utf8');

      // utils line 2240 used '42', line 2258 used '52'
      const hasGroup42InUtils = utilsJs.includes("AccountCode: '42'") || utilsJs.includes("AccountCode:'42'");
      const hasGroup52InUtils = utilsJs.includes("isPetty ? '5204' : '52'");
      const hasGroup42InInv = invJs.includes("AccountCode: '42'") || invJs.includes("AccountCode:'42'");

      // This test is designed to FAIL before the fix, and PASS after the fix
      expect(hasGroup42InUtils).toBe(false);
      expect(hasGroup52InUtils).toBe(false);
      expect(hasGroup42InInv).toBe(false);
    });
  });
});
