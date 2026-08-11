import { Search, Bell, Command as CommandIcon, MessageSquare, HelpCircle, ChevronRight, LogOut, User, Settings as SettingsIcon, ChevronDown, LogOutIcon, Monitor, Repeat2, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { CommandPalette } from "./CommandPalette";
import { ROLES, roleMeta, primaryRoleFrom, type Role } from "@/lib/roles";
import { useViewAsRole } from "@/lib/view-as";
import { useAuth } from "@/hooks/useAuth";
import { logAudit } from "@/lib/audit";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ROUTE_LABELS: Record<string, string> = {
  app: "Console",
  "live-map": "Live Map",
  "port-authority": "Port Authority",
  terminal: "Terminals",
  customs: "Customs",
  shipping: "Shipping",
  warehouse: "Warehouse",
  logistics: "Logistics Ops",
  truck: "Fleet & Trucking",
  ai: "AI Predictions",
  analytics: "Analytics",
  reports: "Reports",
  notifications: "Alerts",
  audit: "Audit Center",
  admin: "Administration",
  settings: "Settings",
};

function useBreadcrumbs() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((seg, i) => ({
    label: ROUTE_LABELS[seg] ?? seg.replace(/-/g, " "),
    href: "/" + segments.slice(0, i + 1).join("/"),
    last: i === segments.length - 1,
  }));
}

