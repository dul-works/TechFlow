import { useCallback, useRef, useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import ImageEditor from './ImageEditor';
import type { FloorPlanSettings } from '../../types';

interface Props { zoneId: string }

export default function CableGuideEditor({ zoneId }: Props) {
  const store = useProjectStore();
  const zone = store.project.zones.find((z) => z.id === zoneId);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  if (!zone) return null;

  const floorPlan = zone.floorPlan;
  const positions = zone.cableGuideNodePositions;

  const handleApplyFloorPlan = useCallback((settings: FloorPlanSettings) => {
    store.setFloorPlan(zoneId, settings);
    setShowImageEditor(false);
  }, [zoneId, store]);

  // Build filter for floor plan image
  const imgFilter = floorPlan
    ? `${floorPlan.grayscale ? 'grayscale(1) ' : ''}opacity(${floorPlan.opacity})`
    : '';


  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setDraggingNodeId(nodeId);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const onMove = (mv: MouseEvent) => {
      const x = ((mv.clientX - rect.left) / rect.width) * 100;
      const y = ((mv.clientY - rect.top) / rect.height) * 100;
      store.setCableGuideNodePosition(zoneId, nodeId, {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      });
    };
    const onUp = () => {
      setDraggingNodeId(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [zoneId, store]);

  // Draw cable connections as SVG lines
  const getNodePos = (nodeId: string) => {
    const pos = positions[nodeId];
    if (pos) return pos;
    // default distribute
    const idx = zone.nodes.findIndex((n) => n.id === nodeId);
    return { x: 10 + (idx * 12) % 80, y: 50 };
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Left sidebar */}
      <div style={{
        width: 200, flexShrink: 0, background: '#111', borderRight: '1px solid #222',
        padding: 12, display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1, textTransform: 'uppercase' }}>
          Floor Plan
        </div>
        <button onClick={() => setShowImageEditor(true)} style={btnStyle}>
          {floorPlan ? '🔄 Change Image' : '📁 Upload Image'}
        </button>
        {floorPlan && (
          <>
            <div style={{ fontSize: 10, color: '#555', marginTop: 8, marginBottom: 4 }}>OPACITY</div>
            <input type="range" min={0.05} max={1} step={0.05}
              value={floorPlan.opacity}
              onChange={(e) => store.updateFloorPlan(zoneId, { opacity: Number(e.target.value) })}
              style={{ accentColor: '#fff' }} />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: '#666' }}>Grayscale</span>
              <button
                onClick={() => store.updateFloorPlan(zoneId, { grayscale: !floorPlan.grayscale })}
                style={{
                  background: floorPlan.grayscale ? '#fff' : '#222',
                  color: floorPlan.grayscale ? '#000' : '#666',
                  border: '1px solid #444', borderRadius: 3,
                  padding: '2px 8px', cursor: 'pointer', fontSize: 10,
                  fontFamily: 'inherit',
                }}
              >{floorPlan.grayscale ? 'ON' : 'OFF'}</button>
            </div>
            <button onClick={() => store.clearFloorPlan(zoneId)} style={{ ...btnStyle, color: '#ff6b6b', marginTop: 8 }}>
              🗑 Remove Image
            </button>
          </>
        )}

        <div style={{ borderTop: '1px solid #222', paddingTop: 10, marginTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
            Hardware
          </div>
          {zone.nodes.map((n) => (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5,
              fontSize: 11, color: '#ccc',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: n.data.color, flexShrink: 0 }} />
              {n.data.name}
            </div>
          ))}
          {zone.nodes.length === 0 && (
            <div style={{ fontSize: 10, color: '#444' }}>No hardware added yet</div>
          )}
        </div>

        {/* Technical List */}
        <div style={{ borderTop: '1px solid #222', paddingTop: 10, marginTop: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
            Technical List
          </div>
          {/* Hardware */}
          {zone.nodes.map((n) => (
            <div key={`hw_${n.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: n.data.color, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: '#aaa' }}>{n.data.name}</span>
            </div>
          ))}
          {/* Cables */}
          {Array.from(new Set(zone.edges.map((e) => e.data.type))).map((type) => {
            const edge = zone.edges.find((e) => e.data.type === type);
            return (
              <div key={`cable_${type}`} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 18, height: 2, background: edge?.data.color ?? '#aaa', borderRadius: 1 }} />
                <span style={{ fontSize: 10, color: '#aaa' }}>{type}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0a0a0a' }}
        ref={canvasRef}>

        {/* Floor plan background */}
        {floorPlan ? (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <img
              src={floorPlan.imageDataUrl}
              alt="floor plan"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: imgFilter,
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          </div>
        ) : (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 12,
          }}>
            <div style={{ fontSize: 40, opacity: 0.2 }}>🏗</div>
            <div style={{ fontSize: 13, color: '#444' }}>Upload a floor plan image to get started</div>
            <button onClick={() => setShowImageEditor(true)} style={{ ...btnStyle, fontSize: 12 }}>
              📁 Upload Image
            </button>
          </div>
        )}

        {/* SVG cable lines */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {zone.edges.map((edge) => {
            const src = getNodePos(edge.source);
            const tgt = getNodePos(edge.target);
            const x1 = `${src.x}%`, y1 = `${src.y}%`;
            const x2 = `${tgt.x}%`, y2 = `${tgt.y}%`;
            const mx = (src.x + tgt.x) / 2;
            const my = (src.y + tgt.y) / 2;
            return (
              <g key={edge.id}>
                <line x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={edge.data.color} strokeWidth={2}
                  strokeDasharray={(edge.data as { dashed?: boolean }).dashed ? '6 4' : undefined}
                  opacity={0.8}
                />
                <text x={`${mx}%`} y={`${my}%`} fill={edge.data.color}
                  fontSize={9} textAnchor="middle" dy={-4}
                  style={{ fontFamily: 'SamsungSSHead, sans-serif' }}>
                  {edge.data.type}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hardware block overlays */}
        {zone.nodes.map((node) => {
          const pos = getNodePos(node.id);
          return (
            <div
              key={node.id}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              style={{
                position: 'absolute',
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                cursor: draggingNodeId === node.id ? 'grabbing' : 'grab',
                userSelect: 'none',
                zIndex: draggingNodeId === node.id ? 100 : 10,
              }}
            >
              <div style={{
                background: '#0f0f0f',
                border: `2px solid ${node.data.color}`,
                borderRadius: 5,
                padding: '5px 8px',
                fontSize: 11,
                color: '#fff',
                whiteSpace: 'nowrap',
                boxShadow: `0 0 8px ${node.data.color}66`,
              }}>
                <div style={{ width: '100%', height: 2, background: node.data.color, marginBottom: 4, borderRadius: 1 }} />
                <span style={{ fontWeight: 600 }}>{node.data.name}</span>
                {node.data.quantity > 1 && <span style={{ color: '#888', marginLeft: 4, fontSize: 10 }}>×{node.data.quantity}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {showImageEditor && (
        <ImageEditor
          onApply={handleApplyFloorPlan}
          onCancel={() => setShowImageEditor(false)}
          initial={floorPlan}
        />
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: '#111', border: '1px solid #2a2a2a', borderRadius: 5,
  color: '#aaa', padding: '7px 10px', cursor: 'pointer', fontSize: 11,
  textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.1s',
};
