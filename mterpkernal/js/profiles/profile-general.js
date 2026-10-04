/* ---------------- Profile: General Trading & Distribution (التجارة العامة والتوزيع) ---------------- */
registerActivityProfile({
  id: 'general',
  name: 'التجارة العامة ونقاط البيع والتوزيع',
  icon: '🏢',
  desc: 'القالب القياسي الشامل: مناسب للشركات، المتاجر الكبرى، والمؤسسات التجارية التي تدير مبيعات، مخازن، خزينة، عملاء وموردين.',
  primaryColor: '#059669',
  activeSections: ['pos', 'invoices', 'inventory', 'cashdrawer', 'daily', 'finance', 'staff', 'customers', 'suppliers', 'barcode', 'audit', 'users', 'settings'],
  terms: {
    staffLabel: 'فريق المبيعات والموظفين',
    staffSingle: 'موظف مبيعات',
    itemLabel: 'المنتج / السلعة',
    ticketLabel: 'طلب بيع / فاتورة',
    ticketAction: 'فاتورة جديدة',
    customerLabel: 'العميل',
    supplierLabel: 'المورد',
    categoryLabel: 'قسم المنتجات',
    warehouseLabel: 'المستودع / المخزن'
  },
  defaultCategories: ['سلع رئيسية', 'بضائع ومواد', 'مستلزمات عامة', 'خدمات تجارية'],
  quickServices: [
    { name: 'خدمة توصيل ونقل', price: 40, icon: '🚚' },
    { name: 'تغليف وتعبئة مخصصة', price: 20, icon: '📦' },
    { name: 'عمولة وكالة / خدمة', price: 50, icon: '🤝' }
  ],
  waTemplates: {
    invoice: 'مرحبًا {customer_name} 👋\nشكرًا لتعاملكم مع {shop_name}.\nإجمالي الفاتورة: *{total} ج.م*\nالمتبقي: *{remaining} ج.م*\nنسعد دائماً بخدمتكم! ✨',
    quote: 'مرحبًا {customer_name} 👋\nنرفق لكم عرض الأسعار الرسمي من {shop_name}.\nإجمالي العرض: *{total} ج.م*\nصالح لمدة 14 يوماً من تاريخه.',
    payment_receipt: 'مرحبًا {customer_name} 👋\nتم استلام دفعة بقيمة *{amount} ج.م* لحسابكم لدى {shop_name}.\nرصيدكم الحالي: *{balance} ج.م*.'
  }
});
