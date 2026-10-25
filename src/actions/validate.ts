import type { ActionParam, ActionParams, OrbitAction } from './types';

/**
 * Confere e normaliza os parâmetros antes de executar uma ação.
 * Aceita números e booleanos vindos como texto ("40", "true"), que é como
 * chegam da paleta de comandos. Parâmetros desconhecidos são descartados.
 */
export function validateParams(action: OrbitAction, raw: Record<string, unknown>):
  { ok: true; params: ActionParams } | { ok: false; error: string } {
  const params: ActionParams = {};

  for (const def of action.params) {
    const value = raw[def.name];
    if (value === undefined || value === null || value === '') {
      if (def.required) return { ok: false, error: `Falta o parâmetro "${def.name}".` };
      continue;
    }
    const parsed = parseValue(def, value);
    if (!parsed.ok) return parsed;
    params[def.name] = parsed.value;
  }

  return { ok: true, params };
}

function parseValue(def: ActionParam, value: unknown):
  { ok: true; value: string | number | boolean } | { ok: false; error: string } {
  switch (def.type) {
    case 'string': {
      if (typeof value !== 'string' && typeof value !== 'number') return invalid(def, 'deve ser texto');
      const s = String(value).trim();
      if (s.length > 1000) return invalid(def, 'é longo demais');
      if (def.enum && !def.enum.includes(s)) return invalid(def, `deve ser um destes: ${def.enum.join(', ')}`);
      return { ok: true, value: s };
    }
    case 'number': {
      const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
      if (!Number.isFinite(n)) return invalid(def, 'deve ser um número');
      if (def.min !== undefined && n < def.min) return invalid(def, `deve ser no mínimo ${def.min}`);
      if (def.max !== undefined && n > def.max) return invalid(def, `deve ser no máximo ${def.max}`);
      return { ok: true, value: n };
    }
    case 'boolean': {
      if (typeof value === 'boolean') return { ok: true, value };
      if (value === 'true' || value === 'sim') return { ok: true, value: true };
      if (value === 'false' || value === 'não' || value === 'nao') return { ok: true, value: false };
      return invalid(def, 'deve ser verdadeiro ou falso');
    }
  }
}

const invalid = (def: ActionParam, reason: string) =>
  ({ ok: false as const, error: `O parâmetro "${def.name}" ${reason}.` });
