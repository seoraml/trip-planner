import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, MapPin, Pencil, Share2, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuthState } from "@/lib/auth";
import { createGoogleMapProvider } from "@/lib/map/googleMapProvider";
import { isGoogleMapsConfigured, googleMapsApiKey } from "@/lib/map/googleConfig";
import type { MapMarker, MapProvider, PlaceSearchResult, RouteLeg, TravelMode } from "@/lib/map/MapProvider";
import { usePlaces } from "@/features/plc/usePlaces";
import { MapView } from "@/features/plc/MapView";
import { PlaceSearchPanel } from "@/features/plc/PlaceSearchPanel";
import { ItineraryPanel } from "@/features/itn/ItineraryPanel";
import { EditItineraryItemDialog } from "@/features/itn/EditItineraryItemDialog";
import { useItinerary } from "@/features/itn/useItinerary";
import { BudgetPanel } from "@/features/bgt/BudgetPanel";
import { useTrip } from "./useTrip";
import { formatDateRange } from "./formatDateRange";
import { formatTripDuration } from "./tripDuration";
import { deleteTrip } from "./tripService";
import { ShareDialog } from "./ShareDialog";
import { TripEditDialog } from "./TripEditDialog";
import { AccountMenu } from "@/features/usr/AccountMenu";

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }; // 서울시청, 장소가 없을 때 기본 중심

