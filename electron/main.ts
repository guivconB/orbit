import { app, BrowserWindow, Notification, globalShortcut } from 'electron';
import { initDatabase } from './database';
import { getPreferences } from './preferences';
import { applyLoginItem, registerShortcut } from './system';
import { createWindow, saveWindowState, setQuitting, showWindow } from './window';
import { createTray } from './tray';
import { registerIpcHandlers } from './ipc';

function start() {
  const prefs = getPreferences();
  applyLoginItem(prefs.openAtLogin);

  initDatabase();
  registerIpcHandlers();
  createWindow();
  createTray();

  if (!registerShortcut(prefs.shortcut)) {
    new Notification({
      title: 'Orbit',
      body: 'Não foi possível registrar o atalho global (já está em uso). Escolha outro em Configurações > Sistema.',
    }).show();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else showWindow();
  });
}

// Uma instância só: abrir de novo apenas traz a janela existente para frente.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showWindow);
  app.whenReady().then(start);
}

app.on('before-quit', () => {
  setQuitting();
  saveWindowState();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
