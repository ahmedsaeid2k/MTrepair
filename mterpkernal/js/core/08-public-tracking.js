/* ---------------- Check URL for Public Customer Tracking ---------------- */
function checkCustomerTrackingURL(){
  const params = new URLSearchParams(window.location.search);
  const hasTrackParam = params.has('track') || params.has('r');
  const trackNum = hasTrackParam ? (params.get('track') != null ? params.get('track') : params.get('r')) : null;
  const hash = window.location.hash || '';
  const hashTrackMatch = hash.match(/^#(?:track|r)(?:\/(.*))?$/i);
  const hashNum = hashTrackMatch ? (hashTrackMatch[1] ? decodeURIComponent(hashTrackMatch[1]).trim() : '') : null;

  if(hasTrackParam || hashNum != null){
    renderPublicTrackingPortal(trackNum != null ? trackNum : (hashNum || ''));
    return true;
  }
  return false;
}

// Support browser back/forward and hash navigation for live tracking
window.addEventListener('hashchange', () => {
  const hash = window.location.hash || '';
  const hashTrackMatch = hash.match(/^#(?:track|r)(?:\/(.*))?$/i);
  if(hashTrackMatch){
    const num = hashTrackMatch[1] ? decodeURIComponent(hashTrackMatch[1]).trim() : '';
    renderPublicTrackingPortal(num);
  }
});

async function renderPublicTrackingPortal(receiptNum = ''){
  const app = document.getElementById('app');
  if(!app) return;

  document.body.classList.remove('printing-tracking-portal');

  const shopSettings = state.settings || getCache('settings', {}) || {};
  const shopName = escapeHtml(String(shopSettings.shopName || 'ميكروتك للصيانة الذكية'));
  const shopPhone = escapeHtml(String(shopSettings.shopPhone != null ? shopSettings.shopPhone : (shopSettings.phone || '')));
  const shopAddress = escapeHtml(String(shopSettings.shopAddress || ''));
  const logoUrl = shopSettings.logoUrl || '';
  const rawWaPhone = String(shopSettings.shopPhone != null ? shopSettings.shopPhone : (shopSettings.phone || '201000000000')).replace(/[^0-9]/g, '');
  const waPhone = rawWaPhone.startsWith('01') ? ('2' + rawWaPhone) : (rawWaPhone || '201000000000');

  const cleanQuery = String(receiptNum || '').trim();

  // Reusable Center Brand Header
  const brandHeaderHtml = `
    <div style="text-align:center;border-bottom:1px solid var(--line);padding-bottom:16px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:6px;flex-wrap:wrap;">
        ${logoUrl ? `<img src="${logoUrl}" style="max-height:42px;max-width:140px;object-fit:contain;" alt="${shopName}">` : '<div style="font-size:32px;">⚡</div>'}
        <div style="text-align:right;">
          <h2 style="margin:0;font-size:18px;font-weight:900;color:var(--ink);">${shopName}</h2>
          <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
            <span class="badge" style="background:rgba(16,185,129,0.12);color:var(--green);font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:12px;">🏢 مركز صيانة معتمد</span>
            ${shopPhone ? `<span style="font-size:11px;color:var(--ink-secondary);"><span class="mono">${shopPhone}</span> 📞</span>` : ''}
          </div>
        </div>
      </div>
      <div style="font-size:12px;color:var(--ink-secondary);margin-top:6px;">
        بوابة المتابعة اللحظية المباشرة لحالة أجهزة الصيانة 🔍
      </div>
    </div>
  `;

  // 1. If NO QUERY: Render Public Search Landing Page
  if(!cleanQuery){
    app.innerHTML = `
      <div class="tracking-container">
        <div class="tracking-card">
          ${brandHeaderHtml}

          <div style="text-align:center;padding:10px 0 20px;">
            <div style="font-size:46px;margin-bottom:12px;">📱💻</div>
            <h3 style="margin:0 0 6px 0;font-size:16px;color:var(--ink);">تابع حالة صيانة جهازك مباشرة</h3>
            <p style="font-size:12.5px;color:var(--ink-secondary);max-width:440px;margin:0 auto 20px;line-height:1.6;">
              أدخل رقم إيصال الصيانة أو رقم هاتفك المسجل لمعرفة تفاصيل الفحص وتكلفة الصيانة وموعد الاستلام اللحظي.
            </p>

            <form id="trackingSearchForm" style="display:flex;gap:8px;max-width:480px;margin:0 auto;flex-wrap:wrap;" onsubmit="return false;">
              <input type="text" id="trackSearchInput" class="input" placeholder="رقم الإيصال (مثال: MT-2026-0001) أو رقم الهاتف..." style="flex:1;min-width:220px;padding:10px 14px;font-size:13px;border-radius:var(--radius-sm);border:1.5px solid var(--line-strong);" autofocus>
              <button type="submit" id="trackSearchBtn" class="btn btn-primary" style="padding:10px 20px;font-weight:800;border-radius:var(--radius-sm);font-size:13px;">🔍 تتبع الجهاز</button>
            </form>
          </div>

          <div style="background:var(--paper3);border-radius:var(--radius-sm);padding:14px;border:1px dashed var(--line);margin:16px 0;font-size:12px;line-height:1.7;color:var(--ink-secondary);">
            <b style="color:var(--ink);">💡 أين تجد رقم الإيصال؟</b><br>
            • في الجزء العلوي من إيصال الاستلام الورقي المختوم المسلم لحضرتكم.<br>
            • في رسالة الواتساب الترحيبية المرسلة من المركز عند إيداع الجهاز.
          </div>

          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px;" class="tracking-no-print">
            <a href="https://wa.me/${waPhone}?text=${encodeURIComponent('السلام عليكم، أود الاستفسار عن حالة جهازي في المركز')}" target="_blank" class="btn btn-whatsapp btn-sm">${WA_ICON} تواصل مع خدمة العملاء</a>
            ${shopPhone ? `<a href="tel:${shopPhone}" class="btn btn-ghost btn-sm" style="border:1px solid var(--line);">📞 اتصال هاتفي</a>` : ''}
            <a href="${window.location.pathname}" class="btn btn-ghost btn-sm" style="color:var(--ink-secondary);">🔒 دخول الموظفين</a>
          </div>
        </div>
      </div>
    `;

    const form = document.getElementById('trackingSearchForm');
    const input = document.getElementById('trackSearchInput');
    if(form && input){
      form.onsubmit = () => {
        const val = input.value.trim();
        if(!val){
          input.focus();
          return;
        }
        renderPublicTrackingPortal(val);
      };
    }
    return;
  }

  // 2. SEARCH & FETCH
  app.innerHTML = `
    <div class="tracking-container">
      <div class="tracking-card" style="text-align:center;padding:40px 20px;">
        <div class="spinner" style="margin:0 auto 16px;width:32px;height:32px;"></div>
        <h3 style="font-size:15px;margin:0 0 6px 0;">جارٍ استرجاع بيانات الصيانة والفحص...</h3>
        <div style="font-size:12px;color:var(--ink-secondary);">رقم البحث: <b class="mono">${escapeHtml(cleanQuery)}</b></div>
      </div>
    </div>
  `;

  let r = null;
  let candidateList = [];

  // 1. Check local memory / cache first for instant 0ms response
  const localReceipts = (Array.isArray(state.receipts) && state.receipts.length)
    ? state.receipts
    : (getCache('receipts', []) || []);

  if(localReceipts.length){
    const matchNum = localReceipts.find(x => String(x.receiptNumber || '').trim().toLowerCase() === cleanQuery.toLowerCase());
    if(matchNum){
      r = (typeof normalizeReceipt === 'function') ? normalizeReceipt(matchNum) : matchNum;
    } else {
      const cleanPhoneDigits = cleanQuery.replace(/[^0-9]/g, '');
      if(cleanPhoneDigits.length >= 7){
        candidateList = localReceipts.filter(x => {
          const p = String(x.customer?.phone || x.CustomerPhone || '').replace(/[^0-9]/g, '');
          return p && p.includes(cleanPhoneDigits);
        });
        if(candidateList.length === 1){
          r = (typeof normalizeReceipt === 'function') ? normalizeReceipt(candidateList[0]) : candidateList[0];
        }
      }
    }
  }

  // 2. If not found locally and online, attempt remote API with a 3.5s timeout
  if(!r && !candidateList.length && navigator.onLine){
    try{
      const fetchPromise = apiGet('trackReceipt', { receiptNumber: cleanQuery });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3500));
      const res = await Promise.race([fetchPromise, timeoutPromise]);
      if(res && res.found && res.receipt){
        r = res.receipt;
      }
    }catch(e){
      console.warn('trackReceipt remote query skipped or timed out:', e);
    }
  }

  // If MULTIPLE RECEIPTS matched by phone number:
  if(!r && candidateList.length > 1){
    app.innerHTML = `
      <div class="tracking-container">
        <div class="tracking-card">
          ${brandHeaderHtml}
          
          <div style="margin-bottom:16px;">
            <h3 style="margin:0 0 4px 0;font-size:15px;">📋 تم العثور على (${candidateList.length}) أجهزة صيانة مسجلة</h3>
            <div style="font-size:12px;color:var(--ink-secondary);">المرتبطة بالرقم: <b class="mono">${escapeHtml(cleanQuery)}</b>. اختر الجهاز لمتابعة حالته:</div>
          </div>

          <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
            ${candidateList.map(item => {
              const devName = `${(item.device?.category||'جهاز')} ${(item.device?.brand||'')} ${(item.device?.model||'')}`.trim();
              const st = item.status || 'قيد الفحص';
              const stInfo = STATUSES.find(s => s.v === st) || { cls: 'st-check', icon: '🔍' };
              return `
                <div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:var(--paper2);border:1px solid var(--line);border-radius:var(--radius-sm);cursor:pointer;transition:transform 0.15s ease;" onclick="renderPublicTrackingPortal('${escapeHtml(item.receiptNumber)}')">
                  <div>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <b class="mono" style="font-size:13px;color:var(--primary);">#${escapeHtml(item.receiptNumber)}</b>
                      <span class="badge ${stInfo.cls}" style="font-size:10.5px;">${stInfo.icon} ${escapeHtml(st)}</span>
                    </div>
                    <div style="font-weight:700;font-size:12.5px;margin-top:2px;color:var(--ink);">${escapeHtml(devName || 'جهاز صيانة')}</div>
                    <div style="font-size:11px;color:var(--ink-secondary);margin-top:1px;">تاريخ الاستلام: ${cleanDate(item.date)}</div>
                  </div>
                  <button type="button" class="btn btn-primary btn-xs" style="font-weight:800;">عرض المتابعة ←</button>
                </div>
              `;
            }).join('')}
          </div>

          <div style="text-align:center;">
            <button type="button" class="btn btn-ghost btn-sm" onclick="renderPublicTrackingPortal('')">🔍 بحث برقم آخر</button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // If NOT FOUND
  if(!r){
    app.innerHTML = `
      <div class="tracking-container">
        <div class="tracking-card" style="text-align:center;">
          ${brandHeaderHtml}

          <div style="font-size:48px;margin-bottom:12px;">🔍⚠️</div>
          <h2 style="margin:0 0 6px 0;font-size:17px;color:var(--ink);">لم نتمكن من العثور على الإيصال</h2>
          <p style="font-size:12.5px;color:var(--ink-secondary);max-width:440px;margin:0 auto 18px;line-height:1.6;">
            تأكد من كتابة رقم الإيصال بدقة (مثال: <b class="mono">MT-2026-0001</b>) أو رقم الهاتف المسجل عند تسليم الجهاز.
          </p>

          <form id="trackingNotFoundForm" style="display:flex;gap:8px;max-width:420px;margin:0 auto 20px;flex-wrap:wrap;" onsubmit="return false;">
            <input type="text" id="trackNotFoundInput" value="${escapeHtml(cleanQuery)}" class="input" placeholder="رقم الإيصال أو الهاتف..." style="flex:1;min-width:200px;padding:9px 12px;font-size:13px;border-radius:var(--radius-sm);border:1.5px solid var(--line-strong);">
            <button type="submit" class="btn btn-primary" style="padding:9px 16px;font-weight:800;border-radius:var(--radius-sm);">🔍 إعادة البحث</button>
          </form>

          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:16px;">
            <a href="https://wa.me/${waPhone}?text=${encodeURIComponent('السلام عليكم، لم أجد إيصال الصيانة رقم: ' + cleanQuery + '، أرجو المساعدة')}" target="_blank" class="btn btn-whatsapp btn-sm">${WA_ICON} مساعدة عبر واتساب</a>
            <a href="${window.location.pathname}" class="btn btn-ghost btn-sm">🔒 دخول الموظفين</a>
          </div>
        </div>
      </div>
    `;
    const nfForm = document.getElementById('trackingNotFoundForm');
    const nfInput = document.getElementById('trackNotFoundInput');
    if(nfForm && nfInput){
      nfForm.onsubmit = () => {
        const val = nfInput.value.trim();
        if(val) renderPublicTrackingPortal(val);
      };
    }
    return;
  }

  // 3. NORMALIZE FOUND RECEIPT DETAILS
  const rNum = escapeHtml(String(r.receiptNumber || ''));
  const rawCustName = (r.customer && r.customer.name) || extractCustomerName(r) || '';
  const custName = escapeHtml(rawCustName || 'عميل كريم');
  const rawPhone = String(r.customer?.phone || r.CustomerPhone || '').trim();
  const maskedPhone = rawPhone.length > 6 ? (rawPhone.substring(0, 3) + '****' + rawPhone.slice(-4)) : rawPhone;

  const dCat = escapeHtml((r.device && r.device.category) || 'جهاز');
  const dBrand = escapeHtml(r.device ? (r.device.brand === 'أخرى' ? (r.device.brandOther || '') : (r.device.brand || '')) : '');
  const dModel = escapeHtml((r.device && r.device.model) || '');
  const dAcc = escapeHtml((r.device && r.device.accessories) || 'بدون ملحقات');
  const faultsText = escapeHtml(Array.isArray(r.faults) ? r.faults.join('، ') : (r.faults || '-'));
  const faultNotes = escapeHtml(r.faultNotes || '');
  const delDate = escapeHtml(cleanDate(r.deliveryDate) || 'قيد التحديد');
  const rDate = cleanDate(r.date);
  const rTime = r.time ? cleanTime(r.time) : '';

  const cost = Number(r.cost || 0);
  const partsCost = Number(r.partsCost || 0);
  const otherAmount = Number(r.otherAccountAmount || 0);
  const totalCost = cost + partsCost + otherAmount;
  const deposit = Number(r.deposit || 0);
  const refunded = Number(r.refunded || 0);
  const remaining = Math.max(0, totalCost - deposit + refunded);
  const isPaid = (totalCost > 0 && remaining <= 0) || !!r.paid;

  const status = r.status || 'قيد الفحص';
  const isDelivered = status === 'تم التسليم';
  const isDone = status === 'مكتمل' || isDelivered;
  const isRepair = status === 'الصيانة';
  const isCheck = status === 'قيد الفحص';
  const isPending = status === 'معلق';
  const isRejected = status === 'مرفوض';
  const isWarranty = status === 'ضمان';

  // Status explanation messaging
  let statusBanner = {
    bg: '#eff6ff',
    border: '#bfdbfe',
    color: '#1d4ed8',
    icon: '🔍',
    title: 'الجهاز قيد الفحص والتشخيص الفني',
    desc: 'يقوم مهندس الصيانة حالياً بفحص الجهاز والدوائر الإلكترونية لتشخيص العطل بدقة وتقدير التكلفة المطلوبة.'
  };

  if(isDone && !isDelivered){
    statusBanner = {
      bg: '#ecfdf5',
      border: '#a7f3d0',
      color: '#047857',
      icon: '🎉',
      title: 'تم الانتهاء من الصيانة والجهاز جاهز للاستلام!',
      desc: 'تم إصلاح جهازكم واجتياز اختبارات الجودة بنجاح. نتشرف بزيارتكم للمركز لاستلام الجهاز.'
    };
  } else if(isDelivered){
    statusBanner = {
      bg: '#f8fafc',
      border: '#cbd5e1',
      color: '#334155',
      icon: '🤝',
      title: 'تم تسليم الجهاز بنجاح للعميل',
      desc: 'تم تسليم الجهاز وإغلاق دورة الصيانة. شكراً لثقتكم بخدمات مركزنا، ويسعدنا دائماً خدمتكم.'
    };
  } else if(isRepair){
    statusBanner = {
      bg: '#eff6ff',
      border: '#93c5fd',
      color: '#1e40af',
      icon: '🛠️',
      title: 'جاري العمل والصيانة الفنية للجهاز',
      desc: 'الجهاز حالياً في مرحلة الإصلاح وتغيير قطع الغيار اللازمة على طاولة الفني المختص.'
    };
  } else if(isPending){
    statusBanner = {
      bg: '#fffbeb',
      border: '#fde68a',
      color: '#b45309',
      icon: '⏸️',
      title: 'صيانة الجهاز معلقة مؤقتاً',
      desc: 'الصيانة معلقة بانتظار موافقة العميل على مقايسة التكلفة أو وصول قطع غيار أصلية مطلوبة.'
    };
  } else if(isRejected){
    statusBanner = {
      bg: '#fef2f2',
      border: '#fecaca',
      color: '#b91c1c',
      icon: '❌',
      title: 'تم الاعتذار عن الإصلاح / تعذر الصيانة',
      desc: 'تعذر إتمام الصيانة لعدم جدوى الإصلاح أو عدم توفر القطع. الجهاز متاح للاستلام بالفرع.'
    };
  } else if(isWarranty){
    statusBanner = {
      bg: '#ecfeff',
      border: '#a5f3fc',
      color: '#0e7490',
      icon: '🛡️',
      title: 'صيانة مجانية تحت مظلة الضمان المعتمد',
      desc: 'الجهاز يخضع للفحص والدعم الفني ضمن فترة الضمان الرسمية الممنوحة من المركز.'
    };
  }

  // Photos
  const photosList = Array.isArray(r.photos) && r.photos.length 
    ? r.photos 
    : (Array.isArray(r.devices) ? r.devices.flatMap(d => d.photos || []) : []);

  // Multi-devices
  const hasMultipleDevices = Array.isArray(r.devices) && r.devices.length > 1;

  app.innerHTML = `
    <div class="tracking-container">
      <div class="tracking-card">
        ${brandHeaderHtml}

        <!-- Top Ticket Meta Bar -->
        <div style="display:flex;justify-content:space-between;align-items:center;background:var(--paper2);padding:10px 14px;border-radius:var(--radius-sm);border:1px solid var(--line);margin-bottom:16px;flex-wrap:wrap;gap:8px;">
          <div>
            <div style="font-size:11px;color:var(--ink-secondary);">رقم إيصال الصيانة المعتمد</div>
            <b class="mono" style="font-size:16px;color:var(--primary);font-weight:900;">#${rNum}</b>
          </div>
          <div style="text-align:left;">
            <div style="font-size:11px;color:var(--ink-secondary);">تاريخ الاستلام</div>
            <div style="font-size:12px;font-weight:700;color:var(--ink);">${rDate} ${rTime ? '⏰ '+rTime : ''}</div>
          </div>
        </div>

        <!-- Dynamic Status Banner -->
        <div style="background:${statusBanner.bg};border:1.5px solid ${statusBanner.border};border-radius:var(--radius-sm);padding:14px;margin-bottom:20px;display:flex;gap:12px;align-items:flex-start;">
          <div style="font-size:26px;line-height:1;">${statusBanner.icon}</div>
          <div style="flex:1;">
            <div style="font-weight:900;font-size:14px;color:${statusBanner.color};margin-bottom:3px;">
              ${statusBanner.title}
            </div>
            <div style="font-size:12px;color:var(--ink-secondary);line-height:1.5;">
              ${statusBanner.desc}
            </div>
          </div>
        </div>

        <!-- 5-Step Process Timeline -->
        <div style="margin:24px 0 28px;">
          <div style="font-size:12px;font-weight:800;color:var(--ink);margin-bottom:8px;display:flex;justify-content:space-between;">
            <span>مراحل دورة الصيانة المعتمدة</span>
            <span style="color:var(--primary);font-weight:900;">${isDelivered ? '100%' : (isDone ? '85%' : (isRepair ? '60%' : (isCheck ? '25%' : '15%')))}</span>
          </div>

          <div class="tracking-timeline">
            <!-- Step 1: Intake -->
            <div class="timeline-step done">
              <div class="timeline-node">✓</div>
              <div class="timeline-title">الاستلام والتوثيق</div>
            </div>
            <!-- Step 2: Diagnostics -->
            <div class="timeline-step ${isCheck ? 'active' : (isRepair || isDone ? 'done' : (isPending ? 'alert' : ''))}">
              <div class="timeline-node">${(isRepair || isDone) ? '✓' : (isCheck ? '🔍' : (isPending ? '⏸️' : '2'))}</div>
              <div class="timeline-title">الفحص والتشخيص</div>
            </div>
            <!-- Step 3: Repair -->
            <div class="timeline-step ${isRepair ? 'active' : (isDone ? 'done' : '')}">
              <div class="timeline-node">${isDone ? '✓' : (isRepair ? '🛠️' : '3')}</div>
              <div class="timeline-title">أعمال الصيانة</div>
            </div>
            <!-- Step 4: Quality Check & Ready -->
            <div class="timeline-step ${(status === 'مكتمل') ? 'active' : (isDelivered ? 'done' : '')}">
              <div class="timeline-node">${isDelivered ? '✓' : ((status === 'مكتمل') ? '🎉' : '4')}</div>
              <div class="timeline-title">جاهز للاستلام</div>
            </div>
            <!-- Step 5: Delivered -->
            <div class="timeline-step ${isDelivered ? 'active done' : ''}">
              <div class="timeline-node">${isDelivered ? '🤝' : '5'}</div>
              <div class="timeline-title">تم التسليم</div>
            </div>
          </div>
        </div>

        <!-- Device & Inspection Details Card -->
        <div class="card" style="background:var(--paper3);border-radius:var(--radius-sm);padding:14px;border:1px solid var(--line);margin-bottom:16px;">
          <h4 style="margin:0 0 10px 0;font-size:13.5px;display:flex;align-items:center;gap:6px;color:var(--ink);">
            <span>💻</span>
            <span>بيانات الجهاز والأعطال المسجلة</span>
          </h4>

          ${hasMultipleDevices ? `
            <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:8px;">
              ${r.devices.map((dv, idx) => `
                <div style="background:var(--paper);padding:8px 10px;border-radius:var(--radius-xs);border:1px solid var(--line);font-size:12px;">
                  <b style="color:var(--primary);">جهاز ${idx+1}:</b> ${escapeHtml(dv.category || 'جهاز')} ${escapeHtml(dv.brand === 'أخرى' ? dv.brandOther : dv.brand)} ${escapeHtml(dv.model || '')}
                  <div style="color:var(--ink-secondary);font-size:11px;margin-top:2px;">العطل: ${escapeHtml((Array.isArray(dv.faults) ? dv.faults.join('، ') : dv.faults) || '-')} ${dv.faultNotes ? `(${escapeHtml(dv.faultNotes)})` : ''}</div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px;margin-bottom:8px;">
              <div><b>👤 صاحب الجهاز:</b> ${custName}</div>
              <div><b>📱 رقم الهاتف:</b> <span class="mono">${maskedPhone || '-'}</span></div>
              <div><b>💻 الجهاز:</b> ${dCat} - ${dBrand} ${dModel}</div>
              <div><b>🔌 الملحقات:</b> ${dAcc}</div>
            </div>
            <div style="font-size:12px;border-top:1px dashed var(--line);padding-top:8px;margin-top:4px;">
              <b>⚠️ الأعطال المبلغ عنها:</b> <span style="color:var(--ink);">${faultsText}</span>
              ${faultNotes ? `<div style="font-size:11.5px;color:var(--ink-secondary);margin-top:3px;"><b>ملاحظات الفحص:</b> ${faultNotes}</div>` : ''}
            </div>
          `}

          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:8px;border-top:1px solid var(--line);font-size:11.5px;">
            <span><b>📅 موعد التسليم المتوقع:</b> <b style="color:var(--primary);">${delDate}</b></span>
            <span><b>🏢 الفرع المستلم:</b> ${shopAddress || shopName}</span>
          </div>
        </div>

        <!-- Documented Photos Gallery (صور توثيق الجهاز عند الاستلام والتسليم) -->
        ${photosList.length > 0 ? `
          <div class="card" style="background:var(--paper3);border-radius:var(--radius-sm);padding:14px;border:1px solid var(--line);margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <h4 style="margin:0;font-size:13.5px;display:flex;align-items:center;gap:6px;color:var(--ink);">
                <span>📷</span>
                <span>توثيق صور وفحص الجهاز (${photosList.length} صور)</span>
              </h4>
              <span style="font-size:11px;color:var(--ink-secondary);">اضغط على أي صورة لتكبيرها وفحصها 🔍</span>
            </div>

            <div id="publicTrackingPhotosGrid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(110px, 1fr));gap:8px;">
            </div>
          </div>
        ` : ''}

        <!-- Itemized Services & Financial Box -->
        <div class="card" style="background:var(--paper3);border-radius:var(--radius-sm);padding:14px;border:1px solid var(--line);margin-bottom:20px;">
          <h4 style="margin:0 0 10px 0;font-size:13.5px;display:flex;align-items:center;gap:6px;color:var(--ink);">
            <span>🧾</span>
            <span>المقايسة وتفاصيل الحساب المالي</span>
          </h4>

          ${(Array.isArray(r.serviceItems) && r.serviceItems.length > 0) ? `
            <div style="margin-bottom:12px;border:1px solid var(--line);border-radius:var(--radius-xs);overflow:hidden;background:var(--paper);">
              <table style="width:100%;border-collapse:collapse;font-size:11.5px;">
                <thead>
                  <tr style="background:var(--paper2);border-bottom:1px solid var(--line);color:var(--ink-secondary);">
                    <th style="padding:6px 10px;text-align:right;">بند الصيانة / الخدمة</th>
                    <th style="padding:6px 10px;text-align:left;width:80px;">السعر</th>
                  </tr>
                </thead>
                <tbody>
                  ${r.serviceItems.map(it => `
                    <tr style="border-bottom:1px dashed var(--line);">
                      <td style="padding:6px 10px;font-weight:700;">${escapeHtml(it.desc || 'خدمة صيانة')}</td>
                      <td class="mono" style="padding:6px 10px;text-align:left;font-weight:800;">${Number(it.price || 0).toLocaleString()} ج.م</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;margin-bottom:12px;">
            <div style="background:var(--paper);border:1px solid var(--line);border-radius:var(--radius-xs);padding:10px 8px;text-align:center;">
              <div style="font-size:11px;color:var(--ink-secondary);margin-bottom:4px;">إجمالي التكلفة</div>
              <div class="mono" style="font-weight:900;font-size:14px;color:var(--ink);">${totalCost.toLocaleString()} ج.م</div>
            </div>
            <div style="background:var(--paper);border:1px solid var(--line);border-radius:var(--radius-xs);padding:10px 8px;text-align:center;">
              <div style="font-size:11px;color:var(--ink-secondary);margin-bottom:4px;">المدفوع مقدماً</div>
              <div class="mono" style="font-weight:900;font-size:14px;color:var(--green);">${deposit.toLocaleString()} ج.م</div>
            </div>
            <div style="background:${remaining <= 0 ? 'rgba(16,185,129,0.1)' : 'var(--amber-bg)'};border:1.5px solid ${remaining <= 0 ? 'var(--green)' : 'var(--amber)'};border-radius:var(--radius-xs);padding:10px 8px;text-align:center;">
              <div style="font-size:11px;color:${remaining <= 0 ? 'var(--green)' : 'var(--amber-text)'};margin-bottom:4px;font-weight:700;">${remaining <= 0 ? 'حالة الحساب' : 'المتبقي عند الاستلام'}</div>
              <div class="mono" style="color:${remaining <= 0 ? 'var(--green)' : 'var(--amber-text)'};font-size:15px;font-weight:900;">
                ${remaining <= 0 ? 'خالص بالكامل ✅' : `${remaining.toLocaleString()} ج.م`}
              </div>
            </div>
          </div>

          <div style="font-size:11.5px;text-align:center;padding:6px;background:${isPaid ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)'};border-radius:var(--radius-xs);color:${isPaid ? 'var(--green)' : 'var(--amber-text)'};font-weight:800;">
            ${isPaid ? '✅ تم سداد جميع المستحقات بالكامل، لا توجد مبالغ مطلوبة عند الاستلام' : `💵 يرجى سداد المبلغ المتبقي (${remaining.toLocaleString()} ج.م) نقداً أو إلكترونياً عند الاستلام`}
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;" class="tracking-no-print">
          <a href="https://wa.me/${waPhone}?text=${encodeURIComponent(`السلام عليكم، بخصوص جهاز (${dCat} ${dBrand} ${dModel}) إيصال رقم #${r.receiptNumber}.. أود الاستفسار عن حالة الصيانة.`)}" target="_blank" class="btn btn-whatsapp btn-sm">
            ${WA_ICON} محادثة فورية عبر واتساب
          </a>
          ${shopPhone ? `<a href="tel:${shopPhone}" class="btn btn-ghost btn-sm" style="border:1px solid var(--line);">📞 اتصال بالفرع</a>` : ''}
          <button type="button" class="btn btn-ghost btn-sm" onclick="document.body.classList.add('printing-tracking-portal'); window.print();" style="border:1px solid var(--line);">🖨️ طباعة المتابعة</button>
          <button type="button" class="btn btn-ghost btn-sm" onclick="renderPublicTrackingPortal('')" style="border:1px solid var(--line);">🔍 تتبع جهاز آخر</button>
          <a href="${window.location.pathname}" class="btn btn-ghost btn-sm" style="color:var(--ink-secondary);">🔒 دخول الموظفين</a>
        </div>
      </div>
    </div>
  `;

  // Render photos grid if any
  if(photosList.length > 0){
    const gridEl = document.getElementById('publicTrackingPhotosGrid');
    if(gridEl && typeof renderDevicePhotosThumbnails === 'function'){
      renderDevicePhotosThumbnails(photosList, gridEl, { canDelete: false });
    }
  }
}
