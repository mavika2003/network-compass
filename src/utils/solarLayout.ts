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

  // Sort groups by size (largest first)
  const sortedGroups = Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);
  const totalGroups = sortedGroups.length;

  // Arrange suns in a large circle
  const bigRadius = Math.max(400, totalGroups * 150);

  sortedGroups.forEach(([tag, members], groupIdx) => {
    const angle = (groupIdx / totalGroups) * 2 * Math.PI - Math.PI / 2;
    const sunX = totalGroups === 1 ? 0 : bigRadius * Math.cos(angle);
    const sunY = totalGroups === 1 ? 0 : bigRadius * Math.sin(angle);

    sunPositions.set(tag, { x: sunX, y: sunY });

    // Place contacts in orbit around their sun
    const orbitRadius = Math.max(140, members.length * 30);
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
