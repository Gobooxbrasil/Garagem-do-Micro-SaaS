
import { createClient } from '@supabase/supabase-js';

// ====================================================================
// ⚡ CONEXÃO DO PROJETO (PLANO PRO)
// ====================================================================

// URL do Projeto (Project URL da Imagem 2)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// Anon Public Key (JWT da Imagem 2 - começa com eyJ...)
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ====================================================================

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('ERRO CRÍTICO: Variáveis de ambiente do Supabase não encontradas.');
    console.error('Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas.');
    // Não travar a app inteira, mas o supabase client vai falhar se usado
}

export const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');
