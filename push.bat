@echo off
setlocal enabledelayedexpansion

:: Read current count
set count=0
if exist commit_count.txt (
  for /f %%i in (commit_count.txt) do set count=%%i
)
set /a count=%count%+1
set /a seed=6174829301 + (%count% * 1000)

:: Write new count
echo %count%> commit_count.txt

:: Ask for commit message
set /p msg=Commit message (Enter for auto):
if "!msg!"=="" set msg=push #%count%

:: Git
git add -A
git commit -m "!msg! [#%count% seed:%seed%]"
git push origin master

:: Open Railway
start https://the-grid-production-ce9c.up.railway.app

echo.
echo Pushed: !msg! [#%count% seed:%seed%]
pause
