
/* Global direct handlers for receipt row actions - 100% immune to listener drops */
window.openReceiptDetailModal = function(receiptId, receiptNum){
  try{
    const r = findReceiptByIdOrNum(receiptId, receiptNum);
    if(!r){
      console.warn('Receipt not found for id/num:', receiptId, receiptNum);
      showToast('لم يتم العثور على الإيصال المطلوب', 'error');
      return;
    }
    openReceiptDetail(r);
  }catch(err){
    console.error('Error in openReceiptDetailModal:', err);
    showToast('حدث خطأ أثناء فتح الإيصال: ' + (err.message || err), 'error');
  }
};

window.openReIntakeModalDirect = function(receiptId, receiptNum){
  try{
    const r = findReceiptByIdOrNum(receiptId, receiptNum);
    if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }
    openReIntakeDeviceModal(r);
  }catch(err){
    console.error('Error in openReIntakeModalDirect:', err);
    showToast('حدث خطأ أثناء فتح إعادة الصيانة: ' + (err.message || err), 'error');
  }
};

window.convertReceiptToInvoiceDirect = function(receiptId, receiptNum){
  try{
    const r = findReceiptByIdOrNum(receiptId, receiptNum);
    if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }
    convertReceiptToInvoice(r.id || r.receiptNumber);
  }catch(err){
    console.error('Error in convertReceiptToInvoiceDirect:', err);
    showToast('حدث خطأ أثناء التحويل لفاتورة: ' + (err.message || err), 'error');
  }
};

window.openQuickStatusModalDirect = function(receiptId, receiptNum){
  try{
    const r = findReceiptByIdOrNum(receiptId, receiptNum);
    if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }
    openQuickStatusModal(r);
  }catch(err){
    console.error('Error in openQuickStatusModalDirect:', err);
    showToast('حدث خطأ أثناء فتح تغيير الحالة: ' + (err.message || err), 'error');
  }
};

window.openStickerPrintDirect = function(receiptId, receiptNum, evt){
  try{
    const r = findReceiptByIdOrNum(receiptId, receiptNum);
    if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }
    const ev = evt || (typeof window !== 'undefined' ? window.event : null);
    const forceModal = ev ? (ev.shiftKey || ev.altKey) : false;
    openStickerPrint(r, forceModal);
  }catch(err){
    console.error('Error in openStickerPrintDirect:', err);
    showToast('حدث خطأ أثناء فتح طباعة الملصق: ' + (err.message || err), 'error');
  }
};

window.openStickerOptionsDirect = function(receiptId, receiptNum){
  try{
    const r = findReceiptByIdOrNum(receiptId, receiptNum);
    if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }
    openStickerPrint(r, true);
  }catch(err){
    console.error('Error in openStickerOptionsDirect:', err);
    showToast('حدث خطأ أثناء فتح إعدادات الملصق: ' + (err.message || err), 'error');
  }
};

window.openWhatsappDirect = function(receiptId, receiptNum){
  try{
    const r = findReceiptByIdOrNum(receiptId, receiptNum);
    if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }
    openWhatsapp(r);
  }catch(err){
    console.error('Error in openWhatsappDirect:', err);
    showToast('حدث خطأ أثناء فتح رسائل واتساب: ' + (err.message || err), 'error');
  }
};

window.openCostEstimateModalDirect = function(receiptId, receiptNum){
  try{
    const r = findReceiptByIdOrNum(receiptId, receiptNum);
    if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }
    openCostEstimateModal(r);
  }catch(err){
    console.error('Error in openCostEstimateModalDirect:', err);
    showToast('حدث خطأ أثناء فتح نافذة مقايسة التكلفة: ' + (err.message || err), 'error');
  }
};

window.openReceiptPrintDirect = function(receiptId, receiptNum, kind='receipt'){
  try{
    const r = findReceiptByIdOrNum(receiptId, receiptNum);
    if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }
    openReceiptPrint(r, kind);
  }catch(err){
    console.error('Error in openReceiptPrintDirect:', err);
    showToast('حدث خطأ أثناء تجهيز الطباعة: ' + (err.message || err), 'error');
  }
};

window.deleteReceiptDirect = function(receiptId, receiptNum){
  try{
    const r = findReceiptByIdOrNum(receiptId, receiptNum);
    if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }
    const cName = (r.customer && r.customer.name) || 'عميل';
    requestAdminAuthorization({
      action: 'حذف إيصال صيانة',
      entityType: 'إيصال صيانة',
      entityId: r.id || r.receiptNumber,
      entityTitle: `#${r.receiptNumber} (${cName})`,
      onApproved: async ()=>{
        try{
          await deleteReceiptRemote(r.id || r.receiptNumber);
          state.receipts = (state.receipts || []).filter(x=>String(x.id)!==String(r.id) && String(x.receiptNumber)!==String(r.receiptNumber));
          showToast(`تم حذف الإيصال #${r.receiptNumber} بنجاح`, 'success');
          renderMain();
        }catch(e){ showToast('تعذر الحذف: '+e.message, 'error'); }
      }
    });
  }catch(err){
    console.error('Error in deleteReceiptDirect:', err);
    showToast('حدث خطأ: ' + (err.message || err), 'error');
  }
};

window.openReceiptRefundModalDirect = function(receiptId, receiptNum){
  try{
    const r = findReceiptByIdOrNum(receiptId, receiptNum);
    if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }
    openReceiptRefundModal(r.id || r.receiptNumber, r.receiptNumber);
  }catch(err){
    console.error('Error in openReceiptRefundModalDirect:', err);
    showToast('حدث خطأ: ' + (err.message || err), 'error');
  }
};

window.openReceiptRefundModal = function(receiptId, receiptNum){
  const r = findReceiptByIdOrNum(receiptId, receiptNum);
  if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }

  const cName = extractCustomerName(r) || (r.customer && r.customer.name) || 'عميل';
  const cPhone = extractCustomerPhone(r) || (r.customer && r.customer.phone) || '-';
  const rNum = String(r.receiptNumber || r.id);
  const totalPaid = Number(r.deposit || 0);
  const alreadyRefunded = Number(r.refunded || 0);
  const maxRefundable = Math.max(0, totalPaid - alreadyRefunded);

  if(maxRefundable <= 0){
    showToast(`لا توجد مبالغ مدفوعة قابلة للاسترداد لهذا الإيصال (إجمالي المدفوع: ${totalPaid.toLocaleString()} ج.م، المسترد: ${alreadyRefunded.toLocaleString()} ج.م)`, 'warning');
    return;
  }

  const prevModal = document.getElementById('receiptRefundModal');
  if(prevModal) prevModal.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'receiptRefundModal';
  overlay.style.zIndex = '12000';

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:540px;padding:22px;border-radius:18px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid var(--line);padding-bottom:12px;margin-bottom:16px;">
        <div>
          <h3 style="margin:0;font-size:16px;font-weight:900;color:var(--red);display:flex;align-items:center;gap:6px;">
            ${getSvgIcon('arrowLeft', 16)} استرداد نقدي لعميل صيانة (مردودات)
          </h3>
          <div style="font-size:12px;color:var(--ink-secondary);margin-top:2px;">
            إيصال رقم: <b class="mono" style="color:var(--primary);">#${escapeHtml(rNum)}</b> • العميل: <b>${escapeHtml(cName)}</b> (${escapeHtml(cPhone)})
          </div>
        </div>
        <button class="btn btn-ghost btn-xs" id="closeReceiptRefundModalBtn" style="font-size:18px;line-height:1;">&times;</button>
      </div>

      <!-- Financial Snapshot -->
      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;background:var(--paper2);padding:10px 12px;border-radius:10px;border:1px solid var(--line);margin-bottom:16px;text-align:center;">
        <div>
          <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">إجمالي المدفوع</div>
          <div class="mono font-bold" style="font-size:14px;color:var(--green);">${totalPaid.toLocaleString()} ج.م</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">مسترد سابقاً</div>
          <div class="mono font-bold" style="font-size:14px;color:var(--amber);">${alreadyRefunded.toLocaleString()} ج.م</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--ink-secondary);font-weight:700;">الحد الأقصى للرد</div>
          <div class="mono font-bold" style="font-size:14px;color:var(--red);">${maxRefundable.toLocaleString()} ج.م</div>
        </div>
      </div>

      <!-- Form Inputs -->
      <div class="field" style="margin-bottom:12px;">
        <label style="font-weight:700;font-size:12px;">المبلغ المراد استرداده (ج.م) *</label>
        <input type="number" id="receiptRefundAmt" min="1" max="${maxRefundable}" step="1" value="${maxRefundable}" class="mono font-bold" style="font-size:16px;color:var(--red);">
        <div style="font-size:11px;color:var(--ink-secondary);margin-top:3px;">
          الحد الأقصى المتاح للاسترداد: <b class="mono">${maxRefundable}</b> ج.م
        </div>
      </div>

      <div class="field" style="margin-bottom:12px;">
        <label style="font-weight:700;font-size:12px;">طريقة / قناة الاسترداد *</label>
        <select id="receiptRefundMethod" style="font-weight:700;">
          <option value="نقدي (كاش)">نقداً من الخزينة الرئيسية بالدرج (ح/ 1101)</option>
          <option value="بنك / تحويل إلكتروني">البنك والمحافظ الإلكترونية (ح/ 1102)</option>
          <option value="آجل (تسوية حساب العميل)">تسوية حساب العميل الآجل (ح/ 1103)</option>
        </select>
      </div>

      <div class="field" style="margin-bottom:16px;">
        <label style="font-weight:700;font-size:12px;">سبب الاسترداد الإلزامي *</label>
        <input id="receiptRefundReason" placeholder="مثال: إلغاء الصيانة لتعذر توفر القطع، استرداد عربون، عيب صيانة..." style="font-size:12.5px;">
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);padding-top:14px;">
        <button class="btn btn-ghost btn-sm" id="cancelReceiptRefundBtn">إلغاء</button>
        <button class="btn btn-red btn-sm" id="confirmReceiptRefundBtn" style="font-weight:800;padding:8px 18px;">
          تأكيد الاسترداد وقيد اليومية ↩️
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#closeReceiptRefundModalBtn').onclick = () => overlay.remove();
  overlay.querySelector('#cancelReceiptRefundBtn').onclick = () => overlay.remove();

  const confirmBtn = overlay.querySelector('#confirmReceiptRefundBtn');
  confirmBtn.onclick = async () => {
    const amt = parseFloat(overlay.querySelector('#receiptRefundAmt').value) || 0;
    const method = overlay.querySelector('#receiptRefundMethod').value || 'نقدي (كاش)';
    const reason = (overlay.querySelector('#receiptRefundReason').value || '').trim();

    if(amt <= 0){
      showToast('يرجى إدخال مبلغ استرداد صحيح أكبر من صفر', 'error');
      return;
    }
    if(amt > maxRefundable){
      showToast(`مبلغ الاسترداد (${amt}) يتجاوز الحد الأقصى القابل للرد (${maxRefundable})`, 'error');
      return;
    }
    if(!reason || reason.length < 3){
      showToast('سبب الاسترداد إلزامي (3 أحرف على الأقل)', 'warning');
      overlay.querySelector('#receiptRefundReason').focus();
      return;
    }

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'جارٍ تسجيل الاسترداد...';

    try {
      const nowDate = new Date();
      const dateStr = nowDate.toISOString().slice(0, 10);
      const timeStr = nowDate.toTimeString().slice(0, 8);
      const userStr = state.user ? state.user.name : 'كاشير';
      const shiftId = state.activeShift ? state.activeShift.id : '';

      // 1. Update Receipt
      r.refunded = Number(r.refunded || 0) + amt;
      r.refundMethod = method;
      r.refundReason = reason;
      r.refundDate = dateStr;
      r.refundTime = timeStr;
      r.refundShiftId = shiftId;
      r.updatedAt = nowDate.toISOString();
      r.updatedBy = userStr;

      if(!Array.isArray(r.refunds)) r.refunds = [];
      r.refunds.push({
        amount: amt,
        method: method,
        reason: reason,
        date: dateStr,
        time: timeStr,
        by: userStr,
        shiftId: shiftId
      });

      // Recalculate remaining on receipt
      r.remaining = (typeof getReceiptRemaining === 'function') ? getReceiptRemaining(r) : Math.max(0, (Number(r.cost || 0) + Number(r.partsCost || 0) + Number(r.otherAccountAmount || 0)) - Number(r.deposit || 0) + Number(r.refunded || 0));

      await saveReceiptRemote(r);

      // 2. Journal Entry (Receipt_Void)
      // Dr 4101 (مردودات خدمات صيانة وتصليح) / Cr 1101 (الخزينة) or 1102 (البنك) or 1103 (العملاء)
      const mLow = method.toLowerCase();
      const isBank = mLow.includes('بنك') || mLow.includes('فيزا') || mLow.includes('card') || mLow.includes('محفظ') || mLow.includes('إلكتروني');
      const isCredit = mLow.includes('آجل') || mLow.includes('حساب');
      const creditAccCode = isBank ? '1102' : (isCredit ? '1103' : '1101');
      const creditAccName = isBank ? 'البنك والحسابات الإلكترونية والمحافظ' : (isCredit ? 'العملاء والمدينون' : 'الخزينة الرئيسية (النقدية بالدرج)');

      const lines = [
        {
          AccountCode: '4101',
          AccountName: 'مردودات خدمات صيانة وتصليح',
          Debit: amt,
          Credit: 0,
          Notes: `استرداد مبالغ صيانة للعميل: ${cName} (إيصال #${rNum}) - سبب: ${reason}`
        },
        {
          AccountCode: creditAccCode,
          AccountName: creditAccName,
          Debit: 0,
          Credit: amt,
          Notes: `صرف مردودات صيانة عبر ${method} - إيصال #${rNum}`
        }
      ];

      await recordAutoJournalEntry(
        `استرداد مبالغ صيانة إيصال #${rNum} للعميل: ${cName}`,
        'Receipt_Void',
        String(r.id || r.receiptNumber),
        lines
      );

      // 3. Audit Log
      recordAuditLog(
        'استرداد مبالغ صيانة',
        'صيانة',
        `تم استرداد مبلغ ${amt} ج.م للعميل (${cName}) عن إيصال صيانة #${rNum} عبر (${method}) - السبب: ${reason}`,
        String(r.id || r.receiptNumber)
      );

      overlay.remove();
      showToast(`تم استرداد ${amt} ج.م بنجاح وتحديث الحسابات والخزينة`, 'success');

      // Refresh screens
      if(state.currentSection === 'receipts' || state.currentSection === 'service'){
        renderMain();
      } else if(state.currentSection === 'daily'){
        if(typeof renderDailyJournalPage === 'function') renderDailyJournalPage(document.getElementById('main'));
      }
    } catch(err){
      console.error('Receipt refund error:', err);
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'تأكيد الاسترداد وقيد اليومية ↩️';
      showToast('حدث خطأ أثناء معالجة الاسترداد: ' + (err.message || err), 'error');
    }
  };
};

