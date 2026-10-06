# سجل ترحيل وتغييرات مخطط جداول Google Sheets (Schema Migrations)

يُوثِّق هذا الملف كل تغيير إضافي (Additive Schema Change) يطرأ على أوراق وأعمدة قاعدة البيانات Google Sheets وأكواد `ALLOWED_HEADERS` في خادم Google Apps Script.

> ⛔ **قاعدة صارمة:** لا يُحذف أي عمود أو صف موجود مسبقاً. كافة التغييرات إضافية فقط للحفاظ على سلامة البيانات التاريخية.

---

## جدول الأوراق والأعمدة المضافة

| التاريخ | المرحلة | البند | الورقة (Sheet) | الأعمدة المضافة | الوصف والهدف |
|---|---|---|---|---|---|
| 2026-10-05 | المرحلة 0 | 0.3 | - | - | إنشاء سجل الترحيل الأولي وتجهيز خط الأساس |
| 2026-10-05 | المرحلة 1 | S5 | `Users` | `Salt` | إضافة ملح عشوائي 32 حرفاً لكل مستخدم لتجزئة PBKDF2 المتكررة ومنع كسر كلمات المرور |
| 2026-10-05 | المرحلة 1 | S9 | `Receipts` | `TrackToken` | إضافة رمز تتبع عشوائي 20 حرفاً لكل إيصال لمنع التخمين وحماية بوابة المتابعة |
| 2026-10-05 | المرحلة 1 | S10 | `Returns` | `ClientRef` | إضافة معرف فريد لطلب المرتجع لمنع تكرار المرتجعات وضمان الـ idempotency |
| 2026-10-05 | المرحلة 1 | S11 | `AuditLog` | `RefType`, `Details`, `RowHash` | إضافة نوع المرجع والتفاصيل الكاملة وسلسلة التجزئة المشفرة لمنع التلاعب بسجل الرقابة |
| 2026-10-05 | المرحلة 2 | F3 | `Sales` | `TaxAmount` | تسجيل مبلغ ضريبة القيمة المضافة لمبيعات الكاشير |
| 2026-10-05 | المرحلة 2 | F3 | `Purchases` | `TaxAmount` | تسجيل ضريبة المدخلات لمشتريات المخزون من الموردين |
| 2026-10-05 | المرحلة 2 | F3 | `Invoices` | `IsTaxInclusive` | دعم خيار احتساب الأسعار شاملة أو غير شاملة لضريبة القيمة المضافة |
| 2026-10-05 | المرحلة 2 | F6 | `Sales` | `Time`, `ShiftID`, `ChangeDue` | تسجيل توقيت البيع ومعرف الوردية ومبلغ الباقي المعطى للعميل |
| 2026-10-05 | المرحلة 2 | F6 | `Payments` | `Time`, `ShiftID` | تسجيل توقيت المقبوضات ومعرف وردية الكاشير لمطابقة الدرج |
| 2026-10-05 | المرحلة 2 | F6 | `Expenses` | `Time`, `ShiftID` | تسجيل توقيت المصروفات والمسحوبات ومعرف الوردية لحساب التدفقات |
| 2026-10-05 | المرحلة 2 | F6 | `Accounts` | كود `2105` | إضافة حساب عهدة وأمانات مسؤولي الورديات بدليل الحسابات |
| 2026-10-06 | المرحلة 2 | F11 | `Payments` | `ClientRef` | إضافة معرف فريد UUID لمعاملات سداد الصيانة لمنع التكرار وضمان عدم الازدواجية بالسيرفر |
| 2026-10-06 | المرحلة 3 | U1 | `Sites`, `Projects`, `ProjectDevices`, `ServiceVisits`, `MaintenanceContracts`, `ProjectMilestones` | أعمدة الجداول الجديدة بالكامل | إنشاء جداول إدارة مشاريع الكاميرات، المواقع، خريطة قنوات DVR/NVR، زيارات الصيانة، عقود الصيانة الدورية، ودفعات الإنجاز |
| 2026-10-06 | المرحلة 3 | U2 | `Receipts` | `WarrantyMonths`, `WarrantyEnd`, `CustomerApprovalJSON`, ومزامنة كافة حقول الصيانة | توثيق دورة حياة الصيانة الكاملة: حقول الضمان، تاريخ الانتهاء، توثيق موافقة العميل، وتوحيد نموذج الأجهزة المتعددة |
| 2026-10-06 | المرحلة 3 | U3 | `Receipts`, `Invoices`, `Quotations` | إجراء `nextDocumentNumber` وفحص عدم التكرار | توليد أرقام المستندات المتسلسلة على السيرفر تحت LockService وفحص منع تكرار الأرقام مع إعادة الترقيم التلقائي |
| 2026-10-06 | المرحلة 3 | U4 | كافة جداول النظام (26 ورقة) | إجراءات `exportBackup`, `importBackup`, `setupDailyBackupTrigger`, `runDailyBackupNow` | نظام النسخ الاحتياطي الشامل (JSON)، الاستعادة المؤمنة تحت LockService، لقطات Google Drive اليومية التلقائية (أرشفة 30 نسخة)، وتصدير الجداول بصيغة Excel/CSV مع تعقيم الصيغ (csvSafe) |
| 2026-10-06 | المرحلة 3 | U5 | `Idempotency` | `Key`, `Action`, `CreatedAt`, `User`, `Details` | جدول التحصين ضد تكرار المعاملات المالية والسحابية (Idempotency Engine)، محرك التراجع الأسي لطابور المزامنة، وحماية التعارض |
| 2026-10-06 | المرحلة 3 | U8 | Google Drive / IndexedDB / Receipts | صور الأجهزة خارج خلايا الشيت | رفع صور الأجهزة الموثقة إلى Google Drive وتخزين روابط العرض فقط بالشيت، وتوفير كاش IndexedDB محلي، وتقييد حجم الخلية بـ 40 ألف حرف بحد أقصى 6 صور |

