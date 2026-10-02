import Link from "next/link";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { categoryLabel } from "@/lib/constants";
import type { Assessment, Attempt } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Dashboard" };

export default async function MemberDashboardPage() {
  const { supabase, profile } = await requireRole(["member"]);
  const [{ data: assessments, error: assessmentError }, { data: attempts, error: attemptError }] = await Promise.all([
    supabase.from("assessments").select("*").order("title"),
    supabase.from("attempts").select("*").eq("user_id", profile.id).order("started_at", { ascending: false }),
  ]);

  if (assessmentError || attemptError) {
    return <p className="text-sm text-destructive">{assessmentError?.message || attemptError?.message}</p>;
  }

  const catalog = (assessments ?? []) as Assessment[];
  const history = (attempts ?? []) as Attempt[];
  const completed = history.filter((attempt) => attempt.status !== "in_progress");
  const average = completed.length
    ? completed.reduce((sum, attempt) => sum + Number(attempt.percentage), 0) / completed.length
    : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Member"
        title={`Hello, ${profile.full_name.split(" ")[0] || "there"}`}
        description="Your published assessments, open attempts, and latest scores."
        action={
          <Button asChild>
            <Link href="/assessments">Browse assessments</Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Available", catalog.length.toString()],
          ["Completed", completed.length.toString()],
          ["Average", completed.length ? `${average.toFixed(0)}%` : "—"],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="font-serif text-4xl">{value}</CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Open catalog</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {catalog.slice(0, 4).map((assessment) => (
              <Link key={assessment.id} href={`/assessments/${assessment.id}`} className="block rounded-lg border px-3 py-3 hover:bg-accent">
                <p className="font-medium">{assessment.title}</p>
                <p className="text-sm text-muted-foreground">
                  {categoryLabel(assessment.category)} · {assessment.duration} min
                </p>
              </Link>
            ))}
            {catalog.length === 0 ? <p className="text-sm text-muted-foreground">No assessments are published yet.</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent attempts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.slice(0, 5).map((attempt) => (
              <Link
                key={attempt.id}
                href={attempt.status === "in_progress" ? "/assessments" : `/results/${attempt.id}`}
                className="flex items-center justify-between rounded-lg border px-3 py-3 hover:bg-accent"
              >
                <span className="text-sm capitalize">{attempt.status.replace("_", " ")}</span>
                <span className="text-sm font-medium">{attempt.status === "in_progress" ? "Resume" : `${Number(attempt.percentage).toFixed(0)}%`}</span>
              </Link>
            ))}
            {history.length === 0 ? <p className="text-sm text-muted-foreground">You have not started an assessment yet.</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
