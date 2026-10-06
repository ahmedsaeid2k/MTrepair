function renderPosSettings(main){
  const posSettings = getPosSettings();
  const payMethods = posSettings.paymentMethods || [];
  const quickServices = posSettings.quickServices || [];

  main.innerHTML = `
    ${renderSettingsNavHeader('إعدادات نقطة البيع وخيارات الدفع', 'تخصيص طرق الدفع، خدمات البيع السريعة، إعدادات طابعة الإيصالات، والسياسات المالية')}

    <!-- 1. Payment Methods Management -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <div>
          <h3 style="margin:0;font-size:15px;">طرق وخيارات الدفع المتاحة</h3>
                  </div>
        <button class="btn btn-primary btn-xs" id="addNewPayMethodBtn">${getSvgIcon("plus", 13)} إضافة طريقة دفع جديدة</button>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(250px, 1fr));gap:10px;margin-bottom:10px;">
        ${payMethods.map((pm, idx) => `
          <div style="border:1.5px solid ${pm.enabled!==false?'var(--primary)':'var(--line)'};background:var(--paper2);border-radius:var(--radius);padding:12px;display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:22px;"></span>
              <div>
                <b style="font-size:13px;display:block;color:var(--ink);">${escapeHtml(pm.name)}</b>
                <span style="font-size:10.5px;color:var(--ink-secondary);">${pm.id}</span>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <label class="checkbox-row" style="margin:0;font-size:12px;">
                <input type="checkbox" class="pay-method-toggle" data-pmidx="${idx}" ${pm.enabled!==false?'checked':''}>
                <span style="font-weight:700;">${pm.enabled!==false?'مفعل':'معطل'}</span>
              </label>
              ${['cash','vodafone','card','instapay','credit'].includes(pm.id)?'':`
                <button class="btn btn-ghost btn-xs remove-custom-pm-btn" data-pmidx="${idx}" style="color:var(--red);padding:2px 6px;" title="حذف">&times;</button>
              `}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 2. Quick Services Buttons Management -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div>
          <h3 style="margin:0;font-size:15px;">أزرار الخدمات السريعة الفورية</h3>
                  </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(210px, 1fr));gap:10px;margin-bottom:14px;">
        ${quickServices.map((srv, idx) => `
          <div style="border:1px solid var(--line);background:var(--paper);border-radius:var(--radius);padding:10px 12px;display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:18px;"></span>
              <div>
                <b style="font-size:12.5px;display:block;">${escapeHtml(srv.name)}</b>
                <span class="mono font-bold" style="color:var(--primary);font-size:12px;">${Number(srv.price).toLocaleString()} ج.م</span>
              </div>
            </div>
            <button class="btn btn-ghost btn-xs remove-quick-srv-btn" data-srvidx="${idx}" style="color:var(--red);padding:2px 6px;" title="حذف">&times;</button>
          </div>
        `).join('')}
      </div>

      <div style="display:flex;gap:8px;background:var(--paper2);padding:10px;border-radius:var(--radius-sm);border:1px solid var(--line);flex-wrap:wrap;">
        <input id="newSrvName" placeholder="اسم الخدمة (مثال: صيانة سوفت وير)" style="flex:2;min-width:180px;">
        <input id="newSrvPrice" type="number" placeholder="السعر (ج.م)" style="flex:1;min-width:90px;" class="mono">
        <input id="newSrvIcon" placeholder="أيقونة" style="width:70px;text-align:center;">
        <button class="btn btn-primary btn-sm" id="addNewQuickSrvBtn">${getSvgIcon("plus", 13)} إضافة خدمة</button>
      </div>
    </div>

    <!-- 2.5 POS Shortcut Items Management (الأصناف السريعة والمختصرة في الكاشير) -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <div>
          <h3 style="margin:0;font-size:15px;">الأصناف السريعة والمختصرة في الكاشير (POS Shortcuts)</h3>
                  </div>
        <span class="status-badge st-check" style="font-size:11.5px;">${(posSettings.shortcutItemIds||[]).length} صنف محدد</span>
      </div>

      <!-- Current Shortcut Items Chips -->
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;min-height:48px;padding:10px;background:var(--paper2);border-radius:var(--radius-sm);border:1px solid var(--line);align-items:center;">
        ${(!posSettings.shortcutItemIds || posSettings.shortcutItemIds.length === 0) ? `
          <div style="color:var(--ink-secondary);font-size:12px;padding:6px 0;">لم يتم تعيين أصناف سريعة بعد. يمكنك اختيار صنف من القائمة أدناه أو الضغط على رمز النجمة في بطاقة أي صنف بشاشة البيع.</div>
        ` : posSettings.shortcutItemIds.map(id => {
          const it = (state.inventory||[]).find(x => String(x.ID||x.id) === String(id));
          const name = it ? it.Name : `صنف #${id}`;
          const cat = it ? it.Category : '';
          const price = it ? Number(it.SellPrice||it.PurchasePrice||0).toLocaleString() : '';
          return `
            <div style="display:inline-flex;align-items:center;gap:6px;background:var(--paper);border:1.5px solid var(--primary);border-radius:20px;padding:4px 10px;box-shadow:var(--shadow-sm);">
              
              <span style="font-size:12px;font-weight:800;color:var(--ink);">${escapeHtml(name)}</span>
              ${cat ? `<span style="font-size:10.5px;color:var(--ink-secondary);">[${escapeHtml(cat)}]</span>` : ''}
              ${price ? `<span class="mono" style="font-size:11px;color:var(--primary);font-weight:700;">(${price} ج.م)</span>` : ''}
              <button type="button" class="remove-pos-shortcut-btn" data-rmshortid="${id}" style="background:transparent;border:none;color:var(--red);cursor:pointer;font-weight:900;font-size:13px;padding:0 2px;margin-right:2px;" title="إلغاء التثبيت">&times;</button>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Add Shortcut Item From Inventory Dropdown -->
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <select id="posAddShortcutSelect" style="flex:1;min-width:220px;padding:7px 10px;font-size:12.5px;">
          <option value="">-- اختر صنفاً من المخزون لإضافته للأصناف السريعة --</option>
          ${(state.inventory||[])
            .filter(it => !(posSettings.shortcutItemIds||[]).includes(String(it.ID||it.id)))
            .map(it => `
              <option value="${it.ID||it.id}">
                ${escapeHtml(it.Name)} [${escapeHtml(it.Category||'صيانة')}] - ${Number(it.SellPrice||it.PurchasePrice||0).toLocaleString()} ج.م (متوفر: ${it.Quantity||0})
              </option>
            `).join('')}
        </select>
        <button type="button" class="btn btn-primary btn-sm" id="posAddShortcutBtn" style="padding:7px 14px;">
          ${getSvgIcon("plus", 13)} إضافة إلى الأصناف السريعة
        </button>
      </div>
    </div>

    <!-- 3. Receipt & Thermal Printer Settings -->
    <div class="card">
      <h3 style="margin-top:0;font-size:15px;">إعدادات طابعة الإيصالات والبون الحراري</h3>
            
      <div class="grid2" style="margin-bottom:14px;">
        <div class="field">
          <label>مقاس ورق الطابعة الحرارية (Receipt Size)</label>
          <select id="posReceiptPaperSize">
            <option value="80mm" ${posSettings.receiptPaperSize==='80mm'?'selected':''}>80mm (عرض قياسي 80 مم - طابعات إيصالات كاشير)</option>
            <option value="58mm" ${posSettings.receiptPaperSize==='58mm'?'selected':''}>58mm (عرض مدمج 58 مم - طابعات بلوتوث وحرارية صغيرة)</option>
          </select>
        </div>
        <div class="field">
          <label>نص تذييل وشكر الإيصال (Receipt Footer Text)</label>
          <input id="posReceiptFooter" value="${escapeHtml(posSettings.receiptFooter||'')}">
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:10px;">
        <label class="checkbox-row" style="font-size:12.5px;">
          <input type="checkbox" id="posAutoPrintReceipt" ${posSettings.autoPrintReceipt!==false?'checked':''}>
          <span>طباعة الإيصال الحراري تلقائياً فور إتمام البيع</span>
        </label>
        <label class="checkbox-row" style="font-size:12.5px;">
          <input type="checkbox" id="posShowCashierName" ${posSettings.showCashierName!==false?'checked':''}>
          <span>إظهار اسم الكاشير على بون العميل</span>
        </label>
        <label class="checkbox-row" style="font-size:12.5px;">
          <input type="checkbox" id="posShowLogoOnReceipt" ${posSettings.showLogoOnReceipt!==false?'checked':''}>
          <span>إظهار شعار المحل في أعلى الإيصال</span>
        </label>
      </div>
    </div>

    <!-- 4. Inventory & Tax Policies -->
    <div class="card">
      <h3 style="margin-top:0;font-size:15px;">السياسات المالية والمخزنية</h3>
      
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:14px;margin-bottom:14px;">
        <div style="background:var(--paper2);padding:12px;border-radius:var(--radius-sm);border:1px solid var(--line);">
          <label class="checkbox-row" style="font-size:13px;font-weight:800;margin-bottom:4px;">
            <input type="checkbox" id="posAllowNegativeStock" ${posSettings.allowNegativeStock?'checked':''}>
            <span>السماح بالبيع بالسالب (دون توفر رصيد)</span>
          </label>
          <div style="font-size:11.5px;color:var(--ink-secondary);padding-right:24px;">
            في حال تفعيله، سيتمكن الكاشير من إتمام البيع حتى لو كان الصنف غير مسجل له كمية كافية بالمخزن.
          </div>
        </div>

        <div style="background:var(--paper2);padding:12px;border-radius:var(--radius-sm);border:1px solid var(--line);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <label class="checkbox-row" style="font-size:13px;font-weight:800;margin:0;">
              <input type="checkbox" id="posEnableTax" ${posSettings.enableTax?'checked':''}>
              <span>تفعيل ضريبة القيمة المضافة (VAT)</span>
            </label>
            <div style="display:flex;align-items:center;gap:4px;">
              <input type="number" id="posTaxRate" value="${posSettings.taxRate||14}" style="width:60px;padding:3px 6px;text-align:center;" class="mono font-bold">
              <span style="font-size:12px;font-weight:800;">%</span>
            </div>
          </div>
          <div style="font-size:11.5px;color:var(--ink-secondary);padding-right:24px;">
            يتم حساب النسبة تلقائياً وإضافتها لملخص الفاتورة وإيصال البيع.
          </div>
        </div>

        <div style="background:var(--paper2);padding:12px;border-radius:var(--radius-sm);border:1px solid var(--line);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <label style="font-size:13px;font-weight:800;margin:0;">
              سقف الخصم المسموح بدون تصريح المشرف (POS)
            </label>
            <div style="display:flex;align-items:center;gap:4px;">
              <input type="number" id="posMaxDiscountPercent" value="${posSettings.maxDiscountPercent!=null?posSettings.maxDiscountPercent:10}" min="0" max="100" style="width:60px;padding:3px 6px;text-align:center;" class="mono font-bold">
              <span style="font-size:12px;font-weight:800;">%</span>
            </div>
          </div>
          <div style="font-size:11.5px;color:var(--ink-secondary);margin-bottom:8px;">
            أي خصم يتجاوز هذه النسبة المعتمدة سيتطلب إدخال كلمة مرور المشرف/المدير لإتمامه.
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px dashed var(--line);padding-top:6px;">
            <span style="font-size:11.5px;font-weight:700;">سقف المبلغ الأقصى (ج.م):</span>
            <input type="number" id="posMaxDiscountAmount" value="${posSettings.maxDiscountAmount||0}" min="0" placeholder="0 = غير محدد" style="width:85px;padding:2px 6px;text-align:center;" class="mono">
          </div>
        </div>

        <div style="background:var(--paper2);padding:12px;border-radius:var(--radius-sm);border:1px solid var(--line);">
          <label class="checkbox-row" style="font-size:13px;font-weight:800;margin-bottom:4px;">
            <input type="checkbox" id="posPreventBelowCost" ${posSettings.preventBelowCost!==false?'checked':''}>
            <span>حظر البيع بأقل من التكلفة دون إذن المشرف</span>
          </label>
          <div style="font-size:11.5px;color:var(--ink-secondary);padding-right:24px;">
            يمنع الكاشير من بيع أي صنف بسعر أقل من سعر شرائه وتكلفته المسجلة إلا بعد الحصول على تصريح المشرف.
          </div>
        </div>
      </div>

      <div style="text-align:left;margin-top:16px;border-top:1px solid var(--line);padding-top:12px;">
        <button class="btn btn-primary" id="savePosSettingsBtn" style="padding:9px 24px;font-weight:900;">
          ${getSvgIcon("check", 14)} حفظ كافة إعدادات نقطة البيع
        </button>
      </div>
    </div>
  `;

  attachSettingsQuickTabEvents(main);
  attachPosSettingsEvents(main);
}

function attachPosSettingsEvents(main){
  const posSettings = getPosSettings();
  let payMethods = posSettings.paymentMethods || [];
  let quickServices = posSettings.quickServices || [];

  // Remove shortcut item
  main.querySelectorAll('.remove-pos-shortcut-btn').forEach(btn => {
    btn.onclick = async ()=>{
      const rmId = String(btn.dataset.rmshortid);
      posSettings.shortcutItemIds = (posSettings.shortcutItemIds || []).filter(id => String(id) !== rmId);
      state.settings.pos = posSettings;
      setCache('settings', state.settings);
      try { await saveSettingRemote('pos', JSON.stringify(posSettings)); } catch(e){}
      renderPosSettings(main);
      showToast('تمت إزالة الصنف من القائمة السريعة', 'info');
    };
  });

  // Add shortcut item from dropdown
  const addShortcutBtn = document.getElementById('posAddShortcutBtn');
  if(addShortcutBtn){
    addShortcutBtn.onclick = async ()=>{
      const sel = document.getElementById('posAddShortcutSelect');
      const val = sel ? sel.value : '';
      if(!val){
        showToast('يرجى اختيار صنف من القائمة أولاً', 'error');
        return;
      }
      if(!Array.isArray(posSettings.shortcutItemIds)) posSettings.shortcutItemIds = [];
      if(!posSettings.shortcutItemIds.includes(val)){
        posSettings.shortcutItemIds.push(val);
        state.settings.pos = posSettings;
        setCache('settings', state.settings);
        try { await saveSettingRemote('pos', JSON.stringify(posSettings)); } catch(e){}
        renderPosSettings(main);
        showToast('تمت إضافة الصنف إلى الأصناف السريعة بنجاح', 'success');
      }
    };
  }

  // Toggle Payment Methods
  main.querySelectorAll('.pay-method-toggle').forEach(chk => {
    chk.onchange = ()=>{
      const idx = Number(chk.dataset.pmidx);
      if(payMethods[idx]){
        payMethods[idx].enabled = chk.checked;
      }
    };
  });

  // Remove custom pay method
  main.querySelectorAll('.remove-custom-pm-btn').forEach(btn => {
    btn.onclick = ()=>{
      const idx = Number(btn.dataset.pmidx);
      payMethods.splice(idx, 1);
      posSettings.paymentMethods = payMethods;
      renderPosSettings(main);
    };
  });

  // Add new payment method prompt / button
  const addPmBtn = document.getElementById('addNewPayMethodBtn');
  if(addPmBtn){
    addPmBtn.onclick = async ()=>{
      const name = await openPromptModal({
        title: 'إضافة طريقة دفع جديدة',
        message: 'أدخل اسم طريقة أو محفظة الدفع الجديدة:',
        placeholder: 'مثال: أورنج كاش / كاش بلس',
        confirmText: 'إضافة',
        cancelText: 'إلغاء'
      });
      if(!name || !name.trim()) return;
      const icon = '';
      const id = 'pm_' + Date.now();
      payMethods.push({ id, name: name.trim(), icon, enabled: true });
      posSettings.paymentMethods = payMethods;
      renderPosSettings(main);
      showToast('تمت إضافة طريقة الدفع بنجاح', 'success');
    };
  }

  // Add new quick service
  const addSrvBtn = document.getElementById('addNewQuickSrvBtn');
  if(addSrvBtn){
    addSrvBtn.onclick = ()=>{
      const name = document.getElementById('newSrvName').value.trim();
      const price = Number(document.getElementById('newSrvPrice').value);
      const icon = document.getElementById('newSrvIcon').value.trim() || '';
      if(!name){ showToast('يرجى كتابة اسم الخدمة', 'error'); return; }
      if(!price || price < 0){ showToast('يرجى تحديد سعر الخدمة', 'error'); return; }

      quickServices.push({ name, price, icon });
      posSettings.quickServices = quickServices;
      renderPosSettings(main);
      showToast('تمت إضافة الخدمة السريعة بنجاح', 'success');
    };
  }

  // Remove quick service
  main.querySelectorAll('.remove-quick-srv-btn').forEach(btn => {
    btn.onclick = ()=>{
      const idx = Number(btn.dataset.srvidx);
      quickServices.splice(idx, 1);
      posSettings.quickServices = quickServices;
      renderPosSettings(main);
    };
  });

  // Save all POS settings button
  const saveBtn = document.getElementById('savePosSettingsBtn');
  if(saveBtn){
    saveBtn.onclick = async ()=>{
      posSettings.receiptPaperSize = document.getElementById('posReceiptPaperSize').value;
      posSettings.receiptFooter = document.getElementById('posReceiptFooter').value.trim();
      posSettings.autoPrintReceipt = document.getElementById('posAutoPrintReceipt').checked;
      posSettings.showCashierName = document.getElementById('posShowCashierName').checked;
      posSettings.showLogoOnReceipt = document.getElementById('posShowLogoOnReceipt').checked;
      posSettings.allowNegativeStock = document.getElementById('posAllowNegativeStock').checked;
      posSettings.enableTax = document.getElementById('posEnableTax').checked;
      posSettings.taxRate = Number(document.getElementById('posTaxRate').value) || 14;
      posSettings.maxDiscountPercent = Number(document.getElementById('posMaxDiscountPercent').value) || 0;
      posSettings.maxDiscountAmount = Number(document.getElementById('posMaxDiscountAmount').value) || 0;
      posSettings.preventBelowCost = document.getElementById('posPreventBelowCost').checked;
      posSettings.paymentMethods = payMethods;
      posSettings.quickServices = quickServices;

      state.settings.pos = posSettings;
      setCache('settings', state.settings);

      try {
        await saveSettingRemote('pos', JSON.stringify(posSettings));
        showToast('تم حفظ كافة إعدادات نقطة البيع وخيارات الدفع بنجاح', 'success');
      } catch(e) {
        showToast('تم حفظ إعدادات الـ POS محلياً', 'info');
      }
      renderPosSettings(main);
    };
  }
}

/* 4. Smart WhatsApp Templates */
function renderWhatsappSettings(main){
  const activeWaKey = state.activeWaKey || 'check';
  const templates = (state.settings && state.settings.waTemplates) || DEFAULT_WA_TEMPLATES;
  const currentContent = templates[activeWaKey] || DEFAULT_WA_TEMPLATES[activeWaKey] || '';

  const waKeys = [
    {k:'cost_estimate', icon: getSvgIcon('wallet', 14), label:'0. عرض ومقايسة التكلفة (موافقة / رفض وفحص)'},
    {k:'intake', icon: getSvgIcon('download', 14), label:'1. استلام الجهاز وحجز الإيصال (جديد)'},
    {k:'check', icon: getSvgIcon('search', 14), label:'2. فحص وتشخيص الجهاز (قيد الفحص)'},
    {k:'repair', icon: getSvgIcon('tool', 14), label:'3. بدء الإصلاح الفعلي (الصيانة)'},
    {k:'done', icon: getSvgIcon('check', 14), label:'4. جاهز للاستلام (مكتمل)'},
    {k:'delivered', icon: getSvgIcon('truck', 14), label:'5. تسليم الجهاز وتفعيل الضمان'},
    {k:'pending', icon: getSvgIcon('pause', 14), label:'6. صيانة معلقة بانتظار العميل'},
    {k:'warranty', icon: getSvgIcon('shield', 14), label:'7. صيانة تحت الضمان'},
    {k:'overdue', icon: getSvgIcon('clock', 14), label:'8. تذكير بالأجهزة المتروكة (+7 أيام)'},
    {k:'unrepairable', icon: getSvgIcon('alert', 14), label:'9. تعذر الصيانة'},
    {k:'rejected', icon: getSvgIcon('x', 14), label:'10. رفض العميل'}
  ];

  const placeholders = [
    {p:'{customer_name}', label:'اسم العميل'},
    {p:'{receipt_no}', label:'رقم الإيصال'},
    {p:'{date}', label:'تاريخ الاستلام'},
    {p:'{time}', label:'وقت الاستلام'},
    {p:'{device}', label:'الجهاز والماركة'},
    {p:'{faults_report}', label:'تقرير الفحص'},
    {p:'{cost}', label:'إجمالي التكلفة'},
    {p:'{deposit}', label:'المدفوع مقدماً'},
    {p:'{deposit_info}', label:'بند العربون'},
    {p:'{remaining}', label:'المتبقي المطلوب'},
    {p:'{inspection_fee}', label:'تكلفة الفحص (رفض)'},
    {p:'{estimate_time}', label:'مدة الإصلاح'},
    {p:'{warranty}', label:'فترة الضمان'},
    {p:'{warranty_info}', label:'بند الضمان'},
    {p:'{status}', label:'الحالة'},
    {p:'{track_url}', label:'رابط التتبع المباشر'},
    {p:'{shop_name}', label:'اسم المحل'},
    {p:'{shop_phone}', label:'هاتف المحل'},
    {p:'{shop_address}', label:'عنوان المحل'}
  ];

  main.innerHTML = `
    ${renderSettingsNavHeader('قوالب رسائل واتساب الذكية', 'تخصيص صيغ الرسائل التلقائية المرسلة للعملاء حسب حالة الصيانة مع دعم المتغيرات الفورية')}

    <div class="card">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
        ${waKeys.map(w => `
          <button class="btn btn-sm ${w.k===activeWaKey?'btn-primary':'btn-ghost'}" data-wa-key="${w.k}">
            ${w.icon} ${w.label}
          </button>
        `).join('')}
      </div>

      <div style="margin-bottom:12px;">
        <label>إدراج متغيرات تلقائية بنقرة واحدة (Placeholders):</label>
        <div class="chip-group" style="margin-top:6px;">
          ${placeholders.map(pl => `
            <div class="chip" data-insert-placeholder="${pl.p}" title="انقر لإدراج ${pl.p} في الرسالة">
              ${pl.label} <span class="mono" style="font-size:10px;opacity:0.7;">${pl.p}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="field">
        <label>نص قالب الرسالة لحالة: <b>${(waKeys.find(w=>w.k===activeWaKey)||{}).label}</b></label>
        <textarea id="waTemplateTextarea" style="min-height:160px;font-size:13.5px;line-height:1.6;font-family:inherit;">${currentContent}</textarea>
      </div>

      <!-- Live Simulated WhatsApp Preview Card -->
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:12px 14px;margin-top:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <label style="font-size:12px;font-weight:700;color:#14532d;margin:0;display:flex;align-items:center;gap:6px;">
            معاينة حية لشكل رسالة واتساب كما ستصل للعميل:
          </label>
          <span style="font-size:11px;color:#15803d;">بيانات محاكاة ذكية</span>
        </div>
        <div id="waSettingsLivePreview" style="background:#fff;border:1px solid #bbf7d0;border-radius:8px;padding:12px;font-size:13px;line-height:1.6;white-space:pre-wrap;color:#14532d;max-height:160px;overflow-y:auto;direction:rtl;box-shadow:inset 0 1px 2px rgba(0,0,0,0.02);"></div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;flex-wrap:wrap;gap:10px;">
        <button class="btn btn-ghost btn-sm" id="resetCurrentWaBtn">↩ استعادة القالب الافتراضي لهذه الحالة</button>
        <button class="btn btn-primary" id="saveWaTemplateBtn">${getSvgIcon("check", 14)} حفظ تعديل قالب الرسالة</button>
      </div>
    </div>

    <!-- Default Cost Estimate & Inspection Settings -->
    <div class="card" style="margin-top:16px;border-right:4px solid #10b981;">
      <h3 style="margin-top:0;font-size:15px;color:#047857;display:flex;align-items:center;gap:6px;">
        إعدادات مقايسة التكلفة وفحص الأجهزة الافتراضية
      </h3>
      <p style="font-size:12px;color:var(--ink-secondary);margin-bottom:12px;">تحديد القيم الافتراضية التي تظهر تلقائياً في نافذة عرض التكلفة ومقايسة واتساب قبل إرسالها للعميل:</p>
      
      <div class="grid3">
        <div class="field" style="margin-bottom:0;">
          <label>تكلفة الفحص وتشخيص العطل الافتراضية (في حال رفض الصيانة):</label>
          <input type="number" id="setDefaultInspectionFee" value="${state.settings && state.settings.defaultInspectionFee != null ? state.settings.defaultInspectionFee : 100}" min="0" step="10" placeholder="100">
        </div>
        <div class="field" style="margin-bottom:0;">
          <label>مدة الإصلاح المتوقعة الافتراضية:</label>
          <input type="text" id="setDefaultEstimateTime" value="${escapeHtml((state.settings && state.settings.defaultEstimateTime) || 'خلال 24-48 ساعة')}" placeholder="خلال 24-48 ساعة">
        </div>
        <div class="field" style="margin-bottom:0;">
          <label>فترة الضمان الافتراضية:</label>
          <input type="text" id="setDefaultWarranty" value="${escapeHtml((state.settings && state.settings.defaultWarranty) || '3 شهور ضد عيوب الصناعة')}" placeholder="3 شهور ضد عيوب الصناعة">
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end;margin-top:14px;">
        <button class="btn btn-primary btn-sm" id="saveEstimateDefaultsBtn">${getSvgIcon("check", 14)} حفظ إعدادات المقايسة الافتراضية</button>
      </div>
    </div>
  `;

  attachSettingsQuickTabEvents(main);

  main.querySelectorAll('[data-wa-key]').forEach(btn => {
    btn.onclick = ()=>{
      state.activeWaKey = btn.dataset.waKey;
      renderWhatsappSettings(main);
    };
  });

  const textarea = document.getElementById('waTemplateTextarea');

  function updateSettingsLivePreview(){
    const previewBox = document.getElementById('waSettingsLivePreview');
    if(!previewBox || !textarea) return;
    const rawText = textarea.value;
    const trackUrl = `${window.location.origin}${window.location.pathname}?track=MT-2026-0001`;
    const rendered = rawText
      .replace(/{customer_name}/g, 'أحمد محمود')
      .replace(/{receipt_no}/g, 'MT-2026-0001')
      .replace(/{date}/g, new Date().toISOString().slice(0,10))
      .replace(/{time}/g, '04:30 م')
      .replace(/{device}/g, 'لابتوب - Dell G15 5511')
      .replace(/{faults}/g, 'شاشة مكسورة، فحص المذربورد')
      .replace(/{faults_report}/g, 'شاشة مكسورة، فحص المذربورد')
      .replace(/{status}/g, (waKeys.find(w=>w.k===activeWaKey)||{}).label || 'قيد الفحص')
      .replace(/{cost}/g, '1,800')
      .replace(/{deposit}/g, '500')
      .replace(/{deposit_info}/g, '• العربون المدفوع مسبقاً: *500 ج.م*')
      .replace(/{remaining}/g, '1,300')
      .replace(/{inspection_fee}/g, '100')
      .replace(/{estimate_time}/g, 'خلال 24-48 ساعة')
      .replace(/{warranty}/g, '3 شهور ضد عيوب الصناعة')
      .replace(/{warranty_info}/g, '• فترة الضمان المعتمدة: *3 شهور ضد عيوب الصناعة*')
      .replace(/{track_url}/g, trackUrl)
      .replace(/{shop_name}/g, (state.settings && state.settings.shopName) || 'صيانة ميكروتك')
      .replace(/{shop_phone}/g, (state.settings && (state.settings.shopPhone || state.settings.phone)) || '01000000000')
      .replace(/{shop_address}/g, (state.settings && (state.settings.shopAddress || state.settings.address)) || 'شارع التحرير')
      .replace(/\n\s*\n\s*\n+/g, '\n\n');
    previewBox.textContent = rendered;
  }
  if(textarea){
    textarea.oninput = updateSettingsLivePreview;
    updateSettingsLivePreview();
  }

  main.querySelectorAll('[data-insert-placeholder]').forEach(chip => {
    chip.onclick = ()=>{
      const p = chip.dataset.insertPlaceholder;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      textarea.value = val.substring(0, start) + p + val.substring(end);
      textarea.focus();
      textarea.setSelectionRange(start + p.length, start + p.length);
      updateSettingsLivePreview();
    };
  });

  document.getElementById('saveWaTemplateBtn').onclick = async ()=>{
    if(!state.settings.waTemplates) state.settings.waTemplates = {...DEFAULT_WA_TEMPLATES};
    state.settings.waTemplates[activeWaKey] = textarea.value;
    setCache('settings', state.settings);
    try {
      await saveSettingRemote('waTemplates', JSON.stringify(state.settings.waTemplates));
      showToast('تم حفظ قالب رسالة واتساب بنجاح', 'success');
    } catch(e){
      showToast('تم حفظ القالب محلياً', 'info');
    }
  };

  document.getElementById('resetCurrentWaBtn').onclick = async ()=>{
    const ok = await openConfirmModal({
      title: 'استعادة القالب الافتراضي',
      message: 'هل تريد بالتأكيد استعادة القالب الافتراضي لهذه الحالة؟',
      confirmText: 'استعادة',
      cancelText: 'إلغاء'
    });
    if(ok){
      if(!state.settings.waTemplates) state.settings.waTemplates = {...DEFAULT_WA_TEMPLATES};
      state.settings.waTemplates[activeWaKey] = DEFAULT_WA_TEMPLATES[activeWaKey];
      textarea.value = DEFAULT_WA_TEMPLATES[activeWaKey];
      setCache('settings', state.settings);
      showToast('تم استعادة القالب الافتراضي', 'info');
    }
  };

  const saveEstDefBtn = document.getElementById('saveEstimateDefaultsBtn');
  if(saveEstDefBtn){
    saveEstDefBtn.onclick = async ()=>{
      const fee = Number(document.getElementById('setDefaultInspectionFee').value);
      const estTime = document.getElementById('setDefaultEstimateTime').value.trim();
      const war = document.getElementById('setDefaultWarranty').value.trim();
      state.settings.defaultInspectionFee = !isNaN(fee) ? fee : 100;
      state.settings.defaultEstimateTime = estTime || 'خلال 24-48 ساعة';
      state.settings.defaultWarranty = war || '3 شهور ضد عيوب الصناعة';
      setCache('settings', state.settings);
      try {
        await saveSettingRemote('defaultInspectionFee', String(state.settings.defaultInspectionFee));
        await saveSettingRemote('defaultEstimateTime', state.settings.defaultEstimateTime);
        await saveSettingRemote('defaultWarranty', state.settings.defaultWarranty);
        showToast('تم حفظ إعدادات مقايسة التكلفة الافتراضية بنجاح', 'success');
      } catch(e){
        showToast('تم حفظ الإعدادات محلياً', 'info');
      }
    };
  }
}

/* 4. Warranty & Legal Agreement Terms */
function renderWarrantySettings(main){
  const currentTerms = getTerms();
  const currentInvTerms = getInvoiceTerms();
  const currentQuoteTerms = getQuoteTerms();
  const currentAgreementTerms = getQuoteAgreementTerms();

  main.innerHTML = `
    ${renderSettingsNavHeader('بنود الضمان وعقود الاتفاق', 'تخصيص وكتابة بنود وشروط إيصال الصيانة (A5) والفواتير وعروض الأسعار وعقود التوريد والتركيب')}

    <!-- Maintenance A5 Receipt Terms -->
    <div class="card" style="border-right:4px solid var(--blue);">
      <h3 style="margin-top:0;font-size:15px;color:var(--blue-text);">بنود وشروط إيصال استلام الصيانة (ورقة A5)</h3>
      <p style="font-size:12px;color:var(--ink-secondary);margin-bottom:10px;">هذه البنود تطبع أسفل إيصال استلام الصيانة الأصلي:</p>
      <textarea id="setTermsText" style="min-height:120px;font-size:12.5px;line-height:1.6;">${currentTerms}</textarea>
      <div style="display:flex;justify-content:space-between;margin-top:10px;">
        <button class="btn btn-ghost btn-xs" id="resetTermsBtn">↩ استعادة البنود الافتراضية</button>
        <button class="btn btn-primary btn-sm" id="saveTermsBtn">${getSvgIcon("check", 14)} حفظ بنود إيصال الصيانة</button>
      </div>
    </div>

    <!-- Tax Invoice Terms -->
    <div class="card" style="border-right:4px solid var(--purple);">
      <h3 style="margin-top:0;font-size:15px;color:var(--purple-text);">شروط وملاحظات الفاتورة الضريبية الرسمية</h3>
      <p style="font-size:12px;color:var(--ink-secondary);margin-bottom:10px;">تظهر أسفل الفواتير الضريبية ومبيعات الكاشير:</p>
      <textarea id="setInvTermsText" style="min-height:90px;font-size:12.5px;line-height:1.6;">${currentInvTerms}</textarea>
      <div style="display:flex;justify-content:space-between;margin-top:10px;">
        <button class="btn btn-ghost btn-xs" id="resetInvTermsBtn">↩ استعادة الافتراضي</button>
        <button class="btn btn-primary btn-sm" id="saveInvTermsBtn">${getSvgIcon("check", 14)} حفظ شروط الفاتورة</button>
      </div>
    </div>

    <!-- Quotation Terms -->
    <div class="card" style="border-right:4px solid var(--cyan);">
      <h3 style="margin-top:0;font-size:15px;color:var(--cyan-text);">شروط وأحكام عرض الأسعار وبيان التكلفة</h3>
      <p style="font-size:12px;color:var(--ink-secondary);margin-bottom:10px;">تظهر أسفل صفحة عرض السعر الصادر للعميل:</p>
      <textarea id="setQuoteTermsText" style="min-height:90px;font-size:12.5px;line-height:1.6;">${currentQuoteTerms}</textarea>
      <div style="display:flex;justify-content:space-between;margin-top:10px;">
        <button class="btn btn-ghost btn-xs" id="resetQuoteTermsBtn">↩ استعادة الافتراضي</button>
        <button class="btn btn-primary btn-sm" id="saveQuoteTermsBtn">${getSvgIcon("check", 14)} حفظ شروط عرض السعر</button>
      </div>
    </div>

    <!-- Quotation Agreement & Contract Terms -->
    <div class="card" style="border-right:4px solid var(--green);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <h3 style="margin:0;font-size:15px;color:var(--green-text);">بنود وشروط عقد واتفاق التوريد والتركيب</h3>
      </div>
      <p style="font-size:12px;color:var(--ink-secondary);margin-bottom:10px;">
        تطبع هذه البنود عند الضغط على زر <b>"طباعة اتفاق وشروط العرض"</b> لطباعة عقد رسمي ملزم للطرفين مع جدول سداد الدفعات وتوقيعات الاستلام:
      </p>
      <textarea id="setAgreementTermsText" style="min-height:140px;font-size:12.5px;line-height:1.7;">${currentAgreementTerms}</textarea>
      <div style="display:flex;justify-content:space-between;margin-top:10px;">
        <button class="btn btn-ghost btn-xs" id="resetAgreementTermsBtn">↩ استعادة بنود العقد الافتراضية</button>
        <button class="btn btn-primary btn-sm" id="saveAgreementTermsBtn">${getSvgIcon("check", 14)} حفظ بنود العقد والاتفاق</button>
      </div>
    </div>
  `;

  attachSettingsQuickTabEvents(main);

  document.getElementById('saveTermsBtn').onclick = async ()=>{
    const v = document.getElementById('setTermsText').value.trim();
    state.settings.terms = v;
    setCache('settings', state.settings);
    await saveSettingRemote('terms', v);
    showToast('تم حفظ بنود إيصال الصيانة بنجاح', 'success');
  };
  document.getElementById('resetTermsBtn').onclick = ()=>{
    document.getElementById('setTermsText').value = DEFAULT_TERMS;
    state.settings.terms = DEFAULT_TERMS;
    setCache('settings', state.settings);
    showToast('تمت استعادة بنود الصيانة الافتراضية', 'info');
  };

  document.getElementById('saveInvTermsBtn').onclick = async ()=>{
    const v = document.getElementById('setInvTermsText').value.trim();
    state.settings.invoiceTerms = v;
    setCache('settings', state.settings);
    await saveSettingRemote('invoiceTerms', v);
    showToast('تم حفظ شروط الفاتورة بنجاح', 'success');
  };
  document.getElementById('resetInvTermsBtn').onclick = ()=>{
    document.getElementById('setInvTermsText').value = DEFAULT_INVOICE_TERMS;
    state.settings.invoiceTerms = DEFAULT_INVOICE_TERMS;
    setCache('settings', state.settings);
    showToast('تمت استعادة شروط الفاتورة الافتراضية', 'info');
  };

  document.getElementById('saveQuoteTermsBtn').onclick = async ()=>{
    const v = document.getElementById('setQuoteTermsText').value.trim();
    state.settings.quoteTerms = v;
    setCache('settings', state.settings);
    await saveSettingRemote('quoteTerms', v);
    showToast('تم حفظ شروط عرض السعر بنجاح', 'success');
  };
  document.getElementById('resetQuoteTermsBtn').onclick = ()=>{
    document.getElementById('setQuoteTermsText').value = DEFAULT_QUOTE_TERMS;
    state.settings.quoteTerms = DEFAULT_QUOTE_TERMS;
    setCache('settings', state.settings);
    showToast('تمت استعادة شروط عرض السعر الافتراضية', 'info');
  };

  document.getElementById('saveAgreementTermsBtn').onclick = async ()=>{
    const v = document.getElementById('setAgreementTermsText').value.trim();
    state.settings.quoteAgreementTerms = v;
    setCache('settings', state.settings);
    await saveSettingRemote('quoteAgreementTerms', v);
    showToast('تم حفظ بنود عقد واتفاق التوريد بنجاح', 'success');
  };
  document.getElementById('resetAgreementTermsBtn').onclick = ()=>{
    document.getElementById('setAgreementTermsText').value = DEFAULT_QUOTE_AGREEMENT_TERMS;
    state.settings.quoteAgreementTerms = DEFAULT_QUOTE_AGREEMENT_TERMS;
    setCache('settings', state.settings);
    showToast('تمت استعادة بنود عقد التوريد الافتراضية', 'info');
  };
}

/* 5. Device Categories & Brands Master */
function renderDevicesSettings(main){
  const brandsObj = getBrands();
  const categories = Object.keys(brandsObj);
  const selectedCat = state.selectedDeviceCat || categories[0] || 'لابتوب';
  const brandsList = brandsObj[selectedCat] || [];

  main.innerHTML = `
    ${renderSettingsNavHeader('تصنيفات وماركات الأجهزة', 'إدارة فئات الأجهزة (لابتوب، موبايل، شاشات، كاميرات...) وتخصيص الماركات التابعة لكل فئة')}

    <div class="card">
      <h3 style="margin-top:0;font-size:15px;">1. تصنيفات وفئات الأجهزة</h3>
      <p style="font-size:12px;color:var(--ink-secondary);margin-bottom:12px;">اختر فئة لتعديل ماركاتها، أو أضف فئة جديدة:</p>
      
      <div class="chip-group" style="margin-bottom:16px;">
        ${categories.map(cat => `
          <div class="chip ${cat===selectedCat?'sel':''}" data-select-cat="${cat}">
            ${cat}
          </div>
        `).join('')}
      </div>

      <div style="display:flex;gap:10px;margin-bottom:20px;">
        <input id="newCatInput" placeholder="اسم فئة جديدة (مثال: أجهزة منزلية / بلايستيشن)" style="flex:1;">
        <button class="btn btn-primary btn-sm" id="addNewCatBtn">${getSvgIcon("plus", 13)} إضافة فئة جديدة</button>
      </div>

      <hr style="border:none;border-top:1px solid var(--line);margin:18px 0;">

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="margin:0;font-size:15px;">2. الماركات والأنواع التابعة لـ: <span style="color:var(--primary);">${selectedCat}</span></h3>
        ${categories.length > 1 ? `<button class="btn btn-ghost btn-xs" id="deleteCurrentCatBtn" style="color:var(--red);">${getSvgIcon("trash", 13)} حذف فئة "${selectedCat}"</button>` : ''}
      </div>

      <div class="chip-group" style="margin-bottom:16px;">
        ${brandsList.map(b => `
          <div class="chip sel" style="display:inline-flex;align-items:center;gap:6px;">
            <span>${b}</span>
            <span class="remove-brand-btn" data-brand="${b}" style="cursor:pointer;color:#fca5a5;font-weight:900;" title="حذف الماركة">&times;</span>
          </div>
        `).join('')}
      </div>

      <div style="display:flex;gap:10px;">
        <input id="newBrandInput" placeholder="إضافة ماركة جديدة لـ ${selectedCat} (مثال: Sony / Xiaomi)" style="flex:1;">
        <button class="btn btn-primary btn-sm" id="addNewBrandBtn">${getSvgIcon("plus", 13)} إضافة ماركة</button>
      </div>
    </div>
  `;

  attachSettingsQuickTabEvents(main);

  main.querySelectorAll('[data-select-cat]').forEach(chip => {
    chip.onclick = ()=>{
      state.selectedDeviceCat = chip.dataset.selectCat;
      renderDevicesSettings(main);
    };
  });

  document.getElementById('addNewCatBtn').onclick = async ()=>{
    const v = document.getElementById('newCatInput').value.trim();
    if(!v) return;
    if(brandsObj[v]){ showToast('هذه الفئة موجودة بالفعل', 'error'); return; }
    brandsObj[v] = ['أخرى'];
    state.settings.brands = brandsObj;
    state.selectedDeviceCat = v;
    setCache('settings', state.settings);
    await saveSettingRemote('brands', JSON.stringify(brandsObj));
    showToast(`تمت إضافة فئة (${v}) بنجاح`, 'success');
    renderDevicesSettings(main);
  };

  document.getElementById('addNewBrandBtn').onclick = async ()=>{
    const v = document.getElementById('newBrandInput').value.trim();
    if(!v) return;
    if(!brandsObj[selectedCat]) brandsObj[selectedCat] = [];
    if(brandsObj[selectedCat].includes(v)){ showToast('هذه الماركة مضافة مسبقاً', 'error'); return; }
    brandsObj[selectedCat].push(v);
    state.settings.brands = brandsObj;
    setCache('settings', state.settings);
    await saveSettingRemote('brands', JSON.stringify(brandsObj));
    showToast(`تمت إضافة الماركة (${v}) بنجاح`, 'success');
    renderDevicesSettings(main);
  };

  main.querySelectorAll('.remove-brand-btn').forEach(btn => {
    btn.onclick = async (e)=>{
      e.stopPropagation();
      const b = btn.dataset.brand;
      brandsObj[selectedCat] = brandsObj[selectedCat].filter(x => x !== b);
      state.settings.brands = brandsObj;
      setCache('settings', state.settings);
      await saveSettingRemote('brands', JSON.stringify(brandsObj));
      showToast(`تم حذف الماركة (${b})`, 'info');
      renderDevicesSettings(main);
    };
  });

  const delCatBtn = document.getElementById('deleteCurrentCatBtn');
  if(delCatBtn){
    delCatBtn.onclick = async ()=>{
      const ok = await openConfirmModal({
        title: 'حذف فئة أجهزة',
        message: `هل تريد بالتأكيد حذف فئة الأجهزة "${escapeHtml(selectedCat)}" بكافة ماركاتها؟`,
        confirmText: 'حذف الفئة',
        cancelText: 'إلغاء',
        confirmClass: 'btn-danger'
      });
      if(ok){
        delete brandsObj[selectedCat];
        state.settings.brands = brandsObj;
        state.selectedDeviceCat = Object.keys(brandsObj)[0] || 'لابتوب';
        setCache('settings', state.settings);
        await saveSettingRemote('brands', JSON.stringify(brandsObj));
        showToast(`تم حذف الفئة بنجاح`, 'info');
        renderDevicesSettings(main);
      }
    };
  }
}

/* 6. Common Faults & Technicians */
function renderFaultsSettings(main){
  const faultsList = getCommonFaults();
  const techsList = state.technicians || [];

  main.innerHTML = `
    ${renderSettingsNavHeader('الأعطال الشائعة والفنيين', 'تخصيص شرائح الأعطال السريعة في إيصال الاستلام وإدارة قائمة الفنيين')}

    <!-- Common Faults Chips Management -->
    <div class="card">
      <h3 style="margin-top:0;font-size:15px;">شرائح الأعطال الشائعة السريعة (${faultsList.length} عطل)</h3>
      <p style="font-size:12px;color:var(--ink-secondary);margin-bottom:12px;">هذه الأعطال تظهر كشرائح سريعة عند استلام وتعديل أجهزة الصيانة:</p>
      
      <div class="chip-group" style="margin-bottom:16px;">
        ${faultsList.map(f => `
          <div class="chip sel" style="display:inline-flex;align-items:center;gap:6px;">
            <span>${f}</span>
            <span class="remove-fault-btn" data-fault="${f}" style="cursor:pointer;color:#fca5a5;font-weight:900;" title="حذف العطل">&times;</span>
          </div>
        `).join('')}
      </div>

      <div style="display:flex;gap:10px;">
        <input id="newFaultInput" placeholder="إضافة عطل شائع جديد (مثال: تغيير باغة / صيانة كيبورد)" style="flex:1;">
        <button class="btn btn-primary btn-sm" id="addNewFaultBtn">${getSvgIcon("plus", 13)} إضافة عطل</button>
      </div>
    </div>

    <!-- Technicians Management -->
    <div class="card">
      <h3 style="margin-top:0;font-size:15px;">قائمة الفنيين المعتمدين (${techsList.length} فني)</h3>
      <p style="font-size:12px;color:var(--ink-secondary);margin-bottom:12px;">الفنيين المتاح إسناد أوامر الشغل وحساب المكافآت لهم:</p>
      
      <div class="chip-group" style="margin-bottom:16px;">
        ${techsList.map(t => `
          <div class="chip sel" style="display:inline-flex;align-items:center;gap:6px;">
            <span>${t}</span>
            <span class="remove-tech-btn" data-tech="${t}" style="cursor:pointer;color:#fca5a5;font-weight:900;" title="حذف الفني">&times;</span>
          </div>
        `).join('')}
      </div>

      <div style="display:flex;gap:10px;">
        <input id="newTechNameInput" placeholder="اسم فني جديد" style="flex:1;">
        <button class="btn btn-primary btn-sm" id="addNewTechBtn">${getSvgIcon("plus", 13)} إضافة فني</button>
      </div>
    </div>
  `;

  attachSettingsQuickTabEvents(main);

  document.getElementById('addNewFaultBtn').onclick = async ()=>{
    const v = document.getElementById('newFaultInput').value.trim();
    if(!v) return;
    const current = getCommonFaults();
    if(current.includes(v)){ showToast('هذا العطل مضاف مسبقاً', 'error'); return; }
    current.push(v);
    state.settings.commonFaults = current;
    setCache('settings', state.settings);
    await saveSettingRemote('commonFaults', JSON.stringify(current));
    showToast(`تمت إضافة العطل (${v}) بنجاح`, 'success');
    renderFaultsSettings(main);
  };

  main.querySelectorAll('.remove-fault-btn').forEach(btn => {
    btn.onclick = async ()=>{
      const f = btn.dataset.fault;
      let current = getCommonFaults().filter(x => x !== f);
      state.settings.commonFaults = current;
      setCache('settings', state.settings);
      await saveSettingRemote('commonFaults', JSON.stringify(current));
      showToast(`تم حذف العطل (${f})`, 'info');
      renderFaultsSettings(main);
    };
  });

  document.getElementById('addNewTechBtn').onclick = async ()=>{
    const v = document.getElementById('newTechNameInput').value.trim();
    if(!v) return;
    try {
      await saveTechnicianRemote(v);
      showToast(`تمت إضافة الفني (${v}) بنجاح`, 'success');
      renderFaultsSettings(main);
    } catch(e){ showToast('تمت الإضافة محلياً', 'info'); }
  };

  main.querySelectorAll('.remove-tech-btn').forEach(btn => {
    btn.onclick = async ()=>{
      const t = btn.dataset.tech;
      state.technicians = state.technicians.filter(x => x !== t);
      setCache('technicians', state.technicians);
      showToast(`تم حذف الفني (${t})`, 'info');
      renderFaultsSettings(main);
    };
  });
}

/* 7. Cloud Sync & Offline Diagnostics [U5] */