---

## تفاصيل الترحيلات

### الترحيل 12 [U8] — حفظ صور الأجهزة خارج خلايا الشيت (Google Drive)، تخزين IndexedDB المحلي، وسقف 40 ألف حرف
- **التاريخ:** 2026-10-06
- **الهدف:** منع تلف وتجاوز خلايا Google Sheets (التي تمتلك حداً أقصى صارماً 50,000 حرف لكل خلية) عند إرفاق صور الأجهزة base64، ورفع الصور تلقائياً إلى مجلد مخصص في Google Drive، وتوفير كاش محلي متين في المتصفح عبر IndexedDB للعمل دون اتصال، وتطبيق سقف 40,000 حرف بحد أقصى 6 صور لكل جهاز.
- **تحديثات الخادم السحابي (`GoogleAppsScript_Backend.gs.txt`):**
  - إضافة إجراء سيرفري جديد `uploadPhoto` في قائمة الصلاحيات `ACTION_ROLES`: متاح للأدوار `['admin', 'technician', 'cashier']`.
  - معالجة `uploadPhoto`: البحث عن أو إنشاء مجلد باسم `microERP_Device_Photos` على Google Drive، فك تشفير بيانات base64 إلى ملف JPEG ثنائي، ضبط الصلاحيات للمعاينة (`DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW`)، وإرجاع معرف الملف `fileId` ورابط المعاينة المباشر `url` ورابط التنزيل.
- **تحديثات العميل والواجهة (`06-config-defaults.js`, `03-utils-and-mappings.js`, `10-receipts-maintenance.js`, `11-customers-crm.js`):**
  - ضغط الصور الذكي في `compressImageFile`: فحص حجم الملف الأولي (سقف 10 ميجابايت)، وتقليص الأبعاد وجودة JPEG بنظام تكراري تنازلي لضمان ألا تتجاوز الصورة 35,000 حرف وسقف 150 كيلوبايت.
  - محرك التخزين المحلي الدائم `microerp_photos_db` عبر `IndexedDB` لتخزين واسترجاع الصور محلياً (`savePhotoToIndexedDB`, `getPhotoFromIndexedDB`) مما يمنع ملء سعة `localStorage`.
  - دالة `formatPhotosForSheet(photos)`: تقتصر على 6 صور كحد أقصى، تفضل روابط Google Drive المباشرة، وتتحقق من أن إجمالي طول حقل `row.Photos` لا يتعدى 40,000 حرف بأي حال؛ وإذا تجاوز تجرد بيانات base64 مع الإبقاء على ميتاداتا الصورة وحالتها المحلية.
  - تطبيق سقف 6 صور في واجهتي الاستلام وتفاصيل الصيانة مع تنبيه المستخدم عند تجاوزه.

