import type { ComponentType } from "react";
import {
  Landmark,
  UtensilsCrossed,
  Coffee,
  ShoppingBag,
  BedDouble,
  Car,
  MapPin,
  type LucideProps,
} from "lucide-react";
import type { PlaceCategory } from "@/types/domain";

// Badge text/background (Tailwind classes)
export const PLACE_CATEGORY_STYLES: Record<PlaceCategory, string> = {
  관광: "bg-sky-100 text-sky-700",
  식사: "bg-orange-100 text-orange-700",
  카페: "bg-amber-100 text-amber-700",
  쇼핑: "bg-pink-100 text-pink-700",
  숙소: "bg-emerald-100 text-emerald-700",
  교통: "bg-slate-200 text-slate-700",
  기타: "bg-muted text-muted-foreground",
};

// Circular icon chip background/foreground (Tailwind classes)
export const PLACE_CATEGORY_ICON_STYLES: Record<PlaceCategory, string> = {
  관광: "bg-sky-100 text-sky-600",
  식사: "bg-orange-100 text-orange-600",
  카페: "bg-amber-100 text-amber-600",
  쇼핑: "bg-pink-100 text-pink-600",
  숙소: "bg-emerald-100 text-emerald-600",
  교통: "bg-slate-200 text-slate-600",
  기타: "bg-muted text-muted-foreground",
};

export const PLACE_CATEGORY_ICONS: Record<PlaceCategory, ComponentType<LucideProps>> = {
  관광: Landmark,
  식사: UtensilsCrossed,
  카페: Coffee,
  쇼핑: ShoppingBag,
  숙소: BedDouble,
  교통: Car,
  기타: MapPin,
};

// Same palette as PLACE_CATEGORY_ICON_STYLES, as hex — for contexts that can't
// use Tailwind classes (e.g. Google Maps marker icons).
export const PLACE_CATEGORY_HEX: Record<PlaceCategory, string> = {
  관광: "#0284C7",
  식사: "#EA580C",
  카페: "#D97706",
  쇼핑: "#DB2777",
  숙소: "#059669",
  교통: "#475569",
  기타: "#78716C",
};
