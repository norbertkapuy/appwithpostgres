# Build stage
FROM node:18-alpine as builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=optional && npm cache clean --force

# Copy source code
COPY . .

# Build the app with optimizations
RUN npm run build

# Production stage
FROM nginx:alpine

# Install security updates and utilities
RUN apk update && apk upgrade && apk add --no-cache wget dumb-init

# Create nginx user and group
RUN addgroup -g 1001 -S nginx && adduser -S nginx -u 1001

# Remove default nginx config and static files
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/*

# Copy optimized nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built app to nginx with proper ownership
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Create required directories
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run /usr/share/nginx/html

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 