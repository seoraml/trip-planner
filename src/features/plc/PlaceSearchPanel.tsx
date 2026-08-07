import { useState, type FormEvent } from "react";
import { Loader2, MapPin, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { MapProvider, PlaceSearchResult } from "@/lib/map/MapProvider";

interface Props {
  provider: MapProvider | null;
  onSelect: (result: PlaceSearchResult) => void;
}

export function PlaceSearchPanel({ provider, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "searching" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!provider || !query.trim()) return;
    setStatus("searching");
    setError(null);
    try {
      const found = await provider.searchPlace(query.trim());
      setResults(found);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "검색에 실패했습니다.");
    }
  }

  if (!provider) return null;

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="장소를 검색해보세요"
            className="pl-8"
          />
        </div>
        <Button type="submit" size="sm" disabled={status === "searching"}>
          {status === "searching" ? <Loader2 className="animate-spin" /> : <Search />}
          검색
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {results.length > 0 && (
        <ul className="flex max-h-56 animate-in fade-in flex-col gap-1.5 overflow-y-auto duration-200">
          {results.map((result, index) => (
            <li key={`${result.name}-${index}`}>
              <Card
                role="button"
                tabIndex={0}
                onClick={() => onSelect(result)}
                className="group/result cursor-pointer flex-row items-center gap-3 p-2.5 transition-colors hover:bg-muted/40"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <MapPin className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{result.name}</p>
                  {result.address && (
                    <p className="truncate text-xs text-muted-foreground">{result.address}</p>
                  )}
                </div>
                <Plus className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/result:opacity-100" />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
