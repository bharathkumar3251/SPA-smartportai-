import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { GlassCard } from "@/components/common/GlassCard";
import { Bell, CalendarDays, ChevronLeft, ChevronRight, CircleHelp, LifeBuoy, Sparkles, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { STAGE_FLOW, STAGE_META } from "@/lib/workflow";
import { roleMeta } from "@/lib/roles";
import { useNotificationFeed, useRecentEvents, useAllSubmissions } from "@/hooks/useOps";
import { cn } from "@/lib/utils";

const PRIORITY_DOT = {
  critical: "bg-danger",
  high: "bg-warning",
  normal: "bg-cyan",
  low: "bg-muted-foreground",
} as const;

const relative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
};

export function SectionTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground font-medium">{children}</div>
      {actions}
    </div>
  );
}

/** Live notification feed for the signed-in user. */
export function NotificationsCard({ title = "Recent notifications", limit = 6, className }: { title?: string; limit?: number; className?: string }) {
  const { data, isLoading } = useNotificationFeed(limit);
  return (
    <GlassCard className={className}>
      <SectionTitle actions={<Link to="/app/notifications" className="text-[11px] text-cyan hover:underline">View all</Link>}>
        <span className="inline-flex items-center gap-1.5"><Bell className="w-3 h-3" /> {title}</span>
      </SectionTitle>
      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-8" />)}</div>
      ) : (data ?? []).length === 0 ? (
        <p className="text-[12.5px] text-muted-foreground py-4">No notifications.</p>
      ) : (
        <ul className="space-y-3">
          {(data ?? []).map((n) => (
            <li key={n.id} className="flex gap-2.5">
              <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0", PRIORITY_DOT[n.priority])} />
              <div className="min-w-0">
                <div className="text-[13px] leading-snug">{n.title}</div>
                {n.body && <div className="text-[11.5px] text-muted-foreground truncate">{n.body}</div>}
              </div>
              <span className="ml-auto text-[10.5px] font-mono text-muted-foreground shrink-0">{relative(n.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </GlassCard>
  );
}

/** Cross-shipment activity timeline from recorded workflow events. */
export function ActivityCard({ title = "Activity timeline", limit = 10, className }: { title?: string; limit?: number; className?: string }) {
  const { data, isLoading } = useRecentEvents(limit);
  return (
    <GlassCard className={className}>
      <SectionTitle>{title}</SectionTitle>
      {isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-8" />)}</div>
      ) : (data ?? []).length === 0 ? (
        <p className="text-[12.5px] text-muted-foreground py-4">No activity recorded yet.</p>
      ) : (
        <ol className="relative pl-4 space-y-3.5">
          <span className="absolute left-[3px] top-1 bottom-1 w-px bg-border/70" aria-hidden />
          {(data ?? []).map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-4 top-1.5 w-[7px] h-[7px] rounded-full ring-2 ring-background bg-cyan" />
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-[13px] font-medium truncate">{e.action}</div>
                <div className="text-[10.5px] font-mono text-muted-foreground shrink-0">{relative(e.created_at)}</div>
              </div>
              <div className="text-[11.5px] text-muted-foreground truncate">
                {STAGE_META[e.stage]?.label ?? e.stage}
                {" · "}{e.actor_label ?? "System"}
                {e.actor_role ? ` · ${roleMeta(e.actor_role).label}` : ""}
              </div>
              {e.notes && <div className="text-[11.5px] text-foreground/75 mt-0.5">{e.notes}</div>}
            </li>
          ))}
        </ol>
      )}
    </GlassCard>
  );
}

/** Month calendar of scheduled vessel arrivals (ETA) from the database. */
export function CalendarWidget({ title = "Arrival calendar", className }: { title?: string; className?: string }) {
  const [offset, setOffset] = useState(0);
  const { data: subs } = useAllSubmissions();
  const base = new Date();
  const month = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const first = month.getDay() === 0 ? 6 : month.getDay() - 1;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array.from({ length: first }).map(() => null), ...Array.from({ length: days }).map((_, i) => i + 1)];

  const events = useMemo(() => {
    const map: Record<string, { label: string }[]> = {};
    for (const s of subs ?? []) {
      if (!s.eta) continue;
      const d = new Date(s.eta);
      if (d.getFullYear() !== month.getFullYear() || d.getMonth() !== month.getMonth()) continue;
      const key = String(d.getDate());
      (map[key] ??= []).push({ label: `${s.vessel_name} · ${s.reference}` });
    }
    return map;
  }, [subs, month.getFullYear(), month.getMonth()]);

  return (
    <GlassCard className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground font-medium inline-flex items-center gap-1.5">
          <CalendarDays className="w-3 h-3" /> {title}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setOffset((o) => o - 1)} className="w-6 h-6 rounded border border-border/70 flex items-center justify-center hover:border-cyan/40 transition" aria-label="Previous month">
            <ChevronLeft className="w-3 h-3" />
          </button>
          <span className="text-[11.5px] font-mono w-[74px] text-center">
            {month.toLocaleString("en", { month: "short" })} {month.getFullYear()}
          </span>
          <button onClick={() => setOffset((o) => o + 1)} className="w-6 h-6 rounded border border-border/70 flex items-center justify-center hover:border-cyan/40 transition" aria-label="Next month">
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="text-[10px] text-muted-foreground/70 font-mono py-1">{d}</div>
        ))}
        {cells.map((d, i) => {
          const ev = d ? events[String(d)] : undefined;
          return (
            <div key={i} className={cn(
              "aspect-square rounded-md text-[11.5px] flex flex-col items-center justify-center border",
              d ? "border-border/50" : "border-transparent",
              ev ? "bg-cyan/10 border-cyan/30 text-cyan" : "text-muted-foreground",
            )} title={ev?.map((e) => e.label).join(", ")}>
              {d ?? ""}
              {ev && <span className="w-1 h-1 rounded-full bg-cyan mt-0.5" />}
            </div>
          );
        })}
      </div>
      <div className="mt-3 space-y-1.5">
        {Object.keys(events).length === 0 ? (
          <p className="text-[11.5px] text-muted-foreground">No scheduled arrivals this month.</p>
        ) : (
          Object.entries(events).slice(0, 3).map(([day, list]) => (
            <div key={day} className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
              <span className="font-mono text-cyan">{month.toLocaleString("en", { month: "short" })} {day}</span>
              <span className="truncate">{list[0].label}</span>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}

/** End-to-end workflow rail with live counts per stage. */
export function WorkflowOverview({ activeStage, counts, className }: { activeStage?: string; counts?: Record<string, number>; className?: string }) {
  return (
    <GlassCard className={cn("overflow-hidden", className)}>
      <SectionTitle>Port workflow pipeline</SectionTitle>
      <div className="flex items-stretch gap-1.5 overflow-x-auto scrollbar-thin pb-1">
        {STAGE_FLOW.map((stage, i) => {
          const meta = STAGE_META[stage];
          const active = activeStage === stage;
          return (
            <div key={stage} className="flex items-center gap-1.5 shrink-0">
              <div className={cn(
                "min-w-[104px] rounded-md border px-2.5 py-2",
                active ? "border-cyan/50 bg-cyan/10" : "border-border/60 bg-white/[0.02]",
              )}>
                <div className="text-[10px] font-mono text-muted-foreground">{String(i + 1).padStart(2, "0")}</div>
                <div className={cn("text-[11.5px] leading-tight mt-0.5", active ? "text-cyan" : "text-foreground/85")}>{meta.label}</div>
                <div className="text-[10.5px] font-mono text-muted-foreground mt-1">{counts?.[stage] ?? 0} active</div>
              </div>
              {i < STAGE_FLOW.length - 1 && <span className="w-3 h-px bg-border" />}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

/** AI assistant slot — reserved for the model integration phase. */
export function AssistantPlaceholder({ portal, prompts, className }: { portal: string; prompts: string[]; className?: string }) {
  return (
    <GlassCard className={className}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan/25 to-violet/20 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-cyan" />
        </span>
        <div>
          <div className="text-[13.5px] font-medium">AI Assistant</div>
          <div className="text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground">{portal}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {prompts.map((p) => (
          <span key={p} className="px-2 py-1 rounded border border-border text-[11.5px] text-muted-foreground">{p}</span>
        ))}
      </div>
      <div className="mt-3 rounded-md border border-dashed border-cyan/25 bg-cyan/[0.03] p-3 text-[12px] text-muted-foreground">
        Assistant responses will appear here once the AI service is connected.
      </div>
    </GlassCard>
  );
}

/** Placeholder tile for GIS map / AIS / weather / dataset integrations. */
export function IntegrationPlaceholder({ title, description, icon, height = 220 }: { title: string; description: string; icon?: ReactNode; height?: number }) {
  return (
    <GlassCard>
      <SectionTitle>{title}</SectionTitle>
      <div className="rounded-md border border-dashed border-border grid-bg flex flex-col items-center justify-center text-center px-6" style={{ height }}>
        <div className="w-10 h-10 rounded-xl bg-cyan/10 border border-cyan/25 flex items-center justify-center text-cyan mb-3">
          {icon ?? <Sparkles className="w-4 h-4" />}
        </div>
        <div className="text-[13px]">Integration pending</div>
        <div className="text-[11.5px] text-muted-foreground max-w-sm mt-1">{description}</div>
      </div>
    </GlassCard>
  );
}

export function HelpCard() {
  return (
    <GlassCard>
      <SectionTitle>Help & support</SectionTitle>
      <div className="space-y-2">
        <Link to="/app/settings" className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition">
          <Settings className="w-3.5 h-3.5 text-cyan" /> Workspace settings
        </Link>
        <Link to="/app/notifications" className="flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition">
          <Bell className="w-3.5 h-3.5 text-cyan" /> Notification centre
        </Link>
        <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <CircleHelp className="w-3.5 h-3.5 text-cyan" /> Operations playbook — pending publication
        </span>
        <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <LifeBuoy className="w-3.5 h-3.5 text-cyan" /> Duty desk contact — pending configuration
        </span>
      </div>
    </GlassCard>
  );
}
