/* ---------------- WhatsApp Messaging (Free Official Click-to-Chat Channel) ----------------
   Uses the official free wa.me deep link (no per-message fees, no ban risk).
   All phone normalization / journaling logic lives in js/core/10-whatsapp-engine.js (unit tested).
   ---------------------------------------------------------------------------------------- */

const WA_NOTIFICATION_LOG_KEY = 'microerp_wa_log';
let _waNotificationLog = null;

/* Arabic titles for every notification template key */
const WA_TEMPLATE_TITLES = {
  intake: 'استلام جديد',
  check: 'قيد الفحص',
  await_approval: 'بانتظار موافقة العميل',
  await_parts: 'بانتظار قطعة غيار',
  repair: 'الصيانة',
  done: 'جاهز للاستلام',
  delivered: 'تم التسليم',
  pending: 'معلق',
  warranty: 'تحت الضمان',
  overdue: 'تذكير بالاستلام (+7 أيام)',
  unclaimed: 'إشعار جهاز لم يُطالَب (+30 يوم)',
  unrepairable: 'تعذر الإصلاح',
  rejected: 'رفض الصيانة',
  canceled: 'ملغي',
  cost_estimate: 'مقايسة التكلفة',
  custom: 'رسالة واتساب'
};

function getWaTemplateTitle(key){
  return WA_TEMPLATE_TITLES[key] || WA_TEMPLATE_TITLES.custom;
}

/* Country code used when the operator types a local number (e.g. 01012345678) */
function getWaCountryCode(){
  try {
    const s = (typeof state !== 'undefined' && state && state.settings) || {};
    return String(s.waCountryCode || WhatsappEngine.DEFAULT_WA_COUNTRY_CODE || '20');
  } catch(e){
    return '20';
  }
}

function normalizePhoneForWa(phone){
  return normalizeWaPhone(phone, getWaCountryCode());
}

/* ---------------- WhatsApp Notification Journal (duplicate-send protection) ---------------- */

