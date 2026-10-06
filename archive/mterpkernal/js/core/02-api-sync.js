/* ---------------- MTERP_ API & Offline Sync Engine ---------------- */
const STORAGE_PREFIX = 'mterp_';

/* Strict Data Isolation & Blacklist: Protect original Computer Shop databases */
const BLOCKED_COMPUTER_SCRIPT_IDS = [
  'AKfycbzpi81aPJwwsvHCqUKCkUxEhT0l4NnLgcCBPab1xjvx0B3vhzamCVkwiohrOCfWkKcm',
  'AKfycby-rkoaYfBuahnMc_dxPuzGepC-H5SJChwm5AJJ_bkwdmEswFhJ7tBoBbMel4gQyxUL'
];

function isComputerProjectUrl(url){
  if(!url) return false;
  return BLOCKED_COMPUTER_SCRIPT_IDS.some(id => String(url).includes(id));
}

/* Dynamic API Endpoint - Isolated per project, completely offline by default */
function getApiUrl(){
  try {
    const url = (localStorage.getItem(STORAGE_PREFIX + 'api_url') || '').trim();
    if(isComputerProjectUrl(url)){
      console.error('⛔ خطأ أمني: محاولة ربط النظام بقاعدة بيانات مشروع الكمبيوتر! تم مسح الرابط فورياً لحماية البيانات.');
      localStorage.removeItem(STORAGE_PREFIX + 'api_url');
      return '';
    }
    return url;
  } catch(e) { return ''; }
}

function setApiUrl(url){
  try {
    if(url && url.trim()) {
      if(isComputerProjectUrl(url.trim())){
        throw new Error('⛔ محظور أمنياً: هذا الرابط مخصص حصرياً لمشروع أجهزة الكمبيوتر (MicroTech) ولا يجوز ربطه بأي نظام أو برنامج آخر لحماية البيانات.');
      }
      localStorage.setItem(STORAGE_PREFIX + 'api_url', url.trim());
    } else {
      localStorage.removeItem(STORAGE_PREFIX + 'api_url');
    }
  } catch(e){
    throw e;
  }
}

// 🔒 Server-Issued Session Token Engine
function getSessionToken() {
  return (typeof state !== 'undefined' && state && state.sessionToken)
    || sessionStorage.getItem(STORAGE_PREFIX + 'session_token')
    || localStorage.getItem(STORAGE_PREFIX + 'session_token')
    || '';
}

let isSessionExpiring = false;
function handleSessionExpired() {
  if (isSessionExpiring) return;
  isSessionExpiring = true;
  if (typeof showToast === 'function') {
    showToast('⚠️ انتهت صلاحية جلسة العمل، يرجى تسجيل الدخول مجدداً للمتابعة 🔐', 'warning', 4500);
  }
  setTimeout(() => {
    if (typeof logout === 'function') logout();
    isSessionExpiring = false;
  }, 800);
}

/* Local Cache Helpers with isolated Storage Prefix */
function getCache(key, fallback){
  try {
    const d = localStorage.getItem(STORAGE_PREFIX + 'cache_' + key);
    return d ? JSON.parse(d) : fallback;
  } catch(e) { return fallback; }
}
function setCache(key, val){
  try { localStorage.setItem(STORAGE_PREFIX + 'cache_' + key, JSON.stringify(val)); } catch(e){}
}

/* Offline Sync Queue */
function getSyncQueue(){
  try { return JSON.parse(localStorage.getItem(STORAGE_PREFIX + 'sync_queue') || '[]'); } catch(e){ return []; }
}
function saveSyncQueue(q){
  try { localStorage.setItem(STORAGE_PREFIX + 'sync_queue', JSON.stringify(q)); } catch(e){}
  updateSyncStatusPill();
}
function addToSyncQueue(action, data){
  const q = getSyncQueue();
  const serialized = JSON.stringify({action, data});
  const alreadyInQueue = q.some(item => JSON.stringify({action: item.action, data: item.data}) === serialized);
  if(alreadyInQueue){
    console.warn('[addToSyncQueue] Suppressed identical pending queue item for ' + action);
    return;
  }
  q.push({ id: 'sync_' + Date.now() + '_' + Math.random().toString(36).slice(2,7), action, data, timestamp: new Date().toISOString() });
  saveSyncQueue(q);
}

