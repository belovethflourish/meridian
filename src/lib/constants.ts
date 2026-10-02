export const APP_NAME = "Meridian";

export const CATEGORY_VALUES = [
  "numerical_reasoning",
  "logical_reasoning",
  "verbal_reasoning",
  "abstract_reasoning",
  "personality",
  "leadership",
  "emotional_intelligence",
  "work_behaviour",
] as const;

export type Category = (typeof CATEGORY_VALUES)[number];

export const CATEGORIES: {
  value: Category;
  label: string;
  group: "Aptitude" | "Attitude";
  description: string;
}[] = [
  {
    value: "numerical_reasoning",
    label: "Numerical Reasoning",
    group: "Aptitude",
    description: "Quantities, rates, percentages, and data interpretation.",
  },
  {
    value: "logical_reasoning",
    label: "Logical Reasoning",
    group: "Aptitude",
    description: "Deduction, sequences, and structured problem solving.",
  },
  {
    value: "verbal_reasoning",
    label: "Verbal Reasoning",
    group: "Aptitude",
    description: "Language, argument, and precise reading.",
  },
  {
    value: "abstract_reasoning",
    label: "Abstract Reasoning",
    group: "Aptitude",
    description: "Patterns, relationships, and non-verbal rules.",
  },
  {
    value: "personality",
    label: "Personality",
    group: "Attitude",
    description: "Work style, preferences, and interpersonal tendencies.",
  },
  {
    value: "leadership",
    label: "Leadership",
    group: "Attitude",
    description: "Direction, accountability, and how someone influences others.",
  },
  {
    value: "emotional_intelligence",
    label: "Emotional Intelligence",
    group: "Attitude",
    description: "Self-awareness, empathy, and regulation under pressure.",
  },
  {
    value: "work_behaviour",
    label: "Work Behaviour",
    group: "Attitude",
    description: "Reliability, collaboration, and day-to-day conduct.",
  },
];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const QUESTION_TYPES = ["multiple_choice", "true_false", "likert"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const ROLES = ["member", "admin", "super_admin"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  member: "Member",
  admin: "Admin",
  super_admin: "Super Admin",
};

export function categoryLabel(value: string) {
  return CATEGORIES.find((category) => category.value === value)?.label ?? value;
}

export function categoryGroup(value: string) {
  return CATEGORIES.find((category) => category.value === value)?.group ?? "Assessment";
}

export function dashboardPath(role: Role) {
  if (role === "super_admin") return "/super-admin/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return "/dashboard";
}

export function difficultyLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export const FALLBACK_PLANS = [
  {
    code: "starter",
    name: "Starter",
    description: "For teams piloting structured hiring and development.",
    price_cents: 4900,
    interval: "month",
    features: ["Up to 25 members", "Aptitude and attitude catalogs", "Score reports", "Email support"],
  },
  {
    code: "growth",
    name: "Growth",
    description: "For organizations running assessments across departments.",
    price_cents: 14900,
    interval: "month",
    features: ["Up to 250 members", "Custom assessments", "Assignments and deadlines", "Admin analytics", "Priority support"],
  },
  {
    code: "enterprise",
    name: "Enterprise",
    description: "For multi-team programs that need control and a path to AI.",
    price_cents: 0,
    interval: "year",
    features: ["Unlimited members", "Super admin controls", "SSO-ready architecture", "AI generation pipeline", "Dedicated success partner"],
  },
];
