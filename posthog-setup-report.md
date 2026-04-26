<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Polymarket Explorer. The integration includes client-side initialization via `instrumentation-client.ts` (Next.js 15.3+ pattern), a reverse proxy configured in `next.config.ts` to route events through `/ingest`, and 10 custom events across 7 files covering core user journeys: search, market navigation, content sharing, and clipboard actions. Error tracking is enabled globally via `capture_exceptions: true`.

| Event | Description | File |
|---|---|---|
| `search_opened` | User clicked the search trigger on the home page | `components/home/home-search-trigger.tsx` |
| `search_submitted` | User submitted a search query (debounced) | `components/search/search-input.tsx` |
| `trader_address_searched` | User entered a wallet address — navigated to trader profile | `components/search/search-input.tsx` |
| `market_tab_changed` | User switched between market detail tabs (Trades, Holders, Price Spikes, Holders History) | `components/market/market-tabs.tsx` |
| `market_status_tab_changed` | User switched between Open/Closed market status tabs | `components/market/market-status-tabs.tsx` |
| `link_copied` | User copied a market or page link to clipboard | `components/trader/copy-link.tsx` |
| `trader_address_copied` | User copied a trader's wallet address | `components/trader/copy-address.tsx` |
| `share_image_opened` | User opened the share image dialog (PnL card, Trader DNA, chart) | `components/ui/share-image-dialog.tsx` |
| `share_image_downloaded` | User downloaded a share image as PNG | `components/ui/share-image-dialog.tsx` |
| `share_image_copied` | User copied a share image to clipboard | `components/ui/share-image-dialog.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/398356/dashboard/1512699
- **Search Funnel: Trigger → Submission**: https://us.posthog.com/project/398356/insights/htNYsc2E
- **Daily Search Activity**: https://us.posthog.com/project/398356/insights/q5bCUkwl
- **Market Tab Navigation Breakdown**: https://us.posthog.com/project/398356/insights/E6O46tBC
- **Share Image Activity**: https://us.posthog.com/project/398356/insights/fGpL1Ke7
- **Link & Address Copy Events**: https://us.posthog.com/project/398356/insights/UVAHjfX9

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
