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
                if (error.code === '42703' || error.message.includes('column')) {
                    console.warn('Telegram validation columns not found, allowing access');
                    setNeedsToJoin(false);
                    setLoading(false);
                    return;
                }
                throw error;
            }

            // Se ainda não validou, mostra tela de entrada
            if (!profile.is_in_telegram_group) {
                setNeedsToJoin(true);
            } else {
                setNeedsToJoin(false);
            }
        } catch (error) {
            console.error('Error checking access:', error);
            // Em caso de erro, libera acesso (fail-open)
            setNeedsToJoin(false);
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async (): Promise<boolean> => {
        try {
            // Marca como validado
            const { error } = await supabase
                .from('profiles')
                .update({
                    is_in_telegram_group: true,
                    last_telegram_check_at: new Date().toISOString(),
                    telegram_validated_at: new Date().toISOString(),
                })
                .eq('id', session?.user?.id || '');

            if (error) throw error;

            setNeedsToJoin(false);
            return true;
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
