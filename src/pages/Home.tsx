const Home = () => {
  return (
    <div className="card">
      <h1>Welcome to App with PostgreSQL</h1>
      <p>A modern React application with Vite, TypeScript, and PostgreSQL backend.</p>
      <div className="button-group">
        <button onClick={() => window.location.href = '/dashboard'}>
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}

export default Home 