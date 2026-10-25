// Contrato da ponte exposta em window.electronAPI (electron/preload.ts).
// O preload é checado contra este tipo, então tela e main não saem de sincronia.

import type { AiGenerateRequest, AiGenerateResult } from './ai';
import type {
  DataTopic,
  FileShortcut,
  Habit,
  Link,
  NewTask,
  OrbitPlugin,
  OrbitPreferences,
  Task,
  TaskBackup,
  TaskPatch,
  TaskStatus,
} from './models';

export type PreferencesPatch = Partial<Pick<OrbitPreferences, 'openAtLogin' | 'startMode' | 'shortcut' | 'shortcutOpensPalette'>>;

/** Progresso do Pomodoro para a barra de tarefas e a bandeja. progress: 0–1, ou null quando parado. */
export interface FocusProgress {
  progress: number | null;
  label: string;
}

export interface ElectronAPI {
  getNote: () => Promise<string>;
  saveNote: (content: string) => Promise<boolean>;

  getLinks: () => Promise<Link[]>;
  addLink: (link: { title: string; url: string; category?: string }) => Promise<number>;
  deleteLink: (id: number) => Promise<boolean>;

  getFiles: () => Promise<FileShortcut[]>;
  addFile: () => Promise<number | null>;
  deleteFile: (id: number) => Promise<boolean>;
  openFile: (id: number) => Promise<boolean>;

  getTasks: () => Promise<Task[]>;
  addTask: (task: NewTask) => Promise<number>;
  updateTask: (id: number, patch: TaskPatch) => Promise<boolean>;
  updateTaskStatus: (id: number, status: TaskStatus) => Promise<boolean>;
  deleteTask: (id: number) => Promise<boolean>;
  replaceTasks: (tasks: TaskBackup[]) => Promise<boolean>;

  getHabits: () => Promise<Habit[]>;
  addHabit: (name: string) => Promise<number>;
  deleteHabit: (id: number) => Promise<boolean>;
  toggleHabitLog: (habitId: number, date: string) => Promise<boolean>;

  changeTheme: (color: string) => void;
  showNotification: (title: string, body: string) => void;
  toggleFullscreen: () => void;
  setFocusProgress: (state: FocusProgress) => void;

  getPreferences: () => Promise<OrbitPreferences>;
  setPreferences: (patch: PreferencesPatch) => Promise<{ ok: boolean; error?: string; prefs: OrbitPreferences }>;

  ai: {
    hasKey: () => Promise<boolean>;
    setKey: (key: string) => Promise<boolean>;
    /** Uma rodada com o Gemini (com ferramentas). O laço do agente fica em src/ai/agent.ts. */
    generate: (request: AiGenerateRequest) => Promise<AiGenerateResult>;
  };

  getPlugins: () => Promise<OrbitPlugin[]>;

  /** Chamado quando o main altera dados de uma área. Retorna a função para cancelar. */
  onDataChanged: (callback: (topic: DataTopic) => void) => () => void;

  /** Chamado quando o atalho global pede para abrir a paleta de comandos. */
  onOpenPalette: (callback: () => void) => () => void;
}
