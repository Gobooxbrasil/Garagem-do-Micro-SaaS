# Troubleshooting: Deploy Automático GitHub → Vercel

## Problema
Os commits estão chegando no GitHub, mas a Vercel não está fazendo deploy automático.

## Checklist de Verificação

### 1. Verificar Integração GitHub-Vercel

**Na Vercel:**
1. Acesse https://vercel.com/dashboard
2. Selecione o projeto "Garagem de Micro SaaS"
3. Vá em **Settings** > **Git**
4. Verifique:
   - ✅ Repositório conectado: `Gobooxbrasil/Garagem-do-Micro-SaaS`
   - ✅ Branch de produção: `main`
   - ✅ "Auto Deploy" está **ENABLED**

### 2. Verificar Webhooks no GitHub

**No GitHub:**
1. Acesse https://github.com/Gobooxbrasil/Garagem-do-Micro-SaaS/settings/hooks
2. Verifique se existe um webhook da Vercel
3. Deve ter uma URL tipo: `https://api.vercel.com/v1/integrations/deploy/...`
4. Clique no webhook e veja "Recent Deliveries"
5. Se houver erros (ícone vermelho), clique para ver detalhes

### 3. Reconectar Integração (se necessário)

**Se o webhook não existir ou estiver com erro:**

1. **Na Vercel:**
   - Settings > Git
   - Clique em "Disconnect" (se conectado)
   - Clique em "Connect Git Repository"
   - Selecione GitHub
   - Autorize novamente
   - Selecione o repositório

2. **Ou reinstalar a Vercel App no GitHub:**
   - Acesse https://github.com/settings/installations
   - Encontre "Vercel"
   - Clique em "Configure"
   - Verifique se o repositório `Garagem-do-Micro-SaaS` está selecionado

### 4. Testar Deploy Automático

Após verificar/reconectar, teste:

```bash
# Fazer um commit vazio para testar
git commit --allow-empty -m "test: verify auto deploy"
git push origin main
```

Aguarde 30 segundos e verifique se aparece um novo deployment na Vercel.

### 5. Verificar Configurações de Branch

**Na Vercel (Settings > Git):**
- Production Branch: `main` ✅
- Se estiver em outra branch, mude para `main`

### 6. Logs de Debug

**Se ainda não funcionar, verifique:**
- Vercel > Settings > General > "Ignored Build Step"
  - Deve estar vazio ou configurado corretamente
- Vercel > Deployments > Ver se há algum deployment "Canceled" ou "Failed"

## Solução Temporária

Enquanto a integração não funciona automaticamente, você pode:

1. **Deploy manual via Vercel CLI:**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

2. **Redeploy manual no dashboard:**
   - Vercel > Deployments > Create Deployment
   - Selecione branch `main`

## Próximos Passos

1. Verificar webhook no GitHub
2. Verificar configuração Git na Vercel
3. Reconectar se necessário
4. Testar com commit vazio
