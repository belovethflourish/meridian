import Link from "next/link";
import { Compass } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const links = [
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-[#f3f0e8]/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar text-sidebar-foreground">
            <Compass className="size-4" />
          </span>
          {APP_NAME}
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="px-3 py-2 text-sm font-medium hover:text-primary">
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} Meridian. Attitude and aptitude, measured with care.</p>
        <div className="flex gap-4">
          <Link href="/about">About</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
