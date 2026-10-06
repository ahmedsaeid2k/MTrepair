import { describe, it, expect } from 'vitest';
import FinanceEngine from '../app-modular/js/core/09-finance-engine.js';

const { round2, parseMoney, formatMoney, sumMoney } = FinanceEngine;

describe('Money & Financial Precision Engine', () => {
  describe('round2()', () => {
    it('accurately resolves JavaScript floating point imprecision (0.1 + 0.2)', () => {
      expect(0.1 + 0.2).not.toBe(0.3);
      expect(round2(0.1 + 0.2)).toBe(0.3);
    });

    it('rounds standard half-up values correctly', () => {
      expect(round2(10.554)).toBe(10.55);
      expect(round2(10.556)).toBe(10.56);
      expect(round2(10.005)).toBe(10.01);
    });

    it('handles zero and negative amounts accurately', () => {
      expect(round2(0)).toBe(0);
      expect(round2(-15.456)).toBe(-15.46);
      expect(round2(-0.001)).toBe(0);
    });

    it('handles null and undefined gracefully', () => {
      expect(round2(null)).toBe(0);
      expect(round2(undefined)).toBe(0);
      expect(round2('invalid')).toBe(0);
    });
  });

  describe('parseMoney()', () => {
    it('parses pure numeric numbers', () => {
      expect(parseMoney(1250)).toBe(1250);
      expect(parseMoney(0.75)).toBe(0.75);
    });

    it('parses strings with commas and currency labels', () => {
      expect(parseMoney('1,500.50 ج.م')).toBe(1500.50);
      expect(parseMoney(' 25,000,000 ')).toBe(25000000);
      expect(parseMoney('$450.25')).toBe(450.25);
    });

    it('parses Eastern/Arabic numerals within strings', () => {
      expect(parseMoney('١٥٠٠.٥٠')).toBe(1500.50);
      expect(parseMoney('٢٥٠ ج.م')).toBe(250);
    });

    it('handles negative numbers and signs', () => {
      expect(parseMoney('-450.75')).toBe(-450.75);
      expect(parseMoney('- 1,200')).toBe(-1200);
    });
  });

  describe('formatMoney()', () => {
    it('formats numbers with thousands separators and default currency (ج.م)', () => {
      expect(formatMoney(1500)).toBe('1,500.00 ج.م');
      expect(formatMoney(1000000.5)).toBe('1,000,000.50 ج.م');
    });

    it('supports custom currency or empty currency', () => {
      expect(formatMoney(250, '$')).toBe('250.00 $');
      expect(formatMoney(500, '')).toBe('500.00');
    });

    it('handles negative amounts cleanly', () => {
      expect(formatMoney(-350.25)).toBe('-350.25 ج.م');
    });
  });

  describe('sumMoney()', () => {
    it('sums multiple financial values with exact 2-decimal precision', () => {
      expect(sumMoney(10.15, 20.25, 30.60)).toBe(61.00);
      expect(sumMoney('100.50', '200.25', '300.25')).toBe(601.00);
    });

    it('handles empty arguments or zero inputs', () => {
      expect(sumMoney()).toBe(0);
      expect(sumMoney(0, null, undefined, -50, 100)).toBe(50);
    });
  });
});
