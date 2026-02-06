# SE AI - Intelligent AI Platform

Multi-provider AI chat platform built with Next.js 14, TypeScript, Prisma, and PostgreSQL.

## Features

- **Multi-Provider AI** - OpenAI (GPT-4.1), Anthropic (Claude Sonnet/Opus 4), Google (Gemini 2.5), Groq (Llama 3.3, DeepSeek R1)
- **Streaming Responses** - Real-time SSE streaming with tool call support
- **Tool Use / Function Calling** - Web search, calculator, URL fetching with automatic execution loops
- **Context Management** - Sliding window with automatic summarization for long conversations
- **Rate Limiting** - Per-plan rate limiting (FREE: 20/day, PRO: 500/day, ENTERPRISE: 10000/day)
- **Cost Tracking** - Automatic cost calculation and tracking per message and subscription
- **Plan-Based Access** - Model and tool access restricted by subscription tier
- **Markdown Rendering** - Syntax highlighting, LaTeX, tables, code blocks with copy button
- **Authentication** - NextAuth v5 with Google, GitHub OAuth and email/password credentials
- **Error Handling** - Specific error classes (AIProviderError, RateLimitError, TokenLimitError, etc.)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth v5 (OAuth + Credentials)
- **AI SDKs**: OpenAI, Anthropic, Google Generative AI, Groq
- **UI**: Tailwind CSS, Lucide Icons, Framer Motion
- **State**: Zustand
- **Validation**: Zod

## Getting Started

1. Clone the repo and install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Set up the database:
```bash
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── app/
│   ├── (app)/          # Authenticated app routes
│   ├── (auth)/         # Login/Register pages
│   └── api/
│       ├── auth/       # NextAuth + register
│       ├── chat/       # Chat CRUD + streaming
│       └── usage/      # Usage metrics
├── components/
│   ├── chat/           # Message, Input, Markdown renderer
│   └── layout/         # Sidebar
├── hooks/              # useChat custom hook
├── lib/
│   ├── ai/
│   │   ├── providers/  # OpenAI, Anthropic, Google, Groq
│   │   ├── tools/      # Web search, calculator, URL fetch
│   │   ├── router.ts   # AI orchestration with tool loop
│   │   ├── models.ts   # Model definitions & pricing
│   │   └── context-manager.ts
│   ├── errors/         # Custom error classes
│   ├── rate-limit/     # In-memory rate limiting
│   └── validations.ts  # Zod schemas
├── store/              # Zustand state
└── middleware.ts        # Auth + security headers
```
