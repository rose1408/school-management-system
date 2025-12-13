@echo off
echo 🛡️ Emergency Design Recovery Script 🛡️
echo.
echo This script will restore the beautiful blue-purple design
echo if it gets accidentally broken during development.
echo.
pause

echo Backing up current file...
copy "src\app\teachers\page.tsx" "src\app\teachers\page_before_restore.tsx" 2>nul

echo Restoring beautiful design...
copy "src\app\teachers\page_beautiful_backup.tsx" "src\app\teachers\page.tsx"

echo.
echo ✅ Beautiful design restored successfully!
echo 🌐 Check localhost:3001/teachers to see the restored design
echo.
echo 📝 The previous version was saved as: page_before_restore.tsx
echo.
pause