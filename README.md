# SE AI - Inteligencia Artificial de Proxima Geracao

> Plataforma de IA conversacional enterprise-grade com multiplos modelos, busca na web, geracao de imagens e muito mais.

## Stack Tecnologica

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Linguagem**: TypeScript 5.3+
- **Estilizacao**: Tailwind CSS + Radix UI
- **Estado**: Zustand + React Query
- **Formularios**: React Hook Form + Zod
- **Animacoes**: Framer Motion

### Backend
- **ORM**: Prisma 5+
- **Banco de Dados**: PostgreSQL 16
- **Autenticacao**: NextAuth.js v5

### Provedores de IA
- OpenAI (GPT-4o, GPT-4-turbo, GPT-3.5-turbo, DALL-E 3)
- Anthropic (Claude 3 Opus, Claude 3.5 Sonnet, Claude 3 Haiku)
- Google (Gemini Pro, Gemini Ultra)
- Groq (Llama 3, Mixtral)

## Primeiros Passos

### Pre-requisitos
- Node.js 18+
- PostgreSQL 16+
- pnpm (recomendado) ou npm

### Instalacao

1. Clone o repositorio:
```bash
git clone https://github.com/Gui0494/SE-AI-.git
cd SE-AI-
```

2. Instale as dependencias:
```bash
pnpm install
# ou
npm install
```

3. Configure as variaveis de ambiente:
```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com suas configuracoes.

5. Configure o banco de dados:
```bash
pnpm db:push
# ou
npm run db:push
```

6. Inicie o servidor de desenvolvimento:
```bash
pnpm dev
# ou
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Estrutura do Projeto

```
se-ai/
├── prisma/
│   └── schema.prisma       # Schema do banco de dados
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (app)/          # Rotas autenticadas
│   │   ├── (auth)/         # Rotas de autenticacao
│   │   ├── api/            # API Routes
│   │   └── onboarding/     # Fluxo de onboarding
│   ├── components/         # Componentes React
│   │   ├── auth/           # Componentes de autenticacao
│   │   ├── chat/           # Componentes do chat
│   │   ├── layout/         # Layout (sidebar, header)
│   │   ├── onboarding/     # Componentes de onboarding
│   │   └── ui/             # Design system
│   └── lib/                # Utilitarios e configuracoes
├── .env.example            # Template de variaveis de ambiente
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Funcionalidades

### Implementadas
- [x] Sistema de autenticacao completo (Email/Senha, Google, GitHub)
- [x] Design system com componentes reutilizaveis
- [x] Telas de login e registro
- [x] Fluxo de onboarding personalizavel
- [x] Layout principal com sidebar e header
- [x] Interface de chat com sugestoes
- [x] Sistema de saudacoes inteligentes
- [x] Tema escuro nativo

### Em Desenvolvimento
- [ ] Integracao com provedores de IA
- [ ] Streaming de respostas
- [ ] Historico de conversas
- [ ] Sistema de pagamentos (Stripe + PIX)
- [ ] Busca na web
- [ ] Geracao de imagens
- [ ] CodeTwin (execucao de codigo)
- [ ] Integracao com GitHub
- [ ] App mobile

## Scripts Disponiveis

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor de desenvolvimento

# Build
pnpm build            # Build de producao
pnpm start            # Inicia servidor de producao

# Banco de Dados
pnpm db:generate      # Gera cliente Prisma
pnpm db:push          # Push schema para banco
pnpm db:migrate       # Executa migracoes
pnpm db:studio        # Abre Prisma Studio

# Qualidade de Codigo
pnpm lint             # Executa ESLint
pnpm format           # Formata codigo com Prettier
```

## Variaveis de Ambiente

Veja `.env.example` para a lista completa de variaveis necessarias.

### Obrigatorias
- `DATABASE_URL` - URL de conexao do PostgreSQL
- `NEXTAUTH_URL` - URL base da aplicacao
- `NEXTAUTH_SECRET` - Segredo para sessoes

### OAuth (pelo menos um)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`

### IA (pelo menos um)
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_AI_API_KEY`

## Licenca

Proprietario - Todos os direitos reservados.

---

Desenvolvido com ❤️ pela equipe SE AI
