import { registerAiHandlers } from './ai';
import { registerFilesHandlers } from './files';
import { registerHabitsHandlers } from './habits';
import { registerLinksHandlers } from './links';
import { registerNotesHandlers } from './notes';
import { registerPluginsHandlers } from './plugins';
import { registerPreferencesHandlers } from './preferences';
import { registerTasksHandlers } from './tasks';
import { registerUiHandlers } from './ui';

export function registerIpcHandlers() {
  registerUiHandlers();
  registerPreferencesHandlers();
  registerAiHandlers();
  registerNotesHandlers();
  registerLinksHandlers();
  registerFilesHandlers();
  registerTasksHandlers();
  registerHabitsHandlers();
  registerPluginsHandlers();
}
