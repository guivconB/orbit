import { ipcMain } from 'electron';
import * as ai from '../ai';
import { str } from '../validate';
import { sanitizeContent } from '../../shared/ai';
import type { AiContent, AiToolDeclaration } from '../../shared/ai';

const MAX_CONTENTS = 120;
const MAX_REQUEST_BYTES = 1_000_000;

// A chave do Gemini nunca sai do processo main.
export function registerAiHandlers() {
  ipcMain.handle('ai-has-key', () => ai.hasKey());

  ipcMain.handle('ai-set-key', (_e, key: unknown) => {
    ai.setKey(str(key, 'key', 300).trim());
    return true;
  });

  ipcMain.handle('ai-generate', (_e, req: Record<string, unknown>) => {
    if (JSON.stringify(req ?? null).length > MAX_REQUEST_BYTES) throw new Error('Conversa grande demais.');
    if (!Array.isArray(req?.contents) || req.contents.length === 0 || req.contents.length > MAX_CONTENTS) {
      throw new Error('Parâmetro inválido: contents');
    }
    const contents = req.contents.map(sanitizeContent);
    if (contents.some(c => c === null)) throw new Error('Parâmetro inválido: contents');

    const tools = Array.isArray(req.tools) ? req.tools.slice(0, 64) : [];
    const declarations: AiToolDeclaration[] = tools.map((t: Record<string, unknown>) => {
      const name = str(t?.name, 'tool.name', 64);
      if (!/^[a-z][a-z0-9_]*$/.test(name)) throw new Error('Parâmetro inválido: tool.name');
      return { name, description: str(t?.description, 'tool.description', 1000), parametersJsonSchema: t?.parametersJsonSchema ?? { type: 'object' } };
    });

    return ai.generate({
      contents: contents as AiContent[],
      tools: declarations,
      systemInstruction: str(req.systemInstruction ?? '', 'systemInstruction', 5000),
    });
  });
}
