/* ---------------- Init ---------------- */
async function init(){
  if(checkCustomerTrackingURL()) return;
  
  // Instant load from cache first for zero-wait UI
  state.users = getCache('users', state.users);
  state.receipts = getCache('receipts', state.receipts);
  state.customers = getCache('customers', state.customers);
  state.technicians = getCache('technicians', state.technicians);
  state.settings = getCache('settings', state.settings);
  state.payments = getCache('payments', state.payments);
  state.inventory = getCache('inventory', state.inventory);
  state.sales = getCache('sales', state.sales);
  state.quotations = getCache('quotations', state.quotations);
  state.services = getCache('services', state.services);
  state.purchases = getCache('purchases', state.purchases);
  state.suppliers = getCache('suppliers', state.suppliers);
  state.expenses = getCache('expenses', state.expenses);
  state.accounts = getCache('accounts', state.accounts);
  state.journalEntries = getCache('journal', state.journalEntries);
  state.invoices = getCache('invoices', state.invoices);

  // Recover and reconcile customer phones from cache
  recoverAndSyncAllCustomerPhones(false);

  render();
  updateSyncStatusPill();
  if(typeof checkStorageQuotaStatus === 'function') checkStorageQuotaStatus();

  // If online and authenticated with server session, fetch fresh updates in background via unified bootstrap
  if(navigator.onLine && state.user && getSessionToken()){
    try {
      // 🔒 Server Identity Verification: verify role and permissions against active server session
      const me = await apiGet('getMe', { _force: true });
      if(me && me.name){
        const serverRole = String(me.role || '').toLowerCase();
        const localRole = String(state.user.role || '').toLowerCase();
        if(serverRole !== localRole || !state.user.name || state.user.name.toLowerCase() !== me.name.toLowerCase()){
          console.warn('[init] Session role discrepancy detected between client and server. Enforcing server state.');
          state.user.role = serverRole;
          state.user.superuser = !!me.superuser;
          state.user.Superuser = !!me.superuser;
          if(me.sections) {
            state.user.sections = Array.isArray(me.sections) ? me.sections : String(me.sections).split(',').map(s=>s.trim()).filter(Boolean);
          }
          normalizeUserSections(state.user);
          try { sessionStorage.setItem('microerp_session', JSON.stringify(state.user)); } catch(e){}
          render();
        }
      }
    } catch(err) {
      if(err && err.message && err.message.includes('جلسة العمل')){
        logout();
        return;
      }
    }

    try {
      let bOk = await fetchBootstrapData();
      if(!bOk){
        // Retry once before falling back to individual requests
        console.warn('[init] Bootstrap failed, retrying once...');
        await new Promise(r => setTimeout(r, 1500));
        bOk = await fetchBootstrapData();
      }
      if(!bOk){
        // Final fallback: individual requests (but limited to essential data only)
        console.warn('[init] Bootstrap retry failed, loading essential data individually');
        [state.receipts, state.customers, state.payments, state.inventory] = await Promise.all([
          loadReceipts(), loadCustomers(), loadPayments(), loadInventory()
        ]);
        // Load remaining data non-blocking
        Promise.all([
          loadUsers(), loadTechnicians(), loadSettings(), loadSales(), 
          loadQuotations(), loadServices(), loadPurchases(), loadSuppliers(), 
          loadExpenses(), loadAccounts(), loadJournalEntries(), loadInvoices()
        ]).then(([users,techs,settings,sales,quots,services,purch,suppl,exp,acc,je,inv]) => {
          if(users) state.users = users;
          if(techs) state.technicians = techs;
          if(settings) state.settings = settings;
          if(sales) state.sales = sales;
          if(quots) state.quotations = quots;
          if(services) state.services = services;
          if(purch) state.purchases = purch;
          if(suppl) state.suppliers = suppl;
          if(exp) state.expenses = exp;
          if(acc) state.accounts = acc;
          if(je) state.journalEntries = je;
          if(inv) state.invoices = inv;
          render();
        }).catch(()=>{});
      }
      recoverAndSyncAllCustomerPhones(false);
      if(state.user) normalizeUserSections(state.user);
      render();
      syncOfflineQueue();
    } catch(e) {
      console.warn('Init background fetch failed, keeping local cache:', e);
    }
  }

  // Smart multi-device cloud synchronization (Every 3 min, throttled and paused when tab is hidden)
  setInterval(async ()=>{
    if(document.hidden) return; // Do not waste bandwidth/quota if tab is in background
    if(navigator.onLine){
      const pendingItems = getSyncQueue().filter(i => i.status !== 'failed_terminal');
      if(pendingItems.length > 0){
        await syncOfflineQueue();
      }
      // Pull fresh data from cloud only if offline queue has no pending items (conflict guard)
      const stillPending = getSyncQueue().filter(i => i.status !== 'failed_terminal');
      if(stillPending.length === 0 && !state.draft){
        const isTyping = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT');
        const modalOpen = !!document.querySelector('.modal-overlay, .modal-backdrop, .modal, [id*="Modal"]');
        if(!isTyping && !modalOpen){
          try {
            const [freshReceipts, freshCustomers] = await Promise.all([
              loadReceipts({ _force: true }), loadCustomers({ _force: true })
            ]);
            if(freshReceipts && freshReceipts.length){
              state.receipts = freshReceipts;
            }
            if(freshCustomers && freshCustomers.length){
              state.customers = freshCustomers;
            }
            if(state.currentSection === 'maintenance'){
              renderMain();
            }
          } catch(syncErr){}
        }
      }
    }
  }, 180000);

  // Smart focus sync with 3-minute cooldown to prevent network flooding when switching tabs
  let lastFocusSyncTime = Date.now();
  window.addEventListener('focus', async () => {
    const now = Date.now();
    if(now - lastFocusSyncTime < 180000) return; // 3-minute cooldown
    if(navigator.onLine && !state.draft && state.currentSection === 'maintenance'){
      const isTyping = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT');
      const modalOpen = !!document.querySelector('.modal-overlay, .modal-backdrop, .modal, [id*="Modal"]');
      if(isTyping || modalOpen) return;
      lastFocusSyncTime = now;
      try {
        const [freshReceipts, freshCustomers] = await Promise.all([
          loadReceipts({ _force: true }), loadCustomers({ _force: true })
        ]);
        if(freshReceipts && freshReceipts.length) state.receipts = freshReceipts;
        if(freshCustomers && freshCustomers.length) state.customers = freshCustomers;
        if(state.currentSection === 'maintenance' && (state.tab === 'archive' || state.tab === 'dashboard' || state.tab === 'customers')){
          renderMain();
        }
      } catch(fErr){}
    }
  });
}
async function refreshPayments(){ state.payments = await loadPayments(); }

function canUserAccessSection(sec, user = state.user){
  if(!user) return false;
  // Strict Security: Settings section is strictly exclusive to Admin (المدير العام حصراً)
  if(sec === 'settings') return user.role === 'admin';
  if(user.role === 'admin') return true;
  if(sec === 'users' || sec === 'audit') return !!user.superuser || !!user.Superuser;
  const secs = Array.isArray(user.sections) ? user.sections : String(user.sections||'').split(',').map(s=>s.trim()).filter(Boolean);
  if(sec === 'cameras_projects' || sec === 'cameras_visits' || sec === 'cameras_contracts'){
    if(secs.includes('cameras')) return true;
  }
  return secs.includes(sec);
}

function normalizeUserSections(u){
  if(!u) return;
  const allSections = ['maintenance', 'pos', 'invoices', 'cameras', 'cameras_projects', 'cameras_visits', 'cameras_contracts', 'cashdrawer', 'daily', 'finance', 'inventory', 'barcode', 'audit', 'users', 'settings'];

  const role = String(u.role || '').toLowerCase();
  if(role === 'admin' || !!u.superuser || !!u.Superuser){
    u.sections = allSections;
  } else {
    let secs = Array.isArray(u.sections) ? u.sections : String(u.sections||'').split(',').map(s=>s.trim()).filter(Boolean);
    // Settings is strictly forbidden for non-admin accounts
    secs = secs.filter(s => s !== 'settings');
    if(!secs.length) secs = ['pos'];
    u.sections = secs;
  }
}

/* ---------------- Render Root ---------------- */
function render(){
  const app = document.getElementById('app');
  if(!state.user){ app.innerHTML = loginScreen(); attachLogin(); return; }

  // Check and display banner if an incomplete intake draft exists
  if(typeof checkAndShowDraftBootBanner === 'function'){
    checkAndShowDraftBootBanner();
  }

  if(!state.currentSection){
    return renderSectionPicker(app);
  }

  // Strict RBAC Security Gate: Check if user is allowed to access requested section
  if(!canUserAccessSection(state.currentSection)){
    const secName = (SECTION_INFO[state.currentSection] && SECTION_INFO[state.currentSection].label) || state.currentSection;
    try {
      recordAuditLog('محاولة وصول محظورة', state.currentSection, `المستخدم (${state.user.name}) حاول الدخول إلى قسم (${secName}) دون تصريح مسبق`, '', 'محظور');
    } catch(e){}
    showToast(`تم حظر الوصول: ليس لديك صلاحية لدخول قسم (${secName})`, 'error');
    state.currentSection = null;
    return renderSectionPicker(app);
  }

  if(state.currentSection==='maintenance') return renderMaintenanceApp(app);
  if(state.currentSection==='pos') return renderPosApp(app);
  if(state.currentSection==='inventory') return renderInventoryHubApp(app);
  if(state.currentSection==='cameras') return renderCamerasApp(app);
  if(state.currentSection==='barcode') return renderBarcodeStudioApp(app);
  if(state.currentSection==='cashdrawer') return renderCashDrawerSectionApp(app);
  if(state.currentSection==='daily') return renderDailyJournalSectionApp(app);
  if(state.currentSection==='invoices') return renderInvoicesSectionApp(app);
  if(state.currentSection==='finance') return renderFinanceSectionApp(app);
  if(state.currentSection==='audit') return renderAuditSectionApp(app);
  if(state.currentSection==='users') return renderUsersSectionApp(app);
  if(state.currentSection==='settings') return renderSettingsSectionApp(app);
  renderSectionPicker(app);
}

