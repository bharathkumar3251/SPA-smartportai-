import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { canAccess, type Role } from "@/lib/roles";
import { ForbiddenPanel } from "./ErrorPanels";

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  if (!canAccess(pathname, roles)) return <ForbiddenPanel />;
  return <>{children}</>;
}
