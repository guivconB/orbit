import React, { useState, useEffect } from 'react';
import { Settings, Maximize2, Expand } from 'lucide-react';
import { LinksWidget } from './components/LinksWidget';
import { FilesWidget } from './components/FilesWidget';
import { KanbanWidget } from './components/KanbanWidget';
import { PomodoroWidget } from './components/PomodoroWidget';
import { ClockWeatherWidget } from './components/ClockWeatherWidget';
import { HabitsWidget } from './components/HabitsWidget';
import { SettingsModal } from './components/SettingsModal';
import { SortableWidget } from './components/SortableWidget';
import { useSettings } from './hooks/useSettings';
import clsx from 'clsx';
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

declare global {
  interface Window {
    electronAPI: {
      getNote: () => Promise<string>;
      saveNote: (content: string) => Promise<boolean>;
      getLinks: () => Promise<any[]>;
      addLink: (link: { title: string; url: string; category?: string }) => Promise<number>;
      deleteLink: (id: number) => Promise<boolean>;
      getFiles: () => Promise<any[]>;
      addFile: () => Promise<number | null>;
      deleteFile: (id: number) => Promise<boolean>;
      openFile: (path: string) => Promise<boolean>;
      getTasks: () => Promise<any[]>;
      addTask: (task: { title: string; status?: string }) => Promise<number>;
      updateTaskStatus: (id: number, status: string) => Promise<boolean>;
      deleteTask: (id: number) => Promise<boolean>;
      getHabits: () => Promise<any[]>;
      addHabit: (name: string) => Promise<number>;
      deleteHabit: (id: number) => Promise<boolean>;
      toggleHabitLog: (habitId: number, date: string) => Promise<boolean>;
      changeTheme?: (color: string) => void;
      showNotification?: (title: string, body: string) => void;
      toggleFullscreen?: () => void;
    };
  }
}

function App() {
  const [note, setNote] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsData = useSettings();
  const { settings, reorderWidgets } = settingsData;

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
    if (window.electronAPI) {
      window.electronAPI.getNote().then(setNote);
    }
  }, []);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
    if (window.electronAPI) {
      window.electronAPI.saveNote(e.target.value);
    }
  };

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
      <div className="bg-widget rounded-xl p-4 shadow-lg border border-border flex flex-col transition-all h-full max-h-full">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-200">Scratchpad</h2>
          <Maximize2 size={16} className="text-slate-400 hover:text-slate-200 cursor-pointer transition-colors" />
        </div>
        <textarea
          className="flex-1 w-full bg-app rounded-lg p-3 text-slate-300 resize-none outline-none focus:ring-2 focus:ring-indigo-500 custom-scrollbar"
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
    habits: <HabitsWidget />
  };

  return (
    <div className="h-screen flex flex-col font-sans select-none bg-app transition-colors duration-300">
      {/* Title Bar (Draggable) */}
      <div className="h-10 drag-region flex items-center pl-4 pr-[140px] justify-between border-b border-border bg-widget/30" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="text-sm font-semibold opacity-70">Orbit Dashboard</div>
        <div className="no-drag-region flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button 
            onClick={() => {
              if (window.electronAPI && window.electronAPI.toggleFullscreen) {
                window.electronAPI.toggleFullscreen();
              }
            }}
            className="p-1.5 rounded hover:bg-widget-hover text-slate-400 hover:text-white transition-colors"
            title="Tela Cheia"
          >
            <Expand size={14} />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded hover:bg-widget-hover text-slate-400 hover:text-white transition-colors"
            title="Configurações"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
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
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settingsData={settingsData} 
      />
    </div>
  );
}

export default App;
