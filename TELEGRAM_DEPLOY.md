# Deploy: Sistema de Validação via Telegram

## Pré-requisitos

### 1. Criar Bot no Telegram
1. Abra o Telegram e procure por [@BotFather](https://t.me/botfather)
2. Digite `/newbot`
3. Escolha um nome e username para o bot
4. @BotFather irá fornecer o **BOT_TOKEN** → guarde-o

### 2. Adicionar Bot ao Grupo
1. Adicione o bot ao grupo `-1003324547225` (Micro SaaS Pro)
2. Promova o bot a **Administrador**
3. O bot precisa de permissões para ver membros do grupo

---

## Passos de Deploy

### **1. Database (Supabase SQL Editor)**

Rode o arquivo `telegram_validation_schema.sql` no SQL Editor:

```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS telegram_user_id TEXT,
ADD COLUMN IF NOT EXISTS telegram_username TEXT,
ADD COLUMN IF NOT EXISTS is_in_telegram_group BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_telegram_check_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS telegram_validated_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_telegram_user_id ON public.profiles(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_group_status ON public.profiles(is_in_telegram_group);
```

---

### **2. Edge Functions**

#### Deploy `telegram-connect`:
```bash
npx supabase functions deploy telegram-connect
```

#### Deploy `telegram-check-membership`:
```bash
npx supabase functions deploy telegram-check-membership
```

---

### **3. Variáveis de Ambiente (Supabase)**

No Supabase Dashboard → Settings → Edge Functions → Add secret:

```
TELEGRAM_BOT_TOKEN=seu_bot_token_aqui
```

---

### **4. Atualizar `TelegramConnectScreen.tsx`**

**IMPORTANTE:** No arquivo `src/features/telegram/TelegramConnectScreen.tsx`, linha 30, substitua:

```tsx
script.setAttribute('data-telegram-login', 'YOUR_BOT_USERNAME'); // Replace with actual bot username
```

Por:

```tsx
script.setAttribute('data-telegram-login', 'nome_do_seu_bot'); // Sem o @
```

---

### **5. Frontend Deploy (Vercel)**

```bash
git add .
git commit -m "feat: telegram validation system"
git push origin main
```

Vercel fará o deploy automaticamente.

---

## Testando

### Cenário 1: Novo Usuário
1. Crie uma conta nova
2. Após login → deve ver tela "Conectar Telegram"
3. Clique no botão de login do Telegram
4. Após conectar → deve aparecer tela "Entre no Grupo" (se não estiver)
5. Entre no grupo: `https://t.me/microsaaspro`
6. Clique "Já entrei, validar agora"
7. Deve liberar acesso ao dashboard

### Cenário 2: Usuário sai do grupo
1. Usuário logado e validado
2. Sair do grupo no Telegram
3. Após 24h (ou próxima validação) → acesso bloqueado
4. Deve aparecer tela de bloqueio novamente

---

## Troubleshooting

### "Failed to check Telegram membership"
- Verifique se o bot está no grupo como admin
- Confira se `TELEGRAM_BOT_TOKEN` está correto
- Teste manualmente a API:
  ```bash
  curl "https://api.telegram.org/bot{TOKEN}/getChatMember?chat_id=-1003324547225&user_id={USER_ID}"
  ```

### Telegram Login Widget não aparece
- Verifique `data-telegram-login` no `TelegramConnectScreen.tsx`
- Certifique-se que o domínio está autorizado no bot (BotFather → /setdomain)

### Validação não funciona
- Verifique logs da Edge Function no Supabase
- Confirme que o usuário realmente está no grupo
- Teste o endpoint manualmente via Postman

---

## Configuração Opcional: CRON Diário

Para revalidação automática diária, configure um cron:

1. Crie Edge Function `telegram-daily-validation`
2. Configure cron no Supabase:
   ```sql
   SELECT cron.schedule(
     'telegram-daily-revalidation',
     '0 3 * * *', -- 3 AM daily
     $$
     SELECT net.http_post(
       url := 'https://YOUR_PROJECT.supabase.co/functions/v1/telegram-daily-validation',
       headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
     );
     $$
   );
   ```

---

## Checklist Final

- [ ] Bot criado no Telegram
- [ ] Bot adicionado ao grupo como admin
- [ ] SQL schema rodado no Supabase
- [ ] Edge Functions deployed
- [ ] `TELEGRAM_BOT_TOKEN` configurado
- [ ] `YOUR_BOT_USERNAME` substituído no código
- [ ] Frontend deployed
- [ ] Testado fluxo completo

---

✅ **Sistema pronto para produção!**
