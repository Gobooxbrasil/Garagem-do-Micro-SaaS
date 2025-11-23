
import { createClient } from '@supabase/supabase-js';

// ====================================================================
// ⚡ CONEXÃO DO PROJETO (PLANO PRO)
// ====================================================================

// URL do Projeto (Project URL da Imagem 2)
const SUPABASE_URL = 'https://oqveidfgkdjsvzzrerqr.supabase.co'; 

// Anon Public Key (JWT da Imagem 2 - começa com eyJ...)
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdmVpZGZna2Rqc3Z6enJlcnFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NDYwMDksImV4cCI6MjA3OTQyMjAwOX0.5-iEVj1D7a82hhp568hi8DQBiz-I_eHUA_aoGcJK2ec';

// ====================================================================

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
