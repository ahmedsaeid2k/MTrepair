function renderBarcodeStudioApp(app){
  if(!canUserAccessSection('barcode')){
    showToast('ليس لديك صلاحية للوصول إلى استوديو الباركود', 'error');
    state.currentSection = null;
    return render();
  }
  if(!state.barcodeTab) state.barcodeTab = 'inventory';
  if(!state.barcodeStudio) {
    state.barcodeStudio = getCache('barcode_studio', {
      mode: 'inventory',
      selectedItemId: null,
      selectedReceiptId: null,
      customTitle: '',
      customSubtitle: '',
      customPrice: '',
      customBarcode: '',
      copies: 1,
      preset: 'thermal_40x20',
      customWidth: 40,
      customHeight: 20,
      barcodeType: 'CODE128',
      showShopName: true,
      showItemName: true,
      showPrice: true,
      showBarcodeText: true,
      showDate: false
    });
  }

  const hasRelatedNav = canUserAccessSection('inventory') || canUserAccessSection('maintenance') || canUserAccessSection('pos') || canUserAccessSection('settings');

  app.innerHTML = `
    <div class="sidebar">
      ${brandHtml("استوديو طباعة الباركود")}
      ${sectionSwitcherHtml()}
      <div class="sidebar-nav-wrap">
        <div class="nav-section">مصدر بيانات الملصق</div>
        <div class="nav-item ${state.barcodeTab==='inventory'?'active':''}" data-barcodetab="inventory">
          <span class="nav-item-icon">${getSvgIcon("package", 16)}</span><span>أصناف المخزن العام</span>
        </div>
        <div class="nav-item ${state.barcodeTab==='invoice'?'active':''}" data-barcodetab="invoice">
          <span class="nav-item-icon">${getSvgIcon("invoices", 16)}</span><span>فواتير الشراء والمخزن</span>
        </div>
        <div class="nav-item ${state.barcodeTab==='maintenance'?'active':''}" data-barcodetab="maintenance">
          <span class="nav-item-icon">${getSvgIcon("tool", 16)}</span><span>ملصقات أجهزة الصيانة</span>
        </div>
        <div class="nav-item ${state.barcodeTab==='custom'?'active':''}" data-barcodetab="custom">
          <span class="nav-item-icon">${getSvgIcon("barcode", 16)}</span><span>توليد باركود حر ومخصص</span>
        </div>
        
        ${hasRelatedNav ? `
          <div class="nav-section">أقسام ذات صلة</div>
          ${canUserAccessSection('inventory') ? `
            <div class="nav-item" id="navToInvFromBarcode">
              <span class="nav-item-icon">${getSvgIcon("inventory", 16)}</span><span>المخزن والمشتريات</span>
            </div>
          ` : ''}
          ${canUserAccessSection('maintenance') ? `
            <div class="nav-item" id="navToMaintFromBarcode">
              <span class="nav-item-icon">${getSvgIcon("maintenance", 16)}</span><span>قسم الصيانة</span>
            </div>
          ` : ''}
          ${canUserAccessSection('pos') ? `
            <div class="nav-item" id="navToPosFromBarcode">
              <span class="nav-item-icon">${getSvgIcon("pos", 16)}</span><span>نقطة البيع (POS)</span>
            </div>
          ` : ''}
          ${canUserAccessSection('settings') ? `
            <div class="nav-item" id="navToSettingsFromBarcode">
              <span class="nav-item-icon">${getSvgIcon("settings", 16)}</span><span>مركز الإعدادات</span>
            </div>
          ` : ''}
        ` : ''}
      </div>
      ${sidebarFootHtml()}
    </div>
    <main id="main"></main>
  `;

  const sw = document.getElementById('switchSectionBtn');
  if(sw) sw.onclick = ()=>{ state.currentSection = null; render(); };
  attachSidebarHandlers();

  document.querySelectorAll('[data-barcodetab]').forEach(el => {
    el.onclick = ()=>{
      state.barcodeTab = el.dataset.barcodetab;
      state.barcodeStudio.mode = el.dataset.barcodetab;
      renderBarcodeStudioApp(app);
    };
  });

  const nInv = document.getElementById('navToInvFromBarcode');
  if(nInv) nInv.onclick = ()=>{ state.currentSection = 'inventory'; render(); };
  const nMaint = document.getElementById('navToMaintFromBarcode');
  if(nMaint) nMaint.onclick = ()=>{ state.currentSection = 'maintenance'; render(); };
  const nPos = document.getElementById('navToPosFromBarcode');
  if(nPos) nPos.onclick = ()=>{ state.currentSection = 'pos'; render(); };
  const nSet = document.getElementById('navToSettingsFromBarcode');
  if(nSet) nSet.onclick = ()=>{ state.currentSection = 'settings'; render(); };

  const main = document.getElementById('main');
  renderBarcodeStudioContent(main);
}

