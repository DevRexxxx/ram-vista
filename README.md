<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# RAM Vista - Memory Virtualization Dashboard

A modern monitoring and control interface for RAM Vista, a system that virtualizes remote RAM as local block devices using NBD and Redis.

🚀 **Live Demo:** https://ram-vista.pages.dev

View your app in AI Studio: https://ai.studio/apps/drive/1YHuRQZjH5cPenKuTS-UAMtbKuIX8Ph4E

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

> **Note:** AI features require a Gemini API key. When running locally, you can use a local proxy or deploy to Cloudflare Pages for full functionality.

## Deploy to Cloudflare Pages

This app is designed to be deployed on Cloudflare Pages with serverless Functions for secure AI integration.

### Prerequisites

- Cloudflare account
- Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Deployment Steps

1. **Connect to GitHub:**
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Click "Create a project"
   - Connect your GitHub repository

2. **Configure Build Settings:**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`

3. **Set Environment Variable:**
   - Go to Settings → Environment variables
   - Add variable: `GEMINI_API_KEY` = `your_api_key_here`
   - Set for both Production and Preview environments

4. **Deploy:**
   - Click "Save and Deploy"
   - Your app will be live at `https://your-project.pages.dev`

### How It Works

The app uses Cloudflare Pages Functions (serverless API endpoints) to securely handle Gemini API calls:

- **Client-side:** React app makes requests to `/api/generate`
- **Server-side:** Cloudflare Function (`/functions/api/generate.ts`) calls Gemini API with the secure API key
- **Security:** API key is never exposed to the browser or client-side code

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
└────────┬────────────────┘
         │ GEMINI_API_KEY (secure)
         ▼
┌─────────────────┐
│  Gemini API     │
│  (Google)       │
└─────────────────┘
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
- **AI:** Google Gemini API

## License

MIT
