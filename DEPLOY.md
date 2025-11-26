# Guia de Deploy via GitHub

## Opção 1: Vercel (Recomendado)

### Vantagens
- Deploy automático a cada push
- Domínio gratuito (.vercel.app)
- Configuração de variáveis de ambiente fácil
- Suporte nativo para Vite

### Passos

1. **Criar repositório no GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
   git push -u origin main
   ```

2. **Deploy na Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Faça login com GitHub
   - Clique em "Add New Project"
   - Selecione seu repositório
   - Configure as variáveis de ambiente:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
   - Clique em "Deploy"

3. **Domínio Customizado (Opcional)**
   - Vá em Settings > Domains
   - Adicione seu domínio personalizado

---

## Opção 2: Netlify

### Passos

1. **Criar repositório no GitHub** (mesmo processo acima)

2. **Deploy na Netlify**
   - Acesse [netlify.com](https://netlify.com)
   - Clique em "Add new site" > "Import an existing project"
   - Conecte com GitHub
   - Configure:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Adicione variáveis de ambiente em Site settings > Environment variables

---

## Opção 3: GitHub Pages (Limitado)

**Atenção**: GitHub Pages serve apenas arquivos estáticos. Você precisará de um backend separado para APIs.

### Passos

1. **Instalar gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Atualizar package.json**
   ```json
   {
     "homepage": "https://SEU_USUARIO.github.io/SEU_REPO",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Deploy**
   ```bash
   npm run deploy
   ```

---

## Checklist Pré-Deploy

- [ ] Arquivo `.env` está no `.gitignore` ✅ (já configurado)
- [ ] Variáveis de ambiente configuradas na plataforma de deploy
- [ ] Build local funciona: `npm run build`
- [ ] Preview local funciona: `npm run preview`
- [ ] Domínios configurados no Supabase (Authentication > URL Configuration)

---

## Configuração de Domínios no Supabase

Após o deploy, você precisa adicionar a URL do seu site no Supabase:

1. Vá para o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em Authentication > URL Configuration
4. Adicione em "Site URL": `https://seu-dominio.vercel.app`
5. Adicione em "Redirect URLs": `https://seu-dominio.vercel.app/**`

---

## Troubleshooting

### Erro: "Invalid API key"
- Verifique se as variáveis de ambiente estão configuradas corretamente na plataforma

### Erro: "CORS"
- Adicione o domínio nas configurações do Supabase (URL Configuration)

### Build falha
- Execute `npm run build` localmente para ver o erro
- Verifique se todas as dependências estão no `package.json`
