import { ipcMain } from 'electron';
import { getDb } from '../database';
import { int, oneOf, optionalIsoDate, str } from '../validate';
import { TASK_PRIORITIES, TASK_STATUSES } from '../../shared/models';
import { notifyChanged } from './context';

const COLUMNS = 'id, title, status, priority, due_date, position, created_at';

export function registerTasksHandlers() {
  ipcMain.handle('get-tasks', () => getDb().prepare(`SELECT ${COLUMNS} FROM tasks ORDER BY position ASC, id DESC`).all());

  // Tarefas novas entram no topo (position menor que todas).
  ipcMain.handle('add-task', (_e, task: Record<string, unknown>) => {
    const result = getDb()
      .prepare(`
        INSERT INTO tasks (title, status, priority, due_date, position)
        VALUES (?, ?, ?, ?, (SELECT COALESCE(MIN(position), 0) - 1 FROM tasks))
      `)
      .run(
        str(task?.title, 'title', 500).trim(),
        task?.status ? oneOf(task.status, TASK_STATUSES, 'status') : 'todo',
        task?.priority ? oneOf(task.priority, TASK_PRIORITIES, 'priority') : 'normal',
        optionalIsoDate(task?.due_date, 'due_date'),
      );
    notifyChanged('tasks');
    return result.lastInsertRowid;
  });

  ipcMain.handle('update-task', (_e, id: unknown, patch: Record<string, unknown>) => {
    const sets: string[] = [];
    const values: unknown[] = [];
    if ('title' in patch) { sets.push('title = ?'); values.push(str(patch.title, 'title', 500).trim()); }
    if ('status' in patch) { sets.push('status = ?'); values.push(oneOf(patch.status, TASK_STATUSES, 'status')); }
    if ('priority' in patch) { sets.push('priority = ?'); values.push(oneOf(patch.priority, TASK_PRIORITIES, 'priority')); }
    if ('due_date' in patch) { sets.push('due_date = ?'); values.push(optionalIsoDate(patch.due_date, 'due_date')); }
    if (sets.length === 0) return false;

    const result = getDb().prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...values, int(id, 'id'));
    notifyChanged('tasks');
    return result.changes > 0;
  });

  ipcMain.handle('update-task-status', (_e, id: unknown, status: unknown) => {
    getDb().prepare('UPDATE tasks SET status = ? WHERE id = ?').run(oneOf(status, TASK_STATUSES, 'status'), int(id, 'id'));
    notifyChanged('tasks');
    return true;
  });

  ipcMain.handle('delete-task', (_e, id: unknown) => {
    getDb().prepare('DELETE FROM tasks WHERE id = ?').run(int(id, 'id'));
    notifyChanged('tasks');
    return true;
  });

  // Usado ao restaurar o backup da nuvem: substitui todas as tarefas, mantendo a ordem recebida.
  ipcMain.handle('replace-tasks', (_e, tasks: unknown) => {
    if (!Array.isArray(tasks) || tasks.length > 10_000) throw new Error('Parâmetro inválido: tasks');
    const rows = tasks.map((t: Record<string, unknown>, index) => ({
      title: str(t?.title, 'title', 500),
      status: oneOf(t?.status, TASK_STATUSES, 'status'),
      priority: t?.priority ? oneOf(t.priority, TASK_PRIORITIES, 'priority') : 'normal',
      due_date: optionalIsoDate(t?.due_date, 'due_date'),
      position: index,
      created_at: typeof t?.created_at === 'string' && t.created_at ? t.created_at.slice(0, 30) : null,
    }));
    const db = getDb();
    const insert = db.prepare(`
      INSERT INTO tasks (title, status, priority, due_date, position, created_at)
      VALUES (@title, @status, @priority, @due_date, @position, COALESCE(@created_at, CURRENT_TIMESTAMP))
    `);
    db.transaction(() => {
      db.prepare('DELETE FROM tasks').run();
      rows.forEach(r => insert.run(r));
    })();
    notifyChanged('tasks');
    return true;
  });
}
