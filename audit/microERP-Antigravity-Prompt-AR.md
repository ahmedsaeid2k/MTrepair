# برومبيت تنفيذي جاهز لـ Antigravity — إصلاح microERP
### انسخ كل ما يلي والصقه في Antigravity (Agent mode) بعد فتح مجلد المشروع

---

## 🧭 السياق

أنت مهندس برمجيات أول + مهندس أمن تطبيقات + محاسب نظم، تعمل داخل مستودع `microtech-app` لشركة **كمبيوتر وإلكترونيات وصيانة وكاميرات مراقبة**.

المنتج: **microERP** — نظام ERP عربي (RTL) يعمل كتطبيق Electron (ويندوز/ماك) وكصفحة واحدة في المتصفح، وقاعدة البيانات Google Sheets عبر Google Apps Script.

**خريطة المشروع — اقرأها قبل أي تعديل:**

| المسار | الوصف | هل يُعدَّل؟ |
|---|---|---|
| `app-modular/js/**` و `app-modular/css/**` | **مصدر الحقيقة الوحيد** — 21 ملف JS، ~32,000 سطر | ✅ نعم |
| `app-modular/build.js` | أداة البناء: تدمج كل شيء في ملف واحد + تحقق نحوي | ✅ نعم |
| `app-modular/dist/index.html` | **مُولَّد بالكامل** (1.79MB) | ❌ **ممنوع منعاً باتاً** |
| `files(11)/GoogleAppsScript_Backend.gs.txt` | كود الخادم (1,190 سطر) | ✅ نعم (ثم يُنشر يدوياً) |
| `main.js` / `preload.js` | نواة Electron | ✅ نعم |
| `index.html` (الجذر، 1.8MB) | نسخة إرث قديمة | ❌ ممنوع |
| `index_backup_2026-09-*.html` | نسخ ميتة | ❌ ممنوع |
| `mterpkernal/**` | نسخة متشعبة قديمة | ❌ ممنوع |
| `sync-modular.js` | ⚠️ **سيُحذف في المرحلة 0** | ❌ لا تشغّله |

**مسار البناء الوحيد المسموح:**
```bash
node app-modular/build.js
```
**للتشغيل:** `npm start` · **للبناء لويندوز:** `npm run build:win`

---

## ⛔ ممنوعات مطلقة (مخالفتها تُفسد المشروع)

1. **لا تعدّل `app-modular/dist/index.html` يدوياً.** هو ناتج بناء؛ عدّل المصدر في `app-modular/js|css` ثم شغّل `node app-modular/build.js`.
2. **لا تشغّل `node sync-modular.js` أبداً.** هذا السكربت (السطور 96-99) **يكتب فوق** `app-modular/js/**` و `app-modular/css/**` بمحتوى مسحوب من `index.html` القديم في الجذر → **يمحو كل إصلاحاتك**. أول مهمة لك في المرحلة 0 هي حذفه.
3. **لا تعدّل** `index.html` في الجذر ولا `index_backup_*.html` ولا `mterpkernal/**`.
4. **لا تُدخل مكتبات npm جديدة** (`package.json` فيه فقط electron + electron-builder كـ devDependencies). اكتب ما تحتاجه بلا اعتماديات. الاستثناء الوحيد: أدوات تطوير (eslint/vitest) في المرحلة 4 بعد موافقتي.
5. **لا تكسر العمل بلا إنترنت:** التطبيق يجب أن يعمل بلا شبكة على جهاز جديد. لا تُضِف أي مورد من CDN.
6. **لا تحذف بيانات أو أعمدة من Google Sheets.** كل تغيير على المخطط يجب أن يكون **إضافياً** ومُوثَّقاً في `audit/MIGRATIONS.md`.
7. **لا تغيّر نصوص الواجهة العربية** ولا اتجاه RTL ولا أسماء الأقسام أو الحالات الموجودة، إلا حيث يطلب البند صراحةً.
8. **لا تُنشئ ملفات `.md` إضافية** غير المطلوبة في تعليمات الإخراج أدناه.

---

## 🔧 طريقة العمل الإلزامية

1. **أنشئ فرعاً:** `git checkout -b fix/audit-p0-p1-p2`
2. **راجع الأساس أولاً:** `node app-modular/build.js` يجب أن ينجح. هذا خط الأساس. أي فشل لاحق = ارتكاس منك.
3. **نفّذ المراحل بالترتيب** 0 → 1 → 2 → 3 → 4. لا تنتقل لمرحلة قبل استيفاء **معايير القبول** لكل بنودها.
4. **Commit واحد لكل بند** برسالة واضحة: `fix(security): remove hardcoded supervisor backdoor [S1]`.
5. **بعد كل بند:** `node app-modular/build.js` ثم تأكد أن الحزمة تُبنى بلا أخطاء.
6. **عند التعارض بين ما يطلبه البند وما تراه في الكود:** توقّف واكتب في تقرير المرحلة `⚠️ تعارض` مع الملف:السطر، ولا تخمّن.
7. **لا تخترع أرقام أسطر.** تحقق من كل موقع قبل التعديل بـ `read`.

### أدوات التحقق المتاحة لك
- **فحص نحوي:** `node app-modular/build.js` (يفحص كل الحزمة ويفشل عند أي خطأ نحوي).
- **لا يوجد linter ولا اختبارات.** في المرحلة 4 ستُضيف اختبارات. حتى ذلك الحين، التحقق اليدوي إلزامي: بعد كل إصلاح اذكر في تقريرك **كيف تحققت**.

---

# المرحلة 0 — شبكة الأمان (إلزامية قبل أي إصلاح)

| # | المهمة | معيار القبول |
|---|---|---|
| 0.1 | احذف `sync-modular.js` (`git rm sync-modular.js`) وأضف سطراً في `app-modular/README.md` يحذّر أن `build.js` هو البناء الوحيد. | الملف غير موجود؛ لا يوجد أي مرجع له في `package.json`. |
| 0.2 | انقل `app-modular/dist/index.html` من git إلى `.gitignore` (`git rm --cached app-modular/dist/index.html` + أضف `app-modular/dist/`). | `git status` نظيف؛ البناء ما زال يعمل. |
| 0.3 | أضف `audit/MIGRATIONS.md` (سجل تغييرات مخطط Sheets) و`audit/FIXES.md` (سجل الإصلاحات). | الملفان موجودان. |
| 0.4 | أضف سكربتات إلى `package.json`: `"verify": "node app-modular/build.js"`. | `npm run verify` ينجح. |
| 0.5 | أنشئ `git tag baseline-before-fixes` قبل أول تعديل. | الوسم موجود. |

---

# المرحلة 1 — الأمن (P0) 🔴

## S1 — إزالة الباب الخلفي في تصريح الحذف
**الموقع:** `app-modular/js/core/05-auth-and-audit.js:354`

```js
if(clean === 'admin') return 'admin';   // ← احذف هذا السطر
```

- احذف السطر. واجعل دالة `verifySupervisorPin` **لا تُرجع أي اسم** إن لم تجد مستخدماً بدور admin بكلمة مرور مطابقة.
- بما أن `sanitizeUsersForStorage` تحذف حقل `Password` من `state.users` (السطور 12-19) فالمقارنة في السطر 352 **لا تعمل أصلاً**.
- **الحل الصحيح:** أزل التحقق المحلي كلياً، واجعل مسار "تصريح فوري" يستدعي **action سيرفري جديد** باسم `verifySupervisorPin` يتحقق من كلمة مرور المدير على السيرفر.
- **معيار القبول:** كتابة `admin` (أو أي قيمة) في نافذة التصريح **لا** تمنح تصريحاً. لا يوجد أي نص صريح لكلمة مرور داخل `app-modular/js/**`.

```bash
# تحقق إلزامي:
grep -rn "=== 'admin'\|== 'admin'" app-modular/js/core/05-auth-and-audit.js   # يجب ألا يظهر شيء في سياق كلمة المرور
```

## S2 — تفويض سيرفري لكل عملية كتابة
**الموقع:** `files(11)/GoogleAppsScript_Backend.gs.txt`

أضف دالة مساعدة بعد `verifyAdminRole` (السطر 180):

```js
const ACTION_ROLES = {
  saveReceipt:        ['admin','technician','cashier'],
  savePayment:        ['admin','cashier','accountant'],
  settleSaleDebt:     ['admin','cashier','accountant'],
  saveSale:           ['admin','cashier'],
  saveReturn:         ['admin','cashier','accountant'],
  saveCustomer:       ['admin','cashier','accountant','technician'],
  saveTechnician:     ['admin'],
  saveInventoryItem:  ['admin','accountant','technician'],
  adjustInventoryQty: ['admin','accountant'],
  savePurchase:       ['admin','accountant'],
  settlePurchaseDebt: ['admin','accountant'],
  saveSupplier:       ['admin','accountant'],
  saveSerial:         ['admin','technician','accountant'],
  markSerialSold:     ['admin','cashier','accountant'],
  saveExpense:        ['admin','accountant'],
  saveInvoice:        ['admin','cashier','accountant'],
  saveJournalEntry:   ['admin','accountant'],
  saveQuotation:      ['admin','cashier','accountant','technician'],
  saveService:        ['admin'],
  saveAuditLog:       ['admin','accountant','cashier','technician'],
  verifySupervisorPin:['admin','accountant','cashier','technician']
};

function requireActionRole(action, session) {
  const allowed = ACTION_ROLES[action];
  if (!allowed) return false;                 // fail-closed للأفعال غير المعروفة
  const role = String(session.role || '').toLowerCase();
  return allowed.includes(role) || !!session.superuser;
}
```

ثم في بداية كل فرع من فروع `doPost` (بعد فحص الجلسة في السطر 431-438) أضف:

```js
if (!requireActionRole(action, session)) {
  logAudit('', actorUser, 'محاولة وصول مرفوضة للإجراء: ' + action);
  return jsonOut({ error: 'غير مصرح لك بتنفيذ هذا الإجراء (' + action + ')' }, 403);
}
```

**الأفعال التي تحتاج هذا الفحص (كلها بلا فحص حالياً):**
`saveReceipt`(440) · `saveCustomer`(523) · `saveTechnician`(556) · `savePayment`(565) · `saveInventoryItem`(632) · `adjustInventoryQty`(660) · `saveSale`(675) · `settleSaleDebt`(721) · `saveReturn`(736) · `saveQuotation`(775) · `saveService`(785) · `savePurchase`(789) · `settlePurchaseDebt`(844) · `saveSupplier`(864) · `saveSerial`(872) · `markSerialSold`(882) · `saveExpense`(900) · `saveInvoice`(966) · `saveJournalEntry`(947) · `saveAuditLog`(1028)

**أبقِ** `verifyAdminRole` كما هو على أفعال الحذف والإدارة (فهي مضبوطة أصلاً).
**معيار القبول:** مستخدم بدور `cashier` يستدعي `adjustInventoryQty` أو `saveUser` أو `deleteReceipt` عبر `curl` يحصل على 403. `saveReceipt` يعمل للفني والكاشير.

## S3 — إغلاق ثغرة القيود المحاسبية
**الموقع:** `files(11)/GoogleAppsScript_Backend.gs.txt:947-965`

```js
// قبل:
const isAuto = body.data && body.data.ReferenceType && body.data.ReferenceType !== 'Manual';
if (!isAdmin && !isAuto) return jsonOut({ error: 'القيود المحاسبية اليدوية متاحة للمدير فقط' }, 403);

// بعد:
const AUTOPOST_REFS = ['Sale','POS_Sale','Purchase','Receipt','Receipt_Parts','Receipt_Debt','Receipt_Reversal','Expense','Supplier_Payment'];
const refType = String((body.data && body.data.ReferenceType) || 'Manual');
const isServerAuto = AUTOPOST_REFS.includes(refType) === false ? false : true; // لم يعد مقبولاً من العميل
```

**التصميم المطلوب (مهم):** القيود التلقائية **لا** يجب أن تأتي من العميل. طبّق الآتي:
1. أضف دالة سيرفرية `postAutoJournal(desc, refType, refId, lines)` تتحقق من:
   - `refType` ضمن قائمة بيضاء،
   - `Math.abs(totalDebit - totalCredit) < 0.005` (وإلا ترفض)،
   - كل `AccountCode` موجود فعلاً في ورقة `Accounts`،
   - `refId` لم يُرحَّل من قبل لنفس `refType` (منع الازدواج).
2. **اقبل `saveJournalEntry` من العميل للقيود اليدوية فقط** (`ReferenceType === 'Manual'`) وبصلاحية admin/accountant، مع فرض التوازن على السيرفر:

```js
if (action === 'saveJournalEntry') {
  if (!['admin','accountant'].includes(String(session.role||'').toLowerCase()) && !session.superuser)
    return jsonOut({ error: 'القيود المحاسبية متاحة للمدير والمحاسب فقط' }, 403);
  const lines = typeof body.data.Lines === 'string' ? JSON.parse(body.data.Lines || '[]') : (body.data.Lines || []);
  const td = lines.reduce((s,l)=>s+Number(l.Debit||0),0);
  const tc = lines.reduce((s,l)=>s+Number(l.Credit||0),0);
  if (Math.abs(td - tc) > 0.005) return jsonOut({ error: 'القيد غير متوازن: مدين ' + td + ' ≠ دائن ' + tc }, 400);
  if (lines.some(l => !l.AccountCode)) return jsonOut({ error: 'كل سطر يجب أن يحمل كود حساب' }, 400);
  // ... باقي الحفظ مع ReferenceType = 'Manual' إجبارياً
}
```
3. استبدل كل استدعاءات `appendRow(SHEET_JOURNAL, body.journalEntry)` في العمليات التشغيلية بقيود **يبنيها السيرفر** من بيانات العملية نفسها (وليس من `body`).

**معيار القبول:** إرسال قيد غير متوازن → رفض 400. إرسال `ReferenceType:"Sale"` من كاشير → رفض. لا يوجد أي مسار يكتب في `JournalEntries` ببيانات مالية خام من العميل.

## S4 — القفل السيرفري وتصحيح حد الطلبات
**الموقع:** `files(11)/GoogleAppsScript_Backend.gs.txt:69-93`, `:203`, `:361`

```js
// استبدل checkRateLimit بالكامل:
function checkRateLimit(bucketKey, maxPerMinute) {
  try {
    const cache = CacheService.getScriptCache();
    if (!cache) return false;                            // fail-closed
    const key = 'rl_' + String(bucketKey).replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40);
    const count = Number(cache.get(key) || 0) + 1;
    if (count > (maxPerMinute || 90)) return false;
    cache.put(key, String(count), 60);
    return true;
  } catch (e) { return false; }
}
function hashKey(v){ return hashPassword(String(v||'anon')).slice(0,24); }  // لا تُخزّن التوكن خاماً كمفتاح
```

- في `doGet` (السطر 203): استبدل `e.parameter.sessionToken` بمفتاح **مشتق**: `hashKey(e.parameter.sessionToken || 'anon_get')` — ومعه عدّاد عام `'global_get'` بحد 800/دقيقة. **لا تعتمد على أي قيمة يرسلها العميل حرفياً كمفتاح وحيد.**
- في `doPost` (السطر 361): نفس المعالجة بمفتاح `hashKey(body.sessionToken)`.
- **أضف قفلاً على تسجيل الدخول** (وهو الأهم) داخل فرع `login` (السطر 378) **قبل** التحقق من كلمة المرور:

