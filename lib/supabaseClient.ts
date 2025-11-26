
import { createClient } from '@supabase/supabase-js';

// ====================================================================
// ⚡ CONEXÃO DO PROJETO (PLANO PRO)
// ====================================================================

// URL do Projeto (Project URL da Imagem 2)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL; 

// Anon Public Key (JWT da Imagem 2 - começa com eyJ...)
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ====================================================================

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
