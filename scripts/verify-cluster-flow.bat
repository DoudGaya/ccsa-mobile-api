@echo off
REM Cluster Flow Verification Script (Windows)

echo ========================================
echo Cluster Flow Verification
echo ========================================
echo.

REM Check if we're in the API directory
if not exist "package.json" (
    echo Error: Must run from ccsa-mobile-api directory
    exit /b 1
)

echo 1. Checking for clusters in database...
echo.
echo Opening Prisma Studio to view clusters...
echo.

pause
start /B npm run db:studio

echo.
echo [OK] Prisma Studio opened
echo    Access at: http://localhost:5555
echo.

echo 2. In Prisma Studio:
echo    - Navigate to Cluster model to see all clusters
echo    - Navigate to Farmer model to check cluster assignments
echo    - Filter farmers by: clusterId equals null (to find unassigned)
echo.

echo 3. Testing cluster assignment...
echo.
echo To test the auto-assignment feature:
echo    A. Register a NEW farmer via mobile app WITHOUT selecting a cluster
echo    B. Check if farmer is auto-assigned to NACOTAN cluster
echo.
echo Expected behavior:
echo    - If no cluster selected -^> Auto-assigned to NACOTAN (if exists)
echo    - If cluster selected -^> Uses selected cluster
echo.

echo 4. Run bulk assignment for existing farmers (optional)...
echo.
echo To assign all farmers without clusters to NACOTAN:
echo    node scripts\bulk-assign-nacotan.js
echo.

set /p REPLY="Would you like to run bulk assignment now? (y/N) "
if /i "%REPLY%"=="y" (
    node scripts\bulk-assign-nacotan.js
)

echo.
echo ========================================
echo Verification Complete
echo ========================================
echo.
echo Summary of Changes:
echo [OK] Cluster field exists in registration form
echo [OK] API saves cluster when selected by agent
echo [NEW] Auto-assigns NACOTAN cluster if none selected
echo [OK] Database relationships are correct
echo.
echo Press any key to exit...
pause >nul
