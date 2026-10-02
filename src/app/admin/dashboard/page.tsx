import Link from "next/link";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { countRows } from "@/lib/data";
import type { Attempt } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminDashboardPage() {
  const { supabase } = await requireRole(["admin", "super_admin"]);
  const [members, assessments, attempts, reports] = await Promise.all([
    countRows(supabase, "profiles", "role", "member"),
    countRows(supabase, "assessments"),
    countRows(supabase, "attempts"),
    countRows(supabase, "reports"),
  ]);
  const { data } = await supabase
    .from("attempts")
    .select("percentage, status")
    .neq("status", "in_progress")
    .order("completed_at", { ascending: false })
    .limit(8);
  const recent = (data ?? []) as Pick<Attempt, "percentage" | "status">[];

  return (
    <div>
      <PageHeader
        eyebrow="Admin"
        title="Workspace"
        description="Members you can see, the assessments you manage, and the results those members have submitted."
        action={
          <Button asChild>
            <Link href="/admin/assessments">Manage assessments</Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Members", members],
          ["Assessments", assessments],
          ["Attempts", attempts],
          ["Reports", reports],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent className="font-serif text-4xl">{value}</CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Latest completed scores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recent.map((attempt, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="capitalize text-muted-foreground">{attempt.status}</span>
              <span className="font-medium">{Number(attempt.percentage).toFixed(0)}%</span>
            </div>
          ))}
          {recent.length === 0 ? <p className="text-sm text-muted-foreground">No completed attempts yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
