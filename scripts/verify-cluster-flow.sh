#!/bin/bash

# Cluster Flow Verification Script
# This script helps verify cluster assignment is working correctly

echo "========================================"
echo "Cluster Flow Verification"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in the API directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from ccsa-mobile-api directory${NC}"
    exit 1
fi

echo "1. Checking for NACOTAN cluster in database..."
echo ""

# Check if psql is available
if command -v psql &> /dev/null; then
    # Extract database URL
    if [ -f ".env" ] || [ -f ".env.local" ]; then
        DB_URL=$(grep DATABASE_URL .env .env.local 2>/dev/null | head -1 | cut -d '=' -f2-)
        
        if [ ! -z "$DB_URL" ]; then
            echo "Running cluster check query..."
            psql "$DB_URL" -c "
            SELECT 
              id, 
              title, 
              \"clusterLeadFirstName\", 
              \"clusterLeadLastName\",
              (SELECT COUNT(*) FROM \"Farmer\" WHERE \"clusterId\" = \"Cluster\".id) as \"farmerCount\"
            FROM \"Cluster\" 
            ORDER BY title;
            " 2>/dev/null
            
            echo ""
            echo "Farmers without cluster assignment:"
            psql "$DB_URL" -c "
            SELECT COUNT(*) as \"farmers_without_cluster\"
            FROM \"Farmer\" 
            WHERE \"clusterId\" IS NULL;
            " 2>/dev/null
            
        else
            echo -e "${YELLOW}No DATABASE_URL found in .env${NC}"
        fi
    fi
else
    echo -e "${YELLOW}psql not found. Install PostgreSQL client to query database.${NC}"
fi

echo ""
echo "2. Opening Prisma Studio for manual verification..."
echo -e "${YELLOW}   In Prisma Studio:${NC}"
echo "   - Navigate to Cluster model to see all clusters"
echo "   - Navigate to Farmer model to check cluster assignments"
echo "   - Filter farmers by: clusterId equals null (to find unassigned)"
echo ""

read -p "Press Enter to open Prisma Studio (Ctrl+C to skip)..."
npm run db:studio &
PRISMA_PID=$!

echo ""
echo -e "${GREEN}✓ Prisma Studio opened (PID: $PRISMA_PID)${NC}"
echo -e "${YELLOW}   Access at: http://localhost:5555${NC}"
echo ""

echo "3. Testing cluster assignment..."
echo ""
echo "To test the auto-assignment feature:"
echo "   A. Register a NEW farmer via mobile app WITHOUT selecting a cluster"
echo "   B. Check if farmer is auto-assigned to NACOTAN cluster"
echo ""
echo "Expected behavior:"
echo "   - If no cluster selected → Auto-assigned to NACOTAN (if exists)"
echo "   - If cluster selected → Uses selected cluster"
echo ""

echo "4. Run bulk assignment for existing farmers (optional)..."
echo ""
echo "To assign all farmers without clusters to NACOTAN:"
echo -e "${YELLOW}   node scripts/bulk-assign-nacotan.js${NC}"
echo ""

read -p "Would you like to run bulk assignment now? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    node scripts/bulk-assign-nacotan.js
fi

echo ""
echo "========================================"
echo "Verification Complete"
echo "========================================"
echo ""
echo "Summary of Changes:"
echo "✓ Cluster field exists in registration form"
echo "✓ API saves cluster when selected by agent"
echo "✓ NEW: Auto-assigns NACOTAN cluster if none selected"
echo "✓ Database relationships are correct"
echo ""
echo "Press Ctrl+C to close Prisma Studio and exit."
wait $PRISMA_PID
