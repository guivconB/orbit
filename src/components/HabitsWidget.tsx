import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, BarChart2, X } from 'lucide-react';
import clsx from 'clsx';

export interface HabitItem {
  id: number;
  name: string;
  logs: string[];
}

export function HabitsWidget() {
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [statsHabit, setStatsHabit] = useState<HabitItem | null>(null);

  // Generate last 5 days
  const today = new Date();
  const days = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (4 - i));
    return d.toISOString().split('T')[0];
  });

  const loadHabits = async () => {
    if (window.electronAPI && window.electronAPI.getHabits) {
      const data = await window.electronAPI.getHabits();
      setHabits(data);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    if (window.electronAPI) {
      await window.electronAPI.addHabit(newName);
      setNewName('');
      setIsAdding(false);
      loadHabits();
    }
  };

  const handleToggle = async (habitId: number, date: string) => {
    if (window.electronAPI) {
      await window.electronAPI.toggleHabitLog(habitId, date);
      loadHabits();
      if (statsHabit && statsHabit.id === habitId) {
        // Optimistically update statsHabit
        const isDone = statsHabit.logs.includes(date);
        setStatsHabit({
          ...statsHabit,
          logs: isDone ? statsHabit.logs.filter(d => d !== date) : [...statsHabit.logs, date]
        });
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.electronAPI) {
      await window.electronAPI.deleteHabit(id);
      loadHabits();
      if (statsHabit && statsHabit.id === id) {
        setStatsHabit(null);
      }
    }
  };

  // Generate last 35 days for stats grid (7 cols x 5 rows)
  const getStatsDays = () => {
    return Array.from({ length: 35 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (34 - i));
      return d.toISOString().split('T')[0];
    });
  };

  return (
    <div className="bg-widget rounded-xl p-4 shadow-lg border border-border flex flex-col max-h-full h-full relative">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-slate-200">Hábitos</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="p-1 rounded hover:bg-widget-hover text-slate-400 hover:text-slate-200 transition-colors"
          title="Adicionar Hábito"
        >
          <Plus size={16} />
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="mb-3">
          <input
            type="text"
            placeholder="Ex: Beber 2L de água"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full bg-app text-sm text-slate-200 p-2 rounded-lg border border-border outline-none focus:border-indigo-500"
            autoFocus
            onBlur={() => !newName && setIsAdding(false)}
          />
        </form>
      )}

      {habits.length > 0 && !statsHabit && (
        <div className="flex text-[10px] text-slate-500 font-medium tracking-wider uppercase justify-end gap-2 mb-2 pr-12">
          {days.map(d => {
            const dateObj = new Date(d + 'T00:00:00');
            return <div key={d} className="w-6 text-center">{dateObj.getDate()}</div>;
          })}
        </div>
      )}

      {!statsHabit ? (
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
          {habits.length === 0 && !isAdding ? (
            <div className="flex h-full items-center justify-center text-slate-500 text-sm italic">
              Nenhum hábito rastreado.
            </div>
          ) : (
            habits.map(habit => (
              <div key={habit.id} className="group flex items-center justify-between transition-colors">
                <div className="text-sm text-slate-300 font-medium truncate flex-1 pr-2" title={habit.name}>
                  {habit.name}
                </div>
                
                <div className="flex items-center gap-2">
                  {days.map(date => {
                    const isDone = habit.logs.includes(date);
                    return (
                      <button
                        key={date}
                        onClick={() => handleToggle(habit.id, date)}
                        className={clsx(
                          "w-6 h-6 rounded flex items-center justify-center transition-all",
                          isDone ? "bg-emerald-500 text-white shadow-sm" : "bg-slate-700 hover:bg-slate-600 text-transparent"
                        )}
                        title={date}
                      >
                        {isDone && <Check size={12} strokeWidth={4} />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center ml-2 w-10 justify-end shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => setStatsHabit(habit)}
                    className="p-1 text-slate-500 hover:text-indigo-400 transition-colors"
                    title="Estatísticas"
                  >
                    <BarChart2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(habit.id)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    title="Remover"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Stats View */
        <div className="flex-1 flex flex-col bg-app rounded-xl p-4 border border-border animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-200 text-sm">{statsHabit.name}</h3>
              <p className="text-xs text-slate-500">Últimos 35 dias (Heatmap)</p>
            </div>
            <button 
              onClick={() => setStatsHabit(null)}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors bg-widget rounded-full"
            >
              <X size={14} />
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <div className="grid grid-cols-7 gap-2">
              {getStatsDays().map((date) => {
                const isDone = statsHabit.logs.includes(date);
                const dObj = new Date(date + 'T00:00:00');
                const isToday = date === today.toISOString().split('T')[0];
                return (
                  <button
                    key={date}
                    onClick={() => handleToggle(statsHabit.id, date)}
                    title={`${date}`}
                    className={clsx(
                      "w-6 h-6 rounded-sm text-[9px] font-bold flex items-center justify-center transition-all",
                      isDone 
                        ? "bg-emerald-500 text-emerald-950 shadow-sm" 
                        : "bg-widget text-slate-600 hover:bg-slate-700",
                      isToday && !isDone && "ring-1 ring-indigo-500"
                    )}
                  >
                    {dObj.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
