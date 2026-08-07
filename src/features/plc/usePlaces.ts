import { useCallback, useEffect, useState } from "react";
import type { Place } from "@/types/domain";
import { createPlace, getPlacesByTrip, type NewPlaceInput } from "./placeService";

export function usePlaces(tripId: string | undefined) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!tripId) return;
    setStatus("loading");
    try {
      const data = await getPlacesByTrip(tripId);
      setPlaces(data);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "장소를 불러오지 못했습니다.");
    }
  }, [tripId]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function addPlace(input: Omit<NewPlaceInput, "tripId">): Promise<Place> {
    if (!tripId) throw new Error("여행 정보가 없습니다.");
    const place = await createPlace({ ...input, tripId });
    setPlaces((prev) => [...prev, place]);
    return place;
  }

  return { places, status, error, addPlace };
}
