function renderFinanceReportPage(main){
  if(!state.incomeReportPeriod){
    state.incomeReportPeriod = { mode: 'month', from: '', to: '' };
  }

  const periodInfo = getPeriodDates(state.incomeReportPeriod.mode, state.incomeReportPeriod.from, state.incomeReportPeriod.to);
  const data = getIncomeStatementData(periodInfo.from, periodInfo.to);

  main.innerHTML = `
    <div class="top-header">
      <div>
        <h2 class="page-title">${getSvgIcon("trendUp", 22)} قائمة الدخل والأرباح الحقيقية</h2>
        <div class="subtitle mono" style="font-size:12px;color:var(--primary);font-weight:700;">
          ${getSvgIcon("calendar", 12)} الفترة المحددة: ${periodInfo.label}
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <button class="btn btn-ghost btn-sm" id="exportIncomeExcelBtn">${getSvgIcon("download", 14)} تصدير CSV (Excel)</button>
        <button class="btn btn-primary btn-sm" id="printIncomeReportBtn">${getSvgIcon("printer", 14)} طباعة قائمة الدخل A4</button>
      </div>
    </div>

    <!-- Period Filter Toolbar -->
    <div class="card" style="padding:12px;margin-bottom:14px;background:var(--paper2);border:1.5px solid var(--line);">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          <span style="font-size:12px;font-weight:800;color:var(--ink-secondary);">الفترة:</span>
          ${[
            {id:'today', label:'اليوم'},
            {id:'week', label:'آخر 7 أيام'},
            {id:'month', label:'الشهر الحالي'},
            {id:'quarter', label:'الربع الحالي'},
            {id:'year', label:'العام الحالي'},
            {id:'all', label:'كافة الفترات'},
            {id:'custom', label:'مخصص'}
          ].map(p => `
            <button class="btn btn-xs ${state.incomeReportPeriod.mode===p.id?'btn-primary font-bold':'btn-ghost'}" data-incomemode="${p.id}">
              ${p.label}
            </button>
          `).join('')}
        </div>

        ${state.incomeReportPeriod.mode==='custom' ? `
          <div style="display:flex;align-items:center;gap:6px;">
            <label style="font-size:11px;font-weight:700;">من:</label>
            <input type="date" id="incomeCustomFrom" value="${state.incomeReportPeriod.from || ''}" style="padding:4px 8px;font-size:12px;border:1px solid #cbd5e1;border-radius:4px;">
            <label style="font-size:11px;font-weight:700;">إلى:</label>
            <input type="date" id="incomeCustomTo" value="${state.incomeReportPeriod.to || ''}" style="padding:4px 8px;font-size:12px;border:1px solid #cbd5e1;border-radius:4px;">
            <button class="btn btn-xs btn-blue" id="applyCustomIncomeBtn">تطبيق</button>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Ledger Verification Banner (F1) -->
    <div class="card" style="padding:12px 18px;margin-bottom:14px;border-radius:8px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;background:${data.isLedgerBalanced ? '#f0fdf4' : '#fef2f2'};border:1.5px solid ${data.isLedgerBalanced ? '#86efac' : '#fca5a5'};color:${data.isLedgerBalanced ? '#166534' : '#991b1b'};">
      <div style="display:flex;align-items:center;gap:10px;font-size:13.5px;font-weight:800;">
        <span>${data.isLedgerBalanced ? getSvgIcon("checkCircle", 18) : getSvgIcon("alertTriangle", 18)}</span>
        <span>مطابقة الدفتر: مجموع مدين القيود = <b class="mono font-bold">${data.totalJournalDebits.toLocaleString()} ج.م</b> · مجموع دائن القيود = <b class="mono font-bold">${data.totalJournalCredits.toLocaleString()} ج.م</b> · الفرق = <b class="mono font-bold">${data.ledgerImbalance.toLocaleString()} ج.م</b> ${data.isLedgerBalanced ? '(الدفتر متزن تماماً ومطابق للقيد المزدوج)' : '(تنبيه: يوجد عدم اتزان محاسبي في قيود الفترة!)'}</span>
      </div>
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="btn btn-xs ${data.isLedgerBalanced ? 'btn-ghost' : 'btn-red'}" id="reconcileLedgerBtn" title="إعادة مطابقة وترحيل كافة القيود التاريخية الناقصة لدفتر الأستاذ">
          ${getSvgIcon("sync", 13)} تحديث وترحيل قيود الدفتر
        </button>
      </div>
    </div>

    <!-- 6 Executive KPI Metric Cards -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(170px, 1fr));gap:12px;margin-bottom:16px;">
      <div class="card" style="padding:14px;margin:0;border-right:4px solid #0284c7;">
        <div style="font-size:11.5px;color:var(--ink-secondary);font-weight:700;">إجمالي الإيرادات</div>
        <div class="num mono font-bold" style="font-size:19px;margin-top:4px;color:#0284c7;">${data.totalRevenue.toLocaleString()} ج.م</div>
        <div style="font-size:10.5px;color:var(--ink-secondary);margin-top:2px;">حسابات الإيرادات (4)</div>
      </div>

      <div class="card" style="padding:14px;margin:0;border-right:4px solid #ea580c;">
        <div style="font-size:11.5px;color:var(--ink-secondary);font-weight:700;">تكلفة البضاعة والمبيعات (COGS)</div>
        <div class="num mono font-bold" style="font-size:19px;margin-top:4px;color:#ea580c;">${data.totalCOGS.toLocaleString()} ج.م</div>
        <div style="font-size:10.5px;color:var(--ink-secondary);margin-top:2px;">تكلفة النشاط والمبيعات (51)</div>
      </div>

      <div class="card" style="padding:14px;margin:0;border-right:4px solid #16a34a;">
        <div style="font-size:11.5px;color:var(--ink-secondary);font-weight:700;">مجمل الربح (Gross Profit)</div>
        <div class="num mono font-bold" style="font-size:19px;margin-top:4px;color:#16a34a;">${data.grossProfit.toLocaleString()} ج.م</div>
        <div style="font-size:10.5px;color:var(--green-text);font-weight:700;margin-top:2px;">هامش ربح: ${data.grossMargin.toFixed(1)}%</div>
      </div>

      <div class="card" style="padding:14px;margin:0;border-right:4px solid #dc2626;">
        <div style="font-size:11.5px;color:var(--ink-secondary);font-weight:700;">المصروفات التشغيلية</div>
        <div class="num mono font-bold" style="font-size:19px;margin-top:4px;color:#dc2626;">${data.totalOperatingExpenses.toLocaleString()} ج.م</div>
        <div style="font-size:10.5px;color:var(--ink-secondary);margin-top:2px;">المصروفات العمومية (52)</div>
      </div>

      <div class="card" style="padding:14px;margin:0;border-right:4px solid #7c3aed;">
        <div style="font-size:11.5px;color:var(--ink-secondary);font-weight:700;">صافي الربح الحقيقي (Net Profit)</div>
        <div class="num mono font-bold" style="font-size:20px;margin-top:4px;color:${data.netOperatingProfit>=0?'#7c3aed':'#dc2626'};">
          ${data.netOperatingProfit.toLocaleString()} ج.م
        </div>
        <div style="font-size:10.5px;color:var(--ink-secondary);margin-top:2px;">مطابق لميزان المراجعة</div>
      </div>

      <div class="card" style="padding:14px;margin:0;border-right:4px solid #0d9488;">
        <div style="font-size:11.5px;color:var(--ink-secondary);font-weight:700;">نسبة صافي الربح</div>
        <div class="num mono font-bold" style="font-size:20px;margin-top:4px;color:#0d9488;">${data.netMargin.toFixed(1)}%</div>
        <div style="font-size:10.5px;color:var(--ink-secondary);margin-top:2px;">من إجمالي إيرادات النشاط</div>
      </div>
    </div>

    <!-- Structured Income Statement Ledger -->
    <div class="card" style="padding:0;overflow:hidden;border:1px solid #cbd5e1;">
      <div style="background:#0f172a;color:#fff;padding:12px 18px;display:flex;justify-content:space-between;align-items:center;">
        <h3 style="margin:0;font-size:15px;font-weight:800;display:flex;align-items:center;gap:6px;">${getSvgIcon("fileText", 16)} هيكل قائمة الدخل المحاسبية المعتمدة من دفتر الأستاذ</h3>
        <span class="mono" style="font-size:12px;color:#94a3b8;">معايير المحاسبة والتقارير المالية الدولية</span>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tbody>
          <!-- 1. Revenues Section -->
          <tr style="background:#f8fafc;border-bottom:2px solid #cbd5e1;">
            <td colspan="2" style="padding:10px 16px;font-weight:900;color:#0284c7;font-size:14px;">
              ١. الإيرادات التشغيلية للنشاط (Operating Revenues)
            </td>
            <td style="padding:10px 16px;text-align:left;font-weight:900;color:#0284c7;" class="mono font-bold">
              ${data.totalRevenue.toLocaleString()} ج.م
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 24px;color:#334155;">إيرادات خدمات صيانة وتصليح الأجهزة (مصنعيات وقطع الأجهزة المسلمة)</td>
            <td style="padding:8px;color:#64748b;font-size:11.5px;">حساب 4101 (إحصاء: ${data.maintCount} أمر شغل)</td>
            <td style="padding:8px 16px;text-align:left;" class="mono">${data.rev4101.toLocaleString()} ج.م</td>
          </tr>
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 24px;color:#334155;">إيرادات مبيعات بضائع وإكسسوار ومتجر (نقطة البيع POS)</td>
            <td style="padding:8px;color:#64748b;font-size:11.5px;">حساب 4102 (إحصاء: ${data.posSalesCount} فاتورة بيع)</td>
            <td style="padding:8px 16px;text-align:left;" class="mono">${data.rev4102.toLocaleString()} ج.م</td>
          </tr>
          ${data.rev4103 > 0 ? `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:8px 24px;color:#334155;">إيرادات تركيب كاميرات وأنظمة وعقود مشاريع</td>
              <td style="padding:8px;color:#64748b;font-size:11.5px;">حساب 4103 (إحصاء: ${data.invoicesCount} فاتورة)</td>
              <td style="padding:8px 16px;text-align:left;" class="mono">${data.rev4103.toLocaleString()} ج.م</td>
            </tr>
          ` : ''}
          ${data.revOther4 > 0 ? `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:8px 24px;color:#334155;">إيرادات أخرى متنوعة</td>
              <td style="padding:8px;color:#64748b;font-size:11.5px;">حساب 42</td>
              <td style="padding:8px 16px;text-align:left;" class="mono">${data.revOther4.toLocaleString()} ج.م</td>
            </tr>
          ` : ''}

          <!-- 2. Cost of Sales Section -->
          <tr style="background:#f8fafc;border-top:2px solid #cbd5e1;border-bottom:2px solid #cbd5e1;">
            <td colspan="2" style="padding:10px 16px;font-weight:900;color:#ea580c;font-size:14px;">
              ٢. يطرح: تكلفة النشاط والمبيعات (Cost of Goods Sold - COGS)
            </td>
            <td style="padding:10px 16px;text-align:left;font-weight:900;color:#ea580c;" class="mono font-bold">
              (${data.totalCOGS.toLocaleString()}) ج.م
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 24px;color:#334155;">تكلفة البضاعة المباعة في نقطة البيع (سعر الشراء للأصناف المباعة)</td>
            <td style="padding:8px;color:#64748b;font-size:11.5px;">حساب 5102</td>
            <td style="padding:8px 16px;text-align:left;" class="mono font-bold" style="color:#ea580c;">(${data.cogs5102.toLocaleString()}) ج.م</td>
          </tr>
          <tr style="border-bottom:1px solid #f1f5f9;">
            <td style="padding:8px 24px;color:#334155;">تكلفة قطع الغيار المستهلكة في الصيانة (سعر الشراء من المخزن)</td>
            <td style="padding:8px;color:#64748b;font-size:11.5px;">حساب 5101</td>
            <td style="padding:8px 16px;text-align:left;" class="mono font-bold" style="color:#ea580c;">(${data.cogs5101.toLocaleString()}) ج.م</td>
          </tr>
          ${data.cogsOther51 > 0 ? `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:8px 24px;color:#334155;">تكاليف مبيعات ونشاط أخرى</td>
              <td style="padding:8px;color:#64748b;font-size:11.5px;">حساب 51</td>
              <td style="padding:8px 16px;text-align:left;" class="mono font-bold" style="color:#ea580c;">(${data.cogsOther51.toLocaleString()}) ج.م</td>
            </tr>
          ` : ''}

          <!-- 3. Gross Profit Summary Row -->
          <tr style="background:#ecfdf5;border-top:2.5px solid #86efac;border-bottom:2.5px solid #86efac;">
            <td style="padding:11px 16px;font-weight:900;color:#15803d;font-size:14.5px;">
              مجمل الربح التشغيلي (Gross Profit)
            </td>
            <td style="padding:11px;color:#166534;font-weight:800;font-size:12px;">
              نسبة هامش مجمل الربح: <span class="mono">${data.grossMargin.toFixed(1)}%</span>
            </td>
            <td style="padding:11px 16px;text-align:left;font-weight:900;font-size:16px;color:#15803d;" class="mono font-bold">
              ${data.grossProfit.toLocaleString()} ج.م
            </td>
          </tr>

          <!-- 4. Operating Expenses Section -->
          <tr style="background:#f8fafc;border-top:2px solid #cbd5e1;border-bottom:2px solid #cbd5e1;">
            <td colspan="2" style="padding:10px 16px;font-weight:900;color:#dc2626;font-size:14px;">
              ٣. يطرح: المصروفات التشغيلية والعمومية (Operating Expenses)
            </td>
            <td style="padding:10px 16px;text-align:left;font-weight:900;color:#dc2626;" class="mono font-bold">
              (${data.totalOperatingExpenses.toLocaleString()}) ج.م
            </td>
          </tr>
          ${Object.entries(data.expCategories).map(([cat, amt]) => {
            if(amt <= 0) return '';
            return `
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:7px 24px;color:#334155;">مصروفات: ${escapeHtml(cat)}</td>
                <td style="padding:7px;color:#64748b;font-size:11px;">تشغيلي (52)</td>
                <td style="padding:7px 16px;text-align:left;" class="mono">(${amt.toLocaleString()}) ج.م</td>
              </tr>
            `;
          }).join('')}

          <!-- 5. Net Profit Summary Row -->
          <tr style="background:${data.netOperatingProfit>=0?'#f5f3ff':'#fef2f2'};border-top:3px solid ${data.netOperatingProfit>=0?'#c084fc':'#fca5a5'};">
            <td style="padding:14px 16px;font-weight:900;font-size:16px;color:${data.netOperatingProfit>=0?'#6b21a8':'#991b1b'};">
              صافي الربح الحقيقي للفترة (Net Profit)
            </td>
            <td style="padding:14px;font-weight:800;font-size:13px;color:${data.netOperatingProfit>=0?'#6b21a8':'#991b1b'};">
              نسبة صافي الربح: <span class="mono">${data.netMargin.toFixed(1)}%</span>
            </td>
            <td style="padding:14px 16px;text-align:left;font-weight:900;font-size:18px;color:${data.netOperatingProfit>=0?'#6b21a8':'#991b1b'};" class="mono font-bold">
              ${data.netOperatingProfit.toLocaleString()} ج.م
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Statistical Operational Metrics Card (F1) -->
    <div class="card" style="padding:14px 18px;margin-top:16px;background:var(--paper2);border:1.5px dashed var(--line);">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <h4 style="margin:0;font-size:13px;font-weight:800;color:var(--ink-secondary);display:flex;align-items:center;gap:6px;">
          ${getSvgIcon("info", 15)} بيانات إحصائية تشغيلية للفترة (ليست الأساس المحاسبي — للعلم والاسترشاد)
        </h4>
        <span class="badge" style="font-size:10.5px;background:#e2e8f0;color:#475569;">إحصاء تشغيلي</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;font-size:12px;">
        <div style="background:var(--paper);padding:10px;border-radius:6px;border:1px solid var(--line);">
          <div style="color:var(--ink-secondary);font-size:11px;">أوامر شغل الصيانة</div>
          <div class="mono font-bold" style="font-size:15px;margin-top:2px;">${data.maintCount} أمر (${data.maintDeliveredCount} مسلم)</div>
        </div>
        <div style="background:var(--paper);padding:10px;border-radius:6px;border:1px solid var(--line);">
          <div style="color:var(--ink-secondary);font-size:11px;">فواتير مبيعات POS</div>
          <div class="mono font-bold" style="font-size:15px;margin-top:2px;">${data.posSalesCount} فاتورة (${data.posReturnsCount} مرتجع)</div>
        </div>
        <div style="background:var(--paper);padding:10px;border-radius:6px;border:1px solid var(--line);">
          <div style="color:var(--ink-secondary);font-size:11px;">فواتير وعقود الخدمات</div>
          <div class="mono font-bold" style="font-size:15px;margin-top:2px;">${data.invoicesCount} فاتورة</div>
        </div>
        <div style="background:var(--paper);padding:10px;border-radius:6px;border:1px solid var(--line);">
          <div style="color:var(--ink-secondary);font-size:11px;">إجمالي قيود اليومية بالفترة</div>
          <div class="mono font-bold" style="font-size:15px;margin-top:2px;color:var(--primary);">${data.journalEntriesCount} قيد محاسبي</div>
        </div>
      </div>
      <div style="margin-top:8px;font-size:11px;color:var(--ink-secondary);line-height:1.6;">
        ملاحظة: كافة أرقام الإيرادات وتكلفة البضاعة المباعة والمصروفات وصافي الربح في هذا التقرير مستخرجة بالكامل ومطابقة 100% مع واقع قيود دفتر الأستاذ العام (General Ledger) المعتمد محاسبياً.
      </div>
    </div>
  `;

  // Attach Period Button Handlers
  main.querySelectorAll('[data-incomemode]').forEach(btn => {
    btn.onclick = () => {
      state.incomeReportPeriod.mode = btn.dataset.incomemode;
      renderFinanceReportPage(main);
    };
  });

  const applyCustomBtn = main.querySelector('#applyCustomIncomeBtn');
  if(applyCustomBtn){
    applyCustomBtn.onclick = () => {
      const fromVal = main.querySelector('#incomeCustomFrom').value;
      const toVal = main.querySelector('#incomeCustomTo').value;
      if(!fromVal || !toVal){
        showToast('يرجى تحديد تاريخي البداية والنهاية', 'error');
        return;
      }
      state.incomeReportPeriod.from = fromVal;
      state.incomeReportPeriod.to = toVal;
      renderFinanceReportPage(main);
    };
  }

  // Reconcile Ledger Button Handler
  const recLedgerBtn = main.querySelector('#reconcileLedgerBtn');
  if(recLedgerBtn){
    recLedgerBtn.onclick = () => {
      if(typeof reconcileHistoricalJournalEntries === 'function') reconcileHistoricalJournalEntries();
      showToast('تم فحص وتحديث قيود دفتر الأستاذ العام بنجاح', 'success');
      renderFinanceReportPage(main);
    };
  }

  // Print & Export Handlers
  const printBtn = main.querySelector('#printIncomeReportBtn');
  if(printBtn) printBtn.onclick = () => openPrintIncomeStatement(data, periodInfo);
  const expBtn = main.querySelector('#exportIncomeExcelBtn');
  if(expBtn) expBtn.onclick = () => exportIncomeStatementToExcel(data, periodInfo);
}

function openPrintIncomeStatement(data, periodInfo){
  const mount = document.createElement('div');
  mount.id = 'printIncomeStatementMount';
  mount.className = 'print-mount-a4';
  const companyName = (state.settings && state.settings.companyName) || 'ميكروERP';

  mount.innerHTML = `
    <style>
      @media print {
        body * { visibility: hidden !important; }
        #printIncomeStatementMount, #printIncomeStatementMount * { visibility: visible !important; }
        #printIncomeStatementMount {
          position: fixed; left: 0; top: 0; width: 100%; height: auto;
          background: #fff; padding: 24px; font-family: system-ui, -apple-system, sans-serif;
          color: #000; direction: rtl; z-index: 999999;
        }
        .page-break { page-break-after: always; }
      }
    </style>
    <div style="max-width:800px;margin:0 auto;padding:20px;border:1px solid #cbd5e1;border-radius:8px;">
      <!-- Report Header -->
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0f172a;padding-bottom:12px;margin-bottom:16px;">
        <div>
          <h2 style="margin:0;font-size:20px;font-weight:900;color:#0f172a;">${escapeHtml(companyName)}</h2>
          <div style="font-size:12px;color:#475569;margin-top:3px;">نظام إدارة العمليات والتقارير المالية</div>
        </div>
        <div style="text-align:left;">
          <div style="background:#0f172a;color:#fff;font-size:13px;font-weight:900;padding:4px 14px;border-radius:4px;display:inline-block;">
            قائمة الدخل والأرباح الرسمية
          </div>
          <div style="font-size:11px;color:#64748b;margin-top:4px;">تاريخ الطباعة: <b>${new Date().toISOString().slice(0,10)}</b></div>
        </div>
      </div>

      <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:10px 14px;border-radius:6px;margin-bottom:16px;font-size:12px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
        <span><b>الفترة المحاسبية:</b> ${escapeHtml(periodInfo.label)}</span>
        <span><b>حالة الدفتر:</b> ${data.isLedgerBalanced ? 'متزن ومطابق' : 'يوجد فرق: ' + data.ledgerImbalance + ' ج.م'}</span>
        <span>المسؤول: <b>${escapeHtml(state.user?.name || 'الإدارة')}</b></span>
      </div>

      <!-- Financial Table -->
      <table style="width:100%;border-collapse:collapse;font-size:12.5px;margin-bottom:16px;">
        <thead>
          <tr style="background:#0f172a;color:#fff;">
            <th style="padding:8px 12px;text-align:right;">البند المالي / التصنيف المحاسبي</th>
            <th style="padding:8px 12px;text-align:center;">رقم الحساب</th>
            <th style="padding:8px 12px;text-align:left;width:140px;">القيمة</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background:#f1f5f9;font-weight:bold;">
            <td colspan="2" style="padding:8px 12px;color:#0284c7;">١. إجمالي الإيرادات التشغيلية</td>
            <td style="padding:8px 12px;text-align:left;color:#0284c7;">${data.totalRevenue.toLocaleString()} ج.م</td>
          </tr>
          <tr><td style="padding:6px 20px;">• إيرادات الصيانة والتصليح (مصنعيات وقطع)</td><td style="text-align:center;">4101</td><td style="padding:6px 12px;text-align:left;">${data.rev4101.toLocaleString()} ج.م</td></tr>
          <tr><td style="padding:6px 20px;">• إيرادات مبيعات البضائع والإكسسوار (POS)</td><td style="text-align:center;">4102</td><td style="padding:6px 12px;text-align:left;">${data.rev4102.toLocaleString()} ج.م</td></tr>
          ${data.rev4103 > 0 ? `<tr><td style="padding:6px 20px;">• إيرادات عقود وتركيب كاميرات ومشاريع</td><td style="text-align:center;">4103</td><td style="padding:6px 12px;text-align:left;">${data.rev4103.toLocaleString()} ج.م</td></tr>` : ''}
          ${data.revOther4 > 0 ? `<tr><td style="padding:6px 20px;">• إيرادات أخرى متنوعة</td><td style="text-align:center;">42</td><td style="padding:6px 12px;text-align:left;">${data.revOther4.toLocaleString()} ج.م</td></tr>` : ''}

          <tr style="background:#f1f5f9;font-weight:bold;">
            <td colspan="2" style="padding:8px 12px;color:#ea580c;">٢. يطرح: تكلفة النشاط والمبيعات (COGS)</td>
            <td style="padding:8px 12px;text-align:left;color:#ea580c;">(${data.totalCOGS.toLocaleString()}) ج.م</td>
          </tr>
          <tr><td style="padding:6px 20px;">• تكلفة البضاعة المباعة بالمحل (POS)</td><td style="text-align:center;">5102</td><td style="padding:6px 12px;text-align:left;">(${data.cogs5102.toLocaleString()}) ج.م</td></tr>
          <tr><td style="padding:6px 20px;">• تكلفة قطع الغيار المستخدمة بالصيانة</td><td style="text-align:center;">5101</td><td style="padding:6px 12px;text-align:left;">(${data.cogs5101.toLocaleString()}) ج.م</td></tr>
          ${data.cogsOther51 > 0 ? `<tr><td style="padding:6px 20px;">• تكاليف نشاط ومبيعات أخرى</td><td style="text-align:center;">51</td><td style="padding:6px 12px;text-align:left;">(${data.cogsOther51.toLocaleString()}) ج.م</td></tr>` : ''}

          <tr style="background:#ecfdf5;font-weight:900;border-top:1.5px solid #86efac;border-bottom:1.5px solid #86efac;">
            <td style="padding:10px 12px;color:#15803d;">مجمل الربح (Gross Profit)</td>
            <td style="text-align:center;color:#15803d;">هامش: ${data.grossMargin.toFixed(1)}%</td>
            <td style="padding:10px 12px;text-align:left;color:#15803d;">${data.grossProfit.toLocaleString()} ج.م</td>
          </tr>

          <tr style="background:#f1f5f9;font-weight:bold;">
            <td colspan="2" style="padding:8px 12px;color:#dc2626;">٣. يطرح: المصروفات التشغيلية والعمومية</td>
            <td style="padding:8px 12px;text-align:left;color:#dc2626;">(${data.totalOperatingExpenses.toLocaleString()}) ج.م</td>
          </tr>
          ${Object.entries(data.expCategories).map(([c, a]) => a > 0 ? `
            <tr><td style="padding:5px 20px;">• ${escapeHtml(c)}</td><td style="text-align:center;">52</td><td style="padding:5px 12px;text-align:left;">(${a.toLocaleString()}) ج.م</td></tr>
          ` : '').join('')}

          <tr style="background:#f5f3ff;font-weight:900;border-top:2px solid #a855f7;border-bottom:2px solid #a855f7;font-size:14px;">
            <td style="padding:12px;color:#6b21a8;">صافي الربح الفعلي النهائي (Net Profit)</td>
            <td style="text-align:center;color:#6b21a8;">هامش صافي: ${data.netMargin.toFixed(1)}%</td>
            <td style="padding:12px;text-align:left;color:#6b21a8;">${data.netOperatingProfit.toLocaleString()} ج.م</td>
          </tr>
        </tbody>
      </table>

      <!-- Signatures -->
      <div style="display:flex;justify-content:space-between;margin-top:30px;padding-top:14px;border-top:1px dashed #cbd5e1;font-size:11.5px;color:#475569;">
        <div style="text-align:center;width:40%;">
          <div>إعداد وتدقيق المحاسب</div>
          <div style="margin-top:32px;border-bottom:1px dashed #94a3b8;width:80%;margin-left:auto;margin-right:auto;"></div>
        </div>
        <div style="text-align:center;width:40%;">
          <div>اعتماد الإدارة العامة</div>
          <div style="margin-top:32px;border-bottom:1px dashed #94a3b8;width:80%;margin-left:auto;margin-right:auto;"></div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(mount);
  setTimeout(()=>{
    window.print();
    setTimeout(()=>{ mount.remove(); }, 1000);
  }, 100);
}

