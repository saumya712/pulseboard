const COLORS = ['#00ff88','#00d4ff','#ff3366','#ffaa00','#9945ff','#ffffff','#ff6b35','#00ffff']
const WIDTHS  = [2, 4, 8, 14]

function PenIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> }
function RectIcon()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> }
function CircleIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg> }
function EraseIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20H7L3 16l13-13 7 7-3 3"/><path d="m6 17 3-3"/></svg> }
function TrashIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg> }

export default function Toolbar({ tool, setTool, color, setColor, width, setWidth, onClear }) {
  const tools = [
    { id: 'pen',    icon: <PenIcon />    },
    { id: 'rect',   icon: <RectIcon />   },
    { id: 'circle', icon: <CircleIcon /> },
    { id: 'eraser', icon: <EraseIcon />  },
  ]

  return (
    <div className="flex flex-col gap-3 p-3 bg-vault-card border border-vault-border rounded-xl">
      {/* Tools */}
      <div className="flex flex-col gap-1">
        {tools.map(t => (
          <button key={t.id} onClick={() => setTool(t.id)}
            className={`btn-icon ${tool === t.id ? 'active' : ''}`}
            title={t.id}>
            {t.icon}
          </button>
        ))}
      </div>

      <div className="w-full h-px bg-vault-border" />

      {/* Colors */}
      <div className="flex flex-col gap-1">
        {COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)}
            className={`w-7 h-7 rounded-full border-2 transition-all duration-150 mx-auto ${
              color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'
            }`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>

      <div className="w-full h-px bg-vault-border" />

      {/* Widths */}
      <div className="flex flex-col gap-2 items-center">
        {WIDTHS.map(w => (
          <button key={w} onClick={() => setWidth(w)}
            className={`rounded-full transition-all duration-150 ${
              width === w ? 'bg-neon-green' : 'bg-vault-muted hover:bg-vault-border'
            }`}
            style={{ width: Math.max(w, 6), height: Math.max(w, 6) }}
            title={`${w}px`}
          />
        ))}
      </div>

      <div className="w-full h-px bg-vault-border" />

      {/* Clear */}
      <button onClick={onClear} className="btn-icon text-neon-red hover:border-neon-red/40" title="Clear canvas">
        <TrashIcon />
      </button>
    </div>
  )
}