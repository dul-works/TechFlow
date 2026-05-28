import { memo, useState } from 'react';
import {
  type EdgeProps, getSmoothStepPath, EdgeLabelRenderer, BaseEdge, useReactFlow,
} from '@xyflow/react';

function CableEdgeComponent({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data, selected,
}: EdgeProps) {
  const d = data as { type: string; color: string; label?: string; dashed?: boolean } | undefined;
  const color = d?.color ?? '#ffffff';
  const [hovered, setHovered] = useState(false);
  const { deleteElements } = useReactFlow();

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
    borderRadius: 12,
  });

  const strokeWidth = selected || hovered ? 3 : 2;

  return (
    <>
      {/* Invisible wider hit area */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: 'pointer' }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth,
          strokeDasharray: d?.dashed ? '6 4' : undefined,
          opacity: selected || hovered ? 1 : 0.85,
        }}
        interactionWidth={0}
      />
      {(d?.type || d?.label) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: hovered || selected ? 'all' : 'none',
              zIndex: 10,
            }}
          >
            <div style={{
              background: '#0f0f0f',
              border: `1px solid ${color}`,
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 9,
              color,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              letterSpacing: 0.3,
              opacity: hovered || selected ? 1 : 0.6,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              {d?.type}
              {(hovered || selected) && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteElements({ edges: [{ id }] }); }}
                  style={{
                    background: 'none', border: 'none', color: '#ff4444',
                    cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 11,
                  }}
                >×</button>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(CableEdgeComponent);
