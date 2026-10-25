import type { FileShortcut, Habit, Link, Task } from '../../shared/models';
import type { OrbitAction } from '../actions/types';
import { normalize } from '../actions/registry';
import { calculate, formatNumber } from '../lib/calc';
import { localDate } from '../lib/date';

// Monta os resultados da paleta de comandos a partir do texto digitado.
// Função pura: a tela (CommandPalette) só desenha e executa.

export type PaletteGroup = 'Calculadora' | 'Criar' | 'Encontrado' | 'Comandos' | 'IA';

export type PaletteRun =
  | { kind: 'action'; actionId: string; params: Record<string, unknown> }
  /** Ação com parâmetros obrigatórios faltando: abre o formulário na paleta */
  | { kind: 'form'; actionId: string }
  | { kind: 'copy'; text: string }
  | { kind: 'open-link'; url: string }
  | { kind: 'open-file'; id: number; name: string }
  | { kind: 'ask-ai'; text: string };

export interface PaletteItem {
  id: string;
  group: PaletteGroup;
  title: string;
  subtitle?: string;
  run: PaletteRun;
}

export interface PaletteData {
  tasks: Task[];
  links: Link[];
  files: FileShortcut[];
  habits: Habit[];
}

const MAX_FOUND = 6;

/** 0 = não combina. Quanto maior, melhor. */
export function matchScore(query: string, ...fields: (string | undefined)[]): number {
  const q = normalize(query);
  if (!q) return 1;
  let best = 0;
  for (const field of fields) {
    if (!field) continue;
    const f = normalize(field);
    if (f === q) best = Math.max(best, 4);
    else if (f.startsWith(q)) best = Math.max(best, 3);
    else if (f.split(/\s+/).some(w => w.startsWith(q))) best = Math.max(best, 2);
    else if (f.includes(q)) best = Math.max(best, 1);
  }
  return best;
}

/** "foco 40", "pomodoro 50", "40 min" → 40 */
export function parseFocusMinutes(query: string): number | null {
  const q = normalize(query);
  const m = q.match(/^(?:foco|focar|pomodoro)\s+(\d{1,3})(?:\s*(?:min|minutos|m))?$/) ?? q.match(/^(\d{1,3})\s*(?:min|minutos|m)$/);
  if (!m) return null;
  const minutes = Number(m[1]);
  return minutes >= 1 && minutes <= 180 ? minutes : null;
}

export function buildItems(rawQuery: string, data: PaletteData, actions: readonly OrbitAction[]): PaletteItem[] {
  const query = rawQuery.trim();
  const items: PaletteItem[] = [];

  // Calculadora
  const result = query ? calculate(query) : null;
  if (result !== null) {
    const text = formatNumber(result);
    items.push({ id: 'calc', group: 'Calculadora', title: `= ${text}`, subtitle: 'Enter copia o resultado', run: { kind: 'copy', text } });
  }

  // Atalho de foco ("foco 40")
  const minutes = parseFocusMinutes(query);
  if (minutes) {
    items.push({
      id: 'focus-minutes', group: 'Criar', title: `Iniciar foco de ${minutes} min`,
      run: { kind: 'action', actionId: 'start_focus', params: { minutes } },
    });
  }

  // Captura rápida
  if (query && result === null && !minutes) {
    items.push(
      { id: 'new-task', group: 'Criar', title: `Nova tarefa: ${query}`, run: { kind: 'action', actionId: 'add_task', params: { title: query } } },
      { id: 'new-idea', group: 'Criar', title: `Nova ideia: ${query}`, run: { kind: 'action', actionId: 'add_task', params: { title: query, status: 'idea' } } },
    );
  }

  // Busca nos dados
  if (query) {
    const today = localDate();
    const found: (PaletteItem & { score: number })[] = [];
    for (const t of data.tasks) {
      if (t.status !== 'todo') continue;
      const score = matchScore(query, t.title);
      if (score) found.push({ score, id: `task-${t.id}`, group: 'Encontrado', title: `Concluir: ${t.title}`, subtitle: 'Tarefa', run: { kind: 'action', actionId: 'complete_task', params: { id: t.id } } });
    }
    for (const h of data.habits) {
      const score = matchScore(query, h.name);
      const done = h.logs.includes(today);
      if (score) found.push({ score, id: `habit-${h.id}`, group: 'Encontrado', title: `${done ? 'Desmarcar' : 'Marcar'} hábito: ${h.name}`, subtitle: done ? 'Feito hoje' : 'Pendente hoje', run: { kind: 'action', actionId: 'toggle_habit', params: { name: h.name } } });
    }
    for (const l of data.links) {
      const score = matchScore(query, l.title, l.url);
      if (score) found.push({ score, id: `link-${l.id}`, group: 'Encontrado', title: `Abrir link: ${l.title}`, subtitle: l.url, run: { kind: 'open-link', url: l.url } });
    }
    for (const f of data.files) {
      const score = matchScore(query, f.name);
      if (score) found.push({ score, id: `file-${f.id}`, group: 'Encontrado', title: `Abrir: ${f.name}`, subtitle: f.path, run: { kind: 'open-file', id: f.id, name: f.name } });
    }
    found.sort((a, b) => b.score - a.score).slice(0, MAX_FOUND).forEach(({ score: _score, ...item }) => items.push(item));
  }

  // Comandos (registro de ações). Ações "list_*" são para a IA, não para a paleta.
  const commands = actions
    .filter(a => !a.id.startsWith('list_'))
    .map(a => ({ a, score: matchScore(query, a.title, a.description, ...(a.keywords ?? [])) }))
    .filter(x => x.score > 0)
    .sort((x, y) => y.score - x.score);
  for (const { a } of commands) {
    const needsForm = a.params.some(p => p.required);
    items.push({
      id: `cmd-${a.id}`, group: 'Comandos', title: a.title, subtitle: a.description,
      run: needsForm ? { kind: 'form', actionId: a.id } : { kind: 'action', actionId: a.id, params: {} },
    });
  }

  if (query) {
    items.push({ id: 'ask-ai', group: 'IA', title: `Perguntar à IA: ${query}`, run: { kind: 'ask-ai', text: query } });
  }

  return items;
}
