import type { PlaceCategory } from "@/types/domain";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapMarker {
  id: string;
  position: LatLng;
  label?: string;
  category?: PlaceCategory;
  selected?: boolean;
  order?: number; // 1-indexed visit order within the day, shown on the marker
}

export interface PlaceSearchResult {
  name: string;
  address?: string;
  position: LatLng;
}

export type TravelMode = "WALKING" | "DRIVING";

export interface RouteLeg {
  durationText: string;
  distanceText: string;
}

export interface RouteResult {
  // legs[i] = travel from points[i] to points[i+1]; null when no route exists
  // between those two points (e.g. across an ocean) — that leg is just
  // skipped rather than failing the whole day's route.
  legs: (RouteLeg | null)[];
}

export interface MapProvider {
  init(container: HTMLElement, opts: { center: LatLng; zoom: number }): Promise<void>;
  searchPlace(query: string): Promise<PlaceSearchResult[]>;
  renderMarkers(markers: MapMarker[]): void;
  clearMarkers(): void;
  onMarkerClick(handler: (markerId: string) => void): () => void;
  renderRoute(points: LatLng[], mode: TravelMode): Promise<RouteResult | null>; // null if <2 points
  clearRoute(): void;
  onMapClick(handler: (pos: LatLng) => void): () => void;
  panTo(pos: LatLng, zoom?: number): void;
  renderCurrentLocation(pos: LatLng | null): void; // null clears it, never persisted anywhere
  destroy(): void;
}
