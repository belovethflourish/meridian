"use client";

import { useState } from "react";
import { toast } from "sonner";
import { saveSettings } from "@/server/settings";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SettingsForm({
  values,
}: {
  values: {
    platform_name: string;
    support_email: string;
    allow_public_registration: boolean;
    default_duration_minutes: number;
    ai_question_generator_enabled: boolean;
    ai_candidate_reports_enabled: boolean;
  };
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const result = await saveSettings({
      platform_name: formData.get("platform_name"),
      support_email: formData.get("support_email"),
      allow_public_registration: formData.get("allow_public_registration") === "on",
      default_duration_minutes: formData.get("default_duration_minutes"),
      ai_question_generator_enabled: formData.get("ai_question_generator_enabled") === "on",
      ai_candidate_reports_enabled: formData.get("ai_candidate_reports_enabled") === "on",
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    toast.success("Settings saved");
  }

  return (
    <form action={onSubmit} className="max-w-xl space-y-4 rounded-xl border bg-card p-6">
      <Field label="Platform name">
        <Input name="platform_name" defaultValue={values.platform_name} />
      </Field>
      <Field label="Support email">
        <Input name="support_email" type="email" defaultValue={values.support_email} />
      </Field>
      <Field label="Default duration (minutes)">
        <Input name="default_duration_minutes" type="number" defaultValue={values.default_duration_minutes} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="allow_public_registration" defaultChecked={values.allow_public_registration} />
        Allow public registration
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="ai_question_generator_enabled" defaultChecked={values.ai_question_generator_enabled} />
        AI question generator ready
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="ai_candidate_reports_enabled" defaultChecked={values.ai_candidate_reports_enabled} />
        AI candidate reports ready
      </label>
      <p className="text-xs text-muted-foreground">
        Turning an AI switch on does not call a model. It marks the queue as ready for a provider you connect later.
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button disabled={pending} type="submit">
        {pending ? "Saving..." : "Save settings"}
      </Button>
    </form>
  );
}
