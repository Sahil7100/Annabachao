# AnnaBachao Authentication System

## Overview
Secure JWT-based authentication system with role-based access control for the AnnaBachao food waste management application.

## Features
- ✅ User registration and login
- ✅ Password hashing with bcrypt
- ✅ JWT token generation and verification
- ✅ Role-based access control (admin, user, ngo)
- ✅ Request validation middleware
- ✅ Comprehensive error handling
- ✅ Account activation/deactivation support

## User Roles

### 1. **Admin** (`admin`)
- Full system access
- Can manage users and NGOs
- Access to admin dashboard
- Can view all reports and analytics

### 2. **User** (`user`)
- Default role for regular users
- Can browse and request food donations
- Access to basic user features
- Can view personal profile and history

### 3. **NGO** (`ngo`)
- Can manage food donations
- Access to NGO management panel
- Can view donation reports
- Can coordinate with restaurants and users

## API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/register`
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user" // optional: admin, user, ngo (default: user)
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### POST `/api/auth/login`
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### GET `/api/auth/me`
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "User profile retrieved successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "isActive": true,
    "profile": {
      "phone": null,
      "address": null
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Admin Routes (`/api/admin`)

All admin routes require authentication and appropriate role permissions.

#### GET `/api/admin/dashboard`
Admin dashboard (admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

#### GET `/api/admin/ngo-management`
NGO management panel (NGO and admin access).

**Headers:**
```
Authorization: Bearer <ngo_or_admin_token>
```

#### GET `/api/admin/test-roles`
Test role-based permissions.

**Headers:**
```
Authorization: Bearer <any_valid_token>
```

## Middleware

### Authentication Middleware
- `authenticateToken` - Verifies JWT token and loads user data
- `authorize(...roles)` - Checks if user has required roles
- `adminOnly` - Admin role required
- `ngoAndAdmin` - NGO or admin role required
- `userAndAbove` - Any authenticated user

### Validation Middleware
- `validateRegistration` - Validates registration data
- `validateLogin` - Validates login data
- `validateObjectId` - Validates MongoDB ObjectId parameters

## Security Features

### Password Security
- Passwords are hashed using bcrypt with salt rounds of 10
- Minimum password length: 6 characters
- Maximum password length: 128 characters
- Passwords are never returned in API responses

### JWT Security
- Tokens expire in 7 days (configurable)
- Includes issuer and audience claims
- Secure token verification with proper error handling
- Token refresh mechanism (can be implemented)

### Input Validation
- Email format validation
- Required field validation
- Data sanitization and normalization
- SQL injection prevention through Mongoose ODM

### Error Handling
- Comprehensive error messages with error codes
- No sensitive information leaked in production
- Proper HTTP status codes
- Detailed logging for debugging

## Usage Examples

### Register a new user:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "password123",
    "role": "ngo"
  }'
```

### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "password123"
  }'
```

### Access protected route:
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your_token_here>"
```

### Test role-based access:
```bash
curl -X GET http://localhost:5000/api/admin/test-roles \
  -H "Authorization: Bearer <your_token_here>"
```

## Environment Variables

Required environment variables in `.env`:

```env
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## Error Codes

| Code | Description |
|------|-------------|
| `TOKEN_MISSING` | Authorization header missing or invalid |
| `TOKEN_INVALID` | JWT token is malformed or invalid |
| `TOKEN_EXPIRED` | JWT token has expired |
| `USER_NOT_FOUND` | User associated with token not found |
| `ACCOUNT_DEACTIVATED` | User account is deactivated |

## Database Schema

### User Model
```javascript
{
  name: String (required, max 50 chars),
  email: String (required, unique, lowercase),
  password: String (required, min 6 chars, hashed),
  role: String (enum: ['admin', 'user', 'ngo'], default: 'user'),
  isActive: Boolean (default: true),
  profile: {
    phone: String,
    address: Object
  },
  timestamps: true
}
```

## Testing

The authentication system can be tested using the provided endpoints. Make sure to:

1. Start the server: `npm run dev`
2. Test registration with different roles
3. Test login with valid/invalid credentials
4. Test protected routes with valid/invalid tokens
5. Test role-based access with different user types

## Future Enhancements

- [ ] Password reset functionality
- [ ] Email verification
- [ ] Two-factor authentication
- [ ] Refresh token mechanism
- [ ] Rate limiting for auth endpoints
- [ ] Account lockout after failed attempts
- [ ] Session management
