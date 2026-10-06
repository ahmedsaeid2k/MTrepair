/* ---------------- 3. Printers Management Hub (تخصيص الطابعات وتعيين العمليات) ---------------- */
function buildPrinterSelectHtml(category, currentName){
  const known = getKnownWindowsPrinters();
  const currentTrimmed = (currentName || '').trim();
  const hasExactMatch = known.some(p => p.name.trim().toLowerCase() === currentTrimmed.toLowerCase());
  let selectedRendered = false;

  const optGroups = {
    receipt: { label: 'طابعات إيصالات الكاشير والبون الحراري (POS / Receipt)', list: [] },
    barcode: { label: 'طابعات ملصقات الباركود (Barcode / Labels)', list: [] },
    laser: { label: 'طابعات الليزر والمستندات العادية (A4 / A5 / Laser / PDF)', list: [] }
  };

  known.forEach(p => {
    const cat = p.category || 'laser';
    if(optGroups[cat]) optGroups[cat].list.push(p.name);
    else optGroups.laser.list.push(p.name);
  });

  let optionsHtml = '';
  if(currentTrimmed && !hasExactMatch){
    optionsHtml += `<option value="${escapeHtml(currentTrimmed)}" selected>[طابعة محفوظة ومخصصة] ${escapeHtml(currentTrimmed)}</option>`;
    selectedRendered = true;
  }

  // Render primary category first, then others
  const catOrder = [category, ...['receipt', 'barcode', 'laser'].filter(c => c !== category)];
  catOrder.forEach(catKey => {
    const grp = optGroups[catKey];
    if(grp && grp.list.length > 0){
      optionsHtml += `<optgroup label="${grp.label}">`;
      grp.list.forEach(name => {
        const isSel = !selectedRendered && (name.trim().toLowerCase() === currentTrimmed.toLowerCase());
        if(isSel) selectedRendered = true;
        optionsHtml += `<option value="${escapeHtml(name)}" ${isSel ? 'selected' : ''}>${escapeHtml(name)}</option>`;
      });
      optionsHtml += `</optgroup>`;
    }
  });

  optionsHtml += `<option value="__custom__">كتابة / إضافة اسم طابعة أخرى معرفة على ويندوز...</option>`;
  return optionsHtml;
}

