import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import type { AttemptReview } from "@/lib/types";
import { ResultView } from "@/components/results/result-view";

export const metadata: Metadata = { title: "Result" };

export default async function ResultDetailPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const { supabase } = await requireRole(["member"]);
  const { data, error } = await supabase.rpc("get_attempt_review", { p_attempt_id: attemptId });
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;
  if (!data) notFound();
  return <ResultView review={data as AttemptReview} />;
}
