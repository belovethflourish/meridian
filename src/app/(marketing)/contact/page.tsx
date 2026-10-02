import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Contact</p>
        <h1 className="mt-3 font-serif text-5xl tracking-tight">Tell us about the program you want to run.</h1>
        <p className="mt-4 text-muted-foreground">
          Hiring cohorts, leadership benches, and internal mobility all fit. Messages are stored for a super admin to
          review.
        </p>
      </div>
      <div className="rounded-2xl border bg-card p-6">
        <ContactForm />
      </div>
    </main>
  );
}
