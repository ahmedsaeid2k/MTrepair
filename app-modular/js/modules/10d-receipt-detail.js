/* ---------------- Receipt Detail & Full Edit ---------------- */
async function openReceiptDetail(rawR){
  if(!rawR){
    showToast('لم يتم العثور على الإيصال المطلوب', 'error');
    return;
  }
  try {
    const r = (typeof normalizeReceipt === 'function') ? (normalizeReceipt(rawR) || rawR) : rawR;
    const initialStatus = r.status;
    const remaining = (typeof getReceiptRemaining === 'function') ? getReceiptRemaining(r) : Math.max(0, Number(r.cost||0)+Number(r.partsCost||0)+Number(r.otherAccountAmount||0)-Number(r.deposit||0)+Number(r.refunded||0));
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const curTitle = extractCustomerTitle(r) || (r.customer && r.customer.title) || '';
    const curName = extractCustomerName(r) || (r.customer && r.customer.name) || '';
    const titleOptions = [''].concat(CUSTOMER_TITLES).map(t=>`<option value="${escapeHtml(t)}" ${curTitle===t?'selected':''}>${t ? escapeHtml(t) : '-- بدون لقب --'}</option>`).join('');

    overlay.innerHTML = `
    <div class="modal-content" style="max-width:700px;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--line);padding-bottom:10px;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
        <h3 style="margin:0;font-size:17px;display:flex;align-items:center;gap:6px;">${getSvgIcon("tool", 18)} إيصال صيانة: <span class="mono" style="color:var(--primary);">${escapeHtml(r.receiptNumber)}</span></h3>
        <div style="display:flex;align-items:center;gap:6px;">
          <button type="button" class="btn btn-xs" id="detailAiDiagBtn" style="background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;border:none;border-radius:6px;font-weight:700;display:inline-flex;align-items:center;gap:4px;box-shadow:0 2px 5px rgba(124,58,237,0.25);cursor:pointer;" title="المساعد الذكي لتشخيص العطل واقتراح القياسات">
            <span>${getSvgIcon('chart', 14)}</span> تشخيص الأعطال
          </button>
          <button class="btn btn-ghost btn-xs" id="closeDetailBtn">إغلاق</button>
        </div>
      </div>

      <div style="background:var(--paper2);border:1px solid var(--line);border-radius:var(--radius-sm);padding:7px 12px;margin-bottom:12px;font-size:12px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
        <div><b>تاريخ ووقت الاستلام:</b> <span class="mono">${cleanDate(r.date)}</span> <b class="mono" style="color:var(--primary);margin-right:4px;">${formatReceiptTime(r) || r.time || 'غير محدد'}</b></div>
        ${r.createdBy ? `<div style="color:var(--ink-secondary);font-size:11.5px;">الموظف المستلم: <b>${escapeHtml(r.createdBy)}</b></div>` : ''}
      </div>

      ${r.previousReceiptNumber ? `
        <div style="background:rgba(245,158,11,0.1);border:1px solid var(--amber);border-radius:var(--radius-sm);padding:8px 12px;margin-bottom:12px;font-size:12px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span style="display:inline-flex;margin-left:4px;">${getSvgIcon("refresh", 14)}</span>
            <b>دورة صيانة ${r.serviceCycle || 2}:</b> مرتبط بالإيصال السابق <b class="mono">#${escapeHtml(r.previousReceiptNumber)}</b> <span style="color:var(--ink-secondary);font-size:11.5px;">${r.reIntakeReason ? '— ' + escapeHtml(r.reIntakeReason) : ''}</span>
          </div>
          <button type="button" class="btn btn-amber btn-xs view-hist-receipt-btn" data-histnum="${escapeHtml(r.previousReceiptNumber)}">عرض الإيصال السابق ↗</button>
        </div>
      ` : ''}

      ${r.nextReceiptNumber ? `
        <div style="background:rgba(59,130,246,0.1);border:1px solid var(--primary);border-radius:var(--radius-sm);padding:8px 12px;margin-bottom:12px;font-size:12px;display:flex;justify-content:space-between;align-items:center;">
          <div>
            <span style="font-size:15px;margin-left:4px;">ℹ️</span>
            <b>تمت إعادة إدخال الجهاز للصيانة لاحقاً:</b> برقم إيصال جديد <b class="mono">#${escapeHtml(r.nextReceiptNumber)}</b>
          </div>
          <button type="button" class="btn btn-blue btn-xs view-hist-receipt-btn" data-histnum="${escapeHtml(r.nextReceiptNumber)}">عرض الإيصال الجديد ↗</button>
        </div>
      ` : ''}

      <div style="display:grid;grid-template-columns:140px 1fr 1fr;gap:10px;">
        <div class="field">
          <label>اللقب (اختياري)</label>
          <select id="eTitle">
            ${titleOptions}
          </select>
        </div>
        <div class="field"><label>اسم العميل</label><input id="eName" value="${escapeHtml(curName)}"></div>
        <div class="field"><label>رقم هاتف العميل</label><input id="ePhone" value="${escapeHtml(r.customer.phone||'')}"></div>
      </div>

      ${(Array.isArray(r.devices) && r.devices.length > 1) ? `
        <div style="background:var(--paper2);border:1px solid var(--line);border-radius:var(--radius-sm);padding:8px 10px;margin-bottom:12px;">
          <div style="font-size:11.5px;font-weight:800;color:var(--ink-secondary);margin-bottom:6px;">
            أجهزة هذا الإيصال (${r.devices.length} أجهزة) — اضغط للتبديل وتعديل بيانات كل جهاز وأعطاله:
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;" id="detailDevTabsBar">
            ${r.devices.map((dv, idx) => {
              const isAct = idx === 0;
              const b = dv.brand === 'أخرى' ? dv.brandOther : (dv.brand || '');
              const t = `${dv.category || 'جهاز'} ${b} ${dv.model || ''}`.trim() || `جهاز #${idx+1}`;
              return `
                <button type="button" class="btn btn-xs ${isAct ? 'btn-primary' : 'btn-ghost'} detail-dev-tab-btn" data-didx="${idx}" style="font-size:12px;">
                  ${escapeHtml(t)}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
      <div class="grid4">
        <div class="field"><label>فئة الجهاز</label><input id="eCat" value="${escapeHtml(r.device.category||'')}"></div>
        <div class="field"><label>الماركة</label><input id="eBrand" value="${escapeHtml(r.device.brand||'')}"></div>
        <div class="field"><label>الموديل</label><input id="eModel" value="${escapeHtml(r.device.model||'')}"></div>
        <div class="field"><label>كلمة السر (اختياري)</label><input id="ePassword" value="${escapeHtml((r.device && r.device.password) || r.password || '')}" placeholder="باسورد الجهاز إن وجد"></div>
      </div>
      <div class="field"><label>الأعطال</label>
        <div class="chip-group" id="editFaultChips">
          ${getCommonFaults().map(f=>`<div class="chip ${(r.faults||[]).includes(f)?'sel':''}" data-f="${f}">${f}</div>`).join('')}
        </div>
      </div>
      <div class="field"><label>ملاحظات التشخيص والفحص</label><textarea id="eFaultNotes">${r.faultNotes||''}</textarea></div>
      
      <div class="grid2">
        <div class="field"><label>الفني المسؤول</label>
          <select id="eTech"><option value="">--</option>${(Array.isArray(state.technicians)?state.technicians:[]).map(t=>`<option ${t===r.technician?'selected':''}>${t}</option>`).join('')}</select>
        </div>
        <div class="field"><label>حالة الجهاز</label>
          <select id="eStatus">${STATUSES.map(s=>`<option ${s.v===r.status?'selected':''}>${s.icon} ${s.v}</option>`).join('')}</select>
        </div>
    </div>

    <!-- كارت توثيق موافقة العميل وفترة الضمان -->
    <div class="card" style="background:var(--paper3);padding:12px;border-radius:var(--radius-sm);margin-top:10px;border:1px solid var(--line);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
        <div style="font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px;">
          <span>${r.customerApproval && r.customerApproval.approved ? '✅' : '⚠️'}</span>
          <span>توثيق موافقة العميل على الصيانة:</span>
          ${r.customerApproval && r.customerApproval.approved ?
            `<span class="badge" style="background:var(--green-bg);color:var(--green-text);font-weight:700;font-size:11px;">معتمد (${escapeHtml(r.customerApproval.channel || 'موثق')})</span>` :
            `<span class="badge" style="background:var(--amber-bg);color:var(--amber-text);font-weight:700;font-size:11px;">غير معتمد بعد</span>`
          }
        </div>
        <button type="button" class="btn btn-ghost btn-xs" id="detailCustomerApprovalBtn" style="border:1px solid var(--line);background:var(--surface);font-weight:700;">
          ${r.customerApproval && r.customerApproval.approved ? 'تعديل بيانات الموافقة' : 'تسجيل موافقة العميل الآن'}
        </button>
      </div>
      ${r.customerApproval && r.customerApproval.approved ? `
        <div style="font-size:11.5px;color:var(--ink-secondary);line-height:1.6;background:var(--surface);padding:6px 10px;border-radius:6px;border:1px dashed var(--line);margin-bottom:8px;">
          <b>المعتمد:</b> ${escapeHtml(r.customerApproval.approverName || '-')} | 
          <b>القناة:</b> ${escapeHtml(r.customerApproval.channel || '-')} | 
          <b>التكلفة المعتمدة:</b> <b class="mono" style="color:var(--green);">${Number(r.customerApproval.approvedCost||0).toLocaleString()} ج.م</b> | 
          <b>التاريخ:</b> ${cleanDate(r.customerApproval.approvedAt)}
          ${r.customerApproval.notes ? `<br><b>ملاحظات:</b> ${escapeHtml(r.customerApproval.notes)}` : ''}
        </div>
      ` : ''}

      <!-- حقول مدة الضمان وتاريخ الانتهاء -->
      <div class="grid2" style="margin-top:6px;gap:8px;">
        <div class="field" style="margin-bottom:0;">
          <label style="font-size:11.5px;font-weight:700;">مدة الضمان بعد الإصلاح:</label>
          <select id="eWarrantyMonths" style="font-weight:700;padding:5px 8px;font-size:12px;">
            <option value="0" ${Number(r.warrantyMonths)===0 ? 'selected' : ''}>بدون ضمان</option>
            <option value="1" ${Number(r.warrantyMonths)===1 ? 'selected' : ''}>شهر واحد (30 يوم)</option>
            <option value="3" ${Number(r.warrantyMonths)===3 || r.warrantyMonths == null ? 'selected' : ''}>3 شهور (الافتراضي)</option>
            <option value="6" ${Number(r.warrantyMonths)===6 ? 'selected' : ''}>6 شهور</option>
            <option value="12" ${Number(r.warrantyMonths)===12 ? 'selected' : ''}>سنة كاملة (12 شهر)</option>
          </select>
        </div>
        <div class="field" style="margin-bottom:0;">
          <label style="font-size:11.5px;font-weight:700;">تاريخ انتهاء الضمان المعتمد:</label>
          <input type="text" id="eWarrantyEnd" value="${escapeHtml(r.warrantyEnd || (typeof computeWarrantyEndDate === 'function' ? computeWarrantyEndDate(r.date, r.warrantyMonths || 3) : ''))}" placeholder="YYYY-MM-DD" style="font-family:monospace;font-size:12px;font-weight:700;">
        </div>
      </div>
    </div>

    <!-- توثيق صور وفيديوهات حالة الجهاز (الاستلام والتسليم) -->
    <div class="card" style="background:var(--paper3);padding:12px;border-radius:var(--radius-sm);margin-top:10px;border:1px solid var(--line);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px;">
        <div>
          <h4 style="margin:0;font-size:13.5px;display:flex;align-items:center;gap:6px;">
            <span>${getSvgIcon("camera", 16)}</span>
            <span>توثيق صور حالة الجهاز (الاستلام والتسليم)</span>
            <span class="badge" id="detailPhotosCountBadge" style="background:var(--primary-bg);color:var(--primary);font-size:11px;font-weight:800;">
              ${(r.photos || []).length} صور
            </span>
          </h4>
          <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">
            صور فحص الجهاز عند الاستلام (شاشة، خدوش، كسور) وصور ما بعد الصيانة عند التسليم
          </div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          <input type="file" id="detailCameraInput" accept="image/*" capture="environment" style="display:none;">
          <input type="file" id="detailGalleryInput" accept="image/*" multiple style="display:none;">
          
          <select id="detailPhotoStageSelect" style="padding:4px 8px;font-size:11px;font-weight:700;">
            <option value="intake">عند الاستلام</option>
            <option value="delivery">عند التسليم بعد الإصلاح</option>
          </select>

          <select id="detailPhotoAngleSelect" style="padding:4px 8px;font-size:11px;">
            <option value="الشاشة والواجهة">الشاشة والواجهة</option>
            <option value="ظهر وسيريال الجهاز">ظهر وسيريال الجهاز</option>
            <option value="خدوش وكسور سابقة">خدوش وكسور سابقة</option>
            <option value="الشاحن والملحقات">الشاحن والملحقات</option>
            <option value="تم الإصلاح والشاشة تعمل">تم الإصلاح والشاشة تعمل</option>
            <option value="عام">عام</option>
          </select>

          <button type="button" class="btn btn-primary btn-xs" id="detailAddPhotoCameraBtn">${getSvgIcon("camera", 14)} تصوير</button>
          <button type="button" class="btn btn-ghost btn-xs" id="detailAddPhotoGalleryBtn" style="border:1px solid var(--line);background:var(--surface);">${getSvgIcon("folder", 13)} رفع صورة</button>
        </div>
      </div>

      <!-- Stage Filter Tabs: All / Intake / Delivery -->
      <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;font-size:11.5px;border-top:1px dashed var(--line);padding-top:8px;">
        <span style="font-weight:700;color:var(--ink-secondary);">تصفية الصور:</span>
        <button type="button" class="btn btn-xs btn-blue photo-filter-tab" data-stage="all">الكل</button>
        <button type="button" class="btn btn-xs btn-ghost photo-filter-tab" data-stage="intake">عند الاستلام (فحص البداية)</button>
        <button type="button" class="btn btn-xs btn-ghost photo-filter-tab" data-stage="delivery">عند التسليم (بعد الإصلاح)</button>
      </div>

      <!-- Photo Thumbnails Grid -->
      <div id="detailPhotosGrid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(110px, 1fr));gap:8px;margin-top:6px;">
      </div>
    </div>

    <!-- بنود الصيانة المستحقة على الجهاز -->
    <div class="card" style="background:var(--paper3);padding:12px;border-radius:var(--radius-sm);margin-top:10px;border:1px solid var(--line);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div>
          <h4 style="margin:0;font-size:13.5px;display:flex;align-items:center;gap:6px;">
            <span>${getSvgIcon("tool", 16)}</span>
            <span>بنود الصيانة المستحقة في الجهاز</span>
          </h4>
          <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">حدد تفاصيل كل خدمة مع تكلفتها، وتجمع تلقائياً في تكلفة صيانة الجهاز</div>
        </div>
        <button type="button" class="btn btn-primary btn-xs" id="detailAddServiceItemBtn">+ إضافة بند صيانة</button>
      </div>
      <div id="detailServiceItemsList" style="display:flex;flex-direction:column;gap:6px;">
        <!-- dynamic items rendered here -->
      </div>
    </div>

    <!-- قطع الغيار ومستلزمات الصيانة المستهلكة من المخزن -->
    <div class="card" style="background:var(--paper3);padding:12px;border-radius:var(--radius-sm);margin-top:10px;border:1px solid var(--line);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
        <div>
          <h4 style="margin:0;font-size:13.5px;display:flex;align-items:center;gap:6px;">
            <span>${getSvgIcon("tool", 16)}</span>
            <span>قطع الغيار ومستلزمات الصيانة المستهلكة</span>
            <span class="badge" id="detailPartsCountBadge" style="background:var(--primary-bg);color:var(--primary);font-size:11px;font-weight:800;">
              ${(r.partsList||[]).length} قطع
            </span>
          </h4>
          <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">
            اختر القطعة من المخزن لخصمها آلياً، أو أضف قطعة خارجية يدوياً مع الضمان
          </div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          <button type="button" class="btn btn-primary btn-xs" id="detailAddInventoryPartBtn">${getSvgIcon("package", 14)} إضافة من المخزن</button>
          <button type="button" class="btn btn-ghost btn-xs" id="detailAddCustomPartBtn" style="border:1px solid var(--line);background:var(--paper2);">+ قطعة خارجية يدوية</button>
        </div>
      </div>
      <div id="detailSparePartsList" style="display:flex;flex-direction:column;gap:6px;">
        <!-- dynamic spare parts rendered here -->
      </div>
      <div id="detailPartsSummaryBox" style="margin-top:8px;padding:8px 12px;background:rgba(59,130,246,0.06);border-radius:8px;border:1px solid rgba(59,130,246,0.2);display:flex;justify-content:space-between;align-items:center;font-size:12px;flex-wrap:wrap;gap:6px;">
        <div>
          <span style="color:var(--ink-secondary);">إجمالي قطع الغيار:</span>
          <b class="mono" id="detailPartsSellTotalDisplay" style="color:var(--primary);font-size:13px;margin-right:4px;">${Number(r.partsCost||0).toLocaleString()} ج.م</b>
          <span style="font-size:10.5px;color:var(--ink-secondary);margin-right:8px;">(تكلفة المحل: <span class="mono" id="detailPartsCostTotalDisplay">${Number(r.partsBuyCost||0).toLocaleString()}</span> ج.م)</span>
        </div>
        <div id="detailPartsStockNotice" style="font-size:11px;color:var(--green);font-weight:700;">
          يتم خصم الكميات من رصيد المخزن تلقائياً
        </div>
      </div>
    </div>

    <!-- حساب آخر على العميل -->
    <div class="card" style="background:var(--paper3);padding:12px;border-radius:var(--radius-sm);margin-top:10px;border:1px solid var(--line);">
      <h4 style="margin:0 0 8px 0;font-size:13.5px;display:flex;align-items:center;gap:6px;">
        <span>${getSvgIcon("wallet", 16)}</span>
        <span>حساب آخر / رصيد إضافي على نفس العميل</span>
      </h4>
      <div class="grid2">
        <div class="field" style="margin-bottom:0;">
          <label>وصف الحساب الآخر (مثلاً: رصيد سابق، جهاز آخر، مستلزمات)</label>
          <input id="eOtherDesc" value="${escapeHtml(r.otherAccountDesc || '')}" placeholder="وصف الحساب الإضافي إن وجد...">
        </div>
        <div class="field" style="margin-bottom:0;">
          <label>المبلغ المستحق للحساب الآخر (ج.م)</label>
          <input id="eOtherAmount" type="number" min="0" step="any" value="${r.otherAccountAmount || 0}" placeholder="0">
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(115px, 1fr));gap:8px;margin-top:10px;">
      <div class="field"><label>أجور الصيانة (ج.م)</label><input id="eCost" type="number" value="${r.cost||0}"></div>
      <div class="field"><label>قطع الغيار (ج.م)</label><input id="ePartsCost" type="number" value="${r.partsCost||0}" disabled style="background:var(--paper3);font-weight:bold;color:var(--purple);"></div>
      <div class="field"><label>حساب إضافي (ج.م)</label><input id="eOtherDisplay" type="number" value="${r.otherAccountAmount||0}" disabled style="background:var(--paper3);"></div>
      <div class="field"><label>إجمالي المدفوع (ج.م)</label><input id="eDeposit" type="number" value="${r.deposit||0}" disabled style="background:var(--paper3);"></div>
      <div class="field"><label>مسترد سابقاً (ج.م)</label><input id="eRefundedDisplay" type="number" value="${r.refunded||0}" disabled style="background:var(--paper3);color:var(--red);font-weight:bold;"></div>
      <div class="field"><label>المتبقي المطلوب (ج.م)</label><input id="eRem" type="number" value="${remaining}" disabled style="background:var(--paper3);font-weight:bold;color:var(--primary);"></div>
    </div>

    <div class="card" style="background:var(--paper3);padding:12px;border-radius:var(--radius-sm);margin-top:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <h3 style="font-size:13.5px;margin:0;">سجل الدفعات والمردودات</h3>
        <button type="button" class="btn btn-red btn-xs" id="detailCardRefundBtn" style="font-weight:700;">
          ${getSvgIcon('arrowLeft', 13)} استرداد نقدي (مردودات)
        </button>
      </div>
      <div id="paymentsList" style="font-size:12px;margin-bottom:10px;">جارٍ التحميل...</div>
      <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;">
        <div class="field" style="flex:1;min-width:110px;margin-bottom:0;">
          <label>مبلغ دفعة جديدة</label>
          <input id="newPayAmt" type="number" placeholder="0" min="1" max="${remaining}">
          <div id="newPayAmtHint" style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">الحد الأقصى: <b class="mono">${remaining}</b> ج.م</div>
        </div>
        <div class="field" style="flex:1.3;min-width:150px;margin-bottom:0;">
          <label>طريقة الدفع</label>
          <select id="newPayMethod" style="font-weight:700;">
            ${getActivePaymentMethods().map(pm => `<option value="${escapeHtml(pm.name)}">${escapeHtml(pm.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field" style="flex:2;min-width:160px;margin-bottom:0;"><label>ملاحظة</label><input id="newPayNote" placeholder="دفعة تحت الحساب..."></div>
        <button class="btn btn-green btn-sm" id="addPayBtn" ${remaining<=0?'disabled':''}>تسجيل دفعة</button>
      </div>
    </div>

    ${renderDeviceHistoryCard(r)}

    <div class="actions-row" style="flex-wrap:wrap;margin-top:16px;">
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <button class="btn btn-whatsapp btn-xs" id="detailCostEstimateBtn" title="عرض ومقايسة التكلفة للعميل عبر واتساب (موافقة/رفض)">مقايسة التكلفة (واتساب)</button>
        <button class="btn btn-whatsapp btn-xs" id="detailWaNotifyBtn" title="إرسال إشعار واتساب للعميل">${WA_ICON} إشعار واتساب</button>
        <button class="btn btn-amber btn-xs" id="reIntakeDeviceDetailBtn" title="إعادة إدخال نفس الجهاز للصيانة بدورة جديدة">${getSvgIcon("refresh", 13)} إعادة صيانة الجهاز</button>
        <button class="btn btn-blue btn-xs" id="convertReceiptToInvoiceBtn" title="إصدار فاتورة ضريبية رسمية للعميل">${getSvgIcon("invoices", 13)} تحويل لفاتورة رسمية</button>
        <button class="btn btn-red btn-xs" id="detailRefundActionBtn" title="استرداد نقدي أو عربون للعميل">${getSvgIcon("arrowLeft", 13)} استرداد نقدي</button>
        ${!r.paid ? `<button class="btn btn-green btn-xs" id="payBtn">${getSvgIcon("check", 13)} سداد المتبقي</button>` : `<button class="btn btn-blue btn-xs" id="invBtn">${getSvgIcon("printer", 13)} طباعة إيصال نهائي</button>`}
        <div style="display:inline-flex;border-radius:6px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.05);align-items:stretch;">
          <button class="btn btn-amber btn-xs" id="detailStickerBtn" title="طباعة ملصق الصيانة فوراً (وضع الكيوسك)">${getSvgIcon("tag", 13)} ملصق باركود</button>
          <button class="btn btn-amber btn-xs" id="detailStickerOptsBtn" style="padding:2px 6px;border-right:1px solid rgba(255,255,255,0.35);" title="تعديل خيارات ومعاينة الملصق">${getSvgIcon("settings", 13)}</button>
        </div>
        <button class="btn btn-ghost btn-xs" id="workOrderBtn">أمر شغل</button>
      </div>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-ghost btn-sm" id="closeModalBtn">إلغاء</button>
        <button class="btn btn-primary btn-sm" id="saveEditBtn">${getSvgIcon("check", 14)} حفظ التعديلات</button>
      </div>
    </div>
  </div>`;

  document.body.appendChild(overlay);

  function renderPaymentsList(){
    const box = overlay.querySelector('#paymentsList');
    const payments = getReceiptPayments(r);
    const rRefunds = (Array.isArray(r.refunds) && r.refunds.length > 0) ? r.refunds : (Number(r.refunded || 0) > 0 ? [{
      amount: Number(r.refunded),
      method: r.refundMethod || 'نقدي (كاش)',
      reason: r.refundReason || 'مبالغ مستردة',
      date: cleanDate(r.refundDate || r.updatedAt || r.date),
      by: r.updatedBy || 'كاشير'
    }] : []);

    if(!payments.length && !rRefunds.length){
      box.innerHTML = '<span style="color:var(--ink-secondary);">لا توجد دفعات أو مردودات مسجلة لهذا الإيصال بعد.</span>';
      return;
    }

    const payHtml = payments.map(p=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--line);">
      <span>
        <b class="mono" style="font-size:11.5px;color:var(--ink-secondary);">${cleanDate(p.Date)}</b>
        ${getPaymentMethodBadge(p.PaymentMethod || 'نقدي (كاش)')}
        ${p.Note?'— '+escapeHtml(p.Note):''}
        <span style="color:var(--slate-400);font-size:11px;">(${escapeHtml(p.By||'نظام')})</span>
      </span>
      <span class="mono" style="font-weight:800;color:var(--green-text);">${Number(p.Amount||0).toLocaleString()} ج.م</span>
    </div>`).join('');

    const refHtml = rRefunds.map(ref=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 8px;border-bottom:1px solid #fecaca;background:#fff5f5;margin:3px 0;border-radius:4px;">
      <span>
        <b class="mono" style="font-size:11.5px;color:#991b1b;">${cleanDate(ref.date)}</b>
        <span class="badge" style="background:#fee2e2;color:#b91c1c;font-size:10px;font-weight:bold;margin:0 4px;">استرداد نقدي ↩️</span>
        ${getPaymentMethodBadge(ref.method || 'نقدي (كاش)')}
        ${ref.reason ? '— ' + escapeHtml(ref.reason) : ''}
        <span style="color:#7f1d1d;font-size:11px;">(${escapeHtml(ref.by || 'كاشير')})</span>
      </span>
      <span class="mono" style="font-weight:800;color:#dc2626;">-${Number(ref.amount || 0).toLocaleString()} ج.م</span>
    </div>`).join('');

    box.innerHTML = payHtml + refHtml;
  }
  renderPaymentsList();

  // Detail Service Items Handling
  let detailServiceItems = Array.isArray(r.serviceItems) && r.serviceItems.length ? JSON.parse(JSON.stringify(r.serviceItems)) : [];
  if(!detailServiceItems.length && Number(r.cost || 0) > 0){
    detailServiceItems.push({ desc: (Array.isArray(r.faults) && r.faults.length ? r.faults.join('، ') : 'أجور وخدمات صيانة'), price: Number(r.cost) });
  }

  function renderDetailServiceItems(){
    const list = overlay.querySelector('#detailServiceItemsList');
    if(!list) return;
    if(!detailServiceItems.length){
      list.innerHTML = `
        <div style="text-align:center;padding:10px;background:var(--paper2);border-radius:var(--radius-xs);color:var(--ink-secondary);font-size:12px;">
          لا توجد بنود صيانة منفصلة مسجلة. اضغط <b>+ إضافة بند صيانة</b> لتفصيل بنود الصيانة وأسعارها.
        </div>`;
      return;
    }
    list.innerHTML = detailServiceItems.map((item, idx) => `
      <div style="display:flex;gap:8px;align-items:center;background:var(--paper2);padding:6px 8px;border-radius:var(--radius-xs);border:1px solid var(--line);">
        <span style="font-size:11.5px;color:var(--ink-secondary);font-weight:bold;width:20px;text-align:center;">${idx + 1}</span>
        <input type="text" class="detail-svc-desc" data-idx="${idx}" value="${escapeHtml(item.desc || '')}" placeholder="وصف بند الصيانة (مثلاً: تغيير شاشة، تنظيف باور، صيانة بوردة...)" style="flex:3;padding:6px 9px;font-size:12.5px;">
        <div style="display:flex;align-items:center;gap:4px;flex:1.5;">
          <input type="number" min="0" step="any" class="detail-svc-price" data-idx="${idx}" value="${item.price != null ? item.price : ''}" placeholder="السعر" style="width:100%;padding:6px 9px;font-size:12.5px;font-weight:bold;">
          <span style="font-size:11px;color:var(--ink-secondary);">ج.م</span>
        </div>
        <button type="button" class="btn btn-ghost btn-xs detail-svc-del-btn" data-idx="${idx}" title="حذف هذا البند" style="color:var(--red);padding:4px 8px;">&times;</button>
      </div>
    `).join('');

    attachDetailServiceItemEvents();
  }

  function attachDetailServiceItemEvents(){
    overlay.querySelectorAll('.detail-svc-desc').forEach(inp => {
      inp.oninput = (e) => {
        const idx = Number(e.target.dataset.idx);
        if(detailServiceItems[idx]){
          detailServiceItems[idx].desc = e.target.value;
        }
      };
    });
    overlay.querySelectorAll('.detail-svc-price').forEach(inp => {
      inp.oninput = (e) => {
        const idx = Number(e.target.dataset.idx);
        if(detailServiceItems[idx]){
          detailServiceItems[idx].price = Number(e.target.value || 0);
          recalcDetailFinances();
        }
      };
    });
    overlay.querySelectorAll('.detail-svc-del-btn').forEach(btn => {
      btn.onclick = (e) => {
        const idx = Number(btn.dataset.idx);
        detailServiceItems.splice(idx, 1);
        renderDetailServiceItems();
        recalcDetailFinances();
      };
    });
  }

  // Detail Spare Parts State
  let detailSpareParts = (Array.isArray(r.partsList) && r.partsList.length)
    ? JSON.parse(JSON.stringify(r.partsList))
    : [];
  const initiallyDeductedParts = detailSpareParts.filter(p => p.isStockDeducted && p.itemId);

  function recalcDetailFinances(){
    const sumSvc = detailServiceItems.reduce((acc, cur) => acc + Number(cur.price || 0), 0);
    const costInput = overlay.querySelector('#eCost');
    if(detailServiceItems.length > 0 && costInput){
      costInput.value = sumSvc;
    }
    const costVal = Number(costInput ? costInput.value : 0) || 0;
    const otherVal = Number(overlay.querySelector('#eOtherAmount')?.value || 0);

    // Calculate spare parts (sell price to client and cost price to shop)
    const partsSellTotal = detailSpareParts.reduce((acc, cur) => acc + (Number(cur.sellPrice || 0) * Number(cur.qty || 1)), 0);
    const partsCostTotal = detailSpareParts.reduce((acc, cur) => acc + (Number(cur.costPrice || 0) * Number(cur.qty || 1)), 0);
    r.partsCost = partsSellTotal;
    r.partsBuyCost = partsCostTotal;

    const partsCostInp = overlay.querySelector('#ePartsCost');
    if(partsCostInp) partsCostInp.value = partsSellTotal;

    const partsSellDisp = overlay.querySelector('#detailPartsSellTotalDisplay');
    if(partsSellDisp) partsSellDisp.innerText = `${partsSellTotal.toLocaleString()} ج.م`;
    const partsCostDisp = overlay.querySelector('#detailPartsCostTotalDisplay');
    if(partsCostDisp) partsCostDisp.innerText = partsCostTotal.toLocaleString();

    const partsBadge = overlay.querySelector('#detailPartsCountBadge');
    if(partsBadge) partsBadge.innerText = `${detailSpareParts.length} قطع`;

    const depositVal = Number(r.deposit || 0);
    const refundedVal = Number(r.refunded || 0);

    const otherDisplay = overlay.querySelector('#eOtherDisplay');
    if(otherDisplay) otherDisplay.value = otherVal;

    const totalDue = costVal + partsSellTotal + otherVal;
    const currentRem = Math.max(0, totalDue - depositVal + refundedVal);

    const remInput = overlay.querySelector('#eRem');
    if(remInput) remInput.value = currentRem;

    const newPayAmt = overlay.querySelector('#newPayAmt');
    if(newPayAmt) newPayAmt.max = currentRem;
    const newPayHint = overlay.querySelector('#newPayAmtHint');
    if(newPayHint) newPayHint.innerHTML = `الحد الأقصى: <b class="mono">${currentRem}</b> ج.م`;
    const addPayBtn = overlay.querySelector('#addPayBtn');
    if(addPayBtn) addPayBtn.disabled = (currentRem <= 0);
  }

  function renderDetailSpareParts(){
    const list = overlay.querySelector('#detailSparePartsList');
    const summaryBox = overlay.querySelector('#detailPartsSummaryBox');
    if(!list) return;

    if(!detailSpareParts.length){
      list.innerHTML = `
        <div style="text-align:center;padding:12px;background:var(--paper2);border-radius:var(--radius-xs);color:var(--ink-secondary);font-size:12px;">
          لا توجد قطع غيار مسجلة لهذا الجهاز. اضغط <b>${getSvgIcon("package", 14)} إضافة من المخزن</b> لاختيار قطع من رصيد المحل، أو <b>+ قطعة خارجية يدوية</b>.
        </div>`;
      if(summaryBox) summaryBox.style.display = 'none';
      recalcDetailFinances();
      return;
    }

    if(summaryBox) summaryBox.style.display = 'flex';

    list.innerHTML = detailSpareParts.map((part, idx) => {
      const invItem = part.itemId ? (state.inventory || []).find(x => x.ID === part.itemId) : null;
      const currentStock = invItem ? Number(invItem.Quantity || 0) : null;
      const stockBadge = (currentStock !== null)
        ? `<span class="badge" style="background:${currentStock > 0 ? '#dcfce7' : '#fee2e2'};color:${currentStock > 0 ? '#166534' : '#991b1b'};font-size:10.5px;padding:2px 6px;">مخزن: ${currentStock}</span>`
        : `<span class="badge" style="background:#f1f5f9;color:#475569;font-size:10.5px;padding:2px 6px;">قطعة خارجية</span>`;

      const partTotal = (Number(part.qty || 1) * Number(part.sellPrice || 0));

      return `
        <div style="display:flex;gap:6px;align-items:center;background:var(--paper2);padding:7px 10px;border-radius:var(--radius-xs);border:1px solid var(--line);flex-wrap:wrap;">
          <span style="font-size:11px;color:var(--ink-secondary);font-weight:bold;width:18px;text-align:center;">${idx + 1}</span>
          <div style="flex:3;min-width:170px;display:flex;align-items:center;gap:6px;">
            <input type="text" class="detail-part-name" data-idx="${idx}" value="${escapeHtml(part.name || '')}" placeholder="اسم القطعة وموديلها..." style="flex:1;padding:5px 8px;font-size:12px;font-weight:700;">
            ${stockBadge}
          </div>
          <div style="display:flex;align-items:center;gap:3px;flex:1;min-width:70px;">
            <label style="font-size:10px;color:var(--ink-secondary);">كمية:</label>
            <input type="number" min="1" step="1" class="detail-part-qty" data-idx="${idx}" value="${part.qty || 1}" style="width:100%;padding:5px 4px;text-align:center;font-size:12px;font-weight:bold;">
          </div>
          <div style="display:flex;align-items:center;gap:3px;flex:1.2;min-width:90px;">
            <label style="font-size:10px;color:var(--ink-secondary);">بيع:</label>
            <input type="number" min="0" step="any" class="detail-part-price" data-idx="${idx}" value="${part.sellPrice != null ? part.sellPrice : ''}" placeholder="0" style="width:100%;padding:5px 4px;font-size:12px;font-weight:bold;color:var(--primary);">
            <span style="font-size:10px;color:var(--ink-secondary);">ج.م</span>
          </div>
          <div style="display:flex;align-items:center;gap:3px;flex:1.4;min-width:105px;">
            <label style="font-size:10px;color:var(--ink-secondary);">ضمان:</label>
            <select class="detail-part-warranty" data-idx="${idx}" style="width:100%;padding:4px 3px;font-size:11px;font-weight:700;">
              <option value="0" ${Number(part.warrantyDays) === 0 ? 'selected' : ''}>بدون ضمان</option>
              <option value="14" ${Number(part.warrantyDays) === 14 ? 'selected' : ''}>14 يوم تجربة</option>
              <option value="30" ${Number(part.warrantyDays) === 30 || !part.warrantyDays ? 'selected' : ''}>شهر (30 يوم) - الافتراضي</option>
              <option value="90" ${Number(part.warrantyDays) === 90 ? 'selected' : ''}>3 أشهر</option>
              <option value="180" ${Number(part.warrantyDays) === 180 ? 'selected' : ''}>6 أشهر</option>
              <option value="365" ${Number(part.warrantyDays) === 365 ? 'selected' : ''}>سنة كاملة</option>
            </select>
          </div>
          <div style="font-size:11.5px;font-weight:800;color:var(--green);min-width:65px;text-align:left;">
            ${partTotal.toLocaleString()} ج.م
          </div>
          <button type="button" class="btn btn-ghost btn-xs detail-part-del-btn" data-idx="${idx}" title="حذف هذه القطعة" style="color:var(--red);padding:4px 6px;">&times;</button>
        </div>
      `;
    }).join('');

    attachDetailSparePartEvents();
    recalcDetailFinances();
  }

  function attachDetailSparePartEvents(){
    overlay.querySelectorAll('.detail-part-name').forEach(inp => {
      inp.oninput = (e) => {
        const idx = Number(e.target.dataset.idx);
        if(detailSpareParts[idx]) detailSpareParts[idx].name = e.target.value;
      };
    });
    overlay.querySelectorAll('.detail-part-qty').forEach(inp => {
      inp.onchange = (e) => {
        const idx = Number(e.target.dataset.idx);
        if(detailSpareParts[idx]){
          detailSpareParts[idx].qty = Math.max(1, Number(e.target.value || 1));
          renderDetailSpareParts();
        }
      };
    });
    overlay.querySelectorAll('.detail-part-price').forEach(inp => {
      inp.oninput = (e) => {
        const idx = Number(e.target.dataset.idx);
        if(detailSpareParts[idx]){
          detailSpareParts[idx].sellPrice = Number(e.target.value || 0);
          recalcDetailFinances();
        }
      };
    });
    overlay.querySelectorAll('.detail-part-warranty').forEach(sel => {
      sel.onchange = (e) => {
        const idx = Number(e.target.dataset.idx);
        if(detailSpareParts[idx]) detailSpareParts[idx].warrantyDays = Number(e.target.value);
      };
    });
    overlay.querySelectorAll('.detail-part-del-btn').forEach(btn => {
      btn.onclick = (e) => {
        const idx = Number(btn.dataset.idx);
        const removed = detailSpareParts.splice(idx, 1)[0];
        if(removed && removed.isStockDeducted && removed.itemId){
          try {
            adjustInventoryQtyRemote(removed.itemId, Number(removed.qty || 1));
            showToast(`تمت إعادة ${removed.qty} من (${removed.name}) إلى رصيد المخزن`, 'info');
          } catch(err){}
        }
        renderDetailSpareParts();
      };
    });
  }

  renderDetailServiceItems();
  renderDetailSpareParts();

  const addSvcBtn = overlay.querySelector('#detailAddServiceItemBtn');
  if(addSvcBtn){
    addSvcBtn.onclick = () => {
      detailServiceItems.push({ desc: '', price: 0 });
      renderDetailServiceItems();
      const lastDesc = overlay.querySelector(`.detail-svc-desc[data-idx="${detailServiceItems.length - 1}"]`);
      if(lastDesc) lastDesc.focus();
    };
  }

  const addInvPartBtn = overlay.querySelector('#detailAddInventoryPartBtn');
  if(addInvPartBtn){
    addInvPartBtn.onclick = () => {
      openInventoryPartPickerModal((item) => {
        const existing = detailSpareParts.find(p => p.itemId === item.ID);
        if(existing){
          existing.qty = Number(existing.qty || 1) + 1;
          showToast(`تم زيادة كمية (${item.Name}) إلى ${existing.qty} `, 'info');
        } else {
          detailSpareParts.push({
            id: 'part_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            itemId: item.ID,
            barcode: item.Barcode || '',
            name: item.Name,
            qty: 1,
            costPrice: Number(item.PurchasePrice || 0),
            sellPrice: Number(item.SellPrice || item.PurchasePrice || 0),
            warrantyDays: 30,
            isStockDeducted: false
          });
          showToast(`تمت إضافة (${item.Name}) بنجاح`, 'success');
        }
        renderDetailSpareParts();
      });
    };
  }

  const addCustomPartBtn = overlay.querySelector('#detailAddCustomPartBtn');
  if(addCustomPartBtn){
    addCustomPartBtn.onclick = () => {
      detailSpareParts.push({
        id: 'part_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        itemId: '',
        barcode: '',
        name: '',
        qty: 1,
        costPrice: 0,
        sellPrice: 0,
        warrantyDays: 30,
        isStockDeducted: false
      });
      renderDetailSpareParts();
      const lastPartName = overlay.querySelector(`.detail-part-name[data-idx="${detailSpareParts.length - 1}"]`);
      if(lastPartName) lastPartName.focus();
    };
  }

  const eCostInp = overlay.querySelector('#eCost');
  if(eCostInp) eCostInp.oninput = recalcDetailFinances;
  const eOtherInp = overlay.querySelector('#eOtherAmount');
  if(eOtherInp) eOtherInp.oninput = recalcDetailFinances;

  const custApprBtn = overlay.querySelector('#detailCustomerApprovalBtn');
  if(custApprBtn){
    custApprBtn.onclick = ()=>{
      openCustomerApprovalModal(r, (newAppr)=>{
        showToast('تم تسجيل وتحديث موافقة العميل بنجاح', 'success');
        overlay.remove();
        openReceiptDetail(r);
      });
    };
  }

  const wMonthsInp = overlay.querySelector('#eWarrantyMonths');
  const wEndInp = overlay.querySelector('#eWarrantyEnd');
  if(wMonthsInp && wEndInp){
    wMonthsInp.onchange = ()=>{
      const m = Number(wMonthsInp.value || 0);
      if(m <= 0){
        wEndInp.value = '';
      } else {
        wEndInp.value = typeof computeWarrantyEndDate === 'function' ? computeWarrantyEndDate(r.date, m) : '';
      }
    };
  }

  // Detail Photos (Intake & Delivery) State & Handlers
  let detailPhotos = Array.isArray(r.photos) && r.photos.length 
    ? JSON.parse(JSON.stringify(r.photos)) 
    : (Array.isArray(r.devices) ? r.devices.flatMap(x => x.photos || []) : []);
  let currentPhotoFilterStage = 'all';

  function renderDetailPhotosGallery(){
    const grid = overlay.querySelector('#detailPhotosGrid');
    const badge = overlay.querySelector('#detailPhotosCountBadge');
    if(badge) badge.innerText = `${detailPhotos.length} صور`;
    if(!grid) return;

    let filtered = detailPhotos;
    if(currentPhotoFilterStage === 'intake'){
      filtered = detailPhotos.filter(p => p.stage !== 'delivery');
    } else if(currentPhotoFilterStage === 'delivery'){
      filtered = detailPhotos.filter(p => p.stage === 'delivery');
    }

    renderDevicePhotosThumbnails(filtered, grid, {
      canDelete: true,
      onChanged: () => {
        const remainingIds = new Set(filtered.map(p => p.id || p.url));
        detailPhotos = detailPhotos.filter(p => {
          const inThisStage = (currentPhotoFilterStage === 'all') ||
            (currentPhotoFilterStage === 'intake' && p.stage !== 'delivery') ||
            (currentPhotoFilterStage === 'delivery' && p.stage === 'delivery');
          if(inThisStage){
            return remainingIds.has(p.id || p.url);
          }
          return true;
        });
        if(badge) badge.innerText = `${detailPhotos.length} صور`;
      }
    });
  }

  overlay.querySelectorAll('.photo-filter-tab').forEach(tab => {
    tab.onclick = () => {
      currentPhotoFilterStage = tab.dataset.stage;
      overlay.querySelectorAll('.photo-filter-tab').forEach(t => {
        if(t.dataset.stage === currentPhotoFilterStage){
          t.className = 'btn btn-xs btn-blue photo-filter-tab';
        } else {
          t.className = 'btn btn-xs btn-ghost photo-filter-tab';
        }
      });
      renderDetailPhotosGallery();
    };
  });

  const detCamInp = overlay.querySelector('#detailCameraInput');
  const detGalInp = overlay.querySelector('#detailGalleryInput');
  const detCamBtn = overlay.querySelector('#detailAddPhotoCameraBtn');
  const detGalBtn = overlay.querySelector('#detailAddPhotoGalleryBtn');

  async function handleDetailFilesSelected(files){
    if(!files || !files.length) return;
    if(detailPhotos.length >= 6){
      showToast('⚠️ الحد الأقصى للصور هو 6 صور للجهاز الواحد', 'warning');
      return;
    }
    const stage = overlay.querySelector('#detailPhotoStageSelect')?.value || 'intake';
    const angle = overlay.querySelector('#detailPhotoAngleSelect')?.value || 'عام';
    const badge = overlay.querySelector('#detailPhotosCountBadge');
    if(badge) badge.innerText = 'جارٍ الضغط والرفع...';
    try {
      let added = 0;
      for(let i = 0; i < files.length; i++){
        if(detailPhotos.length >= 6){
          showToast('تم الوصول للحد الأقصى (6 صور) وتجاوز الصور الإضافية', 'info');
          break;
        }
        const file = files[i];
        if(!file.type.startsWith('image/')) continue;
        const compressedUrl = await compressImageFile(file, 900, 900, 0.72);
        const photoId = 'p_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

        // Save to durable local IndexedDB
        savePhotoToIndexedDB(photoId, compressedUrl);

        let finalUrl = compressedUrl;
        let driveInfo = null;
        if(navigator.onLine){
          driveInfo = await uploadPhotoToServer(compressedUrl, r.receiptNumber || 'rec', file.name || 'photo.jpg');
          if(driveInfo && driveInfo.url){
            finalUrl = driveInfo.url;
          }
        }

        detailPhotos.push({
          id: photoId,
          url: finalUrl,
          thumb: compressedUrl,
          fileId: driveInfo ? driveInfo.fileId : null,
          angle: angle,
          stage: stage,
          timestamp: new Date().toISOString()
        });
        added++;
      }
      if(added > 0){
        showToast(`تمت إضافة ${added} صور موثقة للجهاز بنجاح`, 'success');
      }
      renderDetailPhotosGallery();
    } catch(err){
      showToast('خطأ أثناء معالجة الصور: ' + err.message, 'error');
      renderDetailPhotosGallery();
    }
  }

  if(detCamBtn && detCamInp){
    detCamBtn.onclick = () => detCamInp.click();
    detCamInp.onchange = (e) => handleDetailFilesSelected(e.target.files);
  }
  if(detGalBtn && detGalInp){
    detGalBtn.onclick = () => detGalInp.click();
    detGalInp.onchange = (e) => handleDetailFilesSelected(e.target.files);
  }

  renderDetailPhotosGallery();

  let currentEditDevIdx = 0;
  const hasMultipleDevices = Array.isArray(r.devices) && r.devices.length > 1;

  function syncCurrentDevToDom(idx){
    const dev = (hasMultipleDevices && r.devices[idx]) ? r.devices[idx] : r.device;
    if(!dev) return;
    const catInp = overlay.querySelector('#eCat');
    if(catInp) catInp.value = dev.category || '';
    const brandInp = overlay.querySelector('#eBrand');
    if(brandInp) brandInp.value = (dev.brand === 'أخرى' ? dev.brandOther : dev.brand) || '';
    const modelInp = overlay.querySelector('#eModel');
    if(modelInp) modelInp.value = dev.model || '';
    const passInp = overlay.querySelector('#ePassword');
    if(passInp) passInp.value = dev.password || '';
    const notesInp = overlay.querySelector('#eFaultNotes');
    if(notesInp) notesInp.value = (hasMultipleDevices ? dev.faultNotes : r.faultNotes) || '';

    // Update chips
    const devFaults = hasMultipleDevices ? (dev.faults || []) : (r.faults || []);
    overlay.querySelectorAll('#editFaultChips .chip').forEach(c => {
      const f = c.dataset.f;
      if(devFaults.includes(f)) c.classList.add('sel');
      else c.classList.remove('sel');
    });

    // Update active tab styling
    overlay.querySelectorAll('.detail-dev-tab-btn').forEach(btn => {
      const bIdx = Number(btn.dataset.didx);
      if(bIdx === idx){
        btn.className = 'btn btn-xs btn-primary detail-dev-tab-btn';
      } else {
        btn.className = 'btn btn-xs btn-ghost detail-dev-tab-btn';
      }
    });
  }

  function saveDomToCurrentDev(idx){
    if(!hasMultipleDevices) return;
    const dev = r.devices[idx];
    if(!dev) return;
    dev.category = (overlay.querySelector('#eCat')?.value || '').trim();
    dev.brand = (overlay.querySelector('#eBrand')?.value || '').trim();
    dev.model = (overlay.querySelector('#eModel')?.value || '').trim();
    dev.password = (overlay.querySelector('#ePassword')?.value || '').trim();
    dev.faultNotes = (overlay.querySelector('#eFaultNotes')?.value || '').trim();
  }

  if(hasMultipleDevices){
    overlay.querySelectorAll('.detail-dev-tab-btn').forEach(btn => {
      btn.onclick = () => {
        saveDomToCurrentDev(currentEditDevIdx);
        currentEditDevIdx = Number(btn.dataset.didx);
        syncCurrentDevToDom(currentEditDevIdx);
      };
    });
  }

  overlay.querySelectorAll('#editFaultChips .chip').forEach(c=>{
    c.onclick = ()=>{
      const f = c.dataset.f;
      if(hasMultipleDevices && r.devices[currentEditDevIdx]){
        const dev = r.devices[currentEditDevIdx];
        if(!Array.isArray(dev.faults)) dev.faults = [];
        const idx = dev.faults.indexOf(f);
        if(idx > -1) dev.faults.splice(idx, 1);
        else dev.faults.push(f);
      } else {
        if(!Array.isArray(r.faults)) r.faults = [];
        const idx = r.faults.indexOf(f);
        if(idx > -1) r.faults.splice(idx, 1);
        else r.faults.push(f);
      }
      c.classList.toggle('sel');
    };
  });

  const closeDetBtn = overlay.querySelector('#closeDetailBtn');
  if(closeDetBtn) closeDetBtn.onclick = ()=>overlay.remove();
  const closeModBtn = overlay.querySelector('#closeModalBtn');
  if(closeModBtn) closeModBtn.onclick = ()=>overlay.remove();

  const detailAiDiagBtn = overlay.querySelector('#detailAiDiagBtn');
  if(detailAiDiagBtn) detailAiDiagBtn.onclick = () => openAiDiagnosisModal(r);

  function collectEdits(){
    const selectedTitle = (overlay.querySelector('#eTitle')?.value || '').trim();
    const rawNameVal = overlay.querySelector('#eName').value.trim();
    const parsedName = parseCustomerTitleAndName(rawNameVal);
    r.customer.title = selectedTitle || parsedName.title || '';
    r.customer.name = (parsedName.title && !selectedTitle) ? parsedName.name : (parsedName.name || rawNameVal);
    r.CustomerTitle = r.customer.title;
    r.CustomerName = r.customer.name;
    r.customer.phone = overlay.querySelector('#ePhone').value.trim();
    r.CustomerPhone = r.customer.phone;

    if(hasMultipleDevices){
      saveDomToCurrentDev(currentEditDevIdx);
      r.device = {
        category: r.devices[0].category,
        brand: r.devices[0].brand,
        brandOther: r.devices[0].brandOther || '',
        model: r.devices[0].model,
        accessories: r.devices[0].accessories || '',
        password: r.devices[0].password || ''
      };
      r.password = r.device.password;
      r.faults = Array.from(new Set(r.devices.flatMap(x => x.faults || [])));
      r.faultNotes = r.devices[0].faultNotes || '';
    } else {
      r.device.category = overlay.querySelector('#eCat').value.trim();
      r.device.brand = overlay.querySelector('#eBrand').value.trim();
      r.device.model = overlay.querySelector('#eModel').value.trim();
      r.device.password = (overlay.querySelector('#ePassword')?.value || '').trim();
      r.password = r.device.password;
      r.faultNotes = overlay.querySelector('#eFaultNotes').value.trim();
    }

    r.technician = overlay.querySelector('#eTech').value;
    r.status = overlay.querySelector('#eStatus').value.replace(/^[^\s]+\s/, '');
    r.photos = detailPhotos;
    if(Array.isArray(r.devices) && r.devices.length > 0){
      if(r.devices[currentEditDevIdx]){
        r.devices[currentEditDevIdx].photos = detailPhotos;
      } else {
        r.devices[0].photos = detailPhotos;
      }
    }
    r.serviceItems = detailServiceItems.filter(it => (it.desc && it.desc.trim()) || Number(it.price) > 0);
    r.partsList = detailSpareParts;
    r.partsCost = detailSpareParts.reduce((sum, p) => sum + (Number(p.sellPrice || 0) * Number(p.qty || 1)), 0);
    r.partsBuyCost = detailSpareParts.reduce((sum, p) => sum + (Number(p.costPrice || 0) * Number(p.qty || 1)), 0);
    r.partsUsed = detailSpareParts.map(p => `${p.name} (x${p.qty||1})`).join('، ');
    r.otherAccountDesc = (overlay.querySelector('#eOtherDesc')?.value || '').trim();
    r.otherAccountAmount = Number(overlay.querySelector('#eOtherAmount')?.value || 0);
    r.cost = Number(overlay.querySelector('#eCost').value || 0);
    const wMonthsVal = Number(overlay.querySelector('#eWarrantyMonths')?.value != null ? overlay.querySelector('#eWarrantyMonths').value : 3);
    r.warrantyMonths = wMonthsVal;
    r.warrantyEnd = overlay.querySelector('#eWarrantyEnd')?.value || '';
    if(wMonthsVal > 0){
      r.warranty = `${wMonthsVal} شهور`;
    } else {
      r.warranty = 'بدون ضمان';
    }
    r.updatedBy = state.user.name;
    r.updatedAt = new Date().toISOString();
  }

  overlay.querySelector('#saveEditBtn').onclick = async ()=>{
    collectEdits();

    // التحقق: منع التحويل إلى الصيانة بدون توثيق موافقة العميل
    if(r.status === 'الصيانة' && (!r.customerApproval || !r.customerApproval.approved)){
      openCustomerApprovalModal(r, async (appr)=>{
        recordAuditLog('اعتماد موافقة العميل', 'صيانة', `تم تسجيل موافقة العميل (${appr.approverName}) عبر [${appr.channel}] بتكلفة ${appr.approvedCost} ج.م للإيصال #${r.receiptNumber}`, r.id);
        showToast('تم تسجيل موافقة العميل بنجاح، جاري استكمال الحفظ...', 'info');
        overlay.querySelector('#saveEditBtn').click();
      }, ()=>{
        showToast('لا يمكن تحويل الجهاز إلى "الصيانة" دون توثيق موافقة العميل المعتمدة', 'warning');
      });
      return;
    }

    // Deduct un-deducted inventory parts
    for(const p of detailSpareParts){
      if(p.itemId && !p.isStockDeducted){
        try {
          await adjustInventoryQtyRemote(p.itemId, -Number(p.qty || 1));
          p.isStockDeducted = true;
        } catch(e){
          console.warn('Error deducting stock for part:', p.name, e);
        }
      }
    }
    // Restock any removed initially deducted parts
    for(const initP of initiallyDeductedParts){
      const stillPresent = detailSpareParts.some(p => p.id === initP.id || (p.itemId === initP.itemId && p.isStockDeducted));
      if(!stillPresent){
        try {
          await adjustInventoryQtyRemote(initP.itemId, Number(initP.qty || 1));
        } catch(e){}
      }
    }

    const totalDue = (typeof getReceiptTotalDue === 'function') ? getReceiptTotalDue(r) : (Number(r.cost||0) + Number(r.partsCost||0) + Number(r.otherAccountAmount||0));
    const totalPaid = Number(r.deposit||0);

    // التحقق: لا يجوز تقليل التكلفة لتصبح أقل من المبلغ المدفوع مسبقاً دون تسوية استرداد
    if(totalDue > 0 && totalPaid > totalDue){
      showToast(`عفواً: إجمالي التكلفة والحساب المطلوب (${totalDue.toLocaleString()} ج.م) أقل من إجمالي المبلغ المسدد مسبقاً (${totalPaid.toLocaleString()} ج.م). يرجى إثبات استرداد أولاً.`, 'error');
      const costInp = overlay.querySelector('#eCost');
      if(costInp) costInp.focus();
      return;
    }

    const remainingNow = (typeof getReceiptRemaining === 'function') ? getReceiptRemaining(r) : Math.max(0, totalDue - totalPaid + Number(r.refunded||0));
    const statusChanged = (initialStatus !== r.status);

    if(r.status === 'تم التسليم' && remainingNow > 0){
      const btn = overlay.querySelector('#saveEditBtn');
      if(btn){ btn.disabled = true; btn.textContent = 'جارٍ الحفظ...'; }
      promptDeliveryRemainingPayment(r, remainingNow, async (shouldPay, payMethodName)=>{
        const totalCostDue = (typeof getReceiptTotalDue === 'function') ? getReceiptTotalDue(r) : (Number(r.cost||0) + Number(r.partsCost||0) + Number(r.otherAccountAmount||0));
        const depositBefore = Math.min(totalCostDue, Number(r.deposit || 0));
        const remainingDebt = Math.max(0, totalCostDue - depositBefore);

        // Post single full revenue recognition entry (F2: Cr 4101 full cost, Dr 2102 deposit, Dr 1103 remaining debt)
        await postReceiptDeliveryRevenue(r, depositBefore, remainingDebt);

        if(shouldPay){
          try{
            await savePaymentRemote(r.id, remainingNow, 'سداد المتبقي عند التسليم', payMethodName || 'نقدي (كاش)');
            r.deposit = Number(r.deposit||0) + remainingNow;
            r.paid = true;
            await refreshPayments();
          }catch(e){}
        } else {
          // التسليم بالآجل: تسجيل المتبقي كمديونية على العميل
          try {
            const custName = r.customer ? r.customer.name : '';
            const custPhone = r.customer ? r.customer.phone : '';
            const cust = (state.customers || []).find(c => (custName && (c.name||'').trim().toLowerCase() === custName.trim().toLowerCase()) || (custPhone && c.phone === custPhone));
            if(cust){
              cust.Debt = Number(cust.Debt || cust.debt || 0) + remainingNow;
              await saveCustomerRemote(cust);
            }
          } catch(errDebt) {
            console.warn('Auto debt recording error:', errDebt);
          }
        }
        try{
          await saveReceiptRemote(r);
          overlay.remove();
          showToast(shouldPay ? `تم سداد ${remainingNow.toLocaleString()} ج.م وتسليم الجهاز بنجاح` : 'تم تسليم الجهاز بنجاح (المتبقي آجل)', 'success');
          renderMain();
          if(initialStatus !== 'تم التسليم'){
            setTimeout(()=>{
              openWhatsappStatusNotificationModal(r, 'تم التسليم');
            }, 350);
          }
        }catch(err){
          showToast('تم الحفظ محلياً: '+err.message, 'info');
          if(btn){ btn.disabled = false; btn.textContent = 'حفظ التعديلات'; }
        }
      });
      return;
    }

    const btn = overlay.querySelector('#saveEditBtn');
    btn.disabled = true; btn.textContent = 'جارٍ الحفظ...';
    try{
      await saveReceiptRemote(r);
      overlay.remove();
      showToast('تم حفظ التعديلات بنجاح', 'success');
      renderMain();
      if(statusChanged){
        setTimeout(()=>{
          openWhatsappStatusNotificationModal(r, r.status);
        }, 350);
      }
    }catch(err){
      showToast('تم الحفظ محلياً: '+err.message, 'info');
      btn.disabled = false;
      btn.textContent = 'حفظ التعديلات';
    }
  };

  let isAddPaySubmitting = false;
  overlay.querySelector('#addPayBtn').onclick = async ()=>{
    if(isAddPaySubmitting) return;
    const addPayBtn = overlay.querySelector('#addPayBtn');
    const amt = Number(overlay.querySelector('#newPayAmt').value);
    const note = overlay.querySelector('#newPayNote').value.trim();
    const payMethodInp = overlay.querySelector('#newPayMethod');
    const chosenMethod = payMethodInp ? payMethodInp.value : 'نقدي (كاش)';
    if(!amt || amt<=0){ showToast('أدخل مبلغاً صحيحاً', 'error'); return; }

    const totalDue = (typeof getReceiptTotalDue === 'function') ? getReceiptTotalDue(r) : (Number(r.cost||0) + Number(r.partsCost||0) + Number(r.otherAccountAmount||0));
    const remainingBefore = (typeof getReceiptRemaining === 'function') ? getReceiptRemaining(r) : Math.max(0, totalDue - Number(r.deposit||0) + Number(r.refunded||0));

    // منع دفع مبلغ أكبر من حساب الجهاز المتبقي نهائياً
    if(amt > remainingBefore){
      showToast(`عفواً: لا يمكن دفع مبلغ (${amt.toLocaleString()} ج.م) أكبر من الحساب المتبقي (${remainingBefore.toLocaleString()} ج.م)`, 'error');
      const payInp = overlay.querySelector('#newPayAmt');
      if(payInp){
        payInp.value = remainingBefore;
        payInp.focus();
      }
      return;
    }

    isAddPaySubmitting = true;
    if(addPayBtn){ addPayBtn.disabled = true; addPayBtn.textContent = 'جارٍ التسجيل...'; }

    // إذا كانت الدفعة تغطي المبلغ المتبقي بالكامل والحالة لم تسلم بعد
    if(amt >= remainingBefore && r.status !== 'تم التسليم'){
      promptPaymentDeliveryStatus(r, amt, async (shouldDeliver, payMethodName)=>{
        try{
          const methodToUse = payMethodName || chosenMethod;
          await savePaymentRemote(r.id, amt, note || (shouldDeliver ? 'سداد المتبقي عند التسليم' : 'سداد الدفعة المتبقية'), methodToUse);
          r.deposit = Number(r.deposit||0) + amt;
          if(r.deposit >= totalDue) r.paid = true;
          if(shouldDeliver){
            r.status = 'تم التسليم';
          }
          r.updatedBy = state.user ? state.user.name : 'نظام';
          r.updatedAt = new Date().toISOString();

          await saveReceiptRemote(r);
          await refreshPayments();
          overlay.remove();
          showToast(shouldDeliver ? 'تم سداد كامل المبلغ وتحديث الحالة إلى تم التسليم' : 'تم سداد كامل المبلغ وتحديث الحسابات بنجاح', 'success');
          renderMain();
        }catch(e){ 
          showToast('تم الحفظ محلياً: '+e.message, 'info'); 
          isAddPaySubmitting = false;
          if(addPayBtn){ addPayBtn.disabled = false; addPayBtn.textContent = 'تسجيل دفعة'; }
        }
      });
      return;
    }

    try{
      await savePaymentRemote(r.id, amt, note, chosenMethod);
      r.deposit = Number(r.deposit||0) + amt;
      if(r.deposit >= totalDue) r.paid = true;
      const newRem = (typeof getReceiptRemaining === 'function') ? getReceiptRemaining(r) : Math.max(0, totalDue - Number(r.deposit||0) + Number(r.refunded||0));
      const remInp = overlay.querySelector('#eRem');
      if(remInp) remInp.value = newRem;
      const depInp = overlay.querySelector('#eDeposit');
      if(depInp) depInp.value = r.deposit;
      overlay.querySelector('#newPayAmt').value = '';
      overlay.querySelector('#newPayNote').value = '';
      await saveReceiptRemote(r);
      renderPaymentsList();
      await refreshPayments();
      showToast('تم تسجيل الدفعة بنجاح', 'success');
      renderMain();
    }catch(e){ 
      showToast('تم تسجيل الدفعة محلياً', 'info'); 
    }finally{
      isAddPaySubmitting = false;
      if(addPayBtn){ addPayBtn.disabled = false; addPayBtn.textContent = 'تسجيل دفعة'; }
    }
  };

  let isPayBtnSubmitting = false;
  const payBtn = overlay.querySelector('#payBtn');
  if(payBtn) payBtn.onclick = async ()=>{
    if(isPayBtnSubmitting) return;
    const totalDue = (typeof getReceiptTotalDue === 'function') ? getReceiptTotalDue(r) : (Number(r.cost||0) + Number(r.partsCost||0) + Number(r.otherAccountAmount||0));
    const remainingNow = (typeof getReceiptRemaining === 'function') ? getReceiptRemaining(r) : Math.max(0, totalDue - Number(r.deposit||0) + Number(r.refunded||0));
    if(remainingNow <= 0){
      showToast('الإيصال مسدد بالكامل بالفعل', 'info');
      return;
    }

    isPayBtnSubmitting = true;
    payBtn.disabled = true;
    payBtn.textContent = 'جارٍ السداد...';

    promptPaymentDeliveryStatus(r, remainingNow, async (shouldDeliver, payMethodName)=>{
      try{
        await savePaymentRemote(r.id, remainingNow, shouldDeliver ? 'سداد المتبقي عند التسليم' : 'سداد المتبقي بالكامل', payMethodName || 'نقدي (كاش)');
        r.deposit = Number(r.deposit||0) + remainingNow;
        r.paid = true;
        if(shouldDeliver){
          r.status = 'تم التسليم';
        } else if(r.status === 'قيد الفحص' || r.status === 'الصيانة'){
          r.status = 'مكتمل';
        }
        r.updatedBy = state.user ? state.user.name : 'نظام';
        r.updatedAt = new Date().toISOString();

        await saveReceiptRemote(r);
        await refreshPayments();
        overlay.remove();
        showToast(shouldDeliver ? 'تم سداد المتبقي بالكامل وتحديث الحالة إلى "تم التسليم"' : 'تم سداد المتبقي بنجاح وتحديث الحسابات', 'success');
        renderMain();
      }catch(e){
        showToast('تم السداد محلياً: '+e.message, 'info');
        payBtn.disabled = false;
        payBtn.textContent = 'سداد المتبقي';
        isPayBtnSubmitting = false;
      }
    });
  };

  const convInvBtn = overlay.querySelector('#convertReceiptToInvoiceBtn');
  if(convInvBtn) convInvBtn.onclick = ()=>{ overlay.remove(); convertReceiptToInvoice(r.id); };

  const invBtn = overlay.querySelector('#invBtn');
  if(invBtn) invBtn.onclick = ()=>{ overlay.remove(); openReceiptPrint(r,'invoice'); };
  
  const woBtn = overlay.querySelector('#workOrderBtn');
  if(woBtn) woBtn.onclick = ()=>{ overlay.remove(); openReceiptPrint(r,'workorder'); };

  const cardRefundBtn = overlay.querySelector('#detailCardRefundBtn');
  if(cardRefundBtn) cardRefundBtn.onclick = ()=>{ overlay.remove(); if(typeof openReceiptRefundModal==='function') openReceiptRefundModal(r.id || r.receiptNumber, r.receiptNumber); };

  const actRefundBtn = overlay.querySelector('#detailRefundActionBtn');
  if(actRefundBtn) actRefundBtn.onclick = ()=>{ overlay.remove(); if(typeof openReceiptRefundModal==='function') openReceiptRefundModal(r.id || r.receiptNumber, r.receiptNumber); };

  const costEstBtn = overlay.querySelector('#detailCostEstimateBtn');
  if(costEstBtn) costEstBtn.onclick = ()=>{ overlay.remove(); openCostEstimateModal(r); };

  const detWaNotifyBtn = overlay.querySelector('#detailWaNotifyBtn');
  if(detWaNotifyBtn) detWaNotifyBtn.onclick = ()=>{ overlay.remove(); openWhatsappChoice(r); };

  const detStickerBtn = overlay.querySelector('#detailStickerBtn');
  if(detStickerBtn) detStickerBtn.onclick = ()=>{ overlay.remove(); openStickerPrint(r); };

  const detStickerOptsBtn = overlay.querySelector('#detailStickerOptsBtn');
  if(detStickerOptsBtn) detStickerOptsBtn.onclick = ()=>{ overlay.remove(); openStickerPrint(r, true); };

  const reIntakeBtn = overlay.querySelector('#reIntakeDeviceDetailBtn');
  if(reIntakeBtn) reIntakeBtn.onclick = ()=>{ overlay.remove(); openReIntakeDeviceModal(r); };

  const histReIntakeBtn = overlay.querySelector('#historyReIntakeBtn');
  if(histReIntakeBtn) histReIntakeBtn.onclick = ()=>{ overlay.remove(); openReIntakeDeviceModal(r); };

  overlay.querySelectorAll('.view-hist-receipt-btn').forEach(b => {
    b.onclick = ()=>{
      const targetId = b.dataset.histid;
      const targetNum = b.dataset.histnum;
      const target = findReceiptByIdOrNum(targetId || targetNum);
      if(target){
        overlay.remove();
        openReceiptDetail(target);
      } else {
        showToast('لم يتم العثور على الإيصال المطلوب', 'error');
      }
    };
  });
  } catch(err){
    console.error('openReceiptDetail error:', err);
    showToast('حدث خطأ أثناء فتح الإيصال: ' + (err.message || err), 'error');
  }
}
