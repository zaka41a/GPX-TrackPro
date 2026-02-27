import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type RegisterFormData = z.infer<typeof registerSchema>;

export const profileSchema = z.object({
  bio: z.string().max(500).optional().default(""),
  phone: z.string().max(30).optional().default(""),
  dateOfBirth: z.string().optional().default(""),
  gender: z.string().optional().default(""),
  country: z.string().max(100).optional().default(""),
  city: z.string().max(100).optional().default(""),
  height: z.number().positive().nullable().optional(),
  weight: z.number().positive().nullable().optional(),
  primarySport: z.enum(["cycling", "running", "other"]).default("cycling"),
  secondarySports: z.array(z.enum(["cycling", "running", "other"])).default([]),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced", "elite"]).default("intermediate"),
  weeklyGoalHours: z.number().positive().nullable().optional(),
  avatarUrl: z.string().optional().default(""),
  sportPhotoUrl: z.string().optional().default(""),
});
export type ProfileFormData = z.infer<typeof profileSchema>;

export const communityPostSchema = z.object({
  content: z.string().min(1, "Content is required").max(5000, "Post must be at most 5000 characters"),
});
export type CommunityPostFormData = z.infer<typeof communityPostSchema>;

export const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(2000, "Message must be at most 2000 characters"),
});
export type MessageFormData = z.infer<typeof messageSchema>;

export const changeEmailSchema = z.object({
  newEmail: z.string().email("Invalid email address").max(255),
  currentPassword: z.string().min(1, "Password is required"),
});
export type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(2, "Subject is required").max(200),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});
export type ContactFormData = z.infer<typeof contactSchema>;
