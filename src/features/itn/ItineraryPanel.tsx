import { Car, Footprints } from "lucide-react";
import type { ItineraryItem, Place, TripDay } from "@/types/domain";
import type { NewPlaceInput } from "@/features/plc/placeService";
import type { RouteLeg, TravelMode } from "@/lib/map/MapProvider";
import type { NewItineraryItemInput } from "./itineraryService";
import { AddItineraryItemForm, type AddItineraryItemSubmit } from "./AddItineraryItemForm";
import { DayItineraryList } from "./DayItineraryList";
import { formatDayLabel, formatWeekday } from "./formatDayLabel";

interface Props {
  days: TripDay[];
  places: Place[];
  status: "loading" | "ready" | "error";
  error: string | null;
  readOnly: boolean;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  selectedItemId: string | null;
  onSelectItem: (itemId: string) => void;
  onEditItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onAddPlace: (input: Omit<NewPlaceInput, "tripId">) => Promise<Place>;
  onAddItem: (
    input: Omit<NewItineraryItemInput, "tripId" | "sortOrder">
  ) => Promise<ItineraryItem>;
  onReorderDay: (orderedItemIds: string[]) => void;
  travelMode: TravelMode;
  onChangeTravelMode: (mode: TravelMode) => void;
  routeLegs: RouteLeg[];
  routeError: string | null;
}

const TRAVEL_MODES: { mode: TravelMode; label: string; Icon: typeof Footprints }[] = [
  { mode: "WALKING", label: "도보", Icon: Footprints },
  { mode: "DRIVING", label: "차량", Icon: Car },
];

export function ItineraryPanel({
  days,
  places,
  status,
  error,
  readOnly,
  selectedDate,
  onSelectDate,
  selectedItemId,
  onSelectItem,
  onEditItem,
  onDeleteItem,
  onAddPlace,
  onAddItem,
  onReorderDay,
  travelMode,
  onChangeTravelMode,
  routeLegs,
  routeError,
}: Props) {
  const placesById = new Map(places.map((place) => [place.id, place]));
  const activeDate = selectedDate ?? days[0]?.date ?? null;
  const activeDay = days.find((day) => day.date === activeDate);

  async function handleAdd(input: AddItineraryItemSubmit) {
    if (!activeDate) return;
    let placeId = input.placeId;
    if (!placeId && input.newPlace) {
      const place = await onAddPlace(input.newPlace);
      placeId = place.id;
    }
    if (!placeId) throw new Error("장소를 선택하거나 새로 추가해주세요.");
    await onAddItem({ placeId, date: activeDate, time: input.time, memo: input.memo });
  }

  if (status === "loading" && days.every((day) => day.items.length === 0)) {
    return <p className="text-sm text-muted-foreground">일정을 불러오는 중...</p>;
  }
  if (status === "error") {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {days.map((day) => (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDate(day.date)}
              className={
                "flex shrink-0 flex-col items-center rounded-[10px] px-3 py-1.5 text-center transition-all duration-150 " +
                (day.date === activeDate
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted")
              }
            >
              <span className="text-xs font-medium opacity-80">Day {day.dayNumber}</span>
              <span className="text-sm font-semibold">
                {formatDayLabel(day.date)} ({formatWeekday(day.date)})
              </span>
            </button>
          ))}
        </div>

        <div className="flex shrink-0 gap-0.5 rounded-[10px] bg-muted p-0.5">
          {TRAVEL_MODES.map(({ mode, label, Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChangeTravelMode(mode)}
              className={
                "flex items-center gap-1 rounded-[8px] px-2 py-1 text-xs font-medium transition-colors " +
                (mode === travelMode
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeDay && (
        <DayItineraryList
          key={activeDay.date}
          items={activeDay.items}
          placesById={placesById}
          readOnly={readOnly}
          selectedItemId={selectedItemId}
          onSelectItem={onSelectItem}
          onEditItem={onEditItem}
          onDeleteItem={onDeleteItem}
          onReorder={onReorderDay}
          routeLegs={routeLegs}
        />
      )}
      {routeError && <p className="text-xs text-muted-foreground">{routeError}</p>}

      {!readOnly && <AddItineraryItemForm places={places} onSubmit={handleAdd} />}
    </div>
  );
}
