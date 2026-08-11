import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import type { Role } from "@/lib/roles";

export type Profile = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  organization: string | null;
  status: "pending" | "active" | "disabled";
  requested_role: Role | null;
};

export type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: Role[];
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

let cachedProfile: Profile | null = null;
let cachedRoles: Role[] = [];

export function useAuth(): AuthState {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(cachedProfile);
  const [roles, setRoles] = useState<Role[]>(cachedRoles);

  const loadProfileAndRoles = useCallback(async (userId: string) => {
    const [{ data: prof }, { data: rls }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    const p = (prof ?? null) as Profile | null;
    const rs = ((rls ?? []) as { role: Role }[]).map((r) => r.role);
    cachedProfile = p;
    cachedRoles = rs;
    setProfile(p);
    setRoles(rs);
  }, []);

  useEffect(() => {
    let mounted = true;
    // 1) Register listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        // Defer supabase calls out of the callback
        setTimeout(() => { void loadProfileAndRoles(s.user.id); }, 0);
      } else {
        cachedProfile = null; cachedRoles = [];
        setProfile(null); setRoles([]);
      }
      if (event === "INITIAL_SESSION") setLoading(false);
    });
    // 2) Then fetch current
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        void loadProfileAndRoles(data.session.user.id);
      }
      setLoading(false);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [loadProfileAndRoles]);

  const refresh = useCallback(async () => {
    if (session?.user) await loadProfileAndRoles(session.user.id);
  }, [session, loadProfileAndRoles]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    cachedProfile = null; cachedRoles = [];
    if (typeof window !== "undefined") window.localStorage.removeItem("smartport.viewAsRole");
  }, []);

  return {
    loading,
    session,
    user: session?.user ?? null,
    profile,
    roles,
    isAuthenticated: !!session?.user,
    refresh,
    signOut,
  };
}
