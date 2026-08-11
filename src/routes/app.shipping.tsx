import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { StatTile } from "@/components/common/StatTile";
import { NoDataCard } from "@/components/common/NoDataCard";
import { AreaTrend, C, ChartCard, DonutChart } from "@/components/dash/Charts";
import { DataPanel, StatusBadge } from "@/components/dash/DataPanel";
import { ContainerBoard } from "@/components/workflow/ContainerBoard";
import { ActivityCard, CalendarWidget, HelpCard, NotificationsCard, WorkflowOverview } from "@/components/dash/Widgets";
import { useAllSubmissions } from "@/hooks/useOps";
import { dailySeries, stageCounts, stageDistribution } from "@/lib/ops-metrics";
import { STAGE_META } from "@/lib/workflow";
import { Ship, FileCheck2, FileClock, Boxes, AlertTriangle, Plus } from "lucide-react";

export const Route = createFileRoute("/app/shipping")({
  validateSearch: (search: Record<string, unknown>): { m?: string } => ({
    m: search.m ? String(search.m) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shipping Line Portal — SmartPort AI" },
      { name: "description", content: "Voyage submissions, document approval status, AI verification results and authority remarks for your fleet." },
      { property: "og:title", content: "Shipping Line Portal — SmartPort AI" },
      { property: "og:description", content: "Track voyage document approvals end to end." },
    ],
  }),
  component: ShippingPage,
});

