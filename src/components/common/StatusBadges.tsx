import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "cyan" | "violet" | "success" | "warning" | "danger" | "muted";

export function StatusBadge({ tone = "muted", children }: { tone?: Tone; children: ReactNode }) {
  const cls = {
    cyan: "bg-cyan/10 text-cyan border-cyan/20",
    violet: "bg-violet/10 text-violet border-violet/20",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    danger: "bg-danger/10 text-danger border-danger/20",
    muted: "bg-white/[0.04] text-muted-foreground border-border",
  }[tone];
  return <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono border", cls)}>{children}</span>;
}

export function LiveBadge({ active = true, label = "LIVE" }: { active?: boolean; label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-mono border border-cyan/25 bg-cyan/10 text-cyan">
      <span className={cn("w-1.5 h-1.5 rounded-full bg-cyan", active && "animate-pulse")} />
      {label}
    </span>
  );
}