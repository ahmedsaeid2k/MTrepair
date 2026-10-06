/* ---------------- Enterprise Settings & Customization Center ---------------- */
function renderSettingsSectionApp(app){
  if(!state.user || state.user.role !== 'admin'){
    try {
      recordAuditLog('محاولة وصول محظورة', 'settings', `المستخدم (${state.user ? state.user.name : 'مجهول'}) حاول الدخول إلى قسم الإعدادات المتاح حصراً للمدير العام`, '', 'محظور');
    } catch(e){}
    showToast('قسم الإعدادات متاح حصراً لمدير النظام العام', 'error');
    state.currentSection = null;
    return render();
  }
  const activeTab = state.settingsTab || 'appearance';
  app.innerHTML = `
    <div class="sidebar">
      ${brandHtml("مركز الإعدادات")}
      ${sectionSwitcherHtml()}
      <div class="sidebar-nav-wrap">
        <div class="nav-section">إعدادات وتخصيص النظام</div>
        <div class="nav-item ${activeTab==='appearance'?'active':''}" data-stab="appearance">
          <span class="nav-item-icon">${getSvgIcon("palette", 16)}</span><span>المظهر والثيمات والخط</span>
        </div>
        <div class="nav-item ${activeTab==='company'?'active':''}" data-stab="company">
          <span class="nav-item-icon">${getSvgIcon("store", 16)}</span><span>بيانات الشركة والمطبوعات</span>
        </div>
        <div class="nav-item ${activeTab==='printers'?'active':''}" data-stab="printers">
          <span class="nav-item-icon">${getSvgIcon("printer", 16)}</span><span>تخصيص وإعدادات الطابعات</span>
        </div>
        <div class="nav-item ${activeTab==='pos'?'active':''}" data-stab="pos">
          <span class="nav-item-icon">${getSvgIcon("pos", 16)}</span><span>نقطة البيع وخيارات الدفع</span>
        </div>
        <div class="nav-item ${activeTab==='whatsapp'?'active':''}" data-stab="whatsapp">
          <span class="nav-item-icon">${getSvgIcon("message", 16)}</span><span>رسائل واتساب الذكية</span>
        </div>
        <div class="nav-item ${activeTab==='warranty'?'active':''}" data-stab="warranty">
          <span class="nav-item-icon">${getSvgIcon("shield", 16)}</span><span>بنود الضمان والشروط</span>
        </div>
        <div class="nav-item ${activeTab==='devices'?'active':''}" data-stab="devices">
          <span class="nav-item-icon">${getSvgIcon("tool", 16)}</span><span>تصنيفات وماركات الأجهزة</span>
        </div>
        <div class="nav-item ${activeTab==='faults'?'active':''}" data-stab="faults">
          <span class="nav-item-icon">${getSvgIcon("users", 16)}</span><span>الأعطال والفنيين</span>
        </div>
        <div class="nav-item ${activeTab==='ai'?'active':''}" data-stab="ai">
          <span class="nav-item-icon">${getSvgIcon("chart", 16)}</span><span>الذكاء الاصطناعي (Gemini)</span>
        </div>
        <div class="nav-item ${activeTab==='sync'?'active':''}" data-stab="sync">
          <span class="nav-item-icon">${getSvgIcon("refresh", 16)}</span><span>المزامنة السحابية والكاش</span>
        </div>
        <div class="nav-item ${activeTab==='backup'?'active':''}" data-stab="backup">
          <span class="nav-item-icon">${getSvgIcon("download", 16)}</span><span>النسخ الاحتياطي والاستعادة</span>
        </div>
      </div>
      ${sidebarFootHtml()}
    </div>
    <main id="main"></main>
  `;
  const sw = document.getElementById('switchSectionBtn');
  if(sw) sw.onclick = ()=>{ state.currentSection = null; render(); };
  attachSidebarHandlers();

  app.querySelectorAll('[data-stab]').forEach(item => {
    item.onclick = ()=>{
      state.settingsTab = item.dataset.stab;
      renderSettingsSectionApp(app);
    };
  });

  renderSettingsContent(document.getElementById('main'));
}

function renderSettings(main){
  renderSettingsContent(main);
}

function renderSettingsNavHeader(activeTabTitle, activeTabSubtitle){
  const activeTab = state.settingsTab || 'appearance';
  const tabs = [
    {k:'appearance', label:'المظهر والثيمات'},
    {k:'company', label:'بيانات الشركة'},
    {k:'printers', label:'تخصيص الطابعات'},
    {k:'pos', label:'نقطة البيع والدفع'},
    {k:'whatsapp', label:'رسائل واتساب'},
    {k:'warranty', label:'بنود الضمان'},
    {k:'devices', label:'تصنيفات الأجهزة'},
    {k:'faults', label:'الأعطال والفنيين'},
    {k:'ai', label:'الذكاء الاصطناعي'},
    {k:'sync', label:'المزامنة السحابية'},
    {k:'backup', label:'النسخ الاحتياطي والاستعادة'}
  ];

  return `
    <div class="top-header">
      <div>
        <h2 class="page-title">${activeTabTitle}</h2>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" onclick="openCommandPalette()">بحث ⌘K</button>
        <div id="networkSyncPill" class="sync-pill online" onclick="syncOfflineQueue(true)">متصل</div>
      </div>
    </div>
    <div class="chip-group" style="margin-bottom:18px;background:var(--paper2);padding:10px 14px;border-radius:var(--radius);border:1px solid var(--line);">
      ${tabs.map(t=>`
        <div class="chip ${t.k===activeTab?'sel':''}" data-settings-quick-tab="${t.k}">
          ${t.label}
        </div>
      `).join('')}
    </div>
  `;
}

function attachSettingsQuickTabEvents(main){
  main.querySelectorAll('[data-settings-quick-tab]').forEach(chip => {
    chip.onclick = ()=>{
      state.settingsTab = chip.dataset.settingsQuickTab;
      const app = document.getElementById('app');
      if(state.currentSection === 'settings') renderSettingsSectionApp(app);
      else renderSettingsContent(main);
    };
  });
}

function renderSettingsContent(main){
  const activeTab = state.settingsTab || 'appearance';
  if(activeTab === 'appearance') return renderAppearanceSettings(main);
  if(activeTab === 'company') return renderCompanySettings(main);
  if(activeTab === 'printers') return renderPrintersSettings(main);
  if(activeTab === 'pos') return renderPosSettings(main);
  if(activeTab === 'whatsapp') return renderWhatsappSettings(main);
  if(activeTab === 'warranty') return renderWarrantySettings(main);
  if(activeTab === 'devices') return renderDevicesSettings(main);
  if(activeTab === 'faults') return renderFaultsSettings(main);
  if(activeTab === 'ai') return renderAiSettings(main);
  if(activeTab === 'sync') return renderSyncSettings(main);
  if(activeTab === 'backup') return renderBackupRestoreSettings(main);
  renderAppearanceSettings(main);
}

