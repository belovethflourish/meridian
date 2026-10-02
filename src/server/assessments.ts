"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";
import { assessmentSchema, assignmentSchema, questionSchema } from "@/lib/validators";

function firstIssue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

export async function saveAssessment(input: unknown, id?: string): Promise<ActionResult<{ id: string }>> {
  const parsed = assessmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const { supabase, profile } = await requireRole(["admin", "super_admin"]);
  const payload = {
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    duration: parsed.data.duration,
    difficulty: parsed.data.difficulty,
    status: parsed.data.status,
    organization_id: profile.organization_id,
  };

  if (id) {
    const { error } = await supabase.from("assessments").update(payload).eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/assessments");
    revalidatePath(`/admin/assessments/${id}`);
    return { ok: true, data: { id } };
  }

  const { data, error } = await supabase
    .from("assessments")
    .insert({ ...payload, created_by: profile.id })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/assessments");
  return { ok: true, data: { id: data.id as string } };
}

export async function deleteAssessment(id: string): Promise<ActionResult> {
  const { supabase } = await requireRole(["admin", "super_admin"]);
  const { error } = await supabase.from("assessments").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/assessments");
  return { ok: true };
}

export async function saveQuestion(input: unknown, id?: string): Promise<ActionResult> {
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const { supabase } = await requireRole(["admin", "super_admin"]);
  const payload = {
    assessment_id: parsed.data.assessmentId,
    question_text: parsed.data.questionText,
    question_type: parsed.data.questionType,
    options: parsed.data.options,
    correct_answer: parsed.data.questionType === "likert" ? null : parsed.data.correctAnswer,
    points: parsed.data.points,
    difficulty: parsed.data.difficulty,
    category: parsed.data.category,
  };

  const query = id
    ? supabase.from("questions").update(payload).eq("id", id)
    : supabase.from("questions").insert({
        ...payload,
        sort_order: Date.now() % 100000,
      });

  const { error } = await query;
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/questions");
  revalidatePath(`/admin/assessments/${parsed.data.assessmentId}`);
  return { ok: true };
}

export async function deleteQuestion(id: string, assessmentId: string): Promise<ActionResult> {
  const { supabase } = await requireRole(["admin", "super_admin"]);
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/questions");
  revalidatePath(`/admin/assessments/${assessmentId}`);
  return { ok: true };
}

export async function assignAssessment(input: unknown): Promise<ActionResult> {
  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { supabase, profile } = await requireRole(["admin", "super_admin"]);
  const { error } = await supabase.from("assessment_assignments").insert({
    assessment_id: parsed.data.assessmentId,
    user_id: parsed.data.userId,
    assigned_by: profile.id,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/assessments/${parsed.data.assessmentId}`);
  return { ok: true };
}

export async function unassignAssessment(input: unknown): Promise<ActionResult> {
  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { supabase } = await requireRole(["admin", "super_admin"]);
  const { error } = await supabase
    .from("assessment_assignments")
    .delete()
    .eq("assessment_id", parsed.data.assessmentId)
    .eq("user_id", parsed.data.userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/assessments/${parsed.data.assessmentId}`);
  return { ok: true };
}
