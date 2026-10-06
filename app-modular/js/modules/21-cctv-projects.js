/* ============================================================
   microERP — CCTV Projects, Sites, Channel Maps & Maintenance Module [U1]
   File: app-modular/js/modules/21-cctv-projects.js
   Enterprise surveillance systems, sites, DVR/NVR channel maps,
   field service visits, customer signatures, warranties & milestone billing.
   ============================================================ */

/* ---------------- Remote CRUD Helpers for CCTV Data ---------------- */

async function saveSiteRemote(site){
  if(!site.ID) site.ID = 'site_' + Date.now() + '_' + Math.floor(Math.random()*1000);
  if(!site.CreatedAt) site.CreatedAt = new Date().toISOString().slice(0, 10);
  site.CreatedBy = site.CreatedBy || (state.user ? state.user.name : 'المسؤول');

  const idx = (state.cctvSites || []).findIndex(s => String(s.ID) === String(site.ID));
  if(idx > -1) state.cctvSites[idx] = site;
  else (state.cctvSites = state.cctvSites || []).push(site);
  setCache('cctv_sites', state.cctvSites);

  try {
    const res = await apiPost('saveSite', { data: site });
    return res.site || site;
  } catch(e) {
    enqueueOfflineTask({ type: 'saveSite', data: site });
    return site;
  }
}

async function deleteSiteRemote(id){
  state.cctvSites = (state.cctvSites || []).filter(s => String(s.ID) !== String(id));
  setCache('cctv_sites', state.cctvSites);

  try {
    await apiPost('deleteSite', { id });
  } catch(e) {
    enqueueOfflineTask({ type: 'deleteSite', id });
  }
}

async function saveProjectRemote(proj){
  if(!proj.ID) proj.ID = 'proj_' + Date.now() + '_' + Math.floor(Math.random()*1000);
  if(!proj.StartDate) proj.StartDate = new Date().toISOString().slice(0, 10);
  if(!proj.Type) proj.Type = 'تركيب';
  if(!proj.Status) proj.Status = 'قيد التخطيط';

  const idx = (state.cctvProjects || []).findIndex(p => String(p.ID) === String(proj.ID));
  if(idx > -1) state.cctvProjects[idx] = proj;
  else (state.cctvProjects = state.cctvProjects || []).push(proj);
  setCache('cctv_projects', state.cctvProjects);

  // Auto-generate standard 50/30/20 milestones if new project has contract value and no milestones exist
  const existingMilestones = (state.cctvMilestones || []).filter(m => String(m.ProjectID) === String(proj.ID));
  const val = Number(proj.ContractValue || 0);
  if(val > 0 && existingMilestones.length === 0){
    const ms1 = {
      ID: 'ms_' + Date.now() + '_1',
      ProjectID: proj.ID,
      Title: 'دفعة مقدمة (50%) عند توقيع العقد وبدء الأعمال',
      Percent: 50,
      Amount: Math.round(val * 0.50 * 100) / 100,
      DueCondition: 'عند توقيع العقد والبدء الفعلي',
      InvoiceID: '',
      Status: 'معلق'
    };
    const ms2 = {
      ID: 'ms_' + Date.now() + '_2',
      ProjectID: proj.ID,
      Title: 'دفعة توريد (30%) عند وصول المهمات والأجهزة للموقع',
      Percent: 30,
      Amount: Math.round(val * 0.30 * 100) / 100,
      DueCondition: 'عند توريد الأجهزة والكاميرات بالموقع',
      InvoiceID: '',
      Status: 'معلق'
    };
    const ms3 = {
      ID: 'ms_' + Date.now() + '_3',
      ProjectID: proj.ID,
      Title: 'دفعة ختامية (20%) عند التشغيل النهائي والتسليم',
      Percent: 20,
      Amount: Math.round(val * 0.20 * 100) / 100,
      DueCondition: 'عند التشغيل والتسليم واختبار البث',
      InvoiceID: '',
      Status: 'معلق'
    };
    [ms1, ms2, ms3].forEach(m => saveProjectMilestoneRemote(m));
  }

  try {
    const res = await apiPost('saveProject', { data: proj });
    return res.project || proj;
  } catch(e) {
    enqueueOfflineTask({ type: 'saveProject', data: proj });
    return proj;
  }
}

async function deleteProjectRemote(id){
  state.cctvProjects = (state.cctvProjects || []).filter(p => String(p.ID) !== String(id));
  setCache('cctv_projects', state.cctvProjects);

  try {
    await apiPost('deleteProject', { id });
  } catch(e) {
    enqueueOfflineTask({ type: 'deleteProject', id });
  }
}

async function saveProjectDeviceRemote(dev){
  if(!dev.ID) dev.ID = 'pdev_' + Date.now() + '_' + Math.floor(Math.random()*1000);
  if(!dev.InstallDate) dev.InstallDate = new Date().toISOString().slice(0, 10);
  dev.WarrantyMonths = Number(dev.WarrantyMonths || 12);
  if(!dev.WarrantyEnd && dev.InstallDate){
    const d = new Date(dev.InstallDate);
    d.setMonth(d.getMonth() + dev.WarrantyMonths);
    dev.WarrantyEnd = d.toISOString().slice(0, 10);
  }
  if(!dev.Status) dev.Status = 'مُركّب';

  const idx = (state.cctvDevices || []).findIndex(d => String(d.ID) === String(dev.ID));
  if(idx > -1) state.cctvDevices[idx] = dev;
  else (state.cctvDevices = state.cctvDevices || []).push(dev);
  setCache('cctv_devices', state.cctvDevices);

  // Link to Serials table if serial number is present
  if(dev.Serial && String(dev.Serial).trim()){
    const sNum = String(dev.Serial).trim();
    const existingSerial = (state.serials || []).find(s => String(s.Serial).trim() === sNum);
    if(existingSerial){
      existingSerial.Status = 'مركب بمشروع';
      existingSerial.SoldRef = dev.ProjectID;
      existingSerial.SoldDate = dev.InstallDate;
      setCache('serials', state.serials);
      try { apiPost('markSerialSold', { serial: sNum, soldRef: dev.ProjectID }); } catch(e){}
    }
  }

  try {
    const res = await apiPost('saveProjectDevice', { data: dev });
    return res.device || dev;
  } catch(e) {
    enqueueOfflineTask({ type: 'saveProjectDevice', data: dev });
    return dev;
  }
}

async function deleteProjectDeviceRemote(id){
  state.cctvDevices = (state.cctvDevices || []).filter(d => String(d.ID) !== String(id));
  setCache('cctv_devices', state.cctvDevices);

  try {
    await apiPost('deleteProjectDevice', { id });
  } catch(e) {
    enqueueOfflineTask({ type: 'deleteProjectDevice', id });
  }
}

async function saveServiceVisitRemote(visit){
  if(!visit.ID) visit.ID = 'vis_' + Date.now() + '_' + Math.floor(Math.random()*1000);
  if(!visit.ScheduledDate) visit.ScheduledDate = new Date().toISOString().slice(0, 10);
  if(!visit.Status) visit.Status = 'مجدولة';

  const idx = (state.cctvVisits || []).findIndex(v => String(v.ID) === String(visit.ID));
  if(idx > -1) state.cctvVisits[idx] = visit;
  else (state.cctvVisits = state.cctvVisits || []).push(visit);
  setCache('cctv_visits', state.cctvVisits);

  try {
    const res = await apiPost('saveServiceVisit', { data: visit });
    return res.visit || visit;
  } catch(e) {
    enqueueOfflineTask({ type: 'saveServiceVisit', data: visit });
    return visit;
  }
}

async function deleteServiceVisitRemote(id){
  state.cctvVisits = (state.cctvVisits || []).filter(v => String(v.ID) !== String(id));
  setCache('cctv_visits', state.cctvVisits);

  try {
    await apiPost('deleteServiceVisit', { id });
  } catch(e) {
    enqueueOfflineTask({ type: 'deleteServiceVisit', id });
  }
}

async function saveMaintenanceContractRemote(contract){
  if(!contract.ID) contract.ID = 'mc_' + Date.now() + '_' + Math.floor(Math.random()*1000);
  if(!contract.StartDate) contract.StartDate = new Date().toISOString().slice(0, 10);
  if(!contract.Status) contract.Status = 'ساري';
  contract.VisitsIncluded = Number(contract.VisitsIncluded || 12);
  contract.VisitsUsed = Number(contract.VisitsUsed || 0);

  const idx = (state.cctvContracts || []).findIndex(c => String(c.ID) === String(contract.ID));
  if(idx > -1) state.cctvContracts[idx] = contract;
  else (state.cctvContracts = state.cctvContracts || []).push(contract);
  setCache('cctv_contracts', state.cctvContracts);

  try {
    const res = await apiPost('saveMaintenanceContract', { data: contract });
    return res.contract || contract;
  } catch(e) {
    enqueueOfflineTask({ type: 'saveMaintenanceContract', data: contract });
    return contract;
  }
}

async function deleteMaintenanceContractRemote(id){
  state.cctvContracts = (state.cctvContracts || []).filter(c => String(c.ID) !== String(id));
  setCache('cctv_contracts', state.cctvContracts);

  try {
    await apiPost('deleteMaintenanceContract', { id });
  } catch(e) {
    enqueueOfflineTask({ type: 'deleteMaintenanceContract', id });
  }
}

async function saveProjectMilestoneRemote(ms){
  if(!ms.ID) ms.ID = 'ms_' + Date.now() + '_' + Math.floor(Math.random()*1000);
  if(!ms.Status) ms.Status = 'معلق';

  const idx = (state.cctvMilestones || []).findIndex(m => String(m.ID) === String(ms.ID));
  if(idx > -1) state.cctvMilestones[idx] = ms;
  else (state.cctvMilestones = state.cctvMilestones || []).push(ms);
  setCache('cctv_milestones', state.cctvMilestones);

  try {
    const res = await apiPost('saveProjectMilestone', { data: ms });
    return res.milestone || ms;
  } catch(e) {
    enqueueOfflineTask({ type: 'saveProjectMilestone', data: ms });
    return ms;
  }
}

async function deleteProjectMilestoneRemote(id){
  state.cctvMilestones = (state.cctvMilestones || []).filter(m => String(m.ID) !== String(id));
  setCache('cctv_milestones', state.cctvMilestones);

  try {
    await apiPost('deleteProjectMilestone', { id });
  } catch(e) {
    enqueueOfflineTask({ type: 'deleteProjectMilestone', id });
  }
}

/* ---------------- Main CCTV Shell & Navigation ---------------- */

function renderCamerasApp(app){
  if(!state.cctvTab) state.cctvTab = state.camTab || 'projects';
  // Keep legacy state.camTab in sync
  state.camTab = state.cctvTab;

  app.innerHTML = `
    <div class="sidebar">
      ${brandHtml("أنظمة ومشاريع الكاميرات")}
      ${sectionSwitcherHtml()}
      <div class="sidebar-nav-wrap">
        <div class="nav-section">إدارة المشاريع والمواقع</div>
        <div class="nav-item ${state.cctvTab==='projects'?'active':''}" data-cctvtab="projects">
          <span class="nav-item-icon">${getSvgIcon("cameras", 16)}</span><span>لوحة المشاريع والتركيبات</span>
        </div>
        <div class="nav-item ${state.cctvTab==='sites'?'active':''}" data-cctvtab="sites">
          <span class="nav-item-icon">${getSvgIcon("folder", 16)}</span><span>المواقع والمنشآت</span>
        </div>
        <div class="nav-item ${state.cctvTab==='channel_map'?'active':''}" data-cctvtab="channel_map">
          <span class="nav-item-icon">${getSvgIcon("chart", 16)}</span><span>خريطة قنوات DVR/NVR</span>
        </div>
        <div class="nav-item ${state.cctvTab==='visits'?'active':''}" data-cctvtab="visits">
          <span class="nav-item-icon">${getSvgIcon("tool", 16)}</span><span>زيارات التركيب والصيانة</span>
        </div>
        <div class="nav-item ${state.cctvTab==='warranties'?'active':''}" data-cctvtab="warranties">
          <span class="nav-item-icon">${getSvgIcon("check", 16)}</span><span>ضمان ومتابعة الأجهزة</span>
        </div>
        <div class="nav-item ${state.cctvTab==='contracts'?'active':''}" data-cctvtab="contracts">
          <span class="nav-item-icon">${getSvgIcon("fileText", 16)}</span><span>عقود الصيانة الدورية</span>
        </div>

        <div class="nav-section" style="margin-top:10px;">عروض الأسعار والكتالوج</div>
        <div class="nav-item ${state.cctvTab==='quote'?'active':''}" data-cctvtab="quote">
          <span class="nav-item-icon">${getSvgIcon("plus", 16)}</span><span>عرض سعر جديد</span>
        </div>
        <div class="nav-item ${state.cctvTab==='quotes'?'active':''}" data-cctvtab="quotes">
          <span class="nav-item-icon">${getSvgIcon("fileText", 16)}</span><span>عروض الأسعار والاتفاقيات</span>
        </div>
        <div class="nav-item ${state.cctvTab==='catalog'?'active':''}" data-cctvtab="catalog">
          <span class="nav-item-icon">${getSvgIcon("package", 16)}</span><span>كتالوج الكاميرات والمخزن</span>
        </div>
      </div>
      ${sidebarFootHtml()}
    </div>
    <main id="main"></main>
  `;

  const sw = document.getElementById('switchSectionBtn');
  if(sw) sw.onclick = ()=>{ state.currentSection = null; render(); };
  attachSidebarHandlers();

  document.querySelectorAll('[data-cctvtab]').forEach(el => {
    el.onclick = ()=>{
      state.cctvTab = el.dataset.cctvtab;
      state.camTab = state.cctvTab;
      renderCamerasApp(app);
    };
  });

  const main = document.getElementById('main');
  switch(state.cctvTab){
    case 'projects':
      renderCctvProjectsView(main);
      break;
    case 'sites':
      renderCctvSitesView(main);
      break;
    case 'channel_map':
      renderCctvChannelMapView(main);
      break;
    case 'visits':
      renderCctvVisitsView(main);
      break;
    case 'warranties':
      renderCctvWarrantiesView(main);
      break;
    case 'contracts':
      renderCctvContractsView(main);
      break;
    case 'quote':
      renderQuotationBuilder(main);
      break;
    case 'quotes':
      renderQuotationsList(main);
      break;
    case 'catalog':
    default:
      renderInventory(main, 'كاميرات', 'كتالوج الكاميرات ومعدات المراقبة والشبكات');
      break;
  }
}

/* ---------------- 1. Projects Dashboard View ---------------- */

