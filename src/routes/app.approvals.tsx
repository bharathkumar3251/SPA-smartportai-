import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { StatTile } from "@/components/common/StatTile";
import { SubmissionWorkspace } from "@/components/workflow/SubmissionWorkspace";
import { StageActions, type StageAction } from "@/components/workflow/StageActions";
import { WorkflowOverview } from "@/components/dash/Widgets";
import { useAllSubmissions } from "@/hooks/useOps";
import { useAdvanceStage } from "@/hooks/useWorkflow";
import { stageCounts } from "@/lib/ops-metrics";
import type { Stage, Submission } from "@/lib/workflow";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Anchor, ClipboardCheck, FileCheck2, ShieldAlert, Loader2 } from "lucide-react";


export const Route = createFileRoute("/app/approvals")({
  head: () => ({
    meta: [
      { title: "Document Approval — SmartPort AI" },
      { name: "description", content: "Port Authority review of AI-verified vessel and cargo document submissions, clearance sign-off and berth allocation." },
      { property: "og:title", content: "Document Approval — SmartPort AI" },
      { property: "og:description", content: "Review submissions, record decisions and allocate berths in the SmartPort AI workflow." },
    ],
  }),
  component: ApprovalsPage,
});

const QUEUE_STAGES: Stage[] = [
  "uploaded", "ai_verification", "ai_needs_review", "authority_review",
  "modification_requested", "customs_cleared", "final_approval", "final_approved",
];

function actionsFor(stage: Stage): StageAction[] {
  if (["uploaded", "ai_verification", "ai_needs_review", "authority_review", "modification_requested"].includes(stage)) {
    return [
      { label: "Approve", stage: "authority_approved", action: "Authority approved", notesField: "authority_notes",
        tone: "primary" },
      { label: "Request modification", stage: "modification_requested", action: "Modification requested",
        notesField: "authority_notes", requireNotes: true, tone: "warning" },
      { label: "Reject", stage: "authority_rejected", action: "Authority rejected",
        notesField: "authority_notes", requireNotes: true, tone: "danger" },
    ];
  }
  if (stage === "customs_cleared" || stage === "final_approval") {
    return [
      { label: "Grant final approval", stage: "final_approved", action: "Final approval granted", notesField: "authority_notes" },
      { label: "Reject", stage: "authority_rejected", action: "Rejected at final approval",
        notesField: "authority_notes", requireNotes: true, tone: "danger" },
    ];
  }
  return [];
}

function ApprovalsPage() {
  const { data: subs, isLoading } = useAllSubmissions();
  const rows = subs ?? [];
  const queue = rows.filter((s) => QUEUE_STAGES.includes(s.stage));
  const today = (s: Submission) => new Date(s.updated_at).toDateString() === new Date().toDateString();

  return (
    <div>
      <PageHeader
        eyebrow="Port Authority"
        title="Document approval queue."
        subtitle="Every submission arriving from AI verification, with risk scoring, the document set, decision controls and berth allocation."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Awaiting review" icon={ClipboardCheck} loading={isLoading} value={queue.length} />
        <StatTile label="Approved (today)" icon={FileCheck2} tone="success" loading={isLoading}
          value={rows.filter((s) => today(s) && ["authority_approved", "final_approved", "berth_assigned"].includes(s.stage)).length} />
        <StatTile label="Rejected" icon={ShieldAlert} tone="danger" loading={isLoading}
          value={rows.filter((s) => s.stage === "authority_rejected").length} />
        <StatTile label="Berths allocated" icon={Anchor} tone="violet" loading={isLoading}
          value={rows.filter((s) => !!s.berth_code).length} />
      </div>

      <div className="mt-6"><WorkflowOverview activeStage="authority_review" counts={stageCounts(rows)} /></div>

      <div className="mt-6">
        <SubmissionWorkspace
          stages={QUEUE_STAGES}
          portal="Port Authority"
          suggestions={["Summarise the risk drivers", "Are any certificates expired?", "Compare with the previous call"]}
          emptyTitle="No pending approvals."
          emptyDescription="Submissions appear here as soon as a shipping line uploads its document package."
          actions={({ submission }) => (
            <StageActions
              submission={submission}
              actions={actionsFor(submission.stage)}
              hint="Approval moves the submission to customs clearance. Every decision is written to the shipment timeline and notifies the next stakeholder."
            />
          )}
          extra={({ submission }) =>
            submission.stage === "final_approved" || submission.berth_code ? (
              <BerthPanel submission={submission} />
            ) : null
          }
        />
      </div>
    </div>
  );
}

function BerthPanel({ submission }: { submission: Submission }) {
  const advance = useAdvanceStage();
  const [berth, setBerth] = useState(submission.berth_code ?? "");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [berthOptions, setBerthOptions] = useState<{ code: string; terminal_name: string; status: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("berths")
        .select("code, terminal_name, status")
        .order("code", { ascending: true });
      if (!cancelled) {
        const list = data ?? [];
        setBerthOptions(list);
        if (list.length > 0 && !submission.berth_code) {
          setBerth(list[0].code);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [submission.berth_code]);

  async function allocate() {
    if (!berth.trim()) { toast.error("Berth selection is required"); return; }
    if (start && end && new Date(end) <= new Date(start)) { toast.error("Arrival window end must be after the start"); return; }
    try {
      await advance.mutateAsync({
        submissionId: submission.id,
        stage: "berth_assigned",
        action: "Berth allocated",
        notes: `Berth ${berth.trim()}`,
        patch: {
          berth_code: berth.trim(),
          arrival_window_start: start ? new Date(start).toISOString() : null,
          arrival_window_end: end ? new Date(end).toISOString() : null,
        },
      });
      toast.success("Berth allocated — terminal notified");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Allocation failed");
    }
  }

  return (
    <GlassCard>
      <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-4">Berth allocation & arrival slot</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <label className="block">
          <span className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">Select PSA Berth *</span>
          <select
            value={berth}
            onChange={(e) => setBerth(e.target.value)}
            className="mt-1.5 w-full h-9 rounded-md bg-white/[0.03] border border-border px-2.5 text-[12.5px] outline-none focus:border-cyan/60"
          >
            {berthOptions.map((b) => (
              <option key={b.code} value={b.code}>
                {b.code} · {b.terminal_name} ({b.status})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">Slot start</span>
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)}
            className="mt-1.5 w-full h-9 rounded-md bg-white/[0.03] border border-border px-2.5 text-[12.5px] outline-none focus:border-cyan/60" />
        </label>
        <label className="block">
          <span className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">Slot end</span>
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)}
            className="mt-1.5 w-full h-9 rounded-md bg-white/[0.03] border border-border px-2.5 text-[12.5px] outline-none focus:border-cyan/60" />
        </label>
        <button onClick={allocate} disabled={advance.isPending}
          className="h-9 px-4 rounded-md bg-gradient-to-r from-cyan to-violet text-background text-[12.5px] inline-flex items-center justify-center gap-1.5 disabled:opacity-50">
          {advance.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Allocate berth
        </button>
      </div>
      <p className="mt-3 text-[11.5px] text-muted-foreground">
        Allocating a berth notifies the terminal operator and unlocks unloading scheduling.
      </p>
    </GlassCard>
  );
}

