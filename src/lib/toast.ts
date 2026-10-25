// Avisos curtos no canto da tela. Use em vez de console.error quando a pessoa precisa saber.
//   toast.error('Não foi possível salvar.')
//   toast.success('Tarefa criada')

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

const DURATION_MS = 4000;
const MAX_VISIBLE = 4;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach(l => l());

export function dismissToast(id: number) {
  items = items.filter(t => t.id !== id);
  emit();
}

function push(kind: ToastKind, message: string) {
  const id = nextId++;
  items = [...items, { id, kind, message }].slice(-MAX_VISIBLE);
  emit();
  setTimeout(() => dismissToast(id), DURATION_MS);
  return id;
}

export const toast = {
  success: (message: string) => push('success', message),
  error: (message: string) => push('error', message),
  info: (message: string) => push('info', message),
};

// Para useSyncExternalStore
export const subscribeToasts = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const getToasts = () => items;
