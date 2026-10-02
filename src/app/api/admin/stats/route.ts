import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { countRows } from "@/lib/data";

export async function GET() {
  const context = await getSessionContext();
  if (!context || (context.profile.role !== "admin" && context.profile.role !== "super_admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [members, assessments, attempts, reports] = await Promise.all([
    countRows(context.supabase, "profiles", "role", "member"),
    countRows(context.supabase, "assessments"),
    countRows(context.supabase, "attempts"),
    countRows(context.supabase, "reports"),
  ]);

  return NextResponse.json({ members, assessments, attempts, reports });
}
