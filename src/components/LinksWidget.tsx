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

  const loadLinks = async () => {
    if (window.electronAPI && window.electronAPI.getLinks) {
      const data = await window.electronAPI.getLinks();
      setLinks(data);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newUrl) return;

    let finalUrl = newUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    if (window.electronAPI) {
      await window.electronAPI.addLink({ title: newTitle, url: finalUrl });
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
    <div className="bg-widget rounded-xl p-4 shadow-lg border border-border flex flex-col max-h-full h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-slate-200">Links Rápidos</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-1 rounded hover:bg-widget-hover text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="mb-4 bg-app p-3 rounded-lg border border-border">
          <input
            type="text"
            placeholder="Título (ex: GitHub)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-widget text-sm text-slate-200 p-2 rounded mb-2 border border-border outline-none focus:border-indigo-500"
            autoFocus
          />
          <input
            type="text"
            placeholder="URL (ex: github.com)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="w-full bg-widget text-sm text-slate-200 p-2 rounded mb-2 border border-border outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2 justify-end">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
            >
              Salvar
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
        {links.length === 0 && !isAdding ? (
          <div className="flex h-full items-center justify-center text-slate-500 text-sm italic">
            Nenhum link adicionado.
          </div>
        ) : (
          links.map(link => (
            <div key={link.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-widget-hover/50 transition-colors">
              <a 
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-slate-300 hover:text-indigo-400 truncate flex-1"
                title={link.url}
              >
                <ExternalLink size={14} className="shrink-0 opacity-70" />
                <span className="truncate text-sm font-medium">{link.title}</span>
              </a>
              <button 
                onClick={() => handleDelete(link.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all shrink-0 ml-2"
                title="Remover"
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
