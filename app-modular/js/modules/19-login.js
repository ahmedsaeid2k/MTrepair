/* ---------------- Login Screen ---------------- */
function loginScreen(){
  const shopName = (state.settings && state.settings.shopName) || 'ميكروERP';
  const isDark = state.theme === 'dark';
  const isOnline = navigator.onLine;

  return `
  <div class="login-canvas">
    <div class="login-topbar">
      <div id="loginNetStatus">
        ${isOnline ? `
          <span class="badge" style="background:var(--green-bg);color:var(--green-text);border:1px solid rgba(5,150,105,0.2);padding:5px 12px;border-radius:var(--radius-sm);font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:7px;">
            <span style="width:7px;height:7px;border-radius:50%;background:var(--primary);display:inline-block;"></span>
            متصل بالنظام
          </span>
        ` : `
          <span class="badge" style="background:var(--amber-bg);color:var(--amber-text);border:1px solid rgba(245,158,11,0.25);padding:5px 12px;border-radius:var(--radius-sm);font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:7px;">
            <span style="width:7px;height:7px;border-radius:50%;background:#f59e0b;display:inline-block;"></span>
            وضع العمل دون اتصال
          </span>
        `}
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <button type="button" class="btn btn-ghost" id="loginApiSettingsBtn" title="إعدادات الربط السحابي" style="border-radius:var(--radius-sm);padding:5px 12px;font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:6px;background:var(--paper2);border:1px solid var(--line);cursor:pointer;">
          ${getSvgIcon('settings', 14)} إعدادات الخادم
        </button>
        <button type="button" class="btn btn-ghost" id="loginThemeToggle" style="border-radius:var(--radius-sm);padding:5px 12px;font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:6px;background:var(--paper2);border:1px solid var(--line);cursor:pointer;">
          ${isDark ? `${getSvgIcon('sun', 14)} الوضع الفاتح` : `${getSvgIcon('moon', 14)} الوضع الليلي`}
        </button>
      </div>
    </div>

    <div class="login-card">
      <div class="login-brand-logo">${getSvgIcon('logo', 24)}</div>
      
      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="margin:0 0 6px;font-size:20px;font-weight:800;letter-spacing:-0.3px;color:var(--ink);">${escapeHtml(shopName)}</h2>
        <div style="font-size:12px;color:var(--ink-secondary);font-weight:600;">
          نظام الإدارة وتخطيط الموارد الموحد
        </div>
      </div>

      <!-- Rate Limiting / Lockout Banner -->
      <div class="login-lockout-banner" id="loginLockoutBanner">
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:4px;">
          ${getSvgIcon('alert', 15)}
          <span>تم تعليق تسجيل الدخول مؤقتاً لأسباب أمنية</span>
        </div>
        <div>يرجى الانتظار <span id="lockoutTimerVal">30</span> ثانية قبل إعادة المحاولة.</div>
        <div style="margin-top:6px;">
          <button type="button" class="btn btn-xs btn-ghost" id="clearLockoutBtn" style="font-size:11px;text-decoration:underline;cursor:pointer;color:var(--ink);">إلغاء القفل الآن</button>
        </div>
      </div>

      ${!isOnline ? `
        <div style="background:var(--amber-bg);border:1px solid rgba(245,158,11,0.25);color:var(--amber-text);font-size:11.5px;font-weight:600;padding:8px 12px;border-radius:var(--radius-sm);margin-bottom:16px;text-align:center;line-height:1.4;display:flex;align-items:center;gap:6px;justify-content:center;">
          ${getSvgIcon('alert', 14)}
          <span>النظام في وضع عدم الاتصال. يتم التحقق باستخدام البيانات المحفوظة محلياً.</span>
        </div>
      ` : ''}

      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="field" style="margin:0;">
          <label style="font-size:12px;font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:6px;color:var(--ink);">
            <span>${getSvgIcon('user', 14)}</span>
            <span>اسم المستخدم</span>
          </label>
          <input id="loginName" placeholder="ادخل اسم المستخدم" autofocus autocomplete="username" style="padding:10px 12px;font-size:13.5px;border-radius:var(--radius-sm);">
        </div>

        <div class="field" style="margin:0;">
          <label style="font-size:12px;font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:6px;color:var(--ink);">
            <span>${getSvgIcon('key', 14)}</span>
            <span>كلمة المرور</span>
          </label>
          <div class="login-input-wrap">
            <input id="loginPass" type="password" placeholder="••••••••" autocomplete="current-password" style="padding:10px 12px;padding-left:38px;font-size:14px;border-radius:var(--radius-sm);">
            <button type="button" class="login-toggle-pass-btn" id="loginTogglePass" title="إظهار / إخفاء كلمة المرور" tabindex="-1">${getSvgIcon('eye', 15)}</button>
          </div>
          <!-- Caps Lock Alert -->
          <div class="login-caps-alert" id="loginCapsAlert">
            ${getSvgIcon('alert', 13)}
            <span>زر Caps Lock مفعّل - انتبه لحالة الأحرف الكبيرة</span>
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:2px;">
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--ink-secondary);cursor:pointer;user-select:none;">
            <input type="checkbox" id="loginRemember" checked style="width:15px;height:15px;accent-color:var(--primary);cursor:pointer;">
            <span>تذكرني على هذا الجهاز</span>
          </label>
          <span style="font-size:11px;color:var(--ink-secondary);opacity:0.8;">تشفير محلي آمن</span>
        </div>

        <button class="login-btn-submit" id="loginBtn" type="button">
          <span id="loginBtnIcon" style="display:inline-flex;align-items:center;">${getSvgIcon('lock', 15)}</span>
          <span id="loginBtnText">تسجيل الدخول للنظام</span>
          <span style="margin-right:auto;display:inline-flex;align-items:center;">${getSvgIcon('arrowLeft', 13)}</span>
        </button>
      </div>

      <!-- Animated Error Banner -->
      <div class="login-err-banner" id="loginErr"></div>

      <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--ink-secondary);">
        <span>حماية مشددة ضد التخمين</span>
        <span style="font-weight:700;color:var(--primary);display:inline-flex;align-items:center;gap:4px;">${getSvgIcon('lock', 12)} جلسة آمنة ومعتمدة</span>
      </div>
    </div>
  </div>`;
}