### الترحيل 11 [U5] — محرك التحصين ضد التكرار (Idempotency Engine)، التراجع الأسي لطابور المزامنة، وحماية التعارض
- **التاريخ:** 2026-10-06
- **الهدف:** القضاء الجذري على ازدواج العمليات المالية عند إعادة الإرسال أو تذبذب الشبكة، وتنظيم طابور المزامنة دون اتصال بخوارزمية التراجع الأسي الذكية (Exponential Backoff)، وحماية البيانات المحلية من الاستبدال العشوائي أثناء وجود عمليات معلقة.
- **تحديثات الخادم السحابي (`GoogleAppsScript_Backend.gs.txt`):**
  - إنشاء وتسجيل ورقة عمل جديدة `Idempotency` في `ALLOWED_HEADERS`: أعمدة `Key`, `Action`, `CreatedAt`, `User`, `Details`.
  - تطبيق دالة فحص وتوثيق مفاتيح التكرار `checkIdempotency(key, action, user, details)` بالاعتماد المزدوج على `CacheService` للاستجابة فائقة السرعة مع التخزين الدائم في ورقة `Idempotency`.
  - تطبيق سياسة تنظيف دورية ذاتية `pruneOldIdempotencyKeys` تحذف تلقائياً السجلات التي مر عليها أكثر من 30 يوماً عند تخطي حجم الجدول للحد المسموح به.
  - تحصين كافة العمليات المالية والحساسة الست بالخادم ضد التكرار: `savePayment`, `saveSale`, `saveReturn`, `savePurchase`, `saveExpense`, `saveInvoice`, و `saveReceipt`.
- **تحديثات العميل والواجهة (`02-api-sync.js`, `04-chart-of-accounts.js`, `09-shell-and-router.js`, `18-settings-admin.js`):**
  - توليد مفتاح المعاملة الفريد `clientRef` فور إنشاء العملية في الكلاينت (`addToSyncQueue` و `apiPost`) باستخدام `generateUUID()` المشفر لمنع توليد مفاتيح مختلفة عند كل إعادة محاولة.
  - تطبيق خوارزمية التراجع الأسي (Exponential Backoff): فترة تأخير تزداد بمعدل `min(2^retry * 1000ms, 5 min)` بعد كل فشل شبكي، مع وضع علامة الفشل النهائي `failed_terminal` عند استنفاد 10 محاولات متتالية.
  - تحصين نقطة بداية النظام `fetchBootstrapData` والدورة الدورية في `09-shell-and-router.js` ضد مسح التعديلات المحلية غير المرفوعة طالما توجد عمليات معلقة بالطابور.
  - تصحيح دوال `loadReceipts` و `loadCustomers` للتمييز الدقيق بين انقطاع الاتصال والاستجابة الصفرية المعتمدة (`rows.length === 0 && navigator.onLine`).
  - توفير لوحة إدارة تفاعلية متكاملة لطابور المزامنة في `renderSyncSettings` تشمل: عدادات العمليات النشطة والفاشلة نهائياً، جدول مفصل بالعمليات مع معرفاتها ومحاولاتها وآخر خطأ مسجل، وأزرار إعادة محاولة مفردة وجماعية، وحذف من الطابور، وتصدير بصيغة JSON.

