# Kellz Bank

Kellz Bank is a portfolio application that demonstrates account dashboards, transaction history, transfers, simulated cards, and linked-account flows. It uses the Next.js App Router, Supabase Auth, PostgreSQL with Prisma, and Plaid Sandbox.

> **Demo only.** Balances and ledger activity are fictional. External-recipient transfers do not move money, and card details are simulated. Do not use this application to hold funds or store sensitive financial data.

## Features

- Email and password registration, sign-in, and password recovery
- Account, transaction, transfer, and simulated-card views
- Plaid Sandbox account linking and transaction sync
- User-scoped PostgreSQL records and encrypted Plaid access tokens
- Responsive dashboard and account-management interface

## Stack

- Next.js 16 with React 19 and TypeScript
- Supabase Auth and Supabase PostgreSQL
- Prisma ORM with the PostgreSQL adapter
- Plaid Sandbox for external-account demonstrations
- Tailwind CSS and Base UI components

## Requirements

- Node.js 20 or newer
- npm
- A Supabase project with Auth and PostgreSQL enabled
- Plaid Sandbox credentials for linked-account features

## Local setup

1. Install dependencies:

	```bash
	npm ci
	```

2. Create a local environment file by copying `.env.example` to `.env.local`, then set the required values described below. In PowerShell:

	```powershell
	Copy-Item .env.example .env.local
	```

3. Generate the Prisma client, validate the schema, and apply migrations:

	```bash
	npm run db:generate
	npm run db:validate
	npm run db:migrate
	```

	`db:migrate` runs Prisma's development migration command. For a deployed environment, apply checked-in migrations with `npx prisma migrate deploy` instead.

4. Add `http://localhost:3000/auth/callback` to the allowed redirect URLs in Supabase Auth. Configure the corresponding deployed callback URL before deployment.

5. Start the development server:

	```bash
	npm run dev
	```

	Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Purpose | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Browser and server |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key | Browser and server |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Admin API for account creation | Server only |
| `DATABASE_URL` | PostgreSQL connection used by the application | Server only |
| `DIRECT_URL` | Direct PostgreSQL connection used by Prisma migrations | Server only |
| `NEXT_PUBLIC_APP_URL` | Public application origin used in generated links | Browser and server |
| `PLAID_CLIENT_ID` | Plaid application ID | Server only |
| `PLAID_SECRET` | Plaid Sandbox secret | Server only |
| `PLAID_ENV` | Plaid environment; use `sandbox` for this demo | Server only |
| `PLAID_TOKEN_ENCRYPTION_KEY` | Base64-encoded 32-byte AES key for Plaid access tokens | Server only |

Use the Supabase connection pooler for `DATABASE_URL` when appropriate and a direct database connection for `DIRECT_URL`. Never expose service-role keys, database URLs, Plaid secrets, or encryption keys through a `NEXT_PUBLIC_` variable. Never commit `.env.local`; rotate any credentials that may have been exposed.

## Database and data behavior

Prisma schema and SQL migrations are maintained in `prisma/`.

- `npm run db:generate` generates Prisma Client.
- `npm run db:validate` validates the Prisma schema.
- `npm run db:migrate` creates/applies migrations for local development.
- `npx prisma migrate deploy` applies checked-in migrations in a deployment environment.

New demo accounts receive fictional checking and savings balances. Internal transfers update the ledger in a database transaction. External-recipient transfers remain demo records; no payout rail is configured.

## Security and integration boundaries

- Supabase Auth manages credentials and sessions. Password recovery returns through `/auth/callback`.
- The service-role key is used only by server-side account creation code.
- Plaid access tokens are encrypted with AES-256-GCM before storage. Plaid Link and account data are handled server-side; only masked account details are returned to the UI.
- Database access is scoped to the authenticated user. PostgreSQL row-level security policies are defined in the checked-in migrations.
- Simulated cards do not collect or store PAN or CVV data.

Registration currently confirms new email addresses automatically for the demo. Review account verification, rate limiting, dependency advisories, and operational controls before exposing the application to public users. This project is not a production banking platform and has not undergone financial, legal, or security certification.

## Verification

Run the project checks before submitting changes:

```bash
npm run db:validate
npx tsc --noEmit
npm run lint
npm run build
```

## Deployment

The application can be deployed to a Node.js-compatible host such as Vercel. Before releasing:

1. Configure all required environment variables in the hosting provider.
2. Configure Supabase Auth site and callback URLs for the deployed origin.
3. Generate Prisma Client and apply database migrations with `npx prisma migrate deploy`.
4. Run the verification commands above and confirm required Plaid features use Sandbox credentials.

See the [Next.js deployment guide](https://nextjs.org/docs/app/building-your-application/deploying) for hosting-specific configuration.
