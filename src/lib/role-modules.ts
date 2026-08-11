import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Users, ShieldCheck, KeyRound, Activity, Database, Server, Timer,
  ScrollText, Bell, Lock, Monitor, Settings as SettingsIcon, Brain, Plug, BarChart3,
  Save, ListChecks, Anchor, Map as MapIcon, Ship, Container, ArrowDownToLine, ArrowUpFromLine,
  Waves, CloudSun, LifeBuoy, TriangleAlert, History, Gauge, Sparkles, LineChart, FileText,
  Boxes, Wrench, Clock, ClipboardList, ClipboardCheck, FileCheck2, FileX2, ScanSearch,
  ShieldAlert, CheckCircle2, Warehouse, PackageOpen, PackageCheck, Layers, Flame,
  Truck, MapPinned, DoorOpen, DoorClosed, Route as RouteIcon, Compass, Workflow,
  ArrowLeftRight, GitBranch, PackageSearch, TrendingUp, Cpu, GitCommit, Play,
  Target, BarChart4, Percent, Sigma, Download, TableProperties, Wind,
} from "lucide-react";
import type { Role } from "@/lib/roles";

export type RoleModule = {
  slug: string;
  label: string;
  icon: LucideIcon;
  to: string;                 // base route
  m?: string;                 // optional ?m= section on that route
  group?: string;             // grouping heading within the portal
};

