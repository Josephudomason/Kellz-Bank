import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PlaidActivity } from "@/components/plaid/PlaidControls";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

type PageSearchParams = Promise<{
  search?: string;
  status?: string;
  type?: string;
  accountId?: string;
  sort?: string;
  page?: string;
}>;

const validStatuses = ["COMPLETED", "PENDING", "FAILED"] as const;
const validTypes = ["INCOME", "EXPENSE", "TRANSFER"] as const;
const orderOptions = {
  newest: { occurredAt: "desc" },
  oldest: { occurredAt: "asc" },
  amount_high: { amount: "desc" },
  amount_low: { amount: "asc" },
} as const;

function statusVariant(status: string) {
  if (status === "COMPLETED") return "success";
  if (status === "PENDING") return "pending";
  return "destructive";
}

export default async function TransactionsPage({ searchParams }: { searchParams: PageSearchParams }) {
  const params = await searchParams;
  const user = await getAuthenticatedUser();
  if (!user) return null;

  const search = params.search?.trim().slice(0, 100) ?? "";
  const status = validStatuses.find((item) => item === params.status);
  const type = validTypes.find((item) => item === params.type);
  const accountId = params.accountId && /^[0-9a-f-]{36}$/i.test(params.accountId) ? params.accountId : undefined;
  const sort = params.sort && params.sort in orderOptions ? (params.sort as keyof typeof orderOptions) : "newest";
  const page = Math.max(1, Math.min(Number.parseInt(params.page ?? "1", 10) || 1, 10000));
  const pageSize = 20;

  let accounts;
  let transactions;
  let total;
  try {
    const prisma = getPrisma();
    accounts = await prisma.account.findMany({ where: { userId: user.id }, select: { id: true, name: true } });
    const where = {
      userId: user.id,
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(accountId ? { accountId } : {}),
      ...(search ? { OR: [{ description: { contains: search, mode: "insensitive" as const } }, { category: { contains: search, mode: "insensitive" as const } }] } : {}),
    };
    [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: orderOptions[sort],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          description: true,
          category: true,
          type: true,
          status: true,
          amount: true,
          currency: true,
          occurredAt: true,
          account: { select: { name: true, numberLast4: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);
  } catch {
    return (
      <section className="border-l-4 border-[#d5845b] bg-white px-6 py-7">
        <p className="text-xs font-semibold uppercase text-[#9a5b39]">Transactions unavailable</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#20392d]">Connect your database</h1>
        <p className="mt-3 text-sm leading-6 text-[#718078]">Configure the Supabase PostgreSQL connection before loading transaction history.</p>
      </section>
    );
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const hrefForPage = (targetPage: number) => {
    const next = new URLSearchParams();
    if (search) next.set("search", search);
    if (status) next.set("status", status);
    if (type) next.set("type", type);
    if (accountId) next.set("accountId", accountId);
    if (sort !== "newest") next.set("sort", sort);
    next.set("page", String(targetPage));
    return `/transactions?${next.toString()}`;
  };

  return (
    <div className="space-y-7">
      <header><p className="text-sm font-medium text-[#46785b]">Activity</p><h1 className="mt-2 text-3xl font-semibold text-[#1d352a]">Transactions</h1><p className="mt-2 text-sm text-[#758279]">Search and review account activity.</p></header>
      <form method="get" className="grid gap-3 rounded-lg border border-[#dfe7df] bg-white p-4 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_160px_160px_190px_160px_auto] xl:items-end">
        <label className="block text-sm font-medium text-[#394e42]">Search
          <span className="relative mt-1.5 block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#87958b]" size={16} aria-hidden="true" /><input name="search" defaultValue={search} maxLength={100} placeholder="Description or category" className="h-10 w-full rounded-lg border border-[#d6ded8] bg-white pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257]" /></span>
        </label>
        <label className="block text-sm font-medium text-[#394e42]">Status<select name="status" defaultValue={status ?? ""} className="mt-1.5 h-10 w-full rounded-lg border border-[#d6ded8] bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257]"><option value="">All statuses</option><option value="COMPLETED">Completed</option><option value="PENDING">Pending</option><option value="FAILED">Failed</option></select></label>
        <label className="block text-sm font-medium text-[#394e42]">Type<select name="type" defaultValue={type ?? ""} className="mt-1.5 h-10 w-full rounded-lg border border-[#d6ded8] bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257]"><option value="">All types</option><option value="INCOME">Income</option><option value="EXPENSE">Expense</option><option value="TRANSFER">Transfer</option></select></label>
        <label className="block text-sm font-medium text-[#394e42]">Account<select name="accountId" defaultValue={accountId ?? ""} className="mt-1.5 h-10 w-full rounded-lg border border-[#d6ded8] bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257]"><option value="">All accounts</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
        <label className="block text-sm font-medium text-[#394e42]">Sort<select name="sort" defaultValue={sort} className="mt-1.5 h-10 w-full rounded-lg border border-[#d6ded8] bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257]"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="amount_high">Amount high</option><option value="amount_low">Amount low</option></select></label>
        <button type="submit" className="h-10 rounded-lg bg-[#123b32] px-4 text-sm font-semibold text-white hover:bg-[#1b5143] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257]">Apply</button>
      </form>

      <div className="overflow-hidden rounded-lg border border-[#dfe7df] bg-white">
        <div className="flex items-center justify-between border-b border-[#e6ece6] px-4 py-3 sm:px-5"><p className="text-sm font-medium text-[#344b3e]">{total} {total === 1 ? "transaction" : "transactions"}</p><p className="text-xs text-[#7b887f]">Page {page} of {pageCount}</p></div>
        {transactions.length === 0 ? (
          <div className="px-5 py-14 text-center"><h2 className="font-semibold text-[#344b3e]">No matching transactions</h2><p className="mt-2 text-sm text-[#758279]">Try changing your filters or search terms.</p><Link href="/transactions" className="mt-4 inline-flex text-sm font-semibold text-[#28664e] hover:underline">Clear filters</Link></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="bg-[#f7f9f7] text-xs text-[#718078]"><tr><th scope="col" className="px-5 py-3 font-medium">Description</th><th scope="col" className="px-5 py-3 font-medium">Account</th><th scope="col" className="px-5 py-3 font-medium">Date</th><th scope="col" className="px-5 py-3 font-medium">Type</th><th scope="col" className="px-5 py-3 font-medium">Status</th><th scope="col" className="px-5 py-3 text-right font-medium">Amount</th></tr></thead>
              <tbody className="divide-y divide-[#e9eee9]">
                {transactions.map((transaction) => {
                  const positive = transaction.type === "INCOME" || (transaction.type === "TRANSFER" && Number(transaction.amount) > 0);
                  return <tr key={transaction.id} className="hover:bg-[#fbfdfb]"><td className="px-5 py-4"><p className="font-medium text-[#263d31]">{transaction.description}</p><p className="mt-1 text-xs text-[#7b887f]">{transaction.category || "General"}</p></td><td className="px-5 py-4 text-[#53645a]">{transaction.account.name}<span className="ml-1 text-xs text-[#89968e]">···· {transaction.account.numberLast4}</span></td><td className="px-5 py-4 text-[#53645a]">{transaction.occurredAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td><td className="px-5 py-4 capitalize text-[#53645a]">{transaction.type.toLowerCase()}</td><td className="px-5 py-4"><Badge variant={statusVariant(transaction.status)}>{transaction.status.toLowerCase()}</Badge></td><td className={`px-5 py-4 text-right font-semibold tabular-nums ${positive ? "text-[#28664e]" : "text-[#283c31]"}`}>{positive ? "+" : ""}{new Intl.NumberFormat("en-US", { style: "currency", currency: transaction.currency }).format(Number(transaction.amount))}</td></tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {pageCount > 1 && <nav aria-label="Transaction pages" className="flex items-center justify-between"><Link aria-disabled={page <= 1} className={`rounded-lg border border-[#dfe7df] px-4 py-2 text-sm font-medium ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-white"}`} href={hrefForPage(Math.max(1, page - 1))}>Previous</Link><Link aria-disabled={page >= pageCount} className={`rounded-lg border border-[#dfe7df] px-4 py-2 text-sm font-medium ${page >= pageCount ? "pointer-events-none opacity-40" : "hover:bg-white"}`} href={hrefForPage(Math.min(pageCount, page + 1))}>Next</Link></nav>}
      <PlaidActivity />
    </div>
  );
}