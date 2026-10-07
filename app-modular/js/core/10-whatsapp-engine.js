/**
 * microERP Core WhatsApp Engine (10-whatsapp-engine.js)
 * Pure, DOM-independent logic for the free official "Click to Chat" (wa.me) channel:
 * international phone normalization, deep-link construction, and the
 * per-receipt notification journal used to prevent duplicate messaging.
 *
 * Compatible with Browser globals and Node.js / Vitest modules.
 */

(function (root, factory) {
  const api = factory();
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = api;
  } else {
    // Expose the WhatsApp-specific API only (generic digit helpers stay private
    // so we never clobber core globals such as toEngDigits from 01-digits.js).
    root.WhatsappEngine = api;
    root.normalizeWaCountryCode = api.normalizeCountryCode;
    root.normalizeWaPhone = api.normalizeWaPhone;
    root.isValidWaPhone = api.isValidWaPhone;
    root.buildWaUrl = api.buildWaUrl;
    root.formatWaElapsed = api.formatWaElapsed;
    root.makeWaLogEntry = api.makeWaLogEntry;
    root.trimWaLog = api.trimWaLog;
    root.getWaNotificationsFor = api.getWaNotificationsFor;
    root.getLastWaNotification = api.getLastWaNotification;
    root.wasWaNotifiedWithin = api.wasWaNotifiedWithin;
    root.getWaNotifiedKeysWithin = api.getWaNotifiedKeysWithin;
    root.collectRecentlyNotifiedIds = api.collectRecentlyNotifiedIds;
    root.countWaNotificationsByKey = api.countWaNotificationsByKey;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  const DEFAULT_WA_COUNTRY_CODE = '20';
  const DEFAULT_WA_LOG_LIMIT = 500;

  const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
  const PERSIAN_INDIC = '۰۱۲۳۴۵۶۷۸۹';

  /**
   * Converts Arabic-Indic / Persian digits and the Arabic decimal separator to ASCII.
   */
  function toLatinDigits(input) {
    if (input === null || input === undefined) return '';
    let str = String(input);
    if (!str) return '';
    let out = '';
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      const ai = ARABIC_INDIC.indexOf(ch);
      const pi = PERSIAN_INDIC.indexOf(ch);
      if (ai > -1) out += String(ai);
      else if (pi > -1) out += String(pi);
      else if (ch === '٫' || ch === '،') out += '.';
      else out += ch;
    }
    return out;
  }

  /**
   * Strips every non-digit character after digit normalization.
   */
  function stripToDigits(value) {
    return toLatinDigits(value).replace(/[^0-9]/g, '');
  }

  /**
   * Normalizes the configured country code (accepts "+20", "0020", " 20 ").
   */
  function normalizeCountryCode(countryCode) {
    const cc = stripToDigits(countryCode).replace(/^0+/, '');
    return cc || DEFAULT_WA_COUNTRY_CODE;
  }

  /**
   * Normalizes any locally-typed or international phone number into the
   * digits-only international format required by wa.me deep links.
   * Handles: trunk zeros (01012345678), 00 international prefix, country codes
   * already typed by the user, Arabic-Indic digits and "+" / spaces / dashes.
   */
  function normalizeWaPhone(phone, countryCode) {
    const cc = normalizeCountryCode(countryCode);
    let p = stripToDigits(phone);
    if (!p) return '';

    if (p.startsWith('00')) p = p.slice(2);
    p = p.replace(/^0+/, '');
    if (!p) return '';

    // Already carries the country code (e.g. 201012345678 / 966501234567)
    if (p.startsWith(cc) && p.length >= cc.length + 7) return p;

    // Local national number -> prepend the country code
    if (p.length <= 10) return cc + p;

    // Looks like another country's full international number: keep untouched
    return p;
  }

  /**
   * Validates a normalized number against the E.164 practical limits.
   */
  function isValidWaPhone(normalized) {
    const p = stripToDigits(normalized);
    return p.length >= 10 && p.length <= 15;
  }

  /**
   * Builds the official free Click-to-Chat deep link, or '' when the phone is invalid.
   */
  function buildWaUrl(phone, message, countryCode) {
    const p = normalizeWaPhone(phone, countryCode);
    if (!isValidWaPhone(p)) return '';
    const text = (message === null || message === undefined) ? '' : String(message);
    return 'https://wa.me/' + p + '?text=' + encodeURIComponent(text);
  }

  /**
   * Arabic-aware plural helper: 1 -> one, 2 -> two, 3..10 -> few, 11+ -> many.
   */
  function pluralAr(count, one, two, few, many) {
    const n = Math.abs(Number(count) || 0);
    if (n === 1) return one;
    if (n === 2) return two;
    if (n >= 3 && n <= 10) return few;
    return many;
  }

  /**
   * Natural Arabic count label: "دقيقة" / "دقيقتين" / "3 دقائق" / "45 دقيقة".
   */
  function countLabel(count, one, two, few, many) {
    const n = Math.abs(Number(count) || 0);
    if (n === 1) return one;
    if (n === 2) return two;
    return n + ' ' + pluralAr(n, one, two, few, many);
  }

  /**
   * Human readable "time ago" label in Arabic for the last-notification journal.
   */
  function formatWaElapsed(timestamp, now) {
    const then = new Date(timestamp).getTime();
    if (!then || isNaN(then)) return '';
    const current = now === undefined || now === null ? Date.now() : new Date(now).getTime();
    const diff = current - then;
    if (diff < 0) return 'الآن';
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return 'منذ ' + countLabel(minutes, 'دقيقة', 'دقيقتين', 'دقائق', 'دقيقة');
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return 'منذ ' + countLabel(hours, 'ساعة', 'ساعتين', 'ساعات', 'ساعة');
    const days = Math.floor(hours / 24);
    if (days < 31) return 'منذ ' + countLabel(days, 'يوم', 'يومين', 'أيام', 'يوم');
    const months = Math.floor(days / 30);
    if (months < 12) return 'منذ ' + countLabel(months, 'شهر', 'شهرين', 'شهور', 'شهر');
    const years = Math.floor(months / 12);
    return 'منذ ' + countLabel(years, 'سنة', 'سنتين', 'سنوات', 'سنة');
  }

  /**
   * Creates a normalized journal entry for one WhatsApp notification attempt.
   */
  function makeWaLogEntry(entry) {
    const src = entry || {};
    const phone = stripToDigits(src.phone);
    return {
      receiptId: src.receiptId === null || src.receiptId === undefined ? '' : String(src.receiptId),
      receiptNumber: src.receiptNumber === null || src.receiptNumber === undefined ? '' : String(src.receiptNumber),
      key: src.key ? String(src.key) : 'custom',
      label: src.label ? String(src.label) : 'رسالة واتساب',
      phone: phone,
      user: src.user ? String(src.user) : '',
      at: src.at || new Date().toISOString()
    };
  }

  /**
   * Keeps the journal bounded (newest first) so localStorage never grows unbounded.
   */
  function trimWaLog(log, limit) {
    const max = Number(limit) > 0 ? Number(limit) : DEFAULT_WA_LOG_LIMIT;
    if (!Array.isArray(log)) return [];
    return log.slice(0, max);
  }

  /**
   * Every journal entry recorded for one receipt (newest first).
   */
  function getWaNotificationsFor(log, receiptId) {
    if (!Array.isArray(log) || receiptId === null || receiptId === undefined) return [];
    const id = String(receiptId);
    return log.filter(function (e) { return e && String(e.receiptId) === id; });
  }

  /**
   * The most recent journal entry for one receipt, or null.
   */
  function getLastWaNotification(log, receiptId) {
    const list = getWaNotificationsFor(log, receiptId);
    return list.length ? list[0] : null;
  }

  /**
   * True when the receipt received any notification within the last `days` days.
   */
  function wasWaNotifiedWithin(log, receiptId, days, now) {
    const list = getWaNotificationsFor(log, receiptId);
    if (!list.length) return false;
    const current = now === undefined || now === null ? Date.now() : new Date(now).getTime();
    const windowMs = Math.max(0, Number(days) || 0) * 86400000;
    return list.some(function (e) {
      const t = new Date(e.at).getTime();
      return !isNaN(t) && (current - t) <= windowMs;
    });
  }

  /**
   * The distinct template keys already sent to one receipt within the last `days` days.
   */
  function getWaNotifiedKeysWithin(log, receiptId, days, now) {
    const current = now === undefined || now === null ? Date.now() : new Date(now).getTime();
    const windowMs = Math.max(0, Number(days) || 0) * 86400000;
    const keys = [];
    getWaNotificationsFor(log, receiptId).forEach(function (e) {
      const t = new Date(e.at).getTime();
      if (isNaN(t) || (current - t) > windowMs) return;
      if (e.key && keys.indexOf(e.key) === -1) keys.push(e.key);
    });
    return keys;
  }

  /**
   * Distinct receipt ids that received any notification within the last `days` days.
   * Single pass over the journal (used by the bulk dispatch cooldown filter).
   */
  function collectRecentlyNotifiedIds(log, days, now) {
    const current = now === undefined || now === null ? Date.now() : new Date(now).getTime();
    const windowMs = Math.max(0, Number(days) || 0) * 86400000;
    const ids = [];
    if (!Array.isArray(log)) return ids;
    log.forEach(function (e) {
      if (!e || e.receiptId === null || e.receiptId === undefined) return;
      const t = new Date(e.at).getTime();
      if (isNaN(t) || (current - t) > windowMs) return;
      const id = String(e.receiptId);
      if (ids.indexOf(id) === -1) ids.push(id);
    });
    return ids;
  }

  /**
   * Counts notifications per template key (used by the journal summary UI).
   */
  function countWaNotificationsByKey(log, receiptId) {
    const counts = {};
    getWaNotificationsFor(log, receiptId).forEach(function (e) {
      const k = e.key || 'custom';
      counts[k] = (counts[k] || 0) + 1;
    });
    return counts;
  }

  return {
    DEFAULT_WA_COUNTRY_CODE: DEFAULT_WA_COUNTRY_CODE,
    DEFAULT_WA_LOG_LIMIT: DEFAULT_WA_LOG_LIMIT,
    toLatinDigits: toLatinDigits,
    stripToDigits: stripToDigits,
    normalizeCountryCode: normalizeCountryCode,
    normalizeWaPhone: normalizeWaPhone,
    isValidWaPhone: isValidWaPhone,
    buildWaUrl: buildWaUrl,
    pluralAr: pluralAr,
    countLabel: countLabel,
    formatWaElapsed: formatWaElapsed,
    makeWaLogEntry: makeWaLogEntry,
    trimWaLog: trimWaLog,
    getWaNotificationsFor: getWaNotificationsFor,
    getLastWaNotification: getLastWaNotification,
    wasWaNotifiedWithin: wasWaNotifiedWithin,
    getWaNotifiedKeysWithin: getWaNotifiedKeysWithin,
    collectRecentlyNotifiedIds: collectRecentlyNotifiedIds,
    countWaNotificationsByKey: countWaNotificationsByKey
  };
});
