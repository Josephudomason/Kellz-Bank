This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Kellz Banking

Kellz is a development and portfolio banking application built with Next.js App Router, Supabase Auth, PostgreSQL, Prisma, and Plaid Sandbox. Balances and transfers are fictional ledger data. Transfers to another person remain pending; this app does not move real money.

## Requirements

- Node.js 20 or newer
- A Supabase project with PostgreSQL and the Supabase service-role key configured server-side
- Plaid Sandbox credentials for external bank-link flows

All UI, server, database, and integration packages are already declared in `package.json`.

## Local setup

1. Copy `.env.example` to `.env.local` and fill in the Supabase URL, publishable key, `DATABASE_URL`, and `DIRECT_URL` from your Supabase project. Use the connection pooler for `DATABASE_URL` if appropriate and the direct database connection for `DIRECT_URL`.
2. Set `NEXT_PUBLIC_APP_URL` to the origin used for local development. In the Supabase Auth URL configuration, allow `http://localhost:3000/auth/callback` (and the equivalent callback on your deployed development URL).
3. Generate a 32-byte base64 Plaid token-encryption key and add it as `PLAID_TOKEN_ENCRYPTION_KEY`. Configure the Plaid client ID and secret for Sandbox. The Plaid secret, Supabase service-role key, database URLs, and encryption key must never use a `NEXT_PUBLIC_` prefix.
4. Registration creates each user and signs them in immediately. The Auth callback remains configured for password recovery.
5. Generate the Prisma client and apply the checked-in migrations:

	```bash
	npm run db:generate
	npm run db:migrate
	```

6. Start the app with `npm run dev` and open [http://localhost:3000](http://localhost:3000). Users register and are signed in immediately.

Before using any values that were previously present in this repository's environment template, rotate them in Supabase and Plaid. Do not paste secrets into chat or commit `.env.local`.

## Database commands

- `npm run db:validate` validates the Prisma schema.
- `npm run db:generate` regenerates Prisma Client.
- `npm run db:migrate` applies development migrations to the configured PostgreSQL database.
- New members receive the same fictional opening balances: $8,802.77 in checking and $12,200.00 in savings.
- Signup uses the Supabase Admin API to mark newly registered email accounts as confirmed; keep the service-role key private and server-only.

The initial PostgreSQL migration is in `prisma/migrations`. The follow-up migration enables RLS policies for all user-owned and linked-account tables. Registration creates checking and savings accounts with identical fictional opening balances for every new member. Account ownership is scoped to the authenticated Supabase user in every banking query and mutation.

## Integration boundaries

- Supabase Auth owns passwords and sessions. Email confirmation and password recovery use `/auth/callback`.
- Prisma is server-only and connects with the installed PostgreSQL adapter.
- Plaid Link tokens and access tokens are handled on the server. Access tokens are encrypted with AES-256-GCM before persistence. Plaid operations require Sandbox credentials and `PLAID_TOKEN_ENCRYPTION_KEY`.
- External accounts and Plaid transactions are kept separate from Kellz ledger accounts. Only masked account details are sent to the browser.
- Internal transfers update both account balances and create transfer/transaction records in a serializable PostgreSQL transaction. External-recipient transfers are pending demo records; funds are reserved when available, otherwise they remain marked as awaiting funds. No payout rail is configured.
- Simulated cards store only type, last four digits, expiry, status, and spending limits. No PAN or CVV is collected or stored.

Do not use this project to hold real funds or sensitive production banking data without a full financial, legal, operational, and security review.

## Checks

```bash
npm run db:validate
npx tsc --noEmit
npm run lint
npm run build
```

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
