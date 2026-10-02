import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/auth-forms";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div>
      <h1 className="font-serif text-4xl">Create your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        New accounts join as members. A super admin can promote an admin later.
      </p>
      {!isSupabaseConfigured() ? (
        <p className="mt-4 rounded-lg border bg-card p-3 text-sm">
          Connect Supabase before registering. The steps are in the README.
        </p>
      ) : (
        <div className="mt-8">
          <RegisterForm />
        </div>
      )}
    </div>
  );
}
