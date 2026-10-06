/* ---------------- Excel Export Utility ---------------- */
function exportReceiptsToExcel(receipts){
  if(!receipts || !receipts.length){ showToast('لا توجد بيانات للتصدير', 'error'); return; }
  const headers = ['رقم الإيصال','التاريخ','وقت الاستلام','اللقب','الاسم','الهاتف','فئة الجهاز','الماركة','الموديل','كلمة السر','الأعطال','الفني','تكلفة الصيانة','حساب إضافي','المدفوع','قطع الغيار','المتبقي','الحالة','موعد التسليم'];
  const rows = receipts.map(rawR=>{
    const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
    const otherAmt = Number(r.otherAccountAmount||0);
    const rem = Number(r.cost||0)+Number(r.partsCost||0)+otherAmt-Number(r.deposit||0)+Number(r.refunded||0);
    const faultsStr = (Array.isArray(r.faults) ? r.faults.join(' - ') : String(r.faults || '')) || '-';
    const cTitle = extractCustomerTitle(r);
    const cName = (r.customer && r.customer.name) || extractCustomerName(r) || 'عميل';
    const cPhone = (r.customer && r.customer.phone) || extractCustomerPhone(r) || '';
    const dCat = (r.device && r.device.category) || 'جهاز';
    const dBrand = r.device ? (r.device.brand==='أخرى'?r.device.brandOther:r.device.brand) : '';
    const dModel = (r.device && r.device.model) || '';
    const pass = (r.device && r.device.password) || r.password || '';
    const rTime = (typeof formatReceiptTime === 'function' ? formatReceiptTime(r) : (r.time || ''));
    return [
      r.receiptNumber, cleanDate(r.date), `"${rTime}"`, `"${cTitle}"`, `"${cName}"`, `"${cPhone}"`,
      dCat, dBrand, `"${dModel}"`, `"${pass}"`, `"${faultsStr}"`,
      `"${r.technician||''}"`, r.cost||0, otherAmt, r.deposit||0, r.partsCost||0, rem, `"${r.status}"`, r.deliveryDate||''
    ];
  });
  downloadCSV(`Receipts_Export_${new Date().toISOString().slice(0,10)}.csv`, headers, rows);
}

function exportInventoryToExcel(items){
  if(!items || !items.length){ showToast('المخزن فارغ', 'error'); return; }
  const headers = ['اسم الصنف','القسم','التصنيف الفرعي','كود القطعة SKU','الباركود','مكان الرف','الكمية المتاحة','الوحدة','حد الأمان','سعر الشراء','سعر البيع قطاعي','سعر الجملة','صافي الربح','نسبة الهامش %','شهور الضمان','الموديلات المتوافقة'];
  const rows = items.map(it=>{
    const buy = Number(it.PurchasePrice||0);
    const sell = Number(it.SellPrice||0);
    const profit = sell - buy;
    const margin = sell > 0 ? Math.round((profit/sell)*100)+'%' : '0%';
    return [
      `"${it.Name}"`, it.Category||'صيانة', `"${it.SubCategory||''}"`, `"${it.SKU||''}"`, `"${it.Barcode||''}"`,
      `"${it.ShelfLocation||''}"`, it.Quantity||0, it.Unit||'قطعة', it.MinStock||2,
      buy, sell, it.WholesalePrice||0, profit, `"${margin}"`, it.WarrantyMonths||0, `"${it.CompatibleModels||''}"`
    ];
  });
  downloadCSV(`Inventory_Export_${new Date().toISOString().slice(0,10)}.csv`, headers, rows);
}

function exportInvoicesToExcel(invoices){
  if(!invoices || !invoices.length){ showToast('لا توجد فواتير للتصدير', 'error'); return; }
  const headers = ['رقم الفاتورة','التاريخ','تاريخ الاستحقاق','اسم العميل','الهاتف','الرقم الضريبي','المرجع','الإجمالي قبل الضريبة','الضريبة','الخصم','الإجمالي النهائي','المدفوع','المتبقي','الحالة','طريقة الدفع','محرر الفاتورة'];
  const rows = invoices.map(inv=>[
    inv.InvoiceNumber||inv.ID, cleanDate(inv.Date), cleanDate(inv.DueDate),
    `"${inv.CustomerName||''}"`, `"${inv.CustomerPhone||''}"`, `"${inv.CustomerTaxNumber||''}"`,
    `"${inv.ReferenceType ? (inv.ReferenceType + ': ' + inv.ReferenceID) : 'حر'}"`,
    inv.Subtotal||0, inv.TaxAmount||0, inv.Discount||0, inv.Total||0,
    inv.AmountPaid||0, inv.Remaining||0, `"${inv.Status||''}"`, `"${inv.PaymentMethod||''}"`, `"${inv.By||''}"`
  ]);
  downloadCSV(`Invoices_Export_${new Date().toISOString().slice(0,10)}.csv`, headers, rows);
}

/* ============================================================
   Invoicing System & Receipt-To-Invoice Conversion (منظومة الفواتير)
   ============================================================ */

