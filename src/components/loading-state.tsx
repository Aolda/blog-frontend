import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: ReactNode;
  className?: string;
  iconClassName?: string;
  messageClassName?: string;
}

export function LoadingState({ message, className, iconClassName, messageClassName }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <Loader2 className={cn("size-8 animate-spin text-muted-foreground", iconClassName)} />
      {message ? <p className={cn("text-sm text-muted-foreground", messageClassName)}>{message}</p> : null}
    </div>
  );
}
