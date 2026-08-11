// Cinematic hero background — realistic smart port photograph with
// subtle Ken Burns motion, atmospheric depth, and readability overlays.
// The image itself contains the ship, cranes, containers and harbor;
// motion is intentionally minimal so the UI stays in focus.
import { motion } from "framer-motion";
import heroPort from "@/assets/hero-port.jpg";

export function PortScene() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Photographic port — very slow Ken Burns drift */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.08, x: 0, y: 0 }}
        animate={{ scale: 1.14, x: "-1.5%", y: "1%" }}
        transition={{ duration: 40, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      >
        <img
          src={heroPort}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "blur(1.5px) saturate(0.95) brightness(0.85)" }}
          fetchPriority="high"
          width={1920}
          height={1280}
        />
      </motion.div>

      {/* Soft cloud drift — a light haze band across the sky */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[55%] opacity-30 mix-blend-screen"
        animate={{ x: ["-4%", "4%"] }}
        transition={{ duration: 60, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
        style={{
          background:
            "radial-gradient(60% 40% at 30% 40%, oklch(0.95 0.02 90 / 0.35), transparent 70%), radial-gradient(50% 35% at 75% 30%, oklch(0.9 0.03 80 / 0.28), transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      {/* Gentle water shimmer band */}
      <motion.div
        className="absolute left-0 right-0 bottom-[6%] h-[22%] opacity-40 mix-blend-overlay"
        animate={{ x: ["-2%", "2%"] }}
        transition={{ duration: 14, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        style={{
          background:
            "repeating-linear-gradient(180deg, transparent 0 6px, oklch(1 0 0 / 0.05) 6px 7px)",
          filter: "blur(1px)",
        }}
      />

      {/* Cinematic darkening overlay for readability (~45%) */}
      <div className="absolute inset-0 bg-background/50" />

      {/* Left-to-right readability gradient behind the copy */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, oklch(0.13 0.05 260 / 0.85) 0%, oklch(0.13 0.05 260 / 0.55) 40%, oklch(0.13 0.05 260 / 0.15) 75%, transparent 100%)",
        }}
      />

      {/* Bottom vignette blending into the page */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />

      {/* Subtle warm sun bloom for cinematic depth */}
      <div
        className="absolute -top-24 -right-24 w-[600px] h-[600px] rounded-full opacity-30 blur-[120px]"
        style={{ background: "radial-gradient(circle, oklch(0.85 0.14 70 / 0.7), transparent 65%)" }}
      />
      <div
        className="absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full opacity-20 blur-[140px]"
        style={{ background: "radial-gradient(circle, oklch(0.7 0.18 250 / 0.6), transparent 70%)" }}
      />
    </div>
  );
}