# Iniciador Netlify Content Ops

![Iniciador Content Ops](https://assets.stackbit.com/docs/content-ops-starter-thumb.png)

Um iniciador Netlify feito para personalização com um modelo de conteúdo flexível, biblioteca de componentes, [edição visual](https://docs.netlify.com/visual-editor/overview/) e [Fonte de Conteúdo Git](https://docs.netlify.com/create/content-sources/git/).

**⚡ Ver demonstração:** [https://content-ops-starter.netlify.app/](https://content-ops-starter.netlify.app/)

## Implantando no Netlify

Se você clicar no botão "Deploy to Netlify", ele criará um novo repositório para você que se parece exatamente com este, e configura esse repositório imediatamente para implantação no Netlify.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/netlify-templates/content-ops-starter)

## Desenvolvendo com o Editor Visual Netlify Localmente

O processo típico de desenvolvimento começa trabalhando localmente. Clone este repositório e execute `npm install` em seu diretório raiz.

Execute o servidor de desenvolvimento Next.js:

## Sistema de Indexação do Algolia

Este projeto inclui um sistema automatizado de indexação do conteúdo no Algolia, permitindo busca avançada nos artigos.

### Como Funciona a Indexação Automática

1. **Indexação automática durante o build:**
   - Quando o Netlify faz um build do site (após commits ou edições via Visual Editor), o comando `npm run build-with-index` é executado
   - Este comando compila o site Next.js e em seguida executa o script de indexação (`scripts/indexar-conteudo.js`)
   - O script lê os arquivos Markdown em `content/pages/mcpx/`, extrai seus metadados e conteúdo, e envia para o Algolia

2. **Suporte completo a CRUD:**
   - **Create/Update:** Novos artigos ou modificações são indexados automaticamente
   - **Read:** A busca do site lê dados do Algolia para mostrar resultados
   - **Delete:** Quando um artigo é removido do repositório, ele também é removido do índice Algolia
   - O sistema sincroniza completamente os artigos do repositório Git com o índice do Algolia

3. **Recursos de confiabilidade:**
   - Retry automático em caso de falhas temporárias na API do Algolia (até 3 tentativas)
   - Tratamento de erros robusto para evitar falhas completas no build
   - Registro detalhado do processo de indexação

4. **Ferramentas de administração:**
   - API de reindexação manual via Netlify Functions (`/.netlify/functions/algolia-reindex`)
   - API de verificação de status do índice (`/.netlify/functions/algolia-status`)
   - Interface visual para reindexação manual (disponível apenas em ambiente de desenvolvimento)

### Configuração Necessária

Para que a indexação funcione, você precisa configurar as seguintes variáveis de ambiente no Netlify:

- `NEXT_PUBLIC_ALGOLIA_APP_ID` - ID da sua aplicação no Algolia
- `NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY` - Chave de API para busca (apenas leitura)
- `ALGOLIA_ADMIN_API_KEY` - Chave de API de administração (para indexação)
- `ALGOLIA_WEBHOOK_SECRET` (opcional) - Token de segurança para proteção das funções Netlify

Localmente, essas variáveis devem ser configuradas em um arquivo `.env` ou `.env.local` na raiz do projeto.

### Reindexação Manual

Para reindexar manualmente o conteúdo:

1. **Via linha de comando:**
   ```bash
   npm run index-content
   ```

2. **Via ambiente de desenvolvimento:**
   Um botão de reindexação está disponível no canto inferior direito da interface quando em ambiente de desenvolvimento.

3. **Via API de Netlify Functions:**
   ```bash
   curl -X POST https://seu-site.netlify.app/.netlify/functions/algolia-reindex
   ```

### Personalização

As configurações de indexação, como atributos pesquisáveis e faceting, podem ser ajustadas no arquivo `scripts/indexar-conteudo.js`.
