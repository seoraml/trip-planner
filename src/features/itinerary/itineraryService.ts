import { supabase } from "@/lib/supabase";
import type { ItineraryItem } from "@/types/domain";

interface ItineraryItemRow {
  id: string;
  trip_id: string;
  place_id: string;
  date: string;
  time: string | null;
  memo: string | null;
  sort_order: number;
  created_at: string;
}

function mapRowToItem(row: ItineraryItemRow): ItineraryItem {
  return {
    id: row.id,
    tripId: row.trip_id,
    placeId: row.place_id,
    date: row.date,
    time: row.time ?? undefined,
    memo: row.memo ?? undefined,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export async function getItineraryItems(tripId: string): Promise<ItineraryItem[]> {
  const { data, error } = await supabase
    .from("itinerary_items")
    .select()
    .eq("trip_id", tripId)
    .order("date", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data as ItineraryItemRow[]).map(mapRowToItem);
}

export interface NewItineraryItemInput {
  tripId: string;
  placeId: string;
  date: string;
  time?: string;
  memo?: string;
  sortOrder: number;
}

export async function createItineraryItem(input: NewItineraryItemInput): Promise<ItineraryItem> {
  const { data, error } = await supabase
    .from("itinerary_items")
    .insert({
      trip_id: input.tripId,
      place_id: input.placeId,
      date: input.date,
      time: input.time || null,
      memo: input.memo?.trim() || null,
      sort_order: input.sortOrder,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRowToItem(data as ItineraryItemRow);
}

// Item counts per trip, for display (e.g. trip list cards) — not a full
// itinerary fetch, just a lightweight aggregate.
export async function getItineraryItemCounts(tripIds: string[]): Promise<Record<string, number>> {
  if (tripIds.length === 0) return {};

  const { data, error } = await supabase
    .from("itinerary_items")
    .select("trip_id")
    .in("trip_id", tripIds);

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data as { trip_id: string }[]) {
    counts[row.trip_id] = (counts[row.trip_id] ?? 0) + 1;
  }
  return counts;
}

export interface ItineraryItemEdits {
  time?: string;
  memo?: string;
}

export async function updateItineraryItem(
  itemId: string,
  edits: ItineraryItemEdits
): Promise<ItineraryItem> {
  const { data, error } = await supabase
    .from("itinerary_items")
    .update({
      time: edits.time || null,
      memo: edits.memo?.trim() || null,
    })
    .eq("id", itemId)
    .select()
    .single();

  if (error) throw error;
  return mapRowToItem(data as ItineraryItemRow);
}

export async function deleteItineraryItem(itemId: string): Promise<void> {
  const { error } = await supabase.from("itinerary_items").delete().eq("id", itemId);
  if (error) throw error;
}

export async function updateItemsSortOrder(
  items: { id: string; sortOrder: number }[]
): Promise<void> {
  const results = await Promise.all(
    items.map((item) =>
      supabase.from("itinerary_items").update({ sort_order: item.sortOrder }).eq("id", item.id)
    )
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
}
