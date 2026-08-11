import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, Radar, Sparkles } from "lucide-react";
import { PortScene } from "@/components/landing/PortScene";
import { LandingNav } from "@/components/landing/LandingNav";
import {
  Features, Architecture, AIModels, TechStack, WorkflowSection,
  Roles, Partners, Pricing, FAQ, Contact, Footer,
} from "@/components/landing/Sections";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <LandingNav />
      <Hero />
      <Features />
      <Architecture />
      <AIModels />
      <TechStack />
      <WorkflowSection />
      <Roles />
      <Partners />
      <Pricing />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative min-h-[100svh] pt-28 pb-16 px-6 flex items-center overflow-hidden">
      <PortScene />
      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-mono uppercase tracking-widest text-cyan">
            <Sparkles className="w-3.5 h-3.5" /> Live prediction · v4.2
          </div>
          <h1 className="mt-6 text-5xl md:text-7xl font-display font-semibold tracking-tight leading-[1.02]">
            AI-Powered <br />
            <span className="text-gradient">Smart Port</span> Intelligence.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
            Predict congestion. Optimize logistics. Improve berth utilization.
            Reduce waiting time — across every terminal, vessel and truck gate.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              to="/auth/register"
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan to-violet text-background font-medium glow-ring hover:opacity-90 transition"
            >
              Launch Platform
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
            <button className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl glass hover:border-cyan/60 transition">
              <PlayCircle className="w-4 h-4 text-cyan" /> Watch AI Workflow
            </button>
            <Link
              to="/app/live-map"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-border hover:border-cyan/60 transition"
            >
              <Radar className="w-4 h-4 text-cyan" /> View Live Port
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
            {[
              { k: "Pilot Port", v: "PSA SG" },
              { k: "Singapore BBox AIS", v: "Live Stream" },
              { k: "Document AI Model", v: "Gemini 3.5" },
              { k: "Role Workspaces", v: "10 Roles" },
            ].map((s) => (
              <div key={s.k} className="glass p-4">
                <div className="text-xl font-semibold font-display truncate">{s.v}</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono mt-1 truncate">
                  {s.k}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Floating live console preview */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.4 }}
        className="hidden xl:block absolute right-6 top-32 w-[380px] z-10"
      >
        <div className="glass-strong p-5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">PSA Live Console</div>
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
          </div>
          <div className="mt-4">
            <div className="text-xs text-muted-foreground">Singapore Strait &amp; Pasir Panjang</div>
            <div className="text-3xl font-display font-semibold mt-1">
              PSA Singapore <span className="text-cyan text-base font-mono">PILOT</span>
            </div>
          </div>
          <div className="mt-4 h-20 flex items-end gap-1">
            {[35, 42, 38, 54, 62, 58, 70, 68, 78, 75, 84, 88, 80, 90, 94, 89].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-gradient-to-t from-cyan/20 to-cyan"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="mt-4 space-y-2 text-xs">
            {[
              { t: "Pasir Panjang Terminal berth queue active", tone: "cyan" },
              { t: "AISStream Singapore bbox websocket connected", tone: "success" },
              { t: "Open-Meteo marine weather active", tone: "success" },
            ].map((row) => (
              <div key={row.t} className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  row.tone === "warning" ? "bg-warning" : row.tone === "success" ? "bg-success" : "bg-cyan"
                }`} />
                <span className="text-muted-foreground">{row.t}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
