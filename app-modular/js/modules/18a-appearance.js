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
        <div id="networkSyncPill" class="sync-pill online" onclick="syncOfflineQueue(true)"><span class="sync-dot"></span><span>متصل</span></div>
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
          <label>كود الدولة الافتراضي لأرقام واتساب</label>
          <input id="setWaCountryCode" class="mono" value="${s.waCountryCode||'20'}" placeholder="20">
          <div style="font-size:11px;color:var(--ink-secondary);margin-top:4px;line-height:1.5;">
            يُستخدم تلقائياً عند كتابة رقم محلي بدون كود الدولة (مثال: 01012345678 ← 201012345678). اتركه <b class="mono">20</b> لمصر، و<b class="mono">966</b> للسعودية، و<b class="mono">971</b> للإمارات.
          </div>
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
    s.waCountryCode = (document.getElementById('setWaCountryCode').value || '20').replace(/[^0-9]/g, '') || '20';
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
      await saveSettingRemote('waCountryCode', s.waCountryCode);
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
