import { useEffect, useRef, useState, useCallback } from 'react'

export default function useWebSocket(roomCode, username) {
  const ws              = useRef(null)
  const [connected, setConnected]   = useState(false)
  const [users,     setUsers]       = useState([])
  const [messages,  setMessages]    = useState([])
  const onDrawRef   = useRef(null)  // callback set by Canvas component

  const send = useCallback((type, payload) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload }))
    }
  }, [])

  useEffect(() => {
    if (!roomCode || !username) return

    // ✅ correct — uses relative URL so Vite proxy handles it
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${window.location.host}/ws?room=${roomCode}&username=${encodeURIComponent(username)}`
    const socket = new WebSocket(url)
    ws.current = socket

    socket.onopen = () => {
      console.log('[WS] Connected')
      setConnected(true)
    }

    socket.onclose = () => {
      console.log('[WS] Disconnected')
      setConnected(false)
    }

    socket.onerror = (err) => {
      console.error('[WS] Error', err)
    }

    socket.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)

        switch (msg.type) {
          case 'sync':
            // Replay all past draw events on canvas
            if (onDrawRef.current && msg.payload?.events) {
              msg.payload.events.forEach(ev => {
                if (ev.type === 'draw') {
                  onDrawRef.current(JSON.parse(ev.payload || ev.Payload || '{}'))
                }
              })
            }
            setUsers(msg.payload?.users || [])
            break

          case 'draw':
            // Someone else drew — render on canvas
            if (onDrawRef.current) {
              onDrawRef.current(msg.payload)
            }
            break

          case 'chat':
            setMessages(prev => [...prev, {
              user:      msg.sender || msg.payload?.user,
              text:      msg.payload?.text,
              timestamp: msg.payload?.timestamp || new Date().toISOString(),
            }])
            break

          case 'clear':
            // Canvas will be cleared by BoardPage
            if (onDrawRef.current) onDrawRef.current({ type: 'clear' })
            break

          case 'user_joined':
            setUsers(prev => {
              const u = msg.payload?.user
              return prev.includes(u) ? prev : [...prev, u]
            })
            setMessages(prev => [...prev, {
              system: true,
              text: `${msg.payload?.user} joined`,
            }])
            break

          case 'user_left':
            setUsers(prev => prev.filter(u => u !== msg.payload?.user))
            setMessages(prev => [...prev, {
              system: true,
              text: `${msg.payload?.user} left`,
            }])
            break
        }
      } catch (err) {
        console.error('[WS] parse error', err)
      }
    }

    return () => socket.close()
  }, [roomCode, username])

  return { connected, users, messages, send, onDrawRef }
}