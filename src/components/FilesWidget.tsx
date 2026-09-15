import React, { useState, useEffect } from 'react';
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
    loadFiles();
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

  const handleOpen = async (path: string) => {
    if (window.electronAPI) {
      await window.electronAPI.openFile(path);
    }
  };

  return (
    <div className="bg-widget rounded-xl p-4 shadow-lg border border-border flex flex-col max-h-full h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-slate-200">Atalhos de Arquivos</h2>
        <button 
          onClick={handleAdd}
          className="p-1 rounded hover:bg-widget-hover text-slate-400 hover:text-slate-200 transition-colors"
          title="Adicionar Arquivo ou Pasta"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
        {files.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500 text-sm italic">
            Nenhum atalho adicionado.
          </div>
        ) : (
          files.map(file => (
            <div key={file.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-widget-hover/50 transition-colors">
              <button 
                onClick={() => handleOpen(file.path)}
                className="flex items-center gap-2 text-slate-300 hover:text-indigo-400 truncate flex-1 text-left"
                title={file.path}
              >
                <FolderOpen size={14} className="shrink-0 opacity-70" />
                <span className="truncate text-sm font-medium">{file.name}</span>
              </button>
              <button 
                onClick={() => handleDelete(file.id)}
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
