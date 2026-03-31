# Getting Started

This guide will help you set up the System Design Bootcamp project locally.

## Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com/) account
- API keys for [Anthropic](https://console.anthropic.com) and/or [OpenAI](https://platform.openai.com)
- GitHub account (for OAuth configuration in Supabase)

## Environment Setup
1. Clone the repository.
2. Copy the `.env.local.example` file to create your local `.env.local` configuration:
   ```bash
   cp .env.local.example .env.local
   ```

3. Populate the variables in `.env.local`:
   ```env
   # Supabase
   # Get these from: https://supabase.com/dashboard → Project Settings → API
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # AI Providers
   ANTHROPIC_API_KEY=sk-ant-...
   OPENAI_API_KEY=sk-...
   ```

## Installation
Install the project dependencies using `npm`:
```bash
npm install
```

## Database Migration
Execute the local migration scripts to set up the schema and tables in your Supabase project:
```bash
npm run migrate:up
```

## Running the Development Server
Start the Next.js development server:
```bash
npm run dev
```
Navigate to `http://localhost:3000` to view the application.