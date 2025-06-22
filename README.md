# App with PostgreSQL

A modern full-stack web application built with React, Vite, TypeScript, Node.js, Express, and PostgreSQL, all containerized with Docker for easy deployment on cloud VMs.

## 🚀 Features

- **Frontend**: Modern React 18 with Vite, TypeScript, and React Query
- **Backend**: Node.js/Express API with PostgreSQL integration
- **Database**: PostgreSQL with automatic initialization and sample data
- **Containerization**: Complete Docker setup with Docker Compose
- **Modern UI**: Clean, responsive design with dark/light theme support
- **API Integration**: RESTful API with proper error handling
- **Development**: Hot reloading and development tools

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │  Node.js API    │    │   PostgreSQL    │
│   (Port 80)     │◄──►│   (Port 5000)   │◄──►│   (Port 5432)   │
│   (Nginx)       │    │   (Express)     │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Axios** - HTTP client

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **PostgreSQL** - Relational database
- **pg** - PostgreSQL client
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security headers

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy and static file serving

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/norbertkapuy/appwithpostgres.git
cd appwithpostgres
```

### 2. Start the Application
```bash
docker-compose up -d
```

### 3. Access the Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

## 📁 Project Structure

```
appwithpostgres/
├── src/                    # React frontend source
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── backend/               # Node.js backend
│   ├── src/
│   │   └── index.js       # Express server
│   ├── package.json       # Backend dependencies
│   └── Dockerfile         # Backend container
├── docker-compose.yml     # Multi-container setup
├── Dockerfile             # Frontend container
├── nginx.conf             # Nginx configuration
├── init.sql               # Database initialization
└── package.json           # Frontend dependencies
```

## 🔧 Development

### Local Development (without Docker)
```bash
# Frontend
npm install
npm run dev

# Backend (in another terminal)
cd backend
npm install
npm run dev
```

### Docker Development
```bash
# Build and start all services
docker-compose up --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 🌐 API Endpoints

- `GET /api/health` - Health check
- `GET /api/data` - Get all items
- `POST /api/data` - Create new item

### Example API Usage
```bash
# Get all items
curl http://localhost:5000/api/data

# Create new item
curl -X POST http://localhost:5000/api/data \
  -H "Content-Type: application/json" \
  -d '{"name": "New Item", "description": "Description"}'
```

## 🐳 Docker Commands

```bash
# Build and start all services
docker-compose up -d

# View running containers
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Stop all services
docker-compose down

# Rebuild and restart
docker-compose up --build -d

# Remove volumes (database data)
docker-compose down -v
```

## 🔒 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=appwithpostgres
DB_USER=postgres
DB_PASSWORD=password

# Backend
PORT=5000
NODE_ENV=production
```

## 🚀 Deployment on Cloud VM

### 1. Prepare Your VM
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Deploy the Application
```bash
# Clone the repository
git clone https://github.com/norbertkapuy/appwithpostgres.git
cd appwithpostgres

# Start the application
docker-compose up -d

# Check status
docker-compose ps
```

### 3. Configure Firewall
```bash
# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

## 📊 Monitoring

### View Application Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Database Access
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d appwithpostgres

# View tables
\dt

# Query data
SELECT * FROM items;
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use**: Change ports in `docker-compose.yml`
2. **Database connection failed**: Check if PostgreSQL container is running
3. **Build fails**: Ensure Docker has enough memory and disk space

### Reset Everything
```bash
# Stop and remove everything
docker-compose down -v
docker system prune -a

# Start fresh
docker-compose up --build -d
``` 