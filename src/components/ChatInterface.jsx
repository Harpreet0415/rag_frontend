import { useState, useEffect, useRef } from 'react'
import './ChatInterface.css'

const API_BASE = 'http://localhost:5000/api'

function Message({ msg }) {
    const isUser = msg.role === 'user'
    return (
        <div className={`message-row ${isUser ? 'user-row' : 'ai-row'} fade-in`}>
            <div className={`avatar ${isUser ? 'user-avatar' : 'ai-avatar'}`}>
                {isUser ? '👤' : '✦'}
            </div>
            <div className={`bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`}>
                <div className="bubble-text">{msg.content}</div>
                {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="citations">
                        <div className="citations-label">📎 Sources</div>
                        {msg.citations.map((c) => (
                            <div key={c.source_num} className="citation-item">
                                <span className="citation-badge">Page {c.page_num}</span>
                                <span className="citation-text">{c.text}</span>
                                <span className="citation-score" title="Relevance score">{(c.score * 100).toFixed(0)}%</span>
                            </div>
                        ))}
                    </div>
                )}
                <div className="message-meta">{msg.time}</div>
            </div>
        </div>
    )
}

function ThinkingIndicator() {
    return (
        <div className="message-row ai-row fade-in">
            <div className="avatar ai-avatar">✦</div>
            <div className="bubble ai-bubble thinking">
                <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
        </div>
    )
}

export default function ChatInterface({ session, onReset }) {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [isThinking, setIsThinking] = useState(false)
    const [showSummary, setShowSummary] = useState(true)
    const bottomRef = useRef(null)
    const inputRef = useRef(null)

    const apiKey = localStorage.getItem('groq_api_key') || ''

    useEffect(() => {
        // Welcome message with summary
        const welcome = {
            role: 'ai',
            content: `✦ Document loaded! Here's a quick summary:\n\n${session.summary}`,
            citations: [],
            time: now()
        }
        setMessages([welcome])
        setShowSummary(false)
        inputRef.current?.focus()
    }, [session.session_id])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isThinking])

    const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const sendQuestion = async () => {
        const q = input.trim()
        if (!q || isThinking) return
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: q, citations: [], time: now() }])
        setIsThinking(true)

        try {
            const resp = await fetch(`${API_BASE}/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: session.session_id, question: q })
            })
            const data = await resp.json()
            if (!resp.ok) throw new Error(data.error || 'Server error')
            setMessages(prev => [...prev, {
                role: 'ai',
                content: data.answer,
                citations: data.citations || [],
                time: now()
            }])
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'ai',
                content: `⚠ Error: ${err.message}`,
                citations: [],
                time: now()
            }])
        } finally {
            setIsThinking(false)
        }
    }

    const clearHistory = async () => {
        await fetch(`${API_BASE}/clear_history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: session.session_id })
        })
        setMessages([{ role: 'ai', content: '🗑 Chat history cleared. Ask your next question!', citations: [], time: now() }])
    }

    const suggestedQs = [
        'Summarize the main points',
        'What are the key findings?',
        'List the main topics covered',
        'What conclusions are drawn?'
    ]

    return (
        <div className="chat-wrapper">
            {/* Header */}
            <div className="chat-header glass">
                <div className="doc-info">
                    <div className="doc-icon">📄</div>
                    <div className="doc-details">
                        <span className="doc-name">{session.filename}</span>
                        <span className="doc-meta">{session.num_pages} pages · {session.num_chunks} chunks indexed</span>
                    </div>
                </div>
                <div className="header-actions">
                    <span className="badge badge-green">
                        <span className="pulse-dot" style={{ width: 6, height: 6 }} />Ready
                    </span>
                    <button id="clearHistoryBtn" className="btn btn-ghost btn-xs" onClick={clearHistory} title="Clear history">🗑</button>
                    <button id="newDocBtn" className="btn btn-ghost btn-xs" onClick={onReset} title="Upload new doc">📁 New</button>
                </div>
            </div>

            {/* Messages */}
            <div className="messages-area">
                {messages.map((m, i) => <Message key={i} msg={m} />)}
                {isThinking && <ThinkingIndicator />}
                <div ref={bottomRef} />
            </div>

            {/* Suggestions (shown when only welcome message) */}
            {messages.length === 1 && (
                <div className="suggestions fade-in">
                    {suggestedQs.map(q => (
                        <button key={q} id={`suggest_${q.slice(0, 10)}`} className="suggestion-btn" onClick={() => setInput(q)}>
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <div className="input-area glass">
                <textarea
                    id="questionInput"
                    ref={inputRef}
                    className="chat-input"
                    placeholder="Ask anything about your document..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendQuestion() }
                    }}
                    rows={1}
                />
                <button
                    id="sendBtn"
                    className={`send-btn ${isThinking ? '' : 'ready'}`}
                    onClick={sendQuestion}
                    disabled={!input.trim() || isThinking}
                >
                    {isThinking ? <div className="spinner" /> : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                </button>
            </div>
        </div>
    )
}
