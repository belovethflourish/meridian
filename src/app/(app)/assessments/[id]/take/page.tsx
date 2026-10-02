import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import type { Assessment, Attempt, AttemptQuestion } from "@/lib/types";
import { TakeAssessment } from "@/components/assessments/take-assessment";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Take assessment" };

export default async function TakePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attempt?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, profile } = await requireRole(["member"]);

  const { data: assessmentRow } = await supabase.from("assessments").select("*").eq("id", id).maybeSingle();
  if (!assessmentRow) notFound();
  const assessment = assessmentRow as Assessment;

  let attemptQuery = supabase
    .from("attempts")
    .select("*")
    .eq("user_id", profile.id)
    .eq("assessment_id", id)
    .eq("status", "in_progress");
  if (query.attempt) attemptQuery = attemptQuery.eq("id", query.attempt);
  const { data: attemptRow } = await attemptQuery.maybeSingle();

  if (!attemptRow) {
    return (
      <div className="max-w-lg space-y-4">
        <h1 className="font-serif text-4xl">No open attempt</h1>
        <p className="text-sm text-muted-foreground">Start the assessment to create a timed attempt.</p>
        <Button asChild>
          <Link href={`/assessments/${id}`}>Back to overview</Link>
        </Button>
      </div>
    );
  }

  const attempt = attemptRow as Attempt;
  const { data: questions, error } = await supabase.rpc("get_attempt_questions", { p_attempt_id: attempt.id });
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;

  return (
    <TakeAssessment
      attemptId={attempt.id}
      title={assessment.title}
      startedAt={attempt.started_at}
      durationMinutes={assessment.duration}
      questions={(questions ?? []) as AttemptQuestion[]}
    />
  );
}