const SECTION_INFO = {
  // 1. العمليات التشغيلية (Core Operations)
  maintenance: {label:'الصيانة والتصليح', iconName:'maintenance', icon: getSvgIcon('maintenance', 16), gradient:'var(--primary)', desc:'استلام وتسليم الأجهزة، أوامر الشغل، وتتبع الحالات', group:'ops', groupTitle:'العمليات التشغيلية (Operations)'},
  pos: {label:'نقطة البيع (POS)', iconName:'pos', icon: getSvgIcon('pos', 16), gradient:'#10b981', desc:'كاشير سريع، مبيعات بالباركود، الفاتورة الفورية وضمان المنتجات', group:'ops', groupTitle:'العمليات التشغيلية (Operations)'},
  invoices: {label:'الفواتير وعروض الأسعار', iconName:'invoices', icon: getSvgIcon('invoices', 16), gradient:'#d97706', desc:'إصدار الفواتير، عروض الأسعار، المطالبات، ومتابعة التحصيل', group:'ops', groupTitle:'العمليات التشغيلية (Operations)'},
  cameras: {label:'كاميرات المراقبة', iconName:'cameras', icon: getSvgIcon('cameras', 16), gradient:'#0284c7', desc:'كتالوج الكاميرات وعروض أسعار التركيب والمشاريع الأمنية', group:'ops', groupTitle:'العمليات التشغيلية (Operations)'},

  // 2. القسم المالي والخزينة (Finance & Treasury)
  cashdrawer: {label:'حركة الخزينة والدرج', iconName:'cashdrawer', icon: getSvgIcon('cashdrawer', 16), gradient:'#059669', desc:'إدارة درج الكاشير، مقبوضات ومدفوعات النقدية، العهد، وتقفيل الوردية', group:'finance', groupTitle:'القسم المالي والخزينة (Finance)'},
  daily: {label:'دفتر اليومية العامة', iconName:'daily', icon: getSvgIcon('daily', 16), gradient:'#4f46e5', desc:'سجل القيود وحركات العمليات اليومية الشاملة والمصروفات الإدارية', group:'finance', groupTitle:'القسم المالي والخزينة (Finance)'},
  finance: {label:'الحسابات والميزانية', iconName:'finance', icon: getSvgIcon('finance', 16), gradient:'#7c3aed', desc:'شجرة الحسابات، قيود اليومية، ميزان المراجعة، ومكافآت الفنيين', group:'finance', groupTitle:'القسم المالي والخزينة (Finance)'},

  // 3. المخازن والمشتريات (Inventory & Warehouses)
  inventory: {label:'المخزن العام والمخازن المتعددة', iconName:'inventory', icon: getSvgIcon('inventory', 16), gradient:'#ea580c', desc:'الأصناف، فروع المخازن، والتحويلات المخزنية والمشتريات', group:'inventory', groupTitle:'المخازن والمشتريات (Inventory)'},
  barcode: {label:'استوديو طباعة الباركود', iconName:'barcode', icon: getSvgIcon('barcode', 16), gradient:'#0891b2', desc:'طباعة ملصقات الباركود للأصناف والأجهزة بكافة المقاسات', group:'inventory', groupTitle:'المخازن والمشتريات (Inventory)'},

  // 4. الإدارة والرقابة (Management & Control)
  audit: {label:'الرقابة وتصاريح العمليات', iconName:'audit', icon: getSvgIcon('audit', 16), gradient:'#dc2626', desc:'سجل الرقابة الشامل وصندوق تصاريح واعتماد الحذف', group:'admin', groupTitle:'الإدارة والرقابة (Management & Control)'},
  users: {label:'المستخدمين والصلاحيات', iconName:'users', icon: getSvgIcon('users', 16), gradient:'#475569', desc:'تخصيص الشاشات والأقسام لكل مستخدم وصلاحية Superuser', group:'admin', groupTitle:'الإدارة والرقابة (Management & Control)'},

  // 5. النظام والإعدادات (Settings & System)
  settings: {label:'الإعدادات وتخصيص النظام', iconName:'settings', icon: getSvgIcon('settings', 16), gradient:'#64748b', desc:'بيانات المحل، المظهر، رسائل واتساب، وبنود الضمان (متاح حصراً للمدير العام)', group:'settings', groupTitle:'النظام والإعدادات (Settings)'}
};
const INVENTORY_CATEGORIES = ['صيانة','كاميرات','كمبيوتر','إكسسوار'];

/* ---------------- 5 Re-Organized Master Modules (Enterprise Core Architecture) ---------------- */
const MASTER_MODULES = [
  {
    id: 'maintenance',
    title: 'مركز الصيانة',
    enTitle: 'Maintenance Center',
    iconName: 'maintenance',
    gradient: 'var(--primary)',
    desc: 'إدارة أجهزة الصيانة، فحص وتتبع دورة الإصلاح، كروت الشغل، وضمانات الأجهزة المسلمة.',
    sec: 'maintenance',
    chips: [
      { label: 'استلام جهاز جديد', action: 'new_receipt' },
      { label: 'أجهزة قيد العمل', action: 'filter_active' },
      { label: 'جاهز للتسليم', action: 'filter_ready' },
      { label: 'استوديو الباركود', sec: 'barcode' }
    ]
  },
  {
    id: 'sales',
    title: 'المبيعات ونقطة البيع (POS)',
    enTitle: 'Sales, POS & Invoicing',
    iconName: 'pos',
    gradient: '#10b981',
    desc: 'كاشير باركود سريع، الفواتير الفورية وعروض الأسعار، وتجهيز كاميرات المراقبة والمشاريع.',
    sec: 'pos',
    chips: [
      { label: 'الكاشير و POS', sec: 'pos' },
      { label: 'الفواتير وعروض الأسعار', sec: 'invoices' },
      { label: 'فاتورة جديدة', action: 'new_invoice', sec: 'invoices' },
      { label: 'كاميرات المراقبة', sec: 'cameras' }
    ]
  },
  {
    id: 'inventory',
    title: 'المخازن والمشتريات والباركود',
    enTitle: 'Stock & Barcode Studio',
    iconName: 'inventory',
    gradient: '#0284c7',
    desc: 'شجرة الأصناف والكميات، إدارة الفروع والمخازن المتعددة، التحويلات، واستوديو طباعة الباركود.',
    sec: 'inventory',
    chips: [
      { label: 'المخزن العام', sec: 'inventory' },
      { label: 'استوديو الباركود', sec: 'barcode' },
      { label: 'تحويل مخزني', action: 'transfer_modal' },
      { label: 'الفروع والمخازن', action: 'warehouses_modal' }
    ]
  },
  {
    id: 'finance',
    title: 'المالية والخزينة والحسابات',
    enTitle: 'Finance & Treasury',
    iconName: 'cashdrawer',
    gradient: '#7c3aed',
    desc: 'دفتر اليومية وحركة السيولة النقدية، مقبوضات ومصروفات، شجرة الحسابات، ومكافآت الفنيين.',
    sec: 'cashdrawer',
    chips: [
      { label: 'حركة الخزينة والدرج', sec: 'cashdrawer' },
      { label: 'دفتر اليومية العامة', sec: 'daily' },
      { label: 'شجرة الحسابات', sec: 'finance' },
      { label: 'مكافآت الفنيين', sec: 'finance' }
    ]
  },
  {
    id: 'admin',
    title: 'الإدارة والرقابة والنظام',
    enTitle: 'Admin & System Control',
    iconName: 'audit',
    gradient: '#475569',
    desc: 'سجل الرقابة الشامل وتصاريح الحذف، إدارة المستخدمين وصلاحيات الشاشات، وإعدادات المظهر والواتساب.',
    sec: 'audit',
    chips: [
      { label: 'الرقابة والتصاريح', sec: 'audit' },
      { label: 'المستخدمين والصلاحيات', sec: 'users' },
      { label: 'إعدادات النظام', sec: 'settings' }
    ]
  }
];

