import { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';

export default function ZoneManager() {
  const { project, addZone, removeZone, renameZone, setActiveZone } = useProjectStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const startRename = (id: string, name: string) => {
    setEditing(id);
    setEditValue(name);
  };

  const commitRename = () => {
    if (editing && editValue.trim()) {
      renameZone(editing, editValue.trim());
    }
    setEditing(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {project.zones.map((zone) => (
        <div key={zone.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {editing === zone.id ? (
            <input
              value={editValue}
              autoFocus
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditing(null); }}
              style={{
                flex: 1, background: '#111', border: '1px solid #444', borderRadius: 4,
                color: '#fff', padding: '4px 7px', fontSize: 12, outline: 'none', fontFamily: 'inherit',
              }}
            />
          ) : (
            <button
              onClick={() => setActiveZone(zone.id)}
              onDoubleClick={() => startRename(zone.id, zone.name)}
              style={{
                flex: 1, background: project.activeZoneId === zone.id ? '#2a2a2a' : 'transparent',
                border: `1px solid ${project.activeZoneId === zone.id ? '#444' : '#1a1a1a'}`,
                borderRadius: 4, color: project.activeZoneId === zone.id ? '#fff' : '#888',
                padding: '5px 8px', cursor: 'pointer', fontSize: 12,
                textAlign: 'left', fontFamily: 'inherit',
                transition: 'all 0.1s',
              }}
              title="Double-click to rename"
            >
              {zone.name}
            </button>
          )}
          {project.zones.length > 1 && (
            <button
              onClick={() => removeZone(zone.id)}
              style={{
                background: 'none', border: 'none', color: '#333',
                cursor: 'pointer', fontSize: 14, padding: '0 3px',
                lineHeight: 1,
              }}
              title="Delete zone"
            >×</button>
          )}
        </div>
      ))}

      {adding ? (
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          <input
            value={newName}
            autoFocus
            placeholder="Zone name"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newName.trim()) { addZone(newName.trim()); setNewName(''); setAdding(false); }
              if (e.key === 'Escape') { setAdding(false); setNewName(''); }
            }}
            style={{
              flex: 1, background: '#111', border: '1px solid #444', borderRadius: 4,
              color: '#fff', padding: '4px 7px', fontSize: 12, outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button
            onClick={() => { if (newName.trim()) { addZone(newName.trim()); setNewName(''); setAdding(false); } }}
            style={{
              background: '#fff', color: '#000', border: 'none', borderRadius: 4,
              padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
            }}
          >+</button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{
            background: 'transparent', border: '1px dashed #2a2a2a', borderRadius: 4,
            color: '#444', padding: '5px', cursor: 'pointer', fontSize: 11,
            marginTop: 4, fontFamily: 'inherit', width: '100%',
            transition: 'all 0.1s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#888'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#444'; }}
        >+ New Zone</button>
      )}
    </div>
  );
}
