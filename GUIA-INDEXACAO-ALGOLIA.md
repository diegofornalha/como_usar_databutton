# Guia: Como Indexar Posts no Algolia

Este guia explica como configurar e indexar posts de um site Next.js no Algolia para implementar busca rápida e relevante.

## 1. Pré-requisitos

- Conta no Algolia (gratuita ou paga)
- Projeto Next.js configurado
- Node.js instalado
- Arquivos de conteúdo em formato Markdown

## 2. Configuração Inicial

### 2.1. Instalar Dependências

Execute o seguinte comando para instalar as bibliotecas necessárias:

```bash
npm install algoliasearch dotenv front-matter @algolia/autocomplete-js @algolia/autocomplete-theme-classic
```

### 2.2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com suas credenciais do Algolia:

```
ALGOLIA_APP_ID=sua_app_id
ALGOLIA_ADMIN_API_KEY=sua_admin_api_key
ALGOLIA_INDEX_NAME=nome_do_seu_indice
ALGOLIA_SEARCH_API_KEY=sua_search_api_key
```

> **IMPORTANTE:** Nunca compartilhe ou envie para o repositório a ADMIN_API_KEY, pois ela dá acesso total ao seu índice.

## 3. Criando Script de Indexação

### 3.1. Script para Indexar um Único Post

Crie um arquivo `scripts/index-post.js`:

```javascript
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const matter = require('front-matter');
const algoliasearch = require('algoliasearch');

// Inicializar cliente Algolia
const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_ADMIN_API_KEY
);

const index = client.initIndex(process.env.ALGOLIA_INDEX_NAME);

// Configurar arquivo a ser indexado
const filepath = process.argv[2];
if (!filepath) {
  console.error('Por favor, forneça o caminho do arquivo para indexar');
  process.exit(1);
}

// Ler e processar o arquivo
async function indexPost() {
  try {
    const fileContent = fs.readFileSync(filepath, 'utf8');
    const { attributes, body } = matter(fileContent);
    
    // Extrair dados do post
    const slug = filepath
      .replace(/^content\/pages\//, '')
      .replace(/\.md$/, '');
    
    // Preparar objeto para indexação
    const objectToIndex = {
      objectID: slug,
      slug,
      title: attributes.title || '',
      description: attributes.description || '',
      content: body,
      date: attributes.date || new Date().toISOString(),
      // Adicione outros campos conforme necessário
    };

    // Salvar objeto no Algolia
    await index.saveObject(objectToIndex);
    console.log(`Post indexado com sucesso: ${attributes.title}`);
  } catch (error) {
    console.error('Erro ao indexar post:', error);
  }
}

indexPost();
```

### 3.2. Script para Indexar Todos os Posts

Crie um arquivo `scripts/index-all-posts.js`:

```javascript
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const matter = require('front-matter');
const algoliasearch = require('algoliasearch');

// Inicializar cliente Algolia
const client = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_ADMIN_API_KEY
);

const index = client.initIndex(process.env.ALGOLIA_INDEX_NAME);

// Pasta com arquivos de conteúdo
const CONTENT_DIR = path.join(process.cwd(), 'content/pages');

// Ler e processar todos os arquivos
async function indexAllPosts() {
  try {
    // Configurar índice
    await index.setSettings({
      searchableAttributes: ['title', 'description', 'content'],
      attributesToSnippet: ['description:50', 'content:200'],
      attributesToHighlight: ['title', 'description', 'content'],
    });

    const files = getAllMdFiles(CONTENT_DIR);
    const objects = [];

    for (const file of files) {
      const fileContent = fs.readFileSync(file, 'utf8');
      const { attributes, body } = matter(fileContent);
      
      // Extrair slug
      const slug = file
        .replace(CONTENT_DIR, '')
        .replace(/^\//, '')
        .replace(/\.md$/, '');
      
      // Preparar objeto para indexação
      objects.push({
        objectID: slug,
        slug,
        title: attributes.title || '',
        description: attributes.description || '',
        content: body,
        date: attributes.date || new Date().toISOString(),
        // Adicione outros campos conforme necessário
      });
    }

    // Salvar objetos no Algolia
    if (objects.length > 0) {
      await index.saveObjects(objects);
      console.log(`Indexados ${objects.length} posts com sucesso!`);
    } else {
      console.log('Nenhum post encontrado para indexar');
    }
  } catch (error) {
    console.error('Erro ao indexar posts:', error);
  }
}

// Função auxiliar para obter todos os arquivos .md recursivamente
function getAllMdFiles(dir) {
  let results = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(getAllMdFiles(fullPath));
    } else if (fullPath.endsWith('.md')) {
      results.push(fullPath);
    }
  }

  return results;
}

indexAllPosts();
```

## 4. Adicionando Scripts ao package.json

Adicione os seguintes scripts ao seu arquivo `package.json`:

