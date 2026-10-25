import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { migrate, migrations } from './migrations';

let db: Database.Database;
afterEach(() => db?.close());

const open = () => {
  db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  return db;
};

const columns = (table: string) =>
  (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map(c => c.name);

describe('migrations', () => {
  it('cria o schema completo num banco novo', () => {
    open();
    expect(migrate(db)).toBe(migrations.length);
    expect(db.pragma('user_version', { simple: true })).toBe(migrations.length);
    expect(columns('tasks')).toEqual(
      expect.arrayContaining(['id', 'title', 'status', 'created_at', 'priority', 'due_date', 'position']),
    );
  });

  it('é idempotente (rodar de novo não faz nada)', () => {
    open();
    migrate(db);
    expect(() => migrate(db)).not.toThrow();
    expect(db.pragma('user_version', { simple: true })).toBe(migrations.length);
  });

  it('atualiza um banco da v4.0 (user_version 0) sem perder dados', () => {
    open();
    migrations[0](db); // schema antigo, sem marcar a versão
    db.pragma('foreign_keys = OFF'); // a v4.0 não ativava FK, por isso tinha órfãos
    db.exec(`
      INSERT INTO tasks (id, title, status) VALUES (1, 'antiga', 'todo'), (2, 'nova', 'done');
      INSERT INTO habits (id, name) VALUES (1, 'Água');
      INSERT INTO habit_logs (habit_id, date) VALUES (1, '2026-10-01'), (1, '2026-10-01'), (99, '2026-10-01');
    `);
    db.pragma('user_version = 0');
    db.pragma('foreign_keys = ON');

    migrate(db);

    // v2: duplicata e órfão removidos
    expect(db.prepare('SELECT habit_id, date FROM habit_logs').all()).toEqual([{ habit_id: 1, date: '2026-10-01' }]);
    expect(() => db.prepare("INSERT INTO habit_logs (habit_id, date) VALUES (1, '2026-10-01')").run()).toThrow(/UNIQUE/);

    // v3: padrão de prioridade e ordem antiga preservada (mais nova primeiro)
    const tasks = db.prepare('SELECT title, priority, due_date FROM tasks ORDER BY position ASC').all();
    expect(tasks).toEqual([
      { title: 'nova', priority: 'normal', due_date: null },
      { title: 'antiga', priority: 'normal', due_date: null },
    ]);
  });

  it('atualiza um banco que já está na v2', () => {
    open();
    migrations[0](db);
    migrations[1](db);
    db.pragma('user_version = 2');
    db.exec("INSERT INTO tasks (title) VALUES ('x')");

    migrate(db);

    expect(db.prepare('SELECT priority, position FROM tasks').get()).toEqual({ priority: 'normal', position: -1 });
  });

  it('exclusão em cascata remove os registros do hábito', () => {
    open();
    migrate(db);
    db.exec("INSERT INTO habits (id, name) VALUES (1, 'Ler'); INSERT INTO habit_logs (habit_id, date) VALUES (1, '2026-10-02');");
    db.prepare('DELETE FROM habits WHERE id = 1').run();
    expect(db.prepare('SELECT count(*) AS n FROM habit_logs').get()).toEqual({ n: 0 });
  });
});
