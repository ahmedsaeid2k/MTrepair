/* ---------------- State ---------------- */
let state = {
  user: null,
  sessionToken: null,
  tab: 'dashboard',
  settingsTab: 'appearance',
  posTab: 'sell',
  posState: {
    activeCategory: 'all',
    searchQuery: '',
    paymentMethod: 'cash',
    amountPaid: '',
    discountType: 'fixed',
    discountValue: 0,
    customerName: 'عميل زائر',
    customerPhone: '',
    notes: ''
  },
  users: getCache('users', DEFAULT_USERS),
  receipts: getCache('receipts', []),
  customers: getCache('customers', []),
  technicians: getCache('technicians', ['أحمد فتحي','محمود سيد','كريم عادل']),
  expenses: getCache('expenses', []),
  accounts: getCache('accounts', DEFAULT_ACCOUNTS),
  journalEntries: getCache('journal', []),
  invoices: getCache('invoices', []),
  formStep: 0,
  draft: null,
  maintenanceViewMode: (function(){ try{ return localStorage.getItem('microerp_maint_view_mode') || 'table'; }catch(e){ return 'table'; } })(),
  archiveFilter: {q:'', status:'', tech:'', group:'all'},
  selectedReceiptId: null,
  selectedReceiptNum: null,
  selectedReceiptIds: [],
  settings: getCache('settings', {
    shopName: 'صيانة ميكروتك',
    logoUrl: '',
    shopPhone: '',
    shopWhatsapp: '',
    shopAddress: '',
    shopTaxNumber: '',
    printFooterText: 'شكراً لتعاملكم معنا • نسعد دائماً بخدمتكم',
    primaryColor: '#059669',
    fontSize: 'normal',
    brands: DEFAULT_BRANDS,
    commonFaults: DEFAULT_COMMON_FAULTS,
    terms: DEFAULT_TERMS,
    invoiceTerms: DEFAULT_INVOICE_TERMS,
    quoteTerms: DEFAULT_QUOTE_TERMS,
    quoteAgreementTerms: DEFAULT_QUOTE_AGREEMENT_TERMS,
    waTemplates: DEFAULT_WA_TEMPLATES,
    defaultInspectionFee: 100,
    defaultEstimateTime: 'خلال 24-48 ساعة',
    defaultWarranty: '3 شهور ضد عيوب الصناعة',
    pos: DEFAULT_POS_SETTINGS,
    printers: DEFAULT_PRINTERS_SETTINGS,
    gemini: DEFAULT_GEMINI_SETTINGS
  }),
  payments: getCache('payments', []),
  inventory: getCache('inventory', []),
  sales: getCache('sales', []),
  quotations: getCache('quotations', []),
  cctvSites: getCache('cctv_sites', []),
  cctvProjects: getCache('cctv_projects', []),
  cctvDevices: getCache('cctv_devices', []),
  cctvVisits: getCache('cctv_visits', []),
  cctvContracts: getCache('cctv_contracts', []),
  cctvMilestones: getCache('cctv_milestones', []),
  cctvTab: 'projects',
  camTab: 'projects',
  services: getCache('services', []),
  purchases: getCache('purchases', []),
  purchaseReturns: getCache('purchase_returns', []),
  suppliers: getCache('suppliers', []),
  serials: getCache('serials', []),
  bundleItems: getCache('bundle_items', []),
  stocktakeSessions: getCache('stocktake_sessions', []),
  stocktakeLines: getCache('stocktake_lines', []),
  invHubTab: 'all',
  shifts: getCache('shifts', []),
  activeShift: getCache('activeShift', null),
  currentSection: null,
  cart: [],
  quoCart: [],
  barcodeTab: 'inventory',
  barcodeStudio: getCache('barcode_studio', {
    mode: 'inventory',
    selectedItemId: null,
    selectedReceiptId: null,
    customTitle: '',
    customSubtitle: '',
    customPrice: '',
    customBarcode: '',
    copies: 1,
    preset: 'thermal_40x20',
    customWidth: 40,
    customHeight: 20,
    barcodeType: 'CODE128',
    showShopName: true,
    showItemName: true,
    showPrice: true,
    showBarcodeText: true,
    showDate: false
  }),
  auditLogs: getCache('audit_logs', []),
  authRequests: getCache('auth_requests', []),
  auditTab: 'logs',
  auditUserFilter: 'all',
  auditActionFilter: 'all',
  auditDateFilter: 'all',
  auditSearchQ: '',
  warehouses: getCache('warehouses', ['المخزن الرئيسي', 'مخزن المعرض / المحل', 'مخزن قطع الغيار']),
  warehouseTransfers: getCache('warehouse_transfers', []),
  selectedWarehouseFilter: 'all',
  theme: (function(){ try{ return localStorage.getItem('microerp_theme') || 'light'; }catch(e){ return 'light'; } })()
};
window.state = state;
window.render = function(...args){ if(typeof render === 'function') return render(...args); };

