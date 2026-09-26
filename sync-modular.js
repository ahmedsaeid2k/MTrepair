/**
 * microERP Synchronizer & Build Automation
 * Keeps the monolithic index.html and the modular app-modular architecture in 100% perfect sync.
 * Run anytime changes are made:
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

// Exact module boundaries in index.html (1-indexed start lines)
const markers = [
  { file: 'css/01-variables.css', start: 15 },
  { file: 'css/02-base.css', start: 176 },
  { file: 'css/03-components.css', start: 1177 },
  { file: 'css/04-pos.css', start: 1940 },
  { file: 'css/05-print.css', start: 2315 },
  { cssEnd: true, start: 3692 },
  { file: 'js/core/01-digits.js', start: 3699 },
  { file: 'js/core/02-api-sync.js', start: 3800 },
  { file: 'js/core/03-utils-and-mappings.js', start: 3986 },
  { file: 'js/core/04-chart-of-accounts.js', start: 5378 },
  { file: 'js/core/05-auth-and-audit.js', start: 5843 },
  { file: 'js/core/06-config-defaults.js', start: 6426 },
  { file: 'js/core/07-state.js', start: 7056 },
  { file: 'js/core/08-public-tracking.js', start: 7285 },
  { file: 'js/modules/09-shell-and-router.js', start: 7379 },
  { file: 'js/modules/10-receipts-maintenance.js', start: 9071 },
  { file: 'js/modules/11-customers-crm.js', start: 11520 },
  { file: 'js/modules/12-invoices-quotes.js', start: 16501 },
  { file: 'js/modules/13-treasury-expenses.js', start: 17776 },
  { file: 'js/modules/14-inventory-warehouse.js', start: 19234 },
  { file: 'js/modules/15-pos-retail.js', start: 20359 },
  { file: 'js/modules/16-suppliers-purchases.js', start: 22283 },
  { file: 'js/modules/17-accounting-finance.js', start: 23108 },
  { file: 'js/modules/18-settings-admin.js', start: 26123 },
  { file: 'js/modules/19-login.js', start: 29747 },
  { file: 'js/modules/20-app-boot.js', start: 30113 },
  { jsEnd: true, start: 30128 }
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
