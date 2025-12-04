-- Verifica os dados atuais dos dois usuários
SELECT id, email, full_name, telegram_user_id, telegram_validated_at 
FROM profiles 
WHERE email IN ('dropardropar@gmail.com', 'matheusbezerra4525@gmail.com');

-- Se o ID 1070453783 estiver em uso pelo usuário errado (dropardropar), removemos dele
UPDATE profiles 
SET telegram_user_id = NULL, telegram_validated_at = NULL, is_in_telegram_group = FALSE
WHERE email = 'dropardropar@gmail.com' AND telegram_user_id = '1070453783';

-- Agora forçamos a validação para o usuário CORRETO (matheusbezerra4525)
UPDATE profiles 
SET 
    telegram_user_id = '1070453783', -- ID do print
    telegram_validated_at = NOW(),
    last_telegram_check_at = NOW(),
    is_in_telegram_group = TRUE
WHERE email = 'matheusbezerra4525@gmail.com';

-- Verifica o resultado final
SELECT id, email, full_name, telegram_user_id, telegram_validated_at, is_in_telegram_group
FROM profiles 
WHERE email IN ('dropardropar@gmail.com', 'matheusbezerra4525@gmail.com');
