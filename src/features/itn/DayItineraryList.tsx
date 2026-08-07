import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Pencil, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PLACE_CATEGORY_ICON_STYLES, PLACE_CATEGORY_ICONS } from "@/features/plc/placeCategoryStyles";
import type { ItineraryItem, Place } from "@/types/domain";

interface Props {
  items: ItineraryItem[];
  placesById: Map<string, Place>;
  readOnly: boolean;
  selectedItemId: string | null;
  onSelectItem: (itemId: string) => void;
  onEditItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onReorder: (orderedItemIds: string[]) => void;
}

export function DayItineraryList({
  items,
  placesById,
  readOnly,
  selectedItemId,
  onSelectItem,
  onEditItem,
  onDeleteItem,
  onReorder,
}: Props) {
  const [dragId, setDragId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p className="animate-in fade-in rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground duration-300">
        아직 등록된 일정이 없습니다.
      </p>
    );
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const ids = items.map((item) => item.id);
    const fromIndex = ids.indexOf(dragId);
    const toIndex = ids.indexOf(targetId);
    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, dragId);
    onReorder(ids);
    setDragId(null);
  }

  // Drag-and-drop only works with a mouse — this button-based move covers
  // touch devices where `draggable` never fires.
  function moveItem(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const ids = items.map((item) => item.id);
    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
    onReorder(ids);
  }

  return (
    <ul className="flex animate-in fade-in flex-col gap-2 duration-300">
      {items.map((item, index) => {
        const place = placesById.get(item.placeId);
        const isSelected = item.id === selectedItemId;
        const CategoryIcon = place ? PLACE_CATEGORY_ICONS[place.category] : undefined;
        return (
          <li
            key={item.id}
            draggable={!readOnly}
            onDragStart={() => setDragId(item.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(item.id)}
          >
            <Card
              role="button"
              tabIndex={0}
              onClick={() => onSelectItem(item.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelectItem(item.id);
              }}
              className={
                "group/item cursor-pointer flex-row items-start gap-3 p-3 transition-all duration-150 " +
                (isSelected ? "bg-primary/5 shadow-md ring-2 ring-primary" : "hover:bg-muted/40")
              }
            >
              {!readOnly && (
                <div className="flex shrink-0 flex-col items-center">
                  <button
                    type="button"
                    aria-label="위로 이동"
                    disabled={index === 0}
                    onClick={(event) => {
                      event.stopPropagation();
                      moveItem(index, -1);
                    }}
                    className="rounded p-0.5 text-muted-foreground/50 hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <GripVertical className="size-3.5 cursor-grab text-muted-foreground/30" aria-hidden="true" />
                  <button
                    type="button"
                    aria-label="아래로 이동"
                    disabled={index === items.length - 1}
                    onClick={(event) => {
                      event.stopPropagation();
                      moveItem(index, 1);
                    }}
                    className="rounded p-0.5 text-muted-foreground/50 hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                </div>
              )}

              {CategoryIcon && place && (
                <div
                  className={
                    "flex size-9 shrink-0 items-center justify-center rounded-full " +
                    PLACE_CATEGORY_ICON_STYLES[place.category]
                  }
                >
                  <CategoryIcon className="size-4.5" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  {item.time && (
                    <span className="text-xs font-medium text-muted-foreground">
                      {item.time.slice(0, 5)}
                    </span>
                  )}
                  <span className="text-base font-medium text-foreground">
                    {place?.name ?? "삭제된 장소"}
                  </span>
                </div>
                {item.memo && <p className="mt-0.5 text-xs text-muted-foreground">{item.memo}</p>}
              </div>

              {!readOnly && (
                <div className="flex shrink-0 gap-0.5 opacity-60 sm:opacity-0 sm:group-hover/item:opacity-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="일정 수정"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditItem(item.id);
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="일정 삭제"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                  >
                    <X />
                  </Button>
                </div>
              )}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
