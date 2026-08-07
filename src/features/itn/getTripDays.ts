import type { ItineraryItem, Trip, TripDay } from "@/types/domain";

function addOneDay(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function getTripDays(
  trip: Pick<Trip, "startDate" | "endDate">,
  items: ItineraryItem[]
): TripDay[] {
  const days: TripDay[] = [];
  let current = trip.startDate;
  let dayNumber = 1;

  while (current <= trip.endDate) {
    days.push({
      date: current,
      dayNumber,
      items: items.filter((item) => item.date === current).sort((a, b) => a.sortOrder - b.sortOrder),
    });
    current = addOneDay(current);
    dayNumber += 1;
  }

  return days;
}
