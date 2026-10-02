import Link from "next/link";
import { RegisterForm } from "@/components/forms/AuthForms";

export default function RegisterPage() {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#367153]">Get started</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight lg:mt-2 lg:text-2xl">Create your account</h2>
      <p className="mt-2 mb-8 text-sm leading-6 text-[#617168] lg:mb-3">Set up your personal view of the money you manage.</p>
      <RegisterForm />
      <p className="mt-7 text-center text-sm text-[#617168] lg:mt-2">
        Already have an account? <Link href="/login" className="font-semibold text-[#28664e] hover:underline">Sign in</Link>
      </p>
      <p className="mt-6 text-center text-xs leading-5 text-[#7b8981] lg:mt-2">Development and portfolio use only. No real bank account or funds are created.</p>
    </div>
  );
}