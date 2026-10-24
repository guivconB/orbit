// Contrato da ponte exposta pelo electron/preload.ts.

type TaskStatus = 'todo' | 'done' | 'idea';

interface OrbitPreferences {
  openAtLogin: boolean;
  startMode: 'fullscreen' | 'window';
  shortcut: string;
  shortcutOptions: string[];
  isPackaged: boolean;
}

interface OrbitPlugin {
  id: string;
  name: string;
  content: string;
}

interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

interface ElectronAPI {
  getNote: () => Promise<string>;
  saveNote: (content: string) => Promise<boolean>;

  getLinks: () => Promise<any[]>;
  addLink: (link: { title: string; url: string; category?: string }) => Promise<number>;
  deleteLink: (id: number) => Promise<boolean>;

  getFiles: () => Promise<any[]>;
  addFile: () => Promise<number | null>;
  deleteFile: (id: number) => Promise<boolean>;
  openFile: (id: number) => Promise<boolean>;

  getTasks: () => Promise<any[]>;
  addTask: (task: { title: string; status?: TaskStatus }) => Promise<number>;
  updateTaskStatus: (id: number, status: TaskStatus) => Promise<boolean>;
  deleteTask: (id: number) => Promise<boolean>;
  replaceTasks: (tasks: { title: string; status: TaskStatus; created_at?: string }[]) => Promise<boolean>;

  getHabits: () => Promise<any[]>;
  addHabit: (name: string) => Promise<number>;
  deleteHabit: (id: number) => Promise<boolean>;
  toggleHabitLog: (habitId: number, date: string) => Promise<boolean>;

  changeTheme: (color: string) => void;
  showNotification: (title: string, body: string) => void;
  toggleFullscreen: () => void;

  getPreferences: () => Promise<OrbitPreferences>;
  setPreferences: (
    patch: Partial<Pick<OrbitPreferences, 'openAtLogin' | 'startMode' | 'shortcut'>>,
  ) => Promise<{ ok: boolean; error?: string; prefs: OrbitPreferences }>;

  ai: {
    hasKey: () => Promise<boolean>;
    setKey: (key: string) => Promise<boolean>;
    chat: (history: ChatTurn[], message: string) => Promise<{ ok: true; text: string } | { ok: false; error: string }>;
  };

  getPlugins: () => Promise<OrbitPlugin[]>;
}

interface Window {
  // Ausente quando o front roda fora do Electron (ex.: `vite` no navegador).
  electronAPI?: ElectronAPI;
}
