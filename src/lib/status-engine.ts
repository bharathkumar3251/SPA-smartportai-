import type { Role } from "@/lib/roles";
import type { ContainerRow, Stage } from "@/lib/workflow";

export type ContainerStage = ContainerRow["stage"];

/**
 * Centralised state machine. This is a faithful mirror of the database triggers
 * `enforce_submission_stage` / `enforce_container_stage`, so the UI can refuse an
 * illegal action with a readable message before the round-trip — the database
 * remains the authority and rejects anything that slips through.
 */
export const SUBMISSION_TRANSITIONS: Record<Stage, Stage[]> = {
  uploaded: ["uploaded", "ai_verification", "authority_review"],
  ai_verification: ["ai_verification", "ai_needs_review", "ai_rejected", "authority_review"],
  ai_needs_review: ["authority_review", "ai_rejected", "ai_verification"],
  ai_rejected: ["uploaded", "ai_verification"],
  authority_review: ["authority_approved", "authority_rejected", "modification_requested", "customs_review"],
  modification_requested: ["uploaded", "ai_verification", "authority_review"],
  authority_rejected: ["uploaded", "ai_verification"],
  authority_approved: ["customs_review", "customs_hold", "customs_cleared", "customs_rejected"],
  customs_review: ["customs_hold", "customs_cleared", "customs_rejected"],
  customs_hold: ["customs_cleared", "customs_rejected", "customs_review"],
  customs_rejected: ["uploaded", "customs_review"],
  customs_cleared: ["final_approval", "final_approved"],
  final_approval: ["final_approved", "authority_rejected"],
  final_approved: ["berth_assigned"],
  berth_assigned: ["terminal_scheduled", "berth_assigned"],
  terminal_scheduled: ["unloading"],
  unloading: ["warehouse_received"],
  warehouse_received: ["dispatch_ready"],
  dispatch_ready: ["in_transit"],
  in_transit: ["delivered"],
  delivered: [],
};

/** Roles authorised to move a submission INTO a stage. */
export const SUBMISSION_STAGE_ROLES: Record<Stage, Role[]> = {
  uploaded: ["shipping_company"],
  ai_verification: ["shipping_company", "port_authority"],
  ai_needs_review: ["shipping_company", "port_authority"],
  ai_rejected: ["shipping_company", "port_authority"],
  authority_review: ["shipping_company", "port_authority"],
  modification_requested: ["port_authority"],
  authority_rejected: ["port_authority"],
  authority_approved: ["port_authority"],
  customs_review: ["port_authority", "customs_officer"],
  customs_hold: ["customs_officer"],
  customs_cleared: ["customs_officer"],
  customs_rejected: ["customs_officer"],
  final_approval: ["port_authority"],
  final_approved: ["port_authority"],
  berth_assigned: ["port_authority"],
  terminal_scheduled: ["terminal_operator"],
  unloading: ["terminal_operator"],
  warehouse_received: ["warehouse_manager", "terminal_operator"],
  dispatch_ready: ["warehouse_manager"],
  in_transit: ["truck_operator"],
  delivered: ["truck_operator", "logistics_manager"],
};

export const CONTAINER_TRANSITIONS: Record<ContainerStage, ContainerStage[]> = {
  at_vessel: ["unloading"],
  unloading: ["yard"],
  yard: ["warehouse_received"],
  warehouse_received: ["stored"],
  stored: ["dispatch_ready"],
  dispatch_ready: ["assigned_truck"],
  assigned_truck: ["in_transit"],
  in_transit: ["delivered"],
  delivered: [],
};

export const CONTAINER_STAGE_ROLES: Record<ContainerStage, Role[]> = {
  at_vessel: [],
  unloading: ["terminal_operator"],
  yard: ["terminal_operator"],
  warehouse_received: ["warehouse_manager", "terminal_operator"],
  stored: ["warehouse_manager"],
  dispatch_ready: ["warehouse_manager"],
  assigned_truck: ["truck_operator"],
  in_transit: ["truck_operator"],
  delivered: ["truck_operator", "logistics_manager"],
};

export function humanStage(stage: string): string {
  return stage.replace(/_/g, " ");
}

function hasAuthority(roles: Role[] | null | undefined, allowed: Role[]): boolean {
  if (!roles || roles.length === 0) return false;
  if (roles.includes("super_admin")) return true;
  return allowed.some((r) => roles.includes(r));
}

export type TransitionCheck = { ok: true } | { ok: false; reason: string };

export function checkSubmissionTransition(from: Stage, to: Stage, roles: Role[] | null | undefined): TransitionCheck {
  if (from === to) return { ok: true };
  if (!SUBMISSION_TRANSITIONS[from].includes(to)) {
    return { ok: false, reason: `Invalid status transition: ${humanStage(from)} → ${humanStage(to)} is not permitted by the port workflow.` };
  }
  if (!hasAuthority(roles, SUBMISSION_STAGE_ROLES[to])) {
    return { ok: false, reason: `Not authorised: your role cannot set the status "${humanStage(to)}".` };
  }
  return { ok: true };
}

export function checkContainerTransition(
  from: ContainerStage,
  to: ContainerStage,
  roles: Role[] | null | undefined,
): TransitionCheck {
  if (from === to) return { ok: true };
  if (!CONTAINER_TRANSITIONS[from].includes(to)) {
    return { ok: false, reason: `Invalid container movement: ${humanStage(from)} → ${humanStage(to)} is not permitted.` };
  }
  if (!hasAuthority(roles, CONTAINER_STAGE_ROLES[to])) {
    return { ok: false, reason: `Not authorised: your role cannot move a container to "${humanStage(to)}".` };
  }
  return { ok: true };
}

/** Stages the given roles may legally move this submission to right now. */
export function nextStagesFor(from: Stage, roles: Role[] | null | undefined): Stage[] {
  return SUBMISSION_TRANSITIONS[from].filter(
    (to) => to !== from && hasAuthority(roles, SUBMISSION_STAGE_ROLES[to]),
  );
}
