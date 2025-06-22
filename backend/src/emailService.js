import nodemailer from 'nodemailer'

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'noreply@yourdomain.com',
    pass: process.env.SMTP_PASSWORD || 'your-password'
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates for on-premise
  }
}

// Create transporter
const transporter = nodemailer.createTransport(emailConfig)

// Email templates
const emailTemplates = {
  welcome: (userName) => ({
    subject: 'Welcome to Your Application!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #646cff;">Welcome to Your Application!</h2>
        <p>Hello ${userName},</p>
        <p>Thank you for registering with our application. Your account has been successfully created.</p>
        <p>You can now:</p>
        <ul>
          <li>Upload and manage files with rich metadata</li>
          <li>Use advanced search capabilities</li>
          <li>Organize files with tags and categories</li>
          <li>Track document approval workflows</li>
        </ul>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>Your Application Team</p>
      </div>
    `
  }),

  fileUploaded: (fileName, userName) => ({
    subject: 'File Upload Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #646cff;">File Upload Successful</h2>
        <p>Hello ${userName},</p>
        <p>Your file <strong>${fileName}</strong> has been successfully uploaded to the system.</p>
        <p>The file is now available in your dashboard and can be accessed by authorized users.</p>
        <p>File details:</p>
        <ul>
          <li>Filename: ${fileName}</li>
          <li>Upload time: ${new Date().toLocaleString()}</li>
          <li>Status: Processing</li>
        </ul>
        <p>You can view and manage your files in the dashboard.</p>
        <p>Best regards,<br>Your Application Team</p>
      </div>
    `
  }),

  fileApproved: (fileName, userName) => ({
    subject: 'File Approval Notification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">File Approved</h2>
        <p>Hello ${userName},</p>
        <p>Your file <strong>${fileName}</strong> has been approved and is now available for use.</p>
        <p>File details:</p>
        <ul>
          <li>Filename: ${fileName}</li>
          <li>Status: Approved</li>
          <li>Approval time: ${new Date().toLocaleString()}</li>
        </ul>
        <p>The file is now accessible to all authorized users in your organization.</p>
        <p>Best regards,<br>Your Application Team</p>
      </div>
    `
  }),

  fileRejected: (fileName, userName, reason) => ({
    subject: 'File Rejection Notification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">File Rejected</h2>
        <p>Hello ${userName},</p>
        <p>Your file <strong>${fileName}</strong> has been rejected and requires attention.</p>
        <p>File details:</p>
        <ul>
          <li>Filename: ${fileName}</li>
          <li>Status: Rejected</li>
          <li>Rejection time: ${new Date().toLocaleString()}</li>
          <li>Reason: ${reason || 'No specific reason provided'}</li>
        </ul>
        <p>Please review the file and make necessary corrections before resubmitting.</p>
        <p>If you have questions about the rejection, please contact your administrator.</p>
        <p>Best regards,<br>Your Application Team</p>
      </div>
    `
  }),

  systemAlert: (alertType, message) => ({
    subject: `System Alert: ${alertType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ffc107;">System Alert</h2>
        <p><strong>Alert Type:</strong> ${alertType}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <p>This is an automated system notification. Please take appropriate action if required.</p>
        <p>Best regards,<br>System Administrator</p>
      </div>
    `
  }),

  passwordReset: (userName, resetLink) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #646cff;">Password Reset Request</h2>
        <p>Hello ${userName},</p>
        <p>We received a request to reset your password. Click the link below to create a new password:</p>
        <p style="text-align: center; margin: 20px 0;">
          <a href="${resetLink}" style="background-color: #646cff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>Best regards,<br>Your Application Team</p>
      </div>
    `
  })
}

// Email service functions
const emailService = {
  // Send email with template
  async sendEmail(to, templateName, data = {}) {
    try {
      const template = emailTemplates[templateName]
      if (!template) {
        throw new Error(`Email template '${templateName}' not found`)
      }

      // Generate template content
      const templateContent = typeof template === 'function' ? template(data) : template

      const mailOptions = {
        from: `"Your Application" <${emailConfig.auth.user}>`,
        to: to,
        subject: templateContent.subject,
        html: templateContent.html
      }

      const result = await transporter.sendMail(mailOptions)
      console.log(`Email sent successfully to ${to}: ${result.messageId}`)
      return { success: true, messageId: result.messageId }
    } catch (error) {
      console.error('Email sending failed:', error)
      return { success: false, error: error.message }
    }
  },

  // Send welcome email
  async sendWelcomeEmail(userEmail, userName) {
    return this.sendEmail(userEmail, 'welcome', { userName })
  },

  // Send file upload confirmation
  async sendFileUploadedEmail(userEmail, fileName, userName) {
    return this.sendEmail(userEmail, 'fileUploaded', { fileName, userName })
  },

  // Send file approval notification
  async sendFileApprovedEmail(userEmail, fileName, userName) {
    return this.sendEmail(userEmail, 'fileApproved', { fileName, userName })
  },

  // Send file rejection notification
  async sendFileRejectedEmail(userEmail, fileName, userName, reason) {
    return this.sendEmail(userEmail, 'fileRejected', { fileName, userName, reason })
  },

  // Send system alert
  async sendSystemAlert(adminEmail, alertType, message) {
    return this.sendEmail(adminEmail, 'systemAlert', { alertType, message })
  },

  // Send password reset email
  async sendPasswordResetEmail(userEmail, userName, resetLink) {
    return this.sendEmail(userEmail, 'passwordReset', { userName, resetLink })
  },

  // Test email configuration
  async testConnection() {
    try {
      await transporter.verify()
      return { success: true, message: 'Email configuration is valid' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Get email configuration status
  getConfigStatus() {
    return {
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      user: emailConfig.auth.user,
      configured: !!(emailConfig.auth.user && emailConfig.auth.pass)
    }
  }
}

export default emailService 