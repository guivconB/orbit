import { app, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import type { OrbitPlugin } from '../../shared/models';

export function registerPluginsHandlers() {
  ipcMain.handle('get-plugins', () => {
    const pluginsDir = path.join(app.getPath('documents'), 'Orbit-Plugins');
    if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });

    const plugins: OrbitPlugin[] = [];
    for (const dir of fs.readdirSync(pluginsDir, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const indexPath = path.join(pluginsDir, dir.name, 'index.html');
      if (fs.existsSync(indexPath)) {
        plugins.push({ id: `plugin-${dir.name}`, name: dir.name, content: fs.readFileSync(indexPath, 'utf-8') });
      }
    }
    return plugins;
  });
}
