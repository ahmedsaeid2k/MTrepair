/**
 * microERP Desktop Bridge (Preload Script)
 * Securely exposes Desktop APIs to the web application
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printSilent: (options) => ipcRenderer.invoke('print-silent', options),
  print: (options) => ipcRenderer.invoke('print-dialog', options),
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
