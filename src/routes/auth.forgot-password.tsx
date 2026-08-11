import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, PrimaryButton } from "@/components/auth/AuthShell";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — SmartPort AI" }] }),
  component: () => {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    async function submit(e: React.FormEvent) {
      e.preventDefault();
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      setSent(true);
      toast.success("Reset link sent");
    }
    return (
      <AuthShell
        eyebrow="Recover access"
        title="Forgot your password?"
        subtitle="Enter your work email and we'll send a secure reset link."
        footer={<>Back to <Link to="/auth/login" className="text-cyan hover:underline">Sign in</Link></>}
      >
        {sent ? (
          <div className="text-sm text-muted-foreground">
            If an account exists for <span className="text-foreground">{email}</span>, a reset link has been sent.
          </div>
        ) : (
          <form className="space-y-4" onSubmit={submit}>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-mono">Work email</span>
              <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required autoComplete="email"
                className="mt-2 w-full h-11 rounded-lg bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-cyan/70 focus:ring-2 focus:ring-cyan/20 transition" />
            </label>
            <PrimaryButton>{loading ? "Sending…" : "Send reset link"}</PrimaryButton>
          </form>
        )}
      </AuthShell>
    );
  },
});
