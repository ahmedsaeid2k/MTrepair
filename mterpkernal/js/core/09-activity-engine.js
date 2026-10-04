/* ---------------- mterp Kernel: Activity Adapter Engine (محرك مهايئة وتخصيص الأنشطة) ---------------- */

const ACTIVITY_REGISTRY = new Map();

/**
 * تسجيل قالب نشاط في النظام
 */
function registerActivityProfile(profile) {
  if (!profile || !profile.id) {
    console.error('Invalid activity profile:', profile);
    return;
  }
  ACTIVITY_REGISTRY.set(profile.id, profile);
}

/**
 * جلب جميع الأنشطة المسجلة
 */
function getAllProfiles() {
  return Array.from(ACTIVITY_REGISTRY.values());
}

/**
 * معرف النشاط النشط حالياً
 */
function getActiveProfileId() {
  if (state.settings && state.settings.activeProfile) {
    return state.settings.activeProfile;
  }
  return state.activeProfile || 'general';
}

/**
 * كائن النشاط النشط حالياً مع توفير القيم الاحتياطية
 */
function getActiveProfile() {
  const currentId = getActiveProfileId();
  if (ACTIVITY_REGISTRY.has(currentId)) {
    return ACTIVITY_REGISTRY.get(currentId);
  }
  // إذا لم يتم العثور على القالب، نرجع القالب العام
  if (ACTIVITY_REGISTRY.has('general')) {
    return ACTIVITY_REGISTRY.get('general');
  }
  // قالب احتياطي طارئ
  return {
    id: 'general',
    name: 'النشاط التجاري العام',
    icon: '🏢',
    desc: 'إدارة المبيعات، المخازن، الحسابات، والعملاء',
    activeSections: ['pos', 'inventory', 'cashdrawer', 'invoices', 'customers', 'suppliers', 'staff', 'daily', 'finance', 'barcode', 'audit', 'users', 'settings'],
    terms: {
      staffLabel: 'فريق العمل والموظفين',
      itemLabel: 'السلعة / المنتج',
      ticketLabel: 'الطلب / الفاتورة',
      ticketAction: 'إصدار جديد',
      customerLabel: 'العميل'
    }
  };
}

/**
 * ترجمة مصطلح حسب النشاط الحالي
 * مثال: getTerm('staffLabel', 'الموظفون')
 */
function getTerm(termKey, fallback = '') {
  const profile = getActiveProfile();
  if (profile && profile.terms && profile.terms[termKey]) {
    return profile.terms[termKey];
  }
  return fallback;
}

/**
 * التحقق هل القسم مفعل في النشاط الحالي
 */
function isSectionActiveInProfile(secId) {
  // الأقسام الإدارية والرقابة والضبط متاحة دائماً للأدمن
  if (['settings', 'users', 'audit'].includes(secId)) return true;
  
  const profile = getActiveProfile();
  if (!profile || !Array.isArray(profile.activeSections)) return true;
  return profile.activeSections.includes(secId);
}

/**
 * التبديل بين الأنشطة ديناميكياً مع خيار تطبيق إعدادات النشاط المقترحة
 */
async function switchActivityProfile(profileId, applyDefaults = false) {
  if (!ACTIVITY_REGISTRY.has(profileId)) {
    showToast(`القالب المطلوب (${profileId}) غير مسجل في النظام`, 'error');
    return false;
  }

  const profile = ACTIVITY_REGISTRY.get(profileId);
  state.activeProfile = profileId;
  if (!state.settings) state.settings = {};
  state.settings.activeProfile = profileId;

  if (applyDefaults) {
    if (profile.defaultCategories && profile.defaultCategories.length) {
      state.settings.categories = [...profile.defaultCategories];
    }
    if (profile.quickServices && profile.quickServices.length) {
      if (!state.settings.pos) state.settings.pos = {};
      state.settings.pos.quickServices = JSON.parse(JSON.stringify(profile.quickServices));
    }
    if (profile.waTemplates) {
      state.settings.waTemplates = { ...(state.settings.waTemplates || {}), ...profile.waTemplates };
    }
    if (profile.primaryColor) {
      state.settings.primaryColor = profile.primaryColor;
      applyThemeAndAppearance();
    }
  }

  // حفظ في التخزين المحلي
  setCache('active_profile', profileId);
  setCache('settings', state.settings);
  try {
    localStorage.setItem(STORAGE_PREFIX + 'active_profile', profileId);
  } catch(e){}

  recordAuditLog('تغيير نشاط المنشأة', 'النظام والإعدادات', `تم تحويل نشاط النظام إلى: (${profile.name}) ${profile.icon}`, profileId);
  showToast(`✅ تم تبديل نشاط النظام بنجاح إلى: ${profile.name} ${profile.icon}`, 'success');

  // إعادة ضبط القسم النشط إذا كان القسم القديم غير متوفر في النشاط الجديد
  if (state.currentSection && !isSectionActiveInProfile(state.currentSection)) {
    state.currentSection = null;
  }

  render();
  return true;
}

/**
 * جلب الخدمات السريعة المتوافقة مع النشاط الحالي
 */
function getProfileQuickServices() {
  if (state.settings && state.settings.pos && Array.isArray(state.settings.pos.quickServices) && state.settings.pos.quickServices.length) {
    return state.settings.pos.quickServices;
  }
  const profile = getActiveProfile();
  return (profile && profile.quickServices) || [];
}

/**
 * جلب التصنيفات المقترحة للنشاط الحالي
 */
function getProfileCategories() {
  if (state.settings && Array.isArray(state.settings.categories) && state.settings.categories.length) {
    return state.settings.categories;
  }
  const profile = getActiveProfile();
  return (profile && profile.defaultCategories) || ['عام', 'بضائع', 'خدمات'];
}
