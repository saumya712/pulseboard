import { useState, useCallback, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import Canvas      from '../components/Canvas'
import Toolbar     from '../components/Toolbar'
import Chat        from '../components/Chat'
import useWebSocket from '../hooks/useWebSocket'

export default function BoardPage() {
  const { code }           = useParams()
  const [searchParams]     = useSearchParams()
  const navigate           = useNavigate()
  const username           = searchParams.get('username') || 'Anonymous'

  const [tool,      setTool]      = useState('pen')
  const [color,     setColor]     = useState('#111827')
  const [width,     setWidth]     = useState(4)
  const [chatOpen,  setChatOpen]  = useState(false)
  const [copied,    setCopied]    = useState(false)

  const { connected, users, messages, send, onDrawRef } = useWebSocket(code, username)

  useEffect(() => {
    if (!searchParams.get('username')) navigate('/')
  }, [])

  const handleDrawEvent = useCallback((payload) => {
    send('draw', payload)
  }, [send])

  const handleClear = useCallback(() => {
    if (!confirm('Clear the canvas for everyone?')) return
    send('clear', {})
  }, [send])

  const handleChat = useCallback((text) => {
    send('chat', { user: username, text, timestamp: new Date().toISOString() })
  }, [send, username])

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">

      {/* Top toolbar */}
      <header className="shrink-0 h-14 border-b border-gray-100 flex items-center px-4 gap-4 bg-white shadow-sm">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <span className="font-bold text-sm text-gray-900 hidden sm:block">PulseBoard</span>
        </Link>

        <div className="w-px h-6 bg-gray-200 shrink-0" />

        {/* Drawing tools — takes remaining space */}
        <div className="flex-1 flex items-center">
          <Toolbar
            tool={tool}   setTool={setTool}
            color={color} setColor={setColor}
            width={width} setWidth={setWidth}
            onClear={handleClear}
          />
        </div>

        {/* Right side info */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Room code */}
          <button onClick={copyCode}
            className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-mono font-medium text-gray-600 hover:border-brand-purple hover:text-brand-purple transition-all">
            {code}
            <span className="text-gray-400">{copied ? '✓' : '⎘'}</span>
          </button>

          {/* Online users */}
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse-dot" />
            <span className="text-xs font-medium text-brand-green">{users.length} online</span>
          </div>

          {/* Connection status */}
          {!connected && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-xs font-medium text-red-500">Offline</span>
            </div>
          )}
        </div>
      </header>

      {/* Canvas — full remaining space */}
      <div className="flex-1 relative overflow-hidden">
        {!connected && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">Connecting...</p>
              <p className="text-xs text-gray-400 mt-1">Establishing WebSocket connection</p>
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

      {/* User bar — bottom */}
      <div className="shrink-0 h-8 border-t border-gray-100 flex items-center justify-between px-4 bg-gray-50">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Tool: <span className="text-gray-600 font-medium">{tool}</span>
          </span>
          <span className="text-xs text-gray-400">
            Size: <span className="text-gray-600 font-medium">{width}px</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {users.slice(0, 5).map((u, i) => (
            <div key={i}
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{
                background: u === username
                  ? 'linear-gradient(135deg, #7C3AED, #EC4899)'
                  : `hsl(${u.charCodeAt(0) * 47 % 360}, 70%, 55%)`,
              }}
              title={u === username ? `${u} (you)` : u}>
              {u[0].toUpperCase()}
            </div>
          ))}
          {users.length > 5 && (
            <span className="text-xs text-gray-400">+{users.length - 5}</span>
          )}
        </div>
      </div>

      {/* Floating chat */}
      <Chat
        messages={messages}
        onSend={handleChat}
        username={username}
        open={chatOpen}
        onClose={() => setChatOpen(!chatOpen)}
      />
    </div>
  )
}