# microERP | وثيقة تدقيق ومراجعة الحسابات والعمليات المالية (Calculations & Financial Audit)

> **الإصدار المستهدف:** 1.0.0 Enterprise Release  
> **تاريخ التدقيق:** نوفمبر 2026  
> **طبيعة الوثيقة:** مراجعة شاملة وصارمة لجميع المعادلات الرياضية، حسابات الضرائب (VAT)، الخصومات، تكلفة البضاعة المباعة (COGS)، المتوسط المرجح للتكلفة (WAC)، تقريب الفاصلة العائمة، وسلف الموظفين والورديات.  
> **قاعدة الاعتماد:** توثيق كل ملاحظة برقم السطر والملف الفعلي (`File:Line`) مدعوماً بالدليل الرياضي/البرمجي القاطع، مع تحديد درجة الخطورة واقتراح الإصلاح المباشر.

---

## فهرس المحتويات
1. [الخلاصة التنفيذية للتدقيق المالي (Executive Summary)](#1-الخلاصة-التنفيذية-للتدقيق-المالي-executive-summary)
2. [جدول الملاحظات الموحد (Consolidated Findings Table)](#2-جدول-الملاحظات-الموحد-consolidated-findings-table)
3. [التحليل التفصيلي للمحاور الحسابية والمالية (In-Depth Technical Analysis)](#3-التحليل-التفصيلي-للمحاور-الحسابية-والمالية-in-depth-technical-analysis)
   - [3.1 محرك الفاصلة العائمة والتقريب المالي (Floating Point Precision & Rounding)](#31-محرك-الفاصلة-العائمة-والتقريب-المالي-floating-point-precision--rounding)
   - [3.2 حسابات ضريبة القيمة المضافة والإقرار الضريبي (VAT 14% & Tax Settlement)](#32-حسابات-ضريبة-القيمة-المضافة-والإقرار-الضريبي-vat-14--tax-settlement)
   - [3.3 الخصومات وحساب إجماليات الفواتير والأسقف (Discounts & Invoice Totals)](#33-الخصومات-وحساب-إجماليات-الفواتير-والأسقف-discounts--invoice-totals)
   - [3.4 تكلفة المبيعات والمتوسط المرجح للتكلفة (COGS & Moving Weighted Average Cost)](#34-تكلفة-المبيعات-والمتوسط-المرجح-للتكلفة-cogs--moving-weighted-average-cost)
   - [3.5 مبيعات POS والدفع المجزأ والمرتجع الجزئي (POS Sales, Splits & Returns)](#35-مبيعات-pos-والدفع-المجزأ-والمرتجع-الجزئي-pos-sales-splits--returns)
   - [3.6 الصيانة والإيصالات وازدواجية المديونية (Maintenance Receipts & Debt Accounting)](#36-الصيانة-والإيصالات-وازدواجية-المديونية-maintenance-receipts--debt-accounting)
   - [3.7 المشتريات والموردون ومرتجع الشراء (Purchases & Supplier Balances)](#37-المشتريات-والموردون-ومرتجع-الشراء-purchases--supplier-balances)
   - [3.8 نقدية الدرج وفروق الورديات (Shifts & Cash Drawer Variances)](#38-نقدية-الدرج-وفروق-الورديات-shifts--cash-drawer-variances)
   - [3.9 شؤون الموظفين والسلف وسقف الائتمان ومسير الرواتب (HR Advances, Credit & Payroll)](#39-شؤون-الموظفين-والسلف-وسقف-الائتمان-ومسير-الرواتب-hr-advances-credit--payroll)
4. [فحص الحالات الحدية (Boundary & Edge Case Analysis)](#4-فحص-الحالات-الحدية-boundary--edge-case-analysis)
5. [تدقيق الاختبارات الحالية وأمثلة الحقيقة الأرضية المقارنة (Test Suites Audit & Ground Truth Benchmarks)](#5-تدقيق-الاختبارات-الحالية-وأمثلة-الحقيقة-الأرضية-المقارنة-test-suites-audit--ground-truth-benchmarks)
6. [التوصيات وخطة العمل التصحيحية (Actionable Recommendations)](#6-التوصيات-وخطة-العمل-التصحيحية-actionable-recommendations)

---

## 1. الخلاصة التنفيذية للتدقيق المالي (Executive Summary)

تم إخضاع المنظومة المالية والحسابية لـ **microERP** عبر بيئاتها الثلاث (النواة المشتركة `09-finance-engine.js`، الموديولات التشغيلية للواجهة `app-modular/js/modules/`، والواجهة الخلفية `GoogleAppsScript_Backend.gs.txt`) لتدقيق رياضي ومحاسبي صارم.

### أبرز مؤشرات نتائج التدقيق:
* **إجمالي الملاحظات المرصودة:** 18 ثغرة حسابية وتضارباً برمجياً.
* **الملاحظات الحرجة (Critical):** 6 ملاحظات تؤدي إلى قيود غير متزنة دفترياً، تضاعف مصطنع لتكلفة المخزون (WAC Inflation)، وأخطاء تقريب غير متماثلة للمبالغ السالبة، وتشويه ضريبي على المرتجعات.
* **الملاحظات العالية (High):** 5 ملاحظات تؤدي إلى بتر القروش/السنتات عبر `Math.round()`، عدم تخفيض ديون العملاء عند المرتجع، تضارب حساب تكلفة قطع الغيار بين سعر البيع والشراء، وفقدان مبالغ التحصيل عند تسليم أجهزة الصيانة.
* **الملاحظات المتوسطة (Medium):** 4 ملاحظات تتعلق بتباين محركات حساب الفاتورة الضريبية، وازدواجية تسجيل ديون الموظفين في شيت العملاء، وإغفال مرتجع الشراء من كشف المورد.
* **الملاحظات المنخفضة (Low):** 3 ملاحظات تتعلق بترميز الأقواس المحاسبية السالبة، والحالات الحدية لمجمل الربح عند صافي مبيعات سالب.

---

## 2. جدول الملاحظات الموحد (Consolidated Findings Table)

| # | الخطورة | الملف:السطر | المشكلة | الدليل | الإصلاح المقترح |
| :-: | :---: | :--- | :--- | :--- | :--- |
| **1** | **Critical** | [09-finance-engine.js:64-68](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/09-finance-engine.js#L64-L68) | التقريب غير المتماثل للمبالغ السالبة في دالة `round2` الأساسية بسبب إضافة `+ Number.EPSILON` الموجب دائماً. | تجربة `round2(-1.005)` تعيد `-1` بدلاً من `-1.01`، بينما `round2(1.005)` تعيد `1.01`. وكذلك `round2(-35.555)` تعيد `-35.55` بدلاً من `-35.56`. | تعديل الدالة لتكون مدركة للإشارة: `Math.sign(n) * (Math.round((Math.abs(n) + Number.EPSILON) * 100) / 100)`. |
| **2** | **Critical** | [03-utils-and-mappings.js:2319-2321](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/03-utils-and-mappings.js#L2319-L2321)<br>[Backend:1835-1837](file:///Users/M1/Desktop/microtech-app/files%2811%29/GoogleAppsScript_Backend.gs.txt#L1835-L1837) | تضخم مصطنع ومضاعفة غير صحيحة لتكلفة الصنف (WAC) عند الشراء في حالة وجود رصيد مخزون سالب (`allowNegativeStock`). | المعادلة: `((Math.max(0, oldQty) * oldCost) + (newQty * newCost)) / (oldQty + newQty)`. إذا كان الرصيد السابق `-5` والوارد `10` بسعر `100`، يصبح البسط `1000` والمقام `5`، فتصبح التكلفة الجديدة `200` ج.م (تضاعفت 100%!)، وإذا كان الرصيد السابق `-9` والوارد `10` تقفز التكلفة إلى `1000` ج.م (تضخم بمقدار 10 أضعاف!). | إذا كان `oldQty <= 0` يجب اعتماد سعر الشراء الجديد مباشرة كتكلفة للوحدة: `invItem.PurchasePrice = newCost` دون قسمة على الرصيد الصافي المتبقي بعد تغطية العجز. |
| **3** | **Critical** | [17g-employee-advances-hr.js:355-361](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/17g-employee-advances-hr.js#L355-L361)<br>[09-finance-engine.js:869-934](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/09-finance-engine.js#L869-L934) | توليد قيد مركب غير متزن لمسير الرواتب الشهري في حال تجاوزت استقطاعات الموظف إجمالي راتبه. | الدالة تحصر الصافي عند الصفر `net = Math.max(0, gross - ded)`، لكنها تراكم كامل الاستقطاعات في أطراف الدائن (حسابات 1106, 1107, 4201). إذا كان الراتب `3000` والاستقطاعات `3500`، يصبح المدين `3000` (حساب 5203) والدائن `3500`، فيفشل فحص توازن القيد بفارق `500` ج.م. | وضع سقف للاستقطاعات بحيث لا تتجاوز إجمالي الراتب المستحق للموظف، وترحيل الفائض كدين مرحل للشهر التالي بدلاً من قيده كاملاً في دائن التسوية. |
| **4** | **Critical** | [15-pos-retail.js:1260-1275](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/15-pos-retail.js#L1260-L1275)<br>[03-utils-and-mappings.js:1986-2002](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/03-utils-and-mappings.js#L1986-L2002) | عدم اتزان قيد اليومية في مبيعات POS المركبة (Split Payment) عند إرجاع الباقي للعميل (Change Due). | إذا كان إجمالي الفاتورة `120` وسدد العميل `50` بطاقة و `100` نقداً (الإجمالي `150` والباقي `30`)، ترسل السلة في `splits` مبلغا نقديّا قدره `100`، فيولد القيد مديونية نقدية وبنكية بـ `150` بينما الدائن للإيراد هو `120` فقط، بفارق عدم اتزان قدره `30` ج.م. | خصم `finalChangeDue` من شريحة الدفع النقدي داخل مصفوفة `splits` قبل ترحيل القيد ليكون مجموع `splits` مساوياً تماماً لإجمالي الفاتورة. |
| **5** | **Critical** | [15-pos-retail.js:2549-2550, 2621-2624](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/15-pos-retail.js#L2549-L2550)<br>[Backend:1760-1763](file:///Users/M1/Desktop/microtech-app/files%2811%29/GoogleAppsScript_Backend.gs.txt#L1760-L1763) | إغفال عكس ضريبة المخرجات (حساب 2104) في مرتجع مبيعات POS والإشعارات الدائنة. | قيد المرتجع يقوم بمدينية حساب المبيعات 4102 بكامل المبلغ المسترد `totalRefund` (شاملاً الضريبة) ولا يمس حساب 2104 إطلاقاً، كما أن الإشعار الدائن يُنشأ بـ `TaxAmount: 0`. النتيجة: يسدد التاجر الضريبة مرتين ولا تسترد المنشأة ضريبة المبيعات الملغاة. | استخراج الضريبة والصافي من الأصناف المرتجعة، وقيد الطرف المدين: مدين 4102 بصافي المرتجع، ومدين 2104 بضريبة المرتجع المستردة. |
| **6** | **Critical** | [03-utils-and-mappings.js:2966-2969](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/03-utils-and-mappings.js#L2966-L2969)<br>[Backend:1969-1972](file:///Users/M1/Desktop/microtech-app/files%2811%29/GoogleAppsScript_Backend.gs.txt#L1969-L1972) | إغفال عكس ضريبة المدخلات (حساب 1105) في مرتجع المشتريات وتحميل كامل المبلغ على المخزون. | عند الشراء: دائن المورد 114، مدين المخزون 1104 بـ 100، ومدين الضريبة 1105 بـ 14. عند المرتجع: يجعل المخزون 1104 دائناً بكامل المبلغ 114 دون مساس بحساب 1105، مما يخلق عجزاً وهمياً في المخزون ويترك رصيد ضريبة مدخلات غير قانوني مستحق للخصم. | قيد مرتجع الشراء: مدين الصندوق/المورد بـ `pret.Total`، ودائن المخزون 1104 بالصافي `pret.Total - pret.TaxAmount`، ودائن الضريبة 1105 بـ `pret.TaxAmount`. |
| **7** | **High** | [15-pos-retail.js:2514-2637](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/15-pos-retail.js#L2514-L2637)<br>[Backend:1620-1777](file:///Users/M1/Desktop/microtech-app/files%2811%29/GoogleAppsScript_Backend.gs.txt#L1620-L1777) | عدم تخفيض مديونية العميل في سجل العملاء عند إجراء مرتجع لمبيعات آجلة (`refundMethod = credit`). | عند الشراء الآجل يُسجل الدين في `Customers.Debt`. عند عمل مرتجع للمبيعات الآجلة، لا يتم تحديث أو إنقاص مديونية العميل لا محلياً ولا في الباك إند، ويبقى العميل مطالباً بدفع ثمن بضاعة قام بإرجاعها بالفعل. | إضافة تخفيض فوري لمديونية العميل: `cust.Debt = Math.max(0, cust.Debt - refundAmount)` في موديول POS والباك إند `saveReturn`. |
| **8** | **High** | [04-chart-of-accounts.js:1458-1464](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/04-chart-of-accounts.js#L1458-L1464)<br>[10d-receipt-detail.js:455-458](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/10d-receipt-detail.js#L455-L458) | تضارب خطير في مفهوم `partsCost` واستخدام سعر البيع بدلاً من سعر التكلفة لتسجيل COGS في الصيانة. | في `10d-receipt-detail.js:457` يتم تعيين `r.partsCost = partsSellTotal` (سعر بيع القطع للعميل). وفي `04-chart-of-accounts.js:1462` يُقيد: مدين 5101 (COGS) بـ `d.partsCost` ودائن 1104 بـ `d.partsCost`. إذا كانت تكلفة الشاشة 200 وبيعت بـ 500، يُخصم من المخزون 500 ج.م ويُسجل تكلفة 500 ج.م، مما يضخم التكلفة ويلغي أرباح الورشة. | استخدام التكلفة الفعلية `partsBuyCost` (أو `costPrice * qty`) حصراً لقيود تكلفة قطع الغيار (حساب 5101 و 1104). |
| **9** | **High** | [15-pos-retail.js:129, 133, 376, 379, 1218, 1221](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/15-pos-retail.js#L129) | بتر القروش والكسور العشرية في الضرائب والخصومات واستخدام `Math.round()` للعدد الصحيح بدلاً من `round2`. | في POS: `Math.round(subtotal * (discountVal / 100))` و `Math.round(afterDiscount * taxRate / 100)`. فاتورة بقيمة `125.50` وخصم 10%، يعطي خصماً قدره `13` ج.م بدلاً من `12.55` ج.م (فارق 45 قرشاً). وضريبة `112.95 * 0.14 = 15.813` تقرب إلى `16` ج.م بدلاً من `15.81` ج.م. | استبدال كافة استدعاءات `Math.round(...)` في حسابات النسبة بـ `round2(...)` التي تحافظ على منزلتين عشريتين دقيقتين. |
| **10** | **High** | [11a-customers-directory.js:1066](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/11a-customers-directory.js#L1066)<br>[10c-receipt-actions.js:2354](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/10c-receipt-actions.js#L2354) | إغفال تحديث رصيد المدفوع (`r.deposit`) وراية `r.paid` عند تحصيل متبقي الصيانة أثناء تسليم الأجهزة. | عند التسليم وتحصيل المتبقي نقداً، يتم استدعاء `savePaymentRemote` ولكن لا يُضاف المبلغ المحصل إلى `r.deposit`، ويتم حفظ الإيصال عبر `saveReceiptRemote(r)` بقيمة العربون القديمة، فيظل الإيصال يظهر كإيصال غير مدفوع ومطالباً بالسداد مرة أخرى. | إضافة: `r.deposit = Number(r.deposit||0) + collectAmount; r.paid = (r.deposit >= totalDue);` قبل استدعاء `saveReceiptRemote(r)`. |
| **11** | **High** | [12-invoices-quotes.js:780-985](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/12-invoices-quotes.js#L780-L985) | إغفال مقبوضات الفواتير المباشرة والآجلة المحصلة نقداً من حساب النقدية المتوقعة بالدرج (`expectedCash`). | `calculateShiftStats` تجمع مبيعات POS ومقبوضات الصيانة، لكنها لا تفحص مدفوعات الفواتير التجارية/الضريبية المستقلة المحصلة نقداً خلال الوردية، مما يجعل الدرج الفعلي أعلى من المتوقع ويصنف الفارق كـ "زيادة نقدية مجهولة" (Surplus). | إضافة تجميع مدفوعات الفواتير النقدية التابعة لنفس الوردية إلى `totalCashIn` في معادلة الوردية. |
| **12** | **Medium** | [09-finance-engine.js:122-147](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/09-finance-engine.js#L122-L147) | دالة `calculateInvoiceTotals` في النواة لا تدعم الأسعار الشاملة للضريبة (`isTaxInclusive`) وتضيف الضريبة دائماً فوق الإجمالي. | إذا تم تمرير أصناف بأسعار شاملة للضريبة، تقوم الدالة بحساب الضريبة كإضافة: `discountedSubtotal + vatAmount` بدلاً من استخلاصها عبر `extractInclusiveVAT`، مما يرفع إجمالي الفاتورة مرتين. | إضافة دعم خيار `options.isTaxInclusive` واستخدام دالة `extractInclusiveVAT` لاستخلاص وعزل الضريبة دون زيادة على العميل. |
| **13** | **Medium** | [03-utils-and-mappings.js:124-144](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/03-utils-and-mappings.js#L124-L144) | عدم توحيد دالة التقريب في `computeDocTotals` واعتماد تقريب خام `Math.round(x * 100) / 100` الخالي من `Number.EPSILON`. | الأرقام المتقاطعة عند المنتصف مثل `1.005` تقرب إلى `1.00` بدلاً من `1.01`، مما يخلق فروق قروش بين شاشات الفواتير والحسابات المركزية. | استخدام الدالة القياسية `round2()` المعرفة في النواة المالية بدلاً من عمليات الضرب والقسمة اليدوية. |
| **14** | **Medium** | [Backend:1515-1534](file:///Users/M1/Desktop/microtech-app/files%2811%29/GoogleAppsScript_Backend.gs.txt#L1515-L1534) | تسجيل مبيعات آجل الموظفين كمديونية على العملاء في الباك إند مسبباً ازدواجية احتساب الدين. | الواجهة في [03-utils-and-mappings.js:1970](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/03-utils-and-mappings.js#L1970) تستبعد مبيعات الموظفين من جدول العملاء لتسجيلها في حساب 1107، لكن الباك إند يضيفها لجدول `Customers`، مما يضاعف دين الموظف مرة في HR ومرة كعميل. | إضافة شرط استبعاد مبيعات الموظفين بالباك إند: `if (!isEmployeeCreditSale)`. |
| **15** | **Medium** | [04-chart-of-accounts.js:1158-1182](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/04-chart-of-accounts.js#L1158-L1182) | إغفال مرتجعات الشراء (`state.purchaseReturns`) عند حساب الرصيد الحي المستحق للمورد (`getSupplierLiveBalance`). | المعادلة تجمع المشتريات وتطرح المسدد في المصروفات فقط، متجاهلة مردودات الشراء التي ردت للمورد بالآجل، فيظهر رصيد المورد أعلى من واقعه الفعلي. | خصم مردودات الشراء الآجلة من إجمالي مشتريات المورد. |
| **16** | **Low** | [09-finance-engine.js:48-59](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/09-finance-engine.js#L48-L59) | تحويل الأرقام المحاسبية ذات الأقواس السالبة `(500)` إلى أرقام موجبة في `parseMoney`. | دالة التنظيف تحذف الأقواس عبر `replace(/[^0-9.-]/g, '')` فتحول `(500.00)` إلى `500.00` موجبة بدلاً من `-500.00`. | فحص نمط الأقواس `^\s*\((.*)\)\s*$` وضربه في `-1`. |
| **17** | **Low** | [12-invoices-quotes.js:923-934](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/12-invoices-quotes.js#L923-L934) | مسار الاحتياط (Fallback) لمرتجعات الوردية يعتبر المرتجع الجزئي مرتجعاً كاملاً بقيمة الفاتورة كاملة. | إذا كان `returnsCount === 0`، يتم فحص `s.IsPartiallyReturned` وخصم كامل قيمة الفاتورة `s.Total` بدلاً من قيمة القطع المسترجعة جزئياً. | قراءة `s.ReturnDetails.totalRefund` بدلاً من `s.Total`. |
| **18** | **Low** | [09-finance-engine.js:176, 187](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/09-finance-engine.js#L176) | إرجاع نسبة هامش مجمل وصافي الربح كـ 0% عند وجود صافي مبيعات سالب في فترات طغيان المرتجعات. | فحص `rev > 0` يعيد `0` إذا كانت الإيرادات سالبة أو مساوية للصفر بدلاً من إظهار نسبة الخسارة الحقيقية. | اعتماد فحص `rev !== 0` بدلاً من `rev > 0`. |

---

## 3. التحليل التفصيلي للمحاور الحسابية والمالية (In-Depth Technical Analysis)

### 3.1 محرك الفاصلة العائمة والتقريب المالي (Floating Point Precision & Rounding)

يعتمد محرك JavaScript القياسي على معيار **IEEE 754** لتمثيل الأرقام العشرية بالفاصلة العائمة ذات الدقة المزدوجة (64-bit Binary Floating Point). ينتج عن هذا التمثيل أخطاء تراكمية شهيرة عند إجراء العمليات الحسابية البسيطة:
* `0.1 + 0.2 = 0.30000000000000004`
* `1.005 * 100 = 100.49999999999999`
* `35.555 * 100 = 3555.4999999999995`

#### أ. فحص دالة `round2()` في [09-finance-engine.js:64-68](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/09-finance-engine.js#L64-L68)
```javascript
function round2(num) {
  const n = parseMoney(num);
  const r = Math.round((n + Number.EPSILON) * 100) / 100;
  return r === 0 ? 0 : r;
}
```
* **الخلل المرصود:** إن إضافة `Number.EPSILON` (وقيمته `2.220446049250313e-16`) تنجح تماماً في تصحيح الأرقام الموجبة المنتهية بـ `5` (نصف للأعلى Half-up)، مثل `round2(1.005) === 1.01`. ولكن عند تطبيقها على الأرقام السالبة، فإن إضافة رقم موجب صغير جداً تؤدي إلى **سحب الرقم السالب باتجاه الصفر** بدلاً من الاتجاه المتماثل نحو اللانهاية السالبة:
  * `(-1.005 + Number.EPSILON) * 100 = -100.49999999999997`
  * `Math.round(-100.49999999999997) = -100`
  * `round2(-1.005) = -1.00` (فقد قرش كامل في الأرقام السالبة!).
* **الأثر المالي:** يظهر هذا الخلل بوضوح في قيود الإرجاع، كشوف الخصومات الدائنة، فروق تسوية الجرد السلبية، وحسابات خسائر النشاط.

#### ب. تباين دوال التقريب عبر الملفات
لوحظ وجود 3 تطبيقات متفرقة للتقريب في المشروع بدلاً من الاعتماد الحصري على النواة:
1. `09-finance-engine.js:64`: يستخدم `(n + Number.EPSILON) * 100`.
2. `03-utils-and-mappings.js:5206` و `114`: يستخدم `Math.round(n * 100) / 100` (معرض للسقوط في خطأ `1.005 -> 1.00`).
3. `15-pos-retail.js:129, 376`: يستخدم `Math.round(...)` للأعداد الصحيحة مبيداً القروش العشرية تماماً.

---

### 3.2 حسابات ضريبة القيمة المضافة والإقرار الضريبي (VAT 14% & Tax Settlement)

يطبق النظام ضريبة القيمة المضافة المصرية القياسية بنسبة **14%** (`DEFAULT_VAT_RATE = 0.14`).

#### أ. الضرائب غير الشاملة (Exclusive VAT)
* **المعادلة:**
  $$\text{VAT Amount} = \text{round2}(\text{Net} \times 0.14)$$
  $$\text{Gross Total} = \text{round2}(\text{Net} + \text{VAT Amount})$$
* **الموقع:** [09-finance-engine.js:98-104](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/09-finance-engine.js#L98-L104)
* **التقييم:** صحيحة ومنضبطة رياضياً وتتوافق مع متطلبات الفاتورة الإلكترونية لمصلحة الضرائب المصرية.

#### ب. استخلاص الضريبة من السعر الشامل (Inclusive VAT)
* **المعادلة:**
  $$\text{Net} = \text{round2}\left(\frac{\text{Gross}}{1 + 0.14}\right)$$
  $$\text{VAT Amount} = \text{round2}(\text{Gross} - \text{Net})$$
* **الموقع:** [09-finance-engine.js:110-117](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/09-finance-engine.js#L110-L117)
* **التقييم:** صحيحة وتضمن أن $\text{Net} + \text{VAT Amount} = \text{Gross}$ بدون أي فرق فلس/قرش ناتج عن التقريب المنفصل.

#### ج. حساب تسوية الإقرار الضريبي الفصلي/الشهري
* **المعادلة:** [09-finance-engine.js:153-163](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/09-finance-engine.js#L153-L163)
  $$\text{Net Tax Payable} = \text{round2}(\text{Output VAT} - \text{Input VAT})$$
  * إذا كان الناتج موجباً $\ge 0$: يمثل التزام سداد واجب الدفع لمصلحة الضرائب (`payable`).
  * إذا كان الناتج سالباً $< 0$: يمثل رصيداً دائناً مستحقاً للمنشأة يرحل للفترات القادمة (`credit`).
* **الخلل المحاسبي الجسيم المرصود في مسار اليومية:**
  بالرغم من صحة معادلة النواة، فإن مسارات القيود اليومية التلقائية تعاني من خلل كارثي:
  1. في مرتجع مبيعات POS ([15-pos-retail.js:2621-2624](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/15-pos-retail.js#L2621-L2624)): لا يتم عكس ضريبة المخرجات الدائنة في الحساب `2104`.
  2. في مرتجع المشتريات ([03-utils-and-mappings.js:2966-2969](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/03-utils-and-mappings.js#L2966-L2969)): لا يتم عكس ضريبة المدخلات المدينة في الحساب `1105`.
  * **النتيجة المحاسبية:** إقرار ضريبي مشوه وغير قانوني، وتوريد ضرائب عن مبيعات تم ردها واسترجاعها للعملاء.

---

### 3.3 الخصومات وحساب إجماليات الفواتير والأسقف (Discounts & Invoice Totals)

#### أ. سقف الخصم والتحقق الرقابي (Discount Ceiling Matrix)
في [15-pos-retail.js:394-396](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/15-pos-retail.js#L394-L396) و [1391-1394](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/15-pos-retail.js#L1391-L1394):
* الحد الأقصى الافتراضي لنسبة الخصم: `maxDiscountPercent = 10%`.
* الحد الأقصى لمبلغ الخصم المالي المباشر: `maxDiscountAmount`.
* المعادلة الرقابية:
  $$\text{isOverDiscount} = (\text{Discount} > \text{Subtotal} \times \frac{\text{maxPct}}{100} + 0.005) \lor (\text{maxAmt} > 0 \land \text{Discount} > \text{maxAmt})$$
* **التقييم:** آلية رقابية محكمة تعترض تطبيق أي خصم غير مصرح به وتطلب اعتماد المشرف فوراً.

#### ب. خطأ بتر قروش الخصم المئوي
* في [15-pos-retail.js:128-130](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/15-pos-retail.js#L128-L130):
  ```javascript
  const discountAmount = ps.discountType === 'percent' 
    ? Math.round(subtotal * (discountVal / 100))
    : Math.min(subtotal, discountVal);
  ```
  استخدام `Math.round(...)` يحول الخصم إلى جنيهات صحيحة فقط. إذا كان إجمالي السلة `250.75` ج.م وطبق خصم 5%، تكون النتيجة الحقيقية `12.5375` ج.م. يقربها الكود إلى `13` ج.م، متنازلاً عن 46 قرشاً إضافية لصالح العميل على حساب أرباح المحل.

---

### 3.4 تكلفة المبيعات والمتوسط المرجح للتكلفة (COGS & Moving Weighted Average Cost)

تعد خوارزمية **المتوسط المرجح للتكلفة (WAC)** العمود الفقري لتقييم المخزون المستمر وتسجيل تكلفة البضاعة المباعة بدقة.

#### أ. الخلل الرياضي الكارثي في معادلة WAC
في [app-modular/js/core/03-utils-and-mappings.js:2319-2321](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/03-utils-and-mappings.js#L2319-L2321) وفي [files(11)/GoogleAppsScript_Backend.gs.txt:1835-1837](file:///Users/M1/Desktop/microtech-app/files%2811%29/GoogleAppsScript_Backend.gs.txt#L1835-L1837):
```javascript
const totalCost = (Math.max(0, oldQty) * oldCost) + (newQty * newCost);
const wacPrice = totalQty > 0 ? round4(totalCost / totalQty) : newCost;
```
حيث:
`totalQty = oldQty + newQty`

#### سيناريو الإثبات القاطع:
1. المحل يسمح بالبيع بالسالب (`allowNegativeStock = true`).
2. تم بيع 5 شاشات بالرصيد السالب: `oldQty = -5`، والتكلفة السابقة الدفترية كانت `100` ج.م.
3. وصلت فاتورة توريد جديدة بـ 10 شاشات بسعر شراء حقيقي `100` ج.م للقطعة (`newQty = 10`, `newCost = 100`).
4. المنطق الرياضي السليم: الشاشات المشتراة كلفتها 100 ج.م، تم تسليم 5 منها لتغطية العجز بالسالب، ويتبقى 5 شاشات بالمخزن بتكلفة 100 ج.م للقطعة.
5. **ماذا تحسب المعادلة الحالية؟**
   * $\text{Math.max}(0, \text{oldQty}) \times \text{oldCost} = 0 \times 100 = 0$
   * $\text{totalCost} = 0 + (10 \times 100) = 1000$ ج.م
   * $\text{totalQty} = -5 + 10 = 5$ قطع
   * $\text{wacPrice} = \frac{1000}{5} = \mathbf{200 \text{ ج.م!}}$
6. **النتيجة:** تضاعفت تكلفة الصنف المسجلة دفترياً من 100 إلى 200 ج.م تلقائياً! وإذا كان الرصيد السابق `-9`، تقفز التكلفة إلى `1000` ج.م (تضخم بـ 10 أضعاف)، مما يدمر حسابات تقييم المخزون وهوامش الأرباح اللاحقة!

---

### 3.5 مبيعات POS والدفع المجزأ والمرتجع الجزئي (POS Sales, Splits & Returns)

#### أ. انعدام اتزان قيد المبيعات المركبة (Splits Change Due)
في [15-pos-retail.js:1260-1275](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/15-pos-retail.js#L1260-L1275) و [03-utils-and-mappings.js:1986-2002](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/03-utils-and-mappings.js#L1986-L2002):
* يدفع العميل فاتورة إجماليها 200 ج.م عبر شريحتين: 100 ج.م بطاقة بنكية، و 150 ج.م نقداً (ليأخذ باقياً 50 ج.م).
* يحسب الكود: `finalChangeDue = 50`.
* يضيف الكود إلى مصفوفة `splits`:
  * شريحة البطاقة: 100 ج.م
  * شريحة النقدية: 150 ج.م (لم يخصم منها الـ 50 قرش/جنيه الباقي!).
* عند بناء قيد اليومية في `saveSaleRemote`:
  * مدين البنك 1102: 100 ج.م
  * مدين الخزينة 1101: 150 ج.م (مجموع المدين = 250 ج.م)
  * دائن الإيرادات 4102: 200 ج.م (مجموع الدائن = 200 ج.م)
* النتيجة: القيد المحاسبي مرحل بفارق عدم اتزان مقداره 50 ج.م!

#### ب. تضارب متغيرات الضريبة في معالج البيع
في [15-pos-retail.js:379](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/15-pos-retail.js#L379) تقرأ الواجهة:
`posSettings.enableTax` و `posSettings.taxRate`
بينما في داخل دالة الإتمام [15-pos-retail.js:1221](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/15-pos-retail.js#L1221) تقرأ:
`posSettings.applyTax` و `posSettings.taxPercent`
* ينتج عن هذا التضارب في التسميات عدم تطابق قيمة الضريبة المحسوبة على الشاشة مع الضريبة المنفذة فعلياً عند إتمام عملية البيع.

---

### 3.6 الصيانة والإيصالات وازدواجية المديونية (Maintenance Receipts & Debt Accounting)

#### أ. فقدان إثبات تحصيل متبقي الصيانة عند تسليم الأجهزة
* في [11a-customers-directory.js:1066](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/11a-customers-directory.js#L1066) و [10c-receipt-actions.js:2354](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/10c-receipt-actions.js#L2354):
  عند تسليم الجهاز للعميل وتحصيل المتبقي نقداً، يتم استدعاء `savePaymentRemote(r.id, remaining, ...)`، لكن المطور أغفل كتابة السطرين الحاسمين:
  ```javascript
  r.deposit = Number(r.deposit || 0) + remaining;
  r.paid = true;
  ```
  وبالتالي يتم استدعاء `saveReceiptRemote(r)` بقيمة `r.deposit` القديمة (مبلغ العربون فقط)، وتظل دالة `getReceiptRemaining(r)` تحسب المتبقي كدين قائم على العميل رغم تحصيله الفعلي!

#### ب. تضارب مفهوم `partsCost` وسعر بيع القطع vs تكلفة الشراء
* في [10d-receipt-detail.js:457](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/10d-receipt-detail.js#L457):
  ```javascript
  r.partsCost = partsSellTotal; // سعر البيع للعميل
  r.partsBuyCost = partsCostTotal; // سعر التكلفة على المحل
  ```
* في [04-chart-of-accounts.js:1462](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/04-chart-of-accounts.js#L1462):
  ```javascript
  { AccountCode: '5101', AccountName: 'تكلفة قطع الغيار', Debit: partsCost, Credit: 0 }
  { AccountCode: '1104', AccountName: 'مخزون البضائع', Debit: 0, Credit: partsCost }
  ```
* **الأثر:** قيد تكلفة قطع الغيار المسحوبة للصيانة يسجل دائن المخزون ومدين تكلفة المبيعات بسعر بيع القطعة للعميل متضمناً هامش الربح، بدلاً من سعر شرائها من المورد!

---

### 3.7 المشتريات والموردون ومرتجع الشراء (Purchases & Supplier Balances)

#### أ. إغفال مردودات الشراء من رصيد المورد الحي
في [04-chart-of-accounts.js:1158-1182](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/04-chart-of-accounts.js#L1158-L1182):
دالة `getSupplierLiveBalance(supName)` تحسب:
$$\text{Supplier Balance} = \sum \text{Purchases.Total} - \left(\sum \text{Purchases.AmountPaid} + \sum \text{Supplier Expenses}\right)$$
* الخلل: لا تطرح إطلاقاً مرتجعات الشراء المسجلة في `state.purchaseReturns`. إذا اشترى المحل بـ 10,000 ج.م ورد بضاعة معيبة للمورد بـ 3,000 ج.م على الحساب، يظل النظام يظهر أن المورد يطالب المحل بـ 10,000 ج.م كاملة.

---

### 3.8 نقدية الدرج وفروق الورديات (Shifts & Cash Drawer Variances)

#### أ. إغفال سداد الفواتير النقدية من معادلة نقدية الدرج المتوقعة
في [12-invoices-quotes.js:938-946](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/12-invoices-quotes.js#L938-L946):
```javascript
const totalCashIn = posCash + maintCash + manualDrawerIn;
const expectedCash = openingFloat + cashNet;
```
* **الخلل:** إذا سدد عميل قيمة فاتورة بيع ضريبية أو دفعة مشروع نقداً عند الكاشير بالدرج، لا تدخل في `posCash` (لأنها ليست حركة بيع POS) ولا في `maintCash` (لأنها ليست إيصال صيانة).
* **الأثر:** عند جرد الوردية وإغلاق تقرير Z، يكون الدرج الفعلي زائداً بمبلغ الفاتورة المحصلة، فيقيد النظام هذا الفارق في [12-invoices-quotes.js:1039](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/12-invoices-quotes.js#L1039) كـ "فائض نقدية غير معرّف" (دائن حساب 42 إيرادات متنوعة)، مما يؤدي إلى ازدواجية تسجيل الإيراد (مرة في الفاتورة ومرة كفائض درج مجهول).

---

### 3.9 شؤون الموظفين والسلف وسقف الائتمان ومسير الرواتب (HR Advances, Credit & Payroll)

#### أ. عدم اتزان قيد الرواتب في حالة تجاوز الاستقطاعات لراتب الموظف
في [17g-employee-advances-hr.js:355-361](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/17g-employee-advances-hr.js#L355-L361):
```javascript
const net = Math.max(0, round2(gross - penalty - advDeduct - purDeduct));
totalGross += gross;
totalPenalties += penalty;
totalAdvancesDeducted += advDeduct;
totalPurchasesDeducted += purDeduct;
totalNetPaid += net;
```
وفي [09-finance-engine.js:884-932](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/09-finance-engine.js#L884-L932):
* مدين: `5203` (رواتب) بمبلغ `totalGross`.
* دائن: `1106` (سلف) بـ `totalAdvancesDeducted`.
* دائن: `1107` (مشتريات آجل) بـ `totalPurchasesDeducted`.
* دائن: `4201` (جزاءات) بـ `totalPenalties`.
* دائن: `1101` (الخزينة) بـ `totalNetPaid`.

#### معادلة التوازن المحاسبي:
$$\text{Total Debit} = \text{totalGross}$$
$$\text{Total Credit} = \text{totalAdvances} + \text{totalPurchases} + \text{totalPenalties} + \text{totalNetPaid}$$
* إذا كان $\text{Deductions} > \text{Gross}$، فإن $\text{totalNetPaid} = 0$.
* وبالتالي يصبح $\text{Total Credit} > \text{Total Debit}$ حتماً!
* **مثال واقعي:** موظف راتبه 2000 ج.م، وعليه قسط سلفة 1500 ج.م ومشتريات آجل 1000 ج.م:
  * الصافي المستلم: 0 ج.م.
  * طرف المدين (5203): 2000 ج.م.
  * طرف الدائن (1106 + 1107): 2500 ج.م.
  * القيد غير متزن بمقدار 500 ج.م!

#### ب. استرجاع مشتريات الموظف الآجلة يقيد في حساب العملاء
في [15-pos-retail.js:2608-2624](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/15-pos-retail.js#L2608-L2624):
عند إرجاع صنف اشتراه موظف بالآجل على حسابه، يتم توجيه الدائن إلى الحساب `1103` (العملاء والمدينون) بدلاً من الحساب `1107` (مشتريات الموظفين بالآجل)، كما لا يتم تسجيل أي دفعة استرداد في جدول سداد الموظفين `state.employeeAdvanceRepayments`، فيظل سقف ائتمان الموظف معلقاً ويخصم المبلغ من راتبه في نهاية الشهر رغم إرجاع البضاعة!

---

## 4. فحص الحالات الحدية (Boundary & Edge Case Analysis)

تم إجراء فحص برمجي ومحاسبي شامل للحالات الحدية الشاذة، وفيما يلي النتائج التفصيلية:

| الحالة الحدية | الموقع المصدري | السلوك الحالي للنظام | النتيجة والتقييم |
| :--- | :--- | :--- | :--- |
| **القسمة على صفر (Zero Revenue in Margin)** | [09-finance-engine.js:176, 187](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/09-finance-engine.js#L176) | الدالة تفحص `rev > 0 ? (profit/rev)*100 : 0`. | **محمية آمنة:** لا ينتج عنها `NaN` أو `Infinity`. |
| **القسمة على صفر (Zero Installment Amount)** | [17g-employee-advances-hr.js:90-91](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/17g-employee-advances-hr.js#L90-L91) | `instAmt = round2(installmentAmount) > 0 ? round2(installmentAmount) : numAmt;`<br>`Math.ceil(numAmt / instAmt)` | **ثغرة محتملة:** إذا كان `numAmt = 0` و `installmentAmount = 0`، ينتج `0 / 0 = NaN`. |
| **خصم 100% على الفاتورة (Full Discount)** | [09-finance-engine.js:134-136](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/09-finance-engine.js#L134-L136) | `discountedSubtotal = Math.max(0, round2(subtotal - discount))`<br>`vatAmount = round2(discountedSubtotal * taxRate)` | **محمية آمنة:** تصبح القاعدة الخاضعة للضريبة `0`، وضريبة القيمة المضافة `0`، والإجمالي مساوياً لمصاريف الشحن فقط. |
| **تجاوز الخصم لقيمة الفاتورة (Discount > Subtotal)** | [03-utils-and-mappings.js:128](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/03-utils-and-mappings.js#L128)<br>[09-finance-engine.js:134](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/09-finance-engine.js#L134) | في `03-utils` يحصر الخصم: `Math.min(subtotal, discount)`.<br>في `09-finance`: يعيد `discount` الأصلي ولكن يحصر `discountedSubtotal` عند الصفر. | **تباين جزئي:** لا ينتج عنه إجمالي سالب، لكنه يظهر في تقرير الفاتورة كخصم يتجاوز قيمتها. |
| **المبالغ النقدية الضخمة جداً ($> 10^{14}$)** | [09-finance-engine.js:48-59](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/09-finance-engine.js#L48-L59) | يعتمد معيار IEEE 754 بدقة آمنة حتى `Number.MAX_SAFE_INTEGER` ($9 \times 10^{15}$). | **آمنة عملياً:** المبالغ النقدية بالجنيه المصري تقع بأمان تام دون تجاوز حد الدقة. |
| **الكسور الميكروية للأصناف (0.001 كجم)** | [09-finance-engine.js:129-132](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/09-finance-engine.js#L129-L132) | كمية `0.005` بسعر `10` تعطي `0.05` ج.م وتقرب بأمان بـ `round2`. | **آمنة.** |
| **الرصيد المخزني السالب عند الشراء** | [03-utils-and-mappings.js:2319](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/03-utils-and-mappings.js#L2319) | تضاعف وتضخم مصطنع لتكلفة الوحدة (WAC Inflation). | **ثغرة حرجة (Critical Vulnerability #2).** |
| **المرتجع الجزئي بدون وجود سجل للمرتجعات** | [12-invoices-quotes.js:923-930](file:///Users/M1/Desktop/microtech-app/app-modular/js/modules/12-invoices-quotes.js#L923-L930) | يُخصم كامل مبلغ الفاتورة بدلاً من قيمة القطع المرتجعة فعلياً. | **ثغرة منخفضة (Finding #17).** |

---

## 5. تدقيق الاختبارات الحالية وأمثلة الحقيقة الأرضية المقارنة (Test Suites Audit & Ground Truth Benchmarks)

### أ. تقييم أجنحة الاختبارات الآلية الحالية
يحتوي المشروع على 4 ملفات اختبار مالية رئيسية في مجلد `tests/`:

1. **`tests/money.test.js` (13 فحصاً ناجحاً):**
   * يغطي: `round2`، `parseMoney`، `formatMoney`، `sumMoney`.
   * **أوجه القصور المرصودة:** لم يختبر إطلاقاً حالات الأرقام السالبة متساوية البعد مثل `round2(-1.005)` أو `round2(-35.555)`. لو تم تضمينها لفشل الاختبار فوراً وكشف الخلل الحرج رقم 1. كذلك لم يختبر الأرقام المحاسبية بين قوسين `(500)`.

2. **`tests/vat.test.js` (11 فحصاً ناجحاً):**
   * يغطي: `calculateExclusiveVAT`، `extractInclusiveVAT`، `calculateInvoiceTotals`، `calculateVATReturn`.
   * **أوجه القصور المرصودة:** يختبر فقط أرقاماً متناسقة خالية من قروش المنتصف، ولا يختبر الفواتير الشاملة للضريبة مع بنود متعددة، ولا يختبر إرجاع السلع الخاضعة للضريبة.

3. **`tests/cogs.test.js` (8 فحوص ناجحة):**
   * يغطي: `calculateGrossProfit`، `calculateNetProfit`، `calculateInventoryValuation`.
   * **أوجه القصور المرصودة:** **لا يحتوي على أي اختبار لخوارزمية المتوسط المرجح للتكلفة (WAC)!** تم إهمال اختبار WAC تماماً، وهو ما سمح بمرور الثغرة الحرجة لتضاعف التكلفة عند المخزون السالب دون اكتشاف.

4. **`tests/hr-advances.test.js` (9 فحوص ناجحة):**
   * يغطي: حساب سقف ائتمان الموظف، توازن قيود السلف وصرفها وسدادها، ومسير الرواتب.
   * **أوجه القصور المرصودة:** بيانات الاختبار وضعت رواتب ضخمة تغطي الاستقطاعات بضعفين، ولم تختبر سيناريو تجاوز الاستقطاعات لراتب الموظف المسبب لعدم اتزان القيد.

---

### ب. أمثلة حسابية يدوية معيارية كمعايير مقارنة (Ground Truth Benchmarks)

تُعتمد الأمثلة الحسابية التالية كمرجع معياري (Ground Truth) لبرمجة وتوسيع اختبارات الوحدة:

#### 1. المعيار المرجعي لضريبة القيمة المضافة (14% VAT Benchmark)
* **الحالة:** بيع 3 قطع بسعر شامل للضريبة قدره `100.00` ج.م للقطعة، مع خصم تجاري `10%` ومصاريف شحن `25.00` ج.م (غير خاضعة للضريبة):
  * إجمالي البنود الشامل: $3 \times 100.00 = 300.00$ ج.م
  * قيمة الخصم (10%): $300.00 \times 0.10 = 30.00$ ج.م
  * الإجمالي الشامل بعد الخصم: $300.00 - 30.00 = 270.00$ ج.م
  * صافي القيمة قبل الضريبة: $\frac{270.00}{1.14} = 236.8421... \xrightarrow{\text{round2}} \mathbf{236.84 \text{ ج.م}}$
  * ضريبة القيمة المضافة (14%): $270.00 - 236.84 = \mathbf{33.16 \text{ ج.م}}$
  * مصاريف الشحن: $\mathbf{25.00 \text{ ج.م}}$
  * الإجمالي النهائي المستحق: $270.00 + 25.00 = \mathbf{295.00 \text{ ج.م}}$
  * **فحص القيد المزدوج:**
    * مدين: الصندوق/العملاء (1101/1103) = $295.00$ ج.م
    * دائن: إيرادات المبيعات (4102) = $236.84$ ج.م
    * دائن: ضريبة القيمة المضافة مخرجات (2104) = $33.16$ ج.م
    * دائن: إيرادات شحن وخدمات (4201) = $25.00$ ج.م
    * مجموع المدين ($295.00$) = مجموع الدائن ($295.00$) $\checkmark$

#### 2. المعيار المرجعي لتقييم المخزون والمتوسط المرجح (WAC Benchmark)
* **الحالة (تغطية المخزون السالب):**
  * الرصيد الدفتري الحالي: $-4$ قطع بتكلفة سابقة `50.00` ج.م.
  * فاتورة شراء جديدة: $10$ قطع بسعر `80.00` ج.م للقطعة.
  * الرصيد المتبقي الفعلي: $-4 + 10 = 6$ قطع.
  * **الحقيقة الحسابية الصحيحة:** القطع الـ 6 المتبقية تم شراؤها بسعر `80.00` ج.م، وبالتالي فإن التكلفة المرجحة للوحدة الجديدة يجب أن تكون **`80.00` ج.م**. (النظام الحالي يحسبها خطأً: $\frac{10 \times 80}{6} = \mathbf{133.33 \text{ ج.م}}$!).

* **الحالة (متوسط مرجح موجب عادي):**
  * رصيد سابق: $10$ قطع بسعر `50.00` ج.م (إجمالي القيمة = `500.00` ج.م).
  * شراء جديد: $20$ قطعة بسعر `65.00` ج.م (إجمالي القيمة = `1300.00` ج.م).
  * إجمالي الكمية: $30$ قطعة.
  * إجمالي التكلفة: $500.00 + 1300.00 = 1800.00$ ج.م.
  * التكلفة المرجحة الجديدة للقطعة: $\frac{1800.00}{30} = \mathbf{60.0000 \text{ ج.م}}$ $\checkmark$

#### 3. المعيار المرجعي لمسير الرواتب المقيد بالاستقطاعات (Payroll Limit Benchmark)
* **الحالة:** موظف راتبه الأساسي `4000.00` ج.م، ومكافأة `500.00` ج.م (إجمالي الاستحقاق = `4500.00` ج.م).
* استقطاعات مطلوبة:
  * جزاءات غياب: `300.00` ج.م
  * قسط سلفة: `3500.00` ج.م
  * مشتريات آجل سابقة: `1200.00` ج.م
  * مجموع الاستقطاعات النظرية: $300 + 3500 + 1200 = 5000.00$ ج.م (تتجاوز الراتب بـ `500.00` ج.م).
* **المعالجة المحاسبية القياسية السليمة:**
  * يقتطع من الراتب حتى الصفر فقط ($4500.00$ ج.م كحد أقصى).
  * أولوية الاستقطاع: الجزاءات أولاً ($300.00$)، ثم السلفة ثانياً ($3500.00$)، ثم المتبقي لمشتريات الآجل ($700.00$ من أصل $1200.00$).
  * الدين المتبقي غير المحصل للمشتريات ($500.00$ ج.م) يظل قائماً في حساب الموظف 1107 ولا يقيد دفترياً في مسير هذا الشهر.
  * **قيد اليومية المتزن:**
    * مدين: رواتب ومكافآت (5203) = $4500.00$ ج.م
    * دائن: جزاءات وغرامات (4201) = $300.00$ ج.م
    * دائن: سلف الموظفين (1106) = $3500.00$ ج.م
    * دائن: مشتريات الموظفين (1107) = $700.00$ ج.م
    * دائن: الخزينة (1101) = $0.00$ ج.م (الصافي المستلم)
    * مجموع المدين ($4500.00$) = مجموع الدائن ($4500.00$) $\checkmark$

---

## 6. التوصيات وخطة العمل التصحيحية (Actionable Recommendations)

بناءً على نتائج التدقيق المالي الشامل، نوصي بتنفيذ الإجراءات التصحيحية التالية مرتبة حسب الأولوية القصوى:

### أ. إجراءات عاجلة وفورية (P0 - Critical Actions):
1. **تصحيح دالة التقريب الأساسية `round2` في [09-finance-engine.js:64](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/09-finance-engine.js#L64):**
   اعتماد معادلة التقريب المتماثل للإشارة:
   ```javascript
   function round2(num) {
     const n = parseMoney(num);
     const sign = n < 0 ? -1 : 1;
     const r = sign * (Math.round((Math.abs(n) + Number.EPSILON) * 100) / 100);
     return r === 0 ? 0 : r;
   }
   ```
2. **تصحيح معادلة المتوسط المرجح للتكلفة (WAC) في الواجهة والباك إند:**
   تعديل الكود في [03-utils-and-mappings.js:2319](file:///Users/M1/Desktop/microtech-app/app-modular/js/core/03-utils-and-mappings.js#L2319) و [Backend:1836](file:///Users/M1/Desktop/microtech-app/files%2811%29/GoogleAppsScript_Backend.gs.txt#L1836):
   ```javascript
   if (oldQty <= 0) {
     invItem.PurchasePrice = newCost;
   } else {
     invItem.PurchasePrice = round4(((oldQty * oldCost) + (newQty * newCost)) / (oldQty + newQty));
   }
   ```
3. **ضبط اتزان قيود الدفع المجزأ (POS Splits):**
   خصم قيمة `finalChangeDue` من الشريحة النقدية في مصفوفة `splits` داخل دالة `processSale()` قبل ترحيل القيد لضمان $\sum \text{Splits} \equiv \text{GrandTotal}$.
4. **عكس ضرائب المبيعات والمشتريات في قيود المرتجعات:**
   تضمين عكس حساب `2104` في مردودات المبيعات وعكس حساب `1105` في مردودات المشتريات.
5. **وضع سقف لاستقطاعات الرواتب في مسير العاملين:**
   حصر إجمالي الاستقطاعات عند سقف الاستحقاق الإجمالي وترحيل الفائض، لضمان توازن القيد المركب للرواتب بنسبة 100%.

### ب. إجراءات التحسين المعماري والرقابي (P1 - Architectural Enhancements):
1. **توحيد دالة احتساب الفواتير:**
   دمج `computeDocTotals` و `calculateInvoiceTotals` في دالة موحدة شاملة تدعم الضرائب غير الشاملة والشاملة والخصومات المئوية والشحن ومطابقة القيد.
2. **إلزامية استخدام `round2`:**
   منع استخدام `Math.round(...)` المجردة في حسابات النسب المئوية في موديول POS واستبدالها حصراً بـ `round2`.
3. **توسيع جناح الاختبارات الآلية (Vitest):**
   إضافة ملف اختبارات جديد `tests/wac.test.js` وتوسيع `tests/money.test.js` و `tests/hr-advances.test.js` بالحالات الحدية المقترحة في هذا التقرير لضمان منع أي ارتداد مستقبلي (Regression Prevention).

---
*تم إعداد هذا التقرير الحسابي بواسطة وكيل تدقيق الحسابات والعمليات المالية (Calculations Auditor) وفق أعلى معايير التدقيق المحاسبي والرياضي.*
