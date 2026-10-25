import React, { useState } from 'react';
import { Plus, Trash2, Check, BarChart2, X } from 'lucide-react';
import clsx from 'clsx';
import type { Habit } from '../../shared/models';
import { localDate, lastDays } from '../lib/date';
import { useCollection } from '../hooks/useCollection';
import { WidgetShell, IconButton, EmptyState, inputClass } from './ui/WidgetShell';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const toggleLog = (logs: string[], date: string) =>
  logs.includes(date) ? logs.filter(d => d !== date) : [...logs, date];

export function HabitsWidget() {
  const { items: habits, mutate } = useCollection<Habit>('habits', api => api.getHabits());
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  // Guarda só o id: os dados vêm sempre da lista atualizada.
  const [statsHabitId, setStatsHabitId] = useState<number | null>(null);
  const statsHabit = habits.find(h => h.id === statsHabitId) ?? null;

  // Datas locais (não UTC): depois das 21h o "hoje" continua sendo hoje.
  const todayStr = localDate();
  const days = lastDays(5);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    const api = window.electronAPI;
    if (!name || !api) return;
    setNewName('');
    setIsAdding(false);
    mutate(null, () => api.addHabit(name), 'Não foi possível criar o hábito.');
  };

  const handleToggle = (habitId: number, date: string) => {
    const api = window.electronAPI;
    if (!api) return;
    mutate(
      list => list.map(h => (h.id === habitId ? { ...h, logs: toggleLog(h.logs, date) } : h)),
      () => api.toggleHabitLog(habitId, date),
    );
  };

  const handleDelete = (id: number) => {
    const api = window.electronAPI;
    if (!api) return;
    if (statsHabitId === id) setStatsHabitId(null);
    mutate(list => list.filter(h => h.id !== id), () => api.deleteHabit(id), 'Não foi possível remover o hábito.');
  };

  // Generate last 35 days for stats grid (7 cols x 5 rows)
  const getStatsDays = () => lastDays(35);

  return (
    <WidgetShell
      title="Hábitos"
      className="relative"
      actions={
        <IconButton label="Adicionar hábito" onClick={() => setIsAdding(!isAdding)}>
          <Plus size={16} />
        </IconButton>
      }
    >

      {isAdding && (
        <form onSubmit={handleAdd} className="mb-3">
          <input
            type="text"
            placeholder="Ex: Beber 2L de água"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className={inputClass}
            autoFocus
            onBlur={() => !newName && setIsAdding(false)}
          />
        </form>
      )}

      {habits.length > 0 && !statsHabit && (
        <div className="flex text-[10px] text-slate-400 font-mono font-semibold tracking-wider justify-end gap-2 mb-2 pr-14 select-none">
          {days.map(d => {
            const dateObj = new Date(d + 'T00:00:00');
            return <div key={d} className="w-7 text-center">{dateObj.getDate()}</div>;
          })}
        </div>
      )}

      {!statsHabit ? (
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
          {habits.length === 0 && !isAdding ? (
            <EmptyState>Nenhum hábito rastreado.</EmptyState>
          ) : (
            habits.map(habit => (
              <div key={habit.id} className="group flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.03] transition-colors">
                <div className="text-sm text-slate-200 font-medium truncate flex-1 pr-2" title={habit.name}>
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
                          "w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                          isDone 
                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 font-bold" 
                            : "bg-white/[0.06] hover:bg-white/[0.12] text-transparent"
                        )}
                        title={date}
                        aria-label={`Marcar hábito para ${date}`}
                      >
                        {isDone && <Check size={13} strokeWidth={3.5} />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center ml-2 w-12 justify-end shrink-0 opacity-0 group-hover:opacity-100 transition-all gap-1">
                  <button 
                    onClick={() => setStatsHabitId(habit.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-white/[0.08] text-slate-400 hover:text-accent transition-colors cursor-pointer"
                    title="Estatísticas"
                    aria-label="Ver estatísticas"
                  >
                    <BarChart2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(habit.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Remover"
                    aria-label="Remover hábito"
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
        <div className="flex-1 flex flex-col bg-black/30 rounded-xl p-4 border border-white/[0.08] animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-100 text-sm tracking-wide">{statsHabit.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Últimos 35 dias (Heatmap)</p>
            </div>
            <button 
              onClick={() => setStatsHabitId(null)}
              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full cursor-pointer"
              title="Fechar Estatísticas"
              aria-label="Fechar estatísticas"
            >
              <X size={14} />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Weekday indicators */}
            <div className="grid grid-cols-7 gap-1.5 mb-1.5 w-fit">
              {WEEKDAYS.map((w, idx) => (
                <div key={idx} className="w-6 text-center text-[9px] font-mono text-slate-500 font-bold">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {getStatsDays().map((date) => {
                const isDone = statsHabit.logs.includes(date);
                const dObj = new Date(date + 'T00:00:00');
                const isToday = date === todayStr;
                return (
                  <button
                    key={date}
                    onClick={() => handleToggle(statsHabit.id, date)}
                    title={date}
                    className={clsx(
                      "w-6 h-6 rounded-[6px] text-[10px] font-mono font-semibold flex items-center justify-center transition-all cursor-pointer",
                      isDone 
                        ? "bg-accent text-white shadow-sm shadow-accent/25" 
                        : "bg-white/[0.06] text-slate-400 hover:bg-white/[0.12] hover:text-slate-200",
                      isToday && !isDone && "ring-1 ring-accent"
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
    </WidgetShell>
  );
}