function renderBarcodeStudioContent(main){
  const bs = state.barcodeStudio;
  const mode = state.barcodeTab || 'inventory';

  // Dedicated Invoice Batch Barcode Printing Workspace
  if(mode === 'invoice'){
    return renderBarcodeStudioInvoiceView(main);
  }

  const invList = state.inventory || [];
  const recList = state.receipts || [];

  // Default auto-fill if empty
  if(mode === 'inventory' && !bs.customBarcode && invList.length > 0){
    const first = invList[0];
    bs.customTitle = first.Name || first.name || '';
    bs.customSubtitle = first.Category || first.category || '';
    bs.customPrice = first.SellPrice || first.Price || first.price || '';
    bs.customBarcode = first.Barcode || first.barcode || ('ITM-' + (first.id || first.ID || '1001'));
  } else if(mode === 'maintenance' && !bs.customBarcode && recList.length > 0){
    const first = recList[0];
    bs.customTitle = (first.customer ? first.customer.name : '') + ' • ' + (first.device ? first.device.brand : '');
    bs.customSubtitle = (first.device ? (first.device.category + ' ' + (first.device.model||'')) : '') + ' • ' + ((first.faults||[]).join('، ')||'صيانة');
    bs.customPrice = first.cost || '';
    bs.customBarcode = first.receiptNumber || 'MT-2026-0001';
  } else if(mode === 'custom' && !bs.customBarcode){
    bs.customTitle = 'منتج تجريبي';
    bs.customSubtitle = 'فئة عامة';
    bs.customPrice = '150';
    bs.customBarcode = '6221009876543';
  }

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("barcode", 22)} استوديو طباعة الباركود والملصقات</h2>
              </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" id="bsResetBtn">${getSvgIcon("refresh", 13)} إعادة التعيين</button>
        <button class="btn btn-primary" id="bsPrintBtn" style="font-weight:900;padding:9px 18px;font-size:14px;box-shadow:0 4px 14px rgba(79,70,229,0.35);">
          ${getSvgIcon("printer", 14)} طباعة الملصقات الآن
        </button>
      </div>
    </div>

    <div class="barcode-studio-wrap" style="padding:0;">
      <div class="barcode-studio-grid">
        
        <!-- Left: Configuration Options -->
        <div class="barcode-config-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid var(--line);padding-bottom:10px;">
            <h3 style="margin:0;font-size:15px;font-weight:900;display:flex;align-items:center;gap:6px;">
              <span>خيارات ومحتوى الملصق</span>
            </h3>
            <span class="status-badge st-check" style="font-size:11px;">
              ${mode==='inventory'?'أصناف المخزن':(mode==='maintenance'?'أجهزة الصيانة':'توليد حر')}
            </span>
          </div>

          <!-- Source Specific Selectors -->
          ${mode === 'inventory' ? `
            <div class="field" style="margin-bottom:14px;">
              <label>اختر الصنف من المخزن</label>
              <select id="bsInvSelect">
                ${invList.length === 0 ? '<option value="">لا توجد أصناف بالمخزن</option>' : invList.map(item => {
                  const itmName = item.Name || item.name || 'صنف';
                  const itmPrice = item.SellPrice || item.Price || item.price || 0;
                  const itmCode = item.Barcode || item.barcode || '';
                  const itmVal = item.id || item.ID || itmCode || itmName;
                  return `
                    <option value="${itmVal}" ${itmName===bs.customTitle?'selected':''}>
                      ${itmName} — ${itmPrice} ج.م ${itmCode?'(باركود: '+itmCode+')':''}
                    </option>
                  `;
                }).join('')}
              </select>
            </div>
          ` : ''}

          ${mode === 'maintenance' ? `
            <div class="field" style="margin-bottom:14px;">
              <label>اختر إيصال / جهاز الصيانة</label>
              <select id="bsMaintSelect">
                ${recList.length === 0 ? '<option value="">لا توجد إيصالات صيانة</option>' : recList.map(r => `
                  <option value="${r.id}" ${r.receiptNumber===bs.customBarcode?'selected':''}>
                    ${r.receiptNumber} — ${r.customer?r.customer.name:''} (${r.device?r.device.brand:''})
                  </option>
                `).join('')}
              </select>
            </div>
          ` : ''}

          <!-- Common Editable Fields -->
          <div class="field" style="margin-bottom:10px;">
            <label>عنوان الملصق (اسم الصنف / العميل)</label>
            <input type="text" id="bsInputTitle" value="${escapeHtml(bs.customTitle||'')}" placeholder="اسم الصنف أو الجهاز">
          </div>

          <div class="grid2" style="margin-bottom:10px;">
            <div class="field">
              <label>الوصف الإضافي / الموديل</label>
              <input type="text" id="bsInputSubtitle" value="${escapeHtml(bs.customSubtitle||'')}" placeholder="الفئة، الموديل، أو العطل">
            </div>
            <div class="field">
              <label>السعر (ج.م)</label>
              <input type="number" id="bsInputPrice" value="${bs.customPrice||''}" placeholder="السعر">
            </div>
          </div>

          <div class="field" style="margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <label style="margin:0;">كود الباركود *</label>
              <button class="btn btn-ghost btn-xs" id="bsRandomBarcodeBtn" style="padding:2px 8px;font-size:11px;">${getSvgIcon("refresh", 11)} توليد كود عشوائي</button>
            </div>
            <input type="text" id="bsInputBarcode" value="${escapeHtml(bs.customBarcode||'')}" class="mono font-bold" placeholder="أدخل أرقام أو حروف الباركود" style="letter-spacing:1px;">
          </div>

          <!-- Paper & Printer Presets -->
          <div class="field" style="margin-bottom:12px;">
            <label>مقاس الورق ونوع الطابعة</label>
            <select id="bsPresetSelect">
                <option value="thermal_40x20" ${bs.preset==='thermal_40x20'?'selected':''}>40mm × 20mm (أربعة في اثنين 4×2 سم - قياسي)</option>
                <option value="thermal_40x10" ${bs.preset==='thermal_40x10'?'selected':''}>40mm × 10mm (أربعة في واحد 4×1 سم - شريط رفيع للإكسسوارات والموبايل)</option>
                <option value="thermal_40x15" ${bs.preset==='thermal_40x15'?'selected':''}>40mm × 15mm (4×1.5 سم - مدمج)</option>
                <option value="thermal_50x25" ${bs.preset==='thermal_50x25'?'selected':''}>50mm × 25mm (5×2.5 سم)</option>
                <option value="thermal_50x30" ${bs.preset==='thermal_50x30'?'selected':''}>50mm × 30mm (5×3 سم - قياسي للأجهزة والطرود)</option>
                <option value="thermal_40x25" ${bs.preset==='thermal_40x25'?'selected':''}>40mm × 25mm (مدمج للموبايل)</option>
                <option value="thermal_38x25" ${bs.preset==='thermal_38x25'?'selected':''}>38mm × 25mm (مقاس تجاري شائع)</option>
                <option value="thermal_60x40" ${bs.preset==='thermal_60x40'?'selected':''}>60mm × 40mm (كبير للمعدات والطرود)</option>
              <optgroup label="صفحات A4 مقسمة (A4 Sheet Labels)">
                <option value="a4_24" ${bs.preset==='a4_24'?'selected':''}>ورق A4 — 24 ملصق (3 أعمدة × 8 صفوف)</option>
                <option value="a4_30" ${bs.preset==='a4_30'?'selected':''}>ورق A4 — 30 ملصق (3 أعمدة × 10 صفوف)</option>
                <option value="a4_40" ${bs.preset==='a4_40'?'selected':''}>ورق A4 — 40 ملصق (4 أعمدة × 10 صفوف)</option>
                <option value="a4_65" ${bs.preset==='a4_65'?'selected':''}>ورق A4 — 65 ملصق (5 أعمدة × 13 صفوف)</option>
              </optgroup>
              <optgroup label="تخصيص يدوي">
                <option value="custom" ${bs.preset==='custom'?'selected':''}>مقاس مخصص (Custom Dimensions in mm)</option>
              </optgroup>
            </select>
          </div>

          <!-- Custom Dimension inputs if selected -->
          <div id="bsCustomDimRow" class="grid2" style="margin-bottom:12px;display:${bs.preset==='custom'?'grid':'none'};">
            <div class="field">
              <label>العرض (mm)</label>
              <input type="number" id="bsCustomWidth" value="${bs.customWidth||50}">
            </div>
            <div class="field">
              <label>الارتفاع (mm)</label>
              <input type="number" id="bsCustomHeight" value="${bs.customHeight||30}">
            </div>
          </div>

          <div class="grid2" style="margin-bottom:14px;">
            <div class="field">
              <label>تنسيق التشفير</label>
              <select id="bsBarcodeType">
                <option value="CODE128" ${bs.barcodeType==='CODE128'?'selected':''}>CODE128 (موصى به - حروف وأرقام)</option>
                <option value="EAN13" ${bs.barcodeType==='EAN13'?'selected':''}>EAN-13 (13 رقم تجاري)</option>
                <option value="EAN8" ${bs.barcodeType==='EAN8'?'selected':''}>EAN-8 (8 أرقام)</option>
                <option value="CODE39" ${bs.barcodeType==='CODE39'?'selected':''}>CODE39</option>
                <option value="QR" ${bs.barcodeType==='QR'?'selected':''}>QR Code (رمز استجابة سريعة)</option>
              </select>
            </div>
            <div class="field">
              <label>عدد الملصقات للطباعة</label>
              <div style="display:flex;align-items:center;gap:6px;">
                <button class="btn btn-ghost btn-xs" id="bsDecCopiesBtn" style="padding:6px 12px;font-size:14px;font-weight:900;">-</button>
                <input type="number" id="bsCopiesCount" value="${bs.copies||1}" min="1" max="500" class="mono font-bold" style="text-align:center;">
                <button class="btn btn-ghost btn-xs" id="bsIncCopiesBtn" style="padding:6px 12px;font-size:14px;font-weight:900;">+</button>
              </div>
            </div>
          </div>

          <!-- Quick Copies Chips -->
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;">
            <span style="font-size:11px;color:var(--ink-secondary);align-self:center;">كميات سريعة:</span>
            ${[1, 5, 10, 24, 30, 40, 65, 100].map(c => `
              <button class="btn btn-ghost btn-xs bs-quick-copy-chip" data-copies="${c}" style="padding:2px 8px;font-size:11px;${bs.copies===c?'background:var(--primary);color:#fff;border-color:var(--primary);':''}">${c}</button>
            `).join('')}
          </div>

          <!-- Content Visibility Toggles -->
          <div style="border-top:1px solid var(--line);padding-top:12px;">
            <label style="font-weight:800;font-size:12.5px;margin-bottom:8px;display:block;">عناصر الملصق الظاهرة:</label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              <label class="checkbox-row" style="font-size:12px;">
                <input type="checkbox" id="bsCheckShopName" ${bs.showShopName?'checked':''}>
                <span>اسم الشركة / المحل</span>
              </label>
              <label class="checkbox-row" style="font-size:12px;">
                <input type="checkbox" id="bsCheckItemName" ${bs.showItemName?'checked':''}>
                <span>اسم الصنف / الجهاز</span>
              </label>
              <label class="checkbox-row" style="font-size:12px;">
                <input type="checkbox" id="bsCheckPrice" ${bs.showPrice?'checked':''}>
                <span>السعر (ج.م)</span>
              </label>
              <label class="checkbox-row" style="font-size:12px;">
                <input type="checkbox" id="bsCheckBarcodeText" ${bs.showBarcodeText?'checked':''}>
                <span>رقم الكود المقروء</span>
              </label>
              <label class="checkbox-row" style="font-size:12px;">
                <input type="checkbox" id="bsCheckDate" ${bs.showDate?'checked':''}>
                <span>تاريخ الطباعة</span>
              </label>
            </div>
          </div>

        </div>

        <!-- Right: Live Real-Time Preview Stage -->
        <div class="barcode-preview-card">
          <div style="width:100%;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid var(--line);padding-bottom:10px;">
            <div>
              <h3 style="margin:0;font-size:15px;font-weight:900;display:flex;align-items:center;gap:6px;">
                <span>المعاينة الحية المباشرة (Live Preview)</span>
              </h3>
              <div id="bsDimBadge" style="font-size:11.5px;color:var(--ink-secondary);margin-top:2px;">
                المقاس المختار: <b>50mm × 30mm</b> • نوع الطابعة: <b>حراري فردي</b>
              </div>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-primary btn-sm" id="bsPrintBtn2" style="font-weight:800;">${getSvgIcon("printer", 13)} طباعة الملصقات</button>
            </div>
          </div>

          <div class="barcode-canvas-stage" id="bsCanvasStage">
            <div id="bsLivePreviewContainer"></div>
          </div>

          <div style="width:100%;background:var(--paper3);border:1px solid var(--line);border-radius:var(--radius-sm);padding:10px 14px;margin-top:16px;display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:var(--ink-secondary);">
            <span><b>تلميح للطباعة المثالية:</b> في نافذة الطباعة (Ctrl+P)، اختر الهوامش <b>"بلا / None"</b> وتأكد من ضبط مقاس الورق لمطابقة إعدادات طابعتك.</span>
          </div>
        </div>

      </div>
    </div>
  `;

  // Attach Event Handlers
  attachBarcodeStudioEvents(main);
  renderBarcodeLivePreview();
}

function getBarcodePaperDimensions(preset, customW=40, customH=20){
  if(preset === 'thermal_40x10' || preset === '40x10') return { w: 40, h: 10, isSheet: false, label: '40mm × 10mm (حراري 4×1 سم)' };
  if(preset === 'thermal_40x15' || preset === '40x15') return { w: 40, h: 15, isSheet: false, label: '40mm × 15mm (حراري 4×1.5 سم)' };
  if(preset === 'thermal_40x20' || preset === '40x20') return { w: 40, h: 20, isSheet: false, label: '40mm × 20mm (حراري 4×2 سم قياسي)' };
  if(preset === 'thermal_50x25' || preset === '50x25') return { w: 50, h: 25, isSheet: false, label: '50mm × 25mm (حراري 5×2.5 سم)' };
  if(preset === 'thermal_50x30' || preset === '50x30') return { w: 50, h: 30, isSheet: false, label: '50mm × 30mm (حراري 5×3 سم)' };
  if(preset === 'thermal_40x25' || preset === '40x25') return { w: 40, h: 25, isSheet: false, label: '40mm × 25mm (حراري مدمج)' };
  if(preset === 'thermal_38x25' || preset === '38x25') return { w: 38, h: 25, isSheet: false, label: '38mm × 25mm (حراري تجاري)' };
  if(preset === 'thermal_60x40' || preset === '60x40') return { w: 60, h: 40, isSheet: false, label: '60mm × 40mm (حراري كبير)' };
  if(preset === 'a4_24') return { w: 64, h: 33.8, isSheet: true, cols: 3, rows: 8, total: 24, label: 'ورق A4 مقسم (24 ملصق: 3×8)' };
  if(preset === 'a4_30') return { w: 64, h: 27, isSheet: true, cols: 3, rows: 10, total: 30, label: 'ورق A4 مقسم (30 ملصق: 3×10)' };
  if(preset === 'a4_40') return { w: 48.5, h: 25.4, isSheet: true, cols: 4, rows: 10, total: 40, label: 'ورق A4 مقسم (40 ملصق: 4×10)' };
  if(preset === 'a4_65') return { w: 38, h: 21.2, isSheet: true, cols: 5, rows: 13, total: 65, label: 'ورق A4 مقسم (65 ملصق: 5×13)' };
  return { w: Number(customW)||40, h: Number(customH)||20, isSheet: false, label: `مخصص (${customW||40}mm × ${customH||20}mm)` };
}

function generateSingleLabelMarkup(bs, dim, svgId='labelBarcodeSvg', scale=1){
  const shopName = (state.settings && state.settings.shopName) || 'صيانة ميكروتك';
  const todayStr = cleanDate(new Date());

  // Pixel aspect ratio for live screen rendering (1mm ≈ 3.78px)
  const pxW = Math.round(dim.w * 3.78 * scale);
  const pxH = Math.round(dim.h * 3.78 * scale);

  return `
    <div class="barcode-label-mockup" style="width:${pxW}px;height:${pxH}px;padding:${Math.max(2, Math.round(2*scale))}px ${Math.max(3, Math.round(4*scale))}px;border-radius:${Math.max(2, Math.round(4*scale))}px;">
      ${bs.showShopName ? `<div class="lbl-shop" style="font-size:${Math.max(7, Math.round(8.5*scale))}px;">${escapeHtml(shopName)}</div>` : ''}
      
      <div>
        ${bs.showItemName ? `<div class="lbl-title" style="font-size:${Math.max(8, Math.round(10*scale))}px;">${escapeHtml(bs.customTitle||'صنف بدون اسم')}</div>` : ''}
        ${bs.customSubtitle ? `<div class="lbl-sub" style="font-size:${Math.max(6.5, Math.round(7.5*scale))}px;">${escapeHtml(bs.customSubtitle)}</div>` : ''}
      </div>

      <div class="lbl-barcode-wrap">
        ${bs.barcodeType === 'QR' ? `
          <div style="display:flex;align-items:center;justify-content:center;">${QRCodeGenerator.toSvg(bs.customBarcode||'1001', Math.round(pxH*0.48))}</div>
        ` : `
          <svg id="${svgId}" style="max-height:${Math.max(16, Math.round(pxH*0.36))}px;"></svg>
        `}
        ${bs.showBarcodeText && bs.barcodeType !== 'QR' ? `
          <div class="mono" style="font-size:${Math.max(7, Math.round(8*scale))}px;font-weight:700;color:#000;letter-spacing:0.5px;margin-top:1px;">
            ${escapeHtml(bs.customBarcode||'')}
          </div>
        ` : ''}
      </div>

      <div class="lbl-foot">
        ${bs.showPrice && bs.customPrice ? `
          <div class="lbl-price mono" style="font-size:${Math.max(8.5, Math.round(10.5*scale))}px;">${Number(bs.customPrice).toLocaleString()} <span style="font-size:7.5px;">ج.م</span></div>
        ` : '<div></div>'}
        ${bs.showDate ? `
          <div style="font-size:${Math.max(6.5, Math.round(7.5*scale))}px;color:#555;">${todayStr}</div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderBarcodeLivePreview(){
  const container = document.getElementById('bsLivePreviewContainer');
  const badge = document.getElementById('bsDimBadge');
  if(!container) return;

  const bs = state.barcodeStudio;
  const dim = getBarcodePaperDimensions(bs.preset, bs.customWidth, bs.customHeight);
  
  if(badge){
    badge.innerHTML = `المقاس المختار: <b>${dim.label}</b> • ${dim.isSheet ? 'صفحة A4 متعددة الملصقات' : 'طابعة حرارية فردية'}`;
  }

  if(dim.isSheet){
    // Render full A4 sheet scaled down
    const count = Math.min(dim.total, Number(bs.copies)||dim.total);
    let stickersHtml = '';
    for(let i=0; i<dim.total; i++){
      if(i < count){
        stickersHtml += generateSingleLabelMarkup(bs, dim, `sheetSvg_${i}`, 0.72);
      } else {
        stickersHtml += `<div style="border:1px dashed #cbd5e1;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:10px;background:#f8fafc;">فارغ</div>`;
      }
    }

    container.innerHTML = `
      <div style="text-align:center;margin-bottom:8px;font-size:12px;font-weight:700;color:var(--ink);">
        معاينة ورقة A4 كاملة (${count} ملصق مطلوب من أصل ${dim.total})
      </div>
      <div class="barcode-a4-sheet-preview" style="grid-template-columns:repeat(${dim.cols}, 1fr);transform:scale(0.85);margin:0 auto;">
        ${stickersHtml}
      </div>
    `;

    // Render barcodes for all sheet items
    if(bs.barcodeType !== 'QR' && typeof JsBarcode !== 'undefined'){
      for(let i=0; i<count; i++){
        try {
          JsBarcode(`#sheetSvg_${i}`, String(bs.customBarcode||'1001'), {
            format: bs.barcodeType,
            width: 1.1,
            height: Math.round(dim.h * 1.1),
            displayValue: false,
            margin: 0
          });
        } catch(e){}
      }
    }
  } else {
    // Single Thermal Sticker Preview (render at 1.4x scale for crisp readability)
    container.innerHTML = generateSingleLabelMarkup(bs, dim, 'previewSingleSvg', 1.4);

    if(bs.barcodeType !== 'QR' && typeof JsBarcode !== 'undefined'){
      try {
        JsBarcode('#previewSingleSvg', String(bs.customBarcode||'1001'), {
          format: bs.barcodeType,
          width: 1.4,
          height: Math.round(dim.h * 1.4),
          displayValue: false,
          margin: 0
        });
      } catch(e){
        console.warn('JsBarcode preview error:', e);
      }
    }
  }
}

function attachBarcodeStudioEvents(main){
  const bs = state.barcodeStudio;

  // Inventory Select
  const invSel = document.getElementById('bsInvSelect');
  if(invSel){
    invSel.onchange = ()=>{
      const item = (state.inventory||[]).find(x => String(x.id||x.ID||x.Barcode||x.barcode||x.Name||x.name) === invSel.value);
      if(item){
        bs.customTitle = item.Name || item.name || '';
        bs.customSubtitle = item.Category || item.category || '';
        bs.customPrice = item.SellPrice || item.Price || item.price || '';
        bs.customBarcode = item.Barcode || item.barcode || ('ITM-' + (item.id || item.ID || '1001'));
        renderBarcodeStudioContent(main);
      }
    };
  }

  // Maintenance Select
  const maintSel = document.getElementById('bsMaintSelect');
  if(maintSel){
    maintSel.onchange = ()=>{
      const r = (state.receipts||[]).find(x => String(x.id||x.receiptNumber) === maintSel.value);
      if(r){
        bs.customTitle = (r.customer ? r.customer.name : '') + ' • ' + (r.device ? r.device.brand : '');
        bs.customSubtitle = (r.device ? (r.device.category + ' ' + (r.device.model||'')) : '') + ' • ' + ((r.faults||[]).join('، ')||'صيانة');
        bs.customPrice = r.cost || '';
        bs.customBarcode = r.receiptNumber || 'MT-2026-0001';
        renderBarcodeStudioContent(main);
      }
    };
  }

  // Input bindings
  const titleInput = document.getElementById('bsInputTitle');
  if(titleInput) titleInput.oninput = (e)=>{ bs.customTitle = e.target.value; renderBarcodeLivePreview(); };

  const subInput = document.getElementById('bsInputSubtitle');
  if(subInput) subInput.oninput = (e)=>{ bs.customSubtitle = e.target.value; renderBarcodeLivePreview(); };

  const priceInput = document.getElementById('bsInputPrice');
  if(priceInput) priceInput.oninput = (e)=>{ bs.customPrice = e.target.value; renderBarcodeLivePreview(); };

  const barcodeInput = document.getElementById('bsInputBarcode');
  if(barcodeInput) barcodeInput.oninput = (e)=>{ bs.customBarcode = e.target.value; renderBarcodeLivePreview(); };

  // Random Barcode button
  const randBtn = document.getElementById('bsRandomBarcodeBtn');
  if(randBtn){
    randBtn.onclick = ()=>{
      const code = '622' + String(Math.floor(1000000000 + Math.random() * 9000000000));
      bs.customBarcode = code;
      if(barcodeInput) barcodeInput.value = code;
      renderBarcodeLivePreview();
      showToast('تم توليد باركود جديد', 'info');
    };
  }

  // Preset Select
  const presetSel = document.getElementById('bsPresetSelect');
  if(presetSel){
    presetSel.onchange = ()=>{
      bs.preset = presetSel.value;
      const dimRow = document.getElementById('bsCustomDimRow');
      if(dimRow) dimRow.style.display = bs.preset === 'custom' ? 'grid' : 'none';
      renderBarcodeLivePreview();
    };
  }

  // Custom Dim inputs
  const cW = document.getElementById('bsCustomWidth');
  const cH = document.getElementById('bsCustomHeight');
  if(cW) cW.oninput = (e)=>{ bs.customWidth = Number(e.target.value)||50; renderBarcodeLivePreview(); };
  if(cH) cH.oninput = (e)=>{ bs.customHeight = Number(e.target.value)||30; renderBarcodeLivePreview(); };

  // Barcode Type
  const bTypeSel = document.getElementById('bsBarcodeType');
  if(bTypeSel){
    bTypeSel.onchange = ()=>{ bs.barcodeType = bTypeSel.value; renderBarcodeLivePreview(); };
  }

  // Copies Count
  const copiesInput = document.getElementById('bsCopiesCount');
  const incBtn = document.getElementById('bsIncCopiesBtn');
  const decBtn = document.getElementById('bsDecCopiesBtn');
  if(copiesInput) copiesInput.oninput = (e)=>{ bs.copies = Math.max(1, Number(e.target.value)||1); renderBarcodeLivePreview(); };
  if(incBtn) incBtn.onclick = ()=>{ bs.copies = (Number(bs.copies)||1) + 1; if(copiesInput) copiesInput.value = bs.copies; renderBarcodeLivePreview(); };
  if(decBtn) decBtn.onclick = ()=>{ bs.copies = Math.max(1, (Number(bs.copies)||1) - 1); if(copiesInput) copiesInput.value = bs.copies; renderBarcodeLivePreview(); };

  main.querySelectorAll('.bs-quick-copy-chip').forEach(chip => {
    chip.onclick = ()=>{
      bs.copies = Number(chip.dataset.copies);
      if(copiesInput) copiesInput.value = bs.copies;
      main.querySelectorAll('.bs-quick-copy-chip').forEach(c => {
        c.style.background = c === chip ? 'var(--primary)' : '';
        c.style.color = c === chip ? '#fff' : '';
        c.style.borderColor = c === chip ? 'var(--primary)' : '';
      });
      renderBarcodeLivePreview();
    };
  });

  function saveBarcodeStudioSettings(){
    try {
      setCache('barcode_studio', bs);
      localStorage.setItem('microerp_barcode_studio', JSON.stringify(bs));
      if(!state.settings) state.settings = {};
      if(!state.settings.printers) state.settings.printers = {};
      if(!state.settings.printers.barcodePrinter) state.settings.printers.barcodePrinter = {};
      state.settings.printers.barcodePrinter.showShopName = bs.showShopName;
      state.settings.printers.barcodePrinter.showItemName = bs.showItemName;
      state.settings.printers.barcodePrinter.showPrice = bs.showPrice;
      state.settings.printers.barcodePrinter.showBarcodeText = bs.showBarcodeText;
      state.settings.printers.barcodePrinter.showDate = bs.showDate;
      setCache('settings', state.settings);
      localStorage.setItem('microerp_printers_settings', JSON.stringify(state.settings.printers));
    } catch(e){}
  }

  // Toggles
  const chkShop = document.getElementById('bsCheckShopName');
  if(chkShop) chkShop.onchange = (e)=>{ bs.showShopName = e.target.checked; saveBarcodeStudioSettings(); renderBarcodeLivePreview(); };
  const chkItem = document.getElementById('bsCheckItemName');
  if(chkItem) chkItem.onchange = (e)=>{ bs.showItemName = e.target.checked; saveBarcodeStudioSettings(); renderBarcodeLivePreview(); };
  const chkPrice = document.getElementById('bsCheckPrice');
  if(chkPrice) chkPrice.onchange = (e)=>{ bs.showPrice = e.target.checked; saveBarcodeStudioSettings(); renderBarcodeLivePreview(); };
  const chkCode = document.getElementById('bsCheckBarcodeText');
  if(chkCode) chkCode.onchange = (e)=>{ bs.showBarcodeText = e.target.checked; saveBarcodeStudioSettings(); renderBarcodeLivePreview(); };
  const chkDate = document.getElementById('bsCheckDate');
  if(chkDate) chkDate.onchange = (e)=>{ bs.showDate = e.target.checked; saveBarcodeStudioSettings(); renderBarcodeLivePreview(); };

  // Reset Button
  const resetBtn = document.getElementById('bsResetBtn');
  if(resetBtn){
    resetBtn.onclick = ()=>{
      state.barcodeStudio = null;
      renderBarcodeStudioApp(document.getElementById('app'));
      showToast('تمت إعادة تعيين استوديو الباركود', 'info');
    };
  }

  // Print Buttons
  const print1 = document.getElementById('bsPrintBtn');
  const print2 = document.getElementById('bsPrintBtn2');
  if(print1) print1.onclick = executeBarcodePrint;
  if(print2) print2.onclick = executeBarcodePrint;
}

/* ---------------- Universal Invoice & Batch Barcode Engine ---------------- */

function getInvoicePrintableItems(inv, type = 'purchase'){
  if(!inv) return [];
  let rawItems = [];

  if(type === 'purchase' || inv.Supplier){
    if(Array.isArray(inv.Items) && inv.Items.length > 0){
      rawItems = inv.Items;
    } else if(inv.ItemsJSON){
      try {
        const parsed = JSON.parse(inv.ItemsJSON);
        if(Array.isArray(parsed)) rawItems = parsed;
      } catch(e){}
    }
    if(rawItems.length === 0 && inv.ItemsSummary){
      const parts = String(inv.ItemsSummary).split(/[\+\n،,]/).map(s => s.trim()).filter(Boolean);
      rawItems = parts.map(part => {
        const m = part.match(/^(.+?)\s*[\(\[]\s*(\d+)\s*[\)\]]$/);
        if(m){
          return { Name: m[1].trim(), Quantity: parseInt(m[2]) || 1 };
        }
        return { Name: part, Quantity: 1 };
      });
    }
  } else {
    rawItems = Array.isArray(inv.Items) ? inv.Items : [];
    if(rawItems.length === 0 && inv.ItemsJSON){
      try {
        const parsed = JSON.parse(inv.ItemsJSON);
        if(Array.isArray(parsed)) rawItems = parsed;
      } catch(e){}
    }
    if(rawItems.length === 0 && inv.ItemsSummary){
      const parts = String(inv.ItemsSummary).split(/[\+\n،,]/).map(s => s.trim()).filter(Boolean);
      rawItems = parts.map(part => ({ Name: part, Quantity: 1 }));
    }
  }

  const invList = state.inventory || [];
  return rawItems.map((item, idx) => {
    const itmName = (item.Name || item.name || item.Title || item.title || 'صنف بدون اسم').trim();
    const qty = Math.max(1, parseInt(item.Quantity || item.quantity || item.Qty || item.qty || 1) || 1);
    const matched = invList.find(x => (x.Name || x.name || '').trim().toLowerCase() === itmName.toLowerCase());

    const barcode = String(item.Barcode || item.barcode || (matched ? (matched.Barcode || matched.barcode) : '') || ('ITM-' + (matched ? (matched.id || matched.ID) : (Date.now() + idx))));
    const price = Number(item.Price || item.price || item.SellPrice || (matched ? (matched.SellPrice || matched.Price) : 0) || 0);
    const category = item.Category || item.category || (matched ? (matched.Category || matched.category) : '') || '';

    return {
      id: 'inv_itm_' + idx + '_' + Math.random().toString(36).substr(2, 4),
      Name: itmName,
      Quantity: qty,
      printCopies: qty,
      Price: price,
      Barcode: barcode,
      Category: category,
      selected: true,
      inInventory: !!matched
    };
  });
}

