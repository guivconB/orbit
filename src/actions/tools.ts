import type { OrbitAction } from './types';

// Converte as ações no formato de ferramentas (function calling) do Gemini.
// Usado pela IA com ações (v5.0): o front envia estas declarações junto com o chat.

export interface ToolDeclaration {
  name: string;
  description: string;
  parametersJsonSchema: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: readonly string[]; minimum?: number; maximum?: number }>;
    required: string[];
  };
}

export function toToolDeclarations(actions: readonly OrbitAction[]): ToolDeclaration[] {
  return actions.map(action => ({
    name: action.id,
    description: action.destructive
      ? `${action.description} AÇÃO DESTRUTIVA: confirme com a pessoa antes de usar.`
      : action.description,
    parametersJsonSchema: {
      type: 'object',
      properties: Object.fromEntries(
        action.params.map(p => [
          p.name,
          {
            type: p.type,
            description: p.description,
            ...(p.enum ? { enum: p.enum } : {}),
            ...(p.min !== undefined ? { minimum: p.min } : {}),
            ...(p.max !== undefined ? { maximum: p.max } : {}),
          },
        ]),
      ),
      required: action.params.filter(p => p.required).map(p => p.name),
    },
  }));
}
