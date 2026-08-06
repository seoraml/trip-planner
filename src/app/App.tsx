import { BrowserRouter } from "react-router";
import { AppRouter } from "./router";
import { useAnonymousSession } from "@/lib/auth";

export function App() {
  const { status, error } = useAnonymousSession();

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-destructive">
        {error ?? "로그인에 실패했습니다. 새로고침 후 다시 시도해주세요."}
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        불러오는 중...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