/** Every role gets its OWN set of modules. No shared items, no hidden entries. */
export const ROLE_MODULES: Record<Role, RoleModule[]> = {
  super_admin: [
    { slug: "dashboard",         label: "Dashboard",             icon: LayoutDashboard, to: "/app/admin",         group: "Platform" },
    { slug: "users",             label: "User Management",       icon: Users,            to: "/app/admin", m: "users",           group: "Access" },
    { slug: "roles",             label: "Role Management",       icon: ShieldCheck,      to: "/app/admin", m: "roles",           group: "Access" },
    { slug: "approvals",         label: "Approval Requests",     icon: ClipboardCheck,   to: "/app/admin", m: "approvals",       group: "Access" },
    { slug: "permissions",       label: "Permissions",           icon: KeyRound,         to: "/app/admin", m: "permissions",     group: "Access" },
    { slug: "system-health",     label: "System Health",         icon: Activity,         to: "/app/admin", m: "system-health",   group: "Operations" },
    { slug: "api-monitoring",    label: "API Monitoring",        icon: Server,           to: "/app/admin", m: "api-monitoring",  group: "Operations" },
    { slug: "database",          label: "Database Monitoring",   icon: Database,         to: "/app/admin", m: "database",        group: "Operations" },
    { slug: "redis",             label: "Redis Status",          icon: Server,           to: "/app/admin", m: "redis",           group: "Operations" },
    { slug: "jobs",              label: "Background Jobs",       icon: Timer,            to: "/app/admin", m: "jobs",            group: "Operations" },
    { slug: "audit",             label: "Audit Logs",            icon: ScrollText,       to: "/app/audit",                       group: "Compliance" },
    { slug: "notifications",     label: "Notifications",         icon: Bell,             to: "/app/notifications",               group: "Compliance" },
    { slug: "security",          label: "Security Center",       icon: Lock,             to: "/app/admin", m: "security",        group: "Compliance" },
    { slug: "sessions",          label: "Session Management",    icon: Monitor,          to: "/app/admin", m: "sessions",        group: "Compliance" },
    { slug: "settings",          label: "Application Settings",  icon: SettingsIcon,     to: "/app/settings",                    group: "Configuration" },
    { slug: "ai-status",         label: "AI Services Status",    icon: Brain,            to: "/app/admin", m: "ai-status",       group: "Configuration" },
    { slug: "connected",         label: "Connected Services",    icon: Plug,             to: "/app/admin", m: "connected",       group: "Configuration" },
    { slug: "usage",             label: "Usage Statistics",      icon: BarChart3,        to: "/app/admin", m: "usage",           group: "Insights" },
    { slug: "reports",           label: "Reports",               icon: FileText,         to: "/app/reports",                     group: "Insights" },
    { slug: "backups",           label: "Backup Status",         icon: Save,             to: "/app/admin", m: "backups",         group: "Insights" },
    { slug: "activity",          label: "Activity Timeline",     icon: ListChecks,       to: "/app/admin", m: "activity",        group: "Insights" },
  ],

  port_authority: [
    { slug: "dashboard",         label: "Enterprise Dashboard",  icon: LayoutDashboard, to: "/app/port-authority",              group: "Overview" },
    { slug: "live-map",          label: "Live Singapore Port",   icon: MapIcon,         to: "/app/live-map",                    group: "Overview" },
    { slug: "doc-approval",      label: "Document Approval",     icon: ClipboardCheck,  to: "/app/approvals",                   group: "Overview" },
    { slug: "vessels",           label: "Live Vessel Tracking",  icon: Ship,            to: "/app/port-authority", m: "vessels",           group: "Operations" },
    { slug: "berths",            label: "Berth Occupancy",       icon: Anchor,          to: "/app/port-authority", m: "berths",            group: "Operations" },
    { slug: "arrivals",          label: "Arrival Queue",         icon: ArrowDownToLine, to: "/app/port-authority", m: "arrivals",          group: "Operations" },
    { slug: "departures",        label: "Departure Queue",       icon: ArrowUpFromLine, to: "/app/port-authority", m: "departures",        group: "Operations" },
    { slug: "congestion",        label: "Congestion Prediction", icon: TrendingUp,      to: "/app/port-authority", m: "congestion",        group: "Intelligence" },
    { slug: "weather",           label: "Weather",               icon: CloudSun,        to: "/app/port-authority", m: "weather",           group: "Environment" },
    { slug: "marine",            label: "Marine Conditions",     icon: Waves,           to: "/app/port-authority", m: "marine",            group: "Environment" },
    { slug: "alerts",            label: "Operational Alerts",    icon: TriangleAlert,   to: "/app/port-authority", m: "alerts",            group: "Response" },
    { slug: "incidents",         label: "Incident Management",   icon: LifeBuoy,        to: "/app/port-authority", m: "incidents",         group: "Response" },
    { slug: "history",           label: "Historical Congestion", icon: History,         to: "/app/port-authority", m: "history",           group: "Intelligence" },
    { slug: "kpis",              label: "Performance KPIs",      icon: Gauge,           to: "/app/port-authority", m: "kpis",              group: "Intelligence" },
    { slug: "ai-recs",           label: "AI Recommendations",    icon: Sparkles,        to: "/app/port-authority", m: "ai-recs",           group: "Intelligence" },
    { slug: "analytics",         label: "Analytics",             icon: LineChart,       to: "/app/analytics",                              group: "Insights" },
    { slug: "reports",           label: "Reports",               icon: FileText,        to: "/app/reports",                                group: "Insights" },
    { slug: "notifications",     label: "Notifications",         icon: Bell,            to: "/app/notifications",                          group: "Insights" },
  ],

  terminal_operator: [
    { slug: "dashboard",         label: "Terminal Dashboard",    icon: LayoutDashboard, to: "/app/terminal",                    group: "Overview" },
    { slug: "berths",            label: "Assigned Berths",       icon: Anchor,          to: "/app/terminal", m: "berths",       group: "Operations" },
    { slug: "cranes",            label: "Crane Utilization",     icon: Wrench,          to: "/app/terminal", m: "cranes",       group: "Operations" },
    { slug: "loading",           label: "Loading Queue",         icon: ArrowUpFromLine, to: "/app/terminal", m: "loading",      group: "Operations" },
    { slug: "unloading",         label: "Unloading Queue",       icon: ArrowDownToLine, to: "/app/terminal", m: "unloading",    group: "Operations" },
    { slug: "yard",              label: "Yard Capacity",         icon: Boxes,           to: "/app/terminal", m: "yard",         group: "Yard" },
    { slug: "container-yard",    label: "Container Yard",        icon: Container,       to: "/app/terminal", m: "container-yard", group: "Yard" },
    { slug: "equipment",         label: "Equipment Status",      icon: Wrench,          to: "/app/terminal", m: "equipment",    group: "Assets" },
    { slug: "timeline",          label: "Operations Timeline",   icon: Clock,           to: "/app/terminal", m: "timeline",     group: "Operations" },
    { slug: "maintenance",       label: "Maintenance",           icon: Wrench,          to: "/app/terminal", m: "maintenance",  group: "Assets" },
    { slug: "kpis",              label: "Terminal KPIs",         icon: Gauge,           to: "/app/terminal", m: "kpis",         group: "Insights" },
    { slug: "notifications",     label: "Notifications",         icon: Bell,            to: "/app/notifications",               group: "Insights" },
    { slug: "reports",           label: "Reports",               icon: FileText,        to: "/app/reports",                     group: "Insights" },
  ],

  shipping_company: [
    { slug: "dashboard",         label: "Fleet Dashboard",       icon: LayoutDashboard, to: "/app/shipping",                    group: "Overview" },
    { slug: "tracking",          label: "Fleet Tracking",        icon: MapPinned,       to: "/app/shipping", m: "tracking",     group: "Fleet" },
    { slug: "voyages",           label: "Voyages",               icon: Ship,            to: "/app/shipping", m: "voyages",      group: "Fleet" },
    { slug: "eta",               label: "ETA",                   icon: Clock,           to: "/app/shipping", m: "eta",          group: "Schedule" },
    { slug: "etd",               label: "ETD",                   icon: Clock,           to: "/app/shipping", m: "etd",          group: "Schedule" },
    { slug: "delay",             label: "Delay Prediction",      icon: TrendingUp,      to: "/app/shipping", m: "delay",        group: "Schedule" },
    { slug: "containers",        label: "Container Tracking",    icon: Container,       to: "/app/shipping", m: "containers",   group: "Cargo" },
    { slug: "performance",       label: "Fleet Performance",     icon: Gauge,           to: "/app/shipping", m: "performance",  group: "Insights" },
    { slug: "fuel",              label: "Fuel Analytics",        icon: Flame,           to: "/app/shipping", m: "fuel",         group: "Insights" },
    { slug: "weather",           label: "Weather Along Route",   icon: Wind,            to: "/app/shipping", m: "weather",      group: "Environment" },
    { slug: "notifications",     label: "Notifications",         icon: Bell,            to: "/app/notifications",               group: "Insights" },
    { slug: "reports",           label: "Reports",               icon: FileText,        to: "/app/reports",                     group: "Insights" },
  ],

  customs_officer: [
    { slug: "dashboard",         label: "Verification Dashboard", icon: LayoutDashboard, to: "/app/customs",                     group: "Overview" },
    { slug: "pending",           label: "Pending Documents",      icon: ClipboardList,   to: "/app/customs", m: "pending",       group: "Queues" },
    { slug: "inspection",        label: "Inspection Queue",       icon: ScanSearch,      to: "/app/customs", m: "inspection",    group: "Queues" },
    { slug: "container-verify",  label: "Container Verification", icon: Container,       to: "/app/customs", m: "container-verify", group: "Queues" },
    { slug: "risk",              label: "Risk Analysis",          icon: ShieldAlert,     to: "/app/customs", m: "risk",          group: "Intelligence" },
    { slug: "clearance",         label: "Clearance Status",       icon: CheckCircle2,    to: "/app/customs", m: "clearance",     group: "Decisions" },
    { slug: "approvals",         label: "Approvals",              icon: FileCheck2,      to: "/app/customs", m: "approvals",     group: "Decisions" },
    { slug: "rejected",          label: "Rejected Documents",     icon: FileX2,          to: "/app/customs", m: "rejected",      group: "Decisions" },
    { slug: "analytics",         label: "Analytics",              icon: LineChart,       to: "/app/analytics",                   group: "Insights" },
    { slug: "notifications",     label: "Notifications",          icon: Bell,            to: "/app/notifications",               group: "Insights" },
    { slug: "reports",           label: "Reports",                icon: FileText,        to: "/app/reports",                     group: "Insights" },
  ],

  warehouse_manager: [
    { slug: "dashboard",         label: "Warehouse Dashboard",   icon: LayoutDashboard, to: "/app/warehouse",                    group: "Overview" },
    { slug: "capacity",          label: "Storage Capacity",      icon: Layers,          to: "/app/warehouse", m: "capacity",     group: "Storage" },
    { slug: "inventory",         label: "Inventory",             icon: PackageSearch,   to: "/app/warehouse", m: "inventory",    group: "Storage" },
    { slug: "incoming",          label: "Incoming Containers",   icon: PackageOpen,     to: "/app/warehouse", m: "incoming",     group: "Flow" },
    { slug: "outgoing",          label: "Outgoing Containers",   icon: PackageCheck,    to: "/app/warehouse", m: "outgoing",     group: "Flow" },
    { slug: "utilization",       label: "Storage Utilization",   icon: Gauge,           to: "/app/warehouse", m: "utilization",  group: "Storage" },
    { slug: "heatmap",           label: "Warehouse Heatmap",     icon: Flame,           to: "/app/warehouse", m: "heatmap",      group: "Storage" },
    { slug: "analytics",         label: "Inventory Analytics",   icon: LineChart,       to: "/app/warehouse", m: "analytics",    group: "Insights" },
    { slug: "alerts",            label: "Alerts",                icon: TriangleAlert,   to: "/app/warehouse", m: "alerts",       group: "Insights" },
    { slug: "notifications",     label: "Notifications",         icon: Bell,            to: "/app/notifications",                group: "Insights" },
    { slug: "reports",           label: "Reports",               icon: FileText,        to: "/app/reports",                      group: "Insights" },
  ],

  truck_operator: [
    { slug: "dashboard",         label: "Driver Dashboard",      icon: LayoutDashboard, to: "/app/truck",                        group: "Overview" },
    { slug: "jobs",              label: "Assigned Jobs",         icon: ClipboardList,   to: "/app/truck", m: "jobs",             group: "Assignments" },
    { slug: "gate",              label: "Assigned Gate",         icon: DoorOpen,        to: "/app/truck", m: "gate",             group: "Assignments" },
    { slug: "slot",              label: "Truck Slot",            icon: Clock,           to: "/app/truck", m: "slot",             group: "Assignments" },
    { slug: "queue",             label: "Waiting Queue",         icon: Timer,           to: "/app/truck", m: "queue",            group: "Gate" },
    { slug: "entry",             label: "Entry Time",            icon: DoorOpen,        to: "/app/truck", m: "entry",            group: "Gate" },
    { slug: "exit",              label: "Exit Time",             icon: DoorClosed,      to: "/app/truck", m: "exit",             group: "Gate" },
    { slug: "nav",               label: "Navigation",            icon: Compass,         to: "/app/truck", m: "nav",              group: "Trip" },
    { slug: "history",           label: "Trip History",          icon: History,         to: "/app/truck", m: "history",         group: "Trip" },
    { slug: "notifications",     label: "Notifications",         icon: Bell,            to: "/app/notifications",                group: "Insights" },
    { slug: "reports",           label: "Reports",               icon: FileText,        to: "/app/reports",                      group: "Insights" },
  ],

  logistics_manager: [
    { slug: "dashboard",         label: "Supply Chain Dashboard", icon: LayoutDashboard, to: "/app/logistics",                   group: "Overview" },
    { slug: "flow",              label: "Container Flow",        icon: Workflow,        to: "/app/logistics", m: "flow",         group: "Flow" },
    { slug: "transfers",         label: "Warehouse Transfers",   icon: ArrowLeftRight,  to: "/app/logistics", m: "transfers",    group: "Flow" },
    { slug: "fleet",             label: "Fleet Status",          icon: Ship,            to: "/app/logistics", m: "fleet",        group: "Assets" },
    { slug: "trucks",            label: "Truck Status",          icon: Truck,           to: "/app/logistics", m: "trucks",       group: "Assets" },
    { slug: "timeline",          label: "Shipment Timeline",     icon: GitBranch,       to: "/app/logistics", m: "timeline",     group: "Delivery" },
    { slug: "performance",       label: "Delivery Performance",  icon: Gauge,           to: "/app/logistics", m: "performance",  group: "Delivery" },
    { slug: "ai-recs",           label: "AI Recommendations",    icon: Sparkles,        to: "/app/logistics", m: "ai-recs",      group: "Intelligence" },
    { slug: "analytics",         label: "Analytics",             icon: LineChart,       to: "/app/analytics",                    group: "Insights" },
    { slug: "notifications",     label: "Notifications",         icon: Bell,            to: "/app/notifications",                group: "Insights" },
    { slug: "reports",           label: "Reports",               icon: FileText,        to: "/app/reports",                      group: "Insights" },
  ],

  ai_administrator: [
    { slug: "dashboard",         label: "AI Dashboard",          icon: LayoutDashboard, to: "/app/ai",                           group: "Overview" },
    { slug: "status",            label: "Model Status",          icon: Activity,        to: "/app/ai", m: "status",              group: "Models" },
    { slug: "versions",          label: "Model Versions",        icon: GitCommit,       to: "/app/ai", m: "versions",            group: "Models" },
    { slug: "training",          label: "Training Jobs",         icon: Cpu,             to: "/app/ai", m: "training",            group: "Jobs" },
    { slug: "inference",         label: "Inference Jobs",        icon: Play,            to: "/app/ai", m: "inference",           group: "Jobs" },
    { slug: "requests",          label: "Prediction Requests",   icon: RouteIcon,       to: "/app/ai", m: "requests",            group: "Jobs" },
    { slug: "accuracy",          label: "Accuracy",              icon: Target,          to: "/app/ai", m: "accuracy",            group: "Metrics" },
    { slug: "precision",         label: "Precision",             icon: BarChart4,       to: "/app/ai", m: "precision",           group: "Metrics" },
    { slug: "recall",            label: "Recall",                icon: Percent,         to: "/app/ai", m: "recall",              group: "Metrics" },
    { slug: "feature-importance", label: "Feature Importance",   icon: Sigma,           to: "/app/ai", m: "feature-importance",  group: "Explainability" },
    { slug: "confidence",        label: "Prediction Confidence", icon: Gauge,           to: "/app/ai", m: "confidence",          group: "Explainability" },
    { slug: "datasets",          label: "Dataset Monitoring",    icon: Database,        to: "/app/ai", m: "datasets",            group: "Data" },
    { slug: "logs",              label: "Model Logs",            icon: ScrollText,      to: "/app/ai", m: "logs",                group: "Data" },
    { slug: "notifications",     label: "Notifications",         icon: Bell,            to: "/app/notifications",                group: "Insights" },
    { slug: "reports",           label: "Reports",               icon: FileText,        to: "/app/reports",                      group: "Insights" },
  ],

  data_analyst: [
    { slug: "dashboard",         label: "Analytics Dashboard",   icon: LayoutDashboard, to: "/app/analytics",                    group: "Overview" },
    { slug: "hist-congestion",   label: "Historical Congestion", icon: History,         to: "/app/analytics", m: "hist-congestion", group: "Historical" },
    { slug: "hist-weather",      label: "Historical Weather",    icon: CloudSun,        to: "/app/analytics", m: "hist-weather", group: "Historical" },
    { slug: "hist-vessels",      label: "Historical Vessel Traffic", icon: Ship,        to: "/app/analytics", m: "hist-vessels", group: "Historical" },
    { slug: "hist-throughput",   label: "Historical Throughput", icon: BarChart3,       to: "/app/analytics", m: "hist-throughput", group: "Historical" },
    { slug: "forecasting",       label: "Forecasting",           icon: TrendingUp,      to: "/app/analytics", m: "forecasting",  group: "Modelling" },
    { slug: "trends",            label: "Trend Analysis",        icon: LineChart,       to: "/app/analytics", m: "trends",       group: "Modelling" },
    { slug: "charts",            label: "Charts",                icon: BarChart4,       to: "/app/analytics", m: "charts",       group: "Explore" },
    { slug: "explorer",          label: "Data Explorer",         icon: TableProperties, to: "/app/analytics", m: "explorer",     group: "Explore" },
    { slug: "downloads",         label: "Dataset Downloads",     icon: Download,        to: "/app/analytics", m: "downloads",    group: "Export" },
    { slug: "csv",               label: "CSV Export",            icon: Download,        to: "/app/analytics", m: "csv",         group: "Export" },
    { slug: "reports",           label: "Reports",               icon: FileText,        to: "/app/reports",                     group: "Export" },
  ],
};

/** Route highlight helper — matches when path AND ?m= slug both align. */
export function moduleHref(m: RoleModule): string {
  return m.m ? `${m.to}?m=${m.m}` : m.to;
}

export function isModuleActive(m: RoleModule, pathname: string, search: string): boolean {
  if (pathname !== m.to) return false;
  const params = new URLSearchParams(search);
  const activeM = params.get("m");
  if (m.m) return activeM === m.m;
  // dashboard entry (no ?m=): active only when there is no ?m= param
  return !activeM;
}