/* ==========================================================================
   UNIFIED ACTIONS & SELECTION ENGINE (المحرك الموحد للاختيار وإجراءات البرنامج)
   ========================================================================== */

window.startNewReceiptForCustomer = function(name, phone, title=''){
  startNewDraft(true);
  state.draft.customer.title = title || '';
  state.draft.customer.name = name || '';
  state.draft.customer.phone = phone || '';
  state.tab = 'new';
  triggerDraftAutosave(true);
  renderMain();
};

window.startNewInvoiceForCustomer = function(name, phone, title=''){
  const newInv = {
    InvoiceNumber: typeof nextInvoiceNumber === 'function' ? nextInvoiceNumber() : '',
    Date: typeof localDateStr === 'function' ? localDateStr() : new Date().toISOString().slice(0, 10),
    DueDate: typeof localDateStr === 'function' ? localDateStr() : new Date().toISOString().slice(0, 10),
    CustomerTitle: title || '',
    CustomerName: name || '',
    CustomerPhone: phone || '',
    Type: 'مبيعات',
    Items: [],
    Subtotal: 0, TaxPercent: 0, TaxAmount: 0, Discount: 0, Total: 0, AmountPaid: 0, Remaining: 0,
    Status: 'غير مدفوعة (آجلة)', PaymentMethod: 'نقدي'
  };
  openInvoiceModal(newInv, true);
};

window.viewCustomerReceiptsInArchive = function(custName){
  state.tab = 'archive';
  state.archiveFilter.q = custName || '';
  renderMain();
};