function exportIncomeStatementToExcel(data, periodInfo){
  const headers = ['التصنيف المحاسبي', 'رقم الحساب', 'البند التفصيلي', 'القيمة بالجنيه'];
  const rows = [
    ['الإيرادات', '4101', 'إيرادات خدمات صيانة وتصليح الأجهزة', data.rev4101],
    ['الإيرادات', '4102', 'إيرادات مبيعات متجر وبضائع (POS)', data.rev4102],
    ...(data.rev4103 > 0 ? [['الإيرادات', '4103', 'إيرادات تركيب كاميرات وأنظمة ومشاريع', data.rev4103]] : []),
    ...(data.revOther4 > 0 ? [['الإيرادات', '42', 'إيرادات أخرى متنوعة', data.revOther4]] : []),
    ['الإيرادات', '4', 'إجمالي الإيرادات التشغيلية', data.totalRevenue],
    ['تكلفة المبيعات', '5102', 'تكلفة البضاعة المباعة في POS', -data.cogs5102],
    ['تكلفة المبيعات', '5101', 'تكلفة قطع الغيار المستخدمة بالصيانة', -data.cogs5101],
    ...(data.cogsOther51 > 0 ? [['تكلفة المبيعات', '51', 'تكاليف نشاط ومبيعات أخرى', -data.cogsOther51]] : []),
    ['تكلفة المبيعات', '51', 'إجمالي تكلفة المبيعات (COGS)', -data.totalCOGS],
    ['الربحية', '-', 'مجمل الربح التشغيلي (Gross Profit)', data.grossProfit],
    ['الربحية', '-', 'نسبة هامش مجمل الربح %', data.grossMargin.toFixed(1) + '%'],
    ...Object.entries(data.expCategories).filter(([_, a]) => a > 0).map(([c, a]) => ['المصروفات التشغيلية', '52', c, -a]),
    ['المصروفات التشغيلية', '52', 'إجمالي المصروفات التشغيلية', -data.totalOperatingExpenses],
    ['الربحية', '-', 'صافي الربح الفعلي النهائي (Net Profit)', data.netOperatingProfit],
    ['الربحية', '-', 'نسبة صافي الربح النهائي %', data.netMargin.toFixed(1) + '%'],
    ['مطابقة الدفتر', '-', 'مجموع مدين القيود', data.totalJournalDebits],
    ['مطابقة الدفتر', '-', 'مجموع دائن القيود', data.totalJournalCredits],
    ['مطابقة الدفتر', '-', 'فرق التوازن', data.ledgerImbalance]
  ];
  downloadCSV(`Income_Statement_${new Date().toISOString().slice(0,10)}.csv`, headers, rows);
}
