import { useCallback } from 'react';
import { useFocus, useMusic } from '../focus/FocusContext';
import { useSettings } from '../hooks/useSettings';
import { ACTIONS, runAction } from './registry';
import type { ActionResult } from './types';

/** Dá acesso às ações já ligadas ao estado do app (foco, música, configurações). */
export function useActions() {
  const focus = useFocus();
  const music = useMusic();
  const settings = useSettings();

  const run = useCallback(
    async (id: string, params: Record<string, unknown> = {}): Promise<ActionResult> => {
      const api = window.electronAPI;
      if (!api) return { ok: false, error: 'O Orbit precisa estar rodando no app desktop.' };
      return runAction(id, params, { api, focus, music, settings });
    },
    [focus, music, settings],
  );

  return { actions: ACTIONS, run };
}
