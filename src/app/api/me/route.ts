import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";

export async function GET() {
  const context = await getSessionContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    id: context.profile.id,
    full_name: context.profile.full_name,
    email: context.profile.email,
    role: context.profile.role,
  });
}
