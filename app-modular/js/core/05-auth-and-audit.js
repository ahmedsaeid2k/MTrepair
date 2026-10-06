/* ---------------- User Management & Auth Engine ---------------- */
// Security: DEFAULT_USERS is a UI fallback schema only — passwords are intentionally blank.
// Real credentials are loaded from the backend (Google Sheet → localStorage cache).
// If localStorage is empty and offline, the user must connect to authenticate.
const DEFAULT_USERS = [
  { ID: 'usr_admin', Name: 'admin', Password: '', Role: 'admin', Superuser: true, Sections: 'maintenance,pos,invoices,cameras,cashdrawer,daily,finance,inventory,barcode,audit,users,settings', Notes: 'المدير العام للنظام' },
  { ID: 'usr_cashier', Name: 'كاشير 1', Password: '', Role: 'cashier', Superuser: false, Sections: 'pos,cashdrawer', Notes: 'كاشير مبيعات ونقطة بيع وحركة الدرج' },
  { ID: 'usr_tech', Name: 'فني صيانة', Password: '', Role: 'technician', Superuser: false, Sections: 'maintenance', Notes: 'فني صيانة واستلام أجهزة' },
  { ID: 'usr_accountant', Name: 'محاسب', Password: '', Role: 'accountant', Superuser: false, Sections: 'daily,cashdrawer,invoices,finance,inventory', Notes: 'إدارة الحسابات واليومية والمخزون' }
];

// Security: strip passwords before persisting user list to localStorage
function sanitizeUsersForStorage(users) {
  return (users || []).map(u => {
    const safe = { ...u };
    delete safe.Password;
    delete safe.password;
    return safe;
  });
}

async function loadUsers(){
  let localUsers = getCache('users', null);
  if(!localUsers || !localUsers.length){
    try {
      const perm = localStorage.getItem('microerp_users_permanent');
      if(perm) localUsers = JSON.parse(perm);
    } catch(e){}
  }
  if(!localUsers || !localUsers.length){
    localUsers = [...DEFAULT_USERS];
  } else {
    // Ensure default admin exists
    if(!localUsers.some(u => u.Name && u.Name.toLowerCase() === 'admin')){
      localUsers.unshift(DEFAULT_USERS[0]);
    }
  }

  state.users = sanitizeUsersForStorage(localUsers);
  setCache('users', state.users);

  if(navigator.onLine){
    try {
      const rows = await apiGet('getUsers');
      if(rows && Array.isArray(rows) && rows.length > 0){
        rows.forEach(r => {
          if(!r || !r.Name) return;
          const idx = state.users.findIndex(u => (u.ID && u.ID === r.ID) || (u.Name && u.Name.toLowerCase() === r.Name.toLowerCase()));
          const sanitizedR = {
            ID: r.ID,
            Name: r.Name,
            Role: r.Role,
            Sections: r.Sections,
            Superuser: !!r.Superuser,
            Notes: r.Notes || ''
          };
          if(idx > -1){
            state.users[idx] = { ...state.users[idx], ...sanitizedR };
          } else {
            state.users.push(sanitizedR);
          }
        });
        state.users = sanitizeUsersForStorage(state.users);
        setCache('users', state.users);
        try { localStorage.setItem('microerp_users_permanent', JSON.stringify(state.users)); } catch(e){}
      }
    } catch(e){
      console.warn('getUsers cloud fetch error, keeping local users:', e);
    }
  }
  return state.users;
}

