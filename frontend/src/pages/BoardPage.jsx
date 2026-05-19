import { useState, useCallback, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import Canvas   from '../components/Canvas'
import Toolbar  from '../components/Toolbar'
import Chat     from '../components/Chat'
import useWebSocket from '../hooks/useWebSocket'

function PulseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )
}

function CopyIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}

export default function BoardPage() {
  const { code }                      = useParams()
  const [searchParams]                = useSearchParams()
  const navigate                      = useNavigate()
  const username                      = searchParams.get('username') || 'Anonymous'

  const [tool,      setTool]          = useState('pen')
  const [color,     setColor]         = useState('#00ff88')
  const [width,     setWidth]         = useState(4)
  const [showChat,  setShowChat]      = useState(true)
  const [copied,    setCopied]        = useState(false)

  const { connected, users, messages, send, onDrawRef } = useWebSocket(code, username)

  // Redirect if no username
  useEffect(() => {
    if (!searchParams.get('username')) navigate('/')
  }, [])

  // Called by Canvas when user draws locally
  // Sends the draw event over WebSocket
  const handleDrawEvent = useCallback((payload) => {
    send('draw', payload)
  }, [send])

  // Called when user clicks clear button
  const handleClear = useCallback(() => {
    if (!confirm('Clear the canvas for everyone?')) return
    send('clear', {})
    // Local canvas will clear when the server echoes the clear event back
  }, [send])

  // Called when user sends a chat message
  const handleChat = useCallback((text) => {
    send('chat', {
      user:      username,
      text,
      timestamp: new Date().toISOString(),
    })
  }, [send, username])

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-screen bg-vault-bg flex flex-col overflow-hidden">

      {/* Top bar */}
      <header className="shrink-0 h-12 border-b border-vault-border/60 flex items-center justify-between px-4 bg-vault-surface/50">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-neon-green hover:opacity-80 transition-opacity">
            <PulseIcon />
            <span className="font-mono font-bold text-sm hidden sm:block">
              <span className="text-neon-green">PULSE</span>
              <span className="text-gray-300">BOARD</span>
            </span>
          </Link>

          <div className="w-px h-4 bg-vault-border" />

          {/* Room code + copy */}
          <button onClick={copyCode}
            className="flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded border transition-all duration-200 border-vault-border text-gray-400 hover:border-neon-green/30 hover:text-neon-green">
            <span className="tracking-widest">{code}</span>
            <CopyIcon />
            {copied && <span className="text-neon-green">✓</span>}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-neon-green animate-pulse-slow' : 'bg-neon-red'}`} />
            <span className={`font-mono text-xs ${connected ? 'text-neon-green/70' : 'text-neon-red/70'}`}>
              {connected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>

          {/* Online users */}
          <div className="badge-online">
            <span>{users.length}</span>
            <span>online</span>
          </div>

          {/* Chat toggle */}
          <button onClick={() => setShowChat(!showChat)}
            className={`font-mono text-xs px-2.5 py-1 rounded border transition-all duration-200 ${
              showChat
                ? 'border-neon-cyan/30 text-neon-cyan bg-neon-cyan/5'
                : 'border-vault-border text-gray-500 hover:border-vault-muted'
            }`}>
            CHAT {messages.filter(m => !m.system).length > 0 && `(${messages.filter(m => !m.system).length})`}
          </button>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Toolbar — left side */}
        <div className="shrink-0 w-14 p-2 border-r border-vault-border/60 flex items-start">
          <Toolbar
            tool={tool}   setTool={setTool}
            color={color} setColor={setColor}
            width={width} setWidth={setWidth}
            onClear={handleClear}
          />
        </div>

        {/* Canvas — center */}
        <div className="flex-1 relative overflow-hidden">
          {!connected && (
            <div className="absolute inset-0 bg-vault-bg/80 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="font-mono text-sm text-neon-amber mb-2">Connecting...</div>
                <div className="font-mono text-xs text-gray-500">Establishing WebSocket connection</div>
              </div>
            </div>
          )}
          <Canvas
            tool={tool}
            color={color}
            width={width}
            onDrawEvent={handleDrawEvent}
            onDrawRef={onDrawRef}
          />
        </div>

        {/* Chat — right side */}
        {showChat && (
          <div className="shrink-0 w-64 border-l border-vault-border/60 p-2">
            <Chat
              messages={messages}
              onSend={handleChat}
              username={username}
            />
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="shrink-0 h-7 border-t border-vault-border/40 flex items-center justify-between px-4 bg-vault-surface/30">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-gray-600">
            Tool: <span className="text-gray-400">{tool}</span>
          </span>
          <span className="font-mono text-xs text-gray-600">
            Size: <span className="text-gray-400">{width}px</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {users.slice(0, 5).map((u, i) => (
            <span key={i} className={`font-mono text-xs ${u === username ? 'text-neon-green' : 'text-gray-500'}`}>
              {u === username ? `${u} (you)` : u}
            </span>
          ))}
          {users.length > 5 && (
            <span className="font-mono text-xs text-gray-600">+{users.length - 5} more</span>
          )}
        </div>
      </div>
    </div>
  )
}