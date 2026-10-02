import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import type { AttemptReview } from "@/lib/types";
import { ReportActions } from "@/components/admin/report-actions";
import { ResultView } from "@/components/results/result-view";

export const metadata: Metadata = { title: "Report" };

export default async function AdminReportPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const { supabase } = await requireRole(["admin", "super_admin"]);
  const { data, error } = await supabase.rpc("get_attempt_review", { p_attempt_id: attemptId });
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;
  if (!data) notFound();
  const review = data as AttemptReview;

  return (
    <ResultView
      review={review}
      action={<ReportActions attemptId={attemptId} assessmentTitle={review.assessment.title} />}
    />
  );
}
