import { BrowserWindow, screen, shell } from 'electron';
import path from 'path';
import { getPreferences, savePreferences } from './preferences';
import type { WindowBounds } from './preferences';
import { isHttpUrl } from './validate';

export const isDev = process.argv.includes('--dev');
const DEV_URL = 'http://localhost:5173';

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

export const getMainWindow = () => mainWindow;
export const setQuitting = () => {
  isQuitting = true;
};

export function showWindow() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

export function toggleWindow() {
  if (mainWindow?.isVisible() && mainWindow.isFocused()) mainWindow.hide();
  else showWindow();
}

// Só reaproveita a posição salva se ela ainda cair em algum monitor conectado.
function visibleBounds(b?: WindowBounds): WindowBounds | undefined {
  if (!b) return undefined;
  const onScreen = screen.getAllDisplays().some(({ workArea: a }) =>
    b.x < a.x + a.width && b.x + b.width > a.x && b.y < a.y + a.height && b.y + b.height > a.y,
  );
  return onScreen ? b : undefined;
}

export function saveWindowState() {
  if (!mainWindow || mainWindow.isDestroyed() || mainWindow.isFullScreen()) return;
  savePreferences({ windowBounds: mainWindow.getNormalBounds(), maximized: mainWindow.isMaximized() });
}

const isAppUrl = (url: string) => (isDev ? url.startsWith(DEV_URL) : url.startsWith('file://'));

export function createWindow() {
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
      // Permite que o app inicie a rádio Lo-Fi por comando (paleta / IA).
      autoplayPolicy: 'no-user-gesture-required',
    },
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#0f172a', symbolColor: '#f8fafc' },
  });

  if (prefs.startMode === 'window' && prefs.maximized) mainWindow.maximize();
  mainWindow.once('ready-to-show', () => mainWindow?.show());

  if (isDev) mainWindow.loadURL(DEV_URL);
  else mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

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

  return mainWindow;
}
