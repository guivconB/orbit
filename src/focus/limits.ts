// Limites de duração do Pomodoro (minutos). Arquivo separado do FocusContext
// para o recarregamento rápido do Vite funcionar (componentes e constantes em arquivos diferentes).
export const MIN_MINUTES = 1;
export const MAX_MINUTES = 180;

export const clampMinutes = (m: number) => Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(m)));
