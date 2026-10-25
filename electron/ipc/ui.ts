import { ipcMain, Notification } from 'electron';
import { getMainWindow } from '../window';
import { str } from '../validate';

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

  ipcMain.on('toggle-fullscreen', () => {
    const win = getMainWindow();
    if (win) win.setFullScreen(!win.isFullScreen());
  });
}