function renderPrintersSettings(main){
  const prn = getPrintersSettings();
  const r = prn.receiptPrinter || DEFAULT_PRINTERS_SETTINGS.receiptPrinter;
  const b = prn.barcodePrinter || DEFAULT_PRINTERS_SETTINGS.barcodePrinter;
  const l = prn.laserPrinter || DEFAULT_PRINTERS_SETTINGS.laserPrinter;
  const w = prn.workflowAssignments || DEFAULT_PRINTERS_SETTINGS.workflowAssignments;
  const knownPrns = getKnownWindowsPrinters();

  main.innerHTML = `
    ${renderSettingsNavHeader('تخصيص وإعدادات الطابعات', 'قراءة وتعيين طابعات ويندوز الفعلية من القوائم المنسدلة، تخصيص مقاسات الورق وعرض الطباعة والخطوط الواضحة')}

    <!-- Hero Hardware Configuration Summary Box -->
    <div class="card" style="background:linear-gradient(135deg, rgba(79,70,229,0.06), rgba(16,185,129,0.06));border:1.5px solid var(--primary);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <div>
          <h3 style="margin:0;font-size:16px;color:var(--ink);">الطابعات المعرفة على جهازك بنظام (Windows 11 / Mac)</h3>
          <p style="font-size:12.5px;color:var(--ink-secondary);margin:2px 0 0;">يمكنك اختيار الطابعة المعرفة من القوائم المنسدلة أدناه أو فحص واكتشاف طابعات ويندوز بنقرة زر (${knownPrns.length} طابعة مسجلة):</p>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" id="detectWindowsPrintersBtn" style="color:var(--primary);border-color:var(--primary);font-weight:800;" title="فحص وقراءة الطابعات المتصلة بنظام ويندوز">
            ${getSvgIcon("search", 13)} فحص واكتشاف طابعات ويندوز
          </button>
          <button class="btn btn-primary btn-sm" id="saveAllPrintersSettingsBtnTop">${getSvgIcon("check", 13)} حفظ وتطبيق الإعدادات</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:12px;margin-top:8px;">
        
        <!-- Printer 1: POS Receipt -->
        <div style="background:var(--paper);border:1.5px solid var(--line);border-radius:var(--radius);padding:14px;display:flex;flex-direction:column;justify-content:space-between;">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <span style="display:inline-flex;">${getSvgIcon('pos', 24)}</span>
              <div>
                <b style="font-size:13.5px;display:block;">1. طابعة الريسيت / الكاشير</b>
                <span class="status-badge st-done" style="font-size:10.5px;">رول حراري عريض ${r.paperSize||'80mm'}</span>
              </div>
            </div>
            <div style="font-size:12px;color:var(--ink-secondary);margin-bottom:8px;line-height:1.4;">
              الطابعة المحددة: <b style="color:var(--ink);">${escapeHtml(r.name || 'Xprinter XP-808')}</b><br>
              المستندات: إيصالات وبونات البيع السريع ونقطة البيع.
            </div>
          </div>
          <button class="btn btn-ghost btn-xs test-receipt-print-btn" style="border-color:var(--primary);color:var(--primary);font-weight:800;width:100%;">
            ${getSvgIcon("printer", 13)} طباعة بون تجريبي (80mm عريض واضح)
          </button>
        </div>

        <!-- Printer 2: Barcode Sticker -->
        <div style="background:var(--paper);border:1.5px solid var(--line);border-radius:var(--radius);padding:14px;display:flex;flex-direction:column;justify-content:space-between;">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <span style="display:inline-flex;">${getSvgIcon('tag', 24)}</span>
              <div>
                <b style="font-size:13.5px;display:block;">2. طابعة ملصقات الباركود</b>
                <span class="status-badge st-repair" style="font-size:10.5px;">رول ملصقات ${b.defaultSize||'50x30'} مم</span>
              </div>
            </div>
            <div style="font-size:12px;color:var(--ink-secondary);margin-bottom:8px;line-height:1.4;">
              الطابعة المحددة: <b style="color:var(--ink);">${escapeHtml(b.name || 'Xprinter XP-365B')}</b><br>
              المستندات: ملصقات باركود الأصناف وأكواد أجهزة الصيانة.
            </div>
          </div>
          <button class="btn btn-ghost btn-xs test-barcode-print-btn" style="border-color:var(--purple);color:var(--purple);font-weight:800;width:100%;">
            ${getSvgIcon("printer", 13)} طباعة ملصق تجريبي (50x30)
          </button>
        </div>

        <!-- Printer 3: Laser / Office Printer -->
        <div style="background:var(--paper);border:1.5px solid var(--line);border-radius:var(--radius);padding:14px;display:flex;flex-direction:column;justify-content:space-between;">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <span style="display:inline-flex;">${getSvgIcon('fileText', 24)}</span>
              <div>
                <b style="font-size:13.5px;display:block;">3. طابعة الليزر والمستندات العادية</b>
                <span class="status-badge st-check" style="font-size:10.5px;">أوراق A4 / A5</span>
              </div>
            </div>
            <div style="font-size:12px;color:var(--ink-secondary);margin-bottom:8px;line-height:1.4;">
              الطابعة المحددة: <b style="color:var(--ink);">${escapeHtml(l.name || 'HP LaserJet Pro')}</b><br>
              المستندات: إيصالات وضمان الصيانة، الفواتير، والتقارير.
            </div>
          </div>
          <button class="btn btn-ghost btn-xs test-laser-print-btn" style="border-color:var(--green);color:var(--green-text);font-weight:800;width:100%;">
            ${getSvgIcon("printer", 13)} طباعة صفحة A4/A5 تجريبية
          </button>
        </div>

      </div>
    </div>

    <!-- 1. Receipt Thermal Printer Detailed Config -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="margin:0;font-size:15.5px;">1. طابعة إيصالات الكاشير والبون الحراري (POS Receipt Printer - Xprinter 808)</h3>
        <button class="btn btn-ghost btn-xs test-receipt-print-btn" style="color:var(--primary);">${getSvgIcon("printer", 13)} تجربة الطباعة</button>
      </div>

      <div class="grid2" style="margin-bottom:12px;">
        <div class="field">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <label style="margin:0;font-weight:800;">اختر الطابعة المعرفة في ويندوز (Windows Printer Menu)</label>
            <button type="button" class="btn btn-ghost btn-xs toggle-custom-prn-btn" data-target="Receipt" style="font-size:11px;color:var(--primary);padding:1px 6px;">${getSvgIcon("plus", 11)} إضافة اسم طابعة يدوي</button>
          </div>
          <select id="prnReceiptSelect" class="prn-dropdown-select" data-target="Receipt">
            ${buildPrinterSelectHtml('receipt', r.name)}
          </select>
          <div id="prnReceiptCustomWrap" style="display:none;margin-top:6px;">
            <input id="prnReceiptNameCustom" value="${escapeHtml(r.name||'')}" placeholder="اكتب اسم طابعة الريسيت كما يظهر في Control Panel / Windows Settings...">
          </div>
        </div>
        <div class="field">
          <label>مقاس رول الورق ومساحة الطباعة (Receipt Width)</label>
          <select id="prnReceiptSize">
            <option value="80mm" ${r.paperSize==='80mm'?'selected':''}>80mm (عرض عريض 79 مم - أقصى مساحة طباعة بدون اقتصاص لإكس برنتر 808)</option>
            <option value="58mm" ${r.paperSize==='58mm'?'selected':''}>58mm (عرض مدمج 58 مم - طابعات بلوتوث ومدمجة)</option>
          </select>
        </div>
      </div>

      <div class="grid2" style="margin-bottom:12px;">
        <div class="field">
          <label>وضوح وحجم الخطوط على الورق الحراري (Receipt Scale & Size)</label>
          <select id="prnReceiptFontScale">
            <option value="compact" ${r.fontScale==='compact'||!r.fontScale?'selected':''}>مدمج وموفر للورق (نصف الحجم وأنيق ومقروء - موصى به)</option>
            <option value="normal" ${r.fontScale==='normal'?'selected':''}>عادي متوسط قياسي (Standard 80mm)</option>
            <option value="large" ${r.fontScale==='large'||r.fontScale==='max'?'selected':''}>كبير وعريض عالي التباين (Full Large)</option>
          </select>
        </div>
        <div class="field">
          <label>مسافة أمان تفريغ الورق للقاطع التلقائي (Auto-Cutter Feed Margin mm)</label>
          <input type="number" id="prnReceiptCutterFeed" value="${r.cutterFeedMm!=null?r.cutterFeedMm:4}" class="mono font-bold" min="0" max="35">
        </div>
      </div>

      <div class="field">
        <label>عبارة وتذييل شكر الإيصال (Receipt Footer Text)</label>
        <input id="prnReceiptFooter" value="${escapeHtml(r.footerText||'شكراً لتعاملكم معنا • نسعد دائماً بخدمتكم')}">
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:10px;margin-top:10px;">
        <label class="checkbox-row" style="font-size:12.5px;">
          <input type="checkbox" id="prnReceiptAutoPrint" ${r.autoPrint!==false?'checked':''}>
          <span>طباعة البون تلقائياً فور إتمام البيع</span>
        </label>
        <label class="checkbox-row" style="font-size:12.5px;">
          <input type="checkbox" id="prnReceiptShowLogo" ${r.showLogo!==false?'checked':''}>
          <span>إظهار شعار المحل أعلى البون</span>
        </label>
        <label class="checkbox-row" style="font-size:12.5px;">
          <input type="checkbox" id="prnReceiptShowCashier" ${r.showCashier!==false?'checked':''}>
          <span>إظهار اسم الكاشير على البون</span>
        </label>
        <label class="checkbox-row" style="font-size:12.5px;">
          <input type="checkbox" id="prnReceiptPrintBarcode" ${r.printBarcode!==false?'checked':''}>
          <span>توليد باركود SVG أسفل البون لسهولة المرتجع</span>
        </label>
      </div>
    </div>

    <!-- 2. Barcode Label Printer Detailed Config -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="margin:0;font-size:15.5px;">2. طابعة ملصقات الباركود الحرارية (Barcode Label Printer - Xprinter 365B)</h3>
        <button class="btn btn-ghost btn-xs test-barcode-print-btn" style="color:var(--purple);">${getSvgIcon("printer", 13)} تجربة الطباعة</button>
      </div>

      <div class="grid2" style="margin-bottom:12px;">
        <div class="field">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <label style="margin:0;font-weight:800;">اختر طابعة الباركود المعرفة في ويندوز (Windows Printer Menu)</label>
            <button type="button" class="btn btn-ghost btn-xs toggle-custom-prn-btn" data-target="Barcode" style="font-size:11px;color:var(--purple);padding:1px 6px;">${getSvgIcon("plus", 11)} إضافة اسم طابعة يدوي</button>
          </div>
          <select id="prnBarcodeSelect" class="prn-dropdown-select" data-target="Barcode">
            ${buildPrinterSelectHtml('barcode', b.name)}
          </select>
          <div id="prnBarcodeCustomWrap" style="display:none;margin-top:6px;">
            <input id="prnBarcodeNameCustom" value="${escapeHtml(b.name||'')}" placeholder="اكتب اسم طابعة الباركود كما يظهر في Control Panel / Windows Settings...">
          </div>
        </div>
        <div class="field">
          <label>المقاس الافتراضي لملصقات الباركود (Default Label Size)</label>
          <select id="prnBarcodeDefaultSize">
            <option value="40x20" ${b.defaultSize==='40x20'?'selected':''}>40 مم × 20 مم (عرض 4 سم × ارتفاع 2 سم - المقاس الأساسي الأكثر استخداماً)</option>
            <option value="40x10" ${b.defaultSize==='40x10'?'selected':''}>40 مم × 10 مم (عرض 4 سم × ارتفاع 1 سم - شريط رفيع للبضائع والإكسسوارات)</option>
            <option value="40x25" ${b.defaultSize==='40x25'?'selected':''}>40 مم × 25 مم (4×2.5 سم - ملصق أطول للبيانات الواسعة)</option>
            <option value="40x30" ${b.defaultSize==='40x30'?'selected':''}>40 مم × 30 مم (4×3 سم - واسع جداً ومريح للصيانة)</option>
            <option value="40x15" ${b.defaultSize==='40x15'?'selected':''}>40 مم × 15 مم (4×1.5 سم - مدمج)</option>
            <option value="50x25" ${b.defaultSize==='50x25'?'selected':''}>50 مم × 25 مم (5×2.5 سم)</option>
            <option value="50x30" ${b.defaultSize==='50x30'?'selected':''}>50 مم × 30 مم (5×3 سم - قياسي للأجهزة والطرود)</option>
            <option value="38x25" ${b.defaultSize==='38x25'?'selected':''}>38 مم × 25 مم (مقاس تجاري)</option>
            <option value="60x40" ${b.defaultSize==='60x40'?'selected':''}>60 مم × 40 مم (مقاس كبير للطرود والأجهزة الكبيرة)</option>
            <option value="custom" ${b.defaultSize==='custom'?'selected':''}>مقاس مخصص يدوي بالمليمتر...</option>
          </select>
        </div>
      </div>

      <div class="grid2" style="margin-bottom:12px;">
        <div class="field">
          <label>صيغة تشفير الباركود الافتراضية (Barcode Format)</label>
          <select id="prnBarcodeType">
            <option value="CODE128" ${b.barcodeType==='CODE128'?'selected':''}>CODE128 (أعلى دقة ويدعم الحروف والأرقام - موصى به)</option>
            <option value="EAN-13" ${b.barcodeType==='EAN-13'?'selected':''}>EAN-13 (13 رقماً تجارياً)</option>
            <option value="QR" ${b.barcodeType==='QR'?'selected':''}>QR Code (رمز استجابة سريعة مربع)</option>
          </select>
        </div>
        <div class="field">
          <label>عدد النسخ الافتراضي عند النقر السريع</label>
          <input type="number" id="prnBarcodeDefaultCopies" value="${b.defaultCopies||1}" min="1" max="100" class="mono font-bold">
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:10px;">
        <label class="checkbox-row" style="font-size:12.5px;grid-column:1/-1;background:rgba(124,58,237,0.06);padding:6px 10px;border-radius:6px;border:1px solid rgba(124,58,237,0.15);font-weight:700;color:var(--purple);">
          <input type="checkbox" id="prnBarcodeKioskMode" ${b.kioskMode!==false?'checked':''}>
          <span>تفعيل وضع الكيوسك المباشر لملصقات الباركود (طباعة فورية بنقرة واحدة بدون فتح نوافذ تأكيد)</span>
        </label>
        <label class="checkbox-row" style="font-size:12.5px;">
          <input type="checkbox" id="prnBarcodeShowPrice" ${b.showPrice!==false?'checked':''}>
          <span>إظهار سعر البيع على الملصق</span>
        </label>
        <label class="checkbox-row" style="font-size:12.5px;">
          <input type="checkbox" id="prnBarcodeShowShopName" ${b.showShopName!==false?'checked':''}>
          <span>إظهار اسم المحل أعلى الملصق</span>
        </label>
        <label class="checkbox-row" style="font-size:12.5px;">
          <input type="checkbox" id="prnBarcodeShowDate" ${b.showDate?'checked':''}>
          <span>إظهار تاريخ الطباعة على الملصق</span>
        </label>
      </div>

      <div class="grid2" style="margin-top:12px;background:rgba(124,58,237,0.04);padding:10px;border-radius:8px;border:1px solid rgba(124,58,237,0.15);">
        <div class="field">
          <label style="font-weight:700;font-size:12px;">إزاحة أفقية لسنترة الملصق (X Offset مم):</label>
          <input type="number" step="0.5" id="prnBarcodeOffsetX" value="${b.offsetX||0}" class="mono font-bold" placeholder="0 (يمين موجب / يسار سالب)">
        </div>
        <div class="field">
          <label style="font-weight:700;font-size:12px;">إزاحة رأسية لسنترة الملصق (Y Offset مم):</label>
          <input type="number" step="0.5" id="prnBarcodeOffsetY" value="${b.offsetY||0}" class="mono font-bold" placeholder="0 (أسفل موجب / أعلى سالب)">
        </div>
      </div>

      <!-- Service Intake Sticker Configuration -->
      <div style="background:rgba(124,58,237,0.04);border:1.5px solid rgba(124,58,237,0.2);border-radius:10px;padding:12px;margin-top:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
          <h4 style="margin:0;font-size:13px;font-weight:900;color:var(--purple);display:flex;align-items:center;gap:6px;">
            <span>تخصيص استيكر وملصق أجهزة الصيانة الحراري (Thermal Service Label)</span>
          </h4>
          <button type="button" class="btn btn-ghost btn-xs test-maint-sticker-btn" style="color:var(--purple);font-weight:800;border-color:var(--purple);">${getSvgIcon("printer", 13)} تجربة استيكر صيانة</button>
        </div>
        
        <div class="grid2" style="margin-bottom:10px;">
          <div class="field">
            <label style="font-weight:700;font-size:11.5px;">صيغة ونوع الكود الافتراضي على ملصق الصيانة:</label>
            <select id="prnBarcodeMaintMode">
              <option value="qr" ${b.barcodeMode==='qr'||!b.barcodeMode?'selected':''}>رمز QR للتتبع لتتبع العميل المباشر (Smart Tracking QR - موصى به)</option>
              <option value="barcode" ${b.barcodeMode==='barcode'?'selected':''}>باركود Code128 تقليدي (لقارئ الباركود الليزر USB)</option>
              <option value="none" ${b.barcodeMode==='none'?'selected':''}>نصي بولد فقط (بدون كود)</option>
            </select>
          </div>
          <div class="field">
            <label style="font-weight:700;font-size:11.5px;">توجيه الطباعة الافتراضي (Rotation):</label>
            <select id="prnBarcodeMaintRotation">
              <option value="0" ${(b.rotation==0||b.rotation==null)?'selected':''}>0° طبيعي (Portrait / Landscape الأصلي)</option>
              <option value="90" ${b.rotation==90?'selected':''}>90° تدوير ربع دورة</option>
              <option value="180" ${b.rotation==180?'selected':''}>180° تدوير معكوس</option>
              <option value="270" ${b.rotation==270?'selected':''}>270° تدوير ثلاثة أرباع دورة</option>
            </select>
          </div>
        </div>

        <label style="font-weight:800;font-size:11.5px;margin-bottom:6px;display:block;">الحقول الافتراضية المعروضة على ملصق الصيانة:</label>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:8px;">
          <label class="checkbox-row" style="font-size:12px;">
            <input type="checkbox" id="prnBarcodeMaintShowShop" ${b.showShopName!==false?'checked':''}>
            <span>اسم المحل / المركز</span>
          </label>
          <label class="checkbox-row" style="font-size:12px;">
            <input type="checkbox" id="prnBarcodeMaintShowCustomer" ${b.showCustomerName!==false?'checked':''}>
            <span>اسم العميل</span>
          </label>
          <label class="checkbox-row" style="font-size:12px;">
            <input type="checkbox" id="prnBarcodeMaintShowPhone" ${b.showPhone!==false?'checked':''}>
            <span>رقم الهاتف</span>
          </label>
          <label class="checkbox-row" style="font-size:12px;">
            <input type="checkbox" id="prnBarcodeMaintShowDevice" ${b.showDevice!==false?'checked':''}>
            <span>الجهاز والموديل</span>
          </label>
          <label class="checkbox-row" style="font-size:12px;">
            <input type="checkbox" id="prnBarcodeMaintShowPassword" ${b.showPassword!==false?'checked':''}>
            <span>كلمة السر / النمط</span>
          </label>
          <label class="checkbox-row" style="font-size:12px;">
            <input type="checkbox" id="prnBarcodeMaintShowFaults" ${b.showFaults!==false?'checked':''}>
            <span>الشكوى والعطل</span>
          </label>
          <label class="checkbox-row" style="font-size:12px;">
            <input type="checkbox" id="prnBarcodeMaintShowPrice" ${b.showPrice===true?'checked':''}>
            <span>التكلفة / المتبقي</span>
          </label>
          <label class="checkbox-row" style="font-size:12px;">
            <input type="checkbox" id="prnBarcodeMaintShowDate" ${b.showDate!==false?'checked':''}>
            <span>تاريخ ووقت الاستلام</span>
          </label>
          <label class="checkbox-row" style="font-size:12px;">
            <input type="checkbox" id="prnBarcodeMaintShowBorder" ${b.showBorder===true?'checked':''}>
            <span>إطار حدودي خارجي</span>
          </label>
        </div>
      </div>
    </div>

    <!-- 3. Laser / Standard Office Printer Detailed Config -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="margin:0;font-size:15.5px;">3. طابعة الليزر والمستندات الرسمية (Laser / Inkjet A4 & A5)</h3>
        <button class="btn btn-ghost btn-xs test-laser-print-btn" style="color:var(--green-text);">${getSvgIcon("printer", 13)} تجربة الطباعة</button>
      </div>

      <div class="grid2" style="margin-bottom:12px;">
        <div class="field">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <label style="margin:0;font-weight:800;">اختر طابعة الليزر المعرفة في ويندوز (Windows Printer Menu)</label>
            <button type="button" class="btn btn-ghost btn-xs toggle-custom-prn-btn" data-target="Laser" style="font-size:11px;color:var(--green-text);padding:1px 6px;">${getSvgIcon("plus", 11)} إضافة اسم طابعة يدوي</button>
          </div>
          <select id="prnLaserSelect" class="prn-dropdown-select" data-target="Laser">
            ${buildPrinterSelectHtml('laser', l.name)}
          </select>
          <div id="prnLaserCustomWrap" style="display:none;margin-top:6px;">
            <input id="prnLaserNameCustom" value="${escapeHtml(l.name||'')}" placeholder="اكتب اسم طابعة الليزر كما يظهر في Control Panel / Windows Settings...">
          </div>
        </div>
        <div class="field">
          <label>مقاس وتنسيق إيصال الصيانة والضمان</label>
          <select id="prnLaserMaintSize">
            <option value="A5" ${l.maintenanceReceiptSize==='A5'?'selected':''}>A5 بالعرض Landscape (ورقة واحدة فقط مدمجة وشاملة للضمان والشروط)</option>
            <option value="A4" ${l.maintenanceReceiptSize==='A4'?'selected':''}>A4 بالطول Portrait</option>
          </select>
        </div>
      </div>

      <div class="grid2" style="margin-bottom:12px;">
        <div class="field">
          <label>مقاس ورق الفواتير الضريبية وعروض الأسعار</label>
          <select id="prnLaserInvoiceSize">
            <option value="A4" ${l.invoiceSize==='A4'?'selected':''}>A4 بالطول Portrait (النموذج الضريبي المعتمد)</option>
            <option value="A5" ${l.invoiceSize==='A5'?'selected':''}>A5 مدمج</option>
          </select>
        </div>
        <div class="field">
          <label>توزيع ملصقات الباركود على ورق A4 في الطابعة العادية</label>
          <select id="prnLaserBarcodeLayout">
            <option value="30" ${l.barcodeSheetLayout==='30'?'selected':''}>30 ملصق في الصفحة A4 (3 أعمدة × 10 صفوف)</option>
            <option value="24" ${l.barcodeSheetLayout==='24'?'selected':''}>24 ملصق في الصفحة A4 (3 أعمدة × 8 صفوف)</option>
            <option value="40" ${l.barcodeSheetLayout==='40'?'selected':''}>40 ملصق في الصفحة A4 (4 أعمدة × 10 صفوف)</option>
            <option value="65" ${l.barcodeSheetLayout==='65'?'selected':''}>65 ملصق في الصفحة A4 (5 أعمدة × 13 صفوف)</option>
          </select>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:10px;">
        <label class="checkbox-row" style="font-size:12.5px;">
          <input type="checkbox" id="prnLaserShowTerms" ${l.showTerms!==false?'checked':''}>
          <span>طباعة بنود الضمان والشروط القانونية أسفل المستند</span>
        </label>
        <label class="checkbox-row" style="font-size:12.5px;">
          <input type="checkbox" id="prnLaserShowWatermark" ${l.showWatermark!==false?'checked':''}>
          <span>إظهار ختم وعلامة مائية للمحل</span>
        </label>
      </div>
    </div>

    <!-- 4. Workflow to Printer Assignment Matrix -->
    <div class="card">
      <h3 style="margin-top:0;font-size:15.5px;">4. مصفوفة توجيه العمليات للطابعات (Workflow-to-Printer Assignment)</h3>
      <p style="font-size:12px;color:var(--ink-secondary);margin-bottom:12px;">اختر الطابعة المستهدفة تلقائياً لكل عملية ومستند داخل النظام:</p>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="text-align:right;">نوع العملية والمستند</th>
              <th style="text-align:right;">المقاس المطلوب</th>
              <th style="text-align:right;">الطابعة الموجه إليها</th>
              <th style="text-align:center;">إجراء تجريبي</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>إيصالات مبيعات نقطة البيع (POS Cashier)</b></td>
              <td><span class="status-badge st-done">80mm Roll</span></td>
              <td>
                <select class="workflow-prn-sel" data-wf="posSale" style="padding:4px 8px;font-size:12px;">
                  <option value="receiptPrinter" ${w.posSale==='receiptPrinter'?'selected':''}>طابعة الريسيت (Xprinter 808)</option>
                  <option value="laserPrinter" ${w.posSale==='laserPrinter'?'selected':''}>طابعة الليزر (A4/A5)</option>
                </select>
              </td>
              <td style="text-align:center;"><button class="btn btn-ghost btn-xs test-receipt-print-btn">${getSvgIcon("printer", 12)} بون</button></td>
            </tr>
            <tr>
              <td><b>إيصال استلام وضمان الصيانة للعميل</b></td>
              <td><span class="status-badge st-repair">A5 ورقة واحدة</span></td>
              <td>
                <select class="workflow-prn-sel" data-wf="maintenanceReceipt" style="padding:4px 8px;font-size:12px;">
                  <option value="laserPrinter" ${w.maintenanceReceipt==='laserPrinter'?'selected':''}>طابعة الليزر العادية (A5)</option>
                  <option value="receiptPrinter" ${w.maintenanceReceipt==='receiptPrinter'?'selected':''}>طابعة الريسيت الحراري (80mm)</option>
                </select>
              </td>
              <td style="text-align:center;"><button class="btn btn-ghost btn-xs test-laser-print-btn">${getSvgIcon("printer", 12)} A5</button></td>
            </tr>
            <tr>
              <td><b>الفواتير الضريبية وعروض الأسعار</b></td>
              <td><span class="status-badge st-check">A4 Portrait</span></td>
              <td>
                <select class="workflow-prn-sel" data-wf="taxInvoice" style="padding:4px 8px;font-size:12px;">
                  <option value="laserPrinter" ${w.taxInvoice==='laserPrinter'?'selected':''}>طابعة الليزر العادية (A4)</option>
                </select>
              </td>
              <td style="text-align:center;"><button class="btn btn-ghost btn-xs test-laser-print-btn">${getSvgIcon("printer", 12)} A4</button></td>
            </tr>
            <tr>
              <td><b>ملصق باركود صنف فردي أو جهاز صيانة</b></td>
              <td><span class="status-badge st-repair">50x30mm ملصق</span></td>
              <td>
                <select class="workflow-prn-sel" data-wf="singleBarcode" style="padding:4px 8px;font-size:12px;">
                  <option value="barcodePrinter" ${w.singleBarcode==='barcodePrinter'?'selected':''}>طابعة ملصقات الباركود الحرارية</option>
                  <option value="laserPrinter" ${w.singleBarcode==='laserPrinter'?'selected':''}>طابعة الليزر (ورق A4 مجمع)</option>
                </select>
              </td>
              <td style="text-align:center;"><button class="btn btn-ghost btn-xs test-barcode-print-btn">${getSvgIcon("printer", 12)} باركود</button></td>
            </tr>
            <tr>
              <td><b>دفاتر اليومية وكشوف الحسابات وميزان المراجعة</b></td>
              <td><span class="status-badge st-done">A4 Portrait</span></td>
              <td>
                <select class="workflow-prn-sel" data-wf="financialReports" style="padding:4px 8px;font-size:12px;">
                  <option value="laserPrinter" ${w.financialReports==='laserPrinter'?'selected':''}>طابعة الليزر العادية (A4)</option>
                </select>
              </td>
              <td style="text-align:center;"><button class="btn btn-ghost btn-xs test-laser-print-btn">${getSvgIcon("printer", 12)} تقرير</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="text-align:left;margin-top:16px;border-top:1px solid var(--line);padding-top:12px;">
        <button class="btn btn-primary" id="saveAllPrintersSettingsBtn" style="padding:9px 24px;font-weight:900;">
          ${getSvgIcon("check", 14)} حفظ وتطبيق كافة إعدادات وتخصيص الطابعات
        </button>
      </div>
    </div>
  `;

  attachSettingsQuickTabEvents(main);
  attachPrintersSettingsEvents(main);
}

