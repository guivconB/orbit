// Modelos de dados compartilhados entre o processo main (electron/) e a tela (src/).
// Só tipos e constantes: nada aqui pode depender de Node, Electron ou React.

export const TASK_STATUSES = ['todo', 'done', 'idea'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['low', 'normal', 'high'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** YYYY-MM-DD ou null */
  due_date: string | null;
  /** Ordem na lista (menor = primeiro). Tarefas novas entram no topo. */
  position: number;
  created_at: string;
}

export interface NewTask {
  title: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
}

export type TaskPatch = Partial<Pick<Task, 'title' | 'status' | 'priority' | 'due_date'>>;

/** Formato usado no backup da nuvem e na restauração. */
export interface TaskBackup {
  title: string;
  status: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  created_at?: string;
}

export interface Link {
  id: number;
  title: string;
  url: string;
  category: string;
  created_at: string;
}

export interface FileShortcut {
  id: number;
  name: string;
  path: string;
  created_at: string;
}

export interface Habit {
  id: number;
  name: string;
  created_at: string;
  /** Datas (YYYY-MM-DD) em que o hábito foi feito */
  logs: string[];
}

export interface OrbitPlugin {
  id: string;
  name: string;
  content: string;
}

export interface OrbitPreferences {
  openAtLogin: boolean;
  startMode: 'fullscreen' | 'window';
  shortcut: string;
  /** O atalho global, ao mostrar o Orbit, já abre a paleta de comandos */
  shortcutOpensPalette: boolean;
  shortcutOptions: string[];
  isPackaged: boolean;
}

/** Áreas de dados. O main avisa a tela quando uma delas muda (evento 'data-changed'). */
export const DATA_TOPICS = ['tasks', 'links', 'files', 'habits', 'notes'] as const;
export type DataTopic = (typeof DATA_TOPICS)[number];
