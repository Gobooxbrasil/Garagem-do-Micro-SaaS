
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { CACHE_KEYS } from '../lib/cache-keys';
import { useState, useEffect } from 'react';

const NPS_COOLDOWN_DAYS = 90; // Quarterly surveys (market standard)
const INITIAL_DELAY_DAYS = 7; // Wait 7 days after signup before first survey
const SESSION_DELAY_MS = 45000; // 45 seconds delay after page load

export function useNPS(userId: string | undefined) {
    const queryClient = useQueryClient();
    const [sessionDelayPassed, setSessionDelayPassed] = useState(false);

    // Session delay timer
    useEffect(() => {
        const timer = setTimeout(() => {
            setSessionDelayPassed(true);
        }, SESSION_DELAY_MS);

        return () => clearTimeout(timer);
    }, []);

    // Check eligibility
    const { data: shouldShow, isLoading } = useQuery({
        queryKey: CACHE_KEYS.nps.status(userId || ''),
        queryFn: async () => {
            if (!userId) return false;

            // 1. Check local storage first to avoid DB hits on every reload
            const localLastShown = localStorage.getItem(`nps_last_shown_${userId}`);
            if (localLastShown) {
                const daysSince = (Date.now() - new Date(localLastShown).getTime()) / (1000 * 60 * 60 * 24);
                if (daysSince < NPS_COOLDOWN_DAYS) return false;
            }

            // 2. Check if user is old enough (7 days since signup)
            const { data: profile } = await supabase
                .from('profiles')
                .select('created_at')
                .eq('id', userId)
                .single();

            if (profile) {
                const daysSinceSignup = (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24);
                if (daysSinceSignup < INITIAL_DELAY_DAYS) return false;
            }

            // 3. Check DB log
            const { data, error } = await supabase
                .from('nps_display_log')
                .select('displayed_at')
                .eq('user_id', userId)
                .order('displayed_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') return false; // Error or no rows

            if (data) {
                const lastDate = new Date(data.displayed_at);
                const daysSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
                if (daysSince < NPS_COOLDOWN_DAYS) return false;
            }

            return true;
        },
        enabled: !!userId && sessionDelayPassed, // Only check after session delay
        staleTime: 1000 * 60 * 60 * 24 // Check once a day per session roughly
    });

    // Mark as displayed
    const logDisplay = useMutation({
        mutationFn: async () => {
            if (!userId) return;
            localStorage.setItem(`nps_last_shown_${userId}`, new Date().toISOString());
            await supabase.from('nps_display_log').insert({ user_id: userId, displayed_at: new Date().toISOString() });
        }
    });

    // Submit Score
    const submitScore = useMutation({
        mutationFn: async ({ score, feedback }: { score: number, feedback?: string }) => {
            if (!userId) return;
            await supabase.from('nps_responses').insert({
                user_id: userId,
                score,
                feedback
            });
            // Update log to ensure 'answered' is true if you have that column, or just rely on response existence
            await supabase.from('nps_display_log')
                .update({ answered: true })
                .eq('user_id', userId)
                .order('displayed_at', { ascending: false })
                .limit(1);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CACHE_KEYS.nps.status(userId || '') });
        }
    });

    const snooze = () => {
        // Snooze for 7 days locally
        if (!userId) return;
        const snoozeDate = new Date();
        snoozeDate.setDate(snoozeDate.getDate() - (NPS_COOLDOWN_DAYS - 7)); // Trick: Set last shown to 83 days ago, so it shows in 7 days
        localStorage.setItem(`nps_last_shown_${userId}`, snoozeDate.toISOString());
        queryClient.setQueryData(CACHE_KEYS.nps.status(userId), false);
    };

    return {
        shouldShow: !!shouldShow && sessionDelayPassed,
        logDisplay,
        submitScore,
        snooze
    };
}
