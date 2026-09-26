/* ---------------- New Receipt Form ---------------- */
function startNewDraft(){
  state.tab = 'new';
  updateSidebarNav();
  state.draft = newDraft();
  state.formStep = 0;
  nextReceiptNumber()
    .then(n=>{ state.draft.receiptNumber = n; renderMain(); })
    .catch(e=>{ state.draft.receiptNumber = 'MT-'+Date.now(); renderMain(); });
}

const STEPS = ['بيانات العميل','بيانات الجهاز','الأعطال والفني','المالي والمخزن','مراجعة وحفظ'];
let currentStepCollector = null;

function renderForm(main){
  if(!state.draft){ startNewDraft(); return; }
  const d = state.draft;
  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">➕ إيصال استلام جهاز جديد</h2>
        <div class="subtitle">رقم الإيصال: <b class="mono" style="color:var(--primary);">${d.receiptNumber}</b> — التاريخ: <b class="mono">${d.date}</b></div>
      </div>
    </div>
    <div class="stepper">
      ${STEPS.map((s,i)=>`<div class="step-dot ${i===state.formStep?'active':(i<state.formStep?'done':'')}" data-i="${i}">
        <span>${i<state.formStep?'✓':(i+1)}</span><span>${s}</span>
      </div>`).join('')}
    </div>
    <div id="stepBody"></div>
  `;
  document.querySelectorAll('.step-dot').forEach(el=>el.onclick=()=>{
    if(typeof currentStepCollector==='function') currentStepCollector();
    state.formStep = Number(el.dataset.i); renderMain();
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
    <button class="btn btn-primary" id="nextBtn">${nextLabel||'التالي ➔'}</button>
  `;
  body.appendChild(div);
  if(canBack) div.querySelector('#backBtn').onclick = ()=>{ if(typeof currentStepCollector==='function') currentStepCollector(); state.formStep--; renderMain(); };
  div.querySelector('#nextBtn').onclick = canNext;
}

