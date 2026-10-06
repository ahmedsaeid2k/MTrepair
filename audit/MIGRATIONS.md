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

---

## تفاصيل الترحيلات

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
