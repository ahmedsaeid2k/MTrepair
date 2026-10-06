/* ============================================================
   Unified Enterprise Vector Icon Engine (Zero External Dependencies)
   ============================================================ */
const SVG_ICONS = {
  dashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
  maintenance: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  pos: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/>',
  inventory: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  barcode: '<path d="M3 5v14"/><path d="M8 5v14"/><path d="M12 5v14"/><path d="M17 5v14"/><path d="M21 5v14"/>',
  cashdrawer: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  daily: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/>',
  invoices: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  finance: '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/>',
  cameras: '<path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/>',
  audit: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 3-9.5 9.5"/><path d="m15.5 7.5 3 3L21 8"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  alert: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  arrowRight: '<path d="m12 5 7 7-7 7"/><path d="M5 12h14"/>',
  arrowDown: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  arrowUp: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
  trendUp: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  trendDown: '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/>',
  logo: '<rect width="18" height="18" x="3" y="3" rx="3"/><path d="M3 9h18"/><path d="M9 21V9"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  message: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
  refresh: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  tag: '<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><circle cx="7" cy="7" r="1"/>',
  package: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  fileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  tool: '<path d="m14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  laptop: '<rect width="18" height="12" x="3" y="4" rx="2"/><line x1="2" y1="20" x2="22" y2="20"/>',
  headphones: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  dollar: '<line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  creditCard: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
  store: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/>',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-4v10Z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  scale: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  archive: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  externalLink: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  pause: '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
  play: '<polygon points="5 3 19 12 5 21 5 3"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'
};

function getSvgIcon(name, size=16, extraClass=''){
  const path = SVG_ICONS[name] || SVG_ICONS.dashboard;
  const cls = extraClass ? ` ${extraClass}` : '';
  return `<svg class="ui-icon ui-icon-${name}${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;display:inline-block;flex-shrink:0;">${path}</svg>`;
}

/* ============================================================
   Precision Financial Rounding Utilities [F4]
   round2: standard currency / UI rounding (2 decimals)
   round4: unit cost / weighted average inventory cost (4 decimals)
   ============================================================ */
function round2(num) {
  const n = Number(num || 0);
  return Math.round(n * 100) / 100;
}
function round4(num) {
  const n = Number(num || 0);
  return Math.round(n * 10000) / 10000;
}
if (typeof window !== 'undefined') {
  window.round2 = round2;
  window.round4 = round4;
}

/* ============================================================
   Unified Financial Document Calculation Engine (VAT & Totals) [F3]
   Supports tax-inclusive and tax-exclusive calculations, discounts,
   and rounding to 2 decimal places.
   ============================================================ */
function computeDocTotals(opts = {}) {
  const items = Array.isArray(opts.items) ? opts.items : [];
  const discount = Math.max(0, Number(opts.discount || 0));
  const taxPercent = Math.max(0, Number(opts.taxPercent || 0));
  const isTaxInclusive = Boolean(opts.isTaxInclusive);

  let subtotal = 0;
  items.forEach(it => {
    const qty = Number(it.Qty != null ? it.Qty : (it.qty != null ? it.qty : 1));
    const price = Number(it.Price != null ? it.Price : (it.price != null ? it.price : 0));
    subtotal += Math.round(qty * price * 100) / 100;
  });
  subtotal = Math.round(subtotal * 100) / 100;

  const effectiveDiscount = Math.min(subtotal, discount);
  const discountedBase = Math.round((subtotal - effectiveDiscount) * 100) / 100;

  const tRate = taxPercent / 100;
  let netAmount = 0;
  let taxAmount = 0;
  let total = 0;

  if (tRate > 0) {
    if (isTaxInclusive) {
      netAmount = Math.round((discountedBase / (1 + tRate)) * 100) / 100;
      taxAmount = Math.round((discountedBase - netAmount) * 100) / 100;
      total = discountedBase;
    } else {
      netAmount = discountedBase;
      taxAmount = Math.round((discountedBase * tRate) * 100) / 100;
      total = Math.round((discountedBase + taxAmount) * 100) / 100;
    }
  } else {
    netAmount = discountedBase;
    taxAmount = 0;
    total = discountedBase;
  }

  return {
    subtotal,
    discount: effectiveDiscount,
    discountedBase,
    taxPercent,
    isTaxInclusive,
    netAmount,
    taxAmount,
    total
  };
}
if (typeof window !== 'undefined') window.computeDocTotals = computeDocTotals;

/* ---- Toast Notification Utility ---- */
function showToast(msg, type='info', duration=2800){
  const container = document.getElementById('toastContainer');
  if(!container) return;
  
  // Prevent duplicate consecutive toasts with identical message
  const existing = container.querySelectorAll('.toast');
  for(const ex of existing){
    if(ex.textContent.includes(msg)){
      return; // Already showing this toast
    }
  }

  // Limit max visible toasts to 3
  if(existing.length >= 3){
    existing[0].remove();
  }

  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.style.cursor = 'pointer';
  t.title = 'انقر للإغلاق السريع';
  const iconMarkup = type === 'success' ? getSvgIcon('check', 16) : (type === 'error' ? getSvgIcon('alert', 16) : getSvgIcon('search', 16));
  t.innerHTML = `<span style="display:inline-flex;align-items:center;">${iconMarkup}</span><span>${msg}</span><span style="margin-right:auto;font-size:14px;opacity:0.6;margin-left:4px;line-height:1;">&times;</span>`;
  
  t.onclick = ()=>{ t.remove(); };

  container.appendChild(t);
  setTimeout(()=>{
    if(t.parentNode){
      t.style.opacity = '0';
      t.style.transform = 'translateY(10px)';
      t.style.transition = 'all 0.2s ease';
      setTimeout(()=>t.remove(), 200);
    }
  }, duration);
}

/* ---- Customer Data Extraction, Titles & Phone Recovery Engine ---- */
const CUSTOMER_TITLES = ['أستاذ', 'أستاذة', 'مهندس', 'مهندسة', 'دكتور', 'دكتورة', 'حاج', 'حاجة', 'شيخ', 'سيد', 'سيدة'];

function cleanRestName(str){
  return String(str || '').replace(/^[\/\:\-\\\.\s]+/, '').trim();
}

