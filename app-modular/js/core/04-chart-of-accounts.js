/* ---------------- Chart of Accounts & General Ledger ---------------- */
const DEFAULT_ACCOUNTS = [
  // 1 - الأصول
  {Code:'1', Name:'الأصول', Type:'الأصول', ParentCode:'', Nature:'مدين', Description:'مجموع الأصول والموجودات', Balance:0},
  {Code:'11', Name:'الأصول المتداولة', Type:'الأصول', ParentCode:'1', Nature:'مدين', Description:'الأصول السائلة والقصيرة الأجل', Balance:0},
  {Code:'1101', Name:'الخزينة الرئيسية (النقدية)', Type:'الأصول', ParentCode:'11', Nature:'مدين', Description:'النقدية الحاضرة بالدرج', Balance:0},
  {Code:'1102', Name:'البنك والحسابات الإلكترونية', Type:'الأصول', ParentCode:'11', Nature:'مدين', Description:'حسابات البنوك وفودافون كاش وإنستاباي', Balance:0},
  {Code:'1103', Name:'العملاء والمدينون', Type:'الأصول', ParentCode:'11', Nature:'مدين', Description:'مستحقات على العملاء', Balance:0},
  {Code:'1104', Name:'مخزون البضائع وقطع الغيار', Type:'الأصول', ParentCode:'11', Nature:'مدين', Description:'قيمة البضائع وقطع الغيار بالمخزن', Balance:0},
  {Code:'1105', Name:'ضريبة القيمة المضافة القابلة للخصم (مدخلات)', Type:'الأصول', ParentCode:'11', Nature:'مدين', Description:'الضريبة المسددة على المشتريات والمصروفات', Balance:0},
  {Code:'12', Name:'الأصول الثابتة', Type:'الأصول', ParentCode:'1', Nature:'مدين', Description:'الممتلكات والمعدات', Balance:0},
  {Code:'1201', Name:'أجهزة ومعدات مركز الصيانة', Type:'الأصول', ParentCode:'12', Nature:'مدين', Description:'كاوية، هوت إير، باور سبلاي، ميكروسكوب...', Balance:0},
  {Code:'1202', Name:'ديكورات وتجهيزات المحل', Type:'الأصول', ParentCode:'12', Nature:'مدين', Description:'أرفف، لافتات، أثاث', Balance:0},

  // 2 - الخصوم
  {Code:'2', Name:'الخصوم والالتزامات', Type:'الخصوم', ParentCode:'', Nature:'دائن', Description:'التزامات المنشأة تجاه الغير', Balance:0},
  {Code:'21', Name:'الخصوم المتداولة', Type:'الخصوم', ParentCode:'2', Nature:'دائن', Description:'التزامات قصيرة الأجل', Balance:0},
  {Code:'2101', Name:'الموردون والدائنون', Type:'الخصوم', ParentCode:'21', Nature:'دائن', Description:'حسابات الموردين وفواتير الآجل', Balance:0},
  {Code:'2102', Name:'أمانات ومقدمات عملاء الصيانة', Type:'الخصوم', ParentCode:'21', Nature:'دائن', Description:'الدفعات المقدمة المستلمة قبل التسليم', Balance:0},
  {Code:'2103', Name:'مصروفات مستحقة', Type:'الخصوم', ParentCode:'21', Nature:'دائن', Description:'مستحقات لم تسدد بعد', Balance:0},
  {Code:'2104', Name:'ضريبة القيمة المضافة المستحقة (مخرجات)', Type:'الخصوم', ParentCode:'21', Nature:'دائن', Description:'الضريبة المحصلة من العملاء على المبيعات والفواتير', Balance:0},
  {Code:'2105', Name:'عهدة وأمانات مسؤولي الورديات', Type:'الخصوم', ParentCode:'21', Nature:'دائن', Description:'عهدة البداية وأمانات الكاشير للورديات', Balance:0},

  // 3 - حقوق الملكية
  {Code:'3', Name:'حقوق الملكية', Type:'حقوق الملكية', ParentCode:'', Nature:'دائن', Description:'حقوق أصحاب المنشأة', Balance:0},
  {Code:'31', Name:'رأس المال والاحتياطيات', Type:'حقوق الملكية', ParentCode:'3', Nature:'دائن', Description:'رأس المال المستثمر', Balance:0},
  {Code:'3101', Name:'رأس المال', Type:'حقوق الملكية', ParentCode:'31', Nature:'دائن', Description:'رأس مال البداية', Balance:0},
  {Code:'3102', Name:'الأرباح والخسائر المرحلة', Type:'حقوق الملكية', ParentCode:'31', Nature:'دائن', Description:'أرباح الأعوام والفترات السابقة', Balance:0},
  {Code:'3103', Name:'جاري الشركاء والمسحوبات', Type:'حقوق الملكية', ParentCode:'31', Nature:'دائن', Description:'المسحوبات الشخصية للشركاء', Balance:0},
  {Code:'3104', Name:'أرصدة افتتاحية معلقة وتسوية البداية', Type:'حقوق الملكية', ParentCode:'31', Nature:'دائن', Description:'حساب وسيط لتسوية الفروق وموازنة القيد الافتتاحي', Balance:0},

  // 4 - الإيرادات
  {Code:'4', Name:'الإيرادات', Type:'الإيرادات', ParentCode:'', Nature:'دائن', Description:'عوائد النشاط والمبيعات', Balance:0},
  {Code:'41', Name:'إيرادات النشاط الرئيسي', Type:'الإيرادات', ParentCode:'4', Nature:'دائن', Description:'إيرادات العمليات التشغيلية', Balance:0},
  {Code:'4101', Name:'إيرادات خدمات صيانة وتصليح', Type:'الإيرادات', ParentCode:'41', Nature:'دائن', Description:'مصنعيات وأجور صيانة الأجهزة', Balance:0},
  {Code:'4102', Name:'إيرادات مبيعات بضائع وقطع غيار', Type:'الإيرادات', ParentCode:'41', Nature:'دائن', Description:'مبيعات المتجر ونقطة البيع', Balance:0},
  {Code:'4103', Name:'إيرادات تركيب كاميرات وأنظمة', Type:'الإيرادات', ParentCode:'41', Nature:'دائن', Description:'عقود وخدمات تركيب الكاميرات', Balance:0},
  {Code:'42', Name:'إيرادات أخرى متنوعة', Type:'الإيرادات', ParentCode:'4', Nature:'دائن', Description:'إيرادات غير تشغيلية وأرباح بيع أصول', Balance:0},

  // 5 - المصروفات
  {Code:'5', Name:'المصروفات', Type:'المصروفات', ParentCode:'', Nature:'مدين', Description:'تكاليف ونفقات النشاط', Balance:0},
  {Code:'51', Name:'تكلفة النشاط والمبيعات', Type:'المصروفات', ParentCode:'5', Nature:'مدين', Description:'تكلفة البضاعة المباعة وقطع الغيار', Balance:0},
  {Code:'5101', Name:'تكلفة قطع الغيار المستخدمة بالصيانة', Type:'المصروفات', ParentCode:'51', Nature:'مدين', Description:'تكلفة القطع المسحوبة للأجهزة', Balance:0},
  {Code:'5102', Name:'تكلفة البضاعة المباعة (POS)', Type:'المصروفات', ParentCode:'51', Nature:'مدين', Description:'سعر تكلفة الأصناف المباعة', Balance:0},
  {Code:'52', Name:'المصروفات التشغيلية والعمومية', Type:'المصروفات', ParentCode:'5', Nature:'مدين', Description:'مصاريف إدارة وتشغيل مركز الصيانة', Balance:0},
  {Code:'5201', Name:'إيجار المقر ومركز الصيانة', Type:'المصروفات', ParentCode:'52', Nature:'مدين', Description:'إيجار المحل أو مركز الصيانة', Balance:0},
  {Code:'5202', Name:'الكهرباء والمياه والإنترنت والمرافق', Type:'المصروفات', ParentCode:'52', Nature:'مدين', Description:'فواتير المرافق الشهرية', Balance:0},
  {Code:'5203', Name:'رواتب ومكافآت الفنيين والموظفين', Type:'المصروفات', ParentCode:'52', Nature:'مدين', Description:'الأجور والمكافآت', Balance:0},
  {Code:'5204', Name:'بوفيه ونثريات وضيافة', Type:'المصروفات', ParentCode:'52', Nature:'مدين', Description:'مشروبات ومستلزمات يومية', Balance:0},
  {Code:'5205', Name:'دعاية وإعلان وتسويق', Type:'المصروفات', ParentCode:'52', Nature:'مدين', Description:'إعلانات ممولة ومطبوعات', Balance:0},
  {Code:'5206', Name:'أدوات ومستهلكات مركز الصيانة', Type:'المصروفات', ParentCode:'52', Nature:'مدين', Description:'قصدير، فلكس، أسلاك، شيلد، مفكات...', Balance:0},
  {Code:'5207', Name:'شحن وتوصيل ونقليات', Type:'المصروفات', ParentCode:'52', Nature:'مدين', Description:'مصاريف الشحن والمواصلات', Balance:0},
  {Code:'5208', Name:'مصروفات تشغيلية أخرى وفروق الدرج', Type:'المصروفات', ParentCode:'52', Nature:'مدين', Description:'مصروفات متنوعة ونثريات وفروق الدرج', Balance:0},
  {Code:'5209', Name:'عجز وفروق الجرد المخزني', Type:'المصروفات', ParentCode:'52', Nature:'مدين', Description:'فروق وعجز الجرد الدوري للمخزن', Balance:0},
  {Code:'4201', Name:'إيرادات وأرباح متنوعة وزيادة الجرد', Type:'الإيرادات', ParentCode:'42', Nature:'دائن', Description:'إيرادات وأرباح متنوعة وفائض الجرد المخزني', Balance:0}
];

