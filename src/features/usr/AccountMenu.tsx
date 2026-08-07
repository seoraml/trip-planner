import { useState } from "react";
import { LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthState, signInWithGoogle, signOut } from "@/lib/auth";

export function AccountMenu() {
  const { isAnonymous, email } = useAuthState();
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function handleSignIn() {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "로그인에 실패했습니다.");
      setIsSigningIn(false);
    }
  }

  function handleSignOut() {
    if (!window.confirm("로그아웃할까요?")) return;
    signOut();
  }

  if (isAnonymous) {
    return (
      <Button variant="outline" size="sm" onClick={handleSignIn} disabled={isSigningIn}>
        <LogIn />
        {isSigningIn ? "이동 중..." : "Google로 로그인"}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {email && (
        <span className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
          <User className="size-3.5" />
          {email}
        </span>
      )}
      <Button variant="outline" size="sm" onClick={handleSignOut}>
        <LogOut />
        로그아웃
      </Button>
    </div>
  );
}
