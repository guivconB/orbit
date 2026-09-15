import { useState, useEffect } from 'react';

export type Theme = 'slate' | 'ocean' | 'emerald' | 'rose';
export type WidgetSize = 'small' | 'medium' | 'large';

export interface WidgetSettings {
  id: string;
  enabled: boolean;
  size: WidgetSize;
}

export interface AppSettings {
  theme: Theme;
  widgets: Record<string, WidgetSettings>;
}

const defaultSettings: AppSettings = {
  theme: 'slate',
  widgets: {
    scratchpad: { id: 'scratchpad', enabled: true, size: 'small' },
    links: { id: 'links', enabled: true, size: 'small' },
    files: { id: 'files', enabled: true, size: 'small' },
    kanban: { id: 'kanban', enabled: true, size: 'small' },
    pomodoro: { id: 'pomodoro', enabled: true, size: 'small' },
    weather: { id: 'weather', enabled: true, size: 'small' },
    habits: { id: 'habits', enabled: true, size: 'small' },
  }
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to ensure new widgets are supported
        return { ...defaultSettings, ...parsed, widgets: { ...defaultSettings.widgets, ...parsed.widgets } };
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', settings.theme);
    
    // Update native window controls background color
    if (window.electronAPI && window.electronAPI.changeTheme) {
      const themeColors: Record<Theme, string> = {
        slate: '#1e293b',  // slate-800
        ocean: '#1e3a8a',  // blue-900
        emerald: '#064e3b',// emerald-900
        rose: '#881337'    // rose-900
      };
      // We pass the widget background color so the window controls blend in with our header (which has bg-widget/30)
      // Actually our header has bg-widget/30, so it's a mix of app and widget. Let's just use the app background color.
      const appColors: Record<Theme, string> = {
        slate: '#0f172a',  // slate-900
        ocean: '#020617',  // slate-950
        emerald: '#020617',// slate-950
        rose: '#020617'    // slate-950
      };
      
      // Let's use the app color because our header is largely transparent over the app bg
      window.electronAPI.changeTheme(appColors[settings.theme]);
    }
  }, [settings.theme, settings]);

  const updateTheme = (theme: Theme) => {
    setSettings(s => ({ ...s, theme }));
  };

  const toggleWidget = (id: string, enabled: boolean) => {
    setSettings(s => ({
      ...s,
      widgets: {
        ...s.widgets,
        [id]: { ...s.widgets[id], enabled }
      }
    }));
  };

  const resizeWidget = (id: string, size: WidgetSize) => {
    setSettings(s => ({
      ...s,
      widgets: {
        ...s.widgets,
        [id]: { ...s.widgets[id], size }
      }
    }));
  };

  return { settings, updateTheme, toggleWidget, resizeWidget };
}
