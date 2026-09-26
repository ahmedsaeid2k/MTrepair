/* ---------------- Check URL for Public Customer Tracking ---------------- */
function checkCustomerTrackingURL(){
  const params = new URLSearchParams(window.location.search);
  const trackNum = params.get('track') || params.get('r');
  if(trackNum){
    renderPublicTrackingPortal(trackNum);
    return true;
  }
  return false;
}

async function renderPublicTrackingPortal(receiptNum){
  const app = document.getElementById('app');
  let r = null;
  const cleanNum = String(receiptNum || '').trim();

  if(navigator.onLine){
    try{
      const res = await apiGet('trackReceipt', { receiptNumber: cleanNum });
      if(res && res.found && res.receipt){
        r = res.receipt;
      }
    }catch(e){
      console.warn('trackReceipt API call failed:', e);
    }
  }

  // Fallback to local memory only if already loaded
  if(!r && state.receipts && state.receipts.length){
    const localMatch = state.receipts.find(x => String(x.receiptNumber || '').trim().toLowerCase() === cleanNum.toLowerCase());
    if(localMatch) {
      r = {
        receiptNumber: localMatch.receiptNumber,
        customer: { name: (localMatch.customer && localMatch.customer.name) || extractCustomerName(localMatch) || '' },
        device: {
          category: (localMatch.device && localMatch.device.category) || '',
          brand: (localMatch.device && localMatch.device.brand) || '',
          brandOther: (localMatch.device && localMatch.device.brandOther) || '',
          model: (localMatch.device && localMatch.device.model) || ''
        },
        faults: Array.isArray(localMatch.faults) ? localMatch.faults : [String(localMatch.faults || '')],
        deliveryDate: localMatch.deliveryDate || '',
        status: localMatch.status || 'قيد الفحص',
        cost: Number(localMatch.cost || 0),
        partsCost: Number(localMatch.partsCost || 0),
        deposit: Number(localMatch.deposit || 0),
        refunded: Number(localMatch.refunded || 0)
      };
    }
  }
  
  if(!r){
    app.innerHTML = `
      <div class="tracking-container">
        <div class="tracking-card" style="text-align:center;">
          <div style="font-size:40px;margin-bottom:12px;">🔍</div>
          <h2>لم يتم العثور على الإيصال</h2>
          <p class="subtitle" style="margin-bottom:20px;">تأكد من رقم الإيصال المكتوب: <b class="mono">${escapeHtml(cleanNum)}</b></p>
          <a href="${window.location.pathname}" class="btn btn-primary">العودة لتسجيل الدخول</a>
        </div>
      </div>
    `;
    return;
  }

  const remaining = Number(r.cost||0)+Number(r.partsCost||0)-Number(r.deposit||0)+Number(r.refunded||0);
  const isDelivered = r.status==='تم التسليم';
  const isDone = r.status==='مكتمل' || isDelivered;
  const isRepair = r.status==='الصيانة';
  const isCheck = r.status==='قيد الفحص';

  const custName = escapeHtml((r.customer && r.customer.name) || '');
  const devCat = escapeHtml((r.device && r.device.category) || 'جهاز');
  const devBrand = escapeHtml(r.device ? (r.device.brand==='أخرى' ? (r.device.brandOther || '') : (r.device.brand || '')) : '');
  const devModel = escapeHtml((r.device && r.device.model) || '');
  const faultsText = escapeHtml(Array.isArray(r.faults) ? r.faults.join('، ') : (r.faults || '-'));
  const delDate = escapeHtml(r.deliveryDate || 'قيد التحديد');
  const rStatus = escapeHtml(r.status || 'قيد الفحص');
  const rNum = escapeHtml(String(r.receiptNumber || ''));

  app.innerHTML = `
    <div class="tracking-container">
      <div class="tracking-card">
        <div style="text-align:center;border-bottom:1px solid var(--line);padding-bottom:16px;margin-bottom:16px;">
          <div style="font-size:28px;">⚡</div>
          <h2 style="margin:4px 0;">بوابة تتبع الصيانة — ميكروتك</h2>
          <div class="subtitle">رقم الإيصال: <b class="mono" style="color:var(--primary);font-size:16px;">#${rNum}</b></div>
        </div>

        <div class="tracking-timeline">
          <div class="timeline-step done">
            <div class="timeline-node">✓</div>
            <div class="timeline-title">الاستلام</div>
          </div>
          <div class="timeline-step ${isCheck||isRepair||isDone?'active done':''}">
            <div class="timeline-node">${isCheck?'🔍':'✓'}</div>
            <div class="timeline-title">الفحص والتشخيص</div>
          </div>
          <div class="timeline-step ${isRepair||isDone?'active done':''}">
            <div class="timeline-node">${isRepair?'🛠️':(isDone?'✓':'')}</div>
            <div class="timeline-title">جاري الصيانة</div>
          </div>
          <div class="timeline-step ${isDone?'active done':''}">
            <div class="timeline-node">${r.status==='مكتمل'?'✅':(isDelivered?'✓':'')}</div>
            <div class="timeline-title">جاهز للاستلام</div>
          </div>
          <div class="timeline-step ${isDelivered?'active done':''}">
            <div class="timeline-node">${isDelivered?'🤝':''}</div>
            <div class="timeline-title">تم التسليم</div>
          </div>
        </div>

        <div style="background:var(--paper3);border-radius:var(--radius);padding:16px;margin-bottom:16px;line-height:1.8;">
          <div><b>👤 اسم العميل:</b> ${custName}</div>
          <div><b>💻 الجهاز:</b> ${devCat} - ${devBrand} ${devModel}</div>
          <div><b>⚠️ العطل المبلغ عنه:</b> ${faultsText}</div>
          <div><b>📅 موعد التسليم المتوقع:</b> ${delDate}</div>
          <div><b>📌 الحالة الحالية:</b> <span class="status-badge ${(STATUSES.find(s=>s.v===r.status)||{}).cls||'st-check'}">${rStatus}</span></div>
        </div>

        <div class="fin-box" style="margin-bottom:20px;">
          <div class="fin-cell"><div class="l">إجمالي التكلفة</div><div class="v">${Number(r.cost||0)+Number(r.partsCost||0)} ج.م</div></div>
          <div class="fin-cell"><div class="l">المدفوع مقدماً</div><div class="v">${Number(r.deposit||0)} ج.م</div></div>
          <div class="fin-cell hi"><div class="l">المتبقي المطلوب</div><div class="v">${remaining} ج.م</div></div>
        </div>

        <div style="display:flex;gap:10px;justify-content:center;">
          <a href="https://wa.me/201000000000?text=${encodeURIComponent('استفسار بخصوص إيصال رقم '+r.receiptNumber)}" target="_blank" class="btn btn-whatsapp">${WA_ICON} تواصل مع خدمة العملاء</a>
          <a href="${window.location.pathname}" class="btn btn-ghost">🔒 دخول الموظفين</a>
        </div>
      </div>
    </div>
  `;
}
