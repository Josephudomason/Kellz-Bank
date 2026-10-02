"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({ name: z.string().trim().min(2, "Use at least 2 characters.").max(60), type: z.enum(["CHECKING", "SAVINGS"]) });
type Fields = z.infer<typeof schema>;

export default function AccountCreationForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<Fields>({ resolver: zodResolver(schema), defaultValues: { name: "", type: "CHECKING" } });

  async function onSubmit(values: Fields) {
    try {
      const response = await fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to create account.");
      toast.success("Account created.");
      setOpen(false);
      form.reset({ name: "", type: "CHECKING" });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create account.");
    }
  }

  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="new-account-form" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#c9d8cc] bg-white px-3.5 text-sm font-semibold text-[#28553c] hover:bg-[#f4f8f4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257]">{open ? <X size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}{open ? "Close" : "Add account"}</button>
      {open && <form id="new-account-form" onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-3 grid gap-3 rounded-lg border border-[#dfe7df] bg-white p-4 sm:grid-cols-[minmax(180px,1fr)_180px_auto] sm:items-end">
        <label className="block text-sm font-medium text-[#394e42]">Account name<input className="mt-1.5 h-10 w-full rounded-lg border border-[#d6ded8] px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257]" placeholder="e.g. Travel fund" {...form.register("name")} />{form.formState.errors.name && <span className="mt-1 block text-sm text-[#a33f32]">{form.formState.errors.name.message}</span>}</label>
        <label className="block text-sm font-medium text-[#394e42]">Account type<select className="mt-1.5 h-10 w-full rounded-lg border border-[#d6ded8] bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257]" {...form.register("type")}><option value="CHECKING">Checking</option><option value="SAVINGS">Savings</option></select></label>
        <button type="submit" disabled={form.formState.isSubmitting} className="min-h-10 rounded-lg bg-[#123b32] px-4 text-sm font-semibold text-white hover:bg-[#1b5143] disabled:opacity-50">{form.formState.isSubmitting ? "Creating…" : "Create account"}</button>
      </form>}
    </div>
  );
}