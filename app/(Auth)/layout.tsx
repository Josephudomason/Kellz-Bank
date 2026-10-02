import Link from "next/link";
import { ShieldCheck, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import MotionReveal from "@/components/motion/MotionReveal";
import AuthLottie from "@/components/motion/AuthLottie";
import BrandLogo from "@/components/BrandLogo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f4f7f4] text-[#142720] lg:grid lg:h-dvh lg:min-h-0 lg:grid-cols-[1fr_1fr] lg:overflow-hidden">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#06370b] p-8 text-white lg:flex lg:h-dvh lg:min-h-0 xl:p-12">
        <div className="absolute -right-24 -top-24 size-96 rounded-full border border-white/10" />
        <div className="absolute -right-10 -top-10 size-64 rounded-full border border-white/10" />
        <Link href="/" className="relative inline-flex items-center">
          <BrandLogo className="h-12 w-28" />
        </Link>
        <MotionReveal className="relative flex flex-1 flex-col items-center justify-center py-3 text-center" delay={0.08}>
          <div className="mb-2 aspect-[429/444] w-full max-w-[min(48vh,390px)]" aria-hidden="true">
            <AuthLottie />
          </div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-[#d8f16d]">
            <Sparkles size={14} aria-hidden="true" /> YOUR MONEY, IN GOOD ORDER
          </p>
          <h1 className="max-w-xl text-3xl font-semibold leading-tight xl:text-4xl">
            A clearer view of your financial life.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/70">
            Follow your accounts, understand your spending, and move money with confidence.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-white/75">
            <ShieldCheck size={16} className="text-[#d8f16d]" aria-hidden="true" />
            Secure sign-in powered by Supabase Auth
          </div>
        </MotionReveal>
        <p className="relative text-xs text-white/50">Development banking experience. No real money is held or transferred.</p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-10 lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:px-8 lg:py-2 xl:px-12">
        <MotionReveal className="w-full max-w-[440px]" delay={0.04}>
          <Link href="/" className="mb-10 inline-flex items-center lg:hidden">
            <BrandLogo className="h-10 w-24" />
          </Link>
          {children}
        </MotionReveal>
      </section>
    </main>
  );
}