/* ---------------- Static Config & Defaults ---------------- */
const DEFAULT_BRANDS = {
  'لابتوب': ['Apple','HP','Dell','Lenovo','Toshiba','Asus','Acer','Huawei','MSI','أخرى'],
  'موبايل': ['iPhone','Samsung','Oppo','Xiaomi','Redmi','Realme','Infinix','Huawei','أخرى'],
  'تابلت': ['Apple','Samsung','Lenovo','Huawei','أخرى'],
  'كاميرات مراقبة': ['Hikvision','Dahua','EZVIZ','Uniview','أخرى'],
  'كمبيوتر مكتبي': ['Dell','HP','Lenovo','تجميع','أخرى'],
  'شاشات': ['Samsung','LG','Dell','HP','BenQ','أخرى'],
  'طابعات': ['HP','Canon','Epson','Brother','أخرى'],
  'اكسسوار': ['أخرى'],
  'أخرى': ['أخرى']
};
const BRANDS = DEFAULT_BRANDS;

const DEFAULT_COMMON_FAULTS = ['باور / لا يعمل','شاشة / كسر','شحن / سوكت','ماء / سوائل','سوفتوير / ويندوز','كاميرا / عدسة','بطارية','سماعة / مايك','لوحة مفاتيح','فيروسات','بطء في الأداء','تسخين / مروحة','داتا / هارد ديسك','أخرى'];
const COMMON_FAULTS = DEFAULT_COMMON_FAULTS;

const STATUSES = [
  {v:'قيد الفحص', cls:'st-check', icon:'', desc:'جاري الفحص والتشخيص'},
  {v:'الصيانة', cls:'st-repair', icon:'', desc:'قيد الإصلاح الفعلي'},
  {v:'مكتمل', cls:'st-done', icon:'', desc:'تم الانتهاء وجاهز للتسليم'},
  {v:'تم التسليم', cls:'st-delivered', icon:'', desc:'تم تسليم الجهاز للعميل بنجاح'},
  {v:'تعذرت الصيانة', cls:'st-failed', icon:'', desc:'تعذر الإصلاح'},
  {v:'رفض العميل', cls:'st-rejected', icon:'', desc:'رفض العميل التكلفة/الإصلاح'}
];
const EXPENSE_CATEGORIES = ['إيجار','كهرباء ومياه','بوفيه ونثريات','أدوات وصيانة مقر','شحن وتوصيل','رواتب وسلفيات','دعاية وإعلانات','أخرى'];

const DEFAULT_TERMS = `1) فترة الفحص: يتم فحص الجهاز وتسعير التكلفة خلال مدة أقصاها 48 ساعة من الاستلام، ولا يتم الإصلاح النهائي إلا بعد موافقة العميل.
2) استلام الأجهزة: الشركة غير مسؤولة عن أي جهاز متروك أكثر من 30 يوماً من إشعار العميل بالانتهاء.
3) الضمان: يسري على قطع الغيار المبدلة والخدمة لمدة محددة حسب نوع الإصلاح، ولا يشمل سوء الاستخدام أو السوائل أو الكسر.
4) البيانات: الشركة غير مسؤولة عن فقدان البيانات، يرجى أخذ نسخة احتياطية مسبقاً.
5) لا يُسلم الجهاز إلا بموجب هذا الإيصال الأصلي أو إثبات الهوية.`;
const TERMS = DEFAULT_TERMS;

const DEFAULT_INVOICE_TERMS = `• البضاعة المباعة تخضع للضمان المحدد بالفاتورة والشركة غير مسؤولة عن سوء الاستخدام أو التلف الناتج عن تذبذب التيار الكهربائي.
• لا يُقبل الاسترجاع أو الاستبدال إلا بوجود أصل الفاتورة وخلال المدة القانونية المقررة.`;

const DEFAULT_QUOTE_TERMS = `• هذا البيان يعتبر عرض أسعار رسمي صالح لمدة 14 يوماً من تاريخ إصداره.
• الأسعار والكميات الموضحة تشمل التوريد والتركيب والبرمجة وفق المواصفات المحددة.
• الضمان يسري لمدة عام كامل ضد عيوب الصناعة على الأجهزة والمعدات مع توفير الدعم الفني.
• يشترط لبدء التنفيذ سداد الدفعة المقدمة المتفق عليها واعتماد موقع ومسارات التمديدات.`;

const DEFAULT_QUOTE_AGREEMENT_TERMS = `بند (1): موضوع العقد: يلتزم الطرف الأول (المنفذ) بتوريد وتركيب وتشغيل وبرمجة المنظومة الموضحة بجدول البنود بعاليه طبقاً لأعلى معايير الجودة والأصول الفنية المعمول بها.
بند (2): شروط وسداد الدفعات: يلتزم الطرف الثاني (العميل) بسداد القيمة الإجمالية على النحو التالي: (50% دفعة مقدمة عند توقيع العقد وبدء الأعمال، 30% عند توريد المهمات والأجهزة بالموقع، و20% دفعة ختامية عند التشغيل النهائي والتسليم).
بند (3): التزامات العميل: يلتزم الطرف الثاني بتوفير مصادر التغذية الكهربائية والإنترنت اللازمة ومسارات التمديدات وتأمين فريق العمل وتسهيل الدخول للموقع.
بند (4): فترة الضمان والدعم الفني: يضمن الطرف الأول جودة المهمات والأجهزة لمدة (12 شهراً) من تاريخ الاستلام، مع تقديم خدمات الدعم الفني والصيانة المجانية للأعطال الفنية غير الناتجة عن سوء الاستخدام أو الكوارث الطبيعية وتذبذب التيار.
بند (5): الملكية ومحضر التسليم: تظل كافة المهمات والأجهزة ملكاً للطرف الأول حتى سداد كامل المستحقات المالية، ويحرر محضر تسليم وتشغيل رسمي موقع من الطرفين فور إتمام المشروع.`;

