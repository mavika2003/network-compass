import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface UserTag {
  id: string;
  name: string;
  color: string;
  aiGenerated: boolean;
}

interface TagStore {
  tags: UserTag[];
  loading: boolean;
  fetchTags: (userId: string) => Promise<void>;
  addTag: (name: string, color: string, userId: string) => Promise<void>;
  updateTag: (id: string, updates: Partial<Pick<UserTag, 'name' | 'color'>>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
}

export const useTagStore = create<TagStore>((set) => ({
  tags: [],
  loading: false,

  fetchTags: async (userId: string) => {
    set({ loading: true });
    const { data } = await supabase.from('tags').select('*').eq('user_id', userId);
    set({
      tags: (data || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        color: t.color || '#6366f1',
        aiGenerated: t.ai_generated || false,
      })),
      loading: false,
    });
  },

  addTag: async (name, color, userId) => {
    const { data } = await supabase
      .from('tags')
      .insert({ name, color, user_id: userId, ai_generated: false } as any)
      .select()
      .single();
    if (data) {
      set((s) => ({
        tags: [...s.tags, { id: data.id, name: data.name, color: data.color || '#6366f1', aiGenerated: false }],
      }));
    }
  },

  updateTag: async (id, updates) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    await supabase.from('tags').update(dbUpdates).eq('id', id);
    set((s) => ({
      tags: s.tags.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  deleteTag: async (id) => {
    await supabase.from('tags').delete().eq('id', id);
    set((s) => ({ tags: s.tags.filter((t) => t.id !== id) }));
  },
}));
