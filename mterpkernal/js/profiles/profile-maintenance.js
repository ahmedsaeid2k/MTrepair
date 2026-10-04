/* ---------------- Profile: Maintenance & Service Centers (مراكز الصيانة وورش الإصلاح) ---------------- */
registerActivityProfile({
  id: 'maintenance',
  name: 'مراكز الصيانة والورش الفنية وخدمات ما بعد البيع',
  icon: '🛠️',
  desc: 'مخصص لمراكز صيانة الأجهزة الإلكترونية، الحواسيب، الهواتف، السيارات، والأجهزة المنزلية مع تتبع أوامر الشغل والفحص.',
  primaryColor: '#007AFF',
  activeSections: ['tickets', 'pos', 'invoices', 'inventory', 'cashdrawer', 'daily', 'finance', 'staff', 'customers', 'suppliers', 'barcode', 'audit', 'users', 'settings'],
  terms: {
    staffLabel: 'فريق الفنيين والمهندسين',
    staffSingle: 'فني صيانة',
    itemLabel: 'قطعة غيار / ملحق',
    ticketLabel: 'إيصال صيانة وجهاز',
    ticketAction: 'استلام جهاز صيانة ➕',
    customerLabel: 'صاحب الجهاز / العميل',
    supplierLabel: 'مورد قطع الغيار',
    categoryLabel: 'نوع الجهاز',
    warehouseLabel: 'مخزن قطع الغيار'
  },
  defaultCategories: ['لابتوب وكمبيوتر', 'موبايل وتابلت', 'شاشات وطابعات', 'أجهزة إلكترونية', 'قطع غيار مستوردة'],
  quickServices: [
    { name: 'فحص وكشف أعطال سريع', price: 100, icon: '🔍' },
    { name: 'تنزيل سوفتوير وبرمجة', price: 150, icon: '💻' },
    { name: 'تنظيف وتغيير معجون حراري', price: 120, icon: '💨' },
    { name: 'تركيب حماية وشاشة', price: 60, icon: '🛡️' }
  ],
  waTemplates: {
    invoice: 'مرحبًا {customer_name} 👋\nتم إصدار فاتورة صيانة/مبيعات بمبلغ *{total} ج.م* لدى {shop_name}.\nيسري الضمان المعتمد على القطع المستبدلة.',
    quote: 'مرحبًا {customer_name} 👋\nتقرير ومقايسة تكلفة الصيانة لجهازكم لدى {shop_name}: *{total} ج.م*.\nيرجى الرد بتأكيد الموافقة لبدء الإصلاح.',
    ticket_status: 'مرحبًا {customer_name} 👋\nجهازكم المسجل بإيصال رقم {receipt_no} أصبح بحالة ({status}) لدى {shop_name}.\nالمتبقي المطلوب: {remaining} ج.م.'
  }
});