const DEFAULT_WA_TEMPLATES = {
  cost_estimate: `مرحبًا {customer_name}
بخصوص جهازكم المسجل لدينا بمركز {shop_name}:
الجهاز: {device}
إيصال صيانة رقم: #{receipt_no}
تاريخ الاستلام: {date}

تقرير الفحص وتشخيص العطل:
{faults_report}

━━━━━━━━━━━━━━━━━━━━
عرض ومقايسة تكلفة الصيانة:

[في حالة الموافقة على الإصلاح]:
• إجمالي تكلفة الصيانة وقطع الغيار: *{cost} ج.م*
{deposit_info}
• المبلغ المطلوب سداده عند الاستلام: *{remaining} ج.م*
• مدة الإصلاح المتوقعة: *{estimate_time}*
{warranty_info}

[في حالة عدم الرغبة في الإصلاح (رفض الصيانة)]:
• تكلفة فحص الجهاز وتشخيص العطل الفني: *{inspection_fee} ج.م* فقط.
(ملاحظة: لا تُدفع أي رسوم فحص في حالة الموافقة على الإصلاح).
━━━━━━━━━━━━━━━━━━━━

يرجى الرد على هذه الرسالة بتأكيد (موافق) للبدء في صيانة الجهاز فوراً، أو إبلاغنا في حال رغبتكم بالاستلام.

تتبع حالة جهازك مباشرة عبر الرابط:
{track_url}

{shop_name}
هاتف: {shop_phone}
العنوان: {shop_address}`,
  intake: `مرحبًا {customer_name}\nتم استلام جهازكم ({device}) بنجاح وقيده برقم إيصال: #{receipt_no} بمركز {shop_name}\nالتاريخ: {date} {time}\nالعطل المسجل: {faults}\n{deposit_info}\nلمتابعة مراحل الفحص والصيانة مباشرة:\n{track_url}\n\nسعداء بخدمتكم دائماً!`,
  check: `مرحبًا {customer_name}\nنحيطكم علماً بأن جهازكم ({device}) قيد الفحص والتشخيص الفني الدقيق حالياً\nرقم الإيصال: #{receipt_no}\nتتبع حالة الفحص مباشرة: {track_url}\n{shop_name}`,
  repair: `مرحبًا {customer_name}\nتمت المباشرة والبدء في أعمال صيانة وإصلاح جهازكم ({device}) بمركز {shop_name}\nرقم الإيصال: #{receipt_no}\nتتبع حالة جهازك مباشرة: {track_url}`,
  done: `مرحبًا {customer_name}\nيسعدنا إبلاغكم بأنه تم الانتهاء من صيانة جهازكم ({device}) بنجاح وهو جاهز للاستلام الآن بفرع {shop_name}\n\nرقم الإيصال: #{receipt_no}\nالمبلغ المتبقي المطلوب: *{remaining} ج.م*\nتفاصيل الإيصال والمتابعة:\n{track_url}\n\nشكراً لثقتكم الغالية بنا!`,
  delivered: `مرحبًا {customer_name}\nتم تسليم جهازكم ({device}) بنجاح بموجب الإيصال رقم #{receipt_no}\nيسري الضمان المعتمد على الخدمة وقطع الغيار المبدلة وفق شروط الإيصال.\nسعدنا بخدمتكم في {shop_name}، ونتطلع دائماً لخدمتكم!`,
  pending: `مرحبًا {customer_name}\nنود إحاطتكم بأن صيانة جهازكم ({device}) بموجب الإيصال #{receipt_no} معلقة مؤقتاً\nيرجى التواصل معنا لتأكيد مقايسة التكلفة أو التوجيه بشأن الصيانة.\nتتبع الجهاز: {track_url}\n{shop_name} - هاتف: {shop_phone}`,
  warranty: `مرحبًا {customer_name}\nتم قيد جهازكم ({device}) بموجب الإيصال #{receipt_no} تحت مظلة الضمان المعتمد\nجاري المتابعة والفحص الفني اللازم مجاناً.\nرابط المتابعة: {track_url}\n{shop_name}`,
  overdue: `مرحبًا {customer_name}\nنود تذكيركم بوجود جهازكم ({device}) جاهزاً للاستلام لدينا في {shop_name} بموجب الإيصال رقم #{receipt_no}\nالمتبقي المطلوب: *{remaining} ج.م*.\nيرجى التفضل بالاستلام خلال أوقات العمل الرسمية.\nتتبع الجهاز: {track_url}`,
  unrepairable: `مرحبًا {customer_name}\nبخصوص جهازكم ({device}) بموجب الإيصال رقم #{receipt_no}، نعتذر منك حيث تعذر الإصلاح لعدم توفر قطع الغيار أو طبيعة العطل.\nيمكنك التفضل لاستلام الجهاز في أي وقت من {shop_name}.`,
  rejected: `مرحبًا {customer_name}\nبناءً على طلبكم، تم إلغاء الصيانة لجهازكم ({device}) بموجب الإيصال رقم #{receipt_no} والجهاز جاهز للاستلام في {shop_name}.`
};

/* Settings Getter Helpers */
function getBrands(){ return (state.settings && state.settings.brands) || DEFAULT_BRANDS; }
function getCommonFaults(){ return (state.settings && state.settings.commonFaults) || DEFAULT_COMMON_FAULTS; }
function getTerms(){ return (state.settings && state.settings.terms) || DEFAULT_TERMS; }
function getInvoiceTerms(){ return (state.settings && state.settings.invoiceTerms) || DEFAULT_INVOICE_TERMS; }
function getQuoteTerms(){ return (state.settings && state.settings.quoteTerms) || DEFAULT_QUOTE_TERMS; }
function getQuoteAgreementTerms(){ return (state.settings && state.settings.quoteAgreementTerms) || DEFAULT_QUOTE_AGREEMENT_TERMS; }
function getWaTemplate(key){
  if(state.settings && state.settings.waTemplates && state.settings.waTemplates[key]){
    return state.settings.waTemplates[key];
  }
  return DEFAULT_WA_TEMPLATES[key] || '';
}

