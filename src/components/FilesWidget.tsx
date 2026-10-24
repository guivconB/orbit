import { useState, useEffect } from 'react';
import { Plus, Trash2, FolderOpen } from 'lucide-react';

export interface FileItem {
  id: number;
  name: string;
  path: string;
  created_at: string;
}

export function FilesWidget() {
  const [files, setFiles] = useState<FileItem[]>([]);

  const loadFiles = async () => {
    if (window.electronAPI && window.electronAPI.getFiles) {
      const data = await window.electronAPI.getFiles();
      setFiles(data);
    }
  };

  useEffect(() => {
    let active = true;
    window.electronAPI?.getFiles?.().then(data => {
      if (active && data) setFiles(data);
    });
    return () => { active = false; };
  }, []);

  const handleAdd = async () => {
    if (window.electronAPI && window.electronAPI.addFile) {
      const result = await window.electronAPI.addFile();
      if (result) {
        loadFiles();
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.electronAPI) {
      await window.electronAPI.deleteFile(id);
      loadFiles();
    }
  };

  const handleOpen = async (id: number) => {
    if (window.electronAPI) {
      await window.electronAPI.openFile(id);
    }
  };

  return (
    <div className="orbit-card p-4 flex flex-col max-h-full h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-100 tracking-wide">Atalhos de Arquivos</h2>
        <button 
          onClick={handleAdd}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Adicionar Arquivo ou Pasta"
          aria-label="Adicionar Arquivo ou Pasta"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
        {files.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500 text-xs italic tracking-wide">
            Nenhum atalho adicionado.
          </div>
        ) : (
          files.map(file => (
            <div key={file.id} className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] transition-all border border-transparent hover:border-white/[0.04]">
              <button 
                onClick={() => handleOpen(file.id)}
                className="flex items-center gap-2.5 text-slate-300 hover:text-accent truncate flex-1 text-left cursor-pointer transition-colors"
                title={file.path}
              >
                <FolderOpen size={15} className="shrink-0 text-slate-400 group-hover:text-accent transition-colors" />
                <span className="truncate text-sm font-medium">{file.name}</span>
              </button>
              <button 
                onClick={() => handleDelete(file.id)}
                className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all shrink-0 ml-2 cursor-pointer"
                title="Remover"
                aria-label="Remover atalho"
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
