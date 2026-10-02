import { categoryLabel, difficultyLabel } from "@/lib/constants";
import type { AttemptReview } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function ResultView({ review, action }: { review: AttemptReview; action?: React.ReactNode }) {
  const percentage = Number(review.attempt.percentage ?? 0);
  const scores = review.attempt.category_scores ?? {};
  const strengths = review.report?.strengths ?? [];
  const weaknesses = review.report?.weaknesses ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
            {review.candidate.full_name}
          </p>
          <h1 className="mt-1 font-serif text-3xl tracking-tight md:text-4xl">{review.assessment.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {difficultyLabel(review.assessment.difficulty)} · {review.assessment.duration} minutes ·{" "}
            {review.attempt.status === "expired" ? "Timer expired" : "Submitted"}
          </p>
        </div>
        {action}
      </div>

      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-serif text-5xl">{percentage.toFixed(0)}%</p>
            <p className="mt-2 text-sm text-muted-foreground">{Number(review.attempt.score).toFixed(1)} points</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Category scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.keys(scores).length === 0 ? (
              <p className="text-sm text-muted-foreground">No category scores were recorded.</p>
            ) : (
              Object.entries(scores).map(([key, value]) => (
                <div key={key}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{categoryLabel(key)}</span>
                    <span className="font-medium">{Number(value.percentage).toFixed(0)}%</span>
                  </div>
                  <Progress value={Number(value.percentage)} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Performance summary</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-muted-foreground">
            {review.report?.summary ?? "A report has not been generated yet."}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Strengths</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {strengths.length === 0 ? (
              <p className="text-sm text-muted-foreground">No category reached 75% yet.</p>
            ) : (
              strengths.map((item) => (
                <Badge key={item} variant="accent">
                  {item}
                </Badge>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Weaknesses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {weaknesses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No category fell below 60%.</p>
            ) : (
              weaknesses.map((item) => (
                <Badge key={item} variant="warning">
                  {item}
                </Badge>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Question review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {review.questions.map((question, index) => {
            const selected = question.options.find((option) => option.id === question.selected_answer);
            const correct = question.options.find((option) => option.id === question.correct_answer);
            return (
              <div key={question.id} className="border-b pb-5 last:border-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {index + 1}. {categoryLabel(question.category)}
                </p>
                <p className="mt-1 font-medium">{question.question_text}</p>
                <p className="mt-2 text-sm">
                  Selected: {selected?.text ?? "No answer"}{" "}
                  {question.question_type !== "likert" && correct ? `· Correct: ${correct.text}` : null}
                </p>
                <p className="text-sm text-muted-foreground">
                  {Number(question.points_awarded ?? 0)} / {question.points} points
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