function executeBatchInvoiceBarcodePrint(itemsToPrint, presetKey = 'thermal_40x20'){
  if(!itemsToPrint || itemsToPrint.length === 0){
    showToast('لا توجد أصناف محددة للطباعة', 'warning');
    return;
  }

  const dim = getBarcodePaperDimensions(presetKey);
  const bs = state.barcodeStudio || {};
  const shopName = (state.settings && state.settings.shopName) || 'صيانة ميكروتك';
  const todayStr = cleanDate(new Date());

  const flattenedList = [];
  itemsToPrint.forEach(item => {
    const copies = Math.max(0, parseInt(item.printCopies) || 0);
    for(let c = 0; c < copies; c++){
      flattenedList.push({
        ...item,
        copyIndex: c
      });
    }
  });

  if(flattenedList.length === 0){
    showToast('إجمالي عدد النسخ المطلوبة للطباعة هو صفر (0)', 'warning');
    return;
  }

  if(dim.isSheet){
    let cellsHtml = '';
    const svgIds = [];
    flattenedList.forEach((it, idx) => {
      const svgId = `batchSheetSvg_${idx}`;
      svgIds.push({ id: svgId, barcode: it.Barcode });
      const name = escapeHtml(it.Name);
      const cat = escapeHtml(it.Category || '');
      const price = Number(it.Price || 0).toLocaleString();
      const barcodeVal = escapeHtml(String(it.Barcode || '1001'));

      cellsHtml += `
        <div class="barcode-print-cell" style="width:100% !important;height:${dim.h}mm !important;box-sizing:border-box !important;border:0.2px dashed #cbd5e1 !important;padding:1.5mm 2.5mm !important;display:flex !important;flex-direction:column !important;justify-content:space-between !important;text-align:center !important;overflow:hidden !important;font-family:Arial,Tahoma,sans-serif !important;color:#000 !important;background:#fff !important;">
          ${bs.showShopName !== false ? `<div style="font-size:7.5px;font-weight:800;border-bottom:0.5px solid #ccc;padding-bottom:1px;white-space:nowrap;overflow:hidden;">${escapeHtml(shopName)}</div>` : ''}
          <div>
            ${bs.showItemName !== false ? `<div style="font-size:9px;font-weight:900;line-height:1.1;white-space:nowrap;overflow:hidden;">${name}</div>` : ''}
            ${cat ? `<div style="font-size:7px;color:#444;white-space:nowrap;overflow:hidden;">${cat}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <svg id="${svgId}" style="max-width:96%;height:auto;max-height:${Math.round(dim.h*0.38)}mm;"></svg>
            ${bs.showBarcodeText !== false ? `<div class="mono" style="font-size:7.5px;font-weight:700;color:#000;">${barcodeVal}</div>` : ''}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:7.5px;font-weight:800;border-top:0.5px solid #ccc;padding-top:1px;">
            ${bs.showPrice !== false && price !== '0' ? `<div class="mono" style="font-size:9.5px;font-weight:900;">${price} ج.م</div>` : '<div></div>'}
            ${bs.showDate ? `<div>${todayStr}</div>` : ''}
          </div>
        </div>
      `;
    });

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;border:none;visibility:hidden;';
    document.body.appendChild(iframe);

    const iDoc = iframe.contentDocument || iframe.contentWindow.document;
    iDoc.open();
    iDoc.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { size: A4 portrait !important; margin: 6mm 6mm !important; }
  html, body { margin: 0; padding: 0; background: #fff; width: 100%; height: 100%; }
  .barcode-print-sheet-grid {
    display: grid !important;
    grid-template-columns: repeat(${dim.cols}, 1fr) !important;
    gap: 2.5mm 3.5mm !important;
    width: 198mm !important;
    box-sizing: border-box !important;
  }
</style>
</head>
<body><div class="barcode-print-sheet-grid">${cellsHtml}</div></body>
</html>`);
    iDoc.close();

    if(typeof JsBarcode !== 'undefined'){
      svgIds.forEach(item => {
        try {
          const el = iDoc.getElementById(item.id);
          if(el){
            JsBarcode(el, String(item.barcode||'1001'), {
              format: 'CODE128',
              width: 1.1,
              height: Math.round(dim.h * 1.1),
              displayValue: false,
              margin: 0
            });
          }
        } catch(e){}
      });
    }

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        showToast(`جاري طباعة ${flattenedList.length} ملصق على ورق مقسم A4...`, 'success');
      } catch(e) { window.print(); }
      setTimeout(() => iframe.remove(), 1200);
    }, 250);

  } else {
    // Thermal Roll Sticker (Single unified continuous print job for XP-246B)
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:40mm;visibility:hidden;';
    document.body.appendChild(tempContainer);

    const svgElements = [];
    flattenedList.forEach((it, idx) => {
      const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgEl.id = `batchTmpSvg_${idx}`;
      tempContainer.appendChild(svgEl);
      renderStickerBarcodeSVG(`#batchTmpSvg_${idx}`, it.Barcode || '1001', dim);
      svgElements.push(svgEl.outerHTML);
    });
    tempContainer.remove();

    let pagesHtml = '';
    flattenedList.forEach((it, idx) => {
      const innerHtml = generateProductStickerHTML(it, dim, `batchBcSvg_${idx}`);
      pagesHtml += `<div class="sticker-page">${innerHtml}</div>`;
    });

    const iframeHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page {
    size: portrait !important;
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

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;border:none;visibility:hidden;';
    document.body.appendChild(iframe);

    const iDoc = iframe.contentDocument || iframe.contentWindow.document;
    iDoc.open();
    iDoc.write(iframeHtml);
    iDoc.close();

    flattenedList.forEach((it, idx) => {
      const svgPlaceholder = iDoc.getElementById(`batchBcSvg_${idx}`);
      if(svgPlaceholder && svgElements[idx]){
        const parser = new DOMParser();
        const parsed = parser.parseFromString(svgElements[idx], 'image/svg+xml');
        const realSvg = parsed.documentElement;
        realSvg.removeAttribute('id');
        realSvg.style.cssText = 'display:block;width:100%;max-height:' + (dim.h <= 12 ? '5.2mm' : dim.h <= 22 ? '7.5mm' : '10mm') + ';';
        svgPlaceholder.parentNode.replaceChild(realSvg, svgPlaceholder);
      }
    });

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        showToast(`جاري إرسال ${flattenedList.length} ملصق إلى طابعة الباركود...`, 'success');
      } catch(e) {
        console.warn('iframe batch print failed, falling back', e);
        window.print();
      }
      setTimeout(() => iframe.remove(), 1200);
    }, 250);
  }
}

function executeBarcodePrint(){
  const bs = state.barcodeStudio || {};
  const dim = getBarcodePaperDimensions(bs.preset, bs.customWidth, bs.customHeight);
  const copies = Math.max(1, Number(bs.copies)||1);
  const todayStr = cleanDate(new Date());

  if(dim.isSheet){
    const itemData = {
      Name: bs.customTitle || 'صنف',
      Category: bs.customSubtitle || '',
      Price: bs.customPrice || '',
      Barcode: bs.customBarcode || '1001',
      date: todayStr
    };
    executeBatchInvoiceBarcodePrint([{ ...itemData, printCopies: copies, selected: true }], bs.preset);
  } else {
    if(bs.mode === 'maintenance'){
      const rec = (state.receipts || []).find(r => r.id === bs.selectedReceiptId || r.receiptNumber === bs.customBarcode);
      if(rec){
        executeDirectStickerPrint({ type: 'receipt', data: rec }, dim, copies);
      } else {
        const dummyRec = {
          receiptNumber: bs.customBarcode || 'MT-2026-0001',
          customer: { name: bs.customTitle || 'عميل صيانة', phone: '' },
          device: { brand: bs.customSubtitle || '', category: 'جهاز صيانة', model: '' },
          faults: [bs.customSubtitle || 'فحص وصيانة'],
          cost: bs.customPrice || 0,
          date: todayStr
        };
        executeDirectStickerPrint({ type: 'receipt', data: dummyRec }, dim, copies);
      }
    } else {
      const itemData = {
        Name: bs.customTitle || 'صنف',
        Category: bs.customSubtitle || '',
        Price: bs.customPrice || '',
        Barcode: bs.customBarcode || '1001',
        date: todayStr
      };
      executeDirectStickerPrint({ type: 'product', data: itemData }, dim, copies);
    }
  }
}

/* ---------------- Invoice Barcode Batch Workspace (View & Modal) ---------------- */

