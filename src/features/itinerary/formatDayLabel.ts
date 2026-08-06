export function formatDayLabel(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${Number(month)}.${Number(day)}`;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatWeekday(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return WEEKDAYS[date.getUTCDay()];
}
