import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import type { FloorPlanSettings } from '../../types';

interface Props {
  onApply: (settings: FloorPlanSettings) => void;
  onCancel: () => void;
  initial?: FloorPlanSettings;
}

export default function ImageEditor({ onApply, onCancel, initial }: Props) {
  const [imageDataUrl, setImageDataUrl] = useState<string>(initial?.imageDataUrl ?? '');
  const [crop, setCrop] = useState<Crop>({
    unit: '%', x: 0, y: 0, width: 100, height: 100,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [opacity, setOpacity] = useState(initial?.opacity ?? 0.5);
  const [grayscale, setGrayscale] = useState(initial?.grayscale ?? true);
  const imgRef = useRef<HTMLImageElement>(null);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageDataUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleApply = useCallback(() => {
    if (!imageDataUrl) return;
    const cc = completedCrop;
    const img = imgRef.current;
    // Compute crop ratios
    let cropX = 0, cropY = 0, cropW = 1, cropH = 1;
    if (cc && img) {
      cropX = cc.x / img.naturalWidth;
      cropY = cc.y / img.naturalHeight;
      cropW = cc.width / img.naturalWidth;
      cropH = cc.height / img.naturalHeight;
    }
    onApply({
      imageDataUrl,
      opacity,
      grayscale,
      cropX,
      cropY,
      cropWidth: cropW || 1,
      cropHeight: cropH || 1,
    });
  }, [imageDataUrl, completedCrop, opacity, grayscale, onApply]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#1a1a1a', border: '1px solid #333', borderRadius: 12,
        padding: 24, maxWidth: 800, width: '90vw', maxHeight: '90vh',
        overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Floor Plan Image</div>

        {/* File picker */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          background: '#111', border: '1px dashed #333', borderRadius: 6,
          padding: '10px 14px', fontSize: 12, color: '#888',
        }}>
          <span>📁</span>
          {imageDataUrl ? 'Change image...' : 'Select image...'}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
        </label>

        {/* Preview with crop */}
        {imageDataUrl && (
          <div style={{ maxHeight: 400, overflow: 'auto', textAlign: 'center' }}>
            <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)}>
              <img
                ref={imgRef}
                src={imageDataUrl}
                alt="floor plan"
                style={{
                  maxWidth: '100%',
                  filter: grayscale ? `grayscale(1) opacity(${opacity})` : `opacity(${opacity})`,
                }}
              />
            </ReactCrop>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 11, color: '#888', width: 80 }}>Opacity</label>
            <input type="range" min={0.05} max={1} step={0.05}
              value={opacity} onChange={(e) => setOpacity(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#fff' }} />
            <span style={{ fontSize: 11, color: '#ccc', width: 40 }}>{Math.round(opacity * 100)}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 11, color: '#888', width: 80 }}>Grayscale</label>
            <button
              onClick={() => setGrayscale((g) => !g)}
              style={{
                background: grayscale ? '#fff' : '#222',
                color: grayscale ? '#000' : '#666',
                border: '1px solid #444', borderRadius: 4,
                padding: '4px 12px', cursor: 'pointer', fontSize: 11,
                fontFamily: 'inherit', fontWeight: 600,
              }}
            >{grayscale ? 'ON' : 'OFF'}</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={btnSecondary}>Cancel</button>
          <button onClick={handleApply} disabled={!imageDataUrl} style={btnPrimary}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  background: '#fff', color: '#000', border: 'none', borderRadius: 6,
  padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
  fontFamily: 'inherit',
};
const btnSecondary: React.CSSProperties = {
  background: 'transparent', color: '#aaa', border: '1px solid #333', borderRadius: 6,
  padding: '8px 20px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
};
