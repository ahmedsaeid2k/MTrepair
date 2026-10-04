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
        <button class="btn btn-ghost btn-sm" id="exportCustsExcelBtn">${getSvgIcon("download", 14)} تصدير Excel</button>
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
              <th style="text-align:right;width:32%;">اسم العميل</th>
              <th style="text-align:right;width:24%;">رقم الهاتف والاتصال</th>
              <th style="text-align:center;width:14%;">أجهزة الصيانة</th>
              <th style="text-align:right;width:30%;">البريد / الملاحظات</th>
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

              return `
                <tr class="selectable-row ${isSelectedCust ? 'selected-row' : ''}" data-cust-name="${escapeHtml(cName)}" data-cust-phone="${escapeHtml(cPhone||'')}" onclick="handleCustomerRowClick('${escapeHtml(cName)}', '${escapeHtml(cPhone||'')}', event)" style="cursor:pointer;">
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
                      <button class="btn btn-ghost btn-xs edit-cust-quick-phone-btn" style="color:var(--amber-text);border-color:var(--amber);font-weight:700;" onclick="event.stopPropagation(); openQuickAddPhoneModal('${escapeHtml(cName)}', '${escapeHtml(cTitle||'')}');" title="إضافة رقم هاتف للعميل">
                        ${getSvgIcon("alert", 12)} إضافة رقم الهاتف
                      </button>
                    `}
                  </td>
                  <td style="text-align:center;">
                    ${clientReceipts.length > 0 ? `
                      <button class="btn btn-ghost btn-xs view-cust-receipts-btn" style="font-weight:800;color:var(--primary);" onclick="event.stopPropagation(); viewCustomerReceiptsInArchive('${escapeHtml(cName)}');" title="استعراض أجهزة العميل بالأرشيف">
                        ${getSvgIcon("maintenance", 12)} ${clientReceipts.length} جهاز
                      </button>
                    ` : `<span style="color:var(--ink-secondary);font-size:11px;">-</span>`}
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
  const rows = [
    ['اللقب', 'اسم العميل', 'رقم الهاتف', 'البريد الإلكتروني']
  ];
  list.forEach(c => {
    rows.push([c.title||'', c.name, c.phone, c.email||'']);
  });
  let csv = '\uFEFF' + rows.map(r => r.map(f => `"${String(f||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `customers_directory_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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
  overlay.querySelectorAll('[data-setstatus]').forEach(btn=>{
    btn.onclick = async ()=>{
      if(isQuickStatusBusy) return;
      const newStatus = btn.dataset.setstatus;
      const newTech = overlay.querySelector('#quickTechSelect').value;
      const sendWa = overlay.querySelector('#sendWaAfterStatus').checked;
      const remaining = Number(r.cost||0) + Number(r.partsCost||0) + Number(r.otherAccountAmount||0) - Number(r.deposit||0) + Number(r.refunded||0);

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

          if(shouldPay){
            try {
              await savePaymentRemote(r.id, remaining, 'سداد المتبقي عند التسليم', payMethodName || 'نقدي (كاش)');
              r.deposit = Number(r.deposit||0) + remaining;
              r.paid = true;
              await refreshPayments();
            } catch(e){}
          } else {
            // التسليم بالآجل: تسجيل المتبقي كمديونية على العميل وترحيل قيد للعملاء (أرصدة مدينة)
            try {
              const custName = r.customer ? r.customer.name : '';
              const custPhone = r.customer ? r.customer.phone : '';
              const cust = (state.customers || []).find(c => (custName && (c.name||'').trim().toLowerCase() === custName.trim().toLowerCase()) || (custPhone && c.phone === custPhone));
              if(cust){
                cust.Debt = Number(cust.Debt || cust.debt || 0) + remaining;
                await saveCustomerRemote(cust);
              }
              if(typeof autoPostJournalEntry === 'function'){
                await autoPostJournalEntry({
                  date: new Date().toISOString().slice(0, 10),
                  description: `مستحقات آجل تسليم جهاز إيصال #${r.receiptNumber || r.id} - عميل: ${custName || 'عميل'}`,
                  referenceType: 'DeliveryCredit',
                  referenceId: r.receiptNumber || r.id,
                  entries: [
                    { accountId: '1103', accountName: 'العملاء (أرصدة مدينة)', debit: remaining, credit: 0 },
                    { accountId: '4101', accountName: 'إيرادات خدمات الصيانة', debit: 0, credit: remaining }
                  ]
                });
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

      r.status = newStatus;
      if(newTech) r.technician = newTech;
      r.updatedBy = state.user.name;
      r.updatedAt = new Date().toISOString();
      recordAuditLog('تغيير حالة جهاز', 'صيانة', `تم تغيير حالة الجهاز للإيصال #${r.receiptNumber} إلى "${newStatus}" للعميل (${r.customer.name})`, r.id);

      showToast(`تم تحديث حالة الإيصال محلياً: ${newStatus}`, 'info');
      overlay.remove();
      renderMain();

      try{
        await saveReceiptRemote(r);
        showToast(`تم حفظ وتحديث حالة الجهاز بنجاح: ${newStatus} `, 'success');
        if(sendWa){
          setTimeout(()=>sendWhatsappByStatus(r, newStatus), 400);
        }
      }catch(e){
        showToast('تم الحفظ محلياً (وضع غير متصل)', 'info');
      }
    };
  });
}

/* ---------------- WhatsApp Messaging ---------------- */
function normalizePhoneForWa(phone){
  let p = String(phone||'').replace(/[^0-9]/g,'');
  if(p.startsWith('00')) p = p.slice(2);
  if(p.startsWith('0')) p = '20' + p.slice(1);
  else if(p.length===10 && !p.startsWith('20')) p = '20'+p;
  return p;
}

function getStatusCustomMessage(rawR, status){
  const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
  const remaining = Math.max(0, Number(r.cost||0)+Number(r.partsCost||0)+Number(r.otherAccountAmount||0)-Number(r.deposit||0)+Number(r.refunded||0));
  const shop = (state.settings && state.settings.shopName) || 'مركز الصيانة';
  const shopPhone = (state.settings && (state.settings.shopPhone || state.settings.phone)) || '';
  const shopAddress = (state.settings && (state.settings.shopAddress || state.settings.address)) || '';
  const devCat = (r.device && r.device.category) || 'جهاز';
  const devBrand = r.device ? (r.device.brand==='أخرى' ? r.device.brandOther : r.device.brand) : '';
  const devModel = (r.device && r.device.model) || '';
  const device = `${devCat} - ${devBrand} ${devModel}`.trim();
  const trackUrl = `${window.location.origin}${window.location.pathname}?track=${encodeURIComponent(r.receiptNumber||'')}`;
  const faultsStr = (Array.isArray(r.faults) ? r.faults.join('، ') : String(r.faults || '')) || r.faultNotes || '-';

  let key = 'check';
  const s = String(status || '').trim();
  if(s === 'مكتمل' || s === 'done') key = 'done';
  else if(s === 'تم التسليم' || s === 'delivered') key = 'delivered';
  else if(s === 'الصيانة' || s === 'repair') key = 'repair';
  else if(s === 'قيد الفحص' || s === 'check') key = 'check';
  else if(s === 'overdue_reminder' || s === 'overdue' || s === 'متروكة') key = 'overdue';
  else if(s === 'تعذرت الصيانة' || s === 'unrepairable') key = 'unrepairable';
  else if(s === 'رفض العميل' || s === 'rejected') key = 'rejected';
  else if(s === 'intake' || s === 'استلام جديد' || s === 'استلام') key = 'intake';
  else if(s === 'معلق' || s === 'pending') key = 'pending';
  else if(s === 'ضمان' || s === 'تحت الضمان' || s === 'warranty') key = 'warranty';
  else if(s === 'cost_estimate') key = 'cost_estimate';
  else if(DEFAULT_WA_TEMPLATES[s]) key = s;

  if(key === 'cost_estimate' && typeof buildCostEstimateWhatsappText === 'function'){
    return buildCostEstimateWhatsappText(r, {
      cost: Number(r.cost||0)+Number(r.partsCost||0),
      deposit: Number(r.deposit||0),
      inspectionFee: r.inspectionFee,
      estimateTime: r.estimateTime,
      warranty: r.warranty,
      faultsReport: faultsStr
    });
  }

  let tmpl = getWaTemplate(key);
  if(!tmpl) tmpl = DEFAULT_WA_TEMPLATES[key] || '';

  const depositVal = Number(r.deposit||0);
  const depositInfo = depositVal > 0 ? `• العربون المدفوع مسبقاً: *${depositVal.toLocaleString()} ج.م*` : '';
  const warrantyVal = (r.warranty || '').trim();
  const warrantyInfo = warrantyVal ? `• فترة الضمان المعتمدة: *${warrantyVal}*` : '';

  // Replace placeholders
  const receiptTimeStr = (typeof formatReceiptTime === 'function' ? formatReceiptTime(r) : (r.time || ''));
  const customerDisplayName = (typeof formatCustomerFullName === 'function') ? formatCustomerFullName(r) : ((r.customer && r.customer.name) || 'عميلنا العزيز');
  return tmpl
    .replace(/{customer_name}/g, customerDisplayName)
    .replace(/{receipt_no}/g, r.receiptNumber || '')
    .replace(/{date}/g, cleanDate(r.date))
    .replace(/{time}/g, receiptTimeStr)
    .replace(/{device}/g, device)
    .replace(/{faults}/g, faultsStr)
    .replace(/{faults_report}/g, faultsStr)
    .replace(/{status}/g, r.status || '')
    .replace(/{cost}/g, (Number(r.cost||0)+Number(r.partsCost||0)+Number(r.otherAccountAmount||0)).toLocaleString())
    .replace(/{deposit}/g, depositVal.toLocaleString())
    .replace(/{deposit_info}/g, depositInfo)
    .replace(/{remaining}/g, remaining.toLocaleString())
    .replace(/{inspection_fee}/g, Number(r.inspectionFee || (state.settings && state.settings.defaultInspectionFee) || 100).toLocaleString())
    .replace(/{estimate_time}/g, r.estimateTime || (state.settings && state.settings.defaultEstimateTime) || 'خلال 24-48 ساعة')
    .replace(/{warranty}/g, warrantyVal || (state.settings && state.settings.defaultWarranty) || '3 شهور')
    .replace(/{warranty_info}/g, warrantyInfo)
    .replace(/{track_url}/g, trackUrl)
    .replace(/{shop_name}/g, shop)
    .replace(/{shop_phone}/g, shopPhone)
    .replace(/{shop_address}/g, shopAddress)
    .replace(/\n\s*\n\s*\n+/g, '\n\n');
}

function sendWhatsappByStatus(r, status){
  const msg = getStatusCustomMessage(r, status);
  sendWhatsapp(r, msg);
}

function sendWhatsapp(rawR, msg){
  const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
  const rawPhone = (r.customer && r.customer.phone) || extractCustomerPhone(r);
  const phone = normalizePhoneForWa(rawPhone);
  if(!phone || phone.length < 10){ showToast('رقم هاتف العميل غير صالح لإرسال واتساب', 'error'); return; }
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
}

function openWhatsapp(r){ openWhatsappChoice(r); }

function openWhatsappStatusNotificationModal(rawR, statusOrKey, onSent){
  if(!rawR) return;
  const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
  
  if(statusOrKey === 'cost_estimate'){
    return openCostEstimateModal(r);
  }

  // Resolve initial key
  let currentKey = 'check';
  const s = String(statusOrKey || r.status || '').trim();
  if(s === 'مكتمل' || s === 'done') currentKey = 'done';
  else if(s === 'تم التسليم' || s === 'delivered') currentKey = 'delivered';
  else if(s === 'الصيانة' || s === 'repair') currentKey = 'repair';
  else if(s === 'قيد الفحص' || s === 'check') currentKey = 'check';
  else if(s === 'overdue_reminder' || s === 'overdue' || s === 'متروكة') currentKey = 'overdue';
  else if(s === 'تعذرت الصيانة' || s === 'unrepairable') currentKey = 'unrepairable';
  else if(s === 'رفض العميل' || s === 'rejected') currentKey = 'rejected';
  else if(s === 'intake' || s === 'استلام جديد' || s === 'استلام') currentKey = 'intake';
  else if(s === 'معلق' || s === 'pending') currentKey = 'pending';
  else if(s === 'ضمان' || s === 'تحت الضمان' || s === 'warranty') currentKey = 'warranty';
  else if(DEFAULT_WA_TEMPLATES[s]) currentKey = s;

  const templateOptions = [
    { k: 'intake', icon: getSvgIcon('download', 14), label: 'استلام جديد' },
    { k: 'check', icon: getSvgIcon('search', 14), label: 'قيد الفحص' },
    { k: 'repair', icon: getSvgIcon('tool', 14), label: 'الصيانة' },
    { k: 'done', icon: getSvgIcon('check', 14), label: 'جاهز للاستلام' },
    { k: 'delivered', icon: getSvgIcon('truck', 14), label: 'تم التسليم' },
    { k: 'pending', icon: getSvgIcon('pause', 14), label: 'معلق' },
    { k: 'warranty', icon: getSvgIcon('shield', 14), label: 'تحت الضمان' },
    { k: 'overdue', icon: getSvgIcon('clock', 14), label: 'تذكير (+7 أيام)' },
    { k: 'unrepairable', icon: getSvgIcon('alert', 14), label: 'تعذر الإصلاح' },
    { k: 'rejected', icon: getSvgIcon('x', 14), label: 'رفض الصيانة' }
  ];

  const cFullName = (typeof formatCustomerFullName === 'function') ? formatCustomerFullName(r) : ((r.customer && r.customer.name) || extractCustomerName(r) || 'عميل');
  const cName = escapeHtml(cFullName);
  let rawPhone = (r.customer && r.customer.phone) || extractCustomerPhone(r) || '';
  const dCat = escapeHtml((r.device && r.device.category) || 'جهاز');
  const dBrand = escapeHtml(r.device ? (r.device.brand==='أخرى' ? r.device.brandOther : r.device.brand) : '');
  const dModel = escapeHtml((r.device && r.device.model) || '');
  const rNum = escapeHtml(String(r.receiptNumber || ''));

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'waStatusNotifyModalOverlay';

  const placeholdersList = [
    { p: '{customer_name}', label: 'اسم العميل' },
    { p: '{receipt_no}', label: 'رقم الإيصال' },
    { p: '{device}', label: 'الجهاز' },
    { p: '{remaining}', label: 'المتبقي' },
    { p: '{cost}', label: 'التكلفة' },
    { p: '{deposit}', label: 'العربون' },
    { p: '{track_url}', label: 'رابط التتبع' },
    { p: '{date}', label: 'التاريخ' },
    { p: '{time}', label: 'الوقت' },
    { p: '{shop_name}', label: 'اسم المحل' },
    { p: '{shop_phone}', label: 'هاتف المحل' }
  ];

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:560px;max-height:92vh;overflow-y:auto;padding:22px;border-radius:14px;">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:14px;">
        <div>
          <h3 style="margin:0;font-size:17px;display:flex;align-items:center;gap:7px;color:#047857;">
            ${WA_ICON} <span>إرسال إشعار واتساب للعميل</span>
          </h3>
          <p style="margin:4px 0 0 0;font-size:12px;color:var(--ink-secondary);">معاينة وتخصيص نص الرسالة الذكية قبل إرسالها للعميل مباشرة</p>
        </div>
        <button class="btn btn-ghost btn-xs" id="closeWaStatusModal" style="font-size:16px;line-height:1;padding:4px 8px;">&times;</button>
      </div>

      <!-- Recipient & Device Card -->
      <div style="background:var(--paper3);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:12.5px;line-height:1.6;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div><b>العميل:</b> <span style="font-weight:700;color:var(--ink);">${cName}</span></div>
          <div><b>الإيصال:</b> <span class="mono font-bold" style="color:var(--primary);direction:ltr;unicode-bidi:isolate;">#${rNum}</span></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-top:4px;">
          <div><b>الجهاز:</b> ${dCat} - ${dBrand} ${dModel}</div>
          <div><b>حالة الإيصال:</b> <span class="status-badge ${(STATUSES.find(st=>st.v===r.status)||{}).cls||'st-check'}">${escapeHtml(r.status)}</span></div>
        </div>
        <div style="margin-top:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <label style="font-size:11.5px;font-weight:700;margin-bottom:0;color:var(--ink);">رقم هاتف واتساب:</label>
          <input type="text" id="waRecipientPhone" value="${escapeHtml(rawPhone)}" placeholder="مثال: 01012345678" style="padding:4px 8px;font-size:12px;width:150px;font-weight:700;" class="mono">
          <span id="waPhoneStatusMsg" style="font-size:11px;"></span>
        </div>
      </div>

      <!-- Template Switcher Pills -->
      <div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <label style="font-size:12px;font-weight:700;color:var(--ink);margin:0;">اختر قالب الرسالة المناسب:</label>
          <button type="button" class="btn btn-xs" id="switchToCostEstBtn" style="background:#047857;color:#fff;border:none;border-radius:5px;padding:2px 7px;font-size:11px;font-weight:700;">مقايسة التكلفة</button>
        </div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;" id="waTemplatePillsContainer">
          ${templateOptions.map(t => `
            <button type="button" class="btn btn-xs ${t.k === currentKey ? 'btn-primary' : 'btn-ghost'}" data-wa-tmpl="${t.k}" style="padding:4px 8px;font-size:11.5px;">
              ${t.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Placeholders Helper -->
      <div style="margin-bottom:8px;">
        <div style="font-size:11px;color:var(--ink-secondary);margin-bottom:4px;">إدراج متغيرات بنقرة واحدة:</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          ${placeholdersList.map(pl => `
            <button type="button" class="btn btn-xs btn-ghost" data-insert-tag="${pl.p}" style="padding:2px 6px;font-size:10.5px;border-radius:4px;background:var(--paper2);" title="إدراج ${pl.p}">
              ${pl.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Editable Message Textarea in WhatsApp Style -->
      <div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <label style="font-size:12px;font-weight:700;color:var(--ink);margin:0;">نص الرسالة المعد للإرسال:</label>
          <span id="waCharCounter" class="mono" style="font-size:11px;color:var(--ink-secondary);">0 حرف</span>
        </div>
        <div style="position:relative;">
          <textarea id="waMessageTextarea" rows="7" style="width:100%;font-size:13px;line-height:1.6;padding:12px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:10px;color:#14532d;font-family:inherit;box-shadow:inset 0 1px 3px rgba(0,0,0,0.03);"></textarea>
        </div>
      </div>

      <!-- Tracking Link & Direct Actions -->
      <div style="background:rgba(4,120,87,0.06);border:1px solid rgba(4,120,87,0.2);border-radius:8px;padding:8px 12px;margin-bottom:14px;font-size:11.5px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <span style="color:#047857;">${getSvgIcon("externalLink", 12)} رابط تتبع الصيانة للعميل مضمن تلقائياً داخل الرسالة</span>
        <button type="button" class="btn btn-xs btn-ghost" id="openTrackPreviewBtn" style="color:#047857;padding:2px 8px;font-weight:700;">${getSvgIcon("eye", 13)} تجربة الرابط</button>
      </div>

      <!-- Footer Action Buttons -->
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);padding-top:14px;flex-wrap:wrap;gap:10px;">
        <button class="btn btn-ghost btn-sm" id="cancelWaStatusModal">إلغاء</button>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" id="copyWaMsgBtn" style="font-weight:600;">${getSvgIcon("copy", 13)} نسخ النص</button>
          <button class="btn btn-whatsapp btn-sm" id="sendWaDirectBtn" style="font-weight:700;padding:7px 16px;">
            ${WA_ICON} فتح وإرسال عبر واتساب
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const phoneInput = overlay.querySelector('#waRecipientPhone');
  const phoneStatusMsg = overlay.querySelector('#waPhoneStatusMsg');
  const msgTextarea = overlay.querySelector('#waMessageTextarea');
  const charCounter = overlay.querySelector('#waCharCounter');
  const pillsContainer = overlay.querySelector('#waTemplatePillsContainer');

  function updatePhoneValidation(){
    const p = normalizePhoneForWa(phoneInput.value);
    if(!p || p.length < 10){
      phoneStatusMsg.innerHTML = '<span style="color:#ef4444;font-weight:700;">رقم غير صالح</span>';
      return false;
    } else {
      phoneStatusMsg.innerHTML = '<span style="color:#10b981;font-weight:700;">صحيح</span>';
      return true;
    }
  }
  phoneInput.oninput = updatePhoneValidation;
  updatePhoneValidation();

  function updateCharCount(){
    const len = msgTextarea.value.length;
    charCounter.textContent = `${len} حرف`;
  }
  msgTextarea.oninput = updateCharCount;

  function loadTemplate(key){
    currentKey = key;
    pillsContainer.querySelectorAll('[data-wa-tmpl]').forEach(b => {
      if(b.dataset.waTmpl === key){
        b.className = 'btn btn-xs btn-primary';
      } else {
        b.className = 'btn btn-xs btn-ghost';
      }
    });
    msgTextarea.value = getStatusCustomMessage(r, key);
    updateCharCount();
  }

  // Load initial
  loadTemplate(currentKey);

  // Template pills click
  pillsContainer.querySelectorAll('[data-wa-tmpl]').forEach(btn => {
    btn.onclick = () => loadTemplate(btn.dataset.waTmpl);
  });

  // Switch to cost estimate
  overlay.querySelector('#switchToCostEstBtn').onclick = () => {
    overlay.remove();
    openCostEstimateModal(r);
  };

  // Placeholders insert
  overlay.querySelectorAll('[data-insert-tag]').forEach(chip => {
    chip.onclick = () => {
      const tag = chip.dataset.insertTag;
      const start = msgTextarea.selectionStart;
      const end = msgTextarea.selectionEnd;
      const val = msgTextarea.value;
      msgTextarea.value = val.substring(0, start) + tag + val.substring(end);
      msgTextarea.focus();
      msgTextarea.setSelectionRange(start + tag.length, start + tag.length);
      updateCharCount();
    };
  });

  // Preview Tracking
  overlay.querySelector('#openTrackPreviewBtn').onclick = () => {
    const trackUrl = `${window.location.origin}${window.location.pathname}?track=${encodeURIComponent(r.receiptNumber||'')}`;
    window.open(trackUrl, '_blank', 'noopener');
  };

  // Copy
  overlay.querySelector('#copyWaMsgBtn').onclick = () => {
    navigator.clipboard.writeText(msgTextarea.value).then(() => {
      showToast('تم نسخ نص الرسالة إلى الحافظة بنجاح', 'success');
    }).catch(() => {
      msgTextarea.select();
      document.execCommand('copy');
      showToast('تم نسخ الرسالة', 'info');
    });
  };

  // Send Direct
  overlay.querySelector('#sendWaDirectBtn').onclick = () => {
    const p = normalizePhoneForWa(phoneInput.value);
    if(!p || p.length < 10){
      showToast('يرجى التأكد من كتابة رقم هاتف صالح لإرسال واتساب', 'error');
      phoneInput.focus();
      return;
    }
    // Update phone in receipt/customer if changed
    if(phoneInput.value.trim() !== rawPhone.trim()){
      if(!r.customer) r.customer = {};
      r.customer.phone = phoneInput.value.trim();
      try{ saveReceiptRemote(r); }catch(e){}
    }
    const finalMsg = msgTextarea.value;
    window.open(`https://wa.me/${p}?text=${encodeURIComponent(finalMsg)}`, '_blank', 'noopener');
    recordAuditLog('إرسال واتساب', 'صيانة', `تم إرسال إشعار واتساب [${currentKey}] للإيصال #${r.receiptNumber} للعميل (${r.customer.name})`, r.id);
    if(typeof onSent === 'function') onSent(finalMsg);
    overlay.remove();
    showToast('جاري فتح واتساب لإرسال الرسالة للعميل', 'success');
  };

  overlay.querySelector('#closeWaStatusModal').onclick = () => overlay.remove();
  overlay.querySelector('#cancelWaStatusModal').onclick = () => overlay.remove();
}

function openWhatsappChoice(rawR){
  if(!rawR) return;
  const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const cFullName = (typeof formatCustomerFullName === 'function') ? formatCustomerFullName(r) : ((r.customer && r.customer.name) || extractCustomerName(r) || 'عميل');
  const cName = escapeHtml(cFullName);
  const rNum = escapeHtml(String(r.receiptNumber || ''));

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:500px;padding:22px;border-radius:14px;max-height:92vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
        <h3 style="margin:0;font-size:16px;display:flex;align-items:center;gap:6px;color:#047857;">
          ${WA_ICON} <span>مركز رسائل واتساب الذكية</span>
        </h3>
        <button class="btn btn-ghost btn-xs" id="closeWaChoiceModal" style="font-size:16px;line-height:1;padding:4px 8px;">&times;</button>
      </div>

      <div style="background:var(--paper3);border:1px solid var(--line);border-radius:8px;padding:9px 12px;margin-bottom:14px;font-size:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div><b>العميل:</b> <span style="font-weight:700;">${cName}</span></div>
          <div><b>الإيصال:</b> <span class="mono font-bold" style="color:var(--primary);direction:ltr;unicode-bidi:isolate;">#${rNum}</span></div>
        </div>
      </div>

      <p style="font-size:12px;color:var(--ink-secondary);margin-bottom:10px;">اختر نوع الإشعار لمعاينته وتخصيصه قبل الإرسال:</p>

      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">
        <!-- Current Status Primary Button -->
        <button class="btn btn-whatsapp" id="waChoiceCurrentStatus" style="font-weight:700;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;">
          <span style="display:flex;align-items:center;gap:7px;">
            <span>${getSvgIcon("bell", 14)}</span> إشعار بالحالة الحالية (${escapeHtml(r.status)})
          </span>
          <span class="badge" style="background:rgba(255,255,255,0.25);color:#fff;font-size:11px;">معاينة وإرسال ←</span>
        </button>

        <!-- Cost Estimate Button -->
        <button class="btn btn-whatsapp" id="waChoiceCostEstimate" style="background:#047857;border-color:#047857;font-weight:700;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;">
          <span style="display:flex;align-items:center;gap:7px;">
            <span>${getSvgIcon("wallet", 14)}</span> مقايسة وعرض التكلفة (موافقة / رفض ورسوم فحص)
          </span>
          <span class="badge" style="background:rgba(255,255,255,0.25);color:#fff;font-size:11px;">تخصيص ←</span>
        </button>

        <!-- Intake Notification -->
        <button class="btn btn-ghost" id="waChoiceIntake" style="text-align:right;justify-content:flex-start;padding:9px 12px;font-size:12.5px;border:1px solid var(--line);">
          ${getSvgIcon("download", 14)} رسالة استلام الجهاز وحجز الإيصال + رابط التتبع
        </button>

        <!-- Under Check Notification -->
        <button class="btn btn-ghost" id="waChoiceCheck" style="text-align:right;justify-content:flex-start;padding:9px 12px;font-size:12.5px;border:1px solid var(--line);">
          ${getSvgIcon("search", 14)} إشعار بدء الفحص والتشخيص الفني (قيد الفحص)
        </button>

        <!-- In Repair Notification -->
        <button class="btn btn-ghost" id="waChoiceRepair" style="text-align:right;justify-content:flex-start;padding:9px 12px;font-size:12.5px;border:1px solid var(--line);">
          ${getSvgIcon("tool", 14)} إشعار المباشرة في أعمال الإصلاح والصيانة
        </button>

        <!-- Ready For Delivery Notification -->
        <button class="btn btn-ghost" id="waChoiceDone" style="text-align:right;justify-content:flex-start;padding:9px 12px;font-size:12.5px;border:1px solid var(--line);">
          ${getSvgIcon("check", 14)} إشعار انتهاء الصيانة وجاهزية الجهاز للاستلام
        </button>

        <!-- Delivered & Warranty Notification -->
        <button class="btn btn-ghost" id="waChoiceDelivered" style="text-align:right;justify-content:flex-start;padding:9px 12px;font-size:12.5px;border:1px solid var(--line);">
          ${getSvgIcon("shield", 14)} إشعار تسليم الجهاز للعميل وتفعيل الضمان
        </button>

        <!-- Overdue Reminder Notification -->
        <button class="btn btn-ghost" id="waChoiceOverdue" style="text-align:right;justify-content:flex-start;padding:9px 12px;font-size:12.5px;border:1px solid var(--line);">
          ${getSvgIcon("clock", 14)} تذكير باستلام الجهاز الجاهز المتروك (+7 أيام)
        </button>
      </div>

      <div style="display:flex;justify-content:flex-end;border-top:1px solid var(--line);padding-top:10px;">
        <button class="btn btn-ghost btn-sm" id="waChoiceCancel">إغلاق</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#closeWaChoiceModal').onclick = () => overlay.remove();
  overlay.querySelector('#waChoiceCancel').onclick = () => overlay.remove();

  overlay.querySelector('#waChoiceCurrentStatus').onclick = () => {
    overlay.remove();
    openWhatsappStatusNotificationModal(r, r.status);
  };
  overlay.querySelector('#waChoiceCostEstimate').onclick = () => {
    overlay.remove();
    openCostEstimateModal(r);
  };
  overlay.querySelector('#waChoiceIntake').onclick = () => {
    overlay.remove();
    openWhatsappStatusNotificationModal(r, 'intake');
  };
  overlay.querySelector('#waChoiceCheck').onclick = () => {
    overlay.remove();
    openWhatsappStatusNotificationModal(r, 'check');
  };
  overlay.querySelector('#waChoiceRepair').onclick = () => {
    overlay.remove();
    openWhatsappStatusNotificationModal(r, 'repair');
  };
  overlay.querySelector('#waChoiceDone').onclick = () => {
    overlay.remove();
    openWhatsappStatusNotificationModal(r, 'done');
  };
  overlay.querySelector('#waChoiceDelivered').onclick = () => {
    overlay.remove();
    openWhatsappStatusNotificationModal(r, 'delivered');
  };
  overlay.querySelector('#waChoiceOverdue').onclick = () => {
    overlay.remove();
    openWhatsappStatusNotificationModal(r, 'overdue');
  };
}

function openBulkOverdueWhatsappModal(initialDays){
  let daysThreshold = initialDays || 7;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'bulkOverdueWaModalOverlay';

  function getOverdueList(){
    return state.receipts.filter(r => {
      if(r.status !== 'مكتمل') return false;
      const d = new Date(r.updatedAt || r.date);
      const days = (Date.now() - d.getTime()) / 86400000;
      return days >= daysThreshold;
    }).sort((a,b) => new Date(a.updatedAt||a.date) - new Date(b.updatedAt||b.date));
  }

  let overdue = getOverdueList();
  let selectedIds = new Set(overdue.map(r => r.id));

  function renderContent(){
    overdue = getOverdueList();
    const totalRemaining = overdue.filter(r => selectedIds.has(r.id)).reduce((sum, r) => {
      const rem = Math.max(0, Number(r.cost||0)+Number(r.partsCost||0)+Number(r.otherAccountAmount||0)-Number(r.deposit||0)+Number(r.refunded||0));
      return sum + rem;
    }, 0);

    overlay.innerHTML = `
      <div class="modal-content" style="max-width:760px;max-height:92vh;overflow-y:auto;padding:22px;border-radius:14px;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:14px;">
          <div>
            <h3 style="margin:0;font-size:17px;display:flex;align-items:center;gap:7px;color:#d97706;">
              ${WA_ICON} <span>إرسال تذكيرات واتساب للأجهزة المتروكة (+7 أيام)</span>
            </h3>
            <p style="margin:4px 0 0 0;font-size:12px;color:var(--ink-secondary);">تذكير العملاء باستلام أجهزتهم الجاهزة والمكتملة وسداد المستحقات المتبقية</p>
          </div>
          <button class="btn btn-ghost btn-xs" id="closeBulkOverdueModal" style="font-size:16px;line-height:1;padding:4px 8px;">&times;</button>
        </div>

        <!-- Filter Pills & Summary -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
          <div style="display:flex;gap:6px;align-items:center;">
            <span style="font-size:12px;font-weight:700;">فترة الانتظار:</span>
            <button type="button" class="btn btn-xs ${daysThreshold===3?'btn-primary':'btn-ghost'}" id="filterDays3Btn">أكثر من 3 أيام</button>
            <button type="button" class="btn btn-xs ${daysThreshold===7?'btn-primary':'btn-ghost'}" id="filterDays7Btn">أكثر من 7 أيام (أسبوع)</button>
            <button type="button" class="btn btn-xs ${daysThreshold===14?'btn-primary':'btn-ghost'}" id="filterDays14Btn">أكثر من 14 يوم (أسبوعين)</button>
          </div>
          <div style="font-size:12.5px;background:var(--amber-bg);color:var(--amber-text);padding:4px 10px;border-radius:6px;font-weight:700;">
            ${overdue.length} أجهزة متأخرة | ${selectedIds.size} محددة (${totalRemaining.toLocaleString()} ج.م متبقي)
          </div>
        </div>

        <!-- Overdue List Table -->
        <div style="border:1px solid var(--line);border-radius:8px;overflow:hidden;margin-bottom:14px;max-height:300px;overflow-y:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
            <thead>
              <tr style="background:var(--paper2);border-bottom:1px solid var(--line);text-align:right;">
                <th style="padding:8px 10px;width:36px;text-align:center;">
                  <input type="checkbox" id="selectAllOverdue" ${selectedIds.size === overdue.length && overdue.length > 0 ? 'checked' : ''} style="width:auto;">
                </th>
                <th style="padding:8px 10px;">الإيصال</th>
                <th style="padding:8px 10px;">العميل والهاتف</th>
                <th style="padding:8px 10px;">الجهاز</th>
                <th style="padding:8px 10px;">تاريخ الإنجاز</th>
                <th style="padding:8px 10px;">المتبقي</th>
                <th style="padding:8px 10px;text-align:center;">إجراء مباشر</th>
              </tr>
            </thead>
            <tbody>
              ${overdue.length === 0 ? `
                <tr><td colspan="7" style="text-align:center;padding:24px;color:var(--ink-secondary);">لا توجد أجهزة مكتملة متأخرة تتجاوز هذه المدة.</td></tr>
              ` : overdue.map(r => {
                const rem = Math.max(0, Number(r.cost||0)+Number(r.partsCost||0)+Number(r.otherAccountAmount||0)-Number(r.deposit||0)+Number(r.refunded||0));
                const cName = escapeHtml((r.customer && r.customer.name) || extractCustomerName(r) || 'عميل');
                const rawPh = (r.customer && r.customer.phone) || extractCustomerPhone(r) || '';
                const dDate = new Date(r.updatedAt || r.date);
                const daysElapsed = Math.floor((Date.now() - dDate.getTime()) / 86400000);
                const dCat = escapeHtml((r.device && r.device.category) || 'جهاز');
                const dModel = escapeHtml((r.device && r.device.model) || '');
                const isSelected = selectedIds.has(r.id);

                return `
                  <tr style="border-bottom:1px solid var(--line);background:${isSelected?'rgba(16,185,129,0.04)':'transparent'};">
                    <td style="padding:8px 10px;text-align:center;">
                      <input type="checkbox" class="overdue-chk" data-rid="${r.id}" ${isSelected?'checked':''} style="width:auto;">
                    </td>
                    <td style="padding:8px 10px;font-family:monospace;font-weight:700;color:var(--primary);direction:ltr;unicode-bidi:isolate;">
                      #${escapeHtml(r.receiptNumber)}
                    </td>
                    <td style="padding:8px 10px;">
                      <div style="font-weight:700;">${cName}</div>
                      <div class="mono" style="font-size:11px;color:var(--ink-secondary);">${escapeHtml(rawPh) || '<span style="color:#ef4444;">بدون هاتف</span>'}</div>
                    </td>
                    <td style="padding:8px 10px;">${dCat} ${dModel}</td>
                    <td style="padding:8px 10px;">
                      <span class="badge badge-amber" style="font-size:11px;">منذ ${daysElapsed} يوم</span>
                    </td>
                    <td style="padding:8px 10px;font-weight:800;color:#047857;" class="mono">${rem.toLocaleString()} ج.م</td>
                    <td style="padding:8px 10px;text-align:center;">
                      <button type="button" class="btn btn-whatsapp btn-xs row-send-overdue-wa" data-rid="${r.id}" style="padding:3px 8px;font-size:11px;font-weight:700;">
                        ${WA_ICON} إرسال
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Sequential Dispatch Runner Bar -->
        <div id="bulkRunnerBox" style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:12px 16px;margin-bottom:14px;display:none;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-weight:800;color:#14532d;display:flex;align-items:center;gap:6px;">
              <span>${getSvgIcon("send", 14)}</span> <span>مشغل الإرسال المتتابع المباشر:</span>
            </div>
            <span id="runnerProgressText" class="mono font-bold" style="color:#047857;">1 من 5</span>
          </div>
          <div id="runnerTargetInfo" style="font-size:12.5px;color:#166534;margin-bottom:10px;line-height:1.5;"></div>
          <div style="display:flex;gap:8px;align-items:center;">
            <button type="button" class="btn btn-whatsapp btn-sm" id="btnRunnerNext" style="font-weight:700;flex:1;">
              ${WA_ICON} إرسال للعميل الحالي والانتقال للتالي ←
            </button>
            <button type="button" class="btn btn-ghost btn-sm" id="btnRunnerSkip">تخطي</button>
            <button type="button" class="btn btn-ghost btn-sm" id="btnRunnerStop">إيقاف</button>
          </div>
        </div>

        <!-- Footer Actions -->
        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);padding-top:14px;flex-wrap:wrap;gap:10px;">
          <button class="btn btn-ghost btn-sm" id="btnCancelBulkOverdue">إلغاء</button>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-ghost btn-sm" id="btnCopyOverduePhones">${getSvgIcon("copy", 14)} نسخ أرقام الهواتف</button>
            <button class="btn btn-whatsapp btn-sm" id="btnStartBulkRunner" style="font-weight:700;" ${selectedIds.size === 0 ? 'disabled' : ''}>
              ${WA_ICON} بدء الإرسال المتتابع للمحددين (${selectedIds.size})
            </button>
          </div>
        </div>
      </div>
    `;

    // Rebind events
    overlay.querySelector('#closeBulkOverdueModal').onclick = () => overlay.remove();
    overlay.querySelector('#btnCancelBulkOverdue').onclick = () => overlay.remove();

    const d3 = overlay.querySelector('#filterDays3Btn');
    const d7 = overlay.querySelector('#filterDays7Btn');
    const d14 = overlay.querySelector('#filterDays14Btn');
    if(d3) d3.onclick = () => { daysThreshold = 3; selectedIds = new Set(getOverdueList().map(x=>x.id)); renderContent(); };
    if(d7) d7.onclick = () => { daysThreshold = 7; selectedIds = new Set(getOverdueList().map(x=>x.id)); renderContent(); };
    if(d14) d14.onclick = () => { daysThreshold = 14; selectedIds = new Set(getOverdueList().map(x=>x.id)); renderContent(); };

    const selectAll = overlay.querySelector('#selectAllOverdue');
    if(selectAll){
      selectAll.onchange = () => {
        if(selectAll.checked){
          overdue.forEach(r => selectedIds.add(r.id));
        } else {
          selectedIds.clear();
        }
        renderContent();
      };
    }

    overlay.querySelectorAll('.overdue-chk').forEach(chk => {
      chk.onchange = () => {
        const id = chk.dataset.rid;
        if(chk.checked) selectedIds.add(id);
        else selectedIds.delete(id);
        renderContent();
      };
    });

    overlay.querySelectorAll('.row-send-overdue-wa').forEach(btn => {
      btn.onclick = () => {
        const r = overdue.find(x => x.id === btn.dataset.rid);
        if(r) openWhatsappStatusNotificationModal(r, 'overdue');
      };
    });

    const copyBtn = overlay.querySelector('#btnCopyOverduePhones');
    if(copyBtn){
      copyBtn.onclick = () => {
        const phones = overdue.filter(r => selectedIds.has(r.id))
          .map(r => (r.customer && r.customer.phone) || extractCustomerPhone(r))
          .filter(Boolean);
        if(!phones.length){ showToast('لا توجد أرقام هواتف لنسخها', 'error'); return; }
        navigator.clipboard.writeText(phones.join('\n')).then(() => {
          showToast(`تم نسخ ${phones.length} رقم هاتف بنجاح`, 'success');
        });
      };
    }

    // Runner logic
    const startRunnerBtn = overlay.querySelector('#btnStartBulkRunner');
    const runnerBox = overlay.querySelector('#bulkRunnerBox');
    const runnerProgress = overlay.querySelector('#runnerProgressText');
    const runnerInfo = overlay.querySelector('#runnerTargetInfo');
    const runnerNext = overlay.querySelector('#btnRunnerNext');
    const runnerSkip = overlay.querySelector('#btnRunnerSkip');
    const runnerStop = overlay.querySelector('#btnRunnerStop');

    let runnerList = [];
    let runnerIndex = 0;

    function showRunnerStep(){
      if(runnerIndex >= runnerList.length){
        runnerBox.style.display = 'none';
        showToast('تم الانتهاء من إرسال تذكيرات كافة العملاء المحددين بنجاح', 'success');
        return;
      }
      runnerBox.style.display = 'block';
      const cur = runnerList[runnerIndex];
      const cName = (cur.customer && cur.customer.name) || extractCustomerName(cur) || 'عميل';
      const cPhone = (cur.customer && cur.customer.phone) || extractCustomerPhone(cur) || '-';
      runnerProgress.textContent = `${runnerIndex + 1} من ${runnerList.length}`;
      runnerInfo.innerHTML = `<b>العميل:</b> ${escapeHtml(cName)} | <b>الهاتف:</b> <span class="mono">${escapeHtml(cPhone)}</span> | <b>الإيصال:</b> #${escapeHtml(cur.receiptNumber)}`;
    }

    if(startRunnerBtn){
      startRunnerBtn.onclick = () => {
        runnerList = overdue.filter(r => selectedIds.has(r.id));
        if(!runnerList.length){ showToast('يرجى تحديد جهاز واحد على الأقل', 'error'); return; }
        runnerIndex = 0;
        showRunnerStep();
      };
    }

    if(runnerNext){
      runnerNext.onclick = () => {
        const cur = runnerList[runnerIndex];
        if(cur){
          const msg = getStatusCustomMessage(cur, 'overdue');
          sendWhatsapp(cur, msg);
        }
        runnerIndex++;
        showRunnerStep();
      };
    }

    if(runnerSkip){
      runnerSkip.onclick = () => {
        runnerIndex++;
        showRunnerStep();
      };
    }

    if(runnerStop){
      runnerStop.onclick = () => {
        runnerBox.style.display = 'none';
      };
    }
  }

  document.body.appendChild(overlay);
  renderContent();
}

/* ---------------- Cost Estimate & WhatsApp Quotation Modal ---------------- */

function buildCostEstimateWhatsappText(rawR, vals){
  const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
  const devCat = (r.device && r.device.category) || 'جهاز';
  const devBrand = r.device ? (r.device.brand==='أخرى' ? r.device.brandOther : r.device.brand) : '';
  const devModel = (r.device && r.device.model) || '';
  const device = `${devCat} - ${devBrand} ${devModel}`.trim();
  const trackUrl = `${window.location.origin}${window.location.pathname}?track=${encodeURIComponent(r.receiptNumber||'')}`;
  const shop = (state.settings && state.settings.shopName) || 'مركز الصيانة';
  const shopPhone = (state.settings && state.settings.shopPhone) || '';
  const shopAddress = (state.settings && state.settings.shopAddress) || '';
  const customerDisplayName = (typeof formatCustomerFullName === 'function') ? formatCustomerFullName(r) : ((r.customer && r.customer.name) || 'عميلنا العزيز');
  
  const cost = Number(vals.cost || 0);
  const deposit = Number(vals.deposit || 0);
  const remaining = Math.max(0, cost - deposit);
  const inspectionFee = Number(vals.inspectionFee != null ? vals.inspectionFee : ((state.settings && state.settings.defaultInspectionFee != null) ? state.settings.defaultInspectionFee : 100));
  const estimateTime = (vals.estimateTime || 'خلال 24-48 ساعة').trim();
  const warranty = (vals.warranty || '3 شهور ضد عيوب الصناعة').trim();
  const faultsReport = (vals.faultsReport || (Array.isArray(r.faults) ? r.faults.join('، ') : String(r.faults || '')) || r.faultNotes || 'فحص شامل وتحديد الأعطال').trim();

  const depositInfo = deposit > 0 ? `• العربون المدفوع مسبقاً: *${deposit.toLocaleString()} ج.م*` : '';
  const warrantyInfo = warranty ? `• فترة الضمان المعتمدة: *${warranty}*` : '';

  let tmpl = getWaTemplate('cost_estimate') || DEFAULT_WA_TEMPLATES.cost_estimate;

  return tmpl
    .replace(/{customer_name}/g, customerDisplayName)
    .replace(/{receipt_no}/g, r.receiptNumber || '')
    .replace(/{date}/g, cleanDate(r.date))
    .replace(/{device}/g, device)
    .replace(/{faults_report}/g, faultsReport)
    .replace(/{faults}/g, faultsReport)
    .replace(/{cost}/g, cost.toLocaleString())
    .replace(/{deposit}/g, deposit.toLocaleString())
    .replace(/{deposit_info}/g, depositInfo)
    .replace(/{remaining}/g, remaining.toLocaleString())
    .replace(/{inspection_fee}/g, inspectionFee.toLocaleString())
    .replace(/{estimate_time}/g, estimateTime)
    .replace(/{warranty}/g, warranty)
    .replace(/{warranty_info}/g, warrantyInfo)
    .replace(/{track_url}/g, trackUrl)
    .replace(/{shop_name}/g, shop)
    .replace(/{shop_phone}/g, shopPhone)
    .replace(/{shop_address}/g, shopAddress)
    .replace(/\n\s*\n\s*\n+/g, '\n\n');
}

function openCostEstimateModal(rawR){
  if(!rawR) return;
  const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'costEstimateModalOverlay';

  const cFullName = (typeof formatCustomerFullName === 'function') ? formatCustomerFullName(r) : ((r.customer && r.customer.name) || extractCustomerName(r) || 'عميل');
  const cName = escapeHtml(cFullName);
  const cRawPhone = (r.customer && r.customer.phone) || extractCustomerPhone(r) || '';
  const cPhone = escapeHtml(cRawPhone);
  const dCat = escapeHtml((r.device && r.device.category) || 'جهاز');
  const dBrand = escapeHtml(r.device ? (r.device.brand==='أخرى' ? r.device.brandOther : r.device.brand) : '');
  const dModel = escapeHtml((r.device && r.device.model) || '');
  const rNum = escapeHtml(String(r.receiptNumber || ''));

  const initialCost = Number(r.cost || 0) + Number(r.partsCost || 0);
  const initialDeposit = Number(r.deposit || 0);
  const defaultFee = (state.settings && state.settings.defaultInspectionFee != null) ? Number(state.settings.defaultInspectionFee) : 100;
  const initialInspectionFee = Number(r.inspectionFee != null ? r.inspectionFee : defaultFee);
  const initialEstimateTime = r.estimateTime || (state.settings && state.settings.defaultEstimateTime) || 'خلال 24-48 ساعة';
  const initialWarranty = r.warranty || (state.settings && state.settings.defaultWarranty) || '3 شهور ضد عيوب الصناعة';

  let initialFaultsReport = '';
  if(Array.isArray(r.faults) && r.faults.length){
    initialFaultsReport = r.faults.join('، ');
  } else if(r.faults){
    initialFaultsReport = String(r.faults);
  }
  if(r.faultNotes && r.faultNotes.trim()){
    if(initialFaultsReport) initialFaultsReport += ' - ';
    initialFaultsReport += r.faultNotes.trim();
  }
  if(!initialFaultsReport){
    initialFaultsReport = 'فحص شامل وتحديد العطل الفني وقطع الغيار المطلوبة';
  }

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:580px;max-height:92vh;overflow-y:auto;padding:22px;border-radius:14px;">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:14px;">
        <div>
          <h3 style="margin:0;font-size:17px;display:flex;align-items:center;gap:7px;color:var(--ink);">
            ${getSvgIcon("wallet", 18)} مقايسة وعرض تكلفة الصيانة (واتساب)
          </h3>
          <p style="margin:4px 0 0 0;font-size:12px;color:var(--ink-secondary);">إرسال عرض التكلفة للعميل قبل البدء مع توضيح رسوم الفحص في حالة الرفض</p>
        </div>
        <button class="btn btn-ghost btn-xs" id="closeCostEstModal" style="font-size:16px;line-height:1;padding:4px 8px;">&times;</button>
      </div>

      <!-- Receipt & Customer Info Card -->
      <div style="background:var(--paper3);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:12.5px;line-height:1.6;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div><b>العميل:</b> <span style="font-weight:700;color:var(--ink);">${cName}</span> ${cPhone ? `<span class="mono" style="color:var(--ink-secondary);font-size:11.5px;">(${cPhone})</span>` : ''}</div>
          <div><b>الإيصال:</b> <span class="mono font-bold" style="color:var(--primary);direction:ltr;unicode-bidi:isolate;">#${rNum}</span></div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-top:4px;">
          <div><b>الجهاز:</b> ${dCat} - ${dBrand} ${dModel}</div>
          <div><b>الحالة الحالية:</b> <span class="status-badge ${(STATUSES.find(s=>s.v===r.status)||{}).cls||'st-check'}">${escapeHtml(r.status)}</span></div>
        </div>
      </div>

      <!-- Form Inputs -->
      <div style="display:flex;flex-direction:column;gap:12px;">
        
        <!-- Faults & Diagnosis Report -->
        <div class="field" style="margin-bottom:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;flex-wrap:wrap;gap:6px;">
            <label style="font-weight:700;font-size:12.5px;display:flex;align-items:center;gap:5px;margin-bottom:0;">
              <span>${getSvgIcon("search", 14)}</span> تقرير الفحص وتشخيص العطل للعميل:
            </label>
            <button type="button" class="btn btn-xs" id="smartDraftFaultsBtn" style="background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;border:none;border-radius:6px;padding:3px 8px;font-size:11px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:4px;box-shadow:0 2px 4px rgba(124,58,237,0.2);" title="صياغة تقرير فحص احترافي مقنع للعميل بالذكاء الاصطناعي">
              <span>${getSvgIcon("chart", 13)}</span> صياغة ذكية
            </button>
          </div>
          <textarea id="estFaultsReport" rows="2" style="font-size:13px;line-height:1.5;padding:8px 10px;">${escapeHtml(initialFaultsReport)}</textarea>
        </div>

        <!-- Approval Box: Cost, Deposit, Remaining, Time, Warranty -->
        <div style="background:rgba(16,185,129,0.04);border:1px solid rgba(16,185,129,0.25);border-radius:10px;padding:12px 14px;">
          <div style="font-size:13px;font-weight:800;color:#047857;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
            <span>${getSvgIcon("check", 14)}</span> في حالة موافقة العميل على الصيانة (الإصلاح):
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
            <div class="field" style="margin-bottom:0;">
              <label style="font-size:11.5px;font-weight:700;">إجمالي تكلفة الصيانة المتوقعة (ج.م):</label>
              <input type="number" id="estCost" value="${initialCost || ''}" min="0" step="10" placeholder="مثال: 450" style="font-weight:800;font-size:14px;color:#047857;">
            </div>
            <div class="field" style="margin-bottom:0;">
              <label style="font-size:11.5px;font-weight:700;">العربون المدفوع مسبقاً (ج.م):</label>
              <input type="number" id="estDeposit" value="${initialDeposit || 0}" min="0" step="10" placeholder="0" style="font-weight:700;">
            </div>
          </div>

          <!-- Live Remaining Calculation Bar -->
          <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(16,185,129,0.1);padding:6px 12px;border-radius:6px;margin-bottom:10px;font-size:12.5px;">
            <span style="font-weight:600;color:var(--ink);">المبلغ المطلوب سداده عند الاستلام:</span>
            <span class="mono font-bold" id="estRemainingDisplay" style="font-size:15px;color:#047857;">0 ج.م</span>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div class="field" style="margin-bottom:0;">
              <label style="font-size:11.5px;">مدة الإصلاح المتوقعة:</label>
              <input type="text" id="estTime" value="${escapeHtml(initialEstimateTime)}" list="estTimeDatalist" placeholder="خلال 24-48 ساعة">
              <datalist id="estTimeDatalist">
                <option value="خلال نفس اليوم (فوري)">
                <option value="خلال 24 ساعة">
                <option value="خلال 24 إلى 48 ساعة">
                <option value="خلال 2 إلى 3 أيام">
                <option value="خلال 3 إلى 5 أيام">
                <option value="خلال أسبوع">
              </datalist>
            </div>
            <div class="field" style="margin-bottom:0;">
              <label style="font-size:11.5px;">فترة الضمان المعتمدة:</label>
              <input type="text" id="estWarranty" value="${escapeHtml(initialWarranty)}" list="estWarrantyDatalist" placeholder="3 شهور ضد عيوب الصناعة">
              <datalist id="estWarrantyDatalist">
                <option value="شهر واحد ضد عيوب الصناعة">
                <option value="3 شهور ضد عيوب الصناعة">
                <option value="6 شهور ضد عيوب الصناعة">
                <option value="سنة كاملة">
                <option value="ضمان على قطع الغيار المبدلة">
                <option value="بدون ضمان">
              </datalist>
            </div>
          </div>
        </div>

        <!-- Rejection Box: Inspection Fee with Quick Pills -->
        <div style="background:rgba(239,68,68,0.03);border:1px solid rgba(239,68,68,0.22);border-radius:10px;padding:12px 14px;">
          <div style="font-size:13px;font-weight:800;color:#b91c1c;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
            <span>${getSvgIcon("x", 14)}</span> في حالة عدم الرغبة في الإصلاح (رفض الصيانة):
          </div>

          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;">
            <div class="field" style="margin-bottom:0;flex:1;min-width:180px;">
              <label style="font-size:11.5px;font-weight:700;">تكلفة فحص وتشخيص العطل الفني (ج.م):</label>
              <input type="number" id="estInspectionFee" value="${initialInspectionFee}" min="0" step="10" placeholder="100" style="font-weight:800;font-size:14px;color:#b91c1c;">
            </div>
            <div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;padding-top:18px;">
              <button type="button" class="btn btn-xs btn-ghost est-fee-pill" data-fee="50" style="padding:4px 9px;">50 ج.م</button>
              <button type="button" class="btn btn-xs btn-ghost est-fee-pill" data-fee="100" style="padding:4px 9px;">100 ج.م</button>
              <button type="button" class="btn btn-xs btn-ghost est-fee-pill" data-fee="150" style="padding:4px 9px;">150 ج.م</button>
              <button type="button" class="btn btn-xs btn-ghost est-fee-pill" data-fee="200" style="padding:4px 9px;">200 ج.م</button>
              <button type="button" class="btn btn-xs btn-ghost est-fee-pill" data-fee="0" style="padding:4px 9px;">مجاناً (0)</button>
            </div>
          </div>
          <div style="font-size:11px;color:var(--ink-secondary);line-height:1.5;">
            <b>توضيح للعميل:</b> تُسدد هذه الرسوم فقط كأجر فحص وتشخيص في حال قرر العميل استلام جهازه دون تنفيذ الإصلاح، و<b>تسقط تماماً ولا تُدفع</b> في حال الموافقة على الصيانة.
          </div>
        </div>

        <!-- Live WhatsApp Message Preview -->
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <label style="font-size:12px;font-weight:700;color:var(--ink);margin:0;display:flex;align-items:center;gap:5px;">
              <span>${getSvgIcon("message", 14)}</span> معاينة حية لشكل رسالة واتساب:
            </label>
            <span style="font-size:11px;color:var(--ink-secondary);">تتحدث تلقائياً مع كل تغيير</span>
          </div>
          <div id="estWaPreview" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;font-size:12.5px;line-height:1.6;white-space:pre-wrap;direction:rtl;max-height:170px;overflow-y:auto;font-family:inherit;color:#14532d;box-shadow:inset 0 1px 2px rgba(0,0,0,0.03);"></div>
        </div>

        <!-- Save & Status Update Options -->
        <div style="background:var(--paper2);border:1px solid var(--line);border-radius:8px;padding:10px 12px;display:flex;flex-direction:column;gap:6px;">
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;margin:0;color:var(--ink);">
            <input type="checkbox" id="estSaveToReceipt" checked style="width:auto;"> حفظ التكلفة وملاحظات الفحص ورسوم الرفض في الإيصال وسحابياً
          </label>
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;margin:0;color:var(--ink);">
            <input type="checkbox" id="estSetUnderCheck" ${r.status !== 'قيد الفحص' && r.status !== 'الصيانة' ? 'checked' : ''} style="width:auto;"> تعيين حالة الإيصال إلى "قيد الفحص" (بانتظار موافقة العميل)
          </label>
        </div>

        <!-- Customer Decision Quick Actions -->
        <div style="background:#f8fafc;border:1px dashed #cbd5e1;border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px;">
          <div style="font-size:12px;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:6px;">
            <span>تسجيل قرار العميل:</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <button type="button" class="btn btn-sm" id="btnApproveQuote" style="background:#16a34a;color:#fff;border:none;font-weight:700;padding:8px;border-radius:6px;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;">
              <span>${getSvgIcon("check", 13)}</span> موافقة العميل (بدء الصيانة)
            </button>
            <button type="button" class="btn btn-sm" id="btnRejectQuote" style="background:#dc2626;color:#fff;border:none;font-weight:700;padding:8px;border-radius:6px;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;">
              <span>${getSvgIcon("x", 13)}</span> رفض العميل (رسوم فحص فقط)
            </button>
          </div>
          <div style="font-size:11px;color:var(--ink-secondary);line-height:1.4;">
            * عند الموافقة: يتحول الجهاز إلى <b>"الصيانة"</b> وتُعتمد تكلفة الإصلاح.<br>
            * عند الرفض: يتحول الجهاز إلى <b>"رفض العميل"</b> ويتم إعفاؤه من الإصلاح واعتماد رسوم الفحص والتشخيص فقط.
          </div>
        </div>

      </div>

      <!-- Action Buttons -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px;border-top:1px solid var(--line);padding-top:14px;flex-wrap:wrap;gap:10px;">
        <button class="btn btn-ghost btn-sm" id="cancelCostEstModal">إلغاء</button>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" id="copyCostEstMsgBtn" title="نسخ نص الرسالة للحافظة">${getSvgIcon("copy", 14)} نسخ الرسالة</button>
          <button class="btn btn-whatsapp btn-sm" id="sendCostEstWaBtn" style="font-weight:700;">${WA_ICON} إرسال عبر واتساب</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // References
  const costInput = overlay.querySelector('#estCost');
  const depositInput = overlay.querySelector('#estDeposit');
  const feeInput = overlay.querySelector('#estInspectionFee');
  const timeInput = overlay.querySelector('#estTime');
  const warrantyInput = overlay.querySelector('#estWarranty');
  const faultsReportInput = overlay.querySelector('#estFaultsReport');
  const remainingDisplay = overlay.querySelector('#estRemainingDisplay');
  const waPreview = overlay.querySelector('#estWaPreview');

  function getVals(){
    return {
      cost: Number(costInput.value || 0),
      deposit: Number(depositInput.value || 0),
      inspectionFee: Number(feeInput.value != null && feeInput.value !== '' ? feeInput.value : defaultFee),
      estimateTime: timeInput.value,
      warranty: warrantyInput.value,
      faultsReport: faultsReportInput.value
    };
  }

  function updatePreview(){
    const vals = getVals();
    const remaining = Math.max(0, vals.cost - vals.deposit);
    remainingDisplay.textContent = remaining.toLocaleString() + ' ج.م';
    const msg = buildCostEstimateWhatsappText(r, vals);
    waPreview.textContent = msg;
    return msg;
  }

  // Event Listeners for Live Updating
  [costInput, depositInput, feeInput, timeInput, warrantyInput, faultsReportInput].forEach(inp => {
    if(inp){
      inp.addEventListener('input', updatePreview);
      inp.addEventListener('change', updatePreview);
    }
  });

  overlay.querySelectorAll('.est-fee-pill').forEach(pill => {
    pill.addEventListener('click', ()=>{
      feeInput.value = pill.dataset.fee;
      updatePreview();
    });
  });

  // Initial update
  updatePreview();

  // Smart AI Drafting Handler
  const smartDraftBtn = overlay.querySelector('#smartDraftFaultsBtn');
  if(smartDraftBtn){
    smartDraftBtn.onclick = async () => {
      const origHtml = smartDraftBtn.innerHTML;
      try {
        smartDraftBtn.disabled = true;
        smartDraftBtn.innerHTML = '<span>جاري الصياغة الذكية...</span>';
        const drafted = await generateSmartCostEstimateDraft(r, faultsReportInput.value);
        if(drafted){
          faultsReportInput.value = drafted;
          updatePreview();
          showToast('تمت صياغة تقرير الفحص بنجاح', 'success');
        }
      } catch(err){
        if(err && err.code === 'NO_API_KEY'){
          showToast('يرجى ضبط مفتاح Gemini API أولاً من الإعدادات > الذكاء الاصطناعي', 'warning');
        } else {
          showToast(err.message || 'تعذر استدعاء الذكاء الاصطناعي', 'error');
        }
      } finally {
        smartDraftBtn.disabled = false;
        smartDraftBtn.innerHTML = origHtml;
      }
    };
  }

  // Close buttons
  overlay.querySelector('#closeCostEstModal').onclick = ()=>overlay.remove();
  overlay.querySelector('#cancelCostEstModal').onclick = ()=>overlay.remove();

  // Save logic helper
  async function applyUpdatesToReceiptIfNeeded(){
    const saveChecked = overlay.querySelector('#estSaveToReceipt').checked;
    const setCheckChecked = overlay.querySelector('#estSetUnderCheck').checked;
    if(!saveChecked && !setCheckChecked) return;

    const vals = getVals();
    let hasChanges = false;

    if(saveChecked){
      r.cost = vals.cost;
      r.deposit = vals.deposit;
      r.inspectionFee = vals.inspectionFee;
      r.estimateTime = vals.estimateTime;
      r.warranty = vals.warranty;
      r.quotationStatus = r.quotationStatus || 'sent';
      r.quotationSentAt = r.quotationSentAt || new Date().toISOString();
      if(vals.faultsReport){
        r.faultNotes = vals.faultsReport;
      }
      hasChanges = true;
    }

    if(setCheckChecked && r.status !== 'قيد الفحص'){
      r.status = 'قيد الفحص';
      hasChanges = true;
    }

    if(hasChanges){
      r.updatedBy = (state.user && state.user.name) || 'نظام';
      r.updatedAt = new Date().toISOString();
      recordAuditLog('مقايسة تكلفة', 'صيانة', `تم تسجيل مقايسة تكلفة للإيصال #${r.receiptNumber} (${vals.cost} ج.م / فحص: ${vals.inspectionFee} ج.م)`, r.id);
      
      const idx = (state.receipts || []).findIndex(x => String(x.id) === String(r.id));
      if(idx > -1) state.receipts[idx] = r;
      setCache('receipts', state.receipts);

      try {
        await saveReceiptRemote(r);
      } catch(err){
        console.warn('saveReceiptRemote in quote:', err);
      }
      if(typeof renderMain === 'function') renderMain();
    }
  }

  // Copy message button
  overlay.querySelector('#copyCostEstMsgBtn').onclick = async ()=>{
    const msg = updatePreview();
    try {
      if(navigator.clipboard && navigator.clipboard.writeText){
        await navigator.clipboard.writeText(msg);
      } else {
        const ta = document.createElement('textarea');
        ta.value = msg;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      showToast('تم نسخ نص المقايسة بنجاح', 'success');
      await applyUpdatesToReceiptIfNeeded();
    } catch(e){
      showToast('تعذر النسخ التلقائي', 'error');
    }
  };

  // Send WhatsApp button
  overlay.querySelector('#sendCostEstWaBtn').onclick = async ()=>{
    const msg = updatePreview();
    overlay.remove();
    await applyUpdatesToReceiptIfNeeded();
    sendWhatsapp(r, msg);
  };

  // Approve Customer Decision
  const approveBtn = overlay.querySelector('#btnApproveQuote');
  if(approveBtn){
    approveBtn.onclick = async ()=>{
      const vals = getVals();
      if(!confirm(`هل أنت متأكد من تسجيل موافقة العميل على الصيانة؟\n\n- تكلفة الصيانة: ${vals.cost} ج.م\n- العربون: ${vals.deposit} ج.م\n- المتبقي: ${Math.max(0, vals.cost - vals.deposit)} ج.م\n\nسيتم تحويل حالة الجهاز إلى "الصيانة" وبدء العمل فوراً.`)) return;

      r.cost = vals.cost;
      r.deposit = vals.deposit;
      r.inspectionFee = vals.inspectionFee;
      r.estimateTime = vals.estimateTime;
      r.warranty = vals.warranty;
      if(vals.faultsReport){
        r.faultNotes = vals.faultsReport;
      }
      r.status = 'الصيانة';
      r.quotationStatus = 'approved';
      r.quotationDecidedAt = new Date().toISOString();
      r.updatedBy = (state.user && state.user.name) || 'نظام';
      r.updatedAt = new Date().toISOString();

      recordAuditLog('موافقة صيانة', 'صيانة', `تم تسجيل موافقة العميل على مقايسة الإيصال #${r.receiptNumber} بقيمة ${vals.cost} ج.م وبدء الصيانة`, r.id);

      const idx = (state.receipts || []).findIndex(x => String(x.id) === String(r.id));
      if(idx > -1) state.receipts[idx] = r;
      setCache('receipts', state.receipts);

      try {
        await saveReceiptRemote(r);
      } catch(err){
        console.warn('saveReceiptRemote in approve:', err);
      }

      overlay.remove();
      showToast(`تم تسجيل موافقة العميل وتحويل الجهاز إلى الصيانة بنجاح`, 'success');
      if(typeof renderMain === 'function') renderMain();
    };
  }

  // Reject Customer Decision
  const rejectBtn = overlay.querySelector('#btnRejectQuote');
  if(rejectBtn){
    rejectBtn.onclick = async ()=>{
      const vals = getVals();
      if(!confirm(`هل أنت متأكد من تسجيل رفض العميل للصيانة؟\n\n- سيتم إعفاء العميل من أي تكاليف صيانة أو قطع غيار.\n- سيتم احتساب رسوم فحص وتشخيص العطل المعتمدة (${vals.inspectionFee} ج.م) فقط.\n- سيتم تحويل حالة الجهاز إلى "رفض العميل".`)) return;

      r.cost = vals.inspectionFee; // Set receipt billable cost to the diagnosis inspection fee!
      r.deposit = vals.deposit;
      r.inspectionFee = vals.inspectionFee;
      r.estimateTime = vals.estimateTime;
      r.warranty = '';
      if(vals.faultsReport){
        r.faultNotes = vals.faultsReport;
      }
      r.status = 'رفض العميل';
      r.quotationStatus = 'rejected';
      r.quotationDecidedAt = new Date().toISOString();
      r.updatedBy = (state.user && state.user.name) || 'نظام';
      r.updatedAt = new Date().toISOString();

      recordAuditLog('رفض صيانة', 'صيانة', `تم تسجيل رفض العميل لمقايسة الإيصال #${r.receiptNumber} واعتماد رسوم فحص وتشخيص بقيمة ${vals.inspectionFee} ج.م`, r.id);

      const idx = (state.receipts || []).findIndex(x => String(x.id) === String(r.id));
      if(idx > -1) state.receipts[idx] = r;
      setCache('receipts', state.receipts);

      try {
        await saveReceiptRemote(r);
      } catch(err){
        console.warn('saveReceiptRemote in reject:', err);
      }

      overlay.remove();
      showToast(`تم تسجيل رفض العميل واعتماد رسوم الفحص والتشخيص (${vals.inspectionFee} ج.م)`, 'info');
      if(typeof renderMain === 'function') renderMain();
    };
  }
}

/* ============================================================
   Google Gemini AI Integration Engine (محرك الذكاء الاصطناعي)
   ============================================================ */

function renderAiMarkdownToHtml(md){
  if(!md) return '';
  let s = escapeHtml(String(md).trim());

  // Bold: **text**
  s = s.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

  // Italic: *text*
  s = s.replace(/\*(.*?)\*/g, '<i>$1</i>');

  // Code / Badges: `text`
  s = s.replace(/`([^`]+)`/g, '<code class="mono" style="background:rgba(124,58,237,0.08);color:#6d28d9;padding:1px 5px;border-radius:4px;font-size:12px;font-weight:600;">$1</code>');

  // Headings
  s = s.replace(/^###\s*(.*?)$/gm, '<h4 style="margin:14px 0 6px 0;font-size:13.5px;color:var(--ink);font-weight:800;display:flex;align-items:center;gap:6px;"><span style="color:#7c3aed;">▸</span> $1</h4>');
  s = s.replace(/^##\s*(.*?)$/gm, '<h3 style="margin:16px 0 8px 0;font-size:15px;color:var(--primary);font-weight:800;border-bottom:1px dashed var(--line);padding-bottom:4px;">$1</h3>');
  s = s.replace(/^#\s*(.*?)$/gm, '<h2 style="margin:18px 0 10px 0;font-size:16px;color:var(--ink);font-weight:900;">$1</h2>');

  // List bullets: * or - or •
  s = s.replace(/^[\*\-•]\s*(.*?)$/gm, '<div style="display:flex;gap:6px;align-items:flex-start;margin:3px 0;padding-right:4px;"><span style="color:#7c3aed;font-size:13px;line-height:1.5;">•</span><div style="flex:1;line-height:1.5;">$1</div></div>');

  // Numbered items: 1. text
  s = s.replace(/^(\d+)\.\s*(.*?)$/gm, '<div style="display:flex;gap:6px;align-items:flex-start;margin:4px 0;padding-right:4px;"><span class="mono font-bold" style="color:#7c3aed;font-size:12px;min-width:18px;line-height:1.6;">$1.</span><div style="flex:1;line-height:1.5;">$2</div></div>');

  // Paragraphs & newlines
  s = s.replace(/\n\n+/g, '<div style="height:10px;"></div>');
  s = s.replace(/\n/g, '<br>');

  return s;
}

async function callGeminiAI(options = {}){
  const cfg = getGeminiSettings();
  const apiKey = (options.apiKey || cfg.apiKey || '').trim();
  if(!apiKey){
    const err = new Error('لم يتم إدخال مفتاح Google Gemini API بعد. يرجى ضبط المفتاح في قسم الإعدادات > الذكاء الاصطناعي.');
    err.code = 'NO_API_KEY';
    throw err;
  }

  const model = options.model || cfg.model || 'gemini-3.5-flash';
  const temperature = options.temperature != null ? options.temperature : (cfg.temperature ?? 0.7);
  const maxTokens = options.maxTokens || 2048;
  const systemPrompt = options.systemPrompt || cfg.systemInstruction || DEFAULT_GEMINI_SETTINGS.systemInstruction;

  let contents = [];
  if(Array.isArray(options.contents) && options.contents.length > 0){
    contents = options.contents;
  } else if(options.prompt){
    contents = [{ role: 'user', parts: [{ text: options.prompt }] }];
  } else {
    throw new Error('لم يتم تحديد نص للطلب (prompt is missing)');
  }

  const requestBody = {
    contents: contents,
    generationConfig: {
      temperature: temperature,
      maxOutputTokens: maxTokens
    }
  };

  if(systemPrompt){
    requestBody.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
  } catch(netErr){
    throw new Error('تعذر الاتصال بخوادم Google Gemini. يرجى التحقق من اتصال الإنترنت.');
  }

  const data = await response.json().catch(() => ({}));

  if(!response.ok){
    const apiError = data.error || {};
    const errMsg = apiError.message || 'خطأ غير معروف أثناء استدعاء الذكاء الاصطناعي';
    const status = apiError.status || '';

    if(errMsg.toLowerCase().includes('api key') || errMsg.includes('API_KEY_INVALID') || (status === 'INVALID_ARGUMENT' && errMsg.includes('API_KEY'))){
      throw new Error('مفتاح Google Gemini API غير صالح. يرجى التأكد من نسخه بشكل صحيح من Google AI Studio.');
    }
    if(status === 'RESOURCE_EXHAUSTED' || response.status === 429){
      throw new Error('تم تجاوز حد الاستخدام المسموح لنموذج Gemini مؤقتاً (Rate Limit). يرجى المحاولة بعد قليل.');
    }
    if(response.status === 503 || errMsg.includes('high demand') || errMsg.includes('overloaded')){
      throw new Error('خوادم Google تواجه ضغطاً مؤقتاً حالياً (503). يرجى المحاولة بعد قليل أو تجربة نموذج gemini-3.5-flash-lite.');
    }
    if(response.status === 404 || errMsg.includes('models/')){
      throw new Error(`النموذج (${model}) غير متاح لحسابك. يرجى اختيار gemini-3.5-flash من الإعدادات.`);
    }
    throw new Error(`خطأ Gemini (${response.status}): ${errMsg}`);
  }

  const candidate = data.candidates && data.candidates[0];
  if(!candidate || !candidate.content || !candidate.content.parts){
    if(candidate && candidate.finishReason === 'SAFETY'){
      throw new Error('تم حظر الرد من قبل معايير الأمان التابعة لـ Google.');
    }
    if(candidate && candidate.finishReason === 'MAX_TOKENS'){
      throw new Error('تم استهلاك حد الرموز (Tokens) بالكامل قبل اكتمال الرد.');
    }
    throw new Error('لم يُرجع نموذج Gemini أي محتوى في الرد.');
  }

  const parts = candidate.content.parts || [];
  let visibleText = '';
  for(const p of parts){
    if(p.text && !p.thought){
      visibleText += p.text;
    }
  }
  if(!visibleText.trim()){
    visibleText = parts.map(p => p.text || '').join('').trim();
  }

  if(!visibleText.trim()){
    if(candidate.finishReason === 'MAX_TOKENS'){
      throw new Error('تم استهلاك حد الرموز أثناء تفكير النموذج (Thinking). يرجى زيادة حد الرموز أو استخدام gemini-3.5-flash-lite.');
    }
    throw new Error('لم يُرجع نموذج Gemini أي محتوى في الرد.');
  }

  return visibleText.trim();
}

async function testGeminiConnection(apiKey, model){
  const start = Date.now();
  const testApiKey = (apiKey || getGeminiSettings().apiKey || '').trim();
  const testModel = model || getGeminiSettings().model || 'gemini-3.5-flash';

  if(!testApiKey){
    throw new Error('يرجى كتابة أو لصق مفتاح API أولاً لتجربة الاتصال.');
  }

  const prompt = 'اختبار اتصال سريع: رد بكلمة واحدة فقط: "متصل"';
  const reply = await callGeminiAI({
    apiKey: testApiKey,
    model: testModel,
    prompt: prompt,
    temperature: 0.1,
    maxTokens: 1000
  });

  const latencyMs = Date.now() - start;
  return {
    success: true,
    latencyMs: latencyMs,
    reply: reply.trim(),
    model: testModel
  };
}

async function generateSmartCostEstimateDraft(rawR, currentNotes = ''){
  const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
  const dCat = (r.device && r.device.category) || 'جهاز';
  const dBrand = r.device ? (r.device.brand === 'أخرى' ? r.device.brandOther : r.device.brand) : '';
  const dModel = (r.device && r.device.model) || '';
  const faults = Array.isArray(r.faults) ? r.faults.join('، ') : String(r.faults || 'غير محدد');

  const prompt = `أنت مهندس صيانة إلكترونيات وأجهزة محترف في مركز صيانة ميكروتك (MicroTech).
المطلوب: صياغة تقرير فحص وتشخيص فني للعطل موجه للعميل مباشرة في رسالة مقايسة التكلفة بالواتساب.

بيانات الجهاز:
- نوع الجهاز: ${dCat}
- الماركة والموديل: ${dBrand} ${dModel}
- العطل والشكوى المسجلة: ${faults}
- ملاحظات الفحص الحالية للمهندس: ${currentNotes || 'لا توجد ملاحظات إضافية'}

الشروط والتعليمات:
1. اكتب التقرير بلغة عربية احترافية وواضحة ومبسطة يفهمها العميل العادي وتقنعه بسبب التكلفة وضرورة الإصلاح.
2. اجعل الصياغة في حدود 2 إلى 4 أسطر فقط.
3. وضّح الخلل الفني وما سيتم عمله في الصيانة (مثال: فحص وتغيير المكونات التالفة بدائرة الباور/الشحن، عمل شبلنة أو تغيير آي سي، فحص مسارات الفولت، عمل اختبارات الإجهاد والحرارة).
4. لا تضع أي ترحيبات أو تحيات أو توقيعات، أخرج فقط نص التقرير المباشر.`;

  try {
    const drafted = await callGeminiAI({ prompt, maxTokens: 1500, temperature: 0.4 });
    return drafted.trim().replace(/^["']|["']$/g, '');
  } catch(err) {
    console.warn('Gemini API call failed or no key set, falling back to offline expert hardware diagnosis engine:', err);
    return generateOfflineExpertCostDraft(r, currentNotes);
  }
}

function generateOfflineExpertCostDraft(r, currentNotes = '') {
  const combined = ((r.faults ? (Array.isArray(r.faults) ? r.faults.join(' ') : String(r.faults)) : '') + ' ' + (r.notes || '') + ' ' + (currentNotes || '')).toLowerCase();

  if (combined.includes('باور') || combined.includes('power') || combined.includes('شورت') || combined.includes('ماس') || combined.includes('فاصل') || combined.includes('قفل') || combined.includes('dead')) {
    return 'تم فحص الدوائر الإلكترونية الرئيسية ومسارات الجهد العالي (19V)، وتبين وجود ماس كهربائي (شورت) مع تلف في عناصر التغذية الرئيسية (موسفتات الدخل ومكثفات التنعيم). تتطلب الصيانة إزالة القصر، استبدال القطع التالفة بقطع أصلية، ومراجعة استقرار خطوط التغذية لحماية المعالج واللوحة الأم.';
  }
  if (combined.includes('مية') || combined.includes('ماء') || combined.includes('سائل') || combined.includes('عصير') || combined.includes('شاي') || combined.includes('قهوة') || combined.includes('liquid') || combined.includes('water')) {
    return 'تبين بعد الفحص الميكروسكوبي وجود آثار تسريب سوائل وأكسدة على مسارات التغذية ومكونات اللوحة الأم. تتطلب الصيانة تفكيك الجهاز بالكامل، تنظيف الأكسدة كيميائياً بالموجات فوق الصوتية، معالجة المسارات المتآكلة، واستبدال المقاومات والمكثفات المتضررة لضمان عدم حدوث قصر مستقبلي.';
  }
  if (combined.includes('شاشة') || combined.includes('screen') || combined.includes('عرض') || combined.includes('display') || combined.includes('فلاتة') || combined.includes('مكسور') || combined.includes('خطوط')) {
    return 'تم فحص دائرة العرض وإشارة الفيديو، وتبين وجود كسر/تلف في بنية الشاشة الداخلية مع حاجة لفحص فلاتة نقل الإشارة (EDP Cable) ومسارات الإضاءة الخلفية (Backlight Circuit). تشمل الصيانة تركيب شاشة بديلة أصلية مطابقة للمواصفات ومعايرة الألوان والإضاءة واختبار ثبات العرض.';
  }
  if (combined.includes('حرارة') || combined.includes('سخونة') || combined.includes('مروحة') || combined.includes('صوت عالي') || combined.includes('fan') || combined.includes('يطفي') || combined.includes('heat')) {
    return 'أظهر الفحص ارتفاعاً حرجاً في درجات حرارة المعالج والشريحة الرسومية نتيجة جفاف المعجون الحراري وانسداد مسارات التبريد وتهالك مروحة التبريد. تتطلب الصيانة صيانة نظام التبريد بالكامل، تنظيف غرف الطرد الحراري، وضع معجون حراري احترافي عالي الكفاءة، واختبار استقرار الجهاز تحت الضغط (Stress Test).';
  }
  if (combined.includes('شحن') || combined.includes('بطارية') || combined.includes('سوكت') || combined.includes('شاحن') || combined.includes('dc') || combined.includes('jack') || combined.includes('charge')) {
    return 'تم فحص دائرة الشحن ومنظومة الطاقة، وتبين وجود تلف/خلخلة في منفذ الشحن (DC Power Jack) مع عدم استقرار في إشارة الشحن الواصلة لآي سي إدارة الطاقة (Charging IC). تتطلب الصيانة صيانة وتثبيت منفذ الشحن واستبدال المكونات التالفة لضمان الشحن السليم وحماية البطارية.';
  }
  if (combined.includes('بايوس') || combined.includes('bios') || combined.includes('شاشة سوداء') || combined.includes('black screen') || combined.includes('رمشة')) {
    return 'أظهر الفحص تلفاً في البرمجة الثابتة لشريحة البايوْس (Corrupted BIOS Firmware) مما يمنع إتمام دورة الإقلاع الأولي للوحة الأم (POST). تتطلب الصيانة إعادة برمجة وشحن شريحة الـ BIOS بملف أصلي متوافق مع الموديل والسيريال وفحص مسارات الفولت المغذية للشريحة (3.3V / 1.8V).';
  }
  if (combined.includes('ssd') || combined.includes('هارد') || combined.includes('بطء') || combined.includes('ram') || combined.includes('رام')) {
    return 'تم فحص قطاعات التخزين ومنظومة الذاكرة، وتبين وجود قطاعات تالفة/بطء شديد في استجابة وحدة التخزين مما يؤثر على كفاءة واستقرار النظام. تشمل الصيانة تركيب وحدة تخزين سريعة SSD/M.2 متوافقة، نقل البيانات المهمة، وتهيئة بيئة تشغيل مستقرة وخالية من أخطاء الذاكرة.';
  }

  return 'تم إجراء الفحص الأولي للقطع الحيوية للجهاز وحصر الخلل في دوائر التشغيل والتحكم. تشمل أعمال الصيانة فحص المكونات التالفة واستبدالها ومراجعة دوائر الحماية واختبار أداء الجهاز بالكامل لضمان التشغيل المستقر والمعتمد.';
}

async function generateAiDiagnosis(rawR, additionalNotes = ''){
  const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
  const dCat = (r.device && r.device.category) || 'جهاز';
  const dBrand = r.device ? (r.device.brand === 'أخرى' ? r.device.brandOther : r.device.brand) : '';
  const dModel = (r.device && r.device.model) || '';
  const faults = Array.isArray(r.faults) ? r.faults.join('، ') : String(r.faults || 'غير محدد');
  const existingNotes = r.notes || r.faultNotes || '';

  const prompt = `أنت الخبير الفني وكبير مهندسي الصيانة والإلكترونيات لمركز ميكروتك (MicroTech).
قم بإجراء تحليل تشخيصي فني دقيق لجهاز الصيانة التالي وقدم دليلاً عملياً يساعد فني الصيانة على طاولة الفحص:

بيانات الجهاز:
- نوع الجهاز: ${dCat}
- الماركة: ${dBrand}
- الموديل: ${dModel}
- الأعطال والشكوى المسجلة: ${faults}
- ملاحظات الاستلام: ${existingNotes || 'لا توجد'}
${additionalNotes ? `- ملاحظات وقياسات إضافية من الفني: ${additionalNotes}` : ''}

المطلوب تقديم تحليل فني غني ومنظم يشمل الأقسام التالية بوضوح:
### 1. الأسباب المحتملة للعطل (Root Causes)
مرتبة من الأكثر شيوعاً في هذا الموديل إلى الأقل شيوعاً.

### 2. خطوات الفحص والقياس العملي (Bench Diagnostic Steps)
خطوات محددة للقياس بالآفوميتر وملاحظة سحب الأمبير بالباور سبلاي مع الفولتيات المتوقعة (مثل: 19V, 5V, 3.3V, 1.05V, VCORE...).

### 3. القطع والمكونات المشتبه بتلفها (Suspect Components)
الدوائر المتهمة (آي سي شحن، آي سي باور، موسفتات الدخل، رامات، مكثفات تانتاليوم أو سيراميك، شورت صريح، أو عطل شحنة بايوْس BIOS).

### 4. بدائل وحلول مقترحة ونصائح وقائية
أرقام بدائل مشهورة، نصائح للحرارة واللحام، واختبار ما بعد الإصلاح.

### 5. تقرير مقترح للعميل
صياغة مبسطة ومقنعة تشرح للعميل سبب العطل وضرورة الصيانة ليتم وضعها في مقايسة التكلفة.`;

  return await callGeminiAI({ prompt, maxTokens: 2500, temperature: 0.6 });
}

function openAiDiagnosisModal(rawR){
  if(!rawR){
    showToast('لم يتم تحديد إيصال الصيانة', 'error');
    return;
  }
  const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
  const cfg = getGeminiSettings();

  const prevModal = document.getElementById('aiDiagnosisModal');
  if(prevModal) prevModal.remove();

  const safeTargetId = String(r.id != null ? r.id : (r.ID != null ? r.ID : r.receiptNumber));
  const rNum = String(r.receiptNumber || r.ReceiptNumber || '');
  const cName = (typeof formatCustomerFullName === 'function') ? formatCustomerFullName(r) : ((r.customer && r.customer.name) || extractCustomerName(r) || 'عميل');
  const dCat = (r.device && r.device.category) || 'جهاز';
  const dBrand = r.device ? (r.device.brand === 'أخرى' ? r.device.brandOther : r.device.brand) : '';
  const dModel = (r.device && r.device.model) || '';
  const faults = Array.isArray(r.faults) ? r.faults.join('، ') : String(r.faults || 'غير محدد');

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'aiDiagnosisModal';
  overlay.style.zIndex = '12000';

  let chatHistory = [];
  let lastDiagnosisText = '';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:760px;max-height:92vh;display:flex;flex-direction:column;padding:20px;border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,0.3);">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;border-radius:8px;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;">${getSvgIcon("tool", 18)}</div>
          <div>
            <h3 style="margin:0;font-size:16px;color:var(--ink);display:flex;align-items:center;gap:8px;">
              المساعد الذكي لتشخيص الأعطال
              <span class="mono" style="background:rgba(124,58,237,0.1);color:#7c3aed;font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;border:1px solid rgba(124,58,237,0.25);">
                ${cfg.model || 'gemini-3.5-flash'}
              </span>
            </h3>
            <div style="font-size:11.5px;color:var(--ink-secondary);margin-top:2px;">
              تحليل إلكتروني متخصص • اقتراح القياسات والبدائل • مركز صيانة ميكروتك
            </div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" id="closeAiDiagModal" style="border-radius:50%;width:32px;height:32px;padding:0;display:flex;align-items:center;justify-content:center;">&times;</button>
      </div>

      <!-- Device Summary Bar -->
      <div style="background:var(--paper2);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:12.5px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div><b>الإيصال:</b> <span class="mono font-bold" style="color:var(--primary);direction:ltr;unicode-bidi:isolate;">#${escapeHtml(rNum)}</span> • <b>العميل:</b> ${escapeHtml(cName)}</div>
        <div><b>الجهاز:</b> <span style="font-weight:700;color:var(--ink);">${escapeHtml(dCat)} - ${escapeHtml(dBrand)} ${escapeHtml(dModel)}</span></div>
        <div style="width:100%;background:var(--paper);padding:6px 10px;border-radius:6px;border:1px dashed var(--line);font-size:12px;margin-top:2px;">
          <b style="color:var(--amber-text);">العطل المسجل:</b> ${escapeHtml(faults)}
        </div>
      </div>

      <!-- Diagnostic Body Container (Scrollable) -->
      <div id="aiDiagBody" style="flex:1;overflow-y:auto;padding-left:6px;padding-right:6px;margin-bottom:14px;min-height:220px;">
        ${!cfg.apiKey ? `
          <div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.3);border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
            <div style="display:flex;justify-content:center;margin-bottom:10px;">${getSvgIcon("key", 36)}</div>
            <h4 style="margin:0 0 8px 0;font-size:16px;color:var(--ink);">مفتاح Google Gemini API غير مضبوط</h4>
            <p style="font-size:13px;color:var(--ink-secondary);max-width:460px;margin:0 auto 16px auto;line-height:1.6;">
              للاستفادة من ميزات الذكاء الاصطناعي في تشخيص الأعطال وصياغة تقارير المقايسة، يرجى إدخال مفتاح API الخاص بك. يمكنك استخراجه مجاناً في دقيقة واحدة من Google AI Studio.
            </p>
            <div style="display:flex;justify-content:center;gap:10px;">
              <button class="btn btn-primary font-bold" id="goToAiSettingsBtn">
                ${getSvgIcon("settings", 14)} الانتقال إلى إعدادات الذكاء الاصطناعي
              </button>
            </div>
          </div>
        ` : `
          <div id="aiLoadingBox" style="text-align:center;padding:40px 20px;">
            <div class="spinner" style="width:36px;height:36px;border-width:3px;border-color:rgba(124,58,237,0.2);border-top-color:#7c3aed;margin:0 auto 14px auto;"></div>
            <div style="font-weight:700;font-size:14px;color:var(--ink);">جاري تحليل العطل بواسطة Gemini AI...</div>
            <div style="font-size:12px;color:var(--ink-secondary);margin-top:4px;">يتم الآن فحص الأعطال المحتملة ومسارات القياس للموديل ${escapeHtml(dBrand)} ${escapeHtml(dModel)}</div>
          </div>
          <div id="aiResultContent" style="display:none;background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:16px 18px;font-size:13px;line-height:1.7;"></div>
        `}
      </div>

      <!-- Quick Action Buttons -->
      <div id="aiActionButtons" style="display:none;gap:8px;flex-wrap:wrap;padding:10px 0;border-top:1px solid var(--line);margin-bottom:10px;">
        <button type="button" class="btn btn-xs" id="insertToNotesBtn" style="background:#059669;color:#fff;font-weight:700;border:none;border-radius:6px;display:inline-flex;align-items:center;gap:4px;">
          ${getSvgIcon("fileText", 13)} إدراج في ملاحظات الإيصال
        </button>
        <button type="button" class="btn btn-xs" id="openEstFromAiBtn" style="background:#0284c7;color:#fff;font-weight:700;border:none;border-radius:6px;display:inline-flex;align-items:center;gap:4px;">
          ${getSvgIcon("wallet", 13)} فتح مقايسة التكلفة
        </button>
        <button type="button" class="btn btn-xs btn-ghost" id="copyAiResultBtn" style="border-radius:6px;display:inline-flex;align-items:center;gap:4px;">
          ${getSvgIcon("copy", 13)} نسخ التحليل
        </button>
        <button type="button" class="btn btn-xs btn-ghost" id="reDiagnoseBtn" style="border-radius:6px;margin-right:auto;display:inline-flex;align-items:center;gap:4px;">
          ${getSvgIcon("refresh", 13)} إعادة التشخيص
        </button>
      </div>

      <!-- Technician Follow-Up Chat Box -->
      <div id="aiChatBoxWrap" style="display:none;background:var(--paper2);border:1px solid var(--line);border-radius:12px;padding:10px 12px;">
        <div style="font-size:11.5px;font-weight:700;color:var(--ink-secondary);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
          <span>${getSvgIcon("message", 14)}</span> استشارة ومتابعة فنية للفني (Technician Live Bench Q&A):
        </div>
        <div id="aiChatThread" style="max-height:140px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;margin-bottom:8px;font-size:12px;"></div>
        <div style="display:flex;gap:8px;">
          <input type="text" id="aiFollowUpInput" placeholder="اكتب استفساراً للفحص (مثلاً: قست خط 3.3V ولقيت شورت، أو ما هو بديل آي سي الشحن؟)..." style="flex:1;font-size:12.5px;padding:7px 10px;border-radius:8px;">
          <button type="button" class="btn btn-primary btn-sm" id="sendAiFollowUpBtn" style="background:#7c3aed;border-color:#7c3aed;padding:0 14px;font-weight:700;">
            إرسال
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#closeAiDiagModal').onclick = () => overlay.remove();

  const goToSettingsBtn = overlay.querySelector('#goToAiSettingsBtn');
  if(goToSettingsBtn){
    goToSettingsBtn.onclick = () => {
      overlay.remove();
      state.currentSection = 'settings';
      state.settingsTab = 'ai';
      render();
    };
    return;
  }

  const aiLoadingBox = overlay.querySelector('#aiLoadingBox');
  const aiResultContent = overlay.querySelector('#aiResultContent');
  const aiActionButtons = overlay.querySelector('#aiActionButtons');
  const aiChatBoxWrap = overlay.querySelector('#aiChatBoxWrap');
  const aiChatThread = overlay.querySelector('#aiChatThread');
  const followUpInput = overlay.querySelector('#aiFollowUpInput');
  const sendFollowUpBtn = overlay.querySelector('#sendAiFollowUpBtn');

  async function runDiagnosis(){
    if(aiLoadingBox){
      aiLoadingBox.style.display = 'block';
      aiLoadingBox.innerHTML = `
        <div class="spinner" style="width:36px;height:36px;border-width:3px;border-color:rgba(124,58,237,0.2);border-top-color:#7c3aed;margin:0 auto 14px auto;"></div>
        <div style="font-weight:700;font-size:14px;color:var(--ink);">جاري تحليل العطل بواسطة Gemini AI...</div>
        <div style="font-size:12px;color:var(--ink-secondary);margin-top:4px;">يتم الآن فحص الأعطال المحتملة ومسارات القياس للموديل ${escapeHtml(dBrand)} ${escapeHtml(dModel)}</div>
      `;
    }
    if(aiResultContent) aiResultContent.style.display = 'none';
    if(aiActionButtons) aiActionButtons.style.display = 'none';
    if(aiChatBoxWrap) aiChatBoxWrap.style.display = 'none';

    try {
      const diagText = await generateAiDiagnosis(r);
      lastDiagnosisText = diagText;

      chatHistory = [
        { role: 'user', parts: [{ text: `قم بتحليل عطل الجهاز: ${dCat} ${dBrand} ${dModel}، العطل: ${faults}` }] },
        { role: 'model', parts: [{ text: diagText }] }
      ];

      if(aiLoadingBox) aiLoadingBox.style.display = 'none';
      if(aiResultContent){
        aiResultContent.innerHTML = renderAiMarkdownToHtml(diagText);
        aiResultContent.style.display = 'block';
      }
      if(aiActionButtons) aiActionButtons.style.display = 'flex';
      if(aiChatBoxWrap) aiChatBoxWrap.style.display = 'block';
    } catch(err){
      if(aiLoadingBox){
        aiLoadingBox.innerHTML = `
          <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:18px;text-align:center;">
            <div style="display:flex;justify-content:center;margin-bottom:8px;">${getSvgIcon("alert", 32)}</div>
            <div style="font-weight:700;color:var(--red);margin-bottom:6px;">تعذر إتمام التحليل الذكي</div>
            <div style="font-size:12.5px;color:var(--ink-secondary);line-height:1.5;">${escapeHtml(err.message || 'حدث خطأ غير متوقع')}</div>
            <button class="btn btn-ghost btn-sm" id="retryAiDiagBtn" style="margin-top:12px;color:var(--primary);">${getSvgIcon("refresh", 13)} إعادة المحاولة</button>
          </div>
        `;
        const retryBtn = overlay.querySelector('#retryAiDiagBtn');
        if(retryBtn) retryBtn.onclick = runDiagnosis;
      }
    }
  }

  const insertToNotesBtn = overlay.querySelector('#insertToNotesBtn');
  if(insertToNotesBtn){
    insertToNotesBtn.onclick = async () => {
      if(!lastDiagnosisText) return;
      const summaryLine = `[تشخيص AI - ${new Date().toLocaleDateString('ar-EG')}]: ${lastDiagnosisText.replace(/\n+/g, ' ').substring(0, 300)}...`;
      r.notes = (r.notes ? r.notes + '\n\n' : '') + summaryLine;
      const idx = (state.receipts || []).findIndex(x => String(x.id) === String(r.id));
      if(idx > -1) state.receipts[idx] = r;
      setCache('receipts', state.receipts);
      try {
        await saveReceiptRemote(r);
      } catch(e){}
      showToast('تم إدراج ملخص التشخيص في ملاحظات الإيصال بنجاح', 'success');
    };
  }

  const openEstFromAiBtn = overlay.querySelector('#openEstFromAiBtn');
  if(openEstFromAiBtn){
    openEstFromAiBtn.onclick = () => {
      overlay.remove();
      openCostEstimateModal(r);
    };
  }

  const copyAiResultBtn = overlay.querySelector('#copyAiResultBtn');
  if(copyAiResultBtn){
    copyAiResultBtn.onclick = () => {
      if(!lastDiagnosisText) return;
      navigator.clipboard.writeText(lastDiagnosisText).then(() => {
        showToast('تم نسخ التحليل بالكامل إلى الحافظة', 'success');
      }).catch(() => {
        showToast('تعذر النسخ تلقائياً', 'error');
      });
    };
  }

  const reDiagnoseBtn = overlay.querySelector('#reDiagnoseBtn');
  if(reDiagnoseBtn){
    reDiagnoseBtn.onclick = runDiagnosis;
  }

  async function handleFollowUp(){
    const q = (followUpInput.value || '').trim();
    if(!q) return;

    followUpInput.value = '';
    followUpInput.disabled = true;
    sendFollowUpBtn.disabled = true;

    const userBubble = document.createElement('div');
    userBubble.style.cssText = 'background:var(--paper);border:1px solid var(--line);border-radius:8px;padding:6px 10px;margin-bottom:4px;border-right:3px solid var(--primary);align-self:flex-end;max-width:85%;';
    userBubble.innerHTML = `<b style="color:var(--primary);font-size:11px;">الفني:</b> <span>${escapeHtml(q)}</span>`;
    aiChatThread.appendChild(userBubble);

    const aiBubble = document.createElement('div');
    aiBubble.style.cssText = 'background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.25);border-radius:8px;padding:6px 10px;margin-bottom:4px;border-left:3px solid #7c3aed;max-width:92%;';
    aiBubble.innerHTML = `<b style="color:#7c3aed;font-size:11px;">المساعد الذكي:</b> <span class="mono">جاري المعالجة...</span>`;
    aiChatThread.appendChild(aiBubble);
    aiChatThread.scrollTop = aiChatThread.scrollHeight;

    chatHistory.push({ role: 'user', parts: [{ text: q }] });

    try {
      const reply = await callGeminiAI({
        contents: chatHistory,
        maxTokens: 1000,
        temperature: 0.5
      });
      chatHistory.push({ role: 'model', parts: [{ text: reply }] });
      aiBubble.innerHTML = `<b style="color:#7c3aed;font-size:11px;">المساعد الذكي:</b> <div>${renderAiMarkdownToHtml(reply)}</div>`;
    } catch(err){
      aiBubble.innerHTML = `<b style="color:var(--red);font-size:11px;">خطأ:</b> <span style="color:var(--red);">${escapeHtml(err.message || 'تعذر الحصول على إجابة')}</span>`;
    } finally {
      followUpInput.disabled = false;
      sendFollowUpBtn.disabled = false;
      followUpInput.focus();
      aiChatThread.scrollTop = aiChatThread.scrollHeight;
    }
  }

  if(sendFollowUpBtn && followUpInput){
    sendFollowUpBtn.onclick = handleFollowUp;
    followUpInput.onkeydown = (e) => {
      if(e.key === 'Enter'){
        e.preventDefault();
        handleFollowUp();
      }
    };
  }

  runDiagnosis();
}

window.openAiDiagnosisModalDirect = function(safeId, rNum){
  const r = findReceiptByIdOrNum(safeId, rNum);
  if(r) openAiDiagnosisModal(r);
  else showToast('لم يتم العثور على الإيصال المطلوب', 'error');
};

/* ---------------- Cumulative Maintenance History & Re-Intake Engine ---------------- */
function getDeviceMaintenanceHistory(rawR){
  if(!rawR) return [];
  try {
    const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
    const all = state.receipts || [];
    const historyMap = new Map();

    const rIdStr = String(r.id != null ? r.id : '');
    const rNumStr = String(r.receiptNumber || '');
    const rootId = String(r.rootReceiptId || r.previousReceiptId || rIdStr);

    all.forEach(rawRec => {
      if(!rawRec) return;
      const rec = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawRec) || rawRec) : rawRec;
      const recIdStr = String(rec.id != null ? rec.id : '');
      const recNumStr = String(rec.receiptNumber || '');
      const recRootStr = String(rec.rootReceiptId || '');
      const recPrevIdStr = String(rec.previousReceiptId || '');
      const recPrevNumStr = String(rec.previousReceiptNumber || '');
      const rPrevIdStr = String(r.previousReceiptId || '');
      const rPrevNumStr = String(r.previousReceiptNumber || '');

      if((recIdStr && recIdStr === rIdStr) ||
         (recRootStr && (recRootStr === rootId || recRootStr === rIdStr)) ||
         (recPrevIdStr && recPrevIdStr === rIdStr) ||
         (rPrevIdStr && recIdStr === rPrevIdStr) ||
         (recPrevNumStr && rNumStr && recPrevNumStr === rNumStr) ||
         (rPrevNumStr && recNumStr && rPrevNumStr === recNumStr)){
        historyMap.set(recIdStr || recNumStr, rec);
      }
    });

    const cPhone = String(r.customer && r.customer.phone || '').trim();
    const cName = String(r.customer && r.customer.name || '').trim().toLowerCase();
    const dBrand = String(r.device && (r.device.brand==='أخرى' ? r.device.brandOther : r.device.brand) || '').trim().toLowerCase();
    const dModel = String(r.device && r.device.model || '').trim().toLowerCase();
    const dCat = String(r.device && r.device.category || '').trim().toLowerCase();

    if((cPhone || cName) && (dBrand || dModel)){
      all.forEach(rawRec => {
        if(!rawRec) return;
        const rec = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawRec) || rawRec) : rawRec;
        const recIdStr = String(rec.id != null ? rec.id : '');
        const recNumStr = String(rec.receiptNumber || '');
        const mapKey = recIdStr || recNumStr;
        if(historyMap.has(mapKey)) return;

        const recPhone = String(rec.customer && rec.customer.phone || '').trim();
        const recName = String(rec.customer && rec.customer.name || '').trim().toLowerCase();
        const recBrand = String(rec.device && (rec.device.brand==='أخرى' ? rec.device.brandOther : rec.device.brand) || '').trim().toLowerCase();
        const recModel = String(rec.device && rec.device.model || '').trim().toLowerCase();
        const recCat = String(rec.device && rec.device.category || '').trim().toLowerCase();

        const sameCust = (cPhone && recPhone === cPhone) || (cName && recName === cName);
        const sameBrand = dBrand && recBrand && dBrand === recBrand;
        const sameModel = dModel && recModel && dModel === recModel;
        const sameCat = !dCat || !recCat || dCat === recCat;

        if(sameCust && sameBrand && (sameModel || (!dModel && !recModel)) && sameCat){
          historyMap.set(mapKey, rec);
        }
      });
    }

    const list = Array.from(historyMap.values());
    list.sort((a,b) => {
      const da = new Date(a.createdAt || a.date || 0).getTime();
      const db = new Date(b.createdAt || b.date || 0).getTime();
      if(da !== db) return da - db;
      return String(a.receiptNumber || '').localeCompare(String(b.receiptNumber || ''));
    });

    return list;
  } catch(err){
    console.warn('getDeviceMaintenanceHistory error:', err);
    return [];
  }
}

function renderDeviceHistoryCard(rawR){
  if(!rawR) return '';
  try {
    const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
    const history = getDeviceMaintenanceHistory(r);
    if(!history || !history.length) return '';

  let html = `
    <div class="card" style="background:var(--paper3);border:1px solid var(--line);border-radius:var(--radius-sm);padding:12px;margin-top:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border-bottom:1px solid var(--line);padding-bottom:6px;">
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="display:inline-flex;align-items:center;">${getSvgIcon('fileText', 16)}</span>
          <div>
            <h4 style="margin:0;font-size:13.5px;font-weight:900;color:var(--ink);">سجل الصيانة التراكمي للجهاز</h4>
            <div style="font-size:11px;color:var(--ink-secondary);">إجمالي مرات دخول هذا الجهاز للصيانة: <b class="mono" style="color:var(--primary);">${history.length}</b> ${history.length>1?'(زيارات سابقة وحالية)':'(الدخول الأول)'}</div>
          </div>
        </div>
        <button type="button" class="btn btn-amber btn-xs" id="historyReIntakeBtn" title="إعادة إدخال الجهاز للصيانة بدورة جديدة">${getSvgIcon("refresh", 13)} إعادة إدخال الجهاز</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto;padding-right:2px;">
  `;

  history.forEach((h, idx) => {
    const isCurrent = String(h.id) === String(r.id) || (h.receiptNumber && h.receiptNumber === r.receiptNumber);
    const cycleNum = h.serviceCycle || (idx + 1);
    const costTotal = Number(h.cost || 0) + Number(h.partsCost || 0);
    const paidTotal = Number(h.deposit || 0);
    const rem = Math.max(0, costTotal - paidTotal + Number(h.refunded || 0));
    const hFaultsStr = (Array.isArray(h.faults) ? h.faults.join('، ') : String(h.faults || '')) || 'غير محدد';

    html += `
      <div style="border-radius:var(--radius-sm);border:1px solid ${isCurrent ? 'var(--primary)' : 'var(--line)'};background:${isCurrent ? 'var(--primary-subtle, rgba(24,119,242,0.06))' : 'var(--paper2)'};padding:8px 10px;font-size:11.5px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:5px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="badge ${isCurrent ? 'badge-blue' : 'badge-gray'} mono" style="font-weight:900;">#${escapeHtml(h.receiptNumber)}</span>
            <span style="font-weight:800;color:var(--ink);">دورة ${cycleNum}</span>
            ${h.reIntakeReason ? `<span class="badge badge-amber" style="font-size:10px;">${escapeHtml(h.reIntakeReason)}</span>` : ''}
            ${isCurrent ? `<span class="badge badge-green" style="font-size:10px;">الإيصال الحالي</span>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="mono" style="color:var(--ink-secondary);font-size:11px;">${getSvgIcon("calendar", 12)} ${cleanDate(h.date || h.createdAt)}</span>
            <span class="badge ${h.status==='تم التسليم'?'badge-green':(h.status==='مكتمل'?'badge-blue':'badge-amber')}">${escapeHtml(h.status)}</span>
            ${!isCurrent ? `<button type="button" class="btn btn-ghost btn-xs view-hist-receipt-btn" data-histid="${escapeHtml(String(h.id))}" data-histnum="${escapeHtml(String(h.receiptNumber))}" style="padding:1px 6px;font-size:10.5px;">عرض ↗</button>` : ''}
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(160px, 1fr));gap:4px 8px;color:var(--ink-secondary);font-size:11px;">
          <div><b>الأعطال:</b> <span style="color:var(--ink);">${escapeHtml(hFaultsStr)}</span></div>
          <div><b>الفني:</b> <span style="color:var(--ink);">${escapeHtml(h.technician || '-')}</span></div>
          <div><b>التشخيص:</b> <span style="color:var(--ink);">${escapeHtml(h.faultNotes || '-')}</span></div>
          <div><b>المالي:</b> تكلفة <b class="mono" style="color:var(--ink);">${costTotal}</b> | مدفوع <b class="mono" style="color:var(--green-text);">${paidTotal}</b> ${rem > 0 ? `| متبقي <b class="mono" style="color:var(--red-text);">${rem}</b>` : ''}</div>
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;
  return html;
  } catch(e){
    console.warn('renderDeviceHistoryCard error:', e);
    return '';
  }
}

function openReIntakeDeviceModal(previousReceipt){
  if(!previousReceipt){
    showToast('لم يتم تحديد إيصال الجهاز السابق', 'error');
    return;
  }
  const prevRec = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(previousReceipt) || previousReceipt) : previousReceipt;
  const cycleCount = (Number(prevRec.serviceCycle) || 1) + 1;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const cName = escapeHtml((prevRec.customer && prevRec.customer.name) || extractCustomerName(prevRec) || 'عميل');
  const cPhone = escapeHtml((prevRec.customer && prevRec.customer.phone) || extractCustomerPhone(prevRec) || 'بدون هاتف');
  const dCat = escapeHtml((prevRec.device && prevRec.device.category) || 'جهاز');
  const dBrand = escapeHtml(prevRec.device ? (prevRec.device.brand==='أخرى'?prevRec.device.brandOther:prevRec.device.brand) : '');
  const dModel = escapeHtml((prevRec.device && prevRec.device.model) || '');
  const prevFaultsStr = (Array.isArray(prevRec.faults) ? prevRec.faults.join('، ') : String(prevRec.faults || '')) || '-';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:640px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
        <h3 style="margin:0;font-size:16.5px;font-weight:900;color:var(--ink);">
          ${getSvgIcon("refresh", 16)} إعادة إدخال الجهاز للصيانة <span class="mono" style="color:var(--amber-text);font-size:14px;">(دورة صيانة ${cycleCount})</span>
        </h3>
        <button class="btn btn-ghost btn-xs" id="closeReIntakeModalBtn">إغلاق</button>
      </div>

      <!-- Previous Receipt Summary -->
      <div style="background:var(--paper3);border:1px solid var(--line);border-radius:var(--radius-sm);padding:10px 12px;margin-bottom:14px;font-size:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span><b>العميل:</b> ${cName} (${cPhone})</span>
          <span class="badge badge-gray mono">إيصال سابق: #${escapeHtml(prevRec.receiptNumber)}</span>
        </div>
        <div><b>الجهاز:</b> ${dCat} — ${dBrand} ${dModel}</div>
        <div style="color:var(--ink-secondary);margin-top:2px;"><b>الأعطال السابقة:</b> ${escapeHtml(prevFaultsStr)} | <b>الفني السابق:</b> ${escapeHtml(prevRec.technician||'-')}</div>
      </div>

      <!-- Re-Intake Reason Selector -->
      <div class="field" style="margin-bottom:12px;">
        <label style="font-weight:800;margin-bottom:6px;display:block;">نوع أو سبب إعادة الإدخال:</label>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(170px, 1fr));gap:8px;" id="reIntakeReasonOptions">
          <label style="border:2px solid var(--amber);border-radius:var(--radius-sm);padding:8px 10px;cursor:pointer;background:rgba(245,158,11,0.06);display:flex;flex-direction:column;gap:3px;" id="lblReasonWarranty">
            <div style="display:flex;align-items:center;gap:6px;">
              <input type="radio" name="reIntakeReasonRadio" value="ضمان / صيانة راجعة" checked>
              <b style="color:var(--amber-text);font-size:12px;">ضمان / صيانة راجعة</b>
            </div>
            <span style="font-size:11px;color:var(--ink-secondary);">نفس العطل السابق تحت الضمان (0 ج.م)</span>
          </label>

          <label style="border:1px solid var(--line);border-radius:var(--radius-sm);padding:8px 10px;cursor:pointer;background:var(--paper2);display:flex;flex-direction:column;gap:3px;" id="lblReasonNew">
            <div style="display:flex;align-items:center;gap:6px;">
              <input type="radio" name="reIntakeReasonRadio" value="عطل جديد لنفس الجهاز">
              <b style="color:var(--primary);font-size:12px;">عطل جديد لنفس الجهاز</b>
            </div>
            <span style="font-size:11px;color:var(--ink-secondary);">عطل مختلف بتكلفة كشف/صيانة جديدة</span>
          </label>

          <label style="border:1px solid var(--line);border-radius:var(--radius-sm);padding:8px 10px;cursor:pointer;background:var(--paper2);display:flex;flex-direction:column;gap:3px;" id="lblReasonParts">
            <div style="display:flex;align-items:center;gap:6px;">
              <input type="radio" name="reIntakeReasonRadio" value="قطع غيار / صيانة تكميلية">
              <b style="color:var(--green-text);font-size:12px;">قطع غيار / تكميلية</b>
            </div>
            <span style="font-size:11px;color:var(--ink-secondary);">إضافة قطعة غيار أو صيانة إضافية</span>
          </label>
        </div>
      </div>

      <!-- Faults Selection -->
      <div class="field" style="margin-bottom:12px;">
        <label style="font-weight:800;">الأعطال المرصودة في هذه الدورة</label>
        <div class="chip-group" id="reIntakeFaultChips" style="margin-top:6px;">
          ${getCommonFaults().map(f=>`<div class="chip ${(previousReceipt.faults||[]).includes(f)?'sel':''}" data-f="${f}">${f}</div>`).join('')}
        </div>
      </div>

      <!-- Notes / Diagnosis -->
      <div class="field" style="margin-bottom:12px;">
        <label>ملاحظات الاستلام والتشخيص الجديد</label>
        <textarea id="reIntakeNotes" placeholder="اكتب شكوى العميل عند إعادة الاستلام وملاحظات الفحص..." style="height:60px;">إعادة استلام الجهاز (صيانة راجعة بضمان) تابعة للإيصال السابق #${previousReceipt.receiptNumber}</textarea>
      </div>

      <!-- Technician and Cost Details -->
      <div class="grid3" style="margin-bottom:12px;">
        <div class="field">
          <label>الفني المكلف</label>
          <select id="reIntakeTech">
            <option value="">-- اختر فني --</option>
            ${state.technicians.map(t=>`<option ${t===previousReceipt.technician?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>تكلفة الخدمة (ج.م)</label>
          <input id="reIntakeCost" type="number" value="0">
          <span id="reIntakeCostHint" style="font-size:10.5px;color:var(--amber-text);display:block;margin-top:2px;">(0 ج.م مشمول بالضمان)</span>
        </div>
        <div class="field">
          <label>دفعة مقدمة (ج.م)</label>
          <input id="reIntakeDeposit" type="number" value="0">
        </div>
        <div class="field">
          <label>طريقة دفع الدفعة المقدمة</label>
          <select id="reIntakePayMethod" style="font-weight:700;">
            ${getActivePaymentMethods().map(pm => `<option value="${escapeHtml(pm.name)}">${escapeHtml(pm.name)}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="actions-row" style="margin-top:14px;border-top:1px solid var(--line);padding-top:12px;">
        <button class="btn btn-ghost btn-sm" id="cancelReIntakeBtn">إلغاء</button>
        <button class="btn btn-amber btn-sm" id="confirmReIntakeBtn" style="font-weight:800;">
          تأكيد إدخال الجهاز وإنشاء إيصال جديد
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#closeReIntakeModalBtn').onclick = ()=>overlay.remove();
  overlay.querySelector('#cancelReIntakeBtn').onclick = ()=>overlay.remove();

  const costInp = overlay.querySelector('#reIntakeCost');
  const costHint = overlay.querySelector('#reIntakeCostHint');
  const notesArea = overlay.querySelector('#reIntakeNotes');

  function updateReasonUi(){
    const checked = overlay.querySelector('input[name="reIntakeReasonRadio"]:checked');
    const val = checked ? checked.value : 'ضمان / صيانة راجعة';
    const lblW = overlay.querySelector('#lblReasonWarranty');
    const lblN = overlay.querySelector('#lblReasonNew');
    const lblP = overlay.querySelector('#lblReasonParts');

    if(lblW) lblW.style.border = val==='ضمان / صيانة راجعة' ? '2px solid var(--amber)' : '1px solid var(--line)';
    if(lblN) lblN.style.border = val==='عطل جديد لنفس الجهاز' ? '2px solid var(--primary)' : '1px solid var(--line)';
    if(lblP) lblP.style.border = val==='قطع غيار / صيانة تكميلية' ? '2px solid var(--green)' : '1px solid var(--line)';

    if(val === 'ضمان / صيانة راجعة'){
      costInp.value = 0;
      costHint.textContent = '(0 ج.م مشمول بالضمان)';
      costHint.style.color = 'var(--amber-text)';
      notesArea.value = `إعادة استلام الجهاز (صيانة راجعة بضمان) تابعة للإيصال السابق #${previousReceipt.receiptNumber}`;
    } else if(val === 'عطل جديد لنفس الجهاز'){
      costInp.value = 50;
      costHint.textContent = '(كشف / صيانة جديدة لعطل مستقل)';
      costHint.style.color = 'var(--primary)';
      notesArea.value = `إدخال الجهاز لعطل جديد (دورة ${cycleCount}) - الإيصال السابق #${previousReceipt.receiptNumber}`;
      overlay.querySelectorAll('#reIntakeFaultChips .chip').forEach(c => c.classList.remove('sel'));
    } else {
      costInp.value = 0;
      costHint.textContent = '(إضافة قطع غيار أو صيانة تكميلية)';
      costHint.style.color = 'var(--green-text)';
      notesArea.value = `صيانة تكميلية أو طلب قطع غيار إضافية - الإيصال السابق #${previousReceipt.receiptNumber}`;
    }
  }

  overlay.querySelectorAll('input[name="reIntakeReasonRadio"]').forEach(r => {
    r.onchange = updateReasonUi;
  });

  overlay.querySelectorAll('#reIntakeFaultChips .chip').forEach(c => {
    c.onclick = ()=>c.classList.toggle('sel');
  });

  overlay.querySelector('#confirmReIntakeBtn').onclick = async ()=>{
    const selectedRadio = overlay.querySelector('input[name="reIntakeReasonRadio"]:checked');
    const reason = selectedRadio ? selectedRadio.value : 'ضمان / صيانة راجعة';
    const notes = notesArea.value.trim();
    const tech = overlay.querySelector('#reIntakeTech').value;
    const cost = Number(costInp.value || 0);
    const deposit = Number(overlay.querySelector('#reIntakeDeposit').value || 0);

    const selectedFaults = [];
    overlay.querySelectorAll('#reIntakeFaultChips .chip.sel').forEach(c => selectedFaults.push(c.dataset.f));

    const btn = overlay.querySelector('#confirmReIntakeBtn');
    btn.disabled = true;
    btn.textContent = 'جارٍ تسجيل الإدخال...';

    try {
      const newRecNum = (typeof nextReceiptNumber === 'function') ? await nextReceiptNumber() : ('MT-' + Date.now());
      const rootId = previousReceipt.rootReceiptId || previousReceipt.id;

      const now = new Date();
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'م' : 'ص';
      const h12 = hours % 12 || 12;
      const currentTimeStr = `${h12}:${minutes} ${ampm}`;

      const newReceipt = {
        id: 'r_' + now.getTime(),
        receiptNumber: newRecNum,
        date: (typeof todayISO === 'function') ? todayISO() : now.toISOString().slice(0, 10),
        time: currentTimeStr,
        receivedAt: now.toISOString(),
        status: 'قيد الفحص',
        customer: JSON.parse(JSON.stringify(previousReceipt.customer)),
        device: JSON.parse(JSON.stringify(previousReceipt.device)),
        faults: selectedFaults.length ? selectedFaults : [...(previousReceipt.faults || [])],
        faultNotes: notes,
        technician: tech,
        cost: cost,
        partsCost: 0,
        deposit: deposit,
        refunded: 0,
        paid: (cost === 0 && deposit === 0) ? true : (deposit >= cost && cost > 0),
        previousReceiptId: previousReceipt.id,
        previousReceiptNumber: previousReceipt.receiptNumber,
        rootReceiptId: rootId,
        reIntakeReason: reason,
        serviceCycle: cycleCount,
        nextReceiptId: '',
        nextReceiptNumber: '',
        maintenanceHistory: [],
        createdBy: (state.user && state.user.name) || 'نظام',
        createdAt: now.toISOString(),
        updatedBy: (state.user && state.user.name) || 'نظام',
        updatedAt: now.toISOString()
      };

      state.receipts.unshift(newReceipt);

      previousReceipt.nextReceiptId = newReceipt.id;
      previousReceipt.nextReceiptNumber = newReceipt.receiptNumber;
      previousReceipt.updatedBy = (state.user && state.user.name) || 'نظام';
      previousReceipt.updatedAt = new Date().toISOString();

      await saveReceiptRemote(newReceipt);
      await saveReceiptRemote(previousReceipt);

      if(deposit > 0){
        try{
          const rePayMethod = overlay.querySelector('#reIntakePayMethod') ? overlay.querySelector('#reIntakePayMethod').value : 'نقدي (كاش)';
          await savePaymentRemote(newReceipt.id, deposit, 'دفعة مقدمة عند إعادة إدخال الجهاز', rePayMethod);
          await refreshPayments();
        }catch(e){}
      }

      if(typeof pushLog === 'function'){
        pushLog(`إعادة إدخال جهاز للصيانة برقم إيصال جديد #${newRecNum} (سابق #${previousReceipt.receiptNumber} - ${reason})`);
      }

      overlay.remove();
      showToast(`تم إدخال الجهاز بنجاح برقم إيصال جديد #${newRecNum}`, 'success');
      renderMain();

      setTimeout(()=>{
        openReceiptDetail(newReceipt);
      }, 350);

    } catch(err){
      console.error(err);
      showToast('حدث خطأ أثناء إدخال الجهاز: ' + err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'تأكيد إدخال الجهاز وإنشاء إيصال جديد';
    }
  };
}

/* ---------------- Inventory Spare Part Picker Modal ---------------- */
function openInventoryPartPickerModal(onSelect){
  const existing = document.getElementById('invPartPickerOverlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'invPartPickerOverlay';
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '10060';

  const inventory = Array.isArray(state.inventory) ? state.inventory : [];
  let filterCategory = 'all';
  let searchQuery = '';

  const categories = ['all', 'صيانة', 'كمبيوتر', 'إكسسوار', 'أخرى'];

  overlay.innerHTML = `
    <div class="modal-card" style="max-width: 600px; width: 95%; max-height: 85vh; display:flex; flex-direction:column; background:var(--bg-card, #fff); border-radius:14px; overflow:hidden; border:1px solid var(--border-color, #cbd5e1); box-shadow:0 20px 40px rgba(0,0,0,0.25);">
      <div style="padding:12px 16px; background:linear-gradient(135deg, #1e293b, #0f172a); color:#fff; display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="display:inline-flex;align-items:center;">${getSvgIcon('package', 18)}</span>
          <div>
            <h3 style="margin:0; font-size:14px; font-weight:800; color:#fff;">اختيار قطعة غيار من رصيد المخزن</h3>
            <div style="font-size:11px; color:#94a3b8;">حدد الصنف لإدراجه في إيصال الصيانة وخصمه آلياً</div>
          </div>
        </div>
        <button type="button" id="closePartPickerBtn" style="background:rgba(255,255,255,0.1); border:none; color:#cbd5e1; width:28px; height:28px; border-radius:50%; cursor:pointer; font-size:13px;">&times;</button>
      </div>

      <div style="padding:12px 16px; display:flex; flex-direction:column; gap:10px; flex:1; overflow:hidden;">
        <!-- Search & Filter Controls -->
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <input type="text" id="partPickerSearchInp" placeholder="بحث باسم الصنف أو الباركود..." style="flex:1; min-width:200px; padding:7px 10px; font-size:12.5px; border:1.5px solid var(--line); border-radius:8px;" autofocus>
        </div>
        <div style="display:flex; gap:5px; flex-wrap:wrap;" id="partPickerCatChips">
          ${categories.map(c => `
            <button type="button" class="btn btn-xs part-cat-btn ${c==='all'?'btn-primary':'btn-ghost'}" data-cat="${c}" style="font-size:11px; padding:3px 8px; border-radius:6px;">
              ${c==='all' ? 'الكل' : (c==='صيانة' ? 'قطع صيانة' : c)}
            </button>
          `).join('')}
        </div>

        <!-- Items List -->
        <div id="partPickerItemsContainer" style="flex:1; overflow-y:auto; min-height:220px; max-height:48vh; border:1px solid var(--line); border-radius:8px; padding:6px; background:var(--paper2); display:flex; flex-direction:column; gap:6px;">
          <!-- Items rendered here -->
        </div>
      </div>

      <div style="padding:10px 16px; background:var(--paper3); border-top:1px solid var(--line); display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:11px; color:var(--ink-secondary);" id="partPickerCountText">جارٍ التحميل...</span>
        <button type="button" class="btn btn-ghost btn-xs" id="cancelPartPickerBtn">إلغاء</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  function renderItems(){
    const container = overlay.querySelector('#partPickerItemsContainer');
    const countText = overlay.querySelector('#partPickerCountText');
    if(!container) return;

    let items = [...inventory];
    if(filterCategory !== 'all'){
      items = items.filter(x => (x.Category || 'صيانة') === filterCategory);
    }
    if(searchQuery.trim()){
      const q = searchQuery.trim().toLowerCase();
      items = items.filter(x => 
        (x.Name && x.Name.toLowerCase().includes(q)) || 
        (x.Barcode && String(x.Barcode).includes(q)) || 
        (x.Category && x.Category.toLowerCase().includes(q))
      );
    }

    if(countText) countText.innerText = `عدد الأصناف المتاحة: ${items.length} صنف`;

    if(!items.length){
      container.innerHTML = `
        <div style="text-align:center; padding:30px 10px; color:var(--ink-secondary); font-size:12px;">
          لا توجد أصناف مطابقة في المخزن.
        </div>`;
      return;
    }

    container.innerHTML = items.map(item => {
      const qty = Number(item.Quantity || 0);
      const isOut = qty <= 0;
      const sellPrice = Number(item.SellPrice || item.PurchasePrice || 0);
      const costPrice = Number(item.PurchasePrice || 0);
      return `
        <div class="part-item-row" data-id="${escapeHtml(item.ID)}" style="display:flex; justify-content:space-between; align-items:center; background:var(--paper); padding:8px 10px; border-radius:6px; border:1px solid var(--line); cursor:pointer; transition:all 0.15s;">
          <div>
            <div style="font-size:12.5px; font-weight:800; color:var(--ink);">${escapeHtml(item.Name)}</div>
            <div style="display:flex; gap:8px; align-items:center; font-size:11px; color:var(--ink-secondary); margin-top:2px;">
              <span class="mono">باركود: ${escapeHtml(item.Barcode || '-')}</span>
              <span>•</span>
              <span class="badge" style="background:${isOut ? '#fee2e2' : '#dcfce7'}; color:${isOut ? '#991b1b' : '#166534'}; font-size:10px; font-weight:800; padding:1px 6px;">
                ${isOut ? 'الرصيد 0' : `الرصيد المتاح: ${qty}`}
              </span>
            </div>
          </div>
          <div style="text-align:left;">
            <div class="mono" style="font-size:13px; font-weight:900; color:var(--primary);">${sellPrice.toLocaleString()} ج.م</div>
            <div style="font-size:10px; color:var(--slate-400);">تكلفة: ${costPrice.toLocaleString()} ج.م</div>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.part-item-row').forEach(row => {
      row.onclick = () => {
        const id = row.dataset.id;
        const sel = inventory.find(x => x.ID === id);
        if(sel){
          if(typeof onSelect === 'function') onSelect(sel);
          overlay.remove();
        }
      };
    });
  }

  renderItems();

  const searchInp = overlay.querySelector('#partPickerSearchInp');
  if(searchInp){
    searchInp.oninput = (e) => {
      searchQuery = e.target.value;
      renderItems();
    };
  }

  overlay.querySelectorAll('.part-cat-btn').forEach(btn => {
    btn.onclick = () => {
      filterCategory = btn.dataset.cat;
      overlay.querySelectorAll('.part-cat-btn').forEach(b => {
        if(b.dataset.cat === filterCategory){
          b.className = 'btn btn-xs part-cat-btn btn-primary';
        } else {
          b.className = 'btn btn-xs part-cat-btn btn-ghost';
        }
      });
      renderItems();
    };
  });

  overlay.querySelector('#closePartPickerBtn').onclick = () => overlay.remove();
  overlay.querySelector('#cancelPartPickerBtn').onclick = () => overlay.remove();
}

/* ---------------- Receipt Detail & Full Edit ---------------- */
async function openReceiptDetail(rawR){
  if(!rawR){
    showToast('لم يتم العثور على الإيصال المطلوب', 'error');
    return;
  }
  try {
    const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
    const initialStatus = r.status;
    const remaining = Number(r.cost||0)+Number(r.partsCost||0)+Number(r.otherAccountAmount||0)-Number(r.deposit||0)+Number(r.refunded||0);
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const curTitle = extractCustomerTitle(r) || (r.customer && r.customer.title) || '';
    const curName = extractCustomerName(r) || (r.customer && r.customer.name) || '';
    const titleOptions = [''].concat(CUSTOMER_TITLES).map(t=>`<option value="${escapeHtml(t)}" ${curTitle===t?'selected':''}>${t ? escapeHtml(t) : '-- بدون لقب --'}</option>`).join('');

    overlay.innerHTML = `
    <div class="modal-content" style="max-width:700px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
        <h3 style="margin:0;font-size:17px;display:flex;align-items:center;gap:6px;">${getSvgIcon("tool", 18)} إيصال صيانة: <span class="mono" style="color:var(--primary);">${escapeHtml(r.receiptNumber)}</span></h3>
        <div style="display:flex;align-items:center;gap:6px;">
          <button type="button" class="btn btn-xs" id="detailAiDiagBtn" style="background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;border:none;border-radius:6px;font-weight:700;display:inline-flex;align-items:center;gap:4px;box-shadow:0 2px 5px rgba(124,58,237,0.25);cursor:pointer;" title="المساعد الذكي لتشخيص العطل واقتراح القياسات">
            <span>${getSvgIcon('chart', 14)}</span> تشخيص الأعطال
          </button>
          <button class="btn btn-ghost btn-xs" id="closeDetailBtn">إغلاق</button>
        </div>
      </div>

      <div style="background:var(--paper2);border:1px solid var(--line);border-radius:var(--radius-sm);padding:7px 12px;margin-bottom:12px;font-size:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
        <div><b>تاريخ ووقت الاستلام:</b> <span class="mono">${cleanDate(r.date)}</span> <b class="mono" style="color:var(--primary);margin-right:4px;">${formatReceiptTime(r) || r.time || 'غير محدد'}</b></div>
        ${r.createdBy ? `<div style="color:var(--ink-secondary);font-size:11.5px;">الموظف المستلم: <b>${escapeHtml(r.createdBy)}</b></div>` : ''}
      </div>

      ${r.previousReceiptNumber ? `
        <div style="background:rgba(245,158,11,0.1);border:1px solid var(--amber);border-radius:var(--radius-sm);padding:8px 12px;margin-bottom:12px;font-size:12px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span style="display:inline-flex;margin-left:4px;">${getSvgIcon("refresh", 14)}</span>
            <b>دورة صيانة ${r.serviceCycle || 2}:</b> مرتبط بالإيصال السابق <b class="mono">#${escapeHtml(r.previousReceiptNumber)}</b> <span style="color:var(--ink-secondary);font-size:11.5px;">${r.reIntakeReason ? '— ' + escapeHtml(r.reIntakeReason) : ''}</span>
          </div>
          <button type="button" class="btn btn-amber btn-xs view-hist-receipt-btn" data-histnum="${escapeHtml(r.previousReceiptNumber)}">عرض الإيصال السابق ↗</button>
        </div>
      ` : ''}

      ${r.nextReceiptNumber ? `
        <div style="background:rgba(59,130,246,0.1);border:1px solid var(--primary);border-radius:var(--radius-sm);padding:8px 12px;margin-bottom:12px;font-size:12px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span style="font-size:15px;margin-left:4px;">ℹ️</span>
            <b>تمت إعادة إدخال الجهاز للصيانة لاحقاً:</b> برقم إيصال جديد <b class="mono">#${escapeHtml(r.nextReceiptNumber)}</b>
          </div>
          <button type="button" class="btn btn-blue btn-xs view-hist-receipt-btn" data-histnum="${escapeHtml(r.nextReceiptNumber)}">عرض الإيصال الجديد ↗</button>
        </div>
      ` : ''}

      <div style="display:grid;grid-template-columns:140px 1fr 1fr;gap:10px;">
        <div class="field">
          <label>اللقب (اختياري)</label>
          <select id="eTitle">
            ${titleOptions}
          </select>
        </div>
        <div class="field"><label>اسم العميل</label><input id="eName" value="${escapeHtml(curName)}"></div>
        <div class="field"><label>رقم هاتف العميل</label><input id="ePhone" value="${escapeHtml(r.customer.phone||'')}"></div>
      </div>

      ${(Array.isArray(r.devices) && r.devices.length > 1) ? `
        <div style="background:var(--paper2);border:1px solid var(--line);border-radius:var(--radius-sm);padding:8px 10px;margin-bottom:12px;">
          <div style="font-size:11.5px;font-weight:800;color:var(--ink-secondary);margin-bottom:6px;">
            أجهزة هذا الإيصال (${r.devices.length} أجهزة) — اضغط للتبديل وتعديل بيانات كل جهاز وأعطاله:
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;" id="detailDevTabsBar">
            ${r.devices.map((dv, idx) => {
              const isAct = idx === 0;
              const b = dv.brand === 'أخرى' ? dv.brandOther : (dv.brand || '');
              const t = `${dv.category || 'جهاز'} ${b} ${dv.model || ''}`.trim() || `جهاز #${idx+1}`;
              return `
                <button type="button" class="btn btn-xs ${isAct ? 'btn-primary' : 'btn-ghost'} detail-dev-tab-btn" data-didx="${idx}" style="font-size:12px;">
                  ${escapeHtml(t)}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
      <div class="grid4">
        <div class="field"><label>فئة الجهاز</label><input id="eCat" value="${escapeHtml(r.device.category||'')}"></div>
        <div class="field"><label>الماركة</label><input id="eBrand" value="${escapeHtml(r.device.brand||'')}"></div>
        <div class="field"><label>الموديل</label><input id="eModel" value="${escapeHtml(r.device.model||'')}"></div>
        <div class="field"><label>كلمة السر (اختياري)</label><input id="ePassword" value="${escapeHtml((r.device && r.device.password) || r.password || '')}" placeholder="باسورد الجهاز إن وجد"></div>
      </div>
      <div class="field"><label>الأعطال</label>
        <div class="chip-group" id="editFaultChips">
          ${getCommonFaults().map(f=>`<div class="chip ${(r.faults||[]).includes(f)?'sel':''}" data-f="${f}">${f}</div>`).join('')}
        </div>
      </div>
      <div class="field"><label>ملاحظات التشخيص والفحص</label><textarea id="eFaultNotes">${r.faultNotes||''}</textarea></div>
      
      <div class="grid2">
        <div class="field"><label>الفني المسؤول</label>
          <select id="eTech"><option value="">--</option>${(Array.isArray(state.technicians)?state.technicians:[]).map(t=>`<option ${t===r.technician?'selected':''}>${t}</option>`).join('')}</select>
        </div>
        <div class="field"><label>حالة الجهاز</label>
          <select id="eStatus">${STATUSES.map(s=>`<option ${s.v===r.status?'selected':''}>${s.icon} ${s.v}</option>`).join('')}</select>
        </div>
    </div>

    <!-- توثيق صور وفيديوهات حالة الجهاز (الاستلام والتسليم) -->
    <div class="card" style="background:var(--paper3);padding:12px;border-radius:var(--radius-sm);margin-top:10px;border:1px solid var(--line);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px;">
        <div>
          <h4 style="margin:0;font-size:13.5px;display:flex;align-items:center;gap:6px;">
            <span>${getSvgIcon("camera", 16)}</span>
            <span>توثيق صور حالة الجهاز (الاستلام والتسليم)</span>
            <span class="badge" id="detailPhotosCountBadge" style="background:var(--primary-bg);color:var(--primary);font-size:11px;font-weight:800;">
              ${(r.photos || []).length} صور
            </span>
          </h4>
          <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">
            صور فحص الجهاز عند الاستلام (شاشة، خدوش، كسور) وصور ما بعد الصيانة عند التسليم
          </div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          <input type="file" id="detailCameraInput" accept="image/*" capture="environment" style="display:none;">
          <input type="file" id="detailGalleryInput" accept="image/*" multiple style="display:none;">
          
          <select id="detailPhotoStageSelect" style="padding:4px 8px;font-size:11px;font-weight:700;">
            <option value="intake">عند الاستلام</option>
            <option value="delivery">عند التسليم بعد الإصلاح</option>
          </select>

          <select id="detailPhotoAngleSelect" style="padding:4px 8px;font-size:11px;">
            <option value="الشاشة والواجهة">الشاشة والواجهة</option>
            <option value="ظهر وسيريال الجهاز">ظهر وسيريال الجهاز</option>
            <option value="خدوش وكسور سابقة">خدوش وكسور سابقة</option>
            <option value="الشاحن والملحقات">الشاحن والملحقات</option>
            <option value="تم الإصلاح والشاشة تعمل">تم الإصلاح والشاشة تعمل</option>
            <option value="عام">عام</option>
          </select>

          <button type="button" class="btn btn-primary btn-xs" id="detailAddPhotoCameraBtn">${getSvgIcon("camera", 14)} تصوير</button>
          <button type="button" class="btn btn-ghost btn-xs" id="detailAddPhotoGalleryBtn" style="border:1px solid var(--line);background:var(--surface);">${getSvgIcon("folder", 13)} رفع صورة</button>
        </div>
      </div>

      <!-- Stage Filter Tabs: All / Intake / Delivery -->
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;font-size:11.5px;border-top:1px dashed var(--line);padding-top:8px;">
        <span style="font-weight:700;color:var(--ink-secondary);">تصفية الصور:</span>
        <button type="button" class="btn btn-xs btn-blue photo-filter-tab" data-stage="all">الكل</button>
        <button type="button" class="btn btn-xs btn-ghost photo-filter-tab" data-stage="intake">عند الاستلام (فحص البداية)</button>
        <button type="button" class="btn btn-xs btn-ghost photo-filter-tab" data-stage="delivery">عند التسليم (بعد الإصلاح)</button>
      </div>

      <!-- Photo Thumbnails Grid -->
      <div id="detailPhotosGrid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(110px, 1fr));gap:8px;margin-top:6px;">
      </div>
    </div>

    <!-- بنود الصيانة المستحقة على الجهاز -->
    <div class="card" style="background:var(--paper3);padding:12px;border-radius:var(--radius-sm);margin-top:10px;border:1px solid var(--line);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div>
          <h4 style="margin:0;font-size:13.5px;display:flex;align-items:center;gap:6px;">
            <span>${getSvgIcon("tool", 16)}</span>
            <span>بنود الصيانة المستحقة في الجهاز</span>
          </h4>
          <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">حدد تفاصيل كل خدمة مع تكلفتها، وتجمع تلقائياً في تكلفة صيانة الجهاز</div>
        </div>
        <button type="button" class="btn btn-primary btn-xs" id="detailAddServiceItemBtn">+ إضافة بند صيانة</button>
      </div>
      <div id="detailServiceItemsList" style="display:flex;flex-direction:column;gap:6px;">
        <!-- dynamic items rendered here -->
      </div>
    </div>

    <!-- قطع الغيار ومستلزمات الصيانة المستهلكة من المخزن -->
    <div class="card" style="background:var(--paper3);padding:12px;border-radius:var(--radius-sm);margin-top:10px;border:1px solid var(--line);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
        <div>
          <h4 style="margin:0;font-size:13.5px;display:flex;align-items:center;gap:6px;">
            <span>${getSvgIcon("tool", 16)}</span>
            <span>قطع الغيار ومستلزمات الصيانة المستهلكة</span>
            <span class="badge" id="detailPartsCountBadge" style="background:var(--primary-bg);color:var(--primary);font-size:11px;font-weight:800;">
              ${(r.partsList||[]).length} قطع
            </span>
          </h4>
          <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">
            اختر القطعة من المخزن لخصمها آلياً، أو أضف قطعة خارجية يدوياً مع الضمان
          </div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          <button type="button" class="btn btn-primary btn-xs" id="detailAddInventoryPartBtn">${getSvgIcon("package", 14)} إضافة من المخزن</button>
          <button type="button" class="btn btn-ghost btn-xs" id="detailAddCustomPartBtn" style="border:1px solid var(--line);background:var(--paper2);">+ قطعة خارجية يدوية</button>
        </div>
      </div>
      <div id="detailSparePartsList" style="display:flex;flex-direction:column;gap:6px;">
        <!-- dynamic spare parts rendered here -->
      </div>
      <div id="detailPartsSummaryBox" style="margin-top:8px;padding:8px 12px;background:rgba(59,130,246,0.06);border-radius:8px;border:1px solid rgba(59,130,246,0.2);display:flex;justify-content:space-between;align-items:center;font-size:12px;flex-wrap:wrap;gap:6px;">
        <div>
          <span style="color:var(--ink-secondary);">إجمالي قطع الغيار:</span>
          <b class="mono" id="detailPartsSellTotalDisplay" style="color:var(--primary);font-size:13px;margin-right:4px;">${Number(r.partsCost||0).toLocaleString()} ج.م</b>
          <span style="font-size:10.5px;color:var(--ink-secondary);margin-right:8px;">(تكلفة المحل: <span class="mono" id="detailPartsCostTotalDisplay">${Number(r.partsBuyCost||0).toLocaleString()}</span> ج.م)</span>
        </div>
        <div id="detailPartsStockNotice" style="font-size:11px;color:var(--green);font-weight:700;">
          يتم خصم الكميات من رصيد المخزن تلقائياً
        </div>
      </div>
    </div>

    <!-- حساب آخر على العميل -->
    <div class="card" style="background:var(--paper3);padding:12px;border-radius:var(--radius-sm);margin-top:10px;border:1px solid var(--line);">
      <h4 style="margin:0 0 8px 0;font-size:13.5px;display:flex;align-items:center;gap:6px;">
        <span>${getSvgIcon("wallet", 16)}</span>
        <span>حساب آخر / رصيد إضافي على نفس العميل</span>
      </h4>
      <div class="grid2">
        <div class="field" style="margin-bottom:0;">
          <label>وصف الحساب الآخر (مثلاً: رصيد سابق، جهاز آخر، مستلزمات)</label>
          <input id="eOtherDesc" value="${escapeHtml(r.otherAccountDesc || '')}" placeholder="وصف الحساب الإضافي إن وجد...">
        </div>
        <div class="field" style="margin-bottom:0;">
          <label>المبلغ المستحق للحساب الآخر (ج.م)</label>
          <input id="eOtherAmount" type="number" min="0" step="any" value="${r.otherAccountAmount || 0}" placeholder="0">
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(115px, 1fr));gap:8px;margin-top:10px;">
      <div class="field"><label>أجور الصيانة (ج.م)</label><input id="eCost" type="number" value="${r.cost||0}"></div>
      <div class="field"><label>قطع الغيار (ج.م)</label><input id="ePartsCost" type="number" value="${r.partsCost||0}" disabled style="background:var(--paper3);font-weight:bold;color:var(--purple);"></div>
      <div class="field"><label>حساب إضافي (ج.م)</label><input id="eOtherDisplay" type="number" value="${r.otherAccountAmount||0}" disabled style="background:var(--paper3);"></div>
      <div class="field"><label>إجمالي المدفوع (ج.م)</label><input id="eDeposit" type="number" value="${r.deposit||0}" disabled style="background:var(--paper3);"></div>
      <div class="field"><label>المتبقي المطلوب (ج.م)</label><input id="eRem" type="number" value="${remaining}" disabled style="background:var(--paper3);font-weight:bold;color:var(--primary);"></div>
    </div>

    <div class="card" style="background:var(--paper3);padding:12px;border-radius:var(--radius-sm);margin-top:8px;">
      <h3 style="font-size:13.5px;margin-bottom:6px;">سجل الدفعات</h3>
      <div id="paymentsList" style="font-size:12px;margin-bottom:10px;">جارٍ التحميل...</div>
      <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;">
        <div class="field" style="flex:1;min-width:110px;margin-bottom:0;">
          <label>مبلغ دفعة جديدة</label>
          <input id="newPayAmt" type="number" placeholder="0" min="1" max="${remaining}">
          <div id="newPayAmtHint" style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">الحد الأقصى: <b class="mono">${remaining}</b> ج.م</div>
        </div>
        <div class="field" style="flex:1.3;min-width:150px;margin-bottom:0;">
          <label>طريقة الدفع</label>
          <select id="newPayMethod" style="font-weight:700;">
            ${getActivePaymentMethods().map(pm => `<option value="${escapeHtml(pm.name)}">${escapeHtml(pm.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field" style="flex:2;min-width:160px;margin-bottom:0;"><label>ملاحظة</label><input id="newPayNote" placeholder="دفعة تحت الحساب..."></div>
        <button class="btn btn-green btn-sm" id="addPayBtn" ${remaining<=0?'disabled':''}>تسجيل دفعة</button>
      </div>
    </div>

    ${renderDeviceHistoryCard(r)}

    <div class="actions-row" style="flex-wrap:wrap;margin-top:16px;">
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <button class="btn btn-whatsapp btn-xs" id="detailCostEstimateBtn" title="عرض ومقايسة التكلفة للعميل عبر واتساب (موافقة/رفض)">مقايسة التكلفة (واتساب)</button>
        <button class="btn btn-whatsapp btn-xs" id="detailWaNotifyBtn" title="إرسال إشعار واتساب للعميل">${WA_ICON} إشعار واتساب</button>
        <button class="btn btn-amber btn-xs" id="reIntakeDeviceDetailBtn" title="إعادة إدخال نفس الجهاز للصيانة بدورة جديدة">${getSvgIcon("refresh", 13)} إعادة صيانة الجهاز</button>
        <button class="btn btn-blue btn-xs" id="convertReceiptToInvoiceBtn" title="إصدار فاتورة ضريبية رسمية للعميل">${getSvgIcon("invoices", 13)} تحويل لفاتورة رسمية</button>
        ${!r.paid ? `<button class="btn btn-green btn-xs" id="payBtn">${getSvgIcon("check", 13)} سداد المتبقي</button>` : `<button class="btn btn-blue btn-xs" id="invBtn">${getSvgIcon("printer", 13)} طباعة إيصال نهائي</button>`}
        <div style="display:inline-flex;border-radius:6px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.05);align-items:stretch;">
          <button class="btn btn-amber btn-xs" id="detailStickerBtn" title="طباعة ملصق الصيانة فوراً (وضع الكيوسك)">${getSvgIcon("tag", 13)} ملصق باركود</button>
          <button class="btn btn-amber btn-xs" id="detailStickerOptsBtn" style="padding:2px 6px;border-right:1px solid rgba(255,255,255,0.35);" title="تعديل خيارات ومعاينة الملصق">${getSvgIcon("settings", 13)}</button>
        </div>
        <button class="btn btn-ghost btn-xs" id="workOrderBtn">أمر شغل</button>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-ghost btn-sm" id="closeModalBtn">إلغاء</button>
        <button class="btn btn-primary btn-sm" id="saveEditBtn">${getSvgIcon("check", 14)} حفظ التعديلات</button>
      </div>
    </div>
  </div>`;

  document.body.appendChild(overlay);

  function renderPaymentsList(){
    const box = overlay.querySelector('#paymentsList');
    const payments = getReceiptPayments(r);
    if(!payments.length){
      box.innerHTML = '<span style="color:var(--ink-secondary);">لا توجد دفعات مسجلة لهذا الإيصال بعد.</span>';
      return;
    }
    box.innerHTML = payments.map(p=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--line);">
      <span>
        <b class="mono" style="font-size:11.5px;color:var(--ink-secondary);">${cleanDate(p.Date)}</b>
        ${getPaymentMethodBadge(p.PaymentMethod || 'نقدي (كاش)')}
        ${p.Note?'— '+escapeHtml(p.Note):''}
        <span style="color:var(--slate-400);font-size:11px;">(${escapeHtml(p.By||'نظام')})</span>
      </span>
      <span class="mono" style="font-weight:800;color:var(--green-text);">${Number(p.Amount||0).toLocaleString()} ج.م</span>
    </div>`).join('');
  }
  renderPaymentsList();

  // Detail Service Items Handling
  let detailServiceItems = Array.isArray(r.serviceItems) && r.serviceItems.length ? JSON.parse(JSON.stringify(r.serviceItems)) : [];
  if(!detailServiceItems.length && Number(r.cost || 0) > 0){
    detailServiceItems.push({ desc: (Array.isArray(r.faults) && r.faults.length ? r.faults.join('، ') : 'أجور وخدمات صيانة'), price: Number(r.cost) });
  }

  function renderDetailServiceItems(){
    const list = overlay.querySelector('#detailServiceItemsList');
    if(!list) return;
    if(!detailServiceItems.length){
      list.innerHTML = `
        <div style="text-align:center;padding:10px;background:var(--paper2);border-radius:var(--radius-xs);color:var(--ink-secondary);font-size:12px;">
          لا توجد بنود صيانة منفصلة مسجلة. اضغط <b>+ إضافة بند صيانة</b> لتفصيل بنود الصيانة وأسعارها.
        </div>`;
      return;
    }
    list.innerHTML = detailServiceItems.map((item, idx) => `
      <div style="display:flex;gap:8px;align-items:center;background:var(--paper2);padding:6px 8px;border-radius:var(--radius-xs);border:1px solid var(--line);">
        <span style="font-size:11.5px;color:var(--ink-secondary);font-weight:bold;width:20px;text-align:center;">${idx + 1}</span>
        <input type="text" class="detail-svc-desc" data-idx="${idx}" value="${escapeHtml(item.desc || '')}" placeholder="وصف بند الصيانة (مثلاً: تغيير شاشة، تنظيف باور، صيانة بوردة...)" style="flex:3;padding:6px 9px;font-size:12.5px;">
        <div style="display:flex;align-items:center;gap:4px;flex:1.5;">
          <input type="number" min="0" step="any" class="detail-svc-price" data-idx="${idx}" value="${item.price != null ? item.price : ''}" placeholder="السعر" style="width:100%;padding:6px 9px;font-size:12.5px;font-weight:bold;">
          <span style="font-size:11px;color:var(--ink-secondary);">ج.م</span>
        </div>
        <button type="button" class="btn btn-ghost btn-xs detail-svc-del-btn" data-idx="${idx}" title="حذف هذا البند" style="color:var(--red);padding:4px 8px;">&times;</button>
      </div>
    `).join('');

    attachDetailServiceItemEvents();
  }

  function attachDetailServiceItemEvents(){
    overlay.querySelectorAll('.detail-svc-desc').forEach(inp => {
      inp.oninput = (e) => {
        const idx = Number(e.target.dataset.idx);
        if(detailServiceItems[idx]){
          detailServiceItems[idx].desc = e.target.value;
        }
      };
    });
    overlay.querySelectorAll('.detail-svc-price').forEach(inp => {
      inp.oninput = (e) => {
        const idx = Number(e.target.dataset.idx);
        if(detailServiceItems[idx]){
          detailServiceItems[idx].price = Number(e.target.value || 0);
          recalcDetailFinances();
        }
      };
    });
    overlay.querySelectorAll('.detail-svc-del-btn').forEach(btn => {
      btn.onclick = (e) => {
        const idx = Number(btn.dataset.idx);
        detailServiceItems.splice(idx, 1);
        renderDetailServiceItems();
        recalcDetailFinances();
      };
    });
  }

  // Detail Spare Parts State
  let detailSpareParts = (Array.isArray(r.partsList) && r.partsList.length)
    ? JSON.parse(JSON.stringify(r.partsList))
    : [];
  const initiallyDeductedParts = detailSpareParts.filter(p => p.isStockDeducted && p.itemId);

  function recalcDetailFinances(){
    const sumSvc = detailServiceItems.reduce((acc, cur) => acc + Number(cur.price || 0), 0);
    const costInput = overlay.querySelector('#eCost');
    if(detailServiceItems.length > 0 && costInput){
      costInput.value = sumSvc;
    }
    const costVal = Number(costInput ? costInput.value : 0) || 0;
    const otherVal = Number(overlay.querySelector('#eOtherAmount')?.value || 0);

    // Calculate spare parts (sell price to client and cost price to shop)
    const partsSellTotal = detailSpareParts.reduce((acc, cur) => acc + (Number(cur.sellPrice || 0) * Number(cur.qty || 1)), 0);
    const partsCostTotal = detailSpareParts.reduce((acc, cur) => acc + (Number(cur.costPrice || 0) * Number(cur.qty || 1)), 0);
    r.partsCost = partsSellTotal;
    r.partsBuyCost = partsCostTotal;

    const partsCostInp = overlay.querySelector('#ePartsCost');
    if(partsCostInp) partsCostInp.value = partsSellTotal;

    const partsSellDisp = overlay.querySelector('#detailPartsSellTotalDisplay');
    if(partsSellDisp) partsSellDisp.innerText = `${partsSellTotal.toLocaleString()} ج.م`;
    const partsCostDisp = overlay.querySelector('#detailPartsCostTotalDisplay');
    if(partsCostDisp) partsCostDisp.innerText = partsCostTotal.toLocaleString();

    const partsBadge = overlay.querySelector('#detailPartsCountBadge');
    if(partsBadge) partsBadge.innerText = `${detailSpareParts.length} قطع`;

    const depositVal = Number(r.deposit || 0);
    const refundedVal = Number(r.refunded || 0);

    const otherDisplay = overlay.querySelector('#eOtherDisplay');
    if(otherDisplay) otherDisplay.value = otherVal;

    const totalDue = costVal + partsSellTotal + otherVal;
    const currentRem = Math.max(0, totalDue - depositVal + refundedVal);

    const remInput = overlay.querySelector('#eRem');
    if(remInput) remInput.value = currentRem;

    const newPayAmt = overlay.querySelector('#newPayAmt');
    if(newPayAmt) newPayAmt.max = currentRem;
    const newPayHint = overlay.querySelector('#newPayAmtHint');
    if(newPayHint) newPayHint.innerHTML = `الحد الأقصى: <b class="mono">${currentRem}</b> ج.م`;
    const addPayBtn = overlay.querySelector('#addPayBtn');
    if(addPayBtn) addPayBtn.disabled = (currentRem <= 0);
  }

  function renderDetailSpareParts(){
    const list = overlay.querySelector('#detailSparePartsList');
    const summaryBox = overlay.querySelector('#detailPartsSummaryBox');
    if(!list) return;

    if(!detailSpareParts.length){
      list.innerHTML = `
        <div style="text-align:center;padding:12px;background:var(--paper2);border-radius:var(--radius-xs);color:var(--ink-secondary);font-size:12px;">
          لا توجد قطع غيار مسجلة لهذا الجهاز. اضغط <b>${getSvgIcon("package", 14)} إضافة من المخزن</b> لاختيار قطع من رصيد المحل، أو <b>+ قطعة خارجية يدوية</b>.
        </div>`;
      if(summaryBox) summaryBox.style.display = 'none';
      recalcDetailFinances();
      return;
    }

    if(summaryBox) summaryBox.style.display = 'flex';

    list.innerHTML = detailSpareParts.map((part, idx) => {
      const invItem = part.itemId ? (state.inventory || []).find(x => x.ID === part.itemId) : null;
      const currentStock = invItem ? Number(invItem.Quantity || 0) : null;
      const stockBadge = (currentStock !== null)
        ? `<span class="badge" style="background:${currentStock > 0 ? '#dcfce7' : '#fee2e2'};color:${currentStock > 0 ? '#166534' : '#991b1b'};font-size:10.5px;padding:2px 6px;">مخزن: ${currentStock}</span>`
        : `<span class="badge" style="background:#f1f5f9;color:#475569;font-size:10.5px;padding:2px 6px;">قطعة خارجية</span>`;

      const partTotal = (Number(part.qty || 1) * Number(part.sellPrice || 0));

      return `
        <div style="display:flex;gap:6px;align-items:center;background:var(--paper2);padding:7px 10px;border-radius:var(--radius-xs);border:1px solid var(--line);flex-wrap:wrap;">
          <span style="font-size:11px;color:var(--ink-secondary);font-weight:bold;width:18px;text-align:center;">${idx + 1}</span>
          <div style="flex:3;min-width:170px;display:flex;align-items:center;gap:6px;">
            <input type="text" class="detail-part-name" data-idx="${idx}" value="${escapeHtml(part.name || '')}" placeholder="اسم القطعة وموديلها..." style="flex:1;padding:5px 8px;font-size:12px;font-weight:700;">
            ${stockBadge}
          </div>
          <div style="display:flex;align-items:center;gap:3px;flex:1;min-width:70px;">
            <label style="font-size:10px;color:var(--ink-secondary);">كمية:</label>
            <input type="number" min="1" step="1" class="detail-part-qty" data-idx="${idx}" value="${part.qty || 1}" style="width:100%;padding:5px 4px;text-align:center;font-size:12px;font-weight:bold;">
          </div>
          <div style="display:flex;align-items:center;gap:3px;flex:1.2;min-width:90px;">
            <label style="font-size:10px;color:var(--ink-secondary);">بيع:</label>
            <input type="number" min="0" step="any" class="detail-part-price" data-idx="${idx}" value="${part.sellPrice != null ? part.sellPrice : ''}" placeholder="0" style="width:100%;padding:5px 4px;font-size:12px;font-weight:bold;color:var(--primary);">
            <span style="font-size:10px;color:var(--ink-secondary);">ج.م</span>
          </div>
          <div style="display:flex;align-items:center;gap:3px;flex:1.4;min-width:105px;">
            <label style="font-size:10px;color:var(--ink-secondary);">ضمان:</label>
            <select class="detail-part-warranty" data-idx="${idx}" style="width:100%;padding:4px 3px;font-size:11px;font-weight:700;">
              <option value="0" ${Number(part.warrantyDays) === 0 ? 'selected' : ''}>بدون ضمان</option>
              <option value="14" ${Number(part.warrantyDays) === 14 ? 'selected' : ''}>14 يوم تجربة</option>
              <option value="30" ${Number(part.warrantyDays) === 30 || !part.warrantyDays ? 'selected' : ''}>شهر (30 يوم) - الافتراضي</option>
              <option value="90" ${Number(part.warrantyDays) === 90 ? 'selected' : ''}>3 أشهر</option>
              <option value="180" ${Number(part.warrantyDays) === 180 ? 'selected' : ''}>6 أشهر</option>
              <option value="365" ${Number(part.warrantyDays) === 365 ? 'selected' : ''}>سنة كاملة</option>
            </select>
          </div>
          <div style="font-size:11.5px;font-weight:800;color:var(--green);min-width:65px;text-align:left;">
            ${partTotal.toLocaleString()} ج.م
          </div>
          <button type="button" class="btn btn-ghost btn-xs detail-part-del-btn" data-idx="${idx}" title="حذف هذه القطعة" style="color:var(--red);padding:4px 6px;">&times;</button>
        </div>
      `;
    }).join('');

    attachDetailSparePartEvents();
    recalcDetailFinances();
  }

  function attachDetailSparePartEvents(){
    overlay.querySelectorAll('.detail-part-name').forEach(inp => {
      inp.oninput = (e) => {
        const idx = Number(e.target.dataset.idx);
        if(detailSpareParts[idx]) detailSpareParts[idx].name = e.target.value;
      };
    });
    overlay.querySelectorAll('.detail-part-qty').forEach(inp => {
      inp.onchange = (e) => {
        const idx = Number(e.target.dataset.idx);
        if(detailSpareParts[idx]){
          detailSpareParts[idx].qty = Math.max(1, Number(e.target.value || 1));
          renderDetailSpareParts();
        }
      };
    });
    overlay.querySelectorAll('.detail-part-price').forEach(inp => {
      inp.oninput = (e) => {
        const idx = Number(e.target.dataset.idx);
        if(detailSpareParts[idx]){
          detailSpareParts[idx].sellPrice = Number(e.target.value || 0);
          recalcDetailFinances();
        }
      };
    });
    overlay.querySelectorAll('.detail-part-warranty').forEach(sel => {
      sel.onchange = (e) => {
        const idx = Number(e.target.dataset.idx);
        if(detailSpareParts[idx]) detailSpareParts[idx].warrantyDays = Number(e.target.value);
      };
    });
    overlay.querySelectorAll('.detail-part-del-btn').forEach(btn => {
      btn.onclick = (e) => {
        const idx = Number(btn.dataset.idx);
        const removed = detailSpareParts.splice(idx, 1)[0];
        if(removed && removed.isStockDeducted && removed.itemId){
          try {
            adjustInventoryQtyRemote(removed.itemId, Number(removed.qty || 1));
            showToast(`تمت إعادة ${removed.qty} من (${removed.name}) إلى رصيد المخزن`, 'info');
          } catch(err){}
        }
        renderDetailSpareParts();
      };
    });
  }

  renderDetailServiceItems();
  renderDetailSpareParts();

  const addSvcBtn = overlay.querySelector('#detailAddServiceItemBtn');
  if(addSvcBtn){
    addSvcBtn.onclick = () => {
      detailServiceItems.push({ desc: '', price: 0 });
      renderDetailServiceItems();
      const lastDesc = overlay.querySelector(`.detail-svc-desc[data-idx="${detailServiceItems.length - 1}"]`);
      if(lastDesc) lastDesc.focus();
    };
  }

  const addInvPartBtn = overlay.querySelector('#detailAddInventoryPartBtn');
  if(addInvPartBtn){
    addInvPartBtn.onclick = () => {
      openInventoryPartPickerModal((item) => {
        const existing = detailSpareParts.find(p => p.itemId === item.ID);
        if(existing){
          existing.qty = Number(existing.qty || 1) + 1;
          showToast(`تم زيادة كمية (${item.Name}) إلى ${existing.qty} `, 'info');
        } else {
          detailSpareParts.push({
            id: 'part_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            itemId: item.ID,
            barcode: item.Barcode || '',
            name: item.Name,
            qty: 1,
            costPrice: Number(item.PurchasePrice || 0),
            sellPrice: Number(item.SellPrice || item.PurchasePrice || 0),
            warrantyDays: 30,
            isStockDeducted: false
          });
          showToast(`تمت إضافة (${item.Name}) بنجاح`, 'success');
        }
        renderDetailSpareParts();
      });
    };
  }

  const addCustomPartBtn = overlay.querySelector('#detailAddCustomPartBtn');
  if(addCustomPartBtn){
    addCustomPartBtn.onclick = () => {
      detailSpareParts.push({
        id: 'part_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        itemId: '',
        barcode: '',
        name: '',
        qty: 1,
        costPrice: 0,
        sellPrice: 0,
        warrantyDays: 30,
        isStockDeducted: false
      });
      renderDetailSpareParts();
      const lastPartName = overlay.querySelector(`.detail-part-name[data-idx="${detailSpareParts.length - 1}"]`);
      if(lastPartName) lastPartName.focus();
    };
  }

  const eCostInp = overlay.querySelector('#eCost');
  if(eCostInp) eCostInp.oninput = recalcDetailFinances;
  const eOtherInp = overlay.querySelector('#eOtherAmount');
  if(eOtherInp) eOtherInp.oninput = recalcDetailFinances;

  // Detail Photos (Intake & Delivery) State & Handlers
  let detailPhotos = Array.isArray(r.photos) && r.photos.length 
    ? JSON.parse(JSON.stringify(r.photos)) 
    : (Array.isArray(r.devices) ? r.devices.flatMap(x => x.photos || []) : []);
  let currentPhotoFilterStage = 'all';

  function renderDetailPhotosGallery(){
    const grid = overlay.querySelector('#detailPhotosGrid');
    const badge = overlay.querySelector('#detailPhotosCountBadge');
    if(badge) badge.innerText = `${detailPhotos.length} صور`;
    if(!grid) return;

    let filtered = detailPhotos;
    if(currentPhotoFilterStage === 'intake'){
      filtered = detailPhotos.filter(p => p.stage !== 'delivery');
    } else if(currentPhotoFilterStage === 'delivery'){
      filtered = detailPhotos.filter(p => p.stage === 'delivery');
    }

    renderDevicePhotosThumbnails(filtered, grid, {
      canDelete: true,
      onChanged: () => {
        const remainingIds = new Set(filtered.map(p => p.id || p.url));
        detailPhotos = detailPhotos.filter(p => {
          const inThisStage = (currentPhotoFilterStage === 'all') ||
            (currentPhotoFilterStage === 'intake' && p.stage !== 'delivery') ||
            (currentPhotoFilterStage === 'delivery' && p.stage === 'delivery');
          if(inThisStage){
            return remainingIds.has(p.id || p.url);
          }
          return true;
        });
        if(badge) badge.innerText = `${detailPhotos.length} صور`;
      }
    });
  }

  overlay.querySelectorAll('.photo-filter-tab').forEach(tab => {
    tab.onclick = () => {
      currentPhotoFilterStage = tab.dataset.stage;
      overlay.querySelectorAll('.photo-filter-tab').forEach(t => {
        if(t.dataset.stage === currentPhotoFilterStage){
          t.className = 'btn btn-xs btn-blue photo-filter-tab';
        } else {
          t.className = 'btn btn-xs btn-ghost photo-filter-tab';
        }
      });
      renderDetailPhotosGallery();
    };
  });

  const detCamInp = overlay.querySelector('#detailCameraInput');
  const detGalInp = overlay.querySelector('#detailGalleryInput');
  const detCamBtn = overlay.querySelector('#detailAddPhotoCameraBtn');
  const detGalBtn = overlay.querySelector('#detailAddPhotoGalleryBtn');

  async function handleDetailFilesSelected(files){
    if(!files || !files.length) return;
    const stage = overlay.querySelector('#detailPhotoStageSelect')?.value || 'intake';
    const angle = overlay.querySelector('#detailPhotoAngleSelect')?.value || 'عام';
    const badge = overlay.querySelector('#detailPhotosCountBadge');
    if(badge) badge.innerText = 'جارٍ الضغط...';
    try {
      for(let i = 0; i < files.length; i++){
        const file = files[i];
        if(!file.type.startsWith('image/')) continue;
        const compressedUrl = await compressImageFile(file, 900, 900, 0.72);
        detailPhotos.push({
          id: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 10000),
          url: compressedUrl,
          thumb: compressedUrl,
          angle: angle,
          stage: stage,
          timestamp: new Date().toISOString()
        });
      }
      showToast('تمت إضافة الصور الموثقة للجهاز بنجاح', 'success');
      renderDetailPhotosGallery();
    } catch(err){
      showToast('خطأ أثناء معالجة الصور: ' + err.message, 'error');
      renderDetailPhotosGallery();
    }
  }

  if(detCamBtn && detCamInp){
    detCamBtn.onclick = () => detCamInp.click();
    detCamInp.onchange = (e) => handleDetailFilesSelected(e.target.files);
  }
  if(detGalBtn && detGalInp){
    detGalBtn.onclick = () => detGalInp.click();
    detGalInp.onchange = (e) => handleDetailFilesSelected(e.target.files);
  }

  renderDetailPhotosGallery();

  let currentEditDevIdx = 0;
  const hasMultipleDevices = Array.isArray(r.devices) && r.devices.length > 1;

  function syncCurrentDevToDom(idx){
    const dev = (hasMultipleDevices && r.devices[idx]) ? r.devices[idx] : r.device;
    if(!dev) return;
    const catInp = overlay.querySelector('#eCat');
    if(catInp) catInp.value = dev.category || '';
    const brandInp = overlay.querySelector('#eBrand');
    if(brandInp) brandInp.value = (dev.brand === 'أخرى' ? dev.brandOther : dev.brand) || '';
    const modelInp = overlay.querySelector('#eModel');
    if(modelInp) modelInp.value = dev.model || '';
    const passInp = overlay.querySelector('#ePassword');
    if(passInp) passInp.value = dev.password || '';
    const notesInp = overlay.querySelector('#eFaultNotes');
    if(notesInp) notesInp.value = (hasMultipleDevices ? dev.faultNotes : r.faultNotes) || '';

    // Update chips
    const devFaults = hasMultipleDevices ? (dev.faults || []) : (r.faults || []);
    overlay.querySelectorAll('#editFaultChips .chip').forEach(c => {
      const f = c.dataset.f;
      if(devFaults.includes(f)) c.classList.add('sel');
      else c.classList.remove('sel');
    });

    // Update active tab styling
    overlay.querySelectorAll('.detail-dev-tab-btn').forEach(btn => {
      const bIdx = Number(btn.dataset.didx);
      if(bIdx === idx){
        btn.className = 'btn btn-xs btn-primary detail-dev-tab-btn';
      } else {
        btn.className = 'btn btn-xs btn-ghost detail-dev-tab-btn';
      }
    });
  }

  function saveDomToCurrentDev(idx){
    if(!hasMultipleDevices) return;
    const dev = r.devices[idx];
    if(!dev) return;
    dev.category = (overlay.querySelector('#eCat')?.value || '').trim();
    dev.brand = (overlay.querySelector('#eBrand')?.value || '').trim();
    dev.model = (overlay.querySelector('#eModel')?.value || '').trim();
    dev.password = (overlay.querySelector('#ePassword')?.value || '').trim();
    dev.faultNotes = (overlay.querySelector('#eFaultNotes')?.value || '').trim();
  }

  if(hasMultipleDevices){
    overlay.querySelectorAll('.detail-dev-tab-btn').forEach(btn => {
      btn.onclick = () => {
        saveDomToCurrentDev(currentEditDevIdx);
        currentEditDevIdx = Number(btn.dataset.didx);
        syncCurrentDevToDom(currentEditDevIdx);
      };
    });
  }

  overlay.querySelectorAll('#editFaultChips .chip').forEach(c=>{
    c.onclick = ()=>{
      const f = c.dataset.f;
      if(hasMultipleDevices && r.devices[currentEditDevIdx]){
        const dev = r.devices[currentEditDevIdx];
        if(!Array.isArray(dev.faults)) dev.faults = [];
        const idx = dev.faults.indexOf(f);
        if(idx > -1) dev.faults.splice(idx, 1);
        else dev.faults.push(f);
      } else {
        if(!Array.isArray(r.faults)) r.faults = [];
        const idx = r.faults.indexOf(f);
        if(idx > -1) r.faults.splice(idx, 1);
        else r.faults.push(f);
      }
      c.classList.toggle('sel');
    };
  });

  const closeDetBtn = overlay.querySelector('#closeDetailBtn');
  if(closeDetBtn) closeDetBtn.onclick = ()=>overlay.remove();
  const closeModBtn = overlay.querySelector('#closeModalBtn');
  if(closeModBtn) closeModBtn.onclick = ()=>overlay.remove();

  const detailAiDiagBtn = overlay.querySelector('#detailAiDiagBtn');
  if(detailAiDiagBtn) detailAiDiagBtn.onclick = () => openAiDiagnosisModal(r);

  function collectEdits(){
    const selectedTitle = (overlay.querySelector('#eTitle')?.value || '').trim();
    const rawNameVal = overlay.querySelector('#eName').value.trim();
    const parsedName = parseCustomerTitleAndName(rawNameVal);
    r.customer.title = selectedTitle || parsedName.title || '';
    r.customer.name = (parsedName.title && !selectedTitle) ? parsedName.name : (parsedName.name || rawNameVal);
    r.CustomerTitle = r.customer.title;
    r.CustomerName = r.customer.name;
    r.customer.phone = overlay.querySelector('#ePhone').value.trim();
    r.CustomerPhone = r.customer.phone;

    if(hasMultipleDevices){
      saveDomToCurrentDev(currentEditDevIdx);
      r.device = {
        category: r.devices[0].category,
        brand: r.devices[0].brand,
        brandOther: r.devices[0].brandOther || '',
        model: r.devices[0].model,
        accessories: r.devices[0].accessories || '',
        password: r.devices[0].password || ''
      };
      r.password = r.device.password;
      r.faults = Array.from(new Set(r.devices.flatMap(x => x.faults || [])));
      r.faultNotes = r.devices[0].faultNotes || '';
    } else {
      r.device.category = overlay.querySelector('#eCat').value.trim();
      r.device.brand = overlay.querySelector('#eBrand').value.trim();
      r.device.model = overlay.querySelector('#eModel').value.trim();
      r.device.password = (overlay.querySelector('#ePassword')?.value || '').trim();
      r.password = r.device.password;
      r.faultNotes = overlay.querySelector('#eFaultNotes').value.trim();
    }

    r.technician = overlay.querySelector('#eTech').value;
    r.status = overlay.querySelector('#eStatus').value.replace(/^[^\s]+\s/, '');
    r.photos = detailPhotos;
    if(Array.isArray(r.devices) && r.devices.length > 0){
      if(r.devices[currentEditDevIdx]){
        r.devices[currentEditDevIdx].photos = detailPhotos;
      } else {
        r.devices[0].photos = detailPhotos;
      }
    }
    r.serviceItems = detailServiceItems.filter(it => (it.desc && it.desc.trim()) || Number(it.price) > 0);
    r.partsList = detailSpareParts;
    r.partsCost = detailSpareParts.reduce((sum, p) => sum + (Number(p.sellPrice || 0) * Number(p.qty || 1)), 0);
    r.partsBuyCost = detailSpareParts.reduce((sum, p) => sum + (Number(p.costPrice || 0) * Number(p.qty || 1)), 0);
    r.partsUsed = detailSpareParts.map(p => `${p.name} (x${p.qty||1})`).join('، ');
    r.otherAccountDesc = (overlay.querySelector('#eOtherDesc')?.value || '').trim();
    r.otherAccountAmount = Number(overlay.querySelector('#eOtherAmount')?.value || 0);
    r.cost = Number(overlay.querySelector('#eCost').value || 0);
    r.updatedBy = state.user.name;
    r.updatedAt = new Date().toISOString();
  }

  overlay.querySelector('#saveEditBtn').onclick = async ()=>{
    collectEdits();

    // Deduct un-deducted inventory parts
    for(const p of detailSpareParts){
      if(p.itemId && !p.isStockDeducted){
        try {
          await adjustInventoryQtyRemote(p.itemId, -Number(p.qty || 1));
          p.isStockDeducted = true;
        } catch(e){
          console.warn('Error deducting stock for part:', p.name, e);
        }
      }
    }
    // Restock any removed initially deducted parts
    for(const initP of initiallyDeductedParts){
      const stillPresent = detailSpareParts.some(p => p.id === initP.id || (p.itemId === initP.itemId && p.isStockDeducted));
      if(!stillPresent){
        try {
          await adjustInventoryQtyRemote(initP.itemId, Number(initP.qty || 1));
        } catch(e){}
      }
    }

    const totalDue = Number(r.cost||0) + Number(r.partsCost||0) + Number(r.otherAccountAmount||0);
    const totalPaid = Number(r.deposit||0);

    // التحقق: لا يجوز تقليل التكلفة لتصبح أقل من المبلغ المدفوع مسبقاً دون تسوية استرداد
    if(totalDue > 0 && totalPaid > totalDue){
      showToast(`عفواً: إجمالي التكلفة والحساب المطلوب (${totalDue.toLocaleString()} ج.م) أقل من إجمالي المبلغ المسدد مسبقاً (${totalPaid.toLocaleString()} ج.م). يرجى إثبات استرداد أولاً.`, 'error');
      const costInp = overlay.querySelector('#eCost');
      if(costInp) costInp.focus();
      return;
    }

    const remainingNow = Math.max(0, totalDue - totalPaid + Number(r.refunded||0));
    const statusChanged = (initialStatus !== r.status);

    if(r.status === 'تم التسليم' && remainingNow > 0){
      const btn = overlay.querySelector('#saveEditBtn');
      if(btn){ btn.disabled = true; btn.textContent = 'جارٍ الحفظ...'; }
      promptDeliveryRemainingPayment(r, remainingNow, async (shouldPay, payMethodName)=>{
        if(shouldPay){
          try{
            await savePaymentRemote(r.id, remainingNow, 'سداد المتبقي عند التسليم', payMethodName || 'نقدي (كاش)');
            r.deposit = Number(r.deposit||0) + remainingNow;
            r.paid = true;
            await refreshPayments();
          }catch(e){}
        } else {
          // التسليم بالآجل: تسجيل المتبقي كمديونية على العميل وترحيل قيد للعملاء (أرصدة مدينة)
          try {
            const custName = r.customer ? r.customer.name : '';
            const custPhone = r.customer ? r.customer.phone : '';
            const cust = (state.customers || []).find(c => (custName && (c.name||'').trim().toLowerCase() === custName.trim().toLowerCase()) || (custPhone && c.phone === custPhone));
            if(cust){
              cust.Debt = Number(cust.Debt || cust.debt || 0) + remainingNow;
              await saveCustomerRemote(cust);
            }
            if(typeof autoPostJournalEntry === 'function'){
              await autoPostJournalEntry({
                date: new Date().toISOString().slice(0, 10),
                description: `مستحقات آجل تسليم جهاز إيصال #${r.receiptNumber || r.id} - عميل: ${custName || 'عميل'}`,
                referenceType: 'DeliveryCredit',
                referenceId: r.receiptNumber || r.id,
                entries: [
                  { accountId: '1103', accountName: 'العملاء (أرصدة مدينة)', debit: remainingNow, credit: 0 },
                  { accountId: '4101', accountName: 'إيرادات خدمات الصيانة', debit: 0, credit: remainingNow }
                ]
              });
            }
          } catch(errDebt) {
            console.warn('Auto debt recording error:', errDebt);
          }
        }
        try{
          await saveReceiptRemote(r);
          overlay.remove();
          showToast(shouldPay ? `تم سداد ${remainingNow.toLocaleString()} ج.م وتسليم الجهاز بنجاح` : 'تم تسليم الجهاز بنجاح (المتبقي آجل)', 'success');
          renderMain();
          if(initialStatus !== 'تم التسليم'){
            setTimeout(()=>{
              openWhatsappStatusNotificationModal(r, 'تم التسليم');
            }, 350);
          }
        }catch(err){
          showToast('تم الحفظ محلياً: '+err.message, 'info');
          if(btn){ btn.disabled = false; btn.textContent = 'حفظ التعديلات'; }
        }
      });
      return;
    }

    const btn = overlay.querySelector('#saveEditBtn');
    btn.disabled = true; btn.textContent = 'جارٍ الحفظ...';
    try{
      await saveReceiptRemote(r);
      overlay.remove();
      showToast('تم حفظ التعديلات بنجاح', 'success');
      renderMain();
      if(statusChanged){
        setTimeout(()=>{
          openWhatsappStatusNotificationModal(r, r.status);
        }, 350);
      }
    }catch(err){
      showToast('تم الحفظ محلياً: '+err.message, 'info');
      btn.disabled = false;
      btn.textContent = 'حفظ التعديلات';
    }
  };

  let isAddPaySubmitting = false;
  overlay.querySelector('#addPayBtn').onclick = async ()=>{
    if(isAddPaySubmitting) return;
    const addPayBtn = overlay.querySelector('#addPayBtn');
    const amt = Number(overlay.querySelector('#newPayAmt').value);
    const note = overlay.querySelector('#newPayNote').value.trim();
    const payMethodInp = overlay.querySelector('#newPayMethod');
    const chosenMethod = payMethodInp ? payMethodInp.value : 'نقدي (كاش)';
    if(!amt || amt<=0){ showToast('أدخل مبلغاً صحيحاً', 'error'); return; }

    const totalDue = Number(r.cost||0) + Number(r.partsCost||0) + Number(r.otherAccountAmount||0);
    const remainingBefore = Math.max(0, totalDue - Number(r.deposit||0) + Number(r.refunded||0));

    // منع دفع مبلغ أكبر من حساب الجهاز المتبقي نهائياً
    if(amt > remainingBefore){
      showToast(`عفواً: لا يمكن دفع مبلغ (${amt.toLocaleString()} ج.م) أكبر من الحساب المتبقي (${remainingBefore.toLocaleString()} ج.م)`, 'error');
      const payInp = overlay.querySelector('#newPayAmt');
      if(payInp){
        payInp.value = remainingBefore;
        payInp.focus();
      }
      return;
    }

    isAddPaySubmitting = true;
    if(addPayBtn){ addPayBtn.disabled = true; addPayBtn.textContent = 'جارٍ التسجيل...'; }

    // إذا كانت الدفعة تغطي المبلغ المتبقي بالكامل والحالة لم تسلم بعد
    if(amt >= remainingBefore && r.status !== 'تم التسليم'){
      promptPaymentDeliveryStatus(r, amt, async (shouldDeliver, payMethodName)=>{
        try{
          const methodToUse = payMethodName || chosenMethod;
          await savePaymentRemote(r.id, amt, note || (shouldDeliver ? 'سداد المتبقي عند التسليم' : 'سداد الدفعة المتبقية'), methodToUse);
          r.deposit = Number(r.deposit||0) + amt;
          if(r.deposit >= totalDue) r.paid = true;
          if(shouldDeliver){
            r.status = 'تم التسليم';
          }
          r.updatedBy = state.user ? state.user.name : 'نظام';
          r.updatedAt = new Date().toISOString();

          await saveReceiptRemote(r);
          await refreshPayments();
          overlay.remove();
          showToast(shouldDeliver ? 'تم سداد كامل المبلغ وتحديث الحالة إلى تم التسليم' : 'تم سداد كامل المبلغ وتحديث الحسابات بنجاح', 'success');
          renderMain();
        }catch(e){ 
          showToast('تم الحفظ محلياً: '+e.message, 'info'); 
          isAddPaySubmitting = false;
          if(addPayBtn){ addPayBtn.disabled = false; addPayBtn.textContent = 'تسجيل دفعة'; }
        }
      });
      return;
    }

    try{
      await savePaymentRemote(r.id, amt, note, chosenMethod);
      r.deposit = Number(r.deposit||0) + amt;
      if(r.deposit >= totalDue) r.paid = true;
      const newRem = Math.max(0, totalDue - Number(r.deposit||0) + Number(r.refunded||0));
      const remInp = overlay.querySelector('#eRem');
      if(remInp) remInp.value = newRem;
      const depInp = overlay.querySelector('#eDeposit');
      if(depInp) depInp.value = r.deposit;
      overlay.querySelector('#newPayAmt').value = '';
      overlay.querySelector('#newPayNote').value = '';
      await saveReceiptRemote(r);
      renderPaymentsList();
      await refreshPayments();
      showToast('تم تسجيل الدفعة بنجاح', 'success');
      renderMain();
    }catch(e){ 
      showToast('تم تسجيل الدفعة محلياً', 'info'); 
    }finally{
      isAddPaySubmitting = false;
      if(addPayBtn){ addPayBtn.disabled = false; addPayBtn.textContent = 'تسجيل دفعة'; }
    }
  };

  let isPayBtnSubmitting = false;
  const payBtn = overlay.querySelector('#payBtn');
  if(payBtn) payBtn.onclick = async ()=>{
    if(isPayBtnSubmitting) return;
    const totalDue = Number(r.cost||0) + Number(r.partsCost||0) + Number(r.otherAccountAmount||0);
    const remainingNow = Math.max(0, totalDue - Number(r.deposit||0) + Number(r.refunded||0));
    if(remainingNow <= 0){
      showToast('الإيصال مسدد بالكامل بالفعل', 'info');
      return;
    }

    isPayBtnSubmitting = true;
    payBtn.disabled = true;
    payBtn.textContent = 'جارٍ السداد...';

    promptPaymentDeliveryStatus(r, remainingNow, async (shouldDeliver, payMethodName)=>{
      try{
        await savePaymentRemote(r.id, remainingNow, shouldDeliver ? 'سداد المتبقي عند التسليم' : 'سداد المتبقي بالكامل', payMethodName || 'نقدي (كاش)');
        r.deposit = Number(r.deposit||0) + remainingNow;
        r.paid = true;
        if(shouldDeliver){
          r.status = 'تم التسليم';
        } else if(r.status === 'قيد الفحص' || r.status === 'الصيانة'){
          r.status = 'مكتمل';
        }
        r.updatedBy = state.user ? state.user.name : 'نظام';
        r.updatedAt = new Date().toISOString();

        await saveReceiptRemote(r);
        await refreshPayments();
        overlay.remove();
        showToast(shouldDeliver ? 'تم سداد المتبقي بالكامل وتحديث الحالة إلى "تم التسليم"' : 'تم سداد المتبقي بنجاح وتحديث الحسابات', 'success');
        renderMain();
      }catch(e){
        showToast('تم السداد محلياً: '+e.message, 'info');
        payBtn.disabled = false;
        payBtn.textContent = 'سداد المتبقي';
        isPayBtnSubmitting = false;
      }
    });
  };

  const convInvBtn = overlay.querySelector('#convertReceiptToInvoiceBtn');
  if(convInvBtn) convInvBtn.onclick = ()=>{ overlay.remove(); convertReceiptToInvoice(r.id); };

  const invBtn = overlay.querySelector('#invBtn');
  if(invBtn) invBtn.onclick = ()=>{ overlay.remove(); openReceiptPrint(r,'invoice'); };
  
  const woBtn = overlay.querySelector('#workOrderBtn');
  if(woBtn) woBtn.onclick = ()=>{ overlay.remove(); openReceiptPrint(r,'workorder'); };

  const costEstBtn = overlay.querySelector('#detailCostEstimateBtn');
  if(costEstBtn) costEstBtn.onclick = ()=>{ overlay.remove(); openCostEstimateModal(r); };

  const detWaNotifyBtn = overlay.querySelector('#detailWaNotifyBtn');
  if(detWaNotifyBtn) detWaNotifyBtn.onclick = ()=>{ overlay.remove(); openWhatsappChoice(r); };

  const detStickerBtn = overlay.querySelector('#detailStickerBtn');
  if(detStickerBtn) detStickerBtn.onclick = ()=>{ overlay.remove(); openStickerPrint(r); };

  const detStickerOptsBtn = overlay.querySelector('#detailStickerOptsBtn');
  if(detStickerOptsBtn) detStickerOptsBtn.onclick = ()=>{ overlay.remove(); openStickerPrint(r, true); };

  const reIntakeBtn = overlay.querySelector('#reIntakeDeviceDetailBtn');
  if(reIntakeBtn) reIntakeBtn.onclick = ()=>{ overlay.remove(); openReIntakeDeviceModal(r); };

  const histReIntakeBtn = overlay.querySelector('#historyReIntakeBtn');
  if(histReIntakeBtn) histReIntakeBtn.onclick = ()=>{ overlay.remove(); openReIntakeDeviceModal(r); };

  overlay.querySelectorAll('.view-hist-receipt-btn').forEach(b => {
    b.onclick = ()=>{
      const targetId = b.dataset.histid;
      const targetNum = b.dataset.histnum;
      const target = findReceiptByIdOrNum(targetId || targetNum);
      if(target){
        overlay.remove();
        openReceiptDetail(target);
      } else {
        showToast('لم يتم العثور على الإيصال المطلوب', 'error');
      }
    };
  });
  } catch(err){
    console.error('openReceiptDetail error:', err);
    showToast('حدث خطأ أثناء فتح الإيصال: ' + (err.message || err), 'error');
  }
}

/* ---------------- Print A5 Single Sheet Guarantee ---------------- */
function openReceiptPrint(rawR, kind){
  if(!rawR) return;
  const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
  // 1. Clean previous print styles and mounts
  const oldMount = document.getElementById('printMount');
  if(oldMount) oldMount.remove();
  const oldA5Style = document.getElementById('dynamicA5ReceiptStyle');
  if(oldA5Style) oldA5Style.remove();
  const oldThermal = document.getElementById('dynamicThermalReceiptStyle');
  if(oldThermal) oldThermal.remove();

  document.body.classList.remove(
    'printing-sticker',
    'printing-pos-receipt',
    'printing-quotation-doc',
    'printing-voucher',
    'printing-barcode-studio'
  );
  document.body.classList.add('printing-a5-receipt');

  // Inject strictly-calibrated A5 Landscape page rule for Dual-Copy Side-by-Side Printing
  const a5Style = document.createElement('style');
  a5Style.id = 'dynamicA5ReceiptStyle';
  a5Style.innerHTML = `
    @media print {
      @page {
        size: A5 landscape !important;
        margin: 0mm !important;
      }
      @page :left { margin: 0mm !important; }
      @page :right { margin: 0mm !important; }
      @page :first { margin: 0mm !important; }
      html, body.printing-a5-receipt {
        width: 210mm !important;
        height: 148mm !important;
        max-height: 148mm !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        position: static !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body.printing-a5-receipt #app,
      body.printing-a5-receipt .sidebar,
      body.printing-a5-receipt .top-header,
      body.printing-a5-receipt #toastContainer,
      body.printing-a5-receipt .modal-overlay,
      body.printing-a5-receipt .cmd-palette-overlay {
        display: none !important;
      }
      body.printing-a5-receipt #printMount {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 210mm !important;
        height: 148mm !important;
        max-height: 148mm !important;
        margin: 0 !important;
        padding: 0 !important;
        position: static !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        page-break-inside: avoid !important;
        page-break-after: avoid !important;
        break-inside: avoid !important;
        break-after: avoid !important;
      }
      body.printing-a5-receipt #receiptPaper {
        position: static !important;
        width: 204mm !important;
        max-width: 204mm !important;
        height: 140mm !important;
        max-height: 140mm !important;
        margin: auto !important;
        padding: 0 !important;
        border: none !important;
        background: #ffffff !important;
        color: #000000 !important;
        box-shadow: none !important;
        display: grid !important;
        grid-template-columns: 1fr 6mm 1fr !important;
        gap: 0 !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        page-break-inside: avoid !important;
        page-break-after: avoid !important;
        break-inside: avoid !important;
        break-after: avoid !important;
      }
      .a5-copy-card {
        border: 1.2px solid #0f172a !important;
        border-radius: 4px !important;
        box-sizing: border-box !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  `;
  document.head.appendChild(a5Style);

  const mount = document.createElement('div');
  mount.id = 'printMount';

  const titles = {receipt:'إيصال استلام جهاز للصيانة', invoice:'فاتورة صيانة نهائية', workorder:'أمر شغل داخلي للفني'};
  const trackUrl = `${window.location.origin}${window.location.pathname}?track=${encodeURIComponent(r.receiptNumber)}`;
  const qrSvgHtml = QRCodeGenerator.toSvg(trackUrl, 30);

  function buildHalfCopy(copyRole, barcodeId){
    const isCust = copyRole === 'customer';
    const roleBadge = isCust
      ? '<span style="background:#0f172a;color:#fff;font-size:8px;font-weight:900;padding:1px 6px;border-radius:3px;">نسخة العميل</span>'
      : '<span style="background:#047857;color:#fff;font-size:8px;font-weight:900;padding:1px 6px;border-radius:3px;">نسخة المركز</span>';

    const otherAmt = Number(r.otherAccountAmount || 0);
    const remaining = Number(r.cost||0)+Number(r.partsCost||0)+otherAmt-Number(r.deposit||0)+Number(r.refunded||0);
    const customerFullName = escapeHtml((typeof formatCustomerFullName === 'function') ? formatCustomerFullName(r) : (r.customer?.name || extractCustomerName(r) || 'عميل'));
    const dCat = escapeHtml((r.device && r.device.category) || 'جهاز');
    const dBrand = escapeHtml(r.device ? (r.device.brand==='أخرى'?r.device.brandOther:r.device.brand) : '');
    const dModel = escapeHtml((r.device && r.device.model) || '');
    const dPass = escapeHtml((r.device && r.device.password) || r.password || '');
    const dAccessories = escapeHtml(r.device && r.device.accessories ? r.device.accessories : 'بدون');
    const faultsStr = escapeHtml((Array.isArray(r.faults) ? r.faults.join('، ') : String(r.faults || '')) || '-');
    const rTime = (typeof formatReceiptTime === 'function' ? formatReceiptTime(r) : (r.time || ''));
    const phoneVal = escapeHtml(r.customer?.phone || extractCustomerPhone(r) || '-');

    return `
    <div class="a5-copy-card" style="width:99mm;height:140mm;max-height:140mm;border:1.2px solid #0f172a;border-radius:4px;padding:2mm 2.5mm;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;overflow:hidden;background:#fff;color:#000;font-size:8px;line-height:1.15;direction:rtl;">
      <!-- Top Part -->
      <div>
        <!-- Header Row -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1.5px solid #0f172a;padding-bottom:1.5px;margin-bottom:1.5px;">
          <div>
            <div style="display:flex;align-items:center;gap:3px;">
              ${state.settings.logoUrl ? `<img src="${state.settings.logoUrl}" style="max-height:16px;max-width:36px;object-fit:contain;">` : ''}
              <b style="font-size:9.5px;font-weight:900;color:#0f172a;">${escapeHtml(state.settings.shopName || 'صيانة ميكروتك')}</b>
            </div>
            <div style="font-size:7px;color:#475569;margin-top:0.5px;">إيصال صيانة معتمد ${state.settings.phone ? '• ' + escapeHtml(state.settings.phone) : ''}</div>
          </div>
          <div style="text-align:left;">
            ${roleBadge}
          </div>
        </div>

        <!-- Receipt # & Barcode / QR Row -->
        <div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;border:1px solid #cbd5e1;border-radius:3px;padding:1.5px 3px;margin-bottom:1.5px;">
          <div>
            <div style="display:flex;align-items:center;gap:3px;">
              <b class="mono" style="font-size:10.5px;font-weight:900;color:#0f172a;">#${r.receiptNumber}</b>
              <span style="font-size:7px;color:#475569;">${cleanDate(r.date)} ${rTime ? rTime : ''}</span>
            </div>
            <svg id="${barcodeId}" style="margin-top:1px;"></svg>
          </div>
          <div style="width:30px;height:30px;border:1px solid #cbd5e1;border-radius:3px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff;">
            ${qrSvgHtml}
          </div>
        </div>

        <!-- Customer Info -->
        <table style="width:100%;border-collapse:collapse;font-size:7.5px;margin-bottom:1.5px;">
          <tr>
            <td style="width:18%;padding:1px 2px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1;">العميل</td>
            <td style="width:42%;padding:1px 2px;border:1px solid #cbd5e1;font-weight:900;font-size:8.5px;">${customerFullName}</td>
            <td style="width:14%;padding:1px 2px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1;">الهاتف</td>
            <td class="mono" style="padding:1px 2px;border:1px solid #cbd5e1;font-weight:900;font-size:9px;direction:ltr;text-align:right;">${phoneVal}</td>
          </tr>
        </table>

        <!-- Device & Fault Info -->
        ${(Array.isArray(r.devices) && r.devices.length > 1) ? `
          <table style="width:100%;border-collapse:collapse;font-size:7px;margin-bottom:1.5px;">
            <thead>
              <tr style="background:#f1f5f9;font-weight:bold;">
                <th style="border:1px solid #cbd5e1;padding:1px 2px;width:14px;text-align:center;">#</th>
                <th style="border:1px solid #cbd5e1;padding:1px 2px;text-align:right;">الجهاز والموديل</th>
                <th style="border:1px solid #cbd5e1;padding:1px 2px;text-align:right;">الأعطال وملاحظات الفحص</th>
                <th style="border:1px solid #cbd5e1;padding:1px 2px;width:38px;text-align:center;">الملحقات</th>
              </tr>
            </thead>
            <tbody>
              ${r.devices.map((dv, idx) => {
                const c = escapeHtml(dv.category || 'جهاز');
                const b = escapeHtml(dv.brand === 'أخرى' ? dv.brandOther : (dv.brand || ''));
                const m = escapeHtml(dv.model || '');
                const p = dv.password ? ` [كلمة السر: ${escapeHtml(dv.password)}]` : '';
                const f = (Array.isArray(dv.faults) ? dv.faults.join('، ') : String(dv.faults || '')) || '';
                const n = dv.faultNotes ? ` (${escapeHtml(dv.faultNotes)})` : '';
                const fStr = escapeHtml(f) + n;
                const acc = escapeHtml(dv.accessories || 'بدون');
                return `
                  <tr>
                    <td style="border:1px solid #cbd5e1;padding:1px 2px;text-align:center;font-weight:bold;">${idx+1}</td>
                    <td style="border:1px solid #cbd5e1;padding:1px 2px;font-weight:800;">${c} ${b} ${m}${p}</td>
                    <td style="border:1px solid #cbd5e1;padding:1px 2px;color:#0f172a;">${fStr || '-'}</td>
                    <td style="border:1px solid #cbd5e1;padding:1px 2px;text-align:center;font-size:6.5px;">${acc}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <table style="width:100%;border-collapse:collapse;font-size:7px;margin-bottom:1.5px;">
            <tr>
              <td style="width:18%;padding:1px 2px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1;">الفني</td>
              <td style="padding:1px 2px;border:1px solid #cbd5e1;">${escapeHtml(r.technician || '-')}</td>
              <td style="width:18%;padding:1px 2px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1;">التسليم</td>
              <td style="padding:1px 2px;border:1px solid #cbd5e1;font-weight:bold;">${cleanDate(r.deliveryDate) || 'يحدد لاحقاً'}</td>
            </tr>
          </table>
        ` : `
          <table style="width:100%;border-collapse:collapse;font-size:7.5px;margin-bottom:1.5px;">
            <tr>
              <td style="width:18%;padding:1px 2px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1;">الجهاز</td>
              <td colspan="3" style="padding:1px 2px;border:1px solid #cbd5e1;font-weight:800;">${dCat} - ${dBrand} ${dModel}</td>
            </tr>
            <tr>
              <td style="padding:1px 2px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1;">الملحقات</td>
              <td style="padding:1px 2px;border:1px solid #cbd5e1;">${dAccessories}</td>
              <td style="padding:1px 2px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1;">الباسورد</td>
              <td class="mono" style="padding:1px 2px;border:1px solid #cbd5e1;font-weight:bold;color:#b45309;">${dPass ? dPass : 'بدون'}</td>
            </tr>
            <tr>
              <td style="padding:1px 2px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1;">العطل</td>
              <td colspan="3" style="padding:1px 2px;border:1px solid #cbd5e1;font-weight:bold;color:#0f172a;">${faultsStr}${r.faultNotes ? ' ('+escapeHtml(r.faultNotes)+')' : ''}</td>
            </tr>
            <tr>
              <td style="padding:1px 2px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1;">الفني</td>
              <td style="padding:1px 2px;border:1px solid #cbd5e1;">${escapeHtml(r.technician || '-')}</td>
              <td style="padding:1px 2px;background:#f1f5f9;font-weight:bold;border:1px solid #cbd5e1;">التسليم</td>
              <td style="padding:1px 2px;border:1px solid #cbd5e1;font-weight:bold;">${cleanDate(r.deliveryDate) || 'يحدد لاحقاً'}</td>
            </tr>
          </table>
        `}

        <!-- Spare Parts Info if any -->
        ${(Array.isArray(r.partsList) && r.partsList.length > 0) ? `
          <div style="font-size:6.5px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:2px;padding:1.5px 3px;margin-bottom:1.5px;color:#5b21b6;">
            <b>قطع الغيار المستبدلة:</b> ${r.partsList.map(p => `${escapeHtml(p.name||'قطعة')} (${p.qty||1}) [${p.warrantyDays ? p.warrantyDays+'يوم' : 'بدون ضمان'}]`).join(' • ')}
          </div>
        ` : ''}

        <!-- Financial Box -->
        <div style="display:grid;grid-template-columns:${Number(r.partsCost||0) > 0 ? '1fr 1fr 1fr 1.2fr' : '1fr 1fr 1.3fr'};gap:2px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:3px;padding:2px;text-align:center;font-size:7.5px;margin-bottom:1.5px;">
          <div style="padding:1px;">
            <div style="color:#64748b;font-size:6.5px;">أجور الصيانة</div>
            <div class="mono" style="font-weight:800;font-size:8px;">${Number(r.cost||0)} ج.م</div>
          </div>
          ${Number(r.partsCost||0) > 0 ? `
          <div style="padding:1px;">
            <div style="color:#64748b;font-size:6.5px;">قطع الغيار</div>
            <div class="mono" style="font-weight:800;font-size:8px;color:#7c3aed;">${Number(r.partsCost||0)} ج.م</div>
          </div>
          ` : ''}
          <div style="padding:1px;">
            <div style="color:#64748b;font-size:6.5px;">مدفوع مقدم${(Number(r.deposit||0) > 0 && r.depositPaymentMethod) ? ` (${escapeHtml(r.depositPaymentMethod)})` : ''}</div>
            <div class="mono" style="font-weight:800;font-size:8px;color:#047857;">${Number(r.deposit||0)} ج.م</div>
          </div>
          <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:2px;padding:1px;">
            <div style="color:#92400e;font-size:6.5px;font-weight:bold;">المتبقي المطلوب</div>
            <div class="mono" style="font-weight:900;font-size:9px;color:#b45309;">${remaining} ج.م</div>
          </div>
        </div>
      </div>

      <!-- Bottom Part: Terms & Signatures -->
      <div>
        ${(Array.isArray(r.photos) && r.photos.length > 0) ? `
          <div style="font-size:6.5px;color:#0369a1;background:#f0f9ff;border:1px solid #bae6fd;border-radius:2px;padding:1px 3px;margin-bottom:1.5px;display:flex;align-items:center;gap:3px;">
            <span>${getSvgIcon("camera", 16)}</span>
            <span><b>توثيق مصور:</b> تم حفظ (${r.photos.length}) صور لحالة وفحص الجهاز عند الاستلام في النظام.</span>
          </div>
        ` : ''}
        <div style="font-size:6px;color:#475569;line-height:1.2;border-top:1px dashed #cbd5e1;padding-top:1px;margin-bottom:1.5px;">
          • المركز غير مسؤول عن الجهاز بعد 30 يوماً من إخطار الجاهزية.<br>
          • هذا الإيصال هو الوثيقة الرسمية والوحيدة المعتمدة لاستلام الجهاز.
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;font-size:7px;color:#334155;border-top:1px solid #cbd5e1;padding-top:1.5px;">
          ${isCust ? `
            <div>توقيع المستلم: <b>${escapeHtml(r.updatedBy || r.createdBy || state.user?.name || 'الموظف')}</b></div>
            <div>ختم المركز: [ .................... ]</div>
          ` : `
            <div>إقرار وتوقيع العميل: ..........................</div>
            <div>التاريخ: ${cleanDate(r.date)}</div>
          `}
        </div>
        <div style="font-size:5.5px;color:#94a3b8;text-align:center;margin-top:1px;">ميكروERP • نظام إدارة مراكز الصيانة</div>
      </div>
    </div>`;
  }

  mount.innerHTML = `
  <div id="receiptPaper" style="width:204mm;height:140mm;max-height:140mm;margin:auto;display:grid;grid-template-columns:1fr 6mm 1fr;gap:0;box-sizing:border-box;overflow:hidden;background:#fff;direction:rtl;">
    <!-- Right: Customer Copy (نسخة العميل) -->
    ${buildHalfCopy('customer', 'printBarcode_1')}

    <!-- Center: Dashed Cutting Divider Line -->
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;height:140mm;width:6mm;">
      <div style="width:0;height:100%;border-left:1.5px dashed #94a3b8;"></div>
      
    </div>

    <!-- Left: Center / Shop Copy (نسخة المركز) -->
    ${buildHalfCopy('shop', 'printBarcode_2')}
  </div>`;
  document.body.appendChild(mount);

  if(typeof JsBarcode !== 'undefined'){
    try{
      JsBarcode('#printBarcode_1', r.receiptNumber, {format:'CODE128', width:0.85, height:13, displayValue:false, margin:0});
      JsBarcode('#printBarcode_2', r.receiptNumber, {format:'CODE128', width:0.85, height:13, displayValue:false, margin:0});
    }catch(e){}
  }

  const cleanupA5 = ()=>{
    if(mount && mount.parentNode) mount.remove();
    document.body.classList.remove('printing-a5-receipt');
    if(a5Style && a5Style.parentNode) a5Style.remove();
    window.removeEventListener('afterprint', cleanupA5);
  };
  window.addEventListener('afterprint', cleanupA5);

  setTimeout(()=>{
    window.print();
    setTimeout(cleanupA5, 800);
  }, 150);
}

/* ---------------- Thermal Barcode Sticker Engine (Multi-Size Responsive: 40x20, 40x10, 20x40, etc.) ---------------- */

function getThermalStickerDimensions(sizeKey, customW, customH){
  const map = {
    '40x20': { w: 40, h: 20, name: '40×20 مم (عرض 4 سم × ارتفاع 2 سم - عريض)' },
    '40x10': { w: 40, h: 10, name: '40×10 مم (عرض 4 سم × ارتفاع 1 سم - رفيع)' },
    '40x25': { w: 40, h: 25, name: '40×25 مم (4×2.5 سم)' },
    '40x30': { w: 40, h: 30, name: '40×30 مم (4×3 سم)' },
    '40x15': { w: 40, h: 15, name: '40×15 مم (4×1.5 سم)' },
    '50x25': { w: 50, h: 25, name: '50×25 مم (5×2.5 سم)' },
    '50x30': { w: 50, h: 30, name: '50×30 مم (5×3 سم)' },
    '38x25': { w: 38, h: 25, name: '38×25 مم' },
    '20x40': { w: 20, h: 40, name: '20×40 مم (2×4 سم طولي)' },
    '10x40': { w: 10, h: 40, name: '10×40 مم (1×4 سم طولي)' },
    '60x40': { w: 60, h: 40, name: '60×40 مم' }
  };
  if(sizeKey === 'custom'){
    const w = Math.max(10, Math.min(120, Number(customW) || 40));
    const h = Math.max(10, Math.min(120, Number(customH) || 20));
    return { w, h, name: `مخصص (${w}×${h} مم)` };
  }
  return map[sizeKey] || map['40x20'];
}

function renderStickerBarcodeSVG(target, barcodeVal, dim, format = 'CODE128'){
  if(typeof JsBarcode === 'undefined') return;
  const val = String(barcodeVal || '100000000000').trim();
  if(!val) return;

  const minDim = Math.min(dim.w, dim.h);
  let bWidth = 1.2;
  let bHeight = 20;

  if(dim.w < dim.h){
    // Portrait sticker (e.g. 20x40 mm)
    bWidth = 1.0;
    bHeight = 18;
  } else if(minDim <= 12){
    // Slim (e.g. 40x10 mm)
    bWidth = 0.9;
    bHeight = 12;
  } else if(minDim <= 17){
    // 40x15 mm
    bWidth = 1.0;
    bHeight = 15;
  } else if(minDim <= 24){
    // 40x20 mm & 40x25 mm — بارود واضح وعريض
    bWidth = 1.15;
    bHeight = 22;
  } else {
    // 50x30 or larger
    bWidth = 1.4;
    bHeight = 28;
  }

  if(val.length > 10) bWidth = Math.max(0.9, bWidth * 0.88);
  if(val.length > 15) bWidth = Math.max(0.8, bWidth * 0.82);

  try {
    JsBarcode(target, val, {
      format: format || 'CODE128',
      width: bWidth,
      height: bHeight,
      displayValue: false,
      margin: 0
    });
  } catch(err) {
    try {
      JsBarcode(target, val, {
        width: bWidth,
        height: bHeight,
        displayValue: false,
        margin: 0
      });
    } catch(e2){
      console.warn('JsBarcode render fallback failed:', e2);
    }
  }
}

function generateProductStickerHTML(item, dim, svgId){
  const bs = state.barcodeStudio || {};
  const prn = (state.settings && state.settings.printers && state.settings.printers.barcodePrinter) || {};

  // Read visibility toggles from Barcode Studio settings with printer fallbacks
  const showShopName = (bs.showShopName !== undefined) ? Boolean(bs.showShopName) : (prn.showShopName !== false);
  const showItemName = (bs.showItemName !== undefined) ? Boolean(bs.showItemName) : (prn.showItemName !== false);
  const showPrice = (bs.showPrice !== undefined) ? Boolean(bs.showPrice) : (prn.showPrice !== false);
  const showBarcodeText = (bs.showBarcodeText !== undefined) ? Boolean(bs.showBarcodeText) : true;
  const showDate = (bs.showDate !== undefined) ? Boolean(bs.showDate) : (prn.showDate === true);

  const rawShopName = (state.settings && state.settings.shopName) || 'صيانة ميكروتك';
  const shopName = escapeHtml(rawShopName.length > 20 ? (rawShopName.slice(0, 18) + '..') : rawShopName);
  const name = escapeHtml(item.Name || item.name || 'صنف');
  const cat = escapeHtml(item.Category || item.category || '');
  const price = Number(item.SellPrice || item.PurchasePrice || item.price || 0).toLocaleString();
  const barcodeVal = escapeHtml(String(item.Barcode || item.SKU || item.barcode || item.sku || item.ID || '1001'));
  const todayStr = cleanDate(new Date());

  // Portrait layout (w < h, e.g. 20x40 mm or 10x40 mm)
  if(dim.w < dim.h){
    return `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:1.5mm 1mm;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;text-align:center;direction:rtl;">
      ${showShopName ? `<div style="border-bottom:1px solid #000;padding-bottom:0.3mm;font-size:7.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${shopName}</div>` : ''}
      ${showItemName ? `<div style="font-size:8px;font-weight:900;line-height:1.2;max-height:6.5mm;overflow:hidden;margin:0.3mm 0;">${name}</div>` : ''}
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0.3mm 0;flex:1;">
        <svg id="${svgId}" style="max-height:8mm;max-width:96%;display:block;margin:0 auto;"></svg>
        ${showBarcodeText ? `<span class="mono" style="font-size:7px;font-weight:900;letter-spacing:0.3px;line-height:1;margin-top:0.3mm;">${barcodeVal}</span>` : ''}
      </div>
      ${showPrice ? `<div style="border-top:1px solid #000;padding-top:0.3mm;font-size:9.5px;font-weight:900;" class="mono">${price} ج.م</div>` : ''}
    </div>`;
  }

  // Landscape layouts (w >= h)
  if(dim.h <= 12){
    // 40x10 mm ultra-slim (4×1 سم شريط رفيع للبضائع)
    return `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:0.6mm 1.5mm;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;">
      <div style="display:flex;justify-content:space-between;align-items:center;line-height:1;gap:1mm;flex-shrink:0;">
        ${showItemName ? `<span style="font-size:8px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:65%;">${name}</span>` : (showShopName ? `<span style="font-size:7.5px;font-weight:900;">${shopName}</span>` : '<span></span>')}
        ${showPrice ? `<b class="mono" style="font-size:8.5px;font-weight:900;white-space:nowrap;">${price} ج</b>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;flex:1;">
        <svg id="${svgId}" style="width:100%;max-height:5.2mm;display:block;margin:0 auto;"></svg>
        ${showBarcodeText ? `<span class="mono" style="font-size:6.5px;font-weight:900;letter-spacing:0.5px;line-height:1;margin-top:0.2mm;text-align:center;">${barcodeVal}</span>` : ''}
      </div>
    </div>`;
  } else if(dim.h <= 17){
    // 40x15 mm layout
    return `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:1mm 1.5mm;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;">
      ${(showShopName || showPrice) ? `
      <div style="display:flex;justify-content:space-between;align-items:center;line-height:1;border-bottom:1px solid #000;padding-bottom:0.3mm;flex-shrink:0;">
        <span style="font-size:7.5px;font-weight:900;">${showShopName ? shopName : ''}</span>
        ${showPrice ? `<b class="mono" style="font-size:8.5px;font-weight:900;">${price} ج.م</b>` : ''}
      </div>` : ''}
      ${showItemName ? `<div style="font-size:8px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.15;margin:0.2mm 0;flex-shrink:0;">${name}</div>` : ''}
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;flex:1;">
        <svg id="${svgId}" style="max-height:5.8mm;width:100%;display:block;margin:0 auto;"></svg>
        ${showBarcodeText ? `<span class="mono" style="font-size:7px;font-weight:900;line-height:1;margin-top:0.2mm;">${barcodeVal}</span>` : ''}
      </div>
    </div>`;
  } else if(dim.h <= 24){
    // 40x20 mm & 40x25 mm layout (Primary User Roll: 4x2 cm)
    return `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:1.5mm 2mm;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;">
      ${(showShopName || cat) ? `
      <div style="display:flex;justify-content:space-between;align-items:center;line-height:1;border-bottom:1px solid #000;padding-bottom:0.4mm;flex-shrink:0;">
        <span style="font-size:8px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:65%;">${showShopName ? shopName : ''}</span>
        ${cat ? `<span class="mono" style="font-size:7px;font-weight:900;">${cat}</span>` : ''}
      </div>` : ''}
      ${showItemName ? `
      <div style="font-size:8.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.15;margin:0.3mm 0;flex-shrink:0;">
        ${name}
      </div>` : ''}
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;flex:1;">
        <svg id="${svgId}" style="width:100%;max-height:7.2mm;display:block;margin:0 auto;"></svg>
        ${showBarcodeText ? `<span class="mono" style="font-size:7.5px;font-weight:900;letter-spacing:0.8px;line-height:1;margin-top:0.3mm;text-align:center;">${barcodeVal}</span>` : ''}
      </div>
      ${(showPrice || showDate) ? `
      <div style="display:flex;justify-content:space-between;align-items:center;line-height:1;border-top:1px solid #000;padding-top:0.4mm;flex-shrink:0;">
        ${showPrice ? `<span style="font-size:7.5px;font-weight:900;">السعر: <b class="mono" style="font-size:10px;font-weight:900;">${price} ج.م</b></span>` : '<span></span>'}
        ${showDate ? `<span class="mono" style="font-size:7px;font-weight:800;">${todayStr}</span>` : ''}
      </div>` : ''}
    </div>`;
  } else {
    // 50x25, 50x30, 60x40 mm larger stickers
    return `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:1.5mm 2mm;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;">
      ${(showShopName || cat) ? `
      <div style="display:flex;justify-content:space-between;align-items:center;line-height:1;border-bottom:1.5px solid #000;padding-bottom:0.5mm;flex-shrink:0;">
        <span style="font-size:9px;font-weight:900;">${showShopName ? shopName : ''}</span>
        ${cat ? `<span class="mono" style="font-size:8px;font-weight:900;">${cat}</span>` : ''}
      </div>` : ''}
      ${showItemName ? `
      <div style="font-size:9.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2;margin:0.4mm 0;flex-shrink:0;">
        ${name}
      </div>` : ''}
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;flex:1;">
        <svg id="${svgId}" style="max-height:9.5mm;width:100%;display:block;margin:0 auto;"></svg>
        ${showBarcodeText ? `<span class="mono" style="font-size:8.5px;font-weight:900;letter-spacing:0.5px;line-height:1;margin-top:0.4mm;">${barcodeVal}</span>` : ''}
      </div>
      ${(showPrice || showDate) ? `
      <div style="display:flex;justify-content:space-between;align-items:center;line-height:1;border-top:1.5px solid #000;padding-top:0.5mm;flex-shrink:0;">
        ${showPrice ? `<span style="font-size:8.5px;font-weight:900;">السعر: <b class="mono" style="font-size:12px;font-weight:900;">${price} ج.م</b></span>` : '<span></span>'}
        ${showDate ? `<span class="mono" style="font-size:8px;font-weight:800;">${todayStr}</span>` : ''}
      </div>` : ''}
    </div>`;
  }
}

function generateReceiptStickerHTML(r, dim, svgId, customOpts){
  const prn = (state.settings && state.settings.printers && state.settings.printers.barcodePrinter) || {};
  const opts = Object.assign({
    barcodeMode: prn.barcodeMode || 'qr', // 'qr', 'barcode', 'none'
    showShopName: prn.showShopName !== false,
    showCustomerName: prn.showCustomerName !== false,
    showPhone: prn.showPhone !== false,
    showDevice: prn.showDevice !== false,
    showPassword: prn.showPassword !== false,
    showFaults: prn.showFaults !== false,
    showPrice: prn.showPrice === true,
    showDate: prn.showDate !== false,
    showBorder: prn.showBorder === true
  }, customOpts || {});

  const rawShopName = (state.settings && state.settings.shopName) || 'صيانة ميكروتك';
  const shopName = escapeHtml(rawShopName.length > 20 ? (rawShopName.slice(0, 18) + '..') : rawShopName);
  
  const fullCName = (typeof formatCustomerFullName === 'function') ? formatCustomerFullName(r) : ((r.customer && r.customer.name) || extractCustomerName(r) || 'عميل');
  const cName = escapeHtml(fullCName.slice(0, 22));
  const rawPhone = (r.customer && r.customer.phone) || extractCustomerPhone(r) || '';
  const cPhone = escapeHtml(rawPhone);
  const dCat = escapeHtml((r.device && r.device.category) || 'جهاز');
  const dBrand = escapeHtml(r.device ? (r.device.brand==='أخرى'?r.device.brandOther:r.device.brand) : '');
  const dModel = escapeHtml((r.device && r.device.model) || '');
  const pass = escapeHtml(((r.device && r.device.password) || r.password || '').slice(0, 14));
  const firstFault = escapeHtml(((Array.isArray(r.faults) && r.faults.length ? r.faults[0] : (typeof r.faults === 'string' ? r.faults : '')) || r.faultNotes || 'صيانة عامة').slice(0, 26));
  const rNum = escapeHtml(String(r.receiptNumber || ''));
  const intakeTime = (typeof formatReceiptTime === 'function' ? formatReceiptTime(r) : (r.time || ''));
  const dateTimeStr = escapeHtml(`${cleanDate(r.date)}${intakeTime ? ' ' + intakeTime : ''}`);

  const otherAmt = Number(r.otherAccountAmount || 0);
  const remCost = Number(r.cost || 0) + Number(r.partsCost || 0) + otherAmt - Number(r.deposit || 0) + Number(r.refunded || 0);
  const costStr = remCost > 0 ? `${remCost} ج.م` : (r.cost ? `${r.cost} ج.م` : '');

  const trackUrl = `${window.location.origin}${window.location.pathname}?track=${encodeURIComponent(r.receiptNumber || '')}`;
  const borderCss = opts.showBorder ? 'border:1px dashed #000;' : '';

  // ── Layout 1: 40x10 mm (عرض 4 سم × ارتفاع 1 سم - شريط فائق النحافة) ──
  if(dim.h <= 12){
    if(opts.barcodeMode === 'qr'){
      const qrSvg = QRCodeGenerator.toSvg(trackUrl, 32);
      return `
      <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:space-between;padding:0.5mm 1mm !important;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;line-height:1.1;${borderCss}">
        <div style="display:flex;flex-direction:column;justify-content:space-between;flex:1;min-width:0;height:100%;padding-left:1mm;">
          <div style="display:flex;justify-content:space-between;align-items:center;white-space:nowrap;overflow:hidden;gap:1mm;">
            <b class="mono" style="font-size:9px;font-weight:900;direction:ltr;color:#000;">#${rNum}</b>
            <span style="font-size:8.5px;font-weight:900;overflow:hidden;text-overflow:ellipsis;color:#000;">${cName}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;white-space:nowrap;overflow:hidden;gap:1mm;">
            <b class="mono" style="font-size:8.5px;font-weight:900;direction:ltr;color:#000;">${cPhone}</b>
            <span style="font-size:8px;font-weight:900;overflow:hidden;text-overflow:ellipsis;color:#000;">${dCat} ${dBrand}</span>
          </div>
        </div>
        <div style="width:8.5mm;height:8.5mm;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
          ${qrSvg}
        </div>
      </div>`;
    }
    if(opts.barcodeMode === 'barcode'){
      return `
      <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:0.5mm 1mm !important;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;line-height:1;${borderCss}">
        <div style="display:flex;justify-content:space-between;align-items:center;white-space:nowrap;overflow:hidden;gap:1mm;font-size:8px;">
          <b class="mono" style="font-size:8.5px;direction:ltr;">#${rNum}</b>
          <span style="overflow:hidden;text-overflow:ellipsis;">${cName}</span>
          <b class="mono" style="direction:ltr;">${cPhone}</b>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;flex:1;max-height:5.2mm;overflow:hidden;">
          <svg id="${svgId}" style="width:100%;max-height:5.2mm;display:block;margin:0 auto;"></svg>
        </div>
      </div>`;
    }
    // None (Text only)
    return `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:1mm 1.5mm !important;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;line-height:1.15;${borderCss}">
      <div style="display:flex;justify-content:space-between;align-items:center;white-space:nowrap;overflow:hidden;gap:1mm;">
        <b class="mono" style="font-size:9.5px;font-weight:900;direction:ltr;color:#000;">#${rNum}</b>
        <span style="font-size:9px;font-weight:900;overflow:hidden;text-overflow:ellipsis;color:#000;">${cName}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;white-space:nowrap;overflow:hidden;gap:1mm;">
        <b class="mono" style="font-size:9.5px;font-weight:900;direction:ltr;color:#000;">${cPhone}</b>
        <span style="font-size:8.5px;font-weight:900;overflow:hidden;text-overflow:ellipsis;color:#000;">${dCat} ${dBrand}</span>
      </div>
    </div>`;
  }

  // ── Layout 2: 40x20 mm roll (Standard 4x2 cm roll - المقاس الأساسي الأكثر استخداماً) ──
  if(dim.h <= 23){
    if(opts.barcodeMode === 'qr'){
      const qrSvg = QRCodeGenerator.toSvg(trackUrl, 48);
      return `
      <div style="width:100%;height:100%;max-height:${dim.h}mm;display:flex;flex-direction:row;align-items:stretch;justify-content:space-between;padding:0.8mm 1mm !important;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;line-height:1.15;gap:1mm;${borderCss}">
        <!-- Text Column -->
        <div style="display:flex;flex-direction:column;justify-content:space-between;flex:1;min-width:0;height:100%;overflow:hidden;">
          <!-- Row 1: Shop & Receipt # -->
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.2px solid #000;padding-bottom:0.2mm;flex-shrink:0;">
            ${opts.showShopName ? `<span style="font-size:8px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:55%;color:#000;letter-spacing:-0.2px;">${shopName}</span>` : '<span></span>'}
            <b class="mono" style="font-size:9.5px;font-weight:900;direction:ltr;display:inline-block;white-space:nowrap;color:#000;letter-spacing:0.2px;">#${rNum}</b>
          </div>
          <!-- Row 2: Customer Name -->
          ${opts.showCustomerName ? `
          <div style="font-size:8.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;flex-shrink:0;">
            <span style="font-size:7px;font-weight:800;color:#000;">ع:</span> <b style="font-size:8.5px;font-weight:900;color:#000;">${cName}</b>
          </div>` : ''}
          <!-- Row 3: Phone -->
          ${opts.showPhone ? `
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:8.5px;font-weight:900;white-space:nowrap;overflow:hidden;color:#000;flex-shrink:0;line-height:1;">
            <span style="font-size:7px;font-weight:800;color:#000;">هـ:</span>
            <b class="mono" style="font-size:9px;font-weight:900;direction:ltr;display:inline-block;letter-spacing:0.3px;color:#000;">${cPhone}</b>
          </div>` : ''}
          <!-- Row 4: Device & Pass -->
          ${opts.showDevice ? `
          <div style="font-size:7.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;flex-shrink:0;line-height:1.1;">
            <span style="font-size:6.5px;font-weight:800;color:#000;">ج:</span> <b style="color:#000;">${dCat} ${dBrand} ${dModel}</b>${opts.showPassword && pass ? ` | <span style="font-size:6.5px;">ب:</span><b class="mono" style="font-size:7.5px;color:#000;">${pass}</b>` : ''}
          </div>` : ''}
          <!-- Row 5: Fault & Price -->
          ${(opts.showFaults || (opts.showPrice && costStr)) ? `
          <div style="font-size:7.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;border-top:1px dashed #000;padding-top:0.2mm;flex-shrink:0;line-height:1.1;">
            ${opts.showFaults ? `<span style="font-size:6.5px;font-weight:800;color:#000;">ع:</span> <span style="font-weight:900;color:#000;">${firstFault}</span>` : ''}
            ${(opts.showPrice && costStr) ? `<span style="margin-right:2px;">| <b class="mono" style="font-size:8px;">${costStr}</b></span>` : ''}
          </div>` : ''}
        </div>
        <!-- Smart Tracking QR Column -->
        <div style="width:13.5mm;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
          <div style="width:13mm;height:13mm;display:flex;align-items:center;justify-content:center;">
            ${qrSvg}
          </div>
          <div style="font-size:6.5px;font-weight:900;line-height:1;margin-top:0.3mm;color:#000;white-space:nowrap;">تتبع الصيانة</div>
        </div>
      </div>`;
    }

    if(opts.barcodeMode === 'barcode'){
      return `
      <div style="width:100%;height:100%;max-height:${dim.h}mm;display:flex;flex-direction:column;justify-content:space-between;padding:0.8mm 1.2mm !important;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;line-height:1.1;${borderCss}">
        <!-- Row 1: Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #000;padding-bottom:0.2mm;flex-shrink:0;">
          ${opts.showShopName ? `<span style="font-size:8px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:55%;color:#000;">${shopName}</span>` : '<span></span>'}
          <b class="mono" style="font-size:9.5px;font-weight:900;direction:ltr;display:inline-block;white-space:nowrap;color:#000;">#${rNum}</b>
        </div>
        <!-- Row 2: Customer & Phone -->
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:8px;font-weight:900;white-space:nowrap;overflow:hidden;flex-shrink:0;">
          ${opts.showCustomerName ? `<span style="overflow:hidden;text-overflow:ellipsis;max-width:52%;">ع: ${cName}</span>` : '<span></span>'}
          ${opts.showPhone ? `<b class="mono" style="font-size:8.5px;direction:ltr;">${cPhone}</b>` : ''}
        </div>
        <!-- Row 3: Device & Pass -->
        ${opts.showDevice ? `
        <div style="font-size:7.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0;">
          ج: ${dCat} ${dBrand} ${dModel}${opts.showPassword && pass ? ` | ب:<b class="mono">${pass}</b>` : ''}
        </div>` : ''}
        <!-- Row 4: Barcode SVG -->
        <div style="display:flex;align-items:center;justify-content:center;flex:1;max-height:6mm;overflow:hidden;margin:0.2mm 0;">
          <svg id="${svgId}" style="width:100%;max-height:5.8mm;display:block;margin:0 auto;"></svg>
        </div>
        <!-- Row 5: Fault -->
        ${(opts.showFaults || (opts.showPrice && costStr)) ? `
        <div style="font-size:7px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-top:0.8px dashed #000;padding-top:0.2mm;flex-shrink:0;">
          ${opts.showFaults ? `ع: ${firstFault}` : ''}
          ${(opts.showPrice && costStr) ? ` | <b class="mono">${costStr}</b>` : ''}
        </div>` : ''}
      </div>`;
    }

    // None (Pure Typography)
    return `
    <div style="width:100%;height:100%;max-height:${dim.h}mm;display:flex;flex-direction:column;justify-content:space-between;padding:1mm 1.5mm !important;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;line-height:1.15;${borderCss}">
      <!-- Row 1: Header -->
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid #000;padding-bottom:0.2mm;flex-shrink:0;">
        ${opts.showShopName ? `<span style="font-size:9px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:52%;color:#000;letter-spacing:-0.2px;">${shopName}</span>` : '<span></span>'}
        <b class="mono" style="font-size:10.5px;font-weight:900;direction:ltr;display:inline-block;white-space:nowrap;color:#000;letter-spacing:0.3px;">#${rNum}</b>
      </div>
      <!-- Row 2: Customer Name -->
      ${opts.showCustomerName ? `
      <div style="font-size:9.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;flex-shrink:0;">
        <span style="font-size:8.5px;font-weight:800;color:#000;">العميل:</span> <b style="font-size:9.5px;font-weight:900;color:#000;">${cName}</b>
      </div>` : ''}
      <!-- Row 3: Phone -->
      ${opts.showPhone ? `
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:9.5px;font-weight:900;white-space:nowrap;overflow:hidden;color:#000;flex-shrink:0;">
        <span style="font-size:8.5px;font-weight:800;color:#000;">الهاتف:</span>
        <b class="mono" style="font-size:10px;font-weight:900;direction:ltr;display:inline-block;letter-spacing:0.5px;color:#000;">${cPhone}</b>
      </div>` : ''}
      <!-- Row 4: Device & Model & Password -->
      ${opts.showDevice ? `
      <div style="font-size:8.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;flex-shrink:0;">
        <span style="font-size:8px;font-weight:800;color:#000;">الجهاز:</span> <b style="color:#000;">${dCat} ${dBrand} ${dModel}</b>${opts.showPassword && pass ? ` | <span style="font-size:7.5px;">ب:</span><b class="mono" style="font-size:8px;color:#000;">${pass}</b>` : ''}
      </div>` : ''}
      <!-- Row 5: Fault & Details -->
      ${(opts.showFaults || (opts.showPrice && costStr) || opts.showDate) ? `
      <div style="font-size:8px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;border-top:1px dashed #000;padding-top:0.2mm;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <span style="overflow:hidden;text-overflow:ellipsis;max-width:65%;">${opts.showFaults ? `<b>العطل:</b> ${firstFault}` : ''}${(opts.showPrice && costStr) ? ` | <b>${costStr}</b>` : ''}</span>
        ${opts.showDate ? `<span class="mono" style="font-size:7px;font-weight:800;">${dateTimeStr}</span>` : ''}
      </div>` : ''}
    </div>`;
  }

  // ── Layout 3: Larger Labels (40x25, 40x30, 50x25, 50x30, 60x40 mm, etc.) ──
  if(opts.barcodeMode === 'qr'){
    const qrSvg = QRCodeGenerator.toSvg(trackUrl, 64);
    return `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:1.5mm 2mm !important;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;line-height:1.2;${borderCss}">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid #000;padding-bottom:0.4mm;flex-shrink:0;">
        ${opts.showShopName ? `<b style="font-size:10.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:58%;color:#000;">${shopName}</b>` : '<span></span>'}
        <b class="mono" style="font-size:12.5px;font-weight:900;direction:ltr;display:inline-block;white-space:nowrap;color:#000;">#${rNum}</b>
      </div>
      <!-- Body Split (Data + QR) -->
      <div style="display:flex;align-items:stretch;justify-content:space-between;gap:1.5mm;flex:1;overflow:hidden;margin:0.5mm 0;">
        <div style="display:flex;flex-direction:column;justify-content:space-around;flex:1;min-width:0;">
          ${opts.showCustomerName ? `<div style="font-size:10.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><span style="font-size:9px;font-weight:800;">العميل:</span> ${cName}</div>` : ''}
          ${opts.showPhone ? `<div style="font-size:10.5px;font-weight:900;white-space:nowrap;overflow:hidden;"><span style="font-size:9px;font-weight:800;">الهاتف:</span> <b class="mono" style="font-size:10.5px;direction:ltr;">${cPhone}</b></div>` : ''}
          ${opts.showDevice ? `<div style="font-size:9.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><span style="font-size:8.5px;font-weight:800;">الجهاز:</span> ${dCat} ${dBrand} ${dModel}${opts.showPassword && pass ? ` | <span style="font-size:8px;">ب:</span><b class="mono">${pass}</b>` : ''}</div>` : ''}
          ${(opts.showPrice && costStr) ? `<div style="font-size:9.5px;font-weight:900;">المطلوب: <b class="mono" style="font-size:11px;">${costStr}</b></div>` : ''}
        </div>
        <div style="width:17mm;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
          <div style="width:16mm;height:16mm;display:flex;align-items:center;justify-content:center;">
            ${qrSvg}
          </div>
          <div style="font-size:7px;font-weight:900;margin-top:0.3mm;">تتبع الصيانة</div>
        </div>
      </div>
      <!-- Footer -->
      <div style="border-top:1px dashed #000;padding-top:0.4mm;font-size:9px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <span style="overflow:hidden;text-overflow:ellipsis;max-width:65%;">${opts.showFaults ? `<b>العطل:</b> ${firstFault}` : ''}</span>
        ${opts.showDate ? `<span class="mono" style="font-size:8px;font-weight:800;">${dateTimeStr}</span>` : ''}
      </div>
    </div>`;
  }

  if(opts.barcodeMode === 'barcode'){
    return `
    <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:1.5mm 2mm !important;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;line-height:1.2;${borderCss}">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid #000;padding-bottom:0.4mm;flex-shrink:0;">
        ${opts.showShopName ? `<b style="font-size:10.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:58%;color:#000;">${shopName}</b>` : '<span></span>'}
        <b class="mono" style="font-size:12px;font-weight:900;direction:ltr;display:inline-block;white-space:nowrap;color:#000;">#${rNum}</b>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;font-weight:900;white-space:nowrap;overflow:hidden;flex-shrink:0;">
        ${opts.showCustomerName ? `<span>العميل: ${cName}</span>` : '<span></span>'}
        ${opts.showPhone ? `<b class="mono" style="font-size:10.5px;direction:ltr;">${cPhone}</b>` : ''}
      </div>
      ${opts.showDevice ? `
      <div style="font-size:9.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex-shrink:0;">
        الجهاز: ${dCat} ${dBrand} ${dModel}${opts.showPassword && pass ? ` | باسورد: <b class="mono">${pass}</b>` : ''}
      </div>` : ''}
      <div style="display:flex;align-items:center;justify-content:center;flex:1;max-height:8mm;overflow:hidden;margin:0.4mm 0;">
        <svg id="${svgId}" style="width:100%;max-height:8mm;display:block;margin:0 auto;"></svg>
      </div>
      <div style="border-top:1px dashed #000;padding-top:0.4mm;font-size:9px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <span style="overflow:hidden;text-overflow:ellipsis;max-width:65%;">${opts.showFaults ? `<b>العطل:</b> ${firstFault}` : ''}${(opts.showPrice && costStr) ? ` | <b>${costStr}</b>` : ''}</span>
        ${opts.showDate ? `<span class="mono" style="font-size:8px;font-weight:800;">${dateTimeStr}</span>` : ''}
      </div>
    </div>`;
  }

  // None
  return `
  <div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:2mm !important;box-sizing:border-box;font-family:Arial,Tahoma,sans-serif;font-weight:900;color:#000;background:#fff;overflow:hidden;direction:rtl;line-height:1.2;${borderCss}">
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid #000;padding-bottom:0.5mm;flex-shrink:0;">
      ${opts.showShopName ? `<b style="font-size:10px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:58%;color:#000;">${shopName}</b>` : '<span></span>'}
      <b class="mono" style="font-size:12px;font-weight:900;direction:ltr;display:inline-block;white-space:nowrap;color:#000;">#${rNum}</b>
    </div>
    <!-- Customer -->
    ${opts.showCustomerName ? `
    <div style="font-size:11px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;flex-shrink:0;">
      <span style="font-size:9.5px;font-weight:800;">العميل:</span> <b style="font-size:11px;font-weight:900;">${cName}</b>
    </div>` : ''}
    <!-- Phone -->
    ${opts.showPhone ? `
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:900;white-space:nowrap;overflow:hidden;color:#000;flex-shrink:0;">
      <span style="font-size:9.5px;font-weight:800;">الهاتف:</span>
      <b class="mono" style="font-size:11px;font-weight:900;direction:ltr;display:inline-block;letter-spacing:0.5px;">${cPhone}</b>
    </div>` : ''}
    <!-- Device & Model -->
    ${opts.showDevice ? `
    <div style="font-size:9.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;flex-shrink:0;">
      <span style="font-size:9px;font-weight:800;">الجهاز:</span> <b>${dCat} - ${dBrand} ${dModel}</b>${opts.showPassword && pass ? ` | باسورد: <b class="mono">${pass}</b>` : ''}
    </div>` : ''}
    <!-- Fault & Date -->
    <div style="border-top:1px dashed #000;padding-top:0.4mm;font-size:9px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#000;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
      <span style="overflow:hidden;text-overflow:ellipsis;max-width:65%;">${opts.showFaults ? `<b>العطل:</b> ${firstFault}` : ''}${(opts.showPrice && costStr) ? ` | <b>${costStr}</b>` : ''}</span>
      ${opts.showDate ? `<span class="mono" style="font-size:8px;font-weight:800;">${dateTimeStr}</span>` : ''}
    </div>
  </div>`;
}

function executeDirectStickerPrint(cfg, dim, copies = 1, rotation = 0, offsetX = null, offsetY = null, customOpts = null){
  if(!cfg || !cfg.data) return;
  copies = Math.max(1, parseInt(copies) || 1);
  rotation = Number(rotation) || 0;

  const savedSettings = (state.settings && state.settings.printers && state.settings.printers.barcodePrinter) || {};
  if(offsetX === null || offsetX === undefined) offsetX = Number(savedSettings.offsetX) || 0;
  if(offsetY === null || offsetY === undefined) offsetY = Number(savedSettings.offsetY) || 0;

  const isReceipt = (cfg.type === 'receipt');
  const effectiveOpts = Object.assign({
    barcodeMode: savedSettings.barcodeMode || 'qr',
    showShopName: savedSettings.showShopName !== false,
    showCustomerName: savedSettings.showCustomerName !== false,
    showPhone: savedSettings.showPhone !== false,
    showDevice: savedSettings.showDevice !== false,
    showPassword: savedSettings.showPassword !== false,
    showFaults: savedSettings.showFaults !== false,
    showPrice: savedSettings.showPrice === true,
    showDate: savedSettings.showDate !== false,
    showBorder: savedSettings.showBorder === true
  }, customOpts || {});

  const barcodeVal = !isReceipt
    ? (cfg.data.Barcode || cfg.data.SKU || cfg.data.barcode || cfg.data.sku || cfg.data.ID || '1001')
    : (cfg.data.receiptNumber || '1001');

  const needsBarcode = (!isReceipt) || (isReceipt && effectiveOpts.barcodeMode === 'barcode');

  // ── Step 1: render barcode SVGs off-screen if barcodes are needed ──
  const svgElements = {};
  if(needsBarcode){
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:60mm;visibility:hidden;';
    document.body.appendChild(tempContainer);

    for(let i = 0; i < copies; i++){
      if(!isReceipt){
        const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgEl.id = `tmpBcSvg_${i}`;
        tempContainer.appendChild(svgEl);
        renderStickerBarcodeSVG(`#tmpBcSvg_${i}`, barcodeVal, dim, savedSettings.barcodeType || 'CODE128');
        svgElements[`bcSvg_${i}`] = svgEl.outerHTML;
      } else if(Array.isArray(cfg.data.devices) && cfg.data.devices.length > 1){
        cfg.data.devices.forEach((dev, devIdx) => {
          const key = `bcSvg_${i}_${devIdx}`;
          const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svgEl.id = `tmp_${key}`;
          tempContainer.appendChild(svgEl);
          renderStickerBarcodeSVG(`#tmp_${key}`, cfg.data.receiptNumber, dim, 'CODE128');
          svgElements[key] = svgEl.outerHTML;
        });
      } else {
        const key = `bcSvg_${i}`;
        const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgEl.id = `tmp_${key}`;
        tempContainer.appendChild(svgEl);
        renderStickerBarcodeSVG(`#tmp_${key}`, cfg.data.receiptNumber, dim, 'CODE128');
        svgElements[key] = svgEl.outerHTML;
      }
    }
    tempContainer.remove();
  }

  // ── Step 2: build sticker page HTML for each copy ──
  let pagesHtml = '';
  for(let i = 0; i < copies; i++){
    if(isReceipt && cfg.data && Array.isArray(cfg.data.devices) && cfg.data.devices.length > 1){
      cfg.data.devices.forEach((dev, devIdx) => {
        const subR = {
          ...cfg.data,
          device: { category: dev.category, brand: dev.brand, brandOther: dev.brandOther, model: dev.model, accessories: dev.accessories, password: dev.password },
          faults: dev.faults,
          faultNotes: dev.faultNotes,
          password: dev.password,
          receiptNumber: `${cfg.data.receiptNumber || ''}-${devIdx + 1}/${cfg.data.devices.length}`
        };
        const sHtml = generateReceiptStickerHTML(subR, dim, `bcSvg_${i}_${devIdx}`, effectiveOpts);
        pagesHtml += `<div class="sticker-page">${sHtml}</div>`;
      });
    } else {
      const innerHtml = isReceipt
        ? generateReceiptStickerHTML(cfg.data, dim, `bcSvg_${i}`, effectiveOpts)
        : generateProductStickerHTML(cfg.data, dim, `bcSvg_${i}`);
      pagesHtml += `<div class="sticker-page">${innerHtml}</div>`;
    }
  }

  // ── Step 3: build offsetTransform (optional, for fine calibration) ──
  const transformRules = [];
  if(offsetX || offsetY){
    transformRules.push(`translate(${offsetX}mm, ${offsetY}mm)`);
  }
  if(rotation && Number(rotation) !== 0){
    transformRules.push(`rotate(${rotation}deg)`);
  }
  const offsetCss = transformRules.length ? `transform: ${transformRules.join(' ')};` : '';

  // ── Step 4: build full iframe HTML ──
  const iframeHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page {
    size: ${dim.w}mm ${dim.h}mm !important;
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
    direction: rtl !important;
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
    position: relative !important;
    direction: rtl !important;
    ${offsetCss}
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

  // ── Step 5: create hidden iframe, write HTML, inject SVGs (if needed), print ──
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;border:none;visibility:hidden;';
  document.body.appendChild(iframe);

  const iDoc = iframe.contentDocument || iframe.contentWindow.document;
  iDoc.open();
  iDoc.write(iframeHtml);
  iDoc.close();

  // Replace SVG placeholders with pre-rendered barcode SVGs
  if(needsBarcode && Object.keys(svgElements).length > 0){
    Object.keys(svgElements).forEach(key => {
      const svgPlaceholder = iDoc.getElementById(key);
      if(svgPlaceholder && svgElements[key]){
        const parser = new DOMParser();
        const parsed = parser.parseFromString(svgElements[key], 'image/svg+xml');
        const realSvg = parsed.documentElement;
        realSvg.removeAttribute('id');
        realSvg.style.cssText = 'display:block;width:100%;max-height:' + (dim.h <= 12 ? '5.2mm' : dim.h <= 22 ? '6.5mm' : '9.5mm') + ';margin:0 auto;';
        svgPlaceholder.parentNode.replaceChild(realSvg, svgPlaceholder);
      }
    });
  }

  // ── Step 6: print and cleanup ──
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch(e) {
      console.warn('iframe print failed, falling back to window.print()', e);
      window.print();
    }
    setTimeout(() => {
      if(iframe && iframe.parentNode) iframe.remove();
    }, 2000);
  }, 300);
}


function openStickerPrintModal(opts){
  if(!opts || !opts.data) return;
  const cfg = {
    type: opts.type || 'product',
    data: (opts.type === 'receipt' && typeof normalizeReceipt === 'function')
      ? (normalizeReceipt(opts.data) || opts.data)
      : opts.data
  };

  const savedSettings = (state.settings && state.settings.printers && state.settings.printers.barcodePrinter) || {};
  let currentSizeKey = savedSettings.defaultSize || '40x20';
  let customW = Number(savedSettings.customWidth) || 40;
  let customH = Number(savedSettings.customHeight) || 20;
  let currentRotation = (savedSettings.rotation !== undefined && savedSettings.rotation !== null) ? Number(savedSettings.rotation) : 0;
  let currentOffsetX = Number(savedSettings.offsetX) || 0;
  let currentOffsetY = Number(savedSettings.offsetY) || 0;
  let copies = Math.max(1, Number(opts.copies) || 1);
  let previewZoom = 1.0;

  // Customization options for receipts
  let currentBarcodeMode = savedSettings.barcodeMode || 'qr';
  let showShopName = savedSettings.showShopName !== false;
  let showCustomerName = savedSettings.showCustomerName !== false;
  let showPhone = savedSettings.showPhone !== false;
  let showDevice = savedSettings.showDevice !== false;
  let showPassword = savedSettings.showPassword !== false;
  let showFaults = savedSettings.showFaults !== false;
  let showPrice = savedSettings.showPrice === true;
  let showDate = savedSettings.showDate !== false;
  let showBorder = savedSettings.showBorder === true;

  const existing = document.getElementById('stickerPrintModalOverlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'stickerPrintModalOverlay';
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'z-index: 10050; display:flex; align-items:center; justify-content:center; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px);';

  const titleText = (cfg.type === 'receipt')
    ? `ملصق إيصال الصيانة (#${escapeHtml(cfg.data.receiptNumber)})`
    : `ملصق باركود الصنف (${escapeHtml((cfg.data.Name||cfg.data.name||'صنف').slice(0, 22))})`;

  overlay.innerHTML = `
    <div class="modal-card" style="max-width: 520px; width: 95%; background: var(--bg-card, #fff); border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; display: flex; flex-direction: column; border: 1px solid var(--border-color, #e2e8f0);">
      <!-- Header -->
      <div style="padding: 14px 18px; background: linear-gradient(135deg, #1e293b, #0f172a); color: #fff; display: flex; align-items: center; justify-content: space-between;">
        <div style="display:flex; align-items:center; gap: 10px;">
          <div style="width: 34px; height: 34px; border-radius: 8px; background: rgba(59, 130, 246, 0.2); display:flex; align-items:center; justify-content:center; border: 1px solid rgba(59, 130, 246, 0.3);">${getSvgIcon("tag", 18)}</div>
          <div>
            <h3 style="margin: 0; font-size: 14px; font-weight: 800; color: #fff;">طباعة ملصق الباركود الحراري</h3>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${titleText}</div>
          </div>
        </div>
        <button id="spmCloseBtn" style="background: rgba(255,255,255,0.1); border: none; color: #cbd5e1; width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">&times;</button>
      </div>

      <!-- Body -->
      <div style="padding: 14px 18px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; max-height: 80vh;">
        <!-- Kiosk Mode Quick Switch Banner -->
        <label style="display:flex; align-items:center; justify-content:space-between; background:#f0fdf4; border:1.5px solid #86efac; border-radius:10px; padding:8px 12px; cursor:pointer;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="color:var(--green);">${getSvgIcon("pos", 18)}</span>
            <div>
              <b style="font-size:12px; color:#166534;">وضع الكيوسك (Kiosk Mode):</b>
              <div style="font-size:10.5px; color:#15803d;">طباعة فورية بنقرة واحدة من الجدول دون إظهار نافذة المعاينة</div>
            </div>
          </div>
          <input type="checkbox" id="spmKioskModeCheck" ${savedSettings.kioskMode !== false ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;">
        </label>

        <!-- Size Selector -->
        <div>
          <label style="display:block; font-size: 11.5px; font-weight: 700; color: var(--text-muted, #64748b); margin-bottom: 6px;">
            ${getSvgIcon("tag", 14)} مقاس رول الملصقات الحراري:
          </label>
          <div id="spmSizeChips" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px;">
            <button type="button" class="spm-chip-btn" data-size="40x20" style="padding: 6px 2px; font-size: 10px; font-weight: 700; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f8fafc; cursor: pointer; text-align: center; transition: all 0.15s;">
              40×20 مم<br><span style="font-size: 8.5px; opacity: 0.8; font-weight: normal;">(4×2 سم عريض)</span>
            </button>
            <button type="button" class="spm-chip-btn" data-size="40x10" style="padding: 6px 2px; font-size: 10px; font-weight: 700; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f8fafc; cursor: pointer; text-align: center; transition: all 0.15s;">
              40×10 مم<br><span style="font-size: 8.5px; opacity: 0.8; font-weight: normal;">(4×1 سم رفيع)</span>
            </button>
            <button type="button" class="spm-chip-btn" data-size="40x25" style="padding: 6px 2px; font-size: 10px; font-weight: 700; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f8fafc; cursor: pointer; text-align: center; transition: all 0.15s;">
              40×25 مم<br><span style="font-size: 8.5px; opacity: 0.8; font-weight: normal;">(4×2.5 سم)</span>
            </button>
            <button type="button" class="spm-chip-btn" data-size="40x30" style="padding: 6px 2px; font-size: 10px; font-weight: 700; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f8fafc; cursor: pointer; text-align: center; transition: all 0.15s;">
              40×30 مم<br><span style="font-size: 8.5px; opacity: 0.8; font-weight: normal;">(4×3 سم)</span>
            </button>
            <button type="button" class="spm-chip-btn" data-size="20x40" style="padding: 6px 2px; font-size: 10px; font-weight: 700; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f8fafc; cursor: pointer; text-align: center; transition: all 0.15s;">
              20×40 مم<br><span style="font-size: 8.5px; opacity: 0.8; font-weight: normal;">(2×4 طولي)</span>
            </button>
            <button type="button" class="spm-chip-btn" data-size="50x25" style="padding: 6px 2px; font-size: 10px; font-weight: 700; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f8fafc; cursor: pointer; text-align: center; transition: all 0.15s;">
              50×25 مم<br><span style="font-size: 8.5px; opacity: 0.8; font-weight: normal;">(5×2.5 سم)</span>
            </button>
            <button type="button" class="spm-chip-btn" data-size="50x30" style="padding: 6px 2px; font-size: 10px; font-weight: 700; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f8fafc; cursor: pointer; text-align: center; transition: all 0.15s;">
              50×30 مم<br><span style="font-size: 8.5px; opacity: 0.8; font-weight: normal;">(5×3 سم)</span>
            </button>
            <button type="button" class="spm-chip-btn" data-size="custom" style="padding: 6px 2px; font-size: 10px; font-weight: 700; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f8fafc; cursor: pointer; text-align: center; transition: all 0.15s;">
              تخصيص
            </button>
          </div>
          <!-- Custom Size Inputs -->
          <div id="spmCustomBox" style="display: none; margin-top: 6px; padding: 6px 12px; background: #f1f5f9; border-radius: 8px; align-items: center; justify-content: space-between; gap: 8px;">
            <div style="display:flex; align-items:center; gap: 4px; font-size: 11px; font-weight: 700;">
              <span>العرض:</span>
              <input id="spmCustomW" type="number" min="10" max="120" value="${customW}" style="width: 55px; padding: 3px; text-align: center; border: 1px solid #cbd5e1; border-radius: 6px;" />
              <span>مم</span>
            </div>
            <div style="display:flex; align-items:center; gap: 4px; font-size: 11px; font-weight: 700;">
              <span>الارتفاع:</span>
              <input id="spmCustomH" type="number" min="10" max="120" value="${customH}" style="width: 55px; padding: 3px; text-align: center; border: 1px solid #cbd5e1; border-radius: 6px;" />
              <span>مم</span>
            </div>
          </div>
        </div>

        ${cfg.type === 'receipt' ? `
        <!-- Customization Studio Accordion for Receipt Stickers -->
        <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <div id="spmCustomSectionHeader" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#f1f5f9;cursor:pointer;user-select:none;">
            <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:800;color:#1e293b;">
              <span style="display:flex;align-items:center;gap:6px;">${getSvgIcon("settings", 14)} استوديو تخصيص وحقول استيكر الصيانة:</span>
              <span id="spmModeBadge" style="font-size:10px;background:#dbeafe;color:#1e40af;padding:2px 8px;border-radius:999px;font-weight:800;">
                ${currentBarcodeMode==='qr'?'رمز QR للتتبع':(currentBarcodeMode==='barcode'?'باركود Code128':'نصي فقط')}
              </span>
            </div>
            <span id="spmCustomToggleIcon" style="font-size:11px;color:#64748b;font-weight:bold;">▼</span>
          </div>

          <div id="spmCustomSectionBody" style="padding:12px;display:flex;flex-direction:column;gap:10px;">
            <!-- Code Mode Selector Pills -->
            <div>
              <label style="display:block;font-size:11px;font-weight:700;color:#475569;margin-bottom:5px;">
                نوع وتنسيق الكود المطبوع على الاستيكر:
              </label>
              <div id="spmModePills" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">
                <button type="button" class="spm-mode-pill" data-mode="qr" style="padding:6px 4px;font-size:10.5px;font-weight:800;border-radius:8px;border:1.5px solid ${currentBarcodeMode==='qr'?'#2563eb':'#cbd5e1'};background:${currentBarcodeMode==='qr'?'#eff6ff':'#fff'};color:${currentBarcodeMode==='qr'?'#1d4ed8':'#334155'};cursor:pointer;text-align:center;">
                  كود QR للتتبع
                </button>
                <button type="button" class="spm-mode-pill" data-mode="barcode" style="padding:6px 4px;font-size:10.5px;font-weight:800;border-radius:8px;border:1.5px solid ${currentBarcodeMode==='barcode'?'#2563eb':'#cbd5e1'};background:${currentBarcodeMode==='barcode'?'#eff6ff':'#fff'};color:${currentBarcodeMode==='barcode'?'#1d4ed8':'#334155'};cursor:pointer;text-align:center;">
                  باركود 128 ليزر
                </button>
                <button type="button" class="spm-mode-pill" data-mode="none" style="padding:6px 4px;font-size:10.5px;font-weight:800;border-radius:8px;border:1.5px solid ${currentBarcodeMode==='none'?'#2563eb':'#cbd5e1'};background:${currentBarcodeMode==='none'?'#eff6ff':'#fff'};color:${currentBarcodeMode==='none'?'#1d4ed8':'#334155'};cursor:pointer;text-align:center;">
                  نصي بولد بدون كود
                </button>
              </div>
            </div>

            <!-- Quick Presets -->
            <div>
              <label style="display:block;font-size:11px;font-weight:700;color:#475569;margin-bottom:4px;">
                نماذج واستيلات سريعة بنقرة واحدة:
              </label>
              <div style="display:flex;gap:5px;flex-wrap:wrap;">
                <button type="button" class="btn btn-ghost btn-xs spm-preset-btn" data-preset="smart_qr" style="font-size:10px;padding:3px 7px;">40×20 كود QR الذكي</button>
                <button type="button" class="btn btn-ghost btn-xs spm-preset-btn" data-preset="bold_text" style="font-size:10px;padding:3px 7px;">40×20 نصي بولد واضح</button>
                <button type="button" class="btn btn-ghost btn-xs spm-preset-btn" data-preset="barcode128" style="font-size:10px;padding:3px 7px;">40×20 باركود 128</button>
                <button type="button" class="btn btn-ghost btn-xs spm-preset-btn" data-preset="slim" style="font-size:10px;padding:3px 7px;">40×10 شريط رفيع</button>
              </div>
            </div>

            <!-- Field Checkboxes -->
            <div style="border-top:1px solid #e2e8f0;padding-top:8px;">
              <label style="display:block;font-size:11px;font-weight:800;color:#334155;margin-bottom:6px;">
                الحقول المراد إظهارها على الملصق:
              </label>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
                <label class="checkbox-row" style="font-size:11px;">
                  <input type="checkbox" id="spmCheckShopName" ${showShopName?'checked':''}>
                  <span>اسم المحل / المركز</span>
                </label>
                <label class="checkbox-row" style="font-size:11px;">
                  <input type="checkbox" id="spmCheckCustomerName" ${showCustomerName?'checked':''}>
                  <span>اسم العميل</span>
                </label>
                <label class="checkbox-row" style="font-size:11px;">
                  <input type="checkbox" id="spmCheckPhone" ${showPhone?'checked':''}>
                  <span>رقم الهاتف</span>
                </label>
                <label class="checkbox-row" style="font-size:11px;">
                  <input type="checkbox" id="spmCheckDevice" ${showDevice?'checked':''}>
                  <span>الجهاز والموديل</span>
                </label>
                <label class="checkbox-row" style="font-size:11px;">
                  <input type="checkbox" id="spmCheckPassword" ${showPassword?'checked':''}>
                  <span>كلمة السر / النمط</span>
                </label>
                <label class="checkbox-row" style="font-size:11px;">
                  <input type="checkbox" id="spmCheckFaults" ${showFaults?'checked':''}>
                  <span>شكوى وعطل الجهاز</span>
                </label>
                <label class="checkbox-row" style="font-size:11px;">
                  <input type="checkbox" id="spmCheckPrice" ${showPrice?'checked':''}>
                  <span>المتبقي / التكلفة</span>
                </label>
                <label class="checkbox-row" style="font-size:11px;">
                  <input type="checkbox" id="spmCheckDate" ${showDate?'checked':''}>
                  <span>تاريخ ووقت الاستلام</span>
                </label>
                <label class="checkbox-row" style="font-size:11px;">
                  <input type="checkbox" id="spmCheckBorder" ${showBorder?'checked':''}>
                  <span>إطار خارجي محدد</span>
                </label>
              </div>
            </div>
          </div>
        </div>` : ''}

        <!-- Rotation Selector -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding: 6px 10px; background: #f1f5f9; border-radius: 8px;">
          <div style="font-size: 11.5px; font-weight: 700; color: #334155; display:flex; align-items:center; gap: 4px;">
            <span style="display:flex;align-items:center;gap:4px;">${getSvgIcon("refresh", 13)} تدوير اتجاه الطباعة:</span>
          </div>
          <div id="spmRotBtns" style="display:flex; gap: 4px;">
            <button type="button" class="spm-rot-btn" data-rot="0" style="padding: 4px 8px; font-size: 10.5px; font-weight: 700; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">0° طبيعي</button>
            <button type="button" class="spm-rot-btn" data-rot="90" style="padding: 4px 8px; font-size: 10.5px; font-weight: 700; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">90°</button>
            <button type="button" class="spm-rot-btn" data-rot="180" style="padding: 4px 8px; font-size: 10.5px; font-weight: 700; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">180°</button>
            <button type="button" class="spm-rot-btn" data-rot="270" style="padding: 4px 8px; font-size: 10.5px; font-weight: 700; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer;">270°</button>
          </div>
        </div>

        <!-- Hardware Offset & Centering Calibration -->
        <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 8px 12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <label style="font-size: 11.5px; font-weight: 700; color: #1e293b; display:flex; align-items:center; gap:4px;">
              <span>سنترة ومعايرة مكان الطباعة (Offsets):</span>
            </label>
            <button type="button" id="spmResetOffsets" style="font-size:10px; color:#2563eb; background:none; border:none; cursor:pointer; font-weight:700;">إعادة ضبط للوسط (0,0)</button>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div style="display:flex; align-items:center; justify-content:space-between; background:#fff; padding:4px 8px; border-radius:6px; border:1px solid #cbd5e1;">
              <span style="font-size:10px; font-weight:700; color:#475569;">أفقي (X يمين/يسار):</span>
              <div style="display:flex; align-items:center; gap:3px;">
                <input id="spmOffsetX" type="number" step="0.5" min="-25" max="25" value="${currentOffsetX}" style="width:48px; text-align:center; font-weight:800; font-size:11px; border:1px solid #cbd5e1; border-radius:4px; padding:2px;" />
                <span style="font-size:9.5px;">مم</span>
              </div>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; background:#fff; padding:4px 8px; border-radius:6px; border:1px solid #cbd5e1;">
              <span style="font-size:10px; font-weight:700; color:#475569;">رأسي (Y فوق/تحت):</span>
              <div style="display:flex; align-items:center; gap:3px;">
                <input id="spmOffsetY" type="number" step="0.5" min="-25" max="25" value="${currentOffsetY}" style="width:48px; text-align:center; font-weight:800; font-size:11px; border:1px solid #cbd5e1; border-radius:4px; padding:2px;" />
                <span style="font-size:9.5px;">مم</span>
              </div>
            </div>
          </div>
          <div style="display:flex; gap:4px; margin-top:6px; justify-content:center; flex-wrap:wrap;">
            <button type="button" class="btn btn-ghost btn-xs spm-quick-off" data-ox="-2" data-oy="0" style="font-size:9.5px; padding:2px 6px;">يسار 2مم</button>
            <button type="button" class="btn btn-ghost btn-xs spm-quick-off" data-ox="2" data-oy="0" style="font-size:9.5px; padding:2px 6px;">يمين 2مم</button>
            <button type="button" class="btn btn-ghost btn-xs spm-quick-off" data-ox="4" data-oy="0" style="font-size:9.5px; padding:2px 6px;">يمين 4مم</button>
            <button type="button" class="btn btn-ghost btn-xs spm-quick-off" data-ox="0" data-oy="2" style="font-size:9.5px; padding:2px 6px;">أسفل 2مم</button>
          </div>
        </div>

        <!-- Live Preview Stage with Zoom -->
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 5px;">
            <label style="font-size: 11.5px; font-weight: 700; color: var(--text-muted, #64748b);">
              معاينة شكل الملصق وسنترته (حقيقي 100%):
            </label>
            <div style="display:flex; align-items:center; gap:6px;">
              <span id="spmDimBadge" style="font-size: 10px; font-weight: 700; color: #2563eb; background: #eff6ff; padding: 2px 8px; border-radius: 999px; border: 1px solid #bfdbfe;">40×20 مم</span>
              <div style="display:flex; border:1px solid #cbd5e1; border-radius:6px; overflow:hidden; background:#fff;">
                <button type="button" id="spmZoomIn" style="border:none; background:#f8fafc; padding:2px 7px; font-size:11px; cursor:pointer; font-weight:bold;" title="تكبير المعاينة">+</button>
                <button type="button" id="spmZoomReset" style="border:none; border-left:1px solid #cbd5e1; border-right:1px solid #cbd5e1; background:#fff; padding:2px 6px; font-size:9.5px; cursor:pointer;" title="إعادة الحجم">100%</button>
                <button type="button" id="spmZoomOut" style="border:none; background:#f8fafc; padding:2px 7px; font-size:11px; cursor:pointer; font-weight:bold;" title="تصغير المعاينة">-</button>
              </div>
            </div>
          </div>
          <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 10px; padding: 14px; display: flex; align-items: center; justify-content: center; min-height: 130px; overflow: hidden; position: relative;">
            <div id="spmScaleWrapper" style="display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
              <div id="spmPreviewBox" style="background: #fff; box-shadow: 0 4px 14px rgba(0,0,0,0.12); border: 1px solid #000; border-radius: 2px; overflow: hidden; transition: all 0.2s;">
              </div>
            </div>
          </div>
        </div>

        <!-- Copies and Info -->
        <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 2px;">
          <div style="display:flex; align-items:center; gap: 8px;">
            <label style="font-size: 11.5px; font-weight: 700; color: var(--text-muted, #64748b);">عدد النسخ:</label>
            <div style="display:flex; align-items:center; border: 1.5px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #fff;">
              <button id="spmCopyDec" type="button" style="width: 28px; height: 28px; border: none; background: #f1f5f9; cursor: pointer; font-weight: 900;">-</button>
              <input id="spmCopiesInput" type="number" min="1" max="99" value="${copies}" style="width: 38px; height: 28px; border: none; text-align: center; font-weight: 800; font-size: 13px;" />
              <button id="spmCopyInc" type="button" style="width: 28px; height: 28px; border: none; background: #f1f5f9; cursor: pointer; font-weight: 900;">+</button>
            </div>
          </div>
          <div style="font-size: 10.5px; color: #059669; font-weight: 800; display:flex; align-items:center; gap: 4px;">
            <span style="display:inline-flex;align-items:center;gap:4px;">${getSvgIcon("check", 13)} خط حراري عالي التباين وواضح</span>
          </div>
        </div>

        <!-- Hint -->
        <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 7px 10px; font-size: 10px; color: #b45309; line-height: 1.4;">
          <b>نصيحة الكيوسك:</b> تأكد في نافذة الطباعة من اختيار <b>الهوامش: بلا (None)</b>. يمكنك تعديل الإعدادات الافتراضية وحفظها لتطبيقها مباشرة في الكيوسك.
        </div>
      </div>

      <!-- Footer Buttons -->
      <div style="padding: 10px 18px; background: #f8fafc; border-top: 1px solid var(--border-color, #e2e8f0); display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
        <button id="spmCancelBtn" type="button" class="btn btn-secondary" style="padding: 7px 14px; font-size: 11.5px; font-weight: 700; border-radius: 8px;">إلغاء</button>
        <button id="spmPrintBtn" type="button" class="btn btn-primary" style="padding: 7px 20px; font-size: 11.5px; font-weight: 800; border-radius: 8px; background: linear-gradient(135deg, #2563eb, #1d4ed8); display:flex; align-items:center; gap: 6px; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);">
          <span>${getSvgIcon("printer", 14)} طباعة الملصق الآن</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const getCustomOpts = () => ({
    barcodeMode: currentBarcodeMode,
    showShopName,
    showCustomerName,
    showPhone,
    showDevice,
    showPassword,
    showFaults,
    showPrice,
    showDate,
    showBorder
  });

  const syncInputs = () => {
    const sShop = overlay.querySelector('#spmCheckShopName'); if(sShop) sShop.checked = showShopName;
    const sCust = overlay.querySelector('#spmCheckCustomerName'); if(sCust) sCust.checked = showCustomerName;
    const sPhone = overlay.querySelector('#spmCheckPhone'); if(sPhone) sPhone.checked = showPhone;
    const sDev = overlay.querySelector('#spmCheckDevice'); if(sDev) sDev.checked = showDevice;
    const sPass = overlay.querySelector('#spmCheckPassword'); if(sPass) sPass.checked = showPassword;
    const sFault = overlay.querySelector('#spmCheckFaults'); if(sFault) sFault.checked = showFaults;
    const sPrice = overlay.querySelector('#spmCheckPrice'); if(sPrice) sPrice.checked = showPrice;
    const sDate = overlay.querySelector('#spmCheckDate'); if(sDate) sDate.checked = showDate;
    const sBorder = overlay.querySelector('#spmCheckBorder'); if(sBorder) sBorder.checked = showBorder;

    overlay.querySelectorAll('.spm-mode-pill').forEach(btn => {
      const isSel = btn.dataset.mode === currentBarcodeMode;
      btn.style.borderColor = isSel ? '#2563eb' : '#cbd5e1';
      btn.style.background = isSel ? '#eff6ff' : '#fff';
      btn.style.color = isSel ? '#1d4ed8' : '#334155';
    });
  };

  const updatePreview = () => {
    const dim = getThermalStickerDimensions(currentSizeKey, customW, customH);
    const previewBox = overlay.querySelector('#spmPreviewBox');
    const dimBadge = overlay.querySelector('#spmDimBadge');
    if(dimBadge) dimBadge.textContent = `${dim.w}×${dim.h} مم (${currentRotation}°) X:${currentOffsetX} Y:${currentOffsetY}`;

    const modeBadge = overlay.querySelector('#spmModeBadge');
    if(modeBadge){
      modeBadge.textContent = currentBarcodeMode === 'qr' ? 'رمز QR للتتبع' : (currentBarcodeMode === 'barcode' ? 'باركود Code128' : 'نصي فقط');
    }

    // Screen pixel conversion: 3.78px per mm
    const baseW = dim.w * 3.78;
    const baseH = dim.h * 3.78;
    const maxBoxW = 240 * previewZoom;
    const maxBoxH = 120 * previewZoom;
    const scaleFactor = Math.min(maxBoxW / baseW, maxBoxH / baseH, 3.0);
    const boxW = Math.round(baseW * scaleFactor);
    const boxH = Math.round(baseH * scaleFactor);

    previewBox.style.width = `${boxW}px`;
    previewBox.style.height = `${boxH}px`;
    
    let prevTransform = '';
    if(currentOffsetX || currentOffsetY){
      prevTransform += `translate(${currentOffsetX * scaleFactor}px, ${currentOffsetY * scaleFactor}px) `;
    }
    if(currentRotation){
      prevTransform += `rotate(${currentRotation}deg) `;
    }
    previewBox.style.transform = prevTransform.trim() || 'none';

    const customOpts = getCustomOpts();
    const svgId = 'stickerLivePreviewSvg';
    const contentHtml = (cfg.type === 'receipt')
      ? generateReceiptStickerHTML(cfg.data, dim, svgId, customOpts)
      : generateProductStickerHTML(cfg.data, dim, svgId);

    previewBox.innerHTML = contentHtml;
    previewBox.style.fontSize = `${scaleFactor}em`;

    const barcodeVal = (cfg.type === 'receipt')
      ? cfg.data.receiptNumber
      : (cfg.data.Barcode || cfg.data.SKU || cfg.data.barcode || cfg.data.sku || cfg.data.ID || '1001');

    if(cfg.type !== 'receipt' || currentBarcodeMode === 'barcode'){
      setTimeout(() => {
        renderStickerBarcodeSVG('#' + svgId, barcodeVal, dim, savedSettings.barcodeType || 'CODE128');
      }, 15);
    }

    overlay.querySelectorAll('.spm-chip-btn').forEach(btn => {
      const isSel = btn.dataset.size === currentSizeKey;
      btn.style.borderColor = isSel ? '#2563eb' : '#cbd5e1';
      btn.style.background = isSel ? '#eff6ff' : '#f8fafc';
      btn.style.color = isSel ? '#1d4ed8' : '#334155';
    });

    overlay.querySelectorAll('.spm-rot-btn').forEach(btn => {
      const isSel = Number(btn.dataset.rot) === currentRotation;
      btn.style.borderColor = isSel ? '#2563eb' : '#cbd5e1';
      btn.style.background = isSel ? '#eff6ff' : '#ffffff';
      btn.style.color = isSel ? '#1d4ed8' : '#334155';
    });

    const customBox = overlay.querySelector('#spmCustomBox');
    if(customBox) customBox.style.display = (currentSizeKey === 'custom') ? 'flex' : 'none';
  };

  overlay.querySelector('#spmCloseBtn').onclick = () => overlay.remove();
  overlay.querySelector('#spmCancelBtn').onclick = () => overlay.remove();

  // Mode Pills
  overlay.querySelectorAll('.spm-mode-pill').forEach(btn => {
    btn.onclick = () => {
      currentBarcodeMode = btn.dataset.mode || 'qr';
      syncInputs();
      updatePreview();
    };
  });

  // Presets
  overlay.querySelectorAll('.spm-preset-btn').forEach(btn => {
    btn.onclick = () => {
      const preset = btn.dataset.preset;
      if(preset === 'smart_qr'){
        currentSizeKey = '40x20';
        currentBarcodeMode = 'qr';
        showShopName = true; showCustomerName = true; showPhone = true; showDevice = true; showPassword = true; showFaults = true; showDate = true; showBorder = false;
      } else if(preset === 'bold_text'){
        currentSizeKey = '40x20';
        currentBarcodeMode = 'none';
        showShopName = true; showCustomerName = true; showPhone = true; showDevice = true; showPassword = true; showFaults = true; showDate = true; showBorder = false;
      } else if(preset === 'barcode128'){
        currentSizeKey = '40x20';
        currentBarcodeMode = 'barcode';
        showShopName = true; showCustomerName = true; showPhone = true; showDevice = true; showFaults = true; showBorder = false;
      } else if(preset === 'slim'){
        currentSizeKey = '40x10';
        currentBarcodeMode = 'none';
      }
      syncInputs();
      updatePreview();
    };
  });

  // Checkbox Event Listeners
  const bindCheck = (id, setter) => {
    const el = overlay.querySelector(id);
    if(el) el.onchange = (e) => { setter(e.target.checked); updatePreview(); };
  };
  bindCheck('#spmCheckShopName', v => showShopName = v);
  bindCheck('#spmCheckCustomerName', v => showCustomerName = v);
  bindCheck('#spmCheckPhone', v => showPhone = v);
  bindCheck('#spmCheckDevice', v => showDevice = v);
  bindCheck('#spmCheckPassword', v => showPassword = v);
  bindCheck('#spmCheckFaults', v => showFaults = v);
  bindCheck('#spmCheckPrice', v => showPrice = v);
  bindCheck('#spmCheckDate', v => showDate = v);
  bindCheck('#spmCheckBorder', v => showBorder = v);

  // Accordion Toggle
  const customHeader = overlay.querySelector('#spmCustomSectionHeader');
  const customBody = overlay.querySelector('#spmCustomSectionBody');
  const customIcon = overlay.querySelector('#spmCustomToggleIcon');
  if(customHeader && customBody){
    customHeader.onclick = () => {
      const isHidden = customBody.style.display === 'none';
      customBody.style.display = isHidden ? 'flex' : 'none';
      if(customIcon) customIcon.textContent = isHidden ? '▼' : '◀';
    };
  }

  // Zoom Controls
  const zIn = overlay.querySelector('#spmZoomIn');
  const zOut = overlay.querySelector('#spmZoomOut');
  const zReset = overlay.querySelector('#spmZoomReset');
  if(zIn) zIn.onclick = () => { previewZoom = Math.min(2.5, previewZoom + 0.3); updatePreview(); };
  if(zOut) zOut.onclick = () => { previewZoom = Math.max(0.6, previewZoom - 0.3); updatePreview(); };
  if(zReset) zReset.onclick = () => { previewZoom = 1.0; updatePreview(); };

  overlay.querySelectorAll('.spm-chip-btn').forEach(btn => {
    btn.onclick = () => {
      currentSizeKey = btn.dataset.size;
      updatePreview();
    };
  });

  overlay.querySelectorAll('.spm-rot-btn').forEach(btn => {
    btn.onclick = () => {
      currentRotation = Number(btn.dataset.rot) || 0;
      updatePreview();
    };
  });

  const customWInput = overlay.querySelector('#spmCustomW');
  const customHInput = overlay.querySelector('#spmCustomH');
  if(customWInput) customWInput.oninput = (e) => { customW = Number(e.target.value) || 40; updatePreview(); };
  if(customHInput) customHInput.oninput = (e) => { customH = Number(e.target.value) || 20; updatePreview(); };

  const offXInput = overlay.querySelector('#spmOffsetX');
  const offYInput = overlay.querySelector('#spmOffsetY');
  if(offXInput) offXInput.oninput = (e) => { currentOffsetX = Number(e.target.value) || 0; updatePreview(); };
  if(offYInput) offYInput.oninput = (e) => { currentOffsetY = Number(e.target.value) || 0; updatePreview(); };

  overlay.querySelectorAll('.spm-quick-off').forEach(btn => {
    btn.onclick = () => {
      currentOffsetX = Number(btn.dataset.ox) || 0;
      currentOffsetY = Number(btn.dataset.oy) || 0;
      if(offXInput) offXInput.value = currentOffsetX;
      if(offYInput) offYInput.value = currentOffsetY;
      updatePreview();
    };
  });

  const resetOffBtn = overlay.querySelector('#spmResetOffsets');
  if(resetOffBtn) resetOffBtn.onclick = () => {
    currentOffsetX = 0;
    currentOffsetY = 0;
    if(offXInput) offXInput.value = 0;
    if(offYInput) offYInput.value = 0;
    updatePreview();
  };

  const copiesInput = overlay.querySelector('#spmCopiesInput');
  overlay.querySelector('#spmCopyDec').onclick = () => {
    copies = Math.max(1, copies - 1);
    copiesInput.value = copies;
  };
  overlay.querySelector('#spmCopyInc').onclick = () => {
    copies = Math.min(99, copies + 1);
    copiesInput.value = copies;
  };
  copiesInput.onchange = (e) => {
    copies = Math.max(1, Math.min(99, Number(e.target.value) || 1));
    copiesInput.value = copies;
  };

  overlay.querySelector('#spmPrintBtn').onclick = () => {
    const dim = getThermalStickerDimensions(currentSizeKey, customW, customH);
    const isKioskChecked = overlay.querySelector('#spmKioskModeCheck') ? overlay.querySelector('#spmKioskModeCheck').checked : true;
    const customOpts = getCustomOpts();

    if(!state.settings.printers) state.settings.printers = {};
    if(!state.settings.printers.barcodePrinter) state.settings.printers.barcodePrinter = {};
    state.settings.printers.barcodePrinter.defaultSize = currentSizeKey;
    state.settings.printers.barcodePrinter.rotation = currentRotation;
    state.settings.printers.barcodePrinter.offsetX = currentOffsetX;
    state.settings.printers.barcodePrinter.offsetY = currentOffsetY;
    state.settings.printers.barcodePrinter.kioskMode = isKioskChecked;
    state.settings.printers.barcodePrinter.barcodeMode = currentBarcodeMode;
    state.settings.printers.barcodePrinter.showShopName = showShopName;
    state.settings.printers.barcodePrinter.showCustomerName = showCustomerName;
    state.settings.printers.barcodePrinter.showPhone = showPhone;
    state.settings.printers.barcodePrinter.showDevice = showDevice;
    state.settings.printers.barcodePrinter.showPassword = showPassword;
    state.settings.printers.barcodePrinter.showFaults = showFaults;
    state.settings.printers.barcodePrinter.showPrice = showPrice;
    state.settings.printers.barcodePrinter.showDate = showDate;
    state.settings.printers.barcodePrinter.showBorder = showBorder;

    if(currentSizeKey === 'custom'){
      state.settings.printers.barcodePrinter.customWidth = customW;
      state.settings.printers.barcodePrinter.customHeight = customH;
    }
    try {
      localStorage.setItem('microerp_printers_settings', JSON.stringify(state.settings.printers));
      setCache('settings', state.settings);
      if(typeof saveSettingRemote === 'function'){
        saveSettingRemote('printers', JSON.stringify(state.settings.printers)).catch(()=>{});
      }
    } catch(e){}

    overlay.remove();
    executeDirectStickerPrint(cfg, dim, copies, currentRotation, currentOffsetX, currentOffsetY, customOpts);
  };

  updatePreview();
}

function openStickerPrint(rawR, forceModal = false){
  if(!rawR) return;
  const prnSettings = (state.settings && state.settings.printers && state.settings.printers.barcodePrinter) || {};
  const isKiosk = !forceModal && (prnSettings.kioskMode !== false);
  if(isKiosk){
    const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
    const dim = getThermalStickerDimensions(prnSettings.defaultSize || '40x20', prnSettings.customWidth, prnSettings.customHeight);
    const rot = (prnSettings.rotation !== undefined && prnSettings.rotation !== null) ? Number(prnSettings.rotation) : 0;
    const offX = Number(prnSettings.offsetX) || 0;
    const offY = Number(prnSettings.offsetY) || 0;
    const customOpts = {
      barcodeMode: prnSettings.barcodeMode || 'qr',
      showShopName: prnSettings.showShopName !== false,
      showCustomerName: prnSettings.showCustomerName !== false,
      showPhone: prnSettings.showPhone !== false,
      showDevice: prnSettings.showDevice !== false,
      showPassword: prnSettings.showPassword !== false,
      showFaults: prnSettings.showFaults !== false,
      showPrice: prnSettings.showPrice === true,
      showDate: prnSettings.showDate !== false,
      showBorder: prnSettings.showBorder === true
    };
    showToast('جاري طباعة ملصق الصيانة فوراً (وضع الطباعة السريعة)', 'info');
    executeDirectStickerPrint({ type: 'receipt', data: r }, dim, 1, rot, offX, offY, customOpts);
    return;
  }
  openStickerPrintModal({ type: 'receipt', data: rawR });
}

/* ---------------- Excel Export Utility ---------------- */
function exportReceiptsToExcel(receipts){
  if(!receipts || !receipts.length){ showToast('لا توجد بيانات للتصدير', 'error'); return; }
  const headers = ['رقم الإيصال','التاريخ','وقت الاستلام','اللقب','الاسم','الهاتف','فئة الجهاز','الماركة','الموديل','كلمة السر','الأعطال','الفني','تكلفة الصيانة','حساب إضافي','المدفوع','قطع الغيار','المتبقي','الحالة','موعد التسليم'];
  const rows = receipts.map(rawR=>{
    const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
    const otherAmt = Number(r.otherAccountAmount||0);
    const rem = Number(r.cost||0)+Number(r.partsCost||0)+otherAmt-Number(r.deposit||0)+Number(r.refunded||0);
    const faultsStr = (Array.isArray(r.faults) ? r.faults.join(' - ') : String(r.faults || '')) || '-';
    const cTitle = extractCustomerTitle(r);
    const cName = (r.customer && r.customer.name) || extractCustomerName(r) || 'عميل';
    const cPhone = (r.customer && r.customer.phone) || extractCustomerPhone(r) || '';
    const dCat = (r.device && r.device.category) || 'جهاز';
    const dBrand = r.device ? (r.device.brand==='أخرى'?r.device.brandOther:r.device.brand) : '';
    const dModel = (r.device && r.device.model) || '';
    const pass = (r.device && r.device.password) || r.password || '';
    const rTime = (typeof formatReceiptTime === 'function' ? formatReceiptTime(r) : (r.time || ''));
    return [
      r.receiptNumber, cleanDate(r.date), `"${rTime}"`, `"${cTitle}"`, `"${cName}"`, `"${cPhone}"`,
      dCat, dBrand, `"${dModel}"`, `"${pass}"`, `"${faultsStr}"`,
      `"${r.technician||''}"`, r.cost||0, otherAmt, r.deposit||0, r.partsCost||0, rem, `"${r.status}"`, r.deliveryDate||''
    ];
  });
  downloadCSV(`Receipts_Export_${new Date().toISOString().slice(0,10)}.csv`, headers, rows);
}

function exportInventoryToExcel(items){
  if(!items || !items.length){ showToast('المخزن فارغ', 'error'); return; }
  const headers = ['اسم الصنف','القسم','التصنيف الفرعي','كود القطعة SKU','الباركود','مكان الرف','الكمية المتاحة','الوحدة','حد الأمان','سعر الشراء','سعر البيع قطاعي','سعر الجملة','صافي الربح','نسبة الهامش %','شهور الضمان','الموديلات المتوافقة'];
  const rows = items.map(it=>{
    const buy = Number(it.PurchasePrice||0);
    const sell = Number(it.SellPrice||0);
    const profit = sell - buy;
    const margin = sell > 0 ? Math.round((profit/sell)*100)+'%' : '0%';
    return [
      `"${it.Name}"`, it.Category||'صيانة', `"${it.SubCategory||''}"`, `"${it.SKU||''}"`, `"${it.Barcode||''}"`,
      `"${it.ShelfLocation||''}"`, it.Quantity||0, it.Unit||'قطعة', it.MinStock||2,
      buy, sell, it.WholesalePrice||0, profit, `"${margin}"`, it.WarrantyMonths||0, `"${it.CompatibleModels||''}"`
    ];
  });
  downloadCSV(`Inventory_Export_${new Date().toISOString().slice(0,10)}.csv`, headers, rows);
}

function downloadCSV(filename, headers, rows){
  let csvContent = '\uFEFF' + headers.join(',') + '\n';
  rows.forEach(r => { csvContent += r.join(',') + '\n'; });
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('تم تصدير ملف Excel بنجاح', 'success');
}

function exportInvoicesToExcel(invoices){
  if(!invoices || !invoices.length){ showToast('لا توجد فواتير للتصدير', 'error'); return; }
  const headers = ['رقم الفاتورة','التاريخ','تاريخ الاستحقاق','اسم العميل','الهاتف','الرقم الضريبي','المرجع','الإجمالي قبل الضريبة','الضريبة','الخصم','الإجمالي النهائي','المدفوع','المتبقي','الحالة','طريقة الدفع','محرر الفاتورة'];
  const rows = invoices.map(inv=>[
    inv.InvoiceNumber||inv.ID, cleanDate(inv.Date), cleanDate(inv.DueDate),
    `"${inv.CustomerName||''}"`, `"${inv.CustomerPhone||''}"`, `"${inv.CustomerTaxNumber||''}"`,
    `"${inv.ReferenceType ? (inv.ReferenceType + ': ' + inv.ReferenceID) : 'حر'}"`,
    inv.Subtotal||0, inv.TaxAmount||0, inv.Discount||0, inv.Total||0,
    inv.AmountPaid||0, inv.Remaining||0, `"${inv.Status||''}"`, `"${inv.PaymentMethod||''}"`, `"${inv.By||''}"`
  ]);
  downloadCSV(`Invoices_Export_${new Date().toISOString().slice(0,10)}.csv`, headers, rows);
}

/* ============================================================
   Invoicing System & Receipt-To-Invoice Conversion (منظومة الفواتير)
   ============================================================ */

function convertReceiptToInvoice(receiptId){
  const r = findReceiptByIdOrNum(receiptId);
  if(!r){ showToast('تعذر العثور على الإيصال المطلوب', 'error'); return; }

  // Check if this receipt already has an invoice issued
  const existing = state.invoices.find(inv => inv.ReferenceType==='Receipt' && (String(inv.ReferenceID)===String(r.receiptNumber) || String(inv.ReferenceID)===String(r.id)));
  if(existing){
    if(confirm(`تم إصدار فاتورة سابقة لهذا الإيصال برقم (${existing.InvoiceNumber}). هل ترغب في فتح الفاتورة المسجلة؟`)){
      openInvoiceModal(existing);
      return;
    }
  }

  // Calculate items and finances from receipt
  const totalCost = Number(r.cost||0);
  const partsCost = Number(r.partsCost||0);
  const laborCost = Math.max(0, totalCost - partsCost);

  const payments = getReceiptPayments(r);
  const totalPayments = payments.reduce((s,p)=>s+Number(p.Amount||0),0);
  const totalDeposit = Number(r.deposit||0);
  const totalPaid = totalPayments > 0 ? totalPayments : totalDeposit;

  const brandName = (r.device && r.device.brand==='أخرى') ? r.device.brandOther : ((r.device && r.device.brand) || '');
  const devCat = (r.device && r.device.category) || 'جهاز';
  const devModel = (r.device && r.device.model) || '';
  const faultsDesc = (Array.isArray(r.faults) && r.faults.length) ? r.faults.join('، ') : (r.faultNotes || 'صيانة عامة');

  const items = [];
  const svcItems = Array.isArray(r.serviceItems) ? r.serviceItems.filter(it => (it.desc && it.desc.trim()) || Number(it.price) > 0) : [];
  if(svcItems.length > 0){
    svcItems.forEach(it => {
      items.push({
        Name: `خدمة صيانة: ${it.desc || 'بند صيانة'} (${devCat} ${brandName})`.trim(),
        Qty: 1,
        Price: Number(it.price || 0),
        Total: Number(it.price || 0)
      });
    });
  } else {
    // Item 1: Service Labor
    items.push({
      Name: `أجور وخدمات صيانة ${devCat} ${brandName} ${devModel} (عطل: ${faultsDesc})`.trim(),
      Qty: 1,
      Price: laborCost > 0 ? laborCost : totalCost,
      Total: laborCost > 0 ? laborCost : totalCost
    });
  }

  // Item 2: Parts (if any)
  if(partsCost > 0){
    items.push({
      Name: `قطع غيار مستخدمة: ${r.partsUsed || 'مستلزمات صيانة وقطع مستبدلة'}`,
      Qty: 1,
      Price: partsCost,
      Total: partsCost
    });
  }

  // Item 3: Other Customer Account (if any)
  const otherAmt = Number(r.otherAccountAmount || 0);
  if(otherAmt > 0){
    items.push({
      Name: `حساب إضافي على العميل: ${r.otherAccountDesc || 'رصيد سابق / حساب آخر'}`,
      Qty: 1,
      Price: otherAmt,
      Total: otherAmt
    });
  }

  const subtotal = items.reduce((s,it)=>s+Number(it.Total||0),0);
  const remaining = Math.max(0, subtotal - totalPaid);

  const prefilledInvoice = {
    ID: 'inv_' + Date.now(),
    InvoiceNumber: (typeof nextInvoiceNumber === 'function') ? nextInvoiceNumber() : ('INV-' + new Date().getFullYear() + '-0001'),
    Date: cleanDate(r.date) || new Date().toISOString().slice(0,10),
    DueDate: cleanDate(r.deliveryDate) || new Date().toISOString().slice(0,10),
    CustomerTitle: r.customer.title || '',
    CustomerName: r.customer.name || '',
    CustomerPhone: r.customer.phone || '',
    CustomerTaxNumber: '',
    CustomerAddress: '',
    Items: items,
    ItemsSummary: items.map(i=>i.Name).join(' + '),
    Subtotal: subtotal,
    TaxPercent: 0,
    TaxAmount: 0,
    Discount: 0,
    Total: subtotal,
    AmountPaid: totalPaid,
    Remaining: remaining,
    Status: remaining <= 0 ? 'مدفوعة بالكامل' : (totalPaid > 0 ? 'مدفوعة جزئياً' : 'غير مدفوعة (آجلة)'),
    PaymentMethod: 'نقدي',
    ReferenceType: 'Receipt',
    ReferenceID: r.receiptNumber || r.id,
    Notes: `فاتورة صادرة عن إيصال صيانة رقم #${r.receiptNumber} (${r.device.category} ${brandName} ${r.device.model||''})`
  };

  openInvoiceModal(prefilledInvoice, true);
}

window.convertMultipleReceiptsToInvoice = function(receiptIds){
  if(!Array.isArray(receiptIds) || receiptIds.length === 0){
    showToast('يرجى تحديد إيصالات لإصدار الفاتورة المجمعة', 'error');
    return;
  }

  const receipts = receiptIds.map(id => findReceiptByIdOrNum(id)).filter(Boolean);
  if(receipts.length === 0){
    showToast('تعذر العثور على الإيصالات المحددة', 'error');
    return;
  }

  if(receipts.length === 1){
    return convertReceiptToInvoice(receipts[0].id || receipts[0].receiptNumber);
  }

  const firstCustName = extractCustomerName(receipts[0]) || 'عميل';
  const firstCustTitle = extractCustomerTitle(receipts[0]) || '';
  const firstCustPhone = extractCustomerPhone(receipts[0]) || '';
  const firstCustEmail = extractCustomerEmail(receipts[0]) || '';

  const differentCusts = receipts.filter(r => (extractCustomerName(r) || '').trim().toLowerCase() !== firstCustName.trim().toLowerCase());
  if(differentCusts.length > 0){
    if(!confirm(`تنبيه: الإيصالات المحددة تخص أكثر من عميل.\nهل ترغب في إصدار الفاتورة المجمعة باسم العميل (${firstCustName})؟`)){
      return;
    }
  }

  const items = [];
  let totalPaymentsAll = 0;
  const receiptNumbers = [];

  receipts.forEach(r => {
    const rNum = r.receiptNumber || r.id;
    receiptNumbers.push(rNum);

    const totalCost = Number(r.cost || 0);
    const partsCost = Number(r.partsCost || 0);
    const laborCost = Math.max(0, totalCost - partsCost);

    const payments = (typeof getReceiptPayments === 'function') ? getReceiptPayments(r) : [];
    const pAmt = payments.reduce((s, p) => s + Number(p.Amount || 0), 0);
    const depositAmt = Number(r.deposit || 0);
    const paidForThis = pAmt > 0 ? pAmt : depositAmt;
    totalPaymentsAll += paidForThis;

    const devs = (Array.isArray(r.devices) && r.devices.length) ? r.devices : [ r.device ];
    const devDescs = devs.map(d => {
      const cat = d.category || 'جهاز';
      const b = d.brand === 'أخرى' ? d.brandOther : d.brand;
      return `${cat} ${b||''} ${d.model||''}`.trim();
    }).join(' + ');

    const faultsDesc = (Array.isArray(r.faults) && r.faults.length) ? r.faults.join('، ') : (r.faultNotes || 'صيانة عامة');

    const svcItems = Array.isArray(r.serviceItems) ? r.serviceItems.filter(it => (it.desc && it.desc.trim()) || Number(it.price) > 0) : [];
    if(svcItems.length > 0){
      svcItems.forEach(it => {
        items.push({
          Name: `خدمة صيانة: ${it.desc} (${devDescs} - إيصال #${rNum})`,
          Qty: 1,
          Price: Number(it.price || 0),
          Total: Number(it.price || 0)
        });
      });
    } else {
      items.push({
        Name: `أجور وخدمات صيانة: ${devDescs} (إيصال #${rNum} - عطل: ${faultsDesc})`,
        Qty: 1,
        Price: laborCost > 0 ? laborCost : totalCost,
        Total: laborCost > 0 ? laborCost : totalCost
      });
    }

    if(partsCost > 0){
      items.push({
        Name: `قطع غيار مستخدمة (${devDescs} - إيصال #${rNum}): ${r.partsUsed || 'مستلزمات صيانة'}`,
        Qty: 1,
        Price: partsCost,
        Total: partsCost
      });
    }

    const otherAmt = Number(r.otherAccountAmount || 0);
    if(otherAmt > 0){
      items.push({
        Name: `حساب إضافي (إيصال #${rNum}): ${r.otherAccountDesc || 'رصيد سابق'}`,
        Qty: 1,
        Price: otherAmt,
        Total: otherAmt
      });
    }
  });

  const subtotal = items.reduce((s, it) => s + Number(it.Total || 0), 0);
  const remaining = Math.max(0, subtotal - totalPaymentsAll);

  const prefilledInvoice = {
    ID: 'inv_' + Date.now(),
    InvoiceNumber: (typeof nextInvoiceNumber === 'function') ? nextInvoiceNumber() : ('INV-' + new Date().getFullYear() + '-0001'),
    Date: new Date().toISOString().slice(0, 10),
    DueDate: new Date().toISOString().slice(0, 10),
    CustomerTitle: firstCustTitle,
    CustomerName: firstCustName,
    CustomerPhone: firstCustPhone,
    CustomerTaxNumber: '',
    CustomerAddress: '',
    Items: items,
    ItemsSummary: items.map(i => i.Name).join(' + '),
    Subtotal: subtotal,
    TaxPercent: 0,
    TaxAmount: 0,
    Discount: 0,
    Total: subtotal,
    AmountPaid: totalPaymentsAll,
    Remaining: remaining,
    Status: remaining <= 0 ? 'مدفوعة بالكامل' : (totalPaymentsAll > 0 ? 'مدفوعة جزئياً' : 'غير مدفوعة (آجلة)'),
    PaymentMethod: 'نقدي',
    ReferenceType: 'MultipleReceipts',
    ReferenceID: receiptNumbers.join(', '),
    Notes: `فاتورة مجمعة صادرة عن (${receipts.length}) إيصالات صيانة: #${receiptNumbers.join('، #')}`
  };

  openInvoiceModal(prefilledInvoice, true);
};

window.openCustomerConsolidatedInvoiceModal = function(custName){
  const cleanName = (custName || '').trim().toLowerCase();
  const clientReceipts = (state.receipts || []).filter(r => {
    const rName = extractCustomerName(r);
    return rName && rName.trim().toLowerCase() === cleanName;
  });

  if(clientReceipts.length === 0){
    showToast('لا توجد أي إيصالات مسجلة لهذا العميل', 'warning');
    return;
  }
  if(clientReceipts.length === 1){
    return convertReceiptToInvoice(clientReceipts[0].id || clientReceipts[0].receiptNumber);
  }

  const prevModal = document.getElementById('custConsolidatedInvoicePickerModal');
  if(prevModal) prevModal.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'custConsolidatedInvoicePickerModal';
  overlay.style.zIndex = '11200';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:560px;padding:22px;border-radius:18px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:14px;">
        <div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="display:inline-flex;align-items:center;color:var(--primary);">${getSvgIcon("invoices", 20)}</span>
            <h3 style="margin:0;font-size:16.5px;color:var(--ink);">فاتورة مجمعة للعميل: <b>${escapeHtml(custName)}</b></h3>
          </div>
          <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">حدد إيصالات الصيانة المطلوب تضمينها في الفاتورة المجمعة (${clientReceipts.length} إيصالات متوفرة):</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('custConsolidatedInvoicePickerModal').remove()">&times;</button>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:12px;">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-weight:700;">
          <input type="checkbox" id="pickAllCustRecsChk" checked>
          <span>تحديد الكل</span>
        </label>
        <div id="custConsolidatedSummary" style="font-weight:800;color:var(--primary);"></div>
      </div>

      <div style="max-height:280px;overflow-y:auto;border:1px solid var(--line);border-radius:var(--radius-sm);padding:8px;display:flex;flex-direction:column;gap:6px;margin-bottom:14px;background:var(--paper2);">
        ${clientReceipts.map(r => {
          const rNum = r.receiptNumber || r.id;
          const otherAmt = Number(r.otherAccountAmount || 0);
          const totalCost = Number(r.cost || 0) + Number(r.partsCost || 0) + otherAmt;
          const deposit = Number(r.deposit || 0);
          const remaining = Math.max(0, totalCost - deposit + Number(r.refunded || 0));
          const devCat = (r.device && r.device.category) || 'جهاز';
          const brand = (r.device ? (r.device.brand==='أخرى'?r.device.brandOther:r.device.brand) : '') || '';
          const model = (r.device && r.device.model) || '';

          return `
            <label style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;background:var(--paper);border:1px solid var(--line);border-radius:6px;cursor:pointer;">
              <div style="display:flex;align-items:center;gap:8px;">
                <input type="checkbox" class="cust-inv-rec-chk" value="${r.id || rNum}" checked>
                <div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <b class="mono" style="color:var(--primary);font-size:12.5px;">#${escapeHtml(rNum)}</b>
                    <span style="font-size:12px;font-weight:700;color:var(--ink);">${escapeHtml(devCat)} ${escapeHtml(brand)} ${escapeHtml(model)}</span>
                  </div>
                  <div style="font-size:11px;color:var(--ink-secondary);">الحالة: <b>${escapeHtml(r.status)}</b> • التاريخ: ${cleanDate(r.date)}</div>
                </div>
              </div>
              <div style="text-align:left;" class="mono">
                <div style="font-weight:800;font-size:12px;color:var(--ink);">${totalCost.toLocaleString()} ج.م</div>
                <div style="font-size:10.5px;${remaining > 0 ? 'color:var(--red);' : 'color:var(--green);'}">متبقي: ${remaining.toLocaleString()} ج.م</div>
              </div>
            </label>
          `;
        }).join('')}
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;">
        <button class="btn btn-ghost" onclick="document.getElementById('custConsolidatedInvoicePickerModal').remove()">إلغاء</button>
        <button class="btn btn-primary" id="confirmCustConsolidatedInvoiceBtn" style="font-weight:800;">
          ${getSvgIcon("invoices", 14)} إصدار الفاتورة المجمعة
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const checkboxes = overlay.querySelectorAll('.cust-inv-rec-chk');
  const allChk = overlay.querySelector('#pickAllCustRecsChk');
  const summaryEl = overlay.querySelector('#custConsolidatedSummary');

  function updateSummary(){
    const selected = Array.from(checkboxes).filter(c => c.checked).map(c => c.value);
    summaryEl.textContent = `تم تحديد (${selected.length} من ${clientReceipts.length})`;
    allChk.checked = selected.length === clientReceipts.length;
  }
  updateSummary();

  allChk.onchange = ()=>{
    checkboxes.forEach(c => c.checked = allChk.checked);
    updateSummary();
  };
  checkboxes.forEach(c => c.onchange = updateSummary);

  overlay.querySelector('#confirmCustConsolidatedInvoiceBtn').onclick = ()=>{
    const selectedIds = Array.from(checkboxes).filter(c => c.checked).map(c => c.value);
    if(selectedIds.length === 0){
      showToast('يرجى تحديد إيصال واحد على الأقل', 'error');
      return;
    }
    overlay.remove();
    convertMultipleReceiptsToInvoice(selectedIds);
  };
};

function openInvoiceModal(existingInv, isFromReceipt=false){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const isEdit = !!existingInv && !isFromReceipt;

  const inv = existingInv ? {
    ...existingInv,
    Items: Array.isArray(existingInv.Items) ? [...existingInv.Items] : (JSON.parse(existingInv.ItemsJSON||'[]'))
  } : {
    ID: 'inv_' + Date.now(),
    InvoiceNumber: (typeof nextInvoiceNumber === 'function') ? nextInvoiceNumber() : ('INV-' + new Date().getFullYear() + '-0001'),
    Date: new Date().toISOString().slice(0,10),
    DueDate: new Date().toISOString().slice(0,10),
    CustomerTitle: '',
    CustomerName: '',
    CustomerPhone: '',
    CustomerTaxNumber: '',
    CustomerAddress: '',
    Items: [{ Name: '', Qty: 1, Price: 0, Total: 0 }],
    Subtotal: 0,
    TaxPercent: 0,
    TaxAmount: 0,
    Discount: 0,
    Total: 0,
    AmountPaid: 0,
    Remaining: 0,
    Status: 'مدفوعة بالكامل',
    PaymentMethod: 'نقدي',
    ReferenceType: '',
    ReferenceID: '',
    Notes: ''
  };

  if(!inv.Items.length) inv.Items = [{ Name: '', Qty: 1, Price: 0, Total: 0 }];

  function renderModal(){
    // Calculate sums
    let sub = 0;
    inv.Items.forEach(it => {
      it.Total = Number(it.Qty||1) * Number(it.Price||0);
      sub += it.Total;
    });
    inv.Subtotal = sub;
    inv.TaxAmount = Math.round((inv.Subtotal * (Number(inv.TaxPercent||0) / 100)) * 100) / 100;
    inv.Total = Math.round((inv.Subtotal + inv.TaxAmount - Number(inv.Discount||0)) * 100) / 100;
    inv.Remaining = Math.round(Math.max(0, inv.Total - Number(inv.AmountPaid||0)) * 100) / 100;
    if(inv.Total > 0 && inv.Remaining <= 0){ inv.Status = 'مدفوعة بالكامل'; }
    else if(inv.AmountPaid > 0 && inv.Remaining > 0){ inv.Status = 'مدفوعة جزئياً'; }
    else { inv.Status = 'غير مدفوعة (آجلة)'; }

    const curTitle = inv.CustomerTitle || '';
    const titleOptions = [''].concat(typeof CUSTOMER_TITLES !== 'undefined' ? CUSTOMER_TITLES : []).map(t=>`<option value="${escapeHtml(t)}" ${curTitle===t?'selected':''}>${t ? escapeHtml(t) : '-- بدون لقب --'}</option>`).join('');

    overlay.innerHTML = `
      <div class="modal-content" style="max-width:840px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:16px;">
          <div>
            <h3 style="margin:0;font-size:18px;font-weight:900;color:var(--primary);">
              ${isFromReceipt ? `إصدار فاتورة رسمية من إيصال صيانة (#${inv.ReferenceID})` : (isEdit ? `تعديل فاتورة: ${inv.InvoiceNumber}` : `إصدار فاتورة ضريبية / رسمية جديدة`)}
            </h3>
            <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">
              رقم المستند: <span class="mono font-bold">${inv.InvoiceNumber}</span>
              ${inv.ReferenceType ? ` | مرجع: <span class="status-badge st-check" style="font-size:10px;">${inv.ReferenceType==='Receipt'?'إيصال صيانة':inv.ReferenceType} #${inv.ReferenceID}</span>` : ''}
            </div>
          </div>
          <button class="btn btn-ghost btn-xs" id="closeInvModal">إغلاق</button>
        </div>

        <div class="card" style="padding:14px 16px;background:var(--paper3);margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
            <h3 style="font-size:13.5px;margin:0;display:flex;align-items:center;gap:6px;"><span style="display:flex;align-items:center;gap:6px;">${getSvgIcon("user", 15)} بيانات العميل</span></h3>
            <div style="display:flex;gap:6px;align-items:center;">
              <button class="btn btn-xs btn-ghost" id="quickWalkInCustBtn" type="button">عميل زائر</button>
              <button class="btn btn-xs btn-blue" id="quickNewCustBtn" type="button">${getSvgIcon("plus", 12)} عميل جديد</button>
            </div>
          </div>
          <div class="field" style="margin-bottom:12px;">
            <select id="invCustomerSelect" style="width:100%;font-weight:600;">
              <option value="">-- اضغط لاختيار عميل مسجل (${state.customers.length} عميل) --</option>
              <option value="__WALKIN__" ${inv.CustomerName==='عميل زائر'?'selected':''}>عميل زائر (نقدي / Walk-in)</option>
              <option value="__NEW__">${getSvgIcon("plus", 12)} عميل جديد</option>
              ${state.customers.length ? `
                <optgroup label="قائمة العملاء">
                  ${state.customers.map(c=>`<option value="${c.name}" ${inv.CustomerName===c.name?'selected':''}>${c.title ? c.title+' / ' : ''}${c.name} - ${c.phone||'بدون هاتف'}</option>`).join('')}
                </optgroup>
              ` : ''}
            </select>
          </div>
          <div style="display:grid;grid-template-columns:140px 1.5fr 1fr 1fr;gap:10px;">
            <div class="field">
              <label>اللقب (اختياري)</label>
              <select id="invCustTitle">
                ${titleOptions}
              </select>
            </div>
            <div class="field"><label>اسم العميل / الشركة *</label><input id="invCustName" value="${inv.CustomerName||''}"></div>
            <div class="field"><label>رقم هاتف العميل</label><input id="invCustPhone" class="mono" value="${inv.CustomerPhone||''}"></div>
            <div class="field"><label>الرقم الضريبي</label><input id="invCustTax" class="mono" value="${inv.CustomerTaxNumber||''}"></div>
          </div>
          <div class="grid3">
            <div class="field"><label>تاريخ المستند *</label><input id="invDate" type="date" value="${cleanDate(inv.Date)}"></div>
            <div class="field"><label>تاريخ الاستحقاق</label><input id="invDueDate" type="date" value="${cleanDate(inv.DueDate)}"></div>
            <div class="field"><label>العنوان</label><input id="invCustAddr" value="${inv.CustomerAddress||''}"></div>
          </div>
        </div>

        <div class="card" style="padding:14px 16px;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <h3 style="font-size:13.5px;margin:0;display:flex;align-items:center;gap:6px;">${getSvgIcon("package", 15)} بنود الفاتورة / بيان السعر</h3>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-ghost btn-xs" id="addFromInventoryBtn" type="button">${getSvgIcon("inventory", 12)} من المخزن</button>
              <button class="btn btn-primary btn-xs" id="addInvLineBtn" type="button">${getSvgIcon("plus", 12)} سطر جديد</button>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>بيان الصنف أو الخدمة</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th><th></th></tr></thead>
              <tbody id="invoiceLinesTableBody">
                ${inv.Items.map((it, idx)=>`
                  <tr>
                    <td><input value="${it.Name||''}" data-linefield="Name" data-idx="${idx}" style="width:100%;"></td>
                    <td><input type="number" class="mono" min="1" value="${it.Qty||1}" data-linefield="Qty" data-idx="${idx}" style="width:100%;text-align:center;"></td>
                    <td><input type="number" class="mono" step="any" value="${it.Price||0}" data-linefield="Price" data-idx="${idx}" style="width:100%;text-align:center;"></td>
                    <td class="mono font-bold" style="color:var(--primary);">${(Number(it.Qty||1) * Number(it.Price||0)).toLocaleString()} ج.م</td>
                    <td style="text-align:center;"><button class="btn btn-xs btn-red" data-delline="${idx}">&times;</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="grid2">
          <div class="card" style="padding:14px 16px;background:var(--paper3);">
            <h3 style="font-size:13.5px;margin-bottom:10px;display:flex;align-items:center;gap:6px;">${getSvgIcon("creditCard", 15)} السداد والحالة</h3>
            <div class="grid2">
              <div class="field"><label>طريقة السداد</label><select id="invPaymentMethod">${['نقدي','فيزا / كارت','تحويل بنكي','فودافون كاش','آجل'].map(m=>`<option ${m===inv.PaymentMethod?'selected':''}>${m}</option>`).join('')}</select></div>
              <div class="field"><label>المبلغ المدفوع (ج.م)</label><input id="invPaidInput" type="number" class="mono" value="${inv.AmountPaid||0}"></div>
            </div>
            <div class="field"><label>ملاحظات وشروط</label><textarea id="invNotesText">${inv.Notes||''}</textarea></div>
          </div>
          <div class="card" style="padding:14px 16px;">
            <h3 style="font-size:13.5px;margin-bottom:10px;display:flex;align-items:center;gap:6px;">${getSvgIcon("finance", 15)} الملخص المالي</h3>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <div style="display:flex;justify-content:space-between;"><span>المجموع الفرعي:</span><span class="mono font-bold">${inv.Subtotal.toLocaleString()} ج.م</span></div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:6px;"><span>ضريبة (VAT):</span><select id="invTaxPercentSelect" style="width:70px;"><option value="0" ${Number(inv.TaxPercent)===0?'selected':''}>0%</option><option value="14" ${Number(inv.TaxPercent)===14?'selected':''}>14%</option></select></div>
                <span class="mono font-bold" style="color:var(--blue);">${inv.TaxAmount.toLocaleString()} ج.م</span>
              </div>
              <div style="display:flex;justify-content:space-between;"><span>الخصم:</span><input id="invDiscountInput" type="number" value="${inv.Discount||0}" style="width:90px;text-align:center;" class="mono"></div>
              <div style="display:flex;justify-content:space-between;font-size:14.5px;font-weight:900;border-top:1px solid #ccc;padding-top:6px;"><span>الإجمالي المستحق:</span><span class="mono" style="color:var(--primary);">${inv.Total.toLocaleString()} ج.م</span></div>
              <div style="display:flex;justify-content:space-between;color:var(--green-text);"><span>المدفوع:</span><span class="mono">${(inv.AmountPaid||0).toLocaleString()} ج.م</span></div>
              <div style="display:flex;justify-content:space-between;color:${inv.Remaining>0?'var(--red)':'var(--green-text)'};font-weight:900;"><span>المتبقي:</span><span class="mono">${inv.Remaining.toLocaleString()} ج.م</span></div>
            </div>
          </div>
        </div>

        <div class="actions-row" style="margin-top:16px;">
          <button class="btn btn-ghost" id="cancelInvModalBtn" type="button">إلغاء</button>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-ghost" id="saveAndPrintQuoteBtn" type="button">${getSvgIcon("fileText", 13)} حفظ وطباعة بيان سعر</button>
            <button class="btn btn-blue" id="saveAndPrintInvBtn" type="button">${getSvgIcon("printer", 13)} حفظ وطباعة فاتورة رسمية</button>
            <button class="btn btn-primary" id="saveInvOnlyBtn" type="button">${getSvgIcon("check", 13)} حفظ فقط</button>
          </div>
        </div>
      </div>
    `;

    overlay.querySelector('#closeInvModal').onclick = ()=>overlay.remove();
    overlay.querySelector('#cancelInvModalBtn').onclick = ()=>overlay.remove();

    const custSelect = overlay.querySelector('#invCustomerSelect');
    if(custSelect){
      custSelect.onchange = (e)=>{
        const val = e.target.value;
        const titleInp = overlay.querySelector('#invCustTitle');
        const nameInp = overlay.querySelector('#invCustName');
        const phoneInp = overlay.querySelector('#invCustPhone');
        const taxInp = overlay.querySelector('#invCustTax');
        const addrInp = overlay.querySelector('#invCustAddr');
        if(val === '__WALKIN__'){
          if(titleInp) titleInp.value = ''; nameInp.value = 'عميل زائر'; phoneInp.value = '0000000000'; taxInp.value = ''; addrInp.value = '';
        } else if(val === '__NEW__'){
          if(titleInp) titleInp.value = ''; nameInp.value = ''; phoneInp.value = ''; taxInp.value = ''; addrInp.value = ''; nameInp.focus();
        } else if(val){
          const found = state.customers.find(c => c.name === val);
          if(found){
            if(titleInp) titleInp.value = found.title || '';
            nameInp.value = found.name;
            phoneInp.value = found.phone || '';
            taxInp.value = found.taxNumber || '';
            addrInp.value = found.address || '';
          }
        }
      };
    }

    overlay.querySelector('#quickWalkInCustBtn').onclick = ()=>{ custSelect.value = '__WALKIN__'; custSelect.dispatchEvent(new Event('change')); };
    overlay.querySelector('#quickNewCustBtn').onclick = ()=>{ custSelect.value = '__NEW__'; custSelect.dispatchEvent(new Event('change')); };

    overlay.querySelectorAll('[data-linefield]').forEach(inp => {
      inp.oninput = (e)=>{
        const idx = Number(inp.dataset.idx);
        const fld = inp.dataset.linefield;
        inv.Items[idx][fld] = fld==='Name' ? e.target.value : Number(e.target.value)||0;
      };
      inp.onblur = ()=>renderModal();
    });

    overlay.querySelectorAll('[data-delline]').forEach(btn => {
      btn.onclick = ()=>{
        if(inv.Items.length<=1){ showToast('يجب وجود بند واحد على الأقل', 'error'); return; }
        inv.Items.splice(Number(btn.dataset.delline), 1);
        renderModal();
      };
    });

    overlay.querySelector('#addInvLineBtn').onclick = ()=>{ inv.Items.push({ Name: '', Qty: 1, Price: 0, Total: 0 }); renderModal(); };

    overlay.querySelector('#addFromInventoryBtn').onclick = ()=>{
      openInventoryPickerModal((pickedItem)=>{
        inv.Items.push({
          Name: pickedItem.Name,
          Qty: 1,
          Price: Number(pickedItem.SellPrice||pickedItem.PurchasePrice||0),
          Total: Number(pickedItem.SellPrice||pickedItem.PurchasePrice||0)
        });
        renderModal();
      });
    };

    overlay.querySelector('#invTaxPercentSelect').onchange = (e)=>{ inv.TaxPercent = Number(e.target.value); renderModal(); };
    overlay.querySelector('#invDiscountInput').oninput = (e)=>{ inv.Discount = Number(e.target.value)||0; };
    overlay.querySelector('#invDiscountInput').onblur = ()=>renderModal();
    overlay.querySelector('#invPaidInput').oninput = (e)=>{ inv.AmountPaid = Number(e.target.value)||0; };
    overlay.querySelector('#invPaidInput').onblur = ()=>renderModal();

    function collectData(){
      inv.CustomerTitle = (overlay.querySelector('#invCustTitle')?.value || '').trim();
      inv.CustomerName = overlay.querySelector('#invCustName').value.trim();
      inv.CustomerPhone = overlay.querySelector('#invCustPhone').value.trim();
      inv.CustomerTaxNumber = overlay.querySelector('#invCustTax').value.trim();
      inv.CustomerAddress = overlay.querySelector('#invCustAddr').value.trim();
      inv.Date = overlay.querySelector('#invDate').value;
      inv.DueDate = overlay.querySelector('#invDueDate').value;
      inv.PaymentMethod = overlay.querySelector('#invPaymentMethod').value;
      inv.Notes = overlay.querySelector('#invNotesText').value.trim();
      inv.ItemsSummary = inv.Items.map(i=>i.Name).filter(Boolean).join(' + ');
      inv.ItemsJSON = JSON.stringify(inv.Items);
    }

    async function handleSave(andPrint, docType='invoice'){
      collectData();
      if(!inv.CustomerName){ showToast('يرجى اختيار اسم العميل', 'error'); return; }
      if(!inv.Items.length || !inv.Items[0].Name){ showToast('يرجى إضافة بنود للفاتورة', 'error'); return; }
      try{
        await saveInvoiceRemote(inv);
        showToast(`تم حفظ ${docType==='quote'?'عرض السعر':'الفاتورة'} بنجاح (${inv.InvoiceNumber})`, 'success');
        overlay.remove();
        const main = document.getElementById('main');
        if(state.currentSection === 'invoices' && main){
          renderInvoicesPage(main);
        } else if(state.currentSection === 'maintenance' && state.tab === 'invoices' && main){
          renderInvoicesPage(main);
        } else if(state.currentSection === 'maintenance'){
          renderMain();
        }
        if(andPrint) openInvoicePrint(inv, docType);
      }catch(e){
        showToast('خطأ في حفظ البيانات', 'error');
      }
    }

    overlay.querySelector('#saveInvOnlyBtn').onclick = ()=>handleSave(false);
    overlay.querySelector('#saveAndPrintInvBtn').onclick = ()=>handleSave(true, 'invoice');
    overlay.querySelector('#saveAndPrintQuoteBtn').onclick = ()=>handleSave(true, 'quote');
  }

  document.body.appendChild(overlay);
  renderModal();
}

function openInventoryPickerModal(onSelect){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:550px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
        <h3 style="margin:0;font-size:16px;display:flex;align-items:center;gap:6px;">${getSvgIcon("inventory", 16)} اختر صنف من المخزن</h3>
        <button class="btn btn-ghost btn-xs" id="closeInvPicker">&times;</button>
      </div>
      <div class="field" style="margin-bottom:10px;">
        <input id="pickerSearch" placeholder="بحث باسم الصنف أو الباركود..." autofocus>
      </div>
      <div id="pickerListMount" style="max-height:340px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#closeInvPicker').onclick = ()=>overlay.remove();

  function renderList(q=''){
    const box = overlay.querySelector('#pickerListMount');
    let list = state.inventory || [];
    if(q){
      list = list.filter(it => it.Name.toLowerCase().includes(q.toLowerCase()) || String(it.Barcode||'').includes(q));
    }
    if(!list.length){
      box.innerHTML = '<div class="empty">لا توجد أصناف مطابقة.</div>';
      return;
    }
    box.innerHTML = list.map(it => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--paper3);border-radius:var(--radius-sm);border:1px solid var(--line);cursor:pointer;" data-pickid="${it.ID}">
        <div>
          <div style="font-weight:800;font-size:13px;">${it.Name}</div>
          <div class="mono" style="font-size:11px;color:var(--ink-secondary);">باركود: ${it.Barcode||'-'} | المتاح: <b>${it.Quantity}</b></div>
        </div>
        <div class="mono font-bold" style="color:var(--green);font-size:13.5px;">${Number(it.SellPrice||it.PurchasePrice||0).toLocaleString()} ج.م</div>
      </div>
    `).join('');

    box.querySelectorAll('[data-pickid]').forEach(el => {
      el.onclick = ()=>{
        const found = state.inventory.find(x=>x.ID===el.dataset.pickid);
        if(found){ onSelect(found); overlay.remove(); }
      };
    });
  }

  renderList();
  overlay.querySelector('#pickerSearch').oninput = (e)=>renderList(e.target.value.trim());
}

/* ---------------- Print Luxury Tax Invoice / Price Quotation (A4 / A5) ---------------- */
function openInvoicePrint(inv, docType='invoice'){
  document.body.classList.remove('printing-sticker');
  const old = document.getElementById('printMount');
  if(old) old.remove();
  const mount = document.createElement('div');
  mount.id='printMount';

  const isQuote = docType === 'quote';
  const docTitle = isQuote ? 'عرض أسعار وبيان سعر • Price Quotation' : 'فاتورة ضريبية رسمية • Tax Invoice';
  const trackQrData = `${isQuote?'Quote':'Invoice'}:${inv.InvoiceNumber}|Customer:${inv.CustomerName}|Total:${inv.Total}|Date:${cleanDate(inv.Date)}`;
  const qrSvgHtml = QRCodeGenerator.toSvg(trackQrData, 56);

  mount.innerHTML = `
  <div style="width:100%;max-width:700px;margin:0 auto;background:#fff;padding:24px 28px;color:#0f172a;font-family:var(--font-main);border-radius:8px;box-sizing:border-box;">
    <!-- Invoice/Quote Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:14px;">
      <div>
        ${state.settings.logoUrl ? `<img src="${state.settings.logoUrl}" style="max-height:38px;max-width:140px;object-fit:contain;margin-bottom:4px;">` : ''}
        <h2 style="margin:0;font-size:20px;font-weight:900;color:#0f172a;">${escapeHtml(state.settings.shopName || 'صيانة ميكروتك')}</h2>
        <div style="font-size:11px;color:#475569;margin-top:2px;">${docTitle}</div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:58px;height:58px;border:1px solid #cbd5e1;border-radius:4px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff;">
          ${qrSvgHtml}
        </div>
        <div style="text-align:left;">
          <div style="background:${isQuote?'#0284c7':'#0f172a'};color:#fff;font-size:14px;font-weight:900;padding:3px 12px;border-radius:4px;display:inline-block;" class="mono">${inv.InvoiceNumber}</div>
          <div style="font-size:11px;color:#475569;margin-top:3px;">التاريخ: <b>${cleanDate(inv.Date)}</b></div>
          <div style="font-size:10.5px;color:#64748b;">الصلاحية / الاستحقاق: <b>${cleanDate(inv.DueDate)}</b></div>
        </div>
      </div>
    </div>

    <!-- Customer & Meta Grid -->
    <div style="display:grid;grid-template-columns: 1fr 1fr;gap:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 14px;margin-bottom:16px;font-size:12px;">
      <div>
        <div style="color:#64748b;font-size:11px;margin-bottom:2px;">بيانات العميل / المشتري:</div>
        <div style="font-size:14px;font-weight:900;color:#0f172a;">${inv.CustomerName}</div>
        <div class="mono" style="color:#334155;margin-top:2px;">هاتف: ${inv.CustomerPhone || 'غير محدد'}</div>
        ${inv.CustomerTaxNumber ? `<div style="font-size:11px;color:#475569;margin-top:2px;">الرقم الضريبي: <b>${inv.CustomerTaxNumber}</b></div>` : ''}
        ${inv.CustomerAddress ? `<div style="font-size:11px;color:#475569;">العنوان: ${inv.CustomerAddress}</div>` : ''}
      </div>
      <div style="text-align:left;">
        <div style="color:#64748b;font-size:11px;margin-bottom:2px;">تفاصيل المستند:</div>
        <div>نوع المستند: <b style="color:${isQuote?'#0284c7':'#0f172a'};">${isQuote ? 'عرض أسعار / بيان تكلفة' : 'فاتورة مبيعات وخدمات'}</b></div>
        <div>طريقة السداد: <b>${inv.PaymentMethod||'نقدي'}</b></div>
        ${!isQuote ? `<div>حالة الفاتورة: <b style="color:${inv.Remaining<=0?'#16a34a':'#e11d48'};">${inv.Status}</b></div>` : ''}
        ${inv.ReferenceType ? `<div style="font-size:11px;color:#2563eb;margin-top:2px;">مرجع: ${inv.ReferenceType==='Receipt'?'إيصال صيانة #':inv.ReferenceType} ${inv.ReferenceID}</div>` : ''}
      </div>
    </div>

    <!-- Items Table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:11.5px;">
      <thead>
        <tr style="background:#0f172a;color:#fff;">
          <th style="padding:7px 10px;text-align:right;">#</th>
          <th style="padding:7px 10px;text-align:right;">بيان الصنف أو الخدمة</th>
          <th style="padding:7px 10px;text-align:center;">الكمية</th>
          <th style="padding:7px 10px;text-align:center;">سعر الوحدة</th>
          <th style="padding:7px 10px;text-align:center;">الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${(inv.Items||[]).map((it, idx)=>`
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:7px 10px;color:#64748b;" class="mono">${idx+1}</td>
            <td style="padding:7px 10px;font-weight:700;">${it.Name}</td>
            <td style="padding:7px 10px;text-align:center;" class="mono">${it.Qty||1}</td>
            <td style="padding:7px 10px;text-align:center;" class="mono">${Number(it.Price||0).toLocaleString()} ج.م</td>
            <td style="padding:7px 10px;text-align:center;font-weight:900;" class="mono">${(Number(it.Qty||1)*Number(it.Price||0)).toLocaleString()} ج.م</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals Summary Box -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:18px;">
      <div style="flex:1;font-size:11px;color:#475569;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:6px;padding:10px 12px;line-height:1.6;">
        <b>${isQuote ? 'شروط وأحكام عرض السعر:' : 'ملاحظات وشروط الضمان:'}</b>
        <div>${inv.Notes || (isQuote ? '• هذا البيان يعتبر عرض أسعار رسمي صالح لمدة 7 أيام من تاريخ إصداره.\n• الأسعار والكميات الموضحة خاضعة للتوافر والتأكيد النهائي عند بدء التنفيذ.' : 'البضاعة المباعة تخضع للضمان المحدد بالفاتورة. لا يُقبل الاسترجاع إلا بوجود أصل الفاتورة.')}</div>
      </div>
      <div style="width:240px;background:#f1f5f9;border-radius:6px;padding:10px 14px;font-size:11.5px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span>المجموع الفرعي:</span>
          <span class="mono font-bold">${Number(inv.Subtotal||0).toLocaleString()} ج.م</span>
        </div>
        ${Number(inv.TaxAmount||0)>0 ? `
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#2563eb;">
            <span>ضريبة القيمة المضافة (${inv.TaxPercent}%):</span>
            <span class="mono font-bold">${Number(inv.TaxAmount).toLocaleString()} ج.م</span>
          </div>
        ` : ''}
        ${Number(inv.Discount||0)>0 ? `
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#e11d48;">
            <span>الخصم الممنوح:</span>
            <span class="mono font-bold">-${Number(inv.Discount).toLocaleString()} ج.م</span>
          </div>
        ` : ''}
        <div style="display:flex;justify-content:space-between;border-top:2px solid #0f172a;padding-top:6px;margin-top:4px;font-size:13.5px;font-weight:900;color:#0f172a;">
          <span>الإجمالي النهائي:</span>
          <span class="mono">${Number(inv.Total||0).toLocaleString()} ج.م</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:4px;color:#16a34a;font-weight:700;">
          <span>المدفوع:</span>
          <span class="mono">${Number(inv.AmountPaid||0).toLocaleString()} ج.م</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:4px;color:${Number(inv.Remaining||0)>0?'#e11d48':'#16a34a'};font-weight:900;">
          <span>المتبقي:</span>
          <span class="mono">${Number(inv.Remaining||0).toLocaleString()} ج.م</span>
        </div>
      </div>
    </div>

    <!-- Signatures Row -->
    <div style="display:flex;justify-content:space-between;margin-top:20px;font-size:11px;color:#475569;border-top:1px solid #e2e8f0;padding-top:12px;">
      <div style="text-align:center;width:40%;">
        <div>توقيع المستلم / العميل</div>
        <div style="margin-top:25px;border-bottom:1px dashed #94a3b8;width:80%;margin-left:auto;margin-right:auto;"></div>
      </div>
      <div style="text-align:center;width:40%;">
        <div>ختم وتوقيع الإدارة المالية</div>
        <div style="margin-top:25px;border-bottom:1px dashed #94a3b8;width:80%;margin-left:auto;margin-right:auto;"></div>
      </div>
    </div>
  </div>`;

  document.body.appendChild(mount);
  setTimeout(()=>{ window.print(); mount.remove(); }, 250);
}
