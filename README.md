# App with PostgreSQL

A modern full-stack web application built with React, Vite, TypeScript, Node.js, Express, and PostgreSQL, featuring authentication and file upload capabilities.

## Features

- **Frontend**: React 18 with Vite and TypeScript
- **Backend**: Node.js with Express and TypeScript
- **Database**: PostgreSQL with connection pooling
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **File Upload**: Secure file upload with user-specific storage
- **Real-time Updates**: Socket.io for instant data synchronization
- **Caching**: Redis for API response caching
- **Message Queuing**: RabbitMQ for asynchronous processing
- **Docker**: Complete containerization with Docker Compose
- **Security**: Rate limiting, input validation, and secure headers

## Authentication System

The application includes a complete JWT-based authentication system:

- **User Registration**: Secure user registration with email validation
- **User Login**: Password-based authentication with bcrypt hashing
- **Protected Routes**: Dashboard and file upload features require authentication
- **Session Management**: JWT tokens with 24-hour expiration
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive form validation and sanitization

### Authentication Features

- Password hashing with bcrypt (10 salt rounds)
- JWT tokens with 24-hour expiration
- Rate limiting on authentication endpoints (5 attempts per 15 minutes)
- Email and password validation
- User-specific data isolation
- Secure logout functionality

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd appwithpostgres
```

### 2. Generate Environment Variables

```bash
./scripts/generate-env.sh
```

This creates a `.env` file with secure random values for:
- Database credentials
- JWT secret
- Upload directory
- File size limits

### 3. Start the Application

```bash
docker-compose up -d
```

The application will be available at:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5001
- **Database**: localhost:5432

### 4. Access the Application

1. Open http://localhost in your browser
2. Register a new account or login with existing credentials
3. Access the dashboard for file uploads and data management

## Development

### Local Development

```bash
# Install dependencies
npm install
cd backend && npm install

# Start development servers
npm run dev          # Frontend (Vite)
cd backend && npm run dev  # Backend (Nodemon)
```

### Database Schema

The application automatically creates the following tables:

```sql
-- Users table for authentication
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Items table for general data
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Files table for uploaded files
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100),
  user_id INTEGER REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Protected Endpoints (require authentication)
- `GET /api/data` - Get user's items
- `POST /api/data` - Create new item
- `POST /api/upload` - Upload file
- `GET /api/files` - Get user's files
- `GET /api/files/:filename` - Download file
- `GET /api/storage/info` - Get storage information

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/db-status` - Database connection status
- `GET /api/cache-status` - Redis cache connection status
- `GET /api/rabbitmq-status` - RabbitMQ message broker connection status

## Security Features

- **Password Security**: bcrypt hashing with 10 salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive validation using express-validator
- **CORS**: Configured for secure cross-origin requests
- **Helmet**: Security headers for Express
- **File Upload Security**: File type validation and size limits
- **User Isolation**: Users can only access their own data

## File Upload

The application supports secure file uploads with the following features:

- **File Type Validation**: Only allowed file types (images, documents, etc.)
- **Size Limits**: Configurable maximum file size (default: 10MB)
- **User Isolation**: Files are associated with specific users
- **Secure Storage**: Files stored in Docker volumes
- **Download Protection**: Users can only download their own files

## Environment Variables

Key environment variables (auto-generated by `generate-env.sh`):

```env
# Database
DB_USER=postgres
DB_PASSWORD=<random-password>
DB_NAME=appwithpostgres
DB_HOST=postgres
DB_PORT=5432

# JWT
JWT_SECRET=<random-secret>

# File Upload
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760

# Server
PORT=5000

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
```

## Docker Configuration

The application uses Docker Compose with five services:

- **frontend**: React app served by Nginx
- **backend**: Node.js/Express API
- **postgres**: PostgreSQL database
- **redis**: Redis caching service
- **rabbitmq**: RabbitMQ message broker

### Volumes

- `postgres_data`: Persistent database storage
- `uploads`: File upload storage
- `logs`: Application logs

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 80, 5001, and 5432 are available
2. **Database Connection**: Check if PostgreSQL container is running
3. **File Uploads**: Verify upload directory permissions
4. **Authentication**: Clear browser storage if experiencing login issues

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 