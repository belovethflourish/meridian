import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export function MarketingFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Assessments for aptitude and attitude, with a clear record of who can see what.
          </p>
        </div>
        <div className="flex gap-5 text-sm text-muted-foreground">
          <Link href="/about">About</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/login">Log in</Link>
        </div>
      </div>
    </footer>
  );
}
