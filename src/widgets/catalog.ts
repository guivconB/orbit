// Lista dos widgets nativos: nome e tamanho padrão.
// Fica separada dos componentes (registry.tsx) para as configurações poderem
// importar sem criar dependência circular com os widgets.
//
// Para criar um widget novo:
//   1. adicione uma linha aqui;
//   2. adicione o componente em registry.tsx.
// Configurações, ordem padrão e lista no modal saem daqui automaticamente.

export type WidgetSize = 'small' | 'medium' | 'large';

export interface WidgetMeta {
  id: string;
  name: string;
  defaultSize: WidgetSize;
}

export const WIDGET_CATALOG = [
  { id: 'scratchpad', name: 'Bloco de Notas', defaultSize: 'small' },
  { id: 'links', name: 'Links Rápidos', defaultSize: 'small' },
  { id: 'files', name: 'Atalhos de Arquivos', defaultSize: 'small' },
  { id: 'kanban', name: 'Tarefas / Ideias', defaultSize: 'small' },
  { id: 'pomodoro', name: 'Timer Pomodoro', defaultSize: 'small' },
  { id: 'weather', name: 'Relógio e Clima', defaultSize: 'small' },
  { id: 'habits', name: 'Hábitos', defaultSize: 'small' },
  { id: 'ai', name: 'Assistente IA (Gemini)', defaultSize: 'medium' },
  { id: 'music', name: 'Player de Música', defaultSize: 'small' },
] as const satisfies readonly WidgetMeta[];

export type BuiltinWidgetId = (typeof WIDGET_CATALOG)[number]['id'];

export function widgetName(id: string): string {
  return WIDGET_CATALOG.find(w => w.id === id)?.name ?? id;
}
