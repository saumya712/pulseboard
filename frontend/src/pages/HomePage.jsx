import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRoom, getRoom } from '../utils/api'

export default function HomePage() {
  const navigate = useNavigate()

  const [roomName,  setRoomName]  = useState('')
  const [username,  setUsername]  = useState('')
  const [creating,  setCreating]  = useState(false)
  const [createErr, setCreateErr] = useState('')

  const [joinCode,  setJoinCode]  = useState('')
  const [joinUser,  setJoinUser]  = useState('')
  const [joining,   setJoining]   = useState(false)
  const [joinErr,   setJoinErr]   = useState('')

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setCreateErr('')
    try {
      const room = await createRoom(roomName.trim())
      navigate(`/board/${room.code}?username=${encodeURIComponent(username.trim())}`)
    } catch {
      setCreateErr('Failed to create room. Is the server running?')
      setCreating(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    setJoining(true)
    setJoinErr('')
    try {
      await getRoom(joinCode.trim().toUpperCase())
      navigate(`/board/${joinCode.trim().toUpperCase()}?username=${encodeURIComponent(joinUser.trim())}`)
    } catch {
      setJoinErr('Room not found. Check the code.')
      setJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-pink-50 flex flex-col">

      {/* Nav */}
      <header className="px-8 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <span className="font-bold text-lg text-gray-900">PulseBoard</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse-dot" />
          Real-time sync
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="text-center mb-12 animate-fade-in">
          {/* Colorful badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-purple-100 rounded-full px-4 py-1.5 text-xs font-medium text-brand-purple mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-pulse-dot" />
            WebSocket powered · Zero lag
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-4">
            Draw together,<br />
            <span className="bg-gradient-to-r from-brand-purple via-brand-pink to-brand-orange bg-clip-text text-transparent">
              anywhere.
            </span>
          </h1>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            Create a board, share the code. Every stroke syncs instantly across all connected users.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl animate-slide-up">

          {/* Create */}
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-purple-100/50 border border-purple-50">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-violet-400 flex items-center justify-center shadow-lg shadow-purple-200">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">New Board</h2>
                <p className="text-xs text-gray-400">Start a fresh session</p>
              </div>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <input className="input-field" placeholder="Board name..." value={roomName} onChange={e => setRoomName(e.target.value)} required />
              <input className="input-field" placeholder="Your name..." value={username} onChange={e => setUsername(e.target.value)} required />
              {createErr && <p className="text-xs text-red-500">{createErr}</p>}
              <button type="submit" disabled={creating} className="btn-primary w-full">
                {creating ? 'Creating...' : 'Create Board →'}
              </button>
            </form>
          </div>

          {/* Join */}
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-pink-100/50 border border-pink-50">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-pink to-rose-400 flex items-center justify-center shadow-lg shadow-pink-200">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Join Board</h2>
                <p className="text-xs text-gray-400">Enter a room code</p>
              </div>
            </div>
            <form onSubmit={handleJoin} className="space-y-3">
              <input className="input-field font-mono tracking-widest uppercase" placeholder="ROOM CODE..." value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={8} required />
              <input className="input-field" placeholder="Your name..." value={joinUser} onChange={e => setJoinUser(e.target.value)} required />
              {joinErr && <p className="text-xs text-red-500">{joinErr}</p>}
              <button type="submit" disabled={joining} className="btn-secondary w-full">
                {joining ? 'Joining...' : 'Join Board →'}
              </button>
            </form>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 justify-center mt-10 animate-fade-in">
          {[
            { label: 'Pen & shapes',    color: 'bg-purple-50 text-brand-purple border-purple-100' },
            { label: 'Live chat',       color: 'bg-pink-50 text-brand-pink border-pink-100'       },
            { label: 'Persistent rooms',color: 'bg-blue-50 text-brand-blue border-blue-100'       },
            { label: 'Instant sync',    color: 'bg-green-50 text-brand-green border-green-100'    },
          ].map(({ label, color }) => (
            <span key={label} className={`text-xs font-medium px-3 py-1.5 rounded-full border ${color}`}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}