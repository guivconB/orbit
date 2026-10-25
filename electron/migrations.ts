import type Database from 'better-sqlite3';

// Migrações em ordem. Nunca edite uma que já foi lançada: adicione uma nova no fim.
// A posição no array é a versão (PRAGMA user_version).
// Este arquivo não importa o Electron para poder ser testado com Node puro.

export const migrations: ((db: Database.Database) => void)[] = [
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

  // v3 — prioridade, prazo e ordem manual das tarefas.
  // position: menor aparece primeiro. Mantém a ordem antiga (mais nova no topo) usando -id.
  (db) => db.exec(`
    ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal';
    ALTER TABLE tasks ADD COLUMN due_date TEXT;
    ALTER TABLE tasks ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
    UPDATE tasks SET position = -id;
    CREATE INDEX IF NOT EXISTS ix_tasks_position ON tasks(position);
  `),
];

export function migrate(db: Database.Database): number {
  const current = db.pragma('user_version', { simple: true }) as number;
  if (current < migrations.length) {
    db.transaction(() => {
      migrations.slice(current).forEach(m => m(db));
      db.pragma(`user_version = ${migrations.length}`);
    })();
  }
  return migrations.length;
}
