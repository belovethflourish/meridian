"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { queueAiJob } from "@/server/ai";
import { refreshReport } from "@/server/attempts";
import { Button } from "@/components/ui/button";

export function ReportActions({ attemptId, assessmentTitle }: { attemptId: string; assessmentTitle: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          const result = await refreshReport(attemptId);
          setPending(false);
          if (!result.ok) toast.error(result.error);
          else {
            toast.success("Report regenerated");
            router.refresh();
          }
        }}
      >
        Generate report
      </Button>
      <Button
        variant="secondary"
        disabled={pending}
        onClick={async () => {
          const result = await queueAiJob({
            feature: "candidate_report",
            prompt: `Write a personalized analysis for ${assessmentTitle}.`,
            attemptId,
          });
          if (!result.ok) toast.error(result.error);
          else toast.success("AI report job queued");
        }}
      >
        Queue AI analysis
      </Button>
    </div>
  );
}