const DEFAULT_GEMINI_SETTINGS = {
  enabled: true,
  apiKey: '',
  model: 'gemini-3.5-flash',
  temperature: 0.7,
  systemInstruction: 'أنت مهندس خبير ومساعد ذكي متخصص في صيانة أجهزة الكمبيوتر واللابتوب والهواتف الذكية والإلكترونيات لمركز صيانة ميكروتك (MicroTech). تقدم تحليلات فنية دقيقة ومباشرة باللغة العربية، وتقترح نقاط الفحص والقياس بالآفوميتر والقطع البديلة وخطوات الإصلاح، وتصيغ تقارير فحص احترافية للعملاء.'
};

function getGeminiSettings(){
  const s = (state.settings && state.settings.gemini) || {};
  return {
    enabled: s.enabled !== false,
    apiKey: (s.apiKey || (function(){ try{ return localStorage.getItem('microtech_gemini_api_key'); }catch(e){ return ''; } })() || '').trim(),
    model: s.model || 'gemini-3.5-flash',
    temperature: s.temperature ?? 0.7,
    systemInstruction: s.systemInstruction || DEFAULT_GEMINI_SETTINGS.systemInstruction
  };
}

const DEFAULT_POS_SETTINGS = {
  shortcutItemIds: [],
  paymentMethods: [
    { id: 'cash', name: 'نقدي (كاش)', iconName: 'dollar', enabled: true },
    { id: 'vodafone', name: 'فودافون كاش ومحافظ', iconName: 'phone', enabled: true },
    { id: 'card', name: 'فيزا وبطاقات بنكية', iconName: 'creditCard', enabled: true },
    { id: 'instapay', name: 'إنستاباي InstaPay', iconName: 'refresh', enabled: true },
    { id: 'credit', name: 'آجل / على الحساب', iconName: 'fileText', enabled: true }
  ],
  quickServices: [
    { name: 'صيانة وفحص سريع', price: 100, iconName: 'maintenance' },
    { name: 'تنزيل ويندوز وبرامج', price: 150, iconName: 'laptop' },
    { name: 'تنظيف وتغيير معجون حراري', price: 120, iconName: 'tool' },
    { name: 'تركيب حماية / اسكرينة', price: 50, iconName: 'tool' },
    { name: 'شحن سوفت وير / باقة', price: 80, iconName: 'pos' }
  ],
  allowNegativeStock: false,
  autoPrintReceipt: true,
  receiptPaperSize: '80mm',
  showCashierName: true,
  showLogoOnReceipt: true,
  receiptFooter: 'شكراً لتعاملكم معنا • نسعد دائماً بخدمتكم',
  enableTax: false,
  taxRate: 14
};

function getPosSettings(){
  if(!state.settings) state.settings = {};
  if(!state.settings.pos) state.settings.pos = JSON.parse(JSON.stringify(DEFAULT_POS_SETTINGS));
  else {
    state.settings.pos = { ...DEFAULT_POS_SETTINGS, ...state.settings.pos };
    if(!Array.isArray(state.settings.pos.shortcutItemIds)) state.settings.pos.shortcutItemIds = [];
    if(!state.settings.pos.paymentMethods) state.settings.pos.paymentMethods = DEFAULT_POS_SETTINGS.paymentMethods;
    if(!state.settings.pos.quickServices) state.settings.pos.quickServices = DEFAULT_POS_SETTINGS.quickServices;
  }
  return state.settings.pos;
}

function getActivePaymentMethods(){
  const posSettings = getPosSettings();
  const list = (posSettings.paymentMethods || []).filter(p => p.enabled !== false);
  return list.length ? list : DEFAULT_POS_SETTINGS.paymentMethods;
}

function getPaymentMethodBadge(methodName){
  if(!methodName) return `<span class="badge" style="background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;font-weight:700;">${getSvgIcon('dollar', 12)} نقدي</span>`;
  const str = String(methodName).toLowerCase();
  if(str.includes('فيزا') || str.includes('card') || str.includes('بطاق') || str.includes('visa')){
    return `<span class="badge" style="background:#e0e7ff;color:#3730a3;border:1px solid #c7d2fe;font-weight:700;">${getSvgIcon('creditCard', 12)} فيزا وبطاقات</span>`;
  }
  if(str.includes('إنستاباي') || str.includes('انستاباي') || str.includes('instapay')){
    return `<span class="badge" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;font-weight:700;">${getSvgIcon('refresh', 12)} إنستاباي</span>`;
  }
  if(str.includes('محفظ') || str.includes('فودافون') || str.includes('vodafone') || str.includes('wallet')){
    return `<span class="badge" style="background:#fee2e2;color:#991b1b;border:1px solid #fecaca;font-weight:700;">${getSvgIcon('phone', 12)} محفظة إلكترونية</span>`;
  }
  if(str.includes('آجل') || str.includes('اجل') || str.includes('حساب') || str.includes('credit')){
    return `<span class="badge" style="background:#f3e8ff;color:#6b21a8;border:1px solid #e9d5ff;font-weight:700;">${getSvgIcon('fileText', 12)} آجل / على الحساب</span>`;
  }
  return `<span class="badge" style="background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;font-weight:700;">${getSvgIcon('dollar', 12)} ${escapeHtml(methodName)}</span>`;
}

