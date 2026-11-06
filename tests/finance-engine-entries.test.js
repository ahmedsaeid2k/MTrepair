import { describe, it, expect } from 'vitest';
import FinanceEngine from '../app-modular/js/core/09-finance-engine.js';

const {
  isBalancedEntry,
  validateJournalEntryLines,
  createReceiptVoidLines,
  createShiftOpenLines,
  createShiftCloseLines,
  createShiftVarianceLines,
  createInvoiceAdjustmentLines
} = FinanceEngine;

describe('REF-01: FinanceEngine Centralized Journal Line Builders', () => {
  describe('createReceiptVoidLines()', () => {
    it('creates balanced journal lines for cash receipt refund', () => {
      const lines = createReceiptVoidLines({
        amount: 350,
        method: 'نقدي (كاش)',
        customerName: 'أحمد محمود',
        receiptNumber: 'REC-101',
        reason: 'عدم توفر قطع غيار'
      });
      expect(isBalancedEntry(lines)).toBe(true);
      expect(validateJournalEntryLines(lines).valid).toBe(true);
      expect(lines[0].AccountCode).toBe('4101');
      expect(lines[0].Debit).toBe(350);
      expect(lines[1].AccountCode).toBe('1101');
      expect(lines[1].Credit).toBe(350);
    });

    it('creates balanced lines routing to bank for electronic refunds', () => {
      const lines = createReceiptVoidLines({
        amount: 500,
        method: 'تحويل بنكي / فيزا',
        customerName: 'سارة علي',
        receiptNumber: 'REC-102',
        reason: 'إلغاء الطلب'
      });
      expect(isBalancedEntry(lines)).toBe(true);
      expect(validateJournalEntryLines(lines).valid).toBe(true);
      expect(lines[1].AccountCode).toBe('1102');
      expect(lines[1].Credit).toBe(500);
    });

    it('creates balanced lines routing to customer receivables for credit refunds', () => {
      const lines = createReceiptVoidLines({
        amount: 200,
        method: 'آجل / حساب عميل',
        customerName: 'شركة النور',
        receiptNumber: 'REC-103',
        reason: 'خصم من الحساب'
      });
      expect(isBalancedEntry(lines)).toBe(true);
      expect(validateJournalEntryLines(lines).valid).toBe(true);
      expect(lines[1].AccountCode).toBe('1103');
      expect(lines[1].Credit).toBe(200);
    });
  });

  describe('Shift Custody Lines', () => {
    it('creates balanced shift open lines (Dr Cash Drawer / Cr Custody)', () => {
      const lines = createShiftOpenLines({
        shiftNumber: 15,
        cashierName: 'محمد أحمد',
        openingFloat: 1000
      });
      expect(isBalancedEntry(lines)).toBe(true);
      expect(validateJournalEntryLines(lines).valid).toBe(true);
      expect(lines[0].AccountCode).toBe('1101');
      expect(lines[0].Debit).toBe(1000);
      expect(lines[1].AccountCode).toBe('2105');
      expect(lines[1].Credit).toBe(1000);
    });

    it('creates balanced shift close custody release lines (Dr Custody / Cr Cash Drawer)', () => {
      const lines = createShiftCloseLines({
        shiftNumber: 15,
        cashierName: 'محمد أحمد',
        openingFloat: 1000
      });
      expect(isBalancedEntry(lines)).toBe(true);
      expect(validateJournalEntryLines(lines).valid).toBe(true);
      expect(lines[0].AccountCode).toBe('2105');
      expect(lines[0].Debit).toBe(1000);
      expect(lines[1].AccountCode).toBe('1101');
      expect(lines[1].Credit).toBe(1000);
    });

    it('creates balanced shift shortage lines for cash deficit', () => {
      const lines = createShiftVarianceLines({
        shiftNumber: 15,
        cashierName: 'محمد أحمد',
        discrepancy: -50 // 50 EGP shortage
      });
      expect(isBalancedEntry(lines)).toBe(true);
      expect(validateJournalEntryLines(lines).valid).toBe(true);
      expect(lines[0].AccountCode).toBe('5208');
      expect(lines[0].Debit).toBe(50);
      expect(lines[1].AccountCode).toBe('1101');
      expect(lines[1].Credit).toBe(50);
    });

    it('creates balanced shift surplus lines for cash excess', () => {
      const lines = createShiftVarianceLines({
        shiftNumber: 15,
        cashierName: 'محمد أحمد',
        discrepancy: 75 // 75 EGP surplus
      });
      expect(isBalancedEntry(lines)).toBe(true);
      expect(validateJournalEntryLines(lines).valid).toBe(true);
      expect(lines[0].AccountCode).toBe('1101');
      expect(lines[0].Debit).toBe(75);
      expect(lines[1].AccountCode).toBe('4201');
      expect(lines[1].Credit).toBe(75);
    });
  });

  describe('createInvoiceAdjustmentLines()', () => {
    it('creates balanced adjustment lines when invoice total increases', () => {
      const lines = createInvoiceAdjustmentLines({
        invoiceNumber: 'INV-2026-001',
        customerName: 'عميل مميز',
        supervisorName: 'مدير الفرع',
        oldTotal: 1000,
        newTotal: 1250
      });
      expect(isBalancedEntry(lines)).toBe(true);
      expect(validateJournalEntryLines(lines).valid).toBe(true);
      expect(lines[0].AccountCode).toBe('1103');
      expect(lines[0].Debit).toBe(250);
      expect(lines[1].AccountCode).toBe('4102');
      expect(lines[1].Credit).toBe(250);
    });

    it('creates balanced adjustment lines when invoice total decreases', () => {
      const lines = createInvoiceAdjustmentLines({
        invoiceNumber: 'INV-2026-001',
        customerName: 'عميل مميز',
        supervisorName: 'مدير الفرع',
        oldTotal: 1000,
        newTotal: 850
      });
      expect(isBalancedEntry(lines)).toBe(true);
      expect(validateJournalEntryLines(lines).valid).toBe(true);
      expect(lines[0].AccountCode).toBe('4102');
      expect(lines[0].Debit).toBe(150);
      expect(lines[1].AccountCode).toBe('1103');
      expect(lines[1].Credit).toBe(150);
    });
  });
});
