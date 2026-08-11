import { useState } from "react";
import { GlassCard } from "@/components/common/GlassCard";
import { askAssistant } from "@/lib/ai-workflow.functions";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, SendHorizontal, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AiAssistantPanel({
  portal,
  suggestions,
  context,
  className,
}: {
  portal: string;
  suggestions: string[];
  context?: string;
  className?: string;
}) {
  const ask = useServerFn(askAssistant);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(q: string) {
    if (!q.trim() || loading) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await ask({ data: { portal, question: q, context } });
      setAnswer(res.answer);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI assistant unavailable");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard className={className}>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan/25 to-violet/20 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-cyan" />
        </span>
        <div>
          <div className="text-[13.5px] font-medium">AI Assistant</div>
          <div className="text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground">{portal}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {suggestions.map((s) => (
          <button key={s} onClick={() => { setQuestion(s); void run(s); }} disabled={loading}
            className="px-2 py-1 rounded border border-border text-[11.5px] text-muted-foreground hover:text-foreground hover:border-cyan/40 transition disabled:opacity-50">
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); void run(question); }} className="flex gap-2">
        <input
          value={question} onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask the assistant…"
          className="flex-1 h-9 rounded-md bg-white/[0.03] border border-border px-3 text-[13px] outline-none focus:border-cyan/60 transition"
        />
        <button type="submit" disabled={loading}
          className="h-9 w-9 rounded-md bg-gradient-to-r from-cyan to-violet text-background flex items-center justify-center disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
        </button>
      </form>

      {answer && (
        <div className="mt-3 rounded-md border border-cyan/20 bg-cyan/[0.04] p-3 text-[12.5px] leading-relaxed whitespace-pre-wrap text-foreground/90">
          {answer}
        </div>
      )}
    </GlassCard>
  );
}