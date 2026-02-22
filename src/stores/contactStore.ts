import { create } from 'zustand';
import { Contact, CATEGORY_COLORS } from '@/types';

const DEMO_CONTACTS: Contact[] = [
  { id: '1', name: 'Priya Sharma', company: 'Sequoia Capital', jobTitle: 'Partner', location: 'San Francisco', email: 'priya@seq.com', categoryTags: ['Investors', 'Work'], relationshipStrength: 92, source: 'manual', nodePositionX: 0, nodePositionY: 0, createdAt: '2025-12-01' },
  { id: '2', name: 'Jake Morrison', company: 'Stripe', jobTitle: 'Engineer', location: 'NYC', email: 'jake@stripe.com', categoryTags: ['Work', 'Hackathon'], relationshipStrength: 78, source: 'voice', nodePositionX: 250, nodePositionY: -120, createdAt: '2026-01-10' },
  { id: '3', name: 'Sofia Chen', company: 'MIT', jobTitle: 'Student', location: 'Boston', categoryTags: ['Friends', 'Hackathon'], relationshipStrength: 85, source: 'manual', nodePositionX: -200, nodePositionY: -80, createdAt: '2025-11-15' },
  { id: '4', name: 'Marcus Williams', company: 'Google', jobTitle: 'PM', location: 'Seattle', email: 'marcus@google.com', categoryTags: ['Work'], relationshipStrength: 65, source: 'manual', nodePositionX: 300, nodePositionY: 150, createdAt: '2026-01-20' },
  { id: '5', name: 'Luna Park', jobTitle: 'Designer', location: 'LA', categoryTags: ['Friends'], relationshipStrength: 88, source: 'voice', nodePositionX: -280, nodePositionY: 130, createdAt: '2025-10-05' },
  { id: '6', name: 'Omar Hassan', company: 'YC', jobTitle: 'Fellow', location: 'SF', categoryTags: ['Investors', 'Hackathon'], relationshipStrength: 71, source: 'manual', nodePositionX: 150, nodePositionY: -250, createdAt: '2026-02-01' },
  { id: '7', name: 'Emily Zhang', company: 'Figma', jobTitle: 'Design Lead', location: 'SF', categoryTags: ['Work', 'Friends'], relationshipStrength: 95, source: 'manual', nodePositionX: -100, nodePositionY: 200, createdAt: '2025-09-20' },
  { id: '8', name: 'Mom', categoryTags: ['Family'], relationshipStrength: 100, source: 'manual', nodePositionX: -350, nodePositionY: -20, createdAt: '2025-01-01' },
  { id: '9', name: 'Dad', categoryTags: ['Family'], relationshipStrength: 100, source: 'manual', nodePositionX: -350, nodePositionY: 80, createdAt: '2025-01-01' },
  { id: '10', name: 'Aiden Brooks', company: 'TikTok', jobTitle: 'Growth', location: 'NYC', categoryTags: ['Work'], relationshipStrength: 55, source: 'manual', nodePositionX: 400, nodePositionY: 0, createdAt: '2026-02-10' },
  { id: '11', name: 'Zara Patel', company: 'Stanford', jobTitle: 'Researcher', location: 'Palo Alto', categoryTags: ['Hackathon', 'Friends'], relationshipStrength: 73, source: 'voice', nodePositionX: -50, nodePositionY: -200, createdAt: '2026-01-28' },
  { id: '12', name: 'Leo Tanaka', company: 'Netflix', jobTitle: 'SWE', location: 'LA', categoryTags: ['Work', 'Friends'], relationshipStrength: 60, source: 'manual', nodePositionX: 200, nodePositionY: 250, createdAt: '2026-02-15' },
];

const DEMO_CONNECTIONS = [
  { contactAId: '1', contactBId: '6' },
  { contactAId: '2', contactBId: '4' },
  { contactAId: '3', contactBId: '5' },
  { contactAId: '3', contactBId: '11' },
  { contactAId: '7', contactBId: '5' },
  { contactAId: '8', contactBId: '9' },
  { contactAId: '2', contactBId: '12' },
  { contactAId: '6', contactBId: '11' },
  { contactAId: '4', contactBId: '10' },
];

interface ContactStore {
  contacts: Contact[];
  connections: { contactAId: string; contactBId: string }[];
  selectedContactId: string | null;
  drawerOpen: boolean;
  activeFilters: string[];
  addContact: (contact: Omit<Contact, 'id' | 'createdAt'>) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  selectContact: (id: string | null) => void;
  setDrawerOpen: (open: boolean) => void;
  toggleFilter: (tag: string) => void;
  clearFilters: () => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
}

export const useContactStore = create<ContactStore>((set) => ({
  contacts: DEMO_CONTACTS,
  connections: DEMO_CONNECTIONS,
  selectedContactId: null,
  drawerOpen: false,
  activeFilters: [],

  addContact: (contact) => set((state) => ({
    contacts: [...state.contacts, {
      ...contact,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }],
  })),

  updateContact: (id, updates) => set((state) => ({
    contacts: state.contacts.map((c) => c.id === id ? { ...c, ...updates } : c),
  })),

  deleteContact: (id) => set((state) => ({
    contacts: state.contacts.filter((c) => c.id !== id),
    connections: state.connections.filter((conn) => conn.contactAId !== id && conn.contactBId !== id),
  })),

  selectContact: (id) => set({ selectedContactId: id, drawerOpen: id !== null }),
  setDrawerOpen: (open) => set({ drawerOpen: open, selectedContactId: open ? undefined : null }),

  toggleFilter: (tag) => set((state) => ({
    activeFilters: state.activeFilters.includes(tag)
      ? state.activeFilters.filter((t) => t !== tag)
      : [...state.activeFilters, tag],
  })),

  clearFilters: () => set({ activeFilters: [] }),

  updateNodePosition: (id, x, y) => set((state) => ({
    contacts: state.contacts.map((c) => c.id === id ? { ...c, nodePositionX: x, nodePositionY: y } : c),
  })),
}));
