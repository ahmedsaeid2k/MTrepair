/* ---- Toast Notification Utility ---- */
function showToast(msg, type='info', duration=2800){
  const container = document.getElementById('toastContainer');
  if(!container) return;
  
  // Prevent duplicate consecutive toasts with identical message
  const existing = container.querySelectorAll('.toast');
  for(const ex of existing){
    if(ex.textContent.includes(msg)){
      return; // Already showing this toast
    }
  }

  // Limit max visible toasts to 3
  if(existing.length >= 3){
    existing[0].remove();
  }

  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.style.cursor = 'pointer';
  t.title = 'انقر للإغلاق السريع';
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  t.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span><span style="margin-right:auto;font-size:11px;opacity:0.6;margin-left:4px;">✕</span>`;
  
  t.onclick = ()=>{ t.remove(); };

  container.appendChild(t);
  setTimeout(()=>{
    if(t.parentNode){
      t.style.opacity = '0';
      t.style.transform = 'translateY(10px)';
      t.style.transition = 'all 0.2s ease';
      setTimeout(()=>t.remove(), 200);
    }
  }, duration);
}

/* ---- Customer Data Extraction, Titles & Phone Recovery Engine ---- */
const CUSTOMER_TITLES = ['أستاذ', 'أستاذة', 'مهندس', 'مهندسة', 'دكتور', 'دكتورة', 'حاج', 'حاجة', 'شيخ', 'سيد', 'سيدة'];

function cleanRestName(str){
  return String(str || '').replace(/^[\/\:\-\\\.\s]+/, '').trim();
}

function parseCustomerTitleAndName(rawStr){
  if(!rawStr || typeof rawStr !== 'string') return { title: '', name: '' };
  let str = rawStr.replace(/["`]/g, '').trim();
  if(!str) return { title: '', name: '' };

  function isFemaleName(namePart){
    const firstWord = (namePart.split(/\s+/)[0] || '').trim();
    if(!firstWord) return false;
    if(firstWord.length >= 4 && /[ةه]$/.test(firstWord)) return true;
    const knownFemale = ['سلمى', 'سلمي', 'الاء', 'آلاء', 'مريم', 'منى', 'مني', 'هدى', 'هدي', 'لبنى', 'لبني', 'ضحى', 'ضحي', 'نهى', 'نهي', 'ياسمين', 'رنا', 'مي', 'دينا', 'سما', 'إيمان', 'ايمان', 'أمل', 'امل', 'هاجر', 'حنان', 'آية', 'اية', 'أسماء', 'اسماء', 'إسراء', 'اسراء', 'رحاب', 'جهاد', 'خلود', 'سعاد', 'زينب', 'عبير', 'ريهام', 'روان', 'شروق', 'نور', 'نورهان', 'مروة', 'سارة', 'شيماء', 'دعاء', 'سحر', 'سمر', 'وفاء', 'سناء', 'نجلاء', 'صفاء', 'هناء', 'جيهان', 'سوزان', 'نيفين', 'رشا', 'بسمة', 'بسمه', 'شيرين', 'أميرة', 'اميرة', 'إلهام', 'الهام', 'يارا', 'حبيبة', 'حبيبه', 'فريدة', 'فريده', 'ملك', 'جنى', 'جني', 'شمس', 'رضوى', 'رضوي'];
    return knownFemale.includes(firstWord);
  }

  // 1. Doctor: دكتور / دكتورة / د. / د/ / د 
  const docMatch = str.match(/^([أا]?د(?:كتور[ةه]?|[\.\/\:\-\\]|\s+))\s*(.+)$/i);
  if(docMatch && docMatch[2] && docMatch[2].trim()){
    const rawPfx = docMatch[1].trim();
    const rest = cleanRestName(docMatch[2]);
    const title = (/دكتور[ةه]/i.test(rawPfx) || isFemaleName(rest)) ? 'دكتورة' : 'دكتور';
    return { title: title, name: rest };
  }

  // 2. Engineer: مهندس / مهندسة / م. / م/ / م 
  const engMatch = str.match(/^(مهندس[ةه]?|م[\.\/\:\-\\]|م\s+)\s*(.+)$/i);
  if(engMatch && engMatch[2] && engMatch[2].trim()){
    const rawPfx = engMatch[1].trim();
    const rest = cleanRestName(engMatch[2]);
    const title = (/مهندس[ةه]/i.test(rawPfx) || isFemaleName(rest)) ? 'مهندسة' : 'مهندس';
    return { title: title, name: rest };
  }

  // 3. Teacher / Mr / Ms: أستاذ / استاذ / أستاذة / استاذة / ا/ / أ/ / ا. / أ. / ا  / أ 
  const ostazMatch = str.match(/^([أإا]ستاذ[ةه]?|[أإا][\.\/\:\-\\]|[أإا]\s+)\s*(.+)$/i);
  if(ostazMatch && ostazMatch[2] && ostazMatch[2].trim()){
    const rawPfx = ostazMatch[1].trim();
    const rest = cleanRestName(ostazMatch[2]);
    const title = (/[أإا]ستاذ[ةه]/i.test(rawPfx) || isFemaleName(rest)) ? 'أستاذة' : 'أستاذ';
    return { title: title, name: rest };
  }

  // 4. Hajj: حاج / حاجة / الحاج / الحاجة
  const hajjMatch = str.match(/^((?:ال)?حاج[ةه]?(?:\s*[\/\:\-\\\.]\s*|\s+))\s*(.+)$/i);
  if(hajjMatch && hajjMatch[2] && hajjMatch[2].trim()){
    const rawPfx = hajjMatch[1].trim();
    const rest = cleanRestName(hajjMatch[2]);
    const title = (/حاج[ةه]/i.test(rawPfx) || isFemaleName(rest)) ? 'حاجة' : 'حاج';
    return { title: title, name: rest };
  }

  // 5. Sheikh: شيخ / الشيخ
  const sheikhMatch = str.match(/^((?:ال)?شيخ(?:\s*[\/\:\-\\\.]\s*|\s+))\s*(.+)$/i);
  if(sheikhMatch && sheikhMatch[2] && sheikhMatch[2].trim()){
    return { title: 'شيخ', name: cleanRestName(sheikhMatch[2]) };
  }

  // 6. Madam / Mrs / Miss: مدام / سيدة / السيدة / آنسة / انسة
  const madamMatch = str.match(/^(مدام|ال?سيد[ةه]|آنس[ةه]|انس[ةه])(?:\s*[\/\:\-\\\.]\s*|\s+)\s*(.+)$/i);
  if(madamMatch && madamMatch[2] && madamMatch[2].trim()){
    return { title: 'سيدة', name: cleanRestName(madamMatch[2]) };
  }

  // 7. Sayed / Mr: السيد / سيد (Only with delimiter or "السيد ")
  const sayedMatch = str.match(/^(السيد[ةه]?(?:\s*[\/\:\-\\\.]\s*|\s+)|سيد[ةه]?\s*[\/\:\-\\\.]\s*)\s*(.+)$/i);
  if(sayedMatch && sayedMatch[2] && sayedMatch[2].trim()){
    const rawPfx = sayedMatch[1].trim();
    const rest = cleanRestName(sayedMatch[2]);
    const title = (/سيد[ةه]/i.test(rawPfx) || isFemaleName(rest)) ? 'سيدة' : 'سيد';
    return { title: title, name: rest };
  }

  return { title: '', name: str };
}

