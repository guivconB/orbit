import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import clsx from 'clsx';

export interface TaskItem {
  id: number;
  title: string;
  status: string; // 'todo', 'done', 'idea'
  created_at: string;
}

export function KanbanWidget() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activeTab, setActiveTab] = useState<'todo' | 'idea'>('todo');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const loadTasks = async () => {
    if (window.electronAPI && window.electronAPI.getTasks) {
      const data = await window.electronAPI.getTasks();
      setTasks(data);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (window.electronAPI) {
      await window.electronAPI.addTask({ title: newTitle, status: activeTab });
      setNewTitle('');
      setIsAdding(false);
      loadTasks();
    }
  };

  const handleToggleStatus = async (task: TaskItem) => {
    if (task.status === 'idea') return; // Ideas don't have checkboxes
    
    const newStatus = task.status === 'todo' ? 'done' : 'todo';
    if (window.electronAPI) {
      await window.electronAPI.updateTaskStatus(task.id, newStatus);
      loadTasks();
    }
  };

  const handleDelete = async (id: number) => {
    if (window.electronAPI) {
      await window.electronAPI.deleteTask(id);
      loadTasks();
    }
  };

  const filteredTasks = tasks.filter(t => 
    activeTab === 'todo' ? (t.status === 'todo' || t.status === 'done') : t.status === 'idea'
  );

  return (
    <div className="bg-widget rounded-xl p-4 shadow-lg border border-border flex flex-col max-h-full h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex bg-app rounded-lg p-1">
          <button 
            onClick={() => setActiveTab('todo')}
            className={clsx(
              "px-3 py-1 text-sm rounded-md transition-colors font-medium",
              activeTab === 'todo' ? "bg-slate-700 text-slate-100 shadow" : "text-slate-400 hover:text-slate-200"
            )}
          >
            Tarefas
          </button>
          <button 
            onClick={() => setActiveTab('idea')}
            className={clsx(
              "px-3 py-1 text-sm rounded-md transition-colors font-medium",
              activeTab === 'idea' ? "bg-slate-700 text-slate-100 shadow" : "text-slate-400 hover:text-slate-200"
            )}
          >
            Ideias
          </button>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-1 rounded hover:bg-widget-hover text-slate-400 hover:text-slate-200 transition-colors"
          title="Nova Tarefa/Ideia"
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
            className="w-full bg-app text-sm text-slate-200 p-2 rounded-lg border border-border outline-none focus:border-indigo-500"
            autoFocus
            onBlur={() => !newTitle && setIsAdding(false)}
          />
        </form>
      )}

      <div className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
        {filteredTasks.length === 0 && !isAdding ? (
          <div className="flex h-full items-center justify-center text-slate-500 text-sm italic">
            {activeTab === 'todo' ? "Tudo limpo por hoje!" : "Nenhuma ideia ainda."}
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-widget-hover/50 transition-colors">
              <div 
                className={clsx("flex items-center gap-3 overflow-hidden flex-1", activeTab !== 'idea' && "cursor-pointer")}
                onClick={() => handleToggleStatus(task)}
              >
                {activeTab === 'todo' && (
                  task.status === 'done' 
                    ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    : <Circle size={16} className="text-slate-500 shrink-0" />
                )}
                <span className={clsx(
                  "text-sm truncate transition-all duration-300", 
                  task.status === 'done' ? "text-slate-500 line-through" : "text-slate-300 font-medium"
                )}>
                  {task.title}
                </span>
              </div>
              <button 
                onClick={() => handleDelete(task.id)}
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
