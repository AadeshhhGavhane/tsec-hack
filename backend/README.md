# TSEC Hack Backend - Authentication API

A basic authentication backend built with Express.js, featuring JWT-based authentication, password hashing with bcrypt, and input validation.

## Features

- ✅ User registration and login
- ✅ JWT token-based authentication
- ✅ Password hashing with bcrypt
- ✅ Input validation with express-validator
- ✅ Protected routes middleware
- ✅ CORS enabled for frontend integration
- ✅ Error handling and logging
- ✅ In-memory user storage (easily replaceable with database)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "1234567890",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST `/api/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "1234567890",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### GET `/api/auth/me`
Get current user information (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1234567890",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### POST `/api/auth/logout`
Logout user (client-side token removal).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### PUT `/api/auth/profile`
Update user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com"
}
```

### Protected Routes (`/api/protected`)

#### GET `/api/protected/dashboard`
Access dashboard data (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

#### GET `/api/protected/test`
Test protected route (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

### Utility Routes

#### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

## Authentication

This API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Password Requirements

- Minimum 6 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional validation errors
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `500` - Internal Server Error

## Configuration

The server configuration is managed in `config.js`. You can set environment variables:

- `PORT` - Server port (default: 5000)
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRES_IN` - Token expiration time (default: 7d)
- `NODE_ENV` - Environment (development/production)

## Development

The server includes:
- Auto-restart in development mode (`npm run dev`)
- Request logging
- CORS enabled for frontend integration
- Comprehensive error handling

## Security Notes

- Passwords are hashed using bcrypt with 12 salt rounds
- JWT tokens expire after 7 days by default
- Input validation prevents common attacks
- CORS is configured for frontend integration

## Next Steps

To make this production-ready, consider:
- Adding a database (MongoDB, PostgreSQL, etc.)
- Implementing refresh tokens
- Adding rate limiting
- Setting up proper logging
- Adding email verification
- Implementing password reset functionality
