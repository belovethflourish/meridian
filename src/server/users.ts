"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";
import { roleSchema } from "@/lib/validators";

export async function changeUserRole(input: unknown): Promise<ActionResult> {
  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Choose a valid role." };
  }

  const { supabase, profile } = await requireRole(["super_admin"]);
  if (parsed.data.userId === profile.id && parsed.data.role !== "super_admin") {
    return { ok: false, error: "You cannot remove your own super admin access from this screen." };
  }

  const { error } = await supabase.from("profiles").update({ role: parsed.data.role }).eq("id", parsed.data.userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/super-admin/users");
  revalidatePath("/users");
  revalidatePath("/admin/users");
  return { ok: true };
}
