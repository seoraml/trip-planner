import { Plus } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { AccountMenu } from "@/features/usr/AccountMenu";
import { useAuthState } from "@/lib/auth";
import type { Trip } from "@/types/domain";
import { useMyTrips } from "./useMyTrips";
import { TripCard } from "./TripCard";

function NewTripButton({ label }: { label: string }) {
  const { isAnonymous } = useAuthState();

  if (isAnonymous) {
    return (
      <Button disabled title="로그인 후 이용 가능">
        <Plus />
        {label}
      </Button>
    );
  }

  return (
    <Button asChild>
      <Link to="/trip/new">
        <Plus />
        {label}
      </Link>
    </Button>
  );
}

export function HomePage() {
  const { trips, itemCounts, status, error, removeTrip } = useMyTrips();

  function handleDelete(trip: Trip) {
    if (!window.confirm(`"${trip.title}" 여행을 삭제할까요? 장소와 일정도 모두 함께 삭제됩니다.`)) {
      return;
    }
    removeTrip(trip.id).catch(() => {
      window.alert("여행을 삭제하지 못했습니다. 다시 시도해주세요.");
    });
  }

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">trip-planner</h1>
          <p className="mt-1.5 text-muted-foreground">
            지도에서 장소를 검색하고, 날짜별 일정을 구성하고, URL로 공유하세요.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <AccountMenu />
          <NewTripButton label="새 여행 만들기" />
        </div>
      </header>

      <div className="mt-8">
        {status === "loading" && <p className="text-muted-foreground">여행 목록을 불러오는 중...</p>}
        {status === "error" && <p className="text-destructive">{error}</p>}
        {status === "ready" && trips.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
            <p className="text-muted-foreground">아직 만든 여행이 없어요.</p>
            <NewTripButton label="첫 여행 만들기" />
          </div>
        )}
        {status === "ready" && trips.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} itemCount={itemCounts[trip.id]} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
