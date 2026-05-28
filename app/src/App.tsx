import { useProjectStore } from './store/projectStore';
import SystemConfigEditor from './components/SystemConfig/SystemConfigEditor';
import CableGuideEditor from './components/CableGuide/CableGuideEditor';
import ElecNetworkEditor from './components/ElecNetwork/ElecNetworkEditor';
import HardwareListTable from './components/HardwareList/HardwareListTable';
import CoverEditor from './components/Cover/CoverEditor';
import ZoneManager from './components/common/ZoneManager';
import ExportPanel from './components/Export/ExportPanel';

type PageId = 'cover' | 'system_config' | 'cable_guide' | 'elec_network' | 'hw_list';

const PAGE_NAV: { id: PageId; label: string; icon: string }[] = [
  { id: 'cover', label: 'Cover', icon: '📄' },
  { id: 'system_config', label: 'System Config', icon: '⚙️' },
  { id: 'cable_guide', label: 'Cable Guide', icon: '🔌' },
  { id: 'elec_network', label: 'Elec & Network', icon: '⚡' },
  { id: 'hw_list', label: 'Hardware List', icon: '📋' },
];

export default function App() {
  const { activePage, setActivePage, project } = useProjectStore();
  const activeZone = project.zones.find((z) => z.id === project.activeZoneId);
  const pageNeedsZone = activePage !== 'cover';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0f0f0f' }}>
      {/* Top bar */}
      <div style={{
        height: 44, flexShrink: 0, background: '#111', borderBottom: '1px solid #1e1e1e',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 12,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: 1, marginRight: 8, whiteSpace: 'nowrap' }}>
          I M FINE
          <span style={{ fontSize: 9, color: '#555', marginLeft: 6, fontWeight: 400 }}>SYSTEM GUIDE</span>
        </div>
        <div style={{ width: 1, height: 20, background: '#222' }} />
        <div style={{ fontSize: 12, color: '#888' }}>{project.name}</div>
        <div style={{ flex: 1 }} />
        <ExportPanel />
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left sidebar */}
        <div style={{
          width: 160, flexShrink: 0, background: '#0f0f0f',
          borderRight: '1px solid #1a1a1a',
          display: 'flex', flexDirection: 'column',
          padding: 12, gap: 2, overflowY: 'auto',
        }}>
          <div style={{ fontSize: 9, color: '#333', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
            Pages
          </div>
          {PAGE_NAV.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePage(p.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: activePage === p.id ? '#1e1e1e' : 'transparent',
                border: activePage === p.id ? '1px solid #2a2a2a' : '1px solid transparent',
                borderRadius: 5, padding: '7px 10px',
                color: activePage === p.id ? '#fff' : '#555',
                cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                textAlign: 'left', transition: 'all 0.1s',
              }}
              onMouseEnter={(e) => { if (activePage !== p.id) e.currentTarget.style.color = '#aaa'; }}
              onMouseLeave={(e) => { if (activePage !== p.id) e.currentTarget.style.color = '#555'; }}
            >
              <span style={{ fontSize: 14 }}>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}

          {pageNeedsZone && (
            <>
              <div style={{ borderTop: '1px solid #1a1a1a', margin: '10px -4px 8px', width: 'calc(100% + 8px)' }} />
              <div style={{ fontSize: 9, color: '#333', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                Zones
              </div>
              <ZoneManager />
            </>
          )}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activePage === 'cover' && <CoverEditor />}

          {activePage !== 'cover' && !activeZone && (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 12,
            }}>
              <div style={{ fontSize: 36, opacity: 0.3 }}>🗂</div>
              <div style={{ fontSize: 14, color: '#444' }}>No zone selected</div>
            </div>
          )}

          {activePage === 'system_config' && activeZone && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
              <SystemConfigEditor zoneId={activeZone.id} />
            </div>
          )}

          {activePage === 'cable_guide' && activeZone && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
              <CableGuideEditor zoneId={activeZone.id} />
            </div>
          )}

          {activePage === 'elec_network' && activeZone && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
              <ElecNetworkEditor zoneId={activeZone.id} />
            </div>
          )}

          {activePage === 'hw_list' && activeZone && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <HardwareListTable zoneId={activeZone.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
