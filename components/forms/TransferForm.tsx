"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

type TransferAccount = { id: string; name: string; numberLast4: string; currency: string; availableBalance: string };

const transferSchema = z
  .object({
    fromAccountId: z.string().uuid("Choose a source account."),
    destination: z.string().min(1, "Choose a destination."),
    recipientName: z.string().trim().max(100).optional(),
    recipientEmail: z.union([z.string().trim().email("Enter a valid email.").max(254), z.literal("")]).optional(),
    amount: z.string().regex(/^\d{1,8}(?:\.\d{1,2})?$/, "Enter an amount with up to two decimal places."),
    description: z.string().trim().max(140, "Keep the note under 140 characters.").optional(),
  })
  .refine((values) => values.destination !== "external" || Boolean(values.recipientName?.trim()), {
    path: ["recipientName"],
    message: "Enter the recipient’s name.",
  })
  .refine((values) => values.destination !== values.fromAccountId, {
    path: ["destination"],
    message: "Choose a different destination account.",
  })
  .refine((values) => Number(values.amount) > 0, {
    path: ["amount"],
    message: "Enter an amount greater than zero.",
  });

type TransferFields = z.infer<typeof transferSchema>;

const fieldClassName = "mt-1.5 h-11 w-full rounded-lg border border-[#d6ded8] bg-white px-3 text-sm text-[#142720] outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257]";
const buttonClassName = "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#123b32] px-4 text-sm font-semibold text-white transition hover:bg-[#1b5143] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257] disabled:cursor-not-allowed disabled:opacity-50";