async function convertReceiptToInvoice(receiptId){
  const r = findReceiptByIdOrNum(receiptId);
  if(!r){ showToast('تعذر العثور على الإيصال المطلوب', 'error'); return; }

  // Check if this receipt already has an invoice issued
  const existing = state.invoices.find(inv => inv.ReferenceType==='Receipt' && (String(inv.ReferenceID)===String(r.receiptNumber) || String(inv.ReferenceID)===String(r.id)));
  if(existing){
    const openExisting = await openConfirmModal({
      title: 'فاتورة مسجلة مسبقاً',
      message: `تم إصدار فاتورة سابقة لهذا الإيصال برقم (${existing.InvoiceNumber}). هل ترغب في فتح الفاتورة المسجلة؟`,
      confirmText: 'فتح الفاتورة المسجلة',
      cancelText: 'إلغاء',
      icon: 'fileText'
    });
    if(openExisting){
      openInvoiceModal(existing);
      return;
    }
  }

  // Calculate items and finances from receipt
  const totalCost = Number(r.cost||0);
  const partsCost = Number(r.partsCost||0);
  const laborCost = Math.max(0, totalCost - partsCost);

  const payments = getReceiptPayments(r);
  const totalPayments = payments.reduce((s,p)=>s+Number(p.Amount||0),0);
  const totalDeposit = Number(r.deposit||0);
  const totalPaid = totalPayments > 0 ? totalPayments : totalDeposit;

  const brandName = (r.device && r.device.brand==='أخرى') ? r.device.brandOther : ((r.device && r.device.brand) || '');
  const devCat = (r.device && r.device.category) || 'جهاز';
  const devModel = (r.device && r.device.model) || '';
  const faultsDesc = (Array.isArray(r.faults) && r.faults.length) ? r.faults.join('، ') : (r.faultNotes || 'صيانة عامة');

  const items = [];
  const svcItems = Array.isArray(r.serviceItems) ? r.serviceItems.filter(it => (it.desc && it.desc.trim()) || Number(it.price) > 0) : [];
  if(svcItems.length > 0){
    svcItems.forEach(it => {
      items.push({
        Name: `خدمة صيانة: ${it.desc || 'بند صيانة'} (${devCat} ${brandName})`.trim(),
        Qty: 1,
        Price: Number(it.price || 0),
        Total: Number(it.price || 0)
      });
    });
  } else {
    // Item 1: Service Labor
    items.push({
      Name: `أجور وخدمات صيانة ${devCat} ${brandName} ${devModel} (عطل: ${faultsDesc})`.trim(),
      Qty: 1,
      Price: laborCost > 0 ? laborCost : totalCost,
      Total: laborCost > 0 ? laborCost : totalCost
    });
  }

  // Item 2: Parts (if any)
  if(partsCost > 0){
    items.push({
      Name: `قطع غيار مستخدمة: ${r.partsUsed || 'مستلزمات صيانة وقطع مستبدلة'}`,
      Qty: 1,
      Price: partsCost,
      Total: partsCost
    });
  }

  // Item 3: Other Customer Account (if any)
  const otherAmt = Number(r.otherAccountAmount || 0);
  if(otherAmt > 0){
    items.push({
      Name: `حساب إضافي على العميل: ${r.otherAccountDesc || 'رصيد سابق / حساب آخر'}`,
      Qty: 1,
      Price: otherAmt,
      Total: otherAmt
    });
  }

  const subtotal = items.reduce((s,it)=>s+Number(it.Total||0),0);
  const remaining = Math.max(0, subtotal - totalPaid);

  const prefilledInvoice = {
    ID: 'inv_' + Date.now(),
    InvoiceNumber: (typeof nextInvoiceNumber === 'function') ? nextInvoiceNumber() : ('INV-' + new Date().getFullYear() + '-0001'),
    Date: cleanDate(r.date) || new Date().toISOString().slice(0,10),
    DueDate: cleanDate(r.deliveryDate) || new Date().toISOString().slice(0,10),
    CustomerTitle: r.customer.title || '',
    CustomerName: r.customer.name || '',
    CustomerPhone: r.customer.phone || '',
    CustomerTaxNumber: '',
    CustomerAddress: '',
    Items: items,
    ItemsSummary: items.map(i=>i.Name).join(' + '),
    Subtotal: subtotal,
    TaxPercent: 0,
    TaxAmount: 0,
    Discount: 0,
    Total: subtotal,
    AmountPaid: totalPaid,
    Remaining: remaining,
    Status: remaining <= 0 ? 'مدفوعة بالكامل' : (totalPaid > 0 ? 'مدفوعة جزئياً' : 'غير مدفوعة (آجلة)'),
    PaymentMethod: 'نقدي',
    ReferenceType: 'Receipt',
    ReferenceID: r.receiptNumber || r.id,
    Notes: `فاتورة صادرة عن إيصال صيانة رقم #${r.receiptNumber} (${r.device.category} ${brandName} ${r.device.model||''})`
  };

  openInvoiceModal(prefilledInvoice, true);
}

window.convertMultipleReceiptsToInvoice = async function(receiptIds){
  if(!Array.isArray(receiptIds) || receiptIds.length === 0){
    showToast('يرجى تحديد إيصالات لإصدار الفاتورة المجمعة', 'error');
    return;
  }

  const receipts = receiptIds.map(id => findReceiptByIdOrNum(id)).filter(Boolean);
  if(receipts.length === 0){
    showToast('تعذر العثور على الإيصالات المحددة', 'error');
    return;
  }

  if(receipts.length === 1){
    return convertReceiptToInvoice(receipts[0].id || receipts[0].receiptNumber);
  }

  const firstCustName = extractCustomerName(receipts[0]) || 'عميل';
  const firstCustTitle = extractCustomerTitle(receipts[0]) || '';
  const firstCustPhone = extractCustomerPhone(receipts[0]) || '';
  const firstCustEmail = extractCustomerEmail(receipts[0]) || '';

  const differentCusts = receipts.filter(r => (extractCustomerName(r) || '').trim().toLowerCase() !== firstCustName.trim().toLowerCase());
  if(differentCusts.length > 0){
    const ok = await openConfirmModal({
      title: 'إيصالات لعملاء متعددين',
      message: `تنبيه: الإيصالات المحددة تخص أكثر من عميل.\nهل ترغب في إصدار الفاتورة المجمعة باسم العميل (${firstCustName})؟`,
      confirmText: 'متابعة إصدار الفاتورة',
      confirmClass: 'btn-amber',
      icon: 'alertTriangle'
    });
    if(!ok) return;
  }

  const items = [];
  let totalPaymentsAll = 0;
  const receiptNumbers = [];

  receipts.forEach(r => {
    const rNum = r.receiptNumber || r.id;
    receiptNumbers.push(rNum);

    const totalCost = Number(r.cost || 0);
    const partsCost = Number(r.partsCost || 0);
    const laborCost = Math.max(0, totalCost - partsCost);

    const payments = (typeof getReceiptPayments === 'function') ? getReceiptPayments(r) : [];
    const pAmt = payments.reduce((s, p) => s + Number(p.Amount || 0), 0);
    const depositAmt = Number(r.deposit || 0);
    const paidForThis = pAmt > 0 ? pAmt : depositAmt;
    totalPaymentsAll += paidForThis;

    const devs = (Array.isArray(r.devices) && r.devices.length) ? r.devices : [ r.device ];
    const devDescs = devs.map(d => {
      const cat = d.category || 'جهاز';
      const b = d.brand === 'أخرى' ? d.brandOther : d.brand;
      return `${cat} ${b||''} ${d.model||''}`.trim();
    }).join(' + ');

    const faultsDesc = (Array.isArray(r.faults) && r.faults.length) ? r.faults.join('، ') : (r.faultNotes || 'صيانة عامة');

    const svcItems = Array.isArray(r.serviceItems) ? r.serviceItems.filter(it => (it.desc && it.desc.trim()) || Number(it.price) > 0) : [];
    if(svcItems.length > 0){
      svcItems.forEach(it => {
        items.push({
          Name: `خدمة صيانة: ${it.desc} (${devDescs} - إيصال #${rNum})`,
          Qty: 1,
          Price: Number(it.price || 0),
          Total: Number(it.price || 0)
        });
      });
    } else {
      items.push({
        Name: `أجور وخدمات صيانة: ${devDescs} (إيصال #${rNum} - عطل: ${faultsDesc})`,
        Qty: 1,
        Price: laborCost > 0 ? laborCost : totalCost,
        Total: laborCost > 0 ? laborCost : totalCost
      });
    }

    if(partsCost > 0){
      items.push({
        Name: `قطع غيار مستخدمة (${devDescs} - إيصال #${rNum}): ${r.partsUsed || 'مستلزمات صيانة'}`,
        Qty: 1,
        Price: partsCost,
        Total: partsCost
      });
    }

    const otherAmt = Number(r.otherAccountAmount || 0);
    if(otherAmt > 0){
      items.push({
        Name: `حساب إضافي (إيصال #${rNum}): ${r.otherAccountDesc || 'رصيد سابق'}`,
        Qty: 1,
        Price: otherAmt,
        Total: otherAmt
      });
    }
  });

  const subtotal = items.reduce((s, it) => s + Number(it.Total || 0), 0);
  const remaining = Math.max(0, subtotal - totalPaymentsAll);

  const prefilledInvoice = {
    ID: 'inv_' + Date.now(),
    InvoiceNumber: (typeof nextInvoiceNumber === 'function') ? nextInvoiceNumber() : ('INV-' + new Date().getFullYear() + '-0001'),
    Date: new Date().toISOString().slice(0, 10),
    DueDate: new Date().toISOString().slice(0, 10),
    CustomerTitle: firstCustTitle,
    CustomerName: firstCustName,
    CustomerPhone: firstCustPhone,
    CustomerTaxNumber: '',
    CustomerAddress: '',
    Items: items,
    ItemsSummary: items.map(i => i.Name).join(' + '),
    Subtotal: subtotal,
    TaxPercent: 0,
    TaxAmount: 0,
    Discount: 0,
    Total: subtotal,
    AmountPaid: totalPaymentsAll,
    Remaining: remaining,
    Status: remaining <= 0 ? 'مدفوعة بالكامل' : (totalPaymentsAll > 0 ? 'مدفوعة جزئياً' : 'غير مدفوعة (آجلة)'),
    PaymentMethod: 'نقدي',
    ReferenceType: 'MultipleReceipts',
    ReferenceID: receiptNumbers.join(', '),
    Notes: `فاتورة مجمعة صادرة عن (${receipts.length}) إيصالات صيانة: #${receiptNumbers.join('، #')}`
  };

  openInvoiceModal(prefilledInvoice, true);
};

