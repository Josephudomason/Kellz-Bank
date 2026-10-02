"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const nameSchema = z.object({ displayName: z.string().trim().min(1, "Enter your name.").max(100) });
const passwordSchema = z
  .object({ password: z.string().min(12, "Use at least 12 characters.").max(128), confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });

type NameFields = z.infer<typeof nameSchema>;
type PasswordFields = z.infer<typeof passwordSchema>;
const inputClassName = "mt-1.5 h-11 w-full rounded-lg border border-[#d6ded8] bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257]";
const buttonClassName = "inline-flex min-h-10 items-center justify-center rounded-lg bg-[#123b32] px-4 text-sm font-semibold text-white hover:bg-[#1b5143] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257] disabled:opacity-50";

export function ProfileForm({ initialName }: { initialName: string }) {
  const form = useForm<NameFields>({ resolver: zodResolver(nameSchema), defaultValues: { displayName: initialName } });

  async function onSubmit(values: NameFields) {
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update your profile.");
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update your profile.");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="max-w-lg space-y-4">
      <label htmlFor="profile-name" className="block text-sm font-medium text-[#394e42]">Display name<input id="profile-name" className={inputClassName} autoComplete="name" {...form.register("displayName")} />{form.formState.errors.displayName && <span className="mt-1 block text-sm text-[#a33f32]">{form.formState.errors.displayName.message}</span>}</label>
      <button className={buttonClassName} type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Saving…" : "Save changes"}</button>
    </form>
  );
}

export function PasswordForm() {
  const form = useForm<PasswordFields>({ resolver: zodResolver(passwordSchema) });

  async function onSubmit(values: PasswordFields) {
    try {
      const response = await fetch("/api/profile/password", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: values.password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update your password.");
      toast.success("Password updated.");
      form.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update your password.");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="max-w-lg space-y-4">
      <label htmlFor="settings-password" className="block text-sm font-medium text-[#394e42]">New password<input id="settings-password" type="password" autoComplete="new-password" className={inputClassName} {...form.register("password")} />{form.formState.errors.password && <span className="mt-1 block text-sm text-[#a33f32]">{form.formState.errors.password.message}</span>}</label>
      <label htmlFor="settings-password-confirm" className="block text-sm font-medium text-[#394e42]">Confirm new password<input id="settings-password-confirm" type="password" autoComplete="new-password" className={inputClassName} {...form.register("confirmPassword")} />{form.formState.errors.confirmPassword && <span className="mt-1 block text-sm text-[#a33f32]">{form.formState.errors.confirmPassword.message}</span>}</label>
      <button className={buttonClassName} type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Updating…" : "Update password"}</button>
    </form>
  );
}