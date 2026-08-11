import { Link } from "@tanstack/react-router";
import { Anchor } from "lucide-react";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Brand panel */}
      <div className="relative md:w-[45%] p-8 md:p-14 overflow-hidden hidden md:flex flex-col justify-between">
        <div className="absolute -top-32 -left-24 w-[600px] h-[600px] bg-violet/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 -right-24 w-[500px] h-[500px] bg-cyan/25 blur-[120px] rounded-full" />
        <div className="absolute inset-0 grid-bg opacity-30" />

        <Link to="/" className="relative z-10 flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan to-violet flex items-center justify-center">
            <Anchor className="w-4 h-4 text-background" />
          </div>
          <span className="font-display font-semibold tracking-tight text-lg">SmartPort AI</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10"
        >
          <div className="text-xs uppercase tracking-[0.24em] text-cyan font-mono">Logistics Intelligence</div>
          <h2 className="mt-3 text-4xl font-display font-semibold leading-tight">
            Command every vessel, berth<br />and truck in real time.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-md">
            Trusted by port authorities and terminal operators to predict congestion and optimize logistics at national scale.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            {[
              { k: "Ports", v: "142" },
              { k: "Vessels", v: "38K" },
              { k: "Uptime", v: "99.99%" },
            ].map((s) => (
              <div key={s.k} className="glass p-3">
                <div className="text-xl font-display font-semibold">{s.v}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{s.k}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="relative z-10 text-xs text-muted-foreground">
          SOC 2 · ISO 27001 · GDPR ready
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="md:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-violet flex items-center justify-center">
              <Anchor className="w-4 h-4 text-background" />
            </div>
            <span className="font-display font-semibold">SmartPort AI</span>
          </Link>
          <div className="text-xs uppercase tracking-[0.22em] font-mono text-cyan/90">{eyebrow}</div>
          <h1 className="mt-2 text-3xl md:text-4xl font-display font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
        </motion.div>
      </div>
    </div>
  );
}

export function GoogleButton() {
  return (
    <button
      type="button"
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
  );
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs uppercase tracking-widest text-muted-foreground font-mono">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export function Field({
  label, type = "text", placeholder, name, autoComplete,
}: {
  label: string; type?: string; placeholder?: string; name: string; autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-mono">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-2 w-full h-11 rounded-lg bg-white/[0.03] border border-border px-3 text-sm outline-none focus:border-cyan/70 focus:ring-2 focus:ring-cyan/20 transition"
      />
    </label>
  );
}

export function PrimaryButton({ children }: { children: ReactNode }) {
  return (
    <button className="w-full h-11 rounded-lg bg-gradient-to-r from-cyan to-violet text-background font-medium hover:opacity-90 transition">
      {children}
    </button>
  );
}