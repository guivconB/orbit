import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Bot, Send, Key, CheckCircle2, XCircle, ShieldAlert, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import { useSettings } from '../hooks/useSettings';
import { useActions } from '../actions/useActions';
import { findAction } from '../actions/registry';
import { toToolDeclarations } from '../actions/tools';
import { runAgentTurn, systemInstruction } from '../ai/agent';
import { onAskAi } from '../ai/bus';
import { toast } from '../lib/toast';
import type { AiContent, AiFunctionCall } from '../../shared/ai';

type ChatItem =
  | { kind: 'user' | 'model' | 'error'; text: string }
  | { kind: 'action'; ok: boolean; text: string }
  | { kind: 'confirm'; id: number; text: string; answer?: boolean };

const GREETING: ChatItem = {
  kind: 'model',
  text: 'Olá! Posso conversar e também mexer no painel: criar tarefas, marcar hábitos, iniciar o foco, tocar música…\nEx.: "adiciona Estudar React com prioridade alta" ou "quero focar 40 min com lofi".',
};

/** "Apagar tarefa (id: 3)" — descrição legível de uma chamada de ferramenta. */
function describeCall(call: AiFunctionCall) {
  const title = findAction(call.name)?.title ?? call.name;
  const args = Object.entries(call.args ?? {}).map(([k, v]) => `${k}: ${String(v)}`).join(', ');
  return args ? `${title} (${args})` : title;
}

