@echo off
echo ==========================================
echo   TRIP APP EMAIL EXTRACTOR SETUP (v1.0)
echo ==========================================

REM 1. Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in your PATH.
    echo Please install Python 3.10+ and try again.
    pause
    exit /b
)

REM 2. Check if venv exists, if not, create it
if not exist "venv" (
    echo [INFO] Creating virtual environment...
    python -m venv venv
)

REM 3. Activate venv
call venv\Scripts\activate

REM 4. Install dependencies
echo [INFO] Checking/Installing dependencies...
pip install -r requirements.txt

REM 5. Start the Server
echo.
echo [SUCCESS] Environment ready. Starting server...
echo.
python -m uvicorn main:app --reload --port 8000