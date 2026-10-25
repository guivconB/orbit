import { ipcMain } from 'electron';
import { getDb } from '../database';
import { str } from '../validate';

export function registerNotesHandlers() {
  ipcMain.handle('get-note', () => {
    const row = getDb().prepare('SELECT content FROM notes ORDER BY id DESC LIMIT 1').get() as { content: string } | undefined;
    return row ? row.content : '';
  });

  // Sem notifyChanged aqui: quem salva é o próprio Scratchpad enquanto a pessoa digita,
  // e recarregar a nota no meio da digitação faria o cursor pular.
  ipcMain.handle('save-note', (_e, content: unknown) => {
    getDb()
      .prepare('UPDATE notes SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = (SELECT id FROM notes ORDER BY id DESC LIMIT 1)')
      .run(str(content, 'content', 1_000_000));
    return true;
  });
}
