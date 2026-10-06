import { describe, it, expect } from 'vitest';
import FinanceEngine from '../app-modular/js/core/09-finance-engine.js';

const {
  calculateGrossProfit,
  calculateNetProfit,
  calculateInventoryValuation
} = FinanceEngine;

describe('COGS & Profitability Analysis Engine', () => {
  describe('calculateGrossProfit()', () => {
    it('calculates gross profit and gross margin percentage correctly', () => {
      // Revenue 10,000, COGS 4,000 -> Gross Profit 6,000, Margin 60%
      const res = calculateGrossProfit(10000, 4000);
      expect(res.revenue).toBe(10000);
      expect(res.cogs).toBe(4000);
      expect(res.grossProfit).toBe(6000);
      expect(res.grossMargin).toBe(60.0);
    });

    it('handles break-even sales (revenue equals cogs)', () => {
      const res = calculateGrossProfit(500, 500);
      expect(res.grossProfit).toBe(0);
      expect(res.grossMargin).toBe(0);
    });

    it('handles gross loss (cogs exceeds revenue)', () => {
      const res = calculateGrossProfit(2000, 2500);
      expect(res.grossProfit).toBe(-500);
      expect(res.grossMargin).toBe(-25.0);
    });

    it('handles zero revenue safely without NaN or DivisionByZero', () => {
      const res = calculateGrossProfit(0, 500);
      expect(res.grossProfit).toBe(-500);
      expect(res.grossMargin).toBe(0);
    });
  });

  describe('calculateNetProfit()', () => {
    it('calculates net operating profit after deducting operating expenses', () => {
      // Revenue 20,000, COGS 8,000, Operating Expenses 5,000
      // Gross Profit = 12,000
      // Net Profit = 12,000 - 5,000 = 7,000
      // Net Margin = (7,000 / 20,000) * 100 = 35%
      const res = calculateNetProfit(20000, 8000, 5000);
      expect(res.grossProfit).toBe(12000);
      expect(res.operatingExpenses).toBe(5000);
      expect(res.netProfit).toBe(7000);
      expect(res.netMargin).toBe(35.0);
    });

    it('handles operating loss (expenses exceed gross profit)', () => {
      // Revenue 10,000, COGS 6,000 (Gross = 4,000), Expenses 5,500
      // Net Profit = -1,500, Net Margin = -15%
      const res = calculateNetProfit(10000, 6000, 5500);
      expect(res.netProfit).toBe(-1500);
      expect(res.netMargin).toBe(-15.0);
    });
  });

  describe('calculateInventoryValuation()', () => {
    it('computes total quantity, total purchase cost, and potential retail profit', () => {
      const items = [
        { name: 'شاشة سامسونج A12', quantity: 5, costPrice: 350, sellPrice: 550 },
        { name: 'بطارية آيفون 11', qty: 10, buyPrice: 200, price: 400 },
        { name: 'كابل شحن تايب سي', quantity: 20, costPrice: 15, sellPrice: 35 }
      ];

      const res = calculateInventoryValuation(items);

      // Total quantity: 5 + 10 + 20 = 35
      expect(res.totalQuantity).toBe(35);

      // Total cost: (5 * 350) + (10 * 200) + (20 * 15) = 1750 + 2000 + 300 = 4050
      expect(res.totalCost).toBe(4050);

      // Total retail: (5 * 550) + (10 * 400) + (20 * 35) = 2750 + 4000 + 700 = 7450
      expect(res.totalRetailValue).toBe(7450);

      // Potential profit: 7450 - 4050 = 3400
      expect(res.potentialProfit).toBe(3400);
    });

    it('safely handles empty or missing inventory', () => {
      const res = calculateInventoryValuation([]);
      expect(res.totalQuantity).toBe(0);
      expect(res.totalCost).toBe(0);
      expect(res.potentialProfit).toBe(0);
    });
  });
});
