import { createFileRoute, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { canAccess } from "@/lib/roles";
import { ForbiddenPanel } from "@/components/common/ErrorPanels";
import { Anchor } from "lucide-react";

export const Route = createFileRoute("/app")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const { loading, isAuthenticated, roles, profile } = useAuth();

  // Redirect unauthenticated to /auth/login (client-only, ssr:false)
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate({ to: "/auth/login" });
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading || !isAuthenticated) return <BootSplash />;

  // Disabled accounts land on a 403 shell across the whole console
  if (profile?.status === "disabled") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ForbiddenPanel />
      </div>
    );
  }

  const allowed = canAccess(pathname, roles);

  return (
    <div className="min-h-screen flex w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 relative">
          <div className="absolute inset-0 -z-10 grid-bg opacity-20 [mask-image:radial-gradient(ellipse_at_top,black_10%,transparent_60%)]" />
          <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-8 py-7 lg:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                {allowed ? <Outlet /> : <ForbiddenPanel />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

function BootSplash() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan to-violet flex items-center justify-center animate-pulse">
          <Anchor className="w-4 h-4 text-background" />
        </div>
        <div className="text-sm text-muted-foreground font-mono">Loading workspace…</div>
      </div>
    </div>
  );
}
