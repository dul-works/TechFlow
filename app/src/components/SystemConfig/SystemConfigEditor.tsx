import { useCallback, useRef, useState } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  addEdge, type Connection, type Edge, type Node, type ReactFlowInstance,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import HardwareNodeComponent from './HardwareNode';
import CableEdgeComponent from './CableEdge';
import HardwarePalette from './HardwarePalette';
import TechnicalList from './TechnicalList';
import CableTypeSelector from './CableTypeSelector';
import type { HardwareNode, CableEdge, HardwareBlockData } from '../../types';
import type { HardwareTemplate } from '../../types';
import { CABLE_TYPES, getNextColor } from '../../data/defaultHardware';
import { useProjectStore } from '../../store/projectStore';

const nodeTypes = { hardware: HardwareNodeComponent };
const edgeTypes = { cable: CableEdgeComponent };

const GRID_SIZE = 20;

interface Props {
  zoneId: string;
}

export default function SystemConfigEditor({ zoneId }: Props) {
  const store = useProjectStore();
  const zone = store.project.zones.find((z) => z.id === zoneId);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  // Convert store nodes/edges to React Flow format
  const toRFNodes = (nodes: HardwareNode[]): Node[] =>
    nodes.map((n) => ({
      id: n.id,
      type: 'hardware',
      position: n.position,
      data: n.data as unknown as Record<string, unknown>,
    }));

  const toRFEdges = (edges: CableEdge[]): Edge[] =>
    edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      type: 'cable',
      data: e.data as unknown as Record<string, unknown>,
    }));

  const [nodes, setNodes, onNodesChange] = useNodesState(toRFNodes(zone?.nodes ?? []));
  const [edges, setEdges, onEdgesChange] = useEdgesState(toRFEdges(zone?.edges ?? []));

  // Sync back to store on change
  const syncNodes = useCallback((updatedNodes: Node[]) => {
    const hwNodes: HardwareNode[] = updatedNodes.map((n) => ({
      id: n.id,
      position: n.position,
      data: n.data as unknown as HardwareBlockData,
    }));
    store.setNodes(zoneId, hwNodes);
  }, [zoneId, store]);

  const syncEdges = useCallback((updatedEdges: Edge[]) => {
    const cableEdges: CableEdge[] = updatedEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? null,
      targetHandle: e.targetHandle ?? null,
      data: e.data as unknown as CableEdge['data'],
    }));
    store.setEdges(zoneId, cableEdges);
  }, [zoneId, store]);

  const [selectedCableType, setSelectedCableType] = useState(CABLE_TYPES[0]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const onConnect = useCallback((params: Connection) => {
    const newEdge: Edge = {
      ...params,
      id: `edge_${Date.now()}`,
      type: 'cable',
      data: {
        type: selectedCableType.name,
        color: selectedCableType.color,
        dashed: (selectedCableType as { dashed?: boolean }).dashed ?? false,
      },
    };
    setEdges((eds) => {
      const updated = addEdge(newEdge, eds);
      syncEdges(updated);
      return updated;
    });
  }, [selectedCableType, setEdges, syncEdges]);

  const onNodesChangeSync = useCallback((changes: Parameters<typeof onNodesChange>[0]) => {
    onNodesChange(changes);
    setNodes((nds) => { syncNodes(nds); return nds; });
  }, [onNodesChange, setNodes, syncNodes]);

  const onEdgesChangeSync = useCallback((changes: Parameters<typeof onEdgesChange>[0]) => {
    onEdgesChange(changes);
    setEdges((eds) => { syncEdges(eds); return eds; });
  }, [onEdgesChange, setEdges, syncEdges]);

  const addHardwareToCanvas = useCallback((template: HardwareTemplate, pos?: { x: number; y: number }) => {
    const position = pos ?? {
      x: Math.round((200 + Math.random() * 300) / GRID_SIZE) * GRID_SIZE,
      y: Math.round((150 + Math.random() * 200) / GRID_SIZE) * GRID_SIZE,
    };
    const color = template.defaultColor ?? getNextColor();
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'hardware',
      position,
      data: {
        name: template.name,
        model: template.model,
        quantity: 1,
        color,
        responsibility: template.defaultResponsibility,
        category: template.category,
      } as unknown as Record<string, unknown>,
    };
    setNodes((nds) => {
      const updated = [...nds, newNode];
      syncNodes(updated);
      return updated;
    });
  }, [setNodes, syncNodes]);

  // Drop from palette
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData('hardwareTemplate');
    if (!raw) return;
    const template: HardwareTemplate = JSON.parse(raw);
    if (!rfInstance || !reactFlowWrapper.current) return;
    const rect = reactFlowWrapper.current.getBoundingClientRect();
    const pos = rfInstance.screenToFlowPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
    addHardwareToCanvas(template, {
      x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
    });
  }, [rfInstance, addHardwareToCanvas]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  if (!zone) return <div style={{ color: '#555', padding: 40 }}>Zone not found</div>;

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0 }}>
      {/* Left: Hardware Palette */}
      <div style={{
        width: 200, flexShrink: 0, padding: 12,
        background: '#111', borderRight: '1px solid #222',
        overflowY: 'auto',
      }}>
        <HardwarePalette onAddHardware={(t) => addHardwareToCanvas(t)} />
      </div>

      {/* Center: Canvas */}
      <div style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
        {/* Cable type selector */}
        <CableTypeSelector
          selected={selectedCableType}
          onChange={setSelectedCableType}
        />

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeSync}
          onEdgesChange={onEdgesChangeSync}
          onConnect={onConnect}
          onInit={setRfInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          snapToGrid
          snapGrid={[GRID_SIZE, GRID_SIZE]}
          defaultEdgeOptions={{ type: 'cable' }}
          fitView
          onNodeClick={(_, node) => { setSelectedNodeId(node.id); setSelectedEdgeId(null); }}
          onEdgeClick={(_, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null); }}
          onPaneClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null); }}
          style={{ background: '#0f0f0f' }}
          deleteKeyCode="Delete"
          multiSelectionKeyCode="Shift"
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={GRID_SIZE}
            size={1}
            color="#2a2a2a"
          />
          <Controls
            style={{
              background: '#1a1a1a', border: '1px solid #333',
              borderRadius: 6, overflow: 'hidden',
            }}
          />
          <MiniMap
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6 }}
            nodeColor={(n) => (n.data as unknown as HardwareBlockData).color ?? '#555'}
            maskColor="rgba(0,0,0,0.7)"
          />
        </ReactFlow>
      </div>

      {/* Right: Technical List */}
      <div style={{
        width: 220, flexShrink: 0, padding: 12,
        background: '#111', borderLeft: '1px solid #222',
        overflowY: 'auto',
      }}>
        <TechnicalList
          zone={zone}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
        />
      </div>
    </div>
  );
}