export function TopNav() {
  const navigate = useNavigate();
  const { user, profile, roles, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const { viewAs, setViewAs } = useViewAsRole();
  const isSuperAdmin = roles.includes("super_admin");
  const primary: Role = isSuperAdmin && viewAs ? viewAs : primaryRoleFrom(roles);
  const active = roleMeta(primary);
  const crumbs = useBreadcrumbs();

  const name = profile?.first_name || profile?.last_name
    ? `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()
    : user?.email?.split("@")[0] ?? "User";
  const initials = ((profile?.first_name?.[0] ?? user?.email?.[0] ?? "U") + (profile?.last_name?.[0] ?? "")).toUpperCase();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null)
        .is("archived_at", null);
      if (!cancelled) setUnread(count ?? 0);
    };
    load();
    const channel = supabase.channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  async function handleSignOut() {
    await logAudit("logout");
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/auth/login" });
  }

  async function handleSignOutAll() {
    await logAudit("logout", { metadata: { scope: "all_devices" } });
    await supabase.auth.signOut({ scope: "global" });
    toast.success("Signed out from all devices");
    navigate({ to: "/auth/login" });
  }

  return (
    <header className="h-14 border-b border-border bg-background/60 backdrop-blur-xl sticky top-0 z-30">
      <div className="h-full pl-5 pr-3 lg:pr-4 flex items-center gap-4">
        <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1.5 text-[12.5px] min-w-0 shrink">
          {crumbs.map((c, i) => (
            <div key={c.href} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/60 shrink-0" />}
              {c.last ? (
                <span className="text-foreground font-medium truncate">{c.label}</span>
              ) : (
                <Link to={c.href} className="text-muted-foreground hover:text-foreground transition truncate">{c.label}</Link>
              )}
            </div>
          ))}
        </nav>

        <div className="flex-1" />

        <button onClick={() => setOpen(true)}
          className="hidden sm:flex items-center gap-2.5 h-9 pl-3 pr-2 w-[280px] rounded-md border border-border bg-white/[0.02] text-[12.5px] text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition">
          <Search className="w-3.5 h-3.5" />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border text-[10px] font-mono text-muted-foreground">
            <CommandIcon className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        <div className="hidden md:flex items-center gap-1.5 px-2.5 h-7 rounded-md border border-border bg-white/[0.02] text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
          Production
        </div>

        <IconBtn label="Help"><HelpCircle className="w-4 h-4" /></IconBtn>
        <IconBtn label="Messages"><MessageSquare className="w-4 h-4" /></IconBtn>
        <Link to="/app/notifications" aria-label="Notifications"
          className="relative w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition">
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-danger text-background text-[10px] font-medium flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Link>

        <div className="w-px h-6 bg-border mx-0.5" />

        <div className="relative">
          <button onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2.5 h-9 pl-1 pr-2 rounded-md hover:bg-white/[0.04] transition">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan to-violet flex items-center justify-center text-background text-[11px] font-semibold">
              {initials}
            </div>
            <div className="hidden lg:block text-left leading-tight">
              <div className="text-[12px] font-medium truncate max-w-[140px]">{name}</div>
              <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{active.label}</div>
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground hidden lg:block" />
          </button>
          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-72 rounded-md border border-border bg-popover/95 backdrop-blur-xl shadow-xl z-50 overflow-hidden">
                <div className="px-3 py-3 border-b border-border">
                  <div className="text-[13px] font-medium">{name}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{user?.email}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {roles.map((r) => (
                      <span key={r} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-cyan/20 bg-cyan/5 text-cyan text-[10px] font-mono uppercase tracking-wider">
                        {roleMeta(r).short}
                      </span>
                    ))}
                    {profile?.status && profile.status !== "active" && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-warning/30 bg-warning/10 text-warning text-[10px] font-mono uppercase tracking-wider">
                        {profile.status}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-1">
                  <MenuItem to="/app/settings" icon={<User className="w-3.5 h-3.5" />} onClick={() => setProfileOpen(false)}>Profile & preferences</MenuItem>
                  <MenuItem to="/app/settings" icon={<SettingsIcon className="w-3.5 h-3.5" />} onClick={() => setProfileOpen(false)}>Workspace settings</MenuItem>
                  <MenuItem to="/app/audit" icon={<Monitor className="w-3.5 h-3.5" />} onClick={() => setProfileOpen(false)}>Login history</MenuItem>
                </div>
                {isSuperAdmin && (
                  <div className="p-1 border-t border-border">
                    <button onClick={() => setSwitchOpen((o) => !o)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[12.5px] text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition">
                      <Repeat2 className="w-3.5 h-3.5" /> Switch role
                      <ChevronDown className={cn("w-3 h-3 ml-auto transition-transform", switchOpen && "rotate-180")} />
                    </button>
                    {switchOpen && (
                      <div className="mt-1 max-h-64 overflow-y-auto scrollbar-thin">
                        {viewAs && (
                          <button onClick={() => { setViewAs(null); setProfileOpen(false); navigate({ to: "/app/admin" }); }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[12px] text-cyan hover:bg-cyan/10 transition text-left">
                            <Undo2 className="w-3.5 h-3.5" /> Return to Super Admin
                          </button>
                        )}
                        {ROLES.filter((r) => r.id !== "super_admin").map((r) => (
                          <button key={r.id}
                            onClick={() => { setViewAs(r.id); setProfileOpen(false); setSwitchOpen(false); navigate({ to: r.home }); }}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[12px] text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition text-left">
                            <r.icon className="w-3.5 h-3.5" />
                            <span className="flex-1 truncate">{r.label}</span>
                            {viewAs === r.id && <span className="text-[9px] font-mono uppercase text-cyan">viewing</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="p-1 border-t border-border">
                  <button onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[12.5px] text-danger hover:bg-danger/10 transition">
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                  </button>
                  <button onClick={handleSignOutAll}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-[12.5px] text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition">
                    <LogOutIcon className="w-3.5 h-3.5" /> Sign out from all devices
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </header>
  );
}

function IconBtn({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button aria-label={label} title={label}
      className={cn("relative w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition")}>
      {children}
    </button>
  );
}

function MenuItem({ to, icon, children, onClick }: { to: string; icon: React.ReactNode; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link to={to} onClick={onClick}
      className="flex items-center gap-2 px-2 py-1.5 rounded text-[12.5px] text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition">
      {icon}{children}
    </Link>
  );
}
