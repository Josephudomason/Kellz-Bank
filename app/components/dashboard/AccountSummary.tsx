import Link from "next/link";
import { ArrowUpRight, Landmark } from "lucide-react";

type AccountSummaryItem = {
  id: string;
  name: string;
  type: string;
  numberLast4: string;
  currency: string;
  availableBalance: { toString(): string };
};

export default function AccountSummary({ accounts }: { accounts: AccountSummaryItem[] }) {
  return (
    <section aria-labelledby="accounts-heading">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="accounts-heading" className="text-base font-semibold text-[#20392d]">Your accounts</h2>
        <Link href="/accounts" className="inline-flex items-center gap-1 text-sm font-medium text-[#28664e] hover:underline">All accounts <ArrowUpRight size={15} aria-hidden="true" /></Link>
      </div>
      {accounts.length === 0 ? (
        <div className="border-y border-[#e1e8e1] py-8 text-center">
          <Landmark className="mx-auto text-[#75857a]" size={22} aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-[#344b3e]">No accounts yet</p>
          <p className="mt-1 text-sm text-[#758279]">Accounts will appear here once they are set up.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[#e7ece7] border-y border-[#e7ece7]">
          {accounts.map((account) => (
            <li key={account.id} className="flex items-center justify-between gap-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#edf3ee] text-[#35614a]"><Landmark size={18} aria-hidden="true" /></span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#273e32]">{account.name}</p>
                  <p className="mt-0.5 text-xs text-[#7a887f]">{account.type.toLowerCase()} ···· {account.numberLast4}</p>
                </div>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-[#223b2f]">{new Intl.NumberFormat("en-US", { style: "currency", currency: account.currency }).format(Number(account.availableBalance))}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}