function stepCustomer(body,d){
  recoverAndSyncAllCustomerPhones(false);
  const custOptions = state.customers.map(c=>`<option value="${escapeHtml(c.name)}">${c.title ? escapeHtml(c.title)+' / ' : ''}${escapeHtml(c.name)} - ${escapeHtml(c.phone||'بدون هاتف')}</option>`).join('');
  const curTitle = (d.customer && d.customer.title) || '';
  const titleOptions = [''].concat(CUSTOMER_TITLES).map(t=>`<option value="${escapeHtml(t)}" ${curTitle===t?'selected':''}>${t ? escapeHtml(t) : '-- بدون لقب --'}</option>`).join('');

  body.innerHTML = `
    <div class="card">
      <h3>👤 بيانات العميل</h3>
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
    state.formStep=1; renderMain();
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
        <h3 style="margin:0;">💻 بيانات الأجهزة المستلمة</h3>
        <button type="button" class="btn btn-primary btn-sm" id="addNewDeviceBtn" style="font-weight:700;display:inline-flex;align-items:center;gap:4px;">
          <span>➕</span> إضافة جهاز آخر لنفس العميل
        </button>
      </div>

      <!-- Multiple Devices Tabs Bar -->
      <div style="background:var(--paper2);border:1px solid var(--line);border-radius:var(--radius-sm);padding:8px 10px;margin-bottom:14px;">
        <div style="font-size:11.5px;font-weight:800;color:var(--ink-secondary);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
          <span>📱 أجهزة هذا الإيصال (${d.devices.length}):</span>
          ${d.devices.length > 1 ? '<span style="color:var(--primary);font-size:11px;">(اضغط على الجهاز لتعديل بياناته)</span>' : ''}
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;" id="deviceTabsBar">
          ${d.devices.map((dv, idx) => {
            const isAct = idx === activeIdx;
            const bStr = dv.brand === 'أخرى' ? dv.brandOther : dv.brand;
            const title = `${dv.category || 'جهاز'} ${bStr || ''} ${dv.model || ''}`.trim() || `جهاز #${idx+1}`;
            return `
              <div class="device-tab-chip" data-idx="${idx}" style="display:inline-flex;align-items:center;gap:6px;background:${isAct ? 'var(--primary)' : 'var(--paper)'};color:${isAct ? '#fff' : 'var(--ink)'};border:1px solid ${isAct ? 'var(--primary)' : 'var(--line)'};border-radius:6px;padding:3px 10px;font-size:12px;font-weight:${isAct?'800':'600'};cursor:pointer;">
                <span>📱 ${escapeHtml(title)}</span>
                ${d.devices.length > 1 ? `
                  <span class="delete-dev-chip" data-delidx="${idx}" style="color:${isAct ? '#fca5a5' : 'var(--red)'};font-weight:900;font-size:13px;cursor:pointer;padding:0 2px;" title="حذف هذا الجهاز">✕</span>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      ${priorDevices.length > 0 ? `
        <div style="background:rgba(245,158,11,0.08);border:1px dashed var(--amber);border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <span style="font-size:16px;">🔄</span>
            <b style="color:var(--amber-text);font-size:12.5px;">أجهزة سابقة لهذا العميل في السجل:</b>
          </div>
          <div style="font-size:11px;color:var(--ink-secondary);margin-bottom:8px;">
            إذا كان هذا الجهاز قد تم إدخاله للصيانة من قبل، يمكنك اختياره لربط السجل التراكمي وتعبئة البيانات بضغطة واحدة:
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;" id="priorDevicesList">
            ${priorDevices.map(pd => `
              <button type="button" class="btn btn-xs btn-amber pick-prior-device-btn" data-recid="${pd.id}" style="font-weight:700;">
                💻 ${escapeHtml(pd.device.category)} - ${escapeHtml(pd.device.brand==='أخرى'?pd.device.brandOther:pd.device.brand)} ${escapeHtml(pd.device.model||'')} (إيصال #${escapeHtml(pd.receiptNumber)})
              </button>
            `).join('')}
          </div>
          <div id="priorDeviceLinkedBadge" style="display:${d.previousReceiptNumber?'flex':'none'};align-items:center;justify-content:space-between;gap:6px;margin-top:8px;padding:6px 10px;background:var(--green-bg);color:var(--green-text);border-radius:4px;font-size:12px;">
            <span>✅ تم ربط الجهاز بسجل الصيانة التراكمي للإيصال السابق <b class="mono">#${escapeHtml(d.previousReceiptNumber||'')}</b></span>
            <button type="button" class="btn btn-ghost btn-xs" id="clearPriorLinkBtn" style="color:var(--red);padding:2px 6px;">إلغاء الربط ✕</button>
          </div>
        </div>
      ` : ''}

      <div class="field"><label>فئة الجهاز</label>
        <select id="devCat">${cats.map(c=>`<option ${c===currDev.category?'selected':''}>${c}</option>`).join('')}</select>
      </div>
      <div class="grid3">
        <div class="field"><label>الماركة</label><select id="devBrand"></select></div>
        <div class="field" id="brandOtherWrap" style="display:none"><label>اكتب الماركة يدويًا</label><input id="devBrandOther" value="${escapeHtml(currDev.brandOther||'')}"></div>
        <div class="field"><label>الموديل / السيريال</label><input id="devModel" value="${escapeHtml(currDev.model||'')}" placeholder="مثال: Dell G15 5515"></div>
      </div>
      <div class="grid2">
        <div class="field"><label>الملحقات المستلمة مع هذا الجهاز</label><input id="devAcc" placeholder="شاحن أصلي، كابل باور، حقيبة، ماوس..." value="${escapeHtml(currDev.accessories||'')}"></div>
        <div class="field"><label>كلمة المرور / الباسورد (اختياري)</label><input id="devPassword" type="text" placeholder="باسورد الجهاز أو رمز القفل للفحص إن وجد..." value="${escapeHtml(currDev.password||'')}"></div>
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

  function collectActiveDeviceFromDom(){
    currDev.category = document.getElementById('devCat').value;
    currDev.brand = document.getElementById('devBrand').value;
    currDev.brandOther = document.getElementById('devBrandOther') ? document.getElementById('devBrandOther').value : '';
    currDev.model = document.getElementById('devModel').value.trim();
    currDev.accessories = document.getElementById('devAcc').value.trim();
    currDev.password = document.getElementById('devPassword') ? document.getElementById('devPassword').value.trim() : '';

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
  }

  // Device tabs navigation
  body.querySelectorAll('.device-tab-chip').forEach(el => {
    el.onclick = (e)=>{
      if(e.target.closest('.delete-dev-chip')) return;
      collectActiveDeviceFromDom();
      d.activeDeviceIndex = Number(el.dataset.idx);
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
      stepDevice(body, d);
    };
  }

  // Delete device chip
  body.querySelectorAll('.delete-dev-chip').forEach(btn => {
    btn.onclick = (e)=>{
      e.stopPropagation();
      const delIdx = Number(btn.dataset.delidx);
      if(d.devices.length <= 1) return;
      const targetDev = d.devices[delIdx];
      const targetName = `${targetDev.category || 'جهاز'} ${targetDev.brand || ''} ${targetDev.model || ''}`.trim() || `جهاز #${delIdx+1}`;
      if(!confirm(`هل أنت متأكد من حذف ${targetName} من هذا الإيصال؟`)) return;
      collectActiveDeviceFromDom();
      d.devices.splice(delIdx, 1);
      if(d.activeDeviceIndex >= d.devices.length){
        d.activeDeviceIndex = d.devices.length - 1;
      }
      showToast('تم حذف الجهاز من الإيصال', 'info');
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
      showToast(`تم استيراد بيانات الجهاز وربطه بالإيصال السابق #${picked.receiptNumber} بنجاح 🔄`, 'success');
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
    };
  }

  currentStepCollector = ()=>{
    collectActiveDeviceFromDom();
  };

  stepNav(body, true, ()=>{
    currentStepCollector();
    state.formStep = 2;
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
        <h3 style="margin:0;">⚠️ الأعطال والتشخيص الفني</h3>
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
                  <span>📱 ${escapeHtml(t)}</span>
                  ${count > 0 ? `<span class="badge" style="background:${isAct ? '#fff' : 'var(--primary)'};color:${isAct ? 'var(--primary)' : '#fff'};font-size:10px;padding:0 5px;border-radius:10px;">${count} أعطال</span>` : '<span style="font-size:10.5px;opacity:0.7;">(لم تحدد أعطال)</span>'}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.25);border-radius:6px;padding:8px 12px;margin-bottom:14px;font-size:12.5px;display:flex;align-items:center;gap:6px;">
        <span>🎯</span>
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
    };
  });

  // Switch device in faults step
  body.querySelectorAll('.faults-dev-tab').forEach(btn => {
    btn.onclick = ()=>{
      collectActiveFaultsFromDom();
      d.activeDeviceIndex = Number(btn.dataset.fidx);
      stepFaults(body, d);
    };
  });

  currentStepCollector = ()=>{
    collectActiveFaultsFromDom();
  };

  stepNav(body, true, ()=>{
    currentStepCollector();
    state.formStep = 3;
    renderMain();
  });
}

function stepFinance(body,d){
  if(!Array.isArray(d.serviceItems)) d.serviceItems = [];

  body.innerHTML = `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3 style="margin:0;">🛠️ بنود الصيانة المستحقة على الجهاز</h3>
        <button type="button" class="btn btn-primary btn-xs" id="draftAddServiceItemBtn">➕ إضافة بند صيانة</button>
      </div>
      <div id="draftServiceItemsList" style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px;"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px dashed var(--line);font-size:12.5px;">
        <span style="color:var(--ink-secondary);">إجمالي بنود الصيانة:</span>
        <span class="mono" style="font-weight:900;color:var(--primary);font-size:14px;"><span id="draftServiceItemsTotal">0</span> ج.م</span>
      </div>
    </div>

    <div class="card" style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.3);">
      <h3 style="color:var(--amber-text);margin-bottom:10px;">💳 حساب آخر / إضافي على نفس العميل (اختياري)</h3>
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
      <h3>💰 التكلفة الإجمالية والجانب المالي</h3>
      <div class="grid4" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;">
        <div class="field"><label>تكلفة الصيانة (ج.م)</label><input id="finCost" type="text" inputmode="decimal" value="${d.cost||0}" placeholder="0" class="mono" style="direction:ltr;text-align:right;"></div>
        <div class="field"><label>حساب إضافي (ج.م)</label><input id="finOtherDisplay" type="text" value="${d.otherAccountAmount||0}" disabled style="background:var(--paper3);direction:ltr;text-align:right;" class="mono"></div>
        <div class="field"><label>قطع الغيار (ج.م)</label><input id="finParts" type="text" value="${d.partsCost||0}" disabled style="background:var(--paper3);direction:ltr;text-align:right;" class="mono"></div>
        <div class="field"><label>الدفعة المقدمة (ج.م)</label><input id="finDep" type="text" inputmode="decimal" value="${d.deposit||0}" placeholder="0" class="mono" style="direction:ltr;text-align:right;"></div>
      </div>
      <!-- خيارات طريقة دفع العربون / الدفعة المقدمة -->
      <div id="draftDepositPayMethodBox" style="margin-top:10px;padding:10px 12px;background:var(--paper2);border:1.5px solid var(--line);border-radius:var(--radius-sm);display:${Number(d.deposit||0)>0?'block':'none'};">
        <label style="font-size:11.5px;font-weight:800;color:var(--ink);display:block;margin-bottom:6px;">
          💳 طريقة تحصيل الدفعة المقدمة (العربون):
        </label>
        <div class="pos-pay-grid" id="draftDepositPayGrid">
          ${getActivePaymentMethods().map(pm => `
            <div class="pos-pay-btn ${d.depositPaymentMethod === pm.id || (!d.depositPaymentMethod && pm.id === 'cash') ? 'selected' : ''}" data-draftpaymethod="${pm.id}">
              <span>${pm.icon || '💵'}</span>
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
      <h3>📦 استخدام قطع غيار من المخزن (اختياري)</h3>
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
      <h3>📅 موعد التسليم التقديري</h3>
      <div class="chip-group" style="margin-bottom:12px;">
        <div class="chip" data-days="0">اليوم</div>
        <div class="chip" data-days="1">غداً</div>
        <div class="chip" data-days="2">بعد يومين</div>
        <div class="chip" data-days="7">أسبوع</div>
        <div class="chip" data-days="-1">غير محدد</div>
      </div>
      <div class="field"><label>أو حدد تاريخ التسليم</label><input id="finDate" type="date" value="${d.deliveryDate}"></div>
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
          <button type="button" class="btn btn-ghost btn-xs draft-del-s-item" data-sidx="${idx}" style="color:var(--red);padding:4px 8px;" title="حذف هذا البند">🗑️</button>
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

  document.querySelectorAll('[data-days]').forEach(c=>{
    c.onclick = ()=>{
      const days = Number(c.dataset.days);
      if(days<0){ document.getElementById('finDate').value=''; }
      else { const dt = new Date(); dt.setDate(dt.getDate()+days); document.getElementById('finDate').value = dt.toISOString().slice(0,10); }
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
    document.getElementById('draftPartsUsedList').innerHTML = d.partsUsed + ' <span style="font-size:11px;color:var(--primary);font-weight:700;">(سيتم الخصم الفعلي عند اعتماد الإيصال)</span>';
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

    state.formStep=4; renderMain();
  }, 'مراجعة وحفظ ➔');
}

function stepReview(body,d){
  currentStepCollector = null;
  const otherAmt = Number(d.otherAccountAmount || 0);
  const totalCost = Number(d.cost||0) + Number(d.partsCost||0) + otherAmt;
  const remaining = Math.max(0, totalCost - Number(d.deposit||0));
  const isMultiDev = Array.isArray(d.devices) && d.devices.length > 1;

  body.innerHTML = `
    <div class="card">
      <h3>📋 مراجعة بيانات الإيصال قبل الحفظ</h3>
      <div class="grid2" style="font-size:13.5px;line-height:2;">
        <div><b>👤 العميل:</b> ${d.customer.name} — <span class="mono">${d.customer.phone}</span></div>
        <div><b>📅 تاريخ ووقت الاستلام:</b> <span class="mono" style="font-weight:bold;">${cleanDate(d.date)}</span> <span class="badge badge-blue mono" style="font-size:11.5px;margin-right:4px;">⏰ ${formatReceiptTime(d) || d.time || ''}</span></div>
        ${d.previousReceiptNumber ? `<div><b>🔄 صيانة راجعة / تكرارية:</b> <span class="badge badge-amber mono">#${escapeHtml(d.previousReceiptNumber)}</span> <span style="font-size:11.5px;color:var(--ink-secondary);">${d.reIntakeReason ? '('+escapeHtml(d.reIntakeReason)+')' : ''}</span></div>` : ''}
        <div><b>👨‍🔧 الفني المسؤول:</b> ${d.technician||'غير محدد'}</div>
        <div><b>💵 تكلفة الخدمة:</b> ${d.cost||0} ج.م</div>
        ${(d.serviceItems && d.serviceItems.length > 0) ? `<div style="grid-column:1/-1;background:var(--paper2);padding:6px 10px;border-radius:4px;border:1px solid var(--line);font-size:12px;line-height:1.5;"><b>🛠️ تفاصيل بنود الصيانة (${d.serviceItems.length}):</b> ${d.serviceItems.map(it=>`${escapeHtml(it.desc)} (<b class="mono">${it.price}</b> ج.م)`).join(' | ')}</div>` : ''}
        <div><b>⚙️ تكلفة قطع الغيار:</b> ${d.partsCost||0} ج.م</div>
        ${otherAmt > 0 ? `<div><b>💳 حساب إضافي على العميل:</b> <span class="mono" style="font-weight:800;color:var(--amber-text);">${otherAmt}</span> ج.م (${escapeHtml(d.otherAccountDesc || 'حساب سابق')})</div>` : ''}
        ${Number(d.deposit||0) > 0 ? `
          <div>
            <b>📥 الدفعة المقدمة (العربون):</b>
            <span class="mono font-bold" style="color:var(--green-text);">${Number(d.deposit).toLocaleString()} ج.م</span>
            ${getPaymentMethodBadge((getActivePaymentMethods().find(x=>x.id===d.depositPaymentMethod)||{name:'نقدي (كاش)'}).name)}
          </div>
        ` : `<div><b>📥 الدفعة المقدمة:</b> 0 ج.م</div>`}
        <div><b style="color:var(--primary);">المبلغ المتبقي المطلوب:</b> <span class="mono" style="font-size:17px;font-weight:900;color:var(--primary);">${remaining}</span> ج.م</div>
        <div><b>📅 موعد التسليم:</b> ${d.deliveryDate||'غير محدد'}</div>
      </div>

      ${isMultiDev ? `
        <div style="margin-top:14px;background:var(--paper2);border:1px solid var(--line);border-radius:var(--radius-sm);padding:10px 12px;">
          <div style="font-weight:800;font-size:13.5px;color:var(--primary);margin-bottom:10px;display:flex;align-items:center;gap:6px;">
            <span>📱 الأجهزة المستلمة في هذا الإيصال (${d.devices.length} أجهزة):</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${d.devices.map((dv, i) => {
              const dvCat = escapeHtml(dv.category || 'جهاز');
              const dvBrand = escapeHtml(dv.brand === 'أخرى' ? dv.brandOther : (dv.brand || ''));
              const dvModel = escapeHtml(dv.model || '-');
              const dvAcc = escapeHtml(dv.accessories || 'بدون');
              const dvPass = dv.password ? `<span style="color:var(--amber-text);font-size:12px;margin-right:6px;">(🔑 باسورد: <span class="mono">${escapeHtml(dv.password)}</span>)</span>` : '';
              const dvFaults = (dv.faults && dv.faults.length) ? dv.faults.join('، ') : 'لم تحدد أعطال';
              const dvNotes = dv.faultNotes ? ` | <b>ملاحظات:</b> ${escapeHtml(dv.faultNotes)}` : '';
              return `
                <div style="background:var(--paper);border:1px solid var(--line);border-radius:6px;padding:8px 12px;font-size:13px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:6px;">
                    <b style="color:var(--ink);">📱 جهاز #${i+1}: ${dvCat} - ${dvBrand} ${dvModel}</b>
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
          <div><b>💻 الجهاز:</b> ${d.device.category} / ${d.device.brand==='أخرى'?d.device.brandOther:d.device.brand} / ${d.device.model||'-'} ${((d.device && d.device.password) || d.password) ? `<span style="margin-right:6px;color:var(--amber-text);font-size:12px;">(🔑 كلمة السر: <span class="mono">${escapeHtml((d.device && d.device.password) || d.password)}</span>)</span>` : ''}</div>
          <div><b>⚠️ الأعطال:</b> ${d.faults.join('، ')||'-'}${d.faultNotes ? ' ('+escapeHtml(d.faultNotes)+')' : ''}</div>
          <div><b>🎒 الملحقات:</b> ${(d.device && d.device.accessories) || 'بدون'}</div>
        </div>
      `}
    </div>
    <div class="actions-row" style="flex-wrap:wrap;">
      <button class="btn btn-ghost" id="backBtn">السابق</button>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" id="saveOnlyBtn">💾 حفظ فقط</button>
        <button class="btn btn-whatsapp btn-sm" id="saveWaBtn">${WA_ICON} واتساب</button>
        <button class="btn btn-amber btn-sm" id="saveStickerBtn">🏷️ حفظ وطباعة ملصق</button>
        <button class="btn btn-primary btn-sm" id="savePrintBtn">🖨️ حفظ وطباعة A5</button>
      </div>
    </div>
  `;
  document.getElementById('backBtn').onclick = ()=>{ state.formStep=3; renderMain(); };
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

/* ---------------- Archive & Overdue Reminders ---------------- */
const STATUS_GROUPS = {
  all: {label:'الكل', statuses:null},
  active: {label:'قيد العمل ⏳', statuses:['قيد الفحص','الصيانة']},
  done: {label:'جاهزة للاستلام ✅', statuses:['مكتمل']},
  delivered: {label:'تم التسليم 🤝', statuses:['تم التسليم']},
  overdue: {label:'⏰ متروكة +7 أيام', statuses:null},
  rejected: {label:'تعذرت / مرفوضة ❌', statuses:['رفض العميل','تعذرت الصيانة']}
};

/* Global direct handlers for receipt row actions - 100% immune to listener drops */
window.openReceiptDetailModal = function(receiptId, receiptNum){
  try{
    const r = findReceiptByIdOrNum(receiptId, receiptNum);
    if(!r){
      console.warn('Receipt not found for id/num:', receiptId, receiptNum);
      showToast('لم يتم العثور على الإيصال المطلوب', 'error');
      return;
    }
    openReceiptDetail(r);
  }catch(err){
    console.error('Error in openReceiptDetailModal:', err);
    showToast('حدث خطأ أثناء فتح الإيصال: ' + (err.message || err), 'error');
  }
};

window.openReIntakeModalDirect = function(receiptId, receiptNum){
  try{
    const r = findReceiptByIdOrNum(receiptId, receiptNum);
    if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }
    openReIntakeDeviceModal(r);
  }catch(err){
    console.error('Error in openReIntakeModalDirect:', err);
    showToast('حدث خطأ أثناء فتح إعادة الصيانة: ' + (err.message || err), 'error');
  }
};

window.convertReceiptToInvoiceDirect = function(receiptId, receiptNum){
  try{
    const r = findReceiptByIdOrNum(receiptId, receiptNum);
    if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }
    convertReceiptToInvoice(r.id || r.receiptNumber);
  }catch(err){
    console.error('Error in convertReceiptToInvoiceDirect:', err);
    showToast('حدث خطأ أثناء التحويل لفاتورة: ' + (err.message || err), 'error');
  }
};

window.openQuickStatusModalDirect = function(receiptId, receiptNum){
  try{
    const r = findReceiptByIdOrNum(receiptId, receiptNum);
    if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }
    openQuickStatusModal(r);
  }catch(err){
    console.error('Error in openQuickStatusModalDirect:', err);
    showToast('حدث خطأ أثناء فتح تغيير الحالة: ' + (err.message || err), 'error');
  }
};

window.openStickerPrintDirect = function(receiptId, receiptNum, evt){
  try{
    const r = findReceiptByIdOrNum(receiptId, receiptNum);
    if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }
    const ev = evt || (typeof window !== 'undefined' ? window.event : null);
    const forceModal = ev ? (ev.shiftKey || ev.altKey) : false;
    openStickerPrint(r, forceModal);
  }catch(err){
    console.error('Error in openStickerPrintDirect:', err);
    showToast('حدث خطأ أثناء فتح طباعة الملصق: ' + (err.message || err), 'error');
  }
};

window.openStickerOptionsDirect = function(receiptId, receiptNum){
  try{
    const r = findReceiptByIdOrNum(receiptId, receiptNum);
    if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }
    openStickerPrint(r, true);
  }catch(err){
    console.error('Error in openStickerOptionsDirect:', err);
    showToast('حدث خطأ أثناء فتح إعدادات الملصق: ' + (err.message || err), 'error');
  }
};

window.openWhatsappDirect = function(receiptId, receiptNum){
  try{
    const r = findReceiptByIdOrNum(receiptId, receiptNum);
    if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }
    openWhatsapp(r);
  }catch(err){
    console.error('Error in openWhatsappDirect:', err);
    showToast('حدث خطأ أثناء فتح رسائل واتساب: ' + (err.message || err), 'error');
  }
};

