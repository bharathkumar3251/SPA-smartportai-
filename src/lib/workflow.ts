import type { Role } from "@/lib/roles";

export type Stage =
  | "uploaded"
  | "ai_verification"
  | "ai_needs_review"
  | "ai_rejected"
  | "authority_review"
  | "modification_requested"
  | "authority_rejected"
  | "authority_approved"
  | "customs_review"
  | "customs_hold"
  | "customs_rejected"
  | "customs_cleared"
  | "final_approval"
  | "final_approved"
  | "berth_assigned"
  | "terminal_scheduled"
  | "unloading"
  | "warehouse_received"
  | "dispatch_ready"
  | "in_transit"
  | "delivered";

export type AiVerdict = "verified" | "needs_manual_review" | "rejected";

export type DocumentType =
  | "vessel_arrival_notice"
  | "cargo_manifest"
  | "bill_of_lading"
  | "crew_list"
  | "dangerous_goods_declaration"
  | "container_list"
  | "insurance_certificate"
  | "port_clearance"
  | "eta_information";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export const STAGE_META: Record<Stage, { label: string; tone: Tone; owner: Role | null }> = {
  uploaded:               { label: "Uploaded",              tone: "neutral", owner: "shipping_company" },
  ai_verification:        { label: "AI Verification",       tone: "info",    owner: null },
  ai_needs_review:        { label: "Needs Manual Review",   tone: "warning", owner: "port_authority" },
  ai_rejected:            { label: "AI Rejected",           tone: "danger",  owner: "shipping_company" },
  authority_review:       { label: "Authority Review",      tone: "info",    owner: "port_authority" },
  modification_requested: { label: "Modification Requested",tone: "warning", owner: "shipping_company" },
  authority_rejected:     { label: "Authority Rejected",    tone: "danger",  owner: "shipping_company" },
  authority_approved:     { label: "Authority Approved",    tone: "success", owner: "customs_officer" },
  customs_review:         { label: "Customs Review",        tone: "info",    owner: "customs_officer" },
  customs_hold:           { label: "Held for Inspection",   tone: "warning", owner: "customs_officer" },
  customs_rejected:       { label: "Clearance Rejected",    tone: "danger",  owner: "shipping_company" },
  customs_cleared:        { label: "Customs Cleared",       tone: "success", owner: "port_authority" },
  final_approval:         { label: "Final Approval",        tone: "info",    owner: "port_authority" },
  final_approved:         { label: "Final Approved",        tone: "success", owner: "port_authority" },
  berth_assigned:         { label: "Berth Assigned",        tone: "success", owner: "terminal_operator" },
  terminal_scheduled:     { label: "Terminal Scheduled",    tone: "info",    owner: "terminal_operator" },
  unloading:              { label: "Unloading",             tone: "info",    owner: "terminal_operator" },
  warehouse_received:     { label: "Warehouse Received",    tone: "info",    owner: "warehouse_manager" },
  dispatch_ready:         { label: "Dispatch Ready",        tone: "info",    owner: "truck_operator" },
  in_transit:             { label: "In Transit",            tone: "info",    owner: "logistics_manager" },
  delivered:              { label: "Delivered",             tone: "success", owner: null },
};

/** Canonical happy-path pipeline used for the progress rail. */
export const STAGE_FLOW: Stage[] = [
  "uploaded",
  "ai_verification",
  "authority_review",
  "authority_approved",
  "customs_cleared",
  "final_approved",
  "berth_assigned",
  "terminal_scheduled",
  "warehouse_received",
  "dispatch_ready",
  "delivered",
];

export function flowIndex(stage: Stage): number {
  const direct = STAGE_FLOW.indexOf(stage);
  if (direct >= 0) return direct;
  const map: Partial<Record<Stage, Stage>> = {
    ai_needs_review: "authority_review",
    ai_rejected: "ai_verification",
    modification_requested: "authority_review",
    authority_rejected: "authority_review",
    customs_review: "authority_approved",
    customs_hold: "customs_cleared",
    customs_rejected: "customs_cleared",
    final_approval: "final_approved",
    unloading: "terminal_scheduled",
    in_transit: "dispatch_ready",
  };
  const alias = map[stage];
  return alias ? STAGE_FLOW.indexOf(alias) : 0;
}

export const DOCUMENT_TYPES: { id: DocumentType; label: string; required: boolean; hint: string }[] = [
  { id: "vessel_arrival_notice",        label: "Vessel Arrival Notice",        required: true,  hint: "Notice of arrival with vessel particulars" },
  { id: "cargo_manifest",               label: "Cargo Manifest",               required: true,  hint: "Full cargo listing per bill of lading" },
  { id: "bill_of_lading",               label: "Bill of Lading",               required: true,  hint: "Carrier-issued transport document" },
  { id: "crew_list",                    label: "Crew List",                    required: true,  hint: "IMO FAL Form 5 crew declaration" },
  { id: "dangerous_goods_declaration",  label: "Dangerous Goods Declaration",  required: false, hint: "Required when hazardous cargo is carried (UN numbers)" },
  { id: "container_list",               label: "Container List",               required: true,  hint: "Container numbers, ISO types and weights" },
  { id: "insurance_certificate",        label: "Insurance Certificate",        required: true,  hint: "P&I / cargo insurance, must be unexpired" },
  { id: "port_clearance",               label: "Port Clearance",               required: true,  hint: "Clearance from last port of call" },
  { id: "eta_information",              label: "ETA Information",              required: true,  hint: "Declared ETA and pilotage requirements" },
];

export function docLabel(id: DocumentType): string {
  return DOCUMENT_TYPES.find((d) => d.id === id)?.label ?? id;
}

export type Submission = {
  id: string;
  created_by: string;
  reference: string;
  shipping_company: string;
  vessel_name: string;
  imo_number: string | null;
  voyage_number: string | null;
  cargo_type: string | null;
  container_count: number;
  dangerous_goods: boolean;
  origin_port: string | null;
  eta: string | null;
  etd: string | null;
  stage: Stage;
  ai_risk_score: number | null;
  ai_confidence: number | null;
  ai_verdict: AiVerdict | null;
  authority_notes: string | null;
  customs_notes: string | null;
  inspection_notes: string | null;
  berth_code: string | null;
  arrival_window_start: string | null;
  arrival_window_end: string | null;
  created_at: string;
  updated_at: string;
};

export type SubmissionDocument = {
  id: string;
  submission_id: string;
  uploaded_by: string;
  doc_type: DocumentType;
  file_name: string;
  file_path: string | null;
  mime_type: string | null;
  file_size: number | null;
  issued_on: string | null;
  expires_on: string | null;
  status: "uploaded" | "verified" | "flagged" | "rejected";
  ai_findings: unknown;
  created_at: string;
};

export type AiVerification = {
  id: string;
  submission_id: string;
  scope: string;
  risk_score: number;
  confidence: number;
  verdict: AiVerdict;
  issues: { severity?: string; check?: string; detail?: string }[];
  recommendations: string[];
  checks: { name?: string; status?: string; detail?: string }[];
  model: string | null;
  created_at: string;
};

export type WorkflowEvent = {
  id: string;
  submission_id: string;
  actor_id: string | null;
  actor_role: Role | null;
  actor_label: string | null;
  stage: Stage;
  action: string;
  notes: string | null;
  created_at: string;
};

export type ContainerRow = {
  id: string;
  submission_id: string;
  container_no: string;
  iso_type: string | null;
  weight_kg: number | null;
  hazardous: boolean;
  stage:
    | "at_vessel" | "unloading" | "yard" | "warehouse_received" | "stored"
    | "dispatch_ready" | "assigned_truck" | "in_transit" | "delivered";
  yard_slot: string | null;
  crane_id: string | null;
  unloading_team: string | null;
  storage_slot: string | null;
  truck_plate: string | null;
  driver_name: string | null;
  pickup_at: string | null;
  delivered_at: string | null;
  destination: string | null;
};

export function riskTone(score: number | null | undefined): Tone {
  if (score == null) return "neutral";
  if (score >= 70) return "danger";
  if (score >= 40) return "warning";
  return "success";
}

export function makeReference(vessel: string): string {
  const slug = (vessel || "VSL").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "VSL";
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  return `SG-${slug}-${stamp}`;
}