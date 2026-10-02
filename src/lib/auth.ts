import { redirect } from "next/navigation";
import { dashboardPath, type Role } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getSessionContext() {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;
  return { supabase, user, profile: profile as Profile };
}

export async function requireUser() {
  const context = await getSessionContext();
  if (!context) redirect("/login");
  return context;
}

export async function requireRole(roles: Role[]) {
  const context = await requireUser();
  if (!roles.includes(context.profile.role)) {
    redirect(dashboardPath(context.profile.role));
  }
  return context;
}