/* ---------------- Universal Command Palette (Cmd + K) ---------------- */
function openCommandPalette(initialQuery=''){
  const existing = document.getElementById('cmdPaletteModal');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'cmd-palette-overlay';
  overlay.id = 'cmdPaletteModal';

  overlay.innerHTML = `
    <div class="cmd-palette-box">
      <div class="cmd-palette-header">
        <span style="font-size:18px;color:var(--primary);display:inline-flex;align-items:center;">${getSvgIcon('search', 18)}</span>
        <input type="text" class="cmd-palette-input" id="cmdSearchInput" placeholder="ابحث في الإيصالات، العملاء، الفواتير، الأصناف، أو الشاشات..." value="${initialQuery}" autofocus>
        <span class="kbd-shortcut">ESC للخروج</span>
      </div>
      <div class="cmd-palette-results" id="cmdResultsBox">
        <div style="text-align:center;padding:24px;color:var(--ink-secondary);font-size:12.5px;">
          اكتب كلمة البحث للوصول الفوري لأي إيصال، عميل، صنف، فاتورة أو شاشة في النظام
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  const input = overlay.querySelector('#cmdSearchInput');
  const resultsBox = overlay.querySelector('#cmdResultsBox');

  overlay.onclick = (e)=>{ if(e.target === overlay) overlay.remove(); };
  document.addEventListener('keydown', function escHandler(e){
    if(e.key === 'Escape' && document.getElementById('cmdPaletteModal')){
      overlay.remove();
      document.removeEventListener('keydown', escHandler);
    }
  });

  function performSearch(q){
    const clean = String(q||'').trim().toLowerCase();
    if(!clean){
      resultsBox.innerHTML = `
        <div class="cmd-group-title">إجراءات سريعة واختصارات التنقل</div>
        <div class="cmd-item" data-cmd="act_new_receipt">
          <div class="cmd-item-left"><div class="cmd-item-icon">${getSvgIcon('plus', 16)}</div><div><div class="cmd-item-title">استلام جهاز صيانة جديد</div><div class="cmd-item-sub">فتح إيصال استلام وفحص جديد</div></div></div>
          <span class="cmd-item-badge">صيانة</span>
        </div>
        <div class="cmd-item" data-cmd="act_pos">
          <div class="cmd-item-left"><div class="cmd-item-icon">${getSvgIcon('pos', 16)}</div><div><div class="cmd-item-title">نقطة البيع السريعة (POS)</div><div class="cmd-item-sub">شاشة الكاشير والباركود</div></div></div>
          <span class="cmd-item-badge">مبيعات</span>
        </div>
        <div class="cmd-item" data-cmd="act_barcode">
          <div class="cmd-item-left"><div class="cmd-item-icon">${getSvgIcon('barcode', 16)}</div><div><div class="cmd-item-title">استوديو طباعة الباركود والملصقات</div><div class="cmd-item-sub">طباعة استيكر للأصناف وأجهزة الصيانة</div></div></div>
          <span class="cmd-item-badge">باركود</span>
        </div>
        <div class="cmd-item" data-cmd="act_new_daily">
          <div class="cmd-item-left"><div class="cmd-item-icon">${getSvgIcon('daily', 16)}</div><div><div class="cmd-item-title">تسجيل حركة نقدية باليومية</div><div class="cmd-item-sub">تسجيل وارد، منصرف، أو نثريات بالخزينة</div></div></div>
          <span class="cmd-item-badge">يومية</span>
        </div>
        <div class="cmd-item" data-cmd="act_new_invoice">
          <div class="cmd-item-left"><div class="cmd-item-icon">${getSvgIcon('invoices', 16)}</div><div><div class="cmd-item-title">إصدار فاتورة ضريبية أو بيان سعر</div><div class="cmd-item-sub">إنشاء فاتورة رسمية أو عرض أسعار للعميل</div></div></div>
          <span class="cmd-item-badge">فواتير</span>
        </div>
        <div class="cmd-item" data-cmd="act_new_item">
          <div class="cmd-item-left"><div class="cmd-item-icon">${getSvgIcon('package', 16)}</div><div><div class="cmd-item-title">إضافة صنف جديد بالمخزن</div><div class="cmd-item-sub">تسجيل منتج أو قطعة غيار بالباركود</div></div></div>
          <span class="cmd-item-badge">مخزن</span>
        </div>
        <div class="cmd-item" data-cmd="act_settings">
          <div class="cmd-item-left"><div class="cmd-item-icon">${getSvgIcon('settings', 16)}</div><div><div class="cmd-item-title">الإعدادات وتخصيص النظام</div><div class="cmd-item-sub">المظهر، الثيمات، تصنيفات الأجهزة، رسائل واتساب، وبنود الضمان</div></div></div>
          <span class="cmd-item-badge">إعدادات</span>
        </div>
      `;
      attachCmdClicks();
      return;
    }

    // Receipts Match
    const receipts = (state.receipts || []).filter(r => 
      String(r.receiptNumber||'').toLowerCase().includes(clean) ||
      String((r.customer||{}).name||'').toLowerCase().includes(clean) ||
      String((r.customer||{}).phone||'').toLowerCase().includes(clean) ||
      String((r.device||{}).category||'').toLowerCase().includes(clean) ||
      String((r.device||{}).brand||'').toLowerCase().includes(clean) ||
      String((r.device||{}).model||'').toLowerCase().includes(clean) ||
      (r.faults||[]).some(f=>String(f).toLowerCase().includes(clean))
    ).slice(0, 6);

    // Invoices Match
    const invoices = (state.invoices || []).filter(i => 
      String(i.invoiceNumber||'').toLowerCase().includes(clean) ||
      String(i.customerName||'').toLowerCase().includes(clean) ||
      String(i.customerPhone||'').toLowerCase().includes(clean)
    ).slice(0, 4);

    // Inventory Match
    const items = (state.inventory || []).filter(i => 
      String(i.Name||'').toLowerCase().includes(clean) ||
      String(i.Barcode||'').toLowerCase().includes(clean) ||
      String(i.Category||'').toLowerCase().includes(clean)
    ).slice(0, 5);

    // Sections Match
    const matchedSections = Object.entries(SECTION_INFO).filter(([k, info]) => 
      info.label.toLowerCase().includes(clean) || info.desc.toLowerCase().includes(clean)
    );

    let html = '';

    if(receipts.length > 0){
      html += `<div class="cmd-group-title">إيصالات الصيانة والأجهزة (${receipts.length})</div>`;
      html += receipts.map(r => {
        const st = STATUSES.find(s=>s.v===r.status) || STATUSES[0];
        const rem = Number(r.cost||0)+Number(r.partsCost||0)-Number(r.deposit||0)+Number(r.refunded||0);
        return `
          <div class="cmd-item" data-cmd="open_receipt" data-id="${escapeHtml(r.id)}">
            <div class="cmd-item-left">
              <div class="cmd-item-icon">${getSvgIcon('maintenance', 16)}</div>
              <div>
                <div class="cmd-item-title">${escapeHtml(r.receiptNumber)} — ${escapeHtml(r.customer?.name || '')} <span style="font-weight:normal;color:var(--ink-secondary);">(${escapeHtml(r.device?.category || '')} ${escapeHtml(r.device?.brand || '')})</span></div>
                <div class="cmd-item-sub">العطل: ${escapeHtml((r.faults||[]).join('، ')||'-')} • المتبقي: ${rem.toLocaleString()} ج.م</div>
              </div>
            </div>
            <span class="status-badge ${escapeHtml(st.cls)}">${escapeHtml(r.status)}</span>
          </div>
        `;
      }).join('');
    }

    if(invoices.length > 0){
      html += `<div class="cmd-group-title">الفواتير وعروض الأسعار (${invoices.length})</div>`;
      html += invoices.map(i => `
        <div class="cmd-item" data-cmd="open_invoice" data-id="${escapeHtml(i.id)}">
          <div class="cmd-item-left">
            <div class="cmd-item-icon">${getSvgIcon('invoices', 16)}</div>
            <div>
              <div class="cmd-item-title">${escapeHtml(i.invoiceNumber)} — ${escapeHtml(i.customerName)}</div>
              <div class="cmd-item-sub">الإجمالي: ${Number(i.netTotal||i.total||0).toLocaleString()} ج.م • ${escapeHtml(cleanDate(i.date))}</div>
            </div>
          </div>
          <span class="cmd-item-badge">${i.isPaid ? 'مسددة' : 'معلقة'}</span>
        </div>
      `).join('');
    }

    if(items.length > 0){
      html += `<div class="cmd-group-title">المخزن والأصناف (${items.length})</div>`;
      html += items.map(item => `
        <div class="cmd-item" data-cmd="open_item" data-name="${escapeHtml(item.Name)}">
          <div class="cmd-item-left">
            <div class="cmd-item-icon">${getSvgIcon('package', 16)}</div>
            <div>
              <div class="cmd-item-title">${escapeHtml(item.Name)}</div>
              <div class="cmd-item-sub">الكمية: ${Number(item.Quantity||0)} • السعر: ${Number(item.SellPrice||item.Price||0)} ج.م ${item.Barcode?'• باركود: '+escapeHtml(item.Barcode):''}</div>
            </div>
          </div>
          <span class="cmd-item-badge">${escapeHtml(item.Category||'عام')}</span>
        </div>
      `).join('');
    }

    if(matchedSections.length > 0){
      html += `<div class="cmd-group-title">شاشات وأقسام النظام (${matchedSections.length})</div>`;
      html += matchedSections.map(([k, info]) => `
        <div class="cmd-item" data-cmd="goto_sec" data-sec="${k}">
          <div class="cmd-item-left">
            <div class="cmd-item-icon">${info.icon}</div>
            <div>
              <div class="cmd-item-title">${info.label}</div>
              <div class="cmd-item-sub">${info.desc}</div>
            </div>
          </div>
          <span class="cmd-item-badge">انتقال</span>
        </div>
      `).join('');
    }

    if(!html){
      html = `<div style="text-align:center;padding:30px;color:var(--ink-secondary);">لم يتم العثور على نتائج مطابقة لـ "<b>${escapeHtml(q)}</b>"</div>`;
    }

    resultsBox.innerHTML = html;
    attachCmdClicks();
  }

  function attachCmdClicks(){
    resultsBox.querySelectorAll('[data-cmd]').forEach(item => {
      item.onclick = ()=>{
        const cmd = item.dataset.cmd;
        overlay.remove();
        if(cmd === 'act_new_receipt'){
          state.currentSection = 'maintenance';
          state.tab = 'new';
          render();
          startNewDraft();
        } else if(cmd === 'act_pos'){
          state.currentSection = 'pos';
          render();
        } else if(cmd === 'act_barcode'){
          state.currentSection = 'barcode';
          render();
        } else if(cmd === 'act_new_daily'){
          state.currentSection = 'daily';
          render();
          openDailyEntryModal();
        } else if(cmd === 'act_new_invoice'){
          state.currentSection = 'invoices';
          render();
          openInvoiceModal();
        } else if(cmd === 'act_new_item'){
          state.currentSection = 'inventory';
          render();
          openItemModal();
        } else if(cmd === 'goto_sec'){
          state.currentSection = item.dataset.sec;
          render();
        } else if(cmd === 'open_receipt'){
          const r = findReceiptByIdOrNum(item.dataset.id);
          if(r){
            state.currentSection = 'maintenance';
            render();
            openReceiptDetail(r);
          }
        } else if(cmd === 'open_invoice'){
          const inv = state.invoices.find(x => x.id === item.dataset.id);
          if(inv){
            openInvoicePrint(inv, 'invoice');
          }
        } else if(cmd === 'open_item'){
          state.currentSection = 'inventory';
          render();
        } else if(cmd === 'act_settings'){
          state.currentSection = 'settings';
          render();
        }
      };
    });
  }

  input.oninput = (e)=>performSearch(e.target.value);
  performSearch(initialQuery);
}

function openDailyEntryModal(defaultType = 'expense'){
  return openRecordTransactionModal(defaultType);
}

function openItemModal(editItem = null, cloneMode = false, defaultCategory = 'صيانة'){
  return openInventoryItemModal(editItem, cloneMode, defaultCategory);
}

// Global Keyboard Shortcut listener (Cmd+K / Ctrl+K / F6 / F7)
window.addEventListener('keydown', (e)=>{
  if((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K' || e.key === 'ك')){
    e.preventDefault();
    openCommandPalette();
  } else if(e.key === 'F6' && state.currentSection === 'pos'){
    e.preventDefault();
    if(typeof holdCurrentCart === 'function') holdCurrentCart();
  } else if(e.key === 'F7' && state.currentSection === 'pos'){
    e.preventDefault();
    if(typeof openHeldCartsModal === 'function') openHeldCartsModal();
  }
});

/* ---------------- Executive Command Center (Enterprise Core Modern Emerald Hub) ---------------- */
function renderExecutiveCommandCenter(app){
  const expandBtn = document.getElementById("sidebarExpandBtn");
  if(expandBtn) expandBtn.classList.remove("visible");
  normalizeUserSections(state.user);
  const logoUrl = state.settings.logoUrl;
  const today = new Date().toISOString().slice(0, 10);

  // Operational telemetry
  const allTx = (typeof getUnifiedDailyTransactions === 'function' ? getUnifiedDailyTransactions() : []);
  const todayIncome = (state.payments || []).filter(p => String(p.Date||'').slice(0,10) === today).reduce((s,p) => s + Number(p.Amount||0), 0);
  const todayExpenses = (state.expenses || []).filter(e => String(e.Date||'').slice(0,10) === today).reduce((s,e) => s + Number(e.Amount||0), 0);
  const netCashToday = todayIncome - todayExpenses;
  const currentDrawerCash = allTx.length ? allTx[allTx.length - 1].runningBalance : (netCashToday > 0 ? netCashToday : 0);

  const inProgressRepairs = (state.receipts || []).filter(r => r.status === 'قيد الفحص' || r.status === 'الصيانة').length;
  const readyRepairs = (state.receipts || []).filter(r => r.status === 'مكتمل').length;
  const deliveredToday = (state.receipts || []).filter(r => r.status === 'تم التسليم' && String(r.updatedAt||r.date||'').slice(0,10) === today).length;

  const todaySales = (state.sales || []).filter(s => String(s.Date||'').slice(0,10) === today);
  const todaySalesTotal = todaySales.reduce((s,x) => s + Number(x.Total||0), 0);

  const unpaidInvoices = (state.invoices || []).filter(i => !i.isPaid);
  const receivablesTotal = unpaidInvoices.reduce((s, i) => s + (Number(i.total||i.Total||0) - Number(i.paidAmount||0)), 0);
  const pendingAuthsCount = (state.authRequests || []).filter(r => r.status === 'pending').length;

  // 7-day operational activity for Engagement Bar Chart
  const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const weekData = [];
  for(let i = 6; i >= 0; i--){
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const name = dayNames[d.getDay()];
    const rCount = (state.receipts||[]).filter(r => String(r.date||r.createdAt||'').slice(0,10) === iso).length;
    const sCount = (state.sales||[]).filter(s => String(s.Date||'').slice(0,10) === iso).length;
    weekData.push({ iso, name, count: rCount + sCount, rCount, sCount });
  }

  // Unified recent operations history filtered by permissions
  const opsList = [];
  if(canUserAccessSection('maintenance')){
    (state.receipts || []).slice(-12).forEach(r => {
      opsList.push({
        type: 'receipt',
        icon: getSvgIcon('maintenance', 18),
        title: `إيصال صيانة #${r.receiptNum || r.id}`,
        sub: `${r.customerName || 'عميل'} — ${r.deviceType || 'جهاز'}`,
        section: 'صيانة',
        sectionColor: '#059669',
        date: r.date || r.createdAt || today,
        status: r.status || 'قيد العمل',
        statusClass: (r.status === 'تم التسليم' || r.status === 'مكتمل') ? 'hub-badge-green' : 'status-badge st-info',
        amount: Number(r.cost || r.totalCost || 0),
        raw: r
      });
    });
  }
  if(canUserAccessSection('pos') || canUserAccessSection('invoices')){
    (state.sales || []).slice(-12).forEach(s => {
      opsList.push({
        type: 'sale',
        icon: getSvgIcon('pos', 18),
        title: `مبيعات كاشير #${s.InvoiceNum || s.id || ''}`,
        sub: `${s.Customer || 'عميل نقدي'} (${(s.Items||[]).length} أصناف)`,
        section: 'مبيعات',
        sectionColor: '#10b981',
        date: s.Date || today,
        status: 'تم البيع',
        statusClass: 'hub-badge-green',
        amount: Number(s.Total || 0),
        raw: s
      });
    });
  }
  if(canUserAccessSection('daily') || canUserAccessSection('finance')){
    (state.payments || []).slice(-8).forEach(p => {
      opsList.push({
        type: 'payment',
        icon: getSvgIcon('finance', 18),
        title: `توريد / سند قبض نقدية`,
        sub: `${p.Customer || p.Description || 'سند نقدية بالخزينة'}`,
        section: 'خزينة',
        sectionColor: '#0284c7',
        date: p.Date || today,
        status: 'تم الإيداع',
        statusClass: 'hub-badge-green',
        amount: Number(p.Amount || 0),
        raw: p
      });
    });
    (state.expenses || []).slice(-8).forEach(e => {
      opsList.push({
        type: 'expense',
        icon: getSvgIcon('trendDown', 18),
        title: `سند صرف / نثريات`,
        sub: `${e.Description || e.Category || 'مصروف عام'}`,
        section: 'خزينة',
        sectionColor: '#ef4444',
        date: e.Date || today,
        status: 'تم الصرف',
        statusClass: 'status-badge st-warning',
        amount: -Number(e.Amount || 0),
        raw: e
      });
    });
  }
  opsList.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const recentOps = opsList.slice(0, 6);

  // Render full Enterprise Core canvas
  app.innerHTML = `
    <div class="hub-canvas">
      
      <!-- Topbar Header -->
      <header class="hub-topbar">
        <div class="hub-brand" id="hubrandHome">
          <div class="hub-brand-logo">
            ${logoUrl ? `<img src="${logoUrl}" style="width:100%;height:100%;object-fit:contain;border-radius:var(--radius-sm);">` : getSvgIcon('logo', 20)}
          </div>
          <div>
            <div style="line-height:1.2;font-weight:800;">${state.settings.shopName || 'MicroTech ERP'}</div>
            <div style="font-size:10.5px;font-weight:600;color:var(--ink-secondary);letter-spacing:0.5px;">نظام إدارة المؤسسة الموحد</div>
          </div>
        </div>

        <!-- Center Nav Pills -->
        <nav class="hub-nav-pills">
          <div class="hub-pill active" id="hubavDashboard">${getSvgIcon('dashboard', 14)} لوحة القيادة</div>
          ${canUserAccessSection('maintenance') ? `<div class="hub-pill" id="hubavMaint">${getSvgIcon('maintenance', 14)} الصيانة</div>` : ''}
          ${(canUserAccessSection('pos') || canUserAccessSection('invoices')) ? `<div class="hub-pill" id="hubavPos">${getSvgIcon('pos', 14)} المبيعات</div>` : ''}
          ${(canUserAccessSection('inventory') || canUserAccessSection('barcode')) ? `<div class="hub-pill" id="hubavInv">${getSvgIcon('inventory', 14)} المخزن والمشتريات</div>` : ''}
          ${(canUserAccessSection('cashdrawer') || canUserAccessSection('daily') || canUserAccessSection('finance')) ? `<div class="hub-pill" id="hubavFin">${getSvgIcon('cashdrawer', 14)} المالية والخزينة</div>` : ''}
          ${(canUserAccessSection('audit') || canUserAccessSection('users') || canUserAccessSection('settings')) ? `<div class="hub-pill" id="hubavAdmin">${getSvgIcon('audit', 14)} الإدارة والرقابة</div>` : ''}
        </nav>

        <!-- Top Actions -->
        <div class="hub-top-actions">
          <div class="hub-icon-circle" id="hubearchBtn" title="البحث السريع (⌘K)">
            ${getSvgIcon('search', 16)}
          </div>
          ${canUserAccessSection('audit') ? `
            <div class="hub-icon-circle" id="hubotifBtn" title="مركز التنبيهات وتصاريح الحذف">
              ${getSvgIcon('bell', 16)}
              ${pendingAuthsCount > 0 ? `<span style="position:absolute;top:4px;right:4px;background:#ef4444;color:#fff;font-size:9px;font-weight:800;width:15px;height:15px;border-radius:50%;display:flex;align-items:center;justify-content:center;">${pendingAuthsCount}</span>` : ''}
            </div>
          ` : ''}
          <div class="hub-icon-circle" id="hubhemeBtn" title="تبديل المظهر">
            ${state.theme === 'dark' ? getSvgIcon('sun', 16) : getSvgIcon('moon', 16)}
          </div>
          <div class="hub-user-avatar" id="hubserBtn" title="${state.user.name} (${state.user.role === 'admin' ? 'مدير' : 'موظف'})">
            ${(state.user.name || 'U').slice(0, 2).toUpperCase()}
          </div>
        </div>
      </header>

      <!-- Main Shell (Dock + Workspace) -->
      <div class="hub-shell">
        
        <!-- Side Dock Rail -->
        <aside class="hub-dock">
          <button class="hub-dock-btn active" id="dockHome" title="لوحة القيادة الرئيسية">${getSvgIcon('dashboard', 18)}</button>
          ${canUserAccessSection('maintenance') ? `<button class="hub-dock-btn" id="dockMaint" title="مركز الصيانة">${getSvgIcon('maintenance', 18)}</button>` : ''}
          ${canUserAccessSection('pos') ? `<button class="hub-dock-btn" id="dockPos" title="نقطة البيع (POS)">${getSvgIcon('pos', 18)}</button>` : ''}
          ${canUserAccessSection('inventory') ? `<button class="hub-dock-btn" id="dockInv" title="المخزن العام">${getSvgIcon('inventory', 18)}</button>` : ''}
          ${canUserAccessSection('barcode') ? `<button class="hub-dock-btn" id="dockBarcode" title="استوديو الباركود">${getSvgIcon('barcode', 18)}</button>` : ''}
          ${canUserAccessSection('cashdrawer') ? `<button class="hub-dock-btn" id="dockCashdrawer" title="حركة الخزينة والدرج">${getSvgIcon('cashdrawer', 18)}</button>` : ''}
          ${canUserAccessSection('daily') ? `<button class="hub-dock-btn" id="dockDaily" title="دفتر اليومية العامة">${getSvgIcon('daily', 18)}</button>` : ''}
          ${canUserAccessSection('invoices') ? `<button class="hub-dock-btn" id="dockInvoice" title="الفواتير وعروض الأسعار">${getSvgIcon('invoices', 18)}</button>` : ''}
          ${canUserAccessSection('cameras') ? `<button class="hub-dock-btn" id="dockCameras" title="كاميرات المراقبة">${getSvgIcon('cameras', 18)}</button>` : ''}
          ${canUserAccessSection('audit') ? `<button class="hub-dock-btn" id="dockAudit" title="الرقابة والتصاريح">${getSvgIcon('audit', 18)}</button>` : ''}
          ${canUserAccessSection('settings') ? `<button class="hub-dock-btn" id="dockSettings" title="الإعدادات">${getSvgIcon('settings', 18)}</button>` : ''}
          <div style="flex:1;"></div>
          <button class="hub-dock-btn" id="dockLogout" style="color:#ef4444;" title="تسجيل الخروج">${getSvgIcon('logout', 18)}</button>
        </aside>

        <!-- Workspace Area -->
        <main class="hub-workspace">
          
          <!-- Greeting Hero Row -->
          <div class="hub-hero">
            <div>
              <h1 class="hub-hero-title">مرحباً بعودتك، ${state.user.name}</h1>
            </div>
            <div class="hub-hero-controls">
              <div class="hub-date-badge">
                <span>${getSvgIcon('calendar', 14)}</span>
                <span>${new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <button class="hub-btn-primary" id="hubuickAddBtn">
                <span>${getSvgIcon('plus', 14)} إضافة سريعة</span>
                <span style="font-size:11px;">▾</span>
              </button>
            </div>
          </div>

          <!-- Master Modules Section -->
          <div style="margin-bottom:20px;">
            <div class="hub-modules-grid">
              ${MASTER_MODULES.filter(m => {
                if(canUserAccessSection(m.sec)) return true;
                if(m.chips && m.chips.some(c => c.sec && canUserAccessSection(c.sec))) return true;
                return false;
              }).map((m) => {
                let badgeTxt = '';
                if(m.id === 'maintenance') badgeTxt = `${inProgressRepairs} أجهزة بمركز الصيانة`;
                else if(m.id === 'sales') badgeTxt = `مبيعات اليوم: ${todaySalesTotal.toLocaleString()} ج.م`;
                else if(m.id === 'inventory') badgeTxt = `${(state.inventory||[]).length} صنف مسجل`;
                else if(m.id === 'finance') badgeTxt = `صافي اليومية: ${netCashToday>=0?'+':''}${netCashToday.toLocaleString()} ج.م`;
                else if(m.id === 'admin') badgeTxt = `${(state.users||[]).length} مستخدمين • ${pendingAuthsCount} تصاريح`;

                const allowedChips = m.chips.filter(chip => {
                  if(!chip.sec) return true;
                  return canUserAccessSection(chip.sec);
                });

                return `
                  <div class="hub-mod-card" data-mastersec="${m.sec}">
                    <div>
                      <div class="hub-mod-icon" style="background:${m.gradient};">
                        ${getSvgIcon(m.iconName || 'dashboard', 20)}
                      </div>
                      <h3 class="hub-mod-title">${m.title}</h3>
                      <div style="font-size:11px;font-weight:600;color:var(--ink-secondary);margin-bottom:6px;">${m.enTitle}</div>
                      <p class="hub-mod-desc">${m.desc}</p>
                      
                      <!-- Interactive Quick Sub-Links -->
                      <div class="hub-mod-chips">
                        ${allowedChips.map(chip => `
                          <span class="hub-mod-chip" data-chipact="${chip.action||''}" data-chipsec="${chip.sec||''}">
                            ${chip.label}
                          </span>
                        `).join('')}
                      </div>
                    </div>

                    <div class="hub-mod-foot">
                      <span style="font-size:11px;font-weight:700;color:var(--ink-secondary);">${badgeTxt}</span>
                      <span style="font-size:12px;font-weight:700;color:var(--primary);display:inline-flex;align-items:center;gap:4px;">دخول ${getSvgIcon('arrowLeft', 12)}</span>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- 3-Column Top Grid -->
          <div class="hub-top-grid">
            
            <!-- Card 1: Financial Liquidity & Cash Position -->
            ${(canUserAccessSection('daily') || canUserAccessSection('finance')) ? `
            <div class="hub-card">
              <div class="hub-card-head">
                <div>
                  <h3 class="hub-card-title">السيولة والخزينة النقدية</h3>
                </div>
                <div class="hub-popout-btn" id="hubard1Popout" title="الانتقال لليومية">${getSvgIcon('arrowLeft', 14)}</div>
              </div>

              <!-- Liquidity Stat Panel -->
              <div class="hub-liquidity-panel">
                <div class="hub-liquidity-title">الرصيد المتاح بالخزينة (ح/ 1101)</div>
                <div class="hub-liquidity-amount">${(currentDrawerCash || netCashToday || 0).toLocaleString()} <span style="font-size:13px;font-weight:600;color:var(--ink-secondary);">ج.م</span></div>
                <div class="hub-liquidity-flow">
                  <div class="hub-flow-stat">
                    <span class="hub-flow-lbl">مقبوضات اليوم</span>
                    <span class="hub-flow-val" style="color:var(--green-text);">${todayIncome.toLocaleString()} ج.م</span>
                  </div>
                  <div class="hub-flow-stat">
                    <span class="hub-flow-lbl">مصروفات اليوم</span>
                    <span class="hub-flow-val" style="color:var(--red-text);">${todayExpenses.toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>

              <!-- Net Cash Flow Summary -->
              <div class="hub-sub-metric">
                <div>
                  <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">صافي التدفق اليومي</div>
                  <div style="font-size:17px;font-weight:800;color:${netCashToday >= 0 ? 'var(--green-text)' : 'var(--red-text)'};margin-top:2px;font-family:var(--font-mono);">
                    ${netCashToday >= 0 ? '+' : ''}${netCashToday.toLocaleString()} <span style="font-size:11px;font-weight:600;">ج.م</span>
                  </div>
                </div>
                <span class="hub-badge-green">
                  <span>${netCashToday >= 0 ? 'فائض نقدي' : 'عجز مؤقت'}</span>
                  ${netCashToday >= 0 ? getSvgIcon('trendUp', 12) : getSvgIcon('trendDown', 12)}
                </span>
              </div>
            </div>
            ` : ''}

            <!-- Card 2: Operations Activity -->
            ${(canUserAccessSection('maintenance') || canUserAccessSection('pos')) ? `
            <div class="hub-card">
              <div class="hub-card-head">
                <div>
                  <h3 class="hub-card-title">حركة العمليات والتشغيل</h3>
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                  <div class="hub-popout-btn" id="hubard2Popout" title="الانتقال للصيانة">${getSvgIcon('arrowLeft', 14)}</div>
                </div>
              </div>

              <!-- 4-Stage Maintenance Funnel -->
              <div class="hub-ops-funnel">
                <div class="hub-ops-cell">
                  <span class="hub-ops-cell-lbl">قيد الفحص</span>
                  <span class="hub-ops-cell-val">${(state.receipts || []).filter(r => r.status === 'قيد الفحص').length}</span>
                </div>
                <div class="hub-ops-cell">
                  <span class="hub-ops-cell-lbl">قيد العمل</span>
                  <span class="hub-ops-cell-val" style="color:var(--primary);">${inProgressRepairs}</span>
                </div>
                <div class="hub-ops-cell">
                  <span class="hub-ops-cell-lbl">جاهز للتسليم</span>
                  <span class="hub-ops-cell-val" style="color:var(--green-text);">${readyRepairs}</span>
                </div>
                <div class="hub-ops-cell">
                  <span class="hub-ops-cell-lbl">تم تسليمه اليوم</span>
                  <span class="hub-ops-cell-val">${deliveredToday}</span>
                </div>
              </div>

              <!-- Activity Completion Metric -->
              <div class="hub-sub-metric" style="margin-top:auto;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="width:8px;height:8px;border-radius:50%;background:var(--primary);display:inline-block;"></span>
                  <span style="font-size:11.5px;color:var(--ink-secondary);font-weight:700;">أجهزة بالمركز حالياً: <b style="color:var(--ink);">${inProgressRepairs + readyRepairs}</b></span>
                </div>
                <span class="hub-badge-green">${readyRepairs} جاهز للعميل</span>
              </div>
            </div>
            ` : ''}

            <!-- Card 3: Sales Balance & Point of Sale -->
            ${(canUserAccessSection('pos') || canUserAccessSection('invoices')) ? `
            <div class="hub-card">
              <div class="hub-card-head">
                <div>
                  <h3 class="hub-card-title">المبيعات ونقطة البيع</h3>
                </div>
                <div class="hub-popout-btn" id="hubard3Popout" title="الانتقال لنقطة البيع">${getSvgIcon('arrowLeft', 14)}</div>
              </div>

              <div>
                <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">مبيعات اليوم النقدية</div>
                <div style="font-size:24px;font-weight:800;color:var(--ink);margin:2px 0 6px;font-family:var(--font-mono);">
                  ${todaySalesTotal.toLocaleString()} <span style="font-size:13px;font-weight:600;color:var(--ink-secondary);">ج.م</span>
                </div>
              </div>

              <!-- Area Sparkline Curve -->
              <div style="width:100%;height:58px;margin:2px 0 8px;overflow:hidden;">
                <svg viewBox="0 0 280 65" style="width:100%;height:100%;overflow:visible;">
                  <defs>
                    <linearGradient id="hubparkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stop-color="#059669" stop-opacity="0.3"/>
                      <stop offset="100%" stop-color="#059669" stop-opacity="0.0"/>
                    </linearGradient>
                  </defs>
                  <path d="M 0 52 Q 40 38, 80 44 T 160 22 T 220 30 T 280 8 L 280 65 L 0 65 Z" fill="url(#hubparkGrad)"/>
                  <path d="M 0 52 Q 40 38, 80 44 T 160 22 T 220 30 T 280 8" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round"/>
                  <circle cx="280" cy="8" r="4" fill="#059669" stroke="#ffffff" stroke-width="2"/>
                </svg>
              </div>

              <!-- Pill Actions: Deposit & Cash Out -->
              <div class="hub-pill-actions">
                <button class="hub-btn-action-green" id="hubtnDeposit">
                  <span>قبض وإيداع</span>
                  ${getSvgIcon('arrowUp', 12)}
                </button>
                <button class="hub-btn-action-light" id="hubtnWithdraw">
                  <span>صرف نقدي</span>
                  ${getSvgIcon('arrowDown', 12)}
                </button>
              </div>

              <!-- Accounts Receivable Box -->
              <div class="hub-sub-metric" style="margin-top:14px;">
                <div>
                  <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">مستحقات وفواتير آجلة</div>
                  <div style="font-size:15px;font-weight:800;color:var(--ink);margin-top:1px;font-family:var(--font-mono);">
                    ${receivablesTotal.toLocaleString()} <span style="font-size:10px;font-weight:700;color:var(--ink-secondary);">ج.م</span>
                  </div>
                </div>
                <div class="hub-avatar-group" title="فريق العمل">
                  <div class="hub-mini-avatar" style="background:var(--primary);">${(state.user.name||'U').slice(0,2).toUpperCase()}</div>
                  <div class="hub-mini-avatar" style="background:#0284c7;">مح</div>
                  <div class="hub-mini-avatar" style="background:#8b5cf6;">سع</div>
                  <div class="hub-mini-avatar" style="background:#64748b;font-size:10px;">+${(state.users||[]).length}</div>
                </div>
              </div>
            </div>
            ` : ''}

          </div>

          <!-- History Table Card -->
          <div class="hub-card" style="padding:20px 22px;">
            <div class="hub-card-head" style="margin-bottom:14px;">
              <div>
                <h3 class="hub-card-title" style="font-size:15px;">سجل العمليات والتحركات الأخيرة</h3>
              </div>
              <button class="btn btn-ghost btn-sm" id="hubiewAllHistory" style="border-radius:var(--radius-sm);font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:4px;">
                <span>عرض السجل الكامل باليومية</span>
                ${getSvgIcon('arrowLeft', 12)}
              </button>
            </div>

            <div class="hub-table-wrap">
              <table class="hub-history-table">
                <thead>
                  <tr>
                    <th>العملية / المستند</th>
                    <th>القسم</th>
                    <th>التاريخ والوقت</th>
                    <th>الحالة</th>
                    <th style="text-align:left;">القيمة المالية</th>
                    <th style="text-align:center;">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentOps.length === 0 ? `
                    <tr><td colspan="6" style="text-align:center;padding:30px;color:var(--ink-secondary);">لا توجد عمليات مسجلة حديثاً.</td></tr>
                  ` : recentOps.map((op, idx) => `
                    <tr>
                      <td>
                        <div style="display:flex;align-items:center;gap:12px;">
                          <div style="width:34px;height:34px;border-radius:var(--radius-sm);background:var(--paper3);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--ink);">
                            ${op.icon}
                          </div>
                          <div>
                            <div style="font-weight:700;color:var(--ink);font-size:13px;">${op.title}</div>
                            <div style="font-size:11px;color:var(--ink-secondary);margin-top:1px;">${op.sub}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style="display:inline-block;padding:3px 8px;border-radius:var(--radius-xs);font-size:11px;font-weight:700;background:rgba(5,150,105,0.08);color:${op.sectionColor};">
                          ${op.section}
                        </span>
                      </td>
                      <td style="color:var(--ink-secondary);font-size:12px;font-weight:600;">
                        ${op.date}
                      </td>
                      <td>
                        <span class="${op.statusClass}">
                          ${op.status}
                        </span>
                      </td>
                      <td style="text-align:left;font-family:var(--font-mono);font-weight:800;font-size:13px;color:${op.amount < 0 ? 'var(--red-text)' : 'var(--green-text)'};">
                        ${op.amount > 0 ? '+' : ''}${op.amount.toLocaleString()} ج.م
                      </td>
                      <td style="text-align:center;">
                        <button class="btn btn-ghost btn-sm hub-op-view-btn" data-optype="${op.type}" data-opidx="${idx}" style="padding:4px 10px;border-radius:var(--radius-sm);font-size:11.5px;font-weight:700;display:inline-flex;align-items:center;gap:4px;">
                          <span>عرض</span>
                          ${getSvgIcon('eye', 12)}
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          </main>
      </div>
    </div>
  `;

  // Attach Topbar Nav Pills
  const navPills = [
    { id: 'hubavDashboard', sec: null },
    { id: 'hubavMaint', sec: 'maintenance' },
    { id: 'hubavPos', sec: 'pos' },
    { id: 'hubavInv', sec: 'inventory' },
    { id: 'hubavFin', sec: 'cashdrawer' },
    { id: 'hubavAdmin', sec: 'audit' }
  ];
  navPills.forEach(item => {
    const el = document.getElementById(item.id);
    if(el){
      el.onclick = ()=>{
        let targetSec = item.sec;
        if(item.id === 'hubavPos'){
          targetSec = canUserAccessSection('pos') ? 'pos' : (canUserAccessSection('invoices') ? 'invoices' : 'cameras');
        } else if(item.id === 'hubavInv'){
          targetSec = canUserAccessSection('inventory') ? 'inventory' : 'barcode';
        } else if(item.id === 'hubavFin'){
          targetSec = canUserAccessSection('cashdrawer') ? 'cashdrawer' : (canUserAccessSection('daily') ? 'daily' : 'finance');
        } else if(item.id === 'hubavAdmin'){
          targetSec = canUserAccessSection('audit') ? 'audit' : (canUserAccessSection('users') ? 'users' : 'settings');
        }
        if(targetSec && canUserAccessSection(targetSec)){
          state.currentSection = targetSec;
          render();
        }
      };
    }
  });

  // Attach Topbar Actions
  const brandHome = document.getElementById('hubrandHome');
  if(brandHome) brandHome.onclick = ()=>{ state.currentSection = null; render(); };

  const searchBtn = document.getElementById('hubearchBtn');
  if(searchBtn) searchBtn.onclick = ()=>openCommandPalette();

  const notifBtn = document.getElementById('hubotifBtn');
  if(notifBtn) notifBtn.onclick = ()=>openNotificationCenterModal();

  const themeBtn = document.getElementById('hubhemeBtn');
  if(themeBtn) themeBtn.onclick = ()=>{
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
    renderExecutiveCommandCenter(app);
  };

  const userBtn = document.getElementById('hubserBtn');
  if(userBtn){
    userBtn.onclick = ()=>{
      if(canUserAccessSection('settings')){
        state.currentSection = 'settings';
        render();
      } else {
        showToast(`المستخدم الحالي: ${state.user ? state.user.name : ''} (${state.user && state.user.role === 'admin' ? 'مدير عام' : 'موظف'})`, 'info');
      }
    };
  }

  // Floating Side Dock Navigation
  const dockMap = [
    { id: 'dockHome', sec: null },
    { id: 'dockMaint', sec: 'maintenance' },
    { id: 'dockPos', sec: 'pos' },
    { id: 'dockInv', sec: 'inventory' },
    { id: 'dockBarcode', sec: 'barcode' },
    { id: 'dockCashdrawer', sec: 'cashdrawer' },
    { id: 'dockDaily', sec: 'daily' },
    { id: 'dockInvoice', sec: 'invoices' },
    { id: 'dockCameras', sec: 'cameras' },
    { id: 'dockAudit', sec: 'audit' },
    { id: 'dockSettings', sec: 'settings' }
  ];
  dockMap.forEach(d => {
    const btn = document.getElementById(d.id);
    if(btn){
      btn.onclick = ()=>{
        state.currentSection = d.sec;
        render();
      };
    }
  });
  const dockLogout = document.getElementById('dockLogout');
  if(dockLogout) dockLogout.onclick = logout;

  // Popout Buttons on 3 Top Cards
  const c1Pop = document.getElementById('hubard1Popout');
  if(c1Pop) c1Pop.onclick = ()=>{ state.currentSection = canUserAccessSection('cashdrawer') ? 'cashdrawer' : 'daily'; render(); };

  const c2Pop = document.getElementById('hubard2Popout');
  if(c2Pop) c2Pop.onclick = ()=>{ state.currentSection = 'maintenance'; render(); };

  const c3Pop = document.getElementById('hubard3Popout');
  if(c3Pop) c3Pop.onclick = ()=>{ state.currentSection = 'pos'; render(); };

  // Quick Action Buttons on Card 3
  const btnDeposit = document.getElementById('hubtnDeposit');
  if(btnDeposit){
    btnDeposit.onclick = ()=>{
      if(typeof openRecordTransactionModal === 'function'){
        openRecordTransactionModal('in');
      } else {
        state.currentSection = 'daily';
        render();
      }
    };
  }
  const btnWithdraw = document.getElementById('hubtnWithdraw');
  if(btnWithdraw){
    btnWithdraw.onclick = ()=>{
      if(typeof openRecordTransactionModal === 'function'){
        openRecordTransactionModal('out');
      } else {
        state.currentSection = 'daily';
        render();
      }
    };
  }

  // Quick Add Button (+ إضافة سريعة)
  const quickAddBtn = document.getElementById('hubuickAddBtn');
  if(quickAddBtn){
    quickAddBtn.onclick = (e)=>{
      e.stopPropagation();
      openCommandPalette();
    };
  }

  // History Table "View All" Button
  const viewAllBtn = document.getElementById('hubiewAllHistory');
  if(viewAllBtn){
    viewAllBtn.onclick = ()=>{ state.currentSection = 'daily'; render(); };
  }

  // Table row view buttons
  app.querySelectorAll('.hub-op-view-btn').forEach(btn => {
    btn.onclick = ()=>{
      const idx = Number(btn.dataset.opidx);
      const item = recentOps[idx];
      if(!item) return;
      if(item.type === 'receipt'){
        state.currentSection = 'maintenance';
        render();
        if(typeof openReceiptDetail === 'function') openReceiptDetail(item.raw);
      } else if(item.type === 'sale'){
        state.currentSection = 'pos';
        render();
      } else {
        state.currentSection = 'daily';
        render();
      }
    };
  });

  // Master Module Cards & Interactive Sub-Links
  app.querySelectorAll('.hub-mod-card').forEach(card => {
    card.onclick = (e)=>{
      // If a sub-chip was clicked, don't trigger the whole card
      if(e.target.closest('.hub-mod-chip')) return;
      let targetSec = card.dataset.mastersec;
      if(!canUserAccessSection(targetSec)){
        const cardTitle = card.querySelector('.hub-mod-title')?.innerText || '';
        if(cardTitle.includes('المالية') || cardTitle.includes('الخزينة')){
          targetSec = canUserAccessSection('cashdrawer') ? 'cashdrawer' : (canUserAccessSection('daily') ? 'daily' : (canUserAccessSection('finance') ? 'finance' : null));
        } else if(cardTitle.includes('المبيعات') || cardTitle.includes('POS')){
          targetSec = canUserAccessSection('pos') ? 'pos' : (canUserAccessSection('invoices') ? 'invoices' : (canUserAccessSection('cameras') ? 'cameras' : null));
        } else if(cardTitle.includes('المخازن')){
          targetSec = canUserAccessSection('inventory') ? 'inventory' : (canUserAccessSection('barcode') ? 'barcode' : null);
        } else if(cardTitle.includes('الإدارة') || cardTitle.includes('الرقابة')){
          targetSec = canUserAccessSection('audit') ? 'audit' : (canUserAccessSection('users') ? 'users' : (canUserAccessSection('settings') ? 'settings' : null));
        }
      }
      if(targetSec && canUserAccessSection(targetSec)){
        state.currentSection = targetSec;
        render();
      }
    };
  });

  app.querySelectorAll('.hub-mod-chip').forEach(chip => {
    chip.onclick = (e)=>{
      e.stopPropagation();
      const act = chip.dataset.chipact;
      const sec = chip.dataset.chipsec;
      if(act === 'new_receipt'){
        state.currentSection = 'maintenance';
        state.tab = 'new';
        render();
        if(typeof startNewDraft === 'function') startNewDraft();
      } else if(act === 'filter_active'){
        state.currentSection = 'maintenance';
        state.tab = 'list';
        render();
      } else if(act === 'filter_ready'){
        state.currentSection = 'maintenance';
        state.tab = 'list';
        render();
      } else if(act === 'new_invoice'){
        state.currentSection = 'invoices';
        render();
        if(typeof openInvoiceModal === 'function') openInvoiceModal();
      } else if(act === 'new_daily'){
        if(typeof openRecordTransactionModal === 'function'){
          openRecordTransactionModal('in');
        } else {
          state.currentSection = 'daily';
          render();
        }
      } else if(act === 'transfer_modal'){
        if(typeof openWarehouseTransferModal === 'function') openWarehouseTransferModal();
      } else if(act === 'warehouses_modal'){
        if(typeof openWarehouseManagerModal === 'function') openWarehouseManagerModal();
      } else if(sec){
        state.currentSection = sec;
        render();
      }
    };
  });
}

