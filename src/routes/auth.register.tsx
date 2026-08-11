import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell, Divider, PrimaryButton } from "@/components/auth/AuthShell";
import { ROLES, type Role } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { scorePassword } from "@/lib/audit";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { isReservedAdminEmail, RESERVED_EMAIL_MESSAGE } from "@/lib/dev-admin";

export const Route = createFileRoute("/auth/register")({
  head: () => ({ meta: [{ title: "Create account — SmartPort AI" }] }),
  component: RegisterPage,
});

const SELECTABLE_ROLES = ROLES.filter((r) => r.id !== "super_admin");

function RegisterPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("port_authority");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const strength = useMemo(() => scorePassword(password), [password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!agreed) { toast.error("Please accept the terms"); return; }
    if (isReservedAdminEmail(email)) { toast.error(RESERVED_EMAIL_MESSAGE); return; }
    if (strength.score < 3) { toast.error("Choose a stronger password"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: {
          first_name: first,
          last_name: last,
          organization: org,
          requested_role: role,
        },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Check your email to verify your account");
    navigate({ to: "/auth/verify-email" });
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Google sign-in failed");
  }

  return (
    <AuthShell
      eyebrow="Get started"
      title="Create your workspace."
      subtitle="Deploy SmartPort AI for your organization in minutes. Accounts require Super Admin approval before elevated roles are granted."
      footer={<>Already registered? <Link to="/auth/login" className="text-cyan hover:underline">Sign in</Link></>}
    >
      <button type="button" onClick={handleGoogle}
        className="w-full h-11 rounded-lg glass flex items-center justify-center gap-3 hover:border-cyan/60 transition text-sm">
        Continue with Google
      </button>
      <Divider label="or continue with email" />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" value={first} onChange={setFirst} required />
          <Input label="Last name" value={last} onChange={setLast} required />
        </div>
        <Input label="Work email" value={email} onChange={setEmail} type="email" required autoComplete="email" />
        <Input label="Organization" value={org} onChange={setOrg} required />
        <Input label="Password" value={password} onChange={setPassword} type="password" required autoComplete="new-password" placeholder="At least 12 characters" />
        {password.length > 0 && (
          <div>
            <div className="flex gap-1">
              {[0,1,2,3].map((i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${
                  i < strength.score ? (strength.score >= 3 ? "bg-success" : strength.score >= 2 ? "bg-warning" : "bg-danger") : "bg-white/10"
                }`} />
              ))}
            </div>
            <div className="mt-1.5 text-[11px] text-muted-foreground">
              {strength.label}{strength.issues.length > 0 && ` — needs ${strength.issues.slice(0,2).join(", ").toLowerCase()}`}
            </div>
          </div>
        )}
        <div>
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-mono">Requested role</span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {SELECTABLE_ROLES.map((r) => (
              <button
                type="button" key={r.id} onClick={() => setRole(r.id)}
                className={`px-2 py-2 rounded-lg text-[11px] border transition text-left ${
                  role === r.id ? "border-cyan/60 bg-cyan/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >{r.short}</button>
            ))}
          </div>
          <div className="mt-1.5 text-[11px] text-muted-foreground">
            Your role is <span className="text-foreground">Data Analyst</span> until a Super Admin approves <span className="text-foreground">{ROLES.find(r=>r.id===role)?.label}</span>.
          </div>
        </div>
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input type="checkbox" className="accent-cyan mt-0.5" checked={agreed} onChange={(e)=>setAgreed(e.target.checked)} />
          <span>I agree to the <a href="#" className="text-cyan hover:underline">Terms</a> and <a href="#" className="text-cyan hover:underline">Data Processing Agreement</a>.</span>
        </label>
        <PrimaryButton>{loading ? "Creating…" : "Create workspace"}</PrimaryButton>
      </form>
    </AuthShell>
  );
}

function Input({
  label, value, onChange, type = "text", required, placeholder, autoComplete,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string; autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-mono">{label}</span>
      <input
        value={value} onChange={(e) => onChange(e.target.value)}
        type={type} required={required} placeholder={placeholder} autoComplete={autoComplete}
        className="mt-2 w-full h-11 rounded-lg bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-cyan/70 focus:ring-2 focus:ring-cyan/20 transition"
      />
    </label>
  );
}
