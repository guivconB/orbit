// electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("electronAPI", {
  // We will add specific methods here for database CRUD
  getNote: () => import_electron.ipcRenderer.invoke("get-note"),
  saveNote: (content) => import_electron.ipcRenderer.invoke("save-note", content),
  // Links
  getLinks: () => import_electron.ipcRenderer.invoke("get-links"),
  addLink: (link) => import_electron.ipcRenderer.invoke("add-link", link),
  deleteLink: (id) => import_electron.ipcRenderer.invoke("delete-link", id),
  // Files
  getFiles: () => import_electron.ipcRenderer.invoke("get-files"),
  addFile: () => import_electron.ipcRenderer.invoke("add-file"),
  deleteFile: (id) => import_electron.ipcRenderer.invoke("delete-file", id),
  openFile: (path) => import_electron.ipcRenderer.invoke("open-file", path),
  // Tasks
  getTasks: () => import_electron.ipcRenderer.invoke("get-tasks"),
  addTask: (task) => import_electron.ipcRenderer.invoke("add-task", task),
  updateTaskStatus: (id, status) => import_electron.ipcRenderer.invoke("update-task-status", id, status),
  deleteTask: (id) => import_electron.ipcRenderer.invoke("delete-task", id),
  // Habits
  getHabits: () => import_electron.ipcRenderer.invoke("get-habits"),
  addHabit: (name) => import_electron.ipcRenderer.invoke("add-habit", name),
  deleteHabit: (id) => import_electron.ipcRenderer.invoke("delete-habit", id),
  toggleHabitLog: (habitId, date) => import_electron.ipcRenderer.invoke("toggle-habit-log", habitId, date),
  // UI
  changeTheme: (color) => import_electron.ipcRenderer.send("change-theme", color)
});
