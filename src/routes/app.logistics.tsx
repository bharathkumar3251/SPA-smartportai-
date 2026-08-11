import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { StatTile } from "@/components/common/StatTile";
import { NoDataCard } from "@/components/common/NoDataCard";
import { AreaTrend, C, ChartCard, DonutChart } from "@/components/dash/Charts";
import { ActivityCard, CalendarWidget, HelpCard, NotificationsCard, WorkflowOverview } from "@/components/dash/Widgets";
import { SubmissionWorkspace } from "@/components/workflow/SubmissionWorkspace";
import { StageActions, type StageAction } from "@/components/workflow/StageActions";
import { ContainerBoard } from "@/components/workflow/ContainerBoard";
import { useAllContainers, useAllSubmissions } from "@/hooks/useOps";
import { dailySeries, stageDistribution, stageCounts } from "@/lib/ops-metrics";
import type { Stage } from "@/lib/workflow";
import { Route as RouteIcon, PackageCheck, Timer, Ship, Boxes, Activity } from "lucide-react";

export const Route = createFileRoute("/app/logistics")({
  validateSearch: (search: Record<string, unknown>): { m?: string } => ({
    m: search.m ? String(search.m) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Logistics Control Tower — SmartPort AI" },
      { name: "description", content: "End-to-end shipment tracking, delivery updates and completion across the port supply chain." },
      { property: "og:title", content: "Logistics Control Tower — SmartPort AI" },
      { property: "og:description", content: "Cross-mode shipment visibility from berth to final delivery." },
    ],
  }),
  component: LogisticsPage,
});

const QUEUE: Stage[] = ["in_transit", "dispatch_ready", "delivered"];

function actionsFor(stage: Stage): StageAction[] {
  if (stage === "in_transit") {
    return [{ label: "Complete shipment", stage: "delivered", action: "Shipment delivered and closed" }];
  }
  if (stage === "dispatch_ready") {
    return [{ label: "Mark in transit", stage: "in_transit", action: "Shipment moved to transit" }];
  }
  return [];
}

function LogisticsPage() {
  const { data: subs, isLoading } = useAllSubmissions();
  const { data: containers } = useAllContainers();
  const rows = subs ?? [];
  const cts = containers ?? [];
  const active = rows.filter((s) => !["delivered", "authority_rejected", "customs_rejected", "ai_rejected"].includes(s.stage));
  const delivered = rows.filter((s) => s.stage === "delivered");

  return (
    <div>
      <PageHeader
        eyebrow="Logistics Manager"
        title="End-to-end control tower."
        subtitle="Track every shipment from arrival to final delivery, monitor hand-offs across roles and close completed consignments."
      />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatTile label="Active shipments" icon={Activity} loading={isLoading} value={active.length} />
        <StatTile label="In transit" icon={RouteIcon} tone="cyan" loading={isLoading} value={rows.filter((s) => s.stage === "in_transit").length} />
        <StatTile label="Delivered" icon={PackageCheck} tone="success" loading={isLoading} value={delivered.length} />
        <StatTile label="Awaiting berth" icon={Ship} tone="warning" loading={isLoading}
          value={rows.filter((s) => ["final_approved", "customs_cleared"].includes(s.stage)).length} />
        <StatTile label="Containers moving" icon={Boxes} tone="violet" value={cts.filter((c) => c.stage === "in_transit").length} />
        <StatTile label="Total shipments" icon={Timer} loading={isLoading} value={rows.length} />
      </div>

      <div className="mt-6"><WorkflowOverview activeStage="in_transit" counts={stageCounts(rows)} /></div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <ChartCard className="lg:col-span-2" title="Shipment intake · 14 days" height={230}>
          {rows.length === 0 ? <NoDataCard title="No shipments recorded." reason="Intake volume is charted from submissions created in the platform." />
            : <AreaTrend data={dailySeries(rows, 14, "shipments")} series={[{ key: "shipments", label: "Shipments", color: C.cyan }]} />}
        </ChartCard>
        <ChartCard title="Pipeline distribution" height={230}>
          {rows.length === 0 ? <NoDataCard title="No shipments recorded." reason="Distribution appears once shipments exist." />
            : <DonutChart data={stageDistribution(rows)} />}
        </ChartCard>
      </div>

      <div className="mt-4">
        <ContainerBoard
          title="Delivery tracking"
          subtitle="Confirm final delivery for containers in transit"
          stages={["in_transit"]}
          emptyTitle="No containers in transit."
          emptyDescription="Containers appear here once a truck operator starts a trip."
          exportName="logistics-transit.csv"
          fields={[
            { key: "destination", label: "Destination" },
            { key: "delivered_at", label: "Delivered at", type: "datetime-local" },
          ]}
          advance={{ label: "Confirm delivery", stage: "delivered" }}
        />
      </div>

      <div className="mt-6">
        <SubmissionWorkspace
          stages={QUEUE}
          portal="Logistics"
          suggestions={["Which shipments are delayed?", "Hand-off bottlenecks", "Delivery performance today"]}
          emptyTitle="No shipments to track."
          emptyDescription="Shipments arrive here once the truck operator dispatches a consignment."
          actions={({ submission }) => (
            <StageActions submission={submission} actions={actionsFor(submission.stage)}
              notesLabel="Delivery notes (consignee, POD reference)"
              hint="Completing a shipment closes the workflow and archives the timeline." />
          )}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <ActivityCard className="lg:col-span-2" title="Hand-off activity" />
        <div className="space-y-4">
          <NotificationsCard title="Logistics alerts" />
          <CalendarWidget title="Delivery calendar" />
          <HelpCard />
        </div>
      </div>
    </div>
  );
}
