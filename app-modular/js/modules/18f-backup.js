/* ============================================================
   U4: Full System Backup, Automated Drive Snapshots & Restore Engine
   ============================================================ */

function downloadJsonFile(filename, dataObj){
  const jsonStr = JSON.stringify(dataObj, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
}

function createLocalBackupPayload(){
  const dateStr = new Date().toISOString();
  return {
    appName: 'microERP',
    appVersion: '1.0.0',
    schemaVersion: 10,
    timestamp: dateStr,
    exportedBy: (state.user ? state.user.name : 'admin') + ' (محلي)',
    sheetCounts: {
      Receipts: (state.receipts || []).length,
      Invoices: (state.invoices || []).length,
      Customers: (state.customers || []).length,
      Inventory: (state.inventory || []).length,
      Sales: (state.sales || []).length,
      Expenses: (state.expenses || []).length,
      JournalEntries: (state.journalEntries || []).length,
      Accounts: (state.accounts || []).length,
      Purchases: (state.purchases || []).length,
      Suppliers: (state.suppliers || []).length,
      Quotations: (state.quotations || []).length,
      Sites: (state.cctvSites || []).length,
      Projects: (state.cctvProjects || []).length,
      ProjectDevices: (state.cctvDevices || []).length,
      ServiceVisits: (state.cctvVisits || []).length,
      MaintenanceContracts: (state.cctvContracts || []).length,
      ProjectMilestones: (state.cctvMilestones || []).length
    },
    sheets: {
      Receipts: state.receipts || [],
      Invoices: state.invoices || [],
      Customers: state.customers || [],
      Inventory: state.inventory || [],
      Sales: state.sales || [],
      Expenses: state.expenses || [],
      JournalEntries: state.journalEntries || [],
      Accounts: state.accounts || [],
      Purchases: state.purchases || [],
      Suppliers: state.suppliers || [],
      Quotations: state.quotations || [],
      Sites: state.cctvSites || [],
      Projects: state.cctvProjects || [],
      ProjectDevices: state.cctvDevices || [],
      ServiceVisits: state.cctvVisits || [],
      MaintenanceContracts: state.cctvContracts || [],
      ProjectMilestones: state.cctvMilestones || []
    }
  };
}

function exportSheetToCSV(sheetKey){
  const dateStr = new Date().toISOString().slice(0, 10);
  let filename = '';
  let headers = [];
  let rows = [];

  switch(sheetKey){
    case 'receipts': {
      filename = `Receipts_${dateStr}.csv`;
      headers = ['رقم الإيصال', 'التاريخ', 'اسم العميل', 'الهاتف', 'نوع الجهاز', 'الماركة', 'الموديل', 'الأعطال', 'التكلفة', 'الدفعة', 'المتبقي', 'الحالة', 'الفني', 'شهور الضمان', 'انتهاء الضمان'];
      rows = (state.receipts || []).map(r => [
        r.receiptNumber || r.ReceiptNumber || '',
        r.date || r.Date || '',
        r.customerName || r.CustomerName || '',
        r.customerPhone || r.CustomerPhone || '',
        r.category || r.Category || '',
        r.brand || r.Brand || '',
        r.model || r.Model || '',
        Array.isArray(r.faults) ? r.faults.join(' - ') : (r.faults || r.Faults || ''),
        r.cost || r.Cost || 0,
        r.deposit || r.Deposit || 0,
        (Number(r.cost || r.Cost || 0) - Number(r.deposit || r.Deposit || 0) + Number(r.refunded || r.Refunded || 0)),
        r.status || r.Status || '',
        r.technician || r.Technician || '',
        r.warrantyMonths || r.WarrantyMonths || '',
        r.warrantyEnd || r.WarrantyEnd || ''
      ]);
      break;
    }
    case 'invoices': {
      filename = `Invoices_${dateStr}.csv`;
      headers = ['رقم الفاتورة', 'النوع', 'التاريخ', 'تاريخ الاستحقاق', 'اسم العميل', 'الهاتف', 'المبلغ قبل الضريبة', 'الضريبة', 'الإجمالي', 'المدفوع', 'المتبقي', 'طريقة الدفع', 'الحالة'];
      rows = (state.invoices || []).map(inv => [
        inv.InvoiceNumber || inv.id || '',
        inv.Type || 'فاتورة ضريبية',
        inv.Date || '',
        inv.DueDate || '',
        inv.CustomerName || '',
        inv.CustomerPhone || '',
        inv.Subtotal || 0,
        inv.TaxAmount || 0,
        inv.Total || 0,
        inv.AmountPaid || 0,
        inv.Remaining || 0,
        inv.PaymentMethod || '',
        inv.Status || ''
      ]);
      break;
    }
    case 'customers': {
      filename = `Customers_${dateStr}.csv`;
      headers = ['اسم العميل', 'الهاتف', 'البريد الإلكتروني', 'العنوان', 'الرقم الضريبي', 'المديونية', 'ملاحظات'];
      rows = (state.customers || []).map(c => [
        c.Name || c.name || '',
        c.Phone || c.phone || '',
        c.Email || c.email || '',
        c.Address || c.address || '',
        c.TaxNumber || c.taxNumber || '',
        c.Debt || c.debt || 0,
        c.Notes || c.notes || ''
      ]);
      break;
    }
    case 'inventory': {
      filename = `Inventory_${dateStr}.csv`;
      headers = ['الباركود', 'اسم الصنف', 'التصنيف', 'الكمية', 'سعر الشراء', 'سعر البيع', 'سعر الجملة', 'الموقع'];
      rows = (state.inventory || []).map(item => [
        item.Barcode || item.barcode || '',
        item.Name || item.name || '',
        item.Category || item.category || '',
        item.Quantity != null ? item.Quantity : (item.quantity != null ? item.quantity : 0),
        item.PurchasePrice || item.purchasePrice || 0,
        item.SellPrice || item.sellPrice || 0,
        item.WholesalePrice || item.wholesalePrice || 0,
        item.ShelfLocation || item.shelfLocation || ''
      ]);
      break;
    }
    case 'sales': {
      filename = `Sales_${dateStr}.csv`;
      headers = ['رقم الحركة', 'التاريخ', 'العميل', 'الهاتف', 'الأصناف', 'الإجمالي', 'طريقة الدفع', 'المدفوع', 'المسؤول'];
      rows = (state.sales || []).map(s => [
        s.ID || s.id || '',
        s.Date || s.date || '',
        s.CustomerName || s.customerName || '',
        s.CustomerPhone || s.customerPhone || '',
        s.ItemsSummary || s.itemsSummary || '',
        s.Total || s.total || 0,
        s.PaymentMethod || s.paymentMethod || '',
        s.AmountPaid || s.amountPaid || 0,
        s.By || s.by || ''
      ]);
      break;
    }
    case 'returns': {
      filename = `Sales_Returns_${dateStr}.csv`;
      headers = ['رقم الإشعار', 'رقم الفاتورة الأصلية', 'التاريخ', 'الأصناف المسترجعة', 'مبلغ الاسترداد', 'طريقة الاسترداد', 'المسؤول'];
      const returns = getCache('returns', []);
      rows = returns.map(ret => [
        ret.CreditNoteNumber || ret.ID || '',
        ret.SaleID || '',
        ret.Date || '',
        ret.ItemsSummary || '',
        ret.RefundAmount || 0,
        ret.RefundMethod || '',
        ret.By || ''
      ]);
      break;
    }
    case 'expenses': {
      filename = `Expenses_${dateStr}.csv`;
      headers = ['رقم السند', 'التاريخ', 'التصنيف', 'البيان', 'المبلغ', 'طريقة الدفع', 'المورد/المستفيد', 'كود الحساب', 'المسؤول'];
      rows = (state.expenses || []).map(e => [
        e.ID || e.id || '',
        e.Date || e.date || '',
        e.Category || e.category || '',
        e.Title || e.title || '',
        e.Amount || e.amount || 0,
        e.PaymentMethod || e.paymentMethod || '',
        e.Supplier || e.supplier || '',
        e.AccountCode || e.accountCode || '',
        e.By || e.by || ''
      ]);
      break;
    }
    case 'journal': {
      filename = `JournalEntries_${dateStr}.csv`;
      headers = ['رقم القيد', 'التاريخ', 'البيان', 'نوع المرجع', 'رقم المرجع', 'إجمالي المدين', 'إجمالي الدائن', 'المسؤول'];
      rows = (state.journalEntries || []).map(j => [
        j.EntryNumber || j.ID || '',
        j.Date || '',
        j.Description || '',
        j.ReferenceType || '',
        j.ReferenceID || '',
        j.TotalDebit || 0,
        j.TotalCredit || 0,
        j.By || ''
      ]);
      break;
    }
    case 'accounts': {
      filename = `Chart_Of_Accounts_${dateStr}.csv`;
      headers = ['كود الحساب', 'اسم الحساب', 'النوع', 'طبيعة الحساب', 'الحساب الرئيسي', 'الرصيد'];
      rows = (state.accounts || []).map(a => [
        a.Code || '',
        a.Name || '',
        a.Type || '',
        a.Nature || '',
        a.ParentCode || '',
        a.Balance || 0
      ]);
      break;
    }
    case 'purchases': {
      filename = `Purchases_${dateStr}.csv`;
      headers = ['رقم الفاتورة', 'التاريخ', 'المورد', 'الأصناف', 'الإجمالي', 'المدفوع', 'شهور الضمان', 'المسؤول'];
      rows = (state.purchases || []).map(p => [
        p.ID || p.id || '',
        p.Date || p.date || '',
        p.Supplier || p.supplier || '',
        p.ItemsSummary || p.itemsSummary || '',
        p.Total || p.total || 0,
        p.AmountPaid || p.amountPaid || 0,
        p.WarrantyMonths || p.warrantyMonths || '',
        p.By || p.by || ''
      ]);
      break;
    }
    case 'suppliers': {
      filename = `Suppliers_${dateStr}.csv`;
      headers = ['اسم المورد', 'الهاتف', 'المديونية', 'ملاحظات'];
      rows = (state.suppliers || []).map(sup => [
        sup.Name || sup.name || '',
        sup.Phone || sup.phone || '',
        sup.Debt || sup.debt || 0,
        sup.Notes || sup.notes || ''
      ]);
      break;
    }
    case 'quotations': {
      filename = `Quotations_${dateStr}.csv`;
      headers = ['رقم العرض', 'التاريخ', 'العميل', 'الهاتف', 'ملخص الأصناف', 'تكلفة التركيب', 'الإجمالي', 'الحالة', 'المسؤول'];
      rows = (state.quotations || []).map(q => [
        q.ID || q.id || '',
        q.Date || q.date || '',
        q.ClientName || q.clientName || '',
        q.ClientPhone || q.clientPhone || '',
        q.ItemsSummary || q.itemsSummary || '',
        q.LaborCost || q.laborCost || 0,
        q.Total || q.total || 0,
        q.Status || q.status || '',
        q.By || q.by || ''
      ]);
      break;
    }
    case 'cctv_projects': {
      filename = `CCTV_Projects_${dateStr}.csv`;
      headers = ['رقم المشروع', 'عنوان المشروع', 'الموقع', 'النوع', 'قيمة العقد', 'تاريخ البدء', 'المهندس', 'الحالة'];
      rows = (state.cctvProjects || []).map(proj => [
        proj.ID || '',
        proj.Title || '',
        proj.SiteID || '',
        proj.Type || '',
        proj.ContractValue || 0,
        proj.StartDate || '',
        proj.Engineer || '',
        proj.Status || ''
      ]);
      break;
    }
    case 'cctv_contracts': {
      filename = `Maintenance_Contracts_${dateStr}.csv`;
      headers = ['رقم العقد', 'المشروع', 'الموقع', 'تاريخ البدء', 'تاريخ الانتهاء', 'القيمة السنوية', 'دورية الزيارات', 'الحالة'];
      rows = (state.cctvContracts || []).map(c => [
        c.ID || '',
        c.ProjectID || '',
        c.SiteID || '',
        c.StartDate || '',
        c.EndDate || '',
        c.AnnualValue || 0,
        c.VisitFrequency || '',
        c.Status || ''
      ]);
      break;
    }
    case 'audit_log': {
      filename = `Audit_Logs_${dateStr}.csv`;
      headers = ['التاريخ والوقت', 'المستخدم', 'الإجراء', 'المرجع', 'التفاصيل'];
      const logs = (state.auditLogs && state.auditLogs.length) ? state.auditLogs : getCache('audit_logs', []);
      rows = logs.map(l => [
        l.Timestamp || l.timestamp || '',
        l.User || l.user || '',
        l.Action || l.action || '',
        l.ReceiptID || l.ReceiptNumber || l.refId || '',
        typeof l.Details === 'object' ? JSON.stringify(l.Details) : (l.Details || l.details || '')
      ]);
      break;
    }
    default:
      showToast('جدول غير معروف للتصدير', 'error');
      return;
  }

  if (!rows.length) {
    showToast('لا توجد بيانات متاحة في هذا الجدول للتصدير', 'warning');
    return;
  }

  downloadCSV(filename, headers, rows);
}

async function exportAllSheetsCSV(){
  const sheets = [
    'receipts', 'invoices', 'customers', 'inventory', 'sales',
    'expenses', 'journal', 'accounts', 'purchases', 'suppliers',
    'quotations', 'cctv_projects', 'cctv_contracts', 'audit_log'
  ];
  showToast('جاري تصدير كافة الجداول كملفات CSV...', 'info');
  for (let i = 0; i < sheets.length; i++) {
    exportSheetToCSV(sheets[i]);
    await new Promise(r => setTimeout(r, 250));
  }
}

function openRestoreConfirmationModal(backupData){
  const existingModal = document.getElementById('restoreConfirmModalOverlay');
  if(existingModal) existingModal.remove();

  const overlay = document.createElement('div');
  overlay.id = 'restoreConfirmModalOverlay';
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'z-index: 10060; display:flex; align-items:center; justify-content:center; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(4px);';

  const modal = document.createElement('div');
  modal.className = 'modal-card';
  modal.style.cssText = 'max-width: 680px; width: 95%; max-height: 90vh; background: var(--bg-card, #fff); border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4); overflow: hidden; display: flex; flex-direction: column; border: 2px solid var(--red, #ef4444);';

  const sheets = backupData.sheets || {};
  const sheetEntries = Object.keys(sheets).map(k => ({
    name: k,
    count: Array.isArray(sheets[k]) ? sheets[k].length : 0
  })).filter(s => s.count > 0);

  const totalRecords = sheetEntries.reduce((acc, s) => acc + s.count, 0);

  modal.innerHTML = `
    <div style="padding: 16px 22px; background: linear-gradient(135deg, #b91c1c, #991b1b); color: #fff; display: flex; align-items: center; justify-content: space-between;">
      <div style="display:flex; align-items:center; gap: 12px;">
        <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(255, 255, 255, 0.2); display:flex; align-items:center; justify-content:center;">${getSvgIcon("alert", 22)}</div>
        <div>
          <h3 style="margin: 0; font-size: 16px; font-weight: 900; color: #fff;">تأكيد استعادة النسخة الاحتياطية للنظام</h3>
          <div style="font-size: 11.5px; color: rgba(255,255,255,0.85); margin-top: 2px;">استبدال ومزامنة جداول النظام بالنسخة المختارة</div>
        </div>
      </div>
      <button id="closeRestoreModalBtn" style="background: rgba(255,255,255,0.15); border: none; color: #fff; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center;" aria-label="إغلاق">&times;</button>
    </div>

    <div style="padding: 20px 24px; overflow-y: auto; max-height: calc(90vh - 140px);">
      <!-- Metadata summary -->
      <div style="background: var(--paper2); border: 1px solid var(--line); border-radius: var(--radius); padding: 14px 16px; margin-bottom: 16px;">
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; font-size: 12.5px;">
          <div><span style="color:var(--ink-secondary);">تاريخ النسخة:</span> <b class="mono" style="margin-right:6px;">${escapeHtml(backupData.timestamp ? backupData.timestamp.slice(0,19).replace('T',' ') : 'غير محدد')}</b></div>
          <div><span style="color:var(--ink-secondary);">تم التصدير بواسطة:</span> <b style="margin-right:6px;">${escapeHtml(backupData.exportedBy || 'admin')}</b></div>
          <div><span style="color:var(--ink-secondary);">إصدار المخطط:</span> <b class="mono" style="margin-right:6px;">v${backupData.schemaVersion || 1}</b></div>
          <div><span style="color:var(--ink-secondary);">إجمالي السجلات:</span> <b class="mono" style="margin-right:6px; color:var(--primary); font-size:14px;">${totalRecords}</b></div>
        </div>
      </div>

      <!-- Sheet counts grid -->
      <h4 style="margin: 0 0 10px 0; font-size: 13.5px; font-weight: 800;">محتويات النسخة الاحتياطية (${sheetEntries.length} جدول):</h4>
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; margin-bottom: 20px;">
        ${sheetEntries.map(s => `
          <div style="background:var(--paper3); border:1px solid var(--line); border-radius:6px; padding:8px 10px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:12px; font-weight:600;">${s.name}</span>
            <span class="status-badge st-done mono" style="font-size:11px;">${s.count}</span>
          </div>
        `).join('')}
      </div>

      <!-- Warning Callout -->
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-right: 4px solid #ef4444; border-radius: 8px; padding: 14px 16px; color: #991b1b; margin-bottom: 20px;">
        <div style="font-weight: 800; font-size: 13px; margin-bottom: 6px;">⚠️ تنبيه عالي الخطورة:</div>
        <p style="font-size: 12px; line-height: 1.6; margin: 0;">
          استعادة هذه النسخة ستقوم باستبدال كافة البيانات الحالية في Google Sheets بالبيانات الموجودة في هذا الملف.
          (يقوم النظام تلقائياً بأخذ لقطة سريعة في Google Drive لحماية البيانات قبل التغيير).
        </p>
      </div>

      <!-- Confirmation input -->
      <div class="field" style="margin-bottom: 10px;">
        <label style="font-weight: 800; font-size: 13px; display: block; margin-bottom: 6px;">
          لتأكيد الاستعادة، يرجى كتابة كلمة <span style="color: #b91c1c; font-weight: 900;">استعادة</span> في الحقل أدناه:
        </label>
        <input type="text" id="restoreConfirmTextInput" placeholder="اكتب: استعادة" style="width: 100%; padding: 10px 14px; border: 2px solid var(--line); border-radius: var(--radius); font-size: 14px;">
      </div>
    </div>

    <div style="padding: 14px 24px; background: var(--paper2); border-top: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center;">
      <button class="btn btn-ghost" id="cancelRestoreBtn">إلغاء الأمر</button>
      <button class="btn btn-danger" id="executeRestoreBtn" disabled style="opacity: 0.5; cursor: not-allowed; min-width: 190px;">
        ${getSvgIcon("download", 14)} تأكيد وبدء الاستعادة
      </button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const closeFn = () => overlay.remove();
  overlay.querySelector('#closeRestoreModalBtn').onclick = closeFn;
  overlay.querySelector('#cancelRestoreBtn').onclick = closeFn;

  const input = modal.querySelector('#restoreConfirmTextInput');
  const execBtn = modal.querySelector('#executeRestoreBtn');

  input.oninput = () => {
    const val = input.value.trim().toLowerCase();
    const isConfirmed = (val === 'استعادة' || val === 'restore');
    execBtn.disabled = !isConfirmed;
    execBtn.style.opacity = isConfirmed ? '1' : '0.5';
    execBtn.style.cursor = isConfirmed ? 'pointer' : 'not-allowed';
  };

  execBtn.onclick = async () => {
    execBtn.disabled = true;
    execBtn.innerHTML = 'جاري استعادة البيانات على السيرفر...';
    showToast('جاري رفع واستعادة كافة جداول النظام على السيرفر...', 'info', 20000);

    try {
      const res = await apiPostDirect('importBackup', { backup: backupData, confirmed: true }, 90000);
      if(res && res.ok){
        // Hydrate state
        const s = backupData.sheets;
        if(s.Receipts) { state.receipts = s.Receipts; setCache('receipts', state.receipts); }
        if(s.Invoices) { state.invoices = s.Invoices; setCache('invoices', state.invoices); }
        if(s.Customers) { state.customers = s.Customers; setCache('customers', state.customers); }
        if(s.Inventory) { state.inventory = s.Inventory; setCache('inventory', state.inventory); }
        if(s.Sales) { state.sales = s.Sales; setCache('sales', state.sales); }
        if(s.Expenses) { state.expenses = s.Expenses; setCache('expenses', state.expenses); }
        if(s.JournalEntries) { state.journalEntries = s.JournalEntries; setCache('journal', state.journalEntries); }
        if(s.Accounts) { state.accounts = s.Accounts; setCache('accounts', state.accounts); }
        if(s.Purchases) { state.purchases = s.Purchases; setCache('purchases', state.purchases); }
        if(s.Suppliers) { state.suppliers = s.Suppliers; setCache('suppliers', state.suppliers); }
        if(s.Quotations) { state.quotations = s.Quotations; setCache('quotations', state.quotations); }
        if(s.Sites) { state.cctvSites = s.Sites; setCache('cctv_sites', state.cctvSites); }
        if(s.Projects) { state.cctvProjects = s.Projects; setCache('cctv_projects', state.cctvProjects); }
        if(s.ProjectDevices) { state.cctvDevices = s.ProjectDevices; setCache('cctv_devices', state.cctvDevices); }
        if(s.ServiceVisits) { state.cctvVisits = s.ServiceVisits; setCache('cctv_visits', state.cctvVisits); }
        if(s.MaintenanceContracts) { state.cctvContracts = s.MaintenanceContracts; setCache('cctv_contracts', state.cctvContracts); }
        if(s.ProjectMilestones) { state.cctvMilestones = s.ProjectMilestones; setCache('cctv_milestones', state.cctvMilestones); }

        recordAuditLog('استعادة نسخة احتياطية', 'backup', 'استعادة شاملة بنجاح، إجمالي السجلات: ' + totalRecords, '', 'مكتمل');
        overlay.remove();
        showToast('تمت استعادة كافة البيانات بنجاح! جاري تحديث الشاشة...', 'success', 5000);
        setTimeout(() => {
          const main = document.getElementById('main');
          if(main) renderBackupRestoreSettings(main);
        }, 1000);
      } else {
        throw new Error(res.error || 'فشلت عملية الاستعادة على السيرفر');
      }
    } catch(err) {
      showToast('تعذر استعادة البيانات: ' + err.message, 'error', 8000);
      execBtn.disabled = false;
      execBtn.innerHTML = `${getSvgIcon("download", 14)} تأكيد وبدء الاستعادة`;
    }
  };
}

function renderBackupRestoreSettings(main){
  const totalReceipts = (state.receipts || []).length;
  const totalInvoices = (state.invoices || []).length;
  const totalCustomers = (state.customers || []).length;
  const totalInventory = (state.inventory || []).length;
  const totalJournal = (state.journalEntries || []).length;
  const totalProjects = (state.cctvProjects || []).length;
  const grandTotal = totalReceipts + totalInvoices + totalCustomers + totalInventory + totalJournal + totalProjects;

  main.innerHTML = `
    ${renderSettingsNavHeader('النسخ الاحتياطي واستعادة البيانات', 'تصدير واستعادة ملفات JSON الشاملة، النسخ السحابي التلقائي على Google Drive، وتصدير الجداول بصيغة Excel/CSV')}

    <!-- Overview & Live Database Metrics -->
    <div class="card" style="border-right: 4px solid var(--primary);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <div>
          <h3 style="margin:0; font-size:16px;">مركز الأمان وإدارة النسخ الاحتياطية</h3>
          <p style="font-size:12.5px; color:var(--ink-secondary); margin:4px 0 0 0;">
            إدارة شاملة لحفظ واسترجاع كافة بيانات المؤسسة وضمان عدم فقدان أي سجل مالي أو فني.
          </p>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="status-badge st-done">إجمالي السجلات: ${grandTotal}</span>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-top: 14px;">
        <div style="background:var(--paper3); border:1px solid var(--line); border-radius:var(--radius-sm); padding:10px 12px; text-align:center;">
          <div style="font-size:11px; color:var(--ink-secondary);">إيصالات الصيانة</div>
          <div class="num mono" style="font-size:17px; font-weight:800; color:var(--primary); margin-top:4px;">${totalReceipts}</div>
        </div>
        <div style="background:var(--paper3); border:1px solid var(--line); border-radius:var(--radius-sm); padding:10px 12px; text-align:center;">
          <div style="font-size:11px; color:var(--ink-secondary);">فواتير المبيعات</div>
          <div class="num mono" style="font-size:17px; font-weight:800; color:var(--primary); margin-top:4px;">${totalInvoices}</div>
        </div>
        <div style="background:var(--paper3); border:1px solid var(--line); border-radius:var(--radius-sm); padding:10px 12px; text-align:center;">
          <div style="font-size:11px; color:var(--ink-secondary);">دليل العملاء</div>
          <div class="num mono" style="font-size:17px; font-weight:800; color:var(--primary); margin-top:4px;">${totalCustomers}</div>
        </div>
        <div style="background:var(--paper3); border:1px solid var(--line); border-radius:var(--radius-sm); padding:10px 12px; text-align:center;">
          <div style="font-size:11px; color:var(--ink-secondary);">المخزون والأصناف</div>
          <div class="num mono" style="font-size:17px; font-weight:800; color:var(--primary); margin-top:4px;">${totalInventory}</div>
        </div>
        <div style="background:var(--paper3); border:1px solid var(--line); border-radius:var(--radius-sm); padding:10px 12px; text-align:center;">
          <div style="font-size:11px; color:var(--ink-secondary);">القيود المحاسبية</div>
          <div class="num mono" style="font-size:17px; font-weight:800; color:var(--primary); margin-top:4px;">${totalJournal}</div>
        </div>
        <div style="background:var(--paper3); border:1px solid var(--line); border-radius:var(--radius-sm); padding:10px 12px; text-align:center;">
          <div style="font-size:11px; color:var(--ink-secondary);">المشاريع والعقود</div>
          <div class="num mono" style="font-size:17px; font-weight:800; color:var(--primary); margin-top:4px;">${totalProjects}</div>
        </div>
      </div>
    </div>

    <!-- Section 1 & 2: Export & Import Full JSON Backup -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:18px; margin-bottom:18px;">
      <!-- Export Full Backup -->
      <div class="card" style="border-right:4px solid #0284c7;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
          <span style="color:#0284c7;">${getSvgIcon("download", 20)}</span>
          <h3 style="margin:0; font-size:15.5px;">تصدير نسخة احتياطية شاملة (JSON)</h3>
        </div>
        <p style="font-size:12.5px; color:var(--ink-secondary); line-height:1.6; margin-bottom:16px;">
          توليد ملف JSON موثق وشامل يحوي كافة جداول وبيانات النظام، مع تشفير وحماية كلمات المرور ورموز الاعتماد لمنع أي تسريب.
        </p>
        <div style="display:flex; flex-direction:column; gap:10px;">
          <button class="btn btn-primary" id="exportServerBackupBtn" style="justify-content:center;">
            ${getSvgIcon("refresh", 14)} تصدير نسخة سحابية كاملة (من السيرفر)
          </button>
          <button class="btn btn-ghost" id="exportLocalBackupBtn" style="justify-content:center;">
            ${getSvgIcon("download", 14)} تصدير نسخة من البيانات المحلية (الكاش الحالي)
          </button>
        </div>
      </div>

      <!-- Restore Full Backup -->
      <div class="card" style="border-right:4px solid #ef4444;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
          <span style="color:#ef4444;">${getSvgIcon("alert", 20)}</span>
          <h3 style="margin:0; font-size:15.5px;">استعادة نسخة احتياطية للنظام (Restore)</h3>
        </div>
        <p style="font-size:12.5px; color:var(--ink-secondary); line-height:1.6; margin-bottom:16px;">
          استعادة النظام بالكامل من ملف JSON سابق. يتضمن الفحص الآلي للمخطط وتأكيد كلمة المرور والتقاط نسخة احتياطية تلقائية قبل الاستعادة.
        </p>
        <input type="file" id="restoreBackupFileInput" accept=".json,application/json" style="display:none;">
        <button class="btn btn-danger" id="triggerRestoreFileBtn" style="width:100%; justify-content:center;">
          ${getSvgIcon("download", 14)} اختيار ملف النسخة الاحتياطية (.json)
        </button>
        <div style="font-size:11px; color:#ef4444; margin-top:8px; text-align:center;">
          ⚠️ تحذير: هذه العملية تستبدل كافة الجداول الموجودة بالنسخة المستعادة.
        </div>
      </div>
    </div>

    <!-- Section 3: Google Drive Automated Snapshots -->
    <div class="card" style="border-right:4px solid #10b981; margin-bottom:18px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:#10b981;">${getSvgIcon("store", 20)}</span>
          <h3 style="margin:0; font-size:15.5px;">النسخ الاحتياطي التلقائي على Google Drive</h3>
        </div>
        <span class="status-badge st-done">حفظ تلقائي لآخر 30 نسخة</span>
      </div>
      <p style="font-size:12.5px; color:var(--ink-secondary); line-height:1.6; margin-bottom:14px;">
        يقوم محرك السيرفر بنسخ ملف جدول البيانات بالكامل في مجلد آمن ومستقل على <b>Google Drive</b> (باسم <code>microERP_Backups</code>) مع تدوير النسخ وحذف الأقدم تلقائياً.
      </p>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button class="btn btn-primary" id="runDriveSnapshotNowBtn">
          ${getSvgIcon("refresh", 14)} أخذ لقطة سحابية على Google Drive الآن
        </button>
        <button class="btn btn-ghost" id="setupDriveDailyTriggerBtn">
          ${getSvgIcon("printer", 14)} تفعيل الجدولة اليومية التلقائية (2:00 ص)
        </button>
      </div>
    </div>

    <!-- Section 4: CSV / Excel Export Per Sheet -->
    <div class="card" style="border-right:4px solid #f59e0b;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:#f59e0b;">${getSvgIcon("pos", 20)}</span>
          <h3 style="margin:0; font-size:15.5px;">تصدير الجداول بصيغة Excel / CSV (معزولة ومؤمنة)</h3>
        </div>
        <button class="btn btn-primary btn-sm" id="exportAllSheetsCsvBtn">
          ${getSvgIcon("download", 13)} تصدير كافة الجداول دفعة واحدة (CSV Archive)
        </button>
      </div>
      <p style="font-size:12px; color:var(--ink-secondary); margin-bottom:16px;">
        تصدير جداول النظام بصيغة CSV المتوافقة تماماً مع Microsoft Excel بمواصفة RFC 4180، مع تطبيق فحص <code>csvSafe</code> لتعقيم الخلايا وحماية الأمان ضد هجمات Formula Injection.
      </p>

      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap:10px;">
        <button class="btn btn-ghost btn-sm" data-csv-sheet="receipts" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("tool", 14)} إيصالات الصيانة (${totalReceipts})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="invoices" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("pos", 14)} فواتير المبيعات (${totalInvoices})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="customers" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("users", 14)} دليل العملاء (${totalCustomers})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="inventory" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("barcode", 14)} المخزون وقطع الغيار (${totalInventory})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="sales" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("pos", 14)} المبيعات اليومية (${(state.sales||[]).length})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="returns" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("refresh", 14)} مرتجعات المبيعات
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="expenses" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("chart", 14)} المصروفات والمنصرفات (${(state.expenses||[]).length})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="journal" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("shield", 14)} قيود اليومية (${totalJournal})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="accounts" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("store", 14)} دليل شجرة الحسابات (${(state.accounts||[]).length})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="purchases" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("store", 14)} فواتير المشتريات (${(state.purchases||[]).length})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="suppliers" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("users", 14)} حسابات الموردين (${(state.suppliers||[]).length})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="quotations" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("message", 14)} عروض الأسعار (${(state.quotations||[]).length})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="cctv_projects" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("tool", 14)} مشاريع الكاميرات (${totalProjects})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="cctv_contracts" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("shield", 14)} عقود الصيانة الدورية (${(state.cctvContracts||[]).length})
        </button>
        <button class="btn btn-ghost btn-sm" data-csv-sheet="audit_log" style="justify-content:flex-start; text-align:right;">
          ${getSvgIcon("shield", 14)} سجل الرقابة وتتبع العمليات
        </button>
      </div>
    </div>
  `;

  attachSettingsQuickTabEvents(main);

  // Attach Handlers
  // 1. Export Server Backup
  document.getElementById('exportServerBackupBtn').onclick = async () => {
    showToast('جاري استخراج النسخة الاحتياطية السحابية من Google Sheets...', 'info');
    try {
      const res = await apiPostDirect('exportBackup', {}, 60000);
      if(res && res.ok && res.backup){
        const dateStr = new Date().toISOString().slice(0,10);
        const timeStr = new Date().toTimeString().slice(0,5).replace(':','-');
        downloadJsonFile(`microERP_CloudBackup_${dateStr}_${timeStr}.json`, res.backup);
        showToast('تم تحميل النسخة الاحتياطية السحابية بنجاح', 'success');
        recordAuditLog('تصدير نسخة احتياطية', 'backup', 'تصدير سحابي شامل', '', 'مكتمل');
      } else {
        throw new Error(res.error || 'فشل استلام ملف النسخة الاحتياطية من السيرفر');
      }
    } catch(err) {
      showToast('تعذر تصدير النسخة السحابية: ' + err.message, 'error');
    }
  };

  // 2. Export Local Backup
  document.getElementById('exportLocalBackupBtn').onclick = () => {
    try {
      const localBackup = createLocalBackupPayload();
      const dateStr = new Date().toISOString().slice(0,10);
      const timeStr = new Date().toTimeString().slice(0,5).replace(':','-');
      downloadJsonFile(`microERP_LocalBackup_${dateStr}_${timeStr}.json`, localBackup);
      showToast('تم تحميل النسخة الاحتياطية المحلية بنجاح', 'success');
      recordAuditLog('تصدير نسخة احتياطية', 'backup', 'تصدير محلي', '', 'مكتمل');
    } catch(err) {
      showToast('تعذر تصدير النسخة المحلية: ' + err.message, 'error');
    }
  };

  // 3. Restore File Picker
  const fileInput = document.getElementById('restoreBackupFileInput');
  document.getElementById('triggerRestoreFileBtn').onclick = () => fileInput.click();

  fileInput.onchange = (e) => {
    const file = e.target.files && e.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = (re) => {
      let backupData;
      try {
        backupData = JSON.parse(re.target.result);
      } catch(parseErr) {
        showToast('الملف المختار ليس بصيغة JSON صالحة', 'error');
        return;
      }
      if(!backupData || backupData.appName !== 'microERP' || !backupData.sheets){
        showToast('الملف المختار ليس ملف نسخة احتياطية صالح لنظام ميكروERP', 'error');
        return;
      }
      openRestoreConfirmationModal(backupData);
      fileInput.value = ''; // Reset input
    };
    reader.onerror = () => {
      showToast('حدث خطأ أثناء قراءة الملف من القرص', 'error');
    };
    reader.readAsText(file);
  };

  // 4. Drive Snapshot Now
  document.getElementById('runDriveSnapshotNowBtn').onclick = async () => {
    showToast('جاري التقاط نسخة كاملة على Google Drive...', 'info');
    try {
      const res = await apiPostDirect('runDailyBackupNow', {}, 45000);
      if(res && res.ok){
        showToast('تم أخذ لقطة سحابية على Google Drive بنجاح: ' + (res.backupName || ''), 'success', 6000);
      } else {
        throw new Error(res.error || 'فشل إنشاء اللقطة');
      }
    } catch(err) {
      showToast('تعذر أخذ لقطة Google Drive: ' + err.message, 'error');
    }
  };

  // 5. Setup Drive Daily Trigger
  document.getElementById('setupDriveDailyTriggerBtn').onclick = async () => {
    showToast('جاري تفعيل الجدولة اليومية على Google Apps Script...', 'info');
    try {
      const res = await apiPostDirect('setupDailyBackupTrigger', {}, 30000);
      if(res && res.ok){
        showToast(res.message || 'تم تفعيل النسخ الاحتياطي التلقائي اليومي بنجاح', 'success', 5000);
      } else {
        throw new Error(res.error || 'فشل تفعيل الجدولة');
      }
    } catch(err) {
      showToast('تعذر تفعيل الجدولة: ' + err.message, 'error');
    }
  };

  // 6. CSV Single Sheet Buttons
  main.querySelectorAll('[data-csv-sheet]').forEach(btn => {
    btn.onclick = () => {
      const key = btn.dataset.csvSheet;
      exportSheetToCSV(key);
    };
  });

  // 7. CSV Export All Sheets
  document.getElementById('exportAllSheetsCsvBtn').onclick = () => {
    exportAllSheetsCSV();
  };
}
