import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export interface PlatformSettings {
    site_name: string;
    maintenance_mode: boolean;
    maintenance_allowed_users: string[];
    allow_signups: boolean;
    global_announcement: string;
    enable_showroom: boolean;
    enable_roadmap: boolean;
    enable_nps: boolean;
    primary_color: string;
}

export const DEFAULT_SETTINGS: PlatformSettings = {
    site_name: 'Garagem de Micro SaaS',
    maintenance_mode: false,
    maintenance_allowed_users: [],
    allow_signups: true,
    global_announcement: '',
    enable_showroom: true,
    enable_roadmap: true,
    enable_nps: true,
    primary_color: '#000000'
};

export const usePlatformSettings = () => {
    return useQuery({
        queryKey: ['platform-settings'],
        queryFn: async () => {
            try {
                const { data, error } = await supabase
                    .from('platform_settings')
                    .select('*')
                    .single();

                if (error) {
                    // Se não existir (404/406), retorna default. Se for erro de conexão, pode retornar default também.
                    console.warn("Error fetching settings, using defaults:", error.message);
                    return DEFAULT_SETTINGS;
                }

                return { ...DEFAULT_SETTINGS, ...data } as PlatformSettings;
            } catch (err) {
                console.error("Unexpected error fetching settings:", err);
                return DEFAULT_SETTINGS;
            }
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: false
    });
};
