import { supabase } from "@/lib/supabase";
import { ensureAnonymousSession } from "@/lib/auth";
import type { Trip } from "@/types/domain";
import type { TripFormValues } from "./tripFormValidation";

interface TripRow {
  id: string;
  owner_id: string | null;
  title: string;
  country: string;
  city: string;
  start_date: string;
  end_date: string;
  description: string | null;
  thumbnail_url: string | null;
  is_public: boolean;
  share_slug: string;
  created_at: string;
  updated_at: string;
}

function mapTripRowToTrip(row: TripRow): Trip {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    country: row.country,
    city: row.city,
    startDate: row.start_date,
    endDate: row.end_date,
    description: row.description ?? undefined,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    isPublic: row.is_public,
    shareSlug: row.share_slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createTrip(values: TripFormValues): Promise<Trip> {
  const session = await ensureAnonymousSession();
  if (session.user.is_anonymous) {
    throw new Error("여행을 만들려면 먼저 Google로 로그인해주세요.");
  }

  const { data, error } = await supabase
    .from("trips")
    .insert({
      owner_id: session.user.id,
      title: values.title.trim(),
      country: values.country.trim(),
      city: values.city.trim(),
      start_date: values.startDate,
      end_date: values.endDate,
      description: values.description.trim() || null,
    })
    .select()
    .single();

  if (error) throw error;
  return mapTripRowToTrip(data as TripRow);
}

export async function getTripByShareSlug(shareSlug: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from("trips")
    .select()
    .eq("share_slug", shareSlug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapTripRowToTrip(data as TripRow);
}

export async function getTripsByOwner(ownerId: string): Promise<Trip[]> {
  const { data, error } = await supabase
    .from("trips")
    .select()
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as TripRow[]).map(mapTripRowToTrip);
}

export async function updateTrip(tripId: string, values: TripFormValues): Promise<Trip> {
  const { data, error } = await supabase
    .from("trips")
    .update({
      title: values.title.trim(),
      country: values.country.trim(),
      city: values.city.trim(),
      start_date: values.startDate,
      end_date: values.endDate,
      description: values.description.trim() || null,
    })
    .eq("id", tripId)
    .select()
    .single();

  if (error) throw error;
  return mapTripRowToTrip(data as TripRow);
}

export async function deleteTrip(tripId: string): Promise<void> {
  const { error } = await supabase.from("trips").delete().eq("id", tripId);
  if (error) throw error;
}

const THUMBNAIL_BUCKET = "trip-thumbnails";

function thumbnailPath(tripId: string): string {
  return `${tripId}/thumbnail`;
}

export async function uploadTripThumbnail(tripId: string, file: File): Promise<Trip> {
  const path = thumbnailPath(tripId);
  const { error: uploadError } = await supabase.storage
    .from(THUMBNAIL_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(THUMBNAIL_BUCKET).getPublicUrl(path);

  const { data, error } = await supabase
    .from("trips")
    .update({ thumbnail_url: publicUrl })
    .eq("id", tripId)
    .select()
    .single();

  if (error) throw error;
  return mapTripRowToTrip(data as TripRow);
}

export async function removeTripThumbnail(tripId: string): Promise<Trip> {
  const { error: removeError } = await supabase.storage
    .from(THUMBNAIL_BUCKET)
    .remove([thumbnailPath(tripId)]);
  if (removeError) throw removeError;

  const { data, error } = await supabase
    .from("trips")
    .update({ thumbnail_url: null })
    .eq("id", tripId)
    .select()
    .single();

  if (error) throw error;
  return mapTripRowToTrip(data as TripRow);
}