window.renderUnifiedSelectionBar = function(){
  const topSlot = document.getElementById('unifiedSelectionTopSlot');
  if(!topSlot){
    const existing = document.getElementById('unifiedSelectionBar');
    if(existing && existing.parentElement !== topSlot) existing.remove();
    return;
  }

  let bar = document.getElementById('unifiedSelectionBar');
  if(!bar){
    bar = document.createElement('div');
    bar.id = 'unifiedSelectionBar';
    topSlot.appendChild(bar);
  } else if(bar.parentElement !== topSlot){
    topSlot.appendChild(bar);
  }

  const isQuoSection = (state.currentSection === 'cameras' && state.camTab === 'quotes') || (state.currentSection === 'quotations');
  const isSupSection = (state.currentSection === 'inventory' && state.invHubTab === 'suppliers') || (state.tab === 'suppliers');
  const isPurSection = (state.currentSection === 'inventory' && state.invHubTab === 'purchases');
  const isInv = ((state.currentSection === 'inventory' && state.invHubTab !== 'suppliers' && state.invHubTab !== 'purchases') || (state.tab === 'inventory')) && !isSupSection && !isPurSection;
  const isInvoiceSection = (state.currentSection === 'invoices') || (state.tab === 'invoices') || (state.financeTab === 'invoices');
  const isPosSalesLog = (state.currentSection === 'pos' && state.posTab === 'salesLog');

  // Context 0.01: Quotation Selected
  if(isQuoSection && state.selectedQuotationId){
    const q = (state.quotations || []).find(x => String(x.ID) === String(state.selectedQuotationId));
    if(q){
      const total = Number(q.Total || 0);
      const paid = Number(q.PaidAmount || 0);
      const rem = Math.max(0, total - paid);
      const cName = q.ClientName || 'عميل';
      const qId = String(q.ID || '').slice(-8);

      bar.className = 'unified-selection-bar active';
      bar.innerHTML = `
        <div class="unified-bar-info">
          <div class="unified-bar-badge" style="background:#f5f3ff;color:#7c3aed;">
            <span>${getSvgIcon("fileText", 13)} عرض سعر مختار</span>
            <b class="mono" style="direction:ltr;unicode-bidi:isolate;">#${escapeHtml(qId)}</b>
          </div>
          <div style="font-size:12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span style="font-weight:800;color:var(--ink);">${escapeHtml(cName)}</span>
            <span class="status-badge st-check" style="font-size:11px;">${escapeHtml(q.Status || 'معلق')}</span>
            <span class="mono" style="font-size:11.5px;font-weight:800;color:var(--ink);">
              الإجمالي: ${total.toLocaleString()} ج.م
            </span>
            <span class="mono" style="font-size:11.5px;font-weight:700;color:var(--green);">
              المدفوع: ${paid.toLocaleString()} ج.م
            </span>
            <span class="mono" style="font-size:11.5px;font-weight:800;${rem > 0 ? 'color:var(--red);' : 'color:var(--green);'}">
              ${rem > 0 ? `المتبقي: ${rem.toLocaleString()} ج.م` : 'خالص المسدد'}
            </span>
          </div>
        </div>

        <div class="unified-bar-actions">
          <button class="unified-bar-btn btn-primary" onclick="openQuotationDetailModalById('${q.ID}')" title="عرض التفاصيل وتسجيل دفعات">
            ${getSvgIcon("eye", 13)} استعراض ودفعات
          </button>
          <button class="unified-bar-btn btn-ghost" style="background:var(--paper2);border:1px solid var(--line);" onclick="openQuotationPrintDirect('${q.ID}')" title="طباعة عرض السعر الرسمي">
            ${getSvgIcon("printer", 13)} طباعة العرض
          </button>
          <button class="unified-bar-btn btn-ghost" style="color:var(--green-text);border:1px solid var(--green);" onclick="openQuotationAgreementPrintDirect('${q.ID}')" title="طباعة عقد الشروط والاتفاق">
            ${getSvgIcon("fileText", 13)} طباعة العقد
          </button>
          <button class="unified-bar-btn btn-ghost" style="color:var(--purple);border:1px solid #c4b5fd;background:#f5f3ff;" onclick="convertQuotationToInvoiceDirect('${q.ID}')" title="تحويل وإصدار فاتورة رسمية">
            ${getSvgIcon("invoices", 13)} تحويل لفاتورة
          </button>
          ${q.ClientPhone ? `
            <button class="unified-bar-btn btn-whatsapp" onclick="openQuotationWhatsappDirect('${q.ID}')" title="مشاركة عرض السعر عبر واتساب">
              ${WA_ICON} واتساب
            </button>
          ` : ''}
          <button class="unified-bar-btn-close" onclick="deselectCurrentSelection()" title="إلغاء التحديد">
            &times;
          </button>
        </div>
      `;
      return;
    }
  }

  // Context 0.02: Supplier Selected
  if(isSupSection && state.selectedSupplierName){
    const sName = state.selectedSupplierName;
    const s = (state.suppliers || []).find(x => (x.Name || x.name || '') === sName) || { Name: sName };
    const sTitle = s.Title || s.title || '';
    const sPhone = s.Phone || s.phone || '';
    const pCount = (state.expenses || []).filter(ex => (ex.Category === 'سداد موردين ومشتريات' || ex.Supplier) && ex.Supplier === sName).length;

    bar.className = 'unified-selection-bar active';
    bar.innerHTML = `
      <div class="unified-bar-info">
        <div class="unified-bar-badge" style="background:#ecfdf5;color:#047857;">
          <span>${getSvgIcon("user", 13)} مورد مختار</span>
        </div>
        <div style="font-size:12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-weight:800;color:var(--ink);">${escapeHtml(sName)}</span>
          ${sTitle ? `<span class="badge" style="background:var(--paper2);color:var(--primary);font-size:11px;border:1px solid var(--line);">${escapeHtml(sTitle)}</span>` : ''}
          ${sPhone ? `<span class="mono" style="color:var(--ink-secondary);font-size:11.5px;direction:ltr;">${escapeHtml(sPhone)}</span>` : ''}
          <span class="badge" style="background:var(--paper2);border:1px solid var(--line);font-size:11px;">${pCount} سند صرف</span>
        </div>
      </div>

      <div class="unified-bar-actions">
        <button class="unified-bar-btn btn-green" onclick="openPaySupplierDirect('${escapeHtml(sName)}')" title="تسجيل سند صرف وسداد دفعة للمورد">
          ${getSvgIcon("creditCard", 13)} سداد دفعة (سند صرف)
        </button>
        <button class="unified-bar-btn" style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;font-weight:700;" onclick="openSupplierStatementDirect('${escapeHtml(sName)}')" title="كشف حساب تفصيلي للمورد">
          ${getSvgIcon("chart", 13)} كشف حساب تفصيلي
        </button>
        ${pCount ? `
          <button class="unified-bar-btn btn-ghost" style="background:var(--paper2);border:1px solid var(--line);" onclick="openSupplierHistoryDirect('${escapeHtml(sName)}')" title="عرض سجل سندات الصرف">
            ${getSvgIcon("fileText", 13)} سجل السندات (${pCount})
          </button>
        ` : ''}
        ${sPhone ? `
          <button class="unified-bar-btn btn-whatsapp" onclick="openSupplierWhatsappDirect('${escapeHtml(sPhone)}', '${escapeHtml(sName)}')" title="مراسلة المورد عبر واتساب">
            ${WA_ICON} واتساب
          </button>
        ` : ''}
        <button class="unified-bar-btn-close" onclick="deselectCurrentSelection()" title="إلغاء التحديد">
          &times;
        </button>
      </div>
    `;
    return;
  }

  // Context 0.03: Purchase Invoice Selected
  if(isPurSection && state.selectedPurchaseId){
    const p = (state.purchases || []).find(x => String(x.ID) === String(state.selectedPurchaseId));
    if(p){
      const tot = Number(p.Total || 0);
      const paid = Number(p.AmountPaid != null ? p.AmountPaid : tot);
      const rem = Math.max(0, tot - paid);

      bar.className = 'unified-selection-bar active';
      bar.innerHTML = `
        <div class="unified-bar-info">
          <div class="unified-bar-badge" style="background:#fdf2f8;color:#9d174d;">
            <span>${getSvgIcon("download", 13)} فاتورة شراء مختارة</span>
            <b class="mono" style="direction:ltr;unicode-bidi:isolate;">#${escapeHtml(String(p.ID || '').slice(-8))}</b>
          </div>
          <div style="font-size:12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span style="font-weight:800;color:var(--ink);">${escapeHtml(p.Supplier || '')}</span>
            <span class="mono" style="font-size:11.5px;font-weight:800;color:var(--ink);">
              الإجمالي: ${tot.toLocaleString()} ج.م
            </span>
            <span class="mono" style="font-size:11.5px;font-weight:700;color:var(--green);">
              المدفوع: ${paid.toLocaleString()} ج.م
            </span>
            <span class="mono" style="font-size:11.5px;font-weight:800;${rem > 0 ? 'color:var(--red);' : 'color:var(--green);'}">
              ${rem > 0 ? `المتبقي: ${rem.toLocaleString()} ج.م` : 'خالص'}
            </span>
          </div>
        </div>

        <div class="unified-bar-actions">
          <button class="unified-bar-btn btn-amber" onclick="openInvoiceBarcodePrintModal('purchase', '${escapeHtml(String(p.ID || ''))}')" title="طباعة ملصقات الباركود لأصناف هذه الفاتورة">
            ${getSvgIcon("tag", 13)} طباعة الباركود
          </button>
          <button class="unified-bar-btn btn-green" onclick="openPaySupplierDirect('${escapeHtml(p.Supplier || '')}')" title="تسجيل سند صرف للمورد">
            ${getSvgIcon("creditCard", 13)} سداد للمورد
          </button>
          <button class="unified-bar-btn-close" onclick="deselectCurrentSelection()" title="إلغاء التحديد">
            &times;
          </button>
        </div>
      `;
      return;
    }
  }

  // Context 0.1: Invoice Selected
  if(isInvoiceSection && state.selectedInvoiceId){
    const inv = (state.invoices || []).find(x => String(x.ID) === String(state.selectedInvoiceId));
    if(inv){
      const total = Number(inv.Total || 0);
      const paid = Number(inv.AmountPaid || 0);
      const remaining = Number(inv.Remaining || 0);
      const cName = inv.CustomerName || 'عميل';
      const invNum = inv.InvoiceNumber || '';
      const ref = inv.ReferenceType ? (inv.ReferenceType === 'Receipt' ? 'إيصال #' + inv.ReferenceID : inv.ReferenceType + ' ' + inv.ReferenceID) : '';

      bar.className = 'unified-selection-bar active';
      bar.innerHTML = `
        <div class="unified-bar-info">
          <div class="unified-bar-badge" style="background:#eff6ff;color:#2563eb;">
            <span>${getSvgIcon("invoices", 13)} فاتورة مختارة</span>
            <b class="mono" style="direction:ltr;unicode-bidi:isolate;">#${escapeHtml(invNum)}</b>
          </div>
          <div style="font-size:12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span style="font-weight:800;color:var(--ink);">${escapeHtml(cName)}</span>
            ${ref ? `<span class="badge" style="background:var(--paper2);color:var(--ink-secondary);font-size:11px;border:1px solid var(--line);">${escapeHtml(ref)}</span>` : ''}
            <span class="mono" style="font-size:11.5px;font-weight:800;color:var(--ink);">
              الإجمالي: ${total.toLocaleString()} ج.م
            </span>
            <span class="mono" style="font-size:11.5px;font-weight:700;color:var(--green);">
              المحصل: ${paid.toLocaleString()} ج.م
            </span>
            <span class="mono" style="font-size:11.5px;font-weight:800;${remaining > 0 ? 'color:var(--red);' : 'color:var(--green);'}">
              ${remaining > 0 ? `المتبقي: ${remaining.toLocaleString()} ج.م` : 'خالص المسدد'}
            </span>
          </div>
        </div>

        <div class="unified-bar-actions">
          <button class="unified-bar-btn btn-primary" onclick="openInvoicePrintDirect('${inv.ID}', 'invoice')" title="طباعة فاتورة ضريبية رسمية A4/A5">
            ${getSvgIcon("printer", 13)} طباعة فاتورة
          </button>
          <button class="unified-bar-btn btn-ghost" style="background:var(--paper2);border:1px solid var(--line);" onclick="openInvoicePrintDirect('${inv.ID}', 'quote')" title="طباعة بيان سعر وعرض أسعار رسمي">
            ${getSvgIcon("fileText", 13)} بيان أسعار
          </button>
          <button class="unified-bar-btn btn-amber" onclick="openInvoiceBarcodeDirect('${inv.ID}')" title="طباعة ملصقات باركود لكافة أصناف الفاتورة">
            ${getSvgIcon("tag", 13)} باركود الأصناف
          </button>
          <button class="unified-bar-btn btn-ghost" style="background:var(--paper2);border:1px solid var(--line);" onclick="openInvoiceModalDirect('${inv.ID}')" title="عرض تفاصيل الفاتورة أو التعديل">
            ${getSvgIcon("edit", 13)} تفاصيل وتعديل
          </button>
          <button class="unified-bar-btn btn-whatsapp" onclick="openInvoiceWhatsappDirect('${inv.ID}')" title="إرسال الفاتورة عبر واتساب للعميل">
            ${WA_ICON} واتساب
          </button>
          <button class="unified-bar-btn btn-red" onclick="deleteInvoiceDirect('${inv.ID}')" title="${(state.user && state.user.role === 'admin') ? 'حذف الفاتورة' : 'طلب تصريح حذف'}">
            ${(state.user && state.user.role === 'admin') ? 'حذف' : 'طلب حذف'}
          </button>
          <button class="unified-bar-btn-close" onclick="deselectCurrentSelection()" title="إلغاء التحديد">
            &times;
          </button>
        </div>
      `;
      return;
    }
  }

  // Context 0.2: POS Sale Selected
  if(isPosSalesLog && state.selectedSaleId){
    const s = (state.sales || []).find(x => String(x.ID) === String(state.selectedSaleId));
    if(s){
      const total = Number(s.Total || 0);
      const cName = s.CustomerName || 'عميل زائر';
      const saleNum = (s.ID || '').slice(-8);

      bar.className = 'unified-selection-bar active';
      bar.innerHTML = `
        <div class="unified-bar-info">
          <div class="unified-bar-badge" style="background:#f0fdf4;color:#15803d;">
            <span>${getSvgIcon("pos", 13)} عملية بيع مختارة</span>
            <b class="mono" style="direction:ltr;unicode-bidi:isolate;">#${escapeHtml(saleNum)}</b>
          </div>
          <div style="font-size:12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span style="font-weight:800;color:var(--ink);">${escapeHtml(cName)}</span>
            <span class="mono" style="font-size:11.5px;font-weight:800;color:var(--green);">
              القيمة: ${total.toLocaleString()} ج.م (${escapeHtml(s.PaymentMethod || 'نقدي')})
            </span>
            ${s.IsReturned ? '<span class="badge" style="background:#fee2e2;color:#b91c1c;font-weight:800;">مرتجع</span>' : '<span class="badge badge-green">مكتمل</span>'}
          </div>
        </div>

        <div class="unified-bar-actions">
          <button class="unified-bar-btn btn-green" onclick="openPosReceiptDirect('${s.ID}')" title="طباعة إيصال بيع كاشير سريع">
            ${getSvgIcon("printer", 13)} طباعة إيصال
          </button>
          <button class="unified-bar-btn btn-blue" onclick="convertSaleToInvoiceDirect('${s.ID}')" title="تحويل وإصدار فاتورة ضريبية رسمية">
            ${getSvgIcon("invoices", 13)} فاتورة ضريبية
          </button>
          ${!s.IsReturned ? `
            <button class="unified-bar-btn btn-amber" onclick="openPosReturnDirect('${s.ID}')" title="استرجاع الفاتورة (خلال 14 يوم)">
              ↩️ إرجاع مبيعات
            </button>
          ` : `
            <button class="unified-bar-btn btn-purple" onclick="openPosReturnDirect('${s.ID}')" title="طباعة إشعار وسند الارتجاع">
              ${getSvgIcon("refresh", 13)} إذن ارتجاع
            </button>
          `}
          ${s.CustomerPhone ? `
            <button class="unified-bar-btn btn-whatsapp" onclick="openSaleWhatsappDirect('${s.ID}')" title="مشاركة الفاتورة عبر واتساب">
              ${WA_ICON} واتساب
            </button>
          ` : ''}
          <button class="unified-bar-btn-close" onclick="deselectCurrentSelection()" title="إلغاء التحديد">
            &times;
          </button>
        </div>
      `;
      return;
    }
  }

  // Context 1: Inventory Item Selected
  if(isInv && state.selectedInventoryItemId){
    const item = (state.inventory || []).find(x => String(x.ID) === String(state.selectedInventoryItemId));
    if(item){
      const qty = Number(item.Quantity || 0);
      const minStock = Number(item.MinStock || 2);
      const isLow = qty <= minStock;
      const sell = Number(item.SellPrice || 0);
      const wh = item.Warehouse || 'المخزن الرئيسي';

      bar.className = 'unified-selection-bar active';
      bar.innerHTML = `
        <div class="unified-bar-info">
          <div class="unified-bar-badge" style="background:#fef3c7;color:#b45309;">
            <span>${getSvgIcon("package", 13)} صنف مختار</span>
            ${item.SKU ? `<b class="mono" style="direction:ltr;">#${escapeHtml(item.SKU)}</b>` : ''}
          </div>
          <div style="font-size:12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span style="font-weight:800;color:var(--ink);">${escapeHtml(item.Name)}</span>
            <span style="color:var(--ink-secondary);font-size:11px;">(${escapeHtml(item.Category || 'صيانة')} • ${escapeHtml(wh)})</span>
            <span class="mono" style="font-size:11.5px;font-weight:800;color:${isLow ? 'var(--red)' : 'var(--green)'};">
              الرصيد: ${qty} ${escapeHtml(item.Unit || 'قطعة')}
            </span>
            <span class="mono" style="font-size:11.5px;font-weight:700;color:var(--ink);">
              البيع: ${sell.toLocaleString()} ج.م
            </span>
          </div>
        </div>

        <div class="unified-bar-actions">
          <button class="unified-bar-btn btn-primary" onclick="openInventoryItemModalDirect('${item.ID}', false)" title="تعديل بيانات وسعر وموقع الصنف">
            ${getSvgIcon("edit", 13)} تعديل الصنف
          </button>
          <button class="unified-bar-btn btn-ghost" style="background:var(--paper2);border:1px solid var(--line);" onclick="openWarehouseTransferModalDirect('${item.ID}')" title="تحويل رصيد لمخزن أو فرع آخر">
            ${getSvgIcon("refresh", 13)} تحويل لمخزن
          </button>
          <button class="unified-bar-btn btn-amber" onclick="printInventoryStickerDirect('${item.ID}')" title="طباعة ملصق الباركود الحراري">
            ${getSvgIcon("tag", 13)} طباعة ملصق
          </button>
          <button class="unified-bar-btn btn-ghost" style="background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;" onclick="openInventoryItemModalDirect('${item.ID}', true)" title="تكرار الصنف كنسخة جديدة">
            ${getSvgIcon("copy", 13)} نسخ وتكرار
          </button>
          <button class="unified-bar-btn btn-red" onclick="deleteInventoryItemDirect('${item.ID}')" title="${(state.user && state.user.role==='admin') ? 'حذف الصنف' : 'طلب تصريح حذف'}">
            ${(state.user && state.user.role==='admin') ? 'حذف' : 'طلب حذف'}
          </button>
          <button class="unified-bar-btn-close" onclick="deselectCurrentSelection()" title="إلغاء التحديد">
            &times;
          </button>
        </div>
      `;
      return;
    }
  }

  // Context 1.5: Multiple Receipts Selected (Consolidated Invoicing & Batch Actions)
  if(!isInv && state.tab !== 'customers' && state.selectedReceiptIds && state.selectedReceiptIds.length > 1){
    const count = state.selectedReceiptIds.length;
    const selReceipts = (state.receipts || []).filter(r => {
      const id = String(r.id != null ? r.id : (r.ID != null ? r.ID : r.receiptNumber));
      return state.selectedReceiptIds.map(String).includes(id);
    });
    let totalDue = 0, totalDeposit = 0, totalRemaining = 0;
    const customerNames = new Set();
    selReceipts.forEach(r => {
      const due = (typeof getReceiptTotalDue === 'function') ? getReceiptTotalDue(r) : (Number(r.cost || 0) + Number(r.partsCost || 0) + Number(r.otherAccountAmount || 0));
      const dep = Number(r.deposit || 0);
      const rem = (typeof getReceiptRemaining === 'function') ? getReceiptRemaining(r) : Math.max(0, due - dep + Number(r.refunded || 0));
      totalDue += due;
      totalDeposit += dep;
      totalRemaining += rem;
      const c = extractCustomerName(r);
      if(c) customerNames.add(c);
    });
    const cLabel = Array.from(customerNames).join('، ') || 'متعدد';

    bar.className = 'unified-selection-bar active';
    bar.innerHTML = `
      <div class="unified-bar-info">
        <div class="unified-bar-badge" style="background:#e0e7ff;color:#3730a3;">
          <span>${getSvgIcon("fileText", 13)} تم تحديد (${count}) إيصالات</span>
        </div>
        <div style="font-size:12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-weight:700;color:var(--ink);">${escapeHtml(cLabel)}</span>
          <span class="mono" style="font-size:11.5px;font-weight:800;color:var(--ink);">
            الإجمالي: ${totalDue.toLocaleString()} ج.م
          </span>
          <span class="mono" style="font-size:11.5px;font-weight:800;color:var(--green);">
            المدفوع: ${totalDeposit.toLocaleString()} ج.م
          </span>
          <span class="mono" style="font-size:11.5px;font-weight:800;${totalRemaining > 0 ? 'color:var(--red);' : 'color:var(--green);'}">
            المتبقي: ${totalRemaining.toLocaleString()} ج.م
          </span>
        </div>
      </div>

      <div class="unified-bar-actions">
        <button class="unified-bar-btn btn-primary" style="background:linear-gradient(135deg, #4f46e5, #4338ca);color:#fff;font-weight:800;box-shadow:0 2px 6px rgba(79,70,229,0.3);" onclick="convertMultipleReceiptsToInvoice(state.selectedReceiptIds)" title="إنشاء فاتورة ضريبية مجمعة تجمع كافة الأجهزة والصيانات للإيصالات المحددة">
          ${getSvgIcon("invoices", 13)} إصدار فاتورة مجمعة (${count})
        </button>
        <button class="unified-bar-btn btn-ghost" style="background:var(--paper2);border:1px solid var(--line);" onclick="deselectCurrentSelection(); if(typeof renderArchive==='function') renderArchive();" title="إلغاء التحديد">
          إلغاء التحديد
        </button>
        <button class="unified-bar-btn-close" onclick="deselectCurrentSelection(); if(typeof renderArchive==='function') renderArchive();" title="إلغاء التحديد" aria-label="إلغاء التحديد">
          &times;
        </button>
      </div>
    `;
    return;
  }

  // Context 2: Receipt Selected in Maintenance
  if(!isInv && state.tab !== 'customers' && state.selectedReceiptId){
    const r = findReceiptByIdOrNum(state.selectedReceiptId, state.selectedReceiptNum);
    if(r){
      const safeTargetId = String(r.id != null ? r.id : (r.ID != null ? r.ID : r.receiptNumber));
      const rNum = String(r.receiptNumber || r.ReceiptNumber || state.selectedReceiptNum || '');
      const totalDue = (typeof getReceiptTotalDue === 'function') ? getReceiptTotalDue(r) : (Number(r.cost || 0) + Number(r.partsCost || 0) + Number(r.otherAccountAmount || 0));
      const deposit = Number(r.deposit || 0);
      const remaining = (typeof getReceiptRemaining === 'function') ? getReceiptRemaining(r) : Math.max(0, totalDue - deposit + Number(r.refunded || 0));
      const cName = extractCustomerName(r) || 'عميل';
      const dCat = (r.device && r.device.category) || 'جهاز';
      const dBrand = (r.device ? (r.device.brand === 'أخرى' ? r.device.brandOther : r.device.brand) : '') || '';

      bar.className = 'unified-selection-bar active';
      bar.innerHTML = `
        <div class="unified-bar-info">
          <div class="unified-bar-badge">
            <span>${getSvgIcon("check", 13)} إيصال مختار</span>
            <b class="mono" style="direction:ltr;unicode-bidi:isolate;">#${escapeHtml(rNum)}</b>
          </div>
          <div style="font-size:12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span style="font-weight:700;color:var(--ink);">${escapeHtml(cName)}</span>
            <span style="color:var(--ink-secondary);font-size:11px;">(${escapeHtml(dCat)} ${escapeHtml(dBrand)})</span>
            <span class="mono" style="font-size:11.5px;font-weight:800;${remaining > 0 ? 'color:var(--red);' : 'color:var(--green);'}">
              ${remaining > 0 ? `متبقي: ${remaining.toLocaleString()} ج.م` : 'خالص المسدد'}
            </span>
          </div>
        </div>

        <div class="unified-bar-actions">
          <button class="unified-bar-btn btn-primary" onclick="openReceiptActionSheet('${safeTargetId}', '${rNum}')" title="فتح لوحة إجراءات وخيارات الإيصال الموحدة">
            ${getSvgIcon('settings', 13)} خيارات الإيصال
          </button>
          <button class="unified-bar-btn btn-status-quick" style="background:var(--green-bg);color:var(--green-text);border-color:rgba(5,150,105,0.25);" onclick="openQuickStatusModalDirect('${safeTargetId}', '${rNum}')" title="تغيير سريع لحالة الجهاز">
            ${getSvgIcon('maintenance', 13)} الحالة
          </button>
          <button class="unified-bar-btn" style="background:#ecfdf5;color:#047857;border-color:rgba(16,185,129,0.35);font-weight:700;" onclick="openCostEstimateModalDirect('${safeTargetId}', '${rNum}')" title="عرض ومقايسة التكلفة عبر واتساب">
            ${getSvgIcon('finance', 13)} عرض التكلفة
          </button>
          <button class="unified-bar-btn btn-whatsapp" onclick="openWhatsappDirect('${safeTargetId}', '${rNum}')" title="محادثة واتساب">
            ${WA_ICON} واتساب
          </button>
          <button class="unified-bar-btn btn-green" onclick="openReceiptPrintDirect('${safeTargetId}', '${rNum}', 'receipt')" title="طباعة إيصال استلام A5">
            ${getSvgIcon('invoices', 13)} طباعة A5
          </button>
          <button class="unified-bar-btn btn-amber" onclick="openStickerPrintDirect('${safeTargetId}', '${rNum}', event)" title="طباعة ملصق الباركود">
            ${getSvgIcon('barcode', 13)} ملصق
          </button>
          <button class="unified-bar-btn btn-ghost" style="background:var(--paper2);border:1px solid var(--line);" onclick="openReceiptDetailModal('${safeTargetId}', '${rNum}')" title="تعديل وعرض تفاصيل الإيصال">
            ${getSvgIcon('settings', 13)} تعديل
          </button>
          <button class="unified-bar-btn btn-amber" style="background:#fef3c7;color:#b45309;" onclick="openReIntakeModalDirect('${safeTargetId}', '${rNum}')" title="صيانة راجعة أو عطل جديد">
            ${getSvgIcon('maintenance', 13)} صيانة راجعة
          </button>
          <button class="unified-bar-btn btn-blue" onclick="convertReceiptToInvoiceDirect('${safeTargetId}', '${rNum}')" title="تحويل لفاتورة ضريبية">
            ${getSvgIcon('invoices', 13)} فاتورة
          </button>
          <button class="unified-bar-btn btn-red" onclick="deleteReceiptDirect('${safeTargetId}', '${rNum}')" title="${(state.user && state.user.role === 'admin') ? 'حذف الإيصال' : 'طلب تصريح حذف'}">
            ${(state.user && state.user.role === 'admin') ? `${getSvgIcon('alert', 13)} حذف` : `${getSvgIcon('lock', 13)} طلب حذف`}
          </button>
          <button class="unified-bar-btn-close" onclick="deselectCurrentSelection()" title="إلغاء التحديد">
            &times;
          </button>
        </div>
      `;
      return;
    }
  }

  // Context 3: Customer Selected
  if(state.tab === 'customers' && state.selectedCustomerId){
    const custName = state.selectedCustomerId;
    const allCusts = state.customers || [];
    const cust = allCusts.find(c => extractCustomerName(c) === custName) || {};
    const cTitle = extractCustomerTitle(cust) || '';
    const cPhone = extractCustomerPhone(cust) || '';
    const cEmail = cust.email || '';
    const clientReceipts = (state.receipts || []).filter(r => {
      const rName = extractCustomerName(r);
      const rPhone = extractCustomerPhone(r);
      return (rName && rName.toLowerCase() === custName.toLowerCase()) || (cPhone && rPhone === cPhone);
    });

    bar.className = 'unified-selection-bar active';
    bar.innerHTML = `
      <div class="unified-bar-info">
        <div class="unified-bar-badge" style="background:#eff6ff;color:#2563eb;">
          <span>${getSvgIcon("user", 13)} عميل مختار</span>
        </div>
        <div style="font-size:12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-weight:800;color:var(--ink);">${escapeHtml(custName)}</span>
          ${cTitle ? `<span class="badge" style="background:var(--paper2);color:var(--primary);font-size:11px;font-weight:700;border:1px solid var(--line);padding:1px 6px;border-radius:4px;">${escapeHtml(cTitle)}</span>` : ''}
          ${cPhone && cPhone !== '0000000000' ? `<span class="mono" style="color:var(--ink-secondary);font-size:11.5px;direction:ltr;">${escapeHtml(cPhone)}</span>` : ''}
          <span class="badge badge-blue" style="font-size:10.5px;">${clientReceipts.length} جهاز مسجل</span>
        </div>
      </div>

      <div class="unified-bar-actions">
        <button class="unified-bar-btn btn-primary" onclick="openCustomerActionSheet('${escapeJsString(custName)}', '${escapeJsString(cPhone)}', '${escapeJsString(cTitle)}', '${escapeJsString(cEmail)}');" title="فتح لوحة إجراءات وخيارات العميل الموحدة">
          خيارات العميل
        </button>
        <button class="unified-bar-btn" style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;font-weight:700;" onclick="openCustomerStatementModal('${escapeJsString(custName)}', '${escapeJsString(cPhone)}');" title="كشف حساب تفصيلي للعميل والمبيعات والتحصيلات">
          ${getSvgIcon("chart", 13)} كشف حساب
        </button>
        <button class="unified-bar-btn btn-ghost" style="background:var(--paper2);border:1px solid var(--line);" onclick="openEditCustomerModal({ title: '${escapeJsString(cTitle)}', name: '${escapeJsString(custName)}', phone: '${escapeJsString(cPhone)}', email: '${escapeJsString(cEmail)}' });" title="تعديل بيانات العميل">
          ${getSvgIcon("edit", 13)} تعديل
        </button>
        <button class="unified-bar-btn btn-blue" onclick="startNewReceiptForCustomer('${escapeJsString(custName)}', '${escapeJsString(cPhone)}', '${escapeJsString(cTitle)}');" title="إنشاء إيصال صيانة جديد لهذا العميل">
          ${getSvgIcon("plus", 13)} إيصال صيانة
        </button>
        <button class="unified-bar-btn btn-ghost" style="background:#faf5ff;color:#7c3aed;border:1px solid #ddd6fe;" onclick="startNewInvoiceForCustomer('${escapeJsString(custName)}', '${escapeJsString(cPhone)}', '${escapeJsString(cTitle)}');" title="إنشاء فاتورة جديدة">
          ${getSvgIcon("invoices", 13)} فاتورة
        </button>
        ${clientReceipts.length > 0 ? `
          <button class="unified-bar-btn btn-ghost" style="color:var(--primary);font-weight:800;border:1px solid var(--line);" onclick="viewCustomerReceiptsInArchive('${escapeJsString(custName)}');" title="استعراض أجهزة العميل بالأرشيف">
            ${getSvgIcon("folder", 13)} الأجهزة (${clientReceipts.length})
          </button>
        ` : ''}
        ${clientReceipts.length > 1 ? `
          <button class="unified-bar-btn btn-ghost" style="background:#ede9fe;color:#6d28d9;border:1px solid #c4b5fd;font-weight:800;" onclick="openCustomerConsolidatedInvoiceModal('${escapeJsString(custName)}');" title="إصدار فاتورة مجمعة لكافة أجهزة هذا العميل">
            ${getSvgIcon("fileText", 13)} فاتورة مجمعة
          </button>
        ` : ''}
        ${cPhone && cPhone !== '0000000000' ? `
          <a href="https://wa.me/${normalizePhoneForWa(cPhone)}" target="_blank" class="unified-bar-btn btn-whatsapp" style="text-decoration:none;" title="محادثة واتساب">
            ${WA_ICON} واتساب
          </a>
          <a href="tel:${cPhone}" class="unified-bar-btn btn-ghost" style="text-decoration:none;border:1px solid var(--line);" title="اتصال هاتفي">
            ${getSvgIcon("phone", 13)} اتصال
          </a>
        ` : `
          <button class="unified-bar-btn btn-amber" onclick="openQuickAddPhoneModal('${escapeHtml(custName)}', '');" title="إضافة رقم هاتف للعميل">
            إضافة هاتف
          </button>
        `}
        <button class="unified-bar-btn-close" onclick="deselectCurrentSelection()" title="إلغاء التحديد">
          &times;
        </button>
      </div>
    `;
    return;
  }

  // Context 4: Standby State (Nothing selected) - Permanent stationary toolbar in place!
  bar.className = 'unified-selection-bar standby';

  if(isInvoiceSection){
    bar.innerHTML = `
      <div class="unified-bar-info">
        <div class="unified-bar-badge" style="background:var(--paper3);color:var(--ink-secondary);border:1px dashed var(--line);">
          <span>شريط إجراءات الفواتير الموحد</span>
        </div>
        <div style="font-size:12px;color:var(--ink-secondary);">
          اضغط على أي فاتورة من الجدول لتفعيل الطباعة والباركود وبيان الأسعار والمراسلة والتعديل
        </div>
      </div>
      <div class="unified-bar-actions" style="opacity:0.55;pointer-events:none;">
        <button class="unified-bar-btn btn-primary" disabled>${getSvgIcon("printer", 13)} طباعة فاتورة</button>
        <button class="unified-bar-btn btn-ghost" style="background:var(--paper2);border:1px solid var(--line);" disabled>${getSvgIcon("fileText", 13)} بيان أسعار</button>
        <button class="unified-bar-btn btn-amber" disabled>${getSvgIcon("tag", 13)} باركود الأصناف</button>
        <button class="unified-bar-btn btn-ghost" disabled>${getSvgIcon("edit", 13)} تفاصيل وتعديل</button>
        <button class="unified-bar-btn btn-whatsapp" disabled>${WA_ICON} واتساب</button>
        <button class="unified-bar-btn btn-red" disabled>${getSvgIcon("trash", 13)} حذف</button>
      </div>
    `;
  } else if(isPosSalesLog){
    bar.innerHTML = `
      <div class="unified-bar-info">
        <div class="unified-bar-badge" style="background:var(--paper3);color:var(--ink-secondary);border:1px dashed var(--line);">
          <span>شريط إجراءات المبيعات</span>
        </div>
        <div style="font-size:12px;color:var(--ink-secondary);">
          اضغط على أي عملية بيع من الجدول لتفعيل الطباعة والتحويل لفاتورة والإرجاع
        </div>
      </div>
      <div class="unified-bar-actions" style="opacity:0.55;pointer-events:none;">
        <button class="unified-bar-btn btn-green" disabled>${getSvgIcon('invoices', 13)} طباعة إيصال</button>
        <button class="unified-bar-btn btn-blue" disabled>${getSvgIcon('invoices', 13)} فاتورة ضريبية</button>
        <button class="unified-bar-btn btn-amber" disabled>${getSvgIcon('arrowLeft', 13)} إرجاع مبيعات</button>
        <button class="unified-bar-btn btn-whatsapp" disabled>${WA_ICON} واتساب</button>
      </div>
    `;
  } else if(isQuoSection){
    bar.innerHTML = `
      <div class="unified-bar-info">
        <div class="unified-bar-badge" style="background:var(--paper3);color:var(--ink-secondary);border:1px dashed var(--line);">
          <span>شريط إجراءات عروض الأسعار</span>
        </div>
        <div style="font-size:12px;color:var(--ink-secondary);">
          اضغط على أي عرض سعر من الجدول لتفعيل الطباعة والعقد وتسجيل الدفعات
        </div>
      </div>
      <div class="unified-bar-actions" style="opacity:0.55;pointer-events:none;">
        <button class="unified-bar-btn btn-primary" disabled>${getSvgIcon('eye', 13)} استعراض ودفعات</button>
        <button class="unified-bar-btn btn-ghost" style="background:var(--paper2);border:1px solid var(--line);" disabled>${getSvgIcon('invoices', 13)} طباعة العرض</button>
        <button class="unified-bar-btn btn-ghost" disabled>${getSvgIcon('invoices', 13)} طباعة العقد</button>
        <button class="unified-bar-btn btn-ghost" disabled>${getSvgIcon('pos', 13)} تحويل لفاتورة</button>
        <button class="unified-bar-btn btn-whatsapp" disabled>${WA_ICON} واتساب</button>
      </div>
    `;
  } else if(isSupSection){
    bar.innerHTML = `
      <div class="unified-bar-info">
        <div class="unified-bar-badge" style="background:var(--paper3);color:var(--ink-secondary);border:1px dashed var(--line);">
          <span>شريط إجراءات الموردين</span>
        </div>
        <div style="font-size:12px;color:var(--ink-secondary);">
          اضغط على أي مورد من الجدول أدناه لتسجيل سند صرف أو استعراض كشف الحساب
        </div>
      </div>
      <div class="unified-bar-actions" style="opacity:0.55;pointer-events:none;">
        <button class="unified-bar-btn btn-green" disabled>${getSvgIcon('finance', 13)} سداد دفعة</button>
        <button class="unified-bar-btn" style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;font-weight:700;" disabled>${getSvgIcon('trendUp', 13)} كشف حساب</button>
        <button class="unified-bar-btn btn-ghost" disabled>${getSvgIcon('invoices', 13)} سجل السندات</button>
      </div>
    `;
  } else if(isPurSection){
    bar.innerHTML = `
      <div class="unified-bar-info">
        <div class="unified-bar-badge" style="background:var(--paper3);color:var(--ink-secondary);border:1px dashed var(--line);">
          <span>شريط إجراءات فواتير الشراء</span>
        </div>
        <div style="font-size:12px;color:var(--ink-secondary);">
          اضغط على أي فاتورة شراء من الجدول أدناه لطباعة ملصقات الباركود أو سداد دفعة للمورد
        </div>
      </div>
      <div class="unified-bar-actions" style="opacity:0.55;pointer-events:none;">
        <button class="unified-bar-btn btn-amber" disabled>${getSvgIcon('barcode', 13)} طباعة الباركود</button>
        <button class="unified-bar-btn btn-green" disabled>${getSvgIcon('finance', 13)} سداد للمورد</button>
      </div>
    `;
  } else if(isInv){
    bar.innerHTML = `
      <div class="unified-bar-info">
        <div class="unified-bar-badge" style="background:var(--paper3);color:var(--ink-secondary);border:1px dashed var(--line);">
          <span>شريط إجراءات الأصناف</span>
        </div>
        <div style="font-size:12px;color:var(--ink-secondary);">
          اضغط على أي صنف من الجدول أدناه لتحديد الإجراء المطلوب
        </div>
      </div>
      <div class="unified-bar-actions" style="opacity:0.55;pointer-events:none;">
        <button class="unified-bar-btn btn-primary" disabled>${getSvgIcon('settings', 13)} تعديل الصنف</button>
        <button class="unified-bar-btn btn-ghost" style="background:var(--paper2);border:1px solid var(--line);" disabled>${getSvgIcon('inventory', 13)} تحويل لمخزن</button>
        <button class="unified-bar-btn btn-amber" disabled>${getSvgIcon('barcode', 13)} طباعة ملصق</button>
        <button class="unified-bar-btn btn-ghost" disabled>${getSvgIcon('invoices', 13)} نسخ وتكرار</button>
        <button class="unified-bar-btn btn-red" disabled>${getSvgIcon('alert', 13)} حذف</button>
      </div>
    `;
  } else if(state.tab === 'customers'){
    bar.innerHTML = `
      <div class="unified-bar-info">
        <div class="unified-bar-badge" style="background:var(--paper3);color:var(--ink-secondary);border:1px dashed var(--line);">
          <span>شريط إجراءات العملاء</span>
        </div>
        <div style="font-size:12px;color:var(--ink-secondary);">
          اضغط على أي عميل من الجدول أدناه لتفعيل خيارات التعديل والمراسلة وإيصالات الصيانة وكشف الحساب
        </div>
      </div>
      <div class="unified-bar-actions" style="opacity:0.55;pointer-events:none;">
        <button class="unified-bar-btn btn-primary" disabled>${getSvgIcon('users', 13)} خيارات العميل</button>
        <button class="unified-bar-btn" style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;font-weight:700;" disabled>${getSvgIcon('trendUp', 13)} كشف حساب</button>
        <button class="unified-bar-btn btn-ghost" disabled>${getSvgIcon('settings', 13)} تعديل</button>
        <button class="unified-bar-btn btn-blue" disabled>${getSvgIcon('plus', 13)} إيصال صيانة</button>
        <button class="unified-bar-btn btn-ghost" disabled>${getSvgIcon('invoices', 13)} فاتورة</button>
      </div>
    `;
  } else {
    // Maintenance Standby
    bar.innerHTML = `
      <div class="unified-bar-info">
        <div class="unified-bar-badge" style="background:var(--paper3);color:var(--ink-secondary);border:1px dashed var(--line);">
          <span>شريط إجراءات الصيانة</span>
        </div>
        <div style="font-size:12px;color:var(--ink-secondary);">
          اضغط على أي إيصال من الجدول لتفعيل الإجراءات السريعة
        </div>
      </div>
      <div class="unified-bar-actions" style="opacity:0.55;pointer-events:none;">
        <button class="unified-bar-btn btn-primary" disabled>${getSvgIcon('settings', 13)} خيارات الإيصال</button>
        <button class="unified-bar-btn btn-status-quick" disabled>${getSvgIcon('maintenance', 13)} الحالة</button>
        <button class="unified-bar-btn" disabled>${getSvgIcon('finance', 13)} عرض التكلفة</button>
        <button class="unified-bar-btn btn-whatsapp" disabled>${WA_ICON} واتساب</button>
        <button class="unified-bar-btn btn-green" disabled>${getSvgIcon('invoices', 13)} طباعة A5</button>
        <button class="unified-bar-btn btn-amber" disabled>${getSvgIcon('barcode', 13)} ملصق</button>
        <button class="unified-bar-btn btn-ghost" disabled>${getSvgIcon('settings', 13)} تعديل</button>
        <button class="unified-bar-btn btn-amber" disabled>${getSvgIcon('maintenance', 13)} صيانة راجعة</button>
        <button class="unified-bar-btn btn-blue" disabled>${getSvgIcon('invoices', 13)} فاتورة</button>
        <button class="unified-bar-btn btn-red" disabled>${getSvgIcon('alert', 13)} حذف</button>
      </div>
    `;
  }
};

window.hideUnifiedSelectionBar = function(){
  state.selectedReceiptId = null;
  state.selectedReceiptNum = null;
  state.selectedReceiptIds = [];
  state.selectedCustomerId = null;
  state.selectedInventoryItemId = null;
  state.selectedInvoiceId = null;
  state.selectedSaleId = null;
  state.selectedQuotationId = null;
  state.selectedSupplierName = null;
  state.selectedPurchaseId = null;
  document.querySelectorAll('.selected-row').forEach(el => el.classList.remove('selected-row'));
  document.querySelectorAll('.selected-card').forEach(el => el.classList.remove('selected-card'));
  document.querySelectorAll('.selected-badge-indicator').forEach(el => el.remove());
  document.querySelectorAll('.receipt-select-cb').forEach(cb => { cb.checked = false; });
  const allCb = document.getElementById('receiptSelectAllCb');
  if(allCb) { allCb.checked = false; allCb.indeterminate = false; }
  if(typeof window.renderUnifiedSelectionBar === 'function'){
    window.renderUnifiedSelectionBar();
  }
};

window.deselectCurrentSelection = function(){
  window.hideUnifiedSelectionBar();
};

window.selectReceipt = function(receiptId, receiptNum){
  const r = findReceiptByIdOrNum(receiptId, receiptNum);
  if(!r) return;

  const safeTargetId = String(r.id != null ? r.id : (r.ID != null ? r.ID : r.receiptNumber));
  const rNum = String(r.receiptNumber || r.ReceiptNumber || receiptNum || '');

  state.selectedReceiptId = safeTargetId;
  state.selectedReceiptNum = rNum;
  state.selectedReceiptIds = [safeTargetId];
  state.selectedCustomerId = null;
  state.selectedInventoryItemId = null;

  // Update DOM highlights
  document.querySelectorAll('.selected-row').forEach(el => el.classList.remove('selected-row'));
  document.querySelectorAll('.selected-card').forEach(el => el.classList.remove('selected-card'));
  document.querySelectorAll('.selected-badge-indicator').forEach(el => el.remove());

  const matchingRows = document.querySelectorAll(`tr[data-receipt-id="${safeTargetId}"]`);
  matchingRows.forEach(el => {
    el.classList.add('selected-row');
    const cb = el.querySelector('.receipt-select-cb');
    if(cb) cb.checked = true;
    const firstCell = el.querySelector('td:nth-child(2) > div') || el.querySelector('td:first-child > div');
    if(firstCell && !firstCell.querySelector('.selected-badge-indicator')){
      const b = document.createElement('span');
      b.className = 'selected-badge-indicator';
      b.title = 'إيصال محدد';
      b.textContent = 'محدد';
      firstCell.prepend(b);
    }
  });

  const matchingCards = document.querySelectorAll(`.smart-receipt-card[data-receipt-id="${safeTargetId}"]`);
  matchingCards.forEach(el => {
    el.classList.add('selected-card');
    const cb = el.querySelector('.receipt-select-cb');
    if(cb) cb.checked = true;
  });

  window.renderUnifiedSelectionBar();
};

window.toggleReceiptMultiSelection = function(receiptId, isChecked, evt){
  if(evt) evt.stopPropagation();
  if(!Array.isArray(state.selectedReceiptIds)) state.selectedReceiptIds = [];
  const sId = String(receiptId);

  if(isChecked){
    if(!state.selectedReceiptIds.includes(sId)){
      state.selectedReceiptIds.push(sId);
    }
  } else {
    state.selectedReceiptIds = state.selectedReceiptIds.filter(id => String(id) !== sId);
  }

  if(state.selectedReceiptIds.length === 1){
    state.selectedReceiptId = state.selectedReceiptIds[0];
    const r = findReceiptByIdOrNum(state.selectedReceiptId);
    state.selectedReceiptNum = r ? String(r.receiptNumber || '') : null;
  } else if(state.selectedReceiptIds.length === 0){
    state.selectedReceiptId = null;
    state.selectedReceiptNum = null;
  } else {
    state.selectedReceiptId = null;
  }

  // Update DOM highlights
  const row = document.querySelector(`tr[data-receipt-id="${sId}"]`);
  if(row){
    if(isChecked) row.classList.add('selected-row');
    else row.classList.remove('selected-row');
  }
  const card = document.querySelector(`.smart-receipt-card[data-receipt-id="${sId}"]`);
  if(card){
    if(isChecked) card.classList.add('selected-card');
    else card.classList.remove('selected-card');
  }

  const allCb = document.getElementById('receiptSelectAllCb');
  if(allCb){
    const visibleCbs = Array.from(document.querySelectorAll('.receipt-select-cb'));
    if(visibleCbs.length > 0){
      allCb.checked = visibleCbs.every(c => c.checked);
      allCb.indeterminate = visibleCbs.some(c => c.checked) && !allCb.checked;
    }
  }

  if(typeof window.renderUnifiedSelectionBar === 'function'){
    window.renderUnifiedSelectionBar();
  }
};

window.toggleSelectAllReceipts = function(isChecked){
  if(!Array.isArray(state.selectedReceiptIds)) state.selectedReceiptIds = [];
  const visibleCbs = document.querySelectorAll('.receipt-select-cb');
  visibleCbs.forEach(cb => {
    cb.checked = isChecked;
    const sId = String(cb.value);
    const row = document.querySelector(`tr[data-receipt-id="${sId}"]`);
    const card = document.querySelector(`.smart-receipt-card[data-receipt-id="${sId}"]`);
    if(isChecked){
      if(!state.selectedReceiptIds.includes(sId)) state.selectedReceiptIds.push(sId);
      if(row) row.classList.add('selected-row');
      if(card) card.classList.add('selected-card');
    } else {
      if(row) row.classList.remove('selected-row');
      if(card) card.classList.remove('selected-card');
    }
  });

  if(!isChecked){
    state.selectedReceiptIds = [];
    state.selectedReceiptId = null;
    state.selectedReceiptNum = null;
  } else if(state.selectedReceiptIds.length === 1){
    state.selectedReceiptId = state.selectedReceiptIds[0];
  } else {
    state.selectedReceiptId = null;
  }

  if(typeof window.renderUnifiedSelectionBar === 'function'){
    window.renderUnifiedSelectionBar();
  }
};

// Inventory Direct Action Handlers
window.openInventoryItemModalDirect = function(itemId, isClone = false){
  const item = (state.inventory || []).find(x => String(x.ID) === String(itemId));
  if(item) openInventoryItemModal(item, isClone, state.invHubTab || 'all');
};

window.openWarehouseTransferModalDirect = function(itemId){
  const item = (state.inventory || []).find(x => String(x.ID) === String(itemId));
  if(item) openWarehouseTransferModal(item);
};

window.printInventoryStickerDirect = function(itemId){
  const item = (state.inventory || []).find(x => String(x.ID) === String(itemId));
  if(item) openProductBarcodeSticker(item);
};

window.deleteInventoryItemDirect = function(itemId){
  const item = (state.inventory || []).find(x => String(x.ID) === String(itemId));
  if(!item) return;
  requestAdminAuthorization({
    action: 'حذف صنف مخزن',
    entityType: 'صنف من المخزن',
    entityId: item.ID,
    entityTitle: `${item.Name} (${item.Category || 'صيانة'})`,
    onApproved: async ()=>{
      try {
        await deleteInventoryItemRemote(item.ID);
        showToast('تم حذف الصنف بنجاح', 'success');
        window.deselectCurrentSelection();
        if(typeof render === 'function') render();
      } catch(e){
        showToast('تعذر الحذف: ' + e.message, 'error');
      }
    }
  });
};

window.selectInventoryItem = function(itemId){
  if(!itemId) return;
  const item = (state.inventory || []).find(x => String(x.ID) === String(itemId));
  if(!item) return;

  state.selectedInventoryItemId = String(itemId);
  state.selectedReceiptId = null;
  state.selectedReceiptNum = null;
  state.selectedReceiptIds = [];
  state.selectedCustomerId = null;
  state.selectedInvoiceId = null;
  state.selectedSaleId = null;

  document.querySelectorAll('.selected-row').forEach(el => el.classList.remove('selected-row'));
  document.querySelectorAll('.selected-badge-indicator').forEach(el => el.remove());

  const matchingRows = document.querySelectorAll(`tr[data-inv-id="${itemId}"]`);
  matchingRows.forEach(el => {
    el.classList.add('selected-row');
    const firstCell = el.querySelector('td:first-child > div');
    if(firstCell && !firstCell.querySelector('.selected-badge-indicator')){
      const b = document.createElement('span');
      b.className = 'badge badge-primary selected-badge-indicator';
      b.style.fontSize = '9.5px';
      b.style.padding = '1px 5px';
      b.textContent = 'محدد';
      firstCell.appendChild(b);
    }
  });

  window.renderUnifiedSelectionBar();
};

window.toggleInventorySelection = function(itemId){
  if(String(state.selectedInventoryItemId) === String(itemId)){
    window.deselectCurrentSelection();
  } else {
    window.selectInventoryItem(itemId);
  }
};

window.handleInventoryRowClick = function(itemId, evt){
  if(evt && evt.target && evt.target.closest('button, a, input, select')){
    return;
  }
  window.toggleInventorySelection(itemId);
};

// Invoice Direct Action & Selection Handlers
window.selectInvoice = function(invId){
  const inv = (state.invoices || []).find(x => String(x.ID) === String(invId));
  if(!inv) return;

  state.selectedInvoiceId = String(inv.ID);
  state.selectedReceiptId = null;
  state.selectedReceiptNum = null;
  state.selectedReceiptIds = [];
  state.selectedCustomerId = null;
  state.selectedInventoryItemId = null;
  state.selectedSaleId = null;

  document.querySelectorAll('.selected-row').forEach(el => el.classList.remove('selected-row'));
  document.querySelectorAll('.selected-badge-indicator').forEach(el => el.remove());

  const matchingRows = document.querySelectorAll(`tr[data-inv-id="${inv.ID}"]`);
  matchingRows.forEach(el => {
    el.classList.add('selected-row');
    const firstCell = el.querySelector('td:first-child > div');
    if(firstCell && !firstCell.querySelector('.selected-badge-indicator')){
      const b = document.createElement('span');
      b.className = 'badge badge-primary selected-badge-indicator';
      b.style.fontSize = '9.5px';
      b.style.padding = '1px 5px';
      b.textContent = 'محددة';
      firstCell.appendChild(b);
    }
  });

  if(typeof window.renderUnifiedSelectionBar === 'function') window.renderUnifiedSelectionBar();
};

window.toggleInvoiceSelection = function(invId){
  if(String(state.selectedInvoiceId) === String(invId)){
    window.deselectCurrentSelection();
  } else {
    window.selectInvoice(invId);
  }
};

window.handleInvoiceRowClick = function(invId, evt){
  if(evt && evt.target && evt.target.closest('button, a, input, select')){
    return;
  }
  window.toggleInvoiceSelection(invId);
};

window.openInvoicePrintDirect = function(invId, docType='invoice'){
  const inv = (state.invoices || []).find(x => String(x.ID) === String(invId));
  if(!inv){ showToast('لم يتم العثور على الفاتورة', 'error'); return; }
  if(typeof openInvoicePrint === 'function') openInvoicePrint(inv, docType);
};

window.openInvoiceBarcodeDirect = function(invId){
  const inv = (state.invoices || []).find(x => String(x.ID) === String(invId));
  if(!inv){ showToast('لم يتم العثور على الفاتورة', 'error'); return; }
  if(typeof openInvoiceBarcodePrintModal === 'function') openInvoiceBarcodePrintModal('invoice', inv.ID);
};

window.openInvoiceModalDirect = function(invId){
  const inv = (state.invoices || []).find(x => String(x.ID) === String(invId));
  if(!inv){ showToast('لم يتم العثور على الفاتورة', 'error'); return; }
  if(typeof openInvoiceModal === 'function') openInvoiceModal(inv);
};

window.openInvoiceWhatsappDirect = function(invId){
  const inv = (state.invoices || []).find(x => String(x.ID) === String(invId));
  if(!inv){ showToast('لم يتم العثور على الفاتورة', 'error'); return; }
  const phone = (inv.CustomerPhone || '').replace(/\D/g, '');
  if(!phone){ showToast('لا يوجد رقم هاتف مسجل لهذه الفاتورة', 'warning'); return; }
  const msg = `مرحبًا ${inv.CustomerName}،\nفاتورة / بيان سعر رقم: ${inv.InvoiceNumber}\nإجمالي المستحق: ${inv.Total} ج.م\nالمدفوع: ${inv.AmountPaid} ج.م\nالمتبقي: ${inv.Remaining} ج.م\nشكرًا لتعاملكم مع ${state.settings.shopName || 'ميكروتك'}.`;
  openWhatsappChat(inv.CustomerPhone, msg, {
    receiptId: 'invoice:' + inv.ID,
    receiptNumber: inv.InvoiceNumber,
    key: 'invoice',
    label: 'إرسال الفاتورة',
    auditDetails: `تم إرسال الفاتورة #${inv.InvoiceNumber} عبر واتساب للعميل (${inv.CustomerName || 'عميل'})`
  });
};

