import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { listDirectory } from "@/lib/data";
import type { Assessment, Question } from "@/lib/types";
import { AssessmentFormDialog, AssessmentWorkspace, DeleteAssessmentButton } from "@/components/admin/assessment-tools";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Edit assessment" };

export default async function AdminAssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireRole(["admin", "super_admin"]);
  const { data, error } = await supabase.from("assessments").select("*").eq("id", id).maybeSingle();
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;
  if (!data) notFound();
  const assessment = data as Assessment;

  const [{ data: questionRows }, { data: assignmentRows }, members] = await Promise.all([
    supabase.from("questions").select("*").eq("assessment_id", id).order("sort_order"),
    supabase.from("assessment_assignments").select("user_id").eq("assessment_id", id),
    listDirectory(supabase, true),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={assessment.status}
        title={assessment.title}
        description={assessment.description}
        action={
          <div className="flex gap-2">
            <AssessmentFormDialog assessment={assessment} />
            <DeleteAssessmentButton id={assessment.id} />
          </div>
        }
      />
      <AssessmentWorkspace
        assessment={assessment}
        questions={(questionRows ?? []) as Question[]}
        members={members.filter((person) => person.role === "member")}
        assignedIds={((assignmentRows ?? []) as { user_id: string }[]).map((row) => row.user_id)}
      />
    </div>
  );
}
