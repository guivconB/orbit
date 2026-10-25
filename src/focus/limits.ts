// Regras do Pomodoro sem React (arquivo separado do FocusContext para testes
// e para o recarregamento rápido do Vite funcionar).

export const MIN_MINUTES = 1;
export const MAX_MINUTES = 180;
export const MIN_LONG_BREAK_EVERY = 2;
export const MAX_LONG_BREAK_EVERY = 12;

export type FocusMode = 'work' | 'break';

export interface FocusDurations {
  /** minutos de foco */
  work: number;
  /** minutos da pausa curta */
  break: number;
  /** minutos da pausa longa */
  longBreak: number;
  /** a cada quantos ciclos de foco vem a pausa longa */
  longBreakEvery: number;
}

export const DEFAULT_DURATIONS: FocusDurations = { work: 25, break: 5, longBreak: 15, longBreakEvery: 4 };

export const clampMinutes = (m: number) => Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(m)));
const clampEvery = (n: number) => Math.min(MAX_LONG_BREAK_EVERY, Math.max(MIN_LONG_BREAK_EVERY, Math.round(n)));

/** Normaliza durações vindas do armazenamento ou da tela (valores fora do limite são ajustados). */
export function normalizeDurations(value: Partial<FocusDurations> | null | undefined, base = DEFAULT_DURATIONS): FocusDurations {
  const pick = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
  return {
    work: clampMinutes(pick(value?.work, base.work)),
    break: clampMinutes(pick(value?.break, base.break)),
    longBreak: clampMinutes(pick(value?.longBreak, base.longBreak)),
    longBreakEvery: clampEvery(pick(value?.longBreakEvery, base.longBreakEvery)),
  };
}

/**
 * O que vem depois de terminar um ciclo.
 * `completedCycles` = ciclos de foco já concluídos, contando o que acabou de terminar.
 */
export function nextCycle(finished: FocusMode, completedCycles: number, d: FocusDurations) {
  if (finished === 'break') return { mode: 'work' as const, isLongBreak: false, seconds: d.work * 60 };
  const isLongBreak = completedCycles > 0 && completedCycles % d.longBreakEvery === 0;
  return { mode: 'break' as const, isLongBreak, seconds: (isLongBreak ? d.longBreak : d.break) * 60 };
}

export function formatClock(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
