"use client";

import { useState } from "react";
import { CreditCard, Snowflake } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export type CardDisplayData = {
  id: string;
  name: string;
  type: string;
  status: string;
  last4: string;
  expirationMonth: number;
  expirationYear: number;
  currency: string;
  spentThisPeriod: string;
  spendingLimit: string | null;
};

export default function CardTile({ card: initialCard }: { card: CardDisplayData }) {
  const [card, setCard] = useState(initialCard);
  const [updating, setUpdating] = useState(false);
  const active = card.status === "ACTIVE";

  async function toggleStatus() {
    setUpdating(true);
    try {
      const response = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: active ? "FROZEN" : "ACTIVE" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update card.");
      setCard((current) => ({ ...current, status: result.data.status }));
      toast.success(active ? "Card frozen." : "Card unfrozen.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update card.");
    } finally {
      setUpdating(false);
    }
  }

  const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: card.currency });

  return (
    <article className="rounded-lg border border-[#dfe7df] bg-white p-5">
      <div className={`relative flex min-h-[190px] flex-col justify-between overflow-hidden rounded-lg p-5 text-white ${active ? "bg-[#174838]" : "bg-[#515f57]"}`}>
        <div className="absolute -right-12 -top-14 size-48 rounded-full border border-white/15" />
        <div className="relative flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">Kellz {card.type.toLowerCase()}</p><p className="mt-1 text-xs text-white/65">{card.name}</p></div><CreditCard size={21} aria-hidden="true" /></div>
        <div className="relative"><p className="text-lg font-medium tracking-[0.08em]">•••• &nbsp;•••• &nbsp;•••• &nbsp;{card.last4}</p><p className="mt-2 text-xs text-white/70">EXPIRES {String(card.expirationMonth).padStart(2, "0")}/{String(card.expirationYear).slice(-2)}</p></div>
        {!active && <div className="absolute inset-0 grid place-items-center bg-[#17231e]/35"><Badge variant="pending">Frozen</Badge></div>}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3"><div><p className="text-xs text-[#7b887f]">Spent this period</p><p className="mt-1 text-sm font-semibold tabular-nums text-[#263c31]">{formatter.format(Number(card.spentThisPeriod))}{card.spendingLimit ? <span className="font-normal text-[#7b887f]"> / {formatter.format(Number(card.spendingLimit))}</span> : null}</p></div><Badge variant={active ? "success" : "pending"}>{card.status.toLowerCase()}</Badge></div>
      <button type="button" onClick={toggleStatus} disabled={updating || card.status === "CANCELLED"} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#d6ded8] px-3 text-sm font-medium text-[#354a3e] hover:bg-[#f5f8f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257] disabled:opacity-50"><Snowflake size={16} aria-hidden="true" />{updating ? "Updating…" : active ? "Freeze card" : "Unfreeze card"}</button>
    </article>
  );
}