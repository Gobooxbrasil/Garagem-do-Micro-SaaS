# Configuração do Bot Telegram

## ✅ Bot Criado

**Nome**: Garagem validador  
**Username**: `@Garagem_validador_bot`  
**Token**: `8198353483:AAEUkrP5WbFyfgq6ezeJP1VMu0EjbBZE0dYc`

---

## 🚀 Próximos Passos

### 1. Adicionar Bot ao Grupo

1. Abra o grupo no Telegram: `https://t.me/microsaaspro`
2. Clique em ⋮ (três pontos) → **Adicionar Membros**
3. Procure por `@Garagem_validador_bot`
4. Adicione o bot
5. **IMPORTANTE**: Promova o bot a **Administrador**
   - Sem isso, o bot não consegue ver os membros do grupo

---

### 2. Configurar Token no Supabase

No Supabase Dashboard:

1. Vá em **Settings** → **Edge Functions**
2. Clique em **Add secret**
3. Nome: `TELEGRAM_BOT_TOKEN`
4. Valor: `8198353483:AAEUkrP5WbFyfgq6ezeJP1VMu0EjbBZE0dYc`
5. Salve

---

### 3. Deploy das Edge Functions

```bash
# Deploy telegram-connect
npx supabase functions deploy telegram-connect

# Deploy telegram-check-membership
npx supabase functions deploy telegram-check-membership
```

---

### 4. Rodar SQL no Supabase

Execute o arquivo `telegram_validation_schema.sql` no SQL Editor do Supabase.

---

### 5. Testar

1. Faça logout da plataforma
2. Faça login novamente
3. Você verá a tela "Conecte seu Telegram"
4. Clique no botão do Telegram
5. Autorize o bot
6. Sistema deve validar automaticamente!

---

## 🔒 Segurança

✅ Token está seguro (nunca exponha no frontend)  
✅ Validação de hash do Telegram implementada  
✅ RLS policies no Supabase

---

## 📌 Importante

- Mantenha o token **secreto**
- Não compartilhe em repositórios públicos
- Use variáveis de ambiente no Supabase