window.openCustomerConsolidatedInvoiceModal = function(custName){
  const cleanName = (custName || '').trim().toLowerCase();
  const clientReceipts = (state.receipts || []).filter(r => {
    const rName = extractCustomerName(r);
    return rName && rName.trim().toLowerCase() === cleanName;
  });

  if(clientReceipts.length === 0){
    showToast('لا توجد أي إيصالات مسجلة لهذا العميل', 'warning');
    return;
  }
  if(clientReceipts.length === 1){
    return convertReceiptToInvoice(clientReceipts[0].id || clientReceipts[0].receiptNumber);
  }

  const prevModal = document.getElementById('custConsolidatedInvoicePickerModal');
  if(prevModal) prevModal.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'custConsolidatedInvoicePickerModal';
  overlay.style.zIndex = '11200';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:560px;padding:22px;border-radius:18px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:14px;">
        <div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="display:inline-flex;align-items:center;color:var(--primary);">${getSvgIcon("invoices", 20)}</span>
            <h3 style="margin:0;font-size:16.5px;color:var(--ink);">فاتورة مجمعة للعميل: <b>${escapeHtml(custName)}</b></h3>
          </div>
          <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">حدد إيصالات الصيانة المطلوب تضمينها في الفاتورة المجمعة (${clientReceipts.length} إيصالات متوفرة):</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('custConsolidatedInvoicePickerModal').remove()">&times;</button>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:12px;">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-weight:700;">
          <input type="checkbox" id="pickAllCustRecsChk" checked>
          <span>تحديد الكل</span>
        </label>
        <div id="custConsolidatedSummary" style="font-weight:800;color:var(--primary);"></div>
      </div>

      <div style="max-height:280px;overflow-y:auto;border:1px solid var(--line);border-radius:var(--radius-sm);padding:8px;display:flex;flex-direction:column;gap:6px;margin-bottom:14px;background:var(--paper2);">
        ${clientReceipts.map(r => {
          const rNum = r.receiptNumber || r.id;
          const otherAmt = Number(r.otherAccountAmount || 0);
          const totalCost = Number(r.cost || 0) + Number(r.partsCost || 0) + otherAmt;
          const deposit = Number(r.deposit || 0);
          const remaining = Math.max(0, totalCost - deposit + Number(r.refunded || 0));
          const devCat = (r.device && r.device.category) || 'جهاز';
          const brand = (r.device ? (r.device.brand==='أخرى'?r.device.brandOther:r.device.brand) : '') || '';
          const model = (r.device && r.device.model) || '';

          return `
            <label style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;background:var(--paper);border:1px solid var(--line);border-radius:6px;cursor:pointer;">
              <div style="display:flex;align-items:center;gap:8px;">
                <input type="checkbox" class="cust-inv-rec-chk" value="${r.id || rNum}" checked>
                <div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <b class="mono" style="color:var(--primary);font-size:12.5px;">#${escapeHtml(rNum)}</b>
                    <span style="font-size:12px;font-weight:700;color:var(--ink);">${escapeHtml(devCat)} ${escapeHtml(brand)} ${escapeHtml(model)}</span>
                  </div>
                  <div style="font-size:11px;color:var(--ink-secondary);">الحالة: <b>${escapeHtml(r.status)}</b> • التاريخ: ${cleanDate(r.date)}</div>
                </div>
              </div>
              <div style="text-align:left;" class="mono">
                <div style="font-weight:800;font-size:12px;color:var(--ink);">${totalCost.toLocaleString()} ج.م</div>
                <div style="font-size:10.5px;${remaining > 0 ? 'color:var(--red);' : 'color:var(--green);'}">متبقي: ${remaining.toLocaleString()} ج.م</div>
              </div>
            </label>
          `;
        }).join('')}
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;">
        <button class="btn btn-ghost" onclick="document.getElementById('custConsolidatedInvoicePickerModal').remove()">إلغاء</button>
        <button class="btn btn-primary" id="confirmCustConsolidatedInvoiceBtn" style="font-weight:800;">
          ${getSvgIcon("invoices", 14)} إصدار الفاتورة المجمعة
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const checkboxes = overlay.querySelectorAll('.cust-inv-rec-chk');
  const allChk = overlay.querySelector('#pickAllCustRecsChk');
  const summaryEl = overlay.querySelector('#custConsolidatedSummary');

  function updateSummary(){
    const selected = Array.from(checkboxes).filter(c => c.checked).map(c => c.value);
    summaryEl.textContent = `تم تحديد (${selected.length} من ${clientReceipts.length})`;
    allChk.checked = selected.length === clientReceipts.length;
  }
  updateSummary();

  allChk.onchange = ()=>{
    checkboxes.forEach(c => c.checked = allChk.checked);
    updateSummary();
  };
  checkboxes.forEach(c => c.onchange = updateSummary);

  overlay.querySelector('#confirmCustConsolidatedInvoiceBtn').onclick = ()=>{
    const selectedIds = Array.from(checkboxes).filter(c => c.checked).map(c => c.value);
    if(selectedIds.length === 0){
      showToast('يرجى تحديد إيصال واحد على الأقل', 'error');
      return;
    }
    overlay.remove();
    convertMultipleReceiptsToInvoice(selectedIds);
  };
};

