import { createContext, createElement, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type Theme = 'slate' | 'ocean' | 'emerald' | 'rose';
export type WidgetSize = 'small' | 'medium' | 'large';

export interface WidgetSettings {
  id: string;
  enabled: boolean;
  size: WidgetSize;
  isPlugin?: boolean;
  name?: string;
}

export interface AppSettings {
  theme: Theme;
  /** @deprecated A chave agora fica criptografada no processo main. Lida só para migrar. */
  geminiApiKey?: string;
  widgets: Record<string, WidgetSettings>;
  widgetOrder: string[];
  showSupportButton?: boolean;
}

const defaultSettings: AppSettings = {
  theme: 'slate',
  showSupportButton: false,
  widgets: {
    scratchpad: { id: 'scratchpad', enabled: true, size: 'small' },
    links: { id: 'links', enabled: true, size: 'small' },
    files: { id: 'files', enabled: true, size: 'small' },
    kanban: { id: 'kanban', enabled: true, size: 'small' },
    pomodoro: { id: 'pomodoro', enabled: true, size: 'small' },
    weather: { id: 'weather', enabled: true, size: 'small' },
    habits: { id: 'habits', enabled: true, size: 'small' },
    ai: { id: 'ai', enabled: true, size: 'medium' },
    music: { id: 'music', enabled: true, size: 'small' }
  },
  widgetOrder: ['scratchpad', 'links', 'files', 'kanban', 'pomodoro', 'weather', 'habits', 'ai', 'music']
};

// Cor de fundo do app por tema, usada nos botões nativos da janela.
const TITLEBAR_COLORS: Record<Theme, string> = {
  slate: '#0a0e17',
  ocean: '#030816',
  emerald: '#02140e',
  rose: '#12050c'
};

function loadSettings(): AppSettings {
  const saved = localStorage.getItem('appSettings');
  if (!saved) return defaultSettings;
  try {
    const parsed = JSON.parse(saved);
    const parsedOrder: string[] = parsed.widgetOrder || defaultSettings.widgetOrder;
    const missingWidgets = defaultSettings.widgetOrder.filter(id => !parsedOrder.includes(id));
    return {
      ...defaultSettings,
      ...parsed,
      widgets: { ...defaultSettings.widgets, ...parsed.widgets },
      widgetOrder: [...parsedOrder, ...missingWidgets]
    };
  } catch (e) {
    console.error('Failed to parse settings', e);
    return defaultSettings;
  }
}

function useSettingsState() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    window.electronAPI?.changeTheme(TITLEBAR_COLORS[settings.theme]);
  }, [settings.theme]);

  const updateTheme = (theme: Theme) => {
    setSettings(s => ({ ...s, theme }));
  };

  const toggleWidget = (id: string, enabled: boolean) => {
    setSettings(s => ({
      ...s,
      widgets: { ...s.widgets, [id]: { ...s.widgets[id], enabled } }
    }));
  };

  const resizeWidget = (id: string, size: WidgetSize) => {
    setSettings(s => ({
      ...s,
      widgets: { ...s.widgets, [id]: { ...s.widgets[id], size } }
    }));
  };

  const reorderWidgets = (newOrder: string[]) => {
    setSettings(s => ({ ...s, widgetOrder: newOrder }));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(s => ({ ...s, ...newSettings }));
  };

  return { settings, updateTheme, toggleWidget, resizeWidget, reorderWidgets, updateSettings };
}

export type SettingsApi = ReturnType<typeof useSettingsState>;

// Um único estado compartilhado por todo o app. Antes cada componente que chamava
// useSettings() tinha sua própria cópia, e uma sobrescrevia a outra no localStorage.
const SettingsContext = createContext<SettingsApi | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  return createElement(SettingsContext.Provider, { value: useSettingsState() }, children);
}

export function useSettings(): SettingsApi {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings precisa estar dentro de <SettingsProvider>');
  return ctx;
}