window.deleteInvoiceDirect = function(invId){
  const inv = (state.invoices || []).find(x => String(x.ID) === String(invId));
  if(!inv){ showToast('لم يتم العثور على الفاتورة', 'error'); return; }
  requestAdminAuthorization({
    action: 'حذف فاتورة',
    entityType: 'فاتورة رسمية',
    entityId: inv.ID,
    entityTitle: `رقم ${inv.InvoiceNumber} (${inv.CustomerName})`,
    onApproved: async ()=>{
      try{
        await deleteInvoiceRemote(inv.ID);
        state.invoices = (state.invoices || []).filter(x => x.ID !== inv.ID);
        showToast('تم حذف الفاتورة بنجاح', 'success');
        window.deselectCurrentSelection();
        const main = document.getElementById('main');
        if(main && typeof renderInvoicesPage === 'function') renderInvoicesPage(main);
      }catch(e){ showToast('تعذر الحذف: ' + e.message, 'error'); }
    }
  });
};

// POS Sales Direct Action & Selection Handlers
window.selectSale = function(saleId){
  const s = (state.sales || []).find(x => String(x.ID) === String(saleId));
  if(!s) return;

  state.selectedSaleId = String(s.ID);
  state.selectedReceiptId = null;
  state.selectedReceiptNum = null;
  state.selectedReceiptIds = [];
  state.selectedCustomerId = null;
  state.selectedInventoryItemId = null;
  state.selectedInvoiceId = null;

  document.querySelectorAll('.selected-row').forEach(el => el.classList.remove('selected-row'));
  document.querySelectorAll('.selected-badge-indicator').forEach(el => el.remove());

  const matchingRows = document.querySelectorAll(`tr[data-sale-id="${s.ID}"]`);
  matchingRows.forEach(el => {
    el.classList.add('selected-row');
    const firstCell = el.querySelector('td:first-child > div');
    if(firstCell && !firstCell.querySelector('.selected-badge-indicator')){
      const b = document.createElement('span');
      b.className = 'badge badge-green selected-badge-indicator';
      b.style.fontSize = '9.5px';
      b.style.padding = '1px 5px';
      b.textContent = 'محددة';
      firstCell.appendChild(b);
    }
  });

  if(typeof window.renderUnifiedSelectionBar === 'function') window.renderUnifiedSelectionBar();
};

