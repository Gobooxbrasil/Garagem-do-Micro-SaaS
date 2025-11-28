import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { Improvement } from '../types';
import { CACHE_KEYS } from '../lib/cache-keys';

/**
 * Hook to fetch comments for an idea
 */
export function useComments(ideaId: string | undefined) {
    return useQuery<Improvement[]>({
        queryKey: ['comments', ideaId],
        queryFn: async () => {
            if (!ideaId) return [];

            const { data, error } = await supabase
                .from('idea_improvements')
                .select('*, profiles(full_name, avatar_url)')
                .eq('idea_id', ideaId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data as Improvement[];
        },
        enabled: !!ideaId,
        staleTime: 30000, // 30 seconds
    });
}

/**
 * Hook to add a comment or reply
 */
export function useAddComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            ideaId,
            userId,
            content,
            parentId
        }: {
            ideaId: string;
            userId: string;
            content: string;
            parentId?: string;
        }) => {
            // Insert comment
            const { data: newComment, error } = await supabase
                .from('idea_improvements')
                .insert({
                    idea_id: ideaId,
                    user_id: userId,
                    content: content,
                    parent_id: parentId || null
                })
                .select('*, profiles(full_name, avatar_url)')
                .single();

            if (error) throw error;

            // Get idea info for notification
            const { data: ideaData } = await supabase
                .from('ideas')
                .select('user_id, title')
                .eq('id', ideaId)
                .single();

            // Get sender profile for notification
            const { data: senderProfile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', userId)
                .single();

            // Create notification for idea owner (if not commenting on own idea)
            if (ideaData && ideaData.user_id !== userId) {
                await supabase.from('notifications').insert({
                    recipient_id: ideaData.user_id,
                    sender_id: userId,
                    type: parentId ? 'IMPROVEMENT_REPLY' : 'NEW_IMPROVEMENT',
                    payload: {
                        idea_id: ideaId,
                        idea_title: ideaData.title,
                        message: content.substring(0, 60) + (content.length > 60 ? '...' : ''),
                        user_name: senderProfile?.full_name || 'Alguém',
                        user_avatar: senderProfile?.avatar_url,
                        parent_id: parentId
                    }
                });
            }

            // If it's a reply, notify the parent comment author
            if (parentId) {
                const { data: parentComment } = await supabase
                    .from('idea_improvements')
                    .select('user_id')
                    .eq('id', parentId)
                    .single();

                if (parentComment && parentComment.user_id !== userId && parentComment.user_id !== ideaData?.user_id) {
                    await supabase.from('notifications').insert({
                        recipient_id: parentComment.user_id,
                        sender_id: userId,
                        type: 'IMPROVEMENT_REPLY',
                        payload: {
                            idea_id: ideaId,
                            idea_title: ideaData?.title || 'Ideia',
                            message: content.substring(0, 60) + (content.length > 60 ? '...' : ''),
                            user_name: senderProfile?.full_name || 'Alguém',
                            user_avatar: senderProfile?.avatar_url,
                            parent_id: parentId
                        }
                    });
                }
            }

            return newComment;
        },
        onSuccess: (newComment, variables) => {
            // Invalidate comments query to refetch
            queryClient.invalidateQueries({ queryKey: ['comments', variables.ideaId] });

            // Also invalidate idea detail cache
            queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.detail(variables.ideaId) });
        }
    });
}
