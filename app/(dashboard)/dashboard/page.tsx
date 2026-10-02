import Link from "next/link";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpRight, Landmark, Plus } from "lucide-react";
import AccountSummary from "@/app/components/dashboard/AccountSummary";
import BalanceCard from "@/app/components/dashboard/BalanceCard";
import RecentTransactions from "@/app/components/dashboard/RecentTransactions";
import SpendingChart from "@/app/components/dashboard/SpendingChartLazy";
import MotionReveal from "@/components/motion/MotionReveal";
import { getDashboardData } from "@/lib/dashboard-data";
import { getAuthenticatedUser } from "@/lib/auth";

const quickActions = [
  { href: "/transfers", label: "Send money", icon: ArrowUpRight },
  { href: "/transfers", label: "Move between accounts", icon: ArrowLeftRight },
  { href: "/accounts", label: "View accounts", icon: Landmark },
  { href: "/transactions", label: "Activity", icon: ArrowDownToLine },
];

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <h1 className="text-2xl font-semibold text-[#20392d]">Your banking session has ended</h1>
        <p className="mt-2 text-sm text-[#718078]">Sign in again to continue.</p>
        <Link href="/login" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#123b32] px-5 text-sm font-semibold text-white">Sign in</Link>
      </div>
    );
  }

  let data;
  try {
    data = await getDashboardData(user.id);
  } catch {
    return (
      <div className="mx-auto max-w-2xl border-l-4 border-[#d5845b] bg-white px-6 py-7">
        <p className="text-xs font-semibold uppercase text-[#9a5b39]">Banking data unavailable</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#20392d]">Connect your database to continue</h1>
        <p className="mt-3 text-sm leading-6 text-[#718078]">The banking workspace is ready, but its PostgreSQL connection is not configured. Add the Supabase connection values from <code>.env.example</code> to your local environment, then apply the Prisma schema.</p>
      </div>
    );
  }

  const currencies = new Set(data.accounts.map((account) => account.currency));
  const currency = currencies.size === 1 ? data.accounts[0]?.currency ?? "USD" : "USD";
  const balance = currencies.size > 1 ? null : data.accounts.reduce((total, account) => total + Number(account.currentBalance), 0);
  const availableBalance = currencies.size > 1
    ? "Available balances are shown per account"
    : `Available ${new Intl.NumberFormat("en-US", { style: "currency", currency }).format(data.accounts.reduce((total, account) => total + Number(account.availableBalance), 0))}`;

  return (
    <div className="space-y-9">
      <MotionReveal delay={0.04}>
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-[#46785b]">Account overview</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1d352a]">Your money, at a glance</h1>
            <p className="mt-2 text-sm text-[#758279]">A live view of your Kellz accounts and activity.</p>
          </div>
          <Link href="/transfers" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#123b32] px-4 text-sm font-semibold text-white transition hover:bg-[#1b5143] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257]"><Plus size={17} aria-hidden="true" /> Send money</Link>
        </div>
      </MotionReveal>

      <MotionReveal delay={0.08}>
        <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]" aria-label="Balances and quick actions">
          <div className="flex min-h-[228px] flex-col justify-between gap-6 rounded-lg bg-[#123b32] p-6 sm:p-8">
            <BalanceCard title="Total current balance" amount={balance} currency={currency} caption={availableBalance} />
            <p className="text-xs text-white/55">Balances are from your configured database accounts.</p>
          </div>
          <div className="py-1">
            <h2 className="mb-3 text-sm font-semibold text-[#2b4336]">Quick actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map(({ href, label, icon: Icon }) => (
                <Link key={label} href={href} className="flex min-h-[84px] flex-col justify-between rounded-lg border border-[#dfe7df] bg-white p-3.5 text-sm font-medium text-[#344b3e] transition hover:border-[#9bb9a3] hover:bg-[#fbfdfb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257]"><Icon size={19} className="text-[#397653]" aria-hidden="true" /><span>{label}</span></Link>
              ))}
            </div>
          </div>
        </section>
      </MotionReveal>

      <MotionReveal delay={0.12}>
        <section className="grid gap-9 xl:grid-cols-[0.9fr_1.1fr]">
          <AccountSummary accounts={data.accounts} />
          <SpendingChart data={data.monthlyActivity} />
        </section>
      </MotionReveal>

      <MotionReveal delay={0.16}>
        <section aria-labelledby="connected-banks-heading">
          <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-medium text-[#46785b]">Plaid</p><h2 id="connected-banks-heading" className="mt-1 text-lg font-semibold text-[#20392d]">Connected external accounts</h2></div><Link href="/accounts" className="text-sm font-medium text-[#28664e] hover:underline">Manage connections</Link></div>
          {data.externalAccounts.length === 0 ? <p className="border-y border-[#e1e8e1] py-5 text-sm text-[#758279]">No external bank connections yet. Connect a Sandbox institution from Accounts.</p> : <ul className="divide-y divide-[#e7ece7] border-y border-[#e7ece7]">{data.externalAccounts.map((account) => <li key={account.id} className="flex items-center justify-between gap-4 py-3.5"><div className="min-w-0"><p className="truncate text-sm font-medium text-[#293f33]">{account.name}{account.mask ? ` ···· ${account.mask}` : ""}</p><p className="mt-1 text-xs text-[#7b887f]">{account.plaidItem.institutionName || "Connected institution"} · {account.type}</p></div><p className="shrink-0 text-sm font-semibold tabular-nums text-[#293f33]">{account.currentBalance === null ? "Unavailable" : new Intl.NumberFormat("en-US", { style: "currency", currency: account.currency }).format(Number(account.currentBalance))}</p></li>)}</ul>}
        </section>
      </MotionReveal>

      <MotionReveal delay={0.2}>
        <section className="grid gap-9 xl:grid-cols-[1.15fr_0.85fr]">
          <RecentTransactions transactions={data.recentTransactions} />
          <section aria-labelledby="recent-transfers-heading">
            <div className="mb-4 flex items-center justify-between"><h2 id="recent-transfers-heading" className="text-base font-semibold text-[#20392d]">Recent transfers</h2><Link href="/transfers" className="text-sm font-medium text-[#28664e] hover:underline">Transfer history</Link></div>
            {data.recentTransfers.length === 0 ? (
              <div className="border-y border-[#e1e8e1] py-8 text-center"><ArrowLeftRight className="mx-auto text-[#75857a]" size={22} aria-hidden="true" /><p className="mt-3 text-sm font-medium text-[#344b3e]">No transfers yet</p><p className="mt-1 text-sm text-[#758279]">Transfers you create will appear here.</p></div>
            ) : (
              <ul className="divide-y divide-[#e7ece7] border-y border-[#e7ece7]">
                {data.recentTransfers.map((transfer) => (
                  <li key={transfer.id} className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0"><p className="truncate text-sm font-medium text-[#293f33]">{transfer.recipientName || "Account transfer"}</p><p className="mt-1 text-xs text-[#7b887f]">{transfer.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {transfer.status.toLowerCase()}</p></div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-[#293f33]">{new Intl.NumberFormat("en-US", { style: "currency", currency: transfer.currency }).format(Number(transfer.amount))}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>
      </MotionReveal>
      <p className="border-t border-[#e1e8e1] pt-5 text-xs leading-5 text-[#7b887f]">Demo environment: account balances and transfers are for portfolio development and do not represent real funds.</p>
    </div>
  );
}