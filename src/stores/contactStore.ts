import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

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

interface MergeUndoPayload {
  deletedContact: Contact;
  deletedConnections: ConnectionData[];
  reassignedConnections: { id: string; oldContactId: string; newContactId: string }[];
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
  addContact: (contact: Omit<Contact, 'id' | 'createdAt'>, userId: string) => Promise<string | null>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  selectContact: (id: string | null) => void;
  setDrawerOpen: (open: boolean) => void;
  toggleFilter: (tag: string) => void;
  clearFilters: () => void;
  updateNodePosition: (id: string, x: number, y: number) => Promise<void>;
  setPendingConnection: (conn: { source: string; target: string } | null) => void;
  addConnection: (userId: string, contactAId: string, contactBId: string, relationshipType: string) => Promise<void>;
  deleteConnection: (connectionId: string) => Promise<void>;
  updateConnectionType: (connectionId: string, relationshipType: string) => Promise<void>;
  mergeContacts: (keepId: string, mergeId: string, userId: string) => Promise<MergeUndoPayload>;
  undoMerge: (payload: MergeUndoPayload, userId: string) => Promise<void>;
  mergeTag: (keepTag: string, mergeTag: string, userId: string) => Promise<string[]>;
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
        relationshipType: c.relationship_type || 'colleague',
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
      return data.id;
    }
    return null;
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

  updateNodePosition: async (id, x, y) => {
    set((state) => ({
      contacts: state.contacts.map((c) => c.id === id ? { ...c, nodePositionX: x, nodePositionY: y } : c),
    }));
    await supabase.from('contacts').update({ node_position_x: x, node_position_y: y } as any).eq('id', id);
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
          relationshipType: data.relationship_type || 'colleague',
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

  updateConnectionType: async (connectionId, relationshipType) => {
    await supabase.from('connections').update({ relationship_type: relationshipType } as any).eq('id', connectionId);
    set((state) => ({
      connections: state.connections.map((c) =>
        c.id === connectionId ? { ...c, relationshipType } : c
      ),
    }));
  },

  mergeContacts: async (keepId, mergeId, userId) => {
    const { contacts, connections } = get();
    const keepContact = contacts.find((c) => c.id === keepId)!;
    const mergeContact = contacts.find((c) => c.id === mergeId)!;

    const mergedTags = Array.from(new Set([...keepContact.categoryTags, ...mergeContact.categoryTags]));

    const mergedUpdates: Partial<Contact> = {
      categoryTags: mergedTags,
      company: keepContact.company || mergeContact.company,
      jobTitle: keepContact.jobTitle || mergeContact.jobTitle,
      location: keepContact.location || mergeContact.location,
      email: keepContact.email || mergeContact.email,
      phone: keepContact.phone || mergeContact.phone,
      notes: [keepContact.notes, mergeContact.notes].filter(Boolean).join('\n') || null,
      description: keepContact.description || mergeContact.description,
    };

    const mergeConnections = connections.filter(
      (c) => c.contactAId === mergeId || c.contactBId === mergeId
    );

    const undoPayload: MergeUndoPayload = {
      deletedContact: mergeContact,
      deletedConnections: mergeConnections,
      reassignedConnections: [],
    };

    for (const conn of mergeConnections) {
      const otherContactId = conn.contactAId === mergeId ? conn.contactBId : conn.contactAId;
      const alreadyExists = connections.some(
        (c) =>
          c.id !== conn.id &&
          ((c.contactAId === keepId && c.contactBId === otherContactId) ||
           (c.contactAId === otherContactId && c.contactBId === keepId))
      );

      if (alreadyExists || otherContactId === keepId) {
        await supabase.from('connections').delete().eq('id', conn.id);
      } else {
        const updateField = conn.contactAId === mergeId ? 'contact_a_id' : 'contact_b_id';
        await supabase.from('connections').update({ [updateField]: keepId } as any).eq('id', conn.id);
        undoPayload.reassignedConnections.push({
          id: conn.id,
          oldContactId: mergeId,
          newContactId: keepId,
        });
      }
    }

    await get().updateContact(keepId, mergedUpdates);

    await supabase.from('contacts').delete().eq('id', mergeId);
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== mergeId),
      connections: state.connections
        .filter((c) => !(c.contactAId === mergeId || c.contactBId === mergeId) || undoPayload.reassignedConnections.some((r) => r.id === c.id))
        .map((c) => {
          const reassigned = undoPayload.reassignedConnections.find((r) => r.id === c.id);
          if (reassigned) {
            return c.contactAId === mergeId
              ? { ...c, contactAId: keepId }
              : { ...c, contactBId: keepId };
          }
          return c;
        }),
    }));

    return undoPayload;
  },

  undoMerge: async (payload, userId) => {
    const c = payload.deletedContact;
    const { data } = await supabase.from('contacts').insert({
      id: c.id,
      user_id: userId,
      name: c.name,
      description: c.description || null,
      company: c.company || null,
      job_title: c.jobTitle || null,
      location: c.location || null,
      email: c.email || null,
      phone: c.phone || null,
      avatar_url: c.avatarUrl || null,
      gender: c.gender || null,
      notes: c.notes || null,
      source: c.source || 'manual',
      category_tags: c.categoryTags || [],
      relationship_strength: c.relationshipStrength ?? 50,
      node_position_x: c.nodePositionX,
      node_position_y: c.nodePositionY,
    } as any).select().single();

    if (data) {
      set((state) => ({ contacts: [...state.contacts, mapRow(data)] }));
    }

    for (const r of payload.reassignedConnections) {
      const field = r.oldContactId === payload.deletedContact.id ? 'contact_a_id' : 'contact_b_id';
      await supabase.from('connections').update({ [field]: r.oldContactId } as any).eq('id', r.id);
    }

    const reassignedIds = new Set(payload.reassignedConnections.map((r) => r.id));
    const toRecreate = payload.deletedConnections.filter((c) => !reassignedIds.has(c.id));
    for (const conn of toRecreate) {
      await supabase.from('connections').insert({
        user_id: userId,
        contact_a_id: conn.contactAId,
        contact_b_id: conn.contactBId,
        relationship_type: conn.relationshipType,
      }).select().single();
    }

    await get().fetchContacts(userId);
  },

  mergeTag: async (keepTag: string, mergeTag: string, userId: string) => {
    const { contacts } = get();
    const affectedIds: string[] = [];

    for (const contact of contacts) {
      if (contact.categoryTags.includes(mergeTag)) {
        const newTags = Array.from(new Set(
          contact.categoryTags.map((t) => t === mergeTag ? keepTag : t)
        ));
        await get().updateContact(contact.id, { categoryTags: newTags });
        affectedIds.push(contact.id);
      }
    }

    return affectedIds;
  },
}));
