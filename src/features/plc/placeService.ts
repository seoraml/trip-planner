import { supabase } from "@/lib/supabase";
import type { Place, PlaceCategory } from "@/types/domain";

interface PlaceRow {
  id: string;
  trip_id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  category: string;
  memo: string | null;
  created_at: string;
}

function mapPlaceRowToPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    address: row.address ?? undefined,
    lat: row.lat,
    lng: row.lng,
    category: row.category as PlaceCategory,
    memo: row.memo ?? undefined,
    createdAt: row.created_at,
  };
}

export async function getPlacesByTrip(tripId: string): Promise<Place[]> {
  const { data, error } = await supabase
    .from("places")
    .select()
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as PlaceRow[]).map(mapPlaceRowToPlace);
}

export interface NewPlaceInput {
  tripId: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  category: PlaceCategory;
  memo?: string;
}

export async function createPlace(input: NewPlaceInput): Promise<Place> {
  const { data, error } = await supabase
    .from("places")
    .insert({
      trip_id: input.tripId,
      name: input.name.trim(),
      address: input.address?.trim() || null,
      lat: input.lat,
      lng: input.lng,
      category: input.category,
      memo: input.memo?.trim() || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapPlaceRowToPlace(data as PlaceRow);
}
