import { supabase } from "@/integrations/supabase/client";

export type AuditAction =
  | "login" | "logout" | "failed_login" | "password_change" | "role_change"
  | "user_created" | "user_updated" | "user_disabled" | "user_activated"
  | "data_created" | "data_updated" | "data_deleted"
  | "ai_model_execution" | "report_generated" | "api_access" | "permission_denied";

async function fetchIp(): Promise<string | null> {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    if (!res.ok) return null;
    const j = (await res.json()) as { ip?: string };
    return j.ip ?? null;
  } catch { return null; }
}

export async function logAudit(
  action: AuditAction,
  opts: { target_type?: string; target_id?: string; metadata?: Record<string, unknown>; success?: boolean } = {}
) {
  const { data: { user } } = await supabase.auth.getUser();
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
  await supabase.from("audit_logs").insert({
    actor_id: user?.id ?? null,
    actor_email: user?.email ?? null,
    action,
    target_type: opts.target_type ?? null,
    target_id: opts.target_id ?? null,
    metadata: opts.metadata ?? {},
    ip_address: null,
    user_agent: ua,
    success: opts.success ?? true,
  } as never);
}

export async function logLogin(userId: string, success: boolean, failureReason?: string) {
  const ip = await fetchIp();
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
  const device = ua ? guessDevice(ua) : "Unknown";
  await supabase.from("login_history").insert({
    user_id: userId,
    ip_address: ip,
    user_agent: ua,
    device_label: device,
    location: null,
    success,
    failure_reason: failureReason ?? null,
  } as never);
  await logAudit(success ? "login" : "failed_login", { success, metadata: { device, ip } });
}

function guessDevice(ua: string): string {
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Windows NT/.test(ua)) return "Windows";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown";
}

// -----------------------------------------------------------------------------
// Password strength
// -----------------------------------------------------------------------------
export type PasswordStrength = { score: 0|1|2|3|4; label: string; issues: string[] };
export function scorePassword(pw: string): PasswordStrength {
  const issues: string[] = [];
  if (pw.length < 12) issues.push("At least 12 characters");
  if (!/[A-Z]/.test(pw)) issues.push("An uppercase letter");
  if (!/[a-z]/.test(pw)) issues.push("A lowercase letter");
  if (!/\d/.test(pw)) issues.push("A number");
  if (!/[^A-Za-z0-9]/.test(pw)) issues.push("A symbol");
  const score = (Math.max(0, 5 - issues.length)) as 0|1|2|3|4|5;
  const clamped = Math.min(4, score) as 0|1|2|3|4;
  const labels = ["Very weak", "Weak", "Fair", "Strong", "Excellent"];
  return { score: clamped, label: labels[clamped], issues };
}

// -----------------------------------------------------------------------------
// Failed-login lockout (client-side deterrent; backend still enforces)
// -----------------------------------------------------------------------------
const LOCK_KEY = "smartport.lockout";
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60_000;

export function recordFailedAttempt(email: string) {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(LOCK_KEY);
  const map: Record<string, { count: number; until: number }> = raw ? JSON.parse(raw) : {};
  const rec = map[email] ?? { count: 0, until: 0 };
  rec.count += 1;
  if (rec.count >= MAX_ATTEMPTS) rec.until = Date.now() + LOCK_MS;
  map[email] = rec;
  window.localStorage.setItem(LOCK_KEY, JSON.stringify(map));
}
export function clearFailedAttempts(email: string) {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(LOCK_KEY);
  if (!raw) return;
  const map = JSON.parse(raw);
  delete map[email];
  window.localStorage.setItem(LOCK_KEY, JSON.stringify(map));
}
export function isLockedOut(email: string): { locked: boolean; remainingMs: number } {
  if (typeof window === "undefined") return { locked: false, remainingMs: 0 };
  const raw = window.localStorage.getItem(LOCK_KEY);
  if (!raw) return { locked: false, remainingMs: 0 };
  const map = JSON.parse(raw);
  const rec = map[email];
  if (!rec) return { locked: false, remainingMs: 0 };
  const remaining = rec.until - Date.now();
  return { locked: remaining > 0, remainingMs: Math.max(0, remaining) };
}
