-- Add cluster lead information fields to the clusters table
ALTER TABLE "clusters" ADD COLUMN "clusterLeadNIN" VARCHAR;
ALTER TABLE "clusters" ADD COLUMN "clusterLeadState" VARCHAR;
ALTER TABLE "clusters" ADD COLUMN "clusterLeadLGA" VARCHAR;
ALTER TABLE "clusters" ADD COLUMN "clusterLeadWard" VARCHAR;
ALTER TABLE "clusters" ADD COLUMN "clusterLeadPollingUnit" VARCHAR;
ALTER TABLE "clusters" ADD COLUMN "clusterLeadPosition" VARCHAR;
ALTER TABLE "clusters" ADD COLUMN "clusterLeadAddress" VARCHAR;
ALTER TABLE "clusters" ADD COLUMN "clusterLeadDateOfBirth" TIMESTAMP;
ALTER TABLE "clusters" ADD COLUMN "clusterLeadGender" VARCHAR;
ALTER TABLE "clusters" ADD COLUMN "clusterLeadMaritalStatus" VARCHAR;
ALTER TABLE "clusters" ADD COLUMN "clusterLeadEmploymentStatus" VARCHAR;
ALTER TABLE "clusters" ADD COLUMN "clusterLeadBVN" VARCHAR;
ALTER TABLE "clusters" ADD COLUMN "clusterLeadBankName" VARCHAR;
ALTER TABLE "clusters" ADD COLUMN "clusterLeadAccountNumber" VARCHAR;
ALTER TABLE "clusters" ADD COLUMN "clusterLeadAccountName" VARCHAR;
ALTER TABLE "clusters" ADD COLUMN "clusterLeadAlternativePhone" VARCHAR;
ALTER TABLE "clusters" ADD COLUMN "clusterLeadWhatsAppNumber" VARCHAR;