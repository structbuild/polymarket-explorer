# Polymarket Explorer

SEO-first `Next.js` application that renders Struct-backed market data on the server so the API key stays private.

## Stack

- `Next.js` App Router
- `React 19`
- `@structbuild/sdk`

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Start the app:

   ```bash
   npm run dev
   ```

If `STRUCTBUILD_API_KEY` is not configured, the app will render a setup state instead of failing at boot.

