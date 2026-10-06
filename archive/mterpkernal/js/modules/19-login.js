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
          <span class="badge" style="background:rgba(16,185,129,0.12);color:#059669;border:1px solid rgba(16,185,129,0.25);padding:6px 14px;border-radius:20px;font-size:12px;font-weight:800;display:inline-flex;align-items:center;gap:7px;">
            <span style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;display:inline-block;"></span>
            متصل بالنظام
          </span>
        ` : `
          <span class="badge" style="background:rgba(245,158,11,0.12);color:#d97706;border:1px solid rgba(245,158,11,0.25);padding:6px 14px;border-radius:20px;font-size:12px;font-weight:800;display:inline-flex;align-items:center;gap:7px;">
            <span style="width:8px;height:8px;border-radius:50%;background:#f59e0b;box-shadow:0 0 8px #f59e0b;display:inline-block;"></span>
            وضع العمل دون اتصال (أوفلاين)
          </span>
        `}
      </div>
      <button type="button" class="btn btn-ghost" id="loginThemeToggle" style="border-radius:20px;padding:6px 14px;font-size:12.5px;font-weight:800;display:inline-flex;align-items:center;gap:6px;background:var(--paper2);border:1px solid var(--line);cursor:pointer;">
        ${isDark ? '☀️ الوضع الفاتح' : '🌙 الوضع الليلي'}
      </button>
    </div>

    <div class="login-card">
      <div class="login-brand-logo">⚡</div>
      
      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="margin:0 0 6px;font-size:22px;font-weight:900;letter-spacing:-0.5px;color:var(--ink);">${escapeHtml(shopName)}</h2>
        <div style="font-size:12.5px;color:var(--ink-secondary);font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;">
          <span>تسجيل الدخول الآمن للنظام</span>
          <span style="font-size:10px;padding:2px 7px;background:rgba(5,150,105,0.1);color:#059669;border-radius:6px;font-weight:800;">Enterprise 2026</span>
        </div>
      </div>

      <!-- Rate Limiting / Lockout Banner -->
      <div class="login-lockout-banner" id="loginLockoutBanner">
        ⛔ تم تعليق تسجيل الدخول مؤقتاً لأسباب أمنية.<br>
        يرجى الانتظار <span id="lockoutTimerVal">30</span> ثانية قبل إعادة المحاولة.
      </div>

      ${!isOnline ? `
        <div style="background:rgba(245,158,11,0.09);border:1px solid rgba(245,158,11,0.25);color:var(--amber-text);font-size:11.5px;font-weight:700;padding:8px 12px;border-radius:12px;margin-bottom:16px;text-align:center;line-height:1.4;">
          💡 النظام في وضع الأوفلاين. يتم التحقق وتأمين الدخول باستخدام الحسابات المخزنة محلياً.
        </div>
      ` : ''}

      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="field" style="margin:0;">
          <label style="font-size:12.5px;font-weight:800;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
            <span>👤</span>
            <span>اسم المستخدم</span>
          </label>
          <input id="loginName" placeholder="ادخل اسم المستخدم (مثال: admin)" autofocus autocomplete="username" style="padding:11px 14px;font-size:13.5px;border-radius:12px;">
        </div>

        <div class="field" style="margin:0;">
          <label style="font-size:12.5px;font-weight:800;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
            <span>🔑</span>
            <span>كلمة المرور</span>
          </label>
          <div class="login-input-wrap">
            <input id="loginPass" type="password" placeholder="••••••••" autocomplete="current-password" style="padding:11px 14px;padding-left:42px;font-size:14px;border-radius:12px;">
            <button type="button" class="login-toggle-pass-btn" id="loginTogglePass" title="إظهار / إخفاء كلمة المرور" tabindex="-1">👁️</button>
          </div>
          <!-- Caps Lock Alert -->
          <div class="login-caps-alert" id="loginCapsAlert">
            <span>⚠️</span>
            <span>زر Caps Lock مفعّل - انتبه لحالة الأحرف الكبيرة</span>
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:2px;">
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:var(--ink-secondary);cursor:pointer;user-select:none;">
            <input type="checkbox" id="loginRemember" checked style="width:16px;height:16px;accent-color:#059669;cursor:pointer;">
            <span>تذكرني على هذا الجهاز</span>
          </label>
          <span style="font-size:11px;color:var(--ink-secondary);opacity:0.8;">تشفير محلي آمن</span>
        </div>

        <button class="login-btn-submit" id="loginBtn" type="button">
          <span id="loginBtnIcon" style="font-size:16px;">🔐</span>
          <span id="loginBtnText">تسجيل الدخول للنظام</span>
          <span style="margin-right:auto;font-size:16px;">➔</span>
        </button>
      </div>

      <!-- Animated Error Banner -->
      <div class="login-err-banner" id="loginErr"></div>

      <div style="margin-top:22px;padding-top:16px;border-top:1px solid var(--line);display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:var(--ink-secondary);">
        <span>حماية مشددة ضد التخمين</span>
        <span style="font-weight:700;color:var(--primary);">نظام متصل ومشفر 🔒</span>
      </div>
    </div>
  </div>`;
}

