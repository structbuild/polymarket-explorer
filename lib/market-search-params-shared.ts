import { METRICS_TIMEFRAMES, type MetricsTimeframeChoice } from "./timeframes";

export const marketSortByValues = [
	"volume",
	"txns",
	"unique_traders",
	"liquidity",
	"holders",
	"end_time",
] as const;

export type MarketSortBy = (typeof marketSortByValues)[number];

export const marketSortDirectionValues = ["asc", "desc"] as const;
export type MarketSortDirection = (typeof marketSortDirectionValues)[number];

export const marketTimeframeValues = METRICS_TIMEFRAMES;
export type MarketTimeframe = MetricsTimeframeChoice;

export const defaultMarketSortBy: MarketSortBy = "volume";
export const defaultMarketSortDirection: MarketSortDirection = "desc";
export const defaultMarketTimeframe: MarketTimeframe = "24h";
