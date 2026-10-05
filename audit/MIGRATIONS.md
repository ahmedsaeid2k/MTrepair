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

---

## تفاصيل الترحيلات

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
