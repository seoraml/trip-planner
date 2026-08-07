import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  tripTitle: string;
  isOwner: boolean;
  linkEditable: boolean;
  onToggleLinkEditable: (enabled: boolean) => Promise<void>;
}

export function ShareDialog({
  open,
  onOpenChange,
  url,
  tripTitle,
  isOwner,
  linkEditable,
  onToggleLinkEditable,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  async function handleToggle() {
    setIsToggling(true);
    try {
      await onToggleLinkEditable(!linkEditable);
    } catch {
      window.alert("설정을 변경하지 못했습니다.");
    } finally {
      setIsToggling(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.alert("링크를 복사하지 못했습니다.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>여행 공유하기</DialogTitle>
          <DialogDescription>
            &ldquo;{tripTitle}&rdquo; 링크로 누구나 일정을 볼 수 있어요.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="rounded-xl border border-border bg-white p-3">
            <QRCodeSVG value={url} size={168} />
          </div>

          <div className="flex w-full gap-2">
            <Input
              value={url}
              readOnly
              onFocus={(event) => event.currentTarget.select()}
              className="text-xs"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label="링크 복사"
              onClick={handleCopy}
            >
              {copied ? <Check className="text-success" /> : <Copy />}
            </Button>
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={handleToggle}
              disabled={isToggling}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-border p-3 text-left"
            >
              <span className="text-sm text-foreground">
                링크로 들어온 로그인 사용자도 편집 가능
              </span>
              <span
                aria-hidden="true"
                className={
                  "relative h-5 w-9 shrink-0 rounded-full transition-colors " +
                  (linkEditable ? "bg-primary" : "bg-muted")
                }
              >
                <span
                  className={
                    "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform " +
                    (linkEditable ? "translate-x-4.5" : "translate-x-0.5")
                  }
                />
              </span>
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
