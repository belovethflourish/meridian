"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";
import { settingsSchema } from "@/lib/validators";

export async function saveSettings(input: unknown): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the settings and try again." };
  }

  const { supabase, profile } = await requireRole(["super_admin"]);
  const entries = Object.entries(parsed.data).map(([key, value]) => ({
    key,
    value,
    updated_by: profile.id,
  }));

  const { error } = await supabase.from("app_settings").upsert(entries);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/super-admin/settings");
  return { ok: true };
}
