# Polymarket Explorer

A real-time analytics dashboard for [Polymarket](https://polymarket.com) traders, built with [Next.js](https://nextjs.org) and powered by the [Struct](https://struct.to) API. Search any trader by name or wallet address and get a full breakdown of their PnL history, positions, activity, and performance metrics.

This project demonstrates what can be built by combining the **Struct SDK** with **Polymarket's public APIs** to create a rich, server-rendered analytics experience.

## Features

- **Trader Search** - Find any Polymarket trader by name or wallet address with Cmd+K quick search
- **PnL Charts** - Interactive hourly PnL area charts with best/worst day annotations
- **PnL Calendar** - Daily heatmap calendar showing profit and loss distribution over time
- **Performance Summary** - Key metrics including win rate, average hold time, best trade, streaks, and realized PnL
- **Positions Table** - Browse active and closed positions with entry prices, current values, and unrealized PnL
- **Activity Feed** - Paginated trade history with timestamps, outcomes, share amounts, and Polygonscan links
- **Weekly Leaderboard** - Top traders ranked by weekly PnL on the homepage
- **Share as Image** - Export PnL charts as high-DPI PNG images via native share or download
- **SEO Optimized** - Server-side rendered with dynamic metadata, Open Graph cards, sitemap, and robots.txt
- **PWA Ready** - Web app manifest with standalone display mode

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | [TypeScript 5.9](https://www.typescriptlang.org) |
| UI | [React 19](https://react.dev) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Components | [shadcn/ui](https://ui.shadcn.com) (base-nova) |
| Data | [Struct SDK](https://struct.to) (`@structbuild/sdk`) |
| Charts | [Recharts](https://recharts.org) |
| Tables | [TanStack Table](https://tanstack.com/table) |
| 3D Effects | [React Three Fiber](https://r3f.docs.pmnd.rs) |
| Image Export | [html-to-image](https://github.com/nicknisi/html-to-image) |
| Icons | [Lucide](https://lucide.dev) |
| Fonts | [Geist](https://vercel.com/font) |

## Architecture

```
Browser  -->  Next.js Server  -->  Struct SDK  -->  Polymarket data
                    |
                    +--> Polymarket public APIs (leaderboard, PnL)
```

All data fetching happens server-side. The Struct API key never reaches the client. React's `cache()` deduplicates requests within the same render pass, and `next.revalidate` provides 5-minute ISR caching for market data.

**Pages:**
- `/` - Homepage with trader search and weekly leaderboard
- `/trader/[address]` - Full trader profile with charts, positions, and activity

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [pnpm](https://pnpm.io) 10+
- A [Struct](https://struct.to) API key

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/polymarket/polymarket-explorer.git
   cd polymarket-explorer
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Configure environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your Struct API key:

   ```env
   STRUCTBUILD_API_KEY=your-api-key
   ```

4. Start the development server:

   ```bash
   pnpm dev
   ```

   The app will be available at [http://localhost:3000](http://localhost:3000).

> If `STRUCTBUILD_API_KEY` is not set, the app renders a setup state instead of failing.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `STRUCTBUILD_API_KEY` | Yes | - | Struct SDK API key for fetching Polymarket data |
| `STRUCTBUILD_TIMEOUT_MS` | No | `10000` | API request timeout in milliseconds |
| `NEXT_PUBLIC_SITE_URL` | No | `http://localhost:3000` | Public URL used for metadata and sitemap generation |

## Project Structure

```
app/
  layout.tsx              Root layout with theme provider and fonts
  page.tsx                Homepage with search and leaderboard
  actions.ts              Server actions (trader search)
  sitemap.ts              Dynamic XML sitemap
  trader/[address]/
    page.tsx              Trader profile page

components/
  search/                 Search dialog and input components
  trader/                 Profile header, charts, tables, and performance panels
  background/             3D beam animation background
  layout/                 Header and footer
  ui/                     shadcn primitives (button, card, dialog, table, etc.)

lib/
  struct/
    client.ts             Struct SDK singleton with retry config
    queries.ts            Cached server-side query functions
    types.ts              TypeScript interfaces
  polymarket/
    leaderboard.ts        Weekly leaderboard from Polymarket data API
    pnl.ts                PnL calculations, streaks, and chart data
  hooks/
    use-local-storage.ts  Cross-tab synced localStorage hook
  utils.ts                Number formatting, address truncation, etc.
  env.ts                  Environment variable helpers
  share-image.ts          DOM-to-PNG export logic
```

## Data Sources

### Struct SDK

The [Struct SDK](https://struct.to) (`@structbuild/sdk`) provides the primary data layer:

- Trader search (full-text)
- Trader profiles (name, pseudonym, avatar)
- PnL summaries (lifetime metrics)
- Positions (open and closed, with market metadata)
- Trade history (individual buys, sells, redemptions)
- Market data (conditions, outcomes, images)

### Polymarket Public APIs

Supplementary data fetched directly from Polymarket:

- **Leaderboard** (`data-api.polymarket.com/v1/leaderboard`) - Weekly top traders by PnL
- **User PnL** (`user-pnl-api.polymarket.com/user-pnl`) - Hourly and daily PnL candles for chart rendering

## Deployment

This is a standard Next.js application deployable to any Node.js-compatible platform (Vercel, Netlify, Railway, etc.).

## License

MIT
