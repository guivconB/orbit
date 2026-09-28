import React, { useState } from 'react';
import { Music, PlayCircle } from 'lucide-react';

export function MusicWidget() {
  const [provider, setProvider] = useState<'spotify' | 'youtube'>('spotify');

  return (
    <div className="bg-widget rounded-xl p-4 shadow-lg border border-border flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          {provider === 'spotify' ? <Music size={16} className="text-green-400" /> : <PlayCircle size={16} className="text-red-400" />}
          Player de Foco
        </h2>
        <div className="flex bg-slate-800 rounded p-1">
          <button
            onClick={() => setProvider('spotify')}
            className={`px-3 py-1 text-xs rounded transition-colors ${provider === 'spotify' ? 'bg-green-500/20 text-green-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Spotify
          </button>
          <button
            onClick={() => setProvider('youtube')}
            className={`px-3 py-1 text-xs rounded transition-colors ${provider === 'youtube' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            YT Music
          </button>
        </div>
      </div>

      <div className="flex-1 rounded-lg overflow-hidden bg-app">
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
          ></iframe>
        ) : (
          <iframe 
            width="100%" 
            height="100%" 
            src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=0" 
            title="Lofi Girl"
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        )}
      </div>
    </div>
  );
}
