import { getMainWindow } from '../window';
import type { DataTopic } from '../../shared/models';

/** Avisa a tela que os dados de uma área mudaram, para os widgets recarregarem. */
export function notifyChanged(topic: DataTopic) {
  const win = getMainWindow();
  if (win && !win.isDestroyed()) win.webContents.send('data-changed', topic);
}
