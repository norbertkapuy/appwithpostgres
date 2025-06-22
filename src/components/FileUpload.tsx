import { useState } from 'react'
import axios from 'axios'

interface UploadedFile {
  id: number
  filename: string
  originalName: string
  size: number
  mimeType: string
  uploadedAt: string
  metadata?: {
    title: string
    description: string
    author: string
    department: string
    approvalStatus: string
    version: string
    category: string
  }
  tags?: string[]
}

interface FileMetadata {
  title: string
  description: string
  department: string
  category: string
  tags: string
  approvalStatus: string
  version: string
}

const FileUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [showMetadataForm, setShowMetadataForm] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [metadata, setMetadata] = useState<FileMetadata>({
    title: '',
    description: '',
    department: '',
    category: '',
    tags: '',
    approvalStatus: 'pending',
    version: '1.0'
  })

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
      setShowMetadataForm(true)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setShowMetadataForm(true)
    }
  }

  const handleMetadataSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('title', metadata.title || selectedFile.name)
      formData.append('description', metadata.description)
      formData.append('department', metadata.department)
      formData.append('category', metadata.category)
      formData.append('tags', metadata.tags)
      formData.append('approvalStatus', metadata.approvalStatus)
      formData.append('version', metadata.version)

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setFiles(prev => [response.data.file, ...prev])
      setShowMetadataForm(false)
      setSelectedFile(null)
      setMetadata({
        title: '',
        description: '',
        department: '',
        category: '',
        tags: '',
        approvalStatus: 'pending',
        version: '1.0'
      })
      alert('File uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleCancelUpload = () => {
    setShowMetadataForm(false)
    setSelectedFile(null)
    setMetadata({
      title: '',
      description: '',
      department: '',
      category: '',
      tags: '',
      approvalStatus: 'pending',
      version: '1.0'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="file-upload">
      <h3>File Upload</h3>
      
      {!showMetadataForm ? (
        <div
          className={`upload-area ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-input"
            onChange={handleChange}
            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
            style={{ display: 'none' }}
          />
          <label htmlFor="file-input" className="upload-label">
            <div>
              <div>📁 Drop files here or click to upload</div>
              <div style={{ fontSize: '0.8em', color: '#666', marginTop: '0.5rem' }}>
                Supported: JPG, PNG, GIF, PDF, DOC, TXT, CSV, XLSX (Max 10MB)
              </div>
            </div>
          </label>
        </div>
      ) : (
        <div className="metadata-form">
          <h4>File Metadata</h4>
          <p><strong>File:</strong> {selectedFile?.name}</p>
          
          <form onSubmit={handleMetadataSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title:</label>
              <input
                type="text"
                id="title"
                value={metadata.title}
                onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                placeholder={selectedFile?.name}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                value={metadata.description}
                onChange={(e) => setMetadata({...metadata, description: e.target.value})}
                placeholder="Enter file description..."
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="department">Department:</label>
                <input
                  type="text"
                  id="department"
                  value={metadata.department}
                  onChange={(e) => setMetadata({...metadata, department: e.target.value})}
                  placeholder="e.g., Finance, HR, IT"
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category:</label>
                <input
                  type="text"
                  id="category"
                  value={metadata.category}
                  onChange={(e) => setMetadata({...metadata, category: e.target.value})}
                  placeholder="e.g., Reports, Contracts, Images"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags (comma-separated):</label>
              <input
                type="text"
                id="tags"
                value={metadata.tags}
                onChange={(e) => setMetadata({...metadata, tags: e.target.value})}
                placeholder="e.g., budget, monthly, important"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="approvalStatus">Status:</label>
                <select
                  id="approvalStatus"
                  value={metadata.approvalStatus}
                  onChange={(e) => setMetadata({...metadata, approvalStatus: e.target.value})}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="version">Version:</label>
                <input
                  type="text"
                  id="version"
                  value={metadata.version}
                  onChange={(e) => setMetadata({...metadata, version: e.target.value})}
                  placeholder="1.0"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={uploading} className="auth-button">
                {uploading ? 'Uploading...' : 'Upload File'}
              </button>
              <button type="button" onClick={handleCancelUpload} className="cancel-button">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {files.length > 0 && (
        <div className="uploaded-files">
          <h4>Uploaded Files:</h4>
          {files.map((file) => (
            <div key={file.id} className="file-item">
              <div className="file-info">
                <div className="file-name">
                  {file.metadata?.title || file.originalName}
                </div>
                <div className="file-details">
                  {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                  {file.metadata?.department && ` • ${file.metadata.department}`}
                  {file.tags && file.tags.length > 0 && (
                    <div className="file-tags">
                      {file.tags.map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                {file.metadata?.description && (
                  <div className="file-description">{file.metadata.description}</div>
                )}
              </div>
              <a 
                href={`/api/files/${file.filename}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="download-link"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUpload 