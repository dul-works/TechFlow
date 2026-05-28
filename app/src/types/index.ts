export type Responsibility = 'local' | 'imfine';

export interface HardwareBlockData {
  name: string;
  model: string;
  quantity: number;
  color: string;
  responsibility: Responsibility;
  category: string;
  notes?: string;
}

export interface HardwareNode {
  id: string;
  position: { x: number; y: number };
  data: HardwareBlockData;
}

export interface CableEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string | null;
  targetHandle: string | null;
  data: {
    type: string;
    color: string;
    label?: string;
    waypoints?: { x: number; y: number }[];
  };
}

export type MarkerType = '220v' | 'internet' | 'powerstrip' | 'usb_repeater';

export interface FloorMarker {
  id: string;
  x: number;
  y: number;
  type: MarkerType;
  label?: string;
}

export interface FloorPlanSettings {
  imageDataUrl: string;
  opacity: number;
  grayscale: boolean;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
}

export interface Zone {
  id: string;
  name: string;
  nodes: HardwareNode[];
  edges: CableEdge[];
  floorPlan?: FloorPlanSettings;
  floorMarkers: FloorMarker[];
  cableGuideNodePositions: Record<string, { x: number; y: number }>;
}

export interface Project {
  id: string;
  name: string;
  date: string;
  zones: Zone[];
  activeZoneId: string | null;
}

export interface HardwareTemplate {
  id: string;
  name: string;
  model: string;
  category: string;
  defaultColor?: string;
  defaultResponsibility: Responsibility;
}

export type PageType =
  | 'cover'
  | 'system_config'
  | 'cable_guide'
  | 'elec_network'
  | 'hw_list_local'
  | 'hw_list_imfine';
