import { Routes, Route } from "react-router";
import { HomePage } from "../features/trp/HomePage";
import { TripCreatePage } from "../features/trp/TripCreatePage";
import { TripDetailPage } from "../features/trp/TripDetailPage";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/trip/new" element={<TripCreatePage />} />
      <Route path="/trip/:shareSlug" element={<TripDetailPage />} />
    </Routes>
  );
}
