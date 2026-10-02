import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { dashboardPath, type Role } from "@/lib/constants";
import { getSupabaseEnv } from "@/lib/env";

const AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  return ["/about", "/pricing", "/contact", "/auth"].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  return to;
}

export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnv();
  if (!env) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthPage = AUTH_PATHS.includes(pathname);

  if (!user && !isPublicPath(pathname) && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return copyCookies(supabaseResponse, NextResponse.redirect(url));
  }

  if (!user) {
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role ?? "member") as Role;
  const home = dashboardPath(role);

  if (isAuthPage && pathname !== "/reset-password") {
    const url = request.nextUrl.clone();
    url.pathname = home;
    url.search = "";
    return copyCookies(supabaseResponse, NextResponse.redirect(url));
  }

  const memberOnly =
    pathname === "/dashboard" ||
    pathname.startsWith("/assessments") ||
    pathname.startsWith("/results");

  if (memberOnly && role !== "member") {
    const url = request.nextUrl.clone();
    url.pathname = home;
    return copyCookies(supabaseResponse, NextResponse.redirect(url));
  }

  if (pathname.startsWith("/super-admin") && role !== "super_admin") {
    const url = request.nextUrl.clone();
    url.pathname = home;
    return copyCookies(supabaseResponse, NextResponse.redirect(url));
  }

  if (pathname.startsWith("/admin") && role === "member") {
    const url = request.nextUrl.clone();
    url.pathname = home;
    return copyCookies(supabaseResponse, NextResponse.redirect(url));
  }

  return supabaseResponse;
}
