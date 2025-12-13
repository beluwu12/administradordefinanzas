@echo off
REM ══════════════════════════════════════════════════════════════
REM  PERSONAL FINANCE APP - Start Script
REM  Inicia el servidor backend y el cliente frontend
REM ══════════════════════════════════════════════════════════════

echo.
echo  ╔═══════════════════════════════════════════════════════╗
echo  ║       💰 Personal Finance App - Starting...           ║
echo  ╚═══════════════════════════════════════════════════════╝
echo.

REM Get the directory where the script is located
set "ROOT_DIR=%~dp0"

REM Start Backend
echo [1/2] 🚀 Starting Backend Server...
cd /d "%ROOT_DIR%server"
start "Finance-Backend" cmd /k "node index.js"

REM Wait a bit for backend to start
timeout /t 3 /nobreak > nul

REM Start Frontend
echo [2/2] 🎨 Starting Frontend Client...
cd /d "%ROOT_DIR%client"
start "Finance-Frontend" cmd /k "npm run dev -- --host"

echo.
echo  ╔═══════════════════════════════════════════════════════╗
echo  ║  ✅ App Started Successfully!                         ║
echo  ╠═══════════════════════════════════════════════════════╣
echo  ║  Frontend: http://localhost:5173                      ║
echo  ║  Backend:  http://localhost:3000                      ║
echo  ║  Health:   http://localhost:3000/api/health           ║
echo  ╠═══════════════════════════════════════════════════════╣
echo  ║  To stop: run stop.bat                                ║
echo  ╚═══════════════════════════════════════════════════════╝
echo.

pause