export function AIAssistantWidget() {
  const { settings } = useSettings();
  const { actions, run } = useActions();
  const tools = useMemo(() => toToolDeclarations(actions), [actions]);

  const [items, setItems] = useState<ChatItem[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const [pendingConfirm, setPendingConfirm] = useState<{ id: number; resolve: (ok: boolean) => void } | null>(null);
  const confirmId = useRef(0);
  const contentsRef = useRef<AiContent[]>([]);
  const runRef = useRef(run);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    runRef.current = run;
  });

  useEffect(() => {
    window.electronAPI?.ai.hasKey().then(exists => {
      setHasKey(exists);
      setIsEditingKey(!exists);
    });
  }, [settings.geminiApiKey]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items, loading]);

  const saveKey = async (key: string) => {
    if (!window.electronAPI) return;
    setKeyError('');
    try {
      await window.electronAPI.ai.setKey(key);
      const exists = key.length > 0;
      setHasKey(exists);
      setIsEditingKey(!exists);
      setTempKey('');
    } catch (err) {
      setKeyError(err instanceof Error ? err.message : 'Não foi possível salvar a chave.');
    }
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempKey.trim()) saveKey(tempKey.trim());
  };

  // Mostra o pedido de confirmação no chat e espera a pessoa responder.
  const confirm = useCallback((call: AiFunctionCall) => new Promise<boolean>(resolve => {
    const id = ++confirmId.current;
    setPendingConfirm({ id, resolve });
    setItems(prev => [...prev, { kind: 'confirm', id, text: describeCall(call) }]);
  }), []);

  const answerConfirm = (ok: boolean) => {
    if (!pendingConfirm) return;
    const { id, resolve } = pendingConfirm;
    setItems(prev => prev.map(item => (item.kind === 'confirm' && item.id === id ? { ...item, answer: ok } : item)));
    setPendingConfirm(null);
    resolve(ok);
  };

  const send = useCallback(async (userText: string) => {
    const api = window.electronAPI;
    if (!userText.trim() || !api || loading) return;
    setItems(prev => [...prev, { kind: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await runAgentTurn(contentsRef.current, userText, {
        generate: contents => api.ai.generate({ contents, tools, systemInstruction: systemInstruction() }),
        execute: call => runRef.current(call.name, call.args ?? {}),
        isDestructive: name => !!findAction(name)?.destructive,
        confirm,
        onStep: step => {
          if ('cancelled' in step.result) return; // a resposta da confirmação já aparece no chat
          setItems(prev => [...prev, step.result.ok
            ? { kind: 'action', ok: true, text: step.result.message }
            : { kind: 'action', ok: false, text: step.result.error }]);
        },
      });
      contentsRef.current = res.contents;
      setItems(prev => [...prev, res.ok ? { kind: 'model', text: res.reply } : { kind: 'error', text: res.error }]);
    } catch (err) {
      console.error(err);
      setItems(prev => [...prev, { kind: 'error', text: 'Erro inesperado ao falar com o Gemini.' }]);
    } finally {
      setLoading(false);
    }
  }, [loading, tools, confirm]);

  // Perguntas vindas da paleta de comandos
  const sendRef = useRef(send);
  const hasKeyRef = useRef(hasKey);
  useEffect(() => {
    sendRef.current = send;
    hasKeyRef.current = hasKey;
  });
  useEffect(() => onAskAi(text => {
    if (!hasKeyRef.current) {
      toast.error('Configure sua chave do Gemini no widget Assistente IA para usar a IA.');
      setIsEditingKey(true);
      return;
    }
    setIsEditingKey(false);
    sendRef.current(text);
  }), []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasKey) return;
    const text = input.trim();
    setInput('');
    send(text);
  };

  const clearChat = () => {
    contentsRef.current = [];
    setItems([GREETING]);
  };

  const bubble = (item: ChatItem, i: number) => {
    switch (item.kind) {
      case 'action':
        return (
          <div key={i} className="flex justify-start">
            <div className={clsx(
              'max-w-[90%] px-3 py-2 rounded-xl text-xs flex items-start gap-2 border select-text',
              item.ok ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200' : 'bg-rose-500/10 border-rose-500/25 text-rose-200',
            )}>
              {item.ok ? <CheckCircle2 size={14} className="shrink-0 mt-px" /> : <XCircle size={14} className="shrink-0 mt-px" />}
              <span className="whitespace-pre-wrap">{item.text}</span>
            </div>
          </div>
        );
      case 'confirm':
        return (
          <div key={i} className="flex justify-start">
            <div className="max-w-[90%] px-3 py-2.5 rounded-xl text-xs border bg-amber-500/10 border-amber-500/25 text-amber-100">
              <div className="flex items-start gap-2">
                <ShieldAlert size={14} className="shrink-0 mt-px text-amber-400" />
                <span>Posso fazer isto? <strong>{item.text}</strong></span>
              </div>
              {item.answer === undefined ? (
                <div className="flex gap-2 mt-2 justify-end">
                  <button onClick={() => answerConfirm(false)} className="px-2.5 py-1 rounded-lg text-slate-300 hover:bg-white/10 cursor-pointer">Cancelar</button>
                  <button onClick={() => answerConfirm(true)} className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-semibold hover:opacity-90 cursor-pointer">Confirmar</button>
                </div>
              ) : (
                <div className="mt-1.5 text-right text-[11px] text-slate-400">{item.answer ? 'Confirmado' : 'Cancelado'}</div>
              )}
            </div>
          </div>
        );
      default:
        return (
          <div key={i} className={`flex ${item.kind === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={clsx(
                'max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap select-text leading-relaxed',
                item.kind === 'user' && 'bg-accent text-white rounded-tr-sm shadow-md shadow-accent/20',
                item.kind === 'model' && 'bg-black/30 border border-white/[0.08] text-slate-200 rounded-tl-sm shadow-inner',
                item.kind === 'error' && 'bg-rose-500/10 border border-rose-500/25 text-rose-200 rounded-tl-sm',
              )}
            >
              {item.text}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="orbit-card flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06] bg-black/20">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 tracking-wide">
          <Bot size={16} className="text-accent drop-shadow-[0_0_8px_var(--color-accent-glow)]" />
          Assistente Gemini
        </h2>
        <div className="flex items-center gap-1">
          {hasKey && !isEditingKey && (
            <button
              onClick={clearChat}
              disabled={loading}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
              title="Nova conversa"
              aria-label="Nova conversa"
            >
              <RotateCcw size={14} />
            </button>
          )}
          <button
            onClick={() => setIsEditingKey(!isEditingKey)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Configurar API Key"
            aria-label="Configurar API Key"
          >
            <Key size={14} />
          </button>
        </div>
      </div>

      {hasKey === null ? (
        <div className="flex-1" />
      ) : isEditingKey ? (
        <div className="flex-1 p-6 flex flex-col justify-center items-center">
          <div className="text-center mb-4">
            <h3 className="text-sm font-bold text-slate-100 mb-1">
              {hasKey ? 'Trocar a API Key' : 'Configure sua API Key'}
            </h3>
            <p className="text-xs text-slate-400">Gere gratuitamente no Google AI Studio e cole abaixo.</p>
            <p className="text-[11px] text-slate-500 mt-1">A chave é protegida e criptografada neste PC.</p>
          </div>
          <form onSubmit={handleSaveKey} className="w-full max-w-[260px] flex flex-col gap-2.5">
            <input
              type="password"
              placeholder="AIzaSy..."
              className="w-full p-2.5 rounded-xl bg-black/30 border border-white/10 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 text-white font-mono placeholder-slate-500 transition-all"
              value={tempKey}
              onChange={e => setTempKey(e.target.value)}
            />
            <button
              type="submit"
              className="w-full p-2.5 bg-accent hover:opacity-90 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-sm shadow-accent/25 transition-all cursor-pointer"
            >
              Salvar Chave
            </button>
            {hasKey && (
              <button
                type="button"
                onClick={() => saveKey('')}
                className="w-full p-2 text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Remover chave salva
              </button>
            )}
            {keyError && <p className="text-xs text-rose-400 text-center">{keyError}</p>}
          </form>
        </div>
      ) : (
        <>
          <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar flex flex-col">
            {items.map(bubble)}
            {loading && !pendingConfirm && (
              <div className="flex justify-start">
                <div className="bg-black/30 border border-white/[0.08] text-slate-400 p-3 rounded-2xl rounded-tl-sm text-sm animate-pulse flex items-center gap-1.5 shadow-inner">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t border-white/[0.06] bg-black/20">
            <form onSubmit={onSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Peça algo ou pergunte..."
                className="flex-1 bg-black/30 border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 text-slate-100 placeholder-slate-500 transition-all font-sans"
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-accent hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2 rounded-xl transition-all flex items-center justify-center w-10 h-10 shadow-sm shadow-accent/20 active:scale-95 cursor-pointer shrink-0"
                aria-label="Enviar mensagem"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
