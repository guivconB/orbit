import type { ComponentType } from 'react';
import type { BuiltinWidgetId } from './catalog';
import { ScratchpadWidget } from '../components/ScratchpadWidget';
import { LinksWidget } from '../components/LinksWidget';
import { FilesWidget } from '../components/FilesWidget';
import { KanbanWidget } from '../components/KanbanWidget';
import { PomodoroWidget } from '../components/PomodoroWidget';
import { ClockWeatherWidget } from '../components/ClockWeatherWidget';
import { HabitsWidget } from '../components/HabitsWidget';
import { AIAssistantWidget } from '../components/AIAssistantWidget';
import { MusicWidget } from '../components/MusicWidget';

// O `Record<BuiltinWidgetId, …>` faz o TypeScript reclamar se um widget do catálogo ficar sem componente.
export const WIDGET_COMPONENTS: Record<BuiltinWidgetId, ComponentType> = {
  scratchpad: ScratchpadWidget,
  links: LinksWidget,
  files: FilesWidget,
  kanban: KanbanWidget,
  pomodoro: PomodoroWidget,
  weather: ClockWeatherWidget,
  habits: HabitsWidget,
  ai: AIAssistantWidget,
  music: MusicWidget,
};
