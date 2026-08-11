import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { EmptyState } from "@/components/common/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useMemo } from "react";
import { Bell, Archive, CheckCheck, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({ meta: [{ title: "Alerts — SmartPort AI" }] }),
  component: NotificationsPage,
});

type Notif = {
  id: string; title: string; body: string | null; category: string;
  priority: "low" | "normal" | "high" | "critical";
  read_at: string | null; archived_at: string | null; created_at: string; link: string | null;
};

function NotificationsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Notif[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"unread" | "all" | "archived">("unread");

  async function load() {
    if (!user) return;
    let query = supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (filter === "unread") query = query.is("read_at", null).is("archived_at", null);
    else if (filter === "archived") query = query.not("archived_at", "is", null);
    const { data } = await query;
    setRows((data ?? []) as Notif[]);
  }
  useEffect(() => { void load(); }, [user, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    if (!rows || !q) return rows;
    const t = q.toLowerCase();
    return rows.filter((r) => r.title.toLowerCase().includes(t) || (r.body ?? "").toLowerCase().includes(t));
  }, [rows, q]);

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() } as never).eq("id", id);
    void load();
  }
  async function archive(id: string) {
    await supabase.from("notifications").update({ archived_at: new Date().toISOString() } as never).eq("id", id);
    void load();
  }
  async function markAllRead() {
    if (!user) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() } as never)
      .eq("user_id", user.id).is("read_at", null);
    toast.success("All notifications marked as read");
    void load();
  }

  const priorityDot = (p: Notif["priority"]) =>
    p === "critical" ? "bg-danger" : p === "high" ? "bg-warning" : p === "normal" ? "bg-cyan" : "bg-muted-foreground";

  return (
    <div>
      <PageHeader eyebrow="Notification Center" title="Alerts & activity"
        subtitle="Real-time operational alerts, mentions and system events."
        actions={
          <button onClick={markAllRead}
            className="h-9 px-3 rounded-md border border-border bg-white/[0.02] hover:bg-white/[0.05] text-sm inline-flex items-center gap-2">
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        }
      />
      <GlassCard className="mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search notifications…"
              className="w-full h-9 pl-8 pr-3 rounded-md bg-white/[0.03] border border-border text-sm outline-none focus:border-cyan/70" />
          </div>
          <div className="flex gap-1">
            {(["unread","all","archived"] as const).map((f) => (
              <button key={f} onClick={()=>setFilter(f)}
                className={`h-9 px-3 rounded-md text-sm capitalize ${filter===f ? "bg-cyan/10 text-cyan border border-cyan/30" : "border border-border text-muted-foreground hover:text-foreground"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        {!filtered ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Bell className="w-6 h-6" />} title="No notifications"
            description="You're all caught up. New alerts will appear here in real time." />
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((n) => (
              <li key={n.id} className={`py-3 flex items-start gap-3 ${!n.read_at ? "" : "opacity-60"}`}>
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${priorityDot(n.priority)}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{n.title}</div>
                  {n.body && <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>}
                  <div className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground mt-1">
                    {n.category} · {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!n.read_at && (
                    <button onClick={()=>markRead(n.id)} title="Mark read"
                      className="h-7 w-7 rounded border border-border hover:bg-white/[0.05] flex items-center justify-center">
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!n.archived_at && (
                    <button onClick={()=>archive(n.id)} title="Archive"
                      className="h-7 w-7 rounded border border-border hover:bg-white/[0.05] flex items-center justify-center">
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