async function saveUserRemote(usr){
  if(!usr.ID) usr.ID = 'usr_' + Date.now();
  if(!state.users) state.users = [];
  const idx = state.users.findIndex(u => (u.ID && u.ID === usr.ID) || (u.Name && u.Name.trim().toLowerCase() === usr.Name.trim().toLowerCase()));
  if(idx > -1) {
    state.users[idx] = { ...state.users[idx], ...usr };
  } else {
    state.users.push(usr);
  }
  setCache('users', state.users);
  try { localStorage.setItem('microerp_users_permanent', JSON.stringify(sanitizeUsersForStorage(state.users))); } catch(e){}
  
  // If the saved user is currently active, update state.user live immediately!
  if(state.user && state.user.name && state.user.name.trim().toLowerCase() === usr.Name.trim().toLowerCase()){
    state.user.role = usr.Role;
    state.user.superuser = !!usr.Superuser;
    state.user.Superuser = !!usr.Superuser;
    state.user.sections = Array.isArray(usr.Sections) ? [...usr.Sections] : String(usr.Sections||'').split(',').map(s=>s.trim()).filter(Boolean);
    normalizeUserSections(state.user);
    try { sessionStorage.setItem('microerp_session', JSON.stringify(state.user)); } catch(e){}
  }

  if(navigator.onLine){
    try {
      await apiPost('saveUser', {data: usr, role: state.user ? state.user.role : 'admin'});
    } catch(e){
      console.warn('saveUser remote sync failed:', e);
    }
  }
  return usr;
}

async function deleteUserRemote(userId){
  state.users = state.users.filter(u => u.ID !== userId && u.Name !== userId);
  setCache('users', state.users);
  try { localStorage.setItem('microerp_users_permanent', JSON.stringify(sanitizeUsersForStorage(state.users))); } catch(e){}
  if(navigator.onLine){
    try {
      await apiPost('deleteUser', {id: userId, role: state.user ? state.user.role : 'admin'});
    } catch(e){}
  }
  return true;
}

/* ---------------- Audit & Authorization System (الرقابة وسجل العمليات وتصاريح الحذف) ---------------- */

function recordAuditLog(action, section, details, refId, status = 'success'){
  const log = {
    id: 'log_' + Date.now() + '_' + Math.floor(Math.random()*1000),
    timestamp: new Date().toISOString(),
    user: state.user ? state.user.name : 'نظام',
    role: state.user ? state.user.role : 'admin',
    action: action,
    section: section,
    details: details || '',
    refId: refId ? String(refId) : '',
    status: status
  };
  if(!Array.isArray(state.auditLogs)) state.auditLogs = [];
  state.auditLogs.unshift(log);
  if(state.auditLogs.length > 250) state.auditLogs = state.auditLogs.slice(0, 250);
  setCache('audit_logs', state.auditLogs);
  if(typeof safeLocalStorageSet === 'function') {
    safeLocalStorageSet('microerp_audit_logs', state.auditLogs);
  } else {
    try { localStorage.setItem('microerp_audit_logs', JSON.stringify(state.auditLogs)); } catch(e){}
  }
  try { apiPost('saveAuditLog', { data: log }).catch(()=>{}); } catch(e){}
  return log;
}

function pushLog(msg, section = 'general'){
  return recordAuditLog('تسجيل نشاط', section, String(msg || ''));
}

function getPendingAuthCountBadge(){
  const count = (state.authRequests || []).filter(r => r.status === 'pending').length;
  if(!count) return '';
  return `<span class="badge" style="background:#ef4444;color:#fff;border-radius:10px;padding:2px 7px;font-size:11px;font-weight:900;margin-right:6px;">${count}</span>`;
}

function playNotificationChime(){
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if(!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    // Pleasant iOS-style 2-tone ping
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.28, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.42);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.44);
  } catch(e){}
}

function updateNotificationBellBadge(){
  const count = (state.authRequests || []).filter(r => r.status === 'pending').length;
  document.querySelectorAll('.notification-bell-badge').forEach(b => {
    b.textContent = count;
    b.style.display = count > 0 ? 'inline-block' : 'none';
  });
}

