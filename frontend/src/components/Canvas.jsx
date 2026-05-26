import { useRef, useEffect, useCallback } from 'react'

export default function Canvas({ tool, color, width, onDrawEvent, onDrawRef }) {
  const canvasRef   = useRef(null)
  const drawing     = useRef(false)
  const lastPos     = useRef(null)
  const startPos    = useRef(null)
  const snapshotRef = useRef(null) // for shapes — stores canvas state before drawing shape

  // Register the external draw handler
  // BoardPage uses this to replay incoming WebSocket draw events
  useEffect(() => {
    onDrawRef.current = (payload) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')

      if (payload.type === 'clear') {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        return
      }

      drawShape(ctx, payload)
    }
  }, [])

  const drawShape = (ctx, payload) => {
    ctx.strokeStyle = payload.tool === 'eraser' ? '#ffffff' : payload.color
    ctx.lineWidth   = payload.width
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'

    switch (payload.tool) {
      case 'pen':
      case 'eraser':
        ctx.beginPath()
        ctx.moveTo(payload.x1, payload.y1)
        ctx.lineTo(payload.x2, payload.y2)
        ctx.stroke()
        break

      case 'rect':
        ctx.strokeRect(
          payload.x1, payload.y1,
          payload.x2 - payload.x1,
          payload.y2 - payload.y1
        )
        break

      case 'circle': {
        const rx = (payload.x2 - payload.x1) / 2
        const ry = (payload.y2 - payload.y1) / 2
        ctx.beginPath()
        ctx.ellipse(
          payload.x1 + rx, payload.y1 + ry,
          Math.abs(rx), Math.abs(ry),
          0, 0, Math.PI * 2
        )
        ctx.stroke()
        break
      }
    }
  }

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height

    // Handle both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top)  * scaleY,
    }
  }

  const onPointerDown = useCallback((e) => {
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const pos    = getPos(e)

    drawing.current  = true
    lastPos.current  = pos
    startPos.current = pos

    // Save canvas snapshot for shape preview
    if (tool === 'rect' || tool === 'circle') {
      snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height)
    }
  }, [tool])

  const onPointerMove = useCallback((e) => {
    e.preventDefault()
    if (!drawing.current) return

    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const pos    = getPos(e)

    if (tool === 'pen' || tool === 'eraser') {
      // Draw segment immediately and emit
      const payload = {
        tool,
        x1: lastPos.current.x, y1: lastPos.current.y,
        x2: pos.x,             y2: pos.y,
        color, width,
      }
      drawShape(ctx, payload)
      onDrawEvent(payload) // send to WebSocket
      lastPos.current = pos

    } else {
      // Shape preview — restore snapshot then draw preview
      ctx.putImageData(snapshotRef.current, 0, 0)
      const payload = {
        tool,
        x1: startPos.current.x, y1: startPos.current.y,
        x2: pos.x,              y2: pos.y,
        color, width,
      }
      drawShape(ctx, payload)
      // Don't emit during move for shapes — only on mouseup
    }
  }, [tool, color, width, onDrawEvent])

  const onPointerUp = useCallback((e) => {
    if (!drawing.current) return
    drawing.current = false

    const pos = getPos(e)

    // For shapes — emit the final event on mouseup
    if (tool === 'rect' || tool === 'circle') {
      const payload = {
        tool,
        x1: startPos.current.x, y1: startPos.current.y,
        x2: pos.x,              y2: pos.y,
        color, width,
      }
      onDrawEvent(payload)
    }
  }, [tool, color, width, onDrawEvent])

  // Handle canvas resize
  useEffect(() => {
    const canvas  = canvasRef.current
    const parent  = canvas.parentElement
    const resizer = new ResizeObserver(() => {
      // Save current drawing
      const ctx      = canvas.getContext('2d')
      const imgData  = ctx.getImageData(0, 0, canvas.width, canvas.height)

      canvas.width   = parent.clientWidth
      canvas.height  = parent.clientHeight

      // Restore drawing after resize
      ctx.putImageData(imgData, 0, 0)
    })
    resizer.observe(parent)
    return () => resizer.disconnect()
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full touch-none"
      style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair', background: '#ffffff' }}
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onMouseLeave={onPointerUp}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
    />
  )
}