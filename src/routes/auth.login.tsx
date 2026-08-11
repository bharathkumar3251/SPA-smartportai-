import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell, Divider, Field, PrimaryButton } from "@/components/auth/AuthShell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { logAudit, logLogin, recordFailedAttempt, clearFailedAttempts, isLockedOut } from "@/lib/audit";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ensureSystemAdmin } from "@/lib/dev-admin.functions";
import { homeForRoles, type Role } from "@/lib/roles";
import { setViewAsRole } from "@/lib/view-as";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Sign in — SmartPort AI" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [lockRemaining, setLockRemaining] = useState(0);

  // Guarantee the built-in Super Admin account exists on app entry.
  useEffect(() => { void ensureSystemAdmin().catch(() => {}); }, []);

  useEffect(() => {
    if (!email) { setLockRemaining(0); return; }
    const tick = () => setLockRemaining(isLockedOut(email).remainingMs);
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [email]);

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const lock = isLockedOut(email);
    if (lock.locked) {
      toast.error(`Account locked. Try again in ${Math.ceil(lock.remainingMs / 60000)} min.`);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      recordFailedAttempt(email);
      await logAudit("failed_login", { success: false, metadata: { email, reason: error.message } });
      toast.error(error.message);
      setLoading(false);
      return;
    }
    clearFailedAttempts(email);
    if (!remember) {
      // Best-effort: sign-out on tab close is not possible; leave persistence to Supabase.
    }
    if (data.user) await logLogin(data.user.id, true);
    // Clear any previous "view as" portal impersonation.
    setViewAsRole(null);
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user!.id);
    const userRoles = ((roleRows ?? []) as { role: Role }[]).map((r) => r.role);
    toast.success("Signed in");
    navigate({ to: userRoles.length ? homeForRoles(userRoles) : "/app" });
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Google sign-in failed");
  }

  return (
    <AuthShell
      eyebrow="Secure Sign in"
      title="Welcome back."
      subtitle="Sign in to your SmartPort AI workspace."
      footer={<>Don't have an account? <Link to="/auth/register" className="text-cyan hover:underline">Create one</Link></>}
    >
      <button
        type="button"
        onClick={handleGoogle}
        className="w-full h-11 rounded-lg glass flex items-center justify-center gap-3 hover:border-cyan/60 transition text-sm"
      >
        <svg width="16" height="16" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Continue with Google
      </button>
      <Divider label="or" />
      <form onSubmit={handlePassword} className="space-y-4">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-mono">Work email</span>
          <input
            value={email} onChange={(e) => setEmail(e.target.value)}
            type="email" required autoComplete="email"
            placeholder="you@company.com"
            className="mt-2 w-full h-11 rounded-lg bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-cyan/70 focus:ring-2 focus:ring-cyan/20 transition"
          />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-mono">Password</span>
          <input
            value={password} onChange={(e) => setPassword(e.target.value)}
            type="password" required autoComplete="current-password"
            placeholder="••••••••"
            className="mt-2 w-full h-11 rounded-lg bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-cyan/70 focus:ring-2 focus:ring-cyan/20 transition"
          />
        </label>
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-muted-foreground">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-cyan" /> Remember me
          </label>
          <Link to="/auth/forgot-password" className="text-cyan hover:underline">Forgot password?</Link>
        </div>
        {lockRemaining > 0 && (
          <div className="text-[11px] text-danger">
            Too many failed attempts. Locked for {Math.ceil(lockRemaining / 60000)} more minute(s).
          </div>
        )}
        <PrimaryButton>{loading ? "Signing in…" : "Sign in"}</PrimaryButton>
      </form>
    </AuthShell>
  );
}