function attachPrintersSettingsEvents(main){
  // Toggle custom input when select changes or button clicked
  ['Receipt', 'Barcode', 'Laser'].forEach(target => {
    const sel = document.getElementById(`prn${target}Select`);
    const wrap = document.getElementById(`prn${target}CustomWrap`);
    const inp = document.getElementById(`prn${target}NameCustom`);
    if(sel && wrap){
      sel.onchange = ()=>{
        if(sel.value === '__custom__'){
          wrap.style.display = 'block';
          if(inp) inp.focus();
        } else {
          wrap.style.display = 'none';
        }
      };
    }
  });

  main.querySelectorAll('.toggle-custom-prn-btn').forEach(btn => {
    btn.onclick = ()=>{
      const target = btn.dataset.target;
      const wrap = document.getElementById(`prn${target}CustomWrap`);
      const sel = document.getElementById(`prn${target}Select`);
      const inp = document.getElementById(`prn${target}NameCustom`);
      if(wrap){
        const isHidden = wrap.style.display === 'none';
        wrap.style.display = isHidden ? 'block' : 'none';
        if(isHidden){
          if(sel) sel.value = '__custom__';
          if(inp) inp.focus();
        }
      }
    };
  });

  // Windows Printers Auto Detection
  const detectBtn = document.getElementById('detectWindowsPrintersBtn');
  if(detectBtn){
    detectBtn.onclick = async ()=>{
      detectBtn.disabled = true;
      detectBtn.innerHTML = 'جاري الفحص...';
      await detectWindowsPrinters(true);
      detectBtn.disabled = false;
      renderPrintersSettings(main);
    };
  }

  // Attach test print buttons
  main.querySelectorAll('.test-receipt-print-btn').forEach(btn => {
    btn.onclick = ()=>executeTestReceiptPrint();
  });
  main.querySelectorAll('.test-barcode-print-btn').forEach(btn => {
    btn.onclick = ()=>executeTestBarcodePrint();
  });
  main.querySelectorAll('.test-maint-sticker-btn').forEach(btn => {
    btn.onclick = ()=>executeTestMaintStickerPrint();
  });
  main.querySelectorAll('.test-laser-print-btn').forEach(btn => {
    btn.onclick = ()=>executeTestLaserPrint();
  });

  // Helper to extract chosen printer name
  function getChosenPrinterName(target, category){
    const sel = document.getElementById(`prn${target}Select`);
    const customInp = document.getElementById(`prn${target}NameCustom`);
    let finalName = '';
    if(sel && sel.value !== '__custom__'){
      finalName = sel.value.trim();
    } else if(customInp && customInp.value.trim()){
      finalName = customInp.value.trim();
      // Add custom name to known Windows printers list if not already present
      const known = getKnownWindowsPrinters();
      if(!known.some(p => p.name.trim().toLowerCase() === finalName.toLowerCase())){
        known.push({ name: finalName, category: category.toLowerCase() });
        state.settings.knownWindowsPrinters = known;
      }
    }
    return finalName || (target === 'Receipt' ? 'Xprinter XP-808 (Thermal 80mm Receipt)' : (target === 'Barcode' ? 'Xprinter XP-365B (Thermal Barcode Label)' : 'HP LaserJet Pro (Laser A4/A5)'));
  }

  // Save buttons
  const handleSavePrinters = async ()=>{
    const prn = getPrintersSettings();

    // 1. Receipt
    prn.receiptPrinter.name = getChosenPrinterName('Receipt', 'receipt');
    prn.receiptPrinter.paperSize = document.getElementById('prnReceiptSize').value;
    prn.receiptPrinter.fontScale = document.getElementById('prnReceiptFontScale').value;
    prn.receiptPrinter.cutterFeedMm = Number(document.getElementById('prnReceiptCutterFeed').value) || 10;
    prn.receiptPrinter.footerText = document.getElementById('prnReceiptFooter').value.trim();
    prn.receiptPrinter.autoPrint = document.getElementById('prnReceiptAutoPrint').checked;
    prn.receiptPrinter.showLogo = document.getElementById('prnReceiptShowLogo').checked;
    prn.receiptPrinter.showCashier = document.getElementById('prnReceiptShowCashier').checked;
    prn.receiptPrinter.printBarcode = document.getElementById('prnReceiptPrintBarcode').checked;

    // Synchronize with POS settings
    if(!state.settings.pos) state.settings.pos = {};
    state.settings.pos.receiptPaperSize = prn.receiptPrinter.paperSize;
    state.settings.pos.receiptFooter = prn.receiptPrinter.footerText;
    state.settings.pos.autoPrintReceipt = prn.receiptPrinter.autoPrint;
    state.settings.pos.showCashierName = prn.receiptPrinter.showCashier;
    state.settings.pos.showLogoOnReceipt = prn.receiptPrinter.showLogo;

    // 2. Barcode
    prn.barcodePrinter.name = getChosenPrinterName('Barcode', 'barcode');
    prn.barcodePrinter.defaultSize = document.getElementById('prnBarcodeDefaultSize').value;
    prn.barcodePrinter.barcodeType = document.getElementById('prnBarcodeType').value;
    prn.barcodePrinter.defaultCopies = Number(document.getElementById('prnBarcodeDefaultCopies').value) || 1;
    prn.barcodePrinter.showPrice = document.getElementById('prnBarcodeShowPrice').checked;
    prn.barcodePrinter.showShopName = document.getElementById('prnBarcodeShowShopName').checked;
    prn.barcodePrinter.showDate = document.getElementById('prnBarcodeShowDate').checked;
    prn.barcodePrinter.kioskMode = document.getElementById('prnBarcodeKioskMode') ? document.getElementById('prnBarcodeKioskMode').checked : true;
    prn.barcodePrinter.offsetX = Number(document.getElementById('prnBarcodeOffsetX') ? document.getElementById('prnBarcodeOffsetX').value : 0) || 0;
    prn.barcodePrinter.offsetY = Number(document.getElementById('prnBarcodeOffsetY') ? document.getElementById('prnBarcodeOffsetY').value : 0) || 0;

    // Maintenance sticker specific settings
    const maintModeSel = document.getElementById('prnBarcodeMaintMode');
    if(maintModeSel) prn.barcodePrinter.barcodeMode = maintModeSel.value;
    const maintRotSel = document.getElementById('prnBarcodeMaintRotation');
    if(maintRotSel) prn.barcodePrinter.rotation = Number(maintRotSel.value) || 0;
    if(document.getElementById('prnBarcodeMaintShowShop')) prn.barcodePrinter.showShopName = document.getElementById('prnBarcodeMaintShowShop').checked;
    if(document.getElementById('prnBarcodeMaintShowCustomer')) prn.barcodePrinter.showCustomerName = document.getElementById('prnBarcodeMaintShowCustomer').checked;
    if(document.getElementById('prnBarcodeMaintShowPhone')) prn.barcodePrinter.showPhone = document.getElementById('prnBarcodeMaintShowPhone').checked;
    if(document.getElementById('prnBarcodeMaintShowDevice')) prn.barcodePrinter.showDevice = document.getElementById('prnBarcodeMaintShowDevice').checked;
    if(document.getElementById('prnBarcodeMaintShowPassword')) prn.barcodePrinter.showPassword = document.getElementById('prnBarcodeMaintShowPassword').checked;
    if(document.getElementById('prnBarcodeMaintShowFaults')) prn.barcodePrinter.showFaults = document.getElementById('prnBarcodeMaintShowFaults').checked;
    if(document.getElementById('prnBarcodeMaintShowPrice')) prn.barcodePrinter.showPrice = document.getElementById('prnBarcodeMaintShowPrice').checked;
    if(document.getElementById('prnBarcodeMaintShowDate')) prn.barcodePrinter.showDate = document.getElementById('prnBarcodeMaintShowDate').checked;
    if(document.getElementById('prnBarcodeMaintShowBorder')) prn.barcodePrinter.showBorder = document.getElementById('prnBarcodeMaintShowBorder').checked;

    // 3. Laser
    prn.laserPrinter.name = getChosenPrinterName('Laser', 'laser');
    prn.laserPrinter.maintenanceReceiptSize = document.getElementById('prnLaserMaintSize').value;
    prn.laserPrinter.invoiceSize = document.getElementById('prnLaserInvoiceSize').value;
    prn.laserPrinter.barcodeSheetLayout = document.getElementById('prnLaserBarcodeLayout').value;
    prn.laserPrinter.showTerms = document.getElementById('prnLaserShowTerms').checked;
    prn.laserPrinter.showWatermark = document.getElementById('prnLaserShowWatermark').checked;

    // 4. Workflow assignments
    main.querySelectorAll('.workflow-prn-sel').forEach(sel => {
      const wf = sel.dataset.wf;
      if(wf) prn.workflowAssignments[wf] = sel.value;
    });

    state.settings.printers = prn;
    setCache('settings', state.settings);

    try {
      localStorage.setItem('microerp_printers_settings', JSON.stringify(prn));
      localStorage.setItem('microerp_known_printers', JSON.stringify(getKnownWindowsPrinters()));
    } catch(e){}

    try {
      await saveSettingRemote('printers', JSON.stringify(prn));
      await saveSettingRemote('pos', JSON.stringify(state.settings.pos));
      await saveSettingRemote('knownWindowsPrinters', JSON.stringify(getKnownWindowsPrinters()));
      showToast('تم حفظ وتطبيق كافة إعدادات وأسماء الطابعات بنجاح', 'success');
    } catch(e) {
      showToast('تم حفظ إعدادات وأسماء الطابعات محلياً بنجاح', 'success');
    }
    renderPrintersSettings(main);
  };

  const saveBtn = document.getElementById('saveAllPrintersSettingsBtn');
  if(saveBtn) saveBtn.onclick = handleSavePrinters;
  const saveTopBtn = document.getElementById('saveAllPrintersSettingsBtnTop');
  if(saveTopBtn) saveTopBtn.onclick = handleSavePrinters;
}