function ShippingPage() {
  const { m } = Route.useSearch();
  const { data: subs, isLoading } = useAllSubmissions();
  const rows = subs ?? [];
  const pending = rows.filter((s) => !["delivered", "authority_rejected", "customs_rejected", "ai_rejected"].includes(s.stage));
  const rejected = rows.filter((s) => ["authority_rejected", "customs_rejected", "ai_rejected", "modification_requested"].includes(s.stage));
  const approved = rows.filter((s) => ["authority_approved", "customs_cleared", "final_approved", "berth_assigned"].includes(s.stage));

  return (
    <div>
      <PageHeader
        eyebrow="Shipping Company"
        title={
          m === "submissions" ? "My Submissions"
          : m === "ai-verification" ? "AI Verification Log"
          : m === "approvals" ? "Approval Tracking"
          : m === "containers" ? "Container Cargo Tracking"
          : m === "tracking" ? "Fleet Tracking"
          : "Fleet & Voyage Overview"
        }
        subtitle="Every submission your line has filed, with AI verification results, authority and customs remarks and live approval status."
        actions={
          <Link to="/app/documents" className="h-9 px-3 rounded-md bg-gradient-to-r from-cyan to-violet text-background text-sm inline-flex items-center gap-1.5 font-medium">
            <Plus className="w-4 h-4" /> New submission
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatTile label="Submissions" icon={Ship} loading={isLoading} value={rows.length} />
        <StatTile label="In progress" icon={FileClock} tone="cyan" loading={isLoading} value={pending.length} />
        <StatTile label="Approved" icon={FileCheck2} tone="success" loading={isLoading} value={approved.length} />
        <StatTile label="Action required" icon={AlertTriangle} tone="danger" loading={isLoading} value={rejected.length} />
        <StatTile label="Containers declared" icon={Boxes} tone="violet" loading={isLoading}
          value={rows.reduce((n, s) => n + s.container_count, 0)} />
      </div>

      {m === "containers" ? (
        <div className="mt-6">
          <ContainerBoard
            title="Fleet Container Tracking"
            subtitle="Live status of container cargo moving through terminal, yard, warehouse, and truck dispatch"
            stages={["at_vessel", "unloading", "yard", "warehouse_received", "stored", "dispatch_ready", "assigned_truck", "in_transit", "delivered"]}
            emptyTitle="No container cargo tracked"
            emptyDescription="Registered container manifests will populate container status rows here."
            exportName="fleet-containers.csv"
          />
        </div>
      ) : m === "ai-verification" ? (
        <div className="mt-6 space-y-4">
          <GlassCard>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-3">AI Verification Summary</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-white/[0.02] border-b border-border/70 text-muted-foreground font-mono uppercase">
                  <tr>
                    <th className="text-left p-2.5">Reference</th>
                    <th className="text-left p-2.5">Vessel</th>
                    <th className="text-left p-2.5">IMO</th>
                    <th className="text-right p-2.5">AI Risk Score</th>
                    <th className="text-right p-2.5">Confidence</th>
                    <th className="text-left p-2.5 pl-4">AI Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 font-mono">
                  {rows.map((s) => (
                    <tr key={s.id} className="hover:bg-white/[0.02]">
                      <td className="p-2.5 text-foreground font-medium">{s.reference}</td>
                      <td className="p-2.5 text-muted-foreground">{s.vessel_name}</td>
                      <td className="p-2.5 text-muted-foreground">{s.imo_number || "—"}</td>
                      <td className="p-2.5 text-right font-medium">
                        {s.ai_risk_score == null ? "—" : `${Math.round(s.ai_risk_score)}/100`}
                      </td>
                      <td className="p-2.5 text-right">
                        {s.ai_confidence == null ? "—" : `${Math.round(s.ai_confidence)}%`}
                      </td>
                      <td className="p-2.5 pl-4">
                        {s.ai_verdict ? (
                          <span className={s.ai_verdict === "verified" ? "text-success font-semibold" : s.ai_verdict === "rejected" ? "text-danger font-semibold" : "text-warning font-semibold"}>
                            {s.ai_verdict.replace(/_/g, " ")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Pending run</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      ) : m === "approvals" ? (
        <div className="mt-6 space-y-6">
          <WorkflowOverview activeStage="uploaded" counts={stageCounts(rows)} />
          <DataPanel
            title="Approval Pipeline Status"
            subtitle="Track approval progress across Port Authority, Customs Clearance, Berth Assignment and Delivery"
            rows={rows}
            loading={isLoading}
            emptyTitle="No submissions."
            filterKey="stage"
            filterLabel="All stages"
            searchKeys={["reference", "vessel_name", "shipping_company"]}
            exportName="approval-tracking.csv"
            columns={[
              { key: "reference", label: "Reference", render: (r) => <span className="font-mono text-[12px]">{r.reference}</span> },
              { key: "vessel_name", label: "Vessel" },
              { key: "berth_code", label: "Berth", render: (r) => r.berth_code || "Unassigned" },
              { key: "authority_notes", label: "Authority Remarks", render: (r) => r.authority_notes || "—" },
              { key: "customs_notes", label: "Customs Remarks", render: (r) => r.customs_notes || "—" },
              { key: "stage", label: "Approval Stage", render: (r) => <StatusBadge status={STAGE_META[r.stage].label} /> },
            ]}
          />
        </div>
      ) : (
        <>
          <div className="mt-6"><WorkflowOverview activeStage="uploaded" counts={stageCounts(rows)} /></div>

          <div className="grid lg:grid-cols-3 gap-4 mt-6">
            <ChartCard className="lg:col-span-2" title="Submissions filed · 14 days" height={230}>
              {rows.length === 0 ? <NoDataCard title="No submissions yet." reason="Create a voyage submission to start tracking approvals." />
                : <AreaTrend data={dailySeries(rows, 14, "submissions")} series={[{ key: "submissions", label: "Submissions", color: C.cyan }]} />}
            </ChartCard>
            <ChartCard title="Approval pipeline" height={230}>
              {rows.length === 0 ? <NoDataCard title="No submissions yet." reason="Pipeline distribution appears once you file a submission." />
                : <DonutChart data={stageDistribution(rows)} />}
            </ChartCard>
          </div>

          <div className="mt-4">
            <DataPanel
              title="Voyage submissions"
              subtitle="Select a submission in the document portal to upload files or read remarks"
              rows={rows}
              loading={isLoading}
              emptyTitle="No uploaded documents."
              filterKey="stage"
              filterLabel="All stages"
              searchKeys={["reference", "vessel_name", "imo_number", "shipping_company"]}
              exportName="shipping-submissions.csv"
              columns={[
                { key: "reference", label: "Reference", render: (r) => <span className="font-mono text-[12px]">{r.reference}</span> },
                { key: "vessel_name", label: "Vessel" },
                { key: "imo_number", label: "IMO" },
                { key: "eta", label: "ETA", render: (r) => r.eta ? new Date(r.eta).toLocaleString() : "—" },
                { key: "container_count", label: "Containers", align: "right" },
                { key: "ai_risk_score", label: "AI risk", align: "right", render: (r) => r.ai_risk_score == null ? "—" : String(Math.round(r.ai_risk_score)) },
                { key: "stage", label: "Status", render: (r) => <StatusBadge status={STAGE_META[r.stage].label} /> },
              ]}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mt-4">
            <ActivityCard className="lg:col-span-2" title="Submission activity" />
            <div className="space-y-4">
              <NotificationsCard title="Approval alerts" />
              <CalendarWidget title="Voyage calendar" />
              <HelpCard />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
