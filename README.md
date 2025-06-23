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
- **Monitoring**: Prometheus metrics collection and Grafana dashboards with real-time status monitoring
- **Connection Pooling**: PgBouncer for optimized database connection management
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
- **Status Monitoring**: Real-time status monitoring for all services

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
- Service status indicators

### Real-time Status Monitoring

The application includes a comprehensive status monitoring system that displays real-time status of all services:

- **Prometheus Status**: Connection and scraping status
- **Grafana Status**: Dashboard availability and health
- **Backend API Metrics**: Metrics collection status
- **Database Status**: PostgreSQL connection health
- **Redis Status**: Cache service availability
- **RabbitMQ Status**: Message queue health
- **Email Service Status**: SMTP configuration and connectivity

**Status Endpoints**:
- `GET /api/health` - Backend health check
- `GET /api/db-status` - Database connection status
- `GET /api/cache-status` - Redis connection status
- `GET /api/rabbitmq-status` - RabbitMQ connection status
- `GET /api/grafana-status` - Grafana health check (backend proxy)
- `GET /api/pgbouncer-status` - PgBouncer connection pooling status and statistics
- `GET /api/email/status` - Email service status
- `GET /metrics` - Prometheus metrics endpoint

### Metrics Collection

The backend automatically collects metrics for:

1. **HTTP Requests**: Via express-prometheus-middleware
2. **Custom Business Metrics**: User actions, file operations, email sends
3. **System Metrics**: Memory usage, Socket.io connections
4. **Service Metrics**: Redis, RabbitMQ, and database operations

**Metrics Endpoint**: http://localhost:5001/metrics

## Connection Pooling with PgBouncer

The application includes PgBouncer for optimized database connection management, providing better performance, scalability, and connection handling.

### PgBouncer Configuration

**Pool Mode**: Transaction-based pooling for optimal performance
**Connection Limits**:
- **Max Client Connections**: 1000
- **Default Pool Size**: 20 connections per database
- **Reserve Pool Size**: 5 additional connections
- **Max Database Connections**: 50
- **Max User Connections**: 50

**Performance Settings**:
- **Server Reset Query**: `DISCARD ALL` for clean connection reuse
- **Server Check Query**: `SELECT 1` for health monitoring
- **TCP Keepalive**: Enabled for connection stability
- **Connection Timeouts**: Optimized for web application patterns

### PgBouncer Benefits

**Performance Improvements**:
- **Faster Connection Establishment**: Reuses existing connections
- **Reduced Database Load**: Fewer connection overhead
- **Better Resource Utilization**: Efficient connection pooling
- **Connection Limit Management**: Prevents "too many connections" errors

**Scalability Features**:
- **Horizontal Scaling Ready**: Supports multiple backend instances
- **Connection Pool Optimization**: Automatic connection management
- **Load Distribution**: Efficient connection distribution
- **Failover Support**: Graceful handling of connection issues

**Monitoring & Observability**:
- **Real-time Metrics**: Connection pool status and performance
- **Health Monitoring**: Automatic health checks and alerts
- **Performance Analytics**: Connection wait times and utilization
- **Grafana Integration**: Visual monitoring dashboards

### PgBouncer Monitoring

The application includes comprehensive PgBouncer monitoring:

**Prometheus Metrics**:
- `pgbouncer_active_connections` - Active connections count
- `pgbouncer_waiting_connections` - Waiting connections count
- `pgbouncer_idle_connections` - Idle connections count
- `pgbouncer_used_connections` - Used connections count
- `pgbouncer_tested_connections` - Tested connections count
- `pgbouncer_login_connections` - Login connections count
- `pgbouncer_max_wait` - Maximum wait time in milliseconds
- `pgbouncer_max_wait_us` - Maximum wait time in microseconds

**Grafana Dashboard Panels**:
- **Active Connections**: Real-time active connection count
- **Waiting Connections**: Connections waiting for pool availability
- **Idle Connections**: Available connections in pool
- **Max Wait Time**: Connection wait time monitoring
- **Connection Pool Status**: Time series graph of pool utilization

**API Endpoints**:
- `GET /api/pgbouncer-status` - Detailed PgBouncer status and statistics
- Includes pool information, client details, and performance metrics

### Connection Pool Optimization

**Backend Configuration**:
- **Pool Size**: 20 connections (matches PgBouncer default)
- **Min Connections**: 2 (maintains minimum pool)
- **Idle Timeout**: 30 seconds (efficient resource usage)
- **Connection Timeout**: 2 seconds (fast failure detection)
- **Acquire Timeout**: 5 seconds (reasonable wait time)

**Health Checks**:
- **PgBouncer Health**: Automatic health monitoring
- **Connection Validation**: Regular connection testing
- **Performance Monitoring**: Real-time performance metrics
- **Alert Integration**: Prometheus-based alerting

### Access Information

