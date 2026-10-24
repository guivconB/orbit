import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import clsx from 'clsx';

export interface TaskItem {
  id: number;
  title: string;
  status: TaskStatus;
  created_at: string;
}

export function KanbanWidget() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activeTab, setActiveTab] = useState<'todo' | 'idea'>('todo');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  // Só sincroniza depois de uma alteração do usuário, nunca na carga inicial.
  const changedByUser = useRef(false);

  const loadTasks = async () => {
    if (window.electronAPI && window.electronAPI.getTasks) {
      const data = await window.electronAPI.getTasks();
      setTasks(data);
    }
  };

  useEffect(() => {
    let active = true;
    window.electronAPI?.getTasks?.().then(data => {
      if (active && data) setTasks(data);
    });
    return () => { active = false; };
  }, []);

  // Debounced Cloud Sync for Tasks
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!changedByUser.current) return;
      import('../firebase/sync')
        .then(module => module.syncTasksToCloud(tasks))
        .catch(err => console.log('Firebase não configurado ou erro:', err));
    }, 2000);
    return () => clearTimeout(timer);
  }, [tasks]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (window.electronAPI) {
      changedByUser.current = true;
      await window.electronAPI.addTask({ title: newTitle.trim(), status: activeTab });
      setNewTitle('');
      setIsAdding(false);
      loadTasks();
    }
  };

  const handleToggleStatus = async (task: TaskItem) => {
    if (task.status === 'idea') return; // Ideas don't have checkboxes
    
    const newStatus = task.status === 'todo' ? 'done' : 'todo';
    if (window.electronAPI) {
      changedByUser.current = true;
      await window.electronAPI.updateTaskStatus(task.id, newStatus);
      loadTasks();
    }
  };

  const handleDelete = async (id: number) => {
    if (window.electronAPI) {
      changedByUser.current = true;
      await window.electronAPI.deleteTask(id);
      loadTasks();
    }
  };

  const todoPendingCount = tasks.filter(t => t.status === 'todo').length;
  const ideasCount = tasks.filter(t => t.status === 'idea').length;

  const filteredTasks = tasks.filter(t => 
    activeTab === 'todo' ? (t.status === 'todo' || t.status === 'done') : t.status === 'idea'
  );

  return (
    <div className="orbit-card p-4 flex flex-col max-h-full h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex bg-black/30 rounded-xl p-1 border border-white/[0.06]">
          <button 
            onClick={() => setActiveTab('todo')}
            className={clsx(
              "px-3 py-1.5 text-xs rounded-lg transition-all font-semibold flex items-center gap-1.5 cursor-pointer",
              activeTab === 'todo' 
                ? "bg-white/10 text-white shadow-sm" 
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <span>Tarefas</span>
            <span className={clsx(
              "text-[10px] px-1.5 py-0.2 rounded-full",
              activeTab === 'todo' ? "bg-accent/30 text-accent font-mono" : "text-slate-500 font-mono"
            )}>
              {todoPendingCount}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab('idea')}
            className={clsx(
              "px-3 py-1.5 text-xs rounded-lg transition-all font-semibold flex items-center gap-1.5 cursor-pointer",
              activeTab === 'idea' 
                ? "bg-white/10 text-white shadow-sm" 
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <span>Ideias</span>
            <span className={clsx(
              "text-[10px] px-1.5 py-0.2 rounded-full",
              activeTab === 'idea' ? "bg-accent/30 text-accent font-mono" : "text-slate-500 font-mono"
            )}>
              {ideasCount}
            </span>
          </button>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Nova Tarefa/Ideia"
          aria-label="Nova Tarefa ou Ideia"
        >
          <Plus size={16} />
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="mb-3">
          <input
            type="text"
            placeholder={activeTab === 'todo' ? "O que fazer hoje?" : "Qual é a sua ideia?"}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-black/30 text-sm text-slate-200 placeholder-slate-500 p-2.5 rounded-xl border border-white/[0.08] outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all font-sans"
            autoFocus
            onBlur={() => !newTitle && setIsAdding(false)}
          />
        </form>
      )}

      <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
        {filteredTasks.length === 0 && !isAdding ? (
          <div className="flex h-full items-center justify-center text-slate-500 text-xs italic tracking-wide">
            {activeTab === 'todo' ? "Tudo limpo por hoje!" : "Nenhuma ideia registrada ainda."}
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] transition-all border border-transparent hover:border-white/[0.04]">
              <div 
                className={clsx("flex items-center gap-3 overflow-hidden flex-1", activeTab !== 'idea' && "cursor-pointer")}
                onClick={() => handleToggleStatus(task)}
              >
                {activeTab === 'todo' && (
                  task.status === 'done' 
                    ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0 drop-shadow-[0_0_6px_rgba(52,211,153,0.3)]" />
                    : <Circle size={16} className="text-slate-500 group-hover:text-slate-400 shrink-0 transition-colors" />
                )}
                <span className={clsx(
                  "text-sm truncate transition-all duration-200", 
                  task.status === 'done' ? "text-slate-500 line-through" : "text-slate-200 font-medium"
                )}>
                  {task.title}
                </span>
              </div>
              <button 
                onClick={() => handleDelete(task.id)}
                className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all shrink-0 ml-2 cursor-pointer"
                title="Remover"
                aria-label="Remover tarefa"
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