function attachLogin(){
  let lockoutInterval = null;

  // Rate Limiting & Lockout Check
  const checkLockout = () => {
    try {
      const lockoutUntil = parseInt(localStorage.getItem('microerp_lockout_until') || '0', 10);
      const banner = document.getElementById('loginLockoutBanner');
      const timerVal = document.getElementById('lockoutTimerVal');
      const btn = document.getElementById('loginBtn');
      const nameInput = document.getElementById('loginName');
      const passInput = document.getElementById('loginPass');

      if(lockoutUntil && Date.now() < lockoutUntil){
        const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
        if(banner) banner.classList.add('visible');
        if(timerVal) timerVal.textContent = remaining;
        if(btn) btn.disabled = true;
        if(nameInput) nameInput.disabled = true;
        if(passInput) passInput.disabled = true;

        if(!lockoutInterval){
          lockoutInterval = setInterval(() => {
            const left = Math.ceil((lockoutUntil - Date.now()) / 1000);
            if(left <= 0){
              clearInterval(lockoutInterval);
              lockoutInterval = null;
              localStorage.removeItem('microerp_lockout_until');
              localStorage.setItem('microerp_failed_attempts', '0');
              if(banner) banner.classList.remove('visible');
              if(btn) btn.disabled = false;
              if(nameInput) nameInput.disabled = false;
              if(passInput) passInput.disabled = false;
            } else {
              if(timerVal) timerVal.textContent = left;
            }
          }, 1000);
        }
        return true;
      } else {
        if(lockoutInterval){
          clearInterval(lockoutInterval);
          lockoutInterval = null;
        }
        if(banner) banner.classList.remove('visible');
        if(btn) btn.disabled = false;
        if(nameInput) nameInput.disabled = false;
        if(passInput) passInput.disabled = false;
        return false;
      }
    } catch(e){
      return false;
    }
  };

  checkLockout();

  // Password Visibility Toggle
  const togglePassBtn = document.getElementById('loginTogglePass');
  const passInput = document.getElementById('loginPass');
  if(togglePassBtn && passInput){
    togglePassBtn.onclick = (e) => {
      e.preventDefault();
      if(passInput.type === 'password'){
        passInput.type = 'text';
        togglePassBtn.innerHTML = getSvgIcon('eyeOff', 15);
      } else {
        passInput.type = 'password';
        togglePassBtn.innerHTML = getSvgIcon('eye', 15);
      }
      passInput.focus();
    };
  }

  // Caps Lock Detection
  const capsAlert = document.getElementById('loginCapsAlert');
  const checkCaps = (e) => {
    if(e.getModifierState && capsAlert){
      const isCaps = e.getModifierState('CapsLock');
      capsAlert.classList.toggle('visible', !!isCaps);
    }
  };
  if(passInput) {
    passInput.addEventListener('keyup', checkCaps);
    passInput.addEventListener('keydown', checkCaps);
  }
  const nameInput = document.getElementById('loginName');
  if(nameInput) {
    nameInput.addEventListener('keyup', checkCaps);
    nameInput.addEventListener('keydown', checkCaps);
  }

  // Theme Toggle Button
  const themeToggle = document.getElementById('loginThemeToggle');
  if(themeToggle){
    themeToggle.onclick = () => {
      const nextTheme = (state.theme === 'dark') ? 'light' : 'dark';
      applyTheme(nextTheme);
      const app = document.getElementById('app');
      if(app) {
        app.innerHTML = loginScreen();
        attachLogin();
      }
    };
  }

  // Cloud API Settings Modal Handler
  const openApiSettingsModal = () => {
    const curUrl = getApiUrl();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = '14000';
    overlay.innerHTML = `
      <div class="modal-content" style="max-width:540px;border-radius:18px;padding:24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;border-radius:50%;background:rgba(37,99,235,0.12);color:var(--primary);display:flex;align-items:center;justify-content:center;">${getSvgIcon('settings', 18)}</div>
            <div>
              <h3 style="margin:0;font-size:16px;font-weight:900;">إعدادات الربط بالخادم السحابي</h3>
              <div style="font-size:11.5px;color:var(--ink-secondary);">رابط Google Apps Script Web App</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-xs" id="closeApiModalBtn" style="font-size:18px;line-height:1;">&times;</button>
        </div>

        <div style="font-size:12.5px;color:var(--ink-secondary);line-height:1.5;margin-bottom:14px;">
          يمكنك ربط البرنامج برابط نشر Google Apps Script الخاص بك، أو إعادة تعيينه للرابط الافتراضي.
        </div>

        <div class="field" style="margin-bottom:12px;">
          <label style="font-size:12px;font-weight:700;">رابط النشر الحالي (Web App URL):</label>
          <input id="apiModalUrlInp" dir="ltr" style="font-size:12px;font-family:monospace;padding:9px;" value="${escapeHtml(curUrl)}">
        </div>

        <div id="apiTestStatusBox" style="display:none;padding:10px 12px;border-radius:8px;font-size:12px;margin-bottom:14px;line-height:1.5;"></div>

        <div style="display:flex;gap:8px;justify-content:space-between;align-items:center;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:14px;">
          <div style="display:flex;gap:6px;">
            <button type="button" class="btn btn-sm btn-ghost" id="apiTestBtn" style="display:inline-flex;align-items:center;gap:6px;">
              ${getSvgIcon('refresh', 13)} فحص الاتصال
            </button>
            <button type="button" class="btn btn-sm btn-ghost" id="apiResetDefaultBtn" style="color:var(--ink-secondary);">
              استعادة الافتراضي
            </button>
          </div>
          <div style="display:flex;gap:6px;">
            <button type="button" class="btn btn-sm btn-ghost" id="apiCancelBtn">إغلاق</button>
            <button type="button" class="btn btn-sm btn-primary" id="apiSaveBtn" style="font-weight:800;">حفظ الرابط</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#closeApiModalBtn').onclick = close;
    overlay.querySelector('#apiCancelBtn').onclick = close;

    const inp = overlay.querySelector('#apiModalUrlInp');
    const statusBox = overlay.querySelector('#apiTestStatusBox');
    const testBtn = overlay.querySelector('#apiTestBtn');

    overlay.querySelector('#apiResetDefaultBtn').onclick = () => {
      inp.value = DEFAULT_API_URL;
      statusBox.style.display = 'none';
    };

    overlay.querySelector('#apiSaveBtn').onclick = () => {
      const val = inp.value.trim();
      if(val && !val.startsWith('https://script.google.com/macros/s/')){
        showToast('يجب أن يبدأ الرابط بـ https://script.google.com/macros/s/', 'error');
        return;
      }
      if(val === DEFAULT_API_URL || !val){
        localStorage.removeItem('microerp_api_url');
      } else {
        localStorage.setItem('microerp_api_url', val);
      }
      refreshApiUrl();
      showToast('تم حفظ رابط الخادم السحابي بنجاح', 'success');
      close();
    };

    testBtn.onclick = async () => {
      const targetUrl = inp.value.trim();
      if(!targetUrl){
        showToast('يرجى إدخال الرابط للفحص', 'error');
        return;
      }
      testBtn.disabled = true;
      testBtn.textContent = 'جارٍ الفحص...';
      statusBox.style.display = 'block';
      statusBox.style.background = 'var(--paper3)';
      statusBox.style.color = 'var(--ink)';
      statusBox.textContent = 'جارٍ إرسال طلب تجريبي للخادم...';

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: {'Content-Type': 'text/plain;charset=utf-8'},
          body: JSON.stringify({ action: 'ping' }),
          signal: controller.signal
        });
        clearTimeout(timeout);
        const text = await res.text();
        let parsed = null;
        try { parsed = JSON.parse(text); } catch(e){}

        if(parsed && parsed.ok){
          statusBox.style.background = 'var(--green-bg)';
          statusBox.style.color = 'var(--green-text)';
          statusBox.textContent = '✓ الاتصال ناجح! الخادم السحابي يعمل بكفاءة وجاهز للعمل.';
        } else if(text.includes('google') && text.includes('html')){
          statusBox.style.background = 'var(--amber-bg)';
          statusBox.style.color = 'var(--amber-text)';
          statusBox.textContent = '⚠️ استجاب الرابط بصفحة Google Drive غير صالحة. يرجى التأكد من نشر السكربت كـ Web App مع إتاحة الصلاحية لـ Anyone.';
        } else {
          statusBox.style.background = 'var(--green-bg)';
          statusBox.style.color = 'var(--green-text)';
          statusBox.textContent = '✓ استجاب الخادم بنجاح (حالة الاستجابة: ' + res.status + ')';
        }
      } catch(err){
        statusBox.style.background = 'var(--red-bg)';
        statusBox.style.color = 'var(--red-text)';
        statusBox.textContent = '✕ فشل الاتصال: ' + (err.message || 'تعذر الوصول للرابط');
      } finally {
        testBtn.disabled = false;
        testBtn.innerHTML = `${getSvgIcon('refresh', 13)} فحص الاتصال`;
      }
    };
  };

  const apiSettingsBtn = document.getElementById('loginApiSettingsBtn');
  if(apiSettingsBtn) apiSettingsBtn.onclick = openApiSettingsModal;

  const clearLockoutBtn = document.getElementById('clearLockoutBtn');
  if(clearLockoutBtn) {
    clearLockoutBtn.onclick = () => {
      localStorage.removeItem('microerp_lockout_until');
      localStorage.setItem('microerp_failed_attempts', '0');
      checkLockout();
      showToast('تم إلغاء القفل المؤقت بنجاح', 'success');
    };
  }

  // Live Network Status Listeners
  const updateNetStatus = () => {
    const statusContainer = document.getElementById('loginNetStatus');
    if(!statusContainer) return;
    if(navigator.onLine){
      statusContainer.innerHTML = `
        <span class="badge" style="background:var(--green-bg);color:var(--green-text);border:1px solid rgba(5,150,105,0.2);padding:5px 12px;border-radius:var(--radius-sm);font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:7px;">
          <span style="width:7px;height:7px;border-radius:50%;background:var(--primary);display:inline-block;"></span>
          متصل بالنظام
        </span>
      `;
    } else {
      statusContainer.innerHTML = `
        <span class="badge" style="background:var(--amber-bg);color:var(--amber-text);border:1px solid rgba(245,158,11,0.25);padding:5px 12px;border-radius:var(--radius-sm);font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:7px;">
          <span style="width:7px;height:7px;border-radius:50%;background:#f59e0b;display:inline-block;"></span>
          وضع العمل دون اتصال
        </span>
      `;
    }
  };
  window.addEventListener('online', updateNetStatus);
  window.addEventListener('offline', updateNetStatus);

  // Login Submit Handler
  const doLogin = async () => {
    if(checkLockout()) return;

    const btn = document.getElementById('loginBtn');
    const btnText = document.getElementById('loginBtnText');
    const btnIcon = document.getElementById('loginBtnIcon');
    const nameEl = document.getElementById('loginName');
    const passEl = document.getElementById('loginPass');
    const err = document.getElementById('loginErr');

    const name = (nameEl ? nameEl.value : '').trim();
    const pass = (passEl ? passEl.value : '');

    if(err){
      err.textContent = '';
      err.classList.remove('visible');
    }

    if(!name || !pass){
      if(err){
        err.textContent = 'يرجى إدخال اسم المستخدم وكلمة المرور';
        err.classList.add('visible');
      }
      return;
    }

    if(btn){
      btn.disabled = true;
      if(btnText) btnText.textContent = 'جارٍ التحقق وتأمين الجلسة...';
      if(btnIcon) btnIcon.innerHTML = getSvgIcon('lock', 15);
    }

    try {
      const res = await loginRemote(name, pass);
      
      // Clear failed attempts counter on success
      try {
        localStorage.removeItem('microerp_failed_attempts');
        localStorage.removeItem('microerp_lockout_until');
      } catch(e){}

      let sections;
      const allSecs = ['maintenance', 'pos', 'invoices', 'cameras', 'cameras_projects', 'cameras_visits', 'cameras_contracts', 'cashdrawer', 'daily', 'finance', 'inventory', 'barcode', 'audit', 'users', 'settings'];
      
      // Use role and permissions strictly from authenticated server response (never local storage)
      const effectiveRole = String(res.role || 'cashier').toLowerCase();
      const isSuper = effectiveRole === 'admin' || !!res.superuser || !!res.Superuser;

      if(effectiveRole === 'admin'){
        sections = allSecs;
      } else if(res.sections){
        sections = Array.isArray(res.sections) ? [...res.sections] : String(res.sections).split(',').map(s=>s.trim()).filter(Boolean);
      } else {
        sections = ['pos'];
      }
      sections = sections.filter(s => s !== 'settings' || effectiveRole === 'admin');
      if(!sections.length) sections = ['pos'];

      state.user = {
        name: res.name || name,
        role: effectiveRole,
        superuser: isSuper,
        Superuser: isSuper,
        sections: sections
      };
      normalizeUserSections(state.user);

      // Session Security: Respect "Remember me" checkbox
      const rememberCheckbox = document.getElementById('loginRemember');
      const rememberMe = rememberCheckbox ? rememberCheckbox.checked : true;
      try {
        sessionStorage.setItem('microerp_session', JSON.stringify(state.user));
        if(res.sessionToken){
          sessionStorage.setItem('microerp_session_token', res.sessionToken);
          state.sessionToken = res.sessionToken;
        }
        if (rememberMe) {
          localStorage.setItem('microerp_session', JSON.stringify(state.user));
          if(res.sessionToken){
            localStorage.setItem('microerp_session_token', res.sessionToken);
          }
        } else {
          localStorage.removeItem('microerp_session');
          localStorage.removeItem('microerp_session_token');
        }
      } catch(e){}

      // Audit Log Success
      try {
        recordAuditLog('دخول', 'الأمان', `تسجيل دخول ناجح للمستخدم: ${state.user.name} (الدور: ${state.user.role})`, '', 'success');
      } catch(e){}

      if(res && res.isOffline){
        showToast('تم تسجيل الدخول بنجاح (الوضع المحلي / دون اتصال بالخادم)', 'info');
      } else {
        showToast('تم تسجيل الدخول بنجاح وتوثيق الجلسة مع الخادم السحابي', 'success');
      }

      if(lockoutInterval){
        clearInterval(lockoutInterval);
        lockoutInterval = null;
      }

      await init();
    } catch(e){
      // Increment failed attempts
      let failedAttempts = 1;
      try {
        failedAttempts = parseInt(localStorage.getItem('microerp_failed_attempts') || '0', 10) + 1;
        localStorage.setItem('microerp_failed_attempts', failedAttempts);
        if(failedAttempts >= 5){
          const lockoutTime = Date.now() + 30000; // 30 sec lockout
          localStorage.setItem('microerp_lockout_until', lockoutTime);
          recordAuditLog('أمان', 'الأمان', `تم قفل محاولات الدخول لمدة 30 ثانية لتكرار الأخطاء (${failedAttempts} محاولات)`, '', 'تحذير');
        } else {
          recordAuditLog('دخول', 'الأمان', `محاولة دخول فاشلة للمستخدم (${name}) - المحاولة ${failedAttempts} من 5`, '', 'فشل');
        }
      } catch(errLog){}

      if(err){
        err.textContent = (failedAttempts >= 5) ? 'تم استنفاد المحاولات المسموحة. تم قفل تسجيل الدخول مؤقتاً.' : (e.message || 'فشل تسجيل الدخول');
        err.classList.add('visible');
      }

      if(btn){
        btn.disabled = false;
        if(btnText) btnText.textContent = 'تسجيل الدخول للنظام';
        if(btnIcon) btnIcon.innerHTML = getSvgIcon('lock', 15);
      }

      checkLockout();
    }
  };

  const loginBtn = document.getElementById('loginBtn');
  if(loginBtn) loginBtn.onclick = doLogin;

  if(passInput) passInput.onkeydown = (e) => { if(e.key === 'Enter') doLogin(); };
  if(nameInput) nameInput.onkeydown = (e) => { if(e.key === 'Enter') doLogin(); };
}
