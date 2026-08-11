import { useState } from "react";
import { useAdvanceStage } from "@/hooks/useWorkflow";
import { useAuth } from "@/hooks/useAuth";
import { checkSubmissionTransition } from "@/lib/status-engine";
import type { Stage, Submission } from "@/lib/workflow";
import { STAGE_META } from "@/lib/workflow";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type StageAction = {
  label: string;
  stage: Stage;
  tone?: "primary" | "danger" | "warning" | "neutral";
  action?: string;
  requireNotes?: boolean;
  patch?: Record<string, unknown>;
  notesField?: "authority_notes" | "customs_notes" | "inspection_notes";
};

/** Decision bar: writes the new stage, remarks and a timeline event to the database. */
export function StageActions({
  submission,
  actions,
  notesLabel = "Remarks (visible to the shipping line)",
  hint,
}: {
  submission: Submission;
  actions: StageAction[];
  notesLabel?: string;
  hint?: string;
}) {
  const advance = useAdvanceStage();
  const { roles } = useAuth();
  const [notes, setNotes] = useState("");

  // Only surface decisions the current role may legally take from this stage —
  // no dead buttons, and the state machine stays the single source of truth.
  const permitted = actions.filter((a) => checkSubmissionTransition(submission.stage, a.stage, roles).ok);

  if (permitted.length === 0) {
    return (
      <p className="text-[12.5px] text-muted-foreground">
        {actions.length === 0
          ? "No action required at this stage — currently "
          : "Your role cannot act on this shipment at its current status — currently "}
        <span className="text-cyan">{STAGE_META[submission.stage].label}</span>.
      </p>
    );
  }

  async function run(a: StageAction) {
    if (a.requireNotes && !notes.trim()) {
      toast.error("Remarks are required for this decision");
      return;
    }
    const patch = { ...(a.patch ?? {}) };
    if (a.notesField && notes.trim()) patch[a.notesField] = notes.trim();
    const check = checkSubmissionTransition(submission.stage, a.stage, roles);
    if (!check.ok) { toast.error(check.reason); return; }
    try {
      await advance.mutateAsync({
        submissionId: submission.id,
        stage: a.stage,
        from: submission.stage,
        action: a.action ?? a.label,
        notes: notes.trim() || undefined,
        patch,
      });
      toast.success(`${a.label} recorded`, { description: `${submission.reference} → ${STAGE_META[a.stage].label}` });
      setNotes("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update the submission");
    }
  }

  return (
    <div>
      <label className="block">
        <span className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">{notesLabel}</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={1000}
          className="mt-1.5 w-full rounded-md bg-white/[0.03] border border-border px-2.5 py-2 text-[12.5px] outline-none focus:border-cyan/60" />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        {permitted.map((a) => (
          <button key={a.label} onClick={() => run(a)} disabled={advance.isPending}
            className={cn(
              "h-9 px-3.5 rounded-md text-[12.5px] inline-flex items-center gap-1.5 disabled:opacity-50 transition",
              a.tone === "danger" ? "border border-danger/40 text-danger hover:bg-danger/10"
                : a.tone === "warning" ? "border border-warning/40 text-warning hover:bg-warning/10"
                : a.tone === "neutral" ? "border border-border/70 hover:border-cyan/40"
                : "bg-gradient-to-r from-cyan to-violet text-background",
            )}>
            {advance.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {a.label}
          </button>
        ))}
      </div>
      {hint && <p className="mt-2.5 text-[11.5px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
