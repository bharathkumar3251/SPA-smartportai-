import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth/AuthShell";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";

export const Route = createFileRoute("/auth/verify-email")({
  head: () => ({ meta: [{ title: "Verify email — SmartPort AI" }] }),
  component: () => {
    const [email, setEmail] = useState("");
    const [sending, setSending] = useState(false);
    async function resend() {
      if (!email) { toast.error("Enter your email"); return; }
      setSending(true);
      const { error } = await supabase.auth.resend({ type: "signup", email });
      setSending(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Verification email resent");
    }
    return (
      <AuthShell
        eyebrow="One more step"
        title="Verify your email."
        subtitle="We sent a verification link to your inbox. Click it to activate your workspace, then sign in."
        footer={<>Already verified? <Link to="/auth/login" className="text-cyan hover:underline">Sign in</Link></>}
      >
        <div className="glass p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-cyan/15 text-cyan flex items-center justify-center">
            <MailCheck className="w-4 h-4" />
          </div>
          <div className="text-sm">
            <div className="font-medium">Check your inbox</div>
            <div className="text-muted-foreground text-xs mt-0.5">The link expires in 24 hours.</div>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <label className="block">
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-mono">Didn't get it? Resend to</span>
            <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder="you@company.com"
              className="mt-2 w-full h-11 rounded-lg bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-cyan/70 focus:ring-2 focus:ring-cyan/20 transition" />
          </label>
          <button type="button" onClick={resend} disabled={sending}
            className="w-full h-11 rounded-lg border border-border bg-white/[0.02] hover:bg-white/[0.05] transition text-sm disabled:opacity-50">
            {sending ? "Sending…" : "Resend verification email"}
          </button>
        </div>
      </AuthShell>
    );
  },
});
