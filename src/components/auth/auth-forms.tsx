"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { dashboardPath, type Role } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "@/lib/validators";
import { Field } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function issue(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      setError(issue(parsed.error));
      return;
    }

    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured yet. Add the project URL and anon key, then restart.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
    if (signInError || !data.user) {
      setPending(false);
      setError(signInError?.message ?? "Login failed.");
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    const role = (profile?.role ?? "member") as Role;
    const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : dashboardPath(role);
    router.push(destination);
    router.refresh();
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Signing in..." : "Sign in"}
      </Button>
      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="text-primary hover:underline">
          Forgot password
        </Link>
        <Link href="/register" className="text-muted-foreground hover:text-foreground">
          Create an account
        </Link>
      </div>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    const parsed = registerSchema.safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      setError(issue(parsed.error));
      return;
    }

    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured yet. Add the project URL and anon key, then restart.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { data: open, error: openError } = await supabase.rpc("registration_open");
    if (openError) {
      setPending(false);
      setError(openError.message);
      return;
    }
    if (open === false) {
      setPending(false);
      setError("Registration is closed. Ask a super admin to invite you.");
      return;
    }

    const origin = window.location.origin;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: { full_name: parsed.data.fullName },
      },
    });

    if (signUpError) {
      setPending(false);
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setPending(false);
    setMessage("Check your email and confirm the address before signing in.");
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <Field label="Full name">
        <Input name="fullName" autoComplete="name" required />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" hint="At least 8 characters.">
        <Input name="password" type="password" autoComplete="new-password" required />
      </Field>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-primary">{message}</p> : null}
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Creating account..." : "Create account"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);
    const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
    if (!parsed.success) {
      setError(issue(parsed.error));
      return;
    }
    if (!isSupabaseConfigured()) {
      setError("Supabase is not configured yet. Add the project URL and anon key, then restart.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setPending(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setMessage("If an account exists for that email, a reset link is on its way.");
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <Field label="Email">
        <Input name="email" type="email" autoComplete="email" required />
      </Field>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-primary">{message}</p> : null}
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Sending..." : "Send reset link"}
      </Button>
      <Link href="/login" className="block text-sm text-primary hover:underline">
        Back to login
      </Link>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    const parsed = resetPasswordSchema.safeParse({
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });
    if (!parsed.success) {
      setError(issue(parsed.error));
      return;
    }
    setPending(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (updateError) {
      setPending(false);
      setError(updateError.message);
      return;
    }
    const { data } = await supabase.auth.getUser();
    const { data: profile } = data.user
      ? await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle()
      : { data: null };
    router.push(dashboardPath((profile?.role ?? "member") as Role));
    router.refresh();
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <Field label="New password">
        <Input name="password" type="password" autoComplete="new-password" required />
      </Field>
      <Field label="Confirm password">
        <Input name="confirmPassword" type="password" autoComplete="new-password" required />
      </Field>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Saving..." : "Update password"}
      </Button>
    </form>
  );
}
