import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Key } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

const GREETING: ChatTurn = { role: 'model', text: 'Olá! Sou seu assistente Gemini. Como posso ajudar com sua produtividade hoje?' };

export function AIAssistantWidget() {
  const { settings } = useSettings();
  const [messages, setMessages] = useState<ChatTurn[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.electronAPI?.ai.hasKey().then(exists => {
      setHasKey(exists);
      setIsEditingKey(!exists);
    });
  }, [settings.geminiApiKey]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !hasKey || !window.electronAPI) return;

    const userText = input.trim();
    const history = messages.slice(1);
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await window.electronAPI.ai.chat(history, userText);
      setMessages(prev => [...prev, { role: 'model', text: res.ok ? res.text : `Erro: ${res.error}` }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Erro inesperado ao conectar com o Gemini.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="orbit-card flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06] bg-black/20">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 tracking-wide">
          <Bot size={16} className="text-accent drop-shadow-[0_0_8px_var(--color-accent-glow)]" />
          Assistente Gemini
        </h2>
        <button
          onClick={() => setIsEditingKey(!isEditingKey)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Configurar API Key"
          aria-label="Configurar API Key"
        >
          <Key size={14} />
        </button>
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
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap select-text leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-accent text-white rounded-tr-sm shadow-md shadow-accent/20' 
                      : 'bg-black/30 border border-white/[0.08] text-slate-200 rounded-tl-sm shadow-inner'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
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
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Pergunte algo..."
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
