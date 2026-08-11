import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { Pill } from "@/components/common/DataTable";
import { motion } from "framer-motion";
import { Anchor, Ship, Warehouse, Truck as TruckIcon, Route as RouteIcon } from "lucide-react";

export const Route = createFileRoute("/app/live-map")({
  head: () => ({ meta: [{ title: "Live Map — SmartPort AI" }] }),
  component: LiveMap,
});

function LiveMap() {
  const vessels = Array.from({ length: 14 }).map((_, i) => ({
    id: i,
    x: 10 + (i * 37) % 80,
    y: 15 + (i * 23) % 70,
    kind: (["vessel","port","yard","truck"] as const)[i % 4],
  }));
  return (
    <div>
      <PageHeader eyebrow="Global Live Map" title="Fleet, ports, gates and routes."
        subtitle="Interactive map with clustered vessels, port infrastructure, warehouses and truck gates."
        actions={
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-lg glass text-xs">Vessels</button>
            <button className="px-3 py-2 rounded-lg glass text-xs">Routes</button>
            <button className="px-3 py-2 rounded-lg bg-gradient-to-r from-cyan to-violet text-background text-xs">Layers</button>
          </div>
        }
      />

      <GlassCard className="p-0 overflow-hidden">
        <div className="relative aspect-[16/9] bg-gradient-to-br from-[oklch(0.14_0.06_260)] to-[oklch(0.10_0.05_270)]">
          {/* grid */}
          <div className="absolute inset-0 grid-bg opacity-40" />
          {/* continents SVG (abstract) */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 560">
            <g fill="oklch(0.28 0.05 265)" opacity="0.7">
              <path d="M120 200 Q 200 160 280 200 T 420 220 T 520 180 L 540 260 Q 460 300 380 280 T 220 300 T 120 260 Z" />
              <path d="M580 260 Q 660 220 740 260 T 880 250 L 900 340 Q 800 360 720 340 T 580 340 Z" />
              <path d="M200 400 Q 300 380 400 410 T 600 400 T 780 420 L 780 480 Q 640 500 500 480 T 260 480 Z" />
            </g>
            <g stroke="oklch(0.82 0.16 210 / 0.4)" strokeDasharray="4 4" fill="none">
              <path d="M180 240 Q 400 100 700 260" />
              <path d="M260 440 Q 500 320 780 440" />
            </g>
          </svg>
          {/* Markers */}
          {vessels.map((v) => {
            const Icon = v.kind === "vessel" ? Ship : v.kind === "port" ? Anchor : v.kind === "yard" ? Warehouse : TruckIcon;
            const tone = v.kind === "vessel" ? "cyan" : v.kind === "port" ? "violet" : v.kind === "yard" ? "success" : "warning";
            return (
              <motion.div
                key={v.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${v.x}%`, top: `${v.y}%` }}
                animate={v.kind === "vessel" ? { x: [0, 20, 0], y: [0, -10, 0] } : {}}
                transition={{ duration: 8 + (v.id % 5), repeat: Infinity, ease: "easeInOut" }}
              >
                <div className={`w-8 h-8 rounded-lg glass-strong flex items-center justify-center text-${tone} relative`}>
                  <Icon className="w-4 h-4" />
                  <span className={`absolute inset-0 rounded-lg animate-pulse-dot`} />
                </div>
              </motion.div>
            );
          })}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
            <Pill tone="cyan"><Ship className="w-3 h-3 mr-1" />Vessels</Pill>
            <Pill tone="violet"><Anchor className="w-3 h-3 mr-1" />Ports</Pill>
            <Pill tone="success"><Warehouse className="w-3 h-3 mr-1" />Yards</Pill>
            <Pill tone="warning"><TruckIcon className="w-3 h-3 mr-1" />Gates</Pill>
            <Pill tone="muted"><RouteIcon className="w-3 h-3 mr-1" />Routes</Pill>
          </div>
          <div className="absolute top-4 right-4 glass px-3 py-2 text-[11px] font-mono text-muted-foreground">
            Mapbox layer will render here when <span className="text-cyan">VITE_MAPBOX_TOKEN</span> is configured.
          </div>
        </div>
      </GlassCard>
    </div>
  );
}