// ---------------- Pure Offline QR Code SVG Generator (0ms, Zero Network Dependency) ----------------
const QRCodeGenerator = (function() {
  const PAD0 = 0xEC, PAD1 = 0x11;
  const EXP_TABLE = new Uint8Array(256);
  const LOG_TABLE = new Uint8Array(256);
  for (let i = 0, x = 1; i < 256; i++) {
    EXP_TABLE[i] = x;
    LOG_TABLE[x] = i;
    x = (x << 1) ^ ((x & 0x80) ? 0x11d : 0);
  }
  function glog(n) { if (n < 1) return 0; return LOG_TABLE[n]; }
  function gexp(n) { while (n < 0) n += 255; while (n >= 255) n -= 255; return EXP_TABLE[n]; }

  function getRSGeneratorPoly(numEC) {
    let poly = [1];
    for (let i = 0; i < numEC; i++) {
      let next = new Array(poly.length + 1).fill(0);
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gexp(glog(poly[j]) + i);
      }
      poly = next;
    }
    return poly;
  }

  function calculateEC(data, numEC) {
    const gen = getRSGeneratorPoly(numEC);
    const msg = new Array(data.length + numEC).fill(0);
    for (let i = 0; i < data.length; i++) msg[i] = data[i];
    for (let i = 0; i < data.length; i++) {
      const coef = msg[i];
      if (coef !== 0) {
        const logCoef = glog(coef);
        for (let j = 0; j < gen.length; j++) {
          msg[i + j] ^= gexp(logCoef + glog(gen[j]));
        }
      }
    }
    return msg.slice(data.length);
  }

  const VERSIONS = [
    null,
    { ver: 1, size: 21, dataCap: 14, totalData: 16, ecPerBlock: 10, blocks: [[1, 16]] },
    { ver: 2, size: 25, dataCap: 26, totalData: 28, ecPerBlock: 16, blocks: [[1, 28]], align: [6, 18] },
    { ver: 3, size: 29, dataCap: 42, totalData: 44, ecPerBlock: 26, blocks: [[1, 44]], align: [6, 22] },
    { ver: 4, size: 33, dataCap: 62, totalData: 64, ecPerBlock: 18, blocks: [[2, 32]], align: [6, 26] },
    { ver: 5, size: 37, dataCap: 84, totalData: 86, ecPerBlock: 24, blocks: [[2, 43]], align: [6, 30] },
    { ver: 6, size: 41, dataCap: 106, totalData: 108, ecPerBlock: 16, blocks: [[4, 27]], align: [6, 34] },
    { ver: 7, size: 45, dataCap: 122, totalData: 124, ecPerBlock: 18, blocks: [[2, 31], [2, 32]], align: [6, 22, 38] },
    { ver: 8, size: 49, dataCap: 152, totalData: 154, ecPerBlock: 22, blocks: [[2, 38], [2, 39]], align: [6, 24, 42] }
  ];

  function encodeData(text) {
    const bytes = new TextEncoder().encode(text);
    let verInfo = null;
    for (let v = 1; v < VERSIONS.length; v++) {
      if (bytes.length <= VERSIONS[v].dataCap) { verInfo = VERSIONS[v]; break; }
    }
    if (!verInfo) verInfo = VERSIONS[VERSIONS.length - 1];

    const bits = [];
    function putBits(val, len) {
      for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1);
    }
    putBits(0b0100, 4);
    putBits(Math.min(bytes.length, verInfo.dataCap), 8);
    for (let i = 0; i < Math.min(bytes.length, verInfo.dataCap); i++) putBits(bytes[i], 8);
    while (bits.length < verInfo.totalData * 8 && bits.length % 8 !== 0) bits.push(0);
    while (bits.length % 8 !== 0) bits.push(0);
    let padToggle = false;
    while (bits.length < verInfo.totalData * 8) {
      putBits(padToggle ? PAD1 : PAD0, 8);
      padToggle = !padToggle;
    }

    const dataCodewords = [];
    for (let i = 0; i < bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
      dataCodewords.push(byte);
    }

    const dataBlocks = [];
    const ecBlocks = [];
    let offset = 0;
    for (let [numBlocks, blockSize] of verInfo.blocks) {
      for (let b = 0; b < numBlocks; b++) {
        const blockData = dataCodewords.slice(offset, offset + blockSize);
        dataBlocks.push(blockData);
        ecBlocks.push(calculateEC(blockData, verInfo.ecPerBlock));
        offset += blockSize;
      }
    }

    const finalCodewords = [];
    let maxBlockLen = Math.max(...dataBlocks.map(b => b.length));
    for (let i = 0; i < maxBlockLen; i++) {
      for (let b = 0; b < dataBlocks.length; b++) {
        if (i < dataBlocks[b].length) finalCodewords.push(dataBlocks[b][i]);
      }
    }
    for (let i = 0; i < verInfo.ecPerBlock; i++) {
      for (let b = 0; b < ecBlocks.length; b++) {
        if (i < ecBlocks[b].length) finalCodewords.push(ecBlocks[b][i]);
      }
    }
    return { verInfo, codewords: finalCodewords };
  }

  function createMatrix(verInfo, codewords) {
    const size = verInfo.size;
    const matrix = Array.from({ length: size }, () => new Array(size).fill(null));
    const reserved = Array.from({ length: size }, () => new Array(size).fill(false));

    function setModule(r, c, val) {
      matrix[r][c] = val ? 1 : 0;
      reserved[r][c] = true;
    }

    function addFinder(top, left) {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            setModule(top + r, left + c, true);
          } else {
            setModule(top + r, left + c, false);
          }
        }
      }
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          if (r === -1 || r === 7 || c === -1 || c === 7) {
            const row = top + r, col = left + c;
            if (row >= 0 && row < size && col >= 0 && col < size) setModule(row, col, false);
          }
        }
      }
    }
    addFinder(0, 0);
    addFinder(0, size - 7);
    addFinder(size - 7, 0);

    if (verInfo.align) {
      const coords = verInfo.align;
      for (let r of coords) {
        for (let c of coords) {
          if (matrix[r][c] !== null) continue;
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              setModule(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
            }
          }
        }
      }
    }

    for (let i = 8; i < size - 8; i++) {
      if (matrix[6][i] === null) setModule(6, i, i % 2 === 0);
      if (matrix[i][6] === null) setModule(i, 6, i % 2 === 0);
    }

    setModule(4 * verInfo.ver + 9, 8, true);

    for (let i = 0; i < 9; i++) {
      reserved[8][i] = true;
      reserved[i][8] = true;
      if (size - 1 - i < size) {
        reserved[8][size - 1 - i] = true;
        reserved[size - 1 - i][8] = true;
      }
    }

    const bits = [];
    for (let cw of codewords) {
      for (let i = 7; i >= 0; i--) bits.push((cw >> i) & 1);
    }
    let bitIdx = 0;
    let up = true;
    for (let right = size - 1; right > 0; right -= 2) {
      if (right === 6) right--;
      const cols = [right, right - 1];
      const rows = up ? Array.from({ length: size }, (_, i) => size - 1 - i) : Array.from({ length: size }, (_, i) => i);
      for (let r of rows) {
        for (let c of cols) {
          if (!reserved[r][c]) {
            const dataBit = bitIdx < bits.length ? bits[bitIdx++] : 0;
            const mask = (r + c) % 2 === 0;
            matrix[r][c] = dataBit ^ (mask ? 1 : 0);
          }
        }
      }
      up = !up;
    }

    const formatBits = 0x5412;
    for (let i = 0; i < 15; i++) {
      const bit = (formatBits >> i) & 1;
      if (i < 6) matrix[8][i] = bit;
      else if (i < 8) matrix[8][i + 1] = bit;
      else if (i === 8) matrix[7][8] = bit;
      else matrix[14 - i][8] = bit;

      if (i < 8) matrix[size - 1 - i][8] = bit;
      else matrix[8][size - 15 + i] = bit;
    }

    return matrix;
  }

  function toSvg(text, pixelSize) {
    try {
      pixelSize = pixelSize || 70;
      const { verInfo, codewords } = encodeData(String(text || ""));
      const matrix = createMatrix(verInfo, codewords);
      const size = matrix.length;
      const border = 1;
      const totalSize = size + border * 2;
      let paths = "";
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (matrix[r][c] === 1) paths += `M${c + border},${r + border}h1v1h-1z `;
        }
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${pixelSize}" height="${pixelSize}" shape-rendering="crispEdges" style="display:block;background:#fff;"><rect width="${totalSize}" height="${totalSize}" fill="#ffffff"/><path d="${paths.trim()}" fill="#000000"/></svg>`;
    } catch(e) {
      return `<div style="width:${pixelSize}px;height:${pixelSize}px;border:1px solid #000;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:bold;">QR</div>`;
    }
  }

  return { toSvg };
})();

