import Link from "next/link";
import { LoginForm } from "@/components/forms/AuthForms";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#367153]">Welcome back</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight">Sign in to Kellz</h2>
      <p className="mt-2 mb-8 text-sm leading-6 text-[#617168]">See what’s happening with your money today.</p>
      <LoginForm authError={Boolean(params.error)} />
      <p className="mt-7 text-center text-sm text-[#617168]">
        New to Kellz? <Link href="/register" className="font-semibold text-[#28664e] hover:underline">Create an account</Link>
      </p>
    </div>
  );
}