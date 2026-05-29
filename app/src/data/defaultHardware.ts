import type { HardwareTemplate, CableType } from '../types';

export const DEFAULT_HARDWARE: HardwareTemplate[] = [
  { id: 'wan',     name: 'WAN',     model: '', category: 'Network', defaultColor: '#51CF66', defaultResponsibility: 'local'  },
  { id: 'router',  name: 'Router',  model: '', category: 'Network', defaultColor: '#51CF66', defaultResponsibility: 'imfine' },
  { id: 'pc',      name: 'PC',      model: '', category: 'PC',      defaultColor: '#FF6B6B', defaultResponsibility: 'imfine' },
  { id: 'mini_pc', name: 'Mini PC', model: '', category: 'PC',      defaultColor: '#FF6B6B', defaultResponsibility: 'imfine' },
  { id: 'mobile',  name: 'Mobile',  model: '', category: 'Device',  defaultColor: '#CC5DE8', defaultResponsibility: 'imfine' },
  { id: 'display', name: 'Display', model: '', category: 'Display', defaultColor: '#4A9EFF', defaultResponsibility: 'local'  },
];

export const DEFAULT_CABLE_TYPES: CableType[] = [
  { id: 'utp',      name: 'UTP Cable',      color: '#74C0FC' },
  { id: 'wireless', name: 'Wireless (WiFi)', color: '#868E96', dashed: true },
  { id: 'hdmi',     name: 'HDMI Cable',      color: '#FFD43B' },
  { id: 'aux',      name: 'Aux Cable',       color: '#CC5DE8' },
  { id: 'usb',      name: 'USB Cable',       color: '#A9E34B' },
];

export const MARKER_LABELS: Record<string, string> = {
  '220v': '220V',
  'internet': 'Internet',
  'powerstrip': 'Power Strip',
  'usb_repeater': 'USB Repeater',
};

// Auto-assign colors from palette (for custom hardware without defaultColor)
const COLOR_PALETTE = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#82E0AA', '#F0B27A', '#AED6F1', '#FAD7A0', '#A3E4D7',
];

let colorIndex = 0;
export function getNextColor(): string {
  return COLOR_PALETTE[colorIndex++ % COLOR_PALETTE.length];
}
export function resetColorIndex() { colorIndex = 0; }
