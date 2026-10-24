import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Notas
  getNote: () => ipcRenderer.invoke('get-note'),
  saveNote: (content: string) => ipcRenderer.invoke('save-note', content),

  // Links
  getLinks: () => ipcRenderer.invoke('get-links'),
  addLink: (link: { title: string; url: string; category?: string }) => ipcRenderer.invoke('add-link', link),
  deleteLink: (id: number) => ipcRenderer.invoke('delete-link', id),

  // Arquivos
  getFiles: () => ipcRenderer.invoke('get-files'),
  addFile: () => ipcRenderer.invoke('add-file'),
  deleteFile: (id: number) => ipcRenderer.invoke('delete-file', id),
  openFile: (id: number) => ipcRenderer.invoke('open-file', id),

  // Tarefas
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  addTask: (task: { title: string; status?: string }) => ipcRenderer.invoke('add-task', task),
  updateTaskStatus: (id: number, status: string) => ipcRenderer.invoke('update-task-status', id, status),
  deleteTask: (id: number) => ipcRenderer.invoke('delete-task', id),
  replaceTasks: (tasks: unknown[]) => ipcRenderer.invoke('replace-tasks', tasks),

  // Hábitos
  getHabits: () => ipcRenderer.invoke('get-habits'),
  addHabit: (name: string) => ipcRenderer.invoke('add-habit', name),
  deleteHabit: (id: number) => ipcRenderer.invoke('delete-habit', id),
  toggleHabitLog: (habitId: number, date: string) => ipcRenderer.invoke('toggle-habit-log', habitId, date),

  // UI
  changeTheme: (color: string) => ipcRenderer.send('change-theme', color),
  showNotification: (title: string, body: string) => ipcRenderer.send('show-notification', { title, body }),
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),

  // Preferências do sistema
  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  setPreferences: (patch: Record<string, unknown>) => ipcRenderer.invoke('set-preferences', patch),

  // IA
  ai: {
    hasKey: () => ipcRenderer.invoke('ai-has-key'),
    setKey: (key: string) => ipcRenderer.invoke('ai-set-key', key),
    chat: (history: { role: string; text: string }[], message: string) => ipcRenderer.invoke('ai-chat', history, message),
  },

  // Plugins
  getPlugins: () => ipcRenderer.invoke('get-plugins'),
});
