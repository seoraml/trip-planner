import { CalendarDays, ListChecks, MapPin, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Trip } from "@/types/domain";
import { formatDateRange } from "./formatDateRange";
import { formatTripDuration, getTripAccentColor } from "./tripDuration";

interface Props {
  trip: Trip;
  itemCount?: number;
  onDelete: (trip: Trip) => void;
}

export function TripCard({ trip, itemCount, onDelete }: Props) {
  return (
    <Link to={`/trip/${trip.shareSlug}`} className="block animate-in fade-in slide-in-from-bottom-1 duration-300">
      <Card
        size="sm"
        className="h-full gap-0 py-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      >
        <div className={`h-20 w-full ${getTripAccentColor(trip.country)}`} />
        <CardHeader className="pt-4">
          <CardTitle className="text-base">{trip.title}</CardTitle>
          <CardDescription className="flex items-center gap-1">
            <MapPin className="size-3.5" />
            {trip.country} · {trip.city}
          </CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="여행 삭제"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDelete(trip);
              }}
            >
              <Trash2 className="text-slate-400" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-1 pb-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3.5" />
            {formatDateRange(trip.startDate, trip.endDate)} · {formatTripDuration(trip.startDate, trip.endDate)}
          </span>
          {typeof itemCount === "number" && itemCount > 0 && (
            <span className="flex items-center gap-1">
              <ListChecks className="size-3.5" />
              일정 {itemCount}개
            </span>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
