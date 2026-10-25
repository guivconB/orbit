import type { AiContent, AiFunctionCall, AiGenerateResult } from '../../shared/ai';
import type { ActionResult } from '../actions/types';

// Laço do agente: pergunta ao Gemini, executa as ferramentas que ele pedir,
// devolve os resultados e repete até ele responder em texto.
// Função pura (tudo que fala com o mundo entra por `deps`) para poder ser testada.

export const MAX_STEPS = 6;
/** Quantas mensagens do histórico mandar no máximo (o resto é cortado no início). */
export const MAX_HISTORY = 40;

export interface AgentStep {
  name: string;
  args: Record<string, unknown>;
  result: ActionResult | { ok: false; error: string; cancelled: true };
}

export interface AgentDeps {
  generate: (contents: AiContent[]) => Promise<AiGenerateResult>;
  execute: (call: AiFunctionCall) => Promise<ActionResult>;
  /** Ações destrutivas só rodam se isto devolver true (a pessoa confirmou). */
  isDestructive: (name: string) => boolean;
  confirm: (call: AiFunctionCall) => Promise<boolean>;
  /** Avisado a cada ferramenta executada (para mostrar no chat na hora). */
  onStep?: (step: AgentStep) => void;
}

export type AgentTurnResult =
  | { ok: true; reply: string; contents: AiContent[]; steps: AgentStep[] }
  | { ok: false; error: string; contents: AiContent[]; steps: AgentStep[] };

/** Uma mensagem da pessoa → resposta final do assistente (com as ações no meio). */
export async function runAgentTurn(history: AiContent[], userText: string, deps: AgentDeps): Promise<AgentTurnResult> {
  const contents: AiContent[] = [...trimHistory(history), { role: 'user', parts: [{ text: userText }] }];
  const steps: AgentStep[] = [];

  for (let i = 0; i < MAX_STEPS; i++) {
    const res = await deps.generate(contents);
    // Em caso de erro, devolve o histórico sem a mensagem que falhou (pode tentar de novo).
    if (!res.ok) return { ok: false, error: res.error, contents: history, steps };

    contents.push(res.content);
    if (res.functionCalls.length === 0) {
      return { ok: true, reply: res.text || 'Feito.', contents, steps };
    }

    const responses = [];
    for (const call of res.functionCalls) {
      const args = call.args ?? {};
      let result: AgentStep['result'];
      if (deps.isDestructive(call.name) && !(await deps.confirm(call))) {
        result = { ok: false, error: 'A pessoa cancelou esta ação.', cancelled: true };
      } else {
        result = await deps.execute(call);
      }
      const step = { name: call.name, args, result };
      steps.push(step);
      deps.onStep?.(step);
      responses.push({
        functionResponse: {
          ...(call.id ? { id: call.id } : {}),
          name: call.name,
          response: result.ok ? { result: result.message } : { error: result.error },
        },
      });
    }
    contents.push({ role: 'user', parts: responses });
  }

  return {
    ok: true,
    reply: `Parei depois de ${MAX_STEPS} passos para não entrar em loop. Veja o que foi feito acima.`,
    contents,
    steps,
  };
}

const isUserText = (c: AiContent) => c.role === 'user' && c.parts.some(p => typeof p.text === 'string');

/**
 * Corta o começo do histórico para caber em MAX_HISTORY, sempre começando numa
 * mensagem de texto da pessoa (nunca separa uma chamada de ferramenta da resposta dela).
 */
export function trimHistory(history: AiContent[], max = MAX_HISTORY): AiContent[] {
  if (history.length <= max) return history;
  for (let start = history.length - max; start < history.length; start++) {
    if (isUserText(history[start])) return history.slice(start);
  }
  return [];
}

export function systemInstruction(now = new Date()): string {
  const today = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return [
    'Você é o assistente do Orbit, um painel pessoal de produtividade no Windows.',
    'Responda em português do Brasil, de forma curta e direta.',
    `Hoje é ${today} (${iso}). Use isso para calcular datas como "amanhã" ou "sexta" no formato AAAA-MM-DD.`,
    'Quando a pessoa pedir algo que o painel faz (tarefas, hábitos, foco/Pomodoro, música, tema, links), use as ferramentas em vez de só explicar.',
    'Para concluir, priorizar ou apagar uma tarefa, chame list_tasks antes para descobrir o id. Nunca invente ids.',
    'Depois de agir, confirme em uma frase o que foi feito. Se uma ferramenta devolver erro, explique o problema e não repita a mesma chamada.',
  ].join('\n');
}
