import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import { supabase } from '../../lib/supabaseClient';
import TelegramConnectScreen from '../telegram/TelegramConnectScreen';
import TelegramBlockScreen from '../telegram/TelegramBlockScreen';
import { ActionLoader } from '../../components/ui/LoadingStates';

interface TelegramGuardProps {
    children: React.ReactNode;
}

export const TelegramGuard: React.FC<TelegramGuardProps> = ({ children }) => {
    const { session } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [needsToJoin, setNeedsToJoin] = useState(false);

    useEffect(() => {
        checkAccess();
    }, [session]);

    const revalidateMembership = async (telegramUserId: string) => {
        try {
            const { data: authData } = await supabase.auth.getSession();
            const token = authData?.session?.access_token;

            if (!token || !telegramUserId) return;

            await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-check-membership`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ telegram_user_id: telegramUserId }),
                }
            );
        } catch (error) {
            console.error('Error revalidating membership:', error);
        }
    };

    const checkAccess = async () => {
        if (!session?.user) {
            navigate('/');
            return;
        }

        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('is_in_telegram_group, telegram_validated_at, last_telegram_check_at, telegram_user_id')
                .eq('id', session.user.id)
                .single();

            if (error) {
                // Se a coluna não existe (erro 42703), libera acesso
                // Isso é apenas para retrocompatibilidade durante migração
                if (error.code === '42703' || error.message.includes('column')) {
                    console.warn('Telegram validation columns not found, allowing access');
                    setNeedsToJoin(false);
                    setLoading(false);
                    return;
                }
                // Para outros erros, BLOQUEIA acesso (fail-closed)
                console.error('Error checking access:', error);
                setNeedsToJoin(true);
                setLoading(false);
                return;
            }



            // REGRA 1: Se nunca validou (telegram_validated_at é null), BLOQUEIA
            console.log('🔍 Checking validation status:', {
                telegram_validated_at: profile.telegram_validated_at,
                is_in_telegram_group: profile.is_in_telegram_group,
                last_telegram_check_at: profile.last_telegram_check_at,
                telegram_user_id: profile.telegram_user_id
            });

            if (!profile.telegram_validated_at) {
                console.log('❌ BLOQUEANDO: Usuário nunca validou o Telegram');
                setNeedsToJoin(true);
                setLoading(false);
                return;
            }

            // REGRA 2: Verifica se passou 24 horas desde último check
            const lastCheck = profile.last_telegram_check_at
                ? new Date(profile.last_telegram_check_at)
                : null;
            const now = new Date();
            const hoursSinceLastCheck = lastCheck
                ? (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60)
                : 999; // Se nunca checou, força re-validação

            console.log('⏰ Horas desde último check:', hoursSinceLastCheck);

            // REGRA 3: Se passou 24h, re-valida automaticamente
            if (hoursSinceLastCheck >= 24 && profile.telegram_user_id) {
                console.log('🔄 Re-validating membership after 24 hours...');
                await revalidateMembership(profile.telegram_user_id);

                // Após re-validação, busca status atualizado
                const { data: updatedProfile } = await supabase
                    .from('profiles')
                    .select('is_in_telegram_group')
                    .eq('id', session.user.id)
                    .single();

                if (!updatedProfile?.is_in_telegram_group) {
                    console.log('❌ BLOQUEANDO: Usuário não está mais no grupo após re-validação');
                    setNeedsToJoin(true);
                    setLoading(false);
                    return;
                }
            }

            // REGRA 4: Se não está no grupo, BLOQUEIA
            if (!profile.is_in_telegram_group) {
                console.log('❌ BLOQUEANDO: Usuário não está no grupo');
                setNeedsToJoin(true);
            } else {
                console.log('✅ LIBERANDO: Usuário validado e no grupo');
                setNeedsToJoin(false);
            }


        } catch (error) {
            console.error('Error checking access:', error);
            // Em caso de erro, BLOQUEIA acesso (fail-closed) - SEGURANÇA
            setNeedsToJoin(true);
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async (): Promise<boolean> => {
        try {
            // Primeiro, busca o telegram_user_id do perfil
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('telegram_user_id')
                .eq('id', session?.user?.id || '')
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
                return false;
            }

            if (!profile?.telegram_user_id) {
                console.error('Telegram user ID not found. User needs to connect Telegram first.');
                return false;
            }

            // Chama a Edge Function para verificar membership real
            const { data: authData } = await supabase.auth.getSession();
            const token = authData?.session?.access_token;

            if (!token) {
                console.error('No auth token available');
                return false;
            }

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-check-membership`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ telegram_user_id: profile.telegram_user_id }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                console.error('Membership check failed:', result);
                return false;
            }

            // A Edge Function já atualiza o banco de dados
            // Apenas retorna o resultado
            if (result.allowed) {
                setNeedsToJoin(false);
                return true;
            }

            return false;
        } catch (error) {
            console.error('Error validating:', error);
            return false;
        }
    };

    if (loading) {
        return <ActionLoader message="Verificando acesso..." />;
    }

    if (needsToJoin) {
        return <TelegramBlockScreen onValidate={handleValidate} />;
    }

    return <>{children}</>;
};

export default TelegramGuard;
