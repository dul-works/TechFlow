import { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { exportToPPT } from '../../lib/pptExporter';

export default function ExportPanel() {
  const { project, exportJSON, importJSON } = useProjectStore();
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState('');

  const handleExportJSON = () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_project.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus('JSON exported!');
    setTimeout(() => setStatus(''), 2000);
  };

  const handleImportJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        importJSON(ev.target?.result as string);
        setStatus('Project loaded!');
        setTimeout(() => setStatus(''), 2000);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExportPPT = async () => {
    setExporting(true);
    setStatus('Generating PPTX...');
    try {
      await exportToPPT(project);
      setStatus('PPTX exported!');
    } catch (e) {
      console.error(e);
      setStatus('Export failed');
    } finally {
      setExporting(false);
      setTimeout(() => setStatus(''), 3000);
    }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '0 8px',
    }}>
      <button onClick={handleImportJSON} style={btnSecondary}>
        📂 Load JSON
      </button>
      <button onClick={handleExportJSON} style={btnSecondary}>
        💾 Save JSON
      </button>
      <button onClick={handleExportPPT} disabled={exporting} style={btnPrimary}>
        {exporting ? '⏳ Exporting...' : '📊 Export PPT'}
      </button>
      {status && (
        <span style={{ fontSize: 11, color: '#51CF66', marginLeft: 4 }}>{status}</span>
      )}
    </div>
  );
}

const btnBase: React.CSSProperties = {
  borderRadius: 5, padding: '5px 12px', cursor: 'pointer',
  fontSize: 11, fontFamily: 'inherit', fontWeight: 600,
  whiteSpace: 'nowrap', transition: 'all 0.1s',
};
const btnSecondary: React.CSSProperties = {
  ...btnBase, background: '#1a1a1a', color: '#aaa', border: '1px solid #2a2a2a',
};
const btnPrimary: React.CSSProperties = {
  ...btnBase, background: '#ffffff', color: '#000', border: 'none',
};
