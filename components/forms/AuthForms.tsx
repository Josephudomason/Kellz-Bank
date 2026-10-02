"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { loginSchema, registrationSchema } from "@/lib/registration-schema";

const emailSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

const passwordSchema = z
  .object({
    password: z.string().min(12, "Use at least 12 characters.").max(128),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

type LoginFields = z.infer<typeof loginSchema>;
type RegisterFields = z.infer<typeof registrationSchema>;
type EmailFields = z.infer<typeof emailSchema>;
type PasswordFields = z.infer<typeof passwordSchema>;

const inputClassName =
  "mt-2 block min-h-12 w-full rounded-lg border border-[#d6ded8] bg-white px-3.5 text-sm text-[#142720] outline-none transition placeholder:text-[#89968e] focus:border-[#2f7257] focus:ring-2 focus:ring-[#2f7257]/15";
const compactRegistrationInputClassName = `${inputClassName} lg:min-h-10`;
const buttonClassName =
  "inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#123b32] px-4 text-sm font-semibold text-white transition hover:bg-[#1b5143] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1.5 text-sm text-[#a33f32]">{message}</p> : null;
}

export function LoginForm({ authError }: { authError?: boolean }) {
  const router = useRouter();
  const form = useForm<LoginFields>({ resolver: zodResolver(loginSchema) });
  const [passwordVisible, setPasswordVisible] = useState(false);

  async function onSubmit(values: LoginFields) {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Unable to sign in.");
      toast.success("You’re signed in.");
      const requestedPath = new URLSearchParams(window.location.search).get("next");
      const destination = requestedPath && requestedPath.startsWith("/") && !requestedPath.startsWith("//") && !requestedPath.includes("\\")
        ? requestedPath
        : "/dashboard";
      router.replace(destination);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign in.");
    }
  }

  return (
    <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease: "easeOut" }} className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {authError && <p role="alert" className="rounded-lg border border-[#e7c4bd] bg-[#fbf1ef] px-3.5 py-3 text-sm leading-5 text-[#8b392d]">Sign-in could not be completed. Please try again.</p>}
      <label className="block text-sm font-medium" htmlFor="login-email">
        Email address
        <input id="login-email" className={inputClassName} type="email" autoComplete="email" {...form.register("email")} />
        <FieldError message={form.formState.errors.email?.message} />
      </label>
      <label className="block text-sm font-medium" htmlFor="login-password">
        <span className="flex items-center justify-between">
          Password
          <Link href="/forget-password" className="font-medium text-[#28664e] hover:underline">Forgot password?</Link>
        </span>
        <div className="relative">
          <input id="login-password" className={`${inputClassName} pr-12`} type={passwordVisible ? "text" : "password"} autoComplete="current-password" {...form.register("password")} />
          <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} aria-label={passwordVisible ? "Hide password" : "Show password"} title={passwordVisible ? "Hide password" : "Show password"} className="absolute right-2 top-7 grid size-9 -translate-y-1/2 place-items-center rounded-md text-[#526359] hover:bg-[#f1f5f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257]"><EyeIcon visible={passwordVisible} /></button>
        </div>
        <FieldError message={form.formState.errors.password?.message} />
      </label>
      <button className={buttonClassName} type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </motion.form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const form = useForm<RegisterFields>({
    resolver: zodResolver(registrationSchema),
    mode: "onChange",
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });
  const password = form.watch("password");
  const confirmPassword = form.watch("confirmPassword");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const { trigger } = form;

  useEffect(() => {
    if (confirmPassword) void trigger("confirmPassword");
  }, [password, confirmPassword, trigger]);

  async function onSubmit(values: RegisterFields) {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to create your account.");
      toast.success("Account created. You’re signed in.");
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create your account.");
    }
  }

  return (
    <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease: "easeOut", delay: 0.04 }} className="space-y-3 lg:space-y-2.5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <label className="block text-sm font-medium" htmlFor="register-full-name">
        Full name
        <input id="register-full-name" className={compactRegistrationInputClassName} autoComplete="name" {...form.register("fullName")} />
        <FieldError message={form.formState.errors.fullName?.message} />
      </label>
      <label className="block text-sm font-medium" htmlFor="register-email">
        Email address
        <input id="register-email" className={compactRegistrationInputClassName} type="email" autoComplete="email" {...form.register("email")} />
        <FieldError message={form.formState.errors.email?.message} />
      </label>
      <label className="block text-sm font-medium" htmlFor="register-password">
        Password
        <div className="relative">
          <input id="register-password" className={`${compactRegistrationInputClassName} pr-12`} type={passwordVisible ? "text" : "password"} autoComplete="new-password" {...form.register("password")} />
          <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} aria-label={passwordVisible ? "Hide password" : "Show password"} title={passwordVisible ? "Hide password" : "Show password"} className="absolute right-2 top-7 grid size-9 -translate-y-1/2 place-items-center rounded-md text-[#526359] hover:bg-[#f1f5f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257]"><EyeIcon visible={passwordVisible} /></button>
        </div>
        <FieldError message={form.formState.errors.password?.message} />
      </label>
      <label className="block text-sm font-medium" htmlFor="register-confirm-password">
        Confirm password
        <div className="relative">
          <input id="register-confirm-password" className={`${compactRegistrationInputClassName} pr-12`} type={confirmationVisible ? "text" : "password"} autoComplete="new-password" {...form.register("confirmPassword")} />
          <button type="button" onClick={() => setConfirmationVisible(!confirmationVisible)} aria-label={confirmationVisible ? "Hide password" : "Show password"} title={confirmationVisible ? "Hide password" : "Show password"} className="absolute right-2 top-7 grid size-9 -translate-y-1/2 place-items-center rounded-md text-[#526359] hover:bg-[#f1f5f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257]"><EyeIcon visible={confirmationVisible} /></button>
        </div>
        {confirmPassword && <p aria-live="polite" className={`mt-1.5 text-sm ${password === confirmPassword ? "text-[#28664e]" : "text-[#a33f32]"}`}>{password === confirmPassword ? "Passwords match." : "Passwords do not match."}</p>}
        <FieldError message={form.formState.errors.confirmPassword?.message} />
      </label>
      <button className={buttonClassName} type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Continuing…" : "Create account"}
      </button>
    </motion.form>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />;
}

