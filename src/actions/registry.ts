import { TASK_PRIORITIES } from '../../shared/models';
import type { TaskPriority, TaskStatus } from '../../shared/models';
import { THEMES } from '../hooks/useSettings';
import type { Theme } from '../hooks/useSettings';
import { MAX_MINUTES, MIN_MINUTES } from '../focus/limits';
import { localDate } from '../lib/date';
import { validateParams } from './validate';
import type { ActionContext, ActionResult, OrbitAction } from './types';

// Lista única de ações do Orbit. Para criar uma ação nova, adicione um item aqui:
// ela aparece na paleta de comandos e vira ferramenta da IA automaticamente.

const PRIORITY_PT: Record<TaskPriority, string> = { low: 'baixa', normal: 'normal', high: 'alta' };
const STATUS_PT: Record<TaskStatus, string> = { todo: 'a fazer', done: 'feita', idea: 'ideia' };

/** Compara nomes sem diferenciar maiúsculas e acentos ("agua" encontra "Água"). */
export const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const str = (v: unknown) => (typeof v === 'string' ? v : undefined);
const num = (v: unknown) => (typeof v === 'number' ? v : undefined);

async function findTask(ctx: ActionContext, id: number) {
  const task = (await ctx.api.getTasks()).find(t => t.id === id);
  if (!task) throw new Error(`Não encontrei a tarefa #${id}.`);
  return task;
}

