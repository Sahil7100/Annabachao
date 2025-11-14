# AnnaBachao Backend

Backend server for AnnaBachao food waste management application built with Node.js, Express, and MongoDB.

## Features

- User authentication and authorization
- JWT token-based security
- MongoDB integration
- CORS enabled
- Error handling middleware
- Environment-based configuration

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
PORT=5000

# MongoDB Configuration
MONGO_URI=mongodb+srv://username:password@cluster0.mongodb.net/annabachao?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Environment
NODE_ENV=development
```

**Important:** 
- Replace the MongoDB URI with your actual MongoDB Atlas connection string
- Change the JWT_SECRET to a secure random string for production

### 3. MongoDB Atlas Setup

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address
5. Get your connection string and update the `MONGO_URI` in your `.env` file

### 4. Run the Server

#### Development Mode (with nodemon)
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or the PORT specified in your .env file).

## API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile (requires authentication)

### Health Check

- `GET /` - Returns "Backend server running..."
- `GET /health` - Returns server status and timestamp

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
├── config.env           # Environment configuration
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management
