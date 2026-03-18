import type { Metadata } from "next";

import { MarketCard } from "@/components/market-card";
import { SetupState } from "@/components/setup-state";
import { hasStructConfig } from "@/lib/env";
import { getFeaturedMarkets } from "@/lib/struct/queries";

export const runtime = "nodejs";
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Markets",
  description:
    "Browse SEO-rendered Polymarket markets powered by server-side Struct SDK requests.",
};

const featureItems = [
  {
    title: "Server-side data access",
    description:
      "Every Struct SDK call stays inside Next server components, so the API key never ships to the browser.",
  },
  {
    title: "Crawler-friendly HTML",
    description:
      "Primary routes render meaningful content on the server for fast indexing and stable social previews.",
  },
  {
    title: "Selective hydration",
    description:
      "The app starts as HTML-first and only adds client code when an interaction actually needs it.",
  },
];

export default async function HomePage() {
  const configured = hasStructConfig();
  const markets = configured ? await getFeaturedMarkets() : [];

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Server Rendered with Struct</span>
          <h1>Polymarket pages that keep the secret on the server.</h1>
          <p>
            This starter uses Next.js App Router with `@structbuild/sdk`
            initialized on the server only. The result is indexable HTML, clean
            metadata, and a hidden API key.
          </p>
          <div className="pill-row">
            <span className="pill">SSR for public pages</span>
            <span className="pill">SDK boundary in server modules</span>
            <span className="pill">Metadata, robots, and sitemap included</span>
          </div>
        </div>
        <aside className="feature-panel">
          <div className="feature-item">
            <span className="eyebrow">Architecture</span>
            <h2>Built for discovery, not browser-side secret leakage.</h2>
          </div>
          <div className="feature-list">
            {featureItems.map((item) => (
              <div className="feature-item" key={item.title}>
                <strong>{item.title}</strong>
                <span className="section-copy">{item.description}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="surface-panel">
        <div className="section-header">
          <div>
            <h2>Featured Markets</h2>
            <p>
              The home page fetches market data in a server component and emits
              ready-to-index HTML.
            </p>
          </div>
        </div>
      </section>

      {!configured ? (
        <SetupState
          title="Configure Struct to unlock live market data"
          description="The app is wired for the SDK already. Add the environment values below and the homepage will start rendering live Polymarket markets."
        />
      ) : markets.length === 0 ? (
        <section className="status-card">
          <h2>No markets returned</h2>
          <p className="status-copy">
            Struct is configured, but the featured markets request returned no
            data. Check the API key, venue access, or upstream availability.
          </p>
        </section>
      ) : (
        <section className="market-grid" aria-label="Featured markets">
          {markets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </section>
      )}
    </>
  );
}

