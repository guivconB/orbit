import { app } from 'electron';
import fs from 'fs';
import path from 'path';

// Preferências do sistema ficam no processo main (arquivo JSON em userData),
// porque são lidas antes da janela existir (autostart, modo de abertura, atalho).

export const START_MODES = ['fullscreen', 'window'] as const;
export type StartMode = (typeof START_MODES)[number];

// '' = atalho desativado
export const SHORTCUT_OPTIONS = [
  'CommandOrControl+Space',
  'CommandOrControl+Shift+Space',
  'CommandOrControl+Alt+O',
  '',
] as const;

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Preferences {
  openAtLogin: boolean;
  startMode: StartMode;
  shortcut: string;
  windowBounds?: WindowBounds;
  maximized?: boolean;
}

const defaults: Preferences = {
  openAtLogin: true,
  startMode: 'fullscreen',
  shortcut: 'CommandOrControl+Space',
};

const filePath = () => path.join(app.getPath('userData'), 'preferences.json');
let cache: Preferences | null = null;

export function getPreferences(): Preferences {
  if (!cache) {
    try {
      cache = { ...defaults, ...JSON.parse(fs.readFileSync(filePath(), 'utf-8')) };
    } catch {
      cache = { ...defaults };
    }
  }
  return cache!;
}

export function savePreferences(patch: Partial<Preferences>): Preferences {
  cache = { ...getPreferences(), ...patch };
  try {
    fs.writeFileSync(filePath(), JSON.stringify(cache, null, 2));
  } catch (err) {
    console.error('Falha ao salvar preferências:', err);
  }
  return cache;
}