window.openCostEstimateModalDirect = function(receiptId, receiptNum){
  try{
    const r = findReceiptByIdOrNum(receiptId, receiptNum);
    if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }
    openCostEstimateModal(r);
  }catch(err){
    console.error('Error in openCostEstimateModalDirect:', err);
    showToast('حدث خطأ أثناء فتح نافذة مقايسة التكلفة: ' + (err.message || err), 'error');
  }
};

window.openReceiptPrintDirect = function(receiptId, receiptNum, kind='receipt'){
  try{
    const r = findReceiptByIdOrNum(receiptId, receiptNum);
    if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }
    openReceiptPrint(r, kind);
  }catch(err){
    console.error('Error in openReceiptPrintDirect:', err);
    showToast('حدث خطأ أثناء تجهيز الطباعة: ' + (err.message || err), 'error');
  }
};

window.deleteReceiptDirect = function(receiptId, receiptNum){
  try{
    const r = findReceiptByIdOrNum(receiptId, receiptNum);
    if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }
    const cName = (r.customer && r.customer.name) || 'عميل';
    requestAdminAuthorization({
      action: 'حذف إيصال صيانة',
      entityType: 'إيصال صيانة',
      entityId: r.id || r.receiptNumber,
      entityTitle: `#${r.receiptNumber} (${cName})`,
      onApproved: async ()=>{
        try{
          await deleteReceiptRemote(r.id || r.receiptNumber);
          state.receipts = (state.receipts || []).filter(x=>String(x.id)!==String(r.id) && String(x.receiptNumber)!==String(r.receiptNumber));
          showToast(`تم حذف الإيصال #${r.receiptNumber} بنجاح`, 'success');
          renderMain();
        }catch(e){ showToast('تعذر الحذف: '+e.message, 'error'); }
      }
    });
  }catch(err){
    console.error('Error in deleteReceiptDirect:', err);
    showToast('حدث خطأ: ' + (err.message || err), 'error');
  }
};

/* ==========================================================================
   UNIFIED ACTIONS & SELECTION ENGINE (المحرك الموحد للاختيار وإجراءات البرنامج)
   ========================================================================== */

function getOrCreateUnifiedSelectionBar(){
  let bar = document.getElementById('unifiedSelectionBar');
  if(!bar){
    bar = document.createElement('div');
    bar.id = 'unifiedSelectionBar';
  }
  const topSlot = document.getElementById('unifiedSelectionTopSlot');
  if(topSlot){
    if(bar.parentElement !== topSlot){
      topSlot.appendChild(bar);
    }
  }
  return bar;
}