function extractCustomerName(obj){
  if(!obj) return '';
  if(typeof obj !== 'object'){
    const parsed = parseCustomerTitleAndName(String(obj));
    return parsed.name || String(obj).trim();
  }
  const val = obj.CustomerName ?? obj.customerName ?? obj.Name ?? obj.name ?? obj.clientName ?? obj.ClientName ??
              obj['الاسم'] ?? obj['اسم العميل'] ?? obj['العميل'] ??
              (obj.customer ? (obj.customer.name ?? obj.customer.Name ?? obj.customer.CustomerName) : '') ?? '';
  const str = String(val).replace(/["']/g, '').trim();
  const parsed = parseCustomerTitleAndName(str);
  return parsed.name || str;
}

function getLevenshteinDistance(a, b){
  if(a === b) return 0;
  const la = a.length, lb = b.length;
  if(!la) return lb;
  if(!lb) return la;
  const d = [];
  for(let i=0; i<=la; i++){ d[i] = [i]; }
  for(let j=0; j<=lb; j++){ d[0][j] = j; }
  for(let i=1; i<=la; i++){
    for(let j=1; j<=lb; j++){
      const cost = a[i-1] === b[j-1] ? 0 : 1;
      d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + cost);
    }
  }
  return d[la][lb];
}

function normalizeCustomerSearchName(str){
  if(!str) return '';
  let s = String(str).trim().toLowerCase();
  s = s.replace(/[\u064B-\u065F]/g, ''); // Remove Arabic diacritics / tashkeel
  s = s.replace(/[أإآء]/g, 'ا');
  s = s.replace(/ة/g, 'ه');
  s = s.replace(/ى/g, 'ي');
  // Normalize common phonetic twin typos in Egyptian/Arabic names:
  s = s.replace(/ض/g, 'ص'); // مضطفي <-> مصطفي
  s = s.replace(/ظ/g, 'ز');
  s = s.replace(/ذ/g, 'ز');
  s = s.replace(/عبد\s+/g, 'عبد');
  s = s.replace(/ابو\s+/g, 'ابو');
  // Strip common titles
  s = s.replace(/^(دكتور|دكتورة|د\.|أستاذ|استاذ|أستاذة|استاذة|أ\.|ا\.|مهندس|مهندسة|م\.|سيدة|مدام|الحاج|حاج|شيخ|سيد)\s*[\/:-]?\s*/g, '');
  // Normalize punctuation and spacing
  s = s.replace(/[ـ\-_/\\.,:;]+/g, ' ').replace(/\s+/g, ' ').trim();
  return s;
}

function isCustomerPhoneValid(p){
  if(!p) return false;
  const s = String(p).trim();
  return s.length >= 7 && s !== '0000000000' && s !== '00000' && s !== 'undefined' && s !== 'null';
}

function findCustomerInDirectory(rawName){
  if(!rawName || typeof rawName !== 'string') return null;
  if(typeof state === 'undefined' || !state || !Array.isArray(state.customers) || !state.customers.length) return null;

  const clean = normalizeCustomerSearchName(rawName);
  if(!clean || clean === 'عميل' || clean === 'زبون') return null;

  const list = state.customers;
  const rawTrimmed = rawName.trim().toLowerCase();

  const matches = [];

  for(let i=0; i<list.length; i++){
    const c = list[i];
    if(!c) continue;
    const cn = (c.name || c.CustomerName || '').trim().toLowerCase();
    const cNorm = normalizeCustomerSearchName(c.name || c.CustomerName || '');
    const cTitle = (c.title || c.CustomerTitle || '').trim();
    const combinedNorm = normalizeCustomerSearchName((cTitle ? cTitle + ' ' : '') + (c.name || c.CustomerName || ''));

    let score = 0;
    if(cn && cn === rawTrimmed) { score = 100; }
    else if(cNorm && cNorm === clean) { score = 90; }
    else if(combinedNorm && combinedNorm === clean) { score = 85; }
    else if(cNorm && cNorm.replace('سايمه', 'ساميه') === clean.replace('سايمه', 'ساميه')) { score = 75; }
    else if(clean.length >= 4 && cNorm && Math.abs(cNorm.length - clean.length) <= 1 && typeof getLevenshteinDistance === 'function') {
      if(getLevenshteinDistance(cNorm, clean) <= 1) { score = 65; }
    }

    if(score > 0){
      matches.push({ c, score });
    }
  }

  if(!matches.length) return null;

  // Prioritize candidates with a valid phone number
  matches.sort((a, b) => {
    const aHasPhone = isCustomerPhoneValid(a.c.phone || a.c.CustomerPhone);
    const bHasPhone = isCustomerPhoneValid(b.c.phone || b.c.CustomerPhone);
    if(aHasPhone && !bHasPhone) return -1;
    if(!aHasPhone && bHasPhone) return 1;
    return b.score - a.score;
  });

  const best = matches[0].c;

  // Cross-pollinate phone if best match lacks it but another matched candidate has it
  const matchWithPhone = matches.find(m => isCustomerPhoneValid(m.c.phone || m.c.CustomerPhone));
  if(matchWithPhone && !isCustomerPhoneValid(best.phone || best.CustomerPhone)){
    const ph = matchWithPhone.c.phone || matchWithPhone.c.CustomerPhone;
    best.phone = ph;
    if(best.CustomerPhone !== undefined) best.CustomerPhone = ph;
  }

  return best;
}

function deduplicateCustomerDirectory(){
  if(typeof state === 'undefined' || !state || !Array.isArray(state.customers) || state.customers.length <= 1) return 0;
  const oldLen = state.customers.length;
  const mergedMap = new Map();

  state.customers.forEach(c => {
    if(!c) return;
    const rawName = (c.name || c.CustomerName || '').trim();
    const phone = (c.phone || c.CustomerPhone || '').trim();
    const title = (c.title || c.CustomerTitle || '').trim();
    const email = (c.email || c.CustomerEmail || '').trim();
    const taxNumber = (c.taxNumber || c.TaxNumber || '').trim();
    const address = (c.address || c.Address || '').trim();

    if(!rawName || rawName === 'عميل' || rawName === 'زبون') return;

    const normName = normalizeCustomerSearchName(rawName);
    const key = isCustomerPhoneValid(phone) ? ('p_' + phone) : ('n_' + normName);

    if(!mergedMap.has(key)){
      mergedMap.set(key, { title, name: rawName, phone, email, taxNumber, address });
    } else {
      const existing = mergedMap.get(key);
      if(!existing.phone && phone) existing.phone = phone;
      if(!existing.title && title) existing.title = title;
      if(!existing.email && email) existing.email = email;
      if(!existing.taxNumber && taxNumber) existing.taxNumber = taxNumber;
      if(!existing.address && address) existing.address = address;

      // Prefer canonical spelling without typos (e.g. مصطفى/مصطفي over مضطفي)
      if(existing.name.includes('مضط') && !rawName.includes('مضط')){
        existing.name = rawName;
      } else if(rawName.length >= existing.name.length && !rawName.includes('طط') && !rawName.includes('مضط')){
        existing.name = rawName;
      }
    }
  });

  const entries = Array.from(mergedMap.values());
  const finalCustomers = [];
  const handledEmpty = new Set();

  const withPhone = entries.filter(c => isCustomerPhoneValid(c.phone));
  const withoutPhone = entries.filter(c => !isCustomerPhoneValid(c.phone));

  withPhone.forEach(wp => {
    const wpNorm = normalizeCustomerSearchName(wp.name);
    withoutPhone.forEach(np => {
      const npNorm = normalizeCustomerSearchName(np.name);
      if(npNorm === wpNorm || (typeof getLevenshteinDistance === 'function' && wpNorm.length >= 4 && getLevenshteinDistance(wpNorm, npNorm) <= 1)){
        if(!wp.title && np.title) wp.title = np.title;
        if(!wp.email && np.email) wp.email = np.email;
        handledEmpty.add(np);
      }
    });
    finalCustomers.push(wp);
  });

  withoutPhone.forEach(np => {
    if(!handledEmpty.has(np)){
      finalCustomers.push(np);
    }
  });

  state.customers = finalCustomers;
  setCache('customers', state.customers);
  const removed = oldLen - finalCustomers.length;
  if(removed > 0){
    console.log(`Deduplicated customers: removed ${removed} duplicates, now ${finalCustomers.length} unique customers.`);
  }
  return removed;
}

function extractCustomerTitle(obj){
  if(!obj) return '';
  if(typeof obj === 'string'){
    const trimmed = obj.replace(/["`]/g, '').trim();
    if(CUSTOMER_TITLES.includes(trimmed)) return trimmed;
    const parsed = parseCustomerTitleAndName(trimmed);
    return parsed.title || '';
  }
  if(typeof obj !== 'object') return '';

  // 1. Explicit property on object
  let val = obj.CustomerTitle ?? obj.customerTitle ?? obj.Title ?? obj.title ??
            obj['اللقب'] ?? obj['صفة'] ?? obj['صفة العميل'] ??
            (obj.customer ? (obj.customer.title ?? obj.customer.Title ?? obj.customer.CustomerTitle) : '') ?? '';
  val = String(val).replace(/["`]/g, '').trim();
  if(val && CUSTOMER_TITLES.includes(val)) return val;

  // 2. Extract embedded prefix from customer name
  const rawName = obj.CustomerName ?? obj.customerName ?? obj.Name ?? obj.name ?? obj.clientName ?? obj.ClientName ??
                  obj['الاسم'] ?? obj['اسم العميل'] ?? obj['العميل'] ??
                  (obj.customer ? (obj.customer.name ?? obj.customer.Name ?? obj.customer.CustomerName) : '') ?? '';
  if(rawName && typeof rawName === 'string'){
    const parsed = parseCustomerTitleAndName(rawName);
    if(parsed.title) return parsed.title;
  }

  // 3. Fallback: Cross-reference with state.customers directory
  if(typeof findCustomerInDirectory === 'function' && rawName){
    const matched = findCustomerInDirectory(rawName);
    if(matched){
      const t = (matched.title || matched.CustomerTitle || (matched.customer && matched.customer.title) || '').trim();
      if(t && CUSTOMER_TITLES.includes(t)) return t;
    }
  }

  return val;
}

function extractCustomerPhone(obj){
  if(!obj) return '';
  if(typeof obj === 'string'){
    let s = (typeof toEngDigits === 'function' ? toEngDigits(obj) : String(obj)).replace(/["']/g, '').trim();
    if(s.length === 10 && /^[1][0125]\d{8}$/.test(s)) s = '0' + s;
    return s;
  }
  if(typeof obj !== 'object') return '';
  let val = obj.CustomerPhone ?? obj.customerPhone ?? obj.Phone ?? obj.phone ?? obj.mobile ?? obj.Mobile ??
            obj['الهاتف'] ?? obj['رقم الهاتف'] ?? obj['هاتف'] ?? obj['الموبايل'] ?? obj['موبايل'] ??
            obj['تليفون'] ?? obj['رقم التليفون'] ?? obj.Tel ?? obj.tel ?? obj.ClientPhone ?? obj.clientPhone ??
            (obj.customer ? (obj.customer.phone ?? obj.customer.Phone ?? obj.customer.CustomerPhone) : '') ?? '';
  let str = (typeof toEngDigits === 'function' ? toEngDigits(val) : String(val)).replace(/["']/g, '').trim();
  if(str.length === 10 && /^[1][0125]\d{8}$/.test(str)) str = '0' + str;

  if(str && str !== '0000000000' && str !== '00000' && str !== 'undefined' && str !== 'null'){
    return str;
  }

  // Fallback: Cross-reference with state.customers directory by customer name
  const rawName = obj.CustomerName ?? obj.customerName ?? obj.Name ?? obj.name ?? obj.clientName ?? obj.ClientName ??
                  obj['الاسم'] ?? obj['اسم العميل'] ?? obj['العميل'] ??
                  (obj.customer ? (obj.customer.name ?? obj.customer.Name ?? obj.customer.CustomerName) : '') ?? '';
  if(rawName && typeof findCustomerInDirectory === 'function'){
    const matched = findCustomerInDirectory(rawName);
    if(matched){
      let p = (typeof toEngDigits === 'function' ? toEngDigits(matched.phone ?? matched.CustomerPhone ?? matched.Phone ?? '') : String(matched.phone || '')).replace(/["']/g, '').trim();
      if(p.length === 10 && /^[1][0125]\d{8}$/.test(p)) p = '0' + p;
      if(p && p !== '0000000000' && p !== '00000'){
        if(obj.customer && typeof obj.customer === 'object') obj.customer.phone = p;
        if(obj.CustomerPhone !== undefined) obj.CustomerPhone = p;
        return p;
      }
    }
  }

  return '';
}

function formatCustomerFullName(objOrName, optTitle){
  if(typeof objOrName === 'string'){
    const parsed = parseCustomerTitleAndName(objOrName);
    const title = ((optTitle != null ? optTitle : parsed.title) || '').trim();
    const name = (parsed.name || objOrName).trim();
    return title ? `${title} / ${name}` : name;
  }
  const name = extractCustomerName(objOrName) || 'عميل';
  const title = (optTitle != null ? optTitle : extractCustomerTitle(objOrName)).trim();
  return title ? `${title} / ${name}` : name;
}

function extractCustomerEmail(obj){
  if(!obj || typeof obj !== 'object') return '';
  const val = obj.CustomerEmail ?? obj.customerEmail ?? obj.Email ?? obj.email ?? obj['البريد'] ?? obj['الإيميل'] ??
              (obj.customer ? (obj.customer.email ?? obj.customer.Email) : '') ?? '';
  return String(val).replace(/["']/g, '').trim();
}

/* Safe customer normalizer - links receipts to Customer Directory & heals typos */
function recoverAndSyncAllCustomerPhones(verbose = false){
  deduplicateCustomerDirectory();
  let matchedCount = 0;
  let namesSynced = 0;
  const receiptsToPersist = [];

  (state.receipts || []).forEach(r => {
    if(!r) return;
    const rawName = extractCustomerName(r);
    const title = extractCustomerTitle(r);
    const currentPhone = extractCustomerPhone(r);
    if(!r.customer || typeof r.customer !== 'object'){
      r.customer = { title: title || '', name: rawName || 'عميل', phone: currentPhone || '', email: extractCustomerEmail(r) };
    }

    let changed = false;

    // Cross reference with Customer Directory
    const matched = (typeof findCustomerInDirectory === 'function' && rawName) ? findCustomerInDirectory(rawName) : null;
    if(matched){
      const dirPhone = (matched.phone || matched.CustomerPhone || '').trim();
      const dirName = (matched.name || matched.CustomerName || '').trim();
      const dirTitle = (matched.title || matched.CustomerTitle || '').trim();

      if(dirName && (r.CustomerName !== dirName || r.customer.name !== dirName)){
        r.CustomerName = dirName;
        r.customer.name = dirName;
        changed = true;
        namesSynced++;
      }
      if(dirTitle && (r.CustomerTitle !== dirTitle || r.customer.title !== dirTitle)){
        r.CustomerTitle = dirTitle;
        r.customer.title = dirTitle;
        changed = true;
      }
      if(dirPhone && dirPhone !== '0000000000' && (!r.customer.phone || r.customer.phone === '0000000000')){
        r.customer.phone = dirPhone;
        r.CustomerPhone = dirPhone;
        changed = true;
        matchedCount++;
      }
    } else {
      if(!r.customer.phone && currentPhone && currentPhone !== '0000000000'){
        r.customer.phone = currentPhone;
        changed = true;
        matchedCount++;
      }
      if(r.customer.phone && !r.CustomerPhone){
        r.CustomerPhone = r.customer.phone;
        changed = true;
      }
      if(!r.CustomerTitle && title){
        r.CustomerTitle = title;
        changed = true;
      }
    }

    if(changed){
      receiptsToPersist.push(r);
    }
  });

  setCache('receipts', state.receipts);

  if(verbose){
    showToast(`تم ربط وتحديث جهات الاتصال (${matchedCount} رقم هاتف، ${namesSynced} اسم مصحح) بنجاح ✅`, 'success');
  }

  if(verbose && receiptsToPersist.length > 0){
    (async () => {
      for(const rec of receiptsToPersist){
        try { await apiPost('saveReceipt', { data: receiptToRow(rec), user: (state.user ? state.user.name : 'نظام') }); } catch(e){}
      }
    })();
  }

  return { recoveredCount: matchedCount, namesSynced, totalCustomers: (state.customers || []).length };
}

/* ---------------- Receipt Date & Time Helpers ---------------- */
function formatReceiptTime(rawR){
  if(!rawR) return '';
  const rawTime = rawR.time || rawR.Time || rawR['الوقت'] || rawR['وقت الاستلام'];
  if(rawTime && typeof rawTime === 'string' && rawTime.trim()){
    return rawTime.trim();
  }
  let dateObj = null;
  const recAt = rawR.receivedAt || rawR.ReceivedAt;
  const crAt = rawR.createdAt || rawR.CreatedAt;
  const rDate = rawR.date || rawR.Date;
  const rId = rawR.id || rawR.ID || rawR['رقم الجهاز'];

  if(recAt && !isNaN(new Date(recAt).getTime())){
    dateObj = new Date(recAt);
  } else if(crAt && !isNaN(new Date(crAt).getTime())){
    dateObj = new Date(crAt);
  } else if(rDate && String(rDate).length > 10 && !isNaN(new Date(rDate).getTime())){
    dateObj = new Date(rDate);
  } else if(rId && /^r_\d{12,14}$/.test(String(rId))){
    const ts = Number(String(rId).replace('r_', ''));
    if(!isNaN(ts) && ts > 1600000000000) dateObj = new Date(ts);
  }
  if(dateObj){
    try {
      const hours = dateObj.getHours();
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'م' : 'ص';
      const h12 = hours % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    } catch(e){}
  }
  return '';
}

function formatReceiptDateTime(rawR){
  if(!rawR) return '';
  const dStr = (typeof cleanDate === 'function') ? cleanDate(rawR.date || rawR.Date) : (String(rawR.date || rawR.Date || '').slice(0,10));
  const tStr = formatReceiptTime(rawR);
  return tStr ? `${dStr} — ${tStr}` : dStr;
}

/* ---- Mapping between internal shape and flat sheet rows ---- */
function receiptToRow(d){
  const cTitle = extractCustomerTitle(d);
  const cName = extractCustomerName(d);
  const cPhone = extractCustomerPhone(d);
  const cEmail = extractCustomerEmail(d);

  const pass = (d.device && d.device.password) || d.password || '';
  const timeStr = d.time || formatReceiptTime(d) || '';

  return {
    ID: d.id, ReceiptNumber: d.receiptNumber, Date: d.date, Time: timeStr,
    ReceivedAt: d.receivedAt || d.createdAt || '',
    CustomerTitle: cTitle, CustomerName: cName, CustomerPhone: cPhone, CustomerEmail: cEmail,
    Category: d.device.category, Brand: d.device.brand==='أخرى' ? d.device.brandOther : d.device.brand,
    Model: d.device.model, Accessories: d.device.accessories, Password: pass,
    Faults: (d.faults||[]).join('، '), FaultNotes: d.faultNotes,
    Technician: d.technician, Cost: d.cost, Deposit: d.deposit, Refunded: d.refunded || 0, PartsCost: d.partsCost || 0, PartsUsed: d.partsUsed || '',
    PartsJSON: (Array.isArray(d.partsList) && d.partsList.length) ? JSON.stringify(d.partsList) : (typeof d.partsJSON === 'string' ? d.partsJSON : ''),
    InspectionFee: d.inspectionFee != null ? d.inspectionFee : '',
    EstimateTime: d.estimateTime || '',
    Warranty: d.warranty || '',
    ServiceItems: (Array.isArray(d.serviceItems) && d.serviceItems.length) ? JSON.stringify(d.serviceItems) : '',
    Devices: (Array.isArray(d.devices) && d.devices.length) ? JSON.stringify(d.devices) : '',
    OtherAccountDesc: d.otherAccountDesc || '',
    OtherAccountAmount: Number(d.otherAccountAmount || 0),
    DeliveryDate: d.deliveryDate, Status: d.status, Paid: d.paid ? 'TRUE' : 'FALSE',
    Bonus: d.bonus || '', CreatedBy: d.createdBy, UpdatedBy: d.updatedBy, UpdatedAt: d.updatedAt,
    PreviousReceiptID: d.previousReceiptId || '', PreviousReceiptNumber: d.previousReceiptNumber || '',
    RootReceiptID: d.rootReceiptId || '', ReIntakeReason: d.reIntakeReason || '', ServiceCycle: d.serviceCycle || 1,
    NextReceiptID: d.nextReceiptId || '', NextReceiptNumber: d.nextReceiptNumber || ''
  };
}

function rowToReceipt(row){
  const cTitle = extractCustomerTitle(row);
  const cName = extractCustomerName(row);
  const cPhone = extractCustomerPhone(row);
  const cEmail = extractCustomerEmail(row);

  let sItems = [];
  if(Array.isArray(row.serviceItems)) sItems = row.serviceItems;
  else if(Array.isArray(row.ServiceItems)) sItems = row.ServiceItems;
  else {
    const rawS = row.ServiceItems || row.serviceItems;
    if(typeof rawS === 'string' && rawS.trim()){
      try { const p = JSON.parse(rawS); if(Array.isArray(p)) sItems = p; } catch(e){}
    }
  }

  const pass = row.Password || row.password || (row.device && row.device.password) || '';
  const timeStr = row.Time || row.time || row['الوقت'] || row['وقت الاستلام'] || '';
  const recAt = row.ReceivedAt || row.receivedAt || row.CreatedAt || row.createdAt || '';

  return {
    id: row.ID || row.id || row['رقم الجهاز'] || ('rec_' + Date.now() + '_' + Math.floor(Math.random()*1000)),
    receiptNumber: row.ReceiptNumber || row.receiptNumber || row['رقم الإيصال'] || row['رقم الايصال'] || '',
    date: row.Date || row.date || row['التاريخ'] || '',
    time: timeStr,
    receivedAt: recAt,
    createdAt: row.CreatedAt || row.createdAt || recAt,
    customer: {
      title: cTitle,
      name: cName || 'عميل',
      phone: cPhone,
      email: cEmail
    },
    device: {
      category: row.Category || row.category || (row.device && row.device.category) || 'لابتوب',
      brand: row.Brand || row.brand || (row.device && row.device.brand) || '',
      brandOther: (row.device && row.device.brandOther) || '',
      model: row.Model || row.model || (row.device && row.device.model) || '',
      accessories: row.Accessories || row.accessories || (row.device && row.device.accessories) || '',
      password: pass
    },
    password: pass,
    faults: row.Faults ? (Array.isArray(row.Faults) ? row.Faults : String(row.Faults).split('، ').filter(Boolean)) : (row.faults || []),
    faultNotes: row.FaultNotes || row.faultNotes || '',
    technician: row.Technician || row.technician || '',
    cost: row.Cost != null ? row.Cost : row.cost,
    deposit: row.Deposit != null ? row.Deposit : row.deposit,
    refunded: Number(row.Refunded || row.refunded || 0),
    partsCost: Number(row.PartsCost || row.partsCost || 0),
    partsUsed: row.PartsUsed || row.partsUsed || '',
    partsList: (()=>{
      const pRaw = row.PartsJSON || row.partsJSON || row.partsList;
      if(Array.isArray(pRaw)) return pRaw;
      if(typeof pRaw === 'string' && pRaw.trim()){
        try { const parsed = JSON.parse(pRaw); if(Array.isArray(parsed)) return parsed; } catch(e){}
      }
      return [];
    })(),
    inspectionFee: (row.InspectionFee != null && row.InspectionFee !== '') ? Number(row.InspectionFee) : ((row.inspectionFee != null && row.inspectionFee !== '') ? Number(row.inspectionFee) : null),
    estimateTime: row.EstimateTime || row.estimateTime || '',
    warranty: row.Warranty || row.warranty || '',
    serviceItems: sItems,
    otherAccountDesc: row.OtherAccountDesc || row.otherAccountDesc || '',
    otherAccountAmount: Number(row.OtherAccountAmount != null ? row.OtherAccountAmount : (row.otherAccountAmount || 0)),
    deliveryDate: row.DeliveryDate || row.deliveryDate || '',
    status: row.Status || row.status || 'قيد الفحص',
    paid: String(row.Paid).toUpperCase() === 'TRUE' || row.paid === true,
    bonus: row.Bonus || row.bonus || '',
    createdBy: row.CreatedBy || row.createdBy || '',
    updatedBy: row.UpdatedBy || row.updatedBy || '',
    updatedAt: row.UpdatedAt || row.updatedAt || '',
    previousReceiptId: row.PreviousReceiptID || row.previousReceiptId || '',
    previousReceiptNumber: row.PreviousReceiptNumber || row.previousReceiptNumber || '',
    rootReceiptId: row.RootReceiptID || row.rootReceiptId || '',
    reIntakeReason: row.ReIntakeReason || row.reIntakeReason || '',
    serviceCycle: Number(row.ServiceCycle || row.serviceCycle || 1),
    nextReceiptId: row.NextReceiptID || row.nextReceiptId || '',
    nextReceiptNumber: row.NextReceiptNumber || row.nextReceiptNumber || '',
    maintenanceHistory: row.maintenanceHistory || [],
    devices: (()=>{
      const rawD = row.Devices || row.devices;
      if(Array.isArray(rawD) && rawD.length) return rawD;
      if(typeof rawD === 'string' && rawD.trim()){
        try{ const p = JSON.parse(rawD); if(Array.isArray(p) && p.length) return p; }catch(e){}
      }
      return null;
    })()
  };
}

/* Master Normalizer for Maintenance Receipts to guarantee fault-tolerant operations */
function normalizeReceipt(r){
  if(!r || typeof r !== 'object') return null;

  // Guarantee ID is ALWAYS present and string
  if(!r.id){
    r.id = r.ID || r['رقم الجهاز'] || r['كود'] || r.receiptNumber || r.ReceiptNumber || r['رقم الإيصال'] || ('rec_' + Date.now() + '_' + Math.floor(Math.random()*1000));
  }
  r.id = String(r.id);

  // Guarantee Receipt Number is ALWAYS present and string
  if(!r.receiptNumber){
    r.receiptNumber = r.ReceiptNumber || r['رقم الإيصال'] || r['رقم الايصال'] || ('MT-' + (r.id || Date.now()));
  }
  r.receiptNumber = String(r.receiptNumber);

  // Normalize Date & Time
  r.date = r.date || r.Date || '';
  r.time = r.time || r.Time || (typeof formatReceiptTime === 'function' ? formatReceiptTime(r) : '');
  r.receivedAt = r.receivedAt || r.ReceivedAt || r.createdAt || r.CreatedAt || '';
  r.createdAt = r.createdAt || r.CreatedAt || r.receivedAt || '';

  // Normalize Customer
  const cTitle = extractCustomerTitle(r);
  const cName = extractCustomerName(r) || 'عميل';
  const cPhone = extractCustomerPhone(r);
  const cEmail = extractCustomerEmail(r);

  if(!r.customer || typeof r.customer !== 'object'){
    r.customer = {
      title: cTitle || '',
      name: cName,
      phone: cPhone || '',
      email: cEmail || ''
    };
  }
  if(!r.customer.title || !CUSTOMER_TITLES.includes(r.customer.title)) {
    r.customer.title = cTitle || r.customer.title || '';
  }
  r.customer.title = String(r.customer.title || '');
  r.CustomerTitle = r.customer.title;

  if(!r.customer.name || r.customer.name === 'عميل' || parseCustomerTitleAndName(r.customer.name).title){
    r.customer.name = cName;
  }
  r.customer.name = String(r.customer.name || 'عميل');
  r.CustomerName = r.customer.name;

  if(!r.customer.phone || r.customer.phone === '0000000000'){
    r.customer.phone = cPhone || '';
  }
  r.customer.phone = String(r.customer.phone || '');
  r.CustomerPhone = r.customer.phone;

  if(r.customer.email == null) r.customer.email = cEmail || '';
  r.customer.email = String(r.customer.email || '');
  r.CustomerEmail = r.customer.email;

  // Normalize Device
  const pass = String((r.device && r.device.password) || r.password || r.Password || '');
  if(!r.device || typeof r.device !== 'object'){
    r.device = {
      category: r.category || r.Category || 'لابتوب',
      brand: r.brand || r.Brand || '',
      brandOther: r.brandOther || '',
      model: r.model || r.Model || '',
      accessories: r.accessories || r.Accessories || '',
      password: pass
    };
  }
  r.device.category = String(r.device.category || 'أخرى');
  r.device.brand = String(r.device.brand != null ? r.device.brand : '');
  r.device.brandOther = String(r.device.brandOther != null ? r.device.brandOther : '');
  r.device.model = String(r.device.model != null ? r.device.model : '');
  r.device.accessories = String(r.device.accessories != null ? r.device.accessories : '');
  r.device.password = pass;
  r.password = pass;

  // Normalize Faults strictly as an Array of strings
  if(!Array.isArray(r.faults)){
    if(typeof r.faults === 'string' && r.faults.trim()){
      r.faults = r.faults.replace(/،/g, ',').split(',').map(s=>s.trim()).filter(Boolean);
    } else if(r.Faults){
      if(Array.isArray(r.Faults)){
        r.faults = r.Faults.slice();
      } else {
        r.faults = String(r.Faults).replace(/،/g, ',').split(',').map(s=>s.trim()).filter(Boolean);
      }
    } else {
      r.faults = [];
    }
  }

  // Normalize Service Items (بنود الصيانة المستحقة)
  if(!Array.isArray(r.serviceItems)){
    if(typeof r.serviceItems === 'string' && r.serviceItems.trim()){
      try { const p = JSON.parse(r.serviceItems); if(Array.isArray(p)) r.serviceItems = p; else r.serviceItems = []; } catch(e){ r.serviceItems = []; }
    } else if(r.ServiceItems){
      if(Array.isArray(r.ServiceItems)) r.serviceItems = r.ServiceItems;
      else if(typeof r.ServiceItems === 'string' && r.ServiceItems.trim()){
        try { const p = JSON.parse(r.ServiceItems); if(Array.isArray(p)) r.serviceItems = p; else r.serviceItems = []; } catch(e){ r.serviceItems = []; }
      } else { r.serviceItems = []; }
    } else {
      r.serviceItems = [];
    }
  }
  r.serviceItems = r.serviceItems.map(it => ({
    desc: String(it && it.desc != null ? it.desc : ''),
    price: Number(it && it.price != null ? it.price : 0)
  }));

  // Normalize Other Customer Account (حساب إضافي / سابق على العميل)
  r.otherAccountDesc = String(r.otherAccountDesc != null ? r.otherAccountDesc : (r.OtherAccountDesc || ''));
  r.otherAccountAmount = Number(r.otherAccountAmount != null ? r.otherAccountAmount : (r.OtherAccountAmount || 0));

  // Financial fields normalization
  r.cost = Number(r.cost != null ? r.cost : (r.Cost || 0));
  r.partsCost = Number(r.partsCost != null ? r.partsCost : (r.PartsCost || 0));
  r.deposit = Number(r.deposit != null ? r.deposit : (r.Deposit || 0));
  r.refunded = Number(r.refunded != null ? r.refunded : (r.Refunded || 0));

  // Normalize Devices (دعم استلام أكثر من جهاز في الإيصال الواحد)
  let rawDevs = r.devices || r.Devices;
  if(typeof rawDevs === 'string' && rawDevs.trim()){
    try {
      const p = JSON.parse(rawDevs);
      if(Array.isArray(p)) rawDevs = p;
    } catch(e){}
  }
  if(!Array.isArray(rawDevs) || rawDevs.length === 0){
    rawDevs = [
      {
        id: 'dev_1',
        category: String(r.device.category || 'لابتوب'),
        brand: String(r.device.brand || ''),
        brandOther: String(r.device.brandOther || ''),
        model: String(r.device.model || ''),
        accessories: String(r.device.accessories || ''),
        password: String(pass || ''),
        faults: Array.isArray(r.faults) ? [...r.faults] : [],
        faultNotes: String(r.faultNotes || ''),
        technician: String(r.technician || '')
      }
    ];
  } else {
    rawDevs = rawDevs.map((d, idx) => ({
      id: String(d.id || ('dev_' + (idx + 1))),
      category: String(d.category || r.device.category || 'لابتوب'),
      brand: String(d.brand != null ? d.brand : (r.device.brand || '')),
      brandOther: String(d.brandOther != null ? d.brandOther : ''),
      model: String(d.model != null ? d.model : ''),
      accessories: String(d.accessories != null ? d.accessories : ''),
      password: String(d.password != null ? d.password : (pass || '')),
      faults: Array.isArray(d.faults) ? d.faults.map(String) : (typeof d.faults === 'string' ? d.faults.split('، ').filter(Boolean) : []),
      faultNotes: String(d.faultNotes != null ? d.faultNotes : ''),
      technician: String(d.technician != null ? d.technician : (r.technician || ''))
    }));
  }
  r.devices = rawDevs;

  // Keep first device mirrored to top-level for 100% backward compatibility
  if(r.devices.length > 0){
    const d0 = r.devices[0];
    r.device.category = d0.category;
    r.device.brand = d0.brand;
    r.device.brandOther = d0.brandOther;
    r.device.model = d0.model;
    r.device.accessories = d0.accessories;
    r.device.password = d0.password;
    if(r.devices.length === 1){
      r.faults = d0.faults;
      r.faultNotes = d0.faultNotes;
    }
  }

  return r;
}

/* Safe universal receipt finder by String ID or Receipt Number */
function findReceiptByIdOrNum(queryId, queryNum){
  if(queryId == null && queryNum == null) return null;
  const qId = queryId != null ? String(queryId).trim().toLowerCase() : '';
  const qNum = queryNum != null ? String(queryNum).trim().toLowerCase() : '';
  if(!qId && !qNum) return null;

  const found = (state.receipts || []).find(x => {
    if(!x) return false;
    const xId = String(x.id != null ? x.id : (x.ID != null ? x.ID : (x['رقم الجهاز'] || ''))).trim().toLowerCase();
    const xNum = String(x.receiptNumber != null ? x.receiptNumber : (x.ReceiptNumber != null ? x.ReceiptNumber : (x['رقم الإيصال'] || (x['رقم الايصال'] || '')))).trim().toLowerCase();
    
    if(qId && (xId === qId || xNum === qId)) return true;
    if(qNum && (xId === qNum || xNum === qNum)) return true;
    return false;
  });
  return found ? normalizeReceipt(found) : null;
}

/* Entity Loaders */
async function loadSettings(){
  let s = {};
  try {
    s = (await apiGet('getSettings')) || {};
  } catch(e){}
  if(!state.settings) state.settings = {};

  // Parse JSON fields if they come as string from Google Sheets / remote
  ['printers', 'pos', 'knownWindowsPrinters', 'waTemplates', 'brands', 'commonFaults'].forEach(k => {
    if(s[k] && typeof s[k] === 'string'){
      try { s[k] = JSON.parse(s[k]); } catch(e){}
    }
  });

  // Restore persistent local printer configuration if remote has none or is offline
  try {
    const localPrn = localStorage.getItem('microerp_printers_settings');
    if(localPrn){
      const parsedPrn = JSON.parse(localPrn);
      s.printers = { ...(s.printers || {}), ...parsedPrn };
    }
    const localKnown = localStorage.getItem('microerp_known_printers');
    if(localKnown){
      const parsedKnown = JSON.parse(localKnown);
      if(!Array.isArray(s.knownWindowsPrinters) || s.knownWindowsPrinters.length === 0){
        s.knownWindowsPrinters = parsedKnown;
      }
    }
  } catch(e){}

  state.settings = { ...state.settings, ...s };
  if(!state.settings.shopName) state.settings.shopName = 'صيانة ميكروتك';
  setCache('settings', state.settings);
  return state.settings;
}

async function saveSettingRemote(key, value){
  if(!state.settings) state.settings = {};
  state.settings[key] = value;
  setCache('settings', state.settings);

  // Dedicated permanent local storage backups
  if(key === 'printers'){
    try { localStorage.setItem('microerp_printers_settings', typeof value === 'string' ? value : JSON.stringify(value)); } catch(e){}
  }
  if(key === 'knownWindowsPrinters'){
    try { localStorage.setItem('microerp_known_printers', typeof value === 'string' ? value : JSON.stringify(value)); } catch(e){}
  }

  return apiPost('saveSetting', {key, value});
}

function getReceiptPayments(r){
  if(!r) return [];
  const targetId = typeof r === 'object' ? String(r.id||'').trim() : String(r).trim();
  const targetNum = typeof r === 'object' && r.receiptNumber ? String(r.receiptNumber).trim() : '';
  return (state.payments||[]).filter(p => {
    const pId = String(p.ReceiptID||'').trim();
    return (targetId && pId === targetId) || (targetNum && pId === targetNum);
  });
}

async function loadPayments(receiptId){
  if(receiptId){
    return getReceiptPayments(receiptId);
  }
  const rows = await apiGet('getPayments');
  if(Array.isArray(rows)){
    state.payments = rows;
    setCache('payments', rows);
  }
  return state.payments;
}
// Dedup guard map to prevent duplicate payments within 15 seconds
const _recentPaymentGuards = new Map();

async function savePaymentRemote(receiptId, amount, note, paymentMethod){
  const payMethod = paymentMethod || 'نقدي (كاش)';
  const numAmt = Number(amount);
  const guardKey = `${String(receiptId).trim()}_${numAmt}_${payMethod}_${String(note||'').trim()}`;
  const now = Date.now();
  if(_recentPaymentGuards.has(guardKey) && (now - _recentPaymentGuards.get(guardKey)) < 15000){
    console.warn(`[savePaymentRemote] Duplicate payment suppressed for guardKey: ${guardKey}`);
    return { ok: true, duplicateSuppressed: true };
  }
  _recentPaymentGuards.set(guardKey, now);

  const payment = {
    ID: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    ReceiptID: receiptId, Date: new Date().toISOString().slice(0,10),
    Amount: numAmt, Note: note || '', By: state.user ? state.user.name : 'نظام',
    PaymentMethod: payMethod
  };
  state.payments.push(payment);
  setCache('payments', state.payments);
  recordAuditLog('تحصيل دفعة مالية', 'الخزينة', `تحصيل دفعة بقيمة ${amount} ج.م للإيصال (${receiptId}) - طريقة الدفع: ${payMethod} - البيان: ${note||'دفعة'}`, receiptId);
  
  // Auto Journal Entry: Route debit account based on payment method
  const pLow = String(payMethod).toLowerCase();
  const isCredit = pLow.includes('آجل') || pLow.includes('اجل') || pLow.includes('credit');
  const isBankOrWallet = pLow.includes('فيزا') || pLow.includes('card') || pLow.includes('انستاباي') || pLow.includes('إنستاباي') || pLow.includes('instapay') || pLow.includes('محفظ') || pLow.includes('فودافون') || pLow.includes('vodafone');
  
  const debitAccCode = isCredit ? '1103' : (isBankOrWallet ? '1102' : '1101');
  const debitAccName = isCredit ? 'العملاء والمدينون' : (isBankOrWallet ? 'البنك والحسابات الإلكترونية والمحافظ' : 'الخزينة الرئيسية (النقدية)');

  recordAutoJournalEntry(
    `تحصيل صيانة [${payMethod}] (${note || 'دفعة إيصال'})`,
    'Receipt',
    receiptId,
    [
      {AccountCode: debitAccCode, AccountName: debitAccName, Debit: numAmt, Credit: 0, Notes: `تحصيل عبر ${payMethod}`},
      {AccountCode: '4101', AccountName: 'إيرادات خدمات صيانة وتصليح', Debit: 0, Credit: numAmt, Notes: `إيصال: ${receiptId}`}
    ]
  ).catch(e=>{});
  return apiPost('savePayment', {id: payment.ID, receiptId, amount: payment.Amount, note: payment.Note, paymentMethod: payMethod, date: payment.Date, user: payment.By});
}

async function deletePaymentRemote(paymentId){
  const p = (state.payments||[]).find(x => String(x.ID) === String(paymentId));
  if(!p) return { ok: false, error: 'الدفعة غير موجودة' };
  
  // 1. Remove from state.payments and update cache
  state.payments = state.payments.filter(x => String(x.ID) !== String(paymentId));
  setCache('payments', state.payments);

  // 2. Adjust corresponding receipt if it exists
  const r = (state.receipts||[]).find(x => String(x.id) === String(p.ReceiptID) || String(x.receiptNumber) === String(p.ReceiptID));
  if(r){
    const totalDue = Number(r.cost||0) + Number(r.partsCost||0) + Number(r.otherAccountAmount||0);
    r.deposit = Math.max(0, Number(r.deposit || 0) - Number(p.Amount || 0));
    if(r.deposit < totalDue){
      r.paid = false;
    }
    setCache('receipts', state.receipts);
    try { await saveReceiptRemote(r); } catch(e){}
  }

  // 3. Reverse Auto-Journal Entry
  const payMethod = p.PaymentMethod || 'نقدي (كاش)';
  const pLow = String(payMethod).toLowerCase();
  const isCredit = pLow.includes('آجل') || pLow.includes('اجل') || pLow.includes('credit');
  const isBankOrWallet = pLow.includes('فيزا') || pLow.includes('card') || pLow.includes('انستاباي') || pLow.includes('إنستاباي') || pLow.includes('instapay') || pLow.includes('محفظ') || pLow.includes('فودافون') || pLow.includes('vodafone');
  const debitAccCode = isCredit ? '1103' : (isBankOrWallet ? '1102' : '1101');
  const debitAccName = isCredit ? 'العملاء والمدينون' : (isBankOrWallet ? 'البنك والحسابات الإلكترونية والمحافظ' : 'الخزينة الرئيسية (النقدية)');

  recordAutoJournalEntry(
    `إلغاء / عكس تحصيل صيانة [${payMethod}] (${p.Note || 'دفعة إيصال'})`,
    'Receipt_Void',
    p.ReceiptID,
    [
      {AccountCode: '4101', AccountName: 'إيرادات خدمات صيانة وتصليح', Debit: Number(p.Amount), Credit: 0, Notes: `عكس تحصيل دفعة صيانة: ${p.ReceiptID}`},
      {AccountCode: debitAccCode, AccountName: debitAccName, Debit: 0, Credit: Number(p.Amount), Notes: `عكس تحصيل عبر ${payMethod}`}
    ]
  ).catch(e=>{});

  recordAuditLog('حذف دفعة مالية', 'الخزينة', `تم حذف دفعة بقيمة ${p.Amount} ج.م للإيصال (${p.ReceiptID}) بواسطة ${state.user ? state.user.name : 'المدير'} وتصحيح رصيد الخزينة والإيصال`, p.ReceiptID);

  // 4. Send to backend
  return apiPost('deletePayment', { id: p.ID, receiptId: p.ReceiptID, amount: p.Amount, date: p.Date, role: state.user ? state.user.role : 'admin' });
}

function detectDuplicatePayments(payments = state.payments || []){
  const seen = new Map();
  const duplicates = [];
  (payments || []).forEach(p => {
    const key = `${String(p.ReceiptID||'').trim()}_${Number(p.Amount||0)}_${String(p.Date||'').slice(0,10)}_${String(p.Note||'').trim()}_${String(p.PaymentMethod||'').trim()}`;
    if(seen.has(key)){
      duplicates.push({ original: seen.get(key), duplicate: p });
    } else {
      seen.set(key, p);
    }
  });
  return duplicates;
}

async function cleanDuplicatePayments(){
  const duplicates = detectDuplicatePayments(state.payments || []);
  if(!duplicates.length){
    showToast('لا توجد أي دفعات مكررة في النظام ✨', 'success');
    return;
  }
  let count = 0;
  for(const item of duplicates){
    const dupP = item.duplicate;
    await deletePaymentRemote(dupP.ID);
    count++;
  }
  showToast(`تم تنظيف ${count} دفعة مكررة وتصحيح رصيد الخزينة والإيصالات بنجاح ✅`, 'success');
  if(state.currentSection === 'daily'){
    renderDailyJournalPage(document.getElementById('main'));
  } else {
    render();
  }
}

async function loadInventory(){
  const rows = await apiGet('getInventory');
  setCache('inventory', rows);
  return rows;
}
async function saveInventoryItemRemote(item){
  if(!item.ID) item.ID = 'inv_' + Date.now();
  const idx = state.inventory.findIndex(x=>x.ID===item.ID);
  if(idx>-1) state.inventory[idx] = item; else state.inventory.push(item);
  setCache('inventory', state.inventory);
  recordAuditLog('حفظ صنف مخزن', 'المخزن', `تسجيل / تعديل صنف بالمخزن: (${item.Name}) - الكمية: ${item.Quantity} - سعر البيع: ${item.SellPrice} ج.م`, item.ID);
  return apiPost('saveInventoryItem', {data:item});
}
async function deleteInventoryItemRemote(id){
  state.inventory = state.inventory.filter(x=>x.ID!==id);
  setCache('inventory', state.inventory);
  return apiPost('deleteInventoryItem', {id, role: state.user.role});
}
async function adjustInventoryQtyRemote(id, delta){
  const it = state.inventory.find(x=>x.ID===id);
  if(it) it.Quantity = Number(it.Quantity||0) + Number(delta);
  setCache('inventory', state.inventory);
  recordAuditLog('تعديل رصيد صنف', 'المخزن', `تعديل رصيد الصنف (${it ? it.Name : id}) بفارق (${delta}) - الرصيد الجديد: ${it ? it.Quantity : '-'}`, id);
  return apiPost('adjustInventoryQty', {id, delta});
}
async function refreshInventory(){ state.inventory = await loadInventory(); }

async function loadSales(){
  const rows = await apiGet('getSales');
  setCache('sales', rows);
  return rows;
}
async function saveSaleRemote(itemsSummary, itemsJson, total, customerName, customerPhone, paymentMethod, amountPaid, itemsList = []){
  const sale = {
    ID: 'sale_' + Date.now(), Date: new Date().toISOString().slice(0,10),
    ItemsSummary: itemsSummary, ItemsJSON: itemsJson||'', Total: Number(total||0),
    PaymentMethod: paymentMethod||'نقدي', AmountPaid: amountPaid!=null?Number(amountPaid):Number(total||0),
    CustomerName: customerName||'', CustomerPhone: customerPhone||'', By: state.user ? state.user.name : 'نظام'
  };
  state.sales.push(sale);
  setCache('sales', state.sales);

  // Auto-ensure customer is in directory if non-walk-in
  if(customerName && customerName !== 'عميل زائر' && customerName !== 'عميل' && customerName !== 'زبون'){
    const cPhone = (customerPhone || '').trim();
    const cNameLow = customerName.trim().toLowerCase();
    const existing = (state.customers || []).find(c => {
      if(cPhone && cPhone !== '0000000000' && c.phone === cPhone) return true;
      if((c.name||'').trim().toLowerCase() === cNameLow) return true;
      return false;
    });
    if(!existing){
      const newC = { title: '', name: customerName.trim(), phone: cPhone, email: '', taxNumber: '', address: '' };
      state.customers.push(newC);
      setCache('customers', state.customers);
      try { saveCustomerRemote(newC); } catch(e){}
    } else if(cPhone && cPhone !== '0000000000' && (!existing.phone || existing.phone === '0000000000')){
      existing.phone = cPhone;
      setCache('customers', state.customers);
      try { saveCustomerRemote(existing); } catch(e){}
    }
  }

  recordAuditLog('مبيعات كاشير POS', 'مبيعات', `فاتورة مبيعات POS بقيمة ${total} ج.م للعميل (${customerName||'عميل زائر'}) - الأصناف: ${itemsSummary}`, sale.ID);

  // Calculate Cost of Goods Sold (COGS)
  const cogsAmount = (itemsList || []).reduce((s, c) => {
    const invItem = (state.inventory || []).find(x => x.ID === (c.itemId || c.id));
    const buyPrice = invItem ? Number(invItem.PurchasePrice || 0) : Number(c.purchasePrice || 0);
    return s + (buyPrice * Number(c.qty || 1));
  }, 0);

  // Payment account routing
  const pLow = String(paymentMethod || '').toLowerCase();
  const isBankOrWallet = pLow.includes('فيزا') || pLow.includes('card') || pLow.includes('انستاباي') || pLow.includes('إنستاباي') || pLow.includes('instapay') || pLow.includes('محفظ') || pLow.includes('فودافون') || pLow.includes('vodafone');
  const isCredit = pLow.includes('آجل') || pLow.includes('اجل');
  const debitAccCode = isCredit ? '1103' : (isBankOrWallet ? '1102' : '1101');
  const debitAccName = isCredit ? 'العملاء والمدينون' : (isBankOrWallet ? 'البنك والحسابات الإلكترونية والمحافظ' : 'الخزينة الرئيسية (النقدية)');

  // Dual Journal Entry: 1) Cash & Revenue  2) COGS & Inventory Asset
  const journalLines = [
    {AccountCode: debitAccCode, AccountName: debitAccName, Debit: Number(total), Credit: 0, Notes: `مقبوضات مبيعات [${paymentMethod||'نقدي'}]`},
    {AccountCode: '4102', AccountName: 'إيرادات مبيعات بضائع وقطع غيار', Debit: 0, Credit: Number(total), Notes: itemsSummary}
  ];
  if(cogsAmount > 0){
    journalLines.push(
      {AccountCode: '5102', AccountName: 'تكلفة البضاعة المباعة (POS)', Debit: Number(cogsAmount), Credit: 0, Notes: `تكلفة مبيعات فاتورة: ${sale.ID}`},
      {AccountCode: '1104', AccountName: 'مخزون البضائع وقطع الغيار', Debit: 0, Credit: Number(cogsAmount), Notes: `صرف مخزون أصناف مباعة (${itemsSummary})`}
    );
  }

  const journalEntryObj = {
    ID: 'je_' + Date.now() + '_' + Math.floor(Math.random()*1000),
    EntryNumber: 'JE-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4),
    Date: sale.Date,
    Description: `فاتورة مبيعات POS [${paymentMethod || 'نقدي'}] (${itemsSummary})`,
    ReferenceType: 'POS_Sale',
    ReferenceID: sale.ID,
    LinesJSON: JSON.stringify(journalLines),
    Lines: journalLines,
    TotalDebit: Number(total) + Number(cogsAmount),
    TotalCredit: Number(total) + Number(cogsAmount),
    By: sale.By
  };
  if(!state.journalEntries) state.journalEntries = [];
  state.journalEntries.push(journalEntryObj);
  setCache('journal', state.journalEntries);

  const res = await apiPost('saveSale', {
    id: sale.ID,
    itemsSummary,
    itemsJson,
    total,
    customerName,
    customerPhone,
    paymentMethod,
    amountPaid,
    date: sale.Date,
    user: sale.By,
    items: itemsList.map(c => ({ itemId: c.itemId || c.id, qty: c.qty, price: c.price, purchasePrice: c.purchasePrice })),
    journalEntry: journalEntryObj
  });
  return { sale: res.sale || sale };
}

async function loadQuotations(){
  const rows = await apiGet('getQuotations');
  setCache('quotations', rows);
  return rows;
}
async function saveQuotationRemote(q){
  if(!q.ID) q.ID = 'quo_' + Date.now();
  if(!q.Payments) q.Payments = [];
  if(q.PaidAmount == null) q.PaidAmount = q.Payments.reduce((s,p)=>s+Number(p.Amount||0),0);
  
  const idx = state.quotations.findIndex(x => String(x.ID) === String(q.ID));
  if(idx > -1) state.quotations[idx] = q;
  else state.quotations.push(q);
  setCache('quotations', state.quotations);

  try {
    const res = await apiPost('saveQuotation', {data:q});
    return { quotation: res.quotation || q };
  } catch(e) {
    enqueueOfflineTask({ type:'saveQuotation', data:q });
    return { quotation: q };
  }
}

async function saveQuotationPaymentRemote(quotationId, amount, note){
  const q = state.quotations.find(x => String(x.ID) === String(quotationId));
  if(!q) throw new Error('تعذر العثور على عرض السعر المحدد');
  if(!q.Payments) q.Payments = [];
  const numAmt = Number(amount) || 0;
  if(numAmt <= 0) throw new Error('يرجى إدخال مبلغ صحيح للدفعة');

  const p = {
    ID: 'qp_' + Date.now() + '_' + Math.floor(Math.random()*1000),
    QuotationID: quotationId,
    Date: new Date().toISOString().slice(0, 10),
    Amount: numAmt,
    Note: note || 'دفعة / عربون من حساب عرض السعر',
    By: state.user ? state.user.name : 'نظام'
  };

  q.Payments.push(p);
  q.PaidAmount = (Number(q.PaidAmount) || 0) + numAmt;
  if(q.Status === 'معلق') q.Status = 'مقبول / جاري التنفيذ';
  if(q.PaidAmount >= Number(q.Total || 0)) q.Status = 'تم التنفيذ والتسليم';

  // Save to general payments
  if(!state.payments) state.payments = [];
  state.payments.push({
    ID: p.ID,
    ReceiptID: 'QUOTE_' + String(quotationId).slice(-8),
    Date: p.Date,
    Amount: p.Amount,
    Note: `تحصيل دفعة عرض سعر (${q.ClientName}) - ${p.Note}`,
    By: p.By
  });
  setCache('payments', state.payments);

  // Auto Journal Entry
  recordAutoJournalEntry(
    `تحصيل دفعة مشروع/عرض سعر (#${String(quotationId).slice(-8)} - ${q.ClientName})`,
    'Quotation',
    quotationId,
    [
      { AccountCode: '1101', AccountName: 'الخزينة الرئيسية (النقدية)', Debit: numAmt, Credit: 0, Notes: p.Note },
      { AccountCode: '4101', AccountName: 'إيرادات مشاريع وتوريدات وتركيبات', Debit: 0, Credit: numAmt, Notes: `عرض سعر #${String(quotationId).slice(-8)}` }
    ]
  ).catch(e=>{});

  await saveQuotationRemote(q);
  return q;
}

async function saveExpenseRemote(exp){
  if(!exp.ID) exp.ID = 'exp_' + Date.now();
  if(!exp.Date) exp.Date = new Date().toISOString().slice(0,10);
  exp.By = state.user ? state.user.name : 'نظام';
  const idx = state.expenses.findIndex(x=>x.ID===exp.ID);
  if(idx>-1) state.expenses[idx] = exp; else state.expenses.push(exp);
  setCache('expenses', state.expenses);

  // Auto Journal
  const isIncome = exp.Type === 'in' || exp.Type === 'income';
  const isDraw = !isIncome && (exp.Type === 'out' && (exp.Category === 'مسحوبات شخصية' || exp.Category === 'جاري الشركاء' || String(exp.Title||'').includes('مسحوبات')));
  const isPetty = exp.Type === 'petty' || exp.Category === 'بوفيه ونثريات' || exp.Category === 'نثريات';
  const isPosReturn = exp.Category === 'مرتجع مبيعات POS' || exp.AccountCode === '4102-RET' || exp.Type === 'pos_return';
  const isSupplierPayment = exp.Category === 'موردين' || exp.Category === 'الموردين' || exp.Category === 'سداد موردين ومشتريات' || (String(exp.Category||'').includes('مورد')) || exp.Type === 'supplier' || exp.skipAutoJournal || isPosReturn;

  if(isSupplierPayment || isPosReturn || exp.skipAutoJournal){
    // Suppress general operating expense journal entry; handled specifically by the dedicated module (Supplier Payments, POS Returns, etc.)
  } else if(isIncome){
    const pLow = String(exp.PaymentMethod || 'نقدي').toLowerCase();
    const isBank = pLow.includes('فيزا') || pLow.includes('card') || pLow.includes('انستاباي') || pLow.includes('إنستاباي') || pLow.includes('محفظ') || pLow.includes('فودافون');
    const debitCode = isBank ? '1102' : '1101';
    const debitName = isBank ? 'البنك والحسابات الإلكترونية والمحافظ' : 'الخزينة الرئيسية (النقدية)';
    recordAutoJournalEntry(
      `إيداع وارد: ${exp.Title}`,
      'CashIn',
      exp.ID,
      [
        {AccountCode:debitCode, AccountName:debitName, Debit:Number(exp.Amount), Credit:0, Notes:exp.Title},
        {AccountCode:'42', AccountName:'إيرادات أخرى متنوعة', Debit:0, Credit:Number(exp.Amount), Notes:exp.Notes||exp.Title}
      ]
    ).catch(e=>{});
  } else if(isDraw){
    const pLow = String(exp.PaymentMethod || 'نقدي').toLowerCase();
    const isBank = pLow.includes('فيزا') || pLow.includes('card') || pLow.includes('انستاباي') || pLow.includes('إنستاباي') || pLow.includes('محفظ') || pLow.includes('فودافون');
    const creditCode = isBank ? '1102' : '1101';
    const creditName = isBank ? 'البنك والحسابات الإلكترونية والمحافظ' : 'الخزينة الرئيسية (النقدية)';
    recordAutoJournalEntry(
      `منصرف مسحوبات: ${exp.Title}`,
      'CashOut',
      exp.ID,
      [
        {AccountCode:'3103', AccountName:'جاري الشركاء والمسحوبات', Debit:Number(exp.Amount), Credit:0, Notes:exp.Title},
        {AccountCode:creditCode, AccountName:creditName, Debit:0, Credit:Number(exp.Amount), Notes:exp.Notes||exp.Title}
      ]
    ).catch(e=>{});
  } else {
    const expAccCode = EXPENSE_ACCOUNT_MAP[exp.Category] || (isPetty ? '5204' : '52');
    const expAcc = state.accounts.find(a=>a.Code===expAccCode) || {Name: isPetty ? 'بوفيه ونثريات وضيافة' : 'المصروفات التشغيلية'};
    const pLow = String(exp.PaymentMethod || 'نقدي').toLowerCase();
    const isBank = pLow.includes('فيزا') || pLow.includes('card') || pLow.includes('انستاباي') || pLow.includes('إنستاباي') || pLow.includes('محفظ') || pLow.includes('فودافون');
    const creditCode = isBank ? '1102' : '1101';
    const creditName = isBank ? 'البنك والحسابات الإلكترونية والمحافظ' : 'الخزينة الرئيسية (النقدية)';
    recordAutoJournalEntry(
      `${isPetty?'نثريات':'مصروف'}: ${exp.Title} (${exp.Category})`,
      'Expense',
      exp.ID,
      [
        {AccountCode:expAccCode, AccountName:expAcc.Name, Debit:Number(exp.Amount), Credit:0, Notes:exp.Notes||exp.Title},
        {AccountCode:creditCode, AccountName:creditName, Debit:0, Credit:Number(exp.Amount), Notes: `سداد عبر ${exp.PaymentMethod || 'نقدي'}`}
      ]
    ).catch(e=>{});
  }

  return apiPost('saveExpense', {data: exp, user: exp.By});
}
async function deleteExpenseRemote(id){
  state.expenses = state.expenses.filter(x=>x.ID!==id);
  setCache('expenses', state.expenses);
  return apiPost('deleteExpense', {id, role: state.user.role});
}

async function loadServices(){
  const rows = await apiGet('getServices');
  setCache('services', rows);
  return rows;
}
async function loadPurchases(){
  const rows = await apiGet('getPurchases');
  setCache('purchases', rows);
  return rows;
}
async function savePurchaseRemote(p, itemsList = []){
  if(!p.ID) p.ID = 'pur_' + Date.now();
  if(!p.Date) p.Date = new Date().toISOString().slice(0, 10);
  p.By = state.user ? state.user.name : 'نظام';
  p.Total = Number(p.Total || 0);
  p.AmountPaid = p.AmountPaid != null ? Number(p.AmountPaid) : p.Total;
  const remaining = Math.max(0, p.Total - p.AmountPaid);

  const idx = state.purchases.findIndex(x => String(x.ID) === String(p.ID));
  if(idx > -1) state.purchases[idx] = p;
  else state.purchases.push(p);
  setCache('purchases', state.purchases);

  // Auto-increment local inventory
  if(Array.isArray(itemsList) && itemsList.length > 0){
    for(const it of itemsList){
      if(!it.itemId) continue;
      const invItem = (state.inventory || []).find(x => x.ID === it.itemId);
      if(invItem){
        invItem.Quantity = Number(invItem.Quantity || 0) + Number(it.qty || 0);
        if(it.purchasePrice != null && Number(it.purchasePrice) > 0){
          invItem.PurchasePrice = Number(it.purchasePrice);
        }
      }
    }
    setCache('inventory', state.inventory);
  }

  // Auto Journal Entry for Purchase:
  // Dr. 1104 (مخزون البضائع وقطع الغيار): Total
  // Cr. 1101/1102 (الخزينة/البنك): AmountPaid
  // Cr. 2101 (الموردون والدائنون): Remaining
  const journalLines = [
    { AccountCode: '1104', AccountName: 'مخزون البضائع وقطع الغيار', Debit: p.Total, Credit: 0, Notes: `شراء وتوريد مخزون (${p.Supplier} - ${p.ItemsSummary})` }
  ];
  if(p.AmountPaid > 0){
    const pLow = String(p.PaymentMethod || 'نقدي').toLowerCase();
    const isBank = pLow.includes('فيزا') || pLow.includes('card') || pLow.includes('انستاباي') || pLow.includes('محفظ') || pLow.includes('فودافون');
    journalLines.push({
      AccountCode: isBank ? '1102' : '1101',
      AccountName: isBank ? 'البنك والحسابات الإلكترونية والمحافظ' : 'الخزينة الرئيسية (النقدية)',
      Debit: 0,
      Credit: p.AmountPaid,
      Notes: `سداد مشتريات للمورد: ${p.Supplier}`
    });
  }
  if(remaining > 0){
    journalLines.push({
      AccountCode: '2101',
      AccountName: 'الموردون والدائنون',
      Debit: 0,
      Credit: remaining,
      Notes: `رصيد آجل لمورد (${p.Supplier}) فاتورة #${String(p.ID).slice(-6)}`
    });
  }

  const je = {
    ID: 'je_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    EntryNumber: 'JE-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4),
    Date: p.Date,
    Description: `فاتورة شراء وتوريد مخزون (${p.Supplier} - ${p.ItemsSummary})`,
    ReferenceType: 'Purchase',
    ReferenceID: p.ID,
    LinesJSON: JSON.stringify(journalLines),
    Lines: journalLines,
    TotalDebit: p.Total,
    TotalCredit: p.Total,
    By: p.By
  };
  if(!state.journalEntries) state.journalEntries = [];
  state.journalEntries.push(je);
  setCache('journal', state.journalEntries);

  recordAuditLog('فاتورة شراء', 'المخزن', `تسجيل فاتورة شراء من المورد (${p.Supplier}) بقيمة ${p.Total} ج.م - الأصناف: ${p.ItemsSummary}`, p.ID);

  return apiPost('savePurchase', {
    id: p.ID,
    date: p.Date,
    supplier: p.Supplier,
    supplierId: p.SupplierID || '',
    itemsSummary: p.ItemsSummary,
    total: p.Total,
    amountPaid: p.AmountPaid,
    warrantyMonths: p.WarrantyMonths || '',
    items: itemsList,
    journalEntry: je,
    user: p.By
  });
}
async function loadSuppliers(){
  const rows = await apiGet('getSuppliers');
  setCache('suppliers', rows);
  return rows;
}
async function saveSupplierRemote(s){
  if(!s.ID) s.ID = 'sup_' + Date.now();
  if(!s.Title && s.title) s.Title = s.title;
  s.Title = s.Title || '';
  const idx = state.suppliers.findIndex(x => (s.ID && x.ID === s.ID) || (s.Name && x.Name === s.Name));
  if(idx > -1) state.suppliers[idx] = s;
  else state.suppliers.push(s);
  setCache('suppliers', state.suppliers);
  return apiPost('saveSupplier', {data:s});
}

async function loadExpenses(){
  const rows = await apiGet('getExpenses');
  setCache('expenses', rows);
  return rows;
}

/* ---------------- Invoices Management & Conversion Engine ---------------- */
async function loadInvoices(){
  const rows = await apiGet('getInvoices');
  const mapped = (Array.isArray(rows)?rows:[]).map(inv=>({
    ...inv,
    Items: typeof inv.ItemsJSON==='string' ? (JSON.parse(inv.ItemsJSON||'[]')) : (inv.Items||[])
  }));
  state.invoices = mapped;
  setCache('invoices', mapped);
  return mapped;
}
async function saveInvoiceRemote(inv){
  if(!inv.ID) inv.ID = 'inv_' + Date.now();
  if(!inv.InvoiceNumber) inv.InvoiceNumber = 'INV-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4);
  if(!inv.Date) inv.Date = new Date().toISOString().slice(0,10);
  if(!inv.DueDate) inv.DueDate = inv.Date;
  inv.By = state.user ? state.user.name : 'نظام';
  const idx = state.invoices.findIndex(x=>x.ID===inv.ID);
  if(idx>-1) state.invoices[idx] = inv; else state.invoices.push(inv);
  setCache('invoices', state.invoices);

  // Auto-ensure invoice customer is saved to directory
  if(inv.CustomerName && inv.CustomerName !== 'عميل زائر' && inv.CustomerName !== 'عميل' && inv.CustomerName !== 'زبون'){
    const cPhone = String(inv.CustomerPhone || '').trim();
    const cNameLow = String(inv.CustomerName).trim().toLowerCase();
    const existing = (state.customers || []).find(c => {
      if(cPhone && cPhone !== '0000000000' && c.phone === cPhone) return true;
      if((c.name||'').trim().toLowerCase() === cNameLow) return true;
      return false;
    });
    if(!existing){
      const newC = {
        title: inv.CustomerTitle || '',
        name: inv.CustomerName.trim(),
        phone: cPhone,
        email: '',
        taxNumber: inv.CustomerTaxNumber || '',
        address: inv.CustomerAddress || ''
      };
      state.customers.push(newC);
      setCache('customers', state.customers);
      try { saveCustomerRemote(newC); } catch(e){}
    } else {
      let changed = false;
      if(cPhone && cPhone !== '0000000000' && (!existing.phone || existing.phone === '0000000000')){
        existing.phone = cPhone;
        changed = true;
      }
      if(inv.CustomerTaxNumber && !existing.taxNumber){ existing.taxNumber = inv.CustomerTaxNumber; changed = true; }
      if(inv.CustomerAddress && !existing.address){ existing.address = inv.CustomerAddress; changed = true; }
      if(changed){
        setCache('customers', state.customers);
        try { saveCustomerRemote(existing); } catch(e){}
      }
    }
  }

  return apiPost('saveInvoice', {data: inv, user: inv.By});
}
async function deleteInvoiceRemote(id){
  state.invoices = state.invoices.filter(x=>x.ID!==id);
  setCache('invoices', state.invoices);
  return apiPost('deleteInvoice', {id, role: state.user.role});
}
