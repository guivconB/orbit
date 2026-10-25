import { describe, expect, it } from 'vitest';
import { ACTIONS } from '../actions/registry';
import { localDate } from '../lib/date';
import { buildItems, matchScore, parseFocusMinutes } from './items';
import type { PaletteData } from './items';

const data: PaletteData = {
  tasks: [
    { id: 1, title: 'Estudar React', status: 'todo', priority: 'high', due_date: null, position: -1, created_at: '' },
    { id: 2, title: 'Estudar Rust', status: 'done', priority: 'normal', due_date: null, position: -2, created_at: '' },
  ],
  links: [{ id: 1, title: 'GitHub', url: 'https://github.com', category: 'Geral', created_at: '' }],
  files: [{ id: 1, name: 'Relatório.pdf', path: 'C:/Docs/Relatório.pdf', created_at: '' }],
  habits: [{ id: 1, name: 'Meditação', created_at: '', logs: [localDate()] }],
};

const ids = (q: string) => buildItems(q, data, ACTIONS).map(i => i.id);

describe('buildItems', () => {
  it('sem texto mostra só comandos (sem as ações list_* da IA)', () => {
    const items = buildItems('', data, ACTIONS);
    expect(items.every(i => i.group === 'Comandos')).toBe(true);
    expect(items.some(i => i.id === 'cmd-list_tasks')).toBe(false);
  });

  it('texto livre oferece criar tarefa/ideia e perguntar à IA', () => {
    const items = buildItems('Comprar café', data, ACTIONS);
    expect(items[0]).toMatchObject({ title: 'Nova tarefa: Comprar café', run: { kind: 'action', actionId: 'add_task', params: { title: 'Comprar café' } } });
    expect(items[1].run).toEqual({ kind: 'action', actionId: 'add_task', params: { title: 'Comprar café', status: 'idea' } });
    expect(items.at(-1)).toMatchObject({ id: 'ask-ai', run: { kind: 'ask-ai', text: 'Comprar café' } });
  });

  it('conta vira calculadora (e não cria tarefa)', () => {
    const items = buildItems('2+2*10', data, ACTIONS);
    expect(items[0]).toMatchObject({ group: 'Calculadora', title: '= 22', run: { kind: 'copy', text: '22' } });
    expect(ids('2+2*10')).not.toContain('new-task');
  });

  it('"foco 40" inicia foco de 40 min', () => {
    expect(buildItems('foco 40', data, ACTIONS)[0]).toMatchObject({
      title: 'Iniciar foco de 40 min', run: { kind: 'action', actionId: 'start_focus', params: { minutes: 40 } },
    });
  });

  it('encontra tarefas pendentes (não as feitas), hábitos, links e arquivos', () => {
    expect(ids('estudar')).toContain('task-1');
    expect(ids('estudar')).not.toContain('task-2');
    expect(buildItems('medita', data, ACTIONS).find(i => i.id === 'habit-1')?.title).toBe('Desmarcar hábito: Meditação');
    expect(buildItems('git', data, ACTIONS).find(i => i.id === 'link-1')?.run).toEqual({ kind: 'open-link', url: 'https://github.com' });
    expect(buildItems('relatorio', data, ACTIONS).find(i => i.id === 'file-1')?.run).toEqual({ kind: 'open-file', id: 1, name: 'Relatório.pdf' });
  });

  it('comando com parâmetro obrigatório abre formulário; sem parâmetros executa direto', () => {
    expect(buildItems('tema', data, ACTIONS).find(i => i.id === 'cmd-set_theme')?.run).toEqual({ kind: 'form', actionId: 'set_theme' });
    expect(buildItems('pausar', data, ACTIONS).find(i => i.id === 'cmd-pause_focus')?.run).toEqual({ kind: 'action', actionId: 'pause_focus', params: {} });
  });
});

describe('parseFocusMinutes', () => {
  it.each([['foco 40', 40], ['Pomodoro 50 min', 50], ['25 min', 25], ['focar 15m', 15]])('%s → %s', (q, n) => {
    expect(parseFocusMinutes(q)).toBe(n);
  });
  it.each(['foco', '40', 'foco 500', 'comprar 2 min de pão'])('%s → null', q => {
    expect(parseFocusMinutes(q)).toBeNull();
  });
});

describe('matchScore', () => {
  it('prefere início do texto e ignora acentos', () => {
    expect(matchScore('med', 'Meditação')).toBeGreaterThan(matchScore('tac', 'Meditação'));
    expect(matchScore('xyz', 'Meditação')).toBe(0);
  });
});
