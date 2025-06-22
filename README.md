# App with PostgreSQL

A modern full-stack web application built with React, Vite, TypeScript, Node.js, Express, and PostgreSQL, featuring authentication, file upload capabilities, advanced JSONB metadata management, real-time updates, caching, message queuing, and email notifications.

## Features

- **Frontend**: React 18 with Vite and TypeScript
- **Backend**: Node.js with Express and TypeScript
- **Database**: PostgreSQL with JSONB support for flexible metadata
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **File Upload**: Secure file upload with rich metadata and tagging
- **Advanced Search**: JSONB-powered search by tags, metadata, and full-text content
- **Real-time Updates**: Socket.io for instant data synchronization
- **Caching**: Redis for API response caching
- **Message Queuing**: RabbitMQ for asynchronous processing
- **Email Notifications**: Nodemailer-based email system with SMTP support
- **Docker**: Complete containerization with Docker Compose
- **Security**: Rate limiting, input validation, secure headers, and comprehensive security measures

## Authentication System

The application includes a complete JWT-based authentication system:

- **User Registration**: Secure user registration with email validation and welcome emails
- **User Login**: Password-based authentication with bcrypt hashing
- **Protected Routes**: Dashboard and file upload features require authentication
- **Session Management**: JWT tokens with 24-hour expiration
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive form validation and sanitization
- **Email Notifications**: Welcome emails and system alerts

### Authentication Features

- Password hashing with bcrypt (10 salt rounds)
- JWT tokens with 24-hour expiration
- Rate limiting on authentication endpoints (5 attempts per 15 minutes)
- Email and password validation
- User-specific data isolation
- Secure logout functionality
- Email notifications for registration and system events

## Email Notification System

The application includes a comprehensive email notification system using Nodemailer:

### Email Features
- **SMTP Configuration**: Support for various email providers (Gmail, Outlook, custom SMTP)
- **Email Templates**: Pre-built templates for common notifications
- **Welcome Emails**: Automatic welcome emails for new user registrations
- **File Upload Notifications**: Confirmation emails for successful file uploads
- **System Alerts**: Administrative notifications for system events
- **Password Reset**: Secure password reset functionality
- **Approval Workflows**: Email notifications for file approval/rejection

### Email Templates
- **Welcome Email**: New user registration confirmation
- **File Upload Confirmation**: Successful file upload notification
- **File Approval**: Document approval notifications
- **File Rejection**: Document rejection with reason
- **System Alert**: Administrative system notifications
- **Password Reset**: Secure password reset links

### Email Configuration
The system supports various email providers:
- **Gmail**: SMTP with OAuth2 or app passwords
- **Outlook/Hotmail**: Microsoft SMTP servers
- **Custom SMTP**: Any SMTP server configuration
- **Local SMTP**: For on-premise deployments

## JSONB Metadata System

The application leverages PostgreSQL's JSONB capabilities for flexible document metadata management:

### Enhanced File Metadata

Files now support rich metadata including:
- **Title**: Custom file titles
- **Description**: Detailed file descriptions
- **Author**: File creator information
- **Department**: Organizational categorization
- **Category**: File type classification
- **Approval Status**: Workflow status (pending, approved, rejected, draft)
- **Version**: File versioning support
- **Tags**: Flexible tagging system for easy categorization
- **Content**: Full-text content storage for searchable documents

### Advanced Search Capabilities

- **Tag-based Search**: Find files by specific tags
- **Metadata Search**: Search by any metadata field (department, category, status, etc.)
- **Full-text Search**: Search within file content using PostgreSQL's text search
- **Combined Queries**: Mix different search types for precise results

### Database Schema

The application automatically creates the following tables with JSONB support:

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

-- Enhanced files table with JSONB metadata
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100),
  user_id INTEGER REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  content TEXT,
  tags TEXT[]
);

