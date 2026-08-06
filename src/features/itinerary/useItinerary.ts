import { useCallback, useEffect, useMemo, useState } from "react";
import type { ItineraryItem, Trip } from "@/types/domain";
import { getTripDays } from "./getTripDays";
import {
  createItineraryItem,
  deleteItineraryItem,
  getItineraryItems,
  updateItemsSortOrder,
  updateItineraryItem,
  type ItineraryItemEdits,
  type NewItineraryItemInput,
} from "./itineraryService";

export function useItinerary(trip: Trip | null) {
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const tripId = trip?.id;

  const reload = useCallback(async () => {
    if (!tripId) return;
    setStatus("loading");
    try {
      const data = await getItineraryItems(tripId);
      setItems(data);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "일정을 불러오지 못했습니다.");
    }
  }, [tripId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const days = useMemo(() => (trip ? getTripDays(trip, items) : []), [trip, items]);

  async function addItem(
    input: Omit<NewItineraryItemInput, "tripId" | "sortOrder">
  ): Promise<ItineraryItem> {
    if (!tripId) throw new Error("여행 정보가 없습니다.");
    const itemsForDate = items.filter((item) => item.date === input.date);
    const nextSortOrder = itemsForDate.length
      ? Math.max(...itemsForDate.map((item) => item.sortOrder)) + 1
      : 0;
    const created = await createItineraryItem({ ...input, tripId, sortOrder: nextSortOrder });
    setItems((prev) => [...prev, created]);
    return created;
  }

  async function editItem(itemId: string, edits: ItineraryItemEdits): Promise<void> {
    const updated = await updateItineraryItem(itemId, edits);
    setItems((prev) => prev.map((item) => (item.id === itemId ? updated : item)));
  }

  async function removeItem(itemId: string): Promise<void> {
    await deleteItineraryItem(itemId);
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }

  async function reorderDay(orderedItemIds: string[]): Promise<void> {
    const updates = orderedItemIds.map((id, index) => ({ id, sortOrder: index }));
    setItems((prev) =>
      prev.map((item) => {
        const update = updates.find((u) => u.id === item.id);
        return update ? { ...item, sortOrder: update.sortOrder } : item;
      })
    );
    await updateItemsSortOrder(updates);
  }

  return { days, status, error, addItem, editItem, removeItem, reorderDay };
}
