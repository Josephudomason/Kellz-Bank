import { ArrowLeftRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TransferForm from "@/components/forms/TransferForm";
import MotionReveal from "@/components/motion/MotionReveal";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

function statusVariant(status: string) {
  if (status === "COMPLETED") return "success";
  if (status === "PENDING" || status === "PROCESSING") return "pending";
  return "destructive";
}

export default async function TransfersPage() {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  let accounts;
  let transfers;
  try {
    const prisma = getPrisma();
    [accounts, transfers] = await Promise.all([
      prisma.account.findMany({
        where: { userId: user.id, status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, numberLast4: true, currency: true, availableBalance: true },
      }),
      prisma.transfer.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 25,
        select: { id: true, recipientName: true, description: true, amount: true, currency: true, status: true, fundsReserved: true, createdAt: true },
      }),
    ]);
  } catch {
    return <section className="border-l-4 border-[#d5845b] bg-white px-6 py-7"><p className="text-xs font-semibold uppercase text-[#9a5b39]">Transfers unavailable</p><h1 className="mt-2 text-2xl font-semibold text-[#20392d]">Connect your database</h1><p className="mt-3 text-sm leading-6 text-[#718078]">Configure PostgreSQL before creating or viewing transfers.</p></section>;
  }

  const formAccounts = accounts.map((account) => ({ ...account, availableBalance: account.availableBalance.toString() }));

  return (
    <div className="space-y-8">
      <MotionReveal delay={0.04}><header><p className="text-sm font-medium text-[#46785b]">Payments</p><h1 className="mt-2 text-3xl font-semibold text-[#1d352a]">Send money</h1><p className="mt-2 text-sm text-[#758279]">Move funds between your accounts or create a pending demo transfer.</p></header></MotionReveal>
      <MotionReveal delay={0.08}>
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
          <section><div className="mb-3 flex items-center gap-2"><ArrowLeftRight size={18} className="text-[#397653]" aria-hidden="true" /><h2 className="font-semibold text-[#20392d]">New transfer</h2></div><TransferForm accounts={formAccounts} /></section>
          <section aria-labelledby="transfer-history-heading"><div className="mb-3 flex items-center justify-between"><h2 id="transfer-history-heading" className="font-semibold text-[#20392d]">Transfer history</h2><span className="text-xs text-[#7b887f]">Latest 25</span></div>{transfers.length === 0 ? <div className="border-y border-[#e1e8e1] py-10 text-center"><p className="font-medium text-[#344b3e]">No transfers yet</p><p className="mt-2 text-sm text-[#758279]">Transfers you create will appear here.</p></div> : <ul className="divide-y divide-[#e7ece7] border-y border-[#e7ece7]">{transfers.map((transfer) => <li key={transfer.id} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0"><p className="truncate text-sm font-medium text-[#293f33]">{transfer.recipientName || "Account transfer"}</p><p className="mt-1 truncate text-xs text-[#7b887f]">{transfer.description || transfer.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p><Badge className="mt-2" variant={statusVariant(transfer.status)}>{transfer.status.toLowerCase()}</Badge>{transfer.status === "PENDING" && <p className="mt-1 text-xs text-[#7b887f]">{transfer.fundsReserved ? "Funds reserved" : "Awaiting available funds"}</p>}</div><p className="shrink-0 text-sm font-semibold tabular-nums text-[#293f33]">{new Intl.NumberFormat("en-US", { style: "currency", currency: transfer.currency }).format(Number(transfer.amount))}</p></li>)}</ul>}</section>
        </div>
      </MotionReveal>
    </div>
  );
}