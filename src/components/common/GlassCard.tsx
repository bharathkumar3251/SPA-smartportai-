import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export function GlassCard({
  className,
  children,
  strong,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { strong?: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/70 bg-card/40 backdrop-blur-xl p-5",
        strong && "bg-card/60 border-border",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}