"use server";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { contactSchema } from "@/lib/validators";
import type { ActionResult } from "@/lib/types";

export async function sendContactMessage(input: unknown): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Messaging is unavailable until Supabase is configured." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    organization: parsed.data.organization || null,
    message: parsed.data.message,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
