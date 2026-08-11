import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { StatTile } from "@/components/common/StatTile";
import { NoDataCard } from "@/components/common/NoDataCard";
import { BarsChart, C, ChartCard, DonutChart } from "@/components/dash/Charts";
import { ActivityCard, CalendarWidget, HelpCard, NotificationsCard, WorkflowOverview } from "@/components/dash/Widgets";
import { SubmissionWorkspace } from "@/components/workflow/SubmissionWorkspace";
import { StageActions, type StageAction } from "@/components/workflow/StageActions";
import { ContainerBoard } from "@/components/workflow/ContainerBoard";
import { GlassCard } from "@/components/common/GlassCard";
import { useAllContainers, useAllSubmissions, useRegisterContainers } from "@/hooks/useOps";
import { containerStageBars, stageCounts } from "@/lib/ops-metrics";
import type { Stage, Submission } from "@/lib/workflow";
import { Anchor, Boxes, Container, Loader2, Ship, Wrench } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/terminal")({
  validateSearch: (search: Record<string, unknown>): { m?: string } => ({
    m: search.m ? String(search.m) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Terminal Operations — SmartPort AI" },
      { name: "description", content: "Unloading schedules, crane assignment, yard allocation and container hand-off to the warehouse." },
      { property: "og:title", content: "Terminal Operations — SmartPort AI" },
      { property: "og:description", content: "Berth, crane and yard operations for allocated vessels." },
    ],
  }),
  component: TerminalPage,
});

const QUEUE: Stage[] = ["berth_assigned", "terminal_scheduled", "unloading"];

function actionsFor(stage: Stage): StageAction[] {
  if (stage === "berth_assigned") {
    return [{ label: "Create unloading schedule", stage: "terminal_scheduled", action: "Unloading scheduled" }];
  }
  if (stage === "terminal_scheduled") {
    return [{ label: "Start unloading", stage: "unloading", action: "Unloading started" }];
  }
  if (stage === "unloading") {
    return [{ label: "Mark unloading complete", stage: "warehouse_received", action: "Unloading completed — handed to warehouse" }];
  }
  return [];
}

function TerminalPage() {
  const { data: subs, isLoading } = useAllSubmissions();
  const { data: containers } = useAllContainers();
  const rows = subs ?? [];
  const queue = rows.filter((s) => QUEUE.includes(s.stage));
  const cts = containers ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Terminal Operator"
        title="Berth, crane & yard operations."
        subtitle="Receive approved vessels, build the unloading schedule, assign cranes and yard slots, then hand containers to the warehouse."
      />

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatTile label="Vessels allocated" icon={Anchor} loading={isLoading} value={rows.filter((s) => s.stage === "berth_assigned").length} />
        <StatTile label="Scheduled" icon={Ship} tone="cyan" loading={isLoading} value={rows.filter((s) => s.stage === "terminal_scheduled").length} />
        <StatTile label="Unloading now" icon={Wrench} tone="warning" loading={isLoading} value={rows.filter((s) => s.stage === "unloading").length} />
        <StatTile label="Containers registered" icon={Container} tone="violet" value={cts.length} />
        <StatTile label="In yard" icon={Boxes} tone="success" value={cts.filter((c) => c.stage === "yard").length} />
        <StatTile label="Handed to warehouse" icon={Boxes} value={cts.filter((c) => ["warehouse_received", "stored", "dispatch_ready", "assigned_truck", "in_transit", "delivered"].includes(c.stage)).length} />
      </div>

      <div className="mt-6"><WorkflowOverview activeStage="terminal_scheduled" counts={stageCounts(rows)} /></div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <ChartCard className="lg:col-span-2" title="Containers by operational stage" height={230}>
          {cts.length === 0 ? <NoDataCard title="No containers registered" reason="Register the container manifest for a scheduled vessel to populate the yard view." />
            : <BarsChart data={containerStageBars(cts)} series={[{ key: "containers", label: "Containers", color: C.cyan }]} />}
        </ChartCard>
        <ChartCard title="Hazardous split" height={230}>
          {cts.length === 0 ? <NoDataCard title="No containers registered" reason="Hazardous split appears once containers exist." />
            : <DonutChart data={[
                { name: "Standard", value: cts.filter((c) => !c.hazardous).length, color: C.cyan },
                { name: "IMDG", value: cts.filter((c) => c.hazardous).length, color: C.danger },
              ].filter((d) => d.value > 0)} />}
        </ChartCard>
      </div>

      <div className="mt-6">
        <SubmissionWorkspace
          stages={QUEUE}
          portal="Terminal"
          suggestions={["Optimal crane allocation?", "Which vessel unloads first?", "Yard capacity risk"]}
          emptyTitle="No vessels available."
          emptyDescription="Vessels appear here once the Port Authority allocates a berth."
          actions={({ submission }) => (
            <StageActions submission={submission} actions={actionsFor(submission.stage)}
              notesLabel="Operational notes (crane, gang, sequence)"
              hint="Completing unloading notifies the warehouse manager." />
          )}
          extra={({ submission }) => <ManifestPanel submission={submission} />}
        />
      </div>

      <div className="mt-4">
        <ContainerBoard
          title="Yard & crane assignment"
          subtitle="Select containers to assign a crane, unloading gang and yard slot"
          stages={["at_vessel", "unloading", "yard"]}
          emptyTitle="No containers at the terminal."
          emptyDescription="Register a vessel's container manifest to start yard operations."
          exportName="terminal-containers.csv"
          fields={[
            { key: "crane_id", label: "Crane" },
            { key: "unloading_team", label: "Gang" },
            { key: "yard_slot", label: "Yard slot" },
          ]}
          advance={{ label: "Assign to yard", stage: "yard" }}
        />
      </div>

      <div className="mt-4">
        <ContainerBoard
          title="Hand-off to warehouse"
          subtitle="Containers cleared from the yard are released to the warehouse"
          stages={["yard"]}
          emptyTitle="No containers ready for hand-off."
          emptyDescription="Assign containers to a yard slot first."
          exportName="terminal-handoff.csv"
          advance={{ label: "Release to warehouse", stage: "warehouse_received" }}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <ActivityCard className="lg:col-span-2" title="Terminal activity" />
        <div className="space-y-4">
          <NotificationsCard title="Terminal alerts" />
          <CalendarWidget title="Berth calendar" />
          <HelpCard />
        </div>
      </div>
    </div>
  );
}

function ManifestPanel({ submission }: { submission: Submission }) {
  const register = useRegisterContainers();
  const { data: containers } = useAllContainers();
  const mine = (containers ?? []).filter((c) => c.submission_id === submission.id);
  const remaining = Math.max(0, submission.container_count - mine.length);

  return (
    <GlassCard>
      <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-3">Container manifest</div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[12.5px] text-muted-foreground">
          {mine.length} of {submission.container_count} declared containers registered
          {remaining === 0 && submission.container_count > 0 ? " — manifest complete." : "."}
        </div>
        <button
          onClick={async () => {
            if (remaining === 0) { toast.info("Manifest already complete"); return; }
            try {
              const n = await register.mutateAsync({ submission, count: remaining });
              toast.success(`${n} container records created`);
            } catch (e) { toast.error(e instanceof Error ? e.message : "Could not register containers"); }
          }}
          disabled={register.isPending || remaining === 0}
          className="h-9 px-3.5 rounded-md border border-cyan/40 bg-cyan/10 text-cyan text-[12.5px] inline-flex items-center gap-1.5 disabled:opacity-50">
          {register.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Register {remaining || ""} container{remaining === 1 ? "" : "s"}
        </button>
      </div>
    </GlassCard>
  );
}
