/* ---------------- Inventory Hub ---------------- */
function renderInventoryHubApp(app){
  if(!canUserAccessSection('inventory')){
    showToast('ليس لديك صلاحية للوصول إلى قسم المخزن والمشتريات', 'error');
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
          <span class="nav-item-icon">${getSvgIcon('package', 16)}</span><span>كل الأصناف</span>
        </div>
        <div class="nav-item ${state.invHubTab==='صيانة'?'active':''}" data-invhubtab="صيانة">
          <span class="nav-item-icon">${getSvgIcon('maintenance', 16)}</span><span>قطع غيار الصيانة</span>
        </div>
        <div class="nav-item ${state.invHubTab==='كاميرات'?'active':''}" data-invhubtab="كاميرات">
          <span class="nav-item-icon">${getSvgIcon('cameras', 16)}</span><span>مهمات الكاميرات</span>
        </div>
        <div class="nav-item ${state.invHubTab==='كمبيوتر'?'active':''}" data-invhubtab="كمبيوتر">
          <span class="nav-item-icon">${getSvgIcon('laptop', 16)}</span><span>أجهزة الكمبيوتر</span>
        </div>
        <div class="nav-item ${state.invHubTab==='إكسسوار'?'active':''}" data-invhubtab="إكسسوار">
          <span class="nav-item-icon">${getSvgIcon('headphones', 16)}</span><span>الإكسسوارات</span>
        </div>
        <div class="nav-item ${state.invHubTab==='serials'?'active':''}" data-invhubtab="serials">
          <span class="nav-item-icon">${getSvgIcon('barcode', 16)}</span><span>الأرقام التسلسلية والضمان</span>
        </div>
        <div class="nav-item ${state.invHubTab==='stocktake'?'active':''}" data-invhubtab="stocktake">
          <span class="nav-item-icon">${getSvgIcon('receipt', 16)}</span><span>جلسات الجرد المخزني</span>
        </div>
        <div class="nav-item ${state.invHubTab==='bundles'?'active':''}" data-invhubtab="bundles">
          <span class="nav-item-icon">${getSvgIcon('package', 16)}</span><span>الأطقم والتجميعات (BOM)</span>
        </div>

        <div class="nav-section">المشتريات والموردين</div>
        <div class="nav-item ${state.invHubTab==='purchases'?'active':''}" data-invhubtab="purchases">
          <span class="nav-item-icon">${getSvgIcon('download', 16)}</span><span>فواتير الشراء</span>
        </div>
        <div class="nav-item ${state.invHubTab==='purchase_returns'?'active':''}" data-invhubtab="purchase_returns">
          <span class="nav-item-icon">${getSvgIcon('refresh', 16)}</span><span>مرتجعات المشتريات</span>
        </div>
        <div class="nav-item ${state.invHubTab==='suppliers'?'active':''}" data-invhubtab="suppliers">
          <span class="nav-item-icon">${getSvgIcon('users', 16)}</span><span>سجل الموردين</span>
        </div>

        ${hasQuickTools ? `
          <div class="nav-section">أدوات الربط السريع</div>
          ${canUserAccessSection('barcode') ? `
            <div class="nav-item" id="invToBarcodeNav">
              <span class="nav-item-icon">${getSvgIcon('barcode', 16)}</span><span>استوديو طباعة الباركود</span>
            </div>
          ` : ''}
          ${canUserAccessSection('pos') ? `
            <div class="nav-item" id="invToPosNav">
              <span class="nav-item-icon">${getSvgIcon('pos', 16)}</span><span>نقطة البيع (POS)</span>
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
  else if(state.invHubTab==='purchase_returns') renderPurchaseReturns(main);
  else if(state.invHubTab==='suppliers') renderSuppliers(main);
  else if(state.invHubTab==='serials') renderSerialsView(main);
  else if(state.invHubTab==='stocktake') renderStocktakeView(main);
  else if(state.invHubTab==='bundles') renderBundlesView(main);
  else renderInventory(main, state.invHubTab, state.invHubTab==='all' ? 'كل أصناف الشركة' : `مخزون: ${state.invHubTab}`);
}

function refreshInventorySectionOrTab(){
  const main = document.getElementById('main');
  if(!main) return;
  if(state.currentSection === 'inventory'){
    if(state.invHubTab === 'purchases') renderPurchases(main);
    else if(state.invHubTab === 'purchase_returns') renderPurchaseReturns(main);
    else if(state.invHubTab === 'suppliers') renderSuppliers(main);
    else if(state.invHubTab === 'serials') renderSerialsView(main);
    else if(state.invHubTab === 'stocktake') renderStocktakeView(main);
    else if(state.invHubTab === 'bundles') renderBundlesView(main);
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

  // Stock Filter (Low Stock / Out of Stock / In Stock / Zero Cost) [F4]
  if(state.invStockFilter === 'low'){
    list = list.filter(it => Number(it.Quantity||0) <= Number(it.MinStock||2));
  } else if(state.invStockFilter === 'out'){
    list = list.filter(it => Number(it.Quantity||0) <= 0);
  } else if(state.invStockFilter === 'available'){
    list = list.filter(it => Number(it.Quantity||0) > 0);
  } else if(state.invStockFilter === 'zero_cost'){
    list = list.filter(it => Number(it.PurchasePrice||0) <= 0);
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
  const zeroCostCount = rawList.filter(it=>Number(it.PurchasePrice||0) <= 0).length;
  const whNames = (state.warehouses || ['المخزن الرئيسي', 'مخزن المعرض / المحل', 'مخزن قطع الغيار']).map(w => typeof w === 'string' ? w : w.name);

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${titleOverride || 'إدارة المخازن والأصناف'}</h2>
        <div class="subtitle mono" style="font-size:12px;color:var(--ink-secondary);">${list.length} صنف معروض من إجمالي ${totalItemsCount}</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" id="btnManageWarehouses" style="border-color:var(--line-strong);">${getSvgIcon('store', 14)} إدارة المخازن (${whNames.length})</button>
        <button class="btn btn-ghost btn-sm" id="btnTransferWarehouses" style="color:var(--primary);border-color:var(--primary);">${getSvgIcon('refresh', 14)} تحويل بين المخازن</button>
        <button class="btn btn-ghost btn-sm" id="exportInvExcelBtn">${getSvgIcon('download', 14)} تصدير CSV (Excel)</button>
        <button class="btn btn-ghost btn-sm" id="importInvExcelBtn">${getSvgIcon('upload', 14)} استيراد من Excel</button>
        <button class="btn btn-primary btn-sm" id="addNewItemMasterBtn">${getSvgIcon('plus', 14)} إضافة صنف جديد</button>
      </div>
    </div>

    <!-- Inventory KPIs -->
    <div class="stat-grid">
      <div class="stat-card blue">
        <div class="top-row"><span class="lbl">إجمالي الأصناف</span><div class="icon-box">${getSvgIcon('package', 16)}</div></div>
        <div class="num mono">${totalItemsCount}</div>
      </div>
      <div class="stat-card amber">
        <div class="top-row"><span class="lbl">قيمة المخزون (تكلفة)</span><div class="icon-box">${getSvgIcon('dollar', 16)}</div></div>
        <div class="num mono">${totalCostValue.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
      </div>
      <div class="stat-card green">
        <div class="top-row"><span class="lbl">القيمة البيعية المتوقعة</span><div class="icon-box">${getSvgIcon('trendUp', 16)}</div></div>
        <div class="num mono">${totalRetailValue.toLocaleString()} <span style="font-size:12px;font-weight:600;">ج.م</span></div>
      </div>
      <div class="stat-card red">
        <div class="top-row"><span class="lbl">النواقص وحد الأمان</span><div class="icon-box">${getSvgIcon('alert', 16)}</div></div>
        <div class="num mono">${lowStockCount}</div>
      </div>
      ${zeroCostCount > 0 ? `
      <div class="stat-card red" style="cursor:pointer;border:1.5px solid var(--red);" id="kpiZeroCostBtn" title="انقر لتصفية الأصناف التي بدون سعر تكلفة">
        <div class="top-row"><span class="lbl" style="color:var(--red);font-weight:800;">تكلفة صفرية (تنبيه)</span><div class="icon-box" style="color:var(--red);">${getSvgIcon('alert', 16)}</div></div>
        <div class="num mono" style="color:var(--red);">${zeroCostCount}</div>
      </div>
      ` : ''}
    </div>

    <!-- Filters & Quick Actions Bar -->
    <div class="filters-bar" style="margin-bottom:14px;display:flex;gap:10px;flex-wrap:wrap;">
      <input id="invSearchInput" placeholder="بحث بالاسم، الباركود، رقم الموديل SKU، المخزن، الرف..." value="${state.invSearchQ}" style="flex:1;min-width:220px;">
      
      <!-- Multi-Warehouse Selector -->
      <select id="invWarehouseFilterSelect" style="min-width:160px;font-weight:700;">
        <option value="all" ${state.selectedWarehouseFilter==='all'?'selected':''}>كل المخازن والفروع</option>
        ${whNames.map(w=>`<option value="${w}" ${state.selectedWarehouseFilter===w?'selected':''}>${w}</option>`).join('')}
      </select>

      <select id="invStockFilterSelect" style="min-width:140px;">
        <option value="all" ${state.invStockFilter==='all'?'selected':''}>كل مستويات المخزون</option>
        <option value="available" ${state.invStockFilter==='available'?'selected':''}>متوفر بالمخزن</option>
        <option value="low" ${state.invStockFilter==='low'?'selected':''}>قارب على النفاد (حد الأمان)</option>
        <option value="out" ${state.invStockFilter==='out'?'selected':''}>رصيد صفري (منتهي)</option>
        <option value="zero_cost" ${state.invStockFilter==='zero_cost'?'selected':''}>⚠️ تكلفة صفرية (${zeroCostCount})</option>
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
                      ${it.WarrantyMonths ? `<span>• ضمان ${it.WarrantyMonths} شهر</span>` : ''}
                    </div>
                    ${it.CompatibleModels ? `<div style="font-size:10.5px;color:var(--slate-500);margin-top:1px;">متوافق: ${escapeHtml(it.CompatibleModels)}</div>` : ''}
                  </td>
                  <td>
                    <span style="background:rgba(0,122,255,0.08);color:var(--primary);padding:3px 8px;border-radius:6px;font-size:11px;font-weight:800;white-space:nowrap;">
                      ${escapeHtml(whName)}
                    </span>
                  </td>
                  ${categoryFilter==='all'?`<td style="text-align:center;"><span class="status-badge st-check" style="font-size:10px;">${escapeHtml(it.Category||'صيانة')}</span></td>`:''}
                  <td>
                    ${it.ShelfLocation ? `<span style="background:var(--paper3);border:1px solid var(--line-strong);padding:2px 7px;border-radius:4px;font-size:11px;font-weight:700;color:var(--ink);">${escapeHtml(it.ShelfLocation)}</span>` : '<span style="color:var(--slate-400);font-size:11px;">-</span>'}
                  </td>
                  <td>
                    ${it.Barcode ? `
                      <div style="display:flex;align-items:center;gap:4px;">
                        <span class="mono" style="font-size:11px;font-weight:700;color:var(--ink-secondary);">${escapeHtml(it.Barcode)}</span>
                        <button class="btn btn-xs btn-amber" onclick="printInventoryStickerDirect('${it.ID}'); event.stopPropagation();" title="طباعة ملصق الباركود الحراري" style="padding:2px 5px;line-height:1;">${getSvgIcon('tag', 12)}</button>
                      </div>
                    ` : '<span style="color:var(--slate-400);font-size:11px;">بدون</span>'}
                  </td>
                  <td style="text-align:center;">
                    <div style="display:flex;align-items:center;justify-content:center;gap:4px;">
                      <span class="mono" style="font-weight:900;font-size:13.5px;color:${isLowStock?'var(--red)':'var(--ink)'};">${qty}</span>
                      <span style="font-size:11px;color:var(--ink-secondary);">${escapeHtml(it.Unit||'قطعة')}</span>
                      ${isLowStock ? `<span title="الكمية وصلت لحد الأمان أو نفدت" style="color:var(--amber);display:inline-flex;">${getSvgIcon('alert', 12)}</span>` : ''}
                    </div>
                  </td>
                  <td class="mono font-bold" style="text-align:center;">
                    ${buy > 0 ? `${buy.toLocaleString()} ج.م` : `<span class="badge" style="background:rgba(239,68,68,0.12);color:var(--red);font-size:10px;font-weight:800;padding:2px 6px;">بدون تكلفة (0)</span>`}
                  </td>
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

  const kpiZeroBtn = document.getElementById('kpiZeroCostBtn');
  if(kpiZeroBtn){
    kpiZeroBtn.onclick = () => {
      state.invStockFilter = 'zero_cost';
      renderInventory(main, categoryFilter, titleOverride);
    };
  }

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
              ${isEdit ? 'تعديل بيانات الصنف' : (isClone ? 'استنساخ صنف جديد' : 'إضافة صنف جديد للمخزن')}
            </h3>
            <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">
              ${isEdit ? `كود الصنف: <span class="mono font-bold" style="color:var(--primary);">${item.ID}</span>` : 'أدخل المواصفات والأسعار وموقع الرف وحد الأمان'}
            </div>
          </div>
          <button class="btn btn-ghost btn-xs" id="closeItemModal">&times; إغلاق</button>
        </div>

        <!-- Section 1: Basic Product Identity -->
        <div class="card" style="padding:14px 16px;background:var(--paper3);border-color:var(--line-strong);margin-bottom:14px;">
          <h3 style="font-size:13.5px;margin-bottom:10px;">البيانات الأساسية والتصنيف</h3>
          <div class="grid3">
            <div class="field" style="grid-column: span 2;">
              <label>اسم الصنف والموديل *</label>
              <input id="mItemName" value="${escapeHtml(item.Name||'')}" placeholder="مثال: شاشة لابتوب 15.6 LED Slim 30 Pin FHD" autofocus>
            </div>
            <div class="field">
              <label>القسم الرئيسي *</label>
              <select id="mItemCategory">
                ${INVENTORY_CATEGORIES.map(c=>`<option ${c===item.Category?'selected':''}>${escapeHtml(c)}</option>`).join('')}
              </select>
            </div>
          </div>

          <div class="grid3">
            <div class="field">
              <label>التصنيف الفرعي / النوع</label>
              <input id="mItemSubCat" value="${escapeHtml(item.SubCategory||'')}" list="subCatList" placeholder="اختر أو اكتب...">
              <datalist id="subCatList">
                ${(COMMON_SUBCATS[item.Category]||[]).map(sc=>`<option value="${escapeHtml(sc)}">`).join('')}
              </datalist>
            </div>
            <div class="field">
              <label>المخزن أو الفرع *</label>
              <select id="mItemWarehouse">
                ${whNames.map(w=>`<option value="${escapeHtml(w)}" ${(item.Warehouse||'المخزن الرئيسي')===w?'selected':''}>${escapeHtml(w)}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label>مكان التخزين والرف</label>
              <input id="mItemShelf" value="${escapeHtml(item.ShelfLocation||'')}" placeholder="مثال: رف A-2 / درج 4">
            </div>
          </div>

          <div class="grid2">
            <div class="field">
              <label>كود القطعة / SKU (اختياري)</label>
              <input id="mItemSKU" value="${escapeHtml(item.SKU||'')}" placeholder="مثال: NT156FHM-N61">
            </div>
            <div class="field">
              <label>الأجهزة والموديلات المتوافقة (Compatibility)</label>
              <input id="mItemCompat" value="${escapeHtml(item.CompatibleModels||'')}" placeholder="مثال: Dell G15 5515, HP 15-ec...">
            </div>
          </div>
        </div>

        <!-- Section 2: Barcode & Label -->
        <div class="card" style="padding:14px 16px;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <h3 style="font-size:13.5px;margin:0;">الباركود والملصقات</h3>
            <button class="btn btn-ghost btn-xs" id="genRandomBarcodeBtn" type="button">توليد باركود تلقائي</button>
          </div>
          <div class="grid2">
            <div class="field" style="margin-bottom:0;">
              <label>رقم الباركود (امسح بالليزر أو اكتب)</label>
              <input id="mItemBarcode" class="mono" value="${escapeHtml(item.Barcode||'')}" placeholder="6220000000000">
            </div>
            <div style="display:flex;align-items:flex-end;gap:8px;">
              <button class="btn btn-amber btn-sm" id="modalPrintStickerPreviewBtn" type="button" style="width:100%;">
                ${getSvgIcon('tag', 14)} طباعة ملصق باركود حراري
              </button>
            </div>
          </div>
        </div>

        <!-- Section 3: Smart Pricing & Profit Margin Calculator -->
        <div class="card" style="padding:14px 16px;margin-bottom:14px;background:var(--paper3);">
          <h3 style="font-size:13.5px;margin-bottom:10px;">التسعير وهوامش الربح</h3>
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
          <h3 style="font-size:13.5px;margin-bottom:10px;">المخزون وحد الأمان والضمان</h3>
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
        <div class="actions-row" style="margin-top:16px;display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;gap:6px;">
            <button class="btn btn-ghost" id="cancelItemModalBtn" type="button">إلغاء</button>
            ${isEdit ? `
              <button class="btn btn-purple btn-sm" id="modalOpenItemSerialsBtn" type="button">
                ${getSvgIcon('barcode', 14)} السيريالات (${(state.serials||[]).filter(s=>String(s.ItemID)===String(item.ID)).length})
              </button>
              <button class="btn btn-amber btn-sm" id="modalOpenItemBomBtn" type="button">
                ${getSvgIcon('package', 14)} مكونات BOM (${(state.bundleItems||[]).filter(b=>String(b.BundleItemID)===String(item.ID)).length})
              </button>
            ` : ''}
          </div>
          <div style="display:flex;gap:8px;">
            ${!isEdit ? `<button class="btn btn-green" id="saveAndNewItemBtn" type="button">${getSvgIcon('plus', 14)} حفظ وإضافة صنف آخر</button>` : ''}
            <button class="btn btn-primary" id="saveItemMasterBtn" type="button">${getSvgIcon('check', 14)} حفظ الصنف</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Close handlers
    overlay.querySelector('#closeItemModal').onclick = ()=>overlay.remove();
    overlay.querySelector('#cancelItemModalBtn').onclick = ()=>overlay.remove();

    const serBtn = overlay.querySelector('#modalOpenItemSerialsBtn');
    if(serBtn){
      serBtn.onclick = () => {
        overlay.remove();
        state.invHubTab = 'serials';
        state.serialsSearchQ = item.Name;
        refreshInventorySectionOrTab();
      };
    }
    const bomBtn = overlay.querySelector('#modalOpenItemBomBtn');
    if(bomBtn){
      bomBtn.onclick = () => {
        overlay.remove();
        openBundleComponentsModal(item);
      };
    }

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
      showToast('تم توليد كود باركود فريد للصنف', 'info');
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
        showToast(`تم حفظ الصنف "${item.Name}" بنجاح`, 'success');
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
        <h3 style="margin:0;font-size:16px;">استيراد أصناف جماعي من ملف Excel / CSV</h3>
        <button class="btn btn-ghost btn-xs" id="closeImportModal" style="font-size:18px;line-height:1;" aria-label="إغلاق">&times;</button>
      </div>

      <div style="background:var(--paper3);border:1px solid var(--line);border-radius:var(--radius-sm);padding:14px;margin-bottom:16px;font-size:12.5px;line-height:1.7;">
        <b>تعليمات الاستيراد:</b>
        <ol style="margin-right:18px;margin-top:4px;">
          <li>يمكنك تنزيل النموذج الجاهز وتعبئته ببيانات أصنافك.</li>
          <li>الأعمدة المطلوبة: <b>الاسم، القسم، الباركود، الكمية، سعر الشراء، سعر البيع، مكان الرف</b>.</li>
          <li>يدعم الملفات بصيغة CSV المتوافقة مع معيار RFC-4180 أو Excel (.csv).</li>
        </ol>
        <button class="btn btn-ghost btn-xs" id="downloadImportTemplateBtn" style="margin-top:6px;">${getSvgIcon('download', 14)} تنزيل نموذج الاستيراد الفارغ (Template)</button>
      </div>

      <div class="field">
        <label>اختر ملف CSV / Excel من جهازك</label>
        <input type="file" id="csvFileInput" accept=".csv,text/csv" style="padding:7px;">
      </div>

      <div id="importPreviewMount" style="margin-top:12px;"></div>

      <div class="actions-row" style="margin-top:16px;">
        <button class="btn btn-ghost" id="cancelImportBtn">إلغاء</button>
        <button class="btn btn-primary" id="processImportBtn" disabled>${getSvgIcon('upload', 14)} استيراد الأصناف إلى المخزن</button>
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
      const rows = typeof parseCSV === 'function' ? parseCSV(text) : text.split(/\r?\n/).map(l=>l.split(','));
      if(rows.length <= 1){ showToast('الملف فارغ أو لا يحتوي على بيانات كافية', 'error'); return; }

      parsedItems = [];
      const existingBarcodes = new Set((state.inventory || []).map(x => String(x.Barcode || '').trim().toLowerCase()).filter(Boolean));
      const batchBarcodes = new Set();
      let duplicateBarcodeCount = 0;

      for(let i=1; i<rows.length; i++){
        const cols = (rows[i] || []).map(c => String(c || '').trim());
        const name = cols[0];
        if(!name) continue;

        let barcode = cols[2] || '';
        if(barcode){
          const bcLower = barcode.toLowerCase();
          if(existingBarcodes.has(bcLower) || batchBarcodes.has(bcLower)){
            duplicateBarcodeCount++;
            barcode = barcode + '-' + i;
          }
          batchBarcodes.add(barcode.toLowerCase());
        } else {
          barcode = '20' + String(Date.now()).slice(-8) + i;
          batchBarcodes.add(barcode.toLowerCase());
        }

        parsedItems.push({
          ID: 'inv_' + Date.now() + '_' + i,
          Name: name,
          Category: cols[1] || 'صيانة',
          Barcode: barcode,
          Quantity: Math.max(0, Number(cols[3]) || 0),
          PurchasePrice: Math.max(0, Number(cols[4]) || 0),
          SellPrice: Math.max(0, Number(cols[5]) || 0),
          WholesalePrice: Math.max(0, Number(cols[6]) || 0),
          ShelfLocation: cols[7] || '',
          CompatibleModels: cols[8] || '',
          MinStock: 2,
          Unit: 'قطعة'
        });
      }

      const previewMount = overlay.querySelector('#importPreviewMount');
      let previewHtml = `
        <div style="background:var(--green-bg);color:var(--green-text);padding:8px 12px;border-radius:var(--radius-sm);font-size:12px;font-weight:700;margin-bottom:8px;">
          <span style="display:inline-flex;align-items:center;gap:4px;color:var(--green);">${getSvgIcon('check', 14)} تم قراءة <b>${parsedItems.length}</b> صنف بنجاح وجاهز للاستيراد.</span>
        </div>
      `;
      if(duplicateBarcodeCount > 0){
        previewHtml += `
          <div style="background:rgba(245,158,11,0.12);color:#b45309;padding:8px 12px;border-radius:var(--radius-sm);font-size:12px;font-weight:700;margin-bottom:8px;">
            <span style="display:inline-flex;align-items:center;gap:4px;">${getSvgIcon('alert', 14)} تنبيه: تم رصد <b>${duplicateBarcodeCount}</b> باركود مكرر مسجل مسبقاً أو متكرر بالملف وتمت معالجتها تلقائياً لتفادي التعارض.</span>
          </div>
        `;
      }
      previewMount.innerHTML = previewHtml;
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
    showToast(`تم استيراد ${parsedItems.length} صنف بنجاح إلى المخزن`, 'success');
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
            <div style="width:36px;height:36px;border-radius:var(--radius-sm);background:var(--primary-light);display:flex;align-items:center;justify-content:center;color:var(--primary);border:1px solid var(--line);">
              ${getSvgIcon('store', 18)}
            </div>
            <div>
              <h3 style="margin:0;font-size:17px;font-weight:900;">إدارة المخازن والفروع المتعددة</h3>
              <div style="font-size:12px;color:var(--ink-secondary);">إضافة وحذف وتخصيص المخازن ونقاط التخزين للشركة</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-xs" id="closeWhModal">&times; إغلاق</button>
        </div>

        <!-- Add New Warehouse Input -->
        <div class="card" style="padding:14px;background:var(--paper3);border:1px solid var(--line-strong);margin-bottom:16px;">
          <div style="font-weight:800;font-size:13px;margin-bottom:8px;color:var(--ink);">إنشاء مخزن أو نقطة توزيع جديدة</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <input type="text" id="newWhNameInput" placeholder="اسم المخزن أو الفرع (مثال: مخزن فرع المعادي، مخزن الصيانة)..." style="flex:1;min-width:200px;">
            <button class="btn btn-primary" id="addNewWhBtn">${getSvgIcon('plus', 14)} إضافة المخزن</button>
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
              <div style="display:flex;justify-content:space-between;align-items:center;background:var(--paper);border:1px solid var(--line);border-radius:var(--radius-sm);padding:12px 14px;box-shadow:0 1px 3px rgba(0,0,0,0.03);">
                <div style="display:flex;align-items:center;gap:12px;">
                  <div style="width:32px;height:32px;border-radius:var(--radius-sm);background:var(--paper3);color:var(--primary);display:flex;align-items:center;justify-content:center;border:1px solid var(--line);">
                    ${getSvgIcon('store', 16)}
                  </div>
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
                  <button class="btn btn-xs btn-ghost" data-filterwh="${wName}" title="عرض أصناف هذا المخزن">${getSvgIcon('eye', 12)} استعراض</button>
                  ${!isMain ? `
                    <button class="btn btn-xs btn-red" data-delwh="${wName}" title="حذف المخزن">${getSvgIcon('trash', 12)} حذف</button>
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
      showToast(`تم إضافة المخزن "${val}" بنجاح`, 'success');
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
      btn.onclick = async ()=>{
        const targetWh = btn.dataset.delwh;
        const current = (state.warehouses || ['المخزن الرئيسي']).map(w => typeof w === 'string' ? w : w.name);
        const hasItems = (state.inventory || []).some(it => (it.Warehouse || 'المخزن الرئيسي') === targetWh);
        if(hasItems){
          const ok = await openConfirmModal({
            title: 'حذف مخزن ونقل أصنافه',
            message: `تنبيه: يوجد أصناف مسجلة في "${escapeHtml(targetWh)}".<br><br>هل تريد بالتأكيد حذف المخزن ونقل أصنافه تلقائياً إلى "المخزن الرئيسي"؟`,
            confirmText: 'نقل وحذف',
            cancelText: 'إلغاء',
            confirmClass: 'btn-danger'
          });
          if(!ok) return;
          (state.inventory || []).forEach(it => {
            if((it.Warehouse || 'المخزن الرئيسي') === targetWh){
              it.Warehouse = 'المخزن الرئيسي';
            }
          });
          setCache('inventory', state.inventory);
        } else {
          const ok = await openConfirmModal({
            title: 'حذف مخزن',
            message: `هل أنت متأكد من حذف المخزن "${escapeHtml(targetWh)}"؟`,
            confirmText: 'حذف المخزن',
            cancelText: 'إلغاء',
            confirmClass: 'btn-danger'
          });
          if(!ok) return;
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
            <div style="width:36px;height:36px;border-radius:var(--radius-sm);background:var(--primary-light);display:flex;align-items:center;justify-content:center;color:var(--primary);border:1px solid var(--line);">
              ${getSvgIcon('refresh', 18)}
            </div>
            <div>
              <h3 style="margin:0;font-size:17px;font-weight:900;">تحويل أرصدة بين المخازن والفروع</h3>
              <div style="font-size:12px;color:var(--ink-secondary);">نقل كميات الأصناف وتحديث الأرصدة وسجل الحركات آلياً</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-xs" id="closeWhTransModal" aria-label="إغلاق">&times; إغلاق</button>
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
              ${whs.map(w => `<option value="${w}" ${fromWh===w ? 'selected' : ''}>${w}</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>إلى المخزن (الوجهة) *</label>
            <select id="transToWh">
              ${whs.map(w => `<option value="${w}" ${toWh===w ? 'selected' : ''} ${fromWh===w ? 'disabled' : ''}>${w}</option>`).join('')}
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
          <button class="btn btn-primary" id="confirmWhTransBtn" ${availQty<=0?'disabled':''}>${getSvgIcon('check', 14)} تنفيذ التحويل المخزني</button>
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

        try {
          const res = await apiPost('transferWarehouseStock', {
            sourceId: selItem.ID,
            fromWarehouse: fromWh,
            toWarehouse: toWh,
            qty: qty,
            notes: notes,
            user: state.user ? state.user.name : ''
          });
          if(res && res.destId && destItem && destItem.ID !== res.destId && destItem.ID.startsWith('inv_')){
            destItem.ID = res.destId;
            setCache('inventory', state.inventory);
          }
        } catch(e) {
          console.warn('[openWarehouseTransferModal] transferWarehouseStock error, falling back to per-item save:', e);
          try {
            await saveInventoryItemRemote(selItem);
            await saveInventoryItemRemote(destItem);
          } catch(err2){}
        }

        showToast(`تم تحويل ${qty} قطعة من "${selItem.Name}" إلى ${toWh} بنجاح`, 'success');
        playNotificationChime();
        overlay.remove();
        refreshInventorySectionOrTab();
      };
    }
  }

  renderModal();
  document.body.appendChild(overlay);
}

/* ============================================================
   Serials & Warranty Tracking Views (U12)
   ============================================================ */
function renderSerialsView(main){
  if(!state.serialsSearchQ) state.serialsSearchQ = '';
  if(!state.serialsStatusFilter) state.serialsStatusFilter = 'all';

  const rawList = state.serials || [];
  const totalCount = rawList.length;
  const inStockCount = rawList.filter(s => (s.Status || 'In Stock') === 'In Stock').length;
  const soldCount = rawList.filter(s => s.Status === 'Sold').length;
  const installedCount = rawList.filter(s => s.Status === 'Installed').length;
  const activeWarrantyCount = rawList.filter(s => typeof isSerialUnderWarranty === 'function' && isSerialUnderWarranty(s)).length;

  const q = (state.serialsSearchQ || '').trim().toLowerCase();
  let list = rawList.filter(s => {
    if(state.serialsStatusFilter === 'In Stock') return (s.Status || 'In Stock') === 'In Stock';
    if(state.serialsStatusFilter === 'Sold') return s.Status === 'Sold';
    if(state.serialsStatusFilter === 'Installed') return s.Status === 'Installed';
    if(state.serialsStatusFilter === 'active_warranty') return typeof isSerialUnderWarranty === 'function' && isSerialUnderWarranty(s);
    if(state.serialsStatusFilter === 'expired_warranty') return typeof isSerialUnderWarranty === 'function' && !isSerialUnderWarranty(s);
    return true;
  });

  if(q){
    list = list.filter(s => 
      String(s.Serial||'').toLowerCase().includes(q) ||
      String(s.ItemName||'').toLowerCase().includes(q) ||
      String(s.SoldRef||'').toLowerCase().includes(q) ||
      String(s.Notes||'').toLowerCase().includes(q)
    );
  }

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon('barcode', 20)} تتبع الأرقام التسلسلية والضمان (Serials & Warranty)</h2>
        <div class="subtitle">إدارة وتتبع السيريالات، تاريخ انتهاء الضمان، وربط الأجهزة المباعة والمركبة بالمشاريع</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost btn-sm" id="refreshSerialsBtn">${getSvgIcon('refresh', 14)} تحديث</button>
        <button class="btn btn-primary btn-sm" id="addNewSerialBtn">${getSvgIcon('plus', 14)} إضافة سيريال جديد</button>
      </div>
    </div>

    <!-- KPIs Row -->
    <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:12px;margin-bottom:14px;">
      <div class="card" style="padding:12px 14px;background:var(--paper2);border:1px solid var(--line);">
        <div style="font-size:11.5px;color:var(--ink-secondary);">إجمالي السيريالات المسجلة</div>
        <div style="font-size:22px;font-weight:900;color:var(--ink);">${totalCount.toLocaleString()}</div>
      </div>
      <div class="card" style="padding:12px 14px;background:var(--paper2);border:1px solid var(--line);">
        <div style="font-size:11.5px;color:var(--ink-secondary);">متوفر بالمخزن (In Stock)</div>
        <div style="font-size:22px;font-weight:900;color:var(--blue);">${inStockCount.toLocaleString()}</div>
      </div>
      <div class="card" style="padding:12px 14px;background:var(--paper2);border:1px solid var(--line);">
        <div style="font-size:11.5px;color:var(--ink-secondary);">مباع للعملاء (Sold)</div>
        <div style="font-size:22px;font-weight:900;color:var(--green);">${soldCount.toLocaleString()}</div>
      </div>
      <div class="card" style="padding:12px 14px;background:var(--paper2);border:1px solid var(--line);">
        <div style="font-size:11.5px;color:var(--ink-secondary);">مركب بمشاريع كاميرات</div>
        <div style="font-size:22px;font-weight:900;color:var(--purple);">${installedCount.toLocaleString()}</div>
      </div>
      <div class="card" style="padding:12px 14px;background:var(--paper2);border:1px solid var(--line);">
        <div style="font-size:11.5px;color:var(--ink-secondary);">ضمان ساري ونشط</div>
        <div style="font-size:22px;font-weight:900;color:var(--emerald, #059669);">${activeWarrantyCount.toLocaleString()}</div>
      </div>
    </div>

    <!-- Filter & Search Controls -->
    <div class="card" style="padding:12px 16px;margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
          <span style="font-size:12px;font-weight:700;color:var(--ink-secondary);">الحالة:</span>
          ${[
            { id: 'all', label: 'الكل' },
            { id: 'In Stock', label: 'في المخزن' },
            { id: 'Sold', label: 'مباع' },
            { id: 'Installed', label: 'مركب بمشروع' },
            { id: 'active_warranty', label: 'ضمان ساري 🛡️' },
            { id: 'expired_warranty', label: 'منتهي الضمان' }
          ].map(f => `
            <button class="btn btn-xs ${state.serialsStatusFilter===f.id?'btn-primary':'btn-ghost'}" data-serialfilter="${f.id}" style="font-size:11.5px;padding:3px 10px;">${f.label}</button>
          `).join('')}
        </div>
        <div style="display:flex;gap:8px;min-width:260px;">
          <input type="text" id="serialsSearchInp" value="${escapeHtml(state.serialsSearchQ)}" placeholder="بحث برقم السيريال، الصنف، مرجع البيع..." style="font-size:12.5px;padding:6px 12px;border:1px solid var(--line);border-radius:4px;flex:1;">
        </div>
      </div>
    </div>

    <!-- Serials Table -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3 style="margin:0;font-size:14px;font-weight:800;">سجل السيريالات والضمان (${list.length})</h3>
      </div>
      ${list.length === 0 ? '<div class="empty">لا توجد أرقام تسلسلية مطابقة لشروط البحث.</div>' : `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th style="width:160px;">الرقم التسلسلي (SN)</th>
                <th style="min-width:200px;">الصنف المرتبط</th>
                <th style="width:110px;text-align:center;">الحالة</th>
                <th style="width:140px;text-align:center;">فترة الضمان</th>
                <th style="width:130px;">تاريخ البيع / التركيب</th>
                <th style="width:140px;">مرجع العملية</th>
                <th style="width:110px;text-align:center;">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              ${list.map(s => {
                const isUnderWar = typeof isSerialUnderWarranty === 'function' ? isSerialUnderWarranty(s) : false;
                const statusBadge = s.Status === 'Sold' 
                  ? '<span class="badge" style="background:#ecfdf5;color:#047857;font-weight:700;">مباع</span>'
                  : (s.Status === 'Installed'
                    ? '<span class="badge" style="background:#f3e8ff;color:#7e22ce;font-weight:700;">مركب</span>'
                    : '<span class="badge" style="background:#eff6ff;color:#1d4ed8;font-weight:700;">في المخزن</span>');
                
                return `
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:6px;">
                        <span class="mono font-bold" style="font-size:13px;letter-spacing:0.5px;color:var(--primary);">${escapeHtml(s.Serial||'')}</span>
                      </div>
                    </td>
                    <td>
                      <b style="font-size:13px;">${escapeHtml(s.ItemName||'')}</b>
                      ${s.Notes ? `<div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">${escapeHtml(s.Notes)}</div>` : ''}
                    </td>
                    <td style="text-align:center;">${statusBadge}</td>
                    <td style="text-align:center;">
                      ${s.WarrantyEnd ? `
                        <div style="font-size:11.5px;font-weight:700;color:${isUnderWar?'var(--emerald, #059669)':'var(--red)'};">
                          ${cleanDate(s.WarrantyEnd)}
                        </div>
                        <span class="badge" style="font-size:10px;padding:1px 6px;margin-top:2px;${isUnderWar?'background:#ecfdf5;color:#047857;':'background:#fee2e2;color:#991b1b;'}">
                          ${isUnderWar ? '🛡️ ضمان ساري' : 'منتهي الضمان'}
                        </span>
                      ` : (s.WarrantyMonths ? `<span style="font-size:12px;">${s.WarrantyMonths} شهور</span>` : '<span style="color:var(--ink-secondary);font-size:11px;">-</span>')}
                    </td>
                    <td style="font-size:12px;">${cleanDate(s.SoldDate)}</td>
                    <td style="font-size:12px;">
                      ${s.SoldRef ? `<span class="mono font-bold" style="background:var(--paper3);padding:2px 6px;border-radius:4px;">${escapeHtml(s.SoldRef)}</span>` : '<span style="color:var(--ink-secondary);">-</span>'}
                    </td>
                    <td style="text-align:center;">
                      <button class="btn btn-ghost btn-xs edit-serial-btn" data-serial-id="${escapeHtml(s.ID)}" title="تعديل بيانات السيريال">${getSvgIcon('edit', 13)} تعديل</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;

  // Attach Handlers
  document.querySelectorAll('[data-serialfilter]').forEach(b => {
    b.onclick = () => { state.serialsStatusFilter = b.dataset.serialfilter; renderSerialsView(main); };
  });

  const sInp = document.getElementById('serialsSearchInp');
  if(sInp){
    sInp.oninput = () => { state.serialsSearchQ = sInp.value; };
    sInp.onkeydown = (e) => { if(e.key === 'Enter') renderSerialsView(main); };
  }

  const addBtn = document.getElementById('addNewSerialBtn');
  if(addBtn) addBtn.onclick = () => openAddSerialModal();

  const refBtn = document.getElementById('refreshSerialsBtn');
  if(refBtn) refBtn.onclick = async () => {
    refBtn.disabled = true; refBtn.textContent = 'جارٍ التحديث...';
    await loadSerials();
    renderSerialsView(main);
  };

  main.querySelectorAll('.edit-serial-btn').forEach(btn => {
    btn.onclick = () => {
      const sObj = (state.serials || []).find(x => String(x.ID) === btn.dataset.serialId);
      if(sObj) openAddSerialModal(sObj);
    };
  });
}

function openAddSerialModal(editSerial = null){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const isEdit = !!editSerial;

  const itemOptions = (state.inventory || []).map(it => `
    <option value="${it.ID}" ${editSerial && String(editSerial.ItemID) === String(it.ID) ? 'selected' : ''}>
      ${escapeHtml(it.Name)} (${it.Category || ''}) - ${it.Quantity || 0} متوفر
    </option>
  `).join('');

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:560px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
        <h3 style="margin:0;font-size:16px;font-weight:900;">
          ${isEdit ? 'تعديل بيانات الرقم التسلسلي' : 'إضافة رقم تسلسلي جديد (Serial Number)'}
        </h3>
        <button class="btn btn-ghost btn-xs" id="closeSerialModal">&times; إغلاق</button>
      </div>

      <div class="field" style="margin-bottom:12px;">
        <label>الصنف المرتبط من المخزن *</label>
        <select id="modalSerialItemId">
          <option value="">-- اختر الصنف من المخزن --</option>
          ${itemOptions}
        </select>
      </div>

      <div class="field" style="margin-bottom:12px;">
        <label>الرقم التسلسلي (Serial Number / S/N) *</label>
        <div style="display:flex;gap:6px;">
          <input type="text" id="modalSerialValue" class="mono font-bold" value="${editSerial ? escapeHtml(editSerial.Serial||'') : ''}" placeholder="أدخل السيريال أو امسح الباركود..." style="flex:1;">
          <button type="button" class="btn btn-ghost btn-sm" id="genSerialValBtn" style="white-space:nowrap;">توليد آلي</button>
        </div>
      </div>

      <div class="grid2" style="margin-bottom:12px;">
        <div class="field">
          <label>مدة الضمان (بالشهور)</label>
          <input type="number" id="modalSerialWarrantyMonths" min="0" value="${editSerial ? (editSerial.WarrantyMonths||0) : 12}">
        </div>
        <div class="field">
          <label>تاريخ انتهاء الضمان (اختياري)</label>
          <input type="date" id="modalSerialWarrantyEnd" value="${editSerial ? (editSerial.WarrantyEnd||'') : ''}">
        </div>
      </div>

      <div class="grid2" style="margin-bottom:12px;">
        <div class="field">
          <label>حالة السيريال</label>
          <select id="modalSerialStatus">
            <option value="In Stock" ${!editSerial || editSerial.Status === 'In Stock' ? 'selected' : ''}>في المخزن (In Stock)</option>
            <option value="Sold" ${editSerial && editSerial.Status === 'Sold' ? 'selected' : ''}>مباع (Sold)</option>
            <option value="Installed" ${editSerial && editSerial.Status === 'Installed' ? 'selected' : ''}>مركب بمشروع (Installed)</option>
          </select>
        </div>
        <div class="field">
          <label>مرجع البيع / الفاتورة / المشروع</label>
          <input type="text" id="modalSerialSoldRef" value="${editSerial ? escapeHtml(editSerial.SoldRef||'') : ''}" placeholder="مثال: فاتورة #1042 أو مشروع #PRJ-5">
        </div>
      </div>

      <div class="field" style="margin-bottom:16px;">
        <label>ملاحظات إضافية</label>
        <input type="text" id="modalSerialNotes" value="${editSerial ? escapeHtml(editSerial.Notes||'') : ''}" placeholder="أي ملاحظات حول السيريال، موقع التركيب، المورد...">
      </div>

      <div style="display:flex;justify-content:flex-end;gap:8px;border-top:1px solid var(--line);padding-top:12px;">
        <button class="btn btn-ghost" id="cancelSerialModalBtn">إلغاء</button>
        <button class="btn btn-primary" id="saveSerialModalBtn">حفظ الرقم التسلسلي</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#closeSerialModal').onclick = close;
  overlay.querySelector('#cancelSerialModalBtn').onclick = close;

  const genBtn = overlay.querySelector('#genSerialValBtn');
  if(genBtn){
    genBtn.onclick = () => {
      const rnd = Math.floor(100000 + Math.random() * 900000);
      overlay.querySelector('#modalSerialValue').value = `SN-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-${rnd}`;
    };
  }

  // Auto-fill warranty months if item changes
  const itemSel = overlay.querySelector('#modalSerialItemId');
  itemSel.onchange = () => {
    const it = (state.inventory || []).find(x => String(x.ID) === itemSel.value);
    if(it && it.WarrantyMonths && !isEdit){
      overlay.querySelector('#modalSerialWarrantyMonths').value = it.WarrantyMonths;
    }
  };

  const saveBtn = overlay.querySelector('#saveSerialModalBtn');
  saveBtn.onclick = async () => {
    const itemId = itemSel.value;
    const serialVal = overlay.querySelector('#modalSerialValue').value.trim();
    if(!itemId){ showToast('يرجى اختيار الصنف المرتبط', 'error'); return; }
    if(!serialVal){ showToast('يرجى إدخال الرقم التسلسلي', 'error'); return; }

    const it = (state.inventory || []).find(x => String(x.ID) === itemId);
    const itemName = it ? it.Name : '';

    saveBtn.disabled = true;
    saveBtn.textContent = 'جارٍ الحفظ...';

    const serialObj = {
      ID: editSerial ? editSerial.ID : ('sn_' + Date.now() + '_' + Math.floor(Math.random()*1000)),
      ItemID: itemId,
      ItemName: itemName,
      Serial: serialVal,
      WarrantyMonths: Number(overlay.querySelector('#modalSerialWarrantyMonths').value || 0),
      WarrantyEnd: overlay.querySelector('#modalSerialWarrantyEnd').value || '',
      Status: overlay.querySelector('#modalSerialStatus').value || 'In Stock',
      SoldRef: overlay.querySelector('#modalSerialSoldRef').value.trim(),
      Notes: overlay.querySelector('#modalSerialNotes').value.trim()
    };

    try {
      await saveSerialRemote(serialObj);
      showToast(`تم حفظ السيريال (${serialVal}) بنجاح`, 'success');
      overlay.remove();
      refreshInventorySectionOrTab();
    } catch(err){
      showToast('خطأ أثناء حفظ السيريال: ' + err.message, 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = 'حفظ الرقم التسلسلي';
    }
  };
}

/* ============================================================
   Stocktake Sessions & Discrepancies View (U12)
   ============================================================ */
function renderStocktakeView(main){
  const sessions = state.stocktakeSessions || [];

  let totalDeficitCost = 0;
  let totalSurplusCost = 0;
  sessions.forEach(s => {
    const cost = Number(s.TotalDiscrepancyCost || 0);
    if(cost < 0) totalDeficitCost += Math.abs(cost);
    else if(cost > 0) totalSurplusCost += cost;
  });

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon('receipt', 20)} جلسات الجرد المخزني وتسوية الفروق (Stocktake Sessions)</h2>
        <div class="subtitle">مطابقة الرصيد الدفتري مع الجرد الفعلي للمخزن وتسوية العجز أو الفائض محاسبياً ومخزنياً</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost btn-sm" id="refreshStocktakeBtn">${getSvgIcon('refresh', 14)} تحديث</button>
        <button class="btn btn-primary btn-sm" id="startNewStocktakeBtn">${getSvgIcon('plus', 14)} بدء جلسة جرد جديدة</button>
      </div>
    </div>

    <!-- KPIs Row -->
    <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:14px;">
      <div class="card" style="padding:12px 14px;background:var(--paper2);border:1px solid var(--line);">
        <div style="font-size:11.5px;color:var(--ink-secondary);">إجمالي جلسات الجرد</div>
        <div style="font-size:22px;font-weight:900;color:var(--ink);">${sessions.length.toLocaleString()} جلسة</div>
      </div>
      <div class="card" style="padding:12px 14px;background:var(--paper2);border:1px solid var(--line);">
        <div style="font-size:11.5px;color:var(--ink-secondary);">إجمالي عجز الجرد المسجل (حساب 5209)</div>
        <div style="font-size:22px;font-weight:900;color:var(--red);">${totalDeficitCost.toLocaleString()} ج.م</div>
      </div>
      <div class="card" style="padding:12px 14px;background:var(--paper2);border:1px solid var(--line);">
        <div style="font-size:11.5px;color:var(--ink-secondary);">إجمالي فائض وزيادة الجرد (حساب 4201)</div>
        <div style="font-size:22px;font-weight:900;color:var(--green);">${totalSurplusCost.toLocaleString()} ج.م</div>
      </div>
      <div class="card" style="padding:12px 14px;background:var(--paper2);border:1px solid var(--line);">
        <div style="font-size:11.5px;color:var(--ink-secondary);">آخر جلسة جرد</div>
        <div style="font-size:14px;font-weight:800;color:var(--ink);margin-top:6px;">
          ${sessions.length > 0 ? `${cleanDate(sessions[0].Date)} (${sessions[0].SessionNumber})` : 'لا يوجد جلسات سابقة'}
        </div>
      </div>
    </div>

    <!-- Sessions History Table -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3 style="margin:0;font-size:14px;font-weight:800;">سجل جلسات الجرد المخزني</h3>
      </div>
      ${sessions.length === 0 ? `
        <div class="empty">
          لم يتم تنفيذ جلسات جرد سابقة بعد.<br>
          اضغط على <b>"بدء جلسة جرد جديدة"</b> لعد الأصناف وتعديل الأرصدة وترحيل الفروق آلياً.
        </div>
      ` : `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th style="width:140px;">رقم الجلسة</th>
                <th style="width:110px;">التاريخ</th>
                <th style="min-width:200px;">البيان والعنوان</th>
                <th style="width:120px;text-align:center;">الحالة</th>
                <th style="width:140px;text-align:center;">صافي الفروق المالية</th>
                <th style="width:120px;">المنفذ</th>
                <th style="width:100px;text-align:center;">التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              ${sessions.map(s => {
                const diffCost = Number(s.TotalDiscrepancyCost || 0);
                const costBadge = diffCost === 0 
                  ? '<span class="badge" style="background:#f3f4f6;color:#374151;font-weight:700;">مطابقة تامة</span>'
                  : (diffCost < 0 
                    ? `<span class="badge" style="background:#fee2e2;color:#991b1b;font-weight:700;">عجز: ${Math.abs(diffCost).toLocaleString()} ج.م</span>`
                    : `<span class="badge" style="background:#ecfdf5;color:#047857;font-weight:700;">فائض: +${diffCost.toLocaleString()} ج.م</span>`);

                return `
                  <tr>
                    <td><span class="mono font-bold" style="color:var(--primary);">${escapeHtml(s.SessionNumber||s.ID)}</span></td>
                    <td>${cleanDate(s.Date)}</td>
                    <td>
                      <b>${escapeHtml(s.Title||'جلسة جرد')}</b>
                      ${s.Notes ? `<div style="font-size:11px;color:var(--ink-secondary);">${escapeHtml(s.Notes)}</div>` : ''}
                    </td>
                    <td style="text-align:center;">
                      <span class="badge" style="background:#ecfdf5;color:#047857;font-weight:700;">معتمدة ومرحلة</span>
                    </td>
                    <td style="text-align:center;">${costBadge}</td>
                    <td style="font-size:12px;">${escapeHtml(s.CommittedBy || s.CreatedBy || '')}</td>
                    <td style="text-align:center;">
                      <button class="btn btn-ghost btn-xs view-stocktake-btn" data-stk-id="${escapeHtml(s.ID)}" title="عرض بنود وتفاصيل الجلسة">
                        ${getSvgIcon('eye', 13)} تفاصيل
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;

  const startBtn = document.getElementById('startNewStocktakeBtn');
  if(startBtn) startBtn.onclick = () => openStartStocktakeModal();

  const refBtn = document.getElementById('refreshStocktakeBtn');
  if(refBtn) refBtn.onclick = async () => {
    refBtn.disabled = true; refBtn.textContent = 'جارٍ التحديث...';
    await loadStocktakeSessions();
    renderStocktakeView(main);
  };

  main.querySelectorAll('.view-stocktake-btn').forEach(btn => {
    btn.onclick = () => {
      const sess = (state.stocktakeSessions || []).find(x => String(x.ID) === btn.dataset.stkId);
      if(sess) openViewStocktakeDetailsModal(sess);
    };
  });
}

function openStartStocktakeModal(){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const inventoryItems = (state.inventory || []).slice();
  if(!inventoryItems.length){
    showToast('المخزن فارغ حالياً، لا توجد أصناف لجردها', 'warning');
    return;
  }

  // Initialize counted quantities to current book expected quantities
  const draftLines = inventoryItems.map(it => ({
    itemId: it.ID,
    itemName: it.Name,
    barcode: it.Barcode || '',
    category: it.Category || '',
    expectedQty: Number(it.Quantity || 0),
    countedQty: Number(it.Quantity || 0),
    unitCost: Number(it.PurchasePrice || 0)
  }));

  function renderModal(){
    let totalDeficit = 0;
    let totalSurplus = 0;
    let itemsCount = draftLines.length;
    let discrepancyItemsCount = 0;

    draftLines.forEach(l => {
      const diff = l.countedQty - l.expectedQty;
      const diffCost = round2(diff * l.unitCost);
      if(diffCost < 0) { totalDeficit += Math.abs(diffCost); discrepancyItemsCount++; }
      else if(diffCost > 0) { totalSurplus += diffCost; discrepancyItemsCount++; }
    });

    const netImpact = round2(totalSurplus - totalDeficit);

    overlay.innerHTML = `
      <div class="modal-content" style="max-width:920px;max-height:92vh;display:flex;flex-direction:column;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:12px;">
          <div>
            <h3 style="margin:0;font-size:16px;font-weight:900;">
              بدء جلسة جرد مخزني وتسوية الفروق (Stocktake Execution)
            </h3>
            <div style="font-size:11.5px;color:var(--ink-secondary);margin-top:2px;">
              أدخل الكميات الفعلية المحصورة لكل صنف. سيتم تعديل كميات المخزن فورياً وترحيل قيد تسوية العجز أو الزيادة آلياً.
            </div>
          </div>
          <button class="btn btn-ghost btn-xs" id="closeStkModal">&times; إلغاء</button>
        </div>

        <div class="grid3" style="gap:10px;margin-bottom:10px;">
          <div class="field">
            <label>عنوان الجلسة *</label>
            <input type="text" id="stkSessionTitle" value="جرد مخزني دوري - ${new Date().toLocaleDateString('ar-EG')}" style="font-weight:700;">
          </div>
          <div class="field">
            <label>تاريخ الجلسة</label>
            <input type="date" id="stkSessionDate" value="${new Date().toISOString().slice(0, 10)}">
          </div>
          <div class="field">
            <label>ملاحظات الجلسة</label>
            <input type="text" id="stkSessionNotes" placeholder="سبب الجرد، القائمين بالجرد...">
          </div>
        </div>

        <!-- Discrepancy KPI Summary Banner -->
        <div style="display:flex;gap:12px;padding:10px 14px;background:var(--paper3);border:1px solid var(--line);border-radius:6px;margin-bottom:12px;flex-wrap:wrap;align-items:center;justify-content:space-between;">
          <div style="display:flex;gap:14px;align-items:center;">
            <div>
              <span style="font-size:11px;color:var(--ink-secondary);">إجمالي البنود:</span>
              <b style="margin-right:4px;">${itemsCount} صنف</b>
            </div>
            <div>
              <span style="font-size:11px;color:var(--ink-secondary);">الأصناف ذات الفروق:</span>
              <b style="margin-right:4px;color:${discrepancyItemsCount>0?'var(--amber)':'var(--green)'};">${discrepancyItemsCount} صنف</b>
            </div>
            <div>
              <span style="font-size:11px;color:var(--ink-secondary);">إجمالي العجز (مدين 5209):</span>
              <b style="margin-right:4px;color:var(--red);">${totalDeficit.toLocaleString()} ج.م</b>
            </div>
            <div>
              <span style="font-size:11px;color:var(--ink-secondary);">إجمالي الفائض (دائن 4201):</span>
              <b style="margin-right:4px;color:var(--green);">${totalSurplus.toLocaleString()} ج.م</b>
            </div>
          </div>
          <div>
            <span style="font-size:11px;color:var(--ink-secondary);">صافي الأثر المالي:</span>
            <span class="badge" style="font-size:12px;font-weight:800;padding:2px 8px;${netImpact < 0 ? 'background:#fee2e2;color:#991b1b;' : (netImpact > 0 ? 'background:#ecfdf5;color:#047857;' : 'background:#f3f4f6;color:#374151;')}">
              ${netImpact > 0 ? `+${netImpact.toLocaleString()} ج.م (فائض)` : (netImpact < 0 ? `${netImpact.toLocaleString()} ج.م (عجز)` : '0 ج.م')}
            </span>
          </div>
        </div>

        <!-- Items Table Scrollable Area -->
        <div style="flex:1;overflow-y:auto;border:1px solid var(--line);border-radius:4px;margin-bottom:12px;">
          <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
            <thead style="position:sticky;top:0;background:var(--paper2);z-index:2;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
              <tr>
                <th style="padding:8px 10px;text-align:right;">الصنف والباركود</th>
                <th style="padding:8px 10px;text-align:center;width:95px;">الرصيد الدفتري</th>
                <th style="padding:8px 10px;text-align:center;width:130px;">الرصيد الفعلي (العد)</th>
                <th style="padding:8px 10px;text-align:center;width:90px;">الفرق</th>
                <th style="padding:8px 10px;text-align:center;width:95px;">سعر التكلفة</th>
                <th style="padding:8px 10px;text-align:center;width:115px;">أثر الفرق المالي</th>
              </tr>
            </thead>
            <tbody>
              ${draftLines.map((l, idx) => {
                const diff = l.countedQty - l.expectedQty;
                const diffCost = round2(diff * l.unitCost);
                const diffBadge = diff === 0
                  ? '<span style="color:var(--ink-secondary);font-weight:bold;">0</span>'
                  : (diff < 0 
                    ? `<span class="badge" style="background:#fee2e2;color:#991b1b;font-weight:800;">${diff} (عجز)</span>`
                    : `<span class="badge" style="background:#ecfdf5;color:#047857;font-weight:800;">+${diff} (زيادة)</span>`);
                
                return `
                  <tr style="border-bottom:1px solid var(--line);${diff!==0?'background:rgba(245,158,11,0.04);':''}">
                    <td style="padding:8px 10px;">
                      <b>${escapeHtml(l.itemName)}</b>
                      ${l.barcode ? `<span class="mono" style="font-size:10.5px;color:var(--ink-secondary);margin-right:6px;">[${escapeHtml(l.barcode)}]</span>` : ''}
                    </td>
                    <td style="padding:8px 10px;text-align:center;" class="mono font-bold">${l.expectedQty}</td>
                    <td style="padding:6px 10px;text-align:center;">
                      <div style="display:flex;align-items:center;justify-content:center;gap:4px;">
                        <button type="button" class="btn btn-ghost btn-xs stk-dec-btn" data-idx="${idx}" style="padding:1px 6px;">-</button>
                        <input type="number" class="stk-count-inp mono font-bold" data-idx="${idx}" value="${l.countedQty}" style="width:64px;text-align:center;padding:4px;border:1px solid var(--line);border-radius:4px;">
                        <button type="button" class="btn btn-ghost btn-xs stk-inc-btn" data-idx="${idx}" style="padding:1px 6px;">+</button>
                      </div>
                    </td>
                    <td style="padding:8px 10px;text-align:center;">${diffBadge}</td>
                    <td style="padding:8px 10px;text-align:center;" class="mono">${l.unitCost.toLocaleString()} ج.م</td>
                    <td style="padding:8px 10px;text-align:center;" class="mono font-bold" style="color:${diffCost<0?'var(--red)':(diffCost>0?'var(--green)':'inherit')};">
                      ${diffCost !== 0 ? (diffCost > 0 ? `+${diffCost.toLocaleString()}` : diffCost.toLocaleString()) + ' ج.م' : '-'}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);padding-top:12px;">
          <div style="font-size:12px;color:var(--ink-secondary);display:flex;align-items:center;gap:6px;">
            <span>ℹ️</span>
            <span>سيتم تسجيل قيد يومية آلي تحت مرجع Stocktake_Adjustment</span>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-ghost" id="cancelStkModalBtn">إلغاء</button>
            <button class="btn btn-primary" id="commitStkModalBtn">
              ${getSvgIcon('check', 14)} اعتماد وترحيل الجلسة محاسبياً ومخزنياً
            </button>
          </div>
        </div>
      </div>
    `;

    overlay.querySelector('#closeStkModal').onclick = () => overlay.remove();
    overlay.querySelector('#cancelStkModalBtn').onclick = () => overlay.remove();

    overlay.querySelectorAll('.stk-count-inp').forEach(inp => {
      inp.onchange = () => {
        const idx = Number(inp.dataset.idx);
        draftLines[idx].countedQty = Math.max(0, Number(inp.value || 0));
        renderModal();
      };
    });

    overlay.querySelectorAll('.stk-dec-btn').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.idx);
        draftLines[idx].countedQty = Math.max(0, draftLines[idx].countedQty - 1);
        renderModal();
      };
    });

    overlay.querySelectorAll('.stk-inc-btn').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.idx);
        draftLines[idx].countedQty = draftLines[idx].countedQty + 1;
        renderModal();
      };
    });

    const commitBtn = overlay.querySelector('#commitStkModalBtn');
    commitBtn.onclick = async () => {
      const title = overlay.querySelector('#stkSessionTitle').value.trim();
      const date = overlay.querySelector('#stkSessionDate').value;
      const notes = overlay.querySelector('#stkSessionNotes').value.trim();

      if(!title){ showToast('يرجى إدخال عنوان جلسة الجرد', 'error'); return; }

      const confirmMsg = `هل أنت متأكد من رغبتك في اعتماد وترحيل جلسة الجرد؟<br><br>` +
        `• سيتم تعديل كميات الأصناف بالمخزن إلى الرصيد الفعلي فورياً.<br>` +
        `• سيتم إنشاء قيد تسوية فروق الجرد (مدين 5209 / دائن 4201).<br>` +
        `• صافي الأثر المالي: <strong>${netImpact} ج.م</strong>`;

      const ok = await openConfirmModal({
        title: 'اعتماد وترحيل جلسة الجرد',
        message: confirmMsg,
        confirmText: 'اعتماد وترحيل',
        cancelText: 'إلغاء',
        confirmClass: 'btn-primary'
      });
      if(!ok) return;

      commitBtn.disabled = true;
      commitBtn.textContent = 'جارٍ الاعتماد والترحيل...';

      const sessionData = {
        title,
        date,
        notes,
        lines: draftLines.map(l => ({
          itemId: l.itemId,
          itemName: l.itemName,
          expectedQty: l.expectedQty,
          countedQty: l.countedQty,
          differenceQty: l.countedQty - l.expectedQty,
          unitCost: l.unitCost,
          totalDifferenceCost: round2((l.countedQty - l.expectedQty) * l.unitCost)
        }))
      };

      try {
        await commitStocktakeSessionRemote(sessionData);
        showToast('تم اعتماد جلسة الجرد وتسوية المخزون والقيد المحاسبي بنجاح', 'success');
        playNotificationChime();
        overlay.remove();
        refreshInventorySectionOrTab();
      } catch(err){
        showToast('خطأ أثناء اعتماد جلسة الجرد: ' + err.message, 'error');
        commitBtn.disabled = false;
        commitBtn.textContent = 'اعتماد وترحيل الجلسة محاسبياً ومخزنياً';
      }
    };
  }

  renderModal();
  document.body.appendChild(overlay);
}

function openViewStocktakeDetailsModal(session){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const sessionLines = (state.stocktakeLines || []).filter(l => String(l.SessionID) === String(session.ID));

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:820px;max-height:90vh;display:flex;flex-direction:column;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
        <div>
          <h3 style="margin:0;font-size:16px;font-weight:900;">
            تفاصيل جلسة الجرد: ${escapeHtml(session.SessionNumber || session.ID)}
          </h3>
          <div style="font-size:11.5px;color:var(--ink-secondary);margin-top:2px;">
            تاريخ الجلسة: ${cleanDate(session.Date)} | المعتمد: ${escapeHtml(session.CommittedBy || session.CreatedBy || '')}
          </div>
        </div>
        <button class="btn btn-ghost btn-xs" id="closeStkDetailsModal">&times; إغلاق</button>
      </div>

      <div class="card" style="padding:10px 14px;background:var(--paper3);border:1px solid var(--line);margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div><b>العنوان:</b> ${escapeHtml(session.Title || 'جلسة جرد')}</div>
          <div>
            <b>صافي الفروق:</b> 
            <span class="mono font-bold" style="color:${Number(session.TotalDiscrepancyCost)<0?'var(--red)':'var(--green)'};">
              ${Number(session.TotalDiscrepancyCost || 0).toLocaleString()} ج.م
            </span>
          </div>
          <div><b>الحالة:</b> <span class="badge" style="background:#ecfdf5;color:#047857;font-weight:700;">معتمدة</span></div>
        </div>
        ${session.Notes ? `<div style="font-size:12px;color:var(--ink-secondary);margin-top:6px;"><b>ملاحظات:</b> ${escapeHtml(session.Notes)}</div>` : ''}
      </div>

      <div style="flex:1;overflow-y:auto;border:1px solid var(--line);border-radius:4px;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead style="position:sticky;top:0;background:var(--paper2);z-index:2;">
            <tr>
              <th style="padding:8px 10px;text-align:right;">الصنف</th>
              <th style="padding:8px 10px;text-align:center;width:90px;">الرصيد الدفتري</th>
              <th style="padding:8px 10px;text-align:center;width:90px;">الرصيد الفعلي</th>
              <th style="padding:8px 10px;text-align:center;width:80px;">الفرق</th>
              <th style="padding:8px 10px;text-align:center;width:95px;">سعر التكلفة</th>
              <th style="padding:8px 10px;text-align:center;width:110px;">أثر الفرق المالي</th>
            </tr>
          </thead>
          <tbody>
            ${sessionLines.length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--ink-secondary);">لا توجد بنود تفصيلية مسجلة لهذه الجلسة.</td></tr>' : sessionLines.map(l => {
              const diff = Number(l.DifferenceQty || 0);
              const cost = Number(l.TotalDifferenceCost || 0);
              return `
                <tr style="border-bottom:1px solid var(--line);">
                  <td style="padding:8px 10px;"><b>${escapeHtml(l.ItemName || l.ItemID)}</b></td>
                  <td style="padding:8px 10px;text-align:center;" class="mono">${l.ExpectedQty || 0}</td>
                  <td style="padding:8px 10px;text-align:center;" class="mono font-bold">${l.CountedQty || 0}</td>
                  <td style="padding:8px 10px;text-align:center;">
                    ${diff === 0 ? '0' : (diff < 0 ? `<span class="badge" style="background:#fee2e2;color:#991b1b;font-weight:700;">${diff}</span>` : `<span class="badge" style="background:#ecfdf5;color:#047857;font-weight:700;">+${diff}</span>`)}
                  </td>
                  <td style="padding:8px 10px;text-align:center;" class="mono">${Number(l.UnitCost || 0).toLocaleString()} ج.م</td>
                  <td style="padding:8px 10px;text-align:center;" class="mono font-bold" style="color:${cost<0?'var(--red)':(cost>0?'var(--green)':'inherit')};">
                    ${cost !== 0 ? (cost > 0 ? `+${cost.toLocaleString()}` : cost.toLocaleString()) + ' ج.م' : '-'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div style="display:flex;justify-content:flex-end;border-top:1px solid var(--line);padding-top:12px;margin-top:12px;">
        <button class="btn btn-ghost" id="closeStkDetailsBtn">إغلاق</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#closeStkDetailsModal').onclick = () => overlay.remove();
  overlay.querySelector('#closeStkDetailsBtn').onclick = () => overlay.remove();
}

/* ============================================================
   BOM Bundles & Kits Management View (U12)
   ============================================================ */
function renderBundlesView(main){
  const bundlesList = state.bundleItems || [];
  
  // Group bundle items by BundleItemID
  const bundleMap = {};
  bundlesList.forEach(b => {
    if(!bundleMap[b.BundleItemID]) bundleMap[b.BundleItemID] = [];
    bundleMap[b.BundleItemID].push(b);
  });

  const bundleIds = Object.keys(bundleMap);

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon('package', 20)} الأطقم والتجميعات المركبة (Bill of Materials - BOM)</h2>
        <div class="subtitle">تعريف الأطقم والمجموعات، واحتساب تكلفتها تلقائياً من مكوناتها، وخصم المكونات آلياً عند البيع بالـ POS</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost btn-sm" id="refreshBundlesBtn">${getSvgIcon('refresh', 14)} تحديث</button>
        <button class="btn btn-primary btn-sm" id="createBundleBtn">${getSvgIcon('plus', 14)} تكوين طقم / تجميعة جديدة</button>
      </div>
    </div>

    <!-- Explanatory Banner -->
    <div class="card" style="padding:12px 16px;background:var(--paper3);border:1px solid var(--line-strong);margin-bottom:14px;">
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <div style="font-size:20px;">📦</div>
        <div>
          <b style="font-size:13.5px;color:var(--ink);">كيف تعمل تجميعات الـ BOM في ميكروتك؟</b>
          <div style="font-size:12px;color:var(--ink-secondary);line-height:1.6;margin-top:3px;">
            عند اختيار صنف من المخزن ليكون <b>"طقم مجمع"</b> (مثل: طقم كاميرات هيكفيجن 4 قنوات، كيسة جيمنج مجمعة)، يمكنك ربط مكوناته الفردية وكمية كل مكون. يقوم النظام بحساب سعر تكلفة الطقم فورياً من مجموع أسعار شراء مكوناته. وعند إتمام بيع الطقم عبر الـ POS، يتم خصم المكونات الفردية تلقائياً من أرصدتها بالمخزن.
          </div>
        </div>
      </div>
    </div>

    <!-- Bundles List -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="margin:0;font-size:14px;font-weight:800;">الأطقم المعرفة (${bundleIds.length})</h3>
      </div>
      ${bundleIds.length === 0 ? `
        <div class="empty">
          لا توجد أطقم مجمعة معرفة بعد.<br>
          اضغط على <b>"تكوين طقم / تجميعة جديدة"</b> لاختيار صنف وربط مكوناته.
        </div>
      ` : `
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(360px, 1fr));gap:14px;">
          ${bundleIds.map(bId => {
            const parentItem = (state.inventory || []).find(x => String(x.ID) === String(bId));
            const components = bundleMap[bId] || [];
            const bomCost = typeof calculateBundleCost === 'function' ? calculateBundleCost(bId) : 0;
            const sellPrice = parentItem ? Number(parentItem.SellPrice || 0) : 0;
            const margin = sellPrice > 0 ? round2(sellPrice - bomCost) : 0;
            const marginPct = sellPrice > 0 ? Math.round((margin / sellPrice) * 100) : 0;

            return `
              <div class="card" style="border:1.5px solid var(--line);background:var(--paper2);padding:14px 16px;display:flex;flex-direction:column;justify-content:space-between;">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
                    <div>
                      <span class="badge badge-primary" style="font-size:10.5px;padding:1px 6px;">طقم مجمع (BOM)</span>
                      <h4 style="margin:4px 0 0;font-size:15px;font-weight:800;">${escapeHtml(parentItem ? parentItem.Name : bId)}</h4>
                      <div style="font-size:11px;color:var(--ink-secondary);">كود الصنف: <span class="mono">${bId}</span></div>
                    </div>
                    <button class="btn btn-ghost btn-xs manage-bundle-btn" data-bundle-id="${escapeHtml(bId)}" title="إدارة المكونات">
                      ${getSvgIcon('edit', 13)} تعديل المكونات
                    </button>
                  </div>

                  <!-- Financial Metrics -->
                  <div style="display:flex;gap:10px;padding:8px 10px;background:var(--paper3);border-radius:4px;margin:8px 0 12px;font-size:12px;justify-content:space-between;">
                    <div>
                      <span style="color:var(--ink-secondary);font-size:10.5px;">تكلفة المكونات:</span>
                      <div class="mono font-bold" style="color:var(--primary);">${bomCost.toLocaleString()} ج.م</div>
                    </div>
                    <div>
                      <span style="color:var(--ink-secondary);font-size:10.5px;">سعر البيع:</span>
                      <div class="mono font-bold" style="color:var(--green);">${sellPrice.toLocaleString()} ج.م</div>
                    </div>
                    <div>
                      <span style="color:var(--ink-secondary);font-size:10.5px;">هامش الربح:</span>
                      <div class="mono font-bold" style="color:${margin>=0?'var(--emerald, #059669)':'var(--red)'};">${margin.toLocaleString()} ج.م (${marginPct}%)</div>
                    </div>
                  </div>

                  <!-- Components Table -->
                  <div style="font-size:11.5px;font-weight:700;color:var(--ink);margin-bottom:4px;">المكونات الفردية (${components.length}):</div>
                  <div style="border:1px solid var(--line);border-radius:4px;overflow:hidden;background:var(--surface);">
                    <table style="width:100%;font-size:11.5px;border-collapse:collapse;">
                      <tbody>
                        ${components.map(comp => {
                          const compInv = (state.inventory || []).find(x => String(x.ID) === String(comp.ComponentItemID));
                          const compCost = compInv ? Number(compInv.PurchasePrice || 0) : 0;
                          return `
                            <tr style="border-bottom:1px solid var(--line);">
                              <td style="padding:5px 8px;"><b>${escapeHtml(comp.ComponentName || (compInv ? compInv.Name : comp.ComponentItemID))}</b></td>
                              <td style="padding:5px 8px;text-align:center;" class="mono font-bold">× ${comp.Quantity || 1}</td>
                              <td style="padding:5px 8px;text-align:center;" class="mono text-muted">${compCost.toLocaleString()} ج.م</td>
                              <td style="padding:5px 8px;text-align:center;">
                                <button type="button" class="btn btn-ghost btn-xs del-bundle-comp-btn" data-comp-id="${escapeHtml(comp.ID)}" style="color:var(--red);padding:1px 5px;" title="حذف المكون">&times;</button>
                              </td>
                            </tr>
                          `;
                        }).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style="margin-top:12px;border-top:1px solid var(--line);padding-top:8px;display:flex;justify-content:flex-end;">
                  <button class="btn btn-outline btn-xs manage-bundle-btn" data-bundle-id="${escapeHtml(bId)}">
                    ${getSvgIcon('plus', 12)} إضافة مكون جديد للطقم
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;

  const createBtn = document.getElementById('createBundleBtn');
  if(createBtn) createBtn.onclick = () => openCreateBundleModal();

  const refBtn = document.getElementById('refreshBundlesBtn');
  if(refBtn) refBtn.onclick = async () => {
    refBtn.disabled = true; refBtn.textContent = 'جارٍ التحديث...';
    await loadBundleItems();
    renderBundlesView(main);
  };

  main.querySelectorAll('.manage-bundle-btn').forEach(btn => {
    btn.onclick = () => {
      const bId = btn.dataset.bundleId;
      const parentItem = (state.inventory || []).find(x => String(x.ID) === bId) || { ID: bId, Name: bId };
      openBundleComponentsModal(parentItem);
    };
  });

  main.querySelectorAll('.del-bundle-comp-btn').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const ok = await openConfirmModal({
        title: 'حذف مكون من الطقم',
        message: 'هل أنت متأكد من حذف هذا المكون من الطقم؟',
        confirmText: 'حذف المكون',
        cancelText: 'إلغاء',
        confirmClass: 'btn-danger'
      });
      if(!ok) return;
      await deleteBundleItemRemote(btn.dataset.compId);
      showToast('تم حذف المكون من الطقم بنجاح', 'info');
      refreshInventorySectionOrTab();
    };
  });
}

function openCreateBundleModal(){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const inventoryOptions = (state.inventory || []).map(it => `
    <option value="${it.ID}">${escapeHtml(it.Name)} (${it.Category || ''}) - سعر بيع: ${it.SellPrice || 0} ج.م</option>
  `).join('');

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:520px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
        <h3 style="margin:0;font-size:16px;font-weight:900;">اختيار صنف ليكون طقماً مجمعاً (BOM Kit)</h3>
        <button class="btn btn-ghost btn-xs" id="closeCreateBundleModal">&times; إغلاق</button>
      </div>

      <div class="field" style="margin-bottom:14px;">
        <label>اختر الصنف من المخزن لتعريفه كطقم مجمع *</label>
        <select id="selectParentBundleItem">
          <option value="">-- اختر الصنف --</option>
          ${inventoryOptions}
        </select>
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:4px;">
          ملاحظة: يمكنك لاحقاً إضافة مكونات هذا الطقم وتحديد الكمية المطلوبة من كل مكون.
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;gap:8px;border-top:1px solid var(--line);padding-top:12px;">
        <button class="btn btn-ghost" id="cancelCreateBundleBtn">إلغاء</button>
        <button class="btn btn-primary" id="confirmCreateBundleBtn">متابعة وإضافة المكونات</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#closeCreateBundleModal').onclick = close;
  overlay.querySelector('#cancelCreateBundleBtn').onclick = close;

  overlay.querySelector('#confirmCreateBundleBtn').onclick = () => {
    const selId = overlay.querySelector('#selectParentBundleItem').value;
    if(!selId){ showToast('يرجى اختيار صنف أولاً', 'error'); return; }
    const parentItem = (state.inventory || []).find(x => String(x.ID) === selId);
    overlay.remove();
    openBundleComponentsModal(parentItem);
  };
}

function openBundleComponentsModal(parentItem){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  function renderInner(){
    const currentComponents = (state.bundleItems || []).filter(b => String(b.BundleItemID) === String(parentItem.ID));
    const bomCost = typeof calculateBundleCost === 'function' ? calculateBundleCost(parentItem.ID) : 0;

    // Available components to add (excluding the parent item itself)
    const availableComponentOptions = (state.inventory || [])
      .filter(it => String(it.ID) !== String(parentItem.ID))
      .map(it => `
        <option value="${it.ID}">
          ${escapeHtml(it.Name)} - سعر تكلفة: ${it.PurchasePrice || 0} ج.م (متوفر: ${it.Quantity || 0})
        </option>
      `).join('');

    overlay.innerHTML = `
      <div class="modal-content" style="max-width:680px;max-height:90vh;display:flex;flex-direction:column;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:12px;">
          <div>
            <h3 style="margin:0;font-size:16px;font-weight:900;">
              إدارة مكونات الطقم: ${escapeHtml(parentItem.Name)}
            </h3>
            <div style="font-size:11.5px;color:var(--ink-secondary);margin-top:2px;">
              تكلفة المكونات المحسوبة: <b class="mono" style="color:var(--primary);">${bomCost.toLocaleString()} ج.م</b>
            </div>
          </div>
          <button class="btn btn-ghost btn-xs" id="closeBundleModal">&times; إغلاق</button>
        </div>

        <!-- Add Component Form Card -->
        <div class="card" style="padding:12px 14px;background:var(--paper3);border:1px solid var(--line);margin-bottom:14px;">
          <h4 style="margin:0 0 10px;font-size:13px;font-weight:800;">إضافة مكون جديد لهذا الطقم</h4>
          <div style="display:grid;grid-template-columns:1.8fr 100px 1fr auto;gap:8px;align-items:end;">
            <div class="field">
              <label>الصنف المكون *</label>
              <select id="newCompItemId">
                <option value="">-- اختر الصنف --</option>
                ${availableComponentOptions}
              </select>
            </div>
            <div class="field">
              <label>الكمية للطقم *</label>
              <input type="number" id="newCompQty" min="1" value="1" class="mono font-bold">
            </div>
            <div class="field">
              <label>ملاحظات (اختياري)</label>
              <input type="text" id="newCompNotes" placeholder="ملاحظة...">
            </div>
            <button class="btn btn-primary btn-sm" id="addNewCompBtn" style="height:36px;">
              ${getSvgIcon('plus', 14)} إضافة
            </button>
          </div>
        </div>

        <!-- Current Components List -->
        <div style="flex:1;overflow-y:auto;border:1px solid var(--line);border-radius:4px;margin-bottom:12px;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead style="position:sticky;top:0;background:var(--paper2);z-index:2;">
              <tr>
                <th style="padding:8px 10px;text-align:right;">اسم المكون</th>
                <th style="padding:8px 10px;text-align:center;width:90px;">الكمية المطلوبة</th>
                <th style="padding:8px 10px;text-align:center;width:100px;">تكلفة الوحدة</th>
                <th style="padding:8px 10px;text-align:center;width:110px;">إجمالي التكلفة</th>
                <th style="padding:8px 10px;text-align:center;width:60px;">حذف</th>
              </tr>
            </thead>
            <tbody>
              ${currentComponents.length === 0 ? `
                <tr><td colspan="5" style="text-align:center;padding:24px;color:var(--ink-secondary);">لا توجد مكونات مرتبطة بهذا الطقم بعد. استخدم النموذج أعلاه لإضافة مكونات.</td></tr>
              ` : currentComponents.map(comp => {
                const compInv = (state.inventory || []).find(x => String(x.ID) === String(comp.ComponentItemID));
                const unitCost = compInv ? Number(compInv.PurchasePrice || 0) : 0;
                const totCost = unitCost * Number(comp.Quantity || 1);
                return `
                  <tr style="border-bottom:1px solid var(--line);">
                    <td style="padding:8px 10px;"><b>${escapeHtml(comp.ComponentName || (compInv ? compInv.Name : comp.ComponentItemID))}</b></td>
                    <td style="padding:8px 10px;text-align:center;" class="mono font-bold">× ${comp.Quantity || 1}</td>
                    <td style="padding:8px 10px;text-align:center;" class="mono">${unitCost.toLocaleString()} ج.م</td>
                    <td style="padding:8px 10px;text-align:center;" class="mono font-bold" style="color:var(--primary);">${totCost.toLocaleString()} ج.م</td>
                    <td style="padding:8px 10px;text-align:center;">
                      <button type="button" class="btn btn-ghost btn-xs remove-comp-btn" data-comp-id="${escapeHtml(comp.ID)}" style="color:var(--red);" title="حذف">&times;</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div style="display:flex;justify-content:flex-end;border-top:1px solid var(--line);padding-top:12px;">
          <button class="btn btn-primary" id="finishBundleModalBtn">تم وإغلاق</button>
        </div>
      </div>
    `;

    overlay.querySelector('#closeBundleModal').onclick = () => { overlay.remove(); refreshInventorySectionOrTab(); };
    overlay.querySelector('#finishBundleModalBtn').onclick = () => { overlay.remove(); refreshInventorySectionOrTab(); };

    overlay.querySelector('#addNewCompBtn').onclick = async () => {
      const cItemId = overlay.querySelector('#newCompItemId').value;
      const cQty = Number(overlay.querySelector('#newCompQty').value || 1);
      const cNotes = overlay.querySelector('#newCompNotes').value.trim();

      if(!cItemId){ showToast('يرجى اختيار الصنف المكون', 'error'); return; }
      if(cQty <= 0){ showToast('الكمية يجب أن تكون أكبر من صفر', 'error'); return; }

      const cInv = (state.inventory || []).find(x => String(x.ID) === cItemId);
      const compObj = {
        BundleItemID: parentItem.ID,
        ComponentItemID: cItemId,
        ComponentName: cInv ? cInv.Name : '',
        Quantity: cQty,
        Notes: cNotes
      };

      try {
        await saveBundleItemRemote(compObj);
        showToast(`تمت إضافة (${compObj.ComponentName}) إلى الطقم`, 'success');
        renderInner();
      } catch(err){
        showToast('خطأ أثناء إضافة المكون: ' + err.message, 'error');
      }
    };

    overlay.querySelectorAll('.remove-comp-btn').forEach(btn => {
      btn.onclick = async () => {
        const ok = await openConfirmModal({
          title: 'حذف مكون من الطقم',
          message: 'هل تريد حذف هذا المكون من الطقم؟',
          confirmText: 'حذف المكون',
          cancelText: 'إلغاء',
          confirmClass: 'btn-danger'
        });
        if(!ok) return;
        try {
          await deleteBundleItemRemote(btn.dataset.compId);
          showToast('تم حذف المكون', 'info');
          renderInner();
        } catch(err){
          showToast('خطأ أثناء حذف المكون: ' + err.message, 'error');
        }
      };
    });
  }

  renderInner();
  document.body.appendChild(overlay);
}

/* ============================================================
   Purchase Returns Views (U12)
   ============================================================ */
function renderPurchaseReturns(main){
  const returns = state.purchaseReturns || [];

  let totalReturnsAmt = 0;
  returns.forEach(r => totalReturnsAmt += Number(r.Total || 0));

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon('refresh', 20)} مرتجعات المشتريات إلى الموردين (Purchase Returns)</h2>
        <div class="subtitle">إعادة بضاعة تالفة أو غير مطابقة إلى المورد، خصم المخزون، واسترداد النقدية أو تسوية حساب المورد</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost btn-sm" id="refreshPRBtn">${getSvgIcon('refresh', 14)} تحديث</button>
        <button class="btn btn-primary btn-sm" id="newPurchaseReturnBtn">${getSvgIcon('plus', 14)} تسجيل مرتجع مشتريات جديد</button>
      </div>
    </div>

    <!-- KPIs Row -->
    <div class="kpi-grid" style="grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:12px;margin-bottom:14px;">
      <div class="card" style="padding:12px 14px;background:var(--paper2);border:1px solid var(--line);">
        <div style="font-size:11.5px;color:var(--ink-secondary);">إجمالي عمليات المرتجع</div>
        <div style="font-size:22px;font-weight:900;color:var(--ink);">${returns.length.toLocaleString()} عملية</div>
      </div>
      <div class="card" style="padding:12px 14px;background:var(--paper2);border:1px solid var(--line);">
        <div style="font-size:11.5px;color:var(--ink-secondary);">إجمالي مبالغ المرتجعات المستردة</div>
        <div style="font-size:22px;font-weight:900;color:var(--red);">${totalReturnsAmt.toLocaleString()} ج.م</div>
      </div>
      <div class="card" style="padding:12px 14px;background:var(--paper2);border:1px solid var(--line);">
        <div style="font-size:11.5px;color:var(--ink-secondary);">آخر مرتجع مشتريات</div>
        <div style="font-size:14px;font-weight:800;color:var(--ink);margin-top:6px;">
          ${returns.length > 0 ? `${cleanDate(returns[0].Date)} (${returns[0].ReturnNumber})` : 'لا يوجد مرتجعات'}
        </div>
      </div>
    </div>

    <!-- Returns Table -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <h3 style="margin:0;font-size:14px;font-weight:800;">سجل مرتجعات المشتريات</h3>
      </div>
      ${returns.length === 0 ? `
        <div class="empty">
          لا توجد مرتجعات مشتريات مسجلة بعد.<br>
          اضغط على <b>"تسجيل مرتجع مشتريات جديد"</b> لإرجاع بضاعة إلى مورد.
        </div>
      ` : `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th style="width:140px;">رقم المرتجع</th>
                <th style="width:110px;">التاريخ</th>
                <th style="width:160px;">المورد</th>
                <th style="min-width:220px;">الأصناف المرتجعة</th>
                <th style="width:120px;text-align:center;">إجمالي المبلغ</th>
                <th style="width:130px;text-align:center;">طريقة الرد</th>
                <th style="width:110px;">المسجل</th>
              </tr>
            </thead>
            <tbody>
              ${returns.map(r => {
                const methodBadge = (r.RefundMethod === 'نقدي') 
                  ? '<span class="badge" style="background:#ecfdf5;color:#047857;font-weight:700;">نقدي (خزينة)</span>'
                  : ((r.RefundMethod === 'بنكي' || r.RefundMethod === 'شبكة')
                    ? '<span class="badge" style="background:#eff6ff;color:#1d4ed8;font-weight:700;">بنكي / محفظة</span>'
                    : '<span class="badge" style="background:#fef3c7;color:#92400e;font-weight:700;">خصم رصيد مورد</span>');

                return `
                  <tr>
                    <td><span class="mono font-bold" style="color:var(--primary);">${escapeHtml(r.ReturnNumber||r.ID)}</span></td>
                    <td>${cleanDate(r.Date)}</td>
                    <td><b>${escapeHtml(r.SupplierName||'')}</b></td>
                    <td style="font-size:12px;color:var(--ink-secondary);">${escapeHtml(r.ItemsSummary||'')}</td>
                    <td style="text-align:center;" class="mono font-bold" style="color:var(--red);">
                      ${Number(r.Total||0).toLocaleString()} ج.م
                    </td>
                    <td style="text-align:center;">${methodBadge}</td>
                    <td style="font-size:12px;">${escapeHtml(r.By||'')}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;

  const newBtn = document.getElementById('newPurchaseReturnBtn');
  if(newBtn) newBtn.onclick = () => openPurchaseReturnModal();

  const refBtn = document.getElementById('refreshPRBtn');
  if(refBtn) refBtn.onclick = async () => {
    refBtn.disabled = true; refBtn.textContent = 'جارٍ التحديث...';
    await loadPurchaseReturns();
    renderPurchaseReturns(main);
  };
}

function openPurchaseReturnModal(optionalPurchase = null){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  const suppliersOptions = (state.suppliers || []).map(s => `
    <option value="${escapeHtml(s.Name)}" data-sup-id="${escapeHtml(s.ID||'')}" ${optionalPurchase && optionalPurchase.Supplier === s.Name ? 'selected' : ''}>
      ${escapeHtml(s.Name)} ${(s.Phone ? `(${s.Phone})` : '')}
    </option>
  `).join('');

  const purchasesOptions = (state.purchases || []).map(p => `
    <option value="${p.ID}" data-sup="${escapeHtml(p.Supplier||'')}" ${optionalPurchase && String(optionalPurchase.ID) === String(p.ID) ? 'selected' : ''}>
      ${p.ID} - ${cleanDate(p.Date)} - ${escapeHtml(p.Supplier||'')} (${Number(p.Total||0).toLocaleString()} ج.م)
    </option>
  `).join('');

  let returnItems = [
    { itemId: '', itemName: '', qty: 1, price: 0 }
  ];

  function renderInner(){
    const subtotal = returnItems.reduce((acc, it) => acc + (Number(it.qty||1) * Number(it.price||0)), 0);

    overlay.innerHTML = `
      <div class="modal-content" style="max-width:720px;max-height:90vh;display:flex;flex-direction:column;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:12px;">
          <h3 style="margin:0;font-size:16px;font-weight:900;">
            تسجيل مرتجع مشتريات إلى مورد (Return to Supplier)
          </h3>
          <button class="btn btn-ghost btn-xs" id="closePRModal">&times; إغلاق</button>
        </div>

        <div class="grid3" style="gap:10px;margin-bottom:12px;">
          <div class="field">
            <label>المورد *</label>
            <select id="prSupplierSelect">
              <option value="">-- اختر المورد --</option>
              ${suppliersOptions}
            </select>
          </div>
          <div class="field">
            <label>فاتورة الشراء الأصلية (اختياري)</label>
            <select id="prPurchaseSelect">
              <option value="">-- بدون ربط بفاتورة شراء محددة --</option>
              ${purchasesOptions}
            </select>
          </div>
          <div class="field">
            <label>تاريخ المرتجع</label>
            <input type="date" id="prDateInput" value="${new Date().toISOString().slice(0, 10)}">
          </div>
        </div>

        <div class="grid2" style="gap:10px;margin-bottom:14px;">
          <div class="field">
            <label>طريقة استرداد القيمة *</label>
            <select id="prRefundMethod">
              <option value="نقدي">نقدي (رد للخزينة الرئيسية 1101)</option>
              <option value="بنكي">بنكي / محفظة إلكترونية (1102)</option>
              <option value="آجل">خصم من رصيد المورد / آجل (2101)</option>
            </select>
          </div>
          <div class="field">
            <label>ملاحظات وسبب الارتجاع</label>
            <input type="text" id="prNotesInput" placeholder="تلف بالبضاعة، خطأ في المواصفات...">
          </div>
        </div>

        <!-- Items Table -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <h4 style="margin:0;font-size:13px;font-weight:800;">الأصناف المرتجعة من المخزن</h4>
          <button type="button" class="btn btn-ghost btn-xs" id="addPrItemRowBtn">
            ${getSvgIcon('plus', 13)} إضافة صنف آخر
          </button>
        </div>

        <div style="flex:1;overflow-y:auto;border:1px solid var(--line);border-radius:4px;margin-bottom:12px;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead style="position:sticky;top:0;background:var(--paper2);z-index:2;">
              <tr>
                <th style="padding:6px 8px;text-align:right;">الصنف</th>
                <th style="padding:6px 8px;text-align:center;width:90px;">الكمية</th>
                <th style="padding:6px 8px;text-align:center;width:110px;">سعر الوحدة</th>
                <th style="padding:6px 8px;text-align:center;width:120px;">الإجمالي</th>
                <th style="padding:6px 8px;text-align:center;width:50px;">حذف</th>
              </tr>
            </thead>
            <tbody>
              ${returnItems.map((it, idx) => `
                <tr style="border-bottom:1px solid var(--line);">
                  <td style="padding:6px 8px;">
                    <select class="pr-item-sel" data-idx="${idx}" style="width:100%;padding:4px;font-size:12px;">
                      <option value="">-- اختر الصنف --</option>
                      ${(state.inventory || []).map(inv => `
                        <option value="${inv.ID}" ${it.itemId===inv.ID?'selected':''}>${escapeHtml(inv.Name)} (رصيد: ${inv.Quantity||0})</option>
                      `).join('')}
                    </select>
                  </td>
                  <td style="padding:6px 8px;text-align:center;">
                    <input type="number" min="1" class="pr-qty-inp mono font-bold" data-idx="${idx}" value="${it.qty||1}" style="width:65px;text-align:center;padding:3px;">
                  </td>
                  <td style="padding:6px 8px;text-align:center;">
                    <input type="number" min="0" step="any" class="pr-price-inp mono" data-idx="${idx}" value="${it.price||0}" style="width:85px;text-align:center;padding:3px;">
                  </td>
                  <td style="padding:6px 8px;text-align:center;" class="mono font-bold" style="color:var(--red);">
                    ${round2((it.qty||1) * (it.price||0)).toLocaleString()} ج.م
                  </td>
                  <td style="padding:6px 8px;text-align:center;">
                    ${returnItems.length > 1 ? `
                      <button type="button" class="btn btn-ghost btn-xs del-pr-row" data-idx="${idx}" style="color:var(--red);">&times;</button>
                    ` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Total Summary Footer -->
        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);padding-top:12px;">
          <div>
            <span style="font-size:12px;color:var(--ink-secondary);">إجمالي قيمة المرتجع:</span>
            <span class="mono font-bold" style="font-size:17px;color:var(--red);margin-right:6px;">
              ${round2(subtotal).toLocaleString()} ج.م
            </span>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-ghost" id="cancelPRModalBtn">إلغاء</button>
            <button class="btn btn-primary" id="savePRModalBtn">
              ${getSvgIcon('check', 14)} حفظ وترحيل المرتجع
            </button>
          </div>
        </div>
      </div>
    `;

    overlay.querySelector('#closePRModal').onclick = () => overlay.remove();
    overlay.querySelector('#cancelPRModalBtn').onclick = () => overlay.remove();

    overlay.querySelector('#addPrItemRowBtn').onclick = () => {
      returnItems.push({ itemId: '', itemName: '', qty: 1, price: 0 });
      renderInner();
    };

    overlay.querySelectorAll('.pr-item-sel').forEach(sel => {
      sel.onchange = () => {
        const idx = Number(sel.dataset.idx);
        const inv = (state.inventory || []).find(x => String(x.ID) === sel.value);
        if(inv){
          returnItems[idx].itemId = inv.ID;
          returnItems[idx].itemName = inv.Name;
          returnItems[idx].price = Number(inv.PurchasePrice || 0);
        }
        renderInner();
      };
    });

    overlay.querySelectorAll('.pr-qty-inp').forEach(inp => {
      inp.onchange = () => {
        const idx = Number(inp.dataset.idx);
        returnItems[idx].qty = Math.max(1, Number(inp.value || 1));
        renderInner();
      };
    });

    overlay.querySelectorAll('.pr-price-inp').forEach(inp => {
      inp.onchange = () => {
        const idx = Number(inp.dataset.idx);
        returnItems[idx].price = Math.max(0, Number(inp.value || 0));
        renderInner();
      };
    });

    overlay.querySelectorAll('.del-pr-row').forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.idx);
        returnItems.splice(idx, 1);
        renderInner();
      };
    });

    overlay.querySelector('#savePRModalBtn').onclick = async () => {
      const supName = overlay.querySelector('#prSupplierSelect').value.trim();
      if(!supName){ showToast('يرجى اختيار المورد', 'error'); return; }

      const validItems = returnItems.filter(it => it.itemId && it.qty > 0);
      if(!validItems.length){ showToast('يرجى اختيار صنف واحد على الأقل للمرتجع', 'error'); return; }

      const supObj = (state.suppliers || []).find(s => s.Name === supName);
      const totalAmt = round2(validItems.reduce((acc, it) => acc + (it.qty * it.price), 0));
      const method = overlay.querySelector('#prRefundMethod').value;
      const purId = overlay.querySelector('#prPurchaseSelect').value;
      const date = overlay.querySelector('#prDateInput').value;
      const notes = overlay.querySelector('#prNotesInput').value.trim();

      const itemsSummary = validItems.map(it => `${it.itemName} × ${it.qty}`).join('، ');

      const pret = {
        PurchaseID: purId || '',
        SupplierID: supObj ? supObj.ID : '',
        SupplierName: supName,
        Date: date,
        ItemsSummary: itemsSummary,
        Total: totalAmt,
        TaxAmount: 0,
        RefundMethod: method,
        Notes: notes
      };

      const saveBtn = overlay.querySelector('#savePRModalBtn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'جارٍ الحفظ والترحيل...';

      try {
        await savePurchaseReturnRemote(pret, validItems);
        showToast('تم تسجيل وترحيل مرتجع المشتريات بنجاح', 'success');
        playNotificationChime();
        overlay.remove();
        refreshInventorySectionOrTab();
      } catch(err){
        showToast('خطأ أثناء حفظ المرتجع: ' + err.message, 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = 'حفظ وترحيل المرتجع';
      }
    };
  }

  renderInner();
  document.body.appendChild(overlay);
}
