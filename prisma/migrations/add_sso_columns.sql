-- Add SSO columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ssoProviderId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ssoProvider" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "ssoEmail" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastSSOLogin" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isSSOEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Create SSOAuditLog table if it doesn't exist
CREATE TABLE IF NOT EXISTS "SSOAuditLog" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SSOAuditLog_pkey" PRIMARY KEY ("id")
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "SSOAuditLog_email_idx" ON "SSOAuditLog"("email");
CREATE INDEX IF NOT EXISTS "SSOAuditLog_timestamp_idx" ON "SSOAuditLog"("timestamp");
CREATE INDEX IF NOT EXISTS "SSOAuditLog_provider_idx" ON "SSOAuditLog"("provider");
