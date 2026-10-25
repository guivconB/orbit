import { ipcMain } from 'electron';
import { getPreferences, savePreferences, SHORTCUT_OPTIONS, START_MODES } from '../preferences';
import type { Preferences } from '../preferences';
import { applyLoginItem, publicPreferences, registerShortcut } from '../system';
import { oneOf } from '../validate';

export function registerPreferencesHandlers() {
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
        return {
          ok: false,
          error: 'Esse atalho já está em uso por outro programa. Escolha outro.',
          prefs: publicPreferences(getPreferences()),
        };
      }
      next.shortcut = shortcut;
    }

    return { ok: true, prefs: publicPreferences(savePreferences(next)) };
  });
}
