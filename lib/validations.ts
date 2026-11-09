import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const newPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const eventSchema = z.object({
  name: z.string().min(1, "Event name is required").max(150),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
  venue: z.string().min(1, "Venue is required").max(250),
  timezone: z.string().default("Asia/Manila"),
  rsvpDeadline: z.string().min(1, "RSVP deadline is required"),
});

export const guestSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  designation: z.string().min(1, "Designation is required").max(80),
  company: z.string().min(1, "Company is required").max(120),
  mobile: z.string().max(30).optional(),
  email: z.string().email("Invalid email address").max(255),
  salutation: z.enum(["MR", "MS", "MRS", "DR", "ENGR", "ATTY", "PROF"]).optional(),
  plusOneNames: z.array(z.string().max(100)).optional(),
  dietaryPreference: z.string().max(255).optional(),
  internalNotes: z.string().optional(),
  category: z.enum(["VIP", "MEDIA", "SPONSOR", "SPEAKER", "GENERAL"]).default("GENERAL"),
  invitationMethod: z.enum(["EMAIL", "QR_CODE", "BOTH"]).default("EMAIL"),
});

export const adminUserSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  name: z.string().min(1, "Name is required").max(100),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["SUPER_ADMIN", "EVENT_COORDINATOR", "VIEWER", "STAFF"]).default("EVENT_COORDINATOR"),
});

export const emailTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required").max(100),
  type: z.enum(["INVITATION", "ACCEPTANCE_CONFIRMATION", "DECLINE_ACKNOWLEDGMENT", "REMINDER", "THANK_YOU"]),
  subject: z.string().min(1, "Subject is required").max(255),
  htmlBody: z.string().optional(),
  plainBody: z.string().min(1, "Email body is required"),
  imageUrls: z.array(z.string()).default([]),
  senderName: z.string().min(1, "Sender name is required").max(100),
  replyTo: z.string().email("Invalid reply-to email").max(255),
  isDefault: z.boolean().default(false),
});

export const rsvpResponseSchema = z
  .object({
    response: z.enum(["ACCEPTED", "DECLINED"]),
    declineReason: z.string().max(500).optional(),
    plusOneNames: z.array(z.string().max(100)).optional(),
    dietaryPreference: z.string().max(255).optional(),
    fullName: z.string().max(100).optional(),
    email: z.string().max(255).optional(),
    company: z.string().max(120).optional(),
    mobile: z.string().max(30).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.response !== "ACCEPTED") return;
    if (!data.fullName?.trim()) {
      ctx.addIssue({ code: "custom", message: "Full name is required", path: ["fullName"] });
    }
    if (!data.email?.trim() || !z.string().email().safeParse(data.email.trim()).success) {
      ctx.addIssue({ code: "custom", message: "A valid email is required", path: ["email"] });
    }
  });

export const cloneEventSchema = z.object({
  name: z.string().min(1, "Event name is required").max(150),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
  rsvpDeadline: z.string().min(1, "RSVP deadline is required"),
});

export const rsvpOverrideSchema = z.object({
  toStatus: z.enum(["SENT", "ACCEPTED", "DECLINED", "PENDING", "EXPIRED"]),
  reason: z.string().min(1, "Reason is required").max(300),
});

export const attendanceOverrideSchema = z.object({
  toStatus: z.enum([
    "NOT_YET",
    "CONFIRMED_PRESENT",
    "WALK_IN_OVERRIDE",
    "UNREGISTERED_WALK_IN",
    "NO_SHOW",
    "EXCUSED_ABSENCE",
  ]),
  staffNote: z.string().max(300).optional(),
  reason: z.string().max(300).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export const contactSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  designation: z.string().min(1, "Designation is required").max(80),
  company: z.string().min(1, "Company / Publication is required").max(120),
  mobile: z.string().max(30).optional(),
  email: z.string().email("Invalid email address").max(255),
  salutation: z.enum(["MR", "MS", "MRS", "DR", "ENGR", "ATTY", "PROF"]).optional(),
  category: z.enum(["VIP", "MEDIA", "SPONSOR", "SPEAKER", "GENERAL"]).default("GENERAL"),
});

export type GuestInput = z.infer<typeof guestSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type AdminUserInput = z.infer<typeof adminUserSchema>;
export type EmailTemplateInput = z.infer<typeof emailTemplateSchema>;
export type RsvpResponseInput = z.infer<typeof rsvpResponseSchema>;
export type RsvpOverrideInput = z.infer<typeof rsvpOverrideSchema>;
export type AttendanceOverrideInput = z.infer<typeof attendanceOverrideSchema>;
