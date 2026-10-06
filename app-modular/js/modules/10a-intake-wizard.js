/* ---------------- U13: Intake Draft Auto-Save & Recovery Engine ---------------- */
const DRAFT_AUTOSAVE_KEY = 'microerp_draft_autosave';
let draftAutosaveTimer = null;

function isDraftPopulated(d){
  if(!d) return false;
  // Has customer details?
  if(d.customer && (d.customer.name || d.customer.phone || d.customer.email)) return true;
  // Has any device model, password, accessories, faults or photos?
  if(Array.isArray(d.devices)){
    for(const dev of d.devices){
      if(dev.model || (dev.faults && dev.faults.length) || (dev.photos && dev.photos.length) || dev.password || dev.accessories || dev.faultNotes){
        return true;
      }
    }
  }
  if(d.device && (d.device.model || d.device.password || d.device.accessories)) return true;
  if(Array.isArray(d.faults) && d.faults.length > 0) return true;
  if(Array.isArray(d.photos) && d.photos.length > 0) return true;
  if(Array.isArray(d.serviceItems) && d.serviceItems.length > 0) return true;
  if(Number(d.cost || 0) > 0 || Number(d.deposit || 0) > 0 || Number(d.otherAccountAmount || 0) > 0) return true;
  return false;
}

function saveIntakeDraftToStorage(draft = null, step = null){
  const d = draft || state.draft;
  if(!d) return false;
  if(!isDraftPopulated(d)) return false;

  try {
    const curStep = (step != null) ? Number(step) : (state.formStep != null ? Number(state.formStep) : 0);
    const payload = Object.assign({}, d, {
      _savedStep: curStep,
      _savedAt: new Date().toISOString()
    });

    if(Array.isArray(payload.devices)){
      payload.devices = payload.devices.map(dev => Object.assign({}, dev));
    }

    const str = JSON.stringify(payload);
    if(typeof safeLocalStorageSet === 'function'){
      safeLocalStorageSet(DRAFT_AUTOSAVE_KEY, str);
    } else {
      localStorage.setItem(DRAFT_AUTOSAVE_KEY, str);
    }
    return true;
  } catch(err){
    console.warn('[DraftAutosave] save error:', err);
    return false;
  }
}

function loadIntakeDraftFromStorage(){
  try {
    const raw = localStorage.getItem(DRAFT_AUTOSAVE_KEY) || localStorage.getItem('microerp_intake_draft');
    if(!raw) return null;
    const d = JSON.parse(raw);
    if(!d || typeof d !== 'object') return null;

    if(!Array.isArray(d.devices) || d.devices.length === 0){
      if(d.device){
        d.devices = [Object.assign({}, d.device)];
      } else {
        d.devices = [{
          id: 'dev_restored_' + Date.now(),
          category: 'لابتوب',
          brand: 'Apple',
          brandOther: '',
          model: '',
          accessories: '',
          password: '',
          faults: [],
          faultNotes: '',
          technician: '',
          photos: []
        }];
      }
    }

    if(d.activeDeviceIndex == null || d.activeDeviceIndex < 0 || d.activeDeviceIndex >= d.devices.length){
      d.activeDeviceIndex = 0;
    }

    try {
      delete d.device;
      Object.defineProperty(d, 'device', {
        get() {
          if(!this.devices || this.devices.length === 0) return null;
          const idx = (this.activeDeviceIndex != null && this.activeDeviceIndex >= 0 && this.activeDeviceIndex < this.devices.length) ? this.activeDeviceIndex : 0;
          return this.devices[idx];
        },
        set(val) {
          if(!this.devices) this.devices = [];
          const idx = (this.activeDeviceIndex != null && this.activeDeviceIndex >= 0) ? this.activeDeviceIndex : 0;
          this.devices[idx] = val;
        },
        configurable: true,
        enumerable: true
      });
    } catch(e){}

    if(!Array.isArray(d.serviceItems)) d.serviceItems = [];
    if(!Array.isArray(d.faults)) d.faults = [];
    if(!Array.isArray(d.photos)) d.photos = (d.devices || []).flatMap(x => x.photos || []);
    if(!d.customer) d.customer = { title: '', name: '', phone: '', email: '' };

    return d;
  } catch(e){
    console.warn('[DraftAutosave] load error:', e);
    return null;
  }
}

function clearIntakeDraftFromStorage(){
  try {
    localStorage.removeItem(DRAFT_AUTOSAVE_KEY);
    localStorage.removeItem('microerp_intake_draft');
  } catch(e){}
  removeDraftBootBanner();
}

function triggerDraftAutosave(immediate = false){
  if(!state.draft) return;
  if(draftAutosaveTimer){
    clearTimeout(draftAutosaveTimer);
    draftAutosaveTimer = null;
  }
  const doSave = () => {
    try {
      if(typeof currentStepCollector === 'function'){
        currentStepCollector();
      }
      if(state.draft && isDraftPopulated(state.draft)){
        saveIntakeDraftToStorage(state.draft, state.formStep);
        updateDraftStatusIndicator(true);
      }
    } catch(e){
      console.warn('[triggerDraftAutosave] execution error:', e);
    }
  };

  if(immediate){
    doSave();
  } else {
    updateDraftStatusIndicator(false);
    draftAutosaveTimer = setTimeout(doSave, 2000); // 2 seconds mechanical debounce
  }
}

function updateDraftStatusIndicator(isSaved){
  const badge = document.getElementById('draftAutosaveBadge');
  const txt = document.getElementById('draftAutosaveText');
  if(!badge) return;
  if(isSaved){
    const d = new Date();
    const timeStr = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if(txt) txt.textContent = `مسودة محفوظة تلقائياً (${timeStr})`;
    badge.style.color = 'var(--green-text, #059669)';
    badge.style.borderColor = 'rgba(16,185,129,0.3)';
    badge.style.background = 'rgba(16,185,129,0.06)';
  } else {
    if(txt) txt.textContent = 'جارٍ الحفظ التلقائي...';
    badge.style.color = 'var(--amber-text, #d97706)';
    badge.style.borderColor = 'rgba(245,158,11,0.3)';
    badge.style.background = 'rgba(245,158,11,0.06)';
  }
}

