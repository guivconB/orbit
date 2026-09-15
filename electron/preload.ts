import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // We will add specific methods here for database CRUD
  getNote: () => ipcRenderer.invoke('get-note'),
  saveNote: (content: string) => ipcRenderer.invoke('save-note', content),
  
  // Links
  getLinks: () => ipcRenderer.invoke('get-links'),
  addLink: (link: { title: string; url: string; category?: string }) => ipcRenderer.invoke('add-link', link),
  deleteLink: (id: number) => ipcRenderer.invoke('delete-link', id),

  // Files
  getFiles: () => ipcRenderer.invoke('get-files'),
  addFile: () => ipcRenderer.invoke('add-file'),
  deleteFile: (id: number) => ipcRenderer.invoke('delete-file', id),
  openFile: (path: string) => ipcRenderer.invoke('open-file', path),

  // Tasks
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  addTask: (task: { title: string; status?: string }) => ipcRenderer.invoke('add-task', task),
  updateTaskStatus: (id: number, status: string) => ipcRenderer.invoke('update-task-status', id, status),
  deleteTask: (id: number) => ipcRenderer.invoke('delete-task', id),

  // Habits
  getHabits: () => ipcRenderer.invoke('get-habits'),
  addHabit: (name: string) => ipcRenderer.invoke('add-habit', name),
  deleteHabit: (id: number) => ipcRenderer.invoke('delete-habit', id),
  toggleHabitLog: (habitId: number, date: string) => ipcRenderer.invoke('toggle-habit-log', habitId, date),

  // UI
  changeTheme: (color: string) => ipcRenderer.send('change-theme', color),
});
