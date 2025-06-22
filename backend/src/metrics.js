import promClient from 'prom-client'

// Create a Registry to register the metrics
const register = new promClient.Registry()

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register })

// Custom metrics (excluding those handled by express-prometheus-middleware)
export const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
})

export const fileUploadsTotal = new promClient.Counter({
  name: 'file_uploads_total',
  help: 'Total number of file uploads',
  labelNames: ['user_id', 'file_type']
})

export const userRegistrationsTotal = new promClient.Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations'
})

export const userLoginsTotal = new promClient.Counter({
  name: 'user_logins_total',
  help: 'Total number of user logins',
  labelNames: ['status']
})

export const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
})

export const redisOperationsTotal = new promClient.Counter({
  name: 'redis_operations_total',
  help: 'Total number of Redis operations',
  labelNames: ['operation', 'status']
})

export const rabbitmqMessagesTotal = new promClient.Counter({
  name: 'rabbitmq_messages_total',
  help: 'Total number of RabbitMQ messages',
  labelNames: ['queue', 'action']
})

export const emailSentTotal = new promClient.Counter({
  name: 'email_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['template', 'status']
})

export const socketConnections = new promClient.Gauge({
  name: 'socket_connections',
  help: 'Number of active Socket.io connections'
})

export const systemMemoryUsage = new promClient.Gauge({
  name: 'system_memory_usage_bytes',
  help: 'System memory usage in bytes',
  labelNames: ['type']
})

export const systemCpuUsage = new promClient.Gauge({
  name: 'system_cpu_usage_percent',
  help: 'System CPU usage percentage'
})

// Analytics metrics for Grafana dashboard
export const appTotalUsers = new promClient.Gauge({
  name: 'app_total_users',
  help: 'Total number of users in the system'
})

export const appTotalFiles = new promClient.Gauge({
  name: 'app_total_files',
  help: 'Total number of files in the system'
})

export const appTotalStorageUsed = new promClient.Gauge({
  name: 'app_total_storage_used',
  help: 'Total storage used in bytes'
})

export const appActiveUsers24h = new promClient.Gauge({
  name: 'app_active_users_24h',
  help: 'Number of active users in the last 24 hours'
})

export const appActiveUsers7d = new promClient.Gauge({
  name: 'app_active_users_7d',
  help: 'Number of active users in the last 7 days'
})

export const appUserRegistrations = new promClient.Counter({
  name: 'app_user_registrations',
  help: 'User registration counter for trend analysis'
})

export const appFileUploads = new promClient.Counter({
  name: 'app_file_uploads',
  help: 'File upload counter for trend analysis'
})

export const appAvgFileSize = new promClient.Gauge({
  name: 'app_avg_file_size',
  help: 'Average file size in bytes'
})

export const appFilesWithMetadata = new promClient.Gauge({
  name: 'app_files_with_metadata',
  help: 'Number of files with custom metadata'
})

export const appRedisMemoryUsage = new promClient.Gauge({
  name: 'app_redis_memory_usage',
  help: 'Redis memory usage in bytes'
})

export const appCacheHitRate = new promClient.Gauge({
  name: 'app_cache_hit_rate',
  help: 'Cache hit rate as a percentage (0-1)'
})

export const appDatabaseHealth = new promClient.Gauge({
  name: 'app_database_health',
  help: 'Database health status (1 = healthy, 0 = unhealthy)'
})

export const appRedisHealth = new promClient.Gauge({
  name: 'app_redis_health',
  help: 'Redis health status (1 = healthy, 0 = unhealthy)'
})

export const appRabbitmqHealth = new promClient.Gauge({
  name: 'app_rabbitmq_health',
  help: 'RabbitMQ health status (1 = healthy, 0 = unhealthy)'
})

export const appSystemUptime = new promClient.Gauge({
  name: 'app_system_uptime',
  help: 'System uptime in seconds'
})

// Register all metrics
register.registerMetric(activeConnections)
register.registerMetric(fileUploadsTotal)
register.registerMetric(userRegistrationsTotal)
register.registerMetric(userLoginsTotal)
register.registerMetric(databaseQueryDuration)
register.registerMetric(redisOperationsTotal)
register.registerMetric(rabbitmqMessagesTotal)
register.registerMetric(emailSentTotal)
register.registerMetric(socketConnections)
register.registerMetric(systemMemoryUsage)
register.registerMetric(systemCpuUsage)
register.registerMetric(appTotalUsers)
register.registerMetric(appTotalFiles)
register.registerMetric(appTotalStorageUsed)
register.registerMetric(appActiveUsers24h)
register.registerMetric(appActiveUsers7d)
register.registerMetric(appUserRegistrations)
register.registerMetric(appFileUploads)
register.registerMetric(appAvgFileSize)
register.registerMetric(appFilesWithMetadata)
register.registerMetric(appRedisMemoryUsage)
register.registerMetric(appCacheHitRate)
register.registerMetric(appDatabaseHealth)
register.registerMetric(appRedisHealth)
register.registerMetric(appRabbitmqHealth)
register.registerMetric(appSystemUptime)

// Metrics collection functions
export const updateSystemMetrics = () => {
  const memUsage = process.memoryUsage()
  systemMemoryUsage.set({ type: 'rss' }, memUsage.rss)
  systemMemoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal)
  systemMemoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed)
  systemMemoryUsage.set({ type: 'external' }, memUsage.external)
}

export const updateSocketMetrics = (io) => {
  const connectedSockets = io.engine.clientsCount || 0
  socketConnections.set(connectedSockets)
}

// Analytics metrics update function
export const updateAnalyticsMetrics = async (pool, redisClient, rabbitmqChannel) => {
  try {
    // Update system uptime
    appSystemUptime.set(process.uptime())
    
    // Update database health
    try {
      await pool.query('SELECT 1')
      appDatabaseHealth.set(1)
    } catch (error) {
      appDatabaseHealth.set(0)
    }
    
    // Update Redis health
    try {
      await redisClient.ping()
      appRedisHealth.set(1)
      
      // Get Redis memory usage
      const redisInfo = await redisClient.info('memory')
      const usedMemory = redisInfo.split('\n').find(line => line.startsWith('used_memory:'))
      if (usedMemory) {
        appRedisMemoryUsage.set(parseInt(usedMemory.split(':')[1]))
      }
      
      // Get cache hit rate
      const redisStats = await redisClient.info('stats')
      const hits = redisStats.split('\n').find(line => line.startsWith('keyspace_hits:'))
      const misses = redisStats.split('\n').find(line => line.startsWith('keyspace_misses:'))
      
      if (hits && misses) {
        const hitCount = parseInt(hits.split(':')[1])
        const missCount = parseInt(misses.split(':')[1])
        const total = hitCount + missCount
        if (total > 0) {
          appCacheHitRate.set(hitCount / total)
        }
      }
    } catch (error) {
      appRedisHealth.set(0)
    }
    
    // Update RabbitMQ health
    appRabbitmqHealth.set(rabbitmqChannel ? 1 : 0)
    
  } catch (error) {
    console.error('Error updating analytics metrics:', error)
  }
}

// Export the register for use in the main application
export { register } 