/* 1. Appearance, Themes, Font Sizes, Colors */
function renderAppearanceSettings(main){
  const currentTheme = state.theme || 'light';
  const currentPrimary = (state.settings && state.settings.primaryColor) || '#059669';
  const currentFontSize = (state.settings && state.settings.fontSize) || 'normal';

  const colorPalettes = [
    {name: 'زمردي العصري (Emerald)', hex: '#059669'},
    {name: 'نيلي ملكي (Indigo)', hex: '#4f46e5'},
    {name: 'أزرق سماوي (Ocean)', hex: '#2563eb'},
    {name: 'كهرماني ذهبي (Amber)', hex: '#d97706'},
    {name: 'ياقوتي أحمر (Crimson)', hex: '#e11d48'},
    {name: 'بنفسجي فاخر (Purple)', hex: '#8b5cf6'},
    {name: 'سيان تقني (Cyan)', hex: '#06b6d4'}
  ];

  main.innerHTML = `
    ${renderSettingsNavHeader('تخصيص المظهر والثيمات والخطوط', 'تعديل لون الواجهة المميز، وضع الإضاءة، وحجم الخطوط لكافة الشاشات')}

    <!-- Theme Selection -->
    <div class="card">
      <h3 style="margin-top:0;font-size:15.5px;">نمط إضاءة الواجهة (Themes)</h3>
      <p style="font-size:12.5px;color:var(--ink-secondary);margin-bottom:14px;">اختر النمط المفضل لبيئة عملك:</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:14px;">
        <div id="themeCardLight" style="cursor:pointer;border:2px solid ${currentTheme==='light'?'var(--primary)':'var(--line)'};background:#ffffff;color:#0f172a;padding:16px;border-radius:var(--radius);box-shadow:var(--card-shadow);transition:all 0.2s ease;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <b style="font-size:14px;">المظهر الفاتح (Light Mode)</b>
            ${currentTheme==='light'?'<span class="status-badge st-done">مفعل الآن</span>':''}
          </div>
          <div style="font-size:11.5px;color:#64748b;">واجهة ناصعة عالية التباين مثالية لأوقات النهار والطباعة.</div>
        </div>

        <div id="themeCardDark" style="cursor:pointer;border:2px solid ${currentTheme==='dark'?'var(--primary)':'var(--line)'};background:#0e1524;color:#f8fafc;padding:16px;border-radius:var(--radius);box-shadow:var(--card-shadow);transition:all 0.2s ease;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <b style="font-size:14px;">المظهر الليلي (Dark Obsidian)</b>
            ${currentTheme==='dark'?'<span class="status-badge st-done">مفعل الآن</span>':''}
          </div>
          <div style="font-size:11.5px;color:#94a3b8;">خلفيات سبجية داكنة وتأثيرات زجاجية مريحة جداً للعين.</div>
        </div>
      </div>
    </div>

    <!-- Theme Presets -->
    <div class="card">
      <h3 style="margin-top:0;font-size:15.5px;">إعدادات مسبقة للثيم (Theme Presets)</h3>
      <p style="font-size:12.5px;color:var(--ink-secondary);margin-bottom:14px;">اختر أحد الثيمات الجاهزة لتغيير الواجهة بسرعة:</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(220px, 1fr));gap:14px;">
        <div id="presetOdoo" style="cursor:pointer;border:2px solid ${state.settings && state.settings.appTheme==='odoo'?'var(--primary)':'var(--line)'};background:#1e293b;color:#f1f5f9;padding:16px;border-radius:var(--radius);box-shadow:var(--card-shadow);transition:all 0.2s ease;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <b style="font-size:14px;">Odoo (Dark)</b>
            ${state.settings && state.settings.appTheme==='odoo'?'<span class="status-badge st-done">مفعل الآن</span>':''}
          </div>
          <div style="font-size:11.5px;color:#c4b5fd;">ثيم أودو مع اللون البنفسجي المميز.</div>
        </div>
        <div id="presetApple" style="cursor:pointer;border:2px solid ${state.settings && state.settings.appTheme==='apple'?'var(--primary)':'var(--line)'};background:#f8fafc;color:#0f172a;padding:16px;border-radius:var(--radius);box-shadow:var(--card-shadow);transition:all 0.2s ease;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <b style="font-size:14px;">Apple (Light)</b>
            ${state.settings && state.settings.appTheme==='apple'?'<span class="status-badge st-done">مفعل الآن</span>':''}
          </div>
          <div style="font-size:11.5px;color:#007aff;">ثيم شفاف ونظيف يشبه نظام macOS.</div>
        </div>
        <div id="presetGlass" style="cursor:pointer;border:2px solid ${state.settings && state.settings.appTheme==='glass'?'var(--primary)':'var(--line)'};background:#e0f2fe;color:#0f172a;padding:16px;border-radius:var(--radius);box-shadow:var(--card-shadow);transition:all 0.2s ease;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <b style="font-size:14px;">Glass (Light)</b>
            ${state.settings && state.settings.appTheme==='glass'?'<span class="status-badge st-done">مفعل الآن</span>':''}
          </div>
          <div style="font-size:11.5px;color:#0284c7;">مظهر زجاجي مع خلفية شفافة خفيفة.</div>
        </div>
        <div id="presetWin11" style="cursor:pointer;border:2px solid ${state.settings && state.settings.appTheme==='win11'?'var(--primary)':'var(--line)'};background:#f1f5f9;color:#0f172a;padding:16px;border-radius:var(--radius);box-shadow:var(--card-shadow);transition:all 0.2s ease;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <b style="font-size:14px;">Windows 11 (Light)</b>
            ${state.settings && state.settings.appTheme==='win11'?'<span class="status-badge st-done">مفعل الآن</span>':''}
          </div>
          <div style="font-size:11.5px;color:#0078d7;">ثيم Windows 11 مع الألوان الرسمية.</div>
        </div>
      </div>
    </div>

    <!-- Primary Accent Color Picker -->
    <div class="card">
      <h3 style="margin-top:0;font-size:15.5px;">لون النظام المميز (Primary Accent Color)</h3>
      <p style="font-size:12.5px;color:var(--ink-secondary);margin-bottom:14px;">انقر على أي لون لتطبيقه فورياً على الأزرار والشارات والعناصر النشطة:</p>
      <div style="display:flex;flex-wrap:wrap;gap:12px;">
        ${colorPalettes.map(c => `
          <div class="accent-color-btn" data-color="${c.hex}" style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:var(--radius-sm);border:2px solid ${currentPrimary===c.hex?c.hex:'var(--line-strong)'};background:var(--paper2);cursor:pointer;box-shadow:var(--shadow-sm);transition:all 0.15s ease;">
            <span style="width:20px;height:20px;border-radius:50%;background:${c.hex};display:inline-block;box-shadow:0 2px 6px rgba(0,0,0,0.2);"></span>
            <span style="font-size:12px;font-weight:700;color:var(--ink);">${c.name}</span>
            ${currentPrimary===c.hex?getSvgIcon('check', 12):''}
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Font Size Options -->
    <div class="card">
      <h3 style="margin-top:0;font-size:15.5px;">حجم الخط العام للواجهة (Typography Scale)</h3>
      <p style="font-size:12.5px;color:var(--ink-secondary);margin-bottom:14px;">حدد مقاس الخط المريح لك على الشاشة:</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <label style="flex:1;min-width:180px;display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--paper2);border:1px solid var(--line-strong);border-radius:var(--radius-sm);cursor:pointer;">
          <input type="radio" name="appFontSize" value="compact" ${currentFontSize==='compact'?'checked':''} style="width:auto;">
          <div><b>مدمج (Compact - 13px)</b><div style="font-size:11px;color:var(--ink-secondary);">لعرض أقصى قدر من البيانات</div></div>
        </label>
        <label style="flex:1;min-width:180px;display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--paper2);border:1px solid var(--line-strong);border-radius:var(--radius-sm);cursor:pointer;">
          <input type="radio" name="appFontSize" value="normal" ${currentFontSize==='normal'?'checked':''} style="width:auto;">
          <div><b>قياسي (Normal - 14px)</b><div style="font-size:11px;color:var(--ink-secondary);">المقاس الافتراضي المتوازن</div></div>
        </label>
        <label style="flex:1;min-width:180px;display:flex;align-items:center;gap:10px;padding:12px 16px;background:var(--paper2);border:1px solid var(--line-strong);border-radius:var(--radius-sm);cursor:pointer;">
          <input type="radio" name="appFontSize" value="large" ${currentFontSize==='large'?'checked':''} style="width:auto;">
          <div><b>كبير ومريح (Large - 15.5px)</b><div style="font-size:11px;color:var(--ink-secondary);">قراءة فائقة الوضوح والراحة</div></div>
        </label>
      </div>
    </div>

    <!-- Live Interactive Preview Box -->
    <div class="card" style="border:1px dashed var(--line-strong);background:var(--paper3);">
      <h3 style="margin-top:0;font-size:14px;">معاينة حية للمظهر والعناصر:</h3>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:10px;">
        <button class="btn btn-primary">زر رئيسي Primary</button>
        <button class="btn btn-ghost">زر افتراضي Ghost</button>
        <span class="status-badge st-check">قيد الفحص</span>
        <span class="status-badge st-done">مكتمل</span>
        <span class="status-badge st-delivered">تم التسليم</span>
        <span class="chip sel">شريحة مفعلة</span>
      </div>
    </div>
  `;

  attachSettingsQuickTabEvents(main);

  document.getElementById('themeCardLight').onclick = ()=>{
    if(state.settings) state.settings.appTheme = '';
    applyTheme('light');
    saveSettingRemote('theme', 'light');
    renderAppearanceSettings(main);
  };
  document.getElementById('themeCardDark').onclick = ()=>{
    if(state.settings) state.settings.appTheme = '';
    applyTheme('dark');
    saveSettingRemote('theme', 'dark');
    renderAppearanceSettings(main);
  };

  const applyPresetTheme = async (presetName, themeMode, primaryColor) => {
    if(!state.settings) state.settings = {};
    state.settings.appTheme = presetName;
    state.theme = themeMode;
    state.settings.primaryColor = primaryColor;
    setCache('settings', state.settings);
    applyThemeAndAppearance();
    try { await saveSettingRemote('appTheme', presetName); } catch(e){}
    try { await saveSettingRemote('primaryColor', primaryColor); } catch(e){}
    try { await saveSettingRemote('theme', themeMode); } catch(e){}
    showToast('تم تفعيل الثيم بنجاح', 'success');
    renderAppearanceSettings(main);
  };

  const pOdoo = document.getElementById('presetOdoo');
  if(pOdoo) pOdoo.onclick = () => applyPresetTheme('odoo', 'dark', '#4f46e5');

  const pApple = document.getElementById('presetApple');
  if(pApple) pApple.onclick = () => applyPresetTheme('apple', 'light', '#007aff');

  const pGlass = document.getElementById('presetGlass');
  if(pGlass) pGlass.onclick = () => applyPresetTheme('glass', 'light', '#0284c7');

  const pWin11 = document.getElementById('presetWin11');
  if(pWin11) pWin11.onclick = () => applyPresetTheme('win11', 'light', '#0078d7');

  main.querySelectorAll('.accent-color-btn').forEach(btn => {
    btn.onclick = async ()=>{
      const c = btn.dataset.color;
      state.settings.primaryColor = c;
      setCache('settings', state.settings);
      applyThemeAndAppearance();
      await saveSettingRemote('primaryColor', c);
      showToast('تم تحديث لون النظام بنجاح', 'success');
      renderAppearanceSettings(main);
    };
  });

  main.querySelectorAll('input[name="appFontSize"]').forEach(radio => {
    radio.onchange = async (e)=>{
      const f = e.target.value;
      state.settings.fontSize = f;
      setCache('settings', state.settings);
      applyThemeAndAppearance();
      await saveSettingRemote('fontSize', f);
      showToast('تم تغيير حجم الخط بنجاح', 'success');
    };
  });
}

/* 2. Company Profile & Print Information */
function renderCompanySettings(main){
  const s = state.settings || {};
  main.innerHTML = `
    ${renderSettingsNavHeader('بيانات الشركة والمطبوعات', 'تخصيص الاسم والشعار وأرقام الهواتف والعناوين الظاهرة على الفواتير والإيصالات')}

    <div class="card">
      <div class="grid2">
        <div class="field">
          <label>اسم المحل / الشركة *</label>
          <input id="setShopName" value="${s.shopName||''}" placeholder="مثال: صيانة ميكروتك">
        </div>
        <div class="field">
          <label>رابط الشعار / اللوجو (Logo URL)</label>
          <input id="setLogoUrl" value="${s.logoUrl||''}" placeholder="https://domain.com/logo.png">
        </div>
      </div>

      ${s.logoUrl ? `
        <div style="margin:8px 0 16px;padding:10px;background:var(--paper3);border-radius:var(--radius-sm);display:inline-flex;align-items:center;gap:12px;">
          <span style="font-size:11px;font-weight:700;color:var(--ink-secondary);">معاينة الشعار:</span>
          <img src="${s.logoUrl}" style="max-height:45px;max-width:140px;object-fit:contain;">
        </div>
      ` : ''}

      <div class="grid2">
        <div class="field">
          <label>أرقام الهواتف الرسمية للاتصال</label>
          <input id="setShopPhone" class="mono" value="${s.shopPhone||''}" placeholder="010xxxxxxxx - 011xxxxxxxx">
        </div>
        <div class="field">
          <label>رقم الواتساب الرسمي لخدمة العملاء</label>
          <input id="setShopWhatsapp" class="mono" value="${s.shopWhatsapp||''}" placeholder="010xxxxxxxx">
        </div>
      </div>

      <div class="grid2">
        <div class="field">
          <label>عنوان المقر والفرع</label>
          <input id="setShopAddress" value="${s.shopAddress||''}" placeholder="مثال: 15 شارع التحرير، الدقي، الجيزة">
        </div>
        <div class="field">
          <label>الرقم الضريبي / السجل التجاري (إن وجد)</label>
          <input id="setShopTaxNumber" class="mono" value="${s.shopTaxNumber||''}" placeholder="مثال: 123-456-789">
        </div>
      </div>

      <div class="field">
        <label>العبارة الختامية أسفل المطبوعات والفواتير</label>
        <input id="setPrintFooterText" value="${s.printFooterText||'شكراً لتعاملكم معنا • نسعد دائماً بخدمتكم'}" placeholder="عبارة شكر أو رسالة ختامية">
      </div>

      <div style="text-align:left;margin-top:16px;">
        <button class="btn btn-primary" id="saveCompanySettingsBtn">${getSvgIcon("check", 14)} حفظ بيانات الشركة</button>
      </div>
    </div>
  `;

  attachSettingsQuickTabEvents(main);

  document.getElementById('saveCompanySettingsBtn').onclick = async ()=>{
    s.shopName = document.getElementById('setShopName').value.trim();
    s.logoUrl = document.getElementById('setLogoUrl').value.trim();
    s.shopPhone = document.getElementById('setShopPhone').value.trim();
    s.shopWhatsapp = document.getElementById('setShopWhatsapp').value.trim();
    s.shopAddress = document.getElementById('setShopAddress').value.trim();
    s.shopTaxNumber = document.getElementById('setShopTaxNumber').value.trim();
    s.printFooterText = document.getElementById('setPrintFooterText').value.trim();

    state.settings = s;
    setCache('settings', s);
    try {
      await saveSettingRemote('shopName', s.shopName);
      await saveSettingRemote('logoUrl', s.logoUrl);
      await saveSettingRemote('shopPhone', s.shopPhone);
      await saveSettingRemote('shopWhatsapp', s.shopWhatsapp);
      await saveSettingRemote('shopAddress', s.shopAddress);
      await saveSettingRemote('shopTaxNumber', s.shopTaxNumber);
      await saveSettingRemote('printFooterText', s.printFooterText);
      showToast('تم حفظ بيانات الشركة والمطبوعات بنجاح', 'success');
      renderCompanySettings(main);
    } catch(e) {
      showToast('تم حفظ بيانات الشركة محلياً (وضع غير متصل)', 'info');
    }
  };
}

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
function renderPosSettings(main){
  const posSettings = getPosSettings();
  const payMethods = posSettings.paymentMethods || [];
  const quickServices = posSettings.quickServices || [];

  main.innerHTML = `
    ${renderSettingsNavHeader('إعدادات نقطة البيع وخيارات الدفع', 'تخصيص طرق الدفع، خدمات البيع السريعة، إعدادات طابعة الإيصالات، والسياسات المالية')}

    <!-- 1. Payment Methods Management -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <div>
          <h3 style="margin:0;font-size:15px;">طرق وخيارات الدفع المتاحة</h3>
                  </div>
        <button class="btn btn-primary btn-xs" id="addNewPayMethodBtn">${getSvgIcon("plus", 13)} إضافة طريقة دفع جديدة</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(250px, 1fr));gap:10px;margin-bottom:10px;">
        ${payMethods.map((pm, idx) => `
          <div style="border:1.5px solid ${pm.enabled!==false?'var(--primary)':'var(--line)'};background:var(--paper2);border-radius:var(--radius);padding:12px;display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:22px;"></span>
              <div>
                <b style="font-size:13px;display:block;color:var(--ink);">${escapeHtml(pm.name)}</b>
                <span style="font-size:10.5px;color:var(--ink-secondary);">${pm.id}</span>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <label class="checkbox-row" style="margin:0;font-size:12px;">
                <input type="checkbox" class="pay-method-toggle" data-pmidx="${idx}" ${pm.enabled!==false?'checked':''}>
                <span style="font-weight:700;">${pm.enabled!==false?'مفعل':'معطل'}</span>
              </label>
              ${['cash','vodafone','card','instapay','credit'].includes(pm.id)?'':`
                <button class="btn btn-ghost btn-xs remove-custom-pm-btn" data-pmidx="${idx}" style="color:var(--red);padding:2px 6px;" title="حذف">&times;</button>
              `}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 2. Quick Services Buttons Management -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div>
          <h3 style="margin:0;font-size:15px;">أزرار الخدمات السريعة الفورية</h3>
                  </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(210px, 1fr));gap:10px;margin-bottom:14px;">
        ${quickServices.map((srv, idx) => `
          <div style="border:1px solid var(--line);background:var(--paper);border-radius:var(--radius);padding:10px 12px;display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:18px;"></span>
              <div>
                <b style="font-size:12.5px;display:block;">${escapeHtml(srv.name)}</b>
                <span class="mono font-bold" style="color:var(--primary);font-size:12px;">${Number(srv.price).toLocaleString()} ج.م</span>
              </div>
            </div>
            <button class="btn btn-ghost btn-xs remove-quick-srv-btn" data-srvidx="${idx}" style="color:var(--red);padding:2px 6px;" title="حذف">&times;</button>
          </div>
        `).join('')}
      </div>

      <div style="display:flex;gap:8px;background:var(--paper2);padding:10px;border-radius:var(--radius-sm);border:1px solid var(--line);flex-wrap:wrap;">
        <input id="newSrvName" placeholder="اسم الخدمة (مثال: صيانة سوفت وير)" style="flex:2;min-width:180px;">
        <input id="newSrvPrice" type="number" placeholder="السعر (ج.م)" style="flex:1;min-width:90px;" class="mono">
        <input id="newSrvIcon" placeholder="أيقونة" style="width:70px;text-align:center;">
        <button class="btn btn-primary btn-sm" id="addNewQuickSrvBtn">${getSvgIcon("plus", 13)} إضافة خدمة</button>
      </div>
    </div>

    <!-- 2.5 POS Shortcut Items Management (الأصناف السريعة والمختصرة في الكاشير) -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <div>
          <h3 style="margin:0;font-size:15px;">الأصناف السريعة والمختصرة في الكاشير (POS Shortcuts)</h3>
                  </div>
        <span class="status-badge st-check" style="font-size:11.5px;">${(posSettings.shortcutItemIds||[]).length} صنف محدد</span>
      </div>

      <!-- Current Shortcut Items Chips -->
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;min-height:48px;padding:10px;background:var(--paper2);border-radius:var(--radius-sm);border:1px solid var(--line);align-items:center;">
        ${(!posSettings.shortcutItemIds || posSettings.shortcutItemIds.length === 0) ? `
          <div style="color:var(--ink-secondary);font-size:12px;padding:6px 0;">لم يتم تعيين أصناف سريعة بعد. يمكنك اختيار صنف من القائمة أدناه أو الضغط على رمز النجمة في بطاقة أي صنف بشاشة البيع.</div>
        ` : posSettings.shortcutItemIds.map(id => {
          const it = (state.inventory||[]).find(x => String(x.ID||x.id) === String(id));
          const name = it ? it.Name : `صنف #${id}`;
          const cat = it ? it.Category : '';
          const price = it ? Number(it.SellPrice||it.PurchasePrice||0).toLocaleString() : '';
          return `
            <div style="display:inline-flex;align-items:center;gap:6px;background:var(--paper);border:1.5px solid var(--primary);border-radius:20px;padding:4px 10px;box-shadow:var(--shadow-sm);">
              
              <span style="font-size:12px;font-weight:800;color:var(--ink);">${escapeHtml(name)}</span>
              ${cat ? `<span style="font-size:10.5px;color:var(--ink-secondary);">[${escapeHtml(cat)}]</span>` : ''}
              ${price ? `<span class="mono" style="font-size:11px;color:var(--primary);font-weight:700;">(${price} ج.م)</span>` : ''}
              <button type="button" class="remove-pos-shortcut-btn" data-rmshortid="${id}" style="background:transparent;border:none;color:var(--red);cursor:pointer;font-weight:900;font-size:13px;padding:0 2px;margin-right:2px;" title="إلغاء التثبيت">&times;</button>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Add Shortcut Item From Inventory Dropdown -->
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <select id="posAddShortcutSelect" style="flex:1;min-width:220px;padding:7px 10px;font-size:12.5px;">
          <option value="">-- اختر صنفاً من المخزون لإضافته للأصناف السريعة --</option>
          ${(state.inventory||[])
            .filter(it => !(posSettings.shortcutItemIds||[]).includes(String(it.ID||it.id)))
            .map(it => `
              <option value="${it.ID||it.id}">
                ${escapeHtml(it.Name)} [${escapeHtml(it.Category||'صيانة')}] - ${Number(it.SellPrice||it.PurchasePrice||0).toLocaleString()} ج.م (متوفر: ${it.Quantity||0})
              </option>
            `).join('')}
        </select>
        <button type="button" class="btn btn-primary btn-sm" id="posAddShortcutBtn" style="padding:7px 14px;">
          ${getSvgIcon("plus", 13)} إضافة إلى الأصناف السريعة
        </button>
      </div>
    </div>

    <!-- 3. Receipt & Thermal Printer Settings -->
    <div class="card">
      <h3 style="margin-top:0;font-size:15px;">إعدادات طابعة الإيصالات والبون الحراري</h3>
            
      <div class="grid2" style="margin-bottom:14px;">
        <div class="field">
          <label>مقاس ورق الطابعة الحرارية (Receipt Size)</label>
          <select id="posReceiptPaperSize">
            <option value="80mm" ${posSettings.receiptPaperSize==='80mm'?'selected':''}>80mm (عرض قياسي 80 مم - طابعات إيصالات كاشير)</option>
            <option value="58mm" ${posSettings.receiptPaperSize==='58mm'?'selected':''}>58mm (عرض مدمج 58 مم - طابعات بلوتوث وحرارية صغيرة)</option>
          </select>
        </div>
        <div class="field">
          <label>نص تذييل وشكر الإيصال (Receipt Footer Text)</label>
          <input id="posReceiptFooter" value="${escapeHtml(posSettings.receiptFooter||'')}">
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:10px;">
        <label class="checkbox-row" style="font-size:12.5px;">
          <input type="checkbox" id="posAutoPrintReceipt" ${posSettings.autoPrintReceipt!==false?'checked':''}>
          <span>طباعة الإيصال الحراري تلقائياً فور إتمام البيع</span>
        </label>
        <label class="checkbox-row" style="font-size:12.5px;">
          <input type="checkbox" id="posShowCashierName" ${posSettings.showCashierName!==false?'checked':''}>
          <span>إظهار اسم الكاشير على بون العميل</span>
        </label>
        <label class="checkbox-row" style="font-size:12.5px;">
          <input type="checkbox" id="posShowLogoOnReceipt" ${posSettings.showLogoOnReceipt!==false?'checked':''}>
          <span>إظهار شعار المحل في أعلى الإيصال</span>
        </label>
      </div>
    </div>

    <!-- 4. Inventory & Tax Policies -->
    <div class="card">
      <h3 style="margin-top:0;font-size:15px;">السياسات المالية والمخزنية</h3>
      
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:14px;margin-bottom:14px;">
        <div style="background:var(--paper2);padding:12px;border-radius:var(--radius-sm);border:1px solid var(--line);">
          <label class="checkbox-row" style="font-size:13px;font-weight:800;margin-bottom:4px;">
            <input type="checkbox" id="posAllowNegativeStock" ${posSettings.allowNegativeStock?'checked':''}>
            <span>السماح بالبيع بالسالب (دون توفر رصيد)</span>
          </label>
          <div style="font-size:11.5px;color:var(--ink-secondary);padding-right:24px;">
            في حال تفعيله، سيتمكن الكاشير من إتمام البيع حتى لو كان الصنف غير مسجل له كمية كافية بالمخزن.
          </div>
        </div>

        <div style="background:var(--paper2);padding:12px;border-radius:var(--radius-sm);border:1px solid var(--line);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <label class="checkbox-row" style="font-size:13px;font-weight:800;margin:0;">
              <input type="checkbox" id="posEnableTax" ${posSettings.enableTax?'checked':''}>
              <span>تفعيل ضريبة القيمة المضافة (VAT)</span>
            </label>
            <div style="display:flex;align-items:center;gap:4px;">
              <input type="number" id="posTaxRate" value="${posSettings.taxRate||14}" style="width:60px;padding:3px 6px;text-align:center;" class="mono font-bold">
              <span style="font-size:12px;font-weight:800;">%</span>
            </div>
          </div>
          <div style="font-size:11.5px;color:var(--ink-secondary);padding-right:24px;">
            يتم حساب النسبة تلقائياً وإضافتها لملخص الفاتورة وإيصال البيع.
          </div>
        </div>

        <div style="background:var(--paper2);padding:12px;border-radius:var(--radius-sm);border:1px solid var(--line);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <label style="font-size:13px;font-weight:800;margin:0;">
              سقف الخصم المسموح بدون تصريح المشرف (POS)
            </label>
            <div style="display:flex;align-items:center;gap:4px;">
              <input type="number" id="posMaxDiscountPercent" value="${posSettings.maxDiscountPercent!=null?posSettings.maxDiscountPercent:10}" min="0" max="100" style="width:60px;padding:3px 6px;text-align:center;" class="mono font-bold">
              <span style="font-size:12px;font-weight:800;">%</span>
            </div>
          </div>
          <div style="font-size:11.5px;color:var(--ink-secondary);margin-bottom:8px;">
            أي خصم يتجاوز هذه النسبة المعتمدة سيتطلب إدخال كلمة مرور المشرف/المدير لإتمامه.
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px dashed var(--line);padding-top:6px;">
            <span style="font-size:11.5px;font-weight:700;">سقف المبلغ الأقصى (ج.م):</span>
            <input type="number" id="posMaxDiscountAmount" value="${posSettings.maxDiscountAmount||0}" min="0" placeholder="0 = غير محدد" style="width:85px;padding:2px 6px;text-align:center;" class="mono">
          </div>
        </div>

        <div style="background:var(--paper2);padding:12px;border-radius:var(--radius-sm);border:1px solid var(--line);">
          <label class="checkbox-row" style="font-size:13px;font-weight:800;margin-bottom:4px;">
            <input type="checkbox" id="posPreventBelowCost" ${posSettings.preventBelowCost!==false?'checked':''}>
            <span>حظر البيع بأقل من التكلفة دون إذن المشرف</span>
          </label>
          <div style="font-size:11.5px;color:var(--ink-secondary);padding-right:24px;">
            يمنع الكاشير من بيع أي صنف بسعر أقل من سعر شرائه وتكلفته المسجلة إلا بعد الحصول على تصريح المشرف.
          </div>
        </div>
      </div>

      <div style="text-align:left;margin-top:16px;border-top:1px solid var(--line);padding-top:12px;">
        <button class="btn btn-primary" id="savePosSettingsBtn" style="padding:9px 24px;font-weight:900;">
          ${getSvgIcon("check", 14)} حفظ كافة إعدادات نقطة البيع
        </button>
      </div>
    </div>
  `;

  attachSettingsQuickTabEvents(main);
  attachPosSettingsEvents(main);
}

function attachPosSettingsEvents(main){
  const posSettings = getPosSettings();
  let payMethods = posSettings.paymentMethods || [];
  let quickServices = posSettings.quickServices || [];

  // Remove shortcut item
  main.querySelectorAll('.remove-pos-shortcut-btn').forEach(btn => {
    btn.onclick = async ()=>{
      const rmId = String(btn.dataset.rmshortid);
      posSettings.shortcutItemIds = (posSettings.shortcutItemIds || []).filter(id => String(id) !== rmId);
      state.settings.pos = posSettings;
      setCache('settings', state.settings);
      try { await saveSettingRemote('pos', JSON.stringify(posSettings)); } catch(e){}
      renderPosSettings(main);
      showToast('تمت إزالة الصنف من القائمة السريعة', 'info');
    };
  });

  // Add shortcut item from dropdown
  const addShortcutBtn = document.getElementById('posAddShortcutBtn');
  if(addShortcutBtn){
    addShortcutBtn.onclick = async ()=>{
      const sel = document.getElementById('posAddShortcutSelect');
      const val = sel ? sel.value : '';
      if(!val){
        showToast('يرجى اختيار صنف من القائمة أولاً', 'error');
        return;
      }
      if(!Array.isArray(posSettings.shortcutItemIds)) posSettings.shortcutItemIds = [];
      if(!posSettings.shortcutItemIds.includes(val)){
        posSettings.shortcutItemIds.push(val);
        state.settings.pos = posSettings;
        setCache('settings', state.settings);
        try { await saveSettingRemote('pos', JSON.stringify(posSettings)); } catch(e){}
        renderPosSettings(main);
        showToast('تمت إضافة الصنف إلى الأصناف السريعة بنجاح', 'success');
      }
    };
  }

  // Toggle Payment Methods
  main.querySelectorAll('.pay-method-toggle').forEach(chk => {
    chk.onchange = ()=>{
      const idx = Number(chk.dataset.pmidx);
      if(payMethods[idx]){
        payMethods[idx].enabled = chk.checked;
      }
    };
  });

  // Remove custom pay method
  main.querySelectorAll('.remove-custom-pm-btn').forEach(btn => {
    btn.onclick = ()=>{
      const idx = Number(btn.dataset.pmidx);
      payMethods.splice(idx, 1);
      posSettings.paymentMethods = payMethods;
      renderPosSettings(main);
    };
  });

  // Add new payment method prompt / button
  const addPmBtn = document.getElementById('addNewPayMethodBtn');
  if(addPmBtn){
    addPmBtn.onclick = ()=>{
      const name = prompt('أدخل اسم طريقة أو محفظة الدفع الجديدة (مثال: أورنج كاش / كاش بلس):');
      if(!name || !name.trim()) return;
      const icon = '';
      const id = 'pm_' + Date.now();
      payMethods.push({ id, name: name.trim(), icon, enabled: true });
      posSettings.paymentMethods = payMethods;
      renderPosSettings(main);
      showToast('تمت إضافة طريقة الدفع بنجاح', 'success');
    };
  }

  // Add new quick service
  const addSrvBtn = document.getElementById('addNewQuickSrvBtn');
  if(addSrvBtn){
    addSrvBtn.onclick = ()=>{
      const name = document.getElementById('newSrvName').value.trim();
      const price = Number(document.getElementById('newSrvPrice').value);
      const icon = document.getElementById('newSrvIcon').value.trim() || '';
      if(!name){ showToast('يرجى كتابة اسم الخدمة', 'error'); return; }
      if(!price || price < 0){ showToast('يرجى تحديد سعر الخدمة', 'error'); return; }

      quickServices.push({ name, price, icon });
      posSettings.quickServices = quickServices;
      renderPosSettings(main);
      showToast('تمت إضافة الخدمة السريعة بنجاح', 'success');
    };
  }

  // Remove quick service
  main.querySelectorAll('.remove-quick-srv-btn').forEach(btn => {
    btn.onclick = ()=>{
      const idx = Number(btn.dataset.srvidx);
      quickServices.splice(idx, 1);
      posSettings.quickServices = quickServices;
      renderPosSettings(main);
    };
  });

  // Save all POS settings button
  const saveBtn = document.getElementById('savePosSettingsBtn');
  if(saveBtn){
    saveBtn.onclick = async ()=>{
      posSettings.receiptPaperSize = document.getElementById('posReceiptPaperSize').value;
      posSettings.receiptFooter = document.getElementById('posReceiptFooter').value.trim();
      posSettings.autoPrintReceipt = document.getElementById('posAutoPrintReceipt').checked;
      posSettings.showCashierName = document.getElementById('posShowCashierName').checked;
      posSettings.showLogoOnReceipt = document.getElementById('posShowLogoOnReceipt').checked;
      posSettings.allowNegativeStock = document.getElementById('posAllowNegativeStock').checked;
      posSettings.enableTax = document.getElementById('posEnableTax').checked;
      posSettings.taxRate = Number(document.getElementById('posTaxRate').value) || 14;
      posSettings.maxDiscountPercent = Number(document.getElementById('posMaxDiscountPercent').value) || 0;
      posSettings.maxDiscountAmount = Number(document.getElementById('posMaxDiscountAmount').value) || 0;
      posSettings.preventBelowCost = document.getElementById('posPreventBelowCost').checked;
      posSettings.paymentMethods = payMethods;
      posSettings.quickServices = quickServices;

      state.settings.pos = posSettings;
      setCache('settings', state.settings);

      try {
        await saveSettingRemote('pos', JSON.stringify(posSettings));
        showToast('تم حفظ كافة إعدادات نقطة البيع وخيارات الدفع بنجاح', 'success');
      } catch(e) {
        showToast('تم حفظ إعدادات الـ POS محلياً', 'info');
      }
      renderPosSettings(main);
    };
  }
}

/* 4. Smart WhatsApp Templates */
function renderWhatsappSettings(main){
  const activeWaKey = state.activeWaKey || 'check';
  const templates = (state.settings && state.settings.waTemplates) || DEFAULT_WA_TEMPLATES;
  const currentContent = templates[activeWaKey] || DEFAULT_WA_TEMPLATES[activeWaKey] || '';

  const waKeys = [
    {k:'cost_estimate', icon: getSvgIcon('wallet', 14), label:'0. عرض ومقايسة التكلفة (موافقة / رفض وفحص)'},
    {k:'intake', icon: getSvgIcon('download', 14), label:'1. استلام الجهاز وحجز الإيصال (جديد)'},
    {k:'check', icon: getSvgIcon('search', 14), label:'2. فحص وتشخيص الجهاز (قيد الفحص)'},
    {k:'repair', icon: getSvgIcon('tool', 14), label:'3. بدء الإصلاح الفعلي (الصيانة)'},
    {k:'done', icon: getSvgIcon('check', 14), label:'4. جاهز للاستلام (مكتمل)'},
    {k:'delivered', icon: getSvgIcon('truck', 14), label:'5. تسليم الجهاز وتفعيل الضمان'},
    {k:'pending', icon: getSvgIcon('pause', 14), label:'6. صيانة معلقة بانتظار العميل'},
    {k:'warranty', icon: getSvgIcon('shield', 14), label:'7. صيانة تحت الضمان'},
    {k:'overdue', icon: getSvgIcon('clock', 14), label:'8. تذكير بالأجهزة المتروكة (+7 أيام)'},
    {k:'unrepairable', icon: getSvgIcon('alert', 14), label:'9. تعذر الصيانة'},
    {k:'rejected', icon: getSvgIcon('x', 14), label:'10. رفض العميل'}
  ];

  const placeholders = [
    {p:'{customer_name}', label:'اسم العميل'},
    {p:'{receipt_no}', label:'رقم الإيصال'},
    {p:'{date}', label:'تاريخ الاستلام'},
    {p:'{time}', label:'وقت الاستلام'},
    {p:'{device}', label:'الجهاز والماركة'},
    {p:'{faults_report}', label:'تقرير الفحص'},
    {p:'{cost}', label:'إجمالي التكلفة'},
    {p:'{deposit}', label:'المدفوع مقدماً'},
    {p:'{deposit_info}', label:'بند العربون'},
    {p:'{remaining}', label:'المتبقي المطلوب'},
    {p:'{inspection_fee}', label:'تكلفة الفحص (رفض)'},
    {p:'{estimate_time}', label:'مدة الإصلاح'},
    {p:'{warranty}', label:'فترة الضمان'},
    {p:'{warranty_info}', label:'بند الضمان'},
    {p:'{status}', label:'الحالة'},
    {p:'{track_url}', label:'رابط التتبع المباشر'},
    {p:'{shop_name}', label:'اسم المحل'},
    {p:'{shop_phone}', label:'هاتف المحل'},
    {p:'{shop_address}', label:'عنوان المحل'}
  ];

  main.innerHTML = `
    ${renderSettingsNavHeader('قوالب رسائل واتساب الذكية', 'تخصيص صيغ الرسائل التلقائية المرسلة للعملاء حسب حالة الصيانة مع دعم المتغيرات الفورية')}

    <div class="card">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
        ${waKeys.map(w => `
          <button class="btn btn-sm ${w.k===activeWaKey?'btn-primary':'btn-ghost'}" data-wa-key="${w.k}">
            ${w.icon} ${w.label}
          </button>
        `).join('')}
      </div>

      <div style="margin-bottom:12px;">
        <label>إدراج متغيرات تلقائية بنقرة واحدة (Placeholders):</label>
        <div class="chip-group" style="margin-top:6px;">
          ${placeholders.map(pl => `
            <div class="chip" data-insert-placeholder="${pl.p}" title="انقر لإدراج ${pl.p} في الرسالة">
              ${pl.label} <span class="mono" style="font-size:10px;opacity:0.7;">${pl.p}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="field">
        <label>نص قالب الرسالة لحالة: <b>${(waKeys.find(w=>w.k===activeWaKey)||{}).label}</b></label>
        <textarea id="waTemplateTextarea" style="min-height:160px;font-size:13.5px;line-height:1.6;font-family:inherit;">${currentContent}</textarea>
      </div>

      <!-- Live Simulated WhatsApp Preview Card -->
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:12px 14px;margin-top:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <label style="font-size:12px;font-weight:700;color:#14532d;margin:0;display:flex;align-items:center;gap:6px;">
            معاينة حية لشكل رسالة واتساب كما ستصل للعميل:
          </label>
          <span style="font-size:11px;color:#15803d;">بيانات محاكاة ذكية</span>
        </div>
        <div id="waSettingsLivePreview" style="background:#fff;border:1px solid #bbf7d0;border-radius:8px;padding:12px;font-size:13px;line-height:1.6;white-space:pre-wrap;color:#14532d;max-height:160px;overflow-y:auto;direction:rtl;box-shadow:inset 0 1px 2px rgba(0,0,0,0.02);"></div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;flex-wrap:wrap;gap:10px;">
        <button class="btn btn-ghost btn-sm" id="resetCurrentWaBtn">↩ استعادة القالب الافتراضي لهذه الحالة</button>
        <button class="btn btn-primary" id="saveWaTemplateBtn">${getSvgIcon("check", 14)} حفظ تعديل قالب الرسالة</button>
      </div>
    </div>

    <!-- Default Cost Estimate & Inspection Settings -->
    <div class="card" style="margin-top:16px;border-right:4px solid #10b981;">
      <h3 style="margin-top:0;font-size:15px;color:#047857;display:flex;align-items:center;gap:6px;">
        إعدادات مقايسة التكلفة وفحص الأجهزة الافتراضية
      </h3>
      <p style="font-size:12px;color:var(--ink-secondary);margin-bottom:12px;">تحديد القيم الافتراضية التي تظهر تلقائياً في نافذة عرض التكلفة ومقايسة واتساب قبل إرسالها للعميل:</p>
      
      <div class="grid3">
        <div class="field" style="margin-bottom:0;">
          <label>تكلفة الفحص وتشخيص العطل الافتراضية (في حال رفض الصيانة):</label>
          <input type="number" id="setDefaultInspectionFee" value="${state.settings && state.settings.defaultInspectionFee != null ? state.settings.defaultInspectionFee : 100}" min="0" step="10" placeholder="100">
        </div>
        <div class="field" style="margin-bottom:0;">
          <label>مدة الإصلاح المتوقعة الافتراضية:</label>
          <input type="text" id="setDefaultEstimateTime" value="${escapeHtml((state.settings && state.settings.defaultEstimateTime) || 'خلال 24-48 ساعة')}" placeholder="خلال 24-48 ساعة">
        </div>
        <div class="field" style="margin-bottom:0;">
          <label>فترة الضمان الافتراضية:</label>
          <input type="text" id="setDefaultWarranty" value="${escapeHtml((state.settings && state.settings.defaultWarranty) || '3 شهور ضد عيوب الصناعة')}" placeholder="3 شهور ضد عيوب الصناعة">
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;margin-top:14px;">
        <button class="btn btn-primary btn-sm" id="saveEstimateDefaultsBtn">${getSvgIcon("check", 14)} حفظ إعدادات المقايسة الافتراضية</button>
      </div>
    </div>
  `;

  attachSettingsQuickTabEvents(main);

  main.querySelectorAll('[data-wa-key]').forEach(btn => {
    btn.onclick = ()=>{
      state.activeWaKey = btn.dataset.waKey;
      renderWhatsappSettings(main);
    };
  });

  const textarea = document.getElementById('waTemplateTextarea');

  function updateSettingsLivePreview(){
    const previewBox = document.getElementById('waSettingsLivePreview');
    if(!previewBox || !textarea) return;
    const rawText = textarea.value;
    const trackUrl = `${window.location.origin}${window.location.pathname}?track=MT-2026-0001`;
    const rendered = rawText
      .replace(/{customer_name}/g, 'أحمد محمود')
      .replace(/{receipt_no}/g, 'MT-2026-0001')
      .replace(/{date}/g, new Date().toISOString().slice(0,10))
      .replace(/{time}/g, '04:30 م')
      .replace(/{device}/g, 'لابتوب - Dell G15 5511')
      .replace(/{faults}/g, 'شاشة مكسورة، فحص المذربورد')
      .replace(/{faults_report}/g, 'شاشة مكسورة، فحص المذربورد')
      .replace(/{status}/g, (waKeys.find(w=>w.k===activeWaKey)||{}).label || 'قيد الفحص')
      .replace(/{cost}/g, '1,800')
      .replace(/{deposit}/g, '500')
      .replace(/{deposit_info}/g, '• العربون المدفوع مسبقاً: *500 ج.م*')
      .replace(/{remaining}/g, '1,300')
      .replace(/{inspection_fee}/g, '100')
      .replace(/{estimate_time}/g, 'خلال 24-48 ساعة')
      .replace(/{warranty}/g, '3 شهور ضد عيوب الصناعة')
      .replace(/{warranty_info}/g, '• فترة الضمان المعتمدة: *3 شهور ضد عيوب الصناعة*')
      .replace(/{track_url}/g, trackUrl)
      .replace(/{shop_name}/g, (state.settings && state.settings.shopName) || 'صيانة ميكروتك')
      .replace(/{shop_phone}/g, (state.settings && (state.settings.shopPhone || state.settings.phone)) || '01000000000')
      .replace(/{shop_address}/g, (state.settings && (state.settings.shopAddress || state.settings.address)) || 'شارع التحرير')
      .replace(/\n\s*\n\s*\n+/g, '\n\n');
    previewBox.textContent = rendered;
  }
  if(textarea){
    textarea.oninput = updateSettingsLivePreview;
    updateSettingsLivePreview();
  }

  main.querySelectorAll('[data-insert-placeholder]').forEach(chip => {
    chip.onclick = ()=>{
      const p = chip.dataset.insertPlaceholder;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      textarea.value = val.substring(0, start) + p + val.substring(end);
      textarea.focus();
      textarea.setSelectionRange(start + p.length, start + p.length);
      updateSettingsLivePreview();
    };
  });

  document.getElementById('saveWaTemplateBtn').onclick = async ()=>{
    if(!state.settings.waTemplates) state.settings.waTemplates = {...DEFAULT_WA_TEMPLATES};
    state.settings.waTemplates[activeWaKey] = textarea.value;
    setCache('settings', state.settings);
    try {
      await saveSettingRemote('waTemplates', JSON.stringify(state.settings.waTemplates));
      showToast('تم حفظ قالب رسالة واتساب بنجاح', 'success');
    } catch(e){
      showToast('تم حفظ القالب محلياً', 'info');
    }
  };

  document.getElementById('resetCurrentWaBtn').onclick = ()=>{
    if(confirm('هل تريد بالتأكيد استعادة القالب الافتراضي لهذه الحالة؟')){
      if(!state.settings.waTemplates) state.settings.waTemplates = {...DEFAULT_WA_TEMPLATES};
      state.settings.waTemplates[activeWaKey] = DEFAULT_WA_TEMPLATES[activeWaKey];
      textarea.value = DEFAULT_WA_TEMPLATES[activeWaKey];
      setCache('settings', state.settings);
      showToast('تم استعادة القالب الافتراضي', 'info');
    }
  };

  const saveEstDefBtn = document.getElementById('saveEstimateDefaultsBtn');
  if(saveEstDefBtn){
    saveEstDefBtn.onclick = async ()=>{
      const fee = Number(document.getElementById('setDefaultInspectionFee').value);
      const estTime = document.getElementById('setDefaultEstimateTime').value.trim();
      const war = document.getElementById('setDefaultWarranty').value.trim();
      state.settings.defaultInspectionFee = !isNaN(fee) ? fee : 100;
      state.settings.defaultEstimateTime = estTime || 'خلال 24-48 ساعة';
      state.settings.defaultWarranty = war || '3 شهور ضد عيوب الصناعة';
      setCache('settings', state.settings);
      try {
        await saveSettingRemote('defaultInspectionFee', String(state.settings.defaultInspectionFee));
        await saveSettingRemote('defaultEstimateTime', state.settings.defaultEstimateTime);
        await saveSettingRemote('defaultWarranty', state.settings.defaultWarranty);
        showToast('تم حفظ إعدادات مقايسة التكلفة الافتراضية بنجاح', 'success');
      } catch(e){
        showToast('تم حفظ الإعدادات محلياً', 'info');
      }
    };
  }
}

/* 4. Warranty & Legal Agreement Terms */
function renderWarrantySettings(main){
  const currentTerms = getTerms();
  const currentInvTerms = getInvoiceTerms();
  const currentQuoteTerms = getQuoteTerms();
  const currentAgreementTerms = getQuoteAgreementTerms();

  main.innerHTML = `
    ${renderSettingsNavHeader('بنود الضمان وعقود الاتفاق', 'تخصيص وكتابة بنود وشروط إيصال الصيانة (A5) والفواتير وعروض الأسعار وعقود التوريد والتركيب')}

    <!-- Maintenance A5 Receipt Terms -->
    <div class="card" style="border-right:4px solid var(--blue);">
      <h3 style="margin-top:0;font-size:15px;color:var(--blue-text);">بنود وشروط إيصال استلام الصيانة (ورقة A5)</h3>
      <p style="font-size:12px;color:var(--ink-secondary);margin-bottom:10px;">هذه البنود تطبع أسفل إيصال استلام الصيانة الأصلي:</p>
      <textarea id="setTermsText" style="min-height:120px;font-size:12.5px;line-height:1.6;">${currentTerms}</textarea>
      <div style="display:flex;justify-content:space-between;margin-top:10px;">
        <button class="btn btn-ghost btn-xs" id="resetTermsBtn">↩ استعادة البنود الافتراضية</button>
        <button class="btn btn-primary btn-sm" id="saveTermsBtn">${getSvgIcon("check", 14)} حفظ بنود إيصال الصيانة</button>
      </div>
    </div>

    <!-- Tax Invoice Terms -->
    <div class="card" style="border-right:4px solid var(--purple);">
      <h3 style="margin-top:0;font-size:15px;color:var(--purple-text);">شروط وملاحظات الفاتورة الضريبية الرسمية</h3>
      <p style="font-size:12px;color:var(--ink-secondary);margin-bottom:10px;">تظهر أسفل الفواتير الضريبية ومبيعات الكاشير:</p>
      <textarea id="setInvTermsText" style="min-height:90px;font-size:12.5px;line-height:1.6;">${currentInvTerms}</textarea>
      <div style="display:flex;justify-content:space-between;margin-top:10px;">
        <button class="btn btn-ghost btn-xs" id="resetInvTermsBtn">↩ استعادة الافتراضي</button>
        <button class="btn btn-primary btn-sm" id="saveInvTermsBtn">${getSvgIcon("check", 14)} حفظ شروط الفاتورة</button>
      </div>
    </div>

    <!-- Quotation Terms -->
    <div class="card" style="border-right:4px solid var(--cyan);">
      <h3 style="margin-top:0;font-size:15px;color:var(--cyan-text);">شروط وأحكام عرض الأسعار وبيان التكلفة</h3>
      <p style="font-size:12px;color:var(--ink-secondary);margin-bottom:10px;">تظهر أسفل صفحة عرض السعر الصادر للعميل:</p>
      <textarea id="setQuoteTermsText" style="min-height:90px;font-size:12.5px;line-height:1.6;">${currentQuoteTerms}</textarea>
      <div style="display:flex;justify-content:space-between;margin-top:10px;">
        <button class="btn btn-ghost btn-xs" id="resetQuoteTermsBtn">↩ استعادة الافتراضي</button>
        <button class="btn btn-primary btn-sm" id="saveQuoteTermsBtn">${getSvgIcon("check", 14)} حفظ شروط عرض السعر</button>
      </div>
    </div>

    <!-- Quotation Agreement & Contract Terms -->
    <div class="card" style="border-right:4px solid var(--green);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <h3 style="margin:0;font-size:15px;color:var(--green-text);">بنود وشروط عقد واتفاق التوريد والتركيب</h3>
      </div>
      <p style="font-size:12px;color:var(--ink-secondary);margin-bottom:10px;">
        تطبع هذه البنود عند الضغط على زر <b>"طباعة اتفاق وشروط العرض"</b> لطباعة عقد رسمي ملزم للطرفين مع جدول سداد الدفعات وتوقيعات الاستلام:
      </p>
      <textarea id="setAgreementTermsText" style="min-height:140px;font-size:12.5px;line-height:1.7;">${currentAgreementTerms}</textarea>
      <div style="display:flex;justify-content:space-between;margin-top:10px;">
        <button class="btn btn-ghost btn-xs" id="resetAgreementTermsBtn">↩ استعادة بنود العقد الافتراضية</button>
        <button class="btn btn-primary btn-sm" id="saveAgreementTermsBtn">${getSvgIcon("check", 14)} حفظ بنود العقد والاتفاق</button>
      </div>
    </div>
  `;

  attachSettingsQuickTabEvents(main);

  document.getElementById('saveTermsBtn').onclick = async ()=>{
    const v = document.getElementById('setTermsText').value.trim();
    state.settings.terms = v;
    setCache('settings', state.settings);
    await saveSettingRemote('terms', v);
    showToast('تم حفظ بنود إيصال الصيانة بنجاح', 'success');
  };
  document.getElementById('resetTermsBtn').onclick = ()=>{
    document.getElementById('setTermsText').value = DEFAULT_TERMS;
    state.settings.terms = DEFAULT_TERMS;
    setCache('settings', state.settings);
    showToast('تمت استعادة بنود الصيانة الافتراضية', 'info');
  };

  document.getElementById('saveInvTermsBtn').onclick = async ()=>{
    const v = document.getElementById('setInvTermsText').value.trim();
    state.settings.invoiceTerms = v;
    setCache('settings', state.settings);
    await saveSettingRemote('invoiceTerms', v);
    showToast('تم حفظ شروط الفاتورة بنجاح', 'success');
  };
  document.getElementById('resetInvTermsBtn').onclick = ()=>{
    document.getElementById('setInvTermsText').value = DEFAULT_INVOICE_TERMS;
    state.settings.invoiceTerms = DEFAULT_INVOICE_TERMS;
    setCache('settings', state.settings);
    showToast('تمت استعادة شروط الفاتورة الافتراضية', 'info');
  };

  document.getElementById('saveQuoteTermsBtn').onclick = async ()=>{
    const v = document.getElementById('setQuoteTermsText').value.trim();
    state.settings.quoteTerms = v;
    setCache('settings', state.settings);
    await saveSettingRemote('quoteTerms', v);
    showToast('تم حفظ شروط عرض السعر بنجاح', 'success');
  };
  document.getElementById('resetQuoteTermsBtn').onclick = ()=>{
    document.getElementById('setQuoteTermsText').value = DEFAULT_QUOTE_TERMS;
    state.settings.quoteTerms = DEFAULT_QUOTE_TERMS;
    setCache('settings', state.settings);
    showToast('تمت استعادة شروط عرض السعر الافتراضية', 'info');
  };

  document.getElementById('saveAgreementTermsBtn').onclick = async ()=>{
    const v = document.getElementById('setAgreementTermsText').value.trim();
    state.settings.quoteAgreementTerms = v;
    setCache('settings', state.settings);
    await saveSettingRemote('quoteAgreementTerms', v);
    showToast('تم حفظ بنود عقد واتفاق التوريد بنجاح', 'success');
  };
  document.getElementById('resetAgreementTermsBtn').onclick = ()=>{
    document.getElementById('setAgreementTermsText').value = DEFAULT_QUOTE_AGREEMENT_TERMS;
    state.settings.quoteAgreementTerms = DEFAULT_QUOTE_AGREEMENT_TERMS;
    setCache('settings', state.settings);
    showToast('تمت استعادة بنود عقد التوريد الافتراضية', 'info');
  };
}

/* 5. Device Categories & Brands Master */
function renderDevicesSettings(main){
  const brandsObj = getBrands();
  const categories = Object.keys(brandsObj);
  const selectedCat = state.selectedDeviceCat || categories[0] || 'لابتوب';
  const brandsList = brandsObj[selectedCat] || [];

  main.innerHTML = `
    ${renderSettingsNavHeader('تصنيفات وماركات الأجهزة', 'إدارة فئات الأجهزة (لابتوب، موبايل، شاشات، كاميرات...) وتخصيص الماركات التابعة لكل فئة')}

    <div class="card">
      <h3 style="margin-top:0;font-size:15px;">1. تصنيفات وفئات الأجهزة</h3>
      <p style="font-size:12px;color:var(--ink-secondary);margin-bottom:12px;">اختر فئة لتعديل ماركاتها، أو أضف فئة جديدة:</p>
      
      <div class="chip-group" style="margin-bottom:16px;">
        ${categories.map(cat => `
          <div class="chip ${cat===selectedCat?'sel':''}" data-select-cat="${cat}">
            ${cat}
          </div>
        `).join('')}
      </div>

      <div style="display:flex;gap:10px;margin-bottom:20px;">
        <input id="newCatInput" placeholder="اسم فئة جديدة (مثال: أجهزة منزلية / بلايستيشن)" style="flex:1;">
        <button class="btn btn-primary btn-sm" id="addNewCatBtn">${getSvgIcon("plus", 13)} إضافة فئة جديدة</button>
      </div>

      <hr style="border:none;border-top:1px solid var(--line);margin:18px 0;">

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="margin:0;font-size:15px;">2. الماركات والأنواع التابعة لـ: <span style="color:var(--primary);">${selectedCat}</span></h3>
        ${categories.length > 1 ? `<button class="btn btn-ghost btn-xs" id="deleteCurrentCatBtn" style="color:var(--red);">${getSvgIcon("trash", 13)} حذف فئة "${selectedCat}"</button>` : ''}
      </div>

      <div class="chip-group" style="margin-bottom:16px;">
        ${brandsList.map(b => `
          <div class="chip sel" style="display:inline-flex;align-items:center;gap:6px;">
            <span>${b}</span>
            <span class="remove-brand-btn" data-brand="${b}" style="cursor:pointer;color:#fca5a5;font-weight:900;" title="حذف الماركة">&times;</span>
          </div>
        `).join('')}
      </div>

      <div style="display:flex;gap:10px;">
        <input id="newBrandInput" placeholder="إضافة ماركة جديدة لـ ${selectedCat} (مثال: Sony / Xiaomi)" style="flex:1;">
        <button class="btn btn-primary btn-sm" id="addNewBrandBtn">${getSvgIcon("plus", 13)} إضافة ماركة</button>
      </div>
    </div>
  `;

  attachSettingsQuickTabEvents(main);

  main.querySelectorAll('[data-select-cat]').forEach(chip => {
    chip.onclick = ()=>{
      state.selectedDeviceCat = chip.dataset.selectCat;
      renderDevicesSettings(main);
    };
  });

  document.getElementById('addNewCatBtn').onclick = async ()=>{
    const v = document.getElementById('newCatInput').value.trim();
    if(!v) return;
    if(brandsObj[v]){ showToast('هذه الفئة موجودة بالفعل', 'error'); return; }
    brandsObj[v] = ['أخرى'];
    state.settings.brands = brandsObj;
    state.selectedDeviceCat = v;
    setCache('settings', state.settings);
    await saveSettingRemote('brands', JSON.stringify(brandsObj));
    showToast(`تمت إضافة فئة (${v}) بنجاح`, 'success');
    renderDevicesSettings(main);
  };

  document.getElementById('addNewBrandBtn').onclick = async ()=>{
    const v = document.getElementById('newBrandInput').value.trim();
    if(!v) return;
    if(!brandsObj[selectedCat]) brandsObj[selectedCat] = [];
    if(brandsObj[selectedCat].includes(v)){ showToast('هذه الماركة مضافة مسبقاً', 'error'); return; }
    brandsObj[selectedCat].push(v);
    state.settings.brands = brandsObj;
    setCache('settings', state.settings);
    await saveSettingRemote('brands', JSON.stringify(brandsObj));
    showToast(`تمت إضافة الماركة (${v}) بنجاح`, 'success');
    renderDevicesSettings(main);
  };

  main.querySelectorAll('.remove-brand-btn').forEach(btn => {
    btn.onclick = async (e)=>{
      e.stopPropagation();
      const b = btn.dataset.brand;
      brandsObj[selectedCat] = brandsObj[selectedCat].filter(x => x !== b);
      state.settings.brands = brandsObj;
      setCache('settings', state.settings);
      await saveSettingRemote('brands', JSON.stringify(brandsObj));
      showToast(`تم حذف الماركة (${b})`, 'info');
      renderDevicesSettings(main);
    };
  });

  const delCatBtn = document.getElementById('deleteCurrentCatBtn');
  if(delCatBtn){
    delCatBtn.onclick = async ()=>{
      if(confirm(`هل تريد بالتأكيد حذف فئة الأجهزة "${selectedCat}" بكافة ماركاتها؟`)){
        delete brandsObj[selectedCat];
        state.settings.brands = brandsObj;
        state.selectedDeviceCat = Object.keys(brandsObj)[0] || 'لابتوب';
        setCache('settings', state.settings);
        await saveSettingRemote('brands', JSON.stringify(brandsObj));
        showToast(`تم حذف الفئة بنجاح`, 'info');
        renderDevicesSettings(main);
      }
    };
  }
}

/* 6. Common Faults & Technicians */
function renderFaultsSettings(main){
  const faultsList = getCommonFaults();
  const techsList = state.technicians || [];

  main.innerHTML = `
    ${renderSettingsNavHeader('الأعطال الشائعة والفنيين', 'تخصيص شرائح الأعطال السريعة في إيصال الاستلام وإدارة قائمة الفنيين')}

    <!-- Common Faults Chips Management -->
    <div class="card">
      <h3 style="margin-top:0;font-size:15px;">شرائح الأعطال الشائعة السريعة (${faultsList.length} عطل)</h3>
      <p style="font-size:12px;color:var(--ink-secondary);margin-bottom:12px;">هذه الأعطال تظهر كشرائح سريعة عند استلام وتعديل أجهزة الصيانة:</p>
      
      <div class="chip-group" style="margin-bottom:16px;">
        ${faultsList.map(f => `
          <div class="chip sel" style="display:inline-flex;align-items:center;gap:6px;">
            <span>${f}</span>
            <span class="remove-fault-btn" data-fault="${f}" style="cursor:pointer;color:#fca5a5;font-weight:900;" title="حذف العطل">&times;</span>
          </div>
        `).join('')}
      </div>

      <div style="display:flex;gap:10px;">
        <input id="newFaultInput" placeholder="إضافة عطل شائع جديد (مثال: تغيير باغة / صيانة كيبورد)" style="flex:1;">
        <button class="btn btn-primary btn-sm" id="addNewFaultBtn">${getSvgIcon("plus", 13)} إضافة عطل</button>
      </div>
    </div>

    <!-- Technicians Management -->
    <div class="card">
      <h3 style="margin-top:0;font-size:15px;">قائمة الفنيين المعتمدين (${techsList.length} فني)</h3>
      <p style="font-size:12px;color:var(--ink-secondary);margin-bottom:12px;">الفنيين المتاح إسناد أوامر الشغل وحساب المكافآت لهم:</p>
      
      <div class="chip-group" style="margin-bottom:16px;">
        ${techsList.map(t => `
          <div class="chip sel" style="display:inline-flex;align-items:center;gap:6px;">
            <span>${t}</span>
            <span class="remove-tech-btn" data-tech="${t}" style="cursor:pointer;color:#fca5a5;font-weight:900;" title="حذف الفني">&times;</span>
          </div>
        `).join('')}
      </div>

      <div style="display:flex;gap:10px;">
        <input id="newTechNameInput" placeholder="اسم فني جديد" style="flex:1;">
        <button class="btn btn-primary btn-sm" id="addNewTechBtn">${getSvgIcon("plus", 13)} إضافة فني</button>
      </div>
    </div>
  `;

  attachSettingsQuickTabEvents(main);

  document.getElementById('addNewFaultBtn').onclick = async ()=>{
    const v = document.getElementById('newFaultInput').value.trim();
    if(!v) return;
    const current = getCommonFaults();
    if(current.includes(v)){ showToast('هذا العطل مضاف مسبقاً', 'error'); return; }
    current.push(v);
    state.settings.commonFaults = current;
    setCache('settings', state.settings);
    await saveSettingRemote('commonFaults', JSON.stringify(current));
    showToast(`تمت إضافة العطل (${v}) بنجاح`, 'success');
    renderFaultsSettings(main);
  };

  main.querySelectorAll('.remove-fault-btn').forEach(btn => {
    btn.onclick = async ()=>{
      const f = btn.dataset.fault;
      let current = getCommonFaults().filter(x => x !== f);
      state.settings.commonFaults = current;
      setCache('settings', state.settings);
      await saveSettingRemote('commonFaults', JSON.stringify(current));
      showToast(`تم حذف العطل (${f})`, 'info');
      renderFaultsSettings(main);
    };
  });

  document.getElementById('addNewTechBtn').onclick = async ()=>{
    const v = document.getElementById('newTechNameInput').value.trim();
    if(!v) return;
    try {
      await saveTechnicianRemote(v);
      showToast(`تمت إضافة الفني (${v}) بنجاح`, 'success');
      renderFaultsSettings(main);
    } catch(e){ showToast('تمت الإضافة محلياً', 'info'); }
  };

  main.querySelectorAll('.remove-tech-btn').forEach(btn => {
    btn.onclick = async ()=>{
      const t = btn.dataset.tech;
      state.technicians = state.technicians.filter(x => x !== t);
      setCache('technicians', state.technicians);
      showToast(`تم حذف الفني (${t})`, 'info');
      renderFaultsSettings(main);
    };
  });
}

/* 7. Cloud Sync & Offline Diagnostics [U5] */
function renderSyncSettings(main){
  const queue = getSyncQueue();
  const isOnline = navigator.onLine;
  const terminalCount = queue.filter(i => i.status === 'failed_terminal').length;
  const pendingCount = queue.filter(i => i.status !== 'failed_terminal').length;

  const ACTION_LABELS = {
    saveSale: 'تسجيل عملية بيع',
    saveReceipt: 'تسجيل / تعديل إيصال صيانة',
    savePayment: 'سند صرف / قبض مالي',
    saveReturn: 'مرتجع مبيعات',
    savePurchase: 'فاتورة مشتريات',
    saveExpense: 'تسجيل مصروف',
    saveInvoice: 'فاتورة ضريبية / مبيعات',
    saveCustomer: 'إضافة / تعديل عميل',
    saveItem: 'صنف مخزون',
    saveSupplier: 'بيانات مورد',
    settleSaleDebt: 'سداد مديونية بيع'
  };

  const queueRowsHtml = queue.map((item, idx) => {
    const actionName = ACTION_LABELS[item.action] || item.action || 'عملية غير معروفة';
    const clientRefDisplay = item.clientRef || (item.data && (item.data.clientRef || item.data.ClientRef)) || item.id || '—';
    const isTerminal = item.status === 'failed_terminal';
    const retryCount = item.retryCount || 0;
    const timeFormatted = item.timestamp ? new Date(item.timestamp).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : '—';
    
    let statusBadge = '';
    if (isTerminal) {
      statusBadge = `<span class="status-badge st-reject" style="background:#fee2e2;color:#b91c1c;font-weight:700;">فشل نهائي (${retryCount}/10)</span>`;
    } else if (retryCount > 0) {
      statusBadge = `<span class="status-badge st-repair" style="background:#fef3c7;color:#b45309;">معلق (${retryCount}/10)</span>`;
    } else {
      statusBadge = `<span class="status-badge st-new">معلق للرفع</span>`;
    }

    const errText = item.lastError ? escapeHtml(item.lastError) : '—';

    return `
      <tr>
        <td style="font-weight:700;color:var(--ink-secondary);">${idx + 1}</td>
        <td>
          <div style="font-weight:700;font-size:13px;">${actionName}</div>
          <div style="font-size:11px;color:var(--ink-secondary);font-family:monospace;">${escapeHtml(item.action)}</div>
        </td>
        <td>
          <span class="mono" style="font-size:11.5px;background:var(--paper3);padding:2px 6px;border-radius:4px;" title="${escapeHtml(clientRefDisplay)}">
            ${escapeHtml(clientRefDisplay.length > 18 ? clientRefDisplay.slice(0, 16) + '...' : clientRefDisplay)}
          </span>
        </td>
        <td style="font-size:12px;color:var(--ink-secondary);">${timeFormatted}</td>
        <td>${statusBadge}</td>
        <td style="max-width:220px;">
          <div style="font-size:11.5px;color:${item.lastError ? 'var(--red-text)' : 'var(--ink-secondary)'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${errText}">
            ${errText}
          </div>
        </td>
        <td>
          <div style="display:flex;gap:4px;justify-content:flex-end;">
            <button class="btn btn-ghost btn-sm retry-single-btn" data-id="${item.id}" title="إعادة محاولة المزامنة الفورية">${getSvgIcon("refresh", 13)}</button>
            <button class="btn btn-ghost btn-sm export-single-btn" data-id="${item.id}" title="تصدير بيانات العملية">${getSvgIcon("download", 13)}</button>
            <button class="btn btn-ghost btn-sm delete-single-btn" data-id="${item.id}" title="حذف من الطابور" style="color:var(--red);">${getSvgIcon("trash", 13)}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  main.innerHTML = `
    ${renderSettingsNavHeader('المزامنة السحابية والصيانة', 'فحص حالة الاتصال بـ Google Sheets، مزامنة العمليات المعلقة، وإدارة الكاش المحلي')}

    <div class="card" style="border-right:4px solid ${isOnline?'var(--green)':'var(--amber)'};">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <h3 style="margin:0;font-size:16px;">حالة الاتصال والبيئة السحابية</h3>
        <span class="status-badge ${isOnline?'st-done':'st-repair'}">${isOnline?'متصل بالإنترنت':'وضع غير متصل (Offline)'}</span>
      </div>
      <p style="font-size:13px;color:var(--ink-secondary);line-height:1.6;margin-bottom:16px;">
        يعمل نظام <b>ميكروERP</b> بتقنية <b>Dual-Sync Hybrid Engine مع التحصين ضد التكرار (Idempotency)</b> والتراجع الأسي التلقائي (Exponential Backoff). يتم حفظ كل عملية محلياً بمرجع فريد مشفّر، ورفعها للسحابة دون تكرار حتى لو انقطع الاتصال أو أُعيدت المحاولة عدة مرات.
      </p>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:12px;margin-bottom:18px;">
        <div style="background:var(--paper3);border-radius:var(--radius-sm);padding:12px 14px;border:1px solid var(--line);">
          <div style="font-size:11.5px;color:var(--ink-secondary);">إجمالي طابور العمليات</div>
          <div class="num mono" style="font-size:22px;font-weight:800;color:${queue.length > 0 ? 'var(--amber-text)' : 'var(--green-text)'};margin-top:4px;">${queue.length}</div>
        </div>
        <div style="background:var(--paper3);border-radius:var(--radius-sm);padding:12px 14px;border:1px solid var(--line);">
          <div style="font-size:11.5px;color:var(--ink-secondary);">عمليات معلقة قيد الرفع</div>
          <div class="num mono" style="font-size:22px;font-weight:800;color:var(--primary);margin-top:4px;">${pendingCount}</div>
        </div>
        <div style="background:var(--paper3);border-radius:var(--radius-sm);padding:12px 14px;border:1px solid var(--line);">
          <div style="font-size:11.5px;color:var(--ink-secondary);">عمليات فشل نهائي (10 محاولات)</div>
          <div class="num mono" style="font-size:22px;font-weight:800;color:${terminalCount > 0 ? 'var(--red-text)' : 'var(--ink-secondary)'};margin-top:4px;">${terminalCount}</div>
        </div>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <button class="btn btn-primary" id="forceSyncBtn">${getSvgIcon("refresh", 14)} مزامنة العمليات المعلقة الآن</button>
        ${terminalCount > 0 ? `<button class="btn btn-ghost" id="retryFailedQueueBtn" style="color:var(--amber-text);border-color:var(--amber);">${getSvgIcon("refresh", 14)} إعادة محاولة الفشل النهائي (${terminalCount})</button>` : ''}
        ${queue.length > 0 ? `<button class="btn btn-ghost" id="exportAllQueueBtn">${getSvgIcon("download", 14)} تصدير الطابور كملف JSON</button>` : ''}
        ${queue.length > 0 ? `<button class="btn btn-ghost" id="clearQueueBtn" style="color:var(--red);">${getSvgIcon("trash", 13)} تفريغ طابور المزامنة</button>` : ''}
        <button class="btn btn-ghost" id="reloadCloudDataBtn">${getSvgIcon("refresh", 14)} إعادة تحميل البيانات من السحابة</button>
      </div>
    </div>

    <!-- بطاقة استعراض وإدارة طابور المزامنة التفاعلي -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
        <h3 style="margin:0;font-size:15px;">سجل عناصر طابور المزامنة المحلي (Sync Queue)</h3>
        <span style="font-size:12px;color:var(--ink-secondary);">المحاولات تتم تلقائياً بتدرج زمني أسي (1s -> 2s -> 4s -> ... -> 5min)</span>
      </div>

      ${queue.length === 0 ? `
        <div style="text-align:center;padding:32px 16px;color:var(--ink-secondary);background:var(--paper3);border-radius:var(--radius-sm);border:1px dashed var(--line);">
          <div style="font-size:26px;margin-bottom:8px;">✓</div>
          <div style="font-weight:700;font-size:14px;color:var(--green-text);">طابور المزامنة فارغ تماماً</div>
          <div style="font-size:12px;margin-top:4px;">كافة العمليات والبيانات تم حفظها ورفعها للسحابة بنجاح دون أي تأخير.</div>
        </div>
      ` : `
        <div class="table-container" style="max-height:420px;overflow-y:auto;border:1px solid var(--line);border-radius:var(--radius-sm);">
          <table class="table" style="margin:0;font-size:12.5px;">
            <thead style="position:sticky;top:0;background:var(--paper2);z-index:2;">
              <tr>
                <th style="width:40px;">#</th>
                <th>نوع العملية</th>
                <th>معرف الطلب (ClientRef)</th>
                <th>وقت التسجيل</th>
                <th>الحالة والمحاولات</th>
                <th>آخر استجابة / خطأ</th>
                <th style="text-align:left;">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              ${queueRowsHtml}
            </tbody>
          </table>
        </div>
      `}
    </div>

    <div class="card" style="border-right:4px solid var(--primary);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
        <h3 style="margin:0;font-size:15px;color:var(--primary);">النسخ الاحتياطي والاستعادة الشاملة</h3>
        <button class="btn btn-primary btn-sm" id="goToBackupTabBtn">${getSvgIcon("download", 13)} الانتقال لمركز النسخ الاحتياطي ↗</button>
      </div>
      <p style="font-size:12.5px;color:var(--ink-secondary);line-height:1.6;margin:0;">
        تصدير نسخة احتياطية كاملة (JSON)، استعادة البيانات، تفعيل الجدولة التلقائية على Google Drive، وتصدير جداول النظام بصيغة Excel/CSV.
      </p>
    </div>

    <div class="card" style="border-right:4px solid var(--red);">
      <h3 style="margin-top:0;font-size:15px;color:var(--red-text);">تفريغ الكاش وإعادة التهيئة المحلية</h3>
      <p style="font-size:12px;color:var(--ink-secondary);margin-bottom:12px;">
        في حال واجهت أي تعليق في المتصفح، يمكنك تفريغ الذاكرة المؤقتة المحلية وإعادة تحميل أحدث نسخة من السحابة بأمان:
      </p>
      <button class="btn btn-ghost btn-sm" id="clearLocalCacheBtn" style="color:var(--red);">${getSvgIcon("trash", 13)} تفريغ الكاش وإعادة التحميل</button>
    </div>
  `;

  attachSettingsQuickTabEvents(main);

  const goToBackupBtn = document.getElementById('goToBackupTabBtn');
  if(goToBackupBtn){
    goToBackupBtn.onclick = ()=>{
      state.settingsTab = 'backup';
      const app = document.getElementById('app');
      if(state.currentSection === 'settings') renderSettingsSectionApp(app);
      else renderSettingsContent(main);
    };
  }

  const forceSyncBtn = document.getElementById('forceSyncBtn');
  if(forceSyncBtn){
    forceSyncBtn.onclick = async ()=>{
      await syncOfflineQueue(true);
      renderSyncSettings(main);
    };
  }

  const retryFailedBtn = document.getElementById('retryFailedQueueBtn');
  if(retryFailedBtn){
    retryFailedBtn.onclick = async ()=>{
      retryAllFailedQueueItems();
      renderSyncSettings(main);
    };
  }

  const exportAllBtn = document.getElementById('exportAllQueueBtn');
  if(exportAllBtn){
    exportAllBtn.onclick = ()=>{
      exportAllQueueItems();
    };
  }

  const clearQueueBtn = document.getElementById('clearQueueBtn');
  if(clearQueueBtn){
    clearQueueBtn.onclick = ()=>{
      if(confirm('هل ترغب في تفريغ طابور المزامنة المعلق؟ سيتم إزالة أي عمليات معلقة لم تُرفع للسحابة بعد.')){
        clearOfflineSyncQueue();
        renderSyncSettings(main);
      }
    };
  }

  // Row-level action buttons
  main.querySelectorAll('.retry-single-btn').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      retrySingleQueueItem(id);
      renderSyncSettings(main);
    };
  });

  main.querySelectorAll('.export-single-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      exportSingleQueueItem(id);
    };
  });

  main.querySelectorAll('.delete-single-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      if(confirm('هل أنت متأكد من حذف هذه العملية من طابور المزامنة؟')){
        deleteSingleQueueItem(id);
        renderSyncSettings(main);
      }
    };
  });

  document.getElementById('reloadCloudDataBtn').onclick = async ()=>{
    showToast('جاري جلب أحدث البيانات من السحابة...', 'info');
    try {
      [state.users, state.receipts, state.customers, state.technicians, state.settings, state.payments, state.inventory, state.sales, state.quotations, state.services, state.purchases, state.suppliers, state.expenses, state.accounts, state.journalEntries, state.invoices] = await Promise.all([
        loadUsers(), loadReceipts(), loadCustomers(), loadTechnicians(), loadSettings(), loadPayments(), loadInventory(), loadSales(), loadQuotations(), loadServices(), loadPurchases(), loadSuppliers(), loadExpenses(), loadAccounts(), loadJournalEntries(), loadInvoices()
      ]);
      showToast('تم تحديث البيانات من السحابة بنجاح', 'success');
      renderSyncSettings(main);
    } catch(e) {
      showToast('تعذر التحديث من السحابة: ' + e.message, 'error');
    }
  };

  document.getElementById('clearLocalCacheBtn').onclick = ()=>{
    if(confirm('هل تريد بالتأكيد تفريغ الكاش المحلي؟')){
      localStorage.clear();
      showToast('تم تفريغ الكاش بنجاح، جاري إعادة التحميل...', 'info');
      setTimeout(()=>window.location.reload(), 600);
    }
  };
}

