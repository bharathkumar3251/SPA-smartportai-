import type { LucideIcon } from "lucide-react";
import {
  Shield, Anchor, Ship, Container, Truck, BadgeCheck,
  Warehouse, Route as RouteIcon, Brain, LineChart,
} from "lucide-react";

export type Role =
  | "super_admin"
  | "port_authority"
  | "terminal_operator"
  | "shipping_company"
  | "customs_officer"
  | "warehouse_manager"
  | "truck_operator"
  | "logistics_manager"
  | "ai_administrator"
  | "data_analyst";

export type RoleMeta = {
  id: Role;
  label: string;
  short: string;
  description: string;
  icon: LucideIcon;
  home: string;
};

export const ROLES: RoleMeta[] = [
  { id: "super_admin",       label: "Super Admin",        short: "Admin",     description: "Full governance: users, roles, models, keys, audit.", icon: Shield,     home: "/app/admin" },
  { id: "port_authority",    label: "Port Authority",     short: "Port",      description: "Congestion, berth occupancy, vessel queue oversight.", icon: Anchor,     home: "/app/port-authority" },
  { id: "terminal_operator", label: "Terminal Operator",  short: "Terminal",  description: "Berth assignment, cranes, yard and equipment.",       icon: Container,  home: "/app/terminal" },
  { id: "shipping_company",  label: "Shipping Company",   short: "Shipping",  description: "Fleet, voyages, ETA and cargo documents.",            icon: Ship,       home: "/app/shipping" },
  { id: "customs_officer",   label: "Customs Officer",    short: "Customs",   description: "Document verification, risk scoring and clearance.",  icon: BadgeCheck, home: "/app/customs" },
  { id: "warehouse_manager", label: "Warehouse Manager",  short: "Warehouse", description: "Inbound, outbound, storage utilization.",             icon: Warehouse,  home: "/app/warehouse" },
  { id: "truck_operator",    label: "Truck Operator",     short: "Trucking",  description: "Slot booking, gate queue and route intelligence.",    icon: Truck,      home: "/app/truck" },
  { id: "logistics_manager", label: "Logistics Manager",  short: "Logistics", description: "Cross-mode flow, SLA and hand-off orchestration.",    icon: RouteIcon,  home: "/app/logistics" },
  { id: "ai_administrator",  label: "AI Administrator",   short: "AI",        description: "Model registry, deployments, drift and evaluation.",  icon: Brain,      home: "/app/ai" },
  { id: "data_analyst",      label: "Data Analyst",       short: "Analyst",   description: "Analytics, reports and exploratory dashboards.",      icon: LineChart,  home: "/app/analytics" },
];

export function roleMeta(id: Role | null | undefined): RoleMeta {
  return ROLES.find((r) => r.id === id) ?? ROLES[1];
}

// -----------------------------------------------------------------------------
// RBAC — path → allowed role set
// Super Admin implicitly has full access.
// -----------------------------------------------------------------------------
const ALL: Role[] = ROLES.map((r) => r.id);

export const ROUTE_ACCESS: { prefix: string; roles: Role[]; exact?: boolean }[] = [
  { prefix: "/app",                exact: true, roles: ALL },
  { prefix: "/app/live-map",        roles: ALL },
  { prefix: "/app/port-authority",  roles: ["super_admin", "port_authority"] },
  { prefix: "/app/terminal",        roles: ["super_admin", "terminal_operator", "port_authority"] },
  { prefix: "/app/customs",         roles: ["super_admin", "customs_officer", "port_authority"] },
  { prefix: "/app/approvals",       roles: ["super_admin", "port_authority"] },
  { prefix: "/app/shipping",        roles: ["super_admin", "shipping_company", "logistics_manager", "port_authority"] },
  { prefix: "/app/warehouse",       roles: ["super_admin", "warehouse_manager", "logistics_manager"] },
  { prefix: "/app/truck",           roles: ["super_admin", "truck_operator", "logistics_manager"] },
  { prefix: "/app/logistics",       roles: ["super_admin", "logistics_manager", "port_authority"] },
  { prefix: "/app/ai",              roles: ["super_admin", "ai_administrator", "data_analyst", "port_authority"] },
  { prefix: "/app/analytics",       roles: ["super_admin", "data_analyst", "ai_administrator", "port_authority", "logistics_manager"] },
  { prefix: "/app/reports",         roles: ALL },
  { prefix: "/app/notifications",   roles: ALL },
  { prefix: "/app/settings",        roles: ALL },
  { prefix: "/app/audit",           roles: ["super_admin", "port_authority"] },
  { prefix: "/app/admin",           roles: ["super_admin"] },
];

export function canAccess(path: string, roles: Role[] | null | undefined): boolean {
  if (!roles || roles.length === 0) return false;
  if (roles.includes("super_admin")) return true;
  // Find the most specific matching rule (longest prefix)
  const rule = ROUTE_ACCESS
    .filter((r) => (r.exact ? path === r.prefix : path === r.prefix || path.startsWith(r.prefix + "/")))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  if (!rule) return true; // unknown app path defaults to allow (auth is still required upstream)
  return rule.roles.some((r) => roles.includes(r));
}

// Dashboard priority — highest first.
export const ROLE_PRIORITY: Role[] = [
  "super_admin",
  "port_authority",
  "terminal_operator",
  "shipping_company",
  "customs_officer",
  "warehouse_manager",
  "truck_operator",
  "logistics_manager",
  "ai_administrator",
  "data_analyst",
];

export function primaryRoleFrom(roles: Role[] | null | undefined): Role {
  if (!roles || roles.length === 0) return "data_analyst";
  return ROLE_PRIORITY.find((r) => roles.includes(r)) ?? roles[0];
}

/** Landing dashboard for a set of roles (super_admin always lands on /app/admin). */
export function homeForRoles(roles: Role[] | null | undefined): string {
  return roleMeta(primaryRoleFrom(roles)).home;
}