function checkAndShowDraftBootBanner(){
  if(typeof document === 'undefined' || !document.body) return;
  if(state.currentSection === 'maintenance' && state.tab === 'new'){
    removeDraftBootBanner();
    return;
  }
  const saved = loadIntakeDraftFromStorage();
  if(!saved || !isDraftPopulated(saved)){
    removeDraftBootBanner();
    return;
  }
  let banner = document.getElementById('draftBootBanner');
  if(!banner){
    banner = document.createElement('div');
    banner.id = 'draftBootBanner';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99998;background:linear-gradient(90deg, #1e293b, #0f172a);color:#fff;padding:8px 16px;border-bottom:2px solid var(--primary);font-size:12.5px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 4px 15px rgba(0,0,0,0.3);direction:rtl;flex-wrap:wrap;gap:8px;';
    document.body.prepend(banner);
  }
  document.body.style.paddingTop = '42px';
  const cName = (saved.customer && saved.customer.name) ? escapeHtml(saved.customer.name) : 'عميل غير مسمى';
  const dModel = (saved.device && saved.device.model) ? escapeHtml(saved.device.model) : ((saved.devices && saved.devices[0] && saved.devices[0].model) ? escapeHtml(saved.devices[0].model) : 'جهاز');
  const savedDate = saved.date || '';

  banner.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="font-size:16px;">📋</span>
      <span>
        <b>توجد مسودة استلام غير مكتملة</b>
        <span style="opacity:0.85;margin-right:6px;">(العميل: <b style="color:var(--primary-light, #34d399);">${cName}</b> — الجهاز: <b>${dModel}</b> ${savedDate ? '— ' + savedDate : ''})</span>
      </span>
    </div>
    <div style="display:flex;gap:8px;align-items:center;">
      <button type="button" id="resumeDraftBootBtn" class="btn btn-primary btn-xs" style="font-weight:800;padding:4px 12px;font-size:12px;">
        استئناف المسودة
      </button>
      <button type="button" id="deleteDraftBootBtn" class="btn btn-ghost btn-xs text-danger" style="background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);padding:4px 10px;font-size:12px;">
        حذف
      </button>
      <button type="button" id="dismissDraftBootBtn" style="background:transparent;border:none;color:#94a3b8;font-size:16px;cursor:pointer;padding:0 6px;" title="إغلاق الشريط">✕</button>
    </div>
  `;

  banner.querySelector('#resumeDraftBootBtn').onclick = () => {
    state.draft = saved;
    state.formStep = (saved._savedStep != null) ? Number(saved._savedStep) : 0;
    state.draft._isRestored = true;
    state.currentSection = 'maintenance';
    state.tab = 'new';
    removeDraftBootBanner();
    if(typeof render === 'function') render();
    else if(typeof renderMain === 'function') renderMain();
    if(typeof showToast === 'function') showToast('تم استئناف مسودة الاستلام بنجاح', 'success');
  };

  banner.querySelector('#deleteDraftBootBtn').onclick = () => {
    clearIntakeDraftFromStorage();
    if(state.draft === saved) state.draft = null;
    removeDraftBootBanner();
    if(typeof showToast === 'function') showToast('تم حذف مسودة الاستلام', 'info');
  };

  banner.querySelector('#dismissDraftBootBtn').onclick = () => {
    removeDraftBootBanner();
  };
}

function removeDraftBootBanner(){
  const b = document.getElementById('draftBootBanner');
  if(b) b.remove();
  if(document.body && document.body.style.paddingTop === '42px'){
    document.body.style.paddingTop = '';
  }
}

// Global beforeunload warning to prevent accidental data loss when draft is active
window.addEventListener('beforeunload', (e) => {
  if(state.draft && typeof isDraftPopulated === 'function' && isDraftPopulated(state.draft)){
    try {
      if(typeof currentStepCollector === 'function') currentStepCollector();
      if(typeof saveIntakeDraftToStorage === 'function') saveIntakeDraftToStorage(state.draft, state.formStep);
    } catch(err){}
    e.preventDefault();
    e.returnValue = 'توجد مسودة استلام غير مكتملة، هل أنت متأكد من المغادرة؟';
    return e.returnValue;
  }
});

/* ---------------- New Receipt Form ---------------- */
function startNewDraft(forceFresh = false){
  state.tab = 'new';
  updateSidebarNav();
  if(!forceFresh){
    const saved = loadIntakeDraftFromStorage();
    if(saved && isDraftPopulated(saved)){
      state.draft = saved;
      state.formStep = (saved._savedStep != null) ? Number(saved._savedStep) : 0;
      state.draft._isRestored = true;
      removeDraftBootBanner();
      renderMain();
      return;
    }
  }
  clearIntakeDraftFromStorage();
  state.draft = newDraft();
  state.formStep = 0;
  nextReceiptNumber()
    .then(n=>{ state.draft.receiptNumber = n; renderMain(); })
    .catch(e=>{ state.draft.receiptNumber = 'MT-'+Date.now(); renderMain(); });
}

const STEPS = ['بيانات العميل','بيانات الجهاز','الأعطال والفني','المالي والمخزن','مراجعة وحفظ'];
let currentStepCollector = null;

function renderForm(main){
  if(!state.draft){
    const saved = loadIntakeDraftFromStorage();
    if(saved && isDraftPopulated(saved)){
      state.draft = saved;
      state.formStep = (saved._savedStep != null) ? Number(saved._savedStep) : 0;
      state.draft._isRestored = true;
    } else {
      startNewDraft(true);
      return;
    }
  }
  removeDraftBootBanner();
  const d = state.draft;
  main.innerHTML = `
    <div class="top-header" style="flex-wrap:wrap;gap:10px;">
      <div>
        <h2 class="page-title">${getSvgIcon("plus", 22)} إيصال استلام جهاز جديد</h2>
        <div class="subtitle">رقم الإيصال: <b class="mono" style="color:var(--primary);">${d.receiptNumber || '...'}</b> — التاريخ: <b class="mono">${d.date}</b></div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span id="draftAutosaveBadge" class="badge" style="background:var(--paper2);border:1px solid var(--line);color:var(--ink-secondary);font-size:11.5px;padding:4px 8px;display:inline-flex;align-items:center;gap:5px;">
          ${getSvgIcon("check", 12)} <span id="draftAutosaveText">${d._savedAt ? 'مسودة محفوظة تلقائياً' : 'حفظ تلقائي مفعّل'}</span>
        </span>
        <button type="button" class="btn btn-ghost btn-xs" id="manualSaveDraftBtn" style="border:1px solid var(--line);">${getSvgIcon("save", 13)} حفظ المسودة</button>
        <button type="button" class="btn btn-ghost btn-xs text-danger" id="discardDraftBtn" style="color:var(--red);border:1px solid rgba(239,68,68,0.25);">${getSvgIcon("trash", 13)} مسح المسودة والبدء من جديد</button>
      </div>
    </div>
    ${d._isRestored ? `
      <div id="draftRestoredAlert" style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.3);border-radius:6px;padding:8px 12px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--green-text);">
          <span>${getSvgIcon("check", 16)}</span>
          <span><b>تمت استعادة المسودة المحفوظة تلقائياً بنجاح</b> (الخطوة ${state.formStep + 1} من ${STEPS.length})</span>
        </div>
        <button type="button" class="btn btn-ghost btn-xs" style="color:var(--ink-secondary);padding:2px 6px;" onclick="this.closest('#draftRestoredAlert').remove()">✕ إغلاق التنبيه</button>
      </div>
    ` : ''}
    <div class="stepper">
      ${STEPS.map((s,i)=>`<div class="step-dot ${i===state.formStep?'active':(i<state.formStep?'done':'')}" data-i="${i}">
        <span>${i<state.formStep?getSvgIcon("check", 12):(i+1)}</span><span>${s}</span>
      </div>`).join('')}
    </div>
    <div id="stepBody"></div>
  `;

  // Attach autosave listeners to form inputs and changes via event delegation
  main.oninput = () => {
    updateDraftStatusIndicator(false);
    triggerDraftAutosave(false);
  };
  main.onchange = () => {
    triggerDraftAutosave(false);
  };

  // Wire manual save draft button
  const saveBtn = document.getElementById('manualSaveDraftBtn');
  if(saveBtn){
    saveBtn.onclick = () => {
      if(typeof currentStepCollector === 'function') currentStepCollector();
      if(saveIntakeDraftToStorage(state.draft, state.formStep)){
        updateDraftStatusIndicator(true);
        if(typeof showToast === 'function') showToast('تم حفظ مسودة الاستلام بنجاح', 'success');
      } else {
        if(typeof showToast === 'function') showToast('لا توجد بيانات جديدة لحفظها في المسودة', 'info');
      }
    };
  }

  // Wire discard draft button
  const discardBtn = document.getElementById('discardDraftBtn');
  if(discardBtn){
    discardBtn.onclick = () => {
      const doDiscard = () => {
        clearIntakeDraftFromStorage();
        state.draft = null;
        startNewDraft(true);
        if(typeof showToast === 'function') showToast('تم مسح المسودة والبدء بإيصال جديد', 'info');
      };
      openConfirmModal({
        title: 'مسح مسودة الاستلام',
        message: 'هل أنت متأكد من مسح كافة بيانات المسودة الحالية والبدء من جديد؟ سيتم حذف البيانات المدخلة في هذه المسودة.',
        confirmText: 'نعم، مسح المسودة',
        confirmClass: 'btn-danger',
        onConfirm: doDiscard
      });
    };
  }

  document.querySelectorAll('.step-dot').forEach(el=>el.onclick=()=>{
    if(typeof currentStepCollector==='function') currentStepCollector();
    state.formStep = Number(el.dataset.i);
    triggerDraftAutosave(true);
    renderMain();
  });
  const body = document.getElementById('stepBody');
  if(state.formStep===0) return stepCustomer(body,d);
  if(state.formStep===1) return stepDevice(body,d);
  if(state.formStep===2) return stepFaults(body,d);
  if(state.formStep===3) return stepFinance(body,d);
  if(state.formStep===4) return stepReview(body,d);
}

function stepNav(body, canBack, canNext, nextLabel){
  const div = document.createElement('div');
  div.className='actions-row';
  div.innerHTML = `
    <button class="btn btn-ghost" id="backBtn" ${canBack?'':'disabled'}>السابق</button>
    <button class="btn btn-primary" id="nextBtn">${nextLabel||'التالي'}</button>
  `;
  body.appendChild(div);
  if(canBack) div.querySelector('#backBtn').onclick = ()=>{ 
    if(typeof currentStepCollector==='function') currentStepCollector(); 
    state.formStep--; 
    triggerDraftAutosave(true);
    renderMain(); 
  };
  div.querySelector('#nextBtn').onclick = canNext;
}

function stepCustomer(body,d){
  recoverAndSyncAllCustomerPhones(false);
  const custOptions = state.customers.map(c=>`<option value="${escapeHtml(c.name)}">${c.title ? escapeHtml(c.title)+' / ' : ''}${escapeHtml(c.name)} - ${escapeHtml(c.phone||'بدون هاتف')}</option>`).join('');
  const curTitle = (d.customer && d.customer.title) || '';
  const titleOptions = [''].concat(CUSTOMER_TITLES).map(t=>`<option value="${escapeHtml(t)}" ${curTitle===t?'selected':''}>${t ? escapeHtml(t) : '-- بدون لقب --'}</option>`).join('');

  body.innerHTML = `
    <div class="card">
      <h3>${getSvgIcon("user", 18)} بيانات العميل</h3>
      <div class="field"><label>اختر عميل سابق (اختياري للسرعة)</label>
        <select id="custSelect"><option value="">-- اختر عميل مسجل (${state.customers.length} عميل) --</option>${custOptions}</select>
      </div>
      <button class="btn btn-ghost btn-sm" id="walkInBtn" type="button" style="margin-bottom:14px;">عميل زائر / Walk-in</button>
      <div style="display:grid;grid-template-columns:140px 1fr 1fr 1fr;gap:12px;" class="customer-fields-grid">
        <div class="field">
          <label>اللقب (اختياري)</label>
          <select id="cTitle">
            ${titleOptions}
          </select>
        </div>
        <div class="field">
          <label>اسم العميل *</label>
          <input id="cName" value="${escapeHtml(d.customer.name||'')}" placeholder="الاسم ثلاثي" list="custNamesDatalist">
          <datalist id="custNamesDatalist">
            ${state.customers.map(c=>`<option value="${escapeHtml(c.name)}">`).join('')}
          </datalist>
        </div>
        <div class="field">
          <label>رقم الهاتف *</label>
          <input id="cPhone" value="${escapeHtml(d.customer.phone||'')}" placeholder="01xxxxxxxxx" class="mono" list="custPhonesDatalist">
          <datalist id="custPhonesDatalist">
            ${state.customers.filter(c=>c.phone).map(c=>`<option value="${escapeHtml(c.phone)}">${c.title ? escapeHtml(c.title)+' / ' : ''}${escapeHtml(c.name)}</option>`).join('')}
          </datalist>
        </div>
        <div class="field"><label>البريد الإلكتروني (اختياري)</label><input id="cEmail" value="${escapeHtml(d.customer.email||'')}"></div>
      </div>
    </div>
  `;
  document.getElementById('custSelect').onchange = (e)=>{
    const c = state.customers.find(x=>x.name===e.target.value);
    if(c){
      if(c.title) document.getElementById('cTitle').value=c.title;
      document.getElementById('cName').value=c.name;
      document.getElementById('cPhone').value=c.phone||'';
      document.getElementById('cEmail').value=c.email||'';
    }
  };
  document.getElementById('cName').onchange = (e)=>{
    const typed = e.target.value.trim();
    if(typed){
      const parsed = parseCustomerTitleAndName(typed);
      if(parsed.title && !document.getElementById('cTitle').value){
        document.getElementById('cTitle').value = parsed.title;
        document.getElementById('cName').value = parsed.name;
      }
      const cleanTyped = (parsed.name || typed).trim();
      const found = state.customers.find(x=>(x.name||'').toLowerCase()===cleanTyped.toLowerCase() || (x.name||'').toLowerCase()===typed.toLowerCase());
      if(found){
        if(found.title && !document.getElementById('cTitle').value) document.getElementById('cTitle').value = found.title;
        if(found.phone && !document.getElementById('cPhone').value){
          document.getElementById('cPhone').value = found.phone;
          if(found.email && !document.getElementById('cEmail').value) document.getElementById('cEmail').value = found.email;
        }
      }
    }
  };
  document.getElementById('cPhone').onchange = (e)=>{
    const typed = e.target.value.trim();
    if(typed && typed !== '0000000000'){
      const found = state.customers.find(x=>x.phone===typed);
      if(found && found.name && !document.getElementById('cName').value){
        if(found.title && !document.getElementById('cTitle').value) document.getElementById('cTitle').value = found.title;
        document.getElementById('cName').value = found.name;
      }
    }
  };
  document.getElementById('walkInBtn').onclick = ()=>{
    document.getElementById('cTitle').value = '';
    document.getElementById('cName').value = 'عميل زائر';
    document.getElementById('cPhone').value = '0000000000';
    document.getElementById('cEmail').value = '';
  };
  currentStepCollector = ()=>{
    const rawName = document.getElementById('cName').value.trim();
    const parsed = parseCustomerTitleAndName(rawName);
    d.customer.title = document.getElementById('cTitle').value.trim() || parsed.title || '';
    d.customer.name = (parsed.title && !document.getElementById('cTitle').value.trim()) ? parsed.name : (parsed.name || rawName);
    d.customer.phone = document.getElementById('cPhone').value.trim();
    d.customer.email = document.getElementById('cEmail').value.trim();
  };
  stepNav(body, false, ()=>{
    currentStepCollector();
    if(!d.customer.name || !d.customer.phone){ showToast('من فضلك أدخل اسم العميل ورقم الهاتف', 'error'); return; }
    state.formStep=1;
    triggerDraftAutosave(true);
    renderMain();
  });
}

function stepDevice(body,d){
  // Ensure d.devices array exists and is well-formed
  if(!Array.isArray(d.devices) || d.devices.length === 0){
    d.devices = [{
      id: 'dev_' + Date.now() + '_1',
      category: (d.device && d.device.category) || 'لابتوب',
      brand: (d.device && d.device.brand) || 'Dell',
      brandOther: (d.device && d.device.brandOther) || '',
      model: (d.device && d.device.model) || '',
      accessories: (d.device && d.device.accessories) || '',
      password: (d.device && d.device.password) || d.password || '',
      faults: Array.isArray(d.faults) ? [...d.faults] : [],
      faultNotes: d.faultNotes || '',
      technician: d.technician || ''
    }];
  }
  if(d.activeDeviceIndex == null || d.activeDeviceIndex < 0 || d.activeDeviceIndex >= d.devices.length){
    d.activeDeviceIndex = 0;
  }

  const activeIdx = d.activeDeviceIndex;
  const currDev = d.devices[activeIdx];

  const brandsObj = getBrands();
  const cats = Object.keys(brandsObj);

  // Detect prior devices for this customer in maintenance history
  const custName = (d.customer && d.customer.name || '').trim().toLowerCase();
  const custPhone = (d.customer && d.customer.phone || '').trim();
  const priorReceipts = (state.receipts || []).filter(r => {
    if(!r || !r.device) return false;
    const rPhone = (r.customer && r.customer.phone || '').trim();
    const rName = (r.customer && r.customer.name || '').trim().toLowerCase();
    const matchPhone = custPhone && rPhone && custPhone === rPhone;
    const matchName = custName && rName && custName === rName;
    return matchPhone || matchName;
  });

  const seenDevices = new Set();
  const priorDevices = [];
  priorReceipts.forEach(pr => {
    const brandStr = pr.device.brand === 'أخرى' ? pr.device.brandOther : pr.device.brand;
    const key = `${pr.device.category || ''}|${brandStr || ''}|${pr.device.model || ''}`.trim().toLowerCase();
    if(key && !seenDevices.has(key)){
      seenDevices.add(key);
      priorDevices.push(pr);
    }
  });

  body.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <h3 style="margin:0;display:flex;align-items:center;gap:6px;">${getSvgIcon("laptop", 18)} بيانات الأجهزة المستلمة</h3>
        <button type="button" class="btn btn-primary btn-sm" id="addNewDeviceBtn" style="font-weight:700;display:inline-flex;align-items:center;gap:4px;">
          <span>${getSvgIcon("plus", 14)}</span> إضافة جهاز آخر لنفس العميل
        </button>
      </div>

      <!-- Multiple Devices Tabs Bar -->
      <div style="background:var(--paper2);border:1px solid var(--line);border-radius:var(--radius-sm);padding:8px 10px;margin-bottom:14px;">
        <div style="font-size:11.5px;font-weight:800;color:var(--ink-secondary);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
          <span>أجهزة هذا الإيصال (${d.devices.length}):</span>
          ${d.devices.length > 1 ? '<span style="color:var(--primary);font-size:11px;">(اضغط على الجهاز لتعديل بياناته)</span>' : ''}
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;" id="deviceTabsBar">
          ${d.devices.map((dv, idx) => {
            const isAct = idx === activeIdx;
            const bStr = dv.brand === 'أخرى' ? dv.brandOther : dv.brand;
            const title = `${dv.category || 'جهاز'} ${bStr || ''} ${dv.model || ''}`.trim() || `جهاز #${idx+1}`;
            return `
              <div class="device-tab-chip" data-idx="${idx}" style="display:inline-flex;align-items:center;gap:6px;background:${isAct ? 'var(--primary)' : 'var(--paper)'};color:${isAct ? '#fff' : 'var(--ink)'};border:1px solid ${isAct ? 'var(--primary)' : 'var(--line)'};border-radius:6px;padding:3px 10px;font-size:12px;font-weight:${isAct?'800':'600'};cursor:pointer;">
                <span>${escapeHtml(title)}</span>
                ${d.devices.length > 1 ? `
                  <span class="delete-dev-chip" data-delidx="${idx}" style="color:${isAct ? '#fca5a5' : 'var(--red)'};font-weight:900;font-size:13px;cursor:pointer;padding:0 2px;" title="حذف هذا الجهاز">&times;</span>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      ${priorDevices.length > 0 ? `
        <div style="background:rgba(245,158,11,0.08);border:1px dashed var(--amber);border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span style="display:inline-flex;">${getSvgIcon('refresh', 16)}</span>
            <b style="color:var(--amber-text);font-size:12.5px;">أجهزة سابقة لهذا العميل في السجل:</b>
          </div>
          <div style="font-size:11px;color:var(--ink-secondary);margin-bottom:8px;">
            إذا كان هذا الجهاز قد تم إدخاله للصيانة من قبل، يمكنك اختياره لربط السجل التراكمي وتعبئة البيانات بضغطة واحدة:
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;" id="priorDevicesList">
            ${priorDevices.map(pd => `
              <button type="button" class="btn btn-xs btn-amber pick-prior-device-btn" data-recid="${pd.id}" style="font-weight:700;">
                ${escapeHtml(pd.device.category)} - ${escapeHtml(pd.device.brand==='أخرى'?pd.device.brandOther:pd.device.brand)} ${escapeHtml(pd.device.model||'')} (إيصال #${escapeHtml(pd.receiptNumber)})
              </button>
            `).join('')}
          </div>
          <div id="priorDeviceLinkedBadge" style="display:${d.previousReceiptNumber?'flex':'none'};align-items:center;justify-content:space-between;gap:6px;margin-top:8px;padding:6px 10px;background:var(--green-bg);color:var(--green-text);border-radius:4px;font-size:12px;">
            <span>تم ربط الجهاز بسجل الصيانة التراكمي للإيصال السابق <b class="mono">#${escapeHtml(d.previousReceiptNumber||'')}</b></span>
            <button type="button" class="btn btn-ghost btn-xs" id="clearPriorLinkBtn" style="color:var(--red);padding:2px 6px;">إلغاء الربط</button>
          </div>
        </div>
      ` : ''}

      <div class="field"><label>فئة الجهاز</label>
        <select id="devCat">${cats.map(c=>`<option ${c===currDev.category?'selected':''}>${c}</option>`).join('')}</select>
      </div>
      <div class="grid3">
        <div class="field"><label>الماركة</label><select id="devBrand"></select></div>
        <div class="field" id="brandOtherWrap" style="display:none"><label>اكتب الماركة يدويًا</label><input id="devBrandOther" value="${escapeHtml(currDev.brandOther||'')}"></div>
        <div class="field"><label>الموديل / السيريال</label><input id="devModel" value="${escapeHtml(currDev.model||'')}" placeholder="مثال: Dell G15 5515 أو سيريال الجهاز"></div>
      </div>
      <div id="serialWarrantyAlertBox" style="display:none;margin-top:4px;margin-bottom:10px;padding:8px 12px;border:1.5px solid var(--line);border-radius:4px;font-size:12px;"></div>
      <div class="grid2">
        <div class="field"><label>الملحقات المستلمة مع هذا الجهاز</label><input id="devAcc" placeholder="شاحن أصلي، كابل باور، حقيبة، ماوس..." value="${escapeHtml(currDev.accessories||'')}"></div>
        <div class="field"><label>كلمة المرور / الباسورد (اختياري)</label><input id="devPassword" type="text" placeholder="باسورد الجهاز أو رمز القفل للفحص إن وجد..." value="${escapeHtml(currDev.password||'')}"></div>
      </div>

      <!-- Device Intake Photos & Visual Condition Inspection -->
      <div style="margin-top:14px;background:var(--paper2);border:1.5px solid var(--line);border-radius:var(--radius-sm);padding:12px 14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px;">
          <div>
            <div style="font-weight:800;font-size:13px;color:var(--ink);display:flex;align-items:center;gap:6px;">
              <span>${getSvgIcon("camera", 16)}</span>
              <span>توثيق صور حالة الجهاز عند الاستلام (Intake Photos)</span>
              <span class="badge" id="intakePhotosCountBadge" style="background:var(--primary-bg);color:var(--primary);font-size:11px;font-weight:800;">
                ${(currDev.photos || []).length} صور
              </span>
            </div>
            <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">
              وثق حالة الشاشة، الخدوش السابقة، والكسور لحماية المركز والعميل قبل الفتح والإصلاح.
            </div>
          </div>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
            <input type="file" id="intakeCameraInput" accept="image/*" capture="environment" style="display:none;">
            <input type="file" id="intakeGalleryInput" accept="image/*" multiple style="display:none;">
            <button type="button" class="btn btn-primary btn-xs" id="triggerIntakeCameraBtn" style="font-weight:700;">
              ${getSvgIcon("camera", 14)} فتح الكاميرا
            </button>
            <button type="button" class="btn btn-ghost btn-xs" id="triggerIntakeGalleryBtn" style="border:1px solid var(--line);background:var(--surface);">
              ${getSvgIcon("folder", 14)} اختيار من الملفات
            </button>
          </div>
        </div>

        <!-- Angle Tags selector for next upload -->
        <div style="display:flex;gap:6px;align-items:center;margin-bottom:10px;flex-wrap:wrap;">
          <span style="font-size:11px;font-weight:700;color:var(--ink-secondary);">زاوية التصوير:</span>
          ${['الشاشة والواجهة', 'ظهر وسيريال الجهاز', 'خدوش وكسور سابقة', 'الشاحن والملحقات', 'عام'].map((ang, aIdx) => `
            <button type="button" class="btn btn-xs ${aIdx===0?'btn-blue':'btn-ghost'} photo-angle-preset-btn" data-angle="${ang}" style="font-size:11px;padding:2px 8px;">
              ${ang}
            </button>
          `).join('')}
        </div>

        <!-- Photos Thumbnails Container -->
        <div id="devicePhotosThumbnailsGrid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(110px, 1fr));gap:8px;margin-top:6px;">
        </div>
      </div>
    </div>
  `;

  function fillBrands(){
    const currentBrandsObj = getBrands();
    const cat = document.getElementById('devCat').value;
    const sel = document.getElementById('devBrand');
    sel.innerHTML = (currentBrandsObj[cat]||['أخرى']).map(b=>`<option ${b===currDev.brand?'selected':''}>${b}</option>`).join('');
    document.getElementById('brandOtherWrap').style.display = sel.value==='أخرى' ? '' : 'none';
  }
  fillBrands();
  document.getElementById('devCat').onchange = fillBrands;
  document.getElementById('devBrand').onchange = ()=>{ document.getElementById('brandOtherWrap').style.display = document.getElementById('devBrand').value==='أخرى'?'':'none'; };

  // Live Serial & Warranty Auto-Detection (U12)
  const devModelInp = document.getElementById('devModel');
  const alertBox = document.getElementById('serialWarrantyAlertBox');
  const checkWarranty = () => {
    if(!devModelInp || !alertBox) return;
    const val = devModelInp.value.trim();
    if(!val || val.length < 3){ alertBox.style.display = 'none'; return; }
    
    const serialMatch = typeof findSerialInfo === 'function' ? findSerialInfo(val) : null;
    if(serialMatch){
      const isUnder = typeof isSerialUnderWarranty === 'function' ? isSerialUnderWarranty(serialMatch) : false;
      alertBox.style.display = 'flex';
      if(isUnder){
        alertBox.style.background = '#ecfdf5';
        alertBox.style.borderColor = '#10b981';
        alertBox.style.color = '#065f46';
        alertBox.innerHTML = `
          <div style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:10px;flex-wrap:wrap;">
            <div>
              <b>🛡️ هذا الجهاز تحت الضمان الساري من مبيعات المركز!</b>
              <div style="font-size:11.5px;margin-top:2px;">
                السيريال: <span class="mono font-bold">${escapeHtml(serialMatch.Serial)}</span> | ينتهي في: <b>${cleanDate(serialMatch.WarrantyEnd)}</b> | الصنف: ${escapeHtml(serialMatch.ItemName||'')}
              </div>
            </div>
            <button type="button" class="btn btn-green btn-xs" id="applyWarrantyIntakeBtn" style="white-space:nowrap;font-weight:700;">
              تطبيق استلام تحت الضمان مجاناً
            </button>
          </div>
        `;
        const applyBtn = alertBox.querySelector('#applyWarrantyIntakeBtn');
        if(applyBtn){
          applyBtn.onclick = () => {
            d.cost = 0;
            d.deposit = 0;
            d.inspectionFee = 0;
            d.reIntakeReason = 'صيانة تحت ضمان مبيعات المركز';
            d.warrantyNotes = `جهاز تحت الضمان من مبيعات المركز (سيريال: ${serialMatch.Serial})`;
            showToast('تم تعيين الإيصال تحت الضمان وتصفير رسوم الفحص', 'success');
          };
        }
      } else {
        alertBox.style.background = '#fef2f2';
        alertBox.style.borderColor = '#ef4444';
        alertBox.style.color = '#991b1b';
        alertBox.innerHTML = `
          <div>
            <b>⚠️ انتهت فترة الضمان لهذا الجهاز</b>
            <div style="font-size:11.5px;margin-top:2px;">
              السيريال: <span class="mono font-bold">${escapeHtml(serialMatch.Serial)}</span> انتهى في: ${cleanDate(serialMatch.WarrantyEnd)}
            </div>
          </div>
        `;
      }
    } else {
      alertBox.style.display = 'none';
    }
  };
  if(devModelInp){
    devModelInp.oninput = checkWarranty;
    checkWarranty();
  }
  let selectedAngle = 'الشاشة والواجهة';
  body.querySelectorAll('.photo-angle-preset-btn').forEach(btn => {
    btn.onclick = () => {
      body.querySelectorAll('.photo-angle-preset-btn').forEach(b => {
        b.className = 'btn btn-xs btn-ghost photo-angle-preset-btn';
      });
      btn.className = 'btn btn-xs btn-blue photo-angle-preset-btn';
      selectedAngle = btn.dataset.angle;
    };
  });

  const photosGrid = document.getElementById('devicePhotosThumbnailsGrid');
  const updatePhotosGrid = () => {
    if(!Array.isArray(currDev.photos)) currDev.photos = [];
    const countBadge = document.getElementById('intakePhotosCountBadge');
    if(countBadge) countBadge.innerText = `${currDev.photos.length} صور`;
    renderDevicePhotosThumbnails(currDev.photos, photosGrid, {
      canDelete: true,
      onChanged: (updatedList) => {
        currDev.photos = updatedList;
        d.photos = (d.devices || []).flatMap(x => x.photos || []);
        if(countBadge) countBadge.innerText = `${currDev.photos.length} صور`;
        triggerDraftAutosave(true);
      }
    });
  };
  updatePhotosGrid();

  const handleFilesSelected = async (files) => {
    if(!files || !files.length) return;
    if(!Array.isArray(currDev.photos)) currDev.photos = [];
    if(currDev.photos.length >= 6){
      showToast('⚠️ الحد الأقصى للصور هو 6 صور للجهاز الواحد', 'warning');
      return;
    }
    const countBadge = document.getElementById('intakePhotosCountBadge');
    if(countBadge) countBadge.innerText = 'جارٍ معالجة وضغط ورفع الصور...';
    try {
      let added = 0;
      for(let i=0; i<files.length; i++){
        if(currDev.photos.length >= 6){
          showToast('تم الوصول للحد الأقصى (6 صور) وتجاوز الصور الإضافية', 'info');
          break;
        }
        const file = files[i];
        if(!file.type.startsWith('image/')) continue;
        const compressedUrl = await compressImageFile(file, 900, 900, 0.72);
        const photoId = 'p_' + Date.now() + '_' + Math.floor(Math.random()*1000);

        // Save to durable local IndexedDB
        savePhotoToIndexedDB(photoId, compressedUrl);

        let finalUrl = compressedUrl;
        let driveInfo = null;
        if(navigator.onLine){
          driveInfo = await uploadPhotoToServer(compressedUrl, d.receiptNumber || 'intake', file.name || 'photo.jpg');
          if(driveInfo && driveInfo.url){
            finalUrl = driveInfo.url;
          }
        }

        currDev.photos.push({
          id: photoId,
          url: finalUrl,
          thumb: compressedUrl,
          fileId: driveInfo ? driveInfo.fileId : null,
          angle: selectedAngle,
          stage: 'intake',
          timestamp: new Date().toISOString()
        });
        added++;
      }
      d.photos = (d.devices || []).flatMap(x => x.photos || []);
      if(added > 0){
        showToast(`تمت إضافة ${added} صور موثقة للجهاز بنجاح`, 'success');
        triggerDraftAutosave(true);
      }
      updatePhotosGrid();
    } catch(err){
      showToast('خطأ أثناء معالجة الصور: ' + err.message, 'error');
      updatePhotosGrid();
    }
  };

  const camInp = document.getElementById('intakeCameraInput');
  const galInp = document.getElementById('intakeGalleryInput');
  const camBtn = document.getElementById('triggerIntakeCameraBtn');
  const galBtn = document.getElementById('triggerIntakeGalleryBtn');

  if(camBtn && camInp){
    camBtn.onclick = () => camInp.click();
    camInp.onchange = (e) => handleFilesSelected(e.target.files);
  }
  if(galBtn && galInp){
    galBtn.onclick = () => galInp.click();
    galInp.onchange = (e) => handleFilesSelected(e.target.files);
  }

  function collectActiveDeviceFromDom(){
    currDev.category = document.getElementById('devCat').value;
    currDev.brand = document.getElementById('devBrand').value;
    currDev.brandOther = document.getElementById('devBrandOther') ? document.getElementById('devBrandOther').value : '';
    currDev.model = document.getElementById('devModel').value.trim();
    currDev.accessories = document.getElementById('devAcc').value.trim();
    currDev.password = document.getElementById('devPassword') ? document.getElementById('devPassword').value.trim() : '';
    currDev.photos = currDev.photos || [];

    // Keep top-level d.device in sync with d.devices[0] for full backward compatibility
    d.device = {
      category: d.devices[0].category,
      brand: d.devices[0].brand,
      brandOther: d.devices[0].brandOther,
      model: d.devices[0].model,
      accessories: d.devices[0].accessories,
      password: d.devices[0].password
    };
    d.password = d.device.password;
    d.photos = (d.devices || []).flatMap(x => x.photos || []);
  }

  // Device tabs navigation
  body.querySelectorAll('.device-tab-chip').forEach(el => {
    el.onclick = (e)=>{
      if(e.target.closest('.delete-dev-chip')) return;
      collectActiveDeviceFromDom();
      d.activeDeviceIndex = Number(el.dataset.idx);
      triggerDraftAutosave(true);
      stepDevice(body, d);
    };
  });

  // Add new device button
  const addDevBtn = document.getElementById('addNewDeviceBtn');
  if(addDevBtn){
    addDevBtn.onclick = ()=>{
      collectActiveDeviceFromDom();
      const newDev = {
        id: 'dev_' + Date.now() + '_' + (d.devices.length + 1),
        category: 'لابتوب',
        brand: 'Dell',
        brandOther: '',
        model: '',
        accessories: '',
        password: '',
        faults: [],
        faultNotes: '',
        technician: d.technician || ''
      };
      d.devices.push(newDev);
      d.activeDeviceIndex = d.devices.length - 1;
      showToast(`تمت إضافة جهاز جديد (${d.devices.length}) - أدخل بياناته الآن`, 'success');
      triggerDraftAutosave(true);
      stepDevice(body, d);
    };
  }

  // Delete device chip
  body.querySelectorAll('.delete-dev-chip').forEach(btn => {
    btn.onclick = async (e)=>{
      e.stopPropagation();
      const delIdx = Number(btn.dataset.delidx);
      if(d.devices.length <= 1) return;
      const targetDev = d.devices[delIdx];
      const targetName = `${targetDev.category || 'جهاز'} ${targetDev.brand || ''} ${targetDev.model || ''}`.trim() || `جهاز #${delIdx+1}`;
      const ok = await openConfirmModal({
        title: 'حذف جهاز من الإيصال',
        message: `هل أنت متأكد من حذف ${targetName} من هذا الإيصال؟`,
        confirmText: 'حذف',
        confirmClass: 'btn-danger',
        icon: 'trash'
      });
      if(!ok) return;
      collectActiveDeviceFromDom();
      d.devices.splice(delIdx, 1);
      if(d.activeDeviceIndex >= d.devices.length){
        d.activeDeviceIndex = d.devices.length - 1;
      }
      showToast('تم حذف الجهاز من الإيصال', 'info');
      triggerDraftAutosave(true);
      stepDevice(body, d);
    };
  });

  body.querySelectorAll('.pick-prior-device-btn').forEach(btn => {
    btn.onclick = ()=>{
      const picked = priorReceipts.find(p => p.id === btn.dataset.recid);
      if(!picked) return;
      d.previousReceiptId = picked.id;
      d.previousReceiptNumber = picked.receiptNumber;
      d.rootReceiptId = picked.rootReceiptId || picked.id;
      d.serviceCycle = (Number(picked.serviceCycle) || 1) + 1;
      d.reIntakeReason = 'صيانة تكرارية لنفس الجهاز';

      const catSel = document.getElementById('devCat');
      if(catSel && picked.device.category){
        catSel.value = picked.device.category;
        fillBrands();
      }
      const brandSel = document.getElementById('devBrand');
      if(brandSel && picked.device.brand){
        brandSel.value = picked.device.brand;
        if(brandSel.value === 'أخرى'){
          document.getElementById('brandOtherWrap').style.display = '';
          document.getElementById('devBrandOther').value = picked.device.brandOther || '';
        } else {
          document.getElementById('brandOtherWrap').style.display = 'none';
        }
      }
      const modelInp = document.getElementById('devModel');
      if(modelInp) modelInp.value = picked.device.model || '';
      const accInp = document.getElementById('devAcc');
      if(accInp && !accInp.value) accInp.value = picked.device.accessories || '';
      const passInp = document.getElementById('devPassword');
      if(passInp && !passInp.value) passInp.value = (picked.device && picked.device.password) || picked.password || '';

      const badge = document.getElementById('priorDeviceLinkedBadge');
      if(badge){
        badge.style.display = 'flex';
        badge.querySelector('b').textContent = '#' + picked.receiptNumber;
      }
      showToast(`تم استيراد بيانات الجهاز وربطه بالإيصال السابق #${picked.receiptNumber} بنجاح`, 'success');
      triggerDraftAutosave(true);
    };
  });

  const clearLinkBtn = document.getElementById('clearPriorLinkBtn');
  if(clearLinkBtn){
    clearLinkBtn.onclick = ()=>{
      d.previousReceiptId = '';
      d.previousReceiptNumber = '';
      d.rootReceiptId = '';
      d.serviceCycle = 1;
      d.reIntakeReason = '';
      const badge = document.getElementById('priorDeviceLinkedBadge');
      if(badge) badge.style.display = 'none';
      showToast('تم إلغاء ربط الإيصال السابق', 'info');
      triggerDraftAutosave(true);
    };
  }

  currentStepCollector = ()=>{
    collectActiveDeviceFromDom();
  };

  stepNav(body, true, ()=>{
    currentStepCollector();
    state.formStep = 2;
    triggerDraftAutosave(true);
    renderMain();
  });
}

