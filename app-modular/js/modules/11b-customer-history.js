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

      recordAuditLog('إعادة إدخال جهاز', 'صيانة', `إعادة إدخال جهاز للصيانة برقم إيصال جديد #${newRecNum} (سابق #${previousReceipt.receiptNumber} - ${reason})`, newReceipt.id);
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
