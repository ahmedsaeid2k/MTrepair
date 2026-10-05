# سجل الإصلاحات المنفَّذة (microERP Fixes Log)

يُوثِّق هذا الملف كل عملية إصلاح منفذة وفق خطة التدقيق، مرتبطة برقم البند، الملفات المعدلة، وكيفية التحقق.

---

## المرحلة 0 — شبكة الأمان وتجهيز البيئة

| البند | الوصف | الملفات المعنية | حالة البناء | التحقق |
|---|---|---|---|---|
| **0.1** | حذف `sync-modular.js` والتحذير في `app-modular/README.md` | `sync-modular.js`, `app-modular/README.md` | PASSED | تم التحقق بحذف الملف وعدم وجود أي استدعاء له |
| **0.2** | استبعاد `app-modular/dist/` من التتبع في git وإضافته لـ `.gitignore` | `.gitignore`, `app-modular/dist/index.html` | PASSED | `git status` لا يظهر الملف والمجلد تم استبعاده بنجاح |
| **0.3** | إنشاء `audit/MIGRATIONS.md` و`audit/FIXES.md` | `audit/MIGRATIONS.md`, `audit/FIXES.md` | PASSED | الملفان موجودان ومحدّثان |
| **0.4** | إضافة سكربت `"verify": "node app-modular/build.js"` إلى `package.json` | `package.json` | PASSED | `npm run verify` ينجح |
| **0.5** | إنشاء وسم git الأساسي `baseline-before-fixes` وتجهيز فرع العمل | Git repository | PASSED | الوسم والفرع `fix/audit-p0-p1-p2` موجودان |

---

## المرحلة 1 — الأمان (P0)

