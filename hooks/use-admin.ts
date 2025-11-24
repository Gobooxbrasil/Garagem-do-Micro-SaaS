
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { AdminStats, UserProfile, AdminLog, Idea } from '../types';

// STATS
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // Mocking stats if the view doesn't exist yet to prevent crash
      try {
        const { data, error } = await supabase.from('admin_stats').select('*').single();
        if (error) throw error;
        return data as AdminStats;
      } catch (e) {
        // Fallback calculation (slower but works without view)
        const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: ideas } = await supabase.from('ideas').select('*', { count: 'exact', head: true });
        const { count: feedback } = await supabase.from('feedback_items').select('*', { count: 'exact', head: true });
        
        return {
            total_users: users || 0,
            blocked_users: 0,
            total_ideas: ideas || 0,
            total_showroom: 0,
            total_roadmap: 0,
            total_nps: 0,
            avg_nps_score: 0,
            total_feedback: feedback || 0,
            total_votes: 0,
            new_users_week: 0,
            new_ideas_week: 0
        } as AdminStats;
      }
    }
  });
}

// USERS LIST
export function useAdminUsers(search?: string, filter?: 'all' | 'active' | 'blocked' | 'admin') {
  return useQuery({
    queryKey: ['admin-users', search, filter],
    queryFn: async () => {
      let query = supabase.from('profiles').select('*');
      
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      
      if (filter === 'blocked') query = query.eq('is_blocked', true);
      if (filter === 'active') query = query.eq('is_blocked', false);
      if (filter === 'admin') query = query.eq('is_admin', true);
      
      // Removemos order temporariamente caso cause erro se a coluna não existir, 
      // mas idealmente: .order('created_at', { ascending: false })
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Ordenação manual no client para garantir
      return (data as UserProfile[]).sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
      });
    }
  });
}

// USER DETAILS (DEEP DIVE)
export function useAdminUserDetails(userId: string | null) {
    return useQuery({
        queryKey: ['admin-user-details', userId],
        queryFn: async () => {
            if (!userId) return null;

            const [ideas, votes, comments] = await Promise.all([
                supabase.from('ideas').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
                supabase.from('idea_votes').select('*, ideas(title)').eq('user_id', userId),
                supabase.from('idea_improvements').select('*, ideas(title)').eq('user_id', userId).order('created_at', { ascending: false })
            ]);

            return {
                created_projects: (ideas.data || []) as Idea[],
                votes_cast: votes.data || [],
                comments_made: comments.data || []
            };
        },
        enabled: !!userId
    });
}

// BLOCK USER
export function useBlockUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, reason, adminId }: { userId: string; reason: string; adminId: string }) => {
      // 1. Update Profile
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_blocked: true, 
          blocked_at: new Date().toISOString(),
          blocked_reason: reason 
        })
        .eq('id', userId);
      
      if (error) throw error;

      // 2. Log Action
      await supabase.from('admin_logs').insert({
        admin_id: adminId,
        action: 'user_blocked',
        target_type: 'user',
        target_id: userId,
        details: { reason }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    }
  });
}

// UNBLOCK USER
export function useUnblockUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, adminId }: { userId: string; adminId: string }) => {
            const { error } = await supabase
                .from('profiles')
                .update({ is_blocked: false, blocked_at: null, blocked_reason: null })
                .eq('id', userId);
            
            if (error) throw error;

            await supabase.from('admin_logs').insert({
                admin_id: adminId,
                action: 'user_unblocked',
                target_type: 'user',
                target_id: userId
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        }
    });
}

// DELETE USER
export function useDeleteUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, adminId }: { userId: string; adminId: string }) => {
            // Nota: Isso deleta o perfil público. Para deletar da Auth (Supabase Auth),
            // seria necessário uma Edge Function com Service Role Key.
            // Ao deletar o perfil, o usuário perde acesso ao app (pois a maioria das queries depende do perfil).
            
            const { error } = await supabase.from('profiles').delete().eq('id', userId);
            if (error) throw error;

            await supabase.from('admin_logs').insert({
                admin_id: adminId,
                action: 'user_deleted',
                target_type: 'user',
                target_id: userId
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        }
    });
}

// TOGGLE ADMIN
export function useToggleAdmin() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ userId, isAdmin, adminId }: { userId: string; isAdmin: boolean; adminId: string }) => {
            const { error } = await supabase
                .from('profiles')
                .update({ is_admin: isAdmin })
                .eq('id', userId);
            
            if (error) throw error;

            await supabase.from('admin_logs').insert({
                admin_id: adminId,
                action: isAdmin ? 'user_promoted_admin' : 'user_demoted_admin',
                target_type: 'user',
                target_id: userId
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        }
    });
}

// LOGS
export function useAdminLogs() {
  return useQuery({
    queryKey: ['admin-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*, profiles(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
          // If table doesn't exist yet, return empty
          if (error.code === '42P01') return [];
          throw error;
      }
      return data as AdminLog[];
    }
  });
}
