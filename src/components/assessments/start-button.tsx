"use client";

import { useState } from "react";
import { startAttempt } from "@/server/attempts";
import { Button } from "@/components/ui/button";

export function StartButton({ assessmentId, label }: { assessmentId: string; label: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-2">
      <Button
        disabled={pending}
        onClick={async () => {
          setPending(true);
          const result = await startAttempt(assessmentId);
          if (result && result.ok === false) {
            setError(result.error);
            setPending(false);
          }
        }}
      >
        {pending ? "Opening..." : label}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
