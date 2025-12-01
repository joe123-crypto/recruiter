# Deployment Guide

## Deploying to Vercel

This application is configured for deployment on Vercel with serverless functions.

### Prerequisites

1. **GitHub Repository**: Push your code to a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **API Keys**: Obtain the required API keys (see below)

### Required Environment Variables

Configure these in your Vercel project settings (Settings → Environment Variables):

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key for AI analysis | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID for sign-in | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |

**Optional** (if you want server-side defaults for IMAP scanning):
- `IMAP_USER` - Default email for scanning
- `IMAP_PASSWORD` - Default app password
- `IMAP_HOST` - Default IMAP host (e.g., `imap.gmail.com`)

### Deployment Steps

1. **Connect Repository**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will auto-detect the Vite framework

2. **Configure Environment Variables**
   - Add all required variables listed above
   - Click "Deploy"

3. **Verify Deployment**
   - Once deployed, test the `/api/scan` endpoint
   - Test Google Sign-In flow
   - Test email scanning functionality

### Local Development

For local development, you need to run **both** servers:

```bash
# Terminal 1: Frontend (Vite)
npm run dev

# Terminal 2: Backend (Express)
npm run server
```

The Vite dev server proxies `/api` requests to `localhost:3001` where the Express server is running.

### Architecture

- **Frontend**: Vite → Static files served by Vercel CDN
- **Backend**: Serverless functions in `/api` directory
- **Database**: Client-side localStorage (no external DB needed)

### Troubleshooting

**API endpoints returning 404:**
- Ensure `api/scan.js` exists in your repository
- Check that `vercel.json` is committed
- Verify environment variables are set in Vercel

**Google Sign-In not working:**
- Add your Vercel domain to authorized origins in Google Cloud Console
- Update `VITE_GOOGLE_CLIENT_ID` in Vercel environment variables

**Email scanning fails:**
- Verify `VITE_GEMINI_API_KEY` is valid
- Check IMAP credentials are correct
- Ensure you're using an App Password, not your regular email password