/* Anti-DoS Client Concurrency Limiter & Batch Network Engine */
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
  const apiUrl = getApiUrl();
  if(!apiUrl) return false;
  try {
    const res = await apiGet('getBootstrapData');
    if(res && res.ok){
      if(Array.isArray(res.receipts)) { state.receipts = res.receipts.map(rowToReceipt); setCache('receipts', state.receipts); }
      if(Array.isArray(res.customers)) { state.customers = res.customers; setCache('customers', state.customers); }
      if(Array.isArray(res.technicians)) { 
        const names = res.technicians.map(r=>r.Name).filter(Boolean);
        state.technicians = names.length ? names : state.technicians;
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
  const apiUrl = getApiUrl();
  if(!apiUrl){
    if(action === 'login') return null;
    return getCache(action, []);
  }
  if(!navigator.onLine){
    return getCache(action, []);
  }
  return networkThrottler.schedule(async () => {
    try {
      const token = getSessionToken();
      const q = new URLSearchParams({action, ...(token ? {sessionToken: token} : {}), ...(params||{})});
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(apiUrl + '?' + q.toString(), { signal: controller.signal });
      clearTimeout(timeout);
      const json = await res.json();
      if(json && json.sessionExpired){
        handleSessionExpired();
        throw new Error(json.error || 'انتهت صلاحية جلسة العمل');
      }
      if(json && json.error) throw new Error(json.error);
      setCache(action, json);
      return json;
    } catch(e) {
      if(e.message && e.message.includes('جلسة العمل')) throw e;
      console.warn('apiGet failed for ' + action + ', falling back to local cache:', e.message);
      return getCache(action, []);
    }
  });
}

async function apiPost(action, data){
  const apiUrl = getApiUrl();
  if(!apiUrl){
    return { ok: true, offline: true, standalone: true };
  }
  if(!navigator.onLine){
    addToSyncQueue(action, data);
    return { ok: true, offline: true };
  }
  return networkThrottler.schedule(async () => {
    try {
      const token = getSessionToken();
      const payload = { action, ...(token ? {sessionToken: token} : {}), ...data };
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'text/plain;charset=utf-8'},
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeout);
      const json = await res.json();
      if(json && json.sessionExpired){
        handleSessionExpired();
        throw new Error(json.error || 'انتهت صلاحية جلسة العمل');
      }
      if(json && json.error) throw new Error(json.error);
      return json;
    } catch(e) {
      if(e.message && e.message.includes('جلسة العمل')) throw e;
      console.warn('apiPost network error on ' + action + ', enqueuing for background sync:', e.message);
      addToSyncQueue(action, data);
      return { ok: true, offline: true };
    }
  });
}

/* Background Synchronization */
let isSyncingNow = false;
async function syncOfflineQueue(isManual = false){
  const apiUrl = getApiUrl();
  if(!apiUrl){
    if(isManual) showToast('النظام يعمل بالوضع المحلي المستقل 🔒 (لم يتم تعيين رابط Google Apps Script مخصص).', 'info');
    return;
  }
  if(!navigator.onLine || isSyncingNow) return;
  const q = getSyncQueue();
  if(!q.length) { 
    updateSyncStatusPill(); 
    if(isManual) showToast('لا توجد أي عمليات معلقة — كافة البيانات متزامنة تماماً ✨', 'success');
    return; 
  }

  isSyncingNow = true;
  updateSyncStatusPill();
  if(isManual) showToast('🔄 جاري مزامنة ' + q.length + ' عمليات مسجلة دون إنترنت...', 'info', 2500);

  const remaining = [];
  const token = getSessionToken();
  for(const item of q){
    try {
      const payload = { action: item.action, ...(token ? {sessionToken: token} : {}), ...item.data };
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {'Content-Type': 'text/plain;charset=utf-8'},
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if(json && json.error) throw new Error(json.error);
    } catch(err) {
      console.warn('Sync failed for item:', item, err);
      item.retryCount = (item.retryCount || 0) + 1;
      if(item.retryCount <= 10){
        remaining.push(item);
      }
    }
  }

  saveSyncQueue(remaining);
  isSyncingNow = false;
  updateSyncStatusPill();

  if(remaining.length === 0){
    if(isManual) showToast('✅ تم مزامنة كافة العمليات بنجاح!', 'success');
    try {
      if(typeof renderMain === 'function') renderMain();
    } catch(e){}
  } else {
    if(isManual) showToast('⚠️ تبقى ' + remaining.length + ' عمليات في الطابور سيتم رفعها تلقائياً.', 'info');
  }
}

function clearOfflineSyncQueue(){
  try {
    localStorage.removeItem(STORAGE_PREFIX + 'sync_queue');
    updateSyncStatusPill();
    if(typeof showToast === 'function') showToast('تم تفريغ طابور المزامنة بنجاح 🗑️', 'info');
  } catch(e){}
}
