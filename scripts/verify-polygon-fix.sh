#!/bin/bash

# Farm Polygon Fix - Verification Test Script
# This script helps verify that polygon data is being saved correctly

echo "======================================"
echo "Farm Polygon Fix - Verification Test"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}This script will help verify the polygon fix is working.${NC}"
echo ""

# Check if we're in the API directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from ccsa-mobile-api directory${NC}"
    exit 1
fi

echo "1. Checking if API server is running..."
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API server is running${NC}"
else
    echo -e "${YELLOW}⚠ API server not detected. Start it with: npm run dev${NC}"
    echo ""
    read -p "Press Enter to continue anyway, or Ctrl+C to exit..."
fi

echo ""
echo "2. Opening Prisma Studio to view database..."
echo -e "${YELLOW}   In Prisma Studio, navigate to the Farm model to check polygon data${NC}"
echo ""
read -p "Press Enter to open Prisma Studio (Ctrl+C to skip)..."
npm run db:studio &
PRISMA_PID=$!
echo ""
echo -e "${GREEN}✓ Prisma Studio opened (PID: $PRISMA_PID)${NC}"
echo -e "${YELLOW}   Access at: http://localhost:5555${NC}"
echo ""

echo "3. Test Checklist:"
echo "   After creating a farm with polygon data from the mobile app:"
echo ""
echo "   [ ] farmPolygon field contains JSON array (not null)"
echo "   [ ] farmPolygon has latitude/longitude values"
echo "   [ ] farmSize is calculated automatically"
echo "   [ ] Farm displays on map in admin dashboard"
echo ""
echo "   Example farmPolygon value:"
echo '   [{"latitude": 9.082, "longitude": 7.486, "timestamp": 1698561234, "accuracy": 5}]'
echo ""

echo "4. Sample SQL Query to check recent farms:"
echo ""
echo "   Run this in your database client:"
echo '   SELECT id, "farmerId", "farmSize", "farmPolygon" IS NOT NULL as has_polygon'
echo '   FROM "Farm" ORDER BY "createdAt" DESC LIMIT 5;'
echo ""

read -p "Press Enter to view recent farms in database..."
echo ""

# Try to query database if psql is available
if command -v psql &> /dev/null; then
    echo "Recent farms (showing polygon status):"
    # Extract database URL from .env if it exists
    if [ -f ".env" ] || [ -f ".env.local" ]; then
        DB_URL=$(grep DATABASE_URL .env .env.local 2>/dev/null | head -1 | cut -d '=' -f2-)
        if [ ! -z "$DB_URL" ]; then
            psql "$DB_URL" -c "SELECT id, \"farmerId\", \"farmSize\", \"farmPolygon\" IS NOT NULL as has_polygon, \"createdAt\" FROM \"Farm\" ORDER BY \"createdAt\" DESC LIMIT 5;" 2>/dev/null || echo -e "${YELLOW}Could not query database${NC}"
        fi
    fi
else
    echo -e "${YELLOW}psql not found. Install PostgreSQL client to query database directly.${NC}"
fi

echo ""
echo "======================================"
echo "Verification Steps Complete"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Use the mobile app to add a new farm with polygon boundary"
echo "2. Check Prisma Studio or database to verify farmPolygon is saved"
echo "3. View the farm in admin dashboard to see polygon rendered on map"
echo ""
echo -e "${GREEN}If farmPolygon shows data instead of null, the fix is working! ✓${NC}"
echo ""
echo "Press Ctrl+C to close Prisma Studio and exit."
wait $PRISMA_PID
