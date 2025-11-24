
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { generatePixQRCode } from '../lib/pix-utils';
import { CACHE_KEYS } from '../lib/cache-keys';

export interface PixData {
  userId: string;
  key: string;
  type: string;
  beneficiary: string;
  bank: string;
}

// Buscar PIX do perfil
export function useUserPix(userId: string | undefined) {
  return useQuery({
    queryKey: ['pix', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('pix_key, pix_key_type, pix_name, pix_bank, pix_qr_code')
        .eq('id', userId)
        .single();
        
      if (error) {
        // Se não encontrar perfil, não é erro crítico, retorna null
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5 // 5 min
  });
}

// Salvar/Atualizar PIX
export function useSavePix() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pixData: PixData) => {
      // 1. Gerar o QR Code estático e salvar como string base64
      // Isso permite exibir rápido sem recalcular sempre
      const qrCode = await generatePixQRCode({
          key: pixData.key,
          beneficiary: pixData.beneficiary
      });
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          pix_key: pixData.key,
          pix_key_type: pixData.type,
          pix_name: pixData.beneficiary,
          pix_bank: pixData.bank,
          pix_qr_code: qrCode, // Salvando o dataURL
          updated_at: new Date().toISOString()
        })
        .eq('id', pixData.userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pix', data.id] });
      // Invalida também o perfil geral
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.profiles.current() });
    }
  });
}

// Deletar PIX
export function useDeletePix() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          pix_key: null,
          pix_key_type: null,
          pix_name: null,
          pix_bank: null,
          pix_qr_code: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['pix', userId] });
    }
  });
}