function getWaNotificationLog(){
  if(Array.isArray(_waNotificationLog)) return _waNotificationLog;
  let list = [];
  try {
    const raw = localStorage.getItem(WA_NOTIFICATION_LOG_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if(Array.isArray(parsed)) list = parsed;
  } catch(e){ list = []; }
  _waNotificationLog = trimWaLog(list);
  return _waNotificationLog;
}

function saveWaNotificationLog(list){
  _waNotificationLog = trimWaLog(Array.isArray(list) ? list : []);
  try { localStorage.setItem(WA_NOTIFICATION_LOG_KEY, JSON.stringify(_waNotificationLog)); } catch(e){}
  return _waNotificationLog;
}

function recordWaNotification(entry){
  const log = getWaNotificationLog().slice();
  const normalized = makeWaLogEntry(entry);
  log.unshift(normalized);
  saveWaNotificationLog(log);
  return normalized;
}

function getLastWaNotificationFor(receiptId){
  return getLastWaNotification(getWaNotificationLog(), receiptId);
}

function wasReceiptNotifiedWithin(receiptId, days){
  return wasWaNotifiedWithin(getWaNotificationLog(), receiptId, days);
}

function getRecentlyNotifiedIds(days){
  return collectRecentlyNotifiedIds(getWaNotificationLog(), days, Date.now());
}

function formatWaLastNotificationLine(receiptId){
  const last = getLastWaNotificationFor(receiptId);
  if(!last) return '<span style="color:var(--ink-secondary);">لم يُرسَل أي إشعار واتساب لهذا الإيصال بعد</span>';
  const phone = last.phone ? ` • <span class="mono">${escapeHtml(last.phone)}</span>` : '';
  const who = last.user ? ` • بواسطة ${escapeHtml(last.user)}` : '';
  return `<span style="color:#047857;font-weight:700;">آخر إشعار: ${escapeHtml(last.label || getWaTemplateTitle(last.key))} — ${escapeHtml(formatWaElapsed(last.at))}</span>${phone}${who}`;
}

/* ---------------- Central WhatsApp Launcher ----------------
   Opening strategy (never loses the message):
   1) Electron desktop  -> secure main-process bridge (shell.openExternal)
   2) Web / PWA build   -> window.open while the user gesture is still active
   3) Blocked by policy -> manual fallback panel with the link + message to copy
   ---------------------------------------------------------- */

function showWaManualFallback(url, phone, msg, opts){
  const o = opts || {};
  const existing = document.getElementById('waManualFallbackOverlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'waManualFallbackOverlay';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:540px;padding:22px;border-radius:14px;max-height:92vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:12px;">
        <h3 style="margin:0;font-size:16px;display:flex;align-items:center;gap:7px;color:#b45309;">
          ${getSvgIcon('alert', 16)} <span>تعذّر فتح واتساب تلقائياً</span>
        </h3>
        <button class="btn btn-ghost btn-xs" id="closeWaFallback" style="font-size:16px;line-height:1;padding:4px 8px;">&times;</button>
      </div>

      <p style="font-size:12.5px;line-height:1.7;color:var(--ink);margin-bottom:10px;">
        قام نظام التشغيل أو المتصفح بمنع الفتح التلقائي للنافذة. لا تقلق — الرسالة محفوظة بالكامل:
        انسخ الرابط أو النص وأرسله يدوياً، ولم يضع شيء.
      </p>

      <div class="field" style="margin-bottom:10px;">
        <label style="font-size:11.5px;font-weight:700;">رقم واتساب العميل:</label>
        <input type="text" id="waFallbackPhone" class="mono" readonly value="${escapeHtml(phone || '')}">
      </div>

      <div class="field" style="margin-bottom:10px;">
        <label style="font-size:11.5px;font-weight:700;">رابط المحادثة الجاهز:</label>
        <input type="text" id="waFallbackUrl" class="mono" readonly value="${escapeHtml(url || '')}" style="direction:ltr;font-size:11px;">
      </div>

      <div class="field" style="margin-bottom:12px;">
        <label style="font-size:11.5px;font-weight:700;">نص الرسالة:</label>
        <textarea id="waFallbackMsg" rows="6" readonly style="font-size:12.5px;line-height:1.6;">${escapeHtml(msg || '')}</textarea>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);padding-top:12px;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn btn-ghost btn-sm" id="waFallbackCopyUrl">${getSvgIcon('copy', 13)} نسخ الرابط</button>
          <button class="btn btn-ghost btn-sm" id="waFallbackCopyMsg">${getSvgIcon('copy', 13)} نسخ النص</button>
        </div>
        <a href="${escapeHtml(url || '#')}" target="_blank" rel="noopener" class="btn btn-whatsapp btn-sm" id="waFallbackOpenLink" style="font-weight:700;text-decoration:none;">${WA_ICON} فتح الرابط الآن</a>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const copyValue = (value, okMsg) => {
    const done = () => showToast(okMsg, 'success');
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(value).then(done).catch(() => showToast('تعذر النسخ التلقائي', 'error'));
    } else {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch(e){ showToast('تعذر النسخ التلقائي', 'error'); }
      ta.remove();
    }
  };

  overlay.querySelector('#closeWaFallback').onclick = () => overlay.remove();
  overlay.querySelector('#waFallbackCopyUrl').onclick = () => copyValue(url || '', 'تم نسخ رابط المحادثة');
  overlay.querySelector('#waFallbackCopyMsg').onclick = () => copyValue(msg || '', 'تم نسخ نص الرسالة');
  overlay.querySelector('#waFallbackOpenLink').onclick = () => {
    if(o.receiptId){
      recordWaNotification({
        receiptId: o.receiptId,
        receiptNumber: o.receiptNumber,
        key: o.key,
        label: o.label,
        phone: phone,
        user: (state.user && state.user.name) || ''
      });
    }
    overlay.remove();
  };
  return overlay;
}

