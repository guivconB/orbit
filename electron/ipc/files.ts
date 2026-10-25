import { dialog, ipcMain, shell } from 'electron';
import path from 'path';
import { getDb } from '../database';
import { getMainWindow } from '../window';
import { int } from '../validate';
import { notifyChanged } from './context';

export function registerFilesHandlers() {
  ipcMain.handle('get-files', () => getDb().prepare('SELECT * FROM files ORDER BY created_at DESC, id DESC').all());

  ipcMain.handle('add-file', async () => {
    const win = getMainWindow();
    const options = { properties: ['openFile', 'openDirectory'] as ('openFile' | 'openDirectory')[] };
    const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
    if (result.canceled || result.filePaths.length === 0) return null;

    const filePath = result.filePaths[0];
    const insert = getDb().prepare('INSERT INTO files (name, path) VALUES (?, ?)').run(path.basename(filePath), filePath);
    notifyChanged('files');
    return insert.lastInsertRowid;
  });

  ipcMain.handle('delete-file', (_e, id: unknown) => {
    getDb().prepare('DELETE FROM files WHERE id = ?').run(int(id, 'id'));
    notifyChanged('files');
    return true;
  });

  // Só abre caminhos que o próprio usuário cadastrou pelo diálogo do sistema.
  ipcMain.handle('open-file', async (_e, id: unknown) => {
    const row = getDb().prepare('SELECT path FROM files WHERE id = ?').get(int(id, 'id')) as { path: string } | undefined;
    if (!row) return false;
    const error = await shell.openPath(row.path);
    if (error) {
      console.error('Falha ao abrir arquivo:', error);
      return false;
    }
    return true;
  });
}
