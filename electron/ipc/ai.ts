import { ipcMain } from 'electron';
import * as ai from '../ai';
import { oneOf, str } from '../validate';

// A chave do Gemini nunca sai do processo main.
export function registerAiHandlers() {
  ipcMain.handle('ai-has-key', () => ai.hasKey());

  ipcMain.handle('ai-set-key', (_e, key: unknown) => {
    ai.setKey(str(key, 'key', 300).trim());
    return true;
  });

  ipcMain.handle('ai-chat', (_e, history: unknown, message: unknown) => {
    if (!Array.isArray(history) || history.length > 200) throw new Error('Parâmetro inválido: history');
    const turns = history.map((t: { role?: unknown; text?: unknown }) => ({
      role: oneOf(t?.role, ['user', 'model'] as const, 'role'),
      text: str(t?.text, 'text', 20_000),
    }));
    return ai.chat(turns, str(message, 'message', 20_000));
  });
}
