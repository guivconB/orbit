// Canal para outras partes do app mandarem uma pergunta ao widget de IA
// (ex.: "Perguntar à IA: …" na paleta de comandos).

type Listener = (text: string) => void;
let listener: Listener | null = null;

/** O widget de IA se registra aqui enquanto está na tela. */
export function onAskAi(fn: Listener) {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

/** Envia a pergunta. Retorna false se o widget de IA não estiver ativo. */
export function askAi(text: string): boolean {
  if (!listener) return false;
  listener(text);
  return true;
}
