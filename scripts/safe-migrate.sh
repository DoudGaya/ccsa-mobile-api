#!/bin/bash

# 🚀 MASTER MIGRATION SCRIPT - Complete Safe Migration Workflow
# This script handles everything: backup, migrate, verify, and rollback if needed

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Load environment variables from .env file
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
BACKUP_DIR=""
MIGRATION_NAME="20251115_remove_deprecated_resource_column"
START_TIME=$(date +%s)

# Logging
LOG_FILE="$PROJECT_DIR/migration_$(date +%Y%m%d_%H%M%S).log"

log() {
  echo "[$(date +'%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_section() {
  echo "" | tee -a "$LOG_FILE"
  echo -e "${BLUE}═══════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
  echo -e "${BLUE}$1${NC}" | tee -a "$LOG_FILE"
  echo -e "${BLUE}═══════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
  echo "" | tee -a "$LOG_FILE"
}

success() {
  echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

error() {
  echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
  echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
  log_section "STEP 1: Checking Prerequisites"
  
  if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL environment variable not set"
    log "Set it using: export DATABASE_URL=\"postgresql://...\""
    exit 1
  fi
  success "DATABASE_URL is set"
  
  # Check if psql is available
  if ! command -v psql &> /dev/null; then
    error "psql is not installed or not in PATH"
    exit 1
  fi
  success "psql is available"
  
  # Check if npx is available
  if ! command -v npx &> /dev/null; then
    error "npx is not installed or not in PATH"
    exit 1
  fi
  success "npx is available"
  
  # Test database connection
  if ! psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    error "Cannot connect to database"
    log "Check your DATABASE_URL"
    exit 1
  fi
  success "Database connection successful"
  
  log "All prerequisites met"
}

# Create backup
create_backup() {
  log_section "STEP 2: Creating Backup"
  
  BACKUP_DIR="$PROJECT_DIR/backups/migration_$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$BACKUP_DIR"
  
  log "Backup directory: $BACKUP_DIR"
  
  log "Backing up permissions table..."
  psql "$DATABASE_URL" -c "\COPY permissions TO STDOUT FORMAT csv HEADER;" > "$BACKUP_DIR/permissions.csv"
  success "permissions.csv created ($(wc -l < "$BACKUP_DIR/permissions.csv") records)"
  
  log "Backing up role_permissions table..."
  psql "$DATABASE_URL" -c "\COPY role_permissions TO STDOUT FORMAT csv HEADER;" > "$BACKUP_DIR/role_permissions.csv"
  success "role_permissions.csv created"
  
  log "Backing up user_permissions table..."
  psql "$DATABASE_URL" -c "\COPY user_permissions TO STDOUT FORMAT csv HEADER;" > "$BACKUP_DIR/user_permissions.csv"
  success "user_permissions.csv created"
  
  log "Backing up roles table..."
  psql "$DATABASE_URL" -c "\COPY roles TO STDOUT FORMAT csv HEADER;" > "$BACKUP_DIR/roles.csv"
  success "roles.csv created"
  
  log "Backing up user_roles table..."
  psql "$DATABASE_URL" -c "\COPY user_roles TO STDOUT FORMAT csv HEADER;" > "$BACKUP_DIR/user_roles.csv"
  success "user_roles.csv created"
  
  # Create restoration script
  cat > "$BACKUP_DIR/RESTORE.sh" << 'EOF'
#!/bin/bash
# Quick restore script
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL not set"
  exit 1
fi

echo "⚠️  RESTORING DATABASE FROM BACKUP"
read -p "Continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  exit 0
fi

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

psql "$DATABASE_URL" << SQL
TRUNCATE TABLE user_permissions CASCADE;
TRUNCATE TABLE role_permissions CASCADE;
TRUNCATE TABLE permissions CASCADE;
EOF

chmod +x "$BACKUP_DIR/RESTORE.sh"
  
  success "Backup complete! Saved to: $BACKUP_DIR"
}

# Diagnostic check
run_diagnostic() {
  log_section "STEP 3: Running Diagnostic Check"
  
  log "Checking current database state..."
  
  # Get permission count
  PERM_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM permissions" | tr -d ' ')
  log "Total permissions: $PERM_COUNT"
  
  # Check for resource column
  RESOURCE_COL=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'permissions' AND column_name = 'resource'
  " | tr -d ' ')
  
  if [ "$RESOURCE_COL" -eq 1 ]; then
    success "Resource column exists (will be migrated to category)"
  else
    warning "Resource column not found (already migrated?)"
  fi
  
  # Check for duplicates
  DUPS=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*) FROM (
      SELECT category, action, COUNT(*) 
      FROM permissions 
      WHERE category IS NOT NULL AND action IS NOT NULL
      GROUP BY category, action 
      HAVING COUNT(*) > 1
    ) t
  " | tr -d ' ')
  
  if [ "$DUPS" -eq 0 ]; then
    success "No duplicate category+action combinations"
  else
    warning "Found $DUPS duplicate combinations (will need manual fix)"
  fi
  
  log "Diagnostic complete"
}

# Run migration
run_migration() {
  log_section "STEP 4: Running Prisma Migration"
  
  cd "$PROJECT_DIR"
  
  log "Running: npx prisma migrate deploy"
  
  if npx prisma migrate deploy 2>&1 | tee -a "$LOG_FILE"; then
    success "Migration deployed successfully"
  else
    error "Migration failed"
    return 1
  fi
}

# Verify migration
verify_migration() {
  log_section "STEP 5: Verifying Migration"
  
  log "Running verification checks..."
  
  # Check resource column is gone
  RESOURCE_COL=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'permissions' AND column_name = 'resource'
  " | tr -d ' ')
  
  if [ "$RESOURCE_COL" -eq 0 ]; then
    success "Resource column successfully removed"
  else
    error "Resource column still exists!"
    return 1
  fi
  
  # Check category column exists
  CATEGORY_COL=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*) FROM information_schema.columns 
    WHERE table_name = 'permissions' AND column_name = 'category'
  " | tr -d ' ')
  
  if [ "$CATEGORY_COL" -eq 1 ]; then
    success "Category column exists"
  else
    error "Category column not found!"
    return 1
  fi
  
  # Verify data integrity
  PERM_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM permissions" | tr -d ' ')
  success "Permissions table has $PERM_COUNT records"
  
  # Check for NULLs
  NULL_COUNT=$(psql "$DATABASE_URL" -t -c "
    SELECT COUNT(*) FROM permissions 
    WHERE category IS NULL OR action IS NULL
  " | tr -d ' ')
  
  if [ "$NULL_COUNT" -eq 0 ]; then
    success "No NULL values in category/action"
  else
    warning "Found $NULL_COUNT records with NULL values"
  fi
  
  log "Verification complete"
}

# Regenerate Prisma client
regenerate_client() {
  log_section "STEP 6: Regenerating Prisma Client"
  
  cd "$PROJECT_DIR"
  
  log "Running: npx prisma generate"
  if npx prisma generate 2>&1 | tee -a "$LOG_FILE"; then
    success "Prisma client regenerated"
  else
    error "Failed to regenerate Prisma client"
    return 1
  fi
}

# Cleanup
cleanup() {
  log_section "STEP 7: Cleanup"
  
  log "Migration took $(($(date +%s) - START_TIME)) seconds"
  success "Migration completed successfully!"
  
  echo ""
  echo -e "${GREEN}════════════════════════════════════════${NC}"
  echo -e "${GREEN}✅ MIGRATION SUCCESSFUL${NC}"
  echo -e "${GREEN}════════════════════════════════════════${NC}"
  echo ""
  echo "Backup location: $BACKUP_DIR"
  echo "Log file: $LOG_FILE"
  echo ""
  echo "Next steps:"
  echo "  1. Test your application: npm run dev"
  echo "  2. Verify permissions are working"
  echo "  3. Check logs for any errors"
  echo ""
  echo "To rollback (if needed):"
  echo "  bash $BACKUP_DIR/RESTORE.sh"
  echo ""
}

# Rollback on error
rollback() {
  log_section "ROLLING BACK MIGRATION"
  
  error "Migration failed. Attempting rollback..."
  
  if [ -n "$BACKUP_DIR" ] && [ -d "$BACKUP_DIR" ]; then
    warning "To restore from backup, run:"
    warning "  cd $PROJECT_DIR"
    warning "  bash $BACKUP_DIR/RESTORE.sh"
  fi
  
  error "Migration process stopped"
  exit 1
}

# Main execution
main() {
  echo ""
  echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  🚀 SAFE PERMISSIONS TABLE MIGRATION  ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
  echo ""
  echo "This script will:"
  echo "  1. ✅ Check prerequisites"
  echo "  2. 💾 Create database backups"
  echo "  3. 🔍 Run diagnostic checks"
  echo "  4. 🚀 Execute Prisma migration"
  echo "  5. ✔️  Verify data integrity"
  echo "  6. 🔄 Regenerate Prisma client"
  echo ""
  
  read -p "Continue? (yes/no): " -r
  if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log "Migration cancelled by user"
    exit 0
  fi
  
  log "Starting migration process..."
  log "Log file: $LOG_FILE"
  echo ""
  
  check_prerequisites || rollback
  create_backup || rollback
  run_diagnostic || rollback
  run_migration || rollback
  verify_migration || rollback
  regenerate_client || rollback
  cleanup
}

# Run main
main
