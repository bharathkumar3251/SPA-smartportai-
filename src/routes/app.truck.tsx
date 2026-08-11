import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { StatTile } from "@/components/common/StatTile";
import { NoDataCard } from "@/components/common/NoDataCard";
import { BarsChart, C, ChartCard, DonutChart } from "@/components/dash/Charts";
import { ActivityCard, CalendarWidget, HelpCard, IntegrationPlaceholder, NotificationsCard, WorkflowOverview } from "@/components/dash/Widgets";
import { SubmissionWorkspace } from "@/components/workflow/SubmissionWorkspace";
import { StageActions, type StageAction } from "@/components/workflow/StageActions";
import { ContainerBoard } from "@/components/workflow/ContainerBoard";
import { useAllContainers, useAllSubmissions } from "@/hooks/useOps";
import { containerStageBars, stageCounts } from "@/lib/ops-metrics";
import type { Stage } from "@/lib/workflow";
import { Truck, DoorOpen, Route as RouteIcon, CircleCheck, Boxes, UserCheck } from "lucide-react";

export const Route = createFileRoute("/app/truck")({
  validateSearch: (search: Record<string, unknown>): { m?: string } => ({
    m: search.m ? String(search.m) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Trucking Portal — SmartPort AI" },
      { name: "description", content: "Pickup requests, truck and driver assignment, trip status updates and delivery hand-off to logistics." },
      { property: "og:title", content: "Trucking Portal — SmartPort AI" },
      { property: "og:description", content: "Fleet dispatch and trip tracking for port hauliers." },
    ],
  }),
  component: TruckPage,
});

const QUEUE: Stage[] = ["dispatch_ready"];

const ACTIONS: StageAction[] = [
  { label: "Dispatch shipment", stage: "in_transit", action: "Shipment dispatched — in transit" },
];

function TruckPage() {
  const { data: subs, isLoading } = useAllSubmissions();
  const { data: containers } = useAllContainers();
  const rows = subs ?? [];
  const cts = containers ?? [];
  const pending = cts.filter((c) => c.stage === "dispatch_ready");
  const assigned = cts.filter((c) => c.stage === "assigned_truck");
  const transit = cts.filter((c) => c.stage === "in_transit");
  const delivered = cts.filter((c) => c.stage === "delivered");
  const plates = new Set(cts.map((c) => c.truck_plate).filter(Boolean));
  const drivers = new Set(cts.map((c) => c.driver_name).filter(Boolean));

  return (
    <div>
      <PageHeader
        eyebrow="Truck Operator"
        title="Pickup requests & fleet dispatch."
        subtitle="Accept pickup requests from the warehouse, assign trucks and drivers, update trip status and hand deliveries to logistics."
      />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatTile label="Pickup requests" icon={DoorOpen} loading={isLoading} value={pending.length} />
        <StatTile label="Assigned" icon={Truck} tone="cyan" value={assigned.length} />
        <StatTile label="In transit" icon={RouteIcon} tone="warning" value={transit.length} />
        <StatTile label="Delivered" icon={CircleCheck} tone="success" value={delivered.length} />
        <StatTile label="Trucks in use" icon={Boxes} tone="violet" value={plates.size} />
        <StatTile label="Drivers assigned" icon={UserCheck} value={drivers.size} />
      </div>

      <div className="mt-6"><WorkflowOverview activeStage="dispatch_ready" counts={stageCounts(rows)} /></div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <ChartCard className="lg:col-span-2" title="Container movements by stage" height={230}>
          {cts.length === 0 ? <NoDataCard title="No truck assignments." reason="Assignments appear once the warehouse releases containers for collection." />
            : <BarsChart data={containerStageBars(cts)} series={[{ key: "containers", label: "Containers", color: C.cyan }]} />}
        </ChartCard>
        <ChartCard title="Trip status" height={230}>
          {cts.length === 0 ? <NoDataCard title="No trips recorded." reason="Trip status is derived from assigned containers." />
            : <DonutChart data={[
                { name: "Awaiting pickup", value: pending.length, color: C.warning },
                { name: "Assigned", value: assigned.length, color: C.cyan },
                { name: "In transit", value: transit.length, color: C.violet },
                { name: "Delivered", value: delivered.length, color: C.success },
              ].filter((d) => d.value > 0)} />}
        </ChartCard>
      </div>

      <div className="mt-4">
        <ContainerBoard
          title="Pickup requests"
          subtitle="Assign a truck, driver and collection window"
          stages={["dispatch_ready"]}
          emptyTitle="No truck assignments."
          emptyDescription="Pickup requests arrive when the warehouse prepares a dispatch."
          exportName="truck-pickups.csv"
          fields={[
            { key: "truck_plate", label: "Truck plate", required: true },
            { key: "driver_name", label: "Driver", required: true },
            { key: "pickup_at", label: "Pickup time", type: "datetime-local" },
          ]}
          advance={{ label: "Assign truck", stage: "assigned_truck" }}
        />
      </div>

      <div className="mt-4">
        <ContainerBoard
          title="Trip status"
          subtitle="Start the trip once the container leaves the warehouse"
          stages={["assigned_truck"]}
          emptyTitle="No assigned trips."
          emptyDescription="Assign a truck and driver to a pickup request first."
          exportName="truck-trips.csv"
          fields={[{ key: "destination", label: "Destination" }]}
          advance={{ label: "Start trip", stage: "in_transit" }}
        />
      </div>

      <div className="mt-6">
        <SubmissionWorkspace
          stages={QUEUE}
          portal="Trucking"
          suggestions={["Best collection window?", "Which trips are at risk?", "Fleet utilisation today"]}
          emptyTitle="No pickup requests."
          emptyDescription="Requests appear when the warehouse marks a consignment ready for dispatch."
          actions={({ submission }) => (
            <StageActions submission={submission} actions={ACTIONS}
              notesLabel="Dispatch notes (truck, driver, route)"
              hint="Dispatching the shipment notifies the logistics manager." />
          )}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <ActivityCard className="lg:col-span-2" title="Dispatch log" />
        <div className="space-y-4">
          <NotificationsCard title="Dispatch alerts" />
          <CalendarWidget title="Slot calendar" />
          <GlassCard>
            <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground font-medium mb-2">Route &amp; GPS Intelligence</div>
            <NoDataCard
              title="Live Navigation Offline"
              reason="Navigation data unavailable from connected public source"
            />
          </GlassCard>
          <HelpCard />
        </div>
      </div>
    </div>
  );
}
