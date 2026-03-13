'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Topic, ModelProvider } from '@/types';
import { DIAGRAMS } from './diagrams';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DiagramNode {
  id: string;
  label: string;
  sublabel?: string;
  shape: 'rect' | 'cylinder' | 'diamond' | 'circle';
  color: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
}

interface GeneratedDiagram {
  title: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

interface SavedDiagram {
  id: string;
  title: string;
  topicId: string;
  topicTitle: string;
  mode: 'mcp' | 'scratchpad';
  createdAt: string;
  diagram?: GeneratedDiagram;
  imageData?: string;
}

type DiagramMode = 'architecture' | 'mcp' | 'scratchpad';
type DrawTool = 'pen' | 'rect' | 'arrow' | 'eraser';

// ── Constants ──────────────────────────────────────────────────────────────────

const NODE_W = 140;
const NODE_H = 50;
const STORAGE_KEY = 'sdb_diagrams';
const COLORS = ['#ededf5', '#4F9DFF', '#00D68F', '#FF8C42', '#9B7FFF', '#00D4FF', '#FF5470'];

// ── Helpers ────────────────────────────────────────────────────────────────────

function loadSavedDiagrams(): SavedDiagram[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persistDiagrams(diagrams: SavedDiagram[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(diagrams)); } catch { /* ignore */ }
}

function getEdgePoint(node: DiagramNode, fromX: number, fromY: number): [number, number] {
  const w = (node.width || NODE_W) / 2;
  const extraH = node.shape === 'cylinder' ? 10 : 0;
  const h = (node.height || NODE_H) / 2 + extraH;
  const cx = node.x + (node.width || NODE_W) / 2;
  const cy = node.y + (node.height || NODE_H) / 2;
  const dx = fromX - cx;
  const dy = fromY - cy;
  if (dx === 0 && dy === 0) return [cx, cy];
  if (node.shape === 'circle') {
    const r = Math.min(w, h);
    const len = Math.sqrt(dx * dx + dy * dy);
    return [cx + (dx / len) * r, cy + (dy / len) * r];
  }
  const scaleX = Math.abs(dx) > 0 ? w / Math.abs(dx) : Infinity;
  const scaleY = Math.abs(dy) > 0 ? h / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);
  return [cx + dx * scale, cy + dy * scale];
}

function toExcalidrawJSON(diagram: GeneratedDiagram): object {
  const elements: object[] = [];
  const seed = () => Math.floor(Math.random() * 999999);
  const ts = Date.now();
  const idMap = new Map<string, string>();

  diagram.nodes.forEach((node, i) => {
    const eid = `n${i}-${ts}`;
    idMap.set(node.id, eid);
    const w = node.width || NODE_W;
    const h = node.height || NODE_H;
    const base = {
      id: eid, x: node.x, y: node.y, width: w, height: h,
      angle: 0, strokeColor: node.color,
      backgroundColor: node.color + '33',
      fillStyle: 'solid', strokeWidth: 1.5, strokeStyle: 'solid',
      roughness: 0, opacity: 100, groupIds: [], seed: seed(),
      version: 1, isDeleted: false, boundElements: null,
      updated: ts, link: null, locked: false,
    };
    const shapeMap: Record<string, string> = {
      rect: 'rectangle', cylinder: 'ellipse',
      diamond: 'diamond', circle: 'ellipse',
    };
    elements.push({ ...base, type: shapeMap[node.shape] || 'rectangle', roundness: { type: 3 } });
    elements.push({
      id: `t${i}-${ts}`, type: 'text',
      x: node.x + 8, y: node.y + (h / 2) - 8,
      width: w - 16, height: 20,
      angle: 0, strokeColor: '#ffffff', backgroundColor: 'transparent',
      fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid',
      roughness: 0, opacity: 100, groupIds: [], seed: seed(),
      version: 1, isDeleted: false, boundElements: null,
      updated: ts, link: null, locked: false,
      text: node.label, fontSize: 14, fontFamily: 1,
      textAlign: 'center', verticalAlign: 'middle', containerId: eid,
    });
  });

  diagram.edges.forEach((edge, i) => {
    const srcId = idMap.get(edge.from);
    const tgtId = idMap.get(edge.to);
    if (!srcId || !tgtId) return;
    elements.push({
      id: `a${i}-${ts}`, type: 'arrow',
      x: 0, y: 0, width: 1, height: 1, angle: 0,
      strokeColor: '#4F9DFF', backgroundColor: 'transparent',
      fillStyle: 'solid', strokeWidth: 1.5,
      strokeStyle: edge.dashed ? 'dashed' : 'solid',
      roughness: 0, opacity: 100, groupIds: [], seed: seed(),
      version: 1, isDeleted: false, boundElements: null,
      updated: ts, link: null, locked: false,
      points: [[0, 0], [100, 0]],
      startBinding: { elementId: srcId, focus: 0, gap: 8 },
      endBinding: { elementId: tgtId, focus: 0, gap: 8 },
      startArrowhead: null, endArrowhead: 'arrow',
    });
  });

  return {
    type: 'excalidraw', version: 2,
    source: 'https://excalidraw.com',
    elements,
    appState: { gridSize: null, viewBackgroundColor: '#0d1117' },
    files: {},
  };
}

