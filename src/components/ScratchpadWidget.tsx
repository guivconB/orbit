import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2 } from 'lucide-react';
import { toast } from '../lib/toast';
import { WidgetShell, IconButton } from './ui/WidgetShell';

const SAVE_DELAY_MS = 400;
const CLOUD_DELAY_MS = 2000;

const textareaClass =
  'flex-1 w-full bg-black/25 rounded-xl p-3 text-slate-200 placeholder-slate-500 resize-none outline-none border border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all custom-scrollbar font-sans text-sm leading-relaxed select-text';

export function ScratchpadWidget() {
  const [note, setNote] = useState('');
  const [expanded, setExpanded] = useState(false);
  const pending = useRef<string | null>(null);
  const changedByUser = useRef(false);

  // Grava o texto pendente (se houver). Só usa refs, então é estável.
  const flush = useCallback(() => {
    const content = pending.current;
    if (content === null) return;
    pending.current = null;
    window.electronAPI?.saveNote(content).catch(err => {
      console.error(err);
      toast.error('Não foi possível salvar a nota.');
    });
  }, []);

  useEffect(() => {
    window.electronAPI?.getNote().then(setNote);
  }, []);

  // Grava no SQLite um pouco depois de parar de digitar (antes era a cada tecla).
  useEffect(() => {
    if (pending.current === null) return;
    const timer = setTimeout(flush, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [note, flush]);

  // Não perde o que ainda não foi gravado ao fechar o widget ou recarregar a janela.
  useEffect(() => {
    window.addEventListener('beforeunload', flush);
    return () => {
      window.removeEventListener('beforeunload', flush);
      flush();
    };
  }, [flush]);

  // Nuvem: 2s depois de parar de digitar, só para mudanças feitas pela pessoa.
  useEffect(() => {
    if (!changedByUser.current) return;
    const timer = setTimeout(() => {
      import('../firebase/sync')
        .then(sync => sync.syncNoteToCloud(note))
        .catch(err => console.log('Firebase não configurado ou erro:', err));
    }, CLOUD_DELAY_MS);
    return () => clearTimeout(timer);
  }, [note]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setExpanded(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  const onChange = (value: string) => {
    changedByUser.current = true;
    pending.current = value;
    setNote(value);
  };

  const editor = (autoFocus: boolean) => (
    <textarea
      className={textareaClass}
      placeholder="Digite algo rapidamente..."
      value={note}
      onChange={e => onChange(e.target.value)}
      spellCheck="false"
      autoFocus={autoFocus}
    />
  );

  const badge = (
    <span className="text-[10px] text-slate-400 font-medium bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.04]">
      Salvo local
    </span>
  );

  return (
    <>
      <WidgetShell
        title="Scratchpad"
        badge={badge}
        actions={
          <IconButton label="Expandir nota" size="sm" onClick={() => setExpanded(true)}>
            <Maximize2 size={14} />
          </IconButton>
        }
      >
        {editor(false)}
      </WidgetShell>

      {expanded &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-6 md:p-12 flex" role="dialog" aria-label="Nota em tela cheia">
            <WidgetShell
              title="Scratchpad"
              badge={<span className="text-[10px] text-slate-500">Esc para fechar</span>}
              className="w-full max-w-4xl mx-auto"
              actions={
                <IconButton label="Fechar nota expandida" size="sm" onClick={() => setExpanded(false)}>
                  <Minimize2 size={14} />
                </IconButton>
              }
            >
              {editor(true)}
            </WidgetShell>
          </div>,
          document.body,
        )}
    </>
  );
}