window.toggleSaleSelection = function(saleId){
  if(String(state.selectedSaleId) === String(saleId)){
    window.deselectCurrentSelection();
  } else {
    window.selectSale(saleId);
  }
};

window.handleSaleRowClick = function(saleId, evt){
  if(evt && evt.target && evt.target.closest('button, a, input, select')){
    return;
  }
  window.toggleSaleSelection(saleId);
};

window.openPosReceiptDirect = function(saleId){
  const s = (state.sales || []).find(x => String(x.ID) === String(saleId));
  if(!s){ showToast('لم يتم العثور على عملية البيع', 'error'); return; }
  let cartItems = [];
  if(s.ItemsJSON){
    try {
      const parsed = typeof s.ItemsJSON==='string' ? JSON.parse(s.ItemsJSON) : s.ItemsJSON;
      if(Array.isArray(parsed)) cartItems = parsed;
    } catch(e){}
  }
  if(!cartItems.length){
    cartItems = [{ name: s.ItemsSummary, qty: 1, price: s.Total }];
  }
  if(typeof openSalePrint === 'function'){
    openSalePrint(s, cartItems);
  }
};

window.convertSaleToInvoiceDirect = function(saleId){
  const s = (state.sales || []).find(x => String(x.ID) === String(saleId));
  if(!s){ showToast('لم يتم العثور على عملية البيع', 'error'); return; }
  if(typeof convertSaleToInvoice === 'function'){
    convertSaleToInvoice(s.ID);
  }
};

