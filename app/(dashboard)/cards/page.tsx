import { CreditCard } from "lucide-react";
import CardTile, { type CardDisplayData } from "@/components/cards/CardTile";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export default async function CardsPage() {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  let cards: CardDisplayData[];
  try {
    const records = await getPrisma().card.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, type: true, status: true, last4: true, expirationMonth: true, expirationYear: true, spentThisPeriod: true, spendingLimit: true, account: { select: { currency: true } } },
    });
    cards = records.map(({ account, ...card }) => ({ ...card, currency: account?.currency ?? "USD", spentThisPeriod: card.spentThisPeriod.toString(), spendingLimit: card.spendingLimit?.toString() ?? null }));
  } catch {
    return <section className="border-l-4 border-[#d5845b] bg-white px-6 py-7"><p className="text-xs font-semibold uppercase text-[#9a5b39]">Cards unavailable</p><h1 className="mt-2 text-2xl font-semibold text-[#20392d]">Connect your database</h1><p className="mt-3 text-sm leading-6 text-[#718078]">Configure PostgreSQL before loading simulated cards.</p></section>;
  }

  return (
    <div className="space-y-7">
      <header><p className="text-sm font-medium text-[#46785b]">Cards</p><h1 className="mt-2 text-3xl font-semibold text-[#1d352a]">Your cards</h1><p className="mt-2 text-sm text-[#758279]">Manage simulated debit and virtual cards. No payment credentials are stored.</p></header>
      {cards.length === 0 ? <div className="border-y border-[#e1e8e1] py-14 text-center"><CreditCard className="mx-auto text-[#75857a]" size={25} aria-hidden="true" /><h2 className="mt-4 font-semibold text-[#344b3e]">No cards issued</h2><p className="mt-2 text-sm text-[#758279]">Cards will appear here when created for your profile.</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cards.map((card) => <CardTile key={card.id} card={card} />)}</div>}
      <p className="text-xs leading-5 text-[#7b887f]">Only card type, last four digits, and expiry are shown. Card numbers and CVV are never stored by this demo.</p>
    </div>
  );
}