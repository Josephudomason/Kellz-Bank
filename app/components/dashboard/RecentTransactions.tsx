import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, ReceiptText } from "lucide-react";

type RecentTransaction = {
  id: string;
  description: string;
  category: string | null;
  type: string;
  status: string;
  amount: { toString(): string };
  currency: string;
  occurredAt: Date;
};

export default function RecentTransactions({ transactions }: { transactions: RecentTransaction[] }) {
  return (
    <section aria-labelledby="recent-transactions-heading">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="recent-transactions-heading" className="text-base font-semibold text-[#20392d]">Recent activity</h2>
        <Link href="/transactions" className="text-sm font-medium text-[#28664e] hover:underline">See all</Link>
      </div>
      {transactions.length === 0 ? (
        <div className="border-y border-[#e1e8e1] py-8 text-center">
          <ReceiptText className="mx-auto text-[#75857a]" size={22} aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-[#344b3e]">No transactions yet</p>
          <p className="mt-1 text-sm text-[#758279]">Your account activity will show here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[#e7ece7] border-y border-[#e7ece7]">
          {transactions.map((transaction) => {
            const incoming = transaction.type === "INCOME" || Number(transaction.amount) > 0;
            return (
              <li key={transaction.id} className="flex items-center justify-between gap-4 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full ${incoming ? "bg-[#e8f4eb] text-[#2f7750]" : "bg-[#f7eee8] text-[#a45d40]"}`}>{incoming ? <ArrowDownLeft size={17} aria-hidden="true" /> : <ArrowUpRight size={17} aria-hidden="true" />}</span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#283c31]">{transaction.description}</p>
                    <p className="mt-0.5 text-xs text-[#7b887f]">{transaction.category || "General"} · {transaction.occurredAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-[#263c31]">{incoming ? "+" : "−"}{new Intl.NumberFormat("en-US", { style: "currency", currency: transaction.currency }).format(Math.abs(Number(transaction.amount)))}</p>
                  <p className="mt-0.5 text-xs text-[#7b887f]">{transaction.status.toLowerCase()}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}