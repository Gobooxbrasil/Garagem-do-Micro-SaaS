
import { createClient } from '@supabase/supabase-js';

// ====================================================================
// 🔑 CONFIGURAÇÃO OBRIGATÓRIA DO SUPABASE
// ====================================================================

// URL do Projeto
const SUPABASE_URL = 'https://oqveidfgkdjsvzzrerqr.supabase.co'; 

// Anon / Public Key
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xdmVpZGZna2Rqc3Z6enJlcnFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NDYwMDksImV4cCI6MjA3OTQyMjAwOX0.5-iEVj1D7a82hhp568hi8DQBiz-I_eHUA_aoGcJK2ec';

// ====================================================================

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