```js
const uname = String(body.name || '').trim().toLowerCase();
const userBucket = 'login_' + hashKey(uname);
if (!checkRateLimit(userBucket, 5)) {
  logAudit('', uname, 'قفل أمني: تجاوز عدد محاولات الدخول');
  return jsonOut({ error: 'تم تجاوز عدد محاولات الدخول المسموح. أعد المحاولة بعد دقيقة.' }, 429);
}
if (!checkRateLimit('login_global', 60)) return jsonOut({ error: 'ضغط عالٍ على الخدمة' }, 429);
```
- وسجّل **المحاولات الفاشلة** على السيرفر: `logAudit('', uname, 'محاولة دخول فاشلة')` عند عدم العثور على المستخدم (السطر 387).
- **معيار القبول:** 6 محاولات دخول فاشلة متتالية بنفس الاسم → الرد السادس 429. تغيير `sessionToken` في كل طلب لا يُلغي الحد.

## S5 — تجزئة كلمات المرور بـ Salt + تكرار
**الموقع:** `files(11)/GoogleAppsScript_Backend.gs.txt:99-103`, `:385`, `:1001-1021`

1. **أضف عمود `Salt`** إلى ورقة `Users`. **حرج:** يجب إضافته إلى `ALLOWED_HEADERS['Users']` في السطر 1096 وإلا فلن يُنشأ العمود:

```js
'Users': ['ID','Name','Password','Salt','Role','Sections','Superuser','Notes']
```

2. استبدل `hashPassword`:

```js
const PBKDF2_ITERATIONS = 5000;   // أقصى ما تسمح به مهلة Apps Script بأمان
function generateSalt() {
  return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 16);
}
function hashPasswordIterated(pass, salt) {
  let digest = String(pass).trim() + ':' + String(salt || '');
  for (let i = 0; i < PBKDF2_ITERATIONS; i++) {
    const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, digest, Utilities.Charset.UTF_8);
    digest = raw.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, '0')).join('');
  }
  return digest;
}
function safeEquals(a, b) {              // مقارنة ثابتة الزمن
  const A = String(a || ''), B = String(b || '');
  if (A.length !== B.length) return false;
  let diff = 0;
  for (let i = 0; i < A.length; i++) diff |= (A.charCodeAt(i) ^ B.charCodeAt(i));
  return diff === 0;
}
function verifyPassword(input, storedHash, storedSalt) {
  if (!storedHash) return false;
  if (storedSalt) return safeEquals(hashPasswordIterated(input, storedSalt), storedHash);
  return safeEquals(hashPassword(input), storedHash);   // توافق مؤقت مع البصمات القديمة فقط
}
```

3. **في `login` (السطر 385):** استخدم `verifyPassword(pass, found.Password, found.Salt)`. **أزل نهائياً** قبول النص الصريح (`=== pass`).
4. **الترحيل التلقائي:** إذا نجح التحقق و`!found.Salt` → وَلّد ملحاً، واحسب البصمة الجديدة، واكتب `Password` + `Salt` في الصف (بنفس نمط السطور 390-408 الحالي).
5. **في `saveUser` (السطر 1007):** وَلّد ملحاً جديداً لكل إنشاء/تغيير كلمة مرور، واكتب العمودين. عند ترك كلمة المرور فارغة، **أبقِ** الملح والبصمة القديمين.
6. **أزل** عرض كلمة المرور من الواجهة: `app-modular/js/modules/17-accounting-finance.js:2437` (حقل كلمة المرور وزر الإظهار) — استبدله بحقل "كلمة مرور جديدة (اتركه فارغاً للإبقاء على الحالية)".
7. **معيار القبول:** ورقة `Users` لا تحتوي أي كلمة مرور نصية. عمود `Salt` موجود ومملوء. الدخول يعمل بعد الترحيل.

## S6 — منع تصعيد الصلاحيات من localStorage
**الموقع:** `app-modular/js/modules/09-shell-and-router.js:143-182`, `:188` · `app-modular/js/modules/19-login.js:291`

1. **احذف** الاستدعاء `normalizeUserSections(state.user)` من `render()` (السطر 188).
2. **احذف** إعادة كتابة الدور من التخزين المحلي داخل `normalizeUserSections` (السطور 159-171): لا تُسند `u.role` ولا `u.superuser` من `localU` إطلاقاً. اترك فقط تطبيع شكل المصفوفة (`sections` كـ array) وحذف `settings` لغير المدير.
3. في `19-login.js:291`: **احذف** `(localU && localU.Role) ? localU.Role : res.role` واستخدم `res.role` من السيرفر حصراً. نفس الأمر لـ `Sections` — من `res.sections` حصراً.
4. **خزّن الجلسة في `sessionStorage` فقط** (وليس `localStorage`) — عدّل `20-app-boot.js` و`07-state.js` و`logout()`:
   - `localStorage.removeItem('microerp_session')` وأزل القراءة منه.
   - `microerp_session_token`: `sessionStorage` فقط.
   - في `logout()` (`09-shell-and-router.js:1389-1404`) أزل التوكن من كلا المخزنين.
5. **أضف تحققاً سيرفرياً دورياً:** أضف action `getMe` في `doGet` يُرجع `{name, role, sections, superuser}` من الجلسة، واستدعِه في `init()` — إن اختلف الدور عن المحفوظ محلياً، غلّب السيرفر أو اطرد الجلسة.
6. **معيار القبول:** بعد تعديل `microerp_users_permanent` في DevTools إلى `Role:"admin"`، لا تتغير الواجهة ولا الأقسام المتاحة للمستخدم بعد `reload`.

## S7 — منع الدخول في وضع عدم الاتصال بلا كلمة مرور
**الموقع:** `app-modular/js/modules/19-login.js:532-539` (ونظيرها في `core/05-auth-and-audit.js`)

```js
if(!navigator.onLine){
  const savedSession = ...;
  if(savedSession && savedSession.name && savedSession.name.toLowerCase() === cleanName.toLowerCase()){
    return savedSession;   // ← بلا أي فحص كلمة مرور
  }
```

**المطلوب:** احذف مسار "الدخول الأوفلاين بالاسم فقط" بالكامل. البديل:
- **إن وُجدت جلسة نشطة صالحة** (`state.user` + توكن غير منتهٍ) → استأنفها تلقائياً بلا شاشة دخول.
- **إن لم توجد** → امنع الدخول واعرض: "لا يمكن تسجيل الدخول لأول مرة بدون اتصال بالإنترنت".
- لا تقبل أبداً أي كلمة مرور محلياً.
- **معيار القبول:** مع إيقاف الشبكة، كتابة اسم `admin` وأي كلمة مرور لا تُدخل النظام.

## S8 — إصلاح XSS (الأولوية القصوى بعد S1)
**النطاق:** كل `${}` داخل قوالب HTML في `app-modular/js/**`.

**الخطوات:**
1. **أنشئ دالة مساعدة واحدة** في `core/06-config-defaults.js` بجوار `escapeHtml` (السطر 825):

```js
/** يهرّب نصاً للاستخدام داخل سلسلة JavaScript ضمن سمة onclick */
function escapeJsString(str){
  return String(str == null ? '' : str)
    .replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"')
    .replace(/\n/g, '\\n').replace(/\r/g, '\\r')
    .replace(/</g, '\\x3c').replace(/>/g, '\\x3e').replace(/&/g, '\\x26');
}
/** يسمح فقط بمخططات الصور الآمنة */
function safeImageUrl(u){
  const s = String(u == null ? '' : u).trim();
  if (/^(https?:|data:image\/)/i.test(s)) return escapeHtml(s);
  return '';
}
```

2. **اقضِ على `onclick` المضمّن كلياً.** استبدل كل نمط:

```js
// ❌ ممنوع
`<button onclick="handleRow('${escapeHtml(name)}')">`
// ✅ مطلوب
`<button data-row-name="${escapeHtml(name)}" class="js-row-btn">`
// ثم في attachHandlers:
main.querySelectorAll('.js-row-btn').forEach(btn => {
  btn.addEventListener('click', () => handleRow(btn.dataset.rowName));
});
```
`escapeHtml` **غير كافٍ** داخل `onclick` لأن المتصفح يفكّ `&#039;` إلى `'` قبل تنفيذ JS.

3. **أصلح مواضع الحقن المباشر المؤكَّدة (كلها تفتقد التهريب):**

| الملف:السطر | المتغير المكشوف |
|---|---|
| `13-treasury-expenses.js:1057-1085` | `it.Name`, `s.Name`, `c.name` (مُنشئ عرض سعر الكاميرات) |
| `09-shell-and-router.js:438-439`, `:455`, `:467-472` | `r.receiptNumber`, `r.customer.name`, `r.device.*`, `r.faults`, `item.Name` |
| `10-receipts-maintenance.js:1002-1004` | الفئة، الماركة، الأعطال، الملحقات |
| `13-treasury-expenses.js:289-296` | `t.title`, `t.notes`, `t.reference`, `t.category` |
| `12-invoices-quotes.js:1579-1581` | قالب الطباعة |
| `14-inventory-warehouse.js:431,444,457,464,468,482` | `value="${item.Name}"` (حقن سمة) |
| `06-config-defaults.js:698`, `:776` | `photo.url` |
| `08-public-tracking.js:47` | `logoUrl` → استخدم `safeImageUrl` |
| `11-customers-crm.js:187,203,210,216` | `onclick` مضمّن بأسماء العملاء |

4. **قاعدة عامة تُطبّقها على كل ملف:** كل إدراج لقيمة قادمة من المستخدم أو من Google Sheets داخل HTML **يجب** أن يمر عبر `escapeHtml`، وكل إدراج داخل سمة → `escapeHtml`، وكل URL صورة → `safeImageUrl`. راجع الملفات الثلاثة الأقل تغطية: `14-inventory-warehouse.js` (9 استدعاءات `escapeHtml` فقط)، `15-pos-retail.js` (26)، `12-invoices-quotes.js` (16) — مقابل حجمها.
5. **معيار القبول:** أنشئ صنف مخزون باسم `<img src=x onerror="window.__xss=1">` وعميلاً باسم `');window.__xss=1;//` ثم افتح: قسم الكاميرات، شاشة العملاء، المخزون، الفواتير، الخزينة → `window.__xss` يبقى `undefined` في كل الشاشات.

## S9 — تأمين بوابة التتبع العامة
**الموقع:** `files(11)/GoogleAppsScript_Backend.gs.txt:196-239` · `app-modular/js/core/08-public-tracking.js`

1. **أضف عمود `TrackToken`** إلى `ALLOWED_HEADERS['Receipts']` (السطر 1078) وبالتالي إلى ورقة `Receipts`.
2. عند `saveReceipt`: إن لم يوجد `TrackToken`، وَلّد واحداً: `Utilities.getUuid().replace(/-/g,'').slice(0,20)`.
3. **غيّر `trackReceipt`** ليبحث بـ `TrackToken` (لا `ReceiptNumber`) وبمقارنة عمود محدد:

```js
if (action === 'trackReceipt') {
  const tok = String(e.parameter.t || '').trim();
  if (!tok || tok.length < 12) return jsonOut({ found: false }, 404);
  const sh = getSheet(SHEET_RECEIPTS);
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const tokCol = headers.indexOf('TrackToken');
  if (tokCol < 0) return jsonOut({ found: false }, 404);
  const colVals = sh.getRange(2, tokCol + 1, Math.max(1, sh.getLastRow() - 1), 1).getValues();
  let rowNum = -1;
  for (let i = 0; i < colVals.length; i++) { if (String(colVals[i][0]) === tok) { rowNum = i + 2; break; } }
  if (rowNum < 0) return jsonOut({ found: false }, 404);
  // ... اقرأ الصف وأعد حقولاً مختصرة فقط
}
```
4. **احذف من الاستجابة الحقول المالية:** لا تُرجع `cost`, `deposit`, `refunded`. أعد فقط: `receiptNumber`, `date`, `customer.name` (الاسم الأول فقط إن أمكن), `device`, `status`, `deliveryDate`.
5. **حدّث الواجهة** (`core/08-public-tracking.js:129` و`checkCustomerTrackingURL`) لتستخدم `?t=<TrackToken>` بدل رقم الإيصال، وحدّث رابط التتبع في قوالب الواتساب (`06-config-defaults.js` → `waTemplates`، المتغير `{track_url}`) لتوليد الرابط بالتوكن.
6. **معيار القبول:** `?track=MT-2026-0001` لا يُرجع بيانات. `?t=<توكن صحيح>` يعمل. حلقة على 50 رقماً متسلسلاً لا تكشف شيئاً.

## S10 — المرتجعات والديون: idempotency وسقوف على السيرفر
**الموقع:** `files(11)/GoogleAppsScript_Backend.gs.txt:721-774`

1. **`settleSaleDebt` (721):**
```js
// اقرأ Total أيضاً، وارفض أي زيادة عن المتبقي:
const totalCol = headers.indexOf('Total');
const curPaid = safeNumber(values[i][paidCol], 0);
const total   = safeNumber(values[i][totalCol], 0);
const amount  = safeNumber(body.amount, 0);
if (amount <= 0) return jsonOut({ error: 'المبلغ يجب أن يكون أكبر من صفر' }, 400);
if (curPaid + amount > total + 0.005) return jsonOut({ error: 'المبلغ يتجاوز المتبقي على الفاتورة' }, 400);
if (body.clientRef) { /* ارفض إن سبق استخدام نفس clientRef */ }
```
2. **`saveReturn` (736):** أضف تحققات إلزامية:
   - اقرأ البيع الأصلي من `SHEET_SALES` بـ `body.saleId`؛ إن لم يوجد → 404.
   - اجمع كل صفوف `Returns` السابقة لنفس `SaleID` وارفض إن `مجموعها + المبلغ الجديد > Total + 0.005`.
   - ارفض إن كان `body.clientRef` مستخدماً من قبل (خزّن `ClientRef` في ورقة `Returns` — أضفه إلى `ALLOWED_HEADERS['Returns']`).
   - **أعد المخزون على السيرفر** من `body.items` (مثل `saveSale` بالعكس) بـ `+=` مع قيد تسوية.
   - **ارفض** أي `refundAmount <= 0`.
   - **أنشئ قيداً عكسياً** على السيرفر: `Dr 4102 / Cr 1101` (أو الحساب المناسب لطريقة الاسترداد)، وإن أُعيد للمخزون: `Dr 1104 / Cr 5102`.
3. **معيار القبول:** إرسال نفس المرتجع مرتين → الثاني 400. مرتجع أكبر من قيمة الفاتورة → 400. المخزون يعود صحيحاً.

## S11 — سجل الرقابة: تدقيق شامل + منع التلويث
**الموقع:** `files(11)/GoogleAppsScript_Backend.gs.txt:1028-1033`, `:1170-1178`