const EXPENSE_ACCOUNT_MAP = {
  'إيجار': '5201',
  'كهرباء ومياه': '5202',
  'رواتب وسلفيات': '5203',
  'رواتب': '5203',
  'سلفيات': '5203',
  'بوفيه ونثريات': '5204',
  'نثريات': '5204',
  'بوفيه': '5204',
  'ضيافة': '5204',
  'دعاية وإعلانات': '5205',
  'تسويق': '5205',
  'أدوات وصيانة مقر': '5206',
  'أدوات ومستهلكات': '5206',
  'شحن وتوصيل': '5207',
  'مصروفات أخرى': '5208',
  'عجز جرد مخزني': '5209',
  'فروق جرد': '5209',
  'مسحوبات شخصية': '3103',
  'جاري الشركاء': '3103',
  'سداد موردين ومشتريات': '2101',
  'سداد موردين': '2101'
};

async function loadAccounts(){
  const rows = await apiGet('getAccounts');
  const finalAccounts = (Array.isArray(rows) && rows.length) ? rows : DEFAULT_ACCOUNTS;
  state.accounts = finalAccounts;
  setCache('accounts', finalAccounts);
  if(typeof invalidateAccountStatsCache === 'function') invalidateAccountStatsCache();
  return finalAccounts;
}
async function saveAccountRemote(acc){
  const idx = state.accounts.findIndex(x=>String(x.Code)===String(acc.Code));
  if(idx>-1) state.accounts[idx] = acc; else state.accounts.push(acc);
  setCache('accounts', state.accounts);
  if(typeof invalidateAccountStatsCache === 'function') invalidateAccountStatsCache();
  return apiPost('saveAccount', {data:acc});
}
async function deleteAccountRemote(code){
  state.accounts = state.accounts.filter(x=>String(x.Code)!==String(code));
  setCache('accounts', state.accounts);
  if(typeof invalidateAccountStatsCache === 'function') invalidateAccountStatsCache();
  return apiPost('deleteAccount', {code, role: state.user.role});
}

function getNextJournalEntryNumber(){
  const list = state.journalEntries || [];
  const y = new Date().getFullYear();
  const prefix = `JE-${y}-`;
  let maxNum = 0;
  list.forEach(e => {
    if (e.EntryNumber && String(e.EntryNumber).startsWith(prefix)) {
      const n = parseInt(String(e.EntryNumber).replace(prefix, ''), 10);
      if (!isNaN(n) && n > maxNum) maxNum = n;
    }
  });
  return `${prefix}${String(maxNum + 1).padStart(5, '0')}`;
}

