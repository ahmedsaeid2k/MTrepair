/* ---------------- Profile: Restaurants & Cafes (المطاعم والكافيهات) ---------------- */
registerActivityProfile({
  id: 'restaurant',
  name: 'المطاعم والكافيهات والوجبات السريعة',
  icon: '☕',
  desc: 'مخصص للمطاعم، الكافيهات، شاحنات الأغذية، ومحلات الحلويات والعصائر مع بونات سريعة ومخزون المكونات.',
  primaryColor: '#d97706',
  activeSections: ['pos', 'invoices', 'inventory', 'cashdrawer', 'daily', 'finance', 'staff', 'customers', 'suppliers', 'audit', 'users', 'settings'],
  terms: {
    staffLabel: 'كباتن الصالة والكاشير والشيفات',
    staffSingle: 'كابتن صالة / كاشير',
    itemLabel: 'الوجبة / الصنف / المشروب',
    ticketLabel: 'بون طلب / فاتورة مائدة',
    ticketAction: 'طلب مائدة / سفري جديد 🍽️',
    customerLabel: 'الزبون / الطاولة',
    supplierLabel: 'مورد المواد الخام والأغذية',
    categoryLabel: 'قسم المنيو (Menu)',
    warehouseLabel: 'مخزن المكونات والمواد الخام'
  },
  defaultCategories: ['وجبات رئيسية', 'ساندوتشات سريعة', 'مشروبات ساخنة', 'عصائر وبارد', 'حلويات ومقبلات'],
  quickServices: [
    { name: 'خدمة دليفري وتوصيل', price: 20, icon: '🛵' },
    { name: 'إضافات ومقبلات خاصة', price: 15, icon: '🍟' },
    { name: 'تغليف سفري إضافي', price: 5, icon: '🥡' }
  ],
  waTemplates: {
    invoice: 'مرحبًا {customer_name} 👋\nشكرًا لزيارتك {shop_name}!\nإجمالي الفاتورة: *{total} ج.م*\nألف هنا وعافية، ونتطلع لخدمتكم دائماً ☕✨'
  }
});
