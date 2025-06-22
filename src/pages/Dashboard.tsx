import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useSocket } from '../contexts/SocketContext'
import FileUpload from '../components/FileUpload'

interface Item {
  id: number
  name: string
  description: string
  created_at: string
  updated_at?: string
}

interface CacheStatus {
  status: string
  message: string
}

interface RabbitMQStatus {
  status: string
  message: string
}

const Dashboard = () => {
  const [newItem, setNewItem] = useState({ name: '', description: '' })
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '' })
  const { socket, isConnected } = useSocket()
  const queryClient = useQueryClient()

  // Fetch items
  const { data: items = [], isLoading, error } = useQuery<Item[]>({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await axios.get('/api/data')
      return response.data
    }
  })

  // Fetch cache status
  const { data: cacheStatus, isLoading: isCacheStatusLoading, error: cacheStatusError } = useQuery<CacheStatus>({
    queryKey: ['cacheStatus'],
    queryFn: async () => {
      const response = await axios.get('/api/cache-status')
      return response.data
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  })

  // Fetch RabbitMQ status
  const { data: rabbitmqStatus, isLoading: isRabbitMQStatusLoading, error: rabbitmqStatusError } = useQuery<RabbitMQStatus>({
    queryKey: ['rabbitmqStatus'],
    queryFn: async () => {
      const response = await axios.get('/api/rabbitmq-status')
      return response.data
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  })

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (item: { name: string; description: string }) => {
      const response = await axios.post('/api/data', item)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      setNewItem({ name: '', description: '' })
    }
  })

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, ...item }: { id: number; name: string; description: string }) => {
      const response = await axios.put(`/api/data/${id}`, item)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      setEditingItem(null)
      setEditForm({ name: '', description: '' })
    }
  })

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/data/${id}`)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    }
  })

  // Socket.io real-time updates
  useEffect(() => {
    if (!socket) return

    // Listen for real-time updates
    socket.on('item_created', (newItem: Item) => {
      queryClient.setQueryData(['items'], (old: Item[] = []) => [newItem, ...old])
    })

    socket.on('item_updated', (updatedItem: Item) => {
      queryClient.setQueryData(['items'], (old: Item[] = []) => 
        old.map(item => item.id === updatedItem.id ? updatedItem : item)
      )
    })

    socket.on('item_deleted', ({ id }: { id: number }) => {
      queryClient.setQueryData(['items'], (old: Item[] = []) => 
        old.filter(item => item.id !== id)
      )
    })

    socket.on('file_uploaded', () => {
      queryClient.invalidateQueries({ queryKey: ['files'] })
    })

    return () => {
      socket.off('item_created')
      socket.off('item_updated')
      socket.off('item_deleted')
      socket.off('file_uploaded')
    }
  }, [socket, queryClient])

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (newItem.name.trim()) {
      createItemMutation.mutate(newItem)
    }
  }

  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingItem && editForm.name.trim()) {
      updateItemMutation.mutate({
        id: editingItem.id,
        name: editForm.name,
        description: editForm.description
      })
    }
  }

  const handleDeleteItem = (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteItemMutation.mutate(id)
    }
  }

  const startEditing = (item: Item) => {
    setEditingItem(item)
    setEditForm({ name: item.name, description: item.description })
  }

  const cancelEditing = () => {
    setEditingItem(null)
    setEditForm({ name: '', description: '' })
  }

  if (isLoading) return <div className="loading">Loading...</div>
  if (error) return <div className="error-message">Error loading data</div>

  return (
    <div>
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="status-group">
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '●' : '○'}
            </span>
            {isConnected ? 'Real-time connected' : 'Real-time disconnected'}
          </div>
          <div className="cache-status">
            {isCacheStatusLoading ? (
              'Loading cache status...'
            ) : cacheStatusError ? (
              <span className="status-indicator disconnected">○</span>
            ) : (
              <span className={`status-indicator ${cacheStatus?.status === 'ok' ? 'connected' : 'disconnected'}`}>
                {cacheStatus?.status === 'ok' ? '●' : '○'}
              </span>
            )}
            {isCacheStatusLoading ? 'Cache status: ...' : cacheStatusError ? 'Cache disconnected' : `Cache: ${cacheStatus?.status}`}
          </div>
          <div className="rabbitmq-status">
            {isRabbitMQStatusLoading ? (
              'Loading MQ status...'
            ) : rabbitmqStatusError ? (
              <span className="status-indicator disconnected">○</span>
            ) : (
              <span className={`status-indicator ${rabbitmqStatus?.status === 'ok' ? 'connected' : 'disconnected'}`}>
                {rabbitmqStatus?.status === 'ok' ? '●' : '○'}
              </span>
            )}
            {isRabbitMQStatusLoading ? 'MQ status: ...' : rabbitmqStatusError ? 'MQ disconnected' : `MQ: ${rabbitmqStatus?.status}`}
          </div>
        </div>
      </div>

      {/* Create new item form */}
      <div className="card">
        <h2>Add New Item</h2>
        <form onSubmit={handleCreateItem} className="item-form">
          <div className="form-group">
            <input
              type="text"
              placeholder="Item name"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              required
              disabled={createItemMutation.isLoading}
            />
          </div>
          <div className="form-group">
            <textarea
              placeholder="Description (optional)"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              disabled={createItemMutation.isLoading}
            />
          </div>
          <button type="submit" disabled={createItemMutation.isLoading} className="auth-button">
            {createItemMutation.isLoading ? 'Adding...' : 'Add Item'}
          </button>
        </form>
      </div>

      {/* Items list */}
      <div className="card">
        <h2>Your Items ({items.length})</h2>
        {items.length === 0 ? (
          <p>No items yet. Create your first item above!</p>
        ) : (
          <div className="items-list">
            {items.map((item) => (
              <div key={item.id} className="item-card">
                {editingItem?.id === item.id ? (
                  <form onSubmit={handleUpdateItem} className="edit-form">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                    />
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                    <div className="edit-actions">
                      <button type="submit" disabled={updateItemMutation.isLoading}>
                        {updateItemMutation.isLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button type="button" onClick={cancelEditing}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="item-content">
                      <h3>{item.name}</h3>
                      <p>{item.description}</p>
                      <small>Created: {new Date(item.created_at).toLocaleDateString()}</small>
                      {item.updated_at && (
                        <small>Updated: {new Date(item.updated_at).toLocaleDateString()}</small>
                      )}
                    </div>
                    <div className="item-actions">
                      <button onClick={() => startEditing(item)} className="edit-button">
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)} 
                        className="delete-button"
                        disabled={deleteItemMutation.isLoading}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File upload section */}
      <div className="card">
        <h2>File Upload</h2>
        <FileUpload />
      </div>
    </div>
  )
}

export default Dashboard 