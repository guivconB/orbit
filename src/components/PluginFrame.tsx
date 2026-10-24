import { useEffect, useRef } from 'react';
import { useSettings } from '../hooks/useSettings';

// Plugins rodam num iframe isolado (sem allow-same-origin): não enxergam o app
// nem o window.electronAPI. Eles conversam com o Orbit só por postMessage,
// e só as mensagens listadas aqui são atendidas.
//
// API para quem escreve plugins:
//   parent.postMessage({ type: 'orbit:getTheme' }, '*')
//     -> responde { type: 'orbit:theme', theme: 'slate' | 'ocean' | 'emerald' | 'rose' }
//   parent.postMessage({ type: 'orbit:notify', title: '...', body: '...' }, '*')
//     -> mostra uma notificação do Windows

export function PluginFrame({ plugin }: { plugin: OrbitPlugin }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const { settings } = useSettings();

  useEffect(() => {
    const reply = (data: unknown) => frameRef.current?.contentWindow?.postMessage(data, '*');

    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      const msg = event.data;
      if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') return;

      switch (msg.type) {
        case 'orbit:getTheme':
          reply({ type: 'orbit:theme', theme: settings.theme });
          break;
        case 'orbit:notify':
          if (typeof msg.title === 'string') {
            window.electronAPI?.showNotification(
              `${plugin.name}: ${msg.title}`.slice(0, 120),
              String(msg.body ?? '').slice(0, 300),
            );
          }
          break;
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [plugin.name, settings.theme]);

  // Avisa o plugin quando o tema muda.
  useEffect(() => {
    frameRef.current?.contentWindow?.postMessage({ type: 'orbit:theme', theme: settings.theme }, '*');
  }, [settings.theme]);

  return (
    <div className="orbit-card flex flex-col h-full min-h-[400px] overflow-hidden">
      <div className="flex items-center p-3.5 border-b border-white/[0.06] bg-black/20">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-100 capitalize">{plugin.name}</h2>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 font-semibold">
            Plugin
          </span>
        </div>
      </div>
      <iframe
        ref={frameRef}
        title={plugin.name}
        srcDoc={plugin.content}
        className="flex-1 w-full h-full bg-transparent"
        frameBorder="0"
        sandbox="allow-scripts allow-popups"
      />
    </div>
  );
}
