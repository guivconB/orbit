import { describe, expect, it } from 'vitest';
import { calculate, formatNumber } from './calc';

describe('calculate', () => {
  it.each([
    ['2 + 3 * 4', 14],
    ['(2 + 3) * 4', 20],
    ['10 / 4', 2.5],
    ['2 ^ 3 ^ 2', 512], // potência associa à direita
    ['-3 + 5', 2],
    ['250 * 10%', 25],
    ['1,5 + 1,5', 3],
    ['1.234,5 * 2', 2469],
    ['6 × 7', 42],
    ['9 ÷ 3', 3],
  ])('%s = %s', (expr, expected) => {
    expect(calculate(expr)).toBeCloseTo(expected);
  });

  it.each(['', '42', 'comprar pão', '2 +', '(1 + 2', 'alert(1)', '1 / 0', '10% de 250'])('"%s" não é conta', expr => {
    expect(calculate(expr)).toBeNull();
  });
});

describe('formatNumber', () => {
  it('usa vírgula decimal', () => {
    expect(formatNumber(2.5)).toBe('2,5');
  });
});