window.renderUnifiedSelectionBar = function(){
  const topSlot = document.getElementById('unifiedSelectionTopSlot');
  if(!topSlot){
    const existing = document.getElementById('unifiedSelectionBar');
    if(existing && existing.parentElement !== topSlot) existing.remove();
    return;
  }

  let bar = document.getElementById('unifiedSelectionBar');
  if(!bar){
    bar = document.createElement('div');
    bar.id = 'unifiedSelectionBar';
    topSlot.appendChild(bar);
  } else if(bar.parentElement !== topSlot){
    topSlot.appendChild(bar);
  }

  const isInv = (state.currentSection === 'inventory') || (state.tab === 'inventory');

  // Context 1: Inventory Item Selected
  if(isInv && state.selectedInventoryItemId){
    const item = (state.inventory || []).find(x => String(x.ID) === String(state.selectedInventoryItemId));
    if(item){
      const qty = Number(item.Quantity || 0);
      const minStock = Number(item.MinStock || 2);
      const isLow = qty <= minStock;
      const sell = Number(item.SellPrice || 0);
      const wh = item.Warehouse || 'المخزن الرئيسي';

      bar.className = 'unified-selection-bar active';
      bar.innerHTML = `
        <div class="unified-bar-info">
          <div class="unified-bar-badge" style="background:#fef3c7;color:#b45309;">
            <span>📦 صنف مختار</span>
            ${item.SKU ? `<b class="mono" style="direction:ltr;">#${escapeHtml(item.SKU)}</b>` : ''}
          </div>
          <div style="font-size:12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span style="font-weight:800;color:var(--ink);">${escapeHtml(item.Name)}</span>
            <span style="color:var(--ink-secondary);font-size:11px;">(${escapeHtml(item.Category || 'صيانة')} • ${escapeHtml(wh)})</span>
            <span class="mono" style="font-size:11.5px;font-weight:800;color:${isLow ? 'var(--red)' : 'var(--green)'};">
              الرصيد: ${qty} ${escapeHtml(item.Unit || 'قطعة')}
            </span>
            <span class="mono" style="font-size:11.5px;font-weight:700;color:var(--ink);">
              البيع: ${sell.toLocaleString()} ج.م
            </span>
          </div>
        </div>

        <div class="unified-bar-actions">
          <button class="unified-bar-btn btn-primary" onclick="openInventoryItemModalDirect('${item.ID}', false)" title="تعديل بيانات وسعر وموقع الصنف">
            ✏️ تعديل الصنف
          </button>
          <button class="unified-bar-btn btn-ghost" style="background:var(--paper2);border:1px solid var(--line);" onclick="openWarehouseTransferModalDirect('${item.ID}')" title="تحويل رصيد لمخزن أو فرع آخر">
            🔄 تحويل لمخزن
          </button>
          <button class="unified-bar-btn btn-amber" onclick="printInventoryStickerDirect('${item.ID}')" title="طباعة ملصق الباركود الحراري">
            🏷️ طباعة ملصق
          </button>
          <button class="unified-bar-btn btn-ghost" style="background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;" onclick="openInventoryItemModalDirect('${item.ID}', true)" title="تكرار الصنف كنسخة جديدة">
            📋 نسخ وتكرار
          </button>
          <button class="unified-bar-btn btn-red" onclick="deleteInventoryItemDirect('${item.ID}')" title="${(state.user && state.user.role==='admin') ? 'حذف الصنف' : 'طلب تصريح حذف'}">
            ${(state.user && state.user.role==='admin') ? '🗑️ حذف' : '🔒 طلب حذف'}
          </button>
          <button class="unified-bar-btn-close" onclick="deselectCurrentSelection()" title="إلغاء التحديد">
            ✕
          </button>
        </div>
      `;
      return;
    }
  }

  // Context 1.5: Multiple Receipts Selected (Consolidated Invoicing & Batch Actions)
  if(!isInv && state.tab !== 'customers' && state.selectedReceiptIds && state.selectedReceiptIds.length > 1){
    const count = state.selectedReceiptIds.length;
    const selReceipts = (state.receipts || []).filter(r => {
      const id = String(r.id != null ? r.id : (r.ID != null ? r.ID : r.receiptNumber));
      return state.selectedReceiptIds.map(String).includes(id);
    });
    let totalDue = 0, totalDeposit = 0, totalRemaining = 0;
    const customerNames = new Set();
    selReceipts.forEach(r => {
      const otherAmt = Number(r.otherAccountAmount || 0);
      const due = Number(r.cost || 0) + Number(r.partsCost || 0) + otherAmt;
      const dep = Number(r.deposit || 0);
      const rem = Math.max(0, due - dep + Number(r.refunded || 0));
      totalDue += due;
      totalDeposit += dep;
      totalRemaining += rem;
      const c = extractCustomerName(r);
      if(c) customerNames.add(c);
    });
    const cLabel = Array.from(customerNames).join('، ') || 'متعدد';

    bar.className = 'unified-selection-bar active';
    bar.innerHTML = `
      <div class="unified-bar-info">
        <div class="unified-bar-badge" style="background:#e0e7ff;color:#3730a3;">
          <span>📑 تم تحديد (${count}) إيصالات</span>
        </div>
        <div style="font-size:12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-weight:700;color:var(--ink);">${escapeHtml(cLabel)}</span>
          <span class="mono" style="font-size:11.5px;font-weight:800;color:var(--ink);">
            الإجمالي: ${totalDue.toLocaleString()} ج.م
          </span>
          <span class="mono" style="font-size:11.5px;font-weight:800;color:var(--green);">
            المدفوع: ${totalDeposit.toLocaleString()} ج.م
          </span>
          <span class="mono" style="font-size:11.5px;font-weight:800;${totalRemaining > 0 ? 'color:var(--red);' : 'color:var(--green);'}">
            المتبقي: ${totalRemaining.toLocaleString()} ج.م
          </span>
        </div>
      </div>

      <div class="unified-bar-actions">
        <button class="unified-bar-btn btn-primary" style="background:linear-gradient(135deg, #4f46e5, #4338ca);color:#fff;font-weight:800;box-shadow:0 2px 6px rgba(79,70,229,0.3);" onclick="convertMultipleReceiptsToInvoice(state.selectedReceiptIds)" title="إنشاء فاتورة ضريبية مجمعة تجمع كافة الأجهزة والصيانات للإيصالات المحددة">
          🧾 إصدار فاتورة مجمعة (${count})
        </button>
        <button class="unified-bar-btn btn-ghost" style="background:var(--paper2);border:1px solid var(--line);" onclick="state.selectedReceiptIds = []; if(typeof renderArchive==='function') renderArchive(); if(typeof window.renderUnifiedSelectionBar==='function') window.renderUnifiedSelectionBar();" title="إلغاء التحديد">
          إلغاء التحديد
        </button>
        <button class="unified-bar-btn-close" onclick="state.selectedReceiptIds = []; if(typeof renderArchive==='function') renderArchive(); if(typeof window.renderUnifiedSelectionBar==='function') window.renderUnifiedSelectionBar();" title="إلغاء التحديد">
          ✕
        </button>
      </div>
    `;
    return;
  }

  // Context 2: Receipt Selected in Maintenance
  if(!isInv && state.tab !== 'customers' && state.selectedReceiptId){
    const r = findReceiptByIdOrNum(state.selectedReceiptId, state.selectedReceiptNum);
    if(r){
      const safeTargetId = String(r.id != null ? r.id : (r.ID != null ? r.ID : r.receiptNumber));
      const rNum = String(r.receiptNumber || r.ReceiptNumber || state.selectedReceiptNum || '');
      const otherAmt = Number(r.otherAccountAmount || 0);
      const totalDue = Number(r.cost || 0) + Number(r.partsCost || 0) + otherAmt;
      const deposit = Number(r.deposit || 0);
      const remaining = Math.max(0, totalDue - deposit + Number(r.refunded || 0));
      const cName = extractCustomerName(r) || 'عميل';
      const dCat = (r.device && r.device.category) || 'جهاز';
      const dBrand = (r.device ? (r.device.brand === 'أخرى' ? r.device.brandOther : r.device.brand) : '') || '';

      bar.className = 'unified-selection-bar active';
      bar.innerHTML = `
        <div class="unified-bar-info">
          <div class="unified-bar-badge">
            <span>✓ إيصال مختار</span>
            <b class="mono" style="direction:ltr;unicode-bidi:isolate;">#${escapeHtml(rNum)}</b>
          </div>
          <div style="font-size:12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span style="font-weight:700;color:var(--ink);">${escapeHtml(cName)}</span>
            <span style="color:var(--ink-secondary);font-size:11px;">(${escapeHtml(dCat)} ${escapeHtml(dBrand)})</span>
            <span class="mono" style="font-size:11.5px;font-weight:800;${remaining > 0 ? 'color:var(--red);' : 'color:var(--green);'}">
              ${remaining > 0 ? `متبقي: ${remaining.toLocaleString()} ج.م` : 'خالص المسدد'}
            </span>
          </div>
        </div>

        <div class="unified-bar-actions">
          <button class="unified-bar-btn btn-status-quick" style="background:var(--green-bg);color:var(--green-text);border-color:rgba(5,150,105,0.25);" onclick="openQuickStatusModalDirect('${safeTargetId}', '${rNum}')" title="تغيير سريع لحالة الجهاز">
            ⚡ الحالة
          </button>
          <button class="unified-bar-btn" style="background:#ecfdf5;color:#047857;border-color:rgba(16,185,129,0.35);font-weight:700;" onclick="openCostEstimateModalDirect('${safeTargetId}', '${rNum}')" title="عرض ومقايسة التكلفة عبر واتساب">
            💰 عرض التكلفة
          </button>
          <button class="unified-bar-btn btn-whatsapp" onclick="openWhatsappDirect('${safeTargetId}', '${rNum}')" title="محادثة واتساب">
            ${WA_ICON} واتساب
          </button>
          <button class="unified-bar-btn btn-green" onclick="openReceiptPrintDirect('${safeTargetId}', '${rNum}', 'receipt')" title="طباعة إيصال استلام A5">
            🖨️ طباعة A5
          </button>
          <button class="unified-bar-btn btn-amber" onclick="openStickerPrintDirect('${safeTargetId}', '${rNum}', event)" title="طباعة ملصق الباركود">
            🏷️ ملصق
          </button>
          <button class="unified-bar-btn btn-ghost" style="background:var(--paper2);border:1px solid var(--line);" onclick="openReceiptDetailModal('${safeTargetId}', '${rNum}')" title="تعديل وعرض تفاصيل الإيصال">
            ✏️ تعديل
          </button>
          <button class="unified-bar-btn btn-amber" style="background:#fef3c7;color:#b45309;" onclick="openReIntakeModalDirect('${safeTargetId}', '${rNum}')" title="صيانة راجعة أو عطل جديد">
            🔄 صيانة راجعة
          </button>
          <button class="unified-bar-btn btn-blue" onclick="convertReceiptToInvoiceDirect('${safeTargetId}', '${rNum}')" title="تحويل لفاتورة ضريبية">
            📄 فاتورة
          </button>
          <button class="unified-bar-btn btn-red" onclick="deleteReceiptDirect('${safeTargetId}', '${rNum}')" title="${(state.user && state.user.role === 'admin') ? 'حذف الإيصال' : 'طلب تصريح حذف'}">
            ${(state.user && state.user.role === 'admin') ? '🗑️ حذف' : '🔒 طلب حذف'}
          </button>
          <button class="unified-bar-btn-close" onclick="deselectCurrentSelection()" title="إلغاء التحديد">
            ✕
          </button>
        </div>
      `;
      return;
    }
  }

  // Context 3: Customer Selected
  if(state.tab === 'customers' && state.selectedCustomerId){
    const custName = state.selectedCustomerId;
    const allCusts = state.customers || [];
    const cust = allCusts.find(c => extractCustomerName(c) === custName);
    const cPhone = (cust && extractCustomerPhone(cust)) || '';
    const clientReceipts = (state.receipts || []).filter(r => {
      const rName = extractCustomerName(r);
      const rPhone = extractCustomerPhone(r);
      return (rName && rName.toLowerCase() === custName.toLowerCase()) || (cPhone && rPhone === cPhone);
    });

    bar.className = 'unified-selection-bar active';
    bar.innerHTML = `
      <div class="unified-bar-info">
        <div class="unified-bar-badge" style="background:#eff6ff;color:#2563eb;">
          <span>👤 عميل مختار</span>
        </div>
        <div style="font-size:12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-weight:800;color:var(--ink);">${escapeHtml(custName)}</span>
          ${cPhone && cPhone !== '0000000000' ? `<span class="mono" style="color:var(--ink-secondary);font-size:11.5px;direction:ltr;">${escapeHtml(cPhone)}</span>` : ''}
          <span class="badge badge-blue" style="font-size:10.5px;">🛠️ ${clientReceipts.length} جهاز مسجل</span>
        </div>
      </div>

      <div class="unified-bar-actions">
        <button class="unified-bar-btn btn-primary" onclick="openCustomerActionSheet('${escapeHtml(custName)}', '${escapeHtml(cPhone)}');" title="فتح لوحة إجراءات العميل الموحدة">
          ⚡ خيارات العميل
        </button>
        <button class="unified-bar-btn btn-ghost" style="background:var(--paper2);border:1px solid var(--line);" onclick="document.querySelector('tr.selected-row .edit-cust-btn')?.click();" title="تعديل بيانات العميل">
          ✏️ تعديل
        </button>
        <button class="unified-bar-btn btn-blue" onclick="document.querySelector('tr.selected-row .cust-new-receipt-btn')?.click();" title="إنشاء إيصال صيانة جديد لهذا العميل">
          ➕ إيصال صيانة
        </button>
        <button class="unified-bar-btn btn-ghost" style="background:#faf5ff;color:#7c3aed;border:1px solid #ddd6fe;" onclick="document.querySelector('tr.selected-row .cust-new-inv-btn')?.click();" title="إنشاء فاتورة جديدة">
          🧾 فاتورة
        </button>
        ${cPhone && cPhone !== '0000000000' ? `
          <a href="https://wa.me/${normalizePhoneForWa(cPhone)}" target="_blank" class="unified-bar-btn btn-whatsapp" style="text-decoration:none;">
            ${WA_ICON} واتساب
          </a>
        ` : ''}
        <button class="unified-bar-btn-close" onclick="deselectCurrentSelection()" title="إلغاء التحديد">
          ✕
        </button>
      </div>
    `;
    return;
  }

  // Context 4: Standby State (Nothing selected) - Permanent stationary toolbar in place!
  bar.className = 'unified-selection-bar standby';

  if(isInv){
    bar.innerHTML = `
      <div class="unified-bar-info">
        <div class="unified-bar-badge" style="background:var(--paper3);color:var(--ink-secondary);border:1px dashed var(--line);">
          <span>📌 شريط إجراءات الأصناف الموحد</span>
        </div>
        <div style="font-size:12px;color:var(--ink-secondary);">
          اضغط على أي صنف من الجدول أدناه لتحديد الإجراء المطلوب
        </div>
      </div>
      <div class="unified-bar-actions" style="opacity:0.55;pointer-events:none;">
        <button class="unified-bar-btn btn-primary" disabled>✏️ تعديل الصنف</button>
        <button class="unified-bar-btn btn-ghost" style="background:var(--paper2);border:1px solid var(--line);" disabled>🔄 تحويل لمخزن</button>
        <button class="unified-bar-btn btn-amber" disabled>🏷️ طباعة ملصق</button>
        <button class="unified-bar-btn btn-ghost" disabled>📋 نسخ وتكرار</button>
        <button class="unified-bar-btn btn-red" disabled>🗑️ حذف</button>
      </div>
    `;
  } else if(state.tab === 'customers'){
    bar.innerHTML = `
      <div class="unified-bar-info">
        <div class="unified-bar-badge" style="background:var(--paper3);color:var(--ink-secondary);border:1px dashed var(--line);">
          <span>📌 شريط إجراءات العملاء الموحد</span>
        </div>
        <div style="font-size:12px;color:var(--ink-secondary);">
          اضغط على أي عميل لتفعيل خيارات التعديل والمراسلة وإيصالات الصيانة
        </div>
      </div>
      <div class="unified-bar-actions" style="opacity:0.55;pointer-events:none;">
        <button class="unified-bar-btn btn-primary" disabled>⚡ خيارات العميل</button>
        <button class="unified-bar-btn btn-ghost" disabled>✏️ تعديل</button>
        <button class="unified-bar-btn btn-blue" disabled>➕ إيصال صيانة</button>
        <button class="unified-bar-btn btn-ghost" disabled>🧾 فاتورة</button>
      </div>
    `;
  } else {
    // Maintenance Standby
    bar.innerHTML = `
      <div class="unified-bar-info">
        <div class="unified-bar-badge" style="background:var(--paper3);color:var(--ink-secondary);border:1px dashed var(--line);">
          <span>📌 شريط إجراءات الصيانة الموحد</span>
        </div>
        <div style="font-size:12px;color:var(--ink-secondary);">
          اضغط على أي إيصال من الجدول لتفعيل الإجراءات السريعة
        </div>
      </div>
      <div class="unified-bar-actions" style="opacity:0.55;pointer-events:none;">
        <button class="unified-bar-btn btn-status-quick" disabled>⚡ الحالة</button>
        <button class="unified-bar-btn" disabled>💰 عرض التكلفة</button>
        <button class="unified-bar-btn btn-whatsapp" disabled>${WA_ICON} واتساب</button>
        <button class="unified-bar-btn btn-green" disabled>🖨️ طباعة A5</button>
        <button class="unified-bar-btn btn-amber" disabled>🏷️ ملصق</button>
        <button class="unified-bar-btn btn-ghost" disabled>✏️ تعديل</button>
        <button class="unified-bar-btn btn-amber" disabled>🔄 صيانة راجعة</button>
        <button class="unified-bar-btn btn-blue" disabled>📄 فاتورة</button>
        <button class="unified-bar-btn btn-red" disabled>🗑️ حذف</button>
      </div>
    `;
  }
};

window.hideUnifiedSelectionBar = function(){
  state.selectedReceiptId = null;
  state.selectedReceiptNum = null;
  state.selectedReceiptIds = [];
  state.selectedCustomerId = null;
  state.selectedInventoryItemId = null;
  document.querySelectorAll('.selected-row').forEach(el => el.classList.remove('selected-row'));
  document.querySelectorAll('.selected-card').forEach(el => el.classList.remove('selected-card'));
  document.querySelectorAll('.selected-badge-indicator').forEach(el => el.remove());
  document.querySelectorAll('.receipt-select-cb').forEach(cb => { cb.checked = false; });
  const allCb = document.getElementById('receiptSelectAllCb');
  if(allCb) { allCb.checked = false; allCb.indeterminate = false; }
  if(typeof window.renderUnifiedSelectionBar === 'function'){
    window.renderUnifiedSelectionBar();
  }
};

window.deselectCurrentSelection = function(){
  window.hideUnifiedSelectionBar();
};

window.selectReceipt = function(receiptId, receiptNum){
  const r = findReceiptByIdOrNum(receiptId, receiptNum);
  if(!r) return;

  const safeTargetId = String(r.id != null ? r.id : (r.ID != null ? r.ID : r.receiptNumber));
  const rNum = String(r.receiptNumber || r.ReceiptNumber || receiptNum || '');

  state.selectedReceiptId = safeTargetId;
  state.selectedReceiptNum = rNum;
  state.selectedReceiptIds = [safeTargetId];
  state.selectedCustomerId = null;
  state.selectedInventoryItemId = null;

  // Update DOM highlights
  document.querySelectorAll('.selected-row').forEach(el => el.classList.remove('selected-row'));
  document.querySelectorAll('.selected-card').forEach(el => el.classList.remove('selected-card'));
  document.querySelectorAll('.selected-badge-indicator').forEach(el => el.remove());

  const matchingRows = document.querySelectorAll(`tr[data-receipt-id="${safeTargetId}"]`);
  matchingRows.forEach(el => {
    el.classList.add('selected-row');
    const cb = el.querySelector('.receipt-select-cb');
    if(cb) cb.checked = true;
    const firstCell = el.querySelector('td:nth-child(2) > div') || el.querySelector('td:first-child > div');
    if(firstCell && !firstCell.querySelector('.selected-badge-indicator')){
      const b = document.createElement('span');
      b.className = 'selected-badge-indicator';
      b.title = 'إيصال محدد';
      b.textContent = '✓';
      firstCell.prepend(b);
    }
  });

  const matchingCards = document.querySelectorAll(`.smart-receipt-card[data-receipt-id="${safeTargetId}"]`);
  matchingCards.forEach(el => {
    el.classList.add('selected-card');
    const cb = el.querySelector('.receipt-select-cb');
    if(cb) cb.checked = true;
  });

  window.renderUnifiedSelectionBar();
};

window.toggleReceiptMultiSelection = function(receiptId, isChecked, evt){
  if(evt) evt.stopPropagation();
  if(!Array.isArray(state.selectedReceiptIds)) state.selectedReceiptIds = [];
  const sId = String(receiptId);

  if(isChecked){
    if(!state.selectedReceiptIds.includes(sId)){
      state.selectedReceiptIds.push(sId);
    }
  } else {
    state.selectedReceiptIds = state.selectedReceiptIds.filter(id => String(id) !== sId);
  }

  if(state.selectedReceiptIds.length === 1){
    state.selectedReceiptId = state.selectedReceiptIds[0];
    const r = findReceiptByIdOrNum(state.selectedReceiptId);
    state.selectedReceiptNum = r ? String(r.receiptNumber || '') : null;
  } else if(state.selectedReceiptIds.length === 0){
    state.selectedReceiptId = null;
    state.selectedReceiptNum = null;
  } else {
    state.selectedReceiptId = null;
  }

  // Update DOM highlights
  const row = document.querySelector(`tr[data-receipt-id="${sId}"]`);
  if(row){
    if(isChecked) row.classList.add('selected-row');
    else row.classList.remove('selected-row');
  }
  const card = document.querySelector(`.smart-receipt-card[data-receipt-id="${sId}"]`);
  if(card){
    if(isChecked) card.classList.add('selected-card');
    else card.classList.remove('selected-card');
  }

  const allCb = document.getElementById('receiptSelectAllCb');
  if(allCb){
    const visibleCbs = Array.from(document.querySelectorAll('.receipt-select-cb'));
    if(visibleCbs.length > 0){
      allCb.checked = visibleCbs.every(c => c.checked);
      allCb.indeterminate = visibleCbs.some(c => c.checked) && !allCb.checked;
    }
  }

  if(typeof window.renderUnifiedSelectionBar === 'function'){
    window.renderUnifiedSelectionBar();
  }
};

window.toggleSelectAllReceipts = function(isChecked){
  if(!Array.isArray(state.selectedReceiptIds)) state.selectedReceiptIds = [];
  const visibleCbs = document.querySelectorAll('.receipt-select-cb');
  visibleCbs.forEach(cb => {
    cb.checked = isChecked;
    const sId = String(cb.value);
    const row = document.querySelector(`tr[data-receipt-id="${sId}"]`);
    const card = document.querySelector(`.smart-receipt-card[data-receipt-id="${sId}"]`);
    if(isChecked){
      if(!state.selectedReceiptIds.includes(sId)) state.selectedReceiptIds.push(sId);
      if(row) row.classList.add('selected-row');
      if(card) card.classList.add('selected-card');
    } else {
      if(row) row.classList.remove('selected-row');
      if(card) card.classList.remove('selected-card');
    }
  });

  if(!isChecked){
    state.selectedReceiptIds = [];
    state.selectedReceiptId = null;
    state.selectedReceiptNum = null;
  } else if(state.selectedReceiptIds.length === 1){
    state.selectedReceiptId = state.selectedReceiptIds[0];
  } else {
    state.selectedReceiptId = null;
  }

  if(typeof window.renderUnifiedSelectionBar === 'function'){
    window.renderUnifiedSelectionBar();
  }
};

// Inventory Direct Action Handlers
window.openInventoryItemModalDirect = function(itemId, isClone = false){
  const item = (state.inventory || []).find(x => String(x.ID) === String(itemId));
  if(item) openInventoryItemModal(item, isClone, state.invHubTab || 'all');
};

window.openWarehouseTransferModalDirect = function(itemId){
  const item = (state.inventory || []).find(x => String(x.ID) === String(itemId));
  if(item) openWarehouseTransferModal(item);
};

window.printInventoryStickerDirect = function(itemId){
  const item = (state.inventory || []).find(x => String(x.ID) === String(itemId));
  if(item) openProductBarcodeSticker(item);
};

window.deleteInventoryItemDirect = function(itemId){
  const item = (state.inventory || []).find(x => String(x.ID) === String(itemId));
  if(!item) return;
  requestAdminAuthorization({
    action: 'حذف صنف مخزن',
    entityType: 'صنف من المخزن',
    entityId: item.ID,
    entityTitle: `${item.Name} (${item.Category || 'صيانة'})`,
    onApproved: async ()=>{
      try {
        await deleteInventoryItemRemote(item.ID);
        showToast('تم حذف الصنف بنجاح', 'success');
        window.deselectCurrentSelection();
        if(typeof render === 'function') render();
      } catch(e){
        showToast('تعذر الحذف: ' + e.message, 'error');
      }
    }
  });
};

window.selectInventoryItem = function(itemId){
  if(!itemId) return;
  const item = (state.inventory || []).find(x => String(x.ID) === String(itemId));
  if(!item) return;

  state.selectedInventoryItemId = String(itemId);
  state.selectedReceiptId = null;
  state.selectedReceiptNum = null;
  state.selectedCustomerId = null;

  document.querySelectorAll('.selected-row').forEach(el => el.classList.remove('selected-row'));
  document.querySelectorAll('.selected-badge-indicator').forEach(el => el.remove());

  const matchingRows = document.querySelectorAll(`tr[data-inv-id="${itemId}"]`);
  matchingRows.forEach(el => {
    el.classList.add('selected-row');
    const firstCell = el.querySelector('td:first-child > div');
    if(firstCell && !firstCell.querySelector('.selected-badge-indicator')){
      const b = document.createElement('span');
      b.className = 'selected-badge-indicator';
      b.title = 'صنف محدد';
      b.textContent = '✓';
      firstCell.prepend(b);
    }
  });

  window.renderUnifiedSelectionBar();
};

window.toggleInventorySelection = function(itemId){
  if(String(state.selectedInventoryItemId) === String(itemId)){
    window.deselectCurrentSelection();
  } else {
    window.selectInventoryItem(itemId);
  }
};

window.handleInventoryRowClick = function(itemId, evt){
  if(evt && evt.target && evt.target.closest('button, a, input, select')){
    return;
  }
  window.toggleInventorySelection(itemId);
};

window.toggleReceiptSelection = function(receiptId, receiptNum){
  const safeId = String(receiptId);
  if(state.selectedReceiptId === safeId){
    deselectCurrentSelection();
  } else {
    selectReceipt(receiptId, receiptNum);
  }
};

window.handleReceiptRowClick = function(receiptId, receiptNum, evt){
  if(evt && evt.target && evt.target.closest('button, a, input, select')){
    return;
  }
  toggleReceiptSelection(receiptId, receiptNum);
};

window.handleReceiptCardClick = function(receiptId, receiptNum, evt){
  if(evt && evt.target && evt.target.closest('button, a, input, select')){
    return;
  }
  toggleReceiptSelection(receiptId, receiptNum);
};

window.openReceiptActionSheet = function(receiptId, receiptNum){
  const r = findReceiptByIdOrNum(receiptId, receiptNum);
  if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }

  const safeTargetId = String(r.id != null ? r.id : (r.ID != null ? r.ID : r.receiptNumber));
  const rNum = String(r.receiptNumber || r.ReceiptNumber || receiptNum || '');
  selectReceipt(safeTargetId, rNum);

  const cTitle = extractCustomerTitle(r);
  const cName = extractCustomerName(r) || 'عميل';
  const cPhone = extractCustomerPhone(r);
  const dCat = (r.device && r.device.category) || 'جهاز';
  const dBrand = (r.device ? (r.device.brand === 'أخرى' ? r.device.brandOther : r.device.brand) : '') || '';
  const dModel = (r.device && r.device.model) || '';
  const otherAmt = Number(r.otherAccountAmount || 0);
  const totalDue = Number(r.cost || 0) + Number(r.partsCost || 0) + otherAmt;
  const deposit = Number(r.deposit || 0);
  const remaining = Math.max(0, totalDue - deposit + Number(r.refunded || 0));
  const st = STATUSES.find(s => s.v === r.status) || STATUSES[0];

  const prevModal = document.getElementById('receiptActionSheetModal');
  if(prevModal) prevModal.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'receiptActionSheetModal';
  overlay.style.zIndex = '11000';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:580px;padding:22px;border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,0.28);">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--line);padding-bottom:14px;margin-bottom:16px;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="badge" style="background:var(--primary);color:#fff;font-weight:800;font-size:12px;padding:3px 8px;border-radius:6px;">⚡ إجراءات موحدة</span>
            <h3 style="margin:0;font-size:17px;color:var(--ink);">إيصال صيانة <span class="mono" style="direction:ltr;unicode-bidi:isolate;color:var(--primary);">#${escapeHtml(rNum)}</span></h3>
          </div>
          <div style="font-size:12px;color:var(--ink-secondary);margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span>👤 <b>${escapeHtml(cName)}</b></span>
            <span>📱 <b>${escapeHtml(dCat)} - ${escapeHtml(dBrand)} ${escapeHtml(dModel)}</b></span>
            <span class="status-badge ${st.cls}" style="font-size:10.5px;">${st.icon} ${escapeHtml(r.status)}</span>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('receiptActionSheetModal').remove()" style="font-size:14px;border-radius:50%;width:32px;height:32px;padding:0;display:flex;align-items:center;justify-content:center;">✕</button>
      </div>

      <!-- Financial Mini-Summary -->
      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;background:var(--paper2);padding:10px 12px;border-radius:12px;border:1px solid var(--line);margin-bottom:16px;text-align:center;">
        <div>
          <div style="font-size:10.5px;color:var(--ink-secondary);font-weight:700;">التكلفة الإجمالية</div>
          <div class="mono font-bold" style="font-size:14px;color:var(--ink);">${totalDue.toLocaleString()} ج.م</div>
        </div>
        <div style="border-right:1px solid var(--line);border-left:1px solid var(--line);">
          <div style="font-size:10.5px;color:var(--ink-secondary);font-weight:700;">المدفوع</div>
          <div class="mono font-bold" style="font-size:14px;color:var(--green);">${deposit.toLocaleString()} ج.م</div>
        </div>
        <div>
          <div style="font-size:10.5px;color:var(--ink-secondary);font-weight:700;">المتبقي</div>
          <div class="mono font-bold" style="font-size:14px;${remaining > 0 ? 'color:var(--red);' : 'color:var(--green);'}">${remaining.toLocaleString()} ج.م</div>
        </div>
      </div>

      <!-- Actions Grid -->
      <div class="action-sheet-section-title">🛠️ إجراءات وخدمات الصيانة</div>
      <div class="action-sheet-grid">
        <div class="action-sheet-card-btn" style="border-color:rgba(124,58,237,0.35);background:rgba(124,58,237,0.04);" onclick="document.getElementById('receiptActionSheetModal').remove(); openAiDiagnosisModalDirect('${safeTargetId}', '${rNum}');">
          <div class="act-icon" style="color:#7c3aed;">⚡</div>
          <div class="act-label" style="color:#6d28d9;">تشخيص العطل (AI)</div>
          <div class="act-desc">تحليل ذكي ومساعد الفني</div>
        </div>
        <div class="action-sheet-card-btn" onclick="document.getElementById('receiptActionSheetModal').remove(); openQuickStatusModalDirect('${safeTargetId}', '${rNum}');">
          <div class="act-icon">⚡</div>
          <div class="act-label">تغيير الحالة</div>
          <div class="act-desc">تحديث فوري لموقف الجهاز</div>
        </div>
        <div class="action-sheet-card-btn" onclick="document.getElementById('receiptActionSheetModal').remove(); openReceiptDetailModal('${safeTargetId}', '${rNum}');">
          <div class="act-icon">✏️</div>
          <div class="act-label">تعديل الإيصال</div>
          <div class="act-desc">تعديل الأعطال والمبالغ</div>
        </div>
        <div class="action-sheet-card-btn" onclick="document.getElementById('receiptActionSheetModal').remove(); openReIntakeModalDirect('${safeTargetId}', '${rNum}');">
          <div class="act-icon">🔄</div>
          <div class="act-label">صيانة راجعة</div>
          <div class="act-desc">إعادة إدخال نفس الجهاز</div>
        </div>
      </div>

      <div class="action-sheet-section-title">📄 الطباعة والمستندات الرسمية</div>
      <div class="action-sheet-grid">
        <div class="action-sheet-card-btn" onclick="document.getElementById('receiptActionSheetModal').remove(); openReceiptPrintDirect('${safeTargetId}', '${rNum}', 'receipt');">
          <div class="act-icon">🖨️</div>
          <div class="act-label">طباعة A5</div>
          <div class="act-desc">إيصال استلام رسمي</div>
        </div>
        <div class="action-sheet-card-btn" onclick="document.getElementById('receiptActionSheetModal').remove(); openStickerPrintDirect('${safeTargetId}', '${rNum}', event);">
          <div class="act-icon">🏷️</div>
          <div class="act-label">ملصق الباركود</div>
          <div class="act-desc">طباعة لاصق للجهاز فوراً</div>
        </div>
        <div class="action-sheet-card-btn" onclick="document.getElementById('receiptActionSheetModal').remove(); openStickerOptionsDirect('${safeTargetId}', '${rNum}');">
          <div class="act-icon">⚙️</div>
          <div class="act-label">مقاس وضبط الملصق</div>
          <div class="act-desc">تغيير مقاس الرول (40×20 / 50×25)</div>
        </div>
        <div class="action-sheet-card-btn" onclick="document.getElementById('receiptActionSheetModal').remove(); convertReceiptToInvoiceDirect('${safeTargetId}', '${rNum}');">
          <div class="act-icon">📄</div>
          <div class="act-label">تحويل لفاتورة</div>
          <div class="act-desc">فاتورة ضريبية رسمية</div>
        </div>
      </div>

      <div class="action-sheet-section-title">💬 التواصل والعمليات</div>
      <div class="action-sheet-grid">
        <div class="action-sheet-card-btn" style="border-color:rgba(16,185,129,0.35);background:rgba(16,185,129,0.04);" onclick="document.getElementById('receiptActionSheetModal').remove(); openCostEstimateModalDirect('${safeTargetId}', '${rNum}');">
          <div class="act-icon" style="color:#059669;">💰</div>
          <div class="act-label" style="color:#047857;">عرض ومقايسة التكلفة</div>
          <div class="act-desc">موافقة/رفض ورسوم الفحص</div>
        </div>
        <div class="action-sheet-card-btn" onclick="document.getElementById('receiptActionSheetModal').remove(); openWhatsappDirect('${safeTargetId}', '${rNum}');">
          <div class="act-icon" style="color:#22c55e;">💬</div>
          <div class="act-label">محادثة واتساب</div>
          <div class="act-desc">إرسال التحديث للعميل</div>
        </div>
        ${cPhone && cPhone !== '0000000000' ? `
          <a href="tel:${cPhone}" class="action-sheet-card-btn" style="text-decoration:none;" onclick="document.getElementById('receiptActionSheetModal').remove();">
            <div class="act-icon" style="color:var(--blue);">📞</div>
            <div class="act-label">اتصال بالعميل</div>
            <div class="act-desc mono">${escapeHtml(cPhone)}</div>
          </a>
        ` : `
          <div class="action-sheet-card-btn" onclick="document.getElementById('receiptActionSheetModal').remove(); openQuickAddPhoneModal('${escapeHtml(cName)}', '${escapeHtml(cTitle)}', '${safeTargetId}', '${rNum}');">
            <div class="act-icon" style="color:var(--amber);">⚠️</div>
            <div class="act-label">تسجيل هاتف</div>
            <div class="act-desc">إضافة رقم للعميل</div>
          </div>
        `}
        <div class="action-sheet-card-btn" style="border-color:rgba(239,68,68,0.3);background:rgba(239,68,68,0.03);" onclick="document.getElementById('receiptActionSheetModal').remove(); deleteReceiptDirect('${safeTargetId}', '${rNum}');">
          <div class="act-icon" style="color:var(--red);">🗑️</div>
          <div class="act-label" style="color:var(--red);">${(state.user && state.user.role === 'admin') ? 'حذف الإيصال' : '🔒 طلب حذف'}</div>
          <div class="act-desc">${(state.user && state.user.role === 'admin') ? 'حذف نهائي' : 'طلب تصريح إداري'}</div>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;margin-top:14px;border-top:1px solid var(--line);padding-top:12px;">
        <button class="btn btn-ghost" onclick="document.getElementById('receiptActionSheetModal').remove()">إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
};

/* ---------------- Customer Selection & Action Architecture ---------------- */

window.selectCustomer = function(custName, custPhone){
  if(!custName) return;
  state.selectedCustomerId = custName;
  state.selectedReceiptId = null;
  state.selectedReceiptNum = null;

  document.querySelectorAll('.selected-row').forEach(el => el.classList.remove('selected-row'));
  document.querySelectorAll('.selected-card').forEach(el => el.classList.remove('selected-card'));

  document.querySelectorAll('tr[data-cust-name]').forEach(el => {
    if(el.dataset.custName === custName){
      el.classList.add('selected-row');
    }
  });

  const cPhone = custPhone || '';
  const clientReceipts = (state.receipts || []).filter(r => {
    const rName = extractCustomerName(r);
    const rPhone = extractCustomerPhone(r);
    return (rName && rName.toLowerCase() === custName.toLowerCase()) || (cPhone && rPhone === cPhone);
  });

  const bar = getOrCreateUnifiedSelectionBar();
  bar.innerHTML = `
    <div class="unified-bar-info">
      <div class="unified-bar-badge" style="background:#eff6ff;color:#2563eb;">
        <span>👤 عميل مختار</span>
      </div>
      <div style="font-size:12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <span style="font-weight:800;color:var(--ink);">${escapeHtml(custName)}</span>
        ${cPhone && cPhone !== '0000000000' ? `<span class="mono" style="color:var(--ink-secondary);font-size:11.5px;direction:ltr;">${escapeHtml(cPhone)}</span>` : ''}
        <span class="badge badge-blue" style="font-size:10.5px;">🛠️ ${clientReceipts.length} جهاز مسجل</span>
      </div>
    </div>

    <div class="unified-bar-actions">
      <button class="unified-bar-btn btn-primary" onclick="openCustomerActionSheet('${escapeHtml(custName)}', '${escapeHtml(cPhone)}');" title="فتح لوحة إجراءات العميل الموحدة">
        ⚡ خيارات العميل
      </button>
      <button class="unified-bar-btn btn-ghost" style="background:var(--paper2);border:1px solid var(--line);" onclick="document.querySelector('tr.selected-row .edit-cust-btn')?.click();" title="تعديل بيانات العميل">
        ✏️ تعديل
      </button>
      <button class="unified-bar-btn btn-blue" onclick="document.querySelector('tr.selected-row .cust-new-receipt-btn')?.click();" title="إنشاء إيصال صيانة جديد لهذا العميل">
        ➕ إيصال صيانة
      </button>
      <button class="unified-bar-btn btn-ghost" style="background:#faf5ff;color:#7c3aed;border:1px solid #ddd6fe;" onclick="document.querySelector('tr.selected-row .cust-new-inv-btn')?.click();" title="إنشاء فاتورة جديدة">
        🧾 فاتورة
      </button>
      ${clientReceipts.length > 0 ? `
        <button class="unified-bar-btn btn-ghost" style="color:var(--primary);font-weight:800;border:1px solid var(--line);" onclick="document.querySelector('tr.selected-row .view-cust-receipts-btn')?.click();" title="استعراض أجهزة العميل بالأرشيف">
          📁 أجهزة العميل (${clientReceipts.length})
        </button>
      ` : ''}
      ${cPhone && cPhone !== '0000000000' ? `
        <a href="https://wa.me/${normalizePhoneForWa(cPhone)}" target="_blank" class="unified-bar-btn btn-whatsapp" style="text-decoration:none;">
          ${WA_ICON} واتساب
        </a>
        <a href="tel:${cPhone}" class="unified-bar-btn btn-ghost" style="text-decoration:none;border:1px solid var(--line);" title="اتصال هاتفي">
          📞 اتصال
        </a>
      ` : `
        <button class="unified-bar-btn btn-amber" onclick="openQuickAddPhoneModal('${escapeHtml(custName)}', '')">
          ⚠️ إضافة هاتف
        </button>
      `}
      <button class="unified-bar-btn-close" onclick="deselectCurrentSelection()" title="إلغاء التحديد">
        ✕
      </button>
    </div>
  `;
  bar.classList.add('active');
};

window.handleCustomerRowClick = function(custName, custPhone, evt){
  if(evt && evt.target && evt.target.closest('button, a, input, select')){
    return;
  }
  if(state.selectedCustomerId === custName){
    deselectCurrentSelection();
  } else {
    selectCustomer(custName, custPhone);
  }
};

window.openCustomerActionSheet = function(custName, custPhone, custTitle, custEmail){
  selectCustomer(custName, custPhone);
  const clientReceipts = (state.receipts || []).filter(r => {
    const rName = extractCustomerName(r);
    const rPhone = extractCustomerPhone(r);
    return (rName && rName.toLowerCase() === custName.toLowerCase()) || (custPhone && rPhone === custPhone);
  });

  const prevModal = document.getElementById('customerActionSheetModal');
  if(prevModal) prevModal.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'customerActionSheetModal';
  overlay.style.zIndex = '11000';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:520px;padding:22px;border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,0.28);">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--line);padding-bottom:14px;margin-bottom:16px;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="badge" style="background:#2563eb;color:#fff;font-weight:800;font-size:12px;padding:3px 8px;border-radius:6px;">👤 خيارات العميل الموحدة</span>
            <h3 style="margin:0;font-size:17px;color:var(--ink);">${escapeHtml(custName)}</h3>
          </div>
          <div style="font-size:12px;color:var(--ink-secondary);margin-top:6px;display:flex;align-items:center;gap:8px;">
            ${custTitle ? `<span class="badge badge-gray">${escapeHtml(custTitle)}</span>` : ''}
            ${custPhone ? `<span class="mono">📱 ${escapeHtml(custPhone)}</span>` : '<span style="color:var(--amber);">⚠️ بدون هاتف</span>'}
            <span class="badge badge-blue">🛠️ ${clientReceipts.length} جهاز مسجل</span>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('customerActionSheetModal').remove()" style="font-size:14px;border-radius:50%;width:32px;height:32px;padding:0;display:flex;align-items:center;justify-content:center;">✕</button>
      </div>

      <div class="action-sheet-section-title">⚡ العمليات والمعاملات المباشرة</div>
      <div class="action-sheet-grid">
        <div class="action-sheet-card-btn" onclick="document.getElementById('customerActionSheetModal').remove(); document.querySelector('tr.selected-row .cust-new-receipt-btn')?.click();">
          <div class="act-icon">➕</div>
          <div class="act-label">إيصال صيانة جديد</div>
          <div class="act-desc">استلام جهاز للعميل</div>
        </div>
        <div class="action-sheet-card-btn" onclick="document.getElementById('customerActionSheetModal').remove(); document.querySelector('tr.selected-row .cust-new-inv-btn')?.click();">
          <div class="act-icon">🧾</div>
          <div class="act-label">فاتورة جديدة</div>
          <div class="act-desc">إصدار فاتورة بيع/خدمة</div>
        </div>
        <div class="action-sheet-card-btn" style="background:#eff6ff;border-color:#bfdbfe;" onclick="document.getElementById('customerActionSheetModal').remove(); openCustomerStatementModal('${escapeHtml(custName)}', '${escapeHtml(custPhone||'')}');">
          <div class="act-icon" style="color:#2563eb;">📊</div>
          <div class="act-label">كشف حساب تفصيلي</div>
          <div class="act-desc">سجل حركات ورصيد العميل</div>
        </div>
        <div class="action-sheet-card-btn" onclick="document.getElementById('customerActionSheetModal').remove(); document.querySelector('tr.selected-row .edit-cust-btn')?.click();">
          <div class="act-icon">✏️</div>
          <div class="act-label">تعديل البيانات</div>
          <div class="act-desc">تحديث الهاتف والاسم</div>
        </div>
        ${clientReceipts.length > 1 ? `
          <div class="action-sheet-card-btn" style="background:#f5f3ff;border-color:#ddd6fe;" onclick="document.getElementById('customerActionSheetModal').remove(); openCustomerConsolidatedInvoiceModal('${escapeHtml(custName)}');">
            <div class="act-icon" style="color:#7c3aed;">🧾</div>
            <div class="act-label">فاتورة مجمعة (${clientReceipts.length})</div>
            <div class="act-desc">فوترة لكافة أجهزة العميل</div>
          </div>
        ` : ''}
      </div>

      <div class="action-sheet-section-title">💬 الاتصال والتواصل والأرشيف</div>
      <div class="action-sheet-grid">
        ${custPhone && custPhone !== '0000000000' ? `
          <a href="https://wa.me/${normalizePhoneForWa(custPhone)}" target="_blank" class="action-sheet-card-btn" style="text-decoration:none;" onclick="document.getElementById('customerActionSheetModal').remove();">
            <div class="act-icon" style="color:#22c55e;">💬</div>
            <div class="act-label">واتساب</div>
            <div class="act-desc">محادثة فورية</div>
          </a>
          <a href="tel:${custPhone}" class="action-sheet-card-btn" style="text-decoration:none;" onclick="document.getElementById('customerActionSheetModal').remove();">
            <div class="act-icon" style="color:var(--blue);">📞</div>
            <div class="act-label">اتصال مباشر</div>
            <div class="act-desc mono">${escapeHtml(custPhone)}</div>
          </a>
        ` : `
          <div class="action-sheet-card-btn" onclick="document.getElementById('customerActionSheetModal').remove(); openQuickAddPhoneModal('${escapeHtml(custName)}', '${escapeHtml(custTitle||'')}');">
            <div class="act-icon" style="color:var(--amber);">⚠️</div>
            <div class="act-label">إضافة هاتف</div>
            <div class="act-desc">تسجيل رقم للتواصل</div>
          </div>
        `}
        ${clientReceipts.length > 0 ? `
          <div class="action-sheet-card-btn" onclick="document.getElementById('customerActionSheetModal').remove(); document.querySelector('tr.selected-row .view-cust-receipts-btn')?.click();">
            <div class="act-icon" style="color:var(--primary);">📁</div>
            <div class="act-label">سجل أجهزة العميل</div>
            <div class="act-desc">${clientReceipts.length} جهاز في الأرشيف</div>
          </div>
        ` : ''}
      </div>

      <div style="display:flex;justify-content:flex-end;margin-top:14px;border-top:1px solid var(--line);padding-top:12px;">
        <button class="btn btn-ghost" onclick="document.getElementById('customerActionSheetModal').remove()">إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
};

/* ---------------- Table & Cards Views with Unified Actions ---------------- */

function archiveTable(list){
  const selIds = state.selectedReceiptIds || [];
  const allSelected = list.length > 0 && list.every(rawR => {
    const sId = String(rawR.id != null ? rawR.id : (rawR.ID != null ? rawR.ID : rawR.receiptNumber));
    return selIds.includes(sId);
  });

  return `<div class="table-wrap"><table><thead><tr>
    <th style="width:36px;text-align:center;">
      <input type="checkbox" id="receiptSelectAllCb" ${allSelected ? 'checked' : ''} onchange="window.toggleSelectAllReceipts(this.checked)" title="تحديد الكل" style="cursor:pointer;width:16px;height:16px;" />
    </th>
    <th>رقم الإيصال</th><th>العميل</th><th>الأجهزة</th><th>الفني</th><th>الحالة</th><th>التكلفة</th><th>المدفوع</th><th>المتبقي</th><th>الإجراءات الموحدة</th>
  </tr></thead><tbody>
  ${list.map(rawR=>{
    const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
    if(!r) return '';
    const st = STATUSES.find(s=>s.v===r.status) || STATUSES[0];
    const otherAmt = Number(r.otherAccountAmount || 0);
    const totalDue = Number(r.cost||0) + Number(r.partsCost||0) + otherAmt;
    const deposit = Number(r.deposit||0);
    const remaining = Math.max(0, totalDue - deposit + Number(r.refunded||0));
    const isOverdue = r.status==='مكتمل' && (Date.now()-new Date(r.updatedAt||r.date).getTime())/86400000 > 7;
    const cTitle = extractCustomerTitle(r);
    const cName = extractCustomerName(r) || 'عميل';
    const cPhone = extractCustomerPhone(r);
    const dCat = escapeHtml((r.device && r.device.category) || 'جهاز');
    const dBrand = escapeHtml(r.device ? (r.device.brand==='أخرى' ? r.device.brandOther : r.device.brand) : '');
    const dModel = escapeHtml((r.device && r.device.model) || '');
    const rId = escapeHtml(String(r.id != null ? r.id : (r.ID != null ? r.ID : '')));
    const rNum = escapeHtml(String(r.receiptNumber || r.ReceiptNumber || ''));
    const safeTargetId = rId || rNum;
    const isChecked = selIds.includes(String(safeTargetId));
    const isSelected = isChecked || (String(safeTargetId) === String(state.selectedReceiptId));

    const isMultiDev = Array.isArray(r.devices) && r.devices.length > 1;
    const deviceHtml = isMultiDev ? `
      <div>
        <div style="display:flex;align-items:center;gap:4px;">
          <span class="badge" style="background:#e0e7ff;color:#3730a3;font-size:10px;font-weight:800;padding:1px 5px;border-radius:4px;">${r.devices.length} أجهزة</span>
          <b style="font-size:12px;color:var(--ink);">${escapeHtml(r.devices[0].category || 'جهاز')} ${escapeHtml(r.devices[0].brand === 'أخرى' ? r.devices[0].brandOther : (r.devices[0].brand || ''))}</b>
        </div>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">
          + ${r.devices.slice(1).map(d => escapeHtml((d.category || 'جهاز') + ' ' + (d.brand === 'أخرى' ? d.brandOther : (d.brand || '')) + ' ' + (d.model || ''))).join('، ')}
        </div>
      </div>
    ` : `
      <div>${dCat} - ${dBrand} <span style="color:var(--ink-secondary);">${dModel}</span></div>
    `;

    return `<tr class="selectable-row ${isSelected ? 'selected-row' : ''}" data-receipt-id="${safeTargetId}" data-receipt-num="${rNum}" onclick="handleReceiptRowClick('${safeTargetId}', '${rNum}', event)" style="${isOverdue?'background:rgba(245,158,11,0.08);':''}">
      <td style="text-align:center;" onclick="event.stopPropagation();">
        <input type="checkbox" class="receipt-select-cb" value="${safeTargetId}" ${isChecked ? 'checked' : ''} onchange="window.toggleReceiptMultiSelection('${safeTargetId}', this.checked, event)" style="cursor:pointer;width:16px;height:16px;" />
      </td>
      <td>
        <div style="display:flex;align-items:center;gap:4px;">
          ${isSelected ? '<span class="selected-badge-indicator" title="إيصال محدد">✓</span>' : ''}
          <span class="mono" style="font-weight:800;font-size:13px;color:var(--primary);direction:ltr;unicode-bidi:isolate;display:inline-block;">${rNum}</span>
        </div>
        ${r.previousReceiptNumber ? `<div style="font-size:10px;color:#b45309;font-weight:700;margin-top:1px;direction:ltr;unicode-bidi:isolate;">🔄 صيانة راجعة (#${escapeHtml(r.previousReceiptNumber)})</div>` : ''}
        <div style="color:var(--ink-secondary);font-size:11px;display:flex;align-items:center;gap:4px;margin-top:2px;">
          <span>📅 ${cleanDate(r.date)}</span>
          ${(formatReceiptTime(r) || r.time) ? `<span class="mono" style="color:var(--primary);font-size:10px;font-weight:600;direction:ltr;unicode-bidi:isolate;">⏰ ${formatReceiptTime(r) || r.time}</span>` : ''}
        </div>
      </td>
      <td>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          ${cTitle ? `<span class="badge" style="background:var(--paper2);color:var(--primary);font-size:10.5px;font-weight:700;border:1px solid var(--line);padding:1px 6px;border-radius:4px;white-space:nowrap;">${escapeHtml(cTitle)}</span>` : ''}
          <b style="font-size:13px;color:var(--ink);">${escapeHtml(cName)}</b>
        </div>
        ${cPhone && cPhone !== '0000000000' ? `
          <div style="color:var(--ink-secondary);font-size:11.5px;display:flex;align-items:center;gap:4px;margin-top:2px;" class="mono">
            <span>${escapeHtml(cPhone)}</span>
            <a href="https://wa.me/${normalizePhoneForWa(cPhone)}" target="_blank" style="color:#22c55e;text-decoration:none;font-size:12px;" title="محادثة واتساب">💬</a>
          </div>
        ` : `
          <div style="color:var(--amber-text);font-size:10.5px;font-weight:700;cursor:pointer;margin-top:2px;" onclick="openQuickAddPhoneModal('${escapeHtml(cName)}', '${escapeHtml(cTitle)}', '${safeTargetId}', '${rNum}'); event.stopPropagation();">⚠️ هاتف غير مسجل (اضغط للإضافة)</div>
        `}
      </td>
      <td>${deviceHtml}</td>
      <td>${r.technician ? `<span style="font-weight:600;">${escapeHtml(r.technician)}</span>` : '<span style="color:var(--slate-400);">-</span>'}</td>
      <td>
        <button class="btn-status-quick" onclick="openQuickStatusModalDirect('${safeTargetId}', '${rNum}'); event.stopPropagation();" title="اضغط لتغيير حالة الجهاز فورًا">
          <span class="status-badge ${st.cls}">${st.icon} ${escapeHtml(r.status)}</span>
          <span style="font-size:9.5px;color:var(--slate-400);">⚡</span>
        </button>
      </td>
      <td class="mono" style="font-weight:700;color:var(--ink);">
        ${totalDue.toLocaleString()} ج.م
        ${otherAmt>0 ? `<div style="font-size:9.5px;color:var(--amber-text);font-weight:700;">(+${otherAmt} إضافي)</div>` : ''}
      </td>
      <td class="mono" style="font-weight:700;color:var(--green);">
        ${deposit.toLocaleString()} ج.م
      </td>
      <td class="mono" style="font-weight:800;${remaining>0?'color:var(--red);':'color:var(--green);'}">
        ${remaining.toLocaleString()} ج.م
      </td>
      <td class="row-actions" onclick="event.stopPropagation()">
        <button class="btn btn-xs btn-primary font-bold" onclick="openReceiptActionSheet('${safeTargetId}', '${rNum}'); event.stopPropagation();" title="عرض خيارات وإجراءات الإيصال الموحدة">
          ⚡ خيارات الإيصال
        </button>
        <button class="btn btn-xs btn-status-quick" style="background:var(--green-bg);color:var(--green-text);" onclick="openQuickStatusModalDirect('${safeTargetId}', '${rNum}'); event.stopPropagation();" title="تغيير سريع لحالة الجهاز">
          ⚡ الحالة
        </button>
        <button class="btn btn-xs btn-whatsapp" onclick="openWhatsappDirect('${safeTargetId}', '${rNum}'); event.stopPropagation();" title="محادثة واتساب">
          ${WA_ICON}
        </button>
      </td>
    </tr>`;
  }).join('')}
  </tbody></table></div>`;
}

function archiveCards(list){
  const selIds = state.selectedReceiptIds || [];
  return `<div class="smart-cards-grid">
  ${list.map(rawR=>{
    const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
    if(!r) return '';
    const st = STATUSES.find(s=>s.v===r.status) || STATUSES[0];
    const otherAmt = Number(r.otherAccountAmount || 0);
    const totalDue = Number(r.cost||0) + Number(r.partsCost||0) + otherAmt;
    const deposit = Number(r.deposit||0);
    const remaining = Math.max(0, totalDue - deposit + Number(r.refunded||0));
    const isOverdue = r.status==='مكتمل' && (Date.now()-new Date(r.updatedAt||r.date).getTime())/86400000 > 7;
    const cTitle = extractCustomerTitle(r);
    const cName = extractCustomerName(r) || 'عميل';
    const cPhone = extractCustomerPhone(r);
    const dCat = escapeHtml((r.device && r.device.category) || 'جهاز');
    const dBrand = escapeHtml(r.device ? (r.device.brand==='أخرى' ? r.device.brandOther : r.device.brand) : '');
    const dModel = escapeHtml((r.device && r.device.model) || '');
    const rId = escapeHtml(String(r.id != null ? r.id : (r.ID != null ? r.ID : '')));
    const rNum = escapeHtml(String(r.receiptNumber || r.ReceiptNumber || ''));
    const safeTargetId = rId || rNum;
    const isChecked = selIds.includes(String(safeTargetId));
    const isSelected = isChecked || (String(safeTargetId) === String(state.selectedReceiptId));

    const isMultiDev = Array.isArray(r.devices) && r.devices.length > 1;

    return `<div class="smart-receipt-card ${isSelected ? 'selected-card' : ''}" data-receipt-id="${safeTargetId}" data-receipt-num="${rNum}" onclick="handleReceiptCardClick('${safeTargetId}', '${rNum}', event)" style="${isOverdue?'border-right: 4px solid var(--amber);background:rgba(245,158,11,0.03);':''}">
      <div>
        <div class="smart-card-header">
          <div style="display:flex;align-items:flex-start;gap:8px;">
            <input type="checkbox" class="receipt-select-cb" value="${safeTargetId}" ${isChecked ? 'checked' : ''} onclick="event.stopPropagation();" onchange="window.toggleReceiptMultiSelection('${safeTargetId}', this.checked, event)" style="cursor:pointer;width:18px;height:18px;margin-top:2px;" />
            <div>
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                ${isSelected ? '<span class="selected-badge-indicator">✓ محدد</span>' : ''}
                <span class="badge" style="background:var(--paper2);color:var(--primary);font-size:11.5px;font-weight:800;border:1px solid var(--line);padding:2px 8px;border-radius:4px;">
                  إيصال <span class="mono" style="direction:ltr;unicode-bidi:isolate;display:inline-block;font-size:12.5px;">${rNum}</span>
                </span>
                ${isMultiDev ? `<span class="badge" style="background:#e0e7ff;color:#3730a3;font-size:10px;font-weight:800;">${r.devices.length} أجهزة</span>` : ''}
                ${r.previousReceiptNumber ? `<span class="badge" style="background:#fef3c7;color:#b45309;font-size:10px;font-weight:700;">🔄 صيانة راجعة (<span class="mono" style="direction:ltr;unicode-bidi:isolate;display:inline-block;">${escapeHtml(r.previousReceiptNumber)}</span>)</span>` : ''}
              </div>
              <div style="color:var(--ink-secondary);font-size:11px;display:flex;align-items:center;gap:6px;margin-top:3px;">
                <span>📅 ${cleanDate(r.date)}</span>
                ${(formatReceiptTime(r) || r.time) ? `<span class="mono" style="color:var(--primary);font-size:10.5px;font-weight:600;">⏰ ${formatReceiptTime(r) || r.time}</span>` : ''}
              </div>
            </div>
          </div>
          <button class="btn-status-quick" onclick="openQuickStatusModalDirect('${safeTargetId}', '${rNum}'); event.stopPropagation();" title="اضغط لتغيير حالة الجهاز فوراً" style="margin:0;">
            <span class="status-badge ${st.cls}">${st.icon} ${escapeHtml(r.status)}</span>
            <span style="font-size:9.5px;color:var(--slate-400);">⚡</span>
          </button>
        </div>

        <div style="margin-top:10px;">
          ${isMultiDev ? `
            <div class="smart-card-device">
              📱 <b>${escapeHtml(r.devices[0].category || 'جهاز')} ${escapeHtml(r.devices[0].brand === 'أخرى' ? r.devices[0].brandOther : (r.devices[0].brand || ''))}</b> <span style="color:var(--ink-secondary);font-weight:500;">${escapeHtml(r.devices[0].model || '')}</span>
              <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">
                + ${r.devices.slice(1).map(d => escapeHtml((d.category || 'جهاز') + ' ' + (d.brand === 'أخرى' ? d.brandOther : (d.brand || '')) + ' ' + (d.model || ''))).join('، ')}
              </div>
            </div>
          ` : `
            <div class="smart-card-device">📱 ${dCat} - ${dBrand} <span style="color:var(--ink-secondary);font-weight:500;">${dModel}</span></div>
          `}
          <div class="smart-card-customer">
            ${cTitle ? `<span class="badge" style="background:var(--paper2);color:var(--primary);font-size:10px;font-weight:700;border:1px solid var(--line);padding:1px 5px;border-radius:4px;">${escapeHtml(cTitle)}</span>` : ''}
            <b style="color:var(--ink);">${escapeHtml(cName)}</b>
            ${cPhone && cPhone !== '0000000000' ? `
              <span class="mono" style="color:var(--ink-secondary);font-size:11.5px;display:inline-flex;align-items:center;gap:3px;margin-right:auto;">
                <span>${escapeHtml(cPhone)}</span>
                <a href="https://wa.me/${normalizePhoneForWa(cPhone)}" target="_blank" style="color:#22c55e;text-decoration:none;font-size:13px;" title="واتساب">💬</a>
              </span>
            ` : `
              <span style="color:var(--amber-text);font-size:10.5px;font-weight:700;cursor:pointer;margin-right:auto;" onclick="openQuickAddPhoneModal('${escapeHtml(cName)}', '${escapeHtml(cTitle)}', '${safeTargetId}', '${rNum}'); event.stopPropagation();">⚠️ هاتف غير مسجل</span>
            `}
          </div>
          <div style="font-size:11px;color:var(--ink-secondary);margin-top:5px;display:flex;align-items:center;gap:4px;">
            <span>👨‍🔧 الفني المسؤول:</span>
            <b>${r.technician ? escapeHtml(r.technician) : '<span style="color:var(--slate-400);font-weight:normal;">غير محدد</span>'}</b>
          </div>
        </div>
      </div>

      <div>
        <div class="smart-card-finance-bar">
          <div class="smart-card-finance-item">
            <span class="lbl">التكلفة الإجمالية</span>
            <span class="val mono" style="color:var(--ink);">${totalDue.toLocaleString()} <small style="font-size:9.5px;">ج.م</small></span>
          </div>
          <div class="smart-card-finance-item" style="border-right:1px solid var(--line);border-left:1px solid var(--line);">
            <span class="lbl">المدفوع / المسدد</span>
            <span class="val mono" style="color:var(--green);">${deposit.toLocaleString()} <small style="font-size:9.5px;">ج.م</small></span>
          </div>
          <div class="smart-card-finance-item">
            <span class="lbl">المتبقي</span>
            <span class="val mono" style="${remaining>0?'color:var(--red);':'color:var(--green);'}">${remaining.toLocaleString()} <small style="font-size:9.5px;">ج.م</small></span>
          </div>
        </div>

        <div class="smart-card-actions" onclick="event.stopPropagation()">
          <button class="btn btn-xs btn-primary font-bold" onclick="openReceiptActionSheet('${safeTargetId}', '${rNum}'); event.stopPropagation();" style="flex:2;" title="فتح لوحة الإجراءات الموحدة للوصل">
            ⚡ خيارات وإجراءات الإيصال
          </button>
          <button class="btn btn-xs btn-status-quick" style="background:var(--green-bg);color:var(--green-text);flex:1;" onclick="openQuickStatusModalDirect('${safeTargetId}', '${rNum}'); event.stopPropagation();" title="تغيير سريع للحالة">
            ⚡ الحالة
          </button>
          <button class="btn btn-xs btn-whatsapp" onclick="openWhatsappDirect('${safeTargetId}', '${rNum}'); event.stopPropagation();" style="flex:1;" title="محادثة واتساب">
            ${WA_ICON} واتساب
          </button>
        </div>
      </div>
    </div>`;
  }).join('')}
  </div>`;
}

function renderMaintenanceView(list){
  const mode = state.maintenanceViewMode || 'table';
  return mode === 'cards' ? archiveCards(list) : archiveTable(list);
}

function renderArchive(main){
  const f = state.archiveFilter;
  if(!f.group) f.group = 'all';
  let list = [...state.receipts];

  if(f.group==='overdue'){
    list = list.filter(r=>r.status==='مكتمل' && (Date.now()-new Date(r.updatedAt||r.date).getTime())/86400000 > 7);
  } else {
    const groupStatuses = STATUS_GROUPS[f.group].statuses;
    if(groupStatuses) list = list.filter(r=>groupStatuses.includes(r.status));
  }

  if(f.q) {
    const qTerm = f.q.trim().toLowerCase();
    list = list.filter(r => {
      const rNum = String(r.receiptNumber||'').toLowerCase();
      const rName = extractCustomerName(r).toLowerCase();
      const rTitle = extractCustomerTitle(r).toLowerCase();
      const rPhone = extractCustomerPhone(r);
      const rModel = String(r.device && r.device.model ? r.device.model : '').toLowerCase();
      return rNum.includes(qTerm) || rName.includes(qTerm) || rTitle.includes(qTerm) || rPhone.includes(qTerm) || rModel.includes(qTerm);
    });
  }
  if(f.status) list = list.filter(r=>r.status===f.status);
  if(f.tech) list = list.filter(r=>r.technician===f.tech);

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">📁 أرشيف إيصالات الصيانة</h2>
        <div class="subtitle mono" style="font-size:12px;color:var(--ink-secondary);">${list.length} إيصال مطابق</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <div class="view-mode-toggle" style="margin-left:4px;">
          <button type="button" class="view-mode-btn ${state.maintenanceViewMode!=='cards'?'active':''}" id="archViewTableBtn" title="عرض جدول">📋 جدول</button>
          <button type="button" class="view-mode-btn ${state.maintenanceViewMode==='cards'?'active':''}" id="archViewCardsBtn" title="عرض بطاقات ذكية">🗂️ بطاقات ذكية</button>
        </div>
        <button class="btn btn-ghost btn-sm" id="archRecoverPhonesBtn" style="color:var(--primary);font-weight:800;" title="فحص كافة السجلات واسترداد أرقام الهواتف التائهة">🔄 استرداد الهواتف</button>
        <button class="btn btn-ghost btn-sm" id="archGotoCustBtn">👥 دليل العملاء</button>
        <button class="btn btn-ghost btn-sm" id="exportArchiveExcelBtn">📥 تصدير Excel</button>
        <button class="btn btn-primary btn-sm" id="archNewReceiptBtn">➕ إيصال جديد</button>
      </div>
    </div>

    <div class="chip-group" id="groupTabs" style="margin-bottom:12px;">
      ${Object.entries(STATUS_GROUPS).map(([k,g])=>`<div class="chip ${f.group===k?'sel':''}" data-g="${k}">${g.label}</div>`).join('')}
    </div>

    <div class="filters-bar">
      <input id="fq" placeholder="🔍 بحث برقم الإيصال / اسم العميل / الهاتف / الموديل" value="${f.q}" style="flex:1;">
      <select id="fstatus"><option value="">كل الحالات</option>${STATUSES.map(s=>`<option ${f.status===s.v?'selected':''}>${s.icon} ${s.v}</option>`).join('')}</select>
      <select id="ftech"><option value="">كل الفنيين</option>${state.technicians.map(t=>`<option ${f.tech===t?'selected':''}>${t}</option>`).join('')}</select>
      ${(f.q||f.status||f.tech||f.group!=='all') ? `<button class="btn btn-ghost btn-sm" id="clearFiltersBtn">مسح الفلاتر</button>` : ''}
    </div>

    <div id="unifiedSelectionTopSlot"></div>

    ${list.length===0 ? '<div class="empty">لا توجد نتائج مطابقة لخيارات البحث.</div>' : renderMaintenanceView(list.slice().reverse())}
  `;

  const btnTable = document.getElementById('archViewTableBtn');
  const btnCards = document.getElementById('archViewCardsBtn');
  if(btnTable) btnTable.onclick = ()=>{
    state.maintenanceViewMode = 'table';
    try{ localStorage.setItem('microerp_maint_view_mode', 'table'); }catch(e){}
    renderArchive(main);
  };
  if(btnCards) btnCards.onclick = ()=>{
    state.maintenanceViewMode = 'cards';
    try{ localStorage.setItem('microerp_maint_view_mode', 'cards'); }catch(e){}
    renderArchive(main);
  };

  document.getElementById('archNewReceiptBtn').onclick = ()=>{ state.tab='new'; startNewDraft(); };
  document.getElementById('exportArchiveExcelBtn').onclick = ()=>exportReceiptsToExcel(list);
  document.getElementById('archRecoverPhonesBtn').onclick = ()=>{
    recoverAndSyncAllCustomerPhones(true);
    renderArchive(main);
  };
  document.getElementById('archGotoCustBtn').onclick = ()=>{
    state.tab = 'customers';
    renderMain();
  };
  document.querySelectorAll('#groupTabs .chip').forEach(c=>{ c.onclick = ()=>{ f.group = c.dataset.g; renderMain(); }; });
  document.getElementById('fq').oninput = e=>{ f.q=e.target.value; renderMain(); };
  document.getElementById('fstatus').onchange = e=>{ f.status=e.target.value.replace(/^[^\s]+\s/, ''); renderMain(); };
  document.getElementById('ftech').onchange = e=>{ f.tech=e.target.value; renderMain(); };
  const clearBtn = document.getElementById('clearFiltersBtn');
  if(clearBtn) clearBtn.onclick = ()=>{ f.q=''; f.status=''; f.tech=''; f.group='all'; renderMain(); };

  attachRowActions(main);
  if(typeof window.renderUnifiedSelectionBar === 'function'){
    window.renderUnifiedSelectionBar();
  }
}

/* ---------------- Spotlight Search Normalization & Matching ---------------- */
function normalizeSearchText(str){
  if(!str) return '';
  return String(str)
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove tashkeel
    .replace(/[أإآء]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[\u0660-\u0669]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48))
    .replace(/[\u06F0-\u06F9]/g, d => String.fromCharCode(d.charCodeAt(0) - 0x06F0 + 48))
    .toLowerCase()
    .trim();
}

function highlightSpotlightMatch(originalText, query){
  if(!originalText) return '';
  if(!query || !query.trim()) return escapeHtml(originalText);
  const qClean = normalizeSearchText(query);
  if(!qClean) return escapeHtml(originalText);

  const tokens = qClean.split(/\s+/).filter(Boolean);
  if(!tokens.length) return escapeHtml(originalText);

  try {
    const pattern = tokens.map(tok => {
      let p = '';
      for(const ch of tok){
        if(ch === 'ا') p += '[اأإآء]';
        else if(ch === 'ه') p += '[هة]';
        else if(ch === 'ي') p += '[ييى]';
        else p += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
      return p;
    }).join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');
    return escapeHtml(originalText).replace(regex, '<mark class="spotlight-mark" style="background:#fef08a;color:#854d0e;padding:0 2px;border-radius:2px;font-weight:900;">$1</mark>');
  } catch(e) {
    return escapeHtml(originalText);
  }
}

function filterCustomersSpotlight(allCusts, searchStr){
  if(!searchStr || !searchStr.trim()) return allCusts;
  const qClean = normalizeSearchText(searchStr);
  const tokens = qClean.split(/\s+/).filter(Boolean);

  const scored = [];

  allCusts.forEach(c => {
    const cName = extractCustomerName(c) || '';
    const cPhone = extractCustomerPhone(c) || '';
    const cNotes = c.notes || c.Notes || c.email || c.address || '';
    
    const clientReceipts = (state.receipts||[]).filter(r => {
      const rName = extractCustomerName(r);
      const rPhone = extractCustomerPhone(r);
      return (rName && rName.toLowerCase() === cName.toLowerCase()) || (cPhone && rPhone === cPhone);
    });

    const normName = normalizeSearchText(cName);
    const normPhone = normalizeSearchText(cPhone);
    const normNotes = normalizeSearchText(cNotes);

    const devStrings = clientReceipts.map(r => {
      const d = r.device || (r.devices && r.devices[0]) || {};
      return normalizeSearchText(`${d.category || ''} ${d.brand || ''} ${d.model || ''} ${r.receiptNumber || ''}`);
    }).join(' ');

    const fullTarget = `${normName} ${normPhone} ${normNotes} ${devStrings}`;

    // 1. All tokens match target
    const allTokensMatch = tokens.every(tok => fullTarget.includes(tok));

    // 2. Sequential letters match (Spotlight: "مح عل" matches "محمد علي")
    let seqMatch = false;
    if(qClean.length >= 2){
      let idx = 0;
      for(let i = 0; i < normName.length && idx < qClean.length; i++){
        if(normName[i] === qClean[idx] || (qClean[idx] === ' ' && normName[i] === ' ')) idx++;
      }
      if(idx === qClean.length) seqMatch = true;
    }

    if(!allTokensMatch && !seqMatch) return;

    let score = 10;
    if(normName === qClean) score += 100;
    else if(normName.startsWith(qClean)) score += 80;
    else if(normName.includes(qClean)) score += 60;
    else if(allTokensMatch) score += 50;
    if(seqMatch) score += 35;

    if(normPhone.startsWith(qClean)) score += 75;
    else if(normPhone.includes(qClean)) score += 45;

    scored.push({ customer: c, score });
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map(x => x.customer);
}
