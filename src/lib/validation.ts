import { z } from "zod";

// Bangladeshi mobile format: optional +880/880/0 prefix, then 1[3-9] and 8 digits.
// e.g. 01755-512057, +8801755512057, 8801755512057
const bdPhoneRegex = /^(?:\+?880|0)1[3-9]\d{8}$/;
export const bdPhone = z
  .string()
  .trim()
  .refine((v) => bdPhoneRegex.test(v.replace(/[\s-]/g, "")), {
    message: "Enter a valid Bangladeshi phone number (e.g. 01XXXXXXXXX).",
  });

export const loginSchema = z.object({
  userId: z.string().trim().min(1, "User ID is required."),
  password: z.string().min(1, "Password is required."),
});

export const deviceNameEnum = z.enum([
  "Desktop",
  "Laptop",
  "Printer",
  "Scanner",
  "Monitor",
  "Router",
  "Switch",
  "UPS",
  "IP Phone",
  "Other",
]);

export const createComplaintSchema = z.object({
  complainerName: z.string().trim().min(1, "Name is required."),
  complainerDesignation: z.string().trim().min(1, "Designation is required."),
  complainerDepartment: z.string().trim().min(1, "Department is required."),
  complainerPhone: bdPhone,

  deviceName: z.string().trim().min(1, "Device is required."),
  deviceModel: z.string().trim().optional(),
  deviceSerial: z.string().trim().optional(),
  assetId: z.string().trim().optional(),
  location: z.string().trim().optional(),
  priority: z.enum(["Low", "Normal", "High", "Urgent"]).optional(),

  complaintDetails: z.string().trim().min(10, "Please describe the problem in more detail."),
});

export const COMPLAINT_STATUSES = [
  "PENDING",
  "DEVICE_COLLECTED",
  "ON_PROCESS",
  "DONE",
  "CANCELLED",
] as const;

export const updateStatusSchema = z.object({
  newStatus: z.enum(COMPLAINT_STATUSES),
  remarks: z.string().trim().max(1000).optional(),
});

export const createUserSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required."),
    userId: z
      .string()
      .trim()
      .min(3, "User ID must be at least 3 characters.")
      .regex(/^[a-zA-Z0-9._-]+$/, "User ID may only contain letters, numbers, dot, underscore, hyphen."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
    email: z.string().trim().email("Invalid email.").optional().or(z.literal("")),
    phone: bdPhone.optional().or(z.literal("")),
    designation: z.string().trim().optional(),
    department: z.string().trim().optional(),
    role: z.enum(["ADMIN", "IT_USER"]),
    status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: bdPhone.optional().or(z.literal("")),
  designation: z.string().trim().optional(),
  department: z.string().trim().optional(),
  role: z.enum(["ADMIN", "IT_USER"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  newPassword: z.string().min(8).optional(),
});