function renderSectionPicker(app){
  renderExecutiveCommandCenter(app);
}

function brandHtml(subtitle){
  const logoUrl = state.settings.logoUrl;
  return `<div class="brand">
    <div class="brand-logo-wrap">
      ${logoUrl ? `<img src="${logoUrl}" style="width:100%;height:100%;object-fit:contain;border-radius:var(--radius-sm);">` : getSvgIcon('logo', 20)}
    </div>
    <div class="brand-text" style="flex:1;min-width:0;">
      <h1 style="font-size:1.05rem;font-weight:800;color:var(--ink);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${state.settings.shopName || 'ميكروERP'}</h1>
      <span style="font-size:0.75rem;font-weight:600;color:var(--ink-secondary);">${subtitle || 'مركز الصيانة المعتمد'}</span>
    </div>
    <button type="button" class="sidebar-collapse-btn" id="sidebarCollapseBtn" title="طي القائمة الجانبية (Ctrl+B)">
      ${getSvgIcon('arrowRight', 14)}
    </button>
  </div>`;
}

function sectionSwitcherHtml(){
  const sections = state.user.sections || [];
  if(sections.length<=1) return '';
  return `<div class="nav-item" id="switchSectionBtn" style="color:var(--primary);border:1px solid rgba(5,150,105,0.22);margin:8px 12px 6px;background:var(--primary-light);border-radius:var(--radius-sm);font-weight:700;justify-content:center;box-shadow:var(--shadow-xs);transition:all 0.15s ease;">
    <span class="nav-item-icon" style="margin-left:4px;">${getSvgIcon('arrowRight', 14)}</span><span>الرجوع للمركز الرئيسي</span>
  </div>`;
}

