import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { categoryLabel } from "@/lib/constants";
import { countRows } from "@/lib/data";
import type { Attempt } from "@/lib/types";
import { MakeAdminPanel } from "@/components/admin/make-admin-panel";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = { title: "Super admin" };

export default async function SuperAdminDashboardPage() {
  const { supabase } = await requireRole(["super_admin"]);
  const [members, admins, supers, assessments, reports, memberRows] = await Promise.all([
    countRows(supabase, "profiles", "role", "member"),
    countRows(supabase, "profiles", "role", "admin"),
    countRows(supabase, "profiles", "role", "super_admin"),
    countRows(supabase, "assessments"),
    countRows(supabase, "reports"),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "member")
      .order("full_name", { ascending: true })
      .limit(20),
  ]);

  const { data } = await supabase.from("attempts").select("category_scores, status").neq("status", "in_progress").limit(500);
  const totals = new Map<string, { sum: number; count: number }>();
  for (const attempt of (data ?? []) as Pick<Attempt, "category_scores" | "status">[]) {
    for (const [key, value] of Object.entries(attempt.category_scores ?? {})) {
      const current = totals.get(key) ?? { sum: 0, count: 0 };
      current.sum += Number(value.percentage);
      current.count += 1;
      totals.set(key, current);
    }
  }

  const promoteList = (memberRows.data ?? []) as { id: string; full_name: string; email: string }[];

  return (
    <div>
      <PageHeader
        eyebrow="Super admin"
        title="System"
        description="Every role, every assessment, and the average result by category."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Members", members],
          ["Admins", admins],
          ["Super admins", supers],
          ["Assessments", assessments],
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

      <MakeAdminPanel members={promoteList} />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Category averages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...totals.entries()].map(([key, value]) => {
            const average = value.count ? value.sum / value.count : 0;
            return (
              <div key={key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{categoryLabel(key)}</span>
                  <span>{average.toFixed(0)}%</span>
                </div>
                <Progress value={average} />
              </div>
            );
          })}
          {totals.size === 0 ? <p className="text-sm text-muted-foreground">Averages appear after the first submitted attempts.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
