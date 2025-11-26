# Workflow: Como Fazer Deploy no GitHub

## Passo a Passo Completo

### 1. Verificar Alterações
Sempre que você fizer alterações no código, verifique o que mudou:

```bash
git status
```

### 2. Adicionar Arquivos ao Stage
Adicione os arquivos que você quer commitar:

```bash
# Adicionar todos os arquivos modificados
git add .

# OU adicionar arquivos específicos
git add arquivo1.ts arquivo2.tsx
```

### 3. Fazer Commit
Crie um commit com uma mensagem descritiva:

```bash
git commit -m "feat: descrição da alteração"
```

**Convenções de mensagem:**
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `chore:` - Tarefas de manutenção
- `docs:` - Documentação
- `style:` - Formatação de código

### 4. Enviar para o GitHub (PUSH)
**Este é o passo mais importante!** Envie o commit para o GitHub:

```bash
git push origin main
```

### 5. Verificar no GitHub
Após o push, verifique:
1. Acesse: https://github.com/Gobooxbrasil/Garagem-do-Micro-SaaS/commits/main
2. Veja se seu commit apareceu
3. A Vercel deve fazer deploy automaticamente em 1-2 minutos

## Workflow Completo em Um Comando

```bash
# Fazer tudo de uma vez
git add . && git commit -m "sua mensagem aqui" && git push origin main
```

## Verificar se o Push Funcionou

```bash
# Ver commits locais vs remotos
git log --oneline -3

# Ver o que está no GitHub
git ls-remote origin main
```

Se o hash do commit for o mesmo nos dois comandos, o push funcionou! ✅

## Problemas Comuns

### "Everything up-to-date"
Significa que não há nada novo para enviar. Você precisa fazer um commit primeiro.

### "Permission denied"
Você precisa configurar autenticação:
```bash
# Usar HTTPS com token
git remote set-url origin https://TOKEN@github.com/Gobooxbrasil/Garagem-do-Micro-SaaS.git

# OU usar SSH
git remote set-url origin git@github.com:Gobooxbrasil/Garagem-do-Micro-SaaS.git
```

### "Rejected - non-fast-forward"
Alguém fez push antes de você:
```bash
git pull origin main --rebase
git push origin main
```

## Automatizar o Processo

Você pode criar um alias no seu `.zshrc`:

```bash
# Adicionar ao ~/.zshrc
alias gp="git add . && git commit -m 'update' && git push origin main"

# Usar:
gp
```

## Resumo

**Para fazer deploy no GitHub sempre que fizer alterações:**

1. `git add .` - Adiciona arquivos
2. `git commit -m "mensagem"` - Cria commit
3. `git push origin main` - **ENVIA PARA O GITHUB** ← PASSO CRUCIAL
4. Aguarde 1-2 minutos para Vercel fazer deploy automático
