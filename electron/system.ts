import { app, globalShortcut } from 'electron';
import { SHORTCUT_OPTIONS } from './preferences';
import type { Preferences } from './preferences';
import type { OrbitPreferences } from '../shared/models';
import { toggleWindow } from './window';

export function applyLoginItem(openAtLogin: boolean) {
  // Em dev registraria o electron.exe do node_modules, então só aplica na versão instalada.
  if (app.isPackaged) app.setLoginItemSettings({ openAtLogin, args: [] });
}

/** Registra o atalho global ('' desativa). Retorna false se outro programa já usa o atalho. */
export function registerShortcut(accelerator: string): boolean {
  globalShortcut.unregisterAll();
  if (!accelerator) return true;
  try {
    return globalShortcut.register(accelerator, toggleWindow);
  } catch {
    return false;
  }
}

export function publicPreferences(p: Preferences): OrbitPreferences {
  return {
    openAtLogin: p.openAtLogin,
    startMode: p.startMode,
    shortcut: p.shortcut,
    shortcutOptions: [...SHORTCUT_OPTIONS],
    isPackaged: app.isPackaged,
  };
}
