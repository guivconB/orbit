import type { ElectronAPI } from '../../shared/api';
import type { FocusApi, MusicApi } from '../focus/FocusContext';
import type { SettingsApi } from '../hooks/useSettings';

// Uma ação é algo que o Orbit sabe fazer ("criar tarefa", "iniciar foco"...).
// A MESMA lista alimenta a paleta de comandos (Ctrl+K) e as ferramentas da IA,
// então cada ação descreve seus parâmetros de um jeito que serve para os dois.

export type ParamType = 'string' | 'number' | 'boolean';

export interface ActionParam {
  name: string;
  type: ParamType;
  /** Explicação curta (aparece para a IA e como dica na paleta) */
  description: string;
  required?: boolean;
  /** Valores aceitos (só para string) */
  enum?: readonly string[];
  /** Limites (só para number) */
  min?: number;
  max?: number;
}

export interface ActionContext {
  api: ElectronAPI;
  focus: FocusApi;
  music: MusicApi;
  settings: SettingsApi;
}

export type ActionParams = Record<string, string | number | boolean | undefined>;

export interface OrbitAction {
  /** snake_case: vira o nome da ferramenta para a IA */
  id: string;
  /** Nome curto mostrado na paleta */
  title: string;
  /** O que a ação faz (para a IA decidir quando usar) */
  description: string;
  /** Palavras extras para a busca da paleta */
  keywords?: readonly string[];
  params: readonly ActionParam[];
  /** Apaga ou altera em massa: a IA deve confirmar com a pessoa antes */
  destructive?: boolean;
  /** Executa e devolve uma frase curta dizendo o que foi feito */
  run: (params: ActionParams, ctx: ActionContext) => Promise<string> | string;
}

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };
