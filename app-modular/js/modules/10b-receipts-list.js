/* ---------------- Archive & Overdue Reminders ---------------- */
const STATUS_GROUPS = {
  all: {label:'الكل', statuses:null},
  active: {label:'قيد العمل', statuses:['قيد الفحص','بانتظار موافقة العميل','بانتظار قطعة غيار','الصيانة']},
  quotationWaiting: {label:'عروض بانتظار موافقة العميل', statuses:null},
  delayed48h: {label:'متأخرة بالورشة (+48 س)', statuses:null},
  done: {label:'جاهزة للاستلام', statuses:['مكتمل']},
  delivered: {label:'تم التسليم', statuses:['تم التسليم']},
  overdue: {label:'متروكة +7 أيام', statuses:null},
  unclaimed: {label:'أجهزة لم تُطالَب (+30 يوم)', statuses:null},
  warranty: {label:'إصلاحات داخل الضمان', statuses:null},
  rejected: {label:'تعذرت / مرفوضة / ملغية', statuses:['رفض العميل','تعذرت الصيانة','ملغي']}
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
    <th style="width:12%;">رقم الإيصال</th>
    <th style="width:16%;">العميل</th>
    <th style="width:22%;">الأجهزة والعطل</th>
    <th style="width:10%;">الفني</th>
    <th style="width:11%;text-align:center;">الحالة</th>
    <th style="width:9%;text-align:center;">التكلفة</th>
    <th style="width:9%;text-align:center;">المدفوع</th>
    <th style="width:11%;text-align:center;">المتبقي</th>
  </tr></thead><tbody>
  ${list.map(rawR=>{
    const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
    if(!r) return '';
    const st = STATUSES.find(s=>s.v===r.status) || STATUSES[0];
    const otherAmt = Number(r.otherAccountAmount || 0);
    const totalDue = Number(r.cost||0) + Number(r.partsCost||0) + otherAmt;
    const deposit = Number(r.deposit||0);
    const remaining = Math.max(0, totalDue - deposit + Number(r.refunded||0));
    const intakeDateStr = r.updatedAt || r.receivedAt || r.date || r.Date || '';
    const isOverdue = r.status==='مكتمل' && intakeDateStr && (Date.now()-new Date(intakeDateStr).getTime())/86400000 > 7;
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

    return `<tr class="selectable-row ${isSelected ? 'selected-row' : ''}" data-receipt-id="${safeTargetId}" data-receipt-num="${rNum}" onclick="handleReceiptRowClick('${safeTargetId}', '${rNum}', event)" ondblclick="openReceiptDetailModal('${safeTargetId}', '${rNum}')" style="cursor:pointer;${isOverdue?'background:rgba(245,158,11,0.08);':''}" title="نقر لتحديد الإيصال وإجراء العمليات • نقر مزدوج لعرض التفاصيل والتعديل">
      <td style="text-align:center;" onclick="event.stopPropagation();">
        <input type="checkbox" class="receipt-select-cb" value="${safeTargetId}" ${isChecked ? 'checked' : ''} onchange="window.toggleReceiptMultiSelection('${safeTargetId}', this.checked, event)" style="cursor:pointer;width:16px;height:16px;" />
      </td>
      <td>
        <div style="display:flex;align-items:center;gap:4px;">
          ${isSelected ? `<span class="selected-badge-indicator" title="إيصال محدد">${getSvgIcon('check', 11)}</span>` : ''}
          <span class="mono" style="font-weight:800;font-size:13px;color:var(--primary);direction:ltr;unicode-bidi:isolate;display:inline-block;">${rNum}</span>
        </div>
        ${r.previousReceiptNumber ? `<div style="font-size:10px;color:#b45309;font-weight:700;margin-top:1px;direction:ltr;unicode-bidi:isolate;">صيانة راجعة (#${escapeHtml(r.previousReceiptNumber)})</div>` : ''}
        <div style="color:var(--ink-secondary);font-size:11px;display:flex;align-items:center;gap:4px;margin-top:2px;">
          <span>${getSvgIcon("calendar", 11)} ${cleanDate(r.receivedAt || r.date || r.Date)}</span>
          ${(formatReceiptTime(r) || r.time || (r.receivedAt ? cleanTime(r.receivedAt) : '')) ? `<span class="mono" style="color:var(--primary);font-size:10px;font-weight:600;direction:ltr;unicode-bidi:isolate;">${getSvgIcon("clock", 11)} ${formatReceiptTime(r) || r.time || cleanTime(r.receivedAt)}</span>` : ''}
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
            <a href="https://wa.me/${normalizePhoneForWa(cPhone)}" target="_blank" style="color:#22c55e;text-decoration:none;font-size:12px;" title="محادثة واتساب" onclick="event.stopPropagation();">${getSvgIcon('message', 12)}</a>
          </div>
        ` : `
          <div style="color:var(--amber-text);font-size:10.5px;font-weight:700;cursor:pointer;margin-top:2px;" onclick="openQuickAddPhoneModal('${escapeHtml(cName)}', '${escapeHtml(cTitle)}', '${safeTargetId}', '${rNum}'); event.stopPropagation();">هاتف غير مسجل (اضغط للإضافة)</div>
        `}
      </td>
      <td>${deviceHtml}</td>
      <td>${r.technician ? `<span style="font-weight:600;">${escapeHtml(r.technician)}</span>` : '<span style="color:var(--slate-400);">-</span>'}</td>
      <td style="text-align:center;">
        <button class="btn-status-quick" onclick="openQuickStatusModalDirect('${safeTargetId}', '${rNum}'); event.stopPropagation();" title="اضغط لتغيير حالة الجهاز فورًا"><span class="status-badge ${st.cls}">${escapeHtml(r.status)}</span></button>
        ${(r.customerApproval && r.customerApproval.approved) ? `<div style="font-size:10px;color:#7c3aed;font-weight:700;margin-top:2px;" title="موافقة معتمدة من ${escapeHtml(r.customerApproval.approverName)}">✅ معتمد (${Number(r.customerApproval.approvedCost||r.cost).toLocaleString()} ج.م)</div>` : ''}
        ${(r.warrantyEnd && r.warrantyEnd >= (typeof localDateStr === 'function' ? localDateStr() : new Date().toISOString().slice(0,10))) ? `<div style="font-size:9.5px;color:#047857;font-weight:700;margin-top:2px;" title="ضمان ساري حتى ${cleanDate(r.warrantyEnd)}">🛡️ ضمان: ${cleanDate(r.warrantyEnd)}</div>` : ''}
      </td>
      <td class="mono" style="font-weight:700;color:var(--ink);text-align:center;">
        ${totalDue.toLocaleString()} ج.م
        ${otherAmt>0 ? `<div style="font-size:9.5px;color:var(--amber-text);font-weight:700;">(+${otherAmt} إضافي)</div>` : ''}
      </td>
      <td class="mono" style="font-weight:700;color:var(--green);text-align:center;">
        ${deposit.toLocaleString()} ج.م
      </td>
      <td class="mono" style="font-weight:800;text-align:center;${remaining>0?'color:var(--red);':'color:var(--green);'}">
        ${remaining.toLocaleString()} ج.م
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
    const intakeDateStr = r.updatedAt || r.receivedAt || r.date || r.Date || '';
    const isOverdue = r.status==='مكتمل' && intakeDateStr && (Date.now()-new Date(intakeDateStr).getTime())/86400000 > 7;
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
                ${isSelected ? `<span class="selected-badge-indicator">${getSvgIcon('check', 11)} محدد</span>` : ''}
                <span class="badge" style="background:var(--paper2);color:var(--primary);font-size:11.5px;font-weight:800;border:1px solid var(--line);padding:2px 8px;border-radius:4px;">
                  إيصال <span class="mono" style="direction:ltr;unicode-bidi:isolate;display:inline-block;font-size:12.5px;">${rNum}</span>
                </span>
                ${isMultiDev ? `<span class="badge" style="background:#e0e7ff;color:#3730a3;font-size:10px;font-weight:800;">${r.devices.length} أجهزة</span>` : ''}
                ${r.previousReceiptNumber ? `<span class="badge" style="background:#fef3c7;color:#b45309;font-size:10px;font-weight:700;">صيانة راجعة (<span class="mono" style="direction:ltr;unicode-bidi:isolate;display:inline-block;">${escapeHtml(r.previousReceiptNumber)}</span>)</span>` : ''}
              </div>
              <div style="color:var(--ink-secondary);font-size:11px;display:flex;align-items:center;gap:6px;margin-top:3px;">
                <span>${getSvgIcon("calendar", 11)} ${cleanDate(r.receivedAt || r.date || r.Date)}</span>
                ${(formatReceiptTime(r) || r.time || (r.receivedAt ? cleanTime(r.receivedAt) : '')) ? `<span class="mono" style="color:var(--primary);font-size:10.5px;font-weight:600;">${getSvgIcon("clock", 11)} ${formatReceiptTime(r) || r.time || cleanTime(r.receivedAt)}</span>` : ''}
              </div>
            </div>
          </div>
          <button class="btn-status-quick" onclick="openQuickStatusModalDirect('${safeTargetId}', '${rNum}'); event.stopPropagation();" title="اضغط لتغيير حالة الجهاز فوراً" style="margin:0;"><span class="status-badge ${st.cls}">${escapeHtml(r.status)}</span></button>
        </div>

        <div style="margin-top:10px;">
          ${isMultiDev ? `
            <div class="smart-card-device">
              <b>${escapeHtml(r.devices[0].category || 'جهاز')} ${escapeHtml(r.devices[0].brand === 'أخرى' ? r.devices[0].brandOther : (r.devices[0].brand || ''))}</b> <span style="color:var(--ink-secondary);font-weight:500;">${escapeHtml(r.devices[0].model || '')}</span>
              <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">
                + ${r.devices.slice(1).map(d => escapeHtml((d.category || 'جهاز') + ' ' + (d.brand === 'أخرى' ? d.brandOther : (d.brand || '')) + ' ' + (d.model || ''))).join('، ')}
              </div>
            </div>
          ` : `
            <div class="smart-card-device">${dCat} - ${dBrand} <span style="color:var(--ink-secondary);font-weight:500;">${dModel}</span></div>
          `}
          <div class="smart-card-customer">
            ${cTitle ? `<span class="badge" style="background:var(--paper2);color:var(--primary);font-size:10px;font-weight:700;border:1px solid var(--line);padding:1px 5px;border-radius:4px;">${escapeHtml(cTitle)}</span>` : ''}
            <b style="color:var(--ink);">${escapeHtml(cName)}</b>
            ${cPhone && cPhone !== '0000000000' ? `
              <span class="mono" style="color:var(--ink-secondary);font-size:11.5px;display:inline-flex;align-items:center;gap:3px;margin-right:auto;">
                <span>${escapeHtml(cPhone)}</span>
                <a href="https://wa.me/${normalizePhoneForWa(cPhone)}" target="_blank" style="color:#22c55e;text-decoration:none;font-size:13px;" title="واتساب">${getSvgIcon('message', 12)}</a>
              </span>
            ` : `
              <span style="color:var(--amber-text);font-size:10.5px;font-weight:700;cursor:pointer;margin-right:auto;" onclick="openQuickAddPhoneModal('${escapeHtml(cName)}', '${escapeHtml(cTitle)}', '${safeTargetId}', '${rNum}'); event.stopPropagation();">هاتف غير مسجل</span>
            `}
          </div>
          <div style="font-size:11px;color:var(--ink-secondary);margin-top:5px;display:flex;align-items:center;gap:4px;">
            <span>${getSvgIcon("user", 12)} الفني المسؤول:</span>
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
      </div>
    </div>`;
  }).join('')}
  </div>`;
}

function renderMaintenanceView(list){
  const mode = state.maintenanceViewMode || 'table';
  return mode === 'cards' ? archiveCards(list) : archiveTable(list);
}

function getFilteredArchiveReceipts(){
  const f = state.archiveFilter;
  if(!f.group) f.group = 'all';
  let list = [...state.receipts];

  if(f.group==='overdue'){
    list = list.filter(r=>{
      if(r.status!=='مكتمل') return false;
      const dStr = r.updatedAt || r.receivedAt || r.date || r.Date || '';
      if(!dStr) return false;
      const t = new Date(dStr).getTime();
      return !isNaN(t) && (Date.now() - t) / 86400000 > 7;
    });
  } else if(f.group==='delayed48h'){
    list = list.filter(r=>{
      if(r.status==='مكتمل' || r.status==='تم التسليم' || r.status==='ملغي' || r.status==='تعذرت الصيانة' || r.status==='رفض العميل') return false;
      const dStr = r.receivedAt || r.date || r.Date || '';
      if(!dStr) return false;
      const t = new Date(dStr).getTime();
      return !isNaN(t) && (Date.now() - t) / 3600000 >= 48;
    });
  } else if(f.group==='unclaimed'){
    list = list.filter(r=>{
      if(r.status==='تم التسليم' || r.status==='ملغي') return false;
      const dStr = r.updatedAt || r.deliveryDate || r.receivedAt || r.date || r.Date || '';
      if(!dStr) return false;
      const t = new Date(dStr).getTime();
      return !isNaN(t) && (Date.now() - t) / 86400000 > 30;
    });
  } else if(f.group==='quotationWaiting'){
    list = list.filter(r => (r.quotationStatus === 'sent' || r.status === 'بانتظار موافقة العميل') && r.quotationStatus !== 'approved' && r.quotationStatus !== 'rejected');
  } else if(f.group==='warranty'){
    const todayStr = (typeof localDateStr === 'function') ? localDateStr() : new Date().toISOString().slice(0, 10);
    list = list.filter(r => r.previousReceiptId || r.reIntakeReason || (r.warrantyEnd && r.warrantyEnd >= todayStr) || r.isUnderWarranty);
  } else {
    const groupStatuses = STATUS_GROUPS[f.group] ? STATUS_GROUPS[f.group].statuses : null;
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
      const rBrand = String(r.device && r.device.brand ? (r.device.brand==='أخرى' ? r.device.brandOther : r.device.brand) : '').toLowerCase();
      return rNum.includes(qTerm) || rName.includes(qTerm) || rTitle.includes(qTerm) || rPhone.includes(qTerm) || rModel.includes(qTerm) || rBrand.includes(qTerm);
    });
  }
  if(f.status) list = list.filter(r=>r.status===f.status);
  if(f.tech) list = list.filter(r=>r.technician===f.tech);

  return list;
}

function renderArchive(main){
  const f = state.archiveFilter;
  if(!f.group) f.group = 'all';

  // Preserve focus & cursor position if fq input was active prior to full re-render
  const activeEl = document.activeElement;
  const wasFqActive = (activeEl && activeEl.id === 'fq');
  const selStart = wasFqActive ? activeEl.selectionStart : null;
  const selEnd = wasFqActive ? activeEl.selectionEnd : null;

  const list = getFilteredArchiveReceipts();

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("archive", 22)} أرشيف إيصالات الصيانة</h2>
        <div class="subtitle mono" id="archCountBadge" style="font-size:12px;color:var(--ink-secondary);">${list.length} إيصال مطابق</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <div class="view-mode-toggle" style="margin-left:4px;">
          <button type="button" class="view-mode-btn ${state.maintenanceViewMode!=='cards'?'active':''}" id="archViewTableBtn" title="عرض جدول">${getSvgIcon("fileText", 13)} جدول</button>
          <button type="button" class="view-mode-btn ${state.maintenanceViewMode==='cards'?'active':''}" id="archViewCardsBtn" title="عرض بطاقات ذكية">${getSvgIcon("folder", 13)} بطاقات ذكية</button>
        </div>
        <button class="btn btn-whatsapp btn-sm" id="archBulkOverdueBtn" title="إرسال تذكيرات واتساب دفعة واحدة للأجهزة المتروكة (+7 أيام)">${WA_ICON} تذكير المتروكة (+7)</button>
        <button class="btn btn-whatsapp btn-sm" id="archBulkUnclaimedBtn" style="background:#b45309;" title="تذكير وإشعار العملاء بالأجهزة غير المطالب بها (+30 يوم)">${WA_ICON} لم تُطالَب (+30 يوم)</button>
        <button class="btn btn-ghost btn-sm" id="archRecoverPhonesBtn" style="color:var(--primary);font-weight:800;" title="فحص كافة السجلات واسترداد أرقام الهواتف التائهة">${getSvgIcon("refresh", 13)} استرداد الهواتف</button>
        <button class="btn btn-ghost btn-sm" id="archGotoCustBtn">${getSvgIcon("users", 13)} دليل العملاء</button>
        <button class="btn btn-ghost btn-sm" id="exportArchiveExcelBtn">${getSvgIcon("download", 13)} تصدير CSV (Excel)</button>
        <button class="btn btn-primary btn-sm" id="archNewReceiptBtn">${getSvgIcon("plus", 13)} إيصال جديد</button>
      </div>
    </div>

    <div class="chip-group" id="groupTabs" style="margin-bottom:12px;">
      ${Object.entries(STATUS_GROUPS).map(([k,g])=>`<div class="chip ${f.group===k?'sel':''}" data-g="${k}">${g.label}</div>`).join('')}
    </div>

    <div class="filters-bar">
      <input id="fq" placeholder="بحث برقم الإيصال / اسم العميل / الهاتف / الموديل" value="${f.q || ''}" style="flex:1;">
      <select id="fstatus"><option value="">كل الحالات</option>${STATUSES.map(s=>`<option ${f.status===s.v?'selected':''}>${s.icon} ${s.v}</option>`).join('')}</select>
      <select id="ftech"><option value="">كل الفنيين</option>${state.technicians.map(t=>`<option ${f.tech===t?'selected':''}>${t}</option>`).join('')}</select>
      <span id="clearFiltersSlot">${(f.q||f.status||f.tech||f.group!=='all') ? `<button class="btn btn-ghost btn-sm" id="clearFiltersBtn">مسح الفلاتر</button>` : ''}</span>
    </div>

    <div id="unifiedSelectionTopSlot"></div>

    <div id="archListContainer">
      ${list.length===0 ? '<div class="empty">لا توجد نتائج مطابقة لخيارات البحث.</div>' : renderMaintenanceView(list.slice().reverse())}
    </div>
  `;

  // Restore focus if fq input was active prior to full re-render
  if(wasFqActive){
    const restoredFq = document.getElementById('fq');
    if(restoredFq){
      restoredFq.focus();
      try { restoredFq.setSelectionRange(selStart, selEnd); } catch(err){}
    }
  }

  // Live in-place update function: updates ONLY the list and counter without destroying inputs
  const updateListOnly = () => {
    const container = document.getElementById('archListContainer');
    const badge = document.getElementById('archCountBadge');
    const clearSlot = document.getElementById('clearFiltersSlot');
    if(!container){
      renderArchive(main);
      return;
    }
    const filteredList = getFilteredArchiveReceipts();
    if(badge) badge.textContent = `${filteredList.length} إيصال مطابق`;
    container.innerHTML = filteredList.length === 0
      ? '<div class="empty">لا توجد نتائج مطابقة لخيارات البحث.</div>'
      : renderMaintenanceView(filteredList.slice().reverse());

    if(clearSlot){
      clearSlot.innerHTML = (f.q || f.status || f.tech || f.group !== 'all')
        ? '<button class="btn btn-ghost btn-sm" id="clearFiltersBtn">مسح الفلاتر</button>'
        : '';
      const newClearBtn = document.getElementById('clearFiltersBtn');
      if(newClearBtn) newClearBtn.onclick = handleClearFilters;
    }

    attachRowActions(container);
    if(typeof window.renderUnifiedSelectionBar === 'function'){
      window.renderUnifiedSelectionBar();
    }
  };

  window.updateArchiveListOnly = updateListOnly;
  window.updateReceiptStatusDOM = function(receiptIdOrNum, newStatus){
    if(!receiptIdOrNum || !newStatus) return;
    const qStr = String(receiptIdOrNum).trim().toLowerCase();
    const st = STATUSES.find(s => s.v === newStatus) || STATUSES[0];
    const elements = document.querySelectorAll(`[data-receipt-id="${qStr}"], [data-receipt-num="${qStr}"]`);
    elements.forEach(el => {
      const badge = el.querySelector('.status-badge');
      if(badge){
        badge.className = `status-badge ${st.cls}`;
        badge.textContent = newStatus;
      }
    });
  };

  const handleClearFilters = () => {
    f.q = '';
    f.status = '';
    f.tech = '';
    f.group = 'all';
    const fqEl = document.getElementById('fq');
    if(fqEl) fqEl.value = '';
    const fstEl = document.getElementById('fstatus');
    if(fstEl) fstEl.value = '';
    const ftEl = document.getElementById('ftech');
    if(ftEl) ftEl.value = '';
    document.querySelectorAll('#groupTabs .chip').forEach(ch => {
      ch.classList.toggle('sel', ch.dataset.g === 'all');
    });
    updateListOnly();
    if(fqEl) fqEl.focus();
  };

  const btnTable = document.getElementById('archViewTableBtn');
  const btnCards = document.getElementById('archViewCardsBtn');
  if(btnTable) btnTable.onclick = ()=>{
    state.maintenanceViewMode = 'table';
    try{ localStorage.setItem('microerp_maint_view_mode', 'table'); }catch(e){}
    btnTable.classList.add('active');
    if(btnCards) btnCards.classList.remove('active');
    updateListOnly();
  };
  if(btnCards) btnCards.onclick = ()=>{
    state.maintenanceViewMode = 'cards';
    try{ localStorage.setItem('microerp_maint_view_mode', 'cards'); }catch(e){}
    btnCards.classList.add('active');
    if(btnTable) btnTable.classList.remove('active');
    updateListOnly();
  };

  const archBulkWa = document.getElementById('archBulkOverdueBtn');
  if(archBulkWa) archBulkWa.onclick = ()=>openBulkOverdueWhatsappModal(7);

  const archBulkUncl = document.getElementById('archBulkUnclaimedBtn');
  if(archBulkUncl) archBulkUncl.onclick = ()=>{
    if(typeof openBulkOverdueWhatsappModal === 'function') openBulkOverdueWhatsappModal(30);
  };

  document.getElementById('archNewReceiptBtn').onclick = ()=>{ state.tab='new'; startNewDraft(); };
  document.getElementById('exportArchiveExcelBtn').onclick = ()=>exportReceiptsToExcel(getFilteredArchiveReceipts());
  document.getElementById('archRecoverPhonesBtn').onclick = ()=>{
    recoverAndSyncAllCustomerPhones(true);
    updateListOnly();
  };
  document.getElementById('archGotoCustBtn').onclick = ()=>{
    state.tab = 'customers';
    renderMain();
  };

  document.querySelectorAll('#groupTabs .chip').forEach(c=>{
    c.onclick = ()=>{
      f.group = c.dataset.g;
      document.querySelectorAll('#groupTabs .chip').forEach(ch => {
        ch.classList.toggle('sel', ch.dataset.g === f.group);
      });
      updateListOnly();
    };
  });

  const fqInput = document.getElementById('fq');
  if(fqInput){
    fqInput.oninput = e => {
      f.q = e.target.value;
      updateListOnly();
    };
  }

  const fStatusEl = document.getElementById('fstatus');
  if(fStatusEl){
    fStatusEl.onchange = e => {
      f.status = e.target.value.replace(/^[^\s]+\s/, '');
      updateListOnly();
    };
  }

  const fTechEl = document.getElementById('ftech');
  if(fTechEl){
    fTechEl.onchange = e => {
      f.tech = e.target.value;
      updateListOnly();
    };
  }

  const clearBtn = document.getElementById('clearFiltersBtn');
  if(clearBtn) clearBtn.onclick = handleClearFilters;

  attachRowActions(main);
  if(typeof window.renderUnifiedSelectionBar === 'function'){
    window.renderUnifiedSelectionBar();
  }
}
