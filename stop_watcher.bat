@echo off
curl -s -X POST http://localhost:3001/api/admin/watcher/stop -H "x-admin-key: velora-admin-2025"
echo.
echo Watcher stopped.
pause