1. **أضف `logAudit` إلى كل عملية كتابة:** مع `before`/`after` للقيم المالية. غيّر التوقيع:

```js
function logAudit(refId, user, action, refType, detailsJson) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('AuditLog');
  if (!sh) { sh = ss.insertSheet('AuditLog'); sh.appendRow(['Timestamp','User','Action','ReceiptID','RefType','Details','RowHash']); }
  const prev = sh.getLastRow() > 1 ? String(sh.getRange(sh.getLastRow(), 7).getValue() || '') : '';
  const ts = new Date();
  const details = detailsJson ? JSON.stringify(detailsJson) : '';
  const rowHash = hashPassword(prev + '|' + ts.toISOString() + '|' + user + '|' + action + '|' + details);
  sh.appendRow([ts, user, action, refId, refType || '', details, rowHash]);
}
```
سلسلة `RowHash` تجعل أي تعديل أو حذف في السجل **قابلاً للكشف** (سلسلة تجزئة متصلة).

2. **أزل `saveAuditLog` من العميل نهائياً** (السطور 1028-1033) — أو اجعله يقبل فقط حقل `action` من قائمة بيضاء بلا أي نص حر. **واستخدم `logAudit` مباشرة على السيرفر** في كل عملية.
3. **أضف `logAudit` إلى:** `saveSale`, `saveReturn`, `savePurchase`, `settleSaleDebt`, `settlePurchaseDebt`, `saveInvoice`, `saveExpense`, `saveCustomer`, `saveInventoryItem`, `adjustInventoryQty`, `saveJournalEntry`, `markSerialSold`, `verifySupervisorPin` (نجاح/فشل), `saveUser`, `deleteUser`.
4. **في الواجهة:** اجعل مركز الرقابة (`17-accounting-finance.js`) يقرأ سجل السيرفر عبر action جديد `getAuditLog` (admin فقط) بدل `localStorage`. أبقِ السجل المحلي كذاكرة مؤقتة فقط.
5. **معيار القبول:** حذف إيصال، تعديل مصروف، تغيير مخزون → كلها تظهر في `AuditLog` بـ `User` الصحيح (من الجلسة) مع القيم قبل/بعد.

## S12 — حقن صيغ CSV في التصدير
**الموقع:** `downloadCSV` في `app-modular/js/modules/11-customers-crm.js:5933-5945` ومستخدِموها (`:5907`, `:5924`, `:5950`, `455`), `12-invoices-quotes.js:649`, `17-accounting-finance.js:2662`

عدّل `downloadCSV` مركزياً:

```js
function csvSafe(v){
  let s = String(v == null ? '' : v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;      // يمنع تنفيذ الصيغة في Excel
  if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}
```
طبّقها على كل خلية. **معيار القبول:** تصدير عميل اسمه `=1+1` → يظهر في Excel كنص لا كصيغة.

## S13 — مفتاح Gemini والبيانات الحساسة
**الموقع:** `18-settings-admin.js:2367-2384` · `files(11)/GoogleAppsScript_Backend.gs.txt:252-254`, `:315-319`

1. **لا تُرجِع المفتاح في `getBootstrapData` ولا `getSettings`** لأي مستخدم غير المدير. في السيرفر: عند بناء كائن `settings`، إن لم يكن `session.role === 'admin'` احذف الحقل `gemini` (وابتر أي مفتاح يحتوي `apiKey`).
2. **لا تخزّن المفتاح في localStorage** — أبقِه في `sessionStorage` فقط، أو (الأفضل) انقل نداءات Gemini إلى السيرفر عبر action `aiProxy` فلا يصل المفتاح للعميل إطلاقاً. اختر `aiProxy` إن كان الكود يستخدم المفتاح من المتصفح حالياً.
3. **لا تُخزّن `sessionToken` داخل عناصر طابور الأوفلاين** (`core/02-api-sync.js:50-62`) — احذف نسخ التوكن في `addToSyncQueue`؛ يُضاف التوكن لحظة الإرسال فقط.
4. **لا ترسل التوكن في رابط GET.** إمّا:
   - انقل كل القراءات إلى POST، أو
   - أضف طبقة تشفير/RPC تمرّر التوكن في الـ body.
   بينما تُنجز النقل، أضف ترويسة `X-Session-Token` وأرسلها في `fetch` (Apps Script يقرأها بـ `e.parameter` عند POST فقط) — الطريقة العملية: **حوّل كل `apiGet` إلى POST** لتفادي ظهور التوكن في سجلات الوصول و`Referer` والـ History.
   **معيار القبول:** لا يظهر `sessionToken` في أي URL.

## S14 — تحصين Electron
**الموقع:** `main.js`, `preload.js`, `app-modular/build.js`

1. `main.js:44` → `sandbox: true` (وتأكد أن `preload.js` لا يحتاج node APIs خارج `contextBridge` — هو كذلك).
2. **أضف CSP** إلى قالب `build.js` (قبل `</head>`) وإلى `app-modular/index.html`:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none';
               script-src 'self' 'unsafe-inline';
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: blob: https:;
               font-src 'self' data:;
               connect-src https://script.google.com https://generativelanguage.googleapis.com;
               form-action 'none'; frame-ancestors 'none'; base-uri 'none';">
```
> ملاحظة: `'unsafe-inline'` في `script-src` مطلوب لأن الحزمة سكربت مضمّن وقوالب `onclick`. بعد إنجاز S8 (إزالة `onclick`) يمكنك إزالة `'unsafe-inline'` نهائياً وإعادة الاختبار.
3. **أزل روابط خطوط Google** من قالب `build.js` ومن `app-modular/index.html`، واستخدم خطوط النظام (`font-family` احتياطية في `css/01-variables.css`). **لا** تضمّن ملفات خطوط ثنائية في المستودع.
4. **احذف `JsBarcode` من CDN** في `app-modular/index.html:10` (الحزمة الإنتاجية تضمّنه أصلاً عبر `build.js:20-26`) — استخدم نفس الملف المحلي `assets/JsBarcode.all.min.js` في وضع التطوير.
5. **عطّل DevTools في الإنتاج**، مع إبقائها في التطوير:
```js
const isDev = !app.isPackaged;
webPreferences: { devTools: isDev, ... }
```
واحذف عنصر القائمة `role: 'toggleDevTools'` أو اجعله شرطياً على `isDev`.
6. **قيّد `open-external` و`setWindowOpenHandler` بمخططات مسموحة:**
```js
const ALLOWED_SCHEMES = ['https:', 'tel:', 'mailto:'];
function isSafeExternal(url){ try { return ALLOWED_SCHEMES.includes(new URL(url).protocol); } catch { return false; } }
ipcMain.handle('open-external', async (event, url) => { if (!isSafeExternal(url)) return false; await shell.openExternal(url); return true; });
```
و`printSilent`/`print` في `main.js`: تحقق أن `options` كائن وأن `deviceName` نص، وأن `copies` عدد صحيح ضمن 1..10.
7. **أعد كتابة `00-security-hardening.js`:** احذف الطبقتين 2 و5 (منع القائمة اليمنى ومنع التحديد والنسخ — تضر الموظفين بلا قيمة أمنية)، واحتفظ بمنع `eval` فقط، **وثق في تعليق أعلى الملف** أن الحماية الحقيقية هي CSP + التفويض السيرفري + تعطيل DevTools في الإنتاج. **معيار القبول:** يمكن للموظف نسخ رقم هاتف بالنقر والسحب.

## S15 — إصلاحات أمنية صغيرة (مؤكدة)
**الموقع:** `files(11)/GoogleAppsScript_Backend.gs.txt`

| # | السطر | الإصلاح |
|---|---|---|
| S15a | 1180-1182 | `jsonOut(obj, statusCode)` — Apps Script لا يدعم أكواد الحالة في `ContentService`. أضف الحالة **داخل الجسم** دائماً: `{ ok:false, error, status: statusCode }` لتفهم الواجهة الفرق بين 401/403/429/500. |
| S15b | 189 | `setXFrameOptionsMode(ALLOWALL)` → `DEFAULT` (لمنع التأطير). |
| S15c | 1022-1027 | `deleteUser`: العميل يرسل `ID` والكود يحذف بعمود `Name`. اجعل الحذف يبحث أولاً بـ `ID` ثم `Name`، **وارفض** حذف آخر مدير أو حذف المستخدم الحالي. |
| S15d | 270, 308, 1010 | `!!u.Superuser` يحوّل النص `"FALSE"` إلى `true`. استبدله بـ: `['true','1','yes','نعم'].includes(String(v.Superuser).trim().toLowerCase())`. |
| S15e | 110-171 | **تنظيف الجلسات:** في `createSession` احذف كل خصائص `sess_*` المنتهية (مرة كل بضع عمليات إنشائية) لتفادي الوصول لحد 500KB. أضف `cleanupExpiredSessions()`. |
| S15f | 111 | أضف `sessionVersion` أو `tokenIssuedAt` إلى الجلسة، و**أبطل كل جلسات المستخدم** عند تغيير كلمة مروره أو دوره أو حذفه (منع بقاء جلسة قديمة بصلاحيات قديمة). |
| S15g | 385 | المقارنة أصبحت ثابتة الزمن عبر `safeEquals` (انظر S5). |

## S16 — الأمان التشغيلي للمستودع
1. **المستودع عام على GitHub** (`https://github.com/ahmedsaeid2k/MTrepair.git`) والمصدر + رابط الـ API مُودَعان فيه. **لا يمكنك تغيير إعدادات GitHub** — اكتب بنداً واضحاً في `audit/fixes-report.md` بعنوان **«إجراء مطلوب من صاحب العمل (خارج الكود)»** يتضمن: تحويل المستودع إلى Private، وتدوير رابط نشر Apps Script (Deploy → New deployment → Archive القديم)، وتغيير كلمات مرور كل المستخدمين بعد ترحيل التجزئة.
2. **انقل `API_URL` إلى إعداد** بدل ثابت في `core/02-api-sync.js:2`: اقرأه من `localStorage.microerp_api_url` وإلا من الثابت — حتى يمكن تدويره بلا إعادة بناء الحزمة. **لا** تجعل الحزمة تفشل إن لم يوجد.

---

# المرحلة 2 — سلامة الأرقام المالية (P1) 💰

> **القاعدة الحاكمة:** **الدفتر العام (`JournalEntries`) هو مصدر الحقيقة الوحيد.** كل تقرير مالي يُبنى من القيود فقط — لا من `state.sales` ولا `state.invoices` ولا `state.expenses`.

> **⚠️ ترتيب إلزامي داخل المرحلة 2 — لا تخالفه:**
> `F2 (إيقاف ازدواج الإيراد)` → `F7 (استكمال تغطية الترحيل)` → `F3 (الضريبة)` → `F4 (التكلفة)` → `F5 (قائمة الدخل)` → `F1 (توحيد المصدر)` → `F6 (الورديات)` → `F8 (الأرصدة)` → `F9 (المرتجعات)` → `F10 (الخصومات)`.
>
> **السبب:** لو نفّذت F3 (قيود الضريبة) أو F7 (قيود الفواتير) **قبل** F2، ستضاعف الإيراد الحالي بدل إصلاحه. ولو نفّذت F1 (التقارير من الدفتر) **قبل** F7، ستختفي إيرادات الفواتير والمصروفات من قائمة الدخل تماماً (لأنها لا تدخل الدفتر أصلاً).
> بعد كل بند من هذه البنود: شغّل `node app-modular/build.js` والقائمة اليدوية ذات الصلة، ولا تنتقل للتالي قبل نجاحه.

## F1 — توحيد مصدر الحقيقة للتقارير
**الموقع:** `modules/17-accounting-finance.js:744-887` (قائمة الدخل) · `core/04-chart-of-accounts.js:303-332` (أرصدة الحسابات)

1. أعد كتابة `getIncomeStatementData` لتُبنى **بالكامل** من `state.journalEntries`:
   - الإيرادات = مجموع (دائن − مدين) للحسابات تحت `4` (الإيرادات) خلال الفترة.
   - التكلفة = مجموع (مدين − دائن) للحسابات تحت `51` و`52`.
   - المصروفات = مجموع (مدين − دائن) للحسابات تحت `5` (ما عدا التكلفة).
   - لا توجد أي قراءة من `state.sales`/`state.receipts`/`state.invoices`/`state.expenses` في هذه الدالة.
2. **احتفظ بالتفصيل التشغيلي** (عدد الإيصالات، عدد المبيعات، تفصيل فئات المصروفات) كبيانات **إحصائية** في قسم منفصل من التقرير، مشتقّ من المصفوفات، ومكتوب عليه صراحة "بيانات إحصائية — ليست الأساس المحاسبي".
3. أضف بانر تحقق أعلى قائمة الدخل وميزان المراجعة:
   **«مطابقة الدفتر: مجموع مدين القيود = X · مجموع دائن القيود = Y · الفرق = Z»** مع لون أحمر إن كان الفرق ≠ 0.
4. **معيار القبول:** الفرق المعروض = 0. قائمة الدخل وميزان المراجعة يعطيان نفس صافي الربح لنفس الفترة.

## F2 — إغلاق ثغرة ازدواج الإيراد (مؤكدة ومُثبتة بالكود)
**الموقع:** `core/03-utils-and-mappings.js:1044-1084` (`savePaymentRemote`) · `core/04-chart-of-accounts.js:107-257` (`reconcileHistoricalJournalEntries`) · `modules/17-accounting-finance.js:835`

**المشكلة المُثبتة (مثال: إصلاح بتكلفة 1000، عربون 400، والباقي 600 سُدِّد لاحقاً):**
| القيد | السطور | الأثر على 4101 |
|---|---|---|
| تحصيل العربون 400 | `core/03:1074-1082` → Dr خزينة / **Cr 4101** | +400 إيراد |
| إثبات مديونية الباقي 600 عند التسليم | `core/04:236-239` → Dr 1103 / **Cr 4101** | +600 إيراد |
| تحصيل الـ 600 | نفس مسار الدفعة → Dr خزينة / **Cr 4101** | +600 إيراد |
| **الإجمالي المُعترف به** | | **1600 لإصلاح قيمته 1000** |

والمدينون (1103) يبقى مديناً بـ 600 **لا يُقفل أبداً** لأنه يُقفل بالدائن لا بالإيراد.

**الإصلاح الصحيح (قيدان لا ثلاثة):**
1. **عند تسليم/إكمال الإيصال (الاعتراف بالإيراد):**
   `Dr 1103 (إجمالي المستحق) / Cr 4101 (المصنعية) / Cr 4104 أو 4101-قطع (قيمة القطع) — وبفرق = المدفوع مقدماً يُعالج كالتالي:`
   - **العربون لا يُعالج إيراداً.** عند التحصيل قبل إتمام العمل: `Dr 1101/1102 / Cr 2102 (أمانات ومقدمات عملاء الصيانة)` — الحساب `2102` معرَّف بالفعل في شجرة الحسابات (`core/04-chart-of-accounts.js:19-21`).
   - عند التسليم: `Dr 2102 (العربون) + Dr 1103 (المتبقي) / Cr 4101` (الإيراد الكامل مرة واحدة فقط).
