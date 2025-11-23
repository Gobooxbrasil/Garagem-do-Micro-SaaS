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
      ...CACHE_STRATEGIES.DYNAMIC,
    });
  };

  return { prefetchIdeaDetail };
}