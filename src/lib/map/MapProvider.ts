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
}

export interface PlaceSearchResult {
  name: string;
  address?: string;
  position: LatLng;
}

export interface MapProvider {
  init(container: HTMLElement, opts: { center: LatLng; zoom: number }): Promise<void>;
  searchPlace(query: string): Promise<PlaceSearchResult[]>;
  renderMarkers(markers: MapMarker[]): void;
  clearMarkers(): void;
  onMarkerClick(handler: (markerId: string) => void): () => void;
  renderPolyline(points: LatLng[]): void; // naive point-to-point line, not real routing
  clearPolyline(): void;
  onMapClick(handler: (pos: LatLng) => void): () => void;
  panTo(pos: LatLng): void;
  destroy(): void;
}