2. **عند التحصيل اللاحق:** `Dr 1101/1102 / Cr 1103` — **لا يمس الإيراد إطلاقاً**.
3. غيّر `savePaymentRemote` (`core/03:1074-1082`) والقيد التاريخي (`core/04:123-141`) ليكونا: `Cr 2102` إن كان الإيصال لم يُسلّم بعد، و`Cr 1103` إن كان قد سُلّم. **لا تضع `4101` في أي قيد تحصيل.**
4. **أصلح مفتاح منع الازدواج:** المفتاح الحالي `Receipt_<receiptId>` (`core/04:114`) يجعل **كل** دفعات نفس الإيصال تحت مفتاح واحد → يُسجَّل قيد واحد فقط. استخدم `Receipt_<paymentId>` لكل دفعة.
5. **لا تُشغّل `reconcileHistoricalJournalEntries` تلقائياً** (`core/04:267-269`). هذا التوليد من العميل **لا يُرسَل للسيرفر** (فقط `setCache` في السطر 253) → كل جهاز يبني دفتراً مختلفاً. اجعله:
   - لا يعمل تلقائياً أبداً،
   - متاحاً كأداة إدارية صريحة "ترحيل البيانات التاريخية" تُنفَّذ **مرة واحدة** على السيرفر وتُسجَّل في التدقيق.
6. **عرّف `autoPostJournalEntry` أو احذف استدعاءاتها.** `modules/11-customers-crm.js:795` و`:4052` تستدعيانها داخل `if(typeof autoPostJournalEntry === 'function')` **وهي غير معرّفة في المشروع كله** → قيد التسليم الآجل **لا يُرحَّل صامتاً**. نفّذ المنطق المطلوب مباشرة عبر `recordAutoJournalEntry`.
7. **معيار القبول:** إصلاح بـ 1000 وعربون 400 ثم سداد 600 → الرصيد على 4101 = 1000 بالضبط، والرصيد على 1103 = 0، والرصيد على 2102 = 0.

## F3 — ضريبة القيمة المضافة (VAT)
**الموقع:** `modules/15-pos-retail.js:120-127`, `:1496` · `core/03-utils-and-mappings.js:1246-1247` · `core/04-chart-of-accounts.js:10,21`

**الحسابان موجودان ومعطَّلان:** `2104` (مخرجات) و`1105` (مدخلات) — لا يوجد أي قيد يستخدمهما.

1. **وحّد معادلة المستند** في دالة مشتركة واحدة في `core/03-utils-and-mappings.js` واستخدمها في POS والفاتورة وعرض السعر:
```js
function computeDocTotals(lines, discountType, discountValue, taxRate, taxInclusive){
  const subtotal = lines.reduce((s,l) => s + (Number(l.qty||1) * Number(l.price||0)), 0);
  const discount = discountType === 'percent'
    ? round2(subtotal * (Number(discountValue||0) / 100))
    : Math.min(subtotal, Number(discountValue||0));
  const net = round2(subtotal - discount);
  const taxAmount = taxInclusive
    ? round2(net - (net / (1 + Number(taxRate||0) / 100)))
    : round2(net * (Number(taxRate||0) / 100));
  const total = taxInclusive ? net : round2(net + taxAmount);
  return { subtotal: round2(subtotal), discount, net: taxInclusive ? round2(net - taxAmount) : net, taxAmount, total };
}
```
**حدد سياسة `taxInclusive` من إعداد واحد** (`state.settings.pos.taxInclusive`) — القرار الحالي: POS يفرض الضريبة **بعد** الخصم (`15:352`) والفاتورة **قبل** الخصم (`11:6349`) → **وحّدهما**. (إن لم يحدد صاحب العمل، استخدم **غير شاملة والضريبة بعد الخصم** — وهو المعيار المصري للفاتورة الضريبية، ووثّق الافتراض.)
2. **أضف `round2`** في `core/06-config-defaults.js` واستخدمها في **كل** معادلة مالية (ابحث عن `toFixed`, `Math.round(... * 100)` واستبدلها).
3. **سجّل الضريبة على المبيعات:** أضف أعمدة `TaxPercent`, `TaxAmount`, `NetRevenue` إلى `ALLOWED_HEADERS['Sales']` (`GoogleAppsScript_Backend.gs.txt:1084`) واكتبها في `saveSale`. **احذف `TaxPercent: 0` الثابت** في `modules/15-pos-retail.js:1496`.
4. **قيود الضريبة:**
   - البيع/الفاتورة: `Dr الصندوق/المدينون بالإجمالي / Cr 4102 بالصافي / Cr 2104 بالضريبة`.
   - الشراء/المصروف الخاضع: `Dr 1104 (الصافي) + Dr 1105 (الضريبة) / Cr الخزينة أو 2101 بالإجمالي`.
5. **أضف تقرير ضريبي** في `17-accounting-finance.js`: تبويب "الإقرار الضريبي" يعرض للفترة: ضريبة المخرجات (2104)، ضريبة المدخلات (1105)، **الصافي المستحق**، مع طباعة A4.
6. **معيار القبول:** فاتورة بـ 1000 + 14% → `Total = 1140`، ورصيد 2104 = 140. تقرير الإقرار يعرض 140. ميزان المراجعة متزن.

## F4 — التكلفة (COGS) وتقييم المخزون
**الموقع:** `core/03-utils-and-mappings.js:1457-1470`, `:1231-1235` · `modules/17-accounting-finance.js:768-777` · `core/04-chart-of-accounts.js:497`

**المشكلة المُثبتة — تناقض بين العميل والسيرفر:**
- العميل: `invItem.PurchasePrice = Number(it.purchasePrice)` → **آخر سعر شراء** (`core/03:1464`).
- السيرفر: يحسب **المتوسط المرجح** (`Backend:823-830`)، لكنه يهمل الرصيد إن كانت الكمية ≤ 0، ويقرّب لمنزلتين في كل شراء.

1. **اعتمد المتوسط المرجح المتحرك في العميل أيضاً** وطابق معادلة السيرفر حرفياً:
```js
const oldQty = Number(invItem.Quantity || 0);
const oldCost = Number(invItem.PurchasePrice || 0);
const newQty = Number(it.qty || 0);
const newCost = Number(it.purchasePrice || 0);
invItem.Quantity = oldQty + newQty;
invItem.PurchasePrice = (oldQty + newQty) > 0
  ? round4(((Math.max(0, oldQty) * oldCost) + (newQty * newCost)) / (oldQty + newQty))
  : newCost;
```
و**أصلح معادلة السيرفر** بنفس المنطق (لا `currentQty > 0 ? ... : 0`)، واستخدم `round4` (4 منازل) داخلياً و`round2` عند العرض فقط.
2. **امنع COGS صفرياً/وهمياً:** إن كان `PurchasePrice <= 0` لصنف يُباع، **لا** تُرحّل قيد COGS بصفر بصمت — بل:
   - إمّا ارفض البيع برسالة "الصنف بلا سعر تكلفة — راجع بيانات المخزون"،
   - أو رحّل بسعر تقديري **وسجّل استثناءً في التدقيق** وأظهر تنبيهاً للتقرير.
   وأضف تقرير "أصناف بسعر تكلفة صفري" في شاشة المخزون.
3. **أزل التقدير المخترع `tot * 0.70`** في `17:776` — استبدله بعرض صريح "تكلفة غير معروفة" في التقرير وعدم احتسابها في مجمل الربح.
4. **قيد COGS للبيع:** احفظ تكلفة الوحدة **وقت البيع** (`costAtSale`) داخل `ItemsJSON`، واستخدمها في COGS والتقارير والمرتجعات (لا السعر الحالي).
5. **معيار القبول:** شراء 10 بـ 100 ثم 10 بـ 200 → التكلفة = 150. بيع 5 → COGS = 750، والمخزون 15 قطعة بقيمة 2250.

## F5 — إصلاح قائمة الدخل: خطأ `cost − parts`
**الموقع:** `modules/17-accounting-finance.js:820-823`

```js
const labor = Math.max(0, cost - parts) + other;   // ❌ يطرح تكلفة القطع من المصنعية
maintLaborRev += labor;
maintPartsRev += parts;
maintPartsCOGS += parts;
```
`r.cost` = المصنعية فقط و`r.partsCost` = تكلفة القطع (مُثبت: `10-receipts-maintenance.js:944` → `totalDue = cost + partsCost + other`) و(`10-receipts-maintenance.js:884-886` → `partsCost = qty × item.PurchasePrice`).
**الأثر:** أي إصلاح تكلفة قطعه أكبر من مصنعيته (وهو الغالب: شاشة لابتوب 3000 ومصنعية 200) يُصفّر المصنعية ويحذف **200 ج.م** من الإيراد.

- **الإصلاح:** احسب الإيراد من الدفتر (F1) لا من هذه المعادلة. وإن أبقيت نسخة إحصائية، فاستخدم:
```js
const laborRev = Number(r.cost || 0) + Number(r.otherAccountAmount || 0);
const partsRev = Number(r.partsCost || 0);
const partsCostReal = Number(r.partsBuyCost || Number(r.partsCost || 0));
```
- **استخدم `partsBuyCost`** (موجود ويُكتب فعلاً في `11-customers-crm.js:3550` و`:3984`) كتكلفة، و`partsCost` كسعر بيع للقطعة. **طبّق هامش ربح على القطع** أو وثّق أن سياسة الشركة هي "القطع بالتكلفة" — اكتب السؤال في `audit/fixes-report.md`.
- **أصلح قائمة الحالات الملغاة** (`17:814`): الكود يفحص `'ملغي'` و`'لا يمكن إصلاحه'` وهي **غير موجودة** في `STATUSES` (`core/06-config-defaults.js:18-25`) الذي يستخدم `'تعذرت الصيانة'` و`'رفض العميل'`. **استخدم ثوابت من `STATUSES` لا سلاسل مكتوبة يدوياً.**
- **معيار القبول:** إصلاح بـ (مصنعية 200 + قطع 3000) → إيراد الصيانة = 3200 لا 300.

## F6 — الورديات وتقفيل الدرج (Z-Report)
**الموقع:** `modules/12-invoices-quotes.js:700-848`, `:850-901`, `:970`

| # | المشكلة (مؤكدة بالكود) | الإصلاح |
|---|---|---|
| **a0** | **🔴 السبب الجذري: السيرفر يُسقط `ShiftID` و`Time` من كل بيع.** العميل يضع `ShiftID` (`core/03:1202`) لكن `saveSale` (`Backend:676-688`) يبني كائناً بحقول ثابتة و`appendRow` لا يكتب غيرهما، و`ALLOWED_HEADERS['Sales']` (`:1084`) لا يضمهما → **بعد أي إعادة تحميل يصبح `s.ShiftID` فارغاً لكل المبيعات** ويسقط التقرير دائماً إلى مطابقة التاريخ | **أضف `ShiftID` و`Time` و`TaxPercent` و`TaxAmount` و`NetRevenue` و`ChangeDue` إلى `ALLOWED_HEADERS['Sales']` (`:1084`) وإلى كائن `sale` في `saveSale` (`:676-688`).** هذه أول خطوة في F6 — بلاها لا قيمة لأي إصلاح آخر في الورديات. |
| a | **البيع ممكن بلا وردية:** `processSale` (`15-pos-retail.js:1023-1096`) لا يفحص `state.activeShift` | امنع البيع تماماً برسالة "لا توجد وردية مفتوحة". وفي `saveSaleRemote` ارفض الإرسال بلا وردية. وفي `saveSale` على السيرفر: ارفض إن كان `shiftId` فارغاً. |
| b | **التقفيل لا يمنع البيع بعده:** `closeActiveShift` (`12:850-901`) يضبط `activeShift = null` فقط | بعد الإصلاح (a) يمنع تلقائياً. أضف أيضاً منع التقفيل إن وُجدت سلة معلّقة (`state.heldCarts`) أو مستندات غير مرحلة. |
| c | **إسناد المبيعات للوردية بالتاريخ لا بالـ ShiftID:** `12:717-721` | ```js
if (s.ShiftID) return s.ShiftID === shift.id;
return isTimeMatch(s.Date || s.date, s.Time || s.time);
``` بعد إصلاح (a0). |
| d | **`expectedCash` يستخدم `AmountPaid` (المُسلَّم) لا الصافي** → كل باقٍ يُرد للعميل يظهر كعجز وهمي (`12:730`, `:753-754`, `:813`) | استخدم **النقد المُحصَّل فعلاً**: `posCash += Number(s.AmountPaid ?? tot) - Number(s.ChangeDue || 0)`. واحفظ `ChangeDue` عند البيع (انظر a0). |
| e | **`totalTurnover` لا يخصم المرتجعات** و`returnsCash += paid` بدل مبلغ الاسترداد الفعلي (`12:736-738`, `:816`) | استخدم `retDetails.totalRefund` أو `RefundAmount` من ورقة `Returns`. واخصم المرتجعات من الإجمالي. |
| f | **عهدة البداية غير مُقيَّدة محاسبياً وغير مضافة للدرج** (`12:669-686`, `13:104-105`) | قيد `Dr 1101 / Cr 2105 (عهدة/مسؤول الوردية)` عند الفتح، وقيد تسوية عند الإغلاق للعجز/الزيادة على حساب **جديد** `5208 (فروق وعجز الدرج)`. ⚠️ **`5204` و`5206` مستخدمان بالفعل** (`core/04-chart-of-accounts.js:47` و`:49` = بوفيه / أدوات ومستهلكات) — **لا تستخدمهما**. أضف `2105` و`5208` إلى `DEFAULT_ACCOUNTS`. |
| g | **فتح وردية يعيد تسمية المستخدم الحالي:** `12:970` → `if(cashier && state.user) state.user.name = cashier;` | **احذفه.** الاسم من الجلسة حصراً. وإلا فكل حقول `By` في السجلات غير موثوقة. |
| h | **ترقيم الوردية `state.shifts.length + 1`** (`12:670`) → تصادم بعد الحذف | استخدم أقصى رقم موجود + 1، أو رقماً من السيرفر. |
| i | **`stats.netCash` يُعرض كـ"الصافي الفعلي بالدرج"** وهو يشمل الفيزا والآجل (`12:1557`) | افصل: `cashNet` (نقدي فقط) و`liquidityNet` (كل الوسائل). |

**معيار القبول:** لا يمكن البيع بلا وردية. بيع في وردية الصباح لا يظهر في تقرير وردية المساء. Z-Report يطابق النقد الفعلي في الدرج عند إدخال نفس المبالغ.

## F7 — المصروفات والفواتير في الدفتر
**الموقع:** `core/03-utils-and-mappings.js:1428-1432` (حذف مصروف) · `:1566-1613` (`saveInvoiceRemote`) · `core/04-chart-of-accounts.js:562-612` (حذف إيصال)

**مُثبت:** `grep journalEntry` في `13-treasury-expenses.js` و`12-invoices-quotes.js` و`14-inventory-warehouse.js` و`15-pos-retail.js` **لا يُرجع شيئاً** → الفواتير والمصروفات (عبر المسار المباشر) والمرتجعات وتعديلات المخزون **لا تُرحّل للدفتر**.

