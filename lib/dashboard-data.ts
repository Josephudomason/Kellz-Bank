import "server-only";
import { getPrisma } from "@/lib/db";

export async function getDashboardData(userId: string) {
  const prisma = getPrisma();
  const now = new Date();
  const firstMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

  const [accounts, recentTransactions, recentTransfers, activity, externalAccounts] = await Promise.all([
    prisma.account.findMany({
      where: { userId, status: { not: "CLOSED" } },
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
      },
    }),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { occurredAt: "desc" },
      take: 6,
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
    prisma.transfer.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true,
        recipientName: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        occurredAt: { gte: firstMonth },
        status: "COMPLETED",
        type: { in: ["INCOME", "EXPENSE"] },
      },
      select: { amount: true, type: true, occurredAt: true },
    }),
    prisma.externalAccount.findMany({
      where: { plaidItem: { userId } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, mask: true, type: true, currency: true, currentBalance: true, plaidItem: { select: { institutionName: true } } },
    }),
  ]);

  const monthlyActivity = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1));
    const rows = activity.filter(
      (row) =>
        row.occurredAt.getUTCFullYear() === monthDate.getUTCFullYear() &&
        row.occurredAt.getUTCMonth() === monthDate.getUTCMonth(),
    );

    return {
      month: monthDate.toLocaleString("en-US", { month: "short", timeZone: "UTC" }),
      income: rows.filter((row) => row.type === "INCOME").reduce((sum, row) => sum + Number(row.amount), 0),
      spending: rows.filter((row) => row.type === "EXPENSE").reduce((sum, row) => sum + Math.abs(Number(row.amount)), 0),
    };
  });

  return { accounts, recentTransactions, recentTransfers, monthlyActivity, externalAccounts };
}