import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="font-serif text-4xl">Reset your password</h1>
      <p className="mt-2 text-sm text-muted-foreground">We will email a link that returns you here to choose a new password.</p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
