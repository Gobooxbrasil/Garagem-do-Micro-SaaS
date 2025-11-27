
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { CACHE_KEYS } from '../lib/cache-keys';
import { Idea } from '../types';

export function useVoteIdea() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ideaId, userId }: { ideaId: string; userId: string }) => {
            // Verificar se já votou (prevenção de duplicatas)
            const { data: existingVote } = await supabase
                .from('idea_votes')
                .select('id')
                .eq('idea_id', ideaId)
                .eq('user_id', userId)
                .single();

            if (existingVote) {
                console.warn('User already voted on this idea');
                return; // Já votou, não faz nada
            }

            const { error } = await supabase.from('idea_votes').insert({ idea_id: ideaId, user_id: userId });
            if (error) throw error;
        },
        onMutate: async ({ ideaId, userId }) => {
            await queryClient.cancelQueries({ queryKey: CACHE_KEYS.ideas.all });

            // Atualiza listas
            queryClient.setQueriesData({ queryKey: CACHE_KEYS.ideas.all }, (oldData: any) => {
                if (!oldData) return oldData;
                // Handle new structure: { data: Idea[], totalCount: number }
                if (oldData.data && Array.isArray(oldData.data)) {
                    return {
                        ...oldData,
                        data: oldData.data.map((idea: Idea) =>
                            idea.id === ideaId
                                ? { ...idea, votes_count: (idea.votes_count || 0) + 1, hasVoted: true }
                                : idea
                        )
                    };
                }
                // Legacy array format (fallback)
                if (Array.isArray(oldData)) {
                    return oldData.map((idea: Idea) =>
                        idea.id === ideaId
                            ? { ...idea, votes_count: (idea.votes_count || 0) + 1, hasVoted: true }
                            : idea
                    );
                }
                return oldData;
            });

            // Atualiza detalhe
            const detailKey = CACHE_KEYS.ideas.detail(ideaId);
            const prevDetail = queryClient.getQueryData(detailKey);
            if (prevDetail) {
                queryClient.setQueryData(detailKey, (old: any) => ({
                    ...old,
                    votes_count: (old.votes_count || 0) + 1,
                    hasVoted: true
                }));
            }

            // Atualiza interações do usuário
            queryClient.setQueryData(['user-interactions', userId], (old: any) => {
                if (!old) return old;
                const newVotes = new Set(old.votes);
                newVotes.add(ideaId);
                return { ...old, votes: newVotes };
            });

            return { prevDetail };
        },
        onError: (err, vars, context) => {
            // Rollback: invalida para refetch do servidor
            queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.all });
            queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.detail(vars.ideaId) });
            queryClient.invalidateQueries({ queryKey: ['user-interactions', vars.userId] });
        },
    });
}

export function useToggleFavorite() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ideaId, userId, isFavorite }: { ideaId: string; userId: string, isFavorite: boolean }) => {
            if (isFavorite) {
                await supabase.from('favorites').delete().match({ user_id: userId, idea_id: ideaId });
            } else {
                await supabase.from('favorites').insert({ user_id: userId, idea_id: ideaId });
            }
        },
        onMutate: async ({ ideaId, userId, isFavorite }) => {
            // Optimistic update
            queryClient.setQueriesData({ queryKey: CACHE_KEYS.ideas.all }, (oldData: any) => {
                if (!oldData) return oldData;
                // Handle new structure: { data: Idea[], totalCount: number }
                if (oldData.data && Array.isArray(oldData.data)) {
                    return {
                        ...oldData,
                        data: oldData.data.map((idea: Idea) =>
                            idea.id === ideaId ? { ...idea, isFavorite: !isFavorite } : idea
                        )
                    };
                }
                // Legacy array format (fallback)
                if (Array.isArray(oldData)) {
                    return oldData.map((idea: Idea) =>
                        idea.id === ideaId ? { ...idea, isFavorite: !isFavorite } : idea
                    );
                }
                return oldData;
            });

            queryClient.setQueryData(['user-interactions', userId], (old: any) => {
                if (!old) return old;
                const newFavs = new Set(old.favorites);
                if (isFavorite) newFavs.delete(ideaId);
                else newFavs.add(ideaId);
                return { ...old, favorites: newFavs };
            });
        },
        onError: (err, vars) => {
            // Rollback: invalida para refetch do servidor
            queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.all });
            queryClient.invalidateQueries({ queryKey: ['user-interactions', vars.userId] });
        }
    });
}

export function useAddImprovement() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ ideaId, userId, content, parentId }: { ideaId: string; userId: string; content: string, parentId?: string }) => {
            // 1. Inserir o comentário/melhoria
            const { data: newImprovement, error } = await supabase.from('idea_improvements').insert({
                idea_id: ideaId,
                user_id: userId,
                content: content,
                parent_id: parentId || null
            }).select('*, profiles(full_name, avatar_url)').single();

            if (error) throw error;

            // 2. Buscar informações da ideia para notificar o dono
            const { data: ideaData } = await supabase
                .from('ideas')
                .select('user_id, title')
                .eq('id', ideaId)
                .single();

            // 3. Criar notificação se o autor do comentário não for o dono da ideia
            if (ideaData && ideaData.user_id !== userId) {
                // Buscar dados do remetente para o payload
                const { data: senderProfile } = await supabase
                    .from('profiles')
                    .select('full_name, avatar_url')
                    .eq('id', userId)
                    .single();

                await supabase.from('notifications').insert({
                    recipient_id: ideaData.user_id,
                    sender_id: userId,
                    type: 'NEW_IMPROVEMENT',
                    payload: {
                        idea_id: ideaId,
                        idea_title: ideaData.title,
                        message: content.substring(0, 60) + (content.length > 60 ? '...' : ''),
                        user_name: senderProfile?.full_name || 'Alguém',
                        user_avatar: senderProfile?.avatar_url
                    }
                });
            }

            return newImprovement;
        },
        onSuccess: (newImprovement, variables) => {
            const key = CACHE_KEYS.ideas.detail(variables.ideaId);
            queryClient.setQueryData(key, (old: Idea) => {
                if (!old) return old;
                return {
                    ...old,
                    idea_improvements: [...(old.idea_improvements || []), newImprovement]
                };
            });
        }
    });
}

export function useJoinInterest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ ideaId, userId }: { ideaId: string, userId: string }) => {
            const { data, error } = await supabase.from('idea_interested').insert({
                idea_id: ideaId,
                user_id: userId
            }).select('*, profiles(*)').single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.detail(variables.ideaId) });
            queryClient.setQueryData(['user-interactions', variables.userId], (old: any) => {
                if (!old) return old;
                const newInt = new Set(old.interests);
                newInt.add(variables.ideaId);
                return { ...old, interests: newInt };
            });
        }
    });
}

export function useSaveIdea() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ideaData: Partial<Idea> & { id?: string }) => {
            const { id, ...data } = ideaData;

            if (id) {
                // Update
                const { data: updated, error } = await supabase
                    .from('ideas')
                    .update(data)
                    .eq('id', id)
                    .select()
                    .single();

                if (error) throw error;
                return updated;
            } else {
                // Create
                const { data: created, error } = await supabase
                    .from('ideas')
                    .insert([data])
                    .select()
                    .single();

                if (error) throw error;
                return created;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.all });
        }
    });
}