function applyThemeAndAppearance(){
  const t = state.theme || 'light';
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('microerp_theme', t); } catch(e){}

  // Apply custom app theme (odoo, apple, glass, win11) via data-app-theme attribute
  const appTheme = (state.settings && state.settings.appTheme) || 'light';
  document.documentElement.setAttribute('data-app-theme', appTheme);

  // Adjust primary color based on preset if not already set
  if(state.settings && state.settings.appTheme){
    switch(state.settings.appTheme){
      case 'odoo':
        state.settings.primaryColor = '#4f46e5';
        break;
      case 'apple':
        state.settings.primaryColor = '#007aff';
        break;
      case 'glass':
        state.settings.primaryColor = '#0284c7';
        break;
      case 'win11':
        state.settings.primaryColor = '#0078d7';
        break;
      default:
        // keep existing primaryColor
        break;
    }
  }

  const primary = (state.settings && state.settings.primaryColor) || '#059669';
  document.documentElement.style.setProperty('--primary', primary);
  document.documentElement.style.setProperty('--primary-hover', adjustColorBrightness(primary, -15));

  const fSize = (state.settings && state.settings.fontSize) || 'normal';
  if(fSize === 'compact'){
    document.documentElement.style.fontSize = '13px';
  } else if(fSize === 'large'){
    document.documentElement.style.fontSize = '15.5px';
  } else {
    document.documentElement.style.fontSize = '14px';
  }
}


