// Data local no formato YYYY-MM-DD.
// Não use toISOString() para isso: ele converte para UTC e,
// no Brasil, depois das 21h já devolve o dia seguinte.
export function localDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Últimos `count` dias, do mais antigo para hoje.
export function lastDays(count: number, from: Date = new Date()): string[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(from);
    d.setDate(from.getDate() - (count - 1 - i));
    return localDate(d);
  });
}
