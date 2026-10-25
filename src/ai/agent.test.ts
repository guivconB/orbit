import { describe, expect, it, vi } from 'vitest';
import type { AiContent, AiFunctionCall, AiGenerateResult } from '../../shared/ai';
import { MAX_STEPS, runAgentTurn, systemInstruction, trimHistory } from './agent';
import type { AgentDeps } from './agent';

const text = (t: string): AiGenerateResult => ({ ok: true, text: t, functionCalls: [], content: { role: 'model', parts: [{ text: t }] } });
const calls = (...fc: AiFunctionCall[]): AiGenerateResult => ({
  ok: true, text: '', functionCalls: fc,
  content: { role: 'model', parts: fc.map(f => ({ functionCall: f, thoughtSignature: 'sig' })) },
});

function deps(responses: AiGenerateResult[], overrides: Partial<AgentDeps> = {}) {
  const queue = [...responses];
  const seen: AiContent[][] = [];
  const d: AgentDeps = {
    generate: vi.fn(async (contents: AiContent[]) => {
      seen.push(structuredClone(contents));
      return queue.shift() ?? text('fim');
    }),
    execute: vi.fn(async (call: AiFunctionCall) => ({ ok: true as const, message: `${call.name} ok` })),
    isDestructive: name => name === 'delete_task',
    confirm: vi.fn(async () => true),
    ...overrides,
  };
  return { d, seen };
}

describe('runAgentTurn', () => {
  it('resposta só em texto: sem ferramentas', async () => {
    const { d } = deps([text('Oi!')]);
    const res = await runAgentTurn([], 'olá', d);
    expect(res).toMatchObject({ ok: true, reply: 'Oi!', steps: [] });
    expect(res.contents).toHaveLength(2);
  });

  it('executa a ferramenta, devolve o resultado e mantém a assinatura do raciocínio', async () => {
    const { d, seen } = deps([calls({ id: 'c1', name: 'add_task', args: { title: 'Estudar React', priority: 'high' } }), text('Criei a tarefa.')]);
    const res = await runAgentTurn([], 'adiciona Estudar React com prioridade', d);

    expect(d.execute).toHaveBeenCalledWith({ id: 'c1', name: 'add_task', args: { title: 'Estudar React', priority: 'high' } });
    expect(res).toMatchObject({ ok: true, reply: 'Criei a tarefa.' });
    // 2ª chamada ao Gemini recebe: pergunta, pedido do modelo (com assinatura) e resposta da ferramenta
    const second = seen[1];
    expect(second[1].parts[0]).toMatchObject({ thoughtSignature: 'sig', functionCall: { name: 'add_task' } });
    expect(second[2]).toEqual({
      role: 'user',
      parts: [{ functionResponse: { id: 'c1', name: 'add_task', response: { result: 'add_task ok' } } }],
    });
  });

  it('várias ferramentas na mesma rodada (foco + música)', async () => {
    const { d } = deps([calls({ name: 'start_focus', args: { minutes: 40 } }, { name: 'play_music', args: { provider: 'lofi' } }), text('Bom foco!')]);
    const res = await runAgentTurn([], 'quero focar 40 min com música relaxante', d);
    expect(res.steps.map(s => s.name)).toEqual(['start_focus', 'play_music']);
  });

  it('erro da ferramenta volta para o modelo como error', async () => {
    const { d, seen } = deps([calls({ name: 'complete_task', args: { id: 9 } }), text('Não achei.')], {
      execute: async () => ({ ok: false, error: 'Não encontrei a tarefa #9.' }),
    });
    await runAgentTurn([], 'conclui a 9', d);
    expect(seen[1][2].parts[0].functionResponse?.response).toEqual({ error: 'Não encontrei a tarefa #9.' });
  });

  it('ação destrutiva pede confirmação; se cancelada, não executa', async () => {
    const confirm = vi.fn(async () => false);
    const { d, seen } = deps([calls({ name: 'delete_task', args: { id: 1 } }), text('Ok, não apaguei.')], { confirm });
    const res = await runAgentTurn([], 'apaga a tarefa 1', d);
    expect(confirm).toHaveBeenCalled();
    expect(d.execute).not.toHaveBeenCalled();
    expect(res.steps[0].result).toMatchObject({ ok: false, cancelled: true });
    expect(seen[1][2].parts[0].functionResponse?.response).toEqual({ error: 'A pessoa cancelou esta ação.' });
  });

  it('ação destrutiva confirmada é executada', async () => {
    const { d } = deps([calls({ name: 'delete_task', args: { id: 1 } }), text('Apaguei.')]);
    await runAgentTurn([], 'apaga a tarefa 1', d);
    expect(d.execute).toHaveBeenCalled();
  });

  it('para depois de MAX_STEPS rodadas (evita loop infinito)', async () => {
    const loop = Array.from({ length: MAX_STEPS + 2 }, () => calls({ name: 'list_tasks' }));
    const { d } = deps(loop);
    const res = await runAgentTurn([], 'x', d);
    expect(d.generate).toHaveBeenCalledTimes(MAX_STEPS);
    expect(res.ok && res.reply).toMatch(/Parei depois/);
  });

  it('erro do Gemini não perde o histórico anterior', async () => {
    const history: AiContent[] = [{ role: 'user', parts: [{ text: 'antes' }] }, { role: 'model', parts: [{ text: 'ok' }] }];
    const { d } = deps([{ ok: false, error: 'Sem conexão com a internet.' }]);
    const res = await runAgentTurn(history, 'nova', d);
    expect(res).toMatchObject({ ok: false, error: 'Sem conexão com a internet.', contents: history });
  });
});

describe('trimHistory', () => {
  const u = (t: string): AiContent => ({ role: 'user', parts: [{ text: t }] });
  const m = (t: string): AiContent => ({ role: 'model', parts: [{ text: t }] });
  const fr: AiContent = { role: 'user', parts: [{ functionResponse: { name: 'x', response: {} } }] };

  it('não corta quando cabe', () => {
    const h = [u('a'), m('b')];
    expect(trimHistory(h, 10)).toBe(h);
  });

  it('começa sempre numa mensagem de texto da pessoa', () => {
    const h = [u('1'), m('call'), fr, m('r'), u('2'), m('ok')];
    // limite 5 cairia em m('call'); avança até u('2')
    expect(trimHistory(h, 5)).toEqual([u('2'), m('ok')]);
  });
});

describe('systemInstruction', () => {
  it('inclui a data de hoje em AAAA-MM-DD', () => {
    expect(systemInstruction(new Date(2026, 9, 25))).toContain('(2026-10-25)');
  });
});
