import Link from "next/link";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { categoryLabel } from "@/lib/constants";
import type { Assessment, Question } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Questions" };

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ assessment?: string }>;
}) {
  const { assessment: assessmentId } = await searchParams;
  const { supabase } = await requireRole(["admin", "super_admin"]);
  let query = supabase.from("questions").select("*").order("created_at", { ascending: false }).limit(200);
  if (assessmentId) query = query.eq("assessment_id", assessmentId);
  const [{ data, error }, { data: assessments }] = await Promise.all([
    query,
    supabase.from("assessments").select("id, title"),
  ]);
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;

  const titles = new Map(((assessments ?? []) as Pick<Assessment, "id" | "title">[]).map((item) => [item.id, item.title]));
  const questions = (data ?? []) as Question[];

  return (
    <div>
      <PageHeader eyebrow="Item bank" title="Questions" description="Every question an admin can edit. Answer keys are not shown to candidates until they submit." />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/questions" className="rounded-full border bg-card px-3 py-1 text-sm">
          All
        </Link>
        {((assessments ?? []) as Pick<Assessment, "id" | "title">[]).map((assessment) => (
          <Link key={assessment.id} href={`/admin/questions?assessment=${assessment.id}`} className="rounded-full border bg-card px-3 py-1 text-sm">
            {assessment.title}
          </Link>
        ))}
      </div>
      <div className="space-y-3">
        {questions.map((question) => (
          <Link key={question.id} href={`/admin/assessments/${question.assessment_id}`} className="block rounded-xl border bg-card p-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{titles.get(question.assessment_id) ?? "Assessment"}</Badge>
              <Badge variant="outline">{categoryLabel(question.category)}</Badge>
            </div>
            <p className="mt-2 text-sm">{question.question_text}</p>
          </Link>
        ))}
        {questions.length === 0 ? <p className="text-sm text-muted-foreground">No questions match this filter.</p> : null}
      </div>
    </div>
  );
}
