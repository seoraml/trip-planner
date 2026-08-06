import { useEffect, useState, type FormEvent } from "react";
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
import type { Trip } from "@/types/domain";
import { validateTripForm, type TripFormValues } from "./tripFormValidation";

interface Props {
  trip: Trip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TripFormValues) => Promise<void>;
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

export function TripEditDialog({ trip, open, onOpenChange, onSubmit }: Props) {
  const [values, setValues] = useState<TripFormValues>(() => tripToFormValues(trip));
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset form to the trip's current values each time the dialog opens.
  useEffect(() => {
    if (open) {
      setValues(tripToFormValues(trip));
      setSubmitAttempted(false);
      setSubmitError(null);
    }
  }, [open, trip]);

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
              <Input
                id="edit-country"
                value={values.country}
                onChange={(e) => setField("country", e.target.value)}
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
