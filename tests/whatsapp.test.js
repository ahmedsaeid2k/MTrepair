import { describe, it, expect } from 'vitest';
import WhatsappEngine from '../app-modular/js/core/10-whatsapp-engine.js';

const {
  DEFAULT_WA_COUNTRY_CODE,
  toLatinDigits,
  stripToDigits,
  normalizeCountryCode,
  normalizeWaPhone,
  isValidWaPhone,
  buildWaUrl,
  countLabel,
  formatWaElapsed,
  makeWaLogEntry,
  trimWaLog,
  getWaNotificationsFor,
  getLastWaNotification,
  wasWaNotifiedWithin,
  getWaNotifiedKeysWithin,
  collectRecentlyNotifiedIds,
  countWaNotificationsByKey
} = WhatsappEngine;

describe('WhatsApp Engine — international phone normalization', () => {
  it('exposes Egypt as the default country code', () => {
    expect(DEFAULT_WA_COUNTRY_CODE).toBe('20');
  });

  it('converts Arabic-Indic and Persian digits to ASCII', () => {
    expect(toLatinDigits('٠١٠١٢٣٤٥٦٧٨')).toBe('01012345678');
    expect(toLatinDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
    expect(toLatinDigits(null)).toBe('');
  });

  it('strips spaces, dashes, plus signs and parentheses', () => {
    expect(stripToDigits('+20 (101) 234-5678')).toBe('201012345678');
  });

  it('accepts country codes written in several shapes', () => {
    expect(normalizeCountryCode('+20')).toBe('20');
    expect(normalizeCountryCode('0020')).toBe('20');
    expect(normalizeCountryCode('')).toBe('20');
    expect(normalizeCountryCode(undefined)).toBe('20');
    expect(normalizeCountryCode('966')).toBe('966');
  });

  it('normalizes Egyptian local numbers (leading zero) to international format', () => {
    expect(normalizeWaPhone('01012345678', '20')).toBe('201012345678');
    expect(normalizeWaPhone('٠١٠١٢٣٤٥٦٧٨', '20')).toBe('201012345678');
    expect(normalizeWaPhone('0101 234 5678', '20')).toBe('201012345678');
  });

  it('normalizes Egyptian numbers typed without the trunk zero', () => {
    expect(normalizeWaPhone('1012345678', '20')).toBe('201012345678');
  });

  it('keeps already-international numbers untouched', () => {
    expect(normalizeWaPhone('201012345678', '20')).toBe('201012345678');
    expect(normalizeWaPhone('+20 101 234 5678', '20')).toBe('201012345678');
    expect(normalizeWaPhone('00201012345678', '20')).toBe('201012345678');
  });

  it('respects a different configured country code (Gulf markets)', () => {
    expect(normalizeWaPhone('0501234567', '966')).toBe('966501234567');
    expect(normalizeWaPhone('+966 50 123 4567', '966')).toBe('966501234567');
    expect(normalizeWaPhone('0501234567', '971')).toBe('971501234567');
  });

  it('preserves foreign numbers even when another country code is configured', () => {
    expect(normalizeWaPhone('966501234567', '20')).toBe('966501234567');
    expect(normalizeWaPhone('14155551234', '20')).toBe('14155551234');
  });

  it('returns an empty string for empty or digit-free input', () => {
    expect(normalizeWaPhone('', '20')).toBe('');
    expect(normalizeWaPhone(null, '20')).toBe('');
    expect(normalizeWaPhone('لا يوجد رقم', '20')).toBe('');
    expect(normalizeWaPhone('0000', '20')).toBe('');
  });

  it('validates the E.164 practical length window', () => {
    expect(isValidWaPhone('201012345678')).toBe(true);
    expect(isValidWaPhone('20101234')).toBe(false);
    expect(isValidWaPhone('1234567890123456')).toBe(false);
    expect(isValidWaPhone('')).toBe(false);
  });
});

describe('WhatsApp Engine — deep link builder', () => {
  it('builds an official wa.me click-to-chat link', () => {
    const url = buildWaUrl('01012345678', 'مرحباً', '20');
    expect(url).toBe('https://wa.me/201012345678?text=' + encodeURIComponent('مرحباً'));
  });

  it('encodes new lines and Arabic text safely', () => {
    const message = 'سطر أول\nسطر ثانٍ & 100%';
    const url = buildWaUrl('01012345678', message, '20');
    expect(url).toContain('?text=' + encodeURIComponent(message));
    expect(url).not.toContain('\n');
    expect(url).not.toContain(' ');
  });

  it('returns an empty string for invalid phone numbers', () => {
    expect(buildWaUrl('', 'مرحباً', '20')).toBe('');
    expect(buildWaUrl('123', 'مرحباً', '20')).toBe('');
  });

  it('tolerates a missing message', () => {
    expect(buildWaUrl('01012345678', null, '20')).toBe('https://wa.me/201012345678?text=');
  });
});

describe('WhatsApp Engine — human readable elapsed time', () => {
  const now = new Date('2026-10-07T12:00:00.000Z').getTime();

  it('formats Arabic plurals naturally', () => {
    expect(countLabel(1, 'دقيقة', 'دقيقتين', 'دقائق', 'دقيقة')).toBe('دقيقة');
    expect(countLabel(2, 'دقيقة', 'دقيقتين', 'دقائق', 'دقيقة')).toBe('دقيقتين');
    expect(countLabel(5, 'دقيقة', 'دقيقتين', 'دقائق', 'دقيقة')).toBe('5 دقائق');
    expect(countLabel(45, 'دقيقة', 'دقيقتين', 'دقائق', 'دقيقة')).toBe('45 دقيقة');
  });

  it('describes recent, hourly, daily and monthly gaps', () => {
    expect(formatWaElapsed(new Date(now - 20000).toISOString(), now)).toBe('الآن');
    expect(formatWaElapsed(new Date(now - 5 * 60000).toISOString(), now)).toBe('منذ 5 دقائق');
    expect(formatWaElapsed(new Date(now - 2 * 3600000).toISOString(), now)).toBe('منذ ساعتين');
    expect(formatWaElapsed(new Date(now - 3 * 86400000).toISOString(), now)).toBe('منذ 3 أيام');
    expect(formatWaElapsed(new Date(now - 70 * 86400000).toISOString(), now)).toBe('منذ شهرين');
  });

  it('returns an empty string for invalid timestamps', () => {
    expect(formatWaElapsed('not-a-date', now)).toBe('');
    expect(formatWaElapsed(null, now)).toBe('');
  });
});

describe('WhatsApp Engine — notification journal', () => {
  const base = new Date('2026-10-07T12:00:00.000Z').getTime();

  function entry(receiptId, key, minutesAgo, extra) {
    return makeWaLogEntry(Object.assign({
      receiptId: receiptId,
      receiptNumber: '100' + receiptId,
      key: key,
      label: key,
      phone: '201012345678',
      at: new Date(base - minutesAgo * 60000).toISOString()
    }, extra || {}));
  }

  it('normalizes journal entries', () => {
    const e = makeWaLogEntry({ receiptId: 7, key: 'check', phone: '+20 101 234 5678', at: '2026-10-07T10:00:00.000Z' });
    expect(e.receiptId).toBe('7');
    expect(e.phone).toBe('201012345678');
    expect(e.key).toBe('check');
    expect(e.label).toBe('رسالة واتساب');
  });

  it('keeps the journal bounded, newest first', () => {
    const log = [entry('1', 'check', 1), entry('2', 'done', 2), entry('3', 'repair', 3)];
    expect(trimWaLog(log, 2)).toHaveLength(2);
    expect(trimWaLog(log, 2)[0].receiptId).toBe('1');
    expect(trimWaLog(null, 5)).toEqual([]);
  });

  it('filters journal entries per receipt and finds the latest one', () => {
    const log = [entry('A', 'check', 5), entry('B', 'done', 10), entry('A', 'repair', 60)];
    expect(getWaNotificationsFor(log, 'A')).toHaveLength(2);
    expect(getWaNotificationsFor(log, 'missing')).toEqual([]);
    expect(getLastWaNotification(log, 'A').key).toBe('check');
    expect(getLastWaNotification(log, 'missing')).toBe(null);
  });

  it('detects notifications inside the cooling-off window', () => {
    const log = [entry('A', 'overdue', 60), entry('B', 'overdue', 5 * 1440)];
    expect(wasWaNotifiedWithin(log, 'A', 3, base)).toBe(true);
    expect(wasWaNotifiedWithin(log, 'B', 3, base)).toBe(false);
    expect(wasWaNotifiedWithin(log, 'B', 10, base)).toBe(true);
    expect(wasWaNotifiedWithin(log, 'C', 3, base)).toBe(false);
  });

  it('lists distinct template keys already sent within the window', () => {
    const log = [entry('A', 'check', 10), entry('A', 'check', 20), entry('A', 'done', 5000)];
    expect(getWaNotifiedKeysWithin(log, 'A', 3, base)).toEqual(['check']);
    expect(getWaNotifiedKeysWithin(log, 'A', 60, base)).toEqual(['check', 'done']);
    expect(getWaNotifiedKeysWithin(log, 'A', 3, base)).not.toContain('done');
  });

  it('collects recently notified receipt ids in a single pass', () => {
    const log = [entry('A', 'overdue', 30), entry('B', 'overdue', 4 * 1440), entry('A', 'overdue', 10)];
    const ids = collectRecentlyNotifiedIds(log, 3, base);
    expect(ids).toEqual(['A']);
    expect(collectRecentlyNotifiedIds([], 3, base)).toEqual([]);
    expect(collectRecentlyNotifiedIds(null, 3, base)).toEqual([]);
  });

  it('counts notifications per template key', () => {
    const log = [entry('A', 'check', 10), entry('A', 'check', 20), entry('A', 'done', 30)];
    expect(countWaNotificationsByKey(log, 'A')).toEqual({ check: 2, done: 1 });
    expect(countWaNotificationsByKey(log, 'B')).toEqual({});
  });
});
