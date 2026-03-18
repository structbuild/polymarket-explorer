import Link from "next/link";

import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import type { MarketSummary } from "@/lib/struct/types";

export function MarketCard({ market }: Readonly<{ market: MarketSummary }>) {
  return (
    <Link className="market-card" href={`/markets/${market.slug}`}>
      <div className="market-card-header">
        <span className="market-kicker">
          {market.eventTitle ?? "Polymarket market"}
        </span>
        <h3>{market.title}</h3>
        <p className="section-copy">
          {market.description ??
            "Open this market route for a server-rendered detail page and SEO metadata."}
        </p>
      </div>
      <div className="market-meta">
        <div className="metric-grid">
          <div className="metric">
            <span className="metric-label">Probability</span>
            <span className="metric-value">
              {formatPercent(market.probability)}
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Volume</span>
            <span className="metric-value">
              {formatCurrency(market.volume)}
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Closes</span>
            <span className="metric-value">{formatDate(market.endDate)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

