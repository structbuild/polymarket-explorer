# Polymarket Explorer

A real-time analytics platform for [Polymarket](https://polymarket.com), built with [Next.js](https://nextjs.org) and powered by the [Struct](https://struct.to) API. Explore traders, markets, events, tags, and builders — with full PnL histories, positions, activity feeds, leaderboards, and a global analytics dashboard, all server-rendered.

This project demonstrates what can be built on top of the **Struct SDK** to create a rich, fully server-rendered analytics experience over Polymarket data.

## Features

### Traders
- **Trader Profiles** - Full breakdown of any trader's PnL, positions, and activity by name or wallet address
- **PnL Charts** - Interactive PnL area charts with best/worst day annotations and multiple timeframes
- **PnL Calendar** - Daily heatmap calendar showing profit and loss distribution over time
- **Trader DNA** - Seven-axis radar profile and archetype derived from lifetime trading stats
- **Performance Summary** - Win rate, average hold time, best trade, streaks, and realized PnL
- **Positions & Activity** - Active and closed positions plus paginated trade history with Polygonscan links
- **Traders Leaderboard** - Top traders ranked by PnL across selectable timeframes

### Markets & Events
- **Markets Explorer** - Browse markets with probability and volume charts, holders, top traders, trades, and related markets
- **Events** - Parent event pages that aggregate their child markets, with overview charts and per-market breakdowns
- **Tags / Categories** - Browse markets by category with per-tag stats and top traders

### Builders & Analytics
- **Builders** - Per-builder profiles with fee history, retention heatmaps, concentration, and tag breakdowns
- **Builder Comparison** - Side-by-side comparison of builders across volume, fees, and activity
- **Global Analytics** - Platform-wide dashboard for daily volume, trade counts, fees, unique traders, and yes/no flow
- **Rewards** - Rewards and incentive tracking

### Platform
- **Command Palette** - Cmd+K quick search across traders, markets, and events
- **Share as Image** - Export PnL and analytics charts as high-DPI PNG images via native share or download
- **Authentication** - Email one-time-passcode sign-in via [better-auth](https://better-auth.com), with Cloudflare Turnstile and Vercel BotID protection
- **SEO Optimized** - Server-side rendered with dynamic metadata, Open Graph images, JSON-LD, breadcrumbs, sitemap, and robots.txt
- **PWA Ready** - Web app manifest with standalone display mode
- **Product Analytics** - PostHog (reverse-proxied) and Vercel Analytics
- **Changelog** - In-app changelog with recent-update notifications

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | [TypeScript 5.9](https://www.typescriptlang.org) |
| UI | [React 19](https://react.dev) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Components | [shadcn/ui](https://ui.shadcn.com) (base-nova) on [Base UI](https://base-ui.com) |
| Data | [Struct SDK](https://struct.to) (`@structbuild/sdk`) |
| Charts | [Recharts](https://recharts.org) + [Lightweight Charts](https://tradingview.github.io/lightweight-charts/) |
| Tables | [TanStack Table](https://tanstack.com/table) |
| URL State | [nuqs](https://nuqs.47ng.com) |
| Command Palette | [cmdk](https://cmdk.paco.me) |
| Auth | [better-auth](https://better-auth.com) (email OTP) |
| Bot Protection | [Vercel BotID](https://vercel.com/docs/botid) + [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) |
| Analytics | [PostHog](https://posthog.com) + [Vercel Analytics](https://vercel.com/analytics) |
| 3D Effects | [React Three Fiber](https://r3f.docs.pmnd.rs) |
| Image Export | [html-to-image](https://github.com/nicknisi/html-to-image) |
| Icons | [Lucide](https://lucide.dev) |
| Fonts | [Geist](https://vercel.com/font) |

## Architecture

```
Browser  -->  Next.js Server  -->  Struct SDK  -->  Polymarket data
```

All data fetching happens server-side through the Struct SDK — the Struct API key never reaches the client. React's `cache()` deduplicates requests within a render pass. Optionally, Next.js **Cache Components** (`use cache` / `cacheLife` / `cacheTag`) can be enabled with the `ENABLE_COMPONENT_CACHE` flag for cross-request caching.

**Pages:**
- `/` - Home with activity feeds, trending markets, top traders, and an explore grid
- `/traders` - Traders leaderboard
- `/traders/[address]` - Full trader profile (PnL, DNA, positions, activity)
- `/markets` - Markets index
- `/markets/[slug]` - Market detail (charts, holders, trades, related markets)
- `/events` - Events index
- `/events/[slug]` - Event detail with child markets
- `/tags` - Tag / category index (paginated at `/tags/page/[page]`)
- `/tags/[slug]` - Tag detail with top traders
- `/builders` - Builders index
- `/builders/[code]` - Builder profile
- `/builders/compare` - Builder comparison
- `/analytics` - Global platform analytics
- `/rewards` - Rewards tracking
- `/login`, `/account` - Authentication and account

Legacy routes (`/leaderboard`, `/trader/[address]`, `/market/[slug]`) permanently redirect to their current equivalents.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 20+
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

### Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Production build |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm test:pnl` | Run the PnL calculation tests |

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `STRUCTBUILD_API_KEY` | Yes | - | Struct SDK API key for fetching Polymarket data |
| `STRUCTBUILD_TIMEOUT_MS` | No | `10000` | API request timeout in milliseconds |
| `NEXT_PUBLIC_STRUCTBUILD_API_URL` | No | `https://api.struct.to/v1` | Struct API base URL |
| `NEXT_PUBLIC_SITE_URL` | No | `http://localhost:3000` | Public URL used for metadata and sitemap generation |
| `NEXT_PUBLIC_AUTH_URL` | No | `https://struct.to` | better-auth base URL (restricted to `struct.to` / localhost) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | No | - | Cloudflare Turnstile site key for sign-in |
| `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` | No | - | PostHog project token for product analytics |
| `ENABLE_COMPONENT_CACHE` | No | `false` | Enables Next.js Cache Components when set to `true`, `1`, `yes`, or `on` |

## Project Structure

```
app/
  layout.tsx              Root layout with theme provider and fonts
  page.tsx                Home with activity feeds and explore grid
  actions.ts              Server actions
  manifest.ts             PWA web app manifest
  sitemap.xml/            Sitemap index + paginated segments
  robots.ts               robots.txt
  traders/                Traders leaderboard and profile pages
  markets/                Markets index and detail pages
  events/                 Events index and detail pages
  tags/                   Tag / category index and detail pages
  builders/               Builders index, detail, and comparison pages
  analytics/              Global analytics dashboard
  rewards/                Rewards page
  login/ account/         Authentication and account pages

components/
  trader/                 Profile header, PnL, DNA radar, positions, activity
  market/                 Market detail, charts, holders, trades, tables
  event/                  Event header, child-market tables, overview charts
  tags/                   Tag grid, stats, top traders, tables
  builders/               Builder detail, comparison, global stats, tables
  analytics/              KPI strip, volume/trade charts, shareable cards, toggles
  home/                   Activity feeds, trending markets, explore grid
  auth/                   Sign-in dialog/form, auth gate, user menu
  search/                 Cmd+K command palette
  seo/                    Breadcrumbs, JSON-LD, pagination, error/not-found states
  layout/                 Header, footer, mobile nav, changelog, notifications
  ui/                     shadcn primitives (button, card, dialog, table, chart, etc.)

lib/
  struct/                 Struct SDK client, queries, and data projections
    client.ts             Struct SDK singleton with retry config
    queries/              Per-entity query modules (markets, events, builders, ...)
    analytics-*.ts        Analytics queries and projections
    pnl*.ts               PnL calculations, ranges, and timeframes
    types.ts              Shared TypeScript interfaces
  auth/ auth-client.ts    better-auth session helpers and client
  *-search-params*.ts     nuqs URL search-param parsers per entity
  polymarket/             Trader archetype / DNA logic
  hooks/                  Client hooks (localStorage, timezone, share mode, ...)
  utils.ts format.ts      Formatting, address truncation, class merging
  env.ts                  Environment variable helpers
  share-image.ts          DOM-to-PNG export logic
  site-metadata.ts        Metadata and Open Graph helpers
  changelog.ts            In-app changelog entries
```

## Data Source

### Struct SDK

The [Struct SDK](https://struct.to) (`@structbuild/sdk`) is the app's sole data layer, providing:

- Trader search, profiles, and lifetime PnL metrics
- Positions (open and closed, with market metadata) and trade history
- Market data (conditions, outcomes, prices, holders, images)
- Events and their child markets
- Tags / categories and category-level leaderboards
- Builder profiles, fees, and comparison data
- Global platform analytics (volume, trades, fees, unique traders)

Transaction links resolve to [Polygonscan](https://polygonscan.com), and markets/events link back to [Polymarket](https://polymarket.com).

## Deployment

This is a standard Next.js application deployable to any Node.js-compatible platform (Vercel, Netlify, Railway, etc.). Security headers (HSTS, CSP, `X-Frame-Options`, and others) are configured in `next.config.ts`.

## License

MIT
