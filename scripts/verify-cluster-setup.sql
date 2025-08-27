-- Verify cluster implementation
SELECT 
    'Clusters table' as table_name,
    COUNT(*) as record_count
FROM clusters
UNION ALL
SELECT 
    'Farmers with clusters' as table_name,
    COUNT(*) as record_count
FROM farmers 
WHERE "clusterId" IS NOT NULL
UNION ALL
SELECT 
    'Total farmers' as table_name,
    COUNT(*) as record_count
FROM farmers;

-- Show sample cluster data
SELECT 
    id,
    title,
    "clusterLeadFirstName" || ' ' || "clusterLeadLastName" as cluster_lead,
    "clusterLeadEmail"
FROM clusters
LIMIT 5;

-- Show farmers table structure (check if clusterId column exists)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'farmers' 
    AND column_name IN ('id', 'clusterId', 'firstName', 'lastName')
ORDER BY ordinal_position;
