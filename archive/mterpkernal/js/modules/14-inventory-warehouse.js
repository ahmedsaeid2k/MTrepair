/* ---------------- Inventory Hub ---------------- */
function renderInventoryHubApp(app){
  if(!canUserAccessSection('inventory')){
    showToast('⛔ ليس لديك صلاحية للوصول إلى قسم المخزن والمشتريات', 'error');
    state.currentSection = null;
    return render();
  }
  if(!state.invHubTab) state.invHubTab = 'all';
  const hasQuickTools = canUserAccessSection('barcode') || canUserAccessSection('pos');

  app.innerHTML = `
    <div class="sidebar">
      ${brandHtml("المخزن والمشتريات")}
      ${sectionSwitcherHtml()}
      <div class="sidebar-nav-wrap">
        <div class="nav-section">المخزون والأصناف</div>
        <div class="nav-item ${state.invHubTab==='all'?'active':''}" data-invhubtab="all">
          <span class="nav-item-icon">📦</span><span>كل الأصناف</span>
        </div>
        <div class="nav-item ${state.invHubTab==='صيانة'?'active':''}" data-invhubtab="صيانة">
          <span class="nav-item-icon">🛠️</span><span>قطع غيار الصيانة</span>
        </div>
        <div class="nav-item ${state.invHubTab==='كاميرات'?'active':''}" data-invhubtab="كاميرات">
          <span class="nav-item-icon">📷</span><span>مهمات الكاميرات</span>
        </div>
        <div class="nav-item ${state.invHubTab==='كمبيوتر'?'active':''}" data-invhubtab="كمبيوتر">
          <span class="nav-item-icon">💻</span><span>أجهزة الكمبيوتر</span>
        </div>
        <div class="nav-item ${state.invHubTab==='إكسسوار'?'active':''}" data-invhubtab="إكسسوار">
          <span class="nav-item-icon">🎧</span><span>الإكسسوارات</span>
        </div>

        <div class="nav-section">المشتريات والموردين</div>
        <div class="nav-item ${state.invHubTab==='purchases'?'active':''}" data-invhubtab="purchases">
          <span class="nav-item-icon">📥</span><span>فواتير الشراء</span>
        </div>
        <div class="nav-item ${state.invHubTab==='suppliers'?'active':''}" data-invhubtab="suppliers">
          <span class="nav-item-icon">👥</span><span>سجل الموردين</span>
        </div>

        ${hasQuickTools ? `
          <div class="nav-section">أدوات الربط السريع</div>
          ${canUserAccessSection('barcode') ? `
            <div class="nav-item" id="invToBarcodeNav">
              <span class="nav-item-icon">🏷️</span><span>استوديو طباعة الباركود</span>
            </div>
          ` : ''}
          ${canUserAccessSection('pos') ? `
            <div class="nav-item" id="invToPosNav">
              <span class="nav-item-icon">🧾</span><span>نقطة البيع (POS)</span>
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

  document.querySelectorAll('[data-invhubtab]').forEach(el=>{
    el.onclick = ()=>{ state.invHubTab = el.dataset.invhubtab; renderInventoryHubApp(app); };
  });

  const goBar = document.getElementById('invToBarcodeNav');
  if(goBar) goBar.onclick = ()=>{ state.currentSection = 'barcode'; render(); };
  const goPos = document.getElementById('invToPosNav');
  if(goPos) goPos.onclick = ()=>{ state.currentSection = 'pos'; render(); };

  const main = document.getElementById('main');
  if(state.invHubTab==='purchases') renderPurchases(main);
  else if(state.invHubTab==='suppliers') renderSuppliers(main);
  else renderInventory(main, state.invHubTab, state.invHubTab==='all' ? 'كل أصناف الشركة' : `مخزون: ${state.invHubTab}`);
}

function refreshInventorySectionOrTab(){
  const main = document.getElementById('main');
  if(!main) return;
  if(state.currentSection === 'inventory'){
    if(state.invHubTab === 'purchases') renderPurchases(main);
    else if(state.invHubTab === 'suppliers') renderSuppliers(main);
    else renderInventory(main, state.invHubTab || 'all', (state.invHubTab === 'all' || !state.invHubTab) ? 'كل أصناف الشركة' : `مخزون: ${state.invHubTab}`);
  } else if(state.currentSection === 'maintenance' && state.tab === 'inventory'){
    renderInventory(main, 'صيانة', 'مخزن قطع الغيار');
  } else if(state.currentSection === 'maintenance'){
    renderMain();
  }
}

/* ---------------- Pro Inventory Master Screen (شاشة إدارة وأصناف المخزن المطورة) ---------------- */
function renderInventory(main, categoryFilter, titleOverride){
  if(!state.invSearchQ) state.invSearchQ = '';
  if(!state.invStockFilter) state.invStockFilter = 'all';
  if(!state.selectedWarehouseFilter) state.selectedWarehouseFilter = 'all';

  const rawList = state.inventory || [];
  let list = categoryFilter === 'all' ? rawList : rawList.filter(it=>(it.Category||'صيانة')===categoryFilter);

  // Warehouse Filter
  if(state.selectedWarehouseFilter && state.selectedWarehouseFilter !== 'all'){
    list = list.filter(it => (it.Warehouse || 'المخزن الرئيسي') === state.selectedWarehouseFilter);
  }

  // Stock Filter (Low Stock / Out of Stock / In Stock)
  if(state.invStockFilter === 'low'){
    list = list.filter(it => Number(it.Quantity||0) <= Number(it.MinStock||2));
  } else if(state.invStockFilter === 'out'){
    list = list.filter(it => Number(it.Quantity||0) <= 0);
  } else if(state.invStockFilter === 'available'){
    list = list.filter(it => Number(it.Quantity||0) > 0);
  }

  // Text Search
  const q = state.invSearchQ.trim().toLowerCase();
  if(q){
    list = list.filter(it => 
      (it.Name||'').toLowerCase().includes(q) ||
      (it.Barcode||'').toLowerCase().includes(q) ||
      (it.SKU||'').toLowerCase().includes(q) ||
      (it.ShelfLocation||'').toLowerCase().includes(q) ||
      (it.Warehouse||'المخزن الرئيسي').toLowerCase().includes(q) ||
      (it.CompatibleModels||'').toLowerCase().includes(q) ||
      (it.SubCategory||'').toLowerCase().includes(q)
    );
  }

  // Calculations & KPIs
  const totalItemsCount = rawList.length;
  const totalCostValue = rawList.reduce((s,it)=>s + (Number(it.Quantity||0) * Number(it.PurchasePrice||0)), 0);
  const totalRetailValue = rawList.reduce((s,it)=>s + (Number(it.Quantity||0) * Number(it.SellPrice||it.PurchasePrice||0)), 0);
  const lowStockCount = rawList.filter(it=>Number(it.Quantity||0) <= Number(it.MinStock||2)).length;
  const whNames = (state.warehouses || ['المخزن الرئيسي', 'مخزن المعرض / المحل', 'مخزن قطع الغيار']).map(w => typeof w === 'string' ? w : w.name);

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">📦 ${titleOverride || 'إدارة المخازن والأصناف'}</h2>
        <div class="subtitle mono" style="font-size:12px;color:var(--ink-secondary);">${list.length} صنف معروض من إجمالي ${totalItemsCount}</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" id="btnManageWarehouses" style="border-color:var(--line-strong);">🏢 إدارة المخازن (${whNames.length})</button>
        <button class="btn btn-ghost btn-sm" id="btnTransferWarehouses" style="color:var(--primary);border-color:var(--primary);">🔄 تحويل بين المخازن</button>
        <button class="btn btn-ghost btn-sm" id="exportInvExcelBtn">📥 تصدير Excel</button>
        <button class="btn btn-ghost btn-sm" id="importInvExcelBtn">📂 استيراد من Excel</button>
        <button class="btn btn-primary btn-sm" id="addNewItemMasterBtn">➕ إضافة صنف جديد</button>
      </div>
    </div>

    <!-- Inventory KPIs -->
    <div class="stat-grid">
      <div class="stat-card blue">
        <div class="top-row"><span class="lbl">إجمالي الأصناف</span><div class="icon-box">📦</div></div>
        <div class="num mono">${totalItemsCount}</div>
      </div>
      <div class="stat-card amber">
        <div class="top-row"><span class="lbl">قيمة المخزون (تكلفة)</span><div class="icon-box">💵</div></div>
        <div class="num mono">${totalCostValue.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
      </div>
      <div class="stat-card green">
        <div class="top-row"><span class="lbl">القيمة البيعية المتوقعة</span><div class="icon-box">📈</div></div>
        <div class="num mono">${totalRetailValue.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
      </div>
      <div class="stat-card red">
        <div class="top-row"><span class="lbl">النواقص وحد الأمان</span><div class="icon-box">⚠️</div></div>
        <div class="num mono">${lowStockCount}</div>
      </div>
    </div>

    <!-- Filters & Quick Actions Bar -->
    <div class="filters-bar" style="margin-bottom:14px;display:flex;gap:10px;flex-wrap:wrap;">
      <input id="invSearchInput" placeholder="🔍 بحث بالاسم، الباركود، رقم الموديل SKU، المخزن، الرف..." value="${state.invSearchQ}" style="flex:1;min-width:220px;">
      
      <!-- Multi-Warehouse Selector -->
      <select id="invWarehouseFilterSelect" style="min-width:160px;font-weight:700;">
        <option value="all" ${state.selectedWarehouseFilter==='all'?'selected':''}>🏢 كل المخازن والفروع</option>
        ${whNames.map(w=>`<option value="${w}" ${state.selectedWarehouseFilter===w?'selected':''}>🏢 ${w}</option>`).join('')}
      </select>

      <select id="invStockFilterSelect" style="min-width:140px;">
        <option value="all" ${state.invStockFilter==='all'?'selected':''}>📦 كل مستويات المخزون</option>
        <option value="available" ${state.invStockFilter==='available'?'selected':''}>✅ متوفر بالمخزن</option>
        <option value="low" ${state.invStockFilter==='low'?'selected':''}>⚠️ قارب على النفاد (حد الأمان)</option>
        <option value="out" ${state.invStockFilter==='out'?'selected':''}>🚫 رصيد صفري (منتهي)</option>
      </select>
      ${(state.invSearchQ || state.invStockFilter!=='all' || state.selectedWarehouseFilter!=='all') ? `<button class="btn btn-ghost btn-sm" id="clearInvFiltersBtn">مسح الفلاتر</button>` : ''}
    </div>

    <div id="unifiedSelectionTopSlot"></div>

    <div class="card">
      ${list.length===0 ? '<div class="empty">لا توجد أصناف مطابقة للبحث أو الفلتر المختار.</div>' : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="min-width:200px;">الصنف والموديل</th>
              <th style="width:130px;">المخزن / الفرع</th>
              ${categoryFilter==='all'?'<th style="width:90px;text-align:center;">القسم</th>':''}
              <th style="width:100px;">مكان الرف</th>
              <th style="width:125px;">الباركود</th>
              <th style="width:95px;text-align:center;">الكمية المتاحة</th>
              <th style="width:105px;text-align:center;">سعر الشراء</th>
              <th style="width:110px;text-align:center;">سعر البيع (قطاعي)</th>
              <th style="width:105px;text-align:center;">سعر الجملة</th>
              <th style="width:115px;text-align:center;">هامش الربح</th>
            </tr>
          </thead>
          <tbody>
            ${list.map(it=>{
              const qty = Number(it.Quantity||0);
              const minStock = Number(it.MinStock||2);
              const buy = Number(it.PurchasePrice||0);
              const sell = Number(it.SellPrice||0);
              const wholesale = Number(it.WholesalePrice||0);
              const profitAmt = sell - buy;
              const profitMarginPct = sell > 0 ? Math.round((profitAmt / sell) * 100) : 0;
              const isLowStock = qty <= minStock;
              const whName = it.Warehouse || 'المخزن الرئيسي';
              const isSelected = String(it.ID) === String(state.selectedInventoryItemId);

              return `
                <tr class="selectable-row ${isSelected ? 'selected-row' : ''}" data-inv-id="${it.ID}" onclick="handleInventoryRowClick('${it.ID}', event)" ondblclick="openInventoryItemModalDirect('${it.ID}', false)" style="cursor:pointer;${isLowStock ? 'background:rgba(239,68,68,0.05);' : ''}" title="انقر لتحديد الصنف واستخدام الشريط العلوي، أو نقر مزدوج للتعديل">
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <div style="font-weight:800;font-size:13px;color:var(--ink);">${escapeHtml(it.Name)}</div>
                      ${isSelected ? '<span class="badge badge-primary selected-badge-indicator" style="font-size:9.5px;padding:1px 5px;">محدد</span>' : ''}
                    </div>
                    <div style="display:flex;gap:6px;align-items:center;font-size:11px;color:var(--ink-secondary);margin-top:2px;">
                      ${it.SKU ? `<span class="mono" style="color:var(--primary);font-weight:700;">#${escapeHtml(it.SKU)}</span>` : ''}
                      ${it.SubCategory ? `<span>• ${escapeHtml(it.SubCategory)}</span>` : ''}
                      ${it.WarrantyMonths ? `<span>• 🛡️ ضمان ${it.WarrantyMonths} شهر</span>` : ''}
                    </div>
                    ${it.CompatibleModels ? `<div style="font-size:10.5px;color:var(--slate-500);margin-top:1px;">💻 متوافق: ${escapeHtml(it.CompatibleModels)}</div>` : ''}
                  </td>
                  <td>
                    <span style="background:rgba(0,122,255,0.08);color:var(--primary);padding:3px 8px;border-radius:6px;font-size:11px;font-weight:800;white-space:nowrap;">
                      🏢 ${escapeHtml(whName)}
                    </span>
                  </td>
                  ${categoryFilter==='all'?`<td style="text-align:center;"><span class="status-badge st-check" style="font-size:10px;">${escapeHtml(it.Category||'صيانة')}</span></td>`:''}
                  <td>
                    ${it.ShelfLocation ? `<span style="background:var(--paper3);border:1px solid var(--line-strong);padding:2px 7px;border-radius:4px;font-size:11px;font-weight:700;color:var(--ink);">📍 ${escapeHtml(it.ShelfLocation)}</span>` : '<span style="color:var(--slate-400);font-size:11px;">-</span>'}
                  </td>
                  <td>
                    ${it.Barcode ? `
                      <div style="display:flex;align-items:center;gap:4px;">
                        <span class="mono" style="font-size:11px;font-weight:700;color:var(--ink-secondary);">${escapeHtml(it.Barcode)}</span>
                        <button class="btn btn-xs btn-amber" onclick="printInventoryStickerDirect('${it.ID}'); event.stopPropagation();" title="طباعة ملصق الباركود الحراري" style="padding:2px 5px;line-height:1;">🏷️</button>
                      </div>
                    ` : '<span style="color:var(--slate-400);font-size:11px;">بدون</span>'}
                  </td>
                  <td style="text-align:center;">
                    <div style="display:flex;align-items:center;justify-content:center;gap:4px;">
                      <span class="mono" style="font-weight:900;font-size:13.5px;color:${isLowStock?'var(--red)':'var(--ink)'};">${qty}</span>
                      <span style="font-size:11px;color:var(--ink-secondary);">${escapeHtml(it.Unit||'قطعة')}</span>
                      ${isLowStock ? '<span title="الكمية وصلت لحد الأمان أو نفدت" style="font-size:11px;">⚠️</span>' : ''}
                    </div>
                  </td>
                  <td class="mono font-bold" style="text-align:center;">${buy.toLocaleString()} ج.م</td>
                  <td class="mono font-bold" style="color:var(--green);text-align:center;">${sell.toLocaleString()} ج.م</td>
                  <td class="mono" style="text-align:center;">${wholesale ? wholesale.toLocaleString() + ' ج.م' : '<span style="color:var(--slate-400);">-</span>'}</td>
                  <td style="text-align:center;">
                    <span class="mono font-bold" style="color:${profitAmt>=0?'var(--green-text)':'var(--red)'};font-size:11.5px;">
                      ${profitAmt >= 0 ? '+' : ''}${profitAmt.toLocaleString()} ج.م (${profitMarginPct}%)
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>`}
    </div>
  `;

  if(typeof window.renderUnifiedSelectionBar === 'function'){
    window.renderUnifiedSelectionBar();
  }

  // Attach search & filter handlers
  const searchInput = document.getElementById('invSearchInput');
  if(searchInput) searchInput.oninput = (e)=>{ state.invSearchQ = e.target.value; renderInventory(main, categoryFilter, titleOverride); };
  
  const whFilterSelect = document.getElementById('invWarehouseFilterSelect');
  if(whFilterSelect) whFilterSelect.onchange = (e)=>{ state.selectedWarehouseFilter = e.target.value; renderInventory(main, categoryFilter, titleOverride); };

  const filterSelect = document.getElementById('invStockFilterSelect');
  if(filterSelect) filterSelect.onchange = (e)=>{ state.invStockFilter = e.target.value; renderInventory(main, categoryFilter, titleOverride); };

  const clearBtn = document.getElementById('clearInvFiltersBtn');
  if(clearBtn) clearBtn.onclick = ()=>{ 
    state.invSearchQ = ''; 
    state.invStockFilter = 'all'; 
    state.selectedWarehouseFilter = 'all'; 
    renderInventory(main, categoryFilter, titleOverride); 
  };

  const btnWh = document.getElementById('btnManageWarehouses');
  if(btnWh) btnWh.onclick = ()=>openWarehouseManagerModal();

  const btnTrans = document.getElementById('btnTransferWarehouses');
  if(btnTrans) btnTrans.onclick = ()=>openWarehouseTransferModal();

  document.getElementById('addNewItemMasterBtn').onclick = ()=>openInventoryItemModal(null, false, categoryFilter);
  document.getElementById('exportInvExcelBtn').onclick = ()=>exportInventoryToExcel(list);
  document.getElementById('importInvExcelBtn').onclick = ()=>openInventoryImportModal();

  // Attach row actions
  main.querySelectorAll('[data-edititem]').forEach(btn=>{
    btn.onclick = ()=>{
      const item = state.inventory.find(x=>x.ID===btn.dataset.edititem);
      if(item) openInventoryItemModal(item, false, categoryFilter);
    };
  });
  main.querySelectorAll('[data-transferitem]').forEach(btn=>{
    btn.onclick = ()=>{
      const item = state.inventory.find(x=>x.ID===btn.dataset.transferitem);
      if(item) openWarehouseTransferModal(item);
    };
  });
  main.querySelectorAll('[data-cloneitem]').forEach(btn=>{
    btn.onclick = ()=>{
      const item = state.inventory.find(x=>x.ID===btn.dataset.cloneitem);
      if(item) openInventoryItemModal(item, true, categoryFilter);
    };
  });
  main.querySelectorAll('[data-printsticker]').forEach(btn=>{
    btn.onclick = ()=>{
      const item = state.inventory.find(x=>x.ID===btn.dataset.printsticker);
      if(item) openProductBarcodeSticker(item);
    };
  });
  main.querySelectorAll('[data-delitem]').forEach(btn=>{
    btn.onclick = async ()=>{
      const item = state.inventory.find(x=>x.ID===btn.dataset.delitem);
      if(!item) return;
      requestAdminAuthorization({
        action: 'حذف صنف مخزن',
        entityType: 'صنف من المخزن',
        entityId: item.ID,
        entityTitle: `${item.Name} (${item.Category||'صيانة'})`,
        onApproved: async ()=>{
          try{
            await deleteInventoryItemRemote(item.ID);
            showToast('تم حذف الصنف بنجاح', 'success');
            renderInventory(main, categoryFilter, titleOverride);
          }catch(e){ showToast('تعذر الحذف: '+e.message, 'error'); }
        }
      });
    };
  });
}

/* ---------------- Pro Inventory Item Master Modal (نافذة إدخال وتعديل الصنف الاحترافية) ---------------- */
function openInventoryItemModal(editItem, cloneMode=false, defaultCategory='صيانة'){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const isEdit = !!editItem && !cloneMode;
  const isClone = cloneMode;

  const item = editItem ? {
    ID: isClone ? ('inv_' + Date.now()) : editItem.ID,
    Name: isClone ? `${editItem.Name} (نسخة)` : (editItem.Name || ''),
    Category: editItem.Category || defaultCategory || 'صيانة',
    SubCategory: editItem.SubCategory || '',
    SKU: isClone ? '' : (editItem.SKU || ''),
    Barcode: isClone ? '' : (editItem.Barcode || ''),
    ShelfLocation: editItem.ShelfLocation || '',
    Warehouse: editItem.Warehouse || 'المخزن الرئيسي',
    Quantity: isClone ? 0 : (editItem.Quantity || 0),
    MinStock: editItem.MinStock != null ? editItem.MinStock : 2,
    Unit: editItem.Unit || 'قطعة',
    PurchasePrice: editItem.PurchasePrice || 0,
    SellPrice: editItem.SellPrice || 0,
    WholesalePrice: editItem.WholesalePrice || 0,
    WarrantyMonths: editItem.WarrantyMonths || 0,
    CompatibleModels: editItem.CompatibleModels || '',
    ImageURL: editItem.ImageURL || ''
  } : {
    ID: 'inv_' + Date.now(),
    Name: '',
    Category: defaultCategory && defaultCategory!=='all' ? defaultCategory : 'صيانة',
    SubCategory: '',
    SKU: '',
    Barcode: '',
    ShelfLocation: '',
    Warehouse: (state.selectedWarehouseFilter && state.selectedWarehouseFilter!=='all') ? state.selectedWarehouseFilter : 'المخزن الرئيسي',
    Quantity: 0,
    MinStock: 2,
    Unit: 'قطعة',
    PurchasePrice: 0,
    SellPrice: 0,
    WholesalePrice: 0,
    WarrantyMonths: 0,
    CompatibleModels: '',
    ImageURL: ''
  };

  const UNITS = ['قطعة', 'طقم / Set', 'متر', 'رول', 'كرتونة', 'علبة', 'حبة'];
  const whNames = (state.warehouses || ['المخزن الرئيسي', 'مخزن المعرض / المحل', 'مخزن قطع الغيار']).map(w => typeof w === 'string' ? w : w.name);
  const COMMON_SUBCATS = {
    'صيانة': ['شاشات لابتوب', 'بطاريات لابتوب', 'شواحن وكابلات', 'كيبورد ومفصلات', 'سوكت شحن وباور', 'هاردات SSD/HDD', 'رامات RAM', 'أدوات وصيانة', 'أخرى'],
    'كاميرات': ['كاميرات مراقبة خارجية', 'كاميرات داخلية', 'أجهزة تسجيل DVR/NVR', 'هارد ديسك مراقبة', 'باور سبلاي وسويتشات', 'كابلات وإكسسوار', 'أخرى'],
    'كمبيوتر': ['أجهزة كمبيوتر كاملة', 'لابتوب', 'شاشات عرض', 'كروت شاشة GPU', 'لوحات أم Motherboard', 'معالجات CPU', 'كيسات وباور سبلاي', 'أخرى'],
    'إكسسوار': ['ماوس وكيبورد', 'سماعات وهيدسيت', 'فلاشات وكروت ميموري', 'مشتركات ووصلات', 'حقائب وجرابات', 'أخرى']
  };

  function renderModalHTML(){
    overlay.innerHTML = `
      <div class="modal-content" style="max-width:760px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:16px;">
          <div>
            <h3 style="margin:0;font-size:17px;font-weight:900;">
              ${isEdit ? '✏️ تعديل بيانات الصنف' : (isClone ? '📋 استنساخ صنف جديد' : '➕ إضافة صنف جديد للمخزن')}
            </h3>
            <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">
              ${isEdit ? `كود الصنف: <span class="mono font-bold" style="color:var(--primary);">${item.ID}</span>` : 'أدخل المواصفات والأسعار وموقع الرف وحد الأمان'}
            </div>
          </div>
          <button class="btn btn-ghost btn-xs" id="closeItemModal">✕ إغلاق</button>
        </div>

        <!-- Section 1: Basic Product Identity -->
        <div class="card" style="padding:14px 16px;background:var(--paper3);border-color:var(--line-strong);margin-bottom:14px;">
          <h3 style="font-size:13.5px;margin-bottom:10px;">📌 البيانات الأساسية والتصنيف</h3>
          <div class="grid3">
            <div class="field" style="grid-column: span 2;">
              <label>اسم الصنف والموديل *</label>
              <input id="mItemName" value="${item.Name}" placeholder="مثال: شاشة لابتوب 15.6 LED Slim 30 Pin FHD" autofocus>
            </div>
            <div class="field">
              <label>القسم الرئيسي *</label>
              <select id="mItemCategory">
                ${INVENTORY_CATEGORIES.map(c=>`<option ${c===item.Category?'selected':''}>${c}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="grid3">
            <div class="field">
              <label>التصنيف الفرعي / النوع</label>
              <input id="mItemSubCat" value="${item.SubCategory}" list="subCatList" placeholder="اختر أو اكتب...">
              <datalist id="subCatList">
                ${(COMMON_SUBCATS[item.Category]||[]).map(sc=>`<option value="${sc}">`).join('')}
              </datalist>
            </div>
            <div class="field">
              <label>المخزن أو الفرع 🏢 *</label>
              <select id="mItemWarehouse">
                ${whNames.map(w=>`<option value="${w}" ${(item.Warehouse||'المخزن الرئيسي')===w?'selected':''}>🏢 ${w}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label>مكان التخزين والرف 📍</label>
              <input id="mItemShelf" value="${item.ShelfLocation}" placeholder="مثال: رف A-2 / درج 4">
            </div>
          </div>

          <div class="grid2">
            <div class="field">
              <label>كود القطعة / SKU (اختياري)</label>
              <input id="mItemSKU" value="${item.SKU}" placeholder="مثال: NT156FHM-N61">
            </div>
            <div class="field">
              <label>الأجهزة والموديلات المتوافقة (Compatibility)</label>
              <input id="mItemCompat" value="${item.CompatibleModels}" placeholder="مثال: Dell G15 5515, HP 15-ec...">
            </div>
          </div>
        </div>

        <!-- Section 2: Barcode & Label -->
        <div class="card" style="padding:14px 16px;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <h3 style="font-size:13.5px;margin:0;">🏷️ الباركود والملصقات</h3>
            <button class="btn btn-ghost btn-xs" id="genRandomBarcodeBtn" type="button">🎲 توليد باركود تلقائي</button>
          </div>
          <div class="grid2">
            <div class="field" style="margin-bottom:0;">
              <label>رقم الباركود (امسح بالليزر أو اكتب)</label>
              <input id="mItemBarcode" class="mono" value="${item.Barcode}" placeholder="6220000000000">
            </div>
            <div style="display:flex;align-items:flex-end;gap:8px;">
              <button class="btn btn-amber btn-sm" id="modalPrintStickerPreviewBtn" type="button" style="width:100%;">
                🏷️ طباعة ملصق باركود حراري
              </button>
            </div>
          </div>
        </div>

        <!-- Section 3: Smart Pricing & Profit Margin Calculator -->
        <div class="card" style="padding:14px 16px;margin-bottom:14px;background:var(--paper3);">
          <h3 style="font-size:13.5px;margin-bottom:10px;">💰 التسعير الذكي وهوامش الربح</h3>
          <div class="grid3">
            <div class="field">
              <label>سعر التكلفة / الشراء (ج.م) *</label>
              <input id="mItemBuy" type="number" step="any" value="${item.PurchasePrice||''}" placeholder="0.00">
            </div>
            <div class="field">
              <label>سعر البيع قطاعي للجمهور (ج.م) *</label>
              <input id="mItemSell" type="number" step="any" value="${item.SellPrice||''}" placeholder="0.00" style="font-weight:800;color:var(--green);">
            </div>
            <div class="field">
              <label>سعر الجملة / للفنيين (ج.م)</label>
              <input id="mItemWholesale" type="number" step="any" value="${item.WholesalePrice||''}" placeholder="0.00">
            </div>
          </div>

          <!-- Real-Time Profit Calculation Box -->
          <div class="fin-box" id="profitCalcBox" style="margin-top:6px;">
            <div class="fin-cell">
              <div class="l">صافي الربح للقطعة</div>
              <div class="v mono" id="calcProfitAmt" style="color:var(--green-text);">0 ج.م</div>
            </div>
            <div class="fin-cell">
              <div class="l">نسبة هامش الربح (Margin %)</div>
              <div class="v mono" id="calcMarginPct">0%</div>
            </div>
            <div class="fin-cell">
              <div class="l">نسبة الزيادة (Markup %)</div>
              <div class="v mono" id="calcMarkupPct">0%</div>
            </div>
          </div>
        </div>

        <!-- Section 4: Stock Levels & Warranty -->
        <div class="card" style="padding:14px 16px;margin-bottom:14px;">
          <h3 style="font-size:13.5px;margin-bottom:10px;">📦 المخزون، حد الأمان، والضمان</h3>
          <div class="grid4">
            <div class="field">
              <label>الكمية الحالية *</label>
              <input id="mItemQty" type="number" value="${item.Quantity||0}" min="0">
            </div>
            <div class="field">
              <label>حد الأمان (تنبيه النواقص)</label>
              <input id="mItemMinStock" type="number" value="${item.MinStock||2}" min="0" title="عند وصول الكمية لهذا الحد يظهر تنبيه">
            </div>
            <div class="field">
              <label>وحدة القياس</label>
              <select id="mItemUnit">
                ${UNITS.map(u=>`<option ${u===item.Unit?'selected':''}>${u}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label>فترة الضمان (بالأشهر)</label>
              <input id="mItemWarranty" type="number" value="${item.WarrantyMonths||0}" min="0" placeholder="0 = بدون">
            </div>
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="actions-row" style="margin-top:16px;">
          <button class="btn btn-ghost" id="cancelItemModalBtn" type="button">إلغاء</button>
          <div style="display:flex;gap:8px;">
            ${!isEdit ? `<button class="btn btn-green" id="saveAndNewItemBtn" type="button">➕💾 حفظ وإضافة صنف آخر</button>` : ''}
            <button class="btn btn-primary" id="saveItemMasterBtn" type="button">💾 حفظ الصنف</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Close handlers
    overlay.querySelector('#closeItemModal').onclick = ()=>overlay.remove();
    overlay.querySelector('#cancelItemModalBtn').onclick = ()=>overlay.remove();

    // Category change updates subcategory datalist
    overlay.querySelector('#mItemCategory').onchange = (e)=>{
      const cat = e.target.value;
      const dl = overlay.querySelector('#subCatList');
      dl.innerHTML = (COMMON_SUBCATS[cat]||[]).map(sc=>`<option value="${sc}">`).join('');
    };

    // Random barcode generator (EAN13 format prefix 20)
    overlay.querySelector('#genRandomBarcodeBtn').onclick = ()=>{
      const rnd = '20' + String(Date.now()).slice(-8) + Math.floor(Math.random()*90+10);
      overlay.querySelector('#mItemBarcode').value = rnd;
      showToast('تم توليد كود باركود فريد للصنف 🎲', 'info');
    };

    // Live Profit & Margin Calculation
    function updateProfitCalcs(){
      const buy = Number(overlay.querySelector('#mItemBuy').value)||0;
      const sell = Number(overlay.querySelector('#mItemSell').value)||0;
      const profit = sell - buy;
      const marginPct = sell > 0 ? Math.round((profit / sell) * 100) : 0;
      const markupPct = buy > 0 ? Math.round((profit / buy) * 100) : 0;

      const pAmtEl = overlay.querySelector('#calcProfitAmt');
      const pMargEl = overlay.querySelector('#calcMarginPct');
      const pMarkEl = overlay.querySelector('#calcMarkupPct');

      pAmtEl.textContent = `${profit.toLocaleString()} ج.م`;
      pAmtEl.style.color = profit >= 0 ? 'var(--green-text)' : 'var(--red)';
      pMargEl.textContent = `${marginPct}%`;
      pMarkEl.textContent = `${markupPct}%`;
    }

    overlay.querySelector('#mItemBuy').oninput = updateProfitCalcs;
    overlay.querySelector('#mItemSell').oninput = updateProfitCalcs;
    updateProfitCalcs();

    // Print sticker preview from inside modal
    overlay.querySelector('#modalPrintStickerPreviewBtn').onclick = ()=>{
      collectFormData();
      if(!item.Name){ showToast('يرجى كتابة اسم الصنف أولاً للمعاينة', 'error'); return; }
      openProductBarcodeSticker(item);
    };

    function collectFormData(){
      item.Name = overlay.querySelector('#mItemName').value.trim();
      item.Category = overlay.querySelector('#mItemCategory').value;
      item.SubCategory = overlay.querySelector('#mItemSubCat').value.trim();
      item.SKU = overlay.querySelector('#mItemSKU').value.trim();
      item.ShelfLocation = overlay.querySelector('#mItemShelf').value.trim();
      item.Warehouse = (overlay.querySelector('#mItemWarehouse') ? overlay.querySelector('#mItemWarehouse').value : null) || item.Warehouse || 'المخزن الرئيسي';
      item.CompatibleModels = overlay.querySelector('#mItemCompat').value.trim();
      item.Barcode = overlay.querySelector('#mItemBarcode').value.trim();
      item.PurchasePrice = Number(overlay.querySelector('#mItemBuy').value)||0;
      item.SellPrice = Number(overlay.querySelector('#mItemSell').value)||0;
      item.WholesalePrice = Number(overlay.querySelector('#mItemWholesale').value)||0;
      item.Quantity = Number(overlay.querySelector('#mItemQty').value)||0;
      item.MinStock = Number(overlay.querySelector('#mItemMinStock').value)||0;
      item.Unit = overlay.querySelector('#mItemUnit').value;
      item.WarrantyMonths = Number(overlay.querySelector('#mItemWarranty').value)||0;
    }

    async function handleSave(keepOpen){
      collectFormData();
      if(!item.Name){ showToast('اسم الصنف مطلوب', 'error'); return; }
      
      // Auto barcode if left empty
      if(!item.Barcode){
        item.Barcode = '20' + String(Date.now()).slice(-8) + Math.floor(Math.random()*90+10);
      }

      const saveBtn = overlay.querySelector('#saveItemMasterBtn');
      saveBtn.disabled = true; saveBtn.textContent = 'جارٍ الحفظ...';

      try{
        await saveInventoryItemRemote(item);
        showToast(`تم حفظ الصنف "${item.Name}" بنجاح ✅`, 'success');
        refreshInventorySectionOrTab();

        if(keepOpen){
          // Reset form for next item
          overlay.remove();
          openInventoryItemModal(null, false, item.Category);
        } else {
          overlay.remove();
        }
      }catch(e){
        showToast('تم حفظ الصنف محلياً', 'info');
        if(!keepOpen) overlay.remove();
      }
    }

    overlay.querySelector('#saveItemMasterBtn').onclick = ()=>handleSave(false);
    const saveAndNewBtn = overlay.querySelector('#saveAndNewItemBtn');
    if(saveAndNewBtn) saveAndNewBtn.onclick = ()=>handleSave(true);
  }

  renderModalHTML();
}

/* ---------------- Print Product Barcode Sticker (Multi-Size Responsive) ---------------- */
function openProductBarcodeSticker(item){
  if(!item) return;
  openStickerPrintModal({ type: 'product', data: item });
}

/* ---------------- Bulk Inventory Import Modal (استيراد جماعي من Excel/CSV) ---------------- */
function openInventoryImportModal(){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:650px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:16px;">
        <h3 style="margin:0;font-size:16px;">📂 استيراد أصناف جماعي من ملف Excel / CSV</h3>
        <button class="btn btn-ghost btn-xs" id="closeImportModal">✕</button>
      </div>

      <div style="background:var(--paper3);border:1px solid var(--line);border-radius:var(--radius-sm);padding:14px;margin-bottom:16px;font-size:12.5px;line-height:1.7;">
        <b>💡 تعليمات الاستيراد:</b>
        <ol style="margin-right:18px;margin-top:4px;">
          <li>يمكنك تنزيل النموذج الجاهز وتعبئته ببيانات أصنافك.</li>
          <li>الأعمدة المطلوبة: <b>الاسم، القسم، الباركود، الكمية، سعر الشراء، سعر البيع، مكان الرف</b>.</li>
          <li>يدعم الملفات بصيغة CSV أو Excel (.csv).</li>
        </ol>
        <button class="btn btn-ghost btn-xs" id="downloadImportTemplateBtn" style="margin-top:6px;">📥 تنزيل نموذج الاستيراد الفارغ (Template)</button>
      </div>

      <div class="field">
        <label>اختر ملف CSV / Excel من جهازك</label>
        <input type="file" id="csvFileInput" accept=".csv,text/csv" style="padding:7px;">
      </div>

      <div id="importPreviewMount" style="margin-top:12px;"></div>

      <div class="actions-row" style="margin-top:16px;">
        <button class="btn btn-ghost" id="cancelImportBtn">إلغاء</button>
        <button class="btn btn-primary" id="processImportBtn" disabled>🚀 استيراد الأصناف إلى المخزن</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#closeImportModal').onclick = ()=>overlay.remove();
  overlay.querySelector('#cancelImportBtn').onclick = ()=>overlay.remove();

  // Template download
  overlay.querySelector('#downloadImportTemplateBtn').onclick = ()=>{
    const headers = ['اسم الصنف','القسم','الباركود','الكمية','سعر الشراء','سعر البيع','سعر الجملة','مكان الرف','الموديلات المتوافقة'];
    const sampleRows = [
      ['شاشة لابتوب 15.6 LED FHD','صيانة','20260001',10,1200,1650,1450,'رف A-1','Dell G15, HP 15'],
      ['كاميرا مراقبة Hikvision 5MP','كاميرات','20260002',5,450,650,550,'رف C-3','-'],
      ['ماوس لاسلكي Logitech M170','إكسسوار','20260003',20,110,180,140,'رف E-2','-']
    ];
    downloadCSV('Inventory_Import_Template.csv', headers, sampleRows);
  };

  let parsedItems = [];
  const fileInput = overlay.querySelector('#csvFileInput');
  fileInput.onchange = (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (evt)=>{
      const text = evt.target.result;
      const lines = text.split(/\r?\n/).filter(l=>l.trim());
      if(lines.length <= 1){ showToast('الملف فارغ أو لا يحتوي على بيانات كافية', 'error'); return; }

      parsedItems = [];
      for(let i=1; i<lines.length; i++){
        const cols = lines[i].split(',').map(c=>c.replace(/^["']|["']$/g,'').trim());
        if(cols[0]){
          parsedItems.push({
            ID: 'inv_' + Date.now() + '_' + i,
            Name: cols[0],
            Category: cols[1] || 'صيانة',
            Barcode: cols[2] || ('20' + String(Date.now()).slice(-8) + i),
            Quantity: Number(cols[3])||0,
            PurchasePrice: Number(cols[4])||0,
            SellPrice: Number(cols[5])||0,
            WholesalePrice: Number(cols[6])||0,
            ShelfLocation: cols[7] || '',
            CompatibleModels: cols[8] || '',
            MinStock: 2,
            Unit: 'قطعة'
          });
        }
      }

      const previewMount = overlay.querySelector('#importPreviewMount');
      previewMount.innerHTML = `
        <div style="background:var(--green-bg);color:var(--green-text);padding:8px 12px;border-radius:var(--radius-sm);font-size:12px;font-weight:700;margin-bottom:8px;">
          ✅ تم قراءة <b>${parsedItems.length}</b> صنف بنجاح وجاهز للاستيراد.
        </div>
      `;
      overlay.querySelector('#processImportBtn').disabled = parsedItems.length === 0;
    };
    reader.readAsText(file);
  };

  overlay.querySelector('#processImportBtn').onclick = async ()=>{
    const btn = overlay.querySelector('#processImportBtn');
    btn.disabled = true; btn.textContent = 'جارٍ الاستيراد...';
    for(const it of parsedItems){
      try{ await saveInventoryItemRemote(it); }catch(e){}
    }
    showToast(`تم استيراد ${parsedItems.length} صنف بنجاح إلى المخزن! 🎉`, 'success');
    overlay.remove();
    refreshInventorySectionOrTab();
  };
}

/* ---------------- Multi-Warehouse Manager Modal (إدارة المخازن والفروع المتعددة) ---------------- */
function openWarehouseManagerModal(){
  const existing = document.getElementById('warehouseManagerModal');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'warehouseManagerModal';

  function renderModal(){
    const rawWhs = state.warehouses || ['المخزن الرئيسي', 'مخزن المعرض / المحل', 'مخزن قطع الغيار'];
    const whList = rawWhs.map(w => typeof w === 'string' ? { name: w } : w);

    overlay.innerHTML = `
      <div class="modal-content" style="max-width:680px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#FF9500,#e05300);display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;box-shadow:0 4px 10px rgba(255,149,0,0.3);">🏢</div>
            <div>
              <h3 style="margin:0;font-size:17px;font-weight:900;">إدارة المخازن والفروع المتعددة</h3>
              <div style="font-size:12px;color:var(--ink-secondary);">إضافة وحذف وتخصيص المخازن ونقاط التخزين للشركة</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-xs" id="closeWhModal">✕ إغلاق</button>
        </div>

        <!-- Add New Warehouse Input -->
        <div class="card" style="padding:14px;background:var(--paper3);border:1px solid var(--line-strong);margin-bottom:16px;">
          <div style="font-weight:800;font-size:13px;margin-bottom:8px;color:var(--ink);">➕ إنشاء مخزن أو نقطة توزيع جديدة</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <input type="text" id="newWhNameInput" placeholder="اسم المخزن أو الفرع (مثال: مخزن فرع المعادي، مخزن الصيانة)..." style="flex:1;min-width:200px;">
            <button class="btn btn-primary" id="addNewWhBtn">➕ إضافة المخزن</button>
          </div>
        </div>

        <!-- Existing Warehouses List -->
        <div style="font-weight:800;font-size:13.5px;margin-bottom:10px;color:var(--ink);">قائمة المخازن المسجلة حالياً (${whList.length}):</div>
        <div style="display:flex;flex-direction:column;gap:10px;max-height:360px;overflow-y:auto;padding-left:4px;">
          ${whList.map((w, idx) => {
            const wName = w.name;
            const itemsInWh = (state.inventory || []).filter(it => (it.Warehouse || 'المخزن الرئيسي') === wName);
            const totalUnits = itemsInWh.reduce((s, it) => s + Number(it.Quantity || 0), 0);
            const isMain = wName === 'المخزن الرئيسي' || idx === 0;

            return `
              <div style="display:flex;justify-content:space-between;align-items:center;background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                <div style="display:flex;align-items:center;gap:12px;">
                  <div style="width:34px;height:34px;border-radius:10px;background:rgba(255,149,0,0.12);color:#ea580c;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;">🏢</div>
                  <div>
                    <div style="font-weight:800;font-size:13.5px;color:var(--ink);display:flex;align-items:center;gap:6px;">
                      ${wName}
                      ${isMain ? `<span class="status-badge st-check" style="font-size:10px;">الأساسي</span>` : ''}
                    </div>
                    <div style="font-size:11.5px;color:var(--ink-secondary);margin-top:2px;">
                      <span>الأصناف المسجلة: <b class="mono" style="color:var(--ink);">${itemsInWh.length}</b> صنف</span> • 
                      <span>إجمالي القطع: <b class="mono" style="color:var(--ink);">${totalUnits}</b> قطعة</span>
                    </div>
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                  <button class="btn btn-xs btn-ghost" data-filterwh="${wName}" title="عرض أصناف هذا المخزن">👁️ استعراض</button>
                  ${!isMain ? `
                    <button class="btn btn-xs btn-red" data-delwh="${wName}" title="حذف المخزن">🗑️ حذف</button>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="actions-row" style="margin-top:16px;border-top:1px solid var(--line);padding-top:12px;">
          <button class="btn btn-ghost" id="closeWhModal2">إغلاق</button>
        </div>
      </div>
    `;

    // Handlers
    overlay.querySelector('#closeWhModal').onclick = ()=>overlay.remove();
    overlay.querySelector('#closeWhModal2').onclick = ()=>overlay.remove();

    overlay.querySelector('#addNewWhBtn').onclick = ()=>{
      const val = (overlay.querySelector('#newWhNameInput').value || '').trim();
      if(!val){ showToast('يرجى إدخال اسم المخزن أولاً', 'error'); return; }
      const current = (state.warehouses || ['المخزن الرئيسي']).map(w => typeof w === 'string' ? w : w.name);
      if(current.includes(val)){ showToast('اسم المخزن موجود بالفعل', 'error'); return; }
      current.push(val);
      state.warehouses = current;
      setCache('warehouses', state.warehouses);
      recordAuditLog('إنشاء مخزن جديد', 'المخزن', `تم إنشاء مخزن جديد باسم: (${val})`, val);
      showToast(`تم إضافة المخزن "${val}" بنجاح 🏢`, 'success');
      renderModal();
      refreshInventorySectionOrTab();
    };

    overlay.querySelectorAll('[data-filterwh]').forEach(btn => {
      btn.onclick = ()=>{
        state.selectedWarehouseFilter = btn.dataset.filterwh;
        overlay.remove();
        if(state.currentSection !== 'inventory'){ state.currentSection = 'inventory'; render(); }
        else refreshInventorySectionOrTab();
      };
    });

    overlay.querySelectorAll('[data-delwh]').forEach(btn => {
      btn.onclick = ()=>{
        const targetWh = btn.dataset.delwh;
        const current = (state.warehouses || ['المخزن الرئيسي']).map(w => typeof w === 'string' ? w : w.name);
        const hasItems = (state.inventory || []).some(it => (it.Warehouse || 'المخزن الرئيسي') === targetWh);
        if(hasItems){
          if(!confirm(`تنبيه: يوجد أصناف مسجلة في "${targetWh}". هل تريد بالتأكيد حذف المخزن ونقل أصنافه للمخزن الرئيسي؟`)) return;
          (state.inventory || []).forEach(it => {
            if((it.Warehouse || 'المخزن الرئيسي') === targetWh){
              it.Warehouse = 'المخزن الرئيسي';
            }
          });
          setCache('inventory', state.inventory);
        } else {
          if(!confirm(`هل أنت متأكد من حذف المخزن "${targetWh}"؟`)) return;
        }
        state.warehouses = current.filter(w => w !== targetWh);
        setCache('warehouses', state.warehouses);
        recordAuditLog('حذف مخزن', 'المخزن', `تم حذف المخزن (${targetWh})`, targetWh);
        showToast(`تم حذف المخزن "${targetWh}" بنجاح`, 'info');
        renderModal();
        refreshInventorySectionOrTab();
      };
    });
  }

  renderModal();
  document.body.appendChild(overlay);
}

/* ---------------- Multi-Warehouse Transfer Modal (تحويل أرصدة بين المخازن والفروع) ---------------- */
function openWarehouseTransferModal(preselectedItem=null){
  const existing = document.getElementById('warehouseTransferModal');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'warehouseTransferModal';

  const whs = (state.warehouses || ['المخزن الرئيسي', 'مخزن المعرض / المحل', 'مخزن قطع الغيار']).map(w => typeof w === 'string' ? w : w.name);
  if(whs.length < 2){
    showToast('يجب إنشاء مخزنين على الأقل لتنفيذ عمليات التحويل المخزني', 'error');
    openWarehouseManagerModal();
    return;
  }

  let selItem = preselectedItem || (state.inventory && state.inventory[0]) || null;
  let fromWh = selItem ? (selItem.Warehouse || 'المخزن الرئيسي') : whs[0];
  let toWh = whs.find(w => w !== fromWh) || whs[1];

  function renderModal(){
    const availQty = selItem ? Number(selItem.Quantity || 0) : 0;

    overlay.innerHTML = `
      <div class="modal-content" style="max-width:640px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#007AFF,#0051a8);display:flex;align-items:center;justify-content:center;color:#fff;font-size:20px;box-shadow:0 4px 10px rgba(0,122,255,0.3);">🔄</div>
            <div>
              <h3 style="margin:0;font-size:17px;font-weight:900;">تحويل أرصدة بين المخازن والفروع</h3>
              <div style="font-size:12px;color:var(--ink-secondary);">نقل كميات الأصناف وتحديث الأرصدة وسجل الحركات آلياً</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-xs" id="closeWhTransModal">✕ إغلاق</button>
        </div>

        <!-- Step 1: Select Item -->
        <div class="field" style="margin-bottom:14px;">
          <label>الصنف المراد تحويله *</label>
          <select id="transItemSelect" style="font-weight:700;font-size:13.5px;">
            ${(state.inventory || []).map(it => `
              <option value="${it.ID}" ${selItem && selItem.ID===it.ID ? 'selected' : ''}>
                ${it.Name} (${it.Warehouse || 'المخزن الرئيسي'}) - الرصيد: ${it.Quantity} ${it.Unit||'قطعة'}
              </option>
            `).join('')}
          </select>
        </div>

        ${selItem ? `
          <div style="background:var(--paper3);border:1px solid var(--line);border-radius:10px;padding:12px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:800;font-size:13px;color:var(--ink);">${selItem.Name}</div>
              <div style="font-size:11.5px;color:var(--ink-secondary);margin-top:2px;">
                ${selItem.Barcode ? `باركود: <span class="mono">${selItem.Barcode}</span> • ` : ''}
                القسم: ${selItem.Category||'صيانة'}
              </div>
            </div>
            <div style="text-align:left;">
              <div style="font-size:11px;color:var(--ink-secondary);">الرصيد المتاح بالمخزن المصدر</div>
              <div class="mono font-bold" style="font-size:16px;color:${availQty>0?'var(--green-text)':'var(--red)'};">${availQty} <span style="font-size:11px;">${selItem.Unit||'قطعة'}</span></div>
            </div>
          </div>
        ` : ''}

        <!-- Step 2: From Warehouse & To Warehouse -->
        <div class="grid2" style="margin-bottom:14px;">
          <div class="field">
            <label>من المخزن (المصدر) *</label>
            <select id="transFromWh">
              ${whs.map(w => `<option value="${w}" ${fromWh===w ? 'selected' : ''}>🏢 ${w}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>إلى المخزن (الوجهة) *</label>
            <select id="transToWh">
              ${whs.map(w => `<option value="${w}" ${toWh===w ? 'selected' : ''} ${fromWh===w ? 'disabled' : ''}>🏢 ${w}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Step 3: Quantity & Notes -->
        <div class="grid2" style="margin-bottom:14px;">
          <div class="field">
            <label>الكمية المراد تحويلها *</label>
            <input type="number" id="transQty" value="1" min="1" max="${availQty}" style="font-weight:900;font-size:15px;color:var(--primary);">
          </div>
          <div class="field">
            <label>السبب / بيان التحويل (اختياري)</label>
            <input type="text" id="transNotes" placeholder="مثال: تموين فرع، صرف لمركز الصيانة...">
          </div>
        </div>

        <div class="actions-row" style="margin-top:16px;border-top:1px solid var(--line);padding-top:12px;">
          <button class="btn btn-ghost" id="cancelWhTransBtn">إلغاء</button>
          <button class="btn btn-primary" id="confirmWhTransBtn" ${availQty<=0?'disabled':''}>🚀 تنفيذ التحويل المخزني</button>
        </div>
      </div>
    `;

    // Handlers
    overlay.querySelector('#closeWhTransModal').onclick = ()=>overlay.remove();
    overlay.querySelector('#cancelWhTransBtn').onclick = ()=>overlay.remove();

    const itemSel = overlay.querySelector('#transItemSelect');
    if(itemSel){
      itemSel.onchange = (e)=>{
        selItem = (state.inventory || []).find(x => x.ID === e.target.value);
        if(selItem) fromWh = selItem.Warehouse || 'المخزن الرئيسي';
        if(toWh === fromWh) toWh = whs.find(w => w !== fromWh) || whs[0];
        renderModal();
      };
    }

    const fromSel = overlay.querySelector('#transFromWh');
    if(fromSel){
      fromSel.onchange = (e)=>{
        fromWh = e.target.value;
        if(toWh === fromWh) toWh = whs.find(w => w !== fromWh) || whs[0];
        renderModal();
      };
    }

    const toSel = overlay.querySelector('#transToWh');
    if(toSel){
      toSel.onchange = (e)=>{
        toWh = e.target.value;
      };
    }

    const confirmBtn = overlay.querySelector('#confirmWhTransBtn');
    if(confirmBtn){
      confirmBtn.onclick = async ()=>{
        if(!selItem){ showToast('يرجى اختيار الصنف أولاً', 'error'); return; }
        if(fromWh === toWh){ showToast('لا يمكن التحويل لنفس المخزن', 'error'); return; }
        
        const qty = Number(overlay.querySelector('#transQty').value) || 0;
        if(qty <= 0){ showToast('يرجى تحديد كمية صحيحة أكبر من صفر', 'error'); return; }
        if(qty > availQty){ showToast(`الكمية المطلوبة (${qty}) تتجاوز الرصيد المتاح (${availQty})`, 'error'); return; }

        const notes = (overlay.querySelector('#transNotes').value || '').trim();

        confirmBtn.disabled = true; confirmBtn.textContent = 'جارٍ التنفيذ...';

        // 1. Deduct from source item
        selItem.Quantity = Math.max(0, Number(selItem.Quantity || 0) - qty);
        selItem.Warehouse = fromWh; // ensure set

        // 2. Add to destination warehouse:
        // Find if target warehouse already has an item with matching Barcode or Name
        let destItem = (state.inventory || []).find(x => 
          (x.Warehouse || 'المخزن الرئيسي') === toWh &&
          ((selItem.Barcode && x.Barcode === selItem.Barcode) || (x.Name === selItem.Name))
        );

        if(destItem){
          destItem.Quantity = Number(destItem.Quantity || 0) + qty;
        } else {
          // Clone item into destination warehouse
          destItem = {
            ...selItem,
            ID: 'inv_' + Date.now() + '_' + Math.floor(Math.random()*1000),
            Warehouse: toWh,
            Quantity: qty
          };
          state.inventory.push(destItem);
        }

        // 3. Record transfer history
        const transferRecord = {
          id: 'wht_' + Date.now(),
          date: new Date().toISOString(),
          itemId: selItem.ID,
          itemName: selItem.Name,
          barcode: selItem.Barcode || '',
          fromWarehouse: fromWh,
          toWarehouse: toWh,
          qty: qty,
          user: state.user ? state.user.name : 'مدير',
          notes: notes
        };

        if(!state.warehouseTransfers) state.warehouseTransfers = [];
        state.warehouseTransfers.unshift(transferRecord);
        setCache('warehouse_transfers', state.warehouseTransfers);
        setCache('inventory', state.inventory);

        recordAuditLog('تحويل مخزني', 'المخزن', `تم تحويل ${qty} قطعة من (${selItem.Name}) من [${fromWh}] إلى [${toWh}] - السبب: ${notes||'تحويل بضاعة'}`, transferRecord.id);

        try{
          await saveInventoryItemRemote(selItem);
          await saveInventoryItemRemote(destItem);
        }catch(e){}

        showToast(`تم تحويل ${qty} قطعة من "${selItem.Name}" إلى ${toWh} بنجاح ✅`, 'success');
        playNotificationChime();
        overlay.remove();
        refreshInventorySectionOrTab();
      };
    }
  }

  renderModal();
  document.body.appendChild(overlay);
}
