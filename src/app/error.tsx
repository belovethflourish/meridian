"use client";

import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-start justify-center px-4">
      <h1 className="font-serif text-4xl">Something went wrong.</h1>
      <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
