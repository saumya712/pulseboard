const COLORS = [
  '#111827','#EF4444','#F59E0B','#10B981',
  '#3B82F6','#7C3AED','#EC4899','#ffffff',
]
const WIDTHS = [2, 4, 8, 16]

function PenIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> }
function RectIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> }
function CircleIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg> }
function EraseIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20H7L3 16l13-13 7 7-3 3"/><path d="m6 17 3-3"/></svg> }
function TrashIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg> }

export default function Toolbar({ tool, setTool, color, setColor, width, setWidth, onClear }) {
  const tools = [
    { id: 'pen',    icon: <PenIcon />,    label: 'Pen'    },
    { id: 'rect',   icon: <RectIcon />,   label: 'Rect'   },
    { id: 'circle', icon: <CircleIcon />, label: 'Circle' },
    { id: 'eraser', icon: <EraseIcon />,  label: 'Eraser' },
  ]

  return (
    <div className="flex items-center gap-1 h-full">
      {/* Tools */}
      <div className="flex items-center gap-1 pr-3 border-r border-gray-200">
        {tools.map(t => (
          <button key={t.id} onClick={() => setTool(t.id)}
            title={t.label}
            className={`tool-btn ${tool === t.id ? 'active' : ''}`}>
            {t.icon}
          </button>
        ))}
      </div>

      {/* Colors */}
      <div className="flex items-center gap-1.5 px-3 border-r border-gray-200">
        {COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)}
            className="w-6 h-6 rounded-full border-2 transition-all duration-150 hover:scale-110"
            style={{
              backgroundColor: c,
              borderColor: color === c ? '#7C3AED' : c === '#ffffff' ? '#e5e7eb' : c,
              transform: color === c ? 'scale(1.2)' : undefined,
              boxShadow: color === c ? '0 0 0 2px white, 0 0 0 3px #7C3AED' : undefined,
            }}
          />
        ))}
      </div>

      {/* Widths */}
      <div className="flex items-center gap-2 px-3 border-r border-gray-200">
        {WIDTHS.map(w => (
          <button key={w} onClick={() => setWidth(w)}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-all"
            style={{ outline: width === w ? '2px solid #7C3AED' : 'none', outlineOffset: '1px' }}
            title={`${w}px`}>
            <div className="rounded-full bg-gray-800"
              style={{ width: Math.min(w + 2, 16), height: Math.min(w + 2, 16) }} />
          </button>
        ))}
      </div>

      {/* Clear */}
      <button onClick={onClear}
        className="tool-btn text-red-400 hover:bg-red-50 hover:text-red-600 ml-1"
        title="Clear canvas">
        <TrashIcon />
      </button>
    </div>
  )
}