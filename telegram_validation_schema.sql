-- Telegram Validation Schema
-- Adiciona campos necessários para validação de acesso via Telegram

-- 1. Adicionar colunas à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS telegram_user_id TEXT,
ADD COLUMN IF NOT EXISTS telegram_username TEXT,
ADD COLUMN IF NOT EXISTS is_in_telegram_group BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_telegram_check_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS telegram_validated_at TIMESTAMP WITH TIME ZONE;

-- 2. Criar índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_user_id ON public.profiles(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_group_status ON public.profiles(is_in_telegram_group);

-- 3. Comentários explicativos
COMMENT ON COLUMN public.profiles.telegram_user_id IS 'ID do usuário no Telegram';
COMMENT ON COLUMN public.profiles.telegram_username IS 'Username do Telegram (sem @)';
COMMENT ON COLUMN public.profiles.is_in_telegram_group IS 'Status de membership no grupo Micro SaaS Pro';
COMMENT ON COLUMN public.profiles.last_telegram_check_at IS 'Última verificação de membership';
COMMENT ON COLUMN public.profiles.telegram_validated_at IS 'Primeira validação bem-sucedida no grupo';