/* --- Printer Test Execution Engines --- */
function executeTestReceiptPrint(){
  const sampleSale = {
    ID: 'sale_test_808',
    Date: new Date().toISOString().slice(0, 10),
    CustomerName: 'عميل تجربة الطباعة (Xprinter 808)',
    CustomerPhone: '01012345678',
    PaymentMethod: 'نقدي (كاش)',
    Total: 350,
    AmountPaid: 400
  };
  const sampleItems = [
    { name: 'كابل شحن سريع Type-C أصلي معتمد', qty: 1, price: 150 },
    { name: 'شاحن جداري 45 واط سوبر فاست PD', qty: 1, price: 200 }
  ];
  openSalePrint(sampleSale, sampleItems, {
    subtotal: 350,
    discountAmount: 0,
    taxAmount: 0,
    grandTotal: 350,
    paidAmount: 400,
    changeDue: 50,
    payMethodName: 'نقدي (كاش)'
  });
}

function executeTestBarcodePrint(){
  const sampleItem = {
    ID: 'inv_test_barcode',
    Name: 'سماعة رأس بلوتوث محيطية Pro',
    Category: 'إكسسوار',
    Barcode: '2026889901',
    SellPrice: 350,
    PurchasePrice: 250,
    SKU: 'STK-8899'
  };
  openProductBarcodeSticker(sampleItem);
}

