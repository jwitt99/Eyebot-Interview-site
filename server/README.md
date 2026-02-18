# Backend API Documentation

## Overview
Node.js Express server for managing user data from `users.json`.

## Setup

### Install Dependencies
```bash
npm install
```

### Start Server
```bash
npm run server
```

Server runs on `http://localhost:3001`

## API Endpoints

### 1. Get Active Users
**GET** `/api/users/active`

Returns all users with status "online".

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "username": "john_doe",
      "browser": "Chrome 120.0.0",
      "status": "online"
    }
  ]
}
```

### 2. Get All Usernames
**GET** `/api/users/usernames`

Returns a list of all usernames.

**Response:**
```json
{
  "usernames": ["john_doe", "jane_smith", "mike_johnson"]
}
```

### 3. Get All Users
**GET** `/api/users`

Returns complete user data.

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "username": "john_doe",
      "browser": "Chrome 120.0.0",
      "status": "online"
    }
  ]
}
```

### 4. Create New User
**POST** `/api/users`

Adds a new user to the users list.

**Request Body:**
```json
{
  "username": "new_user",
  "browser": "Firefox 121.0",
  "status": "online"
}
```

**Success Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": 9,
    "username": "new_user",
    "browser": "Firefox 121.0",
    "status": "online"
  }
}
```

**Error Responses:**
- `400`: Missing required fields (username or browser)
- `409`: Username already exists
- `500`: Server error

## Features

- ✅ CORS enabled for frontend integration
- ✅ JSON body parsing
- ✅ File-based persistence (users.json)
- ✅ Automatic ID generation
- ✅ Username uniqueness validation
- ✅ Case-insensitive username checking
