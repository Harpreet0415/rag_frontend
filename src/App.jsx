import { useState } from 'react'
import './App.css'
import UploadZone from './components/UploadZone'
import ChatInterface from './components/ChatInterface'

// Animated background orbs
function BackgroundOrbs() {
    return (
        <div className="bg-orbs" aria-hidden>
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />
        </div>
    )
}

export default function App() {
    const [session, setSession] = useState(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleDocumentLoaded = (data) => {
        setSession(data)
    }

    const handleReset = () => {
        setSession(null)
    }

    return (
        <div className="app">
            <BackgroundOrbs />
            {session ? (
                <div className="chat-layout">
                    <ChatInterface session={session} onReset={handleReset} />
                </div>
            ) : (
                <div className="landing-layout">
                    <UploadZone
                        onDocumentLoaded={handleDocumentLoaded}
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                    />
                    {isLoading && (
                        <div className="loading-overlay fade-in">
                            <div className="loading-card glass">
                                <div className="loading-spinner-large" />
                                <p className="loading-text">Analyzing your document…</p>
                                <p className="loading-sub">Extracting text, building embeddings, generating summary</p>
                                <div className="loading-steps">
                                    {['Extracting text', 'Creating chunks', 'Building index', 'Summarizing'].map((step, i) => (
                                        <div key={step} className="loading-step" style={{ animationDelay: `${i * 0.4}s` }}>
                                            <div className="step-dot shimmer" />
                                            <span>{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
