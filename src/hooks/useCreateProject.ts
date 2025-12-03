import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabaseClient';

type ProjectType = 'idea' | 'showroom' | 'roadmap';

export const useCreateProject = (projectType: ProjectType) => {
    const toast = useToast();
    const [isCreating, setIsCreating] = useState(false);

    const create = async (payload: any) => {
        setIsCreating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error('Você precisa estar logado para criar um projeto.');
                return false;
            }

            const { data, error } = await supabase.functions.invoke('queue_project_creation', {
                body: {
                    user_id: user.id,
                    project_type: projectType,
                    payload: {
                        ...payload,
                        user_id: user.id // Ensure user_id is in payload
                    }
                }
            });

            if (error) {
                // Supabase functions error (network, etc)
                console.error('Function invocation error:', error);
                // Check if it's a 429 from our function (though invoke usually wraps it)
                // If the function returns a 429 response, supabase-js might treat it as an error or data depending on version.
                // Usually `error` object contains status.
                if (error instanceof Error && error.message.includes('429')) {
                    toast.error('Você atingiu o limite de 10 criações por hora.');
                    return false;
                }
                // Fallback for other errors
                toast.error('Erro ao conectar com o servidor.');
                return false;
            }

            // Check for application level error returned in body
            if (data && data.error) {
                if (data.error.includes('Limite de criação atingido')) {
                    toast.error('Você atingiu o limite de 10 criações por hora.');
                } else {
                    toast.error(`Erro: ${data.error}`);
                }
                return false;
            }

            toast.success('Criado com sucesso!');
            return true;

        } catch (err: any) {
            console.error('Unexpected error in useCreateProject:', err);
            toast.error('Ocorreu um erro inesperado.');
            return false;
        } finally {
            setIsCreating(false);
        }
    };

    return { create, isCreating };
};
