import Link from "next/link";
import { ArrowUpRight, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AccountCardProps = {
  account: {
    id: string;
    name: string;
    type: string;
    status: string;
    numberLast4: string;
    currency: string;
    availableBalance: { toString(): string };
    currentBalance: { toString(): string };
  };
};

export default function AccountCard({ account }: AccountCardProps) {
  const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: account.currency });
  const statusVariant = account.status === "ACTIVE" ? "default" : account.status === "FROZEN" ? "pending" : "secondary";

  return (
    <article className="rounded-lg border border-[#dfe7df] bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#edf3ee] text-[#35614a]"><Landmark size={20} aria-hidden="true" /></span>
          <div className="min-w-0"><h2 className="truncate font-semibold text-[#20392d]">{account.name}</h2><p className="mt-1 text-sm capitalize text-[#78867d]">{account.type.toLowerCase()} ···· {account.numberLast4}</p></div>
        </div>
        <Badge variant={statusVariant}>{account.status.toLowerCase()}</Badge>
      </div>
      <div className="mt-7 grid grid-cols-2 gap-4 border-t border-[#e8ede8] pt-4">
        <div><p className="text-xs text-[#7b887f]">Available balance</p><p className="mt-1 text-lg font-semibold tabular-nums text-[#20392d]">{formatter.format(Number(account.availableBalance))}</p></div>
        <div><p className="text-xs text-[#7b887f]">Current balance</p><p className="mt-1 text-lg font-semibold tabular-nums text-[#20392d]">{formatter.format(Number(account.currentBalance))}</p></div>
      </div>
      <Link href={`/transactions?accountId=${account.id}`} className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-[#28664e] hover:underline">View activity <ArrowUpRight size={15} aria-hidden="true" /></Link>
    </article>
  );
}