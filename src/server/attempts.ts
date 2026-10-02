"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, requireUser } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";

export async function startAttempt(assessmentId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("start_attempt", { p_assessment_id: assessmentId });
  if (error || !data) {
    return { ok: false as const, error: error?.message ?? "The assessment could not be started." };
  }
  redirect(`/assessments/${assessmentId}/take?attempt=${data}`);
}

export async function saveAnswer(attemptId: string, questionId: string, selected: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("save_answer", {
    p_attempt_id: attemptId,
    p_question_id: questionId,
    p_selected: selected,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function submitAttempt(attemptId: string): Promise<ActionResult> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("submit_attempt", { p_attempt_id: attemptId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/results");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function refreshReport(attemptId: string): Promise<ActionResult> {
  const { supabase } = await requireRole(["admin", "super_admin"]);
  const { error } = await supabase.rpc("refresh_report", { p_attempt_id: attemptId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${attemptId}`);
  return { ok: true };
}