function reconcileHistoricalJournalEntries(){
  if (!state.journalEntries) state.journalEntries = [];
  const existingRefs = new Set((state.journalEntries || []).map(e => `${e.ReferenceType}_${e.ReferenceID}`));
  const newEntries = [];

  // 1. Reconcile Payments (F2: Route to 2102 deposit or 1103 debt settlement - never 4101)
  (state.payments || []).forEach(p => {
    const payId = p.ID || `p_${p.ReceiptID}_${p.Amount}_${p.Date}`;
    const refKey = `Receipt_Payment_${payId}`;
    const legacyKey = `Receipt_${p.ReceiptID || p.ID}`;
    if (!existingRefs.has(refKey) && !existingRefs.has(legacyKey)) {
      const numAmt = Number(p.Amount || 0);
      if (numAmt > 0) {
        const r = (state.receipts || []).find(x => String(x.id) === String(p.ReceiptID) || String(x.receiptNumber) === String(p.ReceiptID));
        const isDelivered = r && (r.status === 'تم التسليم' || r.status === 'delivered');

        const payMethod = p.PaymentMethod || 'نقدي (كاش)';
        const pLow = String(payMethod).toLowerCase();
        const isBank = pLow.includes('فيزا') || pLow.includes('انستاباي') || pLow.includes('محفظ') || pLow.includes('فودافون') || pLow.includes('card');
        const debitCode = isBank ? '1102' : '1101';
        const debitName = isBank ? 'البنك والحسابات الإلكترونية' : 'الخزينة الرئيسية (النقدية)';

        const creditCode = isDelivered ? '1103' : '2102';
        const creditName = isDelivered ? 'العملاء والمدينون' : 'أمانات ومقدمات عملاء الصيانة';
        const desc = isDelivered 
          ? `تحصيل مديونية صيانة [${payMethod}] (${p.Note || 'سداد متبقي'})`
          : `تحصيل دفعة مقدمة صيانة [${payMethod}] (${p.Note || 'مقدم صيانة'})`;

        const entry = {
          ID: 'je_hist_p_' + payId,
          EntryNumber: getNextJournalEntryNumber(),
          Date: (p.Date || new Date().toISOString()).slice(0, 10),
          Description: desc,
          ReferenceType: 'Receipt_Payment',
          ReferenceID: payId,
          Lines: [
            { AccountCode: debitCode, AccountName: debitName, Debit: numAmt, Credit: 0, Notes: `تحصيل عبر ${payMethod}` },
            { AccountCode: creditCode, AccountName: creditName, Debit: 0, Credit: numAmt, Notes: isDelivered ? `سداد مديونية إيصال #${p.ReceiptID}` : `مقدم صيانة إيصال #${p.ReceiptID}` }
          ],
          TotalDebit: numAmt,
          TotalCredit: numAmt,
          By: p.By || 'نظام'
        };
        entry.LinesJSON = JSON.stringify(entry.Lines);
        newEntries.push(entry);
        state.journalEntries.push(entry);
        existingRefs.add(refKey);
      }
    }
  });

  // 2. Reconcile POS Sales
  (state.sales || []).forEach(s => {
    const refKey = `Sale_${s.ID}`;
    if (!existingRefs.has(refKey)) {
      const total = Number(s.Total || 0);
      const rawPaid = Number(s.AmountPaid != null ? s.AmountPaid : total);
      const change = Number(s.ChangeDue != null ? s.ChangeDue : (rawPaid > total ? rawPaid - total : 0));
      const paid = Math.min(total, Math.max(0, round2(rawPaid - change)));
      if (total > 0) {
        const lines = [];
        if (paid > 0) {
          lines.push({ AccountCode: '1101', AccountName: 'الخزينة الرئيسية (النقدية)', Debit: paid, Credit: 0, Notes: `مقبوضات مبيعات POS` });
        }
        if (total > paid) {
          lines.push({ AccountCode: '1103', AccountName: 'العملاء والمدينون', Debit: round2(total - paid), Credit: 0, Notes: `آجل مبيعات POS للعميل ${s.CustomerName || ''}` });
        }
        const taxAmt = Math.max(0, Number(s.TaxAmount || 0));
        const netRevenue = Math.max(0, Math.round((total - taxAmt) * 100) / 100);
        lines.push({ AccountCode: '4102', AccountName: 'إيرادات مبيعات بضائع وقطع غيار', Debit: 0, Credit: netRevenue, Notes: `فاتورة مبيعات #${s.ID.slice(-8)}` });
        if (taxAmt > 0) {
          lines.push({ AccountCode: '2104', AccountName: 'ضريبة القيمة المضافة المستحقة (مخرجات)', Debit: 0, Credit: taxAmt, Notes: `ضريبة مخرجات مبيعات POS #${s.ID.slice(-8)}` });
        }

        // COGS & Inventory Asset reduction [F4]
        let histCOGS = 0;
        if (s.ItemsJSON) {
          try {
            const its = JSON.parse(s.ItemsJSON);
            if (Array.isArray(its)) {
              its.forEach(it => {
                if (it.itemId && String(it.itemId).startsWith('srv_')) return;
                const inv = (state.inventory || []).find(x => String(x.ID) === String(it.itemId || it.id));
                const buy = Number(it.costAtSale != null ? it.costAtSale : (it.purchasePrice != null ? it.purchasePrice : (inv ? inv.PurchasePrice : 0))) || 0;
                histCOGS += Math.round(buy * Number(it.qty || 1) * 100) / 100;
              });
            }
          } catch(e) {}
        }
        if (histCOGS > 0) {
          lines.push(
            { AccountCode: '5102', AccountName: 'تكلفة البضاعة المباعة (POS)', Debit: histCOGS, Credit: 0, Notes: `تكلفة مبيعات فاتورة #${s.ID.slice(-8)}` },
            { AccountCode: '1104', AccountName: 'مخزون البضائع وقطع الغيار', Debit: 0, Credit: histCOGS, Notes: `صرف مخزون أصناف مباعة (${s.ItemsSummary || ''})` }
          );
        }

        const entryTot = Math.round((total + histCOGS) * 100) / 100;
        const entry = {
          ID: 'je_hist_s_' + s.ID,
          EntryNumber: getNextJournalEntryNumber(),
          Date: (s.Date || new Date().toISOString()).slice(0, 10),
          Description: `مبيعات كاشير POS (${s.ItemsSummary || 'أصناف متنوعة'})`,
          ReferenceType: 'Sale',
          ReferenceID: s.ID,
          Lines: lines,
          TotalDebit: entryTot,
          TotalCredit: entryTot,
          By: s.By || 'نظام'
        };
        entry.LinesJSON = JSON.stringify(entry.Lines);
        newEntries.push(entry);
        state.journalEntries.push(entry);
        existingRefs.add(refKey);
      }
    }
  });

  // 3. Reconcile Purchases
  (state.purchases || []).forEach(pur => {
    const refKey = `Purchase_${pur.ID}`;
    if (!existingRefs.has(refKey)) {
      const total = Number(pur.Total || 0);
      const paid = Number(pur.AmountPaid != null ? pur.AmountPaid : 0);
      if (total > 0) {
        const taxAmt = Math.max(0, Number(pur.TaxAmount || 0));
        const netCost = Math.max(0, Math.round((total - taxAmt) * 100) / 100);
        const lines = [
          { AccountCode: '1104', AccountName: 'مخزون البضائع وقطع الغيار', Debit: netCost, Credit: 0, Notes: `شراء أصناف من المورد (${pur.Supplier || ''})` }
        ];
        if (taxAmt > 0) {
          lines.push({ AccountCode: '1105', AccountName: 'ضريبة القيمة المضافة القابلة للخصم (مدخلات)', Debit: taxAmt, Credit: 0, Notes: `ضريبة مدخلات مشتريات #${pur.ID.slice(-8)}` });
        }
        if (paid > 0) {
          lines.push({ AccountCode: '1101', AccountName: 'الخزينة الرئيسية (النقدية)', Debit: 0, Credit: paid, Notes: `سداد نقدي لفاتورة شراء` });
        }
        if (total > paid) {
          lines.push({ AccountCode: '2101', AccountName: 'الموردون والدائنون', Debit: 0, Credit: total - paid, Notes: `مستحقات آجلة للمورد (${pur.Supplier || ''})` });
        }
        const entry = {
          ID: 'je_hist_pur_' + pur.ID,
          EntryNumber: getNextJournalEntryNumber(),
          Date: (pur.Date || new Date().toISOString()).slice(0, 10),
          Description: `فاتورة شراء مخزون من المورد [${pur.Supplier || ''}]`,
          ReferenceType: 'Purchase',
          ReferenceID: pur.ID,
          Lines: lines,
          TotalDebit: total,
          TotalCredit: total,
          By: pur.By || 'نظام'
        };
        entry.LinesJSON = JSON.stringify(entry.Lines);
        newEntries.push(entry);
        state.journalEntries.push(entry);
        existingRefs.add(refKey);
      }
    }
  });

  // 4. Reconcile Delivered Receipts Revenue (F2: Full revenue recognized once at delivery)
  (state.receipts || []).forEach(r => {
    if (r.status === 'تم التسليم' || r.status === 'delivered') {
      const refKey = `Receipt_Delivery_${r.id}`;
      const legacyKey1 = `Receipt_Revenue_${r.id}`;
      const legacyKey2 = `DeliveryCredit_${r.id}`;
      const legacyKey3 = `DeliveryCredit_${r.receiptNumber}`;
      const legacyKey4 = `Receipt_Debt_${r.id}`;
      if (!existingRefs.has(refKey) && !existingRefs.has(legacyKey1) && !existingRefs.has(legacyKey2) && !existingRefs.has(legacyKey3) && !existingRefs.has(legacyKey4)) {
        const cost = Number(r.cost || 0);
        const partsCost = Number(r.partsCost || 0);
        const otherCost = Number(r.otherAccountAmount || 0);
        const totalCost = cost + partsCost + otherCost;

        if (totalCost > 0) {
          const rPayments = (state.payments || []).filter(p => 
            String(p.ReceiptID) === String(r.id) || 
            (r.receiptNumber && String(p.ReceiptID) === String(r.receiptNumber))
          );
          let depositPaid = 0;
          if (rPayments.length > 0) {
            depositPaid = rPayments
              .filter(p => {
                const n = String(p.Note || '');
                return n.includes('مقدم') || (!n.includes('متبقي') && !n.includes('تسليم'));
              })
              .reduce((sum, p) => sum + Number(p.Amount || 0), 0);
            depositPaid = Math.min(totalCost, depositPaid);
          } else {
            depositPaid = Math.min(totalCost, Math.max(0, Number(r.deposit || 0)));
          }
          const remainingDebt = Math.max(0, totalCost - depositPaid);
          const rNum = r.receiptNumber || r.id;
          const custName = (r.customer && r.customer.name) || r.CustomerName || 'عميل';

          const lines = [];
          if (depositPaid > 0) {
            lines.push({
              AccountCode: '2102', AccountName: 'أمانات ومقدمات عملاء الصيانة',
              Debit: depositPaid, Credit: 0,
              Notes: `تسوية الدفعة المقدمة لإيصال صيانة #${rNum}`
            });
          }
          if (remainingDebt > 0) {
            lines.push({
              AccountCode: '1103', AccountName: 'العملاء والمدينون',
              Debit: remainingDebt, Credit: 0,
              Notes: `مستحقات آجل تسليم جهاز إيصال #${rNum}`
            });
          }
          lines.push({
            AccountCode: '4101', AccountName: 'إيرادات خدمات صيانة وتصليح',
            Debit: 0, Credit: totalCost,
            Notes: `إيراد صيانة جهاز إيصال #${rNum}`
          });

          const entry = {
            ID: 'je_hist_rd_' + r.id,
            EntryNumber: getNextJournalEntryNumber(),
            Date: (r.deliveryDate || r.date || new Date().toISOString()).slice(0, 10),
            Description: `إثبات إيراد تسليم جهاز إيصال #${rNum} - العميل: ${custName}`,
            ReferenceType: 'Receipt_Delivery',
            ReferenceID: String(r.id),
            Lines: lines,
            TotalDebit: totalCost,
            TotalCredit: totalCost,
            By: r.updatedBy || 'نظام'
          };
          entry.LinesJSON = JSON.stringify(lines);
          newEntries.push(entry);
          state.journalEntries.push(entry);
          existingRefs.add(refKey);
        }
      }
    }
  });

  // 5. Reconcile Invoices (F7)
  (state.invoices || []).forEach(inv => {
    const refKey = `Invoice_${inv.ID}`;
    if (!existingRefs.has(refKey)) {
      const total = Number(inv.Total || 0);
      const paid = Number(inv.AmountPaid != null ? inv.AmountPaid : (inv.Status === 'مدفوعة' ? total : 0));
      if (total > 0) {
        const pLow = String(inv.PaymentMethod || 'نقدي').toLowerCase();
        const isBank = pLow.includes('فيزا') || pLow.includes('card') || pLow.includes('انستاباي') || pLow.includes('إنستاباي') || pLow.includes('محفظ') || pLow.includes('فودافون');
        const debitCode = isBank ? '1102' : '1101';
        const debitName = isBank ? 'البنك والحسابات الإلكترونية والمحافظ' : 'الخزينة الرئيسية (النقدية)';
        const lines = [];
        if (paid > 0) {
          lines.push({ AccountCode: debitCode, AccountName: debitName, Debit: paid, Credit: 0, Notes: `تحصيل فاتورة مبيعات #${inv.InvoiceNumber || inv.ID}` });
        }
        if (total > paid) {
          lines.push({ AccountCode: '1103', AccountName: 'العملاء والمدينون', Debit: total - paid, Credit: 0, Notes: `آجل فاتورة مبيعات للعميل ${inv.CustomerName || ''}` });
        }
        const taxAmt = Math.max(0, Number(inv.TaxAmount || 0));
        const netRev = Math.max(0, Math.round((total - taxAmt) * 100) / 100);
        lines.push({ AccountCode: '4102', AccountName: 'إيرادات مبيعات بضائع وقطع غيار', Debit: 0, Credit: netRev, Notes: `فاتورة مبيعات #${inv.InvoiceNumber || inv.ID}` });
        if (taxAmt > 0) {
          lines.push({ AccountCode: '2104', AccountName: 'ضريبة القيمة المضافة المستحقة (مخرجات)', Debit: 0, Credit: taxAmt, Notes: `ضريبة مخرجات فاتورة #${inv.InvoiceNumber || inv.ID}` });
        }

        const entry = {
          ID: 'je_hist_inv_' + inv.ID,
          EntryNumber: getNextJournalEntryNumber(),
          Date: (inv.Date || new Date().toISOString()).slice(0, 10),
          Description: `فاتورة مبيعات #${inv.InvoiceNumber || inv.ID} (${inv.CustomerName || 'عميل'})`,
          ReferenceType: 'Invoice',
          ReferenceID: inv.ID,
          Lines: lines,
          TotalDebit: total,
          TotalCredit: total,
          By: inv.By || 'نظام'
        };
        entry.LinesJSON = JSON.stringify(entry.Lines);
        newEntries.push(entry);
        state.journalEntries.push(entry);
        existingRefs.add(refKey);
      }
    }
  });

  // 6. Reconcile Operating Expenses (F1: Ensure complete ledger coverage)
  (state.expenses || []).forEach(exp => {
    const refKey = `Expense_${exp.ID}`;
    if (!existingRefs.has(refKey)) {
      const amt = Number(exp.Amount || 0);
      if (amt > 0) {
        const cat = exp.Category || 'مصروفات أخرى';
        const isSupplier = cat === 'سداد موردين ومشتريات' || String(cat).includes('مورد') || exp.Type === 'supplier';
        const isDraw = exp.Type === 'out' || cat === 'مسحوبات شخصية' || cat === 'جاري الشركاء';
        const isIncome = exp.Type === 'in' || exp.Type === 'income';
        const isPosReturn = cat === 'مرتجع مبيعات POS' || exp.AccountCode === '4102-RET' || exp.Type === 'pos_return';

        if (!isIncome && !isPosReturn && !isSupplier && !isDraw) {
          const debitCode = EXPENSE_ACCOUNT_MAP[cat] || exp.AccountCode || '5208';
          const debitAcc = (state.accounts || []).find(a => String(a.Code) === String(debitCode));
          const debitName = debitAcc ? debitAcc.Name : (cat || 'مصروفات تشغيلية');

          const payMethod = exp.PaymentMethod || 'نقدي';
          const pLow = String(payMethod).toLowerCase();
          const isBank = pLow.includes('فيزا') || pLow.includes('card') || pLow.includes('انستاباي') || pLow.includes('إنستاباي') || pLow.includes('محفظ') || pLow.includes('فودافون');
          const creditCode = isBank ? '1102' : '1101';
          const creditName = isBank ? 'البنك والحسابات الإلكترونية' : 'الخزينة الرئيسية (النقدية)';

          const entry = {
            ID: 'je_hist_exp_' + exp.ID,
            EntryNumber: getNextJournalEntryNumber(),
            Date: (exp.Date || new Date().toISOString()).slice(0, 10),
            Description: `مصروف تشغيلي: ${cat} - ${exp.Title || exp.Notes || ''}`.trim(),
            ReferenceType: 'Expense',
            ReferenceID: String(exp.ID),
            Lines: [
              { AccountCode: debitCode, AccountName: debitName, Debit: amt, Credit: 0, Notes: exp.Notes || cat },
              { AccountCode: creditCode, AccountName: creditName, Debit: 0, Credit: amt, Notes: `سداد عبر ${payMethod}` }
            ],
            TotalDebit: amt,
            TotalCredit: amt,
            By: exp.By || 'نظام'
          };
          entry.LinesJSON = JSON.stringify(entry.Lines);
          newEntries.push(entry);
          state.journalEntries.push(entry);
          existingRefs.add(refKey);
        }
      }
    }
  });

  if (newEntries.length > 0) {
    setCache('journal', state.journalEntries);
    invalidateAccountStatsCache();
    console.log(`[reconcileHistoricalJournalEntries] Reconciled ${newEntries.length} entries for General Ledger.`);
  }
  return state.journalEntries;
}

