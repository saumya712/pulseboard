import { useState, useRef, useEffect } from 'react'

export default function Chat({ messages, onSend, username, open, onClose }) {
  const [text, setText]   = useState('')
  const bottomRef         = useRef(null)
  const unread            = messages.filter(m => !m.system).length

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

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
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-5 w-72 h-96 bg-white rounded-2xl shadow-2xl shadow-gray-200/80 border border-gray-100 flex flex-col overflow-hidden animate-bounce-in z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-brand-purple to-brand-pink">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse-dot" />
              <span className="text-sm font-semibold text-white">Chat</span>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-lg leading-none">×</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">👋</p>
                <p className="text-xs text-gray-400">Say something!</p>
              </div>
            )}
            {messages.map((msg, i) => (
              msg.system ? (
                <div key={i} className="text-center">
                  <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-0.5">{msg.text}</span>
                </div>
              ) : (
                <div key={i} className={`flex flex-col ${msg.user === username ? 'items-end' : 'items-start'}`}>
                  {msg.user !== username && (
                    <span className="text-xs text-brand-purple font-medium mb-0.5 px-1">{msg.user}</span>
                  )}
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs ${
                    msg.user === username
                      ? 'bg-gradient-to-br from-brand-purple to-violet-500 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.timestamp && (
                    <span className="text-xs text-gray-300 mt-0.5 px-1">{formatTime(msg.timestamp)}</span>
                  )}
                </div>
              )
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-gray-100 flex gap-2 bg-white">
            <input
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-purple-100"
              placeholder="Message..."
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <button type="submit"
              className="bg-brand-purple text-white px-3 py-2 rounded-xl text-xs font-semibold hover:bg-purple-700 transition-colors">
              →
            </button>
          </form>
        </div>
      )}

      {/* Floating chat bubble button */}
      <button
        onClick={onClose}
        className="fixed bottom-5 right-5 w-12 h-12 bg-gradient-to-br from-brand-purple to-brand-pink rounded-full shadow-lg shadow-purple-200 flex items-center justify-center text-white hover:scale-110 transition-transform z-50"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </>
  )
}