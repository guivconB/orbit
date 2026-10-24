import { useState } from 'react';
import { X, Check, Monitor, LayoutGrid, Palette, History, Heart, HelpCircle, ChevronRight } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import type { Theme, WidgetSize } from '../hooks/useSettings';
import { ChangelogModal } from './ChangelogModal';
import { OnboardingModal } from './OnboardingModal';
import { SystemSection } from './settings/SystemSection';
import { CloudSyncSection } from './settings/CloudSyncSection';
import clsx from 'clsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const THEMES: { id: Theme; name: string; colorClass: string }[] = [
  { id: 'slate', name: 'Escuro Clássico', colorClass: 'bg-slate-700' },
  { id: 'ocean', name: 'Oceano Profundo', colorClass: 'bg-sky-600' },
  { id: 'emerald', name: 'Floresta', colorClass: 'bg-emerald-600' },
  { id: 'rose', name: 'Crepúsculo', colorClass: 'bg-rose-600' },
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

export function SettingsModal({ isOpen, onClose }: Props) {
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const { settings, updateTheme, toggleWidget, resizeWidget, updateSettings } = useSettings();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xl p-4 animate-fadeIn">
      <div className="bg-app/95 w-full max-w-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-black/25">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent">
              <Monitor size={18} />
            </div>
            <span>Configurações do Painel</span>
          </h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Fechar configurações"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-7 custom-scrollbar">
          
          {/* Temas */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3.5 flex items-center gap-2">
              <Palette size={15} className="text-accent" /> Temas de Cores
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => updateTheme(t.id)}
                  className={clsx(
                    "flex flex-col items-center gap-2.5 p-3.5 rounded-2xl border transition-all cursor-pointer",
                    settings.theme === t.id 
                      ? "border-accent ring-2 ring-accent/30 bg-accent/15 shadow-sm" 
                      : "border-white/[0.06] bg-black/20 hover:border-white/15 hover:bg-black/30"
                  )}
                >
                  <div className={clsx("w-8 h-8 rounded-full border border-white/20 flex items-center justify-center shadow-inner", t.colorClass)}>
                    {settings.theme === t.id && <Check size={16} className="text-white drop-shadow-sm" strokeWidth={3} />}
                  </div>
                  <span className="text-xs font-semibold text-slate-200">{t.name}</span>
                </button>
              ))}
            </div>
          </section>

          <hr className="border-white/[0.06]" />

          {/* Widgets Config */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3.5 flex items-center gap-2">
              <LayoutGrid size={15} className="text-accent" /> Meus Widgets
            </h3>
            
            <div className="space-y-2.5">
              {Object.values(settings.widgets).map(wSettings => {
                let wName = wSettings.name;
                if (!wName) {
                  const builtin = WIDGETS.find(w => w.id === wSettings.id);
                  wName = builtin ? builtin.name : wSettings.id;
                }
                
                return (
                  <div key={wSettings.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-black/20 border border-white/[0.06] hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleWidget(wSettings.id, !wSettings.enabled)}
                        className={clsx(
                          "relative w-11 h-6 rounded-full transition-colors focus:outline-none cursor-pointer",
                          wSettings.enabled ? "bg-accent shadow-sm shadow-accent/25" : "bg-white/10"
                        )}
                        aria-label={`Alternar widget ${wName}`}
                      >
                        <span className={clsx(
                          "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform",
                          wSettings.enabled ? "translate-x-5" : "translate-x-0"
                        )} />
                      </button>
                      <span className={clsx("text-sm font-medium capitalize", wSettings.enabled ? "text-slate-200" : "text-slate-500 line-through")}>
                        {wName} {wSettings.isPlugin && <span className="text-[10px] font-mono bg-accent/20 text-accent px-2 py-0.5 rounded-full border border-accent/30 ml-2">Plugin</span>}
                      </span>
                    </div>

                    {wSettings.enabled && (
                      <div className="flex bg-black/30 rounded-xl p-1 border border-white/[0.06]">
                        {(['small', 'medium', 'large'] as WidgetSize[]).map(size => (
                          <button
                            key={size}
                            onClick={() => resizeWidget(wSettings.id, size)}
                            className={clsx(
                              "px-2.5 py-1 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer font-mono",
                              wSettings.size === size 
                                ? "bg-accent text-white shadow-sm shadow-accent/20" 
                                : "text-slate-400 hover:text-slate-200"
                            )}
                          >
                            {size === 'small' ? 'P' : size === 'medium' ? 'M' : 'G'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <hr className="border-white/[0.06]" />

          <SystemSection />

          <hr className="border-white/[0.06]" />

          <CloudSyncSection />

          <hr className="border-white/[0.06]" />

          {/* Recursos de Produção & Apoio */}
          <section>
            <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3.5 flex items-center gap-2">
              <Heart size={15} className="text-rose-400" /> Recursos de Lançamento & Apoio
            </h3>
            
            <div className="space-y-2.5">
              {/* Toggle Apoia.se */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/20 border border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => updateSettings({ showSupportButton: !settings.showSupportButton })}
                    className={clsx(
                      "relative w-11 h-6 rounded-full transition-colors focus:outline-none cursor-pointer",
                      settings.showSupportButton ? "bg-rose-500 shadow-sm shadow-rose-500/25" : "bg-white/10"
                    )}
                    aria-label="Alternar botão de apoio no cabeçalho"
                  >
                    <span className={clsx(
                      "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform",
                      settings.showSupportButton ? "translate-x-5" : "translate-x-0"
                    )} />
                  </button>
                  <div>
                    <span className="font-semibold text-slate-200 block text-xs">
                      Botão de Apoio no Cabeçalho
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Exibe atalho para doação/apoio comunitário (Apoia.se)
                    </span>
                  </div>
                </div>
              </div>

              {/* Botão Onboarding */}
              <button
                onClick={() => setIsOnboardingOpen(true)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-black/20 hover:bg-black/35 border border-white/[0.06] hover:border-white/10 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center text-accent">
                    <HelpCircle size={16} />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200 text-xs block">Guia de Boas-Vindas</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">Rever tutorial de introdução do painel</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </button>
            </div>
          </section>

          <hr className="border-white/[0.06]" />

          {/* Histórico de Versões & Sobre */}
          <section className="pt-1">
            <button
              onClick={() => setIsChangelogOpen(true)}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-accent/10 via-purple-500/10 to-pink-500/10 hover:from-accent/20 hover:to-pink-500/20 border border-accent/20 transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
                  <History size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-xs">Histórico de Versões</span>
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-accent/25 text-accent border border-accent/40">
                      v4.0.0
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Veja todas as novidades e melhorias entregues em cada versão
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
