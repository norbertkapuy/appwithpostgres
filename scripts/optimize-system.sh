#!/bin/bash

echo "⚡ System Optimization Script for App with PostgreSQL"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if script is run as root (for system optimizations)
if [[ $EUID -eq 0 ]]; then
    print_warning "Running as root - system-level optimizations will be applied"
    SYSTEM_LEVEL=true
else
    print_info "Running as user - only Docker optimizations will be applied"
    SYSTEM_LEVEL=false
fi

# Check Docker system resources
echo ""
echo "🔍 Checking Docker System Resources..."
docker system df

# Clean up unused Docker resources
echo ""
echo "🧹 Cleaning up Docker resources..."
docker system prune -f --volumes
docker image prune -f
docker container prune -f
docker network prune -f

print_status "Docker cleanup completed"

# Optimize Docker daemon settings
echo ""
echo "🐳 Checking Docker daemon configuration..."

if [ "$SYSTEM_LEVEL" = true ]; then
    # Create optimized Docker daemon configuration
    DOCKER_DAEMON_CONFIG="/etc/docker/daemon.json"
    
    if [ ! -f "$DOCKER_DAEMON_CONFIG" ]; then
        print_info "Creating Docker daemon configuration..."
        cat > "$DOCKER_DAEMON_CONFIG" << EOF
{
  "storage-driver": "overlay2",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "default-ulimits": {
    "nofile": {
      "Hard": 64000,
      "Name": "nofile",
      "Soft": 64000
    }
  },
  "max-concurrent-downloads": 10,
  "max-concurrent-uploads": 5
}
EOF
        print_status "Docker daemon configuration created"
        print_warning "Docker daemon needs to be restarted to apply changes"
    else
        print_info "Docker daemon configuration already exists"
    fi
fi

# Optimize PostgreSQL settings in Docker Compose
echo ""
echo "🐘 Optimizing PostgreSQL configuration..."

# Check current memory
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
SHARED_BUFFERS=$((TOTAL_MEM / 4))  # 25% of total memory
EFFECTIVE_CACHE=$((TOTAL_MEM * 3 / 4))  # 75% of total memory

print_info "Total Memory: ${TOTAL_MEM}MB"
print_info "Recommended shared_buffers: ${SHARED_BUFFERS}MB"
print_info "Recommended effective_cache_size: ${EFFECTIVE_CACHE}MB"

# Create optimized PostgreSQL configuration
cat > postgresql-optimized.conf << EOF
# PostgreSQL Optimization Configuration
# Add these to your PostgreSQL container environment variables

POSTGRES_SHARED_BUFFERS=${SHARED_BUFFERS}MB
POSTGRES_EFFECTIVE_CACHE_SIZE=${EFFECTIVE_CACHE}MB
POSTGRES_MAINTENANCE_WORK_MEM=64MB
POSTGRES_CHECKPOINT_COMPLETION_TARGET=0.9
POSTGRES_WAL_BUFFERS=16MB
POSTGRES_DEFAULT_STATISTICS_TARGET=100
POSTGRES_RANDOM_PAGE_COST=1.1
POSTGRES_EFFECTIVE_IO_CONCURRENCY=200
POSTGRES_WORK_MEM=4MB
POSTGRES_MAX_WORKER_PROCESSES=8
POSTGRES_MAX_PARALLEL_WORKERS_PER_GATHER=2
POSTGRES_MAX_PARALLEL_WORKERS=8
EOF

print_status "PostgreSQL optimization configuration created: postgresql-optimized.conf"

# Optimize system parameters (if running as root)
if [ "$SYSTEM_LEVEL" = true ]; then
    echo ""
    echo "⚙️  Applying system-level optimizations..."
    
    # Increase file descriptors
    echo "fs.file-max = 100000" >> /etc/sysctl.conf
    echo "* soft nofile 64000" >> /etc/security/limits.conf
    echo "* hard nofile 64000" >> /etc/security/limits.conf
    
    # Optimize network settings
    echo "net.core.somaxconn = 65535" >> /etc/sysctl.conf
    echo "net.core.netdev_max_backlog = 5000" >> /etc/sysctl.conf
    
    # Apply changes
    sysctl -p
    
    print_status "System-level optimizations applied"
else
    print_info "Run as root to apply system-level optimizations"
fi

# Check and optimize container resource limits
echo ""
echo "📊 Checking container resource usage..."

# Show current container stats
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"

# Create resource monitoring script
cat > monitor-resources.sh << 'EOF'
#!/bin/bash
echo "🔄 Container Resource Monitor"
echo "============================="
while true; do
    clear
    echo "$(date): Container Resource Usage"
    echo "=================================="
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
    echo ""
    echo "Press Ctrl+C to stop monitoring"
    sleep 5
done
EOF

chmod +x monitor-resources.sh
print_status "Resource monitoring script created: ./monitor-resources.sh"

# Create performance testing script
cat > performance-test.sh << 'EOF'
#!/bin/bash
echo "🚀 Performance Testing Script"
echo "============================="

echo "Testing API endpoints..."
for i in {1..10}; do
    echo "Test $i/10"
    curl -w "@/dev/stdin" -o /dev/null -s "http://localhost:5001/api/health" << 'CURL_FORMAT'
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
CURL_FORMAT
    sleep 1
done

echo "Performance test completed"
EOF

chmod +x performance-test.sh
print_status "Performance testing script created: ./performance-test.sh"

# Create backup script
cat > backup-system.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Creating system backup..."

# Backup database
docker-compose exec -T postgres pg_dump -U postgres appwithpostgres > "$BACKUP_DIR/database.sql"

# Backup volumes
docker run --rm -v appwithpostgres_postgres_data:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .
docker run --rm -v appwithpostgres_redis_data:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine tar czf /backup/redis_data.tar.gz -C /data .
docker run --rm -v appwithpostgres_app_storage:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine tar czf /backup/app_storage.tar.gz -C /data .

echo "✅ Backup completed: $BACKUP_DIR"
EOF

chmod +x backup-system.sh
print_status "Backup script created: ./backup-system.sh"

echo ""
echo "🎯 Optimization Summary"
echo "======================"
print_status "Docker resources cleaned up"
print_status "PostgreSQL optimization config created"
print_status "Monitoring scripts created"
print_status "Backup script created"

if [ "$SYSTEM_LEVEL" = true ]; then
    print_status "System-level optimizations applied"
    print_warning "Restart Docker daemon to apply daemon configuration changes"
else
    print_info "Run as root for additional system-level optimizations"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Review postgresql-optimized.conf and update your docker-compose.yml"
echo "2. Run ./monitor-resources.sh to monitor performance"
echo "3. Run ./performance-test.sh to test API performance"
echo "4. Use ./backup-system.sh for regular backups"
echo "5. Consider restarting containers to apply optimizations"

echo ""
print_status "Optimization completed!" 