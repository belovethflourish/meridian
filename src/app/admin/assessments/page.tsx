import Link from "next/link";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { categoryLabel } from "@/lib/constants";
import type { Assessment } from "@/lib/types";
import { AssessmentFormDialog } from "@/components/admin/assessment-tools";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Assessments" };

export default async function AdminAssessmentsPage() {
  const { supabase } = await requireRole(["admin", "super_admin"]);
  const { data, error } = await supabase.from("assessments").select("*").order("created_at", { ascending: false });
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;
  const assessments = (data ?? []) as Assessment[];

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Assessments"
        description="Create, publish, and retire tests. Questions and assignments live on each assessment."
        action={<AssessmentFormDialog />}
      />
      <div className="space-y-3">
        {assessments.map((assessment) => (
          <Link key={assessment.id} href={`/admin/assessments/${assessment.id}`} className="block rounded-xl border bg-card px-4 py-4 hover:bg-accent/40">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{assessment.title}</p>
              <Badge variant={assessment.status === "published" ? "accent" : "warning"}>{assessment.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {categoryLabel(assessment.category)} · {assessment.duration} min
            </p>
          </Link>
        ))}
        {assessments.length === 0 ? <p className="text-sm text-muted-foreground">Create the first assessment to get started.</p> : null}
      </div>
    </div>
  );
}
