import { X, Heart, ExternalLink, Coffee, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xl p-4 animate-fadeIn">
      <div className="bg-app/95 w-full max-w-md rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-black/25">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm tracking-wide">
            <Heart size={16} className="fill-rose-400" />
            <span>Apoie o Orbit</span>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Fechar modal de apoio"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/25 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
            <Coffee size={28} />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-100">Gostou do Orbit?</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              O Orbit é um projeto independente, livre de anúncios e focado em privacidade. Se este painel ajuda no seu dia a dia e você deseja incentivar novas atualizações, considere apoiar o desenvolvimento contínuo!
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => handleOpenLink('https://apoia.se/orbit-dashboard')}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-medium p-3 rounded-xl shadow-lg shadow-rose-600/20 active:scale-95 transition-all cursor-pointer text-xs"
            >
              <Heart size={15} className="fill-white" />
              <span>Apoiar no Apoia.se</span>
              <ExternalLink size={13} className="opacity-80 ml-0.5" />
            </button>

            <button
              onClick={() => handleOpenLink('https://github.com/guivconB/orbit')}
              className="w-full flex items-center justify-center gap-2 bg-black/30 hover:bg-black/50 text-slate-200 border border-white/10 p-2.5 rounded-xl active:scale-95 transition-all text-xs font-medium cursor-pointer"
            >
              <Sparkles size={14} className="text-accent" />
              <span>Deixar uma Estrela no GitHub</span>
            </button>
          </div>
        </div>

        <div className="p-3 bg-black/30 border-t border-white/[0.06] text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <span>Obrigado por fazer parte dessa jornada!</span>
          <Heart size={12} className="fill-rose-500 text-rose-500 inline" />
        </div>
      </div>
    </div>
  );
}