function sidebarFootHtml(){
  return `<div class="sidebar-foot">
    <div class="user-card">
      <div class="user-avatar">${(state.user.name||'U')[0]}</div>
      <div class="user-info">
        <div class="user-name">${state.user.name}</div>
        <div class="role-badge">${state.user.role === 'admin' ? 'مدير عام' : 'مستخدم'}</div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">
      <button class="theme-toggle-btn" id="sidebarThemeToggle" style="font-size:11px;padding:4px 10px;background:var(--paper);color:var(--ink);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-weight:700;display:inline-flex;align-items:center;gap:5px;">${state.theme==='dark'?`${getSvgIcon('sun', 12)} فاتح`:`${getSvgIcon('moon', 12)} ليلي`}</button>
      <span id="logoutBtn" style="cursor:pointer;color:var(--red-text);font-size:11.5px;font-weight:700;display:inline-flex;align-items:center;gap:4px;">${getSvgIcon('logout', 13)} خروج</span>
    </div>
  </div>`;
}

function initSidebarToggle(){
  let expandBtn = document.getElementById('sidebarExpandBtn');
  if(!expandBtn){
    expandBtn = document.createElement('button');
    expandBtn.id = 'sidebarExpandBtn';
    expandBtn.className = 'sidebar-expand-btn';
    expandBtn.setAttribute('title', 'إظهار القائمة الجانبية (Ctrl+B)');
    expandBtn.innerHTML = `${getSvgIcon('dashboard', 14)}<span>القائمة</span>`;
    document.body.appendChild(expandBtn);
  }

  // Check persisted state
  if(state.sidebarCollapsed === undefined){
    state.sidebarCollapsed = localStorage.getItem('microerp_sidebar_collapsed') === 'true';
  }

  const sb = document.querySelector('.sidebar');
  if(sb){
    sb.classList.toggle('collapsed', !!state.sidebarCollapsed);
    expandBtn.classList.toggle('visible', !!state.sidebarCollapsed);
  } else {
    expandBtn.classList.remove('visible');
  }

  expandBtn.onclick = () => toggleSidebar(false);

  const cBtn = document.getElementById('sidebarCollapseBtn');
  if(cBtn){
    cBtn.onclick = () => toggleSidebar(true);
  }

  if(!window.__sidebarShortcutRegistered){
    window.__sidebarShortcutRegistered = true;
    window.addEventListener('keydown', (e) => {
      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b'){
        const tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if(tag !== 'input' && tag !== 'textarea' && !document.activeElement.isContentEditable){
          e.preventDefault();
          toggleSidebar();
        }
      }
    });
  }
}

