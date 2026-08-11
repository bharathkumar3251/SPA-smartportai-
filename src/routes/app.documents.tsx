import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { GlassCard } from "@/components/common/GlassCard";
import { SubmissionWorkspace } from "@/components/workflow/SubmissionWorkspace";
import { StageActions } from "@/components/workflow/StageActions";
import { DOCUMENT_TYPES, makeReference, type DocumentType } from "@/lib/workflow";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { verifySubmission } from "@/lib/ai-workflow.functions";
import { toast } from "sonner";
import { Upload, Loader2, Plus, Brain } from "lucide-react";

export const Route = createFileRoute("/app/documents")({
  head: () => ({
    meta: [
      { title: "Shipping Documents — SmartPort AI" },
      { name: "description", content: "Upload vessel arrival documents, trigger AI verification and track approval status across the SmartPort AI workflow." },
      { property: "og:title", content: "Shipping Documents — SmartPort AI" },
      { property: "og:description", content: "Vessel document submission, AI verification and approval tracking for PSA Singapore." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const runVerification = useServerFn(verifySubmission);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    vessel_name: "", imo_number: "", voyage_number: "", cargo_type: "",
    container_count: "0", origin_port: "", eta: "", etd: "", dangerous_goods: false,
  });

  async function createSubmission(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    const { error } = await supabase.from("shipment_submissions").insert({
      created_by: user.id,
      reference: makeReference(form.vessel_name),
      shipping_company: profile?.organization ?? "Unregistered carrier",
      vessel_name: form.vessel_name,
      imo_number: form.imo_number || null,
      voyage_number: form.voyage_number || null,
      cargo_type: form.cargo_type || null,
      container_count: Number(form.container_count) || 0,
      dangerous_goods: form.dangerous_goods,
      origin_port: form.origin_port || null,
      eta: form.eta ? new Date(form.eta).toISOString() : null,
      etd: form.etd ? new Date(form.etd).toISOString() : null,
      stage: "uploaded",
    } as never);
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Submission created — upload the required documents");
    setShowForm(false);
    setForm({ vessel_name: "", imo_number: "", voyage_number: "", cargo_type: "", container_count: "0", origin_port: "", eta: "", etd: "", dangerous_goods: false });
    void qc.invalidateQueries({ queryKey: ["submissions"] });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Shipping Line Portal"
        title="Document submission & approval."
        subtitle="Upload the arrival document package, run automatic AI verification and follow the approval chain from Port Authority through Customs to berth allocation."
        actions={
          <button onClick={() => setShowForm((s) => !s)}
            className="h-9 px-3 rounded-md bg-gradient-to-r from-cyan to-violet text-background text-sm inline-flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> New submission
          </button>
        }
      />

      {showForm && (
        <GlassCard className="mb-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-4">New vessel submission</div>
          <form onSubmit={createSubmission} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Text label="Vessel name" value={form.vessel_name} onChange={(v) => setForm({ ...form, vessel_name: v })} required />
            <Text label="IMO number" value={form.imo_number} onChange={(v) => setForm({ ...form, imo_number: v })} placeholder="7 digits" />
            <Text label="Voyage number" value={form.voyage_number} onChange={(v) => setForm({ ...form, voyage_number: v })} />
            <Text label="Cargo type" value={form.cargo_type} onChange={(v) => setForm({ ...form, cargo_type: v })} />
            <Text label="Containers" value={form.container_count} onChange={(v) => setForm({ ...form, container_count: v })} type="number" />
            <Text label="Origin port" value={form.origin_port} onChange={(v) => setForm({ ...form, origin_port: v })} />
            <Text label="ETA" value={form.eta} onChange={(v) => setForm({ ...form, eta: v })} type="datetime-local" />
            <Text label="ETD" value={form.etd} onChange={(v) => setForm({ ...form, etd: v })} type="datetime-local" />
            <label className="flex items-center gap-2 text-[12.5px] text-muted-foreground sm:col-span-2">
              <input type="checkbox" className="accent-cyan" checked={form.dangerous_goods}
                onChange={(e) => setForm({ ...form, dangerous_goods: e.target.checked })} />
              Shipment carries dangerous goods (IMDG)
            </label>
            <div className="sm:col-span-2 flex items-end">
              <button disabled={creating}
                className="h-10 px-4 rounded-md bg-gradient-to-r from-cyan to-violet text-background text-sm disabled:opacity-60">
                {creating ? "Creating…" : "Create submission"}
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      <SubmissionWorkspace
        portal="Shipping Line"
        suggestions={["Which documents are still missing?", "Explain the AI findings", "How do I clear the flagged issues?"]}
        emptyTitle="No submissions yet"
        emptyDescription="Create a vessel submission and upload the arrival document package to start the workflow."
        actions={({ submission, detail }) => (
          <div className="space-y-4">
            <UploadPanel
              submissionId={submission.id}
              userId={user?.id ?? ""}
              uploaded={(detail?.documents ?? []).map((d) => d.doc_type)}
              onUploaded={async () => {
                void qc.invalidateQueries({ queryKey: ["submission", submission.id] });
                try {
                  const res = await runVerification({ data: { submissionId: submission.id } });
                  toast.success(`AI verification: ${res.verdict.replace(/_/g, " ")} · risk score ${res.risk}`);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "AI verification failed");
                }
                void qc.invalidateQueries({ queryKey: ["submission", submission.id] });
                void qc.invalidateQueries({ queryKey: ["submissions"] });
              }}
            />
            <div className="pt-3 border-t border-border/60 flex flex-wrap items-center gap-3">
              <button
                onClick={async () => {
                  try {
                    const res = await runVerification({ data: { submissionId: submission.id } });
                    toast.success(`AI verification complete: ${res.verdict.replace(/_/g, " ")} · risk score ${res.risk}`);
                    void qc.invalidateQueries({ queryKey: ["submission", submission.id] });
                    void qc.invalidateQueries({ queryKey: ["submissions"] });
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "AI verification failed");
                  }
                }}
                className="h-9 px-3.5 rounded-md border border-cyan/40 bg-cyan/10 text-cyan text-[12.5px] inline-flex items-center gap-1.5 hover:bg-cyan/20 transition"
              >
                Run AI Verification
              </button>
            </div>
            <div className="pt-3 border-t border-border/60">
              <StageActions
                submission={submission}
                actions={
                  submission.stage === "modification_requested"
                    ? [{ label: "Resubmit to Port Authority", stage: "authority_review", action: "Resubmitted to Port Authority" }]
                    : [{ label: "Submit to Port Authority", stage: "authority_review", action: "Submitted to Port Authority for review" }]
                }
                notesLabel="Submission notes for Port Authority"
                hint="Submitting moves the voyage package to the Port Authority review queue and notifies authority officers."
              />
            </div>
          </div>
        )}
      />
    </div>
  );
}

function UploadPanel({
  submissionId, userId, uploaded, onUploaded,
}: {
  submissionId: string; userId: string; uploaded: DocumentType[]; onUploaded: () => Promise<void>;
}) {
  const [docType, setDocType] = useState<DocumentType>("vessel_arrival_notice");
  const [expires, setExpires] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (!userId) return;
    const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB limit
    if (file.size > MAX_SIZE_BYTES) {
      toast.error(`File size exceeds 25 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB)`);
      return;
    }
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    const ALLOWED = ["pdf", "png", "jpg", "jpeg", "xml", "csv", "xlsx", "doc", "docx"];
    if (!ALLOWED.includes(ext)) {
      toast.error(`Unsupported file type .${ext}. Allowed formats: ${ALLOWED.join(", ")}`);
      return;
    }

    setBusy(true);
    const path = `${userId}/${submissionId}/${docType}-${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    const up = await supabase.storage.from("shipping-documents").upload(path, file);
    if (up.error) { setBusy(false); toast.error(up.error.message); return; }
    const { error } = await supabase.from("submission_documents").insert({
      submission_id: submissionId,
      uploaded_by: userId,
      doc_type: docType,
      file_name: file.name,
      file_path: path,
      mime_type: file.type || null,
      file_size: file.size,
      expires_on: expires || null,
    } as never);
    if (error) { setBusy(false); toast.error(error.message); return; }
    toast.success("Document uploaded — running AI verification");
    await onUploaded();
    setBusy(false);
    setExpires("");
  }

  const missing = DOCUMENT_TYPES.filter((d) => d.required && !uploaded.includes(d.id));

  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono mb-3">Upload document</div>
      <div className="grid sm:grid-cols-[minmax(0,1fr)_170px_auto] gap-3 items-end">
        <label className="block">
          <span className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">Document type</span>
          <select value={docType} onChange={(e) => setDocType(e.target.value as DocumentType)}
            className="mt-1.5 w-full h-10 rounded-md bg-white/[0.03] border border-border px-2.5 text-[13px] outline-none focus:border-cyan/60">
            {DOCUMENT_TYPES.map((d) => (
              <option key={d.id} value={d.id}>{d.label}{uploaded.includes(d.id) ? " ✓" : d.required ? " (required)" : ""}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">Expiry (optional)</span>
          <input type="date" value={expires} onChange={(e) => setExpires(e.target.value)}
            className="mt-1.5 w-full h-10 rounded-md bg-white/[0.03] border border-border px-2.5 text-[13px] outline-none focus:border-cyan/60" />
        </label>
        <label className={`h-10 px-4 rounded-md border border-cyan/40 bg-cyan/10 text-cyan text-[13px] inline-flex items-center gap-2 cursor-pointer ${busy ? "opacity-60 pointer-events-none" : ""}`}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {busy ? "Uploading…" : "Choose file"}
          <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }} />
        </label>
      </div>
      <div className="mt-3 text-[11.5px] text-muted-foreground">
        {missing.length === 0
          ? "All required documents received."
          : `Still required: ${missing.map((m) => m.label).join(", ")}`}
      </div>
    </div>
  );
}

function Text({
  label, value, onChange, type = "text", required, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[9.5px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} type={type} required={required} placeholder={placeholder}
        className="mt-1.5 w-full h-10 rounded-md bg-white/[0.03] border border-border px-2.5 text-[13px] outline-none focus:border-cyan/60 transition" />
    </label>
  );
}