### الترحيل 10 [U4] — النسخ الاحتياطي الشامل، الاستعادة المؤمنة، تكامل Google Drive، وتصدير CSV الموحد
- **التاريخ:** 2026-10-06
- **الهدف:** توفير محرك متكامل ومؤمن للنسخ الاحتياطي والاستعادة الشاملة لكافة بيانات وجداول النظام لمنع أي فقدان للبيانات، مع تأمين بيانات الاعتماد واستبعاد كلمات المرور من التصدير، وتوفير أرشفة يومية تلقائية على Google Drive، ودعم تصدير الجداول بصيغة Excel/CSV متوافقة مع RFC 4180 ومعقمة ضد هجمات الـ Formula Injection.
- **إجراءات الخادم الجديدة في `ACTION_ROLES`:**
  - `exportBackup`: متاح حصراً لمدير النظام (`['admin']`)؛ يجمع كافة أوراق النظام (26 ورقة عمل) في ملف JSON مهيكل وموثق مع إحصائيات السجلات وإصدار المخطط (`schemaVersion: 10`)، مع حجب كلمات المرور وأملاح التجزئة (`Password`, `Salt`) لحماية الخصوصية.
  - `importBackup`: متاح حصراً لمدير النظام (`['admin']`)؛ يتحقق من صحة الملف وسلامة المخطط، ويقوم بأخذ لقطة فورية في Google Drive قبل الاستعادة كإجراء أمان احترازي، ثم يستعيد كافة الجداول تحت قفل `LockService` مع الحفاظ على كلمات مرور المستخدمين القائمين لمنع قفل حساب المدير.
  - `setupDailyBackupTrigger`: متاح لمدير النظام؛ ينشئ جدولة يومية تلقائية (Google Apps Script Time-driven Trigger) تعمل يومياً الساعة 2:00 صباحاً لأخذ نسخة كاملة من جدول البيانات في مجلد مخصص على Google Drive.
  - `runDailyBackupNow`: متاح لمدير النظام؛ ينفذ لقطة فورية لمجلد `microERP_Backups` على Google Drive مع تطبيق سياسة الاحتفاظ الدائري بآخر 30 نسخة وحذف النسخ الأقدم تلقائياً.
- **تحديثات العميل والواجهة (`18-settings-admin.js` و `02-api-sync.js`):**
  - إضافة تبويب ومسار مخصص `backup` ("النسخ الاحتياطي والاستعادة") في قائمة مركز الإعدادات.
  - زر تصدير سحابي شامل للملف `microERP_CloudBackup_YYYY-MM-DD.json` وزر تصدير محلي من الكاش الحالي.
  - معالج استعادة تفاعلي `openRestoreConfirmationModal` مع فحص هيكل الملف وعرض إحصائيات الجداول ونافذة تأكيد أمني مزدوج تتطلب كتابة "استعادة".
  - إضافة دالة `apiPostDirect` في `02-api-sync.js` لتنفيذ العمليات الإدارية الحساسة والملفات الضخمة مباشرة بمهلة مخصصة دون تلويث كاش التخزين المحلي.
  - توفير شبكة تصدير Excel/CSV لكل جدول على حدة وزر لتصدير كافة الجداول دفعة واحدة مع تطبيق `csvSafe` وحماية RFC 4180 وبادئة UTF-8 BOM.

### الترحيل 9 [U3] — توليد أرقام المستندات على السيرفر وفحص منع التكرار (LockService Deduplication)
- **التاريخ:** 2026-10-06
- **الهدف:** القضاء الجذري على مشكلة حفظ المستندات برقم مكرر بصمت عند عمل أجهزة متعددة دون اتصال متزامن أو عند تعارض الترقيم المحلي، من خلال توليد الأرقام على السيرفر مباشرة تحت قفل `LockService`، والتحقق الصارم من عدم تكرار `ReceiptNumber` و `InvoiceNumber` عند الحفظ.
- **إجراءات الخادم الجديدة (`ACTION_ROLES`):**
  - إضافة إجراء `nextDocumentNumber`: متاح للأدوار `['admin','cashier','accountant','technician']`؛ يستقبل نوع المستند (`Receipt`, `Invoice`, `CreditNote`, `Quotation`, `Contract`) والسنة، ويقرأ أقصى رقم موجود بالورقة تحت `LockService` ويُرجع الرقم التالي بصيغته الرسمية (`MT-YYYY-XXXX`, `INV-YYYY-XXXX`, `CN-YYYY-XXXX`, `QUO-YYYY-XXXX`, `MC-YYYY-XXXX`).
  - دعم الفحص عند الحفظ في `saveReceipt` و `saveInvoice`: إذا وُجد رقم مكرر لسجل آخر، يرفض الخادم مع كود 409 و `duplicate: true` والرقم المقترح، أو يُعيد الترقيم تلقائياً تحت القفل إذا طُلب `autoRenumber: true` مع توثيق ذلك بالتدقيق وإشعار المستخدم في العميل.