function parseCustomerTitleAndName(rawStr){
  if(!rawStr || typeof rawStr !== 'string') return { title: '', name: '' };
  let str = rawStr.replace(/["`]/g, '').trim();
  if(!str) return { title: '', name: '' };

  function isFemaleName(namePart){
    const firstWord = (namePart.split(/\s+/)[0] || '').trim();
    if(!firstWord) return false;
    if(firstWord.length >= 4 && /[ةه]$/.test(firstWord)) return true;
    const knownFemale = ['سلمى', 'سلمي', 'الاء', 'آلاء', 'مريم', 'منى', 'مني', 'هدى', 'هدي', 'لبنى', 'لبني', 'ضحى', 'ضحي', 'نهى', 'نهي', 'ياسمين', 'رنا', 'مي', 'دينا', 'سما', 'إيمان', 'ايمان', 'أمل', 'امل', 'هاجر', 'حنان', 'آية', 'اية', 'أسماء', 'اسماء', 'إسراء', 'اسراء', 'رحاب', 'جهاد', 'خلود', 'سعاد', 'زينب', 'عبير', 'ريهام', 'روان', 'شروق', 'نور', 'نورهان', 'مروة', 'سارة', 'شيماء', 'دعاء', 'سحر', 'سمر', 'وفاء', 'سناء', 'نجلاء', 'صفاء', 'هناء', 'جيهان', 'سوزان', 'نيفين', 'رشا', 'بسمة', 'بسمه', 'شيرين', 'أميرة', 'اميرة', 'إلهام', 'الهام', 'يارا', 'حبيبة', 'حبيبه', 'فريدة', 'فريده', 'ملك', 'جنى', 'جني', 'شمس', 'رضوى', 'رضوي'];
    return knownFemale.includes(firstWord);
  }

  // 1. Doctor: دكتور / دكتورة / د. / د/ / د 
  const docMatch = str.match(/^([أا]?د(?:كتور[ةه]?|[\.\/\:\-\\]|\s+))\s*(.+)$/i);
  if(docMatch && docMatch[2] && docMatch[2].trim()){
    const rawPfx = docMatch[1].trim();
    const rest = cleanRestName(docMatch[2]);
    const title = (/دكتور[ةه]/i.test(rawPfx) || isFemaleName(rest)) ? 'دكتورة' : 'دكتور';
    return { title: title, name: rest };
  }

  // 2. Engineer: مهندس / مهندسة / م. / م/ / م 
  const engMatch = str.match(/^(مهندس[ةه]?|م[\.\/\:\-\\]|م\s+)\s*(.+)$/i);
  if(engMatch && engMatch[2] && engMatch[2].trim()){
    const rawPfx = engMatch[1].trim();
    const rest = cleanRestName(engMatch[2]);
    const title = (/مهندس[ةه]/i.test(rawPfx) || isFemaleName(rest)) ? 'مهندسة' : 'مهندس';
    return { title: title, name: rest };
  }

  // 3. Teacher / Mr / Ms: أستاذ / استاذ / أستاذة / استاذة / ا/ / أ/ / ا. / أ. / ا  / أ 
  const ostazMatch = str.match(/^([أإا]ستاذ[ةه]?|[أإا][\.\/\:\-\\]|[أإا]\s+)\s*(.+)$/i);
  if(ostazMatch && ostazMatch[2] && ostazMatch[2].trim()){
    const rawPfx = ostazMatch[1].trim();
    const rest = cleanRestName(ostazMatch[2]);
    const title = (/[أإا]ستاذ[ةه]/i.test(rawPfx) || isFemaleName(rest)) ? 'أستاذة' : 'أستاذ';
    return { title: title, name: rest };
  }

  // 4. Hajj: حاج / حاجة / الحاج / الحاجة
  const hajjMatch = str.match(/^((?:ال)?حاج[ةه]?(?:\s*[\/\:\-\\\.]\s*|\s+))\s*(.+)$/i);
  if(hajjMatch && hajjMatch[2] && hajjMatch[2].trim()){
    const rawPfx = hajjMatch[1].trim();
    const rest = cleanRestName(hajjMatch[2]);
    const title = (/حاج[ةه]/i.test(rawPfx) || isFemaleName(rest)) ? 'حاجة' : 'حاج';
    return { title: title, name: rest };
  }

  // 5. Sheikh: شيخ / الشيخ
  const sheikhMatch = str.match(/^((?:ال)?شيخ(?:\s*[\/\:\-\\\.]\s*|\s+))\s*(.+)$/i);
  if(sheikhMatch && sheikhMatch[2] && sheikhMatch[2].trim()){
    return { title: 'شيخ', name: cleanRestName(sheikhMatch[2]) };
  }

  // 6. Madam / Mrs / Miss: مدام / سيدة / السيدة / آنسة / انسة
  const madamMatch = str.match(/^(مدام|ال?سيد[ةه]|آنس[ةه]|انس[ةه])(?:\s*[\/\:\-\\\.]\s*|\s+)\s*(.+)$/i);
  if(madamMatch && madamMatch[2] && madamMatch[2].trim()){
    return { title: 'سيدة', name: cleanRestName(madamMatch[2]) };
  }

  // 7. Sayed / Mr: السيد / سيد (Only with delimiter or "السيد ")
  const sayedMatch = str.match(/^(السيد[ةه]?(?:\s*[\/\:\-\\\.]\s*|\s+)|سيد[ةه]?\s*[\/\:\-\\\.]\s*)\s*(.+)$/i);
  if(sayedMatch && sayedMatch[2] && sayedMatch[2].trim()){
    const rawPfx = sayedMatch[1].trim();
    const rest = cleanRestName(sayedMatch[2]);
    const title = (/سيد[ةه]/i.test(rawPfx) || isFemaleName(rest)) ? 'سيدة' : 'سيد';
    return { title: title, name: rest };
  }

  return { title: '', name: str };
}

function extractCustomerName(obj){
  if(!obj) return '';
  if(typeof obj !== 'object'){
    const parsed = parseCustomerTitleAndName(String(obj));
    return parsed.name || String(obj).trim();
  }
  const val = obj.CustomerName ?? obj.customerName ?? obj.Name ?? obj.name ?? obj.clientName ?? obj.ClientName ??
              obj['الاسم'] ?? obj['اسم العميل'] ?? obj['العميل'] ??
              (obj.customer ? (obj.customer.name ?? obj.customer.Name ?? obj.customer.CustomerName) : '') ?? '';
  const str = String(val).replace(/["']/g, '').trim();
  const parsed = parseCustomerTitleAndName(str);
  return parsed.name || str;
}

function getLevenshteinDistance(a, b){
  if(a === b) return 0;
  const la = a.length, lb = b.length;
  if(!la) return lb;
  if(!lb) return la;
  const d = [];
  for(let i=0; i<=la; i++){ d[i] = [i]; }
  for(let j=0; j<=lb; j++){ d[0][j] = j; }
  for(let i=1; i<=la; i++){
    for(let j=1; j<=lb; j++){
      const cost = a[i-1] === b[j-1] ? 0 : 1;
      d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + cost);
    }
  }
  return d[la][lb];
}

function normalizeCustomerSearchName(str){
  if(!str) return '';
  let s = String(str).trim().toLowerCase();
  s = s.replace(/[\u064B-\u065F]/g, ''); // Remove Arabic diacritics / tashkeel
  s = s.replace(/[أإآء]/g, 'ا');
  s = s.replace(/ة/g, 'ه');
  s = s.replace(/ى/g, 'ي');
  // Normalize common phonetic twin typos in Egyptian/Arabic names:
  s = s.replace(/ض/g, 'ص'); // مضطفي <-> مصطفي
  s = s.replace(/ظ/g, 'ز');
  s = s.replace(/ذ/g, 'ز');
  s = s.replace(/عبد\s+/g, 'عبد');
  s = s.replace(/ابو\s+/g, 'ابو');
  // Strip common titles
  s = s.replace(/^(دكتور|دكتورة|د\.|أستاذ|استاذ|أستاذة|استاذة|أ\.|ا\.|مهندس|مهندسة|م\.|سيدة|مدام|الحاج|حاج|شيخ|سيد)\s*[\/:-]?\s*/g, '');
  // Normalize punctuation and spacing
  s = s.replace(/[ـ\-_/\\.,:;]+/g, ' ').replace(/\s+/g, ' ').trim();
  return s;
}

function isCustomerPhoneValid(p){
  if(!p) return false;
  const s = String(p).trim();
  return s.length >= 7 && s !== '0000000000' && s !== '00000' && s !== 'undefined' && s !== 'null';
}

function findCustomerInDirectory(rawName){
  if(!rawName || typeof rawName !== 'string') return null;
  if(typeof state === 'undefined' || !state || !Array.isArray(state.customers) || !state.customers.length) return null;

  const clean = normalizeCustomerSearchName(rawName);
  if(!clean || clean === 'عميل' || clean === 'زبون') return null;

  const list = state.customers;
  const rawTrimmed = rawName.trim().toLowerCase();

  const matches = [];

  for(let i=0; i<list.length; i++){
    const c = list[i];
    if(!c) continue;
    const cn = (c.name || c.CustomerName || '').trim().toLowerCase();
    const cNorm = normalizeCustomerSearchName(c.name || c.CustomerName || '');
    const cTitle = (c.title || c.CustomerTitle || '').trim();
    const combinedNorm = normalizeCustomerSearchName((cTitle ? cTitle + ' ' : '') + (c.name || c.CustomerName || ''));

    let score = 0;
    if(cn && cn === rawTrimmed) { score = 100; }
    else if(cNorm && cNorm === clean) { score = 90; }
    else if(combinedNorm && combinedNorm === clean) { score = 85; }
    else if(cNorm && cNorm.replace('سايمه', 'ساميه') === clean.replace('سايمه', 'ساميه')) { score = 75; }
    else if(clean.length >= 4 && cNorm && Math.abs(cNorm.length - clean.length) <= 1 && typeof getLevenshteinDistance === 'function') {
      if(getLevenshteinDistance(cNorm, clean) <= 1) { score = 65; }
    }

    if(score > 0){
      matches.push({ c, score });
    }
  }

  if(!matches.length) return null;

  // Prioritize candidates with a valid phone number
  matches.sort((a, b) => {
    const aHasPhone = isCustomerPhoneValid(a.c.phone || a.c.CustomerPhone);
    const bHasPhone = isCustomerPhoneValid(b.c.phone || b.c.CustomerPhone);
    if(aHasPhone && !bHasPhone) return -1;
    if(!aHasPhone && bHasPhone) return 1;
    return b.score - a.score;
  });

  const best = matches[0].c;

  // Cross-pollinate phone if best match lacks it but another matched candidate has it
  const matchWithPhone = matches.find(m => isCustomerPhoneValid(m.c.phone || m.c.CustomerPhone));
  if(matchWithPhone && !isCustomerPhoneValid(best.phone || best.CustomerPhone)){
    const ph = matchWithPhone.c.phone || matchWithPhone.c.CustomerPhone;
    best.phone = ph;
    if(best.CustomerPhone !== undefined) best.CustomerPhone = ph;
  }

  return best;
}

function deduplicateCustomerDirectory(){
  if(typeof state === 'undefined' || !state || !Array.isArray(state.customers) || state.customers.length <= 1) return 0;
  const oldLen = state.customers.length;
  const mergedMap = new Map();

  state.customers.forEach(c => {
    if(!c) return;
    const rawName = (c.name || c.CustomerName || '').trim();
    const phone = (c.phone || c.CustomerPhone || '').trim();
    const title = (c.title || c.CustomerTitle || '').trim();
    const email = (c.email || c.CustomerEmail || '').trim();
    const taxNumber = (c.taxNumber || c.TaxNumber || '').trim();
    const address = (c.address || c.Address || '').trim();

    if(!rawName || rawName === 'عميل' || rawName === 'زبون') return;

    const normName = normalizeCustomerSearchName(rawName);
    const key = isCustomerPhoneValid(phone) ? ('p_' + phone) : ('n_' + normName);

    if(!mergedMap.has(key)){
      mergedMap.set(key, { title, name: rawName, phone, email, taxNumber, address });
    } else {
      const existing = mergedMap.get(key);
      if(!existing.phone && phone) existing.phone = phone;
      if(!existing.title && title) existing.title = title;
      if(!existing.email && email) existing.email = email;
      if(!existing.taxNumber && taxNumber) existing.taxNumber = taxNumber;
      if(!existing.address && address) existing.address = address;

      // Prefer canonical spelling without typos (e.g. مصطفى/مصطفي over مضطفي)
      if(existing.name.includes('مضط') && !rawName.includes('مضط')){
        existing.name = rawName;
      } else if(rawName.length >= existing.name.length && !rawName.includes('طط') && !rawName.includes('مضط')){
        existing.name = rawName;
      }
    }
  });

  const entries = Array.from(mergedMap.values());
  const finalCustomers = [];
  const handledEmpty = new Set();

  const withPhone = entries.filter(c => isCustomerPhoneValid(c.phone));
  const withoutPhone = entries.filter(c => !isCustomerPhoneValid(c.phone));

  withPhone.forEach(wp => {
    const wpNorm = normalizeCustomerSearchName(wp.name);
    withoutPhone.forEach(np => {
      const npNorm = normalizeCustomerSearchName(np.name);
      if(npNorm === wpNorm || (typeof getLevenshteinDistance === 'function' && wpNorm.length >= 4 && getLevenshteinDistance(wpNorm, npNorm) <= 1)){
        if(!wp.title && np.title) wp.title = np.title;
        if(!wp.email && np.email) wp.email = np.email;
        handledEmpty.add(np);
      }
    });
    finalCustomers.push(wp);
  });

  withoutPhone.forEach(np => {
    if(!handledEmpty.has(np)){
      finalCustomers.push(np);
    }
  });

  state.customers = finalCustomers;
  setCache('customers', state.customers);
  const removed = oldLen - finalCustomers.length;
  if(removed > 0){
    console.log(`Deduplicated customers: removed ${removed} duplicates, now ${finalCustomers.length} unique customers.`);
  }
  return removed;
}

function extractCustomerTitle(obj){
  if(!obj) return '';
  if(typeof obj === 'string'){
    const trimmed = obj.replace(/["`]/g, '').trim();
    if(CUSTOMER_TITLES.includes(trimmed)) return trimmed;
    const parsed = parseCustomerTitleAndName(trimmed);
    return parsed.title || '';
  }
  if(typeof obj !== 'object') return '';

  // 1. Explicit property on object
  let val = obj.CustomerTitle ?? obj.customerTitle ?? obj.Title ?? obj.title ??
            obj['اللقب'] ?? obj['صفة'] ?? obj['صفة العميل'] ??
            (obj.customer ? (obj.customer.title ?? obj.customer.Title ?? obj.customer.CustomerTitle) : '') ?? '';
  val = String(val).replace(/["`]/g, '').trim();
  if(val && CUSTOMER_TITLES.includes(val)) return val;

  // 2. Extract embedded prefix from customer name
  const rawName = obj.CustomerName ?? obj.customerName ?? obj.Name ?? obj.name ?? obj.clientName ?? obj.ClientName ??
                  obj['الاسم'] ?? obj['اسم العميل'] ?? obj['العميل'] ??
                  (obj.customer ? (obj.customer.name ?? obj.customer.Name ?? obj.customer.CustomerName) : '') ?? '';
  if(rawName && typeof rawName === 'string'){
    const parsed = parseCustomerTitleAndName(rawName);
    if(parsed.title) return parsed.title;
  }

  // 3. Fallback: Cross-reference with state.customers directory
  if(typeof findCustomerInDirectory === 'function' && rawName){
    const matched = findCustomerInDirectory(rawName);
    if(matched){
      const t = (matched.title || matched.CustomerTitle || (matched.customer && matched.customer.title) || '').trim();
      if(t && CUSTOMER_TITLES.includes(t)) return t;
    }
  }

  return val;
}

function extractCustomerPhone(obj){
  if(!obj) return '';
  if(typeof obj === 'string'){
    let s = (typeof toEngDigits === 'function' ? toEngDigits(obj) : String(obj)).replace(/["']/g, '').trim();
    if(s.length === 10 && /^[1][0125]\d{8}$/.test(s)) s = '0' + s;
    return s;
  }
  if(typeof obj !== 'object') return '';
  let val = obj.CustomerPhone ?? obj.customerPhone ?? obj.Phone ?? obj.phone ?? obj.mobile ?? obj.Mobile ??
            obj['الهاتف'] ?? obj['رقم الهاتف'] ?? obj['هاتف'] ?? obj['الموبايل'] ?? obj['موبايل'] ??
            obj['تليفون'] ?? obj['رقم التليفون'] ?? obj.Tel ?? obj.tel ?? obj.ClientPhone ?? obj.clientPhone ??
            (obj.customer ? (obj.customer.phone ?? obj.customer.Phone ?? obj.customer.CustomerPhone) : '') ?? '';
  let str = (typeof toEngDigits === 'function' ? toEngDigits(val) : String(val)).replace(/["']/g, '').trim();
  if(str.length === 10 && /^[1][0125]\d{8}$/.test(str)) str = '0' + str;

  if(str && str !== '0000000000' && str !== '00000' && str !== 'undefined' && str !== 'null'){
    return str;
  }

  // Fallback: Cross-reference with state.customers directory by customer name
  const rawName = obj.CustomerName ?? obj.customerName ?? obj.Name ?? obj.name ?? obj.clientName ?? obj.ClientName ??
                  obj['الاسم'] ?? obj['اسم العميل'] ?? obj['العميل'] ??
                  (obj.customer ? (obj.customer.name ?? obj.customer.Name ?? obj.customer.CustomerName) : '') ?? '';
  if(rawName && typeof findCustomerInDirectory === 'function'){
    const matched = findCustomerInDirectory(rawName);
    if(matched){
      let p = (typeof toEngDigits === 'function' ? toEngDigits(matched.phone ?? matched.CustomerPhone ?? matched.Phone ?? '') : String(matched.phone || '')).replace(/["']/g, '').trim();
      if(p.length === 10 && /^[1][0125]\d{8}$/.test(p)) p = '0' + p;
      if(p && p !== '0000000000' && p !== '00000'){
        if(obj.customer && typeof obj.customer === 'object') obj.customer.phone = p;
        if(obj.CustomerPhone !== undefined) obj.CustomerPhone = p;
        return p;
      }
    }
  }

  return '';
}

function formatCustomerFullName(objOrName, optTitle){
  if(typeof objOrName === 'string'){
    const parsed = parseCustomerTitleAndName(objOrName);
    const title = ((optTitle != null ? optTitle : parsed.title) || '').trim();
    const name = (parsed.name || objOrName).trim();
    return title ? `${title} / ${name}` : name;
  }
  const name = extractCustomerName(objOrName) || 'عميل';
  const title = (optTitle != null ? optTitle : extractCustomerTitle(objOrName)).trim();
  return title ? `${title} / ${name}` : name;
}

function extractCustomerEmail(obj){
  if(!obj || typeof obj !== 'object') return '';
  const val = obj.CustomerEmail ?? obj.customerEmail ?? obj.Email ?? obj.email ?? obj['البريد'] ?? obj['الإيميل'] ??
              (obj.customer ? (obj.customer.email ?? obj.customer.Email) : '') ?? '';
  return String(val).replace(/["']/g, '').trim();
}

/* Safe customer normalizer - links receipts to Customer Directory & heals typos */
function recoverAndSyncAllCustomerPhones(verbose = false){
  deduplicateCustomerDirectory();
  let matchedCount = 0;
  let namesSynced = 0;
  const receiptsToPersist = [];

  (state.receipts || []).forEach(r => {
    if(!r) return;
    const rawName = extractCustomerName(r);
    const title = extractCustomerTitle(r);
    const currentPhone = extractCustomerPhone(r);
    if(!r.customer || typeof r.customer !== 'object'){
      r.customer = { title: title || '', name: rawName || 'عميل', phone: currentPhone || '', email: extractCustomerEmail(r) };
    }

    let changed = false;

    // Cross reference with Customer Directory
    const matched = (typeof findCustomerInDirectory === 'function' && rawName) ? findCustomerInDirectory(rawName) : null;
    if(matched){
      const dirPhone = (matched.phone || matched.CustomerPhone || '').trim();
      const dirName = (matched.name || matched.CustomerName || '').trim();
      const dirTitle = (matched.title || matched.CustomerTitle || '').trim();

      if(dirName && (r.CustomerName !== dirName || r.customer.name !== dirName)){
        r.CustomerName = dirName;
        r.customer.name = dirName;
        changed = true;
        namesSynced++;
      }
      if(dirTitle && (r.CustomerTitle !== dirTitle || r.customer.title !== dirTitle)){
        r.CustomerTitle = dirTitle;
        r.customer.title = dirTitle;
        changed = true;
      }
      if(dirPhone && dirPhone !== '0000000000' && (!r.customer.phone || r.customer.phone === '0000000000')){
        r.customer.phone = dirPhone;
        r.CustomerPhone = dirPhone;
        changed = true;
        matchedCount++;
      }
    } else {
      if(!r.customer.phone && currentPhone && currentPhone !== '0000000000'){
        r.customer.phone = currentPhone;
        changed = true;
        matchedCount++;
      }
      if(r.customer.phone && !r.CustomerPhone){
        r.CustomerPhone = r.customer.phone;
        changed = true;
      }
      if(!r.CustomerTitle && title){
        r.CustomerTitle = title;
        changed = true;
      }
    }

    if(changed){
      receiptsToPersist.push(r);
    }
  });

  setCache('receipts', state.receipts);

  if(verbose){
    showToast(`تم ربط وتحديث جهات الاتصال (${matchedCount} رقم هاتف، ${namesSynced} اسم مصحح) بنجاح`, 'success');
  }

  if(verbose && receiptsToPersist.length > 0){
    (async () => {
      for(const rec of receiptsToPersist){
        try { await apiPost('saveReceipt', { data: receiptToRow(rec), user: (state.user ? state.user.name : 'نظام') }); } catch(e){}
      }
    })();
  }

  return { recoveredCount: matchedCount, namesSynced, totalCustomers: (state.customers || []).length };
}

/* ---------------- Receipt Date & Time Helpers ---------------- */
function formatReceiptTime(rawR){
  if(!rawR) return '';
  const rawTime = rawR.time || rawR.Time || rawR['الوقت'] || rawR['وقت الاستلام'];
  if(rawTime && typeof rawTime === 'string' && rawTime.trim()){
    return rawTime.trim();
  }
  let dateObj = null;
  const recAt = rawR.receivedAt || rawR.ReceivedAt;
  const crAt = rawR.createdAt || rawR.CreatedAt;
  const rDate = rawR.date || rawR.Date;
  const rId = rawR.id || rawR.ID || rawR['رقم الجهاز'];

  if(recAt && !isNaN(new Date(recAt).getTime())){
    dateObj = new Date(recAt);
  } else if(crAt && !isNaN(new Date(crAt).getTime())){
    dateObj = new Date(crAt);
  } else if(rDate && String(rDate).length > 10 && !isNaN(new Date(rDate).getTime())){
    dateObj = new Date(rDate);
  } else if(rId && /^r_\d{12,14}$/.test(String(rId))){
    const ts = Number(String(rId).replace('r_', ''));
    if(!isNaN(ts) && ts > 1600000000000) dateObj = new Date(ts);
  }
  if(dateObj){
    try {
      const hours = dateObj.getHours();
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'م' : 'ص';
      const h12 = hours % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    } catch(e){}
  }
  return '';
}

function formatReceiptDateTime(rawR){
  if(!rawR) return '';
  const dStr = (typeof cleanDate === 'function') ? cleanDate(rawR.date || rawR.Date) : (String(rawR.date || rawR.Date || '').slice(0,10));
  const tStr = formatReceiptTime(rawR);
  return tStr ? `${dStr} — ${tStr}` : dStr;
}

/* ---- Warranty End Date Computation Helper ---- */
function computeWarrantyEndDate(startDateStr, months = 3){
  if(!startDateStr) return '';
  try {
    const cleanStr = String(startDateStr).slice(0, 10);
    const parts = cleanStr.split('-');
    if(parts.length !== 3) return '';
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if(isNaN(y) || isNaN(m) || isNaN(d)) return '';
    const date = new Date(y, m + Number(months || 0), d);
    if(isNaN(date.getTime())) return '';
    const resY = date.getFullYear();
    const resM = String(date.getMonth() + 1).padStart(2, '0');
    const resD = String(date.getDate()).padStart(2, '0');
    return `${resY}-${resM}-${resD}`;
  } catch(e){
    return '';
  }
}
window.computeWarrantyEndDate = computeWarrantyEndDate;

/* ---- Mapping between internal shape and flat sheet rows ---- */
function receiptToRow(d){
  const cTitle = extractCustomerTitle(d);
  const cName = extractCustomerName(d);
  const cPhone = extractCustomerPhone(d);
  const cEmail = extractCustomerEmail(d);

  const pass = (d.device && d.device.password) || d.password || '';
  const timeStr = d.time || formatReceiptTime(d) || '';
  const wMonths = Number(d.warrantyMonths != null ? d.warrantyMonths : 3);
  const wEnd = d.warrantyEnd || (d.deliveryDate || d.date ? computeWarrantyEndDate(d.deliveryDate || d.date, wMonths) : '');
  const approvalJSON = d.customerApproval ? (typeof d.customerApproval === 'string' ? d.customerApproval : JSON.stringify(d.customerApproval)) : '';

  return {
    ID: d.id, ReceiptNumber: d.receiptNumber, TrackToken: d.trackToken || d.TrackToken || '', Date: d.date, Time: timeStr,
    ReceivedAt: d.receivedAt || d.createdAt || '',
    CustomerTitle: cTitle, CustomerName: cName, CustomerPhone: cPhone, CustomerEmail: cEmail,
    Category: d.device.category, Brand: d.device.brand==='أخرى' ? d.device.brandOther : d.device.brand,
    Model: d.device.model, Accessories: d.device.accessories, Password: pass,
    Faults: (d.faults||[]).join('، '), FaultNotes: d.faultNotes,
    Technician: d.technician, Cost: d.cost, Deposit: d.deposit, Refunded: d.refunded || 0, PartsCost: d.partsCost || 0, PartsUsed: d.partsUsed || '',
    PartsJSON: (Array.isArray(d.partsList) && d.partsList.length) ? JSON.stringify(d.partsList) : (typeof d.partsJSON === 'string' ? d.partsJSON : ''),
    InspectionFee: d.inspectionFee != null ? d.inspectionFee : '',
    EstimateTime: d.estimateTime || '',
    Warranty: d.warranty || '',
    WarrantyMonths: wMonths,
    WarrantyEnd: wEnd,
    CustomerApprovalJSON: approvalJSON,
    ServiceItems: (Array.isArray(d.serviceItems) && d.serviceItems.length) ? JSON.stringify(d.serviceItems) : '',
    Devices: (Array.isArray(d.devices) && d.devices.length) ? JSON.stringify(d.devices) : '',
    Photos: (Array.isArray(d.photos) && d.photos.length) ? JSON.stringify(d.photos) : '',
    OtherAccountDesc: d.otherAccountDesc || '',
    OtherAccountAmount: Number(d.otherAccountAmount || 0),
    DeliveryDate: d.deliveryDate, Status: d.status, Paid: d.paid ? 'TRUE' : 'FALSE',
    Bonus: d.bonus || '', CreatedBy: d.createdBy, UpdatedBy: d.updatedBy, UpdatedAt: d.updatedAt,
    PreviousReceiptID: d.previousReceiptId || '', PreviousReceiptNumber: d.previousReceiptNumber || '',
    RootReceiptID: d.rootReceiptId || '', ReIntakeReason: d.reIntakeReason || '', ServiceCycle: d.serviceCycle || 1,
    NextReceiptID: d.nextReceiptId || '', NextReceiptNumber: d.nextReceiptNumber || ''
  };
}

function rowToReceipt(row){
  const cTitle = extractCustomerTitle(row);
  const cName = extractCustomerName(row);
  const cPhone = extractCustomerPhone(row);
  const cEmail = extractCustomerEmail(row);

  let sItems = [];
  if(Array.isArray(row.serviceItems)) sItems = row.serviceItems;
  else if(Array.isArray(row.ServiceItems)) sItems = row.ServiceItems;
  else {
    const rawS = row.ServiceItems || row.serviceItems;
    if(typeof rawS === 'string' && rawS.trim()){
      try { const p = JSON.parse(rawS); if(Array.isArray(p)) sItems = p; } catch(e){}
    }
  }

  const pass = row.Password || row.password || (row.device && row.device.password) || '';
  const timeStr = row.Time || row.time || row['الوقت'] || row['وقت الاستلام'] || '';
  const recAt = row.ReceivedAt || row.receivedAt || row.CreatedAt || row.createdAt || '';

  return {
    id: row.ID || row.id || row['رقم الجهاز'] || ('rec_' + Date.now() + '_' + Math.floor(Math.random()*1000)),
    receiptNumber: row.ReceiptNumber || row.receiptNumber || row['رقم الإيصال'] || row['رقم الايصال'] || '',
    date: row.Date || row.date || row['التاريخ'] || '',
    time: timeStr,
    receivedAt: recAt,
    createdAt: row.CreatedAt || row.createdAt || recAt,
    customer: {
      title: cTitle,
      name: cName || 'عميل',
      phone: cPhone,
      email: cEmail
    },
    device: {
      category: row.Category || row.category || (row.device && row.device.category) || 'لابتوب',
      brand: row.Brand || row.brand || (row.device && row.device.brand) || '',
      brandOther: (row.device && row.device.brandOther) || '',
      model: row.Model || row.model || (row.device && row.device.model) || '',
      accessories: row.Accessories || row.accessories || (row.device && row.device.accessories) || '',
      password: pass
    },
    password: pass,
    faults: row.Faults ? (Array.isArray(row.Faults) ? row.Faults : String(row.Faults).split('، ').filter(Boolean)) : (row.faults || []),
    faultNotes: row.FaultNotes || row.faultNotes || '',
    technician: row.Technician || row.technician || '',
    cost: row.Cost != null ? row.Cost : row.cost,
    deposit: row.Deposit != null ? row.Deposit : row.deposit,
    refunded: Number(row.Refunded || row.refunded || 0),
    partsCost: Number(row.PartsCost || row.partsCost || 0),
    partsUsed: row.PartsUsed || row.partsUsed || '',
    partsList: (()=>{
      const pRaw = row.PartsJSON || row.partsJSON || row.partsList;
      if(Array.isArray(pRaw)) return pRaw;
      if(typeof pRaw === 'string' && pRaw.trim()){
        try { const parsed = JSON.parse(pRaw); if(Array.isArray(parsed)) return parsed; } catch(e){}
      }
      return [];
    })(),
    inspectionFee: (row.InspectionFee != null && row.InspectionFee !== '') ? Number(row.InspectionFee) : ((row.inspectionFee != null && row.inspectionFee !== '') ? Number(row.inspectionFee) : null),
    estimateTime: row.EstimateTime || row.estimateTime || '',
    warranty: row.Warranty || row.warranty || '',
    warrantyMonths: Number(row.WarrantyMonths != null ? row.WarrantyMonths : (row.warrantyMonths != null ? row.warrantyMonths : 3)),
    warrantyEnd: row.WarrantyEnd || row.warrantyEnd || ((row.DeliveryDate || row.Date || row.date) ? computeWarrantyEndDate(row.DeliveryDate || row.Date || row.date, Number(row.WarrantyMonths != null ? row.WarrantyMonths : (row.warrantyMonths != null ? row.warrantyMonths : 3))) : ''),
    customerApproval: (()=>{
      const rawA = row.CustomerApprovalJSON || row.customerApprovalJSON || row.CustomerApproval || row.customerApproval;
      if(rawA && typeof rawA === 'object') return rawA;
      if(typeof rawA === 'string' && rawA.trim()){
        try { const p = JSON.parse(rawA); if(p && typeof p === 'object') return p; }catch(e){}
      }
      return null;
    })(),
    serviceItems: sItems,
    otherAccountDesc: row.OtherAccountDesc || row.otherAccountDesc || '',
    otherAccountAmount: Number(row.OtherAccountAmount != null ? row.OtherAccountAmount : (row.otherAccountAmount || 0)),
    deliveryDate: row.DeliveryDate || row.deliveryDate || '',
    trackToken: row.TrackToken || row.trackToken || '',
    status: row.Status || row.status || 'قيد الفحص',
    paid: String(row.Paid).toUpperCase() === 'TRUE' || row.paid === true,
    bonus: row.Bonus || row.bonus || '',
    createdBy: row.CreatedBy || row.createdBy || '',
    updatedBy: row.UpdatedBy || row.updatedBy || '',
    updatedAt: row.UpdatedAt || row.updatedAt || '',
    previousReceiptId: row.PreviousReceiptID || row.previousReceiptId || '',
    previousReceiptNumber: row.PreviousReceiptNumber || row.previousReceiptNumber || '',
    rootReceiptId: row.RootReceiptID || row.rootReceiptId || '',
    reIntakeReason: row.ReIntakeReason || row.reIntakeReason || '',
    serviceCycle: Number(row.ServiceCycle || row.serviceCycle || 1),
    nextReceiptId: row.NextReceiptID || row.nextReceiptId || '',
    nextReceiptNumber: row.NextReceiptNumber || row.nextReceiptNumber || '',
    maintenanceHistory: row.maintenanceHistory || [],
    devices: (()=>{
      const rawD = row.Devices || row.devices;
      if(Array.isArray(rawD) && rawD.length) return rawD;
      if(typeof rawD === 'string' && rawD.trim()){
        try{ const p = JSON.parse(rawD); if(Array.isArray(p) && p.length) return p; }catch(e){}
      }
      return null;
    })(),
    photos: (()=>{
      const rawP = row.Photos || row.photos;
      if(Array.isArray(rawP)) return rawP;
      if(typeof rawP === 'string' && rawP.trim()){
        try { const p = JSON.parse(rawP); if(Array.isArray(p)) return p; } catch(e){}
      }
      return [];
    })()
  };
}

/* Master Normalizer for Maintenance Receipts to guarantee fault-tolerant operations */
function normalizeReceipt(r){
  if(!r || typeof r !== 'object') return null;

  // Guarantee ID is ALWAYS present and string
  if(!r.id){
    r.id = r.ID || r['رقم الجهاز'] || r['كود'] || r.receiptNumber || r.ReceiptNumber || r['رقم الإيصال'] || ('rec_' + Date.now() + '_' + Math.floor(Math.random()*1000));
  }
  r.id = String(r.id);

  // Guarantee Receipt Number is ALWAYS present and string
  if(!r.receiptNumber){
    r.receiptNumber = r.ReceiptNumber || r['رقم الإيصال'] || r['رقم الايصال'] || ('MT-' + (r.id || Date.now()));
  }
  r.receiptNumber = String(r.receiptNumber);

  // Normalize TrackToken
  r.trackToken = String(r.trackToken || r.TrackToken || '');
  r.TrackToken = r.trackToken;

  // Normalize Date & Time
  r.date = r.date || r.Date || '';
  r.time = r.time || r.Time || (typeof formatReceiptTime === 'function' ? formatReceiptTime(r) : '');
  r.receivedAt = r.receivedAt || r.ReceivedAt || r.createdAt || r.CreatedAt || '';
  r.createdAt = r.createdAt || r.CreatedAt || r.receivedAt || '';

  // Normalize Customer
  const cTitle = extractCustomerTitle(r);
  const cName = extractCustomerName(r) || 'عميل';
  const cPhone = extractCustomerPhone(r);
  const cEmail = extractCustomerEmail(r);

  if(!r.customer || typeof r.customer !== 'object'){
    r.customer = {
      title: cTitle || '',
      name: cName,
      phone: cPhone || '',
      email: cEmail || ''
    };
  }
  if(!r.customer.title || !CUSTOMER_TITLES.includes(r.customer.title)) {
    r.customer.title = cTitle || r.customer.title || '';
  }
  r.customer.title = String(r.customer.title || '');
  r.CustomerTitle = r.customer.title;

  if(!r.customer.name || r.customer.name === 'عميل' || parseCustomerTitleAndName(r.customer.name).title){
    r.customer.name = cName;
  }
  r.customer.name = String(r.customer.name || 'عميل');
  r.CustomerName = r.customer.name;

  if(!r.customer.phone || r.customer.phone === '0000000000'){
    r.customer.phone = cPhone || '';
  }
  r.customer.phone = String(r.customer.phone || '');
  r.CustomerPhone = r.customer.phone;

  if(r.customer.email == null) r.customer.email = cEmail || '';
  r.customer.email = String(r.customer.email || '');
  r.CustomerEmail = r.customer.email;

  // Normalize Device
  const pass = String((r.device && r.device.password) || r.password || r.Password || '');
  if(!r.device || typeof r.device !== 'object'){
    r.device = {
      category: r.category || r.Category || 'لابتوب',
      brand: r.brand || r.Brand || '',
      brandOther: r.brandOther || '',
      model: r.model || r.Model || '',
      accessories: r.accessories || r.Accessories || '',
      password: pass
    };
  }
  r.device.category = String(r.device.category || 'أخرى');
  r.device.brand = String(r.device.brand != null ? r.device.brand : '');
  r.device.brandOther = String(r.device.brandOther != null ? r.device.brandOther : '');
  r.device.model = String(r.device.model != null ? r.device.model : '');
  r.device.accessories = String(r.device.accessories != null ? r.device.accessories : '');
  r.device.password = pass;
  r.password = pass;

  // Normalize Faults strictly as an Array of strings
  if(!Array.isArray(r.faults)){
    if(typeof r.faults === 'string' && r.faults.trim()){
      r.faults = r.faults.replace(/،/g, ',').split(',').map(s=>s.trim()).filter(Boolean);
    } else if(r.Faults){
      if(Array.isArray(r.Faults)){
        r.faults = r.Faults.slice();
      } else {
        r.faults = String(r.Faults).replace(/،/g, ',').split(',').map(s=>s.trim()).filter(Boolean);
      }
    } else {
      r.faults = [];
    }
  }

  // Normalize Service Items (بنود الصيانة المستحقة)
  if(!Array.isArray(r.serviceItems)){
    if(typeof r.serviceItems === 'string' && r.serviceItems.trim()){
      try { const p = JSON.parse(r.serviceItems); if(Array.isArray(p)) r.serviceItems = p; else r.serviceItems = []; } catch(e){ r.serviceItems = []; }
    } else if(r.ServiceItems){
      if(Array.isArray(r.ServiceItems)) r.serviceItems = r.ServiceItems;
      else if(typeof r.ServiceItems === 'string' && r.ServiceItems.trim()){
        try { const p = JSON.parse(r.ServiceItems); if(Array.isArray(p)) r.serviceItems = p; else r.serviceItems = []; } catch(e){ r.serviceItems = []; }
      } else { r.serviceItems = []; }
    } else {
      r.serviceItems = [];
    }
  }
  r.serviceItems = r.serviceItems.map(it => ({
    desc: String(it && it.desc != null ? it.desc : ''),
    price: Number(it && it.price != null ? it.price : 0)
  }));

  // Normalize Other Customer Account (حساب إضافي / سابق على العميل)
  r.otherAccountDesc = String(r.otherAccountDesc != null ? r.otherAccountDesc : (r.OtherAccountDesc || ''));
  r.otherAccountAmount = Number(r.otherAccountAmount != null ? r.otherAccountAmount : (r.OtherAccountAmount || 0));

  // Financial fields normalization
  r.cost = Number(r.cost != null ? r.cost : (r.Cost || 0));
  r.partsCost = Number(r.partsCost != null ? r.partsCost : (r.PartsCost || 0));
  r.deposit = Number(r.deposit != null ? r.deposit : (r.Deposit || 0));
  r.refunded = Number(r.refunded != null ? r.refunded : (r.Refunded || 0));

  // Normalize Photos (توثيق صور وفيديوهات حالة الجهاز عند الاستلام والتسليم)
  let rawPhotos = r.photos || r.Photos;
  if(typeof rawPhotos === 'string' && rawPhotos.trim()){
    try {
      const p = JSON.parse(rawPhotos);
      if(Array.isArray(p)) rawPhotos = p;
    } catch(e){}
  }
  if(!Array.isArray(rawPhotos)) rawPhotos = [];
  r.photos = rawPhotos.map((p, pIdx) => ({
    id: String(p.id || ('photo_' + Date.now() + '_' + pIdx)),
    url: String(p.url || p.thumb || ''),
    thumb: String(p.thumb || p.url || ''),
    angle: String(p.angle || 'عام'),
    stage: String(p.stage || 'intake'),
    timestamp: String(p.timestamp || new Date().toISOString()),
    note: String(p.note || '')
  }));

  // Normalize Devices (دعم استلام أكثر من جهاز في الإيصال الواحد)
  let rawDevs = r.devices || r.Devices;
  if(typeof rawDevs === 'string' && rawDevs.trim()){
    try {
      const p = JSON.parse(rawDevs);
      if(Array.isArray(p)) rawDevs = p;
    } catch(e){}
  }
  if(!Array.isArray(rawDevs) || rawDevs.length === 0){
    rawDevs = [
      {
        id: 'dev_1',
        category: String(r.device.category || 'لابتوب'),
        brand: String(r.device.brand || ''),
        brandOther: String(r.device.brandOther || ''),
        model: String(r.device.model || ''),
        accessories: String(r.device.accessories || ''),
        password: String(pass || ''),
        faults: Array.isArray(r.faults) ? [...r.faults] : [],
        faultNotes: String(r.faultNotes || ''),
        technician: String(r.technician || ''),
        photos: r.photos || []
      }
    ];
  } else {
    rawDevs = rawDevs.map((d, idx) => ({
      id: String(d.id || ('dev_' + (idx + 1))),
      category: String(d.category || r.device.category || 'لابتوب'),
      brand: String(d.brand != null ? d.brand : (r.device.brand || '')),
      brandOther: String(d.brandOther != null ? d.brandOther : ''),
      model: String(d.model != null ? d.model : ''),
      accessories: String(d.accessories != null ? d.accessories : ''),
      password: String(d.password != null ? d.password : (pass || '')),
      faults: Array.isArray(d.faults) ? d.faults.map(String) : (typeof d.faults === 'string' ? d.faults.split('، ').filter(Boolean) : []),
      faultNotes: String(d.faultNotes != null ? d.faultNotes : ''),
      technician: String(d.technician != null ? d.technician : (r.technician || '')),
      photos: Array.isArray(d.photos) ? d.photos : []
    }));
  }
  r.devices = rawDevs;

  // Unify Device Model: r.devices is the single source of truth
  if(r.activeDeviceIndex == null || r.activeDeviceIndex < 0 || r.activeDeviceIndex >= r.devices.length){
    r.activeDeviceIndex = 0;
  }
  try {
    Object.defineProperty(r, 'device', {
      configurable: true,
      enumerable: true,
      get() {
        if(!this.devices || !this.devices.length) return {};
        const idx = (this.activeDeviceIndex != null && this.activeDeviceIndex >= 0 && this.activeDeviceIndex < this.devices.length) ? this.activeDeviceIndex : 0;
        return this.devices[idx] || this.devices[0] || {};
      },
      set(val) {
        if(!this.devices) this.devices = [];
        const idx = (this.activeDeviceIndex != null && this.activeDeviceIndex >= 0) ? this.activeDeviceIndex : 0;
        this.devices[idx] = val;
      }
    });
  } catch(e){}

  if(r.devices.length === 1){
    const d0 = r.devices[0];
    if(Array.isArray(d0.faults) && d0.faults.length && (!r.faults || !r.faults.length)){
      r.faults = [...d0.faults];
    }
    if(d0.faultNotes && !r.faultNotes) r.faultNotes = d0.faultNotes;
    if(d0.photos && d0.photos.length && (!r.photos || !r.photos.length)){
      r.photos = d0.photos;
    } else if(r.photos && r.photos.length && (!d0.photos || !d0.photos.length)){
      d0.photos = r.photos;
    }
  }

  // Normalize Warranty
  r.warrantyMonths = Number(r.warrantyMonths != null ? r.warrantyMonths : (r.WarrantyMonths != null ? r.WarrantyMonths : 3));
  if(isNaN(r.warrantyMonths) || r.warrantyMonths < 0) r.warrantyMonths = 3;
  r.WarrantyMonths = r.warrantyMonths;

  r.warrantyEnd = r.warrantyEnd || r.WarrantyEnd || computeWarrantyEndDate(r.deliveryDate || r.date, r.warrantyMonths);
  r.WarrantyEnd = r.warrantyEnd;

  // Normalize Customer Approval
  if(!r.customerApproval){
    const rawA = r.CustomerApprovalJSON || r.customerApprovalJSON || r.CustomerApproval;
    if(rawA && typeof rawA === 'object'){
      r.customerApproval = rawA;
    } else if(typeof rawA === 'string' && rawA.trim()){
      try { const p = JSON.parse(rawA); if(p && typeof p === 'object') r.customerApproval = p; } catch(e){}
    }
  }
  if(r.customerApproval && typeof r.customerApproval === 'object'){
    r.customerApproval.approved = r.customerApproval.approved !== false;
    r.customerApproval.approverName = String(r.customerApproval.approverName || (r.customer && r.customer.name) || '');
    r.customerApproval.channel = String(r.customerApproval.channel || 'هاتف');
    r.customerApproval.approvedCost = Number(r.customerApproval.approvedCost != null ? r.customerApproval.approvedCost : (r.cost || 0));
    r.customerApproval.approvedAt = String(r.customerApproval.approvedAt || r.updatedAt || r.date || '');
    r.customerApproval.recordedBy = String(r.customerApproval.recordedBy || (state.user && state.user.name) || 'نظام');
    r.customerApproval.notes = String(r.customerApproval.notes || '');
  }

  return r;
}

/* Safe universal receipt finder by String ID or Receipt Number */
function findReceiptByIdOrNum(queryId, queryNum){
  if(queryId == null && queryNum == null) return null;
  const qId = queryId != null ? String(queryId).trim().toLowerCase() : '';
  const qNum = queryNum != null ? String(queryNum).trim().toLowerCase() : '';
  if(!qId && !qNum) return null;

  const found = (state.receipts || []).find(x => {
    if(!x) return false;
    const xId = String(x.id != null ? x.id : (x.ID != null ? x.ID : (x['رقم الجهاز'] || ''))).trim().toLowerCase();
    const xNum = String(x.receiptNumber != null ? x.receiptNumber : (x.ReceiptNumber != null ? x.ReceiptNumber : (x['رقم الإيصال'] || (x['رقم الايصال'] || '')))).trim().toLowerCase();
    
    if(qId && (xId === qId || xNum === qId)) return true;
    if(qNum && (xId === qNum || xNum === qNum)) return true;
    return false;
  });
  return found ? normalizeReceipt(found) : null;
}

/* Entity Loaders */
async function loadSettings(){
  let s = {};
  try {
    s = (await apiGet('getSettings')) || {};
  } catch(e){}
  if(!state.settings) state.settings = {};

  // Parse JSON fields if they come as string from Google Sheets / remote
  ['printers', 'pos', 'knownWindowsPrinters', 'waTemplates', 'brands', 'commonFaults'].forEach(k => {
    if(s[k] && typeof s[k] === 'string'){
      try { s[k] = JSON.parse(s[k]); } catch(e){}
    }
  });

  // Restore persistent local printer configuration if remote has none or is offline
  try {
    const localPrn = localStorage.getItem('microerp_printers_settings');
    if(localPrn){
      const parsedPrn = JSON.parse(localPrn);
      s.printers = { ...(s.printers || {}), ...parsedPrn };
    }
    const localKnown = localStorage.getItem('microerp_known_printers');
    if(localKnown){
      const parsedKnown = JSON.parse(localKnown);
      if(!Array.isArray(s.knownWindowsPrinters) || s.knownWindowsPrinters.length === 0){
        s.knownWindowsPrinters = parsedKnown;
      }
    }
  } catch(e){}

  state.settings = { ...state.settings, ...s };
  if(!state.settings.shopName) state.settings.shopName = 'صيانة ميكروتك';
  setCache('settings', state.settings);
  return state.settings;
}

async function saveSettingRemote(key, value){
  if(!state.settings) state.settings = {};
  state.settings[key] = value;
  setCache('settings', state.settings);

  // Dedicated permanent local storage backups
  if(key === 'printers'){
    try { localStorage.setItem('microerp_printers_settings', typeof value === 'string' ? value : JSON.stringify(value)); } catch(e){}
  }
  if(key === 'knownWindowsPrinters'){
    try { localStorage.setItem('microerp_known_printers', typeof value === 'string' ? value : JSON.stringify(value)); } catch(e){}
  }

  return apiPost('saveSetting', {key, value});
}

function getReceiptPayments(r){
  if(!r) return [];
  const targetId = typeof r === 'object' ? String(r.id||'').trim() : String(r).trim();
  const targetNum = typeof r === 'object' && r.receiptNumber ? String(r.receiptNumber).trim() : '';
  return (state.payments||[]).filter(p => {
    const pId = String(p.ReceiptID||'').trim();
    return (targetId && pId === targetId) || (targetNum && pId === targetNum);
  });
}

async function loadPayments(receiptId){
  if(receiptId){
    return getReceiptPayments(receiptId);
  }
  const rows = await apiGet('getPayments');
  if(Array.isArray(rows)){
    state.payments = rows;
    setCache('payments', rows);
  }
  return state.payments;
}
// Dedup guard map to prevent duplicate payments within 15 seconds
const _recentPaymentGuards = new Map();

async function savePaymentRemote(receiptId, amount, note, paymentMethod){
  const payMethod = paymentMethod || 'نقدي (كاش)';
  const numAmt = Number(amount);
  const guardKey = `${String(receiptId).trim()}_${numAmt}_${payMethod}_${String(note||'').trim()}`;
  const now = Date.now();
  if(_recentPaymentGuards.has(guardKey) && (now - _recentPaymentGuards.get(guardKey)) < 15000){
    console.warn(`[savePaymentRemote] Duplicate payment suppressed for guardKey: ${guardKey}`);
    return { ok: true, duplicateSuppressed: true };
  }
  _recentPaymentGuards.set(guardKey, now);

  const nowDate = new Date();
  const dateStr = (typeof localDateStr === 'function') ? localDateStr() : nowDate.toISOString().slice(0,10);
  const timeStr = (typeof localTimeStr === 'function') ? localTimeStr() : nowDate.toTimeString().slice(0, 8);
  const clientRef = `pay_${receiptId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const payment = {
    ID: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    ClientRef: clientRef,
    ReceiptID: receiptId,
    Date: dateStr,
    Time: timeStr,
    Amount: numAmt,
    Note: note || '',
    By: state.user ? state.user.name : 'نظام',
    PaymentMethod: payMethod,
    ShiftID: state.activeShift ? state.activeShift.id : ''
  };
  state.payments.push(payment);
  setCache('payments', state.payments);
  recordAuditLog('تحصيل دفعة مالية', 'الخزينة', `تحصيل دفعة بقيمة ${amount} ج.م للإيصال (${receiptId}) - طريقة الدفع: ${payMethod} - البيان: ${note||'دفعة'}`, receiptId);
  
  // Auto Journal Entry: Route debit account based on payment method
  const pLow = String(payMethod).toLowerCase();
  const isCredit = pLow.includes('آجل') || pLow.includes('اجل') || pLow.includes('credit');
  const isBankOrWallet = pLow.includes('فيزا') || pLow.includes('card') || pLow.includes('انستاباي') || pLow.includes('إنستاباي') || pLow.includes('instapay') || pLow.includes('محفظ') || pLow.includes('فودافون') || pLow.includes('vodafone');
  
  const debitAccCode = isCredit ? '1103' : (isBankOrWallet ? '1102' : '1101');
  const debitAccName = isCredit ? 'العملاء والمدينون' : (isBankOrWallet ? 'البنك والحسابات الإلكترونية والمحافظ' : 'الخزينة الرئيسية (النقدية)');

  // F2: Determine credit account based on delivery status
  // Deposits prior to delivery are liabilities (2102). Debt settlements after delivery clear receivables (1103).
  // Payments NEVER credit 4101 directly to prevent revenue duplication.
  const rPayment = (state.receipts||[]).find(x => String(x.id) === String(receiptId) || String(x.receiptNumber) === String(receiptId));
  const isDeliveredPayment = rPayment && (rPayment.status === 'تم التسليم' || rPayment.status === 'delivered');
  const creditAccCode = isDeliveredPayment ? '1103' : '2102';
  const creditAccName = isDeliveredPayment ? 'العملاء والمدينون' : 'أمانات ومقدمات عملاء الصيانة';
  const rNumPayment = rPayment ? (rPayment.receiptNumber || rPayment.id) : receiptId;
  const paymentDesc = isDeliveredPayment
    ? `سداد مديونية صيانة [${payMethod}] (${note || 'سداد متبقي'}) - إيصال #${rNumPayment}`
    : `تحصيل دفعة مقدمة صيانة [${payMethod}] (${note || 'مقدم صيانة'}) - إيصال #${rNumPayment}`;

  recordAutoJournalEntry(
    paymentDesc,
    'Receipt_Payment',
    payment.ID,
    [
      {AccountCode: debitAccCode, AccountName: debitAccName, Debit: numAmt, Credit: 0, Notes: `تحصيل عبر ${payMethod}`},
      {AccountCode: creditAccCode, AccountName: creditAccName, Debit: 0, Credit: numAmt, Notes: isDeliveredPayment ? `سداد مديونية إيصال #${rNumPayment}` : `دفعة مقدمة إيصال #${rNumPayment}`}
    ]
  ).catch(e=>{});
  return apiPost('savePayment', {id: payment.ID, clientRef: payment.ClientRef, receiptId, amount: payment.Amount, note: payment.Note, paymentMethod: payMethod, date: payment.Date, time: payment.Time, shiftId: payment.ShiftID, user: payment.By});
}

async function deletePaymentRemote(paymentId){
  const p = (state.payments||[]).find(x => String(x.ID) === String(paymentId));
  if(!p) return { ok: false, error: 'الدفعة غير موجودة' };
  
  // 1. Remove from state.payments and update cache
  state.payments = state.payments.filter(x => String(x.ID) !== String(paymentId));
  setCache('payments', state.payments);

  // 2. Adjust corresponding receipt if it exists
  const r = (state.receipts||[]).find(x => String(x.id) === String(p.ReceiptID) || String(x.receiptNumber) === String(p.ReceiptID));
  if(r){
    const totalDue = Number(r.cost||0) + Number(r.partsCost||0) + Number(r.otherAccountAmount||0);
    r.deposit = Math.max(0, Number(r.deposit || 0) - Number(p.Amount || 0));
    if(r.deposit < totalDue){
      r.paid = false;
    }
    setCache('receipts', state.receipts);
    try { await saveReceiptRemote(r); } catch(e){}
  }

  // 3. Reverse Auto-Journal Entry (F2: Reversal routes to 2102 or 1103 - NEVER 4101)
  const payMethod = p.PaymentMethod || 'نقدي (كاش)';
  const pLow = String(payMethod).toLowerCase();
  const isCredit = pLow.includes('آجل') || pLow.includes('اجل') || pLow.includes('credit');
  const isBankOrWallet = pLow.includes('فيزا') || pLow.includes('card') || pLow.includes('انستاباي') || pLow.includes('إنستاباي') || pLow.includes('instapay') || pLow.includes('محفظ') || pLow.includes('فودافون') || pLow.includes('vodafone');
  const debitAccCode = isCredit ? '1103' : (isBankOrWallet ? '1102' : '1101');
  const debitAccName = isCredit ? 'العملاء والمدينون' : (isBankOrWallet ? 'البنك والحسابات الإلكترونية والمحافظ' : 'الخزينة الرئيسية (النقدية)');

  const isDelivered = r && (r.status === 'تم التسليم' || r.status === 'delivered');
  const origCreditCode = isDelivered ? '1103' : '2102';
  const origCreditName = isDelivered ? 'العملاء والمدينون' : 'أمانات ومقدمات عملاء الصيانة';

  recordAutoJournalEntry(
    `إلغاء / عكس تحصيل صيانة [${payMethod}] (${p.Note || 'دفعة إيصال'})`,
    'Receipt_Payment_Void',
    p.ID || p.ReceiptID,
    [
      {AccountCode: origCreditCode, AccountName: origCreditName, Debit: Number(p.Amount), Credit: 0, Notes: `عكس تحصيل دفعة صيانة: ${p.ReceiptID}`},
      {AccountCode: debitAccCode, AccountName: debitAccName, Debit: 0, Credit: Number(p.Amount), Notes: `عكس تحصيل عبر ${payMethod}`}
    ]
  ).catch(e=>{});

  recordAuditLog('حذف دفعة مالية', 'الخزينة', `تم حذف دفعة بقيمة ${p.Amount} ج.م للإيصال (${p.ReceiptID}) بواسطة ${state.user ? state.user.name : 'المدير'} وتصحيح رصيد الخزينة والإيصال`, p.ReceiptID);

  // 4. Send to backend
  return apiPost('deletePayment', { id: p.ID, receiptId: p.ReceiptID, amount: p.Amount, date: p.Date, role: state.user ? state.user.role : 'admin' });
}

function detectDuplicatePayments(payments = state.payments || []){
  const seen = new Map();
  const duplicates = [];
  (payments || []).forEach(p => {
    const key = `${String(p.ReceiptID||'').trim()}_${Number(p.Amount||0)}_${String(p.Date||'').slice(0,10)}_${String(p.Note||'').trim()}_${String(p.PaymentMethod||'').trim()}`;
    if(seen.has(key)){
      duplicates.push({ original: seen.get(key), duplicate: p });
    } else {
      seen.set(key, p);
    }
  });
  return duplicates;
}

function openDuplicatePaymentsReviewModal(onDone){
  const duplicates = detectDuplicatePayments(state.payments || []);
  if(!duplicates.length){
    showToast('لا توجد أي دفعات مكررة في النظام', 'success');
    return;
  }

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.zIndex = '12500';

  function renderContent(){
    const currentDups = detectDuplicatePayments(state.payments || []);
    if(!currentDups.length){
      overlay.remove();
      showToast('تمت معالجة وتدقيق جميع الدفعات بنجاح', 'success');
      if(typeof onDone === 'function') onDone();
      else if(state.currentSection === 'daily') renderDailyJournalPage(document.getElementById('main'));
      else render();
      return;
    }

    overlay.innerHTML = `
      <div class="modal-content" style="max-width:850px;max-height:90vh;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid var(--line);padding-bottom:12px;margin-bottom:14px;">
          <div>
            <h3 style="margin:0;font-size:16.5px;font-weight:900;color:var(--ink);display:flex;align-items:center;gap:8px;">
              <span>${getSvgIcon('alert', 18)}</span>
              <span>تدقيق وممراجعة الدفعات المشتبه بتكرارها (Treasury Audit)</span>
            </h3>
            <div style="font-size:12px;color:var(--ink-secondary);margin-top:3px;">
              تم رصد <b>${currentDups.length}</b> دفعة مشتبه بتكرارها لنفس الإيصال والمبلغ والتاريخ.
            </div>
          </div>
          <button class="btn btn-ghost btn-xs" id="closeDupRevModal" style="font-size:18px;line-height:1;">&times;</button>
        </div>

        <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:6px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:#92400e;line-height:1.5;">
          <b>⚠️ تنبيه الرقابة المالية:</b> بعض المعاملات قد تمثل أقساطاً متعددة حقيقية سددها العميل في نفس اليوم بنفس القيمة (كأقساط صيانة مجزأة). لن يتم حذف أي دفعة تلقائياً. راجع تفاصيل كل دفعة بالجدول أدناه واحذف فقط ما تتأكد أنه تكرار غير مقصود.
        </div>

        <div class="table-wrap" style="margin-bottom:16px;">
          <table style="width:100%;font-size:11.5px;">
            <thead>
              <tr style="background:#f1f5f9;color:#334155;">
                <th style="padding:6px 10px;text-align:right;">الإيصال</th>
                <th style="padding:6px 10px;text-align:center;">المبلغ</th>
                <th style="padding:6px 10px;text-align:center;">التاريخ والوقت</th>
                <th style="padding:6px 10px;text-align:center;">الوسيلة</th>
                <th style="padding:6px 10px;text-align:right;">البيان</th>
                <th style="padding:6px 10px;text-align:center;">المسؤول</th>
                <th style="padding:6px 10px;text-align:center;width:120px;">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              ${currentDups.map((d, idx) => {
                const orig = d.original;
                const dup = d.duplicate;
                return `
                  <tr style="background:#f8fafc;border-top:1.5px solid #cbd5e1;">
                    <td style="padding:6px 10px;font-weight:700;">
                      <span class="badge" style="background:#dbeafe;color:#1e40af;margin-left:4px;">الأصلية</span>
                      #${orig.ReceiptID}
                    </td>
                    <td style="padding:6px 10px;text-align:center;" class="mono font-bold">${Number(orig.Amount).toLocaleString()} ج.م</td>
                    <td style="padding:6px 10px;text-align:center;" class="mono">${orig.Date} ${orig.Time || ''}</td>
                    <td style="padding:6px 10px;text-align:center;">${escapeHtml(orig.PaymentMethod || 'نقدي')}</td>
                    <td style="padding:6px 10px;">${escapeHtml(orig.Note || '-')}</td>
                    <td style="padding:6px 10px;text-align:center;">${escapeHtml(orig.By || '-')}</td>
                    <td style="padding:6px 10px;text-align:center;color:#059669;font-weight:700;">احتفاظ</td>
                  </tr>
                  <tr style="background:#fef2f2;border-bottom:1.5px solid #fca5a5;">
                    <td style="padding:6px 10px;font-weight:700;">
                      <span class="badge" style="background:#fee2e2;color:#991b1b;margin-left:4px;">المكررة المشتبه بها</span>
                      #${dup.ReceiptID}
                    </td>
                    <td style="padding:6px 10px;text-align:center;" class="mono font-bold" style="color:#b91c1c;">${Number(dup.Amount).toLocaleString()} ج.م</td>
                    <td style="padding:6px 10px;text-align:center;" class="mono">${dup.Date} ${dup.Time || ''}</td>
                    <td style="padding:6px 10px;text-align:center;">${escapeHtml(dup.PaymentMethod || 'نقدي')}</td>
                    <td style="padding:6px 10px;">${escapeHtml(dup.Note || '-')}</td>
                    <td style="padding:6px 10px;text-align:center;">${escapeHtml(dup.By || '-')}</td>
                    <td style="padding:6px 10px;text-align:center;">
                      <button class="btn btn-xs btn-red delete-dup-btn" data-pid="${dup.ID}" style="font-size:11px;padding:3px 8px;">
                        ${getSvgIcon('trash', 12)} حذف المكررة
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:8px;">
          <button class="btn btn-ghost" id="closeDupRevModalBtn">إغلاق</button>
        </div>
      </div>
    `;

    overlay.querySelector('#closeDupRevModal').onclick = () => overlay.remove();
    overlay.querySelector('#closeDupRevModalBtn').onclick = () => overlay.remove();

    overlay.querySelectorAll('.delete-dup-btn').forEach(btn => {
      btn.onclick = async () => {
        const pid = btn.dataset.pid;
        if(!confirm(`هل أنت متأكد من حذف هذه الدفعة المكررة (#${pid})؟\nسيتم تصحيح رصيد الخزينة والإيصال فوراً.`)) return;
        btn.disabled = true;
        btn.textContent = 'جارٍ الحذف...';
        try {
          await deletePaymentRemote(pid);
          showToast('تم حذف الدفعة المكررة بنجاح', 'success');
          renderContent();
        } catch(e) {
          showToast('فشل حذف الدفعة: ' + (e.message || e), 'error');
          btn.disabled = false;
        }
      };
    });
  }

  document.body.appendChild(overlay);
  renderContent();
}
window.openDuplicatePaymentsReviewModal = openDuplicatePaymentsReviewModal;

async function cleanDuplicatePayments(){
  // Safe redirect to interactive review modal instead of silent blind auto-deletion [F11-f]
  return openDuplicatePaymentsReviewModal();
}

async function loadInventory(){
  const rows = await apiGet('getInventory');
  setCache('inventory', rows);
  return rows;
}
async function saveInventoryItemRemote(item){
  if(!item.ID) item.ID = 'inv_' + Date.now();
  const idx = state.inventory.findIndex(x=>x.ID===item.ID);
  if(idx>-1) state.inventory[idx] = item; else state.inventory.push(item);
  setCache('inventory', state.inventory);
  recordAuditLog('حفظ صنف مخزن', 'المخزن', `تسجيل / تعديل صنف بالمخزن: (${item.Name}) - الكمية: ${item.Quantity} - سعر البيع: ${item.SellPrice} ج.م`, item.ID);
  return apiPost('saveInventoryItem', {data:item});
}
async function deleteInventoryItemRemote(id){
  state.inventory = state.inventory.filter(x=>x.ID!==id);
  setCache('inventory', state.inventory);
  return apiPost('deleteInventoryItem', {id, role: state.user.role});
}
async function deleteItemRemote(id){
  return deleteInventoryItemRemote(id);
}
async function adjustInventoryQtyRemote(id, delta){
  const it = state.inventory.find(x=>x.ID===id);
  if(it) it.Quantity = Number(it.Quantity||0) + Number(delta);
  setCache('inventory', state.inventory);
  recordAuditLog('تعديل رصيد صنف', 'المخزن', `تعديل رصيد الصنف (${it ? it.Name : id}) بفارق (${delta}) - الرصيد الجديد: ${it ? it.Quantity : '-'}`, id);
  return apiPost('adjustInventoryQty', {id, delta});
}
async function refreshInventory(){ state.inventory = await loadInventory(); }

async function loadSales(){
  const rows = await apiGet('getSales');
  setCache('sales', rows);
  return rows;
}
async function saveSaleRemote(itemsSummary, itemsJson, total, customerName, customerPhone, paymentMethod, amountPaid, itemsList = [], taxAmount = 0, changeDue = null){
  const now = new Date();
  const dateStr = (typeof localDateStr === 'function') ? localDateStr() : now.toISOString().slice(0,10);
  const timeStr = (typeof localTimeStr === 'function') ? localTimeStr() : now.toTimeString().slice(0, 8);
  const finalPaid = amountPaid != null ? Number(amountPaid) : Number(total || 0);
  const finalChangeDue = changeDue != null ? Number(changeDue) : Math.max(0, round2(finalPaid - Number(total || 0)));

  const sale = {
    ID: 'sale_' + Date.now(),
    Date: dateStr,
    Time: timeStr,
    ItemsSummary: itemsSummary,
    ItemsJSON: itemsJson||'',
    Total: Number(total||0),
    TaxAmount: Math.max(0, Number(taxAmount||0)),
    PaymentMethod: paymentMethod||'نقدي',
    AmountPaid: finalPaid,
    ChangeDue: finalChangeDue,
    CustomerName: customerName||'',
    CustomerPhone: customerPhone||'',
    By: state.user ? state.user.name : 'نظام',
    ShiftID: state.activeShift ? state.activeShift.id : ''
  };
  state.sales.push(sale);
  setCache('sales', state.sales);

  // Auto-ensure customer is in directory if non-walk-in
  if(customerName && customerName !== 'عميل زائر' && customerName !== 'عميل' && customerName !== 'زبون'){
    const cPhone = (customerPhone || '').trim();
    const cNameLow = customerName.trim().toLowerCase();
    const existing = (state.customers || []).find(c => {
      if(cPhone && cPhone !== '0000000000' && c.phone === cPhone) return true;
      if((c.name||'').trim().toLowerCase() === cNameLow) return true;
      return false;
    });
    if(!existing){
      const newC = { title: '', name: customerName.trim(), phone: cPhone, email: '', taxNumber: '', address: '' };
      state.customers.push(newC);
      setCache('customers', state.customers);
      try { saveCustomerRemote(newC); } catch(e){}
    } else if(cPhone && cPhone !== '0000000000' && (!existing.phone || existing.phone === '0000000000')){
      existing.phone = cPhone;
      setCache('customers', state.customers);
      try { saveCustomerRemote(existing); } catch(e){}
    }
  }

  recordAuditLog('مبيعات كاشير POS', 'مبيعات', `فاتورة مبيعات POS بقيمة ${total} ج.م للعميل (${customerName||'عميل زائر'}) - الأصناف: ${itemsSummary}`, sale.ID);

  // Calculate Cost of Goods Sold (COGS) using costAtSale [F4]
  let zeroCostFound = false;
  const zeroCostItems = [];
  const cogsAmount = (itemsList || []).reduce((s, c) => {
    if (c.itemId && String(c.itemId).startsWith('srv_')) return s;
    const invItem = (state.inventory || []).find(x => String(x.ID) === String(c.itemId || c.id));
    const buyPrice = Number(c.costAtSale != null ? c.costAtSale : (c.purchasePrice != null ? c.purchasePrice : (invItem ? invItem.PurchasePrice : 0))) || 0;
    if (buyPrice <= 0 && c.itemId && !String(c.itemId).startsWith('srv_')) {
      zeroCostFound = true;
      zeroCostItems.push(c.name || (invItem ? invItem.Name : c.itemId));
    }
    return s + round2(buyPrice * Number(c.qty || 1));
  }, 0);

  if (zeroCostFound) {
    recordAuditLog('تحذير تكلفة المخزون', 'المخزن', `أصناف مباعة بدون سعر تكلفة مسجل: (${zeroCostItems.join('، ')}) في فاتورة #${sale.ID} - يرجى مراجعة وتحديث أسعار التكلفة بالمخزن`, sale.ID);
  }

  // Payment account routing
  const pLow = String(paymentMethod || '').toLowerCase();
  const isBankOrWallet = pLow.includes('فيزا') || pLow.includes('card') || pLow.includes('انستاباي') || pLow.includes('إنستاباي') || pLow.includes('instapay') || pLow.includes('محفظ') || pLow.includes('فودافون') || pLow.includes('vodafone');
  const isCredit = pLow.includes('آجل') || pLow.includes('اجل');
  const debitAccCode = isCredit ? '1103' : (isBankOrWallet ? '1102' : '1101');
  const debitAccName = isCredit ? 'العملاء والمدينون' : (isBankOrWallet ? 'البنك والحسابات الإلكترونية والمحافظ' : 'الخزينة الرئيسية (النقدية)');

  // F3: Dual Journal Entry: 1) Cash & Net Revenue + VAT  2) COGS & Inventory Asset
  const taxAmt = Math.max(0, Number(taxAmount || 0));
  const netRevenue = Math.max(0, Math.round((Number(total) - taxAmt) * 100) / 100);

  // Clamped Paid vs Credit routing [F11-b]
  const numTotal = Number(total || 0);
  const paidClamped = Math.min(numTotal, Math.max(0, round2(finalPaid - finalChangeDue)));
  const remainingCredit = Math.max(0, round2(numTotal - paidClamped));

  const journalLines = [];
  if (paidClamped > 0 && !isCredit) {
    journalLines.push({
      AccountCode: debitAccCode,
      AccountName: debitAccName,
      Debit: paidClamped,
      Credit: 0,
      Notes: `مقبوضات مبيعات [${paymentMethod || 'نقدي'}]`
    });
  }
  if (isCredit) {
    journalLines.push({
      AccountCode: '1103',
      AccountName: 'العملاء والمدينون',
      Debit: numTotal,
      Credit: 0,
      Notes: `آجل مبيعات POS للعميل (${customerName || 'عميل'})`
    });
  } else if (remainingCredit > 0) {
    journalLines.push({
      AccountCode: '1103',
      AccountName: 'العملاء والمدينون',
      Debit: remainingCredit,
      Credit: 0,
      Notes: `متبقي آجل مبيعات POS للعميل (${customerName || 'عميل'})`
    });
  }

  journalLines.push({
    AccountCode: '4102',
    AccountName: 'إيرادات مبيعات بضائع وقطع غيار',
    Debit: 0,
    Credit: netRevenue,
    Notes: itemsSummary
  });

  if(taxAmt > 0){
    journalLines.push({
      AccountCode: '2104',
      AccountName: 'ضريبة القيمة المضافة المستحقة (مخرجات)',
      Debit: 0,
      Credit: taxAmt,
      Notes: `ضريبة مبيعات فاتورة: ${sale.ID}`
    });
  }
  if(cogsAmount > 0){
    journalLines.push(
      {AccountCode: '5102', AccountName: 'تكلفة البضاعة المباعة (POS)', Debit: Number(cogsAmount), Credit: 0, Notes: `تكلفة مبيعات فاتورة: ${sale.ID}`},
      {AccountCode: '1104', AccountName: 'مخزون البضائع وقطع الغيار', Debit: 0, Credit: Number(cogsAmount), Notes: `صرف مخزون أصناف مباعة (${itemsSummary})`}
    );
  }

  const journalEntryObj = {
    ID: 'je_' + Date.now() + '_' + Math.floor(Math.random()*1000),
    EntryNumber: 'JE-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4),
    Date: sale.Date,
    Description: `فاتورة مبيعات POS [${paymentMethod || 'نقدي'}] (${itemsSummary})`,
    ReferenceType: 'POS_Sale',
    ReferenceID: sale.ID,
    LinesJSON: JSON.stringify(journalLines),
    Lines: journalLines,
    TotalDebit: Number(total) + Number(cogsAmount),
    TotalCredit: Number(total) + Number(cogsAmount),
    By: sale.By
  };
  if(!state.journalEntries) state.journalEntries = [];
  state.journalEntries.push(journalEntryObj);
  setCache('journal', state.journalEntries);

  const res = await apiPost('saveSale', {
    id: sale.ID,
    itemsSummary,
    itemsJson,
    total,
    taxAmount: sale.TaxAmount,
    customerName,
    customerPhone,
    paymentMethod,
    amountPaid: sale.AmountPaid,
    changeDue: sale.ChangeDue,
    shiftId: sale.ShiftID,
    time: sale.Time,
    date: sale.Date,
    user: sale.By,
    items: itemsList.map(c => ({ itemId: c.itemId || c.id, qty: c.qty, price: c.price, purchasePrice: c.purchasePrice })),
    journalEntry: journalEntryObj
  });
  return { sale: res.sale || sale };
}

async function loadQuotations(){
  const rows = await apiGet('getQuotations');
  setCache('quotations', rows);
  return rows;
}
async function saveQuotationRemote(q){
  if(!q.ID) q.ID = 'quo_' + Date.now();
  if(!q.Payments) q.Payments = [];
  if(q.PaidAmount == null) q.PaidAmount = q.Payments.reduce((s,p)=>s+Number(p.Amount||0),0);
  
  const idx = state.quotations.findIndex(x => String(x.ID) === String(q.ID));
  if(idx > -1) state.quotations[idx] = q;
  else state.quotations.push(q);
  setCache('quotations', state.quotations);

  // F7: Auto Journal Entry when project/quotation is executed and delivered
  if(q.Status === 'تم التنفيذ والتسليم' || q.Status === 'مكتمل'){
    const total = Number(q.Total || 0);
    if(total > 0 && !(state.journalEntries || []).some(e => e.ReferenceType === 'Quotation_Delivery' && String(e.ReferenceID) === String(q.ID))){
      const depositPaid = Math.min(total, Number(q.PaidAmount || 0));
      const remainingDebt = Math.max(0, total - depositPaid);
      const lines = [];
      if(depositPaid > 0){
        lines.push({ AccountCode: '2102', AccountName: 'أمانات ومقدمات عملاء الصيانة والمشاريع', Debit: depositPaid, Credit: 0, Notes: `تسوية دفعات مقدمة مشروع #${String(q.ID).slice(-8)}` });
      }
      if(remainingDebt > 0){
        lines.push({ AccountCode: '1103', AccountName: 'العملاء والمدينون', Debit: remainingDebt, Credit: 0, Notes: `مستحقات آجل مشروع #${String(q.ID).slice(-8)} (${q.ClientName || ''})` });
      }
      const revAccCode = q.AccountCode || '4103';
      const revAccName = (typeof getAccountName === 'function') 
        ? getAccountName(revAccCode, 'إيرادات تركيب كاميرات وأنظمة') 
        : 'إيرادات تركيب كاميرات وأنظمة';
      lines.push({ AccountCode: revAccCode, AccountName: revAccName, Debit: 0, Credit: total, Notes: `إيراد تنفيذ مشروع/عرض سعر #${String(q.ID).slice(-8)} (${q.ClientName || ''})` });

      recordAutoJournalEntry(
        `إثبات إيراد تسليم مشروع/عرض سعر (#${String(q.ID).slice(-8)} - ${q.ClientName || ''})`,
        'Quotation_Delivery',
        q.ID,
        lines
      ).catch(e => console.warn('Quotation delivery journal error:', e));
    }
  }

  try {
    const res = await apiPost('saveQuotation', {data:q});
    return { quotation: res.quotation || q };
  } catch(e) {
    enqueueOfflineTask({ type:'saveQuotation', data:q });
    return { quotation: q };
  }
}

async function saveQuotationPaymentRemote(quotationId, amount, note){
  const q = state.quotations.find(x => String(x.ID) === String(quotationId));
  if(!q) throw new Error('تعذر العثور على عرض السعر المحدد');
  if(!q.Payments) q.Payments = [];
  const numAmt = Number(amount) || 0;
  if(numAmt <= 0) throw new Error('يرجى إدخال مبلغ صحيح للدفعة');

  const p = {
    ID: 'qp_' + Date.now() + '_' + Math.floor(Math.random()*1000),
    QuotationID: quotationId,
    Date: new Date().toISOString().slice(0, 10),
    Amount: numAmt,
    Note: note || 'دفعة / عربون من حساب عرض السعر',
    By: state.user ? state.user.name : 'نظام'
  };

  q.Payments.push(p);
  q.PaidAmount = (Number(q.PaidAmount) || 0) + numAmt;
  if(q.Status === 'معلق') q.Status = 'مقبول / جاري التنفيذ';
  if(q.PaidAmount >= Number(q.Total || 0)) q.Status = 'تم التنفيذ والتسليم';

  // Save to general payments
  if(!state.payments) state.payments = [];
  state.payments.push({
    ID: p.ID,
    ReceiptID: 'QUOTE_' + String(quotationId).slice(-8),
    Date: p.Date,
    Amount: p.Amount,
    Note: `تحصيل دفعة عرض سعر (${q.ClientName}) - ${p.Note}`,
    By: p.By
  });
  setCache('payments', state.payments);

  // F7: Auto Journal Entry for Quotation payment
  // Pre-completion payments are customer deposits / advances (2102) - not direct revenue
  const isDelivered = (q.Status === 'تم التنفيذ والتسليم' || q.Status === 'مكتمل');
  const creditCode = isDelivered ? '1103' : '2102';
  const creditName = isDelivered ? 'العملاء والمدينون' : 'أمانات ومقدمات عملاء الصيانة والمشاريع';

  recordAutoJournalEntry(
    `تحصيل دفعة مشروع/عرض سعر (#${String(quotationId).slice(-8)} - ${q.ClientName})`,
    'Quotation_Payment',
    p.ID,
    [
      { AccountCode: '1101', AccountName: 'الخزينة الرئيسية (النقدية)', Debit: numAmt, Credit: 0, Notes: p.Note },
      { AccountCode: creditCode, AccountName: creditName, Debit: 0, Credit: numAmt, Notes: `عرض سعر #${String(quotationId).slice(-8)}` }
    ]
  ).catch(e=>{});

  await saveQuotationRemote(q);
  return q;
}

async function saveExpenseRemote(exp){
  if(!exp.ID) exp.ID = 'exp_' + Date.now();
  if(!exp.Date) exp.Date = new Date().toISOString().slice(0,10);
  if(!exp.Time) exp.Time = new Date().toTimeString().slice(0, 8);
  exp.By = state.user ? state.user.name : 'نظام';
  if(!exp.ShiftID && state.activeShift) exp.ShiftID = state.activeShift.id;
  const idx = state.expenses.findIndex(x=>x.ID===exp.ID);
  if(idx>-1) state.expenses[idx] = exp; else state.expenses.push(exp);
  setCache('expenses', state.expenses);

  // Auto Journal
  const isIncome = exp.Type === 'in' || exp.Type === 'income';
  const isDraw = !isIncome && (exp.Type === 'out' && (exp.Category === 'مسحوبات شخصية' || exp.Category === 'جاري الشركاء' || String(exp.Title||'').includes('مسحوبات')));
  const isPetty = exp.Type === 'petty' || exp.Category === 'بوفيه ونثريات' || exp.Category === 'نثريات';
  const isPosReturn = exp.Category === 'مرتجع مبيعات POS' || exp.AccountCode === '4102-RET' || exp.Type === 'pos_return';
  const isSupplierPayment = exp.Category === 'موردين' || exp.Category === 'الموردين' || exp.Category === 'سداد موردين ومشتريات' || (String(exp.Category||'').includes('مورد')) || exp.Type === 'supplier' || exp.skipAutoJournal || isPosReturn;

  if(isSupplierPayment || isPosReturn || exp.skipAutoJournal){
    // Suppress general operating expense journal entry; handled specifically by the dedicated module (Supplier Payments, POS Returns, etc.)
  } else if(isIncome){
    const pLow = String(exp.PaymentMethod || 'نقدي').toLowerCase();
    const isBank = pLow.includes('فيزا') || pLow.includes('card') || pLow.includes('انستاباي') || pLow.includes('إنستاباي') || pLow.includes('محفظ') || pLow.includes('فودافون');
    const debitCode = isBank ? '1102' : '1101';
    const debitName = isBank ? 'البنك والحسابات الإلكترونية والمحافظ' : 'الخزينة الرئيسية (النقدية)';
    recordAutoJournalEntry(
      `إيداع وارد: ${exp.Title}`,
      'CashIn',
      exp.ID,
      [
        {AccountCode:debitCode, AccountName:debitName, Debit:Number(exp.Amount), Credit:0, Notes:exp.Title},
        {AccountCode:'42', AccountName:'إيرادات أخرى متنوعة', Debit:0, Credit:Number(exp.Amount), Notes:exp.Notes||exp.Title}
      ]
    ).catch(e=>{});
  } else if(isDraw){
    const pLow = String(exp.PaymentMethod || 'نقدي').toLowerCase();
    const isBank = pLow.includes('فيزا') || pLow.includes('card') || pLow.includes('انستاباي') || pLow.includes('إنستاباي') || pLow.includes('محفظ') || pLow.includes('فودافون');
    const creditCode = isBank ? '1102' : '1101';
    const creditName = isBank ? 'البنك والحسابات الإلكترونية والمحافظ' : 'الخزينة الرئيسية (النقدية)';
    recordAutoJournalEntry(
      `منصرف مسحوبات: ${exp.Title}`,
      'CashOut',
      exp.ID,
      [
        {AccountCode:'3103', AccountName:'جاري الشركاء والمسحوبات', Debit:Number(exp.Amount), Credit:0, Notes:exp.Title},
        {AccountCode:creditCode, AccountName:creditName, Debit:0, Credit:Number(exp.Amount), Notes:exp.Notes||exp.Title}
      ]
    ).catch(e=>{});
  } else {
    const expAccCode = EXPENSE_ACCOUNT_MAP[exp.Category] || (isPetty ? '5204' : '52');
    const expAcc = state.accounts.find(a=>a.Code===expAccCode) || {Name: isPetty ? 'بوفيه ونثريات وضيافة' : 'المصروفات التشغيلية'};
    const pLow = String(exp.PaymentMethod || 'نقدي').toLowerCase();
    const isBank = pLow.includes('فيزا') || pLow.includes('card') || pLow.includes('انستاباي') || pLow.includes('إنستاباي') || pLow.includes('محفظ') || pLow.includes('فودافون');
    const creditCode = isBank ? '1102' : '1101';
    const creditName = isBank ? 'البنك والحسابات الإلكترونية والمحافظ' : 'الخزينة الرئيسية (النقدية)';
    recordAutoJournalEntry(
      `${isPetty?'نثريات':'مصروف'}: ${exp.Title} (${exp.Category})`,
      'Expense',
      exp.ID,
      [
        {AccountCode:expAccCode, AccountName:expAcc.Name, Debit:Number(exp.Amount), Credit:0, Notes:exp.Notes||exp.Title},
        {AccountCode:creditCode, AccountName:creditName, Debit:0, Credit:Number(exp.Amount), Notes: `سداد عبر ${exp.PaymentMethod || 'نقدي'}`}
      ]
    ).catch(e=>{});
  }

  return apiPost('saveExpense', {data: exp, user: exp.By});
}
async function deleteExpenseRemote(id){
  state.expenses = state.expenses.filter(x=>x.ID!==id);
  setCache('expenses', state.expenses);
  return apiPost('deleteExpense', {id, role: state.user.role});
}

async function loadServices(){
  const rows = await apiGet('getServices');
  setCache('services', rows);
  return rows;
}
async function loadPurchases(){
  const rows = await apiGet('getPurchases');
  setCache('purchases', rows);
  return rows;
}
async function savePurchaseRemote(p, itemsList = []){
  if(!p.ID) p.ID = 'pur_' + Date.now();
  if(!p.Date) p.Date = new Date().toISOString().slice(0, 10);
  p.By = state.user ? state.user.name : 'نظام';
  p.Total = Number(p.Total || 0);
  p.AmountPaid = p.AmountPaid != null ? Number(p.AmountPaid) : p.Total;
  const remaining = Math.max(0, p.Total - p.AmountPaid);

  const idx = state.purchases.findIndex(x => String(x.ID) === String(p.ID));
  if(idx > -1) state.purchases[idx] = p;
  else state.purchases.push(p);
  setCache('purchases', state.purchases);

  // Auto-increment local inventory & Moving Weighted Average Cost (WAC) [F4]
  if(Array.isArray(itemsList) && itemsList.length > 0){
    for(const it of itemsList){
      if(!it.itemId) continue;
      const invItem = (state.inventory || []).find(x => String(x.ID) === String(it.itemId));
      if(invItem){
        const oldQty = Number(invItem.Quantity || 0);
        const oldCost = Number(invItem.PurchasePrice || 0);
        const newQty = Number(it.qty || 0);
        const newCost = Number(it.purchasePrice || 0);
        const totalQty = oldQty + newQty;
        invItem.Quantity = totalQty;
        if(newCost > 0){
          invItem.PurchasePrice = totalQty > 0
            ? round4(((Math.max(0, oldQty) * oldCost) + (newQty * newCost)) / totalQty)
            : newCost;
        }
      }
    }
    setCache('inventory', state.inventory);
  }

  // F3: Auto Journal Entry for Purchase with Input VAT routing
  // Dr. 1104 (مخزون البضائع وقطع الغيار): netInventoryCost
  // Dr. 1105 (ضريبة القيمة المضافة القابلة للخصم - مدخلات): taxAmt (if taxAmt > 0)
  // Cr. 1101/1102 (الخزينة/البنك): AmountPaid
  // Cr. 2101 (الموردون والدائنون): Remaining
  const taxAmt = Math.max(0, Number(p.TaxAmount || 0));
  const netInventoryCost = Math.max(0, Math.round((p.Total - taxAmt) * 100) / 100);

  const journalLines = [
    { AccountCode: '1104', AccountName: 'مخزون البضائع وقطع الغيار', Debit: netInventoryCost, Credit: 0, Notes: `شراء وتوريد مخزون (${p.Supplier} - ${p.ItemsSummary})` }
  ];
  if(taxAmt > 0){
    journalLines.push({
      AccountCode: '1105',
      AccountName: 'ضريبة القيمة المضافة القابلة للخصم (مدخلات)',
      Debit: taxAmt,
      Credit: 0,
      Notes: `ضريبة مدخلات مشتريات فاتورة: ${p.ID}`
    });
  }
  if(p.AmountPaid > 0){
    const pLow = String(p.PaymentMethod || 'نقدي').toLowerCase();
    const isBank = pLow.includes('فيزا') || pLow.includes('card') || pLow.includes('انستاباي') || pLow.includes('محفظ') || pLow.includes('فودافون');
    journalLines.push({
      AccountCode: isBank ? '1102' : '1101',
      AccountName: isBank ? 'البنك والحسابات الإلكترونية والمحافظ' : 'الخزينة الرئيسية (النقدية)',
      Debit: 0,
      Credit: p.AmountPaid,
      Notes: `سداد مشتريات للمورد: ${p.Supplier}`
    });
  }
  if(remaining > 0){
    journalLines.push({
      AccountCode: '2101',
      AccountName: 'الموردون والدائنون',
      Debit: 0,
      Credit: remaining,
      Notes: `رصيد آجل لمورد (${p.Supplier}) فاتورة #${String(p.ID).slice(-6)}`
    });
  }

  const je = await recordAutoJournalEntry(
    `فاتورة شراء وتوريد مخزون (${p.Supplier} - ${p.ItemsSummary})`,
    'Purchase',
    p.ID,
    journalLines
  ).catch(e => console.warn('Purchase journal error:', e));

  recordAuditLog('فاتورة شراء', 'المخزن', `تسجيل فاتورة شراء من المورد (${p.Supplier}) بقيمة ${p.Total} ج.م - الأصناف: ${p.ItemsSummary}`, p.ID);

  return apiPost('savePurchase', {
    id: p.ID,
    date: p.Date,
    supplier: p.Supplier,
    supplierId: p.SupplierID || '',
    itemsSummary: p.ItemsSummary,
    total: p.Total,
    taxAmount: taxAmt,
    amountPaid: p.AmountPaid,
    warrantyMonths: p.WarrantyMonths || '',
    items: itemsList,
    journalEntry: je,
    user: p.By
  });
}
async function loadSuppliers(){
  const rows = await apiGet('getSuppliers');
  setCache('suppliers', rows);
  return rows;
}
async function saveSupplierRemote(s){
  if(!s.ID) s.ID = 'sup_' + Date.now();
  if(!s.Title && s.title) s.Title = s.title;
  s.Title = s.Title || '';
  const idx = state.suppliers.findIndex(x => (s.ID && x.ID === s.ID) || (s.Name && x.Name === s.Name));
  if(idx > -1) state.suppliers[idx] = s;
  else state.suppliers.push(s);
  setCache('suppliers', state.suppliers);
  return apiPost('saveSupplier', {data:s});
}

async function loadExpenses(){
  const rows = await apiGet('getExpenses');
  setCache('expenses', rows);
  return rows;
}

/* ---------------- Invoices Management & Conversion Engine ---------------- */
async function loadInvoices(){
  const rows = await apiGet('getInvoices');
  const mapped = (Array.isArray(rows)?rows:[]).map(inv=>({
    ...inv,
    Items: typeof inv.ItemsJSON==='string' ? (JSON.parse(inv.ItemsJSON||'[]')) : (inv.Items||[])
  }));
  state.invoices = mapped;
  setCache('invoices', mapped);
  return mapped;
}
async function saveInvoiceRemote(inv){
  if(!inv.ID) inv.ID = 'inv_' + Date.now();
  if(!inv.InvoiceNumber) inv.InvoiceNumber = (typeof nextInvoiceNumber === 'function') ? nextInvoiceNumber() : ('INV-' + new Date().getFullYear() + '-0001');
  if(!inv.Date) inv.Date = new Date().toISOString().slice(0,10);
  if(!inv.DueDate) inv.DueDate = inv.Date;
  inv.By = state.user ? state.user.name : 'نظام';
  const idx = state.invoices.findIndex(x=>x.ID===inv.ID);
  const isExisting = idx > -1;
  if(idx>-1) state.invoices[idx] = inv; else state.invoices.push(inv);
  setCache('invoices', state.invoices);

  // Auto-ensure invoice customer is saved to directory
  if(inv.CustomerName && inv.CustomerName !== 'عميل زائر' && inv.CustomerName !== 'عميل' && inv.CustomerName !== 'زبون'){
    const cPhone = String(inv.CustomerPhone || '').trim();
    const cNameLow = String(inv.CustomerName).trim().toLowerCase();
    const existing = (state.customers || []).find(c => {
      if(cPhone && cPhone !== '0000000000' && c.phone === cPhone) return true;
      if((c.name||'').trim().toLowerCase() === cNameLow) return true;
      return false;
    });
    if(!existing){
      const newC = {
        title: inv.CustomerTitle || '',
        name: inv.CustomerName.trim(),
        phone: cPhone,
        email: '',
        taxNumber: inv.CustomerTaxNumber || '',
        address: inv.CustomerAddress || ''
      };
      state.customers.push(newC);
      setCache('customers', state.customers);
      try { saveCustomerRemote(newC); } catch(e){}
    } else {
      let changed = false;
      if(cPhone && cPhone !== '0000000000' && (!existing.phone || existing.phone === '0000000000')){
        existing.phone = cPhone;
        changed = true;
      }
      if(inv.CustomerTaxNumber && !existing.taxNumber){ existing.taxNumber = inv.CustomerTaxNumber; changed = true; }
      if(inv.CustomerAddress && !existing.address){ existing.address = inv.CustomerAddress; changed = true; }
      if(changed){
        setCache('customers', state.customers);
        try { saveCustomerRemote(existing); } catch(e){}
      }
    }
  }

  // F7: Auto Journal Entry for Invoice
  const totalAmt = Number(inv.Total != null ? inv.Total : (inv.NetTotal || 0));
  const paidAmt = Math.min(totalAmt, Math.max(0, Number(inv.AmountPaid || 0)));
  const unpaidDebt = Math.max(0, totalAmt - paidAmt);
  let journalEntry = null;

  if (totalAmt > 0 && !inv.skipAutoJournal && !isExisting) {
    const pLow = String(inv.PaymentMethod || 'نقدي').toLowerCase();
    const isBank = pLow.includes('فيزا') || pLow.includes('card') || pLow.includes('انستاباي') || pLow.includes('إنستاباي') || pLow.includes('محفظ') || pLow.includes('فودافون');
    const debitAccCode = isBank ? '1102' : '1101';
    const debitAccName = isBank ? 'البنك والحسابات الإلكترونية والمحافظ' : 'الخزينة الرئيسية (النقدية)';
    const invNum = inv.InvoiceNumber || inv.ID;
    const custName = inv.CustomerName || 'عميل';

    const lines = [];
    if (paidAmt > 0) {
      lines.push({
        AccountCode: debitAccCode,
        AccountName: debitAccName,
        Debit: paidAmt,
        Credit: 0,
        Notes: `تحصيل فاتورة مبيعات #${invNum}`
      });
    }
    if (unpaidDebt > 0) {
      lines.push({
        AccountCode: '1103',
        AccountName: 'العملاء والمدينون',
        Debit: unpaidDebt,
        Credit: 0,
        Notes: `آجل فاتورة مبيعات #${invNum} (${custName})`
      });
    }
    const taxAmt = Math.max(0, Number(inv.TaxAmount || 0));
    const netRevenue = Math.max(0, Math.round((totalAmt - taxAmt) * 100) / 100);

    const isCctvOrProject = inv.AccountCode === '4103' || 
                            inv.ReferenceType === 'مشروع كاميرات' || 
                            inv.ReferenceType === 'عرض سعر' || 
                            inv.ReferenceType === 'عقد صيانة' ||
                            inv.ReferenceType === 'مرحلة مشروع' ||
                            inv.ReferenceType === 'ProjectMilestone';
    const revCode = isCctvOrProject ? '4103' : (inv.AccountCode || '4102');
    const revName = (typeof getAccountName === 'function') 
      ? getAccountName(revCode, isCctvOrProject ? 'إيرادات تركيب كاميرات وأنظمة' : 'إيرادات مبيعات بضائع وقطع غيار')
      : (isCctvOrProject ? 'إيرادات تركيب كاميرات وأنظمة' : 'إيرادات مبيعات بضائع وقطع غيار');

    lines.push({
      AccountCode: revCode,
      AccountName: revName,
      Debit: 0,
      Credit: netRevenue,
      Notes: `صافي إيراد فاتورة ${isCctvOrProject ? 'مشاريع وأنظمة' : 'مبيعات'} #${invNum} (${custName})`
    });
    if (taxAmt > 0) {
      lines.push({
        AccountCode: '2104',
        AccountName: 'ضريبة القيمة المضافة المستحقة (مخرجات)',
        Debit: 0,
        Credit: taxAmt,
        Notes: `ضريبة مخرجات فاتورة مبيعات #${invNum}`
      });
    }

    journalEntry = await recordAutoJournalEntry(
      `فاتورة مبيعات #${invNum} - العميل: ${custName}`,
      'Invoice',
      inv.ID,
      lines
    ).catch(e => console.warn('Invoice journal posting error:', e));
  }

  const res = await apiPost('saveInvoice', {data: inv, journalEntry, user: inv.By, autoRenumber: true});

  if(res && res.renumbered && res.newInvoiceNumber){
    inv.InvoiceNumber = res.newInvoiceNumber;
    const invIdx = state.invoices.findIndex(x => x.ID === inv.ID);
    if(invIdx > -1) state.invoices[invIdx].InvoiceNumber = res.newInvoiceNumber;
    setCache('invoices', state.invoices);
    if(typeof showToast === 'function'){
      showToast(`تنبيه: تم تحديث رقم الفاتورة تلقائياً إلى #${res.newInvoiceNumber} لمنع التكرار`, 'warning');
    }
  }

  return res;
}

async function deleteInvoiceRemote(id){
  const inv = (state.invoices || []).find(x => String(x.ID) === String(id) || String(x.InvoiceNumber) === String(id));
  state.invoices = state.invoices.filter(x=>x.ID!==id);
  setCache('invoices', state.invoices);

  // F7: Reverse invoice journal if exists
  if (inv) {
    const totalAmt = Number(inv.Total != null ? inv.Total : (inv.NetTotal || 0));
    const paidAmt = Math.min(totalAmt, Math.max(0, Number(inv.AmountPaid || 0)));
    const unpaidDebt = Math.max(0, totalAmt - paidAmt);
    if (totalAmt > 0) {
      const pLow = String(inv.PaymentMethod || 'نقدي').toLowerCase();
      const isBank = pLow.includes('فيزا') || pLow.includes('card') || pLow.includes('انستاباي') || pLow.includes('إنستاباي') || pLow.includes('محفظ') || pLow.includes('فودافون');
      const debitAccCode = isBank ? '1102' : '1101';
      const debitAccName = isBank ? 'البنك والحسابات الإلكترونية والمحافظ' : 'الخزينة الرئيسية (النقدية)';
      const invNum = inv.InvoiceNumber || inv.ID;

      const lines = [
        {
          AccountCode: '4102',
          AccountName: 'إيرادات مبيعات بضائع وقطع غيار',
          Debit: totalAmt,
          Credit: 0,
          Notes: `عكس إيراد فاتورة مبيعات ملغاة #${invNum}`
        }
      ];
      if (paidAmt > 0) {
        lines.push({
          AccountCode: debitAccCode,
          AccountName: debitAccName,
          Debit: 0,
          Credit: paidAmt,
          Notes: `عكس تحصيل نقدية فاتورة مبيعات ملغاة #${invNum}`
        });
      }
      if (unpaidDebt > 0) {
        lines.push({
          AccountCode: '1103',
          AccountName: 'العملاء والمدينون',
          Debit: 0,
          Credit: unpaidDebt,
          Notes: `عكس مديونية آجل فاتورة مبيعات ملغاة #${invNum}`
        });
      }
      recordAutoJournalEntry(
        `إلغاء فاتورة مبيعات #${invNum}`,
        'Invoice_Void',
        inv.ID,
        lines
      ).catch(e => {});
    }
  }

  return apiPost('deleteInvoice', {id, role: state.user ? state.user.role : 'admin'});
}