async function loadJournalEntries(){
  const rows = await apiGet('getJournalEntries');
  const mapped = (Array.isArray(rows)?rows:[]).map(e=>({
    ...e,
    Lines: typeof e.LinesJSON==='string' ? (JSON.parse(e.LinesJSON||'[]')) : (e.Lines||[])
  }));
  state.journalEntries = mapped.length ? mapped : (getCache('journal', []) || []);
  setCache('journal', state.journalEntries);
  invalidateAccountStatsCache();
  return state.journalEntries;
}

async function saveJournalEntryRemote(entry){
  if(!entry.ID) entry.ID = 'je_' + Date.now();
  if(!entry.EntryNumber) entry.EntryNumber = getNextJournalEntryNumber();
  if(!entry.Date) entry.Date = (typeof localDateStr === 'function') ? localDateStr() : new Date().toISOString().slice(0,10);
  entry.By = state.user ? state.user.name : 'نظام';

  // 1. Balance check (F11-a): Enforce double-entry accounting balance
  const lines = Array.isArray(entry.Lines) ? entry.Lines : (typeof entry.LinesJSON === 'string' ? JSON.parse(entry.LinesJSON || '[]') : []);
  const calcDebit = round2(lines.reduce((s, l) => s + Number(l.Debit || 0), 0));
  const calcCredit = round2(lines.reduce((s, l) => s + Number(l.Credit || 0), 0));
  if (Math.abs(calcDebit - calcCredit) > 0.005) {
    const err = `قيد اليومية غير متوازن: المدين (${calcDebit}) لا يساوي الدائن (${calcCredit}) [قيد #${entry.EntryNumber || ''}]`;
    console.error(`[saveJournalEntryRemote] Rejecting unbalanced entry:`, err, lines);
    throw new Error(err);
  }
  entry.TotalDebit = calcDebit;
  entry.TotalCredit = calcCredit;

  // 2. Validate lines: account code presence and reject parent/summary accounts [F11-d]
  for (const l of lines) {
    const code = String(l.AccountCode || '').trim();
    if (!code) {
      throw new Error(`يوجد سطر في القيد بدون تحديد رقم/كود الحساب`);
    }
    const isParent = (state.accounts || []).some(a => String(a.ParentCode) === code);
    if (isParent) {
      throw new Error(`لا يمكن ترحيل قيود على حساب رئيسي/تجميعي (${code})؛ يرجى اختيار حساب فرعي تشغيلي`);
    }
  }

  // 3. Audit logging for manual / non-auto journal entries [F11-d]
  if (!entry.ReferenceType || entry.ReferenceType === 'Manual' || entry.ReferenceType === 'General') {
    if (typeof recordAuditLog === 'function') {
      recordAuditLog('قيد يومية يدوي', 'الحسابات', `ترحيل قيد يومي #${entry.EntryNumber} بقيمة ${calcDebit} ج.م - البيان: ${entry.Description}`, entry.ID);
    }
  }

  const existingIdx = (state.journalEntries || []).findIndex(x => String(x.ID) === String(entry.ID));
  if(existingIdx > -1){
    state.journalEntries[existingIdx] = entry;
  } else {
    state.journalEntries.push(entry);
  }
  setCache('journal', state.journalEntries);
  invalidateAccountStatsCache();
  return apiPost('saveJournalEntry', {data: entry, user: entry.By});
}

