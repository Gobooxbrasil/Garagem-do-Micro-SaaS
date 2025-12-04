

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { CACHE_KEYS } from '../lib/cache-keys';
import { CACHE_STRATEGIES } from '../lib/cache-config';
import { Feedback, FeedbackComment, FeedbackType, FeedbackStatus } from '../types';

interface FeedbackFilters {
  type?: FeedbackType | 'all';
  status?: FeedbackStatus | 'all';
  sort?: 'votes' | 'recent' | 'priority';
}

// LIST
export function useFeedbackList(filters: FeedbackFilters) {
  return useQuery<Feedback[]>({
    queryKey: CACHE_KEYS.feedback.list(filters),
    queryFn: async () => {
      let query = supabase
        .from('feedback_with_stats') // View
        .select('*');

      if (filters.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.sort === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (filters.sort === 'priority') {
        query = query.order('priority_score', { ascending: false });
      } else {
        // Default: Votes
        query = query.order('votes_count', { ascending: false });
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching feedback:", error);
        // Fallback para tabela crua se a view não existir (evita crash total)
        if (error.code === '42P01') return [] as Feedback[];
        throw error;
      }
      return (data || []) as Feedback[];
    },
    ...CACHE_STRATEGIES.DYNAMIC
  });
}

// DETAIL
export function useFeedbackDetail(id: string) {
  return useQuery({
    queryKey: CACHE_KEYS.feedback.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('*, profiles(full_name, avatar_url)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return {
        ...data,
        creator_name: data.profiles?.full_name,
        creator_avatar: data.profiles?.avatar_url
      } as Feedback;
    },
    ...CACHE_STRATEGIES.DYNAMIC
  });
}

// COMMENTS
export function useFeedbackComments(id: string) {
  return useQuery({
    queryKey: CACHE_KEYS.feedback.comments(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback_comments')
        .select('*, profiles(full_name, avatar_url)')
        .eq('feedback_id', id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as FeedbackComment[];
    },
    ...CACHE_STRATEGIES.DYNAMIC
  });
}

// MUTATIONS

export function useCreateFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newFeedback: { type: string, title: string, description: string, user_id: string }) => {
      console.log("Attempting to insert feedback:", newFeedback);

      const { data, error } = await supabase.from('feedbacks').insert({
        ...newFeedback,
        status: 'pending',
        votes_count: 0,
        priority_score: 0
      }).select().single();

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.feedback.all });
    }
  });
}

export function useVoteFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ feedbackId, userId, hasVoted }: { feedbackId: string, userId: string, hasVoted: boolean }) => {
      if (hasVoted) {
        // Remove vote
        const { error } = await supabase.from('feedback_votes').delete().match({ feedback_id: feedbackId, user_id: userId });
        if (error) throw error;
      } else {
        // Add vote
        const { error } = await supabase.from('feedback_votes').insert({ feedback_id: feedbackId, user_id: userId });
        if (error) {
          // If 409 conflict, it means vote already exists - try to remove it instead
          if (error.code === '23505') {
            console.warn('Vote already exists, removing instead');
            const { error: deleteError } = await supabase.from('feedback_votes').delete().match({ feedback_id: feedbackId, user_id: userId });
            if (deleteError) throw deleteError;
          } else {
            throw error;
          }
        }
      }
    },
    onMutate: async ({ feedbackId, hasVoted }) => {
      // Optimistic Update
      await queryClient.cancelQueries({ queryKey: CACHE_KEYS.feedback.all });

      const updateLogic = (old: Feedback[] | undefined) => {
        if (!old) return [];
        return old.map(f => f.id === feedbackId ? {
          ...f,
          votes_count: hasVoted ? f.votes_count - 1 : f.votes_count + 1,
          hasVoted: !hasVoted
        } : f);
      };

      queryClient.setQueriesData({ queryKey: CACHE_KEYS.feedback.all }, (old: any) => updateLogic(old));

      return { feedbackId };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.feedback.all });
      queryClient.invalidateQueries({ queryKey: ['feedback_votes'] });
    }
  });
}

export function useAddFeedbackComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ feedbackId, userId, content }: { feedbackId: string, userId: string, content: string }) => {
      const { error } = await supabase.from('feedback_comments').insert({
        feedback_id: feedbackId,
        user_id: userId,
        content
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.feedback.comments(vars.feedbackId) });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.feedback.detail(vars.feedbackId) });
    }
  });
}

export function useUserFeedbackVotes(userId: string | undefined) {
  return useQuery({
    queryKey: ['feedback_votes', userId],
    queryFn: async () => {
      if (!userId) return new Set<string>();
      const { data } = await supabase.from('feedback_votes').select('feedback_id').eq('user_id', userId);
      return new Set<string>(data?.map((v: any) => v.feedback_id));
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false
  });
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (feedbackId: string) => {
      const { error } = await supabase
        .from('feedbacks')
        .delete()
        .eq('id', feedbackId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.feedback.all });
    }
  });
}