window.openPosReturnDirect = function(saleId){
  const s = (state.sales || []).find(x => String(x.ID) === String(saleId));
  if(!s){ showToast('لم يتم العثور على عملية البيع', 'error'); return; }
  if(!s.IsReturned){
    if(typeof openPosReturnModal === 'function') openPosReturnModal(s);
  } else {
    if(typeof openPosReturnVoucherPrint === 'function') openPosReturnVoucherPrint(s, s.ReturnDetails || (s.Returns && s.Returns[s.Returns.length - 1]) || {});
  }
};

window.openSaleWhatsappDirect = function(saleId){
  const s = (state.sales || []).find(x => String(x.ID) === String(saleId));
  if(!s){ showToast('لم يتم العثور على عملية البيع', 'error'); return; }
  const phone = (s.CustomerPhone || '').replace(/\D/g, '');
  if(!phone){ showToast('لا يوجد رقم هاتف مسجل لهذه العملية', 'warning'); return; }
  const msg = `مرحبًا ${s.CustomerName || 'عميلنا العزيز'}،\nإيصال مبيعات رقم: #${s.ID.slice(-8)}\nالأصناف: ${s.ItemsSummary}\nالإجمالي: ${s.Total} ج.م\nشكرًا لتعاملكم مع ${state.settings.shopName || 'ميكروتك'}.`;
  openWhatsappChat(s.CustomerPhone, msg, {
    receiptId: 'sale:' + s.ID,
    receiptNumber: s.ID.slice(-8),
    key: 'sale',
    label: 'إرسال إيصال مبيعات',
    auditDetails: `تم إرسال إيصال مبيعات #${s.ID.slice(-8)} عبر واتساب للعميل (${s.CustomerName || 'عميل'})`
  });
};

