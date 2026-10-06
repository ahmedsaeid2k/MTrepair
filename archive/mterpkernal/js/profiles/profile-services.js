/* ---------------- Profile: Professional Services & Contracting (المقاولات والخدمات والمشاريع) ---------------- */
registerActivityProfile({
  id: 'services',
  name: 'المقاولات والخدمات والمهن الحرة والمشاريع',
  icon: '📋',
  desc: 'مخصص للمكاتب الاستشارية، شركات المقاولات، أعمال الديكور والتشطيب، كاميرات المراقبة والشبكات، ومكاتب الخدمات التي تعتمد على عروض الأسعار والمستخلصات.',
  primaryColor: '#8b5cf6',
  activeSections: ['invoices', 'inventory', 'cashdrawer', 'daily', 'finance', 'staff', 'customers', 'suppliers', 'audit', 'users', 'settings'],
  terms: {
    staffLabel: 'فريق المهندسين والمشرفين والفنيين',
    staffSingle: 'مهندس / مشرف مشروع',
    itemLabel: 'بند التوريد / المادة / الخدمة',
    ticketLabel: 'عرض سعر / مقايسة مشروع',
    ticketAction: 'مشروع / مقايسة جديدة 📑',
    customerLabel: 'صاحب المشروع / العميل',
    supplierLabel: 'مورد الخامات ومقاول الباطن',
    categoryLabel: 'تصنيف بنود الأعمال',
    warehouseLabel: 'مستودع الخامات والمعدات'
  },
  defaultCategories: ['أعمال توريد وتركيب', 'مهمات ومعدات رئيسية', 'أجور مصنعيات وتنفيذ', 'خدمات استشارية ودراسات', 'عقود صيانة وتشغيل'],
  quickServices: [
    { name: 'معاينة ورفع مقاسات بالموقع', price: 200, icon: '📐' },
    { name: 'إعداد مقايسة فنية مفصلة', price: 300, icon: '📑' },
    { name: 'زيارة دعم فني وصيانة طارئة', price: 250, icon: '⚡' }
  ],
  waTemplates: {
    invoice: 'مرحبًا {customer_name} 👋\nنرفق لكم مستخلص / فاتورة تنفيذ الأعمال عن مشروعكم لدى {shop_name}.\nإجمالي القيمة: *{total} ج.م*\nالمتبقي المطلوب: *{remaining} ج.م*.',
    quote: 'مرحبًا {customer_name} 👋\nنرفق لكم المقايسة الفنية والمالية المعتمدة لمشروعكم من {shop_name}.\nإجمالي قيمة البنود: *{total} ج.م*.\nيشرفنا التعاون معكم دائماً.'
  }
});
