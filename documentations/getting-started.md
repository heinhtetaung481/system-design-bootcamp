# Getting Started

This guide will help you set up the System Design Bootcamp project locally.

## Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com/) account
- An [OpenRouter](https://openrouter.ai) API key (used as the admin/fallback key)
- GitHub account (for OAuth configuration in Supabase)

## Environment Setup
1. Clone the repository.
2. Copy the `.env.local.example` file to create your local `.env.local` configuration:
   ```bash
   cp .env.local.example .env.local
   ```

3. Populate the variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # OpenRouter API key — get one at https://openrouter.ai
   # This is used as the admin/fallback key when users haven't set their own key.
   OPENROUTER_API_KEY=sk-or-v1-...

   # App URL (used in OpenRouter HTTP-Referer header)
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

> **BYOK (Bring Your Own Key):** Users can add their own OpenRouter API key in the **Settings** page. When set, their key is used for all AI requests instead of the admin key, enabling access to premium models.

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