function toggleSidebar(forceState){
  state.sidebarCollapsed = (forceState !== undefined) ? forceState : !state.sidebarCollapsed;
  try { localStorage.setItem('microerp_sidebar_collapsed', state.sidebarCollapsed ? 'true' : 'false'); } catch(e){}
  
  const sb = document.querySelector('.sidebar');
  const expandBtn = document.getElementById('sidebarExpandBtn');
  if(sb){
    sb.classList.toggle('collapsed', state.sidebarCollapsed);
  }
  if(expandBtn){
    expandBtn.classList.toggle('visible', state.sidebarCollapsed);
  }
}

function attachSidebarHandlers(){
  const lBtn = document.getElementById('logoutBtn');
  if(lBtn) lBtn.onclick = logout;
  const tBtn = document.getElementById('sidebarThemeToggle');
  if(tBtn) tBtn.onclick = ()=>{
    applyTheme(state.theme==='dark'?'light':'dark');
    render();
  };

  initSidebarToggle();
}

function logout(){
  const token = getSessionToken();
  if (token && navigator.onLine) {
    try { apiPost('logout', { sessionToken: token }).catch(()=>{}); } catch(e){}
  }
  try{
    localStorage.removeItem('microerp_session');
    sessionStorage.removeItem('microerp_session');
    localStorage.removeItem('microerp_session_token');
    sessionStorage.removeItem('microerp_session_token');
  }catch(e){}
  state.user = null;
  state.sessionToken = null;
  state.currentSection = null;
  render();
}

