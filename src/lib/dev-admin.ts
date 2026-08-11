// Built-in development / demo Super Admin account.
export const SYSTEM_ADMIN_EMAIL = "admin@smartport.ai";
export const SYSTEM_ADMIN_PASSWORD = "Admin@123";
export const RESERVED_EMAIL_MESSAGE = "This email is reserved for the system administrator.";

export function isReservedAdminEmail(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === SYSTEM_ADMIN_EMAIL;
}
