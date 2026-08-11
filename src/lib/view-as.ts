import { useCallback, useEffect, useState } from "react";
import type { Role } from "@/lib/roles";

const KEY = "smartport.viewAsRole";
const EVENT = "smartport:view-as";

export function getViewAsRole(): Role | null {
  if (typeof window === "undefined") return null;
  return (window.localStorage.getItem(KEY) as Role | null) ?? null;
}

export function setViewAsRole(role: Role | null) {
  if (typeof window === "undefined") return;
  if (role) window.localStorage.setItem(KEY, role);
  else window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

/** Super Admin only: temporarily render another portal without touching the DB. */
export function useViewAsRole(): { viewAs: Role | null; setViewAs: (r: Role | null) => void } {
  const [viewAs, setState] = useState<Role | null>(null);
  useEffect(() => {
    const sync = () => setState(getViewAsRole());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const setViewAs = useCallback((r: Role | null) => setViewAsRole(r), []);
  return { viewAs, setViewAs };
}
