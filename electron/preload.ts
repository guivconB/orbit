import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';
import type { ElectronAPI } from '../shared/api';
import type { DataTopic } from '../shared/models';

// O tipo ElectronAPI garante que esta ponte e o que a tela espera não saiam de sincronia.
const api: ElectronAPI = {
  // Notas
  getNote: () => ipcRenderer.invoke('get-note'),
  saveNote: (content) => ipcRenderer.invoke('save-note', content),

  // Links
  getLinks: () => ipcRenderer.invoke('get-links'),
  addLink: (link) => ipcRenderer.invoke('add-link', link),
  deleteLink: (id) => ipcRenderer.invoke('delete-link', id),

  // Arquivos
  getFiles: () => ipcRenderer.invoke('get-files'),
  addFile: () => ipcRenderer.invoke('add-file'),
  deleteFile: (id) => ipcRenderer.invoke('delete-file', id),
  openFile: (id) => ipcRenderer.invoke('open-file', id),

  // Tarefas
  getTasks: () => ipcRenderer.invoke('get-tasks'),
  addTask: (task) => ipcRenderer.invoke('add-task', task),
  updateTask: (id, patch) => ipcRenderer.invoke('update-task', id, patch),
  updateTaskStatus: (id, status) => ipcRenderer.invoke('update-task-status', id, status),
  deleteTask: (id) => ipcRenderer.invoke('delete-task', id),
  replaceTasks: (tasks) => ipcRenderer.invoke('replace-tasks', tasks),

  // Hábitos
  getHabits: () => ipcRenderer.invoke('get-habits'),
  addHabit: (name) => ipcRenderer.invoke('add-habit', name),
  deleteHabit: (id) => ipcRenderer.invoke('delete-habit', id),
  toggleHabitLog: (habitId, date) => ipcRenderer.invoke('toggle-habit-log', habitId, date),

  // UI
  changeTheme: (color) => ipcRenderer.send('change-theme', color),
  showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),
  setFocusProgress: (state) => ipcRenderer.send('focus-progress', state),

  // Preferências do sistema
  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  setPreferences: (patch) => ipcRenderer.invoke('set-preferences', patch),

  // IA
  ai: {
    hasKey: () => ipcRenderer.invoke('ai-has-key'),
    setKey: (key) => ipcRenderer.invoke('ai-set-key', key),
    generate: (request) => ipcRenderer.invoke('ai-generate', request),
  },

  // Plugins
  getPlugins: () => ipcRenderer.invoke('get-plugins'),

  // Eventos
  onDataChanged: (callback) => {
    const listener = (_e: IpcRendererEvent, topic: DataTopic) => callback(topic);
    ipcRenderer.on('data-changed', listener);
    return () => {
      ipcRenderer.removeListener('data-changed', listener);
    };
  },

  onOpenPalette: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('open-palette', listener);
    return () => {
      ipcRenderer.removeListener('open-palette', listener);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
