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

/* ============================================================
   Anti-DoS Client Concurrency Limiter & Batch Network Engine
   ============================================================ */
class ClientRequestThrottler {
  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
    this.activeCount = 0;
    this.waitingQueue = [];
  }
  async schedule(fn) {
    if (this.activeCount >= this.maxConcurrent) {
      await new Promise(resolve => this.waitingQueue.push(resolve));
    }
    this.activeCount++;
    try {
      return await fn();
    } finally {
      this.activeCount--;
      if (this.waitingQueue.length > 0) {
        const next = this.waitingQueue.shift();
        next();
      }
    }
  }
}
const networkThrottler = new ClientRequestThrottler(3);

async function fetchBootstrapData(){
  try {
    const res = await apiGet('getBootstrapData');
    if(res && res.ok){
      if(Array.isArray(res.receipts)) { state.receipts = res.receipts.map(rowToReceipt); setCache('receipts', state.receipts); }
      if(Array.isArray(res.customers)) { state.customers = res.customers; setCache('customers', state.customers); }
      if(Array.isArray(res.technicians)) { 
        const names = res.technicians.map(r=>r.Name).filter(Boolean);
        state.technicians = names.length ? names : ['أحمد فتحي','محمود سيد','كريم عادل'];
        setCache('technicians', state.technicians); 
      }
      if(res.settings && typeof res.settings === 'object') { state.settings = res.settings; setCache('settings', res.settings); }
      if(Array.isArray(res.payments)) { state.payments = res.payments; setCache('payments', state.payments); }
      if(Array.isArray(res.inventory)) { state.inventory = res.inventory; setCache('inventory', state.inventory); }
      if(Array.isArray(res.sales)) { state.sales = res.sales; setCache('sales', state.sales); }
      if(Array.isArray(res.quotations)) { state.quotations = res.quotations; setCache('quotations', state.quotations); }
      if(Array.isArray(res.services)) { state.services = res.services; setCache('services', state.services); }
      if(Array.isArray(res.purchases)) { state.purchases = res.purchases; setCache('purchases', state.purchases); }
      if(Array.isArray(res.suppliers)) { state.suppliers = res.suppliers; setCache('suppliers', state.suppliers); }
      if(Array.isArray(res.expenses)) { state.expenses = res.expenses; setCache('expenses', state.expenses); }
      if(Array.isArray(res.accounts)) { state.accounts = res.accounts; setCache('accounts', state.accounts); }
      if(Array.isArray(res.journalEntries)) { state.journalEntries = res.journalEntries; setCache('journal', res.journalEntries); }
      if(Array.isArray(res.invoices)) { state.invoices = res.invoices; setCache('invoices', state.invoices); }
      if(Array.isArray(res.users)) { state.users = res.users; setCache('users', state.users); }
      return true;
    }
  } catch(e) {
    console.warn('[fetchBootstrapData] Failed to load bootstrap batch:', e.message);
  }
  return false;
}

/* Network Request Wrappers with Local Fallback */
async function apiGet(action, params){
  if(action === 'login'){
    // Security: login authentication must never cache or return stale cached tokens
    return networkThrottler.schedule(async () => {
      const q = new URLSearchParams({action, ...(params||{})});
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`${API_URL}?${q.toString()}`, { signal: controller.signal });
      clearTimeout(timeout);
      const json = await res.json();
      if(json && json.error) throw new Error(json.error);
      return json;
    });
  }
  if(!navigator.onLine){
    // Return cached data immediately
    return getCache(action, []);
  }
  return networkThrottler.schedule(async () => {
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
  });
}

async function apiPost(action, data){
  if(!navigator.onLine){
    addToSyncQueue(action, data);
    return { ok: true, offline: true };
  }
  return networkThrottler.schedule(async () => {
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
  });
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
    // Refresh memory from cloud using unified bootstrap
    try {
      const bDone = await fetchBootstrapData();
      if(!bDone){
        [state.receipts, state.customers, state.technicians, state.settings, state.payments, state.inventory, state.sales, state.quotations, state.services, state.purchases, state.suppliers, state.expenses] = await Promise.all([
          loadReceipts(), loadCustomers(), loadTechnicians(), loadSettings(), loadPayments(), loadInventory(), loadSales(), loadQuotations(), loadServices(), loadPurchases(), loadSuppliers(), loadExpenses()
        ]);
      }
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
