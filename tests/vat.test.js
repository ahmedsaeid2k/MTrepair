import { describe, it, expect } from 'vitest';
import FinanceEngine from '../app-modular/js/core/09-finance-engine.js';

const {
  DEFAULT_VAT_RATE,
  calculateExclusiveVAT,
  extractInclusiveVAT,
  calculateInvoiceTotals,
  calculateVATReturn
} = FinanceEngine;

describe('Tax & VAT Engine (ضريبة القيمة المضافة)', () => {
  it('has standard Egyptian VAT rate of 14% (0.14)', () => {
    expect(DEFAULT_VAT_RATE).toBe(0.14);
  });

  describe('calculateExclusiveVAT()', () => {
    it('calculates 14% VAT on tax-exclusive net amounts accurately', () => {
      // Net: 1,000 -> VAT: 140, Gross: 1,140
      const res = calculateExclusiveVAT(1000);
      expect(res.net).toBe(1000);
      expect(res.vatRate).toBe(0.14);
      expect(res.vatAmount).toBe(140);
      expect(res.gross).toBe(1140);
    });

    it('handles decimal amounts with exact 2-decimal rounding', () => {
      // Net: 125.50 * 0.14 = 17.57, Gross: 143.07
      const res = calculateExclusiveVAT(125.50);
      expect(res.vatAmount).toBe(17.57);
      expect(res.gross).toBe(143.07);
    });

    it('supports custom tax rates', () => {
      // 5% rate on 200 -> VAT 10, Gross 210
      const res = calculateExclusiveVAT(200, 0.05);
      expect(res.vatAmount).toBe(10);
      expect(res.gross).toBe(210);
    });
  });

  describe('extractInclusiveVAT()', () => {
    it('extracts net and VAT from a tax-inclusive price', () => {
      // Gross: 1,140 -> Net: 1,000, VAT: 140
      const res = extractInclusiveVAT(1140);
      expect(res.gross).toBe(1140);
      expect(res.net).toBe(1000);
      expect(res.vatAmount).toBe(140);
    });

    it('extracts VAT from inclusive retail price with precision', () => {
      // Retail price 100 EGP (inclusive of 14% VAT): Net ~ 87.72, VAT ~ 12.28
      const res = extractInclusiveVAT(100);
      expect(res.net).toBe(87.72);
      expect(res.vatAmount).toBe(12.28);
      expect(res.net + res.vatAmount).toBe(100);
    });

    it('handles zero tax rate cleanly', () => {
      const res = extractInclusiveVAT(500, 0);
      expect(res.net).toBe(500);
      expect(res.vatAmount).toBe(0);
      expect(res.gross).toBe(500);
    });
  });

  describe('calculateInvoiceTotals()', () => {
    it('computes subtotal, applies discount, adds VAT, and includes shipping', () => {
      const items = [
        { name: 'صيانة باور لابتوب', qty: 1, price: 500 },
        { name: 'شاحن أصلي', qty: 2, price: 250 }
      ];

      // Subtotal: 500 + 500 = 1,000
      // Discount: 100 -> Discounted Subtotal = 900
      // VAT (14% of 900): 126
      // Shipping: 50
      // Grand Total: 900 + 126 + 50 = 1,076
      const res = calculateInvoiceTotals(items, {
        discount: 100,
        isTaxable: true,
        shipping: 50
      });

      expect(res.subtotal).toBe(1000);
      expect(res.discount).toBe(100);
      expect(res.discountedSubtotal).toBe(900);
      expect(res.vatAmount).toBe(126);
      expect(res.shipping).toBe(50);
      expect(res.grandTotal).toBe(1076);
    });

    it('computes non-taxable invoices without VAT', () => {
      const items = [{ name: 'خدمة سريعة', qty: 1, price: 300 }];
      const res = calculateInvoiceTotals(items, { isTaxable: false });
      expect(res.vatAmount).toBe(0);
      expect(res.grandTotal).toBe(300);
    });
  });

  describe('calculateVATReturn()', () => {
    it('calculates net tax payable when sales VAT exceeds purchase input VAT', () => {
      // Output VAT (Sales): 14,000
      // Input VAT (Purchases & Expenses): 9,000
      // Net Payable: 5,000 to Egyptian Tax Authority
      const res = calculateVATReturn(14000, 9000);
      expect(res.netPayable).toBe(5000);
      expect(res.status).toBe('payable');
    });

    it('calculates tax credit when purchase input VAT exceeds sales VAT', () => {
      // Output VAT: 4,000, Input VAT: 7,000 -> Net -3,000 (credit)
      const res = calculateVATReturn(4000, 7000);
      expect(res.netPayable).toBe(-3000);
      expect(res.status).toBe('credit');
    });
  });
});
