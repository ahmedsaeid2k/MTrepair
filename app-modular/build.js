/**
 * microERP Modular Bundler & Packager
 * Combines all modular CSS and JavaScript files into a single, portable, production-ready dist/index.html.
 * Runs in pure Node.js with zero external dependencies.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const startTime = Date.now();
const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

console.log('🚀 Starting microERP Modular Build...');

// 0. Offline Barcode Library support
const jsBarcodeFile = path.join(rootDir, '../assets/JsBarcode.all.min.js');
let jsBarcodeTag = '<script src="https://cdnjs.cloudflare.com/ajax/libs/jsbarcode/3.12.3/JsBarcode.all.min.js"></script>';
if (fs.existsSync(jsBarcodeFile)) {
  const barcodeJs = fs.readFileSync(jsBarcodeFile, 'utf8');
  jsBarcodeTag = `<script>\n/* Embedded JsBarcode for 100% Offline Support */\n${barcodeJs}\n</script>`;
}

// 1. CSS Files to bundle in exact order
const cssFiles = [
  'css/01-variables.css',
  'css/02-base.css',
  'css/03-components.css',
  'css/04-pos.css',
  'css/05-print.css'
];

let combinedCss = '';
cssFiles.forEach(relPath => {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) throw new Error(`Missing CSS file: ${fullPath}`);
  const content = fs.readFileSync(fullPath, 'utf8');
  combinedCss += `\n/* === [File: ${relPath}] === */\n` + content + '\n';
});

// 2. JavaScript Files to bundle in exact order
const jsFiles = [
  'js/core/00-security-hardening.js',
  'js/core/01-digits.js',
  'js/core/02-api-sync.js',
  'js/core/03-utils-and-mappings.js',
  'js/core/04-chart-of-accounts.js',
  'js/core/05-auth-and-audit.js',
  'js/core/06-config-defaults.js',
  'js/core/07-state.js',
  'js/core/08-public-tracking.js',
  'js/modules/09-shell-and-router.js',
  'js/modules/10-receipts-maintenance.js',
  'js/modules/11-customers-crm.js',
  'js/modules/12-invoices-quotes.js',
  'js/modules/13-treasury-expenses.js',
  'js/modules/14-inventory-warehouse.js',
  'js/modules/15-pos-retail.js',
  'js/modules/16-suppliers-purchases.js',
  'js/modules/17-accounting-finance.js',
  'js/modules/18-settings-admin.js',
  'js/modules/19-login.js',
  'js/modules/21-cctv-projects.js',
  'js/modules/20-app-boot.js'
];

let combinedJs = '';
jsFiles.forEach(relPath => {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) throw new Error(`Missing JS file: ${fullPath}`);
  const content = fs.readFileSync(fullPath, 'utf8');
  combinedJs += `\n/* === [Module: ${relPath}] === */\n` + content + '\n';
});

// 3. Construct Single-File Distributable HTML
const distHtml = `<!doctype html>
<html lang="ar" dir="rtl" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#2563eb">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://script.google.com https://script.googleusercontent.com https://generativelanguage.googleapis.com; object-src 'none'; base-uri 'self';">
<title>ميكروERP | نظام إدارة الصيانة والمبيعات المتكامل (Production Release)</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
${jsBarcodeTag}
<style>
${combinedCss}
</style>
</head>
<body>
<div id="app"></div>
<div id="toastContainer"></div>

<script>
${combinedJs}
</script>
</body>
</html>
`;

const outputPath = path.join(distDir, 'index.html');
fs.writeFileSync(outputPath, distHtml);

// 4. Verify Bundle Syntax
const tempJsFile = path.join(distDir, '_temp_verify.js');
fs.writeFileSync(tempJsFile, combinedJs);
try {
  execSync(`node -c "${tempJsFile}"`);
  console.log('✅ Bundle JavaScript Syntax Verification: PASSED (100% Error-Free)');
} catch(err) {
  console.error('❌ Bundle Syntax Verification FAILED:', err.message);
  process.exit(1);
} finally {
  if (fs.existsSync(tempJsFile)) fs.unlinkSync(tempJsFile);
}

const elapsed = Date.now() - startTime;
const stats = fs.statSync(outputPath);
console.log(`\n🎉 Build completed successfully in ${elapsed}ms!`);
console.log(`📦 Output: ${outputPath}`);
console.log(`📊 Total Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB (${stats.size.toLocaleString()} bytes)`);
console.log(`📁 Bundled: ${cssFiles.length} CSS files + ${jsFiles.length} JS modules.`);
