import { Link } from "@tanstack/react-router";
import { Shield, LockKeyhole, Compass, ServerCrash } from "lucide-react";
import { motion } from "framer-motion";

function ErrorFrame({
  code, icon: Icon, title, subtitle, tone = "cyan",
}: { code: string; icon: typeof Shield; title: string; subtitle: string; tone?: "cyan" | "danger" | "violet" }) {
  const toneCls =
    tone === "danger" ? "from-danger/25 to-danger/5 text-danger" :
    tone === "violet" ? "from-violet/25 to-violet/5 text-violet" :
    "from-cyan/25 to-cyan/5 text-cyan";
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md text-center"
      >
        <div className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${toneCls} flex items-center justify-center border border-white/10`}>
          <Icon className="w-7 h-7" strokeWidth={1.5} />
        </div>
        <div className="mt-6 text-[11px] uppercase tracking-[0.28em] font-mono text-muted-foreground">Error {code}</div>
        <h1 className="mt-2 text-3xl font-display font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/app" className="h-10 px-4 rounded-md bg-gradient-to-r from-cyan to-violet text-background text-sm font-medium hover:opacity-90 transition inline-flex items-center">
            Back to console
          </Link>
          <Link to="/" className="h-10 px-4 rounded-md border border-border bg-white/[0.02] text-sm hover:bg-white/[0.05] transition inline-flex items-center">
            Return home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export function ForbiddenPanel() {
  return <ErrorFrame code="403" icon={Shield} tone="danger"
    title="Access denied"
    subtitle="Your workspace role does not include permission to view this page. Contact your administrator if you believe this is a mistake." />;
}
export function UnauthorizedPanel() {
  return <ErrorFrame code="401" icon={LockKeyhole} tone="violet"
    title="Authentication required"
    subtitle="Your session has expired or you are not signed in. Please sign in again to continue." />;
}
export function NotFoundPanel() {
  return <ErrorFrame code="404" icon={Compass}
    title="Page not found"
    subtitle="The page you're looking for doesn't exist, was moved, or is not part of your current workspace." />;
}
export function ServerErrorPanel({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-danger/25 to-danger/5 text-danger flex items-center justify-center border border-white/10">
          <ServerCrash className="w-7 h-7" strokeWidth={1.5} />
        </div>
        <div className="mt-6 text-[11px] uppercase tracking-[0.28em] font-mono text-muted-foreground">Error 500</div>
        <h1 className="mt-2 text-3xl font-display font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          The server encountered an unexpected error. Our engineers have been notified.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {onRetry && (
            <button onClick={onRetry} className="h-10 px-4 rounded-md bg-gradient-to-r from-cyan to-violet text-background text-sm font-medium hover:opacity-90 transition">
              Try again
            </button>
          )}
          <Link to="/app" className="h-10 px-4 rounded-md border border-border bg-white/[0.02] text-sm hover:bg-white/[0.05] transition inline-flex items-center">
            Back to console
          </Link>
        </div>
      </div>
    </div>
  );
}
