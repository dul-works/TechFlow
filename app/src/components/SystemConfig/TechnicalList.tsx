import { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import type { Zone } from '../../types';
import { CABLE_TYPES } from '../../data/defaultHardware';
import { useProjectStore } from '../../store/projectStore';

interface Props {
  zone: Zone;
  selectedNodeId?: string | null;
  selectedEdgeId?: string | null;
}

export default function TechnicalList({ zone, selectedNodeId, selectedEdgeId }: Props) {
  const { updateNode, project } = useProjectStore();
  const [colorPickerTarget, setColorPickerTarget] = useState<string | null>(null);
  const [localColor, setLocalColor] = useState('#ffffff');

  const selectedNode = selectedNodeId ? zone.nodes.find(n => n.id === selectedNodeId) : null;
  const selectedEdge = selectedEdgeId ? zone.edges.find(e => e.id === selectedEdgeId) : null;

  // Unique hardware types
  const uniqueHardware = Object.values(
    zone.nodes.reduce<Record<string, { name: string; model: string; color: string; count: number; id: string }>>((acc, n) => {
      const key = `${n.data.name}__${n.data.model}`;
      if (!acc[key]) acc[key] = { name: n.data.name, model: n.data.model, color: n.data.color, count: 0, id: n.id };
      acc[key].count++;
      return acc;
    }, {})
  );

  // Unique cable types
  const uniqueCables = Object.values(
    zone.edges.reduce<Record<string, { type: string; color: string; count: number; id: string }>>((acc, e) => {
      const key = e.data.type;
      if (!acc[key]) acc[key] = { type: e.data.type, color: e.data.color, count: 0, id: e.id };
      acc[key].count++;
      return acc;
    }, {})
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1, textTransform: 'uppercase' }}>
        Technical List
      </div>

      {/* Hardware items */}
      {uniqueHardware.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6, fontWeight: 600 }}>HARDWARE</div>
          {uniqueHardware.map((hw) => (
            <div key={hw.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <div
                onClick={() => {
                  setColorPickerTarget(`hw_${hw.id}`);
                  setLocalColor(hw.color);
                }}
                style={{
                  width: 14, height: 14, borderRadius: 3,
                  background: hw.color, cursor: 'pointer', flexShrink: 0,
                  border: colorPickerTarget === `hw_${hw.id}` ? '2px solid #fff' : '1px solid #444',
                }}
              />
              <div style={{ flex: 1, fontSize: 11, color: '#ccc' }}>
                {hw.name}
                {hw.count > 1 && <span style={{ color: '#555', marginLeft: 3 }}>×{hw.count}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cable items */}
      {uniqueCables.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 6, fontWeight: 600 }}>CABLES</div>
          {uniqueCables.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <div style={{ width: 20, height: 2, background: c.color, flexShrink: 0, borderRadius: 1 }} />
              <div style={{ flex: 1, fontSize: 11, color: '#ccc' }}>
                {c.type}
                {c.count > 1 && <span style={{ color: '#555', marginLeft: 3 }}>×{c.count}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Node inspector */}
      {selectedNode && (
        <div style={{ borderTop: '1px solid #222', paddingTop: 10 }}>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 8, fontWeight: 600 }}>EDIT HARDWARE</div>
          <NodeEditor node={selectedNode} zoneId={project.activeZoneId!} />
        </div>
      )}

      {/* Edge inspector */}
      {selectedEdge && (
        <div style={{ borderTop: '1px solid #222', paddingTop: 10 }}>
          <div style={{ fontSize: 10, color: '#555', marginBottom: 8, fontWeight: 600 }}>EDIT CABLE</div>
          <EdgeEditor edge={selectedEdge} zoneId={project.activeZoneId!} />
        </div>
      )}

      {/* Color picker popup */}
      {colorPickerTarget && (
        <div style={{
          position: 'fixed', top: 100, right: 280, zIndex: 1000,
          background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: 12,
        }}>
          <HexColorPicker color={localColor} onChange={setLocalColor} />
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <input
              value={localColor}
              onChange={(e) => setLocalColor(e.target.value)}
              style={{
                flex: 1, background: '#111', border: '1px solid #333', borderRadius: 4,
                color: '#fff', padding: '4px 6px', fontSize: 11, outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={() => {
                if (colorPickerTarget.startsWith('hw_')) {
                  const nodeId = colorPickerTarget.replace('hw_', '');
                  updateNode(project.activeZoneId!, nodeId, { color: localColor });
                }
                setColorPickerTarget(null);
              }}
              style={{
                background: localColor, border: 'none', borderRadius: 4,
                padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                color: '#000', fontFamily: 'inherit',
              }}
            >OK</button>
          </div>
          <button
            onClick={() => setColorPickerTarget(null)}
            style={{ marginTop: 6, width: '100%', background: 'transparent', border: 'none', color: '#555', cursor: 'pointer', fontSize: 10 }}
          >Close</button>
        </div>
      )}

      {zone.nodes.length === 0 && zone.edges.length === 0 && (
        <div style={{ fontSize: 11, color: '#444', textAlign: 'center', marginTop: 20 }}>
          Add hardware blocks to see the technical list
        </div>
      )}
    </div>
  );
}

function NodeEditor({ node, zoneId }: { node: Zone['nodes'][0]; zoneId: string }) {
  const { updateNode } = useProjectStore();
  const [name, setName] = useState(node.data.name);
  const [model, setModel] = useState(node.data.model);
  const [qty, setQty] = useState(node.data.quantity);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 10, color: '#555' }}>Name</label>
      <input value={name} onChange={(e) => setName(e.target.value)}
        onBlur={() => updateNode(zoneId, node.id, { name })}
        style={inputStyle} />
      <label style={{ fontSize: 10, color: '#555' }}>Model</label>
      <input value={model} onChange={(e) => setModel(e.target.value)}
        onBlur={() => updateNode(zoneId, node.id, { model })}
        style={inputStyle} />
      <label style={{ fontSize: 10, color: '#555' }}>Quantity</label>
      <input type="number" value={qty} min={1}
        onChange={(e) => { const v = Number(e.target.value); setQty(v); updateNode(zoneId, node.id, { quantity: v }); }}
        style={inputStyle} />
      <label style={{ fontSize: 10, color: '#555' }}>Responsibility</label>
      <select value={node.data.responsibility}
        onChange={(e) => updateNode(zoneId, node.id, { responsibility: e.target.value as 'local' | 'imfine' })}
        style={{ ...inputStyle, cursor: 'pointer' }}>
        <option value="imfine">I M FINE</option>
        <option value="local">Local</option>
      </select>
    </div>
  );
}

