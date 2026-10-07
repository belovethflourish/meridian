"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import type { ActionResult } from "@/lib/types";
import { makeAdminSchema, roleSchema } from "@/lib/validators";

function revalidateUserPaths() {
  revalidatePath("/super-admin/dashboard");
  revalidatePath("/super-admin/users");
  revalidatePath("/users");
  revalidatePath("/admin/users");
}

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

  revalidateUserPaths();
  return { ok: true };
}

export async function makeAdminByEmail(input: unknown): Promise<ActionResult> {
  const parsed = makeAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }

  const { supabase } = await requireRole(["super_admin"]);
  const email = parsed.data.email.toLowerCase();

  const { data: person, error: lookupError } = await supabase
    .from("profiles")
    .select("id, role, email")
    .ilike("email", email)
    .maybeSingle();

  if (lookupError) return { ok: false, error: lookupError.message };
  if (!person) {
    return {
      ok: false,
      error: "No account found with that email. Ask them to register or sign in first, then make them admin.",
    };
  }
  if (person.role === "admin") return { ok: false, error: "That account is already an admin." };
  if (person.role === "super_admin") {
    return { ok: false, error: "That account is a super admin. Change the role from Users if needed." };
  }

  const { error } = await supabase.from("profiles").update({ role: "admin" }).eq("id", person.id);
  if (error) return { ok: false, error: error.message };

  revalidateUserPaths();
  return { ok: true };
}
