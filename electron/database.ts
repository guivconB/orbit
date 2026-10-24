import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

let db: Database.Database;

// Migrações em ordem. Nunca edite uma que já foi lançada: adicione uma nova no fim.
// A posição no array é a versão (PRAGMA user_version).
const migrations: ((db: Database.Database) => void)[] = [
  // v1 — schema original (CREATE IF NOT EXISTS: seguro em bancos já existentes)
  (db) => db.exec(`
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
  `),

  // v2 — limpa registros órfãos/duplicados (o CASCADE nunca esteve ativo) e impede duplicatas
  (db) => db.exec(`
    DELETE FROM habit_logs WHERE habit_id NOT IN (SELECT id FROM habits);
    DELETE FROM habit_logs WHERE id NOT IN (SELECT MIN(id) FROM habit_logs GROUP BY habit_id, date);
    CREATE UNIQUE INDEX IF NOT EXISTS ux_habit_logs_day ON habit_logs(habit_id, date);
  `),
];

function migrate(db: Database.Database) {
  const current = db.pragma('user_version', { simple: true }) as number;
  if (current >= migrations.length) return;

  db.transaction(() => {
    migrations.slice(current).forEach(m => m(db));
    db.pragma(`user_version = ${migrations.length}`);
  })();
}

export function initDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'dashboard.sqlite');
  db = new Database(dbPath, app.isPackaged ? {} : { verbose: console.log });

  try {
    db.pragma('journal_mode = WAL');
  } catch (err) {
    console.error('Não foi possível ativar o WAL:', err);
  }
  db.pragma('foreign_keys = ON');

  migrate(db);

  const row = db.prepare('SELECT count(*) as count FROM notes').get() as { count: number };
  if (row.count === 0) {
    db.prepare('INSERT INTO notes (content) VALUES (?)').run('Bem-vindo ao seu Scratchpad!');
  }
}

export function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}
