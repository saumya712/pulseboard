import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRoom, getRoom } from '../utils/api'

function PulseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  )
}

export default function HomePage() {
  const navigate  = useNavigate()

  // Create room state
  const [roomName,  setRoomName]  = useState('')
  const [username,  setUsername]  = useState('')
  const [creating,  setCreating]  = useState(false)
  const [createErr, setCreateErr] = useState('')

  // Join room state
  const [joinCode,  setJoinCode]  = useState('')
  const [joinUser,  setJoinUser]  = useState('')
  const [joining,   setJoining]   = useState(false)
  const [joinErr,   setJoinErr]   = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!roomName.trim() || !username.trim()) return
    setCreating(true)
    setCreateErr('')
    try {
      const room = await createRoom(roomName.trim())
      navigate(`/board/${room.code}?username=${encodeURIComponent(username.trim())}`)
    } catch (err) {
      setCreateErr(err.message)
      setCreating(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!joinCode.trim() || !joinUser.trim()) return
    setJoining(true)
    setJoinErr('')
    try {
      await getRoom(joinCode.trim().toUpperCase())
      navigate(`/board/${joinCode.trim().toUpperCase()}?username=${encodeURIComponent(joinUser.trim())}`)
    } catch (err) {
      setJoinErr('Room not found. Check the code and try again.')
      setJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-vault-bg bg-grid flex flex-col">
      {/* Ambient glows */}
      <div className="fixed top-0 left-1/3 w-96 h-96 bg-neon-green/4 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/3 right-1/4 w-64 h-64 bg-neon-purple/4 rounded-full blur-3xl pointer-events-none" />

      {/* Nav */}
      <header className="relative z-10 border-b border-vault-border/60 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="text-neon-green"><PulseIcon /></div>
          <span className="font-mono font-bold text-lg">
            <span className="text-neon-green">PULSE</span>
            <span className="text-gray-300">BOARD</span>
          </span>
          <span className="font-mono text-xs text-gray-600 border border-vault-border rounded px-1.5 py-0.5">v1.0</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse-slow" />
          <span className="font-mono text-xs text-neon-green/70">LIVE</span>
        </div>
      </header>

      {/* Hero */}
      <div className="relative z-10 max-w-5xl mx-auto w-full px-6 pt-16 pb-10 text-center">
        <div className="flex items-center gap-2 font-mono text-xs text-gray-600 mb-5 uppercase tracking-widest justify-center">
          <span className="w-8 h-px bg-vault-border" />
          Real-Time Collaborative Whiteboard
          <span className="w-8 h-px bg-vault-border" />
        </div>
        <h1 className="font-mono text-4xl sm:text-5xl font-bold leading-tight mb-4">
          <span className="text-white">Draw together.</span><br />
          <span className="text-neon-green">
            In real time.
            <span className="inline-block w-2 h-9 bg-neon-green animate-blink ml-2 align-middle" />
          </span>
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed max-w-lg mx-auto">
          Create a board, share the code, and collaborate instantly.
          Every stroke synced in milliseconds via WebSockets.
        </p>
      </div>

      {/* Cards */}
      <div className="relative z-10 max-w-3xl mx-auto w-full px-6 pb-16 grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Create Room */}
        <div className="card p-6 animate-slide-up" style={{ boxShadow: '0 0 30px rgba(0,255,136,0.05)' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-neon-green/10 border border-neon-green/20 flex items-center justify-center text-neon-green">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div>
              <h2 className="font-mono font-bold text-sm text-white">Create Board</h2>
              <p className="font-mono text-xs text-gray-500">Start a new session</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-3">
            <input
              className="vault-input"
              placeholder="Board name..."
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              required
            />
            <input
              className="vault-input"
              placeholder="Your name..."
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
            {createErr && (
              <p className="font-mono text-xs text-neon-red">{createErr}</p>
            )}
            <button type="submit" disabled={creating} className="btn-primary w-full">
              {creating ? 'CREATING...' : <><span>CREATE BOARD</span><ArrowIcon /></>}
            </button>
          </form>
        </div>

        {/* Join Room */}
        <div className="card p-6 animate-slide-up" style={{ animationDelay: '0.1s', boxShadow: '0 0 30px rgba(0,212,255,0.05)' }}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </div>
            <div>
              <h2 className="font-mono font-bold text-sm text-white">Join Board</h2>
              <p className="font-mono text-xs text-gray-500">Enter a room code</p>
            </div>
          </div>

          <form onSubmit={handleJoin} className="space-y-3">
            <input
              className="vault-input uppercase tracking-widest"
              placeholder="ROOM CODE..."
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={8}
              required
            />
            <input
              className="vault-input"
              placeholder="Your name..."
              value={joinUser}
              onChange={e => setJoinUser(e.target.value)}
              required
            />
            {joinErr && (
              <p className="font-mono text-xs text-neon-red">{joinErr}</p>
            )}
            <button type="submit" disabled={joining} className="btn-secondary w-full">
              {joining ? 'JOINING...' : <><span>JOIN BOARD</span><ArrowIcon /></>}
            </button>
          </form>
        </div>
      </div>

      {/* Features strip */}
      <div className="relative z-10 border-t border-vault-border/40 py-6">
        <div className="max-w-3xl mx-auto px-6 grid grid-cols-3 gap-4">
          {[
            { label: 'WebSocket Sync',   desc: 'Every stroke in real time',  color: 'text-neon-green' },
            { label: 'Persistent Rooms', desc: 'Canvas saved to database',   color: 'text-neon-cyan'  },
            { label: 'Built-in Chat',    desc: 'Talk while you draw',         color: 'text-neon-purple'},
          ].map(({ label, desc, color }) => (
            <div key={label} className="text-center">
              <div className={`font-mono text-xs font-bold mb-1 ${color}`}>{label}</div>
              <div className="font-mono text-xs text-gray-600">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}