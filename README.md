# App with PostgreSQL

A modern full-stack web application built with React, Vite, TypeScript, Node.js, Express, and PostgreSQL, featuring authentication, file upload capabilities, advanced JSONB metadata management, real-time updates, caching, message queuing, email notifications, and comprehensive monitoring with Grafana and Prometheus.

## Features

- **Frontend**: React 18 with Vite and TypeScript
- **Backend**: Node.js with Express and TypeScript
- **Database**: PostgreSQL with JSONB support for flexible metadata
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **File Upload**: Secure file upload with rich metadata and tagging
- **Advanced Search**: JSONB-powered search by tags, metadata, and full-text content
- **Real-time Updates**: Socket.io for instant data synchronization
- **Caching**: Redis for improved performance and session management
- **Message Queuing**: RabbitMQ for reliable message processing
- **Email Notifications**: Nodemailer-based email service with SMTP support
- **Monitoring**: Prometheus metrics collection and Grafana dashboards
- **Containerization**: Docker and Docker Compose for easy deployment

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
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd appwithpostgres
   ```

2. **Generate environment variables**
   ```bash
   chmod +x scripts/generate-env.sh
   ./scripts/generate-env.sh
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - **Frontend**: http://localhost
   - **Backend API**: http://localhost:5001
   - **Prometheus**: http://localhost:9090
   - **Grafana**: http://localhost:3000 (admin/admin)
   - **RabbitMQ Management**: http://localhost:15672 (guest/guest)
   - **PostgreSQL**: localhost:5432

## Monitoring Stack

### Prometheus

Prometheus is configured to collect metrics from the backend API and provides:

- **HTTP Request Metrics**: Request rates, durations, and error rates
- **Custom Application Metrics**: User registrations, logins, file uploads, email sends
- **System Metrics**: Memory usage, CPU usage, Socket.io connections
- **Service Metrics**: Redis operations, RabbitMQ messages, database query durations

**Access**: http://localhost:9090

**Key Metrics Available**:
- `http_requests_total` - Total HTTP requests by method, route, and status
- `http_request_duration_seconds` - Request duration histograms
- `user_registrations_total` - Total user registrations
- `user_logins_total` - Login attempts by status (success/failed)
- `file_uploads_total` - File uploads by user and type
- `email_sent_total` - Email sends by template and status
- `socket_connections` - Active Socket.io connections
- `system_memory_usage_bytes` - Memory usage by type
- `rabbitmq_messages_total` - RabbitMQ message counts
- `redis_operations_total` - Redis operation counts

### Grafana

Grafana provides beautiful dashboards for visualizing the collected metrics:

- **Pre-configured Dashboard**: "App with PostgreSQL Dashboard" with comprehensive metrics
- **Real-time Monitoring**: Auto-refreshing dashboards every 10 seconds
- **Multiple Panels**: HTTP metrics, user activity, system resources, error rates

**Access**: http://localhost:3000
- **Username**: admin
- **Password**: Generated automatically (check the output of `generate-env.sh`)

**Dashboard Features**:
- HTTP Request Rate and Duration graphs
- User registration and login statistics
- File upload tracking
- Active Socket.io connections
- System memory usage
- Email delivery statistics
- RabbitMQ message counts
- Error rate monitoring

### Metrics Collection

The backend automatically collects metrics for:

1. **HTTP Requests**: Via express-prometheus-middleware
2. **Custom Business Metrics**: User actions, file operations, email sends
3. **System Metrics**: Memory usage, Socket.io connections
4. **Service Metrics**: Redis, RabbitMQ, and database operations

**Metrics Endpoint**: http://localhost:5001/metrics

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Data Management
- `GET /api/data` - Get all items
- `POST /api/data` - Create new item
- `PUT /api/data/:id` - Update item
- `DELETE /api/data/:id` - Delete item

