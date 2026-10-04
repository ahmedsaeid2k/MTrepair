/**
 * microERP Desktop Core (Electron Main Process)
 * Designed for High-Performance Maintenance & POS Management
 * Supports Windows (.exe) and macOS (.dmg)
 */

const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('path');

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();
let mainWindow = null;

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createMainWindow);
}

function createMainWindow() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'ميكروERP | نظام إدارة الصيانة والمبيعات المتكامل',
    icon: iconPath,
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      sandbox: false
    }
  });

  // Build standard native menu for keyboard shortcuts (Reload, Zoom, DevTools, Fullscreen)
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{
      label: 'microERP',
      submenu: [
        { role: 'about', label: 'حول البرنامج' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide', label: 'إخفاء microERP' },
        { role: 'hideOthers', label: 'إخفاء البقية' },
        { role: 'unhide', label: 'إظهار الكل' },
        { type: 'separator' },
        { role: 'quit', label: 'إنهاء البرنامج' }
      ]
    }] : []),
    {
      label: 'ملف',
      submenu: [
        {
          label: 'طباعة فورية',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            if (mainWindow) mainWindow.webContents.print();
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close', label: 'إغلاق النافذة' } : { role: 'quit', label: 'خروج' }
      ]
    },
    {
      label: 'تعديل',
      submenu: [
        { role: 'undo', label: 'تراجع' },
        { role: 'redo', label: 'إعادة' },
        { type: 'separator' },
        { role: 'cut', label: 'قص' },
        { role: 'copy', label: 'نسخ' },
        { role: 'paste', label: 'لصق' },
        { role: 'selectAll', label: 'تحديد الكل' }
      ]
    },
    {
      label: 'عرض',
      submenu: [
        { role: 'reload', label: 'تحديث الشاشة' },
        { role: 'forceReload', label: 'تحديث إجباري' },
        {
          label: 'أدوات المطور (F12)',
          accelerator: 'F12',
          click: () => mainWindow.webContents.toggleDevTools()
        },
        { type: 'separator' },
        { role: 'resetZoom', label: 'الحجم الطبيعي' },
        { role: 'zoomIn', label: 'تكبير (+)' },
        { role: 'zoomOut', label: 'تصغير (-)' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'ملء الشاشة' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Load the production-bundled single-page app
  const appHtmlPath = path.join(__dirname, 'app-modular', 'dist', 'index.html');
  mainWindow.loadFile(appHtmlPath);

  // Intercept new window creations (e.g. WhatsApp, phone links, external websites)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://wa.me/') || url.startsWith('https://web.whatsapp.com/') || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('tel:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Intercept navigation away from local file
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ---------------- IPC Desktop API Handlers ---------------- //

// 1. Get available printers list
ipcMain.handle('get-printers', async () => {
  if (!mainWindow) return [];
  try {
    return await mainWindow.webContents.getPrintersAsync();
  } catch (err) {
    console.error('Failed to get printers:', err);
    return [];
  }
});

// 2. Silent Print (Thermal receipts, direct POS printing)
ipcMain.handle('print-silent', async (event, options = {}) => {
  if (!mainWindow) return { success: false, error: 'No active window' };
  return new Promise((resolve) => {
    mainWindow.webContents.print({
      silent: true,
      printBackground: true,
      deviceName: options.deviceName || '',
      copies: options.copies || 1,
      margins: options.margins || { marginType: 'none' },
      pageSize: options.pageSize || undefined
    }, (success, errorType) => {
      resolve({ success, error: errorType });
    });
  });
});

// 3. Open system print dialog
ipcMain.handle('print-dialog', async (event, options = {}) => {
  if (!mainWindow) return { success: false, error: 'No active window' };
  return new Promise((resolve) => {
    mainWindow.webContents.print({
      silent: false,
      printBackground: true,
      ...options
    }, (success, errorType) => {
      resolve({ success, error: errorType });
    });
  });
});

// 4. Open External URL
ipcMain.handle('open-external', async (event, url) => {
  if (url) {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

// 5. Get App Version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Window lifecycle for macOS and Windows
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
