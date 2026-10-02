import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

const querySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(["COMPLETED", "PENDING", "FAILED"]).optional(),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]).optional(),
  accountId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const query = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );

  if (!query.success) {
    return NextResponse.json({ error: "Invalid transaction filters." }, { status: 400 });
  }

  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { search, status, type, accountId, page, pageSize } = query.data;
    const prisma = getPrisma();
    const where = {
      userId: user.id,
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(accountId ? { accountId } : {}),
      ...(search
        ? {
          OR: [
            { description: { contains: search, mode: "insensitive" as const } },
            { category: { contains: search, mode: "insensitive" as const } },
          ],
        }
        : {}),
    };

    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where,
        orderBy: { occurredAt: "desc" },
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
          account: { select: { id: true, name: true, numberLast4: true } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      data: transactions,
      pagination: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) },
    });
  } catch {
    return NextResponse.json(
      { error: "Transactions are temporarily unavailable." },
      { status: 503 },
    );
  }
}
