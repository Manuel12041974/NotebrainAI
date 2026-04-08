@echo off
title NotebrainAI
cd /d "%~dp0"

:: Check if server is already running
powershell -Command "try { $null = Invoke-WebRequest -Uri 'http://localhost:3002' -TimeoutSec 2 -UseBasicParsing; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% == 0 (
    start "" "http://localhost:3002"
    exit /b 0
)

:: Start the web dev server on port 3002
start "" /min cmd /c "cd /d "%~dp0" && pnpm --filter web exec next dev --port 3002 2>&1 | more"

echo Launching NotebrainAI...
set /a tries=0
:wait
set /a tries+=1
if %tries% gtr 15 goto open
timeout /t 2 /nobreak >nul
powershell -Command "try { $null = Invoke-WebRequest -Uri 'http://localhost:3002' -TimeoutSec 1 -UseBasicParsing; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% neq 0 goto wait

:open
start "" "http://localhost:3002"
