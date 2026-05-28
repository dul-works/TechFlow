import { memo, useState } from 'react';
import { Handle, Position, type NodeProps, useReactFlow } from '@xyflow/react';
import type { HardwareBlockData } from '../../types';

function HardwareNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as unknown as HardwareBlockData;
  const [hovered, setHovered] = useState(false);
  const { deleteElements } = useReactFlow();

  const handleSize = 10;
  const show = hovered || selected;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `2px solid ${selected ? '#ffffff' : d.color}`,
        background: selected ? `${d.color}22` : '#1a1a1a',
        borderRadius: 6,
        minWidth: 140,
        position: 'relative',
        cursor: 'grab',
        boxShadow: selected ? `0 0 0 2px ${d.color}44` : 'none',
        userSelect: 'none',
      }}
    >
      {/* Color bar top */}
      <div style={{ background: d.color, height: 4, borderRadius: '4px 4px 0 0' }} />

      {/* Content */}
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: d.color, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {d.category}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginTop: 2, lineHeight: 1.3 }}>
          {d.name}
          {d.quantity > 1 && (
            <span style={{ fontSize: 11, color: '#aaa', marginLeft: 4 }}>×{d.quantity}</span>
          )}
        </div>
        {d.model && (
          <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{d.model}</div>
        )}
      </div>

      {/* Responsibility badge */}
      <div style={{
        position: 'absolute', top: 6, right: 6,
        fontSize: 9, padding: '1px 5px', borderRadius: 3,
        background: d.responsibility === 'imfine' ? '#FF6B6B33' : '#51CF6633',
        color: d.responsibility === 'imfine' ? '#FF6B6B' : '#51CF66',
        fontWeight: 600, letterSpacing: 0.3,
        pointerEvents: 'none',
      }}>
        {d.responsibility === 'imfine' ? 'IMF' : 'LOCAL'}
      </div>

      {/* Delete button */}
      {show && (
        <button
          onClick={(e) => { e.stopPropagation(); deleteElements({ nodes: [{ id }] }); }}
          style={{
            position: 'absolute', top: -10, right: -10,
            width: 20, height: 20, borderRadius: '50%',
            background: '#ff4444', border: 'none', color: '#fff',
            fontSize: 12, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', lineHeight: 1,
            zIndex: 10,
          }}
          title="Delete"
        >×</button>
      )}

      {/* Handles — all 4 sides, source + target */}
      {[Position.Top, Position.Right, Position.Bottom, Position.Left].map((pos) => (
        <Handle
          key={`${pos}-src`}
          type="source"
          position={pos}
          id={`${pos}-src`}
          style={{
            width: handleSize, height: handleSize,
            background: d.color, border: '2px solid #0f0f0f',
            borderRadius: '50%',
            opacity: show ? 1 : 0,
            pointerEvents: show ? 'all' : 'none',
            transition: 'opacity 0.15s',
          }}
        />
      ))}
      {[Position.Top, Position.Right, Position.Bottom, Position.Left].map((pos) => (
        <Handle
          key={`${pos}-tgt`}
          type="target"
          position={pos}
          id={`${pos}-tgt`}
          style={{
            width: handleSize, height: handleSize,
            background: '#555', border: '2px solid #0f0f0f',
            borderRadius: '50%',
            opacity: show ? 1 : 0,
            pointerEvents: show ? 'all' : 'none',
            transition: 'opacity 0.15s',
          }}
        />
      ))}
    </div>
  );
}

export default memo(HardwareNodeComponent);
