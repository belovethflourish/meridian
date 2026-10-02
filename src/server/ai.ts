"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";
import { aiRequestSchema } from "@/lib/validators";

export async function queueAiJob(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = aiRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Describe what you want generated." };
  }

  const { supabase, profile } = await requireRole(["admin", "super_admin"]);
  const { data: setting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", parsed.data.feature === "question_generator" ? "ai_question_generator_enabled" : "ai_candidate_reports_enabled")
    .maybeSingle();

  const enabled = setting?.value === true;
  const { data, error } = await supabase
    .from("ai_generations")
    .insert({
      feature: parsed.data.feature,
      status: "pending",
      requested_by: profile.id,
      organization_id: profile.organization_id,
      assessment_id: parsed.data.assessmentId ?? null,
      attempt_id: parsed.data.attemptId ?? null,
      prompt: parsed.data.prompt,
      input: {
        prompt: parsed.data.prompt,
        assessment_id: parsed.data.assessmentId ?? null,
        attempt_id: parsed.data.attemptId ?? null,
        provider_enabled: enabled,
      },
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/assessments");
  return {
    ok: true,
    data: { id: data.id as string },
  };
}
