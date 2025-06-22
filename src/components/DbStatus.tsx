import { useEffect, useState } from 'react'
import axios from 'axios'

const DbStatus = () => {
  const [status, setStatus] = useState<'ok' | 'error' | 'loading'>('loading')

  useEffect(() => {
    const checkStatus = async () => {
      try {
        await axios.get('/api/db-status')
        setStatus('ok')
      } catch {
        setStatus('error')
      }
    }
    checkStatus()
  }, [])

  if (status === 'loading') return <span style={{ color: '#aaa' }}>Checking DB...</span>
  if (status === 'ok') return <span style={{ color: 'limegreen' }}>DB Connected</span>
  return <span style={{ color: 'red' }}>DB Error</span>
}

export default DbStatus 