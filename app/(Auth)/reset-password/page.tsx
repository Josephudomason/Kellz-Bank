import Link from "next/link";
import { ResetPasswordForm } from "@/components/forms/AuthForms";

export default function ResetPasswordPage() {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#367153]">Secure your account</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight">Choose a new password</h2>
      <p className="mt-2 mb-8 text-sm leading-6 text-[#617168]">Use at least 12 characters and keep it unique to Kellz.</p>
      <ResetPasswordForm />
      <p className="mt-7 text-center text-sm text-[#617168]">
        Need another link? <Link href="/forget-password" className="font-semibold text-[#28664e] hover:underline">Request a reset</Link>
      </p>
    </div>
  );
}