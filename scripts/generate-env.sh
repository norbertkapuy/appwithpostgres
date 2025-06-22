#!/bin/bash

echo "🔐 Generating secure environment variables..."

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Creating backup..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# Generate secure random values
DB_PASSWORD=$(openssl rand -base64 24)
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -hex 16)
GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 16)

# Create .env file
cat > .env << EOF
# ===========================================
# Environment Variables for App with PostgreSQL
# ===========================================
# Generated with secure random values
# Keep this file secure and never commit to version control

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=appwithpostgres
DB_USER=postgres
DB_PASSWORD=${DB_PASSWORD}

# Backend Configuration
PORT=5000
NODE_ENV=production

# Security Keys (generated with secure random values)
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}

# Frontend Configuration
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=App with PostgreSQL

# Grafana Configuration
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}

# Optional: External Database (for production)
# Uncomment and modify these if using external PostgreSQL
# DB_HOST=your-external-db-host.com
# DB_PORT=5432
# DB_NAME=your_database_name
# DB_USER=your_database_user
# DB_PASSWORD=your_secure_password

# Optional: Redis (for caching/sessions)
# REDIS_HOST=redis
# REDIS_PORT=6379
# REDIS_PASSWORD=

# Optional: Email Configuration (SMTP)
# For on-premise email servers, use your internal SMTP server
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your-smtp-password

# Email Configuration Examples:
# 
# For Gmail:
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password
#
# For Office 365:
# SMTP_HOST=smtp.office365.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@yourdomain.com
# SMTP_PASSWORD=your-password
#
# For Exchange/Outlook:
# SMTP_HOST=your-exchange-server.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-email@yourdomain.com
# SMTP_PASSWORD=your-password
#
# For Postfix (Linux):
# SMTP_HOST=localhost
# SMTP_PORT=25
# SMTP_SECURE=false
# SMTP_USER=
# SMTP_PASSWORD=
#
# For Sendmail:
# SMTP_HOST=localhost
# SMTP_PORT=25
# SMTP_SECURE=false
# SMTP_USER=
# SMTP_PASSWORD=

# Optional: File Upload
# UPLOAD_DIR=./uploads
# MAX_FILE_SIZE=10485760
EOF

echo "✅ Environment variables generated successfully!"
echo "📁 .env file created with secure random values"
echo ""
echo "🔑 Generated values:"
echo "   DB_PASSWORD: ${DB_PASSWORD}"
echo "   JWT_SECRET: ${JWT_SECRET}"
echo "   SESSION_SECRET: ${SESSION_SECRET}"
echo "   GRAFANA_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD}"
echo ""
echo "⚠️  Keep these values secure and never share them!"
echo "📋 You can now run: docker-compose up -d" 