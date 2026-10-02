"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { categoryLabel } from "@/lib/constants";
import type { AttemptQuestion } from "@/lib/types";
import { saveAnswer, submitAttempt } from "@/server/attempts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

function formatClock(ms: number) {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function TakeAssessment({
  attemptId,
  title,
  startedAt,
  durationMinutes,
  questions,
}: {
  attemptId: string;
  title: string;
  startedAt: string;
  durationMinutes: number;
  questions: AttemptQuestion[];
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(questions.filter((question) => question.selected_answer).map((question) => [question.id, question.selected_answer as string])),
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const submitted = useRef(false);
  const endsAt = useMemo(() => new Date(startedAt).getTime() + durationMinutes * 60 * 1000, [startedAt, durationMinutes]);
  const remaining = Math.max(0, endsAt - now);
  const current = questions[index];
  const answered = questions.filter((question) => answers[question.id]).length;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function persist(questionId: string, optionId: string) {
    setSaveState("saving");
    const result = await saveAnswer(attemptId, questionId, optionId);
    setSaveState(result.ok ? "saved" : "error");
    if (!result.ok) setError(result.error);
  }

  async function finish() {
    if (submitted.current) return;
    submitted.current = true;
    setSubmitting(true);
    setError(null);
    const pending = Object.entries(answers).map(([questionId, optionId]) => saveAnswer(attemptId, questionId, optionId));
    const saved = await Promise.all(pending);
    const failed = saved.find((result) => !result.ok);
    if (failed && !failed.ok) {
      submitted.current = false;
      setSubmitting(false);
      setError(failed.error);
      return;
    }
    const result = await submitAttempt(attemptId);
    if (!result.ok) {
      submitted.current = false;
      setSubmitting(false);
      setError(result.error);
      return;
    }
    router.push(`/results/${attemptId}`);
    router.refresh();
  }

  useEffect(() => {
    if (remaining === 0) {
      void finish();
    }
    // finish is stable enough for the zero-timer path; the ref guards duplicate submits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  if (!current) {
    return <p className="text-sm text-muted-foreground">This assessment has no questions yet.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-4 rounded-xl border bg-card p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Time left</p>
          <p className={cn("font-serif text-3xl", remaining < 60_000 && "text-destructive")}>{formatClock(remaining)}</p>
        </div>
        <div>
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>
              {answered}/{questions.length}
            </span>
          </div>
          <Progress value={(answered / questions.length) * 100} />
        </div>
        <div className="grid grid-cols-5 gap-2">
          {questions.map((question, questionIndex) => (
            <button
              key={question.id}
              type="button"
              onClick={() => setIndex(questionIndex)}
              className={cn(
                "h-9 rounded-md border text-sm",
                questionIndex === index && "border-primary bg-primary text-primary-foreground",
                questionIndex !== index && answers[question.id] && "bg-accent text-accent-foreground",
              )}
            >
              {questionIndex + 1}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : saveState === "error" ? "Save failed" : "Answers save as you go"}
        </p>
      </aside>

      <section className="rounded-xl border bg-card p-5 md:p-8">
        <p className="text-xs uppercase tracking-wide text-primary">{categoryLabel(current.category)}</p>
        <h1 className="mt-2 font-serif text-2xl md:text-3xl">{title}</h1>
        <p className="mt-6 text-lg leading-relaxed">{current.question_text}</p>
        <div className="mt-6 space-y-3">
          {current.options.map((option) => {
            const selected = answers[current.id] === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setAnswers((currentAnswers) => ({ ...currentAnswers, [current.id]: option.id }));
                  void persist(current.id, option.id);
                }}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm hover:border-primary",
                  selected && "border-primary bg-accent",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0 rounded-full border",
                    selected && "border-primary bg-primary",
                  )}
                />
                <span>{option.text}</span>
              </button>
            );
          })}
        </div>
        {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={index === questions.length - 1}
              onClick={() => setIndex((value) => value + 1)}
            >
              Next
            </Button>
          </div>
          <Button type="button" disabled={submitting} onClick={() => void finish()}>
            {submitting ? "Submitting..." : "Submit assessment"}
          </Button>
        </div>
      </section>
    </div>
  );
}
