import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-start justify-center px-4">
      <p className="text-xs uppercase tracking-[0.16em] text-primary">404</p>
      <h1 className="mt-2 font-serif text-4xl">That page is not in the catalog.</h1>
      <Button asChild className="mt-6">
        <Link href="/">Back home</Link>
      </Button>
    </main>
  );
}