function executeTestMaintStickerPrint(){
  const sampleReceipt = {
    id: 'rec_sample_test',
    receiptNumber: 'MT-2026-0001',
    date: new Date().toISOString().slice(0, 10),
    time: '14:30',
    customer: { name: 'أحمد محمود التميمي', phone: '01098765432' },
    device: { category: 'موبايل', brand: 'سامسونج', model: 'Galaxy S23 Ultra', password: 'Pattern 1-2-5' },
    faults: ['تغيير شاشة أصلية', 'فحص سوكيت الشحن'],
    cost: 1200,
    deposit: 200,
    status: 'check'
  };
  openStickerPrint(sampleReceipt, true);
}

function executeTestLaserPrint(){
  const oldMount = document.getElementById('printMount');
  if(oldMount) oldMount.remove();
  const oldA5 = document.getElementById('dynamicA5ReceiptStyle');
  if(oldA5) oldA5.remove();
  const oldThermal = document.getElementById('dynamicThermalReceiptStyle');
  if(oldThermal) oldThermal.remove();

  const laserStyle = document.createElement('style');
  laserStyle.id = 'dynamicLaserTestStyle';
  laserStyle.innerHTML = `
    @media print {
      @page {
        size: A4 portrait !important;
        margin: 10mm !important;
      }
      body.printing-voucher {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
      }
      body.printing-voucher #printMount {
        width: 100% !important;
        margin: 0 auto !important;
      }
    }
  `;
  document.head.appendChild(laserStyle);

  const shopName = (state.settings && state.settings.shopName) || 'صيانة ميكروتك';
  const shopPhone = (state.settings && state.settings.shopPhone) || '01000000000';
  const shopAddress = (state.settings && state.settings.shopAddress) || 'الفرع الرئيسي';

  const mount = document.createElement('div');
  mount.id = 'printMount';

  mount.innerHTML = `
    <div style="background:#fff;color:#000;padding:10mm 8mm;width:100%;max-width:190mm;min-height:140mm;margin:0 auto;box-sizing:border-box;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;text-align:right;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:14px;">
        <div>
          <h2 style="margin:0;font-size:22px;font-weight:900;">${escapeHtml(shopName)}</h2>
          <div style="font-size:12.5px;font-weight:700;margin-top:2px;">الهاتف: ${escapeHtml(shopPhone)} | العنوان: ${escapeHtml(shopAddress)}</div>
        </div>
        <div style="text-align:left;">
          <div style="display:inline-block;border:2px solid #000;padding:6px 14px;border-radius:6px;font-weight:900;font-size:14px;">
            صفحة اختبار طابعة الليزر A4 / A5
          </div>
          <div style="font-size:11px;font-weight:700;margin-top:4px;" class="mono">${cleanDate(new Date())}</div>
        </div>
      </div>

      <div style="border:1.5px solid #000;border-radius:6px;padding:14px;margin-bottom:14px;background:#fcfcfc;">
        <h4 style="margin:0 0 8px;font-size:14.5px;">نجاح اختبار الطباعة والتوافق مع طابعة الليزر (Laser Printer Test):</h4>
        <p style="margin:0;font-size:12.5px;line-height:1.7;">
          هذه الصفحة النموذجية تؤكد أن طابعة الليزر العادية (Laser / Office Printer) متوافقة تماماً مع طباعة إيصالات الصيانة والضمان بمقاس <b>A5 Landscape (ورقة واحدة مدمجة)</b>، وكذلك طباعة <b>الفواتير الضريبية وعروض الأسعار بمقاس A4</b> وتقارير الحسابات بدقة ووضوح عالي.
        </p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:12.5px;">
        <thead>
          <tr style="background:#000;color:#fff;">
            <th style="padding:6px;border:1px solid #000;text-align:right;">المستند المستهدف</th>
            <th style="padding:6px;border:1px solid #000;text-align:center;">المقاس المطلوب</th>
            <th style="padding:6px;border:1px solid #000;text-align:center;">التوجيه</th>
            <th style="padding:6px;border:1px solid #000;text-align:center;">حالة التوافق</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:6px;border:1px solid #000;">إيصال استلام وضمان الصيانة</td>
            <td style="padding:6px;border:1px solid #000;text-align:center;" class="mono">A5 (210×148mm)</td>
            <td style="padding:6px;border:1px solid #000;text-align:center;">بالعرض Landscape</td>
            <td style="padding:6px;border:1px solid #000;text-align:center;font-weight:bold;">متوافق بنسبة 100%</td>
          </tr>
          <tr>
            <td style="padding:6px;border:1px solid #000;">الفواتير الضريبية وعروض الأسعار</td>
            <td style="padding:6px;border:1px solid #000;text-align:center;" class="mono">A4 (210×297mm)</td>
            <td style="padding:6px;border:1px solid #000;text-align:center;">بالطول Portrait</td>
            <td style="padding:6px;border:1px solid #000;text-align:center;font-weight:bold;">متوافق بنسبة 100%</td>
          </tr>
          <tr>
            <td style="padding:6px;border:1px solid #000;">دفتر اليومية وكشوف الحسابات والميزان</td>
            <td style="padding:6px;border:1px solid #000;text-align:center;" class="mono">A4 (210×297mm)</td>
            <td style="padding:6px;border:1px solid #000;text-align:center;">بالطول Portrait</td>
            <td style="padding:6px;border:1px solid #000;text-align:center;font-weight:bold;">متوافق بنسبة 100%</td>
          </tr>
        </tbody>
      </table>

      <div style="border-top:1.5px dashed #000;padding-top:10px;display:flex;justify-content:space-between;align-items:center;font-size:11.5px;font-weight:700;">
        <span>نظام ميكروERP لإدارة المبيعات والصيانة والمخازن</span>
        <span class="mono">Laser Print Alignment Passed</span>
      </div>
    </div>
  `;

  document.body.appendChild(mount);
  document.body.classList.add('printing-voucher');

  const cleanupLaser = ()=>{
    if(mount && mount.parentNode) mount.remove();
    document.body.classList.remove('printing-voucher');
    if(laserStyle && laserStyle.parentNode) laserStyle.remove();
    window.removeEventListener('afterprint', cleanupLaser);
  };
  window.addEventListener('afterprint', cleanupLaser);

  setTimeout(()=>{
    window.print();
    setTimeout(cleanupLaser, 800);
  }, 150);
}

/* 4. POS & Cashier Settings (إعدادات نقطة البيع وخيارات الدفع) */