export function ForgotPasswordForm() {
  const form = useForm<EmailFields>({ resolver: zodResolver(emailSchema) });

  async function onSubmit(values: EmailFields) {
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to send a reset link.");
      toast.success("If an account exists for that address, a reset link is on its way.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send a reset link.");
    }
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <label className="block text-sm font-medium" htmlFor="recovery-email">
        Email address
        <input id="recovery-email" className={inputClassName} type="email" autoComplete="email" {...form.register("email")} />
        <FieldError message={form.formState.errors.email?.message} />
      </label>
      <button className={buttonClassName} type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Sending link…" : "Send reset link"}
      </button>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const form = useForm<PasswordFields>({ resolver: zodResolver(passwordSchema) });

  async function onSubmit(values: PasswordFields) {
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: values.password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update your password.");
      toast.success("Password updated.");
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update your password.");
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <label className="block text-sm font-medium" htmlFor="new-password">
        New password
        <input id="new-password" className={inputClassName} type="password" autoComplete="new-password" {...form.register("password")} />
        <FieldError message={form.formState.errors.password?.message} />
      </label>
      <label className="block text-sm font-medium" htmlFor="confirm-password">
        Confirm new password
        <input id="confirm-password" className={inputClassName} type="password" autoComplete="new-password" {...form.register("confirmPassword")} />
        <FieldError message={form.formState.errors.confirmPassword?.message} />
      </label>
      <button className={buttonClassName} type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Updating password…" : "Update password"}
      </button>
    </form>
  );
}