# Resume Tailor API Backend

A Cloudflare Worker that proxies requests to Claude API, keeping your API key secure.

## Setup

### 1. Install Wrangler CLI
```bash
npm install
```

### 2. Login to Cloudflare
```bash
npm run login
```
This will open a browser window to authenticate.

### 3. Add your Claude API Key as a Secret
```bash
npx wrangler secret put CLAUDE_API_KEY
```
Paste your Claude API key when prompted.

### 4. Deploy
```bash
npm run deploy
```

You'll get a URL like: `https://resume-tailor-api.YOUR_SUBDOMAIN.workers.dev`

### 5. Update the Extension
Update the `API_BASE_URL` in `popup.js` to your worker URL.

## Local Development

```bash
npm run dev
```

This starts a local server at `http://localhost:8787`

## API Endpoints

### POST /api/generate-resume
Generates a tailored resume.

**Body:**
```json
{
  "backgroundInfo": "User's work history...",
  "jobData": {
    "title": "Job Title",
    "company": "Company Name",
    "description": "Full job description..."
  },
  "jobKeywords": ["keyword1", "keyword2"]
}
```

### POST /api/generate-cover-letter
Generates a tailored cover letter.

**Body:**
```json
{
  "backgroundInfo": "User's work history...",
  "jobData": {
    "title": "Job Title",
    "company": "Company Name",
    "description": "Full job description..."
  },
  "resume": "The generated resume text..."
}
```

### POST /api/health
Health check endpoint.

## Costs

- **Cloudflare Workers**: Free tier includes 100,000 requests/day
- **Claude API**: Pay per token used (see Anthropic pricing)
