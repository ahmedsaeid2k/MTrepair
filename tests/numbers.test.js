import { describe, it, expect } from 'vitest';
import FinanceEngine from '../app-modular/js/core/09-finance-engine.js';

const { toEngDigits } = FinanceEngine;

describe('Universal Digits Enforcer & Normalizer Engine', () => {
  it('converts Arabic-Indic digits (٠-٩) to Western standard ASCII (0-9)', () => {
    const arabicIndic = '٠١٢٣٤٥٦٧٨٩';
    expect(toEngDigits(arabicIndic)).toBe('0123456789');
  });

  it('converts Eastern Arabic / Persian digits (۰-۹) to ASCII (0-9)', () => {
    const persian = '۰۱۲۳۴۵۶۷۸۹';
    expect(toEngDigits(persian)).toBe('0123456789');
  });

  it('converts Arabic decimal separator (٫) to standard decimal point (.)', () => {
    expect(toEngDigits('١٥٠٫٧٥')).toBe('150.75');
    expect(toEngDigits('٩٩٫٩')).toBe('99.9');
  });

  it('normalizes Egyptian mobile phone numbers typed in Arabic numerals', () => {
    const rawMobile = '٠١٠١٢٣٤٥٦٧٨';
    expect(toEngDigits(rawMobile)).toBe('01012345678');
  });

  it('preserves existing ASCII digits, Latin letters, and Arabic letters untouched', () => {
    expect(toEngDigits('Device A12 - عطل شاشة رقم 5')).toBe('Device A12 - عطل شاشة رقم 5');
    expect(toEngDigits('INV-2026-٠٠١')).toBe('INV-2026-001');
  });

  it('handles barcodes entered via Arabic keyboard layout', () => {
    const barcode = '٦٢٢١٢٣٤٥٦٧٨٩٠';
    expect(toEngDigits(barcode)).toBe('6221234567890');
  });

  it('handles null, undefined, empty string, and non-string values safely', () => {
    expect(toEngDigits(null)).toBe('');
    expect(toEngDigits(undefined)).toBe('');
    expect(toEngDigits('')).toBe('');
    expect(toEngDigits(12345)).toBe('12345');
  });
});
