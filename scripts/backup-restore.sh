#!/bin/bash

# 🛡️ BACKUP & RESTORE SCRIPT - Production Safe
# This script creates backups of critical tables before migration

set -e  # Exit on any error

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
BACKUP_DIR="$PROJECT_DIR/backups/migration_$(date +%Y%m%d_%H%M%S)"

# Load environment variables from .env file
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ensure DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}ERROR: DATABASE_URL environment variable not set${NC}"
  echo "Make sure .env file exists in: $PROJECT_DIR"
  exit 1
fi

echo -e "${GREEN}🛡️  BACKUP & RESTORE SCRIPT${NC}"
echo "=================================="
echo ""

# Parse command
COMMAND=${1:-help}

case $COMMAND in
  backup)
    echo -e "${YELLOW}📦 Creating backups...${NC}"
    mkdir -p "$BACKUP_DIR"
    
    echo "  → Backing up permissions table..."
    psql "$DATABASE_URL" -c "\COPY permissions TO STDOUT FORMAT csv HEADER;" > "$BACKUP_DIR/permissions.csv"
    
    echo "  → Backing up role_permissions table..."
    psql "$DATABASE_URL" -c "\COPY role_permissions TO STDOUT FORMAT csv HEADER;" > "$BACKUP_DIR/role_permissions.csv"
    
    echo "  → Backing up user_permissions table..."
    psql "$DATABASE_URL" -c "\COPY user_permissions TO STDOUT FORMAT csv HEADER;" > "$BACKUP_DIR/user_permissions.csv"
    
    echo "  → Backing up roles table..."
    psql "$DATABASE_URL" -c "\COPY roles TO STDOUT FORMAT csv HEADER;" > "$BACKUP_DIR/roles.csv"
    
    echo "  → Backing up user_roles table..."
    psql "$DATABASE_URL" -c "\COPY user_roles TO STDOUT FORMAT csv HEADER;" > "$BACKUP_DIR/user_roles.csv"
    
    # Create metadata file
    cat > "$BACKUP_DIR/METADATA.txt" << EOF
Backup Timestamp: $(date)
Database: $(echo $DATABASE_URL | cut -d'/' -f3)
Command: $0 backup
Tables Backed Up:
  - permissions
  - role_permissions
  - user_permissions
  - roles
  - user_roles

To restore, run:
  $0 restore "$BACKUP_DIR"
EOF
    
    echo -e "${GREEN}✅ Backup completed successfully!${NC}"
    echo "📁 Backup location: $BACKUP_DIR"
    echo ""
    echo "Files created:"
    ls -lh "$BACKUP_DIR"
    ;;
    
  restore)
    if [ -z "$2" ]; then
      echo -e "${RED}ERROR: Backup directory not specified${NC}"
      echo "Usage: $0 restore <backup_directory>"
      exit 1
    fi
    
    RESTORE_DIR="$2"
    if [ ! -d "$RESTORE_DIR" ]; then
      echo -e "${RED}ERROR: Backup directory not found: $RESTORE_DIR${NC}"
      exit 1
    fi
    
    echo -e "${YELLOW}⚠️  RESTORING FROM BACKUP${NC}"
    echo "=================================="
    echo "Source: $RESTORE_DIR"
    echo ""
    
    read -p "This will overwrite data. Continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
      echo "Restore cancelled."
      exit 0
    fi
    
    echo ""
    echo -e "${YELLOW}🔄 Restoring tables...${NC}"
    
    # Note: Restore order matters due to foreign keys
    # Start with independent tables, then dependent ones
    
    if [ -f "$RESTORE_DIR/roles.csv" ]; then
      echo "  → Restoring roles table..."
      psql "$DATABASE_URL" << EOF
TRUNCATE TABLE role_permissions CASCADE;
TRUNCATE TABLE roles CASCADE;
\COPY roles FROM STDIN FORMAT csv HEADER;
$(tail -n +2 "$RESTORE_DIR/roles.csv")
EOF
    fi
    
    if [ -f "$RESTORE_DIR/permissions.csv" ]; then
      echo "  → Restoring permissions table..."
      psql "$DATABASE_URL" << EOF
TRUNCATE TABLE user_permissions CASCADE;
TRUNCATE TABLE role_permissions CASCADE;
TRUNCATE TABLE permissions CASCADE;
\COPY permissions FROM STDIN FORMAT csv HEADER;
$(tail -n +2 "$RESTORE_DIR/permissions.csv")
EOF
    fi
    
    if [ -f "$RESTORE_DIR/role_permissions.csv" ]; then
      echo "  → Restoring role_permissions table..."
      psql "$DATABASE_URL" << EOF
\COPY role_permissions FROM STDIN FORMAT csv HEADER;
$(tail -n +2 "$RESTORE_DIR/role_permissions.csv")
EOF
    fi
    
    if [ -f "$RESTORE_DIR/user_permissions.csv" ]; then
      echo "  → Restoring user_permissions table..."
      psql "$DATABASE_URL" << EOF
\COPY user_permissions FROM STDIN FORMAT csv HEADER;
$(tail -n +2 "$RESTORE_DIR/user_permissions.csv")
EOF
    fi
    
    if [ -f "$RESTORE_DIR/user_roles.csv" ]; then
      echo "  → Restoring user_roles table..."
      psql "$DATABASE_URL" << EOF
\COPY user_roles FROM STDIN FORMAT csv HEADER;
$(tail -n +2 "$RESTORE_DIR/user_roles.csv")
EOF
    fi
    
    echo -e "${GREEN}✅ Restore completed successfully!${NC}"
    ;;
    
  verify)
    echo -e "${YELLOW}🔍 Verifying database state...${NC}"
    echo ""
    
    echo "Permissions table:"
    psql "$DATABASE_URL" -c "SELECT COUNT(*) as total_permissions FROM permissions;"
    
    echo ""
    echo "Role permissions associations:"
    psql "$DATABASE_URL" -c "SELECT COUNT(*) as total_role_permissions FROM role_permissions;"
    
    echo ""
    echo "User permissions associations:"
    psql "$DATABASE_URL" -c "SELECT COUNT(*) as total_user_permissions FROM user_permissions;"
    
    echo ""
    echo "Roles:"
    psql "$DATABASE_URL" -c "SELECT COUNT(*) as total_roles FROM roles;"
    
    echo ""
    echo "Checking for duplicate category+action combinations:"
    psql "$DATABASE_URL" -c "
    SELECT category, action, COUNT(*) as count_duplicates
    FROM permissions
    WHERE category IS NOT NULL AND action IS NOT NULL
    GROUP BY category, action
    HAVING COUNT(*) > 1
    ORDER BY count_duplicates DESC;
    "
    
    echo ""
    echo "Checking for NULL values:"
    psql "$DATABASE_URL" -c "
    SELECT id, name, category, action
    FROM permissions
    WHERE category IS NULL OR action IS NULL
    LIMIT 5;
    "
    
    echo -e "${GREEN}✅ Verification complete!${NC}"
    ;;
    
  help|*)
    cat << EOF
🛡️  Backup & Restore Script for CCSA Database

Usage: $0 <command> [options]

Commands:
  backup              Create backup of all permission-related tables
                      Usage: $0 backup
                      Creates timestamped backup in ./backups/

  restore <dir>       Restore from backup directory
                      Usage: $0 restore ./backups/migration_YYYYMMDD_HHMMSS
                      ⚠️  WARNING: This will overwrite existing data!

  verify              Check current database state
                      Usage: $0 verify
                      Shows counts and integrity checks

  help                Show this help message

Prerequisites:
  - DATABASE_URL environment variable set
  - psql command-line tool installed
  - Network access to database

Example workflow:
  1. Set DATABASE_URL:
     export DATABASE_URL="postgresql://..."

  2. Create backup:
     $0 backup
     # Backups to: ./backups/migration_20251116_143022/

  3. Run migration:
     npx prisma migrate deploy

  4. Verify database:
     $0 verify

  5. If needed, restore:
     $0 restore ./backups/migration_20251116_143022/

For more info, see: SAFE_MIGRATION_INSTRUCTIONS.md
EOF
    ;;
esac
