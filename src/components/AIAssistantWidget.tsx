import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Key } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useSettings } from '../hooks/useSettings';

export function AIAssistantWidget() {
  const { settings, updateSettings } = useSettings();
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([
    { role: 'model', text: 'Olá! Sou seu assistente Gemini. Como posso ajudar com sua produtividade hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(!settings.geminiApiKey);
  const [tempKey, setTempKey] = useState(settings.geminiApiKey || '');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ geminiApiKey: tempKey.trim() });
    setIsEditingKey(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !settings.geminiApiKey) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(settings.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const chat = model.startChat({
        history: messages.slice(1).map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      });

      const result = await chat.sendMessage(userText);
      const response = await result.response;
      const text = response.text();

      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: '❌ Erro de conexão com o Gemini. Verifique sua chave de API.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-widget rounded-xl shadow-lg border border-border flex flex-col h-full min-h-[400px]">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Bot size={16} className="text-blue-400" />
          Assistente Gemini
        </h2>
        <button 
          onClick={() => setIsEditingKey(!isEditingKey)}
          className="text-slate-400 hover:text-slate-200 transition-colors"
          title="Configurar API Key"
        >
          <Key size={14} />
        </button>
      </div>

      {isEditingKey ? (
        <div className="flex-1 p-4 flex flex-col justify-center items-center">
          <div className="text-center mb-4">
            <h3 className="text-sm font-medium text-slate-200 mb-2">Configure a sua API Key</h3>
            <p className="text-xs text-slate-400">Gere gratuitamente no Google AI Studio e cole abaixo.</p>
          </div>
          <form onSubmit={handleSaveKey} className="w-full max-w-[250px] flex flex-col gap-2">
            <input 
              type="password"
              placeholder="AIzaSy..."
              className="w-full p-2 rounded bg-app border border-border text-sm outline-none focus:border-blue-500 text-white"
              value={tempKey}
              onChange={e => setTempKey(e.target.value)}
            />
            <button type="submit" className="w-full p-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors">
              Salvar Chave
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar flex flex-col">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-lg text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-app border border-border text-slate-200 rounded-tl-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-app border border-border text-slate-400 p-3 rounded-lg rounded-tl-none text-sm animate-pulse flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t border-border">
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Pergunte algo..."
                className="flex-1 bg-app border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 text-slate-100"
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading}
              />
              <button 
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors flex items-center justify-center w-10 h-10"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
