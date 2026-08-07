import { useEffect, useRef, useState, type FormEvent } from "react";
import { ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CountryAutocomplete } from "./CountryAutocomplete";
import type { Trip } from "@/types/domain";
import { validateTripForm, type TripFormValues } from "./tripFormValidation";

const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;

interface Props {
  trip: Trip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TripFormValues) => Promise<void>;
  onChangeThumbnail: (file: File) => Promise<void>;
  onRemoveThumbnail: () => Promise<void>;
}

function tripToFormValues(trip: Trip): TripFormValues {
  return {
    title: trip.title,
    country: trip.country,
    city: trip.city,
    startDate: trip.startDate,
    endDate: trip.endDate,
    description: trip.description ?? "",
  };
}

export function TripEditDialog({
  trip,
  open,
  onOpenChange,
  onSubmit,
  onChangeThumbnail,
  onRemoveThumbnail,
}: Props) {
  const [values, setValues] = useState<TripFormValues>(() => tripToFormValues(trip));
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(trip.thumbnailUrl);
  const [isThumbnailBusy, setIsThumbnailBusy] = useState(false);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);

  // Reset form to the trip's current values each time the dialog opens.
  useEffect(() => {
    if (open) {
      setValues(tripToFormValues(trip));
      setSubmitAttempted(false);
      setSubmitError(null);
      setThumbnailError(null);
    }
    setPreviewUrl(trip.thumbnailUrl);
  }, [open, trip]);

  async function handleThumbnailSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setThumbnailError("이미지 파일만 업로드할 수 있어요.");
      return;
    }
    if (file.size > MAX_THUMBNAIL_BYTES) {
      setThumbnailError("5MB 이하의 이미지만 업로드할 수 있어요.");
      return;
    }

    setThumbnailError(null);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsThumbnailBusy(true);
    try {
      await onChangeThumbnail(file);
    } catch (err) {
      setPreviewUrl(trip.thumbnailUrl);
      setThumbnailError(err instanceof Error ? err.message : "사진을 업로드하지 못했습니다.");
    } finally {
      URL.revokeObjectURL(objectUrl);
      setIsThumbnailBusy(false);
    }
  }

  async function handleThumbnailRemove() {
    if (!window.confirm("사진을 삭제할까요?")) return;
    setThumbnailError(null);
    setIsThumbnailBusy(true);
    try {
      await onRemoveThumbnail();
      setPreviewUrl(undefined);
    } catch (err) {
      setThumbnailError(err instanceof Error ? err.message : "사진을 제거하지 못했습니다.");
    } finally {
      setIsThumbnailBusy(false);
    }
  }

  const errors = submitAttempted ? validateTripForm(values) : {};

  function setField(field: keyof TripFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitAttempted(true);
    if (Object.keys(validateTripForm(values)).length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(values);
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "여행 정보를 저장하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>여행 정보 수정</DialogTitle>
          <DialogDescription>여행 제목과 기간, 설명을 수정할 수 있어요.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
              {previewUrl ? (
                <img src={previewUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="size-5 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex flex-col items-start gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailSelect}
              />
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isThumbnailBusy}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isThumbnailBusy ? "처리 중..." : "사진 변경"}
                </Button>
                {previewUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isThumbnailBusy}
                    onClick={handleThumbnailRemove}
                  >
                    제거
                  </Button>
                )}
              </div>
              {thumbnailError && <p className="text-xs text-destructive">{thumbnailError}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-title">
              여행 제목<span className="text-destructive"> *</span>
            </Label>
            <Input
              id="edit-title"
              value={values.title}
              onChange={(e) => setField("title", e.target.value)}
              aria-invalid={!!errors.title}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-country">
                국가<span className="text-destructive"> *</span>
              </Label>
              <CountryAutocomplete
                id="edit-country"
                value={values.country}
                onChange={(value) => setField("country", value)}
                aria-invalid={!!errors.country}
              />
              {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-city">
                도시<span className="text-destructive"> *</span>
              </Label>
              <Input
                id="edit-city"
                value={values.city}
                onChange={(e) => setField("city", e.target.value)}
                aria-invalid={!!errors.city}
              />
              {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-startDate">
                시작일<span className="text-destructive"> *</span>
              </Label>
              <Input
                id="edit-startDate"
                type="date"
                value={values.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
                aria-invalid={!!errors.startDate}
              />
              {errors.startDate && <p className="text-sm text-destructive">{errors.startDate}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-endDate">
                종료일<span className="text-destructive"> *</span>
              </Label>
              <Input
                id="edit-endDate"
                type="date"
                value={values.endDate}
                onChange={(e) => setField("endDate", e.target.value)}
                aria-invalid={!!errors.endDate}
              />
              {errors.endDate && <p className="text-sm text-destructive">{errors.endDate}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-description">여행 설명</Label>
            <Textarea
              id="edit-description"
              rows={3}
              value={values.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <DialogFooter className="-mx-0 -mb-0 mt-1 rounded-none border-none bg-transparent p-0">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
