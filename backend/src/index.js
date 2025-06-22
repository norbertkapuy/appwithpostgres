import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { Pool } from 'pg'
import multer from 'multer'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server } from 'socket.io'
import Redis from 'ioredis'
import amqp from 'amqplib'
import nodemailer from 'nodemailer'
import { body, validationResult } from 'express-validator'
import { authenticateToken, validateRegistration, validateLogin, authRateLimit } from './middleware/auth.js'
import emailService from './emailService.js'
import prometheusMiddleware from 'express-prometheus-middleware'
import { 
  register, 
  fileUploadsTotal, 
  userRegistrationsTotal, 
  userLoginsTotal, 
  databaseQueryDuration, 
  redisOperationsTotal, 
  rabbitmqMessagesTotal, 
  emailSentTotal, 
  socketConnections, 
  updateSystemMetrics, 
  updateSocketMetrics 
} from './metrics.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost",
    methods: ["GET", "POST"]
  }
})

const PORT = 5000
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const REDIS_HOST = process.env.REDIS_HOST || 'redis'
const REDIS_PORT = parseInt(process.env.REDIS_PORT) || 6379
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq'
const RABBITMQ_PORT = parseInt(process.env.RABBITMQ_PORT) || 5672
const RABBITMQ_USER = process.env.RABBITMQ_USER || 'guest'
const RABBITMQ_PASSWORD = process.env.RABBITMQ_PASSWORD || 'guest'

// Initialize Redis Client
const redisClient = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT
})

redisClient.on('connect', () => {
  console.log('Connected to Redis')
})

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err)
})

// RabbitMQ connection
let rabbitmqConnection = null
let rabbitmqChannel = null

const connectRabbitMQ = async () => {
  try {
    rabbitmqConnection = await amqp.connect(`amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`)
    rabbitmqConnection.on('error', (err) => {
      console.error('RabbitMQ connection error:', err)
      // Attempt to reconnect on error
      setTimeout(connectRabbitMQ, 5000)
    })
    rabbitmqConnection.on('close', () => {
      console.log('RabbitMQ connection closed. Reconnecting...')
      setTimeout(connectRabbitMQ, 5000)
    })
    
    rabbitmqChannel = await rabbitmqConnection.createChannel()
    console.log('Connected to RabbitMQ')
    // Assert a queue for messages
    await rabbitmqChannel.assertQueue('app_messages', { durable: true })
    console.log('RabbitMQ queue asserted: app_messages')
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error.message)
    setTimeout(connectRabbitMQ, 5000)
  }
}

connectRabbitMQ()

// Middleware
app.set('trust proxy', 1) // Trust first proxy
app.use(helmet())
app.use(cors())
app.use(morgan('combined'))
app.use(express.json())

// Prometheus middleware for metrics collection
app.use(prometheusMiddleware({
  metricsPath: '/metrics',
  collectDefaultMetrics: false, // We're using our custom metrics
  requestDurationBuckets: [0.1, 0.5, 1, 2, 5],
  requestLengthBuckets: [512, 1024, 5120, 10240, 51200],
  responseLengthBuckets: [512, 1024, 5120, 10240, 51200],
  extraMasks: [/^\/api\/.*$/],
  normalizePath: [['^/api/.*', '/api/#generic']]
}))

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'postgres',
  database: process.env.DB_NAME || 'appwithpostgres',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
})

// Storage configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads'
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB

// Ensure upload directory exists
fs.ensureDirSync(UPLOAD_DIR)

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|csv|xlsx|xls/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    
    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only supported file types are allowed'))
    }
  }
})

// Rate limiting for auth endpoints
const authLimiter = rateLimit(authRateLimit)

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err)
  } else {
    console.log('Database connected successfully')
  }
})

