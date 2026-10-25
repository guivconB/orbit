import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ElectronAPI } from '../../shared/api';
import type { Habit, Task } from '../../shared/models';
import type { FocusApi, MusicApi } from '../focus/FocusContext';
import type { SettingsApi } from '../hooks/useSettings';
import { ACTIONS, normalize, runAction } from './registry';
import { toToolDeclarations } from './tools';
import { validateParams } from './validate';
import type { ActionContext } from './types';

// API falsa em memória: só o que as ações usam.
function fakeContext() {
  const tasks: Task[] = [];
  const habits: Habit[] = [{ id: 1, name: 'Beber Água', created_at: '', logs: [] }];
  let nextId = 1;

  const api = {
    getTasks: async () => tasks,
    addTask: async t => {
      tasks.push({ id: nextId, title: t.title, status: t.status ?? 'todo', priority: t.priority ?? 'normal', due_date: t.due_date ?? null, position: -nextId, created_at: '' });
      return nextId++;
    },
    updateTask: async (id, patch) => {
      Object.assign(tasks.find(t => t.id === id)!, patch);
      return true;
    },
    deleteTask: async id => {
      tasks.splice(tasks.findIndex(t => t.id === id), 1);
      return true;
    },
    getHabits: async () => habits,
    toggleHabitLog: async (id, date) => {
      const h = habits.find(x => x.id === id)!;
      h.logs = h.logs.includes(date) ? h.logs.filter(d => d !== date) : [...h.logs, date];
      return true;
    },
    addLink: vi.fn(async () => 1),
  } as Partial<ElectronAPI> as ElectronAPI;

  const focus = { start: vi.fn(), pause: vi.fn(), isRunning: false, durations: { work: 25, break: 5 } } as unknown as FocusApi;
  const music = { playLofi: vi.fn(), setProvider: vi.fn() } as unknown as MusicApi;
  const settings = { updateTheme: vi.fn() } as unknown as SettingsApi;
  const ctx: ActionContext = { api, focus, music, settings };
  return { ctx, tasks, habits, focus, music, settings, api };
}

let f: ReturnType<typeof fakeContext>;
beforeEach(() => {
  f = fakeContext();
});

describe('registro de ações', () => {
  it('ids são únicos e em snake_case (viram nomes de ferramentas da IA)', () => {
    const ids = ACTIONS.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach(id => expect(id).toMatch(/^[a-z][a-z0-9_]*$/));
  });

  it('cria tarefa com prioridade (exemplo "Estudar React com prioridade")', async () => {
    const res = await runAction('add_task', { title: 'Estudar React', priority: 'high' }, f.ctx);
    expect(res).toEqual({ ok: true, message: 'Tarefa "Estudar React" criada (prioridade alta).' });
    expect(f.tasks[0]).toMatchObject({ title: 'Estudar React', priority: 'high', status: 'todo' });
  });

  it('recusa prioridade fora da lista sem executar', async () => {
    const res = await runAction('add_task', { title: 'x', priority: 'urgentíssima' }, f.ctx);
    expect(res.ok).toBe(false);
    expect(f.tasks).toHaveLength(0);
  });

  it('recusa prazo em formato errado', async () => {
    const res = await runAction('add_task', { title: 'x', due_date: '24/10/2026' }, f.ctx);
    expect(res).toEqual({ ok: false, error: 'O prazo precisa estar no formato AAAA-MM-DD.' });
  });

  it('conclui, prioriza e apaga pelo id; id inexistente vira erro amigável', async () => {
    await runAction('add_task', { title: 'A' }, f.ctx);
    expect((await runAction('complete_task', { id: 1 }, f.ctx)).ok).toBe(true);
    expect(f.tasks[0].status).toBe('done');
    expect((await runAction('set_task_priority', { id: 1, priority: 'low' }, f.ctx)).ok).toBe(true);
    expect(f.tasks[0].priority).toBe('low');
    expect(await runAction('complete_task', { id: 99 }, f.ctx)).toEqual({ ok: false, error: 'Não encontrei a tarefa #99.' });
    expect((await runAction('delete_task', { id: 1 }, f.ctx)).ok).toBe(true);
    expect(f.tasks).toHaveLength(0);
  });

  it('marca hábito pelo nome, sem diferenciar acentos', async () => {
    const res = await runAction('toggle_habit', { name: 'agua', date: '2026-10-24' }, f.ctx);
    expect(res).toEqual({ ok: true, message: '"Beber Água" marcado como feito em 2026-10-24.' });
    expect(f.habits[0].logs).toEqual(['2026-10-24']);
  });

  it('foco de 40 min com Lo-Fi (exemplo do Caminho A)', async () => {
    const res = await runAction('start_focus', { minutes: '40', music: 'lofi' }, f.ctx);
    expect(res).toEqual({ ok: true, message: 'Foco de 40 min iniciado com a rádio Lo-Fi.' });
    expect(f.focus.start).toHaveBeenCalledWith({ minutes: 40 });
    expect(f.music.playLofi).toHaveBeenCalled();
  });

  it('recusa foco acima do limite', async () => {
    expect((await runAction('start_focus', { minutes: 600 }, f.ctx)).ok).toBe(false);
    expect(f.focus.start).not.toHaveBeenCalled();
  });

  it('troca tema só para um tema existente', async () => {
    expect((await runAction('set_theme', { theme: 'ocean' }, f.ctx)).ok).toBe(true);
    expect(f.settings.updateTheme).toHaveBeenCalledWith('ocean');
    expect((await runAction('set_theme', { theme: 'neon' }, f.ctx)).ok).toBe(false);
  });

  it('completa https:// no link', async () => {
    await runAction('add_link', { title: 'GitHub', url: 'github.com' }, f.ctx);
    expect(f.api.addLink).toHaveBeenCalledWith({ title: 'GitHub', url: 'https://github.com' });
  });

  it('ação desconhecida não quebra', async () => {
    expect(await runAction('format_disk', {}, f.ctx)).toEqual({ ok: false, error: 'Ação desconhecida: format_disk' });
  });
});

describe('validateParams', () => {
  const action = ACTIONS.find(a => a.id === 'add_task')!;

  it('exige parâmetros obrigatórios', () => {
    expect(validateParams(action, {})).toEqual({ ok: false, error: 'Falta o parâmetro "title".' });
  });

  it('descarta parâmetros desconhecidos', () => {
    expect(validateParams(action, { title: 'x', hack: 'y' })).toEqual({ ok: true, params: { title: 'x' } });
  });
});

describe('toToolDeclarations', () => {
  it('gera o esquema de ferramentas do Gemini', () => {
    const [addTask] = toToolDeclarations(ACTIONS.filter(a => a.id === 'add_task'));
    expect(addTask.name).toBe('add_task');
    expect(addTask.parametersJsonSchema.required).toEqual(['title']);
    expect(addTask.parametersJsonSchema.properties.priority.enum).toEqual(['low', 'normal', 'high']);
  });

  it('avisa a IA para confirmar ações destrutivas', () => {
    const [del] = toToolDeclarations(ACTIONS.filter(a => a.id === 'delete_task'));
    expect(del.description).toMatch(/confirme com a pessoa/);
  });
});

describe('normalize', () => {
  it('ignora acentos e maiúsculas', () => {
    expect(normalize('  Meditação ')).toBe('meditacao');
  });
});
