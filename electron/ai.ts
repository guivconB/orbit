import { app, safeStorage } from 'electron';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { sanitizeContent } from '../shared/ai';
import type { AiGenerateRequest, AiGenerateResult } from '../shared/ai';

// Alias mantido pelo Google que sempre aponta para o Gemini Flash atual.
const MODEL = 'gemini-flash-latest';


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

/**
 * Uma rodada com o Gemini. Não executa ferramentas: devolve as chamadas pedidas
 * pelo modelo para a tela executar pelo registro de ações e mandar o resultado
 * na próxima rodada. O `content` volta inteiro (com thoughtSignature), como o
 * Gemini exige no histórico.
 */
export async function generate(req: AiGenerateRequest): Promise<AiGenerateResult> {
  try {
    const apiKey = getKey();
    if (!apiKey) return { ok: false, error: 'Nenhuma chave de API configurada.' };

    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: req.contents,
      config: {
        systemInstruction: req.systemInstruction,
        temperature: 0.4,
        ...(req.tools.length > 0
          ? { tools: [{ functionDeclarations: req.tools }], automaticFunctionCalling: { disable: true } }
          : {}),
      },
    });

    const raw = res.candidates?.[0]?.content;
    const content = sanitizeContent({ role: 'model', parts: raw?.parts ?? [] }) ?? { role: 'model', parts: [] };
    const functionCalls = content.parts.flatMap(p => (p.functionCall ? [p.functionCall] : []));
    const text = content.parts.filter(p => p.text && !p.thought).map(p => p.text).join('').trim();
    return { ok: true, content, text, functionCalls };
  } catch (err) {
    console.error('Gemini:', err);
    return { ok: false, error: friendlyError(err) };
  }
}