| البند | الوصف | الملفات المعنية | حالة البناء | التحقق |
|---|---|---|---|---|
| **S1** | إزالة الباب الخلفي لكلمة مرور المدير وتحويل التحقق من المشرف إلى الخادم | `app-modular/js/core/05-auth-and-audit.js`, `files(11)/GoogleAppsScript_Backend.gs.txt` | PASSED | حذف `clean === 'admin'`، استدعاء `verifySupervisorPin` عبر الخادم، خلو الكود من مقارنات الباب الخلفي |
| **S2** | فرض تفويض سيرفري صارم (RBAC) على كل عمليات الكتابة | `files(11)/GoogleAppsScript_Backend.gs.txt` | PASSED | مصفوفة `ACTION_ROLES` ودالة `requireActionRole` تحرس كل إجراءات الكتابة (حذف/تعديل/حفظ) وتعيد 403 مع تسجيل أمني في التدقيق |
| **S3** | إغلاق ثغرة قيود اليومية وفرض التوازن والقائمة البيضاء سيرفرياً | `files(11)/GoogleAppsScript_Backend.gs.txt` | PASSED | منع القيود التلقائية من العميل، فرض `postAutoJournal` سيرفرياً بالتحقق من التوازن وقائمة `AUTOPOST_REFS`، وقصر `saveJournalEntry` على المدير والمحاسب فقط كقيود `Manual` متوازنة |
| **S4** | تصحيح حد الطلبات وقفل محاولات الدخول السيرفري (Rate Limit & Anti-Brute-Force) | `files(11)/GoogleAppsScript_Backend.gs.txt` | PASSED | استخدام مفاتيح مشتقة بـ `hashKey` لمنع التلاعب بالتوكنات، تطبيق سقف 5 محاولات دخول فاشلة لكل مستخدم مع عداد عام، وتسجيل المحاولات الفاشلة أمنياً |
| **S5** | تجزئة كلمات المرور بـ Salt + تكرار PBKDF2 وإخفاء كلمة المرور من الواجهة | `files(11)/GoogleAppsScript_Backend.gs.txt`, `app-modular/js/modules/17-accounting-finance.js`, `audit/MIGRATIONS.md` | PASSED | إضافة عمود `Salt`، تكرار 5000 لـ SHA-256، مقارنة ثابتة الزمن `safeEquals`، ترحيل تلقائي، واستبدال حقول كلمة المرور بشارات مؤمنة |
| **S6** | منع تصعيد الصلاحيات من localStorage وتأمين الجلسات في sessionStorage | `09-shell-and-router.js`, `19-login.js`, `20-app-boot.js`, `02-api-sync.js`, `05-auth-and-audit.js`, `17-accounting-finance.js`, `Backend.gs.txt` | PASSED | حذف استدعاء `normalizeUserSections` من `render()` وإلغاء قراءة الدور من `localStorage`، حصر الجلسة والتوكن في `sessionStorage`، وإضافة تحقق سيرفري `getMe` عند بدء التشغيل |
| **S7** | منع الدخول في وضع عدم الاتصال بالاسم فقط واشتراط المصادقة الحقيقية | `app-modular/js/core/05-auth-and-audit.js` | PASSED | إلغاء مسار الدخول الأوفلاين الشكلي بدون فحص كلمة المرور واشتراط اتصال الإنترنت للتوثيق المعتمد |
| **S8** | تطهير كل مواضع حقن النصوص البرمجية (XSS) واستبدال الأحداث المضمنة | `06-config-defaults.js`, `08-public-tracking.js`, `09-shell-and-router.js`, `10-receipts-maintenance.js`, `11-customers-crm.js`, `12-invoices-quotes.js`, `13-treasury-expenses.js`, `14-inventory-warehouse.js` | PASSED | استخدام `escapeHtml`، `safeImageUrl`، `escapeJsString`، وتحويل `onclick` المضمنة الديناميكية إلى سمات `data-*` ومستمعات أحداث آمنة |
| **S9** | تحصين بوابة التتبع العامة برموز عشوائية (TrackToken) وحجب التفاصيل المالية | `GoogleAppsScript_Backend.gs.txt`, `03-utils-and-mappings.js`, `06-config-defaults.js`, `08-public-tracking.js`, `11-customers-crm.js`, `audit/MIGRATIONS.md` | PASSED | إضافة عمود `TrackToken` عشوائي 20 حرفاً، حصر البحث على الرمز لمنع الاستخراج الشامل، حجب تكاليف الصيانة وهوامش الربح الداخلية وتعتيم اسم العميل |
| **S10** | فرض التحقق والسقوف وعدم التكرار (Idempotency) على المرتجعات وسداد الديون | `files(11)/GoogleAppsScript_Backend.gs.txt`, `15-pos-retail.js`, `audit/MIGRATIONS.md` | PASSED | منع زيادة سداد دين البيع عن المتبقي، التحقق من الفاتورة الأصلية للمرتجع ومنع تجاوز مجموع المرتجعات لإجمالي الفاتورة، إضافة `ClientRef` وكاش 600 ثانية لمنع التكرار، إعادة إدخال المخزون وتوليد قيود اليومية العكسية سيرفرياً |
| **S11** | تحصين سجل الرقابة بسلسلة تجزئة مشفرة وتدقيق كل عمليات الكتابة على الخادم | `files(11)/GoogleAppsScript_Backend.gs.txt`, `17-accounting-finance.js`, `audit/MIGRATIONS.md` | PASSED | إضافة `RowHash` كسلسلة SHA-256 متصلة، إزالة التلويث عبر تقييد `saveAuditLog` بقائمة بيضاء صارمة، تفعيل `logAudit` على كل عمليات الكتابة مع القيم السابقة والجديدة، وإضافة نقطة نهاية `getAuditLog` لجلب السجل المباشر من السيرفر للمدير |
| **S12** | تطهير تصدير ملفات CSV من حقن الصيغ والمعادلات (CSV Formula Injection) | `06-config-defaults.js`, `11-customers-crm.js`, `17-accounting-finance.js` | PASSED | إنشاء دالة `csvSafe` لتهريب البادئات الخطرة (`=`, `+`, `-`, `@`, `\t`, `\r`) بفاصلة عليا (`'`) وتطبيقها مركزياً في `downloadCSV` على كافة أعمدة وصفوف التصدير |
| **S13** | حماية مفتاح Gemini API وتوكنات الجلسات من التسريب عبر المتصفح وعناوين URL | `files(11)/GoogleAppsScript_Backend.gs.txt`, `02-api-sync.js`, `06-config-defaults.js`, `18-settings-admin.js` | PASSED | حصر مفتاح الذكاء الاصطناعي في `sessionStorage` وتطهيره من `localStorage` وكاش القرص، حجب المفاتيح والأسرار من استجابات غير المديرين في السيرفر، إزالة توكن الجلسة من طابور الأوفلاين في القرص، وتحويل استدعاءات `apiGet` إلى طلبات POST تمنع ظهور `sessionToken` في عناوين الروابط وسجلات السيرفر |
| **S14** | تحصين بيئة Electron وتطبيق سياسة أمان المحتوى (CSP) وإلغاء القيود المزعجة | `main.js`, `app-modular/build.js`, `app-modular/index.html`, `app-modular/js/core/00-security-hardening.js` | PASSED | تفعيل `sandbox: true`، حجب أدوات المطورين في بيئة الإنتاج، فحص وتقييد بروتوكولات الروابط الخارجية (`https`, `http`, `tel`, `mailto`) ومنع فتح نوافذ مستقلة، تطبيق سياسة CSP صارمة تمنع حقن النصوص غير المصرح بها، وإلغاء تعطيل الزر الأيمن وتحديد النصوص وكتم الكونسول لتمكين النسخ والاستخدام الطبيعي |
| **S15-S16** | تحصينات خلفية إضافية والتشغيل السحابي المرن مع دليل الأمان | `files(11)/GoogleAppsScript_Backend.gs.txt`, `02-api-sync.js`, `audit/SECURITY.md` | PASSED | منع هجمات Clickjacking بضبط `XFrameOptionsMode.DEFAULT`، إرفاق كود الحالة HTTP داخل كائن `jsonOut`، تحليل بولياني صارم لـ `Superuser` بالدالة `parseBool` لمنع تقييم النصوص كسوبريوزر، تصحيح `deleteUser` للبحث والحذف بالمعرف ثم بالاسم، تمكين تخصيص رابط الخادم محلياً بـ `localStorage.microerp_api_url`، وإنشاء دليل الأمان والتشغيل السحابي |
| **U7** | تعريف وتوصيل الدوال الثمانية المستدعاة غير المعرفة (Fix 8 Undefined Functions) | `02-api-sync.js`, `03-utils-and-mappings.js`, `04-chart-of-accounts.js`, `05-auth-and-audit.js`, `09-shell-and-router.js`, `11-customers-crm.js`, `GoogleAppsScript_Backend.gs.txt` | PASSED | تعريف `autoPostJournalEntry` وتوصيلها بدفتر الأستاذ وقائمة `AUTOPOST_REFS`، إضافة `deleteJournalEntryRemote` وخادم الحذف في الباك إند، إضافة `deleteItemRemote`، `enqueueOfflineTask`، `exportToExcel`، `openDailyEntryModal`، `openItemModal`، و `pushLog` |
| **U8** | تقييد وضغط صور base64 لحماية خلايا Google Sheets من التلف (Cap Base64 Photos) | `06-config-defaults.js`, `files(11)/GoogleAppsScript_Backend.gs.txt` | PASSED | تطبيق ضغط تكراري ذكي في `compressImageFile` يضمن عدم تجاوز نصوص base64 لحاجز 45 ألف حرف للتوافق مع سقف خلايا Google Sheets (50 ألف حرف)، وتحصين الخادم في `sanitizeCellForSheet` باقتطاع آمن يمنع انهيار الشيتات عند استقبال حمولات صور ضخمة |
| **U9** | معالجة امتلاء الذاكرة التخزينية للمتصفح والتفريغ الذكي (QuotaExceededError & UI Warning) | `02-api-sync.js` | PASSED | التقاط استثناء `QuotaExceededError` في `setCache`، تفعيل تفريغ ذكي للكاش المؤقت غير الحيوي، إظهار شريط تنبيه دائم في الواجهة للمستخدم، وضمان استمرار التطبيق بالعمل اعتماداً على الذاكرة الحية دون انهيار |

