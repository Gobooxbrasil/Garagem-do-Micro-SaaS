
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { CACHE_KEYS } from '../lib/cache-keys';
import { CACHE_STRATEGIES } from '../lib/cache-config';
import { Idea } from '../types';

export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchIdeaDetail = async (ideaId: string) => {
    await queryClient.prefetchQuery({
      queryKey: CACHE_KEYS.ideas.detail(ideaId),
      queryFn: async () => {
        // 1. View Principal
        const ideaQuery = supabase
          .from('cached_ideas_with_stats')
          .select('*')
          .eq('id', ideaId)
          .single();

        // 2. Relações em Paralelo
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
      ...CACHE_STRATEGIES.DYNAMIC,
    });
  };

  return { prefetchIdeaDetail };
}
