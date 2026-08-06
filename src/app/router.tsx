import { Routes, Route } from "react-router";
import { HomePage } from "../features/trips/HomePage";
import { TripCreatePage } from "../features/trips/TripCreatePage";
import { TripDetailPage } from "../features/trips/TripDetailPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/trip/new" element={<TripCreatePage />} />
      <Route path="/trip/:shareSlug" element={<TripDetailPage />} />
    </Routes>
  );
}
