import { useEffect } from 'react';

const DELAY_MS = 2000;

/**
 * Sincroniza com a nuvem tudo que muda no banco (por enquanto, as tarefas),
 * venha a mudança de onde vier: widget, IA, paleta ou restauração.
 * A nota é sincronizada pelo próprio Scratchpad enquanto a pessoa digita.
 * Fica no App para funcionar mesmo com o widget de Tarefas desativado.
 */
export function useCloudSync() {
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const unsubscribe = api.onDataChanged(topic => {
      if (topic !== 'tasks') return;
      clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          const [sync, tasks] = await Promise.all([import('../firebase/sync'), api.getTasks()]);
          await sync.syncTasksToCloud(tasks);
        } catch (err) {
          console.log('Firebase não configurado ou erro:', err);
        }
      }, DELAY_MS);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);
}
