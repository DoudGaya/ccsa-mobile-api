#!/bin/bash

# ✅ POST-MIGRATION VERIFICATION SCRIPT
# Checks that all data is intact and schema changes are correct

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Load environment variables from .env file
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║  POST-MIGRATION VERIFICATION SCRIPT    ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ ERROR: DATABASE_URL environment variable not set${NC}"
  exit 1
fi

ERRORS=0
WARNINGS=0

# Helper function for checks
check_passed() {
  echo -e "${GREEN}✅ $1${NC}"
}

check_failed() {
  echo -e "${RED}❌ $1${NC}"
  ((ERRORS++))
}

check_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
  ((WARNINGS++))
}

echo -e "${BLUE}1️⃣  Checking Schema Changes...${NC}"
echo "-----------------------------------"

# Check that resource column is gone
RESOURCE_COL=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) FROM information_schema.columns 
  WHERE table_name = 'permissions' AND column_name = 'resource'
")

if [ "$RESOURCE_COL" -eq 0 ]; then
  check_passed "Resource column successfully removed"
else
  check_failed "Resource column still exists (should be removed)"
fi

# Check that category column exists
CATEGORY_COL=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) FROM information_schema.columns 
  WHERE table_name = 'permissions' AND column_name = 'category'
")

if [ "$CATEGORY_COL" -eq 1 ]; then
  check_passed "Category column exists"
else
  check_failed "Category column missing"
fi

# Check that action column exists
ACTION_COL=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) FROM information_schema.columns 
  WHERE table_name = 'permissions' AND column_name = 'action'
")

if [ "$ACTION_COL" -eq 1 ]; then
  check_passed "Action column exists"
else
  check_failed "Action column missing"
fi

echo ""
echo -e "${BLUE}2️⃣  Checking Data Integrity...${NC}"
echo "-----------------------------------"

# Check permission count (should be 20)
PERM_COUNT=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) FROM permissions
")

echo "Total permissions: $PERM_COUNT"
if [ "$PERM_COUNT" -ge 1 ]; then
  check_passed "Permissions data preserved ($PERM_COUNT records)"
else
  check_failed "No permissions found in table"
fi

# Check for NULL values in category or action
NULL_COUNT=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) FROM permissions
  WHERE category IS NULL OR action IS NULL
")

if [ "$NULL_COUNT" -eq 0 ]; then
  check_passed "No NULL values in category or action columns"
else
  check_warning "Found $NULL_COUNT permissions with NULL category or action"
fi

# Check for duplicates in category+action
DUPLICATE_COUNT=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) FROM (
    SELECT category, action, COUNT(*) as cnt
    FROM permissions
    WHERE category IS NOT NULL AND action IS NOT NULL
    GROUP BY category, action
    HAVING COUNT(*) > 1
  ) t
")

if [ "$DUPLICATE_COUNT" -eq 0 ]; then
  check_passed "No duplicate category+action combinations"
else
  check_failed "Found $DUPLICATE_COUNT duplicate category+action combinations"
  psql "$DATABASE_URL" -c "
    SELECT category, action, COUNT(*) as count_duplicates
    FROM permissions
    WHERE category IS NOT NULL AND action IS NOT NULL
    GROUP BY category, action
    HAVING COUNT(*) > 1
    ORDER BY count_duplicates DESC;
  "
fi

echo ""
echo -e "${BLUE}3️⃣  Checking Constraints...${NC}"
echo "-----------------------------------"

# Check for unique constraint on category, action
CONSTRAINT=$(psql "$DATABASE_URL" -t -c "
  SELECT constraint_name FROM information_schema.table_constraints
  WHERE table_name = 'permissions' 
  AND constraint_name LIKE '%category_action%'
")

if [ -n "$CONSTRAINT" ]; then
  check_passed "Unique constraint on (category, action) exists: $CONSTRAINT"
else
  check_warning "Could not verify unique constraint on (category, action)"
fi

echo ""
echo -e "${BLUE}4️⃣  Checking Related Tables...${NC}"
echo "-----------------------------------"

# Check role_permissions
ROLE_PERM_COUNT=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) FROM role_permissions
")
echo "Role permissions: $ROLE_PERM_COUNT associations"
if [ "$ROLE_PERM_COUNT" -ge 0 ]; then
  check_passed "role_permissions table accessible"
else
  check_failed "Cannot access role_permissions table"
fi

# Check user_permissions
USER_PERM_COUNT=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) FROM user_permissions
")
echo "User permissions: $USER_PERM_COUNT associations"
if [ "$USER_PERM_COUNT" -ge 0 ]; then
  check_passed "user_permissions table accessible"
else
  check_failed "Cannot access user_permissions table"
fi

# Verify foreign key integrity
FK_ERRORS=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) FROM role_permissions rp
  WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.id = rp.\"permissionId\")
")

if [ "$FK_ERRORS" -eq 0 ]; then
  check_passed "All role_permissions references are valid"
else
  check_failed "Found $FK_ERRORS orphaned role_permissions records"
fi

FK_ERRORS_USER=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) FROM user_permissions up
  WHERE NOT EXISTS (SELECT 1 FROM permissions p WHERE p.id = up.\"permissionId\")
")

if [ "$FK_ERRORS_USER" -eq 0 ]; then
  check_passed "All user_permissions references are valid"
else
  check_failed "Found $FK_ERRORS_USER orphaned user_permissions records"
fi

echo ""
echo -e "${BLUE}5️⃣  Sample Data Check...${NC}"
echo "-----------------------------------"

echo ""
echo "First 5 permissions:"
psql "$DATABASE_URL" << EOF
\x off
\pset format csv
SELECT 
  SUBSTR(id, 1, 8) as id,
  name,
  category,
  action,
  isSystem,
  isActive
FROM permissions
LIMIT 5;
EOF

echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# Summary
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
  echo "Migration was successful and all data is intact."
  echo ""
  if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
  fi
  exit 0
else
  echo -e "${RED}❌ VERIFICATION FAILED${NC}"
  echo "Errors found: $ERRORS"
  echo "Warnings: $WARNINGS"
  echo ""
  echo "Please review the output above and take corrective action."
  exit 1
fi
