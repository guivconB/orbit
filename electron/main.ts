import { app, BrowserWindow, Menu, Notification, Tray, globalShortcut, nativeImage } from 'electron';
import path from 'path';
import { initDatabase } from './database';
import { getPreferences } from './preferences';
import { applyLoginItem, registerShortcut } from './system';
import { createWindow, getMainWindow, isDev, saveWindowState, setQuitting, showWindow } from './window';
import { registerIpcHandlers } from './ipc';

let tray: Tray | null = null;

function createTray() {
  const iconPath = path.join(__dirname, isDev ? '../public/orbit.jpg' : '../dist/orbit.jpg');
  let icon = nativeImage.createFromPath(iconPath);
  if (!icon.isEmpty()) icon = icon.resize({ width: 16, height: 16 });

  tray = new Tray(icon);
  tray.setToolTip('Orbit Dashboard');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Abrir Painel', click: showWindow },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => {
        setQuitting();
        app.quit();
      },
    },
  ]));
  tray.on('click', () => {
    const win = getMainWindow();
    if (win?.isVisible()) win.hide();
    else showWindow();
  });
}

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
