# AnnaBachao Donation API

## Overview
Comprehensive donation management system for the AnnaBachao food waste management application. Includes donation creation, NGO assignment, status tracking, and admin management features.

## Features
- ✅ Donation creation with validation
- ✅ Freshness validation (24-hour limit)
- ✅ Location-based NGO assignment
- ✅ Status tracking (pending → assigned → picked → delivered)
- ✅ Admin dashboard with statistics
- ✅ Batch assignment capabilities
- ✅ Role-based access control

## Models

### Donation Model
```javascript
{
  donorId: ObjectId (ref: User),
  ngoId: ObjectId (ref: User, optional),
  foodItem: String (required, max 100 chars),
  quantity: Number (required, 1-1000),
  quantityUnit: String (servings|plates|boxes|kg|pieces),
  cookedTime: Date (required),
  expiryTime: Date (auto-calculated if not provided),
  location: {
    lat: Number (-90 to 90),
    lng: Number (-180 to 180),
    address: String (required),
    city: String (required)
  },
  status: String (pending|assigned|picked|delivered|expired|cancelled),
  photoURL: String (optional, image URL),
  description: String (optional, max 500 chars),
  pickupInstructions: String (optional, max 300 chars),
  assignedAt: Date,
  pickedAt: Date,
  deliveredAt: Date,
  notes: [{
    text: String,
    addedBy: ObjectId,
    addedAt: Date
  }],
  timestamps: true
}
```

## API Endpoints

### Donation Routes (`/api/donations`)

All donation routes require authentication.

#### POST `/api/donations/create`
Create a new food donation.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "foodItem": "Vegetable Biryani",
  "quantity": 25,
  "quantityUnit": "servings",
  "cookedTime": "2024-01-15T12:00:00.000Z",
  "expiryTime": "2024-01-15T18:00:00.000Z",
  "location": {
    "lat": 28.6139,
    "lng": 77.2090,
    "address": "123 Main Street, Connaught Place",
    "city": "New Delhi"
  },
  "photoURL": "https://example.com/food-image.jpg",
  "description": "Fresh vegetable biryani prepared this morning",
  "pickupInstructions": "Ring doorbell, ask for kitchen staff"
}
```

**Response:**
```json
{
  "message": "Donation created successfully",
  "donation": {
    "_id": "507f1f77bcf86cd799439011",
    "donorId": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "ngoId": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Food Bank NGO",
      "email": "ngo@foodbank.org",
      "role": "ngo"
    },
    "foodItem": "Vegetable Biryani",
    "quantity": 25,
    "quantityUnit": "servings",
    "status": "assigned",
    "assignedAt": "2024-01-15T12:30:00.000Z",
    "createdAt": "2024-01-15T12:15:00.000Z"
  }
}
```

#### GET `/api/donations/available`
Get available donations for NGOs to browse.

**Headers:**
```
Authorization: Bearer <ngo_or_admin_token>
```

**Query Parameters:**
- `lat` (required): Latitude
- `lng` (required): Longitude  
- `maxDistance` (optional): Maximum distance in km (default: 10)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example:**
```
GET /api/donations/available?lat=28.6139&lng=77.2090&maxDistance=15&page=1&limit=5
```

**Response:**
```json
{
  "message": "Available donations retrieved successfully",
  "donations": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "foodItem": "Vegetable Biryani",
      "quantity": 25,
      "status": "pending",
      "location": {
        "lat": 28.6139,
        "lng": 77.2090,
        "city": "New Delhi"
      },
      "donorId": {
        "name": "John Doe"
      }
    }
  ],
  "pagination": {
    "current": 1,
    "pages": 3,
    "total": 25
  }
}
```

#### GET `/api/donations/user/:id`
Get donations by user ID (donor).

**Headers:**
```
Authorization: Bearer <token>
```

**Path Parameters:**
- `id`: User ID

**Query Parameters:**
- `status` (optional): Filter by status
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "message": "Donations retrieved successfully",
  "donations": [...],
  "pagination": {
    "current": 1,
    "pages": 2,
    "total": 15
  }
}
```

#### GET `/api/donations/ngo/:id`
Get donations assigned to a specific NGO.

**Headers:**
```
Authorization: Bearer <ngo_or_admin_token>
```

**Path Parameters:**
- `id`: NGO ID

**Response:**
```json
{
  "message": "NGO donations retrieved successfully",
  "donations": [...],
  "pagination": {...}
}
```

#### PUT `/api/donations/update/:id`
Update donation status.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Path Parameters:**
- `id`: Donation ID

**Request Body:**
```json
{
  "status": "picked",
  "notes": "Successfully picked up from donor"
}
```

**Response:**
```json
{
  "message": "Donation updated successfully",
  "donation": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "picked",
    "pickedAt": "2024-01-15T14:00:00.000Z",
    "notes": [...]
  }
}
```

