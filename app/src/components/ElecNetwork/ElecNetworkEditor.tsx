import { useCallback, useRef, useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import ImageEditor from '../CableGuide/ImageEditor';
import type { FloorMarker, FloorPlanSettings, MarkerType } from '../../types';
import { MARKER_LABELS } from '../../data/defaultHardware';

interface Props { zoneId: string }

const MARKER_ICONS: Record<string, string> = {
  '220v': '⚡',
  'internet': '🌐',
  'powerstrip': '🔌',
  'usb_repeater': '🔗',
};

const MARKER_COLORS: Record<string, string> = {
  '220v': '#FFD43B',
  'internet': '#74C0FC',
  'powerstrip': '#A9E34B',
  'usb_repeater': '#FFA94D',
};

const ACTIVE_MARKER_TYPES = ['220v', 'internet'] as MarkerType[];

export default function ElecNetworkEditor({ zoneId }: Props) {
  const store = useProjectStore();
  const zone = store.project.zones.find((z) => z.id === zoneId);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [addingMarker, setAddingMarker] = useState<MarkerType | null>(null);
  const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  if (!zone) return null;
  const floorPlan = zone.floorPlan;

  const handleApplyFloorPlan = useCallback((settings: FloorPlanSettings) => {
    store.setFloorPlan(zoneId, settings);
    setShowImageEditor(false);
  }, [zoneId, store]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (!addingMarker || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    store.addMarker(zoneId, { x, y, type: addingMarker });
    setAddingMarker(null);
  }, [addingMarker, zoneId, store]);

  const handleMarkerMouseDown = useCallback((e: React.MouseEvent, markerId: string) => {
    if (addingMarker) return;
    e.preventDefault();
    e.stopPropagation();
    setDraggingMarkerId(markerId);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const onMove = (mv: MouseEvent) => {
      const x = ((mv.clientX - rect.left) / rect.width) * 100;
      const y = ((mv.clientY - rect.top) / rect.height) * 100;
      store.updateMarker(zoneId, markerId, {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      });
    };
    const onUp = () => {
      setDraggingMarkerId(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [addingMarker, zoneId, store]);

  const imgFilter = floorPlan
    ? `${floorPlan.grayscale ? 'grayscale(1) ' : ''}opacity(${floorPlan.opacity})`
    : '';

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Left sidebar */}
      <div style={{
        width: 200, flexShrink: 0, background: '#111', borderRight: '1px solid #222',
        padding: 12, display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1, textTransform: 'uppercase' }}>
          Elec & Network
        </div>

        <button onClick={() => setShowImageEditor(true)} style={btnStyle}>
          {floorPlan ? '🔄 Change Image' : '📁 Upload Image'}
        </button>

        <div style={{ borderTop: '1px solid #222', paddingTop: 10, marginTop: 4 }}>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 8, fontWeight: 600 }}>ADD MARKERS</div>
          {ACTIVE_MARKER_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setAddingMarker((a) => a === type ? null : type)}
              style={{
                ...btnStyle,
                marginBottom: 4,
                borderColor: addingMarker === type ? MARKER_COLORS[type] : '#2a2a2a',
                color: addingMarker === type ? MARKER_COLORS[type] : '#888',
                background: addingMarker === type ? `${MARKER_COLORS[type]}11` : '#111',
              }}
            >
              {MARKER_ICONS[type]} {MARKER_LABELS[type]}
              {addingMarker === type && ' ✦'}
            </button>
          ))}
          {addingMarker && (
            <div style={{ fontSize: 10, color: '#FFD43B', marginTop: 4 }}>
              Click on the floor plan to place
            </div>
          )}
        </div>

        {/* Marker list */}
        <div style={{ borderTop: '1px solid #222', paddingTop: 10, flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6, fontWeight: 600 }}>PLACED MARKERS</div>
          {zone.floorMarkers.map((m) => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5,
              fontSize: 11, color: '#aaa',
            }}>
              <span style={{ fontSize: 14 }}>{MARKER_ICONS[m.type]}</span>
              <span style={{ flex: 1, color: MARKER_COLORS[m.type], fontSize: 10 }}>{MARKER_LABELS[m.type]}</span>
              <button
                onClick={() => store.removeMarker(zoneId, m.id)}
                style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: 12 }}
              >×</button>
            </div>
          ))}
          {zone.floorMarkers.length === 0 && (
            <div style={{ fontSize: 10, color: '#333' }}>No markers placed</div>
          )}
        </div>

        {/* Legend */}
        <div style={{ borderTop: '1px solid #222', paddingTop: 10 }}>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6, fontWeight: 600 }}>TECHNICAL LIST</div>
          {ACTIVE_MARKER_TYPES.map((type) => {
            const count = zone.floorMarkers.filter((m) => m.type === type).length;
            if (count === 0) return null;
            return (
              <div key={type} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>{MARKER_ICONS[type]}</span>
                <span style={{ fontSize: 11, color: MARKER_COLORS[type], flex: 1 }}>{MARKER_LABELS[type]}</span>
                <span style={{ fontSize: 10, color: '#555' }}>×{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          flex: 1, position: 'relative', overflow: 'hidden', background: '#0a0a0a',
          cursor: addingMarker ? 'crosshair' : 'default',
        }}
      >
        {floorPlan ? (
          <img
            src={floorPlan.imageDataUrl}
            alt="floor plan"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'contain',
              filter: imgFilter,
              userSelect: 'none', pointerEvents: 'none',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 12,
          }}>
            <div style={{ fontSize: 40, opacity: 0.2 }}>⚡</div>
            <div style={{ fontSize: 13, color: '#444' }}>Upload a floor plan image</div>
            <button onClick={() => setShowImageEditor(true)} style={{ ...btnStyle, fontSize: 12 }}>
              📁 Upload Image
            </button>
          </div>
        )}

        {/* Markers */}
        {zone.floorMarkers.map((marker) => (
          <MarkerPin
            key={marker.id}
            marker={marker}
            dragging={draggingMarkerId === marker.id}
            onMouseDown={(e) => handleMarkerMouseDown(e, marker.id)}
            onDelete={() => store.removeMarker(zoneId, marker.id)}
          />
        ))}
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

function MarkerPin({
  marker, dragging, onMouseDown, onDelete,
}: {
  marker: FloorMarker;
  dragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color = MARKER_COLORS[marker.type];

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        left: `${marker.x}%`,
        top: `${marker.y}%`,
        transform: 'translate(-50%, -50%)',
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        zIndex: dragging ? 100 : 20,
      }}
    >
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      }}>
        <div style={{
          background: '#0f0f0f', border: `2px solid ${color}`,
          borderRadius: 6, padding: '4px 8px',
          fontSize: 11, color,
          display: 'flex', alignItems: 'center', gap: 4,
          boxShadow: `0 0 10px ${color}66`,
          whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 14 }}>{MARKER_ICONS[marker.type]}</span>
          <span style={{ fontWeight: 700 }}>{MARKER_LABELS[marker.type]}</span>
          {hovered && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              style={{
                background: 'none', border: 'none', color: '#ff4444',
                cursor: 'pointer', fontSize: 13, padding: 0, marginLeft: 2, lineHeight: 1,
              }}
            >×</button>
          )}
        </div>
        <div style={{ width: 2, height: 8, background: color, borderRadius: 1 }} />
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: '#111', border: '1px solid #2a2a2a', borderRadius: 5,
  color: '#888', padding: '7px 10px', cursor: 'pointer', fontSize: 11,
  textAlign: 'left', fontFamily: 'inherit', transition: 'all 0.1s', width: '100%',
};