function stepFaults(body,d){
  if(!Array.isArray(d.devices) || d.devices.length === 0){
    d.devices = [{
      id: 'dev_1',
      category: d.device.category || 'لابتوب',
      brand: d.device.brand || 'Dell',
      brandOther: d.device.brandOther || '',
      model: d.device.model || '',
      faults: Array.isArray(d.faults) ? [...d.faults] : [],
      faultNotes: d.faultNotes || '',
      technician: d.technician || ''
    }];
  }
  if(d.activeDeviceIndex == null || d.activeDeviceIndex < 0 || d.activeDeviceIndex >= d.devices.length){
    d.activeDeviceIndex = 0;
  }

  const activeIdx = d.activeDeviceIndex;
  const currDev = d.devices[activeIdx];
  if(!Array.isArray(currDev.faults)) currDev.faults = [];

  const faultsList = getCommonFaults();
  const bStr = currDev.brand === 'أخرى' ? currDev.brandOther : currDev.brand;
  const devTitle = `${currDev.category || 'جهاز'} ${bStr || ''} ${currDev.model || ''}`.trim() || `جهاز #${activeIdx+1}`;

  body.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <h3 style="margin:0;display:flex;align-items:center;gap:6px;">${getSvgIcon("tool", 18)} الأعطال والتشخيص الفني</h3>
        ${d.devices.length > 1 ? `
          <span class="badge" style="background:#e0e7ff;color:#3730a3;font-size:12px;font-weight:800;padding:4px 10px;border-radius:6px;">
            جهاز ${activeIdx + 1} من ${d.devices.length}: ${escapeHtml(devTitle)}
          </span>
        ` : ''}
      </div>

      ${d.devices.length > 1 ? `
        <!-- Device Switcher for Independent Faults & Notes -->
        <div style="background:var(--paper2);border:1px solid var(--line);border-radius:var(--radius-sm);padding:8px 10px;margin-bottom:16px;">
          <div style="font-size:11.5px;font-weight:800;color:var(--ink-secondary);margin-bottom:6px;">
            اضغط على الجهاز لتحديد أعطاله وملاحظاته الخاصة:
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${d.devices.map((dv, idx) => {
              const isAct = idx === activeIdx;
              const b = dv.brand === 'أخرى' ? dv.brandOther : dv.brand;
              const t = `${dv.category || 'جهاز'} ${b || ''} ${dv.model || ''}`.trim() || `جهاز #${idx+1}`;
              const count = (dv.faults && dv.faults.length) || 0;
              return `
                <button type="button" class="btn btn-sm ${isAct ? 'btn-primary' : 'btn-ghost'} faults-dev-tab" data-fidx="${idx}" style="font-size:12px;display:inline-flex;align-items:center;gap:6px;">
                  <span>${escapeHtml(t)}</span>
                  ${count > 0 ? `<span class="badge" style="background:${isAct ? '#fff' : 'var(--primary)'};color:${isAct ? 'var(--primary)' : '#fff'};font-size:10px;padding:0 5px;border-radius:10px;">${count} أعطال</span>` : '<span style="font-size:10.5px;opacity:0.7;">(لم تحدد أعطال)</span>'}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.25);border-radius:6px;padding:8px 12px;margin-bottom:14px;font-size:12.5px;display:flex;align-items:center;gap:6px;">
        <span>${getSvgIcon("tool", 14)}</span>
        <span>تحديد أعطال وملاحظات: <b style="color:var(--ink);">${escapeHtml(devTitle)}</b></span>
      </div>

      <label style="font-weight:700;margin-bottom:6px;display:block;">الأعطال الشائعة لهذا الجهاز (اضغط لتحديد أو إلغاء العطل):</label>
      <div class="chip-group" id="faultChips" style="margin-bottom:16px;">
        ${faultsList.map(f=>`<div class="chip ${currDev.faults.includes(f)?'sel':''}" data-f="${f}">${f}</div>`).join('')}
      </div>

      <div class="field">
        <label>تفاصيل العطل وملاحظات الفحص الخاصة بهذا الجهاز</label>
        <textarea id="faultNotes" placeholder="اكتب شكوى العميل بالتفصيل أو أي ملاحظات ظاهرية خاصة بهذا الجهاز...">${escapeHtml(currDev.faultNotes||'')}</textarea>
      </div>

      <div class="field">
        <label>الفني المسؤول عن الصيانة</label>
        <select id="techSelect">
          <option value="">-- اختر فني متخصص --</option>
          ${state.technicians.map(t=>`<option ${t===(currDev.technician||d.technician)?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>
    </div>
  `;

  function collectActiveFaultsFromDom(){
    currDev.faultNotes = document.getElementById('faultNotes').value.trim();
    const tech = document.getElementById('techSelect').value;
    currDev.technician = tech;
    d.technician = tech;

    // Sync legacy/global fields with devices[0]
    d.faults = [...(d.devices[0].faults || [])];
    d.faultNotes = d.devices[0].faultNotes || '';

    // If multiple devices, make summary available in d.faults for backward display
    if(d.devices.length > 1){
      const allUniqueFaults = Array.from(new Set(d.devices.flatMap(x => x.faults || [])));
      d.faults = allUniqueFaults;
    }
  }

  // Toggle fault chips on active device
  document.querySelectorAll('#faultChips .chip').forEach(c=>{
    c.onclick = ()=>{
      const f = c.dataset.f;
      const idx = currDev.faults.indexOf(f);
      if(idx > -1) currDev.faults.splice(idx, 1);
      else currDev.faults.push(f);
      c.classList.toggle('sel');
      triggerDraftAutosave(false);
    };
  });

  // Switch device in faults step
  body.querySelectorAll('.faults-dev-tab').forEach(btn => {
    btn.onclick = ()=>{
      collectActiveFaultsFromDom();
      d.activeDeviceIndex = Number(btn.dataset.fidx);
      triggerDraftAutosave(true);
      stepFaults(body, d);
    };
  });

  currentStepCollector = ()=>{
    collectActiveFaultsFromDom();
  };

  stepNav(body, true, ()=>{
    currentStepCollector();
    state.formStep = 3;
    triggerDraftAutosave(true);
    renderMain();
  });
}

function stepFinance(body,d){
  if(!Array.isArray(d.serviceItems)) d.serviceItems = [];

  body.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3 style="margin:0;display:flex;align-items:center;gap:6px;">${getSvgIcon("tool", 18)} بنود الصيانة المستحقة على الجهاز</h3>
        <button type="button" class="btn btn-primary btn-xs" id="draftAddServiceItemBtn">${getSvgIcon("plus", 13)} إضافة بند صيانة</button>
      </div>
      <div id="draftServiceItemsList" style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px;"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px dashed var(--line);font-size:12.5px;">
        <span style="color:var(--ink-secondary);">إجمالي بنود الصيانة:</span>
        <span class="mono" style="font-weight:900;color:var(--primary);font-size:14px;"><span id="draftServiceItemsTotal">0</span> ج.م</span>
      </div>
    </div>

    <div class="card" style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.3);">
      <h3 style="color:var(--amber-text);margin-bottom:10px;display:flex;align-items:center;gap:6px;">${getSvgIcon("creditCard", 15)} حساب آخر / إضافي على نفس العميل (اختياري)</h3>
      <div class="grid2">
        <div class="field" style="margin-bottom:0;">
          <label>وصف الحساب الإضافي أو السابق</label>
          <input id="finOtherDesc" value="${escapeHtml(d.otherAccountDesc||'')}" placeholder="مثال: مديونية صيانة سابقة، شاحن لابتوب إضافي...">
        </div>
        <div class="field" style="margin-bottom:0;">
          <label>المبلغ الإضافي المستحق (ج.م)</label>
          <input id="finOtherAmount" type="text" inputmode="decimal" value="${d.otherAccountAmount||0}" placeholder="0" class="mono" style="direction:ltr;text-align:right;">
        </div>
      </div>
    </div>

    <div class="card">
      <h3>${getSvgIcon("wallet", 18)} التكلفة الإجمالية والجانب المالي</h3>
      <div class="grid4" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;">
        <div class="field"><label>تكلفة الصيانة (ج.م)</label><input id="finCost" type="text" inputmode="decimal" value="${d.cost||0}" placeholder="0" class="mono" style="direction:ltr;text-align:right;"></div>
        <div class="field"><label>حساب إضافي (ج.م)</label><input id="finOtherDisplay" type="text" value="${d.otherAccountAmount||0}" disabled style="background:var(--paper3);direction:ltr;text-align:right;" class="mono"></div>
        <div class="field"><label>قطع الغيار (ج.م)</label><input id="finParts" type="text" value="${d.partsCost||0}" disabled style="background:var(--paper3);direction:ltr;text-align:right;" class="mono"></div>
        <div class="field"><label>الدفعة المقدمة (ج.م)</label><input id="finDep" type="text" inputmode="decimal" value="${d.deposit||0}" placeholder="0" class="mono" style="direction:ltr;text-align:right;"></div>
      </div>
      <!-- خيارات طريقة دفع العربون / الدفعة المقدمة -->
      <div id="draftDepositPayMethodBox" style="margin-top:10px;padding:10px 12px;background:var(--paper2);border:1.5px solid var(--line);border-radius:var(--radius-sm);display:${Number(d.deposit||0)>0?'block':'none'};">
        <label style="font-size:11.5px;font-weight:800;color:var(--ink);display:block;margin-bottom:6px;">
          ${getSvgIcon("creditCard", 14)} طريقة تحصيل الدفعة المقدمة (العربون):
        </label>
        <div class="pos-pay-grid" id="draftDepositPayGrid">
          ${getActivePaymentMethods().map(pm => `
            <div class="pos-pay-btn ${d.depositPaymentMethod === pm.id || (!d.depositPaymentMethod && pm.id === 'cash') ? 'selected' : ''}" data-draftpaymethod="${pm.id}">
              
              <span>${pm.name}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div style="margin-top:10px;padding:8px 12px;background:var(--paper3);border-radius:var(--radius-sm);display:flex;justify-content:space-between;align-items:center;">
        <span style="font-weight:700;font-size:13px;">المبلغ المتبقي المطلوب تقديريًا:</span>
        <span class="mono" style="font-size:16px;font-weight:900;color:var(--primary);"><span id="finRemPreview">0</span> ج.م</span>
      </div>
    </div>

    <div class="card" style="background:var(--paper3);border-color:var(--line-strong);">
      <h3>${getSvgIcon("package", 18)} استخدام قطع غيار من المخزن (اختياري)</h3>
      <div id="draftPartsUsedList" style="font-size:13px;margin-bottom:12px;color:var(--ink);">${d.partsUsed ? d.partsUsed : '<span style="color:var(--ink-secondary);">لم تُضف قطع غيار بعد.</span>'}</div>
      <div style="display:flex;gap:10px;align-items:flex-end;">
        <div class="field" style="flex:2;margin-bottom:0;"><label>الصنف من المخزن</label>
          <select id="draftInvPickItem">
            <option value="">-- اختر صنف --</option>
            ${state.inventory.filter(it=>(it.Category||'صيانة')==='صيانة').map(it=>`<option value="${it.ID}" ${Number(it.Quantity)<=0?'disabled':''}>${it.Name} (متاح: ${it.Quantity}) - سعر الشراء: ${it.PurchasePrice} ج.م</option>`).join('')}
          </select>
        </div>
        <div class="field" style="flex:1;margin-bottom:0;"><label>الكمية</label><input id="draftInvPickQty" type="number" value="1" min="1"></div>
        <button class="btn btn-green btn-sm" id="draftUsePartBtn" type="button">خصم من المخزن</button>
      </div>
    </div>
    <div class="card">
      <h3>${getSvgIcon("calendar", 18)} موعد التسليم التقديري</h3>
      <div class="chip-group" style="margin-bottom:12px;">
        <div class="chip" data-days="0">اليوم</div>
        <div class="chip" data-days="1">غداً</div>
        <div class="chip" data-days="2">بعد يومين</div>
        <div class="chip" data-days="7">أسبوع</div>
        <div class="chip" data-days="-1">غير محدد</div>
      </div>
      <div class="field"><label>أو حدد تاريخ التسليم</label><input id="finDate" type="date" value="${d.deliveryDate}"></div>
    </div>

    <div class="card">
      <h3>${getSvgIcon("shield", 18)} فترة وضمان الصيانة</h3>
      <div class="grid2">
        <div class="field" style="margin-bottom:0;">
          <label>مدة الضمان المعتمدة</label>
          <select id="draftWarrantyMonthsSelect">
            <option value="0" ${Number(d.warrantyMonths)===0?'selected':''}>بدون ضمان</option>
            <option value="1" ${Number(d.warrantyMonths)===1?'selected':''}>شهر واحد (30 يوماً)</option>
            <option value="3" ${Number(d.warrantyMonths)===3||d.warrantyMonths==null?'selected':''}>3 شهور (الافتراضي)</option>
            <option value="6" ${Number(d.warrantyMonths)===6?'selected':''}>6 شهور</option>
            <option value="12" ${Number(d.warrantyMonths)===12?'selected':''}>سنة كاملة (12 شهراً)</option>
          </select>
        </div>
        <div class="field" style="margin-bottom:0;">
          <label>تاريخ نهاية الضمان التقديري</label>
          <input id="draftWarrantyEndDisplay" type="text" readonly disabled class="mono" style="background:var(--paper3);font-weight:bold;color:var(--primary);" value="${d.warrantyEnd || (typeof computeWarrantyEndDate === 'function' ? computeWarrantyEndDate(d.deliveryDate || d.date, d.warrantyMonths || 3) : '')}">
        </div>
      </div>
    </div>
  `;

  function renderDraftServiceItems(){
    const listEl = document.getElementById('draftServiceItemsList');
    if(!listEl) return;
    if(!d.serviceItems.length){
      listEl.innerHTML = '<div style="font-size:12px;color:var(--ink-secondary);padding:6px 0;">لا توجد بنود صيانة منفصلة مضافة. يمكنك إضافة بنود وتحديد سعر كل بند على حدة، أو كتابة التكلفة الإجمالية مباشرة أدناه.</div>';
    } else {
      listEl.innerHTML = d.serviceItems.map((it, idx) => `
        <div class="draft-s-item-row" style="display:flex;gap:8px;align-items:center;background:var(--paper2);padding:6px 8px;border-radius:4px;border:1px solid var(--line);" data-sidx="${idx}">
          <span class="mono" style="font-size:12px;font-weight:700;color:var(--slate-400);width:20px;">#${idx+1}</span>
          <input type="text" class="draft-s-desc" value="${escapeHtml(it.desc||'')}" placeholder="اسم بند الصيانة (مثال: تغيير شاشة، باور...)" style="flex:2;padding:6px 8px;font-size:12.5px;">
          <div style="display:flex;align-items:center;gap:4px;flex:1;">
            <input type="text" inputmode="decimal" class="draft-s-price mono" value="${it.price||0}" placeholder="0" style="width:100%;padding:6px 8px;font-size:12.5px;direction:ltr;text-align:right;">
            <span style="font-size:11.5px;color:var(--ink-secondary);">ج.م</span>
          </div>
          <button type="button" class="btn btn-ghost btn-xs draft-del-s-item" data-sidx="${idx}" style="color:var(--red);padding:4px 8px;" title="حذف هذا البند">${getSvgIcon('trash', 13)}</button>
        </div>
      `).join('');
    }
    attachDraftItemListeners();
    recalcDraftFinances();
  }

  function attachDraftItemListeners(){
    document.querySelectorAll('#draftServiceItemsList .draft-s-desc').forEach(inp => {
      inp.oninput = (e) => {
        const row = e.target.closest('.draft-s-item-row');
        if(!row) return;
        const idx = Number(row.dataset.sidx);
        if(d.serviceItems[idx]) d.serviceItems[idx].desc = e.target.value;
      };
    });
    document.querySelectorAll('#draftServiceItemsList .draft-s-price').forEach(inp => {
      inp.oninput = (e) => {
        const row = e.target.closest('.draft-s-item-row');
        if(!row) return;
        const idx = Number(row.dataset.sidx);
        const parsedP = parseFloat(toEngDigits(e.target.value)) || 0;
        if(d.serviceItems[idx]) d.serviceItems[idx].price = parsedP;
        recalcDraftFinances();
      };
    });
    document.querySelectorAll('#draftServiceItemsList .draft-del-s-item').forEach(btn => {
      btn.onclick = (e) => {
        const row = btn.closest('.draft-s-item-row');
        const idx = row ? Number(row.dataset.sidx) : Number(btn.dataset.sidx);
        d.serviceItems.splice(idx, 1);
        renderDraftServiceItems();
      };
    });
  }

  function recalcDraftFinances(){
    let sTotal = 0;
    document.querySelectorAll('#draftServiceItemsList .draft-s-item-row').forEach(row => {
      const pInp = row.querySelector('.draft-s-price');
      const p = pInp ? (parseFloat(toEngDigits(pInp.value)) || 0) : 0;
      sTotal += p;
    });
    const sTotalEl = document.getElementById('draftServiceItemsTotal');
    if(sTotalEl) sTotalEl.textContent = sTotal.toLocaleString();
    
    if(d.serviceItems.length > 0 || sTotal > 0){
      const finCostInp = document.getElementById('finCost');
      if(finCostInp) finCostInp.value = sTotal;
    }

    const otherInp = document.getElementById('finOtherAmount');
    const otherAmt = otherInp ? (parseFloat(toEngDigits(otherInp.value)) || 0) : Number(d.otherAccountAmount || 0);
    const otherDisp = document.getElementById('finOtherDisplay');
    if(otherDisp) otherDisp.value = otherAmt;

    const costInp = document.getElementById('finCost');
    const cost = costInp ? (parseFloat(toEngDigits(costInp.value)) || 0) : Number(d.cost || 0);
    const parts = Number(d.partsCost || 0);
    const depInp = document.getElementById('finDep');
    const dep = depInp ? (parseFloat(toEngDigits(depInp.value)) || 0) : Number(d.deposit || 0);
    const totalDue = cost + parts + otherAmt;
    const rem = Math.max(0, totalDue - dep);

    const depBox = document.getElementById('draftDepositPayMethodBox');
    if(depBox) depBox.style.display = dep > 0 ? 'block' : 'none';

    const remEl = document.getElementById('finRemPreview');
    if(remEl) remEl.textContent = rem.toLocaleString();
  }

  const addBtn = document.getElementById('draftAddServiceItemBtn');
  if(addBtn){
    addBtn.onclick = () => {
      d.serviceItems.push({ desc: '', price: 0 });
      renderDraftServiceItems();
      const lastRow = document.querySelector('#draftServiceItemsList .draft-s-item-row:last-child input');
      if(lastRow) lastRow.focus();
    };
  }

  const finCostInp = document.getElementById('finCost');
  if(finCostInp) finCostInp.oninput = recalcDraftFinances;
  const finOtherAmtInp = document.getElementById('finOtherAmount');
  if(finOtherAmtInp) finOtherAmtInp.oninput = recalcDraftFinances;
  const finDepInp = document.getElementById('finDep');
  if(finDepInp) finDepInp.oninput = recalcDraftFinances;

  document.querySelectorAll('#draftDepositPayGrid .pos-pay-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('#draftDepositPayGrid .pos-pay-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      d.depositPaymentMethod = btn.dataset.draftpaymethod;
    };
  });

  renderDraftServiceItems();

  const updateWarrantyEndPreview = () => {
    const wmSel = document.getElementById('draftWarrantyMonthsSelect');
    const fDate = document.getElementById('finDate');
    const disp = document.getElementById('draftWarrantyEndDisplay');
    if(!wmSel || !disp) return;
    const months = Number(wmSel.value);
    const startDate = (fDate && fDate.value) ? fDate.value : (d.deliveryDate || d.date);
    disp.value = (typeof computeWarrantyEndDate === 'function') ? computeWarrantyEndDate(startDate, months) : '';
  };
  const wmSelEl = document.getElementById('draftWarrantyMonthsSelect');
  if(wmSelEl) wmSelEl.onchange = updateWarrantyEndPreview;
  const finDateEl = document.getElementById('finDate');
  if(finDateEl) finDateEl.onchange = updateWarrantyEndPreview;

  document.querySelectorAll('[data-days]').forEach(c=>{
    c.onclick = ()=>{
      const days = Number(c.dataset.days);
      if(days<0){ document.getElementById('finDate').value=''; }
      else { const dt = new Date(); dt.setDate(dt.getDate()+days); document.getElementById('finDate').value = dt.toISOString().slice(0,10); }
      updateWarrantyEndPreview();
    };
  });
  document.getElementById('draftUsePartBtn').onclick = ()=>{
    const itemId = document.getElementById('draftInvPickItem').value;
    const qtyInp = document.getElementById('draftInvPickQty');
    const qty = parseFloat(toEngDigits(qtyInp ? qtyInp.value : '1')) || 0;
    if(!itemId){ showToast('اختر صنف من المخزن أولاً', 'error'); return; }
    if(!qty || qty<=0){ showToast('أدخل كمية صحيحة', 'error'); return; }
    const item = state.inventory.find(x=>x.ID===itemId);
    if(!item || qty > Number(item.Quantity)){ showToast('الكمية المطلوبة غير متوفرة بالمخزن (المتاح: ' + (item ? item.Quantity : 0) + ')', 'error'); return; }

    if(!d.partsList) d.partsList = [];
    d.partsList.push({ itemId, name: item.Name, qty, purchasePrice: Number(item.PurchasePrice || 0) });
    const cost = qty * Number(item.PurchasePrice || 0);
    d.partsCost = Number(d.partsCost||0) + cost;
    d.partsUsed = d.partsList.map(p => `${p.name} × ${p.qty}`).join('، ');
    document.getElementById('finParts').value = d.partsCost;
    document.getElementById('draftPartsUsedList').innerHTML = escapeHtml(d.partsUsed) + ' <span style="font-size:11px;color:var(--primary);font-weight:700;">(سيتم الخصم الفعلي عند اعتماد الإيصال)</span>';
    recalcDraftFinances();
    showToast('تمت إضافة قطعة الغيار لمسودة الإيصال (سيتم الخصم عند الحفظ النهائي)', 'success');
  };
  currentStepCollector = ()=>{
    const collectedItems = [];
    document.querySelectorAll('#draftServiceItemsList .draft-s-item-row').forEach(row => {
      const descInp = row.querySelector('.draft-s-desc');
      const priceInp = row.querySelector('.draft-s-price');
      const desc = descInp ? descInp.value.trim() : '';
      const price = priceInp ? (parseFloat(toEngDigits(priceInp.value)) || 0) : 0;
      if(desc || price > 0){
        collectedItems.push({ desc: desc || 'صيانة', price });
      }
    });
    d.serviceItems = collectedItems;
    const finOtherDescEl = document.getElementById('finOtherDesc');
    d.otherAccountDesc = finOtherDescEl ? finOtherDescEl.value.trim() : '';
    const finOtherAmtEl = document.getElementById('finOtherAmount');
    d.otherAccountAmount = finOtherAmtEl ? (parseFloat(toEngDigits(finOtherAmtEl.value)) || 0) : 0;
    const finCostEl = document.getElementById('finCost');
    d.cost = finCostEl ? (parseFloat(toEngDigits(finCostEl.value)) || 0) : 0;
    const finDepEl = document.getElementById('finDep');
    d.deposit = finDepEl ? (parseFloat(toEngDigits(finDepEl.value)) || 0) : 0;
    const selPayBtn = document.querySelector('#draftDepositPayGrid .pos-pay-btn.selected');
    if(selPayBtn) d.depositPaymentMethod = selPayBtn.dataset.draftpaymethod;
    if(!d.depositPaymentMethod) d.depositPaymentMethod = 'cash';
    const finDateEl = document.getElementById('finDate');
    d.deliveryDate = finDateEl ? finDateEl.value : '';
    const wmSel = document.getElementById('draftWarrantyMonthsSelect');
    d.warrantyMonths = wmSel ? Number(wmSel.value) : (d.warrantyMonths != null ? d.warrantyMonths : 3);
    d.warrantyEnd = (typeof computeWarrantyEndDate === 'function') ? computeWarrantyEndDate(d.deliveryDate || d.date, d.warrantyMonths) : '';
    d.warranty = d.warrantyMonths > 0 ? `${d.warrantyMonths} شهور ضد عيوب الصناعة` : 'بدون ضمان';
  };
  stepNav(body, true, ()=>{
    currentStepCollector();
    const cost = Number(d.cost || 0);
    const parts = Number(d.partsCost || 0);
    const other = Number(d.otherAccountAmount || 0);
    const total = cost + parts + other;
    const dep = Number(d.deposit || 0);

    if(dep < 0){
      showToast('لا يمكن إدخال دفعة مقدمة سالبة', 'error');
      return;
    }
    if(total > 0 && dep > total){
      showToast(`عفواً: مبلغ العربون (${dep.toLocaleString()} ج.م) أكبر من إجمالي تكلفة الجهاز والمستحق (${total.toLocaleString()} ج.م)`, 'error');
      const depInp = document.getElementById('finDep');
      if(depInp) depInp.focus();
      return;
    }

    state.formStep=4;
    triggerDraftAutosave(true);
    renderMain();
  }, 'مراجعة وحفظ');
}

function stepReview(body,d){
  currentStepCollector = null;
  const otherAmt = Number(d.otherAccountAmount || 0);
  const totalCost = Number(d.cost||0) + Number(d.partsCost||0) + otherAmt;
  const remaining = Math.max(0, totalCost - Number(d.deposit||0));
  const isMultiDev = Array.isArray(d.devices) && d.devices.length > 1;

  body.innerHTML = `
    <div class="card">
      <h3>${getSvgIcon("fileText", 18)} مراجعة بيانات الإيصال قبل الحفظ</h3>
      <div class="grid2" style="font-size:13.5px;line-height:2;">
        <div><b>العميل:</b> ${escapeHtml(d.customer.name)} — <span class="mono">${escapeHtml(d.customer.phone)}</span></div>
        <div><b>تاريخ ووقت الاستلام:</b> <span class="mono" style="font-weight:bold;">${cleanDate(d.date)}</span> <span class="badge badge-blue mono" style="font-size:11.5px;margin-right:4px;">${formatReceiptTime(d) || d.time || ''}</span></div>
        ${d.previousReceiptNumber ? `<div><b>صيانة راجعة / تكرارية:</b> <span class="badge badge-amber mono">#${escapeHtml(d.previousReceiptNumber)}</span> <span style="font-size:11.5px;color:var(--ink-secondary);">${d.reIntakeReason ? '('+escapeHtml(d.reIntakeReason)+')' : ''}</span></div>` : ''}
        <div><b>الفني المسؤول:</b> ${escapeHtml(d.technician||'غير محدد')}</div>
        <div><b>تكلفة الخدمة:</b> ${d.cost||0} ج.م</div>
        ${(d.serviceItems && d.serviceItems.length > 0) ? `<div style="grid-column:1/-1;background:var(--paper2);padding:6px 10px;border-radius:4px;border:1px solid var(--line);font-size:12px;line-height:1.5;"><b>تفاصيل بنود الصيانة (${d.serviceItems.length}):</b> ${d.serviceItems.map(it=>`${escapeHtml(it.desc)} (<b class="mono">${it.price}</b> ج.م)`).join(' | ')}</div>` : ''}
        <div><b>تكلفة قطع الغيار:</b> ${d.partsCost||0} ج.م</div>
        ${otherAmt > 0 ? `<div><b>حساب إضافي على العميل:</b> <span class="mono" style="font-weight:800;color:var(--amber-text);">${otherAmt}</span> ج.م (${escapeHtml(d.otherAccountDesc || 'حساب سابق')})</div>` : ''}
        ${Number(d.deposit||0) > 0 ? `
          <div>
            <b>الدفعة المقدمة (العربون):</b>
            <span class="mono font-bold" style="color:var(--green-text);">${Number(d.deposit).toLocaleString()} ج.م</span>
            ${getPaymentMethodBadge((getActivePaymentMethods().find(x=>x.id===d.depositPaymentMethod)||{name:'نقدي (كاش)'}).name)}
          </div>
        ` : `<div><b>الدفعة المقدمة:</b> 0 ج.م</div>`}
        <div><b style="color:var(--primary);">المبلغ المتبقي المطلوب:</b> <span class="mono" style="font-size:17px;font-weight:900;color:var(--primary);">${remaining}</span> ج.م</div>
        <div><b>موعد التسليم:</b> ${escapeHtml(d.deliveryDate||'غير محدد')}</div>
        <div><b>فترة الضمان:</b> <span class="badge" style="background:#ecfdf5;color:#047857;font-weight:700;">${d.warrantyMonths ? d.warrantyMonths + ' شهور (حتى: ' + (d.warrantyEnd || (typeof computeWarrantyEndDate === 'function' ? computeWarrantyEndDate(d.deliveryDate || d.date, d.warrantyMonths) : '')) + ')' : 'بدون ضمان'}</span></div>
      </div>

      ${isMultiDev ? `
        <div style="margin-top:14px;background:var(--paper2);border:1px solid var(--line);border-radius:var(--radius-sm);padding:10px 12px;">
          <div style="font-weight:800;font-size:13.5px;color:var(--primary);margin-bottom:10px;display:flex;align-items:center;gap:6px;">
            <span>الأجهزة المستلمة في هذا الإيصال (${d.devices.length} أجهزة):</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${d.devices.map((dv, i) => {
              const dvCat = escapeHtml(dv.category || 'جهاز');
              const dvBrand = escapeHtml(dv.brand === 'أخرى' ? dv.brandOther : (dv.brand || ''));
              const dvModel = escapeHtml(dv.model || '-');
              const dvAcc = escapeHtml(dv.accessories || 'بدون');
              const dvPass = dv.password ? `<span style="color:var(--amber-text);font-size:12px;margin-right:6px;">(كلمة السر: <span class="mono">${escapeHtml(dv.password)}</span>)</span>` : '';
              const dvFaults = (dv.faults && dv.faults.length) ? dv.faults.join('، ') : 'لم تحدد أعطال';
              const dvNotes = dv.faultNotes ? ` | <b>ملاحظات:</b> ${escapeHtml(dv.faultNotes)}` : '';
              return `
                <div style="background:var(--paper);border:1px solid var(--line);border-radius:6px;padding:8px 12px;font-size:13px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:6px;">
                    <b style="color:var(--ink);">جهاز #${i+1}: ${dvCat} - ${dvBrand} ${dvModel}</b>
                    ${dvPass}
                  </div>
                  <div style="color:var(--ink-secondary);font-size:12px;line-height:1.7;">
                    <div><b>الملحقات:</b> ${dvAcc}</div>
                    <div><b>الأعطال:</b> <span style="color:var(--red);font-weight:700;">${escapeHtml(dvFaults)}</span>${dvNotes}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : `
        <div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--line);font-size:13.5px;line-height:1.8;">
          <div><b>الجهاز:</b> ${escapeHtml(d.device?.category || '')} / ${escapeHtml(d.device?.brand==='أخرى' ? d.device?.brandOther : (d.device?.brand || ''))} / ${escapeHtml(d.device?.model||'-')} ${((d.device && d.device.password) || d.password) ? `<span style="margin-right:6px;color:var(--amber-text);font-size:12px;">(كلمة السر: <span class="mono">${escapeHtml((d.device && d.device.password) || d.password)}</span>)</span>` : ''}</div>
          <div><b>الأعطال:</b> ${escapeHtml((d.faults||[]).join('، ')||'-')}${d.faultNotes ? ' ('+escapeHtml(d.faultNotes)+')' : ''}</div>
          <div><b>الملحقات:</b> ${escapeHtml((d.device && d.device.accessories) || 'بدون')}</div>
        </div>
      `}

      <!-- Attached Intake Photos Review -->
      ${(d.photos && d.photos.length > 0) ? `
        <div style="margin-top:12px;background:var(--paper2);border:1px solid var(--line);border-radius:var(--radius-sm);padding:10px 12px;">
          <div style="font-weight:800;font-size:13px;color:var(--ink);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
            <span>${getSvgIcon("camera", 16)}</span>
            <span>الصور الموثقة لحالة الجهاز عند الاستلام:</span>
            <span class="badge badge-green" style="font-size:11px;">${d.photos.length} صور</span>
          </div>
          <div id="reviewPhotosGrid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(90px, 1fr));gap:6px;">
          </div>
        </div>
      ` : ''}
    </div>
    <div class="actions-row" style="flex-wrap:wrap;">
      <button class="btn btn-ghost" id="backBtn">السابق</button>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" id="saveOnlyBtn">${getSvgIcon("check", 14)} حفظ فقط</button>
        <button class="btn btn-whatsapp btn-sm" id="saveWaBtn">${WA_ICON} واتساب</button>
        <button class="btn btn-amber btn-sm" id="saveStickerBtn">${getSvgIcon("tag", 14)} حفظ وطباعة ملصق</button>
        <button class="btn btn-primary btn-sm" id="savePrintBtn">${getSvgIcon("printer", 14)} حفظ وطباعة A5</button>
      </div>
    </div>
  `;

  const revPhotosGrid = document.getElementById('reviewPhotosGrid');
  if(revPhotosGrid && d.photos && d.photos.length > 0){
    renderDevicePhotosThumbnails(d.photos, revPhotosGrid, { canDelete: false });
  }

  document.getElementById('backBtn').onclick = ()=>{ 
    state.formStep=3; 
    triggerDraftAutosave(true);
    renderMain(); 
  };
  document.getElementById('saveOnlyBtn').onclick = ()=>saveReceipt(d,false,false,false);
  document.getElementById('saveWaBtn').onclick = ()=>saveReceipt(d,false,true,false);
  document.getElementById('saveStickerBtn').onclick = ()=>saveReceipt(d,false,false,true);
  document.getElementById('savePrintBtn').onclick = ()=>saveReceipt(d,true,false,false);
}

async function saveReceipt(d, printA5, sendWa, printSticker){
  const now = new Date();
  if(!d.date) d.date = now.toISOString().slice(0,10);
  if(!d.time){
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    const h12 = hours % 12 || 12;
    d.time = `${h12}:${minutes} ${ampm}`;
  }
  if(!d.createdAt) d.createdAt = now.toISOString();
  if(!d.receivedAt) d.receivedAt = now.toISOString();
  d.updatedBy = state.user.name;
  d.updatedAt = now.toISOString();
  const btns = document.querySelectorAll('#saveOnlyBtn,#savePrintBtn,#saveWaBtn,#saveStickerBtn');
  btns.forEach(b=>{ b.disabled = true; b.textContent = 'جارٍ الحفظ...'; });
  try{
    await saveReceiptRemote(d);
    if(d.previousReceiptId || d.previousReceiptNumber){
      const prev = state.receipts.find(x => (d.previousReceiptId && x.id === d.previousReceiptId) || (d.previousReceiptNumber && x.receiptNumber === d.previousReceiptNumber));
      if(prev){
        prev.nextReceiptId = d.id;
        prev.nextReceiptNumber = d.receiptNumber;
        prev.updatedBy = state.user ? state.user.name : 'نظام';
        prev.updatedAt = new Date().toISOString();
        try{ await saveReceiptRemote(prev); }catch(errPrev){ console.warn(errPrev); }
      }
    }
    if(Number(d.deposit||0) > 0){
      const depMethodObj = getActivePaymentMethods().find(x => x.id === d.depositPaymentMethod) || { name: 'نقدي (كاش)' };
      d.depositPaymentMethodName = depMethodObj.name;
      try{ await savePaymentRemote(d.id, Number(d.deposit), 'دفعة مقدمة عند الاستلام', depMethodObj.name); }
      catch(payErr){ console.warn(payErr); }
      await refreshPayments();
    }
    // Customer saving is now handled inside saveReceiptRemote automatically
    // U13: Clear auto-saved draft only after successful receipt creation
    clearIntakeDraftFromStorage();
    state.draft = null;
    state.tab = 'archive';
    showToast(`تم حفظ الإيصال ${d.receiptNumber} بنجاح!`, 'success');
    renderMain();
    if(printA5){ setTimeout(()=>openReceiptPrint(d,'receipt'), 300); }
    if(printSticker){ setTimeout(()=>openStickerPrint(d), 300); }
    if(sendWa){ setTimeout(()=>openWhatsappChoice(d), 300); }
  }catch(e){
    showToast('تم حفظ الإيصال محلياً: '+e.message, 'info');
    btns.forEach(b=>{ b.disabled = false; });
  }
}