function openWhatsappChat(rawPhone, msg, opts){
  const o = opts || {};
  const normalized = normalizePhoneForWa(rawPhone);
  const url = buildWaUrl(rawPhone, msg, getWaCountryCode());

  if(!url){
    showToast('رقم هاتف العميل غير صالح لإرسال واتساب، يرجى مراجعة الرقم وكود الدولة', 'error');
    return { ok:false, reason:'invalid_phone' };
  }

  const finalize = (via) => {
    if(o.receiptId){
      recordWaNotification({
        receiptId: o.receiptId,
        receiptNumber: o.receiptNumber,
        key: o.key,
        label: o.label,
        phone: normalized,
        user: (state.user && state.user.name) || ''
      });
    }
    if(o.auditDetails){
      try { recordAuditLog('إرسال واتساب', o.auditSection || 'صيانة', o.auditDetails, o.receiptId); } catch(e){}
    }
    return { ok:true, via: via, url: url, phone: normalized };
  };

  // 1) Electron desktop bridge (most reliable, no popup blocking)
  const bridge = (typeof window !== 'undefined') ? window.electronAPI : null;
  if(bridge && typeof bridge.openExternal === 'function'){
    try {
      const res = bridge.openExternal(url);
      if(res && typeof res.then === 'function'){
        return res.then(ok => {
          if(ok) return finalize('desktop');
          showWaManualFallback(url, normalized, msg, o);
          return { ok:false, reason:'open_failed', url: url };
        }).catch(() => {
          showWaManualFallback(url, normalized, msg, o);
          return { ok:false, reason:'open_failed', url: url };
        });
      }
    } catch(e){ /* fall through to the browser path below */ }
  }

  // 2) Browser / PWA build — keep the click gesture so blockers stay quiet
  let win = null;
  try { win = window.open(url, '_blank', 'noopener'); } catch(e){ win = null; }
  if(win) return finalize('browser');

  // 3) Blocked: hand the operator a copyable fallback instead of losing the message
  showWaManualFallback(url, normalized, msg, o);
  return { ok:false, reason:'blocked', url: url };
}

/* Single source of truth: maps any receipt status / template alias to a template key */
function resolveWaTemplateKey(status){
  const s = String(status || '').trim();
  if(s === 'مكتمل' || s === 'done') return 'done';
  if(s === 'تم التسليم' || s === 'delivered') return 'delivered';
  if(s === 'الصيانة' || s === 'repair') return 'repair';
  if(s === 'قيد الفحص' || s === 'check') return 'check';
  if(s === 'بانتظار موافقة العميل' || s === 'await_approval') return 'await_approval';
  if(s === 'بانتظار قطعة غيار' || s === 'await_parts') return 'await_parts';
  if(s === 'overdue_reminder' || s === 'overdue' || s === 'متروكة') return 'overdue';
  if(s === 'unclaimed' || s === 'غير مطالب' || s === 'لم تطالب' || s === 'لم تُطالَب') return 'unclaimed';
  if(s === 'تعذرت الصيانة' || s === 'unrepairable') return 'unrepairable';
  if(s === 'رفض العميل' || s === 'rejected') return 'rejected';
  if(s === 'ملغي' || s === 'canceled' || s === 'cancelled') return 'canceled';
  if(s === 'intake' || s === 'استلام جديد' || s === 'استلام') return 'intake';
  if(s === 'معلق' || s === 'pending') return 'pending';
  if(s === 'ضمان' || s === 'تحت الضمان' || s === 'warranty') return 'warranty';
  if(DEFAULT_WA_TEMPLATES[s]) return s;
  return 'check';
}

