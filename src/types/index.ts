export interface Contact {
  id: string;
  name: string;
  description?: string;
  company?: string;
  jobTitle?: string;
  location?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  gender?: string;
  notes?: string;
  source: 'manual' | 'voice' | 'photo' | 'import';
  categoryTags: string[];
  relationshipStrength: number;
  nodePositionX?: number;
  nodePositionY?: number;
  lastContactedAt?: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  aiGenerated: boolean;
}

export interface Connection {
  id: string;
  contactAId: string;
  contactBId: string;
  relationshipType: 'friend' | 'colleague' | 'mutual' | 'mentor';
}

export interface Reminder {
  id: string;
  contactId: string;
  message: string;
  dueAt: string;
  completed: boolean;
}

export interface Post {
  id: string;
  content: string;
  imageUrl?: string;
  postType: 'status' | 'poll' | 'event_invite';
  location?: string;
  visibilityTags: string[];
  expiresAt?: string;
  createdAt: string;
}

export type CategoryColor = {
  name: string;
  color: string;
  glow: string;
};

export const CATEGORY_COLORS: Record<string, CategoryColor> = {
  Friends: { name: 'Friends', color: 'hsl(330 81% 60%)', glow: 'var(--glow-pink)' },
  Work: { name: 'Work', color: 'hsl(217 91% 60%)', glow: 'var(--glow-blue)' },
  Hackathon: { name: 'Hackathon', color: 'hsl(271 91% 65%)', glow: 'var(--glow-purple)' },
  Investors: { name: 'Investors', color: 'hsl(38 92% 50%)', glow: 'var(--glow-amber)' },
  Family: { name: 'Family', color: 'hsl(142 71% 45%)', glow: 'var(--glow-green)' },
  Sports: { name: 'Sports', color: 'hsl(15 85% 55%)', glow: 'var(--glow-pink)' },
  Travel: { name: 'Travel', color: 'hsl(195 85% 50%)', glow: 'var(--glow-blue)' },
  Music: { name: 'Music', color: 'hsl(290 70% 55%)', glow: 'var(--glow-purple)' },
  Community: { name: 'Community', color: 'hsl(160 60% 45%)', glow: 'var(--glow-green)' },
  Neighbors: { name: 'Neighbors', color: 'hsl(45 80% 50%)', glow: 'var(--glow-amber)' },
  School: { name: 'School', color: 'hsl(200 75% 55%)', glow: 'var(--glow-blue)' },
};
