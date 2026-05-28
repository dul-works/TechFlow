import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  Project, Zone, HardwareNode, CableEdge, FloorPlanSettings, FloorMarker, HardwareBlockData
} from '../types';
import { getNextColor } from '../data/defaultHardware';

let nodeCounter = 1;
let edgeCounter = 1;
let zoneCounter = 1;
let markerCounter = 1;

function genNodeId() { return `node_${nodeCounter++}`; }
function genEdgeId() { return `edge_${edgeCounter++}`; }
function genZoneId() { return `zone_${zoneCounter++}`; }
function genMarkerId() { return `marker_${markerCounter++}`; }

function createDefaultZone(name: string): Zone {
  return {
    id: genZoneId(),
    name,
    nodes: [],
    edges: [],
    floorMarkers: [],
    cableGuideNodePositions: {},
  };
}

interface ProjectStore {
  project: Project;
  activePage: string;

  // Project
  setProjectName: (name: string) => void;
  setProjectDate: (date: string) => void;

  // Zones
  addZone: (name: string) => void;
  removeZone: (zoneId: string) => void;
  renameZone: (zoneId: string, name: string) => void;
  setActiveZone: (zoneId: string) => void;
  activeZone: () => Zone | undefined;

  // Page navigation
  setActivePage: (page: string) => void;

  // Nodes
  addNode: (zoneId: string, node: Omit<HardwareNode, 'id'>) => string;
  updateNode: (zoneId: string, nodeId: string, data: Partial<HardwareBlockData>) => void;
  updateNodePosition: (zoneId: string, nodeId: string, position: { x: number; y: number }) => void;
  removeNode: (zoneId: string, nodeId: string) => void;
  setNodes: (zoneId: string, nodes: HardwareNode[]) => void;

  // Edges
  addEdge: (zoneId: string, edge: Omit<CableEdge, 'id'>) => string;
  updateEdge: (zoneId: string, edgeId: string, data: Partial<CableEdge['data']>) => void;
  removeEdge: (zoneId: string, edgeId: string) => void;
  setEdges: (zoneId: string, edges: CableEdge[]) => void;

  // Floor plan
  setFloorPlan: (zoneId: string, settings: FloorPlanSettings) => void;
  clearFloorPlan: (zoneId: string) => void;
  updateFloorPlan: (zoneId: string, partial: Partial<FloorPlanSettings>) => void;

  // Floor markers (E&N)
  addMarker: (zoneId: string, marker: Omit<FloorMarker, 'id'>) => void;
  removeMarker: (zoneId: string, markerId: string) => void;
  updateMarker: (zoneId: string, markerId: string, partial: Partial<FloorMarker>) => void;

  // Cable guide node positions
  setCableGuideNodePosition: (zoneId: string, nodeId: string, pos: { x: number; y: number }) => void;

  // Hardware color management
  colorMap: Record<string, string>;
  setNodeColor: (nodeId: string, color: string) => void;

  // Export / Import
  exportJSON: () => string;
  importJSON: (json: string) => void;
}

function getOrCreateColor(colorMap: Record<string, string>, id: string): string {
  if (!colorMap[id]) {
    colorMap[id] = getNextColor();
  }
  return colorMap[id];
}

export const useProjectStore = create<ProjectStore>()(
  subscribeWithSelector((set, get) => ({
    activePage: 'cover',
    colorMap: {},

    project: {
      id: 'proj_1',
      name: 'New Project',
      date: new Date().toISOString().split('T')[0],
      zones: [createDefaultZone('Zone 1')],
      activeZoneId: 'zone_1',
    },

    setProjectName: (name) =>
      set((s) => ({ project: { ...s.project, name } })),

    setProjectDate: (date) =>
      set((s) => ({ project: { ...s.project, date } })),

    addZone: (name) => {
      const zone = createDefaultZone(name);
      set((s) => ({
        project: {
          ...s.project,
          zones: [...s.project.zones, zone],
          activeZoneId: zone.id,
        },
      }));
    },

    removeZone: (zoneId) =>
      set((s) => {
        const zones = s.project.zones.filter((z) => z.id !== zoneId);
        return {
          project: {
            ...s.project,
            zones,
            activeZoneId: zones.length > 0 ? zones[0].id : null,
          },
        };
      }),

    renameZone: (zoneId, name) =>
      set((s) => ({
        project: {
          ...s.project,
          zones: s.project.zones.map((z) =>
            z.id === zoneId ? { ...z, name } : z
          ),
        },
      })),

    setActiveZone: (zoneId) =>
      set((s) => ({ project: { ...s.project, activeZoneId: zoneId } })),

    activeZone: () => {
      const { project } = get();
      return project.zones.find((z) => z.id === project.activeZoneId);
    },

    setActivePage: (page) => set({ activePage: page }),

    addNode: (zoneId, nodeData) => {
      const id = genNodeId();
      const colorMap = { ...get().colorMap };
      const color = nodeData.data.color || getOrCreateColor(colorMap, nodeData.data.name);
      const node: HardwareNode = { id, ...nodeData, data: { ...nodeData.data, color } };
      colorMap[id] = color;
      set((s) => ({
        colorMap,
        project: {
          ...s.project,
          zones: s.project.zones.map((z) =>
            z.id === zoneId ? { ...z, nodes: [...z.nodes, node] } : z
          ),
        },
      }));
      return id;
    },

    updateNode: (zoneId, nodeId, data) =>
      set((s) => ({
        project: {
          ...s.project,
          zones: s.project.zones.map((z) =>
            z.id === zoneId
              ? {
                  ...z,
                  nodes: z.nodes.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
                  ),
                }
              : z
          ),
        },
      })),

    updateNodePosition: (zoneId, nodeId, position) =>
      set((s) => ({
        project: {
          ...s.project,
          zones: s.project.zones.map((z) =>
            z.id === zoneId
              ? { ...z, nodes: z.nodes.map((n) => (n.id === nodeId ? { ...n, position } : n)) }
              : z
          ),
        },
      })),

    removeNode: (zoneId, nodeId) =>
      set((s) => ({
        project: {
          ...s.project,
          zones: s.project.zones.map((z) =>
            z.id === zoneId
              ? {
                  ...z,
                  nodes: z.nodes.filter((n) => n.id !== nodeId),
                  edges: z.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
                }
              : z
          ),
        },
      })),

    setNodes: (zoneId, nodes) =>
      set((s) => ({
        project: {
          ...s.project,
          zones: s.project.zones.map((z) => (z.id === zoneId ? { ...z, nodes } : z)),
        },
      })),

    addEdge: (zoneId, edgeData) => {
      const id = genEdgeId();
      const edge: CableEdge = { id, ...edgeData };
      set((s) => ({
        project: {
          ...s.project,
          zones: s.project.zones.map((z) =>
            z.id === zoneId ? { ...z, edges: [...z.edges, edge] } : z
          ),
        },
      }));
      return id;
    },

    updateEdge: (zoneId, edgeId, data) =>
      set((s) => ({
        project: {
          ...s.project,
          zones: s.project.zones.map((z) =>
            z.id === zoneId
              ? {
                  ...z,
                  edges: z.edges.map((e) =>
                    e.id === edgeId ? { ...e, data: { ...e.data, ...data } } : e
                  ),
                }
              : z
          ),
        },
      })),

    removeEdge: (zoneId, edgeId) =>
      set((s) => ({
        project: {
          ...s.project,
          zones: s.project.zones.map((z) =>
            z.id === zoneId ? { ...z, edges: z.edges.filter((e) => e.id !== edgeId) } : z
          ),
        },
      })),

    setEdges: (zoneId, edges) =>
      set((s) => ({
        project: {
          ...s.project,
          zones: s.project.zones.map((z) => (z.id === zoneId ? { ...z, edges } : z)),
        },
      })),

    setFloorPlan: (zoneId, settings) =>
      set((s) => ({
        project: {
          ...s.project,
          zones: s.project.zones.map((z) =>
            z.id === zoneId ? { ...z, floorPlan: settings } : z
          ),
        },
      })),

    clearFloorPlan: (zoneId) =>
      set((s) => ({
        project: {
          ...s.project,
          zones: s.project.zones.map((z) =>
            z.id === zoneId ? { ...z, floorPlan: undefined } : z
          ),
        },
      })),

    updateFloorPlan: (zoneId, partial) =>
      set((s) => ({
        project: {
          ...s.project,
          zones: s.project.zones.map((z) =>
            z.id === zoneId && z.floorPlan
              ? { ...z, floorPlan: { ...z.floorPlan, ...partial } }
              : z
          ),
        },
      })),

    addMarker: (zoneId, markerData) => {
      const marker: FloorMarker = { id: genMarkerId(), ...markerData };
      set((s) => ({
        project: {
          ...s.project,
          zones: s.project.zones.map((z) =>
            z.id === zoneId ? { ...z, floorMarkers: [...z.floorMarkers, marker] } : z
          ),
        },
      }));
    },

    removeMarker: (zoneId, markerId) =>
      set((s) => ({
        project: {
          ...s.project,
          zones: s.project.zones.map((z) =>
            z.id === zoneId
              ? { ...z, floorMarkers: z.floorMarkers.filter((m) => m.id !== markerId) }
              : z
          ),
        },
      })),

    updateMarker: (zoneId, markerId, partial) =>
      set((s) => ({
        project: {
          ...s.project,
          zones: s.project.zones.map((z) =>
            z.id === zoneId
              ? {
                  ...z,
                  floorMarkers: z.floorMarkers.map((m) =>
                    m.id === markerId ? { ...m, ...partial } : m
                  ),
                }
              : z
          ),
        },
      })),

    setCableGuideNodePosition: (zoneId, nodeId, pos) =>
      set((s) => ({
        project: {
          ...s.project,
          zones: s.project.zones.map((z) =>
            z.id === zoneId
              ? {
                  ...z,
                  cableGuideNodePositions: { ...z.cableGuideNodePositions, [nodeId]: pos },
                }
              : z
          ),
        },
      })),

    setNodeColor: (nodeId, color) =>
      set((s) => ({
        colorMap: { ...s.colorMap, [nodeId]: color },
        project: {
          ...s.project,
          zones: s.project.zones.map((z) => ({
            ...z,
            nodes: z.nodes.map((n) =>
              n.id === nodeId ? { ...n, data: { ...n.data, color } } : n
            ),
          })),
        },
      })),

    exportJSON: () => {
      const { project, colorMap } = get();
      return JSON.stringify({ project, colorMap }, null, 2);
    },

    importJSON: (json) => {
      try {
        const parsed = JSON.parse(json);
        if (parsed.project) {
          set({ project: parsed.project, colorMap: parsed.colorMap || {} });
        }
      } catch (e) {
        console.error('Failed to import JSON', e);
      }
    },
  }))
);
