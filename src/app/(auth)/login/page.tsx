import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/auth-forms";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div>
      <h1 className="font-serif text-4xl">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in to the workspace that matches your role.</p>
      {!isSupabaseConfigured() ? (
        <p className="mt-4 rounded-lg border bg-card p-3 text-sm">
          Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to `.env.local`, then restart the server.
        </p>
      ) : null}
      {params.error ? (
        <p className="mt-4 text-sm text-destructive">
          Google or email sign-in could not be completed. Try again, or use email and password.
        </p>
      ) : null}
      <div className="mt-8">
        <LoginForm next={params.next} />
      </div>
    </div>
  );
}
