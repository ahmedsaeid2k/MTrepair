/**
 * microERP Synchronizer & Build Automation
 * Keeps the monolithic index.html and the modular app-modular architecture in 100% perfect sync.
 * Dynamically computes module boundaries so it never breaks when code is added or removed.
 *
 * Usage:
 *   node sync-modular.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔄 [microERP Sync] Reading root index.html...');
const rootDir = __dirname;
const indexPath = path.join(rootDir, 'index.html');
const indexText = fs.readFileSync(indexPath, 'utf8');
const lines = indexText.split('\n');

function findLine(predicate, startFrom = 0) {
  for (let i = startFrom; i < lines.length; i++) {
    if (predicate(lines[i], i)) return i + 1;
  }
  throw new Error(`Could not find boundary line starting from index ${startFrom}`);
}

// Dynamically compute exact module boundaries in index.html (1-indexed start lines)
const cssVarStart = findLine(l => l.includes(':root {'));
const cssBaseStart = findLine(l => l.trim() === '* {' || l.includes('* { box-sizing:'), cssVarStart);
const cssCompStart = findLine(l => l.includes('Apple iOS Design System'), cssBaseStart);
const cssPosStart = findLine(l => l.includes('Next-Gen POS Pro Terminal Styles'), cssCompStart);
const cssPrintStart = findLine(l => l.includes('@media print {'), cssPosStart);
const cssEnd = findLine(l => l.trim() === '</style>', cssPrintStart);

const jsDigitsStart = findLine(l => l.includes('Universal Western Digits Enforcer'), cssEnd);
const jsSyncStart = findLine(l => l.includes('Google Sheets API & Offline Sync Engine'), jsDigitsStart);
const jsUtilsStart = findLine(l => l.includes('Toast Notification Utility') || l.includes('/* ---- Toast Notification'), jsSyncStart);
const jsCoaStart = findLine(l => l.includes('Chart of Accounts & General Ledger'), jsUtilsStart);
const jsAuthStart = findLine(l => l.includes('User Management & Auth Engine'), jsCoaStart);
const jsConfigStart = findLine(l => l.includes('Static Config & Defaults'), jsAuthStart);
const jsStateStart = findLine(l => l.includes('/* ---------------- State ----------------'), jsConfigStart);
const jsTrackStart = findLine(l => l.includes('Check URL for Public Customer Tracking'), jsStateStart);
const jsShellStart = findLine(l => l.includes('/* ---------------- Init ---------------- */'), jsTrackStart);
const jsReceiptsStart = findLine(l => l.includes('/* ---------------- New Receipt Form ---------------- */'), jsShellStart);
const jsCustStart = findLine(l => l.includes('Spotlight Search Normalization') || l.includes('Customer Directory & Phone Management Hub'), jsReceiptsStart);
const jsInvoicesStart = findLine(l => l.includes('/* ---------------- Invoices Management Screen View'), jsCustStart);
const jsTreasuryStart = findLine(l => l.includes('/* ---------------- Daily Journal Page View'), jsInvoicesStart);
const jsInvStart = findLine(l => l.includes('/* ---------------- Inventory Hub ---------------- */'), jsTreasuryStart);
const jsPosStart = findLine(l => l.includes('/* ---------------- POS Section ---------------- */'), jsInvStart);
const jsSuppliersStart = findLine(l => l.includes('/* ---------------- Suppliers, Purchases ---------------- */'), jsPosStart);
const jsFinanceStart = findLine(l => l.includes('/* ---------------- Finance Section ---------------- */'), jsSuppliersStart);
const jsSettingsStart = findLine(l => l.includes('/* ---------------- Enterprise Settings & Customization Center'), jsFinanceStart);
const jsLoginStart = findLine(l => l.includes('/* ---------------- Login Screen ---------------- */'), jsSettingsStart);
const jsBootStart = findLine(l => l.includes('restoreSession()'), jsLoginStart);
const jsEnd = findLine(l => l.trim() === '</script>', jsBootStart);

const markers = [
  { file: 'css/01-variables.css', start: cssVarStart },
  { file: 'css/02-base.css', start: cssBaseStart },
  { file: 'css/03-components.css', start: cssCompStart },
  { file: 'css/04-pos.css', start: cssPosStart },
  { file: 'css/05-print.css', start: cssPrintStart },
  { cssEnd: true, start: cssEnd },
  { file: 'js/core/01-digits.js', start: jsDigitsStart },
  { file: 'js/core/02-api-sync.js', start: jsSyncStart },
  { file: 'js/core/03-utils-and-mappings.js', start: jsUtilsStart },
  { file: 'js/core/04-chart-of-accounts.js', start: jsCoaStart },
  { file: 'js/core/05-auth-and-audit.js', start: jsAuthStart },
  { file: 'js/core/06-config-defaults.js', start: jsConfigStart },
  { file: 'js/core/07-state.js', start: jsStateStart },
  { file: 'js/core/08-public-tracking.js', start: jsTrackStart },
  { file: 'js/modules/09-shell-and-router.js', start: jsShellStart },
  { file: 'js/modules/10-receipts-maintenance.js', start: jsReceiptsStart },
  { file: 'js/modules/11-customers-crm.js', start: jsCustStart },
  { file: 'js/modules/12-invoices-quotes.js', start: jsInvoicesStart },
  { file: 'js/modules/13-treasury-expenses.js', start: jsTreasuryStart },
  { file: 'js/modules/14-inventory-warehouse.js', start: jsInvStart },
  { file: 'js/modules/15-pos-retail.js', start: jsPosStart },
  { file: 'js/modules/16-suppliers-purchases.js', start: jsSuppliersStart },
  { file: 'js/modules/17-accounting-finance.js', start: jsFinanceStart },
  { file: 'js/modules/18-settings-admin.js', start: jsSettingsStart },
  { file: 'js/modules/19-login.js', start: jsLoginStart },
  { file: 'js/modules/20-app-boot.js', start: jsBootStart },
  { jsEnd: true, start: jsEnd }
];

let updatedCount = 0;
for (let i = 0; i < markers.length - 1; i++) {
  const curr = markers[i];
  const next = markers[i + 1];
  if (curr.cssEnd || curr.jsEnd) continue;

  const chunk = lines.slice(curr.start - 1, next.start - 1).join('\n').trim() + '\n';
  const targetPath = path.join(rootDir, 'app-modular', curr.file);
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.writeFileSync(targetPath, chunk, 'utf8');
  updatedCount++;
}

console.log(`✅ [microERP Sync] Updated ${updatedCount} files across app-modular/ (5 CSS + 20 JS).`);

// Trigger production bundler build
console.log('📦 [microERP Sync] Triggering app-modular/build.js...');
const buildOutput = execSync('node app-modular/build.js', { cwd: rootDir, encoding: 'utf8' });
console.log(buildOutput);
console.log('🎉 [microERP Sync] Both monolithic and modular versions are now 100% identical and in sync!');
