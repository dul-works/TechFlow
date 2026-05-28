import { CABLE_TYPES } from '../../data/defaultHardware';

interface CableType { id: string; name: string; color: string; dashed?: boolean }

interface Props {
  selected: CableType;
  onChange: (c: CableType) => void;
}

export default function CableTypeSelector({ selected, onChange }: Props) {
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
      {CABLE_TYPES.map((c) => (
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
    </div>
  );
}
