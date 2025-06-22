import { useAuth } from '../contexts/AuthContext'

const Home = () => {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="card">
      <h1>Welcome to App with PostgreSQL</h1>
      <p>A modern React application with Vite, TypeScript, PostgreSQL backend, and authentication.</p>
      
      {isAuthenticated ? (
        <div>
          <p>Welcome back, <strong>{user?.name}</strong>!</p>
          <div className="button-group">
            <button onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p>Please login or register to access the dashboard and file upload features.</p>
          <div className="button-group">
            <button onClick={() => window.location.href = '/login'}>
              Login
            </button>
            <button onClick={() => window.location.href = '/register'}>
              Register
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home 