import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface WidgetShellProps {
  /** Título do cartão. Use `header` para um cabeçalho totalmente próprio (ex.: abas). */
  title?: ReactNode;
  icon?: ReactNode;
  /** Etiqueta pequena ao lado do título */
  badge?: ReactNode;
  /** Botões do canto direito do cabeçalho */
  actions?: ReactNode;
  header?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Cartão padrão dos widgets. Mudar o visual aqui muda todos de uma vez. */
export function WidgetShell({ title, icon, badge, actions, header, className, children }: WidgetShellProps) {
  return (
    <div className={clsx('orbit-card p-4 flex flex-col h-full max-h-full', className)}>
      {header ?? (
        (title || actions) && (
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {icon}
              {title && <h2 className="text-sm font-bold text-slate-100 tracking-wide truncate">{title}</h2>}
              {badge}
            </div>
            {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
          </div>
        )
      )}
      {children}
    </div>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: 'default' | 'danger';
  size?: 'sm' | 'md';
}

/** Botão quadrado só com ícone. `label` vira o title e o aria-label. */
export function IconButton({ label, tone = 'default', size = 'md', className, children, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={clsx(
        'rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0',
        size === 'md' ? 'w-8 h-8' : 'w-7 h-7',
        tone === 'danger'
          ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/20'
          : 'text-slate-400 hover:text-white hover:bg-white/[0.08]',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center text-slate-500 text-xs italic tracking-wide text-center px-4">
      {children}
    </div>
  );
}

/** Campo de texto no padrão dos widgets */
export const inputClass =
  'w-full bg-black/30 text-sm text-slate-200 placeholder-slate-500 p-2.5 rounded-xl border border-white/[0.08] outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all font-sans';
