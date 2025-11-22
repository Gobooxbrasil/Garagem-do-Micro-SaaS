import { createClient } from '@supabase/supabase-js';

// ====================================================================
// CONFIGURAÇÃO SUPABASE
// ====================================================================

const SUPABASE_URL = 'https://oqveidfgkdjsvzzrerqr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TI-xuxCjy5uAtmAr0Fvmaw_iin9rYux';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);