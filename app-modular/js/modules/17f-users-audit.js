/* ---------------- Users Management & Screen Customization Engine ---------------- */
function exportUsersToExcel(list){
  const rows = (list || state.users || []).map((u, idx) => {
    const secs = Array.isArray(u.Sections) ? u.Sections : String(u.Sections||'').split(',').map(s=>s.trim()).filter(Boolean);
    const secsLabels = secs.map(s => (SECTION_INFO[s]||{}).label || s).join(' + ');
    return {
      '#': idx + 1,
      'اسم المستخدم': u.Name,
      'المسمى / الدور': u.Role === 'admin' ? 'مدير عام' : (u.Role === 'cashier' ? 'كاشير' : (u.Role === 'technician' ? 'فني صيانة' : (u.Role === 'accountant' ? 'محاسب' : (u.Role === 'storekeeper' ? 'أمين مخزن' : u.Role)))),
      'الشاشات المسموحة': secsLabels,
      'عدد الشاشات': secs.length,
      'ملاحظات': u.Notes || ''
    };
  });
  exportToExcel(rows, `Users_Permissions_${new Date().toISOString().slice(0,10)}`);
}

function openUserModal(editUser=null){
  const isEdit = !!editUser;
  const isSuper = editUser ? (editUser.Role === 'admin' || !!editUser.Superuser || !!editUser.superuser) : false;
  const allSectionsList = [
    { key: 'maintenance', icon: getSvgIcon('tool', 14), label: 'الصيانة والتصليح', desc: 'استلام وتسليم الأجهزة، أوامر الشغل، والتتبع' },
    { key: 'pos', icon: getSvgIcon('pos', 14), label: 'نقطة البيع (POS)', desc: 'شاشة الكاشير السريعة، الباركود، وطباعة الإيصالات' },
    { key: 'invoices', icon: getSvgIcon('invoices', 14), label: 'الفواتير الضريبية والرسمية', desc: 'إصدار الفواتير، عروض الأسعار، ومتابعة التحصيل' },
    { key: 'cameras', icon: getSvgIcon('cameras', 16), label: 'كاميرات المراقبة (القسم العام)', desc: 'كتالوج الكاميرات وعروض الأسعار والتركيب' },
    { key: 'cameras_projects', icon: getSvgIcon('cameras', 16), label: 'مشاريع الكاميرات والمواقع', desc: 'إدارة المواقع، المشاريع، خريطة القنوات، والأجهزة المركبة' },
    { key: 'cameras_visits', icon: getSvgIcon('tool', 14), label: 'مهام وزيارات التركيب والصيانة', desc: 'جدولة وتنفيذ زيارات الفنيين، تسجيل الأعطال، وتوقيع العميل' },
    { key: 'cameras_contracts', icon: getSvgIcon('fileText', 14), label: 'عقود الصيانة والضمانات', desc: 'عقود الصيانة الدورية وتتبع الضمان والتنبيهات التلقائية' },
    { key: 'cashdrawer', icon: getSvgIcon('creditCard', 14), label: 'حركة الخزينة والدرج', desc: 'إدارة درج الكاشير، مقبوضات ومدفوعات النقدية، والعهد، وتقفيل الوردية' },
    { key: 'daily', icon: getSvgIcon('daily', 16), label: 'دفتر اليومية العامة', desc: 'سجل القيود وحركات العمليات اليومية الشاملة والمصروفات الإدارية' },
    { key: 'finance', icon: getSvgIcon('finance', 16), label: 'القسم المالي والمحاسبي', desc: 'شجرة الحسابات، قيود اليومية، ميزان المراجعة، والأرباح' },
    { key: 'inventory', icon: getSvgIcon('inventory', 16), label: 'المخزن العام والمشتريات', desc: 'الأصناف، فواتير الشراء، الموردين، والتحويلات' },
    { key: 'barcode', icon: getSvgIcon('barcode', 16), label: 'استوديو طباعة الباركود', desc: 'تصميم وطباعة ملصقات الباركود للمخزن والمنتجات وإيصالات الصيانة' },
    { key: 'audit', icon: getSvgIcon('audit', 16), label: 'الرقابة والتدقيق وتصاريح العمليات', desc: 'سجل عمليات النظام الشامل، اعتماد تصاريح الحذف، ومتابعة النشاط' },
    { key: 'users', icon: getSvgIcon('users', 16), label: 'المستخدمين والصلاحيات', desc: 'إدارة المستخدمين وتعيين أدوارهم وصلاحيات الشاشات و Superuser' },
    { key: 'settings', icon: getSvgIcon('settings', 16), label: 'الإعدادات وتخصيص النظام', desc: 'المظهر، الثيمات، رسائل واتساب، وبنود الضمان (متاح حصراً للمدير العام)' }
  ];

  let selectedSections = [];
  if(editUser){
    selectedSections = Array.isArray(editUser.Sections) ? [...editUser.Sections] : String(editUser.Sections||'').split(',').map(s=>s.trim()).filter(Boolean);
  } else {
    selectedSections = ['pos', 'cashdrawer'];
  }
  const initialRole = editUser ? editUser.Role : 'cashier';
  if(initialRole !== 'admin'){
    selectedSections = selectedSections.filter(s => s !== 'settings');
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:680px;max-height:92vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:16px;">
        <div>
          <h3 style="margin:0;font-size:17px;font-weight:900;display:flex;align-items:center;gap:8px;">
            <span>${isEdit ? 'تعديل المستخدم وتخصيص الصلاحيات' : 'إضافة مستخدم جديد وتخصيص الصلاحيات'}</span>
          </h3>
          <div style="font-size:12px;color:var(--ink-secondary);margin-top:3px;">
            تحديد بيانات الدخول وتعيين الشاشات والأقسام وصلاحية Superuser المباشرة للمستخدم
          </div>
        </div>
        <button class="btn btn-ghost btn-xs" id="closeUserModal" aria-label="إغلاق">&times;</button>
      </div>

      <div class="grid2" style="margin-bottom:14px;">
        <div class="field">
          <label>اسم المستخدم (لتسجيل الدخول) *</label>
          <input id="uModalName" value="${editUser ? editUser.Name : ''}" placeholder="مثال: أحمد الكاشير" autofocus ${isEdit && editUser.Name==='admin' ? 'readonly style="background:var(--paper3);"' : ''}>
        </div>
        <div class="field">
          <label>${isEdit ? 'كلمة المرور الجديدة (اتركها فارغة للإبقاء على الحالية)' : 'كلمة المرور *'}</label>
          <div style="position:relative;display:flex;align-items:center;">
            <input id="uModalPassword" type="password" value="" autocomplete="new-password" placeholder="${isEdit ? 'اتركه فارغاً للإبقاء على الحالية' : 'أدخل كلمة المرور'}" style="width:100%;padding-left:36px;">
            <button type="button" id="togglePassVisBtn" class="btn btn-ghost btn-xs" style="position:absolute;left:4px;height:28px;width:28px;padding:0;display:flex;align-items:center;justify-content:center;color:var(--ink-secondary);" title="إظهار / إخفاء كلمة المرور">
              ${getSvgIcon('eye', 14)}
            </button>
          </div>
        </div>
      </div>

      <div class="grid2" style="margin-bottom:14px;">
        <div class="field">
          <label>الدور الوظيفي / المسمى *</label>
          <select id="uModalRole">
            <option value="admin" ${initialRole==='admin'?'selected':''}>مدير عام (كامل الصلاحيات)</option>
            <option value="cashier" ${initialRole==='cashier'?'selected':''}>كاشير ومبيعات (نقطة بيع)</option>
            <option value="technician" ${initialRole==='technician'?'selected':''}>فني صيانة واستلام</option>
            <option value="accountant" ${initialRole==='accountant'?'selected':''}>محاسب مالي وإداري</option>
            <option value="storekeeper" ${initialRole==='storekeeper'?'selected':''}>أمين مخزن ومشتريات</option>
            <option value="custom" ${(!['admin','cashier','technician','accountant','storekeeper'].includes(initialRole))?'selected':''}>مخصص (تحديد يدوي للشاشات)</option>
          </select>
        </div>
        <div class="field">
          <label>ملاحظات إضافية</label>
          <input id="uModalNotes" value="${editUser ? (editUser.Notes||'') : ''}" placeholder="ملاحظات حول الموظف أو الفرع">
        </div>
      </div>

      <!-- Superuser Direct Authorization Box -->
      <div class="card" style="padding:14px 16px;background:rgba(239,68,68,0.03);border:1.5px solid #fca5a5;border-radius:var(--radius-sm);margin-bottom:16px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
          <div style="flex:1;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <span style="display:inline-flex;">${getSvgIcon('shield', 22)}</span>
              <div>
                <div style="color:#b91c1c;font-weight:900;font-size:14px;line-height:1.4;">
                  صلاحية الحذف والتعديل المباشر (Superuser Authorization)
                </div>
                <div style="color:#dc2626;font-weight:900;font-size:12.5px;margin-top:2px;">
                  (Superuser - بدون طلب موافقة من المدير)
                </div>
              </div>
            </div>
            <div style="font-size:12px;color:var(--ink-secondary);line-height:1.6;margin-top:6px;">
              تُمكّن المستخدم من حذف وتعديل وإلغاء المعاملات والعمليات مباشرة. أما إذا لم يتم تفعيلها، فعند قيامه بأي عملية حذف، سيطلب منه النظام إدخال سبب الحذف ويتم إرسال إشعار فوري لمدير النظام للموافقة أو الرفض (أو إدخال رمز المشرف).
            </div>
          </div>
          <div style="padding-top:4px;">
            <label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;background:var(--card-bg);border:1.5px solid ${isSuper ? '#ef4444' : 'var(--line)'};padding:7px 12px;border-radius:6px;user-select:none;transition:all 0.15s ease;" id="uModalSuperuserContainer">
              <input type="checkbox" id="uModalSuperuser" ${isSuper ? 'checked' : ''} ${isEdit && editUser.Name==='admin' ? 'disabled' : ''} style="width:18px;height:18px;cursor:pointer;accent-color:#dc2626;">
              <span style="font-size:12px;font-weight:800;color:${isSuper ? '#dc2626' : 'var(--ink)'};" id="uModalSuperuserLbl">
                ${isSuper ? 'مفعلة (Superuser)' : 'غير مفعلة (يتطلب إذن)'}
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- Section Permissions Box -->
      <div class="card" style="padding:14px 16px;background:var(--paper3);border:1px solid var(--line);margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
          <div>
            <h4 id="uModalSecCountTitle" style="margin:0;font-size:13.5px;font-weight:900;">الشاشات والأقسام المسموح بها (${selectedSections.length} من ${allSectionsList.length} مفعّلة)</h4>
            <div style="font-size:11.5px;color:var(--ink-secondary);margin-top:2px;">اختر الشاشات التي ستظهر للمستخدم في شاشته الرئيسية وقوائمه</div>
          </div>
          <!-- Quick Preset Buttons -->
          <div style="display:flex;gap:4px;flex-wrap:wrap;">
            <button class="btn btn-xs btn-ghost" id="presetAllBtn" type="button" title="تحديد جميع الشاشات المسموحة">الكل</button>
            <button class="btn btn-xs btn-ghost" id="presetCashierBtn" type="button">كاشير</button>
            <button class="btn btn-xs btn-ghost" id="presetTechBtn" type="button">فني</button>
            <button class="btn btn-xs btn-ghost" id="presetAccountantBtn" type="button">محاسب</button>
            <button class="btn btn-xs btn-ghost" id="presetClearBtn" type="button">إلغاء الكل</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:10px;" id="uModalSecGrid">
          ${allSectionsList.map(sec => {
            const isSettings = sec.key === 'settings';
            const isChecked = selectedSections.includes(sec.key);
            const isLockedSettings = isSettings && initialRole !== 'admin';
            return `
              <label id="secLabel_${sec.key}" style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;background:var(--card-bg);border:1.5px solid ${isChecked ? 'var(--primary)' : 'var(--line)'};border-radius:var(--radius-sm);cursor:${isLockedSettings?'not-allowed':'pointer'};transition:all 0.15s ease;opacity:${isLockedSettings?'0.75':'1'};" class="${isChecked?'checked-sec-box':''}">
                <input type="checkbox" data-seckey="${sec.key}" ${isChecked ? 'checked' : ''} ${isLockedSettings ? 'disabled' : ''} style="margin-top:3px;width:18px;height:18px;cursor:${isLockedSettings?'not-allowed':'pointer'};">
                <div style="flex:1;">
                  <div style="font-weight:800;font-size:13px;color:var(--ink);display:flex;align-items:center;justify-content:space-between;gap:6px;">
                    <span>${sec.icon} ${sec.label}</span>
                    ${isSettings ? `<span class="badge" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;font-size:10px;padding:1px 5px;border-radius:4px;font-weight:800;">حصراً للمدير</span>` : ''}
                  </div>
                  <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;line-height:1.3;">
                    ${sec.desc}
                  </div>
                </div>
              </label>
            `;
          }).join('')}
        </div>
      </div>

      <div class="actions-row">
        <button class="btn btn-ghost" id="cancelUserModalBtn" type="button">إلغاء</button>
        <button class="btn btn-primary" id="saveUserModalBtn" type="button">${getSvgIcon("check", 14)} حفظ وتطبيق الصلاحيات</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const syncSecUI = ()=>{
    const curRole = overlay.querySelector('#uModalRole') ? overlay.querySelector('#uModalRole').value : initialRole;
    const isCurAdmin = curRole === 'admin';
    if(!isCurAdmin){
      selectedSections = selectedSections.filter(s => s !== 'settings');
    }
    const title = overlay.querySelector('#uModalSecCountTitle');
    if(title) title.textContent = `الشاشات والأقسام المسموح بها (${selectedSections.length} من ${allSectionsList.length} مفعّلة)`;
    allSectionsList.forEach(sec => {
      const isChecked = selectedSections.includes(sec.key);
      const chk = overlay.querySelector(`input[data-seckey="${sec.key}"]`);
      const lbl = overlay.querySelector(`#secLabel_${sec.key}`);
      if(sec.key === 'settings'){
        if(chk){
          chk.checked = isCurAdmin && isChecked;
          chk.disabled = !isCurAdmin;
        }
        if(lbl){
          lbl.style.opacity = isCurAdmin ? '1' : '0.75';
          lbl.style.cursor = isCurAdmin ? 'pointer' : 'not-allowed';
          lbl.style.borderColor = (isCurAdmin && isChecked) ? 'var(--primary)' : 'var(--line)';
          lbl.classList.toggle('checked-sec-box', isCurAdmin && isChecked);
        }
      } else {
        if(chk) chk.checked = isChecked;
        if(lbl){
          lbl.style.borderColor = isChecked ? 'var(--primary)' : 'var(--line)';
          lbl.classList.toggle('checked-sec-box', isChecked);
        }
      }
    });
  };

  overlay.querySelector('#closeUserModal').onclick = ()=>overlay.remove();
  overlay.querySelector('#cancelUserModalBtn').onclick = ()=>overlay.remove();

  // Superuser checkbox handler
  const suChk = overlay.querySelector('#uModalSuperuser');
  const suLbl = overlay.querySelector('#uModalSuperuserLbl');
  const suCont = overlay.querySelector('#uModalSuperuserContainer');
  if(suChk && suLbl){
    suChk.onchange = ()=>{
      suLbl.textContent = suChk.checked ? 'مفعلة (Superuser)' : 'غير مفعلة (يتطلب إذن)';
      suLbl.style.color = suChk.checked ? '#dc2626' : 'var(--ink)';
      if(suCont) suCont.style.borderColor = suChk.checked ? '#ef4444' : 'var(--line)';
    };
  }

  // Checkbox toggle handlers
  overlay.querySelectorAll('input[data-seckey]').forEach(chk => {
    chk.onchange = ()=>{
      const key = chk.dataset.seckey;
      const curRole = overlay.querySelector('#uModalRole').value;
      if(key === 'settings' && curRole !== 'admin'){
        showToast('قسم الإعدادات متاح حصراً للمدير العام', 'warning');
        chk.checked = false;
        return;
      }
      if(chk.checked){
        if(!selectedSections.includes(key)) selectedSections.push(key);
      } else {
        selectedSections = selectedSections.filter(k => k !== key);
      }
      syncSecUI();
    };
  });

  // Presets
  overlay.querySelector('#presetAllBtn').onclick = ()=>{
    const curRole = overlay.querySelector('#uModalRole').value;
    selectedSections = allSectionsList.map(s => s.key);
    if(curRole !== 'admin') selectedSections = selectedSections.filter(s => s !== 'settings');
    syncSecUI();
  };
  overlay.querySelector('#presetCashierBtn').onclick = ()=>{ selectedSections = ['pos', 'cashdrawer']; syncSecUI(); };
  overlay.querySelector('#presetTechBtn').onclick = ()=>{ selectedSections = ['maintenance']; syncSecUI(); };
  overlay.querySelector('#presetAccountantBtn').onclick = ()=>{ selectedSections = ['daily', 'cashdrawer', 'invoices', 'finance', 'inventory']; syncSecUI(); };
  overlay.querySelector('#presetClearBtn').onclick = ()=>{ selectedSections = []; syncSecUI(); };

  // Role dropdown auto preset
  const roleSel = overlay.querySelector('#uModalRole');
  roleSel.onchange = ()=>{
    const val = roleSel.value;
    if(val === 'admin') {
      selectedSections = allSectionsList.map(s => s.key);
      if(suChk) {
        suChk.checked = true;
        suChk.disabled = true;
        if(suLbl) { suLbl.textContent = 'مفعلة تلقائياً للمدير (Superuser)'; suLbl.style.color = '#dc2626'; }
        if(suCont) suCont.style.borderColor = '#ef4444';
      }
    } else {
      if(suChk && (!editUser || editUser.Name !== 'admin')) {
        suChk.disabled = false;
        if(suLbl) {
          suLbl.textContent = suChk.checked ? 'مفعلة (Superuser)' : 'غير مفعلة (يتطلب إذن)';
          suLbl.style.color = suChk.checked ? '#dc2626' : 'var(--ink)';
        }
        if(suCont) suCont.style.borderColor = suChk.checked ? '#ef4444' : 'var(--line)';
      }
      if(val === 'cashier') selectedSections = ['pos', 'cashdrawer'];
      else if(val === 'technician') selectedSections = ['maintenance'];
      else if(val === 'accountant') selectedSections = ['daily', 'cashdrawer', 'invoices', 'finance', 'inventory'];
      else if(val === 'storekeeper') selectedSections = ['inventory', 'pos'];
      // Ensure settings is never selected for non-admin
      selectedSections = selectedSections.filter(s => s !== 'settings');
    }
    syncSecUI();
  };

  const togglePassBtn = overlay.querySelector('#togglePassVisBtn');
  if(togglePassBtn){
    togglePassBtn.onclick = () => {
      const pInp = overlay.querySelector('#uModalPassword');
      if(pInp){
        pInp.type = pInp.type === 'password' ? 'text' : 'password';
      }
    };
  }

  // Save handler
  overlay.querySelector('#saveUserModalBtn').onclick = async ()=>{
    const name = overlay.querySelector('#uModalName').value.trim();
    const password = overlay.querySelector('#uModalPassword').value.trim();
    const role = overlay.querySelector('#uModalRole').value;
    const notes = overlay.querySelector('#uModalNotes').value.trim();
    const isSuperuser = role === 'admin' || (overlay.querySelector('#uModalSuperuser') && overlay.querySelector('#uModalSuperuser').checked);

    if(!name){ showToast('يرجى إدخال اسم المستخدم', 'error'); return; }
    if(!isEdit && !password){ showToast('يرجى إدخال كلمة المرور للمستخدم الجديد', 'error'); return; }
    
    // Strict RBAC: strip settings if not admin
    if(role !== 'admin'){
      selectedSections = selectedSections.filter(s => s !== 'settings');
    }

    if(!selectedSections.length){ showToast('يرجى اختيار شاشة واحدة على الأقل للمستخدم', 'error'); return; }

    const userObj = {
      ID: editUser ? editUser.ID : ('usr_' + Date.now()),
      Name: name,
      Password: password,
      Role: role,
      Superuser: isSuperuser,
      Sections: selectedSections.join(','),
      Notes: notes
    };

    try{
      await saveUserRemote(userObj);

      try {
        recordAuditLog(
          isEdit ? 'تعديل مستخدم وصلاحيات' : 'إضافة مستخدم جديد',
          'users',
          `المستخدم (${name}) - الدور: ${role} - الأقسام: [${selectedSections.join(', ')}] - Superuser: ${isSuperuser ? 'مفعل' : 'معطل'}`,
          userObj.ID,
          'معتمد'
        );
      } catch(e){}

      // If current user modified own permissions, apply live
      if(state.user && state.user.name.toLowerCase() === name.toLowerCase()){
        state.user.role = role;
        state.user.superuser = isSuperuser;
        state.user.Superuser = isSuperuser;
        state.user.sections = selectedSections;
        try{ sessionStorage.setItem('microerp_session', JSON.stringify(state.user)); }catch(e){}
      }

      showToast(`تم حفظ وتخصيص صلاحيات المستخدم (${name}) بنجاح`, 'success');
      overlay.remove();
      const main = document.getElementById('main');
      if(main) renderUsersManagementPage(main);
    }catch(e){
      try {
        recordAuditLog(
          isEdit ? 'تعديل مستخدم محلياً' : 'إضافة مستخدم محلياً',
          'users',
          `حفظ محلي للمستخدم (${name})`,
          userObj.ID,
          'مكتمل'
        );
      } catch(err){}
      showToast('تم حفظ المستخدم محلياً بنجاح', 'info');
      overlay.remove();
      const main = document.getElementById('main');
      if(main) renderUsersManagementPage(main);
    }
  };
}

function renderUsersManagementPage(main){
  if(!canUserAccessSection('users')){
    main.innerHTML = `
      <div class="card" style="text-align:center;padding:40px 20px;border-top:4px solid var(--red);">
        <div style="display:flex;justify-content:center;margin-bottom:12px;">${getSvgIcon('alert', 48)}</div>
        <h2 style="color:var(--red);margin:0 0 8px;">غير مصرح بالدخول</h2>
        <p style="color:var(--ink-secondary);font-size:14px;max-width:480px;margin:0 auto 16px;">
          عفواً، لا يمتلك حسابك صلاحية إدارة المستخدمين وتخصيص الصلاحيات. يُسمح فقط للمدير العام ومسؤولي النظام المعتمدين بالوصول لهذه الصفحة.
        </p>
        <button class="btn btn-primary" onclick="state.currentSection=null;render();">الرجوع للمركز الرئيسي</button>
      </div>
    `;
    return;
  }

  const usersList = state.users || [];
  const totalUsers = usersList.length;
  const adminUsers = usersList.filter(u => u.Role === 'admin').length;
  const superUsers = usersList.filter(u => u.Role === 'admin' || !!u.Superuser || !!u.superuser).length;
  const cashierUsers = usersList.filter(u => u.Role === 'cashier' || String(u.Sections||'').includes('pos')).length;
  const techUsers = usersList.filter(u => u.Role === 'technician' || String(u.Sections||'').includes('maintenance')).length;

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("users", 22)} إدارة المستخدمين وتخصيص صلاحيات الشاشات</h2>
        <div class="subtitle mono" style="font-size:12px;color:var(--ink-secondary);">${totalUsers} مستخدم مسجل</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" id="importTechsAsUsersBtn">${getSvgIcon("users", 13)} استيراد الفنيين كمستخدمين</button>
        <button class="btn btn-ghost btn-sm" id="exportUsersExcelBtn">${getSvgIcon("download", 13)} تصدير CSV (Excel)</button>
        <button class="btn btn-primary btn-sm" id="addNewUserBtn">${getSvgIcon("plus", 13)} إضافة مستخدم جديد وتخصيص الصلاحيات</button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="stat-grid">
      <div class="stat-card blue">
        <div class="top-row"><span class="lbl">إجمالي المستخدمين المسجلين</span><div class="icon-box">${getSvgIcon("users", 18)}</div></div>
        <div class="num mono">${totalUsers}</div>
      </div>
      <div class="stat-card purple">
        <div class="top-row"><span class="lbl">مدراء بصلاحيات كاملة</span><div class="icon-box">${getSvgIcon("shield", 18)}</div></div>
        <div class="num mono">${adminUsers}</div>
      </div>
      <div class="stat-card red" style="border-color:#fca5a5;background:linear-gradient(135deg, #fff, #fef2f2);">
        <div class="top-row"><span class="lbl">صلاحية الحذف المباشر (Superuser)</span><div class="icon-box">${getSvgIcon("key", 18)}</div></div>
        <div class="num mono" style="color:#b91c1c;">${superUsers}</div>
      </div>
      <div class="stat-card green">
        <div class="top-row"><span class="lbl">مستخدمو نقطة البيع واليومية</span><div class="icon-box">${getSvgIcon("pos", 18)}</div></div>
        <div class="num mono">${cashierUsers}</div>
      </div>
      <div class="stat-card orange">
        <div class="top-row"><span class="lbl">فنيو الصيانة والمخزن</span><div class="icon-box">${getSvgIcon("tool", 18)}</div></div>
        <div class="num mono">${techUsers}</div>
      </div>
    </div>

    <div class="card">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>اسم المستخدم</th>
              <th>المسمى / الدور</th>
              <th>صلاحية Superuser (الحذف المباشر)</th>
              <th>أمان الحساب</th>
              <th>الشاشات والأقسام المسموح بها</th>
              <th>ملاحظات</th>
              <th>الإجراءات والتخصيص</th>
            </tr>
          </thead>
          <tbody>
            ${usersList.map((u, idx)=>{
              const secs = Array.isArray(u.Sections) ? u.Sections : String(u.Sections||'').split(',').map(s=>s.trim()).filter(Boolean);
              const isAdmin = u.Role === 'admin';
              const isSuper = isAdmin || !!u.Superuser || !!u.superuser;

              return `
                <tr>
                  <td class="mono" style="color:var(--ink-secondary);">${idx+1}</td>
                  <td>
                    <div style="font-weight:900;font-size:13.5px;color:var(--ink);">${u.Name}</div>
                    ${u.ID ? `<div class="mono" style="font-size:10.5px;color:var(--slate-400);">${u.ID}</div>` : ''}
                  </td>
                  <td>
                    <span class="status-badge ${isAdmin ? 'st-done' : 'st-check'}" style="font-size:11px;">
                      ${isAdmin ? 'مدير عام' : (u.Role === 'cashier' ? 'كاشير مبيعات' : (u.Role === 'technician' ? 'فني صيانة' : (u.Role === 'accountant' ? 'محاسب مالي' : (u.Role === 'storekeeper' ? 'أمين مخزن' : u.Role))))}
                    </span>
                  </td>
                  <td>
                    ${isSuper ? `
                      <span class="status-badge" style="background:#fee2e2;color:#991b1b;border:1px solid #fecaca;font-size:11px;font-weight:900;display:inline-flex;align-items:center;gap:4px;">
                        Superuser (مباشر)
                      </span>
                    ` : `
                      <span class="status-badge" style="background:var(--paper3);color:var(--ink-secondary);border:1px solid var(--line);font-size:11px;display:inline-flex;align-items:center;gap:4px;">
                        يتطلب إذن المدير
                      </span>
                    `}
                  </td>
                  <td>
                    <span class="status-badge st-done" style="font-size:11px;display:inline-flex;align-items:center;gap:4px;">
                      ${getSvgIcon('lock', 12)} مُشفَّرة ومؤمَّنة
                    </span>
                  </td>
                  <td>
                    <div style="display:flex;gap:4px;flex-wrap:wrap;max-width:360px;">
                      ${secs.length === 0 ? '<span style="color:var(--red);font-size:11px;">لا توجد شاشات</span>' : secs.map(s => {
                        const info = SECTION_INFO[s] || { label: s, icon: getSvgIcon('folder', 14) };
                        return `<span class="status-badge" style="background:var(--paper3);border:1px solid var(--line);font-size:10.5px;padding:2px 6px;">${info.icon} ${info.label}</span>`;
                      }).join('')}
                    </div>
                  </td>
                  <td style="font-size:11.5px;color:var(--ink-secondary);">${u.Notes || '-'}</td>
                  <td class="row-actions">
                    <button class="btn btn-xs btn-primary" data-useract="edit" data-uid="${u.ID||u.Name}">${getSvgIcon("edit", 13)} تخصيص الصلاحيات</button>
                    ${u.Name !== 'admin' && (!state.user || state.user.name !== u.Name) ? `
                      <button class="btn btn-xs btn-red" data-useract="del" data-uid="${u.ID||u.Name}">${getSvgIcon('trash', 13)}</button>
                    ` : ''}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Buttons
  document.getElementById('addNewUserBtn').onclick = ()=>openUserModal();
  document.getElementById('exportUsersExcelBtn').onclick = ()=>exportUsersToExcel(usersList);

  const importTechBtn = document.getElementById('importTechsAsUsersBtn');
  if(importTechBtn){
    importTechBtn.onclick = async ()=>{
      const techs = state.technicians || [];
      let addedCount = 0;
      for(const t of techs){
        if(!state.users.some(u => u.Name.toLowerCase() === t.toLowerCase())){
          // Generate a random 8-char temporary password for each auto-imported account
          const tempPass = Array.from(crypto.getRandomValues(new Uint8Array(4))).map(b => b.toString(16).padStart(2,'0')).join('');
          await saveUserRemote({
            ID: 'usr_' + Date.now() + '_' + Math.floor(Math.random()*1000),
            Name: t,
            Password: tempPass,
            Role: 'technician',
            Sections: 'maintenance',
            Notes: 'تم استيراده تلقائياً من قائمة الفنيين — يرجى تغيير كلمة المرور'
          });
          addedCount++;
        }
      }
      if(addedCount > 0){
        showToast(`تم استيراد ${addedCount} فني كحسابات مستخدمين بنجاح`, 'success');
        renderUsersManagementPage(main);
      } else {
        showToast('جميع الفنيين مسجلون بالفعل كمستخدمين', 'info');
      }
    };
  }

  // Row actions
  main.querySelectorAll('[data-useract]').forEach(btn => {
    btn.onclick = async ()=>{
      const uid = btn.dataset.uid;
      const u = state.users.find(x => (x.ID && x.ID === uid) || x.Name === uid);
      if(!u) return;
      const act = btn.dataset.useract;
      if(act === 'edit'){
        openUserModal(u);
      }
      if(act === 'del'){
        if(u.Name.toLowerCase() === 'admin'){
          showToast('لا يمكن حذف حساب المدير العام الأساسي للنظام', 'error');
          return;
        }
        if(state.user && (state.user.name.toLowerCase() === u.Name.toLowerCase() || (u.ID && state.user.id === u.ID))){
          showToast('لا يمكنك حذف حسابك الحالي أثناء تسجيل الدخول به', 'error');
          return;
        }

        requestAdminAuthorization({
          action: 'حذف مستخدم نظام',
          entityType: 'مستخدم وصلاحيات',
          entityId: u.ID || u.Name,
          entityTitle: `المستخدم (${u.Name}) [الدور: ${u.Role}]`,
          onApproved: async ()=>{
            try{
              await deleteUserRemote(u.ID || u.Name);
              try {
                recordAuditLog('حذف مستخدم', 'users', `تم حذف حساب المستخدم (${u.Name}) والدور (${u.Role}) بنجاح`, u.ID || u.Name, 'معتمد');
              } catch(e){}
              showToast(`تم حذف المستخدم (${u.Name}) بنجاح`, 'success');
              renderUsersManagementPage(main);
            }catch(e){
              showToast('تعذر الحذف: ' + e.message, 'error');
            }
          }
        });
      }
    };
  });
}

function renderUsersSectionApp(app){
  if(!canUserAccessSection('users')){
    showToast('ليس لديك صلاحية للوصول لإدارة المستخدمين والصلاحيات', 'error');
    state.currentSection = null;
    return render();
  }

  app.innerHTML = `
    <div class="sidebar">
      ${brandHtml("إدارة المستخدمين")}
      ${sectionSwitcherHtml()}
      <div class="sidebar-nav-wrap">
        <div class="nav-section">إدارة النظام</div>
        <div class="nav-item active"><span class="nav-item-icon">${getSvgIcon("users", 16)}</span><span>المستخدمين والصلاحيات</span></div>
        ${canUserAccessSection('audit') ? `<div class="nav-item" id="usersToAuditNav"><span class="nav-item-icon">${getSvgIcon("shield", 16)}</span><span>الرقابة والتصاريح</span></div>` : ''}
        ${canUserAccessSection('settings') ? `<div class="nav-item" id="usersToSettingsNav"><span class="nav-item-icon">${getSvgIcon("settings", 16)}</span><span>الإعدادات العامة</span></div>` : ''}
      </div>
      ${sidebarFootHtml()}
    </div>
    <main id="main"></main>
  `;
  const sw = document.getElementById('switchSectionBtn');
  if(sw) sw.onclick = ()=>{ state.currentSection = null; render(); };
  attachSidebarHandlers();
  const toAud = document.getElementById('usersToAuditNav');
  if(toAud) toAud.onclick = ()=>{ state.currentSection = 'audit'; render(); };
  const toSet = document.getElementById('usersToSettingsNav');
  if(toSet) toSet.onclick = ()=>{ state.currentSection = 'settings'; render(); };
  renderUsersManagementPage(document.getElementById('main'));
}

/* ---------------- Audit & Control Section Application ---------------- */
function renderAuditSectionApp(app){
  if(!canUserAccessSection('audit')){
    showToast('ليس لديك صلاحية للوصول لمركز الرقابة والتصاريح', 'error');
    state.currentSection = null;
    return render();
  }
  if(!state.auditTab) state.auditTab = 'logs';
  const pendingCount = (state.authRequests || []).filter(r => r.status === 'pending').length;
  const hasSysNav = canUserAccessSection('users') || canUserAccessSection('settings');

  app.innerHTML = `
    <div class="sidebar">
      ${brandHtml("الرقابة والتصاريح")}
      ${sectionSwitcherHtml()}
      <div class="sidebar-nav-wrap">
        <div class="nav-section">الإدارة والرقابة</div>
        <div class="nav-item ${state.auditTab==='logs'?'active':''}" id="auditNavLogs">
          <span class="nav-item-icon">${getSvgIcon("shield", 16)}</span><span>سجل الرقابة الشامل</span>
        </div>
        <div class="nav-item ${state.auditTab==='requests'?'active':''}" id="auditNavRequests">
          <span class="nav-item-icon">${getSvgIcon("lock", 16)}</span><span>تصاريح الحذف والعمليات</span>
          ${pendingCount > 0 ? `<span class="status-badge st-reject" style="font-size:11px;padding:2px 7px;">${pendingCount}</span>` : ''}
        </div>

        ${hasSysNav ? `
          <div class="nav-section">إدارة النظام</div>
          ${canUserAccessSection('users') ? `
            <div class="nav-item" id="auditToUsersNav">
              <span class="nav-item-icon">${getSvgIcon("users", 16)}</span><span>المستخدمين والصلاحيات</span>
            </div>
          ` : ''}
          ${canUserAccessSection('settings') ? `
            <div class="nav-item" id="auditToSettingsNav">
              <span class="nav-item-icon">${getSvgIcon("settings", 16)}</span><span>الإعدادات العامة</span>
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

  const navLogs = document.getElementById('auditNavLogs');
  if(navLogs) navLogs.onclick = ()=>{ state.auditTab = 'logs'; renderAuditSectionApp(app); };

  const navReqs = document.getElementById('auditNavRequests');
  if(navReqs) navReqs.onclick = ()=>{ state.auditTab = 'requests'; renderAuditSectionApp(app); };

  const toUsers = document.getElementById('auditToUsersNav');
  if(toUsers) toUsers.onclick = ()=>{ state.currentSection = 'users'; render(); };

  const toSet = document.getElementById('auditToSettingsNav');
  if(toSet) toSet.onclick = ()=>{ state.currentSection = 'settings'; render(); };

  renderAuditCenterPage(document.getElementById('main'));
  fetchServerAuditLogs().then(() => {
    const m = document.getElementById('main');
    if (m && state.currentSection === 'audit') {
      renderAuditCenterPage(m);
    }
  });
}

/* ---------------- Audit & Control Center (مركز الرقابة والتدقيق وتصاريح العمليات) ---------------- */

async function fetchServerAuditLogs(){
  if(state.user && state.user.role === 'admin'){
    try {
      const res = await apiGet('getAuditLog');
      if(res && res.ok && Array.isArray(res.logs)){
        state.auditLogs = res.logs.map(r => ({
          id: r.RowHash || ('srv_' + r.Timestamp),
          timestamp: r.Timestamp ? new Date(r.Timestamp).toISOString() : new Date().toISOString(),
          user: r.User || 'نظام',
          role: 'admin',
          action: r.Action || '',
          section: r.RefType || '',
          details: r.Details || '',
          refId: r.ReceiptID || '',
          status: 'success',
          rowHash: r.RowHash || ''
        })).reverse();
        setCache('audit_logs', state.auditLogs);
      }
    } catch(err){
      console.warn('fetchServerAuditLogs error:', err);
    }
  }
}

function exportAuditLogsToExcel(list){
  const headers = ['#', 'التاريخ والوقت', 'المستخدم', 'الدور', 'نوع العملية', 'القسم', 'البيان والتفاصيل', 'المرجع', 'الحالة'];
  const rows = (list || []).map((l, idx) => [
    idx + 1,
    new Date(l.timestamp).toLocaleString('ar-EG'),
    l.user || '',
    l.role === 'admin' ? 'مدير عام' : 'موظف',
    l.action || '',
    l.section || '',
    l.details || '',
    l.refId || '',
    l.status || ''
  ]);
  downloadCSV(`audit_logs_${new Date().toISOString().slice(0,10)}.csv`, headers, rows);
}

function renderAuditCenterPage(main){
  if(state.user && state.user.role !== 'admin'){
    main.innerHTML = `<div class="empty">عفواً: قسم الرقابة وتصاريح العمليات مقصور على المدير العام فقط.</div>`;
    return;
  }

  const activeTab = state.auditTab || 'logs'; // 'logs' | 'requests' | 'policies'
  const allLogs = state.auditLogs || [];
  const allRequests = state.authRequests || [];
  const pendingRequests = allRequests.filter(r => r.status === 'pending');

  // Filtering Logs
  let filteredLogs = allLogs;
  if(state.auditActionFilter && state.auditActionFilter !== 'all'){
    filteredLogs = filteredLogs.filter(l => (l.action||'').includes(state.auditActionFilter) || (l.section||'').includes(state.auditActionFilter));
  }
  if(state.auditUserFilter && state.auditUserFilter !== 'all'){
    filteredLogs = filteredLogs.filter(l => l.user === state.auditUserFilter);
  }
  if(state.auditDateFilter && state.auditDateFilter !== 'all'){
    const todayStr = new Date().toISOString().slice(0,10);
    if(state.auditDateFilter === 'today'){
      filteredLogs = filteredLogs.filter(l => (l.timestamp||'').slice(0,10) === todayStr);
    } else if(state.auditDateFilter === 'yesterday'){
      const y = new Date(); y.setDate(y.getDate()-1);
      const yStr = y.toISOString().slice(0,10);
      filteredLogs = filteredLogs.filter(l => (l.timestamp||'').slice(0,10) === yStr);
    } else if(state.auditDateFilter === 'week'){
      const w = new Date(); w.setDate(w.getDate()-7);
      const wStr = w.toISOString().slice(0,10);
      filteredLogs = filteredLogs.filter(l => (l.timestamp||'').slice(0,10) >= wStr);
    } else if(state.auditDateFilter === 'month'){
      const mStr = todayStr.slice(0,7) + '-01';
      filteredLogs = filteredLogs.filter(l => (l.timestamp||'').slice(0,10) >= mStr);
    }
  }
  if(state.auditSearchQ){
    const q = state.auditSearchQ.trim().toLowerCase();
    filteredLogs = filteredLogs.filter(l =>
      (l.action||'').toLowerCase().includes(q) ||
      (l.details||'').toLowerCase().includes(q) ||
      (l.user||'').toLowerCase().includes(q) ||
      (l.section||'').toLowerCase().includes(q) ||
      (l.refId||'').toLowerCase().includes(q)
    );
  }

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("shield", 22)} مركز الرقابة والتدقيق وتصاريح العمليات</h2>
        <div class="subtitle mono" style="font-size:12px;color:var(--ink-secondary);">${allLogs.length} حركة مسجلة</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" id="exportAuditExcelBtn">${getSvgIcon("download", 13)} تصدير السجل Excel</button>
        <button class="btn btn-primary btn-sm" id="refreshAuditBtn">${getSvgIcon("refresh", 13)} تحديث السجل</button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="stat-grid" style="grid-template-columns:repeat(auto-fit, minmax(210px, 1fr));gap:12px;margin-bottom:16px;">
      <div class="stat-card blue">
        <div class="top-row"><span class="lbl">إجمالي العمليات الموثقة</span><div class="icon-box">${getSvgIcon("fileText", 18)}</div></div>
        <div class="num mono">${allLogs.length}</div>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">تسجيل لحظي مشفر للأنشطة</div>
      </div>
      <div class="stat-card red" style="${pendingRequests.length>0?'border:2px solid #ef4444;background:#fef2f2;':''}">
        <div class="top-row"><span class="lbl" style="font-weight:800;color:#b91c1c;">طلبات تصاريح حذف معلقة</span><div class="icon-box" style="background:#fee2e2;color:#b91c1c;">${getSvgIcon("clock", 18)}</div></div>
        <div class="num mono" style="color:#b91c1c;">${pendingRequests.length}</div>
        <div style="font-size:11px;color:#991b1b;margin-top:2px;">${pendingRequests.length>0?'تتطلب قراراً إدارياً الآن':'لا توجد طلبات معلقة'}</div>
      </div>
      <div class="stat-card green">
        <div class="top-row"><span class="lbl">تصاريح الحذف المعتمدة</span><div class="icon-box">${getSvgIcon("check", 18)}</div></div>
        <div class="num mono">${allRequests.filter(r=>r.status==='approved').length}</div>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">حذف قانوني موثق ومصرح به</div>
      </div>
      <div class="stat-card purple">
        <div class="top-row"><span class="lbl">المستخدمين تحت الرقابة</span><div class="icon-box">${getSvgIcon("users", 18)}</div></div>
        <div class="num mono">${(state.users||[]).length}</div>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">حسابات موظفين وفنيين وكاشير</div>
      </div>
    </div>

    <!-- Sub-tabs navigation -->
    <div class="chip-group" id="auditSubTabs" style="margin-bottom:14px;border-bottom:1px solid var(--line);padding-bottom:8px;">
      <div class="chip ${activeTab==='logs'?'sel':''}" data-atab="logs" style="font-weight:800;padding:8px 16px;">
        ${getSvgIcon("fileText", 14)} سجل وتتبع العمليات الشامل (${allLogs.length})
      </div>
      <div class="chip ${activeTab==='requests'?'sel':''}" data-atab="requests" style="font-weight:800;padding:8px 16px;${pendingRequests.length>0?'border-color:#ef4444;color:#b91c1c;background:#fee2e2;':''}">
        ${getSvgIcon("lock", 14)} صندوق تصاريح وطلبات الحذف ${pendingRequests.length>0?`<span class="badge" style="background:#ef4444;color:#fff;border-radius:10px;padding:1px 6px;margin-right:4px;">${pendingRequests.length}</span>`:''}
      </div>
      <div class="chip ${activeTab==='policies'?'sel':''}" data-atab="policies" style="font-weight:800;padding:8px 16px;">
        ${getSvgIcon("settings", 14)} سياسات الرقابة والصلاحيات
      </div>
    </div>

    <!-- TAB CONTENT -->
    ${activeTab === 'logs' ? `
      <!-- Filter Bar for Audit Logs -->
      <div class="filters-bar" style="margin-bottom:12px;flex-wrap:wrap;">
        <select id="auditActionFilterSelect" style="min-width:170px;">
          <option value="all" ${state.auditActionFilter==='all'?'selected':''}>كل أنواع العمليات (الكل)</option>
          <option value="حذف" ${state.auditActionFilter==='حذف'?'selected':''}>عمليات الحذف والتصاريح</option>
          <option value="تغيير حالة" ${state.auditActionFilter==='تغيير حالة'?'selected':''}>تغيير حالات الأجهزة</option>
          <option value="دفعة" ${state.auditActionFilter==='دفعة'?'selected':''}>سداد ومقبوضات نقدية</option>
          <option value="مبيعات" ${state.auditActionFilter==='مبيعات'?'selected':''}>مبيعات الكاشير POS</option>
          <option value="مخزن" ${state.auditActionFilter==='مخزن'?'selected':''}>حركات وتعديل المخزن</option>
          <option value="فاتورة" ${state.auditActionFilter==='فاتورة'?'selected':''}>الفواتير والمطبوعات</option>
          <option value="دخول" ${state.auditActionFilter==='دخول'?'selected':''}>تسجيل الدخول والأمان</option>
        </select>

        <select id="auditUserFilterSelect" style="min-width:160px;">
          <option value="all" ${state.auditUserFilter==='all'?'selected':''}>كل المستخدمين (الكل)</option>
          ${(state.users||[]).map(u => `<option value="${escapeHtml(u.Name)}" ${state.auditUserFilter===u.Name?'selected':''}>${escapeHtml(u.Name)} (${u.Role==='admin'?'مدير':'موظف'})</option>`).join('')}
        </select>

        <div class="chip-group" id="auditDateChips">
          <div class="chip ${state.auditDateFilter==='all'?'sel':''}" data-adchip="all">كل الأوقات</div>
          <div class="chip ${state.auditDateFilter==='today'?'sel':''}" data-adchip="today">اليوم</div>
          <div class="chip ${state.auditDateFilter==='yesterday'?'sel':''}" data-adchip="yesterday">أمس</div>
          <div class="chip ${state.auditDateFilter==='week'?'sel':''}" data-adchip="week">آخر 7 أيام</div>
          <div class="chip ${state.auditDateFilter==='month'?'sel':''}" data-adchip="month">هذا الشهر</div>
        </div>

        <input id="auditSearchInp" placeholder="بحث في السجل، البيان، المرجع، أو التفاصيل..." value="${escapeHtml(state.auditSearchQ||'')}" style="flex:1;min-width:200px;">
        ${(state.auditSearchQ || state.auditActionFilter!=='all' || state.auditUserFilter!=='all' || state.auditDateFilter!=='all') ? `<button class="btn btn-ghost btn-sm" id="clearAuditFilters">إعادة ضبط</button>` : ''}
      </div>

      <!-- Logs Table -->
      <div class="card">
        ${filteredLogs.length === 0 ? '<div class="empty">لا توجد حركات مسجلة في سجل الرقابة مطابقة للفلتر الحالي.</div>' : `
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style="width:40px;">#</th>
                  <th>التاريخ والوقت</th>
                  <th>المستخدم والدور</th>
                  <th>نوع العملية</th>
                  <th>القسم</th>
                  <th>البيان والتفاصيل الكاملة</th>
                  <th>المرجع</th>
                  <th style="text-align:center;">الحالة والاعتماد</th>
                </tr>
              </thead>
              <tbody>
                ${filteredLogs.map((l, idx) => {
                  const isDelete = (l.action||'').includes('حذف');
                  const isPay = (l.action||'').includes('سداد') || (l.action||'').includes('دفعة');
                  const isSale = (l.action||'').includes('بيع') || (l.action||'').includes('POS');
                  const isStatus = (l.action||'').includes('حالة');

                  let actBadge = `<span class="badge" style="background:#f1f5f9;color:#334155;font-weight:800;border:1px solid #cbd5e1;">${l.action}</span>`;
                  if(isDelete) actBadge = `<span class="badge" style="background:#fee2e2;color:#b91c1c;font-weight:800;border:1px solid #fecaca;">${l.action}</span>`;
                  else if(isPay) actBadge = `<span class="badge" style="background:#e0f2fe;color:#0369a1;font-weight:800;border:1px solid #bae6fd;">${l.action}</span>`;
                  else if(isSale) actBadge = `<span class="badge" style="background:#dcfce7;color:#15803d;font-weight:800;border:1px solid #bbf7d0;">${l.action}</span>`;
                  else if(isStatus) actBadge = `<span class="badge" style="background:#fef3c7;color:#b45309;font-weight:800;border:1px solid #fde68a;">${l.action}</span>`;

                  return `
                    <tr>
                      <td class="mono" style="font-size:11px;color:var(--ink-secondary);font-weight:bold;">${filteredLogs.length - idx}</td>
                      <td style="font-size:11.5px;color:var(--ink-secondary);white-space:nowrap;" class="mono">${new Date(l.timestamp).toLocaleString('ar-EG', {dateStyle:'short', timeStyle:'short'})}</td>
                      <td>
                        <div style="font-weight:800;font-size:12.5px;">${escapeHtml(l.user)}</div>
                        <div style="font-size:10.5px;color:var(--ink-secondary);">${l.role==='admin'?'مدير عام':'موظف'}</div>
                      </td>
                      <td>${actBadge}</td>
                      <td><span style="font-size:11.5px;color:var(--ink-secondary);font-weight:600;">${escapeHtml(l.section||'-')}</span></td>
                      <td style="font-size:12.5px;line-height:1.4;max-width:320px;">
                        <div>${escapeHtml(l.details||'-')}</div>
                      </td>
                      <td class="mono" style="font-size:11.5px;color:var(--primary);">${escapeHtml(l.refId||'-')}</td>
                      <td style="text-align:center;">
                        <span class="status-badge ${l.status==='مرفوض'?'st-failed':(l.status==='بتصريح فوري'?'st-done':(l.status==='بانتظار الموافقة'?'st-repair':'st-check'))}" style="font-size:10.5px;">
                          ${l.status==='بتصريح فوري'?'بتصريح فوري':(l.status==='معتمد'?'معتمد':(l.status==='مرفوض'?'مرفوض':l.status||'مسجل'))}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    ` : ''}

    ${activeTab === 'requests' ? `
      <!-- PENDING REQUESTS -->
      <div style="margin-bottom:20px;">
        <h3 style="font-size:15px;margin-bottom:10px;display:flex;align-items:center;gap:8px;">
          <span>${getSvgIcon("clock", 14)} طلبات بانتظار قرار المدير العام</span>
          <span class="badge" style="background:${pendingRequests.length>0?'#ef4444':'#64748b'};color:#fff;">${pendingRequests.length} طلب</span>
        </h3>

        ${pendingRequests.length === 0 ? `
          <div class="card" style="padding:24px;text-align:center;color:var(--ink-secondary);background:var(--paper2);">
            <div style="margin-bottom:6px;">${getSvgIcon('check', 24)}</div>
            <div style="font-weight:700;font-size:13.5px;color:var(--ink);">صندوق التصاريح فارغ!</div>
            <div style="font-size:12px;margin-top:2px;">لا توجد أي طلبات حذف أو تعديلات معلقة من الموظفين حالياً.</div>
          </div>
        ` : `
          <div style="display:flex;flex-direction:column;gap:12px;">
            ${pendingRequests.map(req => `
              <div class="card" style="border-right:5px solid #ef4444;background:#fff;padding:16px;">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">
                  <div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                      <span style="display:inline-flex;">${getSvgIcon('lock', 18)}</span>
                      <span style="font-weight:900;font-size:14.5px;color:var(--ink);">${escapeHtml(req.action)}</span>
                      <span class="badge" style="background:#fee2e2;color:#b91c1c;font-weight:800;border:1px solid #fecaca;font-size:11px;">${escapeHtml(req.entityType)}</span>
                    </div>
                    <div style="font-size:13px;color:var(--ink);margin-bottom:6px;">
                      العنصر المستهدف: <b class="mono" style="color:#b91c1c;">${escapeHtml(req.entityTitle)}</b>
                    </div>
                    <div style="background:#f8fafc;border:1px dashed #cbd5e1;padding:8px 12px;border-radius:6px;margin-bottom:8px;">
                      <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">سبب طلب الحذف الموضح من الموظف:</div>
                      <div style="font-size:12.5px;color:var(--ink);font-weight:800;margin-top:2px;">"${escapeHtml(req.reason)}"</div>
                    </div>
                    <div style="font-size:11.5px;color:var(--ink-secondary);">
                      مقدم الطلب: <b>${escapeHtml(req.reqUser)}</b> • التوقيت: <span class="mono">${new Date(req.timestamp).toLocaleString('ar-EG')}</span>
                    </div>
                  </div>

                  <div style="display:flex;gap:8px;align-items:center;">
                    <button class="btn btn-green btn-sm" data-approveauth="${req.id}" style="font-weight:800;padding:8px 14px;">
                      ${getSvgIcon("check", 13)} موافقة واعتماد الحذف الآن
                    </button>
                    <button class="btn btn-red btn-sm" data-rejectauth="${req.id}" style="font-weight:800;padding:8px 14px;">
                      ${getSvgIcon("x", 13)} رفض الطلب
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- RESOLVED REQUESTS ARCHIVE -->
      <div class="card" style="margin-top:20px;">
        <h3 style="font-size:14px;margin-bottom:10px;display:flex;align-items:center;gap:6px;">${getSvgIcon("archive", 16)} أرشيف طلبات التصاريح السابقة</h3>
        ${allRequests.filter(r => r.status !== 'pending').length === 0 ? '<div class="empty">لا توجد طلبات سابقة بالأرشيف.</div>' : `
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>الموظف</th>
                  <th>العملية والعنصر</th>
                  <th>سبب الحذف</th>
                  <th>القرار الإداري</th>
                  <th>المعتمد / الرافض</th>
                </tr>
              </thead>
              <tbody>
                ${allRequests.filter(r => r.status !== 'pending').map(req => `
                  <tr>
                    <td class="mono" style="font-size:11.5px;color:var(--ink-secondary);white-space:nowrap;">${cleanDate(req.timestamp)}</td>
                    <td style="font-weight:700;">${escapeHtml(req.reqUser)}</td>
                    <td>
                      <div style="font-weight:800;font-size:12.5px;">${escapeHtml(req.action)}</div>
                      <div class="mono" style="font-size:11px;color:var(--ink-secondary);">${escapeHtml(req.entityTitle)}</div>
                    </td>
                    <td style="font-size:12px;color:var(--ink);">${escapeHtml(req.reason)}</td>
                    <td>
                      <span class="status-badge ${req.status==='approved'?'st-done':'st-failed'}">
                        ${req.status==='approved'?'تمت الموافقة والحذف':'تم الرفض'}
                      </span>
                    </td>
                    <td style="font-size:12px;">${escapeHtml(req.resolvedBy||'المدير العام')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    ` : ''}

    ${activeTab === 'policies' ? `
      <!-- Security Policies Overview -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:14px;">
        <div class="card" style="border-top:4px solid #16a34a;">
          <h3 style="font-size:14.5px;margin-bottom:8px;color:#15803d;display:flex;align-items:center;gap:6px;">
            <span>${getSvgIcon("lock", 16)}</span><span>سياسة الحذف الصارمة (Strict Delete Control)</span>
          </h3>
          <p style="font-size:12.5px;line-height:1.6;color:var(--ink-secondary);margin:0 0 10px;">
            مفعلة تلقائياً: لا يمكن لأي موظف عادي حذف إيصال صيانة، أو فاتورة، أو صنف مخزن، أو حركة مالية إلا بـ <b>تصريح فوري بكلمة مرور المدير</b> أو <b>تقديم طلب تصريح للإدارة</b> للمراجعة في هذا القسم.
          </p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:8px 12px;border-radius:6px;font-size:12px;color:#166534;font-weight:700;">
            النظام مؤمّن ضد الحذف العشوائي أو غير المعتمد
          </div>
        </div>

        <div class="card" style="border-top:4px solid #0284c7;">
          <h3 style="font-size:14.5px;margin-bottom:8px;color:#0369a1;display:flex;align-items:center;gap:6px;">
            <span>${getSvgIcon("wallet", 16)}</span><span>ضبط مدفوعات الصيانة ومنع الزيادة</span>
          </h3>
          <p style="font-size:12.5px;line-height:1.6;color:var(--ink-secondary);margin:0 0 10px;">
            مفعلة تلقائياً: يمنع النظام تماماً إدخال أو سداد أي مبلغ أكبر من المبلغ المتبقي على حساب الجهاز. كما يتم التحقق عند إدخال إيصال جديد من عدم تجاوز العربون للتكلفة الكلية.
          </p>
          <div style="background:#f0f9ff;border:1px solid #bae6fd;padding:8px 12px;border-radius:6px;font-size:12px;color:#075985;font-weight:700;">
            منع الأرصدة السالبة والأخطاء الحسابية
          </div>
        </div>

        <div class="card" style="border-top:4px solid #6366f1;">
          <h3 style="font-size:14.5px;margin-bottom:8px;color:#4338ca;display:flex;align-items:center;gap:6px;">
            <span>${getSvgIcon("daily", 16)}</span><span>فصل حسابات اليومية والخزينة</span>
          </h3>
          <p style="font-size:12.5px;line-height:1.6;color:var(--ink-secondary);margin:0 0 10px;">
            مفعلة تلقائياً: يتم فصل إيرادات الصيانة (ح/ 4101) عن مبيعات الكاشير POS (ح/ 4102) في بطاقات إحصائية مستقلة وشرائح تصفية وعمود حسابات صريح، مع منع ازدواجية الفواتير.
          </p>
          <div style="background:#e0e7ff;border:1px solid #c7d2fe;padding:8px 12px;border-radius:6px;font-size:12px;color:#3730a3;font-weight:700;">
            تقارير تقفيل نقدية منفصلة ودقيقة 100%
          </div>
        </div>

        <div class="card" style="border-top:4px solid #dc2626;">
          <h3 style="font-size:14.5px;margin-bottom:8px;color:#b91c1c;display:flex;align-items:center;gap:6px;">
            <span>${getSvgIcon("shield", 16)}</span><span>صلاحية Superuser (بدون طلب موافقة من المدير)</span>
          </h3>
          <p style="font-size:12.5px;line-height:1.6;color:var(--ink-secondary);margin:0 0 10px;">
            تُمكّن المستخدم من حذف وتعديل وإلغاء المعاملات والعمليات مباشرة. أما إذا لم يتم تفعيلها، فعند قيامه بأي عملية حذف، سيطلب منه النظام إدخال سبب الحذف ويتم إرسال إشعار فوري لمدير النظام للموافقة أو الرفض (أو إدخال رمز المشرف).
          </p>
          <div style="background:#fef2f2;border:1px solid #fecaca;padding:8px 12px;border-radius:6px;font-size:12px;color:#991b1b;font-weight:700;">
            تمنح للمستخدمين الموثوقين من شاشة إدارة المستخدمين
          </div>
        </div>
      </div>
    ` : ''}
  `;

  // Bindings
  document.querySelectorAll('#auditSubTabs .chip').forEach(c => {
    c.onclick = ()=>{
      state.auditTab = c.dataset.atab;
      renderAuditCenterPage(main);
    };
  });

  const actFilterSel = document.getElementById('auditActionFilterSelect');
  if(actFilterSel) actFilterSel.onchange = (e)=>{ state.auditActionFilter = e.target.value; renderAuditCenterPage(main); };

  const userFilterSel = document.getElementById('auditUserFilterSelect');
  if(userFilterSel) userFilterSel.onchange = (e)=>{ state.auditUserFilter = e.target.value; renderAuditCenterPage(main); };

  document.querySelectorAll('#auditDateChips .chip').forEach(c => {
    c.onclick = ()=>{
      state.auditDateFilter = c.dataset.adchip;
      renderAuditCenterPage(main);
    };
  });

  const searchInp = document.getElementById('auditSearchInp');
  if(searchInp) searchInp.oninput = (e)=>{ state.auditSearchQ = e.target.value; renderAuditCenterPage(main); };

  const clearBtn = document.getElementById('clearAuditFilters');
  if(clearBtn) clearBtn.onclick = ()=>{
    state.auditActionFilter = 'all';
    state.auditUserFilter = 'all';
    state.auditDateFilter = 'all';
    state.auditSearchQ = '';
    renderAuditCenterPage(main);
  };

  const refreshBtn = document.getElementById('refreshAuditBtn');
  if(refreshBtn) refreshBtn.onclick = async ()=>{
    refreshBtn.disabled = true;
    refreshBtn.textContent = 'جارٍ التحديث...';
    await fetchServerAuditLogs();
    renderAuditCenterPage(main);
  };

  const expBtn = document.getElementById('exportAuditExcelBtn');
  if(expBtn) expBtn.onclick = ()=> exportAuditLogsToExcel(filteredLogs);

  // Approve Authorization Request
  main.querySelectorAll('[data-approveauth]').forEach(btn => {
    btn.onclick = async ()=>{
      const reqId = btn.dataset.approveauth;
      const req = (state.authRequests||[]).find(x => x.id === reqId);
      if(!req) return;

      const ok = await openConfirmModal({
        title: 'اعتماد تصريح الحذف',
        message: `هل أنت متأكد من اعتماد طلب الحذف وحذف (${req.entityTitle}) نهائياً من النظام؟`,
        confirmText: 'اعتماد الحذف النهائي',
        confirmClass: 'btn-danger',
        icon: 'trash'
      });
      if(!ok) return;

      btn.disabled = true; btn.textContent = 'جارٍ التنفيذ...';
      try {
        // Execute the actual deletion based on entityType
        if(req.entityType.includes('إيصال')){
          await deleteReceiptRemote(req.entityId);
          state.receipts = (state.receipts||[]).filter(x => x.id !== req.entityId);
        } else if(req.entityType.includes('فاتورة')){
          await deleteInvoiceRemote(req.entityId);
          state.invoices = (state.invoices||[]).filter(x => x.ID !== req.entityId);
        } else if(req.entityType.includes('مخزن') || req.entityType.includes('صنف')){
          await deleteInventoryItemRemote(req.entityId);
          state.inventory = (state.inventory||[]).filter(x => x.ID !== req.entityId);
        } else if(req.entityType.includes('مصروف') || req.entityType.includes('يومية')){
          await deleteExpenseRemote(req.entityId);
          state.expenses = (state.expenses||[]).filter(x => x.ID !== req.entityId);
        }

        req.status = 'approved';
        req.resolvedBy = state.user.name;
        req.resolvedAt = new Date().toISOString();
        setCache('auth_requests', state.authRequests);
        try { localStorage.setItem('microerp_auth_requests', JSON.stringify(state.authRequests)); } catch(e){}

        recordAuditLog('اعتماد تصريح حذف', req.entityType, `تم اعتماد حذف (${req.entityTitle}) المطلوب من الموظف (${req.reqUser}) بواسطة المدير (${state.user.name})`, req.entityId, 'معتمد');

        showToast(`تم اعتماد الطلب وحذف (${req.entityTitle}) بنجاح`, 'success');
        renderAuditCenterPage(main);
      } catch(err){
        showToast('تعذر تنفيذ الحذف: ' + err.message, 'error');
        btn.disabled = false; btn.textContent = '${getSvgIcon("check", 13)} موافقة واعتماد الحذف الآن';
      }
    };
  });

  // Reject Authorization Request
  main.querySelectorAll('[data-rejectauth]').forEach(btn => {
    btn.onclick = async ()=>{
      const reqId = btn.dataset.rejectauth;
      const req = (state.authRequests||[]).find(x => x.id === reqId);
      if(!req) return;

      const ok = await openConfirmModal({
        title: 'رفض تصريح الحذف',
        message: `هل أنت متأكد من رغبتك في رفض طلب حذف (${req.entityTitle})؟`,
        confirmText: 'رفض الطلب',
        confirmClass: 'btn-amber',
        icon: 'alertTriangle'
      });
      if(!ok) return;

      req.status = 'rejected';
      req.resolvedBy = state.user.name;
      req.resolvedAt = new Date().toISOString();
      setCache('auth_requests', state.authRequests);
      try { localStorage.setItem('microerp_auth_requests', JSON.stringify(state.authRequests)); } catch(e){}

      recordAuditLog('رفض تصريح حذف', req.entityType, `تم رفض طلب حذف (${req.entityTitle}) المطلوب من الموظف (${req.reqUser}) بواسطة المدير (${state.user.name})`, req.entityId, 'مرفوض');

      showToast(`تم رفض طلب الحذف`, 'info');
      renderAuditCenterPage(main);
    };
  });
}