```json
"scripts": {
  // ... outros scripts existentes
  "algolia:index-post": "node scripts/index-post.js",
  "algolia:index-all": "node scripts/index-all-posts.js"
}
```

## 5. Executando a Indexação

### 5.1. Indexar um Post Específico

```bash
npm run algolia:index-post content/pages/seu-post.md
```

### 5.2. Indexar Todos os Posts

```bash
npm run algolia:index-all
```

## 6. Implementando o Componente de Busca

### 6.1. Crie um Componente de Busca

Crie um arquivo `components/SearchBox.jsx`:

```jsx
import React, { useState, useEffect, useRef } from 'react';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, SearchBox, Hits } from 'react-instantsearch-dom';
import Link from 'next/link';
import styles from './SearchBox.module.css';

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY
);

const CustomHits = ({ hits }) => (
  <div className={styles.hitsContainer}>
    {hits.map((hit) => (
      <div key={hit.objectID} className={styles.hitItem}>
        <Link href={`/${hit.slug}`}>
          <a className={styles.hitLink}>
            <h3 className={styles.hitTitle}>{hit.title}</h3>
            <p className={styles.hitDescription}>{hit.description}</p>
          </a>
        </Link>
      </div>
    ))}
  </div>
);

export default function CustomSearchBox() {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Fecha o dropdown quando clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  return (
    <div className={styles.searchWrapper} ref={wrapperRef}>
      <InstantSearch 
        searchClient={searchClient} 
        indexName={process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME}
      >
        <div className={styles.searchBoxContainer}>
          <SearchBox
            className={styles.searchBox}
            onFocus={() => setIsOpen(true)}
            translations={{
              placeholder: 'Buscar posts...',
            }}
          />
        </div>
        {isOpen && (
          <div className={styles.hitsWrapper}>
            <Hits hitComponent={CustomHits} />
          </div>
        )}
      </InstantSearch>
    </div>
  );
}
```

### 6.2. Estilização do Componente

Crie um arquivo `components/SearchBox.module.css`:

```css
.searchWrapper {
  position: relative;
  max-width: 300px;
  width: 100%;
}

.searchBoxContainer {
  width: 100%;
}

.searchBox {
  width: 100%;
}

.searchBox form {
  margin: 0;
}

.searchBox input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.hitsWrapper {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-height: 400px;
  overflow-y: auto;
  margin-top: 4px;
}

.hitsContainer {
  padding: 8px;
}

.hitItem {
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.hitItem:last-child {
  border-bottom: none;
}

.hitLink {
  text-decoration: none;
  color: inherit;
  display: block;
}

.hitTitle {
  margin: 0 0 4px;
  font-size: 16px;
  color: #333;
}

.hitDescription {
  margin: 0;
  font-size: 14px;
  color: #666;
}
```

### 6.3. Configuração das Variáveis de Ambiente Públicas

Adicione ao seu arquivo `.env.local` as variáveis acessíveis pelo cliente:

```
NEXT_PUBLIC_ALGOLIA_APP_ID=sua_app_id
NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY=sua_search_api_key
NEXT_PUBLIC_ALGOLIA_INDEX_NAME=nome_do_seu_indice
```

## 7. Adicionando o Componente de Busca à sua Aplicação

Importe e adicione o componente de busca em seu layout ou página:

```jsx
import SearchBox from '../components/SearchBox';

export default function Layout({ children }) {
  return (
    <div>
      <header>
        <nav>
          {/* Outros elementos de navegação */}
          <SearchBox />
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
```

## 8. Testando a Busca

1. Execute o script de indexação para garantir que seus posts estão indexados
2. Inicie seu servidor Next.js: `npm run dev`
3. Acesse o site e teste a funcionalidade de busca

## 9. Práticas Recomendadas

- **Segurança**: Use apenas a Search API Key no cliente, nunca a Admin API Key
- **Desempenho**: Considere reindexar posts automaticamente quando eles são atualizados
- **Relevância**: Configure os atributos de busca para melhorar a relevância dos resultados
- **Experiência do usuário**: Adicione highlight nos resultados e paginação para melhor UX

## 10. Solução de Problemas Comuns

- **Erro "No API Key provided"**: Verifique se as variáveis de ambiente estão configuradas corretamente
- **Posts não aparecem na busca**: Verifique os logs de indexação e se os objectIDs estão corretos
- **Resultados irrelevantes**: Ajuste os searchableAttributes e configurações de relevância no dashboard do Algolia

## 11. Recursos Adicionais

- [Documentação do Algolia](https://www.algolia.com/doc/guides/getting-started/quick-start/)
- [React InstantSearch](https://www.algolia.com/doc/guides/building-search-ui/what-is-instantsearch/react/)
- [Autocomplete.js](https://www.algolia.com/doc/ui-libraries/autocomplete/introduction/what-is-autocomplete/) 