function downloadExcalidraw(diagram: GeneratedDiagram, title: string) {
  const json = toExcalidrawJSON(diagram);
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.excalidraw`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPNG(dataUrl: string, title: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.png`;
  a.click();
}

// ── SVG Diagram Renderer ───────────────────────────────────────────────────────

function DiagramPreviewSVG({ diagram }: { diagram: GeneratedDiagram }) {
  const nodes = diagram.nodes || [];
  const edges = diagram.edges || [];

  if (nodes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(237,237,245,0.35)', fontSize: 13 }}>
        No diagram elements to display.
      </div>
    );
  }

  const pad = 50;
  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  const x2s = nodes.map(n => n.x + (n.width || NODE_W));
  const y2s = nodes.map(n => n.y + (n.height || NODE_H));
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const vw = Math.max(...x2s) + pad - minX;
  const vh = Math.max(...y2s) + pad + 30 - minY;

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  return (
    <svg
      viewBox={`${minX} ${minY} ${vw} ${vh}`}
      width="100%"
      style={{ maxHeight: 500, display: 'block' }}
      role="img"
      aria-label={diagram.title}
    >
      <defs>
        <marker id="arrowBlue" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#4F9DFF" />
        </marker>
        <marker id="arrowGray" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="rgba(237,237,245,0.35)" />
        </marker>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.5)" />
        </filter>
      </defs>

      {/* Edges */}
      {edges.map((edge, i) => {
        const src = nodeMap.get(edge.from);
        const tgt = nodeMap.get(edge.to);
        if (!src || !tgt) return null;
        const sx = src.x + (src.width || NODE_W) / 2;
        const sy = src.y + (src.height || NODE_H) / 2;
        const tx = tgt.x + (tgt.width || NODE_W) / 2;
        const ty = tgt.y + (tgt.height || NODE_H) / 2;
        const [x1, y1] = getEdgePoint(src, tx, ty);
        const [x2, y2] = getEdgePoint(tgt, sx, sy);
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const stroke = edge.dashed ? 'rgba(237,237,245,0.35)' : '#4F9DFF';
        const markerId = edge.dashed ? 'arrowGray' : 'arrowBlue';
        return (
          <g key={i}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={stroke} strokeWidth="1.5"
              strokeDasharray={edge.dashed ? '6,4' : undefined}
              markerEnd={`url(#${markerId})`}
            />
            {edge.label && (
              <text
                x={mx} y={my - 6}
                textAnchor="middle"
                fill="rgba(237,237,245,0.5)"
                fontSize="9"
                fontFamily="'JetBrains Mono', monospace"
              >
                {edge.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map(node => {
        const w = node.width || NODE_W;
        const h = node.height || NODE_H;
        const cx = node.x + w / 2;
        const cy = node.y + h / 2;
        const col = node.color || '#4F9DFF';
        const bg = col + '1a';

        let shape: React.ReactNode;
        if (node.shape === 'cylinder') {
          const ry = 10;
          shape = (
            <g filter="url(#glow)">
              <rect x={node.x} y={node.y + ry} width={w} height={h - ry} rx="4" fill={bg} stroke={col} strokeWidth="1.5" />
              <ellipse cx={cx} cy={node.y + ry} rx={w / 2} ry={ry} fill={bg} stroke={col} strokeWidth="1.5" />
              <ellipse cx={cx} cy={node.y + h} rx={w / 2} ry={ry} fill={col + '33'} stroke={col} strokeWidth="1.5" />
            </g>
          );
        } else if (node.shape === 'diamond') {
          const pts = `${cx},${node.y} ${node.x + w},${cy} ${cx},${node.y + h} ${node.x},${cy}`;
          shape = (
            <g filter="url(#glow)">
              <polygon points={pts} fill={bg} stroke={col} strokeWidth="1.5" />
            </g>
          );
        } else if (node.shape === 'circle') {
          const r = Math.min(w, h) / 2;
          shape = (
            <g filter="url(#glow)">
              <circle cx={cx} cy={cy} r={r} fill={bg} stroke={col} strokeWidth="1.5" />
            </g>
          );
        } else {
          shape = (
            <g filter="url(#glow)">
              <rect x={node.x} y={node.y} width={w} height={h} rx="8" fill={bg} stroke={col} strokeWidth="1.5" />
            </g>
          );
        }

        const textY = node.sublabel ? cy - 7 : cy;
        return (
          <g key={node.id}>
            {shape}
            <text
              x={cx} y={textY}
              textAnchor="middle" dominantBaseline="central"
              fill="#ededf5" fontSize="12" fontWeight="600"
              fontFamily="'Inter', sans-serif"
            >
              {node.label}
            </text>
            {node.sublabel && (
              <text
                x={cx} y={textY + 13}
                textAnchor="middle" dominantBaseline="central"
                fill={col + 'cc'} fontSize="9"
                fontFamily="'JetBrains Mono', monospace"
              >
                {node.sublabel}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Scratchpad Canvas ──────────────────────────────────────────────────────────

function ScratchpadCanvas({ onSave }: { onSave: (dataUrl: string, title: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<DrawTool>('pen');
  const [color, setColor] = useState('#ededf5');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const snapshot = useRef<ImageData | null>(null);
  const history = useRef<ImageData[]>([]);
  const [saveTitle, setSaveTitle] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = useCallback((e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);
    // Save state for undo
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    history.current.push(imageData);
    if (history.current.length > 30) history.current.shift();
    // Save snapshot for shape preview
    snapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    startPos.current = pos;
    setIsDrawing(true);
    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  }, [tool, getPos]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !startPos.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);

    if (tool === 'pen') {
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.strokeStyle = '#0d1117';
      ctx.lineWidth = strokeWidth * 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === 'rect' || tool === 'arrow') {
      // Restore snapshot then draw preview
      ctx.putImageData(snapshot.current!, 0, 0);
      const { x: sx, y: sy } = startPos.current;
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      if (tool === 'rect') {
        ctx.strokeRect(sx, sy, pos.x - sx, pos.y - sy);
      } else {
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        // Arrowhead
        const angle = Math.atan2(pos.y - sy, pos.x - sx);
        const hl = Math.max(10, strokeWidth * 5);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x - hl * Math.cos(angle - Math.PI / 6), pos.y - hl * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x - hl * Math.cos(angle + Math.PI / 6), pos.y - hl * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
    }
  }, [isDrawing, tool, color, strokeWidth, getPos]);

  const onMouseUp = useCallback(() => {
    setIsDrawing(false);
    startPos.current = null;
    snapshot.current = null;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.closePath();
  }, []);

  const undo = useCallback(() => {
    if (history.current.length === 0) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(history.current.pop()!, 0, 0);
  }, []);

  const clear = useCallback(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    history.current = [];
  }, []);

  const handleSave = () => {
    if (!saveTitle.trim()) return;
    const canvas = canvasRef.current!;
    onSave(canvas.toDataURL('image/png'), saveTitle.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaveTitle('');
  };

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 10px',
    borderRadius: 7,
    border: active ? '1px solid rgba(79,142,247,0.45)' : '1px solid rgba(255,255,255,0.10)',
    background: active ? 'rgba(79,142,247,0.18)' : 'rgba(255,255,255,0.04)',
    color: active ? '#ededf5' : 'rgba(237,237,245,0.55)',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  const tools: { id: DrawTool; label: string; icon: string }[] = [
    { id: 'pen', label: 'Pen', icon: '✏️' },
    { id: 'rect', label: 'Rect', icon: '▭' },
    { id: 'arrow', label: 'Arrow', icon: '→' },
    { id: 'eraser', label: 'Eraser', icon: '⌫' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
        padding: '10px 12px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
      }}>
        {/* Tool buttons */}
        <div style={{ display: 'flex', gap: 4 }}>
          {tools.map(t => (
            <button key={t.id} onClick={() => setTool(t.id)} style={btnStyle(tool === t.id)} title={t.label}>
              <span style={{ marginRight: 4 }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />

        {/* Color swatches */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: 18, height: 18, borderRadius: '50%',
                background: c,
                border: color === c ? '2px solid white' : '2px solid transparent',
                cursor: 'pointer', padding: 0,
                outline: 'none',
              }}
              title={c}
            />
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />

        {/* Stroke width */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2, 4, 6].map(w => (
            <button key={w} onClick={() => setStrokeWidth(w)} style={btnStyle(strokeWidth === w)} title={`Stroke ${w}px`}>
              {w}px
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Undo / Clear */}
        <button onClick={undo} style={btnStyle(false)} title="Undo">↩ Undo</button>
        <button onClick={clear} style={{ ...btnStyle(false), color: 'rgba(255,84,112,0.75)' }} title="Clear canvas">
          Clear
        </button>
      </div>

      {/* Canvas */}
      <div style={{
        background: '#0d1117',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10,
        overflow: 'hidden',
        cursor: tool === 'eraser' ? 'cell' : 'crosshair',
      }}>
        <canvas
          ref={canvasRef}
          width={900}
          height={500}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{ display: 'block', width: '100%', touchAction: 'none' }}
        />
      </div>

      {/* Save form */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={saveTitle}
          onChange={e => setSaveTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="Name this diagram…"
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#ededf5', fontSize: 13, outline: 'none',
          }}
        />
        <button
          onClick={handleSave}
          disabled={!saveTitle.trim()}
          style={{
            padding: '8px 16px', borderRadius: 8,
            background: saveTitle.trim() ? 'rgba(0,214,143,0.18)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${saveTitle.trim() ? 'rgba(0,214,143,0.35)' : 'rgba(255,255,255,0.10)'}`,
            color: saveTitle.trim() ? '#00D68F' : 'rgba(237,237,245,0.35)',
            fontSize: 13, fontWeight: 500, cursor: saveTitle.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}
        >
          {saved ? '✓ Saved' : '💾 Save'}
        </button>
      </div>
    </div>
  );
}

// ── Saved Diagram Card ─────────────────────────────────────────────────────────

function SavedDiagramCard({
  saved,
  onDelete,
  onView,
}: {
  saved: SavedDiagram;
  onDelete: () => void;
  onView: () => void;
}) {
  const date = new Date(saved.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: '#ededf5',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {saved.title}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(237,237,245,0.35)', marginTop: 2 }}>
            {saved.topicTitle} · {date}
          </div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
          background: saved.mode === 'mcp' ? 'rgba(155,127,255,0.15)' : 'rgba(79,142,247,0.15)',
          border: `1px solid ${saved.mode === 'mcp' ? 'rgba(155,127,255,0.3)' : 'rgba(79,142,247,0.3)'}`,
          color: saved.mode === 'mcp' ? '#9B7FFF' : '#4F9DFF',
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          {saved.mode === 'mcp' ? 'AI' : 'Sketch'}
        </span>
      </div>

      {/* Thumbnail */}
      <div style={{
        background: '#0d1117',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8,
        overflow: 'hidden',
        minHeight: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {saved.mode === 'mcp' && saved.diagram ? (
          <div style={{ width: '100%', padding: '8px 6px', transform: 'scale(0.85)', transformOrigin: 'top center' }}>
            <DiagramPreviewSVG diagram={saved.diagram} />
          </div>
        ) : saved.imageData ? (
          <img
            src={saved.imageData}
            alt={saved.title}
            style={{ width: '100%', display: 'block', borderRadius: 6 }}
          />
        ) : (
          <span style={{ color: 'rgba(237,237,245,0.2)', fontSize: 12 }}>No preview</span>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={onView}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 12, fontWeight: 500,
            background: 'rgba(79,142,247,0.10)',
            border: '1px solid rgba(79,142,247,0.25)',
            color: '#4F9DFF', cursor: 'pointer',
          }}
        >
          View
        </button>
        {saved.mode === 'mcp' && saved.diagram && (
          <button
            onClick={() => downloadExcalidraw(saved.diagram!, saved.title)}
            style={{
              flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 12, fontWeight: 500,
              background: 'rgba(155,127,255,0.10)',
              border: '1px solid rgba(155,127,255,0.25)',
              color: '#9B7FFF', cursor: 'pointer',
            }}
            title="Export as Excalidraw file"
          >
            .excalidraw
          </button>
        )}
        {saved.mode === 'scratchpad' && saved.imageData && (
          <button
            onClick={() => downloadPNG(saved.imageData!, saved.title)}
            style={{
              flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 12, fontWeight: 500,
              background: 'rgba(0,214,143,0.10)',
              border: '1px solid rgba(0,214,143,0.25)',
              color: '#00D68F', cursor: 'pointer',
            }}
          >
            PNG
          </button>
        )}
        <button
          onClick={onDelete}
          style={{
            padding: '6px 10px', borderRadius: 7, fontSize: 12,
            background: 'rgba(255,84,112,0.08)',
            border: '1px solid rgba(255,84,112,0.20)',
            color: 'rgba(255,84,112,0.7)', cursor: 'pointer',
          }}
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ── Expanded Diagram View (modal-like inline) ──────────────────────────────────

function ExpandedView({ saved, onClose }: { saved: SavedDiagram; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.82)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      zIndex: 200,
      display: 'flex', flexDirection: 'column',
      padding: '24px',
      overflow: 'auto',
    }}>
      <div style={{
        maxWidth: 860, width: '100%', margin: '0 auto',
        background: '#0f1e35',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 16,
        padding: '20px 24px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#ededf5', letterSpacing: '-0.02em' }}>
              {saved.title}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(237,237,245,0.35)', marginTop: 3 }}>
              {saved.topicTitle} · {new Date(saved.createdAt).toLocaleString()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {saved.mode === 'mcp' && saved.diagram && (
              <button
                onClick={() => downloadExcalidraw(saved.diagram!, saved.title)}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                  background: 'rgba(155,127,255,0.15)',
                  border: '1px solid rgba(155,127,255,0.35)',
                  color: '#9B7FFF', cursor: 'pointer',
                }}
              >
                Export .excalidraw
              </button>
            )}
            {saved.mode === 'scratchpad' && saved.imageData && (
              <button
                onClick={() => downloadPNG(saved.imageData!, saved.title)}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                  background: 'rgba(0,214,143,0.15)',
                  border: '1px solid rgba(0,214,143,0.35)',
                  color: '#00D68F', cursor: 'pointer',
                }}
              >
                Download PNG
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 12,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(237,237,245,0.65)', cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>

        <div style={{
          background: '#0d1117',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: 16,
          overflow: 'auto',
        }}>
          {saved.mode === 'mcp' && saved.diagram ? (
            <DiagramPreviewSVG diagram={saved.diagram} />
          ) : saved.imageData ? (
            <img src={saved.imageData} alt={saved.title} style={{ width: '100%', display: 'block', borderRadius: 8 }} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Main DiagramTab ────────────────────────────────────────────────────────────

export default function DiagramTab({
  topic,
  provider = 'anthropic',
}: {
  topic: Topic;
  provider?: ModelProvider;
}) {
  const DiagramComp = topic.diagramId ? DIAGRAMS[topic.diagramId] : null;

  const [mode, setMode] = useState<DiagramMode>('architecture');

  // MCP state
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedDiagram, setGeneratedDiagram] = useState<GeneratedDiagram | null>(null);
  const [mcpError, setMcpError] = useState('');
  const [mcpSaveTitle, setMcpSaveTitle] = useState('');
  const [mcpSaved, setMcpSaved] = useState(false);

  // Saved diagrams
  const [savedDiagrams, setSavedDiagrams] = useState<SavedDiagram[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setSavedDiagrams(loadSavedDiagrams());
  }, []);

  const persistAndSet = (updated: SavedDiagram[]) => {
    setSavedDiagrams(updated);
    persistDiagrams(updated);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setMcpError('');
    setGeneratedDiagram(null);
    try {
      const res = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setGeneratedDiagram(data.diagram);
      setMcpSaveTitle(data.diagram.title || '');
    } catch (err) {
      setMcpError(err instanceof Error ? err.message : 'Failed to generate diagram');
    } finally {
      setGenerating(false);
    }
  };

  const handleMcpSave = () => {
    if (!generatedDiagram || !mcpSaveTitle.trim()) return;
    const entry: SavedDiagram = {
      id: `mcp-${Date.now()}`,
      title: mcpSaveTitle.trim(),
      topicId: topic.id,
      topicTitle: topic.title,
      mode: 'mcp',
      createdAt: new Date().toISOString(),
      diagram: generatedDiagram,
    };
    persistAndSet([entry, ...savedDiagrams]);
    setMcpSaved(true);
    setTimeout(() => setMcpSaved(false), 2000);
  };

  const handleScratchpadSave = (dataUrl: string, title: string) => {
    const entry: SavedDiagram = {
      id: `sketch-${Date.now()}`,
      title,
      topicId: topic.id,
      topicTitle: topic.title,
      mode: 'scratchpad',
      createdAt: new Date().toISOString(),
      imageData: dataUrl,
    };
    persistAndSet([entry, ...savedDiagrams]);
  };

  const handleDelete = (id: string) => {
    persistAndSet(savedDiagrams.filter(d => d.id !== id));
  };

  const expandedDiagram = expandedId ? savedDiagrams.find(d => d.id === expandedId) : null;

  const card: React.CSSProperties = {
    background: '#1c1c1e',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
  };

  const label: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(245,245,247,0.35)',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    marginBottom: 8,
  };

  const modeBtn = (m: DiagramMode, lbl: string, emoji: string): React.ReactNode => {
    const active = mode === m;
    return (
      <button
        key={m}
        onClick={() => setMode(m)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: active ? 600 : 400,
          background: active ? 'rgba(79,142,247,0.16)' : 'rgba(255,255,255,0.04)',
          border: active ? '1px solid rgba(79,142,247,0.35)' : '1px solid rgba(255,255,255,0.08)',
          color: active ? '#ededf5' : 'rgba(237,237,245,0.50)',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <span>{emoji}</span> {lbl}
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Mode selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {modeBtn('architecture', 'Architecture', '🗺️')}
        {modeBtn('mcp', 'AI Diagram (MCP)', '✨')}
        {modeBtn('scratchpad', 'Scratchpad', '✏️')}
      </div>

      {/* ── Architecture Mode ─────────────────────── */}
      {mode === 'architecture' && (
        DiagramComp ? (
          <>
            <section>
              <div style={label}>Architecture Diagram</div>
              <div style={{ ...card, padding: 20, overflowX: 'auto' }}>
                <DiagramComp />
              </div>
            </section>

            <section>
              <div style={label}>Drawing Guide</div>
              <div style={{ ...card, padding: 20 }}>
                <p style={{ fontSize: 13.5, color: 'rgba(245,245,247,0.45)', marginBottom: 16, lineHeight: 1.6 }}>
                  Use the{' '}
                  <button
                    onClick={() => setMode('mcp')}
                    style={{ color: '#9B7FFF', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'inherit', textDecoration: 'underline' }}
                  >
                    AI Diagram
                  </button>
                  {' '}tab to generate variations via prompt, or the{' '}
                  <button
                    onClick={() => setMode('scratchpad')}
                    style={{ color: '#4F9DFF', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'inherit', textDecoration: 'underline' }}
                  >
                    Scratchpad
                  </button>
                  {' '}to draw from memory. Use each point below as a component:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {topic.keyPoints.map((kp, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ color: '#0a84ff', flexShrink: 0, marginTop: 1, fontSize: 14 }}>→</span>
                      <span style={{ fontSize: 13.5, color: 'rgba(245,245,247,0.65)', lineHeight: 1.65 }}>{kp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        ) : (
          <div style={{ ...card, padding: '60px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.6 }}>🗺️</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8, letterSpacing: '-0.01em' }}>
              No pre-built diagram for this topic
            </div>
            <p style={{ fontSize: 13.5, color: 'rgba(245,245,247,0.45)', maxWidth: 380, margin: '0 auto 20px', lineHeight: 1.7 }}>
              Use the AI Diagram tab to generate one from a prompt, or draw it yourself in the Scratchpad.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setMode('mcp')}
                style={{
                  fontSize: 13, fontWeight: 500, color: '#9B7FFF',
                  padding: '8px 18px', border: '1px solid rgba(155,127,255,0.30)',
                  borderRadius: 8, background: 'rgba(155,127,255,0.08)', cursor: 'pointer',
                }}
              >
                ✨ Generate with AI →
              </button>
              <button
                onClick={() => setMode('scratchpad')}
                style={{
                  fontSize: 13, fontWeight: 500, color: '#4F9DFF',
                  padding: '8px 18px', border: '1px solid rgba(79,142,247,0.30)',
                  borderRadius: 8, background: 'rgba(79,142,247,0.08)', cursor: 'pointer',
                }}
              >
                ✏️ Open Scratchpad →
              </button>
            </div>
          </div>
        )
      )}

      {/* ── AI Diagram (MCP) Mode ─────────────────── */}
      {mode === 'mcp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Info banner */}
          <div style={{
            padding: '10px 14px',
            background: 'rgba(155,127,255,0.08)',
            border: '1px solid rgba(155,127,255,0.20)',
            borderRadius: 10,
            fontSize: 12.5, color: 'rgba(237,237,245,0.60)', lineHeight: 1.6,
          }}>
            <strong style={{ color: '#9B7FFF' }}>Excalidraw MCP</strong> — Describe an architecture and the AI generates a structured diagram.
            Preview it inline, save it to your record, or export as a{' '}
            <code style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: 4 }}>.excalidraw</code>
            {' '}file to open in Excalidraw.
          </div>

          {/* Prompt */}
          <div>
            <div style={label}>Describe the architecture</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                placeholder={`e.g. "Twitter-like social media system with load balancers, sharded MySQL, Redis caching, and a CDN"`}
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 9,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#ededf5', fontSize: 13, lineHeight: 1.6, resize: 'vertical',
                  outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'rgba(237,237,245,0.25)' }}>⌘↵ to generate</span>
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || generating}
                  style={{
                    padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: prompt.trim() && !generating ? 'rgba(155,127,255,0.22)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${prompt.trim() && !generating ? 'rgba(155,127,255,0.45)' : 'rgba(255,255,255,0.10)'}`,
                    color: prompt.trim() && !generating ? '#9B7FFF' : 'rgba(237,237,245,0.25)',
                    cursor: prompt.trim() && !generating ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {generating ? (
                    <>
                      <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(155,127,255,0.4)', borderTopColor: '#9B7FFF', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      Generating…
                    </>
                  ) : '✨ Generate Diagram'}
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
          {mcpError && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(255,84,112,0.10)',
              border: '1px solid rgba(255,84,112,0.25)',
              borderRadius: 9,
              fontSize: 13, color: '#FF5470',
            }}>
              {mcpError}
            </div>
          )}

          {/* Generated diagram preview */}
          {generatedDiagram && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={label}>Preview — {generatedDiagram.title}</div>
              <div style={{
                ...card,
                padding: 16,
                background: '#0d1117',
              }}>
                <DiagramPreviewSVG diagram={generatedDiagram} />
              </div>

              {/* Save + export */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  value={mcpSaveTitle}
                  onChange={e => setMcpSaveTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleMcpSave()}
                  placeholder="Name to save…"
                  style={{
                    flex: 1, minWidth: 160, padding: '8px 12px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#ededf5', fontSize: 13, outline: 'none',
                  }}
                />
                <button
                  onClick={handleMcpSave}
                  disabled={!mcpSaveTitle.trim()}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                    background: mcpSaveTitle.trim() ? 'rgba(0,214,143,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${mcpSaveTitle.trim() ? 'rgba(0,214,143,0.35)' : 'rgba(255,255,255,0.10)'}`,
                    color: mcpSaveTitle.trim() ? '#00D68F' : 'rgba(237,237,245,0.25)',
                    cursor: mcpSaveTitle.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s',
                  }}
                >
                  {mcpSaved ? '✓ Saved' : '💾 Save'}
                </button>
                <button
                  onClick={() => downloadExcalidraw(generatedDiagram, mcpSaveTitle || generatedDiagram.title)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                    background: 'rgba(155,127,255,0.12)',
                    border: '1px solid rgba(155,127,255,0.30)',
                    color: '#9B7FFF', cursor: 'pointer',
                  }}
                  title="Download as .excalidraw file"
                >
                  Export .excalidraw
                </button>
              </div>
            </div>
          )}

          {/* Topic key points as quick prompts */}
          <div>
            <div style={label}>Quick prompts for this topic</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                `${topic.title} system architecture`,
                `${topic.title} with caching and load balancing`,
                `${topic.title} database design`,
              ].map(q => (
                <button
                  key={q}
                  onClick={() => setPrompt(q)}
                  style={{
                    fontSize: 12, padding: '5px 11px', borderRadius: 7,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    color: 'rgba(237,237,245,0.55)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Scratchpad Mode ───────────────────────── */}
      {mode === 'scratchpad' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            padding: '10px 14px',
            background: 'rgba(79,142,247,0.07)',
            border: '1px solid rgba(79,142,247,0.18)',
            borderRadius: 10,
            fontSize: 12.5, color: 'rgba(237,237,245,0.55)', lineHeight: 1.6,
          }}>
            <strong style={{ color: '#4F9DFF' }}>Scratchpad</strong> — Draw your architecture from memory.
            Use pen, rectangle, and arrow tools. Save your sketch to keep it in your diagram record.
          </div>
          <ScratchpadCanvas
            onSave={(dataUrl, title) => handleScratchpadSave(dataUrl, title)}
          />
        </div>
      )}

      {/* ── Saved Diagrams ────────────────────────── */}
      {savedDiagrams.length > 0 && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={label}>Saved Diagrams ({savedDiagrams.length})</div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 12,
          }}>
            {savedDiagrams.map(d => (
              <SavedDiagramCard
                key={d.id}
                saved={d}
                onDelete={() => handleDelete(d.id)}
                onView={() => setExpandedId(d.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Expanded view */}
      {expandedDiagram && (
        <ExpandedView
          saved={expandedDiagram}
          onClose={() => setExpandedId(null)}
        />
      )}

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
