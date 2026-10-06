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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", url.origin));

  const meta = user.user_metadata ?? {};
  const customClaims =
    meta.custom_claims && typeof meta.custom_claims === "object"
      ? (meta.custom_claims as Record<string, unknown>)
      : null;
  const oauthName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    (typeof customClaims?.global_name === "string" && customClaims.global_name) ||
    (typeof meta.preferred_username === "string" && meta.preferred_username) ||
    "";

  if (oauthName) {
    const { data: existing } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    const current = existing?.full_name?.trim() ?? "";
    const looksLikeEmailLocal = !current || current === (user.email?.split("@")[0] ?? "");
    if (looksLikeEmailLocal) {
      await supabase.from("profiles").update({ full_name: oauthName }).eq("id", user.id);
    }
  }

  if (next) return NextResponse.redirect(new URL(next, url.origin));

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = (profile?.role ?? "member") as Role;
  return NextResponse.redirect(new URL(dashboardPath(role), url.origin));
}
