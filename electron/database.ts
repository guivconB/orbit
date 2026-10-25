import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { migrate } from './migrations';

let db: Database.Database;

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
