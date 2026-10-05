/* ---------------- POS Section ---------------- */
function renderPosApp(app){
  if(!state.posTab) state.posTab = 'sell';
  const hasHelpTools = canUserAccessSection('barcode') || canUserAccessSection('inventory') || canUserAccessSection('cashdrawer') || canUserAccessSection('daily') || canUserAccessSection('settings');

  app.innerHTML = `
    <div class="sidebar">
      ${brandHtml("نقطة البيع (POS)")}
      ${sectionSwitcherHtml()}
      <div class="sidebar-nav-wrap">
        <div class="nav-section">العمليات والمبيعات</div>
        <div class="nav-item ${state.posTab==='sell'?'active':''}" data-postab="sell">
          <span class="nav-item-icon">${getSvgIcon('pos', 16)}</span><span>بيع جديد (كاشير)</span>
        </div>
        <div class="nav-item ${state.posTab==='sales'?'active':''}" data-postab="sales">
          <span class="nav-item-icon">${getSvgIcon('chart', 16)}</span><span>سجل عمليات المبيعات</span>
        </div>

        ${hasHelpTools ? `
          <div class="nav-section">أدوات مساعدة</div>
          ${canUserAccessSection('barcode') ? `
            <div class="nav-item" id="posToBarcodeNav">
              <span class="nav-item-icon">${getSvgIcon('barcode', 16)}</span><span>استوديو طباعة الباركود</span>
            </div>
          ` : ''}
          ${canUserAccessSection('inventory') ? `
            <div class="nav-item" id="posToInvNav">
              <span class="nav-item-icon">${getSvgIcon('package', 16)}</span><span>المخزن والأصناف</span>
            </div>
          ` : ''}
          ${canUserAccessSection('cashdrawer') ? `
            <div class="nav-item" id="posToDrawerNav">
              <span class="nav-item-icon">${getSvgIcon('cashdrawer', 16)}</span><span>حركة الخزينة والدرج</span>
            </div>
          ` : ''}
          ${canUserAccessSection('daily') ? `
            <div class="nav-item" id="posToDailyNav">
              <span class="nav-item-icon">${getSvgIcon('daily', 16)}</span><span>دفتر اليومية العامة</span>
            </div>
          ` : ''}
          ${canUserAccessSection('settings') ? `
            <div class="nav-item" id="posToSettingsNav">
              <span class="nav-item-icon">${getSvgIcon('settings', 16)}</span><span>الإعدادات</span>
            </div>
          ` : ''}
        ` : ''}
      </div>
      ${sidebarFootHtml()}
    </div>
    <main id="main"></main>
  `;
  const sw = document.getElementById('switchSectionBtn');
  if(sw) sw.onclick = ()=>{ state.currentSection = null; render(); };
  attachSidebarHandlers();

  document.querySelectorAll('[data-postab]').forEach(el=>{
    el.onclick = ()=>{ state.posTab = el.dataset.postab; renderPosApp(app); };
  });

  const pBar = document.getElementById('posToBarcodeNav');
  if(pBar) pBar.onclick = ()=>{ state.currentSection = 'barcode'; render(); };
  const pInv = document.getElementById('posToInvNav');
  if(pInv) pInv.onclick = ()=>{ state.currentSection = 'inventory'; render(); };
  const pDrw = document.getElementById('posToDrawerNav');
  if(pDrw) pDrw.onclick = ()=>{ state.currentSection = 'cashdrawer'; render(); };
  const pDay = document.getElementById('posToDailyNav');
  if(pDay) pDay.onclick = ()=>{ state.currentSection = 'daily'; render(); };
  const pSet = document.getElementById('posToSettingsNav');
  if(pSet) pSet.onclick = ()=>{ state.currentSection = 'settings'; render(); };

  const main = document.getElementById('main');
  if(state.posTab==='sell') renderPosSell(main);
  else renderPosSalesLog(main);
}

/* ---------------- POS Held Carts Management (تعليق واسترجاع الفواتير والسلات المتعددة) ---------------- */
function getHeldCarts(){
  if(Array.isArray(state.heldCarts)) return state.heldCarts;
  try {
    const raw = localStorage.getItem('mterp_held_carts');
    if(raw){
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed)){
        state.heldCarts = parsed;
        return state.heldCarts;
      }
    }
  } catch(e){}
  state.heldCarts = [];
  return state.heldCarts;
}

function saveHeldCarts(carts){
  state.heldCarts = Array.isArray(carts) ? carts : [];
  try {
    localStorage.setItem('mterp_held_carts', JSON.stringify(state.heldCarts));
  } catch(e){}
}

function formatTimeAgo(isoString){
  if(!isoString) return '';
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if(diffSec < 60) return 'الآن';
  const diffMin = Math.floor(diffSec / 60);
  if(diffMin < 60) return `منذ ${diffMin} دقيقة`;
  const diffHours = Math.floor(diffMin / 60);
  if(diffHours < 24) return `منذ ${diffHours} ساعة`;
  const diffDays = Math.floor(diffHours / 24);
  return `منذ ${diffDays} يوم`;
}

function holdCurrentCart(){
  const cart = state.cart || [];
  if(!cart.length){
    showToast('السلة فارغة حالياً، أضف أصنافاً أولاً لتعليق الفاتورة', 'info');
    return;
  }
  const ps = state.posState || {};
  const subtotal = cart.reduce((s, c) => s + (Number(c.qty)||1) * (Number(c.price)||0), 0);
  const discountVal = Number(ps.discountValue) || 0;
  const discountAmount = ps.discountType === 'percent' 
    ? Math.round(subtotal * (discountVal / 100))
    : Math.min(subtotal, discountVal);
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const posSettings = typeof getPosSettings === 'function' ? getPosSettings() : {};
  const taxAmount = posSettings.enableTax ? Math.round(afterDiscount * (Number(posSettings.taxRate)||14) / 100) : 0;
  const grandTotal = afterDiscount + taxAmount;

  const heldList = getHeldCarts();
  const nextNum = heldList.length > 0 ? (Math.max(...heldList.map(h => h.holdNum || 1)) + 1) : 1;
  const custName = (ps.customerName && ps.customerName !== 'عميل زائر') ? ps.customerName : `عميل #${nextNum}`;

  const heldObj = {
    id: 'hold_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    holdNum: nextNum,
    timestamp: new Date().toISOString(),
    customerTitle: ps.customerTitle || '',
    customerName: custName,
    customerPhone: ps.customerPhone || '',
    notes: ps.notes || '',
    discountType: ps.discountType || 'fixed',
    discountValue: discountVal,
    paymentMethod: ps.paymentMethod || 'cash',
    cart: JSON.parse(JSON.stringify(cart)),
    subtotal: subtotal,
    grandTotal: grandTotal,
    itemsCount: cart.reduce((s, c) => s + (Number(c.qty) || 1), 0)
  };

  heldList.unshift(heldObj);
  saveHeldCarts(heldList);

  // Clear current active cart
  state.cart = [];
  if(state.posState){
    state.posState.customerTitle = '';
    state.posState.customerName = 'عميل زائر';
    state.posState.customerPhone = '';
    state.posState.discountValue = 0;
    state.posState.amountPaid = '';
    state.posState.notes = '';
  }

  showToast(`تم تعليق الفاتورة بنجاح (#${heldObj.holdNum} - ${custName})`, 'success');
  const main = document.getElementById('main') || document.querySelector('main');
  if(main) renderPosSell(main);
}

function resumeHeldCart(holdId){
  const heldList = getHeldCarts();
  const target = heldList.find(h => h.id === holdId);
  if(!target){
    showToast('لم يتم العثور على الفاتورة المعلقة', 'error');
    return;
  }

  // Check if active cart has items
  if(state.cart && state.cart.length > 0){
    const confirmSwap = confirm('توجد أصناف حالية في السلة! هل ترغب في استبدالها واسترجاع الفاتورة المعلقة؟\n(نصيحة: يمكنك تعليق الفاتورة الحالية أولاً لعدم فقدانها)');
    if(!confirmSwap) return;
  }

  state.cart = JSON.parse(JSON.stringify(target.cart || []));
  if(!state.posState) state.posState = {};
  state.posState.customerTitle = target.customerTitle || '';
  state.posState.customerName = target.customerName || 'عميل زائر';
  state.posState.customerPhone = target.customerPhone || '';
  state.posState.discountType = target.discountType || 'fixed';
  state.posState.discountValue = target.discountValue || 0;
  state.posState.paymentMethod = target.paymentMethod || 'cash';
  state.posState.notes = target.notes || '';
  state.posState.amountPaid = '';

  saveHeldCarts(heldList.filter(h => h.id !== holdId));

  const existingOverlay = document.getElementById('posHeldCartsModal');
  if(existingOverlay) existingOverlay.remove();

  showToast(`تم استرجاع الفاتورة المعلقة #${target.holdNum} بنجاح`, 'success');
  const main = document.getElementById('main') || document.querySelector('main');
  if(main) renderPosSell(main);
}

function openHeldCartsModal(){
  const existing = document.getElementById('posHeldCartsModal');
  if(existing) existing.remove();

  const heldList = getHeldCarts();

  const overlay = document.createElement('div');
  overlay.id = 'posHeldCartsModal';
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '10060';

  overlay.innerHTML = `
    <div class="modal-card" style="max-width:650px; width:95%; max-height:85vh; display:flex; flex-direction:column; background:var(--bg-card, #fff); border-radius:16px; overflow:hidden; border:1px solid var(--border-color, #cbd5e1); box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
      <!-- Header -->
      <div style="padding:14px 18px; background:linear-gradient(135deg, #1e293b, #0f172a); color:#fff; display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="width:36px; height:36px; border-radius:8px; background:rgba(245,158,11,0.2); display:flex; align-items:center; justify-content:center; color:#f59e0b; border:1px solid rgba(245,158,11,0.3);">${getSvgIcon('pause', 18)}</div>
          <div>
            <h3 style="margin:0; font-size:15px; font-weight:800; color:#fff;">سجل الفواتير المعلقة في نقطة البيع</h3>
            <div style="font-size:11.5px; color:#94a3b8;">إدارة واسترجاع السلات المحفوظة (${heldList.length} فواتير معلقة)</div>
          </div>
        </div>
        <button type="button" id="closeHeldCartsModalBtn" style="background:rgba(255,255,255,0.1); border:none; color:#cbd5e1; width:28px; height:28px; border-radius:50%; cursor:pointer; font-size:16px; line-height:1;">&times;</button>
      </div>

      <!-- Body -->
      <div style="padding:14px 18px; flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:10px; max-height:55vh;">
        ${heldList.length === 0 ? `
          <div style="text-align:center; padding:40px 20px; color:var(--ink-secondary);">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:50%;background:rgba(245,158,11,0.15);color:var(--amber-text);margin-bottom:8px;">${getSvgIcon('pause', 24)}</div>
            <div style="font-size:14px; font-weight:800; color:var(--ink); margin-bottom:4px;">لا توجد فواتير معلقة حالياً</div>
            <div style="font-size:12px; color:var(--ink-secondary);">يمكنك تعليق أي سلة نشطة في نقطة البيع عبر زر <b>تعليق الفاتورة (F6)</b> لخدمة عميل آخر فوراً دون فقدان الأصناف.</div>
          </div>
        ` : heldList.map(h => {
          const timeAgo = formatTimeAgo(h.timestamp);
          const itemsSummary = (h.cart || []).map(c => `${escapeHtml(c.name || 'صنف')} (x${c.qty||1})`).join('، ');
          return `
            <div class="card" style="padding:12px; border-radius:10px; border:1.5px solid var(--line); background:var(--paper2); display:flex; flex-direction:column; gap:8px;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="badge" style="background:rgba(245,158,11,0.15); color:var(--amber-text); font-weight:900; font-size:12px; padding:3px 8px; border-radius:6px;">
                    #${h.holdNum || 1}
                  </span>
                  <b style="font-size:13px; color:var(--ink);">${escapeHtml(h.customerName || 'عميل زائر')}</b>
                  ${h.customerPhone ? `<span class="mono" style="font-size:11px; color:var(--ink-secondary); direction:ltr;">${escapeHtml(h.customerPhone)}</span>` : ''}
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="mono" style="font-size:11px; color:var(--ink-secondary);">${timeAgo}</span>
                  <b class="mono" style="font-size:15px; color:var(--primary); font-weight:900;">${Number(h.grandTotal || h.subtotal || 0).toLocaleString()} ج.م</b>
                </div>
              </div>

              <!-- Items snippet -->
              <div style="font-size:11.5px; color:var(--ink-secondary); background:var(--paper); padding:6px 10px; border-radius:6px; border:1px solid var(--line); line-height:1.5;">
                <b>الأصناف (${h.itemsCount || (h.cart||[]).length}):</b> ${itemsSummary || 'بدون تفاصيل'}
                ${h.notes ? `<div style="font-size:10.5px; color:var(--amber-text); margin-top:2px;"><b>ملاحظات:</b> ${escapeHtml(h.notes)}</div>` : ''}
              </div>

              <!-- Actions -->
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
                <button type="button" class="btn btn-ghost btn-xs delete-held-cart-btn" data-id="${h.id}" style="color:var(--red); font-size:11px;">
                  ${getSvgIcon('trash', 12)} إلغاء وحذف
                </button>
                <button type="button" class="btn btn-primary btn-sm resume-held-cart-btn" data-id="${h.id}" style="font-weight:800; font-size:12px; padding:5px 14px; display:flex; align-items:center; gap:4px;">
                  <span>${getSvgIcon('arrowRight', 12)} استرجاع ومتابعة البيع</span>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Footer -->
      <div style="padding:12px 18px; background:var(--paper3); border-top:1px solid var(--line); display:flex; justify-content:space-between; align-items:center;">
        <div>
          ${heldList.length > 0 ? `
            <button type="button" class="btn btn-ghost btn-xs" id="clearAllHeldCartsBtn" style="color:var(--red); font-weight:700;">
              ${getSvgIcon('trash', 12)} تفريغ كافة المعلقات
            </button>
          ` : ''}
        </div>
        <button type="button" class="btn btn-secondary btn-sm" id="cancelHeldCartsModalBtn">إغلاق</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelectorAll('.resume-held-cart-btn').forEach(btn => {
    btn.onclick = () => resumeHeldCart(btn.dataset.id);
  });

  overlay.querySelectorAll('.delete-held-cart-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      if(confirm('هل تريد بالتأكيد حذف هذه الفاتورة المعلقة؟')){
        const list = getHeldCarts().filter(x => x.id !== id);
        saveHeldCarts(list);
        showToast('تم حذف الفاتورة المعلقة', 'info');
        openHeldCartsModal();
        const main = document.getElementById('main') || document.querySelector('main');
        if(main) renderPosSell(main);
      }
    };
  });

  const clearAllBtn = overlay.querySelector('#clearAllHeldCartsBtn');
  if(clearAllBtn){
    clearAllBtn.onclick = () => {
      if(confirm('هل تريد بالتأكيد تفريغ كافة الفواتير المعلقة؟')){
        saveHeldCarts([]);
        showToast('تم تفريغ كافة الفواتير المعلقة', 'info');
        overlay.remove();
        const main = document.getElementById('main') || document.querySelector('main');
        if(main) renderPosSell(main);
      }
    };
  }

  overlay.querySelector('#closeHeldCartsModalBtn').onclick = () => overlay.remove();
  overlay.querySelector('#cancelHeldCartsModalBtn').onclick = () => overlay.remove();
}

