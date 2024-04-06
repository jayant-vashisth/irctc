
CREATE TABLE users (
  userid SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  isAdmin BOOLEAN,
  API_key VARCHAR(60),
  date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE timetable (
    timetable_id SERIAL PRIMARY KEY,
    train_no VARCHAR(20),
    station_code VARCHAR(10),
    arrival VARCHAR,
    departure VARCHAR,
    seats_available INT CHECK (seats_available >= 0),
    total_seats INT,
    CONSTRAINT unique_train_station_code UNIQUE (train_no, station_code)
);


CREATE TABLE trains (
    train_no VARCHAR(20) PRIMARY KEY,
    train_name VARCHAR(255),
    total_seats INT
);

CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    userid INT,
    train_no VARCHAR(20),
    source_station VARCHAR(100),
    destination_station VARCHAR(100),
    status VARCHAR(10)
 );


