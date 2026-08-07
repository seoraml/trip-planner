import { useEffect, useState } from "react";
import type { Trip } from "@/types/domain";
import type { TripFormValues } from "./tripFormValidation";
import { getTripByShareSlug, removeTripThumbnail, updateTrip, uploadTripThumbnail } from "./tripService";

export type TripLoadStatus = "loading" | "ready" | "not-found" | "error";

export function useTrip(shareSlug: string | undefined) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [status, setStatus] = useState<TripLoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareSlug) return;
    let cancelled = false;
    setStatus("loading");

    getTripByShareSlug(shareSlug)
      .then((result) => {
        if (cancelled) return;
        if (result) {
          setTrip(result);
          setStatus("ready");
        } else {
          setStatus("not-found");
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "여행 정보를 불러오지 못했습니다.");
      });

    return () => {
      cancelled = true;
    };
  }, [shareSlug]);

  async function editTrip(values: TripFormValues): Promise<void> {
    if (!trip) throw new Error("여행 정보가 없습니다.");
    const updated = await updateTrip(trip.id, values);
    setTrip(updated);
  }

  async function changeThumbnail(file: File): Promise<void> {
    if (!trip) throw new Error("여행 정보가 없습니다.");
    const updated = await uploadTripThumbnail(trip.id, file);
    setTrip(updated);
  }

  async function removeThumbnail(): Promise<void> {
    if (!trip) throw new Error("여행 정보가 없습니다.");
    const updated = await removeTripThumbnail(trip.id);
    setTrip(updated);
  }

  return { trip, status, error, editTrip, changeThumbnail, removeThumbnail };
}
