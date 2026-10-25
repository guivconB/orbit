import { ipcMain, Notification } from 'electron';
import { getMainWindow } from '../window';
import { str } from '../validate';
import { setTrayTooltip } from '../tray';

export function registerUiHandlers() {
  ipcMain.on('show-notification', (_e, payload: { title?: unknown; body?: unknown }) => {
    try {
      new Notification({ title: str(payload?.title, 'title', 200), body: str(payload?.body ?? '', 'body', 1000) }).show();
    } catch (err) {
      console.error(err);
    }
  });

  ipcMain.on('change-theme', (_e, color: unknown) => {
    if (typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)) {
      getMainWindow()?.setTitleBarOverlay({ color });
    }
  });

  // Pomodoro: progresso no ícone da barra de tarefas e tempo restante na bandeja.
  ipcMain.on('focus-progress', (_e, state: { progress?: unknown; label?: unknown }) => {
    const win = getMainWindow();
    const progress = typeof state?.progress === 'number' && state.progress >= 0 && state.progress <= 1 ? state.progress : null;
    win?.setProgressBar(progress ?? -1);
    setTrayTooltip(typeof state?.label === 'string' ? state.label.slice(0, 80) : '');
  });

  ipcMain.on('toggle-fullscreen', () => {
    const win = getMainWindow();
    if (win) win.setFullScreen(!win.isFullScreen());
  });
}
