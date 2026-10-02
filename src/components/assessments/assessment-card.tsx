import Link from "next/link";
import { categoryGroup, categoryLabel, difficultyLabel } from "@/lib/constants";
import type { Assessment } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function AssessmentCard({
  assessment,
  href,
  meta,
}: {
  assessment: Pick<Assessment, "title" | "description" | "category" | "difficulty" | "duration" | "status">;
  href?: string;
  meta?: string;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex flex-wrap gap-2">
          <Badge variant="accent">{categoryGroup(assessment.category)}</Badge>
          <Badge variant="outline">{difficultyLabel(assessment.difficulty)}</Badge>
          {assessment.status === "draft" ? <Badge variant="warning">Draft</Badge> : null}
        </div>
        <CardTitle className="pt-2">{assessment.title}</CardTitle>
        <CardDescription>{categoryLabel(assessment.category)}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-3 text-sm text-muted-foreground">{assessment.description}</p>
        <p className="mt-4 text-sm">{assessment.duration} minutes</p>
        {meta ? <p className="mt-1 text-sm text-muted-foreground">{meta}</p> : null}
      </CardContent>
      {href ? (
        <CardFooter>
          <Button asChild variant="outline">
            <Link href={href}>Open</Link>
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
