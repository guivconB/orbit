import { useCallback, useEffect, useRef, useState } from 'react';
import type { DataTopic } from '../../shared/models';
import { toast } from '../lib/toast';

/**
 * Lista vinda do banco que se mantém atualizada sozinha:
 * - carrega ao montar;
 * - recarrega quando o main avisa que a área mudou (por este widget, pela IA, pela paleta…);
 * - `mutate` aplica a mudança na tela antes da resposta do banco (sem "piscar")
 *   e desfaz recarregando se der erro.
 */
export function useCollection<T>(topic: DataTopic, fetcher: (api: NonNullable<Window['electronAPI']>) => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);
  const [loaded, setLoaded] = useState(false);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const reload = useCallback(async () => {
    const api = window.electronAPI;
    if (!api) return;
    try {
      const data = await fetcherRef.current(api);
      setItems(data);
      setLoaded(true);
    } catch (err) {
      console.error(`Falha ao carregar ${topic}:`, err);
      toast.error('Não foi possível carregar os dados.');
    }
  }, [topic]);

  useEffect(() => {
    reload();
    return window.electronAPI?.onDataChanged(changed => {
      if (changed === topic) reload();
    });
  }, [topic, reload]);

  const mutate = useCallback(
    async (optimistic: ((current: T[]) => T[]) | null, operation: () => Promise<unknown>, errorMessage = 'Não foi possível salvar.') => {
      if (optimistic) setItems(optimistic);
      try {
        await operation();
      } catch (err) {
        console.error(err);
        toast.error(errorMessage);
        reload();
      }
    },
    [reload],
  );

  return { items, loaded, reload, mutate };
}