1. **حذف مصروف (`core/03:1428`):** أضف قيداً عكسياً قبل الحذف (نفس نمط `deletePaymentRemote` في `core/03:1106-1122`) بالبحث عن `ReferenceType='Expense' && ReferenceID=id`.
2. **حذف إيصال (`core/04:562`):** اعكس **كل** قيود `ReferenceType='Receipt' && ReferenceID=receiptId` (لا قطع الغيار فقط)، واحذف الدفعات محلياً أيضاً، وأضف `ReferenceType='Receipt_Revenue_Reversal'`.
3. **الفواتير (`core/03:1566`):** أضف قيد الفاتورة الكامل:
   `Dr 1103/1101 (الإجمالي) / Cr 4101-أو-4102 (الصافي) / Cr 2104 (الضريبة)` + قيد COGS للأصناف.
   ⚠️ **حرج:** هذا سيضاعف الإيراد إن كان `convertSaleToInvoice` (`15-pos-retail.js:1500-1508`) يُنشئ فاتورة لبيع POS مُرحّل أصلاً. **أصلح هذا أولاً:**
   - غيّر `ReferenceType: 'POS'` في `15:1504` إلى `'POS_Sale'` (نفس القيمة التي تستثنيها قائمة الدخل في `17:835`) **أو** الأفضل: اجعل `convertSaleToInvoice` يُنشئ **إشعاراً ضريبياً مرتبطاً** لا فاتورة إيراد مستقلة، وامنع الازدواج بمفتاح `ReferenceID`.
   - أضف في السيرفر `saveInvoice` تحققاً: إن وُجدت فاتورة بنفس `ReferenceType`+`ReferenceID` ارفض أو حدّث بدل الإنشاء.
4. **تعديل/تحرير كمية المخزون والتحويل المخزني (`14-inventory-warehouse.js:624`, `:1063-1084`):** أضف قيد تسوية جردي `Dr/Cr 1104 مقابل 5209 (فروق الجرد والتسويات المخزنية)` — **حساب جديد، لا تستخدم 5206 فهو "أدوات ومستهلكات"**. لكل تعديل كمي يدوي — أو على الأقل سجّله في التدقيق مع الكمية قبل/بعد. **لا تخترع تقييماً** — استخدم `PurchasePrice` الحالي.
5. **الحسابات الجديدة المطلوبة (أضفها إلى `DEFAULT_ACCOUNTS` في `core/04-chart-of-accounts.js`):**

| الكود | الاسم | النوع | الأب | الطبيعة |
|---|---|---|---|---|
| `2105` | عهدة ومسؤولية الكاشير/الوردية | الخصوم | `21` | دائن |
| `4104` | مردودات ومسموحات المبيعات | الإيرادات | `41` | مدين |
| `5208` | فروق وعجز الدرج (فائض/عجز) | المصروفات | `52` | مدين |
| `5209` | فروق الجرد والتسويات المخزنية | المصروفات | `52` | مدين |
| `5301` | فروق التقريب | المصروفات | `53` (أضف الأب) | مدين |

وتأكد أن كل كود جديد مُدرَج في `ALLOWED_HEADERS['Accounts']` (`GoogleAppsScript_Backend.gs.txt:1093`).

**مرجع شجرة الحسابات الحالية (`core/04-chart-of-accounts.js:4-50`) — استخدم هذه الأكواد ولا تخترع غيرها:**

| المجموعة | الأكواد المتاحة فعلاً |
|---|---|
| الأصول | `1` · `11` · `1101` الخزينة · `1102` البنك والمحافظ · `1103` العملاء والمدينون · `1104` المخزون · `1105` ضريبة مدخلات · `12` · `1201` أجهزة ومعدات · `1202` ديكورات وتجهيزات |
| الخصوم | `2` · `21` · `2101` الموردون · `2102` أمانات ومقدمات عملاء الصيانة · `2103` مصروفات مستحقة · `2104` ضريبة مخرجات |
| حقوق الملكية | `3` · `31` · `3101` رأس المال · `3102` الأرباح المرحلة · `3103` جاري الشركاء والمسحوبات |
| الإيرادات | `4` · `41` · `4101` صيانة · `4102` مبيعات بضائع · `4103` تركيب كاميرات · `42` إيرادات أخرى |
| المصروفات | `5` · `51` · `5101` تكلفة قطع الصيانة · `5102` تكلفة البضاعة المباعة · `52` · `5201` إيجار · `5202` مرافق · `5203` رواتب · `5204` بوفيه · `5205` دعاية · `5206` أدوات ومستهلكات · `5207` شحن وتوصيل |

**⚠️ محرَّم استخدامه لأغراض أخرى:** `5204` (بوفيه) و`5206` (أدوات) و`2103` (مصروفات مستحقة) و`3103` (مسحوبات).
5. **معيار القبول:** حذف مصروف → يظهر قيد عكسي في الأستاذ. إنشاء فاتورة 1000+14% → ميزان المراجعة يزيد 1140 مدين على 1103/1101 و1000 دائن على الإيراد و140 على 2104. **مجموع قائمة الدخل = مجموع ميزان المراجعة.**

## F8 — الأرصدة الافتتاحية وميزان المراجعة
**الموقع:** `modules/17-accounting-finance.js:302`, `:633-706` · `core/04-chart-of-accounts.js:328-329`

1. **الأرصدة الافتتاحية بلا قيد مزدوج:** أضف شاشة "الأرصدة الافتتاحية" في `17-accounting-finance.js` تُولّد **قيد افتتاحي واحداً متوازناً** بتاريخ افتتاحي: `Dr الأصول / Cr الخصوم وحقوق الملكية` مع «حساب أرصدة افتتاحية» وسيط. بعد الترحيل، **صفّر عرض عمود `Balance` المباشر** واعتمد القيد.
2. **ميزان المراجعة يقيس الحركات فقط** (`17:686-692`) → يمكن أن يظهر "متزن" والمركز المالي غير متوازن. أضف عمودَي **رصيد افتتاحي** و**رصيد ختامي** إلى الإجمالي، واجعل الاتزان يُقاس على **الرصيد الختامي** لا على الحركات.
3. **ازدواج `initBal` بين الأب والابن** (`core/04:328-329`): اجعل `Balance` للحسابات الورقية فقط ولا تجمعه للأب.
4. **سماحية الاتزان `< 0.01`** (`17:647`) → استخدم `=== 0` بعد `round2`، وأضف تقرير «فروق التقريب».
5. **`getAccountStats` بلا Memoization** وتُنادى لكل حساب في كل رسم (`17:118`, `:202`, `:638`) → تعقيد O(حسابات × قيود). أضف كاش بمفتاح `revision` يزداد عند أي تغيير في القيود.
6. **معيار القبول:** إدخال أرصدة افتتاحية → الميزانية متوازنة. تعديل قيد يدوي → الكاش يُبطَل ويعاد الحساب.

## F9 — المرتجعات (الواجهة)
**الموقع:** `modules/15-pos-retail.js:2012-2058`, `:2034-2040`, `:1979-1993`

1. **الإرجاع الجزئي يقفل الفاتورة كلها** (`15:2012` → `sale.IsReturned = true`): استخدم مصفوفة `ReturnDetails[]` وقارن الكميات المرتجعة بالإجمالية **لكل سطر**؛ وعلّم "مرتجع كلياً" فقط عند اكتمال كل الكميات.
2. **`restockCOGS` بسعر الشراء الحالي** (`15:2036`): استخدم `costAtSale` المخزَّن في `ItemsJSON` (انظر F4-4).
3. **الاسترداد يُسجَّل كمصروف** (`15:1979-1993` بـ `Category='مرتجع مبيعات POS'`) **بالإضافة** إلى قيد `Dr 4102`، ثم يُستثنى من قائمة الدخل (`17:864`) → نقل مزدوج. **احذف إنشاء سجل المصروف** واعتمد على قيد المرتجع + سجل `Returns`، أو اعرضه في الدرج كبند مرتجع مستقل (لا مصروف).
4. **لا إشعار دائني في سجل الفواتير** (`15:2017`): أنشئ Credit Note برقم تسلسلي وربطه بالفاتورة الأصلية بـ `ReferenceID`.
5. **إرسال `clientRef`** (UUID) مع كل مرتجع — يستهلكه السيرفر لمنع الازدواج (S10).
6. **`r.refunded` لا يُكتب أبداً في المشروع** (`grep` يُظهر القراءة فقط في `10-receipts:1641,1694,2644,2938,3026` و`core/08:255` و`11-crm:3570`) → **لا يوجد أي مسار لاسترداد مبلغ لعميل صيانة**. أضف زر "استرداد نقدي" في تفاصيل الإيصال يولّد:
   `Dr 4101 (أو 4104 مردودات) / Cr 1101` + يزيد `r.refunded` + يطلب سبباً + يظهر في درج الوردية وفي التدقيق.
7. **معيار القبول:** فاتورة 3 أصناف، إرجاع صنف واحد → الفاتورة **لا** تُعلَّم "مرتجعة كلياً" ويمكن إرجاع الباقي. الاسترداد يظهر في الدرج مرة واحدة لا مرتين.

## F10 — الرقابة على الخصومات والتسعير
**الموقع:** `modules/15-pos-retail.js:346-353`, `:909-931` · `modules/11-customers-crm.js:6538`, `:6506-6511`

1. **أضف سقف خصم** إلى إعدادات POS (`state.settings.pos.maxDiscountPercent`, `maxDiscountAmount`) و**افرضه في الواجهة والسيرفر**:
```js
if (discountAmount > subtotal * (maxPct/100) + 0.005) { requireApproval('خصم يتجاوز السقف المعتمد'); }
```
   الافتراضي المقترح: 10% بلا تصريح، وأي خصم أكبر يتطلب كلمة مرور المدير (عبر action `verifySupervisorPin` من S1) ويُسجَّل في التدقيق.
2. **امنع البيع بأقل من التكلفة:** في POS والفاتورة وتفاصيل الإيصال:
```js
if (Number(sellPrice) < Number(item.PurchasePrice || 0)) { requireApproval('بيع بأقل من التكلفة'); }
```
3. **سجّل كل خصم** في `AuditLog` بقيمته ونسبته والمُصرِّح.
4. **اقفل تعديل الفاتورة بعد الدفع:** في `11-customers-crm.js:6306+` إن كان `AmountPaid > 0` **امنع** تعديل البنود والإجماليات إلا بتصريح إداري مع قيد تسوية ومدخل تدقيق (قبل/بعد).
5. **معيار القبول:** خصم 100% يُطلب له تصريح. البيع بأقل من التكلفة يُطلب له تصريح. تعديل فاتورة مدفوعة يظهر في التدقيق.

## F11 — إصلاحات مالية صغيرة (مؤكدة)

| # | الموقع | الإصلاح |
|---|---|---|
| a | `core/04:284-301` | `recordAutoJournalEntry` لا يتحقق من التوازن → **ارفض** القيد إن `|مدين − دائن| > 0.005` وارمِ خطأ واضحاً. |
| b | `core/04:154-160` | قيد غير متوازن عند `AmountPaid > Total`: `const paid = Math.min(total, Number(s.AmountPaid ?? total));` أو أضف سطر «باقٍ للعميل» دائن. |
| c | `16-suppliers-purchases.js:799` | شراء بمبلغ مسدد > الإجمالي → غير متوازن: `const paidVal = Math.min(grandTotal, parseFloat(salePaid.value) || 0);` |
| d | `core/04:274-282` | القيد اليدوي بلا تدقيق → أضف `recordAuditLog`، وامنع القيد على حساب **تجميعي** (`state.accounts.some(a=>String(a.ParentCode)===code)`)، وامنع قيداً بلا حساب. |
| e | `core/03:1041-1053` | دفعات بلا idempotency حقيقي: حاجز 15 ثانية في الذاكرة فقط. أضف `clientRef` (UUID) وأرسله للسيرفر؛ وارفض المكرر هناك. |
| f | `13:236-259` + `core/03:1130-1162` | `cleanDuplicatePayments` يحذف كل ما تشابه → **قد يحذف دفعتين مشروعتين** (تقسيط متساوٍ بنفس الملاحظة). استبدله بـ **تقرير مراجعة** يعرض المرشحين ولا يحذف تلقائياً. |
| g | `17:302` | الأرصدة الافتتاحية مباشرة في `acc.Balance` → عالجها في F8. |
| h | `15:1694`, `:2028-2031` | استرداد بطريقة دفع الفاتورة الأصلية دائماً → اسمح باختيار طريقة الاسترداد، وإن كانت الفاتورة آجلة وغير محصّلة فـ **لا** ترد نقداً — قيّد `Cr 1103`. |
| i | `12:1512-1605` | `stats.netCash` المعروض كـ"الصافي الفعلي بالدرج" يشمل الفيزا → افصل `cashNet` عن `liquidityNet`. |
| j | كل المشروع | `new Date().toISOString().slice(0,10)` يعطي **UTC** بينما حقول التاريخ محلية → في مصر (UTC+2/+3) تُسجَّل مبيعات أول اليوم على تاريخ الأمس. أضف `localDateStr(d)` في `core/01-digits.js` واستخدمها في كل موضع تاريخ. |
| k | `17:2437` | كلمة المرور معروضة بحقل مرئي → أزلها (انظر S5-6). |

---

# المرحلة 3 — الوظائف الناقصة (P2) 🧩

> **⚠️ استثناء في الأولوية:** البنود **U7 (الدوال المفقودة)** و **U8 (صور base64 في خلايا Sheets)** و **U9 (فشل الحفظ الصامت)** مُصنَّفة هنا لكنها **حرجة**. نفّذها **في نهاية المرحلة 1** لا في المرحلة 3، لأنها تسبب فقدان بيانات حقيقي الآن. المعيار: إن كان المتبقي في Phase 1 أقل من نصف يوم، أكملها ثم ابدأ U7→U8→U9 قبل الانتقال للمرحلة 2.

## U1 — بناء وحدة كاميرات المراقبة الحقيقية 🔴 (أهم بند وظيفي)
**الوضع الحالي المُثبت:** `renderCamerasApp` في `modules/13-treasury-expenses.js:1016-1043` = 3 تبويبات فقط: تصفية مخزون على `Category==='كاميرات'` + منشئ عرض سعر عام + قائمة عروض. **لا يوجد أي نموذج بيانات للكاميرات.** وحساب الإيراد `4103 "إيرادات تركيب كاميرات وأنظمة"` معرَّف في `core/04-chart-of-accounts.js:35` **ولا شيء يُغذّيه**.

**المطلوب — ملف جديد `app-modular/js/modules/21-cctv-projects.js`** (وسجّله في `build.js` بعد `20-app-boot.js`)، بالبيانات والأوراق التالية. **أضف كل ورقة جديدة إلى `ALLOWED_HEADERS` في `GoogleAppsScript_Backend.gs.txt` وإلى قائمة الأوراق المطلوبة في تعليق الملف.**

