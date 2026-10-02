import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { categoryLabel, difficultyLabel } from "@/lib/constants";
import type { Assessment, Attempt } from "@/lib/types";
import { StartButton } from "@/components/assessments/start-button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Assessment" };

export default async function AssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await requireRole(["member"]);
  const { data, error } = await supabase.from("assessments").select("*").eq("id", id).maybeSingle();
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;
  if (!data) notFound();
  const assessment = data as Assessment;

  const { data: attempts } = await supabase
    .from("attempts")
    .select("*")
    .eq("user_id", profile.id)
    .eq("assessment_id", id)
    .order("started_at", { ascending: false });
  const history = (attempts ?? []) as Attempt[];
  const open = history.find((attempt) => attempt.status === "in_progress");

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap gap-2">
        <Badge variant="accent">{categoryLabel(assessment.category)}</Badge>
        <Badge variant="outline">{difficultyLabel(assessment.difficulty)}</Badge>
      </div>
      <h1 className="mt-4 font-serif text-4xl">{assessment.title}</h1>
      <p className="mt-4 text-muted-foreground">{assessment.description}</p>
      <p className="mt-4 text-sm">{assessment.duration} minutes. The countdown starts when you begin, and it survives a refresh.</p>
      <div className="mt-6">
        <StartButton assessmentId={assessment.id} label={open ? "Resume assessment" : "Start assessment"} />
      </div>
      {history.filter((attempt) => attempt.status !== "in_progress").length ? (
        <div className="mt-8 space-y-2">
          <h2 className="font-medium">Previous scores</h2>
          {history
            .filter((attempt) => attempt.status !== "in_progress")
            .map((attempt) => (
              <a key={attempt.id} href={`/results/${attempt.id}`} className="block rounded-lg border bg-card px-4 py-3 text-sm">
                {Number(attempt.percentage).toFixed(0)}% · {attempt.status}
              </a>
            ))}
        </div>
      ) : null}
    </div>
  );
}