function getStatusCustomMessage(rawR, status){
  const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
  const remaining = (typeof getReceiptRemaining === 'function') ? getReceiptRemaining(r) : Math.max(0, Number(r.cost||0)+Number(r.partsCost||0)+Number(r.otherAccountAmount||0)-Number(r.deposit||0)+Number(r.refunded||0));
  const shop = (state.settings && state.settings.shopName) || 'مركز الصيانة';
  const shopPhone = (state.settings && (state.settings.shopPhone || state.settings.phone)) || '';
  const shopAddress = (state.settings && (state.settings.shopAddress || state.settings.address)) || '';
  const devCat = (r.device && r.device.category) || 'جهاز';
  const devBrand = r.device ? (r.device.brand==='أخرى' ? r.device.brandOther : r.device.brand) : '';
  const devModel = (r.device && r.device.model) || '';
  const device = `${devCat} - ${devBrand} ${devModel}`.trim();
  const trackUrl = getReceiptTrackingUrl(r);
  const faultsStr = (Array.isArray(r.faults) ? r.faults.join('، ') : String(r.faults || '')) || r.faultNotes || '-';

  const key = resolveWaTemplateKey(status);

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
    .replace(/{cost}/g, ((typeof getReceiptTotalDue === 'function') ? getReceiptTotalDue(r) : (Number(r.cost||0)+Number(r.partsCost||0)+Number(r.otherAccountAmount||0))).toLocaleString())
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
  const key = resolveWaTemplateKey(status);
  sendWhatsapp(r, msg, key, getWaTemplateTitle(key));
}

function sendWhatsapp(rawR, msg, key, label){
  const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
  const rawPhone = (r.customer && r.customer.phone) || extractCustomerPhone(r);
  const resolvedKey = key || 'custom';
  const resolvedLabel = label || getWaTemplateTitle(resolvedKey);
  const cName = (r.customer && r.customer.name) || (typeof extractCustomerName === 'function' ? extractCustomerName(r) : '') || 'عميل';

  const res = openWhatsappChat(rawPhone, msg, {
    receiptId: r.id,
    receiptNumber: r.receiptNumber,
    key: resolvedKey,
    label: resolvedLabel,
    auditDetails: `تم إرسال إشعار واتساب [${resolvedKey}] للإيصال #${r.receiptNumber} للعميل (${cName})`
  });

  // On the desktop build the launcher resolves asynchronously through the IPC bridge
  if(res && typeof res.then === 'function'){
    res.then(outcome => {
      if(outcome && outcome.ok) showToast(`تم فتح واتساب لإرسال «${resolvedLabel}» للعميل`, 'success');
    });
  } else if(res && res.ok){
    showToast(`تم فتح واتساب لإرسال «${resolvedLabel}» للعميل`, 'success');
  }
  return res;
}

function openWhatsapp(r){ openWhatsappChoice(r); }

