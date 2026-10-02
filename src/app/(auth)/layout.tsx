import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground md:flex">
        <Link href="/">
          <Logo light />
        </Link>
        <div>
          <p className="font-serif text-4xl leading-tight">Measure the skill. Read the disposition.</p>
          <p className="mt-4 max-w-sm text-sm text-stone-400">
            Timed assessments, server-side scoring, and a directory that respects role boundaries.
          </p>
        </div>
        <p className="text-xs text-stone-500">Meridian assessments</p>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 inline-flex md:hidden">
            <Logo />
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