// Quotation Direct Action & Selection Handlers
window.selectQuotation = function(qId){
  const q = (state.quotations || []).find(x => String(x.ID) === String(qId));
  if(!q) return;

  state.selectedQuotationId = String(q.ID);
  state.selectedReceiptId = null;
  state.selectedReceiptNum = null;
  state.selectedReceiptIds = [];
  state.selectedCustomerId = null;
  state.selectedInventoryItemId = null;
  state.selectedInvoiceId = null;
  state.selectedSaleId = null;
  state.selectedSupplierName = null;
  state.selectedPurchaseId = null;

  document.querySelectorAll('.selected-row').forEach(el => el.classList.remove('selected-row'));
  document.querySelectorAll('.selected-badge-indicator').forEach(el => el.remove());

  const matchingRows = document.querySelectorAll(`tr[data-quo-id="${q.ID}"]`);
  matchingRows.forEach(el => {
    el.classList.add('selected-row');
    const firstCell = el.querySelector('td:first-child > div');
    if(firstCell && !firstCell.querySelector('.selected-badge-indicator')){
      const b = document.createElement('span');
      b.className = 'badge badge-primary selected-badge-indicator';
      b.style.fontSize = '9.5px';
      b.style.padding = '1px 5px';
      b.textContent = 'محدد';
      firstCell.appendChild(b);
    }
  });

  if(typeof window.renderUnifiedSelectionBar === 'function') window.renderUnifiedSelectionBar();
};

window.toggleQuotationSelection = function(qId){
  if(String(state.selectedQuotationId) === String(qId)){
    window.deselectCurrentSelection();
  } else {
    window.selectQuotation(qId);
  }
};

window.handleQuotationRowClick = function(qId, evt){
  if(evt && evt.target && evt.target.closest('button, a, input, select')){
    return;
  }
  window.toggleQuotationSelection(qId);
};

window.openQuotationPrintDirect = function(qId){
  const q = (state.quotations || []).find(x => String(x.ID) === String(qId));
  if(!q){ showToast('لم يتم العثور على عرض السعر', 'error'); return; }
  if(typeof openQuotationPrint === 'function') openQuotationPrint(q, getQuotationItems(q));
};

window.openQuotationAgreementPrintDirect = function(qId){
  const q = (state.quotations || []).find(x => String(x.ID) === String(qId));
  if(!q){ showToast('لم يتم العثور على عرض السعر', 'error'); return; }
  if(typeof openQuotationAgreementPrint === 'function') openQuotationAgreementPrint(q, getQuotationItems(q));
};

window.convertQuotationToInvoiceDirect = function(qId){
  const q = (state.quotations || []).find(x => String(x.ID) === String(qId));
  if(!q){ showToast('لم يتم العثور على عرض السعر', 'error'); return; }
  if(typeof convertQuotationToInvoice === 'function') convertQuotationToInvoice(q);
};

window.openQuotationWhatsappDirect = function(qId){
  const q = (state.quotations || []).find(x => String(x.ID) === String(qId));
  if(!q){ showToast('لم يتم العثور على عرض السعر', 'error'); return; }
  if(typeof shareQuotationWhatsapp === 'function') shareQuotationWhatsapp(q);
};

// Supplier Direct Action & Selection Handlers
window.selectSupplier = function(supName){
  if(!supName) return;

  state.selectedSupplierName = String(supName);
  state.selectedReceiptId = null;
  state.selectedReceiptNum = null;
  state.selectedReceiptIds = [];
  state.selectedCustomerId = null;
  state.selectedInventoryItemId = null;
  state.selectedInvoiceId = null;
  state.selectedSaleId = null;
  state.selectedQuotationId = null;
  state.selectedPurchaseId = null;

  document.querySelectorAll('.selected-row').forEach(el => el.classList.remove('selected-row'));
  document.querySelectorAll('.selected-badge-indicator').forEach(el => el.remove());

  const matchingRows = document.querySelectorAll(`tr[data-sup-name="${escapeHtml(supName)}"]`);
  matchingRows.forEach(el => {
    el.classList.add('selected-row');
    const firstCell = el.querySelector('td:first-child > div');
    if(firstCell && !firstCell.querySelector('.selected-badge-indicator')){
      const b = document.createElement('span');
      b.className = 'badge badge-primary selected-badge-indicator';
      b.style.fontSize = '9.5px';
      b.style.padding = '1px 5px';
      b.textContent = 'محدد';
      firstCell.appendChild(b);
    }
  });

  if(typeof window.renderUnifiedSelectionBar === 'function') window.renderUnifiedSelectionBar();
};

window.toggleSupplierSelection = function(supName){
  if(String(state.selectedSupplierName) === String(supName)){
    window.deselectCurrentSelection();
  } else {
    window.selectSupplier(supName);
  }
};

window.handleSupplierRowClick = function(supName, evt){
  if(evt && evt.target && evt.target.closest('button, a, input, select')){
    return;
  }
  window.toggleSupplierSelection(supName);
};

window.openPaySupplierDirect = function(supName){
  if(typeof openPaySupplierModal === 'function') openPaySupplierModal(supName);
};

window.openSupplierStatementDirect = function(supName){
  if(typeof openSupplierStatementModal === 'function') openSupplierStatementModal(supName);
};

window.openSupplierHistoryDirect = function(supName){
  if(typeof openSupplierPaymentsHistoryModal === 'function') openSupplierPaymentsHistoryModal(supName);
};

window.openSupplierWhatsappDirect = function(supPhone, supName){
  const phone = String(supPhone || '').replace(/\D/g, '');
  if(!phone){ showToast('لا يوجد رقم هاتف مسجل لهذا المورد', 'warning'); return; }
  const msg = `مرحبًا ${supName || 'موردنا العزيز'}،\nبخصوص تعاملات التوريد والحساب مع ${state.settings.shopName || 'ميكروتك'}.`;
  openWhatsappChat(supPhone, msg, {
    receiptId: 'supplier:' + String(supPhone),
    key: 'supplier',
    label: 'مراسلة مورد',
    auditDetails: `تم مراسلة المورد (${supName || 'مورد'}) عبر واتساب`
  });
};

// Purchase Invoice Direct Action & Selection Handlers
window.selectPurchase = function(purId){
  const p = (state.purchases || []).find(x => String(x.ID) === String(purId));
  if(!p) return;

  state.selectedPurchaseId = String(p.ID);
  state.selectedReceiptId = null;
  state.selectedReceiptNum = null;
  state.selectedReceiptIds = [];
  state.selectedCustomerId = null;
  state.selectedInventoryItemId = null;
  state.selectedInvoiceId = null;
  state.selectedSaleId = null;
  state.selectedQuotationId = null;
  state.selectedSupplierName = null;

  document.querySelectorAll('.selected-row').forEach(el => el.classList.remove('selected-row'));
  document.querySelectorAll('.selected-badge-indicator').forEach(el => el.remove());

  const matchingRows = document.querySelectorAll(`tr[data-purchase-id="${p.ID}"]`);
  matchingRows.forEach(el => {
    el.classList.add('selected-row');
    const firstCell = el.querySelector('td:first-child > div');
    if(firstCell && !firstCell.querySelector('.selected-badge-indicator')){
      const b = document.createElement('span');
      b.className = 'badge badge-primary selected-badge-indicator';
      b.style.fontSize = '9.5px';
      b.style.padding = '1px 5px';
      b.textContent = 'محددة';
      firstCell.appendChild(b);
    }
  });

  if(typeof window.renderUnifiedSelectionBar === 'function') window.renderUnifiedSelectionBar();
};

window.togglePurchaseSelection = function(purId){
  if(String(state.selectedPurchaseId) === String(purId)){
    window.deselectCurrentSelection();
  } else {
    window.selectPurchase(purId);
  }
};

window.handlePurchaseRowClick = function(purId, evt){
  if(evt && evt.target && evt.target.closest('button, a, input, select')){
    return;
  }
  window.togglePurchaseSelection(purId);
};

window.toggleReceiptSelection = function(receiptId, receiptNum){
  const safeId = String(receiptId);
  if(state.selectedReceiptId === safeId){
    deselectCurrentSelection();
  } else {
    selectReceipt(receiptId, receiptNum);
  }
};

window.handleReceiptRowClick = function(receiptId, receiptNum, evt){
  if(evt && evt.target && evt.target.closest('button, a, input, select')){
    return;
  }
  toggleReceiptSelection(receiptId, receiptNum);
};

window.handleReceiptCardClick = function(receiptId, receiptNum, evt){
  if(evt && evt.target && evt.target.closest('button, a, input, select')){
    return;
  }
  toggleReceiptSelection(receiptId, receiptNum);
};

