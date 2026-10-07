import { describe, it, expect, beforeEach } from 'vitest';

// Emulate convertTrackedToReceipt logic
function convertTrackedToReceipt(tr) {
  if (!tr || !tr.receiptNumber) return null;
  const num = String(tr.receiptNumber).trim();
  const rawName = (tr.customer && tr.customer.name) ? String(tr.customer.name).trim() : 'عميل';
  const cName = rawName.replace(/\s*\*\*\*\s*$/, '').trim() || 'عميل';

  return {
    id: tr.id || ('r_sync_' + num.replace(/[^a-zA-Z0-9]/g, '_')),
    receiptNumber: num,
    date: tr.date ? String(tr.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
    customer: {
      name: cName,
      phone: (tr.customer && tr.customer.phone) || ''
    },
    device: {
      category: (tr.device && tr.device.category) || 'لابتوب',
      brand: (tr.device && tr.device.brand) || '',
      model: (tr.device && tr.device.model) || ''
    },
    status: tr.status || 'قيد الفحص',
    cost: Number(tr.totalCost || tr.cost || 0),
    deposit: Number(tr.deposit || 0),
    paid: !!tr.isPaid
  };
}

// Emulate nextReceiptNumberLocal logic
function nextReceiptNumberLocal(receipts) {
  const list = receipts || [];
  const y = new Date().getFullYear();
  const prefix = 'MT-' + y + '-';
  let maxSeq = 0;
  for (const r of list) {
    const rn = String(r.receiptNumber || r.ReceiptNumber || '');
    if (rn.startsWith(prefix)) {
      const numPart = parseInt(rn.slice(prefix.length), 10);
      if (!isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    }
  }
  return prefix + String(maxSeq + 1).padStart(4, '0');
}

describe('Receipt Synchronization & Numbering Engine (>100)', () => {
  it('correctly maps public tracked receipt payload for receipts exceeding 100', () => {
    const trackedPayload = {
      receiptNumber: 'MT-2026-0105',
      date: '2026-10-05T21:00:00.000Z',
      customer: { name: 'ماريو سنترال العجيزي' },
      device: { category: 'لابتوب', brand: 'Lenovo', model: '' },
      faults: ['سوفتوير / ويندوز'],
      status: 'مكتمل',
      totalCost: 150,
      deposit: 0,
      isPaid: false
    };

    const receipt = convertTrackedToReceipt(trackedPayload);
    expect(receipt).toBeDefined();
    expect(receipt.receiptNumber).toBe('MT-2026-0105');
    expect(receipt.customer.name).toBe('ماريو سنترال العجيزي');
    expect(receipt.cost).toBe(150);
    expect(receipt.status).toBe('مكتمل');
    expect(receipt.date).toBe('2026-10-05');
  });

  it('correctly advances receipt numbers across 99, 100, and 105', () => {
    const curYear = new Date().getFullYear();

    // Stuck at 97 -> next is 98
    expect(nextReceiptNumberLocal([{ receiptNumber: `MT-${curYear}-0097` }]))
      .toBe(`MT-${curYear}-0098`);

    // At 99 -> next is 100
    expect(nextReceiptNumberLocal([{ receiptNumber: `MT-${curYear}-0099` }]))
      .toBe(`MT-${curYear}-0100`);

    // At 100 -> next is 101
    expect(nextReceiptNumberLocal([{ receiptNumber: `MT-${curYear}-0100` }]))
      .toBe(`MT-${curYear}-0101`);

    // At 105 -> next is 106
    expect(nextReceiptNumberLocal([
      { receiptNumber: `MT-${curYear}-0097` },
      { receiptNumber: `MT-${curYear}-0104` },
      { receiptNumber: `MT-${curYear}-0105` }
    ])).toBe(`MT-${curYear}-0106`);
  });

  it('identifies and orders sequence gaps correctly', () => {
    const curYear = new Date().getFullYear();
    const existing = [
      { receiptNumber: `MT-${curYear}-0097` }
    ];

    const prefix = `MT-${curYear}-`;
    let maxSeq = 0;
    for (const r of existing) {
      const s = parseInt(r.receiptNumber.slice(prefix.length), 10);
      if (s > maxSeq) maxSeq = s;
    }

    expect(maxSeq).toBe(97);
    const missing = [];
    for (let seq = maxSeq + 1; seq <= 105; seq++) {
      missing.push(prefix + String(seq).padStart(4, '0'));
    }

    expect(missing).toHaveLength(8);
    expect(missing[0]).toBe(`MT-${curYear}-0098`);
    expect(missing[7]).toBe(`MT-${curYear}-0105`);
  });

  it('correctly filters receipts by search query (customer, receipt number, device, phone)', () => {
    const receipts = [
      {
        receiptNumber: 'MT-2026-0105',
        customer: { name: 'ماريو سنترال العجيزي', phone: '01505787716' },
        device: { category: 'لابتوب', brand: 'Lenovo', model: 'IdeaPad 3' },
        status: 'مكتمل'
      },
      {
        receiptNumber: 'MT-2026-0104',
        customer: { name: 'فيكتور', phone: '01223407165' },
        device: { category: 'لابتوب', brand: 'infinix', model: 'zero' },
        status: 'قيد الفحص'
      },
      {
        receiptNumber: 'MT-2026-0103',
        customer: { name: 'عمر نجم', phone: '01092446124' },
        device: { category: 'لابتوب', brand: 'Lenovo', model: 'Legion' },
        status: 'مكتمل'
      }
    ];

    const filter = (q) => {
      const qTerm = q.trim().toLowerCase();
      return receipts.filter(r => {
        const rNum = String(r.receiptNumber || '').toLowerCase();
        const rName = String(r.customer?.name || '').toLowerCase();
        const rPhone = String(r.customer?.phone || '');
        const rModel = String(r.device?.model || '').toLowerCase();
        const rBrand = String(r.device?.brand || '').toLowerCase();
        return rNum.includes(qTerm) || rName.includes(qTerm) || rPhone.includes(qTerm) || rModel.includes(qTerm) || rBrand.includes(qTerm);
      });
    };

    expect(filter('ماريو')).toHaveLength(1);
    expect(filter('ماريو')[0].receiptNumber).toBe('MT-2026-0105');

    expect(filter('0105')).toHaveLength(1);
    expect(filter('Lenovo')).toHaveLength(2);
    expect(filter('01223407165')).toHaveLength(1);
    expect(filter('01223407165')[0].customer.name).toBe('فيكتور');
    expect(filter('غير موجود')).toHaveLength(0);
  });

  describe('Optimistic Status Updates & Conflict Protection Engine', () => {
    // Mirror the merge logic implemented in 03-utils-and-mappings.js
    const _optimisticReceiptLocks = new Map();
    function markReceiptOptimisticallyUpdated(key, status) {
      if (!key) return;
      _optimisticReceiptLocks.set(String(key).trim().toLowerCase(), { status, timestamp: Date.now() });
    }
    function getOptimisticReceiptStatus(key) {
      if (!key) return null;
      const entry = _optimisticReceiptLocks.get(String(key).trim().toLowerCase());
      if (!entry) return null;
      if (Date.now() - entry.timestamp > 180000) return null;
      return entry.status;
    }
    beforeEach(() => {
      _optimisticReceiptLocks.clear();
    });
    function mergeCloudReceiptsWithLocal(cloudReceipts, localReceipts, syncQueue = []) {
      if (!Array.isArray(cloudReceipts)) return localReceipts || [];
      if (!Array.isArray(localReceipts) || localReceipts.length === 0) return cloudReceipts;

      const localMap = new Map();
      localReceipts.forEach(r => {
        if (!r) return;
        const k1 = r.id != null ? String(r.id).trim().toLowerCase() : '';
        const k2 = r.receiptNumber != null ? String(r.receiptNumber).trim().toLowerCase() : '';
        if (k1) localMap.set(k1, r);
        if (k2) localMap.set(k2, r);
      });

      const merged = cloudReceipts.map(cloudR => {
        if (!cloudR) return cloudR;
        const k1 = cloudR.id != null ? String(cloudR.id).trim().toLowerCase() : '';
        const k2 = cloudR.receiptNumber != null ? String(cloudR.receiptNumber).trim().toLowerCase() : '';
        const localR = (k1 && localMap.get(k1)) || (k2 && localMap.get(k2));

        if (!localR) return cloudR;

        const optStatus = getOptimisticReceiptStatus(k1) || getOptimisticReceiptStatus(k2);
        const isRecentLocal = localR._localModifiedAt && (Date.now() - localR._localModifiedAt < 180000);

        const hasPendingSync = syncQueue.some(qItem => {
          if (qItem.action !== 'saveReceipt') return false;
          const d = qItem.data && (qItem.data.data || qItem.data);
          if (!d) return false;
          const qId = String(d.ID || d.id || '').trim().toLowerCase();
          const qNum = String(d.ReceiptNumber || d.receiptNumber || '').trim().toLowerCase();
          return (k1 && qId === k1) || (k2 && qNum === k2);
        });

        if (optStatus || isRecentLocal || hasPendingSync) {
          return {
            ...cloudR,
            ...localR,
            status: optStatus || localR.status || cloudR.status,
            technician: localR.technician !== undefined ? localR.technician : cloudR.technician,
            updatedAt: localR.updatedAt || cloudR.updatedAt,
            cost: localR.cost != null ? localR.cost : cloudR.cost,
            deposit: localR.deposit != null ? localR.deposit : cloudR.deposit,
            _localModifiedAt: localR._localModifiedAt
          };
        }

        return cloudR;
      });

      localReceipts.forEach(localR => {
        if (!localR) return;
        const k1 = localR.id != null ? String(localR.id).trim().toLowerCase() : '';
        const k2 = localR.receiptNumber != null ? String(localR.receiptNumber).trim().toLowerCase() : '';
        const inCloud = merged.some(m => {
          if (!m) return false;
          const m1 = m.id != null ? String(m.id).trim().toLowerCase() : '';
          const m2 = m.receiptNumber != null ? String(m.receiptNumber).trim().toLowerCase() : '';
          return (k1 && m1 === k1) || (k2 && m2 === k2);
        });
        if (!inCloud) {
          merged.push(localR);
        }
      });

      return merged;
    }

    it('prevents stale cloud pull from overwriting an optimistically updated status', () => {
      const localReceipts = [
        {
          id: 'rec_105',
          receiptNumber: 'MT-2026-0105',
          status: 'مكتمل',
          technician: 'أحمد فتحي',
          _localModifiedAt: Date.now()
        }
      ];
      markReceiptOptimisticallyUpdated('MT-2026-0105', 'مكتمل');

      // Stale cloud response still showing "قيد الفحص"
      const staleCloudReceipts = [
        {
          id: 'rec_105',
          receiptNumber: 'MT-2026-0105',
          status: 'قيد الفحص',
          technician: ''
        }
      ];

      const merged = mergeCloudReceiptsWithLocal(staleCloudReceipts, localReceipts);
      expect(merged).toHaveLength(1);
      expect(merged[0].status).toBe('مكتمل');
      expect(merged[0].technician).toBe('أحمد فتحي');
    });

    it('preserves receipts created locally when not yet present in cloud', () => {
      const localReceipts = [
        { id: 'rec_104', receiptNumber: 'MT-2026-0104', status: 'مكتمل' },
        { id: 'rec_105', receiptNumber: 'MT-2026-0105', status: 'قيد الفحص', _localModifiedAt: Date.now() }
      ];
      const cloudReceipts = [
        { id: 'rec_104', receiptNumber: 'MT-2026-0104', status: 'مكتمل' }
      ];

      const merged = mergeCloudReceiptsWithLocal(cloudReceipts, localReceipts);
      expect(merged).toHaveLength(2);
      const r105 = merged.find(r => r.receiptNumber === 'MT-2026-0105');
      expect(r105).toBeDefined();
      expect(r105.status).toBe('قيد الفحص');
    });

    it('protects receipts that have pending offline sync queue entries', () => {
      const localReceipts = [
        { id: 'rec_105', receiptNumber: 'MT-2026-0105', status: 'تم التسليم' }
      ];
      const cloudReceipts = [
        { id: 'rec_105', receiptNumber: 'MT-2026-0105', status: 'مكتمل' }
      ];
      const syncQueue = [
        {
          action: 'saveReceipt',
          data: { data: { ID: 'rec_105', ReceiptNumber: 'MT-2026-0105', Status: 'تم التسليم' } }
        }
      ];

      const merged = mergeCloudReceiptsWithLocal(cloudReceipts, localReceipts, syncQueue);
      expect(merged).toHaveLength(1);
      expect(merged[0].status).toBe('تم التسليم');
    });
  });
});
