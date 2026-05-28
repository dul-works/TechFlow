import { CABLE_TYPES } from '../../data/defaultHardware';

interface CableType { id: string; name: string; color: string; dashed?: boolean }

interface Props {
  selected: CableType;
  onChange: (c: CableType) => void;
}

export default function CableTypeSelector({ selected, onChange }: Props) {
  return (
    <div style={{
      position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
      zIndex: 10, display: 'flex', gap: 4, alignItems: 'center',
      background: '#111', border: '1px solid #2a2a2a', borderRadius: 8,
      padding: '5px 8px', boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    }}>
      <span style={{ fontSize: 10, color: '#555', marginRight: 4, whiteSpace: 'nowrap' }}>Cable:</span>
      {CABLE_TYPES.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c)}
          title={c.name}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: selected.id === c.id ? '#2a2a2a' : 'transparent',
            border: selected.id === c.id ? `1px solid ${c.color}` : '1px solid transparent',
            borderRadius: 4, padding: '3px 7px', cursor: 'pointer',
            transition: 'all 0.1s', fontFamily: 'inherit',
          }}
        >
          <div style={{
            width: 18, height: 2, borderRadius: 1,
            background: c.color,
            borderBottom: c.dashed ? `2px dashed ${c.color}` : undefined,
          }} />
          <span style={{ fontSize: 10, color: selected.id === c.id ? c.color : '#666', whiteSpace: 'nowrap' }}>
            {c.name}
          </span>
        </button>
      ))}
    </div>
  );
}
