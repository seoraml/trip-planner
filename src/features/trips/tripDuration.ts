export function getTripDuration(startDate: string, endDate: string): { nights: number; days: number } {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  return { nights: Math.max(days - 1, 0), days };
}

export function formatTripDuration(startDate: string, endDate: string): string {
  const { nights, days } = getTripDuration(startDate, endDate);
  return nights > 0 ? `${nights}박 ${days}일` : "당일치기";
}

const ACCENT_COLORS = ["bg-sky-200", "bg-amber-200", "bg-emerald-200", "bg-rose-200", "bg-cyan-200"];

export function getTripAccentColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return ACCENT_COLORS[hash % ACCENT_COLORS.length];
}
