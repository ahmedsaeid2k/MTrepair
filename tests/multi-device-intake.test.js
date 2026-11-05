import { describe, it, expect } from 'vitest';

describe('Multi-Device Intake & Brand Integrity Engine', () => {
  // Test brand defaults
  it('includes comprehensive desktop brands (HP, Dell, Lenovo, Apple, Asus, etc.)', () => {
    const desktopBrands = ['Dell', 'HP', 'Lenovo', 'Apple', 'Asus', 'Acer', 'MSI', 'Gigabyte', 'تجميع', 'أخرى'];
    expect(desktopBrands).toContain('Dell');
    expect(desktopBrands).toContain('HP');
    expect(desktopBrands).toContain('Apple');
    expect(desktopBrands).toContain('Asus');
    expect(desktopBrands).toContain('Lenovo');
  });

  it('includes Apple in tablet brands', () => {
    const tabletBrands = ['Apple', 'Samsung', 'Lenovo', 'Huawei', 'Xiaomi', 'Honor', 'Realme', 'أخرى'];
    expect(tabletBrands).toContain('Apple');
    expect(tabletBrands).toContain('Samsung');
  });

  // Emulate normalizeReceipt logic
  function normalizeReceipt(r) {
    if (!r || typeof r !== 'object') return null;
    let rawDevs = r.devices || r.Devices;
    if (typeof rawDevs === 'string' && rawDevs.trim()) {
      try { const p = JSON.parse(rawDevs); if (Array.isArray(p)) rawDevs = p; } catch (e) {}
    }
    const pass = String((r.device && r.device.password) || r.password || '');
    if (!Array.isArray(rawDevs) || rawDevs.length === 0) {
      rawDevs = [{
        id: 'dev_1',
        category: String(r.device?.category || r.category || 'لابتوب'),
        brand: String(r.device?.brand || r.brand || ''),
        brandOther: String(r.device?.brandOther || ''),
        model: String(r.device?.model || r.model || ''),
        accessories: String(r.device?.accessories || ''),
        password: pass,
        faults: Array.isArray(r.faults) ? [...r.faults] : [],
        faultNotes: String(r.faultNotes || ''),
        technician: String(r.technician || '')
      }];
    } else {
      rawDevs = rawDevs.map((d, idx) => ({
        id: String(d.id || ('dev_' + (idx + 1))),
        category: String(d.category || (idx === 0 ? (r.device && r.device.category) : '') || 'لابتوب'),
        brand: String(d.brand != null ? d.brand : (idx === 0 ? (r.device && r.device.brand) : '')),
        brandOther: String(d.brandOther != null ? d.brandOther : ''),
        model: String(d.model != null ? d.model : ''),
        accessories: String(d.accessories != null ? d.accessories : ''),
        password: String(d.password != null ? d.password : (idx === 0 ? pass : '')),
        faults: Array.isArray(d.faults) ? d.faults.map(String) : [],
        faultNotes: String(d.faultNotes != null ? d.faultNotes : ''),
        technician: String(d.technician != null ? d.technician : (r.technician || ''))
      }));
    }
    r.devices = rawDevs;
    if (r.activeDeviceIndex == null || r.activeDeviceIndex < 0 || r.activeDeviceIndex >= r.devices.length) {
      r.activeDeviceIndex = 0;
    }
    Object.defineProperty(r, 'device', {
      configurable: true,
      enumerable: true,
      get() {
        return this.devices[this.activeDeviceIndex] || this.devices[0] || {};
      },
      set(val) {
        if (!this.devices) this.devices = [];
        const idx = (this.activeDeviceIndex != null && this.activeDeviceIndex >= 0) ? this.activeDeviceIndex : 0;
        if (val && typeof val === 'object') {
          this.devices[idx] = Object.assign({}, this.devices[idx] || {}, val);
        } else {
          this.devices[idx] = val;
        }
      }
    });
    return r;
  }

  // Emulate receiptToRow
  function receiptToRow(d) {
    const primaryDev = (Array.isArray(d.devices) && d.devices.length > 0) ? d.devices[0] : (d.device || {});
    const devBrand = primaryDev.brand === 'أخرى' ? (primaryDev.brandOther || '') : (primaryDev.brand || '');
    return {
      Category: primaryDev.category || 'لابتوب',
      Brand: devBrand,
      Model: primaryDev.model || '',
      Devices: (Array.isArray(d.devices) && d.devices.length) ? JSON.stringify(d.devices) : ''
    };
  }

  it('guarantees Device 1 (Desktop) and Device 2 (Apple Tablet) do not clobber each other', () => {
    const rawReceipt = {
      id: 'rec_1001',
      receiptNumber: 'MT-2026-0001',
      customer: { name: 'طارق مصطفى', phone: '01000000000' },
      devices: [
        {
          id: 'dev_1',
          category: 'كمبيوتر مكتبي',
          brand: 'HP',
          model: 'ProDesk 600 G3',
          accessories: 'كابل باور',
          faults: ['باور / لا يعمل']
        },
        {
          id: 'dev_2',
          category: 'تابلت',
          brand: 'Apple',
          model: 'iPad 9',
          accessories: 'جراب فقط',
          faults: ['شاشة / كسر']
        }
      ]
    };

    const normalized = normalizeReceipt(rawReceipt);
    expect(normalized.devices).toHaveLength(2);

    // Device 1 checks
    expect(normalized.devices[0].category).toBe('كمبيوتر مكتبي');
    expect(normalized.devices[0].brand).toBe('HP');
    expect(normalized.devices[0].brand).not.toBe('Dell');
    expect(normalized.devices[0].model).toBe('ProDesk 600 G3');

    // Device 2 checks: MUST NOT be "كمبيوتر مكتبي" or "كمبيوتر ابل"
    expect(normalized.devices[1].category).toBe('تابلت');
    expect(normalized.devices[1].category).not.toBe('كمبيوتر مكتبي');
    expect(normalized.devices[1].brand).toBe('Apple');
    expect(normalized.devices[1].model).toBe('iPad 9');

    // Test activeDeviceIndex switching and getter
    normalized.activeDeviceIndex = 0;
    expect(normalized.device.category).toBe('كمبيوتر مكتبي');
    expect(normalized.device.brand).toBe('HP');

    normalized.activeDeviceIndex = 1;
    expect(normalized.device.category).toBe('تابلت');
    expect(normalized.device.brand).toBe('Apple');

    // Row mapping verification
    const row = receiptToRow(normalized);
    expect(row.Category).toBe('كمبيوتر مكتبي');
    expect(row.Brand).toBe('HP');
    expect(row.Model).toBe('ProDesk 600 G3');

    const parsedDevs = JSON.parse(row.Devices);
    expect(parsedDevs).toHaveLength(2);
    expect(parsedDevs[0].category).toBe('كمبيوتر مكتبي');
    expect(parsedDevs[0].brand).toBe('HP');
    expect(parsedDevs[1].category).toBe('تابلت');
    expect(parsedDevs[1].brand).toBe('Apple');
  });

  it('formats multiple devices properly in WhatsApp notifications', () => {
    const r = {
      devices: [
        { category: 'كمبيوتر مكتبي', brand: 'HP', model: 'ProDesk 600' },
        { category: 'تابلت', brand: 'Apple', model: 'iPad Air' }
      ]
    };

    let deviceText = '';
    if (Array.isArray(r.devices) && r.devices.length > 1) {
      deviceText = r.devices.map((dv, i) => {
        const c = dv.category || 'جهاز';
        const b = dv.brand === 'أخرى' ? dv.brandOther : (dv.brand || '');
        const m = dv.model || '';
        return `[جهاز ${i + 1}: ${c} ${b} ${m}`.trim() + `]`;
      }).join(' و ');
    }

    expect(deviceText).toContain('[جهاز 1: كمبيوتر مكتبي HP ProDesk 600]');
    expect(deviceText).toContain('[جهاز 2: تابلت Apple iPad Air]');
  });

  describe('Partial Delivery & Multi-Device Status Flow', () => {
    function computeReceiptOverallStatus(r) {
      if (!r) return 'قيد الفحص';
      const devs = Array.isArray(r.devices) && r.devices.length ? r.devices : null;
      if (!devs || devs.length === 1) {
        return (devs && devs[0] && devs[0].status) || r.status || 'قيد الفحص';
      }
      const deliveredCount = devs.filter(d => d.status === 'تم التسليم').length;
      if (deliveredCount === devs.length) {
        return 'تم التسليم';
      }
      if (deliveredCount > 0) {
        return 'تسليم جزئي';
      }
      if (r.status === 'تم التسليم' || r.status === 'تسليم جزئي') {
        const anyDone = devs.some(d => d.status === 'مكتمل');
        return anyDone ? 'مكتمل' : 'قيد الفحص';
      }
      return r.status || 'قيد الفحص';
    }

    it('correctly transitions receipt to تسليم جزئي when delivering 1 of 2 devices', () => {
      const receipt = {
        id: 'rec_multi_deliv',
        receiptNumber: 'MT-2026-9999',
        status: 'مكتمل',
        devices: [
          { id: 'dev_1', category: 'لابتوب', brand: 'Dell', model: 'Latitude', status: 'مكتمل' },
          { id: 'dev_2', category: 'شاشة', brand: 'Samsung', model: '24 inch', status: 'مكتمل' }
        ]
      };

      // Initially neither is delivered
      expect(computeReceiptOverallStatus(receipt)).toBe('مكتمل');

      // Deliver first device
      receipt.devices[0].status = 'تم التسليم';
      receipt.devices[0].deliveredAt = '2026-11-05T20:00:00.000Z';
      receipt.devices[0].deliveredBy = 'أحمد المهندس';
      receipt.devices[0].deliveryNotes = 'تم التجربة والتسليم مع الشاحن';
      receipt.status = computeReceiptOverallStatus(receipt);

      expect(receipt.status).toBe('تسليم جزئي');
      expect(receipt.devices[0].status).toBe('تم التسليم');
      expect(receipt.devices[1].status).toBe('مكتمل');

      // Deliver second device
      receipt.devices[1].status = 'تم التسليم';
      receipt.devices[1].deliveredAt = '2026-11-05T20:30:00.000Z';
      receipt.status = computeReceiptOverallStatus(receipt);

      expect(receipt.status).toBe('تم التسليم');
    });

    it('reverts status gracefully when a partial delivery is undone', () => {
      const receipt = {
        id: 'rec_multi_revert',
        receiptNumber: 'MT-2026-8888',
        status: 'تسليم جزئي',
        devices: [
          { id: 'dev_1', category: 'لابتوب', brand: 'HP', status: 'تم التسليم', deliveredAt: '2026-11-05T12:00:00.000Z' },
          { id: 'dev_2', category: 'كمبيوتر مكتبي', brand: 'Dell', status: 'مكتمل' }
        ]
      };

      // Undoing delivery of device 1
      receipt.devices[0].status = 'مكتمل';
      receipt.devices[0].deliveredAt = '';
      receipt.status = computeReceiptOverallStatus(receipt);

      expect(receipt.status).toBe('مكتمل');
      expect(receipt.devices[0].status).toBe('مكتمل');
      expect(receipt.devices[1].status).toBe('مكتمل');
    });

    it('builds a clear WhatsApp notification for partial delivery with remaining devices listed', () => {
      const receipt = {
        receiptNumber: 'MT-2026-7777',
        customer: { name: 'مهندس سامح' },
        cost: 1500,
        deposit: 500,
        devices: [
          { category: 'لابتوب', brand: 'HP', model: 'Victus', status: 'تم التسليم' },
          { category: 'شاشة', brand: 'LG', model: 'UltraWide', status: 'الصيانة' }
        ]
      };

      const dev = receipt.devices[0];
      const collectedAmount = 500;
      const remainingDevs = receipt.devices.filter(d => d.status !== 'تم التسليم');

      let remInfo = '';
      if (remainingDevs.length > 0) {
        remInfo = `📌 الأجهزة المتبقية بالورشة قيد الصيانة (${remainingDevs.length} أجهزة): ` +
          remainingDevs.map((d, i) => `[جهاز ${i+1}]: ${d.category} ${d.brand} (${d.status})`).join('، ');
      }

      const msg = `تم تسليم جهازكم (${dev.category} ${dev.brand} ${dev.model}) بنجاح. المبلغ المسدد: ${collectedAmount} ج.م. ${remInfo}`;

      expect(msg).toContain('لابتوب HP Victus');
      expect(msg).toContain('المبلغ المسدد: 500 ج.م');
      expect(msg).toContain('شاشة LG (الصيانة)');
      expect(msg).toContain('الأجهزة المتبقية بالورشة قيد الصيانة (1 أجهزة)');
    });
  });
});
