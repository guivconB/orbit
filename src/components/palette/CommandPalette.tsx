import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Calculator, Command, FileText, Link as LinkIcon, Plus, Search, Sparkles, Zap } from 'lucide-react';
import clsx from 'clsx';
import { useActions } from '../../actions/useActions';
import { findAction } from '../../actions/registry';
import type { OrbitAction } from '../../actions/types';
import { askAi } from '../../ai/bus';
import { toast } from '../../lib/toast';
import { buildItems } from '../../palette/items';
import type { PaletteData, PaletteItem, PaletteRun } from '../../palette/items';

const EMPTY_DATA: PaletteData = { tasks: [], links: [], files: [], habits: [] };

const GROUP_ICON = { Calculadora: Calculator, Criar: Plus, Encontrado: Search, Comandos: Zap, IA: Sparkles } as const;

function itemIcon(item: PaletteItem) {
  if (item.run.kind === 'open-link') return LinkIcon;
  if (item.run.kind === 'open-file') return FileText;
  return GROUP_ICON[item.group];
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  if (!open) return null;
  return createPortal(<PaletteBody onClose={onClose} />, document.body);
}

function PaletteBody({ onClose }: { onClose: () => void }) {
  const { actions, run } = useActions();
  const [query, setQuery] = useState('');
  const [data, setData] = useState<PaletteData>(EMPTY_DATA);
  const [selected, setSelected] = useState(0);
  const [formAction, setFormAction] = useState<OrbitAction | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Dados para a busca, lidos a cada abertura
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;
    Promise.all([api.getTasks(), api.getLinks(), api.getFiles(), api.getHabits()])
      .then(([tasks, links, files, habits]) => setData({ tasks, links, files, habits }))
      .catch(err => console.error('Paleta: falha ao carregar dados', err));
  }, []);

  const items = useMemo(() => buildItems(query, data, actions), [query, data, actions]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${selected}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  const execute = async (target: PaletteRun) => {
    switch (target.kind) {
      case 'form': {
        const action = findAction(target.actionId);
        if (action) setFormAction(action);
        return;
      }
      case 'action': {
        const res = await run(target.actionId, target.params);
        if (res.ok) toast.success(res.message);
        else toast.error(res.error);
        if (res.ok) onClose();
        return;
      }
      case 'copy':
        try {
          await navigator.clipboard.writeText(target.text);
          toast.success(`Copiado: ${target.text}`);
        } catch {
          toast.error('Não foi possível copiar.');
        }
        onClose();
        return;
      case 'open-link':
        window.open(target.url, '_blank');
        onClose();
        return;
      case 'open-file': {
        const ok = await window.electronAPI?.openFile(target.id);
        if (ok === false) toast.error(`Não foi possível abrir "${target.name}".`);
        onClose();
        return;
      }
      case 'ask-ai':
        if (askAi(target.text)) onClose();
        else toast.error('Ative o widget "Assistente IA" nas configurações para perguntar à IA.');
        return;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (formAction) setFormAction(null);
      else onClose();
      return;
    }
    if (formAction) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(items.length - 1, s + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(0, s - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[selected];
      if (item) execute(item.run);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[12vh] px-4"
      onMouseDown={e => e.target === e.currentTarget && onClose()}
      onKeyDown={onKeyDown}
      role="dialog"
      aria-label="Paleta de comandos"
    >
      <div className="orbit-card w-full max-w-xl overflow-hidden flex flex-col max-h-[70vh] !bg-[var(--theme-app)]/95">
        {formAction ? (
          <ActionForm action={formAction} onBack={() => setFormAction(null)} onSubmit={params => execute({ kind: 'action', actionId: formAction.id, params })} />
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08]">
              <Command size={16} className="text-accent shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setSelected(0);
                }}
                placeholder="Digite um comando, uma tarefa, uma conta…"
                className="flex-1 bg-transparent outline-none text-sm text-slate-100 placeholder-slate-500"
                aria-label="Buscar comando"
                aria-activedescendant={items[selected] ? `palette-${items[selected].id}` : undefined}
              />
              <kbd className="text-[10px] font-mono text-slate-500 border border-white/10 rounded px-1.5 py-0.5">Esc</kbd>
            </div>

            <div ref={listRef} className="overflow-y-auto custom-scrollbar py-1.5" role="listbox">
              {items.length === 0 && <div className="px-4 py-6 text-center text-xs text-slate-500">Nada encontrado.</div>}
              {items.map((item, index) => {
                const Icon = itemIcon(item);
                const header = index === 0 || items[index - 1].group !== item.group ? item.group : null;
                return (
                  <React.Fragment key={item.id}>
                    {header && <div className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-wider font-bold text-slate-500">{header}</div>}
                    <button
                      id={`palette-${item.id}`}
                      data-index={index}
                      role="option"
                      aria-selected={index === selected}
                      onMouseMove={() => setSelected(index)}
                      onClick={() => execute(item.run)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-2 text-left cursor-pointer',
                        index === selected ? 'bg-accent/15' : 'hover:bg-white/[0.04]',
                      )}
                    >
                      <Icon size={15} className={clsx('shrink-0', index === selected ? 'text-accent' : 'text-slate-400')} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-slate-100 truncate">{item.title}</span>
                        {item.subtitle && <span className="block text-[11px] text-slate-500 truncate">{item.subtitle}</span>}
                      </span>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            <div className="px-4 py-2 border-t border-white/[0.06] text-[10px] text-slate-500 flex gap-4">
              <span>↑↓ navegar</span>
              <span>Enter executar</span>
              <span>Ctrl+K abrir/fechar</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Formulário gerado a partir dos parâmetros da ação. */
function ActionForm({ action, onBack, onSubmit }: {
  action: OrbitAction;
  onBack: () => void;
  onSubmit: (params: Record<string, unknown>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(Object.fromEntries(Object.entries(values).filter(([, v]) => v !== '')));
  };

  const fieldClass = 'w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent focus:ring-1 focus:ring-accent/30';

  return (
    <form onSubmit={submit} className="p-4 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer" aria-label="Voltar">
          <ArrowLeft size={14} />
        </button>
        <div>
          <div className="text-sm font-bold text-slate-100">{action.title}</div>
          <div className="text-[11px] text-slate-500">{action.description}</div>
        </div>
      </div>

      {action.params.map((p, i) => (
        <label key={p.name} className="flex flex-col gap-1 text-xs text-slate-300">
          <span>{p.description}{p.required && <span className="text-accent"> *</span>}</span>
          {p.enum ? (
            <select
              autoFocus={i === 0}
              required={p.required}
              value={values[p.name] ?? ''}
              onChange={e => setValues(v => ({ ...v, [p.name]: e.target.value }))}
              className={fieldClass}
            >
              <option value="">{p.required ? 'Escolha…' : '(padrão)'}</option>
              {p.enum.map(opt => <option key={opt} value={opt} className="bg-slate-900">{opt}</option>)}
            </select>
          ) : (
            <input
              autoFocus={i === 0}
              required={p.required}
              type={p.type === 'number' ? 'number' : 'text'}
              min={p.min}
              max={p.max}
              value={values[p.name] ?? ''}
              onChange={e => setValues(v => ({ ...v, [p.name]: e.target.value }))}
              className={fieldClass}
            />
          )}
        </label>
      ))}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onBack} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer">Voltar</button>
        <button type="submit" className="px-3.5 py-1.5 text-xs bg-accent text-white font-semibold rounded-lg hover:opacity-90 cursor-pointer">Executar</button>
      </div>
    </form>
  );
}