function renderCctvProjectsView(main){
  const projects = state.cctvProjects || [];
  const sites = state.cctvSites || [];
  const today = new Date().toISOString().slice(0, 10);

  const totalCount = projects.length;
  const inProgress = projects.filter(p => p.Status === 'جاري التنفيذ' || p.Status === 'قيد التخطيط');
  const delayed = projects.filter(p => p.Status !== 'مكتمل' && p.Status !== 'ملغي' && p.TargetDate && p.TargetDate < today);
  const completed = projects.filter(p => p.Status === 'مكتمل');
  const totalValue = projects.reduce((s, p) => s + Number(p.ContractValue || 0), 0);

  if(!state.cctvProjectFilter) state.cctvProjectFilter = { q: '', status: 'all', type: 'all' };
  const filter = state.cctvProjectFilter;

  const filtered = projects.slice().reverse().filter(p => {
    if(filter.status !== 'all' && p.Status !== filter.status) return false;
    if(filter.type !== 'all' && p.Type !== filter.type) return false;
    if(filter.q){
      const q = filter.q.toLowerCase();
      const site = sites.find(s => String(s.ID) === String(p.SiteID));
      const matchTitle = (p.Title || '').toLowerCase().includes(q);
      const matchEng = (p.Engineer || '').toLowerCase().includes(q);
      const matchSite = site ? (site.SiteName + ' ' + site.CustomerName).toLowerCase().includes(q) : false;
      if(!matchTitle && !matchEng && !matchSite) return false;
    }
    return true;
  });

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("cameras", 22)} لوحة مشاريع الكاميرات والأنظمة الأمنية</h2>
        <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">إدارة عقود التوريد والتركيب، الخرائط الفنية، والتسليمات الميدانية</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <button class="btn btn-outline btn-sm" id="cctvNewSiteBtn">${getSvgIcon("folder", 14)} موقع جديد</button>
        <button class="btn btn-primary btn-sm" id="cctvNewProjectBtn">${getSvgIcon("plus", 14)} مشروع كاميرات جديد</button>
      </div>
    </div>

    <!-- KPI Metric Cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;margin-bottom:14px;">
      <div class="card" style="padding:12px;margin:0;border-right:3.5px solid var(--primary);">
        <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">إجمالي المشاريع</div>
        <div class="num mono font-bold" style="font-size:18px;margin-top:2px;">${totalCount} <span style="font-size:11px;color:var(--ink-secondary);font-weight:normal;">(${totalValue.toLocaleString()} ج.م)</span></div>
      </div>
      <div class="card" style="padding:12px;margin:0;border-right:3.5px solid var(--blue);">
        <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">قيد التنفيذ والتركيب</div>
        <div class="num mono font-bold" style="font-size:18px;margin-top:2px;color:var(--blue-text);">${inProgress.length}</div>
      </div>
      <div class="card" style="padding:12px;margin:0;border-right:3.5px solid #ef4444;">
        <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">مشاريع متأخرة عن التسليم</div>
        <div class="num mono font-bold" style="font-size:18px;margin-top:2px;color:#ef4444;">${delayed.length}</div>
      </div>
      <div class="card" style="padding:12px;margin:0;border-right:3.5px solid var(--green);">
        <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">تم التسليم والتشغيل</div>
        <div class="num mono font-bold" style="font-size:18px;margin-top:2px;color:var(--green-text);">${completed.length}</div>
      </div>
    </div>

    <!-- Filter & Search Controls -->
    <div class="card" style="padding:12px;margin-bottom:14px;background:var(--paper2);">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <input id="cctvProjSearch" value="${escapeHtml(filter.q)}" placeholder="بحث باسم المشروع، الموقع، المهندس، أو العميل..." style="flex:2;min-width:220px;">
        <select id="cctvProjStatusFilter" style="flex:1;min-width:140px;font-weight:700;">
          <option value="all" ${filter.status==='all'?'selected':''}>كافة الحالات (${projects.length})</option>
          <option value="قيد التخطيط" ${filter.status==='قيد التخطيط'?'selected':''}>قيد التخطيط</option>
          <option value="جاري التنفيذ" ${filter.status==='جاري التنفيذ'?'selected':''}>جاري التنفيذ</option>
          <option value="مكتمل" ${filter.status==='مكتمل'?'selected':''}>مكتمل ومُسلَّم</option>
          <option value="ملغي" ${filter.status==='ملغي'?'selected':''}>ملغي</option>
        </select>
        <select id="cctvProjTypeFilter" style="flex:1;min-width:130px;font-weight:700;">
          <option value="all" ${filter.type==='all'?'selected':''}>كافة الأنواع</option>
          <option value="تركيب" ${filter.type==='تركيب'?'selected':''}>تركيب جديد</option>
          <option value="صيانة" ${filter.type==='صيانة'?'selected':''}>صيانة وتطوير</option>
          <option value="توسعة" ${filter.type==='توسعة'?'selected':''}>توسعة شبكة</option>
        </select>
      </div>
    </div>

    <!-- Projects Table -->
    ${filtered.length === 0 ? '<div class="card empty" style="padding:30px;text-align:center;">لا توجد مشاريع مطابقة لبحثك. اضغط "مشروع كاميرات جديد" للبدء.</div>' : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:110px;">رقم المشروع</th>
              <th>عنوان المشروع والمنشأة</th>
              <th>الموقع والعميل</th>
              <th style="width:90px;text-align:center;">النوع</th>
              <th style="width:120px;">القيمة والتعاقد</th>
              <th style="width:130px;">تاريخ التسليم</th>
              <th style="width:120px;text-align:center;">الحالة</th>
              <th style="width:90px;text-align:center;">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(p => {
              const site = sites.find(s => String(s.ID) === String(p.SiteID));
              const isDelayed = p.Status !== 'مكتمل' && p.Status !== 'ملغي' && p.TargetDate && p.TargetDate < today;
              const val = Number(p.ContractValue || 0);
              const pDevs = (state.cctvDevices || []).filter(d => String(d.ProjectID) === String(p.ID));

              let statusBadge = '';
              if(p.Status === 'مكتمل') statusBadge = '<span class="badge badge-green">مكتمل ومُسلَّم</span>';
              else if(p.Status === 'جاري التنفيذ') statusBadge = '<span class="badge badge-blue">جاري التنفيذ</span>';
              else if(p.Status === 'ملغي') statusBadge = '<span class="badge badge-red">ملغي</span>';
              else statusBadge = '<span class="badge" style="background:#fef3c7;color:#92400e;">قيد التخطيط</span>';

              return `
                <tr class="selectable-row" style="cursor:pointer;" onclick="openProjectDetailModalById('${p.ID}')">
                  <td class="mono font-bold" style="color:var(--primary);">#${String(p.ID).slice(-8)}</td>
                  <td>
                    <div style="font-weight:800;color:var(--ink);">${escapeHtml(p.Title || 'مشروع بدون عنوان')}</div>
                    <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">
                      المهندس: <b>${escapeHtml(p.Engineer || 'غير محدد')}</b> • ${pDevs.length} أجهزة وكاميرات
                    </div>
                  </td>
                  <td>
                    <div style="font-weight:700;">${site ? escapeHtml(site.SiteName) : '<span style="color:var(--ink-secondary);">موقع عام</span>'}</div>
                    <div style="font-size:11px;color:var(--ink-secondary);">${site ? escapeHtml(site.CustomerName + (site.CustomerPhone ? ` (${site.CustomerPhone})` : '')) : '-'}</div>
                  </td>
                  <td style="text-align:center;">
                    <span class="badge" style="background:var(--paper3);">${escapeHtml(p.Type || 'تركيب')}</span>
                  </td>
                  <td>
                    <div class="mono font-bold" style="font-size:13px;">${val.toLocaleString()} ج.م</div>
                    <div style="font-size:10px;color:var(--ink-secondary);">${escapeHtml(p.PaymentTerms || '50/30/20')}</div>
                  </td>
                  <td>
                    <div class="mono" style="font-size:11.5px;">${p.TargetDate ? cleanDate(p.TargetDate) : '-'}</div>
                    ${isDelayed ? `<div style="font-size:10px;color:#ef4444;font-weight:800;display:flex;align-items:center;gap:3px;">${getSvgIcon('alert', 11)} متأخر عن الموعد!</div>` : ''}
                  </td>
                  <td style="text-align:center;">${statusBadge}</td>
                  <td style="text-align:center;" onclick="event.stopPropagation();">
                    <button class="btn btn-ghost btn-xs" onclick="openProjectModalById('${p.ID}')" title="تعديل المشروع">${getSvgIcon("edit", 13)}</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;

  // Attach search & filter
  const sInput = document.getElementById('cctvProjSearch');
  if(sInput) sInput.oninput = (e)=>{ state.cctvProjectFilter.q = e.target.value; renderCctvProjectsView(main); };
  const stFilter = document.getElementById('cctvProjStatusFilter');
  if(stFilter) stFilter.onchange = (e)=>{ state.cctvProjectFilter.status = e.target.value; renderCctvProjectsView(main); };
  const tyFilter = document.getElementById('cctvProjTypeFilter');
  if(tyFilter) tyFilter.onchange = (e)=>{ state.cctvProjectFilter.type = e.target.value; renderCctvProjectsView(main); };

  // Buttons
  document.getElementById('cctvNewProjectBtn').onclick = ()=>openProjectModal();
  document.getElementById('cctvNewSiteBtn').onclick = ()=>openSiteModal();
}

/* ---------------- Project Add / Edit Modal ---------------- */

function openProjectModalById(id){
  const p = (state.cctvProjects || []).find(x => String(x.ID) === String(id));
  if(p) openProjectModal(p);
}

function openProjectModal(editProject = null){
  const isEdit = !!editProject;
  const sites = state.cctvSites || [];
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:680px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
        <h3 style="margin:0;font-size:17px;font-weight:900;color:var(--primary);">
          ${getSvgIcon("cameras", 16)} ${isEdit ? 'تعديل بيانات مشروع كاميرات' : 'إنشاء مشروع كاميرات وشبكات جديد'}
        </h3>
        <button class="btn btn-ghost btn-xs" id="closeProjModalBtn">✕</button>
      </div>

      <form id="projForm">
        <div class="field">
          <label>عنوان / مسمى المشروع *</label>
          <input id="projTitle" value="${escapeHtml(editProject?.Title || '')}" placeholder="مثال: توريد وتركيب 16 كاميرا مراقبة بدقة 5MP لمصنع الأمل" required>
        </div>

        <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:12px;">
          <div class="field">
            <label>الموقع / المنشأة *</label>
            <select id="projSiteId" required>
              <option value="">-- اختر موقع المنشأة --</option>
              ${sites.map(s => `<option value="${escapeHtml(s.ID)}" ${editProject?.SiteID === s.ID ? 'selected' : ''}>${escapeHtml(s.SiteName)} (${escapeHtml(s.CustomerName)})</option>`).join('')}
            </select>
          </div>
          <div class="field">
            <label>نوع العملية</label>
            <select id="projType">
              <option value="تركيب" ${editProject?.Type==='تركيب'?'selected':''}>تركيب جديد بالكامل</option>
              <option value="صيانة" ${editProject?.Type==='صيانة'?'selected':''}>صيانة وتطوير شبكة قائمة</option>
              <option value="توسعة" ${editProject?.Type==='توسعة'?'selected':''}>توسعة وإضافة كاميرات</option>
            </select>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
          <div class="field">
            <label>القيمة التعاقدية (ج.م) *</label>
            <input type="number" id="projValue" value="${editProject?.ContractValue || 0}" min="0" required>
          </div>
          <div class="field">
            <label>شروط الدفع والمراحل</label>
            <select id="projPaymentTerms">
              <option value="50/30/20" ${(editProject?.PaymentTerms==='50/30/20'||!editProject)?'selected':''}>50% مقدم / 30% توريد / 20% تسليم</option>
              <option value="50/50" ${editProject?.PaymentTerms==='50/50'?'selected':''}>50% مقدم / 50% تسليم</option>
              <option value="100% كاش" ${editProject?.PaymentTerms==='100% كاش'?'selected':''}>100% عند التوريد والبدء</option>
              <option value="آجل ميسر" ${editProject?.PaymentTerms==='آجل ميسر'?'selected':''}>آجل ميسر وفق المستخلصات</option>
            </select>
          </div>
          <div class="field">
            <label>المهندس / الفني المسؤول</label>
            <input id="projEngineer" value="${escapeHtml(editProject?.Engineer || (state.user ? state.user.name : ''))}" placeholder="اسم المهندس المشرف">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
          <div class="field">
            <label>تاريخ البدء</label>
            <input type="date" id="projStartDate" value="${editProject?.StartDate || new Date().toISOString().slice(0,10)}">
          </div>
          <div class="field">
            <label>تاريخ التسليم المستهدف</label>
            <input type="date" id="projTargetDate" value="${editProject?.TargetDate || ''}">
          </div>
          <div class="field">
            <label>حالة المشروع</label>
            <select id="projStatus">
              <option value="قيد التخطيط" ${editProject?.Status==='قيد التخطيط'?'selected':''}>قيد التخطيط</option>
              <option value="جاري التنفيذ" ${(editProject?.Status==='جاري التنفيذ'||!editProject)?'selected':''}>جاري التنفيذ والتركيب</option>
              <option value="مكتمل" ${editProject?.Status==='مكتمل'?'selected':''}>مكتمل ومُسلَّم</option>
              <option value="ملغي" ${editProject?.Status==='ملغي'?'selected':''}>ملغي</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label>ملاحظات ومواصفات فنية إضافية</label>
          <textarea id="projNotes" rows="2" placeholder="المسارات، متطلبات الباور، شاشات المراقبة...">${escapeHtml(editProject?.Notes || '')}</textarea>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">
          <button type="button" class="btn btn-ghost" id="cancelProjModalBtn">إلغاء</button>
          <button type="submit" class="btn btn-primary" id="saveProjModalBtn">
            ${getSvgIcon("check", 14)} ${isEdit ? 'حفظ التعديلات' : 'إنشاء المشروع'}
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#closeProjModalBtn').onclick = ()=>overlay.remove();
  overlay.querySelector('#cancelProjModalBtn').onclick = ()=>overlay.remove();

  overlay.querySelector('#projForm').onsubmit = async (e)=>{
    e.preventDefault();
    const saveBtn = overlay.querySelector('#saveProjModalBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'جارٍ الحفظ...';

    const p = {
      ID: editProject?.ID || '',
      Title: overlay.querySelector('#projTitle').value.trim(),
      SiteID: overlay.querySelector('#projSiteId').value,
      Type: overlay.querySelector('#projType').value,
      ContractValue: Number(overlay.querySelector('#projValue').value || 0),
      PaymentTerms: overlay.querySelector('#projPaymentTerms').value,
      Engineer: overlay.querySelector('#projEngineer').value.trim(),
      StartDate: overlay.querySelector('#projStartDate').value,
      TargetDate: overlay.querySelector('#projTargetDate').value,
      Status: overlay.querySelector('#projStatus').value,
      Notes: overlay.querySelector('#projNotes').value.trim(),
      QuotationID: editProject?.QuotationID || '',
      InvoiceID: editProject?.InvoiceID || ''
    };

    try {
      await saveProjectRemote(p);
      showToast('تم حفظ المشروع بنجاح', 'success');
      overlay.remove();
      renderCamerasApp(document.getElementById('app'));
    } catch(err) {
      showToast('خطأ أثناء الحفظ: ' + err.message, 'error');
      saveBtn.disabled = false;
    }
  };
}

/* ---------------- Project Detail & Management Modal ---------------- */

function openProjectDetailModalById(id){
  const p = (state.cctvProjects || []).find(x => String(x.ID) === String(id));
  if(!p){ showToast('تعذر العثور على المشروع', 'error'); return; }
  openProjectDetailModal(p);
}

function openProjectDetailModal(p){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  let activeTab = 'devices';

  function renderModalContent(){
    const site = (state.cctvSites || []).find(s => String(s.ID) === String(p.SiteID));
    const devices = (state.cctvDevices || []).filter(d => String(d.ProjectID) === String(p.ID));
    const visits = (state.cctvVisits || []).filter(v => String(v.ProjectID) === String(p.ID));
    const milestones = (state.cctvMilestones || []).filter(m => String(m.ProjectID) === String(p.ID));
    const val = Number(p.ContractValue || 0);

    overlay.innerHTML = `
      <div class="modal-content" style="max-width:880px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:12px;">
          <div>
            <div style="display:flex;align-items:center;gap:8px;">
              <h3 style="margin:0;font-size:18px;font-weight:900;color:var(--primary);">
                ${escapeHtml(p.Title)}
              </h3>
              <span class="badge badge-primary">#${String(p.ID).slice(-8)}</span>
            </div>
            <div style="font-size:12px;color:var(--ink-secondary);margin-top:4px;">
              الموقع: <b>${site ? escapeHtml(site.SiteName) : 'موقع غير محدد'}</b> • العميل: <b>${site ? escapeHtml(site.CustomerName) : '-'}</b> ${site?.CustomerPhone ? `(${site.CustomerPhone})` : ''} • المهندس: <b>${escapeHtml(p.Engineer || '-')}</b>
            </div>
          </div>
          <button class="btn btn-ghost btn-xs" id="closeProjDetailModal">✕</button>
        </div>

        <!-- Metric Ribbon -->
        <div class="card" style="padding:10px 14px;background:var(--paper2);margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;gap:14px;align-items:center;">
            <div>
              <span style="font-size:10px;color:var(--ink-secondary);display:block;">القيمة التعاقدية</span>
              <b class="mono" style="font-size:15px;color:var(--primary);">${val.toLocaleString()} ج.م</b>
            </div>
            <div style="border-right:1px solid var(--line);height:28px;"></div>
            <div>
              <span style="font-size:10px;color:var(--ink-secondary);display:block;">تاريخ التسليم</span>
              <b class="mono" style="font-size:12.5px;">${p.TargetDate ? cleanDate(p.TargetDate) : 'غير محدد'}</b>
            </div>
            <div style="border-right:1px solid var(--line);height:28px;"></div>
            <div>
              <span style="font-size:10px;color:var(--ink-secondary);display:block;">الحالة الحالية</span>
              <span class="badge ${p.Status==='مكتمل'?'badge-green':(p.Status==='جاري التنفيذ'?'badge-blue':'')}">${escapeHtml(p.Status)}</span>
            </div>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-outline btn-xs" id="editProjFromDetailBtn">${getSvgIcon("edit", 12)} تعديل المشروع</button>
            ${site?.CustomerPhone ? `<a href="https://wa.me/${normalizePhoneForWa(site.CustomerPhone)}" target="_blank" class="btn btn-ghost btn-xs" style="color:#22c55e;">${getSvgIcon("message", 12)} واتساب العميل</a>` : ''}
          </div>
        </div>

        <!-- Inner Tabs -->
        <div style="display:flex;gap:6px;border-bottom:1.5px solid var(--line);margin-bottom:12px;">
          <button class="btn btn-ghost btn-sm ${activeTab==='devices'?'active':''}" id="pTabDevs" style="border-radius:6px 6px 0 0;font-weight:800;border-bottom:${activeTab==='devices'?'2.5px solid var(--primary)':'none'};">
            ${getSvgIcon("cameras", 14)} الكاميرات والأجهزة (${devices.length})
          </button>
          <button class="btn btn-ghost btn-sm ${activeTab==='visits'?'active':''}" id="pTabVisits" style="border-radius:6px 6px 0 0;font-weight:800;border-bottom:${activeTab==='visits'?'2.5px solid var(--primary)':'none'};">
            ${getSvgIcon("tool", 14)} زيارات العمل والتركيب (${visits.length})
          </button>
          <button class="btn btn-ghost btn-sm ${activeTab==='milestones'?'active':''}" id="pTabMilestones" style="border-radius:6px 6px 0 0;font-weight:800;border-bottom:${activeTab==='milestones'?'2.5px solid var(--primary)':'none'};">
            ${getSvgIcon("creditCard", 14)} الفواتير والمراحل (50/30/20)
          </button>
        </div>

        <!-- Tab 1: Devices -->
        ${activeTab === 'devices' ? `
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-size:12px;color:var(--ink-secondary);font-weight:700;">قائمة الكاميرات وأجهزة التسجيل المركبة بهذا المشروع:</span>
              <button class="btn btn-primary btn-xs" id="addNewDeviceBtn">${getSvgIcon("plus", 12)} إضافة كاميرا / جهاز</button>
            </div>
            ${devices.length === 0 ? '<div class="card empty" style="padding:20px;text-align:center;">لم يتم تسجيل أجهزة في هذا المشروع بعد. اضغط "إضافة كاميرا / جهاز" لربط الأجهزة وخريطة القنوات.</div>' : `
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style="width:70px;">القناة</th>
                      <th>الجهاز والموديل</th>
                      <th>السيريال والمواصفات</th>
                      <th>الموقع بالمبنى</th>
                      <th style="width:110px;">نهاية الضمان</th>
                      <th style="width:70px;text-align:center;">حذف</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${devices.map(d => `
                      <tr>
                        <td class="mono font-bold" style="color:var(--primary);">${d.Channel ? `CH ${d.Channel}` : '-'}</td>
                        <td>
                          <div style="font-weight:800;">${escapeHtml(d.Brand || '')} ${escapeHtml(d.Model || d.Category || 'كاميرا')}</div>
                          <div style="font-size:10.5px;color:var(--ink-secondary);">${escapeHtml(d.Category || 'كاميرا')}</div>
                        </td>
                        <td>
                          <div class="mono" style="font-size:11px;">${d.Serial ? `S/N: ${escapeHtml(d.Serial)}` : 'بدون سيريال'}</div>
                          <div style="font-size:10px;color:var(--ink-secondary);">${d.Resolution ? escapeHtml(d.Resolution) : ''} ${d.LensType ? `(${escapeHtml(d.LensType)})` : ''}</div>
                        </td>
                        <td style="font-size:11.5px;">${escapeHtml(d.Location || 'غير محدد')}</td>
                        <td class="mono" style="font-size:11px;">
                          ${d.WarrantyEnd ? cleanDate(d.WarrantyEnd) : '-'}
                        </td>
                        <td style="text-align:center;">
                          <button class="btn btn-ghost btn-xs" style="color:#ef4444;" onclick="handleDeleteProjectDevice('${d.ID}')">${getSvgIcon("trash", 12)}</button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        ` : ''}

        <!-- Tab 2: Visits -->
        ${activeTab === 'visits' ? `
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-size:12px;color:var(--ink-secondary);font-weight:700;">سجل زيارات التركيب والصيانة الميدانية:</span>
              <button class="btn btn-primary btn-xs" id="scheduleNewVisitBtn">${getSvgIcon("plus", 12)} جدولة زيارة جديدة</button>
            </div>
            ${visits.length === 0 ? '<div class="card empty" style="padding:20px;text-align:center;">لا توجد زيارات مسجلة لهذا المشروع بعد.</div>' : `
              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style="width:105px;">التاريخ</th>
                      <th>نوع الزيارة</th>
                      <th>الفني المسؤول</th>
                      <th>الإجراءات والقطع المستخدمة</th>
                      <th style="width:90px;text-align:center;">الحالة</th>
                      <th style="width:80px;text-align:center;">فتح</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${visits.map(v => `
                      <tr>
                        <td class="mono" style="font-size:11.5px;">${cleanDate(v.ScheduledDate)}</td>
                        <td style="font-weight:700;">${escapeHtml(v.VisitType || 'تركيب')}</td>
                        <td>${escapeHtml(v.Technician || 'غير محدد')}</td>
                        <td style="font-size:11px;color:var(--ink-secondary);">
                          ${escapeHtml(v.ActionsTaken || v.Findings || 'قيد الانتظار')}
                          ${v.CustomerSignature ? '<span class="badge badge-green" style="font-size:9.5px;padding:1px 4px;margin-right:4px;">موقَّع</span>' : ''}
                        </td>
                        <td style="text-align:center;">
                          <span class="badge ${v.Status==='مكتملة'?'badge-green':(v.Status==='جارٍ التنفيذ'?'badge-blue':'')}">${escapeHtml(v.Status)}</span>
                        </td>
                        <td style="text-align:center;">
                          <button class="btn btn-outline btn-xs" onclick="openVisitExecutionModalById('${v.ID}')">تفاصيل</button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        ` : ''}

        <!-- Tab 3: Milestones & Invoicing -->
        ${activeTab === 'milestones' ? `
          <div>
            <div style="font-size:12px;color:var(--ink-secondary);margin-bottom:10px;">
              نظام الفواتير المرحلية التلقائية (50% مقدم، 30% توريد، 20% تسليم وتشغيل) — الإيرادات ترحّل مباشرة لحساب <b>4103 (إيرادات تركيب كاميرات وأنظمة)</b>:
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>المرحلة والوصف</th>
                    <th style="width:80px;text-align:center;">النسبة</th>
                    <th style="width:110px;">المبلغ</th>
                    <th>شرط الاستحقاق</th>
                    <th style="width:100px;text-align:center;">الحالة</th>
                    <th style="width:120px;text-align:center;">الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  ${milestones.map(m => `
                    <tr>
                      <td style="font-weight:800;">${escapeHtml(m.Title)}</td>
                      <td class="mono font-bold" style="text-align:center;">${m.Percent}%</td>
                      <td class="mono font-bold" style="color:var(--primary);">${Number(m.Amount||0).toLocaleString()} ج.م</td>
                      <td style="font-size:11px;color:var(--ink-secondary);">${escapeHtml(m.DueCondition || '-')}</td>
                      <td style="text-align:center;">
                        <span class="badge ${m.Status==='تمت الفوترة'?'badge-green':''}">${escapeHtml(m.Status || 'معلق')}</span>
                      </td>
                      <td style="text-align:center;">
                        ${m.Status === 'تمت الفوترة' ? `
                          <span style="font-size:11px;color:var(--green-text);font-weight:700;">صدرت الفاتورة</span>
                        ` : `
                          <button class="btn btn-primary btn-xs" onclick="generateMilestoneInvoice('${m.ID}', '${p.ID}')">
                            ${getSvgIcon("invoices", 12)} إصدار فاتورة
                          </button>
                        `}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <div style="display:flex;justify-content:flex-end;margin-top:14px;border-top:1px solid var(--line);padding-top:10px;">
          <button class="btn btn-ghost" id="closeProjDetailBottomBtn">إغلاق</button>
        </div>
      </div>
    `;

    // Tab switching
    overlay.querySelector('#pTabDevs')?.addEventListener('click', ()=>{ activeTab = 'devices'; renderModalContent(); });
    overlay.querySelector('#pTabVisits')?.addEventListener('click', ()=>{ activeTab = 'visits'; renderModalContent(); });
    overlay.querySelector('#pTabMilestones')?.addEventListener('click', ()=>{ activeTab = 'milestones'; renderModalContent(); });

    // Close buttons
    overlay.querySelector('#closeProjDetailModal').onclick = ()=>overlay.remove();
    overlay.querySelector('#closeProjDetailBottomBtn').onclick = ()=>overlay.remove();

    // Action buttons
    overlay.querySelector('#editProjFromDetailBtn').onclick = ()=>{ overlay.remove(); openProjectModal(p); };
    overlay.querySelector('#addNewDeviceBtn')?.addEventListener('click', ()=>{ openAddDeviceModal(p, renderModalContent); });
    overlay.querySelector('#scheduleNewVisitBtn')?.addEventListener('click', ()=>{ openScheduleVisitModal(p, renderModalContent); });
  }

  document.body.appendChild(overlay);
  renderModalContent();
}

/* ---------------- Device Addition Modal with Inventory Linkage ---------------- */

function openAddDeviceModal(p, onDone){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const cctvInv = (state.inventory || []).filter(it => (it.Category || '') === 'كاميرات' || (it.Category || '') === 'كمبيوتر');

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:540px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:8px;margin-bottom:12px;">
        <h3 style="margin:0;font-size:16px;font-weight:900;color:var(--primary);">
          ${getSvgIcon("plus", 14)} إضافة كاميرا أو جهاز للمشروع
        </h3>
        <button class="btn btn-ghost btn-xs" id="closeAddDevBtn">✕</button>
      </div>

      <form id="addDevForm">
        <div class="field">
          <label>اختيار منتج من المخزن (اختياري مع الخصم الفعلي)</label>
          <select id="devInvPick">
            <option value="">-- إدخال يدوي / بدون خصم مخزني --</option>
            ${cctvInv.map(it => `<option value="${escapeHtml(it.ID)}" data-name="${escapeHtml(it.Name)}" data-price="${it.SellPrice||0}" data-qty="${it.Quantity||0}">${escapeHtml(it.Name)} (متاح: ${it.Quantity||0})</option>`).join('')}
          </select>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div class="field">
            <label>فئة الجهاز *</label>
            <select id="devCategory">
              <option value="كاميرا">كاميرا مراقبة (Camera)</option>
              <option value="DVR">جهاز تسجيل DVR</option>
              <option value="NVR">جهاز تسجيل NVR</option>
              <option value="هارد">هارد ديسك مراقبة (HDD)</option>
              <option value="سويتش">سويتش شبكة (PoE Switch)</option>
              <option value="باور">باور سبلاي / محول</option>
              <option value="كابل">كابلات وتمديدات</option>
              <option value="بواط">بواط وقواعد</option>
            </select>
          </div>
          <div class="field">
            <label>رقم القناة على الجهاز (Channel)</label>
            <input type="number" id="devChannel" placeholder="مثال: 1 أو 2..." min="1" max="64">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1.5fr;gap:10px;">
          <div class="field">
            <label>الماركة (Brand)</label>
            <input id="devBrand" placeholder="Dahua, Hikvision, EZVIZ...">
          </div>
          <div class="field">
            <label>الموديل (Model)</label>
            <input id="devModel" placeholder="مثال: DH-HAC-HFW1200R">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
          <div class="field">
            <label>دقة الكاميرا</label>
            <select id="devResolution">
              <option value="2MP 1080p">2MP Full HD</option>
              <option value="4MP 2K">4MP 2K</option>
              <option value="5MP">5MP</option>
              <option value="8MP 4K">8MP 4K Ultra</option>
              <option value="غير محدد">أخرى / غير محدد</option>
            </select>
          </div>
          <div class="field">
            <label>مقاس العدسة</label>
            <select id="devLens">
              <option value="2.8mm">2.8mm (زاوية واسعة)</option>
              <option value="3.6mm">3.6mm (متوسطة)</option>
              <option value="6mm">6mm (محددة)</option>
              <option value="Varifocal">متغيرة (Varifocal)</option>
              <option value="PTZ">متحركة (PTZ)</option>
            </select>
          </div>
          <div class="field">
            <label>فترة الضمان (شهور)</label>
            <input type="number" id="devWarranty" value="12" min="1">
          </div>
        </div>

        <div class="field">
          <label>الرقم التسلسلي (Serial Number)</label>
          <input id="devSerial" class="mono" placeholder="مسح أو إدخال السيريال لربط الضمان">
        </div>

        <div class="field">
          <label>مكان التركيب بالموقع *</label>
          <input id="devLocation" placeholder="مثال: البوابة الرئيسية، الاستقبال، مدخل الجراج..." required>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
          <button type="button" class="btn btn-ghost" id="cancelAddDevBtn">إلغاء</button>
          <button type="submit" class="btn btn-primary" id="saveAddDevBtn">
            ${getSvgIcon("check", 14)} حفظ وتثبيت الجهاز
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#closeAddDevBtn').onclick = ()=>overlay.remove();
  overlay.querySelector('#cancelAddDevBtn').onclick = ()=>overlay.remove();

  const invPick = overlay.querySelector('#devInvPick');
  invPick.onchange = ()=>{
    const opt = invPick.options[invPick.selectedIndex];
    if(opt && opt.value){
      overlay.querySelector('#devModel').value = opt.dataset.name || '';
    }
  };

  overlay.querySelector('#addDevForm').onsubmit = async (e)=>{
    e.preventDefault();
    const btn = overlay.querySelector('#saveAddDevBtn');
    btn.disabled = true;
    btn.textContent = 'جارٍ الحفظ...';

    const invId = invPick.value;
    const cat = overlay.querySelector('#devCategory').value;
    const channel = Number(overlay.querySelector('#devChannel').value) || null;
    const brand = overlay.querySelector('#devBrand').value.trim();
    const model = overlay.querySelector('#devModel').value.trim();
    const res = overlay.querySelector('#devResolution').value;
    const lens = overlay.querySelector('#devLens').value;
    const wMonths = Number(overlay.querySelector('#devWarranty').value) || 12;
    const serial = overlay.querySelector('#devSerial').value.trim();
    const loc = overlay.querySelector('#devLocation').value.trim();

    const devObj = {
      ID: 'pdev_' + Date.now(),
      ProjectID: p.ID,
      Category: cat,
      ItemID: invId || '',
      Serial: serial,
      Brand: brand,
      Model: model,
      Channel: channel,
      Location: loc,
      LensType: lens,
      Resolution: res,
      InstallDate: new Date().toISOString().slice(0, 10),
      WarrantyMonths: wMonths,
      Status: 'مُركّب'
    };

    // If picked from inventory, deduct quantity by 1
    if(invId){
      const invItem = (state.inventory || []).find(it => String(it.ID) === String(invId));
      if(invItem){
        invItem.Quantity = Math.max(0, Number(invItem.Quantity || 0) - 1);
        setCache('inventory', state.inventory);
        try { apiPost('adjustInventoryQty', { id: invId, quantity: invItem.Quantity }); } catch(err){}
      }
    }

    try {
      await saveProjectDeviceRemote(devObj);
      showToast('تمت إضافة الجهاز وتثبيته بنجاح', 'success');
      overlay.remove();
      if(typeof onDone === 'function') onDone();
    } catch(err) {
      showToast('فشل حفظ الجهاز: ' + err.message, 'error');
      btn.disabled = false;
    }
  };
}

async function handleDeleteProjectDevice(devId){
  const ok = await openConfirmModal({
    title: 'حذف جهاز من المشروع',
    message: 'هل أنت متأكد من حذف هذا الجهاز من المشروع؟',
    confirmText: 'حذف',
    cancelText: 'إلغاء',
    confirmClass: 'btn-danger'
  });
  if(!ok) return;
  try {
    await deleteProjectDeviceRemote(devId);
    showToast('تم حذف الجهاز بنجاح', 'success');
    renderCamerasApp(document.getElementById('app'));
  } catch(e){
    showToast('فشل حذف الجهاز: ' + e.message, 'error');
  }
}

/* ---------------- Milestone Billing & Direct 4103 Revenue ---------------- */

async function generateMilestoneInvoice(milestoneId, projectId){
  const m = (state.cctvMilestones || []).find(x => String(x.ID) === String(milestoneId));
  const p = (state.cctvProjects || []).find(x => String(x.ID) === String(projectId));
  if(!m || !p){ showToast('تعذر العثور على بيانات المرحلة', 'error'); return; }

  const site = (state.cctvSites || []).find(s => String(s.ID) === String(p.SiteID));
  const amount = Number(m.Amount || 0);

  const invNumber = (typeof nextInvoiceNumber === 'function') 
    ? nextInvoiceNumber() 
    : ('INV-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4));

  const invObj = {
    ID: 'inv_' + Date.now(),
    InvoiceNumber: invNumber,
    Date: new Date().toISOString().slice(0, 10),
    DueDate: new Date().toISOString().slice(0, 10),
    CustomerName: site?.CustomerName || 'عميل مشروع',
    CustomerPhone: site?.CustomerPhone || '',
    CustomerAddress: site?.Address || '',
    Items: [
      {
        Name: `[${m.Percent}%] ${m.Title} — مشروع: ${p.Title}`,
        Qty: 1,
        Price: amount,
        Total: amount
      }
    ],
    Subtotal: amount,
    TaxPercent: 0,
    TaxAmount: 0,
    Discount: 0,
    Total: amount,
    AmountPaid: 0,
    Remaining: amount,
    Status: 'غير مدفوعة (آجلة)',
    PaymentMethod: 'آجل',
    ReferenceType: 'مشروع كاميرات',
    ReferenceID: String(p.ID),
    AccountCode: '4103', // Routes directly to account 4103
    Notes: `فاتورة مرحلية (${m.Percent}%) عن مشروع #${String(p.ID).slice(-8)}`
  };

  try {
    await saveInvoiceRemote(invObj);
    m.Status = 'تمت الفوترة';
    m.InvoiceID = invObj.ID;
    await saveProjectMilestoneRemote(m);
    showToast(`تم إصدار الفاتورة (${invNumber}) وترحيل الإيراد لحساب 4103 بنجاح`, 'success');
    renderCamerasApp(document.getElementById('app'));
  } catch(err) {
    showToast('خطأ أثناء إصدار الفاتورة: ' + err.message, 'error');
  }
}

/* ---------------- 2. Sites Management View ---------------- */

function renderCctvSitesView(main){
  const sites = state.cctvSites || [];
  const projects = state.cctvProjects || [];
  const contracts = state.cctvContracts || [];

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("folder", 22)} إدارة المواقع والمنشآت</h2>
        <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">سجل المواقع، العملاء، ومخططات المنشآت المجهزة بأنظمة المراقبة</div>
      </div>
      <div>
        <button class="btn btn-primary btn-sm" id="siteNewBtn">${getSvgIcon("plus", 14)} إضافة موقع جديد</button>
      </div>
    </div>

    <!-- Sites Table -->
    ${sites.length === 0 ? '<div class="card empty" style="padding:30px;text-align:center;">لم يتم تسجيل أي مواقع بعد. اضغط "إضافة موقع جديد" لإدخال بيانات موقعك الأول.</div>' : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:110px;">رقم الموقع</th>
              <th>اسم الموقع / المنشأة</th>
              <th>العميل والمسؤول</th>
              <th>العنوان والمدينة</th>
              <th style="width:110px;text-align:center;">المشاريع</th>
              <th style="width:110px;text-align:center;">عقود الصيانة</th>
              <th style="width:100px;text-align:center;">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${sites.map(s => {
              const siteProjs = projects.filter(p => String(p.SiteID) === String(s.ID));
              const siteContracts = contracts.filter(c => String(c.SiteID) === String(s.ID));

              return `
                <tr class="selectable-row" style="cursor:pointer;" onclick="openSiteDetailModalById('${s.ID}')">
                  <td class="mono font-bold" style="color:var(--primary);">#${String(s.ID).slice(-8)}</td>
                  <td style="font-weight:800;color:var(--ink);">${escapeHtml(s.SiteName || 'بدون اسم')}</td>
                  <td>
                    <div><b>${escapeHtml(s.CustomerName || '')}</b></div>
                    <div class="mono" style="font-size:11px;color:var(--ink-secondary);">${escapeHtml(s.CustomerPhone || '-')}</div>
                  </td>
                  <td style="font-size:11.5px;">${escapeHtml(s.Address || '')} ${s.City ? `(${escapeHtml(s.City)})` : ''}</td>
                  <td style="text-align:center;">
                    <span class="badge ${siteProjs.length>0?'badge-blue':''}">${siteProjs.length} مشاريع</span>
                  </td>
                  <td style="text-align:center;">
                    <span class="badge ${siteContracts.length>0?'badge-green':''}">${siteContracts.length} عقود</span>
                  </td>
                  <td style="text-align:center;" onclick="event.stopPropagation();">
                    <button class="btn btn-ghost btn-xs" onclick="openSiteModalById('${s.ID}')" title="تعديل الموقع">${getSvgIcon("edit", 13)}</button>
                    <button class="btn btn-ghost btn-xs" style="color:#ef4444;" onclick="handleDeleteSite('${s.ID}')" title="حذف">${getSvgIcon("trash", 13)}</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;

  document.getElementById('siteNewBtn').onclick = ()=>openSiteModal();
}

function openSiteModalById(id){
  const s = (state.cctvSites || []).find(x => String(x.ID) === String(id));
  if(s) openSiteModal(s);
}

function openSiteModal(editSite = null){
  const isEdit = !!editSite;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:580px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:8px;margin-bottom:12px;">
        <h3 style="margin:0;font-size:17px;font-weight:900;color:var(--primary);">
          ${getSvgIcon("folder", 16)} ${isEdit ? 'تعديل بيانات الموقع' : 'إضافة موقع / منشأة جديدة'}
        </h3>
        <button class="btn btn-ghost btn-xs" id="closeSiteModalBtn">✕</button>
      </div>

      <form id="siteForm">
        <div class="field">
          <label>اسم الموقع أو المنشأة *</label>
          <input id="siteName" value="${escapeHtml(editSite?.SiteName || '')}" placeholder="مثال: مصنع الأمل للغزل والنسيج" required>
        </div>

        <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:10px;">
          <div class="field">
            <label>اسم العميل / الشركة *</label>
            <input id="siteCustName" value="${escapeHtml(editSite?.CustomerName || '')}" placeholder="اسم العميل أو جهة التعاقد" required>
          </div>
          <div class="field">
            <label>رقم هاتف العميل *</label>
            <input id="siteCustPhone" value="${escapeHtml(editSite?.CustomerPhone || '')}" placeholder="010xxxxxxx" required>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div class="field">
            <label>العنوان بالتفصيل</label>
            <input id="siteAddress" value="${escapeHtml(editSite?.Address || '')}" placeholder="الشارع، المنطقة...">
          </div>
          <div class="field">
            <label>المدينة / المحافظة</label>
            <input id="siteCity" value="${escapeHtml(editSite?.City || 'القاهرة')}" placeholder="المدينة">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div class="field">
            <label>مسؤول الموقع الفني / الحارس</label>
            <input id="siteContact" value="${escapeHtml(editSite?.SiteContact || '')}" placeholder="اسم مسؤول الاستلام بالموقع">
          </div>
          <div class="field">
            <label>الإحداثيات الجغرافية (GPS)</label>
            <input id="siteCoords" value="${escapeHtml(editSite?.Coordinates || '')}" placeholder="30.0444, 31.2357">
          </div>
        </div>

        <div class="field">
          <label>ملاحظات إضافية</label>
          <textarea id="siteNotes" rows="2" placeholder="مواعيد العمل، تعليمات الدخول...">${escapeHtml(editSite?.Notes || '')}</textarea>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
          <button type="button" class="btn btn-ghost" id="cancelSiteModalBtn">إلغاء</button>
          <button type="submit" class="btn btn-primary" id="saveSiteModalBtn">
            ${getSvgIcon("check", 14)} ${isEdit ? 'حفظ التعديلات' : 'إضافة الموقع'}
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#closeSiteModalBtn').onclick = ()=>overlay.remove();
  overlay.querySelector('#cancelSiteModalBtn').onclick = ()=>overlay.remove();

  overlay.querySelector('#siteForm').onsubmit = async (e)=>{
    e.preventDefault();
    const btn = overlay.querySelector('#saveSiteModalBtn');
    btn.disabled = true;
    btn.textContent = 'جارٍ الحفظ...';

    const siteObj = {
      ID: editSite?.ID || '',
      SiteName: overlay.querySelector('#siteName').value.trim(),
      CustomerName: overlay.querySelector('#siteCustName').value.trim(),
      CustomerPhone: overlay.querySelector('#siteCustPhone').value.trim(),
      Address: overlay.querySelector('#siteAddress').value.trim(),
      City: overlay.querySelector('#siteCity').value.trim(),
      SiteContact: overlay.querySelector('#siteContact').value.trim(),
      Coordinates: overlay.querySelector('#siteCoords').value.trim(),
      Notes: overlay.querySelector('#siteNotes').value.trim()
    };

    try {
      await saveSiteRemote(siteObj);
      showToast('تم حفظ بيانات الموقع بنجاح', 'success');
      overlay.remove();
      renderCamerasApp(document.getElementById('app'));
    } catch(err) {
      showToast('فشل حفظ الموقع: ' + err.message, 'error');
      btn.disabled = false;
    }
  };
}

async function handleDeleteSite(id){
  const ok = await openConfirmModal({
    title: 'حذف موقع',
    message: 'هل أنت متأكد من حذف هذا الموقع؟ لا يمكن التراجع عن هذا الإجراء.',
    confirmText: 'حذف',
    cancelText: 'إلغاء',
    confirmClass: 'btn-danger'
  });
  if(!ok) return;
  try {
    await deleteSiteRemote(id);
    showToast('تم حذف الموقع بنجاح', 'success');
    renderCamerasApp(document.getElementById('app'));
  } catch(e){
    showToast('فشل حذف الموقع: ' + e.message, 'error');
  }
}

function openSiteDetailModalById(id){
  const s = (state.cctvSites || []).find(x => String(x.ID) === String(id));
  if(!s){ showToast('تعذر العثور على الموقع', 'error'); return; }

  const projects = (state.cctvProjects || []).filter(p => String(p.SiteID) === String(s.ID));
  const contracts = (state.cctvContracts || []).filter(c => String(c.SiteID) === String(s.ID));

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:720px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:12px;">
        <h3 style="margin:0;font-size:18px;font-weight:900;color:var(--primary);">
          ${getSvgIcon("folder", 16)} تفاصيل الموقع: ${escapeHtml(s.SiteName)}
        </h3>
        <button class="btn btn-ghost btn-xs" id="closeSiteDetailBtn">✕</button>
      </div>

      <div class="card" style="padding:12px;background:var(--paper2);margin-bottom:12px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12.5px;">
          <div>العميل: <b>${escapeHtml(s.CustomerName)}</b></div>
          <div>الهاتف: <b class="mono">${escapeHtml(s.CustomerPhone || '-')}</b></div>
          <div>العنوان: <span>${escapeHtml(s.Address || '-')} ${s.City ? `(${s.City})` : ''}</span></div>
          <div>المسؤول الميداني: <span>${escapeHtml(s.SiteContact || '-')}</span></div>
        </div>
      </div>

      <h4 style="margin:12px 0 6px 0;font-size:13.5px;">مشاريع الكاميرات في هذا الموقع (${projects.length}):</h4>
      ${projects.length === 0 ? '<div style="font-size:12px;color:var(--ink-secondary);">لا توجد مشاريع مرتبطة بهذا الموقع.</div>' : `
        <div class="table-wrap" style="margin-bottom:12px;">
          <table>
            <thead>
              <tr>
                <th>المشروع</th>
                <th>القيمة</th>
                <th>التسليم</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${projects.map(p => `
                <tr class="selectable-row" onclick="openProjectDetailModalById('${p.ID}')" style="cursor:pointer;">
                  <td style="font-weight:700;">${escapeHtml(p.Title)}</td>
                  <td class="mono font-bold">${Number(p.ContractValue||0).toLocaleString()} ج.م</td>
                  <td class="mono" style="font-size:11px;">${p.TargetDate ? cleanDate(p.TargetDate) : '-'}</td>
                  <td><span class="badge ${p.Status==='مكتمل'?'badge-green':''}">${escapeHtml(p.Status)}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}

      <h4 style="margin:12px 0 6px 0;font-size:13.5px;">عقود الصيانة الدورية (${contracts.length}):</h4>
      ${contracts.length === 0 ? '<div style="font-size:12px;color:var(--ink-secondary);">لا توجد عقود صيانة دورية مفعلة.</div>' : `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>التكرار</th>
                <th>القيمة السنوية</th>
                <th>الزيارات (منفذة / إجمالي)</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${contracts.map(c => `
                <tr>
                  <td>${escapeHtml(c.VisitFrequency || 'شهري')}</td>
                  <td class="mono font-bold">${Number(c.AnnualValue||0).toLocaleString()} ج.م</td>
                  <td class="mono">${c.VisitsUsed || 0} / ${c.VisitsIncluded || 12}</td>
                  <td><span class="badge ${c.Status==='ساري'?'badge-green':''}">${escapeHtml(c.Status)}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}

      <div style="display:flex;justify-content:flex-end;margin-top:14px;">
        <button class="btn btn-ghost" id="closeSiteDetailBottomBtn">إغلاق</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#closeSiteDetailBtn').onclick = ()=>overlay.remove();
  overlay.querySelector('#closeSiteDetailBottomBtn').onclick = ()=>overlay.remove();
}

/* ---------------- 3. DVR/NVR Channel Map View ---------------- */

function renderCctvChannelMapView(main){
  const projects = state.cctvProjects || [];
  if(!state.selectedChannelMapProjId && projects.length > 0){
    state.selectedChannelMapProjId = projects[0].ID;
  }
  const curProjId = state.selectedChannelMapProjId;
  const curProj = projects.find(p => String(p.ID) === String(curProjId));
  const curDevs = (state.cctvDevices || []).filter(d => String(d.ProjectID) === String(curProjId));

  // Determine channel count (default 8 or max channel found)
  const maxChannel = curDevs.reduce((m, d) => Math.max(m, Number(d.Channel || 0)), 8);
  const totalChannels = Math.max(8, maxChannel <= 4 ? 4 : (maxChannel <= 8 ? 8 : (maxChannel <= 16 ? 16 : 32)));

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("chart", 22)} خريطة قنوات DVR / NVR والربط الفني</h2>
        <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">تخطيط ومراقبة قنوات التسجيل والمنافذ الفارغة والمشغولة</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <select id="channelMapProjSel" style="font-weight:700;min-width:260px;">
          ${projects.map(p => `<option value="${escapeHtml(p.ID)}" ${String(p.ID)===String(curProjId)?'selected':''}>${escapeHtml(p.Title)} (#${String(p.ID).slice(-8)})</option>`).join('')}
        </select>
        ${curProj ? `<button class="btn btn-primary btn-sm" id="mapAddDevBtn">${getSvgIcon("plus", 14)} تركيب كاميرا جديدة</button>` : ''}
      </div>
    </div>

    ${!curProj ? '<div class="card empty" style="padding:30px;text-align:center;">اختر أو أنشئ مشروع كاميرات أولاً لعرض خريطة القنوات.</div>' : `
      <div class="card" style="padding:12px;background:var(--paper2);margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div>
          <b>جهاز التسجيل الميداني:</b> سعة المنظومة <b>${totalChannels} قنوات</b> • القنوات المشغولة: <b>${curDevs.length}</b> • القنوات المتاحة: <b>${Math.max(0, totalChannels - curDevs.length)}</b>
        </div>
        <div style="display:flex;gap:10px;font-size:11.5px;">
          <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;background:#22c55e;border-radius:50%;display:inline-block;"></span> متصلة وتعمل</span>
          <span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:10px;height:10px;background:#e2e8f0;border-radius:50%;border:1px solid #94a3b8;display:inline-block;"></span> قناة فارغة</span>
        </div>
      </div>

      <!-- Channel Grid -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(260px, 1fr));gap:12px;">
        ${Array.from({ length: totalChannels }).map((_, i) => {
          const chNum = i + 1;
          const dev = curDevs.find(d => Number(d.Channel) === chNum);

          if(dev){
            return `
              <div class="card" style="padding:12px;margin:0;border:1.5px solid var(--primary);border-top:4px solid var(--primary);position:relative;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                  <span class="badge badge-primary font-bold">CH ${chNum}</span>
                  <span class="badge badge-green" style="font-size:10px;">متصلة</span>
                </div>
                <div style="font-weight:900;font-size:13.5px;color:var(--ink);">${escapeHtml(dev.Brand || '')} ${escapeHtml(dev.Model || 'كاميرا')}</div>
                <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">
                  <b>المكان:</b> ${escapeHtml(dev.Location || 'غير محدد')}
                </div>
                <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">
                  دقة: <b>${escapeHtml(dev.Resolution || '-')}</b> • عدسة: <b>${escapeHtml(dev.LensType || '-')}</b>
                </div>
                <div class="mono" style="font-size:10.5px;margin-top:4px;color:var(--ink-secondary);">
                  ${dev.Serial ? `S/N: ${escapeHtml(dev.Serial)}` : 'بدون سيريال'}
                </div>
                <div style="display:flex;justify-content:flex-end;margin-top:8px;">
                  <button class="btn btn-ghost btn-xs" style="color:#ef4444;" onclick="handleDeleteProjectDevice('${dev.ID}')">${getSvgIcon("trash", 12)} إزالة</button>
                </div>
              </div>
            `;
          } else {
            return `
              <div class="card" style="padding:12px;margin:0;border:1.5px dashed var(--line);background:var(--paper3);display:flex;flex-direction:column;justify-content:center;align-items:center;min-height:140px;text-align:center;">
                <span class="badge" style="background:#f1f5f9;color:#64748b;font-weight:800;margin-bottom:6px;">CH ${chNum}</span>
                <div style="font-size:12px;color:var(--ink-secondary);font-weight:700;">قناة فارغة (متاح للتوصيل)</div>
                <button class="btn btn-primary btn-xs" style="margin-top:10px;" onclick="quickAssignCameraToChannel(${chNum})">
                  ${getSvgIcon("plus", 11)} تركيب كاميرا
                </button>
              </div>
            `;
          }
        }).join('')}
      </div>
    `}
  `;

  const projSel = document.getElementById('channelMapProjSel');
  if(projSel){
    projSel.onchange = (e)=>{
      state.selectedChannelMapProjId = e.target.value;
      renderCctvChannelMapView(main);
    };
  }

  const mapAddBtn = document.getElementById('mapAddDevBtn');
  if(mapAddBtn && curProj){
    mapAddBtn.onclick = ()=>openAddDeviceModal(curProj, ()=>renderCctvChannelMapView(main));
  }
}

function quickAssignCameraToChannel(channelNum){
  const curProj = (state.cctvProjects || []).find(p => String(p.ID) === String(state.selectedChannelMapProjId));
  if(!curProj) return;
  openAddDeviceModal(curProj, ()=>renderCctvChannelMapView(document.getElementById('main')));
  setTimeout(()=>{
    const chInput = document.getElementById('devChannel');
    if(chInput) chInput.value = channelNum;
  }, 100);
}

/* ---------------- 4. Service & Installation Visits View ---------------- */

function renderCctvVisitsView(main){
  const visits = state.cctvVisits || [];
  const projects = state.cctvProjects || [];
  const sites = state.cctvSites || [];

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("tool", 22)} زيارات التركيب والصيانة الميدانية</h2>
        <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">تنسيق زيارات الفنيين، تسجيل الأعطال، استهلاك القطع، وتوقيع العميل الإلكتروني</div>
      </div>
      <div>
        <button class="btn btn-primary btn-sm" id="visitNewBtn">${getSvgIcon("plus", 14)} جدولة زيارة عمل جديدة</button>
      </div>
    </div>

    <!-- Visits Table -->
    ${visits.length === 0 ? '<div class="card empty" style="padding:30px;text-align:center;">لا توجد زيارات عمل مسجلة. اضغط "جدولة زيارة عمل جديدة" للبدء.</div>' : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:105px;">التاريخ</th>
              <th>المشروع والموقع</th>
              <th>نوع المهمة</th>
              <th>الفني المشرف</th>
              <th>الأعمال والقطع المستهلكة</th>
              <th style="width:100px;text-align:center;">الحالة</th>
              <th style="width:90px;text-align:center;">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${visits.slice().reverse().map(v => {
              const proj = projects.find(p => String(p.ID) === String(v.ProjectID));
              const site = sites.find(s => String(s.ID) === String(v.SiteID || proj?.SiteID));

              return `
                <tr class="selectable-row" style="cursor:pointer;" onclick="openVisitExecutionModalById('${v.ID}')">
                  <td class="mono font-bold">${cleanDate(v.ScheduledDate)}</td>
                  <td>
                    <div style="font-weight:800;">${proj ? escapeHtml(proj.Title) : 'مهمة مستقلة'}</div>
                    <div style="font-size:11px;color:var(--ink-secondary);">${site ? escapeHtml(site.SiteName + ' (' + site.CustomerName + ')') : '-'}</div>
                  </td>
                  <td><span class="badge" style="background:var(--paper3);">${escapeHtml(v.VisitType || 'تركيب')}</span></td>
                  <td><b>${escapeHtml(v.Technician || 'غير محدد')}</b></td>
                  <td style="font-size:11.5px;color:var(--ink-secondary);">
                    ${escapeHtml(v.ActionsTaken || v.Findings || 'قيد الانتظار')}
                    ${v.CustomerSignature ? '<span class="badge badge-green" style="font-size:9px;padding:1px 4px;margin-right:4px;">توقيع معتمد</span>' : ''}
                  </td>
                  <td style="text-align:center;">
                    <span class="badge ${v.Status==='مكتملة'?'badge-green':(v.Status==='جارٍ التنفيذ'?'badge-blue':'')}">${escapeHtml(v.Status)}</span>
                  </td>
                  <td style="text-align:center;" onclick="event.stopPropagation();">
                    <button class="btn btn-primary btn-xs" onclick="openVisitExecutionModalById('${v.ID}')">تنفيذ</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;

  document.getElementById('visitNewBtn').onclick = ()=>openScheduleVisitModal();
}

function openScheduleVisitModal(preProject = null, onDone = null){
  const projects = state.cctvProjects || [];
  const techs = state.technicians || ['أحمد فتحي','محمود سيد','كريم عادل'];
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:540px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:8px;margin-bottom:12px;">
        <h3 style="margin:0;font-size:16px;font-weight:900;color:var(--primary);">
          ${getSvgIcon("tool", 15)} جدولة زيارة عمل ومهمة ميدانية
        </h3>
        <button class="btn btn-ghost btn-xs" id="closeSchedModalBtn">✕</button>
      </div>

      <form id="schedVisitForm">
        <div class="field">
          <label>المشروع المرتبط *</label>
          <select id="vProjId" required>
            <option value="">-- اختر المشروع --</option>
            ${projects.map(p => `<option value="${escapeHtml(p.ID)}" ${preProject?.ID === p.ID ? 'selected' : ''}>${escapeHtml(p.Title)} (#${String(p.ID).slice(-8)})</option>`).join('')}
          </select>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div class="field">
            <label>نوع الزيارة</label>
            <select id="vType">
              <option value="تركيب">تركيب وتمديد</option>
              <option value="صيانة دورية">صيانة دورية تعاقدية</option>
              <option value="طارئ">بلاغ عطل طارئ</option>
              <option value="معاينة">معاينة ورفع مقاسات</option>
            </select>
          </div>
          <div class="field">
            <label>الفني المسند إليه *</label>
            <select id="vTech" required>
              ${techs.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="field">
          <label>تاريخ الزيارة المجدول *</label>
          <input type="date" id="vDate" value="${new Date().toISOString().slice(0,10)}" required>
        </div>

        <div class="field">
          <label>وصف المهمة والمطلوب تنفيذه</label>
          <textarea id="vFindings" rows="2" placeholder="النقاط المطلوبة من الفني..."></textarea>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
          <button type="button" class="btn btn-ghost" id="cancelSchedModalBtn">إلغاء</button>
          <button type="submit" class="btn btn-primary" id="saveSchedModalBtn">
            ${getSvgIcon("check", 14)} جدولة الزيارة
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#closeSchedModalBtn').onclick = ()=>overlay.remove();
  overlay.querySelector('#cancelSchedModalBtn').onclick = ()=>overlay.remove();

  overlay.querySelector('#schedVisitForm').onsubmit = async (e)=>{
    e.preventDefault();
    const btn = overlay.querySelector('#saveSchedModalBtn');
    btn.disabled = true;
    btn.textContent = 'جارٍ الحفظ...';

    const pId = overlay.querySelector('#vProjId').value;
    const proj = projects.find(p => String(p.ID) === String(pId));

    const visitObj = {
      ID: 'vis_' + Date.now(),
      ProjectID: pId,
      SiteID: proj?.SiteID || '',
      ScheduledDate: overlay.querySelector('#vDate').value,
      VisitType: overlay.querySelector('#vType').value,
      Technician: overlay.querySelector('#vTech').value,
      Status: 'مجدولة',
      Findings: overlay.querySelector('#vFindings').value.trim(),
      ActionsTaken: '',
      PartsUsed: '',
      NextVisitDate: '',
      CustomerSignature: ''
    };

    try {
      await saveServiceVisitRemote(visitObj);
      showToast('تمت جدولة الزيارة بنجاح', 'success');
      overlay.remove();
      if(typeof onDone === 'function') onDone();
      else renderCamerasApp(document.getElementById('app'));
    } catch(err) {
      showToast('فشل جدولة الزيارة: ' + err.message, 'error');
      btn.disabled = false;
    }
  };
}

/* ---------------- Visit Execution & Signature Pad Modal ---------------- */

function openVisitExecutionModalById(id){
  const v = (state.cctvVisits || []).find(x => String(x.ID) === String(id));
  if(!v){ showToast('تعذر العثور على الزيارة', 'error'); return; }
  openVisitExecutionModal(v);
}

function openVisitExecutionModal(v){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const proj = (state.cctvProjects || []).find(p => String(p.ID) === String(v.ProjectID));
  const site = (state.cctvSites || []).find(s => String(s.ID) === String(v.SiteID || proj?.SiteID));
  const inventory = state.inventory || [];

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:760px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:12px;">
        <div>
          <h3 style="margin:0;font-size:17px;font-weight:900;color:var(--primary);">
            ${getSvgIcon("tool", 16)} تنفيذ وتوثيق زيارة العمل الميدانية
          </h3>
          <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">
            المشروع: <b>${proj ? escapeHtml(proj.Title) : 'عام'}</b> • الموقع: <b>${site ? escapeHtml(site.SiteName) : '-'}</b> • الفني: <b>${escapeHtml(v.Technician)}</b>
          </div>
        </div>
        <button class="btn btn-ghost btn-xs" id="closeExecModalBtn">✕</button>
      </div>

      <!-- Time Tracking Ribbon -->
      <div class="card" style="padding:10px 14px;background:var(--paper2);margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;gap:12px;align-items:center;">
          <div>
            <span style="font-size:10.5px;color:var(--ink-secondary);display:block;">تسجيل الحضور (Check-In)</span>
            <b class="mono" id="checkInLabel">${v.CheckInAt ? v.CheckInAt : 'لم يسجل'}</b>
          </div>
          <div>
            <span style="font-size:10.5px;color:var(--ink-secondary);display:block;">تسجيل المغادرة (Check-Out)</span>
            <b class="mono" id="checkOutLabel">${v.CheckOutAt ? v.CheckOutAt : 'لم يسجل'}</b>
          </div>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-outline btn-xs" id="stampCheckInBtn">${getSvgIcon("check", 11)} تسجيل Check-In الآن</button>
          <button class="btn btn-outline btn-xs" id="stampCheckOutBtn">${getSvgIcon("check", 11)} تسجيل Check-Out الآن</button>
        </div>
      </div>

      <form id="execForm">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="field">
            <label>الأعطال وملاحظات الفحص (Findings)</label>
            <textarea id="vFindingsText" rows="3" placeholder="تشخيص الحالة...">${escapeHtml(v.Findings || '')}</textarea>
          </div>
          <div class="field">
            <label>الإجراءات المنفذة والحلول (Actions Taken) *</label>
            <textarea id="vActionsText" rows="3" placeholder="ما تم إنجازه..." required>${escapeHtml(v.ActionsTaken || '')}</textarea>
          </div>
        </div>

        <div class="field">
          <label>القطع والمهمات المستخدمة من المخزن (مع الخصم الفعلي)</label>
          <div style="display:flex;gap:8px;align-items:center;">
            <select id="vPartSelect" style="flex:2;">
              <option value="">-- اختر صنف من المخزن لخصمه --</option>
              ${inventory.map(it => `<option value="${escapeHtml(it.ID)}">${escapeHtml(it.Name)} (متاح: ${it.Quantity||0})</option>`).join('')}
            </select>
            <input type="number" id="vPartQty" value="1" min="1" style="width:75px;" placeholder="الكمية">
            <button type="button" class="btn btn-primary btn-sm" id="vAddPartBtn">خصم وإضافة</button>
          </div>
          <input id="vPartsUsedText" value="${escapeHtml(v.PartsUsed || '')}" placeholder="ملخص القطع..." style="margin-top:6px;">
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="field">
            <label>حالة الزيارة</label>
            <select id="vExecStatus">
              <option value="مكتملة" ${v.Status==='مكتملة'?'selected':''}>مكتملة وناجحة</option>
              <option value="جارٍ التنفيذ" ${v.Status==='جارٍ التنفيذ'?'selected':''}>جارٍ التنفيذ (معلقة على أعمال)</option>
              <option value="مؤجلة" ${v.Status==='مؤجلة'?'selected':''}>مؤجلة لزيارة قادمة</option>
              <option value="ملغاة" ${v.Status==='ملغاة'?'selected':''}>ملغاة</option>
            </select>
          </div>
          <div class="field">
            <label>موعد الزيارة القادمة (إن وجدت)</label>
            <input type="date" id="vNextDate" value="${v.NextVisitDate || ''}">
          </div>
        </div>

        <!-- Customer Signature Pad -->
        <div class="card" style="padding:12px;margin:12px 0;background:var(--paper3);border:1.5px solid var(--line);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <label style="font-weight:900;font-size:12.5px;margin:0;">توقيع العميل الإلكتروني على الاستلام والإنجاز *</label>
            <button type="button" class="btn btn-ghost btn-xs" id="clearSigBtn" style="color:#ef4444;">مسح التوقيع</button>
          </div>
          <canvas id="sigCanvas" width="680" height="130" style="width:100%;height:130px;background:#fff;border:1.5px dashed var(--line);border-radius:var(--radius-sm);cursor:crosshair;touch-action:none;"></canvas>
          <div style="font-size:10.5px;color:var(--ink-secondary);margin-top:4px;">وقع بإصبعك أو بالقلم الإلكتروني أو بالماوس داخل المربع أعلاه لاعتماد إنجاز الزيارة.</div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px;">
          <button type="button" class="btn btn-ghost" id="cancelExecModalBtn">إلغاء</button>
          <button type="submit" class="btn btn-primary" id="saveExecModalBtn">
            ${getSvgIcon("check", 14)} حفظ وتأكيد إنجاز الزيارة
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#closeExecModalBtn').onclick = ()=>overlay.remove();
  overlay.querySelector('#cancelExecModalBtn').onclick = ()=>overlay.remove();

  // Signature canvas setup
  const canvas = overlay.querySelector('#sigCanvas');
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  let drawing = false;

  // Restore existing signature if exists
  if(v.CustomerSignature && v.CustomerSignature.startsWith('data:image')){
    const img = new Image();
    img.onload = ()=>ctx.drawImage(img, 0, 0);
    img.src = v.CustomerSignature;
  }

  function getPos(e){
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  function startDraw(e){ drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }
  function doDraw(e){ if(!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); }
  function stopDraw(){ drawing = false; }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', doDraw);
  window.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('touchstart', (e)=>{ e.preventDefault(); startDraw(e); }, { passive: false });
  canvas.addEventListener('touchmove', (e)=>{ e.preventDefault(); doDraw(e); }, { passive: false });
  canvas.addEventListener('touchend', stopDraw);

  overlay.querySelector('#clearSigBtn').onclick = ()=>{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Stamp Check-in/out
  overlay.querySelector('#stampCheckInBtn').onclick = ()=>{
    const t = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    v.CheckInAt = t;
    overlay.querySelector('#checkInLabel').textContent = t;
    showToast('تم تسجيل وقت الحضور: ' + t, 'info');
  };
  overlay.querySelector('#stampCheckOutBtn').onclick = ()=>{
    const t = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    v.CheckOutAt = t;
    overlay.querySelector('#checkOutLabel').textContent = t;
    showToast('تم تسجيل وقت المغادرة: ' + t, 'info');
  };

  // Add Part with deduction
  overlay.querySelector('#vAddPartBtn').onclick = ()=>{
    const pSel = overlay.querySelector('#vPartSelect');
    const pQty = Number(overlay.querySelector('#vPartQty').value) || 1;
    const itId = pSel.value;
    if(!itId){ showToast('اختر صنفاً من المخزن', 'error'); return; }
    const it = inventory.find(x => String(x.ID) === String(itId));
    if(!it) return;

    it.Quantity = Math.max(0, Number(it.Quantity||0) - pQty);
    setCache('inventory', state.inventory);
    try { apiPost('adjustInventoryQty', { id: itId, quantity: it.Quantity }); } catch(err){}

    const pText = overlay.querySelector('#vPartsUsedText');
    const entry = `${it.Name} × ${pQty}`;
    pText.value = pText.value ? (pText.value + '، ' + entry) : entry;
    showToast(`تم خصم ${pQty} من رصيد ${it.Name}`, 'success');
  };

  // Form submit
  overlay.querySelector('#execForm').onsubmit = async (e)=>{
    e.preventDefault();
    const btn = overlay.querySelector('#saveExecModalBtn');
    btn.disabled = true;
    btn.textContent = 'جارٍ الحفظ...';

    const sigData = canvas.toDataURL('image/png');

    v.Findings = overlay.querySelector('#vFindingsText').value.trim();
    v.ActionsTaken = overlay.querySelector('#vActionsText').value.trim();
    v.PartsUsed = overlay.querySelector('#vPartsUsedText').value.trim();
    v.Status = overlay.querySelector('#vExecStatus').value;
    v.NextVisitDate = overlay.querySelector('#vNextDate').value;
    v.CustomerSignature = sigData;

    try {
      await saveServiceVisitRemote(v);
      showToast('تم حفظ وتوثيق الزيارة بنجاح', 'success');
      overlay.remove();
      renderCamerasApp(document.getElementById('app'));
    } catch(err) {
      showToast('فشل حفظ الزيارة: ' + err.message, 'error');
      btn.disabled = false;
    }
  };
}

/* ---------------- 5. Device Warranties View & 30-Day Expiration ---------------- */

function renderCctvWarrantiesView(main){
  const devices = state.cctvDevices || [];
  const projects = state.cctvProjects || [];
  const sites = state.cctvSites || [];
  const today = new Date().toISOString().slice(0, 10);

  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const thirtyDaysStr = thirtyDaysLater.toISOString().slice(0, 10);

  const activeWarranties = devices.filter(d => d.WarrantyEnd && d.WarrantyEnd >= today);
  const expiringSoon = devices.filter(d => d.WarrantyEnd && d.WarrantyEnd >= today && d.WarrantyEnd <= thirtyDaysStr);
  const expiredWarranties = devices.filter(d => !d.WarrantyEnd || d.WarrantyEnd < today);

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("check", 22)} تقرير ضمان الأجهزة ومتابعة الصلاحية</h2>
        <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">حساب فترات الضمان التلقائية، أجهزة داخل الضمان، وتنبيهات الاقتراب من الانتهاء</div>
      </div>
    </div>

    <!-- Metric Cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:10px;margin-bottom:14px;">
      <div class="card" style="padding:12px;margin:0;border-right:3.5px solid var(--green);">
        <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">أجهزة داخل فترة الضمان</div>
        <div class="num mono font-bold" style="font-size:20px;margin-top:2px;color:var(--green-text);">${activeWarranties.length}</div>
      </div>
      <div class="card" style="padding:12px;margin:0;border-right:3.5px solid var(--amber);">
        <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">ينتهي قريباً (أقل من 30 يوماً)</div>
        <div class="num mono font-bold" style="font-size:20px;margin-top:2px;color:var(--amber-text);">${expiringSoon.length}</div>
      </div>
      <div class="card" style="padding:12px;margin:0;border-right:3.5px solid #ef4444;">
        <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">منتهي الضمان</div>
        <div class="num mono font-bold" style="font-size:20px;margin-top:2px;color:#ef4444;">${expiredWarranties.length}</div>
      </div>
    </div>

    <!-- Warranties Table -->
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>الجهاز والموديل</th>
            <th>المشروع والموقع</th>
            <th>الرقم التسلسلي</th>
            <th>تاريخ التركيب</th>
            <th>تاريخ نهاية الضمان</th>
            <th style="width:130px;text-align:center;">حالة الضمان</th>
            <th style="width:100px;text-align:center;">إجراء</th>
          </tr>
        </thead>
        <tbody>
          ${devices.map(d => {
            const proj = projects.find(p => String(p.ID) === String(d.ProjectID));
            const site = sites.find(s => String(s.ID) === String(proj?.SiteID));
            const isExpSoon = d.WarrantyEnd && d.WarrantyEnd >= today && d.WarrantyEnd <= thirtyDaysStr;
            const isExpired = !d.WarrantyEnd || d.WarrantyEnd < today;

            let badge = '<span class="badge badge-green">ساري (داخل الضمان)</span>';
            if(isExpired) badge = '<span class="badge badge-red">منتهي الضمان</span>';
            else if(isExpSoon) badge = '<span class="badge" style="background:#fef3c7;color:#92400e;font-weight:800;">ينتهي خلال 30 يوماً!</span>';

            return `
              <tr>
                <td>
                  <div style="font-weight:800;">${escapeHtml(d.Brand || '')} ${escapeHtml(d.Model || d.Category || 'كاميرا')}</div>
                  <div style="font-size:11px;color:var(--ink-secondary);">${escapeHtml(d.Location || '')}</div>
                </td>
                <td>
                  <div style="font-weight:700;">${proj ? escapeHtml(proj.Title) : 'غير محدد'}</div>
                  <div style="font-size:11px;color:var(--ink-secondary);">${site ? escapeHtml(site.CustomerName) : '-'}</div>
                </td>
                <td class="mono font-bold" style="font-size:11.5px;">${d.Serial ? escapeHtml(d.Serial) : '<span style="color:var(--ink-secondary);">-</span>'}</td>
                <td class="mono">${cleanDate(d.InstallDate)}</td>
                <td class="mono font-bold">${cleanDate(d.WarrantyEnd)}</td>
                <td style="text-align:center;">${badge}</td>
                <td style="text-align:center;">
                  ${site?.CustomerPhone ? `
                    <a href="https://wa.me/${normalizePhoneForWa(site.CustomerPhone)}?text=${encodeURIComponent(`مرحباً ${site.CustomerName}، نود إحاطتكم بأن فترة ضمان جهاز المراقبة (${d.Model || 'الكاميرا'}) بموقع ${site.SiteName} ${isExpired ? 'قد انتهت' : 'ستنتهي قريباً بتاريخ ' + d.WarrantyEnd}. يسعدنا تقديم عرض تجديد عقد الصيانة والدعم الفني.`)}" target="_blank" class="btn btn-ghost btn-xs" style="color:#22c55e;" title="تنبيه العميل عبر واتساب">
                      ${getSvgIcon("message", 12)} تواصل
                    </a>
                  ` : '-'}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* ---------------- 6. Periodic Maintenance Contracts View ---------------- */

function renderCctvContractsView(main){
  const contracts = state.cctvContracts || [];
  const sites = state.cctvSites || [];
  const projects = state.cctvProjects || [];

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("fileText", 22)} عقود الصيانة الدورية السنوية</h2>
        <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">متابعة زيارات الصيانة الدورية وتكرارها ورصد المستهلك منها</div>
      </div>
      <div>
        <button class="btn btn-primary btn-sm" id="contractNewBtn">${getSvgIcon("plus", 14)} إنشاء عقد صيانة جديد</button>
      </div>
    </div>

    <!-- Contracts Table -->
    ${contracts.length === 0 ? '<div class="card empty" style="padding:30px;text-align:center;">لا توجد عقود صيانة دورية مسجلة بعد.</div>' : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:110px;">رقم العقد</th>
              <th>الموقع والعميل</th>
              <th>المشروع المرتبط</th>
              <th>تكرار الزيارات</th>
              <th>القيمة السنوية</th>
              <th>الزيارات (منفذة / إجمالي)</th>
              <th style="width:100px;text-align:center;">الحالة</th>
              <th style="width:100px;text-align:center;">إجراء</th>
            </tr>
          </thead>
          <tbody>
            ${contracts.map(c => {
              const site = sites.find(s => String(s.ID) === String(c.SiteID));
              const proj = projects.find(p => String(p.ID) === String(c.ProjectID));
              const used = Number(c.VisitsUsed || 0);
              const total = Number(c.VisitsIncluded || 12);

              return `
                <tr>
                  <td class="mono font-bold" style="color:var(--primary);">#${String(c.ID).slice(-8)}</td>
                  <td>
                    <div style="font-weight:800;">${site ? escapeHtml(site.SiteName) : 'موقع غير محدد'}</div>
                    <div style="font-size:11px;color:var(--ink-secondary);">${site ? escapeHtml(site.CustomerName) : '-'}</div>
                  </td>
                  <td>${proj ? escapeHtml(proj.Title) : 'صيانة عامة'}</td>
                  <td><b>${escapeHtml(c.VisitFrequency || 'شهري')}</b></td>
                  <td class="mono font-bold">${Number(c.AnnualValue||0).toLocaleString()} ج.م</td>
                  <td class="mono">
                    <b>${used}</b> / ${total}
                    <div style="width:80px;height:5px;background:#e2e8f0;border-radius:3px;margin-top:3px;overflow:hidden;">
                      <div style="width:${Math.min(100, Math.round((used/total)*100))}%;height:100%;background:var(--primary);"></div>
                    </div>
                  </td>
                  <td style="text-align:center;">
                    <span class="badge ${c.Status==='ساري'?'badge-green':''}">${escapeHtml(c.Status)}</span>
                  </td>
                  <td style="text-align:center;">
                    <button class="btn btn-outline btn-xs" onclick="quickScheduleVisitFromContract('${c.ID}')">
                      ${getSvgIcon("plus", 11)} زيارة
                    </button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;

  document.getElementById('contractNewBtn').onclick = ()=>openMaintenanceContractModal();
}

function openMaintenanceContractModal(){
  const sites = state.cctvSites || [];
  const projects = state.cctvProjects || [];
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:540px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:8px;margin-bottom:12px;">
        <h3 style="margin:0;font-size:16px;font-weight:900;color:var(--primary);">
          ${getSvgIcon("fileText", 15)} إنشاء عقد صيانة دورية
        </h3>
        <button class="btn btn-ghost btn-xs" id="closeMcModalBtn">✕</button>
      </div>

      <form id="mcForm">
        <div class="field">
          <label>الموقع / المنشأة *</label>
          <select id="mcSiteId" required>
            <option value="">-- اختر الموقع --</option>
            ${sites.map(s => `<option value="${escapeHtml(s.ID)}">${escapeHtml(s.SiteName)} (${escapeHtml(s.CustomerName)})</option>`).join('')}
          </select>
        </div>

        <div class="field">
          <label>المشروع المرتبط (اختياري)</label>
          <select id="mcProjId">
            <option value="">-- عقد صيانة موقع عام --</option>
            ${projects.map(p => `<option value="${escapeHtml(p.ID)}">${escapeHtml(p.Title)}</option>`).join('')}
          </select>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div class="field">
            <label>تكرار الزيارات</label>
            <select id="mcFreq">
              <option value="شهري">شهري (12 زيارة سنوياً)</option>
              <option value="ربع سنوي">ربع سنوي (4 زيارات سنوياً)</option>
              <option value="نصف سنوي">نصف سنوي (زيارتان سنوياً)</option>
            </select>
          </div>
          <div class="field">
            <label>القيمة السنوية (ج.م) *</label>
            <input type="number" id="mcVal" value="6000" min="0" required>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div class="field">
            <label>تاريخ بدء العقد</label>
            <input type="date" id="mcStart" value="${new Date().toISOString().slice(0,10)}">
          </div>
          <div class="field">
            <label>تاريخ انتهاء العقد</label>
            <input type="date" id="mcEnd" value="${(function(){ const d=new Date(); d.setFullYear(d.getFullYear()+1); return d.toISOString().slice(0,10); })()}">
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
          <button type="button" class="btn btn-ghost" id="cancelMcModalBtn">إلغاء</button>
          <button type="submit" class="btn btn-primary" id="saveMcModalBtn">
            ${getSvgIcon("check", 14)} حفظ العقد
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);
  overlay.querySelector('#closeMcModalBtn').onclick = ()=>overlay.remove();
  overlay.querySelector('#cancelMcModalBtn').onclick = ()=>overlay.remove();

  overlay.querySelector('#mcForm').onsubmit = async (e)=>{
    e.preventDefault();
    const btn = overlay.querySelector('#saveMcModalBtn');
    btn.disabled = true;
    btn.textContent = 'جارٍ الحفظ...';

    const freq = overlay.querySelector('#mcFreq').value;
    const visitsInc = freq === 'شهري' ? 12 : (freq === 'ربع سنوي' ? 4 : 2);

    const cObj = {
      ID: 'mc_' + Date.now(),
      SiteID: overlay.querySelector('#mcSiteId').value,
      ProjectID: overlay.querySelector('#mcProjId').value || '',
      StartDate: overlay.querySelector('#mcStart').value,
      EndDate: overlay.querySelector('#mcEnd').value,
      VisitFrequency: freq,
      AnnualValue: Number(overlay.querySelector('#mcVal').value || 0),
      VisitsIncluded: visitsInc,
      VisitsUsed: 0,
      Status: 'ساري',
      AutoRenew: true
    };

    try {
      await saveMaintenanceContractRemote(cObj);
      showToast('تم حفظ عقد الصيانة الدورية بنجاح', 'success');
      overlay.remove();
      renderCamerasApp(document.getElementById('app'));
    } catch(err) {
      showToast('فشل حفظ العقد: ' + err.message, 'error');
      btn.disabled = false;
    }
  };
}

async function quickScheduleVisitFromContract(cId){
  const c = (state.cctvContracts || []).find(x => String(x.ID) === String(cId));
  if(!c) return;

  const vObj = {
    ID: 'vis_' + Date.now(),
    ProjectID: c.ProjectID || '',
    SiteID: c.SiteID,
    ScheduledDate: new Date().toISOString().slice(0, 10),
    VisitType: 'صيانة دورية',
    Technician: state.technicians[0] || 'أحمد فتحي',
    Status: 'مجدولة',
    Findings: 'زيارة صيانة دورية تعاقدية',
    ActionsTaken: '',
    PartsUsed: '',
    NextVisitDate: '',
    CustomerSignature: ''
  };

  try {
    await saveServiceVisitRemote(vObj);
    c.VisitsUsed = Number(c.VisitsUsed || 0) + 1;
    await saveMaintenanceContractRemote(c);
    showToast('تمت جدولة زيارة الصيانة وزيادة عداد الزيارات المنفذة بنجاح', 'success');
    renderCamerasApp(document.getElementById('app'));
  } catch(err) {
    showToast('خطأ: ' + err.message, 'error');
  }
}

/* ---------------- 7. Enhanced Quotation Builder & List ---------------- */

function renderQuotationBuilder(main){
  if(!state.quoCart) state.quoCart = [];
  const cart = state.quoCart;
  const itemsTotal = cart.reduce((s,c)=>s+c.qty*c.price,0);

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("plus", 20)} عرض سعر جديد — كاميرات مراقبة وشبكات</h2>
      </div>
      <div>
        <button class="btn btn-ghost btn-sm" id="quoBackToListBtn">${getSvgIcon("fileText", 14)} عروض الأسعار السابقة</button>
      </div>
    </div>
    <div class="card">
      <h3>${getSvgIcon("user", 16)} بيانات العميل / الشركة</h3>
      <div style="display:grid;grid-template-columns:140px 1.5fr 1fr;gap:10px;">
        <div class="field">
          <label>اللقب (اختياري)</label>
          <select id="quoClientTitle">
            ${[''].concat(CUSTOMER_TITLES).map(t=>`<option value="${escapeHtml(t)}">${t ? escapeHtml(t) : '-- بدون لقب --'}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>اسم العميل / الشركة *</label><input id="quoClientName"></div>
        <div class="field"><label>رقم الهاتف</label><input id="quoClientPhone"></div>
      </div>
    </div>
    <div class="card">
      <h3>${getSvgIcon("package", 16)} إضافة منتج من المخزن</h3>
      <div style="display:flex;gap:8px;align-items:flex-end;">
        <div class="field" style="flex:2;margin-bottom:0;"><label>المنتج</label>
          <select id="quoPickItem">
            <option value="">-- اختر منتج --</option>
            ${state.inventory.filter(it=>(it.Category||'صيانة')==='كاميرات').map(it=>`<option value="${escapeHtml(it.ID)}">${escapeHtml(it.Name)} (متاح: ${Number(it.Quantity)||0}) - ${Number(it.SellPrice||it.PurchasePrice)||0} ج.م</option>`).join('')}
          </select>
        </div>
        <div class="field" style="flex:1;margin-bottom:0;"><label>الكمية</label><input id="quoPickQty" type="number" value="1" min="1"></div>
        <button class="btn btn-primary btn-sm" id="quoAddItemBtn">إضافة</button>
      </div>
    </div>
    <div class="card">
      <h3>${getSvgIcon("tool", 16)} إضافة خدمة وتركيبات</h3>
      <div style="display:flex;gap:8px;align-items:flex-end;">
        <div class="field" style="flex:2;margin-bottom:0;"><label>الخدمة</label>
          <select id="quoPickService">
            <option value="">-- اختر خدمة من الكتالوج --</option>
            ${state.services.map(s=>`<option value="${escapeHtml(s.Name)}" data-price="${Number(s.DefaultPrice)||0}">${escapeHtml(s.Name)} (${Number(s.DefaultPrice)||0} ج.م)</option>`).join('')}
          </select>
        </div>
        <div class="field" style="flex:2;margin-bottom:0;"><label>أو خدمة يدويًا</label><input id="quoManualService" placeholder="مثال: تمديد كابلات وشبكة..."></div>
        <div class="field" style="flex:1;margin-bottom:0;"><label>السعر (ج.م)</label><input id="quoServicePrice" type="number" value="0"></div>
        <button class="btn btn-primary btn-sm" id="quoAddServiceBtn">إضافة</button>
      </div>
    </div>
    <div class="card">
      <h3>بنود عرض السعر</h3>
      ${cart.length===0 ? '<div class="empty">لم تتم إضافة بنود بعد.</div>' : `
      <div class="table-wrap"><table><thead><tr><th>البند</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th><th></th></tr></thead><tbody>
        ${cart.map((c,i)=>`<tr><td>${escapeHtml(c.name)}${c.type==='service'?' <span style="color:var(--ink-secondary);font-size:11px;">(خدمة)</span>':''}</td><td class="mono">${Number(c.qty)||0}</td><td class="mono">${Number(c.price)||0}</td><td class="mono font-bold">${(Number(c.qty)||0)*(Number(c.price)||0)}</td>
        <td><button class="btn btn-xs btn-red" data-quocartidx="${i}">إزالة</button></td></tr>`).join('')}
      </tbody></table></div>`}
      <div style="text-align:left;font-size:20px;font-weight:900;margin-top:14px;">الإجمالي: <span class="mono" style="color:var(--primary);">${itemsTotal}</span> ج.م</div>
      <button class="btn btn-green" id="saveQuoteBtn" style="margin-top:8px;" ${cart.length===0?'disabled':''}>${getSvgIcon("check", 14)} حفظ وطباعة عرض السعر</button>
    </div>
  `;

  document.getElementById('quoBackToListBtn').onclick = ()=>{
    state.cctvTab = 'quotes';
    state.camTab = 'quotes';
    renderCamerasApp(document.getElementById('app'));
  };

  document.getElementById('quoAddItemBtn').onclick = ()=>{
    const itemId = document.getElementById('quoPickItem').value;
    const qty = Number(document.getElementById('quoPickQty').value);
    if(!itemId || !qty){ showToast('اختر صنف وكمية صحيحة', 'error'); return; }
    const item = state.inventory.find(x=>x.ID===itemId);
    cart.push({type:'product', itemId, name:item.Name, qty, price:Number(item.SellPrice||item.PurchasePrice||0)});
    renderQuotationBuilder(main);
  };
  document.getElementById('quoAddServiceBtn').onclick = ()=>{
    const sel = document.getElementById('quoPickService');
    const manual = document.getElementById('quoManualService').value.trim();
    const name = manual || sel.options[sel.selectedIndex].text.split(' (')[0];
    const price = Number(document.getElementById('quoServicePrice').value) || Number(sel.options[sel.selectedIndex]?.dataset?.price || 0);
    if(!name || name.startsWith('--')){ showToast('اختر أو اكتب خدمة', 'error'); return; }
    cart.push({type:'service', name, qty:1, price});
    renderQuotationBuilder(main);
  };
  document.getElementById('quoPickService').onchange = (e)=>{
    const opt = e.target.options[e.target.selectedIndex];
    if(opt && opt.dataset.price) document.getElementById('quoServicePrice').value = opt.dataset.price;
  };
  main.querySelectorAll('[data-quocartidx]').forEach(btn=>{
    btn.onclick = ()=>{ cart.splice(Number(btn.dataset.quocartidx),1); renderQuotationBuilder(main); };
  });

  const saveBtn = document.getElementById('saveQuoteBtn');
  if(saveBtn) saveBtn.onclick = async ()=>{
    const clientTitle = extractCustomerTitle({ CustomerTitle: (document.getElementById('quoClientTitle')?.value || '') });
    const clientName = document.getElementById('quoClientName').value.trim();
    const clientPhone = document.getElementById('quoClientPhone').value.trim();
    if(!clientName){ showToast('اكتب اسم العميل أو الشركة', 'error'); return; }
    saveBtn.disabled = true; saveBtn.textContent = 'جارٍ الحفظ...';
    const itemsSummary = cart.map(c=>`${c.name} × ${c.qty} (${c.qty*c.price} ج.م)`).join('، ');
    const q = {
      ID: 'quo_' + Date.now(),
      Date: new Date().toISOString().slice(0,10),
      ClientTitle: clientTitle,
      ClientName: clientName,
      ClientPhone: clientPhone,
      Items: JSON.parse(JSON.stringify(cart)),
      ItemsSummary: itemsSummary,
      LaborCost: cart.filter(c=>c.type==='service').reduce((s,c)=>s+c.qty*c.price,0),
      Total: itemsTotal,
      PaidAmount: 0,
      Payments: [],
      Status: 'معلق',
      AccountCode: '4103', // Explicitly routes project revenue to 4103
      By: state.user ? state.user.name : 'المسؤول'
    };
    try{
      const res = await saveQuotationRemote(q);
      showToast('تم حفظ عرض السعر بنجاح', 'success');
      openQuotationPrint(res.quotation, cart);
      state.quoCart = [];
      state.cctvTab = 'quotes';
      state.camTab = 'quotes';
      renderCamerasApp(document.getElementById('app'));
    }catch(e){ showToast('تم الحفظ محلياً: '+e.message, 'info'); }
    saveBtn.disabled = false; saveBtn.textContent = 'حفظ وطباعة عرض السعر';
  };
}

function getQuotationItems(q){
  if(Array.isArray(q.Items) && q.Items.length > 0) return q.Items;
  if(typeof q.Items === 'string' && q.Items.startsWith('[')){
    try { return JSON.parse(q.Items); } catch(e){}
  }
  if(q.ItemsSummary){
    const parts = q.ItemsSummary.split('،').map(p=>p.trim()).filter(Boolean);
    if(parts.length > 0){
      return parts.map(p => {
        const m = p.match(/(.*?)\s*×\s*(\d+)\s*\(([\d,.]+)\s*ج\.م\)/);
        if(m){
          const qty = Number(m[2]) || 1;
          const lineTotal = Number(m[3].replace(/,/g,'')) || 0;
          return { name: m[1].trim(), qty, price: qty > 0 ? (lineTotal / qty) : lineTotal, type: 'product' };
        }
        return { name: p, qty: 1, price: 0, type: 'product' };
      });
    }
  }
  return [{ name: 'مهمات وتوريدات وتركيبات كاميرات وشبكات', qty: 1, price: Number(q.Total||0), type: 'product' }];
}

function renderQuotationsList(main){
  if(!state.quoFilter) state.quoFilter = { q: '', status: 'all' };

  const allQ = state.quotations || [];
  const totalCount = allQ.length;
  const totalVal = allQ.reduce((s,x)=>s+Number(x.Total||0), 0);
  const pendingList = allQ.filter(x=>x.Status==='معلق' || !x.Status);
  const inProgressList = allQ.filter(x=>x.Status==='مقبول / جاري التنفيذ' || x.Status==='مقبول');
  const doneList = allQ.filter(x=>x.Status==='تم التنفيذ والتسليم' || x.Status==='تم التنفيذ');
  const totalCollected = allQ.reduce((s,x)=>s+Number(x.PaidAmount||0), 0);

  const qText = (state.quoFilter.q || '').trim().toLowerCase();
  const qStat = state.quoFilter.status || 'all';

  const filtered = allQ.slice().reverse().filter(q => {
    if(qStat !== 'all'){
      if(qStat === 'pending' && !(q.Status==='معلق' || !q.Status)) return false;
      if(qStat === 'in_progress' && !(q.Status==='مقبول / جاري التنفيذ' || q.Status==='مقبول')) return false;
      if(qStat === 'done' && !(q.Status==='تم التنفيذ والتسليم' || q.Status==='تم التنفيذ')) return false;
      if(qStat === 'cancelled' && !(q.Status==='ملغي / مرفوض' || q.Status==='ملغي')) return false;
    }
    if(qText){
      const matchName = (q.ClientName||'').toLowerCase().includes(qText);
      const matchPhone = (q.ClientPhone||'').includes(qText);
      const matchId = String(q.ID||'').toLowerCase().includes(qText);
      const matchSummary = (q.ItemsSummary||'').toLowerCase().includes(qText);
      if(!matchName && !matchPhone && !matchId && !matchSummary) return false;
    }
    return true;
  });

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("fileText", 20)} عروض الأسعار والمقايسات</h2>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" id="quoGotoSettingsBtn">${getSvgIcon("settings", 14)} شروط العروض والعقود</button>
        <button class="btn btn-primary btn-sm" id="quoNewBtn">${getSvgIcon("plus", 14)} عرض سعر جديد</button>
      </div>
    </div>

    <!-- Metric KPI Cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;margin-bottom:14px;">
      <div class="card" style="padding:12px;margin:0;border-right:3.5px solid var(--primary);">
        <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">إجمالي عروض الأسعار</div>
        <div class="num mono font-bold" style="font-size:18px;margin-top:2px;">${totalCount} <span style="font-size:11px;color:var(--ink-secondary);font-weight:normal;">(${totalVal.toLocaleString()} ج.م)</span></div>
      </div>
      <div class="card" style="padding:12px;margin:0;border-right:3.5px solid var(--amber);">
        <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">معلقة بانتظار الرد</div>
        <div class="num mono font-bold" style="font-size:18px;margin-top:2px;color:var(--amber-text);">${pendingList.length}</div>
      </div>
      <div class="card" style="padding:12px;margin:0;border-right:3.5px solid var(--blue);">
        <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">مقبولة / جاري التنفيذ</div>
        <div class="num mono font-bold" style="font-size:18px;margin-top:2px;color:var(--blue-text);">${inProgressList.length}</div>
      </div>
      <div class="card" style="padding:12px;margin:0;border-right:3.5px solid var(--green);">
        <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">تم التنفيذ والتسليم</div>
        <div class="num mono font-bold" style="font-size:18px;margin-top:2px;color:var(--green-text);">${doneList.length}</div>
      </div>
      <div class="card" style="padding:12px;margin:0;border-right:3.5px solid #8b5cf6;">
        <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">المحصل (عربونات ودفعات)</div>
        <div class="num mono font-bold" style="font-size:18px;margin-top:2px;color:#8b5cf6;">${totalCollected.toLocaleString()} ج.م</div>
      </div>
    </div>

    <!-- Filter & Search Controls -->
    <div class="card" style="padding:12px;margin-bottom:14px;background:var(--paper2);">
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <input id="quoSearchInput" value="${escapeHtml(state.quoFilter.q||'')}" placeholder="بحث باسم العميل، الهاتف، رقم العرض، أو الصنف..." style="flex:2;min-width:240px;">
        <select id="quoStatusFilter" style="flex:1;min-width:160px;font-weight:700;">
          <option value="all" ${qStat==='all'?'selected':''}>كافة الحالات (${allQ.length})</option>
          <option value="pending" ${qStat==='pending'?'selected':''}>معلق (${pendingList.length})</option>
          <option value="in_progress" ${qStat==='in_progress'?'selected':''}>مقبول / جاري التنفيذ (${inProgressList.length})</option>
          <option value="done" ${qStat==='done'?'selected':''}>تم التنفيذ والتسليم (${doneList.length})</option>
          <option value="cancelled" ${qStat==='cancelled'?'selected':''}>ملغي / مرفوض</option>
        </select>
      </div>
    </div>

    <!-- Quotations Table -->
    ${filtered.length === 0 ? '<div class="card empty" style="padding:30px;text-align:center;">لا توجد عروض أسعار مطابقة لمعايير البحث.</div>' : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:110px;">رقم العرض</th>
              <th style="width:105px;">التاريخ</th>
              <th>العميل / الشركة</th>
              <th style="min-width:220px;">ملخص البنود والأعمال</th>
              <th style="width:170px;">الماليات والتحصيل</th>
              <th style="width:140px;text-align:center;">الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(q => {
              const qId = String(q.ID||'').slice(-8);
              const paid = Number(q.PaidAmount||0);
              const total = Number(q.Total||0);
              const rem = Math.max(0, total - paid);

              return `
                <tr class="selectable-row" onclick="openQuotationDetailModalById('${q.ID}')" style="cursor:pointer;">
                  <td class="mono font-bold" style="color:var(--primary);">#${qId}</td>
                  <td class="mono" style="font-size:11.5px;">${cleanDate(q.Date)}</td>
                  <td>
                    <div style="font-weight:800;color:var(--ink);">${escapeHtml(q.ClientName)}</div>
                    ${q.ClientPhone ? `<div class="mono" style="font-size:11px;color:var(--ink-secondary);">${escapeHtml(q.ClientPhone)}</div>` : ''}
                  </td>
                  <td style="font-size:11.5px;color:var(--ink-secondary);">${escapeHtml(q.ItemsSummary||'')}</td>
                  <td>
                    <div style="font-weight:900;font-size:13px;" class="mono">${total.toLocaleString()} ج.م</div>
                    ${paid > 0 ? `
                      <div style="font-size:10.5px;color:var(--green-text);font-weight:700;">مدفوع: ${paid.toLocaleString()} ج.م</div>
                      ${rem > 0 ? `<div style="font-size:10.5px;color:var(--red-text);font-weight:700;">متبقي: ${rem.toLocaleString()} ج.م</div>` : '<div style="font-size:10px;color:var(--green-text);font-weight:800;">مسدد بالكامل</div>'}
                    ` : '<div style="font-size:10.5px;color:var(--ink-secondary);">لم يسدد دفعات</div>'}
                  </td>
                  <td style="text-align:center;">
                    <select class="quo-quick-status-sel" data-quoid="${q.ID}" onclick="event.stopPropagation();" style="font-size:11px;padding:3px 6px;border-radius:12px;font-weight:800;">
                      <option value="معلق" ${(q.Status==='معلق'||!q.Status)?'selected':''}>معلق</option>
                      <option value="مقبول / جاري التنفيذ" ${(q.Status==='مقبول / جاري التنفيذ'||q.Status==='مقبول')?'selected':''}>جاري التنفيذ</option>
                      <option value="تم التنفيذ والتسليم" ${(q.Status==='تم التنفيذ والتسليم'||q.Status==='تم التنفيذ')?'selected':''}>تم التنفيذ</option>
                      <option value="ملغي / مرفوض" ${(q.Status==='ملغي / مرفوض'||q.Status==='ملغي')?'selected':''}>ملغي</option>
                    </select>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;

  const sInput = document.getElementById('quoSearchInput');
  if(sInput){
    sInput.oninput = (e)=>{ state.quoFilter.q = e.target.value; renderQuotationsList(main); };
  }
  const sFilter = document.getElementById('quoStatusFilter');
  if(sFilter){
    sFilter.onchange = (e)=>{ state.quoFilter.status = e.target.value; renderQuotationsList(main); };
  }

  document.getElementById('quoNewBtn').onclick = ()=>{
    state.cctvTab = 'quote';
    state.camTab = 'quote';
    renderCamerasApp(document.getElementById('app'));
  };
  document.getElementById('quoGotoSettingsBtn').onclick = ()=>{
    state.currentSection = 'settings'; state.settingsTab = 'warranty'; render();
  };

  main.querySelectorAll('.quo-quick-status-sel').forEach(sel => {
    sel.onchange = async (e)=>{
      const qId = sel.dataset.quoid;
      const q = state.quotations.find(x => String(x.ID) === String(qId));
      if(q){
        q.Status = e.target.value;
        await saveQuotationRemote(q);
        showToast(`تم تحديث حالة عرض السعر إلى: ${q.Status}`, 'success');
        renderQuotationsList(main);
      }
    };
  });
}

function openQuotationDetailModalById(qId){
  const q = (state.quotations || []).find(x => String(x.ID) === String(qId));
  if(!q){ showToast('تعذر العثور على عرض السعر', 'error'); return; }
  openQuotationDetailModal(q);
}

function openQuotationDetailModal(q){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  function renderModalContent(){
    if(!q.Payments) q.Payments = [];
    const total = Number(q.Total || 0);
    const paid = Number(q.PaidAmount || 0);
    const remaining = Math.max(0, total - paid);
    const items = getQuotationItems(q);

    overlay.innerHTML = `
      <div class="modal-content" style="max-width:820px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
          <div>
            <h3 style="margin:0;font-size:18px;font-weight:900;color:var(--primary);">
              ${getSvgIcon("fileText", 16)} تفاصيل وإدارة عرض السعر (#${String(q.ID).slice(-8)})
            </h3>
            <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">
              التاريخ: <span class="mono">${cleanDate(q.Date)}</span> | العميل: <b>${escapeHtml(q.ClientName)}</b> ${q.ClientPhone ? `(${escapeHtml(q.ClientPhone)})` : ''}
            </div>
          </div>
          <button class="btn btn-ghost btn-xs" id="closeQuoModalBtn">إغلاق</button>
        </div>

        <div class="card" style="padding:12px 16px;background:var(--paper2);margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <b style="font-size:13px;">حالة العرض:</b>
            <select id="modalQuoStatus" style="font-weight:800;padding:5px 10px;border-radius:var(--radius-sm);">
              <option value="معلق" ${(q.Status==='معلق'||!q.Status)?'selected':''}>معلق (قيد الانتظار)</option>
              <option value="مقبول / جاري التنفيذ" ${(q.Status==='مقبول / جاري التنفيذ'||q.Status==='مقبول')?'selected':''}>مقبول / جاري التنفيذ</option>
              <option value="تم التنفيذ والتسليم" ${(q.Status==='تم التنفيذ والتسليم'||q.Status==='تم التنفيذ')?'selected':''}>تم التنفيذ والتسليم</option>
              <option value="ملغي / مرفوض" ${(q.Status==='ملغي / مرفوض'||q.Status==='ملغي')?'selected':''}>ملغي / مرفوض</option>
            </select>
          </div>
          <div style="display:flex;gap:12px;">
            <div style="text-align:center;">
              <span style="font-size:10.5px;color:var(--ink-secondary);display:block;">إجمالي العرض</span>
              <b class="mono" style="font-size:15px;">${total.toLocaleString()} ج.م</b>
            </div>
            <div style="text-align:center;">
              <span style="font-size:10.5px;color:var(--green-text);display:block;">المحصل / العربون</span>
              <b class="mono" style="font-size:15px;color:var(--green-text);">${paid.toLocaleString()} ج.م</b>
            </div>
            <div style="text-align:center;">
              <span style="font-size:10.5px;color:var(--red-text);display:block;">المتبقي</span>
              <b class="mono" style="font-size:15px;color:${remaining>0?'var(--red-text)':'var(--green-text)'};">${remaining.toLocaleString()} ج.م</b>
            </div>
          </div>
        </div>

        <div class="card" style="padding:14px;margin-bottom:14px;">
          <h4 style="margin-top:0;margin-bottom:8px;font-size:13.5px;">${getSvgIcon("package", 14)} بنود ومهمات العرض (${items.length} بند)</h4>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>البند</th>
                  <th style="width:70px;">الكمية</th>
                  <th style="width:90px;">السعر</th>
                  <th style="width:100px;">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(it => `
                  <tr>
                    <td><b>${escapeHtml(it.name || it.Name)}</b></td>
                    <td class="mono">${it.qty || it.Qty || 1}</td>
                    <td class="mono">${Number(it.price || it.Price || 0).toLocaleString()}</td>
                    <td class="mono font-bold">${(Number(it.qty||1)*Number(it.price||0)).toLocaleString()} ج.م</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Add Payment Box -->
        <div class="card" style="padding:12px 14px;background:var(--paper3);margin-bottom:14px;">
          <h4 style="margin-top:0;margin-bottom:6px;font-size:13px;">${getSvgIcon("dollar", 14)} تحصيل دفعة / عربون لحساب الخزينة</h4>
          <div style="display:flex;gap:8px;align-items:flex-end;">
            <div class="field" style="margin-bottom:0;flex:1;"><label>المبلغ (ج.م)</label><input type="number" id="newQuoPayAmt" placeholder="${remaining>0?remaining:0}"></div>
            <div class="field" style="margin-bottom:0;flex:2;"><label>البيان / ملاحظة الدفعة</label><input id="newQuoPayNote" placeholder="عربون مقدم / دفعة توريد..."></div>
            <button class="btn btn-green btn-sm" id="addNewQuoPayBtn">${getSvgIcon("check", 14)} تسجيل الدفعة</button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;border-top:1px solid var(--line);padding-top:12px;">
          <div style="display:flex;gap:6px;">
            <button class="btn btn-outline btn-sm" id="modalPrintQuoBtn">${getSvgIcon("printer", 14)} طباعة عرض السعر (A4)</button>
            <button class="btn btn-outline btn-sm" id="modalPrintContractBtn">${getSvgIcon("fileText", 14)} طباعة العقد والاتفاقية</button>
            <button class="btn btn-primary btn-sm" id="modalConvertToProjectBtn">${getSvgIcon("cameras", 14)} تحويل لمشروع كاميرات</button>
            <button class="btn btn-ghost btn-sm" id="modalInvoiceQuoBtn">${getSvgIcon("invoices", 14)} إصدار فاتورة ضريبية</button>
          </div>
          <button class="btn btn-ghost btn-sm" id="modalCloseBottomBtn">إغلاق</button>
        </div>
      </div>
    `;

    overlay.querySelector('#closeQuoModalBtn').onclick = ()=>overlay.remove();
    overlay.querySelector('#modalCloseBottomBtn').onclick = ()=>overlay.remove();

    overlay.querySelector('#modalQuoStatus').onchange = async (e)=>{
      q.Status = e.target.value;
      await saveQuotationRemote(q);
      showToast('تم تحديث حالة عرض السعر', 'success');
      renderQuotationsList(document.getElementById('main'));
    };

    overlay.querySelector('#addNewQuoPayBtn').onclick = async ()=>{
      const amt = Number(overlay.querySelector('#newQuoPayAmt').value);
      const note = overlay.querySelector('#newQuoPayNote').value.trim();
      if(!amt || amt <= 0){ showToast('اكتب مبلغاً صحيحاً', 'error'); return; }

      try {
        await saveQuotationPaymentRemote(q.ID, amt, note);
        showToast('تم تسجيل الدفعة بنجاح', 'success');
        renderModalContent();
        renderQuotationsList(document.getElementById('main'));
      } catch(err){
        showToast('خطأ: ' + err.message, 'error');
      }
    };

    overlay.querySelector('#modalPrintQuoBtn').onclick = ()=>openQuotationPrint(q, items);
    overlay.querySelector('#modalPrintContractBtn').onclick = ()=>openQuotationAgreementPrint(q, items);
    overlay.querySelector('#modalInvoiceQuoBtn').onclick = ()=>{
      overlay.remove();
      convertQuotationToInvoice(q);
    };

    // Convert quotation to real project
    overlay.querySelector('#modalConvertToProjectBtn').onclick = ()=>{
      overlay.remove();
      const newProj = {
        ID: 'proj_' + Date.now(),
        Title: `مشروع توريد وتركيب — ${q.ClientName}`,
        Type: 'تركيب',
        ContractValue: Number(q.Total || 0),
        PaymentTerms: '50/30/20',
        Engineer: state.user ? state.user.name : '',
        StartDate: new Date().toISOString().slice(0, 10),
        TargetDate: '',
        Status: 'جاري التنفيذ',
        QuotationID: q.ID,
        Notes: q.ItemsSummary || ''
      };
      openProjectModal(newProj);
    };
  }

  document.body.appendChild(overlay);
  renderModalContent();
}

function shareQuotationWhatsapp(q){
  const phone = (q.ClientPhone||'').replace(/\D/g,'');
  if(!phone){ showToast('رقم هاتف العميل غير مسجل', 'error'); return; }
  const phoneFormatted = phone.startsWith('0') ? '2'+phone : phone;
  const shopName = (state.settings && state.settings.shopName) || 'صيانة ميكروتك';
  const total = Number(q.Total||0).toLocaleString();
  const paid = Number(q.PaidAmount||0).toLocaleString();
  const remaining = Math.max(0, Number(q.Total||0) - Number(q.PaidAmount||0)).toLocaleString();

  const msg = `مرحبًا ${q.ClientName || 'عميلنا العزيز'}\nيسعدنا تقديم عرض سعر مشروع الكاميرات والشبكات من *${shopName}*\n\nرقم العرض: *#${String(q.ID).slice(-8)}*\nملخص البنود: ${q.ItemsSummary || ''}\nالإجمالي المطلوب: *${total} ج.م*\n${Number(q.PaidAmount||0)>0 ? `المسدد: ${paid} ج.م | المتبقي: ${remaining} ج.م\n` : ''}\nنسعد دائماً بخدمتكم والتواصل معكم عبر واتساب أو بالاتصال بنا.`;

  window.open(`https://wa.me/${phoneFormatted}?text=${encodeURIComponent(msg)}`, '_blank');
}

function convertQuotationToInvoice(q){
  const items = getQuotationItems(q).map(it => ({
    Name: it.name || it.Name,
    Qty: Number(it.qty || it.Qty || 1),
    Price: Number(it.price || it.Price || 0),
    Total: Number(it.qty || it.Qty || 1) * Number(it.price || it.Price || 0)
  }));

  const newInv = {
    ID: 'inv_' + Date.now(),
    InvoiceNumber: (typeof nextInvoiceNumber === 'function') ? nextInvoiceNumber() : ('INV-' + new Date().getFullYear() + '-0001'),
    Date: new Date().toISOString().slice(0,10),
    DueDate: new Date().toISOString().slice(0,10),
    CustomerName: q.ClientName || 'عميل',
    CustomerPhone: q.ClientPhone || '',
    CustomerTaxNumber: '',
    CustomerAddress: '',
    Items: items.length ? items : [{ Name: 'توريدات ومهمات شبكات وكاميرات', Qty: 1, Price: Number(q.Total||0), Total: Number(q.Total||0) }],
    Subtotal: Number(q.Total || 0),
    TaxPercent: 0,
    TaxAmount: 0,
    Discount: 0,
    Total: Number(q.Total || 0),
    AmountPaid: Number(q.PaidAmount || 0),
    Remaining: Math.max(0, Number(q.Total || 0) - Number(q.PaidAmount || 0)),
    Status: (Number(q.PaidAmount||0) >= Number(q.Total||0)) ? 'مدفوعة بالكامل' : (Number(q.PaidAmount||0) > 0 ? 'مدفوعة جزئياً' : 'غير مدفوعة (آجلة)'),
    PaymentMethod: 'نقدي',
    ReferenceType: 'عرض سعر',
    ReferenceID: String(q.ID).slice(-8),
    AccountCode: '4103', // Route to camera & system installation revenue 4103
    Notes: `فاتورة صادرة عن عرض سعر رقم (${String(q.ID).slice(-8)})`
  };

  openInvoiceModal(newInv, false);
}

/* ---------------- 8. Print Engines for Quotations & Legal Contracts ---------------- */

function openQuotationPrint(q, cartItems){
  const old = document.getElementById('printMount');
  if(old) old.remove();

  const items = cartItems || getQuotationItems(q);
  const shopName = (state.settings && state.settings.shopName) || 'صيانة ميكروتك';
  const logoUrl = state.settings && state.settings.logoUrl;
  const shopPhone = (state.settings && state.settings.shopPhone) || '';
  const shopAddress = (state.settings && state.settings.shopAddress) || '';
  const shopTaxNumber = (state.settings && state.settings.shopTaxNumber) || '';
  const quoteTerms = getQuoteTerms();
  const quoteId = String(q.ID||'').slice(-8);

  const total = Number(q.Total || 0);
  const paid = Number(q.PaidAmount || 0);
  const remaining = Math.max(0, total - paid);

  const mount = document.createElement('div');
  mount.id = 'printMount';

  let styleEl = document.getElementById('dynamicQuotationPrintStyle');
  if(!styleEl){
    styleEl = document.createElement('style');
    styleEl.id = 'dynamicQuotationPrintStyle';
    document.head.appendChild(styleEl);
  }

  styleEl.innerHTML = `
    @media print {
      @page { size: A4 portrait !important; margin: 10mm 12mm !important; }
      html, body {
        background: #ffffff !important; color: #000000 !important; width: 100% !important; margin: 0 !important; padding: 0 !important;
        -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
      }
      body.printing-quotation-doc #app, body.printing-quotation-doc .sidebar, body.printing-quotation-doc .top-header,
      body.printing-quotation-doc #toastContainer, body.printing-quotation-doc .modal-overlay { display: none !important; }
      body.printing-quotation-doc #printMount { display: block !important; width: 100% !important; background: #ffffff !important; }
      .quo-print-page { font-family: 'Segoe UI', Tahoma, Arial, sans-serif !important; direction: rtl !important; text-align: right !important; padding: 4mm 2mm !important; }
      .quo-print-page table { width: 100% !important; border-collapse: collapse !important; }
      .quo-print-page th, .quo-print-page td { border: 1px solid #000000 !important; padding: 5px 8px !important; }
    }
  `;

  mount.innerHTML = `
    <div class="quo-print-page" style="background:#fff;color:#000;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;text-align:right;max-width:210mm;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2.5px solid #000;padding-bottom:8px;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:12px;">
          ${logoUrl ? `<img src="${logoUrl}" style="max-height:48px;max-width:140px;object-fit:contain;">` : ''}
          <div>
            <h2 style="margin:0;font-size:20px;font-weight:900;">${escapeHtml(shopName)}</h2>
            <div style="font-size:11.5px;font-weight:700;margin-top:2px;">
              ${shopPhone ? `الهاتف: <span class="mono">${escapeHtml(shopPhone)}</span> ` : ''}
              ${shopAddress ? `| ${escapeHtml(shopAddress)} ` : ''}
              ${shopTaxNumber ? `| س.ت / ضريبي: <span class="mono">${escapeHtml(shopTaxNumber)}</span>` : ''}
            </div>
          </div>
        </div>
        <div style="text-align:left;">
          <div style="display:inline-block;border:2px solid #000;padding:4px 12px;border-radius:6px;font-weight:900;font-size:14px;background:#f5f5f5;">
            عرض أسعار رسمي (Quotation)
          </div>
          <div style="font-size:12px;font-weight:800;margin-top:4px;">
            رقم العرض: <span class="mono font-bold" style="font-size:14px;">#${quoteId}</span>
          </div>
          <div style="font-size:11px;font-weight:700;color:#333;" class="mono">${cleanDate(q.Date)}</div>
        </div>
      </div>

      <div style="border:1.5px solid #000;border-radius:6px;padding:8px 12px;margin-bottom:12px;background:#fafafa;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <div>
          <span style="font-size:11.5px;font-weight:700;color:#555;">السادة / العميل:</span>
          <b style="font-size:14px;display:inline-block;margin-right:6px;">${escapeHtml(q.ClientName)}</b>
        </div>
        ${q.ClientPhone ? `<div><span style="font-size:11.5px;font-weight:700;color:#555;">رقم الهاتف:</span> <b style="font-size:13.5px;" class="mono">${escapeHtml(q.ClientPhone)}</b></div>` : ''}
        <div><span style="font-size:11.5px;font-weight:700;color:#555;">صلاحية العرض:</span> <b style="font-size:12px;">14 يوماً من تاريخه</b></div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:12px;">
        <thead>
          <tr style="background:#000;color:#fff;">
            <th style="padding:6px;border:1px solid #000;text-align:center;width:30px;">#</th>
            <th style="padding:6px;border:1px solid #000;text-align:right;">البند والمواصفات الفنية</th>
            <th style="padding:6px;border:1px solid #000;text-align:center;width:60px;">النوع</th>
            <th style="padding:6px;border:1px solid #000;text-align:center;width:45px;">الكمية</th>
            <th style="padding:6px;border:1px solid #000;text-align:center;width:80px;">السعر الفردي</th>
            <th style="padding:6px;border:1px solid #000;text-align:left;width:95px;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((it, idx) => `
            <tr>
              <td style="padding:5px;border:1px solid #000;text-align:center;" class="mono">${idx+1}</td>
              <td style="padding:5px;border:1px solid #000;font-weight:700;">${escapeHtml(it.name || it.Name)}</td>
              <td style="padding:5px;border:1px solid #000;text-align:center;font-size:11px;">${it.type==='service'?'خدمة / تركيب':'توريد مهمات'}</td>
              <td style="padding:5px;border:1px solid #000;text-align:center;font-weight:900;" class="mono">${it.qty || it.Qty || 1}</td>
              <td style="padding:5px;border:1px solid #000;text-align:center;" class="mono">${Number(it.price || it.Price || 0).toLocaleString()}</td>
              <td style="padding:5px;border:1px solid #000;text-align:left;font-weight:900;" class="mono">${(Number(it.qty||1)*Number(it.price||0)).toLocaleString()} ج.م</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:12px;">
        <div style="flex:1;border:1.5px solid #000;border-radius:6px;padding:8px 10px;font-size:11.5px;line-height:1.6;background:#fcfcfc;">
          <b style="display:block;margin-bottom:2px;font-size:12px;">شروط وأحكام العرض:</b>
          <div style="white-space:pre-line;color:#222;">${escapeHtml(quoteTerms)}</div>
        </div>

        <div style="width:240px;border:1.5px solid #000;border-radius:6px;padding:8px 10px;font-size:12.5px;font-weight:800;background:#fafafa;">
          <div style="display:flex;justify-content:space-between;border-bottom:1.5px solid #000;padding-bottom:4px;margin-bottom:4px;">
            <span style="font-size:13.5px;font-weight:900;">الإجمالي المطلوب:</span>
            <span class="mono font-bold" style="font-size:15px;">${total.toLocaleString()} ج.م</span>
          </div>
          ${paid > 0 ? `
            <div style="display:flex;justify-content:space-between;color:green;margin-bottom:2px;">
              <span>المسدد (عربون / دفعات):</span>
              <span class="mono">${paid.toLocaleString()} ج.م</span>
            </div>
            <div style="display:flex;justify-content:space-between;color:red;border-top:1px dashed #000;padding-top:2px;">
              <span>المتبقي عند التنفيذ:</span>
              <span class="mono">${remaining.toLocaleString()} ج.م</span>
            </div>
          ` : ''}
        </div>
      </div>

      <div style="border-top:1.5px dashed #000;padding-top:8px;margin-top:10px;display:flex;justify-content:space-between;font-size:12px;font-weight:800;">
        <div style="text-align:center;width:200px;">
          <div>موافقة واعتماد العميل</div>
          <div style="height:35px;"></div>
          <div style="border-top:1px solid #000;padding-top:2px;">الاسم والتوقيع: .....................</div>
        </div>
        <div style="text-align:center;width:200px;">
          <div>المسؤول المعتمد / خاتم الشركة</div>
          <div style="height:35px;"></div>
          <div style="border-top:1px solid #000;padding-top:2px;">${escapeHtml(state.user ? state.user.name : shopName)}</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(mount);
  document.body.classList.add('printing-quotation-doc');

  setTimeout(()=>{
    window.print();
    setTimeout(()=>{
      mount.remove();
      document.body.classList.remove('printing-quotation-doc');
    }, 500);
  }, 200);
}

function openQuotationAgreementPrint(q, cartItems){
  const old = document.getElementById('printMount');
  if(old) old.remove();

  const items = cartItems || getQuotationItems(q);
  const shopName = (state.settings && state.settings.shopName) || 'صيانة ميكروتك';
  const logoUrl = state.settings && state.settings.logoUrl;
  const shopPhone = (state.settings && state.settings.shopPhone) || '';
  const shopAddress = (state.settings && state.settings.shopAddress) || '';
  const shopTaxNumber = (state.settings && state.settings.shopTaxNumber) || '';
  const agreementTerms = getQuoteAgreementTerms();
  const quoteId = String(q.ID||'').slice(-8);

  const total = Number(q.Total || 0);
  const paid = Number(q.PaidAmount || 0);
  const remaining = Math.max(0, total - paid);

  const mount = document.createElement('div');
  mount.id = 'printMount';

  let styleEl = document.getElementById('dynamicQuotationPrintStyle');
  if(!styleEl){
    styleEl = document.createElement('style');
    styleEl.id = 'dynamicQuotationPrintStyle';
    document.head.appendChild(styleEl);
  }

  styleEl.innerHTML = `
    @media print {
      @page { size: A4 portrait !important; margin: 8mm 10mm !important; }
      html, body {
        background: #ffffff !important; color: #000000 !important; width: 100% !important; margin: 0 !important; padding: 0 !important;
        -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
      }
      body.printing-quotation-doc #app, body.printing-quotation-doc .sidebar, body.printing-quotation-doc .top-header,
      body.printing-quotation-doc #toastContainer, body.printing-quotation-doc .modal-overlay { display: none !important; }
      body.printing-quotation-doc #printMount { display: block !important; width: 100% !important; background: #ffffff !important; }
      .contract-print-page { font-family: 'Segoe UI', Tahoma, Arial, sans-serif !important; direction: rtl !important; text-align: right !important; padding: 2mm !important; }
    }
  `;

  mount.innerHTML = `
    <div class="contract-print-page" style="background:#fff;color:#000;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;text-align:right;max-width:210mm;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:10px;">
          ${logoUrl ? `<img src="${logoUrl}" style="max-height:40px;max-width:130px;object-fit:contain;">` : ''}
          <div>
            <h2 style="margin:0;font-size:18px;font-weight:900;">${escapeHtml(shopName)}</h2>
            <div style="font-size:11px;font-weight:700;">
              ${shopPhone ? `هاتف: <span class="mono">${escapeHtml(shopPhone)}</span> ` : ''}
              ${shopAddress ? `| ${escapeHtml(shopAddress)} ` : ''}
            </div>
          </div>
        </div>
        <div style="text-align:left;">
          <div style="font-size:12px;font-weight:800;">رقم الاتفاق / العرض: <span class="mono">#${quoteId}</span></div>
          <div style="font-size:11px;font-weight:700;" class="mono">${cleanDate(q.Date)}</div>
        </div>
      </div>

      <div style="text-align:center;border:2px solid #000;border-radius:6px;padding:6px;margin-bottom:8px;background:#f5f5f5;">
        <h3 style="margin:0;font-size:15px;font-weight:900;">عقد اتفاق وتوريد وتركيب وتشغيل منظومات شبكات ومراقبة</h3>
      </div>

      <div style="border:1.5px solid #000;border-radius:6px;padding:8px 10px;margin-bottom:8px;font-size:12px;line-height:1.5;background:#fafafa;">
        <div style="margin-bottom:3px;">
          <b>• الطرف الأول (المنفذ والمورد):</b> ${escapeHtml(shopName)} ${shopTaxNumber ? `(س.ت / ضريبي: ${escapeHtml(shopTaxNumber)})` : ''} — هاتف: ${escapeHtml(shopPhone)}
        </div>
        <div>
          <b>• الطرف الثاني (العميل / المستفيد):</b> ${escapeHtml(q.ClientName)} — هاتف: <span class="mono font-bold">${escapeHtml(q.ClientPhone||'-')}</span>
        </div>
      </div>

      <div style="margin-bottom:8px;">
        <b style="font-size:12px;display:block;margin-bottom:3px;">جدول حصر الأعمال والمهمات المتفق على توريدها وتركيبها:</b>
        <table style="width:100%;border-collapse:collapse;font-size:11.5px;">
          <thead>
            <tr style="background:#000;color:#fff;">
              <th style="padding:4px;border:1px solid #000;text-align:center;width:25px;">#</th>
              <th style="padding:4px;border:1px solid #000;text-align:right;">بيان البند والخدمة</th>
              <th style="padding:4px;border:1px solid #000;text-align:center;width:45px;">الكمية</th>
              <th style="padding:4px;border:1px solid #000;text-align:center;width:75px;">السعر الفردي</th>
              <th style="padding:4px;border:1px solid #000;text-align:left;width:85px;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((it, idx) => `
              <tr>
                <td style="padding:4px;border:1px solid #000;text-align:center;" class="mono">${idx+1}</td>
                <td style="padding:4px;border:1px solid #000;font-weight:700;">${escapeHtml(it.name || it.Name)}</td>
                <td style="padding:4px;border:1px solid #000;text-align:center;font-weight:900;" class="mono">${it.qty || it.Qty || 1}</td>
                <td style="padding:4px;border:1px solid #000;text-align:center;" class="mono">${Number(it.price || it.Price || 0).toLocaleString()}</td>
                <td style="padding:4px;border:1px solid #000;text-align:left;font-weight:900;" class="mono">${(Number(it.qty||1)*Number(it.price||0)).toLocaleString()} ج.م</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="border:1.5px solid #000;border-radius:6px;padding:6px 10px;margin-bottom:8px;background:#fafafa;display:flex;justify-content:space-between;align-items:center;font-size:12px;">
        <div><b>إجمالي القيمة التعاقدية:</b> <span class="mono font-bold" style="font-size:14px;">${total.toLocaleString()} ج.م</span></div>
        <div><b>المسدد (عربون مقدم):</b> <span class="mono font-bold" style="color:green;font-size:13px;">${paid.toLocaleString()} ج.م</span></div>
        <div><b>المتبقي المستحق:</b> <span class="mono font-bold" style="color:red;font-size:13px;">${remaining.toLocaleString()} ج.م</span></div>
      </div>

      <div style="border:1.5px solid #000;border-radius:6px;padding:8px 10px;margin-bottom:10px;font-size:11.5px;line-height:1.65;background:#fcfcfc;">
        <b style="display:block;margin-bottom:4px;font-size:12px;">الشروط والبنود القانونية المنظمة للاتفاق:</b>
        <div style="white-space:pre-line;color:#111;">${escapeHtml(agreementTerms)}</div>
      </div>

      <div style="border-top:1.5px solid #000;padding-top:6px;display:flex;justify-content:space-between;font-size:12px;font-weight:800;">
        <div style="text-align:center;width:220px;">
          <div>الطرف الأول (المنفذ والمورد)</div>
          <div style="font-size:11px;color:#555;margin-top:2px;">${escapeHtml(shopName)}</div>
          <div style="height:35px;"></div>
          <div style="border-top:1px solid #000;padding-top:2px;">التوقيع والختم: .....................</div>
        </div>
        <div style="text-align:center;width:220px;">
          <div>الطرف الثاني (العميل المستفيد)</div>
          <div style="font-size:11px;color:#555;margin-top:2px;">${escapeHtml(q.ClientName)}</div>
          <div style="height:35px;"></div>
          <div style="border-top:1px solid #000;padding-top:2px;">التوقيع ورقم الهوية: .....................</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(mount);
  document.body.classList.add('printing-quotation-doc');

  setTimeout(()=>{
    window.print();
    setTimeout(()=>{
      mount.remove();
      document.body.classList.remove('printing-quotation-doc');
    }, 500);
  }, 200);
}