function createInvoiceBarcodeWorkspace(opts){
  const container = opts.container;
  const isModal = Boolean(opts.isModal);
  const purchases = state.purchases || [];
  const invoices = state.invoices || [];

  // Determine initial selection
  let selectedType = opts.preselectedType || (purchases.length > 0 ? 'purchase' : (invoices.length > 0 ? 'invoice' : 'purchase'));
  let selectedId = opts.preselectedId || '';

  if(!selectedId){
    if(selectedType === 'purchase' && purchases.length > 0){
      selectedId = purchases[purchases.length - 1].ID || '';
    } else if(selectedType === 'invoice' && invoices.length > 0){
      selectedId = invoices[invoices.length - 1].ID || '';
    }
  }

  let selectedPreset = (state.barcodeStudio && state.barcodeStudio.preset) || 'thermal_40x20';
  let items = [];

  function loadCurrentItems(){
    let targetInv = null;
    if(selectedType === 'purchase'){
      targetInv = purchases.find(p => String(p.ID) === String(selectedId)) || purchases[purchases.length - 1];
    } else {
      targetInv = invoices.find(inv => String(inv.ID) === String(selectedId)) || invoices[invoices.length - 1];
    }
    if(targetInv){
      selectedId = targetInv.ID;
      items = getInvoicePrintableItems(targetInv, selectedType);
    } else {
      items = [];
    }
  }

  loadCurrentItems();

  function renderView(){
    const totalSelected = items.filter(i => i.selected).length;
    const totalCopies = items.filter(i => i.selected).reduce((s, i) => s + Math.max(0, parseInt(i.printCopies) || 0), 0);

    const bs = state.barcodeStudio || {};

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;direction:rtl;">
        ${!isModal ? `
          <div class="top-header" style="margin-bottom:6px;">
            <div>
              <h2 class="page-title">${getSvgIcon("barcode", 22)} طباعة ملصقات الباركود من فواتير الشراء والمخزن</h2>
            </div>
            <div style="display:flex;gap:10px;align-items:center;">
              <button class="btn btn-primary" id="btnDoBatchPrintTop" style="font-weight:900;padding:9px 18px;font-size:14px;box-shadow:0 4px 14px rgba(79,70,229,0.35);">
                ${getSvgIcon("printer", 14)} طباعة الملصقات المحددة (${totalCopies} ملصق)
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Top Controls Box -->
        <div class="card" style="padding:14px 18px;margin:0;border:1px solid var(--line);background:var(--bg-card,#fff);">
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:12px;align-items:flex-end;">
            
            <div class="field" style="margin:0;">
              <label style="font-weight:800;">اختر الفاتورة المطلوبة</label>
              <select id="wksInvoiceSelect" style="font-weight:700;">
                <optgroup label="فواتير الشراء والتوريد من الموردين (${purchases.length})">
                  ${purchases.slice().reverse().map(p => `
                    <option value="purchase:${p.ID}" ${(selectedType==='purchase'&&String(selectedId)===String(p.ID))?'selected':''}>
                      شراء: ${escapeHtml(p.Supplier||'مورد')} — ${cleanDate(p.Date)} (${Number(p.Total||0).toLocaleString()} ج.م)
                    </option>
                  `).join('')}
                </optgroup>
                <optgroup label="الفواتير الرسمية والمبيعات (${invoices.length})">
                  ${invoices.slice().reverse().map(inv => `
                    <option value="invoice:${inv.ID}" ${(selectedType==='invoice'&&String(selectedId)===String(inv.ID))?'selected':''}>
                      فاتورة #${escapeHtml(inv.InvoiceNumber||'')}: ${escapeHtml(inv.CustomerName||'عميل')} — ${cleanDate(inv.Date)} (${Number(inv.Total||0).toLocaleString()} ج.م)
                    </option>
                  `).join('')}
                </optgroup>
              </select>
            </div>

            <div class="field" style="margin:0;">
              <label style="font-weight:800;">مقاس الملصق ونوع الطابعة</label>
              <select id="wksPresetSelect" style="font-weight:700;">
                <option value="thermal_40x20" ${selectedPreset==='thermal_40x20'?'selected':''}>40mm × 20mm (حراري 4×2 سم قياسي - XP-246B)</option>
                <option value="thermal_40x10" ${selectedPreset==='thermal_40x10'?'selected':''}>40mm × 10mm (حراري 4×1 سم شريط رفيع للبضائع)</option>
                <option value="thermal_40x15" ${selectedPreset==='thermal_40x15'?'selected':''}>40mm × 15mm (حراري 4×1.5 سم)</option>
                <option value="thermal_50x25" ${selectedPreset==='thermal_50x25'?'selected':''}>50mm × 25mm (حراري 5×2.5 سم)</option>
                <option value="thermal_50x30" ${selectedPreset==='thermal_50x30'?'selected':''}>50mm × 30mm (حراري 5×3 سم)</option>
                <option value="thermal_60x40" ${selectedPreset==='thermal_60x40'?'selected':''}>60mm × 40mm (حراري كبير)</option>
                <optgroup label="صفحات A4 مقسمة">
                  <option value="a4_24" ${selectedPreset==='a4_24'?'selected':''}>ورق A4 مقسم (24 ملصق)</option>
                  <option value="a4_30" ${selectedPreset==='a4_30'?'selected':''}>ورق A4 مقسم (30 ملصق)</option>
                  <option value="a4_40" ${selectedPreset==='a4_40'?'selected':''}>ورق A4 مقسم (40 ملصق)</option>
                  <option value="a4_65" ${selectedPreset==='a4_65'?'selected':''}>ورق A4 مقسم (65 ملصق)</option>
                </optgroup>
              </select>
            </div>

            <div style="display:flex;align-items:center;gap:10px;justify-content:flex-end;">
              <div style="text-align:center;padding:6px 14px;background:var(--paper3,#f1f5f9);border-radius:10px;border:1px solid var(--line);">
                <div style="font-size:11px;color:var(--ink-secondary);">إجمالي الملصقات</div>
                <div class="mono font-bold" style="font-size:18px;color:var(--primary);">${totalCopies}</div>
              </div>
              <button class="btn btn-primary" id="btnDoBatchPrint" style="font-weight:900;padding:10px 20px;font-size:14px;height:44px;box-shadow:0 4px 14px rgba(79,70,229,0.3);">
                ${getSvgIcon("printer", 14)} طباعة الملصقات الآن
              </button>
            </div>

          </div>

          <!-- Quick Quantity & Selection Bar -->
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-top:14px;padding-top:12px;border-top:1px dashed var(--line);">
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="btn btn-ghost btn-xs" id="wksBtnSelectAll">${getSvgIcon("check", 11)} تحديد الكل</button>
              <button class="btn btn-ghost btn-xs" id="wksBtnDeselectAll">⬜ إلغاء التحديد</button>
              <button class="btn btn-ghost btn-xs" id="wksBtnResetInvoiceQty">${getSvgIcon("refresh", 11)} استعادة كميات الفاتورة</button>
              <button class="btn btn-ghost btn-xs" id="wksBtnSetOneQty">1️⃣ ملصق واحد لكل صنف</button>
              <button class="btn btn-ghost btn-xs" id="wksBtnSetZeroQty">0️⃣ تصفير الكميات</button>
            </div>
            
            <!-- Quick visibility toggles -->
            <div style="display:flex;gap:12px;font-size:11.5px;align-items:center;flex-wrap:wrap;">
              <span style="color:var(--ink-secondary);font-weight:700;">عناصر الملصق:</span>
              <label style="display:flex;align-items:center;gap:4px;cursor:pointer;">
                <input type="checkbox" id="wksToggleShopName" ${bs.showShopName!==false?'checked':''}>
                <span>المحل</span>
              </label>
              <label style="display:flex;align-items:center;gap:4px;cursor:pointer;">
                <input type="checkbox" id="wksTogglePrice" ${bs.showPrice!==false?'checked':''}>
                <span>السعر</span>
              </label>
              <label style="display:flex;align-items:center;gap:4px;cursor:pointer;">
                <input type="checkbox" id="wksToggleBarcode" ${bs.showBarcodeText!==false?'checked':''}>
                <span>الكود</span>
              </label>
              <label style="display:flex;align-items:center;gap:4px;cursor:pointer;">
                <input type="checkbox" id="wksToggleDate" ${bs.showDate?'checked':''}>
                <span>التاريخ</span>
              </label>
            </div>
          </div>

        </div>

        <!-- Items Table Card -->
        <div class="card" style="padding:0;overflow:hidden;border:1px solid var(--line);margin:0;">
          <div style="padding:10px 16px;background:var(--paper2,#f8fafc);border-bottom:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;">
            <b style="font-size:13px;">جدول أصناف الفاتورة المحددة (${items.length} صنف مسجل)</b>
            <span class="status-badge st-check" style="font-size:11px;">المحدد للطباعة: ${totalSelected} صنف • ${totalCopies} ملصق</span>
          </div>

          ${items.length === 0 ? `
            <div class="empty" style="padding:40px 20px;">
              <div style="display:flex;justify-content:center;margin-bottom:10px;">${getSvgIcon("package", 32)}</div>
              <b>لا توجد أصناف مسجلة في هذه الفاتورة أو تعذر قراءة بنودها.</b>
              <div style="font-size:12px;color:var(--ink-secondary);margin-top:4px;">يمكنك اختيار فاتورة أخرى من القائمة بالأعلى.</div>
            </div>
          ` : `
            <div class="table-wrap" style="max-height:460px;overflow-y:auto;">
              <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
                <thead style="position:sticky;top:0;background:var(--paper2,#f8fafc);z-index:2;border-bottom:1.5px solid var(--line);">
                  <tr>
                    <th style="width:40px;text-align:center;">
                      <input type="checkbox" id="wksMasterCheck" ${totalSelected===items.length?'checked':''}>
                    </th>
                    <th>اسم الصنف</th>
                    <th>كود الباركود</th>
                    <th>سعر البيع</th>
                    <th style="text-align:center;">كمية الفاتورة</th>
                    <th style="text-align:center;width:150px;">عدد ملصقات الطباعة</th>
                    <th style="text-align:center;">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map((it, idx) => `
                    <tr style="background:${it.selected?'transparent':'rgba(0,0,0,0.02)'};opacity:${it.selected?1:0.6};transition:background 0.2s;">
                      <td style="text-align:center;">
                        <input type="checkbox" class="wks-item-check" data-idx="${idx}" ${it.selected?'checked':''}>
                      </td>
                      <td>
                        <div style="font-weight:800;color:var(--ink);">${escapeHtml(it.Name)}</div>
                        ${it.Category ? `<span style="font-size:11px;color:var(--ink-secondary);">${escapeHtml(it.Category)}</span>` : ''}
                      </td>
                      <td>
                        <input type="text" class="mono font-bold wks-item-barcode" data-idx="${idx}" value="${escapeHtml(it.Barcode)}" style="font-size:11.5px;padding:4px 8px;width:130px;border:1px solid var(--line);border-radius:6px;">
                      </td>
                      <td>
                        <div class="mono font-bold" style="color:var(--green);">${Number(it.Price||0).toLocaleString()} ج.م</div>
                      </td>
                      <td style="text-align:center;">
                        <span class="mono font-bold status-badge" style="font-size:12px;">${it.Quantity}</span>
                      </td>
                      <td style="text-align:center;">
                        <div style="display:inline-flex;align-items:center;gap:4px;background:var(--paper3,#f1f5f9);padding:2px 6px;border-radius:8px;border:1px solid var(--line);">
                          <button class="btn btn-ghost btn-xs wks-btn-dec" data-idx="${idx}" style="width:26px;height:26px;padding:0;font-weight:900;font-size:14px;border-radius:6px;">-</button>
                          <input type="number" class="mono font-bold wks-item-copies" data-idx="${idx}" value="${it.printCopies}" min="0" max="500" style="width:48px;text-align:center;padding:3px;border:1px solid var(--line);border-radius:6px;background:#fff;">
                          <button class="btn btn-ghost btn-xs wks-btn-inc" data-idx="${idx}" style="width:26px;height:26px;padding:0;font-weight:900;font-size:14px;border-radius:6px;">+</button>
                        </div>
                      </td>
                      <td style="text-align:center;">
                        ${it.inInventory ? `
                          <span class="status-badge st-done" style="font-size:10px;">بالمخزن</span>
                        ` : `
                          <span class="status-badge st-pending" style="font-size:10px;">فاتورة</span>
                        `}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        ${isModal ? `
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--line);">
            <button class="btn btn-ghost btn-sm" id="wksNavToStudioBtn">${getSvgIcon("barcode", 13)} فتح كامل في استوديو الباركود</button>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-ghost btn-sm" id="wksModalCancelBtn">إلغاء وإغلاق</button>
              <button class="btn btn-primary btn-sm" id="wksModalSubmitBtn" style="font-weight:900;padding:8px 18px;">
                ${getSvgIcon("printer", 13)} طباعة (${totalCopies} ملصق)
              </button>
            </div>
          </div>
        ` : ''}

      </div>
    `;

    // Attach Event Handlers
    const selInv = container.querySelector('#wksInvoiceSelect');
    if(selInv){
      selInv.onchange = (e) => {
        const val = e.target.value;
        const [type, id] = val.split(':');
        selectedType = type;
        selectedId = id;
        loadCurrentItems();
        renderView();
      };
    }

    const selPreset = container.querySelector('#wksPresetSelect');
    if(selPreset){
      selPreset.onchange = (e) => {
        selectedPreset = e.target.value;
        if(state.barcodeStudio) state.barcodeStudio.preset = selectedPreset;
      };
    }

    // Toggles
    const tShop = container.querySelector('#wksToggleShopName');
    if(tShop) tShop.onchange = (e) => { if(!state.barcodeStudio) state.barcodeStudio={}; state.barcodeStudio.showShopName = e.target.checked; };
    const tPrice = container.querySelector('#wksTogglePrice');
    if(tPrice) tPrice.onchange = (e) => { if(!state.barcodeStudio) state.barcodeStudio={}; state.barcodeStudio.showPrice = e.target.checked; };
    const tBarcode = container.querySelector('#wksToggleBarcode');
    if(tBarcode) tBarcode.onchange = (e) => { if(!state.barcodeStudio) state.barcodeStudio={}; state.barcodeStudio.showBarcodeText = e.target.checked; };
    const tDate = container.querySelector('#wksToggleDate');
    if(tDate) tDate.onchange = (e) => { if(!state.barcodeStudio) state.barcodeStudio={}; state.barcodeStudio.showDate = e.target.checked; };

    // Master Checkbox
    const masterCheck = container.querySelector('#wksMasterCheck');
    if(masterCheck){
      masterCheck.onchange = (e) => {
        const checked = e.target.checked;
        items.forEach(it => it.selected = checked);
        renderView();
      };
    }

    // Item Checkboxes
    container.querySelectorAll('.wks-item-check').forEach(chk => {
      chk.onchange = (e) => {
        const idx = Number(e.target.dataset.idx);
        if(items[idx]){
          items[idx].selected = e.target.checked;
          renderView();
        }
      };
    });

    // Barcode text input
    container.querySelectorAll('.wks-item-barcode').forEach(inp => {
      inp.onchange = (e) => {
        const idx = Number(e.target.dataset.idx);
        if(items[idx]) items[idx].Barcode = e.target.value.trim();
      };
    });

    // Copies inputs & +/- buttons
    container.querySelectorAll('.wks-btn-dec').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.idx);
        if(items[idx]){
          items[idx].printCopies = Math.max(0, (parseInt(items[idx].printCopies) || 0) - 1);
          renderView();
        }
      };
    });

    container.querySelectorAll('.wks-btn-inc').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.idx);
        if(items[idx]){
          items[idx].printCopies = (parseInt(items[idx].printCopies) || 0) + 1;
          items[idx].selected = true;
          renderView();
        }
      };
    });

    container.querySelectorAll('.wks-item-copies').forEach(inp => {
      inp.onchange = (e) => {
        const idx = Number(e.target.dataset.idx);
        if(items[idx]){
          const val = Math.max(0, parseInt(e.target.value) || 0);
          items[idx].printCopies = val;
          if(val > 0) items[idx].selected = true;
          renderView();
        }
      };
    });

    // Quick Action Buttons
    const btnSelAll = container.querySelector('#wksBtnSelectAll');
    if(btnSelAll) btnSelAll.onclick = () => { items.forEach(it => it.selected = true); renderView(); };

    const btnDeselAll = container.querySelector('#wksBtnDeselectAll');
    if(btnDeselAll) btnDeselAll.onclick = () => { items.forEach(it => it.selected = false); renderView(); };

    const btnResetQty = container.querySelector('#wksBtnResetInvoiceQty');
    if(btnResetQty) btnResetQty.onclick = () => { items.forEach(it => { it.printCopies = it.Quantity; it.selected = true; }); renderView(); };

    const btnSetOne = container.querySelector('#wksBtnSetOneQty');
    if(btnSetOne) btnSetOne.onclick = () => { items.forEach(it => { it.printCopies = 1; it.selected = true; }); renderView(); };

    const btnSetZero = container.querySelector('#wksBtnSetZeroQty');
    if(btnSetZero) btnSetZero.onclick = () => { items.forEach(it => it.printCopies = 0); renderView(); };

    // Print Triggers
    const doPrint = () => {
      const printable = items.filter(it => it.selected && Number(it.printCopies) > 0);
      if(printable.length === 0){
        showToast('يرجى اختيار صنف واحد على الأقل وتحديد عدد ملصقات أكبر من صفر', 'warning');
        return;
      }
      executeBatchInvoiceBarcodePrint(printable, selectedPreset);
    };

    const btnPrint1 = container.querySelector('#btnDoBatchPrint');
    if(btnPrint1) btnPrint1.onclick = doPrint;
    const btnPrintTop = container.querySelector('#btnDoBatchPrintTop');
    if(btnPrintTop) btnPrintTop.onclick = doPrint;
    const btnModalSubmit = container.querySelector('#wksModalSubmitBtn');
    if(btnModalSubmit) btnModalSubmit.onclick = doPrint;

    // Modal navigation
    const btnCancel = container.querySelector('#wksModalCancelBtn');
    if(btnCancel && opts.onClose) btnCancel.onclick = opts.onClose;

    const btnNavStudio = container.querySelector('#wksNavToStudioBtn');
    if(btnNavStudio){
      btnNavStudio.onclick = () => {
        if(opts.onClose) opts.onClose();
        state.currentSection = 'barcodeStudio';
        state.barcodeTab = 'invoice';
        render();
      };
    }
  }

  renderView();
}

