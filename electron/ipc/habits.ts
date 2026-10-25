import { ipcMain } from 'electron';
import { getDb } from '../database';
import { int, isoDate, str } from '../validate';
import { notifyChanged } from './context';

export function registerHabitsHandlers() {
  ipcMain.handle('get-habits', () => {
    const db = getDb();
    const habits = db.prepare('SELECT id, name, created_at FROM habits ORDER BY created_at ASC, id ASC').all() as { id: number }[];
    const logs = db.prepare('SELECT habit_id, date FROM habit_logs').all() as { habit_id: number; date: string }[];
    return habits.map(h => ({ ...h, logs: logs.filter(l => l.habit_id === h.id).map(l => l.date) }));
  });

  ipcMain.handle('add-habit', (_e, name: unknown) => {
    const id = getDb().prepare('INSERT INTO habits (name) VALUES (?)').run(str(name, 'name', 200).trim()).lastInsertRowid;
    notifyChanged('habits');
    return id;
  });

  ipcMain.handle('delete-habit', (_e, id: unknown) => {
    getDb().prepare('DELETE FROM habits WHERE id = ?').run(int(id, 'id'));
    notifyChanged('habits');
    return true;
  });

  ipcMain.handle('toggle-habit-log', (_e, habitId: unknown, date: unknown) => {
    const db = getDb();
    const id = int(habitId, 'habitId');
    const day = isoDate(date, 'date');
    const removed = db.prepare('DELETE FROM habit_logs WHERE habit_id = ? AND date = ?').run(id, day);
    if (removed.changes === 0) {
      db.prepare('INSERT INTO habit_logs (habit_id, date) VALUES (?, ?)').run(id, day);
    }
    notifyChanged('habits');
    return true;
  });
}