async function recordAutoJournalEntry(desc, refType, refId, lines){
  const totalDebit = round2(lines.reduce((s,l)=>s+Number(l.Debit||0),0));
  const totalCredit = round2(lines.reduce((s,l)=>s+Number(l.Credit||0),0));

  // Balance guard (F11-a)
  if (Math.abs(totalDebit - totalCredit) > 0.005) {
    const errMsg = `القيد التلقائي غير متوازن: المدين (${totalDebit}) لا يساوي الدائن (${totalCredit}) للمرجع ${refType} - ${refId}`;
    console.error(`[recordAutoJournalEntry] Unbalanced journal entry rejected:`, errMsg, lines);
    throw new Error(errMsg);
  }

  const entry = {
    ID: 'je_' + Date.now() + '_' + Math.floor(Math.random()*1000),
    EntryNumber: getNextJournalEntryNumber(),
    Date: (typeof localDateStr === 'function') ? localDateStr() : new Date().toISOString().slice(0,10),
    Description: desc,
    ReferenceType: refType,
    ReferenceID: refId || '',
    LinesJSON: JSON.stringify(lines),
    Lines: lines,
    TotalDebit: totalDebit,
    TotalCredit: totalCredit,
    By: state.user ? state.user.name : 'نظام'
  };
  return saveJournalEntryRemote(entry);
}

async function autoPostJournalEntry(opts = {}) {
  const desc = opts.description || opts.Description || 'قيد محاسبي تلقائي';
  const refType = opts.referenceType || opts.ReferenceType || 'General';
  const refId = opts.referenceId || opts.ReferenceID || '';
  const entries = opts.entries || opts.lines || opts.Lines || [];
  const lines = entries.map(e => ({
    AccountCode: e.accountId || e.accountCode || e.Code || e.AccountCode || '',
    AccountName: e.accountName || e.Name || e.AccountName || '',
    Debit: Number(e.debit || e.Debit || 0),
    Credit: Number(e.credit || e.Credit || 0)
  }));
  return recordAutoJournalEntry(desc, refType, refId, lines);
}

async function deleteJournalEntryRemote(id){
  state.journalEntries = (state.journalEntries || []).filter(x => String(x.ID) !== String(id) && String(x.EntryNumber) !== String(id));
  setCache('journal', state.journalEntries);
  invalidateAccountStatsCache();
  return apiPost('deleteJournalEntry', { id, role: (state.user ? state.user.role : 'admin') });
}

/* ---------------- F8: Memoized Account Stats & Balances Engine ---------------- */
let _accountStatsCache = new Map();
let _journalRevision = 0;
let _cachedRevision = -1;

function invalidateAccountStatsCache(){
  _journalRevision++;
  _accountStatsCache.clear();
}

function _computeAllAccountStats(){
  _accountStatsCache.clear();
  const accounts = state.accounts || [];

  // Map parent-child relationships
  const parentMap = new Map();
  const isParent = new Set();
  accounts.forEach(a => {
    if(a.ParentCode){
      const p = String(a.ParentCode).trim();
      isParent.add(p);
      if(!parentMap.has(p)) parentMap.set(p, []);
      parentMap.get(p).push(String(a.Code).trim());
    }
  });

  // Direct movements accumulator
  const directData = new Map();
  accounts.forEach(a => {
    directData.set(String(a.Code).trim(), { openDr: 0, openCr: 0, moveDr: 0, moveCr: 0 });
  });

  const hasOpeningEntry = (state.journalEntries || []).some(je => je.ReferenceType === 'Opening_Balance');

  (state.journalEntries || []).forEach(je => {
    const isOpening = je.ReferenceType === 'Opening_Balance';
    const lines = Array.isArray(je.Lines) ? je.Lines : (typeof je.LinesJSON === 'string' ? JSON.parse(je.LinesJSON || '[]') : []);
    lines.forEach(l => {
      const c = String(l.AccountCode || '').trim();
      if(!directData.has(c)){
        directData.set(c, { openDr: 0, openCr: 0, moveDr: 0, moveCr: 0 });
      }
      const item = directData.get(c);
      const dr = Number(l.Debit || 0);
      const cr = Number(l.Credit || 0);
      if(isOpening){
        item.openDr += dr;
        item.openCr += cr;
      } else {
        item.moveDr += dr;
        item.moveCr += cr;
      }
    });
  });

  function computeCode(code){
    if(_accountStatsCache.has(code)) return _accountStatsCache.get(code);

    const acc = accounts.find(a => String(a.Code).trim() === code);
    const nature = acc ? acc.Nature : 'مدين';
    const hasChildren = isParent.has(code);

    let openDr = 0;
    let openCr = 0;
    let moveDr = 0;
    let moveCr = 0;

    if(!hasChildren){
      // Leaf account: takes direct journal entries
      const d = directData.get(code) || { openDr: 0, openCr: 0, moveDr: 0, moveCr: 0 };
      openDr = d.openDr;
      openCr = d.openCr;
      moveDr = d.moveDr;
      moveCr = d.moveCr;

      // If no Opening_Balance entry exists in journal, fallback to legacy acc.Balance for leaf accounts
      if(!hasOpeningEntry && acc && Number(acc.Balance || 0) > 0){
        const legacyBal = Number(acc.Balance || 0);
        if(nature === 'مدين') openDr += legacyBal;
        else openCr += legacyBal;
      }
    } else {
      // Parent account: sum from children ONLY (F8: no direct Balance on parent)
      const children = parentMap.get(code) || [];
      children.forEach(chCode => {
        const chStats = computeCode(chCode);
        openDr += chStats.openingDebit;
        openCr += chStats.openingCredit;
        moveDr += chStats.totalDebit;
        moveCr += chStats.totalCredit;
      });
    }

    openDr = round2(openDr);
    openCr = round2(openCr);
    moveDr = round2(moveDr);
    moveCr = round2(moveCr);

    const openingBalance = nature === 'مدين' ? round2(openDr - openCr) : round2(openCr - openDr);
    const netBalance = nature === 'مدين'
      ? round2((openDr - openCr) + (moveDr - moveCr))
      : round2((openCr - openDr) + (moveCr - moveDr));

    let closingDebit = 0;
    let closingCredit = 0;
    if(nature === 'مدين'){
      if(netBalance >= 0) closingDebit = netBalance;
      else closingCredit = round2(Math.abs(netBalance));
    } else {
      if(netBalance >= 0) closingCredit = netBalance;
      else closingDebit = round2(Math.abs(netBalance));
    }

    const stats = {
      openingDebit: openDr,
      openingCredit: openCr,
      openingBalance,
      totalDebit: moveDr,
      totalCredit: moveCr,
      closingDebit,
      closingCredit,
      netBalance,
      nature,
      hasChildren
    };

    _accountStatsCache.set(code, stats);
    return stats;
  }

  accounts.forEach(a => computeCode(String(a.Code).trim()));
  _cachedRevision = _journalRevision;
}

function getAccountStats(accountCode){
  const code = String(accountCode).trim();
  if(_cachedRevision !== _journalRevision || _accountStatsCache.size === 0){
    _computeAllAccountStats();
  }
  if(_accountStatsCache.has(code)){
    return _accountStatsCache.get(code);
  }
  return {
    openingDebit: 0,
    openingCredit: 0,
    openingBalance: 0,
    totalDebit: 0,
    totalCredit: 0,
    closingDebit: 0,
    closingCredit: 0,
    netBalance: 0,
    nature: 'مدين',
    hasChildren: false
  };
}

