"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LogOut } from "lucide-react";
import { toast } from "sonner";
import MobileNavigation from "./Mobile";

export default function Navbar({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const initials = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  async function signOut() {
    setSigningOut(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Unable to sign out.");
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Unable to sign out. Please try again.");
      setSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-20 flex min-h-[72px] items-center justify-between border-b border-[#e1e8e1] bg-white/95 px-4 backdrop-blur sm:px-8 lg:px-10">
      <div className="flex items-center gap-3"><MobileNavigation /><div className="hidden text-xs font-medium text-[#79867d] sm:block">PERSONAL BANKING</div><span className="rounded-md border border-[#ead5bd] bg-[#fbf5ec] px-2 py-1 text-xs font-semibold text-[#8c5a28] sm:hidden">Demo</span></div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block"><p className="text-sm font-semibold text-[#21392e]">{name}</p><p className="text-xs text-[#77847b]">{email}</p></div>
        <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-[#d9e9df] text-xs font-semibold text-[#184632]">{initials}</span>
        <button type="button" onClick={signOut} disabled={signingOut} aria-busy={signingOut} aria-label={signingOut ? "Signing out" : "Sign out"} title={signingOut ? "Signing out" : "Sign out"} className="grid size-10 place-items-center rounded-lg text-[#526359] hover:bg-[#f1f5f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257] disabled:opacity-70">{signingOut ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : <LogOut size={18} aria-hidden="true" />}</button>
      </div>
    </header>
  );
}