/* 10. AI Settings (إعدادات وتكامل Google Gemini AI) */
function renderAiSettings(main){
  const cfg = getGeminiSettings();
  const hasKey = !!cfg.apiKey;

  main.innerHTML = `
    ${renderSettingsNavHeader('الذكاء الاصطناعي (Google Gemini)', 'تكامل نماذج الذكاء الاصطناعي لتشخيص الأعطال، واقتراح القياسات، وصياغة تقارير المقايسة')}

    <div class="card" style="border-right:4px solid #7c3aed;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="display:inline-flex;">${getSvgIcon('chart', 22)}</span>
          <h3 style="margin:0;font-size:16px;">إعدادات وتكامل Google Gemini API</h3>
        </div>
        <span class="status-badge ${hasKey ? 'st-done' : 'st-repair'}">
          ${hasKey ? 'تم ضبط المفتاح بنجاح' : 'غير مهيأ (بانتظار المفتاح)'}
        </span>
      </div>

      <p style="font-size:13px;color:var(--ink-secondary);line-height:1.6;margin-bottom:16px;">
        يدعم نظام ميكروتك ERP التكامل مع أحدث نماذج <b>Google Gemini</b> الرسمية. يُستخدم الذكاء الاصطناعي كمساعد وخبير تقني للفنيين لتشخيص الأعطال واقتراح المكونات البديلة ونقاط الفحص بالآفوميتر، وصياغة تقارير مقايسة التكلفة للعميل عبر واتساب.
      </p>

      <div style="display:grid;grid-template-columns:1fr;gap:14px;max-width:680px;">
        <!-- API Key Input -->
        <div class="field">
          <label style="font-weight:700;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
            <span>مفتاح Google Gemini API:</span>
            <a href="https://aistudio.google.com/apikey" target="_blank" style="font-size:11.5px;color:var(--primary);text-decoration:none;font-weight:600;">
              الحصول على مفتاح مجاني من Google AI Studio ↗
            </a>
          </label>
          <div style="display:flex;gap:6px;">
            <input type="password" id="geminiApiKeyInput" value="${escapeHtml(cfg.apiKey)}" placeholder="AIzaSy..." class="mono" style="flex:1;direction:ltr;font-size:13px;padding:8px 10px;">
            <button type="button" class="btn btn-ghost btn-sm" id="toggleApiKeyVisBtn" title="إظهار/إخفاء المفتاح">${getSvgIcon("eye", 13)}</button>
          </div>
          <div style="font-size:11.5px;color:var(--ink-secondary);margin-top:4px;">
            يتم حفظ المفتاح بأمان في المتصفح ومزامنته مع إعدادات النظام.
          </div>
        </div>

        <!-- Model Selector -->
        <div class="field">
          <label style="font-weight:700;">النموذج الافتراضي (Model):</label>
          <select id="geminiModelSelect" style="font-size:13px;padding:8px 10px;">
            <option value="gemini-3.5-flash" ${cfg.model==='gemini-3.5-flash'?'selected':''}>gemini-3.5-flash (الموصى به - متوازن وفائق الدقة في التشخيص)</option>
            <option value="gemini-3.5-flash-lite" ${cfg.model==='gemini-3.5-flash-lite'?'selected':''}>gemini-3.5-flash-lite (فائق السرعة وخفيف جداً - استجابة فورية)</option>
            <option value="gemini-3.8-flash" ${cfg.model==='gemini-3.8-flash'?'selected':''}>gemini-3.8-flash (النموذج التجريبي الأحدث)</option>
            <option value="gemini-3.1-pro-preview" ${cfg.model==='gemini-3.1-pro-preview'?'selected':''}>gemini-3.1-pro-preview (تفكير تحليلي عميق للمخططات والأعطال المعقدة)</option>
          </select>
          <div style="font-size:11.5px;color:var(--ink-secondary);margin-top:4px;">
            نماذج Google الرسمية المحدثة والمعتمدة.
          </div>
        </div>

        <!-- System Prompt Customization -->
        <div class="field">
          <label style="font-weight:700;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
            <span>التعليمات التوجيهية للنظام (System Instructions):</span>
            <button type="button" class="btn btn-xs btn-ghost" id="resetSystemPromptBtn" style="font-size:11px;">استعادة النص الافتراضي</button>
          </label>
          <textarea id="geminiSystemPromptInput" rows="3" style="font-size:12.5px;line-height:1.5;">${escapeHtml(cfg.systemInstruction)}</textarea>
          <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">
            تحدد هوية وأسلوب الذكاء الاصطناعي وخبرته في إلكترونيات ميكروتك.
          </div>
        </div>

        <!-- Test Connection Result Box -->
        <div id="testConnResultBox" style="display:none;padding:10px 14px;border-radius:8px;font-size:12.5px;margin-top:4px;"></div>

        <!-- Action Buttons -->
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;">
          <button type="button" class="btn btn-primary" id="saveAiSettingsBtn" style="background:#7c3aed;border-color:#7c3aed;font-weight:700;padding:8px 20px;">
            ${getSvgIcon("check", 14)} حفظ إعدادات الذكاء الاصطناعي
          </button>
          <button type="button" class="btn btn-ghost" id="testAiConnBtn" style="font-weight:700;display:inline-flex;align-items:center;gap:6px;">
            <span>${getSvgIcon("refresh", 13)}</span> اختبار الاتصال الآن
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Guide Card -->
    <div class="card" style="margin-top:16px;">
      <h3 style="margin:0 0 10px 0;font-size:15px;display:flex;align-items:center;gap:6px;">
        <span>${getSvgIcon("info", 13)}</span> كيف تحصل على مفتاح Google Gemini API مجاناً؟
      </h3>
      <ol style="font-size:13px;color:var(--ink-secondary);line-height:1.8;padding-right:20px;margin:0;">
        <li>قم بزيارة <a href="https://aistudio.google.com/apikey" target="_blank" style="color:var(--primary);font-weight:700;">Google AI Studio ↗</a> وسجل الدخول بحساب Google الخاص بك.</li>
        <li>انقر على زر <b>"Create API key"</b>.</li>
        <li>انسخ المفتاح الذي يظهر لك وضعه في حقل المفتاح أعلاه ثم اضغط <b>"اختبار الاتصال الآن"</b> ثم <b>"حفظ"</b>.</li>
        <li>حسابك يتضمن حصة مجانية كريمة من Google تكفي لآلاف عمليات الفحص الشهرية لمركز الصيانة.</li>
      </ol>
    </div>
  `;

  attachSettingsQuickTabEvents(main);

  const keyInput = document.getElementById('geminiApiKeyInput');
  const visBtn = document.getElementById('toggleApiKeyVisBtn');
  if(visBtn && keyInput){
    visBtn.onclick = () => {
      keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
    };
  }

  const resetPromptBtn = document.getElementById('resetSystemPromptBtn');
  if(resetPromptBtn){
    resetPromptBtn.onclick = () => {
      document.getElementById('geminiSystemPromptInput').value = DEFAULT_GEMINI_SETTINGS.systemInstruction;
    };
  }

  const testBtn = document.getElementById('testAiConnBtn');
  const resultBox = document.getElementById('testConnResultBox');
  if(testBtn){
    testBtn.onclick = async () => {
      const k = keyInput.value.trim();
      const m = document.getElementById('geminiModelSelect').value;
      testBtn.disabled = true;
      const origHtml = testBtn.innerHTML;
      testBtn.innerHTML = '<span>جاري الاختبار...</span>';
      resultBox.style.display = 'none';

      try {
        const res = await testGeminiConnection(k, m);
        resultBox.style.display = 'block';
        resultBox.style.background = 'rgba(16,185,129,0.1)';
        resultBox.style.border = '1px solid var(--green)';
        resultBox.style.color = '#047857';
        resultBox.innerHTML = `
          <div style="font-weight:700;display:flex;align-items:center;gap:6px;">${getSvgIcon("check", 14)} الاتصال ناجح ومستقر!</div>
          <div style="font-size:11.5px;margin-top:2px;">النموذج: <b>${res.model}</b> • زمن الاستجابة: <b>${res.latencyMs} مللي ثانية</b> • رد الذكاء: "${escapeHtml(res.reply)}"</div>
        `;
        showToast('تم التحقق من الاتصال بنجاح', 'success');
      } catch(err){
        resultBox.style.display = 'block';
        resultBox.style.background = 'rgba(239,68,68,0.1)';
        resultBox.style.border = '1px solid var(--red)';
        resultBox.style.color = '#b91c1c';
        resultBox.innerHTML = `
          <div style="font-weight:700;display:flex;align-items:center;gap:6px;">${getSvgIcon("alert", 14)} فشل الاتصال:</div>
          <div style="font-size:11.5px;margin-top:2px;">${escapeHtml(err.message || 'حدث خطأ في الاتصال')}</div>
        `;
        showToast('فشل اختبار الاتصال', 'error');
      } finally {
        testBtn.disabled = false;
        testBtn.innerHTML = origHtml;
      }
    };
  }

  const saveBtn = document.getElementById('saveAiSettingsBtn');
  if(saveBtn){
    saveBtn.onclick = async () => {
      const k = keyInput.value.trim();
      const m = document.getElementById('geminiModelSelect').value;
      const sys = document.getElementById('geminiSystemPromptInput').value.trim();

      const newSettings = {
        enabled: true,
        apiKey: k,
        model: m,
        temperature: 0.7,
        systemInstruction: sys || DEFAULT_GEMINI_SETTINGS.systemInstruction
      };

      if(!state.settings) state.settings = {};
      state.settings.gemini = newSettings;
      // S13: Do not store the plain API key in persistent localStorage cache
      const diskSafeSettings = JSON.parse(JSON.stringify(state.settings));
      if (diskSafeSettings.gemini && diskSafeSettings.gemini.apiKey) {
        delete diskSafeSettings.gemini.apiKey;
      }
      setCache('settings', diskSafeSettings);
      sessionStorage.setItem('microtech_gemini_api_key', k);
      try { localStorage.removeItem('microtech_gemini_api_key'); } catch(e){}

      saveBtn.disabled = true;
      saveBtn.textContent = 'جاري الحفظ...';

      try {
        await saveSettingRemote('gemini', JSON.stringify(newSettings));
        showToast('تم حفظ إعدادات الذكاء الاصطناعي بنجاح', 'success');
      } catch(err){
        showToast('تم الحفظ محلياً في المتصفح بنجاح', 'info');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '${getSvgIcon("check", 14)} حفظ إعدادات الذكاء الاصطناعي';
        renderAiSettings(main);
      }
    };
  }
}

