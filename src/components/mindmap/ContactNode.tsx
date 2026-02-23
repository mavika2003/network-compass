import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { CATEGORY_COLORS } from '@/types';
import { useContactStore } from '@/stores/contactStore';

export interface ContactNodeData {
  contactId: string;
  name: string;
  company?: string;
  jobTitle?: string;
  avatarUrl?: string;
  categoryTags: string[];
  relationshipStrength: number;
  [key: string]: unknown;
}

const ContactNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as ContactNodeData;
  const { name, company, categoryTags, relationshipStrength, contactId } = nodeData;
  const selectContact = useContactStore((s) => s.selectContact);
  const activeFilters = useContactStore((s) => s.activeFilters);

  const primaryTag = categoryTags[0] || 'Default';
  const catColor = CATEGORY_COLORS[primaryTag] || CATEGORY_COLORS.Default;

  const isTop = relationshipStrength >= 85;
  const size = isTop ? 72 : 56;

  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const dimmed = activeFilters.length > 0 && !categoryTags.some((t) => activeFilters.includes(t));

  return (
    <div
      className="flex flex-col items-center gap-1.5 cursor-pointer group transition-opacity duration-200"
      style={{ opacity: dimmed ? 0.15 : 1 }}
      onClick={() => selectContact(contactId)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !rounded-full !border-2 !border-border !bg-secondary opacity-0 group-hover:opacity-100 !transition-opacity"
      />
      {nodeData.avatarUrl ? (
        <img
          src={nodeData.avatarUrl}
          alt={name}
          className={`rounded-full object-cover transition-all duration-200 group-hover:scale-110 ${isTop ? 'node-pulse node-float' : ''}`}
          style={{
            width: size,
            height: size,
            boxShadow: `0 0 ${isTop ? 20 : 10}px ${catColor.color}40`,
            border: `2px solid ${catColor.color}60`,
          }}
        />
      ) : (
        <div
          className={`rounded-full flex items-center justify-center font-semibold text-foreground transition-all duration-200 group-hover:scale-110 ${isTop ? 'node-pulse node-float' : ''}`}
          style={{
            width: size,
            height: size,
            fontSize: isTop ? 20 : 16,
            background: `linear-gradient(135deg, ${catColor.color}, hsl(var(--nm-elevated)))`,
            boxShadow: `0 0 ${isTop ? 20 : 10}px ${catColor.color}40`,
            border: `2px solid ${catColor.color}60`,
          }}
        >
          {initials}
        </div>
      )}
      <span className="text-xs font-medium text-foreground max-w-[80px] truncate text-center">
        {name}
      </span>
      {company && (
        <span className="text-[10px] text-muted-foreground max-w-[80px] truncate text-center -mt-1">
          {company}
        </span>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !rounded-full !border-2 !border-border !bg-secondary opacity-0 group-hover:opacity-100 !transition-opacity"
      />
    </div>
  );
});

ContactNode.displayName = 'ContactNode';
export default ContactNode;
