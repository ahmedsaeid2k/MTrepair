/* ---------------- Print A5 Single Sheet Guarantee ---------------- */
function openReceiptPrint(rawR, kind){
  if(!rawR) return;
  const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
  // 1. Clean previous print styles and mounts
  const oldMount = document.getElementById('printMount');
  if(oldMount) oldMount.remove();
  const oldA5Style = document.getElementById('dynamicA5ReceiptStyle');
  if(oldA5Style) oldA5Style.remove();
  const oldThermal = document.getElementById('dynamicThermalReceiptStyle');
  if(oldThermal) oldThermal.remove();

  document.body.classList.remove(
    'printing-sticker',
    'printing-pos-receipt',
    'printing-quotation-doc',
    'printing-voucher',
    'printing-barcode-studio'
  );
  document.body.classList.add('printing-a5-receipt');

  // Inject strictly-calibrated A5 Landscape page rule for Dual-Copy Side-by-Side Printing
  const a5Style = document.createElement('style');
  a5Style.id = 'dynamicA5ReceiptStyle';
  a5Style.innerHTML = `
    @media print {
      @page {
        size: A5 landscape !important;
        margin: 0mm !important;
      }
      @page :left { margin: 0mm !important; }
      @page :right { margin: 0mm !important; }
      @page :first { margin: 0mm !important; }
      html, body.printing-a5-receipt {
        width: 210mm !important;
        height: 148mm !important;
        max-height: 148mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        position: static !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body.printing-a5-receipt #app,
      body.printing-a5-receipt .sidebar,
      body.printing-a5-receipt .top-header,
      body.printing-a5-receipt #toastContainer,
      body.printing-a5-receipt .modal-overlay,
      body.printing-a5-receipt .cmd-palette-overlay {
        display: none !important;
      }
      body.printing-a5-receipt #printMount {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 210mm !important;
        height: 148mm !important;
        max-height: 148mm !important;
        margin: 0 !important;
        padding: 0 !important;
        position: static !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        page-break-inside: avoid !important;
        page-break-after: avoid !important;
        break-inside: avoid !important;
        break-after: avoid !important;
      }
      body.printing-a5-receipt #receiptPaper {
        position: static !important;
        width: 204mm !important;
        max-width: 204mm !important;
        height: 140mm !important;
        max-height: 140mm !important;
        margin: auto !important;
        padding: 0 !important;
        border: none !important;
        background: #ffffff !important;
        color: #000000 !important;
        box-shadow: none !important;
        display: grid !important;
        grid-template-columns: 1fr 6mm 1fr !important;
        gap: 0 !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        page-break-inside: avoid !important;
        page-break-after: avoid !important;
        break-inside: avoid !important;
        break-after: avoid !important;
      }
      .a5-copy-card {
        border: 1.2px solid #0f172a !important;
        border-radius: 4px !important;
        box-sizing: border-box !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  `;
  document.head.appendChild(a5Style);

  const mount = document.createElement('div');
  mount.id = 'printMount';

  const titles = {receipt:'إيصال استلام جهاز للصيانة', invoice:'فاتورة صيانة نهائية', workorder:'أمر شغل داخلي للفني'};
  const trackUrl = getReceiptTrackingUrl(r);
  const qrSvgHtml = QRCodeGenerator.toSvg(trackUrl, 30);

  function buildHalfCopy(copyRole, barcodeId){
    const isCust = copyRole === 'customer';
    const roleBadge = isCust
      ? '<span style="background:#0f172a;color:#fff;font-size:8px;font-weight:900;padding:1px 6px;border-radius:3px;">نسخة العميل</span>'
      : '<span style="background:#047857;color:#fff;font-size:8px;font-weight:900;padding:1px 6px;border-radius:3px;">نسخة المركز</span>';

    const otherAmt = Number(r.otherAccountAmount || 0);
    const remaining = Number(r.cost||0)+Number(r.partsCost||0)+otherAmt-Number(r.deposit||0)+Number(r.refunded||0);
    const customerFullName = escapeHtml((typeof formatCustomerFullName === 'function') ? formatCustomerFullName(r) : (r.customer?.name || extractCustomerName(r) || 'عميل'));
    const dCat = escapeHtml((r.device && r.device.category) || 'جهاز');
    const dBrand = escapeHtml(r.device ? (r.device.brand==='أخرى'?r.device.brandOther:r.device.brand) : '');
    const dModel = escapeHtml((r.device && r.device.model) || '');
    const dPass = escapeHtml((r.device && r.device.password) || r.password || '');
    const dAccessories = escapeHtml(r.device && r.device.accessories ? r.device.accessories : 'بدون');
    const faultsStr = escapeHtml((Array.isArray(r.faults) ? r.faults.join('، ') : String(r.faults || '')) || '-');
    const rTime = (typeof formatReceiptTime === 'function' ? formatReceiptTime(r) : (r.time || ''));
    const phoneVal = escapeHtml(r.customer?.phone || extractCustomerPhone(r) || '-');

    return `
    <div class="a5-copy-card" style="width:99mm;height:140mm;max-height:140mm;border:1.2px solid #0f172a;border-radius:4px;padding:2mm 2.5mm;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;overflow:hidden;background:#fff;color:#000;font-size:8px;line-height:1.15;direction:rtl;">
      <!-- Top Part -->
      <div>
        <!-- Header Row -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1.5px solid #0f172a;padding-bottom:1.5px;margin-bottom:1.5px;">
          <div>
            <div style="display:flex;align-items:center;gap:3px;">
              ${state.settings.logoUrl ? `<img src="${state.settings.logoUrl}" style="max-height:16px;max-width:36px;object-fit:contain;">` : ''}
              <b style="font-size:9.5px;font-weight:900;color:#0f172a;">${escapeHtml(state.settings.shopName || 'صيانة ميكروتك')}</b>
            </div>
            <div style="font-size:7px;color:#475569;margin-top:0.5px;">إيصال صيانة معتمد ${state.settings.phone ? '• ' + escapeHtml(state.settings.phone) : ''}</div>
          </div>
          <div style="text-align:left;">
            ${roleBadge}
          </div>
        </div>

        <!-- Receipt # & Barcode / QR Row -->
        <div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;border:1px solid #cbd5e1;border-radius:3px;padding:1.5px 3px;margin-bottom:1.5px;">
          <div>
            <div style="display:flex;align-items:center;gap:3px;">
              <b class="mono" style="font-size:10.5px;font-weight:900;color:#0f172a;">#${r.receiptNumber}</b>
              <span style="font-size:7px;color:#475569;">${cleanDate(r.date)} ${rTime ? rTime : ''}</span>
            </div>
            <svg id="${barcodeId}" style="margin-top:1px;"></svg>
          </div>
          <div style="width:30px;height:30px;border:1px solid #cbd5e1;border-radius:3px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff;">
            ${qrSvgHtml}
          </div>
        </div>

        <!-- Customer Info -->
        <table style="width:100%;border-collapse:collapse;font-size:7.5px;margin-bottom:1.5px;">
          <tr>
            <td style="width:18%;padding:1px 2px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1;">العميل</td>
            <td style="width:42%;padding:1px 2px;border:1px solid #cbd5e1;font-weight:900;font-size:8.5px;">${customerFullName}</td>
            <td style="width:14%;padding:1px 2px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1;">الهاتف</td>
            <td class="mono" style="padding:1px 2px;border:1px solid #cbd5e1;font-weight:900;font-size:9px;direction:ltr;text-align:right;">${phoneVal}</td>
          </tr>
        </table>

        <!-- Device & Fault Info -->
        ${(Array.isArray(r.devices) && r.devices.length > 1) ? `
          <table style="width:100%;border-collapse:collapse;font-size:7px;margin-bottom:1.5px;">
            <thead>
              <tr style="background:#f1f5f9;font-weight:bold;">
                <th style="border:1px solid #cbd5e1;padding:1px 2px;width:14px;text-align:center;">#</th>
                <th style="border:1px solid #cbd5e1;padding:1px 2px;text-align:right;">الجهاز والموديل</th>
                <th style="border:1px solid #cbd5e1;padding:1px 2px;text-align:right;">الأعطال وملاحظات الفحص</th>
                <th style="border:1px solid #cbd5e1;padding:1px 2px;width:38px;text-align:center;">الملحقات</th>
              </tr>
            </thead>
            <tbody>
              ${r.devices.map((dv, idx) => {
                const c = escapeHtml(dv.category || 'جهاز');
                const b = escapeHtml(dv.brand === 'أخرى' ? dv.brandOther : (dv.brand || ''));
                const m = escapeHtml(dv.model || '');
                const p = dv.password ? ` [كلمة السر: ${escapeHtml(dv.password)}]` : '';
                const f = (Array.isArray(dv.faults) ? dv.faults.join('، ') : String(dv.faults || '')) || '';
                const n = dv.faultNotes ? ` (${escapeHtml(dv.faultNotes)})` : '';
                const fStr = escapeHtml(f) + n;
                const acc = escapeHtml(dv.accessories || 'بدون');
                return `
                  <tr>
                    <td style="border:1px solid #cbd5e1;padding:1px 2px;text-align:center;font-weight:bold;">${idx+1}</td>
                    <td style="border:1px solid #cbd5e1;padding:1px 2px;font-weight:800;">${c} ${b} ${m}${p}</td>
                    <td style="border:1px solid #cbd5e1;padding:1px 2px;color:#0f172a;">${fStr || '-'}</td>
                    <td style="border:1px solid #cbd5e1;padding:1px 2px;text-align:center;font-size:6.5px;">${acc}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <table style="width:100%;border-collapse:collapse;font-size:7px;margin-bottom:1.5px;">
            <tr>
              <td style="width:18%;padding:1px 2px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1;">الفني</td>
              <td style="padding:1px 2px;border:1px solid #cbd5e1;">${escapeHtml(r.technician || '-')}</td>
              <td style="width:18%;padding:1px 2px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1;">التسليم</td>
              <td style="padding:1px 2px;border:1px solid #cbd5e1;font-weight:bold;">${cleanDate(r.deliveryDate) || 'يحدد لاحقاً'}</td>
            </tr>
          </table>
        ` : `
          <table style="width:100%;border-collapse:collapse;font-size:7.5px;margin-bottom:1.5px;">
            <tr>
              <td style="width:18%;padding:1px 2px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1;">الجهاز</td>
              <td colspan="3" style="padding:1px 2px;border:1px solid #cbd5e1;font-weight:800;">${dCat} - ${dBrand} ${dModel}</td>
            </tr>
            <tr>
              <td style="padding:1px 2px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1;">الملحقات</td>
              <td style="padding:1px 2px;border:1px solid #cbd5e1;">${dAccessories}</td>
              <td style="padding:1px 2px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1;">الباسورد</td>
              <td class="mono" style="padding:1px 2px;border:1px solid #cbd5e1;font-weight:bold;color:#b45309;">${dPass ? dPass : 'بدون'}</td>
            </tr>
            <tr>
              <td style="padding:1px 2px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1;">العطل</td>
              <td colspan="3" style="padding:1px 2px;border:1px solid #cbd5e1;font-weight:bold;color:#0f172a;">${faultsStr}${r.faultNotes ? ' ('+escapeHtml(r.faultNotes)+')' : ''}</td>
            </tr>
            <tr>
              <td style="padding:1px 2px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1;">الفني</td>
              <td style="padding:1px 2px;border:1px solid #cbd5e1;">${escapeHtml(r.technician || '-')}</td>
              <td style="padding:1px 2px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1;">التسليم</td>
              <td style="padding:1px 2px;border:1px solid #cbd5e1;font-weight:bold;">${cleanDate(r.deliveryDate) || 'يحدد لاحقاً'}</td>
            </tr>
          </table>
        `}

        <!-- Spare Parts Info if any -->
        ${(Array.isArray(r.partsList) && r.partsList.length > 0) ? `
          <div style="font-size:6.5px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:2px;padding:1.5px 3px;margin-bottom:1.5px;color:#5b21b6;">
            <b>قطع الغيار المستبدلة:</b> ${r.partsList.map(p => `${escapeHtml(p.name||'قطعة')} (${p.qty||1}) [${p.warrantyDays ? p.warrantyDays+'يوم' : 'بدون ضمان'}]`).join(' • ')}
          </div>
        ` : ''}

        <!-- Financial Box -->
        <div style="display:grid;grid-template-columns:${Number(r.partsCost||0) > 0 ? '1fr 1fr 1fr 1.2fr' : '1fr 1fr 1.3fr'};gap:2px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:3px;padding:2px;text-align:center;font-size:7.5px;margin-bottom:1.5px;">
          <div style="padding:1px;">
            <div style="color:#64748b;font-size:6.5px;">أجور الصيانة</div>
            <div class="mono" style="font-weight:800;font-size:8px;">${Number(r.cost||0)} ج.م</div>
          </div>
          ${Number(r.partsCost||0) > 0 ? `
          <div style="padding:1px;">
            <div style="color:#64748b;font-size:6.5px;">قطع الغيار</div>
            <div class="mono" style="font-weight:800;font-size:8px;color:#7c3aed;">${Number(r.partsCost||0)} ج.م</div>
          </div>
          ` : ''}
          <div style="padding:1px;">
            <div style="color:#64748b;font-size:6.5px;">مدفوع مقدم${(Number(r.deposit||0) > 0 && r.depositPaymentMethod) ? ` (${escapeHtml(r.depositPaymentMethod)})` : ''}</div>
            <div class="mono" style="font-weight:800;font-size:8px;color:#047857;">${Number(r.deposit||0)} ج.م</div>
          </div>
          <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:2px;padding:1px;">
            <div style="color:#92400e;font-size:6.5px;font-weight:bold;">المتبقي المطلوب</div>
            <div class="mono" style="font-weight:900;font-size:9px;color:#b45309;">${remaining} ج.م</div>
          </div>
        </div>
      </div>

      <!-- Bottom Part: Terms & Signatures -->
      <div>
        ${(Array.isArray(r.photos) && r.photos.length > 0) ? `
          <div style="font-size:6.5px;color:#0369a1;background:#f0f9ff;border:1px solid #bae6fd;border-radius:2px;padding:1px 3px;margin-bottom:1.5px;display:flex;align-items:center;gap:3px;">
            <span>${getSvgIcon("camera", 16)}</span>
            <span><b>توثيق مصور:</b> تم حفظ (${r.photos.length}) صور لحالة وفحص الجهاز عند الاستلام في النظام.</span>
          </div>
        ` : ''}
        <div style="font-size:6px;color:#475569;line-height:1.2;border-top:1px dashed #cbd5e1;padding-top:1px;margin-bottom:1.5px;">
          • المركز غير مسؤول عن الجهاز بعد 30 يوماً من إخطار الجاهزية.<br>
          • هذا الإيصال هو الوثيقة الرسمية والوحيدة المعتمدة لاستلام الجهاز.
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;font-size:7px;color:#334155;border-top:1px solid #cbd5e1;padding-top:1.5px;">
          ${isCust ? `
            <div>توقيع المستلم: <b>${escapeHtml(r.updatedBy || r.createdBy || state.user?.name || 'الموظف')}</b></div>
            <div>ختم المركز: [ .................... ]</div>
          ` : `
            <div>إقرار وتوقيع العميل: ..........................</div>
            <div>التاريخ: ${cleanDate(r.date)}</div>
          `}
        </div>
        <div style="font-size:5.5px;color:#94a3b8;text-align:center;margin-top:1px;">ميكروERP • نظام إدارة مراكز الصيانة</div>
      </div>
    </div>`;
  }

  mount.innerHTML = `
  <div id="receiptPaper" style="width:204mm;height:140mm;max-height:140mm;margin:auto;display:grid;grid-template-columns:1fr 6mm 1fr;gap:0;box-sizing:border-box;overflow:hidden;background:#fff;direction:rtl;">
    <!-- Right: Customer Copy (نسخة العميل) -->
    ${buildHalfCopy('customer', 'printBarcode_1')}

    <!-- Center: Dashed Cutting Divider Line -->
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;height:140mm;width:6mm;">
      <div style="width:0;height:100%;border-left:1.5px dashed #94a3b8;"></div>
      
    </div>

    <!-- Left: Center / Shop Copy (نسخة المركز) -->
    ${buildHalfCopy('shop', 'printBarcode_2')}
  </div>`;
  document.body.appendChild(mount);

  if(typeof JsBarcode !== 'undefined'){
    try{
      JsBarcode('#printBarcode_1', r.receiptNumber, {format:'CODE128', width:0.85, height:13, displayValue:false, margin:0});
      JsBarcode('#printBarcode_2', r.receiptNumber, {format:'CODE128', width:0.85, height:13, displayValue:false, margin:0});
    }catch(e){}
  }

  const cleanupA5 = ()=>{
    if(mount && mount.parentNode) mount.remove();
    document.body.classList.remove('printing-a5-receipt');
    if(a5Style && a5Style.parentNode) a5Style.remove();
    window.removeEventListener('afterprint', cleanupA5);
  };
  window.addEventListener('afterprint', cleanupA5);

  setTimeout(()=>{
    window.print();
    setTimeout(cleanupA5, 800);
  }, 150);
}

/* ---------------- Thermal Barcode Sticker Engine (Multi-Size Responsive: 40x20, 40x10, 20x40, etc.) ---------------- */

function getThermalStickerDimensions(sizeKey, customW, customH){
  const map = {
    '40x20': { w: 40, h: 20, name: '40×20 مم (عرض 4 سم × ارتفاع 2 سم - عريض)' },
    '40x10': { w: 40, h: 10, name: '40×10 مم (عرض 4 سم × ارتفاع 1 سم - رفيع)' },
    '40x25': { w: 40, h: 25, name: '40×25 مم (4×2.5 سم)' },
    '40x30': { w: 40, h: 30, name: '40×30 مم (4×3 سم)' },
    '40x15': { w: 40, h: 15, name: '40×15 مم (4×1.5 سم)' },
    '50x25': { w: 50, h: 25, name: '50×25 مم (5×2.5 سم)' },
    '50x30': { w: 50, h: 30, name: '50×30 مم (5×3 سم)' },
    '38x25': { w: 38, h: 25, name: '38×25 مم' },
    '20x40': { w: 20, h: 40, name: '20×40 مم (2×4 سم طولي)' },
    '10x40': { w: 10, h: 40, name: '10×40 مم (1×4 سم طولي)' },
    '60x40': { w: 60, h: 40, name: '60×40 مم' }
  };
  if(sizeKey === 'custom'){
    const w = Math.max(10, Math.min(120, Number(customW) || 40));
    const h = Math.max(10, Math.min(120, Number(customH) || 20));
    return { w, h, name: `مخصص (${w}×${h} مم)` };
  }
  return map[sizeKey] || map['40x20'];
}

function renderStickerBarcodeSVG(target, barcodeVal, dim, format = 'CODE128'){
  if(typeof JsBarcode === 'undefined') return;
  const val = String(barcodeVal || '100000000000').trim();
  if(!val) return;

  const minDim = Math.min(dim.w, dim.h);
  let bWidth = 1.2;
  let bHeight = 20;

  if(dim.w < dim.h){
    // Portrait sticker (e.g. 20x40 mm)
    bWidth = 1.0;
    bHeight = 18;
  } else if(minDim <= 12){
    // Slim (e.g. 40x10 mm)
    bWidth = 0.9;
    bHeight = 12;
  } else if(minDim <= 17){
    // 40x15 mm
    bWidth = 1.0;
    bHeight = 15;
  } else if(minDim <= 24){
    // 40x20 mm & 40x25 mm — بارود واضح وعريض
    bWidth = 1.15;
    bHeight = 22;
  } else {
    // 50x30 or larger
    bWidth = 1.4;
    bHeight = 28;
  }

  if(val.length > 10) bWidth = Math.max(0.9, bWidth * 0.88);
  if(val.length > 15) bWidth = Math.max(0.8, bWidth * 0.82);

  try {
    JsBarcode(target, val, {
      format: format || 'CODE128',
      width: bWidth,
      height: bHeight,
      displayValue: false,
      margin: 0
    });
  } catch(err) {
    try {
      JsBarcode(target, val, {
        width: bWidth,
        height: bHeight,
        displayValue: false,
        margin: 0
      });
    } catch(e2){
      console.warn('JsBarcode render fallback failed:', e2);
    }
  }
}

function generateProductStickerHTML(item, dim, svgId){
  const bs = state.barcodeStudio || {};
  const prn = (state.settings && state.settings.printers && state.settings.printers.barcodePrinter) || {};

  // Read visibility toggles from Barcode Studio settings with printer fallbacks
  const showShopName = (bs.showShopName !== undefined) ? Boolean(bs.showShopName) : (prn.showShopName !== false);
  const showItemName = (bs.showItemName !== undefined) ? Boolean(bs.showItemName) : (prn.showItemName !== false);
  const showPrice = (bs.showPrice !== undefined) ? Boolean(bs.showPrice) : (prn.showPrice !== false);
  const showBarcodeText = (bs.showBarcodeText !== undefined) ? Boolean(bs.showBarcodeText) : true;
  const showDate = (bs.showDate !== undefined) ? Boolean(bs.showDate) : (prn.showDate === true);

  const rawShopName = (state.settings && state.settings.shopName) || 'صيانة ميكروتك';
  const shopName = escapeHtml(rawShopName.length > 20 ? (rawShopName.slice(0, 18) + '..') : rawShopName);
  const name = escapeHtml(item.Name || item.name || 'صنف');
  const cat = escapeHtml(item.Category || item.category || '');
  const price = Number(item.SellPrice || item.PurchasePrice || item.price || 0).toLocaleString();
  const barcodeVal = escapeHtml(String(item.Barcode || item.SKU || item.barcode || item.sku || item.ID || '1001'));
  const todayStr = cleanDate(new Date());

  // Portrait layout (w < h, e.g. 20x40 mm or 10x40 mm)
  if(dim.w < dim.h){
    return `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:1.5mm 1mm;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;text-align:center;direction:rtl;">
      ${showShopName ? `<div style="border-bottom:1px solid #000;padding-bottom:0.3mm;font-size:7.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${shopName}</div>` : ''}
      ${showItemName ? `<div style="font-size:8px;font-weight:900;line-height:1.2;max-height:6.5mm;overflow:hidden;margin:0.3mm 0;">${name}</div>` : ''}
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0.3mm 0;flex:1;">
        <svg id="${svgId}" style="max-height:8mm;max-width:96%;display:block;margin:0 auto;"></svg>
        ${showBarcodeText ? `<span class="mono" style="font-size:7px;font-weight:900;letter-spacing:0.3px;line-height:1;margin-top:0.3mm;">${barcodeVal}</span>` : ''}
      </div>
      ${showPrice ? `<div style="border-top:1px solid #000;padding-top:0.3mm;font-size:9.5px;font-weight:900;" class="mono">${price} ج.م</div>` : ''}
    </div>`;
  }

  // Landscape layouts (w >= h)
  if(dim.h <= 12){
    // 40x10 mm ultra-slim (4×1 سم شريط رفيع للبضائع)
    return `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:0.6mm 1.5mm;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;">
      <div style="display:flex;justify-content:space-between;align-items:center;line-height:1;gap:1mm;flex-shrink:0;">
        ${showItemName ? `<span style="font-size:8px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:65%;">${name}</span>` : (showShopName ? `<span style="font-size:7.5px;font-weight:900;">${shopName}</span>` : '<span></span>')}
        ${showPrice ? `<b class="mono" style="font-size:8.5px;font-weight:900;white-space:nowrap;">${price} ج</b>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;flex:1;">
        <svg id="${svgId}" style="width:100%;max-height:5.2mm;display:block;margin:0 auto;"></svg>
        ${showBarcodeText ? `<span class="mono" style="font-size:6.5px;font-weight:900;letter-spacing:0.5px;line-height:1;margin-top:0.2mm;text-align:center;">${barcodeVal}</span>` : ''}
      </div>
    </div>`;
  } else if(dim.h <= 17){
    // 40x15 mm layout
    return `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:1mm 1.5mm;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;">
      ${(showShopName || showPrice) ? `
      <div style="display:flex;justify-content:space-between;align-items:center;line-height:1;border-bottom:1px solid #000;padding-bottom:0.3mm;flex-shrink:0;">
        <span style="font-size:7.5px;font-weight:900;">${showShopName ? shopName : ''}</span>
        ${showPrice ? `<b class="mono" style="font-size:8.5px;font-weight:900;">${price} ج.م</b>` : ''}
      </div>` : ''}
      ${showItemName ? `<div style="font-size:8px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.15;margin:0.2mm 0;flex-shrink:0;">${name}</div>` : ''}
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;flex:1;">
        <svg id="${svgId}" style="max-height:5.8mm;width:100%;display:block;margin:0 auto;"></svg>
        ${showBarcodeText ? `<span class="mono" style="font-size:7px;font-weight:900;line-height:1;margin-top:0.2mm;">${barcodeVal}</span>` : ''}
      </div>
    </div>`;
  } else if(dim.h <= 24){
    // 40x20 mm & 40x25 mm layout (Primary User Roll: 4x2 cm)
    return `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:1.5mm 2mm;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;">
      ${(showShopName || cat) ? `
      <div style="display:flex;justify-content:space-between;align-items:center;line-height:1;border-bottom:1px solid #000;padding-bottom:0.4mm;flex-shrink:0;">
        <span style="font-size:8px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:65%;">${showShopName ? shopName : ''}</span>
        ${cat ? `<span class="mono" style="font-size:7px;font-weight:900;">${cat}</span>` : ''}
      </div>` : ''}
      ${showItemName ? `
      <div style="font-size:8.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.15;margin:0.3mm 0;flex-shrink:0;">
        ${name}
      </div>` : ''}
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;flex:1;">
        <svg id="${svgId}" style="width:100%;max-height:7.2mm;display:block;margin:0 auto;"></svg>
        ${showBarcodeText ? `<span class="mono" style="font-size:7.5px;font-weight:900;letter-spacing:0.8px;line-height:1;margin-top:0.3mm;text-align:center;">${barcodeVal}</span>` : ''}
      </div>
      ${(showPrice || showDate) ? `
      <div style="display:flex;justify-content:space-between;align-items:center;line-height:1;border-top:1px solid #000;padding-top:0.4mm;flex-shrink:0;">
        ${showPrice ? `<span style="font-size:7.5px;font-weight:900;">السعر: <b class="mono" style="font-size:10px;font-weight:900;">${price} ج.م</b></span>` : '<span></span>'}
        ${showDate ? `<span class="mono" style="font-size:7px;font-weight:800;">${todayStr}</span>` : ''}
      </div>` : ''}
    </div>`;
  } else {
    // 50x25, 50x30, 60x40 mm larger stickers
    return `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:1.5mm 2mm;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;">
      ${(showShopName || cat) ? `
      <div style="display:flex;justify-content:space-between;align-items:center;line-height:1;border-bottom:1.5px solid #000;padding-bottom:0.5mm;flex-shrink:0;">
        <span style="font-size:9px;font-weight:900;">${showShopName ? shopName : ''}</span>
        ${cat ? `<span class="mono" style="font-size:8px;font-weight:900;">${cat}</span>` : ''}
      </div>` : ''}
      ${showItemName ? `
      <div style="font-size:9.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2;margin:0.4mm 0;flex-shrink:0;">
        ${name}
      </div>` : ''}
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;flex:1;">
        <svg id="${svgId}" style="max-height:9.5mm;width:100%;display:block;margin:0 auto;"></svg>
        ${showBarcodeText ? `<span class="mono" style="font-size:8.5px;font-weight:900;letter-spacing:0.5px;line-height:1;margin-top:0.4mm;">${barcodeVal}</span>` : ''}
      </div>
      ${(showPrice || showDate) ? `
      <div style="display:flex;justify-content:space-between;align-items:center;line-height:1;border-top:1.5px solid #000;padding-top:0.5mm;flex-shrink:0;">
        ${showPrice ? `<span style="font-size:8.5px;font-weight:900;">السعر: <b class="mono" style="font-size:12px;font-weight:900;">${price} ج.م</b></span>` : '<span></span>'}
        ${showDate ? `<span class="mono" style="font-size:8px;font-weight:800;">${todayStr}</span>` : ''}
      </div>` : ''}
    </div>`;
  }
}

function generateReceiptStickerHTML(r, dim, svgId, customOpts){
  const prn = (state.settings && state.settings.printers && state.settings.printers.barcodePrinter) || {};
  const opts = Object.assign({
    barcodeMode: prn.barcodeMode || 'qr', // 'qr', 'barcode', 'none'
    showShopName: prn.showShopName !== false,
    showCustomerName: prn.showCustomerName !== false,
    showPhone: prn.showPhone !== false,
    showDevice: prn.showDevice !== false,
    showPassword: prn.showPassword !== false,
    showFaults: prn.showFaults !== false,
    showPrice: prn.showPrice === true,
    showDate: prn.showDate !== false,
    showBorder: prn.showBorder === true
  }, customOpts || {});

  const rawShopName = (state.settings && state.settings.shopName) || 'صيانة ميكروتك';
  const shopName = escapeHtml(rawShopName.length > 20 ? (rawShopName.slice(0, 18) + '..') : rawShopName);
  
  const fullCName = (typeof formatCustomerFullName === 'function') ? formatCustomerFullName(r) : ((r.customer && r.customer.name) || extractCustomerName(r) || 'عميل');
  const cName = escapeHtml(fullCName.slice(0, 22));
  const rawPhone = (r.customer && r.customer.phone) || extractCustomerPhone(r) || '';
  const cPhone = escapeHtml(rawPhone);
  const dCat = escapeHtml((r.device && r.device.category) || 'جهاز');
  const dBrand = escapeHtml(r.device ? (r.device.brand==='أخرى'?r.device.brandOther:r.device.brand) : '');
  const dModel = escapeHtml((r.device && r.device.model) || '');
  const pass = escapeHtml(((r.device && r.device.password) || r.password || '').slice(0, 14));
  const firstFault = escapeHtml(((Array.isArray(r.faults) && r.faults.length ? r.faults[0] : (typeof r.faults === 'string' ? r.faults : '')) || r.faultNotes || 'صيانة عامة').slice(0, 26));
  const rNum = escapeHtml(String(r.receiptNumber || ''));
  const intakeTime = (typeof formatReceiptTime === 'function' ? formatReceiptTime(r) : (r.time || ''));
  const dateTimeStr = escapeHtml(`${cleanDate(r.date)}${intakeTime ? ' ' + intakeTime : ''}`);

  const otherAmt = Number(r.otherAccountAmount || 0);
  const remCost = Number(r.cost || 0) + Number(r.partsCost || 0) + otherAmt - Number(r.deposit || 0) + Number(r.refunded || 0);
  const costStr = remCost > 0 ? `${remCost} ج.م` : (r.cost ? `${r.cost} ج.م` : '');

  const trackUrl = getReceiptTrackingUrl(r);
  const borderCss = opts.showBorder ? 'border:1px dashed #000;' : '';

  // ── Layout 1: 40x10 mm (عرض 4 سم × ارتفاع 1 سم - شريط فائق النحافة) ──
  if(dim.h <= 12){
    if(opts.barcodeMode === 'qr'){
      const qrSvg = QRCodeGenerator.toSvg(trackUrl, 32);
      return `
      <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:space-between;padding:0.5mm 1mm !important;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;line-height:1.1;${borderCss}">
        <div style="display:flex;flex-direction:column;justify-content:space-between;flex:1;min-width:0;height:100%;padding-left:1mm;">
          <div style="display:flex;justify-content:space-between;align-items:center;white-space:nowrap;overflow:hidden;gap:1mm;">
            <b class="mono" style="font-size:9px;font-weight:900;direction:ltr;color:#000;">#${rNum}</b>
            <span style="font-size:8.5px;font-weight:900;overflow:hidden;text-overflow:ellipsis;color:#000;">${cName}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;white-space:nowrap;overflow:hidden;gap:1mm;">
            <b class="mono" style="font-size:8.5px;font-weight:900;direction:ltr;color:#000;">${cPhone}</b>
            <span style="font-size:8px;font-weight:900;overflow:hidden;text-overflow:ellipsis;color:#000;">${dCat} ${dBrand}</span>
          </div>
        </div>
        <div style="width:8.5mm;height:8.5mm;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
          ${qrSvg}
        </div>
      </div>`;
    }
    if(opts.barcodeMode === 'barcode'){
      return `
      <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:0.5mm 1mm !important;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;line-height:1;${borderCss}">
        <div style="display:flex;justify-content:space-between;align-items:center;white-space:nowrap;overflow:hidden;gap:1mm;font-size:8px;">
          <b class="mono" style="font-size:8.5px;direction:ltr;">#${rNum}</b>
          <span style="overflow:hidden;text-overflow:ellipsis;">${cName}</span>
          <b class="mono" style="direction:ltr;">${cPhone}</b>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;flex:1;max-height:5.2mm;overflow:hidden;">
          <svg id="${svgId}" style="width:100%;max-height:5.2mm;display:block;margin:0 auto;"></svg>
        </div>
      </div>`;
    }
    // None (Text only)
    return `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:1mm 1.5mm !important;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;line-height:1.15;${borderCss}">
      <div style="display:flex;justify-content:space-between;align-items:center;white-space:nowrap;overflow:hidden;gap:1mm;">
        <b class="mono" style="font-size:9.5px;font-weight:900;direction:ltr;color:#000;">#${rNum}</b>
        <span style="font-size:9px;font-weight:900;overflow:hidden;text-overflow:ellipsis;color:#000;">${cName}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;white-space:nowrap;overflow:hidden;gap:1mm;">
        <b class="mono" style="font-size:9.5px;font-weight:900;direction:ltr;color:#000;">${cPhone}</b>
        <span style="font-size:8.5px;font-weight:900;overflow:hidden;text-overflow:ellipsis;color:#000;">${dCat} ${dBrand}</span>
      </div>
    </div>`;
  }

  // ── Layout 2: 40x20 mm roll (Standard 4x2 cm roll - المقاس الأساسي الأكثر استخداماً) ──
  if(dim.h <= 23){
    if(opts.barcodeMode === 'qr'){
      const qrSvg = QRCodeGenerator.toSvg(trackUrl, 48);
      return `
      <div style="width:100%;height:100%;max-height:${dim.h}mm;display:flex;flex-direction:row;align-items:stretch;justify-content:space-between;padding:0.8mm 1mm !important;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;line-height:1.15;gap:1mm;${borderCss}">
        <!-- Text Column -->
        <div style="display:flex;flex-direction:column;justify-content:space-between;flex:1;min-width:0;height:100%;overflow:hidden;">
          <!-- Row 1: Shop & Receipt # -->
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.2px solid #000;padding-bottom:0.2mm;flex-shrink:0;">
            ${opts.showShopName ? `<span style="font-size:8px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:55%;color:#000;letter-spacing:-0.2px;">${shopName}</span>` : '<span></span>'}
            <b class="mono" style="font-size:9.5px;font-weight:900;direction:ltr;display:inline-block;white-space:nowrap;color:#000;letter-spacing:0.2px;">#${rNum}</b>
          </div>
          <!-- Row 2: Customer Name -->
          ${opts.showCustomerName ? `
          <div style="font-size:8.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;flex-shrink:0;">
            <span style="font-size:7px;font-weight:800;color:#000;">ع:</span> <b style="font-size:8.5px;font-weight:900;color:#000;">${cName}</b>
          </div>` : ''}
          <!-- Row 3: Phone -->
          ${opts.showPhone ? `
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:8.5px;font-weight:900;white-space:nowrap;overflow:hidden;color:#000;flex-shrink:0;line-height:1;">
            <span style="font-size:7px;font-weight:800;color:#000;">هـ:</span>
            <b class="mono" style="font-size:9px;font-weight:900;direction:ltr;display:inline-block;letter-spacing:0.3px;color:#000;">${cPhone}</b>
          </div>` : ''}
          <!-- Row 4: Device & Pass -->
          ${opts.showDevice ? `
          <div style="font-size:7.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;flex-shrink:0;line-height:1.1;">
            <span style="font-size:6.5px;font-weight:800;color:#000;">ج:</span> <b style="color:#000;">${dCat} ${dBrand} ${dModel}</b>${opts.showPassword && pass ? ` | <span style="font-size:6.5px;">ب:</span><b class="mono" style="font-size:7.5px;color:#000;">${pass}</b>` : ''}
          </div>` : ''}
          <!-- Row 5: Fault & Price -->
          ${(opts.showFaults || (opts.showPrice && costStr)) ? `
          <div style="font-size:7.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;border-top:1px dashed #000;padding-top:0.2mm;flex-shrink:0;line-height:1.1;">
            ${opts.showFaults ? `<span style="font-size:6.5px;font-weight:800;color:#000;">ع:</span> <span style="font-weight:900;color:#000;">${firstFault}</span>` : ''}
            ${(opts.showPrice && costStr) ? `<span style="margin-right:2px;">| <b class="mono" style="font-size:8px;">${costStr}</b></span>` : ''}
          </div>` : ''}
        </div>
        <!-- Smart Tracking QR Column -->
        <div style="width:13.5mm;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
          <div style="width:13mm;height:13mm;display:flex;align-items:center;justify-content:center;">
            ${qrSvg}
          </div>
          <div style="font-size:6.5px;font-weight:900;line-height:1;margin-top:0.3mm;color:#000;white-space:nowrap;">تتبع الصيانة</div>
        </div>
      </div>`;
    }

    if(opts.barcodeMode === 'barcode'){
      return `
      <div style="width:100%;height:100%;max-height:${dim.h}mm;display:flex;flex-direction:column;justify-content:space-between;padding:0.8mm 1.2mm !important;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;line-height:1.1;${borderCss}">
        <!-- Row 1: Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #000;padding-bottom:0.2mm;flex-shrink:0;">
          ${opts.showShopName ? `<span style="font-size:8px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:55%;color:#000;">${shopName}</span>` : '<span></span>'}
          <b class="mono" style="font-size:9.5px;font-weight:900;direction:ltr;display:inline-block;white-space:nowrap;color:#000;">#${rNum}</b>
        </div>
        <!-- Row 2: Customer & Phone -->
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:8px;font-weight:900;white-space:nowrap;overflow:hidden;flex-shrink:0;">
          ${opts.showCustomerName ? `<span style="overflow:hidden;text-overflow:ellipsis;max-width:52%;">ع: ${cName}</span>` : '<span></span>'}
          ${opts.showPhone ? `<b class="mono" style="font-size:8.5px;direction:ltr;">${cPhone}</b>` : ''}
        </div>
        <!-- Row 3: Device & Pass -->
        ${opts.showDevice ? `
        <div style="font-size:7.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0;">
          ج: ${dCat} ${dBrand} ${dModel}${opts.showPassword && pass ? ` | ب:<b class="mono">${pass}</b>` : ''}
        </div>` : ''}
        <!-- Row 4: Barcode SVG -->
        <div style="display:flex;align-items:center;justify-content:center;flex:1;max-height:6mm;overflow:hidden;margin:0.2mm 0;">
          <svg id="${svgId}" style="width:100%;max-height:5.8mm;display:block;margin:0 auto;"></svg>
        </div>
        <!-- Row 5: Fault -->
        ${(opts.showFaults || (opts.showPrice && costStr)) ? `
        <div style="font-size:7px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-top:0.8px dashed #000;padding-top:0.2mm;flex-shrink:0;">
          ${opts.showFaults ? `ع: ${firstFault}` : ''}
          ${(opts.showPrice && costStr) ? ` | <b class="mono">${costStr}</b>` : ''}
        </div>` : ''}
      </div>`;
    }

    // None (Pure Typography)
    return `
    <div style="width:100%;height:100%;max-height:${dim.h}mm;display:flex;flex-direction:column;justify-content:space-between;padding:1mm 1.5mm !important;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;line-height:1.15;${borderCss}">
      <!-- Row 1: Header -->
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid #000;padding-bottom:0.2mm;flex-shrink:0;">
        ${opts.showShopName ? `<span style="font-size:9px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:52%;color:#000;letter-spacing:-0.2px;">${shopName}</span>` : '<span></span>'}
        <b class="mono" style="font-size:10.5px;font-weight:900;direction:ltr;display:inline-block;white-space:nowrap;color:#000;letter-spacing:0.3px;">#${rNum}</b>
      </div>
      <!-- Row 2: Customer Name -->
      ${opts.showCustomerName ? `
      <div style="font-size:9.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;flex-shrink:0;">
        <span style="font-size:8.5px;font-weight:800;color:#000;">العميل:</span> <b style="font-size:9.5px;font-weight:900;color:#000;">${cName}</b>
      </div>` : ''}
      <!-- Row 3: Phone -->
      ${opts.showPhone ? `
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:9.5px;font-weight:900;white-space:nowrap;overflow:hidden;color:#000;flex-shrink:0;">
        <span style="font-size:8.5px;font-weight:800;color:#000;">الهاتف:</span>
        <b class="mono" style="font-size:10px;font-weight:900;direction:ltr;display:inline-block;letter-spacing:0.5px;color:#000;">${cPhone}</b>
      </div>` : ''}
      <!-- Row 4: Device & Model & Password -->
      ${opts.showDevice ? `
      <div style="font-size:8.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;flex-shrink:0;">
        <span style="font-size:8px;font-weight:800;color:#000;">الجهاز:</span> <b style="color:#000;">${dCat} ${dBrand} ${dModel}</b>${opts.showPassword && pass ? ` | <span style="font-size:7.5px;">ب:</span><b class="mono" style="font-size:8px;color:#000;">${pass}</b>` : ''}
      </div>` : ''}
      <!-- Row 5: Fault & Details -->
      ${(opts.showFaults || (opts.showPrice && costStr) || opts.showDate) ? `
      <div style="font-size:8px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;border-top:1px dashed #000;padding-top:0.2mm;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <span style="overflow:hidden;text-overflow:ellipsis;max-width:65%;">${opts.showFaults ? `<b>العطل:</b> ${firstFault}` : ''}${(opts.showPrice && costStr) ? ` | <b>${costStr}</b>` : ''}</span>
        ${opts.showDate ? `<span class="mono" style="font-size:7px;font-weight:800;">${dateTimeStr}</span>` : ''}
      </div>` : ''}
    </div>`;
  }

  // ── Layout 3: Larger Labels (40x25, 40x30, 50x25, 50x30, 60x40 mm, etc.) ──
  if(opts.barcodeMode === 'qr'){
    const qrSvg = QRCodeGenerator.toSvg(trackUrl, 64);
    return `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:1.5mm 2mm !important;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;line-height:1.2;${borderCss}">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid #000;padding-bottom:0.4mm;flex-shrink:0;">
        ${opts.showShopName ? `<b style="font-size:10.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:58%;color:#000;">${shopName}</b>` : '<span></span>'}
        <b class="mono" style="font-size:12.5px;font-weight:900;direction:ltr;display:inline-block;white-space:nowrap;color:#000;">#${rNum}</b>
      </div>
      <!-- Body Split (Data + QR) -->
      <div style="display:flex;align-items:stretch;justify-content:space-between;gap:1.5mm;flex:1;overflow:hidden;margin:0.5mm 0;">
        <div style="display:flex;flex-direction:column;justify-content:space-around;flex:1;min-width:0;">
          ${opts.showCustomerName ? `<div style="font-size:10.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><span style="font-size:9px;font-weight:800;">العميل:</span> ${cName}</div>` : ''}
          ${opts.showPhone ? `<div style="font-size:10.5px;font-weight:900;white-space:nowrap;overflow:hidden;"><span style="font-size:9px;font-weight:800;">الهاتف:</span> <b class="mono" style="font-size:10.5px;direction:ltr;">${cPhone}</b></div>` : ''}
          ${opts.showDevice ? `<div style="font-size:9.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><span style="font-size:8.5px;font-weight:800;">الجهاز:</span> ${dCat} ${dBrand} ${dModel}${opts.showPassword && pass ? ` | <span style="font-size:8px;">ب:</span><b class="mono">${pass}</b>` : ''}</div>` : ''}
          ${(opts.showPrice && costStr) ? `<div style="font-size:9.5px;font-weight:900;">المطلوب: <b class="mono" style="font-size:11px;">${costStr}</b></div>` : ''}
        </div>
        <div style="width:17mm;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
          <div style="width:16mm;height:16mm;display:flex;align-items:center;justify-content:center;">
            ${qrSvg}
          </div>
          <div style="font-size:7px;font-weight:900;margin-top:0.3mm;">تتبع الصيانة</div>
        </div>
      </div>
      <!-- Footer -->
      <div style="border-top:1px dashed #000;padding-top:0.4mm;font-size:9px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <span style="overflow:hidden;text-overflow:ellipsis;max-width:65%;">${opts.showFaults ? `<b>العطل:</b> ${firstFault}` : ''}</span>
        ${opts.showDate ? `<span class="mono" style="font-size:8px;font-weight:800;">${dateTimeStr}</span>` : ''}
      </div>
    </div>`;
  }

  if(opts.barcodeMode === 'barcode'){
    return `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:1.5mm 2mm !important;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;line-height:1.2;${borderCss}">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid #000;padding-bottom:0.4mm;flex-shrink:0;">
        ${opts.showShopName ? `<b style="font-size:10.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:58%;color:#000;">${shopName}</b>` : '<span></span>'}
        <b class="mono" style="font-size:12px;font-weight:900;direction:ltr;display:inline-block;white-space:nowrap;color:#000;">#${rNum}</b>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;font-weight:900;white-space:nowrap;overflow:hidden;flex-shrink:0;">
        ${opts.showCustomerName ? `<span>العميل: ${cName}</span>` : '<span></span>'}
        ${opts.showPhone ? `<b class="mono" style="font-size:10.5px;direction:ltr;">${cPhone}</b>` : ''}
      </div>
      ${opts.showDevice ? `
      <div style="font-size:9.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0;">
        الجهاز: ${dCat} ${dBrand} ${dModel}${opts.showPassword && pass ? ` | باسورد: <b class="mono">${pass}</b>` : ''}
      </div>` : ''}
      <div style="display:flex;align-items:center;justify-content:center;flex:1;max-height:8mm;overflow:hidden;margin:0.4mm 0;">
        <svg id="${svgId}" style="width:100%;max-height:8mm;display:block;margin:0 auto;"></svg>
      </div>
      <div style="border-top:1px dashed #000;padding-top:0.4mm;font-size:9px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <span style="overflow:hidden;text-overflow:ellipsis;max-width:65%;">${opts.showFaults ? `<b>العطل:</b> ${firstFault}` : ''}${(opts.showPrice && costStr) ? ` | <b>${costStr}</b>` : ''}</span>
        ${opts.showDate ? `<span class="mono" style="font-size:8px;font-weight:800;">${dateTimeStr}</span>` : ''}
      </div>
    </div>`;
  }

  // None
  return `
  <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:2mm !important;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;line-height:1.2;${borderCss}">
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid #000;padding-bottom:0.5mm;flex-shrink:0;">
      ${opts.showShopName ? `<b style="font-size:10px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:58%;color:#000;">${shopName}</b>` : '<span></span>'}
      <b class="mono" style="font-size:12px;font-weight:900;direction:ltr;display:inline-block;white-space:nowrap;color:#000;">#${rNum}</b>
    </div>
    <!-- Customer -->
    ${opts.showCustomerName ? `
    <div style="font-size:11px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;flex-shrink:0;">
      <span style="font-size:9.5px;font-weight:800;">العميل:</span> <b style="font-size:11px;font-weight:900;">${cName}</b>
    </div>` : ''}
    <!-- Phone -->
    ${opts.showPhone ? `
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:900;white-space:nowrap;overflow:hidden;color:#000;flex-shrink:0;">
      <span style="font-size:9.5px;font-weight:800;">الهاتف:</span>
      <b class="mono" style="font-size:11px;font-weight:900;direction:ltr;display:inline-block;letter-spacing:0.5px;">${cPhone}</b>
    </div>` : ''}
    <!-- Device & Model -->
    ${opts.showDevice ? `
    <div style="font-size:9.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;flex-shrink:0;">
      <span style="font-size:9px;font-weight:800;">الجهاز:</span> <b>${dCat} - ${dBrand} ${dModel}</b>${opts.showPassword && pass ? ` | باسورد: <b class="mono">${pass}</b>` : ''}
    </div>` : ''}
    <!-- Fault & Date -->
    <div style="border-top:1px dashed #000;padding-top:0.4mm;font-size:9px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
      <span style="overflow:hidden;text-overflow:ellipsis;max-width:65%;">${opts.showFaults ? `<b>العطل:</b> ${firstFault}` : ''}${(opts.showPrice && costStr) ? ` | <b>${costStr}</b>` : ''}</span>
      ${opts.showDate ? `<span class="mono" style="font-size:8px;font-weight:800;">${dateTimeStr}</span>` : ''}
    </div>
  </div>`;
}

function executeDirectStickerPrint(cfg, dim, copies = 1, rotation = 0, offsetX = null, offsetY = null, customOpts = null){
  if(!cfg || !cfg.data) return;
  copies = Math.max(1, parseInt(copies) || 1);
  rotation = Number(rotation) || 0;

  const savedSettings = (state.settings && state.settings.printers && state.settings.printers.barcodePrinter) || {};
  if(offsetX === null || offsetX === undefined) offsetX = Number(savedSettings.offsetX) || 0;
  if(offsetY === null || offsetY === undefined) offsetY = Number(savedSettings.offsetY) || 0;

  const isReceipt = (cfg.type === 'receipt');
  const effectiveOpts = Object.assign({
    barcodeMode: savedSettings.barcodeMode || 'qr',
    showShopName: savedSettings.showShopName !== false,
    showCustomerName: savedSettings.showCustomerName !== false,
    showPhone: savedSettings.showPhone !== false,
    showDevice: savedSettings.showDevice !== false,
    showPassword: savedSettings.showPassword !== false,
    showFaults: savedSettings.showFaults !== false,
    showPrice: savedSettings.showPrice === true,
    showDate: savedSettings.showDate !== false,
    showBorder: savedSettings.showBorder === true
  }, customOpts || {});

  const barcodeVal = !isReceipt
    ? (cfg.data.Barcode || cfg.data.SKU || cfg.data.barcode || cfg.data.sku || cfg.data.ID || '1001')
    : (cfg.data.receiptNumber || '1001');

  const needsBarcode = (!isReceipt) || (isReceipt && effectiveOpts.barcodeMode === 'barcode');

  // ── Step 1: render barcode SVGs off-screen if barcodes are needed ──
  const svgElements = {};
  if(needsBarcode){
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:60mm;visibility:hidden;';
    document.body.appendChild(tempContainer);

    for(let i = 0; i < copies; i++){
      if(!isReceipt){
        const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgEl.id = `tmpBcSvg_${i}`;
        tempContainer.appendChild(svgEl);
        renderStickerBarcodeSVG(`#tmpBcSvg_${i}`, barcodeVal, dim, savedSettings.barcodeType || 'CODE128');
        svgElements[`bcSvg_${i}`] = svgEl.outerHTML;
      } else if(Array.isArray(cfg.data.devices) && cfg.data.devices.length > 1){
        cfg.data.devices.forEach((dev, devIdx) => {
          const key = `bcSvg_${i}_${devIdx}`;
          const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svgEl.id = `tmp_${key}`;
          tempContainer.appendChild(svgEl);
          renderStickerBarcodeSVG(`#tmp_${key}`, cfg.data.receiptNumber, dim, 'CODE128');
          svgElements[key] = svgEl.outerHTML;
        });
      } else {
        const key = `bcSvg_${i}`;
        const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgEl.id = `tmp_${key}`;
        tempContainer.appendChild(svgEl);
        renderStickerBarcodeSVG(`#tmp_${key}`, cfg.data.receiptNumber, dim, 'CODE128');
        svgElements[key] = svgEl.outerHTML;
      }
    }
    tempContainer.remove();
  }

  // ── Step 2: build sticker page HTML for each copy ──
  let pagesHtml = '';
  for(let i = 0; i < copies; i++){
    if(isReceipt && cfg.data && Array.isArray(cfg.data.devices) && cfg.data.devices.length > 1){
      cfg.data.devices.forEach((dev, devIdx) => {
        const subR = {
          ...cfg.data,
          device: { category: dev.category, brand: dev.brand, brandOther: dev.brandOther, model: dev.model, accessories: dev.accessories, password: dev.password },
          faults: dev.faults,
          faultNotes: dev.faultNotes,
          password: dev.password,
          receiptNumber: `${cfg.data.receiptNumber || ''}-${devIdx + 1}/${cfg.data.devices.length}`
        };
        const sHtml = generateReceiptStickerHTML(subR, dim, `bcSvg_${i}_${devIdx}`, effectiveOpts);
        pagesHtml += `<div class="sticker-page">${sHtml}</div>`;
      });
    } else {
      const innerHtml = isReceipt
        ? generateReceiptStickerHTML(cfg.data, dim, `bcSvg_${i}`, effectiveOpts)
        : generateProductStickerHTML(cfg.data, dim, `bcSvg_${i}`);
      pagesHtml += `<div class="sticker-page">${innerHtml}</div>`;
    }
  }

  // ── Step 3: build offsetTransform (optional, for fine calibration) ──
  const transformRules = [];
  if(offsetX || offsetY){
    transformRules.push(`translate(${offsetX}mm, ${offsetY}mm)`);
  }
  if(rotation && Number(rotation) !== 0){
    transformRules.push(`rotate(${rotation}deg)`);
  }
  const offsetCss = transformRules.length ? `transform: ${transformRules.join(' ')};` : '';

  // ── Step 4: build full iframe HTML ──
  const iframeHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page {
    size: ${dim.w}mm ${dim.h}mm !important;
    margin: 0mm !important;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    width: ${dim.w}mm !important;
    height: ${dim.h}mm !important;
    max-width: ${dim.w}mm !important;
    max-height: ${dim.h}mm !important;
    overflow: hidden !important;
    direction: rtl !important;
  }
  .sticker-page {
    width: ${dim.w}mm !important;
    height: ${dim.h}mm !important;
    max-width: ${dim.w}mm !important;
    max-height: ${dim.h}mm !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
    background: #fff !important;
    color: #000 !important;
    font-family: Arial, Tahoma, 'Segoe UI', sans-serif;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    page-break-after: always !important;
    break-after: page !important;
    position: relative !important;
    direction: rtl !important;
    ${offsetCss}
  }
  .sticker-page:last-child {
    page-break-after: avoid !important;
    break-after: avoid !important;
  }
  .sticker-page > div {
    width: 100% !important;
    height: 100% !important;
    max-height: ${dim.h}mm !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }
  .sticker-page * {
    color: #000 !important;
    font-family: Arial, Tahoma, 'Segoe UI', sans-serif !important;
  }
  svg { display: block; }
</style>
</head>
<body>${pagesHtml}</body>
</html>`;

  // ── Step 5: create hidden iframe, write HTML, inject SVGs (if needed), print ──
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;border:none;visibility:hidden;';
  document.body.appendChild(iframe);

  const iDoc = iframe.contentDocument || iframe.contentWindow.document;
  iDoc.open();
  iDoc.write(iframeHtml);
  iDoc.close();

  // Replace SVG placeholders with pre-rendered barcode SVGs
  if(needsBarcode && Object.keys(svgElements).length > 0){
    Object.keys(svgElements).forEach(key => {
      const svgPlaceholder = iDoc.getElementById(key);
      if(svgPlaceholder && svgElements[key]){
        const parser = new DOMParser();
        const parsed = parser.parseFromString(svgElements[key], 'image/svg+xml');
        const realSvg = parsed.documentElement;
        realSvg.removeAttribute('id');
        realSvg.style.cssText = 'display:block;width:100%;max-height:' + (dim.h <= 12 ? '5.2mm' : dim.h <= 22 ? '6.5mm' : '9.5mm') + ';margin:0 auto;';
        svgPlaceholder.parentNode.replaceChild(realSvg, svgPlaceholder);
      }
    });
  }

  // ── Step 6: print and cleanup ──
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch(e) {
      console.warn('iframe print failed, falling back to window.print()', e);
      window.print();
    }
    setTimeout(() => {
      if(iframe && iframe.parentNode) iframe.remove();
    }, 2000);
  }, 300);
}


function openStickerPrintModal(opts){
  if(!opts || !opts.data) return;
  const cfg = {
    type: opts.type || 'product',
    data: (opts.type === 'receipt' && typeof normalizeReceipt === 'function')
      ? (normalizeReceipt(opts.data) || opts.data)
      : opts.data
  };

  const savedSettings = (state.settings && state.settings.printers && state.settings.printers.barcodePrinter) || {};
  let currentSizeKey = savedSettings.defaultSize || '40x20';
  let customW = Number(savedSettings.customWidth) || 40;
  let customH = Number(savedSettings.customHeight) || 20;
  let currentRotation = (savedSettings.rotation !== undefined && savedSettings.rotation !== null) ? Number(savedSettings.rotation) : 0;
  let currentOffsetX = Number(savedSettings.offsetX) || 0;
  let currentOffsetY = Number(savedSettings.offsetY) || 0;
  let copies = Math.max(1, Number(opts.copies) || 1);
  let previewZoom = 1.0;

  // Customization options for receipts
  let currentBarcodeMode = savedSettings.barcodeMode || 'qr';
  let showShopName = savedSettings.showShopName !== false;
  let showCustomerName = savedSettings.showCustomerName !== false;
  let showPhone = savedSettings.showPhone !== false;
  let showDevice = savedSettings.showDevice !== false;
  let showPassword = savedSettings.showPassword !== false;
  let showFaults = savedSettings.showFaults !== false;
  let showPrice = savedSettings.showPrice === true;
  let showDate = savedSettings.showDate !== false;
  let showBorder = savedSettings.showBorder === true;

  const existing = document.getElementById('stickerPrintModalOverlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'stickerPrintModalOverlay';
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'z-index: 10050; display:flex; align-items:center; justify-content:center; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px);';

  const titleText = (cfg.type === 'receipt')
    ? `ملصق إيصال الصيانة (#${escapeHtml(cfg.data.receiptNumber)})`
    : `ملصق باركود الصنف (${escapeHtml((cfg.data.Name||cfg.data.name||'صنف').slice(0, 22))})`;

  overlay.innerHTML = `
    <div class="modal-card" style="max-width: 520px; width: 95%; background: var(--bg-card, #fff); border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; display: flex; flex-direction: column; border: 1px solid var(--border-color, #e2e8f0);">
      <!-- Header -->
      <div style="padding: 14px 18px; background: linear-gradient(135deg, #1e293b, #0f172a); color: #fff; display: flex; align-items: center; justify-content: space-between;">
        <div style="display:flex; align-items:center; gap: 10px;">
          <div style="width: 34px; height: 34px; border-radius: 8px; background: rgba(59, 130, 246, 0.2); display:flex; align-items:center; justify-content:center; border: 1px solid rgba(59, 130, 246, 0.3);">${getSvgIcon("tag", 18)}</div>
          <div>
            <h3 style="margin: 0; font-size: 14px; font-weight: 800; color: #fff;">طباعة ملصق الباركود الحراري</h3>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${titleText}</div>
          </div>
        </div>
        <button id="spmCloseBtn" style="background: rgba(255,255,255,0.1); border: none; color: #cbd5e1; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">&times;</button>
      </div>

      <!-- Body -->
      <div style="padding: 14px 18px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; max-height: 80vh;">
        <!-- Kiosk Mode Quick Switch Banner -->
        <label style="display:flex; align-items:center; justify-content:space-between; background:#f0fdf4; border:1.5px solid #86efac; border-radius:10px; padding:8px 12px; cursor:pointer;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="color:var(--green);">${getSvgIcon("pos", 18)}</span>
            <div>
              <b style="font-size:12px; color:#166534;">وضع الكيوسك (Kiosk Mode):</b>
              <div style="font-size:10.5px; color:#15803d;">طباعة فورية بنقرة واحدة من الجدول دون إظهار نافذة المعاينة</div>
            </div>
          </div>
          <input type="checkbox" id="spmKioskModeCheck" ${savedSettings.kioskMode !== false ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;">
        </label>

        <!-- Size Selector -->
        <div>
          <label style="display:block; font-size: 11.5px; font-weight: 700; color: var(--text-muted, #64748b); margin-bottom: 6px;">
            ${getSvgIcon("tag", 14)} مقاس رول الملصقات الحراري:
          </label>
          <div id="spmSizeChips" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px;">
            <button type="button" class="spm-chip-btn" data-size="40x20" style="padding: 6px 2px; font-size: 10px; font-weight: 700; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f8fafc; cursor: pointer; text-align: center; transition: all 0.15s;">
              40×20 مم<br><span style="font-size: 8.5px; opacity: 0.8; font-weight: normal;">(4×2 سم عريض)</span>
            </button>
            <button type="button" class="spm-chip-btn" data-size="40x10" style="padding: 6px 2px; font-size: 10px; font-weight: 700; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f8fafc; cursor: pointer; text-align: center; transition: all 0.15s;">
              40×10 مم<br><span style="font-size: 8.5px; opacity: 0.8; font-weight: normal;">(4×1 سم رفيع)</span>
            </button>
            <button type="button" class="spm-chip-btn" data-size="40x25" style="padding: 6px 2px; font-size: 10px; font-weight: 700; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f8fafc; cursor: pointer; text-align: center; transition: all 0.15s;">
              40×25 مم<br><span style="font-size: 8.5px; opacity: 0.8; font-weight: normal;">(4×2.5 سم)</span>
            </button>
            <button type="button" class="spm-chip-btn" data-size="40x30" style="padding: 6px 2px; font-size: 10px; font-weight: 700; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f8fafc; cursor: pointer; text-align: center; transition: all 0.15s;">
              40×30 مم<br><span style="font-size: 8.5px; opacity: 0.8; font-weight: normal;">(4×3 سم)</span>
            </button>
            <button type="button" class="spm-chip-btn" data-size="20x40" style="padding: 6px 2px; font-size: 10px; font-weight: 700; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f8fafc; cursor: pointer; text-align: center; transition: all 0.15s;">
              20×40 مم<br><span style="font-size: 8.5px; opacity: 0.8; font-weight: normal;">(2×4 طولي)</span>
            </button>
            <button type="button" class="spm-chip-btn" data-size="50x25" style="padding: 6px 2px; font-size: 10px; font-weight: 700; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f8fafc; cursor: pointer; text-align: center; transition: all 0.15s;">
              50×25 مم<br><span style="font-size: 8.5px; opacity: 0.8; font-weight: normal;">(5×2.5 سم)</span>
            </button>
            <button type="button" class="spm-chip-btn" data-size="50x30" style="padding: 6px 2px; font-size: 10px; font-weight: 700; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f8fafc; cursor: pointer; text-align: center; transition: all 0.15s;">
              50×30 مم<br><span style="font-size: 8.5px; opacity: 0.8; font-weight: normal;">(5×3 سم)</span>
            </button>
            <button type="button" class="spm-chip-btn" data-size="custom" style="padding: 6px 2px; font-size: 10px; font-weight: 700; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f8fafc; cursor: pointer; text-align: center; transition: all 0.15s;">
              تخصيص
            </button>
          </div>
          <!-- Custom Size Inputs -->
          <div id="spmCustomBox" style="display: none; margin-top: 6px; padding: 6px 12px; background: #f1f5f9; border-radius: 8px; align-items: center; justify-content: space-between; gap: 8px;">
            <div style="display:flex; align-items:center; gap: 4px; font-size: 11px; font-weight: 700;">
              <span>العرض:</span>
              <input id="spmCustomW" type="number" min="10" max="120" value="${customW}" style="width: 55px; padding: 3px; text-align: center; border: 1px solid #cbd5e1; border-radius: 6px;" />
              <span>مم</span>
            </div>
            <div style="display:flex; align-items:center; gap: 4px; font-size: 11px; font-weight: 700;">
              <span>الارتفاع:</span>
              <input id="spmCustomH" type="number" min="10" max="120" value="${customH}" style="width: 55px; padding: 3px; text-align: center; border: 1px solid #cbd5e1; border-radius: 6px;" />
              <span>مم</span>
            </div>
          </div>
        </div>

        ${cfg.type === 'receipt' ? `
        <!-- Customization Studio Accordion for Receipt Stickers -->
        <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <div id="spmCustomSectionHeader" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#f1f5f9;cursor:pointer;user-select:none;">
            <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:800;color:#1e293b;">
              <span style="display:flex;align-items:center;gap:6px;">${getSvgIcon("settings", 14)} استوديو تخصيص وحقول استيكر الصيانة:</span>
              <span id="spmModeBadge" style="font-size:10px;background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:999px;font-weight:800;">
                ${currentBarcodeMode==='qr'?'رمز QR للتتبع':(currentBarcodeMode==='barcode'?'باركود Code128':'نصي فقط')}
              </span>
            </div>
            <span id="spmCustomToggleIcon" style="font-size:11px;color:#64748b;font-weight:bold;">▼</span>
          </div>

          <div id="spmCustomSectionBody" style="padding:12px;display:flex;flex-direction:column;gap:10px;">
            <!-- Code Mode Selector Pills -->
            <div>
              <label style="display:block;font-size:11px;font-weight:700;color:#475569;margin-bottom:5px;">
                نوع وتنسيق الكود المطبوع على الاستيكر:
              </label>
              <div id="spmModePills" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">
                <button type="button" class="spm-mode-pill" data-mode="qr" style="padding:6px 4px;font-size:10.5px;font-weight:800;border-radius:8px;border:1.5px solid ${currentBarcodeMode==='qr'?'#2563eb':'#cbd5e1'};background:${currentBarcodeMode==='qr'?'#eff6ff':'#fff'};color:${currentBarcodeMode==='qr'?'#1d4ed8':'#334155'};cursor:pointer;text-align:center;">
                  كود QR للتتبع
                </button>
                <button type="button" class="spm-mode-pill" data-mode="barcode" style="padding:6px 4px;font-size:10.5px;font-weight:800;border-radius:8px;border:1.5px solid ${currentBarcodeMode==='barcode'?'#2563eb':'#cbd5e1'};background:${currentBarcodeMode==='barcode'?'#eff6ff':'#fff'};color:${currentBarcodeMode==='barcode'?'#1d4ed8':'#334155'};cursor:pointer;text-align:center;">
                  باركود 128 ليزر
                </button>
                <button type="button" class="spm-mode-pill" data-mode="none" style="padding:6px 4px;font-size:10.5px;font-weight:800;border-radius:8px;border:1.5px solid ${currentBarcodeMode==='none'?'#2563eb':'#cbd5e1'};background:${currentBarcodeMode==='none'?'#eff6ff':'#fff'};color:${currentBarcodeMode==='none'?'#1d4ed8':'#334155'};cursor:pointer;text-align:center;">
                  نصي بولد بدون كود
                </button>
              </div>
            </div>

            <!-- Quick Presets -->
            <div>
              <label style="display:block;font-size:11px;font-weight:700;color:#475569;margin-bottom:4px;">
                نماذج واستيلات سريعة بنقرة واحدة:
              </label>
              <div style="display:flex;gap:5px;flex-wrap:wrap;">
                <button type="button" class="btn btn-ghost btn-xs spm-preset-btn" data-preset="smart_qr" style="font-size:10px;padding:3px 7px;">40×20 كود QR الذكي</button>
                <button type="button" class="btn btn-ghost btn-xs spm-preset-btn" data-preset="bold_text" style="font-size:10px;padding:3px 7px;">40×20 نصي بولد واضح</button>
                <button type="button" class="btn btn-ghost btn-xs spm-preset-btn" data-preset="barcode128" style="font-size:10px;padding:3px 7px;">40×20 باركود 128</button>
                <button type="button" class="btn btn-ghost btn-xs spm-preset-btn" data-preset="slim" style="font-size:10px;padding:3px 7px;">40×10 شريط رفيع</button>
              </div>
            </div>

            <!-- Field Checkboxes -->
            <div style="border-top:1px solid #e2e8f0;padding-top:8px;">
              <label style="display:block;font-size:11px;font-weight:800;color:#334155;margin-bottom:6px;">
                الحقول المراد إظهارها على الملصق:
              </label>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                <label class="checkbox-row" style="font-size:11px;">
                  <input type="checkbox" id="spmCheckShopName" ${showShopName?'checked':''}>
                  <span>اسم المحل / المركز</span>
                </label>
                <label class="checkbox-row" style="font-size:11px;">
                  <input type="checkbox" id="spmCheckCustomerName" ${showCustomerName?'checked':''}>
                  <span>اسم العميل</span>
                </label>
                <label class="checkbox-row" style="font-size:11px;">
                  <input type="checkbox" id="spmCheckPhone" ${showPhone?'checked':''}>
                  <span>رقم الهاتف</span>
                </label>
                <label class="checkbox-row" style="font-size:11px;">
                  <input type="checkbox" id="spmCheckDevice" ${showDevice?'checked':''}>
                  <span>الجهاز والموديل</span>
                </label>
                <label class="checkbox-row" style="font-size:11px;">
                  <input type="checkbox" id="spmCheckPassword" ${showPassword?'checked':''}>
                  <span>كلمة السر / النمط</span>
                </label>
                <label class="checkbox-row" style="font-size:11px;">
                  <input type="checkbox" id="spmCheckFaults" ${showFaults?'checked':''}>
                  <span>شكوى وعطل الجهاز</span>
                </label>
                <label class="checkbox-row" style="font-size:11px;">
                  <input type="checkbox" id="spmCheckPrice" ${showPrice?'checked':''}>
                  <span>المتبقي / التكلفة</span>
                </label>
                <label class="checkbox-row" style="font-size:11px;">
                  <input type="checkbox" id="spmCheckDate" ${showDate?'checked':''}>
                  <span>تاريخ ووقت الاستلام</span>
                </label>
                <label class="checkbox-row" style="font-size:11px;">
                  <input type="checkbox" id="spmCheckBorder" ${showBorder?'checked':''}>
                  <span>إطار خارجي محدد</span>
                </label>
              </div>
            </div>
          </div>
        </div>` : ''}

        <!-- Rotation Selector -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding: 6px 10px; background: #f1f5f9; border-radius: 8px;">
          <div style="font-size: 11.5px; font-weight: 700; color: #334155; display:flex; align-items:center; gap: 4px;">
            <span style="display:flex;align-items:center;gap:4px;">${getSvgIcon("refresh", 13)} تدوير اتجاه الطباعة:</span>
          </div>
          <div id="spmRotBtns" style="display:flex; gap: 4px;">
            <button type="button" class="spm-rot-btn" data-rot="0" style="padding: 4px 8px; font-size: 10.5px; font-weight: 700; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">0° طبيعي</button>
            <button type="button" class="spm-rot-btn" data-rot="90" style="padding: 4px 8px; font-size: 10.5px; font-weight: 700; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">90°</button>
            <button type="button" class="spm-rot-btn" data-rot="180" style="padding: 4px 8px; font-size: 10.5px; font-weight: 700; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">180°</button>
            <button type="button" class="spm-rot-btn" data-rot="270" style="padding: 4px 8px; font-size: 10.5px; font-weight: 700; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">270°</button>
          </div>
        </div>

        <!-- Hardware Offset & Centering Calibration -->
        <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 8px 12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <label style="font-size: 11.5px; font-weight: 700; color: #1e293b; display:flex; align-items:center; gap:4px;">
              <span>سنترة ومعايرة مكان الطباعة (Offsets):</span>
            </label>
            <button type="button" id="spmResetOffsets" style="font-size:10px; color:#2563eb; background:none; border:none; cursor:pointer; font-weight:700;">إعادة ضبط للوسط (0,0)</button>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div style="display:flex; align-items:center; justify-content:space-between; background:#fff; padding:4px 8px; border-radius:6px; border:1px solid #cbd5e1;">
              <span style="font-size:10px; font-weight:700; color:#475569;">أفقي (X يمين/يسار):</span>
              <div style="display:flex; align-items:center; gap:3px;">
                <input id="spmOffsetX" type="number" step="0.5" min="-25" max="25" value="${currentOffsetX}" style="width:48px; text-align:center; font-weight:800; font-size:11px; border:1px solid #cbd5e1; border-radius:4px; padding:2px;" />
                <span style="font-size:9.5px;">مم</span>
              </div>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; background:#fff; padding:4px 8px; border-radius:6px; border:1px solid #cbd5e1;">
              <span style="font-size:10px; font-weight:700; color:#475569;">رأسي (Y فوق/تحت):</span>
              <div style="display:flex; align-items:center; gap:3px;">
                <input id="spmOffsetY" type="number" step="0.5" min="-25" max="25" value="${currentOffsetY}" style="width:48px; text-align:center; font-weight:800; font-size:11px; border:1px solid #cbd5e1; border-radius:4px; padding:2px;" />
                <span style="font-size:9.5px;">مم</span>
              </div>
            </div>
          </div>
          <div style="display:flex; gap:4px; margin-top:6px; justify-content:center; flex-wrap:wrap;">
            <button type="button" class="btn btn-ghost btn-xs spm-quick-off" data-ox="-2" data-oy="0" style="font-size:9.5px; padding:2px 6px;">يسار 2مم</button>
            <button type="button" class="btn btn-ghost btn-xs spm-quick-off" data-ox="2" data-oy="0" style="font-size:9.5px; padding:2px 6px;">يمين 2مم</button>
            <button type="button" class="btn btn-ghost btn-xs spm-quick-off" data-ox="4" data-oy="0" style="font-size:9.5px; padding:2px 6px;">يمين 4مم</button>
            <button type="button" class="btn btn-ghost btn-xs spm-quick-off" data-ox="0" data-oy="2" style="font-size:9.5px; padding:2px 6px;">أسفل 2مم</button>
          </div>
        </div>

        <!-- Live Preview Stage with Zoom -->
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 5px;">
            <label style="font-size: 11.5px; font-weight: 700; color: var(--text-muted, #64748b);">
              معاينة شكل الملصق وسنترته (حقيقي 100%):
            </label>
            <div style="display:flex; align-items:center; gap:6px;">
              <span id="spmDimBadge" style="font-size: 10px; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 2px 8px; border-radius: 999px; border: 1px solid #bfdbfe;">40×20 مم</span>
              <div style="display:flex; border:1px solid #cbd5e1; border-radius:6px; overflow:hidden; background:#fff;">
                <button type="button" id="spmZoomIn" style="border:none; background:#f8fafc; padding:2px 7px; font-size:11px; cursor:pointer; font-weight:bold;" title="تكبير المعاينة">+</button>
                <button type="button" id="spmZoomReset" style="border:none; border-left:1px solid #cbd5e1; border-right:1px solid #cbd5e1; background:#fff; padding:2px 6px; font-size:9.5px; cursor:pointer;" title="إعادة الحجم">100%</button>
                <button type="button" id="spmZoomOut" style="border:none; background:#f8fafc; padding:2px 7px; font-size:11px; cursor:pointer; font-weight:bold;" title="تصغير المعاينة">-</button>
              </div>
            </div>
          </div>
          <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 10px; padding: 14px; display: flex; align-items: center; justify-content: center; min-height: 130px; overflow: hidden; position: relative;">
            <div id="spmScaleWrapper" style="display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
              <div id="spmPreviewBox" style="background: #fff; box-shadow: 0 4px 14px rgba(0,0,0,0.12); border: 1px solid #000; border-radius: 2px; overflow: hidden; transition: all 0.2s;">
              </div>
            </div>
          </div>
        </div>

        <!-- Copies and Info -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 2px;">
          <div style="display:flex; align-items:center; gap: 8px;">
            <label style="font-size: 11.5px; font-weight: 700; color: var(--text-muted, #64748b);">عدد النسخ:</label>
            <div style="display:flex; align-items:center; border: 1.5px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #fff;">
              <button id="spmCopyDec" type="button" style="width: 28px; height: 28px; border: none; background: #f1f5f9; cursor: pointer; font-weight: 900;">-</button>
              <input id="spmCopiesInput" type="number" min="1" max="99" value="${copies}" style="width: 38px; height: 28px; border: none; text-align: center; font-weight: 800; font-size: 13px;" />
              <button id="spmCopyInc" type="button" style="width: 28px; height: 28px; border: none; background: #f1f5f9; cursor: pointer; font-weight: 900;">+</button>
            </div>
          </div>
          <div style="font-size: 10.5px; color: #059669; font-weight: 800; display:flex; align-items:center; gap: 4px;">
            <span style="display:inline-flex;align-items:center;gap:4px;">${getSvgIcon("check", 13)} خط حراري عالي التباين وواضح</span>
          </div>
        </div>

        <!-- Hint -->
        <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 7px 10px; font-size: 10px; color: #b45309; line-height: 1.4;">
          <b>نصيحة الكيوسك:</b> تأكد في نافذة الطباعة من اختيار <b>الهوامش: بلا (None)</b>. يمكنك تعديل الإعدادات الافتراضية وحفظها لتطبيقها مباشرة في الكيوسك.
        </div>
      </div>

      <!-- Footer Buttons -->
      <div style="padding: 10px 18px; background: #f8fafc; border-top: 1px solid var(--border-color, #e2e8f0); display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
        <button id="spmCancelBtn" type="button" class="btn btn-secondary" style="padding: 7px 14px; font-size: 11.5px; font-weight: 700; border-radius: 8px;">إلغاء</button>
        <button id="spmPrintBtn" type="button" class="btn btn-primary" style="padding: 7px 20px; font-size: 11.5px; font-weight: 800; border-radius: 8px; background: linear-gradient(135deg, #2563eb, #1d4ed8); display:flex; align-items:center; gap: 6px; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);">
          <span>${getSvgIcon("printer", 14)} طباعة الملصق الآن</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const getCustomOpts = () => ({
    barcodeMode: currentBarcodeMode,
    showShopName,
    showCustomerName,
    showPhone,
    showDevice,
    showPassword,
    showFaults,
    showPrice,
    showDate,
    showBorder
  });

  const syncInputs = () => {
    const sShop = overlay.querySelector('#spmCheckShopName'); if(sShop) sShop.checked = showShopName;
    const sCust = overlay.querySelector('#spmCheckCustomerName'); if(sCust) sCust.checked = showCustomerName;
    const sPhone = overlay.querySelector('#spmCheckPhone'); if(sPhone) sPhone.checked = showPhone;
    const sDev = overlay.querySelector('#spmCheckDevice'); if(sDev) sDev.checked = showDevice;
    const sPass = overlay.querySelector('#spmCheckPassword'); if(sPass) sPass.checked = showPassword;
    const sFault = overlay.querySelector('#spmCheckFaults'); if(sFault) sFault.checked = showFaults;
    const sPrice = overlay.querySelector('#spmCheckPrice'); if(sPrice) sPrice.checked = showPrice;
    const sDate = overlay.querySelector('#spmCheckDate'); if(sDate) sDate.checked = showDate;
    const sBorder = overlay.querySelector('#spmCheckBorder'); if(sBorder) sBorder.checked = showBorder;

    overlay.querySelectorAll('.spm-mode-pill').forEach(btn => {
      const isSel = btn.dataset.mode === currentBarcodeMode;
      btn.style.borderColor = isSel ? '#2563eb' : '#cbd5e1';
      btn.style.background = isSel ? '#eff6ff' : '#fff';
      btn.style.color = isSel ? '#1d4ed8' : '#334155';
    });
  };

  const updatePreview = () => {
    const dim = getThermalStickerDimensions(currentSizeKey, customW, customH);
    const previewBox = overlay.querySelector('#spmPreviewBox');
    const dimBadge = overlay.querySelector('#spmDimBadge');
    if(dimBadge) dimBadge.textContent = `${dim.w}×${dim.h} مم (${currentRotation}°) X:${currentOffsetX} Y:${currentOffsetY}`;

    const modeBadge = overlay.querySelector('#spmModeBadge');
    if(modeBadge){
      modeBadge.textContent = currentBarcodeMode === 'qr' ? 'رمز QR للتتبع' : (currentBarcodeMode === 'barcode' ? 'باركود Code128' : 'نصي فقط');
    }

    // Screen pixel conversion: 3.78px per mm
    const baseW = dim.w * 3.78;
    const baseH = dim.h * 3.78;
    const maxBoxW = 240 * previewZoom;
    const maxBoxH = 120 * previewZoom;
    const scaleFactor = Math.min(maxBoxW / baseW, maxBoxH / baseH, 3.0);
    const boxW = Math.round(baseW * scaleFactor);
    const boxH = Math.round(baseH * scaleFactor);

    previewBox.style.width = `${boxW}px`;
    previewBox.style.height = `${boxH}px`;
    
    let prevTransform = '';
    if(currentOffsetX || currentOffsetY){
      prevTransform += `translate(${currentOffsetX * scaleFactor}px, ${currentOffsetY * scaleFactor}px) `;
    }
    if(currentRotation){
      prevTransform += `rotate(${currentRotation}deg) `;
    }
    previewBox.style.transform = prevTransform.trim() || 'none';

    const customOpts = getCustomOpts();
    const svgId = 'stickerLivePreviewSvg';
    const contentHtml = (cfg.type === 'receipt')
      ? generateReceiptStickerHTML(cfg.data, dim, svgId, customOpts)
      : generateProductStickerHTML(cfg.data, dim, svgId);

    previewBox.innerHTML = contentHtml;
    previewBox.style.fontSize = `${scaleFactor}em`;

    const barcodeVal = (cfg.type === 'receipt')
      ? cfg.data.receiptNumber
      : (cfg.data.Barcode || cfg.data.SKU || cfg.data.barcode || cfg.data.sku || cfg.data.ID || '1001');

    if(cfg.type !== 'receipt' || currentBarcodeMode === 'barcode'){
      setTimeout(() => {
        renderStickerBarcodeSVG('#' + svgId, barcodeVal, dim, savedSettings.barcodeType || 'CODE128');
      }, 15);
    }

    overlay.querySelectorAll('.spm-chip-btn').forEach(btn => {
      const isSel = btn.dataset.size === currentSizeKey;
      btn.style.borderColor = isSel ? '#2563eb' : '#cbd5e1';
      btn.style.background = isSel ? '#eff6ff' : '#f8fafc';
      btn.style.color = isSel ? '#1d4ed8' : '#334155';
    });

    overlay.querySelectorAll('.spm-rot-btn').forEach(btn => {
      const isSel = Number(btn.dataset.rot) === currentRotation;
      btn.style.borderColor = isSel ? '#2563eb' : '#cbd5e1';
      btn.style.background = isSel ? '#eff6ff' : '#ffffff';
      btn.style.color = isSel ? '#1d4ed8' : '#334155';
    });

    const customBox = overlay.querySelector('#spmCustomBox');
    if(customBox) customBox.style.display = (currentSizeKey === 'custom') ? 'flex' : 'none';
  };

  overlay.querySelector('#spmCloseBtn').onclick = () => overlay.remove();
  overlay.querySelector('#spmCancelBtn').onclick = () => overlay.remove();

  // Mode Pills
  overlay.querySelectorAll('.spm-mode-pill').forEach(btn => {
    btn.onclick = () => {
      currentBarcodeMode = btn.dataset.mode || 'qr';
      syncInputs();
      updatePreview();
    };
  });

  // Presets
  overlay.querySelectorAll('.spm-preset-btn').forEach(btn => {
    btn.onclick = () => {
      const preset = btn.dataset.preset;
      if(preset === 'smart_qr'){
        currentSizeKey = '40x20';
        currentBarcodeMode = 'qr';
        showShopName = true; showCustomerName = true; showPhone = true; showDevice = true; showPassword = true; showFaults = true; showDate = true; showBorder = false;
      } else if(preset === 'bold_text'){
        currentSizeKey = '40x20';
        currentBarcodeMode = 'none';
        showShopName = true; showCustomerName = true; showPhone = true; showDevice = true; showPassword = true; showFaults = true; showDate = true; showBorder = false;
      } else if(preset === 'barcode128'){
        currentSizeKey = '40x20';
        currentBarcodeMode = 'barcode';
        showShopName = true; showCustomerName = true; showPhone = true; showDevice = true; showFaults = true; showBorder = false;
      } else if(preset === 'slim'){
        currentSizeKey = '40x10';
        currentBarcodeMode = 'none';
      }
      syncInputs();
      updatePreview();
    };
  });

  // Checkbox Event Listeners
  const bindCheck = (id, setter) => {
    const el = overlay.querySelector(id);
    if(el) el.onchange = (e) => { setter(e.target.checked); updatePreview(); };
  };
  bindCheck('#spmCheckShopName', v => showShopName = v);
  bindCheck('#spmCheckCustomerName', v => showCustomerName = v);
  bindCheck('#spmCheckPhone', v => showPhone = v);
  bindCheck('#spmCheckDevice', v => showDevice = v);
  bindCheck('#spmCheckPassword', v => showPassword = v);
  bindCheck('#spmCheckFaults', v => showFaults = v);
  bindCheck('#spmCheckPrice', v => showPrice = v);
  bindCheck('#spmCheckDate', v => showDate = v);
  bindCheck('#spmCheckBorder', v => showBorder = v);

  // Accordion Toggle
  const customHeader = overlay.querySelector('#spmCustomSectionHeader');
  const customBody = overlay.querySelector('#spmCustomSectionBody');
  const customIcon = overlay.querySelector('#spmCustomToggleIcon');
  if(customHeader && customBody){
    customHeader.onclick = () => {
      const isHidden = customBody.style.display === 'none';
      customBody.style.display = isHidden ? 'flex' : 'none';
      if(customIcon) customIcon.textContent = isHidden ? '▼' : '◀';
    };
  }

  // Zoom Controls
  const zIn = overlay.querySelector('#spmZoomIn');
  const zOut = overlay.querySelector('#spmZoomOut');
  const zReset = overlay.querySelector('#spmZoomReset');
  if(zIn) zIn.onclick = () => { previewZoom = Math.min(2.5, previewZoom + 0.3); updatePreview(); };
  if(zOut) zOut.onclick = () => { previewZoom = Math.max(0.6, previewZoom - 0.3); updatePreview(); };
  if(zReset) zReset.onclick = () => { previewZoom = 1.0; updatePreview(); };

  overlay.querySelectorAll('.spm-chip-btn').forEach(btn => {
    btn.onclick = () => {
      currentSizeKey = btn.dataset.size;
      updatePreview();
    };
  });

  overlay.querySelectorAll('.spm-rot-btn').forEach(btn => {
    btn.onclick = () => {
      currentRotation = Number(btn.dataset.rot) || 0;
      updatePreview();
    };
  });

  const customWInput = overlay.querySelector('#spmCustomW');
  const customHInput = overlay.querySelector('#spmCustomH');
  if(customWInput) customWInput.oninput = (e) => { customW = Number(e.target.value) || 40; updatePreview(); };
  if(customHInput) customHInput.oninput = (e) => { customH = Number(e.target.value) || 20; updatePreview(); };

  const offXInput = overlay.querySelector('#spmOffsetX');
  const offYInput = overlay.querySelector('#spmOffsetY');
  if(offXInput) offXInput.oninput = (e) => { currentOffsetX = Number(e.target.value) || 0; updatePreview(); };
  if(offYInput) offYInput.oninput = (e) => { currentOffsetY = Number(e.target.value) || 0; updatePreview(); };

  overlay.querySelectorAll('.spm-quick-off').forEach(btn => {
    btn.onclick = () => {
      currentOffsetX = Number(btn.dataset.ox) || 0;
      currentOffsetY = Number(btn.dataset.oy) || 0;
      if(offXInput) offXInput.value = currentOffsetX;
      if(offYInput) offYInput.value = currentOffsetY;
      updatePreview();
    };
  });

  const resetOffBtn = overlay.querySelector('#spmResetOffsets');
  if(resetOffBtn) resetOffBtn.onclick = () => {
    currentOffsetX = 0;
    currentOffsetY = 0;
    if(offXInput) offXInput.value = 0;
    if(offYInput) offYInput.value = 0;
    updatePreview();
  };

  const copiesInput = overlay.querySelector('#spmCopiesInput');
  overlay.querySelector('#spmCopyDec').onclick = () => {
    copies = Math.max(1, copies - 1);
    copiesInput.value = copies;
  };
  overlay.querySelector('#spmCopyInc').onclick = () => {
    copies = Math.min(99, copies + 1);
    copiesInput.value = copies;
  };
  copiesInput.onchange = (e) => {
    copies = Math.max(1, Math.min(99, Number(e.target.value) || 1));
    copiesInput.value = copies;
  };

  overlay.querySelector('#spmPrintBtn').onclick = () => {
    const dim = getThermalStickerDimensions(currentSizeKey, customW, customH);
    const isKioskChecked = overlay.querySelector('#spmKioskModeCheck') ? overlay.querySelector('#spmKioskModeCheck').checked : true;
    const customOpts = getCustomOpts();

    if(!state.settings.printers) state.settings.printers = {};
    if(!state.settings.printers.barcodePrinter) state.settings.printers.barcodePrinter = {};
    state.settings.printers.barcodePrinter.defaultSize = currentSizeKey;
    state.settings.printers.barcodePrinter.rotation = currentRotation;
    state.settings.printers.barcodePrinter.offsetX = currentOffsetX;
    state.settings.printers.barcodePrinter.offsetY = currentOffsetY;
    state.settings.printers.barcodePrinter.kioskMode = isKioskChecked;
    state.settings.printers.barcodePrinter.barcodeMode = currentBarcodeMode;
    state.settings.printers.barcodePrinter.showShopName = showShopName;
    state.settings.printers.barcodePrinter.showCustomerName = showCustomerName;
    state.settings.printers.barcodePrinter.showPhone = showPhone;
    state.settings.printers.barcodePrinter.showDevice = showDevice;
    state.settings.printers.barcodePrinter.showPassword = showPassword;
    state.settings.printers.barcodePrinter.showFaults = showFaults;
    state.settings.printers.barcodePrinter.showPrice = showPrice;
    state.settings.printers.barcodePrinter.showDate = showDate;
    state.settings.printers.barcodePrinter.showBorder = showBorder;

    if(currentSizeKey === 'custom'){
      state.settings.printers.barcodePrinter.customWidth = customW;
      state.settings.printers.barcodePrinter.customHeight = customH;
    }
    try {
      localStorage.setItem('microerp_printers_settings', JSON.stringify(state.settings.printers));
      setCache('settings', state.settings);
      if(typeof saveSettingRemote === 'function'){
        saveSettingRemote('printers', JSON.stringify(state.settings.printers)).catch(()=>{});
      }
    } catch(e){}

    overlay.remove();
    executeDirectStickerPrint(cfg, dim, copies, currentRotation, currentOffsetX, currentOffsetY, customOpts);
  };

  updatePreview();
}

function openStickerPrint(rawR, forceModal = false){
  if(!rawR) return;
  const prnSettings = (state.settings && state.settings.printers && state.settings.printers.barcodePrinter) || {};
  const isKiosk = !forceModal && (prnSettings.kioskMode !== false);
  if(isKiosk){
    const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
    const dim = getThermalStickerDimensions(prnSettings.defaultSize || '40x20', prnSettings.customWidth, prnSettings.customHeight);
    const rot = (prnSettings.rotation !== undefined && prnSettings.rotation !== null) ? Number(prnSettings.rotation) : 0;
    const offX = Number(prnSettings.offsetX) || 0;
    const offY = Number(prnSettings.offsetY) || 0;
    const customOpts = {
      barcodeMode: prnSettings.barcodeMode || 'qr',
      showShopName: prnSettings.showShopName !== false,
      showCustomerName: prnSettings.showCustomerName !== false,
      showPhone: prnSettings.showPhone !== false,
      showDevice: prnSettings.showDevice !== false,
      showPassword: prnSettings.showPassword !== false,
      showFaults: prnSettings.showFaults !== false,
      showPrice: prnSettings.showPrice === true,
      showDate: prnSettings.showDate !== false,
      showBorder: prnSettings.showBorder === true
    };
    showToast('جاري طباعة ملصق الصيانة فوراً (وضع الطباعة السريعة)', 'info');
    executeDirectStickerPrint({ type: 'receipt', data: r }, dim, 1, rot, offX, offY, customOpts);
    return;
  }
  openStickerPrintModal({ type: 'receipt', data: rawR });
}
