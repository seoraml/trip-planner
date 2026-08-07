import { useEffect, useRef, useState } from "react";
import { Loader2, MapPinOff } from "lucide-react";
import type { LatLng, MapMarker, MapProvider } from "@/lib/map/MapProvider";

interface Props {
  provider: MapProvider | null;
  center: LatLng;
  markers: MapMarker[];
  polylinePoints: LatLng[];
}

export function MapView({ provider, center, markers, polylinePoints }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!provider || !containerRef.current) return;
    let cancelled = false;
    setStatus("loading");
    provider
      .init(containerRef.current, { center, zoom: 6 })
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setStatus("error");
          setError(err instanceof Error ? err.message : "지도를 불러오지 못했습니다.");
        }
      });
    return () => {
      cancelled = true;
    };
    // Only re-init when the provider instance itself changes, not on every
    // center/marker update — those are applied via renderMarkers/panTo below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider]);

  useEffect(() => {
    if (status !== "ready" || !provider) return;
    provider.renderMarkers(markers);
    provider.renderPolyline(polylinePoints);
  }, [status, provider, markers, polylinePoints]);

  if (!provider) {
    return (
      <div className="flex h-full min-h-64 flex-col items-center justify-center gap-2 bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        <MapPinOff className="size-6" />
        구글 지도 API 키가 설정되지 않았습니다.
        <span className="text-xs">.env.local에 VITE_GOOGLE_MAPS_API_KEY를 추가해주세요.</span>
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-64">
      <div ref={containerRef} className="h-full min-h-64 w-full" />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-background/70 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          지도를 불러오는 중...
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 p-4 text-center text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