function openInvoiceModal(existingInv, isFromReceipt=false){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const isEdit = !!existingInv && !isFromReceipt;
  const isPaidLocked = isEdit && Number(existingInv.AmountPaid || 0) > 0;
  let editAuthorized = false;
  let authorizedBy = '';

  const inv = existingInv ? {
    ...existingInv,
    Items: Array.isArray(existingInv.Items) ? [...existingInv.Items] : (JSON.parse(existingInv.ItemsJSON||'[]'))
  } : {
    ID: 'inv_' + Date.now(),
    InvoiceNumber: (typeof nextInvoiceNumber === 'function') ? nextInvoiceNumber() : ('INV-' + new Date().getFullYear() + '-0001'),
    Date: new Date().toISOString().slice(0,10),
    DueDate: new Date().toISOString().slice(0,10),
    CustomerTitle: '',
    CustomerName: '',
    CustomerPhone: '',
    CustomerTaxNumber: '',
    CustomerAddress: '',
    Items: [{ Name: '', Qty: 1, Price: 0, Total: 0 }],
    Subtotal: 0,
    TaxPercent: 0,
    TaxAmount: 0,
    IsTaxInclusive: false,
    Discount: 0,
    Total: 0,
    AmountPaid: 0,
    Remaining: 0,
    Status: 'مدفوعة بالكامل',
    PaymentMethod: 'نقدي',
    ReferenceType: '',
    ReferenceID: '',
    Notes: ''
  };

  if(!inv.Items.length) inv.Items = [{ Name: '', Qty: 1, Price: 0, Total: 0 }];

  function renderModal(){
    // Calculate sums using unified computeDocTotals [F3]
    const docTotals = (typeof computeDocTotals === 'function')
      ? computeDocTotals({
          items: inv.Items,
          discount: inv.Discount,
          taxPercent: inv.TaxPercent,
          isTaxInclusive: inv.IsTaxInclusive
        })
      : {
          subtotal: inv.Items.reduce((s, it) => s + (Number(it.Qty||1)*Number(it.Price||0)), 0),
          discount: Number(inv.Discount||0),
          taxAmount: Math.round(((inv.Items.reduce((s, it) => s + (Number(it.Qty||1)*Number(it.Price||0)), 0) - Number(inv.Discount||0)) * (Number(inv.TaxPercent||0)/100)) * 100) / 100,
          total: 0
        };

    inv.Subtotal = docTotals.subtotal;
    inv.Discount = docTotals.discount;
    inv.TaxAmount = docTotals.taxAmount;
    inv.Total = docTotals.total;
    inv.Remaining = Math.round(Math.max(0, inv.Total - Number(inv.AmountPaid||0)) * 100) / 100;
    if(inv.Total > 0 && inv.Remaining <= 0){ inv.Status = 'مدفوعة بالكامل'; }
    else if(inv.AmountPaid > 0 && inv.Remaining > 0){ inv.Status = 'مدفوعة جزئياً'; }
    else { inv.Status = 'غير مدفوعة (آجلة)'; }

    const curTitle = inv.CustomerTitle || '';
    const titleOptions = [''].concat(typeof CUSTOMER_TITLES !== 'undefined' ? CUSTOMER_TITLES : []).map(t=>`<option value="${escapeHtml(t)}" ${curTitle===t?'selected':''}>${t ? escapeHtml(t) : '-- بدون لقب --'}</option>`).join('');

    overlay.innerHTML = `
      <div class="modal-content" style="max-width:840px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:16px;">
          <div>
            <h3 style="margin:0;font-size:18px;font-weight:900;color:var(--primary);">
              ${isFromReceipt ? `إصدار فاتورة رسمية من إيصال صيانة (#${inv.ReferenceID})` : (isEdit ? `تعديل فاتورة: ${inv.InvoiceNumber}` : `إصدار فاتورة ضريبية / رسمية جديدة`)}
            </h3>
            <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">
              رقم المستند: <span class="mono font-bold">${inv.InvoiceNumber}</span>
              ${inv.ReferenceType ? ` | مرجع: <span class="status-badge st-check" style="font-size:10px;">${inv.ReferenceType==='Receipt'?'إيصال صيانة':inv.ReferenceType} #${inv.ReferenceID}</span>` : ''}
            </div>
          </div>
          <button class="btn btn-ghost btn-xs" id="closeInvModal">إغلاق</button>
        </div>

        <div class="card" style="padding:14px 16px;background:var(--paper3);margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
            <h3 style="font-size:13.5px;margin:0;display:flex;align-items:center;gap:6px;"><span style="display:flex;align-items:center;gap:6px;">${getSvgIcon("user", 15)} بيانات العميل</span></h3>
            <div style="display:flex;gap:6px;align-items:center;">
              <button class="btn btn-xs btn-ghost" id="quickWalkInCustBtn" type="button">عميل زائر</button>
              <button class="btn btn-xs btn-blue" id="quickNewCustBtn" type="button">${getSvgIcon("plus", 12)} عميل جديد</button>
            </div>
          </div>
          <div class="field" style="margin-bottom:12px;">
            <select id="invCustomerSelect" style="width:100%;font-weight:600;">
              <option value="">-- اضغط لاختيار عميل مسجل (${state.customers.length} عميل) --</option>
              <option value="__WALKIN__" ${inv.CustomerName==='عميل زائر'?'selected':''}>عميل زائر (نقدي / Walk-in)</option>
              <option value="__NEW__">${getSvgIcon("plus", 12)} عميل جديد</option>
              ${state.customers.length ? `
                <optgroup label="قائمة العملاء">
                  ${state.customers.map(c=>`<option value="${c.name}" ${inv.CustomerName===c.name?'selected':''}>${c.title ? c.title+' / ' : ''}${c.name} - ${c.phone||'بدون هاتف'}</option>`).join('')}
                </optgroup>
              ` : ''}
            </select>
          </div>
          <div style="display:grid;grid-template-columns:140px 1.5fr 1fr 1fr;gap:10px;">
            <div class="field">
              <label>اللقب (اختياري)</label>
              <select id="invCustTitle">
                ${titleOptions}
              </select>
            </div>
            <div class="field"><label>اسم العميل / الشركة *</label><input id="invCustName" value="${inv.CustomerName||''}"></div>
            <div class="field"><label>رقم هاتف العميل</label><input id="invCustPhone" class="mono" value="${inv.CustomerPhone||''}"></div>
            <div class="field"><label>الرقم الضريبي</label><input id="invCustTax" class="mono" value="${inv.CustomerTaxNumber||''}"></div>
          </div>
          <div class="grid3">
            <div class="field"><label>تاريخ المستند *</label><input id="invDate" type="date" value="${cleanDate(inv.Date)}"></div>
            <div class="field"><label>تاريخ الاستحقاق</label><input id="invDueDate" type="date" value="${cleanDate(inv.DueDate)}"></div>
            <div class="field"><label>العنوان</label><input id="invCustAddr" value="${inv.CustomerAddress||''}"></div>
          </div>
        </div>

        ${isPaidLocked ? `
          <div style="background:${editAuthorized?'#ecfdf5':'#fffbeb'};border:1px solid ${editAuthorized?'#a7f3d0':'#fde68a'};border-radius:10px;padding:12px 16px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
            <div style="display:flex;align-items:center;gap:10px;color:${editAuthorized?'#065f46':'#92400e'};font-size:12.5px;">
              <span style="font-size:18px;">${editAuthorized?'🔓':'🔒'}</span>
              <div>
                ${editAuthorized ? `
                  <div style="font-weight:800;">تعديل مصرح إدارياً</div>
                  <div style="font-size:11.5px;color:#047857;">تم فتح التعديل بتصريح المشرف (<b>${escapeHtml(authorizedBy)}</b>). سيتم توليد قيد تسوية لأي فروق في الإجمالي.</div>
                ` : `
                  <div style="font-weight:800;">فاتورة مسددة (مدفوع: ${Number(existingInv.AmountPaid).toLocaleString()} ج.م)</div>
                  <div style="font-size:11.5px;color:#b45309;">بنود الفاتورة وإجمالياتها مقفلة حمايةً لسلامة القيود المحاسبية. يلزم تصريح إداري لفتح التعديل.</div>
                `}
              </div>
            </div>
            ${!editAuthorized ? `
              <button type="button" class="btn btn-sm btn-amber" id="unlockPaidInvBtn" style="font-weight:800;display:inline-flex;align-items:center;gap:6px;">
                ${getSvgIcon('key', 14)} طلب تصريح المشرف لفتح التعديل
              </button>
            ` : ''}
          </div>
        ` : ''}

        <div class="card" style="padding:14px 16px;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <h3 style="font-size:13.5px;margin:0;display:flex;align-items:center;gap:6px;">${getSvgIcon("package", 15)} بنود الفاتورة / بيان السعر</h3>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-ghost btn-xs" id="addFromInventoryBtn" type="button" ${isPaidLocked && !editAuthorized ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>${getSvgIcon("inventory", 12)} من المخزن</button>
              <button class="btn btn-primary btn-xs" id="addInvLineBtn" type="button" ${isPaidLocked && !editAuthorized ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>${getSvgIcon("plus", 12)} سطر جديد</button>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>بيان الصنف أو الخدمة</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th><th></th></tr></thead>
              <tbody id="invoiceLinesTableBody">
                ${inv.Items.map((it, idx)=>`
                  <tr>
                    <td><input value="${it.Name||''}" data-linefield="Name" data-idx="${idx}" style="width:100%;" ${isPaidLocked && !editAuthorized ? 'disabled style="background:var(--paper2);cursor:not-allowed;"' : ''}></td>
                    <td><input type="number" class="mono" min="1" value="${it.Qty||1}" data-linefield="Qty" data-idx="${idx}" style="width:100%;text-align:center;" ${isPaidLocked && !editAuthorized ? 'disabled style="background:var(--paper2);cursor:not-allowed;"' : ''}></td>
                    <td><input type="number" class="mono" step="any" value="${it.Price||0}" data-linefield="Price" data-idx="${idx}" style="width:100%;text-align:center;" ${isPaidLocked && !editAuthorized ? 'disabled style="background:var(--paper2);cursor:not-allowed;"' : ''}></td>
                    <td class="mono font-bold" style="color:var(--primary);">${(Number(it.Qty||1) * Number(it.Price||0)).toLocaleString()} ج.م</td>
                    <td style="text-align:center;"><button class="btn btn-xs btn-red" data-delline="${idx}" ${isPaidLocked && !editAuthorized ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>&times;</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="grid2">
          <div class="card" style="padding:14px 16px;background:var(--paper3);">
            <h3 style="font-size:13.5px;margin-bottom:10px;display:flex;align-items:center;gap:6px;">${getSvgIcon("creditCard", 15)} السداد والحالة</h3>
            <div class="grid2">
              <div class="field"><label>طريقة السداد</label><select id="invPaymentMethod">${['نقدي','فيزا / كارت','تحويل بنكي','فودافون كاش','آجل'].map(m=>`<option ${m===inv.PaymentMethod?'selected':''}>${m}</option>`).join('')}</select></div>
              <div class="field"><label>المبلغ المدفوع (ج.م)</label><input id="invPaidInput" type="number" class="mono" value="${inv.AmountPaid||0}"></div>
            </div>
            <div class="field"><label>ملاحظات وشروط</label><textarea id="invNotesText">${inv.Notes||''}</textarea></div>
          </div>
          <div class="card" style="padding:14px 16px;">
            <h3 style="font-size:13.5px;margin-bottom:10px;display:flex;align-items:center;gap:6px;">${getSvgIcon("finance", 15)} الملخص المالي</h3>
            <div style="display:flex;flex-direction:column;gap:8px;">
              <div style="display:flex;justify-content:space-between;"><span>المجموع الفرعي:</span><span class="mono font-bold">${inv.Subtotal.toLocaleString()} ج.م</span></div>
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                  <span>ضريبة (VAT):</span>
                  <select id="invTaxPercentSelect" style="width:70px;" ${isPaidLocked && !editAuthorized ? 'disabled' : ''}><option value="0" ${Number(inv.TaxPercent)===0?'selected':''}>0%</option><option value="14" ${Number(inv.TaxPercent)===14?'selected':''}>14%</option></select>
                  <label style="font-size:11px;display:inline-flex;align-items:center;gap:3px;margin:0;cursor:pointer;color:var(--ink-secondary);">
                    <input type="checkbox" id="invTaxInclusiveCheck" ${inv.IsTaxInclusive?'checked':''} ${isPaidLocked && !editAuthorized ? 'disabled' : ''}> شامل الضريبة
                  </label>
                </div>
                <span class="mono font-bold" style="color:var(--blue);">${inv.TaxAmount.toLocaleString()} ج.م</span>
              </div>
              <div style="display:flex;justify-content:space-between;"><span>الخصم:</span><input id="invDiscountInput" type="number" value="${inv.Discount||0}" style="width:90px;text-align:center;" class="mono" ${isPaidLocked && !editAuthorized ? 'disabled style="background:var(--paper2);cursor:not-allowed;"' : ''}></div>
              <div style="display:flex;justify-content:space-between;font-size:14.5px;font-weight:900;border-top:1px solid #ccc;padding-top:6px;"><span>الإجمالي المستحق:</span><span class="mono" style="color:var(--primary);">${inv.Total.toLocaleString()} ج.م</span></div>
              <div style="display:flex;justify-content:space-between;color:var(--green-text);"><span>المدفوع:</span><span class="mono">${(inv.AmountPaid||0).toLocaleString()} ج.م</span></div>
              <div style="display:flex;justify-content:space-between;color:${inv.Remaining>0?'var(--red)':'var(--green-text)'};font-weight:900;"><span>المتبقي:</span><span class="mono">${inv.Remaining.toLocaleString()} ج.م</span></div>
            </div>
          </div>
        </div>

        <div class="actions-row" style="margin-top:16px;">
          <button class="btn btn-ghost" id="cancelInvModalBtn" type="button">إلغاء</button>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-ghost" id="saveAndPrintQuoteBtn" type="button">${getSvgIcon("fileText", 13)} حفظ وطباعة بيان سعر</button>
            <button class="btn btn-blue" id="saveAndPrintInvBtn" type="button">${getSvgIcon("printer", 13)} حفظ وطباعة فاتورة رسمية</button>
            <button class="btn btn-primary" id="saveInvOnlyBtn" type="button">${getSvgIcon("check", 13)} حفظ فقط</button>
          </div>
        </div>
      </div>
    `;

    overlay.querySelector('#closeInvModal').onclick = ()=>overlay.remove();
    overlay.querySelector('#cancelInvModalBtn').onclick = ()=>overlay.remove();

    const custSelect = overlay.querySelector('#invCustomerSelect');
    if(custSelect){
      custSelect.onchange = (e)=>{
        const val = e.target.value;
        const titleInp = overlay.querySelector('#invCustTitle');
        const nameInp = overlay.querySelector('#invCustName');
        const phoneInp = overlay.querySelector('#invCustPhone');
        const taxInp = overlay.querySelector('#invCustTax');
        const addrInp = overlay.querySelector('#invCustAddr');
        if(val === '__WALKIN__'){
          if(titleInp) titleInp.value = ''; nameInp.value = 'عميل زائر'; phoneInp.value = '0000000000'; taxInp.value = ''; addrInp.value = '';
        } else if(val === '__NEW__'){
          if(titleInp) titleInp.value = ''; nameInp.value = ''; phoneInp.value = ''; taxInp.value = ''; addrInp.value = ''; nameInp.focus();
        } else if(val){
          const found = state.customers.find(c => c.name === val);
          if(found){
            if(titleInp) titleInp.value = found.title || '';
            nameInp.value = found.name;
            phoneInp.value = found.phone || '';
            taxInp.value = found.taxNumber || '';
            addrInp.value = found.address || '';
          }
        }
      };
    }

    overlay.querySelector('#quickWalkInCustBtn').onclick = ()=>{ custSelect.value = '__WALKIN__'; custSelect.dispatchEvent(new Event('change')); };
    overlay.querySelector('#quickNewCustBtn').onclick = ()=>{ custSelect.value = '__NEW__'; custSelect.dispatchEvent(new Event('change')); };

    overlay.querySelectorAll('[data-linefield]').forEach(inp => {
      inp.oninput = (e)=>{
        const idx = Number(inp.dataset.idx);
        const fld = inp.dataset.linefield;
        inv.Items[idx][fld] = fld==='Name' ? e.target.value : Number(e.target.value)||0;
      };
      inp.onblur = ()=>renderModal();
    });

    overlay.querySelectorAll('[data-delline]').forEach(btn => {
      btn.onclick = ()=>{
        if(inv.Items.length<=1){ showToast('يجب وجود بند واحد على الأقل', 'error'); return; }
        inv.Items.splice(Number(btn.dataset.delline), 1);
        renderModal();
      };
    });

    overlay.querySelector('#addInvLineBtn').onclick = ()=>{ inv.Items.push({ Name: '', Qty: 1, Price: 0, Total: 0 }); renderModal(); };

    overlay.querySelector('#addFromInventoryBtn').onclick = ()=>{
      openInventoryPickerModal((pickedItem)=>{
        inv.Items.push({
          Name: pickedItem.Name,
          Qty: 1,
          Price: Number(pickedItem.SellPrice||pickedItem.PurchasePrice||0),
          Total: Number(pickedItem.SellPrice||pickedItem.PurchasePrice||0)
        });
        renderModal();
      });
    };

    overlay.querySelector('#invTaxPercentSelect').onchange = (e)=>{ inv.TaxPercent = Number(e.target.value); renderModal(); };
    const taxIncCheck = overlay.querySelector('#invTaxInclusiveCheck');
    if(taxIncCheck) taxIncCheck.onchange = (e)=>{ inv.IsTaxInclusive = e.target.checked; renderModal(); };
    overlay.querySelector('#invDiscountInput').oninput = (e)=>{ inv.Discount = Number(e.target.value)||0; };
    overlay.querySelector('#invDiscountInput').onblur = ()=>renderModal();
    overlay.querySelector('#invPaidInput').oninput = (e)=>{ inv.AmountPaid = Number(e.target.value)||0; };
    overlay.querySelector('#invPaidInput').onblur = ()=>renderModal();

    const unlockBtn = overlay.querySelector('#unlockPaidInvBtn');
    if(unlockBtn){
      unlockBtn.onclick = async ()=>{
        const auth = await promptSupervisorApproval({
          action: 'تعديل بنود وإجمالي فاتورة مسددة',
          details: `فاتورة #${existingInv.InvoiceNumber} للعميل (${existingInv.CustomerName}) - المسدد: ${Number(existingInv.AmountPaid).toLocaleString()} ج.م من أصل ${Number(existingInv.Total).toLocaleString()} ج.م`
        });
        if(auth && auth.approved){
          editAuthorized = true;
          authorizedBy = auth.adminName || (state.user ? state.user.name : 'المدير');
          showToast(`تم فتح تعديل الفاتورة بتصريح المشرف (${authorizedBy})`, 'success');
          renderModal();
        }
      };
    }

    function collectData(){
      inv.CustomerTitle = (overlay.querySelector('#invCustTitle')?.value || '').trim();
      inv.CustomerName = overlay.querySelector('#invCustName').value.trim();
      inv.CustomerPhone = overlay.querySelector('#invCustPhone').value.trim();
      inv.CustomerTaxNumber = overlay.querySelector('#invCustTax').value.trim();
      inv.CustomerAddress = overlay.querySelector('#invCustAddr').value.trim();
      inv.Date = overlay.querySelector('#invDate').value;
      inv.DueDate = overlay.querySelector('#invDueDate').value;
      inv.PaymentMethod = overlay.querySelector('#invPaymentMethod').value;
      inv.Notes = overlay.querySelector('#invNotesText').value.trim();
      inv.IsTaxInclusive = Boolean(overlay.querySelector('#invTaxInclusiveCheck')?.checked);
      inv.ItemsSummary = inv.Items.map(i=>i.Name).filter(Boolean).join(' + ');
      inv.ItemsJSON = JSON.stringify(inv.Items);
    }

    async function handleSave(andPrint, docType='invoice'){
      collectData();
      if(!inv.CustomerName){ showToast('يرجى اختيار اسم العميل', 'error'); return; }
      if(!inv.Items.length || !inv.Items[0].Name){ showToast('يرجى إضافة بنود للفاتورة', 'error'); return; }

      // 1. Below-cost check in invoice items [F10]
      const belowCostInvItems = [];
      for(const it of inv.Items){
        if(!it || !it.Name) continue;
        const invItem = (state.inventory||[]).find(x => x.Name === it.Name || String(x.ID) === String(it.ItemId || it.id));
        const buyPrice = Number(it.PurchasePrice != null ? it.PurchasePrice : (invItem ? invItem.PurchasePrice : 0));
        const sellPrice = Number(it.Price || 0);
        if(buyPrice > 0 && sellPrice < buyPrice - 0.005){
          belowCostInvItems.push({ name: it.Name, price: sellPrice, cost: buyPrice });
        }
      }

      if(belowCostInvItems.length > 0){
        const auth = await promptSupervisorApproval({
          action: 'بيع بأقل من التكلفة في الفاتورة',
          details: `أصناف بسعر بيع أقل من سعر الشراء: (${belowCostInvItems.map(x=>`${x.name}: بيع ${x.price} ج.م / تكلفة ${x.cost} ج.م`).join('، ')})`
        });
        if(!auth || !auth.approved){
          return;
        }
      }

      // 2. Paid Invoice Lock Verification & Adjustment Journal [F10]
      if(isPaidLocked){
        const itemsChanged = JSON.stringify(inv.Items) !== JSON.stringify(existingInv.Items);
        const totalChanged = Math.abs(Number(inv.Total || 0) - Number(existingInv.Total || 0)) > 0.005;

        if((itemsChanged || totalChanged) && !editAuthorized){
          showToast('لا يمكن تعديل بنود أو إجمالي فاتورة مسددة دون تصريح إداري', 'error');
          return;
        }

        if(editAuthorized && (itemsChanged || totalChanged)){
          const oldTot = Number(existingInv.Total || 0);
          const newTot = Number(inv.Total || 0);
          const diff = Math.round((newTot - oldTot) * 100) / 100;

          if(Math.abs(diff) > 0.005){
            const isDebit = diff > 0;
            const absDiff = Math.abs(diff);
            const adjLines = [
              {
                AccountCode: isDebit ? '1103' : '4102',
                AccountName: isDebit ? 'حساب العميل (مدينون عملاء)' : 'مردودات ومسموحات مبيعات الأجهزة والإكسسوار',
                Debit: absDiff,
                Credit: 0,
                Notes: `تسوية تعديل إجمالي فاتورة مسددة #${inv.InvoiceNumber} بتصريح المشرف (${authorizedBy})`
              },
              {
                AccountCode: isDebit ? '4102' : '1103',
                AccountName: isDebit ? 'إيرادات مبيعات الأجهزة والإكسسوار' : 'حساب العميل (مدينون عملاء)',
                Debit: 0,
                Credit: absDiff,
                Notes: `تسوية فارق إجمالي فاتورة مسددة #${inv.InvoiceNumber} (السابق: ${oldTot} -> الجديد: ${newTot})`
              }
            ];

            await recordAutoJournalEntry(
              `تسوية تعديل فاتورة مسددة #${inv.InvoiceNumber} للعميل: ${inv.CustomerName}`,
              'Invoice_Adjustment',
              inv.ID,
              adjLines
            );
          }

          recordAuditLog(
            'تعديل فاتورة مسددة',
            'الفواتير',
            `تم تعديل الفاتورة المسددة #${inv.InvoiceNumber} بتصريح المشرف (${authorizedBy}). الإجمالي السابق: ${oldTot} ج.م -> الإجمالي الجديد: ${newTot} ج.م (فارق: ${diff} ج.م) - المسدد: ${existingInv.AmountPaid} ج.م`,
            inv.ID
          );

          inv.supervisorAuth = authorizedBy;
          inv.skipAutoJournal = true;
        }
      }
      try{
        await saveInvoiceRemote(inv);
        showToast(`تم حفظ ${docType==='quote'?'عرض السعر':'الفاتورة'} بنجاح (${inv.InvoiceNumber})`, 'success');
        overlay.remove();
        const main = document.getElementById('main');
        if(state.currentSection === 'invoices' && main){
          renderInvoicesPage(main);
        } else if(state.currentSection === 'maintenance' && state.tab === 'invoices' && main){
          renderInvoicesPage(main);
        } else if(state.currentSection === 'maintenance'){
          renderMain();
        }
        if(andPrint) openInvoicePrint(inv, docType);
      }catch(e){
        showToast('خطأ في حفظ البيانات', 'error');
      }
    }

    overlay.querySelector('#saveInvOnlyBtn').onclick = ()=>handleSave(false);
    overlay.querySelector('#saveAndPrintInvBtn').onclick = ()=>handleSave(true, 'invoice');
    overlay.querySelector('#saveAndPrintQuoteBtn').onclick = ()=>handleSave(true, 'quote');
  }

  document.body.appendChild(overlay);
  renderModal();
}

function openInventoryPickerModal(onSelect){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:550px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
        <h3 style="margin:0;font-size:16px;display:flex;align-items:center;gap:6px;">${getSvgIcon("inventory", 16)} اختر صنف من المخزن</h3>
        <button class="btn btn-ghost btn-xs" id="closeInvPicker">&times;</button>
      </div>
      <div class="field" style="margin-bottom:10px;">
        <input id="pickerSearch" placeholder="بحث باسم الصنف أو الباركود..." autofocus>
      </div>
      <div id="pickerListMount" style="max-height:340px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#closeInvPicker').onclick = ()=>overlay.remove();

  function renderList(q=''){
    const box = overlay.querySelector('#pickerListMount');
    let list = state.inventory || [];
    if(q){
      list = list.filter(it => it.Name.toLowerCase().includes(q.toLowerCase()) || String(it.Barcode||'').includes(q));
    }
    if(!list.length){
      box.innerHTML = '<div class="empty">لا توجد أصناف مطابقة.</div>';
      return;
    }
    box.innerHTML = list.map(it => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--paper3);border-radius:var(--radius-sm);border:1px solid var(--line);cursor:pointer;" data-pickid="${it.ID}">
        <div>
          <div style="font-weight:800;font-size:13px;">${it.Name}</div>
          <div class="mono" style="font-size:11px;color:var(--ink-secondary);">باركود: ${it.Barcode||'-'} | المتاح: <b>${it.Quantity}</b></div>
        </div>
        <div class="mono font-bold" style="color:var(--green);font-size:13.5px;">${Number(it.SellPrice||it.PurchasePrice||0).toLocaleString()} ج.م</div>
      </div>
    `).join('');

    box.querySelectorAll('[data-pickid]').forEach(el => {
      el.onclick = ()=>{
        const found = state.inventory.find(x=>x.ID===el.dataset.pickid);
        if(found){ onSelect(found); overlay.remove(); }
      };
    });
  }

  renderList();
  overlay.querySelector('#pickerSearch').oninput = (e)=>renderList(e.target.value.trim());
}

/* ---------------- Print Luxury Tax Invoice / Price Quotation (A4 / A5) ---------------- */
function openInvoicePrint(inv, docType='invoice'){
  document.body.classList.remove('printing-sticker');
  const old = document.getElementById('printMount');
  if(old) old.remove();
  const mount = document.createElement('div');
  mount.id='printMount';

  const isQuote = docType === 'quote';
  const docTitle = isQuote ? 'عرض أسعار وبيان سعر • Price Quotation' : 'فاتورة ضريبية رسمية • Tax Invoice';
  const trackQrData = `${isQuote?'Quote':'Invoice'}:${inv.InvoiceNumber}|Customer:${inv.CustomerName}|Total:${inv.Total}|Date:${cleanDate(inv.Date)}`;
  const qrSvgHtml = QRCodeGenerator.toSvg(trackQrData, 56);

  mount.innerHTML = `
  <div style="width:100%;max-width:700px;margin:0 auto;background:#fff;padding:24px 28px;color:#0f172a;font-family:var(--font-main);border-radius:8px;box-sizing:border-box;">
    <!-- Invoice/Quote Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:14px;">
      <div>
        ${state.settings.logoUrl ? `<img src="${state.settings.logoUrl}" style="max-height:38px;max-width:140px;object-fit:contain;margin-bottom:4px;">` : ''}
        <h2 style="margin:0;font-size:20px;font-weight:900;color:#0f172a;">${escapeHtml(state.settings.shopName || 'صيانة ميكروتك')}</h2>
        <div style="font-size:11px;color:#475569;margin-top:2px;">${docTitle}</div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:58px;height:58px;border:1px solid #cbd5e1;border-radius:4px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#fff;">
          ${qrSvgHtml}
        </div>
        <div style="text-align:left;">
          <div style="background:${isQuote?'#0284c7':'#0f172a'};color:#fff;font-size:14px;font-weight:900;padding:3px 12px;border-radius:4px;display:inline-block;" class="mono">${inv.InvoiceNumber}</div>
          <div style="font-size:11px;color:#475569;margin-top:3px;">التاريخ: <b>${cleanDate(inv.Date)}</b></div>
          <div style="font-size:10.5px;color:#64748b;">الصلاحية / الاستحقاق: <b>${cleanDate(inv.DueDate)}</b></div>
        </div>
      </div>
    </div>

    <!-- Customer & Meta Grid -->
    <div style="display:grid;grid-template-columns: 1fr 1fr;gap:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 14px;margin-bottom:16px;font-size:12px;">
      <div>
        <div style="color:#64748b;font-size:11px;margin-bottom:2px;">بيانات العميل / المشتري:</div>
        <div style="font-size:14px;font-weight:900;color:#0f172a;">${inv.CustomerName}</div>
        <div class="mono" style="color:#334155;margin-top:2px;">هاتف: ${inv.CustomerPhone || 'غير محدد'}</div>
        ${inv.CustomerTaxNumber ? `<div style="font-size:11px;color:#475569;margin-top:2px;">الرقم الضريبي: <b>${inv.CustomerTaxNumber}</b></div>` : ''}
        ${inv.CustomerAddress ? `<div style="font-size:11px;color:#475569;">العنوان: ${inv.CustomerAddress}</div>` : ''}
      </div>
      <div style="text-align:left;">
        <div style="color:#64748b;font-size:11px;margin-bottom:2px;">تفاصيل المستند:</div>
        <div>نوع المستند: <b style="color:${isQuote?'#0284c7':'#0f172a'};">${isQuote ? 'عرض أسعار / بيان تكلفة' : 'فاتورة مبيعات وخدمات'}</b></div>
        <div>طريقة السداد: <b>${inv.PaymentMethod||'نقدي'}</b></div>
        ${!isQuote ? `<div>حالة الفاتورة: <b style="color:${inv.Remaining<=0?'#16a34a':'#e11d48'};">${inv.Status}</b></div>` : ''}
        ${inv.ReferenceType ? `<div style="font-size:11px;color:#2563eb;margin-top:2px;">مرجع: ${inv.ReferenceType==='Receipt'?'إيصال صيانة #':inv.ReferenceType} ${inv.ReferenceID}</div>` : ''}
      </div>
    </div>

    <!-- Items Table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:11.5px;">
      <thead>
        <tr style="background:#0f172a;color:#fff;">
          <th style="padding:7px 10px;text-align:right;">#</th>
          <th style="padding:7px 10px;text-align:right;">بيان الصنف أو الخدمة</th>
          <th style="padding:7px 10px;text-align:center;">الكمية</th>
          <th style="padding:7px 10px;text-align:center;">سعر الوحدة</th>
          <th style="padding:7px 10px;text-align:center;">الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${(inv.Items||[]).map((it, idx)=>`
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:7px 10px;color:#64748b;" class="mono">${idx+1}</td>
            <td style="padding:7px 10px;font-weight:700;">${it.Name}</td>
            <td style="padding:7px 10px;text-align:center;" class="mono">${it.Qty||1}</td>
            <td style="padding:7px 10px;text-align:center;" class="mono">${Number(it.Price||0).toLocaleString()} ج.م</td>
            <td style="padding:7px 10px;text-align:center;font-weight:900;" class="mono">${(Number(it.Qty||1)*Number(it.Price||0)).toLocaleString()} ج.م</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals Summary Box -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:18px;">
      <div style="flex:1;font-size:11px;color:#475569;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:6px;padding:10px 12px;line-height:1.6;">
        <b>${isQuote ? 'شروط وأحكام عرض السعر:' : 'ملاحظات وشروط الضمان:'}</b>
        <div>${inv.Notes || (isQuote ? '• هذا البيان يعتبر عرض أسعار رسمي صالح لمدة 7 أيام من تاريخ إصداره.\n• الأسعار والكميات الموضحة خاضعة للتوافر والتأكيد النهائي عند بدء التنفيذ.' : 'البضاعة المباعة تخضع للضمان المحدد بالفاتورة. لا يُقبل الاسترجاع إلا بوجود أصل الفاتورة.')}</div>
      </div>
      <div style="width:240px;background:#f1f5f9;border-radius:6px;padding:10px 14px;font-size:11.5px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span>المجموع الفرعي:</span>
          <span class="mono font-bold">${Number(inv.Subtotal||0).toLocaleString()} ج.م</span>
        </div>
        ${Number(inv.TaxAmount||0)>0 ? `
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#2563eb;">
            <span>ضريبة القيمة المضافة (${inv.TaxPercent}%):</span>
            <span class="mono font-bold">${Number(inv.TaxAmount).toLocaleString()} ج.م</span>
          </div>
        ` : ''}
        ${Number(inv.Discount||0)>0 ? `
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;color:#e11d48;">
            <span>الخصم الممنوح:</span>
            <span class="mono font-bold">-${Number(inv.Discount).toLocaleString()} ج.م</span>
          </div>
        ` : ''}
        <div style="display:flex;justify-content:space-between;border-top:2px solid #0f172a;padding-top:6px;margin-top:4px;font-size:13.5px;font-weight:900;color:#0f172a;">
          <span>الإجمالي النهائي:</span>
          <span class="mono">${Number(inv.Total||0).toLocaleString()} ج.م</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:4px;color:#16a34a;font-weight:700;">
          <span>المدفوع:</span>
          <span class="mono">${Number(inv.AmountPaid||0).toLocaleString()} ج.م</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:4px;color:${Number(inv.Remaining||0)>0?'#e11d48':'#16a34a'};font-weight:900;">
          <span>المتبقي:</span>
          <span class="mono">${Number(inv.Remaining||0).toLocaleString()} ج.م</span>
        </div>
      </div>
    </div>

    <!-- Signatures Row -->
    <div style="display:flex;justify-content:space-between;margin-top:20px;font-size:11px;color:#475569;border-top:1px solid #e2e8f0;padding-top:12px;">
      <div style="text-align:center;width:40%;">
        <div>توقيع المستلم / العميل</div>
        <div style="margin-top:25px;border-bottom:1px dashed #94a3b8;width:80%;margin-left:auto;margin-right:auto;"></div>
      </div>
      <div style="text-align:center;width:40%;">
        <div>ختم وتوقيع الإدارة المالية</div>
        <div style="margin-top:25px;border-bottom:1px dashed #94a3b8;width:80%;margin-left:auto;margin-right:auto;"></div>
      </div>
    </div>
  </div>`;

  document.body.appendChild(mount);
  setTimeout(()=>{ window.print(); mount.remove(); }, 250);
}