// Initialize database tables
const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    // Ensure columns exist (for upgrades)
    await pool.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)`)
    await pool.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS files (
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
      )
    `)
    // Ensure columns exist (for upgrades)
    await pool.query(`ALTER TABLE files ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)`)
    await pool.query(`ALTER TABLE files ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`)
    await pool.query(`ALTER TABLE files ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'`)
    await pool.query(`ALTER TABLE files ADD COLUMN IF NOT EXISTS content TEXT`)
    await pool.query(`ALTER TABLE files ADD COLUMN IF NOT EXISTS tags TEXT[]`)

    // Create indexes for better performance
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_files_metadata ON files USING GIN (metadata)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_files_tags ON files USING GIN (tags)`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_files_content ON files USING GIN (to_tsvector('english', content))`)

    // Insert sample data if table is empty
    const result = await pool.query('SELECT COUNT(*) FROM items')
    if (parseInt(result.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO items (name, description) VALUES 
        ('Sample Item 1', 'This is a sample item for testing'),
        ('Sample Item 2', 'Another sample item with different description'),
        ('Sample Item 3', 'Third sample item to populate the database')
      `)
      console.log('Sample data inserted')
    }
  } catch (error) {
    console.error('Database initialization error:', error)
  }
}

initDatabase()

// Authentication routes
app.post('/api/auth/register', authLimiter, validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password } = req.body

    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Create user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash]
    )

    const user = result.rows[0]

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Send welcome email notification
    try {
      await emailService.sendWelcomeEmail(email, name)
      console.log(`Welcome email sent to ${email}`)
      // Track email metrics
      emailSentTotal.inc({ template: 'welcome', status: 'success' })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Track email metrics
      emailSentTotal.inc({ template: 'welcome', status: 'error' })
      // Don't fail the registration if email fails
    }

    // Track registration metrics
    userRegistrationsTotal.inc()

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

app.post('/api/auth/login', authLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (result.rows.length === 0) {
      // Track failed login
      userLoginsTotal.inc({ status: 'failed' })
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const user = result.rows[0]

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      // Track failed login
      userLoginsTotal.inc({ status: 'failed' })
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Track successful login
    userLoginsTotal.inc({ status: 'success' })

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    // Track failed login
    userLoginsTotal.inc({ status: 'error' })
    res.status(500).json({ error: 'Login failed' })
  }
})

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.user.userId])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user: result.rows[0] })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user info' })
  }
})

// Protected routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' })
})

app.get('/api/db-status', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', message: 'PostgreSQL connection successful' })
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'PostgreSQL connection failed', error: error.message })
  }
})

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  if (!token) {
    return next(new Error('Authentication error'))
  }
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return next(new Error('Authentication error'))
    }
    socket.userId = decoded.userId
    socket.userEmail = decoded.email
    next()
  })
})

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.userEmail} connected`)
  
  // Join user to their personal room
  socket.join(`user_${socket.userId}`)
  
  socket.on('disconnect', () => {
    console.log(`User ${socket.userEmail} disconnected`)
  })
})

// Helper function to emit updates to specific user
const emitToUser = (userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data)
}

// Helper function to emit updates to all connected users
const emitToAll = (event, data) => {
  io.emit(event, data)
}

// Cache status endpoint
app.get('/api/cache-status', async (req, res) => {
  try {
    const status = redisClient.status
    if (status === 'ready') {
      await redisClient.ping()
      res.json({ status: 'ok', message: 'Redis connection successful' })
    } else {
      res.status(500).json({ status: 'error', message: `Redis not ready: ${status}` })
    }
  } catch (error) {
    console.error('Error checking Redis status:', error)
    res.status(500).json({ status: 'error', message: 'Redis connection failed', error: error.message })
  }
})

