import { useState } from 'react'
import axios from 'axios'

interface EmailStatus {
  configured: boolean
  config: {
    host: string
    port: number
    secure: boolean
    user: string
  }
  connection: {
    success: boolean
    message?: string
    error?: string
  }
}

const EmailTest = () => {
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('welcome')
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const checkEmailStatus = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/email/status')
      setEmailStatus(response.data)
    } catch (error) {
      console.error('Failed to check email status:', error)
      setEmailStatus(null)
    } finally {
      setLoading(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) {
      setTestResult({ success: false, message: 'Please enter an email address' })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('/api/email/test', {
        to: testEmail,
        templateName: selectedTemplate,
        data: { userName: 'Test User' }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setTestResult({ success: true, message: response.data.message })
    } catch (error: any) {
      console.error('Failed to send test email:', error)
      setTestResult({ 
        success: false, 
        message: error.response?.data?.error || 'Failed to send test email' 
      })
    } finally {
      setLoading(false)
    }
  }

  const sendSystemAlert = async () => {
    if (!testEmail) {
      setTestResult({ success: false, message: 'Please enter an email address' })
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('/api/email/system-alert', {
        alertType: 'Test Alert',
        message: 'This is a test system alert to verify email functionality.',
        adminEmail: testEmail
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setTestResult({ success: true, message: response.data.message })
    } catch (error: any) {
      console.error('Failed to send system alert:', error)
      setTestResult({ 
        success: false, 
        message: error.response?.data?.error || 'Failed to send system alert' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="email-test">
      <h3>Email Notification System</h3>
      
      <div className="email-status-section">
        <h4>Email Configuration Status</h4>
        <button 
          onClick={checkEmailStatus} 
          disabled={loading} 
          className="auth-button"
        >
          {loading ? 'Checking...' : 'Check Email Status'}
        </button>

        {emailStatus && (
          <div className="status-display">
            <div className="status-item">
              <strong>Configured:</strong> 
              <span className={`status-indicator ${emailStatus.configured ? 'connected' : 'disconnected'}`}>
                {emailStatus.configured ? '●' : '○'}
              </span>
              {emailStatus.configured ? 'Yes' : 'No'}
            </div>
            
            <div className="status-item">
              <strong>Connection:</strong> 
              <span className={`status-indicator ${emailStatus.connection.success ? 'connected' : 'disconnected'}`}>
                {emailStatus.connection.success ? '●' : '○'}
              </span>
              {emailStatus.connection.success ? 'Connected' : 'Failed'}
            </div>

            {emailStatus.connection.error && (
              <div className="error-message">
                <strong>Error:</strong> {emailStatus.connection.error}
              </div>
            )}

            <div className="config-details">
              <h5>Configuration Details:</h5>
              <ul>
                <li><strong>Host:</strong> {emailStatus.config.host}</li>
                <li><strong>Port:</strong> {emailStatus.config.port}</li>
                <li><strong>Secure:</strong> {emailStatus.config.secure ? 'Yes' : 'No'}</li>
                <li><strong>User:</strong> {emailStatus.config.user}</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="email-test-section">
        <h4>Test Email Functionality</h4>
        
        <div className="form-group">
          <label htmlFor="test-email">Test Email Address:</label>
          <input
            type="email"
            id="test-email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Enter email address for testing"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email-template">Email Template:</label>
          <select
            id="email-template"
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
          >
            <option value="welcome">Welcome Email</option>
            <option value="fileUploaded">File Upload Confirmation</option>
            <option value="fileApproved">File Approval Notification</option>
            <option value="fileRejected">File Rejection Notification</option>
            <option value="passwordReset">Password Reset</option>
          </select>
        </div>

        <div className="test-actions">
          <button 
            onClick={sendTestEmail} 
            disabled={loading || !testEmail} 
            className="auth-button"
          >
            {loading ? 'Sending...' : 'Send Test Email'}
          </button>
          
          <button 
            onClick={sendSystemAlert} 
            disabled={loading || !testEmail} 
            className="cancel-button"
          >
            Send System Alert
          </button>
        </div>

        {testResult && (
          <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
            <strong>{testResult.success ? 'Success:' : 'Error:'}</strong> {testResult.message}
          </div>
        )}
      </div>

      <div className="email-info">
        <h4>Email Configuration</h4>
        <p>This system supports various SMTP configurations for on-premise email servers:</p>
        <ul>
          <li><strong>Postfix/Sendmail:</strong> Use localhost:25</li>
          <li><strong>Exchange/Outlook:</strong> Use your Exchange server</li>
          <li><strong>Office 365:</strong> Use smtp.office365.com:587</li>
          <li><strong>Gmail:</strong> Use smtp.gmail.com:587 (requires app password)</li>
        </ul>
        <p>Configure your SMTP settings in the <code>.env</code> file and restart the application.</p>
      </div>
    </div>
  )
}

export default EmailTest 