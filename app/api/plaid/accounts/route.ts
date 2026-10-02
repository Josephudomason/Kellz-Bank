import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { decryptPlaidAccessToken, fetchPlaidAccounts, persistPlaidAccounts } from "@/lib/plaid";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const accounts = await getPrisma().externalAccount.findMany({
      where: { plaidItem: { userId: user.id } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        officialName: true,
        mask: true,
        type: true,
        subtype: true,
        currentBalance: true,
        availableBalance: true,
        currency: true,
        updatedAt: true,
        plaidItem: { select: { institutionName: true } },
      },
    });

    return NextResponse.json({ data: accounts });
  } catch {
    return NextResponse.json({ error: "Connected accounts are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const prisma = getPrisma();
    const items = await prisma.plaidItem.findMany({
      where: { userId: user.id },
      select: { id: true, accessTokenCiphertext: true },
    });

    for (const item of items) {
      const token = decryptPlaidAccessToken(item.accessTokenCiphertext);
      const accounts = await fetchPlaidAccounts(token);
      await persistPlaidAccounts(item.id, accounts);
    }

    return NextResponse.json({ data: { syncedItems: items.length } });
  } catch {
    return NextResponse.json({ error: "Bank balances could not be refreshed." }, { status: 503 });
  }
}