import type { Category, Difficulty, QuestionType, Role } from "@/lib/constants";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: Role;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Assessment = {
  id: string;
  title: string;
  description: string;
  category: Category;
  duration: number;
  difficulty: Difficulty;
  status: "draft" | "published";
  created_by: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
};

export type QuestionOption = {
  id: string;
  text: string;
  score?: number;
};

export type Question = {
  id: string;
  assessment_id: string;
  question_text: string;
  question_type: QuestionType;
  options: QuestionOption[];
  correct_answer: string | null;
  points: number;
  difficulty: Difficulty;
  category: Category;
  sort_order: number;
  created_at: string;
};

export type Attempt = {
  id: string;
  user_id: string;
  assessment_id: string;
  score: number;
  percentage: number;
  status: "in_progress" | "submitted" | "expired";
  category_scores: Record<string, { earned: number; max: number; percentage: number }>;
  started_at: string;
  completed_at: string | null;
};

export type Report = {
  id: string;
  user_id: string;
  assessment_id: string;
  attempt_id: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  category_scores: Attempt["category_scores"];
  created_at: string;
};

export type AttemptQuestion = {
  id: string;
  question_text: string;
  question_type: QuestionType;
  options: QuestionOption[];
  points: number;
  difficulty: Difficulty;
  category: Category;
  sort_order: number;
  selected_answer: string | null;
};

export type AttemptReview = {
  attempt: Pick<
    Attempt,
    "id" | "score" | "percentage" | "status" | "started_at" | "completed_at" | "category_scores" | "user_id"
  >;
  assessment: Pick<Assessment, "id" | "title" | "description" | "category" | "difficulty" | "duration">;
  candidate: { id: string; full_name: string; email: string };
  report: Pick<Report, "id" | "summary" | "strengths" | "weaknesses" | "created_at"> | null;
  questions: {
    id: string;
    question_text: string;
    question_type: QuestionType;
    options: QuestionOption[];
    selected_answer: string | null;
    correct_answer: string | null;
    is_correct: boolean | null;
    points: number;
    points_awarded: number | null;
    category: Category;
  }[];
};

export type Plan = {
  code: string;
  name: string;
  description: string | null;
  price_cents: number;
  interval: string;
  features: string[];
};

export type AppSetting = {
  key: string;
  value: unknown;
  description: string | null;
  updated_at: string;
};

export type DirectoryUser = {
  id: string;
  full_name: string;
  email?: string;
  avatar_url: string | null;
  role: Role;
  created_at: string;
  imageUrl: string | null;
};

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };
