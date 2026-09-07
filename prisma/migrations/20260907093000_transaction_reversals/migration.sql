-- Preserve transaction history by recording corrections as linked reversals.
ALTER TABLE "transactions"
ADD COLUMN "reversalOfId" TEXT,
ADD COLUMN "reversalReason" TEXT,
ADD COLUMN "reversedAt" TIMESTAMP(3),
ADD COLUMN "reversedBy" TEXT;

CREATE UNIQUE INDEX "transactions_reversalOfId_key" ON "transactions"("reversalOfId");
CREATE INDEX "transactions_reversedAt_idx" ON "transactions"("reversedAt");

ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_reversalOfId_fkey"
FOREIGN KEY ("reversalOfId") REFERENCES "transactions"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