---

## المرحلة 2 — سلامة الأرقام المالية (P1)

| البند | الوصف | الملفات المعنية | حالة البناء | التحقق |
|---|---|---|---|---|
| **F2** | منع ازدواجية الإيرادات وتصحيح معالجة الدفعات المقدمة وسداد المديونية | `03-utils-and-mappings.js`, `04-chart-of-accounts.js`, `11-customers-crm.js`, `files(11)/GoogleAppsScript_Backend.gs.txt` | PASSED | توجيه دفعات ما قبل التسليم إلى أمانات العملاء (2102) وسداد ما بعد التسليم إلى مديني الصيانة (1103) دون لمس 4101، إثبات كامل الإيراد (4101) مرة واحدة عند التسليم عبر `postReceiptDeliveryRevenue` مع تسوية الأمانات وإثبات متبقي الآجل، تصحيح مفتاح عدم التكرار في التسوية التاريخية وإلغاء استدعائها التلقائي عند الإقلاع. التحقق: تكلفة 1000، مقدم 400، متبقي 600 -> رصيد 4101 = 1000 بالضبط، 2102 = 0، 1103 = 0. |

---

## المراحل اللاحقة (تُحدَّث بعد كل بند):
- **المرحلة 2: سلامة الأرقام المالية (P1) — F7 إلى F11**
- **المرحلة 3: الوظائف الناقصة (P2) — U1 إلى U14**
- **المرحلة 4: الجودة والصيانة (P3) — Q1 إلى Q5**

