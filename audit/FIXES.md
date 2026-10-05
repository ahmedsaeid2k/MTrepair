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

---

## المراحل اللاحقة (تُحدَّث بعد كل بند):
- **المرحلة 1: الأمان (P0) — S8 إلى S16**
- **المرحلة 2: سلامة الأرقام المالية (P1) — F1 إلى F11**
- **المرحلة 3: الوظائف الناقصة (P2) — U1 إلى U14**
- **المرحلة 4: الجودة والصيانة (P3) — Q1 إلى Q5**
