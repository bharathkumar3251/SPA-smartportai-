import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { StatTile } from "@/components/common/StatTile";
import { NoDataCard } from "@/components/common/NoDataCard";
import { C, ChartCard, DonutChart, BarsChart } from "@/components/dash/Charts";
import { ActivityCard, CalendarWidget, HelpCard, NotificationsCard, WorkflowOverview } from "@/components/dash/Widgets";
import { SubmissionWorkspace } from "@/components/workflow/SubmissionWorkspace";
import { StageActions, type StageAction } from "@/components/workflow/StageActions";
import { DataPanel, StatusBadge } from "@/components/dash/DataPanel";
import { useAllSubmissions } from "@/hooks/useOps";
import { dailySplit, stageCounts } from "@/lib/ops-metrics";
import type { Stage, Submission } from "@/lib/workflow";
import { BadgeCheck, ShieldAlert, FileSearch, Gavel, Boxes, Timer } from "lucide-react";

export const Route = createFileRoute("/app/customs")({
  validateSearch: (search: Record<string, unknown>): { m?: string } => ({
    m: search.m ? String(search.m) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Customs Clearance Portal — SmartPort AI" },
      { name: "description", content: "Risk triage, document verification, inspection remarks and clearance decisions for arriving cargo." },
      { property: "og:title", content: "Customs Clearance Portal — SmartPort AI" },
      { property: "og:description", content: "Risk-based cargo clearance with AI-assisted document verification." },
    ],
  }),
  component: CustomsPage,
});

const QUEUE: Stage[] = ["authority_approved", "customs_review", "customs_hold"];

const ACTIONS: StageAction[] = [
  { label: "Approve clearance", stage: "customs_cleared", action: "Customs cleared", notesField: "customs_notes" },
  { label: "Hold for inspection", stage: "customs_hold", action: "Held for physical inspection",
    notesField: "inspection_notes", requireNotes: true, tone: "warning" },
  { label: "Reject", stage: "customs_rejected", action: "Clearance rejected",
    notesField: "customs_notes", requireNotes: true, tone: "danger" },
];

function CustomsPage() {
  const { data: subs, isLoading } = useAllSubmissions();
  const rows = subs ?? [];
  const queue = rows.filter((s) => QUEUE.includes(s.stage));
  const highRisk = rows.filter((s) => (s.ai_risk_score ?? 0) >= 70);
  const holds = rows.filter((s) => s.stage === "customs_hold");
  const clearedToday = rows.filter((s) => s.stage === "customs_cleared"
    && new Date(s.updated_at).toDateString() === new Date().toDateString());

  const risk = [
    { name: "Low (0–40)", value: rows.filter((s) => s.ai_risk_score != null && s.ai_risk_score <= 40).length, color: C.success },
    { name: "Medium (41–70)", value: rows.filter((s) => (s.ai_risk_score ?? -1) > 40 && (s.ai_risk_score ?? 0) <= 70).length, color: C.warning },
    { name: "High (71+)", value: highRisk.length, color: C.danger },
  ].filter((d) => d.value > 0);

  const decisions = dailySplit(rows, 14,
    { label: "cleared", match: (s) => s.stage === "customs_cleared" || ["final_approval", "final_approved", "berth_assigned", "terminal_scheduled", "unloading", "warehouse_received", "dispatch_ready", "in_transit", "delivered"].includes(s.stage) },
    { label: "held", match: (s) => s.stage === "customs_hold" || s.stage === "customs_rejected" },
  );

  return (
    <div>
      <PageHeader
        eyebrow="Customs Officer"
        title="Cargo clearance & risk triage."
        subtitle="Verify declarations, review AI risk findings, record inspection remarks and issue clearance decisions."
      />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatTile label="Awaiting review" icon={FileSearch} loading={isLoading} value={queue.length} />
        <StatTile label="High risk" icon={ShieldAlert} tone="danger" loading={isLoading} value={highRisk.length} />
        <StatTile label="Holds active" icon={Gavel} tone="warning" loading={isLoading} value={holds.length} />
        <StatTile label="Cleared today" icon={BadgeCheck} tone="success" loading={isLoading} value={clearedToday.length} />
        <StatTile label="Containers declared" icon={Boxes} tone="violet" loading={isLoading}
          value={queue.reduce((n, s) => n + s.container_count, 0)} />
        <StatTile label="Dangerous goods" icon={Timer} tone="cyan" loading={isLoading}
          value={queue.filter((s) => s.dangerous_goods).length} />
      </div>

      <div className="mt-6"><WorkflowOverview activeStage="customs_cleared" counts={stageCounts(rows)} /></div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <ChartCard title="AI risk distribution" height={230}>
          {risk.length === 0 ? <NoDataCard title="No risk scores yet" reason="AI verification has not scored any submission." /> : <DonutChart data={risk} />}
        </ChartCard>
        <ChartCard className="lg:col-span-2" title="Clearances vs holds · 14 days" height={230}>
          {decisions.length === 0 ? <NoDataCard title="No clearance activity" reason="Decisions will be charted once submissions reach customs." />
            : <BarsChart data={decisions} series={[
                { key: "cleared", label: "Cleared", color: C.success },
                { key: "held", label: "Held / rejected", color: C.danger },
              ]} />}
        </ChartCard>
      </div>

      <div className="mt-6">
        <SubmissionWorkspace
          stages={QUEUE}
          portal="Customs"
          suggestions={["Explain the declared cargo risk", "Any manifest mismatch?", "Is the DG declaration complete?"]}
          emptyTitle="No pending clearances."
          emptyDescription="Submissions appear here once the Port Authority approves the document package."
          actions={({ submission }) => (
            <StageActions submission={submission} actions={ACTIONS}
              notesLabel="Clearance / inspection remarks"
              hint="Clearance notifies the Port Authority for final approval; a hold keeps the shipment with customs until inspection is closed." />
          )}
        />
      </div>

      <div className="mt-6">
        <DataPanel
          title="Clearance History & Inspection Log"
          subtitle="All customs decisions recorded across cargo submissions"
          rows={rows.filter((s) => ["customs_cleared", "customs_hold", "customs_rejected", "final_approved", "berth_assigned"].includes(s.stage))}
          loading={isLoading}
          emptyTitle="No clearance history yet"
          filterKey="stage"
          filterLabel="All statuses"
          searchKeys={["reference", "vessel_name", "shipping_company", "customs_notes", "inspection_notes"]}
          exportName="customs-clearance-history.csv"
          columns={[
            { key: "reference", label: "Reference" },
            { key: "vessel_name", label: "Vessel" },
            { key: "shipping_company", label: "Shipping Line" },
            { key: "dangerous_goods", label: "Hazardous", render: (r: Submission) => r.dangerous_goods ? <span className="text-danger font-mono text-[11px]">IMDG</span> : "Standard" },
            { key: "ai_risk_score", label: "Risk Score", align: "right", render: (r: Submission) => r.ai_risk_score == null ? "—" : `${Math.round(r.ai_risk_score)}/100` },
            { key: "customs_notes", label: "Customs Remarks", render: (r: Submission) => r.customs_notes || r.inspection_notes || "—" },
            { key: "stage", label: "Customs Status", render: (r: Submission) => <StatusBadge status={r.stage.replace(/_/g, " ")} /> },
          ]}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <ActivityCard className="lg:col-span-2" title="Clearance activity" />
        <div className="space-y-4">
          <NotificationsCard title="Customs alerts" />
          <CalendarWidget title="Inspection calendar" />
          <HelpCard />
        </div>
      </div>
    </div>
  );
}
