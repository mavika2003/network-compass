import { getSunSize } from '@/components/mindmap/TagSunNode';

interface ContactInput {
  id: string;
  categoryTags: string[];
}

interface Position {
  x: number;
  y: number;
}

export interface SolarLayoutResult {
  contactPositions: Map<string, Position>;
  sunPositions: Map<string, Position>;
}

export function computeSolarLayout(contacts: ContactInput[]): SolarLayoutResult {
  const contactPositions = new Map<string, Position>();
  const sunPositions = new Map<string, Position>();

  // Group contacts by primary tag
  const groups = new Map<string, ContactInput[]>();
  for (const c of contacts) {
    const tag = c.categoryTags?.[0] || 'Default';
    if (!groups.has(tag)) groups.set(tag, []);
    groups.get(tag)!.push(c);
  }

  const sortedGroups = Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);
  const totalGroups = sortedGroups.length;

  // Scale big radius based on group count and largest sun size
  const maxSunSize = sortedGroups.length > 0 ? getSunSize(sortedGroups[0][1].length) : 140;
  const bigRadius = totalGroups <= 1 ? 0 : totalGroups === 2 ? 350 : Math.max(350, totalGroups * 140 + maxSunSize);

  sortedGroups.forEach(([tag, members], groupIdx) => {
    let sunX: number, sunY: number;

    if (totalGroups === 1) {
      sunX = 0;
      sunY = 0;
    } else if (totalGroups === 2) {
      sunX = groupIdx === 0 ? -bigRadius / 2 : bigRadius / 2;
      sunY = 0;
    } else {
      const angle = (groupIdx / totalGroups) * 2 * Math.PI - Math.PI / 2;
      sunX = bigRadius * Math.cos(angle);
      sunY = bigRadius * Math.sin(angle);
    }

    sunPositions.set(tag, { x: sunX, y: sunY });

    // Orbit radius scales with member count + sun size so planets don't overlap the sun
    const sunSize = getSunSize(members.length);
    const orbitRadius = Math.max(sunSize / 2 + 80, members.length * 40);
    members.forEach((contact, i) => {
      const planetAngle = (i / members.length) * 2 * Math.PI - Math.PI / 2;
      contactPositions.set(contact.id, {
        x: sunX + orbitRadius * Math.cos(planetAngle),
        y: sunY + orbitRadius * Math.sin(planetAngle),
      });
    });
  });

  return { contactPositions, sunPositions };
}
