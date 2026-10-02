"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CATEGORIES, DIFFICULTIES, categoryLabel, difficultyLabel } from "@/lib/constants";
import type { Assessment, DirectoryUser, Question } from "@/lib/types";
import { assignAssessment, deleteAssessment, deleteQuestion, saveAssessment, saveQuestion, unassignAssessment } from "@/server/assessments";
import { queueAiJob } from "@/server/ai";
import { Field } from "@/components/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const likert = [
  { id: "1", text: "Strongly disagree", score: 1 },
  { id: "2", text: "Disagree", score: 2 },
  { id: "3", text: "Neutral", score: 3 },
  { id: "4", text: "Agree", score: 4 },
  { id: "5", text: "Strongly agree", score: 5 },
];

const blankOptions = () => [
  { id: "a", text: "" },
  { id: "b", text: "" },
  { id: "c", text: "" },
  { id: "d", text: "" },
];

export function AssessmentFormDialog({ assessment }: { assessment?: Assessment }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(assessment?.category ?? "numerical_reasoning");
  const [difficulty, setDifficulty] = useState(assessment?.difficulty ?? "medium");
  const [status, setStatus] = useState(assessment?.status ?? "draft");

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await saveAssessment(
      {
        title: formData.get("title"),
        description: formData.get("description"),
        category,
        duration: formData.get("duration"),
        difficulty,
        status,
      },
      assessment?.id,
    );
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success(assessment ? "Assessment updated" : "Assessment created");
    setOpen(false);
    router.refresh();
    if (!assessment && result.data?.id) router.push(`/admin/assessments/${result.data.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={assessment ? "outline" : "default"}>{assessment ? "Edit assessment" : "New assessment"}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{assessment ? "Edit assessment" : "Create assessment"}</DialogTitle>
          <DialogDescription>Drafts stay hidden until you publish them.</DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <Field label="Title">
            <Input name="title" defaultValue={assessment?.title} required />
          </Field>
          <Field label="Description">
            <Textarea name="description" defaultValue={assessment?.description} required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <Select value={category} onValueChange={(value) => setCategory(value as typeof category)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Duration (minutes)">
              <Input name="duration" type="number" min={1} max={240} defaultValue={assessment?.duration ?? 20} required />
            </Field>
            <Field label="Difficulty">
              <Select value={difficulty} onValueChange={(value) => setDifficulty(value as typeof difficulty)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {difficultyLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button disabled={pending} type="submit">
              {pending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteAssessmentButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <Button
      variant="destructive"
      onClick={async () => {
        if (!confirm("Delete this assessment and its questions?")) return;
        const result = await deleteAssessment(id);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        router.push("/admin/assessments");
        router.refresh();
      }}
    >
      Delete
    </Button>
  );
}

export function QuestionManager({
  assessment,
  questions,
}: {
  assessment: Assessment;
  questions: Question[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [questionType, setQuestionType] = useState<Question["question_type"]>("multiple_choice");
  const [category, setCategory] = useState(assessment.category);
  const [difficulty, setDifficulty] = useState<Question["difficulty"]>(assessment.difficulty);
  const [options, setOptions] = useState(blankOptions());
  const [correctAnswer, setCorrectAnswer] = useState("a");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [prompt, setPrompt] = useState("Create leadership assessment");

  function openNew() {
    setEditing(null);
    setQuestionType("multiple_choice");
    setCategory(assessment.category);
    setDifficulty(assessment.difficulty);
    setOptions(blankOptions());
    setCorrectAnswer("a");
    setError(null);
    setOpen(true);
  }

  function openEdit(question: Question) {
    setEditing(question);
    setQuestionType(question.question_type);
    setCategory(question.category);
    setDifficulty(question.difficulty);
    setOptions(question.options);
    setCorrectAnswer(question.correct_answer ?? question.options[0]?.id ?? "");
    setError(null);
    setOpen(true);
  }

  function changeType(next: Question["question_type"]) {
    setQuestionType(next);
    if (next === "likert") {
      setOptions(likert);
      setCorrectAnswer("");
    } else if (next === "true_false") {
      setOptions([
        { id: "true", text: "True" },
        { id: "false", text: "False" },
      ]);
      setCorrectAnswer("true");
    } else {
      setOptions(blankOptions());
      setCorrectAnswer("a");
    }
  }

  async function onSubmit(formData: FormData) {
    setPending(true);
    const result = await saveQuestion(
      {
        assessmentId: assessment.id,
        questionText: formData.get("questionText"),
        questionType,
        options,
        correctAnswer: questionType === "likert" ? null : correctAnswer,
        points: formData.get("points"),
        difficulty,
        category,
      },
      editing?.id,
    );
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    toast.success(editing ? "Question updated" : "Question added");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={openNew}>Add question</Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">AI question generator</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Queue an AI draft</DialogTitle>
              <DialogDescription>
                This stores a pending job in ai_generations. A model provider can pick it up later. Nothing is invented as a finished question.
              </DialogDescription>
            </DialogHeader>
            <Field label="Prompt">
              <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
            </Field>
            <DialogFooter>
              <Button
                onClick={async () => {
                  const result = await queueAiJob({
                    feature: "question_generator",
                    prompt,
                    assessmentId: assessment.id,
                  });
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Question job queued");
                }}
              >
                Queue job
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No questions yet.</p>
        ) : (
          questions.map((question, index) => (
            <div key={question.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{index + 1}</Badge>
                <Badge variant="secondary">{question.question_type.replace("_", " ")}</Badge>
                <Badge variant="accent">{categoryLabel(question.category)}</Badge>
              </div>
              <p className="mt-3 text-sm">{question.question_text}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(question)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    if (!confirm("Delete this question?")) return;
                    const result = await deleteQuestion(question.id, assessment.id);
                    if (!result.ok) toast.error(result.error);
                    else router.refresh();
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit question" : "New question"}</DialogTitle>
            <DialogDescription>Correct answers stay on the server until a candidate submits.</DialogDescription>
          </DialogHeader>
          <form action={onSubmit} className="space-y-4">
            <Field label="Question">
              <Textarea name="questionText" defaultValue={editing?.question_text} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type">
                <Select value={questionType} onValueChange={(value) => changeType(value as Question["question_type"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Multiple choice</SelectItem>
                    <SelectItem value="true_false">True / false</SelectItem>
                    <SelectItem value="likert">Likert</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Points">
                <Input name="points" type="number" min={1} max={100} defaultValue={editing?.points ?? (questionType === "likert" ? 5 : 1)} />
              </Field>
              <Field label="Category">
                <Select value={category} onValueChange={(value) => setCategory(value as typeof category)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Difficulty">
                <Select value={difficulty} onValueChange={(value) => setDifficulty(value as typeof difficulty)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTIES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {difficultyLabel(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="space-y-2">
              {options.map((option, optionIndex) => (
                <div key={option.id} className="flex items-center gap-2">
                  {questionType !== "likert" ? (
                    <input
                      type="radio"
                      name="correct"
                      checked={correctAnswer === option.id}
                      onChange={() => setCorrectAnswer(option.id)}
                      aria-label="Correct answer"
                    />
                  ) : null}
                  <Input
                    value={option.text}
                    onChange={(event) =>
                      setOptions((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === optionIndex ? { ...item, text: event.target.value } : item,
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter>
              <Button disabled={pending} type="submit">
                {pending ? "Saving..." : "Save question"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AssignmentPanel({
  assessmentId,
  members,
  assignedIds,
}: {
  assessmentId: string;
  members: DirectoryUser[];
  assignedIds: string[];
}) {
  const router = useRouter();
  const assigned = new Set(assignedIds);

  return (
    <div className="space-y-3">
      {members.length === 0 ? <p className="text-sm text-muted-foreground">No members are visible to assign.</p> : null}
      {members.map((member) => {
        const isAssigned = assigned.has(member.id);
        return (
          <div key={member.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
            <div>
              <p className="text-sm font-medium">{member.full_name}</p>
              <p className="text-xs text-muted-foreground">{member.email}</p>
            </div>
            <Button
              size="sm"
              variant={isAssigned ? "outline" : "default"}
              onClick={async () => {
                const result = isAssigned
                  ? await unassignAssessment({ assessmentId, userId: member.id })
                  : await assignAssessment({ assessmentId, userId: member.id });
                if (!result.ok) toast.error(result.error);
                else router.refresh();
              }}
            >
              {isAssigned ? "Remove" : "Assign"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

export function AssessmentWorkspace({
  assessment,
  questions,
  members,
  assignedIds,
}: {
  assessment: Assessment;
  questions: Question[];
  members: DirectoryUser[];
  assignedIds: string[];
}) {
  return (
    <Tabs defaultValue="questions">
      <TabsList>
        <TabsTrigger value="questions">Questions</TabsTrigger>
        <TabsTrigger value="assign">Assign</TabsTrigger>
      </TabsList>
      <TabsContent value="questions">
        <QuestionManager assessment={assessment} questions={questions} />
      </TabsContent>
      <TabsContent value="assign">
        <AssignmentPanel assessmentId={assessment.id} members={members} assignedIds={assignedIds} />
      </TabsContent>
    </Tabs>
  );
}
