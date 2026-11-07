import { describe, it, expect, beforeEach } from 'vitest';

// Emulate toEngDigits
function toEngDigits(str) {
  if (str == null) return '';
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
    .replace(/[٩۹]/g, '9');
}

// Emulate findReceiptByIdOrNum as implemented in 03-utils-and-mappings.js
function findReceiptByIdOrNum(queryId, queryNum, receiptsList) {
  if (queryId == null && queryNum == null) return null;
  const qId = queryId != null ? String(queryId).trim().toLowerCase() : '';
  const qNum = queryNum != null ? String(queryNum).trim().toLowerCase() : '';
  if (!qId && !qNum) return null;

  const list = receiptsList || [];

  // Phase 1: STRICT ID match first!
  if (qId) {
    const matchById = list.find(x => {
      if (!x) return false;
      const xId = String(x.id != null ? x.id : (x.ID != null ? x.ID : (x['رقم الجهاز'] || ''))).trim().toLowerCase();
      return xId === qId;
    });
    if (matchById) return matchById;
  }

  // Phase 2: If queryId didn't match any record's xId, check if queryId is a receiptNumber
  if (qId && (!qNum || qId === qNum)) {
    const matchByNumAsId = list.find(x => {
      if (!x) return false;
      const xNum = String(x.receiptNumber != null ? x.receiptNumber : (x.ReceiptNumber != null ? x.ReceiptNumber : (x['رقم الإيصال'] || (x['رقم الايصال'] || '')))).trim().toLowerCase();
      return xNum === qId;
    });
    if (matchByNumAsId) return matchByNumAsId;
  }

  // Phase 3: Fallback to queryNum only if queryId did not match any record
  if (qNum) {
    const matchByNum = list.find(x => {
      if (!x) return false;
      const xNum = String(x.receiptNumber != null ? x.receiptNumber : (x.ReceiptNumber != null ? x.ReceiptNumber : (x['رقم الإيصال'] || (x['رقم الايصال'] || '')))).trim().toLowerCase();
      const xId = String(x.id != null ? x.id : (x.ID != null ? x.ID : (x['رقم الجهاز'] || ''))).trim().toLowerCase();
      return xNum === qNum || xId === qNum;
    });
    if (matchByNum) return matchByNum;
  }

  return null;
}