const DEFAULT_KNOWN_WINDOWS_PRINTERS = [
  // طابعات البون والإيصالات الحرارية
  { name: 'Xprinter XP-808 (Thermal 80mm Receipt)', category: 'receipt', isDefault: true },
  { name: 'Xprinter XP-N160II / XP-Q800 (Thermal 80mm)', category: 'receipt' },
  { name: 'POS-80C / XP-80C (Thermal 80mm Receipt)', category: 'receipt' },
  { name: 'POS-58 / XP-58C (Thermal 58mm)', category: 'receipt' },
  { name: 'Epson TM-T20 / TM-T88 (Thermal Receipt)', category: 'receipt' },
  { name: 'Bixolon SRP-350 (Thermal 80mm)', category: 'receipt' },
  
  // طابعات ملصقات الباركود
  { name: 'Xprinter XP-365B (Thermal Barcode Label)', category: 'barcode', isDefault: true },
  { name: 'Xprinter XP-370B / XP-420B (Label Printer)', category: 'barcode' },
  { name: 'Zebra ZD220 / GK420d (Barcode Label)', category: 'barcode' },
  { name: 'TSC TE200 / DA200 (Thermal Label)', category: 'barcode' },
  { name: 'Brother QL-800 / QL-820NWB', category: 'barcode' },

  // طابعات الليزر والمستندات العادية (A4/A5)
  { name: 'HP LaserJet Pro (Laser A4/A5)', category: 'laser', isDefault: true },
  { name: 'HP LaserJet M102 / M402 / MFP Series', category: 'laser' },
  { name: 'Canon LBP / imageCLASS Series (A4/A5)', category: 'laser' },
  { name: 'Brother HL / DCP / MFC Laser Series', category: 'laser' },
  { name: 'Epson EcoTank L3150 / L3250 Series', category: 'laser' },
  { name: 'Microsoft Print to PDF', category: 'laser' },
  { name: 'OneNote for Windows 10', category: 'laser' }
];

function getKnownWindowsPrinters(){
  if(!state.settings) state.settings = {};
  if(!Array.isArray(state.settings.knownWindowsPrinters) || state.settings.knownWindowsPrinters.length === 0){
    try {
      const saved = localStorage.getItem('microerp_known_printers');
      if(saved) state.settings.knownWindowsPrinters = JSON.parse(saved);
    } catch(e){}
  }
  if(!Array.isArray(state.settings.knownWindowsPrinters) || state.settings.knownWindowsPrinters.length === 0){
    state.settings.knownWindowsPrinters = JSON.parse(JSON.stringify(DEFAULT_KNOWN_WINDOWS_PRINTERS));
  }
  return state.settings.knownWindowsPrinters;
}

