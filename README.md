<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1YHuRQZjH5cPenKuTS-UAMtbKuIX8Ph4E

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Cloudflare Pages

### Via Cloudflare Dashboard (Recommended)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages**
3. Click **"Create application"** → **"Pages"** → **"Connect to Git"**
4. Select the `RAM-Vista` repository
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Framework preset:** Vite (or None)
6. Add environment variable:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** Your Gemini API key from [Google AI Studio](https://ai.google.dev/)
7. Click **"Save and Deploy"**

Your app will be deployed to: `https://ram-vista.pages.dev`

### Via Wrangler CLI

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build the project
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=ram-vista

# Set environment variable
wrangler pages secret put GEMINI_API_KEY --project-name=ram-vista
```

### Environment Variables

Make sure to set the following environment variable in Cloudflare Pages:
- `GEMINI_API_KEY` - Your Google Gemini API key
