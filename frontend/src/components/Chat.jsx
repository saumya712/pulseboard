import { useState, useRef, useEffect } from 'react'

export default function Chat({ messages, onSend, username }) {
  const [text, setText]   = useState('')
  const bottomRef         = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text.trim())
    setText('')
  }

  const formatTime = (iso) => {
    try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    catch { return '' }
  }

  return (
    <div className="flex flex-col h-full bg-vault-card border border-vault-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-vault-border flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse-slow" />
        <span className="font-mono text-xs text-neon-cyan uppercase tracking-widest">Chat</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="font-mono text-xs text-gray-600 text-center mt-4">
            No messages yet. Say hi!
          </p>
        )}
        {messages.map((msg, i) => (
          msg.system ? (
            <div key={i} className="text-center">
              <span className="font-mono text-xs text-gray-600 italic">{msg.text}</span>
            </div>
          ) : (
            <div key={i} className={`flex flex-col ${msg.user === username ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] px-3 py-2 rounded-lg ${
                msg.user === username
                  ? 'bg-neon-green/10 border border-neon-green/20'
                  : 'bg-vault-surface border border-vault-border'
              }`}>
                {msg.user !== username && (
                  <p className="font-mono text-xs text-neon-cyan mb-1">{msg.user}</p>
                )}
                <p className="font-mono text-xs text-gray-200 break-words">{msg.text}</p>
              </div>
              {msg.timestamp && (
                <span className="font-mono text-xs text-gray-600 mt-0.5 px-1">
                  {formatTime(msg.timestamp)}
                </span>
              )}
            </div>
          )
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-vault-border flex gap-2">
        <input
          className="vault-input py-2 text-xs flex-1"
          placeholder="Type a message..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button type="submit" className="btn-primary px-3 py-2 text-xs">
          SEND
        </button>
      </form>
    </div>
  )
}