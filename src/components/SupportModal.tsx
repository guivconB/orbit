import React from 'react';
import { X, Heart, ExternalLink, Coffee, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const handleOpenLink = (url: string) => {
    if (window.electronAPI && (window.electronAPI as any).openFile) {
      // Abre no navegador padrão se for link web
      window.open(url, '_blank');
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-app w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-widget/50">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <Heart size={18} className="fill-rose-400" />
            <span>Apoie o Orbit</span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-widget-hover rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
            <Coffee size={32} />
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-100">Gostou do Orbit?</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              O Orbit é um projeto independente, livre de anúncios e focado em privacidade. Se este painel ajuda no seu dia a dia e você deseja incentivar novas atualizações, considere apoiar o desenvolvimento contínuo!
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => handleOpenLink('https://apoia.se/orbit-dashboard')}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-medium p-3 rounded-xl shadow-lg transition-all"
            >
              <Heart size={16} className="fill-white" />
              <span>Apoiar no Apoia.se</span>
              <ExternalLink size={14} className="opacity-70 ml-1" />
            </button>

            <button
              onClick={() => handleOpenLink('https://github.com/guivconB/orbit')}
              className="w-full flex items-center justify-center gap-2 bg-widget hover:bg-widget-hover text-slate-200 border border-border p-2.5 rounded-xl transition-all text-xs font-medium"
            >
              <Sparkles size={14} className="text-indigo-400" />
              <span>Deixar uma Estrela no GitHub</span>
            </button>
          </div>
        </div>

        <div className="p-3 bg-widget/20 border-t border-border text-center text-[11px] text-slate-400">
          Obrigado por fazer parte dessa jornada! ❤️
        </div>
      </div>
    </div>
  );
}
