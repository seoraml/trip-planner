export type UUID = string;
export type ISODateString = string; // "YYYY-MM-DD"
export type ISODateTimeString = string; // timestamptz

export type PlaceCategory =
  | "관광"
  | "식사"
  | "카페"
  | "쇼핑"
  | "숙소"
  | "교통"
  | "기타";

export interface Trip {
  id: UUID;
  ownerId: UUID | null;
  title: string;
  country: string;
  city: string;
  startDate: ISODateString;
  endDate: ISODateString;
  description?: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  linkEditable: boolean;
  shareSlug: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface Place {
  id: UUID;
  tripId: UUID;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  category: PlaceCategory;
  memo?: string;
  createdAt: ISODateTimeString;
}

export interface ItineraryItem {
  id: UUID;
  tripId: UUID;
  placeId: UUID;
  date: ISODateString;
  time?: string; // "HH:mm", display only, not the sort key
  memo?: string;
  sortOrder: number;
  createdAt: ISODateTimeString;
}

// Derived client-side only, never persisted
export interface TripDay {
  date: ISODateString;
  dayNumber: number;
  items: ItineraryItem[];
}

export interface TripMember {
  id: UUID;
  tripId: UUID;
  name: string;
  createdAt: ISODateTimeString;
}

export interface BudgetCategoryPlan {
  tripId: UUID;
  category: PlaceCategory;
  plannedAmount: number;
}

export interface Expense {
  id: UUID;
  tripId: UUID;
  category: PlaceCategory;
  amount: number;
  memo?: string;
  paidBy: UUID | null;
  splitMemberIds: UUID[];
  expenseDate?: ISODateString;
  createdAt: ISODateTimeString;
}

// Derived client-side only, never persisted
export interface SettlementTransfer {
  fromMemberId: UUID;
  toMemberId: UUID;
  amount: number;
}
