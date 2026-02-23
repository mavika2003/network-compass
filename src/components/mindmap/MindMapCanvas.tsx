import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  BackgroundVariant,
  EdgeLabelRenderer,
  BaseEdge,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ContactNode from './ContactNode';
import TagSunNode, { getSunSize } from './TagSunNode';
import type { TagSunNodeData } from './TagSunNode';
import ConnectionTypeDialog from './ConnectionTypeDialog';
import MindMapControls from './MindMapControls';
import { useContactStore } from '@/stores/contactStore';
import { CATEGORY_COLORS } from '@/types';
import type { ContactNodeData } from './ContactNode';
import { computeSolarLayout } from '@/utils/solarLayout';
import { X } from 'lucide-react';

const EDGE_COLORS: Record<string, string> = {
  friend: 'hsl(330 81% 60%)',
  colleague: 'hsl(217 91% 60%)',
  mutual: 'hsl(215 16% 45%)',
  mentor: 'hsl(271 91% 65%)',
};

function RelationshipEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data } = props;
  const deleteConnection = useContactStore((s) => s.deleteConnection);
  const relType = (data?.relationshipType as string) || 'mutual';
  const isHighPriority = data?.isHighPriority as boolean;
  const color = EDGE_COLORS[relType] || EDGE_COLORS.mutual;

  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: isHighPriority ? 2 : 1.5,
          strokeOpacity: 0.4,
          strokeDasharray: isHighPriority ? '6 3' : undefined,
          animation: isHighPriority ? 'dashmove 0.5s linear infinite' : undefined,
          filter: `drop-shadow(0 0 2px ${color}40)`,
        }}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-auto absolute edge-label-wrapper"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
        >
          <div className="edge-label flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border border-border bg-card text-foreground shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
            {relType.charAt(0).toUpperCase() + relType.slice(1)}
            <button
              onClick={(e) => { e.stopPropagation(); deleteConnection(id.replace('conn-', '')); }}
              className="ml-1 text-muted-foreground hover:text-destructive"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const nodeTypes = { contact: ContactNode, tagSun: TagSunNode };
const edgeTypes = { relationship: RelationshipEdge };

const MindMapCanvas = () => {
  const contacts = useContactStore((s) => s.contacts);
  const connections = useContactStore((s) => s.connections);
  const updateNodePosition = useContactStore((s) => s.updateNodePosition);
  const setPendingConnection = useContactStore((s) => s.setPendingConnection);
  const [solarActive, setSolarActive] = useState(false);
  const [sunPositions, setSunPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const preLayoutPositions = useRef<Map<string, { x: number; y: number }>>(new Map());

  const applySolarLayout = useCallback(() => {
    // Save current positions before applying (only on first toggle)
    if (!solarActive) {
      const saved = new Map<string, { x: number; y: number }>();
      contacts.forEach((c) => {
        saved.set(c.id, { x: c.nodePositionX ?? 0, y: c.nodePositionY ?? 0 });
      });
      preLayoutPositions.current = saved;
    }

    const result = computeSolarLayout(contacts);
    result.contactPositions.forEach((pos, id) => {
      updateNodePosition(id, pos.x, pos.y);
    });
    setSunPositions(result.sunPositions);
    setSolarActive(true);
  }, [contacts, updateNodePosition, solarActive]);

  // Re-apply solar layout when contacts change while active
  useEffect(() => {
    if (!solarActive) return;
    const result = computeSolarLayout(contacts);
    result.contactPositions.forEach((pos, id) => {
      updateNodePosition(id, pos.x, pos.y);
    });
    setSunPositions(result.sunPositions);
  }, [contacts.length]); // Only re-layout when contacts are added/removed

  const resetLayout = useCallback(() => {
    preLayoutPositions.current.forEach((pos, id) => {
      updateNodePosition(id, pos.x, pos.y);
    });
    setSunPositions(new Map());
    setSolarActive(false);
  }, [updateNodePosition]);

  const buildSunNodes = useCallback((): Node[] => {
    if (!solarActive) return [];
    const groups = new Map<string, number>();
    contacts.forEach((c) => {
      const tag = c.categoryTags?.[0] || 'Default';
      groups.set(tag, (groups.get(tag) || 0) + 1);
    });
    return Array.from(sunPositions.entries()).map(([tag, pos]) => {
      const count = groups.get(tag) || 0;
      const size = getSunSize(count);
      const offset = size / 2;
      return {
        id: `sun-${tag}`,
        type: 'tagSun',
        position: { x: pos.x - offset, y: pos.y - offset },
        draggable: false,
        selectable: false,
        data: { tag, contactCount: count, size } satisfies TagSunNodeData,
      };
    });
  }, [solarActive, sunPositions, contacts]);

  const buildNodes = useCallback(
    (): Node[] => [
      ...buildSunNodes(),
      ...contacts.map((c, i) => ({
        id: c.id,
        type: 'contact',
        position: { x: c.nodePositionX ?? (i % 10) * 150 - 750, y: c.nodePositionY ?? Math.floor(i / 10) * 150 - 300 },
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
    ],
    [contacts, buildSunNodes]
  );

  const buildEdges = useCallback(
    (): Edge[] =>
      connections.map((conn) => {
        const contactA = contacts.find((c) => c.id === conn.contactAId);
        const contactB = contacts.find((c) => c.id === conn.contactBId);
        const isHighPriority = (contactA?.relationshipStrength ?? 0) > 80 && (contactB?.relationshipStrength ?? 0) > 80;

        return {
          id: `conn-${conn.id}`,
          source: conn.contactAId,
          target: conn.contactBId,
          type: 'relationship',
          data: { relationshipType: conn.relationshipType, isHighPriority },
        };
      }),
    [connections, contacts]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(buildNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges());

  useEffect(() => { setNodes(buildNodes()); }, [contacts, buildNodes, setNodes, solarActive, sunPositions]);
  useEffect(() => { setEdges(buildEdges()); }, [connections, contacts, buildEdges, setEdges]);

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => { updateNodePosition(node.id, node.position.x, node.position.y); },
    [updateNodePosition]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target && connection.source !== connection.target) {
        setPendingConnection({ source: connection.source, target: connection.target });
      }
    },
    [setPendingConnection]
  );

  const getNodeColor = useCallback((n: Node) => {
    const data = n.data as unknown as ContactNodeData;
    const tag = data.categoryTags?.[0] || 'Default';
    return (CATEGORY_COLORS[tag] || CATEGORY_COLORS.Default).color;
  }, []);

  return (
    <div className="w-full h-full relative">
      <MindMapControls
        onSolarLayout={applySolarLayout}
        onResetLayout={resetLayout}
        solarActive={solarActive}
      />
      <ConnectionTypeDialog />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={30} size={1} color="hsl(240 14% 12%)" />
        <Controls showInteractive={false} />
        <MiniMap nodeStrokeWidth={3} nodeColor={getNodeColor} maskColor="hsl(240 20% 4% / 0.8)" pannable zoomable />
      </ReactFlow>
    </div>
  );
};

export default MindMapCanvas;
