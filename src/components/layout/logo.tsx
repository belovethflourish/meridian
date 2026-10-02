import { Compass } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          light ? "bg-white/10 text-white" : "bg-primary text-primary-foreground",
        )}
      >
        <Compass className="h-4 w-4" />
      </span>
      {APP_NAME}
    </span>
  );
}