app.get('/api/data', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const cacheKey = `items:${userId}`

    // Try to get data from cache
    const cachedItems = await redisClient.get(cacheKey)
    if (cachedItems) {
      console.log('Serving items from Redis cache')
      return res.json(JSON.parse(cachedItems))
    }

    // If not in cache, fetch from DB
    const result = await pool.query('SELECT * FROM items WHERE user_id = $1 ORDER BY created_at DESC', [userId])
    const items = result.rows

    // Store in cache for 1 minute
    await redisClient.setex(cacheKey, 60, JSON.stringify(items))
    
    res.json(items)
  } catch (error) {
    console.error('Error fetching data:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/data', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body
    if (!name) {
      return res.status(400).json({ error: 'Name is required' })
    }
    
    const userId = req.user.userId
    const result = await pool.query(
      'INSERT INTO items (name, description, user_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, userId]
    )
    
    const newItem = result.rows[0]
    
    // Invalidate cache for this user's items
    await redisClient.del(`items:${userId}`)

    // Emit real-time update to the user who created the item
    emitToUser(userId, 'item_created', newItem)

    // Publish message to RabbitMQ
    if (rabbitmqChannel) {
      rabbitmqChannel.sendToQueue('app_messages', Buffer.from(JSON.stringify({ type: 'item_created', data: newItem }))) 
      console.log('Message sent to RabbitMQ: item_created', newItem.id)
    }
    
    res.status(201).json(newItem)
  } catch (error) {
    console.error('Error creating item:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.put('/api/data/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description } = req.body
    const userId = req.user.userId
    
    const result = await pool.query(
      'UPDATE items SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
      [name, description, id, userId]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' })
    }
    
    const updatedItem = result.rows[0]
    
    // Invalidate cache for this user's items
    await redisClient.del(`items:${userId}`)

    // Emit real-time update
    emitToUser(userId, 'item_updated', updatedItem)

    // Publish message to RabbitMQ
    if (rabbitmqChannel) {
      rabbitmqChannel.sendToQueue('app_messages', Buffer.from(JSON.stringify({ type: 'item_updated', data: updatedItem }))) 
      console.log('Message sent to RabbitMQ: item_updated', updatedItem.id)
    }
    
    res.json(updatedItem)
  } catch (error) {
    console.error('Error updating item:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.delete('/api/data/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId
    
    const result = await pool.query(
      'DELETE FROM items WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' })
    }
    
    // Invalidate cache for this user's items
    await redisClient.del(`items:${userId}`)

    // Emit real-time update
    emitToUser(userId, 'item_deleted', { id: parseInt(id) })

    // Publish message to RabbitMQ
    if (rabbitmqChannel) {
      rabbitmqChannel.sendToQueue('app_messages', Buffer.from(JSON.stringify({ type: 'item_deleted', data: { id: parseInt(id) } }))) 
      console.log('Message sent to RabbitMQ: item_deleted', id)
    }
    
    res.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Error deleting item:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// File upload endpoint (protected)
app.post('/api/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { filename, originalname, path: filePath, size, mimetype } = req.file
    const userId = req.user.userId

    // Extract metadata from request body
    const metadata = {
      title: req.body.title || originalname,
      description: req.body.description || '',
      author: req.user.name,
      department: req.body.department || '',
      approvalStatus: req.body.approvalStatus || 'pending',
      version: req.body.version || '1.0',
      category: req.body.category || '',
      ...req.body.metadata // Allow additional custom metadata
    }

    // Parse tags from request body
    const tags = req.body.tags ? 
      (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map(tag => tag.trim())) : 
      []

    // Extract content if provided (for text-based files)
    const content = req.body.content || ''

    // Save file info to database with enhanced metadata
    const result = await pool.query(
      'INSERT INTO files (filename, original_name, file_path, file_size, mime_type, user_id, metadata, content, tags) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [filename, originalname, filePath, size, mimetype, userId, JSON.stringify(metadata), content, tags]
    )

    const newFile = result.rows[0]

    // Track file upload metrics
    fileUploadsTotal.inc({ user_id: userId.toString(), file_type: mimetype })

    // Invalidate cache for this user's files
    await redisClient.del(`files:${userId}`)

    // Emit real-time update
    emitToUser(userId, 'file_uploaded', {
      id: newFile.id,
      filename: filename,
      originalName: originalname,
      size: size,
      mimeType: mimetype,
      uploadedAt: newFile.uploaded_at,
      metadata: newFile.metadata,
      tags: newFile.tags
    })

    // Publish message to RabbitMQ
    if (rabbitmqChannel) {
      rabbitmqChannel.sendToQueue('app_messages', Buffer.from(JSON.stringify({ type: 'file_uploaded', data: newFile }))) 
      console.log('Message sent to RabbitMQ: file_uploaded', newFile.id)
      // Track RabbitMQ metrics
      rabbitmqMessagesTotal.inc({ queue: 'app_messages', action: 'publish' })
    }

    // Send email notification
    try {
      await emailService.sendFileUploadedEmail(req.user.email, originalname, req.user.name)
      console.log(`File upload email sent to ${req.user.email}`)
      // Track email metrics
      emailSentTotal.inc({ template: 'fileUploaded', status: 'success' })
    } catch (emailError) {
      console.error('Failed to send file upload email:', emailError)
      // Track email metrics
      emailSentTotal.inc({ template: 'fileUploaded', status: 'error' })
      // Don't fail the upload if email fails
    }

    res.status(201).json({
      message: 'File uploaded successfully',
      file: {
        id: newFile.id,
        filename: filename,
        originalName: originalname,
        size: size,
        mimeType: mimetype,
        uploadedAt: newFile.uploaded_at,
        metadata: newFile.metadata,
        tags: newFile.tags
      }
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    res.status(500).json({ error: 'File upload failed' })
  }
})

// Get uploaded files (protected)
app.get('/api/files', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const cacheKey = `files:${userId}`

    // Try to get data from cache
    const cachedFiles = await redisClient.get(cacheKey)
    if (cachedFiles) {
      console.log('Serving files from Redis cache')
      return res.json(JSON.parse(cachedFiles))
    }

    // If not in cache, fetch from DB
    const result = await pool.query('SELECT * FROM files WHERE user_id = $1 ORDER BY uploaded_at DESC', [userId])
    const files = result.rows

    // Store in cache for 1 minute
    await redisClient.setex(cacheKey, 60, JSON.stringify(files))

    res.json(files)
  } catch (error) {
    console.error('Error fetching files:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Search files by tags (protected)
app.get('/api/files/search/tags', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { tags } = req.query

    if (!tags) {
      return res.status(400).json({ error: 'Tags parameter is required' })
    }

    const tagArray = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())
    
    const result = await pool.query(
      'SELECT * FROM files WHERE user_id = $1 AND tags && $2 ORDER BY uploaded_at DESC',
      [userId, tagArray]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Error searching files by tags:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Search files by metadata (protected)
app.get('/api/files/search/metadata', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { key, value } = req.query

    if (!key || !value) {
      return res.status(400).json({ error: 'Key and value parameters are required' })
    }

    const result = await pool.query(
      'SELECT * FROM files WHERE user_id = $1 AND metadata->>$2 = $3 ORDER BY uploaded_at DESC',
      [userId, key, value]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Error searching files by metadata:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Full-text search in content (protected)
app.get('/api/files/search/content', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { query } = req.query

    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' })
    }

    const result = await pool.query(
      `SELECT *, ts_rank(to_tsvector('english', content), plainto_tsquery('english', $2)) as rank 
       FROM files 
       WHERE user_id = $1 AND content IS NOT NULL AND content != '' 
       AND to_tsvector('english', content) @@ plainto_tsquery('english', $2)
       ORDER BY rank DESC, uploaded_at DESC`,
      [userId, query]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Error searching files by content:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get files by department (protected)
app.get('/api/files/department/:department', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId
    const { department } = req.params

    const result = await pool.query(
      'SELECT * FROM files WHERE user_id = $1 AND metadata->>\'department\' = $2 ORDER BY uploaded_at DESC',
      [userId, department]
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching files by department:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update file metadata (protected)
app.put('/api/files/:id/metadata', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId
    const { metadata, tags, content } = req.body

    // Build update query dynamically
    let updateFields = []
    let values = [id, userId]
    let valueIndex = 3

    if (metadata) {
      updateFields.push(`metadata = $${valueIndex}`)
      values.push(JSON.stringify(metadata))
      valueIndex++
    }

    if (tags) {
      updateFields.push(`tags = $${valueIndex}`)
      values.push(Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()))
      valueIndex++
    }

    if (content !== undefined) {
      updateFields.push(`content = $${valueIndex}`)
      values.push(content)
      valueIndex++
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    const result = await pool.query(
      `UPDATE files SET ${updateFields.join(', ')}, uploaded_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' })
    }

    const updatedFile = result.rows[0]

    // Invalidate cache for this user's files
    await redisClient.del(`files:${userId}`)

    // Emit real-time update
    emitToUser(userId, 'file_updated', updatedFile)

    // Publish message to RabbitMQ
    if (rabbitmqChannel) {
      rabbitmqChannel.sendToQueue('app_messages', Buffer.from(JSON.stringify({ type: 'file_updated', data: updatedFile }))) 
      console.log('Message sent to RabbitMQ: file_updated', updatedFile.id)
    }

    res.json(updatedFile)
  } catch (error) {
    console.error('Error updating file metadata:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Serve uploaded files (protected)
app.get('/api/files/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params
    const filePath = path.join(UPLOAD_DIR, filename)
    
    // Check if file belongs to user
    const result = await pool.query('SELECT * FROM files WHERE filename = $1 AND user_id = $2', [filename, req.user.userId])
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' })
    }
    
    if (await fs.pathExists(filePath)) {
      res.sendFile(filePath)
    } else {
      res.status(404).json({ error: 'File not found' })
    }
  } catch (error) {
    console.error('Error serving file:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Storage info endpoint (protected)
app.get('/api/storage/info', authenticateToken, async (req, res) => {
  try {
    const files = await fs.readdir(UPLOAD_DIR)
    const stats = await fs.stat(UPLOAD_DIR)
    
    let totalSize = 0
    for (const file of files) {
      const filePath = path.join(UPLOAD_DIR, file)
      const fileStats = await fs.stat(filePath)
      totalSize += fileStats.size
    }

    res.json({
      uploadDir: UPLOAD_DIR,
      fileCount: files.length,
      totalSize: totalSize,
      maxFileSize: MAX_FILE_SIZE,
      availableSpace: stats.size
    })
  } catch (error) {
    console.error('Error getting storage info:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// RabbitMQ status endpoint
app.get('/api/rabbitmq-status', async (req, res) => {
  if (rabbitmqChannel) {
    res.json({ status: 'ok', message: 'RabbitMQ connection successful' })
  } else {
    res.status(500).json({ status: 'error', message: 'RabbitMQ connection failed' })
  }
})

// Email service endpoints
app.get('/api/email/status', async (req, res) => {
  try {
    const configStatus = emailService.getConfigStatus()
    const connectionTest = await emailService.testConnection()
    
    res.json({
      configured: configStatus.configured,
      config: {
        host: configStatus.host,
        port: configStatus.port,
        secure: configStatus.secure,
        user: configStatus.user
      },
      connection: connectionTest
    })
  } catch (error) {
    console.error('Email status check error:', error)
    res.status(500).json({ error: 'Failed to check email status' })
  }
})

app.post('/api/email/test', authenticateToken, async (req, res) => {
  try {
    const { to, templateName, data } = req.body
    
    if (!to || !templateName) {
      return res.status(400).json({ error: 'Email address and template name are required' })
    }

    const result = await emailService.sendEmail(to, templateName, data)
    
    if (result.success) {
      res.json({ message: 'Test email sent successfully', messageId: result.messageId })
    } else {
      res.status(500).json({ error: 'Failed to send test email', details: result.error })
    }
  } catch (error) {
    console.error('Test email error:', error)
    res.status(500).json({ error: 'Failed to send test email' })
  }
})

app.post('/api/email/system-alert', authenticateToken, async (req, res) => {
  try {
    const { alertType, message, adminEmail } = req.body
    
    if (!alertType || !message || !adminEmail) {
      return res.status(400).json({ error: 'Alert type, message, and admin email are required' })
    }

    const result = await emailService.sendSystemAlert(adminEmail, alertType, message)
    
    if (result.success) {
      res.json({ message: 'System alert sent successfully', messageId: result.messageId })
    } else {
      res.status(500).json({ error: 'Failed to send system alert', details: result.error })
    }
  } catch (error) {
    console.error('System alert error:', error)
    res.status(500).json({ error: 'Failed to send system alert' })
  }
})

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    // Update system metrics
    updateSystemMetrics()
    
    // Update socket metrics
    updateSocketMetrics(io)
    
    // Get metrics in Prometheus format
    const metrics = await register.metrics()
    
    res.set('Content-Type', register.contentType)
    res.end(metrics)
  } catch (error) {
    console.error('Metrics error:', error)
    res.status(500).json({ error: 'Failed to get metrics' })
  }
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Socket.io server ready for real-time updates`)
  console.log(`Upload directory: ${UPLOAD_DIR}`)
  console.log(`Max file size: ${MAX_FILE_SIZE} bytes`)
}) 