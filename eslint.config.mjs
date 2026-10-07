import fs from 'node:fs';
import path from 'node:path';
import globals from 'globals';

// Dynamically discover all top-level symbols declared across modular files
const modularJsDir = path.join(process.cwd(), 'app-modular/js');
const declaredGlobals = {};

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      scanDir(full);
    } else if (full.endsWith('.js')) {
      const code = fs.readFileSync(full, 'utf8');
      const lines = code.split('\n');
      for (const l of lines) {
        const funcMatch = l.match(/^(?:async\s+)?function\s+([a-zA-Z0-9_$]+)/);
        if (funcMatch) declaredGlobals[funcMatch[1]] = 'writable';
        const varMatch = l.match(/^(?:const|let|var)\s+([a-zA-Z0-9_$]+)/);
        if (varMatch) declaredGlobals[varMatch[1]] = 'writable';
        const winMatch = l.match(/^window\.([a-zA-Z0-9_$]+)\s*=/);
        if (winMatch) declaredGlobals[winMatch[1]] = 'writable';
      }
    }
  }
}

scanDir(modularJsDir);
declaredGlobals['JsBarcode'] = 'readonly';

// Public API of the UMD engine js/core/10-whatsapp-engine.js.
// Its exports are created inside a factory, so the scanner above cannot see them.
[
  'WhatsappEngine',
  'normalizeWaCountryCode',
  'normalizeWaPhone',
  'isValidWaPhone',
  'buildWaUrl',
  'formatWaElapsed',
  'makeWaLogEntry',
  'trimWaLog',
  'getWaNotificationsFor',
  'getLastWaNotification',
  'wasWaNotifiedWithin',
  'getWaNotifiedKeysWithin',
  'collectRecentlyNotifiedIds',
  'countWaNotificationsByKey'
].forEach((name) => { declaredGlobals[name] = 'writable'; });

export default [
  {
    ignores: [
      'app-modular/dist/**',
      'dist/**',
      'dist-desktop/**',
      'node_modules/**',
      'assets/**'
    ]
  },
  // 1. Root & Build Node scripts
  {
    files: ['*.js', 'app-modular/build.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { vars: 'all', args: 'none', caughtErrors: 'none' }]
    }
  },
  // 2. Automated Unit Tests (ES Modules / Vitest)
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { vars: 'all', args: 'none', caughtErrors: 'none' }]
    }
  },
  // 3. Modular ERP Core & Modules
  {
    files: ['app-modular/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...declaredGlobals
      }
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['error', { vars: 'local', args: 'none', caughtErrors: 'none' }]
    }
  }
];
