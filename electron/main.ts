import { app, BrowserWindow, ipcMain, shell, Tray, Menu, globalShortcut, Notification, nativeImage } from 'electron';
import path from 'path';
import { initDatabase, getDb } from './database';

const isDev = process.argv.includes('--dev');

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#f8fafc',
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent closing, hide instead
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  setupIpcHandlers();
}

function createTray() {
  // Use the orbit jpg or a fallback
  const iconPath = path.join(__dirname, isDev ? '../../public/orbit.jpg' : '../dist/orbit.jpg');
  let icon = nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) {
    // fallback if icon not found
    icon = nativeImage.createEmpty();
  }
  icon = icon.resize({ width: 16, height: 16 });

  tray = new Tray(icon);
  tray.setToolTip('Orbit Dashboard');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Abrir Painel', click: () => mainWindow?.show() },
    { type: 'separator' },
    { 
      label: 'Sair', 
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
}

function setupIpcHandlers() {
  // Notifications
  ipcMain.on('show-notification', (event, { title, body }) => {
    new Notification({ title, body }).show();
  });

  // UI
  ipcMain.on('change-theme', (event, color: string) => {
    if (mainWindow) {
      mainWindow.setTitleBarOverlay({ color });
    }
  });

  ipcMain.on('toggle-fullscreen', () => {
    if (mainWindow) {
      const isFullScreen = mainWindow.isFullScreen();
      mainWindow.setFullScreen(!isFullScreen);
    }
  });

  // Handle opening links in default browser
  ipcMain.handle('get-note', () => {
    const db = getDb();
    const row = db.prepare('SELECT content FROM notes ORDER BY id DESC LIMIT 1').get() as { content: string };
    return row ? row.content : '';
  });

  ipcMain.handle('save-note', (event, content) => {
    const db = getDb();
    db.prepare('UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM notes ORDER BY id DESC LIMIT 1)').run(content);
    return true;
  });

  // Links IPC Handlers
  ipcMain.handle('get-links', () => {
    const db = getDb();
    return db.prepare('SELECT * FROM links ORDER BY created_at DESC').all();
  });

  ipcMain.handle('add-link', (event, link: { title: string; url: string; category?: string }) => {
    const db = getDb();
    const result = db.prepare('INSERT INTO links (title, url, category) VALUES (?, ?, ?)').run(link.title, link.url, link.category || 'Geral');
    return result.lastInsertRowid;
  });

  ipcMain.handle('delete-link', (event, id: number) => {
    const db = getDb();
    db.prepare('DELETE FROM links WHERE id = ?').run(id);
    return true;
  });

  // Files IPC Handlers
  ipcMain.handle('get-files', () => {
    const db = getDb();
    return db.prepare('SELECT * FROM files ORDER BY created_at DESC').all();
  });

  ipcMain.handle('add-file', async (event) => {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile', 'openDirectory']
    });
    
    if (result.canceled || result.filePaths.length === 0) return null;
    
    const filePath = result.filePaths[0];
    const path = require('path');
    const name = path.basename(filePath);
    
    const db = getDb();
    const insertResult = db.prepare('INSERT INTO files (name, path) VALUES (?, ?)').run(name, filePath);
    return insertResult.lastInsertRowid;
  });

  ipcMain.handle('delete-file', (event, id: number) => {
    const db = getDb();
    db.prepare('DELETE FROM files WHERE id = ?').run(id);
    return true;
  });

  ipcMain.handle('open-file', async (event, filePath: string) => {
    const error = await shell.openPath(filePath);
    if (error) {
      console.error('Failed to open file:', error);
      return false;
    }
    return true;
  });

  // Tasks IPC Handlers
  ipcMain.handle('get-tasks', () => {
    const db = getDb();
    return db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
  });

  ipcMain.handle('add-task', (event, task: { title: string; status?: string }) => {
    const db = getDb();
    const result = db.prepare('INSERT INTO tasks (title, status) VALUES (?, ?)').run(task.title, task.status || 'todo');
    return result.lastInsertRowid;
  });

  ipcMain.handle('update-task-status', (event, id: number, status: string) => {
    const db = getDb();
    db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(status, id);
    return true;
  });

  ipcMain.handle('delete-task', (event, id: number) => {
    const db = getDb();
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return true;
  });

  // Habits IPC Handlers
  ipcMain.handle('get-habits', () => {
    const db = getDb();
    const habits = db.prepare('SELECT * FROM habits ORDER BY created_at ASC').all();
    const logs = db.prepare('SELECT * FROM habit_logs').all() as any[];
    
    return habits.map((h: any) => ({
      ...h,
      logs: logs.filter(l => l.habit_id === h.id).map(l => l.date)
    }));
  });

  ipcMain.handle('add-habit', (event, name: string) => {
    const db = getDb();
    const result = db.prepare('INSERT INTO habits (name) VALUES (?)').run(name);
    return result.lastInsertRowid;
  });

  ipcMain.handle('delete-habit', (event, id: number) => {
    const db = getDb();
    db.prepare('DELETE FROM habits WHERE id = ?').run(id);
    return true;
  });

  ipcMain.handle('toggle-habit-log', (event, habitId: number, date: string) => {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM habit_logs WHERE habit_id = ? AND date = ?').get(habitId, date);
    
    if (existing) {
      db.prepare('DELETE FROM habit_logs WHERE habit_id = ? AND date = ?').run(habitId, date);
    } else {
      db.prepare('INSERT INTO habit_logs (habit_id, date) VALUES (?, ?)').run(habitId, date);
    }
    return true;
  });

  // Plugins IPC Handler
  ipcMain.handle('get-plugins', () => {
    const fs = require('fs');
    const pluginsDir = path.join(app.getPath('documents'), 'Orbit-Plugins');
    
    // Criar a pasta se não existir
    if (!fs.existsSync(pluginsDir)) {
      fs.mkdirSync(pluginsDir, { recursive: true });
    }

    const plugins: { id: string; name: string; url: string; content?: string }[] = [];
    const dirs = fs.readdirSync(pluginsDir, { withFileTypes: true });

    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const indexPath = path.join(pluginsDir, dir.name, 'index.html');
        if (fs.existsSync(indexPath)) {
          const content = fs.readFileSync(indexPath, 'utf-8');
          plugins.push({
            id: `plugin-${dir.name}`,
            name: dir.name,
            url: `file:///${indexPath.replace(/\\/g, '/')}`,
            content: content
          });
        }
      }
    }
    return plugins;
  });
}

app.whenReady().then(() => {
  initDatabase();
  createWindow();
  createTray();

  // Register Global Shortcut
  globalShortcut.register('CommandOrControl+Space', () => {
    if (mainWindow?.isVisible()) {
      // If visible and focused, hide it. If visible but NOT focused, bring to front.
      if (mainWindow.isFocused()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow?.show();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
