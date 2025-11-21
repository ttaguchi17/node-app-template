@echo off
echo ==========================================
echo   TRIP APP - FRONTEND SERVER SETUP
echo ==========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo Please install Node.js and try again.
    pause
    exit /b
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
) else (
    echo [INFO] Dependencies already installed. Checking for updates...
    call npm install
)

REM Start the frontend server
echo.
echo [SUCCESS] Environment ready. Starting frontend server...
echo.
call npm run dev