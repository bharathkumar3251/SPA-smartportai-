import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { checkSubmissionTransition } from "@/lib/status-engine";
import { logAudit } from "@/lib/audit";
import type {
  Submission, SubmissionDocument, AiVerification, WorkflowEvent, ContainerRow, Stage,
} from "@/lib/workflow";

const SUBS_KEY = ["submissions"];

export function useSubmissions(stages?: Stage[]) {
  return useQuery({
    queryKey: [...SUBS_KEY, stages?.join(",") ?? "all"],
    queryFn: async () => {
      let q = supabase.from("shipment_submissions").select("*").order("created_at", { ascending: false });
      if (stages && stages.length > 0) q = q.in("stage", stages);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as Submission[];
    },
    staleTime: 15_000,
  });
}

export function useSubmissionDetail(id: string | null) {
  return useQuery({
    queryKey: ["submission", id],
    enabled: !!id,
    queryFn: async () => {
      const [docs, vers, events, containers] = await Promise.all([
        supabase.from("submission_documents").select("*").eq("submission_id", id!).order("created_at", { ascending: false }),
        supabase.from("ai_verifications").select("*").eq("submission_id", id!).order("created_at", { ascending: false }),
        supabase.from("workflow_events").select("*").eq("submission_id", id!).order("created_at", { ascending: false }),
        supabase.from("containers").select("*").eq("submission_id", id!).order("container_no"),
      ]);
      return {
        documents: (docs.data ?? []) as unknown as SubmissionDocument[],
        verifications: (vers.data ?? []) as unknown as AiVerification[],
        events: (events.data ?? []) as unknown as WorkflowEvent[],
        containers: (containers.data ?? []) as unknown as ContainerRow[],
      };
    },
    staleTime: 10_000,
  });
}

export function useContainers(stages?: ContainerRow["stage"][]) {
  return useQuery({
    queryKey: ["containers", stages?.join(",") ?? "all"],
    queryFn: async () => {
      let q = supabase.from("containers").select("*").order("updated_at", { ascending: false });
      if (stages && stages.length > 0) q = q.in("stage", stages);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as ContainerRow[];
    },
    staleTime: 10_000,
  });
}

/** Advance a submission and write its timeline entry in one call. */
export function useAdvanceStage() {
  const qc = useQueryClient();
  const { user, profile, roles } = useAuth();
  return useMutation({
    mutationFn: async (args: {
      submissionId: string;
      stage: Stage;
      action: string;
      notes?: string;
      patch?: Record<string, unknown>;
      from?: Stage;
    }) => {
      // Client-side guard mirroring the database triggers, so an illegal action
      // fails with a readable message instead of a raw Postgres error.
      if (args.from) {
        const check = checkSubmissionTransition(args.from, args.stage, roles);
        if (!check.ok) throw new Error(check.reason);
      }
      const { error } = await supabase
        .from("shipment_submissions")
        .update({ stage: args.stage, ...(args.patch ?? {}) } as never)
        .eq("id", args.submissionId);
      if (error) throw new Error(error.message);
      await supabase.from("workflow_events").insert({
        submission_id: args.submissionId,
        actor_id: user?.id ?? null,
        actor_role: roles[0] ?? null,
        actor_label: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.email || "Operator",
        stage: args.stage,
        action: args.action,
        notes: args.notes ?? null,
      } as never);
      await logAudit("data_updated", {
        target_type: "shipment_submission",
        target_id: args.submissionId,
        metadata: {
          action: args.action,
          previous_value: args.from ?? null,
          new_value: args.stage,
          notes: args.notes ?? null,
        },
      });
    },
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: SUBS_KEY });
      void qc.invalidateQueries({ queryKey: ["submission", vars.submissionId] });
      void qc.invalidateQueries({ queryKey: ["containers"] });
      void qc.invalidateQueries({ queryKey: ["notification-feed"] });
      void qc.invalidateQueries({ queryKey: ["workflow-events"] });
    },
  });
}

export function useUpdateContainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id: string; patch: Partial<ContainerRow> }) => {
      const { error } = await supabase.from("containers").update(args.patch as never).eq("id", args.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["containers"] }); },
  });
}