import { app, BrowserWindow, ipcMain, shell, Tray, Menu, globalShortcut, Notification, nativeImage, dialog, screen } from 'electron';
import path from 'path';
import fs from 'fs';
import { initDatabase, getDb } from './database';
import { getPreferences, savePreferences, SHORTCUT_OPTIONS, START_MODES } from './preferences';
import type { Preferences, WindowBounds } from './preferences';
import * as ai from './ai';
import { str, int, oneOf, isoDate, isHttpUrl } from './validate';

const isDev = process.argv.includes('--dev');
const DEV_URL = 'http://localhost:5173';
const TASK_STATUSES = ['todo', 'done', 'idea'] as const;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// ---------- Janela ----------

function showWindow() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function toggleWindow() {
  if (mainWindow?.isVisible() && mainWindow.isFocused()) {
    mainWindow.hide();
  } else {
    showWindow();
  }
}

// Só reaproveita a posição salva se ela ainda cair em algum monitor conectado.
function visibleBounds(b?: WindowBounds): WindowBounds | undefined {
  if (!b) return undefined;
  const onScreen = screen.getAllDisplays().some(({ workArea: a }) =>
    b.x < a.x + a.width && b.x + b.width > a.x && b.y < a.y + a.height && b.y + b.height > a.y,
  );
  return onScreen ? b : undefined;
}

function saveWindowState() {
  if (!mainWindow || mainWindow.isDestroyed() || mainWindow.isFullScreen()) return;
  savePreferences({ windowBounds: mainWindow.getNormalBounds(), maximized: mainWindow.isMaximized() });
}

function isAppUrl(url: string) {
  return isDev ? url.startsWith(DEV_URL) : url.startsWith('file://');
}

function createWindow() {
  const prefs = getPreferences();
  const bounds = visibleBounds(prefs.windowBounds);

  mainWindow = new BrowserWindow({
    width: bounds?.width ?? 1200,
    height: bounds?.height ?? 800,
    x: bounds?.x,
    y: bounds?.y,
    fullscreen: prefs.startMode === 'fullscreen',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      // Mantém o Pomodoro e o relógio precisos com a janela escondida na bandeja.
      backgroundThrottling: false,
    },
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#f8fafc',
    },
  });

  if (prefs.startMode === 'window' && prefs.maximized) mainWindow.maximize();
  mainWindow.once('ready-to-show', () => mainWindow?.show());

  if (isDev) {
    mainWindow.loadURL(DEV_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Links externos: só http/https vão para o navegador padrão.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isHttpUrl(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  // Impede que a janela principal saia do app.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isAppUrl(url)) return;
    event.preventDefault();
    if (isHttpUrl(url)) shell.openExternal(url);
  });

  // Fechar = esconder na bandeja
  mainWindow.on('close', (event) => {
    saveWindowState();
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

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
        isQuitting = true;
        app.quit();
      },
    },
  ]));
  tray.on('click', () => (mainWindow?.isVisible() ? mainWindow.hide() : showWindow()));
}

// ---------- Sistema ----------

function applyLoginItem(openAtLogin: boolean) {
  // Em dev registraria o electron.exe do node_modules, então só aplica na versão instalada.
  if (app.isPackaged) app.setLoginItemSettings({ openAtLogin, args: [] });
}

function registerShortcut(accelerator: string): boolean {
  globalShortcut.unregisterAll();
  if (!accelerator) return true;
  try {
    return globalShortcut.register(accelerator, toggleWindow);
  } catch {
    return false;
  }
}

function publicPreferences(p: Preferences) {
  return {
    openAtLogin: p.openAtLogin,
    startMode: p.startMode,
    shortcut: p.shortcut,
    shortcutOptions: [...SHORTCUT_OPTIONS],
    isPackaged: app.isPackaged,
  };
}

// ---------- IPC ----------

