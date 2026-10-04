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

  // 3 - حقوق الملكية
  {Code:'3', Name:'حقوق الملكية', Type:'حقوق الملكية', ParentCode:'', Nature:'دائن', Description:'حقوق أصحاب المنشأة', Balance:0},
  {Code:'31', Name:'رأس المال والاحتياطيات', Type:'حقوق الملكية', ParentCode:'3', Nature:'دائن', Description:'رأس المال المستثمر', Balance:0},
  {Code:'3101', Name:'رأس المال', Type:'حقوق الملكية', ParentCode:'31', Nature:'دائن', Description:'رأس مال البداية', Balance:0},
  {Code:'3102', Name:'الأرباح والخسائر المرحلة', Type:'حقوق الملكية', ParentCode:'31', Nature:'دائن', Description:'أرباح الأعوام والفترات السابقة', Balance:0},
  {Code:'3103', Name:'جاري الشركاء والمسحوبات', Type:'حقوق الملكية', ParentCode:'31', Nature:'دائن', Description:'المسحوبات الشخصية للشركاء', Balance:0},

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
  {Code:'5207', Name:'شحن وتوصيل ونقليات', Type:'المصروفات', ParentCode:'52', Nature:'مدين', Description:'مصاريف الشحن والمواصلات', Balance:0}
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
  return finalAccounts;
}
async function saveAccountRemote(acc){
  const idx = state.accounts.findIndex(x=>String(x.Code)===String(acc.Code));
  if(idx>-1) state.accounts[idx] = acc; else state.accounts.push(acc);
  setCache('accounts', state.accounts);
  return apiPost('saveAccount', {data:acc});
}
async function deleteAccountRemote(code){
  state.accounts = state.accounts.filter(x=>String(x.Code)!==String(code));
  setCache('accounts', state.accounts);
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

  // 1. Reconcile Payments
  (state.payments || []).forEach(p => {
    const refKey = `Receipt_${p.ReceiptID || p.ID}`;
    if (!existingRefs.has(refKey)) {
      const numAmt = Number(p.Amount || 0);
      if (numAmt > 0) {
        const payMethod = p.PaymentMethod || 'نقدي (كاش)';
        const pLow = String(payMethod).toLowerCase();
        const isBank = pLow.includes('فيزا') || pLow.includes('انستاباي') || pLow.includes('محفظ') || pLow.includes('فودافون');
        const debitCode = isBank ? '1102' : '1101';
        const debitName = isBank ? 'البنك والحسابات الإلكترونية' : 'الخزينة الرئيسية (النقدية)';
        const entry = {
          ID: 'je_hist_p_' + (p.ID || Math.random().toString(36).slice(2, 7)),
          EntryNumber: getNextJournalEntryNumber(),
          Date: (p.Date || new Date().toISOString()).slice(0, 10),
          Description: `تحصيل صيانة [${payMethod}] (${p.Note || 'دفعة إيصال'})`,
          ReferenceType: 'Receipt',
          ReferenceID: p.ReceiptID || p.ID,
          Lines: [
            { AccountCode: debitCode, AccountName: debitName, Debit: numAmt, Credit: 0, Notes: `تحصيل عبر ${payMethod}` },
            { AccountCode: '4101', AccountName: 'إيرادات خدمات صيانة وتصليح', Debit: 0, Credit: numAmt, Notes: `إيصال #${p.ReceiptNumber || p.ReceiptID}` }
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
      const paid = Number(s.AmountPaid != null ? s.AmountPaid : total);
      if (total > 0) {
        const lines = [];
        if (paid > 0) {
          lines.push({ AccountCode: '1101', AccountName: 'الخزينة الرئيسية (النقدية)', Debit: paid, Credit: 0, Notes: `مقبوضات مبيعات POS` });
        }
        if (total > paid) {
          lines.push({ AccountCode: '1103', AccountName: 'العملاء والمدينون', Debit: total - paid, Credit: 0, Notes: `آجل مبيعات POS للعميل ${s.CustomerName || ''}` });
        }
        lines.push({ AccountCode: '4102', AccountName: 'إيرادات مبيعات بضائع وقطع غيار', Debit: 0, Credit: total, Notes: `فاتورة مبيعات #${s.ID.slice(-8)}` });

        const entry = {
          ID: 'je_hist_s_' + s.ID,
          EntryNumber: getNextJournalEntryNumber(),
          Date: (s.Date || new Date().toISOString()).slice(0, 10),
          Description: `مبيعات كاشير POS (${s.ItemsSummary || 'أصناف متنوعة'})`,
          ReferenceType: 'Sale',
          ReferenceID: s.ID,
          Lines: lines,
          TotalDebit: total,
          TotalCredit: total,
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
        const lines = [
          { AccountCode: '1104', AccountName: 'مخزون البضائع وقطع الغيار', Debit: total, Credit: 0, Notes: `شراء أصناف من المورد (${pur.Supplier || ''})` }
        ];
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

  // 4. Reconcile Delivered Receipts with Unpaid Balance (Customer Receivables)
  (state.receipts || []).forEach(r => {
    if (r.status === 'تم التسليم' || r.status === 'مكتمل') {
      const cost = Number(r.cost || 0);
      const deposit = Number(r.deposit || 0);
      const partsCost = Number(r.partsCost || 0);
      const totalDue = cost + partsCost + Number(r.otherAccountAmount || 0);
      const remaining = Math.max(0, totalDue - deposit);
      const refKey = `Receipt_Debt_${r.id}`;
      if (remaining > 0 && !existingRefs.has(refKey)) {
        const custName = (r.customer && r.customer.name) || r.CustomerName || 'عميل';
        const entry = {
          ID: 'je_hist_debt_' + r.id,
          EntryNumber: getNextJournalEntryNumber(),
          Date: (r.deliveryDate || r.date || new Date().toISOString()).slice(0, 10),
          Description: `إثبات مستحقات صيانة آجلة عند التسليم للعميل (${custName}) - إيصال #${r.receiptNumber}`,
          ReferenceType: 'Receipt_Debt',
          ReferenceID: r.id,
          Lines: [
            { AccountCode: '1103', AccountName: 'العملاء والمدينون', Debit: remaining, Credit: 0, Notes: `متبقي صيانة آجل لم يسدد` },
            { AccountCode: '4101', AccountName: 'إيرادات خدمات صيانة وتصليح', Debit: 0, Credit: remaining, Notes: `إيصال #${r.receiptNumber}` }
          ],
          TotalDebit: remaining,
          TotalCredit: remaining,
          By: r.updatedBy || 'نظام'
        };
        entry.LinesJSON = JSON.stringify(entry.Lines);
        newEntries.push(entry);
        state.journalEntries.push(entry);
        existingRefs.add(refKey);
      }
    }
  });

  if (newEntries.length > 0) {
    setCache('journal', state.journalEntries);
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
  // Auto reconcile if empty or missing operational entries
  if(!state.journalEntries || state.journalEntries.length === 0){
    reconcileHistoricalJournalEntries();
  }
  setCache('journal', state.journalEntries);
  return state.journalEntries;
}

async function saveJournalEntryRemote(entry){
  if(!entry.ID) entry.ID = 'je_' + Date.now();
  if(!entry.EntryNumber) entry.EntryNumber = getNextJournalEntryNumber();
  if(!entry.Date) entry.Date = new Date().toISOString().slice(0,10);
  entry.By = state.user ? state.user.name : 'نظام';
  state.journalEntries.push(entry);
  setCache('journal', state.journalEntries);
  return apiPost('saveJournalEntry', {data: entry, user: entry.By});
}

async function recordAutoJournalEntry(desc, refType, refId, lines){
  const totalDebit = lines.reduce((s,l)=>s+Number(l.Debit||0),0);
  const totalCredit = lines.reduce((s,l)=>s+Number(l.Credit||0),0);
  const entry = {
    ID: 'je_' + Date.now() + '_' + Math.floor(Math.random()*1000),
    EntryNumber: getNextJournalEntryNumber(),
    Date: new Date().toISOString().slice(0,10),
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

function getAccountStats(accountCode){
  const code = String(accountCode).trim();
  const acc = state.accounts.find(a=>String(a.Code)===code);
  const nature = acc ? acc.Nature : 'مدين';
  let totalDebit = 0;
  let totalCredit = 0;

  // Direct transactions from journal entries
  (state.journalEntries||[]).forEach(je=>{
    (je.Lines||[]).forEach(l=>{
      if(String(l.AccountCode).trim()===code){
        totalDebit += Number(l.Debit||0);
        totalCredit += Number(l.Credit||0);
      }
    });
  });

  // Also include child accounts if this is a parent category
  const children = state.accounts.filter(a=>String(a.ParentCode)===code);
  children.forEach(ch=>{
    const chStats = getAccountStats(ch.Code);
    totalDebit += chStats.totalDebit;
    totalCredit += chStats.totalCredit;
  });

  const initBal = Number(acc ? acc.Balance : 0);
  const netBalance = nature === 'مدين' ? (initBal + totalDebit - totalCredit) : (initBal + totalCredit - totalDebit);

  return { totalDebit, totalCredit, netBalance, nature };
}

async function loadReceipts(params){
  try {
    const rows = await apiGet('getReceipts', params);
    if(Array.isArray(rows) && rows.length > 0){
      state.receipts = rows.map(rowToReceipt);
      setCache('receipts_raw', rows);
      setCache('receipts', state.receipts);

      // Extract customers from receipts that are missing from the directory
      _extractCustomersFromReceipts();
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
    if(Array.isArray(rows) && rows.length > 0){
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

  return apiPost('saveReceipt', {
    data: row,
    user: state.user?state.user.name:'نظام',
    partsToDeduct,
    journalEntry
  });
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
