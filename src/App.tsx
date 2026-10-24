import React, { useState, useEffect, useRef } from 'react';
import { Settings, Maximize2, Expand, Heart } from 'lucide-react';
import { LinksWidget } from './components/LinksWidget';
import { FilesWidget } from './components/FilesWidget';
import { KanbanWidget } from './components/KanbanWidget';
import { PomodoroWidget } from './components/PomodoroWidget';
import { ClockWeatherWidget } from './components/ClockWeatherWidget';
import { HabitsWidget } from './components/HabitsWidget';
import { SettingsModal } from './components/SettingsModal';
import { SupportModal } from './components/SupportModal';
import { SortableWidget } from './components/SortableWidget';
import { useSettings } from './hooks/useSettings';
import { PluginFrame } from './components/PluginFrame';
import { MusicWidget } from './components/MusicWidget';
import { AIAssistantWidget } from './components/AIAssistantWidget';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

function App() {
  const [note, setNote] = useState('');
  const [plugins, setPlugins] = useState<OrbitPlugin[]>([]);
  const noteChangedByUser = useRef(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const { settings, reorderWidgets, updateSettings } = useSettings();
  const settingsRef = useRef(settings);
  const updateSettingsRef = useRef(updateSettings);

  useEffect(() => {
    settingsRef.current = settings;
    updateSettingsRef.current = updateSettings;
  }, [settings, updateSettings]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!window.electronAPI) return;
    window.electronAPI.getNote().then(setNote);
    window.electronAPI.getPlugins().then(loadedPlugins => {
      setPlugins(loadedPlugins);

      // Registrar os plugins novos nas configurações se não existirem
      const currentSettings = settingsRef.current;
      const newWidgets = { ...currentSettings.widgets };
      const newOrder = [...currentSettings.widgetOrder];
      let updated = false;

      loadedPlugins.forEach(p => {
        if (!newWidgets[p.id]) {
          newWidgets[p.id] = { id: p.id, enabled: true, size: 'small', isPlugin: true, name: p.name };
          newOrder.push(p.id);
          updated = true;
        }
      });

      if (updated) {
        updateSettingsRef.current({ widgets: newWidgets, widgetOrder: newOrder });
      }
    });
  }, []);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    noteChangedByUser.current = true;
    setNote(newContent);
    window.electronAPI?.saveNote(newContent);
  };

  // Migra a chave do Gemini que ficava em texto puro no localStorage
  // para o armazenamento criptografado do processo main.
  useEffect(() => {
    const legacyKey = settings.geminiApiKey;
    if (!legacyKey || !window.electronAPI) return;
    window.electronAPI.ai.setKey(legacyKey)
      .then(() => updateSettingsRef.current({ geminiApiKey: undefined }))
      .catch(err => console.error('Falha ao migrar a chave do Gemini:', err));
  }, [settings.geminiApiKey]);

  // Nuvem: ao entrar (ou ao abrir já logado), oferece restaurar se o backup for mais novo.
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    import('./firebase/sync').then(sync => {
      if (cancelled) return;
      unsubscribe = sync.watchUser(async user => {
        sync.setSyncEnabled(false);
        if (!user || !window.electronAPI) return;

        const backup = await sync.checkForNewerBackup(user);
        if (backup) {
          const when = new Date(backup.lastSync).toLocaleString('pt-BR');
          const restore = window.confirm(
            `Existe um backup na nuvem de ${when}, mais novo que os dados deste PC.\n\n` +
            'OK = restaurar a nota e as tarefas da nuvem (substitui as deste PC).\n' +
            'Cancelar = manter os dados deste PC (eles vão substituir a nuvem na próxima alteração).'
          );
          sync.markSynced(user, backup.lastSync);
          if (restore) {
            if (typeof backup.note === 'string') await window.electronAPI.saveNote(backup.note);
            if (Array.isArray(backup.tasks)) await window.electronAPI.replaceTasks(backup.tasks);
            window.location.reload();
            return;
          }
        }
        sync.setSyncEnabled(true);
      });
    }).catch(err => console.log('Firebase não configurado:', err));

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  // Envia a nota para a nuvem 2s depois de parar de digitar (só mudanças feitas pelo usuário).
  useEffect(() => {
    if (!noteChangedByUser.current) return;
    const timer = setTimeout(() => {
      import('./firebase/sync')
        .then(module => module.syncNoteToCloud(note))
        .catch(err => console.log('Firebase não configurado ou erro:', err));
    }, 2000);

    return () => clearTimeout(timer);
  }, [note]);

  const getGridClasses = (id: string) => {
    const size = settings.widgets[id]?.size || 'small';
    if (size === 'medium') return 'md:col-span-2 md:row-span-1';
    if (size === 'large') return 'md:col-span-2 lg:col-span-3 md:row-span-2';
    return 'col-span-1 row-span-1';
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = settings.widgetOrder.indexOf(active.id as string);
      const newIndex = settings.widgetOrder.indexOf(over.id as string);
      reorderWidgets(arrayMove(settings.widgetOrder, oldIndex, newIndex));
    }
  };

  const WIDGET_MAP: Record<string, React.ReactNode> = {
    scratchpad: (
      <div className="orbit-card p-4 flex flex-col h-full max-h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-100 tracking-wide">Scratchpad</h2>
            <span className="text-[10px] text-slate-400 font-medium bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.04]">
              Salvo local
            </span>
          </div>
          <button 
            type="button"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
            title="Expandir"
            aria-label="Expandir nota"
          >
            <Maximize2 size={14} />
          </button>
        </div>
        <textarea
          className="flex-1 w-full bg-black/25 rounded-xl p-3 text-slate-200 placeholder-slate-500 resize-none outline-none border border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all custom-scrollbar font-sans text-sm leading-relaxed"
          placeholder="Digite algo rapidamente..."
          value={note}
          onChange={handleNoteChange}
          spellCheck="false"
        />
      </div>
    ),
    links: <LinksWidget />,
    files: <FilesWidget />,
    kanban: <KanbanWidget />,
    pomodoro: <PomodoroWidget />,
    weather: <ClockWeatherWidget />,
    habits: <HabitsWidget />,
    ai: <AIAssistantWidget />,
    music: <MusicWidget />
  };

  // Injetar plugins no WIDGET_MAP
  plugins.forEach(p => {
    WIDGET_MAP[p.id] = <PluginFrame plugin={p} />;
  });

  return (
    <div className="h-screen flex flex-col font-sans select-none bg-app transition-colors duration-300">
      {/* Title Bar (Draggable com Estética Glass Desktop) */}
      <header 
        className="h-11 flex items-center pl-4 pr-[140px] justify-between border-b border-border bg-widget/40 backdrop-blur-md select-none drag-region" 
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center shadow-sm shadow-accent/20">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-wider uppercase text-slate-200">Orbit</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.05] text-slate-400 border border-white/[0.05] font-mono">v4.0.0</span>
        </div>

        <div className="no-drag-region flex items-center gap-1.5" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {settings.showSupportButton && (
            <button 
              onClick={() => setIsSupportOpen(true)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
              title="Apoie o Orbit"
              aria-label="Apoie o Orbit"
            >
              <Heart size={15} className="fill-rose-400/40" />
            </button>
          )}
          <button 
            onClick={() => {
              window.electronAPI?.toggleFullscreen();
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
            title="Tela Cheia"
            aria-label="Alternar tela cheia"
          >
            <Expand size={15} />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
            title="Configurações"
            aria-label="Abrir configurações"
          >
            <Settings size={15} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[400px]">
            <SortableContext
              items={settings.widgetOrder}
              strategy={rectSortingStrategy}
            >
              {settings.widgetOrder.map(id => {
                if (!settings.widgets[id]?.enabled) return null;
                return (
                  <SortableWidget key={id} id={id} gridClasses={getGridClasses(id)}>
                    {WIDGET_MAP[id]}
                  </SortableWidget>
                );
              })}
            </SortableContext>
          </div>
        </DndContext>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      <SupportModal 
        isOpen={isSupportOpen} 
        onClose={() => setIsSupportOpen(false)} 
      />
    </div>
  );
}

export default App;
