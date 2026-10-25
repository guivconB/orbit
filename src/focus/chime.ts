// Som curto de fim de ciclo, gerado pelo Web Audio (sem arquivo de áudio).

let ctx: AudioContext | null = null;

export function playChime() {
  try {
    ctx ??= new AudioContext();
    const now = ctx.currentTime;
    // Duas notas suaves subindo (Mi → Lá)
    [659.25, 880].forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.18;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(start);
      osc.stop(start + 0.65);
    });
  } catch {
    // sem áudio disponível: a notificação do Windows já avisa
  }
}
