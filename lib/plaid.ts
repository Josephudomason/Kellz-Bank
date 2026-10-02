import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { Configuration, CountryCode, PlaidApi, PlaidEnvironments, Products, type Transaction } from "plaid";
import { getPrisma } from "@/lib/db";

function getPlaidClient() {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  const environment = process.env.PLAID_ENV || "sandbox";
  const basePath = {
    sandbox: PlaidEnvironments.sandbox,
    development: PlaidEnvironments.development,
    production: PlaidEnvironments.production,
  }[environment];

  if (!clientId || !secret || !basePath) {
    throw new Error("Plaid server configuration is invalid.");
  }

  return new PlaidApi(
    new Configuration({
      basePath,
      baseOptions: { headers: { "PLAID-CLIENT-ID": clientId, "PLAID-SECRET": secret } },
    }),
  );
}

function getEncryptionKey() {
  const configuredKey = process.env.PLAID_TOKEN_ENCRYPTION_KEY;
  if (!configuredKey) throw new Error("Plaid token encryption is not configured.");

  const key = Buffer.from(configuredKey, "base64");
  if (key.length !== 32) throw new Error("Plaid token encryption key must be 32 bytes.");
  return key;
}

export async function createPlaidLinkToken(userId: string) {
  const response = await getPlaidClient().linkTokenCreate({
    user: { client_user_id: userId },
    client_name: "Kellz Banking",
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: "en",
  });

  return response.data.link_token;
}

export async function exchangePlaidPublicToken(publicToken: string) {
  const response = await getPlaidClient().itemPublicTokenExchange({ public_token: publicToken });
  return { accessToken: response.data.access_token, itemId: response.data.item_id };
}

export async function fetchPlaidAccounts(accessToken: string) {
  const response = await getPlaidClient().accountsGet({ access_token: accessToken });
  return response.data.accounts;
}

export async function persistPlaidAccounts(
  plaidItemId: string,
  accounts: Awaited<ReturnType<typeof fetchPlaidAccounts>>,
) {
  const prisma = getPrisma();
  await prisma.$transaction(async (transaction) => {
    await upsertPlaidAccounts(transaction, plaidItemId, accounts);
  });
}

async function upsertPlaidAccounts(
  transaction: Prisma.TransactionClient,
  plaidItemId: string,
  accounts: Awaited<ReturnType<typeof fetchPlaidAccounts>>,
) {
  for (const account of accounts) {
    await transaction.externalAccount.upsert({
      where: { plaidAccountId: account.account_id },
      update: {
        plaidItemId,
        name: account.name,
        officialName: account.official_name ?? null,
        mask: account.mask ?? null,
        type: account.type,
        subtype: account.subtype ?? null,
        currentBalance: account.balances.current === null ? null : new Prisma.Decimal(account.balances.current.toString()),
        availableBalance: account.balances.available === null ? null : new Prisma.Decimal(account.balances.available.toString()),
        currency: account.balances.iso_currency_code ?? "USD",
      },
      create: {
        plaidItemId,
        plaidAccountId: account.account_id,
        name: account.name,
        officialName: account.official_name ?? null,
        mask: account.mask ?? null,
        type: account.type,
        subtype: account.subtype ?? null,
        currentBalance: account.balances.current === null ? null : new Prisma.Decimal(account.balances.current.toString()),
        availableBalance: account.balances.available === null ? null : new Prisma.Decimal(account.balances.available.toString()),
        currency: account.balances.iso_currency_code ?? "USD",
      },
    });
  }

  const accountIds = accounts.map((account) => account.account_id);
  await transaction.externalAccount.deleteMany({
    where: accountIds.length > 0
      ? { plaidItemId, plaidAccountId: { notIn: accountIds } }
      : { plaidItemId },
  });
}

export async function savePlaidConnection(input: {
  userId: string;
  itemId: string;
  accessToken: string;
  institutionId?: string;
  institutionName?: string;
  accounts: Awaited<ReturnType<typeof fetchPlaidAccounts>>;
}) {
  const prisma = getPrisma();
  return prisma.$transaction(async (transaction) => {
    const item = await transaction.plaidItem.upsert({
      where: { itemId: input.itemId },
      update: {
        accessTokenCiphertext: encryptPlaidAccessToken(input.accessToken),
        institutionId: input.institutionId,
        institutionName: input.institutionName,
      },
      create: {
        userId: input.userId,
        itemId: input.itemId,
        accessTokenCiphertext: encryptPlaidAccessToken(input.accessToken),
        institutionId: input.institutionId,
        institutionName: input.institutionName,
      },
    });

    await upsertPlaidAccounts(transaction, item.id, input.accounts);
    return item;
  });
}

export async function fetchPlaidTransactions(
  accessToken: string,
  startDate: string,
  endDate: string,
) {
  const client = getPlaidClient();
  const transactions: Transaction[] = [];
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;

  while (offset < total) {
    const response = await client.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      options: { count: 100, offset },
    });
    transactions.push(...response.data.transactions);
    total = response.data.total_transactions;
    offset += response.data.transactions.length;
    if (response.data.transactions.length === 0) break;
  }

  return transactions;
}

export function encryptPlaidAccessToken(accessToken: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(accessToken, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext].map((part) => part.toString("base64")).join(".");
}

export function decryptPlaidAccessToken(encryptedToken: string) {
  const [encodedIv, encodedTag, encodedCiphertext] = encryptedToken.split(".");
  if (!encodedIv || !encodedTag || !encodedCiphertext) {
    throw new Error("Stored Plaid token is invalid.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(encodedIv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(encodedTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}