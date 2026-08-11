import { useEffect, useState, type ReactNode } from "react";
import { GlassCard } from "@/components/common/GlassCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ApprovalTimeline } from "./ApprovalTimeline";
import { AiVerificationReport } from "./AiVerificationReport";
import { AiAssistantPanel } from "./AiAssistantPanel";
import { StageBadge, RiskBadge, StageRail } from "./StageBadge";
import { useSubmissions, useSubmissionDetail, useAdvanceStage } from "@/hooks/useWorkflow";
import { docLabel, type Stage, type Submission } from "@/lib/workflow";
import { Ship, Inbox, FileText, Download, Trash2, AlertTriangle, CheckCircle2, Clock, Anchor, Container, Truck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

export type WorkspaceRender = {
  submission: Submission;
  detail: ReturnType<typeof useSubmissionDetail>["data"];
};

export function SubmissionWorkspace({
  stages,
  portal,
  suggestions,
  emptyTitle,
  emptyDescription,
  actions,
  extra,
}: {
  stages?: Stage[];
  portal: string;
  suggestions: string[];
  emptyTitle: string;
  emptyDescription: string;
  actions?: (ctx: WorkspaceRender) => ReactNode;
  extra?: (ctx: WorkspaceRender) => ReactNode;
}) {
  const { data: subs, isLoading } = useSubmissions(stages);
  const [selected, setSelected] = useState<string | null>(null);
  const active = (subs ?? []).find((s) => s.id === selected) ?? (subs ?? [])[0] ?? null;
  const { data: detail } = useSubmissionDetail(active?.id ?? null);
  const qc = useQueryClient();
  const advance = useAdvanceStage();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (active && selected !== active.id) setSelected(active.id);
  }, [active, selected]);

  const aiContext = active
    ? JSON.stringify({
        vessel: active.vessel_name, reference: active.reference, stage: active.stage,
        eta: active.eta, containers: active.container_count, dangerous_goods: active.dangerous_goods,
        risk: active.ai_risk_score, verdict: active.ai_verdict, berth: active.berth_code,
        documents: detail?.documents.map((d) => d.doc_type),
        issues: detail?.verifications[0]?.issues,
      })
    : undefined;

  async function handleDownload(path: string | null, filename: string) {
    if (!path) { toast.error("Document storage path unavailable"); return; }
    try {
      const { data, error } = await supabase.storage.from("shipping-documents").download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not download document");
    }
  }

  async function handleDeleteDoc(id: string, path: string | null) {
    setDeletingId(id);
    try {
      if (path) await supabase.storage.from("shipping-documents").remove([path]);
      const { error } = await supabase.from("submission_documents").delete().eq("id", id);
      if (error) throw error;
      await logAudit("data_deleted", { target_type: "submission_document", target_id: id });
      toast.success("Document deleted");
      void qc.invalidateQueries({ queryKey: ["submission", active?.id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete document");
    } finally {
      setDeletingId(null);
    }
  }

  async function resubmitModification() {
    if (!active) return;
    try {
      await advance.mutateAsync({
        submissionId: active.id,
        stage: "authority_review",
        action: "Resubmitted for Authority Review",
        notes: "Shipping line resubmitted updated document package following modification request.",
        from: active.stage,
      });
      toast.success("Submission resubmitted to Port Authority review");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Resubmission failed");
    }
  }

  return (
    <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-5 items-start">
      <GlassCard className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/70 text-xs uppercase tracking-widest text-muted-foreground font-mono flex items-center justify-between">
          <span>Queue {subs ? `· ${subs.length}` : ""}</span>
          <button
            onClick={() => {
              void qc.invalidateQueries({ queryKey: ["submissions"] });
              if (active) void qc.invalidateQueries({ queryKey: ["submission", active.id] });
            }}
            className="text-[10px] text-cyan hover:underline font-sans"
          >
            Refresh
          </button>
        </div>
        {isLoading ? (
          <div className="p-5 text-sm text-muted-foreground">Loading…</div>
        ) : (subs ?? []).length === 0 ? (
          <div className="p-4">
            <EmptyState icon={<Inbox className="w-5 h-5" />} title={emptyTitle} description={emptyDescription} />
          </div>
        ) : (
          <ul className="max-h-[70vh] overflow-y-auto scrollbar-thin divide-y divide-border/60">
            {(subs ?? []).map((s) => (
              <li key={s.id}>
                <button onClick={() => setSelected(s.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 transition hover:bg-white/[0.04]",
                    active?.id === s.id && "bg-white/[0.06]",
                  )}>
                  <div className="flex items-center gap-2">
                    <Ship className="w-3.5 h-3.5 text-cyan shrink-0" />
                    <span className="text-[13px] font-medium truncate">{s.vessel_name}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5 truncate">
                    {s.reference} · {s.shipping_company}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <StageBadge stage={s.stage} />
                    <RiskBadge score={s.ai_risk_score} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <div className="space-y-5 min-w-0">
        {!active ? (
          <GlassCard>
            <EmptyState icon={<Inbox className="w-6 h-6" />} title={emptyTitle} description={emptyDescription} />
          </GlassCard>
        ) : (
          <>
            <GlassCard strong>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{active.reference}</div>
                  <h2 className="text-lg font-semibold tracking-tight mt-0.5">{active.vessel_name}</h2>
                  <div className="text-[12.5px] text-muted-foreground mt-0.5">
                    {active.shipping_company}
                    {active.imo_number && ` · IMO ${active.imo_number}`}
                    {active.voyage_number && ` · Voyage ${active.voyage_number}`}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StageBadge stage={active.stage} />
                  <RiskBadge score={active.ai_risk_score} />
                </div>
              </div>

              {/* Modification Requested Alert Banner */}
              {active.stage === "modification_requested" && (
                <div className="mt-4 p-3.5 rounded-lg border border-warning/40 bg-warning/10 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-warning font-medium">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Authority Modification Requested</span>
                    </div>
                    <button
                      onClick={resubmitModification}
                      disabled={advance.isPending}
                      className="px-3 py-1 rounded bg-warning text-background font-medium hover:opacity-90 disabled:opacity-50 text-xs inline-flex items-center gap-1"
                    >
                      {advance.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                      Resubmit for Review
                    </button>
                  </div>
                  {active.authority_notes && (
                    <div className="mt-2 text-muted-foreground border-t border-warning/20 pt-2 font-mono text-[11.5px]">
                      Remarks: {active.authority_notes}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <Field label="ETA" value={active.eta ? new Date(active.eta).toLocaleString() : "—"} />
                <Field label="Containers" value={String(active.container_count)} />
                <Field label="Cargo" value={active.cargo_type ?? "—"} />
                <Field label="Dangerous goods" value={active.dangerous_goods ? "Yes" : "No"} />
                <Field label="Origin port" value={active.origin_port ?? "—"} />
                <Field label="Berth" value={active.berth_code ?? "Not assigned"} />
                <Field label="Arrival window" value={
                  active.arrival_window_start
                    ? `${new Date(active.arrival_window_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${
                        active.arrival_window_end ? new Date(active.arrival_window_end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "?"}`
                    : "—"
                } />
                <Field label="AI confidence" value={active.ai_confidence != null ? `${Math.round(active.ai_confidence)}%` : "—"} />
              </div>

              {/* Approval & Stage Matrix */}
              <div className="mt-4 p-3 rounded-lg border border-border/60 bg-white/[0.01] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <StatusItem
                  title="Authority Approval"
                  icon={Clock}
                  value={["authority_approved", "customs_review", "customs_cleared", "final_approved", "berth_assigned", "terminal_scheduled", "unloading", "warehouse_received", "dispatch_ready", "in_transit", "delivered"].includes(active.stage) ? "Approved" : active.stage === "authority_rejected" ? "Rejected" : "Pending"}
                  tone={["authority_approved", "final_approved", "berth_assigned", "delivered"].includes(active.stage) ? "success" : active.stage === "authority_rejected" ? "danger" : "warning"}
                />
                <StatusItem
                  title="Customs Clearance"
                  icon={CheckCircle2}
                  value={["customs_cleared", "final_approved", "berth_assigned", "terminal_scheduled", "unloading", "warehouse_received", "dispatch_ready", "in_transit", "delivered"].includes(active.stage) ? "Cleared" : active.stage === "customs_hold" ? "On Hold" : active.stage === "customs_rejected" ? "Rejected" : "Pending"}
                  tone={["customs_cleared", "final_approved", "berth_assigned", "delivered"].includes(active.stage) ? "success" : active.stage === "customs_hold" ? "warning" : active.stage === "customs_rejected" ? "danger" : "muted"}
                />
                <StatusItem
                  title="Berth Allocation"
                  icon={Anchor}
                  value={active.berth_code ? active.berth_code : "Unassigned"}
                  tone={active.berth_code ? "cyan" : "muted"}
                />
                <StatusItem
                  title="Container Manifest"
                  icon={Container}
                  value={`${detail?.containers.length ?? 0} / ${active.container_count}`}
                  tone={(detail?.containers.length ?? 0) >= active.container_count && active.container_count > 0 ? "success" : "muted"}
                />
              </div>

              <div className="mt-4 pt-4 border-t border-border/60">
                <StageRail stage={active.stage} />
              </div>
              {actions && (
                <div className="mt-4 pt-4 border-t border-border/60">
                  {actions({ submission: active, detail })}
                </div>
              )}
            </GlassCard>

            {extra?.({ submission: active, detail })}

            <div className="grid lg:grid-cols-2 gap-5 items-start">
              <GlassCard>
                <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-3">
                  Submitted documents ({detail?.documents.length ?? 0})
                </div>
                {(detail?.documents.length ?? 0) === 0 ? (
                  <div className="text-sm text-muted-foreground">No documents uploaded.</div>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {detail!.documents.map((d) => {
                      const isExpired = d.expires_on && new Date(d.expires_on) < new Date();
                      return (
                        <li key={d.id} className="py-2.5 flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-cyan shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[12.5px] font-medium truncate">{docLabel(d.doc_type)}</div>
                            <div className="text-[11px] text-muted-foreground font-mono truncate">
                              {d.file_name}
                              {d.file_size != null && ` · ${(d.file_size / 1024).toFixed(0)}KB`}
                              {d.expires_on && (
                                <span className={isExpired ? " text-danger font-semibold ml-1" : " ml-1"}>
                                  · {isExpired ? "EXPIRED" : `exp ${d.expires_on}`}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={cn(
                            "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border",
                            d.status === "verified" ? "border-success/30 bg-success/10 text-success"
                            : d.status === "flagged" ? "border-warning/30 bg-warning/10 text-warning"
                            : d.status === "rejected" ? "border-danger/30 bg-danger/10 text-danger"
                            : "border-border text-muted-foreground"
                          )}>
                            {d.status}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDownload(d.file_path, d.file_name)}
                              title="Download document"
                              className="p-1 rounded hover:bg-white/[0.08] text-muted-foreground hover:text-cyan transition"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDoc(d.id, d.file_path)}
                              disabled={deletingId === d.id}
                              title="Delete document"
                              className="p-1 rounded hover:bg-white/[0.08] text-muted-foreground hover:text-danger transition disabled:opacity-40"
                            >
                              {deletingId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </GlassCard>
              <AiVerificationReport report={detail?.verifications[0]} />
            </div>

            <div className="grid lg:grid-cols-2 gap-5 items-start">
              <ApprovalTimeline events={detail?.events ?? []} />
              <AiAssistantPanel portal={portal} suggestions={suggestions} context={aiContext} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-white/[0.02] px-3 py-2">
      <div className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="text-[12.5px] text-foreground/90 mt-0.5 truncate">{value}</div>
    </div>
  );
}

function StatusItem({
  title, icon: Icon, value, tone,
}: {
  title: string; icon: React.ComponentType<{ className?: string }>; value: string; tone: "success" | "warning" | "danger" | "cyan" | "muted";
}) {
  const tones = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    cyan: "text-cyan",
    muted: "text-muted-foreground",
  };
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-mono">
        <Icon className="w-3 h-3" />
        <span>{title}</span>
      </div>
      <div className={cn("text-[12.5px] font-medium mt-0.5 truncate", tones[tone])}>{value}</div>
    </div>
  );
}