function openWhatsappStatusNotificationModal(rawR, statusOrKey, onSent){
  if(!rawR) return;
  const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
  
  if(statusOrKey === 'cost_estimate'){
    return openCostEstimateModal(r);
  }

  // Resolve initial key
  let currentKey = resolveWaTemplateKey(statusOrKey || r.status);

  const templateOptions = [
    { k: 'intake', icon: getSvgIcon('download', 14), label: 'استلام جديد' },
    { k: 'check', icon: getSvgIcon('search', 14), label: 'قيد الفحص' },
    { k: 'await_approval', icon: getSvgIcon('clock', 14), label: 'بانتظار الموافقة' },
    { k: 'repair', icon: getSvgIcon('tool', 14), label: 'الصيانة' },
    { k: 'await_parts', icon: getSvgIcon('tool', 14), label: 'بانتظار قطعة غيار' },
    { k: 'done', icon: getSvgIcon('check', 14), label: 'جاهز للاستلام' },
    { k: 'delivered', icon: getSvgIcon('truck', 14), label: 'تم التسليم' },
    { k: 'pending', icon: getSvgIcon('pause', 14), label: 'معلق' },
    { k: 'warranty', icon: getSvgIcon('shield', 14), label: 'تحت الضمان' },
    { k: 'overdue', icon: getSvgIcon('clock', 14), label: 'تذكير (+7 أيام)' },
    { k: 'unclaimed', icon: getSvgIcon('alert', 14), label: 'لم يُطالَب (+30 يوم)' },
    { k: 'unrepairable', icon: getSvgIcon('alert', 14), label: 'تعذر الإصلاح' },
    { k: 'rejected', icon: getSvgIcon('x', 14), label: 'رفض الصيانة' },
    { k: 'canceled', icon: getSvgIcon('x', 14), label: 'ملغي' }
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
        <div id="waLastNotifyLine" style="margin-top:6px;padding-top:6px;border-top:1px dashed var(--line);font-size:11.5px;">
          ${formatWaLastNotificationLine(r.id)}
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
    const trackUrl = getReceiptTrackingUrl(r);
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
      rawPhone = phoneInput.value.trim();
      try{ saveReceiptRemote(r); }catch(e){}
    }
    const finalMsg = msgTextarea.value;
    const label = getWaTemplateTitle(currentKey);
    const outcome = openWhatsappChat(rawPhone, finalMsg, {
      receiptId: r.id,
      receiptNumber: r.receiptNumber,
      key: currentKey,
      label: label,
      auditDetails: `تم إرسال إشعار واتساب [${currentKey}] للإيصال #${r.receiptNumber} للعميل (${(r.customer && r.customer.name) || cFullName})`
    });
    if(typeof onSent === 'function') onSent(finalMsg);

    const settle = (res) => {
      const lastLine = overlay.querySelector('#waLastNotifyLine');
      if(lastLine) lastLine.innerHTML = formatWaLastNotificationLine(r.id);
      if(!res) { overlay.remove(); return; }
      if(res.reason === 'invalid_phone') return; // Toast already shown — keep the modal open for correction
      if(res.ok) showToast(`تم فتح واتساب لإرسال «${label}» للعميل`, 'success');
      // 'blocked' shows the manual fallback panel, which replaces this modal
      overlay.remove();
    };

    if(outcome && typeof outcome.then === 'function') outcome.then(settle).catch(() => overlay.remove());
    else settle(outcome);
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

  /* Cooling-off window: never spam a customer who was already notified recently */
  const NOTIFY_COOLDOWN_DAYS = 3;
  let skipRecentlyNotified = true;

  function getRecentlyNotifiedSet(){
    return new Set(getRecentlyNotifiedIds(NOTIFY_COOLDOWN_DAYS));
  }

  function getDispatchList(){
    const list = getOverdueList();
    if(!skipRecentlyNotified) return list;
    const recent = getRecentlyNotifiedSet();
    return list.filter(r => !recent.has(String(r.id)));
  }

  /* Reminder-status cell renderer (also used to refresh one row in place during bulk dispatch) */
  function renderNotifyStatus(receiptId, recentSet){
    const last = getLastWaNotificationFor(receiptId);
    if(!last) return '<span style="font-size:11px;color:var(--ink-secondary);">لم يُذكَّر بعد</span>';
    const notifiedRecently = recentSet ? recentSet.has(String(receiptId)) : wasReceiptNotifiedWithin(receiptId, NOTIFY_COOLDOWN_DAYS);
    return `<span class="badge ${notifiedRecently ? 'badge-amber' : ''}" style="font-size:10.5px;${notifiedRecently ? '' : 'background:var(--paper2);color:var(--ink-secondary);'}" title="${escapeHtml(last.label || '')} — ${escapeHtml(last.at)}">${notifiedRecently ? 'تم تذكيره ' : ''}${escapeHtml(formatWaElapsed(last.at))}</span>`;
  }

  let overdue = getDispatchList();
  let selectedIds = new Set(overdue.map(r => r.id));

  function renderContent(){
    overdue = getDispatchList();
    const recentSet = getRecentlyNotifiedSet();
    const skippedCount = skipRecentlyNotified ? (getOverdueList().length - overdue.length) : 0;
    const totalRemaining = overdue.filter(r => selectedIds.has(r.id)).reduce((sum, r) => {
      const rem = (typeof getReceiptRemaining === 'function') ? getReceiptRemaining(r) : Math.max(0, Number(r.cost||0)+Number(r.partsCost||0)+Number(r.otherAccountAmount||0)-Number(r.deposit||0)+Number(r.refunded||0));
      return sum + rem;
    }, 0);

    overlay.innerHTML = `
      <div class="modal-content" style="max-width:760px;max-height:92vh;overflow-y:auto;padding:22px;border-radius:14px;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:14px;">
          <div>
            <h3 style="margin:0;font-size:17px;display:flex;align-items:center;gap:7px;color:${daysThreshold>=30?'#b45309':'#d97706'};">
              ${WA_ICON} <span>${daysThreshold>=30 ? 'إرسال إشعارات واتساب للأجهزة غير المطالب بها (+30 يوم)' : 'إرسال تذكيرات واتساب للأجهزة المتروكة (+7 أيام)'}</span>
            </h3>
            <p style="margin:4px 0 0 0;font-size:12px;color:var(--ink-secondary);">${daysThreshold>=30 ? 'إشعار نهائي للعملاء بالاستلام وسداد المستحقات قبل تطبيق سياسة الأجهزة المهملة' : 'تذكير العملاء باستلام أجهزتهم الجاهزة والمكتملة وسداد المستحقات المتبقية'}</p>
          </div>
          <button class="btn btn-ghost btn-xs" id="closeBulkOverdueModal" style="font-size:16px;line-height:1;padding:4px 8px;" aria-label="إغلاق">&times;</button>
        </div>

        <!-- Filter Pills & Summary -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
            <span style="font-size:12px;font-weight:700;">فترة الانتظار:</span>
            <button type="button" class="btn btn-xs ${daysThreshold===3?'btn-primary':'btn-ghost'}" id="filterDays3Btn">أكثر من 3 أيام</button>
            <button type="button" class="btn btn-xs ${daysThreshold===7?'btn-primary':'btn-ghost'}" id="filterDays7Btn">أكثر من 7 أيام (أسبوع)</button>
            <button type="button" class="btn btn-xs ${daysThreshold===14?'btn-primary':'btn-ghost'}" id="filterDays14Btn">أكثر من 14 يوم (أسبوعين)</button>
            <button type="button" class="btn btn-xs ${daysThreshold===30?'btn-primary':'btn-ghost'}" id="filterDays30Btn" style="${daysThreshold===30?'background:#b45309;border-color:#b45309;':''}">أكثر من 30 يوم (شهر)</button>
          </div>
          <label style="display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;color:var(--ink);margin:0;cursor:pointer;background:var(--paper2);padding:4px 9px;border-radius:6px;border:1px solid var(--line);" title="حماية العميل من تكرار الرسائل خلال فترة قصيرة">
            <input type="checkbox" id="skipRecentlyNotifiedChk" ${skipRecentlyNotified?'checked':''} style="width:auto;">
            استبعاد من تم تذكيرهم خلال ${NOTIFY_COOLDOWN_DAYS} أيام
          </label>
          <div style="font-size:12.5px;background:var(--amber-bg);color:var(--amber-text);padding:4px 10px;border-radius:6px;font-weight:700;">
            ${overdue.length} أجهزة متأخرة${skippedCount > 0 ? ` (استُبعد ${skippedCount} لتنبيه سابق)` : ''} | ${selectedIds.size} محددة (${totalRemaining.toLocaleString()} ج.م متبقي)
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
                <th style="padding:8px 10px;">حالة التذكير</th>
                <th style="padding:8px 10px;text-align:center;">إجراء مباشر</th>
              </tr>
            </thead>
            <tbody>
              ${overdue.length === 0 ? `
                <tr><td colspan="8" style="text-align:center;padding:24px;color:var(--ink-secondary);">لا توجد أجهزة مكتملة متأخرة تتوافق مع هذه المدة${skippedCount > 0 ? ' (تم استبعاد ' + skippedCount + ' جهاز لتنبيه سابق)' : ''}.</td></tr>
              ` : overdue.map(r => {
                const rem = (typeof getReceiptRemaining === 'function') ? getReceiptRemaining(r) : Math.max(0, Number(r.cost||0)+Number(r.partsCost||0)+Number(r.otherAccountAmount||0)-Number(r.deposit||0)+Number(r.refunded||0));
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
                    <td style="padding:8px 10px;" data-notify-cell="${r.id}">
                      ${renderNotifyStatus(r.id, recentSet)}
                    </td>
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
    const d30 = overlay.querySelector('#filterDays30Btn');
    const applyDays = (days) => { daysThreshold = days; selectedIds = new Set(getDispatchList().map(x=>x.id)); renderContent(); };
    if(d3) d3.onclick = () => applyDays(3);
    if(d7) d7.onclick = () => applyDays(7);
    if(d14) d14.onclick = () => applyDays(14);
    if(d30) d30.onclick = () => applyDays(30);

    const cooldownChk = overlay.querySelector('#skipRecentlyNotifiedChk');
    if(cooldownChk){
      cooldownChk.onchange = () => {
        skipRecentlyNotified = cooldownChk.checked;
        selectedIds = new Set(getDispatchList().map(x=>x.id));
        renderContent();
      };
    }

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
        if(r) openWhatsappStatusNotificationModal(r, daysThreshold >= 30 ? 'unclaimed' : 'overdue');
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
          const runnerKey = daysThreshold >= 30 ? 'unclaimed' : 'overdue';
          const msg = getStatusCustomMessage(cur, runnerKey);
          sendWhatsapp(cur, msg, runnerKey, getWaTemplateTitle(runnerKey));
          // Refresh only this row's reminder-status cell (full re-render would reset the runner bar)
          const cell = overlay.querySelector(`[data-notify-cell="${cur.id}"]`);
          if(cell) cell.innerHTML = renderNotifyStatus(cur.id);
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
  const trackUrl = getReceiptTrackingUrl(r);
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
    sendWhatsapp(r, msg, 'cost_estimate', getWaTemplateTitle('cost_estimate'));
  };

  // Approve Customer Decision
  const approveBtn = overlay.querySelector('#btnApproveQuote');
  if(approveBtn){
    approveBtn.onclick = async ()=>{
      const vals = getVals();
      const ok = await openConfirmModal({
        title: 'تسجيل موافقة العميل',
        message: `هل أنت متأكد من تسجيل موافقة العميل على الصيانة؟\n\n- تكلفة الصيانة: ${vals.cost} ج.م\n- العربون: ${vals.deposit} ج.م\n- المتبقي: ${Math.max(0, vals.cost - vals.deposit)} ج.م\n\nسيتم تحويل حالة الجهاز إلى "الصيانة" وبدء العمل فوراً.`,
        confirmText: 'تأكيد الموافقة',
        confirmClass: 'btn-success',
        icon: 'check'
      });
      if(!ok) return;

      r.cost = vals.cost;
      r.deposit = vals.deposit;
      r.inspectionFee = vals.inspectionFee;
      r.estimateTime = vals.estimateTime;
      r.warranty = vals.warranty;
      if(vals.faultsReport){
        r.faultNotes = vals.faultsReport;
      }
      r.status = 'الصيانة';
      r.customerApproval = {
        approved: true,
        approverName: (r.customer && r.customer.name) || extractCustomerName(r) || 'العميل',
        channel: 'اعتماد مقايسة النظام (واتساب)',
        approvedCost: vals.cost,
        approvedAt: new Date().toISOString(),
        recordedBy: (state.user && state.user.name) || 'نظام',
        notes: vals.faultsReport || 'تم اعتماد المقايسة والتكلفة عبر نافذة مقايسة النظام'
      };
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
      const ok = await openConfirmModal({
        title: 'تسجيل رفض العميل',
        message: `هل أنت متأكد من تسجيل رفض العميل للصيانة؟\n\n- سيتم إعفاء العميل من أي تكاليف صيانة أو قطع غيار.\n- سيتم احتساب رسوم فحص وتشخيص العطل المعتمدة (${vals.inspectionFee} ج.م) فقط.\n- سيتم تحويل حالة الجهاز إلى "رفض العميل".`,
        confirmText: 'تأكيد الرفض',
        confirmClass: 'btn-danger',
        icon: 'alertTriangle'
      });
      if(!ok) return;

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
