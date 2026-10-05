/* ============================================================
   Security Hardening — Execution Guards
   ============================================================
   - Prevents eval() abuse
   - Preserves user productivity (normal right-click, text selection, and copy-paste enabled)
   - Preserves console diagnostics for system monitoring
   - Server-Side RBAC & Session Tokens in Apps Script remain the primary security boundary.
   ============================================================ */

(function _securityShield() {
  'use strict';

  // Prevent eval() Execution Abuse
  try {
    window.eval = function() {
      throw new Error('eval() محظور لأسباب أمنية');
    };
  } catch(e) {}

})();
