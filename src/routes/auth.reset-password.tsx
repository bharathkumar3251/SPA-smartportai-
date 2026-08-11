import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell, PrimaryButton } from "@/components/auth/AuthShell";
import { supabase } from "@/integrations/supabase/client";
import { scorePassword } from "@/lib/audit";
import { logAudit } from "@/lib/audit";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — SmartPort AI" }] }),
  component: () => {
    const navigate = useNavigate();
    const [pw, setPw] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const strength = useMemo(() => scorePassword(pw), [pw]);
    async function submit(e: React.FormEvent) {
      e.preventDefault();
      if (pw !== confirm) { toast.error("Passwords do not match"); return; }
      if (strength.score < 3) { toast.error("Choose a stronger password"); return; }
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: pw });
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      await logAudit("password_change");
      toast.success("Password updated");
      navigate({ to: "/auth/login" });
    }
    return (
      <AuthShell
        eyebrow="Set a new password"
        title="Choose a new password."
        subtitle="Use at least 12 characters, mixing letters, numbers and symbols."
        footer={<>Return to <Link to="/auth/login" className="text-cyan hover:underline">Sign in</Link></>}
      >
        <form className="space-y-4" onSubmit={submit}>
          <PwInput label="New password" value={pw} onChange={setPw} />
          <PwInput label="Confirm password" value={confirm} onChange={setConfirm} />
          {pw && (
            <div>
              <div className="flex gap-1">
                {[0,1,2,3].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i < strength.score ? "bg-success" : "bg-white/10"}`} />
                ))}
              </div>
              <div className="mt-1.5 text-[11px] text-muted-foreground">{strength.label}</div>
            </div>
          )}
          <PrimaryButton>{loading ? "Updating…" : "Update password"}</PrimaryButton>
        </form>
      </AuthShell>
    );
  },
});

function PwInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string)=>void }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-mono">{label}</span>
      <input value={value} onChange={(e)=>onChange(e.target.value)} type="password" required autoComplete="new-password"
        className="mt-2 w-full h-11 rounded-lg bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-cyan/70 focus:ring-2 focus:ring-cyan/20 transition" />
    </label>
  );
}
