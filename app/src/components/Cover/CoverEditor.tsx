import { useProjectStore } from '../../store/projectStore';

export default function CoverEditor() {
  const { project, setProjectName, setProjectDate } = useProjectStore();

  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a0a0a', position: 'relative',
    }}>
      {/* Preview */}
      <div style={{
        width: 640, height: 360, background: '#0f0f0f',
        border: '1px solid #2a2a2a', borderRadius: 8,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
      }}>
        {/* Top white line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#fff' }} />

        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 11, color: '#555', letterSpacing: 3, marginBottom: 8, textTransform: 'uppercase' }}>
            System Configuration
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: -0.5, lineHeight: 1.2 }}>
            {project.name || 'Project Name'}
          </div>
          <div style={{ fontSize: 11, color: '#444', marginTop: 16 }}>{project.date}</div>
        </div>

        {/* Bottom zones */}
        {project.zones.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 20, left: 0, right: 0,
            display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', padding: '0 20px',
          }}>
            {project.zones.map((z) => (
              <div key={z.id} style={{
                fontSize: 9, color: '#666', padding: '3px 8px',
                border: '1px solid #2a2a2a', borderRadius: 3,
              }}>{z.name}</div>
            ))}
          </div>
        )}
      </div>

      {/* Edit panel */}
      <div style={{
        position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
        background: '#111', border: '1px solid #222', borderRadius: 8,
        padding: 16, width: 220, display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#888', letterSpacing: 1, textTransform: 'uppercase' }}>
          Project Info
        </div>
        <div>
          <label style={{ fontSize: 10, color: '#555', display: 'block', marginBottom: 4 }}>Project Name</label>
          <input
            value={project.name}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. ILP25 London"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ fontSize: 10, color: '#555', display: 'block', marginBottom: 4 }}>Date</label>
          <input
            type="date"
            value={project.date}
            onChange={(e) => setProjectDate(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 4,
  color: '#fff', padding: '6px 8px', fontSize: 12, outline: 'none',
  fontFamily: 'inherit', width: '100%',
};
