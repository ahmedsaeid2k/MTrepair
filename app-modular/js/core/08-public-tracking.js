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
  let receipts = state.receipts || [];
  if(navigator.onLine){
    try{ receipts = (await apiGet('getReceipts')).map(rowToReceipt); }catch(e){}
  }
  const r = receipts.find(x=>x.receiptNumber.trim()===receiptNum.trim());
  
  if(!r){
    app.innerHTML = `
      <div class="tracking-container">
        <div class="tracking-card" style="text-align:center;">
          <div style="font-size:40px;margin-bottom:12px;">🔍</div>
          <h2>لم يتم العثور على الإيصال</h2>
          <p class="subtitle" style="margin-bottom:20px;">تأكد من رقم الإيصال المكتوب: <b>${receiptNum}</b></p>
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

  app.innerHTML = `
    <div class="tracking-container">
      <div class="tracking-card">
        <div style="text-align:center;border-bottom:1px solid var(--line);padding-bottom:16px;margin-bottom:16px;">
          <div style="font-size:28px;">⚡</div>
          <h2 style="margin:4px 0;">بوابة تتبع الصيانة — ميكروتك</h2>
          <div class="subtitle">رقم الإيصال: <b class="mono" style="color:var(--primary);font-size:16px;">${r.receiptNumber}</b></div>
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
          <div><b>👤 اسم العميل:</b> ${r.customer.name}</div>
          <div><b>💻 الجهاز:</b> ${r.device.category} - ${r.device.brand==='أخرى'?r.device.brandOther:r.device.brand} ${r.device.model||''}</div>
          <div><b>⚠️ العطل المبلغ عنه:</b> ${r.faults.join('، ')||'-'}</div>
          <div><b>📅 موعد التسليم المتوقع:</b> ${r.deliveryDate||'قيد التحديد'}</div>
          <div><b>📌 الحالة الحالية:</b> <span class="status-badge ${(STATUSES.find(s=>s.v===r.status)||{}).cls||'st-check'}">${r.status}</span></div>
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
