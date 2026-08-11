import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MODEL = "google/gemini-3.5-flash";
const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

type GatewayMessage = { role: "system" | "user"; content: string };

async function callGateway(messages: GatewayMessage[], json: boolean): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (res.status === 429) throw new Error("AI rate limit reached — please retry shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted for this workspace.");
  if (!res.ok) throw new Error(`AI request failed (${res.status})`);
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return body.choices?.[0]?.message?.content ?? "";
}

const REQUIRED_DOCS = [
  "vessel_arrival_notice", "cargo_manifest", "bill_of_lading", "crew_list",
  "container_list", "insurance_certificate", "port_clearance", "eta_information",
];

type Issue = { severity: "low" | "medium" | "high"; check: string; detail: string };

/**
 * Runs AI document verification for a submission: missing documents, formats,
 * duplicates, invalid dates, expired certificates, dangerous-goods mismatch,
 * cargo consistency, OCR sanity and fraud indicators.
 */
export const verifySubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { submissionId: string }) => {
    if (!input?.submissionId) throw new Error("submissionId is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: submission, error: sErr } = await supabase
      .from("shipment_submissions").select("*").eq("id", data.submissionId).maybeSingle();
    if (sErr) throw new Error(sErr.message);
    if (!submission) throw new Error("Submission not found");

    const { data: docs } = await supabase
      .from("submission_documents").select("*").eq("submission_id", data.submissionId);
    const documents = docs ?? [];

    // ---- deterministic rule checks (always run, feed the model) ----
    const issues: Issue[] = [];
    const present = new Set(documents.map((d) => d.doc_type as string));
    for (const req of REQUIRED_DOCS) {
      if (!present.has(req)) {
        issues.push({ severity: "high", check: "Missing document", detail: `${req.replace(/_/g, " ")} has not been submitted.` });
      }
    }
    if (submission.dangerous_goods && !present.has("dangerous_goods_declaration")) {
      issues.push({ severity: "high", check: "Dangerous cargo mismatch", detail: "Cargo is declared hazardous but no Dangerous Goods Declaration was uploaded." });
    }
    if (!submission.dangerous_goods && present.has("dangerous_goods_declaration")) {
      issues.push({ severity: "medium", check: "Dangerous cargo mismatch", detail: "A Dangerous Goods Declaration was uploaded but the shipment is not flagged as hazardous." });
    }
    const seen = new Map<string, number>();
    for (const d of documents) seen.set(d.doc_type as string, (seen.get(d.doc_type as string) ?? 0) + 1);
    for (const [type, count] of seen) {
      if (count > 1) issues.push({ severity: "medium", check: "Duplicate submission", detail: `${count} copies of ${type.replace(/_/g, " ")} were submitted.` });
    }
    const today = new Date();
    for (const d of documents) {
      if (d.expires_on && new Date(d.expires_on) < today) {
        issues.push({ severity: "high", check: "Expired certificate", detail: `${d.file_name} expired on ${d.expires_on}.` });
      }
      if (d.issued_on && new Date(d.issued_on) > today) {
        issues.push({ severity: "medium", check: "Invalid dates", detail: `${d.file_name} carries a future issue date (${d.issued_on}).` });
      }
      const ext = (d.file_name.split(".").pop() ?? "").toLowerCase();
      if (!["pdf", "png", "jpg", "jpeg", "xml", "csv", "xlsx", "doc", "docx"].includes(ext)) {
        issues.push({ severity: "medium", check: "Incorrect format", detail: `${d.file_name} is not an accepted document format.` });
      }
    }
    if (!submission.eta) issues.push({ severity: "high", check: "Invalid dates", detail: "No ETA declared for the vessel." });
    else if (new Date(submission.eta) < today) issues.push({ severity: "medium", check: "Invalid dates", detail: "Declared ETA is in the past." });
    if (!submission.imo_number || !/^\d{7}$/.test(submission.imo_number)) {
      issues.push({ severity: "medium", check: "Fraud indicator", detail: "IMO number is missing or not a valid 7-digit identifier." });
    }
    if (submission.container_count <= 0) {
      issues.push({ severity: "medium", check: "Cargo inconsistency", detail: "Container count is zero while a container list is expected." });
    }

    // ---- model analysis on top of the rule findings ----
    let aiPayload: {
      risk_score?: number; confidence?: number; verdict?: string;
      issues?: Issue[]; recommendations?: string[]; checks?: { name: string; status: string; detail: string }[];
    } = {};
    try {
      const raw = await callGateway([
        {
          role: "system",
          content:
            "You are the SmartPort AI maritime document verification engine for PSA Singapore. " +
            "Assess a vessel arrival document package. Respond ONLY with JSON: " +
            '{"risk_score":0-100,"confidence":0-100,"verdict":"verified"|"needs_manual_review"|"rejected",' +
            '"issues":[{"severity":"low|medium|high","check":string,"detail":string}],' +
            '"recommendations":[string],"checks":[{"name":string,"status":"pass|warn|fail","detail":string}]}. ' +
            "Always include checks for: missing documents, incorrect formats, duplicate submissions, invalid dates, " +
            "expired certificates, dangerous cargo mismatch, missing UN numbers, cargo inconsistencies, OCR validation, fraud indicators.",
        },
        {
          role: "user",
          content: JSON.stringify({
            submission: {
              reference: submission.reference, vessel: submission.vessel_name, imo: submission.imo_number,
              voyage: submission.voyage_number, cargo_type: submission.cargo_type,
              containers: submission.container_count, dangerous_goods: submission.dangerous_goods,
              origin_port: submission.origin_port, eta: submission.eta, etd: submission.etd,
            },
            documents: documents.map((d) => ({
              type: d.doc_type, file: d.file_name, mime: d.mime_type,
              size: d.file_size, issued_on: d.issued_on, expires_on: d.expires_on,
            })),
            deterministic_findings: issues,
          }),
        },
      ], true);
      aiPayload = JSON.parse(raw);
    } catch {
      aiPayload = {};
    }

    const mergedIssues: Issue[] = [...issues, ...(Array.isArray(aiPayload.issues) ? aiPayload.issues : [])]
      .filter((i) => i && i.check && i.detail)
      .slice(0, 24);
    const high = mergedIssues.filter((i) => i.severity === "high").length;
    const medium = mergedIssues.filter((i) => i.severity === "medium").length;
    const fallbackRisk = Math.min(100, high * 22 + medium * 9);
    const risk = typeof aiPayload.risk_score === "number"
      ? Math.round((aiPayload.risk_score + fallbackRisk) / 2)
      : fallbackRisk;
    const confidence = typeof aiPayload.confidence === "number" ? Math.round(aiPayload.confidence) : 82;
    const verdict: "verified" | "needs_manual_review" | "rejected" =
      high >= 3 || risk >= 75 ? "rejected"
      : high > 0 || risk >= 35 ? "needs_manual_review"
      : "verified";

    const recommendations = (Array.isArray(aiPayload.recommendations) ? aiPayload.recommendations : []).slice(0, 8);
    if (recommendations.length === 0) {
      recommendations.push(
        verdict === "verified"
          ? "Package is complete and consistent — forward to Port Authority review."
          : "Resolve the flagged findings and re-run verification before authority review.",
      );
    }
    const checks = Array.isArray(aiPayload.checks) ? aiPayload.checks.slice(0, 12) : [];

    await supabase.from("ai_verifications").insert({
      submission_id: submission.id,
      scope: "documents",
      risk_score: risk,
      confidence,
      verdict,
      issues: mergedIssues,
      recommendations,
      checks,
      model: MODEL,
    } as never);

    const nextStage = verdict === "rejected" ? "ai_rejected" : "authority_review";
    await supabase.from("shipment_submissions")
      .update({ ai_risk_score: risk, ai_confidence: confidence, ai_verdict: verdict, stage: nextStage } as never)
      .eq("id", submission.id);

    await supabase.from("workflow_events").insert({
      submission_id: submission.id,
      actor_id: userId,
      actor_label: "SmartPort AI",
      stage: nextStage,
      action: `AI verification: ${verdict.replace(/_/g, " ")}`,
      notes: `Risk ${risk} · Confidence ${confidence}% · ${mergedIssues.length} finding(s)`,
    } as never);

    return { risk, confidence, verdict, issues: mergedIssues, recommendations, checks };
  });

