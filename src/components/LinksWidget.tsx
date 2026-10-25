import React, { useState } from 'react';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import type { Link } from '../../shared/models';
import { useCollection } from '../hooks/useCollection';
import { WidgetShell, IconButton, EmptyState } from './ui/WidgetShell';

const fieldClass =
  'w-full bg-black/40 text-sm text-slate-200 placeholder-slate-500 p-2.5 rounded-lg mb-2 border border-white/10 outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all font-sans';

export function LinksWidget() {
  const { items: links, mutate } = useCollection<Link>('links', api => api.getLinks());
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [error, setError] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim() || !window.electronAPI) return;
    const api = window.electronAPI;

    let url = newUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    try {
      new URL(url);
    } catch {
      setError('URL inválida.');
      return;
    }

    const title = newTitle.trim();
    setError('');
    setNewTitle('');
    setNewUrl('');
    setIsAdding(false);
    mutate(null, () => api.addLink({ title, url }), 'Não foi possível salvar o link.');
  };

  const handleDelete = (id: number) => {
    if (!window.electronAPI) return;
    const api = window.electronAPI;
    mutate(list => list.filter(l => l.id !== id), () => api.deleteLink(id), 'Não foi possível remover o link.');
  };

  return (
    <WidgetShell
      title="Links Rápidos"
      actions={
        <IconButton label="Adicionar link" onClick={() => setIsAdding(!isAdding)}>
          <Plus size={16} />
        </IconButton>
      }
    >
      {isAdding && (
        <form onSubmit={handleAdd} className="mb-4 bg-black/30 p-3.5 rounded-xl border border-white/[0.08]">
          <input type="text" placeholder="Título (ex: GitHub)" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className={fieldClass} autoFocus />
          <input type="text" placeholder="URL (ex: github.com)" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className={fieldClass} />
          {error && <p className="text-xs text-rose-400 mb-2">{error}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" className="px-3.5 py-1.5 text-xs bg-accent hover:opacity-90 active:scale-95 text-white font-medium rounded-lg shadow-sm transition-all cursor-pointer">
              Salvar
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
        {links.length === 0 && !isAdding ? (
          <EmptyState>Nenhum link adicionado.</EmptyState>
        ) : (
          links.map(link => (
            <div key={link.id} className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] transition-all border border-transparent hover:border-white/[0.04]">
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 text-slate-300 hover:text-accent truncate flex-1 transition-colors"
                title={link.url}
              >
                <ExternalLink size={14} className="shrink-0 text-slate-400 group-hover:text-accent transition-colors" />
                <span className="truncate text-sm font-medium">{link.title}</span>
              </a>
              <IconButton label="Remover link" tone="danger" size="sm" onClick={() => handleDelete(link.id)} className="opacity-0 group-hover:opacity-100 ml-2">
                <Trash2 size={14} />
              </IconButton>
            </div>
          ))
        )}
      </div>
    </WidgetShell>
  );
}