function getAccountName(code, fallback = ''){
  const clean = String(code || '').trim();
  const accList = (typeof state !== 'undefined' && state && state.accounts) ? state.accounts : (typeof DEFAULT_ACCOUNTS !== 'undefined' ? DEFAULT_ACCOUNTS : []);
  const acc = accList.find(a => String(a.Code).trim() === clean);
  if(acc && acc.Name) return acc.Name;
  const def = (typeof DEFAULT_ACCOUNTS !== 'undefined') ? DEFAULT_ACCOUNTS.find(a => String(a.Code).trim() === clean) : null;
  if(def && def.Name) return def.Name;
  return fallback || (clean ? `حساب ${clean}` : '');
}
window.getAccountName = getAccountName;

/* ---------------- F8: Customer and Supplier Live Balance Engines ---------------- */
function getCustomerLiveBalance(custName, custPhone){
  if(!custName && !custPhone) return 0;
  const cName = String(custName || '').trim().toLowerCase();
  const cPhone = String(custPhone || '').trim();

  let totalDebit = 0;
  let totalCredit = 0;

  // 1. Receipts
  (state.receipts || []).forEach(r => {
    const rName = (extractCustomerName(r) || '').toLowerCase();
    const rPhone = extractCustomerPhone(r) || '';
    const isMatch = (cName && rName === cName) || (cPhone && rPhone === cPhone);
    if(isMatch){
      const totalDue = (typeof getReceiptTotalDue === 'function') ? getReceiptTotalDue(r) : (Number(r.cost || 0) + Number(r.partsCost || 0) + Number(r.otherAccountAmount || 0));
      const dep = Number(r.deposit || 0);
      const refAmt = Number(r.refunded || 0);
      totalDebit += totalDue + refAmt;

      const hasDepositInPayments = (state.payments || []).some(p => 
        (String(p.ReceiptID) === String(r.id) || String(p.ReceiptID) === String(r.receiptNumber)) &&
        (String(p.Note || '').includes('عربون') || String(p.Note || '').includes('مقدم') || Number(p.Amount) === dep)
      );
      if(dep > 0 && !hasDepositInPayments){
        totalCredit += dep;
      }
    }
  });

  // 2. Receipt Payments
  (state.payments || []).forEach(p => {
    const linkedReceipt = (state.receipts || []).find(r => String(r.id) === String(p.ReceiptID) || String(r.receiptNumber) === String(p.ReceiptID));
    if(linkedReceipt){
      const rName = (extractCustomerName(linkedReceipt) || '').toLowerCase();
      const rPhone = extractCustomerPhone(linkedReceipt) || '';
      const isMatch = (cName && rName === cName) || (cPhone && rPhone === cPhone);
      if(isMatch){
        totalCredit += Number(p.Amount || 0);
      }
    }
  });

  // 3. Sales
  (state.sales || []).forEach(s => {
    const sName = String(s.CustomerName || '').trim().toLowerCase();
    const sPhone = String(s.CustomerPhone || '').trim();
    const isMatch = (cName && sName === cName) || (cPhone && sPhone === cPhone);
    if(isMatch){
      const tot = Number(s.Total || 0);
      const paid = Number(s.AmountPaid != null ? s.AmountPaid : tot);
      totalDebit += tot;
      totalCredit += paid;
      if(s.IsReturned){
        const retDetails = s.ReturnDetails || {};
        const retAmt = Number(retDetails.totalRefund != null ? retDetails.totalRefund : tot);
        const retMethod = retDetails.refundMethod || s.PaymentMethod || 'نقدي';
        totalCredit += retAmt;
        const isDebtSettlementOnly = (retMethod.includes('آجل') || retMethod.includes('حساب'));
        if(!isDebtSettlementOnly && paid > 0){
          totalDebit += Math.min(paid, retAmt);
        }
      }
    }
  });

  // 4. Invoices
  (state.invoices || []).forEach(inv => {
    if(inv.ReferenceType !== 'Receipt' && inv.ReferenceType !== 'POS_Sale'){
      const invName = String(inv.CustomerName || '').trim().toLowerCase();
      const invPhone = String(inv.CustomerPhone || '').trim();
      const isMatch = (cName && invName === cName) || (cPhone && invPhone === cPhone);
      if(isMatch){
        const tot = Number(inv.Total || 0);
        const paid = Number(inv.AmountPaid != null ? inv.AmountPaid : (inv.Status === 'مدفوعة' ? tot : 0));
        totalDebit += tot;
        totalCredit += paid;
      }
    }
  });

  // 5. Quotations
  (state.quotations || []).forEach(q => {
    const qName = String(q.CustomerName || '').trim().toLowerCase();
    const qPhone = String(q.CustomerPhone || '').trim();
    const isMatch = (cName && qName === cName) || (cPhone && qPhone === cPhone);
    const isExecuted = ['تم التنفيذ والتسليم', 'مكتمل', 'موافق عليه'].includes(String(q.Status || '').trim());
    if(isMatch && isExecuted){
      const tot = Number(q.Total || 0);
      const paid = Number(q.AmountPaid != null ? q.AmountPaid : (q.Deposit != null ? q.Deposit : 0));
      totalDebit += tot;
      totalCredit += paid;
    }
  });

  return round2(totalDebit - totalCredit);
}

function getSupplierLiveBalance(supName){
  if(!supName) return 0;
  const sName = String(supName).trim().toLowerCase();
  let totalPurchases = 0;
  let totalPaid = 0;

  (state.purchases || []).forEach(p => {
    if((p.Supplier || '').trim().toLowerCase() === sName){
      const tot = Number(p.Total || 0);
      const paid = Number(p.AmountPaid != null ? p.AmountPaid : tot);
      totalPurchases += tot;
      totalPaid += paid;
    }
  });

  (state.expenses || []).forEach(exp => {
    const isSupplier = (exp.Supplier && exp.Supplier.trim().toLowerCase() === sName) ||
                       (exp.Category === 'سداد موردين ومشتريات' && (exp.Title || '').toLowerCase().includes(sName));
    if(isSupplier){
      totalPaid += Number(exp.Amount || 0);
    }
  });

  return round2(totalPurchases - totalPaid);
}

async function loadReceipts(params){
  try {
    const rows = await apiGet('getReceipts', params);
    if(Array.isArray(rows)){
      if(rows.length > 0){
        state.receipts = rows.map(rowToReceipt);
        setCache('receipts_raw', rows);
        setCache('receipts', state.receipts);

        // Extract customers from receipts that are missing from the directory
        _extractCustomersFromReceipts();
      } else if(navigator.onLine){
        // Cloud sheet is legitimately empty and client is online
        state.receipts = [];
        setCache('receipts_raw', []);
        setCache('receipts', []);
      }
    }
  } catch(e){
    console.warn('loadReceipts fetch failed or offline:', e);
  }
  return state.receipts;
}

function _extractCustomersFromReceipts(){
  if(!state.customers || !state.receipts) return;
  let added = 0;
  let syncedToReceipts = 0;

  state.receipts.forEach(r => {
    const rawName = extractCustomerName(r);
    const rawPhone = extractCustomerPhone(r);
    if(!rawName || rawName === 'عميل' || rawName === 'زبون') return;

    // Look for customer in directory using robust phonetic matching
    const matched = typeof findCustomerInDirectory === 'function' ? findCustomerInDirectory(rawName) : null;

    if(matched){
      // Customer is already known in directory!
      const dirPhone = (matched.phone || matched.CustomerPhone || '').trim();
      const rPhoneTrim = (rawPhone || '').trim();
      const dirName = (matched.name || matched.CustomerName || '').trim();
      const dirTitle = (matched.title || matched.CustomerTitle || '').trim();

      let receiptChanged = false;

      // Case A: Directory has a phone but receipt has no phone (or placeholder) -> sync phone to receipt!
      if(dirPhone && dirPhone !== '0000000000' && (!rPhoneTrim || rPhoneTrim === '0000000000')){
        if(!r.customer) r.customer = {};
        r.customer.phone = dirPhone;
        r.CustomerPhone = dirPhone;
        receiptChanged = true;
      }
      // Case B: Receipt has a phone but directory doesn't -> sync phone to directory!
      else if(rPhoneTrim && rPhoneTrim !== '0000000000' && (!dirPhone || dirPhone === '0000000000')){
        matched.phone = rPhoneTrim;
        if(matched.CustomerPhone !== undefined) matched.CustomerPhone = rPhoneTrim;
        try { saveCustomerRemote(matched); } catch(e){}
      }

      // Case C: Canonicalize receipt name & title to directory canonical spelling
      if(dirName && (r.CustomerName !== dirName || (r.customer && r.customer.name !== dirName))){
        if(!r.customer) r.customer = {};
        r.CustomerName = dirName;
        r.customer.name = dirName;
        receiptChanged = true;
      }
      if(dirTitle && (r.CustomerTitle !== dirTitle || (r.customer && r.customer.title !== dirTitle))){
        if(!r.customer) r.customer = {};
        r.CustomerTitle = dirTitle;
        r.customer.title = dirTitle;
        receiptChanged = true;
      }

      if(receiptChanged){
        syncedToReceipts++;
      }
    } else {
      // New customer not found in directory at all: only add if has a valid name
      const phoneTrim = (rawPhone || '').trim();
      const title = extractCustomerTitle(r);
      state.customers.push({
        title: title || '',
        name: rawName.trim(),
        phone: phoneTrim,
        email: '',
        taxNumber: '',
        address: ''
      });
      added++;
    }
  });

  if(added > 0 || syncedToReceipts > 0){
    deduplicateCustomerDirectory();
    setCache('customers', state.customers);
    setCache('receipts', state.receipts);
    console.log(`Customers-Receipts Sync: ${added} added to directory, ${syncedToReceipts} synced to receipts`);
  }
}

