import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { CATEGORY_COLORS } from '@/types';

interface Contact {
  id: string;
  name: string;
  description?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  location?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  gender?: string | null;
  notes?: string | null;
  source: string;
  categoryTags: string[];
  relationshipStrength: number;
  nodePositionX?: number | null;
  nodePositionY?: number | null;
  lastContactedAt?: string | null;
  createdAt: string;
}

interface ConnectionData {
  id: string;
  contactAId: string;
  contactBId: string;
  relationshipType: string;
}

interface ContactStore {
  contacts: Contact[];
  connections: ConnectionData[];
  pendingConnection: { source: string; target: string } | null;
  selectedContactId: string | null;
  drawerOpen: boolean;
  activeFilters: string[];
  loading: boolean;
  fetchContacts: (userId: string) => Promise<void>;
  addContact: (contact: Omit<Contact, 'id' | 'createdAt'>, userId: string) => Promise<void>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  selectContact: (id: string | null) => void;
  setDrawerOpen: (open: boolean) => void;
  toggleFilter: (tag: string) => void;
  clearFilters: () => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
  setPendingConnection: (conn: { source: string; target: string } | null) => void;
  addConnection: (userId: string, contactAId: string, contactBId: string, relationshipType: string) => Promise<void>;
  deleteConnection: (connectionId: string) => Promise<void>;
}

const mapRow = (row: any): Contact => ({
  id: row.id,
  name: row.name,
  description: row.description,
  company: row.company,
  jobTitle: row.job_title,
  location: row.location,
  email: row.email,
  phone: row.phone,
  avatarUrl: row.avatar_url,
  gender: row.gender,
  notes: row.notes,
  source: row.source || 'manual',
  categoryTags: row.category_tags || [],
  relationshipStrength: row.relationship_strength ?? 50,
  nodePositionX: row.node_position_x,
  nodePositionY: row.node_position_y,
  lastContactedAt: row.last_contacted_at,
  createdAt: row.created_at,
});

export const useContactStore = create<ContactStore>((set, get) => ({
  contacts: [],
  connections: [],
  pendingConnection: null,
  selectedContactId: null,
  drawerOpen: false,
  activeFilters: [],
  loading: true,

  fetchContacts: async (userId: string) => {
    set({ loading: true });
    const [contactsRes, connectionsRes] = await Promise.all([
      supabase.from('contacts').select('*').eq('user_id', userId),
      supabase.from('connections').select('*').eq('user_id', userId),
    ]);

    set({
      contacts: (contactsRes.data || []).map(mapRow),
      connections: (connectionsRes.data || []).map((c: any) => ({
        id: c.id,
        contactAId: c.contact_a_id,
        contactBId: c.contact_b_id,
        relationshipType: c.relationship_type || 'mutual',
      })),
      loading: false,
    });
  },

  addContact: async (contact, userId) => {
    const { data, error } = await supabase.from('contacts').insert({
      user_id: userId,
      name: contact.name,
      description: contact.description || null,
      company: contact.company || null,
      job_title: contact.jobTitle || null,
      location: contact.location || null,
      email: contact.email || null,
      phone: contact.phone || null,
      avatar_url: contact.avatarUrl || null,
      gender: contact.gender || null,
      notes: contact.notes || null,
      source: contact.source || 'manual',
      category_tags: contact.categoryTags || [],
      relationship_strength: contact.relationshipStrength ?? 50,
      node_position_x: contact.nodePositionX ?? Math.random() * 600 - 300,
      node_position_y: contact.nodePositionY ?? Math.random() * 400 - 200,
    } as any).select().single();

    if (data) {
      set((state) => ({ contacts: [...state.contacts, mapRow(data)] }));
    }
  },

  updateContact: async (id, updates) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.company !== undefined) dbUpdates.company = updates.company;
    if (updates.jobTitle !== undefined) dbUpdates.job_title = updates.jobTitle;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.categoryTags !== undefined) dbUpdates.category_tags = updates.categoryTags;
    if (updates.relationshipStrength !== undefined) dbUpdates.relationship_strength = updates.relationshipStrength;
    if (updates.nodePositionX !== undefined) dbUpdates.node_position_x = updates.nodePositionX;
    if (updates.nodePositionY !== undefined) dbUpdates.node_position_y = updates.nodePositionY;

    await supabase.from('contacts').update(dbUpdates).eq('id', id);
    set((state) => ({
      contacts: state.contacts.map((c) => c.id === id ? { ...c, ...updates } : c),
    }));
  },

  deleteContact: async (id) => {
    await supabase.from('contacts').delete().eq('id', id);
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
      connections: state.connections.filter((conn) => conn.contactAId !== id && conn.contactBId !== id),
    }));
  },

  selectContact: (id) => set({ selectedContactId: id, drawerOpen: id !== null }),
  setDrawerOpen: (open) => set({ drawerOpen: open, selectedContactId: open ? undefined : null }),

  toggleFilter: (tag) => set((state) => ({
    activeFilters: state.activeFilters.includes(tag)
      ? state.activeFilters.filter((t) => t !== tag)
      : [...state.activeFilters, tag],
  })),

  clearFilters: () => set({ activeFilters: [] }),

  updateNodePosition: (id, x, y) => {
    set((state) => ({
      contacts: state.contacts.map((c) => c.id === id ? { ...c, nodePositionX: x, nodePositionY: y } : c),
    }));
    supabase.from('contacts').update({ node_position_x: x, node_position_y: y } as any).eq('id', id);
  },

  setPendingConnection: (conn) => set({ pendingConnection: conn }),

  addConnection: async (userId, contactAId, contactBId, relationshipType) => {
    const { data, error } = await supabase.from('connections').insert({
      user_id: userId,
      contact_a_id: contactAId,
      contact_b_id: contactBId,
      relationship_type: relationshipType,
    }).select().single();

    if (data) {
      set((state) => ({
        connections: [...state.connections, {
          id: data.id,
          contactAId: data.contact_a_id,
          contactBId: data.contact_b_id,
          relationshipType: data.relationship_type || 'mutual',
        }],
      }));
    }
  },

  deleteConnection: async (connectionId) => {
    await supabase.from('connections').delete().eq('id', connectionId);
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== connectionId),
    }));
  },
}));
