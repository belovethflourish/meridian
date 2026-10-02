import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import type { Assessment, Attempt } from "@/lib/types";
import { AssessmentCard } from "@/components/assessments/assessment-card";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Assessments" };

export default async function AssessmentsPage() {
  const { supabase, profile } = await requireRole(["member"]);
  const [{ data, error }, { data: attempts }] = await Promise.all([
    supabase.from("assessments").select("*").order("title"),
    supabase.from("attempts").select("assessment_id, status").eq("user_id", profile.id),
  ]);
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;

  const history = (attempts ?? []) as Pick<Attempt, "assessment_id" | "status">[];

  return (
    <div>
      <PageHeader eyebrow="Catalog" title="Assessments" description="Published tests, plus anything an admin has assigned to you." />
      <div className="grid gap-4 md:grid-cols-2">
        {((data ?? []) as Assessment[]).map((assessment) => {
          const open = history.find((attempt) => attempt.assessment_id === assessment.id && attempt.status === "in_progress");
          const done = history.filter((attempt) => attempt.assessment_id === assessment.id && attempt.status !== "in_progress").length;
          return (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              href={`/assessments/${assessment.id}`}
              meta={open ? "In progress" : done ? `${done} completed` : "Not started"}
            />
          );
        })}
      </div>
      {(data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Nothing is available yet.</p> : null}
    </div>
  );
}
