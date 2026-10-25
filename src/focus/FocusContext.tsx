import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { clampMinutes } from './limits';

// Estado global do Pomodoro e do player de música.
// Fica acima dos widgets para que paleta de comandos, IA e Modo Zen possam
// iniciar o foco ou trocar a música, e para o timer continuar rodando
// mesmo com o widget do Pomodoro desativado.

export type FocusMode = 'work' | 'break';
export type MusicProvider = 'spotify' | 'youtube';

export interface FocusDurations {
  /** minutos */
  work: number;
  break: number;
}

const DEFAULT_DURATIONS: FocusDurations = { work: 25, break: 5 };
const STORAGE_KEY = 'orbit_focus_durations';

function loadDurations(): FocusDurations {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (saved && typeof saved.work === 'number' && typeof saved.break === 'number') {
      return { work: clampMinutes(saved.work), break: clampMinutes(saved.break) };
    }
  } catch {
    // ignora valor corrompido
  }
  return DEFAULT_DURATIONS;
}

export interface FocusApi {
  mode: FocusMode;
  /** segundos restantes */
  timeLeft: number;
  /** duração total do ciclo atual, em segundos */
  total: number;
  isRunning: boolean;
  durations: FocusDurations;
  /** ciclos de foco concluídos desde que o app abriu */
  completedCycles: number;
  /** Inicia um ciclo. Sem argumentos, usa a duração padrão do modo. */
  start: (options?: { minutes?: number; mode?: FocusMode }) => void;
  pause: () => void;
  /** Pausa se estiver rodando; senão continua de onde parou. */
  toggle: () => void;
  reset: () => void;
  switchMode: (mode: FocusMode) => void;
  setDurations: (patch: Partial<FocusDurations>) => void;
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
  const [mode, setMode] = useState<FocusMode>('work');
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
      const next: FocusMode = mode === 'work' ? 'break' : 'work';
      if (mode === 'work') setCompletedCycles(c => c + 1);
      window.electronAPI?.showNotification(
        mode === 'work' ? 'Pomodoro Finalizado!' : 'Pausa Finalizada!',
        mode === 'work' ? 'Hora de fazer uma pausa.' : 'Hora de voltar ao foco.',
      );
      setMode(next);
      setTotal(durations[next] * 60);
      setTimeLeft(durations[next] * 60);
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [endsAt, mode, durations]);

  const start = useCallback<FocusApi['start']>((options = {}) => {
    const nextMode = options.mode ?? 'work';
    const seconds = (options.minutes ? clampMinutes(options.minutes) : durations[nextMode]) * 60;
    setMode(nextMode);
    setTotal(seconds);
    setTimeLeft(seconds);
    setEndsAt(Date.now() + seconds * 1000);
  }, [durations]);

  const pause = useCallback(() => setEndsAt(null), []);

  const toggle = useCallback(() => {
    setEndsAt(current => (current !== null ? null : Date.now() + timeLeft * 1000));
  }, [timeLeft]);

  const reset = useCallback(() => {
    setEndsAt(null);
    setTotal(durations[mode] * 60);
    setTimeLeft(durations[mode] * 60);
  }, [durations, mode]);

  const switchMode = useCallback((nextMode: FocusMode) => {
    setEndsAt(null);
    setMode(nextMode);
    setTotal(durations[nextMode] * 60);
    setTimeLeft(durations[nextMode] * 60);
  }, [durations]);

  const setDurations = useCallback((patch: Partial<FocusDurations>) => {
    setDurationsState(current => {
      const next = {
        work: patch.work !== undefined ? clampMinutes(patch.work) : current.work,
        break: patch.break !== undefined ? clampMinutes(patch.break) : current.break,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // sem armazenamento: vale só nesta sessão
      }
      return next;
    });
  }, []);

  const playLofi = useCallback(() => {
    setProvider('youtube');
    setAutoplayToken(t => t + 1);
  }, []);

  const focus = useMemo<FocusApi>(() => ({
    mode, timeLeft, total, isRunning: endsAt !== null, durations, completedCycles,
    start, pause, toggle, reset, switchMode, setDurations,
  }), [mode, timeLeft, total, endsAt, durations, completedCycles, start, pause, toggle, reset, switchMode, setDurations]);

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
