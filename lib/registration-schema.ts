import { z } from "zod";

export const registrationFieldsSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your full name.").max(100),
  email: z.string().trim().email("Enter a valid email address.").max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(12, "Use at least 12 characters.").max(128),
});

const registrationFormFieldsSchema = registrationFieldsSchema.extend({ confirmPassword: z.string() });
const passwordsMatch = (values: { password: string; confirmPassword: string }) => values.password === values.confirmPassword;

export const registrationFormSchema = registrationFormFieldsSchema.refine(passwordsMatch, {
  path: ["confirmPassword"],
  message: "Passwords do not match.",
});

export const registrationSchema = registrationFormFieldsSchema.refine(passwordsMatch, {
  path: ["confirmPassword"],
  message: "Passwords do not match.",
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").max(254),
  password: z.string().min(1, "Enter your password.").max(128),
});