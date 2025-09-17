# Node.js AI Integration API

A professional Node.js REST API with AI-powered bio generation using OpenAI and HuggingFace APIs. Built with Express.js, MongoDB, and advanced middleware for security, logging, and rate limiting.

## 🚀 Features

- **AI-Powered Bio Generation**: Automatically generates professional bios using OpenAI GPT or HuggingFace models
- **RESTful API**: Complete CRUD operations for user management
- **MongoDB Integration**: Robust database operations with Mongoose ODM
- **Advanced Security**: Helmet, CORS, rate limiting, and input validation
- **Professional Logging**: Winston-based logging with multiple transports
- **Error Handling**: Comprehensive error handling and validation
- **Pagination & Search**: Advanced querying capabilities
- **Rate Limiting**: Multiple rate limiting strategies for different endpoints

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- OpenAI API Key (optional)
- HuggingFace API Key (optional)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd node-ai-integration
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/node-ai-integration
   OPENAI_API_KEY=your_openai_api_key_here
   HUGGINGFACE_API_KEY=your_huggingface_api_key_here
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   brew services start mongodb/brew/mongodb-community
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Run the application**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### 1. Create User
```http
POST /api/users
Content-Type: application/json

{
  "name": "Ankit Mishra",
  "email": "ankit@example.com",
  "role": "Developer",
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "name": "Ankit Mishra",
    "email": "ankit@example.com",
    "role": "Developer",
    "status": "active",
    "bio": "Ankit is a detail-oriented software developer passionate about building scalable web applications.",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 2. Get All Users
```http
GET /api/users?page=1&limit=10&search=developer&status=active&sortBy=createdAt&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalUsers": 50,
    "hasNextPage": true,
    "hasPrevPage": false,
    "limit": 10
  }
}
```

#### 3. Get User by ID
```http
GET /api/users/:id
```

#### 4. Update User
```http
PUT /api/users/:id
Content-Type: application/json

{
  "name": "Ankit Kumar Mishra",
  "role": "Senior Developer"
}
```

#### 5. Delete User
```http
DELETE /api/users/:id
```

#### 6. AI Service Status
```http
GET /api/users/ai/status
```

**Response:**
```json
{
  "success": true,
  "message": "AI service status retrieved",
  "data": {
    "services": {
      "openai": true,
      "huggingface": false
    },
    "configured": true
  }
}
```

## 🏗️ Project Structure

```
node-ai-integration/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   └── logger.js            # Winston logger configuration
│   ├── controllers/
│   │   └── userController.js    # User CRUD operations
│   ├── middleware/
│   │   ├── errorHandler.js      # Global error handling
│   │   ├── rateLimiter.js       # Rate limiting middleware
│   │   ├── requestLogger.js     # Request logging
│   │   └── validation.js        # Input validation
│   ├── models/
│   │   └── User.js              # User Mongoose schema
│   ├── routes/
│   │   ├── index.js             # Main routes
│   │   └── userRoutes.js        # User routes
│   ├── services/
│   │   └── aiService.js         # AI integration service
│   └── app.js                   # Express application
├── logs/                        # Application logs
├── tests/                       # Test files
├── .env.example                 # Environment variables template
├── package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/node-ai-integration` |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `HUGGINGFACE_API_KEY` | HuggingFace API key | - |
| `CORS_ORIGIN` | CORS allowed origins | `*` |
| `LOG_LEVEL` | Logging level | `info` |

### Rate Limiting

- **General API**: 100 requests per 15 minutes
- **User Creation**: 5 requests per hour
- **AI Service**: 10 requests per minute

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📝 Logging

The application uses Winston for logging with multiple transports:

- **Console**: Development mode
- **Files**: 
  - `logs/error.log` - Error logs
  - `logs/combined.log` - All logs
  - `logs/exceptions.log` - Uncaught exceptions
  - `logs/rejections.log` - Unhandled rejections

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Multiple rate limiting strategies
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses
- **Logging**: Security event logging

## 🤖 AI Integration

The application supports multiple AI providers:

1. **OpenAI GPT**: Primary AI service for bio generation
2. **HuggingFace**: Fallback AI service
3. **Fallback Generator**: Simple template-based generation

### AI Bio Generation Process

1. User creates/updates profile with name and role
2. System calls AI service to generate professional bio
3. AI response is processed and stored in database
4. Fallback mechanisms ensure bio is always generated

## 🚀 Deployment

### Using PM2 (Production)

```bash
# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start src/app.js --name "node-ai-integration"

# Monitor application
pm2 monit

# View logs
pm2 logs node-ai-integration
```

### Using Docker

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the logs in the `logs/` directory
- Review the API documentation above

## 🔄 API Response Format

All API responses follow this consistent format:

```json
{
  "success": boolean,
  "message": "string",
  "data": object | array,
  "pagination": object (for paginated responses),
  "error": "string" (for error responses)
}
```

## 📊 Monitoring

The application includes:

- Health check endpoint: `GET /health`
- Request/response logging
- Error tracking
- Performance monitoring
- AI service status monitoring