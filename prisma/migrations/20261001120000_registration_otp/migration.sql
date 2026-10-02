CREATE TYPE "RegistrationOtpChannel" AS ENUM ('EMAIL', 'PHONE');

ALTER TABLE "Profile" ADD COLUMN "phone" TEXT;
CREATE UNIQUE INDEX "Profile_phone_key" ON "Profile"("phone");

CREATE TABLE "RegistrationChallenge" (
    "id" UUID NOT NULL,
    "channel" "RegistrationOtpChannel" NOT NULL,
    "destination" TEXT NOT NULL,
    "codeHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegistrationChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RegistrationChallenge_destination_channel_createdAt_idx"
ON "RegistrationChallenge"("destination", "channel", "createdAt");
CREATE INDEX "RegistrationChallenge_expiresAt_idx"
ON "RegistrationChallenge"("expiresAt");

ALTER TABLE "RegistrationChallenge" ENABLE ROW LEVEL SECURITY;