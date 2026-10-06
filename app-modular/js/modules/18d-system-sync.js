function renderSyncSettings(main){
  const queue = getSyncQueue();
  const isOnline = navigator.onLine;
  const terminalCount = queue.filter(i => i.status === 'failed_terminal').length;
  const pendingCount = queue.filter(i => i.status !== 'failed_terminal').length;
  const storageStats = typeof getLocalStorageUsage === 'function' ? getLocalStorageUsage() : { percentUsed: 0, usedMB: '0.00', usedKB: '0', keyCount: 0, breakdown: {} };

  const ACTION_LABELS = {
    saveSale: 'تسجيل عملية بيع',
    saveReceipt: 'تسجيل / تعديل إيصال صيانة',
    savePayment: 'سند صرف / قبض مالي',
    saveReturn: 'مرتجع مبيعات',
    savePurchase: 'فاتورة مشتريات',
    saveExpense: 'تسجيل مصروف',
    saveInvoice: 'فاتورة ضريبية / مبيعات',
    saveCustomer: 'إضافة / تعديل عميل',
    saveItem: 'صنف مخزون',
    saveSupplier: 'بيانات مورد',
    settleSaleDebt: 'سداد مديونية بيع'
  };

  const queueRowsHtml = queue.map((item, idx) => {
    const actionName = ACTION_LABELS[item.action] || item.action || 'عملية غير معروفة';
    const clientRefDisplay = item.clientRef || (item.data && (item.data.clientRef || item.data.ClientRef)) || item.id || '—';
    const isTerminal = item.status === 'failed_terminal';
    const retryCount = item.retryCount || 0;
    const timeFormatted = item.timestamp ? new Date(item.timestamp).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : '—';
    
    let statusBadge = '';
    if (isTerminal) {
      statusBadge = `<span class="status-badge st-reject" style="background:#fee2e2;color:#b91c1c;font-weight:700;">فشل نهائي (${retryCount}/10)</span>`;
    } else if (retryCount > 0) {
      statusBadge = `<span class="status-badge st-repair" style="background:#fef3c7;color:#b45309;">معلق (${retryCount}/10)</span>`;
    } else {
      statusBadge = `<span class="status-badge st-new">معلق للرفع</span>`;
    }

    const errText = item.lastError ? escapeHtml(item.lastError) : '—';

    return `
      <tr>
        <td style="font-weight:700;color:var(--ink-secondary);">${idx + 1}</td>
        <td>
          <div style="font-weight:700;font-size:13px;">${actionName}</div>
          <div style="font-size:11px;color:var(--ink-secondary);font-family:monospace;">${escapeHtml(item.action)}</div>
        </td>
        <td>
          <span class="mono" style="font-size:11.5px;background:var(--paper3);padding:2px 6px;border-radius:4px;" title="${escapeHtml(clientRefDisplay)}">
            ${escapeHtml(clientRefDisplay.length > 18 ? clientRefDisplay.slice(0, 16) + '...' : clientRefDisplay)}
          </span>
        </td>
        <td style="font-size:12px;color:var(--ink-secondary);">${timeFormatted}</td>
        <td>${statusBadge}</td>
        <td style="max-width:220px;">
          <div style="font-size:11.5px;color:${item.lastError ? 'var(--red-text)' : 'var(--ink-secondary)'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${errText}">
            ${errText}
          </div>
        </td>
        <td>
          <div style="display:flex;gap:4px;justify-content:flex-end;">
            <button class="btn btn-ghost btn-sm retry-single-btn" data-id="${item.id}" title="إعادة محاولة المزامنة الفورية">${getSvgIcon("refresh", 13)}</button>
            <button class="btn btn-ghost btn-sm export-single-btn" data-id="${item.id}" title="تصدير بيانات العملية">${getSvgIcon("download", 13)}</button>
            <button class="btn btn-ghost btn-sm delete-single-btn" data-id="${item.id}" title="حذف من الطابور" style="color:var(--red);">${getSvgIcon("trash", 13)}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  main.innerHTML = `
    ${renderSettingsNavHeader('المزامنة السحابية والصيانة', 'فحص حالة الاتصال بـ Google Sheets، مزامنة العمليات المعلقة، وإدارة الكاش المحلي')}

    <div class="card" style="border-right:4px solid ${isOnline?'var(--green)':'var(--amber)'};">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <h3 style="margin:0;font-size:16px;">حالة الاتصال والبيئة السحابية</h3>
        <span class="status-badge ${isOnline?'st-done':'st-repair'}">${isOnline?'متصل بالإنترنت':'وضع غير متصل (Offline)'}</span>
      </div>
      <p style="font-size:13px;color:var(--ink-secondary);line-height:1.6;margin-bottom:16px;">
        يعمل نظام <b>ميكروERP</b> بتقنية <b>Dual-Sync Hybrid Engine مع التحصين ضد التكرار (Idempotency)</b> والتراجع الأسي التلقائي (Exponential Backoff). يتم حفظ كل عملية محلياً بمرجع فريد مشفّر، ورفعها للسحابة دون تكرار حتى لو انقطع الاتصال أو أُعيدت المحاولة عدة مرات.
      </p>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:12px;margin-bottom:18px;">
        <div style="background:var(--paper3);border-radius:var(--radius-sm);padding:12px 14px;border:1px solid var(--line);">
          <div style="font-size:11.5px;color:var(--ink-secondary);">إجمالي طابور العمليات</div>
          <div class="num mono" style="font-size:22px;font-weight:800;color:${queue.length > 0 ? 'var(--amber-text)' : 'var(--green-text)'};margin-top:4px;">${queue.length}</div>
        </div>
        <div style="background:var(--paper3);border-radius:var(--radius-sm);padding:12px 14px;border:1px solid var(--line);">
          <div style="font-size:11.5px;color:var(--ink-secondary);">عمليات معلقة قيد الرفع</div>
          <div class="num mono" style="font-size:22px;font-weight:800;color:var(--primary);margin-top:4px;">${pendingCount}</div>
        </div>
        <div style="background:var(--paper3);border-radius:var(--radius-sm);padding:12px 14px;border:1px solid var(--line);">
          <div style="font-size:11.5px;color:var(--ink-secondary);">عمليات فشل نهائي (10 محاولات)</div>
          <div class="num mono" style="font-size:22px;font-weight:800;color:${terminalCount > 0 ? 'var(--red-text)' : 'var(--ink-secondary)'};margin-top:4px;">${terminalCount}</div>
        </div>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <button class="btn btn-primary" id="forceSyncBtn">${getSvgIcon("refresh", 14)} مزامنة العمليات المعلقة الآن</button>
        ${terminalCount > 0 ? `<button class="btn btn-ghost" id="retryFailedQueueBtn" style="color:var(--amber-text);border-color:var(--amber);">${getSvgIcon("refresh", 14)} إعادة محاولة الفشل النهائي (${terminalCount})</button>` : ''}
        ${queue.length > 0 ? `<button class="btn btn-ghost" id="exportAllQueueBtn">${getSvgIcon("download", 14)} تصدير الطابور كملف JSON</button>` : ''}
        ${queue.length > 0 ? `<button class="btn btn-ghost" id="clearQueueBtn" style="color:var(--red);">${getSvgIcon("trash", 13)} تفريغ طابور المزامنة</button>` : ''}
        <button class="btn btn-ghost" id="reloadCloudDataBtn">${getSvgIcon("refresh", 14)} إعادة تحميل البيانات من السحابة</button>
      </div>
    </div>

    <!-- بطاقة استهلاك مساحة التخزين المحلية والتحصين ضد الامتلاء (U9) -->
    <div class="card" style="border-right:4px solid ${storageStats.percentUsed > 90 ? 'var(--red)' : storageStats.percentUsed > 70 ? 'var(--amber)' : 'var(--green)'};">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <h3 style="margin:0;font-size:15px;display:flex;align-items:center;gap:6px;">
          <span>مساحة التخزين المحلية (LocalStorage Usage)</span>
          <span class="mono" style="font-size:12px;background:var(--paper3);padding:2px 8px;border-radius:12px;font-weight:700;">
            ${storageStats.usedMB} MB / ~5.00 MB (${storageStats.percentUsed}%)
          </span>
        </h3>
        <button class="btn btn-ghost btn-sm" id="smartCleanCacheBtn" style="color:var(--primary);border-color:var(--line);">
          ${getSvgIcon("trash", 13)} تنظيف الكاش الذكي (Smart Clean)
        </button>
      </div>

      <!-- Meter Bar -->
      <div style="background:var(--paper3);border-radius:999px;height:10px;overflow:hidden;margin-bottom:12px;border:1px solid var(--line);">
        <div style="background:${storageStats.percentUsed > 90 ? 'var(--red)' : storageStats.percentUsed > 70 ? 'var(--amber)' : 'var(--green)'};width:${storageStats.percentUsed}%;height:100%;transition:width 0.4s ease-in-out;"></div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;font-size:11.5px;">
        <div style="background:var(--paper3);padding:6px 10px;border-radius:var(--radius-sm);border:1px solid var(--line);">
          <span style="color:var(--ink-secondary);">كاش البيانات:</span>
          <span class="mono" style="font-weight:700;margin-right:4px;">${storageStats.breakdown ? storageStats.breakdown.cacheKB : 0} KB</span>
        </div>
        <div style="background:var(--paper3);padding:6px 10px;border-radius:var(--radius-sm);border:1px solid var(--line);">
          <span style="color:var(--ink-secondary);">طابور المزامنة:</span>
          <span class="mono" style="font-weight:700;margin-right:4px;">${storageStats.breakdown ? storageStats.breakdown.queueKB : 0} KB</span>
        </div>
        <div style="background:var(--paper3);padding:6px 10px;border-radius:var(--radius-sm);border:1px solid var(--line);">
          <span style="color:var(--ink-secondary);">سجلات التدقيق:</span>
          <span class="mono" style="font-weight:700;margin-right:4px;">${storageStats.breakdown ? storageStats.breakdown.auditKB : 0} KB</span>
        </div>
        <div style="background:var(--paper3);padding:6px 10px;border-radius:var(--radius-sm);border:1px solid var(--line);">
          <span style="color:var(--ink-secondary);">إعدادات النظام:</span>
          <span class="mono" style="font-weight:700;margin-right:4px;">${storageStats.breakdown ? storageStats.breakdown.settingsKB : 0} KB</span>
        </div>
        <div style="background:var(--paper3);padding:6px 10px;border-radius:var(--radius-sm);border:1px solid var(--line);">
          <span style="color:var(--ink-secondary);">عناصر التخزين:</span>
          <span class="mono" style="font-weight:700;margin-right:4px;">${storageStats.keyCount} مفتاح</span>
        </div>
      </div>
    </div>

    <!-- بطاقة استعراض وإدارة طابور المزامنة التفاعلي -->
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
        <h3 style="margin:0;font-size:15px;">سجل عناصر طابور المزامنة المحلي (Sync Queue)</h3>
        <span style="font-size:12px;color:var(--ink-secondary);">المحاولات تتم تلقائياً بتدرج زمني أسي (1s -> 2s -> 4s -> ... -> 5min)</span>
      </div>

      ${queue.length === 0 ? `
        <div style="text-align:center;padding:32px 16px;color:var(--ink-secondary);background:var(--paper3);border-radius:var(--radius-sm);border:1px dashed var(--line);">
          <div style="font-size:26px;margin-bottom:8px;">✓</div>
          <div style="font-weight:700;font-size:14px;color:var(--green-text);">طابور المزامنة فارغ تماماً</div>
          <div style="font-size:12px;margin-top:4px;">كافة العمليات والبيانات تم حفظها ورفعها للسحابة بنجاح دون أي تأخير.</div>
        </div>
      ` : `
        <div class="table-container" style="max-height:420px;overflow-y:auto;border:1px solid var(--line);border-radius:var(--radius-sm);">
          <table class="table" style="margin:0;font-size:12.5px;">
            <thead style="position:sticky;top:0;background:var(--paper2);z-index:2;">
              <tr>
                <th style="width:40px;">#</th>
                <th>نوع العملية</th>
                <th>معرف الطلب (ClientRef)</th>
                <th>وقت التسجيل</th>
                <th>الحالة والمحاولات</th>
                <th>آخر استجابة / خطأ</th>
                <th style="text-align:left;">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              ${queueRowsHtml}
            </tbody>
          </table>
        </div>
      `}
    </div>

    <div class="card" style="border-right:4px solid var(--primary);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
        <h3 style="margin:0;font-size:15px;color:var(--primary);">النسخ الاحتياطي والاستعادة الشاملة</h3>
        <button class="btn btn-primary btn-sm" id="goToBackupTabBtn">${getSvgIcon("download", 13)} الانتقال لمركز النسخ الاحتياطي ↗</button>
      </div>
      <p style="font-size:12.5px;color:var(--ink-secondary);line-height:1.6;margin:0;">
        تصدير نسخة احتياطية كاملة (JSON)، استعادة البيانات، تفعيل الجدولة التلقائية على Google Drive، وتصدير جداول النظام بصيغة Excel/CSV.
      </p>
    </div>

    <div class="card" style="border-right:4px solid var(--red);">
      <h3 style="margin-top:0;font-size:15px;color:var(--red-text);">تفريغ الكاش وإعادة التهيئة المحلية</h3>
      <p style="font-size:12px;color:var(--ink-secondary);margin-bottom:12px;">
        في حال واجهت أي تعليق في المتصفح، يمكنك تفريغ الذاكرة المؤقتة المحلية وإعادة تحميل أحدث نسخة من السحابة بأمان:
      </p>
      <button class="btn btn-ghost btn-sm" id="clearLocalCacheBtn" style="color:var(--red);">${getSvgIcon("trash", 13)} تفريغ الكاش وإعادة التحميل</button>
    </div>
  `;

  attachSettingsQuickTabEvents(main);

  const goToBackupBtn = document.getElementById('goToBackupTabBtn');
  if(goToBackupBtn){
    goToBackupBtn.onclick = ()=>{
      state.settingsTab = 'backup';
      const app = document.getElementById('app');
      if(state.currentSection === 'settings') renderSettingsSectionApp(app);
      else renderSettingsContent(main);
    };
  }

  const forceSyncBtn = document.getElementById('forceSyncBtn');
  if(forceSyncBtn){
    forceSyncBtn.onclick = async ()=>{
      await syncOfflineQueue(true);
      renderSyncSettings(main);
    };
  }

  const retryFailedBtn = document.getElementById('retryFailedQueueBtn');
  if(retryFailedBtn){
    retryFailedBtn.onclick = async ()=>{
      retryAllFailedQueueItems();
      renderSyncSettings(main);
    };
  }

  const exportAllBtn = document.getElementById('exportAllQueueBtn');
  if(exportAllBtn){
    exportAllBtn.onclick = ()=>{
      exportAllQueueItems();
    };
  }

  const clearQueueBtn = document.getElementById('clearQueueBtn');
  if(clearQueueBtn){
    clearQueueBtn.onclick = async ()=>{
      const ok = await openConfirmModal({
        title: 'تفريغ طابور المزامنة',
        message: 'هل ترغب في تفريغ طابور المزامنة المعلق؟ سيتم إزالة أي عمليات معلقة لم تُرفع للسحابة بعد.',
        confirmText: 'تفريغ الطابور',
        cancelText: 'إلغاء',
        confirmClass: 'btn-danger'
      });
      if(ok){
        clearOfflineSyncQueue();
        renderSyncSettings(main);
      }
    };
  }

  // Row-level action buttons
  main.querySelectorAll('.retry-single-btn').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      retrySingleQueueItem(id);
      renderSyncSettings(main);
    };
  });

  main.querySelectorAll('.export-single-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      exportSingleQueueItem(id);
    };
  });

  main.querySelectorAll('.delete-single-btn').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const ok = await openConfirmModal({
        title: 'حذف عملية من المزامنة',
        message: 'هل أنت متأكد من حذف هذه العملية من طابور المزامنة؟',
        confirmText: 'حذف',
        cancelText: 'إلغاء',
        confirmClass: 'btn-danger'
      });
      if(ok){
        deleteSingleQueueItem(id);
        renderSyncSettings(main);
      }
    };
  });

  document.getElementById('reloadCloudDataBtn').onclick = async ()=>{
    showToast('جاري جلب أحدث البيانات من السحابة...', 'info');
    try {
      [state.users, state.receipts, state.customers, state.technicians, state.settings, state.payments, state.inventory, state.sales, state.quotations, state.services, state.purchases, state.suppliers, state.expenses, state.accounts, state.journalEntries, state.invoices] = await Promise.all([
        loadUsers(), loadReceipts(), loadCustomers(), loadTechnicians(), loadSettings(), loadPayments(), loadInventory(), loadSales(), loadQuotations(), loadServices(), loadPurchases(), loadSuppliers(), loadExpenses(), loadAccounts(), loadJournalEntries(), loadInvoices()
      ]);
      showToast('تم تحديث البيانات من السحابة بنجاح', 'success');
      renderSyncSettings(main);
    } catch(e) {
      showToast('تعذر التحديث من السحابة: ' + e.message, 'error');
    }
  };

  const smartCleanBtn = document.getElementById('smartCleanCacheBtn');
  if(smartCleanBtn){
    smartCleanBtn.onclick = () => {
      const res = pruneNonEssentialCaches(true);
      showToast(`تم تنظيف الكاش بنجاح وحذف ${res.freedCount} عنصراً مؤقتاً وتحرير ${res.freedKB} كيلوبايت`, 'success');
      renderSyncSettings(main);
    };
  }

  const clearCacheBtn = document.getElementById('clearLocalCacheBtn');
  if(clearCacheBtn){
    clearCacheBtn.onclick = async () => {
      const q = getSyncQueue();
      let confirmMsg = 'هل تريد بالتأكيد تفريغ الذاكرة المؤقتة (الكاش) وإعادة التحميل من السحابة؟';
      if(q.length > 0){
        confirmMsg = `تنبيه أمان: يوجد ${q.length} عملية معلقة في طابور المزامنة لم تُرفع بعد إلى السحابة. سيتم الحفاظ عليها بأمان وحمايتها من المسح.<br><br>هل ترغب في متابعة تفريغ الكاش؟`;
      }
      const ok = await openConfirmModal({
        title: 'تفريغ الذاكرة المؤقتة (الكاش)',
        message: confirmMsg,
        confirmText: 'تفريغ الكاش وإعادة التحميل',
        cancelText: 'إلغاء',
        confirmClass: 'btn-warning'
      });
      if(ok){
        const res = typeof safePurgeLocalCache === 'function' ? safePurgeLocalCache() : { preservedQueueCount: q.length };
        showToast(`تم تفريغ الكاش بنجاح مع حماية ${res.preservedQueueCount} عملية معلقة، جاري إعادة التحميل...`, 'info');
        setTimeout(() => window.location.reload(), 700);
      }
    };
  }
}

/* 10. AI Settings (إعدادات وتكامل Google Gemini AI) */
function renderAiSettings(main){
  const cfg = getGeminiSettings();
  const hasKey = !!cfg.apiKey;

  main.innerHTML = `
    ${renderSettingsNavHeader('الذكاء الاصطناعي (Google Gemini)', 'تكامل نماذج الذكاء الاصطناعي لتشخيص الأعطال، واقتراح القياسات، وصياغة تقارير المقايسة')}

    <div class="card" style="border-right:4px solid #7c3aed;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="display:inline-flex;">${getSvgIcon('chart', 22)}</span>
          <h3 style="margin:0;font-size:16px;">إعدادات وتكامل Google Gemini API</h3>
        </div>
        <span class="status-badge ${hasKey ? 'st-done' : 'st-repair'}">
          ${hasKey ? 'تم ضبط المفتاح بنجاح' : 'غير مهيأ (بانتظار المفتاح)'}
        </span>
      </div>

      <p style="font-size:13px;color:var(--ink-secondary);line-height:1.6;margin-bottom:16px;">
        يدعم نظام ميكروتك ERP التكامل مع أحدث نماذج <b>Google Gemini</b> الرسمية. يُستخدم الذكاء الاصطناعي كمساعد وخبير تقني للفنيين لتشخيص الأعطال واقتراح المكونات البديلة ونقاط الفحص بالآفوميتر، وصياغة تقارير مقايسة التكلفة للعميل عبر واتساب.
      </p>

      <div style="display:grid;grid-template-columns:1fr;gap:14px;max-width:680px;">
        <!-- API Key Input -->
        <div class="field">
          <label style="font-weight:700;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
            <span>مفتاح Google Gemini API:</span>
            <a href="https://aistudio.google.com/apikey" target="_blank" style="font-size:11.5px;color:var(--primary);text-decoration:none;font-weight:600;">
              الحصول على مفتاح مجاني من Google AI Studio ↗
            </a>
          </label>
          <div style="display:flex;gap:6px;">
            <input type="password" id="geminiApiKeyInput" value="${escapeHtml(cfg.apiKey)}" placeholder="AIzaSy..." class="mono" style="flex:1;direction:ltr;font-size:13px;padding:8px 10px;">
            <button type="button" class="btn btn-ghost btn-sm" id="toggleApiKeyVisBtn" title="إظهار/إخفاء المفتاح">${getSvgIcon("eye", 13)}</button>
          </div>
          <div style="font-size:11.5px;color:var(--ink-secondary);margin-top:4px;">
            يتم حفظ المفتاح بأمان في المتصفح ومزامنته مع إعدادات النظام.
          </div>
        </div>

        <!-- Model Selector -->
        <div class="field">
          <label style="font-weight:700;">النموذج الافتراضي (Model):</label>
          <select id="geminiModelSelect" style="font-size:13px;padding:8px 10px;">
            <option value="gemini-3.5-flash" ${cfg.model==='gemini-3.5-flash'?'selected':''}>gemini-3.5-flash (الموصى به - متوازن وفائق الدقة في التشخيص)</option>
            <option value="gemini-3.5-flash-lite" ${cfg.model==='gemini-3.5-flash-lite'?'selected':''}>gemini-3.5-flash-lite (فائق السرعة وخفيف جداً - استجابة فورية)</option>
            <option value="gemini-3.8-flash" ${cfg.model==='gemini-3.8-flash'?'selected':''}>gemini-3.8-flash (النموذج التجريبي الأحدث)</option>
            <option value="gemini-3.1-pro-preview" ${cfg.model==='gemini-3.1-pro-preview'?'selected':''}>gemini-3.1-pro-preview (تفكير تحليلي عميق للمخططات والأعطال المعقدة)</option>
          </select>
          <div style="font-size:11.5px;color:var(--ink-secondary);margin-top:4px;">
            نماذج Google الرسمية المحدثة والمعتمدة.
          </div>
        </div>

        <!-- System Prompt Customization -->
        <div class="field">
          <label style="font-weight:700;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
            <span>التعليمات التوجيهية للنظام (System Instructions):</span>
            <button type="button" class="btn btn-xs btn-ghost" id="resetSystemPromptBtn" style="font-size:11px;">استعادة النص الافتراضي</button>
          </label>
          <textarea id="geminiSystemPromptInput" rows="3" style="font-size:12.5px;line-height:1.5;">${escapeHtml(cfg.systemInstruction)}</textarea>
          <div style="font-size:11px;color:var(--ink-secondary);margin-top:2px;">
            تحدد هوية وأسلوب الذكاء الاصطناعي وخبرته في إلكترونيات ميكروتك.
          </div>
        </div>

        <!-- Test Connection Result Box -->
        <div id="testConnResultBox" style="display:none;padding:10px 14px;border-radius:8px;font-size:12.5px;margin-top:4px;"></div>

        <!-- Action Buttons -->
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;">
          <button type="button" class="btn btn-primary" id="saveAiSettingsBtn" style="background:#7c3aed;border-color:#7c3aed;font-weight:700;padding:8px 20px;">
            ${getSvgIcon("check", 14)} حفظ إعدادات الذكاء الاصطناعي
          </button>
          <button type="button" class="btn btn-ghost" id="testAiConnBtn" style="font-weight:700;display:inline-flex;align-items:center;gap:6px;">
            <span>${getSvgIcon("refresh", 13)}</span> اختبار الاتصال الآن
          </button>
        </div>
      </div>
    </div>

    <!-- Quick Guide Card -->
    <div class="card" style="margin-top:16px;">
      <h3 style="margin:0 0 10px 0;font-size:15px;display:flex;align-items:center;gap:6px;">
        <span>${getSvgIcon("info", 13)}</span> كيف تحصل على مفتاح Google Gemini API مجاناً؟
      </h3>
      <ol style="font-size:13px;color:var(--ink-secondary);line-height:1.8;padding-right:20px;margin:0;">
        <li>قم بزيارة <a href="https://aistudio.google.com/apikey" target="_blank" style="color:var(--primary);font-weight:700;">Google AI Studio ↗</a> وسجل الدخول بحساب Google الخاص بك.</li>
        <li>انقر على زر <b>"Create API key"</b>.</li>
        <li>انسخ المفتاح الذي يظهر لك وضعه في حقل المفتاح أعلاه ثم اضغط <b>"اختبار الاتصال الآن"</b> ثم <b>"حفظ"</b>.</li>
        <li>حسابك يتضمن حصة مجانية كريمة من Google تكفي لآلاف عمليات الفحص الشهرية لمركز الصيانة.</li>
      </ol>
    </div>
  `;

  attachSettingsQuickTabEvents(main);

  const keyInput = document.getElementById('geminiApiKeyInput');
  const visBtn = document.getElementById('toggleApiKeyVisBtn');
  if(visBtn && keyInput){
    visBtn.onclick = () => {
      keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
    };
  }

  const resetPromptBtn = document.getElementById('resetSystemPromptBtn');
  if(resetPromptBtn){
    resetPromptBtn.onclick = () => {
      document.getElementById('geminiSystemPromptInput').value = DEFAULT_GEMINI_SETTINGS.systemInstruction;
    };
  }

  const testBtn = document.getElementById('testAiConnBtn');
  const resultBox = document.getElementById('testConnResultBox');
  if(testBtn){
    testBtn.onclick = async () => {
      const k = keyInput.value.trim();
      const m = document.getElementById('geminiModelSelect').value;
      testBtn.disabled = true;
      const origHtml = testBtn.innerHTML;
      testBtn.innerHTML = '<span>جاري الاختبار...</span>';
      resultBox.style.display = 'none';

      try {
        const res = await testGeminiConnection(k, m);
        resultBox.style.display = 'block';
        resultBox.style.background = 'rgba(16,185,129,0.1)';
        resultBox.style.border = '1px solid var(--green)';
        resultBox.style.color = '#047857';
        resultBox.innerHTML = `
          <div style="font-weight:700;display:flex;align-items:center;gap:6px;">${getSvgIcon("check", 14)} الاتصال ناجح ومستقر!</div>
          <div style="font-size:11.5px;margin-top:2px;">النموذج: <b>${res.model}</b> • زمن الاستجابة: <b>${res.latencyMs} مللي ثانية</b> • رد الذكاء: "${escapeHtml(res.reply)}"</div>
        `;
        showToast('تم التحقق من الاتصال بنجاح', 'success');
      } catch(err){
        resultBox.style.display = 'block';
        resultBox.style.background = 'rgba(239,68,68,0.1)';
        resultBox.style.border = '1px solid var(--red)';
        resultBox.style.color = '#b91c1c';
        resultBox.innerHTML = `
          <div style="font-weight:700;display:flex;align-items:center;gap:6px;">${getSvgIcon("alert", 14)} فشل الاتصال:</div>
          <div style="font-size:11.5px;margin-top:2px;">${escapeHtml(err.message || 'حدث خطأ في الاتصال')}</div>
        `;
        showToast('فشل اختبار الاتصال', 'error');
      } finally {
        testBtn.disabled = false;
        testBtn.innerHTML = origHtml;
      }
    };
  }

  const saveBtn = document.getElementById('saveAiSettingsBtn');
  if(saveBtn){
    saveBtn.onclick = async () => {
      const k = keyInput.value.trim();
      const m = document.getElementById('geminiModelSelect').value;
      const sys = document.getElementById('geminiSystemPromptInput').value.trim();

      const newSettings = {
        enabled: true,
        apiKey: k,
        model: m,
        temperature: 0.7,
        systemInstruction: sys || DEFAULT_GEMINI_SETTINGS.systemInstruction
      };

      if(!state.settings) state.settings = {};
      state.settings.gemini = newSettings;
      // S13: Do not store the plain API key in persistent localStorage cache
      const diskSafeSettings = JSON.parse(JSON.stringify(state.settings));
      if (diskSafeSettings.gemini && diskSafeSettings.gemini.apiKey) {
        delete diskSafeSettings.gemini.apiKey;
      }
      setCache('settings', diskSafeSettings);
      sessionStorage.setItem('microtech_gemini_api_key', k);
      try { localStorage.removeItem('microtech_gemini_api_key'); } catch(e){}

      saveBtn.disabled = true;
      saveBtn.textContent = 'جاري الحفظ...';

      try {
        await saveSettingRemote('gemini', JSON.stringify(newSettings));
        showToast('تم حفظ إعدادات الذكاء الاصطناعي بنجاح', 'success');
      } catch(err){
        showToast('تم الحفظ محلياً في المتصفح بنجاح', 'info');
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '${getSvgIcon("check", 14)} حفظ إعدادات الذكاء الاصطناعي';
        renderAiSettings(main);
      }
    };
  }
}

/* ============================================================
   Universal Barcode Label Studio (استوديو طباعة الباركود الشامل)
   ============================================================ */