### الترحيل 8 [U2] — دورة حياة الصيانة، توثيق موافقة العميل، وحقول الضمان ونموذج الجهاز الموحد
- **التاريخ:** 2026-10-06
- **الهدف:** استكمال دورة حياة الصيانة الكاملة عبر حظر الانتقال إلى حالة "الصيانة" بدون توثيق معتمد لموافقة العميل (قناة التواصل، التكلفة، المسجل، التاريخ)، توحيد نموذج الأجهزة بين `device` و `devices[]` عبر getter/setter لمنع تشتت البيانات، ودعم تتبع فترات الضمان (أشهر وتاريخ انتهاء محسوب بدقة)، بالإضافة لحالات التشغيل الجديدة (`بانتظار موافقة العميل`، `بانتظار قطعة غيار`، `ملغي`) وإشعارات الأجهزة المتروكة (+30 يوم).
- **الأعمدة المحدثة والمثبتة في `ALLOWED_HEADERS['Receipts']` بالخادم:**
  - `WarrantyMonths`: عدد أشهر الضمان المعتمدة للجهاز (رقم صحيح، افتراضياً 3 أشهر).
  - `WarrantyEnd`: تاريخ انتهاء الضمان بصيغة `YYYY-MM-DD` المحسوب تقويمياً لتفادي فروق التوقيت.
  - `CustomerApprovalJSON`: نص JSON لتوثيق تفاصيل موافقة العميل `{ approved, approverName, channel, approvedCost, approvedAt, recordedBy, notes }`.
  - تحديث كامل الحقول المرسلة من العميل: `Time`, `ReceivedAt`, `PartsJSON`, `InspectionFee`, `EstimateTime`, `ServiceItems`, `Devices`, `Photos`, `OtherAccountDesc`, `OtherAccountAmount`, `PreviousReceiptID`, `PreviousReceiptNumber`, `RootReceiptID`, `ReIntakeReason`, `ServiceCycle`, `NextReceiptID`, `NextReceiptNumber`.

### الترحيل 7 [U1] — جداول ومخططات مشاريع كاميرات المراقبة وعقود الصيانة الدورية
- **التاريخ:** 2026-10-06
- **الهدف:** توفير بنية تحتية متكاملة لإدارة مواقع ومشاريع كاميرات المراقبة، ربط الكاميرات بقنوات أجهزة التسجيل (DVR/NVR)، توثيق الزيارات الميدانية مع توقيع العميل إلكترونياً، تتبع ضمانات الأجهزة وعقود الصيانة الدورية، وتوجيه إيرادات المشاريع لمحفظة 4103.
- **الجداول الجديدة المعتمدة في `ALLOWED_HEADERS`:**
  - `Sites`: `['ID', 'CustomerID', 'CustomerName', 'SiteName', 'Address', 'GPS', 'ContactPerson', 'ContactPhone', 'Notes', 'CreatedAt']`
  - `Projects`: `['ID', 'SiteID', 'CustomerID', 'CustomerName', 'ProjectName', 'Status', 'StartDate', 'EndDate', 'TotalCost', 'InvoicedTotal', 'PaidTotal', 'WarrantyEnd', 'ScopeOfWork', 'Notes', 'CreatedAt']`
  - `ProjectDevices`: `['ID', 'ProjectID', 'SiteID', 'DeviceType', 'Brand', 'Model', 'SerialNumber', 'ChannelNo', 'Location', 'Resolution', 'Lens', 'InstallDate', 'WarrantyMonths', 'WarrantyEnd', 'Notes']`
  - `ServiceVisits`: `['ID', 'ProjectID', 'SiteID', 'CustomerName', 'VisitDate', 'VisitType', 'Technician', 'CheckIn', 'CheckOut', 'Findings', 'ActionsTaken', 'PartsUsedJSON', 'SignatureData', 'NextVisitDate', 'Status', 'Notes']`
  - `MaintenanceContracts`: `['ID', 'SiteID', 'CustomerID', 'CustomerName', 'ContractNumber', 'StartDate', 'EndDate', 'Frequency', 'VisitsIncluded', 'VisitsUsed', 'TotalValue', 'Status', 'Notes']`
  - `ProjectMilestones`: `['ID', 'ProjectID', 'MilestoneName', 'Percentage', 'Amount', 'DueDate', 'Status', 'InvoiceID', 'Notes']`
