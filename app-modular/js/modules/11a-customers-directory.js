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

/* ---------------- Customer Directory & Phone Management Hub ---------------- */
function renderCustomersPage(main){
  if(!state.custSearch) state.custSearch = '';

  // Auto reconcile
  recoverAndSyncAllCustomerPhones(false);

  const allCusts = state.customers || [];
  const withPhones = allCusts.filter(c => c.phone && c.phone.trim() !== '' && c.phone !== '0000000000');
  const missingPhones = allCusts.filter(c => !c.phone || c.phone.trim() === '' || c.phone === '0000000000');

  const filtered = filterCustomersSpotlight(allCusts, state.custSearch);

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("users", 20)} دليل وسجل هواتف العملاء</h2>
        <div class="subtitle mono" style="font-size:12px;color:var(--ink-secondary);">${allCusts.length} عميل مسجل ${state.custSearch ? `(مطابق للبحث: <b>${filtered.length}</b>)` : ''}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" id="custRecoverBtn" style="color:var(--primary);font-weight:800;">
          ${getSvgIcon("refresh", 14)} فحص واسترداد الأرقام المفقودة
        </button>
        <button class="btn btn-ghost btn-sm" id="exportCustsExcelBtn">${getSvgIcon("download", 14)} تصدير CSV (Excel)</button>
        <button class="btn btn-primary btn-sm" id="addNewCustModalBtn">${getSvgIcon("plus", 14)} إضافة عميل جديد</button>
      </div>
    </div>

    <!-- KPI Metric Cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;margin-bottom:14px;">
      <div class="card" style="padding:12px;margin:0;border-right:3.5px solid var(--primary);">
        <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">إجمالي العملاء</div>
        <div class="num mono font-bold" style="font-size:18px;margin-top:2px;">${allCusts.length}</div>
      </div>
      <div class="card" style="padding:12px;margin:0;border-right:3.5px solid var(--green);">
        <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">أرقام هواتف مسجلة ومؤكدة</div>
        <div class="num mono font-bold" style="font-size:18px;margin-top:2px;color:var(--green-text);">${withPhones.length}</div>
      </div>
      <div class="card" style="padding:12px;margin:0;border-right:3.5px solid ${missingPhones.length>0?'var(--amber)':'var(--line)'};">
        <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">عملاء بدون هاتف</div>
        <div class="num mono font-bold" style="font-size:18px;margin-top:2px;color:${missingPhones.length>0?'var(--amber-text)':'var(--ink)'};">${missingPhones.length}</div>
      </div>
    </div>

    <!-- Search Box (Spotlight Search Style) -->
    <div class="card" style="padding:12px;margin-bottom:14px;background:var(--paper2);border:1.5px solid var(--primary);">
      <div style="display:flex;gap:10px;align-items:center;">
        <span style="display:inline-flex;align-items:center;color:var(--ink-secondary);">${getSvgIcon("search", 16)}</span>
        <input id="custSearchInput" value="${escapeHtml(state.custSearch)}" placeholder="بحث فوري بنمط Spotlight (اكتب أجزاء من الاسم أو الحروف مثل: مح عل، أو رقم الهاتف، أو الجهاز)..." style="flex:1;font-weight:700;font-size:13.5px;" autofocus>
        ${state.custSearch ? `<button class="btn btn-ghost btn-sm" id="resetCustSearchBtn">مسح البحث</button>` : ''}
      </div>
      <div style="font-size:11px;color:var(--ink-secondary);margin-top:6px;display:flex;justify-content:space-between;">
        <span>يدعم البحث بالهمزة وبدونها (أ/إ/آ)، التاء والهاء (ة/ه)، وأجزاء الكلمات المتفرقة.</span>
        ${state.custSearch ? `<span class="mono" style="font-weight:800;color:var(--primary);">${filtered.length} نتيجة</span>` : ''}
      </div>
    </div>

    <div id="unifiedSelectionTopSlot"></div>

    <!-- Customers Table -->
    ${filtered.length === 0 ? '<div class="card empty" style="padding:30px;text-align:center;">لا يوجد عملاء مطابقين لبحث Spotlight.</div>' : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="text-align:right;width:28%;">اسم العميل</th>
              <th style="text-align:right;width:22%;">رقم الهاتف والاتصال</th>
              <th style="text-align:center;width:12%;">أجهزة الصيانة</th>
              <th style="text-align:center;width:16%;">الرصيد المالي</th>
              <th style="text-align:right;width:22%;">البريد / الملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(c => {
              const cTitle = extractCustomerTitle(c);
              const cName = extractCustomerName(c) || 'عميل';
              const cPhone = extractCustomerPhone(c);
              const clientReceipts = (state.receipts||[]).filter(r => {
                const rName = extractCustomerName(r);
                const rPhone = extractCustomerPhone(r);
                return (rName && rName.toLowerCase() === cName.toLowerCase()) || (cPhone && rPhone === cPhone);
              });
              const isSelectedCust = String(cName) === String(state.selectedCustomerId);
              const liveBal = typeof getCustomerLiveBalance === 'function' ? getCustomerLiveBalance(cName, cPhone) : 0;

              return `
                <tr class="selectable-row ${isSelectedCust ? 'selected-row' : ''}" data-cust-name="${escapeHtml(cName)}" data-cust-phone="${escapeHtml(cPhone||'')}" style="cursor:pointer;">
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                      ${isSelectedCust ? `<span class="selected-badge-indicator">${getSvgIcon('check', 11)}</span>` : ''}
                      ${cTitle ? `<span class="badge" style="background:var(--paper2);color:var(--primary);font-size:11px;font-weight:700;border:1px solid var(--line);padding:1px 6px;border-radius:4px;white-space:nowrap;">${escapeHtml(cTitle)}</span>` : ''}
                      <span style="font-weight:800;font-size:13.5px;color:var(--ink);">${highlightSpotlightMatch(cName, state.custSearch)}</span>
                    </div>
                  </td>
                  <td>
                    ${cPhone && cPhone !== '0000000000' ? `
                      <div style="display:inline-flex;align-items:center;gap:6px;">
                        <span class="mono font-bold" style="font-size:13px;direction:ltr;">${highlightSpotlightMatch(cPhone, state.custSearch)}</span>
                        <a href="tel:${cPhone}" class="btn btn-ghost btn-xs" style="padding:2px 6px;" title="اتصال هاتفي" onclick="event.stopPropagation();">${getSvgIcon("phone", 13)}</a>
                        <a href="https://wa.me/${normalizePhoneForWa(cPhone)}" target="_blank" class="btn btn-ghost btn-xs" style="padding:2px 6px;color:#22c55e;" title="محادثة واتساب" onclick="event.stopPropagation();">${getSvgIcon("message", 13)}</a>
                      </div>
                    ` : `
                      <button class="btn btn-ghost btn-xs edit-cust-quick-phone-btn" data-cust-name="${escapeHtml(cName)}" data-cust-title="${escapeHtml(cTitle||'')}" style="color:var(--amber-text);border-color:var(--amber);font-weight:700;" title="إضافة رقم هاتف للعميل">
                        ${getSvgIcon("alert", 12)} إضافة رقم الهاتف
                      </button>
                    `}
                  </td>
                  <td style="text-align:center;">
                    ${clientReceipts.length > 0 ? `
                      <button class="btn btn-ghost btn-xs view-cust-receipts-btn" data-cust-name="${escapeHtml(cName)}" style="font-weight:800;color:var(--primary);" title="استعراض أجهزة العميل بالأرشيف">
                        ${getSvgIcon("maintenance", 12)} ${clientReceipts.length} جهاز
                      </button>
                    ` : `<span style="color:var(--ink-secondary);font-size:11px;">-</span>`}
                  </td>
                  <td style="text-align:center;">
                    ${liveBal > 0 ? `
                      <span class="badge" style="background:#fee2e2;color:#991b1b;font-weight:800;font-size:11px;" title="مستحق على العميل (مدين)">مدين: ${liveBal.toLocaleString()} ج.م</span>
                    ` : liveBal < 0 ? `
                      <span class="badge" style="background:#dcfce7;color:#166534;font-weight:800;font-size:11px;" title="رصيد لصالح العميل (دائن)">دائن: ${Math.abs(liveBal).toLocaleString()} ج.م</span>
                    ` : `
                      <span class="badge" style="background:var(--paper2);color:var(--ink-secondary);font-size:11px;">خالص (0)</span>
                    `}
                  </td>
                  <td style="font-size:11.5px;color:var(--ink-secondary);">
                    ${highlightSpotlightMatch(c.email || c.address || '-', state.custSearch)}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;

  // Attach search events with seamless cursor & focus preservation
  const sInput = document.getElementById('custSearchInput');
  if(sInput){
    sInput.oninput = (e)=>{
      state.custSearch = e.target.value;
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      renderCustomersPage(main);
      const reInput = document.getElementById('custSearchInput');
      if(reInput){
        reInput.focus();
        try { reInput.setSelectionRange(start, end); } catch(err){}
      }
    };
  }
  const resetBtn = document.getElementById('resetCustSearchBtn');
  if(resetBtn){
    resetBtn.onclick = ()=>{
      state.custSearch = '';
      renderCustomersPage(main);
      const reInput = document.getElementById('custSearchInput');
      if(reInput) reInput.focus();
    };
  }

  // Deep Recovery Button
  document.getElementById('custRecoverBtn').onclick = ()=>{
    recoverAndSyncAllCustomerPhones(true);
    renderCustomersPage(main);
  };

  // Add New Customer Modal Button
  document.getElementById('addNewCustModalBtn').onclick = ()=>openEditCustomerModal(null);

  // Export Excel
  document.getElementById('exportCustsExcelBtn').onclick = ()=>exportCustomersToExcel(allCusts);

  // Bound event handlers for customer rows and action buttons
  main.querySelectorAll('tr.selectable-row').forEach(tr => {
    tr.onclick = (e) => {
      handleCustomerRowClick(tr.dataset.custName, tr.dataset.custPhone, e);
    };
  });
  main.querySelectorAll('.edit-cust-quick-phone-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      openQuickAddPhoneModal(btn.dataset.custName, btn.dataset.custTitle);
    };
  });
  main.querySelectorAll('.view-cust-receipts-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      viewCustomerReceiptsInArchive(btn.dataset.custName);
    };
  });

  if(typeof window.renderUnifiedSelectionBar === 'function'){
    window.renderUnifiedSelectionBar();
  }
}

function openQuickAddPhoneModal(customerName, customerTitle='', targetReceiptId='', targetReceiptNum=''){
  let existing = null;
  if(typeof findCustomerInDirectory === 'function'){
    existing = findCustomerInDirectory(customerName);
  }
  if(!existing && typeof state !== 'undefined' && Array.isArray(state.customers)){
    const cleanNorm = typeof normalizeCustomerSearchName === 'function' ? normalizeCustomerSearchName(customerName) : (customerName||'').trim().toLowerCase();
    existing = state.customers.find(c => {
      const cn = (c.name || '').trim().toLowerCase();
      if(cn === (customerName || '').trim().toLowerCase()) return true;
      if(typeof normalizeCustomerSearchName === 'function' && normalizeCustomerSearchName(cn) === cleanNorm) return true;
      return false;
    });
  }

  let targetReceipt = null;
  if(typeof state !== 'undefined' && Array.isArray(state.receipts) && (targetReceiptId || targetReceiptNum)){
    targetReceipt = state.receipts.find(r =>
      (targetReceiptId && (r.id === targetReceiptId || r.ID === targetReceiptId)) ||
      (targetReceiptNum && (r.receiptNumber === targetReceiptNum || r.ReceiptNumber === targetReceiptNum))
    );
  }

  const initialTitle = (existing && existing.title) || customerTitle || (targetReceipt ? extractCustomerTitle(targetReceipt) : '');
  const initialName = (existing && existing.name) || customerName || (targetReceipt ? extractCustomerName(targetReceipt) : '');
  const initialPhone = (existing && existing.phone) || (targetReceipt ? extractCustomerPhone(targetReceipt) : '');
  const initialEmail = (existing && existing.email) || (targetReceipt ? extractCustomerEmail(targetReceipt) : '');

  openEditCustomerModal({
    title: initialTitle,
    name: initialName,
    phone: initialPhone,
    email: initialEmail
  }, targetReceiptId, targetReceiptNum);
}

function openEditCustomerModal(c, targetReceiptId='', targetReceiptNum=''){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const isEdit = !!(c && c.name);
  const curTitle = (c && (c.title || c.Title)) || '';
  const titleOptions = [''].concat(CUSTOMER_TITLES).map(t=>`<option value="${escapeHtml(t)}" ${curTitle===t?'selected':''}>${t ? escapeHtml(t) : '-- بدون لقب --'}</option>`).join('');

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:480px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
        <h3 style="margin:0;font-size:16px;font-weight:900;">${isEdit ? 'تعديل بيانات العميل وربط الإيصالات' : 'إضافة عميل جديد'}</h3>
        <button class="btn btn-ghost btn-xs" id="closeCustModalBtn">&times;</button>
      </div>
      <div style="display:grid;grid-template-columns:140px 1fr;gap:10px;">
        <div class="field">
          <label>اللقب (اختياري)</label>
          <select id="editCustTitle">
            ${titleOptions}
          </select>
        </div>
        <div class="field"><label>اسم العميل / الشركة *</label><input id="editCustName" value="${escapeHtml(c ? c.name : '')}" placeholder="الاسم ثلاثي"></div>
      </div>
      <div class="field"><label>رقم الهاتف *</label><input id="editCustPhone" value="${escapeHtml(c ? c.phone : '')}" placeholder="01xxxxxxxxx" class="mono"></div>
      <div class="field"><label>البريد الإلكتروني (اختياري)</label><input id="editCustEmail" value="${escapeHtml(c ? c.email : '')}" placeholder="example@mail.com"></div>
      <div style="display:flex;justify-content:space-between;margin-top:14px;">
        <button class="btn btn-ghost" id="cancelCustModalBtn">إلغاء</button>
        <button class="btn btn-primary" id="saveCustModalBtn">${getSvgIcon("check", 14)} حفظ ومزامنة البيانات</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('closeCustModalBtn').onclick = ()=>overlay.remove();
  document.getElementById('cancelCustModalBtn').onclick = ()=>overlay.remove();

  document.getElementById('saveCustModalBtn').onclick = async ()=>{
    const title = document.getElementById('editCustTitle').value.trim();
    const name = document.getElementById('editCustName').value.trim();
    const phone = document.getElementById('editCustPhone').value.trim();
    const email = document.getElementById('editCustEmail').value.trim();

    if(!name){ showToast('يرجى إدخال اسم العميل', 'error'); return; }

    const oldName = c ? (c.name || '').trim() : null;
    const oldPhone = c ? (c.phone || '').trim() : '';
    const saveBtn = document.getElementById('saveCustModalBtn');
    if(saveBtn){ saveBtn.disabled = true; saveBtn.textContent = 'جارٍ الحفظ والمزامنة...'; }

    // 1. Save customer to directory (remotely and locally)
    await saveCustomerRemote({ title, name, phone, email }, oldName);

    // 2. Identify and update all receipts that belong to this customer
    const updatedReceipts = [];
    const nameNorm = typeof normalizeCustomerSearchName === 'function' ? normalizeCustomerSearchName(name) : name.toLowerCase();
    const oldNameNorm = (oldName && typeof normalizeCustomerSearchName === 'function') ? normalizeCustomerSearchName(oldName) : (oldName ? oldName.toLowerCase() : '');

    (state.receipts || []).forEach(r => {
      const rName = extractCustomerName(r);
      const rPhone = extractCustomerPhone(r);
      const rNameNorm = typeof normalizeCustomerSearchName === 'function' ? normalizeCustomerSearchName(rName) : (rName||'').toLowerCase();

      // Check if target receipt explicitly matches
      const isTargetReceipt = (targetReceiptId && (r.id === targetReceiptId || r.ID === targetReceiptId)) ||
                              (targetReceiptNum && (r.receiptNumber === targetReceiptNum || r.ReceiptNumber === targetReceiptNum));

      // Check name match: raw or normalized (including phonetic twins like مضطفي/مصطفي)
      const nameMatch = rName && (
        rName.toLowerCase() === name.toLowerCase() ||
        (oldName && rName.toLowerCase() === oldName.toLowerCase()) ||
        rNameNorm === nameNorm ||
        (oldNameNorm && rNameNorm === oldNameNorm) ||
        (typeof getLevenshteinDistance === 'function' && rNameNorm.length >= 4 && getLevenshteinDistance(rNameNorm, nameNorm) <= 1)
      );

      const phoneMatch = !oldPhone || !rPhone || rPhone === oldPhone || (phone && rPhone === phone);

      if(isTargetReceipt || (nameMatch && phoneMatch)){
        if(!r.customer) r.customer = { title, name, phone, email };
        else {
          r.customer.title = title;
          r.customer.name = name;
          r.customer.phone = phone;
          r.customer.email = email;
        }
        r.CustomerName = name;
        r.CustomerTitle = title;
        r.CustomerPhone = phone;
        r.CustomerEmail = email;
        if(!updatedReceipts.includes(r)) updatedReceipts.push(r);
      }
    });

    setCache('receipts', state.receipts);

    // 3. Update customers list in local state
    if (oldName) {
      const cust = (state.customers || []).find(c =>
        (c.name && c.name.toLowerCase() === oldName.toLowerCase()) ||
        (typeof normalizeCustomerSearchName === 'function' && normalizeCustomerSearchName(c.name) === oldNameNorm)
      );
      if (cust) {
        cust.title = title;
        cust.name = name;
        cust.phone = phone;
        cust.email = email;
      } else {
        state.customers.push({ title, name, phone, email });
      }
    } else {
      const existingInState = (state.customers || []).find(c =>
        (c.name && c.name.toLowerCase() === name.toLowerCase()) ||
        (typeof normalizeCustomerSearchName === 'function' && normalizeCustomerSearchName(c.name) === nameNorm)
      );
      if(existingInState){
        existingInState.title = title;
        existingInState.name = name;
        existingInState.phone = phone;
        existingInState.email = email;
      } else {
        state.customers.push({ title, name, phone, email });
      }
    }
    deduplicateCustomerDirectory();
    setCache('customers', state.customers);

    // 4. CRITICAL: Persist each updated receipt to Google Sheets!
    for(const ur of updatedReceipts){
      try {
        await saveReceiptRemote(ur);
      } catch(eReceipt){
        console.warn('Sync receipt to cloud warning:', eReceipt);
      }
    }

    showToast(`تم حفظ وتحديث بيانات (${name}) وتحديث ${updatedReceipts.length} إيصال بنجاح`, 'success');
    overlay.remove();

    // Re-render UI immediately
    renderMain();
  };
}

function exportCustomersToExcel(list){
  const headers = ['اللقب', 'اسم العميل', 'رقم الهاتف', 'البريد الإلكتروني'];
  const rows = (list || []).map(c => [c.title||'', c.name||'', c.phone||'', c.email||'']);
  downloadCSV(`customers_directory_${new Date().toISOString().slice(0,10)}.csv`, headers, rows);
}

function attachRowActions(root){
  if(!root) return;
  root.querySelectorAll('[data-act]').forEach(btn=>{
    btn.onclick = (e)=>{
      if(e) e.stopPropagation();
      const targetId = btn.dataset.id;
      const targetNum = btn.dataset.num;
      const act = btn.dataset.act;
      try{
        if(act==='reintake') openReIntakeModalDirect(targetId, targetNum);
        else if(act==='invoice') convertReceiptToInvoiceDirect(targetId, targetNum);
        else if(act==='view') openReceiptDetailModal(targetId, targetNum);
        else if(act==='wa') openWhatsappDirect(targetId, targetNum);
        else if(act==='print') openReceiptPrintDirect(targetId, targetNum, 'receipt');
        else if(act==='sticker') openStickerPrintDirect(targetId, targetNum, e);
        else if(act==='del') deleteReceiptDirect(targetId, targetNum);
      }catch(err){
        console.error('Error executing row action:', act, err);
        showToast('حدث خطأ أثناء فتح الإجراء: ' + (err.message || err), 'error');
      }
    };
  });

  root.querySelectorAll('[data-quickstatus]').forEach(btn=>{
    btn.onclick = (e)=>{
      if(e) e.stopPropagation();
      const targetId = btn.dataset.quickstatus || btn.dataset.id;
      const targetNum = btn.dataset.num;
      openQuickStatusModalDirect(targetId, targetNum);
    };
  });
}

/* ---------------- Smart Status & Payment Handshake Prompts ---------------- */
/**
 * نافذة تأكيد سداد المتبقي عند تغيير الحالة إلى "تم التسليم"
 */
function promptDeliveryRemainingPayment(r, remaining, onProceed){
  const pOverlay = document.createElement('div');
  pOverlay.className = 'modal-overlay';
  pOverlay.style.zIndex = '11500';
  let curMethod = 'cash';

  const custName = (r && r.customer && r.customer.name) || (r && r.customerName) || 'عميل';
  const devName = (r && r.device) ? `${r.device.category || ''} ${r.device.brand || ''}`.trim() : ((r && r.devices && r.devices[0]) ? `${r.devices[0].category || ''} ${r.devices[0].brand || ''}`.trim() : '');
  const rNum = (r && r.receiptNumber) ? `(إيصال #${escapeHtml(r.receiptNumber)})` : '';

  pOverlay.innerHTML = `
    <div class="modal-content" style="max-width:460px;text-align:center;padding:22px;border-top:4px solid var(--amber);">
      <div style="display:inline-flex;padding:12px;border-radius:50%;background:rgba(59,130,246,0.1);color:var(--primary);margin-bottom:8px;">${getSvgIcon("pos", 28)}</div>
      <h3 style="margin:0 0 6px;font-size:16.5px;color:var(--ink);">تسليم الجهاز للعميل ${rNum}</h3>
      <div style="font-size:12.5px;color:var(--ink-secondary);margin-bottom:12px;">العميل: <b>${escapeHtml(custName)}</b> ${devName ? '| الجهاز: ' + escapeHtml(devName) : ''}</div>
      
      <div style="background:var(--amber-bg);border:1.5px solid var(--amber);border-radius:var(--radius-sm);padding:12px;margin-bottom:14px;text-align:right;">
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:900;color:var(--amber-text);margin-bottom:4px;">
          <span>المبلغ المتبقي على الإيصال:</span>
          <span class="mono" style="font-size:16.5px;color:#b45309;">${Number(remaining).toLocaleString()} ج.م</span>
        </div>
        <div style="font-size:11.5px;color:var(--ink);line-height:1.45;">
          الجهاز عليه مبلغ غير مسدد. اختر طريقة تحصيل وسداد المبلغ المتبقي، أو اختر تسليم الجهاز فقط على الحساب (آجل):
        </div>
      </div>

      <!-- خيارات طريقة الدفع المتطابقة مع POS -->
      <div style="text-align:right;margin-bottom:14px;">
        <label style="font-size:11.5px;font-weight:800;color:var(--ink);display:flex;align-items:center;gap:5px;margin-bottom:6px;">${getSvgIcon("creditCard", 14)} طريقة التحصيل / السداد:</label>
        <div class="pos-pay-grid" id="delPromptPayGrid">
          ${getActivePaymentMethods().map(pm => `
            <div class="pos-pay-btn ${pm.id==='cash'?'selected':''}" data-delpm="${pm.id}">
              
              <span>${pm.name}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;">
        <button class="btn btn-green" id="promptBtnPayAndDeliver" style="justify-content:center;font-weight:800;padding:10px;">
          ${getSvgIcon("check", 14)} تحصيل نقدي (${Number(remaining).toLocaleString()} ج.م) وتسليم الجهاز
        </button>
        <button class="btn btn-ghost" id="promptBtnDeliverOnly" style="justify-content:center;font-weight:700;border-color:var(--line);">
          تسليم الجهاز فقط (تأجيل السداد / آجل)
        </button>
        <button class="btn btn-ghost btn-sm" id="promptBtnCancel" style="justify-content:center;color:var(--ink-secondary);margin-top:4px;">
          إلغاء التغيير
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(pOverlay);

  pOverlay.querySelectorAll('#delPromptPayGrid .pos-pay-btn').forEach(btn => {
    btn.onclick = () => {
      pOverlay.querySelectorAll('#delPromptPayGrid .pos-pay-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      curMethod = btn.dataset.delpm;
      const pmObj = getActivePaymentMethods().find(x=>x.id===curMethod) || {name:'نقدي'};
      if(curMethod === 'credit'){
        pOverlay.querySelector('#promptBtnPayAndDeliver').textContent = `تسليم الجهاز على الحساب (آجل)`;
      } else {
        pOverlay.querySelector('#promptBtnPayAndDeliver').textContent = `تحصيل ${pmObj.name} (${Number(remaining).toLocaleString()} ج.م) وتسليم الجهاز`;
      }
    };
  });

  let isHandshakeHandled = false;
  pOverlay.querySelector('#promptBtnPayAndDeliver').onclick = ()=>{
    if(isHandshakeHandled) return;
    isHandshakeHandled = true;
    const btn = pOverlay.querySelector('#promptBtnPayAndDeliver');
    if(btn){ btn.disabled = true; btn.textContent = 'جارٍ التحصيل والتسليم...'; }
    pOverlay.querySelectorAll('button').forEach(b => b.disabled = true);
    setTimeout(() => pOverlay.remove(), 100);
    const pmObj = getActivePaymentMethods().find(x=>x.id===curMethod) || {name:'نقدي (كاش)'};
    if(curMethod === 'credit'){
      onProceed(false, 'آجل / على الحساب');
    } else {
      onProceed(true, pmObj.name);
    }
  };
  pOverlay.querySelector('#promptBtnDeliverOnly').onclick = ()=>{
    if(isHandshakeHandled) return;
    isHandshakeHandled = true;
    pOverlay.querySelectorAll('button').forEach(b => b.disabled = true);
    setTimeout(() => pOverlay.remove(), 100);
    onProceed(false, 'آجل / على الحساب');
  };
  pOverlay.querySelector('#promptBtnCancel').onclick = ()=>{
    if(isHandshakeHandled) return;
    isHandshakeHandled = true;
    pOverlay.remove();
  };
}

/**
 * نافذة تأكيد سداد المبلغ المتبقي واختيار طريقة الدفع
 */
function promptPaymentDeliveryStatus(r, amt, onProceed){
  const pOverlay = document.createElement('div');
  pOverlay.className = 'modal-overlay';
  pOverlay.style.zIndex = '11500';
  let curMethod = 'cash';

  const custName = (r && r.customer && r.customer.name) || (r && r.customerName) || 'عميل';
  const rNum = (r && r.receiptNumber) ? `#${escapeHtml(r.receiptNumber)}` : '';

  pOverlay.innerHTML = `
    <div class="modal-content" style="max-width:460px;text-align:center;padding:22px;border-top:4px solid var(--green);">
      <div style="display:inline-flex;padding:12px;border-radius:50%;background:rgba(16,185,129,0.1);color:var(--green);margin-bottom:8px;">${getSvgIcon("dollar", 28)}</div>
      <h3 style="margin:0 0 6px;font-size:16.5px;color:var(--ink);">سداد المبلغ المتبقي (${Number(amt).toLocaleString()} ج.م)</h3>
      <div style="font-size:12.5px;color:var(--ink-secondary);margin-bottom:12px;">الإيصال: <b class="mono">${rNum}</b> | العميل: <b>${escapeHtml(custName)}</b></div>

      <div style="background:var(--green-bg);border:1.5px solid var(--green);border-radius:var(--radius-sm);padding:12px;margin-bottom:14px;text-align:right;">
        <div style="font-size:12.5px;font-weight:900;color:var(--green-text);margin-bottom:4px;">
          سيتم تسجيل إتمام سداد المبلغ كاملاً وإيداعه في الخزينة والحسابات.
        </div>
        <div style="font-size:12px;color:var(--ink);margin-top:4px;line-height:1.4;">
          اختر طريقة التحصيل وتحديد حالة الجهاز:
        </div>
      </div>

      <!-- خيارات طريقة الدفع -->
      <div style="text-align:right;margin-bottom:14px;">
        <label style="font-size:11.5px;font-weight:800;color:var(--ink);display:flex;align-items:center;gap:5px;margin-bottom:6px;">${getSvgIcon("creditCard", 14)} اختر طريقة التحصيل:</label>
        <div class="pos-pay-grid" id="statusPromptPayGrid">
          ${getActivePaymentMethods().filter(p=>p.id!=='credit').map(pm => `
            <div class="pos-pay-btn ${pm.id==='cash'?'selected':''}" data-statuspm="${pm.id}">
              
              <span>${pm.name}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;">
        <button class="btn btn-green" id="promptBtnDeliver" style="justify-content:center;font-weight:800;padding:10px;">
          ${getSvgIcon("check", 14)} نعم، سداد وتغيير الحالة إلى "تم التسليم"
        </button>
        <button class="btn btn-primary" id="promptBtnKeepStatus" style="justify-content:center;font-weight:700;padding:9px;">
          سداد المبلغ فقط دون تسليم (الاحتفاظ بالحالة)
        </button>
        <button class="btn btn-ghost btn-sm" id="promptBtnCancelPay" style="justify-content:center;color:var(--ink-secondary);margin-top:4px;">
          إلغاء
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(pOverlay);

  pOverlay.querySelectorAll('#statusPromptPayGrid .pos-pay-btn').forEach(btn => {
    btn.onclick = () => {
      pOverlay.querySelectorAll('#statusPromptPayGrid .pos-pay-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      curMethod = btn.dataset.statuspm;
    };
  });

  let isPayStatusHandled = false;
  pOverlay.querySelector('#promptBtnDeliver').onclick = ()=>{
    if(isPayStatusHandled) return;
    isPayStatusHandled = true;
    const btn = pOverlay.querySelector('#promptBtnDeliver');
    if(btn){ btn.disabled = true; btn.textContent = 'جارٍ تسجيل السداد والتسليم...'; }
    pOverlay.querySelectorAll('button').forEach(b => b.disabled = true);
    setTimeout(() => pOverlay.remove(), 100);
    const pmObj = getActivePaymentMethods().find(x=>x.id===curMethod) || {name:'نقدي (كاش)'};
    onProceed(true, pmObj.name); // true = تغيير الحالة لتم التسليم
  };
  pOverlay.querySelector('#promptBtnKeepStatus').onclick = ()=>{
    if(isPayStatusHandled) return;
    isPayStatusHandled = true;
    const btn = pOverlay.querySelector('#promptBtnKeepStatus');
    if(btn){ btn.disabled = true; btn.textContent = 'جارٍ تسجيل السداد...'; }
    pOverlay.querySelectorAll('button').forEach(b => b.disabled = true);
    setTimeout(() => pOverlay.remove(), 100);
    const pmObj = getActivePaymentMethods().find(x=>x.id===curMethod) || {name:'نقدي (كاش)'};
    onProceed(false, pmObj.name); // false = سداد فقط مع إبقاء الحالة
  };
  pOverlay.querySelector('#promptBtnCancelPay').onclick = ()=>{
    if(isPayStatusHandled) return;
    isPayStatusHandled = true;
    pOverlay.remove();
  };
}

/* ---------------- Customer Approval Modal ---------------- */
function openCustomerApprovalModal(rawR, onApproved, onCancelled){
  if(!rawR) return;
  const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'customerApprovalModalOverlay';
  overlay.style.zIndex = '10005';

  const cFullName = (typeof formatCustomerFullName === 'function') ? formatCustomerFullName(r) : ((r.customer && r.customer.name) || extractCustomerName(r) || 'العميل');
  const dCat = escapeHtml((r.device && r.device.category) || 'جهاز');
  const dBrand = escapeHtml(r.device ? (r.device.brand==='أخرى' ? r.device.brandOther : r.device.brand) : '');
  const dModel = escapeHtml((r.device && r.device.model) || '');
  const rNum = escapeHtml(String(r.receiptNumber || ''));

  const currentApproval = r.customerApproval || {};
  const defApprover = currentApproval.approverName || cFullName;
  const defChannel = currentApproval.channel || 'واتساب';
  const defCost = currentApproval.approvedCost != null ? Number(currentApproval.approvedCost) : ((typeof getReceiptTotalDue === 'function') ? getReceiptTotalDue(r) : (Number(r.cost||0) + Number(r.partsCost||0) + Number(r.otherAccountAmount||0)));
  const defNotes = currentApproval.notes || (r.faultNotes || '');

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:480px;padding:22px;border-radius:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
        <h3 style="margin:0;font-size:16px;display:flex;align-items:center;gap:7px;color:#047857;">
          <span>${getSvgIcon('check', 16)}</span> <span>توثيق واعتماد موافقة العميل على الصيانة</span>
        </h3>
        <button class="btn btn-ghost btn-xs" id="closeCustApprovalModal" style="font-size:16px;line-height:1;padding:4px 8px;">&times;</button>
      </div>

      <div style="background:var(--paper3);padding:10px 12px;border-radius:var(--radius-sm);margin-bottom:14px;font-size:12.5px;line-height:1.6;">
        <div><b>الإيصال:</b> <span class="mono" style="color:var(--primary);font-weight:700;">#${rNum}</span> | <b>العميل:</b> ${escapeHtml(cFullName)}</div>
        <div><b>الجهاز:</b> ${dCat} - ${dBrand} ${dModel}</div>
        <div style="margin-top:4px;color:#b45309;font-weight:700;font-size:11.5px;">
          ⚠️ يشترط توثيق موافقة العميل وقناة التواصل والتكلفة المتفق عليها قبل الانتقال لمرحلة "الصيانة".
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:16px;">
        <div class="field" style="margin-bottom:0;">
          <label style="font-weight:700;font-size:12px;">اسم صاحب الموافقة / المستلم:</label>
          <input type="text" id="custApprovalApprover" value="${escapeHtml(defApprover)}" placeholder="اسم العميل أو الشخص المعتمد" style="font-weight:700;">
        </div>

        <div class="grid2" style="gap:10px;">
          <div class="field" style="margin-bottom:0;">
            <label style="font-weight:700;font-size:12px;">قناة التواصل / الاعتماد:</label>
            <select id="custApprovalChannel" style="font-weight:700;">
              <option value="واتساب" ${defChannel==='واتساب'?'selected':''}>واتساب (محادثة موثقة)</option>
              <option value="مكالمة هاتفية" ${defChannel==='مكالمة هاتفية'?'selected':''}>مكالمة هاتفية مسجلة</option>
              <option value="حضور شخصي بالمركز" ${defChannel==='حضور شخصي بالمركز'?'selected':''}>حضور شخصي بالمركز</option>
              <option value="اعتماد مقايسة النظام (واتساب)" ${defChannel==='اعتماد مقايسة النظام (واتساب)'?'selected':''}>اعتماد مقايسة النظام (واتساب)</option>
              <option value="أخرى" ${defChannel==='أخرى'?'selected':''}>أخرى</option>
            </select>
          </div>
          <div class="field" style="margin-bottom:0;">
            <label style="font-weight:700;font-size:12px;">التكلفة المعتمدة (ج.م):</label>
            <input type="number" id="custApprovalCost" value="${defCost}" min="0" step="10" placeholder="0" style="font-weight:800;color:#047857;">
          </div>
        </div>

        <div class="field" style="margin-bottom:0;">
          <label style="font-weight:700;font-size:12px;">ملاحظات وشروط الموافقة:</label>
          <textarea id="custApprovalNotes" rows="2" placeholder="أي تفاصيل اتفق عليها مع العميل (نوع القطع، المهلة...)" style="font-size:12px;">${escapeHtml(defNotes)}</textarea>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);padding-top:12px;">
        <button class="btn btn-ghost btn-sm" id="cancelCustApprovalModal">إلغاء</button>
        <button class="btn btn-green btn-sm" id="confirmCustApprovalBtn" style="font-weight:800;padding:7px 16px;">
          ${getSvgIcon('check', 14)} تأكيد واعتماد الموافقة
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = ()=>{ overlay.remove(); };

  overlay.querySelector('#closeCustApprovalModal').onclick = ()=>{
    close();
    if(typeof onCancelled === 'function') onCancelled();
  };
  overlay.querySelector('#cancelCustApprovalModal').onclick = ()=>{
    close();
    if(typeof onCancelled === 'function') onCancelled();
  };

  overlay.querySelector('#confirmCustApprovalBtn').onclick = ()=>{
    const approverName = (overlay.querySelector('#custApprovalApprover').value || '').trim() || cFullName;
    const channel = overlay.querySelector('#custApprovalChannel').value;
    const approvedCost = Number(overlay.querySelector('#custApprovalCost').value || 0);
    const notes = (overlay.querySelector('#custApprovalNotes').value || '').trim();

    const approvalData = {
      approved: true,
      approverName,
      channel,
      approvedCost,
      approvedAt: new Date().toISOString(),
      recordedBy: (state.user && state.user.name) || 'نظام',
      notes
    };

    r.customerApproval = approvalData;
    if(approvedCost > 0 && Number(r.cost || 0) === 0 && Number(r.partsCost || 0) === 0){
      r.cost = approvedCost;
    }

    close();
    if(typeof onApproved === 'function') onApproved(approvalData);
  };
}

/* ---------------- Quick Status Changer Modal ---------------- */
function openQuickStatusModal(rawR){
  if(!rawR) return;
  const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const cName = escapeHtml(extractCustomerName(r) || 'عميل');
  const dCat = escapeHtml((r.device && r.device.category) || 'جهاز');
  const dBrand = escapeHtml(r.device ? (r.device.brand==='أخرى' ? r.device.brandOther : r.device.brand) : '');
  const dModel = escapeHtml((r.device && r.device.model) || '');
  const rNum = escapeHtml(String(r.receiptNumber || ''));

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:460px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
        <h3 style="margin:0;font-size:16px;">تغيير حالة الجهاز السريع</h3>
        <button class="btn btn-ghost btn-xs" id="closeStatusModal">إغلاق</button>
      </div>

      <div style="background:var(--paper3);padding:10px 12px;border-radius:var(--radius-sm);margin-bottom:14px;font-size:12.5px;line-height:1.6;">
        <div><b>الإيصال:</b> <span class="mono" style="color:var(--primary);font-weight:700;">${rNum}</span> | <b>العميل:</b> ${cName}</div>
        <div><b>الجهاز:</b> ${dCat} - ${dBrand} ${dModel}</div>
        <div><b>الحالة الحالية:</b> <span class="status-badge ${(STATUSES.find(s=>s.v===r.status)||{}).cls||'st-check'}">${escapeHtml(r.status)}</span></div>
      </div>

      <label style="margin-bottom:8px;font-size:12.5px;">اختر الحالة الجديدة للجهاز:</label>
      <div style="display:flex;flex-direction:column;gap:7px;margin-bottom:16px;">
        ${STATUSES.map(s=>`
          <button class="btn btn-ghost" data-setstatus="${s.v}" style="justify-content:space-between;padding:10px 14px;text-align:right;${r.status===s.v?'border-color:var(--primary);background:var(--primary-light);font-weight:800;':''}">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:16px;">${s.icon}</span>
              <div>
                <div style="font-size:13px;color:var(--ink);">${s.v}</div>
                <div style="font-size:10.5px;color:var(--ink-secondary);font-weight:normal;">${s.desc}</div>
              </div>
            </div>
            ${r.status===s.v ? '<span style="color:var(--primary);font-size:11.5px;">(الحالية)</span>' : ''}
          </button>
        `).join('')}
      </div>

      <div class="field"><label>الفني المسؤول</label>
        <select id="quickTechSelect">
          <option value="">-- بدون تحديد --</option>
          ${state.technicians.map(t=>`<option ${t===r.technician?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>

      <div style="background:var(--green-bg);border:1px solid var(--green);padding:9px 12px;border-radius:var(--radius-sm);margin-bottom:14px;">
        <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--green-text);cursor:pointer;margin:0;">
          <input type="checkbox" id="sendWaAfterStatus" checked style="width:auto;"> إرسال رسالة واتساب للعميل لإشعاره بتحديث الحالة فورًا
        </label>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <button class="btn btn-whatsapp btn-xs" id="quickStatusCostEstBtn" type="button" style="padding:6px 12px;font-weight:700;">${getSvgIcon("wallet", 13)} عرض ومقايسة التكلفة للعميل</button>
        <button class="btn btn-ghost btn-sm" id="cancelQuickStatus">إلغاء</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#closeStatusModal').onclick = ()=>overlay.remove();
  overlay.querySelector('#cancelQuickStatus').onclick = ()=>overlay.remove();
  const quickStatusCostEstBtn = overlay.querySelector('#quickStatusCostEstBtn');
  if(quickStatusCostEstBtn) quickStatusCostEstBtn.onclick = ()=>{ overlay.remove(); openCostEstimateModal(r); };

  let isQuickStatusBusy = false;

  async function applyQuickStatusChange(statusToSet, techToSet, shouldSendWa){
    r.status = statusToSet;
    if(techToSet) r.technician = techToSet;
    r.updatedBy = state.user.name;
    r.updatedAt = new Date().toISOString();
    recordAuditLog('تغيير حالة جهاز', 'صيانة', `تم تغيير حالة الجهاز للإيصال #${r.receiptNumber} إلى "${statusToSet}" للعميل (${r.customer ? r.customer.name : extractCustomerName(r)})`, r.id);

    showToast(`تم تحديث حالة الإيصال محلياً: ${statusToSet}`, 'info');
    overlay.remove();
    renderMain();

    try{
      await saveReceiptRemote(r);
      showToast(`تم حفظ وتحديث حالة الجهاز بنجاح: ${statusToSet} `, 'success');
      if(shouldSendWa){
        setTimeout(()=>sendWhatsappByStatus(r, statusToSet), 400);
      }
    }catch(e){
      showToast('تم الحفظ محلياً (وضع غير متصل)', 'info');
    }
  }

  overlay.querySelectorAll('[data-setstatus]').forEach(btn=>{
    btn.onclick = async ()=>{
      if(isQuickStatusBusy) return;
      const newStatus = btn.dataset.setstatus;
      const newTech = overlay.querySelector('#quickTechSelect').value;
      const sendWa = overlay.querySelector('#sendWaAfterStatus').checked;
      const remaining = (typeof getReceiptRemaining === 'function') ? getReceiptRemaining(r) : Math.max(0, (Number(r.cost||0) + Number(r.partsCost||0) + Number(r.otherAccountAmount||0)) - Number(r.deposit||0) + Number(r.refunded||0));

      // إذا كان الانتقال إلى "الصيانة" بدون توثيق موافقة العميل
      if(newStatus === 'الصيانة' && (!r.customerApproval || !r.customerApproval.approved)){
        openCustomerApprovalModal(r, async (approval)=>{
          recordAuditLog('اعتماد موافقة العميل', 'صيانة', `تم تسجيل موافقة العميل (${approval.approverName}) عبر [${approval.channel}] بتكلفة ${approval.approvedCost} ج.م للإيصال #${r.receiptNumber}`, r.id);
          await applyQuickStatusChange('الصيانة', newTech, sendWa);
        }, ()=>{
          showToast('تم إلغاء الانتقال إلى الصيانة لعدم توثيق موافقة العميل', 'warning');
        });
        return;
      }

      // إذا كان التغيير إلى "تم التسليم" وهناك مبلغ متبقي غير مسدد
      if(newStatus === 'تم التسليم' && remaining > 0){
        isQuickStatusBusy = true;
        overlay.querySelectorAll('[data-setstatus]').forEach(b => b.disabled = true);
        promptDeliveryRemainingPayment(r, remaining, async (shouldPay, payMethodName)=>{
          if(newTech) r.technician = newTech;
          r.status = 'تم التسليم';
          r.updatedBy = state.user.name;
          r.updatedAt = new Date().toISOString();
          recordAuditLog('تسليم جهاز', 'صيانة', `تم تسليم الجهاز للإيصال #${r.receiptNumber} للعميل (${r.customer.name})` + (shouldPay ? ` مع سداد كامل المتبقي (${remaining} ج.م) بواسطة [${payMethodName||'نقدي'}]` : ' (المتبقي آجل)'), r.id);

          const totalCostDue = (typeof getReceiptTotalDue === 'function') ? getReceiptTotalDue(r) : (Number(r.cost||0) + Number(r.partsCost||0) + Number(r.otherAccountAmount||0));
          const depositBefore = Math.min(totalCostDue, Number(r.deposit || 0));
          const remainingDebt = Math.max(0, totalCostDue - depositBefore);
          
          // Post single full revenue recognition entry (F2: Cr 4101 full cost, Dr 2102 deposit, Dr 1103 remaining debt)
          await postReceiptDeliveryRevenue(r, depositBefore, remainingDebt);

          if(shouldPay){
            try {
              await savePaymentRemote(r.id, remaining, 'سداد المتبقي عند التسليم', payMethodName || 'نقدي (كاش)');
              r.deposit = Number(r.deposit||0) + remaining;
              r.paid = true;
              await refreshPayments();
            } catch(e){}
          } else {
            // التسليم بالآجل: تسجيل المتبقي كمديونية على العميل
            try {
              const custName = r.customer ? r.customer.name : '';
              const custPhone = r.customer ? r.customer.phone : '';
              const cust = (state.customers || []).find(c => (custName && (c.name||'').trim().toLowerCase() === custName.trim().toLowerCase()) || (custPhone && c.phone === custPhone));
              if(cust){
                cust.Debt = Number(cust.Debt || cust.debt || 0) + remaining;
                await saveCustomerRemote(cust);
              }
            } catch(errDebt) {
              console.warn('Auto debt recording error:', errDebt);
            }
          }
          overlay.remove();
          renderMain();
          try {
            await saveReceiptRemote(r);
            showToast(shouldPay ? `تم سداد ${remaining.toLocaleString()} ج.م وتسليم الجهاز بنجاح` : 'تم تسليم الجهاز بنجاح (المتبقي آجل)', 'success');
            if(sendWa){
              setTimeout(()=>sendWhatsappByStatus(r, 'تم التسليم'), 400);
            }
          } catch(e){
            showToast('تم الحفظ محلياً (وضع غير متصل)', 'info');
          }
        });
        return;
      }

      await applyQuickStatusChange(newStatus, newTech, sendWa);
    };
  });
}
