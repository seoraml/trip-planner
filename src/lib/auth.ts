import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "./supabase";

let sessionPromise: Promise<Session> | null = null;

// Idempotent: safe to call from multiple places (app bootstrap, service
// calls) — only ever performs one sign-in, everyone awaits the same promise.
export function ensureAnonymousSession(): Promise<Session> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      if (!isSupabaseConfigured) {
        throw new Error(
          "Supabase 환경변수가 설정되지 않았습니다. .env.example을 참고해 .env.local을 만들어주세요."
        );
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) return data.session;

      const { data: signInData, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      return signInData.session!;
    })().catch((error: unknown) => {
      sessionPromise = null; // allow retry on next call
      throw error;
    });
  }
  return sessionPromise;
}

export type SessionStatus = "loading" | "ready" | "error";

export function useAnonymousSession() {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ensureAnonymousSession()
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setStatus("error");
          setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { status, error };
}

// For ownership checks (e.g. "is the current viewer the trip owner").
// Resolves to null while the session isn't ready yet.
export function useCurrentUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ensureAnonymousSession()
      .then((session) => {
        if (!cancelled) setUserId(session.user.id);
      })
      .catch(() => {
        // useAnonymousSession (mounted once at the app root) surfaces the error UI;
        // this hook just stays null if the session never became available.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return userId;
}
