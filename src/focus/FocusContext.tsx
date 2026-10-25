import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { clampMinutes, formatClock, nextCycle, normalizeDurations } from './limits';
import type { FocusDurations, FocusMode } from './limits';
import { playChime } from './chime';

// Estado global do Pomodoro e do player de música.
// Fica acima dos widgets para que paleta de comandos, IA e Modo Zen possam
// iniciar o foco ou trocar a música, e para o timer continuar rodando
// mesmo com o widget do Pomodoro desativado.

export type { FocusDurations, FocusMode };
export type MusicProvider = 'spotify' | 'youtube';

const DURATIONS_KEY = 'orbit_focus_durations';
const SOUND_KEY = 'orbit_focus_sound';

function loadDurations(): FocusDurations {
  try {
    return normalizeDurations(JSON.parse(localStorage.getItem(DURATIONS_KEY) ?? 'null'));
  } catch {
    return normalizeDurations(null);
  }
}

function loadSound(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // sem armazenamento: vale só nesta sessão
  }
}

export interface FocusApi {
  mode: FocusMode;
  /** a pausa atual é a pausa longa */
  isLongBreak: boolean;
  /** segundos restantes */
  timeLeft: number;
  /** duração total do ciclo atual, em segundos */
  total: number;
  isRunning: boolean;
  durations: FocusDurations;
  soundEnabled: boolean;
  /** ciclos de foco concluídos desde que o app abriu */
  completedCycles: number;
  /** Inicia um ciclo. Sem argumentos, usa a duração configurada do modo. */
  start: (options?: { minutes?: number; mode?: FocusMode }) => void;
  pause: () => void;
  /** Pausa se estiver rodando; senão continua de onde parou. */
  toggle: () => void;
  reset: () => void;
  switchMode: (mode: FocusMode) => void;
  setDurations: (patch: Partial<FocusDurations>) => void;
  setSoundEnabled: (enabled: boolean) => void;
}

export interface MusicApi {
  provider: MusicProvider;
  /** Muda a cada pedido de "tocar agora"; o player usa para reiniciar com autoplay. */
  autoplayToken: number;
  setProvider: (provider: MusicProvider) => void;
  /** Troca para a rádio Lo-Fi e começa a tocar. */
  playLofi: () => void;
}

const FocusContext = createContext<FocusApi | null>(null);
const MusicContext = createContext<MusicApi | null>(null);

