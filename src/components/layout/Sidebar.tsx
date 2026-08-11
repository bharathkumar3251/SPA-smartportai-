import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, ChevronLeft, Anchor, ChevronsUpDown, Check,
} from "lucide-react";
import { ROLES, roleMeta, primaryRoleFrom, type Role } from "@/lib/roles";
import { ROLE_MODULES, isModuleActive } from "@/lib/role-modules";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useViewAsRole } from "@/lib/view-as";

export function Sidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const searchStr = useRouterState({ select: (r) => r.location.searchStr });
  const { roles } = useAuth();
  const navigate = useNavigate();
  const { viewAs, setViewAs } = useViewAsRole();
  const [collapsed, setCollapsed] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const isSuperAdmin = roles.includes("super_admin");
  const primary: Role = isSuperAdmin && viewAs ? viewAs : primaryRoleFrom(roles);
  const active = roleMeta(primary);

  // Build the role-scoped module list. Every user sees ONLY their portal's items.
  const modules = ROLE_MODULES[primary] ?? [];
  const grouped = modules.reduce<{ heading: string; items: typeof modules }[]>((acc, m) => {
    const heading = m.group ?? "Portal";
    const last = acc[acc.length - 1];
    if (last && last.heading === heading) last.items.push(m);
    else acc.push({ heading, items: [m] });
    return acc;
  }, []);

  return (
    <aside className={cn(
      "hidden lg:flex flex-col shrink-0 border-r border-border bg-sidebar/70 backdrop-blur-xl transition-[width] duration-300",
      collapsed ? "w-[68px]" : "w-[260px]"
    )}>
      <div className="h-16 flex items-center gap-2.5 px-4 border-b border-border shrink-0">
        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-cyan to-violet flex items-center justify-center shrink-0">
          <Anchor className="w-4 h-4 text-background" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <div className="leading-tight min-w-0">
            <div className="font-display font-semibold text-[13px] tracking-tight truncate">SmartPort AI</div>
            <div className="text-[9px] uppercase tracking-[0.24em] text-muted-foreground">PSA Singapore</div>
          </div>
        )}
        <button onClick={() => setCollapsed((c) => !c)}
          className="ml-auto text-muted-foreground hover:text-foreground transition shrink-0" aria-label="Toggle sidebar">
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Role display / switcher (super admin can jump between role homes) */}
      <div className="px-3 pt-3 pb-2 shrink-0 relative">
        <button
          onClick={() => setSwitcherOpen((o) => !o)}
          disabled={!isSuperAdmin}
          className={cn(
            "w-full flex items-center gap-2.5 rounded-md border border-border bg-white/[0.02] hover:bg-white/[0.05] transition px-2.5 py-2 text-left disabled:cursor-default disabled:hover:bg-white/[0.02]",
            collapsed && "justify-center px-0"
          )}
        >
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan/25 to-violet/20 flex items-center justify-center text-cyan shrink-0">
            <active.icon className="w-3.5 h-3.5" />
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">Workspace</div>
                <div className="text-[12.5px] font-medium truncate">{active.label} Portal</div>
              </div>
              {isSuperAdmin && <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
            </>
          )}
        </button>
        {switcherOpen && !collapsed && (
          <div className="absolute left-3 right-3 top-full mt-1 z-40 rounded-md border border-border bg-popover/95 backdrop-blur-xl shadow-xl p-1">
            {ROLES.map((r) => (
              <button key={r.id} type="button"
                onClick={() => {
                  setSwitcherOpen(false);
                  setViewAs(r.id === "super_admin" ? null : r.id);
                  navigate({ to: r.home });
                }}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-[12.5px] hover:bg-white/[0.05] transition text-left">
                <r.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{r.label}</span>
                {r.id === primary && <Check className="w-3.5 h-3.5 text-cyan shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-3">
        {grouped.map((group, gi) => (
          <div key={group.heading} className={cn("pt-3", gi === 0 && "pt-1")}>
            {!collapsed && (
              <div className="px-3 pb-1.5 text-[9px] uppercase tracking-[0.24em] text-muted-foreground/70 font-medium">
                {group.heading}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = isModuleActive(item, pathname, searchStr ?? "");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.slug}
                    to={item.to}
                    search={item.m ? { m: item.m } : {}}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 mx-1 px-2.5 py-1.5 rounded-md text-[13px] transition-colors relative",
                      isActive ? "bg-white/[0.06] text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]",
                      collapsed && "justify-center px-0"
                    )}>
                    {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-cyan" />}
                    <Icon className={cn("w-[15px] h-[15px] shrink-0", isActive && "text-cyan")} strokeWidth={1.75} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="mx-3 mb-3 rounded-md border border-border bg-white/[0.02] px-3 py-2.5 text-[11px] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
            <span className="text-foreground font-medium">PSA · Operational</span>
          </div>
          <div className="mt-1 text-muted-foreground font-mono text-[10px]">v2.0.0 · rbac enforced</div>
        </div>
      )}
      {collapsed && (
        <div className="mx-auto mb-3 shrink-0" aria-label="System operational">
          <span className="block w-2 h-2 rounded-full bg-success animate-pulse-dot" />
        </div>
      )}
    </aside>
  );
}

// Suppress unused import warning for Role
export type { Role };
