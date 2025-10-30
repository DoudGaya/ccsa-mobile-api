@echo off
REM Farm Polygon Fix - Verification Test Script (Windows)
REM This script helps verify that polygon data is being saved correctly

echo ======================================
echo Farm Polygon Fix - Verification Test
echo ======================================
echo.

echo This script will help verify the polygon fix is working.
echo.

REM Check if we're in the API directory
if not exist "package.json" (
    echo Error: Must run from ccsa-mobile-api directory
    exit /b 1
)

echo 1. Checking if API server is running...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] API server is running
) else (
    echo [WARNING] API server not detected. Start it with: npm run dev
    echo.
    pause
)

echo.
echo 2. Opening Prisma Studio to view database...
echo    In Prisma Studio, navigate to the Farm model to check polygon data
echo.
pause
start /B npm run db:studio
echo [OK] Prisma Studio opened
echo    Access at: http://localhost:5555
echo.

echo 3. Test Checklist:
echo    After creating a farm with polygon data from the mobile app:
echo.
echo    [ ] farmPolygon field contains JSON array (not null)
echo    [ ] farmPolygon has latitude/longitude values
echo    [ ] farmSize is calculated automatically
echo    [ ] Farm displays on map in admin dashboard
echo.
echo    Example farmPolygon value:
echo    [{"latitude": 9.082, "longitude": 7.486, "timestamp": 1698561234, "accuracy": 5}]
echo.

echo 4. Sample SQL Query to check recent farms:
echo.
echo    Run this in your database client:
echo    SELECT id, "farmerId", "farmSize", "farmPolygon" IS NOT NULL as has_polygon
echo    FROM "Farm" ORDER BY "createdAt" DESC LIMIT 5;
echo.

pause

echo.
echo ======================================
echo Verification Steps Complete
echo ======================================
echo.
echo Next steps:
echo 1. Use the mobile app to add a new farm with polygon boundary
echo 2. Check Prisma Studio or database to verify farmPolygon is saved
echo 3. View the farm in admin dashboard to see polygon rendered on map
echo.
echo If farmPolygon shows data instead of null, the fix is working!
echo.
echo Press any key to exit...
pause >nul