export function TripDetailPage() {
  const { shareSlug } = useParams<{ shareSlug: string }>();
  const navigate = useNavigate();
  const {
    trip,
    status: tripStatus,
    error: tripError,
    editTrip,
    changeThumbnail,
    removeThumbnail,
    setLinkEditable,
  } = useTrip(shareSlug);
  const { userId: currentUserId, isAnonymous } = useAuthState();

  const { places, status: placesStatus, error: placesError, addPlace } = usePlaces(trip?.id);
  const {
    days,
    status: itineraryStatus,
    error: itineraryError,
    addItem,
    editItem,
    removeItem,
    reorderDay,
  } = useItinerary(trip);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isEditTripOpen, setIsEditTripOpen] = useState(false);
  const [isDeletingTrip, setIsDeletingTrip] = useState(false);
  const [activeTab, setActiveTab] = useState<"itinerary" | "budget">("itinerary");
  const [mapReady, setMapReady] = useState(false);
  const [travelModeByDate, setTravelModeByDate] = useState<Record<string, TravelMode>>({});
  const [routeLegs, setRouteLegs] = useState<RouteLeg[]>([]);
  const [routeError, setRouteError] = useState<string | null>(null);

  const [provider] = useState<MapProvider | null>(() =>
    isGoogleMapsConfigured ? createGoogleMapProvider(googleMapsApiKey) : null
  );

  const isOwner = !!trip && !!currentUserId && trip.ownerId === currentUserId;
  const canEditContent = isOwner || (!!trip?.linkEditable && !isAnonymous);
  const readOnly = !canEditContent;

  const placesById = useMemo(() => new Map(places.map((place) => [place.id, place])), [places]);
  const activeDate = selectedDate ?? days[0]?.date ?? null;
  const activeDay = days.find((day) => day.date === activeDate);
  const travelMode: TravelMode = (activeDate && travelModeByDate[activeDate]) || "WALKING";

  const selectedPlaceId = useMemo(() => {
    const item = activeDay?.items.find((i) => i.id === selectedItemId);
    return item?.placeId ?? null;
  }, [activeDay, selectedItemId]);

  const markers: MapMarker[] = useMemo(() => {
    if (!activeDay) return [];
    return activeDay.items
      .flatMap((item) => {
        const place = placesById.get(item.placeId);
        if (!place) return [];
        const marker: MapMarker = {
          id: place.id,
          position: { lat: place.lat, lng: place.lng },
          label: place.name,
          category: place.category,
          selected: place.id === selectedPlaceId,
        };
        return [marker];
      })
      .map((marker, index) => ({ ...marker, order: index + 1 }));
  }, [activeDay, placesById, selectedPlaceId]);

  const firstPlace = places[0];
  const mapCenter =
    markers[0]?.position ?? (firstPlace ? { lat: firstPlace.lat, lng: firstPlace.lng } : DEFAULT_CENTER);

  useEffect(() => {
    if (!mapReady || !provider) return;
    provider.renderMarkers(markers);
    setRouteError(null);
    provider
      .renderRoute(
        markers.map((marker) => marker.position),
        travelMode
      )
      .then((result) => setRouteLegs(result?.legs ?? []))
      .catch(() => {
        setRouteLegs([]);
        setRouteError("이동 경로를 불러오지 못했습니다.");
      });
  }, [mapReady, provider, markers, travelMode]);

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    setSelectedItemId(null);
  }

  function handleChangeTravelMode(mode: TravelMode) {
    if (!activeDate) return;
    setTravelModeByDate((prev) => ({ ...prev, [activeDate]: mode }));
  }

  function handleSelectItem(itemId: string) {
    setSelectedItemId(itemId);
    const item = activeDay?.items.find((i) => i.id === itemId);
    const place = item ? placesById.get(item.placeId) : undefined;
    if (place) provider?.panTo({ lat: place.lat, lng: place.lng });
  }

  useEffect(() => {
    if (!provider) return;
    return provider.onMarkerClick((markerId) => {
      const item = activeDay?.items.find((i) => i.placeId === markerId);
      if (item) setSelectedItemId(item.id);
    });
  }, [provider, activeDay]);

  async function handleSearchSelect(result: PlaceSearchResult) {
    if (!activeDate) return;
    setSearchNotice(null);
    try {
      const place = await addPlace({
        name: result.name,
        category: "기타",
        lat: result.position.lat,
        lng: result.position.lng,
        address: result.address,
      });
      await addItem({ placeId: place.id, date: activeDate });
      const dayNumber = activeDay?.dayNumber;
      setSearchNotice(
        `"${result.name}"을(를) ${dayNumber ? `Day ${dayNumber} ` : ""}일정에 추가했습니다.`
      );
    } catch (err) {
      setSearchNotice(err instanceof Error ? err.message : "장소를 추가하지 못했습니다.");
    }
  }

  const editingItem = activeDay?.items.find((item) => item.id === editingItemId) ?? null;

  function handleDeleteItem(itemId: string) {
    if (itemId === selectedItemId) setSelectedItemId(null);
    removeItem(itemId).catch(() => {
      window.alert("일정을 삭제하지 못했습니다. 다시 시도해주세요.");
    });
  }

  async function handleDeleteTrip() {
    if (!trip) return;
    if (!window.confirm(`"${trip.title}" 여행을 삭제할까요? 장소와 일정도 모두 함께 삭제됩니다.`)) {
      return;
    }
    setIsDeletingTrip(true);
    try {
      await deleteTrip(trip.id);
      navigate("/");
    } catch {
      window.alert("여행을 삭제하지 못했습니다. 다시 시도해주세요.");
      setIsDeletingTrip(false);
    }
  }

  if (tripStatus === "loading") {
    return <main className="p-6 text-muted-foreground">여행 정보를 불러오는 중...</main>;
  }
  if (tripStatus === "not-found") {
    return <main className="p-6 text-muted-foreground">존재하지 않는 여행입니다.</main>;
  }
  if (tripStatus === "error" || !trip) {
    return <main className="p-6 text-destructive">{tripError ?? "여행 정보를 불러오지 못했습니다."}</main>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/60 bg-card/70 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />trip-planner
          </Link>
          <AccountMenu />
        </div>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {trip.title}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {trip.country} · {trip.city}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                {formatDateRange(trip.startDate, trip.endDate)} ·{" "}
                {formatTripDuration(trip.startDate, trip.endDate)}
              </span>
            </p>
            {trip.description && <p className="mt-2 text-sm text-foreground/80">{trip.description}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsShareOpen(true)}>
              <Share2 />
              공유
            </Button>
            {isOwner && (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditTripOpen(true)}>
                  <Pencil />
                  수정
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteTrip}
                  disabled={isDeletingTrip}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 />
                  {isDeletingTrip ? "삭제 중..." : "삭제"}
                </Button>
              </>
            )}
          </div>
        </div>
        {readOnly && (
          <p className="mt-3 w-fit rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
            읽기 전용으로 보고 있습니다 · 이 여행을 만든 사람만 일정을 수정할 수 있습니다
          </p>
        )}
        {canEditContent && !isOwner && (
          <p className="mt-3 w-fit rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
            공유받아 편집하고 있습니다 · 여행 삭제와 기본 정보 수정은 만든 사람만 가능합니다
          </p>
        )}
      </header>

      <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
        <div className="order-1 h-72 shrink-0 lg:order-2 lg:h-auto lg:flex-1">
          <MapView provider={provider} center={mapCenter} onReady={() => setMapReady(true)} />
        </div>

        <section className="order-2 flex flex-col gap-4 overflow-y-auto p-4 sm:p-6 lg:order-1 lg:w-[420px] lg:shrink-0 lg:border-r lg:border-border/60">
          <div className="flex gap-0.5 rounded-[10px] bg-muted p-0.5">
            {(
              [
                ["itinerary", "일정"],
                ["budget", "예산"],
              ] as const
            ).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={
                  "flex-1 rounded-[8px] px-3 py-1.5 text-sm font-medium transition-colors " +
                  (tab === activeTab
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "itinerary" ? (
            <>
              {itineraryStatus === "error" && <p className="text-sm text-destructive">{itineraryError}</p>}
              {placesStatus === "error" && <p className="text-sm text-destructive">{placesError}</p>}
              {!readOnly && (
                <>
                  <PlaceSearchPanel provider={provider} onSelect={handleSearchSelect} />
                  {searchNotice && <p className="text-sm text-accent">{searchNotice}</p>}
                </>
              )}
              <ItineraryPanel
                days={days}
                places={places}
                status={itineraryStatus}
                error={itineraryError}
                readOnly={readOnly}
                selectedDate={activeDate}
                onSelectDate={handleSelectDate}
                selectedItemId={selectedItemId}
                onSelectItem={handleSelectItem}
                onEditItem={setEditingItemId}
                onDeleteItem={handleDeleteItem}
                onAddPlace={addPlace}
                onAddItem={addItem}
                onReorderDay={reorderDay}
                travelMode={travelMode}
                onChangeTravelMode={handleChangeTravelMode}
                routeLegs={routeLegs}
                routeError={routeError}
              />
            </>
          ) : (
            <BudgetPanel tripId={trip.id} readOnly={readOnly} />
          )}
        </section>
      </div>

      <ShareDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        url={typeof window !== "undefined" ? window.location.href : ""}
        tripTitle={trip.title}
        isOwner={isOwner}
        linkEditable={trip.linkEditable}
        onToggleLinkEditable={setLinkEditable}
      />

      <TripEditDialog
        trip={trip}
        open={isEditTripOpen}
        onOpenChange={setIsEditTripOpen}
        onSubmit={editTrip}
        onChangeThumbnail={changeThumbnail}
        onRemoveThumbnail={removeThumbnail}
      />

      {editingItem && (
        <EditItineraryItemDialog
          item={editingItem}
          place={placesById.get(editingItem.placeId)}
          open={!!editingItemId}
          onOpenChange={(open) => {
            if (!open) setEditingItemId(null);
          }}
          onSubmit={(edits) => editItem(editingItem.id, edits)}
        />
      )}
    </div>
  );
}