/* ---------------- Maintenance Section ---------------- */
function renderMaintenanceApp(app){
  const hasFinanceNav = canUserAccessSection('invoices') || canUserAccessSection('cashdrawer') || canUserAccessSection('daily');
  const hasAdminNav = canUserAccessSection('audit') || canUserAccessSection('users') || canUserAccessSection('settings');

  app.innerHTML = `
    <div class="sidebar">
      ${brandHtml("نظام إدارة الصيانة")}
      ${sectionSwitcherHtml()}
      <div class="sidebar-nav-wrap">
        <div class="nav-section">العمليات الأساسية</div>
        ${navItem('dashboard','dashboard','لوحة التحكم')}
        ${navItem('new','plus','إيصال استلام جديد')}
        ${navItem('archive','maintenance','أرشيف الصيانة')}
        ${navItem('customers','users','دليل وسجل العملاء')}

        ${hasFinanceNav ? `
          <div class="nav-section">الماليات والربط</div>
          ${canUserAccessSection('cashdrawer') ? `
            <div class="nav-item" id="maintToDrawerNav">
              <span class="nav-item-icon">${getSvgIcon('cashdrawer', 16)}</span><span>حركة الخزينة والدرج</span>
            </div>
          ` : ''}
          ${canUserAccessSection('daily') ? `
            <div class="nav-item" id="maintToDailyNav">
              <span class="nav-item-icon">${getSvgIcon('daily', 16)}</span><span>دفتر اليومية العامة</span>
            </div>
          ` : ''}
          ${canUserAccessSection('invoices') ? navItem('invoices','invoices','الفواتير وعروض الأسعار') : ''}
        ` : ''}

        <div class="nav-section">الأدوات والمخزن</div>
        ${canUserAccessSection('inventory') ? navItem('inventory','inventory','قطع غيار الصيانة') : ''}
        ${canUserAccessSection('barcode') ? `
          <div class="nav-item" id="maintToBarcodeNav">
            <span class="nav-item-icon">${getSvgIcon('barcode', 16)}</span><span>استوديو طباعة الباركود</span>
          </div>
        ` : ''}
        ${navItem('analytics','trendUp','التقارير والإحصائيات')}

        ${hasAdminNav ? `
          <div class="nav-section">الإدارة والتهيئة والرقابة</div>
          ${canUserAccessSection('audit') ? navItem('audit','audit',`الرقابة وسجل العمليات ${getPendingAuthCountBadge()}`) : ''}
          ${canUserAccessSection('users') ? navItem('users','users','المستخدمين والصلاحيات') : ''}
          ${canUserAccessSection('settings') ? navItem('settings','settings','مركز الإعدادات') : ''}
        ` : ''}
      </div>
      ${sidebarFootHtml()}
    </div>
    <main id="main"></main>
  `;
  const sw = document.getElementById('switchSectionBtn');
  if(sw) sw.onclick = ()=>{ state.currentSection = null; render(); };
  attachSidebarHandlers();

  document.querySelectorAll('.nav-item[data-tab]').forEach(el=>{
    el.onclick = ()=>{
      state.tab = el.dataset.tab;
      updateSidebarNav();
      if(state.tab==='new' && !state.draft){ startNewDraft(); }
      else { renderMain(); }
    };
  });

  const mDrw = document.getElementById('maintToDrawerNav');
  if(mDrw) mDrw.onclick = ()=>{ state.currentSection = 'cashdrawer'; render(); };
  const mDay = document.getElementById('maintToDailyNav');
  if(mDay) mDay.onclick = ()=>{ state.currentSection = 'daily'; render(); };
  const mBar = document.getElementById('maintToBarcodeNav');
  if(mBar) mBar.onclick = ()=>{ state.currentSection = 'barcode'; render(); };

  renderMain();
}

function navItem(tab, icon, label){
  let iconHtml = icon;
  if(SVG_ICONS[icon]){
    iconHtml = getSvgIcon(icon, 16);
  } else if(!icon || !icon.includes('<svg')) {
    const fallbackMap = {
      dashboard: 'dashboard',
      new: 'plus',
      archive: 'maintenance',
      customers: 'users',
      invoices: 'invoices',
      inventory: 'inventory',
      analytics: 'trendUp',
      audit: 'audit',
      users: 'users',
      settings: 'settings',
      pos: 'pos',
      finance: 'finance',
      cashdrawer: 'cashdrawer',
      daily: 'daily',
      barcode: 'barcode'
    };
    iconHtml = getSvgIcon(fallbackMap[tab] || 'dashboard', 16);
  }
  return `<div class="nav-item ${state.tab===tab?'active':''}" data-tab="${tab}">
    <span class="nav-item-icon">${iconHtml}</span><span>${label}</span>
  </div>`;
}

