import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, Briefcase } from 'lucide-react';
import clsx from 'clsx';

export function PomodoroWidget() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play a sound or notification here ideally
      if (mode === 'work') {
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('work');
        setTimeLeft(25 * 60);
      }
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: 'work' | 'break') => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = mode === 'work' 
    ? ((25 * 60 - timeLeft) / (25 * 60)) * 100 
    : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className="bg-widget rounded-xl p-4 shadow-lg border border-border flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[400px]">
      {/* Background Progress bar */}
      <div 
        className={clsx(
          "absolute bottom-0 left-0 right-0 opacity-10 transition-all duration-1000 ease-linear",
          mode === 'work' ? "bg-indigo-500" : "bg-emerald-500"
        )}
        style={{ height: `${progress}%` }}
      />
      
      <div className="z-10 flex gap-2 mb-6 bg-app rounded-full p-1">
        <button
          onClick={() => switchMode('work')}
          className={clsx(
            "px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 transition-colors",
            mode === 'work' ? "bg-slate-700 text-indigo-400" : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Briefcase size={14} /> Foco
        </button>
        <button
          onClick={() => switchMode('break')}
          className={clsx(
            "px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 transition-colors",
            mode === 'break' ? "bg-slate-700 text-emerald-400" : "text-slate-400 hover:text-slate-200"
          )}
        >
          <Coffee size={14} /> Pausa
        </button>
      </div>

      <div className="z-10 text-6xl font-black tabular-nums tracking-tight mb-8 text-slate-100">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>

      <div className="z-10 flex items-center gap-4">
        <button 
          onClick={toggleTimer}
          className={clsx(
            "h-14 w-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95",
            mode === 'work' ? "bg-indigo-600 hover:bg-indigo-500" : "bg-emerald-600 hover:bg-emerald-500"
          )}
        >
          {isActive ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
        </button>
        <button 
          onClick={resetTimer}
          className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
          title="Reiniciar"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
