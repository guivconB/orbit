// Calculadora da paleta de comandos. Interpretador próprio: nada de eval
// (proibido pela CSP de propósito). Aceita + - * / ^ % e parênteses,
// vírgula ou ponto como decimal e × ÷ como sinais.
//
//   calculate('2 + 3 * 4')  -> 14
//   calculate('10% de 250') -> null (texto livre não é conta)
//   calculate('250 * 10%')  -> 25

type Token = { type: 'num'; value: number } | { type: 'op'; value: string };

const OPS = '+-*/^%()';

function tokenize(input: string): Token[] | null {
  const src = input.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s+/g, '');
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/[0-9.,]/.test(ch)) {
      let j = i;
      while (j < src.length && /[0-9.,]/.test(src[j])) j++;
      const raw = src.slice(i, j);
      // "1.234,5" (pt-BR) ou "1234.5" / "1234,5"
      const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
      const value = Number(normalized);
      if (!Number.isFinite(value)) return null;
      tokens.push({ type: 'num', value });
      i = j;
    } else if (OPS.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i++;
    } else {
      return null;
    }
  }
  return tokens;
}

// Gramática (do menor para o maior precedência):
//   expr   = term (('+' | '-') term)*
//   term   = power (('*' | '/') power)*
//   power  = unary ('^' power)?
//   unary  = '-' unary | postfix
//   postfix= primary '%'*
//   primary= num | '(' expr ')'
function parse(tokens: Token[]): number | null {
  let pos = 0;
  const peek = () => tokens[pos];
  const isOp = (v: string) => peek()?.type === 'op' && peek()!.value === v;

  function expr(): number {
    let left = term();
    while (isOp('+') || isOp('-')) {
      const op = (tokens[pos++] as { value: string }).value;
      const right = term();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }
  function term(): number {
    let left = power();
    while (isOp('*') || isOp('/')) {
      const op = (tokens[pos++] as { value: string }).value;
      const right = power();
      left = op === '*' ? left * right : left / right;
    }
    return left;
  }
  function power(): number {
    const base = unary();
    if (isOp('^')) {
      pos++;
      return Math.pow(base, power());
    }
    return base;
  }
  function unary(): number {
    if (isOp('-')) {
      pos++;
      return -unary();
    }
    if (isOp('+')) {
      pos++;
      return unary();
    }
    return postfix();
  }
  function postfix(): number {
    let value = primary();
    while (isOp('%')) {
      pos++;
      value /= 100;
    }
    return value;
  }
  function primary(): number {
    const t = tokens[pos++];
    if (!t) throw new Error('fim inesperado');
    if (t.type === 'num') return t.value;
    if (t.value === '(') {
      const v = expr();
      if (!isOp(')')) throw new Error('falta )');
      pos++;
      return v;
    }
    throw new Error('token inesperado');
  }

  try {
    const value = expr();
    return pos === tokens.length && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

/** Resultado da conta, ou null se o texto não for uma conta (precisa ter pelo menos um operador). */
export function calculate(input: string): number | null {
  const tokens = tokenize(input.trim());
  if (!tokens || tokens.length < 2) return null;
  if (!tokens.some(t => t.type === 'op' && t.value !== '(' && t.value !== ')')) return null;
  return parse(tokens);
}

export function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 10 });
}
