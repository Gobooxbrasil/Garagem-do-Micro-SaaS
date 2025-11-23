
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
      // USAR VIEW MATERIALIZADA/CACHEADA
      let query = supabase
        .from('cached_ideas_with_stats')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.category && filters.category !== 'Todos') {
        query = query.eq('niche', filters.category);
      }
      
      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }
      if (filters?.userId) {
          query = query.eq('user_id', filters.userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Mapeamento para garantir compatibilidade com componentes que esperam arrays
      return (data as any[]).map(i => ({
          ...i,
          // Arrays vazios para listagem (não precisamos carregar tudo na lista)
          idea_interested: [],
          idea_improvements: [],
          idea_transactions: [],
          payment_type: i.payment_type || 'free',
          // Fallback para manter compatibilidade com código legado que busca em profiles
          profiles: {
            full_name: i.creator_name || 'Anônimo',
            avatar_url: i.creator_avatar
          }
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
      // 1. Buscar dados principais da View
      const ideaQuery = supabase
        .from('cached_ideas_with_stats')
        .select('*')
        .eq('id', ideaId)
        .single();

      // 2. Buscar relações separadamente (já que views nem sempre suportam deep joins automáticos)
      const improvementsQuery = supabase
        .from('idea_improvements')
        .select('*, profiles(full_name, avatar_url)')
        .eq('idea_id', ideaId)
        .order('created_at', { ascending: true });

      const interestedQuery = supabase
        .from('idea_interested')
        .select('*, profiles(full_name, avatar_url)')
        .eq('idea_id', ideaId);

      const transactionsQuery = supabase
        .from('idea_transactions')
        .select('*, profiles(full_name, avatar_url)')
        .eq('idea_id', ideaId);

      // Executar em paralelo
      const [ideaRes, improvementsRes, interestedRes, transactionsRes] = await Promise.all([
          ideaQuery,
          improvementsQuery,
          interestedQuery,
          transactionsQuery
      ]);

      if (ideaRes.error) throw ideaRes.error;

      const data = ideaRes.data;

      return {
          ...data,
          idea_interested: interestedRes.data || [],
          idea_improvements: improvementsRes.data || [],
          idea_transactions: transactionsRes.data || [],
          payment_type: data.payment_type || 'free',
          profiles: {
            full_name: data.creator_name || 'Anônimo',
            avatar_url: data.creator_avatar
          }
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
