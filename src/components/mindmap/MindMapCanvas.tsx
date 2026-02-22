import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ContactNode from './ContactNode';
import MindMapControls from './MindMapControls';
import { useContactStore } from '@/stores/contactStore';
import { CATEGORY_COLORS } from '@/types';
import type { ContactNodeData } from './ContactNode';

const nodeTypes = { contact: ContactNode };

const MindMapCanvas = () => {
  const contacts = useContactStore((s) => s.contacts);
  const connections = useContactStore((s) => s.connections);
  const updateNodePosition = useContactStore((s) => s.updateNodePosition);

  const initialNodes: Node[] = useMemo(
    () =>
      contacts.map((c) => ({
        id: c.id,
        type: 'contact',
        position: { x: c.nodePositionX ?? Math.random() * 600 - 300, y: c.nodePositionY ?? Math.random() * 400 - 200 },
        data: {
          contactId: c.id,
          name: c.name,
          company: c.company,
          jobTitle: c.jobTitle,
          avatarUrl: c.avatarUrl,
          categoryTags: c.categoryTags,
          relationshipStrength: c.relationshipStrength,
        } satisfies ContactNodeData,
      })),
    [contacts]
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      connections.map((conn, i) => ({
        id: `e-${i}`,
        source: conn.contactAId,
        target: conn.contactBId,
        animated: false,
        style: { stroke: 'hsl(240 14% 20%)', strokeWidth: 1.5 },
      })),
    [connections]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      updateNodePosition(node.id, node.position.x, node.position.y);
    },
    [updateNodePosition]
  );

  const getNodeColor = useCallback((n: Node) => {
    const data = n.data as unknown as ContactNodeData;
    const tag = data.categoryTags?.[0] || 'Default';
    const cat = CATEGORY_COLORS[tag] || CATEGORY_COLORS.Default;
    return cat.color;
  }, []);

  return (
    <div className="w-full h-full relative">
      <MindMapControls />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={30} size={1} color="hsl(240 14% 12%)" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={getNodeColor}
          maskColor="hsl(240 20% 4% / 0.8)"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
};

export default MindMapCanvas;