- **إجراءات الخادم (`ACTION_ROLES`):**
  - إضافة `saveSite`, `deleteSite`, `saveProject`, `deleteProject`, `saveProjectDevice`, `deleteProjectDevice`, `saveServiceVisit`, `deleteServiceVisit`, `saveMaintenanceContract`, `deleteMaintenanceContract`, `saveProjectMilestone`, `deleteProjectMilestone`.
- **التوجيه المحاسبي:**
  - اعتماد مراجع القيود الآلية `Project_Milestone`, `Project_Delivery`, `CCTV_Project` في `AUTOPOST_REFS`.
  - توجيه إيرادات الكاميرات والمشاريع إلى حساب `4103` ("إيرادات تركيب كاميرات وأنظمة") بدلاً من تداخله مع مصنعية الصيانة `4101` أو مبيعات البضائع `4102`.
- **آلية الترحيل:** تقوم دالة `ensureHeaders` في خادم Google Apps Script برصد أي صفوف مرسلة لهذه الجداول وتوسيع أعمدة الشيتات تلقائياً.

### الترحيل 6 [F6] — أعمدة وحسابات مطابقة الدرج والورديات (Cash Drawer & Shift Reconciliations / Z-Report)
- **التاريخ:** 2026-10-05
- **الهدف:** إحكام الرقابة على الصندوق وربط مبيعات ومقبوضات ومنصرفات الكاشير بالورديات بدقة التوقيت، وحساب متبقي النقدية (Change Due) منعاً لتضخيم رصيد النقدية المتوقع، وتوليد قيود تسوية العهدة وفروق الدرج تلقائياً بدفتر اليومية العام.
- **التغييرات في `ALLOWED_HEADERS`:**
  - `Sales`: إضافة `Time`، `ShiftID`، `ChangeDue`
  - `Payments`: إضافة `Time`، `ShiftID`
  - `Expenses`: إضافة `Time`، `ShiftID`
- **التغييرات في دليل الحسابات وقيود اليومية:**
  - إضافة حساب `2105` (`عهدة وأمانات مسؤولي الورديات`) تحت الخصوم المتداولة `21`.
  - إضافة مراجع القيود الآلية `Shift_Open`، `Shift_Close`، `Shift_Variance`، `CashIn`، `CashOut` لقائمة `AUTOPOST_REFS` المعتمدة في الخادم.
- **آلية الترحيل:** تقوم دالة `ensureHeaders` في خادم Apps Script بتوسيع أعمدة الشيت تلقائياً واستقبال البيانات الإضافية بصورة رجعية متوافقة 100%.

### الترحيل 5 [F3] — أعمدة المعالجة المحاسبية لضريبة القيمة المضافة (VAT Ledger Routing)
- **التاريخ:** 2026-10-05
- **الهدف:** توحيد محرك الحسابات المالية للضرائب (`computeDocTotals`) وتوجيه مخرجات ومدخلات القيمة المضافة إلى الحسابات المخصصة بدليل الحسابات (1105 مدخلات، 2104 مخرجات).
- **التغييرات في `ALLOWED_HEADERS`:**
  - `Sales`: إضافة `TaxAmount`
  - `Purchases`: إضافة `TaxAmount`
  - `Invoices`: إضافة `IsTaxInclusive`
- **آلية الترحيل:** تقوم دالة `ensureHeaders` في خادم Google Apps Script برصد أي صفوف مرسلة تحتوي هذه الخصائص الجديدة وتمديد رؤوس الأعمدة تلقائياً دون أي مساس بالأعمدة والبيانات القديمة.

### الترحيل 4 [S11] — تحصين سجل الرقابة `AuditLog` بسلسلة تجزئة متصلة (Hash Chain)
- **التاريخ:** 2026-10-05
- **الهدف:** توفير سجل تدقيق شامل وغير قابل للتلاعب به لحركات النظام المالية والإدارية (Tamper-Evident Audit Trail).
- **التغيير في `ALLOWED_HEADERS['AuditLog']`:**
  - القديم: `['Timestamp','User','Action','ReceiptID']`
  - الجديد: `['Timestamp','User','Action','ReceiptID','RefType','Details','RowHash']`