### 1. نموذج البيانات — الأوراق الجديدة
| الورقة | الأعمدة |
|---|---|
| `Sites` | `ID, CustomerName, CustomerPhone, SiteName, Address, City, Coordinates, SiteContact, Notes, CreatedBy, CreatedAt` |
| `Projects` | `ID, SiteID, Title, Type(تركيب/صيانة/توسعة), Status, StartDate, TargetDate, DeliveredDate, ContractValue, PaymentTerms, Engineer, Notes, QuotationID, InvoiceID` |
| `ProjectDevices` | `ID, ProjectID, Category(كاميرا/DVR/NVR/هارد/سويتش/كابل/بواط/مثبتات), ItemID, Serial, Brand, Model, Channel, Location, LensType, Resolution, InstallDate, WarrantyMonths, WarrantyEnd, Status` |
| `ServiceVisits` | `ID, ProjectID, SiteID, ScheduledDate, VisitType(تركيب/صيانة دورية/طارئ), Technician, Status, CheckInAt, CheckOutAt, Findings, ActionsTaken, PartsUsed, NextVisitDate, CustomerSignature, PhotosJSON` |
| `MaintenanceContracts` | `ID, SiteID, ProjectID, StartDate, EndDate, VisitFrequency(شهري/ربع سنوي/نصف سنوي), AnnualValue, VisitsIncluded, VisitsUsed, Status, AutoRenew` |

### 2. الشاشات المطلوبة
1. **لوحة مشاريع الكاميرات:** بطاقات لكل مشروع (الحالة، نسبة الإنجاز، القيمة، المتبقي، تاريخ التسليم المستهدف، تنبيه التأخير).
2. **الموقع (Site):** بيانات الموقع + قائمة مشاريعه + قائمة الأجهزة المركبة + عقد الصيانة + سجل الزيارات + صور قبل/بعد.
3. **خريطة القنوات:** جدول DVR/NVR → القنوات (1..N) → الكاميرا المركّبة على كل قناة (الماركة، الموديل، السيريال، الموقع، العدسة). يعرض القنوات **الفارغة** بوضوح.
4. **مهمة تركيب/زيارة:** جدولة (تاريخ + فني)، حالات (`مجدولة / جارٍ التنفيذ / مكتملة / مؤجلة / ملغاة`)، Check-in/Check-out، الأعطال، القطع المستخدمة (من المخزن مع خصم فعلي)، الصور، **توقيع العميل**، والزيارة القادمة.
5. **ضمان الأجهزة:** حساب `WarrantyEnd = InstallDate + WarrantyMonths` تلقائياً، مع تقرير "أجهزة داخل/خارج الضمان" وتنبيه قبل الانتهاء بـ 30 يوماً.
6. **عقود الصيانة الدورية:** توليد الزيارات تلقائياً من التكرار، وتتبّع `VisitsUsed` مقابل `VisitsIncluded`، وتنبيه الزيارات المتأخرة.
7. **الفواتير المرحلية:** دعم بنود العقد (50/30/20 — المنصوص عليها في `core/06-config-defaults.js:44`) عبر جدول `ProjectMilestones` (`ID, ProjectID, Title, Percent, Amount, DueCondition, InvoiceID, Status`) وتوليد فاتورة لكل مرحلة عند تحقيق شرطها.
8. **ربط محاسبي:** كل فاتورة/تحصيل مشروع يمر عبر نفس مسار الفواتير المُصلَح في F3/F7، ويرحّل إلى **`4103` (إيرادات تركيب كاميرات)** لا إلى `4102`.
   **🔴 عطل قائم يجب إصلاحه أولاً:** `core/03-utils-and-mappings.js:1354` يرحّل تحصيل دفعة عرض السعر إلى:
   ```js
   { AccountCode: '4101', AccountName: 'إيرادات مشاريع وتوريدات وتركيبات', Debit: 0, Credit: numAmt, ... }
   ```
   وهذا خطأ مزدوج: `4101` في الدليل = "إيرادات خدمات صيانة وتصليح" (`core/04-chart-of-accounts.js:33`)، و**`4103` = "إيرادات تركيب كاميرات وأنظمة"** (`:35`) **يبقى صفراً للأبد**. أصلح الكود ليرحّل إلى `4103` مع `AccountName` مطابق للدليل حرفياً، وأضف `AccountCode` للمشروع واجعل الترحيل يستخدمه. و**استخرج `AccountName` دائماً من `state.accounts` بالكود** بدل كتابته يدوياً — هذا يمنع أي مخالفة مستقبلية بين القيد والدليل.
9. **ربط المخزون:** تركيب جهاز من مشروع **يخصم من المخزون** ويسجّل السيريال في `ProjectDevices` ويربطه بـ `Serials` (`markSerialSold` أو حالة `Installed`).

### 3. الصلاحيات والتنقل
- `cameras` قسم موجود في `SECTION_INFO` (`09-shell-and-router.js:224`) وفي `allSections`. أضف صلاحيات فرعية: `cameras_projects`, `cameras_visits`, `cameras_contracts` — وضعها في `allSections` (`09-shell-and-router.js:145`) و`19-login.js:278` وقائمة `Sections` في شاشة المستخدمين.
- **مهم:** انقل `renderCamerasApp` من `13-treasury-expenses.js` إلى الملف الجديد (الترتيب الحالي مدفون في وحدة الخزينة).
- **معيار القبول:** يمكن إنشاء موقع → مشروع → إضافة 8 كاميرات على قنوات DVR → جدولة زيارة تركيب لفني → تنفيذها مع خصم المخزون وتوقيع العميل → إصدار فاتورة مرحلية → ظهور الإيراد في `4103` وميزان المراجعة.

## U2 — استكمال دورة حياة الصيانة
**الموقع:** `core/06-config-defaults.js:18-25` (الحالات) · `modules/10-receipts-maintenance.js`

1. **أضف الحالات الناقصة** إلى `STATUSES` (لا تغيّر الموجود):
   - `بانتظار موافقة العميل` (بعد عرض السعر)
   - `بانتظار قطعة غيار`
   - `ملغي` (لأن `17:814` يفحصها وهي غير معرَّفة!)
2. **وثّق موافقة العميل** بعقد صريح: عند الانتقال من "قيد الفحص" إلى "الصيانة" يجب تسجيل: اسم الموافق، القناة (هاتف/واتساب/حضور)، المبلغ المعتمد، التاريخ. امنع الانتقال إلى "الصيانة" بلا موافقة مسجَّلة. الشروط في `core/06-config-defaults.js:28` تنص على ذلك تعاقدياً.
3. **تقرير التقادم:** تقرير "أجهزة لم تُطالَب" (الحالة ≠ تم التسليم ومرّ أكثر من 30 يوماً من الإشعار) مع إجراء إشعار واتساب جماعي — الشرط في `core/06-config-defaults.js:29` ينص على 30 يوماً والنظام لا يتابعها إطلاقاً.
4. **ضمان محسوب:** أضف `warrantyMonths` و`warrantyEnd` للإيصال والأجهزة، واحسبه على تاريخ التسليم، مع تقرير "إصلاحات داخل الضمان".
5. **توحيد نموذج الجهاز:** `core/07-state.js:newDraft()` يحتفظ بـ `devices[]` **و** `device` كمرآة → مصدرا حقيقة. اجعل `devices[]` المصدر الوحيد واجعل `device` getter/`activeDeviceIndex` فقط. راجع كل استخدامات `d.device` واستبدلها بـ `d.devices[d.activeDeviceIndex]`.
6. **معيار القبول:** لا يمكن البدء في الصيانة بلا موافقة موثّقة. تقرير الأجهزة المتأخرة يعمل. لا يوجد إيصال بحقل `device` مستقل عن `devices[]`.

## U3 — توليد أرقام المستندات على السيرفر (منع التكرار)
**الموقع:** `core/07-state.js:170-205` (`nextReceiptNumber`, `nextInvoiceNumber`)

**المشكلة:** الترقيم من ذاكرة الجهاز → جهازان أوفلاين يُنتجان `MT-2026-0042` نفسه، والسيرفر يخزّن بمفتاح `ID` لا `ReceiptNumber` (`Backend:1143-1158`) → **الرقم المكرر يُحفظ بصمت**.

1. أضف action سيرفري `nextDocumentNumber` يقرأ أقصى رقم موجود في الورقة ويُرجع التالي، مع `LockService` (المستخدم أصلاً في `doPost:366`) لضمان عدم التكرار.
2. **الأنسب للعمل أوفلاين:** أضف تحققاً سيرفرياً عند الحفظ: إن كان `ReceiptNumber`/`InvoiceNumber` موجوداً مسبقاً لسجل آخر → **ارفض** بـ `duplicate: true` وأعد الرقم الصحيح المتاح، فتتولّاه الواجهة.
3. أضف فهرساً/تحققاً على `ReceiptNumber` و`InvoiceNumber` (لا يمكن فرض UNIQUE في Sheets، فالتحقق برمجي داخل `LockService`).
4. **معيار القبول:** إرسال إيصالين بنفس `ReceiptNumber` → الثاني يُرفض ويُعاد ترقيمه.

## U4 — النسخ الاحتياطي والاستعادة 🔴
**الوضع:** لا يوجد **أي** مسار نسخ احتياطي أو استعادة في المشروع (بحث شامل: `backup`/`restore` لا يُرجع أي دالة؛ فقط `localStorage` كذاكرة مؤقتة).

1. **تصدير كامل:** زر في `18-settings-admin.js` → "نسخة احتياطية كاملة" يُنتج ملف JSON واحداً يحوي **كل** الأوراق (Receipts, Customers, Inventory, Sales, Invoices, Payments, Expenses, Purchases, Suppliers, Serials, Accounts, JournalEntries, Users**بدون كلمات مرور**, Settings, Returns, SupplierPayments) + الوقت + إصدار المخطط. حجمه كبير → أنشئه على السيرفر عبر action `exportBackup` (admin فقط) لتفادي حدود المتصفح.
2. **نسخ احتياطي دوري تلقائي:** Trigger يومي في Apps Script (`ScriptApp.newTrigger`) ينسخ الشيت إلى مجلد Drive بتاريخ اليوم، ويحتفظ بآخر 30 نسخة.
3. **استعادة:** action `importBackup` (admin فقط، مع تأكيد مزدوج وبصمة الملف) يستعيد من JSON، ويُسجَّل في التدقيق. **يجب أن يرفض** الاستعادة إن كان المخطط أقدم من الحالي (أو يُرحّله).
4. **تصدير CSV لكل ورقة** كخيار ثانٍ، مع `csvSafe` (S12).
5. **معيار القبول:** تنزيل نسخة → حذف صفوف → استعادة → البيانات تعود والتقارير متزن. النسخة التلقائية تظهر في Drive.

## U5 — المزامنة والأوفلاين
**الموقع:** `core/02-api-sync.js:44-80`, `:186-250`

1. **مفتاح idempotency لكل عنصر طابور:** أضف `clientRef` (UUID) يُولَّد عند **إنشاء العنصر** (لا عند الإرسال)، ويُرسَل مع الطلب، والسيرفر يرفض المكرر لكل action مالي (`savePayment`, `saveSale`, `saveReturn`, `saveExpense`, `savePurchase`, `saveInvoice`). خزّن جدول مفاتيح مستخدمة في ورقة `Idempotency` (`Key, Action, CreatedAt`) ونظّف ما مضى عليه 30 يوماً.
2. **إعادة محاولة بتباعد تصاعدي:** استخدم `retryCount` الموجود (يُسجَّل في `:224` ولا يُستخدم) — `delay = min(2^retry * 1000, 5 دقائق)`، وبعد 10 محاولات انقل العنصر إلى **"فشل نهائي"**.
3. **شاشة طابور المزامنة:** في `18-settings-admin.js` اعرض كل عنصر (النوع، التاريخ، عدد المحاولات، آخر خطأ) مع أزرار: إعادة المحاولة / حذف العنصر / تصديره. حالياً لا يوجد سوى مؤشر بعدد (`updateSyncStatusPill`).
4. **حل التعارض:** `fetchBootstrapData` يستبدل الحالة كاملة بالسحابة (`:96-115`) → أي تعديل محلي غير مرفوع يضيع. **قبل** أي استبدال: إن كان الطابور غير فارغ، **لا تستبدل** — اعرض تحذيراً واطلب مزامنة أولاً.
5. **`loadReceipts`/`loadCustomers` لا يستبدلان عند رد فارغ** (`core/04:337`, `:431`: `rows.length > 0`) → بيانات قديمة تبقى للأبد. **ميّز** بين "فشل الشبكة" (أبقِ) و"رد ناجح فارغ" (افرغ).
6. **معيار القبول:** إرسال دفعة والانقطاع أثناءها → إعادة الإرسال لا تُنشئ دفعتين. عنصر فاشل يظهر في الشاشة ويمكن حذفه.

## U6 — تنظيف المستودع وإزالة الإرث
1. `git rm index_backup_2026-09-21.html index_backup_2026-09-22.html` (2.5MB ميتة).
2. انقل `mterpkernal/` إلى `archive/mterpkernal/` مع `archive/README.md` يوضّح أنها نسخة تاريخية غير مستخدمة (أو `git rm -r mterpkernal` إن وافق صاحب العمل — ضع السؤال في التقرير).
3. انقل `index.html` (الجذر) إلى `archive/legacy-monolith.html` بعد التأكد أن `sync-modular.js` محذوف.
4. أضف `.DS_Store` إلى `.gitignore` (موجود) **واحذف الملفات المتتبعة**: `git rm --cached '**/.DS_Store'`.
5. **معيار القبول:** `git ls-files | wc -l` انخفض بشكل ملموس؛ البناء يعمل؛ لا مرجع لأي ملف محذوف.

## U7 — الدوال المستدعاة وغير المعرَّفة (إصلاح سريع وأثر كبير) 🔴
**بحث شامل أثبت وجود 8 دوال تُستدعى ولا تُعرَّف في المشروع كله.** بعضها يُبتلع بصمت داخل `typeof === 'function'` وبعضها يرمي `ReferenceError` داخل `catch` مبطَّن.

| الدالة المفقودة | موضع الاستدعاء | الأثر الفعلي |
|---|---|---|
| `autoPostJournalEntry` | `11-customers-crm.js:795`, `:4052` | **قيد التسليم الآجل لا يُرحَّل إطلاقاً** — يُبتلع بصمت بسبب `typeof` |
| `deleteItemRemote` | `core/05-auth-and-audit.js:316` | **طلب حذف صنف يُعلَّم `approved` ثم يفشل التنفيذ** → سجل رقابة كاذب |
| `deleteJournalEntryRemote` | `core/05-auth-and-audit.js:318` | نفس المشكلة لقيد اليومية |
| `enqueueOfflineTask` | `core/03-utils-and-mappings.js:1309` **داخل `catch`** | **حفظ عرض سعر أوفلاين يرمي ReferenceError ويفقد الحفظ بالكامل** |
| `exportToExcel` | `17-accounting-finance.js:1993` | زر تصدير المستخدمين مكسور |
| `openDailyEntryModal` | `09-shell-and-router.js:523` | زر لا يعمل |
| `openItemModal` | `09-shell-and-router.js:531` | زر لا يعمل |
| `pushLog` | `11-customers-crm.js:3003` | سجل إعادة الإدخال يُفقد بصمت |

