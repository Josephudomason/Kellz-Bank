import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { decryptPlaidAccessToken, fetchPlaidTransactions } from "@/lib/plaid";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
});

type PublicPlaidTransaction = {
  id: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  pending: boolean;
  category: string | null;
  account: { name: string; mask: string | null } | null;
};

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const today = new Date().toISOString().slice(0, 10);
    const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const dates = z.object({ startDate: dateSchema, endDate: dateSchema }).safeParse({
      startDate: request.nextUrl.searchParams.get("startDate") || defaultStart,
      endDate: request.nextUrl.searchParams.get("endDate") || today,
    });
    if (!dates.success || dates.data.startDate > dates.data.endDate || dates.data.endDate > today) {
      return NextResponse.json({ error: "Invalid transaction date range." }, { status: 400 });
    }

    const items = await getPrisma().plaidItem.findMany({
      where: { userId: user.id },
      select: { id: true, accessTokenCiphertext: true, accounts: { select: { plaidAccountId: true, name: true, mask: true } } },
    });

    const transactions: PublicPlaidTransaction[] = [];
    for (const item of items) {
      const token = decryptPlaidAccessToken(item.accessTokenCiphertext);
      const accountMap = new Map(item.accounts.map((account) => [account.plaidAccountId, account]));
      const records = await fetchPlaidTransactions(token, dates.data.startDate, dates.data.endDate);
      for (const record of records) {
        const account = accountMap.get(record.account_id);
        transactions.push({
          id: record.transaction_id,
          description: record.name,
          amount: record.amount,
          currency: record.iso_currency_code ?? "USD",
          date: record.date,
          pending: record.pending,
          category: record.category?.[0] ?? null,
          account: account ? { name: account.name, mask: account.mask } : null,
        });
      }
    }

    transactions.sort((left, right) => right.date.localeCompare(left.date));
    return NextResponse.json({ data: transactions });
  } catch {
    return NextResponse.json({ error: "Connected bank transactions are temporarily unavailable." }, { status: 503 });
  }
}