- **آلية الترحيل:** يقوم الخادم بحساب بصمة SHA-256 متصلة بالبصمة السابقة `RowHash` لكل صف تدقيق جديد، وترقية عناوين ورقة `AuditLog` تلقائياً عند أول كتابة مع دعم استرجاع السجل المباشر للمدير `getAuditLog`.

### الترحيل 3 [S10] — إضافة عمود `ClientRef` لورقة `Returns`
- **التاريخ:** 2026-10-05
- **الهدف:** ضمان عدم تكرار طلبات المرتجعات عند انقطاع الاتصال أو تكرار النقر (Idempotency) وحماية التوازن المالي والمخزني.
- **التغيير في `ALLOWED_HEADERS['Returns']`:**
  - القديم: `['ID','SaleID','Date','ItemsSummary','RefundAmount','RefundMethod','By']`
  - الجديد: `['ID','SaleID','ClientRef','Date','ItemsSummary','RefundAmount','RefundMethod','By']`
- **آلية الترحيل:** يرسل العميل مع طلب المرتجع معرف `clientRef`. يتحقق الخادم أولاً في الكاش ثم في صفوف ورقة `Returns` من عدم تكرار المعرف قبل تسجيل المرتجع.

### الترحيل 2 [S9] — إضافة عمود `TrackToken` لورقة `Receipts`
- **التاريخ:** 2026-10-05
- **الهدف:** تأمين بوابة التتبع العامة وحماية خصوصية العملاء بمنع استخراج وتخمين أرقام الإيصالات التسلسلية.
- **التغيير في `ALLOWED_HEADERS['Receipts']`:**
  - القديم: `['ID','ReceiptNumber','Date','CustomerTitle',...]`
  - الجديد: `['ID','ReceiptNumber','TrackToken','Date','CustomerTitle',...]`
- **آلية الترحيل:** عند حفظ أي إيصال جديد أو تعديل إيصال قائم في `saveReceipt`، يقوم الخادم تلقائياً بتوليد `TrackToken` عشوائي بطول 20 حرفاً إذا لم يكن موجوداً وحفظه في الورقة. كما يقتصر استعلام `trackReceipt` العام على الرمز العشوائي مع حجب التفاصيل المالية الداخلية.

### الترحيل 1 [S5] — إضافة عمود `Salt` لورقة `Users`
- **التاريخ:** 2026-10-05
- **الهدف:** تعزيز أمان كلمات المرور بمنع هجمات جداول قوس قزح وتخمين كلمات المرور السريع.
- **التغيير في `ALLOWED_HEADERS['Users']`:**
  - القديم: `['ID','Name','Password','Role','Sections','Superuser','Notes']`
  - الجديد: `['ID','Name','Password','Salt','Role','Sections','Superuser','Notes']`
- **آلية الترحيل:** عند تسجيل دخول أي مستخدم بنجاح، يقوم الخادم تلقائياً بتوليد `Salt` عشوائي وإعادة تجزئة كلمة المرور بـ 5000 تكرار وحفظ البصمة والملح في الورقة.

### الترحيل 5 [F9] — دعم المرتجعات الجزئية وإشعارات الدائن واسترداد الصيانة
- **التاريخ:** 2026-10-06
- **الهدف:** تمكين إرجاع الأصناف جزئياً من فواتير البيع دون قفل الفاتورة، إصدار إشعارات دائن برقم تسلسلي، وتأمين تدفق استرداد مبالغ الصيانة والعربون مع قيود اليومية.
- **التغييرات في الأعمدة البيضاء المسموحة (`ALLOWED_HEADERS`):**
  - ورقة `Receipts`: إضافة عمودي `RefundMethod` و `RefundReason` لتوثيق تفاصيل الاسترداد وسيلة الدفع والسبب.
  - ورقة `Sales`: إضافة عمود `IsPartiallyReturned` لتمييز الفواتير المرتجعة جزئياً عن المرتجعة كلياً (`IsReturned`).
  - ورقة `Returns`: إضافة عمود `CreditNoteNumber` لربط المرتجع بإشعار الدائن الصادر.
  - ورقة `Invoices`: إضافة عمود `Type` لتمييز نوع المستند (`Invoice` للفواتير الضريبية والرسمية، و `CreditNote` لإشعارات الخصم الدائنة).
