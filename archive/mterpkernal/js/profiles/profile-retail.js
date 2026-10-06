/* ---------------- Profile: Retail, Supermarket & Apparel (التجزئة والسوبرماركت) ---------------- */
registerActivityProfile({
  id: 'retail',
  name: 'محلات التجزئة والسوبرماركت والملابس',
  icon: '🛒',
  desc: 'مخصص للمحلات الاستهلاكية، محلات الملابس، العطور، السوبرماركت، والمكتبات التي تعتمد على الكاشير السريع وقراءة الباركود.',
  primaryColor: '#10b981',
  activeSections: ['pos', 'invoices', 'inventory', 'cashdrawer', 'daily', 'finance', 'staff', 'customers', 'suppliers', 'barcode', 'audit', 'users', 'settings'],
  terms: {
    staffLabel: 'فريق الكاشير والمبيعات',
    staffSingle: 'كاشير',
    itemLabel: 'السلعة / الصنف',
    ticketLabel: 'فاتورة كاشير',
    ticketAction: 'عملية بيع سريعة ⚡',
    customerLabel: 'الزبون / العميل',
    supplierLabel: 'شركة التوريد والموزع',
    categoryLabel: 'القسم / الرف',
    warehouseLabel: 'مخزن المحل الرئيسي'
  },
  defaultCategories: ['أغذية ومشروبات', 'منظفات وعناية', 'ملابس وأحذية', 'معلبات ومجمدات', 'أدوات واكسسوارات'],
  quickServices: [
    { name: 'كيس تسوق قماشي', price: 10, icon: '🛍️' },
    { name: 'خدمة دليفري وتوصيل', price: 25, icon: '🛵' },
    { name: 'تغليف هدايا مجاني', price: 0, icon: '🎀' }
  ],
  waTemplates: {
    invoice: 'مرحبًا {customer_name} 👋\nشكرًا لتسوقك من {shop_name}!\nإجمالي فاتورتك: *{total} ج.م*\nالمتبقي: *{remaining} ج.م*\nنتمنى لك يوماً سعيداً ويسعدنا تكرار زيارتكم 🌸'
  }
});
