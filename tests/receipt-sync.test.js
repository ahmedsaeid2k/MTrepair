import { describe, it, expect } from 'vitest';

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
});