- **آلية الترحيل:** تقوم دالة `ensureHeaders` بتحديث أعمدة الشيتات تلقائياً عند أول عملية حفظ.

### الترحيل 4 — نوع قيد الأرصدة الافتتاحية وحساب تسوية البداية [F8]
- **التاريخ:** 2026-10-06
- **الهدف:** تمكين إدخال الأرصدة الافتتاحية بقيد مزدوج متوازن وتوفير حساب تسوية وسيط.
- **التغييرات:**
  - إضافة نوع المرجع `Opening_Balance` إلى القائمة البيضاء `AUTOPOST_REFS` في الخادم السحابي `GoogleAppsScript_Backend.gs.txt`.
  - إضافة حساب `3104` باسم "أرصدة افتتاحية معلقة وتسوية البداية" إلى شجرة الحسابات الافتراضية `DEFAULT_ACCOUNTS` تحت حقوق الملكية (`31`).
  - تصفير عمود `Balance` المباشر في الحسابات عند ترحيل القيد الافتتاحي لمنع الازدواج وتوحيد مرجعية الدفتر العام.

### الترحيل 0 — خط الأساس (Baseline)
- **التاريخ:** 2026-10-05
- **الهدف:** توثيق المخطط الحالي قبل أي تعديلات.
- **الأوراق الحالية المعرّفة في `ALLOWED_HEADERS`:**
  - `Receipts`: ID, Date, ReceiptNumber, CustomerName, CustomerPhone, DeviceCategory, DeviceBrand, DeviceModel, Faults, Accessories, Cost, Deposit, PartsCost, OtherAccount, OtherAccountAmount, Status, DeliveryDate, ReceivedBy, Technician, Notes, Photos, Password, Warranty, Deleted, DeletedAt, DeletedBy, DeleteReason
  - `Customers`: ID, Name, Phone, AltPhone, Address, Notes, TotalReceipts, TotalSpent, Debt, CreatedAt
  - `Technicians`: ID, Name, Phone, Specialty, Active
  - `Payments`: ID, ReceiptID, Date, Amount, Method, Notes, ReceivedBy, ClientRef
  - `Inventory`: ID, Name, Category, Quantity, PurchasePrice, SellPrice, MinStock, Barcode, Location, Notes
  - `Sales`: ID, Date, ItemsSummary, ItemsJSON, Total, PaymentMethod, AmountPaid, CustomerName, CustomerPhone, By
  - `Returns`: ID, SaleID, ReturnDate, ItemsJSON, RefundAmount, Reason, By
  - `Quotations`: ID, Date, CustomerName, CustomerPhone, ItemsJSON, Subtotal, Discount, Tax, Total, Status, ValidUntil, Notes, By
  - `Services`: ID, Name, DefaultPrice, Category, Description
  - `Purchases`: ID, Date, SupplierName, InvoiceNumber, ItemsJSON, Total, PaymentMethod, AmountPaid, Notes, By
  - `Suppliers`: ID, Name, Phone, Company, Address, Notes, Debt, CreatedAt
  - `Serials`: ID, ItemID, SerialNumber, Status, PurchaseDate, SoldDate, WarrantyMonths, Notes
  - `Expenses`: ID, Date, Category, Amount, Description, PaidTo, PaymentMethod, By
  - `Accounts`: Code, Name, Type, ParentCode, Balance, Nature
  - `Journal`: ID, Date, EntryNumber, Description, ReferenceType, ReferenceID, LinesJSON, TotalDebit, TotalCredit, CreatedBy, CreatedAt
  - `Invoices`: ID, Date, InvoiceNumber, CustomerName, CustomerPhone, ItemsJSON, Subtotal, TaxRate, TaxAmount, Discount, Total, AmountPaid, Remaining, Status, Notes, By
  - `Users`: ID, Name, Password, Role, Sections, Superuser, Notes
