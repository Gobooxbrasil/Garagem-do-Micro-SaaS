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

    const checkAccess = async () => {
        if (!session?.user) {
            navigate('/');
            return;
        }

        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('is_in_telegram_group')
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

            // Se ainda não validou, mostra tela de entrada
            if (!profile.is_in_telegram_group) {
                setNeedsToJoin(true);
            } else {
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
