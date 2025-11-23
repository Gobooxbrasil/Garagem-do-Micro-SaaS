import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { CACHE_KEYS } from '../lib/cache-keys';
import { CACHE_STRATEGIES } from '../lib/cache-config';
import { Idea, Project, Notification, Improvement, Transaction } from '../types';

// --- IDEAS ---

export function useIdeas(filters?: { category?: string; search?: string; userId?: string }) {
  return useQuery({
    queryKey: CACHE_KEYS.ideas.list(filters),
    queryFn: async () => {
      // Tenta buscar da view materializada primeiro (se existisse no frontend, mas vamos usar a query otimizada)
      // Como o usuário mencionou cached_ideas_with_stats mas estamos no front, 
      // e o RLS pode impedir acesso direto a views se não configurado,
      // vamos manter a query robusta mas cacheada.
      
      let query = supabase
        .from('ideas') // Ou 'cached_ideas_with_stats' se configurado publicamente
        .select(`
            *, 
            profiles(full_name, avatar_url),
            idea_interested(id, user_id, created_at, profiles(full_name, avatar_url)),
            idea_improvements(id, user_id, content, created_at, parent_id, thread_level, profiles(full_name, avatar_url)),
            idea_transactions(id, user_id, transaction_type, amount, status, created_at, profiles(full_name, avatar_url))
        `)
        .order('created_at', { ascending: false });

      if (filters?.category && filters.category !== 'Todos') {
        query = query.eq('niche', filters.category);
      }
      // Filtro de busca é feito no client ou backend? Vamos fazer backend basic
      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }
      if (filters?.userId) {
          query = query.eq('user_id', filters.userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Processamento básico para garantir arrays
      return (data as any[]).map(i => ({
          ...i,
          idea_interested: i.idea_interested || [],
          idea_improvements: i.idea_improvements?.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || [],
          idea_transactions: i.idea_transactions || [],
          payment_type: i.payment_type || 'free'
      })) as Idea[];
    },
    ...CACHE_STRATEGIES.DYNAMIC,
  });
}

export function useIdeaDetail(ideaId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: CACHE_KEYS.ideas.detail(ideaId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ideas')
        .select(`
            *, 
            profiles(full_name, avatar_url),
            idea_interested(id, user_id, created_at, profiles(full_name, avatar_url)),
            idea_improvements(id, user_id, content, created_at, parent_id, thread_level, profiles(full_name, avatar_url)),
            idea_transactions(id, user_id, transaction_type, amount, status, created_at, profiles(full_name, avatar_url))
        `)
        .eq('id', ideaId)
        .single();
        
      if (error) throw error;
      return {
          ...data,
          idea_interested: data.idea_interested || [],
          idea_improvements: data.idea_improvements?.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || [],
          idea_transactions: data.idea_transactions || [],
          payment_type: data.payment_type || 'free'
      } as Idea;
    },
    // Usa dados da lista como placeholder enquanto carrega
    initialData: () => {
      const allIdeas = queryClient.getQueryData<Idea[]>(CACHE_KEYS.ideas.list({}));
      return allIdeas?.find((idea) => idea.id === ideaId);
    },
    ...CACHE_STRATEGIES.DYNAMIC,
  });
}

// --- USER DATA (VOTES, FAVS, ETC) ---

export function useUserInteractions(userId: string | undefined) {
    return useQuery({
        queryKey: ['user-interactions', userId],
        queryFn: async () => {
            if (!userId) return { votes: new Set(), favorites: new Set(), interests: new Set() };
            
            const [votes, favs, interests] = await Promise.all([
                supabase.from('idea_votes').select('idea_id').eq('user_id', userId),
                supabase.from('favorites').select('idea_id').eq('user_id', userId),
                supabase.from('idea_interested').select('idea_id').eq('user_id', userId)
            ]);

            return {
                votes: new Set(votes.data?.map((v: any) => v.idea_id)),
                favorites: new Set(favs.data?.map((v: any) => v.idea_id)),
                interests: new Set(interests.data?.map((v: any) => v.idea_id))
            };
        },
        enabled: !!userId,
        ...CACHE_STRATEGIES.STATIC
    });
}

// --- PROJECTS ---

export function useProjects() {
    return useQuery({
        queryKey: CACHE_KEYS.projects.list(),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('projects')
                .select(`*, reviews (*), profiles(full_name, avatar_url)`)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as Project[];
        },
        ...CACHE_STRATEGIES.STATIC
    });
}

// --- NOTIFICATIONS ---

export function useNotifications(userId: string | undefined) {
    return useQuery({
        queryKey: CACHE_KEYS.notifications.unread(userId || ''),
        queryFn: async () => {
            if (!userId) return [];
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('recipient_id', userId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as Notification[];
        },
        enabled: !!userId,
        refetchInterval: 30000, // Polling 30s
        ...CACHE_STRATEGIES.REALTIME
    });
}