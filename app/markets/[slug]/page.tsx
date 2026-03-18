import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SetupState } from "@/components/setup-state";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { getSiteUrl, hasStructConfig } from "@/lib/env";
import { getMarketBySlug } from "@/lib/struct/queries";

type MarketPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const runtime = "nodejs";
export const revalidate = 300;

export async function generateMetadata({
  params,
}: MarketPageProps): Promise<Metadata> {
  const { slug } = await params;
  const market = hasStructConfig() ? await getMarketBySlug(slug) : null;

  if (!market) {
    return {
      title: "Market not found",
      description: "Struct could not find a market for the requested slug.",
    };
  }

  const description =
    market.description ??
    `Current probability ${formatPercent(
      market.probability,
    )}, volume ${formatCurrency(market.volume)}.`;

  return {
    title: market.title,
    description,
    alternates: {
      canonical: `/markets/${market.slug}`,
    },
    openGraph: {
      title: market.title,
      description,
      type: "article",
      url: new URL(`/markets/${market.slug}`, getSiteUrl()),
    },
    twitter: {
      card: "summary_large_image",
      title: market.title,
      description,
    },
  };
}

export default async function MarketPage({ params }: MarketPageProps) {
  const { slug } = await params;

  if (!hasStructConfig()) {
    return (
      <SetupState
        title="Add Struct credentials to render market pages"
        description="The route is implemented already, but it needs server-side SDK credentials before live market detail pages can render."
      />
    );
  }

  const market = await getMarketBySlug(slug);

  if (!market) {
    notFound();
  }

  return (
    <article className="market-layout">
      <header className="market-header">
        <span className="eyebrow">Market Detail</span>
        <h1>{market.title}</h1>
        <p>
          {market.description ??
            "This page is rendered on the server with data loaded via the Struct SDK."}
        </p>
        <div className="pill-row">
          <span className="pill">
            Probability {formatPercent(market.probability)}
          </span>
          <span className="pill">Volume {formatCurrency(market.volume)}</span>
          <span className="pill">Closes {formatDate(market.endDate)}</span>
        </div>
      </header>

      <div className="detail-grid">
        <section className="detail-panel">
          <h2>Market Snapshot</h2>
          <div className="metric-grid">
            <div className="metric">
              <span className="metric-label">Condition ID</span>
              <span className="metric-value mono">
                {market.conditionId ?? "Unavailable"}
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">Event</span>
              <span className="metric-value">
                {market.eventTitle ?? "Polymarket"}
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">Slug</span>
              <span className="metric-value mono">{market.slug}</span>
            </div>
          </div>
        </section>

        <section className="detail-panel">
          <h2>Outcomes</h2>
          {market.outcomes.length > 0 ? (
            <div className="outcome-grid">
              {market.outcomes.map((outcome) => (
                <div className="outcome-card" key={outcome.label}>
                  <span className="outcome-label">{outcome.label}</span>
                  <span className="outcome-value">
                    {formatPercent(outcome.probability)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>
              Outcome data was not present in the current SDK response for this
              market.
            </p>
          )}
        </section>
      </div>

      <section className="surface-panel detail-copy">
        <h2>SEO and server boundary</h2>
        <p>
          This route loads the market with `client.markets.getMarketBySlug()`
          on the server. Search engines receive rendered content and metadata,
          while the API key remains private.
        </p>
        <div className="pill-row">
          <Link className="pill" href="/">
            Back to all markets
          </Link>
        </div>
      </section>
    </article>
  );
}

