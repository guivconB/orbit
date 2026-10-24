import { useState } from 'react';
import { X, Sparkles, ChevronDown, ChevronRight, Calendar, CheckCircle2 } from 'lucide-react';
import { CHANGELOG_DATA } from '../data/changelog';
import clsx from 'clsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangelogModal({ isOpen, onClose }: Props) {
  const [expandedVersion, setExpandedVersion] = useState<string>('v4.0.0');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xl p-4 animate-fadeIn">
      <div className="bg-app/95 w-full max-w-2xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-black/25">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center border border-accent/25">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Histórico de Versões
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Orbit V4
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Evolução contínua de funcionalidades e arquitetura</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Fechar histórico de versões"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3.5 custom-scrollbar">
          {CHANGELOG_DATA.map(ver => {
            const isExpanded = expandedVersion === ver.version;
            const isCurrent = ver.status === 'current';

            return (
              <div 
                key={ver.version} 
                className={clsx(
                  "rounded-2xl border transition-all overflow-hidden",
                  isCurrent 
                    ? "border-accent/40 bg-accent/10 shadow-sm" 
                    : "border-white/[0.06] bg-black/20 hover:border-white/10"
                )}
              >
                {/* Accordion Header */}
                <button
                  onClick={() => setExpandedVersion(isExpanded ? '' : ver.version)}
                  className="w-full p-4 flex items-center justify-between text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-slate-400">
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm font-mono">{ver.version}</span>
                        <span className="text-xs font-semibold text-slate-300">— {ver.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent text-white shadow-sm">
                            Atual
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {ver.date}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/[0.06] space-y-3 bg-black/20">
                    <p className="text-xs text-slate-300 italic pt-2 leading-relaxed">
                      {ver.summary}
                    </p>

                    <div className="space-y-2.5 pt-1">
                      {ver.features.map((feat, idx) => (
                        <div key={idx} className="bg-black/25 rounded-xl p-3 border border-white/[0.05]">
                          <h4 className="text-xs font-semibold text-slate-200 mb-2">
                            {feat.category}
                          </h4>
                          <ul className="space-y-1.5">
                            {feat.items.map((item, itemIdx) => (
                              <li key={itemIdx} className="text-xs text-slate-300 flex items-start gap-2">
                                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/[0.06] bg-black/25 flex items-center justify-between text-xs text-slate-400 px-6">
          <span>Orbit Dashboard &copy; 2026</span>
          <span className="text-accent font-semibold">Foco & produtividade</span>
        </div>

      </div>
    </div>
  );
}
