import { NextResponse } from "next/server";
import { dashboardPath, type Role } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

function safePath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safePath(url.searchParams.get("next"));
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL("/login?error=auth", url.origin));
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) return NextResponse.redirect(new URL("/login?error=auth", url.origin));
  } else {
    return NextResponse.redirect(new URL("/login?error=auth", url.origin));
  }

  if (next) return NextResponse.redirect(new URL(next, url.origin));

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", url.origin));

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = (profile?.role ?? "member") as Role;
  return NextResponse.redirect(new URL(dashboardPath(role), url.origin));
}
