import { app, safeStorage } from 'electron';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

// Alias mantido pelo Google que sempre aponta para o Gemini Flash atual.
const MODEL = 'gemini-flash-latest';

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

// A chave fica criptografada pelo Windows (DPAPI) e nunca vai para o renderer.
const keyFile = () => path.join(app.getPath('userData'), 'gemini.key');

export function hasKey(): boolean {
  return fs.existsSync(keyFile());
}

export function setKey(key: string): void {
  if (!key) {
    fs.rmSync(keyFile(), { force: true });
    return;
  }
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('A criptografia do sistema não está disponível.');
  }
  fs.writeFileSync(keyFile(), safeStorage.encryptString(key));
}

function getKey(): string | null {
  if (!hasKey()) return null;
  return safeStorage.decryptString(fs.readFileSync(keyFile()));
}

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/API_KEY_INVALID|API key not valid/i.test(msg)) return 'Chave de API inválida. Gere outra no Google AI Studio.';
  if (/429|RESOURCE_EXHAUSTED|quota/i.test(msg)) return 'Limite de uso da API atingido. Tente novamente mais tarde.';
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|network/i.test(msg)) return 'Sem conexão com a internet.';
  return `Erro do Gemini: ${msg.slice(0, 300)}`;
}

export async function chat(
  history: ChatTurn[],
  message: string,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  try {
    const apiKey = getKey();
    if (!apiKey) return { ok: false, error: 'Nenhuma chave de API configurada.' };

    const ai = new GoogleGenAI({ apiKey });
    const session = ai.chats.create({
      model: MODEL,
      history: history.map(t => ({ role: t.role, parts: [{ text: t.text }] })),
    });
    const res = await session.sendMessage({ message });
    return { ok: true, text: res.text ?? '' };
  } catch (err) {
    console.error('Gemini:', err);
    return { ok: false, error: friendlyError(err) };
  }
}
