/* ---------------- Google Sheets API & Offline Sync Engine ---------------- */
const API_URL = 'https://script.google.com/macros/s/AKfycbzpi81aPJwwsvHCqUKCkUxEhT0l4NnLgcCBPab1xjvx0B3vhzamCVkwiohrOCfWkKcm/exec';

/* Local Cache Helpers */
function getCache(key, fallback){
  try {
    const d = localStorage.getItem('microerp_cache_' + key);
    return d ? JSON.parse(d) : fallback;
  } catch(e) { return fallback; }
}
function setCache(key, val){
  try { localStorage.setItem('microerp_cache_' + key, JSON.stringify(val)); } catch(e){}
}

/* Offline Sync Queue */
function getSyncQueue(){
  try { return JSON.parse(localStorage.getItem('microerp_sync_queue') || '[]'); } catch(e){ return []; }
}
function saveSyncQueue(q){
  try { localStorage.setItem('microerp_sync_queue', JSON.stringify(q)); } catch(e){}
  updateSyncStatusPill();
}
function addToSyncQueue(action, data){
  const q = getSyncQueue();
  const serialized = JSON.stringify({action, data});
  const alreadyInQueue = q.some(item => JSON.stringify({action: item.action, data: item.data}) === serialized);
  if(alreadyInQueue){
    console.warn(`[addToSyncQueue] Suppressed identical pending queue item for ${action}`);
    return;
  }
  q.push({ id: 'sync_' + Date.now() + '_' + Math.random().toString(36).slice(2,7), action, data, timestamp: new Date().toISOString() });
  saveSyncQueue(q);
}

/* Network Request Wrappers with Local Fallback */
async function apiGet(action, params){
  if(action === 'login'){
    // Security: login authentication must never cache or return stale cached tokens
    const q = new URLSearchParams({action, ...(params||{})});
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${API_URL}?${q.toString()}`, { signal: controller.signal });
    clearTimeout(timeout);
    const json = await res.json();
    if(json && json.error) throw new Error(json.error);
    return json;
  }
  if(!navigator.onLine){
    // Return cached data immediately
    return getCache(action, []);
  }
  try {
    const q = new URLSearchParams({action, ...(params||{})});
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const res = await fetch(`${API_URL}?${q.toString()}`, { signal: controller.signal });
    clearTimeout(timeout);
    const json = await res.json();
    if(json && json.error) throw new Error(json.error);
    // Cache success
    setCache(action, json);
    return json;
  } catch(e) {
    console.warn(`apiGet failed for ${action}, falling back to local cache:`, e.message);
    return getCache(action, []);
  }
}

async function apiPost(action, data){
  if(!navigator.onLine){
    addToSyncQueue(action, data);
    return { ok: true, offline: true };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type': 'text/plain;charset=utf-8'},
      body: JSON.stringify({action, ...data}),
      signal: controller.signal
    });
    clearTimeout(timeout);
    const json = await res.json();
    if(json && json.error) throw new Error(json.error);
    return json;
  } catch(e) {
    console.warn(`apiPost network error on ${action}, enqueuing for background sync:`, e.message);
    addToSyncQueue(action, data);
    return { ok: true, offline: true };
  }
}

/* Background Synchronization */
let isSyncingNow = false;
async function syncOfflineQueue(isManual = false){
  if(!navigator.onLine || isSyncingNow) return;
  const q = getSyncQueue();
  if(!q.length) { 
    updateSyncStatusPill(); 
    if(isManual) showToast('لا توجد أي عمليات معلقة — كافة البيانات متزامنة تماماً مع السحابة ✨', 'success');
    return; 
  }

  isSyncingNow = true;
  updateSyncStatusPill();
  if(isManual) showToast(`🔄 جاري مزامنة ${q.length} عمليات مسجلة دون إنترنت...`, 'info', 2500);

  const remaining = [];
  for(const item of q){
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {'Content-Type': 'text/plain;charset=utf-8'},
        body: JSON.stringify({action: item.action, ...item.data})
      });
      const json = await res.json();
      if(json && json.error) throw new Error(json.error);
    } catch(err) {
      console.warn('Sync failed for item:', item, err);
      item.retryCount = (item.retryCount || 0) + 1;
      // Retain item for next attempt if under retry limit
      if(item.retryCount <= 10){
        remaining.push(item);
      }
    }
  }

  saveSyncQueue(remaining);
  isSyncingNow = false;
  updateSyncStatusPill();

  if(remaining.length === 0){
    if(isManual) showToast('✅ تم مزامنة كافة العمليات بنجاح مع السحابة!', 'success');
    // Refresh memory from cloud
    try {
      [state.receipts, state.customers, state.technicians, state.settings, state.payments, state.inventory, state.sales, state.quotations, state.services, state.purchases, state.suppliers, state.expenses] = await Promise.all([
        loadReceipts(), loadCustomers(), loadTechnicians(), loadSettings(), loadPayments(), loadInventory(), loadSales(), loadQuotations(), loadServices(), loadPurchases(), loadSuppliers(), loadExpenses()
      ]);
      // Only refresh view if user is in Maintenance and not editing/typing
      if(state.currentSection === 'maintenance' && !state.draft){
        const isTyping = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT');
        const modalOpen = !!document.querySelector('.modal-overlay, .modal-backdrop, .modal, [id*="Modal"]');
        if(!isTyping && !modalOpen){
          renderMain();
        }
      }
    } catch(e){}
  } else {
    if(isManual) showToast(`⚠️ تبقى ${remaining.length} عمليات في الطابور سيتم رفعها تلقائياً.`, 'info');
  }
}

function clearOfflineSyncQueue(){
  try {
    localStorage.removeItem('microerp_sync_queue');
  } catch(e){}
  updateSyncStatusPill();
  showToast('تم تفريغ طابور المزامنة المعلق بنجاح ✅', 'success');
}

/* Listen to online/offline network events */
window.addEventListener('online', ()=>{
  updateSyncStatusPill();
  syncOfflineQueue(false);
});
window.addEventListener('offline', ()=>{
  updateSyncStatusPill();
});

function updateSyncStatusPill(){
  const pill = document.getElementById('networkSyncPill');
  if(!pill) return;
  const q = getSyncQueue();
  if(!navigator.onLine){
    pill.className = 'sync-pill offline';
    pill.innerHTML = `<span>📴 غير متصل</span>${q.length ? `<span class="mono">(${q.length} معلقة)</span>` : ''}`;
    pill.title = 'أنت تعمل حالياً في الوضع المحلي (أوفلاين)، وسيتم حفظ وتطبيق كل العمليات تلقائياً.';
  } else if(isSyncingNow){
    pill.className = 'sync-pill syncing';
    pill.innerHTML = `<span>🔄 جاري المزامنة...</span>`;
  } else if(q.length > 0){
    pill.className = 'sync-pill offline';
    pill.innerHTML = `<span>⚠️ ${q.length} عمليات معلقة</span>`;
    pill.title = 'اضغط للمزامنة الفورية مع السحابة';
  } else {
    pill.className = 'sync-pill online';
    pill.innerHTML = `<span>🟢 متصل ومتزامن</span>`;
    pill.title = 'النظام متصل بالسحابة ومتزامن بالكامل';
  }
}