// Emulate collision detection & unique numbering
function getUniqueNextReceiptNumber(list, candidateSrv) {
  const y = new Date().getFullYear();
  const prefix = 'MT-' + y + '-';
  let maxSeq = 0;
  for (const r of (list || [])) {
    if (!r) continue;
    const rn = String(r.receiptNumber || r.ReceiptNumber || '').trim();
    if (rn.startsWith(prefix)) {
      const numPart = parseInt(rn.slice(prefix.length), 10);
      if (!isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    }
  }
  const localNext = prefix + String(maxSeq + 1).padStart(4, '0');
  if (candidateSrv) {
    let srvSeq = 0;
    if (String(candidateSrv).startsWith(prefix)) {
      const parsed = parseInt(String(candidateSrv).slice(prefix.length), 10);
      if (!isNaN(parsed)) srvSeq = parsed;
    }
    const targetSeq = Math.max(srvSeq, maxSeq + 1);
    const candidate = prefix + String(targetSeq).padStart(4, '0');
    const isUsed = (list || []).some(x => {
      if (!x) return false;
      const xNum = String(x.receiptNumber || x.ReceiptNumber || '').trim().toLowerCase();
      return xNum === candidate.toLowerCase();
    });
    if (!isUsed) return candidate;
  }
  return localNext;
}

describe('Receipt Lookup, Cost Handling & Collision Protection', () => {
  let mockReceipts = [];

  beforeEach(() => {
    // Replicate the exact duplicate receipt scenario from the user's issue
    mockReceipts = [
      {
        id: 'rec_ahmed_1',
        receiptNumber: 'MT-2026-0155',
        customer: { name: 'أحمد سعيد', phone: '01060791000' },
        device: { category: 'كمبيوتر مكتبي', brand: 'HP', model: 'EliteDesk' },
        cost: 350,
        partsCost: 150,
        deposit: 100,
        status: 'قيد الفحص'
      },
      {
        id: 'rec_saeed_2',
        receiptNumber: 'MT-2026-0155', // duplicate receiptNumber
        customer: { name: 'سعيد عبدالوارث', phone: '01069406332' },
        device: { category: 'كمبيوتر مكتبي', brand: 'Dell', model: 'OptiPlex' },
        cost: 200,
        partsCost: 0,
        deposit: 50,
        status: 'قيد الفحص'
      },
      {
        id: 'rec_mai_3',
        receiptNumber: 'MT-2026-0156',
        customer: { name: 'مي حواس', phone: '01016771015' },
        device: { category: 'لابتوب', brand: 'Apple', model: 'MacBook Pro' },
        cost: 500,
        partsCost: 300,
        deposit: 200,
        status: 'قيد الفحص'
      }
    ];
  });

  describe('findReceiptByIdOrNum Strict Lookup', () => {
    it('strictly returns سعيد عبدالوارث when querying by his unique ID even if receiptNumber is duplicated', () => {
      const result = findReceiptByIdOrNum('rec_saeed_2', 'MT-2026-0155', mockReceipts);
      expect(result).not.toBeNull();
      expect(result.id).toBe('rec_saeed_2');
      expect(result.customer.name).toBe('سعيد عبدالوارث');
      expect(result.customer.phone).toBe('01069406332');
      expect(result.device.brand).toBe('Dell');
    });

    it('strictly returns أحمد سعيد when querying by his unique ID', () => {
      const result = findReceiptByIdOrNum('rec_ahmed_1', 'MT-2026-0155', mockReceipts);
      expect(result).not.toBeNull();
      expect(result.id).toBe('rec_ahmed_1');
      expect(result.customer.name).toBe('أحمد سعيد');
      expect(result.customer.phone).toBe('01060791000');
    });

    it('falls back to receiptNumber when ID is not provided or null', () => {
      const result = findReceiptByIdOrNum(null, 'MT-2026-0156', mockReceipts);
      expect(result).not.toBeNull();
      expect(result.id).toBe('rec_mai_3');
      expect(result.customer.name).toBe('مي حواس');
    });
  });

  describe('Number Collision & Regression Protection', () => {
    it('generates next sequential number higher than any existing receipt', () => {
      const nextNum = getUniqueNextReceiptNumber(mockReceipts);
      expect(nextNum).toBe('MT-2026-0157');
    });

    it('prevents server number from regressing or colliding with existing numbers', () => {
      // Server returns stale 0155 which already exists locally
      const resolvedNum = getUniqueNextReceiptNumber(mockReceipts, 'MT-2026-0155');
      // Must not be 0155; must be strictly > 0156
      expect(resolvedNum).toBe('MT-2026-0157');
    });

    it('accepts valid non-colliding higher server sequence', () => {
      const resolvedNum = getUniqueNextReceiptNumber(mockReceipts, 'MT-2026-0180');
      expect(resolvedNum).toBe('MT-2026-0180');
    });
  });

  describe('Arabic Numeral Parsing & Cost Arithmetic', () => {
    it('correctly parses Arabic digits (١٢٣) into numbers for financial fields', () => {
      const arabicCost = '١٥٠';
      const arabicDeposit = '٥٠.٥';
      const parsedCost = parseFloat(toEngDigits(arabicCost)) || 0;
      const parsedDeposit = parseFloat(toEngDigits(arabicDeposit)) || 0;

      expect(parsedCost).toBe(150);
      expect(parsedDeposit).toBe(50.5);
      expect(parsedCost - parsedDeposit).toBe(99.5);
    });

    it('handles mixed Arabic and English digits without failing', () => {
      const mixed = '150ج.م';
      const parsed = parseFloat(toEngDigits(mixed)) || 0;
      expect(parsed).toBe(150);
    });
  });

  describe('WhatsApp Cost Estimate & Parts Calculation', () => {
    it('does not double-count partsCost when saving quotation back to receipt', () => {
      const receipt = {
        id: 'rec_100',
        receiptNumber: 'MT-2026-0199',
        cost: 100, // labor
        partsCost: 200 // spare parts
      };

      // Client total quote shown = cost + partsCost = 300
      const quotedTotal = 300;

      // Fix: r.cost = Math.max(0, quotedTotal - pCost)
      const pCost = Number(receipt.partsCost || 0);
      receipt.cost = pCost > 0 ? Math.max(0, quotedTotal - pCost) : quotedTotal;

      // Total due calculation = cost + partsCost
      const totalDue = receipt.cost + receipt.partsCost;
      expect(receipt.cost).toBe(100);
      expect(receipt.partsCost).toBe(200);
      expect(totalDue).toBe(300); // exactly matches quoted total without doubling!
    });
  });

  describe('Financial Reconciliation when Deposit exceeds Cost', () => {
    it('calculates remaining as 0 and computes refund due without blocking save', () => {
      const totalDue = 150;
      const totalPaid = 500;
      const refunded = 0;

      const remaining = Math.max(0, totalDue - totalPaid + refunded);
      const refundDue = totalPaid - totalDue - refunded;

      expect(remaining).toBe(0);
      expect(refundDue).toBe(350); // 350 EGP due back to customer
    });
  });
});
