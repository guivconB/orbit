import { useState } from 'react';
import { Music, PlayCircle } from 'lucide-react';

export function MusicWidget() {
  const [provider, setProvider] = useState<'spotify' | 'youtube'>('spotify');

  return (
    <div className="orbit-card p-4 flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 tracking-wide">
          {provider === 'spotify' ? (
            <Music size={16} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]" />
          ) : (
            <PlayCircle size={16} className="text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.3)]" />
          )}
          Player de Foco
        </h2>
        <div className="flex bg-black/30 rounded-xl p-1 border border-white/[0.06]">
          <button
            onClick={() => setProvider('spotify')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              provider === 'spotify' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            Spotify
          </button>
          <button
            onClick={() => setProvider('youtube')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              provider === 'youtube' 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            YT Music
          </button>
        </div>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden bg-black/40 border border-white/[0.06] shadow-inner">
        {provider === 'spotify' ? (
          <iframe 
            style={{ borderRadius: '12px' }} 
            src="https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0" 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            allowFullScreen={false} 
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
            loading="lazy"
          />
        ) : (
          <iframe 
            width="100%" 
            height="100%" 
            src="https://www.youtube-nocookie.com/embed/jfKfPfyJRdk?autoplay=0" 
            title="Lofi Girl"
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
}
