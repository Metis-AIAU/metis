import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MousePointer2, Link2, Trash2, RotateCcw, ImagePlus, X, Info } from 'lucide-react';

// ─── Element type definitions ─────────────────────────────────────────────────
const ELEMENT_DEFS = {
  actor:          { label: 'Actor',           color: '#3b82f6', bg: '#dbeafe', w: 80,  h: 90,  desc: 'External user or actor' },
  process:        { label: 'Process',         color: '#8b5cf6', bg: '#ede9fe', w: 140, h: 70,  desc: 'Internal process or service' },
  data_store:     { label: 'Data Store',      color: '#f59e0b', bg: '#fef3c7', w: 160, h: 60,  desc: 'Database or file store' },
  external:       { label: 'External System', color: '#6b7280', bg: '#f3f4f6', w: 140, h: 60,  desc: 'External service or entity' },
  trust_boundary: { label: 'Trust Boundary',  color: '#ef4444', bg: 'rgba(254,242,242,0.4)', w: 300, h: 220, desc: 'Security trust zone' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getEdgePoint(el, targetX, targetY) {
  const cx = el.x + el.w / 2, cy = el.y + el.h / 2;
  const dx = targetX - cx, dy = targetY - cy;
  if (!dx && !dy) return { x: cx, y: cy };
  const hw = el.w / 2, hh = el.h / 2;
  if (Math.abs(dy) * hw <= Math.abs(dx) * hh) {
    const sign = dx > 0 ? 1 : -1;
    return { x: cx + sign * hw, y: cy + (dy * hw) / Math.abs(dx) };
  }
  const sign = dy > 0 ? 1 : -1;
  return { x: cx + (dx * hh) / Math.abs(dy), y: cy + sign * hh };
}

function connectionPath(from, to) {
  const fp = getEdgePoint(from, to.x + to.w / 2, to.y + to.h / 2);
  const tp = getEdgePoint(to, from.x + from.w / 2, from.y + from.h / 2);
  const mx = (fp.x + tp.x) / 2;
  const dist = Math.hypot(tp.x - fp.x, tp.y - fp.y);
  const my = (fp.y + tp.y) / 2 - Math.min(dist * 0.15, 40);
  return { d: `M ${fp.x} ${fp.y} Q ${mx} ${my} ${tp.x} ${tp.y}`, mid: { x: mx, y: my } };
}

// ─── Shape renderer ───────────────────────────────────────────────────────────
function Shape({ el, isSelected, isConnecting, tool, onMouseDown, onDblClick, onConnectClick, editingId, editLabel, onEditChange, onEditCommit }) {
  const def = ELEMENT_DEFS[el.type];
  const sw = isSelected ? 2.5 : 1.5;
  const selBox = isSelected ? (
    <rect x={el.x - 5} y={el.y - 5} width={el.w + 10} height={el.h + 10}
      rx={6} fill="none" stroke="#2563eb" strokeWidth={2} strokeDasharray="5,3" />
  ) : null;

  const cursor = tool === 'connect' ? 'crosshair' : 'move';
  const handleDown = (e) => { e.stopPropagation(); onMouseDown(e, el.id); };
  const handleDbl  = (e) => { e.stopPropagation(); onDblClick(e, el.id); };
  const handleClick = (e) => { e.stopPropagation(); if (tool === 'connect') onConnectClick(el.id); };

  const labelEl = editingId === el.id ? (
    <foreignObject x={el.x} y={el.y + el.h / 2 - 14} width={el.w} height={28}>
      <input
        style={{ width: '100%', textAlign: 'center', border: '1px solid #3b82f6', borderRadius: 4, padding: '2px 6px', fontSize: 12, outline: 'none' }}
        value={editLabel}
        onChange={onEditChange}
        onBlur={onEditCommit}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') e.target.blur(); }}
        autoFocus
      />
    </foreignObject>
  ) : null;

  switch (el.type) {
    case 'actor':
      return (
        <g onMouseDown={handleDown} onDoubleClick={handleDbl} onClick={handleClick} style={{ cursor }}>
          {selBox}
          {isConnecting && <rect x={el.x-6} y={el.y-6} width={el.w+12} height={el.h+12} rx={8} fill="#dbeafe" opacity={0.5} />}
          <circle cx={el.x + el.w/2} cy={el.y + 18} r={14} fill={def.bg} stroke={def.color} strokeWidth={sw} />
          <line x1={el.x+el.w/2} y1={el.y+32} x2={el.x+el.w/2} y2={el.y+60} stroke={def.color} strokeWidth={sw} />
          <line x1={el.x+el.w/2-18} y1={el.y+46} x2={el.x+el.w/2+18} y2={el.y+46} stroke={def.color} strokeWidth={sw} />
          <line x1={el.x+el.w/2} y1={el.y+60} x2={el.x+el.w/2-13} y2={el.y+82} stroke={def.color} strokeWidth={sw} />
          <line x1={el.x+el.w/2} y1={el.y+60} x2={el.x+el.w/2+13} y2={el.y+82} stroke={def.color} strokeWidth={sw} />
          {editingId !== el.id && (
            <text x={el.x+el.w/2} y={el.y+el.h-2} textAnchor="middle" fontSize={11} fill="#1f2937" fontWeight="600">{el.label}</text>
          )}
          {labelEl}
        </g>
      );

    case 'process':
      return (
        <g onMouseDown={handleDown} onDoubleClick={handleDbl} onClick={handleClick} style={{ cursor }}>
          {selBox}
          {isConnecting && <rect x={el.x-6} y={el.y-6} width={el.w+12} height={el.h+12} rx={14} fill="#ede9fe" opacity={0.5} />}
          <rect x={el.x} y={el.y} width={el.w} height={el.h} rx={8} fill={def.bg} stroke={def.color} strokeWidth={sw} />
          {editingId !== el.id && (
            <text x={el.x+el.w/2} y={el.y+el.h/2+4} textAnchor="middle" fontSize={12} fill="#1f2937" fontWeight="600">{el.label}</text>
          )}
          {labelEl}
        </g>
      );

    case 'data_store': {
      const t = 10;
      return (
        <g onMouseDown={handleDown} onDoubleClick={handleDbl} onClick={handleClick} style={{ cursor }}>
          {selBox}
          {isConnecting && <rect x={el.x-6} y={el.y-6} width={el.w+12} height={el.h+12} rx={4} fill="#fef3c7" opacity={0.5} />}
          <rect x={el.x} y={el.y+t} width={el.w} height={el.h-t*2} fill={def.bg} />
          <line x1={el.x} y1={el.y+t} x2={el.x+el.w} y2={el.y+t} stroke={def.color} strokeWidth={sw} />
          <line x1={el.x} y1={el.y+el.h-t} x2={el.x+el.w} y2={el.y+el.h-t} stroke={def.color} strokeWidth={sw} />
          <line x1={el.x} y1={el.y+t} x2={el.x} y2={el.y+el.h-t} stroke={def.color} strokeWidth={sw} />
          <line x1={el.x+el.w} y1={el.y+t} x2={el.x+el.w} y2={el.y+el.h-t} stroke={def.color} strokeWidth={sw} />
          {editingId !== el.id && (
            <text x={el.x+el.w/2} y={el.y+el.h/2+4} textAnchor="middle" fontSize={12} fill="#1f2937" fontWeight="600">{el.label}</text>
          )}
          {labelEl}
        </g>
      );
    }

    case 'external':
      return (
        <g onMouseDown={handleDown} onDoubleClick={handleDbl} onClick={handleClick} style={{ cursor }}>
          {selBox}
          {isConnecting && <rect x={el.x-6} y={el.y-6} width={el.w+12} height={el.h+12} fill="#f3f4f6" opacity={0.5} />}
          <rect x={el.x} y={el.y} width={el.w} height={el.h} fill={def.bg} stroke={def.color} strokeWidth={sw} />
          <rect x={el.x+5} y={el.y+5} width={el.w-10} height={el.h-10} fill="none" stroke={def.color} strokeWidth={1} opacity={0.6} />
          {editingId !== el.id && (
            <text x={el.x+el.w/2} y={el.y+el.h/2+4} textAnchor="middle" fontSize={12} fill="#1f2937" fontWeight="600">{el.label}</text>
          )}
          {labelEl}
        </g>
      );

    case 'trust_boundary':
      return (
        <g onMouseDown={handleDown} onDoubleClick={handleDbl} onClick={handleClick} style={{ cursor, opacity: 0.85 }}>
          <rect x={el.x} y={el.y} width={el.w} height={el.h} rx={8}
            fill={def.bg} stroke={def.color} strokeWidth={isSelected ? 2.5 : 2} strokeDasharray="10,5" />
          {editingId !== el.id
            ? <text x={el.x+10} y={el.y+18} fontSize={11} fill={def.color} fontWeight="700">{el.label}</text>
            : <foreignObject x={el.x+4} y={el.y+4} width={el.w-8} height={22}>
                <input
                  style={{ width: '100%', fontSize: 11, fontWeight: 700, color: def.color, border: 'none', background: 'transparent', outline: 'none' }}
                  value={editLabel}
                  onChange={onEditChange}
                  onBlur={onEditCommit}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') e.target.blur(); }}
                  autoFocus
                />
              </foreignObject>
          }
        </g>
      );

    default: return null;
  }
}

// ─── Main canvas component ────────────────────────────────────────────────────
export default function ThreatModelCanvas({ value, onChange }) {
  const { elements = [], connections = [] } = value || {};
  const svgRef = useRef(null);

  const [tool, setTool]         = useState('select');   // 'select' | 'connect'
  const [dragging, setDragging] = useState(null);       // { id, ox, oy }
  const [connecting, setConnecting] = useState(null);   // fromId
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState(null);       // elementId or connectionId
  const [editing, setEditing]   = useState(null);       // { id, label }
  const [mode, setMode]         = useState('canvas');   // 'canvas' | 'image'
  const [uploadedImage, setUploadedImage] = useState(value?.uploadedImage || null);
  const fileRef = useRef(null);

  const emit = useCallback((els, conns, img) => {
    onChange?.({ elements: els, connections: conns, uploadedImage: img ?? uploadedImage });
  }, [onChange, uploadedImage]);

  // ── SVG coordinate helper ──────────────────────────────────────────────────
  const svgCoords = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  // ── Palette drag ──────────────────────────────────────────────────────────
  const onPaletteDragStart = (e, type) => e.dataTransfer.setData('elementType', type);
  const onCanvasDragOver   = (e) => e.preventDefault();
  const onCanvasDrop = (e) => {
    const type = e.dataTransfer.getData('elementType');
    if (!type || !ELEMENT_DEFS[type]) return;
    const def = ELEMENT_DEFS[type];
    const { x, y } = svgCoords(e);
    const newEl = { id: uuidv4(), type, x: x - def.w/2, y: y - def.h/2, w: def.w, h: def.h, label: def.label };
    const newEls = [...elements, newEl];
    emit(newEls, connections);
    setSelected(newEl.id);
  };

  // ── Element mouse events ──────────────────────────────────────────────────
  const onElementMouseDown = (e, id) => {
    if (tool !== 'select') return;
    setSelected(id);
    const el = elements.find(el => el.id === id);
    if (!el) return;
    const { x, y } = svgCoords(e);
    setDragging({ id, ox: x - el.x, oy: y - el.y });
  };

  const onSVGMouseMove = (e) => {
    const pos = svgCoords(e);
    setMousePos(pos);
    if (!dragging) return;
    const { x, y } = pos;
    const newEls = elements.map(el =>
      el.id === dragging.id ? { ...el, x: x - dragging.ox, y: y - dragging.oy } : el
    );
    emit(newEls, connections);
  };

  const onSVGMouseUp = () => setDragging(null);

  const onSVGClick = (e) => {
    if (tool === 'select') setSelected(null);
    if (tool === 'connect') setConnecting(null);
  };

  // ── Connect mode ──────────────────────────────────────────────────────────
  const onConnectClick = (id) => {
    if (!connecting) {
      setConnecting(id);
    } else if (connecting !== id) {
      const exists = connections.some(c =>
        (c.fromId === connecting && c.toId === id) ||
        (c.fromId === id && c.toId === connecting)
      );
      if (!exists) {
        const newConns = [...connections, { id: uuidv4(), fromId: connecting, toId: id, label: '' }];
        emit(elements, newConns);
      }
      setConnecting(null);
    }
  };

  // ── Label editing ──────────────────────────────────────────────────────────
  const onDblClick = (e, id) => {
    const el = elements.find(el => el.id === id);
    if (el) setEditing({ id, label: el.label });
  };

  const onEditChange = (e) => setEditing(prev => ({ ...prev, label: e.target.value }));

  const onEditCommit = () => {
    if (!editing) return;
    const newEls = elements.map(el => el.id === editing.id ? { ...el, label: editing.label } : el);
    emit(newEls, connections);
    setEditing(null);
  };

  // ── Delete selected ────────────────────────────────────────────────────────
  const deleteSelected = useCallback(() => {
    if (!selected) return;
    const newEls   = elements.filter(el => el.id !== selected);
    const newConns = connections.filter(c => c.id !== selected && c.fromId !== selected && c.toId !== selected);
    emit(newEls, newConns);
    setSelected(null);
  }, [selected, elements, connections, emit]);

  useEffect(() => {
    const onKey = (e) => { if ((e.key === 'Delete' || e.key === 'Backspace') && selected && !editing) deleteSelected(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, editing, deleteSelected]);

  // ── Image upload ──────────────────────────────────────────────────────────
  const onImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = ev.target.result;
      setUploadedImage(img);
      emit(elements, connections, img);
    };
    reader.readAsDataURL(file);
  };

  // ── Clear canvas ──────────────────────────────────────────────────────────
  const clearCanvas = () => { emit([], [], null); setUploadedImage(null); setSelected(null); setConnecting(null); };

  // ── Render sorted (trust boundaries behind) ────────────────────────────────
  const sorted = [...elements].sort((a, b) => {
    if (a.type === 'trust_boundary' && b.type !== 'trust_boundary') return -1;
    if (b.type === 'trust_boundary' && a.type !== 'trust_boundary') return 1;
    return 0;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            title="Select / Move"
            onClick={() => { setTool('select'); setConnecting(null); }}
            className={`p-1.5 rounded-md transition-colors ${tool === 'select' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          ><MousePointer2 className="w-4 h-4" /></button>
          <button
            title="Draw Connection"
            onClick={() => setTool('connect')}
            className={`p-1.5 rounded-md transition-colors ${tool === 'connect' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
          ><Link2 className="w-4 h-4" /></button>
        </div>

        <div className="h-5 w-px bg-gray-200 mx-1" />

        <button
          onClick={deleteSelected} disabled={!selected}
          title="Delete selected (Del)"
          className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 transition-colors"
        ><Trash2 className="w-4 h-4" /></button>

        <button
          onClick={clearCanvas}
          title="Clear canvas"
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        ><RotateCcw className="w-4 h-4" /></button>

        <div className="h-5 w-px bg-gray-200 mx-1" />

        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 ml-auto">
          <button
            onClick={() => setMode('canvas')}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${mode === 'canvas' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >Draw Diagram</button>
          <button
            onClick={() => setMode('image')}
            className={`flex items-center gap-1 px-3 py-1 text-xs rounded-md font-medium transition-colors ${mode === 'image' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          ><ImagePlus className="w-3 h-3" />Upload Image</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {mode === 'canvas' ? (
          <>
            {/* Palette */}
            <div className="w-40 bg-gray-50 border-r border-gray-200 flex flex-col gap-1 p-3 flex-shrink-0 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Components</p>
              {Object.entries(ELEMENT_DEFS).map(([type, def]) => (
                <div
                  key={type}
                  draggable
                  onDragStart={(e) => onPaletteDragStart(e, type)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg border border-dashed cursor-grab active:cursor-grabbing hover:bg-white hover:shadow-sm transition-all select-none"
                  style={{ borderColor: def.color + '80', background: def.bg + '60' }}
                  title={def.desc}
                >
                  <PaletteIcon type={type} color={def.color} bg={def.bg} />
                  <span className="text-xs font-medium text-center leading-tight" style={{ color: def.color }}>{def.label}</span>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-400 flex items-start gap-1">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  Drag to canvas. Double-click to rename. Del to remove.
                </p>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-hidden relative">
              {connecting && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-purple-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                  <Link2 className="w-3 h-3" />
                  Click another component to connect — or click canvas to cancel
                  <button onClick={() => setConnecting(null)} className="ml-1 hover:text-purple-200"><X className="w-3 h-3" /></button>
                </div>
              )}
              <svg
                ref={svgRef}
                className="w-full h-full"
                style={{ minHeight: 500, background: 'white', cursor: tool === 'connect' ? 'crosshair' : 'default' }}
                onDragOver={onCanvasDragOver}
                onDrop={onCanvasDrop}
                onMouseMove={onSVGMouseMove}
                onMouseUp={onSVGMouseUp}
                onClick={onSVGClick}
              >
                <defs>
                  <pattern id="canvas-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                  </pattern>
                  <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                  </marker>
                  <marker id="arrow-sel" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                  </marker>
                  <marker id="arrow-connecting" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6" />
                  </marker>
                </defs>

                {/* Grid */}
                <rect width="100%" height="100%" fill="url(#canvas-grid)" />

                {/* Empty state */}
                {elements.length === 0 && !connecting && (
                  <g>
                    <text x="50%" y="48%" textAnchor="middle" fill="#d1d5db" fontSize="15" fontWeight="500">
                      Drag components from the palette to start diagramming
                    </text>
                    <text x="50%" y="52%" textAnchor="middle" fill="#d1d5db" fontSize="13">
                      Use the Connect tool to draw data flows between components
                    </text>
                  </g>
                )}

                {/* Connections */}
                {connections.map((conn) => {
                  const from = elements.find(e => e.id === conn.fromId);
                  const to   = elements.find(e => e.id === conn.toId);
                  if (!from || !to) return null;
                  const { d, mid } = connectionPath(from, to);
                  const isSel = selected === conn.id;
                  return (
                    <g key={conn.id} onClick={(e) => { e.stopPropagation(); setSelected(conn.id); }} style={{ cursor: 'pointer' }}>
                      {/* Wider invisible click target */}
                      <path d={d} fill="none" stroke="transparent" strokeWidth={12} />
                      <path d={d} fill="none" stroke={isSel ? '#3b82f6' : '#94a3b8'} strokeWidth={isSel ? 2 : 1.5}
                        markerEnd={`url(#arrow${isSel ? '-sel' : ''})`} />
                      {conn.label && (
                        <text x={mid.x} y={mid.y - 4} textAnchor="middle" fontSize={10} fill="#6b7280" fontWeight="500"
                          style={{ pointerEvents: 'none' }}>
                          {conn.label}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Live connection line when in connect mode */}
                {connecting && (() => {
                  const from = elements.find(e => e.id === connecting);
                  if (!from) return null;
                  const fp = getEdgePoint(from, mousePos.x, mousePos.y);
                  return (
                    <line x1={fp.x} y1={fp.y} x2={mousePos.x} y2={mousePos.y}
                      stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="6,4"
                      markerEnd="url(#arrow-connecting)" />
                  );
                })()}

                {/* Elements (trust_boundary renders first via sort) */}
                {sorted.map((el) => (
                  <Shape
                    key={el.id}
                    el={el}
                    isSelected={selected === el.id}
                    isConnecting={connecting === el.id}
                    tool={tool}
                    onMouseDown={onElementMouseDown}
                    onDblClick={onDblClick}
                    onConnectClick={onConnectClick}
                    editingId={editing?.id}
                    editLabel={editing?.label ?? ''}
                    onEditChange={onEditChange}
                    onEditCommit={onEditCommit}
                  />
                ))}
              </svg>
            </div>
          </>
        ) : (
          /* Image upload mode */
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
            {uploadedImage ? (
              <div className="relative max-w-4xl w-full">
                <img src={uploadedImage} alt="Uploaded diagram" className="w-full rounded-xl shadow-lg border border-gray-200 object-contain max-h-[500px]" />
                <button
                  onClick={() => { setUploadedImage(null); emit(elements, connections, null); }}
                  className="absolute top-3 right-3 p-1.5 bg-white rounded-full shadow-md text-gray-500 hover:text-red-500 transition-colors"
                ><X className="w-4 h-4" /></button>
                <p className="text-center text-xs text-gray-400 mt-3">Click the × to remove and upload a different image</p>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer max-w-md w-full"
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-1">Upload a system diagram</p>
                <p className="text-sm text-gray-400">PNG, JPG, SVG, PDF — drop or click to browse</p>
                <p className="text-xs text-gray-400 mt-3">Use this as an alternative to the drawing canvas</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={onImageUpload} className="hidden" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mini palette icon renderer ───────────────────────────────────────────────
function PaletteIcon({ type, color, bg }) {
  switch (type) {
    case 'actor':
      return (
        <svg width="32" height="36" viewBox="0 0 32 36">
          <circle cx="16" cy="9" r="7" fill={bg} stroke={color} strokeWidth="1.5" />
          <line x1="16" y1="16" x2="16" y2="28" stroke={color} strokeWidth="1.5" />
          <line x1="8"  y1="22" x2="24" y2="22" stroke={color} strokeWidth="1.5" />
          <line x1="16" y1="28" x2="10" y2="36" stroke={color} strokeWidth="1.5" />
          <line x1="16" y1="28" x2="22" y2="36" stroke={color} strokeWidth="1.5" />
        </svg>
      );
    case 'process':
      return <svg width="40" height="24" viewBox="0 0 40 24"><rect x="1" y="1" width="38" height="22" rx="5" fill={bg} stroke={color} strokeWidth="1.5" /></svg>;
    case 'data_store':
      return (
        <svg width="40" height="24" viewBox="0 0 40 24">
          <rect x="1" y="6" width="38" height="12" fill={bg} />
          <line x1="1" y1="6" x2="39" y2="6" stroke={color} strokeWidth="1.5" />
          <line x1="1" y1="18" x2="39" y2="18" stroke={color} strokeWidth="1.5" />
          <line x1="1" y1="6" x2="1" y2="18" stroke={color} strokeWidth="1.5" />
          <line x1="39" y1="6" x2="39" y2="18" stroke={color} strokeWidth="1.5" />
        </svg>
      );
    case 'external':
      return (
        <svg width="40" height="24" viewBox="0 0 40 24">
          <rect x="1" y="1" width="38" height="22" fill={bg} stroke={color} strokeWidth="1.5" />
          <rect x="4" y="4" width="32" height="16" fill="none" stroke={color} strokeWidth="1" opacity="0.6" />
        </svg>
      );
    case 'trust_boundary':
      return <svg width="40" height="24" viewBox="0 0 40 24"><rect x="1" y="1" width="38" height="22" rx="4" fill={bg} stroke={color} strokeWidth="1.5" strokeDasharray="6,3" /></svg>;
    default:
      return null;
  }
}
