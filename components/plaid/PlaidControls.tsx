"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type PlaidInstitution = { institution_id?: string; name?: string } | null;

declare global {
  interface Window {
    Plaid?: {
      create: (options: {
        token: string;
        onSuccess: (publicToken: string, metadata: { institution?: PlaidInstitution }) => void;
        onExit: () => void;
      }) => { open: () => void };
    };
  }
}

export function PlaidLinkButton() {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const [connecting, setConnecting] = useState(false);

  async function connectBank() {
    if (!scriptReady || !window.Plaid) {
      toast.error("Bank connection is still loading.");
      return;
    }

    setConnecting(true);
    try {
      const tokenResponse = await fetch("/api/plaid/create-link-token", { method: "POST" });
      const tokenResult = await tokenResponse.json();
      if (!tokenResponse.ok) throw new Error(tokenResult.error || "Unable to start bank connection.");

      window.Plaid.create({
        token: tokenResult.data.linkToken,
        onSuccess: async (publicToken, metadata) => {
          try {
            const response = await fetch("/api/plaid/exchange-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                publicToken,
                institutionId: metadata.institution?.institution_id,
                institutionName: metadata.institution?.name,
              }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Unable to save bank connection.");
            toast.success("Bank connected.");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to save bank connection.");
          } finally {
            setConnecting(false);
          }
        },
        onExit: () => setConnecting(false),
      }).open();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start bank connection.");
      setConnecting(false);
    }
  }

  return (
    <>
      <Script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js" strategy="afterInteractive" onLoad={() => setScriptReady(true)} onError={() => toast.error("Plaid Link could not be loaded.")} />
      <button type="button" onClick={connectBank} disabled={!scriptReady || connecting} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#123b32] px-3.5 text-sm font-semibold text-white hover:bg-[#1b5143] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257] disabled:opacity-50"><Link2 size={16} aria-hidden="true" />{connecting ? "Connecting…" : "Connect bank"}</button>
    </>
  );
}

export function SyncPlaidButton() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  async function syncAccounts() {
    setSyncing(true);
    try {
      const response = await fetch("/api/plaid/accounts", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to refresh balances.");
      toast.success("Connected bank balances refreshed.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to refresh balances.");
    } finally {
      setSyncing(false);
    }
  }

  return <button type="button" onClick={syncAccounts} disabled={syncing} aria-label="Refresh connected bank balances" title="Refresh balances" className="grid size-10 place-items-center rounded-lg border border-[#d6ded8] text-[#42574a] hover:bg-[#f3f7f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257] disabled:opacity-50"><RefreshCw size={17} className={syncing ? "animate-spin" : ""} aria-hidden="true" /></button>;
}

type PlaidTransaction = {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  pending: boolean;
  category: string | null;
  account: { name: string; mask: string | null } | null;
};

export function PlaidActivity() {
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/plaid/transactions", { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to load connected transactions.");
        setTransactions(result.data);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  if (failed || (!loading && transactions.length === 0)) return null;

  return (
    <section aria-labelledby="plaid-activity-heading" className="mt-9">
      <div className="mb-3"><h2 id="plaid-activity-heading" className="font-semibold text-[#20392d]">Connected bank activity</h2><p className="mt-1 text-xs text-[#7b887f]">Recent external transactions from Plaid</p></div>
      {loading ? <p className="border-y border-[#e1e8e1] py-6 text-sm text-[#758279]">Loading connected activity…</p> : <ul className="divide-y divide-[#e7ece7] border-y border-[#e7ece7]">{transactions.map((transaction) => <li key={transaction.id} className="flex items-center justify-between gap-4 py-3.5"><div className="min-w-0"><p className="truncate text-sm font-medium text-[#283c31]">{transaction.description}</p><p className="mt-1 text-xs text-[#7b887f]">{transaction.account?.name ?? "Connected account"}{transaction.account?.mask ? ` ···· ${transaction.account.mask}` : ""} · {transaction.category ?? "General"} · {transaction.date}</p></div><div className="shrink-0 text-right"><p className="text-sm font-semibold tabular-nums text-[#263c31]">{transaction.amount < 0 ? "+" : "−"}{new Intl.NumberFormat("en-US", { style: "currency", currency: transaction.currency }).format(Math.abs(transaction.amount))}</p><p className="mt-1 text-xs text-[#7b887f]">{transaction.pending ? "Pending" : "Posted"}</p></div></li>)}</ul>}
    </section>
  );
}