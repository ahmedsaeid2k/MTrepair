/* ---------------- Suppliers, Purchases ---------------- */
function renderSuppliers(main){
  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon('users', 20)} إدارة الموردين</h2>
        <div class="subtitle">${state.suppliers.length} مورد مسجل</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-green btn-sm" id="openPaySupBtn">${getSvgIcon('dollar', 14)} سداد / دفع لمورد (سند صرف)</button>
      </div>
    </div>
    <div class="card">
      <h3>${getSvgIcon('plus', 16)} إضافة مورد جديد</h3>
      <div style="display:grid;grid-template-columns:140px 1.5fr 1fr 1fr;gap:10px;">
        <div class="field">
          <label>اللقب (اختياري)</label>
          <select id="newSupTitle">
            ${[''].concat(CUSTOMER_TITLES).map(t=>`<option value="${escapeHtml(t)}">${t ? escapeHtml(t) : '-- بدون لقب --'}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>اسم المورد / الشركة *</label><input id="newSupName" placeholder="الاسم ثلاثي أو اسم الشركة"></div>
        <div class="field"><label>رقم الهاتف</label><input id="newSupPhone" class="mono" placeholder="01xxxxxxxxx"></div>
        <div class="field"><label>ملاحظات</label><input id="newSupNotes" placeholder="مجال التوريد أو العنوان"></div>
      </div>
      <button class="btn btn-primary btn-sm" id="addSupBtn" style="margin-top:8px;">${getSvgIcon('plus', 14)} إضافة مورد</button>
    </div>
    <div id="unifiedSelectionTopSlot"></div>

    <div class="card">
      <h3>قائمة الموردين</h3>
      ${state.suppliers.length===0 ? '<div class="empty">لا يوجد موردون بعد.</div>' : `
      <div class="table-wrap"><table><thead><tr><th style="width:30%;">اللقب والاسم</th><th style="width:25%;">الهاتف والاتصال</th><th>ملاحظات ومجال التوريد</th><th style="width:18%;text-align:center;">سجل الحركات</th></tr></thead><tbody>
        ${state.suppliers.map(s=>{
          const sTitle = s.Title || s.title || '';
          const sName = s.Name || s.name || '';
          const isSelected = String(state.selectedSupplierName) === String(sName);
          const pCount = (state.expenses || []).filter(ex => (ex.Category === 'سداد موردين ومشتريات' || ex.Supplier) && ex.Supplier === sName).length;
          return `
            <tr class="selectable-row ${isSelected ? 'selected-row' : ''}" data-sup-name="${escapeHtml(sName)}" onclick="handleSupplierRowClick('${escapeHtml(sName)}', event)" ondblclick="openSupplierStatementModal('${escapeHtml(sName)}')" style="cursor:pointer;">
              <td>
                <div style="display:flex;align-items:center;gap:6px;">
                  ${isSelected ? '<span class="badge badge-primary selected-badge-indicator" style="font-size:9.5px;padding:1px 5px;">محدد</span>' : ''}
                  ${sTitle ? `<span class="badge" style="background:var(--paper2);color:var(--primary);font-size:11px;font-weight:700;border:1px solid var(--line);">${escapeHtml(sTitle)}</span>` : ''}
                  <b style="font-size:13.5px;">${escapeHtml(sName)}</b>
                </div>
              </td>
              <td>
                ${(s.Phone||s.phone) ? `
                  <div style="display:inline-flex;align-items:center;gap:6px;">
                    <span class="mono font-bold" style="font-size:12.5px;">${escapeHtml(s.Phone||s.phone)}</span>
                    <a href="tel:${escapeHtml(s.Phone||s.phone)}" class="btn btn-ghost btn-xs" style="padding:2px 6px;" title="اتصال هاتفي" onclick="event.stopPropagation();">${getSvgIcon('phone', 13)}</a>
                    <a href="https://wa.me/${normalizePhoneForWa(s.Phone||s.phone)}" target="_blank" class="btn btn-ghost btn-xs" style="padding:2px 6px;color:#22c55e;" title="محادثة واتساب" onclick="event.stopPropagation();">${getSvgIcon('message', 13)}</a>
                  </div>
                ` : '<span style="color:var(--ink-secondary);font-size:11px;">-</span>'}
              </td>
              <td style="font-size:12px;color:var(--ink-secondary);">${escapeHtml(s.Notes||s.notes||'-')}</td>
              <td style="text-align:center;">
                ${pCount ? `<span class="badge" style="background:var(--paper2);color:var(--ink);font-weight:700;border:1px solid var(--line);font-size:11px;">${getSvgIcon('fileText', 12)} ${pCount} سند صرف</span>` : `<span style="color:var(--ink-secondary);font-size:11px;">-</span>`}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody></table></div>`}
    </div>
  `;

  document.getElementById('addSupBtn').onclick = async ()=>{
    const title = document.getElementById('newSupTitle').value.trim();
    const name = document.getElementById('newSupName').value.trim();
    const phone = document.getElementById('newSupPhone').value.trim();
    const notes = document.getElementById('newSupNotes').value.trim();
    if(!name){ showToast('اكتب اسم المورد', 'error'); return; }
    try{
      const res = await saveSupplierRemote({ID:'', Title:title, Name:name, Phone:phone, Notes:notes});
      showToast('تمت إضافة المورد بنجاح', 'success');
      renderSuppliers(main);
    }catch(e){ showToast('تمت الإضافة محلياً', 'info'); }
  };

  const openPaySupBtn = document.getElementById('openPaySupBtn');
  if(openPaySupBtn) openPaySupBtn.onclick = () => openPaySupplierModal();

  if(typeof window.renderUnifiedSelectionBar === 'function'){
    window.renderUnifiedSelectionBar();
  }
}

function openPaySupplierModal(preselectedName){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '11500';
  let curMethod = 'cash';

  const suppliersList = (state.suppliers || []).map(s => (s.Name || s.name || '').trim()).filter(Boolean);

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:480px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
        <h3 style="margin:0;font-size:16px;color:var(--ink);display:flex;align-items:center;gap:6px;">
          <span>${getSvgIcon('dollar', 18)}</span>
          <span>تسجيل سند صرف / سداد دفعة لمورد</span>
        </h3>
        <button class="btn btn-ghost btn-xs" id="closePaySupModal" style="font-size:18px;line-height:1;">&times;</button>
      </div>

      <div class="field">
        <label>اختر المورد المستحق *</label>
        <select id="paySupSelect" style="font-weight:700;">
          <option value="">-- اختر من قائمة الموردين --</option>
          ${suppliersList.map(name => `<option value="${escapeHtml(name)}" ${preselectedName === name ? 'selected' : ''}>${escapeHtml(name)}</option>`).join('')}
        </select>
      </div>

      <div class="grid2">
        <div class="field">
          <label>المبلغ المدفوع (ج.م) *</label>
          <input id="paySupAmount" type="number" class="mono font-bold" placeholder="0" style="font-size:16px;direction:ltr;text-align:right;">
        </div>
        <div class="field">
          <label>تاريخ السداد *</label>
          <input id="paySupDate" type="date" value="${new Date().toISOString().slice(0,10)}">
        </div>
      </div>

      <!-- طرق الدفع المتاحة مطابقة لنقطة البيع POS -->
      <div class="pos-pay-section" style="margin-bottom:14px;">
        <label style="font-size:11.5px;font-weight:800;color:var(--ink);display:block;margin-bottom:6px;">
          ${getSvgIcon('creditCard', 14)} طريقة الدفع للمورد:
        </label>
        <div class="pos-pay-grid" id="supPayGrid">
          ${getActivePaymentMethods().map(pm => `
            <div class="pos-pay-btn ${pm.id==='cash'?'selected':''}" data-suppaymethod="${pm.id}">
              <span>${getSvgIcon(pm.id==='card'?'creditCard':(pm.id==='instapay'?'refresh':(pm.id==='vodafone'?'phone':'dollar')), 14)}</span>
              <span>${pm.name}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="grid2">
        <div class="field">
          <label>رقم الفاتورة / المرجع (اختياري)</label>
          <input id="paySupRef" placeholder="مثال: فاتورة توريد #102">
        </div>
        <div class="field">
          <label>البيان / ملاحظات الصرف</label>
          <input id="paySupNotes" placeholder="مثال: دفعة حساب بضاعة، قطع غيار...">
        </div>
      </div>

      <div class="actions-row" style="margin-top:16px;border-top:1px solid var(--line);padding-top:12px;">
        <button class="btn btn-ghost" id="cancelPaySupModal">إلغاء</button>
        <button class="btn btn-green" id="savePaySupBtn" style="font-weight:800;">${getSvgIcon('check', 14)} تسجيل سند الصرف بالخزينة</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('#closePaySupModal').onclick = () => overlay.remove();
  overlay.querySelector('#cancelPaySupModal').onclick = () => overlay.remove();

  overlay.querySelectorAll('#supPayGrid .pos-pay-btn').forEach(btn => {
    btn.onclick = () => {
      overlay.querySelectorAll('#supPayGrid .pos-pay-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      curMethod = btn.dataset.suppaymethod;
    };
  });

  overlay.querySelector('#savePaySupBtn').onclick = async () => {
    const supName = overlay.querySelector('#paySupSelect').value.trim();
    const amount = Number(overlay.querySelector('#paySupAmount').value);
    const date = overlay.querySelector('#paySupDate').value;
    const ref = overlay.querySelector('#paySupRef').value.trim();
    const notes = overlay.querySelector('#paySupNotes').value.trim();

    if(!supName){
      showToast('يرجى اختيار المورد أولاً', 'error');
      return;
    }
    if(!amount || amount <= 0){
      showToast('يرجى إدخال مبلغ صحيح', 'error');
      return;
    }

    const pmObj = getActivePaymentMethods().find(x => x.id === curMethod) || { name: 'نقدي (كاش)' };
    const payMethodName = pmObj.name;

    const saveBtn = overlay.querySelector('#savePaySupBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'جارٍ الحفظ...';

    const fullTitle = `سداد مورد: ${supName}${ref ? ' (' + ref + ')' : ''}`;
    const expObj = {
      ID: 'exp_sup_' + Date.now(),
      Date: date || new Date().toISOString().slice(0,10),
      Title: fullTitle,
      Amount: amount,
      Type: 'out',
      Category: 'سداد موردين ومشتريات',
      PaymentMethod: payMethodName,
      Supplier: supName,
      Reference: ref,
      Notes: notes ? `طريقة الدفع: [${payMethodName}] — ${notes}` : `سداد للمورد (${supName}) عبر [${payMethodName}]`,
      By: state.user ? state.user.name : 'نظام'
    };

    try {
      await saveExpenseRemote(expObj);

      // Auto Journal Entry for Supplier Payment:
      // Dr. 2101 (الموردون والدائنون) / Cr. 1101 (الخزينة) or 1102 (البنك والمحافظ)
      const pLow = String(payMethodName).toLowerCase();
      const isBank = pLow.includes('فيزا') || pLow.includes('card') || pLow.includes('انستاباي') || pLow.includes('إنستاباي') || pLow.includes('instapay') || pLow.includes('محفظ') || pLow.includes('فودافون');
      const isCredit = pLow.includes('آجل') || pLow.includes('اجل');
      const creditAccCode = isCredit ? '2101' : (isBank ? '1102' : '1101');
      const creditAccName = isCredit ? 'الموردون والدائنون (شيك/كمبيالة)' : (isBank ? 'البنك والحسابات الإلكترونية والمحافظ' : 'الخزينة الرئيسية (النقدية)');

      recordAutoJournalEntry(
        `سند صرف وسداد مورد (${supName}) - [${payMethodName}]`,
        'SupplierPayment',
        expObj.ID,
        [
          { AccountCode: '2101', AccountName: 'الموردون والدائنون', Debit: amount, Credit: 0, Notes: `سداد للمورد: ${supName}` },
          { AccountCode: creditAccCode, AccountName: creditAccName, Debit: 0, Credit: amount, Notes: `صرف عبر ${payMethodName}` }
        ]
      ).catch(e=>{});

      recordAuditLog('سند صرف مورد', 'الموردين', `تم تسجيل سند صرف لمورد: ${supName} بقيمة ${amount} ج.م بطريقة [${payMethodName}]`, expObj.ID);

      showToast(`تم تسجيل سداد ${amount.toLocaleString()} ج.م للمورد (${supName}) بنجاح`, 'success');
      overlay.remove();
      const main = document.getElementById('main');
      if(state.invHubTab === 'suppliers') renderSuppliers(main);
      else refreshInventorySectionOrTab();

      setTimeout(()=>{
        if(confirm(`تم تسجيل سداد ${amount.toLocaleString()} ج.م للمورد (${supName}) بنجاح\n\nهل ترغب في طباعة سند الصرف الآن؟`)){
          openExpenseVoucherPrint(expObj);
        }
      }, 100);
    } catch(err) {
      showToast('حدث خطأ أثناء حفظ السند: ' + (err.message || err), 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = 'تسجيل سند الصرف بالخزينة';
    }
  };
}

function openExpenseVoucherPrint(exp){
  if(!exp) return;
  const oldMount = document.getElementById('printMount');
  if(oldMount) oldMount.remove();
  const oldA5 = document.getElementById('dynamicA5ReceiptStyle');
  if(oldA5) oldA5.remove();
  const oldThermal = document.getElementById('dynamicThermalReceiptStyle');
  if(oldThermal) oldThermal.remove();
  const oldVoucher = document.getElementById('dynamicExpenseVoucherStyle');
  if(oldVoucher) oldVoucher.remove();

  const voucherStyle = document.createElement('style');
  voucherStyle.id = 'dynamicExpenseVoucherStyle';
  voucherStyle.innerHTML = `
    @media print {
      @page {
        size: A5 landscape !important;
        margin: 6mm !important;
      }
      body.printing-voucher {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
      }
      body.printing-voucher #app,
      body.printing-voucher .sidebar,
      body.printing-voucher .top-header,
      body.printing-voucher #toastContainer,
      body.printing-voucher .modal-overlay,
      body.printing-voucher .cmd-palette-overlay {
        display: none !important;
      }
      body.printing-voucher #printMount {
        display: block !important;
        width: 100% !important;
        margin: 0 auto !important;
      }
    }
  `;
  document.head.appendChild(voucherStyle);

  const shopName = (state.settings && state.settings.shopName) || 'صيانة ميكروتك';
  const shopPhone = (state.settings && state.settings.shopPhone) || '';
  const shopAddress = (state.settings && state.settings.shopAddress) || '';

  const mount = document.createElement('div');
  mount.id = 'printMount';
  mount.innerHTML = `
    <div style="width:100%;max-width:700px;margin:0 auto;background:#fff;color:#0f172a;border:2px solid #0f172a;border-radius:8px;padding:16px 20px;box-sizing:border-box;font-family:var(--font-main);direction:rtl;">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0f172a;padding-bottom:8px;margin-bottom:12px;">
        <div>
          ${state.settings.logoUrl ? `<img src="${state.settings.logoUrl}" style="max-height:36px;max-width:120px;object-fit:contain;margin-bottom:4px;"><br>` : ''}
          <h2 style="margin:0;font-size:18px;font-weight:900;">${escapeHtml(shopName)}</h2>
          <div style="font-size:11px;color:#475569;">${shopPhone ? 'هاتف: ' + escapeHtml(shopPhone) : ''} ${shopAddress ? '| ' + escapeHtml(shopAddress) : ''}</div>
        </div>
        <div style="text-align:center;">
          <div style="background:#0f172a;color:#fff;font-size:13.5px;font-weight:900;padding:4px 14px;border-radius:6px;display:inline-block;">
            سند صرف نقدية / سداد مورد
          </div>
          <div style="font-size:11px;color:#64748b;margin-top:4px;" class="mono">رقم السند: <b>${exp.ID}</b></div>
          <div style="font-size:10.5px;color:#64748b;">التاريخ: <b>${cleanDate(exp.Date)}</b></div>
        </div>
      </div>

      <!-- Voucher Body -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:12px;">
        <tr style="border-bottom:1px solid #cbd5e1;">
          <td style="width:25%;padding:6px 8px;background:#f8fafc;font-weight:bold;color:#475569;">يصرف للمستفيد / المورد:</td>
          <td style="padding:6px 8px;font-weight:900;font-size:13.5px;color:#0f172a;">${escapeHtml(exp.Supplier || exp.Title)}</td>
        </tr>
        <tr style="border-bottom:1px solid #cbd5e1;">
          <td style="padding:6px 8px;background:#f8fafc;font-weight:bold;color:#475569;">المبلغ المصروف:</td>
          <td style="padding:6px 8px;">
            <span class="mono" style="font-size:16px;font-weight:900;color:#dc2626;">${Number(exp.Amount||0).toLocaleString()} ج.م</span>
          </td>
        </tr>
        <tr style="border-bottom:1px solid #cbd5e1;">
          <td style="padding:6px 8px;background:#f8fafc;font-weight:bold;color:#475569;">طريقة الدفع / الصرف:</td>
          <td style="padding:6px 8px;font-weight:800;color:#0f172a;">
            ${getPaymentMethodBadge(exp.PaymentMethod || 'نقدي (كاش)')}
          </td>
        </tr>
        <tr style="border-bottom:1px solid #cbd5e1;">
          <td style="padding:6px 8px;background:#f8fafc;font-weight:bold;color:#475569;">المرجع / رقم الفاتورة:</td>
          <td style="padding:6px 8px;font-weight:700;">${escapeHtml(exp.Reference || '-')}</td>
        </tr>
        <tr>
          <td style="padding:6px 8px;background:#f8fafc;font-weight:bold;color:#475569;">البيان والغرض من الصرف:</td>
          <td style="padding:6px 8px;color:#334155;">${escapeHtml(exp.Notes || exp.Title || '-')}</td>
        </tr>
      </table>

      <!-- Signatures -->
      <div style="display:flex;justify-content:space-between;margin-top:20px;border-top:1.5px dashed #cbd5e1;padding-top:10px;font-size:11px;color:#475569;">
        <div style="text-align:center;width:40%;">
          <div>توقيع أمين الخزينة / المسؤول</div>
          <div style="margin-top:28px;border-bottom:1px dashed #94a3b8;width:80%;margin-left:auto;margin-right:auto;"></div>
          <div style="font-size:10px;color:#94a3b8;margin-top:3px;">${escapeHtml(exp.By || state.user?.name || '')}</div>
        </div>
        <div style="text-align:center;width:40%;">
          <div>توقيع المستلم / المورد</div>
          <div style="margin-top:28px;border-bottom:1px dashed #94a3b8;width:80%;margin-left:auto;margin-right:auto;"></div>
          <div style="font-size:10px;color:#94a3b8;margin-top:3px;">[ ......................................... ]</div>
        </div>
      </div>
    </div>
  `;

  document.body.classList.add('printing-voucher');
  document.body.appendChild(mount);
  setTimeout(()=>{
    window.print();
    mount.remove();
    document.body.classList.remove('printing-voucher');
    voucherStyle.remove();
  }, 250);
}

function openSupplierPaymentsHistoryModal(supName){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '11500';

  const payments = (state.expenses || []).filter(ex => (ex.Category === 'سداد موردين ومشتريات' || ex.Supplier) && ex.Supplier === supName);
  const total = payments.reduce((acc, ex) => acc + Number(ex.Amount || 0), 0);

  overlay.innerHTML = `
    <div class="modal-content" style="max-width:680px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;">
        <h3 style="margin:0;font-size:16.5px;color:var(--ink);display:flex;align-items:center;gap:6px;">
          <span>${getSvgIcon('fileText', 18)}</span>
          <span>سجل سدادات وسندات صرف المورد: <b>${escapeHtml(supName)}</b></span>
        </h3>
        <button class="btn btn-ghost btn-xs" id="closeSupHistModal" style="font-size:18px;line-height:1;">&times;</button>
      </div>

      <div style="background:var(--paper2);border:1px solid var(--line);border-radius:6px;padding:10px 14px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <span style="font-size:12px;color:var(--ink-secondary);">إجمالي ما تم سداده للمورد:</span>
          <div class="mono" style="font-size:18px;font-weight:900;color:var(--green);">${total.toLocaleString()} ج.م</div>
        </div>
        <button class="btn btn-sm btn-green" id="newPaySupFromHistBtn">${getSvgIcon('plus', 14)} تسجيل دفعة جديدة</button>
      </div>

      ${payments.length === 0 ? '<div class="empty">لا توجد سندات صرف مسجلة لهذا المورد بعد.</div>' : `
      <div class="table-wrap" style="max-height:360px;overflow-y:auto;">
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>المبلغ</th>
              <th>طريقة الدفع</th>
              <th>المرجع</th>
              <th>البيان</th>
              <th style="width:70px;text-align:center;">طباعة</th>
            </tr>
          </thead>
          <tbody>
            ${payments.slice().reverse().map(p => `
              <tr>
                <td class="mono font-bold" style="font-size:11.5px;white-space:nowrap;">${cleanDate(p.Date)}</td>
                <td class="mono font-bold" style="color:var(--red);">${Number(p.Amount||0).toLocaleString()} ج.م</td>
                <td>${getPaymentMethodBadge(p.PaymentMethod || 'نقدي (كاش)')}</td>
                <td style="font-size:11.5px;">${escapeHtml(p.Reference || '-')}</td>
                <td style="font-size:11.5px;color:var(--ink-secondary);">${escapeHtml(p.Notes || p.Title || '-')}</td>
                <td style="text-align:center;">
                  <button class="btn btn-xs btn-ghost" data-printvouch="${p.ID}" title="طباعة سند الصرف">${getSvgIcon('printer', 14)}</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`}

      <div class="actions-row" style="margin-top:16px;border-top:1px solid var(--line);padding-top:12px;">
        <button class="btn btn-ghost" id="dismissSupHistModal">إغلاق</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector('#closeSupHistModal').onclick = () => overlay.remove();
  overlay.querySelector('#dismissSupHistModal').onclick = () => overlay.remove();

  const newPayBtn = overlay.querySelector('#newPaySupFromHistBtn');
  if(newPayBtn){
    newPayBtn.onclick = () => {
      overlay.remove();
      openPaySupplierModal(supName);
    };
  }

  overlay.querySelectorAll('[data-printvouch]').forEach(btn => {
    btn.onclick = () => {
      const exp = payments.find(x => x.ID === btn.dataset.printvouch);
      if(exp) openExpenseVoucherPrint(exp);
    };
  });
}

function renderPurchases(main){
  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon('truck', 20)} فواتير الشراء من الموردين</h2>
        <div class="subtitle">${state.purchases.length} فاتورة مسجلة</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-purple btn-sm" id="btnPurchasesBatchBarcode">${getSvgIcon('barcode', 14)} طباعة باركود من فاتورة</button>
        <button class="btn btn-primary btn-sm" id="btnNewPurchaseInvoice">${getSvgIcon('plus', 14)} فاتورة شراء وتوريد جديدة</button>
      </div>
    </div>
    <div id="unifiedSelectionTopSlot"></div>

    <div class="card">
      <h3>آخر فواتير الشراء</h3>
      ${state.purchases.length===0 ? '<div class="empty">لا توجد فواتير شراء بعد. اضغط على "فاتورة شراء وتوريد جديدة" لتسجيل بضاعة جديدة وتوريد المخزن.</div>' : `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:120px;">التاريخ</th>
              <th style="width:180px;">المورد</th>
              <th style="min-width:240px;">الأصناف والمحتوى</th>
              <th style="width:130px;">الإجمالي</th>
              <th style="width:130px;">المدفوع</th>
              <th style="width:130px;">المتبقي (آجل)</th>
            </tr>
          </thead>
          <tbody>
            ${state.purchases.slice().reverse().map(p=>{
              const tot = Number(p.Total||0);
              const paid = Number(p.AmountPaid!=null?p.AmountPaid:tot);
              const rem = Math.max(0, tot - paid);
              const isSelected = String(state.selectedPurchaseId) === String(p.ID);
              return `
                <tr class="selectable-row ${isSelected ? 'selected-row' : ''}" data-purchase-id="${p.ID}" onclick="handlePurchaseRowClick('${p.ID}', event)" ondblclick="openInvoiceBarcodePrintModal('purchase', '${escapeHtml(String(p.ID||''))}')" style="cursor:pointer;">
                  <td>
                    <div style="display:flex;align-items:center;gap:6px;">
                      ${isSelected ? '<span class="badge badge-primary selected-badge-indicator" style="font-size:9.5px;padding:1px 5px;">محددة</span>' : ''}
                      <span>${cleanDate(p.Date)}</span>
                    </div>
                  </td>
                  <td><b>${escapeHtml(p.Supplier||'')}</b></td>
                  <td style="font-size:12px;color:var(--ink-secondary);">${escapeHtml(p.ItemsSummary||'')}</td>
                  <td class="mono font-bold">${tot.toLocaleString()} ج.م</td>
                  <td class="mono" style="color:var(--green);">${paid.toLocaleString()} ج.م</td>
                  <td class="mono font-bold" style="color:${rem>0?'var(--red)':'var(--ink-secondary)'};">${rem>0 ? rem.toLocaleString() + ' ج.م' : 'خالص'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>`}
    </div>
  `;
  const btnBatch = document.getElementById('btnPurchasesBatchBarcode');
  if(btnBatch) btnBatch.onclick = () => openInvoiceBarcodePrintModal('purchase');
  const btnNewPur = document.getElementById('btnNewPurchaseInvoice');
  if(btnNewPur) btnNewPur.onclick = () => openNewPurchaseModal();

  if(typeof window.renderUnifiedSelectionBar === 'function'){
    window.renderUnifiedSelectionBar();
  }
}

function openNewPurchaseModal(){
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'newPurchaseModalOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;';

  const suppliersList = state.suppliers || [];
  const inventoryList = state.inventory || [];

  let items = [
    { itemId: '', name: '', qty: 1, purchasePrice: 0 }
  ];

  function renderRows(){
    const tbody = overlay.querySelector('#purItemsTableBody');
    if(!tbody) return;
    tbody.innerHTML = items.map((it, idx) => `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:6px;">
          <select class="pur-row-item-select" data-idx="${idx}" style="width:100%;font-size:12px;padding:6px;border:1px solid #cbd5e1;border-radius:4px;">
            <option value="">-- اختر صنف من المخزن أو اكتب يدوياً --</option>
            ${inventoryList.map(inv => `<option value="${escapeHtml(inv.ID)}" ${it.itemId===inv.ID?'selected':''}>${escapeHtml(inv.Name)} (رصيد: ${inv.Quantity||0})</option>`).join('')}
          </select>
          <input type="text" class="pur-row-item-name" data-idx="${idx}" placeholder="اسم الصنف (إذا كان جديداً)..." value="${escapeHtml(it.name||'')}" style="width:100%;font-size:11.5px;padding:4px 6px;margin-top:4px;border:1px solid #e2e8f0;border-radius:4px;display:${it.itemId?'none':'block'};">
        </td>
        <td style="padding:6px;width:90px;">
          <input type="number" min="1" step="1" class="pur-row-qty mono" data-idx="${idx}" value="${it.qty}" style="width:100%;text-align:center;font-weight:bold;font-size:13px;padding:6px;border:1px solid #cbd5e1;border-radius:4px;">
        </td>
        <td style="padding:6px;width:110px;">
          <input type="number" min="0" step="any" class="pur-row-price mono" data-idx="${idx}" value="${it.purchasePrice||''}" placeholder="سعر الشراء" style="width:100%;text-align:center;font-weight:bold;font-size:13px;padding:6px;border:1px solid #cbd5e1;border-radius:4px;">
        </td>
        <td style="padding:6px;width:110px;text-align:center;font-weight:800;" class="mono pur-row-total">
          ${(Number(it.qty||0) * Number(it.purchasePrice||0)).toLocaleString()} ج.م
        </td>
        <td style="padding:6px;width:40px;text-align:center;">
          ${items.length > 1 ? `<button type="button" class="btn btn-xs btn-red pur-row-del" data-idx="${idx}" title="حذف السطر" style="font-size:16px;line-height:1;">&times;</button>` : ''}
        </td>
      </tr>
    `).join('');

    // Reattach listeners
    tbody.querySelectorAll('.pur-row-item-select').forEach(sel => {
      sel.onchange = (e) => {
        const i = Number(e.target.dataset.idx);
        const selId = e.target.value;
        const inv = inventoryList.find(x => x.ID === selId);
        if(inv){
          items[i].itemId = inv.ID;
          items[i].name = inv.Name;
          items[i].purchasePrice = Number(inv.PurchasePrice || 0);
        } else {
          items[i].itemId = '';
        }
        renderRows();
        recalcTotals();
      };
    });

    tbody.querySelectorAll('.pur-row-item-name').forEach(inp => {
      inp.oninput = (e) => {
        const i = Number(e.target.dataset.idx);
        items[i].name = e.target.value;
      };
    });

    tbody.querySelectorAll('.pur-row-qty').forEach(inp => {
      inp.oninput = (e) => {
        const i = Number(e.target.dataset.idx);
        items[i].qty = Math.max(1, parseFloat(toEngDigits(e.target.value)) || 1);
        recalcTotals();
      };
    });

    tbody.querySelectorAll('.pur-row-price').forEach(inp => {
      inp.oninput = (e) => {
        const i = Number(e.target.dataset.idx);
        items[i].purchasePrice = Math.max(0, parseFloat(toEngDigits(e.target.value)) || 0);
        recalcTotals();
      };
    });

    tbody.querySelectorAll('.pur-row-del').forEach(btn => {
      btn.onclick = (e) => {
        const i = Number(btn.dataset.idx);
        items.splice(i, 1);
        renderRows();
        recalcTotals();
      };
    });
  }

  function recalcTotals(){
    const grandTotal = items.reduce((s, it) => s + (Number(it.qty||0) * Number(it.purchasePrice||0)), 0);
    const totalEl = overlay.querySelector('#purGrandTotal');
    if(totalEl) totalEl.textContent = grandTotal.toLocaleString() + ' ج.م';

    const payMode = overlay.querySelector('#purPayMode').value;
    const paidInp = overlay.querySelector('#purAmountPaid');
    if(payMode === 'cash_full' || payMode === 'bank_full'){
      paidInp.value = grandTotal;
      paidInp.disabled = true;
    } else if(payMode === 'credit_full'){
      paidInp.value = 0;
      paidInp.disabled = true;
    } else {
      paidInp.disabled = false;
    }

    const paidVal = parseFloat(toEngDigits(paidInp.value)) || 0;
    const remaining = Math.max(0, grandTotal - paidVal);
    const remEl = overlay.querySelector('#purRemaining');
    if(remEl) remEl.textContent = remaining.toLocaleString() + ' ج.م';
  }

  overlay.innerHTML = `
    <div style="background:#fff;border-radius:12px;box-shadow:0 20px 40px rgba(0,0,0,0.2);width:100%;max-width:760px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;border:1px solid #cbd5e1;">
      <div style="background:linear-gradient(135deg,#1e293b,#0f172a);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h3 style="margin:0;font-size:16px;font-weight:900;display:flex;align-items:center;gap:8px;">${getSvgIcon('truck', 18)} تسجيل فاتورة شراء وتوريد مخزون جديدة</h3>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px;">إضافة أصناف للمخزن + توليد القيود المحاسبية التلقائية (مخزون 1104 / موردين 2101 / خزينة)</div>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" id="closePurModalBtn" style="color:#fff;font-size:18px;line-height:1;" style="font-size:16px;line-height:1;">&times;</button>
      </div>

      <div style="padding:16px 20px;overflow-y:auto;flex:1;">
        <!-- Top Metadata Row -->
        <div style="display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:12px;margin-bottom:14px;">
          <div>
            <label style="font-size:11.5px;font-weight:800;color:#334155;display:block;margin-bottom:4px;">المورد / جهة الشراء *</label>
            <div style="display:flex;gap:6px;">
              <select id="purSupplierSelect" style="flex:1;padding:7px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:12.5px;font-weight:700;">
                <option value="">-- اختر مورد مسجل --</option>
                ${suppliersList.map(s => `<option value="${escapeHtml(s.Name)}">${escapeHtml(s.Name)}</option>`).join('')}
              </select>
              <input type="text" id="purNewSupplierInput" placeholder="أو اكتب اسم مورد جديد..." style="flex:1;padding:7px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;">
            </div>
          </div>
          <div>
            <label style="font-size:11.5px;font-weight:800;color:#334155;display:block;margin-bottom:4px;">تاريخ الفاتورة *</label>
            <input type="date" id="purDateInput" value="${new Date().toISOString().slice(0,10)}" style="width:100%;padding:7px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:12.5px;">
          </div>
          <div>
            <label style="font-size:11.5px;font-weight:800;color:#334155;display:block;margin-bottom:4px;">فترة الضمان (شهور)</label>
            <input type="number" min="0" id="purWarrantyInput" placeholder="مثلاً: 12" style="width:100%;padding:7px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:12.5px;">
          </div>
        </div>

        <!-- Items Table -->
        <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:14px;">
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead style="background:#f8fafc;border-bottom:1.5px solid #cbd5e1;">
              <tr>
                <th style="padding:8px 10px;text-align:right;">الصنف / قطع الغيار</th>
                <th style="padding:8px;text-align:center;width:90px;">الكمية</th>
                <th style="padding:8px;text-align:center;width:110px;">سعر الشراء</th>
                <th style="padding:8px;text-align:center;width:110px;">الإجمالي</th>
                <th style="padding:8px;width:40px;"></th>
              </tr>
            </thead>
            <tbody id="purItemsTableBody"></tbody>
          </table>
          <div style="padding:8px 12px;background:#f8fafc;border-top:1px solid #e2e8f0;">
            <button type="button" class="btn btn-ghost btn-sm" id="purAddItemRowBtn" style="color:var(--primary);font-weight:800;display:inline-flex;align-items:center;gap:6px;">
              ${getSvgIcon('plus', 14)} إضافة صنف آخر للفاتورة
            </button>
          </div>
        </div>

        <!-- Payment and Summary Box -->
        <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;padding:14px;display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div>
            <label style="font-size:11.5px;font-weight:800;color:#334155;display:block;margin-bottom:4px;">حالة وطريقة السداد *</label>
            <select id="purPayMode" style="width:100%;padding:7px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;font-weight:700;margin-bottom:8px;">
              <option value="cash_full">سداد نقدي بالكامل (من الخزينة 1101)</option>
              <option value="bank_full">سداد إلكتروني بالكامل (بنك / محفظة 1102)</option>
              <option value="credit_full">شراء آجل بالكامل (على حساب المورد 2101)</option>
              <option value="partial">سداد دفعة مقدمة والباقي آجل</option>
            </select>
            <div style="display:flex;align-items:center;gap:8px;">
              <label style="font-size:11.5px;font-weight:700;color:#475569;">المبلغ المسدد الآن:</label>
              <input type="number" min="0" step="any" id="purAmountPaid" style="flex:1;padding:6px 8px;border:1px solid #cbd5e1;border-radius:6px;font-weight:bold;text-align:center;" class="mono font-bold">
            </div>
          </div>
          <div style="text-align:left;display:flex;flex-direction:column;justify-content:center;border-right:2px dashed #cbd5e1;padding-right:16px;">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;">
              <span style="color:#64748b;font-weight:700;">إجمالي الفاتورة:</span>
              <span class="mono font-bold" id="purGrandTotal" style="font-size:16px;color:#0f172a;">0 ج.م</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px;">
              <span style="color:#64748b;font-weight:700;">المتبقي للمورد (آجل):</span>
              <span class="mono font-bold" id="purRemaining" style="font-size:15px;color:#dc2626;">0 ج.م</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div style="background:#f1f5f9;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #cbd5e1;">
        <button type="button" class="btn btn-ghost btn-sm" id="cancelPurBtn">إلغاء</button>
        <button type="button" class="btn btn-primary btn-sm" id="savePurBtn" style="padding:8px 24px;font-weight:900;">
          حفظ الفاتورة وتوريد المخزن
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  renderRows();
  recalcTotals();

  overlay.querySelector('#closePurModalBtn').onclick = () => overlay.remove();
  overlay.querySelector('#cancelPurBtn').onclick = () => overlay.remove();

  overlay.querySelector('#purAddItemRowBtn').onclick = () => {
    items.push({ itemId: '', name: '', qty: 1, purchasePrice: 0 });
    renderRows();
    recalcTotals();
  };

  overlay.querySelector('#purPayMode').onchange = recalcTotals;
  overlay.querySelector('#purAmountPaid').oninput = recalcTotals;

  overlay.querySelector('#purSupplierSelect').onchange = (e) => {
    const customInp = overlay.querySelector('#purNewSupplierInput');
    if(e.target.value) customInp.value = '';
  };
  overlay.querySelector('#purNewSupplierInput').oninput = (e) => {
    if(e.target.value) overlay.querySelector('#purSupplierSelect').value = '';
  };

  overlay.querySelector('#savePurBtn').onclick = async () => {
    const selSup = overlay.querySelector('#purSupplierSelect').value;
    const newSup = overlay.querySelector('#purNewSupplierInput').value.trim();
    const supName = newSup || selSup;
    if(!supName){
      showToast('يرجى اختيار أو كتابة اسم المورد', 'error');
      return;
    }

    const dateVal = overlay.querySelector('#purDateInput').value || new Date().toISOString().slice(0,10);
    const warrantyVal = Number(overlay.querySelector('#purWarrantyInput').value || 0);

    const validItems = items.filter(it => (it.itemId || (it.name && it.name.trim())) && Number(it.qty) > 0 && Number(it.purchasePrice) >= 0);
    if(!validItems.length){
      showToast('يرجى إضافة صنف واحد على الأقل مع الكمية وسعر الشراء', 'error');
      return;
    }

    // Auto-create new inventory items if custom item was typed (batched to reduce API calls)
    const newItemsToSave = [];
    for(const it of validItems){
      if(!it.itemId && it.name){
        const existingInv = (state.inventory||[]).find(x => x.Name.trim().toLowerCase() === it.name.trim().toLowerCase());
        if(existingInv){
          it.itemId = existingInv.ID;
        } else {
          const newInvItem = {
            ID: 'inv_' + Date.now() + '_' + Math.floor(Math.random()*1000),
            Name: it.name.trim(),
            Category: 'بضائع عامة',
            Quantity: 0,
            PurchasePrice: Number(it.purchasePrice||0),
            SellPrice: Math.round(Number(it.purchasePrice||0) * 1.25)
          };
          state.inventory.push(newInvItem);
          newItemsToSave.push(newInvItem);
          it.itemId = newInvItem.ID;
        }
      }
    }
    // Batch save all new items concurrently (instead of N sequential calls)
    if(newItemsToSave.length > 0){
      setCache('inventory', state.inventory);
      Promise.all(newItemsToSave.map(item => apiPost('saveInventoryItem', { data: item }).catch(()=>{}))).catch(()=>{});
    }

    const grandTotal = validItems.reduce((s, it) => s + (Number(it.qty) * Number(it.purchasePrice)), 0);
    const paidVal = parseFloat(toEngDigits(overlay.querySelector('#purAmountPaid').value)) || 0;
    const payMode = overlay.querySelector('#purPayMode').value;
    const payMethodName = payMode === 'bank_full' ? 'بنك / محفظة إلكترونية' : (payMode === 'credit_full' ? 'آجل' : 'نقدي');

    const itemsSummary = validItems.map(it => `${it.name} × ${it.qty} (${(it.qty * it.purchasePrice).toLocaleString()} ج.م)`).join('، ');

    const saveBtn = overlay.querySelector('#savePurBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'جارٍ الحفظ...';

    const purObj = {
      ID: 'pur_' + Date.now(),
      Date: dateVal,
      Supplier: supName,
      SupplierID: '',
      ItemsSummary: itemsSummary,
      Total: grandTotal,
      AmountPaid: paidVal,
      PaymentMethod: payMethodName,
      WarrantyMonths: warrantyVal
    };

    try {
      await savePurchaseRemote(purObj, validItems);
      showToast('تم حفظ فاتورة الشراء وتوريد المخزن بنجاح', 'success');
      overlay.remove();
      const main = document.getElementById('main');
      if(main) renderPurchases(main);

      setTimeout(() => {
        if(confirm(`تم توريد أصناف الفاتورة بنجاح\n\nهل ترغب في فتح نافذة طباعة ملصقات الباركود لهذه الأصناف المشتراة؟`)){
          openInvoiceBarcodePrintModal('purchase', purObj.ID);
        }
      }, 200);
    } catch(err) {
      showToast('حدث خطأ أثناء حفظ الفاتورة: ' + (err.message || err), 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = 'حفظ الفاتورة وتوريد المخزن';
    }
  };
}