- **PgBouncer Port**: 6432 (external access)
- **Internal Connection**: Backend connects via `pgbouncer:5432`
- **Status Endpoint**: http://localhost:5001/api/pgbouncer-status
- **Grafana Dashboard**: PgBouncer panels in Analytics Dashboard
- **Prometheus Metrics**: Available at http://localhost:5001/metrics

## Advanced Analytics & Monitoring

The application now includes comprehensive analytics and monitoring capabilities that provide deep insights into system performance, user behavior, and resource utilization.

### System Overview Analytics

The `/api/system/overview` endpoint provides a comprehensive snapshot of the entire system:

**Database Analytics:**
- Total users and new user registrations (24h, 7d)
- Total files and new file uploads (24h, 7d)
- Storage usage and average file sizes
- User activity patterns

**Redis Analytics:**
- Connection status and memory usage
- Performance metrics and configuration
- Cache hit rates and efficiency

**System Resources:**
- Memory usage (RSS, heap, external)
- Node.js version and platform info
- Service connectivity status

### Detailed Health Monitoring

The `/api/system/health` endpoint provides granular health checks:

**Service Health Checks:**
- Database connection pool status
- Redis response times and memory usage
- RabbitMQ connection state
- System resource utilization

**Performance Metrics:**
- Response times for each service
- Memory usage percentages
- CPU usage statistics
- Connection pool metrics

### User Analytics

The `/api/analytics/users` endpoint provides detailed user insights:

**Registration Trends:**
- Daily user registration patterns (30-day history)
- User growth analysis
- Registration rate calculations

**Activity Metrics:**
- Total active users
- Users active in last 7 days
- Users active in last 24 hours
- User engagement patterns

**Top Users Analysis:**
- Users ranked by file count
- Storage usage per user
- Most active users identification

### File Analytics

The `/api/analytics/files` endpoint provides comprehensive file insights:

**Upload Trends:**
- Daily file upload patterns (30-day history)
- Upload volume analysis
- Storage growth tracking

**File Type Distribution:**
- Most common file types
- Storage usage by file type
- File type popularity analysis

**Size Distribution:**
- Files categorized by size ranges (0-1KB, 1-10KB, etc.)
- Storage efficiency analysis
- File size optimization insights

**Metadata Usage:**
- Files with custom metadata
- Tag usage statistics
- Metadata completeness analysis

### Search Analytics

The `/api/analytics/search` endpoint provides search behavior insights:

**Tag Analytics:**
- Most used tags
- Tag popularity rankings
- Tag usage patterns

**Metadata Analytics:**
- Most common metadata keys
- Metadata field usage
- Searchable content analysis

**Content Analytics:**
- Files with text content
- Full-text search potential
- Content completeness metrics

### Cache Performance Analytics

The `/api/analytics/cache` endpoint provides Redis performance insights:

**Redis Metrics:**
- Version and uptime information
- Connected clients count
- Memory usage and peak usage
- Command processing statistics

**Performance Indicators:**
- Cache hit rates
- Keyspace efficiency
- Connection statistics
- Memory optimization data

### Performance Monitoring

The `/api/system/performance` endpoint provides detailed performance metrics:

**Database Performance:**
- PostgreSQL statistics
- Connection pool efficiency
- Query performance data
- Index usage statistics

**System Performance:**
- Memory usage breakdown
- CPU utilization
- Event loop performance
- Resource allocation

### Error Tracking

The `/api/system/errors` endpoint provides error analytics (placeholder for logging integration):

**Error Analytics:**
- Total error count
- Error type distribution
- Recent error logs
- Error pattern analysis

**Future Enhancements:**
- Integration with Winston logging
- Error alerting system
- Error trend analysis
- Performance impact assessment

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
- `GET /api/files/search/content`

## Recent Updates

### Connection Pooling with PgBouncer (Latest)
- **PgBouncer Integration**: Added PgBouncer for optimized database connection management
- **Connection Pooling**: Transaction-based pooling with 20 default connections
- **Performance Optimization**: Reduced connection overhead and improved resource utilization
- **Scalability Ready**: Support for horizontal scaling and multiple backend instances
- **Comprehensive Monitoring**: 8 new PgBouncer metrics with Grafana dashboard panels
- **Health Monitoring**: Real-time connection pool status and performance analytics
- **API Integration**: New `/api/pgbouncer-status` endpoint for detailed statistics
- **Connection Limits**: Managed connection limits to prevent database overload

### Analytics & Monitoring Enhancement (Previous)
- **Comprehensive Analytics Endpoints**: Added 8 new API endpoints for detailed system analytics
- **System Overview Dashboard**: Real-time system metrics with database, Redis, and performance data
- **User Analytics**: Registration trends, activity metrics, and top user analysis
- **File Analytics**: Upload trends, type distribution, size analysis, and metadata usage
- **Search Analytics**: Tag usage, metadata patterns, and content analysis
- **Cache Performance**: Redis metrics, hit rates, and memory optimization data
- **Health Monitoring**: Detailed health checks with response times and resource usage
- **Performance Metrics**: Database stats, system resources, and connection pool analytics