function attachLogin(){
  let lockoutInterval = null;

  // Rate Limiting & Lockout Check
  const checkLockout = () => {
    try {
      const lockoutUntil = parseInt(localStorage.getItem('mterp_lockout_until') || '0', 10);
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
              localStorage.removeItem('mterp_lockout_until');
              localStorage.setItem('mterp_failed_attempts', '0');
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
        togglePassBtn.textContent = '🙈';
      } else {
        passInput.type = 'password';
        togglePassBtn.textContent = '👁️';
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

  // Live Network Status Listeners
  const updateNetStatus = () => {
    const statusContainer = document.getElementById('loginNetStatus');
    if(!statusContainer) return;
    if(navigator.onLine){
      statusContainer.innerHTML = `
        <span class="badge" style="background:rgba(16,185,129,0.12);color:#059669;border:1px solid rgba(16,185,129,0.25);padding:6px 14px;border-radius:20px;font-size:12px;font-weight:800;display:inline-flex;align-items:center;gap:7px;">
          <span style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;display:inline-block;"></span>
          متصل بالنظام
        </span>
      `;
    } else {
      statusContainer.innerHTML = `
        <span class="badge" style="background:rgba(245,158,11,0.12);color:#d97706;border:1px solid rgba(245,158,11,0.25);padding:6px 14px;border-radius:20px;font-size:12px;font-weight:800;display:inline-flex;align-items:center;gap:7px;">
          <span style="width:8px;height:8px;border-radius:50%;background:#f59e0b;box-shadow:0 0 8px #f59e0b;display:inline-block;"></span>
          وضع العمل دون اتصال (أوفلاين)
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
    const rememberEl = document.getElementById('loginRemember');
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
      if(btnIcon) btnIcon.innerHTML = '⏳';
    }

    try {
      const res = await loginRemote(name, pass);
      
      // Clear failed attempts counter on success
      try {
        localStorage.removeItem('mterp_failed_attempts');
        localStorage.removeItem('mterp_lockout_until');
      } catch(e){}

      let sections;
      const allSecs = ['maintenance', 'pos', 'invoices', 'cameras', 'cashdrawer', 'daily', 'finance', 'inventory', 'barcode', 'audit', 'users', 'settings'];
      
      let localUsers = state.users;
      if(!localUsers || !localUsers.length){
        try {
          const perm = localStorage.getItem('mterp_users_permanent');
          if(perm) localUsers = JSON.parse(perm);
        }catch(e){}
      }
      if(!localUsers || !localUsers.length){
        localUsers = getCache('users', []);
      }
      const localU = (localUsers || []).find(u => u.Name && u.Name.trim().toLowerCase() === name.trim().toLowerCase());
      const effectiveRole = (localU && localU.Role) ? localU.Role : res.role;
      const isSuper = effectiveRole === 'admin' || (localU && (!!localU.Superuser || !!localU.superuser)) || !!res.superuser || !!res.Superuser;

      if(effectiveRole === 'admin'){
        sections = allSecs;
      } else if(localU && localU.Sections && (Array.isArray(localU.Sections) ? localU.Sections.length : String(localU.Sections).trim())){
        sections = Array.isArray(localU.Sections) ? [...localU.Sections] : String(localU.Sections).split(',').map(s=>s.trim()).filter(Boolean);
      } else if(res.sections){
        sections = Array.isArray(res.sections) ? [...res.sections] : String(res.sections).split(',').map(s=>s.trim()).filter(Boolean);
      } else {
        sections = ['pos'];
      }
      sections = sections.filter(s => s !== 'settings' || effectiveRole === 'admin');
      if(!sections.length) sections = ['pos'];

      state.user = {name: (localU && localU.Name) || res.name, role: effectiveRole, superuser: isSuper, Superuser: isSuper, sections};
      normalizeUserSections(state.user);

      // Session Persistence (Remember Me)
      const remember = rememberEl ? rememberEl.checked : true;
      try {
        const sessionStr = JSON.stringify(state.user);
        if(remember){
          localStorage.setItem('mterp_session', sessionStr);
          sessionStorage.removeItem('mterp_session');
        } else {
          sessionStorage.setItem('mterp_session', sessionStr);
          localStorage.removeItem('mterp_session');
        }
      } catch(e){}

      // Audit Log Success
      try {
        recordAuditLog('دخول', 'الأمان', `تسجيل دخول ناجح للمستخدم: ${state.user.name} (الدور: ${state.user.role})`, '', 'success');
      } catch(e){}

      if(lockoutInterval){
        clearInterval(lockoutInterval);
        lockoutInterval = null;
      }

      await init();
    } catch(e){
      // Increment failed attempts
      let failedAttempts = 1;
      try {
        failedAttempts = parseInt(localStorage.getItem('mterp_failed_attempts') || '0', 10) + 1;
        localStorage.setItem('mterp_failed_attempts', failedAttempts);
        if(failedAttempts >= 5){
          const lockoutTime = Date.now() + 30000; // 30 sec lockout
          localStorage.setItem('mterp_lockout_until', lockoutTime);
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
        if(btnIcon) btnIcon.innerHTML = '🔐';
      }

      checkLockout();
    }
  };

  const loginBtn = document.getElementById('loginBtn');
  if(loginBtn) loginBtn.onclick = doLogin;

  if(passInput) passInput.onkeydown = (e) => { if(e.key === 'Enter') doLogin(); };
  if(nameInput) nameInput.onkeydown = (e) => { if(e.key === 'Enter') doLogin(); };
}