window.openReceiptActionSheet = function(receiptId, receiptNum){
  const r = findReceiptByIdOrNum(receiptId, receiptNum);
  if(!r){ showToast('لم يتم العثور على الإيصال المطلوب', 'error'); return; }

  const safeTargetId = String(r.id != null ? r.id : (r.ID != null ? r.ID : r.receiptNumber));
  const rNum = String(r.receiptNumber || r.ReceiptNumber || receiptNum || '');
  selectReceipt(safeTargetId, rNum);

  const cTitle = extractCustomerTitle(r);
  const cName = extractCustomerName(r) || 'عميل';
  const cPhone = extractCustomerPhone(r);
  const dCat = (r.device && r.device.category) || 'جهاز';
  const dBrand = (r.device ? (r.device.brand === 'أخرى' ? r.device.brandOther : r.device.brand) : '') || '';
  const dModel = (r.device && r.device.model) || '';
  const otherAmt = Number(r.otherAccountAmount || 0);
  const totalDue = Number(r.cost || 0) + Number(r.partsCost || 0) + otherAmt;
  const deposit = Number(r.deposit || 0);
  const remaining = Math.max(0, totalDue - deposit + Number(r.refunded || 0));
  const st = STATUSES.find(s => s.v === r.status) || STATUSES[0];

  const prevModal = document.getElementById('receiptActionSheetModal');
  if(prevModal) prevModal.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'receiptActionSheetModal';
  overlay.style.zIndex = '11000';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:580px;padding:22px;border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,0.28);">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--line);padding-bottom:14px;margin-bottom:16px;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="badge" style="background:var(--primary);color:#fff;font-weight:800;font-size:12px;padding:3px 8px;border-radius:6px;">إجراءات موحدة</span>
            <h3 style="margin:0;font-size:17px;color:var(--ink);">إيصال صيانة <span class="mono" style="direction:ltr;unicode-bidi:isolate;color:var(--primary);">#${escapeHtml(rNum)}</span></h3>
          </div>
          <div style="font-size:12px;color:var(--ink-secondary);margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span><b>${escapeHtml(cName)}</b></span>
            <span><b>${escapeHtml(dCat)} - ${escapeHtml(dBrand)} ${escapeHtml(dModel)}</b></span>
            <span class="status-badge ${st.cls}" style="font-size:10.5px;">${escapeHtml(r.status)}</span>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('receiptActionSheetModal').remove()" style="font-size:14px;border-radius:50%;width:32px;height:32px;padding:0;display:flex;align-items:center;justify-content:center;">&times;</button>
      </div>

      <!-- Financial Mini-Summary -->
      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;background:var(--paper2);padding:10px 12px;border-radius:12px;border:1px solid var(--line);margin-bottom:16px;text-align:center;">
        <div>
          <div style="font-size:10.5px;color:var(--ink-secondary);font-weight:700;">التكلفة الإجمالية</div>
          <div class="mono font-bold" style="font-size:14px;color:var(--ink);">${totalDue.toLocaleString()} ج.م</div>
        </div>
        <div style="border-right:1px solid var(--line);border-left:1px solid var(--line);">
          <div style="font-size:10.5px;color:var(--ink-secondary);font-weight:700;">المدفوع</div>
          <div class="mono font-bold" style="font-size:14px;color:var(--green);">${deposit.toLocaleString()} ج.م</div>
        </div>
        <div>
          <div style="font-size:10.5px;color:var(--ink-secondary);font-weight:700;">المتبقي</div>
          <div class="mono font-bold" style="font-size:14px;${remaining > 0 ? 'color:var(--red);' : 'color:var(--green);'}">${remaining.toLocaleString()} ج.م</div>
        </div>
      </div>

      <!-- Actions Grid -->
      <div class="action-sheet-section-title">إجراءات وخدمات الصيانة</div>
      <div class="action-sheet-grid">
        <div class="action-sheet-card-btn" style="border-color:rgba(124,58,237,0.35);background:rgba(124,58,237,0.04);" onclick="document.getElementById('receiptActionSheetModal').remove(); openAiDiagnosisModalDirect('${safeTargetId}', '${rNum}');">
          <div class="act-icon" style="color:#7c3aed;">${getSvgIcon('chart', 20)}</div>
          <div class="act-label" style="color:#6d28d9;">تشخيص العطل (AI)</div>
          <div class="act-desc">تحليل ذكي ومساعد الفني</div>
        </div>
        <div class="action-sheet-card-btn" onclick="document.getElementById('receiptActionSheetModal').remove(); openQuickStatusModalDirect('${safeTargetId}', '${rNum}');">
          <div class="act-icon">${getSvgIcon('refresh', 20)}</div>
          <div class="act-label">تغيير الحالة</div>
          <div class="act-desc">تحديث فوري لموقف الجهاز</div>
        </div>
        <div class="action-sheet-card-btn" onclick="document.getElementById('receiptActionSheetModal').remove(); openReceiptDetailModal('${safeTargetId}', '${rNum}');">
          <div class="act-icon">${getSvgIcon('edit', 20)}</div>
          <div class="act-label">تعديل الإيصال</div>
          <div class="act-desc">تعديل الأعطال والمبالغ</div>
        </div>
        <div class="action-sheet-card-btn" onclick="document.getElementById('receiptActionSheetModal').remove(); openReIntakeModalDirect('${safeTargetId}', '${rNum}');">
          <div class="act-icon">${getSvgIcon('tool', 20)}</div>
          <div class="act-label">صيانة راجعة</div>
          <div class="act-desc">إعادة إدخال نفس الجهاز</div>
        </div>
      </div>

      <div class="action-sheet-section-title">الطباعة والمستندات الرسمية</div>
      <div class="action-sheet-grid">
        <div class="action-sheet-card-btn" onclick="document.getElementById('receiptActionSheetModal').remove(); openReceiptPrintDirect('${safeTargetId}', '${rNum}', 'receipt');">
          <div class="act-icon">${getSvgIcon('printer', 20)}</div>
          <div class="act-label">طباعة A5</div>
          <div class="act-desc">إيصال استلام رسمي</div>
        </div>
        <div class="action-sheet-card-btn" onclick="document.getElementById('receiptActionSheetModal').remove(); openStickerPrintDirect('${safeTargetId}', '${rNum}', event);">
          <div class="act-icon">${getSvgIcon('tag', 20)}</div>
          <div class="act-label">ملصق الباركود</div>
          <div class="act-desc">طباعة لاصق للجهاز فوراً</div>
        </div>
        <div class="action-sheet-card-btn" onclick="document.getElementById('receiptActionSheetModal').remove(); openStickerOptionsDirect('${safeTargetId}', '${rNum}');">
          <div class="act-icon">${getSvgIcon('settings', 20)}</div>
          <div class="act-label">مقاس وضبط الملصق</div>
          <div class="act-desc">تغيير مقاس الرول (40×20 / 50×25)</div>
        </div>
        <div class="action-sheet-card-btn" onclick="document.getElementById('receiptActionSheetModal').remove(); convertReceiptToInvoiceDirect('${safeTargetId}', '${rNum}');">
          <div class="act-icon">${getSvgIcon('invoices', 20)}</div>
          <div class="act-label">تحويل لفاتورة</div>
          <div class="act-desc">فاتورة ضريبية رسمية</div>
        </div>
      </div>

      <div class="action-sheet-section-title">التواصل والعمليات</div>
      <div class="action-sheet-grid">
        <div class="action-sheet-card-btn" style="border-color:rgba(16,185,129,0.35);background:rgba(16,185,129,0.04);" onclick="document.getElementById('receiptActionSheetModal').remove(); openCostEstimateModalDirect('${safeTargetId}', '${rNum}');">
          <div class="act-icon" style="color:#059669;">${getSvgIcon('wallet', 20)}</div>
          <div class="act-label" style="color:#047857;">عرض ومقايسة التكلفة</div>
          <div class="act-desc">موافقة/رفض ورسوم الفحص</div>
        </div>
        <div class="action-sheet-card-btn" onclick="document.getElementById('receiptActionSheetModal').remove(); openWhatsappDirect('${safeTargetId}', '${rNum}');">
          <div class="act-icon" style="color:#22c55e;">${getSvgIcon('message', 20)}</div>
          <div class="act-label">محادثة واتساب</div>
          <div class="act-desc">إرسال التحديث للعميل</div>
        </div>
        ${cPhone && cPhone !== '0000000000' ? `
          <a href="tel:${cPhone}" class="action-sheet-card-btn" style="text-decoration:none;" onclick="document.getElementById('receiptActionSheetModal').remove();">
            <div class="act-icon" style="color:var(--blue);">${getSvgIcon('phone', 20)}</div>
            <div class="act-label">اتصال بالعميل</div>
            <div class="act-desc mono">${escapeHtml(cPhone)}</div>
          </a>
        ` : `
          <div class="action-sheet-card-btn" onclick="document.getElementById('receiptActionSheetModal').remove(); openQuickAddPhoneModal('${escapeHtml(cName)}', '${escapeHtml(cTitle)}', '${safeTargetId}', '${rNum}');">
            <div class="act-icon" style="color:var(--amber);">${getSvgIcon('alert', 20)}</div>
            <div class="act-label">تسجيل هاتف</div>
            <div class="act-desc">إضافة رقم للعميل</div>
          </div>
        `}
        <div class="action-sheet-card-btn" style="border-color:rgba(239,68,68,0.35);background:rgba(239,68,68,0.04);" onclick="document.getElementById('receiptActionSheetModal').remove(); openReceiptRefundModalDirect('${safeTargetId}', '${rNum}');">
          <div class="act-icon" style="color:var(--red);">${getSvgIcon('arrowLeft', 20)}</div>
          <div class="act-label" style="color:var(--red);">استرداد نقدي (مردودات)</div>
          <div class="act-desc">رد عربون أو مبالغ للعميل</div>
        </div>
        <div class="action-sheet-card-btn" style="border-color:rgba(239,68,68,0.3);background:rgba(239,68,68,0.03);" onclick="document.getElementById('receiptActionSheetModal').remove(); deleteReceiptDirect('${safeTargetId}', '${rNum}');">
          <div class="act-icon" style="color:var(--red);">${getSvgIcon('trash', 20)}</div>
          <div class="act-label" style="color:var(--red);">${(state.user && state.user.role === 'admin') ? 'حذف الإيصال' : 'طلب حذف'}</div>
          <div class="act-desc">${(state.user && state.user.role === 'admin') ? 'حذف نهائي' : 'طلب تصريح إداري'}</div>
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;margin-top:14px;border-top:1px solid var(--line);padding-top:12px;">
        <button class="btn btn-ghost" onclick="document.getElementById('receiptActionSheetModal').remove()">إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
};

/* ---------------- Customer Selection & Action Architecture ---------------- */

window.selectCustomer = function(custName, custPhone){
  if(!custName) return;
  state.selectedCustomerId = custName;
  state.selectedReceiptId = null;
  state.selectedReceiptNum = null;

  document.querySelectorAll('.selected-row').forEach(el => el.classList.remove('selected-row'));
  document.querySelectorAll('.selected-card').forEach(el => el.classList.remove('selected-card'));

  document.querySelectorAll('tr[data-cust-name]').forEach(el => {
    if(el.dataset.custName === custName){
      el.classList.add('selected-row');
    }
  });

  if(typeof window.renderUnifiedSelectionBar === 'function'){
    window.renderUnifiedSelectionBar();
  }
};

window.handleCustomerRowClick = function(custName, custPhone, evt){
  if(evt && evt.target && evt.target.closest('button, a, input, select')){
    return;
  }
  if(state.selectedCustomerId === custName){
    deselectCurrentSelection();
  } else {
    selectCustomer(custName, custPhone);
  }
};

window.openCustomerActionSheet = function(custName, custPhone, custTitle, custEmail){
  selectCustomer(custName, custPhone);
  const clientReceipts = (state.receipts || []).filter(r => {
    const rName = extractCustomerName(r);
    const rPhone = extractCustomerPhone(r);
    return (rName && rName.toLowerCase() === custName.toLowerCase()) || (custPhone && rPhone === custPhone);
  });

  const prevModal = document.getElementById('customerActionSheetModal');
  if(prevModal) prevModal.remove();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'customerActionSheetModal';
  overlay.style.zIndex = '11000';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:520px;padding:22px;border-radius:20px;box-shadow:0 24px 60px rgba(0,0,0,0.28);">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid var(--line);padding-bottom:14px;margin-bottom:16px;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="badge" style="background:#2563eb;color:#fff;font-weight:800;font-size:12px;padding:3px 8px;border-radius:6px;">خيارات العميل الموحدة</span>
            <h3 style="margin:0;font-size:17px;color:var(--ink);">${escapeHtml(custName)}</h3>
          </div>
          <div style="font-size:12px;color:var(--ink-secondary);margin-top:6px;display:flex;align-items:center;gap:8px;">
            ${custTitle ? `<span class="badge badge-gray">${escapeHtml(custTitle)}</span>` : ''}
            ${custPhone ? `<span class="mono">${escapeHtml(custPhone)}</span>` : '<span style="color:var(--amber);">بدون هاتف</span>'}
            <span class="badge badge-blue">${clientReceipts.length} جهاز مسجل</span>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('customerActionSheetModal').remove()" style="font-size:14px;border-radius:50%;width:32px;height:32px;padding:0;display:flex;align-items:center;justify-content:center;">&times;</button>
      </div>

      <div class="action-sheet-section-title">العمليات والمعاملات المباشرة</div>
      <div class="action-sheet-grid">
        <div class="action-sheet-card-btn" onclick="document.getElementById('customerActionSheetModal').remove(); startNewReceiptForCustomer('${escapeHtml(custName)}', '${escapeHtml(custPhone||'')}', '${escapeHtml(custTitle||'')}');">
          <div class="act-icon">${getSvgIcon('plus', 20)}</div>
          <div class="act-label">إيصال صيانة جديد</div>
          <div class="act-desc">استلام جهاز للعميل</div>
        </div>
        <div class="action-sheet-card-btn" onclick="document.getElementById('customerActionSheetModal').remove(); startNewInvoiceForCustomer('${escapeHtml(custName)}', '${escapeHtml(custPhone||'')}', '${escapeHtml(custTitle||'')}');">
          <div class="act-icon">${getSvgIcon('invoices', 20)}</div>
          <div class="act-label">فاتورة جديدة</div>
          <div class="act-desc">إصدار فاتورة بيع/خدمة</div>
        </div>
        <div class="action-sheet-card-btn" style="background:#eff6ff;border-color:#bfdbfe;" onclick="document.getElementById('customerActionSheetModal').remove(); openCustomerStatementModal('${escapeHtml(custName)}', '${escapeHtml(custPhone||'')}');">
          <div class="act-icon" style="color:#2563eb;">${getSvgIcon('chart', 20)}</div>
          <div class="act-label">كشف حساب تفصيلي</div>
          <div class="act-desc">سجل حركات ورصيد العميل</div>
        </div>
        <div class="action-sheet-card-btn" onclick="document.getElementById('customerActionSheetModal').remove(); openEditCustomerModal({ title: '${escapeHtml(custTitle||'')}', name: '${escapeHtml(custName)}', phone: '${escapeHtml(custPhone||'')}', email: '${escapeHtml(custEmail||'')}' });">
          <div class="act-icon">${getSvgIcon('edit', 20)}</div>
          <div class="act-label">تعديل البيانات</div>
          <div class="act-desc">تحديث الهاتف والاسم</div>
        </div>
        ${clientReceipts.length > 1 ? `
          <div class="action-sheet-card-btn" style="background:#f5f3ff;border-color:#ddd6fe;" onclick="document.getElementById('customerActionSheetModal').remove(); openCustomerConsolidatedInvoiceModal('${escapeHtml(custName)}');">
            <div class="act-icon" style="color:#7c3aed;">${getSvgIcon('fileText', 20)}</div>
            <div class="act-label">فاتورة مجمعة (${clientReceipts.length})</div>
            <div class="act-desc">فوترة لكافة أجهزة العميل</div>
          </div>
        ` : ''}
      </div>

      <div class="action-sheet-section-title">الاتصال والتواصل والأرشيف</div>
      <div class="action-sheet-grid">
        ${custPhone && custPhone !== '0000000000' ? `
          <a href="https://wa.me/${normalizePhoneForWa(custPhone)}" target="_blank" class="action-sheet-card-btn" style="text-decoration:none;" onclick="document.getElementById('customerActionSheetModal').remove();">
            <div class="act-icon" style="color:#22c55e;">${getSvgIcon('message', 20)}</div>
            <div class="act-label">واتساب</div>
            <div class="act-desc">محادثة فورية</div>
          </a>
          <a href="tel:${custPhone}" class="action-sheet-card-btn" style="text-decoration:none;" onclick="document.getElementById('customerActionSheetModal').remove();">
            <div class="act-icon" style="color:var(--blue);">${getSvgIcon('phone', 20)}</div>
            <div class="act-label">اتصال مباشر</div>
            <div class="act-desc mono">${escapeHtml(custPhone)}</div>
          </a>
        ` : `
          <div class="action-sheet-card-btn" onclick="document.getElementById('customerActionSheetModal').remove(); openQuickAddPhoneModal('${escapeJsString(custName)}', '${escapeJsString(custTitle||'')}');">
            <div class="act-icon" style="color:var(--amber);">${getSvgIcon('alert', 20)}</div>
            <div class="act-label">إضافة هاتف</div>
            <div class="act-desc">تسجيل رقم للتواصل</div>
          </div>
        `}
        ${clientReceipts.length > 0 ? `
          <div class="action-sheet-card-btn" onclick="document.getElementById('customerActionSheetModal').remove(); viewCustomerReceiptsInArchive('${escapeJsString(custName)}');">
            <div class="act-icon" style="color:var(--primary);">${getSvgIcon('folder', 20)}</div>
            <div class="act-label">سجل أجهزة العميل</div>
            <div class="act-desc">${clientReceipts.length} جهاز في الأرشيف</div>
          </div>
        ` : ''}
      </div>

      <div style="display:flex;justify-content:flex-end;margin-top:14px;border-top:1px solid var(--line);padding-top:12px;">
        <button class="btn btn-ghost" onclick="document.getElementById('customerActionSheetModal').remove()">إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
};