### Admin Routes (`/api/admin`)

#### GET `/api/admin/dashboard`
Get comprehensive dashboard statistics.

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "message": "Dashboard statistics retrieved successfully",
  "stats": {
    "donations": {
      "total": 150,
      "pending": 12,
      "assigned": 8,
      "delivered": 125,
      "expired": 5,
      "recent": 25
    },
    "users": {
      "total": 45,
      "ngos": 8,
      "activeNGOs": 7
    },
    "topNGOs": [
      {
        "ngoName": "Food Bank NGO",
        "ngoEmail": "ngo@foodbank.org",
        "deliveredCount": 45
      }
    ]
  }
}
```

#### GET `/api/admin/donations`
Get all donations with admin filters.

**Query Parameters:**
- `status`: Filter by status
- `page`: Page number
- `limit`: Items per page
- `sortBy`: Sort field (default: createdAt)
- `sortOrder`: Sort order (asc|desc)

#### PUT `/api/admin/donations/:id/status`
Update donation status (admin override).

**Request Body:**
```json
{
  "status": "delivered",
  "notes": "Admin override - delivered to community center"
}
```

#### POST `/api/admin/donations/batch-assign`
Batch assign NGOs to multiple donations.

**Request Body:**
```json
{
  "donationIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012"
  ]
}
```

#### POST `/api/admin/donations/reassign`
Reassign failed or expired donations.

**Response:**
```json
{
  "message": "Reassignment process completed",
  "result": {
    "message": "Reassigned 3 out of 5 donations",
    "reassigned": 3,
    "results": [...]
  }
}
```

#### GET `/api/admin/ngo/:id/stats`
Get assignment statistics for a specific NGO.

**Response:**
```json
{
  "message": "NGO statistics retrieved successfully",
  "ngo": {
    "id": "507f1f77bcf86cd799439013",
    "name": "Food Bank NGO",
    "email": "ngo@foodbank.org"
  },
  "stats": {
    "totalAssignments": 45,
    "pendingAssignments": 3,
    "statusBreakdown": [...],
    "efficiency": "93.33"
  }
}
```

## Validation Rules

### Donation Creation
- **foodItem**: Required, string, max 100 characters
- **quantity**: Required, number, 1-1000
- **cookedTime**: Required, cannot be in future, max 24 hours old
- **location**: Required lat/lng/address/city
- **photoURL**: Optional, must be valid image URL
- **description**: Optional, max 500 characters
- **pickupInstructions**: Optional, max 300 characters

### Status Transitions
```
pending → assigned, cancelled, expired
assigned → picked, cancelled, expired  
picked → delivered, cancelled
delivered → (final state)
expired → (final state)
cancelled → (final state)
```

## NGO Assignment Algorithm

### Current Implementation
1. Find NGOs within 20km radius
2. Calculate distance using Haversine formula
3. Assign to closest available NGO

### Future Enhancement (Dijkstra Algorithm)
- Consider current NGO workload
- Optimize for batch pickups
- Factor in traffic conditions
- Account for NGO capacity limits

## Error Handling

### Common Error Codes
- `VALIDATION_FAILED`: Input validation errors
- `DONATION_NOT_FOUND`: Donation doesn't exist
- `ACCESS_DENIED`: Insufficient permissions
- `INVALID_STATUS_TRANSITION`: Invalid status change
- `FOOD_TOO_OLD`: Food exceeds 24-hour freshness limit

### Example Error Response
```json
{
  "message": "Validation failed",
  "errors": [
    "Food item is required and must be a string",
    "Quantity must be at least 1"
  ]
}
```

## Usage Examples

### Create Donation
```bash
curl -X POST http://localhost:5000/api/donations/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "foodItem": "Rice and Curry",
    "quantity": 20,
    "cookedTime": "2024-01-15T12:00:00.000Z",
    "location": {
      "lat": 28.6139,
      "lng": 77.2090,
      "address": "123 Main St",
      "city": "New Delhi"
    }
  }'
```

### Update Donation Status
```bash
curl -X PUT http://localhost:5000/api/donations/update/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "picked",
    "notes": "Picked up successfully"
  }'
```

### Get Dashboard Stats
```bash
curl -X GET http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer <admin_token>"
```

## Security Features

- JWT authentication required for all endpoints
- Role-based access control (admin, ngo, user)
- Input validation and sanitization
- Freshness validation prevents old food donations
- Status transition validation
- Distance-based NGO assignment

## Performance Considerations

- Indexed database queries for location and status
- Pagination for large result sets
- Efficient distance calculations
- Batch operations for admin functions
- Caching for frequently accessed data

## Future Enhancements

- [ ] Real-time notifications
- [ ] GPS tracking for pickups
- [ ] Advanced routing algorithms
- [ ] Photo verification system
- [ ] Rating and feedback system
- [ ] Analytics and reporting
- [ ] Mobile app integration
