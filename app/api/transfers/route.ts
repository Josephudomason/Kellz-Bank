import { NextResponse } from "next/server";
import { AccountStatus, Prisma, TransactionStatus, TransactionType, TransferStatus } from "@prisma/client";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

const transferSchema = z
  .object({
    fromAccountId: z.string().uuid(),
    toAccountId: z.string().uuid().optional(),
    recipientName: z.string().trim().min(1).max(100).optional(),
    recipientEmail: z.string().trim().email().max(254).optional(),
    amount: z
      .string()
      .regex(/^\d{1,8}(?:\.\d{1,2})?$/, "Enter an amount with up to two decimal places.")
      .transform(Number),
    description: z.string().trim().max(140).optional(),
  })
  .refine((value) => value.toAccountId || value.recipientName, {
    path: ["recipientName"],
    message: "Choose an account or enter a recipient name.",
  })
  .refine((value) => value.amount > 0, {
    path: ["amount"],
    message: "Enter an amount greater than zero.",
  });

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = transferSchema.safeParse(payload);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid transfer details." }, { status: 400 });
  }

  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { fromAccountId, toAccountId, recipientName, recipientEmail, description } = result.data;
    const amount = new Prisma.Decimal(result.data.amount.toFixed(2));
    const prisma = getPrisma();

    if (toAccountId && toAccountId === fromAccountId) {
      return NextResponse.json({ error: "Choose a different destination account." }, { status: 400 });
    }

    const transfer = await prisma.$transaction(
      async (transaction) => {
        const source = await transaction.account.findFirst({
          where: { id: fromAccountId, userId: user.id, status: AccountStatus.ACTIVE },
          select: { id: true, currency: true, availableBalance: true },
        });
        if (!source) {
          throw new Error("SOURCE_ACCOUNT_UNAVAILABLE");
        }

        const destination = toAccountId
          ? await transaction.account.findFirst({
            where: { id: toAccountId, userId: user.id, status: AccountStatus.ACTIVE },
            select: { id: true, name: true, currency: true },
          })
          : null;

        if (toAccountId && !destination) {
          throw new Error("DESTINATION_ACCOUNT_UNAVAILABLE");
        }
        if (destination && destination.currency !== source.currency) {
          throw new Error("CURRENCY_MISMATCH");
        }

        const isInternal = destination !== null;
        let fundsReserved = source.availableBalance.gte(amount);
        if (fundsReserved) {
          const debit = await transaction.account.updateMany({
            where: {
              id: source.id,
              userId: user.id,
              status: AccountStatus.ACTIVE,
              availableBalance: { gte: amount },
            },
            data: {
              availableBalance: { decrement: amount },
              currentBalance: { decrement: amount },
            },
          });
          fundsReserved = debit.count === 1;
        }

        if (!fundsReserved && isInternal) {
          throw new Error("INSUFFICIENT_FUNDS");
        }

        if (!fundsReserved) {
          const activeSource = await transaction.account.findFirst({
            where: { id: source.id, userId: user.id, status: AccountStatus.ACTIVE },
            select: { id: true },
          });
          if (!activeSource) throw new Error("SOURCE_ACCOUNT_UNAVAILABLE");
        }

        if (destination) {
          await transaction.account.update({
            where: { id: destination.id },
            data: {
              availableBalance: { increment: amount },
              currentBalance: { increment: amount },
            },
          });
        }

        const transfer = await transaction.transfer.create({
          data: {
            userId: user.id,
            fromAccountId: source.id,
            toAccountId: destination?.id,
            recipientName: destination?.name ?? recipientName,
            recipientEmail,
            description,
            amount,
            currency: source.currency,
            status: isInternal ? TransferStatus.COMPLETED : TransferStatus.PENDING,
            fundsReserved,
          },
        });

        await transaction.transaction.create({
          data: {
            userId: user.id,
            accountId: source.id,
            transferId: transfer.id,
            description: description || `Transfer to ${destination?.name ?? recipientName}`,
            category: "Transfer",
            type: TransactionType.TRANSFER,
            status: isInternal ? TransactionStatus.COMPLETED : TransactionStatus.PENDING,
            amount: amount.negated(),
            currency: source.currency,
          },
        });

        if (destination) {
          await transaction.transaction.create({
            data: {
              userId: user.id,
              accountId: destination.id,
              transferId: transfer.id,
              description: description || `Transfer from ${destination.name}`,
              category: "Transfer",
              type: TransactionType.TRANSFER,
              status: TransactionStatus.COMPLETED,
              amount,
              currency: source.currency,
            },
          });
        }

        return transfer;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return NextResponse.json(
      {
        data: transfer,
        message:
          transfer.status === TransferStatus.PENDING
            ? transfer.fundsReserved
              ? "Pending transfer created. Funds are reserved; no real money was sent."
              : "Pending transfer added to history. It is awaiting available funds; no balance was changed."
            : "Transfer completed between your accounts.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      const errors: Record<string, { message: string; status: number }> = {
        SOURCE_ACCOUNT_UNAVAILABLE: { message: "Source account not found or unavailable.", status: 404 },
        DESTINATION_ACCOUNT_UNAVAILABLE: { message: "Destination account not found or unavailable.", status: 404 },
        CURRENCY_MISMATCH: { message: "Accounts must use the same currency.", status: 400 },
        INSUFFICIENT_FUNDS: { message: "Insufficient available balance.", status: 409 },
      };
      const knownError = errors[error.message];
      if (knownError) {
        return NextResponse.json({ error: knownError.message }, { status: knownError.status });
      }
    }

    return NextResponse.json(
      { error: "Transfer could not be completed." },
      { status: 503 },
    );
  }
}
