// Validação simples dos argumentos recebidos via IPC.
// O renderer não é confiável: tudo que chega dele é checado aqui.

export function str(value: unknown, name: string, max = 10_000): string {
  if (typeof value !== 'string' || value.length > max) {
    throw new Error(`Parâmetro inválido: ${name}`);
  }
  return value;
}

export function int(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`Parâmetro inválido: ${name}`);
  }
  return value;
}

export function oneOf<T extends string>(value: unknown, options: readonly T[], name: string): T {
  if (typeof value !== 'string' || !options.includes(value as T)) {
    throw new Error(`Parâmetro inválido: ${name}`);
  }
  return value as T;
}

export function isoDate(value: unknown, name: string): string {
  const s = str(value, name, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error(`Data inválida: ${name}`);
  return s;
}

export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