export default function TransferForm({ accounts }: { accounts: TransferAccount[] }) {
  const router = useRouter();
  const [review, setReview] = useState<TransferFields | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<TransferFields>({
    resolver: zodResolver(transferSchema),
    defaultValues: { fromAccountId: accounts[0]?.id ?? "", destination: "external", recipientName: "", recipientEmail: "", amount: "", description: "" },
  });
  const destination = form.watch("destination");
  const source = accounts.find((account) => account.id === (review?.fromAccountId ?? form.getValues("fromAccountId")));
  const target = review?.destination && review.destination !== "external" ? accounts.find((account) => account.id === review.destination) : undefined;

  async function confirmTransfer() {
    if (!review || !source) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAccountId: review.fromAccountId,
          ...(review.destination === "external" ? { recipientName: review.recipientName, recipientEmail: review.recipientEmail || undefined } : { toAccountId: review.destination }),
          amount: review.amount,
          description: review.description || undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to create transfer.");
      if (result.data.status === "PENDING") toast.info(result.message);
      else toast.success(result.message);
      setReview(null);
      form.reset({ fromAccountId: accounts[0]?.id ?? "", destination: "external", recipientName: "", recipientEmail: "", amount: "", description: "" });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create transfer.");
    } finally {
      setSubmitting(false);
    }
  }

  if (review) {
    const recipient = target?.name || review.recipientName || "Recipient";
    return (
      <motion.section initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.24, ease: "easeOut" }} aria-labelledby="review-transfer-heading" className="rounded-lg border border-[#dfe7df] bg-white p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase text-[#46785b]">Review</p>
        <h2 id="review-transfer-heading" className="mt-2 text-xl font-semibold text-[#20392d]">Confirm these details</h2>
        <dl className="mt-5 divide-y divide-[#e8ede8] border-y border-[#e8ede8]">
          <div className="flex justify-between gap-4 py-3 text-sm"><dt className="text-[#718078]">From</dt><dd className="text-right font-medium text-[#293f33]">{source?.name} ···· {source?.numberLast4}</dd></div>
          <div className="flex justify-between gap-4 py-3 text-sm"><dt className="text-[#718078]">To</dt><dd className="text-right font-medium text-[#293f33]">{recipient}</dd></div>
          <div className="flex justify-between gap-4 py-3 text-sm"><dt className="text-[#718078]">Amount</dt><dd className="font-semibold tabular-nums text-[#20392d]">{new Intl.NumberFormat("en-US", { style: "currency", currency: source?.currency ?? "USD" }).format(Number(review.amount))}</dd></div>
          {review.description && <div className="flex justify-between gap-4 py-3 text-sm"><dt className="text-[#718078]">Note</dt><dd className="max-w-[65%] text-right text-[#293f33]">{review.description}</dd></div>}
        </dl>
        <p className="mt-4 text-xs leading-5 text-[#7b887f]">Transfers to another person remain pending in this demo. Available funds are reserved when possible; otherwise the transfer waits for funds. No real money is moved.</p>
        <div className="mt-5 flex flex-wrap gap-3"><button type="button" className="min-h-11 rounded-lg border border-[#d6ded8] px-4 text-sm font-medium text-[#3e5145] hover:bg-[#f6f8f6]" onClick={() => setReview(null)}>Edit details</button><button type="button" className={buttonClassName} disabled={submitting} onClick={confirmTransfer}>{submitting ? "Submitting…" : "Confirm transfer"}</button></div>
      </motion.section>
    );
  }

  return (
    <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: "easeOut" }} onSubmit={form.handleSubmit(setReview)} noValidate className="space-y-4 rounded-lg border border-[#dfe7df] bg-white p-5 sm:p-6">
      <label className="block text-sm font-medium text-[#394e42]">From account
        <select className={fieldClassName} disabled={accounts.length === 0} {...form.register("fromAccountId")}><option value="">Select an account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name} ···· {account.numberLast4} · available {new Intl.NumberFormat("en-US", { style: "currency", currency: account.currency }).format(Number(account.availableBalance))}</option>)}</select>
        {form.formState.errors.fromAccountId && <span className="mt-1 block text-sm text-[#a33f32]">{form.formState.errors.fromAccountId.message}</span>}
      </label>
      <label className="block text-sm font-medium text-[#394e42]">Send to
        <select className={fieldClassName} {...form.register("destination")}><option value="external">Another person</option>{accounts.filter((account) => account.id !== form.watch("fromAccountId")).map((account) => <option key={account.id} value={account.id}>{account.name} ···· {account.numberLast4}</option>)}</select>
        {form.formState.errors.destination && <span className="mt-1 block text-sm text-[#a33f32]">{form.formState.errors.destination.message}</span>}
      </label>
      {destination === "external" && <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-[#394e42]">Recipient name<input className={fieldClassName} autoComplete="name" {...form.register("recipientName")} />{form.formState.errors.recipientName && <span className="mt-1 block text-sm text-[#a33f32]">{form.formState.errors.recipientName.message}</span>}</label><label className="block text-sm font-medium text-[#394e42]">Recipient email <span className="font-normal text-[#7b887f]">(optional)</span><input className={fieldClassName} type="email" autoComplete="email" {...form.register("recipientEmail")} />{form.formState.errors.recipientEmail && <span className="mt-1 block text-sm text-[#a33f32]">{form.formState.errors.recipientEmail.message}</span>}</label></div>}
      <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-[#394e42]">Amount<input className={fieldClassName} inputMode="decimal" placeholder="0.00" {...form.register("amount")} />{form.formState.errors.amount && <span className="mt-1 block text-sm text-[#a33f32]">{form.formState.errors.amount.message}</span>}</label><label className="block text-sm font-medium text-[#394e42]">Note <span className="font-normal text-[#7b887f]">(optional)</span><input className={fieldClassName} maxLength={140} {...form.register("description")} />{form.formState.errors.description && <span className="mt-1 block text-sm text-[#a33f32]">{form.formState.errors.description.message}</span>}</label></div>
      <p className="text-xs leading-5 text-[#7b887f]">Demo only. Transfers between your accounts settle immediately. Transfers to another person are marked pending; no real money is sent.</p>
      <button type="submit" disabled={accounts.length === 0 || form.formState.isSubmitting} className={buttonClassName}>Review transfer</button>
    </motion.form>
  );
}