async function detectWindowsPrinters(verbose = false){
  let detected = [];
  try {
    if(typeof window.queryLocalPrinters === 'function'){
      const printers = await window.queryLocalPrinters();
      if(Array.isArray(printers) && printers.length > 0){
        detected = printers.map(p => {
          const pName = p.name || p.deviceName || String(p);
          const lower = pName.toLowerCase();
          const category = (lower.includes('barcode') || lower.includes('label') || lower.includes('365') || lower.includes('370') || lower.includes('zebra') || lower.includes('tsc')) ? 'barcode' :
                           ((lower.includes('pos') || lower.includes('receipt') || lower.includes('808') || lower.includes('80c') || lower.includes('58') || lower.includes('xprinter')) ? 'receipt' : 'laser');
          return { name: pName, category };
        });
      }
    } else if(navigator.printers && typeof navigator.printers.getList === 'function'){
      const printers = await navigator.printers.getList();
      if(Array.isArray(printers) && printers.length > 0){
        detected = printers.map(p => ({ name: p.name, category: 'laser' }));
      }
    }
  } catch(e) {
    console.log('Web Printer Querying notice:', e);
  }

  const current = getKnownWindowsPrinters();
  let addedCount = 0;
  if(detected.length > 0){
    detected.forEach(d => {
      if(!current.some(c => c.name.trim().toLowerCase() === d.name.trim().toLowerCase())){
        current.push(d);
        addedCount++;
      }
    });
    state.settings.knownWindowsPrinters = current;
    setCache('settings', state.settings);
  }

  if(verbose){
    if(addedCount > 0){
      showToast(`تم اكتشاف وإضافة (${addedCount}) طابعة جديدة معرفة على نظام ويندوز بنجاح`, 'success');
    } else {
      showToast(`تم فحص وتحديث قائمة الطابعات المعرفة على ويندوز (${current.length} طابعة متاحة في القوائم)`, 'info');
    }
  }
  return current;
}

const DEFAULT_PRINTERS_SETTINGS = {
  // 1. طابعة إيصالات الكاشير (Receipt / POS Thermal Printer)
  receiptPrinter: {
    name: 'Xprinter XP-808 (Thermal 80mm Receipt)',
    paperSize: '80mm',
    fontScale: 'compact', // 'compact' (مدمج نصف الحجم موفر للورق - موصى به), 'normal', 'large'
    autoPrint: true,
    cutterFeedMm: 4,
    showLogo: true,
    showCashier: true,
    printBarcode: true,
    footerText: 'شكراً لتعاملكم معنا • نسعد دائماً بخدمتكم'
  },
  // 2. طابعة ملصقات الباركود (Thermal Label / Barcode Sticker Printer)
  barcodePrinter: {
    name: 'Xprinter XP-365B (Thermal Barcode Label)',
    defaultSize: '40x20', // '40x20', '40x10', '40x15', '50x25', '50x30', '38x25', '60x40', 'custom'
    customWidthMm: 40,
    customHeightMm: 20,
    barcodeType: 'CODE128',
    barcodeMode: 'qr', // 'qr' (رمز QR ذكي للتتبع), 'barcode' (كود 128), 'none' (نصي فقط عالي التباين)
    defaultCopies: 1,
    showPrice: false,
    showShopName: true,
    showCustomerName: true,
    showPhone: true,
    showDevice: true,
    showPassword: true,
    showFaults: true,
    showDate: true,
    showBorder: false,
    kioskMode: true,
    rotation: 0,
    offsetX: 0,
    offsetY: 0
  },
  // 3. طابعة الليزر والمستندات الرسمية (Standard Laser / Inkjet Printer - A4 / A5)
  laserPrinter: {
    name: 'HP LaserJet Pro (Laser A4/A5)',
    maintenanceReceiptSize: 'A5', // A5 landscape (ورقة واحدة مدمجة)
    invoiceSize: 'A4', // A4 portrait أو A5
    quotationSize: 'A4',
    reportsSize: 'A4',
    barcodeSheetLayout: '30', // 24, 30, 40, 65 stickers per sheet
    colorMode: 'bw_sharp', // 'bw_sharp' (أسود عالي التباين) أو 'color'
    showWatermark: true,
    showTerms: true
  },
  // 4. تعيين العمليات للطابعات (Workflow Assignments)
  workflowAssignments: {
    posSale: 'receiptPrinter', // إيصالات نقطة البيع السريعة
    maintenanceReceipt: 'laserPrinter', // إيصال وضمان الصيانة
    taxInvoice: 'laserPrinter', // الفواتير الضريبية الرسمية
    quotation: 'laserPrinter', // عروض الأسعار
    singleBarcode: 'barcodePrinter', // ملصقات الباركود الفردية للأصناف
    deviceBarcode: 'barcodePrinter', // ملصقات باركود أجهزة الصيانة
    sheetBarcode: 'laserPrinter', // ملصقات الباركود المجمعة A4
    financialReports: 'laserPrinter' // اليومية وكشوف الحسابات وميزان المراجعة
  }
};