**⚠️ ملاحظة منهجية مهمة:** سبب عدم ظهور هذه الأعطال قط هو أن نصفها محمي بـ `if(typeof x === 'function')` أو `catch(e){}`. **هذا النمط (الابتلاع السلبي للأخطاء) هو سبب جذري متكرر في المشروع** — راجعه في كل ملف تلمسه، ولا تُضِف مثيلاً جديداً له.

**المطلوب:** لكل دالة — إمّا **تعريفها** بالمنطق الصحيح، أو **حذف الاستدعاء** واستبداله بالدالة الموجودة. **ممنوع** ترك `typeof x === 'function'` كحل. ثم:
- أنشئ إصداراً من `recordAutoJournalEntry` يعمل عبر `apiPost` مع قيد مدين/دائن صحيح (انظر F2-6).
- لـ `deleteItemRemote`/`deleteJournalEntryRemote`: نفّذها عبر `apiPost('deleteInventoryItem'/'deleteJournalEntry')`، و**لا تُعلّم الطلب `approved` قبل نجاح التنفيذ** — انقل التعليم بعد النجاح.
- `exportToExcel` → استخدم `downloadCSV` الموجودة.
- **معيار القبول:** `npx eslint --rule '{"no-undef":"error"}' app-modular/js` لا يُبلغ عن أي من هذه الأسماء. تسليم إيصال آجل يُنتج قيداً في `JournalEntries`.

## U8 — الصور: base64 داخل خلايا Google Sheets 🔴
**الموقع:** `core/03-utils-and-mappings.js:618-640` · `core/02-api-sync.js:38-40`

**المشكلة:** صور الجهاز تُضغط (جيد: `core/06-config-defaults.js:614-650`) ثم تُخزَّن **base64 داخل خلية** في ورقة `Receipts` عمود `Photos`، وأيضاً في `localStorage`. حد خلية Google Sheets ≈ **50,000 حرف**، وصورة 50KB ≈ 68,000 حرف base64 → **الخلية تُقتطع أو يفشل الحفظ بصمت**.

**المطلوب:**
1. **انقل الصور خارج الخلية:** إمّا
   - رفعها إلى مجلد Google Drive عبر action سيرفري `uploadPhoto` يُعيد **رابطاً** فقط، ويُخزَّن الرابط في `Photos` (الأنسب)،
   - أو (أسرع بلا سيرفر) تخزينها في **IndexedDB** محلياً وتخزين مفاتيحها فقط في الشيت — مع تنبيه أن الصور لن تظهر على جهاز آخر.
2. **قيّد الحجم:** ارفض أي صورة > 150KB بعد الضغط، وقيّد عدد الصور لكل إيصال (مثلاً 6)، وقيّد حجم حقل `Photos` المُرسَل بـ 40,000 حرف.
3. **أضف `Photos` إلى `ALLOWED_HEADERS['Receipts']` إن لم يكن موجوداً** (السطر 1078) وتأكد من الحد.
4. **معيار القبول:** إيصال بـ6 صور مرفوع ويُقرأ من جهاز آخر. لا خلية واحدة تتجاوز 45,000 حرف.

## U9 — فشل الحفظ الصامت في localStorage 🔴
**الموقع:** `core/02-api-sync.js:38-40` (وكل `setCache`)، و~**104 حالة `catch` فارغة** في المشروع

```js
function setCache(key, val){
  try { localStorage.setItem('microerp_cache_' + key, JSON.stringify(val)); } catch(e){}
  //                                                                        ↑ صامت تماماً
}
```

**الأثر:** عند امتلاء الكوتا (~5MB) أو أي خطأ تسلسل، يفشل الحفظ **بصمت**، والمستخدم يرى "تم الحفظ بنجاح" والبيانات ضائعة.

**المطلوب:**
1. **اكشف `QuotaExceededError`** في `setCache` واعرض **بانر تحذير أحمر ثابت** (لا Toast يختفي): "مساحة التخزين المحلية ممتلئة — البيانات الجديدة لا تُحفظ. صدّر نسخة احتياطية فوراً."
2. أضف **حبة حالة مساحة التخزين** تُحسب بـ `JSON.stringify(localStorage).length / 5MB` مع تنبيه عند 80%.
3. أضف زر **"تنظيف الكاش"** (يحذف `microerp_cache_*` القديمة فقط **بعد** التأكد أن المزامنة تمت) — منفصل عن زر `localStorage.clear()` الحالي.
4. **راجع كل `catch(e){}` في مسارات الحفظ وأبلِغ المستخدم** عند الفشل. **ممنوع** رسالة "تم الحفظ" قبل تأكيد نجاح الكتابة (محلياً أو سيرفرياً).
5. **خفّض الضغط على localStorage:** أضف تقليماً تلقائياً — احتفظ بآخر N إيصال/بيع في الكاش واعتمد على السحابة للباقي.
6. **معيار القبول:** محاولة حفظ مع كوتا ممتلئة (املأها صناعياً) → يظهر بانر أحمر، **ولا** تظهر رسالة نجاح.

## U10 — إصلاحات لوحة التحكم والتقارير السريعة
**الموقع:** `09-shell-and-router.js:602-603`, `:628-629`

| # | المشكلة | الإصلاح |
|---|---|---|
| a | **«المستحقات» = مجموع كل الفواتير** ويتجاهل المدفوع | احسب: `Σ(Total − AmountPaid)` لكل فاتورة حالتها ليست `مدفوعة بالكامل` **+** `Σ` متبقي الإيصالات المُسلَّمة غير المسددة (من `cost+partsCost+other−deposit`) |
| b | **«سجل العمليات» يعرض `undefined`** (حقول غير موجودة في الكائن) | استخدم الحقول الفعلية: `receiptNumber` · `customer.name` · `device.category` (أو `devices[0]`) — تحقق من الكائن بـ `console.log` أولاً ثم اربط الحقول الصحيحة |
| c | أضف بطاقات: أجهزة قيد الفحص > 48 ساعة · أجهزة مكتملة لم تُستلم > 7 أيام · أصناف تحت حد الأمان (`MinStock`) · وردية غير مقفلة · عناصر طابور فاشلة | — |
| **معيار القبول** | لا يظهر `undefined` في أي بطاقة أو جدول بلوحة التحكم. المستحقات = المبالغ غير المحصَّلة فعلاً. |

## U11 — POS: الدفع المختلط واشتراط العميل للآجل
**الموقع:** `15-pos-retail.js:934-939`, `:1023-1096`, `:1041-1063`

1. **الدفع المختلط (Split Payment):** `ps.paymentMethod` قيمة واحدة. أضف `ps.paymentSplits = [{methodId, amount}]`:
   - واجهة: أزرار وسائل الدفع تُضيف سطراً بمبلغ؛ مجموع الأسطر يجب أن يساوي `grandTotal` (أو أقل مع الباقي كآجل).
   - السيرفر: `saveSale` يقبل `splits` ويخزّنها `SplitsJSON`، و**يرحّل قيداً لكل وسيلة**: `Dr 1101/1102/1103 لكل جزء / Cr 4102 + 2104`.
   - أضف `SplitsJSON` إلى `ALLOWED_HEADERS['Sales']`.
2. **اشترط اسم عميل للبيع الآجل:** في `processSale` قبل الإتمام:
```js
if (isCreditMethod && (!state.posState.customerName || state.posState.customerName === 'عميل زائر')) {
  showToast('البيع الآجل يتطلب اختيار عميل مسجَّل حتى يمكن تحصيل الدين', 'error'); return;
}
```
   و**حدّث رصيد العميل** (`cust.Debt += remaining`) — اليوم يبقى الدين في `1103` بلا مدين مرتبط.
3. **طبّق إعداد `allowNegativeStock`:** `06-config-defaults.js:143` معرَّف ولا يُستخدم؛ الفحص في `15:1027-1036` يمنع دائماً. اجعله يحترم الإعداد (مع تسجيل تجاوز في التدقيق إن سُمح).
4. **اربط الطباعة الصامتة:** `electronAPI` (`preload.js:8-16`) **غير مستخدم في أي مكان** — كل الطباعة `window.print()`. استخدم `window.electronAPI?.printSilent({deviceName, pageSize})` للطباعة الحرارية في بيئة Electron، مع `window.print()` كبديل في المتصفح. وأصلح `window.queryLocalPrinters` غير الموجودة (`core/06-config-defaults.js:466-482`) لتستخدم `electronAPI.getPrinters()`.
5. **معيار القبول:** بيع 500 = 300 كاش + 200 فيزا يُرحّل قيدين صحيحين. بيع آجل بلا عميل مرفوض. الطباعة الحرارية على Electron لا تفتح نافذة طباعة.

## U12 — السيريالات والضمان والجرد والأصناف المركبة
**الملف:** `14-inventory-warehouse.js` · `core/02-api-sync.js:116`

1. **السيريالات معطَّلة تماماً:** `state.serials` تُجلب في `core/02-api-sync.js:116` **ولا تُقرأ في أي شاشة** (تحقق: صفر مرجع آخر)، والسيرفر يوفّر `saveSerial`/`markSerialSold`/`getSerials` (`Backend:872-899`) بلا استخدام. **أضف:**
   - حقل/تبويب "السيريالات" في شاشة الصنف (إضافة، حالة، مورد، ضمان، فاتورة البيع).
   - مسح السيريال عند البيع لاختيار وحدة محددة (`markSerialSold`).
   - تقرير سيريالات: في المخزن / مباع / مُركَّب في مشروع / تحت الضمان.
2. **الضمان نص حر فقط** (`11-customers-crm.js:902-923`) → لا تاريخ انتهاء ولا مطالبة. أضف `warrantyMonths` + `warrantyStart` + `warrantyEnd` (محسوب) على **الإيصال + كل جهاز + كل سيريال + كل جهاز مشروع**، مع:
   - تمييز بصري "داخل الضمان / خارج الضمان" عند إعادة الإدخال،
   - **ربط تلقائي**: إن أُدخل جهاز له سيريال داخل الضمان → الإصلاح بلا Charge ويُسجَّل كمطالبة ضمان.
   - تقرير "مطالبات الضمان" بتكلفتها على الشركة.
3. **لا أصناف مركبة (BOM):** أضف كيان "طقم/صنف مركّب" (`BundleItems`: `BundleID, ComponentID, Qty`) — حاسم لطقم تركيب الكاميرا (كاميرا+عدسة+كابل+باور). البيع أو التركيب يخصم المكوّنات ويحسب التكلفة مجموعاً.
4. **لا جرد مخزني (Stocktake) إطلاقاً:** أضف جلسة جرد (`StocktakeSessions`, `StocktakeLines`) → إدخال الكميات الفعلية → تقرير الفروق → **قيد تسوية** (`Dr/Cr 1104 مقابل 5209`) + تحديث الكميات + طباعة محضر جرد.
5. **مرتجع المشتريات غير موجود:** أضف `savePurchaseReturn` (يقلل الكمية، يعكس `WAC`، ويقيّد `Dr 2101/1101 / Cr 1104`).
6. **معيار القبول:** شراء DVR بسيريال → يظهر في السيريالات → يُركَّب في مشروع فيُعلَّم "مُركَّب" → ينتهي ضمانه فيُعلَّم خارج الضمان. جرد يكتشف فرقاً ويُقيّده.

## U13 — حفظ تلقائي ومسودة الاستلام
**الموقع:** `core/07-state.js:28` (`draft: null`) · `modules/10-receipts-maintenance.js:2-1043` · `modules/20-app-boot.js`

**المشكلة:** مسودة استلام الجهاز في `state.draft` **بالذاكرة فقط**، ولا يوجد أي `autosave` (تحقق: صفر نتائج). إعادة تحميل واحدة = **فقدان كامل** لبيانات العميل والأجهزة والأعطال والصور.

**المطلوب:**
1. احفظ `state.draft` في localStorage عند كل تغيير ميكانيكي (debounce 2 ثانية) بمفتاح `microerp_draft_autosave`.
2. في `20-app-boot.js`: إن وُجدت مسودة محفوظة، اعرض شريطاً: **"توجد مسودة استلام غير مكتملة — استئناف / حذف"**.
3. امسح المسودة بعد الحفظ النهائي الناجح فقط.
4. أضف تحذير قبل مغادرة الصفحة إن وُجدت مسودة غير محفوظة (`beforeunload`).
5. **معيار القبول:** املأ الخطوة 2 ببيانات وصور → أعد تحميل الصفحة → تُستعاد البيانات.

## U14 — تنظيف الديون التقنية
1. **احذف ~1,641 سطر كود ميت:** `getOrCreateUnifiedSelectionBar` (`10-receipts-maintenance.js:1269-2910`) مُعرَّف **ولا يُنادى أبداً**، ونتيجةً لذلك **الفاتورة المجمعة غير قابلة للوصول من الواجهة** (`11-customers-crm.js:6184` ينشئ `ReferenceType:'MultipleReceipts'` بلا شاشة). إمّا اربطه في الواجهة أو احذفه. واحذف أيضاً `renderExpensesPage`, `refreshSales`, `refreshExpenses`, `formatReceiptDateTime`, `refreshInventory`, `parseSafeNumber`.
2. **أزل الحقول المكتوبة وغير المقروءة أو اربطها:** `quotationStatus`/`quotationSentAt`/`quotationDecidedAt` (3 كتابات، صفر قراءة) → اربطها بفلتر "عروض بانتظار موافقة العميل".
3. **استبدل 26 حواراً أصلياً** (`alert`/`confirm`/`prompt`) بمودالات النظام — أهمها `prompt` لإدخال طريقة الدفع في `18-settings-admin.js:1515`، و`confirm` في `15-pos-retail.js:179,299,313,969,1450`.
4. **أصلح استيراد CSV:** `14-inventory-warehouse.js:733-755` يستخدم `split(',')` بلا احترام للاقتباسات → **يكسر النموذج الذي يولّده البرنامج نفسه** (مثل `"Dell G15, HP 15"`). اكتب محلل CSV صغيراً يحترم `"..."` والفواصل داخلها، وأضف كشف تكرار الباركود وتحققاً من الأرقام.
5. **صحّح التسميات المضللة:** "تصدير Excel" يُنتج `.csv` (`11-customers-crm.js:5916-5945`) → سمّه "تصدير CSV"، أو أضف تصدير xlsx حقيقي.
6. **التحويل المخزني:** غير ذرّي والأخطاء مبتلعة (`14:1107-1110`)، ويستنسخ نفس الباركود في مخزنين فيصبح مصدر البيع غامضاً (`15:797`). اجعله ذرّياً على السيرفر، وامنع تكرار الباركود عبر المخازن.
7. **قلّل تكرار الصيغ:** صيغة المتبقي `cost + partsCost + other − deposit + refunded` مكرَّرة **24 مرة** → دالة واحدة `getReceiptRemaining(r)`.
8. **الأداء:** `recoverAndSyncAllCustomerPhones` تُنادى في **كل** حفظ إيصال (`core/04:533` → `core/03:490-550` بمسح كامل)، و`renderArchive` تستدعي `normalizeReceipt` لكل صف في كل رسم (`10:2933`)، و`setInterval` يسحب السحابة كل 3 دقائق (`09:76-104`). أضف كاشاً ومرّرات (`debounce`).
9. **الوصولية:** صفر سمات `aria-*` مقابل 159 `<label>` أغلبها بلا `for/id` → اربط التسميات بحقولها وأضف `aria-label` للأزرار الأيقونية.
10. **معيار القبول:** لا كود ميت، ولا `alert/confirm/prompt` في المشروع، والاستيراد يقبل ملفاً فيه قيم بين علامات تنصيص.

