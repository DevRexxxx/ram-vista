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

## Deploy to Cloudflare Workers

### Prerequisites

- A Cloudflare account
- Node.js installed
- Cloudflare API credentials

### Setup Cloudflare API Credentials

1. **Create a Cloudflare API Token:**
   - Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Go to **My Profile** → **API Tokens**
   - Click **Create Token**
   - Use the **Edit Cloudflare Workers** template or create a custom token with the following permissions:
     - Account - Workers Scripts - Edit
     - Account - Workers KV Storage - Edit (optional, if using KV)
   - Copy the generated API token

2. **Get your Cloudflare Account ID:**
   - In the Cloudflare Dashboard, go to **Workers & Pages**
   - Your Account ID is displayed in the right sidebar
   - Or find it in the URL when viewing your account: `https://dash.cloudflare.com/<ACCOUNT_ID>`

3. **Set up environment variables:**

   Create a `.env` file in the project root (use `.env.example` as a template):
   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your credentials:
   ```
   CLOUDFLARE_API_TOKEN=your_actual_api_token_here
   CLOUDFLARE_ACCOUNT_ID=your_account_id_here
   ```

   **Note:** The `.env` file is gitignored and should never be committed to version control.

### Deploy Locally

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare Workers:**
   ```bash
   npx wrangler deploy
   ```

   Or use the versions upload command:
   ```bash
   npx wrangler versions upload
   ```

### Deploy from CI/CD

When deploying from a CI/CD platform (GitHub Actions, GitLab CI, etc.), set the following environment variables in your platform's secrets/variables configuration:

- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

The deployment command will automatically use these environment variables for authentication.
