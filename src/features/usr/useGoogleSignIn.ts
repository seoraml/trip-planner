import { useState } from "react";
import { signInWithGoogle } from "@/lib/auth";

export function useGoogleSignIn() {
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function signIn() {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "로그인에 실패했습니다.");
      setIsSigningIn(false);
    }
  }

  return { signIn, isSigningIn };
}