function renderPosSell(main){
  const posSettings = getPosSettings();
  const cart = state.cart || [];
  if(!state.posState) {
    state.posState = {
      activeCategory: 'all',
      searchQuery: '',
      paymentMethod: 'cash',
      amountPaid: '',
      discountType: 'fixed',
      discountValue: 0,
      customerName: 'عميل زائر',
      customerPhone: '',
      notes: ''
    };
  }
  const ps = state.posState;

  // Financial calculations
  const subtotal = cart.reduce((s, c) => s + (Number(c.qty)||1) * (Number(c.price)||0), 0);
  const discountVal = Number(ps.discountValue) || 0;
  const discountAmount = ps.discountType === 'percent' 
    ? Math.round(subtotal * (discountVal / 100))
    : Math.min(subtotal, discountVal);
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = posSettings.enableTax ? Math.round(afterDiscount * (Number(posSettings.taxRate)||14) / 100) : 0;
  const grandTotal = afterDiscount + taxAmount;
  
  const currentPaid = ps.amountPaid !== '' ? Number(ps.amountPaid) : grandTotal;
  const changeDue = Math.max(0, currentPaid - grandTotal);

  // Filter Catalog
  const rawInventory = state.inventory || [];
  let filteredItems = [...rawInventory];
  const shortcutSet = new Set((posSettings.shortcutItemIds || []).map(String));

  if(ps.activeCategory === 'favorites'){
    if(shortcutSet.size > 0){
      filteredItems = rawInventory.filter(it => shortcutSet.has(String(it.ID || it.id)));
    } else {
      filteredItems = filteredItems.filter(it => (it.Quantity > 0 || posSettings.allowNegativeStock));
    }
  } else if(ps.activeCategory === 'services'){
    filteredItems = []; // Handled separately in the services grid
  } else if(ps.activeCategory !== 'all'){
    filteredItems = filteredItems.filter(it => (it.Category || 'صيانة') === ps.activeCategory);
  }

  // Text / Barcode Search Filter
  if(ps.searchQuery && ps.searchQuery.trim()){
    const q = ps.searchQuery.trim().toLowerCase();
    filteredItems = filteredItems.filter(it => 
      (it.Name && it.Name.toLowerCase().includes(q)) || 
      (it.Barcode && String(it.Barcode).includes(q)) ||
      (it.Category && it.Category.toLowerCase().includes(q))
    );
  }

  // Active categories list
  const categoriesList = [
    { id: 'all', name: 'كل الأصناف', iconName: 'package' },
    { id: 'favorites', name: 'الأصناف الأكثر طلباً', iconName: 'dashboard' },
    { id: 'صيانة', name: 'قطع صيانة', iconName: 'maintenance' },
    { id: 'كمبيوتر', name: 'كمبيوتر ولابتوب', iconName: 'laptop' },
    { id: 'إكسسوار', name: 'إكسسوارات', iconName: 'headphones' },
    { id: 'كاميرات', name: 'كاميرات مراقبة', iconName: 'cameras' },
    { id: 'services', name: 'خدمات سريعة', iconName: 'pos' }
  ];

  // Enabled payment methods
  const enabledPayMethods = (posSettings.paymentMethods || []).filter(p => p.enabled !== false);
  const heldCartsCount = getHeldCarts().length;

  main.innerHTML = `
    <div class="top-header" style="margin-bottom:8px;">
      <div>
        <h2 class="page-title">نقطة البيع السريعة (POS Terminal)</h2>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <button class="btn btn-amber btn-sm" id="posOpenReturnBtn">${getSvgIcon('refresh', 14)} استرجاع فاتورة (14 يوم)</button>
        <button type="button" class="btn btn-blue btn-sm" id="posHoldCartBtn" title="تعليق السلة الحالية لخدمة عميل آخر (F6)">
          تعليق الفاتورة (Hold)
        </button>
        <button type="button" class="btn btn-ghost btn-sm" id="posHeldCartsBtn" style="position:relative;border:1.5px solid ${heldCartsCount > 0 ? 'var(--amber)' : 'var(--line)'};background:${heldCartsCount > 0 ? 'rgba(245,158,11,0.08)' : 'transparent'};font-weight:700;" title="عرض واسترجاع الفواتير المعلقة (F7)">
          <span>الفواتير المعلقة</span>
          ${heldCartsCount > 0 ? `
            <span class="badge" style="background:var(--amber);color:#fff;border-radius:999px;padding:1px 7px;font-size:11px;font-weight:900;margin-right:4px;box-shadow:0 1px 3px rgba(0,0,0,0.2);">
              ${heldCartsCount}
            </span>
          ` : ''}
        </button>
        <button class="btn btn-ghost btn-sm" id="posGoToSettingsBtn">${getSvgIcon('settings', 14)} إعدادات POS</button>
        <button class="btn btn-ghost btn-sm" id="posClearCartTopBtn" style="color:var(--red);">${getSvgIcon('trash', 14)} تفريغ السلة</button>
      </div>
    </div>

    <!-- Shift Status Ribbon -->
    ${state.activeShift ? `
      <div class="card" style="padding:10px 14px;margin-bottom:10px;background:var(--paper);border:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <span class="status-badge st-done" style="font-size:11.5px;padding:3px 8px;">
            الوردية مفتوحة #${state.activeShift.shiftNumber || 1}
          </span>
          <span style="font-size:12px;color:var(--ink);">
            الكاشير: <b>${escapeHtml(state.activeShift.cashierName || (state.user ? state.user.name : 'الكاشير'))}</b>
          </span>
          <span class="mono" style="font-size:11.5px;color:var(--ink-secondary);">
            بدأت: ${state.activeShift.startTime ? new Date(state.activeShift.startTime).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'}) : 'الآن'}
          </span>
          <span class="mono" style="font-size:11.5px;color:var(--ink-secondary);">
            عهدة البداية: <b>${Number(state.activeShift.openingFloat || 0).toLocaleString()} ج.م</b>
          </span>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          <button type="button" class="btn btn-ghost btn-sm" id="posPrintXReportBtn" style="background:var(--surface);border:1px solid var(--border);color:var(--ink);font-weight:700;">
            ${getSvgIcon('chart', 12)} تقرير لحظي (X-Report)
          </button>
          <button type="button" class="btn btn-red btn-sm" id="posCloseShiftBtn" style="font-weight:800;">
            ${getSvgIcon('lock', 12)} تقفيل الوردية (Z-Report)
          </button>
          <button type="button" class="btn btn-ghost btn-sm" id="posShiftsHistoryBtn" style="background:var(--surface);border:1px solid var(--border);" title="أرشيف الورديات السابقة">
            أرشيف الورديات
          </button>
        </div>
      </div>
    ` : `
      <div class="card" style="padding:10px 14px;margin-bottom:10px;background:var(--paper);border:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="display:inline-flex;color:var(--amber);">${getSvgIcon('alert', 18)}</span>
          <div>
            <div style="font-weight:800;font-size:12.5px;color:var(--ink);">لا توجد وردية كاشير مفتوحة حالياً</div>
            <div style="font-size:11px;color:var(--ink-secondary);">يُنصح بفتح وردية لتسجيل عهدة البداية واحتساب مبيعات وعجز/زيادة الصندوق بدقة.</div>
          </div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <button type="button" class="btn btn-primary btn-sm" id="posOpenShiftBtn" style="font-weight:800;">
            ${getSvgIcon('plus', 14)} فتح وردية جديدة
          </button>
          <button type="button" class="btn btn-ghost btn-sm" id="posShiftsHistoryBtn" style="background:var(--surface);border:1px solid var(--border);" title="أرشيف الورديات السابقة">
            أرشيف الورديات
          </button>
        </div>
      </div>
    `}

    <div class="pos-terminal-grid">

      <!-- Right Column: Interactive Cart & Payment Settlement Panel (شاشة البيع في اليمين) -->
      <div class="pos-cart-panel">
        
        <!-- Cart Header -->
        <div class="pos-cart-header">
          <div style="font-weight:900;font-size:13.5px;display:flex;align-items:center;gap:6px;">
            <span>سلة المبيعات</span>
            <span class="status-badge st-check" style="font-size:11px;">${cart.length} أصناف</span>
          </div>
          <div class="mono" style="font-size:11.5px;color:var(--ink-secondary);">
            الكاشير: <b>${state.user ? state.user.name : 'مسؤول'}</b>
          </div>
        </div>

        <!-- Customer Fields -->
        <div class="pos-cust-bar">
          <div class="field" style="margin:0;">
            <select id="posCustTitle" style="padding:4px 6px;font-size:11.5px;">
              ${[''].concat(CUSTOMER_TITLES).map(t=>`<option value="${escapeHtml(t)}" ${(ps.customerTitle||'')===t?'selected':''}>${t ? escapeHtml(t) : 'لقب'}</option>`).join('')}
            </select>
          </div>
          <div class="field" style="margin:0;">
            <input id="posCustName" placeholder="اسم العميل" value="${escapeHtml(ps.customerName||'عميل زائر')}" style="padding:4px 8px;font-size:11.5px;">
          </div>
          <div class="field" style="margin:0;">
            <input id="posCustPhone" placeholder="رقم الهاتف" value="${escapeHtml(ps.customerPhone||'')}" style="padding:4px 8px;font-size:11.5px;" class="mono">
          </div>
        </div>

        <!-- Cart Stream Items (Auto-flexing & internally scrollable) -->
        <div class="pos-cart-stream">
          ${cart.length === 0 ? `
            <div style="text-align:center;padding:24px 14px;color:var(--ink-secondary);font-size:12px;">
              <div style="margin-bottom:4px;color:var(--ink-secondary);opacity:0.4;">${getSvgIcon('pos', 24)}</div>
              السلة فارغة حالياً.<br>اضغط على أي صنف لإضافته فوراً.
            </div>
          ` : `
            ${cart.map((c, i) => `
              <div class="pos-cart-row">
                <div style="flex:1;min-width:0;">
                  <div style="font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--ink);">${escapeHtml(c.name)}</div>
                  <div class="mono" style="font-size:10.5px;color:var(--ink-secondary);">سعر: ${Number(c.price).toLocaleString()} ج.م</div>
                </div>

                <div class="pos-qty-pill">
                  <button class="pos-qty-btn" data-cartdec="${i}">-</button>
                  <input class="pos-qty-val mono" type="number" min="1" value="${c.qty}" data-cartqtyidx="${i}">
                  <button class="pos-qty-btn" data-cartinc="${i}">+</button>
                </div>

                <div class="mono font-bold" style="font-size:12px;min-width:55px;text-align:left;color:var(--primary);">
                  ${(Number(c.qty)*Number(c.price)).toLocaleString()}
                </div>

                <button class="btn btn-ghost btn-xs" data-cartdel="${i}" style="color:var(--red);padding:2px 5px;" title="حذف">${getSvgIcon('trash', 13)}</button>
              </div>
            `).join('')}
          `}
        </div>

        <!-- Discount & Summary Box -->
        <div class="pos-summary-box">
          
          <div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px;margin-bottom:4px;">
            <span>المجموع الفرعي:</span>
            <span class="mono font-bold">${subtotal.toLocaleString()} ج.م</span>
          </div>

          <!-- Quick Discount Row -->
          <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:4px;font-size:11.5px;">
            <div style="display:flex;align-items:center;gap:3px;">
              <span>الخصم:</span>
              <button class="btn btn-ghost btn-xs pos-disc-chip" data-disc="0" style="padding:1px 5px;font-size:10px;${discountVal===0?'background:var(--primary);color:#fff;':''}">0%</button>
              <button class="btn btn-ghost btn-xs pos-disc-chip" data-disc="5" style="padding:1px 5px;font-size:10px;${discountVal===5&&ps.discountType==='percent'?'background:var(--primary);color:#fff;':''}">5%</button>
              <button class="btn btn-ghost btn-xs pos-disc-chip" data-disc="10" style="padding:1px 5px;font-size:10px;${discountVal===10&&ps.discountType==='percent'?'background:var(--primary);color:#fff;':''}">10%</button>
            </div>
            <div style="display:flex;align-items:center;gap:3px;">
              <input type="number" id="posDiscountInput" value="${discountVal||''}" min="0" placeholder="0" class="mono font-bold" style="width:55px;padding:2px 4px;font-size:11px;text-align:center;">
              <select id="posDiscountType" style="padding:2px 3px;font-size:10.5px;">
                <option value="fixed" ${ps.discountType==='fixed'?'selected':''}>ج.م</option>
                <option value="percent" ${ps.discountType==='percent'?'selected':''}>%</option>
              </select>
            </div>
          </div>

          ${posSettings.enableTax ? `
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;margin-bottom:4px;color:var(--ink-secondary);">
              <span>ضريبة (${posSettings.taxRate}%):</span>
              <span class="mono font-bold">+${taxAmount.toLocaleString()} ج.م</span>
            </div>
          ` : ''}

          <!-- Grand Total Row -->
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px dashed var(--line);padding-top:4px;margin-top:2px;">
            <span style="font-weight:900;font-size:13px;">الإجمالي المطلوب:</span>
            <span class="mono font-bold" style="font-size:17px;color:var(--primary);">
              ${grandTotal.toLocaleString()} <span style="font-size:11px;font-weight:700;">ج.م</span>
            </span>
          </div>
        </div>

        <!-- Payment Methods Selector Tiles -->
        <div class="pos-pay-section">
          <label style="font-size:11px;font-weight:800;margin-bottom:4px;display:block;">طريقة الدفع:</label>
          <div class="pos-pay-grid">
            ${enabledPayMethods.map(pm => `
              <div class="pos-pay-btn ${ps.paymentMethod===pm.id?'selected':''}" data-pospaymethod="${pm.id}">
                <span>${getSvgIcon(pm.iconName || (pm.id==='card'?'creditCard':(pm.id==='instapay'?'refresh':(pm.id==='vodafone'?'phone':(pm.id==='credit'?'fileText':'dollar')))), 15)}</span>
                <span>${pm.name}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Cash Calculator (Amount Paid & Change) -->
        <div class="pos-change-box">
          <div style="flex:1;">
            <div style="font-size:10.5px;color:var(--ink-secondary);margin-bottom:1px;">المبلغ المدفوع (ج.م):</div>
            <input type="number" id="posAmountPaidInput" value="${ps.amountPaid!==''?ps.amountPaid:grandTotal}" class="mono font-bold" style="width:85px;padding:3px 6px;font-size:12.5px;">
          </div>
          <div style="text-align:left;">
            <div style="font-size:10.5px;color:var(--ink-secondary);margin-bottom:1px;">الباقي للعميل:</div>
            <div class="mono font-bold" style="font-size:15px;color:${changeDue>0?'var(--green-text)':'var(--ink)'};">
              ${changeDue.toLocaleString()} ج.م
            </div>
          </div>
        </div>

        <!-- Quick Cash Rounding Presets -->
        <div class="pos-presets-row">
          <button class="btn btn-ghost btn-xs pos-cash-preset-chip" data-cashamt="${grandTotal}" style="padding:1px 6px;font-size:10px;">تمام (${grandTotal})</button>
          ${[50, 100, 200, 500, 1000].filter(c => c >= grandTotal && c !== grandTotal).slice(0, 3).map(amt => `
            <button class="btn btn-ghost btn-xs pos-cash-preset-chip" data-cashamt="${amt}" style="padding:1px 6px;font-size:10px;">${amt} ج.م</button>
          `).join('')}
        </div>

        <!-- Final Checkout Buttons -->
        <div class="pos-checkout-actions">
          <button class="btn btn-green" id="completeSaleBtn" style="padding:9px;font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(16,185,129,0.3);" ${cart.length===0?'disabled':''}>
            <span>${getSvgIcon('check', 14)} إتمام البيع وطباعة البون السريع</span>
          </button>
          <button class="btn btn-blue" id="completeSaleWithTaxInvBtn" style="padding:7px;font-weight:800;font-size:11.5px;display:flex;align-items:center;justify-content:center;gap:6px;" ${cart.length===0?'disabled':''}>
            <span>${getSvgIcon('invoices', 14)} إتمام البيع وإصدار فاتورة ضريبية</span>
          </button>
          <button type="button" class="btn btn-ghost" id="posHoldCurrentCartQuickBtn" style="padding:6px;font-weight:800;font-size:11px;border:1px dashed var(--blue);color:var(--blue);display:flex;align-items:center;justify-content:center;gap:6px;" ${cart.length===0?'disabled':''}>
            <span>تعليق هذه الفاتورة لخدمة عميل آخر (Hold)</span>
          </button>
        </div>

      </div>

      <!-- Left Column: Catalog, Category Pills & Touch Tiles Grid (بطاقات الأصناف والبحث في اليسار) -->
      <div class="pos-catalog-panel">
        <!-- Search & Scanner Bar -->
        <div class="card" style="padding:8px 12px;margin-bottom:8px;flex-shrink:0;">
          <div style="display:flex;gap:8px;align-items:center;">
            <div style="flex:1;position:relative;">
              <input id="posBarcodeInput" placeholder="امسح الباركود أو ابحث بالاسم ثم اضغط Enter..." value="${escapeHtml(ps.searchQuery||'')}" autofocus style="padding-right:32px;font-weight:700;font-size:12.5px;padding-top:6px;padding-bottom:6px;">
              <span style="position:absolute;right:10px;top:50%;transform:translateY(-50%);display:inline-flex;color:var(--ink-secondary);">${getSvgIcon('barcode', 16)}</span>
            </div>
            ${ps.searchQuery ? `<button class="btn btn-ghost btn-sm" id="posClearSearchBtn" style="padding:4px 8px;font-size:11px;display:inline-flex;align-items:center;gap:4px;">${getSvgIcon('x', 12)} مسح</button>` : ''}
          </div>
        </div>

        <!-- Quick Category Pills -->
        <div class="pos-cat-scroll">
          ${categoriesList.map(cat => `
            <div class="pos-cat-chip ${ps.activeCategory===cat.id?'active':''}" data-poscat="${cat.id}">
              <span>${cat.name}</span>
            </div>
          `).join('')}
        </div>

        <!-- Touch Grid Container -->
        <div class="pos-tiles-container">
          ${ps.activeCategory === 'services' ? `
            <div style="margin-bottom:6px;font-size:12px;font-weight:800;color:var(--ink);">خدمات الصيانة والبرمجيات الفورية (دون رصيد مخزن):</div>
            <div class="pos-tiles-grid">
              ${(posSettings.quickServices||[]).map((srv, sIdx) => `
                <div class="pos-touch-tile" data-quickserviceidx="${sIdx}" style="border-color:var(--purple);background:rgba(139,92,246,0.04);">
                  <div class="pos-tile-head">
                    <span class="pos-tile-icon">${getSvgIcon('pos', 14)}</span>
                    <span class="pos-tile-stock" style="background:var(--purple-bg);color:var(--purple-text);">خدمة فورية</span>
                  </div>
                  <div class="pos-tile-title">${escapeHtml(srv.name)}</div>
                  <div class="pos-tile-price mono" style="color:var(--purple-text);">${Number(srv.price).toLocaleString()} <span style="font-size:10px;">ج.م</span></div>
                </div>
              `).join('')}
            </div>
          ` : `
            ${filteredItems.length === 0 ? `
              <div class="empty" style="padding:30px 16px;">
                <div style="margin-bottom:6px;color:var(--ink-secondary);opacity:0.4;">${getSvgIcon('package', 28)}</div>
                <div>لا توجد أصناف مطابقة للتصنيف أو البحث الحالي.</div>
                <div style="font-size:11px;color:var(--ink-secondary);margin-top:4px;">يمكنك إضافة أصناف جديدة من قسم المخزن والمشتريات أو تعيين أصناف سريعة.</div>
              </div>
            ` : `
              <div class="pos-tiles-grid">
                ${filteredItems.map(item => {
                  const qty = Number(item.Quantity) || 0;
                  const price = Number(item.SellPrice || item.PurchasePrice || 0);
                  const isOut = qty <= 0;
                  const isLow = qty > 0 && qty <= 2;
                  const itemId = String(item.ID || item.id);
                  const isPinned = shortcutSet.has(itemId);
                  return `
                    <div class="pos-touch-tile ${isOut?'out-of-stock':''}" data-positemid="${itemId}">
                      <div class="pos-tile-head">
                        <div style="display:flex;align-items:center;gap:4px;">
                          <span class="pos-tile-icon">${getSvgIcon(item.Category==='كمبيوتر'?'laptop':(item.Category==='كاميرات'?'cameras':(item.Category==='إكسسوار'?'headphones':'tool')), 16)}</span>
                          <button type="button" class="pos-pin-star-btn ${isPinned?'pinned':''}" data-pinitemid="${itemId}" title="${isPinned?'إلغاء التثبيت من الأصناف السريعة':'تثبيت كصنف سريع ومختصر في POS'}">
                            ${getSvgIcon('star', 13)}
                          </button>
                        </div>
                        <span class="pos-tile-stock" style="background:${isOut?'var(--red-bg)':(isLow?'var(--amber-bg)':'var(--green-bg)')};color:${isOut?'var(--red-text)':(isLow?'var(--amber-text)':'var(--green-text)')};">
                          ${isOut ? 'نفد' : `متوفر: ${qty}`}
                        </span>
                      </div>
                      <div class="pos-tile-title" title="${escapeHtml(item.Name)}">${escapeHtml(item.Name)}</div>
                      <div class="pos-tile-price mono">${price.toLocaleString()} <span style="font-size:10px;">ج.م</span></div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          `}
        </div>
      </div>

    </div>
  `;

  // Attach POS Handlers
  attachPosTerminalEvents(main, grandTotal, subtotal);
}

function attachPosTerminalEvents(main, grandTotal, subtotal){
  const ps = state.posState;
  const cart = state.cart || [];
  const posSettings = getPosSettings();

  // Toggle Pin / Shortcut from Touch Tile Star Button
  main.querySelectorAll('.pos-pin-star-btn').forEach(btn => {
    btn.onclick = async (e)=>{
      e.stopPropagation();
      e.preventDefault();
      const pinId = String(btn.dataset.pinitemid || '');
      if(!pinId) return;
      if(!Array.isArray(posSettings.shortcutItemIds)) posSettings.shortcutItemIds = [];
      const idx = posSettings.shortcutItemIds.indexOf(pinId);
      if(idx === -1){
        posSettings.shortcutItemIds.push(pinId);
        showToast('تمت إضافة الصنف إلى الأصناف السريعة', 'success');
      } else {
        posSettings.shortcutItemIds.splice(idx, 1);
        showToast('تمت إزالة الصنف من الأصناف السريعة', 'info');
      }
      state.settings.pos = posSettings;
      setCache('settings', state.settings);
      try {
        await saveSettingRemote('pos', JSON.stringify(posSettings));
      } catch(err){}
      renderPosSell(main);
    };
  });

  // Category change
  main.querySelectorAll('[data-poscat]').forEach(chip => {
    chip.onclick = ()=>{
      ps.activeCategory = chip.dataset.poscat;
      renderPosSell(main);
    };
  });

  // Touch Tiles click (Regular Items)
  main.querySelectorAll('[data-positemid]').forEach(tile => {
    tile.onclick = async ()=>{
      const itemId = tile.dataset.positemid;
      const item = (state.inventory||[]).find(x => String(x.ID||x.id) === String(itemId));
      if(!item) return;

      if(Number(item.Quantity) <= 0 && !posSettings.allowNegativeStock){
        showToast(`الصنف "${item.Name}" غير متوفر حالياً بالمخزن`, 'error');
        return;
      }

      await addItemToCart(item.ID||item.id, 1, main);
      showToast(`+ ${item.Name}`, 'info');
    };
  });

  // Touch Tiles click (Quick Services)
  main.querySelectorAll('[data-quickserviceidx]').forEach(tile => {
    tile.onclick = ()=>{
      const idx = Number(tile.dataset.quickserviceidx);
      const srv = (posSettings.quickServices||[])[idx];
      if(!srv) return;

      addServiceToCart(srv.name, srv.price, main);
      showToast(`+ ${srv.name}`, 'info');
    };
  });

  // Search input & Scanner Enter
  const barcodeInp = document.getElementById('posBarcodeInput');
  if(barcodeInp){
    barcodeInp.oninput = (e)=>{
      ps.searchQuery = e.target.value;
      // Auto-filter if non-enter typing
      if(!e.target.value.endsWith('\n')){
        // Debounced or live re-render
        renderPosSell(main);
        const refoc = document.getElementById('posBarcodeInput');
        if(refoc){ refoc.focus(); refoc.setSelectionRange(refoc.value.length, refoc.value.length); }
      }
    };

    barcodeInp.onkeydown = async (e)=>{
      if(e.key === 'Enter'){
        const code = barcodeInp.value.trim();
        if(!code) return;
        
        // Exact barcode match first
        const it = (state.inventory||[]).find(x => String(x.Barcode||'').trim() === code || String(x.ID||x.id) === code);
        if(it){
          if(Number(it.Quantity) <= 0 && !posSettings.allowNegativeStock){
            showToast('الصنف غير متاح في المخزون', 'error');
            return;
          }
          ps.searchQuery = '';
          await addItemToCart(it.ID||it.id, 1, main);
          showToast(`تم مسح وإضافة: ${it.Name}`, 'success');
        } else {
          // If 1 item filtered
          const filtered = (state.inventory||[]).filter(x => (x.Name&&x.Name.toLowerCase().includes(code.toLowerCase())));
          if(filtered.length === 1){
            ps.searchQuery = '';
            await addItemToCart(filtered[0].ID||filtered[0].id, 1, main);
            showToast(`تمت إضافة: ${filtered[0].Name}`, 'success');
          } else {
            showToast('لا يوجد صنف مطابق لهذا الباركود', 'error');
          }
        }
      }
    };
  }

  const clearSearchBtn = document.getElementById('posClearSearchBtn');
  if(clearSearchBtn){
    clearSearchBtn.onclick = ()=>{
      ps.searchQuery = '';
      renderPosSell(main);
    };
  }

  // Cart Quantities & Delete Handlers
  main.querySelectorAll('[data-cartinc]').forEach(btn => {
    btn.onclick = ()=>{
      const idx = Number(btn.dataset.cartinc);
      const cItem = cart[idx];
      if(cItem){
        if(cItem.itemId && !String(cItem.itemId).startsWith('srv_')){
          const it = (state.inventory||[]).find(x => String(x.ID||x.id) === String(cItem.itemId));
          const stock = it ? Number(it.Quantity || 0) : 0;
          if((Number(cItem.qty)||1) + 1 > stock){
            showToast(`الكمية المتاحة في المخزن فقط ${stock}`, 'error');
            return;
          }
        }
        cItem.qty = (Number(cItem.qty)||1) + 1;
        renderPosSell(main);
      }
    };
  });

  main.querySelectorAll('[data-cartdec]').forEach(btn => {
    btn.onclick = ()=>{
      const idx = Number(btn.dataset.cartdec);
      if(cart[idx]){
        if(cart[idx].qty > 1){
          cart[idx].qty = Number(cart[idx].qty) - 1;
        } else {
          cart.splice(idx, 1);
        }
        renderPosSell(main);
      }
    };
  });

  main.querySelectorAll('[data-cartdel]').forEach(btn => {
    btn.onclick = ()=>{
      const idx = Number(btn.dataset.cartdel);
      cart.splice(idx, 1);
      renderPosSell(main);
    };
  });

  main.querySelectorAll('[data-cartqtyidx]').forEach(inp => {
    inp.onchange = ()=>{
      const idx = Number(inp.dataset.cartqtyidx);
      const newQty = Number(inp.value);
      if(!newQty || newQty <= 0) cart.splice(idx, 1);
      else {
        const cItem = cart[idx];
        if(cItem && cItem.itemId && !String(cItem.itemId).startsWith('srv_')){
          const it = (state.inventory||[]).find(x => String(x.ID||x.id) === String(cItem.itemId));
          const stock = it ? Number(it.Quantity || 0) : 0;
          if(newQty > stock){
            showToast(`الكمية المطلوبة تتجاوز المخزون المتوفر (${stock})`, 'error');
            inp.value = cItem.qty;
            return;
          }
        }
        if(cItem) cItem.qty = newQty;
      }
      renderPosSell(main);
    };
  });

  // Customer info inputs
  const cTitleSel = document.getElementById('posCustTitle');
  if(cTitleSel) cTitleSel.onchange = (e)=>{ ps.customerTitle = extractCustomerTitle(e.target.value); };
  const cNameInp = document.getElementById('posCustName');
  if(cNameInp) cNameInp.oninput = (e)=>{
    ps.customerName = e.target.value;
    const parsed = parseCustomerTitleAndName(e.target.value);
    if(parsed.title && (!ps.customerTitle || ps.customerTitle === '')){
      ps.customerTitle = parsed.title;
      if(cTitleSel) cTitleSel.value = parsed.title;
    }
  };
  const cPhoneInp = document.getElementById('posCustPhone');
  if(cPhoneInp) cPhoneInp.oninput = (e)=>{ ps.customerPhone = e.target.value; };

  // Discount Presets & Inputs
  main.querySelectorAll('.pos-disc-chip').forEach(chip => {
    chip.onclick = ()=>{
      ps.discountValue = Number(chip.dataset.disc);
      ps.discountType = 'percent';
      renderPosSell(main);
    };
  });

  const discInp = document.getElementById('posDiscountInput');
  if(discInp){
    discInp.oninput = (e)=>{
      ps.discountValue = Number(e.target.value) || 0;
      renderPosSell(main);
    };
  }

  const discTypeSel = document.getElementById('posDiscountType');
  if(discTypeSel){
    discTypeSel.onchange = (e)=>{
      ps.discountType = e.target.value;
      renderPosSell(main);
    };
  }

  // Payment Method Selection
  main.querySelectorAll('[data-pospaymethod]').forEach(btn => {
    btn.onclick = ()=>{
      ps.paymentMethod = btn.dataset.pospaymethod;
      renderPosSell(main);
    };
  });

  // Amount Paid input
  const amtPaidInp = document.getElementById('posAmountPaidInput');
  if(amtPaidInp){
    amtPaidInp.oninput = (e)=>{
      ps.amountPaid = e.target.value;
      const num = Number(e.target.value) || 0;
      const changeEl = main.querySelector('.pos-change-box .mono.font-bold');
      if(changeEl){
        const change = Math.max(0, num - grandTotal);
        changeEl.textContent = `${change.toLocaleString()} ج.م`;
        changeEl.style.color = change > 0 ? 'var(--green-text)' : 'var(--ink)';
      }
    };
  }

  // Quick Cash Chips
  main.querySelectorAll('.pos-cash-preset-chip').forEach(chip => {
    chip.onclick = ()=>{
      const amt = Number(chip.dataset.cashamt);
      ps.amountPaid = amt;
      renderPosSell(main);
    };
  });

  // Top Buttons
  const clearTopBtn = document.getElementById('posClearCartTopBtn');
  if(clearTopBtn){
    clearTopBtn.onclick = ()=>{
      if(confirm('هل تريد بالتأكيد إفراغ السلة؟')){
        state.cart = [];
        renderPosSell(main);
      }
    };
  }

  const goToSettingsBtn = document.getElementById('posGoToSettingsBtn');
  if(goToSettingsBtn){
    goToSettingsBtn.onclick = ()=>{
      state.currentSection = 'settings';
      state.settingsTab = 'pos';
      render();
    };
  }

  const posReturnBtn = document.getElementById('posOpenReturnBtn');
  if(posReturnBtn){
    posReturnBtn.onclick = ()=>openPosReturnLookupModal();
  }

  const posHoldBtn = document.getElementById('posHoldCartBtn');
  const posHoldQuickBtn = document.getElementById('posHoldCurrentCartQuickBtn');
  if(posHoldBtn) posHoldBtn.onclick = () => holdCurrentCart();
  if(posHoldQuickBtn) posHoldQuickBtn.onclick = () => holdCurrentCart();

  const posHeldCartsBtn = document.getElementById('posHeldCartsBtn');
  if(posHeldCartsBtn) posHeldCartsBtn.onclick = () => openHeldCartsModal();

  const posOpenShiftBtn = document.getElementById('posOpenShiftBtn');
  if(posOpenShiftBtn){
    posOpenShiftBtn.onclick = () => openStartShiftModal(() => renderPosSell(main));
  }

  const posCloseShiftBtn = document.getElementById('posCloseShiftBtn');
  if(posCloseShiftBtn){
    posCloseShiftBtn.onclick = () => openCloseShiftModal();
  }

  const posPrintXReportBtn = document.getElementById('posPrintXReportBtn');
  if(posPrintXReportBtn){
    posPrintXReportBtn.onclick = () => {
      const active = getActiveShift();
      if(active) openShiftPrint(active, 'X', 'thermal');
      else showToast('لا توجد وردية نشطة حالياً', 'error');
    };
  }

  const posShiftsHistoryBtn = document.getElementById('posShiftsHistoryBtn');
  if(posShiftsHistoryBtn){
    posShiftsHistoryBtn.onclick = () => openShiftsHistoryModal();
  }

  // Complete Sale Logic
  async function processSale(isTaxInvoice){
    if(!state.activeShift){
      showToast('لا يمكن إتمام البيع دون فتح وردية نشطة. يرجى فتح الوردية أولاً.', 'error');
      if(typeof openStartShiftModal === 'function'){
        openStartShiftModal(() => {
          if(typeof renderPosSell === 'function') renderPosSell(main);
        });
      }
      return;
    }
    if(!cart.length){ showToast('السلة فارغة', 'error'); return; }

    // Pre-flight inventory stock check
    for(const c of cart){
      if(c.itemId && !String(c.itemId).startsWith('srv_')){
        const it = (state.inventory||[]).find(x => String(x.ID||x.id) === String(c.itemId));
        const stock = it ? Number(it.Quantity || 0) : 0;
        if(Number(c.qty || 1) > stock){
          showToast(`عفواً، الكمية المطلوبة من (${c.name}) غير متوفرة. الرصيد الحالي: ${stock}`, 'error');
          return;
        }
      }
    }

    const customerTitle = (ps.customerTitle || '').trim();
    const customerName = (ps.customerName || 'عميل زائر').trim();
    const customerPhone = (ps.customerPhone || '').trim();
    const payMethodObj = (posSettings.paymentMethods||[]).find(p => p.id === ps.paymentMethod) || { name: 'نقدي' };
    const payMethodName = payMethodObj.name || 'نقدي';

    const btn = document.getElementById(isTaxInvoice ? 'completeSaleWithTaxInvBtn' : 'completeSaleBtn');
    if(btn){ btn.disabled = true; btn.textContent = 'جارٍ تسجيل العملية...'; }

    try {
      // Capture items snapshot with unit cost at sale time (costAtSale) [F4]
      let hasZeroCost = false;
      const zeroCostItems = [];
      const cartSnapshot = cart.map(c => {
        let cost = 0;
        if(c.itemId && !String(c.itemId).startsWith('srv_')){
          const it = (state.inventory||[]).find(x => String(x.ID) === String(c.itemId));
          if(it && Number(it.PurchasePrice) > 0){
            cost = Number(it.PurchasePrice);
          } else if(c.itemId && !String(c.itemId).startsWith('srv_')){
            hasZeroCost = true;
            zeroCostItems.push(c.name);
          }
        }
        return {
          ...c,
          costAtSale: cost,
          purchasePrice: cost
        };
      });

      // Update local inventory quantities immediately
      for(const c of cartSnapshot){
        if(c.itemId && !String(c.itemId).startsWith('srv_')){
          const it = (state.inventory||[]).find(x => x.ID === c.itemId);
          if(it) it.Quantity = Math.max(0, Number(it.Quantity||0) - Number(c.qty||1));
        }
      }
      setCache('inventory', state.inventory);

      if(hasZeroCost){
        recordAuditLog('تحذير تكلفة المخزون', 'المبيعات', `تم بيع أصناف بدون سعر تكلفة مسجل: (${zeroCostItems.join('، ')}) - تم تسجيل COGS بـ 0 والتنبيه لتحديث سعر التكلفة بالمخزن`, customerName);
      }

      const itemsSummary = cartSnapshot.map(c => `${c.name} × ${c.qty} (${(c.qty*c.price).toLocaleString()} ج.م)`).join('، ');
      const itemsJson = JSON.stringify(cartSnapshot.map(c => ({
        name: c.name,
        qty: c.qty,
        price: c.price,
        itemId: c.itemId,
        costAtSale: c.costAtSale,
        purchasePrice: c.purchasePrice
      })));
      
      const paidAmount = ps.amountPaid !== '' ? Number(ps.amountPaid) : grandTotal;
      const fullCustName = customerTitle ? `${customerTitle} / ${customerName}` : customerName;
      const saleRes = await saveSaleRemote(itemsSummary, itemsJson, grandTotal, fullCustName, customerPhone, payMethodName, paidAmount, cartSnapshot, taxAmount, changeDue);
      
      showToast('تمت عملية البيع بنجاح', 'success');

      const saleData = saleRes.sale || {
        ID: 's_' + Date.now(),
        Date: new Date().toISOString().slice(0,10),
        Total: grandTotal,
        AmountPaid: paidAmount,
        PaymentMethod: payMethodName,
        CustomerTitle: customerTitle,
        CustomerName: customerName,
        CustomerPhone: customerPhone
      };

      // Reset Cart and State
      state.cart = [];
      state.posState.amountPaid = '';
      state.posState.discountValue = 0;
      state.posState.searchQuery = '';
      renderPosSell(main);

      if(isTaxInvoice){
        convertSaleToInvoice(saleData.ID);
      } else {
        if(posSettings.autoPrintReceipt !== false){
          openSalePrint(saleData, cartSnapshot, { subtotal, discountAmount, taxAmount, grandTotal, paidAmount, changeDue, payMethodName });
        }
      }
    } catch(e) {
      showToast('تم تسجيل البيع محلياً', 'info');
      if(btn) btn.disabled = false;
    }
  }

  const completeBtn = document.getElementById('completeSaleBtn');
  if(completeBtn) completeBtn.onclick = ()=>processSale(false);
  const completeTaxBtn = document.getElementById('completeSaleWithTaxInvBtn');
  if(completeTaxBtn) completeTaxBtn.onclick = ()=>processSale(true);
}

async function addItemToCart(itemId, qty, main){
  if(!state.cart) state.cart = [];
  const item = (state.inventory||[]).find(x => String(x.ID||x.id) === String(itemId));
  if(!item) return;

  const currentStock = Number(item.Quantity || 0);
  if(currentStock <= 0){
    showToast(`عفواً، صنف (${item.Name || item.name}) غير متوفر بالمخزن`, 'error');
    return;
  }

  const existing = state.cart.find(c => String(c.itemId) === String(itemId));
  const currentCartQty = existing ? Number(existing.qty || 0) : 0;
  if(currentCartQty + qty > currentStock){
    showToast(`الكمية المطلوبة تتجاوز الرصيد المتوفر (${currentStock})`, 'error');
    return;
  }

  if(existing){
    existing.qty += qty;
  } else {
    state.cart.push({
      itemId: item.ID || item.id,
      name: item.Name || item.name,
      qty: qty,
      price: Number(item.SellPrice || item.PurchasePrice || item.price || 0),
      cost: Number(item.PurchasePrice || item.cost || 0)
    });
  }
  renderPosSell(main);
}

function addServiceToCart(serviceName, servicePrice, main){
  if(!state.cart) state.cart = [];
  const srvId = 'srv_' + serviceName;
  const existing = state.cart.find(c => c.itemId === srvId);
  if(existing){
    existing.qty += 1;
  } else {
    state.cart.push({
      itemId: srvId,
      name: serviceName,
      qty: 1,
      price: Number(servicePrice) || 0,
      cost: 0
    });
  }
  renderPosSell(main);
}

/* ---------------- Enhanced Thermal Receipt Print Engine for Xprinter 808 (80mm / 58mm) & Windows 11 ---------------- */
function openSalePrint(sale, cartItems, meta={}){
  const posSettings = getPosSettings();
  const prnSettings = getPrintersSettings();
  const rPrn = prnSettings.receiptPrinter || DEFAULT_PRINTERS_SETTINGS.receiptPrinter;
  const old = document.getElementById('printMount');
  if(old) old.remove();

  const shopName = (state.settings && state.settings.shopName) || 'صيانة ميكروتك';
  const logoUrl = state.settings && state.settings.logoUrl;
  const cashierName = state.user ? state.user.name : 'الكاشير';
  const paperSize = rPrn.paperSize || posSettings.receiptPaperSize || '80mm';
  const is58mm = paperSize === '58mm';
  const fontScale = rPrn.fontScale || 'compact'; // 'compact' (نصف الحجم موفر للورق), 'normal', 'large'
  const isCompact = fontScale === 'compact';
  const isLarge = fontScale === 'large' || fontScale === 'max';

  // Responsive typography & spacing (نصف الحجم للنصف مع وضوح عالي للبيانات)
  const szShop = isCompact ? (is58mm ? '12.5px' : '14px') : (isLarge ? (is58mm ? '17px' : '21px') : (is58mm ? '14px' : '17px'));
  const szSub = isCompact ? '8.5px' : (isLarge ? '12px' : '10.5px');
  const szBadge = isCompact ? '9px' : (isLarge ? '14px' : '11.5px');
  const szMeta = isCompact ? '9px' : (isLarge ? '12.5px' : '11px');
  const szTableH = isCompact ? '9px' : (isLarge ? '13.5px' : '11px');
  const szItemName = isCompact ? '9.5px' : (isLarge ? '14px' : '12px');
  const szItemNum = isCompact ? '10px' : (isLarge ? '14.5px' : '12.5px');
  const szTotalLbl = isCompact ? '10.5px' : (isLarge ? '16px' : '13.5px');
  const szTotalAmt = isCompact ? (is58mm ? '14px' : '16px') : (isLarge ? (is58mm ? '19px' : '24px') : (is58mm ? '16px' : '19px'));
  const szFooter = isCompact ? '8.5px' : (isLarge ? '12px' : '10px');
  const padTable = isCompact ? '1px 0.5mm' : (isLarge ? '3px 0.5mm' : '2px 0.5mm');
  const logoH = isCompact ? 28 : (isLarge ? 48 : 36);
  const barcodeH = isCompact ? 18 : (isLarge ? 26 : 22);

  const subtotal = meta.subtotal != null ? meta.subtotal : cartItems.reduce((s,c)=>s+c.qty*c.price,0);
  const grandTotal = meta.grandTotal != null ? meta.grandTotal : sale.Total;
  const discountAmt = meta.discountAmount || 0;
  const taxAmt = meta.taxAmount || 0;
  const paidAmt = meta.paidAmount != null ? meta.paidAmount : (sale.AmountPaid != null ? sale.AmountPaid : grandTotal);
  const changeAmt = meta.changeDue != null ? meta.changeDue : Math.max(0, paidAmt - grandTotal);
  const payMethod = meta.payMethodName || sale.PaymentMethod || 'نقدي';
  const cutterFeed = rPrn.cutterFeedMm != null ? rPrn.cutterFeedMm : (isCompact ? 4 : 8);

  const receiptId = String(sale.ID || Date.now()).slice(-8);

  const mount = document.createElement('div');
  mount.id = 'printMount';

  // Inject print styles calibrated for Windows 11 & Xprinter 80mm / 58mm thermal rolls
  let receiptStyle = document.getElementById('dynamicThermalReceiptStyle');
  if(!receiptStyle){
    receiptStyle = document.createElement('style');
    receiptStyle.id = 'dynamicThermalReceiptStyle';
    document.head.appendChild(receiptStyle);
  }

  // Exact 72mm printable width for 80mm roll on Xprinter 808 to eliminate the 1cm side margin
  const thermalPrintWidth = is58mm ? '48mm' : (rPrn.paperSize === '76mm' ? '70mm' : '72mm');

  receiptStyle.innerHTML = `
    @media print {
      @page {
        size: ${paperSize} auto !important;
        margin: 0mm !important;
      }
      @page :left { margin: 0mm !important; }
      @page :right { margin: 0mm !important; }
      @page :first { margin: 0mm !important; }
      html, body {
        width: 100% !important;
        max-width: ${thermalPrintWidth} !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        position: static !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body.printing-pos-receipt {
        width: 100% !important;
        max-width: ${thermalPrintWidth} !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      body.printing-pos-receipt #app,
      body.printing-pos-receipt .sidebar,
      body.printing-pos-receipt .top-header,
      body.printing-pos-receipt #toastContainer,
      body.printing-pos-receipt .cmd-palette-overlay {
        display: none !important;
      }
      body.printing-pos-receipt #printMount {
        display: block !important;
        width: 100% !important;
        max-width: ${thermalPrintWidth} !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
      .pos-thermal-receipt {
        width: 100% !important;
        max-width: ${thermalPrintWidth} !important;
        margin: 0 !important;
        padding: 0 0.5mm ${cutterFeed}mm 0.5mm !important;
        box-sizing: border-box !important;
        font-family: 'Segoe UI', Tahoma, Arial, sans-serif !important;
        font-size: ${szItemNum} !important;
        font-weight: 900 !important;
        color: #000000 !important;
        background: #ffffff !important;
        line-height: 1.25 !important;
        direction: rtl !important;
        text-align: right !important;
      }
      .pos-thermal-receipt * {
        color: #000000 !important;
        box-sizing: border-box !important;
      }
      .pos-thermal-receipt table {
        width: 100% !important;
        border-collapse: collapse !important;
        margin: ${isCompact ? '2px 0' : '3px 0'} !important;
      }
      .pos-thermal-receipt th, .pos-thermal-receipt td {
        padding: ${padTable} !important;
        vertical-align: middle !important;
      }
      .pos-thermal-receipt th {
        border-top: 1.5px solid #000000 !important;
        border-bottom: 1.5px solid #000000 !important;
        font-size: ${szTableH} !important;
        font-weight: 900 !important;
      }
      .pos-thermal-receipt td {
        border-bottom: 1px dashed #000000 !important;
        font-size: ${szItemName} !important;
        font-weight: 900 !important;
      }
      .pos-thermal-receipt .r-divider {
        border-top: 1.5px dashed #000000 !important;
        margin: ${isCompact ? '3px 0' : '5px 0'} !important;
      }
      .pos-thermal-receipt .r-divider-solid {
        border-top: 1.5px solid #000000 !important;
        margin: ${isCompact ? '3px 0' : '5px 0'} !important;
      }
    }
  `;

  mount.innerHTML = `
    <div class="pos-thermal-receipt" style="text-align:center;padding:0 0.5mm;">
      
      <!-- Header & Store Identity -->
      ${rPrn.showLogo && logoUrl ? `<div style="text-align:center;margin-bottom:2px;"><img src="${logoUrl}" style="max-height:${logoH}px;max-width:140px;object-fit:contain;"></div>` : ''}
      <div style="font-size:${szShop};font-weight:900;margin-bottom:1px;line-height:1.15;color:#000;">${escapeHtml(shopName)}</div>
      ${state.settings && state.settings.shopPhone ? `<div style="font-size:${szSub};font-weight:900;margin-bottom:1px;">هاتف: <span class="mono">${escapeHtml(state.settings.shopPhone)}</span></div>` : ''}
      ${state.settings && state.settings.shopAddress ? `<div style="font-size:${szSub};font-weight:800;margin-bottom:1px;">${escapeHtml(state.settings.shopAddress)}</div>` : ''}
      ${state.settings && state.settings.shopTaxNumber ? `<div style="font-size:${szSub};font-weight:900;">س.ت / ضريبي: <span class="mono">${escapeHtml(state.settings.shopTaxNumber)}</span></div>` : ''}
      
      <div style="font-size:${szBadge};font-weight:900;border:1.5px solid #000;border-radius:3px;padding:1px 0;margin:${isCompact ? '2px 0' : '4px 0'};text-align:center;background:#f5f5f5;">
        إيصال مبيعات نقدية (POS)
      </div>

      <!-- Receipt Meta Info -->
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:${szMeta};font-weight:900;margin-bottom:1.5px;text-align:right;">
        <span>رقم الإيصال: <b class="mono" style="font-size:${szItemNum};">#${receiptId}</b></span>
        <span class="mono" style="font-size:${szSub};">${cleanDate(sale.Date)} ${new Date().toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'})}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:${szMeta};font-weight:900;margin-bottom:${isCompact ? '2px' : '3px'};text-align:right;">
        <span>العميل: <b>${escapeHtml(sale.CustomerName||'عميل زائر')}</b></span>
        ${rPrn.showCashier ? `<span>الكاشير: <b>${escapeHtml(cashierName)}</b></span>` : ''}
      </div>

      <!-- Items Table -->
      <table style="text-align:right;">
        <thead>
          <tr>
            <th style="text-align:right;">الصنف والبيان</th>
            <th style="text-align:center;width:28px;">كمية</th>
            <th style="text-align:center;width:48px;">السعر</th>
            <th style="text-align:left;width:58px;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${cartItems.map(c => `
            <tr>
              <td style="font-weight:900;line-height:1.2;font-size:${szItemName};">${escapeHtml(c.name)}</td>
              <td style="text-align:center;font-weight:900;font-size:${szItemNum};" class="mono">${c.qty}</td>
              <td style="text-align:center;font-weight:900;font-size:${szItemNum};" class="mono">${Number(c.price).toLocaleString()}</td>
              <td style="text-align:left;font-weight:900;font-size:${szItemNum};" class="mono">${(Number(c.qty)*Number(c.price)).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Financial Totals Block -->
      <div style="font-size:${szMeta};font-weight:900;text-align:right;margin-top:${isCompact ? '2px' : '3px'};">
        <div style="display:flex;justify-content:space-between;margin-bottom:1.5px;">
          <span>المجموع الفرعي:</span>
          <span class="mono">${subtotal.toLocaleString()} ج.م</span>
        </div>
        ${discountAmt > 0 ? `
          <div style="display:flex;justify-content:space-between;margin-bottom:1.5px;">
            <span>الخصم الممنوح:</span>
            <span class="mono font-bold">-${discountAmt.toLocaleString()} ج.م</span>
          </div>
        ` : ''}
        ${taxAmt > 0 ? `
          <div style="display:flex;justify-content:space-between;margin-bottom:1.5px;">
            <span>ضريبة القيمة المضافة:</span>
            <span class="mono">+${taxAmt.toLocaleString()} ج.م</span>
          </div>
        ` : ''}
        
        <!-- High-Contrast Grand Total -->
        <div style="display:flex;justify-content:space-between;align-items:center;border-top:2px solid #000;border-bottom:2px solid #000;padding:${isCompact ? '2.5px 1px' : '5px 1px'};margin:${isCompact ? '3px 0' : '5px 0'};background:#f9f9f9;">
          <span style="font-size:${szTotalLbl};font-weight:900;">الإجمالي النهائي:</span>
          <span class="mono" style="font-size:${szTotalAmt};font-weight:900;color:#000;">${grandTotal.toLocaleString()} ج.م</span>
        </div>

        <div style="display:flex;justify-content:space-between;margin-bottom:1.5px;font-size:${szSub};">
          <span>طريقة الدفع:</span>
          <span><b>${escapeHtml(payMethod)}</b></span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:1.5px;font-size:${szSub};">
          <span>المبلغ المدفوع:</span>
          <span class="mono font-bold">${paidAmt.toLocaleString()} ج.م</span>
        </div>
        ${changeAmt > 0 ? `
          <div style="display:flex;justify-content:space-between;font-size:${szMeta};font-weight:900;border-top:1px dashed #000;padding-top:1.5px;margin-top:1.5px;">
            <span>الباقي للعميل:</span>
            <span class="mono">${changeAmt.toLocaleString()} ج.م</span>
          </div>
        ` : ''}
      </div>

      <div class="r-divider"></div>

      <!-- Vector Barcode -->
      ${rPrn.printBarcode ? `
        <div style="text-align:center;margin:${isCompact ? '3px 0 1px' : '5px 0 2px'};">
          <svg id="saleReceiptBarcodeSvg" style="max-height:${barcodeH}px;max-width:170px;margin:0 auto;"></svg>
        </div>
      ` : ''}

      <!-- Footer Notes -->
      <div style="font-size:${szFooter};font-weight:900;color:#000;margin-top:2px;line-height:1.25;">
        ${escapeHtml(rPrn.footerText || posSettings.receiptFooter || 'شكراً لتعاملكم معنا • نسعد دائماً بخدمتكم')}
      </div>
      <div style="font-size:${isCompact ? '7.5px' : '9.5px'};font-weight:800;color:#333;margin-top:1px;">
        ميكروERP • نظام إدارة المبيعات والصيانة
      </div>

      <!-- Cutter clearance space -->
      <div style="height:${cutterFeed}mm;"></div>
    </div>
  `;

  document.body.appendChild(mount);
  document.body.classList.add('printing-pos-receipt');

  // Render Barcode
  if(rPrn.printBarcode && typeof JsBarcode !== 'undefined'){
    try {
      JsBarcode('#saleReceiptBarcodeSvg', receiptId, {
        format: 'CODE128',
        width: is58mm ? 1.1 : (isCompact ? 1.25 : 1.5),
        height: barcodeH,
        displayValue: true,
        fontSize: isCompact ? 9 : 10.5,
        margin: 0
      });
    } catch(e){}
  }

  const cleanupReceipt = ()=>{
    if(mount && mount.parentNode) mount.remove();
    document.body.classList.remove('printing-pos-receipt');
    if(receiptStyle && receiptStyle.parentNode) receiptStyle.remove();
    window.removeEventListener('afterprint', cleanupReceipt);
  };
  window.addEventListener('afterprint', cleanupReceipt);

  setTimeout(()=>{
    window.print();
    setTimeout(cleanupReceipt, 800);
  }, 120);
}

function convertSaleToInvoice(saleId){
  const s = state.sales.find(x => x.ID === saleId) || (saleId.startsWith('s_') ? { ID: saleId, Date: new Date().toISOString().slice(0,10), Total: 0 } : null);
  if(!s){ showToast('تعذر العثور على عملية البيع', 'error'); return; }

  // Check if this sale already has an invoice issued
  const existing = state.invoices.find(inv => inv.ReferenceType==='POS' && (inv.ReferenceID===s.ID || inv.ReferenceID===s.ID.slice(-8)));
  if(existing){
    if(confirm(`تم إصدار فاتورة ضريبية سابقة لهذه العملية برقم (${existing.InvoiceNumber}). هل ترغب في فتح الفاتورة المسجلة؟`)){
      openInvoiceModal(existing);
      return;
    }
  }

  // Parse items
  let items = [];
  if(s.ItemsJSON){
    try {
      const parsed = typeof s.ItemsJSON==='string' ? JSON.parse(s.ItemsJSON) : s.ItemsJSON;
      if(Array.isArray(parsed)){
        items = parsed.map(p=>({
          Name: p.name || p.Name || 'صنف مباع',
          Qty: Number(p.qty || p.Qty || 1),
          Price: Number(p.price || p.Price || 0),
          Total: Number(p.qty || p.Qty || 1) * Number(p.price || p.Price || 0)
        }));
      }
    }catch(e){}
  }
  if(!items.length && s.ItemsSummary){
    items = [{
      Name: s.ItemsSummary,
      Qty: 1,
      Price: Number(s.Total||0),
      Total: Number(s.Total||0)
    }];
  }

  const subtotal = items.reduce((sum,it)=>sum+Number(it.Total||0),0) || Number(s.Total||0);
  const paid = Number(s.AmountPaid!=null ? s.AmountPaid : s.Total);
  const remaining = Math.max(0, subtotal - paid);

  const prefilled = {
    ID: 'inv_' + Date.now(),
    InvoiceNumber: (typeof nextInvoiceNumber === 'function') ? nextInvoiceNumber() : ('INV-' + new Date().getFullYear() + '-0001'),
    Date: cleanDate(s.Date) || new Date().toISOString().slice(0,10),
    DueDate: cleanDate(s.Date) || new Date().toISOString().slice(0,10),
    CustomerName: s.CustomerName || 'عميل زائر',
    CustomerPhone: s.CustomerPhone || '',
    CustomerTaxNumber: '',
    CustomerAddress: '',
    Items: items,
    ItemsSummary: s.ItemsSummary || items.map(i=>i.Name).join(' + '),
    Subtotal: subtotal,
    TaxPercent: 0,
    TaxAmount: 0,
    Discount: 0,
    Total: subtotal,
    AmountPaid: paid,
    Remaining: remaining,
    Status: remaining <= 0 ? 'مدفوعة بالكامل' : 'مدفوعة جزئياً',
    PaymentMethod: s.PaymentMethod || 'نقدي',
    ReferenceType: 'POS',
    ReferenceID: s.ID.slice(-8),
    Notes: `فاتورة ضريبية رسمية صادرة عن عملية مبيعات نقطة البيع رقم #${s.ID.slice(-8)}`
  };

  openInvoiceModal(prefilled, true);
}

function exportSalesToExcel(sales){
  if(!sales || !sales.length){ showToast('لا توجد مبيعات للتصدير', 'error'); return; }
  const headers = ['رقم العملية','التاريخ','اسم العميل','الهاتف','الأصناف','الإجمالي','المدفوع','طريقة الدفع'];
  const rows = sales.map(s=>[
    `"${s.ID.slice(-8)}"`, cleanDate(s.Date), `"${s.CustomerName||'عميل زائر'}"`, `"${s.CustomerPhone||''}"`,
    `"${(s.ItemsSummary||'').replace(/"/g, '""')}"`, s.Total||0, s.AmountPaid!=null?s.AmountPaid:s.Total, `"${s.PaymentMethod||'نقدي'}"`
  ]);
  downloadCSV(`POS_Sales_${new Date().toISOString().slice(0,10)}.csv`, headers, rows);
}

function renderPosSalesLog(main){
  if(!state.posSalesSearchQ) state.posSalesSearchQ = '';
  const rawList = state.sales || [];
  let list = [...rawList];

  const q = state.posSalesSearchQ.trim().toLowerCase();
  if(q){
    list = list.filter(s =>
      (s.ID||'').toLowerCase().includes(q) ||
      (s.CustomerName||'').toLowerCase().includes(q) ||
      (s.CustomerPhone||'').includes(q) ||
      (s.ItemsSummary||'').toLowerCase().includes(q)
    );
  }

  const todayStr = new Date().toISOString().slice(0,10);
  const totalSalesCount = rawList.length;
  const totalSalesRevenue = rawList.reduce((sum,s)=>sum+Number(s.Total||0),0);
  const todaySalesRevenue = rawList.filter(s=>cleanDate(s.Date)===todayStr).reduce((sum,s)=>sum+Number(s.Total||0),0);

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">سجل مبيعات نقطة البيع (POS Log)</h2>
        <div class="subtitle mono" style="font-size:12px;color:var(--ink-secondary);">${list.length} عملية مسجلة</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost btn-sm" id="exportSalesExcelBtn">${getSvgIcon('download', 14)} تصدير المبيعات Excel</button>
        <button class="btn btn-primary btn-sm" id="goToNewSaleBtn">${getSvgIcon('plus', 14)} بيع جديد</button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="stat-grid">
      <div class="stat-card blue">
        <div class="top-row"><span class="lbl">إجمالي عمليات البيع</span><div class="icon-box">${getSvgIcon('pos', 16)}</div></div>
        <div class="num mono">${totalSalesCount}</div>
      </div>
      <div class="stat-card green">
        <div class="top-row"><span class="lbl">إجمالي إيراد المبيعات</span><div class="icon-box">${getSvgIcon('dollar', 16)}</div></div>
        <div class="num mono">${totalSalesRevenue.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
      </div>
      <div class="stat-card purple">
        <div class="top-row"><span class="lbl">مبيعات اليوم (${todayStr})</span><div class="icon-box">${getSvgIcon('trendUp', 16)}</div></div>
        <div class="num mono">${todaySalesRevenue.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="filters-bar" style="margin-bottom:14px;">
      <input id="posSalesSearchInp" placeholder="بحث برقم العملية، اسم العميل، الهاتف، أو اسم الصنف المباع..." value="${state.posSalesSearchQ}" style="flex:1;">
      ${state.posSalesSearchQ ? `<button class="btn btn-ghost btn-sm" id="clearPosSalesSearch">مسح البحث</button>` : ''}
    </div>

    <div id="unifiedSelectionTopSlot"></div>

    <div class="card">
      ${list.length===0 ? '<div class="empty">لا توجد مبيعات مطابقة للبحث.</div>' : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:110px;">رقم العملية</th>
              <th style="width:105px;">التاريخ</th>
              <th>العميل</th>
              <th>الأصناف المباعة</th>
              <th style="width:115px;text-align:center;">الإجمالي</th>
              <th style="width:100px;text-align:center;">طريقة الدفع</th>
              <th style="width:100px;text-align:center;">الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${list.slice().reverse().map(s=>{
              const isSelected = String(state.selectedSaleId) === String(s.ID);
              const cPhone = String(s.CustomerPhone || '').trim();
              const cleanPhone = cPhone.replace(/\D/g, '');
              const phoneFormatted = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
              const waMsg = `مرحبًا ${s.CustomerName || 'عميلنا العزيز'}،\nإيصال مبيعات رقم: #${s.ID.slice(-8)}\nالأصناف: ${s.ItemsSummary}\nالإجمالي: ${s.Total} ج.م\nشكرًا لتعاملكم مع ${state.settings.shopName || 'ميكروتك'}.`;
              const waUrl = cleanPhone ? `https://wa.me/${phoneFormatted}?text=${encodeURIComponent(waMsg)}` : '';

              return `
                <tr class="${isSelected ? 'selected-row' : ''}" data-sale-id="${s.ID}" onclick="handleSaleRowClick('${s.ID}', event)" ondblclick="openPosReceiptDirect('${s.ID}')" style="cursor:pointer;" title="انقر لتحديد عملية البيع واستخدام الشريط العلوي، أو نقر مزدوج للطباعة">
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <span class="mono font-bold" style="color:var(--primary);font-size:13px;">#${escapeHtml(s.ID.slice(-8))}</span>
                      ${isSelected ? '<span class="badge badge-green selected-badge-indicator" style="font-size:9.5px;padding:1px 5px;">محددة</span>' : ''}
                    </div>
                  </td>
                  <td style="font-size:11.5px;color:var(--ink-secondary);">
                    ${cleanDate(s.Date)}
                  </td>
                  <td>
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                      <div>
                        <div style="font-weight:800;font-size:13px;">${escapeHtml(s.CustomerName||'عميل زائر')}</div>
                        <div class="mono" style="font-size:11px;color:var(--ink-secondary);">${escapeHtml(s.CustomerPhone||'-')}</div>
                      </div>
                      ${waUrl ? `
                        <a href="${waUrl}" target="_blank" onclick="event.stopPropagation();" class="btn btn-xs btn-whatsapp" style="padding:2px 7px;border-radius:4px;text-decoration:none;" title="محادثة واتساب مباشرة">
                          ${WA_ICON}
                        </a>
                      ` : ''}
                    </div>
                  </td>
                  <td style="font-size:12px;max-width:280px;line-height:1.4;">
                    ${escapeHtml(s.ItemsSummary || '-')}
                  </td>
                  <td class="mono font-bold" style="color:var(--green);font-size:13.5px;text-align:center;">
                    ${Number(s.Total||0).toLocaleString()} ج.م
                  </td>
                  <td style="text-align:center;">
                    <span class="status-badge st-check" style="font-size:10.5px;">${escapeHtml(s.PaymentMethod||'نقدي')}</span>
                  </td>
                  <td style="text-align:center;">
                    ${s.IsReturned ? `
                      <span class="badge" style="background:#fee2e2;color:#b91c1c;font-weight:800;border:1px solid #fca5a5;padding:2px 6px;border-radius:4px;font-size:10.5px;white-space:nowrap;">مرتجع</span>
                    ` : `
                      <span class="badge" style="background:#dcfce7;color:#15803d;font-weight:700;border:1px solid #bbf7d0;padding:2px 6px;border-radius:4px;font-size:10.5px;white-space:nowrap;">مباع</span>
                    `}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>`}
    </div>
  `;

  // Bindings
  const searchInp = document.getElementById('posSalesSearchInp');
  if(searchInp) searchInp.oninput = (e)=>{ state.posSalesSearchQ = e.target.value; renderPosSalesLog(main); };
  const clearBtn = document.getElementById('clearPosSalesSearch');
  if(clearBtn) clearBtn.onclick = ()=>{ state.posSalesSearchQ = ''; renderPosSalesLog(main); };

  const newSaleBtn = document.getElementById('goToNewSaleBtn');
  if(newSaleBtn) newSaleBtn.onclick = ()=>{ state.posTab='sell'; renderPosApp(document.getElementById('app')); };
  const expBtn = document.getElementById('exportSalesExcelBtn');
  if(expBtn) expBtn.onclick = ()=>exportSalesToExcel(list);

  if(typeof window.renderUnifiedSelectionBar === 'function'){
    window.renderUnifiedSelectionBar();
  }
}

/* ---------------- POS Sales Returns & Refunds Engine (آلية الإرجاع والاسترداد الدقيقة) ---------------- */

function openPosReturnModal(sale){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  // 14-day policy calculation
  const saleDateStr = cleanDate(sale.Date) || sale.Date;
  const sDate = new Date(saleDateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0,0,0,0);
  const diffTime = today - sDate;
  const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  const isWithin14 = diffDays <= 14;

  // Parse items from sale
  let items = [];
  if(sale.ItemsJSON){
    try {
      const p = typeof sale.ItemsJSON === 'string' ? JSON.parse(sale.ItemsJSON) : sale.ItemsJSON;
      if(Array.isArray(p)) items = p;
    } catch(e){}
  }
  if(!items.length){
    items = [{ name: sale.ItemsSummary || 'مبيعات POS', qty: 1, price: Number(sale.Total||0), itemId: null }];
  }

  const refundMethod = sale.PaymentMethod || 'نقدي';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:720px;max-height:90vh;overflow-y:auto;">
      <!-- Modal Header -->
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid var(--line);padding-bottom:10px;margin-bottom:12px;">
        <div>
          <h3 style="margin:0;font-size:16.5px;font-weight:900;color:var(--red);display:flex;align-items:center;gap:6px;">${getSvgIcon('refresh', 16)} استرجاع مبيعات POS (إشعار دائن وتسوية)</h3>
          <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">
            فاتورة رقم: <b class="mono" style="color:var(--primary);">#${sale.ID.slice(-8)}</b> • العميل: <b>${sale.CustomerName || 'عميل زائر'}</b> (${sale.CustomerPhone || '-'})
          </div>
        </div>
        <button class="btn btn-ghost btn-xs" id="closePosReturnModalBtn" style="font-size:18px;line-height:1;">&times;</button>
      </div>

      <!-- 1. 14-Day Limit Verification Box -->
      <div style="margin-bottom:12px;">
        ${isWithin14 ? `
          <div style="background:#ecfdf5;border:1.5px solid #a7f3d0;border-radius:6px;padding:10px 14px;color:#065f46;font-size:12px;display:flex;align-items:center;gap:8px;">
            <span>${getSvgIcon('check', 16)}</span>
            <div>
              <b style="font-size:13px;">العملية مؤهلة للاسترجاع قانونياً</b>
              <div style="font-size:11px;color:#047857;margin-top:2px;">تاريخ الشراء: <span class="mono">${saleDateStr}</span> (مرّ ${diffDays} يوم من أصل مهلة الـ 14 يوماً المحددة).</div>
            </div>
          </div>
        ` : `
          <div style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:6px;padding:10px 14px;color:#991b1b;font-size:12px;">
            <div style="display:flex;align-items:center;gap:8px;font-weight:900;font-size:13px;">
              <span>${getSvgIcon('alert', 16)}</span>
              <span>تنبيه: انقضت مهلة الـ 14 يوماً القانونية للاسترجاع!</span>
            </div>
            <div style="font-size:11px;margin-top:3px;color:#7f1d1d;">
              تاريخ الشراء: <span class="mono">${saleDateStr}</span> (مرّ <b>${diffDays}</b> يوماً على البيع). تتطلب اللائحة استثناءً وموافقة إدارية خاصة للمتابعة.
            </div>
            <label class="checkbox-row" style="margin-top:8px;font-weight:800;color:#991b1b;font-size:12px;background:#fff;padding:6px 10px;border-radius:4px;border:1px dashed #f87171;">
              <input type="checkbox" id="posRetAdminOverride">
              <span>أقر بوجود موافقة إدارية معتمدة لاستثناء مهلة الـ 14 يوماً</span>
            </label>
          </div>
        `}
      </div>

      <!-- 2. Mandatory Verification Checkboxes -->
      <div style="background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:6px;padding:10px 14px;margin-bottom:12px;">
        <div style="font-weight:800;font-size:12px;margin-bottom:6px;color:var(--ink);">ضوابط وشروط الاسترجاع الإلزامية:</div>
        <label class="checkbox-row" style="font-size:12px;margin-bottom:6px;">
          <input type="checkbox" id="posRetHasReceipt">
          <span><b>التحقق من الفاتورة:</b> العميل يحمل أصل الفاتورة الضريبية أو بون الكاشير المطبوع.</span>
        </label>
        <label class="checkbox-row" style="font-size:12px;">
          <input type="checkbox" id="posRetGoodCondition">
          <span><b>حالة المنتج:</b> تم فحص السلعة والتأكد أنها بحالتها الأصلية غير مستخدمة وبالعبوة والملصقات السليمة.</span>
        </label>
      </div>

      <!-- 3. Guaranteed Same Payment Method Refund Box -->
      <div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:6px;padding:10px 14px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:11px;font-weight:800;color:#1e40af;">قناة الاسترداد الإلزامية (نفس وسيلة الدفع الأصلية):</div>
            <div style="font-size:13.5px;font-weight:900;color:#1e3a8a;margin-top:2px;">
              رد المبلغ عبر: <b>${refundMethod}</b>
            </div>
          </div>
          <span class="badge" style="background:#dbeafe;color:#1e40af;font-size:11px;font-weight:800;padding:4px 8px;border-radius:4px;">مطابقة وسيلة الدفع الأصلية</span>
        </div>
        <div style="font-size:10.5px;color:#2563eb;margin-top:4px;">
          ${(refundMethod.includes('فيزا') || refundMethod.includes('visa') || refundMethod.includes('بطاق')) ? 'سيتم رد المبلغ عكسياً إلى حساب البنك والبطاقة (ح/ 1102).' :
            (refundMethod.includes('instapay') || refundMethod.includes('إنستاباي')) ? 'سيتم رد المبلغ عبر تحويل InstaPay لحساب العميل (ح/ 1102).' :
            (refundMethod.includes('محفظ') || refundMethod.includes('wallet')) ? 'سيتم رد المبلغ لنفس رقم المحفظة الإلكترونية للعميل (ح/ 1102).' :
            (refundMethod.includes('آجل') || refundMethod.includes('حساب')) ? 'سيتم قيد إشعار دائن وتسوية حساب العميل الآجل (ح/ 1103).' :
            'سيتم استرداد المبلغ نقداً وخصمه من الخزينة الرئيسية بالدرج (ح/ 1101).'}
        </div>
      </div>

      <!-- 4. Seller Commission Deduction Box -->
      <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:6px;padding:10px 14px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <div style="font-size:12px;font-weight:800;color:#92400e;">
            مسؤول البيع الأصلي: <b>${sale.By || 'الكاشير'}</b>
          </div>
          <span style="font-size:11px;color:#b45309;">تصفية ومردودات العمولات</span>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <div style="flex:1;min-width:200px;">
            <label style="font-size:11.5px;font-weight:700;color:#78350f;display:block;margin-bottom:3px;">
              عمولة / مكافأة البيع المراد خصمها من البائع (ج.م):
            </label>
            <input type="number" id="posRetCommission" min="0" step="0.5" value="0" style="background:#fff;border-color:#d97706;font-size:14px;font-weight:800;width:120px;" placeholder="0.00">
          </div>
          <div style="font-size:10.5px;color:#92400e;flex:2;min-width:220px;line-height:1.4;">
            إذا استحق البائع عمولة أو مكافأة عن هذه الفاتورة، سيتم قيد خصم هذا المبلغ من مستحقاته وإثباته في سند الارتجاع ودفتر العمليات.
          </div>
        </div>
      </div>

      <!-- 5. Items to Return Table -->
      <div style="border:1px solid var(--line);border-radius:6px;overflow:hidden;margin-bottom:12px;">
        <div style="background:var(--paper2);padding:8px 12px;font-weight:800;font-size:12px;color:var(--ink);border-bottom:1px solid var(--line);">
          حدد الأصناف والكميات المراد استرجاعها:
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:11.5px;">
          <thead>
            <tr style="background:#f1f5f9;color:#334155;border-bottom:1px solid #cbd5e1;">
              <th style="padding:6px 10px;text-align:right;width:30px;"><input type="checkbox" id="posRetCheckAll" checked></th>
              <th style="padding:6px 10px;text-align:right;">الصنف المباع</th>
              <th style="padding:6px 10px;text-align:center;">الكمية المباعة</th>
              <th style="padding:6px 10px;text-align:center;">الكمية المرتجعة</th>
              <th style="padding:6px 10px;text-align:center;">سعر الوحدة</th>
              <th style="padding:6px 10px;text-align:center;">إعادة للمخزن</th>
              <th style="padding:6px 10px;text-align:center;">المبلغ المسترد</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((it, idx)=>{
              return `
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:6px 10px;text-align:right;">
                    <input type="checkbox" class="ret-item-chk" data-idx="${idx}" checked>
                  </td>
                  <td style="padding:6px 10px;font-weight:700;">${it.name}</td>
                  <td style="padding:6px 10px;text-align:center;" class="mono font-bold">${it.qty}</td>
                  <td style="padding:6px 10px;text-align:center;">
                    <input type="number" class="ret-item-qty mono font-bold" data-idx="${idx}" min="1" max="${it.qty}" value="${it.qty}" style="width:60px;padding:3px;text-align:center;">
                  </td>
                  <td style="padding:6px 10px;text-align:center;" class="mono">${Number(it.price).toLocaleString()} ج.م</td>
                  <td style="padding:6px 10px;text-align:center;">
                    <input type="checkbox" class="ret-item-restock" data-idx="${idx}" ${it.itemId ? 'checked' : 'disabled'} title="إعادة رصيد الصنف للمخزن">
                  </td>
                  <td style="padding:6px 10px;text-align:center;font-weight:900;color:var(--red);" class="ret-item-row-total mono" data-idx="${idx}">
                    ${(it.qty * it.price).toLocaleString()} ج.م
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- 6. Reason & Grand Refund Total -->
      <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:12px;align-items:center;margin-bottom:16px;">
        <div class="field" style="margin-bottom:0;">
          <label style="font-size:11.5px;">سبب الإرجاع / ملاحظات:</label>
          <input id="posRetReason" placeholder="مثال: رغبة العميل، عيب صناعة، عدم توافق مع الجهاز..." style="font-size:12px;">
        </div>
        <div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:6px;padding:10px 14px;text-align:center;">
          <div style="font-size:11px;color:#991b1b;font-weight:800;">إجمالي المبلغ المطلوب رده للعميل</div>
          <div class="mono font-bold" style="font-size:20px;color:#dc2626;margin-top:2px;">
            <span id="posRetGrandTotal">0.00</span> <span style="font-size:13px;">ج.م</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);padding-top:12px;">
        <button class="btn btn-ghost btn-sm" id="btnCancelPosReturn">إلغاء</button>
        <button class="btn btn-red btn-sm" id="btnConfirmPosReturn" disabled style="opacity:0.5;cursor:not-allowed;font-weight:800;padding:8px 16px;">
          تأكيد الاسترجاع وإصدار إشعار دائن ↩️
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Live Recalculation & Validation
  function updateRefundSummary(){
    let sumRefund = 0;
    const chks = overlay.querySelectorAll('.ret-item-chk');
    chks.forEach(chk => {
      const idx = chk.dataset.idx;
      const qtyInp = overlay.querySelector(`.ret-item-qty[data-idx="${idx}"]`);
      const rowTotEl = overlay.querySelector(`.ret-item-row-total[data-idx="${idx}"]`);
      if(chk.checked){
        const maxQ = Number(items[idx].qty || 1);
        let q = Number(qtyInp ? qtyInp.value : maxQ);
        if(isNaN(q) || q < 1) q = 1;
        if(q > maxQ) q = maxQ;
        if(qtyInp && qtyInp.value != q) qtyInp.value = q;
        const p = Number(items[idx].price || 0);
        const rowTot = q * p;
        sumRefund += rowTot;
        if(rowTotEl) rowTotEl.textContent = rowTot.toLocaleString() + ' ج.م';
      } else {
        if(rowTotEl) rowTotEl.textContent = '0 ج.م';
      }
    });

    const grandEl = overlay.querySelector('#posRetGrandTotal');
    if(grandEl) grandEl.textContent = sumRefund.toLocaleString();

    // Check conditions
    const hasReceipt = overlay.querySelector('#posRetHasReceipt')?.checked;
    const goodCondition = overlay.querySelector('#posRetGoodCondition')?.checked;
    const adminOverride = !isWithin14 ? overlay.querySelector('#posRetAdminOverride')?.checked : true;
    const hasSelectedItems = sumRefund > 0;

    const btnConfirm = overlay.querySelector('#btnConfirmPosReturn');
    if(btnConfirm){
      const canSubmit = hasReceipt && goodCondition && adminOverride && hasSelectedItems;
      btnConfirm.disabled = !canSubmit;
      btnConfirm.style.opacity = canSubmit ? '1' : '0.5';
      btnConfirm.style.cursor = canSubmit ? 'pointer' : 'not-allowed';
    }
  }

  // Bind inputs
  overlay.querySelectorAll('.ret-item-chk').forEach(c => c.onchange = updateRefundSummary);
  overlay.querySelectorAll('.ret-item-qty').forEach(q => q.oninput = updateRefundSummary);
  const chkReceipt = overlay.querySelector('#posRetHasReceipt');
  if(chkReceipt) chkReceipt.onchange = updateRefundSummary;
  const chkCondition = overlay.querySelector('#posRetGoodCondition');
  if(chkCondition) chkCondition.onchange = updateRefundSummary;
  const chkOverride = overlay.querySelector('#posRetAdminOverride');
  if(chkOverride) chkOverride.onchange = updateRefundSummary;

  const chkAll = overlay.querySelector('#posRetCheckAll');
  if(chkAll){
    chkAll.onchange = ()=>{
      overlay.querySelectorAll('.ret-item-chk').forEach(c => c.checked = chkAll.checked);
      updateRefundSummary();
    };
  }

  updateRefundSummary();

  // Close handlers
  const closeBtn = overlay.querySelector('#closePosReturnModalBtn');
  if(closeBtn) closeBtn.onclick = () => overlay.remove();
  const cancelBtn = overlay.querySelector('#btnCancelPosReturn');
  if(cancelBtn) cancelBtn.onclick = () => overlay.remove();

  // Submit Handler
  const confirmBtn = overlay.querySelector('#btnConfirmPosReturn');
  if(confirmBtn){
    confirmBtn.onclick = async ()=>{
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'جارٍ معالجة الارتجاع...';

      try {
        const returnedItems = [];
        const chks = overlay.querySelectorAll('.ret-item-chk');
        let totalRefund = 0;

        for(const chk of chks){
          if(chk.checked){
            const idx = chk.dataset.idx;
            const it = items[idx];
            const qtyInp = overlay.querySelector(`.ret-item-qty[data-idx="${idx}"]`);
            const restockChk = overlay.querySelector(`.ret-item-restock[data-idx="${idx}"]`);
            const maxQ = Number(it.qty || 1);
            let retQty = Number(qtyInp ? qtyInp.value : maxQ);
            if(isNaN(retQty) || retQty < 1) retQty = 1;
            if(retQty > maxQ) retQty = maxQ;
            const shouldRestock = restockChk ? restockChk.checked : false;
            const lineTot = retQty * Number(it.price || 0);
            totalRefund += lineTot;

            returnedItems.push({
              name: it.name,
              qty: retQty,
              price: it.price,
              itemId: it.itemId,
              costAtSale: Number(it.costAtSale != null ? it.costAtSale : (it.purchasePrice || 0)),
              restocked: shouldRestock,
              lineTotal: lineTot
            });

            // 1. Restock inventory
            if(shouldRestock && it.itemId && !String(it.itemId).startsWith('srv_')){
              try {
                await adjustInventoryQtyRemote(it.itemId, retQty);
              } catch(e){
                console.warn('Restock error:', e);
              }
            }
          }
        }

        const commInp = overlay.querySelector('#posRetCommission');
        const commissionDeducted = Number(commInp ? commInp.value : 0) || 0;
        const reasonInp = overlay.querySelector('#posRetReason');
        const returnReason = (reasonInp ? reasonInp.value : '').trim() || 'مرتجع بناء على رغبة العميل';

        // 2. Save Outflow Expense
        const expId = 'exp_ret_' + Date.now();
        const exp = {
          ID: expId,
          Date: new Date().toISOString().slice(0,10),
          Category: 'مرتجع مبيعات POS',
          Type: 'out',
          Title: `مرتجع مبيعات POS: ${sale.CustomerName||'عميل زائر'} (فاتورة #${sale.ID.slice(-8)})`,
          Amount: totalRefund,
          PaymentMethod: refundMethod,
          AccountCode: '4102-RET',
          Reference: `RET-${sale.ID.slice(-8)}`,
          By: state.user ? state.user.name : 'كاشير',
          Notes: `رد بنفس وسيلة الدفع (${refundMethod}) • خصم عمولة بائع: ${commissionDeducted} ج.م من (${sale.By||'الكاشير'}) • سبب: ${returnReason}`,
          skipAutoJournal: true
        };
        await saveExpenseRemote(exp);

        // 3. Mark sale as returned & persist to backend
        const returnDetails = {
          voucherNumber: `RET-${sale.ID.slice(-8)}`,
          returnDate: new Date().toISOString().slice(0,10),
          returnTime: new Date().toLocaleTimeString('ar-EG'),
          returnedItems: returnedItems,
          totalRefund: totalRefund,
          sellerCommissionDeducted: commissionDeducted,
          sellerName: sale.By || 'الكاشير',
          reason: returnReason,
          processedBy: state.user ? state.user.name : 'كاشير',
          hasReceipt: true,
          goodCondition: true,
          refundMethod: refundMethod,
          diffDays: diffDays
        };

        sale.IsReturned = true;
        sale.ReturnDetails = returnDetails;
        setCache('sales', state.sales);

        // Sync return to remote Google Apps Script backend
        apiPost('saveReturn', {
          saleId: sale.ID,
          clientRef: `ret_${sale.ID}_${Date.now()}`,
          date: returnDetails.returnDate,
          itemsSummary: returnedItems.map(x => `${x.qty}x ${x.name}`).join('، '),
          items: returnedItems,
          refundAmount: totalRefund,
          refundMethod: refundMethod,
          returnDetails: returnDetails,
          user: returnDetails.processedBy
        }).catch(e => console.warn('Sync return to remote warning:', e));

        // 4. Auto Journal Entry with dual reversal (Revenue & COGS)
        const isBank = (refundMethod.includes('فيزا') || refundMethod.includes('visa') || refundMethod.includes('card') || refundMethod.includes('instapay') || refundMethod.includes('محفظ') || refundMethod.includes('wallet'));
        const isCredit = (refundMethod.includes('آجل') || refundMethod.includes('اجل') || refundMethod.includes('حساب'));
        const creditAccCode = isBank ? '1102' : (isCredit ? '1103' : '1101');
        const creditAccName = isBank ? 'البنك وحسابات الدفع الإلكتروني' : (isCredit ? 'حساب العميل (مدينون آجل)' : 'الخزينة الرئيسية (النقدية بالدرج)');

        let restockedCOGS = 0;
        returnedItems.forEach(it => {
          if(it.restocked && it.itemId && !String(it.itemId).startsWith('srv_')){
            const inv = (state.inventory||[]).find(x => String(x.ID) === String(it.itemId));
            const cost = Number(it.costAtSale != null ? it.costAtSale : (inv ? inv.PurchasePrice : 0)) || 0;
            restockedCOGS += round2(cost * Number(it.qty||1));
          }
        });

        const retJournalLines = [
          {AccountCode:'4102', AccountName:'مردودات ومسموحات مبيعات الأجهزة والإكسسوار', Debit:Number(totalRefund), Credit:0, Notes:`مرتجع أصناف للعميل ${sale.CustomerName||'عميل زائر'}`},
          {AccountCode:creditAccCode, AccountName:creditAccName, Debit:0, Credit:Number(totalRefund), Notes:`رد واسترداد بنفس وسيلة الدفع الأصلية (${refundMethod})`}
        ];
        if(restockedCOGS > 0){
          retJournalLines.push(
            {AccountCode:'1104', AccountName:'مخزون البضائع وقطع الغيار', Debit:Number(restockedCOGS), Credit:0, Notes:`إعادة إدخال مخزون أصناف مرتجعة (فاتورة #${sale.ID.slice(-8)})`},
            {AccountCode:'5102', AccountName:'تكلفة البضاعة المباعة (POS)', Debit:0, Credit:Number(restockedCOGS), Notes:`عكس تكلفة بضاعة مباعة لمرتجع`}
          );
        }

        recordAutoJournalEntry(
          `مرتجع مبيعات POS فاتورة #${sale.ID.slice(-8)} (رد عبر ${refundMethod})`,
          'POS_Return',
          sale.ID,
          retJournalLines
        ).catch(e=>{});

        // 5. Audit logs
        if(commissionDeducted > 0){
          recordAuditLog(
            'خصم عمولة بائع لمرتجع',
            'مبيعات',
            `تم خصم عمولة/حافز بيع بقيمة ${commissionDeducted} ج.م من الموظف (${sale.By || 'الكاشير'}) نظير إرجاع فاتورة #${sale.ID.slice(-8)} للعميل (${sale.CustomerName||'عميل زائر'})`,
            sale.ID
          );
        }

        recordAuditLog(
          'استرجاع مبيعات POS',
          'مبيعات',
          `تم استرجاع أصناف بقيمة ${totalRefund} ج.م من فاتورة #${sale.ID.slice(-8)} ورد المبلغ عبر (${refundMethod}) بعد فحص الفاتورة وحالة المنتج`,
          sale.ID
        );

        overlay.remove();
        showToast('تم إتمام عملية الاسترجاع بنجاح وتحديث الخزينة والمخزن', 'success');

        // Re-render
        if(state.currentSection === 'pos'){
          if(state.posTab === 'sales'){
            renderPosSalesLog(document.getElementById('main'));
          } else {
            renderPosSell(document.getElementById('main'));
          }
        } else if(state.currentSection === 'daily'){
          renderDailyJournalPage(document.getElementById('main'));
        } else if(state.currentSection === 'cashdrawer'){
          renderCashDrawerPage(document.getElementById('main'));
        }

        // Open Voucher Print
        openPosReturnVoucherPrint(sale, returnDetails);

      } catch(err){
        showToast('حدث خطأ أثناء معالجة الارتجاع: ' + err.message, 'error');
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'تأكيد الاسترجاع وإصدار إشعار دائن ↩️';
      }
    };
  }
}

function openPosReturnVoucherPrint(sale, returnDetails){
  document.body.classList.remove('printing-sticker');
  const old = document.getElementById('printMount');
  if(old) old.remove();

  const mount = document.createElement('div');
  mount.id = 'printMount';

  const shopName = (state.settings && state.settings.shopName) || 'صيانة ميكروتك';
  const logoUrl = state.settings && state.settings.logoUrl;
  const retItems = returnDetails.returnedItems || [];
  const retDate = returnDetails.returnDate || new Date().toISOString().slice(0,10);
  const retTime = returnDetails.returnTime || new Date().toLocaleTimeString('ar-EG');
  const totalRef = Number(returnDetails.totalRefund || 0);

  mount.innerHTML = `
    <div style="width:100%;max-width:700px;margin:0 auto;background:#fff;padding:24px 28px;color:#0f172a;font-family:var(--font-main);border-radius:8px;box-sizing:border-box;">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:14px;">
        <div>
          ${logoUrl ? `<img src="${logoUrl}" style="max-height:36px;max-width:140px;object-fit:contain;margin-bottom:4px;">` : ''}
          <h2 style="margin:0;font-size:19px;font-weight:900;color:#0f172a;">${shopName}</h2>
          <div style="font-size:12px;color:#475569;margin-top:2px;">إشعار دائن وسند ارتجاع مبيعات (Sales Return & Credit Voucher)</div>
        </div>
        <div style="text-align:left;">
          <div style="background:#dc2626;color:#fff;font-size:13px;font-weight:900;padding:4px 10px;border-radius:4px;display:inline-block;" class="mono">${returnDetails.voucherNumber || ('RET-' + sale.ID.slice(-8))}</div>
          <div style="font-size:10.5px;color:#64748b;margin-top:4px;">التاريخ: <b>${retDate} ${retTime}</b></div>
          <div style="font-size:10.5px;color:#64748b;">مسؤول الارتجاع: <b>${returnDetails.processedBy || (state.user ? state.user.name : 'الكاشير')}</b></div>
        </div>
      </div>

      <!-- Reference & Customer Meta Grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:10px 14px;margin-bottom:14px;font-size:11.5px;">
        <div>
          <div><b>العميل:</b> ${sale.CustomerName || 'عميل زائر'}</div>
          <div style="margin-top:4px;"><b>الهاتف:</b> <span class="mono">${sale.CustomerPhone || '-'}</span></div>
          <div style="margin-top:4px;"><b>سبب الارتجاع:</b> ${returnDetails.reason || 'رغبة العميل'}</div>
        </div>
        <div>
          <div><b>الفاتورة الأصلية:</b> <span class="mono font-bold" style="color:#0284c7;">#${sale.ID.slice(-8)}</span></div>
          <div style="margin-top:4px;"><b>تاريخ البيع الأصلي:</b> <span class="mono">${cleanDate(sale.Date)}</span> (مرّ ${returnDetails.diffDays || 0} يوم)</div>
          <div style="margin-top:4px;"><b>البائع الأصلي:</b> ${returnDetails.sellerName || sale.By || 'الكاشير'}</div>
        </div>
      </div>

      <!-- Verification Badges -->
      <div style="display:flex;gap:12px;flex-wrap:wrap;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:8px 12px;margin-bottom:14px;font-size:11px;color:#15803d;font-weight:700;">
        <div>• تم التحقق من وجود الفاتورة الأصلية</div>
        <div>• تم فحص الأصناف والتأكد من حالتها الأصلية</div>
        <div>• ضمن مهلة الاسترجاع القانونية (14 يوماً)</div>
      </div>

      <!-- Items Table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:11px;">
        <thead>
          <tr style="background:#0f172a;color:#fff;">
            <th style="padding:6px 10px;text-align:right;">#</th>
            <th style="padding:6px 10px;text-align:right;">الصنف المرتجع</th>
            <th style="padding:6px 10px;text-align:center;">الكمية المرتجعة</th>
            <th style="padding:6px 10px;text-align:center;">سعر الوحدة</th>
            <th style="padding:6px 10px;text-align:center;">إعادة للمخزن</th>
            <th style="padding:6px 10px;text-align:center;">إجمالي المسترد</th>
          </tr>
        </thead>
        <tbody>
          ${retItems.map((it, idx) => `
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:6px 10px;color:#64748b;" class="mono">${idx + 1}</td>
              <td style="padding:6px 10px;font-weight:700;">${it.name}</td>
              <td style="padding:6px 10px;text-align:center;font-weight:800;" class="mono">${it.qty}</td>
              <td style="padding:6px 10px;text-align:center;" class="mono">${Number(it.price).toLocaleString()} ج.م</td>
              <td style="padding:6px 10px;text-align:center;color:#16a34a;font-weight:700;">${it.restocked ? 'نعم' : 'لا'}</td>
              <td style="padding:6px 10px;text-align:center;font-weight:900;color:#dc2626;" class="mono">${Number(it.lineTotal || (it.qty * it.price)).toLocaleString()} ج.م</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Financial Totals & Refund Method -->
      <div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:6px;padding:12px 14px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:11px;color:#991b1b;font-weight:800;">طريقة الاسترداد المنفذة:</div>
            <div style="font-size:13.5px;font-weight:900;color:#b91c1c;margin-top:2px;">
              رد المبلغ عبر: <b>${returnDetails.refundMethod || sale.PaymentMethod || 'نقدي (كاش)'}</b> (نفس وسيلة الدفع الأصلية)
            </div>
            ${Number(returnDetails.sellerCommissionDeducted) > 0 ? `
              <div style="font-size:11px;color:#78350f;margin-top:4px;font-weight:700;">
                تم خصم عمولة مبيعات بقيمة <b>${returnDetails.sellerCommissionDeducted} ج.م</b> من البائع (${returnDetails.sellerName || sale.By}).
              </div>
            ` : ''}
          </div>
          <div style="text-align:left;">
            <div style="font-size:11px;color:#7f1d1d;">إجمالي المبلغ المسترد للعميل</div>
            <div class="mono font-bold" style="font-size:20px;color:#b91c1c;margin-top:2px;">
              ${totalRef.toLocaleString()} <span style="font-size:13px;">ج.م</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Signatures -->
      <div style="display:flex;justify-content:space-between;margin-top:24px;font-size:11px;color:#475569;border-top:1px solid #cbd5e1;padding-top:12px;">
        <div style="text-align:center;width:30%;">
          <div>توقيع واستلام العميل</div>
          <div style="margin-top:30px;border-bottom:1px dashed #94a3b8;width:80%;margin-left:auto;margin-right:auto;"></div>
        </div>
        <div style="text-align:center;width:30%;">
          <div>توقيع مسؤول الخزينة / الكاشير</div>
          <div style="margin-top:30px;border-bottom:1px dashed #94a3b8;width:80%;margin-left:auto;margin-right:auto;"></div>
        </div>
        <div style="text-align:center;width:30%;">
          <div>اعتماد الإدارة / الحسابات</div>
          <div style="margin-top:30px;border-bottom:1px dashed #94a3b8;width:80%;margin-left:auto;margin-right:auto;"></div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(mount);
  setTimeout(()=>{ window.print(); mount.remove(); }, 250);
}

function openPosReturnLookupModal(){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:680px;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:12px;">
        <div>
          <h3 style="margin:0;font-size:16.5px;font-weight:900;">استرجاع فاتورة مبيعات (POS Return)</h3>
          <div style="font-size:11.5px;color:var(--ink-secondary);margin-top:2px;">امسح باركود البون أو ابحث برقم الفاتورة أو اسم وهاتف العميل</div>
        </div>
        <button class="btn btn-ghost btn-xs" id="closePosRetLookupModal" style="font-size:18px;line-height:1;">&times;</button>
      </div>
      <div style="margin-bottom:12px;">
        <input id="posRetLookupInp" placeholder="امسح الباركود أو اكتب رقم الفاتورة / اسم العميل / الهاتف..." style="width:100%;font-size:14px;padding:9px 12px;" autofocus>
      </div>
      <div id="posRetLookupResults" style="flex:1;overflow-y:auto;border:1px solid var(--line);border-radius:6px;padding:4px;"></div>
    </div>
  `;

  document.body.appendChild(overlay);

  const inp = overlay.querySelector('#posRetLookupInp');
  const resultsDiv = overlay.querySelector('#posRetLookupResults');
  const closeBtn = overlay.querySelector('#closePosRetLookupModal');
  if(closeBtn) closeBtn.onclick = () => overlay.remove();

  function renderList(q=''){
    const query = q.trim().toLowerCase();
    let salesList = [...(state.sales || [])];
    if(query){
      salesList = salesList.filter(s =>
        (s.ID || '').toLowerCase().includes(query) ||
        (s.CustomerName || '').toLowerCase().includes(query) ||
        (s.CustomerPhone || '').includes(query) ||
        (s.ItemsSummary || '').toLowerCase().includes(query)
      );
    }
    salesList.sort((a,b) => String(b.ID||'').localeCompare(String(a.ID||'')));

    if(!salesList.length){
      resultsDiv.innerHTML = '<div class="empty" style="padding:24px;">لا توجد فواتير مبيعات مطابقة للبحث.</div>';
      return;
    }

    resultsDiv.innerHTML = salesList.slice(0, 30).map(s => {
      const sDate = cleanDate(s.Date) || s.Date;
      const daysDiff = Math.max(0, Math.floor((new Date().setHours(0,0,0,0) - new Date(sDate + 'T00:00:00')) / (1000 * 60 * 60 * 24)));
      const isOk14 = daysDiff <= 14;
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #f1f5f9;transition:background 0.1s ease;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
          <div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="mono font-bold" style="color:var(--primary);font-size:13px;">#${s.ID.slice(-8)}</span>
              <span style="font-size:11px;color:var(--ink-secondary);">${sDate}</span>
              ${isOk14 ? `<span class="badge" style="background:#ecfdf5;color:#047857;font-size:10px;">${daysDiff} يوم (ضمن 14 يوم)</span>` : `<span class="badge" style="background:#fef2f2;color:#b91c1c;font-size:10px;">${daysDiff} يوم (تجاوز 14 يوم)</span>`}
              ${s.IsReturned ? `<span class="badge" style="background:#fee2e2;color:#b91c1c;font-size:10px;font-weight:800;">مرتجع</span>` : ''}
            </div>
            <div style="font-size:12.5px;font-weight:700;margin-top:2px;">
              ${s.CustomerName || 'عميل زائر'} ${s.CustomerPhone ? `(${s.CustomerPhone})` : ''}
            </div>
            <div style="font-size:11px;color:var(--ink-secondary);max-width:400px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              ${s.ItemsSummary}
            </div>
          </div>
          <div style="text-align:left;display:flex;align-items:center;gap:10px;">
            <div>
              <div class="mono font-bold" style="font-size:13.5px;color:var(--green);">${Number(s.Total||0).toLocaleString()} ج.م</div>
              <div style="font-size:10px;color:var(--ink-secondary);">${s.PaymentMethod||'نقدي'}</div>
            </div>
            ${s.IsReturned ? `
              <button class="btn btn-xs btn-purple" data-retlookupact="voucher" data-sid="${s.ID}">${getSvgIcon('fileText', 12)} إشعار</button>
            ` : `
              <button class="btn btn-xs btn-amber" data-retlookupact="return" data-sid="${s.ID}">استرجاع</button>
            `}
          </div>
        </div>
      `;
    }).join('');

    resultsDiv.querySelectorAll('[data-retlookupact]').forEach(btn => {
      btn.onclick = () => {
        const sale = (state.sales || []).find(x => x.ID === btn.dataset.sid);
        if(!sale) return;
        overlay.remove();
        if(btn.dataset.retlookupact === 'voucher'){
          openPosReturnVoucherPrint(sale, sale.ReturnDetails || {});
        } else {
          openPosReturnModal(sale);
        }
      };
    });
  }

  renderList();
  inp.oninput = (e) => renderList(e.target.value);
  inp.focus();
}
