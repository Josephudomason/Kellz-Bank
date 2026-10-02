import { CardStatus } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

const statusSchema = z.object({ status: z.enum(["ACTIVE", "FROZEN"]) });

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: { params: Promise<{ cardId: string }> }) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = statusSchema.safeParse(payload);
  if (!result.success) return NextResponse.json({ error: "Invalid card status." }, { status: 400 });

  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const { cardId } = await context.params;
    if (!z.string().uuid().safeParse(cardId).success) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }

    const updated = await getPrisma().card.updateMany({
      where: { id: cardId, userId: user.id, status: { in: [CardStatus.ACTIVE, CardStatus.FROZEN] } },
      data: { status: result.data.status },
    });

    if (updated.count !== 1) return NextResponse.json({ error: "Card not found." }, { status: 404 });
    return NextResponse.json({ data: { status: result.data.status } });
  } catch {
    return NextResponse.json({ error: "Card settings are temporarily unavailable." }, { status: 503 });
  }
}