function updateSidebarNav(){
  try{
    const navs = document.querySelectorAll('.sidebar .nav-item[data-tab]');
    navs.forEach(el => {
      if(el.dataset.tab === state.tab){
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }catch(e){
    console.error('Error in updateSidebarNav:', e);
  }
}

/* ---------------- Main Router ---------------- */
function renderMain(){
  // Strict Safeguard: renderMain is exclusively the sub-router for the Maintenance section.
  // Under NO circumstances should it execute or modify the DOM if the user is in another section or on the section picker.
  if(state.currentSection !== 'maintenance') return;
  const main = document.getElementById('main');
  if(!main) return;
  if(state.tab==='settings' && !canUserAccessSection('settings')){ state.tab='dashboard'; }
  if(state.tab==='users' && !canUserAccessSection('users')){ state.tab='dashboard'; }
  if(state.tab==='audit' && !canUserAccessSection('audit')){ state.tab='dashboard'; }
  if(state.tab==='invoices' && !canUserAccessSection('invoices')){ state.tab='dashboard'; }
  if(state.tab==='inventory' && !canUserAccessSection('inventory')){ state.tab='dashboard'; }

  updateSidebarNav();
  if(typeof hideUnifiedSelectionBar === 'function' && state.tab !== 'archive' && state.tab !== 'customers' && state.tab !== 'dashboard'){
    hideUnifiedSelectionBar();
  }

  if(state.tab==='dashboard') return renderDashboard(main);
  if(state.tab==='new') return renderForm(main);
  if(state.tab==='archive') return renderArchive(main);
  if(state.tab==='customers') return renderCustomersPage(main);
  if(state.tab==='invoices') return renderInvoicesPage(main);
  if(state.tab==='analytics') return renderMaintenanceAnalytics(main);
  if(state.tab==='inventory') return renderInventory(main, 'صيانة', 'مخزن قطع الغيار');
  if(state.tab==='audit') return renderAuditCenterPage(main);
  if(state.tab==='users') return renderUsersManagementPage(main);
  if(state.tab==='settings') return renderSettings(main);
}

/* ---------------- Dashboard ---------------- */
function renderDashboard(main){
  const r = state.receipts || [];
  const today = (typeof localDateStr === 'function') ? localDateStr() : new Date().toISOString().slice(0,10);
  const inProgress = r.filter(x=>x.status==='قيد الفحص'||x.status==='الصيانة'||x.status==='بانتظار موافقة العميل'||x.status==='بانتظار قطعة غيار').length;
  const done = r.filter(x=>x.status==='مكتمل').length;
  const delivered = r.filter(x=>x.status==='تم التسليم').length;
  const todayIncome = (state.payments || []).filter(p=>String(p.Date||p.date||'').slice(0,10)===today).reduce((s,p)=>s+Number(p.Amount||p.amount||0),0);

  // 48h delayed in workshop (active maintenance taking >= 48 hours)
  const delayed48hList = r.filter(x => {
    if(x.status==='مكتمل' || x.status==='تم التسليم' || x.status==='ملغي' || x.status==='تعذرت الصيانة' || x.status==='رفض العميل') return false;
    const dStr = x.receivedAt || x.date || x.Date || '';
    if(!dStr) return false;
    const t = new Date(dStr).getTime();
    return !isNaN(t) && (Date.now() - t) / 3600000 >= 48;
  });

  // Overdue completed devices (> 7 days sitting on shelf)
  const overdueList = r.filter(x=>{
    if(x.status!=='مكتمل') return false;
    const dStr = x.updatedAt || x.receivedAt || x.date || x.Date || '';
    if(!dStr) return false;
    const t = new Date(dStr).getTime();
    return !isNaN(t) && (Date.now() - t) / 86400000 > 7;
  });

  // Remaining debt formula: Σ(Total - AmountPaid)
  const remainingDebt = r
    .filter(x => x.status !== 'ملغي' && x.status !== 'تعذرت الصيانة' && x.status !== 'رفض العميل')
    .reduce((s, x) => s + (typeof getReceiptRemaining === 'function' ? getReceiptRemaining(x) : Math.max(0, (Number(x.cost||0) + Number(x.partsCost||0) + Number(x.otherAccountAmount||0)) - Number(x.deposit||0) + Number(x.refunded||0))), 0);

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">لوحة التحكم — قسم الصيانة</h2>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <div id="networkSyncPill" class="sync-pill online" onclick="syncOfflineQueue(true)"><span style="width:7px;height:7px;border-radius:50%;background:var(--primary);display:inline-block;"></span> متصل</div>
        <button class="btn btn-ghost btn-sm" id="exportExcelDashBtn">${getSvgIcon('invoices', 14)} تصدير CSV (Excel)</button>
        <button class="btn btn-primary btn-sm" id="dashNewReceiptBtn">${getSvgIcon('plus', 14)} استلام جهاز جديد</button>
      </div>
    </div>

    <div class="stat-grid" style="grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));">
      <div class="stat-card blue" id="dashCardInProgress" style="cursor:pointer;" title="عرض الأجهزة قيد الفحص والصيانة">
        <div class="top-row">
          <span class="lbl">أجهزة قيد العمل</span>
          <div class="icon-box">${getSvgIcon('maintenance', 16)}</div>
        </div>
        <div class="num mono">${inProgress}</div>
      </div>
      <div class="stat-card green" id="dashCardDone" style="cursor:pointer;" title="عرض الأجهزة الجاهزة للتسليم">
        <div class="top-row">
          <span class="lbl">جاهزة للاستلام</span>
          <div class="icon-box">${getSvgIcon('check', 16)}</div>
        </div>
        <div class="num mono">${done}</div>
      </div>
      <div class="stat-card purple" id="dashCardDelivered" style="border-right-color:#8b5cf6;cursor:pointer;" title="عرض الأجهزة المسلمة">
        <div class="top-row">
          <span class="lbl">تم تسليمها للعملاء</span>
          <div class="icon-box">${getSvgIcon('check', 16)}</div>
        </div>
        <div class="num mono">${delivered}</div>
      </div>
      <div class="stat-card amber">
        <div class="top-row">
          <span class="lbl">مقبوضات اليوم</span>
          <div class="icon-box">${getSvgIcon('finance', 16)}</div>
        </div>
        <div class="num mono">${todayIncome.toLocaleString()} <span style="font-size:13px;font-weight:600;">ج.م</span></div>
      </div>
      <div class="stat-card amber" id="dashCardDelayed48h" style="border-right-color:#f59e0b;cursor:pointer;" title="أجهزة قيد الصيانة تجاوزت 48 ساعة بالورشة">
        <div class="top-row">
          <span class="lbl">متأخرة بالورشة (+48 س)</span>
          <div class="icon-box" style="color:#d97706;">${getSvgIcon('clock', 16)}</div>
        </div>
        <div class="num mono" style="color:#d97706;">${delayed48hList.length}</div>
      </div>
      <div class="stat-card red" id="dashCardOverdue7d" style="cursor:pointer;" title="أجهزة مكتملة لم يستلمها العملاء لأكثر من أسبوع">
        <div class="top-row">
          <span class="lbl">متروكة +7 أيام</span>
          <div class="icon-box">${getSvgIcon('alert', 16)}</div>
        </div>
        <div class="num mono">${overdueList.length}</div>
      </div>
      <div class="stat-card purple" style="border-right-color:#6366f1;">
        <div class="top-row">
          <span class="lbl">متبقي الصيانة والديون</span>
          <div class="icon-box">${getSvgIcon('finance', 16)}</div>
        </div>
        <div class="num mono" style="font-size:18px;">${remainingDebt.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
      </div>
      <div class="stat-card" id="dashCardTotal" style="cursor:pointer;" title="عرض كل أرشيف الصيانة">
        <div class="top-row">
          <span class="lbl">إجمالي الإيصالات</span>
          <div class="icon-box">${getSvgIcon('invoices', 16)}</div>
        </div>
        <div class="num mono">${r.length}</div>
      </div>
    </div>

    ${delayed48hList.length > 0 ? `
    <div class="card" style="border-right: 4px solid var(--amber);background:rgba(245,158,11,0.06);color:var(--amber-text);padding:14px 18px;margin-bottom:14px;border-radius:var(--radius-sm);">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div style="font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px;">
          ${getSvgIcon('alert', 16)}
          <span>تنبيه تشغيلي: يوجد <b>${delayed48hList.length}</b> أجهزة قيد الصيانة تجاوزت <b>48 ساعة</b> بالورشة دون إنجاز!</span>
        </div>
        <button class="btn btn-amber btn-sm" id="viewDelayed48hBtn">عرض الأجهزة المتأخرة بالورشة (${delayed48hList.length})</button>
      </div>
    </div>` : ''}

    ${overdueList.length > 0 ? `
    <div class="card" style="border-right: 4px solid var(--red);background:rgba(239,68,68,0.06);color:var(--red-text);padding:14px 18px;margin-bottom:14px;border-radius:var(--radius-sm);">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div style="font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px;">
          ${getSvgIcon('alert', 16)}
          <span>يوجد <b>${overdueList.length}</b> أجهزة مكتملة وجاهزة للاستلام لم يتسلمها العملاء منذ أكثر من <b>7 أيام</b>!</span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <button class="btn btn-whatsapp btn-sm" id="dashBulkOverdueWaBtn">${WA_ICON} إرسال تذكيرات واتساب</button>
          <button class="btn btn-amber btn-sm" id="viewOverdueBtn">عرض الأجهزة بالأرشيف</button>
        </div>
      </div>
    </div>` : ''}

    <div id="unifiedSelectionTopSlot"></div>

    <div class="card">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <h3>آخر الأجهزة المستلمة</h3>
          <div class="view-mode-toggle">
            <button type="button" class="view-mode-btn ${state.maintenanceViewMode!=='cards'?'active':''}" id="dashViewTableBtn" title="عرض جدول تفصيلي">جدول</button>
            <button type="button" class="view-mode-btn ${state.maintenanceViewMode==='cards'?'active':''}" id="dashViewCardsBtn" title="عرض بطاقات تفصيلية">بطاقات</button>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" id="dashViewAllBtn">عرض كل الأرشيف (${r.length})</button>
      </div>
      ${r.length===0 ? '<div class="empty">لا توجد أجهزة مسجلة بعد. ابدأ باستلام جهاز جديد.</div>' : renderMaintenanceView(r.slice(-6).reverse())}
    </div>
  `;

  const btnTable = document.getElementById('dashViewTableBtn');
  const btnCards = document.getElementById('dashViewCardsBtn');
  if(btnTable) btnTable.onclick = ()=>{
    state.maintenanceViewMode = 'table';
    try{ localStorage.setItem('microerp_maint_view_mode', 'table'); }catch(e){}
    renderMain();
  };
  if(btnCards) btnCards.onclick = ()=>{
    state.maintenanceViewMode = 'cards';
    try{ localStorage.setItem('microerp_maint_view_mode', 'cards'); }catch(e){}
    renderMain();
  };

  // Card click navigations
  const cardInProgress = document.getElementById('dashCardInProgress');
  if(cardInProgress) cardInProgress.onclick = ()=>{ state.archiveFilter.group = 'active'; state.tab = 'archive'; renderMain(); };

  const cardDone = document.getElementById('dashCardDone');
  if(cardDone) cardDone.onclick = ()=>{ state.archiveFilter.group = 'done'; state.tab = 'archive'; renderMain(); };

  const cardDelivered = document.getElementById('dashCardDelivered');
  if(cardDelivered) cardDelivered.onclick = ()=>{ state.archiveFilter.group = 'delivered'; state.tab = 'archive'; renderMain(); };

  const cardDelayed48h = document.getElementById('dashCardDelayed48h');
  if(cardDelayed48h) cardDelayed48h.onclick = ()=>{ state.archiveFilter.group = 'delayed48h'; state.tab = 'archive'; renderMain(); };

  const cardOverdue7d = document.getElementById('dashCardOverdue7d');
  if(cardOverdue7d) cardOverdue7d.onclick = ()=>{ state.archiveFilter.group = 'overdue'; state.tab = 'archive'; renderMain(); };

  const cardTotal = document.getElementById('dashCardTotal');
  if(cardTotal) cardTotal.onclick = ()=>{ state.archiveFilter.group = 'all'; state.tab = 'archive'; renderMain(); };

  updateSyncStatusPill();
  document.getElementById('dashNewReceiptBtn').onclick = ()=>{
    state.tab = 'new';
    startNewDraft();
  };
  document.getElementById('dashViewAllBtn').onclick = ()=>{
    state.tab = 'archive';
    renderMain();
  };
  document.getElementById('exportExcelDashBtn').onclick = ()=>exportReceiptsToExcel(state.receipts);

  const del48Btn = document.getElementById('viewDelayed48hBtn');
  if(del48Btn) del48Btn.onclick = ()=>{
    state.archiveFilter.group = 'delayed48h';
    state.tab = 'archive';
    renderMain();
  };

  const ovBtn = document.getElementById('viewOverdueBtn');
  if(ovBtn) ovBtn.onclick = ()=>{
    state.archiveFilter.group = 'overdue';
    state.tab = 'archive';
    renderMain();
  };
  const dashBulkWaBtn = document.getElementById('dashBulkOverdueWaBtn');
  if(dashBulkWaBtn) dashBulkWaBtn.onclick = ()=>openBulkOverdueWhatsappModal(7);
  attachRowActions(main);
  if(typeof window.renderUnifiedSelectionBar === 'function'){
    window.renderUnifiedSelectionBar();
  }
}

/* ---------------- Analytics & Charts ---------------- */
function renderMaintenanceAnalytics(main){
  const r = state.receipts;
  const totalCost = r.reduce((s,x)=>s+Number(x.cost||0),0);
  const totalParts = r.reduce((s,x)=>s+Number(x.partsCost||0),0);
  const completed = r.filter(x=>x.status==='مكتمل'||x.status==='تم التسليم').length;
  const completionRate = r.length ? Math.round((completed/r.length)*100) : 0;

  // Category counts
  const catCounts = {};
  r.forEach(x=>{ const c = x.device.category||'أخرى'; catCounts[c] = (catCounts[c]||0)+1; });

  // Tech counts
  const techCounts = {};
  r.forEach(x=>{
    const t = x.technician||'غير محدد';
    if(!techCounts[t]) techCounts[t] = {total:0, done:0, income:0};
    techCounts[t].total++;
    if(x.status==='مكتمل'||x.status==='تم التسليم') techCounts[t].done++;
    techCounts[t].income += Number(x.cost||0);
  });

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">التقارير والتحليلات البيانية</h2>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card green"><div class="num mono">${completionRate}%</div><div class="lbl">نسبة إنجاز الصيانة</div></div>
      <div class="stat-card blue"><div class="num mono">${totalCost.toLocaleString()} ج.م</div><div class="lbl">إجمالي قيمة الخدمات</div></div>
      <div class="stat-card amber"><div class="num mono">${totalParts.toLocaleString()} ج.م</div><div class="lbl">إجمالي تكلفة قطع الغيار</div></div>
      <div class="stat-card purple"><div class="num mono">${(totalCost-totalParts).toLocaleString()} ج.م</div><div class="lbl">صافي عائد الصيانة</div></div>
    </div>

    <div class="grid2">
      <div class="card">
        <h3>فئات الأجهزة الأكثر استلاماً</h3>
        <div style="margin-top:14px;">
          ${Object.entries(catCounts).sort((a,b)=>b[1]-a[1]).map(([cat,count])=>{
            const pct = Math.round((count/r.length)*100);
            return `<div style="margin-bottom:12px;">
              <div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:700;margin-bottom:4px;">
                <span>${cat}</span><span class="mono">${count} جهاز (${pct}%)</span>
              </div>
              <div style="background:var(--paper3);border-radius:4px;height:8px;overflow:hidden;">
                <div style="background:var(--primary);width:${pct}%;height:100%;border-radius:4px;"></div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <h3>إنتاجية وكفاءة الفنيين</h3>
        <div class="table-wrap" style="margin-top:12px;">
          <table>
            <thead><tr><th>الفني</th><th>المسند</th><th>المكتمل</th><th>نسبة النجاح</th><th>عائد الخدمات</th></tr></thead>
            <tbody>
              ${Object.entries(techCounts).map(([tech,stat])=>{
                const rate = stat.total ? Math.round((stat.done/stat.total)*100) : 0;
                return `<tr>
                  <td><b>${tech}</b></td>
                  <td class="mono">${stat.total}</td>
                  <td class="mono font-bold" style="color:var(--green);">${stat.done}</td>
                  <td class="mono">${rate}%</td>
                  <td class="mono font-bold">${stat.income.toLocaleString()} ج.م</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
