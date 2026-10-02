import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { exchangePlaidPublicToken, fetchPlaidAccounts, savePlaidConnection } from "@/lib/plaid";

const exchangeSchema = z.object({
  publicToken: z.string().min(1).max(2048),
  institutionId: z.string().max(100).optional(),
  institutionName: z.string().max(200).optional(),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = exchangeSchema.safeParse(payload);
  if (!result.success) return NextResponse.json({ error: "Invalid bank connection." }, { status: 400 });

  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const plaid = await exchangePlaidPublicToken(result.data.publicToken);
    const accounts = await fetchPlaidAccounts(plaid.accessToken);
    const prisma = getPrisma();
    const existingItem = await prisma.plaidItem.findUnique({ where: { itemId: plaid.itemId }, select: { userId: true } });
    if (existingItem && existingItem.userId !== user.id) {
      return NextResponse.json({ error: "This bank connection is already linked." }, { status: 409 });
    }

    const item = await savePlaidConnection({
      userId: user.id,
      itemId: plaid.itemId,
      accessToken: plaid.accessToken,
      institutionId: result.data.institutionId,
      institutionName: result.data.institutionName,
      accounts,
    });

    return NextResponse.json({ data: { connected: true, institution: item.institutionName, accountCount: accounts.length } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to finish connecting this bank." }, { status: 503 });
  }
}