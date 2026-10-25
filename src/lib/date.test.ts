import { describe, expect, it } from 'vitest';
import { lastDays, localDate } from './date';

describe('localDate', () => {
  it('usa o dia local, não o UTC (o bug das 21h no Brasil)', () => {
    // 23h30 do dia 23 no horário local. Em UTC-3 isso já é dia 24 em UTC.
    const lateNight = new Date(2026, 9, 23, 23, 30);
    expect(localDate(lateNight)).toBe('2026-10-23');
  });

  it('completa mês e dia com zero', () => {
    expect(localDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('lastDays', () => {
  it('devolve do mais antigo para hoje', () => {
    expect(lastDays(3, new Date(2026, 9, 2))).toEqual(['2026-09-30', '2026-10-01', '2026-10-02']);
  });

  it('atravessa a virada do ano', () => {
    expect(lastDays(2, new Date(2027, 0, 1))).toEqual(['2026-12-31', '2027-01-01']);
  });
});
