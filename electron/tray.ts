import { app, Menu, Tray, nativeImage } from 'electron';
import path from 'path';
import { getMainWindow, isDev, setQuitting, showWindow } from './window';

const DEFAULT_TOOLTIP = 'Orbit Dashboard';
let tray: Tray | null = null;

export function createTray() {
  const iconPath = path.join(__dirname, isDev ? '../public/orbit.jpg' : '../dist/orbit.jpg');
  let icon = nativeImage.createFromPath(iconPath);
  if (!icon.isEmpty()) icon = icon.resize({ width: 16, height: 16 });

  tray = new Tray(icon);
  tray.setToolTip(DEFAULT_TOOLTIP);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Abrir Painel', click: showWindow },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => {
        setQuitting();
        app.quit();
      },
    },
  ]));
  tray.on('click', () => {
    const win = getMainWindow();
    if (win?.isVisible()) win.hide();
    else showWindow();
  });
}

/** Texto ao passar o mouse no ícone da bandeja ('' volta ao padrão). */
export function setTrayTooltip(text: string) {
  tray?.setToolTip(text ? `${DEFAULT_TOOLTIP} — ${text}` : DEFAULT_TOOLTIP);
}
