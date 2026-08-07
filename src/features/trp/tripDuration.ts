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

export function formatDday(startDate: string, endDate: string): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  const daysUntilStart = Math.round((start.getTime() - today.getTime()) / 86_400_000);
  if (daysUntilStart > 0) return `D-${daysUntilStart}`;
  if (daysUntilStart === 0) return "D-DAY";
  if (today.getTime() <= end.getTime()) return "여행 중";
  return null;
}

const ACCENT_COLORS = ["bg-sky-200", "bg-amber-200", "bg-emerald-200", "bg-rose-200", "bg-cyan-200"];

export function getTripAccentColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return ACCENT_COLORS[hash % ACCENT_COLORS.length];
}
