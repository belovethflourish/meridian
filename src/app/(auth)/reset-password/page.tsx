import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Choose a password" };

export default function ResetPasswordPage() {
  return (
    <div>
      <h1 className="font-serif text-4xl">Choose a new password</h1>
      <p className="mt-2 text-sm text-muted-foreground">Use the link from your email so this page has a recovery session.</p>
      <div className="mt-8">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