export function FocusProvider({ children }: { children: ReactNode }) {
  const [durations, setDurationsState] = useState<FocusDurations>(loadDurations);
  const [soundEnabled, setSoundState] = useState(loadSound);
  const [mode, setMode] = useState<FocusMode>('work');
  const [isLongBreak, setIsLongBreak] = useState(false);
  const [total, setTotal] = useState(() => loadDurations().work * 60);
  const [timeLeft, setTimeLeft] = useState(total);
  // Horário (ms) em que o ciclo termina. null = pausado.
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [completedCycles, setCompletedCycles] = useState(0);

  const [provider, setProvider] = useState<MusicProvider>('spotify');
  const [autoplayToken, setAutoplayToken] = useState(0);

  // Tique calculado pelo horário de término: não atrasa nem com a janela na bandeja.
  useEffect(() => {
    if (endsAt === null) return;

    const tick = () => {
      const left = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setTimeLeft(left);
      if (left > 0) return;

      setEndsAt(null);
      const done = mode === 'work' ? completedCycles + 1 : completedCycles;
      const next = nextCycle(mode, done, durations);
      if (mode === 'work') setCompletedCycles(done);
      if (soundEnabled) playChime();
      window.electronAPI?.showNotification(
        mode === 'work' ? 'Pomodoro Finalizado!' : 'Pausa Finalizada!',
        mode === 'work'
          ? next.isLongBreak ? `${done} ciclos! Hora da pausa longa (${durations.longBreak} min).` : 'Hora de fazer uma pausa.'
          : 'Hora de voltar ao foco.',
      );
      setMode(next.mode);
      setIsLongBreak(next.isLongBreak);
      setTotal(next.seconds);
      setTimeLeft(next.seconds);
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [endsAt, mode, durations, completedCycles, soundEnabled]);

  // Progresso na barra de tarefas do Windows e tempo restante na dica da bandeja.
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;
    if (endsAt === null) {
      api.setFocusProgress({ progress: null, label: '' });
      return;
    }
    const label = mode === 'work' ? 'Foco' : isLongBreak ? 'Pausa longa' : 'Pausa';
    api.setFocusProgress({ progress: total > 0 ? (total - timeLeft) / total : 0, label: `${label} ${formatClock(timeLeft)}` });
  }, [endsAt, timeLeft, total, mode, isLongBreak]);

  const durationFor = useCallback(
    (m: FocusMode, long: boolean) => (m === 'work' ? durations.work : long ? durations.longBreak : durations.break),
    [durations],
  );

  const start = useCallback<FocusApi['start']>((options = {}) => {
    const nextMode = options.mode ?? 'work';
    const seconds = (options.minutes ? clampMinutes(options.minutes) : durationFor(nextMode, false)) * 60;
    setMode(nextMode);
    setIsLongBreak(false);
    setTotal(seconds);
    setTimeLeft(seconds);
    setEndsAt(Date.now() + seconds * 1000);
  }, [durationFor]);

  const pause = useCallback(() => setEndsAt(null), []);

  const toggle = useCallback(() => {
    setEndsAt(current => (current !== null ? null : Date.now() + timeLeft * 1000));
  }, [timeLeft]);

  const reset = useCallback(() => {
    const seconds = durationFor(mode, isLongBreak) * 60;
    setEndsAt(null);
    setTotal(seconds);
    setTimeLeft(seconds);
  }, [durationFor, mode, isLongBreak]);

  const switchMode = useCallback((nextMode: FocusMode) => {
    const seconds = durationFor(nextMode, false) * 60;
    setEndsAt(null);
    setMode(nextMode);
    setIsLongBreak(false);
    setTotal(seconds);
    setTimeLeft(seconds);
  }, [durationFor]);

  const setDurations = useCallback((patch: Partial<FocusDurations>) => {
    const next = normalizeDurations({ ...durations, ...patch }, durations);
    save(DURATIONS_KEY, JSON.stringify(next));
    setDurationsState(next);
    // Parado no início de um ciclo: a nova duração vale na hora.
    if (endsAt === null && timeLeft === total) {
      const seconds = (mode === 'work' ? next.work : isLongBreak ? next.longBreak : next.break) * 60;
      setTotal(seconds);
      setTimeLeft(seconds);
    }
  }, [durations, endsAt, timeLeft, total, mode, isLongBreak]);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundState(enabled);
    save(SOUND_KEY, enabled ? 'on' : 'off');
  }, []);

  const playLofi = useCallback(() => {
    setProvider('youtube');
    setAutoplayToken(t => t + 1);
  }, []);

  const focus = useMemo<FocusApi>(() => ({
    mode, isLongBreak, timeLeft, total, isRunning: endsAt !== null, durations, soundEnabled, completedCycles,
    start, pause, toggle, reset, switchMode, setDurations, setSoundEnabled,
  }), [mode, isLongBreak, timeLeft, total, endsAt, durations, soundEnabled, completedCycles,
    start, pause, toggle, reset, switchMode, setDurations, setSoundEnabled]);

  const music = useMemo<MusicApi>(() => ({ provider, autoplayToken, setProvider, playLofi }), [provider, autoplayToken, playLofi]);

  return (
    <FocusContext.Provider value={focus}>
      <MusicContext.Provider value={music}>{children}</MusicContext.Provider>
    </FocusContext.Provider>
  );
}

export function useFocus(): FocusApi {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('useFocus precisa estar dentro de <FocusProvider>');
  return ctx;
}

export function useMusic(): MusicApi {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic precisa estar dentro de <FocusProvider>');
  return ctx;
}
