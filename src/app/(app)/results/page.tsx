import Link from "next/link";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import type { Assessment, Attempt } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Results" };

export default async function ResultsPage() {
  const { supabase, profile } = await requireRole(["member"]);
  const [{ data: attempts, error }, { data: assessments }] = await Promise.all([
    supabase.from("attempts").select("*").eq("user_id", profile.id).neq("status", "in_progress").order("completed_at", { ascending: false }),
    supabase.from("assessments").select("id, title"),
  ]);
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;

  const titles = new Map(((assessments ?? []) as Pick<Assessment, "id" | "title">[]).map((item) => [item.id, item.title]));
  const rows = (attempts ?? []) as Attempt[];

  return (
    <div>
      <PageHeader eyebrow="History" title="Results" description="Completed attempts, with the report generated when you submitted." />
      <div className="space-y-3">
        {rows.map((attempt) => (
          <Link key={attempt.id} href={`/results/${attempt.id}`} className="flex items-center justify-between rounded-xl border bg-card px-4 py-4">
            <div>
              <p className="font-medium">{titles.get(attempt.assessment_id) ?? "Assessment"}</p>
              <p className="text-sm text-muted-foreground">
                {attempt.completed_at
                  ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(attempt.completed_at))
                  : "Completed"}
              </p>
            </div>
            <Badge variant="accent">{Number(attempt.percentage).toFixed(0)}%</Badge>
          </Link>
        ))}
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">Finish an assessment to see a result here.</p> : null}
      </div>
    </div>
  );
}
