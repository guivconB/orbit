import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink } from 'lucide-react';

export interface LinkItem {
  id: number;
  title: string;
  url: string;
  category: string;
  created_at: string;
}

export function LinksWidget() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [error, setError] = useState('');

  const loadLinks = async () => {
    if (window.electronAPI && window.electronAPI.getLinks) {
      const data = await window.electronAPI.getLinks();
      setLinks(data);
    }
  };

  useEffect(() => {
    let active = true;
    window.electronAPI?.getLinks?.().then(data => {
      if (active && data) setLinks(data);
    });
    return () => { active = false; };
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    let finalUrl = newUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    try {
      new URL(finalUrl);
    } catch {
      setError('URL inválida.');
      return;
    }

    if (window.electronAPI) {
      setError('');
      await window.electronAPI.addLink({ title: newTitle.trim(), url: finalUrl });
      setNewTitle('');
      setNewUrl('');
      setIsAdding(false);
      loadLinks();
    }
  };

  const handleDelete = async (id: number) => {
    if (window.electronAPI) {
      await window.electronAPI.deleteLink(id);
      loadLinks();
    }
  };

  return (
    <div className="orbit-card p-4 flex flex-col max-h-full h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-100 tracking-wide">Links Rápidos</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Adicionar Link"
          aria-label="Adicionar Link"
        >
          <Plus size={16} />
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="mb-4 bg-black/30 p-3.5 rounded-xl border border-white/[0.08]">
          <input
            type="text"
            placeholder="Título (ex: GitHub)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-black/40 text-sm text-slate-200 placeholder-slate-500 p-2.5 rounded-lg mb-2 border border-white/10 outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all font-sans"
            autoFocus
          />
          <input
            type="text"
            placeholder="URL (ex: github.com)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="w-full bg-black/40 text-sm text-slate-200 placeholder-slate-500 p-2.5 rounded-lg mb-2 border border-white/10 outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all font-sans"
          />
          {error && <p className="text-xs text-rose-400 mb-2">{error}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-3.5 py-1.5 text-xs bg-accent hover:opacity-90 active:scale-95 text-white font-medium rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Salvar
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
        {links.length === 0 && !isAdding ? (
          <div className="flex h-full items-center justify-center text-slate-500 text-xs italic tracking-wide">
            Nenhum link adicionado.
          </div>
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
              <button 
                onClick={() => handleDelete(link.id)}
                className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all shrink-0 ml-2 cursor-pointer"
                title="Remover"
                aria-label="Remover link"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
