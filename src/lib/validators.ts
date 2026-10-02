import { z } from "zod";
import { CATEGORY_VALUES, DIFFICULTIES, QUESTION_TYPES, ROLES } from "@/lib/constants";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const registerSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be 72 characters or fewer."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters.").max(72),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  organization: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().min(20, "Tell us a little more (at least 20 characters).").max(2000),
});

export const assessmentSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(140),
  description: z.string().trim().min(10, "Add a short description.").max(2000),
  category: z.enum(CATEGORY_VALUES),
  duration: z.coerce.number().int().min(1).max(240),
  difficulty: z.enum(DIFFICULTIES),
  status: z.enum(["draft", "published"]),
});

export const optionSchema = z.object({
  id: z.string().trim().min(1).max(40),
  text: z.string().trim().min(1, "Option text is required.").max(300),
  score: z.coerce.number().min(0).max(100).optional(),
});

export const questionSchema = z
  .object({
    assessmentId: z.string().uuid(),
    questionText: z.string().trim().min(8).max(2000),
    questionType: z.enum(QUESTION_TYPES),
    options: z.array(optionSchema).min(2, "Add at least two options."),
    correctAnswer: z.string().trim().max(40).nullable().optional(),
    points: z.coerce.number().int().min(1).max(100),
    difficulty: z.enum(DIFFICULTIES),
    category: z.enum(CATEGORY_VALUES),
  })
  .superRefine((value, ctx) => {
    if (value.questionType !== "likert" && !value.correctAnswer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mark the correct answer.",
        path: ["correctAnswer"],
      });
    }
    if (value.correctAnswer && !value.options.some((option) => option.id === value.correctAnswer)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Correct answer must match an option.",
        path: ["correctAnswer"],
      });
    }
  });

export const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(ROLES),
});

export const settingsSchema = z.object({
  platform_name: z.string().trim().min(2).max(60),
  support_email: z.string().trim().email(),
  allow_public_registration: z.boolean(),
  default_duration_minutes: z.coerce.number().int().min(5).max(180),
  ai_question_generator_enabled: z.boolean(),
  ai_candidate_reports_enabled: z.boolean(),
});

export const aiRequestSchema = z.object({
  feature: z.enum(["question_generator", "candidate_report"]),
  prompt: z.string().trim().min(8).max(1000),
  assessmentId: z.string().uuid().optional(),
  attemptId: z.string().uuid().optional(),
});

export const assignmentSchema = z.object({
  assessmentId: z.string().uuid(),
  userId: z.string().uuid(),
});
