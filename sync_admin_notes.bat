@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync_admin_notes.ps1" %*
exit /b %ERRORLEVEL%
