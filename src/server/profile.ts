"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validators";
import type { ActionResult } from "@/lib/types";

export async function updateProfile(fullName: string): Promise<ActionResult> {
  const parsed = profileSchema.safeParse({ fullName });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the name and try again." };
  }

  const { supabase, profile } = await requireUser();
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.fullName }).eq("id", profile.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateAvatarPath(path: string | null): Promise<ActionResult> {
  const { supabase, profile } = await requireUser();
  if (path && !path.startsWith(`${profile.id}/`)) {
    return { ok: false, error: "You can only save an image in your own folder." };
  }

  const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", profile.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/profile");
  revalidatePath("/users");
  return { ok: true };
}
