import { useSyncExternalStore } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import clsx from 'clsx';
import { dismissToast, getToasts, subscribeToasts } from '../../lib/toast';

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };

export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts);

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none" aria-live="polite">
      {toasts.map(t => {
        const Icon = ICONS[t.kind];
        return (
          <div
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className={clsx(
              'orbit-card pointer-events-auto flex items-start gap-2.5 pl-3 pr-2 py-2.5 min-w-[240px] max-w-[360px] text-sm',
              t.kind === 'error' && 'border-rose-500/40',
              t.kind === 'success' && 'border-emerald-500/40',
            )}
          >
            <Icon
              size={16}
              className={clsx(
                'shrink-0 mt-0.5',
                t.kind === 'error' ? 'text-rose-400' : t.kind === 'success' ? 'text-emerald-400' : 'text-accent',
              )}
            />
            <span className="flex-1 text-slate-200 select-text">{t.message}</span>
            <button
              onClick={() => dismissToast(t.id)}
              className="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-white cursor-pointer"
              aria-label="Fechar aviso"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