async function loadCustomers(params){
  try {
    const rows = await apiGet('getCustomers', params);
    if(Array.isArray(rows)){
      if(rows.length > 0){
        const cloudList = [];
        const seen = new Set();
        rows.forEach(r => {
          const name = extractCustomerName(r);
          const phone = extractCustomerPhone(r);
          const email = extractCustomerEmail(r);
          const title = extractCustomerTitle(r);
          const taxNumber = r.TaxNumber || r.taxNumber || '';
          const address = r.Address || r.address || '';
          const key = `${(name||'').trim().toLowerCase()}_${(phone||'').trim()}`;
          if((name || phone) && !seen.has(key)){
            seen.add(key);
            cloudList.push({ title, name: name || 'عميل', phone: phone || '', email: email || '', taxNumber, address });
          }
        });

        // === SAFE MERGE: preserve local customers not yet in cloud ===
        const merged = [...cloudList];
        const cloudKeys = new Set(cloudList.map(c => (c.name||'').trim().toLowerCase()));
        const cloudPhones = new Set(cloudList.filter(c => c.phone).map(c => c.phone.trim()));

        // Keep any local-only customers (added via receipts/POS but not yet synced to cloud)
        (state.customers || []).forEach(local => {
          const localName = (local.name||'').trim().toLowerCase();
          const localPhone = (local.phone||'').trim();
          const inCloudByName = localName && localName !== 'عميل' && localName !== 'زبون' && cloudKeys.has(localName);
          const inCloudByPhone = localPhone && localPhone !== '0000000000' && cloudPhones.has(localPhone);
          if(!inCloudByName && !inCloudByPhone){
            // This customer exists locally but NOT in cloud — preserve it and try to sync
            merged.push(local);
            if(local.name && local.name !== 'عميل'){
              try { saveCustomerRemote(local); } catch(e){ console.warn('Re-sync local customer:', e); }
            }
          } else if(inCloudByName && localPhone && !inCloudByPhone) {
            // Customer exists in cloud by name but with different/missing phone — update cloud entry
            const cloudEntry = merged.find(c => (c.name||'').trim().toLowerCase() === localName);
            if(cloudEntry && (!cloudEntry.phone || cloudEntry.phone === '0000000000') && localPhone !== '0000000000'){
              cloudEntry.phone = localPhone;
            }
          }
        });

        state.customers = merged;
        deduplicateCustomerDirectory();
        setCache('customers', state.customers);
      } else if(navigator.onLine){
        // Cloud customers sheet is legitimately empty
        const localCustomers = (state.customers || []).filter(c => c && c.name && c.name !== 'عميل' && c.name !== 'زبون');
        if(localCustomers.length === 0){
          state.customers = [];
          setCache('customers', []);
        }
      }
    }
  } catch(e){
    console.warn('loadCustomers remote get failed:', e);
  }
  return state.customers;
}
async function loadTechnicians(){
  const rows = await apiGet('getTechnicians');
  const names = rows.map(r=>r.Name).filter(Boolean);
  const finalNames = names.length ? names : ['أحمد فتحي','محمود سيد','كريم عادل'];
  setCache('technicians', finalNames);
  return finalNames;
}

async function postReceiptDeliveryRevenue(receipt, forcedDeposit, forcedRemaining) {
  if (!receipt) return null;
  const receiptId = String(receipt.id || receipt.receiptNumber || '');
  if (!receiptId) return null;

  if (!state.journalEntries) state.journalEntries = [];
  const alreadyPosted = state.journalEntries.some(e => 
    (e.ReferenceType === 'Receipt_Delivery' || e.ReferenceType === 'Receipt_Revenue' || e.ReferenceType === 'DeliveryCredit') &&
    (String(e.ReferenceID) === String(receipt.id) || String(e.ReferenceID) === String(receipt.receiptNumber))
  );
  if (alreadyPosted) {
    return null;
  }

  const cost = Number(receipt.cost || 0);
  const partsCost = Number(receipt.partsCost || 0);
  const otherCost = Number(receipt.otherAccountAmount || 0);
  const totalCost = cost + partsCost + otherCost;

  if (totalCost <= 0) return null;

  let depositPaid = 0;
  let remainingDebt = 0;

  if (forcedDeposit != null && forcedRemaining != null) {
    depositPaid = Math.min(totalCost, Math.max(0, Number(forcedDeposit)));
    remainingDebt = Math.max(0, Number(forcedRemaining));
  } else {
    const rPayments = (state.payments || []).filter(p => 
      String(p.ReceiptID) === String(receipt.id) || 
      (receipt.receiptNumber && String(p.ReceiptID) === String(receipt.receiptNumber))
    );
    if (rPayments.length > 0) {
      depositPaid = rPayments
        .filter(p => {
          const n = String(p.Note || '');
          return n.includes('مقدم') || (!n.includes('متبقي') && !n.includes('تسليم'));
        })
        .reduce((sum, p) => sum + Number(p.Amount || 0), 0);
      depositPaid = Math.min(totalCost, depositPaid);
    } else {
      depositPaid = Math.min(totalCost, Math.max(0, Number(receipt.deposit || 0)));
    }
    remainingDebt = Math.max(0, totalCost - depositPaid);
  }

  const rNum = receipt.receiptNumber || receipt.id;
  const custName = (receipt.customer && receipt.customer.name) ? receipt.customer.name : (receipt.CustomerName || 'عميل');

  const lines = [];
  if (depositPaid > 0) {
    lines.push({
      AccountCode: '2102',
      AccountName: 'أمانات ومقدمات عملاء الصيانة',
      Debit: depositPaid,
      Credit: 0,
      Notes: `تسوية الدفعة المقدمة لإيصال صيانة #${rNum} (${custName})`
    });
  }
  if (remainingDebt > 0) {
    lines.push({
      AccountCode: '1103',
      AccountName: 'العملاء والمدينون',
      Debit: remainingDebt,
      Credit: 0,
      Notes: `مستحقات آجل تسليم جهاز إيصال #${rNum} (${custName})`
    });
  }
  lines.push({
    AccountCode: '4101',
    AccountName: 'إيرادات خدمات صيانة وتصليح',
    Debit: 0,
    Credit: totalCost,
    Notes: `إيراد صيانة جهاز إيصال #${rNum} (${custName})`
  });

  return recordAutoJournalEntry(
    `إثبات إيراد تسليم جهاز إيصال #${rNum} - العميل: ${custName}`,
    'Receipt_Delivery',
    String(receipt.id),
    lines
  );
}
if (typeof window !== 'undefined') window.postReceiptDeliveryRevenue = postReceiptDeliveryRevenue;