export const ACTIONS: readonly OrbitAction[] = [
  // ---------- Tarefas ----------
  {
    id: 'add_task',
    title: 'Nova tarefa',
    description: 'Cria uma tarefa ou ideia no painel de Tarefas.',
    keywords: ['tarefa', 'todo', 'ideia', 'criar', 'adicionar'],
    params: [
      { name: 'title', type: 'string', description: 'Texto da tarefa', required: true },
      { name: 'status', type: 'string', description: 'todo = tarefa, idea = ideia', enum: ['todo', 'idea'] },
      { name: 'priority', type: 'string', description: 'Prioridade', enum: TASK_PRIORITIES },
      { name: 'due_date', type: 'string', description: 'Prazo no formato AAAA-MM-DD' },
    ],
    async run(p, ctx) {
      const due = str(p.due_date);
      if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due)) throw new Error('O prazo precisa estar no formato AAAA-MM-DD.');
      const priority = (str(p.priority) as TaskPriority | undefined) ?? 'normal';
      const status = (str(p.status) as TaskStatus | undefined) ?? 'todo';
      await ctx.api.addTask({ title: String(p.title), status, priority, due_date: due ?? null });
      const extra = [priority !== 'normal' && `prioridade ${PRIORITY_PT[priority]}`, due && `prazo ${due}`].filter(Boolean).join(', ');
      return `${status === 'idea' ? 'Ideia' : 'Tarefa'} "${p.title}" criada${extra ? ` (${extra})` : ''}.`;
    },
  },
  {
    id: 'list_tasks',
    title: 'Listar tarefas',
    description: 'Lista as tarefas com id, status e prioridade. Use antes de concluir, priorizar ou apagar uma tarefa.',
    keywords: ['tarefas', 'pendentes', 'listar'],
    params: [
      { name: 'status', type: 'string', description: 'Filtro (padrão: todo)', enum: ['todo', 'done', 'idea', 'all'] },
    ],
    async run(p, ctx) {
      const filter = str(p.status) ?? 'todo';
      const tasks = (await ctx.api.getTasks()).filter(t => filter === 'all' || t.status === filter);
      if (tasks.length === 0) return 'Nenhuma tarefa encontrada.';
      return tasks
        .map(t => `#${t.id} [${STATUS_PT[t.status]}] ${t.title}` +
          (t.priority !== 'normal' ? ` (prioridade ${PRIORITY_PT[t.priority]})` : '') +
          (t.due_date ? ` (prazo ${t.due_date})` : ''))
        .join('\n');
    },
  },
  {
    id: 'complete_task',
    title: 'Concluir tarefa',
    description: 'Marca uma tarefa como feita, pelo id.',
    keywords: ['concluir', 'feito', 'terminar'],
    params: [{ name: 'id', type: 'number', description: 'Id da tarefa (veja list_tasks)', required: true }],
    async run(p, ctx) {
      const task = await findTask(ctx, Number(p.id));
      await ctx.api.updateTask(task.id, { status: 'done' });
      return `Tarefa "${task.title}" concluída.`;
    },
  },
  {
    id: 'set_task_priority',
    title: 'Mudar prioridade',
    description: 'Muda a prioridade de uma tarefa, pelo id.',
    keywords: ['prioridade', 'urgente', 'importante'],
    params: [
      { name: 'id', type: 'number', description: 'Id da tarefa', required: true },
      { name: 'priority', type: 'string', description: 'Nova prioridade', enum: TASK_PRIORITIES, required: true },
    ],
    async run(p, ctx) {
      const task = await findTask(ctx, Number(p.id));
      const priority = p.priority as TaskPriority;
      await ctx.api.updateTask(task.id, { priority });
      return `Prioridade de "${task.title}" agora é ${PRIORITY_PT[priority]}.`;
    },
  },
  {
    id: 'delete_task',
    title: 'Apagar tarefa',
    description: 'Apaga uma tarefa de vez, pelo id.',
    keywords: ['apagar', 'remover', 'excluir'],
    destructive: true,
    params: [{ name: 'id', type: 'number', description: 'Id da tarefa', required: true }],
    async run(p, ctx) {
      const task = await findTask(ctx, Number(p.id));
      await ctx.api.deleteTask(task.id);
      return `Tarefa "${task.title}" apagada.`;
    },
  },

  // ---------- Hábitos ----------
  {
    id: 'list_habits',
    title: 'Listar hábitos',
    description: 'Lista os hábitos e se cada um já foi feito hoje.',
    keywords: ['hábitos', 'habitos', 'rotina'],
    params: [],
    async run(_p, ctx) {
      const today = localDate();
      const habits = await ctx.api.getHabits();
      if (habits.length === 0) return 'Nenhum hábito cadastrado.';
      return habits.map(h => `${h.name}: ${h.logs.includes(today) ? 'feito hoje' : 'pendente hoje'}`).join('\n');
    },
  },
  {
    id: 'add_habit',
    title: 'Novo hábito',
    description: 'Cadastra um novo hábito para acompanhar.',
    keywords: ['hábito', 'habito', 'rotina'],
    params: [{ name: 'name', type: 'string', description: 'Nome do hábito', required: true }],
    async run(p, ctx) {
      await ctx.api.addHabit(String(p.name));
      return `Hábito "${p.name}" criado.`;
    },
  },
  {
    id: 'toggle_habit',
    title: 'Marcar hábito',
    description: 'Marca ou desmarca um hábito como feito num dia (padrão: hoje). Encontra o hábito pelo nome.',
    keywords: ['marcar', 'fiz', 'hábito', 'habito'],
    params: [
      { name: 'name', type: 'string', description: 'Nome (ou parte do nome) do hábito', required: true },
      { name: 'date', type: 'string', description: 'Dia no formato AAAA-MM-DD (padrão: hoje)' },
    ],
    async run(p, ctx) {
      const query = normalize(String(p.name));
      const habits = await ctx.api.getHabits();
      const habit = habits.find(h => normalize(h.name) === query) ?? habits.find(h => normalize(h.name).includes(query));
      if (!habit) throw new Error(`Não encontrei o hábito "${p.name}".`);
      const date = str(p.date) ?? localDate();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('A data precisa estar no formato AAAA-MM-DD.');
      const wasDone = habit.logs.includes(date);
      await ctx.api.toggleHabitLog(habit.id, date);
      return `"${habit.name}" ${wasDone ? 'desmarcado' : 'marcado como feito'} em ${date}.`;
    },
  },

  // ---------- Foco e música ----------
  {
    id: 'start_focus',
    title: 'Iniciar foco',
    description: 'Inicia um ciclo de foco (Pomodoro), opcionalmente com música.',
    keywords: ['pomodoro', 'foco', 'focar', 'timer', 'concentrar'],
    params: [
      { name: 'minutes', type: 'number', description: 'Duração em minutos (padrão: a configurada)', min: MIN_MINUTES, max: MAX_MINUTES },
      { name: 'music', type: 'string', description: 'lofi = toca a rádio Lo-Fi junto', enum: ['lofi', 'none'] },
    ],
    run(p, ctx) {
      const minutes = num(p.minutes);
      ctx.focus.start(minutes ? { minutes } : undefined);
      if (p.music === 'lofi') ctx.music.playLofi();
      const length = minutes ?? ctx.focus.durations.work;
      return `Foco de ${length} min iniciado${p.music === 'lofi' ? ' com a rádio Lo-Fi' : ''}.`;
    },
  },
  {
    id: 'pause_focus',
    title: 'Pausar foco',
    description: 'Pausa o Pomodoro.',
    keywords: ['pausar', 'parar', 'pomodoro'],
    params: [],
    run(_p, ctx) {
      if (!ctx.focus.isRunning) return 'O Pomodoro já está pausado.';
      ctx.focus.pause();
      return 'Pomodoro pausado.';
    },
  },
  {
    id: 'start_break',
    title: 'Iniciar pausa',
    description: 'Inicia um intervalo de descanso.',
    keywords: ['pausa', 'descanso', 'intervalo', 'break'],
    params: [{ name: 'minutes', type: 'number', description: 'Duração em minutos', min: MIN_MINUTES, max: MAX_MINUTES }],
    run(p, ctx) {
      const minutes = num(p.minutes);
      ctx.focus.start({ mode: 'break', minutes });
      return `Pausa de ${minutes ?? ctx.focus.durations.break} min iniciada.`;
    },
  },
  {
    id: 'play_music',
    title: 'Tocar música',
    description: 'Troca o player. lofi começa a tocar na hora; spotify só abre o player (o Spotify exige clicar em play).',
    keywords: ['música', 'musica', 'lofi', 'spotify', 'tocar'],
    params: [{ name: 'provider', type: 'string', description: 'Qual player', enum: ['lofi', 'spotify'], required: true }],
    run(p, ctx) {
      if (p.provider === 'lofi') {
        ctx.music.playLofi();
        return 'Tocando a rádio Lo-Fi.';
      }
      ctx.music.setProvider('spotify');
      return 'Player do Spotify aberto. Clique em play para tocar.';
    },
  },

  // ---------- Aparência e links ----------
  {
    id: 'set_theme',
    title: 'Trocar tema',
    description: 'Troca o tema de cores: slate (escuro clássico), ocean (oceano), emerald (floresta), rose (crepúsculo).',
    keywords: ['tema', 'cor', 'aparência'],
    params: [{ name: 'theme', type: 'string', description: 'Tema', enum: THEMES, required: true }],
    run(p, ctx) {
      ctx.settings.updateTheme(p.theme as Theme);
      return `Tema alterado para ${p.theme}.`;
    },
  },
  {
    id: 'add_link',
    title: 'Novo link',
    description: 'Salva um link rápido.',
    keywords: ['link', 'site', 'favorito'],
    params: [
      { name: 'title', type: 'string', description: 'Nome do link', required: true },
      { name: 'url', type: 'string', description: 'Endereço (https://...)', required: true },
    ],
    async run(p, ctx) {
      let url = String(p.url);
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
      await ctx.api.addLink({ title: String(p.title), url });
      return `Link "${p.title}" salvo.`;
    },
  },
];

export const findAction = (id: string) => ACTIONS.find(a => a.id === id);

/** Valida e executa uma ação. Nunca lança: erros voltam como { ok: false }. */
export async function runAction(id: string, rawParams: Record<string, unknown>, ctx: ActionContext): Promise<ActionResult> {
  const action = findAction(id);
  if (!action) return { ok: false, error: `Ação desconhecida: ${id}` };

  const checked = validateParams(action, rawParams);
  if (!checked.ok) return checked;

  try {
    return { ok: true, message: await action.run(checked.params, ctx) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