/* ============================================================
   Universal Barcode Label Studio (استوديو طباعة الباركود الشامل)
   ============================================================ */
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

  const shopName = (state.settings && state.settings.shopName) || 'صيانة ميكروتك';
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
      <button id="closeInvoiceBarcodeModalBtn" style="background: rgba(255,255,255,0.1); border: none; color: #cbd5e1; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">&times;</button>
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

function openRestoreConfirmationModal(backupData){
  const existingModal = document.getElementById('restoreConfirmModalOverlay');
  if(existingModal) existingModal.remove();

  const overlay = document.createElement('div');
  overlay.id = 'restoreConfirmModalOverlay';
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'z-index: 10060; display:flex; align-items:center; justify-content:center; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(4px);';

  const modal = document.createElement('div');
  modal.className = 'modal-card';
  modal.style.cssText = 'max-width: 680px; width: 95%; max-height: 90vh; background: var(--bg-card, #fff); border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4); overflow: hidden; display: flex; flex-direction: column; border: 2px solid var(--red, #ef4444);';

  const sheets = backupData.sheets || {};
  const sheetEntries = Object.keys(sheets).map(k => ({
    name: k,
    count: Array.isArray(sheets[k]) ? sheets[k].length : 0
  })).filter(s => s.count > 0);

  const totalRecords = sheetEntries.reduce((acc, s) => acc + s.count, 0);

  modal.innerHTML = `
    <div style="padding: 16px 22px; background: linear-gradient(135deg, #b91c1c, #991b1b); color: #fff; display: flex; align-items: center; justify-content: space-between;">
      <div style="display:flex; align-items:center; gap: 12px;">
        <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(255, 255, 255, 0.2); display:flex; align-items:center; justify-content:center;">${getSvgIcon("alert", 22)}</div>
        <div>
          <h3 style="margin: 0; font-size: 16px; font-weight: 900; color: #fff;">تأكيد استعادة النسخة الاحتياطية للنظام</h3>
          <div style="font-size: 11.5px; color: rgba(255,255,255,0.85); margin-top: 2px;">استبدال ومزامنة جداول النظام بالنسخة المختارة</div>
        </div>
      </div>
      <button id="closeRestoreModalBtn" style="background: rgba(255,255,255,0.15); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;">&times;</button>
    </div>

    <div style="padding: 20px 24px; overflow-y: auto; max-height: calc(90vh - 140px);">
      <!-- Metadata summary -->
      <div style="background: var(--paper2); border: 1px solid var(--line); border-radius: var(--radius); padding: 14px 16px; margin-bottom: 16px;">
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; font-size: 12.5px;">
          <div><span style="color:var(--ink-secondary);">تاريخ النسخة:</span> <b class="mono" style="margin-right:6px;">${escapeHtml(backupData.timestamp ? backupData.timestamp.slice(0,19).replace('T',' ') : 'غير محدد')}</b></div>
          <div><span style="color:var(--ink-secondary);">تم التصدير بواسطة:</span> <b style="margin-right:6px;">${escapeHtml(backupData.exportedBy || 'admin')}</b></div>
          <div><span style="color:var(--ink-secondary);">إصدار المخطط:</span> <b class="mono" style="margin-right:6px;">v${backupData.schemaVersion || 1}</b></div>
          <div><span style="color:var(--ink-secondary);">إجمالي السجلات:</span> <b class="mono" style="margin-right:6px; color:var(--primary); font-size:14px;">${totalRecords}</b></div>
        </div>
      </div>

      <!-- Sheet counts grid -->
      <h4 style="margin: 0 0 10px 0; font-size: 13.5px; font-weight: 800;">محتويات النسخة الاحتياطية (${sheetEntries.length} جدول):</h4>
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; margin-bottom: 20px;">
        ${sheetEntries.map(s => `
          <div style="background:var(--paper3); border:1px solid var(--line); border-radius:6px; padding:8px 10px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; font-weight:600;">${s.name}</span>
            <span class="status-badge st-done mono" style="font-size:11px;">${s.count}</span>
          </div>
        `).join('')}
      </div>

      <!-- Warning Callout -->
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-right: 4px solid #ef4444; border-radius: 8px; padding: 14px 16px; color: #991b1b; margin-bottom: 20px;">
        <div style="font-weight: 800; font-size: 13px; margin-bottom: 6px;">⚠️ تنبيه عالي الخطورة:</div>
        <p style="font-size: 12px; line-height: 1.6; margin: 0;">
          استعادة هذه النسخة ستقوم باستبدال كافة البيانات الحالية في Google Sheets بالبيانات الموجودة في هذا الملف.
          (يقوم النظام تلقائياً بأخذ لقطة سريعة في Google Drive لحماية البيانات قبل التغيير).
        </p>
      </div>

      <!-- Confirmation input -->
      <div class="field" style="margin-bottom: 10px;">
        <label style="font-weight: 800; font-size: 13px; display: block; margin-bottom: 6px;">
          لتأكيد الاستعادة، يرجى كتابة كلمة <span style="color: #b91c1c; font-weight: 900;">استعادة</span> في الحقل أدناه:
        </label>
        <input type="text" id="restoreConfirmTextInput" placeholder="اكتب: استعادة" style="width: 100%; padding: 10px 14px; border: 2px solid var(--line); border-radius: var(--radius); font-size: 14px;">
      </div>
    </div>

    <div style="padding: 14px 24px; background: var(--paper2); border-top: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center;">
      <button class="btn btn-ghost" id="cancelRestoreBtn">إلغاء الأمر</button>
      <button class="btn btn-danger" id="executeRestoreBtn" disabled style="opacity: 0.5; cursor: not-allowed; min-width: 190px;">
        ${getSvgIcon("download", 14)} تأكيد وبدء الاستعادة
      </button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const closeFn = () => overlay.remove();
  overlay.querySelector('#closeRestoreModalBtn').onclick = closeFn;
  overlay.querySelector('#cancelRestoreBtn').onclick = closeFn;

  const input = modal.querySelector('#restoreConfirmTextInput');
  const execBtn = modal.querySelector('#executeRestoreBtn');

  input.oninput = () => {
    const val = input.value.trim().toLowerCase();
    const isConfirmed = (val === 'استعادة' || val === 'restore');
    execBtn.disabled = !isConfirmed;
    execBtn.style.opacity = isConfirmed ? '1' : '0.5';
    execBtn.style.cursor = isConfirmed ? 'pointer' : 'not-allowed';
  };

  execBtn.onclick = async () => {
    execBtn.disabled = true;
    execBtn.innerHTML = 'جاري استعادة البيانات على السيرفر...';
    showToast('جاري رفع واستعادة كافة جداول النظام على السيرفر...', 'info', 20000);

    try {
      const res = await apiPostDirect('importBackup', { backup: backupData, confirmed: true }, 90000);
      if(res && res.ok){
        // Hydrate state
        const s = backupData.sheets;
        if(s.Receipts) { state.receipts = s.Receipts; setCache('receipts', state.receipts); }
        if(s.Invoices) { state.invoices = s.Invoices; setCache('invoices', state.invoices); }
        if(s.Customers) { state.customers = s.Customers; setCache('customers', state.customers); }
        if(s.Inventory) { state.inventory = s.Inventory; setCache('inventory', state.inventory); }
        if(s.Sales) { state.sales = s.Sales; setCache('sales', state.sales); }
        if(s.Expenses) { state.expenses = s.Expenses; setCache('expenses', state.expenses); }
        if(s.JournalEntries) { state.journalEntries = s.JournalEntries; setCache('journal', state.journalEntries); }
        if(s.Accounts) { state.accounts = s.Accounts; setCache('accounts', state.accounts); }
        if(s.Purchases) { state.purchases = s.Purchases; setCache('purchases', state.purchases); }
        if(s.Suppliers) { state.suppliers = s.Suppliers; setCache('suppliers', state.suppliers); }
        if(s.Quotations) { state.quotations = s.Quotations; setCache('quotations', state.quotations); }
        if(s.Sites) { state.cctvSites = s.Sites; setCache('cctv_sites', state.cctvSites); }
        if(s.Projects) { state.cctvProjects = s.Projects; setCache('cctv_projects', state.cctvProjects); }
        if(s.ProjectDevices) { state.cctvDevices = s.ProjectDevices; setCache('cctv_devices', state.cctvDevices); }
        if(s.ServiceVisits) { state.cctvVisits = s.ServiceVisits; setCache('cctv_visits', state.cctvVisits); }
        if(s.MaintenanceContracts) { state.cctvContracts = s.MaintenanceContracts; setCache('cctv_contracts', state.cctvContracts); }
        if(s.ProjectMilestones) { state.cctvMilestones = s.ProjectMilestones; setCache('cctv_milestones', state.cctvMilestones); }

        recordAuditLog('استعادة نسخة احتياطية', 'backup', 'استعادة شاملة بنجاح، إجمالي السجلات: ' + totalRecords, '', 'مكتمل');
        overlay.remove();
        showToast('تمت استعادة كافة البيانات بنجاح! جاري تحديث الشاشة...', 'success', 5000);
        setTimeout(() => {
          const main = document.getElementById('main');
          if(main) renderBackupRestoreSettings(main);
        }, 1000);
      } else {
        throw new Error(res.error || 'فشلت عملية الاستعادة على السيرفر');
      }
    } catch(err) {
      showToast('تعذر استعادة البيانات: ' + err.message, 'error', 8000);
      execBtn.disabled = false;
      execBtn.innerHTML = `${getSvgIcon("download", 14)} تأكيد وبدء الاستعادة`;
    }
  };
}

function renderBackupRestoreSettings(main){
  const totalReceipts = (state.receipts || []).length;
  const totalInvoices = (state.invoices || []).length;
  const totalCustomers = (state.customers || []).length;
  const totalInventory = (state.inventory || []).length;
  const totalJournal = (state.journalEntries || []).length;
  const totalProjects = (state.cctvProjects || []).length;
  const grandTotal = totalReceipts + totalInvoices + totalCustomers + totalInventory + totalJournal + totalProjects;

  main.innerHTML = `
    ${renderSettingsNavHeader('النسخ الاحتياطي واستعادة البيانات', 'تصدير واستعادة ملفات JSON الشاملة، النسخ السحابي التلقائي على Google Drive، وتصدير الجداول بصيغة Excel/CSV')}

    <!-- Overview & Live Database Metrics -->
    <div class="card" style="border-right: 4px solid var(--primary);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <div>
          <h3 style="margin:0; font-size:16px;">مركز الأمان وإدارة النسخ الاحتياطية</h3>
          <p style="font-size:12.5px; color:var(--ink-secondary); margin:4px 0 0 0;">
            إدارة شاملة لحفظ واسترجاع كافة بيانات المؤسسة وضمان عدم فقدان أي سجل مالي أو فني.
          </p>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="status-badge st-done">إجمالي السجلات: ${grandTotal}</span>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-top: 14px;">
        <div style="background:var(--paper3); border:1px solid var(--line); border-radius:var(--radius-sm); padding:10px 12px; text-align:center;">
          <div style="font-size:11px; color:var(--ink-secondary);">إيصالات الصيانة</div>
          <div class="num mono" style="font-size:17px; font-weight:800; color:var(--primary); margin-top:4px;">${totalReceipts}</div>
        </div>
        <div style="background:var(--paper3); border:1px solid var(--line); border-radius:var(--radius-sm); padding:10px 12px; text-align:center;">
          <div style="font-size:11px; color:var(--ink-secondary);">فواتير المبيعات</div>
          <div class="num mono" style="font-size:17px; font-weight:800; color:var(--primary); margin-top:4px;">${totalInvoices}</div>
        </div>
        <div style="background:var(--paper3); border:1px solid var(--line); border-radius:var(--radius-sm); padding:10px 12px; text-align:center;">
          <div style="font-size:11px; color:var(--ink-secondary);">دليل العملاء</div>
          <div class="num mono" style="font-size:17px; font-weight:800; color:var(--primary); margin-top:4px;">${totalCustomers}</div>
        </div>
        <div style="background:var(--paper3); border:1px solid var(--line); border-radius:var(--radius-sm); padding:10px 12px; text-align:center;">
          <div style="font-size:11px; color:var(--ink-secondary);">المخزون والأصناف</div>
          <div class="num mono" style="font-size:17px; font-weight:800; color:var(--primary); margin-top:4px;">${totalInventory}</div>
        </div>
        <div style="background:var(--paper3); border:1px solid var(--line); border-radius:var(--radius-sm); padding:10px 12px; text-align:center;">
          <div style="font-size:11px; color:var(--ink-secondary);">القيود المحاسبية</div>
          <div class="num mono" style="font-size:17px; font-weight:800; color:var(--primary); margin-top:4px;">${totalJournal}</div>
        </div>
        <div style="background:var(--paper3); border:1px solid var(--line); border-radius:var(--radius-sm); padding:10px 12px; text-align:center;">
          <div style="font-size:11px; color:var(--ink-secondary);">المشاريع والعقود</div>
          <div class="num mono" style="font-size:17px; font-weight:800; color:var(--primary); margin-top:4px;">${totalProjects}</div>
        </div>
      </div>
    </div>

    <!-- Section 1 & 2: Export & Import Full JSON Backup -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:18px; margin-bottom:18px;">
      <!-- Export Full Backup -->
      <div class="card" style="border-right:4px solid #0284c7;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
          <span style="color:#0284c7;">${getSvgIcon("download", 20)}</span>
          <h3 style="margin:0; font-size:15.5px;">تصدير نسخة احتياطية شاملة (JSON)</h3>
        </div>
        <p style="font-size:12.5px; color:var(--ink-secondary); line-height:1.6; margin-bottom:16px;">
          توليد ملف JSON موثق وشامل يحوي كافة جداول وبيانات النظام، مع تشفير وحماية كلمات المرور ورموز الاعتماد لمنع أي تسريب.
        </p>
        <div style="display:flex; flex-direction:column; gap:10px;">
          <button class="btn btn-primary" id="exportServerBackupBtn" style="justify-content:center;">
            ${getSvgIcon("refresh", 14)} تصدير نسخة سحابية كاملة (من السيرفر)
          </button>
          <button class="btn btn-ghost" id="exportLocalBackupBtn" style="justify-content:center;">
            ${getSvgIcon("download", 14)} تصدير نسخة من البيانات المحلية (الكاش الحالي)
          </button>
        </div>
      </div>

      <!-- Restore Full Backup -->
      <div class="card" style="border-right:4px solid #ef4444;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
          <span style="color:#ef4444;">${getSvgIcon("alert", 20)}</span>
          <h3 style="margin:0; font-size:15.5px;">استعادة نسخة احتياطية للنظام (Restore)</h3>
        </div>
        <p style="font-size:12.5px; color:var(--ink-secondary); line-height:1.6; margin-bottom:16px;">
          استعادة النظام بالكامل من ملف JSON سابق. يتضمن الفحص الآلي للمخطط وتأكيد كلمة المرور والتقاط نسخة احتياطية تلقائية قبل الاستعادة.
        </p>
        <input type="file" id="restoreBackupFileInput" accept=".json,application/json" style="display:none;">
        <button class="btn btn-danger" id="triggerRestoreFileBtn" style="width:100%; justify-content:center;">
          ${getSvgIcon("download", 14)} اختيار ملف النسخة الاحتياطية (.json)
        </button>
        <div style="font-size:11px; color:#ef4444; margin-top:8px; text-align:center;">
          ⚠️ تحذير: هذه العملية تستبدل كافة الجداول الموجودة بالنسخة المستعادة.
        </div>
      </div>
    </div>

    <!-- Section 3: Google Drive Automated Snapshots -->
    <div class="card" style="border-right:4px solid #10b981; margin-bottom:18px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:#10b981;">${getSvgIcon("store", 20)}</span>
          <h3 style="margin:0; font-size:15.5px;">النسخ الاحتياطي التلقائي على Google Drive</h3>
        </div>
        <span class="status-badge st-done">حفظ تلقائي لآخر 30 نسخة</span>
      </div>
      <p style="font-size:12.5px; color:var(--ink-secondary); line-height:1.6; margin-bottom:14px;">
        يقوم محرك السيرفر بنسخ ملف جدول البيانات بالكامل في مجلد آمن ومستقل على <b>Google Drive</b> (باسم <code>microERP_Backups</code>) مع تدوير النسخ وحذف الأقدم تلقائياً.
      </p>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn btn-primary" id="runDriveSnapshotNowBtn">
          ${getSvgIcon("refresh", 14)} أخذ لقطة سحابية على Google Drive الآن
        </button>
        <button class="btn btn-ghost" id="setupDriveDailyTriggerBtn">
          ${getSvgIcon("printer", 14)} تفعيل الجدولة اليومية التلقائية (2:00 ص)
        </button>
      </div>
    </div>

    <!-- Section 4: CSV / Excel Export Per Sheet -->
    <div class="card" style="border-right:4px solid #f59e0b;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:#f59e0b;">${getSvgIcon("pos", 20)}</span>
          <h3 style="margin:0; font-size:15.5px;">تصدير الجداول بصيغة Excel / CSV (معزولة ومؤمنة)</h3>
        </div>
        <button class="btn btn-primary btn-sm" id="exportAllSheetsCsvBtn">
          ${getSvgIcon("download", 13)} تصدير كافة الجداول دفعة واحدة (CSV Archive)
        </button>
      </div>
      <p style="font-size:12px; color:var(--ink-secondary); margin-bottom:16px;">
        تصدير جداول النظام بصيغة CSV المتوافقة تماماً مع Microsoft Excel بمواصفة RFC 4180، مع تطبيق فحص <code>csvSafe</code> لتعقيم الخلايا وحماية الأمان ضد هجمات Formula Injection.
      </p>

      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap:10px;">
        <button class="btn btn-ghost btn-sm" data-csv-sheet="receipts" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("tool", 14)} إيصالات الصيانة (${totalReceipts})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="invoices" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("pos", 14)} فواتير المبيعات (${totalInvoices})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="customers" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("users", 14)} دليل العملاء (${totalCustomers})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="inventory" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("barcode", 14)} المخزون وقطع الغيار (${totalInventory})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="sales" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("pos", 14)} المبيعات اليومية (${(state.sales||[]).length})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="returns" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("refresh", 14)} مرتجعات المبيعات
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="expenses" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("chart", 14)} المصروفات والمنصرفات (${(state.expenses||[]).length})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="journal" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("shield", 14)} قيود اليومية (${totalJournal})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="accounts" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("store", 14)} دليل شجرة الحسابات (${(state.accounts||[]).length})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="purchases" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("store", 14)} فواتير المشتريات (${(state.purchases||[]).length})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="suppliers" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("users", 14)} حسابات الموردين (${(state.suppliers||[]).length})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="quotations" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("message", 14)} عروض الأسعار (${(state.quotations||[]).length})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="cctv_projects" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("tool", 14)} مشاريع الكاميرات (${totalProjects})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="cctv_contracts" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("shield", 14)} عقود الصيانة الدورية (${(state.cctvContracts||[]).length})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="audit_log" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("shield", 14)} سجل الرقابة وتتبع العمليات
        </button>
      </div>
    </div>
  `;

  attachSettingsQuickTabEvents(main);

  // Attach Handlers
  // 1. Export Server Backup
  document.getElementById('exportServerBackupBtn').onclick = async () => {
    showToast('جاري استخراج النسخة الاحتياطية السحابية من Google Sheets...', 'info');
    try {
      const res = await apiPostDirect('exportBackup', {}, 60000);
      if(res && res.ok && res.backup){
        const dateStr = new Date().toISOString().slice(0,10);
        const timeStr = new Date().toTimeString().slice(0,5).replace(':','-');
        downloadJsonFile(`microERP_CloudBackup_${dateStr}_${timeStr}.json`, res.backup);
        showToast('تم تحميل النسخة الاحتياطية السحابية بنجاح', 'success');
        recordAuditLog('تصدير نسخة احتياطية', 'backup', 'تصدير سحابي شامل', '', 'مكتمل');
      } else {
        throw new Error(res.error || 'فشل استلام ملف النسخة الاحتياطية من السيرفر');
      }
    } catch(err) {
      showToast('تعذر تصدير النسخة السحابية: ' + err.message, 'error');
    }
  };

  // 2. Export Local Backup
  document.getElementById('exportLocalBackupBtn').onclick = () => {
    try {
      const localBackup = createLocalBackupPayload();
      const dateStr = new Date().toISOString().slice(0,10);
      const timeStr = new Date().toTimeString().slice(0,5).replace(':','-');
      downloadJsonFile(`microERP_LocalBackup_${dateStr}_${timeStr}.json`, localBackup);
      showToast('تم تحميل النسخة الاحتياطية المحلية بنجاح', 'success');
      recordAuditLog('تصدير نسخة احتياطية', 'backup', 'تصدير محلي', '', 'مكتمل');
    } catch(err) {
      showToast('تعذر تصدير النسخة المحلية: ' + err.message, 'error');
    }
  };

  // 3. Restore File Picker
  const fileInput = document.getElementById('restoreBackupFileInput');
  document.getElementById('triggerRestoreFileBtn').onclick = () => fileInput.click();

  fileInput.onchange = (e) => {
    const file = e.target.files && e.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = (re) => {
      let backupData;
      try {
        backupData = JSON.parse(re.target.result);
      } catch(parseErr) {
        showToast('الملف المختار ليس بصيغة JSON صالحة', 'error');
        return;
      }
      if(!backupData || backupData.appName !== 'microERP' || !backupData.sheets){
        showToast('الملف المختار ليس ملف نسخة احتياطية صالح لنظام ميكروERP', 'error');
        return;
      }
      openRestoreConfirmationModal(backupData);
      fileInput.value = ''; // Reset input
    };
    reader.onerror = () => {
      showToast('حدث خطأ أثناء قراءة الملف من القرص', 'error');
    };
    reader.readAsText(file);
  };

  // 4. Drive Snapshot Now
  document.getElementById('runDriveSnapshotNowBtn').onclick = async () => {
    showToast('جاري التقاط نسخة كاملة على Google Drive...', 'info');
    try {
      const res = await apiPostDirect('runDailyBackupNow', {}, 45000);
      if(res && res.ok){
        showToast('تم أخذ لقطة سحابية على Google Drive بنجاح: ' + (res.backupName || ''), 'success', 6000);
      } else {
        throw new Error(res.error || 'فشل إنشاء اللقطة');
      }
    } catch(err) {
      showToast('تعذر أخذ لقطة Google Drive: ' + err.message, 'error');
    }
  };

  // 5. Setup Drive Daily Trigger
  document.getElementById('setupDriveDailyTriggerBtn').onclick = async () => {
    showToast('جاري تفعيل الجدولة اليومية على Google Apps Script...', 'info');
    try {
      const res = await apiPostDirect('setupDailyBackupTrigger', {}, 30000);
      if(res && res.ok){
        showToast(res.message || 'تم تفعيل النسخ الاحتياطي التلقائي اليومي بنجاح', 'success', 5000);
      } else {
        throw new Error(res.error || 'فشل تفعيل الجدولة');
      }
    } catch(err) {
      showToast('تعذر تفعيل الجدولة: ' + err.message, 'error');
    }
  };

  // 6. CSV Single Sheet Buttons
  main.querySelectorAll('[data-csv-sheet]').forEach(btn => {
    btn.onclick = () => {
      const key = btn.dataset.csvSheet;
      exportSheetToCSV(key);
    };
  });

  // 7. CSV Export All Sheets
  document.getElementById('exportAllSheetsCsvBtn').onclick = () => {
    exportAllSheetsCSV();
  };
}
