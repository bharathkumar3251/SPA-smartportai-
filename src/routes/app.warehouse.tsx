import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { StatTile } from "@/components/common/StatTile";
import { NoDataCard } from "@/components/common/NoDataCard";
import { BarsChart, C, ChartCard, DonutChart } from "@/components/dash/Charts";
import { ActivityCard, CalendarWidget, HelpCard, NotificationsCard, WorkflowOverview } from "@/components/dash/Widgets";
import { SubmissionWorkspace } from "@/components/workflow/SubmissionWorkspace";
import { StageActions, type StageAction } from "@/components/workflow/StageActions";
import { ContainerBoard } from "@/components/workflow/ContainerBoard";
import { useAllContainers, useAllSubmissions } from "@/hooks/useOps";
import { containerStageBars, stageCounts } from "@/lib/ops-metrics";
import type { Stage } from "@/lib/workflow";
import { Boxes, PackageCheck, Truck, Warehouse, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

export const Route = createFileRoute("/app/warehouse")({
  validateSearch: (search: Record<string, unknown>): { m?: string } => ({
    m: search.m ? String(search.m) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Warehouse Operations — SmartPort AI" },
      { name: "description", content: "Inbound container receipt, storage allocation, live inventory and dispatch preparation for truck collection." },
      { property: "og:title", content: "Warehouse Operations — SmartPort AI" },
      { property: "og:description", content: "Storage allocation, inventory and dispatch readiness inside the port warehouse." },
    ],
  }),
  component: WarehousePage,
});

const QUEUE: Stage[] = ["warehouse_received"];

const ACTIONS: StageAction[] = [
  { label: "Prepare dispatch", stage: "dispatch_ready", action: "Dispatch prepared — pickup requested" },
];

function WarehousePage() {
  const { data: subs, isLoading } = useAllSubmissions();
  const { data: containers } = useAllContainers();
  const rows = subs ?? [];
  const cts = containers ?? [];
  const inbound = cts.filter((c) => c.stage === "warehouse_received");
  const stored = cts.filter((c) => c.stage === "stored");
  const outbound = cts.filter((c) => ["dispatch_ready", "assigned_truck"].includes(c.stage));

  return (
    <div>
      <PageHeader
        eyebrow="Warehouse Manager"
        title="Storage, inventory & dispatch."
        subtitle="Receive unloaded containers, allocate storage, keep inventory current and release consignments for truck collection."
      />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatTile label="Inbound awaiting" icon={ArrowDownToLine} loading={isLoading} value={inbound.length} />
        <StatTile label="In storage" icon={Warehouse} tone="cyan" value={stored.length} />
        <StatTile label="Ready to dispatch" icon={ArrowUpFromLine} tone="violet" value={outbound.length} />
        <StatTile label="Hazardous stored" icon={Boxes} tone="danger" value={stored.filter((c) => c.hazardous).length} />
        <StatTile label="Shipments at warehouse" icon={PackageCheck} tone="success" loading={isLoading}
          value={rows.filter((s) => s.stage === "warehouse_received").length} />
        <StatTile label="Awaiting collection" icon={Truck} tone="warning" loading={isLoading}
          value={rows.filter((s) => s.stage === "dispatch_ready").length} />
      </div>

      <div className="mt-6"><WorkflowOverview activeStage="warehouse_received" counts={stageCounts(rows)} /></div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <ChartCard className="lg:col-span-2" title="Inventory by container stage" height={230}>
          {cts.length === 0 ? <NoDataCard title="No warehouse inventory." reason="Containers appear here once the terminal releases them." />
            : <BarsChart data={containerStageBars(cts)} series={[{ key: "containers", label: "Containers", color: C.violet }]} />}
        </ChartCard>
        <ChartCard title="Storage composition" height={230}>
          {stored.length === 0 ? <NoDataCard title="No stored containers." reason="Allocate storage slots to build the composition view." />
            : <DonutChart data={[
                { name: "General", value: stored.filter((c) => !c.hazardous).length, color: C.success },
                { name: "Hazardous", value: stored.filter((c) => c.hazardous).length, color: C.danger },
              ].filter((d) => d.value > 0)} />}
        </ChartCard>
      </div>

      <div className="mt-4">
        <ContainerBoard
          title="Inbound receipt & storage allocation"
          subtitle="Assign a storage slot to received containers"
          stages={["warehouse_received"]}
          emptyTitle="No warehouse inventory."
          emptyDescription="Containers appear here once the terminal completes unloading."
          exportName="warehouse-inbound.csv"
          fields={[{ key: "storage_slot", label: "Storage slot", required: true }]}
          advance={{ label: "Store container", stage: "stored" }}
        />
      </div>

      <div className="mt-4">
        <ContainerBoard
          title="Dispatch preparation"
          subtitle="Release stored containers for truck collection"
          stages={["stored"]}
          emptyTitle="No stored containers."
          emptyDescription="Allocate storage before preparing a dispatch."
          exportName="warehouse-dispatch.csv"
          fields={[{ key: "destination", label: "Destination" }]}
          advance={{ label: "Mark dispatch ready", stage: "dispatch_ready" }}
        />
      </div>

      <div className="mt-6">
        <SubmissionWorkspace
          stages={QUEUE}
          portal="Warehouse"
          suggestions={["Which consignment is oldest?", "Hazardous storage capacity", "Next pickup window"]}
          emptyTitle="No shipments at the warehouse."
          emptyDescription="Shipments appear once the terminal completes unloading."
          actions={({ submission }) => (
            <StageActions submission={submission} actions={ACTIONS}
              notesLabel="Warehouse notes (storage zone, handling)"
              hint="Preparing dispatch notifies the truck operator with a pickup request." />
          )}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <ActivityCard className="lg:col-span-2" title="Warehouse activity" />
        <div className="space-y-4">
          <NotificationsCard title="Warehouse alerts" />
          <CalendarWidget title="Collection calendar" />
          <HelpCard />
        </div>
      </div>
    </div>
  );
}
