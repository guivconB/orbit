import React, { useState } from 'react';
import { X, Check, Monitor, LayoutGrid, Palette, History, Heart, HelpCircle, ChevronRight } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import type { Theme, WidgetSize } from '../hooks/useSettings';
import { ChangelogModal } from './ChangelogModal';
import { OnboardingModal } from './OnboardingModal';
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
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  if (!isOpen) return null;
  const { settings, updateTheme, toggleWidget, resizeWidget, updateSettings } = settingsData;

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

          <hr className="border-border" />

          {/* Recursos de Produção & Apoio */}
          <section>
            <h3 className="text-sm uppercase tracking-wider text-slate-400 font-semibold mb-4 flex items-center gap-2">
              <Heart size={16} className="text-rose-400" /> Recursos de Lançamento & Apoio
            </h3>
            
            <div className="space-y-3">
              {/* Toggle Apoia.se */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-widget/50 border border-border">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => updateSettings({ showSupportButton: !settings.showSupportButton })}
                    className={clsx(
                      "relative w-11 h-6 rounded-full transition-colors focus:outline-none",
                      settings.showSupportButton ? "bg-rose-500" : "bg-slate-600"
                    )}
                  >
                    <span className={clsx(
                      "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform",
                      settings.showSupportButton ? "translate-x-5" : "translate-x-0"
                    )} />
                  </button>
                  <div>
                    <span className="font-medium text-slate-200 block text-sm">
                      Botão de Apoio no Cabeçalho
                    </span>
                    <span className="text-xs text-slate-400 block">
                      Exibe atalho para doação/apoio comunitário (Apoia.se)
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão Onboarding */}
              <button
                onClick={() => setIsOnboardingOpen(true)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl bg-widget/30 hover:bg-widget border border-border/80 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle size={18} className="text-indigo-400" />
                  <div>
                    <span className="font-medium text-slate-200 text-sm block">Guia de Boas-Vindas</span>
                    <span className="text-xs text-slate-400 block">Rever tutorial de introdução do painel</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            </div>
          </section>

          <hr className="border-border" />

          {/* Histórico de Versões & Sobre */}
          <section className="pt-1">
            <button
              onClick={() => setIsChangelogOpen(true)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 hover:from-indigo-500/20 hover:to-pink-500/20 border border-indigo-500/20 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <History size={18} className="text-indigo-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100 text-sm">Histórico de Versões</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                      v4.0.0
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    Veja todas as novidades e melhorias que chegaram em cada versão
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          </section>

        </div>
      </div>

      {/* Modais Aninhados */}
      <ChangelogModal 
        isOpen={isChangelogOpen} 
        onClose={() => setIsChangelogOpen(false)} 
      />

      <OnboardingModal 
        isOpen={isOnboardingOpen} 
        onClose={() => setIsOnboardingOpen(false)} 
      />
    </div>
  );
}
