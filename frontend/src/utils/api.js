const BASE = '/api'

export async function createRoom(name) {
  const res = await fetch(`${BASE}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Failed to create room')
  return res.json()
}

export async function getRoom(code) {
  const res = await fetch(`${BASE}/rooms/${code}`)
  if (res.status === 404) throw new Error('Room not found')
  if (!res.ok) throw new Error('Failed to get room')
  return res.json()
}