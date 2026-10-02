import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata: Metadata = { title: "Settings" };

function readString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function readNumber(value: unknown, fallback: number) {
  return typeof value === "number" ? value : fallback;
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export default async function SettingsPage() {
  const { supabase } = await requireRole(["super_admin"]);
  const { data, error } = await supabase.from("app_settings").select("key, value");
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;
  const settings = new Map((data ?? []).map((row: { key: string; value: unknown }) => [row.key, row.value]));

  return (
    <div>
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Registration, the default timer, and the switches that mark AI jobs as ready for a provider."
      />
      <SettingsForm
        values={{
          platform_name: readString(settings.get("platform_name"), "Meridian"),
          support_email: readString(settings.get("support_email"), "support@meridian.test"),
          allow_public_registration: readBoolean(settings.get("allow_public_registration"), true),
          default_duration_minutes: readNumber(settings.get("default_duration_minutes"), 20),
          ai_question_generator_enabled: readBoolean(settings.get("ai_question_generator_enabled"), false),
          ai_candidate_reports_enabled: readBoolean(settings.get("ai_candidate_reports_enabled"), false),
        }}
      />
    </div>
  );
}
