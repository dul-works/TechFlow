import { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import type { Responsibility } from '../../types';

interface Props { zoneId: string }

interface HardwareRow {
  key: string;
  nodeId: string;
  name: string;
  model: string;
  quantity: number;
  responsibility: Responsibility;
  category: string;
  notes: string;
}

export default function HardwareListTable({ zoneId }: Props) {
  const store = useProjectStore();
  const zone = store.project.zones.find((z) => z.id === zoneId);
  const [activeTab, setActiveTab] = useState<Responsibility>('local');

  if (!zone) return null;

  // Aggregate hardware by name+model
  const rowMap: Record<string, HardwareRow> = {};
  zone.nodes.forEach((n) => {
    const key = `${n.data.name}__${n.data.model}`;
    if (rowMap[key]) {
      rowMap[key].quantity += n.data.quantity;
    } else {
      rowMap[key] = {
        key,
        nodeId: n.id,
        name: n.data.name,
        model: n.data.model,
        quantity: n.data.quantity,
        responsibility: n.data.responsibility,
        category: n.data.category,
        notes: n.data.notes ?? '',
      };
    }
  });

  const rows = Object.values(rowMap);
  const localRows = rows.filter((r) => r.responsibility === 'local');
  const imfineRows = rows.filter((r) => r.responsibility === 'imfine');

  const toggleResponsibility = (row: HardwareRow) => {
    const newR: Responsibility = row.responsibility === 'local' ? 'imfine' : 'local';
    // Update all nodes with this name+model
    zone.nodes
      .filter((n) => `${n.data.name}__${n.data.model}` === row.key)
      .forEach((n) => store.updateNode(zoneId, n.id, { responsibility: newR }));
  };

  const updateNotes = (row: HardwareRow, notes: string) => {
    zone.nodes
      .filter((n) => `${n.data.name}__${n.data.model}` === row.key)
      .forEach((n) => store.updateNode(zoneId, n.id, { notes }));
  };

  const displayRows = activeTab === 'local' ? localRows : imfineRows;
  const title = activeTab === 'local' ? 'HARDWARE LIST (LOCAL)' : 'HARDWARE LIST (I M FINE)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab header */}
      <div style={{ display: 'flex', borderBottom: '1px solid #222', gap: 2, padding: '0 20px' }}>
        {(['local', 'imfine'] as Responsibility[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '12px 16px',
              color: activeTab === tab ? '#fff' : '#555',
              fontSize: 12, fontWeight: activeTab === tab ? 700 : 400,
              borderBottom: activeTab === tab ? '2px solid #fff' : '2px solid transparent',
              fontFamily: 'inherit', letterSpacing: 0.3,
            }}
          >
            {tab === 'local' ? 'LOCAL' : 'I M FINE'}
            <span style={{ marginLeft: 6, fontSize: 10, color: activeTab === tab ? '#888' : '#333' }}>
              {tab === 'local' ? localRows.length : imfineRows.length}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>{title}</div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
            {zone.name} — {zone.nodes.length} hardware item{zone.nodes.length !== 1 ? 's' : ''}
          </div>
        </div>

        {displayRows.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: 200, gap: 8,
          }}>
            <div style={{ fontSize: 32, opacity: 0.2 }}>📦</div>
            <div style={{ color: '#444', fontSize: 12 }}>No hardware in this list</div>
            <div style={{ color: '#333', fontSize: 11 }}>
              Go to System Config and assign items to {activeTab === 'local' ? 'Local' : 'I M FINE'}
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Hardware', 'Model', 'EA', 'R&R', 'Remark', 'Move to'].map((h) => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '8px 10px', fontSize: 10,
                    color: '#555', fontWeight: 700, borderBottom: '1px solid #222',
                    letterSpacing: 0.5, textTransform: 'uppercase',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, i) => (
                <HardwareRow
                  key={row.key}
                  row={row}
                  zebra={i % 2 === 0}
                  onToggle={() => toggleResponsibility(row)}
                  onNotesChange={(notes) => updateNotes(row, notes)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary footer */}
      <div style={{
        borderTop: '1px solid #222', padding: '12px 20px',
        display: 'flex', gap: 24, fontSize: 11, color: '#555',
      }}>
        <span>LOCAL: <strong style={{ color: '#51CF66' }}>{localRows.length}</strong> items</span>
        <span>I M FINE: <strong style={{ color: '#FF6B6B' }}>{imfineRows.length}</strong> items</span>
        <span>Total: <strong style={{ color: '#fff' }}>{rows.length}</strong> items</span>
      </div>
    </div>
  );
}

function HardwareRow({
  row, zebra, onToggle, onNotesChange,
}: {
  row: HardwareRow;
  zebra: boolean;
  onToggle: () => void;
  onNotesChange: (notes: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(row.notes);

  return (
    <tr style={{ background: zebra ? '#111' : 'transparent' }}>
      <td style={cellStyle}>
        <span style={{ color: '#fff', fontWeight: 600 }}>{row.name}</span>
      </td>
      <td style={{ ...cellStyle, color: '#888' }}>{row.model || '—'}</td>
      <td style={{ ...cellStyle, color: '#ccc', textAlign: 'center' }}>{row.quantity}</td>
      <td style={cellStyle}>
        <span style={{
          fontSize: 10, padding: '2px 7px', borderRadius: 3,
          background: row.responsibility === 'imfine' ? '#FF6B6B22' : '#51CF6622',
          color: row.responsibility === 'imfine' ? '#FF6B6B' : '#51CF66',
          fontWeight: 700,
        }}>
          {row.responsibility === 'imfine' ? 'I M FINE' : 'Local'}
        </span>
      </td>
      <td style={{ ...cellStyle, color: '#666', minWidth: 120 }}>
        {editing ? (
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => { onNotesChange(notes); setEditing(false); }}
            autoFocus
            style={{
              background: '#222', border: '1px solid #444', borderRadius: 3,
              color: '#fff', padding: '2px 6px', fontSize: 11, outline: 'none',
              fontFamily: 'inherit', width: '100%',
            }}
          />
        ) : (
          <span
            onClick={() => setEditing(true)}
            style={{ cursor: 'text', minWidth: 60, display: 'block', color: notes ? '#888' : '#333' }}
          >
            {notes || 'Click to add...'}
          </span>
        )}
      </td>
      <td style={{ ...cellStyle, textAlign: 'center' }}>
        <button
          onClick={onToggle}
          title={`Move to ${row.responsibility === 'local' ? 'I M FINE' : 'Local'}`}
          style={{
            background: 'none', border: '1px solid #333', borderRadius: 4,
            color: '#555', cursor: 'pointer', padding: '3px 8px',
            fontSize: 10, fontFamily: 'inherit',
            transition: 'all 0.1s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#666'; e.currentTarget.style.color = '#aaa'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#555'; }}
        >→ {row.responsibility === 'local' ? 'I M FINE' : 'Local'}</button>
      </td>
    </tr>
  );
}

const cellStyle: React.CSSProperties = {
  padding: '9px 10px', borderBottom: '1px solid #1a1a1a',
  verticalAlign: 'middle',
};