---

# المرحلة 4 — الجودة والصيانة (P3) 🛠

## Q1 — تقسيم الملفات الضخمة
| الملف | الأسطر | التقسيم المقترح |
|---|---|---|
| `11-customers-crm.js` | **6,767** | `11a-customers-directory` / `11b-customer-detail` / `11c-whatsapp` / `11d-customer-reports` / `11e-ai-assistant` |
| `18-settings-admin.js` | 3,779 | `18a-appearance` / `18b-printers` / `18c-users-roles` / `18d-templates` / `18e-backup` |
| `10-receipts-maintenance.js` | 3,219 | `10a-intake-wizard` / `10b-receipts-list` / `10c-receipt-detail` / `10d-printing-labels` |
| `17-accounting-finance.js` | 3,109 | `17a-chart-accounts` / `17b-journal` / `17c-trial-balance` / `17d-income-statement` / `17e-vat-report` / `17f-statements` |

**⚠️ إلزامي:** بعد كل تقسيم، **سجّل الملفات الجديدة في `app-modular/build.js` بالترتيب الصحيح**، وشغّل `node app-modular/build.js`، وتأكد أن الحزمة بلا أخطاء. الترتيب يهم لأن الكود يستخدم دوال عامة بلا وحدات.

## Q2 — اختبارات آلية
أضف `vitest` كـ devDependency (هذا الاستثناء الوحيد المسموح) وأنشئ `tests/`:
- **`money.test.js`:** `computeDocTotals` (ضريبة شاملة/غير شاملة، خصم نسبة/مبلغ، حدود التقريب)، `round2`/`round4`.
- **`journal.test.js`:** `recordAutoJournalEntry` يرفض القيد غير المتوازن؛ كل نوع مرجع يُنتج قيداً متوازناً؛ منع ازدواج `refType_refId`.
- **`cogs.test.js`:** المتوسط المرجح عبر 3 عمليات شراء؛ COGS عند البيع؛ إعادة التخزين بالتكلفة الأصلية.
- **`vat.test.js`:** مبيعات مختلطة → ضريبة المخرجات الصحيحة.
- **`permissions.test.js`:** `canUserAccessSection` لكل دور × كل قسم.
- **`numbers.test.js`:** `toEngDigits`, `localDateStr`, `csvSafe`, `escapeHtml`, `escapeJsString`.
استخرج الدوال المالية النقية إلى `app-modular/js/core/09-finance-engine.js` **بلا أي اعتماد على DOM** لتصبح قابلة للاختبار. أضف `"test": "vitest run"`.
**معيار القبول:** `npm test` يمر بلا فشل؛ ويوجد اختبار واحد على الأقل لكل بند مالي في المرحلة 2.

## Q3 — ESLint
أضف `eslint` كـ devDependency، واضبط `no-undef` و`no-unused-vars` و`eqeqeq`. **مهم:** `no-undef` سيكشف كل الأخطاء من نوع `autoPostJournalEntry` (دالة مستدعاة وغير معرَّفة). أصلح كل ما يظهر — ولا تُعطّل القاعدة.
**معيار القبول:** `npx eslint app-modular/js` بلا أخطاء (التحذيرات مقبولة).

## Q4 — CI
وسّع `.github/workflows/build-desktop.yml` أو أضف `.github/workflows/ci.yml` يشغّل على كل push: `npm ci` → `npm run verify` → `npm run lint` → `npm test` → ثم بناء الحزم.
**معيار القبول:** الـ workflow يمرّ أخضر.

## Q5 — توثيق
- `app-modular/README.md`: حدّث ليعكس البنية الجديدة و**يحذّر صراحةً** من تعديل `dist/`.
- `audit/MIGRATIONS.md`: كل عمود/ورقة جديدة مع سكربت الترحيل.
- `audit/fixes-report.md`: تقرير نهائي بالبنود المنفَّذة والمؤجَّلة والأسئلة المفتوحة.

---

# 🚦 بوابات التحقق (شغّلها بعد كل مرحلة — إلزامية)

```bash
node app-modular/build.js          # 1) البناء + الفحص النحوي — يجب أن ينجح
npx eslint app-modular/js          # 2) لا أخطاء (بعد المرحلة 4)
npm test                           # 3) كل الاختبارات تمر (بعد المرحلة 4)

# 4) لا يوجد باب خلفي ولا كلمة مرور صريحة
grep -rn "=== 'admin'" app-modular/js/core/05-auth-and-audit.js
grep -rniE "(password|pass)\s*[:=]\s*['\"][^'\"]+['\"]" app-modular/js/ | grep -v "type=\"password\"" | grep -v "placeholder"

# 5) لا توجد قيمة غير مُهرَّبة معروفة في قوالب الكاميرات
grep -n '${it.Name}\|${s.Name}\|${c.name}' app-modular/js/modules/13-treasury-expenses.js   # يجب ألا يظهر شيء

# 6) لا توجد قراءة مالية مباشرة من المصفوفات في قائمة الدخل (بعد F1)
grep -n "state.sales\|state.invoices\|state.expenses" app-modular/js/modules/17-accounting-finance.js | head

# 7) لا يوجد سكربت ممحٍ
test ! -f sync-modular.js && echo "OK: sync-modular.js removed"

# 8) لا دوال مستدعاة وغير معرَّفة (U7) — بعد إعداد ESLint في Q3
npx eslint --rule '{"no-undef":"error"}' app-modular/js 2>&1 | head -30

# 9) لا صور base64 داخل خلايا (U8) — تأكد أن الحقل استُبدل بروابط
grep -n "Photos:" app-modular/js/core/03-utils-and-mappings.js

# 10) لا فشل حفظ صامت في دالة الكاش (U9)
grep -n "catch" app-modular/js/core/02-api-sync.js | head

# 11) لا حوارات أصلية (U14)
grep -rnE "(^|[^.\w])(alert|confirm|prompt)\s*\(" app-modular/js | grep -v "//" | head

# 12) البناء الناتج مطابق للمصدر (لا تعديل يدوي على dist)
git status --short app-modular/dist
```

**قائمة اختبار يدوي (شغّل `npm start` ونفّذها ووثّق النتيجة في التقرير):**
1. دخول بـ admin → تعمل كل الأقسام.
2. دخول بحساب كاشير → قسم الكاميرات/المالية/الإعدادات ممنوعة، ولا يمكن الوصول لها بتعديل `state.currentSection` من الكونسول.
3. **أوفلاين:** أوقف الشبكة → أعد تحميل → لا يمكن الدخول باسم admin بأي كلمة مرور.
4. **باب خلفي:** أنشئ إيصالاً → امسحه → اكتب `admin` في نافذة التصريح → **يجب ألا** يُحذف.
5. **XSS:** أنشئ صنفاً باسم `<img src=x onerror="window.__xss=1">` → افتح الكاميرات/المخزون/الفواتير → `window.__xss` = `undefined`.
6. **بيع:** افتح وردية → بِع صنفاً بضريبة 14% → تحقق أن `TaxAmount` = 14% من الصافي، ورصيد `2104` = 140 على فاتورة 1000.
7. **وردية:** اقفل الوردية → حاول البيع → **يجب أن يُمنع**.
8. **صيانة:** إصلاح بمصنعية 200 وقطع بتكلفة 3000 → تحقق أن إيراد الصيانة = 3200 (لا 200).
9. **مرتجع:** بِع فاتورة 3 أصناف → أرجع صنفاً واحداً → تحقق أنه يمكن إرجاع الباقي، وأن الاسترداد يظهر مرة واحدة في الدرج.
10. **تقارير:** قائمة الدخل وميزان المراجعة → **نفس صافي الربح**، وبانر المطابقة = 0.
11. **نسخ احتياطي:** صدّر نسخة كاملة → استعرضها → تأكد أنها تحوي كل الأوراق وبلا كلمات مرور.
12. **طابعة:** اطبع إيصالاً حرارياً وملصق باركود وA4 → التأكد أن الطباعة لم تتأثر بأي تعديل.
13. **كاميرات:** أنشئ موقعاً ومشروعاً و8 كاميرات على قنوات DVR وجدول زيارة ونفّذها → فاتورة مرحلية → الإيراد في `4103`.

---

# 👤 مهام بشرية فقط — اكتبها في تقريرك ولا تحاول تنفيذها

1. **نشر كود الخادم:** عدّل `files(11)/GoogleAppsScript_Backend.gs.txt`، ثم على صاحب العمل: فتح Apps Script → لصق الكود → **Deploy → Manage deployments → Edit → New version → Deploy**. بدون هذه الخطوة **لن يعمل أي إصلاح سيرفري**.
2. **إضافة الأوراق الجديدة** إلى Google Sheet (Sites, Projects, ProjectDevices, ServiceVisits, MaintenanceContracts, ProjectMilestones, Idempotency, AuditLog برؤوس `RowHash`) — أو اجعل الكود ينشئها تلقائياً عبر `getSheet`/`insertSheet` مع رؤوس افتراضية. **فضّل الإنشاء التلقائي** لتقليل العمل اليدوي.
3. **تحويل مستودع GitHub إلى Private** وتدوير رابط نشر Apps Script (لأن المستودع عام والمصدر + الرابط مُودَعان فيه).
4. **إعادة تعيين كلمات مرور كل المستخدمين** بعد نشر تجزئة الـ Salt.
5. **قرارات السياسة** (انظر القسم التالي).
6. **نسخ احتياطي فوري للشيت** قبل أي نشر.
7. التحقق من أن Google Sheets تتحمل عدد المستخدمين المتزامنين المتوقع.

---

# ❓ أسئلة لا تجب عليها بالكود — ضعها في `audit/fixes-report.md` تحت "قرارات مطلوبة"

1. **الضريبة:** هل الأسعار شاملة أم غير شاملة VAT؟ النسبة؟ وهل الشركة مسجلة في الفاتورة الإلكترونية المصرية؟
2. **سياسة تقييم المخزون:** المتوسط المرجح (الموصى به) أم FIFO أم آخر سعر؟
3. **الاعتراف بالإيراد:** بالاستلام أم بالتسليم؟ وهل العربون أمانة (`2102`) أم إيراد فوري؟
4. **القطع:** هل تُباع بالتكلفة (كما الكود اليوم) أم بهامش؟ (يؤثر على `partsCost` و`partsBuyCost`).
5. **هامش الربح:** ما هو السقف المعتمد للخصم ومن يعتمده؟ وهل يُسمح بالبيع بأقل من التكلفة؟
6. **المرتجعات:** المدة، الطريقة (نقدي/رصيد)، المُعتمِد.
7. **الورديات:** هل البيع ممنوع تماماً بلا وردية مفتوحة؟
8. **الفروع:** هل المخزون والخزينة منفصلان فعلاً لكل فرع؟
9. **مصير `mterpkernal/` و`index.html` القديم:** حذف أم أرشفة؟
10. **الفترة المحاسبية:** هل نحتاج إقفال فترات يمنع التعديل الرجعي؟

---

# 📤 صيغة الإخراج المطلوبة

بعد كل مرحلة، اكتب في ردّك تقريراً بهذا الشكل بالضبط:

```
## المرحلة N — <الاسم>
### منفَّذ
| البند | الملف:السطر | ما تغيّر | كيف تحققت |
|---|---|---|---|
### مؤجَّل / متعارض
| البند | السبب | ما يحتاجه مني |
### أثر على البناء
- node app-modular/build.js : <نجح/فشل + المدة>
- npm test : <نتيجة> | npx eslint : <نتيجة>
### المخاطر المتبقية
- ...
```

وفي النهاية اكتب ملف `audit/fixes-report.md` يحوي: جدول كل البنود (منفَّذ/مؤجَّل/يحتاج قرار)، المهام البشرية، وقائمة اختبار انحداري (Regression) لصاحب العمل.

---

# ✅ تعريف "تم" (Definition of Done)

لا تُعلن انتهاء العمل إلا إذا تحقق **كل** ما يلي:

- [ ] `node app-modular/build.js` ينجح بلا أخطاء.
- [ ] `npm run lint` بلا أخطاء و`npm test` بكل الاختبارات ناجحة.
- [ ] لا يوجد أي باب خلفي ولا كلمة مرور صريحة في الكود.
- [ ] كل عملية كتابة على السيرفر محمية بتفويض دور + جلسة.
- [ ] لا يمكن الدخول أوفلاين بلا كلمة مرور.
- [ ] لا يمكن تصعيد الدور من localStorage.
- [ ] كل `innerHTML` بمحتوى مستخدم يمر عبر `escapeHtml`، ولا يوجد `onclick` مضمّن بقيم ديناميكية.
- [ ] قائمة الدخل وميزان المراجعة يعطيان **نفس** صافي الربح، وبانر المطابقة = 0.
- [ ] ضريبة القيمة المضافة مُسجَّلة ومُرحَّلة على `2104`/`1105` مع تقرير إقرار.
- [ ] لا ازدواج إيراد (الصيانة، فواتير POS، المرتجعات).
- [ ] إيراد تركيب الكاميرات يُقيَّد على **`4103`** ويظهر في قائمة الدخل (لا صفر).
- [ ] لا صور base64 داخل أي خلية Google Sheets — روابط فقط، ولا خلية > 45,000 حرف.
- [ ] لا فشل حفظ صامت: أي فشل كتابة محلية أو سيرفرية يُبلَّغ عنه للمستخدم، ولا تظهر "تم الحفظ" إلا بعد النجاح.
- [ ] لا دوال مستدعاة وغير معرَّفة (`no-undef` نظيف)، ولا `if(typeof f === 'function')` كحل دائم.
- [ ] لوحة التحكم: لا `undefined`، و«المستحقات» = المبالغ غير المحصَّلة فعلاً.
- [ ] لا يمكن البيع بلا وردية مفتوحة.
- [ ] الأوفلاين: لا تكرار عمليات، وشاشة طابور قابلة للتحكم.
- [ ] نسخ احتياطي كامل + استعادة يعملان.
- [ ] ترقيم المستندات لا يتكرر بين جهازين.
- [ ] وحدة كاميرات المراقبة تعمل من الموقع حتى الفاتورة والإيراد في `4103`.
- [ ] `sync-modular.js` محذوف و`dist/` خارج git و`mterpkernal` مؤرشف.
- [ ] `audit/fixes-report.md` و`audit/MIGRATIONS.md` مكتملان مع المهام البشرية والأسئلة.

---

**ابدأ الآن بالمرحلة 0، وأخبرني بخطتك المختصرة قبل المرحلة 1. التزم بالترتيب ولا تتخطَّ أي بوابة تحقق.**
