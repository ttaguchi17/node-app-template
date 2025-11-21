@echo off
color 0A
echo ==========================================
echo   TRIP APP - COMPLETE STARTUP
echo ==========================================
echo.
echo This will start all 3 services:
echo   1. Backend (Node.js/Express)
echo   2. Frontend (React/Vite)
echo   3. Email Extractor (Python/FastAPI)
echo.
echo Press any key to continue or CTRL+C to cancel...
pause >nul

REM Create a timestamp for the log
set LOG_DIR=logs
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

echo.
echo [INFO] Starting all services in separate windows...
echo.

REM Start Backend
echo [1/3] Starting Backend Server...
start "TRIP APP - Backend" cmd /k "cd /d %~dp0backend && start_backend.bat"
timeout /t 2 >nul

REM Start Frontend
echo [2/3] Starting Frontend Server...
start "TRIP APP - Frontend" cmd /k "cd /d %~dp0frontend && start_frontend.bat"
timeout /t 2 >nul

REM Start Email Extractor
echo [3/3] Starting Email Extractor...
start "TRIP APP - Email Extractor" cmd /k "cd /d %~dp0email_extractor && start_server.bat"
timeout /t 2 >nul

echo.
echo ==========================================
echo   ALL SERVICES STARTED!
echo ==========================================
echo.
echo Open your browser and navigate to:
echo   - Frontend:        http://localhost:5173
echo   - Backend:         http://localhost:3000
echo   - Email Extractor: http://localhost:8000
echo.
echo To stop all services, close each terminal window.
echo.
echo Press any key to exit this window...
pause >nul
