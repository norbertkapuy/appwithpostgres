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

// Export the register for use in the main application
export { register } 