import { useState } from 'react'
import axios from 'axios'

interface UploadedFile {
  id: number
  filename: string
  originalName: string
  size: number
  mimeType: string
  uploadedAt: string
}

const FileUpload = () => {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

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
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = async (fileList: FileList) => {
    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', fileList[0])

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setFiles(prev => [response.data.file, ...prev])
      alert('File uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
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
          {uploading ? (
            <div>Uploading...</div>
          ) : (
            <div>
              <div>📁 Drop files here or click to upload</div>
              <div style={{ fontSize: '0.8em', color: '#666', marginTop: '0.5rem' }}>
                Supported: JPG, PNG, GIF, PDF, DOC, TXT, CSV, XLSX (Max 10MB)
              </div>
            </div>
          )}
        </label>
      </div>

      {files.length > 0 && (
        <div className="uploaded-files">
          <h4>Uploaded Files:</h4>
          {files.map((file) => (
            <div key={file.id} className="file-item">
              <div className="file-info">
                <div className="file-name">{file.originalName}</div>
                <div className="file-details">
                  {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                </div>
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