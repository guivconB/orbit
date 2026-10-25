import { useState } from 'react';
import { Play, Pause, RotateCcw, Coffee, Briefcase, Settings2, X } from 'lucide-react';
import clsx from 'clsx';
import { useFocus } from '../focus/FocusContext';
import type { FocusDurations } from '../focus/limits';
import { MAX_LONG_BREAK_EVERY, MAX_MINUTES, MIN_LONG_BREAK_EVERY, MIN_MINUTES } from '../focus/limits';
import { IconButton } from './ui/WidgetShell';

const PRESETS = [15, 25, 45, 60];

const FIELDS: { key: keyof FocusDurations; label: string; min: number; max: number; suffix: string }[] = [
  { key: 'work', label: 'Foco', min: MIN_MINUTES, max: MAX_MINUTES, suffix: 'min' },
  { key: 'break', label: 'Pausa curta', min: MIN_MINUTES, max: MAX_MINUTES, suffix: 'min' },
  { key: 'longBreak', label: 'Pausa longa', min: MIN_MINUTES, max: MAX_MINUTES, suffix: 'min' },
  { key: 'longBreakEvery', label: 'Pausa longa a cada', min: MIN_LONG_BREAK_EVERY, max: MAX_LONG_BREAK_EVERY, suffix: 'ciclos' },
];

// O estado do timer fica no FocusContext; este widget só mostra e controla.
export function PomodoroWidget() {
  const {
    mode, isLongBreak, timeLeft, total, isRunning: isActive, durations, soundEnabled, completedCycles,
    toggle: toggleTimer, reset: resetTimer, switchMode, start, setDurations, setSoundEnabled,
  } = useFocus();
  const [showSettings, setShowSettings] = useState(false);
  const cycleInSet = (completedCycles % durations.longBreakEvery) + 1;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = total > 0 ? ((total - timeLeft) / total) * 100 : 0;

  return (
    <div className="orbit-card p-6 flex flex-col items-center justify-between h-full min-h-[400px] relative overflow-hidden">
      {/* Glow de fundo correspondente ao modo */}
      <div 
        className={clsx(
          "absolute -top-20 -left-20 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-25 transition-all duration-700",
          mode === 'work' ? "bg-accent" : "bg-emerald-400"
        )} 
      />

      <IconButton
        label={showSettings ? 'Fechar ajustes do Pomodoro' : 'Ajustar durações'}
        size="sm"
        onClick={() => setShowSettings(v => !v)}
        className="absolute top-3 right-3 z-20"
      >
        {showSettings ? <X size={14} /> : <Settings2 size={14} />}
      </IconButton>

      {showSettings && (
        <div className="absolute inset-0 z-10 bg-black/70 backdrop-blur-md p-5 pt-12 flex flex-col gap-2.5 overflow-y-auto custom-scrollbar">
          <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Durações</h3>
          {FIELDS.map(f => (
            <label key={f.key} className="flex items-center justify-between gap-3 text-sm text-slate-200">
              <span>{f.label}</span>
              <span className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={f.min}
                  max={f.max}
                  value={durations[f.key]}
                  onChange={e => e.target.value !== '' && setDurations({ [f.key]: Number(e.target.value) })}
                  className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-right font-mono text-sm outline-none focus:border-accent"
                  aria-label={f.label}
                />
                <span className="text-xs text-slate-400 w-10">{f.suffix}</span>
              </span>
            </label>
          ))}
          <label className="flex items-center justify-between gap-3 text-sm text-slate-200 mt-1 cursor-pointer">
            <span>Som ao terminar</span>
            <input type="checkbox" checked={soundEnabled} onChange={e => setSoundEnabled(e.target.checked)} className="accent-[var(--color-accent)] w-4 h-4" />
          </label>
          <p className="text-[11px] text-slate-500 mt-auto">As durações valem para os próximos ciclos.</p>
        </div>
      )}

      {/* Seletor de Modo (Foco / Pausa) no Grid de 8px */}
      <div className="flex bg-black/30 p-1 rounded-xl border border-white/[0.06] z-10">
        <button
          onClick={() => switchMode('work')}
          className={clsx(
            "px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer",
            mode === 'work' 
              ? "bg-accent text-white shadow-md shadow-accent/25" 
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Briefcase size={14} /> Foco
        </button>
        <button
          onClick={() => switchMode('break')}
          className={clsx(
            "px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer",
            mode === 'break' 
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25" 
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Coffee size={14} /> Pausa
        </button>
      </div>

      {/* Timer Centralizado com Tipografia Mono */}
      <div className="z-10 flex flex-col items-center my-auto">
        <div className="text-7xl font-bold font-mono tracking-tight text-white tabular-nums drop-shadow-sm">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        
        {/* Barra de progresso sutil */}
        <div className="w-48 h-1.5 bg-white/10 rounded-full mt-5 overflow-hidden">
          <div 
            className={clsx(
              "h-full rounded-full transition-all duration-1000",
              mode === 'work' ? "bg-accent" : "bg-emerald-400"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-3 text-[11px] font-mono text-slate-400 h-4">
          {mode === 'work' ? `Ciclo ${cycleInSet} de ${durations.longBreakEvery}` : isLongBreak ? 'Pausa longa' : 'Pausa curta'}
        </div>

        {!isActive && mode === 'work' && (
          <div className="flex gap-1.5 mt-3" aria-label="Começar foco rápido">
            {PRESETS.map(min => (
              <button
                key={min}
                onClick={() => start({ minutes: min })}
                className={clsx(
                  'px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition-colors cursor-pointer',
                  total === min * 60 ? 'border-accent/50 text-accent bg-accent/10' : 'border-white/10 text-slate-400 hover:text-white hover:border-white/25',
                )}
                title={`Começar foco de ${min} minutos`}
              >
                {min}m
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Controles de Ação com Micro-Interações */}
      <div className="z-10 flex items-center gap-4">
        <button 
          onClick={toggleTimer}
          className={clsx(
            "h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-200 active:scale-95 cursor-pointer",
            mode === 'work' 
              ? "bg-accent hover:opacity-90 shadow-accent/30" 
              : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
          )}
          title={isActive ? "Pausar" : "Iniciar"}
          aria-label={isActive ? "Pausar timer" : "Iniciar timer"}
        >
          {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
        </button>
        <button 
          onClick={resetTimer}
          className="h-11 w-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
          title="Reiniciar Timer"
          aria-label="Reiniciar timer"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
