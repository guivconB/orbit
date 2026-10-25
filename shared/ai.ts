// Formato da conversa com o Gemini (subconjunto do `Content` do @google/genai).
// O main só repassa: o laço do agente roda na tela (src/ai/agent.ts), que executa
// as ferramentas pelo registro de ações.

export interface AiFunctionCall {
  id?: string;
  name: string;
  args?: Record<string, unknown>;
}

export interface AiFunctionResponse {
  id?: string;
  name: string;
  response: Record<string, unknown>;
}

export interface AiPart {
  text?: string;
  /** Raciocínio do modelo (não é mostrado para a pessoa) */
  thought?: boolean;
  /** Assinatura do raciocínio: precisa voltar intacta na próxima chamada */
  thoughtSignature?: string;
  functionCall?: AiFunctionCall;
  functionResponse?: AiFunctionResponse;
}

export interface AiContent {
  role: 'user' | 'model';
  parts: AiPart[];
}

export interface AiToolDeclaration {
  name: string;
  description: string;
  parametersJsonSchema: unknown;
}

export interface AiGenerateRequest {
  contents: AiContent[];
  tools: AiToolDeclaration[];
  systemInstruction: string;
}

export type AiGenerateResult =
  | { ok: true; content: AiContent; text: string; functionCalls: AiFunctionCall[] }
  | { ok: false; error: string };

/** Mantém só os campos conhecidos de uma parte (o resto é descartado). */
export function sanitizePart(part: unknown): AiPart | null {
  if (!part || typeof part !== 'object') return null;
  const p = part as Record<string, unknown>;
  const out: AiPart = {};
  if (typeof p.text === 'string') out.text = p.text;
  if (p.thought === true) out.thought = true;
  if (typeof p.thoughtSignature === 'string') out.thoughtSignature = p.thoughtSignature;

  const fc = p.functionCall as Record<string, unknown> | undefined;
  if (fc && typeof fc.name === 'string') {
    out.functionCall = {
      name: fc.name,
      ...(typeof fc.id === 'string' ? { id: fc.id } : {}),
      args: fc.args && typeof fc.args === 'object' ? (fc.args as Record<string, unknown>) : {},
    };
  }

  const fr = p.functionResponse as Record<string, unknown> | undefined;
  if (fr && typeof fr.name === 'string') {
    out.functionResponse = {
      name: fr.name,
      ...(typeof fr.id === 'string' ? { id: fr.id } : {}),
      response: fr.response && typeof fr.response === 'object' ? (fr.response as Record<string, unknown>) : {},
    };
  }

  return Object.keys(out).length > 0 ? out : null;
}

export function sanitizeContent(content: unknown): AiContent | null {
  if (!content || typeof content !== 'object') return null;
  const c = content as Record<string, unknown>;
  if (c.role !== 'user' && c.role !== 'model') return null;
  if (!Array.isArray(c.parts)) return null;
  const parts = c.parts.map(sanitizePart).filter((p): p is AiPart => p !== null);
  return { role: c.role, parts };
}
