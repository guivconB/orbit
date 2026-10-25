import type { ElectronAPI } from '../../shared/api';

declare global {
  interface Window {
    // Ausente quando o front roda fora do Electron (ex.: `vite` no navegador ou nos testes).
    electronAPI?: ElectronAPI;
  }
}

export {};