async function saveReceiptRemote(d){
  // Check if new parts need to be deducted
  const partsToDeduct = Array.isArray(d.partsList) && d.partsList.length > 0 ? d.partsList : [];
  if(partsToDeduct.length > 0){
    for(const p of partsToDeduct){
      const it = (state.inventory||[]).find(x => x.ID === p.itemId);
      if(it) it.Quantity = Math.max(0, Number(it.Quantity||0) - Number(p.qty||1));
    }
    setCache('inventory', state.inventory);
  }

  // Auto Journal Entry for spare parts cost
  let journalEntry = null;
  const partsCost = Number(d.partsCost || 0);
  if(partsCost > 0 && partsToDeduct.length > 0){
    const rNum = d.receiptNumber || d.id;
    const jLines = [
      { AccountCode: '5101', AccountName: 'تكلفة قطع الغيار المستخدمة بالصيانة', Debit: partsCost, Credit: 0, Notes: `تكلفة قطع غيار إيصال #${rNum}` },
      { AccountCode: '1104', AccountName: 'مخزون البضائع وقطع الغيار', Debit: 0, Credit: partsCost, Notes: `صرف قطع صيانة إيصال #${rNum} (${d.partsUsed||''})` }
    ];
    journalEntry = {
      ID: 'je_' + Date.now() + '_' + Math.floor(Math.random()*1000),
      EntryNumber: 'JE-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4),
      Date: d.date || new Date().toISOString().slice(0, 10),
      Description: `تكلفة قطع غيار صيانة (إيصال #${rNum})`,
      ReferenceType: 'Receipt_Parts',
      ReferenceID: String(d.id),
      LinesJSON: JSON.stringify(jLines),
      Lines: jLines,
      TotalDebit: partsCost,
      TotalCredit: partsCost,
      By: state.user ? state.user.name : 'نظام'
    };
    if(!state.journalEntries) state.journalEntries = [];
    state.journalEntries.push(journalEntry);
    setCache('journal', state.journalEntries);
  }

  const row = receiptToRow(d);
  const idx = state.receipts.findIndex(x=>x.id===d.id);
  if(idx>-1) state.receipts[idx] = d; else state.receipts.push(d);
  setCache('receipts', state.receipts);
  recoverAndSyncAllCustomerPhones(false);

  // Auto Journal Entry for Receipt Delivery Revenue (F2: recognize revenue once upon delivery)
  if(d.status === 'تم التسليم' || d.status === 'delivered'){
    try {
      await postReceiptDeliveryRevenue(d);
    } catch(errRev){
      console.warn('Auto delivery revenue recording error:', errRev);
    }
  }

  // Auto-ensure customer exists in directory
  if(d.customer && d.customer.name && d.customer.name !== 'عميل' && d.customer.name !== 'زبون'){
    const custName = d.customer.name.trim().toLowerCase();
    const custPhone = (d.customer.phone || '').trim();
    const existing = state.customers.find(c => {
      if(custPhone && custPhone !== '0000000000' && c.phone === custPhone) return true;
      if((c.name||'').trim().toLowerCase() === custName) return true;
      return false;
    });
    if(!existing){
      state.customers.push({ title: d.customer.title||'', name: d.customer.name, phone: custPhone, email: d.customer.email||'' });
      setCache('customers', state.customers);
      try { await saveCustomerRemote(d.customer); } catch(e){ console.warn('Auto-save customer:', e); }
    } else if(custPhone && custPhone !== '0000000000' && (!existing.phone || existing.phone === '0000000000')){
      existing.phone = custPhone;
      setCache('customers', state.customers);
      try { await saveCustomerRemote(existing); } catch(e){ console.warn('Auto-update customer phone:', e); }
    }
  }

  const res = await apiPost('saveReceipt', {
    data: row,
    user: state.user?state.user.name:'نظام',
    partsToDeduct,
    journalEntry,
    autoRenumber: true
  });

  if(res && res.renumbered && res.newReceiptNumber){
    d.receiptNumber = res.newReceiptNumber;
    row.ReceiptNumber = res.newReceiptNumber;
    const recIdx = state.receipts.findIndex(x => x.id === d.id);
    if(recIdx > -1) state.receipts[recIdx].receiptNumber = res.newReceiptNumber;
    setCache('receipts', state.receipts);
    if(typeof showToast === 'function') {
      showToast(`تنبيه: تم تحديث رقم الإيصال تلقائياً إلى #${res.newReceiptNumber} لمنع التكرار`, 'warning');
    }
  }

  return res;
}
async function deleteReceiptRemote(id){
  const r = state.receipts.find(x => x.id === id || String(x.receiptNumber) === String(id));
  const partsToRestore = r && Array.isArray(r.partsList) ? r.partsList : [];

  // Restore local inventory
  if(partsToRestore.length > 0){
    for(const p of partsToRestore){
      const it = (state.inventory||[]).find(x => x.ID === p.itemId);
      if(it) it.Quantity = Number(it.Quantity || 0) + Number(p.qty || 1);
    }
    setCache('inventory', state.inventory);
  }

  // Reverse auto journal entry if parts cost was recorded
  let reversalEntry = null;
  const partsCost = Number(r ? r.partsCost : 0);
  if(partsCost > 0){
    const rNum = r ? (r.receiptNumber || r.id) : id;
    const revLines = [
      { AccountCode: '1104', AccountName: 'مخزون البضائع وقطع الغيار', Debit: partsCost, Credit: 0, Notes: `إلغاء استهلاك قطع غيار إيصال #${rNum}` },
      { AccountCode: '5101', AccountName: 'تكلفة قطع الغيار المستخدمة بالصيانة', Debit: 0, Credit: partsCost, Notes: `عكس تكلفة قطع إيصال محذوف #${rNum}` }
    ];
    reversalEntry = {
      ID: 'je_rev_' + Date.now(),
      EntryNumber: 'REV-JE-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4),
      Date: new Date().toISOString().slice(0, 10),
      Description: `قيد عكسي لإلغاء استهلاك قطع غيار إيصال محذوف #${rNum}`,
      ReferenceType: 'Receipt_Reversal',
      ReferenceID: String(id),
      LinesJSON: JSON.stringify(revLines),
      Lines: revLines,
      TotalDebit: partsCost,
      TotalCredit: partsCost,
      By: state.user ? state.user.name : 'نظام'
    };
    if(!state.journalEntries) state.journalEntries = [];
    state.journalEntries.push(reversalEntry);
    setCache('journal', state.journalEntries);
  }

  state.receipts = state.receipts.filter(x => x.id !== id && String(x.receiptNumber) !== String(id));
  setCache('receipts', state.receipts);
  return apiPost('deleteReceipt', {
    id,
    role: state.user.role,
    user: state.user.name,
    partsToRestore,
    voidPayments: true,
    reversalEntry
  });
}
async function saveCustomerRemote(c, oldName = null){
  if(!c || !c.name) return;
  const cTitle = (c.title != null ? c.title : (c.Title != null ? c.Title : '')).trim();
  const searchName = (oldName || c.name || '').trim().toLowerCase();
  const cPhone = (c.phone || '').trim();

  // Search by NAME first (primary key), then by phone only if name didn't match
  const exists = state.customers.find(x => {
    const xName = (x.name||'').trim().toLowerCase();
    // Match by old name (for renames)
    if(oldName && xName === oldName.trim().toLowerCase()) return true;
    // Match by current name
    if(xName === searchName) return true;
    return false;
  });

  const cDebt = Number(c.Debt != null ? c.Debt : (c.debt != null ? c.debt : (exists ? (exists.Debt || exists.debt || 0) : 0)));

  if(!exists){
    state.customers.push({ title: cTitle, name: c.name, phone: cPhone, email: c.email||'', taxNumber: c.taxNumber||'', address: c.address||'', debt: cDebt, Debt: cDebt });
  } else {
    exists.title = cTitle;
    exists.name = c.name;
    // Only update phone if the new value is non-empty (don't erase existing phone)
    if(cPhone && cPhone !== '0000000000') exists.phone = cPhone;
    if(c.email != null) exists.email = c.email;
    if(c.taxNumber != null) exists.taxNumber = c.taxNumber;
    if(c.address != null) exists.address = c.address;
    exists.debt = cDebt;
    exists.Debt = cDebt;
  }
  setCache('customers', state.customers);
  // Use Name as upsert key instead of Phone to prevent overwriting different customers
  return apiPost('saveCustomer', {data: {Title:cTitle, Name:c.name, OldName:oldName||'', Phone:cPhone, Email:c.email||'', TaxNumber:c.taxNumber||'', Address:c.address||'', Debt: cDebt}});
}
async function saveTechnicianRemote(name){
  if(!state.technicians.includes(name)) state.technicians.push(name);
  setCache('technicians', state.technicians);
  return apiPost('saveTechnician', {name});
}
