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

            // Direct database insert instead of Edge Function
            const insertData: any = {
                ...payload,
                user_id: user.id,
                votes_count: 0,
                is_building: false,
                short_id: Math.random().toString(36).substring(2, 8).toUpperCase(),
                created_at: new Date().toISOString()
            };

            // Set flags based on project type
            if (projectType === 'showroom') {
                insertData.is_showroom = true;
            }

            const { data, error } = await supabase
                .from('ideas')
                .insert(insertData)
                .select()
                .single();

            if (error) {
                console.error('Database insert error:', error);

                // Handle specific error codes
                if (error.code === '23505') {
                    toast.error('Já existe um projeto com esses dados.');
                } else {
                    toast.error('Erro ao criar projeto: ' + error.message);
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