function setupIpcHandlers() {
  // UI
  ipcMain.on('show-notification', (_e, payload: { title?: unknown; body?: unknown }) => {
    try {
      new Notification({ title: str(payload?.title, 'title', 200), body: str(payload?.body ?? '', 'body', 1000) }).show();
    } catch (err) {
      console.error(err);
    }
  });

  ipcMain.on('change-theme', (_e, color: unknown) => {
    if (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)) {
      mainWindow?.setTitleBarOverlay({ color });
    }
  });

  ipcMain.on('toggle-fullscreen', () => {
    if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen());
  });

  // Preferências
  ipcMain.handle('get-preferences', () => publicPreferences(getPreferences()));

  ipcMain.handle('set-preferences', (_e, patch: Record<string, unknown>) => {
    const current = getPreferences();
    const next: Partial<Preferences> = {};

    if ('openAtLogin' in patch) {
      if (typeof patch.openAtLogin !== 'boolean') throw new Error('Parâmetro inválido: openAtLogin');
      next.openAtLogin = patch.openAtLogin;
      applyLoginItem(patch.openAtLogin);
    }
    if ('startMode' in patch) {
      next.startMode = oneOf(patch.startMode, START_MODES, 'startMode');
    }
    if ('shortcut' in patch) {
      const shortcut = oneOf(patch.shortcut, SHORTCUT_OPTIONS, 'shortcut');
      if (!registerShortcut(shortcut)) {
        registerShortcut(current.shortcut);
        savePreferences(next);
        return { ok: false, error: 'Esse atalho já está em uso por outro programa. Escolha outro.', prefs: publicPreferences(getPreferences()) };
      }
      next.shortcut = shortcut;
    }

    return { ok: true, prefs: publicPreferences(savePreferences(next)) };
  });

  // IA (a chave nunca sai do processo main)
  ipcMain.handle('ai-has-key', () => ai.hasKey());
  ipcMain.handle('ai-set-key', (_e, key: unknown) => {
    ai.setKey(str(key, 'key', 300).trim());
    return true;
  });
  ipcMain.handle('ai-chat', (_e, history: unknown, message: unknown) => {
    if (!Array.isArray(history) || history.length > 200) throw new Error('Parâmetro inválido: history');
    const turns = history.map((t: any) => ({
      role: oneOf(t?.role, ['user', 'model'] as const, 'role'),
      text: str(t?.text, 'text', 20_000),
    }));
    return ai.chat(turns, str(message, 'message', 20_000));
  });

  // Notas
  ipcMain.handle('get-note', () => {
    const row = getDb().prepare('SELECT content FROM notes ORDER BY id DESC LIMIT 1').get() as { content: string } | undefined;
    return row ? row.content : '';
  });

  ipcMain.handle('save-note', (_e, content: unknown) => {
    getDb()
      .prepare('UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM notes ORDER BY id DESC LIMIT 1)')
      .run(str(content, 'content', 1_000_000));
    return true;
  });

  // Links
  ipcMain.handle('get-links', () => getDb().prepare('SELECT * FROM links ORDER BY created_at DESC').all());

  ipcMain.handle('add-link', (_e, link: { title?: unknown; url?: unknown; category?: unknown }) => {
    if (!isHttpUrl(link?.url)) throw new Error('A URL precisa começar com http:// ou https://');
    const result = getDb()
      .prepare('INSERT INTO links (title, url, category) VALUES (?, ?, ?)')
      .run(str(link.title, 'title', 200), link.url, link.category ? str(link.category, 'category', 100) : 'Geral');
    return result.lastInsertRowid;
  });

  ipcMain.handle('delete-link', (_e, id: unknown) => {
    getDb().prepare('DELETE FROM links WHERE id = ?').run(int(id, 'id'));
    return true;
  });

  // Arquivos
  ipcMain.handle('get-files', () => getDb().prepare('SELECT * FROM files ORDER BY created_at DESC').all());

  ipcMain.handle('add-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, { properties: ['openFile', 'openDirectory'] });
    if (result.canceled || result.filePaths.length === 0) return null;

    const filePath = result.filePaths[0];
    const insert = getDb().prepare('INSERT INTO files (name, path) VALUES (?, ?)').run(path.basename(filePath), filePath);
    return insert.lastInsertRowid;
  });

  ipcMain.handle('delete-file', (_e, id: unknown) => {
    getDb().prepare('DELETE FROM files WHERE id = ?').run(int(id, 'id'));
    return true;
  });

  // Só abre caminhos que o próprio usuário cadastrou pelo diálogo do sistema.
  ipcMain.handle('open-file', async (_e, id: unknown) => {
    const row = getDb().prepare('SELECT path FROM files WHERE id = ?').get(int(id, 'id')) as { path: string } | undefined;
    if (!row) return false;
    const error = await shell.openPath(row.path);
    if (error) {
      console.error('Falha ao abrir arquivo:', error);
      return false;
    }
    return true;
  });

  // Tarefas
  ipcMain.handle('get-tasks', () => getDb().prepare('SELECT * FROM tasks ORDER BY created_at DESC').all());

  ipcMain.handle('add-task', (_e, task: { title?: unknown; status?: unknown }) => {
    const result = getDb()
      .prepare('INSERT INTO tasks (title, status) VALUES (?, ?)')
      .run(str(task?.title, 'title', 500), task?.status ? oneOf(task.status, TASK_STATUSES, 'status') : 'todo');
    return result.lastInsertRowid;
  });

  ipcMain.handle('update-task-status', (_e, id: unknown, status: unknown) => {
    getDb().prepare('UPDATE tasks SET status = ? WHERE id = ?').run(oneOf(status, TASK_STATUSES, 'status'), int(id, 'id'));
    return true;
  });

  ipcMain.handle('delete-task', (_e, id: unknown) => {
    getDb().prepare('DELETE FROM tasks WHERE id = ?').run(int(id, 'id'));
    return true;
  });

  // Usado ao restaurar o backup da nuvem: substitui todas as tarefas.
  ipcMain.handle('replace-tasks', (_e, tasks: unknown) => {
    if (!Array.isArray(tasks) || tasks.length > 10_000) throw new Error('Parâmetro inválido: tasks');
    const rows = tasks.map((t: any) => ({
      title: str(t?.title, 'title', 500),
      status: oneOf(t?.status, TASK_STATUSES, 'status'),
      created_at: typeof t?.created_at === 'string' ? t.created_at.slice(0, 30) : null,
    }));
    const db = getDb();
    const insert = db.prepare('INSERT INTO tasks (title, status, created_at) VALUES (@title, @status, COALESCE(@created_at, CURRENT_TIMESTAMP))');
    db.transaction(() => {
      db.prepare('DELETE FROM tasks').run();
      rows.forEach(r => insert.run(r));
    })();
    return true;
  });

  // Hábitos
  ipcMain.handle('get-habits', () => {
    const db = getDb();
    const habits = db.prepare('SELECT * FROM habits ORDER BY created_at ASC').all() as { id: number }[];
    const logs = db.prepare('SELECT habit_id, date FROM habit_logs').all() as { habit_id: number; date: string }[];
    return habits.map(h => ({ ...h, logs: logs.filter(l => l.habit_id === h.id).map(l => l.date) }));
  });

  ipcMain.handle('add-habit', (_e, name: unknown) => {
    return getDb().prepare('INSERT INTO habits (name) VALUES (?)').run(str(name, 'name', 200)).lastInsertRowid;
  });

  ipcMain.handle('delete-habit', (_e, id: unknown) => {
    getDb().prepare('DELETE FROM habits WHERE id = ?').run(int(id, 'id'));
    return true;
  });

  ipcMain.handle('toggle-habit-log', (_e, habitId: unknown, date: unknown) => {
    const db = getDb();
    const id = int(habitId, 'habitId');
    const day = isoDate(date, 'date');
    const removed = db.prepare('DELETE FROM habit_logs WHERE habit_id = ? AND date = ?').run(id, day);
    if (removed.changes === 0) {
      db.prepare('INSERT INTO habit_logs (habit_id, date) VALUES (?, ?)').run(id, day);
    }
    return true;
  });

  // Plugins
  ipcMain.handle('get-plugins', () => {
    const pluginsDir = path.join(app.getPath('documents'), 'Orbit-Plugins');
    if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });

    const plugins: { id: string; name: string; content: string }[] = [];
    for (const dir of fs.readdirSync(pluginsDir, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const indexPath = path.join(pluginsDir, dir.name, 'index.html');
      if (fs.existsSync(indexPath)) {
        plugins.push({ id: `plugin-${dir.name}`, name: dir.name, content: fs.readFileSync(indexPath, 'utf-8') });
      }
    }
    return plugins;
  });
}

// ---------- Inicialização ----------

function start() {
  const prefs = getPreferences();
  applyLoginItem(prefs.openAtLogin);

  initDatabase();
  setupIpcHandlers();
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
  isQuitting = true;
  saveWindowState();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