function EdgeEditor({ edge, zoneId }: { edge: Zone['edges'][0]; zoneId: string }) {
  const { updateEdge } = useProjectStore();
  const [color, setColor] = useState(edge.data.color);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 10, color: '#555' }}>Cable Type</label>
      <select value={edge.data.type}
        onChange={(e) => {
          const found = CABLE_TYPES.find(c => c.name === e.target.value);
          updateEdge(zoneId, edge.id, { type: e.target.value, color: found?.color ?? edge.data.color });
        }}
        style={{ ...inputStyle, cursor: 'pointer' }}>
        {CABLE_TYPES.map((c) => <option key={c.id}>{c.name}</option>)}
      </select>
      <label style={{ fontSize: 10, color: '#555' }}>Color</label>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input type="color" value={color} onChange={(e) => { setColor(e.target.value); updateEdge(zoneId, edge.id, { color: e.target.value }); }}
          style={{ width: 30, height: 26, padding: 2, background: 'none', border: 'none', cursor: 'pointer' }} />
        <input value={color} onChange={(e) => { setColor(e.target.value); updateEdge(zoneId, edge.id, { color: e.target.value }); }}
          style={inputStyle} />
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: '#111', border: '1px solid #333', borderRadius: 4,
  color: '#fff', padding: '4px 8px', fontSize: 11, outline: 'none',
  fontFamily: 'inherit', width: '100%',
};
