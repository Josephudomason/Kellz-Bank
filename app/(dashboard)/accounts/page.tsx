import { Landmark } from "lucide-react";
import AccountCard from "@/app/components/accounts/AccountCard";
import { getPrisma } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { PlaidLinkButton, SyncPlaidButton } from "@/components/plaid/PlaidControls";
import AccountCreationForm from "@/components/forms/AccountCreationForm";

export default async function AccountsPage() {
  const user = await getAuthenticatedUser();
  if (!user) return null;

  let accounts;
  let externalAccounts;
  try {
    const prisma = getPrisma();
    [accounts, externalAccounts] = await Promise.all([prisma.account.findMany({
      where: { userId: user.id },
      orderBy: [{ type: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        numberLast4: true,
        currency: true,
        availableBalance: true,
        currentBalance: true,
      },
    }), prisma.externalAccount.findMany({
      where: { plaidItem: { userId: user.id } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, type: true, subtype: true, mask: true, currency: true, currentBalance: true, availableBalance: true, plaidItem: { select: { institutionName: true } } },
    })]);
  } catch {
    return (
      <section className="border-l-4 border-[#d5845b] bg-white px-6 py-7">
        <p className="text-xs font-semibold uppercase text-[#9a5b39]">Accounts unavailable</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#20392d]">Connect your database</h1>
        <p className="mt-3 text-sm leading-6 text-[#718078]">Configure the Supabase PostgreSQL connection in your local environment before loading account data.</p>
      </section>
    );
  }

  return (
    <div className="space-y-7">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-[#46785b]">Accounts</p><h1 className="mt-2 text-3xl font-semibold text-[#1d352a]">Your accounts</h1><p className="mt-2 text-sm text-[#758279]">Balances and masked account details from your banking profile.</p></div><div className="flex flex-wrap items-center gap-2"><AccountCreationForm /><SyncPlaidButton /><PlaidLinkButton /></div></header>
      {accounts.length === 0 ? (
        <div className="border-y border-[#e1e8e1] py-14 text-center"><Landmark className="mx-auto text-[#75857a]" size={25} aria-hidden="true" /><h2 className="mt-4 font-semibold text-[#344b3e]">No accounts found</h2><p className="mt-2 text-sm text-[#758279]">Accounts appear here after they are created for your profile.</p></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">{accounts.map((account) => <AccountCard key={account.id} account={account} />)}</div>
      )}
      <section aria-labelledby="connected-accounts-heading" className="space-y-4">
        <div><p className="text-sm font-medium text-[#46785b]">External connections</p><h2 id="connected-accounts-heading" className="mt-1 text-xl font-semibold text-[#20392d]">Connected bank accounts</h2></div>
        {externalAccounts.length === 0 ? <p className="border-y border-[#e1e8e1] py-5 text-sm text-[#758279]">No external accounts connected yet. Connect a Plaid Sandbox institution to see balances here.</p> : <ul className="divide-y divide-[#e7ece7] border-y border-[#e7ece7]">{externalAccounts.map((account) => <li key={account.id} className="flex items-center justify-between gap-4 py-4"><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#293f33]">{account.name}</p><p className="mt-1 text-xs text-[#7b887f]">{account.plaidItem.institutionName || "Connected institution"} · {account.type}{account.subtype ? ` / ${account.subtype}` : ""}{account.mask ? ` ···· ${account.mask}` : ""}</p></div><div className="shrink-0 text-right"><p className="text-sm font-semibold tabular-nums text-[#293f33]">{account.currentBalance === null ? "Unavailable" : new Intl.NumberFormat("en-US", { style: "currency", currency: account.currency }).format(Number(account.currentBalance))}</p><p className="mt-1 text-xs text-[#7b887f]">Current balance</p></div></li>)}</ul>}
      </section>
      <p className="text-xs leading-5 text-[#7b887f]">Account numbers are masked. This development app does not hold real deposits.</p>
    </div>
  );
}