function getPrintersSettings(){
  if(!state.settings) state.settings = {};
  if(!state.settings.printers){
    try {
      const saved = localStorage.getItem('microerp_printers_settings');
      if(saved) state.settings.printers = JSON.parse(saved);
    } catch(e){}
  }
  if(!state.settings.printers) state.settings.printers = JSON.parse(JSON.stringify(DEFAULT_PRINTERS_SETTINGS));
  else {
    state.settings.printers = { ...DEFAULT_PRINTERS_SETTINGS, ...state.settings.printers };
    if(!state.settings.printers.receiptPrinter) state.settings.printers.receiptPrinter = JSON.parse(JSON.stringify(DEFAULT_PRINTERS_SETTINGS.receiptPrinter));
    if(!state.settings.printers.barcodePrinter) state.settings.printers.barcodePrinter = JSON.parse(JSON.stringify(DEFAULT_PRINTERS_SETTINGS.barcodePrinter));
    if(!state.settings.printers.laserPrinter) state.settings.printers.laserPrinter = JSON.parse(JSON.stringify(DEFAULT_PRINTERS_SETTINGS.laserPrinter));
    if(!state.settings.printers.workflowAssignments) state.settings.printers.workflowAssignments = JSON.parse(JSON.stringify(DEFAULT_PRINTERS_SETTINGS.workflowAssignments));
  }
  return state.settings.printers;
}

/**
 * Sanitizes and extracts the date string in YYYY-MM-DD format with English digits.
 * @param {string|Date} val - The input date value.
 * @returns {string} Clean date string.
 */
function cleanDate(val){ 
  return val ? toEngDigits(String(val).slice(0, 10)) : ''; 
}

function cleanTime(val){
  if(!val) return '';
  try {
    const d = new Date(val);
    if(isNaN(d.getTime())) return String(val).slice(11, 16);
    return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  } catch(e) {
    return String(val).slice(11, 16);
  }
}

/* ---------------- Device Media Photos Engine & Lightbox ---------------- */

/**
 * Compresses an image file via Canvas down to optimal dimensions and quality.
 * Reduces 4MB+ camera photos to ~40-70KB crisp JPEGs to preserve localStorage and network speed.
 */
