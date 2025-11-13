-- database_schema.sql

-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS trip_membership;
DROP TABLE IF EXISTS trip;
DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS itinerary_event;

-- 1. Create the updated User table with a user_id
CREATE TABLE user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create the Trip table
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

-- 3. Create the TripMembership table (many-to-many relationship)
CREATE TABLE trip_membership (
    membership_id INT AUTO_INCREMENT PRIMARY KEY,
    trip_id INT NOT NULL,
    user_id INT NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    FOREIGN KEY (trip_id) REFERENCES trip(trip_id),
    FOREIGN KEY (user_id) REFERENCES user(user_id)
);
-- 4. Create the ItineraryEvent table
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
    details TEXT, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 

    
    FOREIGN KEY (trip_id) REFERENCES trip(trip_id) ON DELETE CASCADE
);

-- 5. Create the GmailTokens table to store OAuth tokens
CREATE TABLE gmail_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry DATETIME,
  scope VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- This links the token to your 'user' table
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
  
  -- This ensures one user can only have one row of tokens
  UNIQUE KEY (user_id) 
);