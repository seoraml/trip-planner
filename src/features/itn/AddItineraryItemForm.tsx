import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PLACE_CATEGORIES } from "@/features/plc/placeCategories";
import type { Place, PlaceCategory } from "@/types/domain";

const NEW_PLACE_VALUE = "__new__";

export interface AddItineraryItemSubmit {
  placeId?: string;
  newPlace?: {
    name: string;
    category: PlaceCategory;
    lat: number;
    lng: number;
    address?: string;
  };
  time?: string;
  memo?: string;
}

interface Props {
  places: Place[];
  onSubmit: (input: AddItineraryItemSubmit) => Promise<void>;
}

export function AddItineraryItemForm({ places, onSubmit }: Props) {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>(places[0]?.id ?? NEW_PLACE_VALUE);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<PlaceCategory>("관광");
  const [newLat, setNewLat] = useState("");
  const [newLng, setNewLng] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [showCoords, setShowCoords] = useState(false);
  const [time, setTime] = useState("");
  const [memo, setMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNewPlace = selectedPlaceId === NEW_PLACE_VALUE;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (isNewPlace) {
      const lat = Number(newLat);
      const lng = Number(newLng);
      if (!newName.trim() || newLat.trim() === "" || newLng.trim() === "" || Number.isNaN(lat) || Number.isNaN(lng)) {
        setError("장소 이름을 입력하고, 좌표 입력을 펼쳐 위도/경도를 채워주세요.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        placeId: isNewPlace ? undefined : selectedPlaceId,
        newPlace: isNewPlace
          ? {
              name: newName,
              category: newCategory,
              lat: Number(newLat),
              lng: Number(newLng),
              address: newAddress || undefined,
            }
          : undefined,
        time: time || undefined,
        memo: memo || undefined,
      });
      setNewName("");
      setNewLat("");
      setNewLng("");
      setNewAddress("");
      setShowCoords(false);
      setTime("");
      setMemo("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "일정을 추가하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-3.5"
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="place">
          장소<span className="text-destructive"> *</span>
        </Label>
        <Select value={selectedPlaceId} onValueChange={setSelectedPlaceId}>
          <SelectTrigger id="place" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {places.map((place) => (
              <SelectItem key={place.id} value={place.id}>
                {place.name} ({place.category})
              </SelectItem>
            ))}
            <SelectItem value={NEW_PLACE_VALUE}>+ 새 장소 추가</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isNewPlace && (
        <div className="grid grid-cols-1 gap-3 rounded-md bg-muted/40 p-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="newName">장소 이름</Label>
            <Input
              id="newName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="예: 오사카 성"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="newCategory">카테고리</Label>
            <Select value={newCategory} onValueChange={(v) => setNewCategory(v as PlaceCategory)}>
              <SelectTrigger id="newCategory" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLACE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="newAddress">주소</Label>
            <Input id="newAddress" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
          </div>

          <div className="sm:col-span-2">
            {showCoords ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="newLat">위도</Label>
                  <Input
                    id="newLat"
                    type="number"
                    step="any"
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    placeholder="35.123"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="newLng">경도</Label>
                  <Input
                    id="newLng"
                    type="number"
                    step="any"
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    placeholder="135.123"
                  />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCoords(true)}
                className="text-sm text-muted-foreground underline-offset-2 hover:underline"
              >
                정확한 위치를 지도 검색으로 찾기 어렵다면, 직접 좌표 입력하기
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="time">시간</Label>
        <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-36" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="memo">메모</Label>
        <Input id="memo" value={memo} onChange={(e) => setMemo(e.target.value)} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} size="sm" className="self-start">
        <Plus />
        {isSubmitting ? "추가 중..." : "일정에 추가"}
      </Button>
    </form>
  );
}