function adjustColorBrightness(hex, percent) {
  let num = parseInt(hex.replace('#',''), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      G = (num >> 8 & 0x00FF) + amt,
      B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

function applyTheme(t){
  state.theme = t;
  applyThemeAndAppearance();
}
applyThemeAndAppearance();

function newDraft(){
  const now = new Date();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'م' : 'ص';
  const h12 = hours % 12 || 12;
  const currentTimeStr = `${h12}:${minutes} ${ampm}`;
  const todayStr = (typeof localDateStr === 'function') ? localDateStr(now) : now.toISOString().slice(0, 10);

  const initialDev = {
    id: 'dev_' + now.getTime() + '_1',
    category: 'لابتوب',
    brand: 'Apple',
    brandOther: '',
    model: '',
    accessories: '',
    password: '',
    faults: [],
    faultNotes: '',
    technician: '',
    photos: []
  };

  const draft = {
    id: 'r_' + now.getTime(),
    receiptNumber: '',
    date: todayStr,
    time: currentTimeStr,
    createdAt: now.toISOString(),
    receivedAt: now.toISOString(),
    customer: { title: '', name: '', phone: '', email: '' },
    devices: [ initialDev ],
    activeDeviceIndex: 0,
    get device() {
      if(!this.devices || this.devices.length === 0) return null;
      const idx = (this.activeDeviceIndex != null && this.activeDeviceIndex >= 0 && this.activeDeviceIndex < this.devices.length) ? this.activeDeviceIndex : 0;
      return this.devices[idx];
    },
    set device(val) {
      if(!this.devices) this.devices = [];
      const idx = (this.activeDeviceIndex != null && this.activeDeviceIndex >= 0) ? this.activeDeviceIndex : 0;
      this.devices[idx] = val;
    },
    password: '',
    faults: [],
    faultNotes: '',
    technician: '',
    cost: '',
    deposit: '',
    refunded: 0,
    partsCost: 0,
    partsUsed: '',
    serviceItems: [],
    otherAccountDesc: '',
    otherAccountAmount: 0,
    deliveryDate: todayStr,
    warranty: '3 شهور ضد عيوب الصناعة',
    warrantyMonths: 3,
    warrantyEnd: '',
    customerApproval: null,
    status: 'قيد الفحص',
    paid: false,
    previousReceiptId: '',
    previousReceiptNumber: '',
    rootReceiptId: '',
    reIntakeReason: '',
    serviceCycle: 1,
    nextReceiptId: '',
    nextReceiptNumber: '',
    maintenanceHistory: [],
    createdBy: state.user ? state.user.name : '',
    updatedBy: '',
    updatedAt: ''
  };

  return draft;
}

/* ---------------- U3: Server & Local Document Numbering ---------------- */

async function fetchServerNextDocNumber(docType = 'Receipt'){
  if(typeof apiPost === 'function' && typeof navigator !== 'undefined' && navigator.onLine){
    try {
      const res = await apiPost('nextDocumentNumber', { type: docType, year: new Date().getFullYear() });
      if(res && res.number) {
        return res.number;
      }
    } catch(err) {
      console.warn('fetchServerNextDocNumber offline/failed, using local fallback:', err);
    }
  }
  return null;
}

function nextReceiptNumberLocal(){
  const list = state.receipts || [];
  const y = new Date().getFullYear();
  const prefix = 'MT-' + y + '-';
  let maxSeq = 0;
  for(const r of list){
    const rn = String(r.receiptNumber || r.ReceiptNumber || '');
    if(rn.startsWith(prefix)){
      const numPart = parseInt(rn.slice(prefix.length), 10);
      if(!isNaN(numPart) && numPart > maxSeq){
        maxSeq = numPart;
      }
    }
  }
  return prefix + String(maxSeq + 1).padStart(4, '0');
}

async function nextReceiptNumber(){
  const srvNum = await fetchServerNextDocNumber('Receipt');
  if(srvNum) return srvNum;
  return nextReceiptNumberLocal();
}

function nextInvoiceNumber(){
  const list = state.invoices || [];
  const y = new Date().getFullYear();
  const prefix = 'INV-' + y + '-';
  let maxSeq = 0;
  for(const inv of list){
    const num = String(inv.InvoiceNumber || inv.invoiceNumber || inv.Number || inv.number || '');
    if(num.startsWith(prefix)){
      const part = parseInt(num.slice(prefix.length), 10);
      if(!isNaN(part) && part > maxSeq){
        maxSeq = part;
      }
    }
  }
  return prefix + String(maxSeq + 1).padStart(4, '0');
}

async function nextInvoiceNumberAsync(){
  const srvNum = await fetchServerNextDocNumber('Invoice');
  if(srvNum) return srvNum;
  return nextInvoiceNumber();
}

function nextCreditNoteNumber(){
  const list = state.invoices || [];
  const y = new Date().getFullYear();
  const prefix = 'CN-' + y + '-';
  let maxSeq = 0;
  for(const inv of list){
    const num = String(inv.InvoiceNumber || inv.invoiceNumber || inv.Number || inv.number || '');
    if(num.startsWith(prefix)){
      const part = parseInt(num.slice(prefix.length), 10);
      if(!isNaN(part) && part > maxSeq){
        maxSeq = part;
      }
    }
  }
  return prefix + String(maxSeq + 1).padStart(4, '0');
}

async function nextCreditNoteNumberAsync(){
  const srvNum = await fetchServerNextDocNumber('CreditNote');
  if(srvNum) return srvNum;
  return nextCreditNoteNumber();
}

function nextQuotationNumber(){
  const list = state.quotations || [];
  const y = new Date().getFullYear();
  const prefix = 'QUO-' + y + '-';
  let maxSeq = 0;
  for(const q of list){
    const num = String(q.ID || q.id || q.QuotationNumber || '');
    if(num.startsWith(prefix)){
      const part = parseInt(num.slice(prefix.length), 10);
      if(!isNaN(part) && part > maxSeq){
        maxSeq = part;
      }
    }
  }
  return prefix + String(maxSeq + 1).padStart(4, '0');
}

async function nextQuotationNumberAsync(){
  const srvNum = await fetchServerNextDocNumber('Quotation');
  if(srvNum) return srvNum;
  return nextQuotationNumber();
}


