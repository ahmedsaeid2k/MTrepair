/**
 * microERP Core Financial & Mathematical Engine (09-finance-engine.js)
 * Pure, DOM-independent financial logic, tax rules, journal balancing,
 * COGS analysis, permissions verification, and universal numeric arithmetic.
 *
 * Compatible with Browser globals and Node.js / Vitest modules.
 */

(function (root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  } else {
    const exports = factory();
    Object.assign(root, exports);
    root.FinanceEngine = exports;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  /* =========================================================================
     1. Money & Numeric Precision Utilities
     ========================================================================= */

  /**
   * Universal Eastern/Arabic digit converter to Western ASCII 0-9.
   * Handles Arabic-Indic (٠-٩), Eastern Persian (۰-۹), and Arabic comma (٫).
   */
  function toEngDigits(str) {
    if (str == null) return '';
    return String(str)
      .replace(/[\u0660\u06F0]/g, '0')
      .replace(/[\u0661\u06F1]/g, '1')
      .replace(/[\u0662\u06F2]/g, '2')
      .replace(/[\u0663\u06F3]/g, '3')
      .replace(/[\u0664\u06F4]/g, '4')
      .replace(/[\u0665\u06F5]/g, '5')
      .replace(/[\u0666\u06F6]/g, '6')
      .replace(/[\u0667\u06F7]/g, '7')
      .replace(/[\u0668\u06F8]/g, '8')
      .replace(/[\u0669\u06F9]/g, '9')
      .replace(/[\u066B]/g, '.');
  }

  /**
   * Parse any numeric value or currency string into a safe float.
   * Cleans currency signs, commas, and whitespace.
   */
  function parseMoney(val) {
    if (val == null) return 0;
    if (typeof val === 'number') {
      return isNaN(val) ? 0 : val;
    }
    const cleanStr = toEngDigits(String(val))
      .replace(/,/g, '')
      .replace(/[^0-9.-]/g, '')
      .trim();
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Precise 2-decimal financial rounding to prevent floating-point discrepancies (e.g., 0.1 + 0.2).
   */
  function round2(num) {
    const n = parseMoney(num);
    const r = Math.round((n + Number.EPSILON) * 100) / 100;
    return r === 0 ? 0 : r;
  }

  /**
   * Format money into Egyptian Pounds (or custom currency) with thousands separators.
   */
  function formatMoney(val, currency = 'ج.م', decimals = 2) {
    const n = round2(val);
    const parts = n.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formatted = parts.join('.');
    return currency ? `${formatted} ${currency}` : formatted;
  }

  /**
   * Safe addition of multiple financial amounts.
   */
  function sumMoney(...values) {
    return round2(values.reduce((acc, v) => acc + parseMoney(v), 0));
  }

  /* =========================================================================
     2. Tax & VAT Engine (القيمة المضافة)
     ========================================================================= */

  const DEFAULT_VAT_RATE = 0.14; // 14% Egyptian standard VAT

  /**
   * Calculate VAT on a tax-exclusive net amount.
   * returns { net, vatRate, vatAmount, gross }
   */
  function calculateExclusiveVAT(netAmount, rate = DEFAULT_VAT_RATE) {
    const net = round2(netAmount);
    const r = parseMoney(rate);
    const vatAmount = round2(net * r);
    const gross = round2(net + vatAmount);
    return { net, vatRate: r, vatAmount, gross };
  }

  /**
   * Extract net and VAT from a tax-inclusive gross amount.
   * gross = net * (1 + rate) -> net = gross / (1 + rate)
   */
  function extractInclusiveVAT(grossAmount, rate = DEFAULT_VAT_RATE) {
    const gross = round2(grossAmount);
    const r = parseMoney(rate);
    if (r <= 0) return { net: gross, vatRate: 0, vatAmount: 0, gross };
    const net = round2(gross / (1 + r));
    const vatAmount = round2(gross - net);
    return { net, vatRate: r, vatAmount, gross };
  }

  /**
   * Calculate invoice total with multi-item breakdown, discount, and optional VAT.
   */
  function calculateInvoiceTotals(items = [], options = {}) {
    const discount = parseMoney(options.discount || 0);
    const taxRate = options.isTaxable ? (options.taxRate != null ? parseMoney(options.taxRate) : DEFAULT_VAT_RATE) : 0;
    const shipping = parseMoney(options.shipping || 0);

    let subtotal = 0;
    (items || []).forEach(item => {
      const qty = parseMoney(item.quantity != null ? item.quantity : (item.qty != null ? item.qty : 1));
      const price = parseMoney(item.price != null ? item.price : item.unitPrice);
      subtotal = sumMoney(subtotal, qty * price);
    });

    const discountedSubtotal = Math.max(0, round2(subtotal - discount));
    const vatAmount = round2(discountedSubtotal * taxRate);
    const grandTotal = round2(discountedSubtotal + vatAmount + shipping);

    return {
      subtotal,
      discount,
      discountedSubtotal,
      taxRate,
      vatAmount,
      shipping,
      grandTotal
    };
  }

  /**
   * Periodic VAT Return / Settlement Calculation.
   * Net Payable = Output VAT (Sales) - Input VAT (Purchases & Expenses)
   */
  function calculateVATReturn(outputVAT, inputVAT) {
    const outVat = round2(outputVAT);
    const inVat = round2(inputVAT);
    const netPayable = round2(outVat - inVat);
    return {
      outputVAT: outVat,
      inputVAT: inVat,
      netPayable,
      status: netPayable >= 0 ? 'payable' : 'credit' // payable: سداد لمصلحة الضرائب, credit: رصيد دائن مستحق للمنشأة
    };
  }

  /* =========================================================================
     3. COGS & Profitability Analysis (تكلفة البضاعة المباعة ومجمل وصافي الأرباح)
     ========================================================================= */

  /**
   * Calculate Gross Profit and Gross Margin percentage.
   */
  function calculateGrossProfit(revenue, cogs) {
    const rev = round2(revenue);
    const cost = round2(cogs);
    const grossProfit = round2(rev - cost);
    const grossMargin = rev > 0 ? round2((grossProfit / rev) * 100) : 0;
    return { revenue: rev, cogs: cost, grossProfit, grossMargin };
  }

  /**
   * Calculate Net Operating Profit and Net Margin percentage.
   */
  function calculateNetProfit(revenue, cogs, operatingExpenses) {
    const gross = calculateGrossProfit(revenue, cogs);
    const expenses = round2(operatingExpenses);
    const netProfit = round2(gross.grossProfit - expenses);
    const netMargin = gross.revenue > 0 ? round2((netProfit / gross.revenue) * 100) : 0;
    return {
      revenue: gross.revenue,
      cogs: gross.cogs,
      grossProfit: gross.grossProfit,
      grossMargin: gross.grossMargin,
      operatingExpenses: expenses,
      netProfit,
      netMargin
    };
  }

  /**
   * Calculate inventory Valuation using weighted average or unit cost.
   */
  function calculateInventoryValuation(items = []) {
    let totalQuantity = 0;
    let totalCost = 0;
    let totalRetailValue = 0;

    (items || []).forEach(item => {
      const q = Math.max(0, parseMoney(item.quantity != null ? item.quantity : item.qty));
      const cost = parseMoney(item.costPrice != null ? item.costPrice : item.buyPrice);
      const retail = parseMoney(item.sellPrice != null ? item.sellPrice : item.price);

      totalQuantity += q;
      totalCost = sumMoney(totalCost, q * cost);
      totalRetailValue = sumMoney(totalRetailValue, q * retail);
    });

    const potentialProfit = round2(totalRetailValue - totalCost);
    return {
      itemCount: (items || []).length,
      totalQuantity,
      totalCost,
      totalRetailValue,
      potentialProfit
    };
  }

  /* =========================================================================
     4. Double-Entry Journal & Ledger Engine (القيود المزدوجة وميزان المراجعة)
     ========================================================================= */

  /**
   * Check whether a set of journal lines satisfies the double-entry accounting equation:
   * Total Debits == Total Credits (within floating point precision epsilon = 0.005)
   */
  function isBalancedEntry(lines = [], epsilon = 0.005) {
    if (!Array.isArray(lines) || lines.length < 2) return false;
    let debits = 0;
    let credits = 0;
    for (const l of lines) {
      debits += parseMoney(l.Debit || l.debit || 0);
      credits += parseMoney(l.Credit || l.credit || 0);
    }
    return Math.abs(round2(debits) - round2(credits)) <= epsilon;
  }

  /**
   * Detailed validation of journal entry lines.
   */
  function validateJournalEntryLines(lines = []) {
    const errors = [];
    if (!Array.isArray(lines) || lines.length < 2) {
      errors.push('القيد المحاسبي يجب أن يحتوي على طرفين على الأقل (مدين ودائن)');
      return { valid: false, errors, totalDebit: 0, totalCredit: 0 };
    }

    let totalDebit = 0;
    let totalCredit = 0;

    lines.forEach((l, idx) => {
      const code = String(l.AccountCode || l.accountCode || '').trim();
      const debit = parseMoney(l.Debit || l.debit || 0);
      const credit = parseMoney(l.Credit || l.credit || 0);

      if (!code) {
        errors.push(`السطر رقم ${idx + 1}: رقم الحساب مفقود`);
      }
      if (debit < 0 || credit < 0) {
        errors.push(`السطر رقم ${idx + 1}: لا يمكن أن تكون المبالغ سالبة`);
      }
      if (debit > 0 && credit > 0) {
        errors.push(`السطر رقم ${idx + 1}: لا يمكن إدخال مبلغ في المدين والدائن معاً في نفس السطر`);
      }
      if (debit === 0 && credit === 0) {
        errors.push(`السطر رقم ${idx + 1}: لم يتم تحديد قيمة مالية`);
      }

      totalDebit = sumMoney(totalDebit, debit);
      totalCredit = sumMoney(totalCredit, credit);
    });

    const isBalanced = Math.abs(totalDebit - totalCredit) <= 0.005;
    if (!isBalanced) {
      errors.push(`القيد غير متزن: مجموع المدين (${totalDebit}) لا يساوي مجموع الدائن (${totalCredit})، الفرق = ${round2(Math.abs(totalDebit - totalCredit))}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      totalDebit,
      totalCredit,
      difference: round2(Math.abs(totalDebit - totalCredit))
    };
  }

  /**
   * Compute Net Balance for an account based on its normal accounting nature:
   * - 'مدين' (Debit nature: Assets 1, Expenses 5): Net = Debit - Credit
   * - 'دائن' (Credit nature: Liabilities 2, Equity 3, Revenue 4): Net = Credit - Debit
   */
  function computeAccountNetBalance(nature, totalDebit, totalCredit) {
    const d = parseMoney(totalDebit);
    const c = parseMoney(totalCredit);
    const isDebitNature = nature === 'مدين' || String(nature).toLowerCase() === 'debit';
    return round2(isDebitNature ? (d - c) : (c - d));
  }

  /**
   * Trial Balance aggregator across all accounts and journal entries.
   */
  function computeTrialBalance(accounts = [], journalEntries = []) {
    const accStats = new Map();

    (accounts || []).forEach(acc => {
      const code = String(acc.Code || acc.code || '').trim();
      if (!code) return;
      accStats.set(code, {
        code,
        name: acc.Name || acc.name || '',
        nature: acc.Nature || acc.nature || (code.startsWith('1') || code.startsWith('5') ? 'مدين' : 'دائن'),
        parentCode: acc.ParentCode || acc.parentCode || '',
        debit: 0,
        credit: 0,
        netBalance: 0
      });
    });

    (journalEntries || []).forEach(entry => {
      const lines = entry.Lines || entry.lines || [];
      lines.forEach(l => {
        const code = String(l.AccountCode || l.accountCode || '').trim();
        const debit = parseMoney(l.Debit || l.debit || 0);
        const credit = parseMoney(l.Credit || l.credit || 0);

        let stat = accStats.get(code);
        if (!stat) {
          stat = {
            code,
            name: l.AccountName || l.accountName || code,
            nature: (code.startsWith('1') || code.startsWith('5')) ? 'مدين' : 'دائن',
            parentCode: '',
            debit: 0,
            credit: 0,
            netBalance: 0
          };
          accStats.set(code, stat);
        }

        stat.debit = sumMoney(stat.debit, debit);
        stat.credit = sumMoney(stat.credit, credit);
      });
    });

    let totalDebits = 0;
    let totalCredits = 0;
    const rows = [];

    accStats.forEach(stat => {
      stat.netBalance = computeAccountNetBalance(stat.nature, stat.debit, stat.credit);
      totalDebits = sumMoney(totalDebits, stat.debit);
      totalCredits = sumMoney(totalCredits, stat.credit);
      rows.push(stat);
    });

    const isBalanced = Math.abs(totalDebits - totalCredits) <= 0.005;

    return {
      rows,
      totalDebits,
      totalCredits,
      difference: round2(Math.abs(totalDebits - totalCredits)),
      isBalanced
    };
  }

  /* =========================================================================
     5. Permissions & RBAC Evaluation Engine
     ========================================================================= */

  const VALID_APP_SECTIONS = [
    'maintenance',
    'pos',
    'invoices',
    'cameras',
    'cameras_projects',
    'cameras_visits',
    'cameras_contracts',
    'cashdrawer',
    'daily',
    'finance',
    'inventory',
    'barcode',
    'audit',
    'users',
    'settings'
  ];

  /**
   * Pure evaluation of user permission to access an application section.
   */
  function checkUserSectionAccess(user, section) {
    if (!user) return false;
    const role = String(user.role || user.Role || '').toLowerCase();

    // Strict Rule: Settings is exclusive to Administrator
    if (section === 'settings') {
      return role === 'admin';
    }

    // Administrator has access to all sections
    if (role === 'admin') {
      return true;
    }

    // Superusers have access to audit and users management
    if (section === 'users' || section === 'audit') {
      return !!(user.superuser || user.Superuser);
    }

    // Normalize sections list
    const secs = Array.isArray(user.sections || user.Sections)
      ? (user.sections || user.Sections)
      : String(user.sections || user.Sections || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);

    // Sub-sections for CCTV / Cameras
    if (section === 'cameras_projects' || section === 'cameras_visits' || section === 'cameras_contracts') {
      if (secs.includes('cameras')) return true;
    }

    return secs.includes(section);
  }

  /**
   * Check if a user role can perform sensitive operational actions.
   */
  function checkActionAuthorization(userOrRole, action) {
    const role = typeof userOrRole === 'object' && userOrRole !== null
      ? String(userOrRole.role || userOrRole.Role || '').toLowerCase()
      : String(userOrRole || '').toLowerCase();

    const ACTION_PERMISSIONS = {
      deleteReceipt: ['admin'],
      transferWarehouseStock: ['admin', 'accountant'],
      refundPayment: ['admin', 'accountant'],
      openCashDrawer: ['admin', 'cashier', 'accountant'],
      modifyJournalEntries: ['admin', 'accountant'],
      manageUsers: ['admin'],
      restoreBackup: ['admin']
    };

    const allowed = ACTION_PERMISSIONS[action];
    if (!allowed) return false;
    return allowed.includes(role);
  }

  /* =========================================================================
     6. Customer & Supplier Statements Math
     ========================================================================= */

  /**
   * Calculate cumulative customer balance (Total Receivable).
   * Balance = (Cost of receipts - Payments) + Unpaid Invoices
   */
  function calculateCustomerBalance(receipts = [], invoices = [], payments = []) {
    let totalMaintCost = 0;
    let totalMaintPaid = 0;

    (receipts || []).forEach(r => {
      const c = parseMoney(r.cost);
      const p = parseMoney(r.partsCost);
      const o = parseMoney(r.otherAccountAmount);
      const dep = parseMoney(r.deposit);
      const ref = parseMoney(r.refunded);
      totalMaintCost = sumMoney(totalMaintCost, c + p + o);
      totalMaintPaid = sumMoney(totalMaintPaid, dep - ref);
    });

    let totalInvoiced = 0;
    let totalInvoicePaid = 0;

    (invoices || []).forEach(inv => {
      const t = parseMoney(inv.Total || inv.grandTotal);
      const paid = parseMoney(inv.AmountPaid || inv.amountPaid);
      totalInvoiced = sumMoney(totalInvoiced, t);
      totalInvoicePaid = sumMoney(totalInvoicePaid, paid);
    });

    const netReceivable = round2((totalMaintCost - totalMaintPaid) + (totalInvoiced - totalInvoicePaid));

    return {
      totalMaintCost,
      totalMaintPaid,
      totalInvoiced,
      totalInvoicePaid,
      netReceivable
    };
  }

  /* =========================================================================
     6. Authentication & Local Vault Verification Engine
     ========================================================================= */

  function fallbackSha256(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    const lengthProperty = 'length';
    let i, j;
    let result = '';

    const words = [];
    const asciiBitLength = ascii[lengthProperty] * 8;
    let hash = [];
    const k = [];
    let primeCounter = 0;

    const isComposite = {};
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isComposite[i] = candidate;
        }
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }

    ascii += '\x80';
    while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
    words[words[lengthProperty]] = (asciiBitLength | 0);

    for (j = 0; j < words[lengthProperty];) {
      const w = words.slice(j, j += 16);
      const oldHash = hash;
      hash = hash.slice(0, 8);

      for (i = 0; i < 64; i++) {
        const w15 = w[i - 15], w2 = w[i - 2];
        const a = hash[0], e = hash[4];
        const temp1 = hash[7]
          + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
          + ((e & hash[5]) ^ ((~e) & hash[6]))
          + k[i]
          + (w[i] = (i < 16) ? w[i] : (
              w[i - 16]
              + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
              + w[i - 7]
              + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
            ) | 0
          );
        const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
          + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }

      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }

    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        const b = (hash[i] >> (j * 8)) & 255;
        result += ((b < 16) ? 0 : '') + b.toString(16);
      }
    }
    return result;
  }

  async function sha256Hex(str) {
    if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
      const msgBuffer = new TextEncoder().encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    return fallbackSha256(str);
  }

  async function hashPasswordWithSalt(password, salt) {
    const s = salt || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Math.random().toString(36).slice(2) + Date.now().toString(36));
    let digest = String(password).trim() + ':' + s;
    for (let i = 0; i < 50; i++) {
      digest = await sha256Hex(digest);
    }
    return { hash: digest, salt: s };
  }

  async function verifyLocalPassword(password, vaultEntry) {
    if (!vaultEntry || !vaultEntry.hash) return false;
    const s = vaultEntry.salt || '';
    let digest = String(password).trim() + ':' + s;
    for (let i = 0; i < 50; i++) {
      digest = await sha256Hex(digest);
    }
    return digest === vaultEntry.hash;
  }

  function checkEmergencyAdminBootstrap(name, password) {
    const cleanName = String(name || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();
    if (cleanName === 'admin' && (cleanPass === 'admin' || cleanPass === '123456')) {
      return {
        name: 'admin',
        role: 'admin',
        superuser: true,
        sections: VALID_APP_SECTIONS
      };
    }
    return null;
  }

  /* =========================================================================
     6. HR, Employee Advances & Credit Limit Engine
     ========================================================================= */

  /**
   * Computes comprehensive financial balances for an employee:
   * - Active advances balance (سلف قائمة)
   * - Credit purchases balance (ذمم مشتريات بالآجل)
   * - Credit limit and available purchase headroom (سقف الائتمان والمتاح)
   * - Basic salary (الراتب الأساسي)
   */
  function computeEmployeeBalances(employeeName, appState = {}) {
    if (!employeeName) {
      return {
        advancesBalance: 0,
        purchasesBalance: 0,
        salary: 0,
        purchasesCreditLimit: 0,
        availableCredit: 0,
        totalDueFromEmployee: 0,
        activeAdvancesCount: 0
      };
    }
    const cleanName = String(employeeName).trim().toLowerCase();
    const user = (appState.users || []).find(u => String(u.Name || '').trim().toLowerCase() === cleanName) || {};

    const salary = round2(user.Salary || 0);
    const purchasesCreditLimit = round2(user.PurchasesCreditLimit || 0);

    // 1. Advances Balance: sum of remaining balance of active advances
    const advances = (appState.employeeAdvances || []).filter(a => {
      return String(a.EmployeeName || '').trim().toLowerCase() === cleanName && a.Status !== 'paid';
    });
    const advancesBalance = round2(advances.reduce((sum, a) => sum + round2(a.RemainingBalance != null ? a.RemainingBalance : a.Amount || 0), 0));

    // 2. Purchases Balance:
    // Debits: POS sales with employee credit
    let totalPurchases = 0;
    (appState.sales || []).forEach(s => {
      const sCust = String(s.CustomerName || '').trim().toLowerCase();
      if (sCust === cleanName) {
        let isEmpCredit = false;
        let empCreditAmount = 0;
        if (s.SplitsJSON) {
          try {
            const splits = typeof s.SplitsJSON === 'string' ? JSON.parse(s.SplitsJSON) : s.SplitsJSON;
            if (Array.isArray(splits)) {
              splits.forEach(sp => {
                const m = String(sp.methodId || '').toLowerCase();
                if (m === 'employee_credit' || m === 'employee' || m.includes('موظف')) {
                  isEmpCredit = true;
                  empCreditAmount += round2(sp.amount || 0);
                }
              });
            }
          } catch(e){}
        }
        const pMethod = String(s.PaymentMethod || '').toLowerCase();
        if (pMethod.includes('موظف') || pMethod === 'employee_credit') {
          isEmpCredit = true;
          if (empCreditAmount === 0) empCreditAmount = round2(s.Total || 0);
        }
        if (isEmpCredit && empCreditAmount > 0) {
          totalPurchases += empCreditAmount;
        }
      }
    });

    // Credits: repayments or payroll deductions for purchases
    let totalPurchaseRepayments = 0;
    (appState.employeeAdvanceRepayments || []).forEach(r => {
      const rName = String(r.EmployeeName || '').trim().toLowerCase();
      if (rName === cleanName && (r.Type === 'purchase_repayment' || r.Type === 'purchase_repayment_cash' || r.Type === 'payroll_purchase_deduction')) {
        totalPurchaseRepayments += round2(r.Amount || 0);
      }
    });

    const purchasesBalance = Math.max(0, round2(totalPurchases - totalPurchaseRepayments));
    const availableCredit = Math.max(0, round2(purchasesCreditLimit - purchasesBalance));
    const totalDueFromEmployee = round2(advancesBalance + purchasesBalance);

    return {
      advancesBalance,
      purchasesBalance,
      salary,
      purchasesCreditLimit,
      availableCredit,
      totalDueFromEmployee,
      activeAdvancesCount: advances.length
    };
  }

  /**
   * Validates whether an employee can purchase on credit within their defined credit limit.
   */
  function checkEmployeeCreditLimit(employeeName, purchaseAmount, appState = {}) {
    const amt = round2(purchaseAmount);
    const balances = computeEmployeeBalances(employeeName, appState);
    const limit = balances.purchasesCreditLimit;

    if (limit <= 0) {
      // If no limit defined (0), credit purchase is blocked by default unless authorized
      return {
        allowed: false,
        reason: 'no_credit_limit',
        message: `الموظف (${employeeName}) ليس لديه سقف ائتماني محدد لمشتريات الآجل (السقف الحالي: 0 ج.م). يلزم تحديد سقف أولاً أو اعتماد المشرف.`,
        currentBalance: balances.purchasesBalance,
        creditLimit: limit,
        availableCredit: 0,
        purchaseAmount: amt,
        excess: amt
      };
    }

    const projectedBalance = round2(balances.purchasesBalance + amt);
    if (projectedBalance > limit) {
      const excess = round2(projectedBalance - limit);
      return {
        allowed: false,
        reason: 'limit_exceeded',
        message: `المبلغ المطلوب (${formatMoney(amt)}) يتجاوز السقف الائتماني المتاح للموظف (${formatMoney(balances.availableCredit)} من أصل ${formatMoney(limit)}). الزيادة: ${formatMoney(excess)}.`,
        currentBalance: balances.purchasesBalance,
        creditLimit: limit,
        availableCredit: balances.availableCredit,
        purchaseAmount: amt,
        excess: excess
      };
    }

    return {
      allowed: true,
      reason: 'within_limit',
      message: `ضمن السقف الائتماني المعتمد (المتبقي بعد الشراء: ${formatMoney(round2(balances.availableCredit - amt))})`,
      currentBalance: balances.purchasesBalance,
      creditLimit: limit,
      availableCredit: balances.availableCredit,
      purchaseAmount: amt,
      excess: 0
    };
  }

  /**
   * Builds double-entry balanced journal lines for advance disbursement:
   * Dr. 1106 (سلف وعهد الموظفين)
   * Cr. 1101 (الخزينة) or 1102 (البنك)
   */
  function buildAdvanceDisbursementJournalLines({ employeeName, amount, paymentMethod }) {
    const amt = round2(amount);
    const isBank = String(paymentMethod || '').toLowerCase().includes('بنك') || 
                   String(paymentMethod || '').toLowerCase().includes('فيزا') || 
                   String(paymentMethod || '').toLowerCase().includes('انستاباي') || 
                   String(paymentMethod || '').toLowerCase().includes('محفظ');
    const creditCode = isBank ? '1102' : '1101';
    const creditName = isBank ? 'البنك والحسابات الإلكترونية' : 'الخزينة الرئيسية (النقدية)';

    return [
      {
        AccountCode: '1106',
        AccountName: 'سلف وعهد الموظفين',
        Debit: amt,
        Credit: 0,
        Notes: `صرف سلفة للموظف (${employeeName})`
      },
      {
        AccountCode: creditCode,
        AccountName: creditName,
        Debit: 0,
        Credit: amt,
        Notes: `صرف نقدي عبر [${paymentMethod || 'الخزينة'}]`
      }
    ];
  }

  /**
   * Builds double-entry balanced journal lines for advance cash repayment:
   * Dr. 1101 (الخزينة) or 1102 (البنك)
   * Cr. 1106 (سلف وعهد الموظفين)
   */
  function buildAdvanceRepaymentJournalLines({ employeeName, amount, paymentMethod }) {
    const amt = round2(amount);
    const isBank = String(paymentMethod || '').toLowerCase().includes('بنك') || 
                   String(paymentMethod || '').toLowerCase().includes('فيزا') || 
                   String(paymentMethod || '').toLowerCase().includes('انستاباي') || 
                   String(paymentMethod || '').toLowerCase().includes('محفظ');
    const debitCode = isBank ? '1102' : '1101';
    const debitName = isBank ? 'البنك والحسابات الإلكترونية' : 'الخزينة الرئيسية (النقدية)';

    return [
      {
        AccountCode: debitCode,
        AccountName: debitName,
        Debit: amt,
        Credit: 0,
        Notes: `تحصيل سداد سلفة الموظف (${employeeName}) عبر [${paymentMethod || 'الخزينة'}]`
      },
      {
        AccountCode: '1106',
        AccountName: 'سلف وعهد الموظفين',
        Debit: 0,
        Credit: amt,
        Notes: `سداد سلفة للموظف (${employeeName})`
      }
    ];
  }

  /**
   * Builds double-entry balanced journal lines for employee credit purchases cash repayment:
   * Dr. 1101 (الخزينة) or 1102 (البنك)
   * Cr. 1107 (مشتريات الموظفين بالآجل)
   */
  function buildEmployeePurchasePaymentJournalLines({ employeeName, amount, paymentMethod }) {
    const amt = round2(amount);
    const isBank = String(paymentMethod || '').toLowerCase().includes('بنك') || 
                   String(paymentMethod || '').toLowerCase().includes('فيزا') || 
                   String(paymentMethod || '').toLowerCase().includes('انستاباي') || 
                   String(paymentMethod || '').toLowerCase().includes('محفظ');
    const debitCode = isBank ? '1102' : '1101';
    const debitName = isBank ? 'البنك والحسابات الإلكترونية' : 'الخزينة الرئيسية (النقدية)';

    return [
      {
        AccountCode: debitCode,
        AccountName: debitName,
        Debit: amt,
        Credit: 0,
        Notes: `تحصيل سداد مشتريات الموظف (${employeeName}) بالآجل عبر [${paymentMethod || 'الخزينة'}]`
      },
      {
        AccountCode: '1107',
        AccountName: 'مشتريات الموظفين بالآجل',
        Debit: 0,
        Credit: amt,
        Notes: `سداد مشتريات موظف (${employeeName})`
      }
    ];
  }

  /**
   * Builds compound balanced journal entry for Monthly Payroll Run:
   * Dr. 5203 (رواتب ومكافآت الفنيين والموظفين) -> Total Gross
   * Cr. 1106 (سلف وعهد الموظفين) -> Total Advances Deducted
   * Cr. 1107 (مشتريات الموظفين بالآجل) -> Total Purchases Deducted
   * Cr. 4201 (إيرادات وأرباح متنوعة / تسوية جزاءات) -> Total Penalties Deducted (if any)
   * Cr. 1101 / 1102 (الخزينة / البنك) -> Total Net Paid to Staff
   */
  function buildPayrollJournalLines({ month, totalGross, totalAdvancesDeducted = 0, totalPurchasesDeducted = 0, totalPenalties = 0, totalNetPaid, paymentMethod = 'نقدي (الخزينة)' }) {
    const gross = round2(totalGross);
    const adv = round2(totalAdvancesDeducted);
    const pur = round2(totalPurchasesDeducted);
    const pen = round2(totalPenalties);
    const net = round2(totalNetPaid);

    const isBank = String(paymentMethod || '').toLowerCase().includes('بنك') || 
                   String(paymentMethod || '').toLowerCase().includes('فيزا') || 
                   String(paymentMethod || '').toLowerCase().includes('انستاباي') || 
                   String(paymentMethod || '').toLowerCase().includes('محفظ');
    const payoutCode = isBank ? '1102' : '1101';
    const payoutName = isBank ? 'البنك والحسابات الإلكترونية' : 'الخزينة الرئيسية (النقدية)';

    const lines = [
      {
        AccountCode: '5203',
        AccountName: 'رواتب ومكافآت الفنيين والموظفين',
        Debit: gross,
        Credit: 0,
        Notes: `إجمالي استحقاق مسير رواتب شهر [${month || ''}]`
      }
    ];

    if (adv > 0) {
      lines.push({
        AccountCode: '1106',
        AccountName: 'سلف وعهد الموظفين',
        Debit: 0,
        Credit: adv,
        Notes: `استقطاع أقساط سلف موظفين من راتب شهر [${month || ''}]`
      });
    }

    if (pur > 0) {
      lines.push({
        AccountCode: '1107',
        AccountName: 'مشتريات الموظفين بالآجل',
        Debit: 0,
        Credit: pur,
        Notes: `استقطاع مشتريات موظفين بالآجل من راتب شهر [${month || ''}]`
      });
    }

    if (pen > 0) {
      lines.push({
        AccountCode: '4201',
        AccountName: 'إيرادات وأرباح متنوعة وزيادة الجرد',
        Debit: 0,
        Credit: pen,
        Notes: `تسوية جزاءات وخصومات إدارية لمسير شهر [${month || ''}]`
      });
    }

    if (net > 0) {
      lines.push({
        AccountCode: payoutCode,
        AccountName: payoutName,
        Debit: 0,
        Credit: net,
        Notes: `صرف صافي الرواتب المستحقة لمسير شهر [${month || ''}]`
      });
    }

    return lines;
  }

  return {
    toEngDigits,
    parseMoney,
    round2,
    formatMoney,
    sumMoney,
    DEFAULT_VAT_RATE,
    calculateExclusiveVAT,
    extractInclusiveVAT,
    calculateInvoiceTotals,
    calculateVATReturn,
    calculateGrossProfit,
    calculateNetProfit,
    calculateInventoryValuation,
    isBalancedEntry,
    validateJournalEntryLines,
    computeAccountNetBalance,
    computeTrialBalance,
    VALID_APP_SECTIONS,
    checkUserSectionAccess,
    checkActionAuthorization,
    calculateCustomerBalance,
    fallbackSha256,
    sha256Hex,
    hashPasswordWithSalt,
    verifyLocalPassword,
    checkEmergencyAdminBootstrap,
    computeEmployeeBalances,
    checkEmployeeCreditLimit,
    buildAdvanceDisbursementJournalLines,
    buildAdvanceRepaymentJournalLines,
    buildEmployeePurchasePaymentJournalLines,
    buildPayrollJournalLines
  };
});