function notifySupervisorNewAuthRequest(req){
  playNotificationChime();

  const existing = document.getElementById('supervisorAuthAlertBanner');
  if(existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'supervisorAuthAlertBanner';
  banner.className = 'ios-floating-alert';
  banner.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;flex:1;">
      <div class="ios-alert-bell-pulse">${getSvgIcon('bell', 18)}</div>
      <div style="text-align:right;">
        <div style="font-weight:900;font-size:13.5px;color:var(--ink);display:flex;align-items:center;gap:6px;">
          <span>تنبيه إداري: طلب تصريح حذف جديد!</span>
          <span class="status-badge" style="background:#fee2e2;color:#b91c1c;border:1px solid #fecaca;font-size:10.5px;">مطلوب موافقة</span>
        </div>
        <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">
          الموظف: <b>${escapeHtml(req.reqUser)}</b> • العنصر: <b>${escapeHtml(req.entityType)} — ${escapeHtml(req.entityTitle)}</b>
        </div>
        <div style="font-size:11.5px;color:#b91c1c;margin-top:2px;font-weight:700;">
          السبب: "${escapeHtml(req.reason)}"
        </div>
      </div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;">
      <button class="btn btn-sm btn-primary" id="openPendingAuthReqBtn" style="font-weight:900;padding:6px 14px;border-radius:10px;">
        مراجعة واعتماد الآن
      </button>
      <button class="btn btn-sm btn-ghost" id="dismissAuthBannerBtn" style="border-radius:10px;font-size:16px;line-height:1;">&times;</button>
    </div>
  `;

  document.body.appendChild(banner);

  banner.querySelector('#dismissAuthBannerBtn').onclick = ()=>banner.remove();
  banner.querySelector('#openPendingAuthReqBtn').onclick = ()=>{
    banner.remove();
    state.currentSection = 'audit';
    state.auditTab = 'requests';
    render();
  };

  setTimeout(()=>{
    if(document.getElementById('supervisorAuthAlertBanner')) {
      banner.remove();
    }
  }, 16000);

  updateNotificationBellBadge();
}

function openNotificationCenterModal(){
  const pending = (state.authRequests || []).filter(r => r.status === 'pending');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '13000';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:560px;max-height:85vh;overflow-y:auto;border-radius:22px;padding:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="ios-alert-bell-pulse" style="animation:none;width:36px;height:36px;">${getSvgIcon('bell', 18)}</div>
          <div>
            <h3 style="margin:0;font-size:16px;font-weight:900;">مركز الإشعارات وتصاريح الحذف</h3>
            <div style="font-size:11.5px;color:var(--ink-secondary);">${pending.length} طلبات معلقة بانتظار قرار الإدارة</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-xs" id="closeNotifModalBtn" style="font-size:18px;line-height:1;">&times;</button>
      </div>

      ${pending.length === 0 ? `
        <div style="text-align:center;padding:32px 16px;color:var(--ink-secondary);">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:50%;background:var(--paper3);color:var(--ink-secondary);margin-bottom:8px;">${getSvgIcon('check', 24)}</div>
          <div style="font-weight:800;font-size:14px;color:var(--ink);">لا توجد أي طلبات تصريح معلقة حالياً</div>
          <div style="font-size:12px;margin-top:2px;">كافة العمليات مؤمنة ومحدثة بالكامل</div>
        </div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${pending.map(req => `
            <div class="card" style="border-right:4px solid #ef4444;padding:14px;background:var(--paper2);">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
                <div>
                  <div style="font-weight:800;font-size:13px;color:var(--ink);">${escapeHtml(req.action)}: <span style="color:#b91c1c;">${escapeHtml(req.entityType)} — ${escapeHtml(req.entityTitle)}</span></div>
                  <div style="font-size:11.5px;color:var(--ink-secondary);margin-top:2px;">
                    الموظف: <b>${escapeHtml(req.reqUser)}</b> • ${new Date(req.timestamp).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}
                  </div>
                  <div style="font-size:12px;background:var(--paper3);border-radius:6px;padding:6px 10px;margin-top:6px;color:var(--ink);">
                    السبب: "${escapeHtml(req.reason)}"
                  </div>
                </div>
                <div style="display:flex;gap:6px;align-items:center;">
                  <button class="btn btn-xs btn-green" data-notifapprove="${req.id}" style="font-weight:800;display:inline-flex;align-items:center;gap:4px;">${getSvgIcon('check', 12)} اعتماد</button>
                  <button class="btn btn-xs btn-red" data-notifreject="${req.id}" style="font-weight:800;display:inline-flex;align-items:center;gap:4px;">${getSvgIcon('x', 12)} رفض</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:18px;border-top:1px solid var(--line);padding-top:12px;">
        <button class="btn btn-sm btn-ghost" id="viewAllAuditCenterBtn" style="display:inline-flex;align-items:center;gap:6px;">${getSvgIcon('shield', 14)} فتح قسم الرقابة بالكامل</button>
        <button class="btn btn-sm btn-primary" id="closeNotifModalBtn2">إغلاق</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  const close = ()=> overlay.remove();
  overlay.querySelector('#closeNotifModalBtn').onclick = close;
  overlay.querySelector('#closeNotifModalBtn2').onclick = close;

  overlay.querySelector('#viewAllAuditCenterBtn').onclick = ()=>{
    close();
    state.currentSection = 'audit';
    state.auditTab = 'requests';
    render();
  };

  overlay.querySelectorAll('[data-notifapprove]').forEach(btn => {
    btn.onclick = async ()=>{
      const rid = btn.dataset.notifapprove;
      const r = state.authRequests.find(x => x.id === rid);
      if(!r) return;
      btn.disabled = true;
      btn.textContent = 'جارٍ الاعتماد...';
      try {
        // Execute actual deletion first [U7]
        if(r.entityType === 'صيانة' || r.entityType === 'إيصال صيانة'){
          await deleteReceiptRemote(r.entityId);
        } else if(r.entityType === 'فاتورة' || r.entityType === 'فاتورة ضريبية'){
          await deleteInvoiceRemote(r.entityId);
        } else if(r.entityType === 'صنف مخزن' || r.entityType === 'منتج'){
          await deleteItemRemote(r.entityId);
        } else if(r.entityType === 'قيد يومية' || r.entityType === 'حركة مالية'){
          await deleteJournalEntryRemote(r.entityId);
        }

        // Only mark approved and write audit log after execution succeeds
        r.status = 'approved';
        r.resolvedAt = new Date().toISOString();
        r.resolvedBy = state.user ? state.user.name : 'المدير العام';
        setCache('auth_requests', state.authRequests);
        try { localStorage.setItem('microerp_auth_requests', JSON.stringify(state.authRequests)); } catch(e){}
        recordAuditLog('موافقة على حذف', r.entityType, `تم اعتماد طلب الحذف لـ (${r.entityTitle}) بناء على طلب (${r.reqUser})`, r.entityId, 'معتمد');

        showToast(`تمت الموافقة وحذف (${r.entityTitle}) بنجاح`, 'success');
        close();
        render();
      } catch(err){
        showToast('تعذر التنفيذ: ' + err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'موافقة';
      }
    };
  });

  overlay.querySelectorAll('[data-notifreject]').forEach(btn => {
    btn.onclick = ()=>{
      const rid = btn.dataset.notifreject;
      const r = state.authRequests.find(x => x.id === rid);
      if(!r) return;
      r.status = 'rejected';
      r.resolvedAt = new Date().toISOString();
      r.resolvedBy = state.user ? state.user.name : 'المدير العام';
      setCache('auth_requests', state.authRequests);
      try { localStorage.setItem('microerp_auth_requests', JSON.stringify(state.authRequests)); } catch(e){}
      recordAuditLog('رفض طلب حذف', r.entityType, `تم رفض طلب حذف (${r.entityTitle}) المقدم من (${r.reqUser})`, r.entityId, 'مرفوض');
      showToast('تم رفض طلب الحذف بنجاح', 'info');
      close();
      render();
    };
  });
}

async function verifySupervisorPin(pass){
  const clean = String(pass||'').trim();
  if(!clean) return null;
  try {
    const res = await apiPost('verifySupervisorPin', { pin: clean });
    if(res && res.valid && res.adminName){
      return res.adminName;
    }
    return null;
  } catch(e) {
    console.warn('Supervisor PIN verification failed:', e.message);
    return null;
  }
}

/**
 * نافذة طلب موافقة وتصريح المشرف للعمليات المالية الحساسة (خصم استثنائي، بيع بأقل من التكلفة...)
 * تعيد كائن Promise: { approved: true, adminName } أو { approved: false }
 */
function promptSupervisorApproval({ action, reason, details }){
  return new Promise((resolve) => {
    const currentUser = state.user || { name: 'مستخدم', role: 'staff' };
    const isSuperuser = currentUser.role === 'admin' || !!currentUser.superuser || !!currentUser.Superuser;
    if(isSuperuser){
      openConfirmModal({
        title: 'تأكيد إداري مباشر',
        message: `${action}\n${details || reason || ''}\n\nهل تؤكد الموافقة والمتابعة؟`,
        confirmText: 'تأكيد ومتابعة',
        confirmClass: 'btn-primary',
        icon: 'check',
        onConfirm: () => {
          recordAuditLog(action, 'رقابة مالية', `${action}: ${details || reason || ''} - تم الاعتماد مباشرة بواسطة المدير (${currentUser.name})`, '');
          resolve({ approved: true, adminName: currentUser.name });
        },
        onCancel: () => resolve({ approved: false })
      });
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = '13000';
    overlay.innerHTML = `
      <div class="modal-content" style="max-width:460px;border-top:4px solid #f59e0b;padding:22px;border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,0.3);">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:36px;height:36px;border-radius:50%;background:rgba(245,158,11,0.15);color:var(--amber);display:flex;align-items:center;justify-content:center;font-size:18px;">🔑</div>
            <div>
              <h3 style="margin:0;font-size:16px;color:#b45309;">تصريح مشرف مطلوب</h3>
              <div style="font-size:11px;color:var(--ink-secondary);">${escapeHtml(action)}</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-xs" id="closeSupervisorApprovalModal" style="font-size:18px;line-height:1;">&times;</button>
        </div>

        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;margin-bottom:14px;font-size:12.5px;color:#92400e;line-height:1.5;">
          <b>تفاصيل العملية:</b> ${escapeHtml(details || reason || action)}
          <div style="margin-top:4px;font-size:11.5px;color:var(--ink-secondary);">الموظف الحالي: <b>${escapeHtml(currentUser.name)}</b></div>
        </div>

        <div class="field" style="margin-bottom:16px;">
          <label style="font-size:12.5px;font-weight:700;">كلمة مرور المدير العام أو المشرف *</label>
          <input id="supervisorApprovalPinInp" type="password" placeholder="أدخل كلمة مرور المشرف للتصريح..." style="font-size:14px;">
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <button class="btn btn-ghost btn-sm" id="cancelSupervisorApprovalBtn">إلغاء</button>
          <button class="btn btn-primary btn-sm" id="confirmSupervisorApprovalBtn" style="font-weight:800;">اعتماد ومتابعة ↩️</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeOverlay = () => {
      overlay.remove();
      resolve({ approved: false });
    };

    overlay.querySelector('#closeSupervisorApprovalModal').onclick = closeOverlay;
    overlay.querySelector('#cancelSupervisorApprovalBtn').onclick = closeOverlay;

    const pinInp = overlay.querySelector('#supervisorApprovalPinInp');
    setTimeout(() => pinInp && pinInp.focus(), 50);

    const confirmBtn = overlay.querySelector('#confirmSupervisorApprovalBtn');
    const doVerify = async () => {
      const pin = pinInp.value.trim();
      if(!pin){
        showToast('يرجى إدخال كلمة مرور المشرف أو المدير', 'error');
        pinInp.focus();
        return;
      }
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'جارٍ التحقق...';
      try {
        const adminName = await verifySupervisorPin(pin);
        if(!adminName){
          showToast('كلمة مرور المشرف غير صحيحة! تم رفض التصريح', 'error');
          recordAuditLog('محاولة تصريح فاشلة', 'رقابة مالية', `محاولة تصريح غير مصرح بها لـ (${action}) من الموظف (${currentUser.name}) - كلمة سر خاطئة`, '');
          pinInp.value = '';
          pinInp.focus();
          confirmBtn.disabled = false;
          confirmBtn.textContent = 'اعتماد ومتابعة ↩️';
          return;
        }

        recordAuditLog(action, 'رقابة مالية', `${action}: ${details || reason || ''} - تم الاعتماد بواسطة المشرف (${adminName}) للموظف (${currentUser.name})`, '');
        overlay.remove();
        showToast(`تم اعتماد التصريح بنجاح بواسطة (${adminName})`, 'success');
        resolve({ approved: true, adminName });
      } catch(e) {
        showToast('تعذر الاتصال للتحقق من كلمة المرور', 'error');
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'اعتماد ومتابعة ↩️';
      }
    };

    confirmBtn.onclick = doVerify;
    pinInp.onkeydown = (e) => { if(e.key === 'Enter') doVerify(); };
  });
}
window.promptSupervisorApproval = promptSupervisorApproval;

/**
 * دالة طلب تصريح الحذف أو الإجراء الحساس
 * إذا كان المستخدم مدير عام -> تأكيد مباشر وتسجيل في سجل الرقابة
 * إذا كان موظف -> إظهار نافذة التصريح الفوري بكلمة سر المدير أو إرسال طلب للإدارة
 */
function requestAdminAuthorization({ action, entityType, entityId, entityTitle, onApproved, onCancel }){
  const currentUser = state.user || { name: 'مستخدم', role: 'staff' };

  // 1. إذا كان المستخدم الحالي مدير عام (Admin) أو لديه صلاحية Superuser (الحذف المباشر بدون إذن)
  const isSuperuser = currentUser.role === 'admin' || !!currentUser.superuser || !!currentUser.Superuser;
  if(isSuperuser){
    openConfirmModal({
      title: 'تأكيد إداري مباشر',
      message: `هل أنت متأكد من رغبتك في ${action} (${entityTitle})؟\nسيتم توثيق هذه العملية في سجل الرقابة والتدقيق.`,
      confirmText: `تأكيد ${action}`,
      confirmClass: 'btn-danger',
      icon: 'alertTriangle',
      onConfirm: () => {
        recordAuditLog(action, entityType, `تم الإجراء مباشرة بواسطة المستخدم المصرح له (${currentUser.name}) [Superuser]`, entityId, 'معتمد');
        onApproved(currentUser.name);
      },
      onCancel: () => {
        if(typeof onCancel === 'function') onCancel();
      }
    });
    return;
  }

  // 2. إذا كان المستخدم لا يمتلك صلاحية Superuser -> إظهار نافذة تصريح المدير
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '12000';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:490px;border-top:4px solid #ef4444;padding:22px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:rgba(239,68,68,0.1);color:var(--red);flex-shrink:0;">${getSvgIcon('lock', 20)}</div>
          <div>
            <h3 style="margin:0;font-size:16px;color:#b91c1c;">تصريح حذف مطلوب من الإدارة</h3>
            <div style="font-size:11px;color:#dc2626;font-weight:700;">بدون صلاحية Superuser (موافقة المدير مطلوبة)</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-xs" id="closeAuthModal" style="font-size:18px;line-height:1;">&times;</button>
      </div>

      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px;margin-bottom:14px;font-size:12.5px;color:#991b1b;line-height:1.5;">
        <b>تنبيه الأمان والرقابة:</b> هذا الحساب لا يمتلك <b>صلاحية Superuser (الحذف والتعديل المباشر)</b>. لحماية البيانات والمحاسبة، يلزم إدخال رمز المشرف أو إرسال طلب اعتماد فوري لمدير النظام.
        <div style="margin-top:6px;color:var(--ink);">
          العنصر المطلوب حذفه: <b style="color:#b91c1c;">${escapeHtml(entityType)} — ${escapeHtml(entityTitle)}</b>
        </div>
        <div style="margin-top:2px;font-size:11.5px;color:var(--ink-secondary);">الموظف مقدم الطلب: <b>${escapeHtml(currentUser.name)}</b></div>
      </div>

      <!-- Tab Switcher -->
      <div class="chip-group" style="margin-bottom:14px;">
        <div class="chip sel" id="authTabPinBtn" style="flex:1;justify-content:center;font-weight:700;display:inline-flex;align-items:center;gap:6px;">${getSvgIcon('key', 14)} تصريح فوري بالمحل</div>
        <div class="chip" id="authTabReqBtn" style="flex:1;justify-content:center;font-weight:700;display:inline-flex;align-items:center;gap:6px;">${getSvgIcon('send', 14)} إرسال طلب للإدارة</div>
      </div>

      <!-- Mode 1: Instant Supervisor PIN / Password -->
      <div id="authModePin">
        <div class="field">
          <label style="font-size:12.5px;font-weight:700;">كلمة مرور المدير العام أو المشرف</label>
          <input id="supervisorPasswordInp" type="password" placeholder="أدخل كلمة مرور المدير للتصريح الفوري..." style="font-size:14px;">
          <div style="font-size:11px;color:var(--ink-secondary);margin-top:4px;">يمكن للمدير كتابة كلمة المرور فورياً للاعتماد المباشر.</div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">
          <button class="btn btn-ghost btn-sm" id="cancelAuthPinBtn">إلغاء</button>
          <button class="btn btn-red btn-sm" id="confirmSupervisorPinBtn" style="font-weight:800;display:inline-flex;align-items:center;gap:6px;">${getSvgIcon('lock', 14)} اعتماد وتنفيذ الحذف</button>
        </div>
      </div>

      <!-- Mode 2: Submit Request for Admin Review -->
      <div id="authModeReq" style="display:none;">
        <div class="field">
          <label style="font-size:12.5px;font-weight:700;">سبب طلب الحذف (إلزامي للإدارة)</label>
          <textarea id="authRequestReasonInp" rows="3" placeholder="اكتب سبب طلب حذف هذا العنصر بالتفصيل..." style="font-size:13px;"></textarea>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">
          <button class="btn btn-ghost btn-sm" id="cancelAuthReqBtn">إلغاء</button>
          <button class="btn btn-primary btn-sm" id="sendAuthRequestBtn" style="font-weight:800;display:inline-flex;align-items:center;gap:6px;">${getSvgIcon('send', 14)} إرسال الطلب للإدارة</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = ()=> overlay.remove();
  overlay.querySelector('#closeAuthModal').onclick = close;
  overlay.querySelector('#cancelAuthPinBtn').onclick = close;
  overlay.querySelector('#cancelAuthReqBtn').onclick = close;

  const pinTab = overlay.querySelector('#authTabPinBtn');
  const reqTab = overlay.querySelector('#authTabReqBtn');
  const modePin = overlay.querySelector('#authModePin');
  const modeReq = overlay.querySelector('#authModeReq');

  pinTab.onclick = ()=>{
    pinTab.classList.add('sel');
    reqTab.classList.remove('sel');
    modePin.style.display = 'block';
    modeReq.style.display = 'none';
  };
  reqTab.onclick = ()=>{
    reqTab.classList.add('sel');
    pinTab.classList.remove('sel');
    modePin.style.display = 'none';
    modeReq.style.display = 'block';
  };

  // 1. Submit Supervisor Password
  overlay.querySelector('#confirmSupervisorPinBtn').onclick = async ()=>{
    const btn = overlay.querySelector('#confirmSupervisorPinBtn');
    const passInp = overlay.querySelector('#supervisorPasswordInp');
    const pass = passInp.value;
    if(!pass.trim()){
      showToast('يرجى إدخال كلمة مرور المشرف أو المدير', 'error');
      passInp.focus();
      return;
    }

    btn.disabled = true;
    const oldBtnText = btn.innerHTML;
    btn.innerHTML = 'جارٍ التحقق...';

    try {
      const adminName = await verifySupervisorPin(pass);
      if(!adminName){
        showToast('كلمة مرور المدير غير صحيحة! تم رفض التصريح', 'error');
        recordAuditLog('محاولة حذف فاشلة', entityType, `محاولة حذف غير مصرح بها لـ (${entityTitle}) من الموظف (${currentUser.name}) - كلمة سر خاطئة`, entityId, 'مرفوض');
        passInp.value = '';
        passInp.focus();
        btn.disabled = false;
        btn.innerHTML = oldBtnText;
        return;
      }

      recordAuditLog(action, entityType, `تم التصريح الفوري من المشرف (${adminName}) للموظف (${currentUser.name})`, entityId, 'بتصريح فوري');
      close();
      showToast(`تم التصريح بنجاح بواسطة (${adminName})`, 'success');
      onApproved(adminName);
    } catch(err) {
      showToast('حدث خطأ أثناء الاتصال بالخادم للتحقق من التصريح', 'error');
      btn.disabled = false;
      btn.innerHTML = oldBtnText;
    }
  };

  // 2. Send Authorization Request to Admin Box
  overlay.querySelector('#sendAuthRequestBtn').onclick = async ()=>{
    const reason = overlay.querySelector('#authRequestReasonInp').value.trim();
    if(!reason){
      showToast('يرجى ذكر سبب طلب الحذف للإدارة', 'error');
      overlay.querySelector('#authRequestReasonInp').focus();
      return;
    }

    const reqObj = {
      id: 'req_' + Date.now(),
      timestamp: new Date().toISOString(),
      reqUser: currentUser.name,
      action: action,
      entityType: entityType,
      entityId: entityId,
      entityTitle: entityTitle,
      reason: reason,
      status: 'pending'
    };

    if(!Array.isArray(state.authRequests)) state.authRequests = [];
    state.authRequests.unshift(reqObj);
    setCache('auth_requests', state.authRequests);
    try { localStorage.setItem('microerp_auth_requests', JSON.stringify(state.authRequests)); } catch(e){}

    recordAuditLog('طلب تصريح حذف', entityType, `الموظف (${currentUser.name}) أرسل طلب حذف (${entityTitle}) - السبب: ${reason}`, entityId, 'بانتظار الموافقة');

    try { apiPost('saveAuthRequest', { data: reqObj }).catch(()=>{}); } catch(e){}

    close();
    showToast('تم إرسال طلب تصريح الحذف للإدارة بنجاح، وستتم مراجعته من قسم الرقابة', 'info');
    notifySupervisorNewAuthRequest(reqObj);
  };
}

async function loginRemote(name, password){
  const cleanName = String(name||'').trim();
  const cleanPass = String(password||'').trim();

  if(!cleanName || !cleanPass){
    throw new Error('يرجى إدخال اسم المستخدم وكلمة المرور');
  }

  const getEffectiveSections = (userRec, fallback) => {
    if(!userRec) return fallback || ['pos'];
    const r = userRec.Role || userRec.role;
    if(r === 'admin'){
      return ['maintenance', 'pos', 'invoices', 'cameras', 'cashdrawer', 'daily', 'finance', 'inventory', 'barcode', 'audit', 'users', 'settings'];
    }
    const raw = userRec.Sections || userRec.sections || fallback;
    const arr = Array.isArray(raw) ? raw : String(raw||'').split(',').map(s=>s.trim()).filter(Boolean);
    return arr.length ? arr : ['pos'];
  };

  if(!navigator.onLine){
    throw new Error('لا يمكن تسجيل الدخول في وضع عدم الاتصال بالإنترنت. يرجى الاتصال بالإنترنت لمصادقة بيانات الدخول.');
  }

  const res = await apiPost('login', {name: cleanName, password: cleanPass});
  if(res && !res.error && res.name && res.name.toLowerCase() === cleanName.toLowerCase()){
    if (res.sessionToken) {
      state.sessionToken = res.sessionToken;
      try {
        sessionStorage.setItem('microerp_session_token', res.sessionToken);
        localStorage.removeItem('microerp_session_token');
      } catch(e) {}
    }

    const effectiveRole = res.role || 'cashier';
    const isSuper = effectiveRole === 'admin' || !!res.superuser || !!res.Superuser;
    const effectiveSecs = getEffectiveSections(res, res.sections);

    const userObj = {
      ID: res.ID || ('usr_' + Date.now()),
      Name: res.name,
      Role: effectiveRole,
      Superuser: isSuper,
      Sections: effectiveSecs
    };

    if(!state.users) state.users = [];
    const idx = state.users.findIndex(u=>u.Name && u.Name.toLowerCase() === cleanName.toLowerCase());
    if(idx > -1) state.users[idx] = { ...state.users[idx], ...userObj }; else state.users.push(userObj);
    
    setCache('users', sanitizeUsersForStorage(state.users));
    try { localStorage.setItem('microerp_users_permanent', JSON.stringify(sanitizeUsersForStorage(state.users))); } catch(e){}

    const finalUser = {
      name: res.name,
      role: effectiveRole,
      superuser: isSuper,
      Superuser: isSuper,
      sections: effectiveSecs,
      sessionToken: res.sessionToken
    };
    return finalUser;
  }
  throw new Error((res && res.error) || 'اسم المستخدم أو كلمة المرور غير صحيحة');
}
