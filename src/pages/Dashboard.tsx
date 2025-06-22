import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

interface DataItem {
  id: number
  name: string
  description: string
  created_at: string
}

const Dashboard = () => {
  const { data, isLoading, error } = useQuery<DataItem[]>({
    queryKey: ['data'],
    queryFn: async () => {
      const response = await axios.get('/api/data')
      return response.data
    },
    retry: 1
  })

  if (isLoading) return <div className="card">Loading...</div>
  if (error) return <div className="card">Error loading data</div>

  return (
    <div className="card">
      <h1>Dashboard</h1>
      <p>Data from PostgreSQL database:</p>
      {data && data.length > 0 ? (
        <div>
          {data.map((item) => (
            <div key={item.id} style={{ margin: '1rem 0', padding: '1rem', border: '1px solid #333', borderRadius: '4px' }}>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <small>Created: {new Date(item.created_at).toLocaleDateString()}</small>
            </div>
          ))}
        </div>
      ) : (
        <p>No data available</p>
      )}
    </div>
  )
}

export default Dashboard 