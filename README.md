# Node.js Full-Stack Application Template

## Overview
This project is a full-stack application template designed to streamline the development of modern web applications. It includes a Node.js backend, a React-based frontend, and a MySQL database. The template is structured to support scalable, secure, and feature-rich applications with a focus on modularity and maintainability.

## Features
### Backend
- **Express.js RESTful API**: Provides a robust and scalable API for handling requests.
- **Authentication**: Secure user authentication using JWT tokens and bcrypt for password hashing.
- **Database Integration**: MySQL database with a normalized schema and support for JSON data storage.
- **Email Integration**: Gmail OAuth for email extraction and processing.
- **Geocoding Service**: Integration with Nominatim API for location-based data.
- **Modular Design**: Organized routes, services, and utilities for maintainability.

### Frontend
- **React Framework**: Modern, component-based architecture for building dynamic user interfaces.
- **Responsive Design**: Mobile-friendly and accessible UI built with Bootstrap.
- **OAuth Integration**: Seamless Gmail authentication flow.
- **Role-Based Access Control**: Organizer and member roles with tailored permissions.
- **Interactive Components**: Includes modals, dashboards, and dynamic forms.

### Database
- **MySQL**: Relational database with support for structured JSON fields.
- **Schema**: Predefined schema for users, trips, events, and members.
- **Data Integrity**: Duplicate detection and validation mechanisms.

## Project Structure
```
node-app-template/
├── backend/             # Backend API and services
│   ├── routes/          # API route handlers
│   ├── services/        # Utility services (e.g., geocoding, email extraction)
│   ├── utils/           # Helper functions
│   ├── server.js        # Main server file
│   └── database_schema.sql # SQL schema for database setup
├── frontend/            # React frontend
│   ├── src/             # React components and pages
│   ├── public/          # Static assets
│   ├── vite.config.js   # Vite configuration
│   └── package.json     # Frontend dependencies
├── email_extractor/     # Python-based email extraction service
│   ├── services/        # Gmail API integration
│   ├── extractors/      # Booking and email parsers
│   └── requirements.txt # Python dependencies
└── README.md            # Project documentation
```

## Setup Instructions
### Prerequisites
- Node.js (v16 or higher)
- MySQL database
- Python (v3.8 or higher)

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Rename `.env.example` to `.env`.
   - Update the placeholders with your database credentials and JWT secret.
4. Set up the database:
   - Use MySQL Workbench or a similar tool to execute the `database_schema.sql` file.
5. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

### Email Extractor Setup
1. Navigate to the `email_extractor` directory:
   ```bash
   cd email_extractor
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the email extractor service:
   ```bash
   python main.py
   ```

## API Endpoints
### Authentication
- `POST /api/auth/login`: User login.
- `POST /api/auth/register`: User registration.

### Trips
- `GET /api/trips`: Fetch all trips.
- `POST /api/trips`: Create a new trip.
- `DELETE /api/trips/:tripId`: Delete a trip.

### Members
- `GET /api/trips/:tripId/members`: Get trip members.
- `POST /api/trips/:tripId/members/invitations`: Invite members.

### Events
- `POST /api/trips/:tripId/events`: Add an event to a trip.
- `DELETE /api/trips/:tripId/events/:eventId`: Remove an event.

## Future Enhancements
- Add unit and integration tests for backend and frontend.
- Implement a notification system for trip updates.
- Enhance geocoding with additional providers for redundancy.
- Improve UI/UX with animations and advanced styling.

---
This project is actively maintained. Contributions and feedback are welcome!
Made my: Kantemir Muratov, Pranav, Tate
