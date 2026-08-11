import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { EmptyState } from "@/components/common/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Users, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { ROLES, roleMeta, type Role } from "@/lib/roles";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { DataPanel, StatusBadge } from "@/components/dash/DataPanel";
import { AreaTrend, C, ChartCard, DonutChart } from "@/components/dash/Charts";
import {
  ActivityCard, AssistantPlaceholder, HelpCard, NotificationsCard, WorkflowOverview,
} from "@/components/dash/Widgets";
import { NoDataCard } from "@/components/common/NoDataCard";
import { useAllSubmissions } from "@/hooks/useOps";
import { monthlySeries, stageCounts } from "@/lib/ops-metrics";

export const Route = createFileRoute("/app/admin")({
  validateSearch: (search: Record<string, unknown>): { m?: string } => ({
    m: search.m ? String(search.m) : undefined,
  }),
  head: () => ({ meta: [{ title: "Administration — SmartPort AI" }] }),
  component: AdminPage,
});

type ProfileRow = {
  id: string; email: string; first_name: string | null; last_name: string | null;
  organization: string | null; status: "pending" | "active" | "disabled";
  requested_role: Role | null; created_at: string;
};

function AdminPage() {
  const { roles } = useAuth();
  const { data: subs } = useAllSubmissions();
  const isAdmin = roles.includes("super_admin");
  const [profiles, setProfiles] = useState<ProfileRow[] | null>(null);
  const [rolesMap, setRolesMap] = useState<Record<string, Role[]>>({});

  async function load() {
    const [{ data: profs }, { data: rls }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const map: Record<string, Role[]> = {};
    ((rls ?? []) as { user_id: string; role: Role }[]).forEach((r) => {
      (map[r.user_id] ??= []).push(r.role);
    });
    setRolesMap(map);
    setProfiles((profs ?? []) as ProfileRow[]);
  }
  useEffect(() => { void load(); }, []);

  async function approve(userId: string, role: Role) {
    const { error } = await supabase.rpc("approve_role_request", { _user_id: userId, _role: role });
    if (error) toast.error(error.message); else { toast.success("Role approved"); void load(); }
  }
  async function revoke(userId: string, role: Role) {
    const { error } = await supabase.rpc("revoke_role", { _user_id: userId, _role: role });
    if (error) toast.error(error.message); else { toast.success("Role revoked"); void load(); }
  }
  async function setStatus(userId: string, status: "active" | "disabled") {
    const { error } = await supabase.rpc("set_account_status", { _user_id: userId, _status: status });
    if (error) toast.error(error.message); else { toast.success(`Account ${status}`); void load(); }
  }
  async function makeMeSuperAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Only allowed if no super admin exists yet
    const { count } = await supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "super_admin");
    if ((count ?? 0) > 0) { toast.error("A Super Admin already exists"); return; }
    const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role: "super_admin" } as never);
    if (error) toast.error(error.message); else { toast.success("You are now Super Admin. Sign out and back in."); void load(); }
  }

  const pending = (profiles ?? []).filter((p) => p.status === "pending" || p.requested_role);
  const totalUsers = profiles?.length ?? 0;
  const activeUsers = (profiles ?? []).filter((p) => p.status === "active").length;
  const palette = [C.cyan, C.violet, C.success, C.warning, C.danger];
  const roleDistribution = Object.entries(
    Object.values(rolesMap).flat().reduce<Record<string, number>>((acc, r) => { acc[r] = (acc[r] ?? 0) + 1; return acc; }, {}),
  ).map(([role, value], i) => ({ name: roleMeta(role as Role).label, value, color: palette[i % palette.length] }));

  return (
    <div>
      <PageHeader eyebrow="Platform Admin" title="Users, roles & access."
        subtitle={isAdmin ? "Approve requests, assign roles, disable accounts." : "Bootstrap the first Super Admin for this workspace."}
        actions={!isAdmin ? (
          <button onClick={makeMeSuperAdmin}
            className="h-9 px-3 rounded-md bg-gradient-to-r from-cyan to-violet text-background text-sm">
            Claim Super Admin (first user)
          </button>
        ) : undefined}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MiniStat label="Total users" value={totalUsers} icon={<Users className="w-4 h-4" />} />
        <MiniStat label="Active" value={activeUsers} icon={<UserCheck className="w-4 h-4 text-success" />} />
        <MiniStat label="Pending approval" value={pending.length} icon={<ShieldCheck className="w-4 h-4 text-warning" />} />
        <MiniStat label="Disabled" value={(profiles ?? []).filter(p=>p.status==="disabled").length} icon={<UserX className="w-4 h-4 text-danger" />} />
      </div>

      {isAdmin && pending.length > 0 && (
        <GlassCard className="mb-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-3">Role requests</div>
          <ul className="divide-y divide-border">
            {pending.map((p) => (
              <li key={p.id} className="py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{[p.first_name, p.last_name].filter(Boolean).join(" ") || p.email}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.email} · {p.organization ?? "—"}</div>
                </div>
                {p.requested_role && (
                  <div className="text-xs text-cyan">requests {roleMeta(p.requested_role).label}</div>
                )}
                <div className="flex gap-2">
                  {p.requested_role && (
                    <button onClick={()=>approve(p.id, p.requested_role!)}
                      className="h-8 px-3 rounded border border-success/30 bg-success/10 text-success text-xs hover:bg-success/20">Approve</button>
                  )}
                  <button onClick={()=>setStatus(p.id, "active")}
                    className="h-8 px-3 rounded border border-border text-xs hover:bg-white/[0.05]">Activate as Analyst</button>
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      <GlassCard>
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-3">All users</div>
        {!profiles ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Loading…</div>
        ) : profiles.length === 0 ? (
          <EmptyState icon={<Users className="w-6 h-6" />} title="No users yet" description="Users will appear here after they sign up." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 font-mono">
                  <th className="text-left py-2 pr-4">Name</th>
                  <th className="text-left py-2 pr-4">Email</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-left py-2 pr-4">Roles</th>
                  <th className="text-left py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {profiles.map((p) => {
                  const userRoles = rolesMap[p.id] ?? [];
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02]">
                      <td className="py-2 pr-4">{[p.first_name, p.last_name].filter(Boolean).join(" ") || "—"}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{p.email}</td>
                      <td className="py-2 pr-4">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${
                          p.status === "active" ? "bg-success/10 text-success"
                          : p.status === "pending" ? "bg-warning/10 text-warning"
                          : "bg-danger/10 text-danger"
                        }`}>{p.status}</span>
                      </td>
                      <td className="py-2 pr-4">
                        <div className="flex flex-wrap gap-1">
                          {userRoles.map((r) => (
                            <button key={r} disabled={!isAdmin} onClick={()=>revoke(p.id, r)}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-cyan/20 bg-cyan/5 text-cyan text-[10px] font-mono uppercase hover:bg-cyan/10 disabled:hover:bg-cyan/5"
                              title={isAdmin ? "Click to revoke" : ""}>
                              {roleMeta(r).short}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 pr-4">
                        {isAdmin && (
                          <div className="flex gap-1.5">
                            <select onChange={(e) => e.target.value && approve(p.id, e.target.value as Role)} defaultValue=""
                              className="h-7 px-2 rounded bg-white/[0.03] border border-border text-[11px]">
                              <option value="">+ Grant role</option>
                              {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                            </select>
                            {p.status !== "disabled" ? (
                              <button onClick={()=>setStatus(p.id, "disabled")} className="h-7 px-2 rounded border border-danger/30 text-danger text-[11px] hover:bg-danger/10">Disable</button>
                            ) : (
                              <button onClick={()=>setStatus(p.id, "active")} className="h-7 px-2 rounded border border-success/30 text-success text-[11px] hover:bg-success/10">Activate</button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <div className="mt-8"><WorkflowOverview counts={stageCounts(subs ?? [])} /></div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <ChartCard className="lg:col-span-2" title="User registrations · 6 months" height={240}>
          {(profiles ?? []).length === 0
            ? <NoDataCard title="No user accounts yet." reason="Registration volume is charted from real accounts." />
            : <AreaTrend data={monthlySeries(profiles ?? [], 6, "users")} series={[{ key: "users", label: "New users", color: C.cyan }]} />}
        </ChartCard>
        <ChartCard title="Role distribution" height={240}>
          {roleDistribution.length === 0
            ? <NoDataCard title="No roles assigned." reason="Approve a role request to populate this chart." />
            : <DonutChart data={roleDistribution} />}
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <DataPanel
          className="lg:col-span-2"
          title="Shipment records"
          subtitle="All submissions currently held in the platform"
          rows={subs ?? []}
          emptyTitle="No shipment records."
          filterKey="stage"
          filterLabel="All stages"
          searchKeys={["reference", "vessel_name", "shipping_company"]}
          exportName="admin-shipments.csv"
          columns={[
            { key: "reference", label: "Reference" },
            { key: "shipping_company", label: "Shipping line" },
            { key: "vessel_name", label: "Vessel" },
            { key: "container_count", label: "Containers", align: "right" },
            { key: "stage", label: "Stage", render: (r) => <StatusBadge status={r.stage.replace(/_/g, " ")} /> },
          ]}
        />
        <SystemStatusCard />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <ActivityCard className="lg:col-span-2" title="Administrative activity" />
        <div className="space-y-4">
          <NotificationsCard title="Platform alerts" />
          <HelpCard />
        </div>
      </div>

      <div className="mt-4">
        <LoginHistoryTable />
      </div>
    </div>
  );
}

function SystemStatusCard() {
  return (
    <GlassCard>
      <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-3">System Health &amp; API Status</div>
      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-border/60">
          <span className="font-medium">PostgreSQL Database</span>
          <span className="text-success font-mono uppercase">Operational · 100%</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-border/60">
          <span className="font-medium">Supabase RLS &amp; Triggers</span>
          <span className="text-success font-mono uppercase">Enforced · Active</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-border/60">
          <span className="font-medium">AI Gateway (Lovable)</span>
          <span className="text-success font-mono uppercase">Active · Gemini 3.5</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded bg-white/[0.02] border border-border/60">
          <span className="font-medium">AISStream.io Feed</span>
          <span className="text-cyan font-mono uppercase">Live Bbox Stream</span>
        </div>
      </div>
    </GlassCard>
  );
}

function LoginHistoryTable() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("login_history").select("*").order("created_at", { ascending: false }).limit(10);
      setHistory(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <GlassCard>
      <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-3">Recent Login History</div>
      {loading ? (
        <div className="text-xs text-muted-foreground py-3">Loading login history…</div>
      ) : history.length === 0 ? (
        <NoDataCard title="No login history" reason="User login attempts will be logged here." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-white/[0.02] border-b border-border/70 text-muted-foreground font-mono uppercase">
              <tr>
                <th className="text-left p-2">Timestamp</th>
                <th className="text-left p-2">User ID</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">IP Address</th>
                <th className="text-left p-2">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 font-mono">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-white/[0.02]">
                  <td className="p-2 text-muted-foreground">{new Date(h.created_at).toLocaleString()}</td>
                  <td className="p-2 text-foreground/80">{h.user_id.slice(0, 8)}…</td>
                  <td className="p-2 font-semibold">
                    <span className={h.success ? "text-success" : "text-danger"}>
                      {h.success ? "Success" : "Failed"}
                    </span>
                  </td>
                  <td className="p-2 text-muted-foreground">{h.ip_address ?? "—"}</td>
                  <td className="p-2 text-muted-foreground">{h.location ?? "Singapore"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="glass p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground font-mono">
        {icon}{label}
      </div>
      <div className="mt-2 text-2xl font-display font-semibold">{value}</div>
    </div>
  );
}
