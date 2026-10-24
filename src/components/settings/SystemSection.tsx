import { useEffect, useState } from 'react';
import { Cpu } from 'lucide-react';
import clsx from 'clsx';

const SHORTCUT_LABELS: Record<string, string> = {
  'CommandOrControl+Space': 'Ctrl + Espaço',
  'CommandOrControl+Shift+Space': 'Ctrl + Shift + Espaço',
  'CommandOrControl+Alt+O': 'Ctrl + Alt + O',
  '': 'Desativado',
};

export function SystemSection() {
  const [prefs, setPrefs] = useState<OrbitPreferences | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    window.electronAPI?.getPreferences().then(setPrefs);
  }, []);

  if (!prefs) return null;

  const update = async (patch: Parameters<ElectronAPI['setPreferences']>[0]) => {
    const res = await window.electronAPI!.setPreferences(patch);
    setPrefs(res.prefs);
    setError(res.ok ? '' : res.error ?? 'Não foi possível salvar.');
  };

  return (
    <section>
      <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3.5 flex items-center gap-2">
        <Cpu size={15} className="text-accent" /> Sistema
      </h3>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/20 border border-white/[0.06]">
          <div>
            <span className="font-semibold text-slate-200 block text-xs">Iniciar com o Windows</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {prefs.isPackaged ? 'Abre o Orbit automaticamente ao ligar o PC' : 'Disponível na versão instalada (.exe)'}
            </span>
          </div>
          <button
            onClick={() => update({ openAtLogin: !prefs.openAtLogin })}
            className={clsx(
              'relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer',
              prefs.openAtLogin ? 'bg-accent shadow-sm shadow-accent/25' : 'bg-white/10'
            )}
            aria-pressed={prefs.openAtLogin}
            aria-label="Iniciar com o Windows"
          >
            <span className={clsx('absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform', prefs.openAtLogin && 'translate-x-5')} />
          </button>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/20 border border-white/[0.06]">
          <div>
            <span className="font-semibold text-slate-200 block text-xs">Modo de Inicialização</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Em janela, o Orbit lembra o tamanho e a posição</span>
          </div>
          <div className="flex bg-black/30 rounded-xl p-1 border border-white/[0.06] shrink-0">
            {(['fullscreen', 'window'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => update({ startMode: mode })}
                className={clsx(
                  'px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                  prefs.startMode === mode 
                    ? 'bg-accent text-white shadow-sm shadow-accent/20' 
                    : 'text-slate-400 hover:text-slate-200',
                )}
              >
                {mode === 'fullscreen' ? 'Tela cheia' : 'Janela'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/20 border border-white/[0.06]">
          <div>
            <span className="font-semibold text-slate-200 block text-xs">Atalho Global</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Mostra ou esconde o Orbit de qualquer aplicativo</span>
          </div>
          <select
            value={prefs.shortcut}
            onChange={e => update({ shortcut: e.target.value })}
            className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 shrink-0 cursor-pointer font-sans"
          >
            {prefs.shortcutOptions.map(s => (
              <option key={s} value={s} className="bg-slate-900 text-slate-200">{SHORTCUT_LABELS[s] ?? s}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-xs text-rose-400 px-1">{error}</p>}
      </div>
    </section>
  );
}
