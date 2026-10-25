import { ipcMain } from 'electron';
import { getDb } from '../database';
import { int, isHttpUrl, str } from '../validate';
import { notifyChanged } from './context';

export function registerLinksHandlers() {
  ipcMain.handle('get-links', () => getDb().prepare('SELECT * FROM links ORDER BY created_at DESC, id DESC').all());

  ipcMain.handle('add-link', (_e, link: { title?: unknown; url?: unknown; category?: unknown }) => {
    if (!isHttpUrl(link?.url)) throw new Error('A URL precisa começar com http:// ou https://');
    const result = getDb()
      .prepare('INSERT INTO links (title, url, category) VALUES (?, ?, ?)')
      .run(str(link.title, 'title', 200), link.url, link.category ? str(link.category, 'category', 100) : 'Geral');
    notifyChanged('links');
    return result.lastInsertRowid;
  });

  ipcMain.handle('delete-link', (_e, id: unknown) => {
    getDb().prepare('DELETE FROM links WHERE id = ?').run(int(id, 'id'));
    notifyChanged('links');
    return true;
  });
}