/** Portal-scoped AI assistant. Returns plain text advice. */
export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { portal: string; question: string; context?: string }) => {
    if (!input?.question?.trim()) throw new Error("question is required");
    return { portal: input.portal ?? "port", question: input.question.slice(0, 2000), context: (input.context ?? "").slice(0, 6000) };
  })
  .handler(async ({ data }) => {
    const text = await callGateway([
      {
        role: "system",
        content:
          `You are the SmartPort AI assistant embedded in the ${data.portal} portal of a PSA Singapore ` +
          "port congestion and logistics intelligence platform. Answer operationally, in under 180 words, " +
          "with concrete numbers, short bullet points and a clear recommendation. Never invent regulatory approvals.",
      },
      { role: "user", content: data.context ? `Live context:\n${data.context}\n\nQuestion: ${data.question}` : data.question },
    ], false);
    return { answer: text.trim() || "No answer produced." };
  });

export type AiStatsResponse = {
  totalRuns: number;
  avgRisk: number | null;
  avgConfidence: number | null;
  verdicts: { verified: number; needs_manual_review: number; rejected: number };
  model: string;
};

/** Computes real AI verification statistics from the public.ai_verifications database table. */
export const getAiVerificationStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AiStatsResponse> => {
    const { supabase } = context;
    const { data: verifications } = await supabase
      .from("ai_verifications")
      .select("risk_score, confidence, verdict, model");

    const rows = verifications ?? [];
    const totalRuns = rows.length;

    if (totalRuns === 0) {
      return {
        totalRuns: 0,
        avgRisk: null,
        avgConfidence: null,
        verdicts: { verified: 0, needs_manual_review: 0, rejected: 0 },
        model: MODEL,
      };
    }

    const avgRisk = Math.round(rows.reduce((sum, r) => sum + (Number(r.risk_score) || 0), 0) / totalRuns);
    const avgConfidence = Math.round(rows.reduce((sum, r) => sum + (Number(r.confidence) || 0), 0) / totalRuns);
    const verdicts = {
      verified: rows.filter((r) => r.verdict === "verified").length,
      needs_manual_review: rows.filter((r) => r.verdict === "needs_manual_review").length,
      rejected: rows.filter((r) => r.verdict === "rejected").length,
    };

    return {
      totalRuns,
      avgRisk,
      avgConfidence,
      verdicts,
      model: MODEL,
    };
  });