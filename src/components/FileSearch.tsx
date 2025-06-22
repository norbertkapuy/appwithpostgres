import { useState } from 'react'
import axios from 'axios'

interface File {
  id: number
  filename: string
  original_name: string
  file_size: number
  mime_type: string
  uploaded_at: string
  metadata: {
    title: string
    description: string
    author: string
    department: string
    approvalStatus: string
    version: string
    category: string
  }
  tags: string[]
  content?: string
}

interface SearchResults {
  files: File[]
  loading: boolean
  error: string | null
}

const FileSearch = () => {
  const [searchType, setSearchType] = useState<'tags' | 'metadata' | 'content'>('tags')
  const [searchQuery, setSearchQuery] = useState('')
  const [metadataKey, setMetadataKey] = useState('department')
  const [metadataValue, setMetadataValue] = useState('')
  const [results, setResults] = useState<SearchResults>({
    files: [],
    loading: false,
    error: null
  })

  const handleSearch = async () => {
    if (!searchQuery && searchType !== 'metadata') {
      setResults({ files: [], loading: false, error: 'Please enter a search query' })
      return
    }

    if (searchType === 'metadata' && (!metadataKey || !metadataValue)) {
      setResults({ files: [], loading: false, error: 'Please enter both key and value for metadata search' })
      return
    }

    setResults({ files: [], loading: true, error: null })

    try {
      let response
      const token = localStorage.getItem('token')

      switch (searchType) {
        case 'tags':
          response = await axios.get(`/api/files/search/tags?tags=${encodeURIComponent(searchQuery)}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          break
        case 'metadata':
          response = await axios.get(`/api/files/search/metadata?key=${encodeURIComponent(metadataKey)}&value=${encodeURIComponent(metadataValue)}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          break
        case 'content':
          response = await axios.get(`/api/files/search/content?query=${encodeURIComponent(searchQuery)}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          break
      }

      setResults({ files: response.data, loading: false, error: null })
    } catch (error) {
      console.error('Search error:', error)
      setResults({ files: [], loading: false, error: 'Search failed. Please try again.' })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const clearResults = () => {
    setResults({ files: [], loading: false, error: null })
    setSearchQuery('')
    setMetadataValue('')
  }

  return (
    <div className="file-search">
      <h3>Advanced File Search</h3>
      
      <div className="search-controls">
        <div className="search-type-selector">
          <label>Search Type:</label>
          <select 
            value={searchType} 
            onChange={(e) => setSearchType(e.target.value as 'tags' | 'metadata' | 'content')}
          >
            <option value="tags">Search by Tags</option>
            <option value="metadata">Search by Metadata</option>
            <option value="content">Full-text Search</option>
          </select>
        </div>

        {searchType === 'tags' && (
          <div className="search-input-group">
            <label>Tags (comma-separated):</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., budget, monthly, important"
            />
          </div>
        )}

        {searchType === 'metadata' && (
          <div className="metadata-search">
            <div className="search-input-group">
              <label>Metadata Key:</label>
              <select value={metadataKey} onChange={(e) => setMetadataKey(e.target.value)}>
                <option value="department">Department</option>
                <option value="category">Category</option>
                <option value="approvalStatus">Approval Status</option>
                <option value="version">Version</option>
                <option value="author">Author</option>
              </select>
            </div>
            <div className="search-input-group">
              <label>Value:</label>
              <input
                type="text"
                value={metadataValue}
                onChange={(e) => setMetadataValue(e.target.value)}
                placeholder="Enter value to search for..."
              />
            </div>
          </div>
        )}

        {searchType === 'content' && (
          <div className="search-input-group">
            <label>Search Query:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter text to search in file content..."
            />
          </div>
        )}

        <div className="search-actions">
          <button onClick={handleSearch} disabled={results.loading} className="auth-button">
            {results.loading ? 'Searching...' : 'Search'}
          </button>
          <button onClick={clearResults} className="cancel-button">
            Clear
          </button>
        </div>
      </div>

      {results.error && (
        <div className="error-message">
          {results.error}
        </div>
      )}

      {results.files.length > 0 && (
        <div className="search-results">
          <h4>Search Results ({results.files.length} files)</h4>
          {results.files.map((file) => (
            <div key={file.id} className="file-item">
              <div className="file-info">
                <div className="file-name">
                  {file.metadata?.title || file.original_name}
                </div>
                <div className="file-details">
                  {formatFileSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString()}
                  {file.metadata?.department && ` • ${file.metadata.department}`}
                  {file.metadata?.category && ` • ${file.metadata.category}`}
                </div>
                {file.metadata?.description && (
                  <div className="file-description">{file.metadata.description}</div>
                )}
                {file.tags && file.tags.length > 0 && (
                  <div className="file-tags">
                    {file.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
                {file.content && searchType === 'content' && (
                  <div className="file-content-preview">
                    <strong>Content Preview:</strong> {file.content.substring(0, 200)}...
                  </div>
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

      {results.files.length === 0 && !results.loading && !results.error && (
        <div className="no-results">
          <p>No files found. Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  )
}

export default FileSearch 