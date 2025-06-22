import React, { useState, useEffect } from 'react'

interface MonitoringStatusProps {
  className?: string
}

interface PrometheusTarget {
  instance: string
  job: string
  health: string
  lastError: string
  lastScrape: string
}

interface PrometheusResponse {
  status: string
  data: {
    activeTargets: PrometheusTarget[]
  }
}

const MonitoringStatus: React.FC<MonitoringStatusProps> = ({ className = '' }) => {
  const [prometheusStatus, setPrometheusStatus] = useState<'loading' | 'up' | 'down'>('loading')
  const [grafanaStatus, setGrafanaStatus] = useState<'loading' | 'up' | 'down'>('loading')
  const [targets, setTargets] = useState<PrometheusTarget[]>([])

  useEffect(() => {
    const checkPrometheusStatus = async () => {
      try {
        const response = await fetch('http://localhost:9090/api/v1/targets')
        if (response.ok) {
          const data: PrometheusResponse = await response.json()
          setPrometheusStatus('up')
          setTargets(data.data.activeTargets)
        } else {
          setPrometheusStatus('down')
        }
      } catch (error) {
        console.error('Failed to check Prometheus status:', error)
        setPrometheusStatus('down')
      }
    }

    const checkGrafanaStatus = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/health')
        if (response.ok) {
          setGrafanaStatus('up')
        } else {
          setGrafanaStatus('down')
        }
      } catch (error) {
        console.error('Failed to check Grafana status:', error)
        setGrafanaStatus('down')
      }
    }

    checkPrometheusStatus()
    checkGrafanaStatus()

    // Check status every 30 seconds
    const interval = setInterval(() => {
      checkPrometheusStatus()
      checkGrafanaStatus()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-yellow-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'up':
        return '🟢'
      case 'down':
        return '🔴'
      default:
        return '🟡'
    }
  }

  const backendTarget = targets.find(target => target.job === 'backend-api')

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Monitoring Status</h3>
      
      <div className="space-y-4">
        {/* Prometheus Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getStatusIcon(prometheusStatus)}</span>
            <span className="font-medium">Prometheus</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${getStatusColor(prometheusStatus)}`}>
              {prometheusStatus === 'loading' ? 'Checking...' : prometheusStatus.toUpperCase()}
            </span>
            <a
              href="http://localhost:9090"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Open
            </a>
          </div>
        </div>

        {/* Grafana Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getStatusIcon(grafanaStatus)}</span>
            <span className="font-medium">Grafana</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${getStatusColor(grafanaStatus)}`}>
              {grafanaStatus === 'loading' ? 'Checking...' : grafanaStatus.toUpperCase()}
            </span>
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Open
            </a>
          </div>
        </div>

        {/* Backend API Metrics Status */}
        {backendTarget && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getStatusIcon(backendTarget.health)}</span>
              <span className="font-medium">Backend API Metrics</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${getStatusColor(backendTarget.health)}`}>
                {backendTarget.health.toUpperCase()}
              </span>
              <a
                href="http://localhost:5001/metrics"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                View
              </a>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Links</h4>
          <div className="space-y-1">
            <a
              href="http://localhost:9090/graph"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Prometheus Graph
            </a>
            <a
              href="http://localhost:3000/dashboards"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Grafana Dashboards
            </a>
            <a
              href="http://localhost:15672"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-blue-600 hover:text-blue-800 underline"
            >
              RabbitMQ Management
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonitoringStatus 