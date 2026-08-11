import { GlassCard } from "@/components/common/GlassCard";
import { STAGE_META, type WorkflowEvent } from "@/lib/workflow";
import { roleMeta } from "@/lib/roles";
import { CheckCircle2 } from "lucide-react";

export function ApprovalTimeline({ events, title = "Approval timeline" }: { events: WorkflowEvent[]; title?: string }) {
  return (
    <GlassCard>
      <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-4">{title}</div>
      {events.length === 0 ? (
        <div className="text-sm text-muted-foreground">No workflow activity recorded yet.</div>
      ) : (
        <ol className="relative pl-5">
          <span className="absolute left-[5px] top-1 bottom-1 w-[1px] bg-border" />
          {events.map((e) => (
            <li key={e.id} className="relative pb-4 last:pb-0">
              <span className="absolute -left-5 top-1 w-[11px] h-[11px] rounded-full border border-cyan/50 bg-background flex items-center justify-center">
                <CheckCircle2 className="w-2.5 h-2.5 text-cyan" />
              </span>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-[13px] font-medium text-foreground">{e.action}</span>
                <span className="text-[10.5px] font-mono uppercase tracking-wider text-cyan/80">
                  {STAGE_META[e.stage]?.label ?? e.stage}
                </span>
              </div>
              <div className="text-[11.5px] text-muted-foreground mt-0.5">
                {e.actor_label ?? "System"}
                {e.actor_role && ` · ${roleMeta(e.actor_role).label}`}
                {" · "}
                {new Date(e.created_at).toLocaleString()}
              </div>
              {e.notes && <div className="text-[12.5px] text-foreground/80 mt-1 leading-relaxed">{e.notes}</div>}
            </li>
          ))}
        </ol>
      )}
    </GlassCard>
  );
}