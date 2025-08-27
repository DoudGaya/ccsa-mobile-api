-- Add cluster support to existing database without data loss

-- Create the clusters table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."clusters" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "clusterLeadFirstName" TEXT NOT NULL,
    "clusterLeadLastName" TEXT NOT NULL,
    "clusterLeadEmail" TEXT NOT NULL,
    "clusterLeadPhone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "clusters_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on cluster title if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'clusters_title_key') THEN
        CREATE UNIQUE INDEX "clusters_title_key" ON "public"."clusters"("title");
    END IF;
END
$$;

-- Add clusterId column to farmers table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'farmers' AND column_name = 'clusterId') THEN
        ALTER TABLE "public"."farmers" ADD COLUMN "clusterId" TEXT;
    END IF;
END
$$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'farmers_clusterId_fkey') THEN
        ALTER TABLE "public"."farmers" ADD CONSTRAINT "farmers_clusterId_fkey" 
        FOREIGN KEY ("clusterId") REFERENCES "public"."clusters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

-- Insert default clusters
INSERT INTO "public"."clusters" ("id", "title", "description", "clusterLeadFirstName", "clusterLeadLastName", "clusterLeadEmail", "clusterLeadPhone")
VALUES 
    ('cluster_nacotan_001', 'NACOTAN', 'Nigeria Agricultural Commodity Association cluster for northern agriculture', 'Ahmad', 'Ibrahim', 'ahmad.ibrahim@nacotan.org', '+2348012345678'),
    ('cluster_mangara_001', 'MANGARA', 'Mangara Agricultural Development cluster for sustainable farming', 'Fatima', 'Mohammed', 'fatima.mohammed@mangara.org', '+2348023456789')
ON CONFLICT ("title") DO NOTHING;
