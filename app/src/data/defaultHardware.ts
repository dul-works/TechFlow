import type { HardwareTemplate } from '../types';

export const DEFAULT_HARDWARE: HardwareTemplate[] = [
  // Displays
  { id: 'display_55', name: '55" Display', model: 'Samsung QB55R', category: 'Display', defaultColor: '#4A9EFF', defaultResponsibility: 'local' },
  { id: 'display_65', name: '65" Display', model: 'Samsung QB65R', category: 'Display', defaultColor: '#4A9EFF', defaultResponsibility: 'local' },
  { id: 'display_touch', name: '55" Touch Display', model: 'Samsung QMB55T', category: 'Display', defaultColor: '#4A9EFF', defaultResponsibility: 'local' },
  { id: 'led_wall', name: 'LED Wall', model: 'Custom LED Panel', category: 'Display', defaultColor: '#4A9EFF', defaultResponsibility: 'local' },
  // Computers
  { id: 'pc_nuc', name: 'PC', model: 'Intel NUC11PAHi50Z', category: 'PC', defaultColor: '#FF6B6B', defaultResponsibility: 'imfine' },
  { id: 'mini_pc', name: 'Mini PC', model: 'MSI Cubi N ADL', category: 'PC', defaultColor: '#FF6B6B', defaultResponsibility: 'imfine' },
  { id: 'mac_mini', name: 'Mac Mini', model: 'Apple Mac Mini M2', category: 'PC', defaultColor: '#FF6B6B', defaultResponsibility: 'imfine' },
  { id: 'macbook', name: 'MacBook Pro', model: 'Apple MacBook Pro 14"', category: 'PC', defaultColor: '#FF6B6B', defaultResponsibility: 'imfine' },
  // Network
  { id: 'router', name: 'Router', model: 'Asus GT-AX11000', category: 'Network', defaultColor: '#51CF66', defaultResponsibility: 'imfine' },
  { id: 'wan', name: 'WAN', model: 'ISP Provided', category: 'Network', defaultColor: '#51CF66', defaultResponsibility: 'local' },
  { id: 'switch', name: 'Network Switch', model: 'Netgear GS308', category: 'Network', defaultColor: '#51CF66', defaultResponsibility: 'imfine' },
  { id: 'galaxy_tab', name: 'Galaxy Tab', model: 'Samsung Galaxy S10+ 5G', category: 'Tablet', defaultColor: '#CC5DE8', defaultResponsibility: 'imfine' },
  // Controllers
  { id: 'led_controller', name: 'LED Controller', model: 'Custom LED Controller', category: 'Controller', defaultColor: '#FF922B', defaultResponsibility: 'imfine' },
  { id: 'media_server', name: 'Media Server', model: 'Custom Media Server', category: 'Server', defaultColor: '#F06595', defaultResponsibility: 'imfine' },
  // Peripherals
  { id: 'speaker', name: 'Speaker', model: 'Bose Companion', category: 'Audio', defaultColor: '#74C0FC', defaultResponsibility: 'local' },
  { id: 'sensor', name: 'Sensor', model: 'Custom Sensor Module', category: 'Sensor', defaultColor: '#A9E34B', defaultResponsibility: 'imfine' },
  { id: 'printer', name: 'Photo Printer', model: 'DNP DS620 EX', category: 'Peripheral', defaultColor: '#FFA94D', defaultResponsibility: 'imfine' },
  { id: 'keyboard', name: 'Keyboard & Mouse', model: 'Logitech K400+', category: 'Peripheral', defaultColor: '#868E96', defaultResponsibility: 'imfine' },
  // Content
  { id: 'contents_pc', name: 'Contents PC', model: 'Custom Contents PC', category: 'PC', defaultColor: '#FF6B6B', defaultResponsibility: 'imfine' },
  { id: 'server', name: 'Server', model: 'Custom Server', category: 'Server', defaultColor: '#F06595', defaultResponsibility: 'imfine' },
];

export const CABLE_TYPES = [
  { id: 'hdmi', name: 'HDMI Cable', color: '#FFD43B' },
  { id: 'utp', name: 'UTP Cable', color: '#74C0FC' },
  { id: 'usb', name: 'USB Cable', color: '#A9E34B' },
  { id: 'displayport', name: 'DisplayPort Cable', color: '#FFA94D' },
  { id: 'aux', name: 'Aux Cable', color: '#CC5DE8' },
  { id: 'power', name: 'Power Cable', color: '#FF6B6B' },
  { id: 'ethernet', name: 'Ethernet Cable', color: '#51CF66' },
  { id: 'wireless', name: 'Wireless (WiFi)', color: '#868E96', dashed: true },
  { id: 'direct', name: 'Direct Connect', color: '#ffffff' },
];

export const MARKER_LABELS: Record<string, string> = {
  '220v': '220V',
  'internet': 'Internet',
  'powerstrip': 'Powerstrip',
  'usb_repeater': 'USB Repeater',
};

// Auto-assign colors from a distinct palette
const COLOR_PALETTE = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#82E0AA', '#F0B27A', '#AED6F1', '#A9CCE3', '#FAD7A0',
  '#A3E4D7', '#D7BDE2', '#FDFEFE', '#F9E79F', '#A2D9CE',
];

let colorIndex = 0;
export function getNextColor(): string {
  return COLOR_PALETTE[colorIndex++ % COLOR_PALETTE.length];
}
export function resetColorIndex() { colorIndex = 0; }
