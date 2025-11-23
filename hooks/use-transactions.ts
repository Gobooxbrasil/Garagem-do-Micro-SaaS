
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { CACHE_KEYS } from '../lib/cache-keys';

interface CreateTransactionParams {
  ideaId: string;
  userId: string;
  type: 'donation' | 'purchase';
  amount: number;
  proofFile: File;
}

// Helper para pegar extensão
const getFileExtension = (filename: string) => filename.split('.').pop()?.toLowerCase() || '';

// Upload de comprovante
async function uploadPaymentProof(
  file: File,
  userId: string,
  ideaId: string
): Promise<{ path: string }> {
  // Validar tamanho (Frontend double check)
  if (file.size > 2097152) {
    throw new Error('Arquivo muito grande. Máximo: 2MB');
  }

  const ext = getFileExtension(file.name);
  if (!['png', 'jpg', 'jpeg', 'pdf'].includes(ext)) {
    throw new Error('Formato inválido. Use PNG, JPG ou PDF');
  }

  // Gerar nome único: user_id/idea_id/timestamp.ext
  const filename = `${userId}/${ideaId}/${Date.now()}.${ext}`;

  // Upload
  const { data, error } = await supabase.storage
    .from('payment-proofs')
    .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
    });

  if (error) throw error;
  return data;
}

// Criar transação com comprovante
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ideaId, userId, type, amount, proofFile }: CreateTransactionParams) => {
      
      // 1. Upload do comprovante
      const uploadData = await uploadPaymentProof(proofFile, userId, ideaId);
      
      // 2. Criar transação no banco
      const { data, error } = await supabase
        .from('idea_transactions')
        .insert({
          idea_id: ideaId,
          user_id: userId,
          transaction_type: type,
          amount: amount,
          payment_proof_url: uploadData.path, // Salva o path do storage
          payment_proof_filename: proofFile.name,
          payment_proof_size: proofFile.size,
          payment_proof_type: getFileExtension(proofFile.name),
          status: 'pending' // Pendente de aprovação do dono
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: (_, variables) => {
        // Invalida cache da ideia para mostrar que usuário apoiou/comprou (mesmo pendente)
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.detail(variables.ideaId) });
        queryClient.invalidateQueries({ queryKey: ['user-interactions', variables.userId] });
    }
  });
}
