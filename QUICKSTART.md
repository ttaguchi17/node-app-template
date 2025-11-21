# Quick Start Guide

## Prerequisites
Before running the project, make sure you have:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.9-3.12, NOT 3.13+) - [Download](https://www.python.org/downloads/)
- **MySQL** database running locally

## Option 1: Start Everything at Once (Recommended)

Simply double-click `START_ALL.bat` in the project root.

This will open 3 terminal windows:
- **Backend** (Express API) - http://localhost:3000
- **Frontend** (React) - http://localhost:5173
- **Email Extractor** (Python FastAPI) - http://localhost:8000

## Option 2: Start Services Individually

### Backend Only
1. Navigate to `backend` folder
2. Double-click `start_backend.bat`
3. Backend will run on http://localhost:3000

### Frontend Only
1. Navigate to `frontend` folder
2. Double-click `start_frontend.bat`
3. Frontend will run on http://localhost:5173

### Email Extractor Only
1. Navigate to `email_extractor` folder
2. Double-click `start_server.bat`
3. Service will run on http://localhost:8000

## First Time Setup

### Database Setup
1. Open MySQL Workbench
2. Execute the SQL script in `backend/database_schema.sql`
3. Update `backend/.env` with your database credentials

### Environment Variables
Copy the example files and fill in your credentials:
- `backend/.env.example` → `backend/.env`
- `email_extractor/.env.example` → `email_extractor/.env`

## Troubleshooting

### Port Already in Use
If you get errors about ports being in use:
- **Port 3000** (Backend): Stop other Node.js processes
- **Port 5173** (Frontend): Stop other Vite servers
- **Port 8000** (Email Extractor): Stop other Python services

### Python Version Issues
If you get errors with Python packages:
- Make sure you're using Python 3.9-3.12 (NOT 3.13+)
- Delete `email_extractor/venv` folder and run `start_server.bat` again

### Node Modules Issues
If you get dependency errors:
- Delete `node_modules` folder in backend or frontend
- Run the startup script again to reinstall

## Stopping Services
Simply close each terminal window to stop the services.
