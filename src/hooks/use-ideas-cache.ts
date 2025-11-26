
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { CACHE_KEYS } from '../lib/cache-keys';
import { CACHE_STRATEGIES } from '../lib/cache-config';
import { Idea, Project, Notification, ShowroomFilters } from '../types';

// --- IDEAS & SHOWROOM ---

export function useIdeas(filters?: ShowroomFilters & { userId?: string, favoriteIds?: string[], page?: number, pageSize?: number }) {
  return useQuery<{ data: Idea[], totalCount: number }>({
    queryKey: CACHE_KEYS.ideas.list(filters),
    queryFn: async () => {
      // Paginação
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 20;
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      let query = supabase
        .from('cached_ideas_with_stats')
        .select('*', { count: 'exact' });

      // Filtro de Showroom (Se true, traz apenas showroom. Se false/undefined, traz apenas ideias normais)
      if (filters?.onlyShowroom) {
        query = query.eq('is_showroom', true);
      } else {
        // Na aba de ideias, não queremos ver o que já virou projeto de showroom? 
        // Ou queremos ver tudo? Por padrão, vamos mostrar apenas ideias que NÃO são showroom na aba Ideias
        query = query.eq('is_showroom', false);
      }

      // Filtro por Categoria
      if (filters?.category && filters.category !== 'Todos') {
        query = query.eq('niche', filters.category);
      }

      // Busca (Search)
      if (filters?.search) {
        if (filters.onlyShowroom) {
          query = query.or(`title.ilike.%${filters.search}%,showroom_description.ilike.%${filters.search}%,short_id.ilike.%${filters.search}%`);
        } else {
          query = query.or(`title.ilike.%${filters.search}%,pain.ilike.%${filters.search}%,solution.ilike.%${filters.search}%,short_id.ilike.%${filters.search}%`);
        }
      }

      // Meus Projetos
      if (filters?.myProjects && filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      // Favoritos (A query .in é limitada, mas funciona bem para listas de favoritos < 1000)
      if (filters?.showFavorites && filters.favoriteIds && filters.favoriteIds.length > 0) {
        query = query.in('id', filters.favoriteIds);
      } else if (filters?.showFavorites && (!filters.favoriteIds || filters.favoriteIds.length === 0)) {
        // Se quer favoritos mas a lista está vazia, retorna nada
        return { data: [], totalCount: 0 };
      }

      // Ordenação
      if (filters?.sortBy === 'votes') {
        query = query.order('votes_count', { ascending: false });
      } else {
        // Default: Recent
        query = query.order('created_at', { ascending: false });
      }

      // Aplicar paginação
      query = query.range(start, end);

      const { data, error, count } = await query;
      if (error) throw error;

      const ideas = (data as any[]).map(i => ({
        ...i,
        idea_interested: [],
        idea_improvements: [],
        idea_transactions: [],
        payment_type: i.payment_type || 'free',
        profiles: {
          full_name: i.creator_name || 'Anônimo',
          avatar_url: i.creator_avatar
        }
      })) as Idea[];

      return {
        data: ideas,
        totalCount: count || 0
      };
    },
    ...CACHE_STRATEGIES.DYNAMIC,
  });
}

export function useIdeaDetail(ideaId: string) {
  const queryClient = useQueryClient();

  return useQuery<Idea>({
    queryKey: CACHE_KEYS.ideas.detail(ideaId),
    queryFn: async () => {
      // 1. Buscar dados principais da View
      const ideaQuery = supabase
        .from('cached_ideas_with_stats')
        .select('*')
        .eq('id', ideaId)
        .single();

      // 2. Buscar relações separadamente
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
    initialData: () => {
      // Tenta achar em cache de listagem geral (ideias ou showroom)
      if (!ideaId) return undefined;
      const allIdeas = queryClient.getQueryData<Idea[]>(CACHE_KEYS.ideas.list({}))
        || queryClient.getQueryData<Idea[]>(CACHE_KEYS.ideas.list({ onlyShowroom: true }));
      return allIdeas?.find((idea) => idea.id === ideaId);
    },
    enabled: !!ideaId && ideaId !== '', // CORREÇÃO: Só executa se tiver ID
    ...CACHE_STRATEGIES.DYNAMIC,
  });
}

// --- USER DATA ---

export function useUserInteractions(userId: string | undefined) {
  return useQuery<{ votes: Set<string>; favorites: Set<string>; interests: Set<string> }>({
    queryKey: ['user-interactions', userId],
    queryFn: async () => {
      if (!userId) return { votes: new Set<string>(), favorites: new Set<string>(), interests: new Set<string>() };

      const [votes, favs, interests] = await Promise.all([
        supabase.from('idea_votes').select('idea_id').eq('user_id', userId),
        supabase.from('favorites').select('idea_id').eq('user_id', userId),
        supabase.from('idea_interested').select('idea_id').eq('user_id', userId)
      ]);

      return {
        votes: new Set<string>(votes.data?.map((v: any) => v.idea_id)),
        favorites: new Set<string>(favs.data?.map((v: any) => v.idea_id)),
        interests: new Set<string>(interests.data?.map((v: any) => v.idea_id))
      };
    },
    enabled: !!userId,
    ...CACHE_STRATEGIES.STATIC
  });
}

// --- LEGACY PROJECTS (Manter para retrocompatibilidade se necessário, mas o Showroom agora usa useIdeas com flag) ---
export function useProjects() {
  return useQuery<Project[]>({
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
  return useQuery<Notification[]>({
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
    refetchInterval: 30000,
    ...CACHE_STRATEGIES.REALTIME
  });
}
