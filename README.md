<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/DevRexxxx/ram-vista/blob/main/Screenshot%202026-01-05%20172016.png" />
</div>

# RAM Vista - Memory Virtualization Dashboard

A modern monitoring and control interface for RAM Vista, a system that virtualizes remote RAM as local block devices using NBD and Redis.

🚀 **Live Demo:** https://ram-vista.pages.dev

## Features

- 📊 Real-time memory monitoring dashboard
- 🤖 AI-powered artifact generation (System Architecture, Code, Pitches)
- 💬 Interactive AI assistant for technical questions
- 🎨 Dark/Light theme support
- 📱 Responsive design

## Run Locally

**Prerequisites:** Node.js 16+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

> **Note:** AI features require an API key (Groq or Gemini). When running locally, you can use a local proxy or deploy to Cloudflare Pages for full functionality.

## Deploy to Cloudflare Pages

This app is designed to be deployed on Cloudflare Pages with serverless Functions for secure AI integration.

### Prerequisites

- Cloudflare account
- **Groq API key (Recommended - FREE):** [Get from Groq Console](https://console.groq.com/keys)
- **OR Gemini API key:** [Google AI Studio](https://aistudio.google.com/app/apikey)

### Why Groq? (Recommended)

- ✅ **Completely FREE** - No credit card required
- ✅ **10x faster inference** - Optimized LPU infrastructure
- ✅ **Higher rate limits:**
  - 14,400 requests/day (vs Gemini's 1,500)
  - 30 requests/minute (vs Gemini's 15)
- ✅ **No RESOURCE_EXHAUSTED errors**
- ✅ **High-quality models** - Llama 3.1 70B, Mixtral 8x7B

### Deployment Steps

1. **Connect to GitHub:**
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Click "Create a project"
   - Connect your GitHub repository

2. **Configure Build Settings:**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`

3. **Set Environment Variables:**

   **Option 1: Use Groq (Recommended - Free & Fast)**
   - Go to Settings → Environment variables
   - Add variable: `AI_PROVIDER` = `groq`
   - Add variable: `GROQ_API_KEY` = `gsk_your_groq_api_key_here`
   - Get your free Groq API key: https://console.groq.com/keys
   - Set for both Production and Preview environments

   **Option 2: Use Gemini**
   - Go to Settings → Environment variables
   - Add variable: `AI_PROVIDER` = `gemini`
   - Add variable: `GEMINI_API_KEY` = `your_gemini_api_key_here`
   - Set for both Production and Preview environments

   **Option 3: Use Both (Groq primary with Gemini fallback)**
   - Add variable: `AI_PROVIDER` = `groq`
   - Add variable: `GROQ_API_KEY` = `gsk_your_groq_api_key`
   - Add variable: `GEMINI_API_KEY` = `your_gemini_api_key` (optional fallback)

4. **Deploy:**
   - Click "Save and Deploy"
   - Your app will be live at `https://your-project.pages.dev`

### How It Works

The app uses Cloudflare Pages Functions (serverless API endpoints) to securely handle AI API calls:

- **Client-side:** React app makes requests to `/api/generate`
- **Server-side:** Cloudflare Function (`/functions/api/generate.ts`) calls Groq or Gemini API based on `AI_PROVIDER`
- **Security:** API keys are never exposed to the browser or client-side code

## Architecture

```
┌─────────────────┐
│  React Frontend │
│   (Browser)     │
└────────┬────────┘
         │ fetch('/api/generate')
         ▼
┌─────────────────────────┐
│ Cloudflare Pages        │
│ Function: /api/generate │
│ (Server-side)           │
│ • AI_PROVIDER routing   │
└────────┬────────────────┘
         │ API_KEY (secure)
         ▼
    ┌────────┐
    │ Groq   │ (recommended - free, fast)
    │   OR   │
    │ Gemini │ (alternative)
    └────────┘
```

## Development

### Build for Production

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Charts:** Recharts
- **Icons:** Lucide React
- **Build Tool:** Vite
- **Deployment:** Cloudflare Pages
- **AI:** Groq API (recommended) or Google Gemini API
