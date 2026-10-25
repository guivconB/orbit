import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import clsx from 'clsx';
import type { Task, TaskStatus } from '../../shared/models';
import { useCollection } from '../hooks/useCollection';
import { WidgetShell, IconButton, EmptyState, inputClass } from './ui/WidgetShell';

type Tab = 'todo' | 'idea';

const PRIORITY_LABEL = { high: 'Prioridade alta', low: 'Prioridade baixa', normal: '' } as const;

export function KanbanWidget() {
  // A sincronização com a nuvem fica em useCloudSync (App), para valer também
  // para tarefas criadas pela IA ou pela paleta, e com este widget desativado.
  const { items: tasks, mutate } = useCollection<Task>('tasks', api => api.getTasks());
  const [activeTab, setActiveTab] = useState<Tab>('todo');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || !window.electronAPI) return;
    const api = window.electronAPI;
    setNewTitle('');
    setIsAdding(false);
    mutate(null, () => api.addTask({ title, status: activeTab }), 'Não foi possível criar a tarefa.');
  };

  const handleToggleStatus = (task: Task) => {
    if (task.status === 'idea' || !window.electronAPI) return;
    const api = window.electronAPI;
    const status: TaskStatus = task.status === 'todo' ? 'done' : 'todo';
    mutate(
      list => list.map(t => (t.id === task.id ? { ...t, status } : t)),
      () => api.updateTaskStatus(task.id, status),
    );
  };

  const handleDelete = (id: number) => {
    if (!window.electronAPI) return;
    const api = window.electronAPI;
    mutate(list => list.filter(t => t.id !== id), () => api.deleteTask(id), 'Não foi possível remover a tarefa.');
  };

  const todoPendingCount = tasks.filter(t => t.status === 'todo').length;
  const ideasCount = tasks.filter(t => t.status === 'idea').length;

  const filteredTasks = tasks.filter(t =>
    activeTab === 'todo' ? t.status === 'todo' || t.status === 'done' : t.status === 'idea',
  );

  const tabButton = (tab: Tab, label: string, count: number) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={clsx(
        'px-3 py-1.5 text-xs rounded-lg transition-all font-semibold flex items-center gap-1.5 cursor-pointer',
        activeTab === tab ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200',
      )}
    >
      <span>{label}</span>
      <span className={clsx('text-[10px] px-1.5 rounded-full font-mono', activeTab === tab ? 'bg-accent/30 text-accent' : 'text-slate-500')}>
        {count}
      </span>
    </button>
  );

  const header = (
    <div className="flex items-center justify-between mb-3">
      <div className="flex bg-black/30 rounded-xl p-1 border border-white/[0.06]">
        {tabButton('todo', 'Tarefas', todoPendingCount)}
        {tabButton('idea', 'Ideias', ideasCount)}
      </div>
      <IconButton label="Nova tarefa ou ideia" onClick={() => setIsAdding(!isAdding)}>
        <Plus size={16} />
      </IconButton>
    </div>
  );

  return (
    <WidgetShell header={header}>
      {isAdding && (
        <form onSubmit={handleAdd} className="mb-3">
          <input
            type="text"
            placeholder={activeTab === 'todo' ? 'O que fazer hoje?' : 'Qual é a sua ideia?'}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className={inputClass}
            autoFocus
            onBlur={() => !newTitle && setIsAdding(false)}
          />
        </form>
      )}

      <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
        {filteredTasks.length === 0 && !isAdding ? (
          <EmptyState>{activeTab === 'todo' ? 'Tudo limpo por hoje!' : 'Nenhuma ideia registrada ainda.'}</EmptyState>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] transition-all border border-transparent hover:border-white/[0.04]">
              <div
                className={clsx('flex items-center gap-3 overflow-hidden flex-1', activeTab !== 'idea' && 'cursor-pointer')}
                onClick={() => handleToggleStatus(task)}
              >
                {activeTab === 'todo' && (
                  task.status === 'done'
                    ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0 drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]" />
                    : <Circle size={16} className="text-slate-500 group-hover:text-slate-400 shrink-0 transition-colors" />
                )}
                <span className={clsx(
                  'text-sm truncate transition-all duration-200',
                  task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200 font-medium',
                )}>
                  {task.title}
                </span>
                {task.priority === 'high' && task.status !== 'done' && (
                  <span
                    className="shrink-0 text-[10px] font-bold font-mono px-1.5 rounded-full bg-accent/25 text-accent border border-accent/30"
                    title={PRIORITY_LABEL.high}
                  >
                    !
                  </span>
                )}
              </div>
              <IconButton
                label="Remover tarefa"
                tone="danger"
                size="sm"
                onClick={() => handleDelete(task.id)}
                className="opacity-0 group-hover:opacity-100 ml-2"
              >
                <Trash2 size={14} />
              </IconButton>
            </div>
          ))
        )}
      </div>
    </WidgetShell>
  );
}
