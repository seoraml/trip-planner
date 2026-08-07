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

// Supabase reports this failure via URL params on the redirect *back* from
// Google, not as a return value from the call that started the redirect — so
// it can only be caught here, at app load, not inside signInWithGoogle().
// Happens when linkIdentity() targets a Google account that's already the
// primary identity of a different (earlier) anonymous session in this browser.
function consumeGoogleLinkConflict(): boolean {
  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const errorCode = params.get("error_code") ?? hashParams.get("error_code");
  if (errorCode !== "identity_already_exists") return false;
  window.history.replaceState(null, "", window.location.pathname);
  return true;
}

export function useAnonymousSession() {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (consumeGoogleLinkConflict()) {
        // The account this browser was trying to link to already belongs to
        // someone (the same person, from an earlier session) — sign in to it
        // directly instead. This redirects again; nothing after this runs.
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: window.location.origin },
        });
        if (error) throw error;
        return;
      }
      await ensureAnonymousSession();
    }

    bootstrap()
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

export interface AuthState {
  userId: string | null;
  isAnonymous: boolean;
  email: string | null;
}

const INITIAL_AUTH_STATE: AuthState = { userId: null, isAnonymous: true, email: null };

function toAuthState(session: Session): AuthState {
  return {
    userId: session.user.id,
    isAnonymous: session.user.is_anonymous ?? true,
    email: session.user.email ?? null,
  };
}

// Reacts to login/logout/link events (not just the initial bootstrap), so the
// UI updates right after the Google OAuth redirect comes back — no reload needed.
export function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>(INITIAL_AUTH_STATE);

  useEffect(() => {
    let cancelled = false;

    ensureAnonymousSession()
      .then((session) => {
        if (!cancelled) setState(toAuthState(session));
      })
      .catch(() => {
        // useAnonymousSession (mounted once at the app root) surfaces the error UI;
        // this hook just stays at its initial state if the session never resolves.
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled && session) setState(toAuthState(session));
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return state;
}

// For ownership checks (e.g. "is the current viewer the trip owner").
// Resolves to null while the session isn't ready yet.
export function useCurrentUserId(): string | null {
  return useAuthState().userId;
}

// Anonymous session -> upgrades in place (same auth.uid(), existing trips stay
// owned). Already-real session -> re-authenticates. Redirects the browser to
// Google; there is no return value, the OAuth callback resolves via
// onAuthStateChange once the user is back.
export async function signInWithGoogle(): Promise<void> {
  const session = await ensureAnonymousSession();
  const redirectTo = window.location.origin;

  if (session.user.is_anonymous) {
    const { error } = await supabase.auth.linkIdentity({ provider: "google", options: { redirectTo } });
    if (!error) return;
    // This browser's anonymous account is a dead end (its Google identity was
    // already claimed by a different account in an earlier session) — fall
    // back to a normal sign-in, which resolves to that existing account.
    if (error.code !== "identity_already_exists") throw error;
  }

  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  // Simplest reliable reset: let App.tsx's bootstrap create a fresh anonymous
  // session on reload, rather than hand-rolling post-signout state.
  window.location.href = "/";
}
