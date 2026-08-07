import { useEffect, useState } from "react";
import type { Trip } from "@/types/domain";
import { useCurrentUserId } from "@/lib/auth";
import { getItineraryItemCounts } from "@/features/itn/itineraryService";
import { deleteTrip, getTripsByOwner } from "./tripService";

export function useMyTrips() {
  const userId = useCurrentUserId();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setStatus("loading");

    getTripsByOwner(userId)
      .then(async (result) => {
        if (cancelled) return;
        setTrips(result);
        setStatus("ready");
        // Best-effort: card badge, not worth failing the whole list over.
        try {
          const counts = await getItineraryItemCounts(result.map((trip) => trip.id));
          if (!cancelled) setItemCounts(counts);
        } catch {
          // leave itemCounts empty — cards just omit the badge
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "여행 목록을 불러오지 못했습니다.");
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function removeTrip(tripId: string): Promise<void> {
    await deleteTrip(tripId);
    setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
  }

  return { trips, itemCounts, status, error, removeTrip };
}
