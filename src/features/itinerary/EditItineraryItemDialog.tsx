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
import type { ItineraryItem, Place } from "@/types/domain";
import type { ItineraryItemEdits } from "./itineraryService";

interface Props {
  item: ItineraryItem;
  place: Place | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (edits: ItineraryItemEdits) => Promise<void>;
}

export function EditItineraryItemDialog({ item, place, open, onOpenChange, onSubmit }: Props) {
  const [time, setTime] = useState(item.time ?? "");
  const [memo, setMemo] = useState(item.memo ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTime(item.time ?? "");
      setMemo(item.memo ?? "");
      setError(null);
    }
  }, [open, item]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ time: time || undefined, memo: memo || undefined });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "일정을 저장하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>일정 수정</DialogTitle>
          <DialogDescription>{place?.name ?? "삭제된 장소"}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-item-time">시간</Label>
            <Input
              id="edit-item-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-item-memo">메모</Label>
            <Input id="edit-item-memo" value={memo} onChange={(e) => setMemo(e.target.value)} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

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