### File Management
- `POST /api/upload` - Upload file with metadata
- `GET /api/files` - Get user's files
- `GET /api/files/search/tags` - Search by tags
- `GET /api/files/search/metadata` - Search by metadata
- `GET /api/files/search/content` - Full-text search
- `PUT /api/files/:id/metadata` - Update file metadata

### System Status
- `GET /api/health` - Backend health check
- `GET /api/db-status` - Database connection status
- `GET /api/cache-status` - Redis connection status
- `GET /api/rabbitmq-status` - RabbitMQ connection status
- `GET /api/email/status` - Email service status
- `GET /metrics` - Prometheus metrics endpoint

### Email Service
- `POST /api/email/test` - Send test email
- `POST /api/email/system-alert` - Send system alert

## Environment Variables

The application uses the following environment variables (automatically generated):

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=appwithpostgres
DB_USER=postgres
DB_PASSWORD=<auto-generated>

# Security
JWT_SECRET=<auto-generated>
SESSION_SECRET=<auto-generated>

# Monitoring
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=<auto-generated>

# Email (configure as needed)
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your-smtp-password
```

## Development

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install
   ```

2. **Start development servers**
   ```bash
   # Frontend
   npm run dev
   
   # Backend
   cd backend && npm run dev
   ```

3. **Start supporting services**
   ```bash
   docker-compose up -d postgres redis rabbitmq prometheus grafana
   ```

### Monitoring Development

To add new metrics:

1. **Define metrics in `backend/src/metrics.js`**
   ```javascript
   export const newMetric = new promClient.Counter({
     name: 'new_metric_total',
     help: 'Description of the metric',
     labelNames: ['label1', 'label2']
   })
   ```

2. **Register the metric**
   ```javascript
   register.registerMetric(newMetric)
   ```

3. **Use the metric in your code**
   ```javascript
   newMetric.inc({ label1: 'value1', label2: 'value2' })
   ```

4. **Add to Grafana dashboard** (optional)
   - Access Grafana at http://localhost:3000
   - Edit the dashboard and add new panels
   - Use PromQL queries to visualize your metrics

## Troubleshooting

### Common Issues

1. **Prometheus can't connect to backend**
   - Check if backend is running: `docker-compose logs backend`
   - Verify metrics endpoint: `curl http://localhost:5001/metrics`

2. **Grafana can't connect to Prometheus**
   - Check Prometheus targets: http://localhost:9090/targets
   - Verify datasource configuration in Grafana

3. **Metrics not showing up**
   - Check backend logs for metric registration errors
   - Verify Prometheus is scraping the correct endpoint
   - Check Grafana datasource configuration

4. **Dashboard not loading**
   - Ensure Grafana has access to Prometheus
   - Check dashboard JSON configuration
   - Verify all required metrics are being collected

### Logs

View logs for specific services:
```bash
# Backend logs
docker-compose logs backend

# Prometheus logs
docker-compose logs prometheus

# Grafana logs
docker-compose logs grafana

# All logs
docker-compose logs
```

### Reset Monitoring Data

To reset monitoring data:
```bash
# Stop services
docker-compose down

# Remove monitoring volumes
docker volume rm appwithpostgres_prometheus_data appwithpostgres_grafana_data

# Restart services
docker-compose up -d
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Rate Limiting**: Protection against brute force attacks
- **CORS Configuration**: Controlled cross-origin requests
- **Helmet**: Security headers for Express
- **Input Validation**: Request validation and sanitization

## Performance Features

- **Redis Caching**: Improved response times for frequently accessed data
- **Database Indexing**: Optimized queries with GIN indexes for JSONB
- **File Upload Optimization**: Efficient file handling with size limits
- **Real-time Updates**: Socket.io for instant data synchronization
- **Message Queuing**: Asynchronous processing with RabbitMQ

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs
3. Create an issue in the repository

---

**Note**: This application is designed for development and testing purposes. For production deployment, ensure proper security configurations, SSL certificates, and environment-specific optimizations. 