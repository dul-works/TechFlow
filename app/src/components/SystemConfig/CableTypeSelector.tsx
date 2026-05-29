import { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import type { CableType } from '../../types';

interface Props {
  selected: CableType;
  onChange: (c: CableType) => void;
}

export default function CableTypeSelector({ selected, onChange }: Props) {
  const store = useProjectStore();
  const cableTypes = store.cableTypes;

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#74C0FC');
  const [newDashed, setNewDashed] = useState(false);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const newCable: CableType = {
      id: `cable_${Date.now()}`,
      name: newName.trim(),
      color: newColor,
      dashed: newDashed || undefined,
    };
    store.addCableType(newCable);
    onChange(newCable);
    setNewName('');
    setNewDashed(false);
    setShowForm(false);
  };

  return (
    <div style={{
      flexShrink: 0,
      background: '#111',
      borderBottom: '1px solid #222',
      padding: '5px 10px',
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      overflowX: 'auto',
      overflowY: 'hidden',
    }}>
      <span style={{
        fontSize: 10, color: '#555', marginRight: 6,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        Cable:
      </span>

      {cableTypes.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c)}
          title={c.name}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            flexShrink: 0,
            background: selected.id === c.id ? '#1e1e1e' : 'transparent',
            border: selected.id === c.id ? `1px solid ${c.color}` : '1px solid transparent',
            borderRadius: 4, padding: '3px 8px', cursor: 'pointer',
            transition: 'all 0.1s', fontFamily: 'inherit',
          }}
        >
          <div style={{
            width: 20, height: 2, flexShrink: 0,
            background: c.dashed ? 'transparent' : c.color,
            borderBottom: c.dashed ? `2px dashed ${c.color}` : undefined,
          }} />
          <span style={{
            fontSize: 10, whiteSpace: 'nowrap',
            color: selected.id === c.id ? c.color : '#666',
          }}>
            {c.name}
          </span>
        </button>
      ))}

      {/* Add cable button / inline form */}
      {showForm ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          flexShrink: 0, marginLeft: 6,
          background: '#1a1a1a', border: '1px solid #333',
          borderRadius: 4, padding: '3px 8px',
        }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Cable name"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowForm(false); }}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontSize: 10, width: 90, fontFamily: 'inherit',
            }}
          />
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            title="Cable color"
            style={{ width: 20, height: 20, border: 'none', padding: 0, background: 'none', cursor: 'pointer' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer', fontSize: 10, color: '#888', whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={newDashed}
              onChange={(e) => setNewDashed(e.target.checked)}
              style={{ cursor: 'pointer', margin: 0 }}
            />
            Dashed
          </label>
          <button
            onClick={handleAdd}
            style={{
              background: '#fff', color: '#000', border: 'none',
              borderRadius: 3, padding: '2px 6px', fontSize: 10,
              cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit',
            }}
          >Add</button>
          <button
            onClick={() => setShowForm(false)}
            style={{
              background: 'none', border: 'none', color: '#555',
              cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0,
            }}
          >×</button>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          title="Add cable type"
          style={{
            flexShrink: 0, marginLeft: 4,
            background: 'transparent', border: '1px dashed #333',
            borderRadius: 4, color: '#555', padding: '3px 8px',
            cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
            transition: 'all 0.1s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#888'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#555'; }}
        >+</button>
      )}
    </div>
  );
}
