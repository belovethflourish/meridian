import Link from "next/link";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import type { Assessment, Profile, Report } from "@/lib/types";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const { supabase } = await requireRole(["admin", "super_admin"]);
  const [{ data, error }, { data: people }, { data: assessments }] = await Promise.all([
    supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("profiles").select("id, full_name"),
    supabase.from("assessments").select("id, title"),
  ]);
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;

  const names = new Map(((people ?? []) as Pick<Profile, "id" | "full_name">[]).map((person) => [person.id, person.full_name]));
  const titles = new Map(((assessments ?? []) as Pick<Assessment, "id" | "title">[]).map((item) => [item.id, item.title]));
  const reports = (data ?? []) as Report[];

  return (
    <div>
      <PageHeader
        eyebrow="Results"
        title="Reports"
        description="Reports are written when a member submits. You can regenerate the narrative from the answer key."
      />
      <div className="space-y-3">
        {reports.map((report) => (
          <Link key={report.id} href={`/admin/reports/${report.attempt_id}`} className="block rounded-xl border bg-card px-4 py-4">
            <p className="font-medium">{names.get(report.user_id) ?? "Member"}</p>
            <p className="text-sm text-muted-foreground">{titles.get(report.assessment_id) ?? "Assessment"}</p>
            <p className="mt-2 line-clamp-2 text-sm">{report.summary}</p>
          </Link>
        ))}
        {reports.length === 0 ? <p className="text-sm text-muted-foreground">No reports yet.</p> : null}
      </div>
    </div>
  );
}
