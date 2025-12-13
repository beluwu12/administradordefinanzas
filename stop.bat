@echo off
REM ══════════════════════════════════════════════════════════════
REM  PERSONAL FINANCE APP - Stop Script
REM  Detiene todos los procesos de Node.js relacionados con la app
REM ══════════════════════════════════════════════════════════════

echo.
echo  ╔═══════════════════════════════════════════════════════╗
echo  ║       💰 Personal Finance App - Stopping...           ║
echo  ╚═══════════════════════════════════════════════════════╝
echo.

REM Kill Node.js processes (backend)
echo [1/2] 🛑 Stopping Backend (Node.js)...
taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo       ✅ Node.js processes terminated
) else (
    echo       ⚠️  No Node.js processes found
)

REM Kill any remaining npm processes
echo [2/2] 🛑 Stopping Frontend (npm/vite)...
taskkill /F /FI "WINDOWTITLE eq Finance-Frontend*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Finance-Backend*" 2>nul

echo.
echo  ╔═══════════════════════════════════════════════════════╗
echo  ║  ✅ App Stopped Successfully!                         ║
echo  ╠═══════════════════════════════════════════════════════╣
echo  ║  All services have been terminated.                   ║
echo  ║  To restart: run start.bat                            ║
echo  ╚═══════════════════════════════════════════════════════╝
echo.

pause
