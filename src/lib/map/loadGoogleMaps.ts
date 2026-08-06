let loadPromise: Promise<void> | null = null;

// Idempotent script loader — safe to call every time a MapProvider is
// initialized; the SDK script is only ever injected once.
export function loadGoogleMaps(apiKey: string): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve();
      return;
    }
    const callbackName = "__tripPlannerGoogleMapsLoaded";
    (window as unknown as Record<string, () => void>)[callbackName] = () => resolve();

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => reject(new Error("구글 지도 SDK를 불러오지 못했습니다."));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    loadPromise = null; // allow retry on next call
    throw error;
  });

  return loadPromise;
}
