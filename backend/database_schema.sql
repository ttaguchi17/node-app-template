-- database_schema.sql

-- Drop tables if they exist to start fresh
-- (Order matters due to foreign keys)
DROP TABLE IF EXISTS expense_splits;
DROP TABLE IF EXISTS settlements;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS invitations;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS gmail_tokens; -- Dropping old table if it exists
DROP TABLE IF EXISTS itinerary_event;
DROP TABLE IF EXISTS trip_membership;
DROP TABLE IF EXISTS trip;
DROP TABLE IF EXISTS user;

-- 1. User Table
CREATE TABLE user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255), -- Added for "Welcome, Kante"
    password VARCHAR(255) NOT NULL,
    gmail_tokens JSON, -- Added to match your gmail.js logic
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Trip Table
CREATE TABLE trip (
    trip_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    location_input VARCHAR(255),
    location_display_name VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TripMembership (Links Users to Trips)
CREATE TABLE trip_membership (
    membership_id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    user_id INT,
    role VARCHAR(50) DEFAULT 'member',
    status VARCHAR(50) DEFAULT 'accepted',
    invited_by_user_id INT,
    invited_at TIMESTAMP,
    invited_email VARCHAR(255),
    
    -- New: Individual Budget Goal
    budget_goal DECIMAL(10, 2) DEFAULT 1000.00, 

    FOREIGN KEY (trip_id) REFERENCES trip(trip_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(user_id),
    FOREIGN KEY (invited_by_user_id) REFERENCES user(user_id),
    INDEX (trip_id, user_id),
    INDEX (status)
);

-- 4. ItineraryEvent Table
CREATE TABLE itinerary_event (
    event_id INT AUTO_INCREMENT PRIMARY KEY, 
    trip_id INT NOT NULL, 
    title VARCHAR(255) NOT NULL, 
    type ENUM('Flight', 'Hotel', 'Activity', 'Transport', 'Other') DEFAULT 'Other',
    start_time DATETIME, 
    end_time DATETIME, 
    location_input VARCHAR(255),
    location_display_name VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    cost DECIMAL(10, 2) DEFAULT 0.00, -- Added for budget calculations
    details JSON, -- Changed to JSON for better querying
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    
    -- ✅ New: Created By (links to user table)
    created_by INT NULL,
    
    -- ✅ New: Privacy flag (default public/false)
    is_private BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (trip_id) REFERENCES trip(trip_id) ON DELETE CASCADE,
    CONSTRAINT fk_event_creator FOREIGN KEY (created_by) REFERENCES user(user_id)
);

-- 5. Notifications Table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_user_id INT NOT NULL,
    trip_id INT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    body TEXT,
    metadata JSON,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (recipient_user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trip(trip_id) ON DELETE CASCADE,
    INDEX (recipient_user_id, is_read),
    INDEX (created_at)
);

-- 6. Invitations Table
CREATE TABLE invitations (
    invitation_id INT AUTO_INCREMENT PRIMARY KEY, -- Renamed from 'id' for clarity
    trip_id INT NOT NULL,
    invited_user_id INT,
    invited_email VARCHAR(255),
    invited_by_user_id INT NOT NULL,
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL,
    
    FOREIGN KEY (trip_id) REFERENCES trip(trip_id) ON DELETE CASCADE,
    FOREIGN KEY (invited_user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by_user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    INDEX (invited_user_id, status),
    INDEX (invited_email, status)
);

-- 7. Expenses Table (New)
CREATE TABLE expenses (
    expense_id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    paid_by_user_id INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) DEFAULT 'other',
    date_incurred DATE NOT NULL,
    event_id INT NULL, 
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (trip_id) REFERENCES trip(trip_id) ON DELETE CASCADE,
    FOREIGN KEY (paid_by_user_id) REFERENCES user(user_id),
    FOREIGN KEY (event_id) REFERENCES itinerary_event(event_id) ON DELETE SET NULL
);

-- 8. Expense Splits Table (New)
CREATE TABLE expense_splits (
    split_id INT AUTO_INCREMENT PRIMARY KEY,
    expense_id INT NOT NULL,
    owed_by_user_id INT NOT NULL,
    amount_owed DECIMAL(10, 2) NOT NULL,
    
    FOREIGN KEY (expense_id) REFERENCES expenses(expense_id) ON DELETE CASCADE,
    FOREIGN KEY (owed_by_user_id) REFERENCES user(user_id)
);

-- 9. Settlements Table (New)
CREATE TABLE settlements (
    settlement_id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    date_paid TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (trip_id) REFERENCES trip(trip_id) ON DELETE CASCADE,
    FOREIGN KEY (from_user_id) REFERENCES user(user_id),
    FOREIGN KEY (to_user_id) REFERENCES user(user_id)
);
