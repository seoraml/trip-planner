import { PLACE_CATEGORY_HEX } from "@/features/plc/placeCategoryStyles";
import type { LatLng, MapMarker, MapProvider, PlaceSearchResult } from "./MapProvider";
import { loadGoogleMaps } from "./loadGoogleMaps";

const DEFAULT_MARKER_COLOR = "#2563EB"; // primary
const SELECTED_STROKE_COLOR = "#14B8A6"; // accent

export function createGoogleMapProvider(apiKey: string): MapProvider {
  let map: google.maps.Map | null = null;
  let markers: google.maps.Marker[] = [];
  let polyline: google.maps.Polyline | null = null;
  let placesService: google.maps.places.PlacesService | null = null;
  let clickListener: google.maps.MapsEventListener | null = null;
  let markerClickHandler: ((markerId: string) => void) | null = null;

  const markerIcon = (m: MapMarker): google.maps.Symbol => ({
    path: google.maps.SymbolPath.CIRCLE,
    scale: m.selected ? 15 : 12,
    fillColor: m.category ? PLACE_CATEGORY_HEX[m.category] : DEFAULT_MARKER_COLOR,
    fillOpacity: 1,
    strokeColor: m.selected ? SELECTED_STROKE_COLOR : "#ffffff",
    strokeWeight: m.selected ? 3 : 2,
  });

  const markerLabel = (m: MapMarker): google.maps.MarkerLabel | undefined =>
    m.order
      ? { text: String(m.order), color: "#ffffff", fontSize: "12px", fontWeight: "700" }
      : undefined;

  return {
    async init(container, opts) {
      await loadGoogleMaps(apiKey);
      map = new google.maps.Map(container, {
        center: opts.center,
        zoom: opts.zoom,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        zoomControl: true,
      });
      placesService = new google.maps.places.PlacesService(map);
    },

    searchPlace(query: string): Promise<PlaceSearchResult[]> {
      if (!placesService) return Promise.resolve([]);
      const service = placesService;
      return new Promise((resolve, reject) => {
        service.textSearch({ query }, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(
              results
                .filter((place) => place.geometry?.location)
                .map((place) => ({
                  name: place.name ?? query,
                  address: place.formatted_address,
                  position: {
                    lat: place.geometry!.location!.lat(),
                    lng: place.geometry!.location!.lng(),
                  },
                }))
            );
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {
            reject(new Error(`장소 검색에 실패했습니다. (status: ${status})`));
          }
        });
      });
    },

    renderMarkers(newMarkers: MapMarker[]) {
      markers.forEach((marker) => marker.setMap(null));
      if (!map) {
        markers = [];
        return;
      }
      const activeMap = map;
      markers = newMarkers.map((m) => {
        const marker = new google.maps.Marker({
          position: m.position,
          map: activeMap,
          title: m.label,
          icon: markerIcon(m),
          label: markerLabel(m),
          zIndex: m.selected ? 999 : undefined,
        });
        marker.addListener("click", () => markerClickHandler?.(m.id));
        return marker;
      });
    },

    clearMarkers() {
      markers.forEach((marker) => marker.setMap(null));
      markers = [];
    },

    onMarkerClick(handler: (markerId: string) => void) {
      markerClickHandler = handler;
      return () => {
        markerClickHandler = null;
      };
    },

    renderPolyline(points: LatLng[]) {
      polyline?.setMap(null);
      polyline = null;
      if (!map || points.length < 2) return;
      polyline = new google.maps.Polyline({
        path: points,
        strokeColor: "#2563EB",
        strokeOpacity: 0.8,
        strokeWeight: 4,
      });
      polyline.setMap(map);
    },

    clearPolyline() {
      polyline?.setMap(null);
      polyline = null;
    },

    onMapClick(handler: (pos: LatLng) => void) {
      if (!map) return () => {};
      clickListener = map.addListener("click", (event: google.maps.MapMouseEvent) => {
        if (!event.latLng) return;
        handler({ lat: event.latLng.lat(), lng: event.latLng.lng() });
      });
      return () => {
        clickListener?.remove();
      };
    },

    panTo(pos: LatLng) {
      map?.panTo(pos);
    },

    destroy() {
      markers.forEach((marker) => marker.setMap(null));
      markers = [];
      polyline?.setMap(null);
      polyline = null;
      clickListener?.remove();
      markerClickHandler = null;
      map = null;
      placesService = null;
    },
  };
}
