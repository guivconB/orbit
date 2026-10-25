import { Plus, Trash2, FolderOpen } from 'lucide-react';
import type { FileShortcut } from '../../shared/models';
import { useCollection } from '../hooks/useCollection';
import { toast } from '../lib/toast';
import { WidgetShell, IconButton, EmptyState } from './ui/WidgetShell';

export function FilesWidget() {
  const { items: files, mutate } = useCollection<FileShortcut>('files', api => api.getFiles());

  const handleAdd = () => {
    const api = window.electronAPI;
    if (api) mutate(null, () => api.addFile(), 'Não foi possível adicionar o atalho.');
  };

  const handleDelete = (id: number) => {
    const api = window.electronAPI;
    if (api) mutate(list => list.filter(f => f.id !== id), () => api.deleteFile(id), 'Não foi possível remover o atalho.');
  };

  const handleOpen = async (file: FileShortcut) => {
    const opened = await window.electronAPI?.openFile(file.id);
    if (opened === false) toast.error(`Não foi possível abrir "${file.name}". Ele pode ter sido movido ou apagado.`);
  };

  return (
    <WidgetShell
      title="Atalhos de Arquivos"
      actions={
        <IconButton label="Adicionar arquivo ou pasta" onClick={handleAdd}>
          <Plus size={16} />
        </IconButton>
      }
    >
      <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
        {files.length === 0 ? (
          <EmptyState>Nenhum atalho adicionado.</EmptyState>
        ) : (
          files.map(file => (
            <div key={file.id} className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] transition-all border border-transparent hover:border-white/[0.04]">
              <button
                onClick={() => handleOpen(file)}
                className="flex items-center gap-2.5 text-slate-300 hover:text-accent truncate flex-1 text-left cursor-pointer transition-colors"
                title={file.path}
              >
                <FolderOpen size={15} className="shrink-0 text-slate-400 group-hover:text-accent transition-colors" />
                <span className="truncate text-sm font-medium">{file.name}</span>
              </button>
              <IconButton label="Remover atalho" tone="danger" size="sm" onClick={() => handleDelete(file.id)} className="opacity-0 group-hover:opacity-100 ml-2">
                <Trash2 size={14} />
              </IconButton>
            </div>
          ))
        )}
      </div>
    </WidgetShell>
  );
}