function compressImageFile(file, maxWidth = 900, maxHeight = 900, quality = 0.72){
  return new Promise((resolve, reject) => {
    if(!file || !file.type.startsWith('image/')){
      return reject(new Error('الملف المختار ليس صورة صالحة'));
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('تعذر معالجة بيانات الصورة'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if(width > height){
          if(width > maxWidth){
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if(height > maxHeight){
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Interactive Full-Screen Image Lightbox with zoom, rotate, and download
 */
function openImageLightbox(photo, allPhotos = [], onDelete = null){
  if(!photo) return;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '13000';
  overlay.style.background = 'rgba(15, 23, 42, 0.92)';
  overlay.style.backdropFilter = 'blur(6px)';

  let rotation = 0;
  let zoom = 1;
  const angleTitle = photo.angle || 'صورة الجهاز';
  const stageTitle = photo.stage === 'delivery' ? 'عند التسليم' : 'عند الاستلام';
  const timeStr = photo.timestamp ? cleanDate(photo.timestamp) + ' ' + cleanTime(photo.timestamp) : '';

  overlay.innerHTML = `
    <div style="position:relative;width:95vw;max-width:850px;height:90vh;max-height:680px;background:#1e293b;border-radius:12px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.6);border:1px solid #334155;">
      
      <!-- Lightbox Header -->
      <div style="padding:12px 16px;background:#0f172a;border-bottom:1px solid #334155;display:flex;justify-content:space-between;align-items:center;color:#fff;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span>${getSvgIcon('camera', 18)}</span>
          <div>
            <div style="font-weight:800;font-size:14px;color:#f8fafc;">${escapeHtml(angleTitle)} <span class="badge" style="background:#3b82f6;color:#fff;font-size:10.5px;margin-right:4px;">${stageTitle}</span></div>
            <div style="font-size:11px;color:#94a3b8;">${timeStr || ''}</div>
          </div>
        </div>
        
        <div style="display:flex;gap:6px;align-items:center;">
          <button type="button" class="btn btn-ghost btn-xs" id="lbRotateBtn" style="color:#cbd5e1;background:#1e293b;display:inline-flex;align-items:center;gap:4px;" title="تدوير 90 درجة">${getSvgIcon('refresh', 12)} تدوير</button>
          <button type="button" class="btn btn-ghost btn-xs" id="lbZoomInBtn" style="color:#cbd5e1;background:#1e293b;font-weight:700;" title="تكبير">+</button>
          <button type="button" class="btn btn-ghost btn-xs" id="lbZoomOutBtn" style="color:#cbd5e1;background:#1e293b;font-weight:700;" title="تصغير">-</button>
          <button type="button" class="btn btn-ghost btn-xs" id="lbDownloadBtn" style="color:#38bdf8;background:#1e293b;display:inline-flex;align-items:center;gap:4px;" title="تحميل الصورة">${getSvgIcon('download', 12)} تحميل</button>
          ${onDelete ? `<button type="button" class="btn btn-ghost btn-xs" id="lbDeleteBtn" style="color:#f87171;background:#1e293b;display:inline-flex;align-items:center;gap:4px;" title="حذف الصورة">${getSvgIcon('trash', 12)} حذف</button>` : ''}
          <button type="button" class="btn btn-ghost btn-xs" id="lbCloseBtn" style="color:#fff;background:#334155;font-size:16px;line-height:1;margin-right:6px;">&times;</button>
        </div>
      </div>

      <!-- Image Canvas Viewport -->
      <div style="flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:16px;background:#090d16;">
        <img id="lbMainImage" src="${photo.url || photo.thumb}" alt="Device condition" style="max-width:100%;max-height:100%;object-fit:contain;transition:transform 0.2s ease;border-radius:6px;box-shadow:0 10px 25px rgba(0,0,0,0.5);">
      </div>

      ${photo.note ? `
        <div style="padding:8px 14px;background:#0f172a;color:#cbd5e1;font-size:12px;border-top:1px solid #334155;">
          <b>ملاحظة:</b> ${escapeHtml(photo.note)}
        </div>
      ` : ''}
    </div>
  `;

  document.body.appendChild(overlay);

  const imgEl = overlay.querySelector('#lbMainImage');
  const applyTransform = () => {
    imgEl.style.transform = `scale(${zoom}) rotate(${rotation}deg)`;
  };

  overlay.querySelector('#lbRotateBtn').onclick = () => {
    rotation = (rotation + 90) % 360;
    applyTransform();
  };
  overlay.querySelector('#lbZoomInBtn').onclick = () => {
    zoom = Math.min(3, zoom + 0.25);
    applyTransform();
  };
  overlay.querySelector('#lbZoomOutBtn').onclick = () => {
    zoom = Math.max(0.5, zoom - 0.25);
    applyTransform();
  };
  overlay.querySelector('#lbDownloadBtn').onclick = () => {
    const a = document.createElement('a');
    a.href = photo.url || photo.thumb;
    a.download = `MicroTech_Device_${photo.angle || 'photo'}_${Date.now()}.jpg`;
    a.click();
  };
  if(onDelete){
    const delBtn = overlay.querySelector('#lbDeleteBtn');
    if(delBtn){
      delBtn.onclick = () => {
        if(confirm('هل أنت متأكد من حذف هذه الصورة الموثقة للجهاز؟')){
          overlay.remove();
          onDelete(photo);
        }
      };
    }
  }

  const closeLb = () => overlay.remove();
  overlay.querySelector('#lbCloseBtn').onclick = closeLb;
  overlay.onclick = (e) => {
    if(e.target === overlay) closeLb();
  };
}

/**
 * Renders photos thumbnails gallery into a container element
 */
function renderDevicePhotosThumbnails(photos, containerEl, options = {}){
  if(!containerEl) return;
  const list = Array.isArray(photos) ? photos : [];
  if(list.length === 0){
    containerEl.innerHTML = `
      <div style="grid-column:1/-1;padding:14px;text-align:center;color:var(--ink-secondary);font-size:11.5px;background:var(--paper);border:1px dashed var(--line);border-radius:6px;">
        <div style="display:inline-flex;color:var(--ink-secondary);margin-bottom:4px;">${getSvgIcon('camera', 24)}</div>
        لم يتم إرفاق صور لهذا الجهاز بعد.<br>
        <span style="font-size:10.5px;opacity:0.8;">التقط بالكاميرا أو اختر صوراً لتوثيق حالة الشاشة والخدوش والملحقات.</span>
      </div>
    `;
    return;
  }

  containerEl.innerHTML = list.map((p, idx) => {
    const angle = p.angle || 'عام';
    const isDelivery = p.stage === 'delivery';
    return `
      <div class="device-photo-card" data-pidx="${idx}" style="position:relative;background:var(--paper);border:1px solid var(--line);border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);display:flex;flex-direction:column;cursor:pointer;">
        <div style="height:76px;overflow:hidden;background:#000;display:flex;align-items:center;justify-content:center;">
          <img src="${p.url || p.thumb}" style="width:100%;height:100%;object-fit:cover;" loading="lazy">
        </div>
        <div style="padding:4px 6px;font-size:10px;display:flex;justify-content:space-between;align-items:center;background:var(--paper2);">
          <span style="font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(angle)}">${escapeHtml(angle)}</span>
          <span class="badge" style="font-size:9px;padding:1px 4px;background:${isDelivery?'rgba(59,130,246,0.15)':'rgba(16,185,129,0.15)'};color:${isDelivery?'var(--primary)':'var(--green)'};">
            ${isDelivery ? 'تسليم' : 'استلام'}
          </span>
        </div>
        ${options.canDelete !== false ? `
          <button type="button" class="del-photo-btn" data-delpidx="${idx}" style="position:absolute;top:3px;left:3px;background:rgba(239,68,68,0.85);color:#fff;border:none;border-radius:50%;width:20px;height:20px;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;" title="حذف الصورة">&times;</button>
        ` : ''}
      </div>
    `;
  }).join('');

  // Attach click handlers
  containerEl.querySelectorAll('.device-photo-card').forEach(card => {
    card.onclick = (e) => {
      if(e.target.closest('.del-photo-btn')) return;
      const idx = Number(card.dataset.pidx);
      const photo = list[idx];
      openImageLightbox(photo, list, options.canDelete !== false ? (p) => {
        list.splice(idx, 1);
        if(typeof options.onChanged === 'function') options.onChanged(list);
        renderDevicePhotosThumbnails(list, containerEl, options);
      } : null);
    };
  });

  if(options.canDelete !== false){
    containerEl.querySelectorAll('.del-photo-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const idx = Number(btn.dataset.delpidx);
        if(confirm('هل تريد حذف هذه الصورة؟')){
          list.splice(idx, 1);
          if(typeof options.onChanged === 'function') options.onChanged(list);
          renderDevicePhotosThumbnails(list, containerEl, options);
        }
      };
    });
  }
}

/**
 * Escapes unsafe HTML characters to prevent XSS vulnerabilities.
 * @param {string|number|null} str - Raw input text.
 * @returns {string} Sanitized HTML string.
 */
function escapeHtml(str){
  if(str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Safely parses any value to a finite number, returning fallback if invalid.
 * @param {any} val - Value to parse.
 * @param {number} fallback - Default value if parsing fails.
 * @returns {number} Validated number.
 */
function parseSafeNumber(val, fallback = 0){
  const parsed = Number(val);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * High-performance debounce utility for rapid input and search events.
 * @param {Function} func - Function to debounce.
 * @param {number} wait - Delay in milliseconds.
 * @returns {Function} Debounced function.
 */
function debounce(func, wait = 250){
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const WA_ICON = `<svg class="wa-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.35 5.07L2 22l5.07-1.35C8.55 21.5 10.27 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.5 0-2.9-.41-4.1-1.13l-.29-.17-3.02.8.8-3.02-.17-.29A7.94 7.94 0 0 1 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/></svg>`;
