import type { LucideIcon } from "lucide-react";
import { Circle } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "cyan" | "violet" | "success" | "warning" | "danger" | "muted";

export type TimelineItem = {
  id: string | number;
  title: string;
  detail?: string;
  timestamp: string;
  tone?: Tone;
  icon?: LucideIcon;
};

const TONE: Record<Tone, string> = {
  cyan: "text-cyan",
  violet: "text-violet",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  muted: "text-muted-foreground",
};

export function TimelineFeed({ items, empty }: { items: TimelineItem[]; empty?: ReactNode }) {
  if (!items.length) return <>{empty}</>;
  return (
    <ol className="relative pl-4 space-y-3">
      <span className="absolute left-[7px] top-1 bottom-1 w-px bg-border/60" aria-hidden />
      {items.map((it) => {
        const Icon = it.icon ?? Circle;
        return (
          <li key={it.id} className="relative">
            <span className={`absolute -left-[13px] top-0.5 w-3 h-3 rounded-full bg-background border-2 border-current ${TONE[it.tone ?? "cyan"]}`}>
              <Icon className="w-2 h-2 m-auto" />
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-[13px] font-medium truncate">{it.title}</div>
              <div className="text-[10.5px] font-mono text-muted-foreground shrink-0">{it.timestamp}</div>
            </div>
            {it.detail && <div className="text-[12px] text-muted-foreground mt-0.5">{it.detail}</div>}
          </li>
        );
      })}
    </ol>
  );
}