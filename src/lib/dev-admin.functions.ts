import { createServerFn } from "@tanstack/react-start";

/**
 * Idempotently guarantees the built-in Super Admin account exists, is active
 * and holds the super_admin role. Safe to call on every app boot.
 */
export const ensureSystemAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { SYSTEM_ADMIN_EMAIL, SYSTEM_ADMIN_PASSWORD } = await import("./dev-admin");

  // 1) Locate the auth user (paginate defensively; the list API has no email filter).
  let userId: string | null = null;
  for (let page = 1; page <= 20 && !userId; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => (u.email ?? "").toLowerCase() === SYSTEM_ADMIN_EMAIL);
    if (found) userId = found.id;
    if (data.users.length < 200) break;
  }

  // 2) Create it when missing (pre-confirmed so it can sign in immediately).
  if (!userId) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: SYSTEM_ADMIN_EMAIL,
      password: SYSTEM_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        first_name: "System",
        last_name: "Administrator",
        organization: "SmartPort AI",
      },
    });
    if (error && !/already/i.test(error.message)) throw error;
    userId = data?.user?.id ?? null;
    if (!userId) return { ok: false as const };
  }

  // 3) Profile: always active, never pending, no requested role left over.
  const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
    {
      id: userId,
      email: SYSTEM_ADMIN_EMAIL,
      first_name: "System",
      last_name: "Administrator",
      organization: "SmartPort AI",
      status: "active",
      requested_role: null,
    },
    { onConflict: "id" },
  );
  if (profileError) throw profileError;

  // 4) Role: ensure super_admin is present (additive - other roles are kept).
  const { data: existing } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (!existing) {
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "super_admin" });
    if (roleError) throw roleError;
  }

  return { ok: true as const, userId };
});
