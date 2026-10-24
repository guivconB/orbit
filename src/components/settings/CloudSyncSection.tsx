import React, { useEffect, useState } from 'react';
import { Cloud } from 'lucide-react';

type SyncModule = typeof import('../../firebase/sync');

export function CloudSyncSection() {
  const [sync, setSync] = useState<SyncModule | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    import('../../firebase/sync')
      .then(mod => {
        setSync(mod);
        unsubscribe = mod.watchUser(user => setEmail(user?.email ?? null));
      })
      .catch(() => setUnavailable(true));
    return () => unsubscribe?.();
  }, []);

  const run = async (action: 'signIn' | 'signUp') => {
    if (!sync) return;
    setBusy(true);
    setError('');
    try {
      await sync[action](form.email.trim(), form.password);
      setForm({ email: '', password: '' });
    } catch (err) {
      setError(sync.authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run('signIn');
  };

  return (
    <section>
      <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3.5 flex items-center gap-2">
        <Cloud size={15} className="text-accent" /> Sincronização na Nuvem
      </h3>

      <div className="p-4 rounded-2xl bg-black/20 border border-white/[0.06]">
        {unavailable ? (
          <p className="text-xs text-slate-400">Firebase não configurado (falta src/firebase/config.ts).</p>
        ) : email ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Conectado como {email}</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Nota e tarefas são sincronizadas automaticamente na sua conta.</span>
            </div>
            <button
              onClick={() => sync?.logOut()}
              className="px-3 py-1.5 text-xs rounded-xl border border-white/10 text-slate-300 hover:bg-white/[0.08] hover:text-white transition-colors shrink-0 cursor-pointer"
            >
              Sair
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-2.5">
            <p className="text-xs text-slate-400 mb-1">
              Entre para sincronizar suas notas e tarefas em qualquer computador.
            </p>
            <input
              type="email"
              placeholder="E-mail"
              autoComplete="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full p-2.5 rounded-xl bg-black/30 border border-white/10 text-xs outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 text-white font-sans transition-all"
            />
            <input
              type="password"
              placeholder="Senha (mín. 6 caracteres)"
              autoComplete="current-password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full p-2.5 rounded-xl bg-black/30 border border-white/10 text-xs outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 text-white font-sans transition-all"
            />
            {error && <p className="text-xs text-rose-400">{error}</p>}
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                disabled={busy || !sync}
                onClick={() => run('signUp')}
                className="px-3.5 py-1.5 text-xs rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all disabled:opacity-50 cursor-pointer"
              >
                Criar conta
              </button>
              <button
                type="submit"
                disabled={busy || !sync}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-accent hover:opacity-90 active:scale-95 text-white shadow-sm shadow-accent/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {busy ? 'Aguarde...' : 'Entrar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
