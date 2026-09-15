var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron2 = require("electron");
var import_path2 = __toESM(require("path"), 1);

// electron/database.ts
var import_better_sqlite3 = __toESM(require("better-sqlite3"), 1);
var import_path = __toESM(require("path"), 1);
var import_electron = require("electron");
var db;
function initDatabase() {
  const dbPath = import_path.default.join(import_electron.app.getPath("userData"), "dashboard.sqlite");
  db = new import_better_sqlite3.default(dbPath, { verbose: console.log });
  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      category TEXT DEFAULT 'Geral',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'todo',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY(habit_id) REFERENCES habits(id) ON DELETE CASCADE
    );
  `);
  const row = db.prepare("SELECT count(*) as count FROM notes").get();
  if (row.count === 0) {
    db.prepare("INSERT INTO notes (content) VALUES (?)").run("Bem-vindo ao seu Scratchpad!");
  }
}
function getDb() {
  if (!db) throw new Error("Database not initialized");
  return db;
}

// electron/main.ts
var isDev = !import_electron2.app.isPackaged;
var mainWindow = null;
function createWindow() {
  mainWindow = new import_electron2.BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: import_path2.default.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#0f172a",
      symbolColor: "#f8fafc"
    }
  });
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(import_path2.default.join(__dirname, "../dist/index.html"));
  }
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    import_electron2.shell.openExternal(url);
    return { action: "deny" };
  });
  import_electron2.ipcMain.handle("get-note", () => {
    const db2 = getDb();
    const row = db2.prepare("SELECT content FROM notes ORDER BY id DESC LIMIT 1").get();
    return row ? row.content : "";
  });
  import_electron2.ipcMain.handle("save-note", (event, content) => {
    const db2 = getDb();
    db2.prepare("UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM notes ORDER BY id DESC LIMIT 1)").run(content);
    return true;
  });
  import_electron2.ipcMain.handle("get-links", () => {
    const db2 = getDb();
    return db2.prepare("SELECT * FROM links ORDER BY created_at DESC").all();
  });
  import_electron2.ipcMain.handle("add-link", (event, link) => {
    const db2 = getDb();
    const result = db2.prepare("INSERT INTO links (title, url, category) VALUES (?, ?, ?)").run(link.title, link.url, link.category || "Geral");
    return result.lastInsertRowid;
  });
  import_electron2.ipcMain.handle("delete-link", (event, id) => {
    const db2 = getDb();
    db2.prepare("DELETE FROM links WHERE id = ?").run(id);
    return true;
  });
  import_electron2.ipcMain.handle("get-files", () => {
    const db2 = getDb();
    return db2.prepare("SELECT * FROM files ORDER BY created_at DESC").all();
  });
  import_electron2.ipcMain.handle("add-file", async (event) => {
    const { dialog } = require("electron");
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile", "openDirectory"]
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const filePath = result.filePaths[0];
    const path3 = require("path");
    const name = path3.basename(filePath);
    const db2 = getDb();
    const insertResult = db2.prepare("INSERT INTO files (name, path) VALUES (?, ?)").run(name, filePath);
    return insertResult.lastInsertRowid;
  });
  import_electron2.ipcMain.handle("delete-file", (event, id) => {
    const db2 = getDb();
    db2.prepare("DELETE FROM files WHERE id = ?").run(id);
    return true;
  });
  import_electron2.ipcMain.handle("open-file", async (event, filePath) => {
    const error = await import_electron2.shell.openPath(filePath);
    if (error) {
      console.error("Failed to open file:", error);
      return false;
    }
    return true;
  });
  import_electron2.ipcMain.handle("get-tasks", () => {
    const db2 = getDb();
    return db2.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all();
  });
  import_electron2.ipcMain.handle("add-task", (event, task) => {
    const db2 = getDb();
    const result = db2.prepare("INSERT INTO tasks (title, status) VALUES (?, ?)").run(task.title, task.status || "todo");
    return result.lastInsertRowid;
  });
  import_electron2.ipcMain.handle("update-task-status", (event, id, status) => {
    const db2 = getDb();
    db2.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(status, id);
    return true;
  });
  import_electron2.ipcMain.handle("delete-task", (event, id) => {
    const db2 = getDb();
    db2.prepare("DELETE FROM tasks WHERE id = ?").run(id);
    return true;
  });
  import_electron2.ipcMain.handle("get-habits", () => {
    const db2 = getDb();
    const habits = db2.prepare("SELECT * FROM habits ORDER BY created_at ASC").all();
    const logs = db2.prepare("SELECT * FROM habit_logs").all();
    return habits.map((h) => ({
      ...h,
      logs: logs.filter((l) => l.habit_id === h.id).map((l) => l.date)
    }));
  });
  import_electron2.ipcMain.handle("add-habit", (event, name) => {
    const db2 = getDb();
    const result = db2.prepare("INSERT INTO habits (name) VALUES (?)").run(name);
    return result.lastInsertRowid;
  });
  import_electron2.ipcMain.handle("delete-habit", (event, id) => {
    const db2 = getDb();
    db2.prepare("DELETE FROM habits WHERE id = ?").run(id);
    return true;
  });
  import_electron2.ipcMain.handle("toggle-habit-log", (event, habitId, date) => {
    const db2 = getDb();
    const existing = db2.prepare("SELECT id FROM habit_logs WHERE habit_id = ? AND date = ?").get(habitId, date);
    if (existing) {
      db2.prepare("DELETE FROM habit_logs WHERE habit_id = ? AND date = ?").run(habitId, date);
    } else {
      db2.prepare("INSERT INTO habit_logs (habit_id, date) VALUES (?, ?)").run(habitId, date);
    }
    return true;
  });
  import_electron2.ipcMain.on("change-theme", (event, color) => {
    if (mainWindow) {
      mainWindow.setTitleBarOverlay({ color });
    }
  });
}
import_electron2.app.whenReady().then(() => {
  initDatabase();
  createWindow();
  import_electron2.app.on("activate", () => {
    if (import_electron2.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
import_electron2.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron2.app.quit();
  }
});
