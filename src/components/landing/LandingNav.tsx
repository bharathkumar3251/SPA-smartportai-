import { Link } from "@tanstack/react-router";
import { Anchor, ArrowRight } from "lucide-react";

export function LandingNav() {
  return (
    <header className="fixed top-4 inset-x-4 z-50">
      <nav className="max-w-6xl mx-auto glass-strong px-4 sm:px-6 h-14 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan to-violet flex items-center justify-center">
            <Anchor className="w-4 h-4 text-background" />
          </div>
          <span className="font-display font-semibold tracking-tight">SmartPort <span className="text-cyan">AI</span></span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition">Features</a>
          <a href="#architecture" className="hover:text-foreground transition">Architecture</a>
          <a href="#ai" className="hover:text-foreground transition">AI Models</a>
          <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
          <a href="#faq" className="hover:text-foreground transition">FAQ</a>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/auth/login" className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">Sign in</Link>
          <Link
            to="/auth/register"
            className="text-sm bg-gradient-to-r from-cyan to-violet text-background font-medium px-4 py-2 rounded-lg flex items-center gap-1.5 hover:opacity-90 transition"
          >
            Launch Platform <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>
    </header>
  );
}