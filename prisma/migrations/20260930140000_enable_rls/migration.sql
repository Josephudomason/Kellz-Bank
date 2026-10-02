-- Defense in depth for any Supabase Data API access.
-- The application server still uses Prisma ownership predicates for its business operations.

ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transfer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Card" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PlaidItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExternalAccount" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_owner_access" ON "Profile"
  FOR ALL TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "account_owner_access" ON "Account"
  FOR ALL TO authenticated
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

CREATE POLICY "transaction_owner_access" ON "Transaction"
  FOR ALL TO authenticated
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

CREATE POLICY "transfer_owner_access" ON "Transfer"
  FOR ALL TO authenticated
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

CREATE POLICY "card_owner_access" ON "Card"
  FOR ALL TO authenticated
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

CREATE POLICY "plaid_item_owner_access" ON "PlaidItem"
  FOR ALL TO authenticated
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

CREATE POLICY "external_account_owner_access" ON "ExternalAccount"
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "PlaidItem"
      WHERE "PlaidItem"."id" = "ExternalAccount"."plaidItemId"
        AND "PlaidItem"."userId" = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM "PlaidItem"
      WHERE "PlaidItem"."id" = "ExternalAccount"."plaidItemId"
        AND "PlaidItem"."userId" = auth.uid()
    )
  );
