import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms/AuthForms";

export default function ForgotPasswordPage() {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#367153]">Account recovery</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight">Reset your password</h2>
      <p className="mt-2 mb-8 text-sm leading-6 text-[#617168]">We’ll email you a secure link to choose a new password.</p>
      <ForgotPasswordForm />
      <p className="mt-7 text-center text-sm text-[#617168]">
        Remembered it? <Link href="/login" className="font-semibold text-[#28664e] hover:underline">Back to sign in</Link>
      </p>
    </div>
  );
}