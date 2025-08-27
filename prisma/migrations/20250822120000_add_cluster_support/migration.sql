-- CreateClusterSupport
-- Migration to add cluster functionality to existing database

-- CreateTable: clusters
CREATE TABLE "clusters" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "clusterLeadFirstName" TEXT NOT NULL,
    "clusterLeadLastName" TEXT NOT NULL,
    "clusterLeadEmail" TEXT NOT NULL,
    "clusterLeadPhone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clusters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clusters_title_key" ON "clusters"("title");

-- AlterTable: farmers - Add clusterId column
ALTER TABLE "farmers" ADD COLUMN "clusterId" TEXT;

-- AddForeignKey
ALTER TABLE "farmers" ADD CONSTRAINT "farmers_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "clusters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