function renderBarcodeStudioInvoiceView(main){
  createInvoiceBarcodeWorkspace({
    container: main,
    isModal: false
  });
}

function openInvoiceBarcodePrintModal(type = 'purchase', targetId = ''){
  const existing = document.getElementById('invoiceBarcodePrintModalOverlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'invoiceBarcodePrintModalOverlay';
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'z-index: 10050; display:flex; align-items:center; justify-content:center; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px);';

  const modal = document.createElement('div');
  modal.className = 'modal-card';
  modal.style.cssText = 'max-width: 900px; width: 95%; max-height: 90vh; background: var(--bg-card, #fff); border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35); overflow: hidden; display: flex; flex-direction: column; border: 1px solid var(--line, #e2e8f0);';

  modal.innerHTML = `
    <div style="padding: 14px 20px; background: linear-gradient(135deg, #1e293b, #0f172a); color: #fff; display: flex; align-items: center; justify-content: space-between;">
      <div style="display:flex; align-items:center; gap: 10px;">
        <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(124, 58, 237, 0.25); display:flex; align-items:center; justify-content:center; border: 1px solid rgba(124, 58, 237, 0.4);">${getSvgIcon("barcode", 18)}</div>
        <div>
          <h3 style="margin: 0; font-size: 15px; font-weight: 900; color: #fff;">طباعة ملصقات الباركود من الفاتورة</h3>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">تحديد الأصناف والكميات المطلوب طباعتها لطابعة الباركود</div>
        </div>
      </div>
      <button id="closeInvoiceBarcodeModalBtn" style="background: rgba(255,255,255,0.1); border: none; color: #cbd5e1; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" aria-label="إغلاق">&times;</button>
    </div>
    <div id="invoiceBarcodeWorkspaceMount" style="padding: 16px 20px; overflow-y: auto; max-height: calc(90vh - 65px);"></div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const closeFn = () => overlay.remove();
  overlay.querySelector('#closeInvoiceBarcodeModalBtn').onclick = closeFn;

  createInvoiceBarcodeWorkspace({
    container: modal.querySelector('#invoiceBarcodeWorkspaceMount'),
    isModal: true,
    preselectedType: type,
    preselectedId: targetId,
    onClose: closeFn
  });
}

/* ============================================================
   U4: Full System Backup, Automated Drive Snapshots & Restore Engine
   ============================================================ */

function downloadJsonFile(filename, dataObj){
  const jsonStr = JSON.stringify(dataObj, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
}

function createLocalBackupPayload(){
  const dateStr = new Date().toISOString();
  return {
    appName: 'microERP',
    appVersion: '1.0.0',
    schemaVersion: 10,
    timestamp: dateStr,
    exportedBy: (state.user ? state.user.name : 'admin') + ' (محلي)',
    sheetCounts: {
      Receipts: (state.receipts || []).length,
      Invoices: (state.invoices || []).length,
      Customers: (state.customers || []).length,
      Inventory: (state.inventory || []).length,
      Sales: (state.sales || []).length,
      Expenses: (state.expenses || []).length,
      JournalEntries: (state.journalEntries || []).length,
      Accounts: (state.accounts || []).length,
      Purchases: (state.purchases || []).length,
      Suppliers: (state.suppliers || []).length,
      Quotations: (state.quotations || []).length,
      Sites: (state.cctvSites || []).length,
      Projects: (state.cctvProjects || []).length,
      ProjectDevices: (state.cctvDevices || []).length,
      ServiceVisits: (state.cctvVisits || []).length,
      MaintenanceContracts: (state.cctvContracts || []).length,
      ProjectMilestones: (state.cctvMilestones || []).length
    },
    sheets: {
      Receipts: state.receipts || [],
      Invoices: state.invoices || [],
      Customers: state.customers || [],
      Inventory: state.inventory || [],
      Sales: state.sales || [],
      Expenses: state.expenses || [],
      JournalEntries: state.journalEntries || [],
      Accounts: state.accounts || [],
      Purchases: state.purchases || [],
      Suppliers: state.suppliers || [],
      Quotations: state.quotations || [],
      Sites: state.cctvSites || [],
      Projects: state.cctvProjects || [],
      ProjectDevices: state.cctvDevices || [],
      ServiceVisits: state.cctvVisits || [],
      MaintenanceContracts: state.cctvContracts || [],
      ProjectMilestones: state.cctvMilestones || []
    }
  };
}

function exportSheetToCSV(sheetKey){
  const dateStr = new Date().toISOString().slice(0, 10);
  let filename = '';
  let headers = [];
  let rows = [];

  switch(sheetKey){
    case 'receipts': {
      filename = `Receipts_${dateStr}.csv`;
      headers = ['رقم الإيصال', 'التاريخ', 'اسم العميل', 'الهاتف', 'نوع الجهاز', 'الماركة', 'الموديل', 'الأعطال', 'التكلفة', 'الدفعة', 'المتبقي', 'الحالة', 'الفني', 'شهور الضمان', 'انتهاء الضمان'];
      rows = (state.receipts || []).map(r => [
        r.receiptNumber || r.ReceiptNumber || '',
        r.date || r.Date || '',
        r.customerName || r.CustomerName || '',
        r.customerPhone || r.CustomerPhone || '',
        r.category || r.Category || '',
        r.brand || r.Brand || '',
        r.model || r.Model || '',
        Array.isArray(r.faults) ? r.faults.join(' - ') : (r.faults || r.Faults || ''),
        r.cost || r.Cost || 0,
        r.deposit || r.Deposit || 0,
        (Number(r.cost || r.Cost || 0) - Number(r.deposit || r.Deposit || 0) + Number(r.refunded || r.Refunded || 0)),
        r.status || r.Status || '',
        r.technician || r.Technician || '',
        r.warrantyMonths || r.WarrantyMonths || '',
        r.warrantyEnd || r.WarrantyEnd || ''
      ]);
      break;
    }
    case 'invoices': {
      filename = `Invoices_${dateStr}.csv`;
      headers = ['رقم الفاتورة', 'النوع', 'التاريخ', 'تاريخ الاستحقاق', 'اسم العميل', 'الهاتف', 'المبلغ قبل الضريبة', 'الضريبة', 'الإجمالي', 'المدفوع', 'المتبقي', 'طريقة الدفع', 'الحالة'];
      rows = (state.invoices || []).map(inv => [
        inv.InvoiceNumber || inv.id || '',
        inv.Type || 'فاتورة ضريبية',
        inv.Date || '',
        inv.DueDate || '',
        inv.CustomerName || '',
        inv.CustomerPhone || '',
        inv.Subtotal || 0,
        inv.TaxAmount || 0,
        inv.Total || 0,
        inv.AmountPaid || 0,
        inv.Remaining || 0,
        inv.PaymentMethod || '',
        inv.Status || ''
      ]);
      break;
    }
    case 'customers': {
      filename = `Customers_${dateStr}.csv`;
      headers = ['اسم العميل', 'الهاتف', 'البريد الإلكتروني', 'العنوان', 'الرقم الضريبي', 'المديونية', 'ملاحظات'];
      rows = (state.customers || []).map(c => [
        c.Name || c.name || '',
        c.Phone || c.phone || '',
        c.Email || c.email || '',
        c.Address || c.address || '',
        c.TaxNumber || c.taxNumber || '',
        c.Debt || c.debt || 0,
        c.Notes || c.notes || ''
      ]);
      break;
    }
    case 'inventory': {
      filename = `Inventory_${dateStr}.csv`;
      headers = ['الباركود', 'اسم الصنف', 'التصنيف', 'الكمية', 'سعر الشراء', 'سعر البيع', 'سعر الجملة', 'الموقع'];
      rows = (state.inventory || []).map(item => [
        item.Barcode || item.barcode || '',
        item.Name || item.name || '',
        item.Category || item.category || '',
        item.Quantity != null ? item.Quantity : (item.quantity != null ? item.quantity : 0),
        item.PurchasePrice || item.purchasePrice || 0,
        item.SellPrice || item.sellPrice || 0,
        item.WholesalePrice || item.wholesalePrice || 0,
        item.ShelfLocation || item.shelfLocation || ''
      ]);
      break;
    }
    case 'sales': {
      filename = `Sales_${dateStr}.csv`;
      headers = ['رقم الحركة', 'التاريخ', 'العميل', 'الهاتف', 'الأصناف', 'الإجمالي', 'طريقة الدفع', 'المدفوع', 'المسؤول'];
      rows = (state.sales || []).map(s => [
        s.ID || s.id || '',
        s.Date || s.date || '',
        s.CustomerName || s.customerName || '',
        s.CustomerPhone || s.customerPhone || '',
        s.ItemsSummary || s.itemsSummary || '',
        s.Total || s.total || 0,
        s.PaymentMethod || s.paymentMethod || '',
        s.AmountPaid || s.amountPaid || 0,
        s.By || s.by || ''
      ]);
      break;
    }
    case 'returns': {
      filename = `Sales_Returns_${dateStr}.csv`;
      headers = ['رقم الإشعار', 'رقم الفاتورة الأصلية', 'التاريخ', 'الأصناف المسترجعة', 'مبلغ الاسترداد', 'طريقة الاسترداد', 'المسؤول'];
      const returns = getCache('returns', []);
      rows = returns.map(ret => [
        ret.CreditNoteNumber || ret.ID || '',
        ret.SaleID || '',
        ret.Date || '',
        ret.ItemsSummary || '',
        ret.RefundAmount || 0,
        ret.RefundMethod || '',
        ret.By || ''
      ]);
      break;
    }
    case 'expenses': {
      filename = `Expenses_${dateStr}.csv`;
      headers = ['رقم السند', 'التاريخ', 'التصنيف', 'البيان', 'المبلغ', 'طريقة الدفع', 'المورد/المستفيد', 'كود الحساب', 'المسؤول'];
      rows = (state.expenses || []).map(e => [
        e.ID || e.id || '',
        e.Date || e.date || '',
        e.Category || e.category || '',
        e.Title || e.title || '',
        e.Amount || e.amount || 0,
        e.PaymentMethod || e.paymentMethod || '',
        e.Supplier || e.supplier || '',
        e.AccountCode || e.accountCode || '',
        e.By || e.by || ''
      ]);
      break;
    }
    case 'journal': {
      filename = `JournalEntries_${dateStr}.csv`;
      headers = ['رقم القيد', 'التاريخ', 'البيان', 'نوع المرجع', 'رقم المرجع', 'إجمالي المدين', 'إجمالي الدائن', 'المسؤول'];
      rows = (state.journalEntries || []).map(j => [
        j.EntryNumber || j.ID || '',
        j.Date || '',
        j.Description || '',
        j.ReferenceType || '',
        j.ReferenceID || '',
        j.TotalDebit || 0,
        j.TotalCredit || 0,
        j.By || ''
      ]);
      break;
    }
    case 'accounts': {
      filename = `Chart_Of_Accounts_${dateStr}.csv`;
      headers = ['كود الحساب', 'اسم الحساب', 'النوع', 'طبيعة الحساب', 'الحساب الرئيسي', 'الرصيد'];
      rows = (state.accounts || []).map(a => [
        a.Code || '',
        a.Name || '',
        a.Type || '',
        a.Nature || '',
        a.ParentCode || '',
        a.Balance || 0
      ]);
      break;
    }
    case 'purchases': {
      filename = `Purchases_${dateStr}.csv`;
      headers = ['رقم الفاتورة', 'التاريخ', 'المورد', 'الأصناف', 'الإجمالي', 'المدفوع', 'شهور الضمان', 'المسؤول'];
      rows = (state.purchases || []).map(p => [
        p.ID || p.id || '',
        p.Date || p.date || '',
        p.Supplier || p.supplier || '',
        p.ItemsSummary || p.itemsSummary || '',
        p.Total || p.total || 0,
        p.AmountPaid || p.amountPaid || 0,
        p.WarrantyMonths || p.warrantyMonths || '',
        p.By || p.by || ''
      ]);
      break;
    }
    case 'suppliers': {
      filename = `Suppliers_${dateStr}.csv`;
      headers = ['اسم المورد', 'الهاتف', 'المديونية', 'ملاحظات'];
      rows = (state.suppliers || []).map(sup => [
        sup.Name || sup.name || '',
        sup.Phone || sup.phone || '',
        sup.Debt || sup.debt || 0,
        sup.Notes || sup.notes || ''
      ]);
      break;
    }
    case 'quotations': {
      filename = `Quotations_${dateStr}.csv`;
      headers = ['رقم العرض', 'التاريخ', 'العميل', 'الهاتف', 'ملخص الأصناف', 'تكلفة التركيب', 'الإجمالي', 'الحالة', 'المسؤول'];
      rows = (state.quotations || []).map(q => [
        q.ID || q.id || '',
        q.Date || q.date || '',
        q.ClientName || q.clientName || '',
        q.ClientPhone || q.clientPhone || '',
        q.ItemsSummary || q.itemsSummary || '',
        q.LaborCost || q.laborCost || 0,
        q.Total || q.total || 0,
        q.Status || q.status || '',
        q.By || q.by || ''
      ]);
      break;
    }
    case 'cctv_projects': {
      filename = `CCTV_Projects_${dateStr}.csv`;
      headers = ['رقم المشروع', 'عنوان المشروع', 'الموقع', 'النوع', 'قيمة العقد', 'تاريخ البدء', 'المهندس', 'الحالة'];
      rows = (state.cctvProjects || []).map(proj => [
        proj.ID || '',
        proj.Title || '',
        proj.SiteID || '',
        proj.Type || '',
        proj.ContractValue || 0,
        proj.StartDate || '',
        proj.Engineer || '',
        proj.Status || ''
      ]);
      break;
    }
    case 'cctv_contracts': {
      filename = `Maintenance_Contracts_${dateStr}.csv`;
      headers = ['رقم العقد', 'المشروع', 'الموقع', 'تاريخ البدء', 'تاريخ الانتهاء', 'القيمة السنوية', 'دورية الزيارات', 'الحالة'];
      rows = (state.cctvContracts || []).map(c => [
        c.ID || '',
        c.ProjectID || '',
        c.SiteID || '',
        c.StartDate || '',
        c.EndDate || '',
        c.AnnualValue || 0,
        c.VisitFrequency || '',
        c.Status || ''
      ]);
      break;
    }
    case 'audit_log': {
      filename = `Audit_Logs_${dateStr}.csv`;
      headers = ['التاريخ والوقت', 'المستخدم', 'الإجراء', 'المرجع', 'التفاصيل'];
      const logs = (state.auditLogs && state.auditLogs.length) ? state.auditLogs : getCache('audit_logs', []);
      rows = logs.map(l => [
        l.Timestamp || l.timestamp || '',
        l.User || l.user || '',
        l.Action || l.action || '',
        l.ReceiptID || l.ReceiptNumber || l.refId || '',
        typeof l.Details === 'object' ? JSON.stringify(l.Details) : (l.Details || l.details || '')
      ]);
      break;
    }
    default:
      showToast('جدول غير معروف للتصدير', 'error');
      return;
  }

  if (!rows.length) {
    showToast('لا توجد بيانات متاحة في هذا الجدول للتصدير', 'warning');
    return;
  }

  downloadCSV(filename, headers, rows);
}

async function exportAllSheetsCSV(){
  const sheets = [
    'receipts', 'invoices', 'customers', 'inventory', 'sales',
    'expenses', 'journal', 'accounts', 'purchases', 'suppliers',
    'quotations', 'cctv_projects', 'cctv_contracts', 'audit_log'
  ];
  showToast('جاري تصدير كافة الجداول كملفات CSV...', 'info');
  for (let i = 0; i < sheets.length; i++) {
    exportSheetToCSV(sheets[i]);
    await new Promise(r => setTimeout(r, 250));
  }
}
