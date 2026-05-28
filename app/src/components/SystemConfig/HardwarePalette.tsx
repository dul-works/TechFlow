import { useState } from 'react';
import { DEFAULT_HARDWARE } from '../../data/defaultHardware';
import type { HardwareTemplate } from '../../types';

interface Props {
  onAddHardware: (template: HardwareTemplate) => void;
}

const CATEGORIES = ['All', 'Display', 'PC', 'Network', 'Controller', 'Tablet', 'Audio', 'Sensor', 'Peripheral', 'Server'];

export default function HardwarePalette({ onAddHardware }: Props) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [customCat, setCustomCat] = useState('Display');

  const filtered = DEFAULT_HARDWARE.filter((h) => {
    const matchCat = category === 'All' || h.category === category;
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.model.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1, textTransform: 'uppercase', padding: '0 2px' }}>
        Hardware
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        style={{
          background: '#111', border: '1px solid #333', borderRadius: 4,
          color: '#fff', padding: '5px 8px', fontSize: 12, outline: 'none',
        }}
      />

      {/* Category tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            style={{
              background: category === c ? '#333' : 'transparent',
              border: `1px solid ${category === c ? '#555' : '#2a2a2a'}`,
              borderRadius: 3,
              color: category === c ? '#fff' : '#666',
              padding: '2px 7px',
              fontSize: 10,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >{c}</button>
        ))}
      </div>

      {/* Hardware list */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.map((hw) => (
          <button
            key={hw.id}
            onClick={() => onAddHardware(hw)}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('hardwareTemplate', JSON.stringify(hw))}
            title={`${hw.name} — ${hw.model}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#111', border: '1px solid #2a2a2a',
              borderLeft: `3px solid ${hw.defaultColor ?? '#555'}`,
              borderRadius: 4, padding: '7px 8px',
              cursor: 'pointer', textAlign: 'left',
              transition: 'background 0.1s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1e1e1e')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#111')}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {hw.name}
              </div>
              <div style={{ fontSize: 10, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {hw.model}
              </div>
            </div>
            <div style={{
              fontSize: 9, color: hw.defaultResponsibility === 'imfine' ? '#FF6B6B' : '#51CF66',
              fontWeight: 700, opacity: 0.7,
            }}>
              {hw.defaultResponsibility === 'imfine' ? 'IMF' : 'LOC'}
            </div>
          </button>
        ))}
      </div>

      {/* Custom hardware */}
      <div style={{ borderTop: '1px solid #222', paddingTop: 8 }}>
        {showCustomForm ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input value={customName} onChange={(e) => setCustomName(e.target.value)}
              placeholder="Hardware name *"
              style={{ background: '#111', border: '1px solid #333', borderRadius: 4, color: '#fff', padding: '4px 8px', fontSize: 11, outline: 'none', fontFamily: 'inherit' }} />
            <input value={customModel} onChange={(e) => setCustomModel(e.target.value)}
              placeholder="Model name"
              style={{ background: '#111', border: '1px solid #333', borderRadius: 4, color: '#fff', padding: '4px 8px', fontSize: 11, outline: 'none', fontFamily: 'inherit' }} />
            <select value={customCat} onChange={(e) => setCustomCat(e.target.value)}
              style={{ background: '#111', border: '1px solid #333', borderRadius: 4, color: '#fff', padding: '4px 8px', fontSize: 11, outline: 'none', fontFamily: 'inherit' }}>
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => {
                  if (!customName.trim()) return;
                  onAddHardware({
                    id: `custom_${Date.now()}`,
                    name: customName.trim(),
                    model: customModel.trim(),
                    category: customCat,
                    defaultResponsibility: 'imfine',
                  });
                  setCustomName(''); setCustomModel(''); setShowCustomForm(false);
                }}
                style={{
                  flex: 1, background: '#ffffff', color: '#000', border: 'none',
                  borderRadius: 4, padding: '5px', fontSize: 11, cursor: 'pointer',
                  fontWeight: 700, fontFamily: 'inherit',
                }}
              >Add</button>
              <button
                onClick={() => setShowCustomForm(false)}
                style={{
                  flex: 1, background: '#222', color: '#aaa', border: '1px solid #333',
                  borderRadius: 4, padding: '5px', fontSize: 11, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomForm(true)}
            style={{
              width: '100%', background: '#111', border: '1px dashed #333',
              borderRadius: 4, color: '#555', padding: '6px', fontSize: 11,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#888'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#555'; }}
          >+ Custom Hardware</button>
        )}
      </div>
    </div>
  );
}
