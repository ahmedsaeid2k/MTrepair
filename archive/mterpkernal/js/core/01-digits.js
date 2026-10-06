/* ---------------- Universal Western Digits Enforcer (0-9) ---------------- */
function toEngDigits(str){
  if(str == null) return '';
  return String(str)
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9')
    .replace(/٫/g, '.');
}
window.toEnglishDigits = toEngDigits;

// Global Real-time Auto-converter for All Inputs & Textareas across all screens
(function initGlobalDigitEnforcer(){
  function enforceDigits(target){
    if (!target || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA')) return;
    if (target.type === 'password' || target.type === 'file' || target.type === 'checkbox' || target.type === 'radio') return;

    const val = target.value;
    if (!val || !/[٠-٩۰-۹٫]/.test(val)) return;

    const isPhone = target.type === 'tel' || 
                    (target.id && /phone|tel|mobile|هاتف|جوال/i.test(target.id)) ||
                    (target.name && /phone|tel|mobile|هاتف|جوال/i.test(target.name)) ||
                    (target.placeholder && /هاتف|تليفون|موبايل|phone|01/i.test(target.placeholder));

    let converted = toEngDigits(val);
    if (isPhone) {
      target.dir = 'ltr';
      target.style.textAlign = 'right';
      target.style.fontFamily = 'var(--font-mono)';
      converted = converted.replace(/[^0-9+\-\s()]/g, '');
    }

    if (val !== converted) {
      let cursor = null;
      try { cursor = target.selectionStart; } catch(e){}
      target.value = converted;
      if (cursor !== null) {
        try { target.setSelectionRange(cursor, cursor); } catch(err){}
      }
    }
  }

  // Intercept before input is committed (especially critical for input[type=number] where Arabic digits make target.value empty)
  document.addEventListener('beforeinput', function(e) {
    const target = e.target;
    if (!target || (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA')) return;
    if (target.type === 'password' || target.type === 'file') return;
    if (e.data && /[٠-٩۰-۹٫]/.test(e.data)) {
      e.preventDefault();
      const cleanData = toEngDigits(e.data);
      if (typeof document.execCommand === 'function') {
        const ok = document.execCommand('insertText', false, cleanData);
        if (ok) return;
      }
      // Fallback
      const s = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      const cur = target.value || '';
      target.value = cur.slice(0, s) + cleanData + cur.slice(end);
      try { target.setSelectionRange(s + cleanData.length, s + cleanData.length); } catch(err){}
      target.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, true);

  document.addEventListener('input', function(e) {
    enforceDigits(e.target);
  }, true);

  document.addEventListener('change', function(e) {
    enforceDigits(e.target);
  }, true);

  document.addEventListener('paste', function(e) {
    setTimeout(() => enforceDigits(e.target), 10);
  }, true);
})();

// Override Number.prototype.toLocaleString to guarantee English numbers everywhere
const _origNumberToLocaleString = Number.prototype.toLocaleString;
Number.prototype.toLocaleString = function(locales, options) {
  return _origNumberToLocaleString.call(this, 'en-US', options);
};

// Override Date formatting
const _origDateToLocaleTimeString = Date.prototype.toLocaleTimeString;
Date.prototype.toLocaleTimeString = function(locales, options) {
  return toEngDigits(_origDateToLocaleTimeString.call(this, 'en-GB', options));
};
const _origDateToLocaleDateString = Date.prototype.toLocaleDateString;
Date.prototype.toLocaleDateString = function(locales, options) {
  return toEngDigits(_origDateToLocaleDateString.call(this, 'en-CA', options));
};
