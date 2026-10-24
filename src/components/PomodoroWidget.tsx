import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Briefcase } from 'lucide-react';
import clsx from 'clsx';

const DURATION = { work: 25 * 60, break: 5 * 60 } as const;
type Mode = keyof typeof DURATION;

export function PomodoroWidget() {
  const [mode, setMode] = useState<Mode>('work');
  const [timeLeft, setTimeLeft] = useState<number>(DURATION.work);
  // Horário (ms) em que o ciclo termina. null = pausado.
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const isActive = endsAt !== null;

  useEffect(() => {
    if (endsAt === null) return;

    const tick = () => {
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setTimeLeft(left);
      if (left > 0) return;

      setEndsAt(null);
      const next: Mode = mode === 'work' ? 'break' : 'work';
      window.electronAPI?.showNotification(
        mode === 'work' ? 'Pomodoro Finalizado!' : 'Pausa Finalizada!',
        mode === 'work' ? 'Hora de fazer uma pausa.' : 'Hora de voltar ao foco.',
      );
      setMode(next);
      setTimeLeft(DURATION[next]);
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [endsAt, mode]);

  const toggleTimer = () => {
    setEndsAt(isActive ? null : Date.now() + timeLeft * 1000);
  };

  const resetTimer = () => {
    setEndsAt(null);
    setTimeLeft(DURATION[mode]);
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setEndsAt(null);
    setTimeLeft(DURATION[newMode]);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((DURATION[mode] - timeLeft) / DURATION[mode]) * 100;

  return (
    <div className="orbit-card p-6 flex flex-col items-center justify-between h-full min-h-[400px] relative overflow-hidden">
      {/* Glow de fundo correspondente ao modo */}
      <div 
        className={clsx(
          "absolute -top-20 -left-20 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-25 transition-all duration-700",
          mode === 'work' ? "bg-accent" : "bg-emerald-400"
        )} 
      />

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
