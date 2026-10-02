import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const accounts = await getPrisma().account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        numberLast4: true,
        currency: true,
        availableBalance: true,
        currentBalance: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: accounts });
  } catch {
    return NextResponse.json(
      { error: "Accounts are temporarily unavailable." },
      { status: 503 },
    );
  }
}

const createAccountSchema = z.object({
  name: z.string().trim().min(2).max(60),
  type: z.enum(["CHECKING", "SAVINGS"]),
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = createAccountSchema.safeParse(payload);
  if (!result.success) return NextResponse.json({ error: "Provide a valid account name and type." }, { status: 400 });

  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const existing = await getPrisma().account.findFirst({
      where: { userId: user.id, name: result.data.name },
      select: { id: true },
    });
    if (existing) return NextResponse.json({ error: "You already have an account with that name." }, { status: 409 });

    const account = await getPrisma().account.create({
      data: {
        userId: user.id,
        name: result.data.name,
        type: result.data.type,
        numberLast4: String(randomInt(1000, 10000)),
      },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        numberLast4: true,
        currency: true,
        currentBalance: true,
        availableBalance: true,
      },
    });

    return NextResponse.json({ data: account }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Account could not be created." }, { status: 503 });
  }
}
