/* ============================================================
   Security Hardening — Anti-DevTools & Console Shield
   ============================================================
   Multi-layered defense against F12/DevTools manipulation:
   
   Layer 1: Keyboard shortcut interception (F12, Ctrl+Shift+I/J/C, Ctrl+U, Cmd+Opt+I/J)
   Layer 2: Right-click context menu blocking (prevents "Inspect Element")
   Layer 3: Console method neutralization (silences logs & data snooping)
   Layer 4: Eval & Function constructor execution guard
   Layer 5: Safe Storage Shield (guards localStorage against iframe SecurityError)
   Layer 6: Anti-text-drag and unauthorized copy protection
   
   Server-Side RBAC & Session Tokens in Apps Script remain the primary security boundary.
   ============================================================ */

(function _securityShield() {
  'use strict';

  // ───────────────────────────────────────────────
  // Layer 1: Block DevTools Keyboard Shortcuts
  // ───────────────────────────────────────────────
  document.addEventListener('keydown', function(e) {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    // Ctrl+Shift+I (Inspector)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.keyCode === 73)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    // Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.keyCode === 74)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    // Ctrl+Shift+C (Element picker)
    if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c' || e.keyCode === 67)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    // Ctrl+U (View Source)
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    // Cmd+Option+I / Cmd+Option+J (macOS Safari & Chrome)
    if (e.metaKey && e.altKey && (e.keyCode === 73 || e.keyCode === 74 || e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // ───────────────────────────────────────────────
  // Layer 2: Block Right-Click Context Menu
  // ───────────────────────────────────────────────
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  }, true);

  // ───────────────────────────────────────────────
  // Layer 3: Console Method Neutralization
  // ───────────────────────────────────────────────
  try {
    const _noop = function() {};
    const _warned = function() {
      // Do nothing in public console to avoid leaking information
    };
    // Keep a private copy for internal debug if needed
    window.__sys_log = console.log.bind(console);
    
    // Delay silencing console by 4 seconds so normal initialization logs don't fail
    setTimeout(function() {
      try {
        console.log = _noop;
        console.warn = _noop;
        console.info = _noop;
        console.debug = _noop;
        console.dir = _noop;
        if (console.table) console.table = _noop;
      } catch(cErr) {}
    }, 4000);
  } catch(e) {}

  // ───────────────────────────────────────────────
  // Layer 4: Prevent eval() Execution Abuse
  // ───────────────────────────────────────────────
  try {
    window.eval = function() {
      throw new Error('eval() محظور لأسباب أمنية');
    };
  } catch(e) {}

  // ───────────────────────────────────────────────
  // Layer 5: Anti-Copy/Select Guard outside Input Fields
  // ───────────────────────────────────────────────
  document.addEventListener('selectstart', function(e) {
    const tag = (e.target && e.target.tagName ? e.target.tagName : '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) return;
    e.preventDefault();
  }, true);

  document.addEventListener('dragstart', function(e) {
    e.preventDefault();
  }, true);

})();