-- Performance indexes for JSONB and search
CREATE INDEX idx_files_metadata ON files USING GIN (metadata);
CREATE INDEX idx_files_tags ON files USING GIN (tags);
CREATE INDEX idx_files_content ON files USING GIN (to_tsvector('english', content));
```

## Real-time Features

### Socket.io Integration
- **Real-time Updates**: Instant data synchronization across clients
- **File Upload Progress**: Live upload progress tracking
- **Dashboard Updates**: Automatic dashboard refresh on data changes
- **User Notifications**: Real-time user notifications
- **System Status**: Live system status monitoring

### Redis Caching
- **API Response Caching**: Improved performance with cached responses
- **Session Storage**: Enhanced session management
- **Search Results**: Cached search results for faster queries
- **File Metadata**: Cached file metadata for quick access

### RabbitMQ Message Queuing
- **Asynchronous Processing**: Background task processing
- **Email Queuing**: Queued email sending for better performance
- **File Processing**: Background file processing tasks
- **System Events**: Event-driven architecture for system notifications

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
- Email configuration
- Redis and RabbitMQ settings

### 3. Start the Application

```bash
docker-compose up -d
```

The application will be available at:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5001
- **Database**: localhost:5432
- **RabbitMQ Management**: http://localhost:15672

### 4. Access the Application

1. Open http://localhost in your browser
2. Register a new account or login with existing credentials
3. Access the dashboard for file uploads and data management
4. Use the advanced search features to find files by metadata, tags, or content
5. Test email notifications through the dashboard

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

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Protected Endpoints (require authentication)
- `GET /api/data` - Get user's items
- `POST /api/data` - Create new item
- `POST /api/upload` - Upload file with metadata
- `GET /api/files` - Get user's files
- `GET /api/files/:filename` - Download file
- `GET /api/storage/info` - Get storage information

### JSONB Search Endpoints
- `GET /api/files/search/tags?tags=tag1,tag2` - Search files by tags
- `GET /api/files/search/metadata?key=department&value=IT` - Search by metadata
- `GET /api/files/search/content?query=search+term` - Full-text search
- `GET /api/files/department/:department` - Get files by department
- `PUT /api/files/:id/metadata` - Update file metadata

### Email Service Endpoints
- `GET /api/email/status` - Check email service status
- `POST /api/email/test` - Send test email
- `POST /api/email/system-alert` - Send system alert email

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
- **JSONB Validation**: Input sanitization for metadata fields
- **Email Security**: SMTP with TLS/SSL encryption
- **Session Security**: Secure session management with Redis
- **API Security**: Comprehensive API endpoint protection

## File Upload with Metadata

The application supports secure file uploads with rich metadata:

### Upload Features
- **File Type Validation**: Only allowed file types (images, documents, etc.)
- **Size Limits**: Configurable maximum file size (default: 10MB)
- **User Isolation**: Files are associated with specific users
- **Secure Storage**: Files stored in Docker volumes
- **Download Protection**: Users can only download their own files
- **Email Notifications**: Automatic upload confirmation emails

### Metadata Management
- **Rich Forms**: Comprehensive upload forms with metadata fields
- **Tagging System**: Flexible comma-separated tag input
- **Department Categorization**: Organizational structure support
- **Version Control**: File versioning capabilities
- **Approval Workflow**: Status tracking for document approval
- **Content Extraction**: Text content storage for searchable documents

### Search and Discovery
- **Tag-based Filtering**: Find files by specific tags
- **Metadata Queries**: Search by department, category, status, etc.
- **Full-text Search**: Search within document content
- **Combined Filters**: Mix different search criteria
- **Real-time Results**: Instant search results with caching

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

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## Docker Configuration

The application uses Docker Compose with five services:

- **frontend**: React app served by Nginx
- **backend**: Node.js/Express API
- **postgres**: PostgreSQL database with JSONB support
- **redis**: Redis caching service
- **rabbitmq**: RabbitMQ message broker with management UI

### Volumes

- `postgres_data`: Persistent database storage
- `uploads`: File upload storage
- `logs`: Application logs

### Health Checks

- **RabbitMQ**: Automatic health monitoring
- **Database**: Connection status monitoring
- **Redis**: Cache service monitoring
- **Backend**: API health checks

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 80, 5001, 5432, 6379, and 5672 are available
2. **Database Connection**: Check if PostgreSQL container is running
3. **File Uploads**: Verify upload directory permissions
4. **Authentication**: Clear browser storage if experiencing login issues
5. **JSONB Queries**: Ensure PostgreSQL version supports JSONB (9.4+)
6. **Email Configuration**: Verify SMTP settings in environment variables
7. **Redis Connection**: Check Redis container status
8. **RabbitMQ Connection**: Verify RabbitMQ service health

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
docker-compose logs redis
docker-compose logs rabbitmq
```

### Email Testing

Use the dashboard's email test feature to verify email configuration:
1. Navigate to the dashboard
2. Use the email test component
3. Send test emails to verify SMTP settings
4. Check email service status endpoint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 