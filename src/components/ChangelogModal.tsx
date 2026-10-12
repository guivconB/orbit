import React, { useState } from 'react';
import { X, Sparkles, ChevronDown, ChevronRight, Tag, Calendar, CheckCircle2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-app w-full max-w-2xl rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-widget/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Histórico de Versões
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  Orbit V4
                </span>
              </h2>
              <p className="text-xs text-slate-400">Evolução contínua de funcionalidades e arquitetura</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-widget-hover rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
          {CHANGELOG_DATA.map(ver => {
            const isExpanded = expandedVersion === ver.version;
            const isCurrent = ver.status === 'current';

            return (
              <div 
                key={ver.version} 
                className={clsx(
                  "rounded-xl border transition-all overflow-hidden",
                  isCurrent 
                    ? "border-indigo-500/40 bg-widget/40 shadow-sm" 
                    : "border-border/80 bg-widget/20 hover:border-slate-600"
                )}
              >
                {/* Accordion Header */}
                <button
                  onClick={() => setExpandedVersion(isExpanded ? '' : ver.version)}
                  className="w-full p-4 flex items-center justify-between text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-slate-400">
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-base">{ver.version}</span>
                        <span className="text-sm font-medium text-slate-300">— {ver.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500 text-white shadow-sm">
                            Atual
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {ver.date}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-border/50 space-y-3 bg-app/30">
                    <p className="text-xs text-slate-300 italic pt-2">
                      {ver.summary}
                    </p>

                    <div className="space-y-3 pt-1">
                      {ver.features.map((feat, idx) => (
                        <div key={idx} className="bg-widget/40 rounded-lg p-3 border border-border/40">
                          <h4 className="text-xs font-semibold text-slate-200 mb-2">
                            {feat.category}
                          </h4>
                          <ul className="space-y-1.5">
                            {feat.items.map((item, itemIdx) => (
                              <li key={itemIdx} className="text-xs text-slate-300 flex items-start gap-2">
                                <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                                <span>{item}</span>
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
        <div className="p-3 border-t border-border bg-widget/30 flex items-center justify-between text-xs text-slate-400 px-6">
          <span>Orbit Dashboard &copy; 2026</span>
          <span className="text-indigo-400 font-medium">Construído para foco & produtividade</span>
        </div>

      </div>
    </div>
  );
}
