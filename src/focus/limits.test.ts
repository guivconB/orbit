import { describe, expect, it } from 'vitest';
import { DEFAULT_DURATIONS, formatClock, nextCycle, normalizeDurations } from './limits';

describe('nextCycle', () => {
  const d = DEFAULT_DURATIONS; // 25 / 5 / 15 a cada 4

  it('depois do foco vem a pausa curta', () => {
    expect(nextCycle('work', 1, d)).toEqual({ mode: 'break', isLongBreak: false, seconds: 5 * 60 });
  });

  it('no 4º ciclo vem a pausa longa', () => {
    expect(nextCycle('work', 4, d)).toEqual({ mode: 'break', isLongBreak: true, seconds: 15 * 60 });
    expect(nextCycle('work', 8, d).isLongBreak).toBe(true);
    expect(nextCycle('work', 5, d).isLongBreak).toBe(false);
  });

  it('depois de qualquer pausa volta o foco', () => {
    expect(nextCycle('break', 4, d)).toEqual({ mode: 'work', isLongBreak: false, seconds: 25 * 60 });
  });

  it('respeita durações personalizadas', () => {
    const custom = { work: 50, break: 10, longBreak: 30, longBreakEvery: 2 };
    expect(nextCycle('work', 2, custom)).toEqual({ mode: 'break', isLongBreak: true, seconds: 30 * 60 });
  });
});

describe('normalizeDurations', () => {
  it('ajusta valores fora do limite e completa os que faltam', () => {
    expect(normalizeDurations({ work: 0, break: 999, longBreakEvery: 1 })).toEqual({ work: 1, break: 180, longBreak: 15, longBreakEvery: 2 });
  });

  it('ignora lixo do armazenamento', () => {
    expect(normalizeDurations(JSON.parse('{"work":"abc"}'))).toEqual(DEFAULT_DURATIONS);
    expect(normalizeDurations(null)).toEqual(DEFAULT_DURATIONS);
  });
});

describe('formatClock', () => {
  it('formata minutos e segundos, inclusive acima de 60 min', () => {
    expect(formatClock(65)).toBe('01:05');
    expect(formatClock(90 * 60)).toBe('90:00');
  });
});
