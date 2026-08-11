import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { StatusBadge } from "@/components/common/StatusBadges";
import { useAuth } from "@/hooks/useAuth";
import { roleMeta } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, Shield, Building, Key, Loader2 } from "lucide-react";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "Account & Settings — SmartPort AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, roles, refresh } = useAuth();
  const [firstName, setFirstName] = useState(profile?.first_name ?? "");
  const [lastName, setLastName] = useState(profile?.last_name ?? "");
  const [org, setOrg] = useState(profile?.organization ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? "");
      setLastName(profile.last_name ?? "");
      setOrg(profile.organization ?? "");
    }
  }, [profile]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        organization: org.trim() || null,
      } as never)
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile updated successfully");
      void refresh();
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Workspace Settings"
        title="Profile & account preferences."
        subtitle="Manage your profile metadata, verified organization, active roles and security settings."
      />

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Profile Card */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center gap-2 text-cyan mb-4">
            <User className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest font-mono">User Profile</span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">First name</span>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. John"
                  className="mt-1.5 w-full h-10 rounded-md bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-cyan/60"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Last name</span>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Tan"
                  className="mt-1.5 w-full h-10 rounded-md bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-cyan/60"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Work Email (read-only)</span>
              <input
                value={user?.email ?? ""}
                readOnly
                className="mt-1.5 w-full h-10 rounded-md bg-white/[0.02] border border-border/60 px-3 text-sm text-muted-foreground font-mono cursor-not-allowed"
              />
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">Organization / Enterprise</span>
              <input
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                placeholder="e.g. PSA Singapore / Ocean Network Express"
                className="mt-1.5 w-full h-10 rounded-md bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-cyan/60"
              />
            </label>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="h-10 px-5 rounded-md bg-gradient-to-r from-cyan to-violet text-background font-medium text-sm inline-flex items-center gap-2 disabled:opacity-50 hover:opacity-90 transition"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </GlassCard>

        {/* Account Info & Roles */}
        <div className="space-y-4">
          <GlassCard>
            <div className="flex items-center gap-2 text-cyan mb-3">
              <Shield className="w-4 h-4" />
              <span className="text-xs uppercase tracking-widest font-mono">Assigned Roles</span>
            </div>
            <div className="space-y-2 mt-2">
              {roles.map((r) => {
                const meta = roleMeta(r);
                return (
                  <div key={r} className="p-2.5 rounded border border-cyan/20 bg-cyan/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <meta.icon className="w-4 h-4 text-cyan" />
                      <span className="text-xs font-medium">{meta.label}</span>
                    </div>
                    <StatusBadge tone="cyan">{meta.short}</StatusBadge>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 text-cyan mb-3">
              <Building className="w-4 h-4" />
              <span className="text-xs uppercase tracking-widest font-mono">Account Status</span>
            </div>
            <div className="text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <StatusBadge tone={profile?.status === "active" ? "success" : "warning"}>
                  {profile?.status ?? "pending"}
                </StatusBadge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">User ID:</span>
                <span className="truncate max-w-[140px]">{user?.id?.slice(0, 8)}…</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Auth Provider:</span>
                <span>{user?.app_metadata?.provider ?? "email"}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}