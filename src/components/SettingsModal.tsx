import React from 'react';
import { X, Check, Monitor, LayoutGrid, Palette, ToggleLeft } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import type { Theme, WidgetSize } from '../hooks/useSettings';
import clsx from 'clsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settingsData: ReturnType<typeof useSettings>;
}

const THEMES: { id: Theme; name: string; color: string }[] = [
  { id: 'slate', name: 'Escuro Clássico', color: 'bg-widget' },
  { id: 'ocean', name: 'Oceano Profundo', color: 'bg-blue-900' },
  { id: 'emerald', name: 'Floresta', color: 'bg-emerald-900' },
  { id: 'rose', name: 'Crepúsculo', color: 'bg-rose-900' },
];

const WIDGETS = [
  { id: 'scratchpad', name: 'Bloco de Notas' },
  { id: 'links', name: 'Links Rápidos' },
  { id: 'files', name: 'Atalhos de Arquivos' },
  { id: 'kanban', name: 'Tarefas / Ideias' },
  { id: 'pomodoro', name: 'Timer Pomodoro' },
  { id: 'weather', name: 'Relógio e Clima' },
  { id: 'habits', name: 'Hábitos' },
  { id: 'ai', name: 'Assistente IA (Gemini)' },
  { id: 'music', name: 'Player de Música' },
];

export function SettingsModal({ isOpen, onClose, settingsData }: Props) {
  if (!isOpen) return null;
  const { settings, updateTheme, toggleWidget, resizeWidget } = settingsData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-app w-full max-w-2xl rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-border flex items-center justify-between bg-widget/50">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Monitor className="text-indigo-400" />
            Configurações do Painel
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-widget-hover rounded-full text-slate-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
          
          {/* Temas */}
          <section>
            <h3 className="text-sm uppercase tracking-wider text-slate-400 font-semibold mb-4 flex items-center gap-2">
              <Palette size={16} /> Temas de Cores
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => updateTheme(t.id)}
                  className={clsx(
                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
                    settings.theme === t.id 
                      ? "border-indigo-500 bg-widget" 
                      : "border-border bg-widget/50 hover:border-slate-500"
                  )}
                >
                  <div className={clsx("w-8 h-8 rounded-full border-2 border-white/10 flex items-center justify-center", t.color)}>
                    {settings.theme === t.id && <Check size={16} className="text-white" />}
                  </div>
                  <span className="text-sm font-medium text-slate-300">{t.name}</span>
                </button>
              ))}
            </div>
          </section>

          <hr className="border-border" />

          {/* Widgets Config */}
          <section>
            <h3 className="text-sm uppercase tracking-wider text-slate-400 font-semibold mb-4 flex items-center gap-2">
              <LayoutGrid size={16} /> Meus Widgets
            </h3>
            
            <div className="space-y-3">
              {Object.values(settings.widgets).map(wSettings => {
                // Para encontrar o nome original ou usar o nome do plugin
                let wName = wSettings.name;
                if (!wName) {
                  const builtin = WIDGETS.find(w => w.id === wSettings.id);
                  wName = builtin ? builtin.name : wSettings.id;
                }
                
                return (
                  <div key={wSettings.id} className="flex items-center justify-between p-4 rounded-xl bg-widget/50 border border-border">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleWidget(wSettings.id, !wSettings.enabled)}
                        className={clsx(
                          "relative w-11 h-6 rounded-full transition-colors focus:outline-none",
                          wSettings.enabled ? "bg-indigo-500" : "bg-slate-600"
                        )}
                      >
                        <span className={clsx(
                          "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform",
                          wSettings.enabled ? "translate-x-5" : "translate-x-0"
                        )} />
                      </button>
                      <span className={clsx("font-medium capitalize", wSettings.enabled ? "text-slate-200" : "text-slate-500 line-through")}>
                        {wName} {wSettings.isPlugin && <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded ml-2">Plugin</span>}
                      </span>
                    </div>

                    {wSettings.enabled && (
                      <div className="flex bg-app rounded-lg p-1 border border-border">
                        {(['small', 'medium', 'large'] as WidgetSize[]).map(size => (
                          <button
                            key={size}
                            onClick={() => resizeWidget(wSettings.id, size)}
                            className={clsx(
                              "px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors",
                              wSettings.size === size 
                                ? "bg-slate-700 text-white shadow" 
                                : "text-slate-400 hover:text-slate-200"
                            )}
                          >
                            {size === 'small' ? 'P' : size === 'medium' ? 'M' : 'G'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
