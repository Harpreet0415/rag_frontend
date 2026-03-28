import { useState, useRef } from 'react'
import './UploadZone.css'

// Use environment variable for API URL, fallback to localhost for development
const API_BASE = 'https://rag-backend-1-jl5r.onrender.com/api'

export default function UploadZone({ onDocumentLoaded, isLoading, setIsLoading }) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '')
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem('gemini_api_key'))
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  // Log the API URL for debugging
  console.log('API_BASE URL:', API_BASE)

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.type === 'application/pdf') {
      setFile(dropped)
      setError('')
    } else {
      setError('Only PDF files are supported.')
    }
  }

  const handleFileSelect = (e) => {
    const selected = e.target.files[0]
    if (selected) { setFile(selected); setError('') }
  }

  const handleUpload = async () => {
    if (!file) return
    if (!apiKey.trim()) { setError('Please enter your Gemini API key.'); return }

    localStorage.setItem('gemini_api_key', apiKey.trim())
    setShowKeyInput(false)
    setIsLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('session_id', `session_${Date.now()}`)

    try {
      console.log(`Uploading to: ${API_BASE}/upload`)
      const resp = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { 'X-Gemini-Key': apiKey.trim() },
        body: formData
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Upload failed')
      onDocumentLoaded(data)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="upload-zone-wrapper fade-in">
      {/* Logo */}
      <div className="logo-area">
        <div className="logo-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FF458A" />
                <stop offset="1" stopColor="#A24DDB" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="10" fill="url(#logo-grad)" />
            <path d="M8 10h10M8 15h12M8 20h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <circle cx="24" cy="22" r="5" fill="white" fillOpacity="0.9" />
            <path d="M22 22l1.5 1.5L25.5 20" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="logo-text">
          <h1>DocuMind <span>AI</span></h1>
          <p>Intelligent PDF Document Assistant</p>
        </div>
      </div>

      {/* API Key Section */}
      {showKeyInput ? (
        <div className="glass api-key-card fade-in">
          <div className="api-key-header">
            <span className="api-key-icon">🔑</span>
            <div>
              <h3>Gemini API Key</h3>
              <p>Required for Gemini analysis</p>
            </div>
          </div>
          <input
            id="apiKeyInput"
            className="input"
            type="password"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setShowKeyInput(false)}
          />
          <div className="api-key-actions">
            <span className="text-hint">Get yours at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">aistudio.google.com</a></span>
            <button id="saveKeyBtn" className="btn btn-primary btn-sm" onClick={() => { if (apiKey.trim()) { localStorage.setItem('gemini_api_key', apiKey.trim()); setShowKeyInput(false) } }}>Save Key</button>
          </div>
        </div>
      ) : (
        <div className="api-key-saved">
          <span className="pulse-dot" />
          <span>API Key configured</span>
          <button id="changeKeyBtn" className="btn btn-ghost btn-xs" onClick={() => setShowKeyInput(true)}>Change</button>
        </div>
      )}

      {/* Drop Zone */}
      <div
        id="dropZone"
        className={`drop-zone glass ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && fileInputRef.current.click()}
      >
        <input ref={fileInputRef} id="fileInput" type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleFileSelect} />
        {file ? (
          <div className="file-info">
            <div className="file-icon">📄</div>
            <div className="file-details">
              <span className="file-name">{file.name}</span>
              <span className="file-size">{formatSize(file.size)}</span>
            </div>
            <button id="removeFileBtn" className="btn btn-ghost btn-xs remove-btn" onClick={e => { e.stopPropagation(); setFile(null) }}>✕</button>
          </div>
        ) : (
          <div className="drop-placeholder">
            <div className="drop-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <defs>
                  <linearGradient id="drop-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FF458A" stopOpacity="0.5" />
                    <stop offset="1" stopColor="#A24DDB" stopOpacity="0.5" />
                  </linearGradient>
                </defs>
                <rect x="6" y="2" width="28" height="36" rx="6" stroke="url(#drop-grad)" strokeWidth="2.5" fill="none" />
                <path d="M28 2L34 8" stroke="url(#drop-grad)" strokeWidth="2.5" />
                <path d="M24 24V36M18 30l6 6 6-6" stroke="url(#drop-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="drop-title">Drop your PDF here</p>
            <p className="drop-sub">or click to browse files</p>
            <span className="badge badge-purple">PDF Only</span>
          </div>
        )}
      </div>

      {error && <div className="error-msg fade-in">⚠ {error}</div>}

      <button
        id="uploadBtn"
        className="btn btn-primary upload-btn"
        onClick={handleUpload}
        disabled={!file || isLoading}
      >
        {isLoading ? <><div className="spinner" /> Processing... </> : <>✦ Analyze Document</>}
      </button>

      {/* Feature Pills */}
      <div className="features">
        {['Semantic Search', 'Chat History', 'Source Citations', 'Summarization'].map(f => (
          <span key={f} className="feature-pill">{f}</span>
        ))}
      </div>
    </div>
  )
}