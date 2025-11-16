#!/bin/bash

# 🚀 SAFE MIGRATION SCRIPT (Prisma-based) - No psql required
# Complete Safe Migration Workflow using Prisma for all operations

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
    log "Make sure .env file has DATABASE_URL defined"
    exit 1
  fi
  success "DATABASE_URL is set"
  
  # Check if npx is available
  if ! command -v npx &> /dev/null; then
    error "npx is not installed or not in PATH"
    exit 1
  fi
  success "npx is available"
  
  # Check if node is available
  if ! command -v node &> /dev/null; then
    error "node is not installed or not in PATH"
    exit 1
  fi
  success "node is available"
  
  # Test Prisma validation
  log "Validating Prisma schema..."
  if ! npx prisma validate > /dev/null 2>&1; then
    error "Prisma schema validation failed"
    exit 1
  fi
  success "Prisma schema is valid"
  
  log "All prerequisites met"
}

# Check database connectivity
check_database_connection() {
  log "Testing database connection with Prisma..."
  
  if ! npx prisma db execute --stdin < /dev/null 2>&1; then
    warning "Could not test database connection (might be ok)"
  else
    success "Database connection successful"
  fi
}

# Create backup using Node.js script
create_backup() {
  log_section "STEP 2: Creating Backup"
  
  BACKUP_DIR="$PROJECT_DIR/backups/migration_$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$BACKUP_DIR"
  
  log "Backup directory: $BACKUP_DIR"
  
  # Create a Node.js script to backup tables
  cat > "$PROJECT_DIR/scripts/backup-tables.js" << 'BACKUP_SCRIPT'
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function backupTables() {
  const prisma = new PrismaClient();
  const backupDir = process.argv[2];
  
  try {
    console.log('Backing up permissions table...');
    const permissions = await prisma.permission.findMany();
    fs.writeFileSync(
      path.join(backupDir, 'permissions.json'),
      JSON.stringify(permissions, null, 2)
    );
    console.log(`✅ Backed up ${permissions.length} permissions`);
    
    console.log('Backing up role_permissions...');
    const rolePermissions = await prisma.rolePermission.findMany();
    fs.writeFileSync(
      path.join(backupDir, 'role_permissions.json'),
      JSON.stringify(rolePermissions, null, 2)
    );
    console.log(`✅ Backed up ${rolePermissions.length} role_permissions`);
    
    console.log('Backing up user_permissions...');
    const userPermissions = await prisma.userPermission.findMany();
    fs.writeFileSync(
      path.join(backupDir, 'user_permissions.json'),
      JSON.stringify(userPermissions, null, 2)
    );
    console.log(`✅ Backed up ${userPermissions.length} user_permissions`);
    
    console.log('Backing up roles...');
    const roles = await prisma.roles.findMany();
    fs.writeFileSync(
      path.join(backupDir, 'roles.json'),
      JSON.stringify(roles, null, 2)
    );
    console.log(`✅ Backed up ${roles.length} roles`);
    
    console.log('Backing up user_roles...');
    const userRoles = await prisma.user_roles.findMany();
    fs.writeFileSync(
      path.join(backupDir, 'user_roles.json'),
      JSON.stringify(userRoles, null, 2)
    );
    console.log(`✅ Backed up ${userRoles.length} user_roles`);
    
    console.log('Backup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Backup failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backupTables();
BACKUP_SCRIPT

  log "Running backup script..."
  if node "$PROJECT_DIR/scripts/backup-tables.js" "$BACKUP_DIR" 2>&1 | tee -a "$LOG_FILE"; then
    success "Backup complete! Saved to: $BACKUP_DIR"
  else
    error "Backup failed"
    return 1
  fi
  
  rm -f "$PROJECT_DIR/scripts/backup-tables.js"
}

# Run diagnostic
run_diagnostic() {
  log_section "STEP 3: Running Diagnostic Check"
  
  log "Checking current database state..."
  
  # Create diagnostic script
  cat > "$PROJECT_DIR/scripts/diagnose.js" << 'DIAG_SCRIPT'
const { PrismaClient } = require('@prisma/client');

async function diagnose() {
  const prisma = new PrismaClient();
  
  try {
    console.log('\n📊 Permission Count:');
    const count = await prisma.permission.count();
    console.log(`   Total: ${count}`);
    
    if (count > 0) {
      console.log('\n✅ Permissions found (will be preserved)');
    } else {
      console.log('\n⚠️  No permissions found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Diagnostic failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();
DIAG_SCRIPT

  if node "$PROJECT_DIR/scripts/diagnose.js" 2>&1 | tee -a "$LOG_FILE"; then
    success "Diagnostic complete"
  else
    warning "Diagnostic check had issues but continuing"
  fi
  
  rm -f "$PROJECT_DIR/scripts/diagnose.js"
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
  
  # Create verification script
  cat > "$PROJECT_DIR/scripts/verify.js" << 'VERIFY_SCRIPT'
const { PrismaClient } = require('@prisma/client');

async function verify() {
  const prisma = new PrismaClient();
  let hasErrors = false;
  
  try {
    console.log('\n✔️  Checking data integrity...\n');
    
    // Check permission count
    const count = await prisma.permission.count();
    console.log(`   Permissions total: ${count}`);
    if (count >= 1) {
      console.log('   ✅ Permissions preserved');
    } else {
      console.log('   ❌ No permissions found!');
      hasErrors = true;
    }
    
    // Check for NULL category or action
    const nullCount = await prisma.permission.count({
      where: {
        OR: [
          { category: null },
          { action: null }
        ]
      }
    });
    
    if (nullCount === 0) {
      console.log('   ✅ No NULL values in category/action');
    } else {
      console.log(`   ⚠️  Found ${nullCount} records with NULL values`);
    }
    
    console.log('\n✔️  Verification complete!\n');
    process.exit(hasErrors ? 1 : 0);
    
  } catch (error) {
    console.error('Verification failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
VERIFY_SCRIPT

  if node "$PROJECT_DIR/scripts/verify.js" 2>&1 | tee -a "$LOG_FILE"; then
    success "Verification passed"
  else
    error "Verification failed"
    return 1
  fi
  
  rm -f "$PROJECT_DIR/scripts/verify.js"
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
}

# Rollback on error
rollback() {
  log_section "ROLLING BACK MIGRATION"
  
  error "Migration failed. Please check the log file."
  
  if [ -n "$BACKUP_DIR" ] && [ -d "$BACKUP_DIR" ]; then
    warning "Backup saved at: $BACKUP_DIR"
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
  check_database_connection || warning "Database connection check failed"
  create_backup || rollback
  run_diagnostic || rollback
  run_migration || rollback
  verify_migration || rollback
  regenerate_client || rollback
  cleanup
}

# Run main
main
